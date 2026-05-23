(function () {
  const SESSION_MATCH_LEEWAY_BEFORE = 5;
  const SESSION_MATCH_LEEWAY_AFTER = 25;

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

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

  function readTodayData() {
    const today = todayKey();
    const meta = window.MochiApp?.readStudyCardMeta?.() || {};
    const cards = (window.MochiApp?.readStudyLogs?.() || [])
      .filter((log) => datePart(log.importedAt || log.date) === today || datePart(log.date) === today)
      .map((log) => normalizeCard(log, meta))
      .sort((a, b) => (a.importMinute ?? 9999) - (b.importMinute ?? 9999) || String(a.importedAt || a.date).localeCompare(String(b.importedAt || b.date)));

    const sessions = (window.MochiApp?.readFocusLogs?.() || [])
      .filter((log) => log.type === "focus" && log.date === today)
      .map(normalizeFocusLog)
      .sort((a, b) => sortTimeValue(a) - sortTimeValue(b));

    const active = currentFocusSession();
    if (active && !sessions.some((session) => session.id === active.id)) sessions.push(active);

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
    return { today, cards, sessions, unmatchedCards };
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

  function renderStats(stats) {
    return `
      <section class="today-hero">
        <article class="today-stat primary">
          <span class="material-symbols-outlined">timer</span>
          <div>
            <small>今日专注</small>
            <strong>${formatMinutes(stats.totalMinutes)}</strong>
          </div>
        </article>
        <article class="today-stat">
          <span class="material-symbols-outlined">schedule</span>
          <div>
            <small>学习时段</small>
            <strong>${escapeHtml(stats.windowLabel)}</strong>
          </div>
        </article>
        <article class="today-stat">
          <span class="material-symbols-outlined">style</span>
          <div>
            <small>导入卡片</small>
            <strong>${stats.cardCount}张</strong>
          </div>
        </article>
        <article class="today-stat">
          <span class="material-symbols-outlined">auto_stories</span>
          <div>
            <small>涉及科目</small>
            <strong>${stats.subjectCount}科</strong>
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

  function renderSession(session) {
    const start = session.startMinute === null ? "未知" : timeFromMinutes(session.startMinute);
    const end = session.active ? "进行中" : (session.endMinute === null ? "未知" : timeFromMinutes(session.endMinute));
    const status = session.active ? "正在学" : session.completed === false ? "未完成" : "已完成";
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
            ${session.microGoal ? `<p>${escapeHtml(session.microGoal)}</p>` : `<p>这段专注没有填写目标。</p>`}
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

  function render(container) {
    if (!container) return;
    const data = readTodayData();
    const stats = buildStats(data);
    container.innerHTML = `
      <div class="today-study-view">
        <div class="today-title-row">
          <div>
            <h2>今日学习</h2>
            <p>${data.today} · 给家长和学生看的当日学习报告</p>
          </div>
          <button class="btn btn-outline btn-sm" data-route="home" type="button">
            <span class="material-symbols-outlined">add_circle</span>继续学习
          </button>
        </div>
        ${renderStats(stats)}
        ${renderSubjectBars(data.cards)}
        ${renderTimeline(data)}
        ${renderCardList(data.cards)}
      </div>
    `;
  }

  window.MochiTodayStudy = { render };
})();
