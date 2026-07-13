(function () {
  const STATE_KEY = "summer_task_state";

  const TASKS = [
    {
      id: "kinematics-basic",
      title: "匀变速直线运动",
      subject: "physics",
      nodeLabel: "运动学",
      day: 1,
      compressedSlot: "上午第一轮",
      source: "HE物理课堂",
      duration: "25:39",
      focusMins: 35,
      url: "https://www.bilibili.com/video/BV1uZubzzEza/",
      videoTitle: "保姆级精讲匀变速直线运动基本公式及计算",
      practiceItems: [
        {
          title: "方向判断",
          question: "小车一开始速度是 8 米/秒。后来加速度大小是 3.5 米/秒²，时间是 8 秒。加速度可能和速度同方向，也可能反方向。请分别算 8 秒后的速度。",
          hint: "先写两个方向：同方向速度变大，反方向速度变小。再用“末速度 = 初速度 + 加速度 × 时间”。",
        },
        {
          title: "刹车会不会反向",
          question: "还是这辆小车：初速度 8 米/秒，加速度大小 3.5 米/秒²。如果加速度和速度反方向，先算它大约几秒停下，再判断 8 秒末物体是不是已经反向运动。",
          hint: "先别急着算 8 秒末。先问自己：速度减到 0 要多久？如果停下时间小于 8 秒，后面就已经反向了。",
        },
      ],
    },
    {
      id: "newton-second-law",
      title: "牛顿第二定律",
      subject: "physics",
      nodeLabel: "动力学",
      day: 1,
      compressedSlot: "上午第一轮",
      source: "HE物理课堂",
      duration: "10:10",
      focusMins: 20,
      url: "https://www.bilibili.com/video/BV1P8BmYVEe4/",
      videoTitle: "牛顿第二定律保姆级教学",
      practiceItems: [
        {
          title: "公式读成中文",
          question: "F = m × a 的意思是什么？如果一个 10 千克的物体，加速度是 1 米/秒²，需要多大的合外力？",
          hint: "先把公式读成中文：合外力 = 质量 × 加速度。再说清楚：加速度方向跟合外力方向一样。",
        },
        {
          title: "同样的力推不同质量",
          question: "同样用 10 牛的合外力，分别推 2 千克和 5 千克的物体。哪个物体加速度更大？分别是多少？",
          hint: "把公式换成：加速度 = 合外力 ÷ 质量。质量越大，同样的力推起来越不容易加速。",
        },
      ],
    },
    {
      id: "force-decomposition",
      title: "力的合成与分解",
      subject: "physics",
      nodeLabel: "动力学",
      day: 1,
      compressedSlot: "上午第二轮",
      source: "一物儿",
      duration: "41:57",
      focusMins: 50,
      url: "https://www.bilibili.com/video/BV1XezpYxE3c/",
      videoTitle: "手把手零基础搞定正交分解",
      practiceItems: [
        {
          title: "绳子受力分解",
          diagram: "force-rope",
          question: "看图做题：重物 G 静止不动。左边绳子水平拉，右边斜绳向右上拉，斜绳和竖直方向夹角是 30°。先判断：哪根绳子提供向上的力？再列出竖直方向和水平方向的平衡关系。",
          hint: "不用自己脑补图。先看重力向下；右边斜绳分成向上、向右两个分力；左边水平绳只负责向左拉。",
        },
        {
          title: "首尾相接看合力",
          question: "五个力按顺序首尾相接，最后刚好回到起点。这个物体受到的合力是多少？它可能处于什么运动状态？",
          hint: "力的首尾相接如果围成封闭图形，合力就是 0。合力为 0 不一定静止，也可能匀速直线运动。",
        },
      ],
    },
    {
      id: "work-power",
      title: "功与功率",
      subject: "physics",
      nodeLabel: "能量守恒",
      day: 2,
      compressedSlot: "下午第一轮",
      source: "一物儿",
      duration: "1:36:17",
      focusMins: 60,
      url: "https://www.bilibili.com/video/BV18GZAYyEtU/",
      videoTitle: "做功算不准？功率算不对？",
      practiceItems: [
        {
          title: "拉力和摩擦力做功",
          question: "一个物体在水平地面上移动 2 米。拉力 F 斜向上拉，大小是 5 牛，方向和水平方向成 37°。摩擦力大小是 2 牛。分别判断：拉力做正功还是负功？摩擦力做正功还是负功？",
          hint: "先看力和位移方向夹角。顺着运动方向的分力做正功，反着运动方向的力做负功。",
        },
        {
          title: "粗糙和光滑比较",
          question: "同一个力 F 拉同一个物体，两次都沿力的方向走了同样远。第一次地面粗糙，第二次地面光滑。问：力 F 两次做的功一样吗？哪一次平均功率更大？",
          hint: "做功先看：力和位移有没有变。功率再看：谁用的时间更短。不要一上来套复杂公式。",
        },
      ],
    },
    {
      id: "closed-circuit-ohm",
      title: "闭合电路欧姆定律",
      subject: "physics",
      nodeLabel: "电场",
      day: 2,
      compressedSlot: "下午第二轮",
      source: "HE物理课堂",
      duration: "47:42",
      focusMins: 55,
      url: "https://www.bilibili.com/video/BV1TDCUBREAk/",
      videoTitle: "闭合电路欧姆定律计算 + 全题型保姆精讲",
      needsExamples: true,
      practiceNote: "这节课还没贴例题截图。先保留视频任务，不生成题。",
    },
    {
      id: "projectile-motion",
      title: "平抛运动",
      subject: "physics",
      nodeLabel: "运动学",
      day: 3,
      compressedSlot: "待补例题截图",
      source: "一物儿",
      duration: "1:43:00",
      focusMins: 45,
      url: "https://www.bilibili.com/video/BV1RTkhYoEhY/",
      videoTitle: "物理平抛运动？你想知道的，这都讲",
      needsExamples: true,
      practiceNote: "这节课还没贴例题截图。先把视频入口占住，题目等截图后再补。",
    },
    {
      id: "universal-gravitation",
      title: "万有引力",
      subject: "physics",
      nodeLabel: "动力学",
      day: 3,
      compressedSlot: "待补例题截图",
      source: "一物儿",
      duration: "1:04:15",
      focusMins: 45,
      url: "https://www.bilibili.com/video/BV141QyYrELE/",
      videoTitle: "天体卫星所有题型",
      needsExamples: true,
      practiceNote: "这节课还没贴例题截图。先把视频入口占住，题目等截图后再补。",
    }
  ];

  const PLAN_LABELS = {
    twoDay: "两天推荐版",
    oneDay: "一天压缩版",
  };

  function readState() {
    const fallback = { plan: "twoDay", pendingTaskId: "", activeTaskId: "", tasks: {} };
    try {
      const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
      if (!saved || typeof saved !== "object") return fallback;
      return {
        plan: saved.plan === "oneDay" ? "oneDay" : "twoDay",
        pendingTaskId: String(saved.pendingTaskId || ""),
        activeTaskId: String(saved.activeTaskId || ""),
        tasks: saved.tasks && typeof saved.tasks === "object" ? saved.tasks : {},
      };
    } catch {
      return fallback;
    }
  }

  function writeState(state) {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function taskState(state, id) {
    return state.tasks[id] || {};
  }

  function updateTask(id, patch) {
    const state = readState();
    state.tasks[id] = { ...taskState(state, id), ...patch, updatedAt: new Date().toISOString() };
    writeState(state);
    return state;
  }

  function setPlan(plan) {
    const state = readState();
    state.plan = plan === "oneDay" ? "oneDay" : "twoDay";
    writeState(state);
    refreshHome();
  }

  function setPendingTask(id) {
    const state = readState();
    state.pendingTaskId = id;
    state.activeTaskId = id;
    writeState(state);
    refreshHome();
  }

  function attachImportedRecord(logEntry) {
    const state = readState();
    const id = state.pendingTaskId;
    if (!id || !TASKS.some((task) => task.id === id)) return;
    const current = taskState(state, id);
    const linkedLogIds = Array.isArray(current.linkedLogIds) ? current.linkedLogIds.slice() : [];
    if (logEntry?.id && !linkedLogIds.includes(logEntry.id)) linkedLogIds.push(logEntry.id);
    state.tasks[id] = {
      ...current,
      watched: true,
      completed: true,
      completedAt: new Date().toISOString(),
      linkedLogIds,
      lastImportedRecord: {
        id: logEntry?.id || "",
        subject: logEntry?.subject || "",
        nodeLabel: logEntry?.nodeLabel || "",
        stars: logEntry?.stars || 0,
      },
      updatedAt: new Date().toISOString(),
    };
    state.pendingTaskId = "";
    state.activeTaskId = "";
    writeState(state);
  }

  function progress(state = readState()) {
    const readyTasks = TASKS.filter((task) => !task.needsExamples);
    const completed = readyTasks.filter((task) => taskState(state, task.id).completed).length;
    const watched = TASKS.filter((task) => taskState(state, task.id).watched).length;
    const waiting = TASKS.filter((task) => task.needsExamples).length;
    return { completed, watched, total: readyTasks.length, all: TASKS.length, waiting };
  }

  function render() {
    const state = readState();
    const stat = progress(state);
    const pct = Math.round((stat.completed / stat.total) * 100);
    const plan = state.plan === "oneDay" ? "oneDay" : "twoDay";
    return `
      <section class="card summer-task-card">
        <div class="summer-task-head">
          <div>
            <p class="summer-kicker">暑假物理补基础</p>
            <h3>今日任务</h3>
            <p>看过视频就直接做小题；导入一条学习记录才算完成。已列 ${stat.all} 节课${stat.waiting ? `，${stat.waiting} 节待补例题截图` : ""}。</p>
          </div>
          <div class="summer-progress-ring" aria-label="已完成 ${stat.completed}/${stat.total}">
            <strong>${stat.completed}</strong><span>/${stat.total}</span>
          </div>
        </div>
        <div class="summer-plan-tabs" role="tablist" aria-label="任务计划">
          ${Object.entries(PLAN_LABELS).map(([key, label]) => `
            <button class="summer-plan-tab ${plan === key ? "active" : ""}" data-summer-action="plan" data-plan="${key}" type="button">${label}</button>
          `).join("")}
        </div>
        <div class="summer-progress-track"><div class="summer-progress-fill" style="width:${pct}%"></div></div>
        ${plan === "oneDay" ? renderOneDay(state) : renderTwoDay(state)}
      </section>
    `;
  }

  function renderTwoDay(state) {
    const day1 = TASKS.filter((task) => task.day === 1 && !task.needsExamples);
    const day2 = TASKS.filter((task) => task.day === 2 && !task.needsExamples);
    const waiting = TASKS.filter((task) => task.needsExamples);
    return `
      <div class="summer-day-list">
        ${renderDayGroup("第 1 天", "运动 + 受力基础", day1, state)}
        ${renderDayGroup("第 2 天", "功率 + 电路基础", day2, state)}
        ${renderDayGroup("待补例题截图", "先占住视频入口，题目等截图后补", waiting, state)}
      </div>
    `;
  }

  function renderOneDay(state) {
    const groups = [
      ["上午第一轮", TASKS.filter((task) => task.compressedSlot === "上午第一轮")],
      ["上午第二轮", TASKS.filter((task) => task.compressedSlot === "上午第二轮")],
      ["下午第一轮", TASKS.filter((task) => task.compressedSlot === "下午第一轮")],
      ["下午第二轮", TASKS.filter((task) => task.compressedSlot === "下午第二轮")],
      ["待补例题截图", TASKS.filter((task) => task.needsExamples)],
    ];
    return `
      <div class="summer-day-list">
        ${groups.map(([title, tasks]) => renderDayGroup(
          title,
          title === "待补例题截图" ? "先占住视频入口，题目等截图后补" : "压缩版只保留过关小题，不追求全吃透",
          tasks,
          state
        )).join("")}
      </div>
    `;
  }

  function renderDayGroup(title, subtitle, tasks, state) {
    return `
      <div class="summer-day-group">
        <div class="summer-day-title">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(subtitle)}</span>
        </div>
        <div class="summer-task-list">
          ${tasks.map((task) => renderTask(task, state)).join("")}
        </div>
      </div>
    `;
  }

  function renderTask(task, state) {
    const s = taskState(state, task.id);
    const isPending = state.pendingTaskId === task.id;
    const isActive = state.activeTaskId === task.id || isPending;
    const completed = Boolean(s.completed);
    const watched = Boolean(s.watched);
    const practiceItems = getPracticeItems(task);
    return `
      <article class="summer-task ${completed ? "completed" : ""} ${isPending ? "pending-import" : ""}" data-summer-task-id="${escapeHtml(task.id)}">
        <div class="summer-task-main">
          <div class="summer-task-title-row">
            <span class="summer-task-check material-symbols-outlined">${completed ? "check_circle" : watched ? "radio_button_checked" : "radio_button_unchecked"}</span>
            <div>
              <h4>${escapeHtml(task.title)}</h4>
              <p>${escapeHtml(task.source)} · ${escapeHtml(task.duration)} · ${escapeHtml(task.videoTitle)}</p>
            </div>
          </div>
          <details class="summer-exit-box" ${isActive ? "open" : ""}>
            <summary>${practiceItems.length ? `过关小题：${practiceItems.length} 题` : "过关小题：待补截图"}</summary>
            ${renderPracticeItems(task, practiceItems)}
          </details>
          ${isPending ? `<p class="summer-import-waiting">等你把 AI 输出的 MOCHI-RECORD 导入后，这条任务会自动完成。</p>` : ""}
          ${completed && s.lastImportedRecord ? `<p class="summer-import-done">已完成：${escapeHtml(s.lastImportedRecord.nodeLabel || "物理")} · ${"★".repeat(Number(s.lastImportedRecord.stars || 0))}</p>` : ""}
        </div>
        <div class="summer-task-actions">
          <a class="btn btn-soft btn-sm" href="${escapeHtml(task.url)}" target="_blank" rel="noreferrer">
            <span class="material-symbols-outlined">open_in_new</span>打开资源
          </a>
          <button class="btn btn-soft btn-sm" data-summer-action="focus" data-task-id="${escapeHtml(task.id)}" type="button">
            <span class="material-symbols-outlined">timer</span>开始专注
          </button>
          <button class="btn btn-soft btn-sm" data-summer-action="practice" data-task-id="${escapeHtml(task.id)}" type="button">
            <span class="material-symbols-outlined">edit_note</span>${practiceItems.length ? "做小题" : "待补题"}
          </button>
          <button class="btn btn-soft btn-sm" data-summer-action="watched" data-task-id="${escapeHtml(task.id)}" type="button">
            <span class="material-symbols-outlined">visibility</span>${watched ? "已看完" : "看完了"}
          </button>
          <button class="btn btn-primary btn-sm" data-summer-action="import" data-task-id="${escapeHtml(task.id)}" type="button">
            <span class="material-symbols-outlined">download_done</span>导入记录
          </button>
        </div>
      </article>
    `;
  }

  function getPracticeItems(task) {
    return Array.isArray(task.practiceItems) ? task.practiceItems : [];
  }

  function renderPracticeItems(task, items) {
    if (!items.length) {
      return `
        <div class="summer-practice-empty">
          <span class="material-symbols-outlined">pending</span>
          <div>
            <strong>等你贴例题截图后补题</strong>
            <p>${escapeHtml(task.practiceNote || "这节课先保留视频入口，不生成低质量题。")}</p>
          </div>
        </div>
      `;
    }
    return `
      <div class="summer-practice-list">
        ${items.map((item, index) => `
          <section class="summer-practice-item">
            <div class="summer-practice-title">
              <span>${index + 1}</span>
              <strong>${escapeHtml(item.title || `小题 ${index + 1}`)}</strong>
            </div>
            ${renderTaskDiagram(item)}
            <p class="summer-exit-question">${escapeHtml(item.question)}</p>
            <p class="summer-exit-hint">${escapeHtml(item.hint)}</p>
            <button class="btn btn-soft btn-sm" data-summer-action="copy-prompt" data-task-id="${escapeHtml(task.id)}" data-item-index="${index}" type="button">
              <span class="material-symbols-outlined">content_copy</span>复制给 AI
            </button>
          </section>
        `).join("")}
      </div>
    `;
  }

  function bind(container) {
    container.querySelectorAll("[data-summer-action]").forEach((el) => {
      el.addEventListener("click", handleAction);
    });
  }

  async function handleAction(event) {
    const action = event.currentTarget.dataset.summerAction;
    const id = event.currentTarget.dataset.taskId || "";
    const task = TASKS.find((item) => item.id === id);
    if (action === "plan") {
      setPlan(event.currentTarget.dataset.plan || "twoDay");
      return;
    }
    if (!task) return;
    if (action === "watched") {
      updateTask(task.id, { watched: true });
      window.MochiApp?.toast?.("已记录看完视频，做完小题后再导入记录");
      refreshHome();
      return;
    }
    if (action === "practice") {
      const state = readState();
      const hasPractice = getPracticeItems(task).length > 0;
      state.activeTaskId = task.id;
      state.tasks[task.id] = {
        ...taskState(state, task.id),
        watched: hasPractice ? true : taskState(state, task.id).watched || false,
        practicingAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      writeState(state);
      refreshHome();
      setTimeout(() => scrollToTask(task.id), 120);
      window.MochiApp?.toast?.(hasPractice ? "已打开过关小题，做完后再导入记录" : "这节课先占位，等你贴例题截图后补题");
      return;
    }
    if (action === "focus") {
      updateTask(task.id, { watched: taskState(readState(), task.id).watched || false, lastFocusedAt: new Date().toISOString() });
      const goal = getPracticeItems(task).length ? `暑假物理：${task.title}过关小题` : `暑假物理：看${task.title}`;
      window.MochiApp?.startCommittedFocus?.(goal, task.focusMins);
      return;
    }
    if (action === "copy-prompt") {
      const itemIndex = Number(event.currentTarget.dataset.itemIndex || 0);
      const item = getPracticeItems(task)[itemIndex];
      if (!item) {
        window.MochiApp?.toast?.("这节课还没补例题截图，先不生成题");
        return;
      }
      const prompt = buildPracticePrompt(task, item);
      const ok = await copyText(prompt);
      if (ok) {
        window.MochiApp?.toast?.("过关小题已复制，粘给 AI 让它带你做");
      } else {
        showPromptFallback(prompt);
        window.MochiApp?.toast?.("已打开手动复制框");
      }
      return;
    }
    if (action === "import") {
      setPendingTask(task.id);
      if (focusImportBox()) {
        window.MochiApp?.toast?.("已关联这条任务：粘贴 MOCHI-RECORD 后自动完成");
        return;
      }
      if (window.MochiApp?.setHolidayMode) {
        window.MochiApp.setHolidayMode("holiday");
        setTimeout(() => focusImportBox(), 350);
        window.MochiApp?.toast?.("已打开今天的学习模式，粘贴 MOCHI-RECORD 后自动完成");
        return;
      }
      window.MochiApp?.toast?.("已关联这条任务：粘贴 MOCHI-RECORD 后自动完成");
    }
  }

  function focusImportBox() {
    const textarea = document.getElementById("record-paste");
    if (!textarea) return false;
    textarea.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => textarea.focus(), 250);
    return true;
  }

  function renderTaskDiagram(task) {
    if (task.diagram !== "force-rope") return "";
    return `
      <div class="summer-diagram" aria-label="重物被水平绳和斜绳拉住的示意图">
        <svg viewBox="0 0 320 190" role="img" aria-label="左绳水平，右绳和竖直方向夹角30度，重物G静止">
          <line x1="34" y1="26" x2="286" y2="26" class="diagram-wall" />
          <line x1="58" y1="94" x2="142" y2="94" class="diagram-rope" />
          <line x1="142" y1="94" x2="220" y2="26" class="diagram-rope" />
          <line x1="142" y1="94" x2="142" y2="132" class="diagram-rope diagram-rope-thin" />
          <line x1="142" y1="94" x2="142" y2="44" class="diagram-guide" />
          <path d="M142 58 A36 36 0 0 1 169 70" class="diagram-arc" />
          <circle cx="142" cy="94" r="5" class="diagram-dot" />
          <rect x="122" y="132" width="40" height="30" rx="6" class="diagram-weight" />
          <text x="38" y="91" class="diagram-label">A</text>
          <text x="228" y="25" class="diagram-label">B</text>
          <text x="132" y="88" class="diagram-label">O</text>
          <text x="132" y="153" class="diagram-label diagram-weight-text">G</text>
          <text x="74" y="84" class="diagram-note">左绳水平</text>
          <text x="195" y="70" class="diagram-note">右斜绳</text>
          <text x="172" y="58" class="diagram-note">30°</text>
          <text x="166" y="122" class="diagram-note">重力向下</text>
        </svg>
      </div>
    `;
  }

  function buildPracticePrompt(task, item) {
    return [
      `我刚看完「${task.title}」视频。`,
      `请用零基础方式带我做这道过关小题：${item.question}`,
      item.hint ? `我希望你重点提醒我：${item.hint}` : "",
      "请一步步问我，不要直接给答案；如果我不会，先用更简单的问题铺垫。",
      "最后请按 MochiStudy 格式输出一条 MOCHI-RECORD。",
    ].filter(Boolean).join("\n");
  }

  function scrollToTask(id) {
    const taskEl = document.querySelector(`[data-summer-task-id="${CSS.escape(id)}"]`);
    taskEl?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { /* fallback below */ }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      textarea.remove();
      return ok;
    } catch {
      return false;
    }
  }

  function showPromptFallback(prompt) {
    window.MochiApp?.modal?.(`
      <h3>复制过关小题 Prompt</h3>
      <p class="muted">浏览器没有放行剪贴板。点下面文本框后 Ctrl+A / Ctrl+C，再粘给 AI。</p>
      <textarea class="summer-prompt-fallback" rows="9" readonly>${escapeHtml(prompt)}</textarea>
      <button class="btn btn-primary" data-action="close-modal" type="button" style="width:100%;margin-top:10px">我复制好了</button>
    `);
    setTimeout(() => {
      const textarea = document.querySelector(".summer-prompt-fallback");
      textarea?.focus();
      textarea?.select();
    }, 40);
  }

  function refreshHome() {
    const view = document.getElementById("view");
    if (view && view.querySelector(".home-flow")) window.MochiFarm?.renderFarm?.(view);
  }

  function escapeHtml(value) {
    return window.MochiApp?.escapeHtml?.(value) ?? String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  window.MochiSummerTasks = {
    render,
    bind,
    attachImportedRecord,
    progress,
    getTasks: () => TASKS.slice(),
  };
})();
