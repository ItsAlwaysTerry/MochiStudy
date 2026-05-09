(function () {
  const GAME_CONFIG_DEFAULTS = {
    farm: {
      harvestTarget: 15,
      growthStages: [0, 3, 6, 10, 15],
      harvestXP: 20,
      levelMinHarvests: [0, 3, 8, 18, 35],
    },
    timer: {
      defaultFocus: 25,
      defaultRest: 5,
    },
    cards: {
      masteredMinRecent: 2,
      dormantDays: 30,
    },
    rewards: {
      petXPPerQuestion: 5,
      farmXPPerQuestion: 3,
    },
    pet: {
      dailyEnergyDecay: 20,
      dailyFocusDecay: 15,
      studyEnergyBonus: 25,
    },
    calendar: {
      heatLevel1: 1,
      heatLevel2: 2,
      heatLevel3: 4,
    },
  };

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function deepMerge(defaults, saved) {
    if (Array.isArray(defaults)) return Array.isArray(saved) ? saved.slice(0, defaults.length).map((value, index) => Number(value ?? defaults[index])) : [...defaults];
    if (!isPlainObject(defaults)) return saved === undefined ? defaults : saved;
    const result = {};
    Object.entries(defaults).forEach(([key, value]) => {
      result[key] = deepMerge(value, isPlainObject(saved) || Array.isArray(saved) ? saved[key] : undefined);
    });
    return result;
  }

  function loadGameConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem("game_config") || "{}");
      return deepMerge(GAME_CONFIG_DEFAULTS, saved);
    } catch {
      return deepMerge(GAME_CONFIG_DEFAULTS, {});
    }
  }

  const GAME_CONFIG = loadGameConfig();

  // ═══════════════════════════════════════════════════
  // 勋章配置 — 修改这里来调整勋章内容和难度
  // type 说明：
  //   tiered   = 分段式（同一成就多个等级，永远有下一级）
  //   weekly   = 每周重置（每周可以重新挑战）
  //   holiday  = 每个假期重置（每次放假重新挑战）
  //   total    = 永久累计（一次性）
  // ═══════════════════════════════════════════════════
  const ACHIEVEMENT_DEFS = [
    { id: "questions", type: "tiered", group: "刷题达人", metric: "totalQuestions", tiers: [
      { level: 1, label: "初出茅庐", desc: "累计完成 20 题", icon: "📝", target: 20, color: "#ffb7ce" },
      { level: 2, label: "勤奋练习", desc: "累计完成 50 题", icon: "✏️", target: 50, color: "#ff85b3" },
      { level: 3, label: "百题达人", desc: "累计完成 100 题", icon: "🖊️", target: 100, color: "#864d61" },
      { level: 4, label: "题海无边", desc: "累计完成 300 题", icon: "📚", target: 300, color: "#5a3040" },
      { level: 5, label: "高考战士", desc: "累计完成 500 题", icon: "🏆", target: 500, color: "#FFD700" },
    ] },
    { id: "nodes", type: "tiered", group: "知识点亮", metric: "totalNodes", tiers: [
      { level: 1, label: "第一步", desc: "点亮 3 个知识点", icon: "🌱", target: 3, color: "#9bdaa5" },
      { level: 2, label: "初窥门径", desc: "点亮 8 个知识点", icon: "🌿", target: 8, color: "#50b070" },
      { level: 3, label: "小有所成", desc: "点亮 15 个知识点", icon: "🌳", target: 15, color: "#2f6a3f" },
      { level: 4, label: "融会贯通", desc: "点亮全部 26 个知识点", icon: "🌲", target: 26, color: "#FFD700" },
    ] },
    { id: "mastered_nodes", type: "tiered", group: "精通达人", metric: "masteredNodes", tiers: [
      { level: 1, label: "初窥门径", desc: "精通 1 个知识点（连续2次3星）", icon: "🌟", target: 1, color: "#fdd6a7" },
      { level: 2, label: "小有所成", desc: "精通 3 个知识点", icon: "💫", target: 3, color: "#f3a953" },
      { level: 3, label: "融会贯通", desc: "精通 8 个知识点", icon: "✨", target: 8, color: "#e07020" },
      { level: 4, label: "高考无敌", desc: "精通 15 个知识点", icon: "👑", target: 15, color: "#FFD700" },
    ] },
    { id: "focus", type: "tiered", group: "专注达人", metric: "totalFocusMinutes", tiers: [
      { level: 1, label: "初尝专注", desc: "累计专注 1 小时", icon: "⏱️", target: 60, color: "#c5c2f0" },
      { level: 2, label: "专注成习", desc: "累计专注 5 小时", icon: "⏰", target: 300, color: "#8a87d0" },
      { level: 3, label: "深度学习", desc: "累计专注 20 小时", icon: "🎯", target: 1200, color: "#4a4580" },
      { level: 4, label: "专注大师", desc: "累计专注 50 小时", icon: "🔮", target: 3000, color: "#FFD700" },
    ] },
    { id: "stars", type: "tiered", group: "满星收集", metric: "threeStarCount", tiers: [
      { level: 1, label: "首个满星", desc: "首次获得 3 星评级", icon: "⭐", target: 1, color: "#ffb7ce" },
      { level: 2, label: "五星好评", desc: "累计 5 次 3 星", icon: "🌟", target: 5, color: "#ff85b3" },
      { level: 3, label: "星光熠熠", desc: "累计 20 次 3 星", icon: "✨", target: 20, color: "#FFD700" },
      { level: 4, label: "满星传说", desc: "累计 50 次 3 星", icon: "💫", target: 50, color: "#FFD700" },
    ] },
    { id: "week_q", type: "weekly", group: "每周挑战", metric: "weekQuestions", label: "本周刷题王", desc: "本周完成 30 题", icon: "🏅", target: 30, color: "#fdd6a7" },
    { id: "week_focus", type: "weekly", group: "每周挑战", metric: "weekFocusMinutes", label: "本周专注王", desc: "本周专注 5 小时", icon: "🎖️", target: 300, color: "#fdd6a7" },
    { id: "holiday_q", type: "holiday", group: "假期冲刺", metric: "holidayQuestions", label: "假期刷题冠军", desc: "本次假期完成 100 题", icon: "🥇", target: 100, color: "#ff85b3" },
    { id: "holiday_focus", type: "holiday", group: "假期冲刺", metric: "holidayFocusMinutes", label: "假期专注冠军", desc: "本次假期专注 20 小时", icon: "🏆", target: 1200, color: "#ff85b3" },
    { id: "streak_3", type: "total", group: "坚持打卡", metric: "maxStreakDays", label: "三天不倦", desc: "连续学习 3 天", icon: "🔥", target: 3, color: "#fdd6a7" },
    { id: "streak_7", type: "total", group: "坚持打卡", metric: "maxStreakDays", label: "一周坚持", desc: "连续学习 7 天", icon: "🔥🔥", target: 7, color: "#f3a953" },
    { id: "streak_14", type: "total", group: "坚持打卡", metric: "maxStreakDays", label: "两周不断", desc: "连续学习 14 天", icon: "⚡", target: 14, color: "#e07020" },
    { id: "streak_21", type: "total", group: "坚持打卡", metric: "maxStreakDays", label: "三周传说", desc: "连续学习 21 天", icon: "👑", target: 21, color: "#FFD700" },
    { id: "first_harvest", type: "total", group: "农场成就", metric: "totalHarvests", label: "第一次收获", desc: "让一块地的作物成熟并收获", icon: "🌾", target: 1, color: "#fdd6a7" },
    { id: "full_farm", type: "total", group: "农场成就", metric: "allSubjectHarvested", label: "满园春色", desc: "三个科目都收获过至少一次", icon: "🏡", target: 1, color: "#f3a953" },
    { id: "comeback", type: "total", group: "农场成就", metric: "comebackCount", label: "起死回生", desc: "某科目从荒芜重新长到成熟", icon: "🌱", target: 1, color: "#50b070" },
    { id: "balanced_week", type: "weekly", group: "均衡发展", metric: "weekBalanced", label: "全科出动", desc: "本周三个科目都有学习记录", icon: "⚖️", target: 1, color: "#9bdaa5" },
    { id: "balanced_streak", type: "tiered", group: "均衡发展", metric: "balancedWeeks", tiers: [
      { level: 1, label: "初见均衡", desc: "连续2周三科都有记录", icon: "🌙", target: 2, color: "#9bdaa5" },
      { level: 2, label: "稳定发展", desc: "连续4周三科都有记录", icon: "🌙🌙", target: 4, color: "#50b070" },
      { level: 3, label: "全科霸主", desc: "连续8周三科都有记录", icon: "👑", target: 8, color: "#FFD700" },
    ] },
  ];
  const view = document.getElementById("view");
  const modalRoot = document.getElementById("modal-root");
  const toastRoot = document.getElementById("toast-root");
  const STUDY_LOG_KEY = "study_log";
  const HOLIDAYS_KEY = "school_holidays";
  const HOLIDAY_MODE_KEY = "holiday_mode_override";
  const BACKUP_VERSION = "1.0";
  const DEFAULT_HOLIDAYS = [
    { id: "h1", label: "2025暑假", start: "2025-07-13", end: "2025-08-01" },
    { id: "h2", label: "2025国庆", start: "2025-10-01", end: "2025-10-07" },
    { id: "h3", label: "2026元旦", start: "2026-01-01", end: "2026-01-01" },
    { id: "h4", label: "2026春节", start: "2026-01-28", end: "2026-02-04" },
    { id: "h5", label: "2026寒假", start: "2026-02-07", end: "2026-03-02" },
    { id: "h6", label: "2026暑假", start: "2026-07-11", end: "2026-09-01" },
  ];
  const DEFAULT_TASKS = {
    math: {},
    physics: {},
    chemistry: {},
  };

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") || fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function setByPath(target, path, value) {
    const parts = path.split(".");
    let cursor = target;
    parts.slice(0, -1).forEach((part) => {
      cursor = cursor[part];
    });
    const key = parts[parts.length - 1];
    cursor[key] = Array.isArray(cursor[key]) ? value : Number(value);
  }

  function getByPath(target, path) {
    return path.split(".").reduce((cursor, part) => cursor?.[part], target);
  }

  function saveGameConfig() {
    localStorage.setItem("game_config", JSON.stringify(GAME_CONFIG));
  }

  function updateGameConfig(path, value) {
    setByPath(GAME_CONFIG, path, value);
    saveGameConfig();
    return GAME_CONFIG;
  }

  function getHolidays() {
    return readJson(HOLIDAYS_KEY, DEFAULT_HOLIDAYS);
  }

  function saveHolidays(holidays) {
    writeJson(HOLIDAYS_KEY, holidays);
  }

  function isHolidayToday(date = todayKey()) {
    const saved = readJson(HOLIDAY_MODE_KEY, { mode: "auto" });
    const mode = typeof saved === "string" ? saved : saved.mode;
    if (mode === "holiday") {
      const savedDate = typeof saved === "object" ? saved.date : null;
      if (savedDate && savedDate !== todayKey()) {
        writeJson(HOLIDAY_MODE_KEY, { mode: "auto" });
      } else {
        return true;
      }
    }
    if (mode === "school") return false;
    const day = new Date(`${date}T12:00:00`).getDay();
    if (day === 0 || day === 6) return true;
    return getHolidays().some((holiday) => date >= holiday.start && date <= holiday.end);
  }

  function holidayMode() {
    const saved = readJson(HOLIDAY_MODE_KEY, { mode: "auto" });
    return typeof saved === "string" ? saved : saved.mode || "auto";
  }

  function setHolidayMode(mode) {
    if (mode === "holiday") writeJson(HOLIDAY_MODE_KEY, { mode: "holiday", date: todayKey() });
    else writeJson(HOLIDAY_MODE_KEY, { mode });
    toast(mode === "holiday" ? "今天可以学习啦！记录学习和专注统计都开放了。" : mode === "school" ? "已强制进入冬眠模式" : "已恢复按假期日期自动判断");
    route();
  }

  function nextHoliday() {
    const today = todayKey();
    return getHolidays()
      .filter((holiday) => holiday.start > today)
      .sort((a, b) => a.start.localeCompare(b.start))[0] || null;
  }

  function daysUntilNextHoliday() {
    const next = nextHoliday();
    if (!next) return null;
    const diff = new Date(`${next.start}T00:00:00`) - new Date();
    return { days: Math.max(0, Math.ceil(diff / 86400000)), label: next.label };
  }

  function readStudyLogs() {
    const logs = readJson(STUDY_LOG_KEY, []);
    return Array.isArray(logs) ? logs.sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
  }

  function writeStudyLogs(logs) {
    writeJson(STUDY_LOG_KEY, logs);
  }

  function taskSettings() {
    return DEFAULT_TASKS;
  }

  function dailyTasks() {
    const today = todayKey();
    const logs = readStudyLogs().filter((log) => String(log.date || "").slice(0, 10) === today);
    const settings = taskSettings();
    const result = {};
    Object.keys(settings).forEach((key) => {
      const subjectLogs = logs.filter((log) => log.subject === key);
      result[key] = { completed: subjectLogs.length > 0, count: subjectLogs.length };
    });
    return result;
  }

  function renderDailyTasks() {
    const settings = taskSettings();
    const state = dailyTasks();
    return Object.entries(settings)
      .map(([subject, task]) => {
        const info = window.MochiKnowledge.SUBJECTS[subject];
        const done = state[subject]?.completed;
        return `
          <article class="task-item ${done ? "done" : ""}">
            <span class="task-check ${done ? "" : "todo"}" aria-label="${done ? "已完成" : "未完成"} ${info.label}">
              <span class="material-symbols-outlined">${done ? "check" : "radio_button_unchecked"}</span>
            </span>
            <div>
              <strong>${done ? `今天已导入 ${state[subject].count} 条${info.label}记录` : `今天还没有导入${info.label}记录`}</strong>
              <p class="muted">${done ? "任务已自动完成" : "导入一条学习记录后自动完成"}</p>
            </div>
            <span class="chip ${subject}">${info.label}</span>
          </article>
        `;
      })
      .join("");
  }

  function taskCompletionRate() {
    const state = dailyTasks();
    const total = Object.keys(taskSettings()).length;
    const done = Object.values(state).filter((item) => item.completed).length;
    return total ? done / total : 0;
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function weekStartKey(date = new Date()) {
    const start = new Date(date);
    start.setHours(12, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return start.toISOString().slice(0, 10);
  }

  function hasAllSubjects(logs) {
    const subjects = new Set(logs.map((log) => log.subject));
    return ["math", "physics", "chemistry"].every((subject) => subjects.has(subject));
  }

  function calcBalancedWeeks(studyLogs) {
    let count = 0;
    let monday = new Date(`${weekStartKey()}T12:00:00`);
    for (let i = 0; i < 52; i += 1) {
      const start = monday.toISOString().slice(0, 10);
      const end = addDays(monday, 6).toISOString().slice(0, 10);
      const weekLogs = studyLogs.filter((log) => log.date >= start && log.date <= end);
      if (!hasAllSubjects(weekLogs)) break;
      count += 1;
      monday = addDays(monday, -7);
    }
    return count;
  }

  function validDayGap(prevDate, nextDate) {
    let count = 0;
    const cursor = new Date(`${prevDate}T12:00:00`);
    cursor.setDate(cursor.getDate() + 1);
    const end = new Date(`${nextDate}T12:00:00`);
    while (cursor < end) {
      if (isHolidayToday(cursor.toISOString().slice(0, 10))) count += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  }

  function calcComebackCount(studyLogs) {
    return ["math", "physics", "chemistry"].reduce((total, subject) => {
      const days = [...new Set(studyLogs
        .filter((log) => log.subject === subject)
        .map((log) => String(log.date || "").slice(0, 10))
        .filter(Boolean))]
        .sort();
      let count = 0;
      for (let i = 1; i < days.length; i += 1) {
        if (validDayGap(days[i - 1], days[i]) >= 3) count += 1;
      }
      return total + count;
    }, 0);
  }

  function calcAchievementMetrics() {
    const studyLogsRaw = readJson(STUDY_LOG_KEY, []);
    const focusLogsRaw = readJson("focus_log", []);
    const studyLogs = Array.isArray(studyLogsRaw) ? studyLogsRaw : [];
    const focusLogs = Array.isArray(focusLogsRaw) ? focusLogsRaw : [];
    const petState = window.MochiPet.readState();
    const farmState = window.MochiFarm?.readState?.() || {};
    const nodes = window.MochiKnowledge.readState();
    const today = todayKey();
    const monday = weekStartKey();
    const currentHolidayStart = (() => {
      const holiday = getHolidays().find((item) => today >= item.start && today <= item.end);
      return holiday ? holiday.start : monday;
    })();
    const weekStudyLogs = studyLogs.filter((log) => log.date >= monday);
    const weekFocusLogs = focusLogs.filter((log) => log.date >= monday && log.type === "focus" && log.completed);
    const holidayStudyLogs = studyLogs.filter((log) => log.date >= currentHolidayStart);
    const holidayFocusLogs = focusLogs.filter((log) => log.date >= currentHolidayStart && log.type === "focus" && log.completed);
    const allFocusLogs = focusLogs.filter((log) => log.type === "focus" && log.completed);
    const farmPlots = farmState.plots || {};
    return {
      totalQuestions: studyLogs.reduce((sum, log) => sum + Number(log.questionsCompleted || 0), 0),
      totalNodes: Object.values(nodes).filter((node) => node.status !== "untouched").length,
      masteredNodes: Object.values(nodes).filter((node) => node.status === "mastered").length,
      totalFocusMinutes: allFocusLogs.reduce((sum, log) => sum + Number(log.duration || 0), 0),
      threeStarCount: studyLogs.filter((log) => Number(log.stars) === 3).length,
      weekQuestions: weekStudyLogs.reduce((sum, log) => sum + Number(log.questionsCompleted || 0), 0),
      weekFocusMinutes: weekFocusLogs.reduce((sum, log) => sum + Number(log.duration || 0), 0),
      weekNodes: new Set(weekStudyLogs.map((log) => log.nodeId).filter(Boolean)).size,
      holidayQuestions: holidayStudyLogs.reduce((sum, log) => sum + Number(log.questionsCompleted || 0), 0),
      holidayFocusMinutes: holidayFocusLogs.reduce((sum, log) => sum + Number(log.duration || 0), 0),
      streakDays: petState.streakDays || 0,
      maxStreakDays: petState.maxStreakDays || petState.streakDays || 0,
      totalHarvests: farmState.totalHarvests || 0,
      allSubjectHarvested: ["math", "physics", "chemistry"].every((subject) => Number(farmPlots[subject]?.harvestCount || 0) > 0) ? 1 : 0,
      comebackCount: calcComebackCount(studyLogs),
      weekBalanced: hasAllSubjects(weekStudyLogs) ? 1 : 0,
      balancedWeeks: calcBalancedWeeks(studyLogs),
    };
  }

  function getUnlockedAchievements() {
    const metrics = calcAchievementMetrics();
    const result = [];
    ACHIEVEMENT_DEFS.forEach((definition) => {
      if (definition.type === "tiered") {
        let currentLevel = 0;
        definition.tiers.forEach((tier) => {
          if ((metrics[definition.metric] || 0) >= tier.target) currentLevel = tier.level;
        });
        const nextTier = definition.tiers.find((tier) => tier.level === currentLevel + 1);
        const currentTier = definition.tiers.find((tier) => tier.level === currentLevel);
        result.push({
          id: definition.id,
          group: definition.group,
          type: "tiered",
          currentLevel,
          totalLevels: definition.tiers.length,
          currentTier,
          nextTier,
          current: metrics[definition.metric] || 0,
          metric: definition.metric,
          unlocked: currentLevel > 0,
          maxed: currentLevel === definition.tiers.length,
        });
      } else {
        result.push({
          ...definition,
          current: metrics[definition.metric] || 0,
          unlocked: (metrics[definition.metric] || 0) >= definition.target,
        });
      }
    });
    return result;
  }

  function route(routeName) {
    const routeId = routeName || location.hash.replace("#", "") || "home";
    setActive(routeId);
    if (routeId === "home") window.MochiFarm?.renderFarm?.(view);
    else if (routeId === "schedule") window.MochiCalendar.renderSchedule(view);
    else if (routeId === "map") window.MochiCards.render(view);
    else if (routeId === "achievements") renderAchievements(view);
    else if (routeId === "settings") renderSettings(view);
    else window.MochiFarm?.renderFarm?.(view);
    window.MochiPet.renderMiniState();
  }

  function currentRoute() {
    return location.hash.replace("#", "") || "home";
  }

  function setActive(routeId) {
    document.querySelectorAll("[data-route]").forEach((el) => {
      el.classList.toggle("active", el.dataset.route === routeId);
    });
    document.querySelector(".side-nav")?.classList.remove("open");
  }

  function navigate(routeId, updateHash = true) {
    if (updateHash) location.hash = routeId;
    else route(routeId);
  }

  function renderSettings(container) {
    const config = window.MochiAI.readConfig();
    const mode = holidayMode();
    const focusEndSound = localStorage.getItem("focus_end_sound") || "soft";
    const restReminderSound = localStorage.getItem("rest_reminder_sound") || "melody";
    container.innerHTML = `
      <div class="page-head">
        <div>
          <h2>设置</h2>
          <p>API Key 和学习数据只保存在本地浏览器。</p>
        </div>
      </div>
      <div class="grid schedule-grid">
        <section class="card settings-section">
          <h3>提醒设置</h3>
          <div class="settings-row">
            <div>
              <strong>休息结束提醒音</strong>
              <p class="muted" style="font-size:13px;margin-top:2px">休息结束后每隔30秒响一次，点击页面任意地方停止，最多提醒5分钟</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="sound-reminder-toggle" ${localStorage.getItem("sound_reminder_enabled") === "true" ? "checked" : ""} onchange="localStorage.setItem('sound_reminder_enabled', this.checked ? 'true' : 'false')">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="settings-row">
            <div>
              <strong>休息结束铃声</strong>
              <p class="muted" style="font-size:13px;margin-top:2px">休息结束遮罩出现时播放；每30秒重复一次</p>
            </div>
            <select id="rest-reminder-sound-select" class="settings-select" aria-label="休息结束铃声">
              <option value="melody" ${restReminderSound === "melody" ? "selected" : ""}>温柔旋律</option>
              <option value="bell" ${restReminderSound === "bell" ? "selected" : ""}>小风铃</option>
              <option value="soft" ${restReminderSound === "soft" ? "selected" : ""}>低柔三音</option>
              <option value="bright" ${restReminderSound === "bright" ? "selected" : ""}>清亮提示</option>
            </select>
          </div>
          <div class="settings-row">
            <div>
              <strong>专注到点提示音</strong>
              <p class="muted" style="font-size:13px;margin-top:2px">设定时间到点或结束本轮时播放；自由专注没有到点提醒</p>
            </div>
            <select id="focus-end-sound-select" class="settings-select" aria-label="专注到点提示音">
              <option value="off" ${focusEndSound === "off" ? "selected" : ""}>不响</option>
              <option value="soft" ${focusEndSound === "soft" ? "selected" : ""}>轻柔双音</option>
              <option value="bell" ${focusEndSound === "bell" ? "selected" : ""}>小风铃</option>
              <option value="ding" ${focusEndSound === "ding" ? "selected" : ""}>清脆短音</option>
            </select>
          </div>
        </section>
        <section class="card">
          <h3>AI 配置</h3>
          <form id="api-form" class="form-grid" style="margin-top:18px">
            <div class="field">
              <label>Base URL</label>
              <input name="baseUrl" value="${config.baseUrl || ""}" placeholder="https://api.deepseek.com/v1" />
              <p class="field-hint">常用：OpenAI https://api.openai.com/v1<br>DeepSeek https://api.deepseek.com/v1<br>Kimi https://api.moonshot.cn/v1<br>通义千问 https://dashscope.aliyuncs.com/compatible-mode/v1<br>Anthropic https://api.anthropic.com/v1</p>
            </div>
            <div class="field"><label>API Key</label><input type="password" name="apiKey" value="${config.apiKey || ""}" placeholder="sk-..." /></div>
            <div class="field"><label>模型名称</label><input name="model" value="${config.model || ""}" placeholder="deepseek-chat / moonshot-v1-8k / qwen-plus" /></div>
            <button class="btn btn-primary" type="submit"><span class="material-symbols-outlined">save</span>保存配置</button>
          </form>
        </section>
        <section class="card">
          <h3>数据备份与恢复</h3>
          <p class="muted">备份会打包当前浏览器里保存的全部 MochiStudy 数据。恢复会覆盖当前数据。</p>
          <div class="settings-list" style="margin-top:18px">
            <button class="btn btn-outline" data-action="export-data"><span class="material-symbols-outlined">download</span>导出备份</button>
            <label class="btn btn-outline" style="cursor:pointer"><span class="material-symbols-outlined">upload</span>导入恢复<input id="backup-import" type="file" accept="application/json" hidden /></label>
          </div>
        </section>
        <section class="card">
          <h3>数据管理</h3>
          <p class="muted">清理测试数据或重新开始前，建议先导出备份。</p>
          <div class="settings-list" style="margin-top:18px">
            <button class="btn btn-outline" data-action="clear-progress">
              <span class="material-symbols-outlined">restart_alt</span>
              清空学习进度
            </button>
            <p class="field-hint">删除学习记录、专注记录、农场进度和学习状态；保留 API、假期、提醒音、游戏参数等设置。</p>
            <button class="btn btn-danger" data-action="factory-reset">
              <span class="material-symbols-outlined">delete_forever</span>
              恢复出厂设置
            </button>
            <p class="field-hint">删除当前浏览器里 MochiStudy 的全部已知数据和设置，适合彻底重来。</p>
          </div>
        </section>
        <section class="card" style="grid-column:1 / -1">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
            <div>
              <h3>假期管理</h3>
              <p class="muted">周六日自动开放学习。寒暑假和法定假期请手动添加。上学期间临时想学习，点首页的「今天想学习」按钮即可，当天有效。</p>
            </div>
            <button class="btn btn-primary" data-action="open-holiday-form"><span class="material-symbols-outlined">add</span>添加假期</button>
          </div>
          <div class="mode-switch" style="margin-top:18px">
            <button class="${mode === "auto" ? "active" : ""}" data-action="set-holiday-mode" data-mode="auto">自动判断</button>
            <button class="${mode === "holiday" ? "active" : ""}" data-action="set-holiday-mode" data-mode="holiday">强制假期</button>
            <button class="${mode === "school" ? "active" : ""}" data-action="set-holiday-mode" data-mode="school">强制冬眠</button>
          </div>
          <p class="field-hint" style="margin-top:10px">周六日无需手动设置；临时开放只对当天生效，第二天自动恢复自动判断。</p>
          <div class="table-wrap" style="margin-top:18px">
            <table class="holiday-table">
              <thead><tr><th>假期名称</th><th>开始日期</th><th>结束日期</th><th>操作</th></tr></thead>
              <tbody>
                ${getHolidays().map((holiday) => `
                  <tr>
                    <td>${holiday.label}</td>
                    <td>${holiday.start}</td>
                    <td>${holiday.end}</td>
                    <td><button class="btn btn-outline btn-sm" data-action="delete-holiday" data-holiday-id="${holiday.id}">删除</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </section>
        <section class="card">
          <h3>关于</h3>
          <p class="muted">MochiStudy v3.0 · 原生 HTML/CSS/JavaScript · 粘贴学习记录驱动档案、农场和日历。</p>
        </section>
      </div>
    `;
  }

  function renderAchievements(container) {
    const all = getUnlockedAchievements();
    const groups = [...new Set(ACHIEVEMENT_DEFS.map((achievement) => achievement.group))];
    const unlockedCount = all.filter((achievement) => achievement.unlocked).length;
    const recentUnlocked = all.filter((achievement) => achievement.unlocked).slice(0, 3);
    const recentHtml = recentUnlocked.length > 0 ? `
      <section class="card recent-unlocked">
        <h3 style="margin-bottom:12px">已解锁</h3>
        <div class="recent-badges">
          ${recentUnlocked.map((achievement) => `
            <div class="recent-badge">
              <div class="achievement-icon" style="background:${achievement.color || achievement.currentTier?.color || "#e7e2d9"}">${achievement.icon || achievement.currentTier?.icon || "🏅"}</div>
              <span>${escapeHtml(achievement.label || achievement.currentTier?.label || achievement.group)}</span>
            </div>
          `).join("")}
        </div>
      </section>
    ` : "";
    container.innerHTML = `
      <div class="page-head">
        <div>
          <h2>勋章墙</h2>
          <p class="muted">已解锁 ${unlockedCount} / ${all.length} 个勋章</p>
        </div>
      </div>
      ${recentHtml}
      <div class="achievements-grid">
        ${groups.map((group) => {
          const groupItems = all.filter((achievement) => achievement.group === group);
          const unlocked = groupItems.filter((achievement) => achievement.unlocked || achievement.currentLevel > 0);
          const locked = groupItems.filter((achievement) => !achievement.unlocked && achievement.currentLevel === 0);
          const sorted = [...unlocked, ...locked];
          return `
            <section class="card">
              <h3 style="margin-bottom:16px">${group}</h3>
              ${sorted.map(renderAchievementItem).join("")}
            </section>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderAchievementItem(achievement) {
    if (achievement.type === "tiered") {
      const progressPercent = achievement.nextTier ? Math.min(100, Math.round((achievement.current / achievement.nextTier.target) * 100)) : 100;
      return `
        <div class="achievement-item ${achievement.unlocked ? "unlocked unlocked-glow" : "locked"} ${achievement.maxed ? "maxed" : ""}">
          <div class="achievement-icon" style="background:${achievement.currentTier ? achievement.currentTier.color : "#e7e2d9"}">
            ${achievement.currentTier ? achievement.currentTier.icon : "🔒"}
            ${achievement.currentLevel > 0 ? `<span class="achievement-level">Lv.${achievement.currentLevel}</span>` : ""}
          </div>
          <div class="achievement-body">
            <strong>${achievement.currentTier ? achievement.currentTier.label : achievement.group}</strong>
            ${achievement.maxed ? `
              <p style="color:#FFD700;font-weight:700;font-size:12px">✦ 已达到最高等级</p>
            ` : `
              <p class="muted">下一级：${achievement.nextTier?.desc || ""}</p>
              <div class="progress" style="margin-top:6px">
                <span class="bar-primary" style="--value:${progressPercent}%"></span>
              </div>
              <span class="muted" style="font-size:11px">${achievement.current} / ${achievement.nextTier?.target || 0}</span>
            `}
            ${achievement.currentLevel > 0 && !achievement.maxed ? `
              <div class="tier-dots">
                ${Array.from({ length: achievement.totalLevels }, (_, index) => `<span class="tier-dot ${index < achievement.currentLevel ? "filled" : ""}"></span>`).join("")}
              </div>
            ` : ""}
          </div>
        </div>
      `;
    }
    const percent = Math.min(100, Math.round((achievement.current / achievement.target) * 100));
    return `
      <div class="achievement-item ${achievement.unlocked ? "unlocked unlocked-glow" : "locked"}">
        <div class="achievement-icon" style="background:${achievement.unlocked ? achievement.color : "#e7e2d9"}">
          ${achievement.unlocked ? achievement.icon : "🔒"}
        </div>
        <div class="achievement-body">
          <strong>${achievement.label}</strong>
          <p class="muted">${achievement.desc}</p>
          ${achievement.unlocked ? `
            <span style="font-size:11px;color:${achievement.color};font-weight:700">✓ 已解锁</span>
          ` : `
            <div class="progress" style="margin-top:6px">
              <span class="bar-primary" style="--value:${percent}%"></span>
            </div>
            <span class="muted" style="font-size:11px">${achievement.current} / ${achievement.target}</span>
          `}
        </div>
      </div>
    `;
  }

  function modal(html) {
    modalRoot.hidden = false;
    modalRoot.innerHTML = `<section class="modal">${html}</section>`;
  }

  function closeModal() {
    modalRoot.hidden = true;
    modalRoot.innerHTML = "";
  }

  function toast(message) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    toastRoot.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  let _audioCtx = null;
  let _reminderInterval = null;
  let _reminderCount = 0;
  const REMINDER_MAX = 10;
  const REMINDER_INTERVAL = 30;

  function getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        _audioCtx = null;
      }
    }
    return _audioCtx;
  }

  function playNote(ctx, freq, startTime, duration, volume = 0.3) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.setValueAtTime(volume, startTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  function playReminderMelody() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      [
        { freq: 523.25, start: 0, dur: 0.6 },
        { freq: 659.25, start: 0.55, dur: 0.6 },
        { freq: 783.99, start: 1.1, dur: 0.6 },
        { freq: 659.25, start: 1.65, dur: 0.5 },
        { freq: 880, start: 2.2, dur: 0.7 },
        { freq: 783.99, start: 2.9, dur: 0.6 },
        { freq: 659.25, start: 3.5, dur: 0.6 },
        { freq: 523.25, start: 4.1, dur: 1.2 },
      ].forEach((note) => {
        playNote(ctx, note.freq, now + note.start, note.dur, 0.22);
      });
    } catch {
      // Audio reminders are optional.
    }
  }

  function playChime() {
    playReminderMelody();
  }

  function playDing() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      if (ctx.state === "suspended") ctx.resume();
      playNote(ctx, 783.99, ctx.currentTime, 0.5, 0.25);
    } catch {
      // Audio reminders are optional.
    }
  }

  function playSoftFocusTone(ctx) {
    const now = ctx.currentTime;
    playNote(ctx, 523.25, now, 0.22, 0.14);
    playNote(ctx, 659.25, now + 0.2, 0.28, 0.12);
  }

  function playBellFocusTone(ctx) {
    const now = ctx.currentTime;
    [
      { freq: 659.25, start: 0, dur: 0.18, volume: 0.11 },
      { freq: 783.99, start: 0.16, dur: 0.2, volume: 0.1 },
      { freq: 987.77, start: 0.34, dur: 0.26, volume: 0.09 },
      { freq: 783.99, start: 0.58, dur: 0.34, volume: 0.08 },
    ].forEach((note) => {
      playNote(ctx, note.freq, now + note.start, note.dur, note.volume);
    });
  }

  function playFocusEndSound(sound = localStorage.getItem("focus_end_sound") || "soft") {
    if (sound === "off") return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      if (ctx.state === "suspended") ctx.resume();
      if (sound === "bell") playBellFocusTone(ctx);
      else if (sound === "ding") playDing();
      else playSoftFocusTone(ctx);
    } catch {
      // Audio reminders are optional.
    }
  }

  function playSoftRestTone(ctx) {
    const now = ctx.currentTime;
    [
      { freq: 392, start: 0, dur: 0.42, volume: 0.12 },
      { freq: 493.88, start: 0.36, dur: 0.46, volume: 0.11 },
      { freq: 587.33, start: 0.76, dur: 0.62, volume: 0.1 },
    ].forEach((note) => {
      playNote(ctx, note.freq, now + note.start, note.dur, note.volume);
    });
  }

  function playBrightRestTone(ctx) {
    const now = ctx.currentTime;
    [
      { freq: 523.25, start: 0, dur: 0.24, volume: 0.13 },
      { freq: 659.25, start: 0.22, dur: 0.24, volume: 0.12 },
      { freq: 783.99, start: 0.44, dur: 0.3, volume: 0.12 },
      { freq: 1046.5, start: 0.76, dur: 0.45, volume: 0.1 },
    ].forEach((note) => {
      playNote(ctx, note.freq, now + note.start, note.dur, note.volume);
    });
  }

  function playRestReminderSound(sound = localStorage.getItem("rest_reminder_sound") || "melody") {
    if (sound === "melody") {
      playReminderMelody();
      return;
    }
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      if (ctx.state === "suspended") ctx.resume();
      if (sound === "bell") playBellFocusTone(ctx);
      else if (sound === "soft") playSoftRestTone(ctx);
      else if (sound === "bright") playBrightRestTone(ctx);
      else playReminderMelody();
    } catch {
      // Audio reminders are optional.
    }
  }

  function stopRestReminderOnce() {
    stopRestReminder();
  }

  function showRestReminderOverlay() {
    const overlay = document.getElementById("rest-reminder-overlay");
    if (!overlay) return;
    overlay.hidden = false;
    overlay.innerHTML = `
      <div class="rest-reminder-inner">
        <div class="rest-reminder-icon">☕</div>
        <h2 class="rest-reminder-title">休息结束啦</h2>
        <p class="rest-reminder-sub">点击任意地方继续学习</p>
      </div>
    `;
  }

  function hideRestReminderOverlay() {
    const overlay = document.getElementById("rest-reminder-overlay");
    if (overlay) overlay.hidden = true;
  }

  function stopRestReminder() {
    if (_reminderInterval) {
      clearInterval(_reminderInterval);
      _reminderInterval = null;
    }
    _reminderCount = 0;
    document.removeEventListener("click", stopRestReminderOnce);
    hideRestReminderOverlay();
  }

  function startRestReminder() {
    if (localStorage.getItem("sound_reminder_enabled") !== "true") return;
    stopRestReminder();
    _reminderCount = 0;
    showRestReminderOverlay();
    playRestReminderSound();
    _reminderCount += 1;
    _reminderInterval = setInterval(() => {
      if (_reminderCount >= REMINDER_MAX) {
        stopRestReminder();
        return;
      }
      showRestReminderOverlay();
      playRestReminderSound();
      _reminderCount += 1;
    }, REMINDER_INTERVAL * 1000);
    document.addEventListener("click", stopRestReminderOnce, { once: true });
  }

  function sparkle(target, text) {
    const rect = target?.getBoundingClientRect?.() || { left: window.innerWidth - 100, top: window.innerHeight - 100 };
    const el = document.createElement("div");
    el.className = "sparkle";
    el.textContent = text;
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top = `${rect.top}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  function parseMochiRecord(text) {
    const match = text.match(/---MOCHI-RECORD-START---([\s\S]*?)---MOCHI-RECORD-END---/);
    if (!match) return null;
    const block = match[1].trim();
    function extract(key) {
      const line = block.split(/\r?\n/).find((item) => {
        const trimmed = item.trim();
        return trimmed.startsWith(`${key}:`) || trimmed.startsWith(`${key}：`);
      });
      return line ? line.replace(new RegExp(`^\\s*${key}[:：]`), "").trim() : "";
    }
    const nodeLabel = extract("知识点");
    const subject = subjectKeyFromLabel(extract("科目"));
    return {
      subject,
      nodeId: nodeIdFromLabel(nodeLabel, subject),
      nodeLabel,
      questionsCompleted: parseInt(extract("完成题数"), 10) || 1,
      stars: Math.max(1, Math.min(3, parseInt(extract("掌握星级"), 10) || 1)),
      painPoint: extract("卡点记录"),
      routine: extract("今日套路"),
      date: normalizeRecordDate(extract("学习日期")),
    };
  }

  function subjectKeyFromLabel(label) {
    if (label.includes("数学")) return "math";
    if (label.includes("物理")) return "physics";
    if (label.includes("化学")) return "chemistry";
    return "math";
  }

  function nodeIdFromLabel(label, subject = "math") {
    const match = window.MochiKnowledge.allNodes().find((node) => node.label === label);
    return match?.id || window.MochiKnowledge.SUBJECTS[subject]?.nodes?.[0]?.id || window.MochiKnowledge.SUBJECTS.math.nodes[0].id;
  }

  function normalizeRecordDate(value) {
    if (!value) return todayKey();
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return value.trim();
  }

  function noteFromRecord(record) {
    const subject = window.MochiKnowledge.SUBJECTS[record.subject]?.label || "数学";
    const stars = "★".repeat(record.stars) + "☆".repeat(3 - record.stars);
    return `# ${subject}-${record.nodeLabel}-${record.date}
#高考 #${subject} #${record.nodeLabel}

## 今日套路
${record.routine || "这次记录还没有填写套路，可以下次补充一条最顺手的解题流程。"}

## 卡点记录
${record.painPoint || "暂无明显卡点，继续保持稳定练习。"}

## 完成情况
完成题数：${record.questionsCompleted}题 · 掌握星级：${stars}
`;
  }

  function applyMochiRecord(record) {
    const logs = readStudyLogs();
    const node = window.MochiKnowledge.getNode(record.nodeId);
    const normalizedLabel = window.MochiCards?.normalizeNodeLabel?.(record.subject, record.nodeLabel || node?.label || "", record.nodeId) || record.nodeLabel || node?.label || "";
    const wasMastered = window.MochiCards?.calcNodeStatus?.(logs, record.subject, normalizedLabel) === "mastered";
    const logEntry = {
      id: `log_${Date.now()}`,
      date: record.date,
      subject: record.subject,
      nodeId: node?.id || record.nodeId,
      nodeLabel: normalizedLabel,
      questionsCompleted: record.questionsCompleted,
      stars: record.stars,
      painPoint: record.painPoint || "",
      routine: record.routine || "",
    };
    logs.unshift(logEntry);
    writeStudyLogs(logs);
    const pet = window.MochiPet.addReward({
      xp: record.questionsCompleted * GAME_CONFIG.rewards.petXPPerQuestion,
      studyEnergy: 0,
    });
    const farm = window.MochiFarm?.addResources?.({ xp: record.questionsCompleted * GAME_CONFIG.rewards.farmXPPerQuestion });
    window.MochiFarm?.addSubjectRecord?.(record.subject);
    window.MochiCards?.refresh?.();
    const masteredNow = !wasMastered && window.MochiCards?.calcNodeStatus?.(logs, record.subject, normalizedLabel) === "mastered";
    return { cards: { masteredNow }, pet, farm, note: noteFromRecord({ ...record, nodeLabel: normalizedLabel }) };
  }

  function parsePastedRecordEl(textarea, result) {
    if (!textarea || !result) return;
    const record = parseMochiRecord(textarea.value);
    result.hidden = false;
    if (!record) {
      result.innerHTML = `<strong>没有找到 Mochi 记录块</strong><p class="muted">请确认文本里包含 ---MOCHI-RECORD-START--- 和 ---MOCHI-RECORD-END---。</p>`;
      return;
    }
    const applied = applyMochiRecord(record);
    const subject = window.MochiKnowledge.SUBJECTS[record.subject]?.label || "数学";
    const starIcons = "★".repeat(record.stars) + "☆".repeat(3 - record.stars);
    result.innerHTML = `
      <div class="checkin-success">
        <div class="checkin-success-icon">✓</div>
        <strong class="checkin-title">打卡成功！</strong>
        <p class="checkin-detail">${subject} · ${record.nodeLabel} · ${record.questionsCompleted}题 · ${starIcons}</p>
        <p class="checkin-rewards muted">${subject}地块成长中 🌱，已保存学习记录</p>
      </div>
    `;
    textarea.value = "";
    window.MochiPet.renderMiniState();
    if (!document.body.classList.contains("focus-mode")) window.MochiFarm?.refreshFarmSummary?.();
    window.MochiCards?.refresh?.();
    toast(`${subject}地块成长中 🌱，已保存学习记录`);
    if (applied.cards.masteredNow) toast(`${record.nodeLabel} 已收进掌握档案！`);
  }

  function parsePastedRecord() {
    parsePastedRecordEl(
      document.getElementById("record-paste"),
      document.getElementById("upload-result")
    );
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function enterFocusMode() {
    document.body.classList.add("focus-mode");
    const overlay = document.getElementById("focus-overlay");
    if (!overlay) return;
    overlay.hidden = false;
    overlay.innerHTML = renderFocusOverlay();
    bindFocusOverlay(overlay);
  }

  function exitFocusMode() {
    if (!document.body.classList.contains("focus-mode")) return;
    document.body.classList.remove("focus-mode");
    const overlay = document.getElementById("focus-overlay");
    if (overlay) overlay.hidden = true;
    const viewEl = document.getElementById("view");
    if (viewEl && currentRoute() === "home") window.MochiFarm?.renderFarm?.(viewEl);
  }

  function getFocusEncouragement(mins) {
    if (mins < 5) return "短暂的开始也是开始，继续保持！";
    if (mins < 25) return "做得不错，专注力在慢慢提升！";
    if (mins < 50) return "这次专注力很棒！💪";
    return "这次真的很厉害，超长待机！🔥";
  }

  function renderFocusOverlay() {
    const timer = window.MochiTimer?.getState?.() || {};
    if (timer.phase === "deciding") {
      const actualMins = timer.pendingActualMins || 0;
      const restMins = timer.pendingRestMins || 5;
      return `
        <div class="focus-overlay-inner">
          <p class="focus-overlay-goal">🎉 你专注了 ${actualMins} 分钟</p>
          <p class="focus-overlay-encouragement">${getFocusEncouragement(actualMins)}</p>
          <div class="focus-deciding-card">
            <p class="focus-deciding-rest">建议休息 ${restMins} 分钟</p>
            <p class="focus-deciding-hint">让大脑充个电，效率会更高</p>
          </div>
          <div class="focus-overlay-actions">
            <button class="btn btn-primary focus-rest-btn" data-action="confirm-rest" type="button">
              <span class="material-symbols-outlined">self_improvement</span>
              开始休息 ${restMins} 分钟
            </button>
            <button class="btn btn-soft" data-action="keep-focusing" type="button">
              <span class="material-symbols-outlined">bolt</span>
              状态好，继续专注
            </button>
            <button class="btn btn-ghost btn-sm" data-action="end-today" type="button" style="color:rgba(255,255,255,0.35);margin-top:4px">
              结束今天的学习
            </button>
          </div>
        </div>
      `;
    }
    const focusMins = Math.max(1, Number(timer.focusMins || GAME_CONFIG.timer.defaultFocus || 25));
    const elapsedSecs = Number(timer.elapsedSecs || 0);
    const radius = 96;
    const circumference = 2 * Math.PI * radius;
    const progress = timer.freeMode ? 0 : Math.min(1, elapsedSecs / (focusMins * 60));
    const dashOffset = circumference * (1 - progress);
    const mins = String(Math.floor(elapsedSecs / 60)).padStart(2, "0");
    const secs = String(elapsedSecs % 60).padStart(2, "0");
    const overTime = !timer.freeMode && elapsedSecs >= focusMins * 60;
    return `
      <div class="focus-overlay-inner">
        <p class="focus-overlay-goal">${timer.microGoal ? `🎯 ${escapeHtml(timer.microGoal)}` : "专注中"}</p>
        <div class="focus-ring-wrap">
          <svg class="focus-ring" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r="${radius}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"></circle>
            ${timer.freeMode ? `
              <circle cx="110" cy="110" r="${radius}" fill="none" stroke="var(--primary)" stroke-width="8" stroke-linecap="round" opacity="0.75"></circle>
            ` : `
            <circle class="focus-ring-progress" cx="110" cy="110" r="${radius}" fill="none"
              stroke="${overTime ? "var(--tertiary)" : "var(--primary)"}" stroke-width="6"
              stroke-linecap="round"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${dashOffset}"
              transform="rotate(-90 110 110)"
              style="transition:stroke-dashoffset 1s linear"></circle>
            `}
          </svg>
          <div class="focus-time-display">
            <span class="focus-time">${mins}:${secs}</span>
            <span class="focus-status">${overTime ? "超额完成 🔥" : timer.freeMode ? "自由专注中" : "专注中"}</span>
          </div>
        </div>
        <div class="focus-overlay-actions">
          <button class="btn btn-primary focus-rest-btn" data-action="stop-and-rest" type="button">
            <span class="material-symbols-outlined">self_improvement</span>
            我累了，现在休息
          </button>
          <button class="btn btn-ghost btn-sm" data-action="give-up" type="button" style="color:rgba(255,255,255,0.35);margin-top:4px">
            放弃本轮
          </button>
        </div>
        <div class="focus-import-area">
          <button class="focus-import-toggle" data-action="toggle-focus-import" type="button">
            <span class="material-symbols-outlined">upload_file</span>
            做完一题，记录一下
          </button>
          <div class="focus-import-body" hidden>
            <textarea id="focus-record-paste" rows="2" placeholder="粘贴 MOCHI-RECORD 数据块"></textarea>
            <button class="btn btn-soft btn-sm" data-action="parse-focus-record" style="width:100%;margin-top:6px" type="button">导入</button>
            <div id="focus-upload-result" class="focus-upload-result"></div>
          </div>
        </div>
      </div>
    `;
  }

  function bindFocusOverlay(overlay) {
    overlay.onclick = (event) => {
      const button = event.target.closest("[data-action]");
      const action = button?.dataset.action;
      if (!action) return;
      event.preventDefault();
      event.stopPropagation();
      if (action === "stop-and-rest") {
        window.MochiTimer?.stopAndRest?.();
        return;
      }
      if (action === "confirm-rest") {
        window.MochiTimer?.confirmRest?.();
        return;
      }
      if (action === "keep-focusing") {
        window.MochiTimer?.keepFocusing?.();
        return;
      }
      if (action === "end-today") {
        window.MochiTimer?.endToday?.();
        return;
      }
      if (action === "give-up") {
        window.MochiTimer?.giveUp?.();
        return;
      }
      if (action === "toggle-focus-import") {
        const body = overlay.querySelector(".focus-import-body");
        if (body) body.hidden = !body.hidden;
        return;
      }
      if (action === "parse-focus-record") {
        parsePastedRecordEl(
          overlay.querySelector("#focus-record-paste"),
          overlay.querySelector("#focus-upload-result")
        );
      }
    };
  }

  function refreshFocusOverlay() {
    const overlay = document.getElementById("focus-overlay");
    if (!overlay || overlay.hidden) return;
    const importOpen = !overlay.querySelector(".focus-import-body")?.hidden;
    const importValue = overlay.querySelector("#focus-record-paste")?.value || "";
    overlay.innerHTML = renderFocusOverlay();
    const body = overlay.querySelector(".focus-import-body");
    const textarea = overlay.querySelector("#focus-record-paste");
    if (body && importOpen) body.hidden = false;
    if (textarea && importValue) textarea.value = importValue;
    bindFocusOverlay(overlay);
  }

  function tickFocusOverlay() {
    const overlay = document.getElementById("focus-overlay");
    if (!overlay || overlay.hidden) return;
    const timer = window.MochiTimer?.getState?.() || {};
    const timeEl = overlay.querySelector(".focus-time");
    if (timeEl) {
      const mins = String(Math.floor(Number(timer.elapsedSecs || 0) / 60)).padStart(2, "0");
      const secs = String(Number(timer.elapsedSecs || 0) % 60).padStart(2, "0");
      timeEl.textContent = `${mins}:${secs}`;
    }
    const ring = overlay.querySelector(".focus-ring-progress");
    if (ring && !timer.freeMode) {
      const radius = parseFloat(ring.getAttribute("r")) || 96;
      const circumference = 2 * Math.PI * radius;
      const focusMins = Math.max(1, Number(timer.focusMins || GAME_CONFIG.timer.defaultFocus || 25));
      const progress = Math.min(1, Number(timer.elapsedSecs || 0) / (focusMins * 60));
      const overTime = Number(timer.elapsedSecs || 0) >= focusMins * 60;
      ring.style.strokeDashoffset = String(circumference * (1 - progress));
      ring.style.stroke = overTime ? "var(--tertiary)" : "var(--primary)";
    }
    const statusEl = overlay.querySelector(".focus-status");
    if (statusEl) {
      const focusMins = Math.max(1, Number(timer.focusMins || GAME_CONFIG.timer.defaultFocus || 25));
      const overTime = !timer.freeMode && Number(timer.elapsedSecs || 0) >= focusMins * 60;
      statusEl.textContent = overTime ? "超额完成 🔥" : timer.freeMode ? "自由专注中" : "专注中";
    }
  }

  function readStorageJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function isRetiredStorageKey(key) {
    return key === "daily_task_settings"
      || key === "mochi_study_points"
      || key === "mochi_hearts"
      || key === "notif_rest_enabled"
      || key === "notif_focus_enabled"
      || key.startsWith("daily_tasks_");
  }

  function rawLocalStorageSnapshot() {
    return Object.fromEntries(Array.from({ length: localStorage.length }, (_, index) => {
      const key = localStorage.key(index);
      return key ? [key, localStorage.getItem(key)] : null;
    }).filter((entry) => entry && !isRetiredStorageKey(entry[0])));
  }

  function createBackupPayload() {
    const achievements = getUnlockedAchievements();
    const petState = readStorageJson("mochi_state", {});
    const raw = rawLocalStorageSnapshot();
    return {
      version: BACKUP_VERSION,
      exportDate: todayKey(),
      data: {
        study_log: readStorageJson(STUDY_LOG_KEY, []),
        farm_state: readStorageJson("farm_state", {}),
        pet_state: petState,
        achievements: {
          unlocked: achievements,
        },
        calendar_state: {
          focus_log: readStorageJson("focus_log", []),
          school_holidays: readStorageJson(HOLIDAYS_KEY, DEFAULT_HOLIDAYS),
          holiday_mode_override: readStorageJson(HOLIDAY_MODE_KEY, { mode: "auto" }),
        },
        localStorage: raw,
      },
    };
  }

  function exportData() {
    const payload = createBackupPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mochistudy-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("备份文件已导出");
  }

  function validateBackupPayload(payload) {
    if (!payload || typeof payload !== "object") return "备份文件格式不正确";
    if (!payload.version) return "备份文件缺少 version 字段";
    if (payload.version !== BACKUP_VERSION) return `备份版本 ${payload.version} 暂不兼容，当前支持 ${BACKUP_VERSION}`;
    if (!payload.data || typeof payload.data !== "object") return "备份文件缺少 data 字段";
    return "";
  }

  function restoreKnownBackupData(data) {
    localStorage.setItem(STUDY_LOG_KEY, JSON.stringify(Array.isArray(data.study_log) ? data.study_log : []));
    localStorage.setItem("farm_state", JSON.stringify(data.farm_state || {}));
    localStorage.setItem("mochi_state", JSON.stringify(data.pet_state || {}));
    const calendar = data.calendar_state || {};
    localStorage.setItem("focus_log", JSON.stringify(Array.isArray(calendar.focus_log) ? calendar.focus_log : []));
    localStorage.setItem(HOLIDAYS_KEY, JSON.stringify(calendar.school_holidays || DEFAULT_HOLIDAYS));
    localStorage.setItem(HOLIDAY_MODE_KEY, JSON.stringify(calendar.holiday_mode_override || { mode: "auto" }));
  }

  function restoreBackupPayload(payload) {
    localStorage.clear();
    const raw = payload.data.localStorage;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      Object.entries(raw).forEach(([key, value]) => {
        if (typeof key === "string" && !isRetiredStorageKey(key)) localStorage.setItem(key, String(value ?? ""));
      });
    } else {
      restoreKnownBackupData(payload.data);
    }
  }

  function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result));
        const error = validateBackupPayload(payload);
        if (error) {
          toast(error);
          return;
        }
        if (!confirm("导入后会覆盖当前所有数据，确认吗？")) return;
        restoreBackupPayload(payload);
        toast("备份已恢复，正在刷新页面");
        location.reload();
      } catch {
        toast("导入失败，请检查备份 JSON 文件");
      }
    };
    reader.readAsText(file);
  }

  function progressDataKeys() {
    const fixed = [STUDY_LOG_KEY, "focus_log", "farm_state", "mochi_state", "mochi_study_points", "mochi_hearts", "daily_task_settings"];
    const dynamic = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key) => key && key.startsWith("daily_tasks_"));
    return [...new Set([...fixed, ...dynamic])];
  }

  function clearProgressData() {
    if (!confirm("清空前建议先导出备份。此操作会删除学习记录、专注记录、农场进度和学习状态，无法撤销。确认继续吗？")) return;
    progressDataKeys().forEach((key) => localStorage.removeItem(key));
    toast("学习进度已清空，正在刷新页面");
    location.reload();
  }

  function factoryResetData() {
    if (!confirm("这会删除 MochiStudy 在当前浏览器里的全部数据和设置。请先导出备份。确认恢复出厂设置吗？")) return;
    allDataKeys().forEach((key) => localStorage.removeItem(key));
    toast("本地数据和设置已清空，正在刷新页面");
    location.reload();
  }

  function allDataKeys() {
    const fixed = ["mochi_state", "farm_state", STUDY_LOG_KEY, "focus_log", "api_config", HOLIDAYS_KEY, HOLIDAY_MODE_KEY, "mochi_debug_panel_open", "mochi_debug_float_collapsed", "mochi_debug_tab", "game_config", "sound_reminder_enabled", "focus_end_sound", "rest_reminder_sound"];
    const dynamic = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key) => key && isRetiredStorageKey(key));
    return [...new Set([...fixed, ...dynamic])];
  }

  function toggleDebugPanel(button) {
    const body = button.closest(".debug-card")?.querySelector(".debug-body");
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    localStorage.setItem("mochi_debug_panel_open", expanded ? "0" : "1");
    if (body) body.hidden = expanded;
  }

  function debugActiveTab() {
    return localStorage.getItem("mochi_debug_tab") || "state";
  }

  function debugStageShortcuts() {
    const stages = GAME_CONFIG.farm.growthStages;
    return [
      ["荒地", 0],
      ["种子", 1],
      ["发芽", Number(stages[1] ?? 3)],
      ["幼苗", Number(stages[2] ?? 6)],
      ["开花", Number(stages[3] ?? 10)],
      ["成熟", Number(GAME_CONFIG.farm.harvestTarget || 15)],
    ];
  }

  function configNumberInput(path, value, label = "") {
    return `<label class="debug-config-inline">${label ? `<span>${label}</span>` : ""}<input type="number" data-config-path="${path}" value="${value}" /></label>`;
  }

  function configRow(label, inputs) {
    return `
      <div class="debug-config-row">
        <span>${label}</span>
        <div class="debug-config-inputs">${inputs}</div>
        <button data-action="debug-save-config" type="button">保存</button>
        <em class="debug-config-saved" aria-live="polite"></em>
      </div>
    `;
  }

  function renderConfigPanel() {
    const cfg = GAME_CONFIG;
    return `
      <div class="debug-config-section">
        <h4>农场</h4>
        ${configRow("收获所需记录数", configNumberInput("farm.harvestTarget", cfg.farm.harvestTarget))}
        ${configRow("生长阶段下限", [0, 1, 2, 3, 4].map((index) => configNumberInput(`farm.growthStages.${index}`, cfg.farm.growthStages[index], `S${index}:`)).join(""))}
        ${configRow("农场升级收获次数", [1, 2, 3, 4].map((index) => configNumberInput(`farm.levelMinHarvests.${index}`, cfg.farm.levelMinHarvests[index], `Lv${index + 1}:`)).join(""))}
        ${configRow("收获XP奖励", configNumberInput("farm.harvestXP", cfg.farm.harvestXP))}
      </div>
      <div class="debug-config-section">
        <h4>番茄钟</h4>
        ${configRow("默认专注时长(分钟)", configNumberInput("timer.defaultFocus", cfg.timer.defaultFocus))}
        ${configRow("默认休息时长(分钟)", configNumberInput("timer.defaultRest", cfg.timer.defaultRest))}
      </div>
      <div class="debug-config-section">
        <h4>学习档案</h4>
        ${configRow("已掌握判断条数", configNumberInput("cards.masteredMinRecent", cfg.cards.masteredMinRecent))}
        ${configRow("好久没碰天数", configNumberInput("cards.dormantDays", cfg.cards.dormantDays))}
      </div>
      <div class="debug-config-section">
        <h4>导入记录奖励</h4>
        ${configRow("学习状态XP(每题)", configNumberInput("rewards.petXPPerQuestion", cfg.rewards.petXPPerQuestion))}
        ${configRow("农场XP(每题)", configNumberInput("rewards.farmXPPerQuestion", cfg.rewards.farmXPPerQuestion))}
      </div>
      <div class="debug-config-section">
        <h4>学习状态</h4>
        ${configRow("每日学习能量下降", configNumberInput("pet.dailyEnergyDecay", cfg.pet.dailyEnergyDecay))}
        ${configRow("每日专注状态下降", configNumberInput("pet.dailyFocusDecay", cfg.pet.dailyFocusDecay))}
        ${configRow("导入记录后学习能量奖励", configNumberInput("pet.studyEnergyBonus", cfg.pet.studyEnergyBonus))}
      </div>
      <div class="debug-config-section">
        <h4>日历热力图</h4>
        ${configRow("Lv1最低题数", configNumberInput("calendar.heatLevel1", cfg.calendar.heatLevel1))}
        ${configRow("Lv2最低题数", configNumberInput("calendar.heatLevel2", cfg.calendar.heatLevel2))}
        ${configRow("Lv3最低题数", configNumberInput("calendar.heatLevel3", cfg.calendar.heatLevel3))}
      </div>
      <button class="debug-reset-config" data-action="debug-reset-config" type="button">重置所有参数为默认值</button>
    `;
  }

  function renderDebugPanel() {
    const panel = document.getElementById("debug-panel-inner");
    if (!panel) return;
    const state = window.MochiFarm?.readState?.() || {};
    const subjects = [
      ["math", "数学"],
      ["physics", "物理"],
      ["chemistry", "化学"],
    ];
    const collapsed = localStorage.getItem("mochi_debug_float_collapsed") === "1";
    const activeTab = debugActiveTab();
    panel.innerHTML = `
      <div class="debug-float-head">
        <strong>调试</strong>
        <button class="debug-float-toggle" data-action="debug-toggle-float" type="button">${collapsed ? "展开" : "收起"}</button>
      </div>
      <div class="debug-float-body" ${collapsed ? "hidden" : ""}>
        <div class="debug-tabs">
          <button class="${activeTab === "state" ? "active" : ""}" data-action="debug-switch-tab" data-debug-tab="state" type="button">游戏状态</button>
          <button class="${activeTab === "config" ? "active" : ""}" data-action="debug-switch-tab" data-debug-tab="config" type="button">参数配置</button>
        </div>
        ${activeTab === "config" ? renderConfigPanel() : `
          ${subjects.map(([subject, label]) => `
            <div class="debug-float-row">
              <span>${label}</span>
              <strong>${state.plots?.[subject]?.recordCount || 0}</strong>
              <div class="debug-float-actions">
                ${debugStageShortcuts().map(([name, value]) => `
                  <button data-action="debug-set-record-count" data-subject="${subject}" data-value="${value}" type="button">${name}</button>
                `).join("")}
              </div>
            </div>
          `).join("")}
          <div class="debug-float-row debug-total-row">
            <span>收获</span>
            <strong>${state.totalHarvests || 0}</strong>
            <div class="debug-float-actions">
              <input type="number" min="0" value="${state.totalHarvests || 0}" data-debug-total-harvests />
              <button data-action="debug-set-total-harvests" type="button">保存</button>
            </div>
          </div>
        `}
      </div>
    `;
  }

  function debugRefreshFarm() {
    renderDebugPanel();
    window.MochiPet?.renderMiniState?.();
    const routeId = location.hash.replace("#", "") || "home";
    if (view && routeId === "home") window.MochiFarm?.renderFarm?.(view);
  }

  function debugSetRecordCount(subject, value) {
    const state = window.MochiFarm.readState();
    if (!state.plots?.[subject]) return;
    state.plots[subject].recordCount = Math.max(0, Number(value || 0));
    window.MochiFarm.saveState(state);
    debugRefreshFarm();
  }

  function debugSetTotalHarvests(button) {
    const input = button.closest(".debug-float-row")?.querySelector("[data-debug-total-harvests]");
    const state = window.MochiFarm.readState();
    state.totalHarvests = Math.max(0, Number(input?.value || 0));
    window.MochiFarm.saveState(state);
    debugRefreshFarm();
  }

  function saveDebugConfig(button) {
    const row = button.closest(".debug-config-row");
    if (!row) return;
    row.querySelectorAll("[data-config-path]").forEach((input) => {
      updateGameConfig(input.dataset.configPath, Number(input.value || 0));
    });
    const mark = row.querySelector(".debug-config-saved");
    if (mark) {
      mark.textContent = "✓";
      setTimeout(() => {
        if (mark.isConnected) mark.textContent = "";
      }, 1000);
    }
    window.MochiPet?.renderMiniState?.();
    const routeId = location.hash.replace("#", "") || "home";
    if (routeId === "home") window.MochiFarm?.renderFarm?.(view);
    if (routeId === "schedule") window.MochiCalendar?.renderSchedule?.(view);
    if (routeId === "map") window.MochiCards?.refresh?.();
  }

  function handleClick(event) {
    if (event.target === modalRoot) {
      closeModal();
      return;
    }
    const routeButton = event.target.closest("[data-route]");
    if (routeButton) {
      navigate(routeButton.dataset.route);
      return;
    }
    const action = event.target.closest("[data-action]");
    if (action) {
      const name = action.dataset.action;
      if (name === "parse-record") parsePastedRecord();
      if (name === "toggle-debug-panel") {
        toggleDebugPanel(action);
        return;
      }
      if (name === "debug-toggle-float") {
        const collapsed = localStorage.getItem("mochi_debug_float_collapsed") === "1";
        localStorage.setItem("mochi_debug_float_collapsed", collapsed ? "0" : "1");
        renderDebugPanel();
        return;
      }
      if (name === "debug-switch-tab") {
        localStorage.setItem("mochi_debug_tab", action.dataset.debugTab || "state");
        renderDebugPanel();
        return;
      }
      if (name === "debug-set-record-count") {
        debugSetRecordCount(action.dataset.subject, action.dataset.value);
        return;
      }
      if (name === "debug-set-total-harvests") {
        debugSetTotalHarvests(action);
        return;
      }
      if (name === "debug-save-config") {
        saveDebugConfig(action);
        return;
      }
      if (name === "debug-reset-config") {
        if (confirm("确定重置所有游戏参数为默认值吗？")) {
          localStorage.removeItem("game_config");
          location.reload();
        }
        return;
      }
      if (name === "copy-note" || name === "copy-upload-note") copyNote();
      if (name === "close-modal") closeModal();
      if (name === "start-focus") {
        window.MochiTimer?.handleAction?.("start-focus");
        return;
      }
      if (name === "pause-focus") {
        window.MochiTimer?.handleAction?.("pause-focus");
        return;
      }
      if (name === "stop-and-rest") {
        window.MochiTimer?.handleAction?.("stop-and-rest");
        return;
      }
      if (name === "give-up") {
        window.MochiTimer?.handleAction?.("give-up");
        return;
      }
      if (name === "start-node") {
        const node = window.MochiKnowledge.getNode(action.dataset.nodeId);
        toast(`打开 AI 家教开始学习：${node.subjectLabel} · ${node.label}`);
      }
      if (name === "export-data") exportData();
      if (name === "clear-progress") clearProgressData();
      if (name === "factory-reset" || name === "clear-data") factoryResetData();
      if (name === "open-holiday-form") openHolidayForm();
      if (name === "delete-holiday") deleteHoliday(action.dataset.holidayId);
      if (name === "set-holiday-mode") setHolidayMode(action.dataset.mode || "auto");
      if (name === "day-detail" || name === "day-summary") {
        const logs = readStudyLogs().filter((log) => log.date.slice(0, 10) === action.dataset.date);
        window.MochiCalendar.renderDayModal(action.dataset.date, logs, name === "day-detail" ? "detail" : "summary");
      }
      return;
    }
    const node = event.target.closest("[data-node-id]");
    if (node) {
      window.MochiKnowledge.renderDetail(node.dataset.nodeId);
      return;
    }
    const month = event.target.closest("[data-month]");
    if (month) {
      window.MochiCalendar.shiftMonth(month.dataset.month);
      route("schedule");
      return;
    }
    const day = event.target.closest("[data-date]");
    if (day) {
      window.MochiCalendar.openDaySummary(day.dataset.date);
      return;
    }
  }

  function copyNote() {
    const text = document.querySelector(".note-output")?.textContent || document.querySelector(".upload-note")?.textContent || "";
    navigator.clipboard?.writeText(text).then(
      () => toast("已复制！粘贴到 Obsidian 即可保存。"),
      () => toast("复制失败，请手动选择文本。")
    );
  }

  function handleSubmit(event) {
    if (event.target.id === "api-form") {
      event.preventDefault();
      window.MochiAI.saveConfig(Object.fromEntries(new FormData(event.target)));
      toast("AI 配置已保存");
    }
    if (event.target.id === "holiday-form") {
      event.preventDefault();
      const form = Object.fromEntries(new FormData(event.target));
      const holidays = getHolidays();
      holidays.push({
        id: `h_${Date.now()}`,
        label: form.label,
        start: form.start,
        end: form.end,
      });
      saveHolidays(holidays.sort((a, b) => a.start.localeCompare(b.start)));
      closeModal();
      toast("假期已添加");
      route("settings");
    }
  }

  function openHolidayForm() {
    modal(`
      <div class="modal-head">
        <div><h2>添加假期</h2><p class="muted">设置后，系统会按假期范围决定是否进入冬眠模式。</p></div>
        <button class="icon-btn" data-action="close-modal"><span class="material-symbols-outlined">close</span></button>
      </div>
      <form id="holiday-form" class="form-grid">
        <div class="field"><label>假期名称</label><input name="label" required placeholder="例如：2026暑假" /></div>
        <div class="field"><label>开始日期</label><input name="start" type="date" required /></div>
        <div class="field"><label>结束日期</label><input name="end" type="date" required /></div>
        <button class="btn btn-primary" type="submit">确认添加</button>
      </form>
    `);
  }

  function deleteHoliday(id) {
    saveHolidays(getHolidays().filter((holiday) => holiday.id !== id));
    toast("假期已删除");
    route("settings");
  }

  function handleChange(event) {
    if (event.target.id === "backup-import") importData(event.target.files?.[0]);
    if (event.target.id === "focus-end-sound-select") {
      localStorage.setItem("focus_end_sound", event.target.value || "soft");
      playFocusEndSound(event.target.value || "soft");
    }
    if (event.target.id === "rest-reminder-sound-select") {
      localStorage.setItem("rest_reminder_sound", event.target.value || "melody");
      playRestReminderSound(event.target.value || "melody");
    }
  }

  function init() {
    window.MochiKnowledge.readState();
    window.MochiPet.renderMiniState();
    window.addEventListener("hashchange", () => route());
    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("change", handleChange);
    document.getElementById("mobile-menu")?.addEventListener("click", () => document.querySelector(".side-nav")?.classList.toggle("open"));
    route();
    if (location.search.includes("debug=1")) {
      const debugPanel = document.getElementById("debug-panel");
      if (debugPanel) debugPanel.style.display = "block";
      renderDebugPanel();
    }
  }

  window.MochiApp = {
    GAME_CONFIG,
    GAME_CONFIG_DEFAULTS,
    route,
    navigate,
    modal,
    closeModal,
    toast,
    playChime,
    playDing,
    playFocusEndSound,
    playReminderMelody,
    playRestReminderSound,
    startRestReminder,
    stopRestReminder,
    sparkle,
    renderDailyTasks,
    getDailyTaskState: dailyTasks,
    taskCompletionRate,
    enterFocusMode,
    exitFocusMode,
    refreshFocusOverlay,
    tickFocusOverlay,
    parsePastedRecordEl,
    readStudyLogs,
    writeStudyLogs,
    parseMochiRecord,
    readJson,
    writeJson,
    getHolidays,
    isHolidayToday,
    nextHoliday,
    daysUntilNextHoliday,
    holidayMode,
    setHolidayMode,
    getUnlockedAchievements,
    calcAchievementMetrics,
  };

  init();
})();
