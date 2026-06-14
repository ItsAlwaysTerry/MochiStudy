(function () {
  const STATE = { month: new Date() };
  const DEFAULT_CALENDAR_CONFIG = { heatLevel1: 1, heatLevel2: 2, heatLevel3: 4 };

  function calendarConfig() {
    return window.MochiApp?.GAME_CONFIG?.calendar || DEFAULT_CALENDAR_CONFIG;
  }

  function renderSchedule(container) {
    const logs = window.MochiApp.readStudyLogs();
    const todayLogs = logs.filter((log) => isSameDate(new Date(log.date), new Date()));
    const totals = stats(logs);
    const subjects = window.MochiKnowledge.SUBJECTS;
    container.innerHTML = `
      <div class="page-head">
        <div>
          <h2>学习日历</h2>
          <p>数学、物理、化学合在同一张日历里，看一天的整体学习节奏。</p>
        </div>
        <span class="pill">${totals.todayQuestions > 0 ? `今日 ${totals.todayQuestions} 题` : "今天还没有记录"}</span>
      </div>
      <div class="grid schedule-grid">
        <div class="grid">
          <section class="card calendar-card">
            <div class="calendar-head">
              <div class="month-switch">
                <button class="icon-btn" data-month="-1" aria-label="上个月"><span class="material-symbols-outlined">chevron_left</span></button>
                <h3>${STATE.month.getFullYear()}年${STATE.month.getMonth() + 1}月</h3>
                <button class="icon-btn" data-month="1" aria-label="下个月"><span class="material-symbols-outlined">chevron_right</span></button>
              </div>
              <div class="calendar-legend">
                ${Object.entries(subjects).map(([key, item]) => `<span class="chip ${key}"><i style="background:${item.color}"></i>${item.label}</span>`).join("")}
              </div>
            </div>
            <div class="weekday-row">${["一", "二", "三", "四", "五", "六", "日"].map((d) => `<span>${d}</span>`).join("")}</div>
            <div class="calendar-grid">${renderDays(logs)}</div>
          </section>
          <section class="card" style="background:linear-gradient(135deg,rgba(155,218,165,.32),rgba(255,255,255,.92))">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px">
              <h3>今日专注</h3>
              <span class="pill"><span class="material-symbols-outlined">upload_file</span>从首页上传</span>
            </div>
            <div class="focus-list">
              ${todayLogs.length ? todayLogs.map(renderFocus).join("") : `<p class="muted">今天还没有记录。去首页导入一条学习记录吧。</p>`}
            </div>
          </section>
        </div>
        <aside class="stats-stack">
          <section class="card stat-hero">
            <span class="material-symbols-outlined" style="font-size:34px">schedule</span>
            <p>完成题目</p>
            <strong class="stat-number">${totals.todayQuestions}</strong>
            <p>比昨天${totals.delta >= 0 ? "增加" : "减少"} ${Math.abs(totals.delta)} 题</p>
          </section>
          ${renderFocusStats()}
          ${renderWeeklyAchievements()}
          ${moodCard()}
        </aside>
      </div>
    `;
  }

  function renderDays(logs) {
    const y = STATE.month.getFullYear();
    const m = STATE.month.getMonth();
    const first = new Date(y, m, 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(y, m, 1 - offset);
    const cells = [];
    for (let i = 0; i < 42; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const inMonth = date.getMonth() === m;
      const dayLogs = logs.filter((log) => isSameDate(new Date(log.date), date));
      const count = dayLogs.reduce((sum, log) => sum + Number(log.questionsCompleted || 0), 0);
      const cfg = calendarConfig();
      const level = count >= Number(cfg.heatLevel3 || DEFAULT_CALENDAR_CONFIG.heatLevel3) ? 3 : count >= Number(cfg.heatLevel2 || DEFAULT_CALENDAR_CONFIG.heatLevel2) ? 2 : count >= Number(cfg.heatLevel1 || DEFAULT_CALENDAR_CONFIG.heatLevel1) ? 1 : 0;
      const activeSubjects = [...new Set(dayLogs.map((log) => log.subject))];
      const dots = activeSubjects.map((subject) => {
        const info = window.MochiKnowledge.SUBJECTS[subject];
        return info ? `<i title="${info.label}" style="background:${info.color}"></i>` : "";
      }).join("");
      cells.push(`
        <button class="day-cell level-${level} ${inMonth ? "" : "muted-day"} ${count ? "has-data" : ""}" ${count ? `data-date="${toDateKey(date)}"` : "disabled"}>
          <span class="day-number">${date.getDate()}</span>
          ${count ? `<strong>${count}题</strong><span class="day-subjects">${dots}</span>` : `<span class="day-empty"></span>`}
        </button>
      `);
    }
    return cells.join("");
  }

  function renderFocus(log) {
    const subject = window.MochiKnowledge.SUBJECTS[log.subject];
    return `
      <div class="focus-item">
        <span class="task-check" style="background:${subject.containerColor};color:${subject.color}"><span class="material-symbols-outlined">${subject.icon}</span></span>
        <div><strong>${log.nodeLabel}</strong><p class="muted">${log.questionsCompleted} 题 · ${"★".repeat(log.stars || 1)}</p></div>
        <span class="chip">已上传</span>
      </div>
    `;
  }

  function milestone(label, value, goal, barClass) {
    const pct = Math.min(100, Math.round((value / goal) * 100));
    return `
      <div style="margin-bottom:16px">
        <div class="progress-label"><span>${label}</span><span>${value}/${goal}</span></div>
        <div class="progress"><span class="${barClass}" style="--value:${pct}%"></span></div>
      </div>
    `;
  }

  function renderWeeklyAchievements() {
    const earned = window.MochiApp.getUnlockedAchievements?.() || { small: {}, big: {} };
    const state = window.MochiApp.loadAchievementState?.() || { small: {}, big: {} };
    const cfg = window.MochiApp.loadAchievementConfig?.() || {
      small: { recordCount: 10, focusHours: 2, studyDays: 3 },
      big: { nodeRecords: 20, totalRecords: 50 },
    };
    const show = [
      {
        icon: "menu_book",
        label: "勤奋记录",
        desc: `每 ${cfg.small.recordCount} 条记录 1 个小勋章`,
        earned: Number(earned.small?.recordCount || 0),
        claimed: Number(state.small?.recordCount || 0),
      },
      {
        icon: "timer",
        label: "专注时光",
        desc: `每 ${cfg.small.focusHours} 小时专注 1 个小勋章`,
        earned: Number(earned.small?.focusHours || 0),
        claimed: Number(state.small?.focusHours || 0),
      },
      {
        icon: "book_4",
        label: "知识深耕",
        desc: `每 ${cfg.big.nodeRecords} 条/知识点 1 个大勋章`,
        earned: Number(earned.big?.nodeRecords || 0),
        claimed: Number(state.big?.nodeRecords || 0),
      },
    ];
    return `
      <section class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:12px">
          <h3>勋章进度</h3>
          <button class="btn btn-outline btn-sm" data-route="achievements">查看全部</button>
        </div>
        ${show.map((item) => `
            <div class="milestone-row ${item.claimed > 0 ? "unlocked" : ""}">
              <span class="milestone-icon material-symbols-outlined">${item.icon}</span>
              <div class="milestone-info">
                <strong>${item.label}</strong>
                <p class="muted">${item.desc}</p>
              </div>
              <div class="milestone-progress">
                <span class="milestone-fraction">x${item.earned}</span>
                ${item.earned > item.claimed ? `<span class="badge-new-tag">+${item.earned - item.claimed}</span>` : ""}
              </div>
            </div>
          `).join("")}
      </section>
    `;
  }

  function renderFocusStats() {
    const logs = window.MochiApp?.readJson?.("focus_log", []) || [];
    const today = new Date().toISOString().slice(0, 10);
    const monday = (() => {
      const date = new Date();
      date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      return date.toISOString().slice(0, 10);
    })();
    const completed = Array.isArray(logs) ? logs.filter((log) => log.type === "focus" && log.completed) : [];
    const todayMinutes = completed.filter((log) => log.date === today).reduce((sum, log) => sum + Number(log.duration || 0), 0);
    const weekMinutes = completed.filter((log) => log.date >= monday).reduce((sum, log) => sum + Number(log.duration || 0), 0);
    return `
      <section class="card stat-card">
        <div class="stat-icon"><span class="material-symbols-outlined">timer</span></div>
        <div class="stat-val">${todayMinutes}<span class="stat-unit">分钟</span></div>
        <div class="stat-lbl">今日专注</div>
        <div class="stat-sub">本周累计 ${weekMinutes} 分钟</div>
      </section>
    `;
  }

  function moodCard() {
    const state = window.MochiFarm?.readState?.() || {};
    const totalHarvests = state.totalHarvests || 0;
    const level = window.MochiFarm?.getFarmLevel?.(totalHarvests) || { level: 1, name: "小菜园", minHarvests: 0 };
    const nextLevel = window.MochiFarm?.FARM_LEVELS?.find((item) => item.minHarvests > totalHarvests);
    const currentMin = level.minHarvests || 0;
    const target = nextLevel ? nextLevel.minHarvests - currentMin : Math.max(1, totalHarvests || 1);
    const current = nextLevel ? totalHarvests - currentMin : target;
    return `
      <section class="card" style="background:linear-gradient(135deg,rgba(255,183,206,.34),rgba(255,249,240,.96))">
        <h3>农场状态</h3>
        <div class="focus-item" style="grid-template-columns:54px 1fr;margin-top:16px">
          <div class="farm-mini-icon" aria-label="农场">🌱</div>
          <div>${milestone(`Lv.${level.level} ${level.name}`, current, target, "bar-primary")}</div>
        </div>
        <p class="muted">已收获 ${totalHarvests} 次 · 农场 XP ${state.xp || 0}</p>
      </section>
    `;
  }

  function stats(logs) {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const weekAgo = new Date(Date.now() - 86400000 * 6);
    const todayQuestions = sumQuestions(logs.filter((log) => isSameDate(new Date(log.date), today)));
    const yesterdayQuestions = sumQuestions(logs.filter((log) => isSameDate(new Date(log.date), yesterday)));
    const weekLogs = logs.filter((log) => new Date(log.date) >= weekAgo);
    return {
      todayQuestions,
      delta: todayQuestions - yesterdayQuestions,
      weekQuestions: sumQuestions(weekLogs),
      weekNodes: new Set(weekLogs.map((log) => log.nodeId)).size,
    };
  }

  function sumQuestions(logs) {
    return logs.reduce((sum, log) => sum + Number(log.questionsCompleted || 0), 0);
  }

  function openDaySummary(dateKey) {
    const logs = window.MochiApp.readStudyLogs().filter((log) => log.date.slice(0, 10) === dateKey);
    if (!logs.length) return;
    renderDayModal(dateKey, logs, "summary");
  }

  function renderDayModal(dateKey, logs, view = "summary") {
    window.MochiApp.modal(view === "detail" ? dayDetailHtml(dateKey, logs) : daySummaryHtml(dateKey, logs));
  }

  function daySummaryHtml(dateKey, logs) {
    const rows = summarizeBySubject(logs);
    return `
      <div class="modal-head day-summary-head">
        <div><h2>${formatDateTitle(dateKey)}</h2><p class="muted">学习小卡片</p></div>
        <button class="icon-btn" data-action="close-modal"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="day-summary-list">
        ${rows.map(renderDaySummaryRow).join("")}
      </div>
      <div class="day-summary-footer">
        <p class="day-summary-total">共完成 ${sumQuestions(logs)} 题</p>
        <button class="btn btn-outline btn-sm" data-action="day-detail" data-date="${dateKey}">查看详情 →</button>
      </div>
    `;
  }

  function dayDetailHtml(dateKey, logs) {
    return `
      <div class="modal-head day-summary-head">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" data-action="day-summary" data-date="${dateKey}">← 返回</button>
          <h2>${formatDateTitle(dateKey)} 详情</h2>
        </div>
        <button class="icon-btn" data-action="close-modal"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="day-detail-list">
        ${logs.map(renderDayDetailRow).join("")}
      </div>
    `;
  }

  function summarizeBySubject(logs) {
    const groups = {};
    logs.forEach((log) => {
      groups[log.subject] = groups[log.subject] || { subject: log.subject, questionsCompleted: 0, stars: 0 };
      groups[log.subject].questionsCompleted += Number(log.questionsCompleted || 0);
      groups[log.subject].stars = Math.max(groups[log.subject].stars, Number(log.stars || 1));
    });
    return Object.values(groups);
  }

  function renderDaySummaryRow(item) {
    const subject = window.MochiKnowledge.SUBJECTS[item.subject];
    return `
      <div class="day-summary-row">
        <span>${subject.label}</span>
        <strong>${item.questionsCompleted}题 · ${"★".repeat(item.stars || 1)}</strong>
      </div>
    `;
  }

  function renderDayDetailRow(log) {
    const subject = window.MochiKnowledge.SUBJECTS[log.subject];
    return `
      <article class="day-detail-row">
        <strong><span class="material-symbols-outlined">${subject.icon}</span>${subject.label} · ${formatRichText(log.nodeLabel)}</strong>
        <p>完成 ${log.questionsCompleted} 题 · ${"★".repeat(log.stars || 1)}</p>
        <p>原题：${formatRichText(originalQuestionText(log))}</p>
        <p>卡点：${formatRichText(log.painPoint || "暂无卡点记录")}</p>
      </article>
    `;
  }

  function originalQuestionText(log) {
    return String(log.originalQuestion || "").trim() || "暂无原题描述";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function formatRichText(value) {
    return window.MochiApp?.formatRichText?.(value) ?? escapeHtml(value);
  }

  function formatDateTitle(dateKey) {
    const date = new Date(`${dateKey}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateKey;
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function isSameDate(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function toDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function shiftMonth(delta) {
    STATE.month = new Date(STATE.month.getFullYear(), STATE.month.getMonth() + Number(delta), 1);
  }

  window.MochiCalendar = {
    STATE,
    renderSchedule,
    openDaySummary,
    renderDayModal,
    shiftMonth,
  };
})();
