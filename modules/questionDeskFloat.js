(function () {
  // 题桌浮层（GoodNotes 式画布优先）：题旁小气泡 + 可拖动浮窗/橱窗的「外壳」。
  // 只负责浮层的结构、定位与拖动几何；对话/草稿/识别等内容由 questionDesk.js
  // 用既有 helper 计算成 HTML 字符串，通过 slots 注入。STATE/事件/AI/保存仍在主模块。
  const Selection = window.MochiQuestionDeskSelection || {};

  function escapeHtml(value) {
    return window.MochiApp?.escapeHtml?.(value) ?? String(value ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // 把选区 rect 换算成图像内百分比锚点（与 marker 同坐标系，随图缩放/滚动）。
  function anchorPercent(item) {
    const pos = Selection.markerPosition ? Selection.markerPosition(item) : { x: 0, y: 0 };
    return { x: (pos.x || 0) * 100, y: (pos.y || 0) * 100 };
  }

  // 题旁小气泡：贴着选区「外面」浮出（默认在选区下方，选区贴底时改到上方），
  // 不再压在题目框里挡住题目。一个输入框 + 发送。
  function renderBubble(opts) {
    const { item, busy } = opts || {};
    if (!item) return "";
    const rect = item.rect;
    let left;
    let top;
    let xShift = "0";
    let yShift = "0";
    if (rect && Number.isFinite(Number(rect.x))) {
      const x = Number(rect.x) || 0;
      const y = Number(rect.y) || 0;
      const w = Number(rect.w) || 0;
      const h = Number(rect.h) || 0;
      const boxBottom = (y + h) * 100;
      const boxTop = y * 100;
      left = Math.max(1, Math.min(94, x * 100));
      if (boxBottom <= 88) {
        // 选区下方留得下：放下方
        top = boxBottom + 1.5;
        yShift = "0";
      } else {
        // 选区贴近底部：放上方（气泡底边贴选区顶边）
        top = Math.max(2, boxTop - 1.5);
        yShift = "-100%";
      }
    } else {
      // 整张题图（无选区）：沿用左上角锚点
      const pos = anchorPercent(item);
      const alignRight = pos.x > 64;
      xShift = alignRight ? "-100%" : "0";
      left = Math.max(1, Math.min(99, pos.x + (alignRight ? -1.5 : 1.5)));
      top = Math.max(1, Math.min(96, pos.y + 1.5));
    }
    return `
      <div class="qd-bubble" style="--qb-left:${left}%;--qb-top:${top}%;--qb-x-shift:${xShift};--qb-y-shift:${yShift}" data-qd-bubble data-item-id="${escapeHtml(item.id)}">
        <input class="qd-bubble-input" data-qd-question data-item-id="${escapeHtml(item.id)}" placeholder="问 AI 关于这道题…" />
        <button class="qd-bubble-send" data-qd-action="ask-ai" data-item-id="${escapeHtml(item.id)}" type="button" title="问 AI" ${busy ? "disabled" : ""}>
          <span class="material-symbols-outlined">arrow_upward</span>
        </button>
        <button class="qd-bubble-expand" data-qd-action="open-float" data-item-id="${escapeHtml(item.id)}" type="button" title="展开学习浮窗">
          <span class="material-symbols-outlined">open_in_full</span>
        </button>
      </div>
    `;
  }

  // 可拖动浮窗 / 回看橱窗：同一组件既是「新问」也是「回看」。
  // slots: { title, subtitle, thumbHtml, savedCardHtml, recognitionHtml, chatHtml, askBoxHtml, draftHtml }
  function renderWindow(opts) {
    const { item, slots = {}, pos, minimized, busy, saved } = opts || {};
    if (!item) return "";
    const posStyle = pos && Number.isFinite(pos.left) && Number.isFinite(pos.top)
      ? `left:${pos.left}px;top:${pos.top}px`
      : (() => {
        const a = anchorPercent(item);
        const alignRight = a.x > 56;
        return `left:${Math.max(2, Math.min(70, a.x + (alignRight ? -2 : 2)))}%;top:${Math.max(2, Math.min(58, a.y))}%`;
      })();
    if (minimized) {
      return `
        <section class="qd-float minimized" style="${posStyle}" data-qd-float data-item-id="${escapeHtml(item.id)}">
          <button class="qd-float-restore" data-qd-action="restore-float" data-item-id="${escapeHtml(item.id)}" type="button" title="展开">
            <span class="material-symbols-outlined">${saved ? "bookmark" : "psychology_alt"}</span>
            <span>${escapeHtml(slots.title || "这道题")}</span>
          </button>
          <button class="qd-float-close" data-qd-action="close-float" data-item-id="${escapeHtml(item.id)}" type="button" title="关闭">
            <span class="material-symbols-outlined">close</span>
          </button>
        </section>
      `;
    }
    return `
      <section class="qd-float ${saved ? "saved" : ""}" style="${posStyle}" data-qd-float data-item-id="${escapeHtml(item.id)}">
        <header class="qd-float-head" data-qd-float-drag data-item-id="${escapeHtml(item.id)}">
          ${slots.thumbHtml || ""}
          <div class="qd-float-head-text">
            <strong>${escapeHtml(slots.title || "这道题")}</strong>
            ${slots.subtitle ? `<span>${escapeHtml(slots.subtitle)}</span>` : ""}
          </div>
          <div class="qd-float-head-actions">
            <button class="qd-float-icon" data-qd-action="minimize-float" data-item-id="${escapeHtml(item.id)}" type="button" title="最小化">
              <span class="material-symbols-outlined">remove</span>
            </button>
            <button class="qd-float-icon" data-qd-action="close-float" data-item-id="${escapeHtml(item.id)}" type="button" title="关闭">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </header>
        <div class="qd-float-body">
          ${slots.savedCardHtml || ""}
          ${slots.recognitionHtml || ""}
          ${slots.chatHtml || ""}
          ${slots.askBoxHtml || ""}
          ${slots.draftHtml || ""}
        </div>
      </section>
    `;
  }

  window.MochiQuestionDeskFloat = {
    renderBubble,
    renderWindow,
    anchorPercent,
  };
})();
