(function () {
  const DB_NAME = "mochi_question_desk";
  const DB_VERSION = 1;
  const IMAGE_STORE = "question_images_blob";
  const IMAGES_KEY = "question_desk_images";
  const ITEMS_KEY = "question_desk_items";
  const UI_KEY = "question_desk_ui_state";

  const SUBJECT_OPTIONS = [
    ["uncategorized", "未分类"],
    ["math", "数学"],
    ["physics", "物理"],
    ["chemistry", "化学"],
  ];

  const SOURCE_TYPE = "拍题";

  const QUESTION_DESK_PROMPT = [
    "你是 MochiStudy 题桌里的单题 AI 私教，专门陪基础薄弱的高中理科生啃一张题图。",
    "先读图识别题目大意，再判断科目和最接近的知识点。",
    "不要一次性给完整答案。先问学生卡在哪里，再用脚手架一步一步提示。",
    "学生说不知道时，把问题拆得更小；学生方向错了，不说错了，而是引导他验证。",
    "当学生要求生成记录或你判断题目已经讲通时，输出以下固定格式：",
    "【MochiStudy 学习记录草稿】",
    "科目：[数学/物理/化学]",
    "知识点：[必须从预设列表选择]",
    "掌握星级：[1-3]",
    "卡点记录：[一句话]",
    "原题：[尽力转写题干核心文字、数字和关键公式，不超过120字；不能只写见原图]",
    "今日套路：[3步以内]",
    "错误类型：[概念不清/审题/计算/其他]",
    "卡住步骤：[一句话，可为空]",
    "关键突破：[一句话]",
    "题型标签：[用顿号分隔，最多3个]",
    "信心分：[1-5]",
    "耗时分钟：[整数]",
    "学习日期：[YYYY-MM-DD]",
    "知识点必须从以下列表选：数学：集合、函数、三角函数、数列、不等式、向量、概率统计、导数、立体几何、解析几何；物理：运动学、动力学、动量、能量守恒、电场、磁场、电磁感应、波动、热学；化学：原子结构、化学键、氧化还原反应、化学反应、化学平衡、电化学、有机化学。",
  ].join("\n");

  const STATE = {
    container: null,
    activeImageId: "",
    activeItemId: "",
    inspectItemId: "",
    filter: "all",
    busy: false,
    message: "",
    selecting: null,
    imageUrls: new Map(),
  };

  function normalizePanelMode(value) {
    return ["open", "collapsed", "expanded"].includes(value) ? value : "open";
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function images() {
    return Array.isArray(readJson(IMAGES_KEY, [])) ? readJson(IMAGES_KEY, []) : [];
  }

  function saveImages(next) {
    writeJson(IMAGES_KEY, Array.isArray(next) ? next : []);
  }

  function items() {
    return Array.isArray(readJson(ITEMS_KEY, [])) ? readJson(ITEMS_KEY, []) : [];
  }

  function saveItems(next) {
    writeJson(ITEMS_KEY, Array.isArray(next) ? next : []);
  }

  function readUi() {
    return readJson(UI_KEY, {}) || {};
  }

  function saveUi(patch) {
    writeJson(UI_KEY, { ...readUi(), ...(patch || {}) });
  }

  function panelMode() {
    return normalizePanelMode(readUi().panelMode);
  }

  function setPanelMode(mode) {
    saveUi({ panelMode: normalizePanelMode(mode) });
  }

  function uid(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IMAGE_STORE)) db.createObjectStore(IMAGE_STORE, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB 打开失败"));
    });
  }

  function deleteDb() {
    if (!window.indexedDB) return Promise.resolve(true);
    return new Promise((resolve) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
      request.onblocked = () => resolve(false);
    });
  }

  async function clearStorage() {
    localStorage.removeItem(IMAGES_KEY);
    localStorage.removeItem(ITEMS_KEY);
    localStorage.removeItem(UI_KEY);
    STATE.activeImageId = "";
    STATE.filter = "all";
    STATE.message = "";
    STATE.imageUrls.forEach((url) => URL.revokeObjectURL(url));
    STATE.imageUrls.clear();
    await deleteDb();
  }

  async function putBlob(id, blob, mimeType) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGE_STORE, "readwrite");
      tx.objectStore(IMAGE_STORE).put({ id, blob, mimeType, createdAt: nowIso() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error("图片保存失败"));
    });
  }

  async function getBlob(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGE_STORE, "readonly");
      const request = tx.objectStore(IMAGE_STORE).get(id);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => reject(request.error || new Error("图片读取失败"));
    });
  }

  function imageDimensions(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth || 0, height: img.naturalHeight || 0 });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }

  function subjectLabel(subject) {
    return SUBJECT_OPTIONS.find(([key]) => key === subject)?.[1] || "未分类";
  }

  function shortDate(date) {
    const text = String(date || todayKey());
    return text.length >= 10 ? text.slice(5, 10) : text;
  }

  function defaultName(date = todayKey()) {
    const list = images();
    const prefix = `未分类-${SOURCE_TYPE}-${date}-`;
    const nums = list
      .map((img) => String(img.name || ""))
      .filter((name) => name.startsWith(prefix))
      .map((name) => Number(name.slice(prefix.length)))
      .filter(Number.isFinite);
    const next = Math.max(0, ...nums) + 1;
    return `${prefix}${String(next).padStart(2, "0")}`;
  }

  function shortName(name) {
    return String(name || "")
      .replace(/(\d{4})-(\d{2})-(\d{2})/, "$2-$3")
      .slice(0, 34);
  }

  function escapeHtml(value) {
    return window.MochiApp?.escapeHtml?.(value) ?? String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function formatText(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
  }

  function nodesForSubject(subject) {
    return window.MochiKnowledge?.SUBJECTS?.[subject]?.nodes || [];
  }

  function exactNode(subject, label) {
    return nodesForSubject(subject).find((node) => node.label === label) || null;
  }

  function normalizeSubject(value) {
    const text = String(value || "");
    if (text.includes("数学") || text === "math") return "math";
    if (text.includes("物理") || text === "physics") return "physics";
    if (text.includes("化学") || text === "chemistry") return "chemistry";
    return "";
  }

  function parseStars(value) {
    const text = String(value || "");
    if (text.includes("★★★")) return 3;
    if (text.includes("★★")) return 2;
    if (text.includes("★")) return 1;
    const num = Number((text.match(/[1-3]/) || [])[0] || 0);
    return num >= 1 && num <= 3 ? num : 0;
  }

  function parseScore(value, max) {
    const num = Number((String(value || "").match(/\d+/) || [])[0] || 0);
    return num >= 1 && num <= max ? num : 0;
  }

  function parseMinutes(value) {
    const num = Number((String(value || "").match(/\d+/) || [])[0] || 0);
    return Number.isFinite(num) && num > 0 ? Math.round(num) : 0;
  }

  function parseTags(value) {
    return String(value || "")
      .split(/[,，、\n]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  function parseDraft(text) {
    const fields = {};
    const keys = ["科目", "知识点", "掌握星级", "卡点记录", "原题", "今日套路", "错误类型", "卡住步骤", "关键突破", "题型标签", "信心分", "耗时分钟", "学习日期"];
    let active = "";
    String(text || "").split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      const key = keys.find((item) => trimmed.startsWith(`${item}:`) || trimmed.startsWith(`${item}：`));
      if (key) {
        active = key;
        fields[key] = trimmed.replace(new RegExp(`^${key}[:：]`), "").trim();
      } else if (active && trimmed && !/^【.*】$/.test(trimmed)) {
        fields[active] = `${fields[active] ? `${fields[active]}\n` : ""}${trimmed}`;
      }
    });

    const subject = normalizeSubject(fields["科目"]);
    const node = subject ? exactNode(subject, fields["知识点"]) : null;
    return {
      subject,
      nodeId: node?.id || "",
      nodeLabel: node?.label || fields["知识点"] || "",
      questionsCompleted: 1,
      stars: parseStars(fields["掌握星级"]),
      painPoint: fields["卡点记录"] || "",
      originalQuestion: fields["原题"] || "",
      routine: fields["今日套路"] || "",
      date: fields["学习日期"] || todayKey(),
      meta: {
        source: "lesson",
        errorType: fields["错误类型"] || "",
        stuckStep: fields["卡住步骤"] || "",
        keyInsight: fields["关键突破"] || "",
        tags: parseTags(fields["题型标签"]),
        confidence: parseScore(fields["信心分"], 5),
        timeSpentMinutes: parseMinutes(fields["耗时分钟"]),
      },
      raw: text || "",
    };
  }

  function filterImages(list, filter) {
    if (filter === "all") return list;
    if (filter === "saved") return list.filter((img) => img.status === "saved");
    if (filter === "unsaved") return list.filter((img) => img.status !== "saved");
    return list.filter((img) => img.subject === filter);
  }

  function findActiveImage() {
    const list = images();
    if (!STATE.activeImageId && readUi().activeImageId) STATE.activeImageId = readUi().activeImageId;
    return list.find((img) => img.id === STATE.activeImageId) || list[0] || null;
  }

  function findItem(imageId) {
    return items().find((item) => item.imageId === imageId) || null;
  }

  function itemsForImage(imageId) {
    return items().filter((item) => item.imageId === imageId);
  }

  function activeItemForImage(imageId) {
    const list = itemsForImage(imageId);
    return list.find((item) => item.id === STATE.activeItemId) || list[0] || null;
  }

  function itemLabel(item, index = 0) {
    if (!item) return "";
    if (item.rect) return item.title || `第 ${index + 1} 题`;
    return item.title || "整张题图";
  }

  async function objectUrlFor(imageId) {
    if (!imageId) return "";
    if (STATE.imageUrls.has(imageId)) return STATE.imageUrls.get(imageId);
    const blob = await getBlob(imageId);
    if (!blob) return "";
    const url = URL.createObjectURL(blob);
    STATE.imageUrls.set(imageId, url);
    return url;
  }

  function bitmapFromBlob(blob) {
    if (window.createImageBitmap) return window.createImageBitmap(blob);
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("题图读取失败"));
      };
      img.src = url;
    });
  }

  async function imageBlobForItem(item) {
    const blob = await getBlob(item.imageId);
    if (!blob || !item.rect) return blob;
    const source = await bitmapFromBlob(blob);
    const sw = source.width || source.naturalWidth || 0;
    const sh = source.height || source.naturalHeight || 0;
    if (!sw || !sh) return blob;
    const rect = item.rect;
    const sx = Math.max(0, Math.round(rect.x * sw));
    const sy = Math.max(0, Math.round(rect.y * sh));
    const cw = Math.max(1, Math.round(rect.w * sw));
    const ch = Math.max(1, Math.round(rect.h * sh));
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(source, sx, sy, cw, ch, 0, 0, cw, ch);
    source.close?.();
    return await new Promise((resolve) => canvas.toBlob((next) => resolve(next || blob), "image/png", 0.92));
  }

  async function addImage(file) {
    if (!file || !String(file.type || "").startsWith("image/")) {
      window.MochiApp?.toast?.("请粘贴或上传图片");
      return;
    }
    const date = todayKey();
    const id = uid("img");
    const itemId = uid("item");
    const dims = await imageDimensions(file);
    const name = defaultName(date);
    await putBlob(id, file, file.type || "image/png");
    const image = {
      id,
      name,
      shortName: shortName(name),
      subject: "uncategorized",
      sourceType: SOURCE_TYPE,
      date,
      mimeType: file.type || "image/png",
      width: dims.width,
      height: dims.height,
      status: "new",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      savedLogId: "",
    };
    const item = {
      id: itemId,
      imageId: id,
      subject: "uncategorized",
      nodeId: "",
      nodeLabel: "",
      status: "new",
      title: image.shortName,
      chat: [],
      recordDraft: null,
      savedLogId: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    saveImages([image, ...images()]);
    saveItems([item, ...items()]);
    STATE.activeImageId = id;
    saveUi({ activeImageId: id });
    window.MochiApp?.toast?.("题图已加入题桌");
    render(STATE.container);
  }

  function updateImage(imageId, patch) {
    saveImages(images().map((img) => img.id === imageId ? { ...img, ...(patch || {}), updatedAt: nowIso() } : img));
  }

  function updateItem(itemId, patch) {
    saveItems(items().map((item) => item.id === itemId ? { ...item, ...(patch || {}), updatedAt: nowIso() } : item));
  }

  function createRegionItem(image, rect) {
    if (!image || !rect) return null;
    const siblings = itemsForImage(image.id);
    const nextIndex = siblings.filter((item) => item.rect).length + 1;
    const item = {
      id: uid("item"),
      imageId: image.id,
      subject: image.subject || "uncategorized",
      nodeId: "",
      nodeLabel: "",
      status: "new",
      title: `第 ${nextIndex} 题`,
      rect,
      chat: [],
      recordDraft: null,
      savedLogId: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    saveItems([item, ...items()]);
    STATE.activeItemId = item.id;
    STATE.inspectItemId = item.id;
    setPanelMode("open");
    window.MochiApp?.toast?.("已框选一道题");
    return item;
  }

  function render(container) {
    if (!container) return;
    STATE.container = container;
    bind(container);
    const activeImage = findActiveImage();
    const mode = panelMode();
    if (activeImage) {
      STATE.activeImageId = activeImage.id;
      saveUi({ activeImageId: activeImage.id });
      const activeItem = activeItemForImage(activeImage.id);
      if (activeItem) STATE.activeItemId = activeItem.id;
    }
    const activeItem = activeImage ? activeItemForImage(activeImage.id) : null;
    container.innerHTML = `
      <div class="question-desk qd-panel-${mode}">
        <aside class="qd-sidebar">
          ${renderSidebar(activeImage)}
        </aside>
        <main class="qd-canvas">
          ${renderViewer(activeImage, activeItem)}
        </main>
        <aside class="qd-panel">
          ${renderPanel(activeImage, activeItem, mode)}
        </aside>
      </div>
    `;
    hydrateImage(activeImage);
  }

  function renderSidebar(activeImage) {
    const all = images();
    const visible = filterImages(all, STATE.filter);
    const filters = [
      ["all", "收件箱", all.length],
      ["math", "数学", all.filter((i) => i.subject === "math").length],
      ["physics", "物理", all.filter((i) => i.subject === "physics").length],
      ["chemistry", "化学", all.filter((i) => i.subject === "chemistry").length],
      ["saved", "已学习", all.filter((i) => i.status === "saved").length],
      ["unsaved", "未学习", all.filter((i) => i.status !== "saved").length],
    ];
    return `
      <div class="qd-head">
        <div>
          <h2>题桌</h2>
          <p>一图一题，站内问 AI。</p>
        </div>
        <button class="btn btn-soft btn-sm qd-growth-btn" data-route="home" type="button">
          <span class="material-symbols-outlined">psychiatry</span>我的成长
        </button>
      </div>
      <div class="qd-actions">
        <label class="btn btn-primary btn-sm qd-upload">
          <span class="material-symbols-outlined">add_photo_alternate</span>上传题图
          <input data-qd-file type="file" accept="image/*" hidden />
        </label>
        <p class="qd-hint">也可以复制截图后在题桌按 Ctrl+V。</p>
      </div>
      <div class="qd-filter-list">
        ${filters.map(([key, label, count]) => `
          <button class="qd-filter ${STATE.filter === key ? "active" : ""}" data-qd-action="filter" data-filter="${key}" type="button">
            <span>${label}</span><b>${count}</b>
          </button>
        `).join("")}
      </div>
      <div class="qd-file-list">
        ${visible.length ? visible.map((img) => renderFileItem(img, activeImage?.id === img.id)).join("") : renderEmptyFiles()}
      </div>
    `;
  }

  function renderFileItem(img, active) {
    const list = itemsForImage(img.id);
    const item = list[0] || null;
    const savedCount = list.filter((entry) => entry.status === "saved").length;
    const askedCount = list.filter((entry) => entry.chat?.length).length;
    const countLabel = list.length > 1 ? ` · ${list.length}题` : "";
    return `
      <button class="qd-file ${active ? "active" : ""}" data-qd-action="select-image" data-image-id="${img.id}" type="button">
        <span class="qd-file-status ${img.status || "new"}"></span>
        <span class="qd-file-main">
          <strong>${escapeHtml(img.shortName || img.name)}</strong>
          <small>${escapeHtml(subjectLabel(img.subject))}${countLabel} · ${savedCount ? `已学${savedCount}` : askedCount ? `已问${askedCount}` : item?.chat?.length ? "已问 AI" : "未学习"}</small>
        </span>
      </button>
    `;
  }

  function renderEmptyFiles() {
    return `<div class="qd-empty-mini">这里还没有题图。复制一张题目截图，然后按 Ctrl+V。</div>`;
  }

  function renderRegions(activeImage, activeItem) {
    const list = itemsForImage(activeImage?.id).filter((item) => item.rect);
    return list.map((item, index) => {
      const rect = item.rect || {};
      return `
        <button class="qd-region ${item.id === activeItem?.id ? "active" : ""} ${item.status || "new"}"
          style="left:${rect.x * 100}%;top:${rect.y * 100}%;width:${rect.w * 100}%;height:${rect.h * 100}%"
          data-qd-action="open-inspector" data-item-id="${item.id}" type="button" title="${escapeHtml(itemLabel(item, index))}">
          <span>${index + 1}</span>
        </button>
      `;
    }).join("");
  }

  function renderInspector(activeImage) {
    const item = items().find((entry) => entry.id === STATE.inspectItemId && entry.imageId === activeImage?.id);
    if (!item) return "";
    const log = item.savedLogId ? (window.MochiApp?.readStudyLogs?.() || []).find((entry) => entry.id === item.savedLogId) : null;
    return `
      <aside class="qd-inspector">
        <div class="qd-inspector-head">
          <div>
            <strong>${escapeHtml(itemLabel(item))}</strong>
            <span>${escapeHtml(subjectLabel(item.subject))}${item.nodeLabel ? ` · ${escapeHtml(item.nodeLabel)}` : ""}</span>
          </div>
          <button class="qd-icon-btn" data-qd-action="close-inspector" type="button" title="关闭">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="qd-inspector-body">
          <section>
            <h4>AI 对话</h4>
            ${item.chat?.length ? item.chat.slice(-4).map((msg) => `
              <p class="qd-inspector-chat ${msg.role}"><b>${msg.role === "assistant" ? "AI" : "我"}：</b>${escapeHtml(String(msg.content || "").slice(0, 180))}</p>
            `).join("") : `<p class="qd-inspector-empty">还没有问过 AI。</p>`}
          </section>
          <section>
            <h4>学习档案卡片</h4>
            ${log ? `
              <article class="qd-study-mini-card">
                <div><b>${escapeHtml(log.nodeLabel || item.nodeLabel || "未归档")}</b><span>${"★".repeat(Number(log.stars || 0))}</span></div>
                <p>${escapeHtml(log.painPoint || "暂无卡点")}</p>
                <small>${escapeHtml(log.routine || "暂无套路")}</small>
              </article>
            ` : `<p class="qd-inspector-empty">保存到学习档案后，这里会显示卡点和套路。</p>`}
          </section>
        </div>
      </aside>
    `;
  }

  function renderSelectionBox() {
    const selection = STATE.selecting;
    if (!selection?.preview) return "";
    const rect = selection.preview;
    return `<div class="qd-selection-box" style="left:${rect.x * 100}%;top:${rect.y * 100}%;width:${rect.w * 100}%;height:${rect.h * 100}%"></div>`;
  }

  function renderViewer(activeImage, activeItem) {
    if (!activeImage) {
      return `
        <section class="qd-dropzone">
          <span class="material-symbols-outlined">content_paste</span>
          <h2>粘贴一道题，开始题桌</h2>
          <p>复制截图后按 Ctrl+V，或从左侧上传图片。第一版按“一张图 = 一道题”处理。</p>
        </section>
      `;
    }
    return `
      <div class="qd-viewer-top">
        <div>
          <strong>${escapeHtml(activeImage.name)}</strong>
          <span>${escapeHtml(subjectLabel(activeImage.subject))} · ${activeImage.width || "?"}×${activeImage.height || "?"} · 拖拽题图可框选一道题</span>
        </div>
        <button class="btn btn-soft btn-sm" data-qd-action="rename" data-image-id="${activeImage.id}" type="button">
          <span class="material-symbols-outlined">edit</span>重命名
        </button>
      </div>
      <div class="qd-image-stage">
        <div class="qd-image-loading" data-qd-image-loading>读取题图中...</div>
        <div class="qd-image-wrap" data-qd-image-wrap>
          <img data-qd-image alt="${escapeHtml(activeImage.name)}" hidden />
          <div class="qd-region-layer">
            ${renderRegions(activeImage, activeItem)}
            ${renderSelectionBox()}
          </div>
        </div>
        ${renderInspector(activeImage)}
      </div>
      <p class="qd-local-note">题图保存在本机浏览器，普通 MochiStudy 备份暂不包含题图；题桌图片包会在后续阶段补齐。</p>
    `;
  }

  function renderPanelControls(mode) {
    if (mode === "expanded") {
      return `
        <div class="qd-panel-controls">
          <button class="qd-icon-btn" data-qd-action="panel-mode" data-panel-mode="open" type="button" title="回到题图">
            <span class="material-symbols-outlined">close_fullscreen</span>
          </button>
          <button class="qd-icon-btn" data-qd-action="panel-mode" data-panel-mode="collapsed" type="button" title="收起 AI 面板">
            <span class="material-symbols-outlined">right_panel_close</span>
          </button>
        </div>
      `;
    }
    return `
      <div class="qd-panel-controls">
        <button class="qd-icon-btn" data-qd-action="panel-mode" data-panel-mode="collapsed" type="button" title="收起 AI 面板">
          <span class="material-symbols-outlined">right_panel_close</span>
        </button>
        <button class="qd-icon-btn" data-qd-action="panel-mode" data-panel-mode="expanded" type="button" title="展开 AI 面板">
          <span class="material-symbols-outlined">open_in_full</span>
        </button>
      </div>
    `;
  }

  function renderPanel(activeImage, activeItem, mode = "open") {
    if (mode === "collapsed") {
      return `
        <button class="qd-rail-btn" data-qd-action="panel-mode" data-panel-mode="open" type="button" title="展开 AI 面板">
          <span class="material-symbols-outlined">psychology_alt</span>
          <strong>AI</strong>
        </button>
      `;
    }
    if (!activeImage) {
      return `
        <section class="qd-panel-empty">
          <div class="qd-panel-empty-head">
            <h3>AI 学习面板</h3>
            ${renderPanelControls(mode)}
          </div>
          <p>先粘贴或上传一道题图。</p>
        </section>
      `;
    }
    const item = activeItem || findItem(activeImage.id);
    if (!item) return `<section class="qd-panel-empty"><h3>这张题图缺少记录</h3><p>请重新上传。</p></section>`;
    const imageItems = itemsForImage(activeImage.id);
    const itemIndex = Math.max(0, imageItems.findIndex((entry) => entry.id === item.id));
    return `
      <div class="qd-panel-head">
        <div>
          <h3>${escapeHtml(itemLabel(item, itemIndex))}</h3>
          <p>${escapeHtml(activeImage.shortName || activeImage.name)}</p>
        </div>
        <div class="qd-panel-head-actions">
          <span class="qd-status-pill ${item.status}">${statusLabel(item.status)}</span>
          ${renderPanelControls(mode)}
        </div>
      </div>
      ${STATE.message ? `<div class="qd-message">${escapeHtml(STATE.message)}</div>` : ""}
      <div class="qd-chat" data-qd-chat>
        ${item.chat?.length ? item.chat.map(renderChatMessage).join("") : `<p class="qd-chat-empty">问它第一句，比如“这题怎么下手？”</p>`}
      </div>
      <div class="qd-question-box">
        <textarea data-qd-question rows="3" placeholder="问这道题，例如：这题第一步怎么想？"></textarea>
        <div class="qd-panel-actions">
          <button class="btn btn-primary btn-sm" data-qd-action="ask-ai" data-item-id="${item.id}" type="button" ${STATE.busy ? "disabled" : ""}>
            <span class="material-symbols-outlined">send</span>问 AI
          </button>
          <button class="btn btn-soft btn-sm" data-qd-action="draft" data-item-id="${item.id}" type="button" ${STATE.busy ? "disabled" : ""}>
            <span class="material-symbols-outlined">edit_note</span>生成记录草稿
          </button>
        </div>
      </div>
      ${renderDraftForm(item)}
    `;
  }

  function statusLabel(status) {
    if (status === "saved") return "已保存";
    if (status === "drafted") return "草稿";
    if (status === "asked") return "已问";
    return "新题";
  }

  function renderChatMessage(msg) {
    return `
      <article class="qd-chat-msg ${msg.role === "assistant" ? "assistant" : "user"}">
        <strong>${msg.role === "assistant" ? "AI" : "我"}</strong>
        <p>${formatText(msg.content)}</p>
      </article>
    `;
  }

  function nodeOptionTags(subject, current) {
    const nodes = nodesForSubject(subject);
    return [`<option value="">请选择知识点</option>`, ...nodes.map((node) => `<option value="${node.label}" ${node.label === current ? "selected" : ""}>${node.label}</option>`)].join("");
  }

  function subjectChoiceTags(current) {
    return SUBJECT_OPTIONS
      .filter(([key]) => key !== "uncategorized")
      .map(([value, label]) => `
        <label class="qd-choice-chip">
          <input data-qd-draft-subject type="radio" name="subject" value="${value}" ${value === current ? "checked" : ""} />
          <span>${label}</span>
        </label>
      `).join("");
  }

  function starChoiceTags(current) {
    return [1, 2, 3].map((value) => `
      <label class="qd-star-chip">
        <input type="radio" name="stars" value="${value}" ${Number(current) === value ? "checked" : ""} />
        <span>${"★".repeat(value)}${"☆".repeat(3 - value)}</span>
      </label>
    `).join("");
  }

  function renderDraftForm(item) {
    const draft = item.recordDraft;
    if (!draft) {
      return `
        <section class="qd-draft-empty">
          <strong>还没有学习记录草稿</strong>
          <p>讲完后点“生成记录草稿”，确认字段后保存进学习档案。</p>
        </section>
      `;
    }
    const subject = draft.subject && draft.subject !== "uncategorized" ? draft.subject : "math";
    return `
      <form class="qd-draft-form qd-draft-card" data-qd-draft-form data-item-id="${item.id}">
        <div class="qd-draft-card-head">
          <span class="material-symbols-outlined">auto_stories</span>
          <div>
            <h4>学习记录草稿</h4>
            <p>确认几项关键内容，保存后会进入学习档案。</p>
          </div>
        </div>
        <section class="qd-draft-section">
          <label class="qd-field">
            <span>科目</span>
            <div class="qd-choice-row">${subjectChoiceTags(subject)}</div>
          </label>
          <div class="qd-draft-grid">
            <label class="qd-field">知识点<select name="nodeLabel">${nodeOptionTags(subject, draft.nodeLabel)}</select></label>
            <label class="qd-field">学习日期<input name="date" type="date" value="${escapeHtml(draft.date || todayKey())}" /></label>
          </div>
          <label class="qd-field">
            <span>掌握星级</span>
            <div class="qd-star-row">${starChoiceTags(draft.stars)}</div>
          </label>
        </section>
        <section class="qd-draft-section qd-draft-core">
          <label class="qd-field qd-field-main">卡点记录<textarea name="painPoint" rows="2" placeholder="一句话写清真正卡住的地方">${escapeHtml(draft.painPoint)}</textarea></label>
          <label class="qd-field qd-field-main">原题<textarea name="originalQuestion" rows="3" placeholder="保留题干核心文字、数字和公式">${escapeHtml(draft.originalQuestion)}</textarea></label>
          <label class="qd-field qd-field-main">今日套路<textarea name="routine" rows="4" placeholder="最多三步：以后再见到这类题怎么做">${escapeHtml(draft.routine)}</textarea></label>
        </section>
        <details class="qd-draft-more">
          <summary><span class="material-symbols-outlined">tune</span>更多归档细节</summary>
          <div class="qd-draft-grid">
            <label class="qd-field">错误类型<input name="errorType" value="${escapeHtml(draft.meta?.errorType || "")}" /></label>
            <label class="qd-field">卡住步骤<input name="stuckStep" value="${escapeHtml(draft.meta?.stuckStep || "")}" /></label>
            <label class="qd-field">信心分<input name="confidence" type="number" min="0" max="5" value="${Number(draft.meta?.confidence || 0)}" /></label>
            <label class="qd-field">耗时分钟<input name="timeSpentMinutes" type="number" min="0" value="${Number(draft.meta?.timeSpentMinutes || 0)}" /></label>
          </div>
          <label class="qd-field">关键突破<input name="keyInsight" value="${escapeHtml(draft.meta?.keyInsight || "")}" /></label>
          <label class="qd-field">题型标签<input name="tags" value="${escapeHtml((draft.meta?.tags || []).join("、"))}" /></label>
        </details>
        <div class="qd-draft-save-row">
          <button class="btn btn-primary" data-qd-action="save-record" data-item-id="${item.id}" type="button">
            <span class="material-symbols-outlined">download_done</span>保存到学习档案
          </button>
        </div>
      </form>
    `;
  }

  async function hydrateImage(activeImage) {
    if (!activeImage || !STATE.container) return;
    const img = STATE.container.querySelector("[data-qd-image]");
    const loading = STATE.container.querySelector("[data-qd-image-loading]");
    if (!img) return;
    const url = await objectUrlFor(activeImage.id);
    if (!url) {
      if (loading) loading.textContent = "题图读取失败";
      return;
    }
    img.onload = () => {
      img.hidden = false;
      if (loading) loading.hidden = true;
    };
    img.src = url;
  }

  function pointerRect(event, wrap) {
    const box = wrap.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
    const y = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));
    return { x, y };
  }

  function normalizedRect(a, b) {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(a.x - b.x);
    const h = Math.abs(a.y - b.y);
    return { x, y, w, h };
  }

  function regionImage() {
    return images().find((image) => image.id === STATE.activeImageId) || null;
  }

  function persistDraftFromCurrentForm() {
    const form = STATE.container?.querySelector("[data-qd-draft-form]");
    const itemId = form?.dataset.itemId;
    if (!form || !itemId) return;
    updateItem(itemId, { recordDraft: formDraft(form) });
  }

  function bind(container) {
    if (container.__questionDeskBound) return;
    container.__questionDeskBound = true;
    container.addEventListener("paste", async (event) => {
      const file = [...(event.clipboardData?.items || [])]
        .find((item) => String(item.type || "").startsWith("image/"))
        ?.getAsFile();
      if (!file) return;
      event.preventDefault();
      await addImage(file);
    });
    container.addEventListener("change", async (event) => {
      if (event.target.matches("[data-qd-file]")) {
        await addImage(event.target.files?.[0]);
        event.target.value = "";
      }
      if (event.target.matches("[data-qd-draft-subject]")) {
        const form = event.target.closest("[data-qd-draft-form]");
        const itemId = form?.dataset.itemId;
        if (!itemId) return;
        const draft = { ...formDraft(form), subject: event.target.value, nodeLabel: "", nodeId: "" };
        updateItem(itemId, { recordDraft: draft, subject: draft.subject, nodeLabel: "", nodeId: "" });
        render(container);
      }
    });
    container.addEventListener("pointerdown", (event) => {
      const wrap = event.target.closest("[data-qd-image-wrap]");
      if (!wrap || event.target.closest("[data-qd-action]")) return;
      const img = wrap.querySelector("[data-qd-image]");
      if (!img || img.hidden) return;
      event.preventDefault();
      wrap.setPointerCapture?.(event.pointerId);
      const start = pointerRect(event, wrap);
      STATE.selecting = { pointerId: event.pointerId, start, preview: { ...start, w: 0, h: 0 } };
      render(container);
    });
    container.addEventListener("pointermove", (event) => {
      if (!STATE.selecting || STATE.selecting.pointerId !== event.pointerId) return;
      const wrap = event.target.closest("[data-qd-image-wrap]") || container.querySelector("[data-qd-image-wrap]");
      if (!wrap) return;
      STATE.selecting.preview = normalizedRect(STATE.selecting.start, pointerRect(event, wrap));
      render(container);
    });
    container.addEventListener("pointerup", (event) => {
      if (!STATE.selecting || STATE.selecting.pointerId !== event.pointerId) return;
      const image = regionImage();
      const rect = STATE.selecting.preview;
      STATE.selecting = null;
      if (image && rect && rect.w > 0.03 && rect.h > 0.03) createRegionItem(image, rect);
      render(container);
    });
    container.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-qd-action]");
      if (!button) return;
      const action = button.dataset.qdAction;
      if (action === "open-inspector") {
        STATE.activeItemId = button.dataset.itemId || "";
        STATE.inspectItemId = STATE.activeItemId;
        setPanelMode("open");
        render(container);
        return;
      }
      if (action === "close-inspector") {
        STATE.inspectItemId = "";
        render(container);
        return;
      }
      if (action === "panel-mode") {
        persistDraftFromCurrentForm();
        setPanelMode(button.dataset.panelMode || "open");
        render(container);
        return;
      }
      if (action === "filter") {
        STATE.filter = button.dataset.filter || "all";
        render(container);
        return;
      }
      if (action === "select-image") {
        STATE.activeImageId = button.dataset.imageId || "";
        saveUi({ activeImageId: STATE.activeImageId });
        STATE.message = "";
        render(container);
        return;
      }
      if (action === "rename") {
        renameImage(button.dataset.imageId);
        return;
      }
      if (action === "ask-ai") {
        await askAi(button.dataset.itemId);
        return;
      }
      if (action === "draft") {
        await generateDraft(button.dataset.itemId);
        return;
      }
      if (action === "save-record") {
        saveRecord(button.dataset.itemId);
      }
    });
  }

  function renameImage(imageId) {
    const img = images().find((entry) => entry.id === imageId);
    if (!img) return;
    const next = prompt("给这张题图起个名字", img.name);
    if (!next || !next.trim()) return;
    updateImage(imageId, { name: next.trim(), shortName: shortName(next.trim()) });
    const item = itemsForImage(imageId).find((entry) => !entry.rect) || findItem(imageId);
    if (item) updateItem(item.id, { title: shortName(next.trim()) });
    render(STATE.container);
  }

  function appendChat(item, messages) {
    updateItem(item.id, {
      chat: [...(item.chat || []), ...messages],
      status: "asked",
    });
    updateImage(item.imageId, { status: "asked" });
  }

  async function askAi(itemId) {
    const item = items().find((entry) => entry.id === itemId);
    if (!item) return;
    if (!hasAiConfig()) {
      STATE.message = "请先到设置页填写支持图片输入的 AI 配置。";
      render(STATE.container);
      return;
    }
    const textarea = STATE.container?.querySelector("[data-qd-question]");
    const question = String(textarea?.value || "").trim();
    if (!question) {
      window.MochiApp?.toast?.("先写一句你想问的问题");
      return;
    }
    const blob = await imageBlobForItem(item);
    if (!blob) {
      window.MochiApp?.toast?.("题图读取失败");
      return;
    }
    STATE.busy = true;
    STATE.message = "AI 正在看题...";
    appendChat(item, [{ role: "user", content: question, createdAt: nowIso() }]);
    render(STATE.container);
    try {
      const current = items().find((entry) => entry.id === itemId) || item;
      const history = (current.chat || [])
        .slice(-8)
        .map((msg) => `${msg.role === "assistant" ? "AI" : "学生"}：${msg.content}`)
        .join("\n\n");
      const response = await window.MochiAI.callAIWithImage(
        QUESTION_DESK_PROMPT,
        `这是本题的对话历史：\n${history}\n\n请继续回应学生。`,
        blob
      );
      appendChat(items().find((entry) => entry.id === itemId) || item, [{ role: "assistant", content: response || "我没有生成回复，请再试一次。", createdAt: nowIso() }]);
      STATE.message = "";
    } catch (error) {
      STATE.message = error.message || "AI 连接失败";
      window.MochiApp?.toast?.("AI 连接失败");
    } finally {
      STATE.busy = false;
      render(STATE.container);
    }
  }

  async function generateDraft(itemId) {
    const item = items().find((entry) => entry.id === itemId);
    if (!item) return;
    if (!hasAiConfig()) {
      STATE.message = "请先到设置页填写支持图片输入的 AI 配置。";
      render(STATE.container);
      return;
    }
    const blob = await imageBlobForItem(item);
    if (!blob) {
      window.MochiApp?.toast?.("题图读取失败");
      return;
    }
    STATE.busy = true;
    STATE.message = "正在生成学习记录草稿...";
    render(STATE.container);
    try {
      const history = (item.chat || [])
        .map((msg) => `${msg.role === "assistant" ? "AI" : "学生"}：${msg.content}`)
        .join("\n\n");
      const response = await window.MochiAI.callAIWithImage(
        QUESTION_DESK_PROMPT,
        `请根据这张题图和以下对话，生成【MochiStudy 学习记录草稿】。必须使用固定中文标签，不要输出 MOCHI-RECORD 块。\n\n${history || "学生还没有详细对话，请根据题图生成一份保守草稿，并把不确定的地方写短一点。"}`,
        blob
      );
      const draft = parseDraft(response || "");
      updateItem(item.id, {
        chat: [...(item.chat || []), { role: "assistant", content: response || "未生成草稿。", createdAt: nowIso() }],
        recordDraft: draft,
        subject: draft.subject || item.subject,
        nodeLabel: draft.nodeLabel || item.nodeLabel,
        nodeId: draft.nodeId || item.nodeId,
        status: "drafted",
      });
      if (draft.subject) updateImage(item.imageId, { subject: draft.subject, status: "asked" });
      STATE.message = draft.nodeId ? "草稿已生成，确认后保存。" : "草稿已生成，请手动确认科目和知识点。";
    } catch (error) {
      STATE.message = error.message || "生成草稿失败";
      window.MochiApp?.toast?.("生成草稿失败");
    } finally {
      STATE.busy = false;
      render(STATE.container);
    }
  }

  function formDraft(form) {
    const data = Object.fromEntries(new FormData(form));
    const subject = data.subject || "";
    const node = exactNode(subject, data.nodeLabel);
    return {
      subject,
      nodeId: node?.id || "",
      nodeLabel: node?.label || "",
      questionsCompleted: 1,
      stars: Number(data.stars || 0),
      painPoint: String(data.painPoint || "").trim(),
      originalQuestion: String(data.originalQuestion || "").trim(),
      routine: String(data.routine || "").trim(),
      date: data.date || todayKey(),
      meta: {
        source: "lesson",
        errorType: String(data.errorType || "").trim(),
        stuckStep: String(data.stuckStep || "").trim(),
        keyInsight: String(data.keyInsight || "").trim(),
        tags: parseTags(data.tags),
        confidence: parseScore(data.confidence, 5),
        timeSpentMinutes: parseMinutes(data.timeSpentMinutes),
      },
    };
  }

  function hasAiConfig() {
    const config = window.MochiAI?.readConfig?.() || {};
    return Boolean(config.baseUrl && config.apiKey && config.model);
  }

  function validateDraft(draft) {
    if (!["math", "physics", "chemistry"].includes(draft.subject)) return "请选择科目。";
    if (!draft.nodeId || !draft.nodeLabel) return "请选择预设知识点，不能使用 AI 自由写的知识点。";
    if (!draft.stars) return "请选择掌握星级。";
    if (!draft.painPoint) return "请补一句卡点记录。";
    if (!draft.originalQuestion || /^见(题桌)?原图/.test(draft.originalQuestion)) return "请补充可迁移的原题文字，不能只写见原图。";
    if (!draft.routine) return "请补充今日套路。";
    return "";
  }

  function saveRecord(itemId) {
    const form = STATE.container?.querySelector(`[data-qd-draft-form][data-item-id="${itemId}"]`);
    if (!form) return;
    const draft = formDraft(form);
    const error = validateDraft(draft);
    if (error) {
      STATE.message = error;
      render(STATE.container);
      return;
    }
    const before = window.MochiApp?.readStudyLogs?.()?.[0]?.id || "";
    const applied = window.MochiApp?.applyMochiRecord?.(draft);
    if (!applied) {
      STATE.message = "保存失败，请刷新后再试。";
      render(STATE.container);
      return;
    }
    const after = window.MochiApp?.readStudyLogs?.()?.[0]?.id || before;
    updateItem(itemId, {
      recordDraft: draft,
      savedLogId: after,
      status: "saved",
      subject: draft.subject,
      nodeId: draft.nodeId,
      nodeLabel: draft.nodeLabel,
    });
    const item = items().find((entry) => entry.id === itemId);
    if (item) updateImage(item.imageId, { status: "saved", subject: draft.subject, savedLogId: after });
    window.MochiPet?.renderMiniState?.();
    window.MochiFarm?.refreshFarmSummary?.();
    window.MochiCards?.refresh?.();
    STATE.message = "已保存到学习档案，复习队列也会自动接上。";
    window.MochiApp?.toast?.("题桌记录已保存");
    window.MochiApp?.sparkle?.(STATE.container, "★");
    render(STATE.container);
  }

  window.MochiQuestionDesk = { render, parseDraft, clearStorage };
})();
