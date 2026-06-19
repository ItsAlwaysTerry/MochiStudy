(function () {
  const DB_NAME = "mochi_question_desk";
  const DB_VERSION = 1;
  const IMAGE_STORE = "question_images_blob";
  const IMAGES_KEY = "question_desk_images";
  const ITEMS_KEY = "question_desk_items";
  const UI_KEY = "question_desk_ui_state";
  const NOTEBOOKS_KEY = "question_desk_notebooks";

  const SUBJECT_OPTIONS = [
    ["uncategorized", "未分类"],
    ["math", "数学"],
    ["physics", "物理"],
    ["chemistry", "化学"],
  ];

  const SOURCE_TYPE = "拍题";
  const PDF_SOURCE_TYPE = "PDF";
  const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js";
  const PDFJS_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  const DeskAI = window.MochiQuestionDeskAI || {};
  const Selection = window.MochiQuestionDeskSelection || {};
  let pdfJsPromise = null;

  const STATE = {
    container: null,
    activeImageId: "",
    activeItemId: "",
    inspectItemId: "",
    filter: "all",
    search: "",
    busy: false,
    message: "",
    grindOpen: false,
    grindSourceSelected: new Set(),
    grindSelected: new Set(),
    selecting: null,
    editingRegion: null,
    adjustingItemId: "",
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

  function lassoMode() {
    return readUi().lassoMode === true;
  }

  function setLassoMode(enabled) {
    saveUi({ lassoMode: Boolean(enabled) });
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
    localStorage.removeItem(NOTEBOOKS_KEY);
    STATE.activeImageId = "";
    STATE.filter = "all";
    STATE.search = "";
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

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("图片打包失败"));
      reader.readAsDataURL(blob);
    });
  }

  function dataUrlToBlob(dataUrl) {
    const [head, body] = String(dataUrl || "").split(",");
    const mimeType = (head.match(/data:([^;]+);base64/) || [])[1] || "image/png";
    const binary = atob(body || "");
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mimeType });
  }

  async function deleteBlob(id) {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(IMAGE_STORE, "readwrite");
      tx.objectStore(IMAGE_STORE).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  async function exportPackage() {
    const imageRows = images();
    const blobRows = [];
    for (const image of imageRows) {
      const blob = await getBlob(image.id);
      if (!blob) continue;
      blobRows.push({
        id: image.id,
        mimeType: blob.type || image.mimeType || "image/png",
        dataUrl: await blobToDataUrl(blob),
      });
    }
    return {
      version: "1.0",
      type: "mochi-question-desk-package",
      exportDate: todayKey(),
      data: {
        images: imageRows,
        items: items(),
        ui: readUi(),
        notebooks: readJson(NOTEBOOKS_KEY, []),
        blobs: blobRows,
      },
    };
  }

  async function importPackage(payload) {
    if (!payload || payload.type !== "mochi-question-desk-package" || !payload.data) {
      throw new Error("题桌包格式不正确");
    }
    const data = payload.data;
    const nextImages = Array.isArray(data.images) ? data.images : [];
    const nextItems = Array.isArray(data.items) ? data.items : [];
    const nextUi = data.ui && typeof data.ui === "object" && !Array.isArray(data.ui) ? data.ui : {};
    const nextNotebooks = Array.isArray(data.notebooks) ? data.notebooks : [];
    const blobRows = Array.isArray(data.blobs) ? data.blobs : [];
    await clearStorage();
    saveImages(nextImages);
    saveItems(nextItems);
    const activeImageId = nextUi.activeImageId || nextImages[0]?.id || "";
    writeJson(UI_KEY, { ...nextUi, activeImageId });
    writeJson(NOTEBOOKS_KEY, nextNotebooks);
    for (const row of blobRows) {
      if (!row?.id || !row.dataUrl) continue;
      await putBlob(row.id, dataUrlToBlob(row.dataUrl), row.mimeType || "image/png");
    }
    STATE.activeImageId = activeImageId;
    STATE.activeItemId = "";
    STATE.inspectItemId = "";
    STATE.imageUrls.clear();
    return { imageCount: nextImages.length, blobCount: blobRows.length, itemCount: nextItems.length };
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

  function fileBaseName(file) {
    return String(file?.name || "PDF试卷")
      .replace(/\.[^.]+$/, "")
      .replace(/[\\/:*?"<>|]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 28) || "PDF试卷";
  }

  function pdfPageName(file, pageNumber, totalPages) {
    const width = String(Math.max(1, totalPages || 1)).length;
    return `${fileBaseName(file)}-P${String(pageNumber).padStart(Math.max(2, width), "0")}`;
  }

  function normalizeImageEntry(img) {
    return {
      ...img,
      subject: ["math", "physics", "chemistry"].includes(img.subject) ? img.subject : "uncategorized",
    };
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
    const normalized = String(value ?? "")
      .replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => `$${formula}$`)
      .replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => `$${formula}$`);
    const rendered = window.MochiApp?.formatRichText?.(normalized) ?? escapeHtml(normalized);
    return rendered.replace(/\n/g, "<br>");
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

  function imageMatchesSearch(img, query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return true;
    const imageText = [
      img.name,
      img.shortName,
      img.date,
      subjectLabel(img.subject),
    ].join(" ").toLowerCase();
    if (imageText.includes(q)) return true;
    return itemsForImage(img.id).some((item) => [
      item.title,
      item.nodeLabel,
      item.recordDraft?.painPoint,
      item.recordDraft?.originalQuestion,
      item.recognition?.questionNumber,
      item.recognition?.summary,
      item.recognition?.transcript,
    ].join(" ").toLowerCase().includes(q));
  }

  function imageMatchesFilter(img, filter) {
    if (filter === "all") return true;
    if (filter === "uncategorized") return !["math", "physics", "chemistry"].includes(img.subject);
    return ["math", "physics", "chemistry"].includes(filter) && img.subject === filter;
  }

  function filterImages(list, filter) {
    return list
      .map(normalizeImageEntry)
      .filter((img) => imageMatchesFilter(img, filter) && imageMatchesSearch(img, STATE.search));
  }

  function findActiveImage() {
    const list = images().map(normalizeImageEntry);
    if (!STATE.activeImageId && readUi().activeImageId) STATE.activeImageId = readUi().activeImageId;
    const active = list.find((img) => img.id === STATE.activeImageId);
    const visible = filterImages(list, STATE.filter || "all");
    if (active && visible.some((img) => img.id === active.id)) return active;
    return visible[0] || null;
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
    if (item.rect) return item.nodeLabel || item.recordDraft?.nodeLabel || item.title || "题目标记";
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

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => reject(new Error("脚本加载失败")), { once: true });
        if (window.pdfjsLib) resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("PDF.js 加载失败"));
      document.head.appendChild(script);
    });
  }

  async function loadPdfJs() {
    if (window.pdfjsLib) return window.pdfjsLib;
    if (!pdfJsPromise) {
      pdfJsPromise = loadScript(PDFJS_URL).then(() => {
        if (!window.pdfjsLib) throw new Error("PDF.js 没有初始化");
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        return window.pdfjsLib;
      }).catch((error) => {
        pdfJsPromise = null;
        throw error;
      });
    }
    return pdfJsPromise;
  }

  async function renderPdfPage(page) {
    const first = page.getViewport({ scale: 1 });
    const maxSide = Math.max(first.width, first.height) || 1;
    const scale = Math.min(2.2, Math.max(1.3, 2200 / maxSide));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise((resolve) => canvas.toBlob((next) => resolve(next), "image/png"));
    page.cleanup?.();
    if (!blob) throw new Error("PDF 页面渲染失败");
    return { blob, width: canvas.width, height: canvas.height };
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

  function grindLabel(index) {
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(index) || String(index + 1);
  }

  async function blobForGrindCandidate(candidate) {
    if (candidate.kind === "item" && candidate.itemId) {
      const item = items().find((entry) => entry.id === candidate.itemId);
      if (item) return imageBlobForItem(item);
    }
    if (candidate.rect) return imageBlobForItem({ imageId: candidate.imageId, rect: candidate.rect });
    return getBlob(candidate.imageId);
  }

  async function buildGrindOverview(selectedCandidates) {
    const entries = [];
    for (let index = 0; index < selectedCandidates.length; index += 1) {
      const candidate = selectedCandidates[index];
      const blob = await blobForGrindCandidate(candidate);
      if (!blob) continue;
      const bitmap = await bitmapFromBlob(blob);
      entries.push({ candidate, bitmap, label: grindLabel(index) });
    }
    if (entries.length < 2) throw new Error("至少需要两张可读取的题图。");

    const tileW = 520;
    const tileH = 360;
    const gap = 18;
    const cols = entries.length <= 3 ? entries.length : 2;
    const rows = Math.ceil(entries.length / cols);
    const canvas = document.createElement("canvas");
    canvas.width = cols * tileW + (cols + 1) * gap;
    canvas.height = rows * tileH + (rows + 1) * gap;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "700 26px sans-serif";
    ctx.textBaseline = "middle";

    entries.forEach((entry, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = gap + col * (tileW + gap);
      const y = gap + row * (tileH + gap);
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#dbe3ee";
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, tileW, tileH);
      ctx.strokeRect(x, y, tileW, tileH);
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(x, y, 52, 42);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(entry.label, x + 18, y + 22);

      const maxW = tileW - 28;
      const maxH = tileH - 62;
      const scale = Math.min(maxW / entry.bitmap.width, maxH / entry.bitmap.height);
      const drawW = Math.max(1, Math.round(entry.bitmap.width * scale));
      const drawH = Math.max(1, Math.round(entry.bitmap.height * scale));
      const dx = x + Math.round((tileW - drawW) / 2);
      const dy = y + 50 + Math.round((maxH - drawH) / 2);
      ctx.drawImage(entry.bitmap, dx, dy, drawW, drawH);
      entry.bitmap.close?.();
    });

    const blob = await new Promise((resolve) => canvas.toBlob((next) => resolve(next), "image/jpeg", 0.88));
    if (!blob) throw new Error("总览图生成失败。");
    return {
      blob,
      labels: entries.map((entry) => entry.label),
      byLabel: new Map(entries.map((entry) => [entry.label, entry.candidate])),
      legend: entries.map((entry) => `${entry.label}=${entry.candidate.title || entry.candidate.sourceName || ""}`),
    };
  }

  async function createImageRecord(blob, options = {}) {
    const date = options.date || todayKey();
    const id = uid("img");
    const itemId = uid("item");
    const dims = options.width && options.height ? { width: options.width, height: options.height } : await imageDimensions(blob);
    const name = options.name || defaultName(date);
    await putBlob(id, blob, options.mimeType || blob.type || "image/png");
    const image = {
      id,
      name,
      shortName: shortName(name),
      subject: options.subject || "uncategorized",
      sourceType: options.sourceType || SOURCE_TYPE,
      date,
      mimeType: options.mimeType || blob.type || "image/png",
      width: dims.width,
      height: dims.height,
      status: "new",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      savedLogId: "",
      ...(options.extra || {}),
    };
    const item = {
      id: itemId,
      imageId: id,
      subject: image.subject,
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
    return { image, item };
  }

  async function addImage(file) {
    if (!file || !String(file.type || "").startsWith("image/")) {
      window.MochiApp?.toast?.("请粘贴或上传图片");
      return;
    }
    const record = await createImageRecord(file);
    saveImages([record.image, ...images()]);
    saveItems([record.item, ...items()]);
    STATE.activeImageId = record.image.id;
    STATE.filter = "uncategorized";
    STATE.search = "";
    saveUi({ activeImageId: record.image.id, filter: STATE.filter, search: "" });
    window.MochiApp?.toast?.("题图已加入题桌");
    render(STATE.container);
  }

  async function addPdf(file) {
    if (!file) return;
    STATE.busy = true;
    STATE.message = "正在把 PDF 拆成题图...";
    render(STATE.container);
    try {
      const pdfjsLib = await loadPdfJs();
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const date = todayKey();
      const pdfId = uid("pdf");
      const nextImages = [];
      const nextItems = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const rendered = await renderPdfPage(page);
        const name = pdfPageName(file, pageNumber, pdf.numPages);
        const record = await createImageRecord(rendered.blob, {
          date,
          name,
          sourceType: PDF_SOURCE_TYPE,
          mimeType: "image/png",
          width: rendered.width,
          height: rendered.height,
          extra: {
            pdfId,
            pdfName: fileBaseName(file),
            pdfPage: pageNumber,
            pdfPageCount: pdf.numPages,
          },
        });
        nextImages.push(record.image);
        nextItems.push(record.item);
      }
      if (!nextImages.length) throw new Error("PDF 没有可导入的页面");
      saveImages([...nextImages, ...images()]);
      saveItems([...nextItems, ...items()]);
      STATE.activeImageId = nextImages[0].id;
      STATE.filter = "uncategorized";
      STATE.search = "";
      saveUi({ activeImageId: nextImages[0].id, filter: STATE.filter, search: "" });
      window.MochiApp?.toast?.(`PDF 已导入：${nextImages.length} 页`);
    } catch (error) {
      const message = String(error?.message || "");
      window.MochiApp?.toast?.(message.includes("PDF.js") || message.includes("脚本加载") ? "PDF 模块加载失败，请检查网络后重试" : message || "PDF 导入失败");
    } finally {
      STATE.busy = false;
      STATE.message = "";
      render(STATE.container);
    }
  }

  async function addFile(file) {
    const type = String(file?.type || "");
    const name = String(file?.name || "").toLowerCase();
    if (type === "application/pdf" || name.endsWith(".pdf")) {
      await addPdf(file);
      return;
    }
    await addImage(file);
  }

  function updateImage(imageId, patch) {
    saveImages(images().map((img) => img.id === imageId ? { ...img, ...(patch || {}), updatedAt: nowIso() } : img));
  }

  function updateImageSubject(imageId, subject, patch = {}) {
    if (!["math", "physics", "chemistry"].includes(subject)) return;
    updateImage(imageId, { ...patch, subject });
    if (STATE.filter !== "all" && STATE.filter !== subject) {
      STATE.filter = subject;
      saveUi({ filter: STATE.filter });
    }
  }

  async function deleteImages(imageIds) {
    const ids = new Set((imageIds || []).filter(Boolean));
    if (!ids.size) return;
    saveImages(images().filter((img) => !ids.has(img.id)));
    saveItems(items().filter((item) => !ids.has(item.imageId)));
    ids.forEach((id) => {
      const url = STATE.imageUrls.get(id);
      if (url) URL.revokeObjectURL(url);
      STATE.imageUrls.delete(id);
    });
    await Promise.all([...ids].map((id) => deleteBlob(id)));
    if (ids.has(STATE.activeImageId)) STATE.activeImageId = "";
    if (ids.has(readUi().activeImageId)) saveUi({ activeImageId: "" });
    STATE.activeItemId = "";
    STATE.inspectItemId = "";
  }

  function updateItem(itemId, patch) {
    saveItems(items().map((item) => item.id === itemId ? { ...item, ...(patch || {}), updatedAt: nowIso() } : item));
  }

  function contextVersion(item) {
    const value = Number(item?.contextVersion || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function messageContextVersion(msg) {
    const value = Number(msg?.contextVersion || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function rectChangedEnough(before, after) {
    if (!before || !after) return false;
    const delta = Math.abs((before.x || 0) - (after.x || 0))
      + Math.abs((before.y || 0) - (after.y || 0))
      + Math.abs((before.w || 0) - (after.w || 0))
      + Math.abs((before.h || 0) - (after.h || 0));
    return delta > 0.015;
  }

  function contextPatchAfterRectChange(item, nextRect) {
    if (!rectChangedEnough(item?.rect, nextRect)) return {};
    const nextVersion = contextVersion(item) + 1;
    const recognition = item?.recognition ? {
      ...item.recognition,
      stale: true,
      isComplete: false,
      warning: "选区已调整，请重新识别确认题干。",
      updatedAt: nowIso(),
    } : null;
    return {
      contextVersion: nextVersion,
      contextChangedAt: nowIso(),
      recognition,
    };
  }

  function splitChatByContext(item) {
    const version = contextVersion(item);
    const active = [];
    const archived = [];
    (item?.chat || []).forEach((msg) => {
      if (messageContextVersion(msg) === version) active.push(msg);
      else archived.push(msg);
    });
    return { active, archived };
  }

  function recognitionContextText(item) {
    const info = item?.recognition;
    if (!info || info.stale) return "";
    return [
      info.questionNumber ? `题号：${info.questionNumber}` : "",
      info.subject && info.subject !== "unknown" ? `科目：${recognitionSubjectLabel(info.subject)}` : "",
      info.summary ? `题干摘要：${info.summary}` : "",
      info.transcript ? `题干转写：${info.transcript}` : "",
    ].filter(Boolean).join("\n");
  }

  function deleteItem(itemId) {
    const target = items().find((item) => item.id === itemId);
    if (!target || regionFinalized(target)) return false;
    saveItems(items().filter((item) => item.id !== itemId));
    if (STATE.activeItemId === itemId) STATE.activeItemId = "";
    if (STATE.inspectItemId === itemId) STATE.inspectItemId = "";
    return true;
  }

  function clearDraftRegionsForImage(imageId) {
    if (!imageId) return false;
    const draftIds = new Set(items()
      .filter((item) => item.imageId === imageId && item.rect && !regionFinalized(item))
      .map((item) => item.id));
    if (!draftIds.size) return false;
    saveItems(items().filter((item) => !draftIds.has(item.id)));
    if (draftIds.has(STATE.activeItemId)) STATE.activeItemId = "";
    if (draftIds.has(STATE.inspectItemId)) STATE.inspectItemId = "";
    return true;
  }

  function pendingRegionForImage(imageId) {
    return items().find((item) => item.imageId === imageId && item.rect && !regionFinalized(item)) || null;
  }

  function createRegionItem(image, rect, options = {}) {
    if (!image || !rect) return null;
    const safeRect = Selection.expandSelectionRect(rect);
    const item = {
      id: uid("item"),
      imageId: image.id,
      subject: image.subject || "uncategorized",
      nodeId: "",
      nodeLabel: "",
      status: "new",
      title: "题目标记",
      rect: safeRect,
      chat: [],
      recordDraft: null,
      savedLogId: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const remaining = items().filter((entry) => !(entry.imageId === image.id && entry.rect && !regionFinalized(entry)));
    saveItems([item, ...remaining]);
    STATE.activeItemId = item.id;
    STATE.inspectItemId = "";
    setPanelMode("open");
    if (!options.quiet) window.MochiApp?.toast?.("已圈出选区，可以先调整再问 AI");
    return item;
  }

  function render(container) {
    if (!container) return;
    STATE.container = container;
    bind(container);
    const ui = readUi();
    STATE.filter = ui.filter || STATE.filter || "all";
    STATE.search = ui.search || STATE.search || "";
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
      ${STATE.grindOpen ? renderGrindSheet() : ""}
    `;
    hydrateImage(activeImage);
  }

  function renderFilterButton(key, label, count) {
    return `
      <button class="qd-filter ${STATE.filter === key ? "active" : ""}" data-qd-action="filter" data-filter="${escapeHtml(key)}" type="button">
        <span>${escapeHtml(label)}</span><b>${count}</b>
      </button>
    `;
  }

  function renderSidebar(activeImage) {
    const all = images().map(normalizeImageEntry);
    const visible = filterImages(all, STATE.filter);
    const filters = [
      ["all", "全部", all.length],
      ["uncategorized", "未整理", all.filter((i) => i.subject === "uncategorized").length],
      ["math", "数学", all.filter((i) => i.subject === "math").length],
      ["physics", "物理", all.filter((i) => i.subject === "physics").length],
      ["chemistry", "化学", all.filter((i) => i.subject === "chemistry").length],
    ];
    return `
      <div class="qd-head">
        <div>
          <h2>题桌</h2>
          <p>粘题、命名，按科目找回来。</p>
        </div>
        <button class="btn btn-soft btn-sm qd-growth-btn" data-route="home" type="button">
          <span class="material-symbols-outlined">psychiatry</span>我的成长
        </button>
      </div>
      <div class="qd-actions">
        <div class="qd-action-row">
          <label class="btn btn-primary btn-sm qd-upload">
            <span class="material-symbols-outlined">add_photo_alternate</span>上传题图/PDF
            <input data-qd-file type="file" accept="image/*,.pdf,application/pdf" multiple hidden />
          </label>
          <button class="btn btn-soft btn-sm qd-grind-btn" data-qd-action="open-grind" type="button">
            <span class="material-symbols-outlined">format_list_numbered</span>啃卷子
          </button>
        </div>
        <p class="qd-hint">也可以复制截图后在题桌按 Ctrl+V；PDF 会自动拆成页。</p>
      </div>
      <label class="qd-search">
        <span class="material-symbols-outlined">search</span>
        <input data-qd-search value="${escapeHtml(STATE.search)}" placeholder="搜名字、知识点、题干" />
      </label>
      <div class="qd-filter-list">
        ${filters.map(([key, label, count]) => renderFilterButton(key, label, count)).join("")}
      </div>
      <div class="qd-file-list" data-qd-file-list>
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
    return `<div class="qd-empty-mini">${escapeHtml(emptyFilterText())}</div>`;
  }

  function grindCandidates() {
    const allItems = items();
    return images()
      .map(normalizeImageEntry)
      .flatMap((img) => {
        const regions = allItems.filter((item) => item.imageId === img.id && item.rect);
        if (regions.length) {
          return regions.map((item, index) => ({
            key: `item:${item.id}`,
            kind: "item",
            imageId: img.id,
            itemId: item.id,
            subject: item.subject || img.subject,
            date: img.date,
            title: itemLabel(item, index),
            sourceName: img.shortName || img.name,
            status: item.status || "new",
          }));
        }
        return [{
          key: `image:${img.id}`,
          kind: "image",
          imageId: img.id,
          itemId: "",
          subject: img.subject,
          date: img.date,
          title: img.shortName || img.name,
          sourceName: "整张题图",
          status: img.status || "new",
        }];
      })
      .slice(0, 40);
  }

  function grindPlan() {
    const value = readUi().grindPlan;
    return value && Array.isArray(value.items) ? value : null;
  }

  function initGrindSelection(force = false) {
    const candidates = grindScan() ? grindCandidates() : [];
    const validKeys = new Set(candidates.map((candidate) => candidate.key));
    const validSelected = [...STATE.grindSelected].filter((key) => validKeys.has(key));
    if (!force && validSelected.length) {
      STATE.grindSelected = new Set(validSelected);
      return;
    }
    STATE.grindSelected = new Set(candidates.slice(0, 8).map((candidate) => candidate.key));
  }

  function cleanScanRect(rect) {
    if (!rect || typeof rect !== "object") return null;
    const x = Number(rect.x);
    const y = Number(rect.y);
    const w = Number(rect.w);
    const h = Number(rect.h);
    if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return null;
    return {
      x: Math.max(0, Math.min(0.98, x)),
      y: Math.max(0, Math.min(0.98, y)),
      w: Math.max(0.02, Math.min(1, w)),
      h: Math.max(0.02, Math.min(1, h)),
    };
  }

  function questionNumberText(value) {
    const text = String(value || "").trim();
    if (!text) return "未标号";
    if (/^第.+题$/.test(text)) return text;
    return `第${text.replace(/^第/, "").replace(/题$/, "")}题`;
  }

  function grindSources() {
    return images().map(normalizeImageEntry).slice(0, 60);
  }

  function grindScan() {
    const value = readUi().grindScan;
    return value && Array.isArray(value.questions) ? value : null;
  }

  function regionCandidate(img, item, index = 0) {
    const questionNumber = item.recognition?.questionNumber || "";
    const title = item.recognition?.summary || item.recordDraft?.originalQuestion || itemLabel(item, index) || "题目区域";
    return {
      key: `item:${item.id}`,
      kind: "item",
      imageId: img.id,
      itemId: item.id,
      subject: item.subject || img.subject,
      date: img.date,
      title: `${questionNumberText(questionNumber)} · ${title}`,
      questionNumber,
      rect: cleanScanRect(item.rect),
      sourceName: img.shortName || img.name,
      status: item.status || "new",
    };
  }

  function imageCandidate(img) {
    return {
      key: `image:${img.id}`,
      kind: "image",
      imageId: img.id,
      itemId: "",
      subject: img.subject,
      date: img.date,
      title: `${questionNumberText("")} · ${img.shortName || img.name}`,
      questionNumber: "",
      rect: null,
      sourceName: img.shortName || img.name,
      status: img.status || "new",
    };
  }

  function duplicateQuestionKey(question) {
    const rawTitle = String(question.title || question.summary || "");
    if (/未识别题号|整张图未拆出具体题|题目标记/.test(rawTitle)) return "";
    const title = rawTitle
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "")
      .slice(0, 32);
    const number = String(question.questionNumber || "").replace(/[^\p{L}\p{N}]+/gu, "");
    if (!title && !number) return "";
    return [question.subject || "", number, title].join("::");
  }

  function dedupeQuestions(questions) {
    const seen = new Set();
    const unique = [];
    const duplicates = [];
    (questions || []).forEach((question) => {
      const key = duplicateQuestionKey(question);
      if (key && seen.has(key)) {
        duplicates.push(question);
        return;
      }
      if (key) seen.add(key);
      unique.push(question);
    });
    return { unique, duplicates };
  }

  function fallbackQuestionCandidates() {
    const allItems = items();
    return grindSources()
      .flatMap((img) => {
        const regions = allItems.filter((item) => item.imageId === img.id && item.rect);
        return regions.length ? regions.map((item, index) => regionCandidate(img, item, index)) : [imageCandidate(img)];
      })
      .slice(0, 80);
  }

  function regionCandidate(img, item, index = 0) {
    const questionNumber = item.recognition?.questionNumber || "";
    const fallback = item.recognition ? itemLabel(item, index) : "手动框选 · 未识别题号";
    const title = item.recognition?.summary || item.recordDraft?.originalQuestion || fallback;
    return {
      key: `item:${item.id}`,
      kind: "item",
      imageId: img.id,
      itemId: item.id,
      subject: item.subject || img.subject,
      date: img.date,
      title: `${questionNumberText(questionNumber)} · ${title}`,
      questionNumber,
      rect: cleanScanRect(item.rect),
      sourceName: img.shortName || img.name,
      status: item.status || "new",
    };
  }

  function grindCandidates() {
    const scan = grindScan();
    const imageMap = new Map(grindSources().map((img) => [img.id, img]));
    if (scan?.questions?.length) {
      return scan.questions
        .map((entry, index) => {
          const img = imageMap.get(entry.imageId);
          if (!img) return null;
          const questionNumber = String(entry.questionNumber || "").trim();
          const title = entry.title || entry.summary || img.shortName || img.name;
          return {
            key: entry.key || `scan:${entry.imageId}:${index}`,
            kind: entry.kind || "scan",
            imageId: entry.imageId,
            itemId: entry.itemId || "",
            subject: ["math", "physics", "chemistry"].includes(entry.subject) ? entry.subject : img.subject,
            date: entry.date || img.date,
            title: `${questionNumberText(questionNumber)} · ${title}`,
            questionNumber,
            rect: cleanScanRect(entry.rect),
            sourceName: entry.sourceName || img.shortName || img.name,
            status: entry.status || "new",
          };
        })
        .filter(Boolean)
        .slice(0, 80);
    }
    return fallbackQuestionCandidates();
  }

  function initGrindSelection(force = false) {
    const candidates = grindScan() ? grindCandidates() : [];
    const validKeys = new Set(candidates.map((candidate) => candidate.key));
    const validSelected = [...STATE.grindSelected].filter((key) => validKeys.has(key));
    if (!force && validSelected.length) {
      STATE.grindSelected = new Set(validSelected);
      return;
    }
    STATE.grindSelected = new Set(candidates.slice(0, 12).map((candidate) => candidate.key));
  }

  function initGrindSourceSelection(force = false) {
    const sources = grindSources();
    const validIds = new Set(sources.map((source) => source.id));
    const validSelected = [...STATE.grindSourceSelected].filter((id) => validIds.has(id));
    if (!force && validSelected.length) {
      STATE.grindSourceSelected = new Set(validSelected);
      return;
    }
    STATE.grindSourceSelected = new Set(sources.map((source) => source.id));
  }

  function renderGrindSheet() {
    initGrindSelection();
    const candidates = grindScan() ? grindCandidates() : [];
    const selectedCount = [...STATE.grindSelected].filter((key) => candidates.some((item) => item.key === key)).length;
    const plan = grindPlan();
    return `
      <div class="qd-grind-overlay">
        <section class="qd-grind-sheet" role="dialog" aria-modal="true" aria-label="啃卷子排序">
          <div class="qd-grind-head">
            <div>
              <h3>啃卷子排序</h3>
              <p>默认把题目/卷子素材当作不会；已经会的取消勾选就行。</p>
            </div>
            <button class="qd-icon-btn" data-qd-action="close-grind" type="button" title="关闭">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="qd-grind-body">
            <section class="qd-grind-picker">
              <div class="qd-grind-section-head">
                <strong>不会的题</strong>
                <span>已选 ${selectedCount} 个，最多 8 个</span>
              </div>
              <div class="qd-grind-list">
                ${candidates.length ? candidates.map(renderGrindCandidate).join("") : `<p class="qd-empty-mini">现在没有可排序素材。先粘几张题再来排序。</p>`}
              </div>
              <button class="btn btn-primary qd-grind-run" data-qd-action="run-grind" type="button" ${selectedCount < 2 || selectedCount > 8 || STATE.busy ? "disabled" : ""}>
                <span class="material-symbols-outlined">auto_awesome</span>${STATE.busy ? "AI 正在排序..." : "让 AI 排优先级"}
              </button>
              <p class="qd-hint">已经框选过的卷子会按题目列出；没框选过的图片按整张图列出。默认前 8 个按“不会”处理。</p>
            </section>
            <section class="qd-grind-result">
              <div class="qd-grind-section-head">
                <strong>推荐顺序</strong>
                ${plan ? `<span>${escapeHtml(shortDate(plan.createdAt))}</span>` : ""}
              </div>
              ${plan ? renderGrindPlan(plan) : `<div class="qd-grind-empty">排序后会在这里出现“先学哪张”和原因。</div>`}
            </section>
          </div>
        </section>
      </div>
    `;
  }

  function renderGrindCandidate(candidate) {
    const checked = STATE.grindSelected.has(candidate.key);
    return `
      <label class="qd-grind-choice ${checked ? "selected" : "skipped"}">
        <input data-qd-grind-check type="checkbox" value="${escapeHtml(candidate.key)}" ${checked ? "checked" : ""} />
        <span>
          <strong>${escapeHtml(candidate.title)}</strong>
          <small>${escapeHtml(candidate.kind === "item" ? candidate.sourceName : "整张题图")} · ${escapeHtml(subjectLabel(candidate.subject))} · ${escapeHtml(shortDate(candidate.date))} · ${checked ? "不会，参与排序" : "已会，暂不排序"}</small>
        </span>
      </label>
    `;
  }

  function renderGrindPlan(plan) {
    return `
      <div class="qd-grind-order">
        ${plan.items.map((item) => {
          return `
            <article class="qd-grind-card">
              <b>${item.rank}</b>
              <div>
                <strong>${escapeHtml(item.title || item.sourceName || "题图")}</strong>
                <p>${escapeHtml(item.reason || "先学这道，性价比较高。")}</p>
                <small>考频 ${item.frequency || "?"} · 提分 ${item.scoreGain || "?"} · 优先 ${item.priority || "?"}</small>
              </div>
              <button class="btn btn-soft btn-sm" data-qd-action="start-grind-item" data-image-id="${escapeHtml(item.imageId)}" data-item-id="${escapeHtml(item.itemId || "")}" type="button">开始学</button>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }

  function refreshGrindQuestionControls(container) {
    const candidates = grindCandidates();
    const selectedCount = [...STATE.grindSelected].filter((key) => candidates.some((item) => item.key === key)).length;
    const overLimit = selectedCount > 12;
    const count = container.querySelector("[data-qd-grind-count]");
    if (count) count.textContent = `已选 ${selectedCount} 题${overLimit ? "，最多 12 题" : ""}`;
    const run = container.querySelector('[data-qd-action="run-grind"]');
    if (run) run.disabled = !grindScan() || selectedCount < 2 || overLimit || STATE.busy;
    container.querySelectorAll("[data-qd-grind-check]").forEach((input) => {
      const choice = input.closest(".qd-grind-choice");
      if (!choice) return;
      choice.classList.toggle("selected", input.checked);
      choice.classList.toggle("skipped", !input.checked);
      const meta = choice.querySelector("[data-qd-grind-choice-state]");
      if (meta) meta.textContent = input.checked ? "不会，参与排序" : "已会，暂不排序";
    });
  }

  function renderGrindCandidate(candidate) {
    const checked = STATE.grindSelected.has(candidate.key);
    const sourceType = candidate.kind === "item" ? "手动框选" : candidate.rect ? "AI识别区域" : "整张图";
    return `
      <label class="qd-grind-choice ${checked ? "selected" : "skipped"}">
        <input data-qd-grind-check type="checkbox" value="${escapeHtml(candidate.key)}" ${checked ? "checked" : ""} />
        <span>
          <strong>${escapeHtml(candidate.title)}</strong>
          <small>${escapeHtml(sourceType)} · ${escapeHtml(candidate.sourceName)} · ${escapeHtml(subjectLabel(candidate.subject))} · <b data-qd-grind-choice-state>${checked ? "不会，参与排序" : "已会，暂不排序"}</b></small>
        </span>
      </label>
    `;
  }

  function grindSession() {
    const value = readUi().grindSession;
    return value && value.active && Array.isArray(value.items) && value.items.length ? value : null;
  }

  function currentGrindSessionItem() {
    const session = grindSession();
    if (!session) return null;
    const index = Math.max(0, Math.min(session.items.length - 1, Number(session.currentIndex) || 0));
    return session.items[index] || null;
  }

  function isCurrentGrindItem(item) {
    const current = currentGrindSessionItem();
    if (!item || !current) return false;
    return Boolean((current.itemId && current.itemId === item.id) || (!current.itemId && current.imageId === item.imageId && current.rect && item.rect));
  }

  function saveGrindSession(session) {
    saveUi({ grindSession: session || null });
  }

  function activateGrindPlanItem(planItem) {
    if (!planItem?.imageId) return null;
    const img = images().find((entry) => entry.id === planItem.imageId);
    if (!img) return null;
    let nextItemId = planItem.itemId || "";
    if (!nextItemId && planItem.rect) {
      const created = createRegionItem(normalizeImageEntry(img), planItem.rect, { quiet: true });
      if (created) {
        nextItemId = created.id;
        const recognition = {
          questionNumber: planItem.questionNumber || "",
          subject: ["math", "physics", "chemistry"].includes(planItem.subject) ? planItem.subject : "unknown",
          summary: planItem.title || "",
          transcript: "",
          isComplete: true,
          warning: "",
          raw: "",
          updatedAt: nowIso(),
        };
        updateItem(created.id, { recognition, title: planItem.title || created.title, subject: planItem.subject || created.subject });
      }
    }
    STATE.activeImageId = planItem.imageId;
    STATE.activeItemId = nextItemId || "";
    STATE.inspectItemId = "";
    STATE.filter = "all";
    STATE.search = "";
    STATE.grindOpen = false;
    setPanelMode("open");
    saveUi({ activeImageId: planItem.imageId, filter: "all", search: "" });
    return { imageId: planItem.imageId, itemId: nextItemId };
  }

  function startGrindSession(targetKey = "") {
    const plan = grindPlan();
    const planItems = Array.isArray(plan?.items) ? plan.items : [];
    if (!planItems.length) return;
    const startIndex = Math.max(0, planItems.findIndex((item) => item.targetKey === targetKey));
    const currentIndex = startIndex >= 0 ? startIndex : 0;
    const session = {
      active: true,
      items: planItems,
      currentIndex,
      startedAt: nowIso(),
      updatedAt: nowIso(),
    };
    saveGrindSession(session);
    activateGrindSessionIndex(currentIndex, session);
  }

  function activateGrindSessionIndex(index, session = grindSession()) {
    if (!session?.items?.length) return;
    STATE.adjustingItemId = "";
    const currentIndex = Math.max(0, Math.min(session.items.length - 1, Number(index) || 0));
    const planItem = session.items[currentIndex];
    const activated = activateGrindPlanItem(planItem);
    const nextSession = {
      ...session,
      currentIndex,
      updatedAt: nowIso(),
      items: session.items.map((item, idx) => idx === currentIndex && activated?.itemId ? { ...item, itemId: activated.itemId } : item),
    };
    saveGrindSession(nextSession);
    render(STATE.container);
  }

  function moveGrindSession(delta) {
    const session = grindSession();
    if (!session) return;
    activateGrindSessionIndex((Number(session.currentIndex) || 0) + delta, session);
  }

  function exitGrindSession() {
    saveGrindSession(null);
    STATE.adjustingItemId = "";
    render(STATE.container);
  }

  function editCurrentGrindRegion() {
    const session = grindSession();
    const current = currentGrindSessionItem();
    if (!session || !current) return;
    let itemId = current.itemId || "";
    if (!itemId && current.rect) {
      const activated = activateGrindPlanItem(current);
      itemId = activated?.itemId || "";
      const index = Math.max(0, Math.min(session.items.length - 1, Number(session.currentIndex) || 0));
      saveGrindSession({
        ...session,
        updatedAt: nowIso(),
        items: session.items.map((item, idx) => idx === index && itemId ? { ...item, itemId } : item),
      });
    }
    if (!itemId) return;
    STATE.adjustingItemId = itemId;
    STATE.activeItemId = itemId;
    STATE.inspectItemId = "";
    setPanelMode("open");
    render(STATE.container);
  }

  function renderGrindSessionBar() {
    const session = grindSession();
    if (!session) return "";
    const index = Math.max(0, Math.min(session.items.length - 1, Number(session.currentIndex) || 0));
    const item = session.items[index] || {};
    const atStart = index <= 0;
    const atEnd = index >= session.items.length - 1;
    const canAdjust = Boolean(item.itemId || item.rect);
    const adjusting = Boolean(STATE.adjustingItemId && item.itemId === STATE.adjustingItemId);
    return `
      <div class="qd-grind-session-bar">
        <div>
          <strong>啃卷子中 · 第 ${index + 1} / ${session.items.length} 题</strong>
          <span>${escapeHtml(item.title || item.sourceName || "当前题目")}${item.rect ? "" : " · 整张图学习"}</span>
        </div>
        <div class="qd-grind-session-actions">
          <button class="btn btn-soft btn-sm" data-qd-action="grind-prev" type="button" ${atStart ? "disabled" : ""}>上一题</button>
          ${canAdjust ? `<button class="btn ${adjusting ? "btn-primary" : "btn-soft"} btn-sm" data-qd-action="${adjusting ? "finish-region-adjust" : "grind-edit-current"}" data-item-id="${escapeHtml(item.itemId || "")}" type="button">${adjusting ? "完成" : "调整框"}</button>` : ""}
          <button class="btn btn-primary btn-sm" data-qd-action="grind-next" type="button" ${atEnd ? "disabled" : ""}>下一题</button>
          <button class="btn btn-soft btn-sm" data-qd-action="grind-exit" type="button">退出</button>
        </div>
      </div>
    `;
  }

  function renderGrindPlan(plan) {
    return `
      <div class="qd-grind-order qd-grind-plan">
        ${plan.items.map((item) => `
          <article class="qd-grind-card">
            <b>${item.rank}</b>
            <div>
              <strong>${escapeHtml(item.title || item.sourceName || "题目")}</strong>
              <p>${escapeHtml(item.reason || "先学这题，性价比较高。")}</p>
              <small>考频 ${item.frequency || "?"} · 提分 ${item.scoreGain || "?"} · 优先 ${item.priority || "?"}</small>
            </div>
            <button class="btn btn-soft btn-sm" data-qd-action="start-grind-session" data-target-key="${escapeHtml(item.targetKey || "")}" type="button">从这题开始</button>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderGrindSheet() {
    initGrindSourceSelection();
    const scan = grindScan();
    if (scan) initGrindSelection();
    const sources = grindSources();
    const sourceSelectedCount = [...STATE.grindSourceSelected].filter((id) => sources.some((source) => source.id === id)).length;
    const candidates = scan ? grindCandidates() : [];
    const selectedCount = [...STATE.grindSelected].filter((key) => candidates.some((item) => item.key === key)).length;
    const plan = grindPlan();
    const overLimit = selectedCount > 12;
    return `
      <div class="qd-grind-overlay">
        <section class="qd-grind-sheet" role="dialog" aria-modal="true" aria-label="啃卷子排序">
          <div class="qd-grind-head">
            <div>
              <h3>啃卷子</h3>
              <p>先让 AI 把卷子拆成题目清单，再取消已经会的题，最后按题目排序。</p>
            </div>
            <button class="qd-icon-btn" data-qd-action="close-grind" type="button" title="关闭">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="qd-grind-body">
            <section class="qd-grind-picker">
              <div class="qd-grind-section-head">
                <strong>1. 选择卷子/题图</strong>
                <span>已选 ${sourceSelectedCount} 张</span>
              </div>
              <div class="qd-grind-list">
                ${sources.length ? sources.map(renderGrindSource).join("") : `<p class="qd-empty-mini">先粘贴几张题图，再来啃卷子。</p>`}
              </div>
              <button class="btn btn-primary qd-grind-run" data-qd-action="scan-grind-sources" type="button" ${!sourceSelectedCount || STATE.busy ? "disabled" : ""}>
                <span class="material-symbols-outlined">document_scanner</span>${STATE.busy ? "AI 正在识别..." : "识别题目"}
              </button>
              <p class="qd-hint">识别时会尽量保留原卷子的题号；读不到题号就显示“未标号”。</p>
            </section>
            <section class="qd-grind-result">
              <div class="qd-grind-section-head">
                <strong>2. 选择不会的题</strong>
                <span>${scan ? `已选 ${selectedCount} 题${overLimit ? "，最多 12 题" : ""}` : "等待识别"}</span>
              </div>
              <div class="qd-grind-list qd-grind-question-list">
                ${scan
                  ? (candidates.length ? candidates.map(renderGrindCandidate).join("") : `<div class="qd-grind-empty">没有识别出题目。可以先手动套索框题，再回来排序。</div>`)
                  : `<div class="qd-grind-empty">先在左侧选择素材并点击“识别题目”。AI 会把每张卷子里的题按原题号列出来。</div>`}
              </div>
              <button class="btn btn-primary qd-grind-run" data-qd-action="run-grind" type="button" ${!scan || selectedCount < 2 || overLimit || STATE.busy ? "disabled" : ""}>
                <span class="material-symbols-outlined">auto_awesome</span>${STATE.busy ? "AI 正在排序..." : "让 AI 排优先级"}
              </button>
              ${plan ? renderGrindPlan(plan) : `<div class="qd-grind-empty qd-grind-plan-empty">排序后会在这里出现“先学哪题”和原因。</div>`}
            </section>
          </div>
        </section>
      </div>
    `;
  }

  function renderGrindSource(source) {
    const checked = STATE.grindSourceSelected.has(source.id);
    const count = itemsForImage(source.id).filter((item) => item.rect).length;
    return `
      <label class="qd-grind-choice ${checked ? "selected" : "skipped"}">
        <input data-qd-grind-source-check type="checkbox" value="${escapeHtml(source.id)}" ${checked ? "checked" : ""} />
        <span>
          <strong>${escapeHtml(source.shortName || source.name)}</strong>
          <small>${escapeHtml(subjectLabel(source.subject))} · ${escapeHtml(shortDate(source.date))}${count ? ` · 已框 ${count} 题` : ""}</small>
        </span>
      </label>
    `;
  }

  function renderGrindCandidate(candidate) {
    const checked = STATE.grindSelected.has(candidate.key);
    const sourceType = candidate.kind === "item" ? "手动框选" : candidate.rect ? "AI识别区域" : "整张图";
    return `
      <label class="qd-grind-choice ${checked ? "selected" : "skipped"}">
        <input data-qd-grind-check type="checkbox" value="${escapeHtml(candidate.key)}" ${checked ? "checked" : ""} />
        <span>
          <strong>${escapeHtml(candidate.title)}</strong>
          <small>${escapeHtml(sourceType)} · ${escapeHtml(candidate.sourceName)} · ${escapeHtml(subjectLabel(candidate.subject))} · <b data-qd-grind-choice-state>${checked ? "不会，参与排序" : "已会，暂不排序"}</b></small>
        </span>
      </label>
    `;
  }

  function renderGrindPlan(plan) {
    return `
      <div class="qd-grind-order qd-grind-plan">
        ${plan.items.map((item) => `
          <article class="qd-grind-card">
            <b>${item.rank}</b>
            <div>
              <strong>${escapeHtml(item.title || item.sourceName || "题目")}</strong>
              <p>${escapeHtml(item.reason || "先学这题，性价比较高。")}</p>
              <small>考频 ${item.frequency || "?"} · 提分 ${item.scoreGain || "?"} · 优先 ${item.priority || "?"}</small>
            </div>
            <button class="btn btn-soft btn-sm" data-qd-action="start-grind-session" data-target-key="${escapeHtml(item.targetKey || "")}" type="button">从这题开始</button>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderGrindSheet() {
    initGrindSourceSelection();
    const scan = grindScan();
    if (scan) initGrindSelection();
    const sources = grindSources();
    const sourceSelectedCount = [...STATE.grindSourceSelected].filter((id) => sources.some((source) => source.id === id)).length;
    const candidates = scan ? grindCandidates() : [];
    const selectedCount = [...STATE.grindSelected].filter((key) => candidates.some((item) => item.key === key)).length;
    const plan = grindPlan();
    const overLimit = selectedCount > 12;
    const stepClass = plan ? "plan" : scan ? "questions" : "sources";
    return `
      <div class="qd-grind-overlay">
        <section class="qd-grind-sheet qd-grind-step-${stepClass}" role="dialog" aria-modal="true" aria-label="啃卷子排序">
          <div class="qd-grind-head">
            <div>
              <h3>${plan ? "推荐学习顺序" : scan ? "选择不会的题" : "啃卷子"}</h3>
              <p>${plan ? "按这个顺序逐题开始学；学完回来点下一题就行。" : scan ? "默认都当作不会，会的题取消勾选，再排序。" : "先选卷子/题图，让 AI 拆成题目清单。"}</p>
            </div>
            <button class="qd-icon-btn" data-qd-action="close-grind" type="button" title="关闭">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          ${plan ? `
            <div class="qd-grind-plan-only">
              <div class="qd-grind-section-head">
                <strong>排序结果</strong>
                <span>${escapeHtml(shortDate(plan.createdAt))}</span>
              </div>
              ${renderGrindPlan(plan)}
              <button class="btn btn-soft qd-grind-run" data-qd-action="restart-grind" type="button">
                <span class="material-symbols-outlined">refresh</span>重新选题
              </button>
            </div>
          ` : `
            <div class="qd-grind-body">
              <section class="qd-grind-picker">
                <div class="qd-grind-section-head">
                  <strong>1. 选择卷子/题图</strong>
                  <span>已选 ${sourceSelectedCount} 张</span>
                </div>
                <div class="qd-grind-list">
                  ${sources.length ? sources.map(renderGrindSource).join("") : `<p class="qd-empty-mini">先粘贴几张题图，再来啃卷子。</p>`}
                </div>
                <button class="btn btn-primary qd-grind-run" data-qd-action="scan-grind-sources" type="button" ${!sourceSelectedCount || STATE.busy ? "disabled" : ""}>
                  <span class="material-symbols-outlined">document_scanner</span>${STATE.busy ? "AI 正在识别..." : "识别题目"}
                </button>
                <p class="qd-hint">已手动框过的素材会优先使用框选区域；没框过的整张图会交给 AI 拆题。</p>
              </section>
              <section class="qd-grind-result">
                <div class="qd-grind-section-head">
                  <strong>2. 选择不会的题</strong>
                  <span data-qd-grind-count>${scan ? `已选 ${selectedCount} 题${overLimit ? "，最多 12 题" : ""}` : "等待识别"}</span>
                </div>
                <div class="qd-grind-list qd-grind-question-list">
                  ${scan
                    ? (candidates.length ? candidates.map(renderGrindCandidate).join("") : `<div class="qd-grind-empty">没有识别出题目。可以先手动套索框题，再回来排序。</div>`)
                    : `<div class="qd-grind-empty">先在左侧选择素材并点击“识别题目”。AI 会按原题号列出每张卷子里的题。</div>`}
                </div>
                ${scan?.duplicateCount ? `<p class="qd-hint">已自动跳过 ${scan.duplicateCount} 道疑似重复题。</p>` : ""}
                <button class="btn btn-primary qd-grind-run" data-qd-action="run-grind" type="button" ${!scan || selectedCount < 2 || overLimit || STATE.busy ? "disabled" : ""}>
                  <span class="material-symbols-outlined">auto_awesome</span>${STATE.busy ? "AI 正在排序..." : "让 AI 排优先级"}
                </button>
              </section>
            </div>
          `}
        </section>
      </div>
    `;
  }

  function filterLabel(filter = STATE.filter) {
    if (filter === "math") return "数学";
    if (filter === "physics") return "物理";
    if (filter === "chemistry") return "化学";
    if (filter === "uncategorized") return "未整理";
    return "全部";
  }

  function emptyFilterText() {
    if (STATE.search) return "没有找到匹配的题图。";
    if (STATE.filter === "all") return "这里还没有题图。复制一张题目截图，然后按 Ctrl+V。";
    return `${filterLabel()}这里还没有题图。`;
  }

  function renderRegions(activeImage, activeItem) {
    const list = itemsForImage(activeImage?.id).filter((item) => item.rect);
    return list.map((item, index) => {
      if (isCurrentGrindItem(item) && STATE.adjustingItemId !== item.id) {
        return `
          <div class="qd-region-focus" style="${Selection.rectStyle(item.rect)}"></div>
        `;
      }
      if (regionEditable(item)) {
        const rect = item.rect || {};
        const active = item.id === activeItem?.id;
        const finalized = regionFinalized(item);
        return `
          <div class="qd-region-box ${active ? "active" : ""} ${finalized ? "adjusting" : ""}" data-qd-region-box data-item-id="${item.id}" style="${Selection.rectStyle(rect)}" title="拖动调整选区">
            <span class="qd-region-box-badge">${finalized ? "调整中" : "待确认"}</span>
            <button class="qd-region-box-action" data-qd-action="${finalized ? "finish-region-adjust" : "open-region-panel"}" data-item-id="${item.id}" type="button" title="${finalized ? "完成调整" : "用这个选区提问"}">
              <span class="material-symbols-outlined">${finalized ? "done" : "psychology_alt"}</span>
            </button>
            ${finalized ? "" : `
              <button class="qd-region-box-delete" data-qd-action="delete-region" data-item-id="${item.id}" type="button" title="删除这个选区">
                <span class="material-symbols-outlined">close</span>
              </button>
            `}
            ${["nw", "ne", "sw", "se"].map((handle) => `<span class="qd-region-handle ${handle}" data-qd-region-handle="${handle}" data-item-id="${item.id}"></span>`).join("")}
          </div>
        `;
      }
      const pos = Selection.markerPosition(item);
      return `
        <button class="qd-region ${item.id === activeItem?.id ? "active" : ""} ${item.status || "new"}"
          style="left:${pos.x * 100}%;top:${pos.y * 100}%"
          data-qd-action="open-inspector" data-item-id="${item.id}" type="button" title="${escapeHtml(itemLabel(item, index))}">
          <span class="material-symbols-outlined">psychology_alt</span>
        </button>
      `;
    }).join("");
  }

  function renderInspector(activeImage) {
    const item = items().find((entry) => entry.id === STATE.inspectItemId && entry.imageId === activeImage?.id);
    if (!item) return "";
    const pos = Selection.markerPosition(item);
    const alignRight = pos.x > 0.62;
    const left = alignRight ? Math.max(2, pos.x * 100 - 3) : Math.min(76, pos.x * 100 + 3);
    const top = Math.min(72, Math.max(2, pos.y * 100 + 3));
    const shift = alignRight ? "-100%" : "0";
    const log = item.savedLogId ? (window.MochiApp?.readStudyLogs?.() || []).find((entry) => entry.id === item.savedLogId) : null;
    const { active: activeChat, archived: archivedChat } = splitChatByContext(item);
    return `
      <aside class="qd-inspector" style="--qi-left:${left}%;--qi-top:${top}%;--qi-x-shift:${shift}">
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
            <h4>学习档案卡片</h4>
            ${log ? `
              <article class="qd-study-mini-card">
                <div><b>${escapeHtml(log.nodeLabel || item.nodeLabel || "未归档")}</b><span>${"★".repeat(Number(log.stars || 0))}</span></div>
                <p>${escapeHtml(log.painPoint || "暂无卡点")}</p>
                <small>${escapeHtml(log.routine || "暂无套路")}</small>
              </article>
            ` : `<p class="qd-inspector-empty">保存到学习档案后，这里会显示卡点和套路。</p>`}
          </section>
          <section>
            <h4>AI 对话</h4>
            ${activeChat.length ? activeChat.slice(-4).map((msg) => `
              <p class="qd-inspector-chat ${msg.role}"><b>${msg.role === "assistant" ? "AI" : "我"}：</b>${escapeHtml(String(msg.content || "").slice(0, 180))}</p>
            `).join("") : `<p class="qd-inspector-empty">${archivedChat.length ? "当前框还没有新对话，旧对话在右栏可展开。" : "还没有问过 AI。"}</p>`}
          </section>
          ${item.rect ? `
            <button class="btn btn-soft btn-sm qd-inspector-adjust" data-qd-action="adjust-region" data-item-id="${item.id}" type="button">
              <span class="material-symbols-outlined">crop</span>重新调整选区
            </button>
          ` : ""}
        </div>
      </aside>
    `;
  }

  function renderViewer(activeImage, activeItem) {
    if (!activeImage) {
      return `
        <section class="qd-dropzone">
          <span class="material-symbols-outlined">content_paste</span>
          <h2>${escapeHtml(emptyFilterText())}</h2>
          <p>复制截图后按 Ctrl+V，或从左侧上传图片。题图会先进入「未整理」，识别或保存后再自动归到对应科目。</p>
        </section>
      `;
    }
    const lasso = lassoMode();
    const pendingRegion = pendingRegionForImage(activeImage.id);
    const lassoLabel = pendingRegion && lasso ? "取消选区" : lasso ? "套索中" : "套索";
    const lassoIcon = pendingRegion && lasso ? "close" : "gesture";
    return `
      <div class="qd-viewer-head-stack">
        <div class="qd-viewer-top">
          <div>
            <strong>${escapeHtml(activeImage.name)}</strong>
            <span>${escapeHtml(subjectLabel(activeImage.subject))} · ${activeImage.width || "?"}×${activeImage.height || "?"}</span>
          </div>
          <div class="qd-viewer-actions">
            <button class="btn btn-soft btn-sm" data-qd-action="rename" data-image-id="${activeImage.id}" type="button">
              <span class="material-symbols-outlined">edit</span>重命名
            </button>
            <button class="btn btn-soft btn-sm qd-danger-btn" data-qd-action="delete-image" data-image-id="${activeImage.id}" type="button">
              <span class="material-symbols-outlined">delete</span>删除
            </button>
          </div>
        </div>
        <div class="qd-viewer-lasso-row ${lasso ? "active" : ""}">
          <span class="qd-viewer-lasso-hint">${lasso ? "在题图上圈出一道题，松手后可调整" : "一张纸有多道题？点右边「套索」逐题圈出来；只有一道题，直接在右侧问 AI 就行。"}</span>
          <button class="btn btn-soft btn-sm qd-lasso-btn ${lasso ? "active" : ""}" data-qd-action="toggle-lasso" type="button" aria-pressed="${lasso ? "true" : "false"}">
            <span class="material-symbols-outlined">${lassoIcon}</span>${lassoLabel}
          </button>
        </div>
        ${renderGrindSessionBar()}
      </div>
      <div class="qd-image-stage">
        <div class="qd-image-loading" data-qd-image-loading>读取题图中...</div>
        <div class="qd-image-wrap ${lasso ? "qd-lasso-enabled" : ""}" data-qd-image-wrap>
          <img data-qd-image alt="${escapeHtml(activeImage.name)}" hidden />
          <div class="qd-region-layer">
            ${renderRegions(activeImage, activeItem)}
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
          <p>${escapeHtml(emptyFilterText())}</p>
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
      ${item.rect ? renderRecognitionCard(item) : ""}
      ${renderChatHistory(item)}
      <div class="qd-question-box">
        <textarea data-qd-question rows="3" placeholder="问这道题，例如：这题第一步怎么想？"></textarea>
        <div class="qd-panel-actions">
          <button class="btn btn-primary btn-sm" data-qd-action="ask-ai" data-item-id="${item.id}" type="button" ${STATE.busy ? "disabled" : ""}>
            <span class="material-symbols-outlined">send</span>问 AI
          </button>
          <button class="btn btn-soft btn-sm" data-qd-action="draft" data-item-id="${item.id}" type="button" ${STATE.busy ? "disabled" : ""}>
            <span class="material-symbols-outlined">edit_note</span>学懂了，整理成记录
          </button>
        </div>
        <p class="qd-panel-flow-hint">先问 AI 把这道题弄懂，弄懂后点「整理成记录」存进学习档案。</p>
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

  function renderChatHistory(item) {
    const { active, archived } = splitChatByContext(item);
    const activeBlock = active.length ? `
      <details class="qd-chat-shell" open>
        <summary>
          <span>本题对话</span>
          <b>${active.length}</b>
        </summary>
        <div class="qd-chat" data-qd-chat>
          ${active.map(renderChatMessage).join("")}
        </div>
      </details>
    ` : `<p class="qd-chat-empty">还没有本题对话，直接在下面问第一句。</p>`;
    const archivedBlock = archived.length ? `
      <details class="qd-chat-shell archived">
        <summary>
          <span>调整前旧对话</span>
          <b>${archived.length}</b>
        </summary>
        <div class="qd-chat">
          ${archived.map(renderChatMessage).join("")}
        </div>
      </details>
    ` : "";
    return `${activeBlock}${archivedBlock}`;
  }

  function renderChatMessage(msg) {
    return `
      <article class="qd-chat-msg ${msg.role === "assistant" ? "assistant" : "user"}">
        <strong>${msg.role === "assistant" ? "AI" : "我"}</strong>
        <p>${formatText(msg.content)}</p>
      </article>
    `;
  }

  function recognitionSubjectLabel(subject) {
    if (subject === "math") return "数学";
    if (subject === "physics") return "物理";
    if (subject === "chemistry") return "化学";
    return "未判断";
  }

  function recognitionSubjectOptions(current) {
    return [
      ["unknown", "未判断"],
      ["math", "数学"],
      ["physics", "物理"],
      ["chemistry", "化学"],
    ].map(([value, label]) => `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`).join("");
  }

  function renderRecognitionCard(item) {
    const info = item.recognition || null;
    // 没识别过：折叠成一行可选入口，平时不占视觉。多数题直接问 AI 即可，
    // 只有"一张纸多道题、不确定框全没"时才需要核对。
    if (!info) {
      return `
        <details class="qd-recognition-card empty">
          <summary class="qd-recognition-row">
            <span class="material-symbols-outlined">document_scanner</span>
            <span class="qd-recognition-state">核对题号 / 题干（可选）</span>
          </summary>
          <p class="qd-recognition-summary">不确定 AI 有没有看全这道题时再用；平时直接在下面问 AI 就行。</p>
          <button class="btn btn-soft btn-sm" data-qd-action="recognize-question" data-item-id="${item.id}" type="button" ${STATE.busy ? "disabled" : ""}>
            <span class="material-symbols-outlined">document_scanner</span>识别这道题
          </button>
        </details>
      `;
    }
    const stale = info.stale === true;
    const complete = !stale && info.isComplete !== false;
    // 需要注意（要重识别 / 可能没截全）时默认展开提醒；正常识别完整则折叠。
    const needAttention = stale || !complete;
    const meta = [info.questionNumber || "", recognitionSubjectLabel(info.subject)].filter(Boolean).join(" · ");
    const stateLabel = stale ? "需要重识别" : complete ? "识别完整" : "可能没截全";
    const summary = stale ? "选区已经调整过，请重新识别后再核对题干。" : (info.warning || info.summary || "");
    const transcript = info.transcript || info.raw || "";
    return `
      <details class="qd-recognition-card ${complete ? "complete" : "incomplete"}" ${needAttention ? "open" : ""}>
        <summary class="qd-recognition-row">
          <span class="material-symbols-outlined">${complete ? "check_circle" : "error"}</span>
          <span class="qd-recognition-state">${stateLabel}${meta ? ` · ${escapeHtml(meta)}` : ""}</span>
        </summary>
        ${summary ? `<p class="qd-recognition-summary">${escapeHtml(summary)}</p>` : ""}
        <div class="qd-recognition-edit" data-qd-recognition-form data-item-id="${item.id}">
          <div class="qd-recognition-grid">
            <label>
              <span>题号</span>
              <input data-recognition-field="questionNumber" value="${escapeHtml(info.questionNumber || "")}" placeholder="如 2 / 12(a)" />
            </label>
            <label>
              <span>科目</span>
              <select data-recognition-field="subject">${recognitionSubjectOptions(info.subject || "unknown")}</select>
            </label>
          </div>
          <label>
            <span>题干摘要</span>
            <input data-recognition-field="summary" value="${escapeHtml(info.summary || "")}" placeholder="这题在问什么" />
          </label>
          <label>
            <span>题干原文</span>
            <textarea data-recognition-field="transcript" rows="4" placeholder="可手动修正 AI 少识别或错识别的数字、公式">${escapeHtml(transcript || "")}</textarea>
          </label>
          <label class="qd-recognition-check">
            <input data-recognition-field="isComplete" type="checkbox" ${complete ? "checked" : ""} />
            <span>这道题已经识别完整</span>
          </label>
          <div class="qd-recognition-edit-actions">
            <button class="btn btn-soft btn-sm" data-qd-action="save-recognition" data-item-id="${item.id}" type="button">
              <span class="material-symbols-outlined">save</span>保存题干
            </button>
            <button class="btn btn-ghost btn-sm qd-recognition-retry" data-qd-action="recognize-question" data-item-id="${item.id}" type="button" ${STATE.busy ? "disabled" : ""}>
              <span class="material-symbols-outlined">refresh</span>重识别
            </button>
          </div>
        </div>
      </details>
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

  function regionFinalized(item) {
    return Boolean(item?.savedLogId || item?.recordDraft || (item?.chat || []).length || ["asked", "drafted", "saved"].includes(item?.status));
  }

  function regionEditable(item) {
    if (grindSession() && STATE.adjustingItemId !== item?.id) return false;
    return Boolean(item?.rect && (!regionFinalized(item) || STATE.adjustingItemId === item.id));
  }

  function updateRegionBoxPreview(container, itemId, rect) {
    if (!container || !itemId || !rect) return;
    const box = [...container.querySelectorAll("[data-qd-region-box]")].find((entry) => entry.dataset.itemId === itemId);
    if (box) box.setAttribute("style", Selection.rectStyle(rect));
  }

  function cancelRegionWork() {
    const image = regionImage();
    const hadSelection = Boolean(STATE.selecting || STATE.editingRegion || STATE.adjustingItemId || lassoMode());
    const adjusting = Boolean(STATE.adjustingItemId);
    STATE.selecting = null;
    STATE.editingRegion = null;
    STATE.adjustingItemId = "";
    setLassoMode(false);
    if (!adjusting) clearDraftRegionsForImage(image?.id);
    return hadSelection;
  }

  function clearLassoPreview(wrap) {
    wrap?.querySelector("[data-qd-lasso-preview]")?.remove();
  }

  function updateLassoPreview(wrap, points) {
    if (!wrap) return;
    let svg = wrap.querySelector("[data-qd-lasso-preview]");
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "qd-lasso-preview");
      svg.setAttribute("data-qd-lasso-preview", "");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("preserveAspectRatio", "none");
      const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      svg.appendChild(line);
      wrap.appendChild(svg);
    }
    svg.querySelector("polyline")?.setAttribute("points", Selection.lassoPolyline(points));
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

  function refreshFileList(container) {
    const list = container?.querySelector("[data-qd-file-list]");
    if (!list) return;
    const activeImage = findActiveImage();
    const visible = filterImages(images(), STATE.filter);
    list.innerHTML = visible.length ? visible.map((img) => renderFileItem(img, activeImage?.id === img.id)).join("") : renderEmptyFiles();
  }

  function refreshAfterSearch(container, input) {
    const cursor = input.selectionStart ?? String(input.value || "").length;
    const visible = filterImages(images(), STATE.filter);
    const activeStillVisible = visible.some((img) => img.id === STATE.activeImageId);
    if (activeStillVisible || !STATE.activeImageId) {
      refreshFileList(container);
      return;
    }
    render(container);
    const nextInput = container.querySelector("[data-qd-search]");
    if (!nextInput) return;
    nextInput.focus();
    nextInput.setSelectionRange?.(cursor, cursor);
  }

  async function deleteImageWithConfirm(imageId) {
    const img = images().find((entry) => entry.id === imageId);
    if (!img) return;
    if (!confirm(`删除「${img.name || "这张题图"}」？题桌里的图片和对话会删除，已保存到学习档案的卡片不会删除。`)) return;
    await deleteImages([imageId]);
    window.MochiApp?.toast?.("题图已删除");
    render(STATE.container);
  }

  function scanRowsFromRegions(img, allItems) {
    return allItems
      .filter((item) => item.imageId === img.id && item.rect)
      .map((item, index) => {
        const candidate = regionCandidate(img, item, index);
        return {
          ...candidate,
          title: item.recognition?.summary || item.recordDraft?.originalQuestion || itemLabel(item, index) || "题目区域",
        };
      });
  }

  async function scanOneGrindSource(img, allItems) {
    const regionRows = scanRowsFromRegions(img, allItems);
    if (regionRows.length) return regionRows;
    const blob = await getBlob(img.id);
    if (!blob) return [];
    const response = await window.MochiAI.callAIWithImage(
      DeskAI.PAPER_SCAN_PROMPT,
      `请识别这张卷子/题图里的所有题目。务必保留原题号；读不到题号就让 questionNumber 为空。只输出约定 JSON。素材名：${img.shortName || img.name}`,
      blob,
      { maxTokens: 1800 }
    );
    const rows = DeskAI.parsePaperScan?.(response || "") || [];
    if (!rows.length) {
      return [{
        key: `scan:${img.id}:0`,
        kind: "scan",
        imageId: img.id,
        itemId: "",
        subject: img.subject,
        date: img.date,
        title: "整张图未拆出具体题",
        summary: "",
        questionNumber: "",
        rect: null,
        sourceName: img.shortName || img.name,
        status: img.status || "new",
      }];
    }
    return rows.map((row, index) => ({
      key: `scan:${img.id}:${index}`,
      kind: "scan",
      imageId: img.id,
      itemId: "",
      subject: ["math", "physics", "chemistry"].includes(row.subject) ? row.subject : img.subject,
      date: img.date,
      title: row.title || row.summary || "题目",
      summary: row.summary || "",
      questionNumber: row.questionNumber || "",
      rect: cleanScanRect(row.rect),
      sourceName: img.shortName || img.name,
      status: img.status || "new",
    }));
  }

  async function scanGrindSources() {
    if (!hasAiConfig()) {
      STATE.message = "请先到设置页填写支持图片输入的 AI 配置。";
      render(STATE.container);
      return;
    }
    const sourceMap = new Map(grindSources().map((source) => [source.id, source]));
    const selectedSources = [...STATE.grindSourceSelected].map((id) => sourceMap.get(id)).filter(Boolean);
    if (!selectedSources.length) {
      window.MochiApp?.toast?.("先选择至少一张卷子/题图");
      return;
    }
    STATE.busy = true;
    STATE.message = "AI 正在识别卷子里的题目...";
    saveUi({ grindPlan: null });
    render(STATE.container);
    try {
      const allItems = items();
      const questions = [];
      for (const img of selectedSources) {
        const rows = await scanOneGrindSource(img, allItems);
        rows.forEach((row, index) => questions.push({
          ...row,
          key: row.key || `scan:${img.id}:${index}`,
          sourceName: row.sourceName || img.shortName || img.name,
          date: row.date || img.date,
        }));
      }
      const deduped = dedupeQuestions(questions);
      saveUi({
        grindScan: {
          createdAt: nowIso(),
          sourceIds: selectedSources.map((img) => img.id),
          questions: deduped.unique,
          duplicateCount: deduped.duplicates.length,
        },
        grindPlan: null,
      });
      STATE.grindSelected = new Set(deduped.unique.slice(0, 12).map((question) => question.key));
      window.MochiApp?.toast?.(`已识别 ${deduped.unique.length} 道题${deduped.duplicates.length ? `，已跳过 ${deduped.duplicates.length} 道疑似重复题` : ""}`);
    } catch (error) {
      STATE.message = error.message || "题目识别失败";
      window.MochiApp?.toast?.("题目识别失败");
    } finally {
      STATE.busy = false;
      render(STATE.container);
    }
  }

  async function runGrindSort() {
    if (!hasAiConfig()) {
      STATE.message = "请先到设置页填写支持图片输入的 AI 配置。";
      render(STATE.container);
      return;
    }
    const candidates = grindScan() ? grindCandidates() : [];
    const selected = [...STATE.grindSelected]
      .map((key) => candidates.find((candidate) => candidate.key === key))
      .filter(Boolean)
      .slice(0, 12);
    if (selected.length < 2) {
      window.MochiApp?.toast?.("至少选择两张题图");
      return;
    }
    STATE.busy = true;
    render(STATE.container);
    try {
      const overview = await buildGrindOverview(selected);
      const response = await window.MochiAI.callAIWithImage(
        DeskAI.PAPER_GRIND_PROMPT,
        `请根据这张编号总览图，对 ${overview.labels.join("、")} 这些题排序。只输出约定 JSON。`,
        overview.blob,
        { maxTokens: 1600 }
      );
      const rows = DeskAI.parsePaperGrind(response || "", overview.labels);
      const items = rows.map((row, index) => {
        const candidate = overview.byLabel.get(row.label);
        return candidate ? {
          ...row,
          rank: index + 1,
          targetKey: candidate.key,
          imageId: candidate.imageId,
          itemId: candidate.itemId,
          kind: candidate.kind,
          sourceName: candidate.sourceName,
          questionNumber: candidate.questionNumber || "",
          rect: candidate.rect || null,
          title: row.title || candidate.title,
        } : null;
      }).filter(Boolean);
      if (!items.length) throw new Error("AI 没有返回可用排序。");
      saveUi({ grindPlan: { createdAt: nowIso(), imageIds: selected.map((img) => img.id), items } });
      window.MochiApp?.toast?.("排序完成，先学第 1 道");
    } catch (error) {
      STATE.message = error.message || "啃卷子排序失败";
      window.MochiApp?.toast?.("啃卷子排序失败");
    } finally {
      STATE.busy = false;
      render(STATE.container);
    }
  }

  function startGrindItem(targetKey = "", imageId = "", itemId = "") {
    const planItem = grindPlan()?.items?.find((entry) => entry.targetKey === targetKey) || grindCandidates().find((entry) => entry.key === targetKey) || null;
    const nextImageId = planItem?.imageId || imageId;
    let nextItemId = planItem?.itemId || itemId || "";
    const img = images().find((entry) => entry.id === nextImageId);
    if (!img) return;
    if (!nextItemId && planItem?.rect) {
      const created = createRegionItem(normalizeImageEntry(img), planItem.rect);
      if (created) {
        nextItemId = created.id;
        const recognition = {
          questionNumber: planItem.questionNumber || "",
          subject: ["math", "physics", "chemistry"].includes(planItem.subject) ? planItem.subject : "unknown",
          summary: planItem.title || "",
          transcript: "",
          isComplete: true,
          warning: "",
          raw: "",
          updatedAt: nowIso(),
        };
        updateItem(created.id, { recognition, title: planItem.title || created.title, subject: planItem.subject || created.subject });
      }
    }
    STATE.activeImageId = nextImageId;
    STATE.activeItemId = nextItemId || "";
    STATE.inspectItemId = "";
    STATE.filter = "all";
    STATE.search = "";
    STATE.grindOpen = false;
    setPanelMode("open");
    saveUi({ activeImageId: nextImageId, filter: "all", search: "" });
    render(STATE.container);
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
        const selectedFiles = [...(event.target.files || [])];
        for (const file of selectedFiles) await addFile(file);
        event.target.value = "";
      }
      if (event.target.matches("[data-qd-grind-source-check]")) {
        const id = event.target.value || "";
        if (event.target.checked) STATE.grindSourceSelected.add(id);
        else STATE.grindSourceSelected.delete(id);
        STATE.grindSelected = new Set();
        saveUi({ grindScan: null, grindPlan: null });
        render(container);
        return;
      }
      if (event.target.matches("[data-qd-grind-check]")) {
        const id = event.target.value || "";
        if (event.target.checked) STATE.grindSelected.add(id);
        else STATE.grindSelected.delete(id);
        refreshGrindQuestionControls(container);
        return;
      }
      if (event.target.matches("[data-qd-draft-subject]")) {
        const form = event.target.closest("[data-qd-draft-form]");
        const itemId = form?.dataset.itemId;
        if (!itemId) return;
        const draft = { ...formDraft(form), subject: event.target.value, nodeLabel: "", nodeId: "" };
        updateItem(itemId, { recordDraft: draft, subject: draft.subject, nodeLabel: "", nodeId: "" });
        const item = items().find((entry) => entry.id === itemId);
        if (item) updateImageSubject(item.imageId, draft.subject);
        render(container);
      }
    });
    container.addEventListener("input", (event) => {
      if (!event.target.matches("[data-qd-search]")) return;
      STATE.search = event.target.value || "";
      saveUi({ search: STATE.search });
      refreshAfterSearch(container, event.target);
    });
    container.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (event.target.closest("textarea,input,select")) return;
      if (!cancelRegionWork()) return;
      event.preventDefault();
      window.MochiApp?.toast?.("已取消当前选区");
      render(container);
    });
    container.addEventListener("pointerdown", (event) => {
      const handle = event.target.closest("[data-qd-region-handle]");
      const regionBox = event.target.closest("[data-qd-region-box]");
      if (handle || (regionBox && !event.target.closest("[data-qd-action]"))) {
        const itemId = (handle || regionBox).dataset.itemId || "";
        const item = items().find((entry) => entry.id === itemId);
        const wrap = container.querySelector("[data-qd-image-wrap]");
        if (!item?.rect || !wrap || !regionEditable(item)) return;
        event.preventDefault();
        wrap.setPointerCapture?.(event.pointerId);
        STATE.activeItemId = item.id;
        STATE.editingRegion = {
          pointerId: event.pointerId,
          itemId: item.id,
          mode: handle ? handle.dataset.qdRegionHandle : "move",
          start: pointerRect(event, wrap),
          rect: { ...item.rect },
        };
        return;
      }
      const wrap = event.target.closest("[data-qd-image-wrap]");
      if (!wrap || event.target.closest("[data-qd-action]")) return;
      if (!lassoMode()) return;
      const img = wrap.querySelector("[data-qd-image]");
      if (!img || img.hidden) return;
      event.preventDefault();
      wrap.setPointerCapture?.(event.pointerId);
      const start = pointerRect(event, wrap);
      STATE.selecting = { pointerId: event.pointerId, points: [start] };
      updateLassoPreview(wrap, STATE.selecting.points);
    });
    container.addEventListener("pointermove", (event) => {
      if (STATE.editingRegion && STATE.editingRegion.pointerId === event.pointerId) {
        const wrap = container.querySelector("[data-qd-image-wrap]");
        if (!wrap) return;
        const next = Selection.editRectFromPointer(STATE.editingRegion, pointerRect(event, wrap));
        STATE.editingRegion.preview = next;
        updateRegionBoxPreview(container, STATE.editingRegion.itemId, next);
        return;
      }
      if (!STATE.selecting || STATE.selecting.pointerId !== event.pointerId) return;
      const wrap = event.target.closest("[data-qd-image-wrap]") || container.querySelector("[data-qd-image-wrap]");
      if (!wrap) return;
      STATE.selecting.points.push(pointerRect(event, wrap));
      updateLassoPreview(wrap, STATE.selecting.points);
    });
    container.addEventListener("pointerup", (event) => {
      if (STATE.editingRegion && STATE.editingRegion.pointerId === event.pointerId) {
        const edit = STATE.editingRegion;
        STATE.editingRegion = null;
        if (edit.preview) {
          const item = items().find((entry) => entry.id === edit.itemId);
          updateItem(edit.itemId, { rect: edit.preview, ...contextPatchAfterRectChange(item, edit.preview) });
        }
        render(container);
        return;
      }
      if (!STATE.selecting || STATE.selecting.pointerId !== event.pointerId) return;
      const wrap = event.target.closest("[data-qd-image-wrap]") || container.querySelector("[data-qd-image-wrap]");
      const image = regionImage();
      const rect = Selection.pointsRect(STATE.selecting.points);
      STATE.selecting = null;
      clearLassoPreview(wrap);
      if (image && rect && (rect.w > 0.01 || rect.h > 0.01)) createRegionItem(image, rect);
      render(container);
    });
    container.addEventListener("pointercancel", (event) => {
      if (STATE.editingRegion && STATE.editingRegion.pointerId === event.pointerId) {
        STATE.editingRegion = null;
        render(container);
        return;
      }
      if (!STATE.selecting || STATE.selecting.pointerId !== event.pointerId) return;
      const wrap = event.target.closest("[data-qd-image-wrap]") || container.querySelector("[data-qd-image-wrap]");
      STATE.selecting = null;
      clearLassoPreview(wrap);
    });
    container.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-qd-action]");
      if (!button) return;
      const action = button.dataset.qdAction;
      if (action === "toggle-lasso") {
        const next = !lassoMode();
        if (!next) {
          if (cancelRegionWork()) window.MochiApp?.toast?.("已取消当前选区");
        } else {
          setLassoMode(true);
        }
        render(container);
        return;
      }
      if (action === "open-inspector") {
        STATE.activeItemId = button.dataset.itemId || "";
        STATE.inspectItemId = STATE.activeItemId;
        setPanelMode("open");
        render(container);
        return;
      }
      if (action === "open-region-panel") {
        STATE.activeItemId = button.dataset.itemId || "";
        STATE.inspectItemId = "";
        setPanelMode("open");
        render(container);
        return;
      }
      if (action === "delete-region") {
        if (deleteItem(button.dataset.itemId || "")) {
          window.MochiApp?.toast?.("已删除这个选区");
          render(container);
        }
        return;
      }
      if (action === "adjust-region") {
        STATE.adjustingItemId = button.dataset.itemId || "";
        STATE.activeItemId = STATE.adjustingItemId;
        STATE.inspectItemId = "";
        setPanelMode("open");
        render(container);
        return;
      }
      if (action === "finish-region-adjust") {
        STATE.adjustingItemId = "";
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
        saveUi({ filter: STATE.filter });
        render(container);
        return;
      }
      if (action === "open-grind") {
        STATE.grindOpen = true;
        initGrindSourceSelection(true);
        initGrindSelection(true);
        render(container);
        return;
      }
      if (action === "close-grind") {
        STATE.grindOpen = false;
        render(container);
        return;
      }
      if (action === "scan-grind-sources") {
        await scanGrindSources();
        return;
      }
      if (action === "restart-grind") {
        saveUi({ grindScan: null, grindPlan: null });
        STATE.grindSelected = new Set();
        initGrindSourceSelection(true);
        render(container);
        return;
      }
      if (action === "start-grind-session") {
        startGrindSession(button.dataset.targetKey || "");
        return;
      }
      if (action === "grind-prev") {
        moveGrindSession(-1);
        return;
      }
      if (action === "grind-next") {
        moveGrindSession(1);
        return;
      }
      if (action === "grind-edit-current") {
        editCurrentGrindRegion();
        return;
      }
      if (action === "grind-exit") {
        exitGrindSession();
        return;
      }
      if (action === "run-grind") {
        await runGrindSort();
        return;
      }
      if (action === "start-grind-item") {
        startGrindItem(button.dataset.targetKey || "", button.dataset.imageId || "", button.dataset.itemId || "");
        return;
      }
      if (action === "delete-image") {
        await deleteImageWithConfirm(button.dataset.imageId);
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
      if (action === "recognize-question") {
        await recognizeQuestion(button.dataset.itemId);
        return;
      }
      if (action === "save-recognition") {
        saveRecognitionEdits(button.dataset.itemId);
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
    const version = contextVersion(item);
    updateItem(item.id, {
      chat: [
        ...(item.chat || []),
        ...messages.map((msg) => ({ ...msg, contextVersion: version })),
      ],
      status: "asked",
    });
    updateImage(item.imageId, { status: "asked" });
  }

  function saveRecognitionEdits(itemId) {
    const item = items().find((entry) => entry.id === itemId);
    const form = STATE.container?.querySelector(`[data-qd-recognition-form][data-item-id="${CSS.escape(itemId || "")}"]`);
    if (!item || !form) return;
    const field = (name) => form.querySelector(`[data-recognition-field="${name}"]`);
    const subject = field("subject")?.value || "unknown";
    const recognition = {
      ...(item.recognition || {}),
      questionNumber: String(field("questionNumber")?.value || "").trim().slice(0, 24),
      subject: ["math", "physics", "chemistry", "unknown"].includes(subject) ? subject : "unknown",
      summary: String(field("summary")?.value || "").trim().slice(0, 80),
      transcript: String(field("transcript")?.value || "").trim().slice(0, 520),
      isComplete: Boolean(field("isComplete")?.checked),
      stale: false,
      warning: "",
      contextVersion: contextVersion(item),
      updatedAt: nowIso(),
    };
    const patch = {
      recognition,
      title: recognition.summary || item.title,
    };
    if (["math", "physics", "chemistry"].includes(recognition.subject)) patch.subject = recognition.subject;
    updateItem(item.id, patch);
    if (patch.subject) updateImageSubject(item.imageId, patch.subject);
    STATE.message = "题干已保存，下一次问 AI 会优先使用这版题干。";
    render(STATE.container);
  }

  async function recognizeQuestion(itemId) {
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
    STATE.message = "AI 正在识别选区...";
    render(STATE.container);
    try {
      const response = await window.MochiAI.callAIWithImage(
        DeskAI.QUESTION_RECOGNITION_PROMPT,
        "请识别这张选区截图，只输出约定 JSON。",
        blob,
        { maxTokens: 700 }
      );
      const recognition = DeskAI.parseRecognition(response || "");
      recognition.stale = false;
      recognition.contextVersion = contextVersion(item);
      const patch = { recognition };
      if (["math", "physics", "chemistry"].includes(recognition.subject)) patch.subject = recognition.subject;
      updateItem(item.id, patch);
      if (patch.subject) updateImageSubject(item.imageId, patch.subject);
      STATE.message = recognition.isComplete ? "识别完成，可以继续问 AI。" : "识别完成，但可能没截全，请调整选区。";
    } catch (error) {
      STATE.message = error.message || "识别失败";
      window.MochiApp?.toast?.("识别失败");
    } finally {
      STATE.busy = false;
      render(STATE.container);
    }
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
    render(STATE.container);
    try {
      const current = items().find((entry) => entry.id === itemId) || item;
      const stableQuestion = recognitionContextText(current);
      const { active } = splitChatByContext(current);
      const history = [...active, { role: "user", content: question }]
        .slice(-8)
        .map((msg) => `${msg.role === "assistant" ? "AI" : "学生"}：${msg.content}`)
        .join("\n\n");
      const response = await window.MochiAI.callAIWithImage(
        DeskAI.QUESTION_DESK_PROMPT,
        `${stableQuestion ? `这是已经识别出的当前题目信息，请优先以它为准；图片只用于校验和补充：\n${stableQuestion}\n\n` : ""}这是本题当前版本的对话历史：\n${history}\n\n请继续回应学生。`,
        blob
      );
      appendChat(items().find((entry) => entry.id === itemId) || item, [
        { role: "user", content: question, createdAt: nowIso() },
        { role: "assistant", content: response || "我没有生成回复，请再试一次。", createdAt: nowIso() },
      ]);
      STATE.adjustingItemId = "";
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
      const stableQuestion = recognitionContextText(item);
      const { active } = splitChatByContext(item);
      const history = active
        .map((msg) => `${msg.role === "assistant" ? "AI" : "学生"}：${msg.content}`)
        .join("\n\n");
      const response = await window.MochiAI.callAIWithImage(
        DeskAI.QUESTION_DESK_PROMPT,
        `请根据这张题图、当前题目识别信息和以下对话，生成【MochiStudy 学习记录草稿】。必须使用固定中文标签，不要输出 MOCHI-RECORD 块。\n\n${stableQuestion ? `当前题目识别信息：\n${stableQuestion}\n\n` : ""}${history || "学生还没有详细对话，请根据题图生成一份保守草稿，并把不确定的地方写短一点。"}`,
        blob
      );
      const draft = parseDraft(response || "");
      updateItem(item.id, {
        chat: [...(item.chat || []), { role: "assistant", content: response || "未生成草稿。", createdAt: nowIso(), contextVersion: contextVersion(item) }],
        recordDraft: draft,
        subject: draft.subject || item.subject,
        nodeLabel: draft.nodeLabel || item.nodeLabel,
        nodeId: draft.nodeId || item.nodeId,
        status: "drafted",
      });
      if (draft.subject) updateImageSubject(item.imageId, draft.subject, { status: "asked" });
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
    if (item) updateImageSubject(item.imageId, draft.subject, { status: "saved", savedLogId: after });
    window.MochiPet?.renderMiniState?.();
    window.MochiFarm?.refreshFarmSummary?.();
    window.MochiCards?.refresh?.();
    STATE.message = "已保存到学习档案，复习队列也会自动接上。";
    window.MochiApp?.toast?.("题桌记录已保存");
    window.MochiApp?.sparkle?.(STATE.container, "★");
    render(STATE.container);
  }

  window.MochiQuestionDesk = { render, parseDraft, clearStorage, exportPackage, importPackage };
})();

