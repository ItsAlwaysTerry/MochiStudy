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
            <p class="muted">只推最该处理的 1-2 个，复习完会按结果降权或进入巩固期。</p>
          </div>
        </div>
        <div class="review-suggestion-list">
          ${reviewState.todaySuggestions.length
            ? reviewState.todaySuggestions.map((item, index) => renderTodayTask(item, index)).join("")
            : renderEmpty("今天没有特别紧急的薄弱点，可以从待处理里挑一个轻量回顾。")}
        </div>
      </section>

      <section class="review-section">
        <div class="section-title-row">
          <div>
            <h3>待处理</h3>
            <p class="muted">每一行是一个知识点，不是单张卡片。近期稳定和待巩固在下方折叠区。</p>
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
      ? `已复制“${item.subjectLabel} · ${item.nodeLabel}”的复习材料。`
      : "复制失败，可以展开后手动复制复习材料。";
    render(container);
    window.MochiApp?.toast?.(copied ? "复习材料已复制" : "复制失败，请手动选择文本");
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
      result.innerHTML = `<strong>没有找到 MOCHI-RECORD</strong><p class="muted">请粘贴包含 ---MOCHI-RECORD-START--- 和 ---MOCHI-RECORD-END--- 的完整结果。</p>`;
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
    STATE.message = `已导入“${item.subjectLabel} · ${item.nodeLabel}”的复习结果。`;
    window.MochiApp?.toast?.("复习结果已导入");
    window.MochiPet?.renderMiniState?.();
    window.MochiFarm?.refreshFarmSummary?.();
    window.MochiCards?.refresh?.();
    render(container);
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
      ? `已复制“${item.subjectLabel} · ${item.nodeLabel}”的复习材料。`
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
            <div>
              <small>状态</small>
              <p>${escapeHtml(item.summaryLine)}</p>
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
    return `
      <article class="review-row ${expanded ? "active" : ""}" data-review-card data-review-key="${escapeHtml(item.key)}">
        <div class="review-row-grid">
          <strong>${escapeHtml(item.subjectLabel)} · ${escapeHtml(item.nodeLabel)}</strong>
          <span>${escapeHtml(statusLabel(item.status))}</span>
          <span>${item.daysSinceLastStudy}天前</span>
          <span>${item.lowStarCount}次低星</span>
          <span>${item.reviewCount}次复习</span>
          <span>${escapeHtml(item.lastReviewResult || "暂无")}</span>
          <button class="btn btn-soft btn-sm" data-review-action="start" data-review-origin="row" data-review-key="${escapeHtml(item.key)}" type="button">开始</button>
        </div>
        ${expanded ? renderImportPanel(item) : ""}
      </article>
    `;
  }

  function renderImportPanel(item) {
    const pack = window.MochiReviewEngine.generateNodeReviewPack(item);
    return `
      <div class="review-import-panel">
        <div class="review-import-brief">
          <span class="material-symbols-outlined">content_copy</span>
          <p>材料已复制。复习完成后把 AI 输出粘到右边。</p>
        </div>
        <div class="review-import-inline">
          <label for="review-input-${escapeHtml(item.key)}">复习结果</label>
          <textarea id="review-input-${escapeHtml(item.key)}" data-review-input rows="1" placeholder="粘贴 MOCHI-RECORD"></textarea>
          <button class="btn btn-primary" data-review-action="import" data-review-key="${escapeHtml(item.key)}" type="button">
            <span class="material-symbols-outlined">download_done</span>导入复习结果
          </button>
        </div>
        <details class="review-pack-preview">
          <summary>查看材料</summary>
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
