(function () {
  const STATE = {
    activeKey: "",
    activeOrigin: "",
    message: "",
    container: null,
    sessionActive: false,
  };

  function render(container) {
    if (!container) return;
    STATE.container = container;
    bindContainer(container);
    const reviewState = window.MochiReviewEngine?.buildReviewState?.() || { items: [], todaySuggestions: [] };
    const filteredItems = filterItems(reviewState.items, reviewState.todaySuggestions);
    const cooldownItems = filterCooldownItems(reviewState.items);
    const canSession = filteredItems.length >= 2;
    container.innerHTML = `
      <div class="page-head review-head">
        <div>
          <h2>复习</h2>
          <p>从最需要复习的开始，做完一个就算赢。</p>
        </div>
        ${canSession ? `
          <button class="btn btn-primary btn-sm review-session-btn" data-review-action="start-session" type="button">
            <span class="material-symbols-outlined" style="font-size:16px">quiz</span>综合测验
          </button>
        ` : ""}
      </div>

      ${STATE.message ? `<div class="review-toast-inline">${escapeHtml(STATE.message)}</div>` : ""}

      ${STATE.sessionActive ? renderSessionPanel() : ""}

      <div class="review-table">
        ${renderFlatList(filteredItems, reviewState.todaySuggestions, cooldownItems)}
      </div>

      <section class="review-help">
        <span class="material-symbols-outlined">sync_alt</span>
        <p>开始复习会复制材料；只有把复习 AI 输出粘回并成功导入，才算完成。</p>
      </section>
    `;
    scrollActiveReviewItem(container);
  }

  function scrollActiveReviewItem(container) {
    if (!STATE.activeKey) return;
    setTimeout(() => {
      const escaped = window.CSS?.escape ? CSS.escape(STATE.activeKey) : STATE.activeKey.replace(/"/g, '\\"');
      const target = container.querySelector(`[data-review-key="${escaped}"]`);
      target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function bindContainer(container) {
    if (container.__mochiReviewBound) return;
    container.__mochiReviewBound = true;
    // 粘贴即导入：在任一导入框贴进含完整记录块的内容时，自动触发对应的导入按钮。
    container.addEventListener("paste", (event) => {
      const textarea = event.target.closest?.("[data-review-input], [data-session-input]");
      if (!textarea) return;
      setTimeout(() => {
        if (!/---MOCHI-RECORD-END---/.test(textarea.value)) return;
        const card = textarea.closest("[data-review-card], [data-session-panel]");
        card?.querySelector('[data-review-action="import"], [data-review-action="session-import"]')?.click();
      }, 0);
    });
    container.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-review-action]");
      if (!button) return;
      const action = button.dataset.reviewAction;

      if (action === "start-session") {
        await startSessionReview(container);
        return;
      }
      if (action === "session-import") {
        importSession(container, button);
        return;
      }
      if (action === "session-dismiss") {
        STATE.sessionActive = false;
        STATE.message = "";
        render(container);
        return;
      }

      const key = button.dataset.reviewKey || "";
      const item = findItem(key);
      if (!item) return;
      if (action === "start") {
        await startReview(container, item, button.dataset.reviewOrigin || "");
        return;
      }
      if (action === "import") {
        importReviewResult(container, button, item);
        return;
      }
      if (action === "import-anyway") {
        importReviewAsDetected(container, button);
        return;
      }
      if (action === "cards") {
        openRelatedCards(item);
      }
    });
  }

  async function startSessionReview(container) {
    const pack = window.MochiReviewEngine?.generateSessionPack?.();
    if (!pack || pack.startsWith("暂无")) {
      window.MochiApp?.toast?.("复习队列里还没有足够的知识点");
      return;
    }
    const copied = await copyToClipboard(pack);
    STATE.sessionActive = true;
    STATE.message = copied
      ? "综合测验包已复制！粘给「综合测验 AI 私教」做完，再把全部输出一起粘到下面这个框导入。"
      : "复制失败，请手动复制测验包内容。";
    render(container);
    window.MochiApp?.toast?.(copied ? "综合测验包已复制" : "复制失败");
  }

  // 外部（学习档案）主动出测验时调用：复制任意范围的测验包，跳到复习页并打开综合测验粘回面板。
  async function openSessionForPack(pack, label) {
    if (!pack || pack.startsWith("暂无") || !pack.startsWith("【")) {
      window.MochiApp?.toast?.("这个范围还没有足够的记录可以出题");
      return;
    }
    const copied = await copyToClipboard(pack);
    STATE.sessionActive = true;
    STATE.message = copied
      ? `已复制「${label || "测验"}」的测验包，粘给「综合测验 AI 私教」做完，再把全部输出一起粘到下面导入。`
      : "复制失败，请重试。";
    window.MochiApp?.navigate?.("review");
    if (STATE.container) render(STATE.container);
    window.MochiApp?.toast?.(copied ? "测验包已复制" : "复制失败");
  }

  function importSession(container, button) {
    const panel = button.closest("[data-session-panel]");
    const textarea = panel?.querySelector("[data-session-input]");
    const result = panel?.querySelector("[data-session-result]");
    const text = textarea?.value || "";
    const records = window.MochiApp?.parseAllMochiRecords?.(text) || [];
    if (!result) return;
    result.hidden = false;
    if (!records.length) {
      result.innerHTML = `<strong>没有找到 MOCHI-RECORD</strong><p class="muted">请把综合测验 AI 输出里所有 ---MOCHI-RECORD-START--- 到 ---MOCHI-RECORD-END--- 的段落一起粘进来。</p>`;
      return;
    }
    records.forEach((rec) => window.MochiApp?.applyMochiRecord?.(rec));
    STATE.sessionActive = false;
    STATE.message = `综合测验完成，已导入 ${records.length} 条记录，继续保持！`;
    window.MochiApp?.toast?.(`已导入 ${records.length} 条记录`);
    window.MochiPet?.renderMiniState?.();
    window.MochiFarm?.refreshFarmSummary?.();
    window.MochiCards?.refresh?.();
    render(container);
    window.MochiApp?.sparkle?.(container, "★");
  }

  function renderSessionPanel() {
    return `
      <section class="review-session-panel" data-session-panel>
        <div class="review-session-head">
          <strong><span class="material-symbols-outlined">quiz</span>综合测验进行中</strong>
          <button class="review-session-dismiss" data-review-action="session-dismiss" type="button" aria-label="收起">✕</button>
        </div>
        <ol class="review-stepper">
          <li class="review-step done"><span class="review-step-num"><span class="material-symbols-outlined">check</span></span><span class="review-step-text">测验包已复制</span></li>
          <li class="review-step"><span class="review-step-num">2</span><span class="review-step-text">粘给「综合测验 AI 私教」，一题一题做完</span></li>
          <li class="review-step"><span class="review-step-num">3</span><span class="review-step-text">把 AI 输出的<b>全部记录</b>一起粘到下面，一次导入</span></li>
        </ol>
        <textarea id="session-input" data-session-input rows="4" placeholder="粘贴综合测验 AI 的全部输出（多段 MOCHI-RECORD）"></textarea>
        <button class="btn btn-primary" data-review-action="session-import" type="button" style="width:100%;margin-top:8px">
          <span class="material-symbols-outlined">download_done</span>导入全部测验结果
        </button>
        <div class="review-import-result" data-session-result hidden></div>
      </section>
    `;
  }

  async function startReview(container, item, origin) {
    const pack = window.MochiReviewEngine.generateNodeReviewPack(item);
    const copied = await copyToClipboard(pack);
    STATE.activeKey = item.key;
    STATE.activeOrigin = origin;
    STATE.message = copied
      ? `已复制“${item.subjectLabel} · ${item.nodeLabel}”的复习材料。先自己回想 20 秒，再去 AI 那里粘贴。`
      : "复制失败，可以展开后手动复制复习材料。";
    render(container);
    window.MochiApp?.toast?.(copied ? "复习材料已复制，可以粘贴给复习 AI" : "复制失败，请手动选择文本");
  }

  function importReviewResult(container, button, item) {
    const card = button.closest("[data-review-card]");
    const textarea = card?.querySelector("[data-review-input]");
    const result = card?.querySelector("[data-review-result]");
    const text = textarea?.value || "";
    const record = window.MochiApp?.parseMochiRecord?.(text);
    if (!result) return;
    result.hidden = false;
    if (!record) {
      result.innerHTML = `<strong>没有找到 MOCHI-RECORD</strong><p class="muted">请粘贴 AI 最后输出的完整记录段，必须同时包含 ---MOCHI-RECORD-START--- 和 ---MOCHI-RECORD-END---。如果 AI 只给了解题过程，让它补上这段记录。</p>`;
      return;
    }

    const normalizedLabel = window.MochiCards?.normalizeNodeLabel?.(record.subject, record.nodeLabel, record.nodeId) || record.nodeLabel;
    if (record.subject !== item.subject || normalizedLabel !== item.nodeLabel) {
      result.innerHTML = `
        <strong>这条记录和当前复习项不太一样</strong>
        <p class="muted">当前复习的是 ${escapeHtml(item.subjectLabel)} · ${escapeHtml(item.nodeLabel)}，但粘贴内容识别为 ${escapeHtml(subjectLabel(record.subject))} · ${escapeHtml(normalizedLabel || "未知知识点")}。可以仍然导入，它会归到识别到的知识点下，只是不计入本次复习项。</p>
        <button class="btn btn-soft btn-sm" data-review-action="import-anyway" data-review-key="${escapeHtml(item.key)}" type="button" style="margin-top:8px">
          <span class="material-symbols-outlined">download_done</span>按「${escapeHtml(subjectLabel(record.subject))} · ${escapeHtml(normalizedLabel || "未知知识点")}」导入
        </button>
      `;
      return;
    }

    record.nodeLabel = item.nodeLabel;
    record.nodeId = item.nodeId;
    record.meta = {
      ...(record.meta || {}),
      source: "review",
      sourceRecordIds: Array.isArray(record.meta?.sourceRecordIds) && record.meta.sourceRecordIds.length
        ? record.meta.sourceRecordIds
        : item.entries.map((log) => window.MochiReviewEngine.cardId(log)),
    };

    const applied = window.MochiApp?.applyMochiRecord?.(record);
    if (!applied) {
      result.innerHTML = `<strong>导入失败</strong><p class="muted">当前页面还没有连接到导入逻辑，请刷新后再试。</p>`;
      return;
    }

    textarea.value = "";
    STATE.activeKey = "";
    STATE.activeOrigin = "";
    const starMsgs = {
      3: `”${item.nodeLabel}”做对了，暂时降权，继续保持。`,
      2: `”${item.nodeLabel}”基本掌握，下次还会再出现。`,
      1: `”${item.nodeLabel}”记录了卡点，下次重点照顾。`,
    };
    STATE.message = starMsgs[record.stars] || `已导入”${item.subjectLabel} · ${item.nodeLabel}”的复习结果。`;
    window.MochiApp?.toast?.("复习结果已导入");
    window.MochiPet?.renderMiniState?.();
    window.MochiFarm?.refreshFarmSummary?.();
    window.MochiCards?.refresh?.();
    render(container);
    window.MochiApp?.sparkle?.(container, "✓");
  }

  // 知识点不匹配时的兜底：按 AI 识别到的知识点照实导入，不丢失学生的劳动，也不污染复习项标签。
  function importReviewAsDetected(container, button) {
    const card = button.closest("[data-review-card]");
    const textarea = card?.querySelector("[data-review-input]");
    const result = card?.querySelector("[data-review-result]");
    const text = textarea?.value || "";
    const record = window.MochiApp?.parseMochiRecord?.(text);
    if (!result) return;
    result.hidden = false;
    if (!record) {
      result.innerHTML = `<strong>没有找到 MOCHI-RECORD</strong><p class="muted">请粘贴 AI 最后输出的完整记录段。</p>`;
      return;
    }
    const detectedLabel = window.MochiCards?.normalizeNodeLabel?.(record.subject, record.nodeLabel, record.nodeId) || record.nodeLabel;
    record.nodeLabel = detectedLabel;
    const applied = window.MochiApp?.applyMochiRecord?.(record);
    if (!applied) {
      result.innerHTML = `<strong>导入失败</strong><p class="muted">请刷新后再试。</p>`;
      return;
    }
    if (textarea) textarea.value = "";
    STATE.activeKey = "";
    STATE.activeOrigin = "";
    STATE.message = `已按「${subjectLabel(record.subject)} · ${detectedLabel}」导入并归档，这条没有计入刚才的复习项。`;
    window.MochiApp?.toast?.("已导入");
    window.MochiPet?.renderMiniState?.();
    window.MochiFarm?.refreshFarmSummary?.();
    window.MochiCards?.refresh?.();
    render(container);
    window.MochiApp?.sparkle?.(container, "✓");
  }

  function openRelatedCards(item) {
    window.MochiKnowledge?.setActiveSubject?.(item.subject);
    window.MochiApp?.navigate?.("map");
    setTimeout(() => window.MochiKnowledge?.renderDetail?.(item.nodeId), 0);
  }

  async function startItem(key, origin = "suggestion") {
    const item = findItem(key);
    if (!item) return false;
    const pack = window.MochiReviewEngine.generateNodeReviewPack(item);
    const copied = await copyToClipboard(pack);
    STATE.activeKey = item.key;
    STATE.activeOrigin = origin;
    STATE.message = copied
      ? `已复制”${item.subjectLabel} · ${item.nodeLabel}”的复习材料。先自己回想 20 秒，再去 AI 那里粘贴。`
      : "复制失败，可以展开后手动复制复习材料。";
    window.MochiApp?.navigate?.("review");
    if (STATE.container) render(STATE.container);
    return copied;
  }

  function copyItemPack(key) {
    const item = findItem(key);
    if (!item) return false;
    const pack = window.MochiReviewEngine.generateNodeReviewPack(item);
    return copyToClipboard(pack);
  }

  function importItemByKey(key, text, callbacks = {}) {
    const item = findItem(key);
    if (!item) {
      callbacks.onError?.("找不到该复习项目，请刷新后重试。");
      return;
    }
    const record = window.MochiApp?.parseMochiRecord?.(text);
    if (!record) {
      callbacks.onError?.("没有找到 MOCHI-RECORD，请粘贴 AI 最后输出的完整记录段，必须同时包含 ---MOCHI-RECORD-START--- 和 ---MOCHI-RECORD-END---。");
      return;
    }
    const normalizedLabel = window.MochiCards?.normalizeNodeLabel?.(record.subject, record.nodeLabel, record.nodeId) || record.nodeLabel;
    if (record.subject !== item.subject || normalizedLabel !== item.nodeLabel) {
      // 知识点对不上时不丢弃，照实归档到识别到的知识点，只是不计入本次复习项。
      record.nodeLabel = normalizedLabel;
      const appliedAsDetected = window.MochiApp?.applyMochiRecord?.(record);
      if (!appliedAsDetected) {
        callbacks.onError?.("导入失败，请刷新后重试。");
        return;
      }
      window.MochiApp?.toast?.("已导入");
      window.MochiPet?.renderMiniState?.();
      window.MochiFarm?.refreshFarmSummary?.();
      window.MochiCards?.refresh?.();
      callbacks.onSuccess?.(`已按「${subjectLabel(record.subject)} · ${normalizedLabel}」导入归档，这条没有计入「${item.nodeLabel}」的复习。`);
      return;
    }
    record.nodeLabel = item.nodeLabel;
    record.nodeId = item.nodeId;
    record.meta = {
      ...(record.meta || {}),
      source: "review",
      sourceRecordIds: Array.isArray(record.meta?.sourceRecordIds) && record.meta.sourceRecordIds.length
        ? record.meta.sourceRecordIds
        : item.entries.map((log) => window.MochiReviewEngine.cardId(log)),
    };
    const applied = window.MochiApp?.applyMochiRecord?.(record);
    if (!applied) {
      callbacks.onError?.("导入失败，请刷新后重试。");
      return;
    }
    window.MochiApp?.toast?.("复习结果已导入");
    window.MochiPet?.renderMiniState?.();
    window.MochiFarm?.refreshFarmSummary?.();
    window.MochiCards?.refresh?.();
    const starMsgs = {
      3: `「${item.nodeLabel}」做对了，下次冷却，继续保持。`,
      2: `「${item.nodeLabel}」基本掌握，下次还会再出现。`,
      1: `「${item.nodeLabel}」记录了卡点，下次重点照顾。`,
    };
    callbacks.onSuccess?.(starMsgs[record.stars] || "已导入复习结果。");
  }

  function findItem(key) {
    return (window.MochiReviewEngine?.buildReviewState?.().items || []).find((item) => item.key === key);
  }

  function filterItems(items, todaySuggestions) {
    const skipKeys = new Set((todaySuggestions || []).map((s) => s.key));
    return items.filter((item) => {
      if (skipKeys.has(item.key)) return false;
      return !["stable", "consolidating"].includes(item.status) && item.score > 0;
    });
  }

  function filterCooldownItems(items) {
    return items.filter((item) => {
      return ["stable", "consolidating"].includes(item.status) && item.score >= 0;
    });
  }

  function renderFlatList(activeItems, todaySuggestions, cooldownItems) {
    const todayKeys = new Set((todaySuggestions || []).map((s) => s.key));
    if (!activeItems.length && !todaySuggestions.length) {
      const hasAnyLog = (window.MochiApp?.readStudyLogs?.() || []).length > 0;
      // 零数据（还没开始）和已追平（都复习过了）是两种不同的空，文案要分开。
      if (!hasAnyLog) {
        return `<div class="review-empty"><span class="material-symbols-outlined">rate_review</span><p>还没有学习记录。先去首页导入一条，复习队列会自动排起来。</p><button class="btn btn-soft btn-sm" data-route="home" type="button" style="margin-top:10px"><span class="material-symbols-outlined">upload_file</span>去导入</button></div>`;
      }
      return renderEmpty("目前没有需要复习的薄弱点，先去学新题吧 👍");
    }
    const allVisible = [...todaySuggestions, ...activeItems];
    const rows = allVisible.map((item) => renderReviewRow(item, todayKeys.has(item.key))).join("");
    const cooldown = cooldownItems.length ? `
      <details class="review-cooldown-section">
        <summary class="review-cooldown-summary">
          <span>冷却 / 已稳定</span>
          <span class="review-cooldown-count">${cooldownItems.length} 项近期不需要处理</span>
        </summary>
        <div class="review-table review-cooldown-table">
          ${cooldownItems.map((item) => renderReviewRow(item, false)).join("")}
        </div>
      </details>
    ` : "";
    return rows + cooldown;
  }

  function renderReviewRow(item, isToday = false) {
    const expanded = STATE.activeKey === item.key && (STATE.activeOrigin === "row" || STATE.activeOrigin === "suggestion");
    const reason = item.primaryReason || item.summaryLine || "";
    return `
      <article class="review-row ${expanded ? "active" : ""} ${isToday ? "review-row-today" : ""}" data-review-card data-review-key="${escapeHtml(item.key)}" style="--subject-color:${escapeHtml(item.subjectColor || "#864d61")}">
        <div class="review-row-main">
          <span class="chip ${item.subject} review-row-chip">${escapeHtml(item.subjectLabel)}</span>
          ${isToday ? `<span class="review-today-badge">今日</span>` : ""}
          <div class="review-row-info">
            <strong>${formatRichText(item.nodeLabel)}</strong>
            <span class="review-row-reason">${formatRichText(reason)}</span>
          </div>
          <button class="btn btn-soft btn-sm review-row-start" data-review-action="start" data-review-origin="${isToday ? "suggestion" : "row"}" data-review-key="${escapeHtml(item.key)}" type="button">
            <span class="material-symbols-outlined">play_arrow</span>开始
          </button>
        </div>
        ${expanded ? renderImportPanel(item) : ""}
      </article>
    `;
  }

  function renderImportPanel(item) {
    const pack = window.MochiReviewEngine.generateNodeReviewPack(item);
    return `
      <div class="review-import-panel">
        <ol class="review-stepper">
          <li class="review-step done">
            <span class="review-step-num"><span class="material-symbols-outlined">check</span></span>
            <span class="review-step-text">材料已复制到剪贴板</span>
          </li>
          <li class="review-step">
            <span class="review-step-num">2</span>
            <span class="review-step-text">打开复习 AI，<b>先自己回想 20 秒</b>，再粘贴做题</span>
          </li>
          <li class="review-step">
            <span class="review-step-num">3</span>
            <span class="review-step-text">做完，把 AI 最后输出（含 MOCHI-RECORD 那段）整段粘到下面，点导入</span>
          </li>
        </ol>
        <div class="review-import-inline">
          <textarea id="review-input-${escapeHtml(item.key)}" data-review-input rows="3" placeholder="粘贴 AI 输出（只要包含 ---MOCHI-RECORD-START--- 那段即可）"></textarea>
          <button class="btn btn-primary" data-review-action="import" data-review-key="${escapeHtml(item.key)}" type="button">
            <span class="material-symbols-outlined">download_done</span>导入复习结果
          </button>
        </div>
        <details class="review-pack-preview">
          <summary>查看复习材料</summary>
          <textarea readonly>${escapeHtml(pack)}</textarea>
        </details>
        <div class="review-import-result" data-review-result hidden></div>
      </div>
    `;
  }

  function renderEmpty(text) {
    return `<div class="review-empty"><span class="material-symbols-outlined">task_alt</span><p>${escapeHtml(text)}</p></div>`;
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  function subjectLabel(subject) {
    return window.MochiKnowledge?.SUBJECTS?.[subject]?.label || "数学";
  }

  function escapeHtml(value) {
    return window.MochiApp?.escapeHtml?.(value) ?? String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function formatRichText(value) {
    return window.MochiApp?.formatRichText?.(value) ?? escapeHtml(value);
  }

  window.MochiReviewPage = { render, startItem, copyItemPack, importItemByKey, openSessionForPack };
})();
