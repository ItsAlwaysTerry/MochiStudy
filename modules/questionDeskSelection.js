(function () {
  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function pointsRect(points) {
    if (!Array.isArray(points) || points.length < 2) return null;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    };
  }

  function expandSelectionRect(rect) {
    if (!rect) return null;
    const minW = 0.12;
    const minH = 0.08;
    const padX = Math.max(0.025, rect.w < minW ? (minW - rect.w) / 2 : 0.018);
    const padY = Math.max(0.025, rect.h < minH ? (minH - rect.h) / 2 : 0.018);
    const x = clamp01(rect.x - padX);
    const y = clamp01(rect.y - padY);
    const right = clamp01(rect.x + rect.w + padX);
    const bottom = clamp01(rect.y + rect.h + padY);
    return { x, y, w: Math.max(0, right - x), h: Math.max(0, bottom - y) };
  }

  function markerPosition(item) {
    const rect = item?.rect || {};
    return {
      x: clamp01((Number(rect.x) || 0) + 0.006),
      y: clamp01((Number(rect.y) || 0) + 0.006),
    };
  }

  function rectStyle(rect) {
    const safe = rect || { x: 0, y: 0, w: 0.1, h: 0.1 };
    return `left:${safe.x * 100}%;top:${safe.y * 100}%;width:${safe.w * 100}%;height:${safe.h * 100}%`;
  }

  function moveRect(rect, start, point) {
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    const w = Math.max(0.02, rect.w);
    const h = Math.max(0.02, rect.h);
    return {
      x: Math.max(0, Math.min(1 - w, rect.x + dx)),
      y: Math.max(0, Math.min(1 - h, rect.y + dy)),
      w,
      h,
    };
  }

  function resizeRect(rect, handle, start, point) {
    const minSize = 0.025;
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    let left = rect.x;
    let top = rect.y;
    let right = rect.x + rect.w;
    let bottom = rect.y + rect.h;
    if (handle.includes("w")) left = clamp01(left + dx);
    if (handle.includes("e")) right = clamp01(right + dx);
    if (handle.includes("n")) top = clamp01(top + dy);
    if (handle.includes("s")) bottom = clamp01(bottom + dy);
    if (right - left < minSize) {
      if (handle.includes("w")) left = Math.max(0, right - minSize);
      else right = Math.min(1, left + minSize);
    }
    if (bottom - top < minSize) {
      if (handle.includes("n")) top = Math.max(0, bottom - minSize);
      else bottom = Math.min(1, top + minSize);
    }
    return { x: left, y: top, w: right - left, h: bottom - top };
  }

  function editRectFromPointer(edit, point) {
    if (!edit) return null;
    if (edit.mode === "move") return moveRect(edit.rect, edit.start, point);
    return resizeRect(edit.rect, edit.mode, edit.start, point);
  }

  function lassoPolyline(points) {
    return (points || []).map((point) => `${clamp01(point.x) * 100},${clamp01(point.y) * 100}`).join(" ");
  }

  window.MochiQuestionDeskSelection = {
    clamp01,
    pointsRect,
    expandSelectionRect,
    markerPosition,
    rectStyle,
    editRectFromPointer,
    lassoPolyline,
  };
})();
