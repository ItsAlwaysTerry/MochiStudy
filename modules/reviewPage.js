(function () {
  const STATE = {
    activeKey: "",
    activeOrigin: "",
    message: "",
    container: null,
  };

  function render(container) {
    if (!container) return;
    STATE.container = container;
    bindContainer(container);
    const reviewState = window.MochiReviewEngine?.buildReviewState?.() || { items: [], todaySuggestions: [] };
    const filteredItems = filterItems(reviewState.items, reviewState.todaySuggestions);
    const cooldownItems = filterCooldownItems(reviewState.items);
    container.innerHTML = `
      <div class="page-head review-head">
        <div>
          <h2>复习</h2>
          <p>从最需要复习的开始，做完一个就算赢。</p>
        </div>
      </div>

      ${STATE.message ? `<div class="review-toast-inline">${escapeHtml(STATE.message)}</div>` : ""}

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
    container.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-review-action]");
      if (!button) return;
      const action = button.dataset.reviewAction;
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
      callbacks.onError?.(`这条记录不是「${item.nodeLabel}」的内容，请检查 AI 输出是否匹配本次复习项目。`);
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
      return renderEmpty("目前没有需要处理的薄弱点，继续导入新记录吧。");
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
        <p class="review-panel-hint">
          ✓ 材料已复制 · 先自己回想 20 秒，再去 AI 那里粘贴做题<br>
          做完后，把 AI 最后输出的内容（含 MOCHI-RECORD）整段粘到下方
        </p>
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

  function formatRichText(value) {
    const escaped = escapeHtml(value).replace(/＄/g, "$");
    return escaped.replace(/\$([^$\n]+)\$/g, (_, formula) => `<span class="math-inline">${formatInlineMath(formula)}</span>`);
  }

  function formatInlineMath(value) {
    let text = String(value || "");
    text = text
      .replace(/\\cdot/g, "·")
      .replace(/\\times/g, "×")
      .replace(/\\div/g, "÷")
      .replace(/\\leq/g, "≤")
      .replace(/\\geq/g, "≥")
      .replace(/\\neq/g, "≠")
      .replace(/\\left/g, "")
      .replace(/\\right/g, "")
      .replace(/\\,/g, " ");
    const symbols = {
      "\\sin": "sin",
      "\\cos": "cos",
      "\\tan": "tan",
      "\\ln": "ln",
      "\\log": "log",
      "\\rightleftharpoons": "⇌",
      "\\alpha": "α",
      "\\beta": "β",
      "\\gamma": "γ",
      "\\Gamma": "Γ",
      "\\delta": "δ",
      "\\Delta": "Δ",
      "\\epsilon": "ε",
      "\\theta": "θ",
      "\\lambda": "λ",
      "\\mu": "μ",
      "\\pi": "π",
      "\\rho": "ρ",
      "\\sigma": "σ",
      "\\omega": "ω",
      "\\Omega": "Ω",
      "\\phi": "φ",
      "\\Phi": "Φ",
    };
    Object.entries(symbols).forEach(([source, target]) => {
      text = text.replaceAll(source, target);
    });
    text = text.replace(/([A-Za-z0-9)]+)\^\{([^{}]+)\}/g, "$1<sup>$2</sup>");
    text = text.replace(/([A-Za-z0-9)]+)\^([A-Za-z0-9]+)/g, "$1<sup>$2</sup>");
    text = text.replace(/([A-Za-z0-9)]+)_\{([^{}]+)\}/g, "$1<sub>$2</sub>");
    text = text.replace(/([A-Za-z0-9)]+)_([A-Za-z0-9]+)/g, "$1<sub>$2</sub>");
    text = replaceMathCommand(text, "dfrac", 2, (top, bottom) => (
      `<span class="math-frac"><span class="math-num">${top}</span><span class="math-den">${bottom}</span></span>`
    ));
    text = replaceMathCommand(text, "tfrac", 2, (top, bottom) => (
      `<span class="math-frac"><span class="math-num">${top}</span><span class="math-den">${bottom}</span></span>`
    ));
    text = replaceMathCommand(text, "frac", 2, (top, bottom) => (
      `<span class="math-frac"><span class="math-num">${top}</span><span class="math-den">${bottom}</span></span>`
    ));
    text = replaceMathCommand(text, "sqrt", 1, (radicand) => (
      `<span class="math-sqrt"><span class="math-radicand">${radicand}</span></span>`
    ));
    text = replaceMathCommand(text, "dfrac", 2, (top, bottom) => (
      `<span class="math-frac"><span class="math-num">${top}</span><span class="math-den">${bottom}</span></span>`
    ));
    text = replaceMathCommand(text, "tfrac", 2, (top, bottom) => (
      `<span class="math-frac"><span class="math-num">${top}</span><span class="math-den">${bottom}</span></span>`
    ));
    text = replaceMathCommand(text, "frac", 2, (top, bottom) => (
      `<span class="math-frac"><span class="math-num">${top}</span><span class="math-den">${bottom}</span></span>`
    ));
    text = text.replace(/\\?sqrt\s*([A-Za-z0-9]+)/g, `<span class="math-sqrt"><span class="math-radicand">$1</span></span>`);
    return text;
  }

  function replaceMathCommand(text, command, arity, render) {
    const slash = "\\\\?";
    const pattern = arity === 2
      ? new RegExp(`${slash}${command}\\s*\\{([^{}]+)\\}\\s*\\{([^{}]+)\\}`, "g")
      : new RegExp(`${slash}${command}\\s*\\{([^{}]+)\\}`, "g");
    let next = text;
    for (let i = 0; i < 8; i += 1) {
      const replaced = arity === 2
        ? next.replace(pattern, (_, first, second) => render(first, second))
        : next.replace(pattern, (_, first) => render(first));
      if (replaced === next) break;
      next = replaced;
    }
    return next;
  }

  window.MochiReviewPage = { render, startItem, copyItemPack, importItemByKey };
})();
