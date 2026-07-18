(function () {
  const SESSION_MATCH_LEEWAY_BEFORE = 5;
  const SESSION_MATCH_LEEWAY_AFTER = 25;
  const EXPORT_IMAGE_WIDTH = 1080;
  const EXPORT_PADDING = 54;
  const EXPORT_FONT = '"Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", Arial, sans-serif';

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  // 当前正在查看的日期（默认今天，可切换到历史某天）
  let viewDate = todayKey();

  function escapeHtml(value) {
    return window.MochiApp?.escapeHtml?.(value) ?? String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function subjectInfo(subject) {
    return window.MochiKnowledge?.SUBJECTS?.[subject] || { label: "未知", color: "#864d61", icon: "school" };
  }

  function sourceLabel(source) {
    const labels = {
      lesson: "新学导入",
      review: "复习导入",
      quiz: "小测导入",
      reflection: "复盘导入",
    };
    return labels[source] || "学习导入";
  }

  function cardId(log) {
    return log?.id || `${log?.date || ""}_${log?.subject || ""}_${log?.nodeLabel || ""}_${log?.painPoint || ""}`;
  }

  function datePart(value) {
    return String(value || "").slice(0, 10);
  }

  function minutesFromTime(time) {
    const match = String(time || "").match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function minutesFromIso(value) {
    const date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return null;
    return date.getHours() * 60 + date.getMinutes();
  }

  function timeFromMinutes(total) {
    if (!Number.isFinite(total)) return "";
    const safe = ((Math.round(total) % 1440) + 1440) % 1440;
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  function formatMinutes(mins) {
    const safe = Math.max(0, Math.round(Number(mins || 0)));
    const hours = Math.floor(safe / 60);
    const rest = safe % 60;
    if (!hours) return `${rest}分钟`;
    if (!rest) return `${hours}小时`;
    return `${hours}小时${rest}分钟`;
  }

  function sortTimeValue(item) {
    return item.startMinute ?? item.importMinute ?? 24 * 60 + 1;
  }

  function normalizeFocusLog(log, index) {
    const startMinute = minutesFromTime(log.startTime) ?? minutesFromIso(log.startedAt);
    const duration = Math.max(0, Math.round(Number(log.duration || 0)));
    const endMinute = minutesFromTime(log.endTime) ?? minutesFromIso(log.endedAt) ?? (startMinute === null ? null : startMinute + duration);
    return {
      ...log,
      id: log.id || `focus_${log.date || todayKey()}_${index}`,
      startMinute,
      endMinute,
      duration,
      cards: [],
      active: false,
    };
  }

  function currentFocusSession() {
    const state = window.MochiTimer?.getState?.();
    if (!state || !["focusing", "deciding"].includes(state.phase) || !state.sessionId) return null;
    const startMinute = minutesFromTime(state.sessionStart);
    const elapsedSecs = Number(state.elapsedSecs || 0);
    const pendingSecs = Number(state.pendingActualMins || 0) * 60;
    const duration = Math.max(0, Math.round((elapsedSecs || pendingSecs || 0) / 60));
    return {
      id: state.sessionId,
      date: todayKey(),
      startTime: state.sessionStart,
      startMinute,
      endMinute: startMinute === null ? null : startMinute + duration,
      duration,
      type: "focus",
      completed: state.phase === "deciding",
      active: state.phase === "focusing",
      microGoal: state.microGoal || "",
      cards: [],
    };
  }

  function normalizeCard(log, meta) {
    const importedAt = log.importedAt || "";
    const importMinute = minutesFromIso(importedAt);
    return {
      ...log,
      id: cardId(log),
      meta: meta?.[cardId(log)] || {},
      importMinute,
      displayTime: importMinute === null ? "" : timeFromMinutes(importMinute),
    };
  }

  // 把"说到做到"的完成情况按 日期+目标 接到对应专注轮上（不改 focus_log 结构）
  function attachCommitments(sessions, date) {
    const history = (window.MochiApp?.readCommitmentHistory?.() || []).filter((c) => c.date === date);
    if (!history.length) return;
    const used = new Set();
    sessions.forEach((session) => {
      const goal = String(session.microGoal || "").trim();
      if (!goal) return;
      const idx = history.findIndex((c, i) => !used.has(i) && String(c.goal || "").trim() === goal);
      if (idx === -1) return;
      used.add(idx);
      session.commitment = history[idx];
    });
  }

  function readDayData(date) {
    const meta = window.MochiApp?.readStudyCardMeta?.() || {};
    const cards = (window.MochiApp?.readStudyLogs?.() || [])
      .filter((log) => datePart(log.importedAt || log.date) === date || datePart(log.date) === date)
      .map((log) => normalizeCard(log, meta))
      .sort((a, b) => (a.importMinute ?? 9999) - (b.importMinute ?? 9999) || String(a.importedAt || a.date).localeCompare(String(b.importedAt || b.date)));

    const sessions = (window.MochiApp?.readFocusLogs?.() || [])
      .filter((log) => log.type === "focus" && log.date === date)
      .map(normalizeFocusLog)
      .sort((a, b) => sortTimeValue(a) - sortTimeValue(b));

    if (date === todayKey()) {
      const active = currentFocusSession();
      if (active && !sessions.some((session) => session.id === active.id)) sessions.push(active);
    }

    const sessionById = new Map(sessions.map((session) => [session.id, session]));
    const unmatchedCards = [];
    cards.forEach((card) => {
      const direct = card.sessionId ? sessionById.get(card.sessionId) : null;
      const inferred = direct || sessions.find((session) => {
        if (card.importMinute === null || session.startMinute === null || session.endMinute === null) return false;
        return card.importMinute >= session.startMinute - SESSION_MATCH_LEEWAY_BEFORE && card.importMinute <= session.endMinute + SESSION_MATCH_LEEWAY_AFTER;
      });
      if (inferred) inferred.cards.push(card);
      else unmatchedCards.push(card);
    });

    sessions.sort((a, b) => sortTimeValue(a) - sortTimeValue(b));
    attachCommitments(sessions, date);
    return { today: date, cards, sessions, unmatchedCards };
  }

  function readTodayData() {
    return readDayData(viewDate);
  }

  // 所有有过学习痕迹的日期（学习卡片 / 专注 / 承诺），降序，供家长翻阅
  function allStudyDates() {
    const dates = new Set();
    (window.MochiApp?.readStudyLogs?.() || []).forEach((log) => {
      const d = datePart(log.date || log.importedAt);
      if (d) dates.add(d);
    });
    (window.MochiApp?.readFocusLogs?.() || []).forEach((log) => {
      if (log.type === "focus" && log.date) dates.add(datePart(log.date));
    });
    (window.MochiApp?.readCommitmentHistory?.() || []).forEach((c) => {
      if (c.date) dates.add(datePart(c.date));
    });
    dates.add(todayKey());
    return [...dates].filter(Boolean).sort((a, b) => b.localeCompare(a));
  }

  function buildStats(data) {
    const completedSessions = data.sessions.filter((session) => session.completed !== false || session.active);
    const totalMinutes = completedSessions.reduce((sum, session) => sum + Number(session.duration || 0), 0);
    const sessionPoints = data.sessions.flatMap((session) => [session.startMinute, session.endMinute]).filter(Number.isFinite);
    const importPoints = data.cards.map((card) => card.importMinute).filter(Number.isFinite);
    const timePoints = (sessionPoints.length ? sessionPoints : importPoints).sort((a, b) => a - b);
    const subjects = new Set(data.cards.map((card) => card.subject).filter(Boolean));
    return {
      totalMinutes,
      sessions: data.sessions.filter((session) => session.completed).length,
      cardCount: data.cards.length,
      subjectCount: subjects.size,
      windowLabel: timePoints.length ? `${timeFromMinutes(timePoints[0])}-${timeFromMinutes(timePoints[timePoints.length - 1])}` : "今天还没开始",
    };
  }

  function groupBySubject(cards) {
    return cards.reduce((groups, card) => {
      const key = card.subject || "unknown";
      groups[key] = groups[key] || [];
      groups[key].push(card);
      return groups;
    }, {});
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function fillRoundRect(ctx, x, y, width, height, radius, fill) {
    roundRect(ctx, x, y, width, height, radius);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function strokeRoundRect(ctx, x, y, width, height, radius, stroke) {
    roundRect(ctx, x, y, width, height, radius);
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  function setFont(ctx, size, weight = 600) {
    ctx.font = `${weight} ${size}px ${EXPORT_FONT}`;
  }

  function wrapCanvasText(ctx, text, maxWidth, maxLines = Infinity) {
    const source = String(text || "").replace(/\s+/g, " ").trim();
    if (!source) return [];
    const chars = [...source];
    const lines = [];
    let line = "";
    chars.forEach((char) => {
      const next = `${line}${char}`;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = char;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    if (lines.length <= maxLines) return lines;
    const clipped = lines.slice(0, maxLines);
    const last = clipped[clipped.length - 1] || "";
    clipped[clipped.length - 1] = `${last.slice(0, Math.max(1, last.length - 1))}…`;
    return clipped;
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, options = {}) {
    setFont(ctx, options.size || 28, options.weight || 500);
    ctx.fillStyle = options.color || "#3f3438";
    const lines = wrapCanvasText(ctx, text, maxWidth, options.maxLines || Infinity);
    lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
    return lines.length * lineHeight;
  }

  function estimateCardBlockHeight(ctx, card, width) {
    let height = 118;
    setFont(ctx, 25, 500);
    if (card.painPoint) height += wrapCanvasText(ctx, `卡点：${card.painPoint}`, width - 54, 3).length * 32 + 14;
    if (card.originalQuestion) height += wrapCanvasText(ctx, `原题：${card.originalQuestion}`, width - 54, 3).length * 32 + 14;
    return Math.max(156, height);
  }

  // 学生这一轮反思在长图里占的额外高度（含标题行 + 换行正文）
  function sessionNoteHeight(ctx, session, inner) {
    const note = session?.commitment?.note;
    if (!note) return 0;
    setFont(ctx, 23, 500);
    const lines = wrapCanvasText(ctx, note, inner - 152, 5);
    return 36 + lines.length * 32 + 16; // 「我的记录」标题 + 正文行 + 间距
  }

  function estimateExportHeight(ctx, data, stats) {
    const inner = EXPORT_IMAGE_WIDTH - EXPORT_PADDING * 2;
    let height = EXPORT_PADDING + 152 + 126 + 34;
    const subjectEntries = Object.entries(groupBySubject(data.cards));
    if (subjectEntries.length) height += 90 + subjectEntries.length * 46 + 32;
    if (data.sessions.length || data.unmatchedCards.length) {
      height += 90;
      data.sessions.forEach((session) => {
        height += 108 + sessionNoteHeight(ctx, session, inner) + session.cards.length * 38 + 18;
      });
      if (data.unmatchedCards.length) height += 110 + data.unmatchedCards.length * 38 + 18;
    } else {
      height += 200;
    }
    if (data.cards.length) {
      height += 90;
      data.cards.forEach((card) => {
        height += estimateCardBlockHeight(ctx, card, inner) + 18;
      });
    }
    height += 70;
    return Math.max(1200, Math.ceil(height));
  }

  function drawExportHeader(ctx, data, stats, inner) {
    let y = EXPORT_PADDING;
    setFont(ctx, 48, 900);
    ctx.fillStyle = "#2b2326";
    ctx.fillText("今日学习报告", EXPORT_PADDING, y);
    setFont(ctx, 25, 700);
    ctx.fillStyle = "#75666c";
    ctx.fillText(`${data.today} · MochiStudy`, EXPORT_PADDING, y + 58);
    fillRoundRect(ctx, EXPORT_IMAGE_WIDTH - EXPORT_PADDING - 210, y - 8, 210, 56, 28, "#eaf6ec");
    setFont(ctx, 24, 800);
    ctx.fillStyle = "#2f6a3f";
    ctx.textAlign = "center";
    ctx.fillText(stats.cardCount ? "已开始学习" : "尚未开始", EXPORT_IMAGE_WIDTH - EXPORT_PADDING - 105, y + 8);
    ctx.textAlign = "left";
    y += 118;

    const statWidth = (inner - 30) / 4;
    const items = [
      ["今日专注", formatMinutes(stats.totalMinutes), "#2f6a3f"],
      ["学习时段", stats.windowLabel, "#864d61"],
      ["导入卡片", `${stats.cardCount}张`, "#4f6fd8"],
      ["涉及科目", `${stats.subjectCount}科`, "#e07020"],
    ];
    items.forEach((item, index) => {
      const x = EXPORT_PADDING + index * (statWidth + 10);
      fillRoundRect(ctx, x, y, statWidth, 104, 22, index === 0 ? "#eef8ef" : "#ffffff");
      strokeRoundRect(ctx, x, y, statWidth, 104, 22, "rgba(134,77,97,0.12)");
      setFont(ctx, 22, 800);
      ctx.fillStyle = "#8a7b80";
      ctx.fillText(item[0], x + 24, y + 20);
      setFont(ctx, item[1].length > 9 ? 27 : 32, 900);
      ctx.fillStyle = item[2];
      ctx.fillText(item[1], x + 24, y + 54);
    });
    return y + 138;
  }

  function drawExportSectionTitle(ctx, icon, title, y) {
    fillRoundRect(ctx, EXPORT_PADDING, y, 44, 44, 12, "#f3ecf0");
    setFont(ctx, 25, 900);
    ctx.fillStyle = "#864d61";
    ctx.fillText(icon, EXPORT_PADDING + 12, y + 9);
    setFont(ctx, 31, 900);
    ctx.fillStyle = "#2b2326";
    ctx.fillText(title, EXPORT_PADDING + 60, y + 5);
    return y + 64;
  }

  function drawExportSubjects(ctx, data, y, inner) {
    const entries = Object.entries(groupBySubject(data.cards));
    if (!entries.length) return y;
    y = drawExportSectionTitle(ctx, "●", "今天学了哪些科目", y);
    const max = Math.max(...entries.map(([, items]) => items.length), 1);
    entries.forEach(([subject, items]) => {
      const info = subjectInfo(subject);
      const barX = EXPORT_PADDING + 140;
      const barW = inner - 230;
      setFont(ctx, 25, 800);
      ctx.fillStyle = "#3f3438";
      ctx.fillText(info.label, EXPORT_PADDING, y + 4);
      fillRoundRect(ctx, barX, y + 8, barW, 18, 9, "#f0e9ed");
      fillRoundRect(ctx, barX, y + 8, Math.max(28, Math.round((items.length / max) * barW)), 18, 9, info.color || "#864d61");
      setFont(ctx, 24, 900);
      ctx.fillStyle = "#2b2326";
      ctx.textAlign = "right";
      ctx.fillText(`${items.length}张`, EXPORT_IMAGE_WIDTH - EXPORT_PADDING, y + 1);
      ctx.textAlign = "left";
      y += 46;
    });
    return y + 30;
  }

  function drawExportCardLine(ctx, card, x, y, width) {
    const info = subjectInfo(card.subject);
    fillRoundRect(ctx, x, y, width, 30, 15, "#f9f5f7");
    fillRoundRect(ctx, x, y, 82, 30, 15, info.color || "#864d61");
    setFont(ctx, 18, 900);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(info.label, x + 16, y + 5);
    setFont(ctx, 22, 800);
    ctx.fillStyle = "#2b2326";
    const text = `${card.nodeLabel || "未命名知识点"} · ${"★".repeat(Number(card.stars || 1))}`;
    drawWrappedText(ctx, text, x + 98, y + 3, width - 110, 26, { size: 22, weight: 800, maxLines: 1, color: "#2b2326" });
  }

  function drawExportTimeline(ctx, data, y, inner) {
    y = drawExportSectionTitle(ctx, "│", "学习时间轴", y);
    if (!data.sessions.length && !data.unmatchedCards.length) {
      fillRoundRect(ctx, EXPORT_PADDING, y, inner, 132, 24, "#ffffff");
      strokeRoundRect(ctx, EXPORT_PADDING, y, inner, 132, 24, "rgba(134,77,97,0.12)");
      drawWrappedText(ctx, "今天还没有学习记录。开始一次专注，或导入一张学习卡片后，这里会自动生成报告。", EXPORT_PADDING + 28, y + 34, inner - 56, 34, { size: 26, weight: 700, color: "#75666c" });
      return y + 162;
    }
    const drawSession = (session, cards, title, subtitle, tone = "#864d61") => {
      const noteH = sessionNoteHeight(ctx, session, inner);
      const h = 102 + noteH + cards.length * 38;
      fillRoundRect(ctx, EXPORT_PADDING, y, inner, h, 24, "#ffffff");
      strokeRoundRect(ctx, EXPORT_PADDING, y, inner, h, 24, "rgba(134,77,97,0.12)");
      fillRoundRect(ctx, EXPORT_PADDING + 24, y + 26, 14, 54, 7, tone);
      setFont(ctx, 29, 900);
      ctx.fillStyle = "#2b2326";
      ctx.fillText(title, EXPORT_PADDING + 56, y + 24);
      setFont(ctx, 23, 700);
      ctx.fillStyle = "#75666c";
      ctx.fillText(subtitle, EXPORT_PADDING + 56, y + 62);
      let cursorY = y + 92;
      // 学生这一轮的反思原话（带浅色底框，区别于系统文字）
      const note = session?.commitment?.note;
      if (note && noteH) {
        const noteX = EXPORT_PADDING + 56;
        const noteW = inner - 112;
        const lines = (setFont(ctx, 23, 500), wrapCanvasText(ctx, note, noteW - 40, 5));
        fillRoundRect(ctx, noteX, cursorY - 6, noteW, noteH - 6, 14, "#f6f1f4");
        fillRoundRect(ctx, noteX, cursorY - 6, 6, noteH - 6, 3, "#864d61");
        setFont(ctx, 19, 800);
        ctx.fillStyle = "#864d61";
        ctx.fillText("我的记录", noteX + 20, cursorY + 4);
        setFont(ctx, 23, 500);
        ctx.fillStyle = "#3f3438";
        lines.forEach((line, i) => ctx.fillText(line, noteX + 20, cursorY + 36 + i * 32));
        cursorY += noteH;
      }
      cards.forEach((card) => {
        drawExportCardLine(ctx, card, EXPORT_PADDING + 56, cursorY, inner - 86);
        cursorY += 38;
      });
      y += h + 18;
    };
    data.sessions.forEach((session) => {
      const start = session.startMinute === null ? "未知" : timeFromMinutes(session.startMinute);
      const end = session.active ? "进行中" : (session.endMinute === null ? "未知" : timeFromMinutes(session.endMinute));
      const status = session.active ? "正在学" : session.completed === false ? "未完成" : "已完成";
      const goalText = session.microGoal ? ` · 目标：${session.microGoal}` : "";
      const subtitle = `${formatMinutes(session.duration)} · ${status}${goalText}`;
      drawSession(session, session.cards, `${start}-${end}`, subtitle, session.completed === false ? "#e07020" : "#4caf50");
    });
    if (data.unmatchedCards.length) {
      drawSession(null, data.unmatchedCards, "未匹配时段", `${data.unmatchedCards.length}张卡片今天导入，但没有落在专注轮附近`, "#e07020");
    }
    return y + 14;
  }

  function drawExportDetails(ctx, data, y, inner) {
    if (!data.cards.length) return y;
    y = drawExportSectionTitle(ctx, "□", "今日卡片明细", y);
    data.cards.forEach((card) => {
      const info = subjectInfo(card.subject);
      const h = estimateCardBlockHeight(ctx, card, inner);
      fillRoundRect(ctx, EXPORT_PADDING, y, inner, h, 24, "#ffffff");
      strokeRoundRect(ctx, EXPORT_PADDING, y, inner, h, 24, "rgba(134,77,97,0.12)");
      fillRoundRect(ctx, EXPORT_PADDING + 24, y + 24, 86, 36, 18, info.color || "#864d61");
      setFont(ctx, 20, 900);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(info.label, EXPORT_PADDING + 44, y + 31);
      setFont(ctx, 29, 900);
      ctx.fillStyle = "#2b2326";
      drawWrappedText(ctx, card.nodeLabel || "未命名知识点", EXPORT_PADDING + 126, y + 25, inner - 156, 34, { size: 29, weight: 900, maxLines: 1, color: "#2b2326" });
      setFont(ctx, 22, 800);
      ctx.fillStyle = "#75666c";
      const meta = [card.displayTime || "未记录导入时间", sourceLabel(card.meta?.source), "★".repeat(Number(card.stars || 1))];
      if (card.meta?.timeSpentMinutes) meta.push(`耗时${card.meta.timeSpentMinutes}分钟`);
      ctx.fillText(meta.join(" · "), EXPORT_PADDING + 24, y + 78);
      let textY = y + 116;
      if (card.painPoint) {
        textY += drawWrappedText(ctx, `卡点：${card.painPoint}`, EXPORT_PADDING + 24, textY, inner - 48, 32, { size: 25, weight: 600, maxLines: 3, color: "#3f3438" }) + 8;
      }
      if (card.originalQuestion) {
        drawWrappedText(ctx, `原题：${card.originalQuestion}`, EXPORT_PADDING + 24, textY, inner - 48, 32, { size: 25, weight: 500, maxLines: 3, color: "#75666c" });
      }
      y += h + 18;
    });
    return y;
  }

  function buildTodayShareCanvas(data, stats) {
    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");
    if (!measureCtx) throw new Error("Canvas is not supported");
    const height = estimateExportHeight(measureCtx, data, stats);
    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_IMAGE_WIDTH;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported");
    const inner = EXPORT_IMAGE_WIDTH - EXPORT_PADDING * 2;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#fffaf4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    fillRoundRect(ctx, 26, 26, canvas.width - 52, canvas.height - 52, 34, "#fffdf9");
    let y = drawExportHeader(ctx, data, stats, inner);
    y = drawExportSubjects(ctx, data, y, inner);
    y = drawExportTimeline(ctx, data, y, inner);
    y = drawExportDetails(ctx, data, y, inner);
    setFont(ctx, 22, 700);
    ctx.fillStyle = "#a08f95";
    ctx.textAlign = "center";
    ctx.fillText("由 MochiStudy 自动生成", EXPORT_IMAGE_WIDTH / 2, Math.min(canvas.height - 76, y + 24));
    ctx.textAlign = "left";
    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve) => {
      if (!canvas.toBlob) {
        const dataUrl = canvas.toDataURL("image/png");
        const binary = atob(dataUrl.split(",")[1] || "");
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        resolve(new Blob([bytes], { type: "image/png" }));
        return;
      }
      canvas.toBlob((blob) => resolve(blob), "image/png", 0.96);
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyBlobToClipboard(blob) {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      return false;
    }
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    return true;
  }

  async function exportTodayImage(button) {
    if (button) {
      button.disabled = true;
      button.classList.add("loading");
    }
    try {
      const data = readTodayData();
      const stats = buildStats(data);
      const canvas = buildTodayShareCanvas(data, stats);
      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error("Canvas export failed");
      const filename = `MochiStudy-${data.today}-今日学习报告.png`;
      const copied = await copyBlobToClipboard(blob);
      if (copied) {
        window.MochiApp?.toast?.("今日学习长图已复制，打开微信直接粘贴");
        return;
      }
      downloadBlob(blob, filename);
      window.MochiApp?.toast?.("当前浏览器不支持复制图片，已改为下载长图");
    } catch (err) {
      console.error(err);
      window.MochiApp?.toast?.("导出失败，请稍后再试");
    } finally {
      if (button) {
        button.disabled = false;
        button.classList.remove("loading");
      }
    }
  }

  function renderStats(stats) {
    return `
      <section class="today-hero">
        <article class="today-stat primary">
          <span class="material-symbols-outlined">timer</span>
          <div>
            <small>今日专注</small>
            <strong class="today-stat-num">${formatMinutes(stats.totalMinutes)}</strong>
          </div>
        </article>
        <article class="today-stat">
          <span class="material-symbols-outlined">schedule</span>
          <div>
            <small>学习时段</small>
            <strong class="today-stat-text">${escapeHtml(stats.windowLabel)}</strong>
          </div>
        </article>
        <article class="today-stat">
          <span class="material-symbols-outlined">style</span>
          <div>
            <small>导入卡片</small>
            <strong class="today-stat-num">${stats.cardCount}张</strong>
          </div>
        </article>
        <article class="today-stat">
          <span class="material-symbols-outlined">auto_stories</span>
          <div>
            <small>涉及科目</small>
            <strong class="today-stat-num">${stats.subjectCount}科</strong>
          </div>
        </article>
      </section>
    `;
  }

  function renderSubjectBars(cards) {
    const groups = groupBySubject(cards);
    const entries = Object.entries(groups);
    if (!entries.length) return "";
    const max = Math.max(...entries.map(([, items]) => items.length), 1);
    return `
      <section class="today-panel today-subject-panel">
        <div class="today-section-head">
          <span class="material-symbols-outlined">donut_large</span>
          <h3>今天学了哪些科目</h3>
        </div>
        <div class="today-subject-bars">
          ${entries.map(([subject, items]) => {
            const info = subjectInfo(subject);
            const pct = Math.max(8, Math.round((items.length / max) * 100));
            return `
              <div class="today-subject-row" style="--subject-color:${escapeHtml(info.color)};--value:${pct}%">
                <span>${escapeHtml(info.label)}</span>
                <div><i></i></div>
                <strong>${items.length}张</strong>
              </div>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function commitmentBadge(commitment) {
    if (!commitment) return "";
    const planned = commitment.plannedMins ? `计划${commitment.plannedMins}分` : "自由";
    const actual = commitment.actualMins ? `实际${commitment.actualMins}分` : "";
    return `<span class="today-commit-plan">${planned}${actual ? ` · ${actual}` : ""}</span>`;
  }

  function renderSession(session) {
    const start = session.startMinute === null ? "未知" : timeFromMinutes(session.startMinute);
    const end = session.active ? "进行中" : (session.endMinute === null ? "未知" : timeFromMinutes(session.endMinute));
    const status = session.active ? "正在学" : session.completed === false ? "未完成" : "已完成";
    const goalText = session.microGoal
      ? `<p class="today-session-goal"><b>这一轮目标：</b>${escapeHtml(session.microGoal)}</p>`
      : `<p class="today-session-nogoal">这段专注没有先定目标。</p>`;
    return `
      <article class="today-session ${session.active ? "active" : ""} ${session.completed === false ? "unfinished" : ""}">
        <div class="today-session-line">
          <span class="today-session-dot"></span>
          <div class="today-session-main">
            <div class="today-session-title">
              <strong>${start}-${end}</strong>
              <span>${formatMinutes(session.duration)}</span>
              <em>${status}</em>
            </div>
            ${goalText}
            ${session.commitment ? `<div class="today-commit-row">${commitmentBadge(session.commitment)}</div>` : ""}
            ${session.commitment?.note ? `<p class="today-commit-note">“${escapeHtml(session.commitment.note)}”</p>` : ""}
          </div>
        </div>
        ${session.cards.length ? `<div class="today-session-cards">${session.cards.map(renderMiniCard).join("")}</div>` : `<p class="today-session-empty">这段时间还没有匹配到导入卡片。</p>`}
      </article>
    `;
  }

  function renderMiniCard(card) {
    const info = subjectInfo(card.subject);
    return `
      <div class="today-mini-card" style="--subject-color:${escapeHtml(info.color)}">
        <span>${escapeHtml(info.label)}</span>
        <strong>${escapeHtml(card.nodeLabel || "未命名知识点")}</strong>
        <small>${"★".repeat(Number(card.stars || 1))}${"☆".repeat(Math.max(0, 3 - Number(card.stars || 1)))}</small>
      </div>
    `;
  }

  function renderTimeline(data) {
    const hasTimeline = data.sessions.length || data.unmatchedCards.length;
    if (!hasTimeline) {
      return `
        <section class="today-panel today-empty">
          <span class="material-symbols-outlined">wb_sunny</span>
          <h3>今天还没有学习记录</h3>
          <p>开始一次专注，或导入一张学习卡片后，这里会自动生成今日学习报告。</p>
          <button class="btn btn-primary btn-sm" data-route="home" type="button"><span class="material-symbols-outlined">home</span>去首页开始</button>
        </section>
      `;
    }
    return `
      <section class="today-panel">
        <div class="today-section-head">
          <span class="material-symbols-outlined">timeline</span>
          <h3>学习时间轴</h3>
        </div>
        <div class="today-timeline">
          ${data.sessions.map(renderSession).join("")}
          ${data.unmatchedCards.length ? `
            <article class="today-session unmatched">
              <div class="today-session-line">
                <span class="today-session-dot"></span>
                <div class="today-session-main">
                  <div class="today-session-title">
                    <strong>未匹配时段</strong>
                    <span>${data.unmatchedCards.length}张卡片</span>
                  </div>
                  <p>这些卡片今天导入了，但没有落在任何专注轮附近。</p>
                </div>
              </div>
              <div class="today-session-cards">${data.unmatchedCards.map(renderMiniCard).join("")}</div>
            </article>
          ` : ""}
        </div>
      </section>
    `;
  }

  function renderCardDetail(card) {
    const info = subjectInfo(card.subject);
    const timeLabel = card.displayTime || "未记录导入时间";
    const source = sourceLabel(card.meta?.source);
    return `
      <article class="today-card-detail" style="--subject-color:${escapeHtml(info.color)}">
        <header>
          <span class="chip ${escapeHtml(card.subject || "")}">${escapeHtml(info.label)}</span>
          <strong>${escapeHtml(card.nodeLabel || "未命名知识点")}</strong>
          <small>${timeLabel} · ${source}</small>
        </header>
        <div class="today-card-meta">
          <span>${"★".repeat(Number(card.stars || 1))}${"☆".repeat(Math.max(0, 3 - Number(card.stars || 1)))}</span>
          ${card.meta?.timeSpentMinutes ? `<span>卡片耗时 ${card.meta.timeSpentMinutes}分钟</span>` : ""}
          ${card.meta?.confidence ? `<span>信心 ${card.meta.confidence}/5</span>` : ""}
        </div>
        ${card.painPoint ? `<p><b>卡点</b>${escapeHtml(card.painPoint)}</p>` : ""}
        ${card.originalQuestion ? `<p><b>原题</b>${escapeHtml(card.originalQuestion)}</p>` : ""}
      </article>
    `;
  }

  function renderCardList(cards) {
    if (!cards.length) return "";
    return `
      <section class="today-panel">
        <div class="today-section-head">
          <span class="material-symbols-outlined">view_agenda</span>
          <h3>今日卡片明细</h3>
        </div>
        <div class="today-card-list">
          ${cards.map(renderCardDetail).join("")}
        </div>
      </section>
    `;
  }

  function weekdayLabel(dateStr) {
    const names = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const d = new Date(`${dateStr}T12:00:00`);
    return Number.isNaN(d.getTime()) ? "" : names[d.getDay()];
  }

  function renderDateSwitcher() {
    const dates = allStudyDates();
    const isToday = viewDate === todayKey();
    const idx = dates.indexOf(viewDate);
    // 列表降序：上一天（更早）= idx+1，下一天（更近）= idx-1
    const olderDate = idx >= 0 && idx < dates.length - 1 ? dates[idx + 1] : "";
    const newerDate = idx > 0 ? dates[idx - 1] : "";
    const options = dates.map((d) => `<option value="${d}"${d === viewDate ? " selected" : ""}>${d} ${weekdayLabel(d)}${d === todayKey() ? "（今天）" : ""}</option>`).join("");
    return `
      <div class="today-date-switcher">
        <button class="btn btn-ghost btn-sm today-date-nav" data-day-prev ${olderDate ? "" : "disabled"} type="button" aria-label="更早一天"><span class="material-symbols-outlined">chevron_left</span></button>
        <div class="field today-date-field"><select class="today-date-select" data-day-select aria-label="选择日期">${options}</select></div>
        <button class="btn btn-ghost btn-sm today-date-nav" data-day-next ${newerDate ? "" : "disabled"} type="button" aria-label="更近一天"><span class="material-symbols-outlined">chevron_right</span></button>
        ${isToday ? "" : `<button class="btn btn-ghost btn-sm" data-day-today type="button">回到今天</button>`}
      </div>
    `;
  }

  function render(container, dateOverride) {
    if (!container) return;
    if (dateOverride) viewDate = dateOverride;
    const data = readDayData(viewDate);
    const stats = buildStats(data);
    const isToday = viewDate === todayKey();
    container.innerHTML = `
      <div class="today-study-view">
        <div class="today-title-row">
          <div>
            <h2>${isToday ? "今日学习" : "学习记录"}</h2>
            <p>${data.today} ${weekdayLabel(data.today)} · 给家长和学生翻阅的学习报告</p>
          </div>
          <div class="today-title-actions">
            <button class="btn btn-primary btn-sm" data-today-export-image type="button">
              <span class="material-symbols-outlined">content_paste</span>复制长图
            </button>
            <button class="btn btn-outline btn-sm" data-route="home" type="button">
              <span class="material-symbols-outlined">add_circle</span>继续学习
            </button>
          </div>
        </div>
        ${renderDateSwitcher()}
        ${renderStats(stats)}
        ${renderSubjectBars(data.cards)}
        ${renderTimeline(data)}
        ${renderCardList(data.cards)}
      </div>
    `;
    container.querySelector("[data-today-export-image]")?.addEventListener("click", (event) => {
      exportTodayImage(event.currentTarget);
    });
    const rerender = () => render(container);
    container.querySelector("[data-day-select]")?.addEventListener("change", (e) => {
      viewDate = e.target.value;
      rerender();
    });
    container.querySelector("[data-day-prev]")?.addEventListener("click", () => {
      const dates = allStudyDates();
      const idx = dates.indexOf(viewDate);
      if (idx >= 0 && idx < dates.length - 1) { viewDate = dates[idx + 1]; rerender(); }
    });
    container.querySelector("[data-day-next]")?.addEventListener("click", () => {
      const dates = allStudyDates();
      const idx = dates.indexOf(viewDate);
      if (idx > 0) { viewDate = dates[idx - 1]; rerender(); }
    });
    container.querySelector("[data-day-today]")?.addEventListener("click", () => {
      viewDate = todayKey();
      rerender();
    });
  }

  window.MochiTodayStudy = { render };
})();
