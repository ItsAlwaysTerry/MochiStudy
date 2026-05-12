(function () {
  const PENDING_VISIBLE_CAP = 4;

  const STATE = {
    subjectFilter: "all",
    activeKey: "",
    activeOrigin: "",
    message: "",
    pendingExpanded: false,
    container: null,
  };

  function render(container) {
    if (!container) return;
    STATE.container = container;
    bindContainer(container);
    const reviewState = window.MochiReviewEngine?.buildReviewState?.() || { items: [], todaySuggestions: [] };
    const filteredItems = filterItems(reviewState.items);
    const cooldownItems = filterCooldownItems(reviewState.items);
    container.innerHTML = `
      <div class="page-head review-head">
        <div>
          <h2>复习</h2>
          <p>今天先处理 1-2 个薄弱点，不用贪多。</p>
        </div>
      </div>

      ${STATE.message ? `<div class="review-toast-inline">${escapeHtml(STATE.message)}</div>` : ""}

      <section class="review-section">
        <div class="section-title-row">
          <div>
            <h3>今日建议</h3>
            <p class="muted">一次只做 1-2 个，做完就算成功，不用贪多。</p>
          </div>
        </div>
        <div class="review-suggestion-list">
          ${reviewState.todaySuggestions.length
            ? reviewState.todaySuggestions.map((item, index) => renderTodayTask(item, index)).join("")
            : renderTodayEmpty(filteredItems.length)}
        </div>
      </section>

      <section class="review-section">
        <div class="section-title-row">
          <div>
            <h3>待处理</h3>
            <p class="muted">可以随时挑一个做，做完导入复习结果就完成了。稳定和巩固中的在下方。</p>
          </div>
        </div>
        ${renderFilters()}
        <div class="review-table">
          ${renderPendingList(filteredItems)}
        </div>
      </section>

      ${cooldownItems.length ? `
      <details class="review-section review-cooldown-section">
        <summary class="review-cooldown-summary">
          <span>冷却 / 已稳定</span>
          <span class="review-cooldown-count">${cooldownItems.length} 项近期不需要处理</span>
        </summary>
        <div class="review-table review-cooldown-table">
          ${cooldownItems.map((item) => renderReviewRow(item)).join("")}
        </div>
      </details>
      ` : ""}

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
    container.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-review-action]");
      if (!button) return;
      const action = button.dataset.reviewAction;
      if (action === "filter-subject") {
        STATE.subjectFilter = button.dataset.value || "all";
        STATE.pendingExpanded = false;
        render(container);
        return;
      }
      if (action === "expand-pending") {
        STATE.pendingExpanded = !STATE.pendingExpanded;
        render(container);
        return;
      }
      if (action === "scroll-pending") {
        const pendingSection = container.querySelector(".review-section:nth-of-type(2)");
        pendingSection?.scrollIntoView?.({ behavior: "smooth", block: "start" });
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
      if (action === "cards") {
        openRelatedCards(item);
      }
    });
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
        <strong>这条记录和当前复习项不匹配</strong>
        <p class="muted">当前是 ${escapeHtml(item.subjectLabel)} · ${escapeHtml(item.nodeLabel)}，粘贴内容识别为 ${escapeHtml(subjectLabel(record.subject))} · ${escapeHtml(normalizedLabel || "未知知识点")}。</p>
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

  function findItem(key) {
    return (window.MochiReviewEngine?.buildReviewState?.().items || []).find((item) => item.key === key);
  }

  function filterItems(items) {
    return items.filter((item) => {
      if (STATE.subjectFilter !== "all" && item.subject !== STATE.subjectFilter) return false;
      return !["stable", "consolidating"].includes(item.status) && item.score > 0;
    });
  }

  function filterCooldownItems(items) {
    return items.filter((item) => {
      if (STATE.subjectFilter !== "all" && item.subject !== STATE.subjectFilter) return false;
      return ["stable", "consolidating"].includes(item.status) && item.score >= 0;
    });
  }

  function renderPendingList(items) {
    if (!items.length) return renderEmpty("当前筛选下没有待处理的薄弱点。");
    if (items.length <= PENDING_VISIBLE_CAP || STATE.pendingExpanded) {
      const rows = items.map((item) => renderReviewRow(item)).join("");
      if (items.length <= PENDING_VISIBLE_CAP) return rows;
      return rows + `
        <button class="review-pending-toggle" data-review-action="expand-pending" type="button">
          <span class="material-symbols-outlined">expand_less</span>收起
        </button>`;
    }
    const hidden = items.length - PENDING_VISIBLE_CAP;
    return items.slice(0, PENDING_VISIBLE_CAP).map((item) => renderReviewRow(item)).join("") + `
      <button class="review-pending-toggle" data-review-action="expand-pending" type="button">
        <span class="material-symbols-outlined">expand_more</span>还有 ${hidden} 项待处理 — 显示全部
      </button>`;
  }

  function renderFilters() {
    const subjects = [["all", "全部"], ...Object.entries(window.MochiKnowledge?.SUBJECTS || {}).map(([key, item]) => [key, item.label])];
    return `
      <div class="review-filter-bar">
        <div class="review-filter-group">
          ${subjects.map(([value, label]) => `
            <button class="${STATE.subjectFilter === value ? "active" : ""}" data-review-action="filter-subject" data-value="${escapeHtml(value)}" type="button">${escapeHtml(label)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderTodayTask(item, index) {
    const expanded = STATE.activeKey === item.key && STATE.activeOrigin === "suggestion";
    return `
      <article class="review-task ${expanded ? "active" : ""}" data-review-card data-review-key="${escapeHtml(item.key)}" style="--subject-color:${escapeHtml(item.subjectColor || "#864d61")}">
        <div class="review-task-index">${index + 1}</div>
        <div class="review-task-main">
          <div class="review-task-title">
            <span>${escapeHtml(item.subjectLabel)}</span>
            <strong>${escapeHtml(item.nodeLabel)}</strong>
            <em>${escapeHtml(item.statusLabel)}</em>
          </div>
          <div class="review-task-grid">
            <div>
              <small>主要卡点</small>
              <p>${escapeHtml(item.mainPainPoint || "没有明确卡点，适合轻量回顾。")}</p>
            </div>
            <div>
              <small>为什么今天</small>
              <p>${escapeHtml(item.primaryReason)}</p>
            </div>
          </div>
        </div>
        <div class="review-actions">
          <button class="btn btn-primary btn-sm" data-review-action="start" data-review-origin="suggestion" data-review-key="${escapeHtml(item.key)}" type="button">
            <span class="material-symbols-outlined">play_arrow</span>开始复习
          </button>
          <button class="btn btn-outline btn-sm" data-review-action="cards" data-review-key="${escapeHtml(item.key)}" type="button">
            <span class="material-symbols-outlined">collections_bookmark</span>看卡片
          </button>
        </div>
        ${expanded ? renderImportPanel(item) : ""}
      </article>
    `;
  }

  function renderReviewRow(item) {
    const expanded = STATE.activeKey === item.key && STATE.activeOrigin === "row";
    const reason = item.primaryReason || item.summaryLine || "";
    return `
      <article class="review-row ${expanded ? "active" : ""}" data-review-card data-review-key="${escapeHtml(item.key)}" style="--subject-color:${escapeHtml(item.subjectColor || "#864d61")}">
        <div class="review-row-main">
          <span class="chip ${item.subject} review-row-chip">${escapeHtml(item.subjectLabel)}</span>
          <div class="review-row-info">
            <strong>${escapeHtml(item.nodeLabel)}</strong>
            <span class="review-row-reason">${escapeHtml(reason)}</span>
          </div>
          <button class="btn btn-soft btn-sm review-row-start" data-review-action="start" data-review-origin="row" data-review-key="${escapeHtml(item.key)}" type="button">
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
        <ol class="review-steps">
          <li class="review-step done">
            <span class="review-step-num">1</span>
            <span>复习材料已复制到剪贴板</span>
          </li>
          <li class="review-step">
            <span class="review-step-num">2</span>
            <span>先别急着粘贴，自己回想 20 秒：这个卡点到底卡在哪里？</span>
          </li>
          <li class="review-step">
            <span class="review-step-num">3</span>
            <span>打开「高考复习 AI 私教」→ 粘贴材料，让它出一道题</span>
          </li>
          <li class="review-step">
            <span class="review-step-num">4</span>
            <span>复习完成后，把 AI 最后输出的内容（含 MOCHI-RECORD）整段粘到下方</span>
          </li>
        </ol>
        <div class="review-recall-card">
          <span class="material-symbols-outlined">psychology_alt</span>
          <p>先在脑子里试着说出解题入口，再看 AI 出题。想不出来也没关系，这一下才是有效复习的开始。</p>
        </div>
        <div class="review-import-inline">
          <textarea id="review-input-${escapeHtml(item.key)}" data-review-input rows="2" placeholder="粘贴 AI 输出（只要包含 ---MOCHI-RECORD-START--- 那段即可）"></textarea>
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

  function renderTodayEmpty(pendingCount) {
    if (pendingCount > 0) {
      return `
        <div class="review-empty review-today-empty">
          <span class="material-symbols-outlined">task_alt</span>
          <div>
            <p>今天没有特别紧急的薄弱点，这是好事。</p>
            <button class="btn btn-soft btn-sm" data-review-action="scroll-pending" type="button">
              下面有 ${pendingCount} 项可以轻量回顾
              <span class="material-symbols-outlined">arrow_downward</span>
            </button>
          </div>
        </div>
      `;
    }
    return `<div class="review-empty"><span class="material-symbols-outlined">task_alt</span><p>目前没有需要处理的薄弱点，继续导入新记录吧。</p></div>`;
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

  function statusLabel(status) {
    return {
      "not-reviewed": "未复习",
      "review-soon": "需复习",
      "needs-work": "仍需继续",
      consolidating: "待巩固",
      stable: "近期稳定",
    }[status] || "需复习";
  }

  function stars(value) {
    const count = Math.max(1, Math.min(3, Number(value || 1)));
    return `${"★".repeat(count)}${"☆".repeat(3 - count)}`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  window.MochiReviewPage = { render, startItem };
})();
