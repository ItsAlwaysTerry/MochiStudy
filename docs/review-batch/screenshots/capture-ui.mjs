import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../..");
const outputName = process.argv[2] || process.env.UI_CAPTURE_DIR || "ui-phase-0";
const outputDir = path.resolve(__dirname, outputName);
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = Number(process.env.CDP_PORT || (9223 + Math.floor(Math.random() * 600)));
const indexUrl = pathToFileURL(path.join(rootDir, "index.html")).href;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function encodeFrame(payload, opcode = 1) {
  const data = Buffer.from(payload);
  let headerLength = 2;
  if (data.length >= 126 && data.length < 65536) headerLength = 4;
  else if (data.length >= 65536) headerLength = 10;
  const frame = Buffer.alloc(headerLength + 4 + data.length);
  frame[0] = 0x80 | opcode;
  if (data.length < 126) {
    frame[1] = 0x80 | data.length;
  } else if (data.length < 65536) {
    frame[1] = 0x80 | 126;
    frame.writeUInt16BE(data.length, 2);
  } else {
    frame[1] = 0x80 | 127;
    frame.writeBigUInt64BE(BigInt(data.length), 2);
  }
  const maskOffset = headerLength;
  const mask = crypto.randomBytes(4);
  mask.copy(frame, maskOffset);
  for (let index = 0; index < data.length; index += 1) {
    frame[maskOffset + 4 + index] = data[index] ^ mask[index % 4];
  }
  return frame;
}

class DevToolsSocket {
  constructor(wsUrl) {
    const url = new URL(wsUrl);
    this.host = url.hostname;
    this.port = Number(url.port || 80);
    this.path = `${url.pathname}${url.search}`;
    this.socket = null;
    this.buffer = Buffer.alloc(0);
    this.handshakeDone = false;
    this.nextId = 1;
    this.pending = new Map();
    this.eventWaiters = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      const key = crypto.randomBytes(16).toString("base64");
      const request = [
        `GET ${this.path} HTTP/1.1`,
        `Host: ${this.host}:${this.port}`,
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Key: ${key}`,
        "Sec-WebSocket-Version: 13",
        "",
        "",
      ].join("\r\n");
      this.socket = net.createConnection({ host: this.host, port: this.port }, () => {
        this.socket.write(request);
      });
      this.socket.on("data", (chunk) => this.onData(chunk, resolve));
      this.socket.on("error", reject);
      this.socket.on("close", () => {
        for (const { reject: rejectPending } of this.pending.values()) rejectPending(new Error("CDP socket closed"));
        this.pending.clear();
      });
    });
  }

  onData(chunk, resolveHandshake) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    if (!this.handshakeDone) {
      const marker = this.buffer.indexOf("\r\n\r\n");
      if (marker === -1) return;
      const head = this.buffer.slice(0, marker).toString("utf8");
      if (!head.includes("101")) throw new Error(`WebSocket handshake failed: ${head}`);
      this.buffer = this.buffer.slice(marker + 4);
      this.handshakeDone = true;
      resolveHandshake();
    }
    this.readFrames();
  }

  readFrames() {
    while (this.buffer.length >= 2) {
      const b0 = this.buffer[0];
      const b1 = this.buffer[1];
      const opcode = b0 & 0x0f;
      let offset = 2;
      let length = b1 & 0x7f;
      if (length === 126) {
        if (this.buffer.length < offset + 2) return;
        length = this.buffer.readUInt16BE(offset);
        offset += 2;
      } else if (length === 127) {
        if (this.buffer.length < offset + 8) return;
        length = Number(this.buffer.readBigUInt64BE(offset));
        offset += 8;
      }
      const masked = Boolean(b1 & 0x80);
      const maskOffset = offset;
      if (masked) offset += 4;
      if (this.buffer.length < offset + length) return;
      let payload = this.buffer.slice(offset, offset + length);
      if (masked) {
        const mask = this.buffer.slice(maskOffset, maskOffset + 4);
        payload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
      }
      this.buffer = this.buffer.slice(offset + length);
      if (opcode === 1) this.handleMessage(payload.toString("utf8"));
      else if (opcode === 8) this.socket.end();
      else if (opcode === 9) this.socket.write(encodeFrame(payload, 10));
    }
  }

  handleMessage(text) {
    const message = JSON.parse(text);
    if (message.id && this.pending.has(message.id)) {
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
      else pending.resolve(message.result);
      return;
    }
    if (message.method && this.eventWaiters.has(message.method)) {
      const waiters = this.eventWaiters.get(message.method);
      this.eventWaiters.delete(message.method);
      waiters.forEach((resolve) => resolve(message.params || {}));
    }
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    const payload = JSON.stringify({ id, method, params });
    this.socket.write(encodeFrame(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  waitEvent(method, timeout = 5000) {
    return new Promise((resolve) => {
      const waiters = this.eventWaiters.get(method) || [];
      waiters.push(resolve);
      this.eventWaiters.set(method, waiters);
      setTimeout(() => resolve(null), timeout);
    });
  }

  close() {
    this.socket?.end();
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function waitForChrome() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      return await fetchJson(`http://127.0.0.1:${port}/json/version`);
    } catch {
      await sleep(150);
    }
  }
  throw new Error("Chrome remote debugging endpoint did not start");
}

function startChrome() {
  const profileDir = path.join(rootDir, ".tmp", "chrome-ui-capture");
  fs.rmSync(profileDir, { recursive: true, force: true });
  fs.mkdirSync(profileDir, { recursive: true });
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--allow-file-access-from-files",
    "--window-size=1440,1100",
    "about:blank",
  ];
  return spawn(chromePath, args, { stdio: "ignore" });
}

function daysAgo(iso, count) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() - count);
  return date.toISOString().slice(0, 10);
}

function seedSource() {
  const records = [
    ["math", "函数", 2, "分段条件一多就忘记先看定义域。", "已知分段函数求 f(f(2))。", "先圈定义域；代入内层；再代外层。", 0],
    ["math", "数列", 1, "看到递推式不会先写前 3 项找规律。", "a1=1, a(n+1)=2an+1，求通项。", "写前三项；猜等比改造；代回验证。", 1],
    ["math", "三角函数", 3, "诱导公式会用了，符号还要慢一点。", "化简 sin(pi-x)+cos(pi/2+x)。", "定象限；看奇偶；最后合并同类。", 2],
    ["physics", "动力学", 2, "受力图漏掉摩擦方向。", "斜面上物块匀速下滑，求摩擦力。", "先定研究对象；画重力支持力摩擦；沿斜面列式。", 0],
    ["physics", "能量守恒", 1, "不知道什么时候用动能定理替代牛二。", "小球从高度 h 滑下，求底端速度。", "只问速度先看能量；列始末状态；消去中间过程。", 3],
    ["physics", "电场", 3, "电场力方向已能和电荷正负分开判断。", "负电荷在匀强电场中受力方向。", "先看场强方向；正同负反；再谈运动。", 4],
    ["chemistry", "氧化还原反应", 2, "配平时电子转移数容易漏乘系数。", "酸性条件下 MnO4- 与 Fe2+ 反应。", "标价态；算升降；最小公倍数配电子。", 0],
    ["chemistry", "化学平衡", 1, "压强变化时没先看气体系数。", "合成氨平衡加压移动方向。", "数气体系数；判断体积方向；再说转化率。", 5],
  ];
  const payload = {
    records,
    todayFocus: [
      { id: "focus_demo_1", startTime: "09:10", endTime: "09:35", duration: 25, type: "focus", completed: true, microGoal: "函数错题复盘" },
      { id: "focus_demo_2", startTime: "15:00", endTime: "15:20", duration: 20, type: "focus", completed: true, microGoal: "电场方向判断" },
    ],
  };
  return `
(() => {
  try {
    const payload = ${JSON.stringify(payload)};
    const today = new Date().toISOString().slice(0, 10);
    const daysAgo = (count) => {
      const date = new Date(today + "T12:00:00");
      date.setDate(date.getDate() - count);
      return date.toISOString().slice(0, 10);
    };
    const put = (key, value) => localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    localStorage.clear();
    put("study_log", payload.records.map(([subject, nodeLabel, stars, painPoint, originalQuestion, routine, dayOffset], index) => ({
      id: "demo_" + index,
      subject, nodeLabel, questionsCompleted: 1, stars, painPoint, originalQuestion, routine,
      date: daysAgo(dayOffset)
    })));
    put("focus_log", payload.todayFocus.map((item, index) => ({
      ...item,
      date: index === 0 ? today : daysAgo(1),
      endedAt: new Date().toISOString()
    })));
    put("school_holidays", [{ id: "ui-demo", label: "UI Demo", start: daysAgo(30), end: daysAgo(-30) }]);
    put("farm_state", {
      xp: 120,
      totalHarvests: 5,
      plots: {
        math: { recordCount: 9, harvestCount: 2, activeSkin: "math_default" },
        physics: { recordCount: 14, harvestCount: 2, activeSkin: "physics_default" },
        chemistry: { recordCount: 4, harvestCount: 1, activeSkin: "chem_default" }
      }
    });
    put("achievement_config", {
      small: { focusHours: 1, studyDays: 1, recordCount: 2, balancedWeeks: 1, harvests: 1 },
      big: { nodeRecords: 2, totalRecords: 4, focusHours: 1, farmLevelStep: 1, studyDays: 2 },
      lottery: { smallPerDraw: 1, bigPerDraw: 1, pityThreshold: 5 }
    });
    put("achievement_state", {
      small: { focusHours: 1, studyDays: 3, recordCount: 4, balancedWeeks: 1, harvests: 2 },
      big: { totalRecords: 2, focusHours: 1, farmLevel: 1, studyDays: 1, nodeRecords: 1 },
      totalSmall: 7,
      totalBig: 3,
      lotteryTickets: 10,
      usedLotteryCount: 0,
      carriedLotteryDraws: 4,
      pityCurrent: 3,
      recentNew: { small: {}, big: {} }
    });
    put("lottery_history", [
      { ts: Date.now() - 3600000, label: "零花钱 ¥20", type: "reward", date: today },
      { ts: Date.now() - 7200000, label: "晚睡 / 多玩手机 30 分钟", type: "reward", date: daysAgo(1) }
    ]);
    put("summer_reward", {
      collapsed: true,
      paidTodayDate: today,
      paidToday: 20,
      weekKey: today,
      weekPaid: 60,
      dailySmallDate: today,
      dailySmallPaid: 20,
      qualDays: [daysAgo(4), daysAgo(3), daysAgo(2), daysAgo(1), today],
      stages: 1,
      streak: 5,
      lastQualDate: today,
      dailyTickets: 2,
      stageTickets: 1,
      history: [{ kind: "daily", drawn: 20, paid: 20, date: today, ts: Date.now() - 900000 }],
      lastPrize: { kind: "daily", drawn: 20, paid: 20, date: today, ts: Date.now() - 900000 },
      draw: null
    });
    put("current_season", { id: "ui-demo-season", name: "暑假 UI Demo", startDate: daysAgo(10), endDate: daysAgo(-18), status: "active" });
    put("commitment_history", [
      { id: "c1", date: today, goal: "函数错题复盘", plannedMins: 25, actualMins: 25, outcome: "done", ts: Date.now() - 3600000 },
      { id: "c2", date: daysAgo(1), goal: "电场方向判断", plannedMins: 20, actualMins: 20, outcome: "partial", ts: Date.now() - 86400000 }
    ]);
    put("sidebar_expanded", "0");
    put("sound_reminder_enabled", "0");
    put("focus_end_sound", "off");
  } catch (error) {
    console.error("UI capture seed failed", error);
  }
})();`;
}

async function createPage() {
  await fetchJson(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).catch(() => null);
  const pages = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const page = pages.find((item) => item.type === "page") || pages[0];
  const cdp = new DevToolsSocket(page.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: seedSource() });
  return cdp;
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(`Runtime.evaluate failed: ${JSON.stringify(result.exceptionDetails)}`);
  }
  return result.result?.value;
}

async function navigate(cdp, url = indexUrl) {
  const loaded = cdp.waitEvent("Page.loadEventFired", 8000);
  await cdp.send("Page.navigate", { url });
  await loaded;
  await sleep(900);
}

async function setViewport(cdp, width, height, mobile = false) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: mobile ? 2 : 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
  await sleep(200);
}

async function route(cdp, routeName) {
  await evaluate(cdp, `
    (() => {
      const next = "#${routeName}";
      if (location.hash === next) {
        const btn = document.querySelector('[data-route="${routeName}"]');
        if (btn) btn.click();
      } else {
        location.hash = next;
      }
    })()
  `);
  await sleep(700);
}

async function scrollTo(cdp, y) {
  await evaluate(cdp, `window.scrollTo(0, ${Math.max(0, y)});`);
  await sleep(250);
}

async function waitForFonts(cdp) {
  await evaluate(cdp, `document.fonts ? document.fonts.ready.then(() => true).catch(() => false) : true`);
  await sleep(150);
}

async function screenshot(cdp, name, clipSelector = "") {
  await waitForFonts(cdp);
  let params = { format: "png", fromSurface: true, captureBeyondViewport: false };
  if (clipSelector) {
    const rect = await evaluate(cdp, `
      (() => {
        const el = document.querySelector(${JSON.stringify(clipSelector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: Math.ceil(r.width + 16), height: Math.ceil(r.height + 16) };
      })()
    `);
    if (rect && rect.width > 0 && rect.height > 0) {
      params = { ...params, clip: { ...rect, scale: 1 } };
    }
  }
  const result = await cdp.send("Page.captureScreenshot", params);
  fs.writeFileSync(path.join(outputDir, name), Buffer.from(result.data, "base64"));
  console.log(`captured ${name}`);
}

async function captureAll(cdp) {
  await setViewport(cdp, 1440, 1000);
  await navigate(cdp);
  await route(cdp, "home");
  await scrollTo(cdp, 0);
  await screenshot(cdp, "01-home-desktop-top.png");
  await scrollTo(cdp, 760);
  await screenshot(cdp, "01-home-desktop-bottom.png");

  await route(cdp, "review");
  await scrollTo(cdp, 0);
  await screenshot(cdp, "02-learn-review-desktop.png");

  await route(cdp, "map");
  await evaluate(cdp, `document.querySelector('[data-card-node]')?.click();`);
  await sleep(400);
  await evaluate(cdp, `document.querySelector('.study-card .card-front')?.click();`);
  await sleep(400);
  await screenshot(cdp, "03-learn-archive-expanded-desktop.png");

  await route(cdp, "today");
  await screenshot(cdp, "04-learn-today-desktop.png");

  await route(cdp, "achievements");
  await screenshot(cdp, "05-achievements-desktop.png");

  await route(cdp, "settings");
  await scrollTo(cdp, 0);
  await screenshot(cdp, "06-settings-desktop-collapsed.png");
  await evaluate(cdp, `document.querySelector('[data-action="open-settings-group"][data-settings-group="ai"]')?.click();`);
  await sleep(350);
  await screenshot(cdp, "06-settings-desktop-ai-open.png");

  await navigate(cdp);
  await route(cdp, "home");
  await evaluate(cdp, `document.querySelector('details.home-focus-details')?.setAttribute('open', ''); document.querySelector('[data-action="open-commitment"]')?.click();`);
  await sleep(500);
  await screenshot(cdp, "07-focus-commitment-modal-desktop.png");

  await evaluate(cdp, `
    (() => {
      const input = document.querySelector('#commitment-goal');
      if (input) {
        input.value = '函数错题复盘';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      document.querySelector('#commitment-start')?.click();
    })()
  `);
  await sleep(700);
  await screenshot(cdp, "08-focus-overlay-running-desktop.png");
  await evaluate(cdp, `window.MochiTimer?.stopAndRest?.();`);
  await sleep(500);
  await screenshot(cdp, "09-focus-deciding-desktop.png");

  await navigate(cdp);
  await route(cdp, "home");
  await sleep(500);
  await screenshot(cdp, "10-today-energy-float-crop.png", "[data-summer-reward]");
  await screenshot(cdp, "15-energy-float-collapsed.png", "[data-summer-reward]");
  await evaluate(cdp, `
    (() => {
      const reward = JSON.parse(localStorage.getItem("summer_reward") || "{}");
      reward.collapsed = false;
      localStorage.setItem("summer_reward", JSON.stringify(reward));
      window.MochiFarm?.renderFarm?.(document.getElementById("view"));
    })()
  `);
  await sleep(400);
  await screenshot(cdp, "16-energy-float-expanded.png", "[data-summer-reward]");

  await route(cdp, "achievements");
  await evaluate(cdp, `document.querySelector('[data-action="open-lottery"]')?.click();`);
  await sleep(700);
  await screenshot(cdp, "11-lottery-overlay-desktop.png");

  await navigate(cdp);
  await route(cdp, "settings");
  await evaluate(cdp, `window.MochiApp?.toast?.("Prompt 已复制，粘贴到 Claude 项目说明里即可");`);
  await sleep(220);
  await screenshot(cdp, "17-toast-top-center.png");

  await setViewport(cdp, 390, 844, true);
  await navigate(cdp);
  await route(cdp, "home");
  await sleep(400);
  await screenshot(cdp, "12-home-mobile.png");
  await evaluate(cdp, `window.scrollTo(0, document.body.scrollHeight);`);
  await sleep(350);
  await screenshot(cdp, "19-home-scrolled-bottom-mobile.png");

  await route(cdp, "review");
  await screenshot(cdp, "13-learn-review-mobile.png");

  await route(cdp, "achievements");
  await screenshot(cdp, "14-achievements-mobile.png");
  await screenshot(cdp, "18-mobile-nav-active.png", ".bottom-nav");
}

function createContactSheet() {
  const files = fs.readdirSync(outputDir).filter((file) => file.endsWith(".png")).sort();
  const py = `
import sys
from pathlib import Path
from PIL import Image, ImageDraw

out_dir = Path(sys.argv[1])
files = sys.argv[2:]
thumb_w, thumb_h = 360, 230
label_h, pad, cols = 26, 18, 4
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * thumb_w + (cols + 1) * pad, rows * (thumb_h + label_h) + (rows + 1) * pad), "#fdf9f2")
draw = ImageDraw.Draw(sheet)
for idx, name in enumerate(files):
    img = Image.open(out_dir / name).convert("RGB")
    img.thumbnail((thumb_w, thumb_h), Image.LANCZOS)
    col, row = idx % cols, idx // cols
    x = pad + col * (thumb_w + pad)
    y = pad + row * (thumb_h + label_h + pad)
    frame = Image.new("RGB", (thumb_w, thumb_h), "#ffffff")
    frame.paste(img, ((thumb_w - img.width) // 2, (thumb_h - img.height) // 2))
    sheet.paste(frame, (x, y))
    draw.text((x, y + thumb_h + 6), name, fill="#6b5a60")
sheet.save(out_dir / "_contact-sheet.jpg", quality=90)
`;
  const result = spawnSync("python", ["-c", py, outputDir, ...files], { stdio: "inherit" });
  if (result.status !== 0) throw new Error("Failed to create contact sheet with Pillow");
  console.log("captured _contact-sheet.jpg");
}

async function main() {
  const resolvedOutput = path.resolve(outputDir);
  const expectedRoot = path.resolve(__dirname);
  if (!resolvedOutput.startsWith(expectedRoot)) throw new Error(`Refusing to write outside screenshot dir: ${resolvedOutput}`);
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  if (!fs.existsSync(chromePath)) throw new Error(`Chrome not found: ${chromePath}`);
  const chrome = startChrome();
  let cdp;
  try {
    await waitForChrome();
    cdp = await createPage();
    await captureAll(cdp);
    createContactSheet();
  } finally {
    cdp?.close();
    chrome.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
