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
    season: {
      titleThresholds: [0, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78, 91, 105, 120, 140],
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

  function loadAdminConfig() {
    return GAME_CONFIG;
  }

  const ACHIEVEMENT_CONFIG_DEFAULTS = {
    small: {
      focusHours: 2,
      studyDays: 3,
      recordCount: 10,
      balancedWeeks: 1,
      harvests: 3,
    },
    big: {
      nodeRecords: 20,
      totalRecords: 50,
      focusHours: 10,
      farmLevelStep: 3,
      studyDays: 20,
    },
    lottery: {
      smallPerDraw: 5,
      bigPerDraw: 1,
    },
  };
  const LOTTERY_CONFIG_DEFAULTS = {
    items: [
      { id: 1, label: "妈妈做一顿好吃的", type: "reward", weight: 15, color: "#f5c518" },
      { id: 2, label: "买一个喜欢的文具", type: "reward", weight: 15, color: "#f5c518" },
      { id: 3, label: "看一集喜欢的综艺", type: "reward", weight: 10, color: "#50b070" },
      { id: 4, label: "和朋友出去玩一下午", type: "bigReward", weight: 5, color: "#e07020" },
      { id: 5, label: "买一本喜欢的书", type: "reward", weight: 10, color: "#f5c518" },
      { id: 6, label: "今天可以晚睡1小时", type: "reward", weight: 10, color: "#50b070" },
      { id: 7, label: "抄写课文一篇", type: "punish", weight: 10, color: "#9c27b0" },
      { id: 8, label: "做30个深蹲", type: "punish", weight: 10, color: "#9c27b0" },
      { id: 9, label: "给妈妈洗碗三天", type: "punish", weight: 10, color: "#9c27b0" },
      { id: 10, label: "早起背10个单词", type: "punish", weight: 5, color: "#2196f3" },
    ],
  };
  const view = document.getElementById("view");
  const modalRoot = document.getElementById("modal-root");
  const toastRoot = document.getElementById("toast-root");
  const STUDY_LOG_KEY = "study_log";
  const HOLIDAYS_KEY = "school_holidays";
  const HOLIDAY_MODE_KEY = "holiday_mode_override";
  const CURRENT_SEASON_KEY = "current_season";
  const SEASON_ARCHIVES_KEY = "season_archives";
  const CARD_ORDER_KEY = "card_order";
  const CARD_META_KEY = "study_card_meta";
  const NODE_SUMMARY_KEY = "study_node_summary";
  const READING_FONT_KEY = "study_reading_font";
  const READING_SIZE_KEY = "study_reading_size";
  const BACKUP_VERSION = "1.0";
  const READING_FONT_OPTIONS = [
    {
      value: "soft-sans",
      label: "暖圆清爽",
      hint: "中文大方、边角柔和，适合日常复习。",
      css: "\"Microsoft YaHei UI\", \"Microsoft YaHei\", \"PingFang SC\", \"Hiragino Sans GB\", \"Noto Sans SC\", sans-serif",
    },
    {
      value: "modern-sans",
      label: "现代阅读",
      hint: "更像新系统字体，干净、开阔。",
      css: "\"MiSans\", \"HarmonyOS Sans SC\", \"OPPO Sans\", \"PingFang SC\", \"Microsoft YaHei UI\", sans-serif",
    },
    {
      value: "cute-kai",
      label: "文楷可爱",
      hint: "有一点手写感，中文更亲切。",
      css: "\"LXGW WenKai Screen\", \"LXGW WenKai\", \"Kaiti SC\", \"KaiTi\", \"STKaiti\", \"Microsoft YaHei UI\", sans-serif",
    },
    {
      value: "code-reading",
      label: "代码阅读",
      hint: "等宽、结构清楚，公式和符号更有秩序。",
      css: "\"Maple Mono SC NF\", \"Maple Mono SC\", \"Sarasa Mono SC\", \"Cascadia Code\", \"JetBrains Mono\", \"Microsoft YaHei UI\", monospace",
    },
  ];
  const READING_SIZE_OPTIONS = [
    { value: "normal", label: "标准", scale: 1 },
    { value: "comfortable", label: "舒适", scale: 1.08 },
    { value: "large", label: "大字", scale: 1.18 },
    { value: "extra-large", label: "超大", scale: 1.3 },
  ];
  const MOCHI_RECORD_FIELDS = [
    "科目",
    "知识点",
    "完成题数",
    "掌握星级",
    "卡点记录",
    "原题",
    "今日套路",
    "学习日期",
    "学习来源",
    "复习结果",
    "错误类型",
    "卡住步骤",
    "关键突破",
    "题型标签",
    "信心分",
    "耗时分钟",
    "关联记录",
  ];
  const SEASON_TITLES = [
    { level: 1, label: "癞蛤蟆" },
    { level: 2, label: "咸鱼王" },
    { level: 3, label: "学困生本人" },
    { level: 4, label: "边缘人" },
    { level: 5, label: "普通人" },
    { level: 6, label: "小镇做题家" },
    { level: 7, label: "卷王预备役" },
    { level: 8, label: "隐藏大佬" },
    { level: 9, label: "学神候选" },
    { level: 10, label: "小镇答题王" },
    { level: 11, label: "省状元" },
    { level: 12, label: "学阀" },
    { level: 13, label: "武则天" },
    { level: 14, label: "始皇帝" },
    { level: 15, label: "宇宙第一卷王" },
    { level: 16, label: "高考之神" },
  ];
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
  let adminCalendarCursor = new Date();

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

  function readingFontOption(value) {
    return READING_FONT_OPTIONS.find((option) => option.value === value) || READING_FONT_OPTIONS[0];
  }

  function readingSizeOption(value) {
    return READING_SIZE_OPTIONS.find((option) => option.value === value) || READING_SIZE_OPTIONS[1];
  }

  function readReadingPreferences() {
    return {
      font: readingFontOption(localStorage.getItem(READING_FONT_KEY) || "soft-sans"),
      size: readingSizeOption(localStorage.getItem(READING_SIZE_KEY) || "comfortable"),
    };
  }

  function applyReadingPreferences(preferences = readReadingPreferences()) {
    const root = document.documentElement;
    const scale = preferences.size.scale;
    root.style.setProperty("--study-reading-font", preferences.font.css);
    root.style.setProperty("--study-reading-scale", String(scale));
    root.style.setProperty("--study-reading-13", `${Math.round(13 * scale)}px`);
    root.style.setProperty("--study-reading-16", `${Math.round(16 * scale)}px`);
    root.style.setProperty("--study-reading-17", `${Math.round(17 * scale)}px`);
    root.style.setProperty("--study-reading-18", `${Math.round(18 * scale)}px`);
    root.style.setProperty("--study-reading-math", `${(1.08 * scale).toFixed(2)}em`);
    root.dataset.studyReadingFont = preferences.font.value;
    root.dataset.studyReadingSize = preferences.size.value;
  }

  function readingOptionTags(options, selectedValue) {
    return options.map((option) => (
      `<option value="${escapeHtml(option.value)}" ${option.value === selectedValue ? "selected" : ""}>${escapeHtml(option.label)}</option>`
    )).join("");
  }

  function updateReadingPreview(root = document) {
    const preview = root.querySelector?.("[data-reading-preview]");
    if (!preview) return;
    const preferences = readReadingPreferences();
    preview.style.fontFamily = preferences.font.css;
    preview.style.fontSize = `${Math.round(16 * preferences.size.scale)}px`;
    const label = preview.querySelector("[data-reading-current]");
    if (label) label.textContent = `${preferences.font.label} · ${preferences.size.label}`;
    const hint = preview.querySelector("[data-reading-hint]");
    if (hint) hint.textContent = preferences.font.hint;
  }

  function setReadingPreference(key, value) {
    if (key === "font") localStorage.setItem(READING_FONT_KEY, readingFontOption(value).value);
    if (key === "size") localStorage.setItem(READING_SIZE_KEY, readingSizeOption(value).value);
    applyReadingPreferences();
    updateReadingPreview(document);
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
    return Array.isArray(logs)
      ? logs
        .map((log) => ({ ...log, originalQuestion: String(log.originalQuestion || "") }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      : [];
  }

  function writeStudyLogs(logs) {
    writeJson(STUDY_LOG_KEY, logs);
  }

  function readStudyCardMeta() {
    const meta = readJson(CARD_META_KEY, {});
    return meta && typeof meta === "object" && !Array.isArray(meta) ? meta : {};
  }

  function writeStudyCardMeta(meta) {
    writeJson(CARD_META_KEY, meta && typeof meta === "object" && !Array.isArray(meta) ? meta : {});
  }

  function hasMeaningfulCardMeta(meta) {
    if (!meta || typeof meta !== "object") return false;
    return Boolean(
      (meta.source && meta.source !== "lesson") ||
      meta.reviewResult ||
      meta.errorType ||
      meta.stuckStep ||
      meta.keyInsight ||
      (Array.isArray(meta.tags) && meta.tags.length) ||
      meta.confidence ||
      meta.timeSpentMinutes ||
      (Array.isArray(meta.sourceRecordIds) && meta.sourceRecordIds.length)
    );
  }

  function setStudyCardMeta(logId, meta) {
    if (!logId) return;
    const allMeta = readStudyCardMeta();
    const next = normalizeCardMeta(meta || {});
    if (hasMeaningfulCardMeta(next)) allMeta[logId] = next;
    else delete allMeta[logId];
    writeStudyCardMeta(allMeta);
  }

  function removeStudyCardMeta(logId) {
    if (!logId) return;
    const allMeta = readStudyCardMeta();
    delete allMeta[logId];
    writeStudyCardMeta(allMeta);
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

  function getWeekKey(dateValue) {
    return weekStartKey(new Date(`${String(dateValue || todayKey()).slice(0, 10)}T12:00:00`));
  }

  function parseDateAtNoon(dateValue) {
    return new Date(`${String(dateValue || todayKey()).slice(0, 10)}T12:00:00`);
  }

  function dateKeyFromDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function dateDiffDays(startDate, endDate) {
    return Math.round((parseDateAtNoon(endDate) - parseDateAtNoon(startDate)) / 86400000);
  }

  function dateInRange(date, startDate, endDate) {
    const value = String(date || "").slice(0, 10);
    return value && value >= startDate && value <= endDate;
  }

  function loadCurrentSeason() {
    const season = readJson(CURRENT_SEASON_KEY, null);
    return season && typeof season === "object" ? season : null;
  }

  function saveCurrentSeason(season) {
    if (!season) localStorage.removeItem(CURRENT_SEASON_KEY);
    else writeJson(CURRENT_SEASON_KEY, season);
  }

  function loadSeasonArchives() {
    const archives = readJson(SEASON_ARCHIVES_KEY, []);
    return Array.isArray(archives) ? archives.sort((a, b) => String(b.endDate || "").localeCompare(String(a.endDate || ""))) : [];
  }

  function saveSeasonArchives(archives) {
    writeJson(SEASON_ARCHIVES_KEY, Array.isArray(archives) ? archives : []);
  }

  function nextSeasonId(current = loadCurrentSeason(), archives = loadSeasonArchives()) {
    const ids = [...archives, current].filter(Boolean).map((season) => String(season.id || ""));
    const maxNum = ids.reduce((max, id) => Math.max(max, Number(id.replace(/^S/i, "")) || 0), 0);
    return `S${maxNum + 1}`;
  }

  function calcSeasonTitle(recordCount, cfg = loadAdminConfig()) {
    const thresholds = Array.isArray(cfg?.season?.titleThresholds) && cfg.season.titleThresholds.length
      ? cfg.season.titleThresholds
      : GAME_CONFIG_DEFAULTS.season.titleThresholds;
    let level = 1;
    for (let i = thresholds.length - 1; i >= 0; i -= 1) {
      if (Number(recordCount || 0) >= Number(thresholds[i] || 0)) {
        level = i + 1;
        break;
      }
    }
    return SEASON_TITLES[Math.min(level, SEASON_TITLES.length) - 1] || SEASON_TITLES[0];
  }

  function logsForSeason(season) {
    if (!season?.startDate || !season?.endDate) return [];
    return readStudyLogs().filter((log) => dateInRange(log.date, season.startDate, season.endDate));
  }

  function focusLogsForSeason(season) {
    if (!season?.startDate || !season?.endDate) return [];
    return readFocusLogs().filter((log) => dateInRange(log.date, season.startDate, season.endDate));
  }

  function emptySubjectCounts() {
    return { math: 0, physics: 0, chemistry: 0 };
  }

  function countBySubject(logs) {
    return logs.reduce((counts, log) => {
      if (counts[log.subject] !== undefined) counts[log.subject] += 1;
      return counts;
    }, emptySubjectCounts());
  }

  function coveredNodesBySubject(logs) {
    const sets = { math: new Set(), physics: new Set(), chemistry: new Set() };
    logs.forEach((log) => {
      if (sets[log.subject] && log.nodeLabel) sets[log.subject].add(log.nodeLabel);
    });
    return {
      math: sets.math.size,
      physics: sets.physics.size,
      chemistry: sets.chemistry.size,
    };
  }

  function dailyRecordsForSeason(logs, startDate, endDate) {
    const counts = {};
    const cursor = parseDateAtNoon(startDate);
    const end = parseDateAtNoon(endDate);
    while (cursor <= end) {
      counts[dateKeyFromDate(cursor)] = 0;
      cursor.setDate(cursor.getDate() + 1);
    }
    logs.forEach((log) => {
      const date = String(log.date || "").slice(0, 10);
      if (date) counts[date] = (counts[date] || 0) + 1;
    });
    return counts;
  }

  function weeklyRecordsForSeason(logs, focusLogs) {
    const weekMap = {};
    logs.forEach((log) => {
      const week = getWeekKey(log.date);
      if (!weekMap[week]) weekMap[week] = { week, records: 0, focusMinutes: 0 };
      weekMap[week].records += 1;
    });
    focusLogs.forEach((log) => {
      const week = getWeekKey(log.date);
      if (!weekMap[week]) weekMap[week] = { week, records: 0, focusMinutes: 0 };
      weekMap[week].focusMinutes += Number(log.duration || 0);
    });
    return Object.values(weekMap).sort((a, b) => a.week.localeCompare(b.week));
  }

  function buildSeasonSnapshot(season, logs = logsForSeason(season), focusLogs = focusLogsForSeason(season), cfg = loadAdminConfig()) {
    const subjectRecords = countBySubject(logs);
    const totalRecords = logs.length;
    const focusOnly = focusLogs.filter((log) => (!log.type || log.type === "focus") && log.completed !== false);
    const totalFocusMinutes = focusOnly.reduce((sum, log) => sum + Number(log.duration || 0), 0);
    const validStudyDays = [...new Set(logs.map((log) => String(log.date || "").slice(0, 10)).filter(Boolean))]
      .filter((date) => isHolidayToday(date)).length;
    const farmState = window.MochiFarm?.readState?.() || {};
    const farmHarvests = Number(farmState.totalHarvests || 0);
    const farmLevel = window.MochiFarm?.getFarmLevel?.(farmHarvests)?.level || 1;
    const achievements = loadAchievementState();
    const avgRecords = Math.round(totalRecords / 3);
    return {
      totalRecords,
      totalFocusMinutes,
      validStudyDays,
      subjectRecords,
      coveredNodes: coveredNodesBySubject(logs),
      totalSmallBadges: Number(achievements.totalSmall || 0),
      totalBigBadges: Number(achievements.totalBig || 0),
      farmHarvests,
      farmLevel,
      dailyRecords: dailyRecordsForSeason(logs, season.startDate, season.endDate),
      weeklyRecords: weeklyRecordsForSeason(logs, focusOnly),
      titles: {
        math: calcSeasonTitle(subjectRecords.math, cfg),
        physics: calcSeasonTitle(subjectRecords.physics, cfg),
        chemistry: calcSeasonTitle(subjectRecords.chemistry, cfg),
        overall: calcSeasonTitle(avgRecords, cfg),
      },
    };
  }

  function calcBalancedWeeks(studyLogs) {
    const weekMap = {};
    studyLogs.forEach((log) => {
      const date = String(log.date || "").slice(0, 10);
      if (!date) return;
      const weekKey = getWeekKey(date);
      weekMap[weekKey] = weekMap[weekKey] || new Set();
      weekMap[weekKey].add(log.subject);
    });
    return Object.values(weekMap).filter((subjects) => subjects.size >= 3).length;
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

  function calcStudyStreak() {
    const logs = readStudyLogs();
    const studiedDates = new Set(
      logs.map((log) => String(log.date || "").slice(0, 10)).filter(Boolean)
    );
    const today = todayKey();
    const cursor = new Date(`${today}T12:00:00`);
    let streak = 0;
    for (let i = 0; i < 365; i += 1) {
      const dateKey = cursor.toISOString().slice(0, 10);
      if (isHolidayToday(dateKey)) {
        if (studiedDates.has(dateKey)) {
          streak += 1;
        } else if (dateKey !== today) {
          break;
        }
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function getTodayRecordCount() {
    const today = todayKey();
    return readStudyLogs().filter((log) => String(log.importedAt || log.date || "").slice(0, 10) === today).length;
  }

  function loadAchievementConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem("achievement_config") || "{}");
      return deepMerge(ACHIEVEMENT_CONFIG_DEFAULTS, saved);
    } catch {
      return deepMerge(ACHIEVEMENT_CONFIG_DEFAULTS, {});
    }
  }

  function saveAchievementConfig(config) {
    localStorage.setItem("achievement_config", JSON.stringify(config));
  }

  function updateAchievementConfig(path, value) {
    const config = loadAchievementConfig();
    setByPath(config, path, value);
    saveAchievementConfig(config);
    return config;
  }

  function defaultAchievementState() {
    return {
      small: { focusHours: 0, studyDays: 0, recordCount: 0, balancedWeeks: 0, harvests: 0 },
      big: { totalRecords: 0, focusHours: 0, farmLevel: 0, studyDays: 0, nodeRecords: 0 },
      totalSmall: 0,
      totalBig: 0,
      lotteryTickets: 0,
      usedLotteryCount: 0,
      carriedLotteryDraws: 0,
    };
  }

  function loadAchievementState() {
    const saved = readJson("achievement_state", {});
    const base = defaultAchievementState();
    return {
      ...base,
      ...(saved || {}),
      small: { ...base.small, ...(saved?.small || {}) },
      big: { ...base.big, ...(saved?.big || {}) },
      recentNew: {
        small: { ...(saved?.recentNew?.small || {}) },
        big: { ...(saved?.recentNew?.big || {}) },
      },
      totalSmall: Number(saved?.totalSmall || 0),
      totalBig: Number(saved?.totalBig || 0),
      lotteryTickets: Number(saved?.lotteryTickets || 0),
      usedLotteryCount: Number(saved?.usedLotteryCount || 0),
      carriedLotteryDraws: Number(saved?.carriedLotteryDraws || 0),
    };
  }

  function saveAchievementState(state) {
    writeJson("achievement_state", state);
    return state;
  }

  function readFocusLogs() {
    const focusLogs = readJson("focus_log", []);
    return Array.isArray(focusLogs) ? focusLogs : [];
  }

  function safeThreshold(value) {
    return Math.max(1, Number(value || 1));
  }

  function calcNodeRecordBadges(logs, threshold) {
    const nodeCounts = {};
    logs.forEach((log) => {
      const key = `${log.subject}:${log.nodeLabel}`;
      nodeCounts[key] = (nodeCounts[key] || 0) + 1;
    });
    return Object.values(nodeCounts).reduce((sum, count) => sum + Math.floor(count / safeThreshold(threshold)), 0);
  }

  function buildAchievementProgress(cfg = loadAchievementConfig()) {
    const logs = readStudyLogs();
    const farmState = window.MochiFarm?.readState?.() || {};
    const farmLevel = window.MochiFarm?.getFarmLevel?.(farmState.totalHarvests || 0)?.level || 1;
    const focusLogs = readFocusLogs().filter((log) => log.type === "focus" && log.completed);
    const validDays = [...new Set(logs.map((log) => String(log.date || "").slice(0, 10)).filter(Boolean))]
      .filter((date) => {
        const day = new Date(`${date}T12:00:00`).getDay();
        if (day === 0 || day === 6) return true;
        return getHolidays().some((h) => date >= h.start && date <= h.end);
      });
    const focusHours = focusLogs.reduce((sum, log) => sum + Number(log.duration || 0), 0) / 60;
    const nodeCounts = {};
    logs.forEach((log) => {
      if (!log.nodeLabel) return;
      const key = `${log.subject}:${log.nodeLabel}`;
      nodeCounts[key] = (nodeCounts[key] || 0) + 1;
    });
    const maxNodeRecords = Math.max(0, ...Object.values(nodeCounts));
    const nodeBadgeCount = calcNodeRecordBadges(logs, cfg.big.nodeRecords);

    return {
      small: {
        focusHours: {
          value: focusHours,
          threshold: safeThreshold(cfg.small.focusHours),
          unit: "小时",
          condition: `累计专注每满 ${safeThreshold(cfg.small.focusHours)} 小时，获得 1 枚小勋章。`,
          current: `${formatProgressNumber(focusHours)} 小时专注。`,
        },
        studyDays: {
          value: validDays.length,
          threshold: safeThreshold(cfg.small.studyDays),
          unit: "天",
          condition: `有效学习日每满 ${safeThreshold(cfg.small.studyDays)} 天，获得 1 枚小勋章。`,
          current: `${validDays.length} 个有效学习日。`,
        },
        recordCount: {
          value: logs.length,
          threshold: safeThreshold(cfg.small.recordCount),
          unit: "条",
          condition: `学习记录每满 ${safeThreshold(cfg.small.recordCount)} 条，获得 1 枚小勋章。`,
          current: `${logs.length} 条学习记录。`,
        },
        balancedWeeks: {
          value: calcBalancedWeeks(logs),
          threshold: safeThreshold(cfg.small.balancedWeeks),
          unit: "周",
          condition: `三科都留下记录的均衡周每满 ${safeThreshold(cfg.small.balancedWeeks)} 周，获得 1 枚小勋章。`,
          current: `${calcBalancedWeeks(logs)} 个均衡周。`,
        },
        harvests: {
          value: Number(farmState.totalHarvests || 0),
          threshold: safeThreshold(cfg.small.harvests),
          unit: "次",
          condition: `农场收获每满 ${safeThreshold(cfg.small.harvests)} 次，获得 1 枚小勋章。`,
          current: `收获 ${Number(farmState.totalHarvests || 0)} 次。`,
        },
      },
      big: {
        nodeRecords: {
          value: nodeBadgeCount,
          threshold: safeThreshold(cfg.big.nodeRecords),
          unit: "条",
          condition: `同一个知识点每累计 ${safeThreshold(cfg.big.nodeRecords)} 条学习记录，获得 1 枚大勋章；多个知识点会分别计算。`,
          current: `最高单点 ${maxNodeRecords} 条，已按此规则累计 ${nodeBadgeCount} 枚。`,
          usesEarnedValue: true,
        },
        totalRecords: {
          value: logs.length,
          threshold: safeThreshold(cfg.big.totalRecords),
          unit: "条",
          condition: `总学习记录每满 ${safeThreshold(cfg.big.totalRecords)} 条，获得 1 枚大勋章。`,
          current: `${logs.length} 条学习记录。`,
        },
        focusHours: {
          value: focusHours,
          threshold: safeThreshold(cfg.big.focusHours),
          unit: "小时",
          condition: `累计专注每满 ${safeThreshold(cfg.big.focusHours)} 小时，获得 1 枚大勋章。`,
          current: `${formatProgressNumber(focusHours)} 小时专注。`,
        },
        farmLevel: {
          value: Math.max(0, Math.max(1, farmLevel) - 1),
          threshold: safeThreshold(cfg.big.farmLevelStep),
          unit: "级",
          condition: `农场从 Lv.1 之后每提升 ${safeThreshold(cfg.big.farmLevelStep)} 级，获得 1 枚大勋章。`,
          current: `农场 Lv.${farmLevel}，已累计提升 ${Math.max(0, Math.max(1, farmLevel) - 1)} 级。`,
        },
        studyDays: {
          value: validDays.length,
          threshold: safeThreshold(cfg.big.studyDays),
          unit: "天",
          condition: `有效学习日每满 ${safeThreshold(cfg.big.studyDays)} 天，获得 1 枚大勋章。`,
          current: `${validDays.length} 个有效学习日。`,
        },
      },
    };
  }

  function formatProgressNumber(value) {
    const num = Number(value || 0);
    return Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, "");
  }

  function achievementCountFromProgress(item) {
    if (item?.usesEarnedValue) return Math.floor(Number(item.value || 0));
    return Math.floor(Number(item?.value || 0) / safeThreshold(item?.threshold));
  }

  function achievementNextHint(item) {
    if (!item) return "";
    if (item.usesEarnedValue) return `任一知识点达到下一个 ${item.threshold} ${item.unit}倍数即可获得下一枚。`;
    const threshold = safeThreshold(item.threshold);
    const value = Number(item.value || 0);
    const remainder = value % threshold;
    const remaining = remainder === 0 && value > 0 ? threshold : threshold - remainder;
    const remainingText = item.unit === "小时" ? formatProgressNumber(remaining) : Math.ceil(remaining);
    return `距离下一枚还差 ${remainingText} ${item.unit}。`;
  }

  function calcAchievements() {
    const progress = buildAchievementProgress(loadAchievementConfig());

    return {
      small: {
        focusHours: achievementCountFromProgress(progress.small.focusHours),
        studyDays: achievementCountFromProgress(progress.small.studyDays),
        recordCount: achievementCountFromProgress(progress.small.recordCount),
        balancedWeeks: achievementCountFromProgress(progress.small.balancedWeeks),
        harvests: achievementCountFromProgress(progress.small.harvests),
      },
      big: {
        nodeRecords: achievementCountFromProgress(progress.big.nodeRecords),
        totalRecords: achievementCountFromProgress(progress.big.totalRecords),
        focusHours: achievementCountFromProgress(progress.big.focusHours),
        farmLevel: achievementCountFromProgress(progress.big.farmLevel),
        studyDays: achievementCountFromProgress(progress.big.studyDays),
      },
    };
  }

  function recalcLotteryTickets(state, cfg = loadAchievementConfig()) {
    const earnedFromSmall = Math.floor(Number(state.totalSmall || 0) / safeThreshold(cfg.lottery.smallPerDraw));
    const earnedFromBig = Math.floor(Number(state.totalBig || 0) / safeThreshold(cfg.lottery.bigPerDraw));
    state.lotteryTickets = Math.max(0, Number(state.carriedLotteryDraws || 0) + earnedFromSmall + earnedFromBig - Number(state.usedLotteryCount || 0));
    return state;
  }

  function checkAndGrantAchievements() {
    const cfg = loadAchievementConfig();
    const earned = calcAchievements();
    const state = loadAchievementState();
    const newBadges = [];
    const recentNew = { small: {}, big: {} };

    Object.entries(earned.small).forEach(([key, total]) => {
      const already = Number(state.small[key] || 0);
      const newCount = total - already;
      if (newCount > 0) {
        state.small[key] = total;
        state.totalSmall = Number(state.totalSmall || 0) + newCount;
        recentNew.small[key] = newCount;
        newBadges.push({ type: "small", key, count: newCount });
      }
    });

    Object.entries(earned.big).forEach(([key, total]) => {
      const already = Number(state.big[key] || 0);
      const newCount = total - already;
      if (newCount > 0) {
        state.big[key] = total;
        state.totalBig = Number(state.totalBig || 0) + newCount;
        recentNew.big[key] = newCount;
        newBadges.push({ type: "big", key, count: newCount });
      }
    });

    if (newBadges.length > 0) state.recentNew = recentNew;
    recalcLotteryTickets(state, cfg);
    saveAchievementState(state);

    if (newBadges.length > 0) {
      const smallCount = newBadges.filter((badge) => badge.type === "small").reduce((sum, badge) => sum + badge.count, 0);
      const bigCount = newBadges.filter((badge) => badge.type === "big").reduce((sum, badge) => sum + badge.count, 0);
      let message = "";
      if (bigCount > 0) message += `获得大勋章 x${bigCount}！`;
      if (smallCount > 0) message += `${message ? " " : ""}获得小勋章 x${smallCount}！`;
      if (state.lotteryTickets > 0) message += ` 当前可抽奖 ${state.lotteryTickets} 次`;
      toast(message);
    }

    updateNavBadge();
    return newBadges;
  }

  function getUnlockedAchievements() {
    return calcAchievements();
  }

  function loadLotteryConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem("lottery_config") || "{}");
      const items = Array.isArray(saved.items) ? saved.items.filter((item) => Number(item.weight || 0) > 0) : [];
      return items.length ? { items } : { items: LOTTERY_CONFIG_DEFAULTS.items.map((item) => ({ ...item })) };
    } catch {
      return { items: LOTTERY_CONFIG_DEFAULTS.items.map((item) => ({ ...item })) };
    }
  }

  function showLotteryOverlay() {
    const overlay = document.getElementById("lottery-overlay");
    if (!overlay) return;
    overlay.hidden = false;
    overlay.innerHTML = renderLotteryWheel();
    bindLotteryOverlay(overlay);
  }

  function hideLotteryOverlay() {
    const overlay = document.getElementById("lottery-overlay");
    if (!overlay) return;
    overlay.hidden = true;
    overlay.innerHTML = "";
  }

  function renderLotteryWheel() {
    const state = loadAchievementState();
    return `
      <div class="lottery-inner">
        <div class="lottery-header">
          <button class="lottery-close-btn" data-action="close-lottery" type="button" aria-label="关闭抽奖">
            <span class="material-symbols-outlined">close</span>
          </button>
          <h2 class="lottery-title">抽奖转盘</h2>
          <p class="lottery-tickets-hint">剩余 ${state.lotteryTickets || 0} 次机会</p>
        </div>
        <div class="lottery-wheel-wrap">
          <div class="lottery-pointer">▼</div>
          <canvas id="lottery-canvas" width="320" height="320"></canvas>
        </div>
        <div id="lottery-result" class="lottery-result" hidden></div>
        <button class="btn btn-primary lottery-spin-btn" id="lottery-spin-btn" data-action="spin-lottery" type="button" ${(state.lotteryTickets || 0) <= 0 ? "disabled" : ""}>
          <span class="material-symbols-outlined">casino</span>
          开始抽奖
        </button>
      </div>
    `;
  }

  function bindLotteryOverlay(overlay) {
    drawWheel((_wheelCurrentAngleDeg * Math.PI) / 180);
    overlay.onclick = (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action === "close-lottery") {
        hideLotteryOverlay();
        return;
      }
      if (action === "spin-lottery") {
        spinWheel();
      }
    };
  }

  function drawWheel(rotationAngle) {
    const canvas = document.getElementById("lottery-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const items = loadLotteryConfig().items;
    const totalWeight = items.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    if (!items.length || totalWeight <= 0) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = cx - 8;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let startAngle = rotationAngle;
    items.forEach((item) => {
      const sliceAngle = (Number(item.weight || 0) / totalWeight) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = item.color || "#864d61";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 3;
      const label = String(item.label || "");
      const text = label.length > 8 ? `${label.slice(0, 8)}...` : label;
      ctx.fillText(text, radius - 12, 5);
      ctx.restore();

      startAngle += sliceAngle;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
    ctx.fillStyle = "#1e1220";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#864d61";
    ctx.fill();
  }

  function selectLotteryItem(items) {
    const totalWeight = items.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    let rand = Math.random() * totalWeight;
    for (let index = 0; index < items.length; index += 1) {
      rand -= Number(items[index].weight || 0);
      if (rand <= 0) return index;
    }
    return Math.max(0, items.length - 1);
  }

  function spinWheel() {
    const state = loadAchievementState();
    if ((state.lotteryTickets || 0) <= 0) return;
    const spinButton = document.getElementById("lottery-spin-btn");
    if (spinButton) spinButton.disabled = true;
    const items = loadLotteryConfig().items;
    const totalWeight = items.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    if (!items.length || totalWeight <= 0) return;
    const selectedIndex = selectLotteryItem(items);
    let angleSum = 0;
    for (let index = 0; index < selectedIndex; index += 1) {
      angleSum += (Number(items[index].weight || 0) / totalWeight) * 360;
    }
    const sliceAngle = (Number(items[selectedIndex].weight || 0) / totalWeight) * 360;
    const targetAngle = angleSum + sliceAngle / 2;
    const spinDeg = 360 * 5 + ((360 - targetAngle + 270) % 360);
    const startAngle = _wheelCurrentAngleDeg;
    const endAngle = startAngle + spinDeg;
    const duration = 4000;
    const start = performance.now();
    const ease = (t) => 1 - ((1 - t) ** 3);
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const current = startAngle + ease(progress) * spinDeg;
      drawWheel((current * Math.PI) / 180);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        _wheelCurrentAngleDeg = endAngle % 360;
        onSpinEnd(items[selectedIndex]);
      }
    };
    requestAnimationFrame(animate);
  }

  function onSpinEnd(item) {
    const state = loadAchievementState();
    state.lotteryTickets = Math.max(0, Number(state.lotteryTickets || 0) - 1);
    state.usedLotteryCount = Number(state.usedLotteryCount || 0) + 1;
    saveAchievementState(state);
    saveLotteryHistory(item);

    const resultEl = document.getElementById("lottery-result");
    if (resultEl) {
      const typeLabel = item.type === "bigReward" ? "大奖" : item.type === "reward" ? "奖励" : "任务";
      resultEl.hidden = false;
      resultEl.innerHTML = `
        <div class="lottery-result-inner">
          <p class="lottery-result-label">恭喜获得</p>
          <p class="lottery-result-item" style="color:${item.color || "#fff"}">${escapeHtml(item.label || "")}</p>
          <p class="lottery-result-type">${typeLabel}</p>
        </div>
      `;
    }

    const hint = document.querySelector(".lottery-tickets-hint");
    if (hint) hint.textContent = `剩余 ${state.lotteryTickets} 次机会`;
    const spinButton = document.getElementById("lottery-spin-btn");
    if (spinButton) {
      spinButton.innerHTML = state.lotteryTickets > 0 ? "再抽一次" : "没有机会了";
      spinButton.disabled = state.lotteryTickets <= 0;
    }
    updateNavBadge();
    if (currentRoute() === "achievements") renderAchievements(document.getElementById("view"));
  }

  function saveLotteryHistory(item) {
    try {
      const history = JSON.parse(localStorage.getItem("lottery_history") || "[]");
      history.unshift({
        date: todayKey(),
        label: item.label,
        type: item.type,
      });
      localStorage.setItem("lottery_history", JSON.stringify(history.slice(0, 50)));
    } catch {
      // Lottery history is optional.
    }
  }

  let learnActiveTab = "today";

  function renderLearn(container, tab) {
    if (!tab) learnActiveTab = "today";
    else if (tab === "today" || tab === "review" || tab === "map") learnActiveTab = tab;
    container.innerHTML = `
      <div class="learn-tab-bar">
        <button class="learn-tab-btn ${learnActiveTab === "today" ? "active" : ""}" data-action="learn-tab" data-tab="today" type="button">
          <span class="material-symbols-outlined">today</span>今日学习
        </button>
        <button class="learn-tab-btn ${learnActiveTab === "review" ? "active" : ""}" data-action="learn-tab" data-tab="review" type="button">
          <span class="material-symbols-outlined">rate_review</span>复习队列
        </button>
        <button class="learn-tab-btn ${learnActiveTab === "map" ? "active" : ""}" data-action="learn-tab" data-tab="map" type="button">
          <span class="material-symbols-outlined">collections_bookmark</span>学习档案
        </button>
      </div>
      <div id="learn-content-pane"></div>
    `;
    const pane = container.querySelector("#learn-content-pane");
    if (learnActiveTab === "today") {
      window.MochiTodayStudy?.render?.(pane);
    } else if (learnActiveTab === "review") {
      window.MochiReviewPage?.render?.(pane);
    } else {
      window.MochiCards?.render?.(pane);
    }
    container.querySelectorAll("[data-action='learn-tab']").forEach((button) => {
      button.addEventListener("click", () => {
        renderLearn(container, button.dataset.tab || "today");
      });
    });
  }

  function route(routeName) {
    const rawRouteId = routeName || location.hash.replace("#", "") || "home";
    const routeId = rawRouteId === "schedule" ? "season" : rawRouteId;
    if (rawRouteId === "schedule" && location.hash === "#schedule") {
      history.replaceState(null, "", "#season");
    }
    setActive(routeId);
    if (routeId === "home") window.MochiFarm?.renderFarm?.(view);
    else if (routeId === "schedule") renderSeason(view);
    else if (routeId === "learn") renderLearn(view);
    else if (routeId === "today") renderLearn(view, "today");
    else if (routeId === "review") renderLearn(view, "review");
    else if (routeId === "map") renderLearn(view, "map");
    else if (routeId === "achievements") renderAchievements(view);
    else if (routeId === "season") renderSeason(view);
    else if (routeId === "settings") renderSettings(view);
    else window.MochiFarm?.renderFarm?.(view);
    window.MochiPet.renderMiniState();
  }

  function currentRoute() {
    return location.hash.replace("#", "") || "home";
  }

  function updateNavBadge() {
    const tickets = loadAchievementState().lotteryTickets || 0;
    document.querySelectorAll('[data-route="achievements"]').forEach((btn) => {
      let badge = btn.querySelector(".nav-lottery-badge");
      if (tickets > 0) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "nav-lottery-badge";
          btn.appendChild(badge);
        }
        badge.textContent = tickets;
      } else if (badge) {
        badge.remove();
      }
    });
  }

  function setActive(routeId) {
    const isLearnRoute = routeId === "today" || routeId === "review" || routeId === "map" || routeId === "learn";
    document.querySelectorAll("[data-route]").forEach((el) => {
      const match = el.dataset.route === routeId || (el.dataset.route === "learn" && isLearnRoute);
      el.classList.toggle("active", match);
    });
    document.querySelector(".side-nav")?.classList.remove("open");
    updateNavBadge();
  }

  function navigate(routeId, updateHash = true) {
    if (!updateHash) {
      route(routeId);
      return;
    }
    const current = location.hash.replace("#", "") || "home";
    if (current === routeId) route(routeId);
    else location.hash = routeId;
  }

  function renderSeason(container) {
    const current = loadCurrentSeason();
    const archives = loadSeasonArchives();
    container.innerHTML = `
      <div class="page-head">
        <div>
          <h2>赛季</h2>
          <p>把一段学习周期收束成报告、称号和可回看的历史。</p>
        </div>
      </div>

      ${current ? renderCurrentSeason(current) : renderNoSeason()}

      ${archives.length > 0 ? `
        <section class="card season-archive-card">
          <h3>历史赛季</h3>
          <div class="season-archive-list">
            ${archives.map((season) => renderSeasonArchiveRow(season)).join("")}
          </div>
        </section>
      ` : ""}
    `;
    bindChartWidget(container);
  }

  function renderNoSeason() {
    const logs = readStudyLogs();
    const focusLogs = readFocusLogs();
    const totalRecords = logs.length;
    const studyDays = new Set(logs.map((log) => String(log.date || "").slice(0, 10)).filter(Boolean)).size;
    const focusMinutes = focusLogs.reduce((sum, log) => sum + Number(log.duration || 0), 0);
    const focusHours = Math.floor(focusMinutes / 60);
    const subjectLabels = { math: "数学", physics: "物理", chemistry: "化学" };
    const subjectCounts = { math: 0, physics: 0, chemistry: 0 };
    logs.forEach((log) => {
      if (log.subject in subjectCounts) subjectCounts[log.subject] += 1;
    });
    const hasData = totalRecords > 0;
    return `
      <section class="card season-empty">
        <div class="season-empty-head">
          <span class="material-symbols-outlined">emoji_events</span>
          <div>
            <h3>还没有开启赛季</h3>
            <p class="muted">赛季期间可以看倒计时、称号和热力图。赛季管理在<a href="?admin=1" style="color:var(--primary);margin-left:4px">管理后台</a>。</p>
          </div>
        </div>
        ${hasData ? `
        <div class="season-empty-stats">
          <div class="stat-mini">
            <span class="stat-mini-num">${totalRecords}</span>
            <span class="stat-mini-label">累计记录</span>
          </div>
          <div class="stat-mini">
            <span class="stat-mini-num">${studyDays}</span>
            <span class="stat-mini-label">学习天数</span>
          </div>
          <div class="stat-mini">
            <span class="stat-mini-num">${focusHours}</span>
            <span class="stat-mini-label">专注小时</span>
          </div>
          ${Object.entries(subjectCounts).map(([subject, count]) => `
          <div class="stat-mini">
            <span class="stat-mini-num">${count}</span>
            <span class="stat-mini-label">${subjectLabels[subject]}</span>
          </div>
          `).join("")}
        </div>
        ` : `<p class="muted" style="margin-top:16px">还没有任何学习记录，先去首页导入第一条吧。</p>`}
      </section>
    `;
  }

  function renderCurrentSeason(season) {
    const allLogs = readStudyLogs();
    const seasonLogs = allLogs.filter((l) => dateInRange(l.date, season.startDate, season.endDate));
    const allFocusLogs = readFocusLogs();
    const seasonFocusLogs = allFocusLogs.filter(
      (l) => dateInRange(l.date, season.startDate, season.endDate)
    );

    const today = new Date();
    const endDate = new Date(`${season.endDate}T12:00:00`);
    const startDate = new Date(`${season.startDate}T12:00:00`);
    const daysLeft = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const pct = Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));

    const totalRecords = seasonLogs.length;
    const totalFocusMins = seasonFocusLogs.reduce((s, l) => s + Number(l.duration || 0), 0);
    const validDays = [...new Set(seasonLogs.map((l) => String(l.date || "").slice(0, 10)))].length;

    const subjectCounts = {
      math:      seasonLogs.filter((l) => l.subject === "math").length,
      physics:   seasonLogs.filter((l) => l.subject === "physics").length,
      chemistry: seasonLogs.filter((l) => l.subject === "chemistry").length,
    };

    const cfg = loadAdminConfig();
    const mathTitle    = calcSeasonTitle(subjectCounts.math, cfg);
    const physicsTitle = calcSeasonTitle(subjectCounts.physics, cfg);
    const chemTitle    = calcSeasonTitle(subjectCounts.chemistry, cfg);
    const overallTitle = calcSeasonTitle(Math.round(totalRecords / 3), cfg);

    return `
      <section class="card season-current-card">
        <div class="season-header">
          <div>
            <h3 class="season-name">${escapeHtml(season.name || "未命名赛季")}</h3>
            <p class="season-dates muted">${escapeHtml(season.startDate || "")} — ${escapeHtml(season.endDate || "")}</p>
          </div>
          <div class="season-countdown">
            <span class="season-days-left">${daysLeft}</span>
            <span class="muted" style="font-size:12px">天后结束</span>
          </div>
        </div>

        <div class="season-progress-wrap">
          <div class="season-progress-track">
            <div class="season-progress-fill" style="width:${pct}%"></div>
          </div>
          <span class="muted" style="font-size:11px">${pct}%</span>
        </div>

        <div class="season-stats-row">
          <div class="season-stat">
            <span class="season-stat-num">${totalRecords}</span>
            <span class="season-stat-label">条记录</span>
          </div>
          <div class="season-stat">
            <span class="season-stat-num">${Math.round((totalFocusMins / 60) * 10) / 10}</span>
            <span class="season-stat-label">小时专注</span>
          </div>
          <div class="season-stat">
            <span class="season-stat-num">${validDays}</span>
            <span class="season-stat-label">学习天数</span>
          </div>
        </div>

        <div class="season-titles-row">
          <div class="season-title-item math">
            <span class="season-title-subject">数学</span>
            <span class="season-title-label">Lv${mathTitle.level} ${escapeHtml(mathTitle.label)}</span>
          </div>
          <div class="season-title-item physics">
            <span class="season-title-subject">物理</span>
            <span class="season-title-label">Lv${physicsTitle.level} ${escapeHtml(physicsTitle.label)}</span>
          </div>
          <div class="season-title-item chemistry">
            <span class="season-title-subject">化学</span>
            <span class="season-title-label">Lv${chemTitle.level} ${escapeHtml(chemTitle.label)}</span>
          </div>
        </div>

        <div class="season-overall-title">
          总称号：<strong>Lv${overallTitle.level} ${escapeHtml(overallTitle.label)}</strong>
        </div>

        <div class="season-chart-section">
          ${renderChartWidget(allLogs)}
        </div>

        <div class="season-actions">
          <button class="btn btn-soft btn-sm" data-action="export-season-report"
            data-season-id="${escapeHtml(season.id || "")}">
            <span class="material-symbols-outlined">download</span>
            导出赛季报告
          </button>
        </div>
      </section>
    `;
  }

  function seasonProgress(season) {
    const today = todayKey();
    const totalDays = Math.max(1, dateDiffDays(season.startDate, season.endDate) + 1);
    const elapsed = Math.min(totalDays, Math.max(0, dateDiffDays(season.startDate, today) + 1));
    const daysLeft = season.status === "ended" ? 0 : Math.max(0, dateDiffDays(today, season.endDate));
    return {
      totalDays,
      elapsed,
      daysLeft,
      pct: Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100))),
    };
  }

  function renderSeasonSnapshotCard(season, snapshot, options = {}) {
    const progress = seasonProgress(season);
    const statusText = season.status === "ended" ? "已结束" : "进行中";
    const overall = snapshot.titles?.overall || calcSeasonTitle(0);
    return `
      <section class="card season-current-card">
        <div class="season-header">
          <div>
            <div class="season-name-row">
              <h3 class="season-name">${escapeHtml(season.name || "未命名赛季")}</h3>
              <span class="season-status ${season.status === "ended" ? "ended" : "active"}">${statusText}</span>
            </div>
            <p class="season-dates muted">${escapeHtml(season.startDate || "")} - ${escapeHtml(season.endDate || "")}</p>
          </div>
          <div class="season-countdown">
            <span class="season-days-left">${progress.daysLeft}</span>
            <span class="muted">天后结束</span>
          </div>
        </div>

        <div class="season-progress-wrap" aria-label="赛季进度">
          <div class="season-progress-track">
            <div class="season-progress-fill" style="width:${progress.pct}%"></div>
          </div>
          <span class="muted">${progress.pct}%</span>
        </div>

        <div class="season-stats-row">
          <div class="season-stat">
            <span class="season-stat-num">${snapshot.totalRecords || 0}</span>
            <span class="season-stat-label">条记录</span>
          </div>
          <div class="season-stat">
            <span class="season-stat-num">${Math.round((Number(snapshot.totalFocusMinutes || 0) / 60) * 10) / 10}</span>
            <span class="season-stat-label">小时专注</span>
          </div>
          <div class="season-stat">
            <span class="season-stat-num">${snapshot.validStudyDays || 0}</span>
            <span class="season-stat-label">有效学习日</span>
          </div>
        </div>

        <div class="season-titles-row">
          ${renderSeasonTitleItem("math", "数学", snapshot.titles?.math)}
          ${renderSeasonTitleItem("physics", "物理", snapshot.titles?.physics)}
          ${renderSeasonTitleItem("chemistry", "化学", snapshot.titles?.chemistry)}
        </div>
        <div class="season-overall-title">
          总称号：<strong>Lv${overall.level} ${escapeHtml(overall.label)}</strong>
        </div>

        <div class="season-viz-block">
          <p class="muted">本赛季学习热力图</p>
          ${renderSeasonHeatmap(snapshot.dailyRecords || {}, season.startDate, season.endDate)}
        </div>

        <div class="season-viz-block">
          <p class="muted">每周学习趋势</p>
          ${renderSeasonChart(snapshot.weeklyRecords || [])}
        </div>

        ${options.current ? `
          <div class="season-actions">
            <button class="btn btn-primary" data-action="export-season-report">
              <span class="material-symbols-outlined">download</span>
              导出赛季报告
            </button>
          </div>
        ` : ""}
      </section>
    `;
  }

  function renderSeasonTitleItem(subject, label, title) {
    const safeTitle = title || calcSeasonTitle(0);
    return `
      <div class="season-title-item ${subject}">
        <span class="season-title-subject">${label}</span>
        <span class="season-title-label">Lv${safeTitle.level} ${escapeHtml(safeTitle.label)}</span>
      </div>
    `;
  }

  function renderSeasonHeatmap(dailyRecords, startDate, endDate) {
    const dates = [];
    const cursor = parseDateAtNoon(startDate);
    const end = parseDateAtNoon(endDate);
    while (cursor <= end) {
      dates.push(dateKeyFromDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    const cellSize = 12;
    const gap = 3;
    const cols = Math.max(1, Math.ceil(dates.length / 7));
    const width = cols * (cellSize + gap);
    const height = 7 * (cellSize + gap);
    const cells = dates.map((date, index) => {
      const col = Math.floor(index / 7);
      const row = index % 7;
      const count = Number(dailyRecords[date] || 0);
      const opacity = count === 0 ? 0.14 : count <= 2 ? 0.38 : count <= 4 ? 0.68 : 1;
      return `<rect x="${col * (cellSize + gap)}" y="${row * (cellSize + gap)}" width="${cellSize}" height="${cellSize}" rx="3" fill="var(--primary)" opacity="${opacity}"><title>${date}: ${count}条记录</title></rect>`;
    }).join("");
    return `<div class="season-heatmap-scroll"><svg width="${width}" height="${height}" role="img" aria-label="赛季每日学习记录热力图">${cells}</svg></div>`;
  }

  function renderSeasonWeeklyChart(logs) {
    if (!logs || logs.length === 0) {
      return `<p class="muted season-empty-chart">数据还不够，继续学习后会显示趋势图</p>`;
    }
    const weekMap = {};
    logs.forEach((l) => {
      const w = getWeekKey(l.date);
      weekMap[w] = (weekMap[w] || 0) + 1;
    });
    const weeks = Object.keys(weekMap).sort();
    if (weeks.length === 0) {
      return `<p class="muted season-empty-chart">数据还不够，继续学习后会显示趋势图</p>`;
    }
    const maxVal = Math.max(...weeks.map((w) => weekMap[w]), 1);
    const W = 280;
    const H = 80;
    const PAD = 16;
    const innerW = W - PAD * 2;
    const pts = weeks.map((w, i) => ({
      x: weeks.length === 1 ? W / 2 : PAD + (i / (weeks.length - 1)) * innerW,
      y: H - (weekMap[w] / maxVal) * H,
      w,
      val: weekMap[w],
    }));
    const polyline = pts.length >= 2 ? pts.map((p) => `${p.x},${p.y}`).join(" ") : "";
    const dots = pts.map((p) => `
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--primary)"/>
      <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" fill="var(--on-surface)" font-size="10" opacity="0.7">${p.val}</text>
    `).join("");
    const labels = pts.map((p) => `
      <text x="${p.x}" y="${H + 16}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="9">W${p.w.slice(-2)}</text>
    `).join("");
    return `
      <svg width="${W}" height="${H + 24}" viewBox="0 0 ${W} ${H + 24}" style="max-width:100%;overflow:visible">
        ${polyline ? `<polyline points="${polyline}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` : ""}
        ${dots}
        ${labels}
      </svg>
    `;
  }

  function renderSeasonChart(weeklyRecords) {
    const weeks = (weeklyRecords || []).filter((item) => item && (Number(item.records || 0) > 0 || Number(item.focusMinutes || 0) > 0));
    if (weeks.length < 2) return `<p class="muted season-chart-empty">数据还不够，继续学习后会显示趋势图</p>`;
    const maxRecords = Math.max(...weeks.map((week) => Number(week.records || 0)), 1);
    const width = 320;
    const height = 88;
    const points = weeks.map((week, index) => {
      const x = (index / (weeks.length - 1)) * width;
      const y = height - (Number(week.records || 0) / maxRecords) * height;
      return `${x},${y}`;
    }).join(" ");
    const labels = weeks.map((week, index) => {
      const x = (index / (weeks.length - 1)) * width;
      const y = height - (Number(week.records || 0) / maxRecords) * height;
      return `<circle cx="${x}" cy="${y}" r="4" fill="var(--primary)"><title>${week.week}: ${week.records || 0}条记录</title></circle><text x="${x}" y="${height + 18}" text-anchor="middle" fill="var(--muted)" font-size="10">${String(week.week || "").slice(5)}</text>`;
    }).join("");
    return `
      <div class="season-chart-scroll">
        <svg width="${width}" height="${height + 24}" role="img" aria-label="赛季每周学习记录趋势图">
          <polyline points="${points}" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"></polyline>
          ${labels}
        </svg>
      </div>
    `;
  }

  // ── Interactive Chart Widget ─────────────────────────────────────────────

  function getChartDateRange(allLogs, days, offset) {
    const today = parseDateAtNoon(todayKey());
    if (days === 0) {
      const dates = (allLogs || []).map((l) => String(l.date || "").slice(0, 10)).filter(Boolean).sort();
      const startKey = dates.length ? dates[0] : dateKeyFromDate(today);
      const endKey = dateKeyFromDate(today);
      return { startKey, endKey, canGoBack: false, canGoForward: false };
    }
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() - offset * days);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days + 1);
    return {
      startKey: dateKeyFromDate(startDate),
      endKey: dateKeyFromDate(endDate),
      canGoBack: true,
      canGoForward: offset > 0,
    };
  }

  function buildChartBody(allLogs, type, days, offset) {
    const { startKey, endKey } = getChartDateRange(allLogs, days, offset);
    const filtered = (allLogs || []).filter((l) => dateInRange(l.date, startKey, endKey));
    if (type === "heatmap") {
      const countByDate = {};
      filtered.forEach((l) => {
        const d = String(l.date || "").slice(0, 10);
        if (d) countByDate[d] = (countByDate[d] || 0) + 1;
      });
      return renderHeatmapV2(countByDate, startKey, endKey);
    }
    return renderTrendV2(filtered);
  }

  function renderChartWidget(allLogs) {
    const days = 90;
    const offset = 0;
    const range = getChartDateRange(allLogs, days, offset);
    return `
      <div class="chart-widget" data-chart-type="heatmap" data-chart-days="${days}" data-chart-offset="${offset}">
        <div class="chart-widget-header">
          <div class="chart-type-toggle">
            <button class="chart-type-btn active" data-chart-tab="heatmap">
              <span class="material-symbols-outlined">grid_4x4</span>热力图
            </button>
            <button class="chart-type-btn" data-chart-tab="trend">
              <span class="material-symbols-outlined">show_chart</span>趋势图
            </button>
          </div>
          <div class="chart-range-toggle">
            <button class="chart-range-btn" data-chart-days="30">30天</button>
            <button class="chart-range-btn active" data-chart-days="90">3月</button>
            <button class="chart-range-btn" data-chart-days="180">6月</button>
            <button class="chart-range-btn" data-chart-days="0">全部</button>
          </div>
        </div>
        <div class="chart-nav-row">
          <button class="chart-nav-btn" data-chart-nav="-1" title="上一时段">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <span class="chart-period-label-nav">${range.startKey} — ${range.endKey}</span>
          <button class="chart-nav-btn" data-chart-nav="1" title="下一时段" disabled>
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        <div class="chart-body">
          ${buildChartBody(allLogs, "heatmap", days, offset)}
        </div>
      </div>
    `;
  }

  function bindChartWidget(container) {
    const widget = container.querySelector(".chart-widget");
    if (!widget) return;

    function refresh() {
      const type = widget.dataset.chartType || "heatmap";
      const days = Number(widget.dataset.chartDays || 90);
      const offset = Number(widget.dataset.chartOffset || 0);
      const allLogs = readStudyLogs();
      const body = widget.querySelector(".chart-body");
      if (body) body.innerHTML = buildChartBody(allLogs, type, days, offset);
      const range = getChartDateRange(allLogs, days, offset);
      const lbl = widget.querySelector(".chart-period-label-nav");
      if (lbl) lbl.textContent = `${range.startKey} — ${range.endKey}`;
      const fwd = widget.querySelector("[data-chart-nav='1']");
      if (fwd) fwd.disabled = !range.canGoForward;
      const back = widget.querySelector("[data-chart-nav='-1']");
      if (back) back.disabled = !range.canGoBack;
    }

    widget.addEventListener("click", (e) => {
      const tab = e.target.closest("[data-chart-tab]");
      const rangeBtn = e.target.closest("[data-chart-days]");
      const navBtn = e.target.closest("[data-chart-nav]");
      if (tab) {
        const type = tab.dataset.chartTab;
        widget.dataset.chartType = type;
        widget.querySelectorAll("[data-chart-tab]").forEach((b) => b.classList.toggle("active", b.dataset.chartTab === type));
        refresh();
      } else if (rangeBtn) {
        const days = rangeBtn.dataset.chartDays;
        widget.dataset.chartDays = days;
        widget.dataset.chartOffset = 0;
        widget.querySelectorAll("[data-chart-days]").forEach((b) => b.classList.toggle("active", b.dataset.chartDays === days));
        refresh();
      } else if (navBtn && !navBtn.disabled) {
        const dir = Number(navBtn.dataset.chartNav);
        widget.dataset.chartOffset = Math.max(0, Number(widget.dataset.chartOffset || 0) + dir);
        refresh();
      }
    });
  }

  function renderHeatmapV2(countByDate, startKey, endKey) {
    const CELL = 18, GAP = 4, STEP = CELL + GAP;
    const L = 28, T = 26;

    const start = parseDateAtNoon(startKey);
    const sdow = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - sdow);

    const end = parseDateAtNoon(endKey);
    const edow = (end.getDay() + 6) % 7;
    if (edow < 6) end.setDate(end.getDate() + (6 - edow));

    const days = [];
    const cur = new Date(start);
    while (cur <= end) {
      days.push(dateKeyFromDate(cur));
      cur.setDate(cur.getDate() + 1);
    }

    const numWeeks = Math.ceil(days.length / 7);
    const svgW = L + numWeeks * STEP;
    const svgH = T + 7 * STEP;

    const DAY_CHARS = ["一", null, "三", null, "五", null, "日"];
    const dayLabels = DAY_CHARS.map((ch, i) =>
      ch ? `<text x="${L - 6}" y="${T + i * STEP + CELL - 3}" text-anchor="end" font-size="11" fill="rgba(255,255,255,0.32)">${ch}</text>` : ""
    ).join("");

    let monthLabels = "";
    let lastMonth = "";
    const cells = days.map((dateKey, i) => {
      const col = Math.floor(i / 7);
      const row = i % 7;
      const month = dateKey.slice(0, 7);
      if (row === 0 && month !== lastMonth) {
        const mIdx = parseInt(dateKey.slice(5, 7), 10) - 1;
        const mNames = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
        monthLabels += `<text x="${L + col * STEP}" y="${T - 7}" font-size="11" fill="rgba(255,255,255,0.46)">${mNames[mIdx]}</text>`;
        lastMonth = month;
      }
      const inRange = dateKey >= startKey && dateKey <= endKey;
      const count = inRange ? Number(countByDate[dateKey] || 0) : 0;
      const opacity = !inRange ? 0.04 : count === 0 ? 0.10 : count === 1 ? 0.35 : count <= 3 ? 0.62 : count <= 5 ? 0.84 : 1;
      return `<rect x="${L + col * STEP}" y="${T + row * STEP}" width="${CELL}" height="${CELL}" rx="4" fill="var(--primary)" opacity="${opacity}"><title>${dateKey}${inRange ? ": " + count + "条记录" : ""}</title></rect>`;
    }).join("");

    return `<div class="chart-heatmap-wrap"><svg width="${svgW}" height="${svgH}" style="display:block;margin:0 auto">${dayLabels}${monthLabels}${cells}</svg></div>`;
  }

  function renderTrendV2(logs) {
    if (!logs || logs.length === 0) {
      return `<div class="chart-empty-state"><span class="material-symbols-outlined">show_chart</span><p>暂无数据，继续学习后会显示趋势图</p></div>`;
    }
    const wTotal = {}, wMath = {}, wPhys = {}, wChem = {};
    logs.forEach((l) => {
      const w = getWeekKey(l.date);
      wTotal[w] = (wTotal[w] || 0) + 1;
      if (l.subject === "math") wMath[w] = (wMath[w] || 0) + 1;
      else if (l.subject === "physics") wPhys[w] = (wPhys[w] || 0) + 1;
      else if (l.subject === "chemistry") wChem[w] = (wChem[w] || 0) + 1;
    });
    const weeks = Object.keys(wTotal).sort();
    if (weeks.length === 0) return `<div class="chart-empty-state"><span class="material-symbols-outlined">show_chart</span><p>暂无数据</p></div>`;

    const W = 400, H = 240, PL = 36, PR = 16, PT = 30, PB = 36;
    const iW = W - PL - PR, iH = H - PT - PB;
    const maxVal = Math.max(...weeks.map((w) => wTotal[w]), 1);
    const xOf = (i) => PL + (weeks.length > 1 ? (i / (weeks.length - 1)) * iW : iW / 2);
    const yOf = (val) => PT + iH - (val / maxVal) * iH;

    function smoothPath(valFn) {
      const pts = weeks.map((w, i) => ({ x: xOf(i), y: yOf(valFn(w)) }));
      if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
      let d = `M${pts[0].x},${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const cpx = (pts[i - 1].x + pts[i].x) / 2;
        d += ` C${cpx},${pts[i - 1].y} ${cpx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
      }
      return d;
    }

    const totalPath = smoothPath((w) => wTotal[w] || 0);
    const fillPath = `${totalPath} L${xOf(weeks.length - 1)},${PT + iH} L${xOf(0)},${PT + iH} Z`;
    const gradId = "tg" + Math.random().toString(36).slice(2, 8);

    const gridLines = [0.25, 0.5, 0.75, 1].map((p) => {
      const y = PT + iH - p * iH;
      return `<line x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
              <text x="${PL - 5}" y="${y + 4}" text-anchor="end" font-size="11" fill="rgba(255,255,255,0.26)">${Math.round(p * maxVal)}</text>`;
    }).join("");

    const totalPts = weeks.map((w, i) => ({ x: xOf(i), y: yOf(wTotal[w] || 0), val: wTotal[w] || 0 }));
    const dots = totalPts.map((p) =>
      `<circle cx="${p.x}" cy="${p.y}" r="5" fill="var(--primary)" stroke="var(--surface)" stroke-width="2"/>
       <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--on-surface)" opacity="0.88">${p.val}</text>`
    ).join("");

    const lStep = weeks.length <= 6 ? 1 : weeks.length <= 14 ? 2 : Math.ceil(weeks.length / 8);
    const xLabels = weeks.map((w, i) => {
      if (i % lStep !== 0 && i !== weeks.length - 1) return "";
      return `<text x="${xOf(i)}" y="${H - 6}" text-anchor="middle" font-size="10" fill="rgba(255,255,255,0.34)">${w.slice(5)}</text>`;
    }).join("");

    const subLines = [
      { map: wMath, color: "#ff9eb5" },
      { map: wPhys, color: "#aaa8f0" },
      { map: wChem, color: "#6dd98c" },
    ].map(({ map, color }) => {
      if (!weeks.some((w) => map[w])) return "";
      return `<path d="${smoothPath((w) => map[w] || 0)}" fill="none" stroke="${color}" stroke-width="2" opacity="0.65" stroke-linejoin="round" stroke-linecap="round"/>`;
    }).join("");

    const legendItems = [
      { color: "var(--primary)", label: "合计", stroke: 3 },
      { color: "#ff9eb5", label: "数学", stroke: 2 },
      { color: "#aaa8f0", label: "物理", stroke: 2 },
      { color: "#6dd98c", label: "化学", stroke: 2 },
    ].filter(({ label }) => label === "合计" || weeks.some((w) => ({ "数学": wMath, "物理": wPhys, "化学": wChem }[label]?.[w])))
     .map(({ color, label, stroke }) =>
       `<span class="chart-legend-item"><svg width="18" height="8"><line x1="0" y1="4" x2="18" y2="4" stroke="${color}" stroke-width="${stroke}"/></svg>${label}</span>`
     ).join("");

    return `
      <div class="chart-trend-wrap">
        <svg width="100%" viewBox="0 0 ${W} ${H}" style="display:block;overflow:visible">
          <defs>
            <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.34"/>
              <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.02"/>
            </linearGradient>
          </defs>
          ${gridLines}
          <path d="${fillPath}" fill="url(#${gradId})"/>
          ${subLines}
          <path d="${totalPath}" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
          ${dots}
          ${xLabels}
        </svg>
      </div>
      <div class="chart-legend">${legendItems}</div>
    `;
  }

  // ── End Chart Widget ──────────────────────────────────────────────────────

  function renderSeasonArchiveRow(season) {
    const snapshot = season.snapshot || {};
    const overall = snapshot.titles?.overall;
    return `
      <button class="season-archive-row" data-action="view-season" data-season-id="${escapeHtml(season.id || "")}" type="button">
        <span class="season-archive-main">
          <strong>${escapeHtml(season.name || "未命名赛季")}</strong>
          <span class="muted">${escapeHtml(season.startDate || "")} - ${escapeHtml(season.endDate || "")}</span>
        </span>
        <span class="season-archive-meta">
          ${overall ? `<span class="season-archive-title">Lv${overall.level} ${escapeHtml(overall.label)}</span>` : ""}
          <span class="muted">${snapshot.totalRecords || 0}题</span>
          <span class="material-symbols-outlined">chevron_right</span>
        </span>
      </button>
    `;
  }

  function renderSeasonManager() {
    const current = loadCurrentSeason();
    const archives = loadSeasonArchives();
    const nextId = nextSeasonId(current, archives);
    const today = todayKey();
    const defaultEnd = dateKeyFromDate(addDays(parseDateAtNoon(today), 55));
    if (current?.status === "active") {
      return `
        <section class="card">
          <h3>赛季管理</h3>
          <p class="muted">${escapeHtml(current.name)} 正在进行：${escapeHtml(current.startDate)} - ${escapeHtml(current.endDate)}</p>
          <div class="settings-list" style="margin-top:18px">
            <button class="btn btn-danger" data-action="end-season" type="button">
              <span class="material-symbols-outlined">flag</span>
              结束当前赛季并存档
            </button>
          </div>
        </section>
      `;
    }
    return `
      <section class="card">
        <h3>赛季管理</h3>
        <p class="muted">开启后，赛季页会按这个时间范围统计学习记录、专注、称号和图表。</p>
        <form id="season-form" class="form-grid" style="margin-top:18px">
          <div class="field"><label>赛季名称</label><input name="name" required value="${nextId === "S1" ? "第一赛季" : `第${nextId.slice(1)}赛季`}" placeholder="例如：第一赛季" /></div>
          <div class="field"><label>开始日期</label><input name="startDate" type="date" required value="${today}" /></div>
          <div class="field"><label>结束日期</label><input name="endDate" type="date" required value="${defaultEnd}" /></div>
          <input name="id" type="hidden" value="${nextId}" />
          <button class="btn btn-primary" type="submit"><span class="material-symbols-outlined">emoji_events</span>开启赛季</button>
        </form>
      </section>
    `;
  }

  function openSeason(seasonInput) {
    if (!seasonInput.name || !seasonInput.startDate || !seasonInput.endDate) {
      toast("请填写完整赛季信息");
      return;
    }
    if (seasonInput.endDate < seasonInput.startDate) {
      toast("结束日期不能早于开始日期");
      return;
    }
    const season = {
      id: seasonInput.id || `S${Date.now()}`,
      name: String(seasonInput.name).trim(),
      startDate: seasonInput.startDate,
      endDate: seasonInput.endDate,
      status: "active",
    };
    saveCurrentSeason(season);
    toast("赛季已开启");
    navigate("season");
  }

  function endCurrentSeason() {
    const current = loadCurrentSeason();
    if (!current || current.status !== "active") {
      toast("没有正在进行的赛季");
      return;
    }
    if (!confirm(`结束「${current.name}」并保存到历史赛季吗？`)) return;
    const ended = { ...current, status: "ended" };
    const snapshot = buildSeasonSnapshot(ended);
    const archives = loadSeasonArchives().filter((season) => season.id !== ended.id);
    archives.unshift({ ...ended, snapshot });
    saveSeasonArchives(archives);
    saveCurrentSeason(ended);
    toast("赛季已结束并存档");
    route(currentRoute());
  }

  function showSeasonArchiveModal(seasonId) {
    const season = loadSeasonArchives().find((item) => item.id === seasonId);
    if (!season) {
      toast("没有找到这个历史赛季");
      return;
    }
    modal(`
      <div class="modal-head">
        <div><h2>${escapeHtml(season.name || "历史赛季")}</h2><p class="muted">历史赛季快照</p></div>
        <button class="icon-btn" data-action="close-modal"><span class="material-symbols-outlined">close</span></button>
      </div>
      ${renderSeasonSnapshotCard(season, season.snapshot || buildSeasonSnapshot(season), { current: false })}
    `);
  }

  function generateSeasonTextReport(season, snapshot, logs, focusLogs) {
    const overall = snapshot.titles?.overall || calcSeasonTitle(0);
    const lines = [
      `【${season.name}总结报告】`,
      `${season.startDate} — ${season.endDate}`,
      "",
      "📊 核心数据",
      `学习天数：${snapshot.validStudyDays || 0} 天`,
      `导入记录：${snapshot.totalRecords || 0} 条`,
      `专注时长：${Math.round((Number(snapshot.totalFocusMinutes || 0) / 60) * 10) / 10} 小时`,
      "",
      "📚 各科情况",
      `数学：${snapshot.subjectRecords?.math || 0}条  Lv${snapshot.titles?.math?.level || 1} ${snapshot.titles?.math?.label || ""}`,
      `物理：${snapshot.subjectRecords?.physics || 0}条  Lv${snapshot.titles?.physics?.level || 1} ${snapshot.titles?.physics?.label || ""}`,
      `化学：${snapshot.subjectRecords?.chemistry || 0}条  Lv${snapshot.titles?.chemistry?.level || 1} ${snapshot.titles?.chemistry?.label || ""}`,
      "",
      `🏆 总称号：Lv${overall.level} ${overall.label}`,
      "",
      `🎖 勋章：小勋章 ${snapshot.totalSmallBadges || 0}个 · 大勋章 ${snapshot.totalBigBadges || 0}个`,
    ];
    const highlights = buildSeasonHighlights(logs, focusLogs);
    if (highlights.length > 0) {
      lines.push("", "✨ 这个赛季的高光时刻");
      highlights.forEach((h) => lines.push(h));
    }
    return lines.join("\n").trim();
  }

  function buildSeasonHighlights(logs, focusLogs) {
    const highlights = [];
    if (!logs || logs.length === 0) return highlights;

    const countByDate = {};
    logs.forEach((l) => {
      const d = String(l.date || "").slice(0, 10);
      if (d) countByDate[d] = (countByDate[d] || 0) + 1;
    });

    const busyDates = Object.entries(countByDate).sort((a, b) => b[1] - a[1]);
    if (busyDates.length > 0 && busyDates[0][1] >= 2) {
      highlights.push(`🔥 最努力的一天：${busyDates[0][0]}，学了 ${busyDates[0][1]} 道题`);
    }

    if (focusLogs && focusLogs.length > 0) {
      const longest = focusLogs.reduce((max, l) =>
        Number(l.duration || 0) > Number(max.duration || 0) ? l : max, focusLogs[0]);
      if (Number(longest.duration || 0) >= 20) {
        highlights.push(`⚡ 最长专注：${longest.date}，连续专注 ${longest.duration} 分钟`);
      }
    }

    const nodeProgress = {};
    logs.forEach((l) => {
      const key = `${l.subject}:${l.nodeLabel}`;
      if (!nodeProgress[key]) nodeProgress[key] = [];
      nodeProgress[key].push(Number(l.stars || 1));
    });
    let bestProgressNode = null;
    Object.entries(nodeProgress).forEach(([key, starList]) => {
      if (starList.length >= 2 && starList[0] <= 1 && starList[starList.length - 1] >= 3) {
        bestProgressNode = key.split(":")[1];
      }
    });
    if (bestProgressNode) {
      highlights.push(`📈 进步最快：${bestProgressNode}，从 1 星一路提升到 3 星`);
    }

    const newNodes = new Set(logs.map((l) => `${l.subject}:${l.nodeLabel}`));
    if (newNodes.size >= 3) {
      highlights.push(`🌱 本赛季开拓了 ${newNodes.size} 个知识点`);
    }

    const weekMap = {};
    logs.forEach((l) => {
      const w = getWeekKey(l.date);
      if (!weekMap[w]) weekMap[w] = new Set();
      weekMap[w].add(l.subject);
    });
    const balancedWeeks = Object.values(weekMap).filter((s) => s.size >= 3).length;
    if (balancedWeeks >= 2) {
      highlights.push(`⚖️ 均衡发展：有 ${balancedWeeks} 周三科都有学习记录`);
    }

    const sortedDates = Object.keys(countByDate).sort();
    let maxStreak = 1;
    let curStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(`${sortedDates[i - 1]}T12:00:00`);
      const cur = new Date(`${sortedDates[i]}T12:00:00`);
      const diff = Math.round((cur - prev) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        curStreak++;
        maxStreak = Math.max(maxStreak, curStreak);
      } else {
        curStreak = 1;
      }
    }
    if (maxStreak >= 3) {
      highlights.push(`🗓️ 最长连续学习：${maxStreak} 天没有间断`);
    }

    return highlights;
  }

  function exportSeasonReport() {
    const current = loadCurrentSeason();
    if (!current) {
      toast("还没有可导出的赛季");
      return;
    }
    const archived = current.status === "ended" ? loadSeasonArchives().find((item) => item.id === current.id) : null;
    const snapshot = archived?.snapshot || buildSeasonSnapshot(current);
    showSeasonExportSheet(current, snapshot);
  }

  function showSeasonExportSheet(season, snapshot) {
    document.getElementById("season-export-root")?.remove();
    const root = document.createElement("div");
    root.id = "season-export-root";
    root.className = "archive-export-root";
    const allLogs = readStudyLogs();
    const allFocusLogs = readFocusLogs();
    const seasonLogs = allLogs.filter(
      (l) => String(l.date || "") >= season.startDate && String(l.date || "") <= season.endDate
    );
    const seasonFocusLogs = allFocusLogs.filter(
      (l) => String(l.date || "") >= season.startDate
    );
    const textReport = generateSeasonTextReport(season, snapshot, seasonLogs, seasonFocusLogs);
    const jsonReport = JSON.stringify({ season, snapshot }, null, 2);
    root.innerHTML = `
      <section class="archive-export-sheet" role="dialog" aria-modal="true" aria-labelledby="season-export-title">
        <div class="modal-head">
          <div><h2 id="season-export-title">导出赛季报告</h2></div>
          <button class="icon-btn" data-season-export-close aria-label="关闭"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="archive-export-switch season-export-switch" role="tablist">
          <button class="active" data-season-export-format="text" type="button">文字版</button>
          <button data-season-export-format="json" type="button">JSON</button>
        </div>
        <p class="archive-export-hint" data-season-export-hint>适合粘贴给 AI 或家长做阶段复盘</p>
        <textarea class="archive-export-preview" readonly></textarea>
        <div class="archive-export-actions">
          <button class="btn btn-primary" data-season-export-copy type="button"><span class="material-symbols-outlined">content_copy</span><span data-copy-label>复制到剪贴板</span></button>
          <button class="btn btn-outline" data-season-export-close type="button">关闭</button>
        </div>
      </section>
    `;
    document.body.appendChild(root);
    const preview = root.querySelector(".archive-export-preview");
    const setFormat = (format) => {
      root.querySelectorAll("[data-season-export-format]").forEach((button) => {
        button.classList.toggle("active", button.dataset.seasonExportFormat === format);
      });
      if (preview) preview.value = format === "json" ? jsonReport : textReport;
      const hint = root.querySelector("[data-season-export-hint]");
      if (hint) hint.textContent = format === "json" ? "包含赛季配置和快照数据，适合开发或自动化处理" : "适合粘贴给 AI 或家长做阶段复盘";
    };
    root.addEventListener("click", async (event) => {
      if (event.target === root || event.target.closest("[data-season-export-close]")) {
        root.remove();
        return;
      }
      const formatButton = event.target.closest("[data-season-export-format]");
      if (formatButton) {
        setFormat(formatButton.dataset.seasonExportFormat || "text");
        return;
      }
      const copyButton = event.target.closest("[data-season-export-copy]");
      if (copyButton) {
        const ok = await copyTextToClipboard(preview?.value || "");
        const label = copyButton.querySelector("[data-copy-label]");
        if (ok && label) {
          label.textContent = "已复制";
          setTimeout(() => {
            if (label.isConnected) label.textContent = "复制到剪贴板";
          }, 1600);
        }
      }
    });
    setFormat("text");
  }

  async function copyTextToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      textarea.remove();
      return ok;
    }
  }

  function showAdminPasswordPrompt() {
    document.querySelector(".admin-auth-overlay")?.remove();
    const savedPwd = localStorage.getItem("admin_password") || "mochi2025";
    const overlay = document.createElement("div");
    overlay.className = "admin-auth-overlay";
    overlay.innerHTML = `
      <div class="admin-auth-box" role="dialog" aria-modal="true" aria-labelledby="admin-auth-title">
        <h3 id="admin-auth-title">管理员入口</h3>
        <input type="password" id="admin-pwd-input" class="admin-input" placeholder="输入密码" autocomplete="current-password" />
        <button class="btn btn-primary" id="admin-pwd-confirm" type="button">进入</button>
        <p id="admin-pwd-error" class="muted" hidden>密码错误</p>
      </div>
    `;
    document.body.appendChild(overlay);
    const input = overlay.querySelector("#admin-pwd-input");
    const button = overlay.querySelector("#admin-pwd-confirm");
    const error = overlay.querySelector("#admin-pwd-error");
    input?.focus();
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") button?.click();
    });
    button?.addEventListener("click", () => {
      if (input?.value === savedPwd) {
        overlay.remove();
        showAdminPanel();
      } else {
        if (error) error.hidden = false;
        if (input) {
          input.value = "";
          input.focus();
        }
      }
    });
  }

  function showAdminPanel() {
    document.getElementById("admin-panel-overlay")?.remove();
    adminCalendarCursor = new Date();
    const overlay = document.createElement("div");
    overlay.id = "admin-panel-overlay";
    overlay.className = "admin-panel-overlay";
    overlay.innerHTML = `
      <div class="admin-panel-inner">
        <div class="admin-panel-header">
          <h2>管理后台</h2>
          <button data-admin-action="close-admin" class="admin-close-btn" type="button" aria-label="关闭">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="admin-panel-body">
          ${renderAdminSections()}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    bindAdminPanel(overlay);
  }

  function renderAdminSections() {
    return `
      ${renderAdminSeasonSection()}
      ${renderAdminAchievementSection()}
      ${renderAdminTitleSection()}
      ${renderAdminLotterySection()}
      ${renderAdminCalendarSection()}
      ${renderAdminSampleDataSection()}
      ${renderAdminDataSection()}
      ${renderAdminPasswordSection()}
    `;
  }

  function refreshAdminPanel(overlay = document.getElementById("admin-panel-overlay")) {
    const body = overlay?.querySelector(".admin-panel-body");
    if (body) body.innerHTML = renderAdminSections();
    refreshVisibleRoute();
  }

  function refreshVisibleRoute() {
    const routeId = currentRoute();
    if (routeId === "season") renderSeason(view);
    if (routeId === "achievements") renderAchievements(view);
    if (routeId === "schedule") window.MochiCalendar?.renderSchedule?.(view);
    if (routeId === "settings") renderSettings(view);
    if (routeId === "home") window.MochiFarm?.renderFarm?.(view);
    if (routeId === "learn") renderLearn(view);
    if (routeId === "today") renderLearn(view, "today");
    if (routeId === "review") renderLearn(view, "review");
    if (routeId === "map") renderLearn(view, "map");
  }

  function renderAdminSeasonSection() {
    const current = loadCurrentSeason();
    const defaultEnd = dateKeyFromDate(addDays(parseDateAtNoon(todayKey()), 56));
    const nextId = nextSeasonId(current, loadSeasonArchives());
    return `
      <section class="admin-section">
        <h3>赛季管理</h3>
        ${current?.status === "active" ? `
          <div class="admin-row">
            <span>当前赛季：<strong>${escapeHtml(current.name)}</strong>（${escapeHtml(current.startDate)} - ${escapeHtml(current.endDate)}）</span>
          </div>
          <div class="admin-row admin-row-actions">
            <button class="btn btn-soft btn-sm" data-admin-action="end-season" type="button">结束当前赛季</button>
          </div>
        ` : `<p class="muted admin-help">当前没有进行中的赛季</p>`}
        <div class="admin-row">
          <label for="admin-season-name">新赛季名称</label>
          <input type="text" id="admin-season-name" class="admin-input" placeholder="如：第二赛季" value="${nextId === "S1" ? "第一赛季" : `第${nextId.slice(1)}赛季`}" />
        </div>
        <div class="admin-row">
          <label for="admin-season-end">结束日期</label>
          <input type="date" id="admin-season-end" class="admin-input" value="${defaultEnd}" />
        </div>
        <button class="btn btn-primary btn-sm" data-admin-action="start-season" type="button" ${current?.status === "active" ? "disabled" : ""}>开启新赛季</button>
      </section>
    `;
  }

  function adminAchievementFields() {
    const cfg = loadAchievementConfig();
    return [
      { key: "small.focusHours", label: "小勋章：专注间隔（小时）", val: cfg.small.focusHours },
      { key: "small.studyDays", label: "小勋章：打卡间隔（天）", val: cfg.small.studyDays },
      { key: "small.recordCount", label: "小勋章：记录间隔（条）", val: cfg.small.recordCount },
      { key: "small.balancedWeeks", label: "小勋章：均衡周间隔", val: cfg.small.balancedWeeks },
      { key: "small.harvests", label: "小勋章：收获间隔（次）", val: cfg.small.harvests },
      { key: "big.nodeRecords", label: "大勋章：知识深耕（条/点）", val: cfg.big.nodeRecords },
      { key: "big.totalRecords", label: "大勋章：总记录间隔（条）", val: cfg.big.totalRecords },
      { key: "big.focusHours", label: "大勋章：专注里程碑（小时）", val: cfg.big.focusHours },
      { key: "big.farmLevelStep", label: "大勋章：农场升级间隔", val: cfg.big.farmLevelStep },
      { key: "big.studyDays", label: "大勋章：长期坚持（天）", val: cfg.big.studyDays },
      { key: "lottery.smallPerDraw", label: "抽奖：小勋章兑换比例", val: cfg.lottery.smallPerDraw },
      { key: "lottery.bigPerDraw", label: "抽奖：大勋章兑换比例", val: cfg.lottery.bigPerDraw },
    ];
  }

  function renderAdminAchievementSection() {
    return `
      <section class="admin-section">
        <h3>勋章参数</h3>
        ${adminAchievementFields().map((field) => `
          <div class="admin-row">
            <label>${field.label}</label>
            <input type="number" min="1" class="admin-input admin-input-sm" data-admin-achievement-key="${field.key}" value="${field.val}" />
          </div>
        `).join("")}
        <button class="btn btn-primary btn-sm" data-admin-action="save-achievement-cfg" type="button">保存勋章参数</button>
      </section>
    `;
  }

  function renderAdminTitleSection() {
    const cfg = loadAdminConfig();
    const thresholds = Array.isArray(cfg.season?.titleThresholds) ? cfg.season.titleThresholds : GAME_CONFIG_DEFAULTS.season.titleThresholds;
    return `
      <section class="admin-section">
        <h3>称号阈值（每级需要的记录数）</h3>
        <div class="admin-title-grid">
          ${SEASON_TITLES.map((title, index) => `
            <div class="admin-title-row">
              <span class="admin-title-name">Lv${title.level} ${escapeHtml(title.label)}</span>
              <input type="number" min="0" class="admin-input admin-input-sm" data-admin-title-index="${index}" value="${Number(thresholds[index] || 0)}" />
            </div>
          `).join("")}
        </div>
        <button class="btn btn-primary btn-sm" data-admin-action="save-title-cfg" type="button">保存称号阈值</button>
      </section>
    `;
  }

  function renderAdminLotterySection() {
    const cfg = loadLotteryConfig();
    return `
      <section class="admin-section">
        <h3>抽奖转盘内容</h3>
        <div id="admin-lottery-items">
          ${cfg.items.map((item, index) => renderAdminLotteryItem(item, index)).join("")}
        </div>
        <div class="admin-row-actions">
          <button class="btn btn-soft btn-sm" data-admin-action="add-lottery-item" type="button">+ 添加项目</button>
          <button class="btn btn-primary btn-sm" data-admin-action="save-lottery-cfg" type="button">保存转盘</button>
        </div>
      </section>
    `;
  }

  function renderAdminLotteryItem(item = {}, index = 0) {
    return `
      <div class="admin-lottery-item" data-item-index="${index}">
        <input type="text" class="admin-input" placeholder="项目名称" data-field="label" value="${escapeHtml(item.label || "")}" />
        <select class="admin-input admin-input-sm" data-field="type">
          <option value="reward" ${item.type === "reward" ? "selected" : ""}>奖励</option>
          <option value="bigReward" ${item.type === "bigReward" ? "selected" : ""}>大奖</option>
          <option value="punish" ${item.type === "punish" ? "selected" : ""}>惩罚</option>
        </select>
        <input type="number" min="1" max="100" class="admin-input admin-input-sm" placeholder="权重" data-field="weight" value="${Number(item.weight || 10)}" />
        <button class="btn-icon" data-admin-action="remove-lottery-item" type="button" aria-label="删除项目">删除</button>
      </div>
    `;
  }

  function loadHolidayDates() {
    const dates = new Set();
    getHolidays().forEach((holiday) => {
      if (!holiday?.start || !holiday?.end) return;
      const cursor = parseDateAtNoon(holiday.start);
      const end = parseDateAtNoon(holiday.end);
      while (cursor <= end) {
        dates.add(dateKeyFromDate(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    return [...dates].sort();
  }

  function isSingleDayHoliday(holiday) {
    return holiday?.start && holiday.start === holiday.end;
  }

  function holidayContainsDate(holiday, date) {
    return holiday?.start && holiday?.end && date >= holiday.start && date <= holiday.end;
  }

  function removeHolidayDate(date) {
    const next = [];
    getHolidays().forEach((holiday) => {
      if (!holidayContainsDate(holiday, date)) {
        next.push(holiday);
        return;
      }
      if (isSingleDayHoliday(holiday)) return;
      const start = parseDateAtNoon(holiday.start);
      const end = parseDateAtNoon(holiday.end);
      const target = parseDateAtNoon(date);
      const beforeEnd = new Date(target);
      beforeEnd.setDate(beforeEnd.getDate() - 1);
      const afterStart = new Date(target);
      afterStart.setDate(afterStart.getDate() + 1);
      if (start <= beforeEnd) {
        next.push({ ...holiday, id: `${holiday.id}_before_${date}`, end: dateKeyFromDate(beforeEnd) });
      }
      if (afterStart <= end) {
        next.push({ ...holiday, id: `${holiday.id}_after_${date}`, start: dateKeyFromDate(afterStart) });
      }
    });
    saveHolidays(next.sort((a, b) => a.start.localeCompare(b.start)));
  }

  function addHolidayDate(date) {
    const holidays = getHolidays();
    if (holidays.some((holiday) => holidayContainsDate(holiday, date))) return;
    holidays.push({ id: `admin_${date}`, label: "管理后台放假日", start: date, end: date });
    saveHolidays(holidays.sort((a, b) => a.start.localeCompare(b.start)));
  }

  function renderAdminCalendarSection() {
    const holidays = loadHolidayDates();
    const year = adminCalendarCursor.getFullYear();
    const month = adminCalendarCursor.getMonth();
    return `
      <section class="admin-section">
        <h3>学年日历（放假日设置）</h3>
        <p class="muted admin-help">点击日期切换上学/放假状态。绿色=放假（计入学习统计），灰色=上学日。</p>
        <div class="admin-calendar-controls">
          <button class="btn btn-soft btn-sm" data-admin-action="mark-weekends" type="button">标记全年周六日为放假</button>
          <button class="btn btn-soft btn-sm" data-admin-action="clear-holidays" type="button">清空所有放假日</button>
        </div>
        <div class="admin-calendar-import">
          <textarea id="admin-holiday-import" class="admin-input" rows="3" placeholder="批量导入：粘贴日期，逗号或换行分隔，如 2026-01-01,2026-01-02"></textarea>
          <button class="btn btn-soft btn-sm" data-admin-action="import-holidays" type="button">导入</button>
        </div>
        <div id="admin-calendar-grid">
          ${renderAdminMonthCalendar(year, month, holidays)}
        </div>
        <div class="admin-calendar-nav">
          <button class="btn btn-soft btn-sm" data-admin-action="prev-month" type="button">上个月</button>
          <button class="btn btn-soft btn-sm" data-admin-action="next-month" type="button">下个月</button>
        </div>
      </section>
    `;
  }

  function renderAdminMonthCalendar(year, month, holidays) {
    const holidaySet = new Set(holidays);
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabel = `${year}年${month + 1}月`;
    let cells = `<p class="admin-calendar-label">${monthLabel}</p><div class="admin-cal-weekdays">${["日", "一", "二", "三", "四", "五", "六"].map((day) => `<span>${day}</span>`).join("")}</div><div class="admin-cal-grid">`;
    for (let i = 0; i < firstDay; i += 1) cells += `<div></div>`;
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const holiday = holidaySet.has(dateStr);
      cells += `<button class="admin-cal-day ${holiday ? "holiday" : ""}" data-admin-action="toggle-holiday" data-date="${dateStr}" type="button">${day}</button>`;
    }
    cells += `</div>`;
    return cells;
  }

  function sampleNode(subject, label) {
    const nodes = window.MochiKnowledge?.SUBJECTS?.[subject]?.nodes || [];
    return nodes.find((node) => node.label === label) || nodes[0] || { id: "", label };
  }

  function sampleDate(daysAgo) {
    return dateKeyFromDate(addDays(parseDateAtNoon(todayKey()), -Number(daysAgo || 0)));
  }

  function buildSampleCards() {
    const rows = [
      {
        id: "sample_lesson_physics_electric_1",
        daysAgo: 9,
        subject: "physics",
        nodeLabel: "电场",
        stars: 1,
        painPoint: "电量$q$公式中$\\Phi$的计算容易把物理量和几何面积混在一起。",
        originalQuestion: "匀强电场中面积为$S$的平面与电场方向夹角为$\\theta$，求电通量$\\Phi$。",
        routine: "第一步：先画法线方向\n第二步：用$\\Phi=ES\\cos\\theta$判断角度\n第三步：再联系$q=It$核对单位",
        meta: { source: "lesson", errorType: "公式含义混淆", tags: ["电场", "公式辨析"], confidence: 2, timeSpentMinutes: 18 },
      },
      {
        id: "sample_review_physics_electric_1",
        daysAgo: 4,
        subject: "physics",
        nodeLabel: "电场",
        stars: 2,
        painPoint: "复习时能写出$\\Phi$，但容易把夹角取反。",
        originalQuestion: "复习题：同一电场中，平面旋转后$\\Phi$如何变化？",
        routine: "第一步：标出平面法线\n第二步：找法线和电场的夹角\n第三步：代入余弦判断变大还是变小",
        meta: { source: "review", reviewResult: "看提示做对", stuckStep: "夹角对象判断不稳", keyInsight: "电通量看法线，不看平面本身", tags: ["复习", "电通量"], confidence: 3, timeSpentMinutes: 12 },
      },
      {
        id: "sample_quiz_math_function_1",
        daysAgo: 2,
        subject: "math",
        nodeLabel: "函数",
        stars: 2,
        painPoint: "看到$f(x+a)$时会忘记先整体替换$x$。",
        originalQuestion: "已知$f(x)=x^2-2x$，求$f(x+1)-f(x)$。",
        routine: "第一步：把$x+1$整体代入\n第二步：展开后再合并同类项",
        meta: { source: "quiz", reviewResult: "小测部分做对", errorType: "代换顺序不稳", tags: ["函数代换"], confidence: 3, timeSpentMinutes: 9 },
      },
      {
        id: "sample_lesson_math_derivative_1",
        daysAgo: 6,
        subject: "math",
        nodeLabel: "导数",
        stars: 1,
        painPoint: "导数符号和单调区间对应关系不够熟。",
        originalQuestion: "讨论函数$f(x)=x^3-3x$的单调区间。",
        routine: "第一步：求$f'(x)$\n第二步：解$f'(x)>0$和$f'(x)<0$\n第三步：按区间写结论",
        meta: { source: "lesson", errorType: "符号区间", tags: ["导数", "单调性"], confidence: 2, timeSpentMinutes: 16 },
      },
      {
        id: "sample_review_chem_equilibrium_1",
        daysAgo: 3,
        subject: "chemistry",
        nodeLabel: "化学平衡",
        stars: 2,
        painPoint: "压强变化时会漏看气体系数和。",
        originalQuestion: "恒温下改变压强，判断$N_2+3H_2\\rightleftharpoons2NH_3$平衡移动方向。",
        routine: "第一步：只比较气体系数和\n第二步：增压向气体系数小的一侧移动",
        meta: { source: "review", reviewResult: "基本掌握", stuckStep: "气体系数比较慢", tags: ["化学平衡"], confidence: 3, timeSpentMinutes: 11 },
      },
      {
        id: "sample_lesson_chem_redox_1",
        daysAgo: 1,
        subject: "chemistry",
        nodeLabel: "氧化还原反应",
        stars: 3,
        painPoint: "这次能稳定用化合价升降判断氧化剂。",
        originalQuestion: "判断反应中氧化剂和还原剂。",
        routine: "第一步：标化合价\n第二步：升失氧化，降得还原\n第三步：回到物质名称作答",
        meta: { source: "lesson", keyInsight: "先标价再判断，不凭感觉", tags: ["氧化还原"], confidence: 4, timeSpentMinutes: 10 },
      },
      {
        id: "sample_quiz_physics_kinematics_1",
        daysAgo: 0,
        subject: "physics",
        nodeLabel: "运动学",
        stars: 2,
        painPoint: "追及题没有先统一正方向。",
        originalQuestion: "甲乙同向运动，已知$v_0$和$a$，求相遇时间。",
        routine: "第一步：统一正方向\n第二步：分别写位移表达式\n第三步：令位移差等于初始距离",
        meta: { source: "quiz", reviewResult: "独立做对一半", errorType: "建模慢", tags: ["追及相遇"], confidence: 3, timeSpentMinutes: 14 },
      },
    ];

    return rows.map((row) => {
      const node = sampleNode(row.subject, row.nodeLabel);
      return {
        log: {
          id: row.id,
          date: sampleDate(row.daysAgo),
          subject: row.subject,
          nodeId: node.id,
          nodeLabel: node.label,
          questionsCompleted: 1,
          stars: row.stars,
          painPoint: row.painPoint,
          originalQuestion: row.originalQuestion,
          routine: row.routine,
        },
        meta: row.meta,
      };
    });
  }

  function sampleCardCount() {
    return readStudyLogs().filter((log) => String(log.id || "").startsWith("sample_")).length;
  }

  function clearSampleCards() {
    const sampleIds = new Set(readStudyLogs().filter((log) => String(log.id || "").startsWith("sample_")).map((log) => log.id));
    writeStudyLogs(readStudyLogs().filter((log) => !sampleIds.has(log.id)));
    const meta = readStudyCardMeta();
    sampleIds.forEach((id) => delete meta[id]);
    writeStudyCardMeta(meta);
    window.MochiCards?.refresh?.();
    checkAndGrantAchievements();
  }

  function importSampleCards() {
    clearSampleCards();
    const samples = buildSampleCards();
    writeStudyLogs([...samples.map((item) => item.log), ...readStudyLogs()]);
    samples.forEach((item) => setStudyCardMeta(item.log.id, item.meta));
    const farmState = window.MochiFarm?.readState?.() || {};
    farmState.plots = farmState.plots || {};
    ["math", "physics", "chemistry"].forEach((subject) => {
      const count = samples.filter((item) => item.log.subject === subject).length;
      farmState.plots[subject] = farmState.plots[subject] || {};
      farmState.plots[subject].recordCount = Math.max(Number(farmState.plots[subject].recordCount || 0), count);
    });
    farmState.xp = Math.max(Number(farmState.xp || 0), samples.length * 3);
    window.MochiFarm?.saveState?.(farmState);
    checkAndGrantAchievements();
    window.MochiCards?.refresh?.();
    refreshVisibleRoute();
    renderDebugPanel();
  }

  function renderAdminSampleDataSection() {
    return `
      <section class="admin-section">
        <h3>默认测试卡片</h3>
        <p class="muted admin-help">一键导入学习、复习、小测三类样例卡片，包含多科目、多星级和公式文本，方便新版本直接检查首页、学习档案和复习队列排版。</p>
        <div class="admin-row">
          <span>当前样例卡片：<strong>${sampleCardCount()}</strong> 张</span>
        </div>
        <div class="admin-row-actions">
          <button class="btn btn-primary btn-sm" data-admin-action="import-sample-cards" type="button">导入/刷新测试卡片</button>
          <button class="btn btn-soft btn-sm" data-admin-action="clear-sample-cards" type="button">清除测试卡片</button>
        </div>
      </section>
    `;
  }

  function renderAdminDataSection() {
    const farmState = window.MochiFarm?.readState?.() || {};
    const plots = farmState.plots || {};
    const achState = loadAchievementState();
    return `
      <section class="admin-section">
        <h3>数据调整</h3>
        <p class="muted admin-help">用于版本更新或数据迁移后手动补齐数据，保存后立即生效。</p>

        <p style="font-size:12px;font-weight:600;margin:12px 0 4px;color:var(--muted)">农场进度</p>
        <div class="admin-row">
          <label>数学 recordCount</label>
          <input type="number" min="0" class="admin-input admin-input-sm" id="adj-math-rc" value="${Number(plots.math?.recordCount || 0)}" />
        </div>
        <div class="admin-row">
          <label>物理 recordCount</label>
          <input type="number" min="0" class="admin-input admin-input-sm" id="adj-physics-rc" value="${Number(plots.physics?.recordCount || 0)}" />
        </div>
        <div class="admin-row">
          <label>化学 recordCount</label>
          <input type="number" min="0" class="admin-input admin-input-sm" id="adj-chemistry-rc" value="${Number(plots.chemistry?.recordCount || 0)}" />
        </div>
        <div class="admin-row">
          <label>totalHarvests（总收获次数）</label>
          <input type="number" min="0" class="admin-input admin-input-sm" id="adj-total-harvests" value="${Number(farmState.totalHarvests || 0)}" />
        </div>
        <div class="admin-row">
          <label>农场 XP</label>
          <input type="number" min="0" class="admin-input admin-input-sm" id="adj-farm-xp" value="${Number(farmState.xp || 0)}" />
        </div>

        <p style="font-size:12px;font-weight:600;margin:12px 0 4px;color:var(--muted)">勋章 / 抽奖</p>
        <div class="admin-row">
          <label>totalSmall（累计小勋章）</label>
          <input type="number" min="0" class="admin-input admin-input-sm" id="adj-total-small" value="${Number(achState.totalSmall || 0)}" />
        </div>
        <div class="admin-row">
          <label>totalBig（累计大勋章）</label>
          <input type="number" min="0" class="admin-input admin-input-sm" id="adj-total-big" value="${Number(achState.totalBig || 0)}" />
        </div>
        <div class="admin-row">
          <label>lotteryTickets（可用抽奖次数）</label>
          <input type="number" min="0" class="admin-input admin-input-sm" id="adj-lottery-tickets" value="${Number(achState.lotteryTickets || 0)}" />
        </div>
        <div class="admin-row">
          <label>usedLotteryCount（已用抽奖次数）</label>
          <input type="number" min="0" class="admin-input admin-input-sm" id="adj-used-lottery" value="${Number(achState.usedLotteryCount || 0)}" />
        </div>

        <p style="font-size:12px;font-weight:600;margin:12px 0 4px;color:var(--muted)">补录专注记录</p>
        <div class="admin-row">
          <label>日期</label>
          <input type="date" class="admin-input admin-input-sm" id="adj-focus-date" value="${todayKey()}" />
        </div>
        <div class="admin-row">
          <label>专注分钟数</label>
          <input type="number" min="1" class="admin-input admin-input-sm" id="adj-focus-mins" value="25" />
        </div>

        <div style="margin-top:12px">
          <button class="btn btn-primary" data-admin-action="save-data-adjust">保存数据调整</button>
        </div>
      </section>
    `;
  }

  function renderAdminPasswordSection() {
    return `
      <section class="admin-section">
        <h3>修改管理员密码</h3>
        <div class="admin-row">
          <input type="password" id="admin-new-pwd" class="admin-input" placeholder="新密码（留空不修改）" autocomplete="new-password" />
        </div>
        <button class="btn btn-soft btn-sm" data-admin-action="save-password" type="button">保存密码</button>
      </section>
    `;
  }

  function adminStartSeason(overlay) {
    const name = overlay.querySelector("#admin-season-name")?.value?.trim();
    const endDate = overlay.querySelector("#admin-season-end")?.value;
    if (!name || !endDate) {
      alert("请填写赛季名称和结束日期");
      return;
    }
    const startDate = todayKey();
    if (endDate < startDate) {
      alert("结束日期不能早于今天");
      return;
    }
    const newSeason = {
      id: nextSeasonId(null, loadSeasonArchives()),
      name,
      startDate,
      endDate,
      status: "active",
    };
    saveCurrentSeason(newSeason);
    const achState = loadAchievementState();
    const availableTickets = Number(achState.lotteryTickets || 0);
    const usedTickets = Number(achState.usedLotteryCount || 0);
    achState.small = {};
    achState.big = {};
    achState.totalSmall = 0;
    achState.totalBig = 0;
    achState.recentNew = { small: {}, big: {} };
    achState.carriedLotteryDraws = availableTickets + usedTickets;
    achState.lotteryTickets = availableTickets;
    saveAchievementState(achState);
    refreshAdminPanel(overlay);
    toast(`赛季「${name}」已开启`);
  }

  function adminEndSeason(overlay) {
    if (!confirm("确认结束当前赛季？将生成赛季存档。")) return;
    const current = loadCurrentSeason();
    if (!current) return;
    const ended = { ...current, status: "ended", endDate: todayKey() };
    const snapshot = buildSeasonSnapshot(ended);
    const archives = loadSeasonArchives().filter((season) => season.id !== ended.id);
    archives.unshift({ ...ended, snapshot });
    saveSeasonArchives(archives);
    saveCurrentSeason(null);
    refreshAdminPanel(overlay);
    toast("赛季已结束，存档已保存");
  }

  function saveAdminAchievementConfig(overlay) {
    const cfg = loadAchievementConfig();
    overlay.querySelectorAll("[data-admin-achievement-key]").forEach((input) => {
      setByPath(cfg, input.dataset.adminAchievementKey, Math.max(1, Number(input.value || 1)));
    });
    saveAchievementConfig(cfg);
    const earned = calcAchievements();
    const state = loadAchievementState();
    state.small = { ...earned.small };
    state.big = { ...earned.big };
    state.totalSmall = Object.values(earned.small).reduce((sum, value) => sum + Number(value || 0), 0);
    state.totalBig = Object.values(earned.big).reduce((sum, value) => sum + Number(value || 0), 0);
    state.recentNew = { small: {}, big: {} };
    recalcLotteryTickets(state, cfg);
    saveAchievementState(state);
    refreshVisibleRoute();
    toast("勋章参数已保存");
  }

  function saveAdminTitleConfig(overlay) {
    const values = [...overlay.querySelectorAll("[data-admin-title-index]")]
      .sort((a, b) => Number(a.dataset.adminTitleIndex) - Number(b.dataset.adminTitleIndex))
      .map((input) => Math.max(0, Number(input.value || 0)));
    GAME_CONFIG.season.titleThresholds = values.slice(0, SEASON_TITLES.length);
    saveGameConfig();
    refreshVisibleRoute();
    toast("称号阈值已保存");
  }

  function lotteryColorForType(type) {
    if (type === "bigReward") return "#e07020";
    if (type === "punish") return "#9c27b0";
    return "#f5c518";
  }

  function collectAdminLotteryItems(overlay) {
    return [...overlay.querySelectorAll(".admin-lottery-item")]
      .map((row, index) => {
        const label = row.querySelector('[data-field="label"]')?.value?.trim();
        const type = row.querySelector('[data-field="type"]')?.value || "reward";
        const weight = Math.max(1, Number(row.querySelector('[data-field="weight"]')?.value || 10));
        return label ? { id: index + 1, label, type, weight, color: lotteryColorForType(type) } : null;
      })
      .filter(Boolean);
  }

  function saveAdminLotteryConfig(overlay) {
    const items = collectAdminLotteryItems(overlay);
    if (!items.length) {
      alert("至少保留一个转盘项目");
      return;
    }
    localStorage.setItem("lottery_config", JSON.stringify({ items }));
    refreshVisibleRoute();
    toast("转盘内容已保存");
  }

  function markYearWeekendsAsHolidays() {
    const year = adminCalendarCursor.getFullYear();
    const cursor = new Date(year, 0, 1, 12, 0, 0, 0);
    while (cursor.getFullYear() === year) {
      const day = cursor.getDay();
      if (day === 0 || day === 6) addHolidayDate(dateKeyFromDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  function importHolidayDates(overlay) {
    const text = overlay.querySelector("#admin-holiday-import")?.value || "";
    const dates = text.match(/\d{4}-\d{2}-\d{2}/g) || [];
    dates.forEach(addHolidayDate);
    return dates.length;
  }

  function bindAdminPanel(overlay) {
    overlay.addEventListener("click", (event) => {
      const actionEl = event.target.closest("[data-admin-action]");
      if (!actionEl) return;
      const action = actionEl.dataset.adminAction;
      if (action === "close-admin") {
        overlay.remove();
        return;
      }
      if (action === "start-season") {
        adminStartSeason(overlay);
        return;
      }
      if (action === "end-season") {
        adminEndSeason(overlay);
        return;
      }
      if (action === "save-achievement-cfg") {
        saveAdminAchievementConfig(overlay);
        return;
      }
      if (action === "save-title-cfg") {
        saveAdminTitleConfig(overlay);
        return;
      }
      if (action === "add-lottery-item") {
        const list = overlay.querySelector("#admin-lottery-items");
        if (list) list.insertAdjacentHTML("beforeend", renderAdminLotteryItem({ label: "", type: "reward", weight: 10 }, list.children.length));
        return;
      }
      if (action === "remove-lottery-item") {
        actionEl.closest(".admin-lottery-item")?.remove();
        return;
      }
      if (action === "save-lottery-cfg") {
        saveAdminLotteryConfig(overlay);
        return;
      }
      if (action === "toggle-holiday") {
        const date = actionEl.dataset.date;
        if (loadHolidayDates().includes(date)) removeHolidayDate(date);
        else addHolidayDate(date);
        refreshAdminPanel(overlay);
        return;
      }
      if (action === "mark-weekends") {
        markYearWeekendsAsHolidays();
        refreshAdminPanel(overlay);
        toast("已标记本年周六日为放假日");
        return;
      }
      if (action === "clear-holidays") {
        if (!confirm("确认清空所有放假日设置吗？")) return;
        saveHolidays([]);
        refreshAdminPanel(overlay);
        toast("放假日已清空");
        return;
      }
      if (action === "import-holidays") {
        const count = importHolidayDates(overlay);
        refreshAdminPanel(overlay);
        toast(count ? `已导入 ${count} 个日期` : "没有识别到日期");
        return;
      }
      if (action === "prev-month" || action === "next-month") {
        adminCalendarCursor.setMonth(adminCalendarCursor.getMonth() + (action === "next-month" ? 1 : -1));
        refreshAdminPanel(overlay);
        return;
      }
      if (action === "save-data-adjust") {
        saveAdminDataAdjust(overlay);
        return;
      }
      if (action === "import-sample-cards") {
        importSampleCards();
        refreshAdminPanel(overlay);
        toast("默认测试卡片已导入");
        return;
      }
      if (action === "clear-sample-cards") {
        clearSampleCards();
        refreshAdminPanel(overlay);
        refreshVisibleRoute();
        toast("测试卡片已清除");
        return;
      }
      if (action === "save-password") {
        const pwd = overlay.querySelector("#admin-new-pwd")?.value?.trim();
        if (!pwd) {
          toast("密码未修改");
          return;
        }
        localStorage.setItem("admin_password", pwd);
        overlay.querySelector("#admin-new-pwd").value = "";
        toast("管理员密码已保存");
      }
    });
  }

  function saveAdminDataAdjust(overlay) {
    const farmState = window.MochiFarm?.readState?.() || {};
    const plots = farmState.plots || {};

    plots.math = plots.math || {};
    plots.math.recordCount = Math.max(0, Number(overlay.querySelector("#adj-math-rc")?.value || 0));
    plots.physics = plots.physics || {};
    plots.physics.recordCount = Math.max(0, Number(overlay.querySelector("#adj-physics-rc")?.value || 0));
    plots.chemistry = plots.chemistry || {};
    plots.chemistry.recordCount = Math.max(0, Number(overlay.querySelector("#adj-chemistry-rc")?.value || 0));
    farmState.totalHarvests = Math.max(0, Number(overlay.querySelector("#adj-total-harvests")?.value || 0));
    farmState.xp = Math.max(0, Number(overlay.querySelector("#adj-farm-xp")?.value || 0));
    farmState.plots = plots;
    window.MochiFarm?.saveState?.(farmState);

    const achState = loadAchievementState();
    achState.totalSmall = Math.max(0, Number(overlay.querySelector("#adj-total-small")?.value || 0));
    achState.totalBig = Math.max(0, Number(overlay.querySelector("#adj-total-big")?.value || 0));
    achState.lotteryTickets = Math.max(0, Number(overlay.querySelector("#adj-lottery-tickets")?.value || 0));
    achState.usedLotteryCount = Math.max(0, Number(overlay.querySelector("#adj-used-lottery")?.value || 0));
    saveAchievementState(achState);

    const focusDate = overlay.querySelector("#adj-focus-date")?.value;
    const focusMins = Math.max(1, Number(overlay.querySelector("#adj-focus-mins")?.value || 0));
    if (focusDate && focusMins > 0) {
      const focusLogs = readFocusLogs();
      focusLogs.push({
        id: `manual_focus_${Date.now()}`,
        type: "focus",
        date: focusDate,
        duration: focusMins,
        completed: true,
      });
      localStorage.setItem("focus_log", JSON.stringify(focusLogs));
    }

    refreshAdminPanel(overlay);
    refreshVisibleRoute();
    toast("数据已保存");
  }

  function renderSettings(container) {
    const config = window.MochiAI.readConfig();
    const mode = holidayMode();
    const focusEndSound = localStorage.getItem("focus_end_sound") || "soft";
    const restReminderSound = localStorage.getItem("rest_reminder_sound") || "melody";
    const readingPreferences = readReadingPreferences();
    container.innerHTML = `
      <div class="page-head">
        <div>
          <h2>设置</h2>
          <p>API Key 和学习数据只保存在本地浏览器。</p>
        </div>
      </div>
      <div class="grid schedule-grid">
        <section class="card settings-section">
          <h3>阅读外观</h3>
          <div class="settings-row">
            <div>
              <strong>复习 / 学习档案字体</strong>
              <p class="muted" style="font-size:13px;margin-top:2px">换复习队列、学习档案、卡片原题和复习材料里的阅读字体。</p>
            </div>
            <select id="reading-font-select" class="settings-select settings-select-wide" aria-label="复习和学习档案字体">
              ${readingOptionTags(READING_FONT_OPTIONS, readingPreferences.font.value)}
            </select>
          </div>
          <div class="settings-row">
            <div>
              <strong>阅读字号</strong>
              <p class="muted" style="font-size:13px;margin-top:2px">只放大复习和学习档案里的正文，不影响导航和按钮布局。</p>
            </div>
            <select id="reading-size-select" class="settings-select settings-select-wide" aria-label="复习和学习档案字号">
              ${readingOptionTags(READING_SIZE_OPTIONS, readingPreferences.size.value)}
            </select>
          </div>
          <div class="settings-reading-preview" data-reading-preview>
            <strong data-reading-current>${escapeHtml(readingPreferences.font.label)} · ${escapeHtml(readingPreferences.size.label)}</strong>
            <p>例：函数图像的平移、受力分析、离子方程式。原题和卡点要一眼看清，字要圆一点、稳一点，也要够大。</p>
            <p class="muted" data-reading-hint style="margin-top:6px">${escapeHtml(readingPreferences.font.hint)}</p>
          </div>
        </section>
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
          <p class="muted">备份会打包当前浏览器里保存的全部 Mochii 数据。恢复会覆盖当前数据。</p>
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
            <p class="field-hint">删除当前浏览器里 Mochii 的全部已知数据和设置，适合彻底重来。</p>
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
          <p class="muted">Mochii v3.0 · 原生 HTML/CSS/JavaScript · 粘贴学习记录驱动档案、农场和日历。</p>
        </section>
      </div>
    `;
    updateReadingPreview(container);
  }

  function renderAchievements(container) {
    checkAndGrantAchievements();
    const state = recalcLotteryTickets(loadAchievementState());
    saveAchievementState(state);
    const cfg = loadAchievementConfig();
    const earned = calcAchievements();
    const progress = buildAchievementProgress(cfg);

    container.innerHTML = `
      <div class="page-head">
        <div>
          <h2>勋章收藏</h2>
          <p>勋章会按累计阈值重复获得，自动换成抽奖机会。</p>
        </div>
      </div>

      <section class="card lottery-entry-card">
        <div class="lottery-entry-inner">
          <div class="lottery-tickets-display">
            <span class="lottery-tickets-num">${state.lotteryTickets || 0}</span>
            <span class="lottery-tickets-label">次抽奖机会</span>
          </div>
          <button class="btn btn-primary" data-action="open-lottery" ${(state.lotteryTickets || 0) === 0 ? "disabled" : ""}>
            <span class="material-symbols-outlined">casino</span>
            去抽奖
          </button>
        </div>
        <p class="muted lottery-rule-text">
          每 ${cfg.lottery.smallPerDraw} 个小勋章或 ${cfg.lottery.bigPerDraw} 个大勋章换 1 次抽奖
        </p>
      </section>

      <section class="card">
        <div class="badge-summary">
          <div class="badge-summary-item">
            <span class="badge-summary-num">${state.totalBig || 0}</span>
            <span class="badge-summary-label">大勋章</span>
          </div>
          <div class="badge-summary-divider"></div>
          <div class="badge-summary-item">
            <span class="badge-summary-num">${state.totalSmall || 0}</span>
            <span class="badge-summary-label">小勋章</span>
          </div>
          <div class="badge-summary-divider"></div>
          <div class="badge-summary-item">
            <span class="badge-summary-num">${state.usedLotteryCount || 0}</span>
            <span class="badge-summary-label">已抽奖</span>
          </div>
        </div>
      </section>

      <section class="card">
        <h3 style="margin-bottom:16px">大勋章</h3>
        <div class="badge-grid">
          ${renderBadgeItem("big", "nodeRecords", "知识深耕", `每 ${cfg.big.nodeRecords} 条/知识点`, earned.big.nodeRecords, state.recentNew?.big?.nodeRecords || 0, "book_4", progress.big.nodeRecords)}
          ${renderBadgeItem("big", "totalRecords", "刷题达人", `每累计 ${cfg.big.totalRecords} 条记录`, earned.big.totalRecords, state.recentNew?.big?.totalRecords || 0, "edit_note", progress.big.totalRecords)}
          ${renderBadgeItem("big", "focusHours", "专注大师", `每累计 ${cfg.big.focusHours} 小时专注`, earned.big.focusHours, state.recentNew?.big?.focusHours || 0, "timer", progress.big.focusHours)}
          ${renderBadgeItem("big", "farmLevel", "农场传说", `农场每升 ${cfg.big.farmLevelStep} 级`, earned.big.farmLevel, state.recentNew?.big?.farmLevel || 0, "agriculture", progress.big.farmLevel)}
          ${renderBadgeItem("big", "studyDays", "长期坚持", `每累计 ${cfg.big.studyDays} 个学习日`, earned.big.studyDays, state.recentNew?.big?.studyDays || 0, "calendar_month", progress.big.studyDays)}
        </div>
      </section>

      <section class="card">
        <h3 style="margin-bottom:16px">小勋章</h3>
        <div class="badge-grid">
          ${renderBadgeItem("small", "focusHours", "专注时光", `每 ${cfg.small.focusHours} 小时专注`, earned.small.focusHours, state.recentNew?.small?.focusHours || 0, "local_fire_department", progress.small.focusHours)}
          ${renderBadgeItem("small", "studyDays", "坚持打卡", `每 ${cfg.small.studyDays} 个学习日`, earned.small.studyDays, state.recentNew?.small?.studyDays || 0, "check_circle", progress.small.studyDays)}
          ${renderBadgeItem("small", "recordCount", "勤奋记录", `每 ${cfg.small.recordCount} 条记录`, earned.small.recordCount, state.recentNew?.small?.recordCount || 0, "menu_book", progress.small.recordCount)}
          ${renderBadgeItem("small", "balancedWeeks", "均衡发展", `每 ${cfg.small.balancedWeeks} 个三科均衡周`, earned.small.balancedWeeks, state.recentNew?.small?.balancedWeeks || 0, "balance", progress.small.balancedWeeks)}
          ${renderBadgeItem("small", "harvests", "丰收季节", `每收获 ${cfg.small.harvests} 次农场`, earned.small.harvests, state.recentNew?.small?.harvests || 0, "psychiatry", progress.small.harvests)}
        </div>
      </section>

      ${renderLotteryHistory()}
    `;
  }

  function renderLotteryHistory() {
    const history = JSON.parse(localStorage.getItem("lottery_history") || "[]");
    if (history.length === 0) {
      return `
        <section class="card">
          <h3 style="margin-bottom:12px">抽奖历史</h3>
          <p class="muted" style="text-align:center;padding:16px 0">暂无抽奖记录</p>
        </section>
      `;
    }
    const rows = history.map((entry) => {
      const typeMap = { bigReward: ["大奖", "#e07020"], reward: ["奖励", "#4caf50"], punish: ["任务", "#9c27b0"] };
      const [typeLabel, typeColor] = typeMap[entry.type] || ["奖励", "#4caf50"];
      return `
        <div class="lottery-history-item">
          <span class="lottery-history-date">${escapeHtml(entry.date || "")}</span>
          <span class="lottery-history-label" style="color:${typeColor}">${escapeHtml(entry.label || "")}</span>
          <span class="lottery-history-type" style="background:${typeColor}22;color:${typeColor}">${typeLabel}</span>
        </div>
      `;
    }).join("");
    return `
      <section class="card">
        <h3 style="margin-bottom:12px">抽奖历史</h3>
        <div class="lottery-history-list">${rows}</div>
      </section>
    `;
  }

  function renderBadgeItem(type, key, label, desc, totalEarned, newCount, icon, progress) {
    const pendingCount = Math.max(0, Number(newCount || 0));
    const rule = progress || {};
    return `
      <details class="badge-item ${pendingCount > 0 ? "badge-new" : ""}" data-badge-type="${type}" data-badge-key="${key}">
        <summary class="badge-summary-row">
          <div class="badge-icon"><span class="material-symbols-outlined">${icon}</span></div>
          <div class="badge-info">
            <strong>${label}</strong>
            <span class="muted">${desc}</span>
          </div>
          <div class="badge-count">
            <span class="badge-total">x${Number(totalEarned || 0)}</span>
            ${pendingCount > 0 ? `<span class="badge-new-tag">+${pendingCount}</span>` : ""}
          </div>
          <span class="material-symbols-outlined badge-expand-icon">expand_more</span>
        </summary>
        <div class="badge-rule">
          <p><strong>获得条件：</strong>${escapeHtml(rule.condition || desc)}</p>
          ${rule.current ? `<p><strong>当前累计：</strong>${escapeHtml(rule.current)}</p>` : ""}
          <p><strong>下一枚：</strong>${escapeHtml(achievementNextHint(rule))}</p>
        </div>
      </details>
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
  let _wheelCurrentAngleDeg = 0;
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
      document.addEventListener("click", stopRestReminderOnce, { once: true });
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
    const fields = parseRecordFields(block);
    const extract = (key) => fields[key] || "";
    const nodeLabel = extract("知识点");
    const subject = subjectKeyFromLabel(extract("科目"));
    const originalQuestion = extract("原题") || "";
    return {
      subject,
      nodeId: nodeIdFromLabel(nodeLabel, subject),
      nodeLabel,
      questionsCompleted: 1,
      stars: Math.max(1, Math.min(3, parseInt(extract("掌握星级"), 10) || 1)),
      painPoint: extract("卡点记录"),
      originalQuestion,
      routine: extract("今日套路"),
      date: normalizeRecordDate(extract("学习日期")),
      meta: normalizeCardMeta({
        source: extract("学习来源"),
        reviewResult: extract("复习结果"),
        errorType: extract("错误类型"),
        stuckStep: extract("卡住步骤"),
        keyInsight: extract("关键突破"),
        tags: parseTags(extract("题型标签")),
        confidence: extract("信心分"),
        timeSpentMinutes: extract("耗时分钟"),
        sourceRecordIds: parseTags(extract("关联记录")),
      }),
    };
  }

  function parseRecordFields(block) {
    const fields = {};
    let activeKey = "";
    block.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      const matchedKey = MOCHI_RECORD_FIELDS.find((key) => trimmed.startsWith(`${key}:`) || trimmed.startsWith(`${key}：`));
      if (matchedKey) {
        activeKey = matchedKey;
        fields[activeKey] = trimmed.replace(new RegExp(`^${matchedKey}[:：]`), "").trim();
        return;
      }
      if (activeKey && trimmed) {
        fields[activeKey] = `${fields[activeKey] ? `${fields[activeKey]}\n` : ""}${trimmed}`;
      }
    });
    return fields;
  }

  function parseTags(value) {
    return String(value || "")
      .split(/[,，、\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function normalizeSource(value) {
    const text = String(value || "").trim().toLowerCase();
    if (!text) return "lesson";
    if (["lesson", "new", "新题", "新题讲解"].some((item) => text.includes(item))) return "lesson";
    if (["复习", "复习测验", "复习卡", "review"].some((item) => text.includes(item))) return "review";
    if (["测验", "小测", "quiz", "test"].some((item) => text.includes(item))) return "quiz";
    if (["复盘", "阶段复盘", "summary", "archive", "reflection"].some((item) => text.includes(item))) return "reflection";
    return "lesson";
  }

  function normalizeCardMeta(meta) {
    const confidence = Number(meta?.confidence || 0);
    const timeSpentMinutes = Number(meta?.timeSpentMinutes || 0);
    return {
      source: normalizeSource(meta?.source),
      reviewResult: String(meta?.reviewResult || "").trim(),
      errorType: String(meta?.errorType || "").trim(),
      stuckStep: String(meta?.stuckStep || "").trim(),
      keyInsight: String(meta?.keyInsight || "").trim(),
      tags: Array.isArray(meta?.tags) ? meta.tags.map((tag) => String(tag).trim()).filter(Boolean) : parseTags(meta?.tags),
      confidence: confidence > 0 ? Math.max(1, Math.min(5, confidence)) : 0,
      timeSpentMinutes: timeSpentMinutes > 0 ? Math.round(timeSpentMinutes) : 0,
      sourceRecordIds: Array.isArray(meta?.sourceRecordIds) ? meta.sourceRecordIds.map((id) => String(id).trim()).filter(Boolean) : parseTags(meta?.sourceRecordIds),
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

## 原题
${record.originalQuestion || "暂无原题描述。"}

## 完成情况
完成题数：1题 · 掌握星级：${stars}
`;
  }

  function applyMochiRecord(record) {
    const logs = readStudyLogs();
    const node = window.MochiKnowledge.getNode(record.nodeId);
    const normalizedLabel = window.MochiCards?.normalizeNodeLabel?.(record.subject, record.nodeLabel || node?.label || "", record.nodeId) || record.nodeLabel || node?.label || "";
    const wasMastered = window.MochiCards?.calcNodeStatus?.(logs, record.subject, normalizedLabel) === "mastered";
    const timerState = window.MochiTimer?.getState?.() || {};
    const activeSessionId = ["focusing", "deciding"].includes(timerState.phase) ? timerState.sessionId : "";
    const logEntry = {
      id: `log_${Date.now()}`,
      date: record.date,
      importedAt: new Date().toISOString(),
      sessionId: activeSessionId || "",
      subject: record.subject,
      nodeId: node?.id || record.nodeId,
      nodeLabel: normalizedLabel,
      questionsCompleted: 1,
      stars: record.stars,
      painPoint: record.painPoint || "",
      originalQuestion: record.originalQuestion || "",
      routine: record.routine || "",
    };
    logs.unshift(logEntry);
    writeStudyLogs(logs);
    setStudyCardMeta(logEntry.id, record.meta);
    const pet = window.MochiPet.addReward({
      xp: GAME_CONFIG.rewards.petXPPerQuestion,
      studyEnergy: 0,
    });
    const farm = window.MochiFarm?.addResources?.({ xp: GAME_CONFIG.rewards.farmXPPerQuestion });
    window.MochiFarm?.addSubjectRecord?.(record.subject);
    checkAndGrantAchievements();
    window.MochiCards?.refresh?.();
    const masteredNow = !wasMastered && window.MochiCards?.calcNodeStatus?.(logs, record.subject, normalizedLabel) === "mastered";
    return { cards: { masteredNow }, pet, farm, note: noteFromRecord({ ...record, nodeLabel: normalizedLabel }) };
  }

  function parsePastedRecordEl(textarea, result) {
    if (!textarea || !result) return;
    const record = parseMochiRecord(textarea.value);
    result.hidden = false;
    if (!record) {
      result.innerHTML = `<strong>没有找到 Mochi 记录块</strong><p class="muted">请把 AI 输出里从 ---MOCHI-RECORD-START--- 到 ---MOCHI-RECORD-END--- 的整段一起粘贴进来；如果少了开头或结尾，MochiStudy 就无法识别。</p>`;
      return;
    }
    const applied = applyMochiRecord(record);
    const subject = window.MochiKnowledge.SUBJECTS[record.subject]?.label || "数学";
    const starIcons = "★".repeat(record.stars) + "☆".repeat(3 - record.stars);
    const farmState = readJson("farm_state");
    const plotCount = farmState?.plots?.[record.subject]?.recordCount || 0;
    const harvestTarget = GAME_CONFIG.farm.harvestTarget || 15;
    const pct = Math.min(100, Math.round((plotCount / harvestTarget) * 100));
    const todayCount = getTodayRecordCount();
    const starMsgMap = ["", "能找到卡点就是进步。", "做到这里就值了。", "完全做对，继续保持。"];
    const starMsg = starMsgMap[record.stars] || "";
    result.innerHTML = `
      <div class="checkin-success">
        <div class="checkin-success-icon">✓</div>
        <strong class="checkin-title">打卡成功！</strong>
        <p class="checkin-detail">${subject} · ${record.nodeLabel} · 1题 · ${starIcons}</p>
        <p class="checkin-saved-msg">已保存到学习档案，可以继续粘贴下一条。</p>
        ${starMsg ? `<p class="checkin-star-msg">${starMsg}</p>` : ""}
        <div class="checkin-farm-bar">
          <div class="checkin-farm-track"><div class="checkin-farm-fill" style="width:${pct}%"></div></div>
          <span class="checkin-farm-label">${subject}地块 ${plotCount}/${harvestTarget}</span>
        </div>
        ${todayCount >= 2 ? `<span class="checkin-today">今天已打卡 ${todayCount} 次</span>` : ""}
      </div>
    `;
    sparkle(result, "★");
    textarea.value = "";
    window.MochiPet.renderMiniState();
    if (!document.body.classList.contains("focus-mode")) {
      window.MochiFarm?.refreshFarmSummary?.();
      refreshVisibleRoute();
    }
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
    const achievements = {
      earned: calcAchievements(),
      state: loadAchievementState(),
    };
    const petState = readStorageJson("mochi_state", {});
    const raw = rawLocalStorageSnapshot();
    return {
      version: BACKUP_VERSION,
      exportDate: todayKey(),
      data: {
        study_log: readStorageJson(STUDY_LOG_KEY, []),
        farm_state: readStorageJson("farm_state", {}),
        pet_state: petState,
        achievements,
        calendar_state: {
          focus_log: readStorageJson("focus_log", []),
          school_holidays: readStorageJson(HOLIDAYS_KEY, DEFAULT_HOLIDAYS),
          holiday_mode_override: readStorageJson(HOLIDAY_MODE_KEY, { mode: "auto" }),
        },
        achievement_state: readStorageJson("achievement_state", {}),
        achievement_config: readStorageJson("achievement_config", {}),
        lottery_config: readStorageJson("lottery_config", {}),
        lottery_history: readStorageJson("lottery_history", []),
        current_season: readStorageJson(CURRENT_SEASON_KEY, null),
        season_archives: readStorageJson(SEASON_ARCHIVES_KEY, []),
        card_order: readStorageJson(CARD_ORDER_KEY, {}),
        study_card_meta: readStorageJson(CARD_META_KEY, {}),
        study_node_summary: readStorageJson(NODE_SUMMARY_KEY, {}),
        game_config: readStorageJson("game_config", {}),
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
    // Accept any 1.x backup — the raw localStorage snapshot makes them fully compatible.
    // Only reject major version changes (2.0+) which indicate a truly breaking format.
    const majorVersion = String(payload.version).split(".")[0];
    if (majorVersion !== "1") return `备份版本 ${payload.version} 不兼容，当前支持版本 1.x`;
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
    if (data.achievement_state && typeof data.achievement_state === "object") {
      localStorage.setItem("achievement_state", JSON.stringify(data.achievement_state));
    }
    if (data.achievement_config && typeof data.achievement_config === "object") {
      localStorage.setItem("achievement_config", JSON.stringify(data.achievement_config));
    }
    if (data.lottery_config && typeof data.lottery_config === "object") {
      localStorage.setItem("lottery_config", JSON.stringify(data.lottery_config));
    }
    if (Array.isArray(data.lottery_history)) {
      localStorage.setItem("lottery_history", JSON.stringify(data.lottery_history));
    }
    if (data.current_season && typeof data.current_season === "object") {
      localStorage.setItem(CURRENT_SEASON_KEY, JSON.stringify(data.current_season));
    }
    if (Array.isArray(data.season_archives)) {
      localStorage.setItem(SEASON_ARCHIVES_KEY, JSON.stringify(data.season_archives));
    }
    if (data.card_order && typeof data.card_order === "object" && !Array.isArray(data.card_order)) {
      localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(data.card_order));
    }
    if (data.study_card_meta && typeof data.study_card_meta === "object" && !Array.isArray(data.study_card_meta)) {
      localStorage.setItem(CARD_META_KEY, JSON.stringify(data.study_card_meta));
    }
    if (data.study_node_summary && typeof data.study_node_summary === "object" && !Array.isArray(data.study_node_summary)) {
      localStorage.setItem(NODE_SUMMARY_KEY, JSON.stringify(data.study_node_summary));
    }
    if (data.game_config && typeof data.game_config === "object") {
      localStorage.setItem("game_config", JSON.stringify(data.game_config));
    }
    // Settings that were added after the initial backup format but before data.localStorage was introduced.
    if (data.api_config && typeof data.api_config === "object") {
      localStorage.setItem("api_config", JSON.stringify(data.api_config));
    }
    if (typeof data.admin_password === "string") {
      localStorage.setItem("admin_password", data.admin_password);
    }
    if (typeof data.sound_reminder_enabled === "string") {
      localStorage.setItem("sound_reminder_enabled", data.sound_reminder_enabled);
    }
    if (typeof data.focus_end_sound === "string") {
      localStorage.setItem("focus_end_sound", data.focus_end_sound);
    }
    if (typeof data.rest_reminder_sound === "string") {
      localStorage.setItem("rest_reminder_sound", data.rest_reminder_sound);
    }
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
    const fixed = [STUDY_LOG_KEY, "focus_log", "farm_state", "mochi_state", "achievement_state", CURRENT_SEASON_KEY, CARD_ORDER_KEY, CARD_META_KEY, NODE_SUMMARY_KEY, "mochi_study_points", "mochi_hearts", "daily_task_settings"];
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
    if (!confirm("这会删除 Mochii 在当前浏览器里的全部数据和设置。请先导出备份。确认恢复出厂设置吗？")) return;
    allDataKeys().forEach((key) => localStorage.removeItem(key));
    toast("本地数据和设置已清空，正在刷新页面");
    location.reload();
  }

  function allDataKeys() {
    const fixed = ["mochi_state", "farm_state", STUDY_LOG_KEY, "focus_log", "achievement_state", "achievement_config", "lottery_config", "lottery_history", CURRENT_SEASON_KEY, SEASON_ARCHIVES_KEY, CARD_ORDER_KEY, CARD_META_KEY, NODE_SUMMARY_KEY, "admin_password", "api_config", HOLIDAYS_KEY, HOLIDAY_MODE_KEY, "mochi_debug_panel_open", "mochi_debug_float_collapsed", "mochi_debug_tab", "game_config", "sound_reminder_enabled", "focus_end_sound", "rest_reminder_sound", READING_FONT_KEY, READING_SIZE_KEY];
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

  function achievementConfigNumberInput(path, value, label = "") {
    return `<label class="debug-config-inline">${label ? `<span>${label}</span>` : ""}<input type="number" data-achievement-config-path="${path}" value="${value}" /></label>`;
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
    const achievementCfg = loadAchievementConfig();
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
      <div class="debug-config-section">
        <h4>赛季称号阈值</h4>
        ${configRow("Lv1-Lv8", cfg.season.titleThresholds.slice(0, 8).map((value, index) => configNumberInput(`season.titleThresholds.${index}`, value, `Lv${index + 1}:`)).join(""))}
        ${configRow("Lv9-Lv16", cfg.season.titleThresholds.slice(8, 16).map((value, index) => configNumberInput(`season.titleThresholds.${index + 8}`, value, `Lv${index + 9}:`)).join(""))}
      </div>
      <div class="debug-config-section">
        <h4>勋章小阈值</h4>
        ${configRow("专注/学习日/记录", [
          achievementConfigNumberInput("small.focusHours", achievementCfg.small.focusHours, "小时:"),
          achievementConfigNumberInput("small.studyDays", achievementCfg.small.studyDays, "天:"),
          achievementConfigNumberInput("small.recordCount", achievementCfg.small.recordCount, "记录:")
        ].join(""))}
        ${configRow("均衡周/收获", [
          achievementConfigNumberInput("small.balancedWeeks", achievementCfg.small.balancedWeeks, "周:"),
          achievementConfigNumberInput("small.harvests", achievementCfg.small.harvests, "收获:")
        ].join(""))}
      </div>
      <div class="debug-config-section">
        <h4>勋章大阈值</h4>
        ${configRow("知识点/总记录", [
          achievementConfigNumberInput("big.nodeRecords", achievementCfg.big.nodeRecords, "单点:"),
          achievementConfigNumberInput("big.totalRecords", achievementCfg.big.totalRecords, "总数:")
        ].join(""))}
        ${configRow("专注/农场/学习日", [
          achievementConfigNumberInput("big.focusHours", achievementCfg.big.focusHours, "小时:"),
          achievementConfigNumberInput("big.farmLevelStep", achievementCfg.big.farmLevelStep, "级:"),
          achievementConfigNumberInput("big.studyDays", achievementCfg.big.studyDays, "天:")
        ].join(""))}
        ${configRow("抽奖兑换", [
          achievementConfigNumberInput("lottery.smallPerDraw", achievementCfg.lottery.smallPerDraw, "小:"),
          achievementConfigNumberInput("lottery.bigPerDraw", achievementCfg.lottery.bigPerDraw, "大:")
        ].join(""))}
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
          <div class="debug-float-row debug-total-row">
            <span>勋章测试</span>
            <strong>${loadAchievementState().lotteryTickets || 0} 抽</strong>
            <div class="debug-float-actions">
              <button data-action="debug-add-records" data-count="10" type="button">+10记录</button>
              <button data-action="debug-add-node-records" data-count="20" type="button">+20同点</button>
              <button data-action="debug-add-focus" data-minutes="120" type="button">+2h专注</button>
              <button data-action="debug-reset-achievements" type="button">清勋章</button>
            </div>
          </div>
          <div class="debug-float-row debug-total-row debug-sample-row">
            <span>样例</span>
            <strong>${sampleCardCount()} 张</strong>
            <div class="debug-float-actions">
              <button data-action="debug-import-sample-cards" type="button">导入测试卡片</button>
              <button data-action="debug-clear-sample-cards" type="button">清样例</button>
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
    if (view && routeId === "season") renderSeason(view);
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
    checkAndGrantAchievements();
    debugRefreshFarm();
  }

  function debugAddRecords(count, sameNode = false) {
    const logs = readStudyLogs();
    const subjects = ["math", "physics", "chemistry"];
    const today = todayKey();
    const nodeLabels = {
      math: "函数",
      physics: "运动学",
      chemistry: "化学反应",
    };
    Array.from({ length: Math.max(1, Number(count || 1)) }).forEach((_, index) => {
      const subject = sameNode ? "math" : subjects[index % subjects.length];
      logs.unshift({
        id: `debug_log_${Date.now()}_${index}`,
        date: today,
        subject,
        nodeLabel: nodeLabels[subject],
        questionsCompleted: 1,
        stars: 3,
        painPoint: "调试记录",
        originalQuestion: "调试生成的原题",
        routine: "第一步：定位条件\n第二步：套用模型",
      });
    });
    writeStudyLogs(logs);
    checkAndGrantAchievements();
    debugRefreshFarm();
    if (currentRoute() === "achievements") renderAchievements(view);
    if ((currentRoute() === "map" || currentRoute() === "learn") && learnActiveTab === "map") window.MochiCards?.refresh?.();
  }

  function debugAddFocusMinutes(minutes) {
    const logs = readFocusLogs();
    logs.push({
      id: `debug_focus_${Date.now()}`,
      date: todayKey(),
      startTime: new Date().toTimeString().slice(0, 5),
      duration: Math.max(1, Number(minutes || 1)),
      type: "focus",
      completed: true,
      microGoal: "调试专注",
    });
    writeJson("focus_log", logs);
    checkAndGrantAchievements();
    debugRefreshFarm();
    if (currentRoute() === "achievements") renderAchievements(view);
  }

  function saveDebugConfig(button) {
    const row = button.closest(".debug-config-row");
    if (!row) return;
    row.querySelectorAll("[data-config-path]").forEach((input) => {
      updateGameConfig(input.dataset.configPath, Number(input.value || 0));
    });
    row.querySelectorAll("[data-achievement-config-path]").forEach((input) => {
      updateAchievementConfig(input.dataset.achievementConfigPath, Number(input.value || 0));
    });
    checkAndGrantAchievements();
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
    if ((routeId === "today" || routeId === "learn") && learnActiveTab === "today") window.MochiTodayStudy?.render?.(document.getElementById("learn-content-pane"));
    if ((routeId === "map" || routeId === "learn") && learnActiveTab === "map") window.MochiCards?.refresh?.();
    if (routeId === "season") renderSeason(view);
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
      if (name === "debug-add-records") {
        debugAddRecords(action.dataset.count, false);
        return;
      }
      if (name === "debug-add-node-records") {
        debugAddRecords(action.dataset.count, true);
        return;
      }
      if (name === "debug-add-focus") {
        debugAddFocusMinutes(action.dataset.minutes);
        return;
      }
      if (name === "debug-reset-achievements") {
        localStorage.removeItem("achievement_state");
        debugRefreshFarm();
        if (currentRoute() === "achievements") renderAchievements(view);
        return;
      }
      if (name === "debug-import-sample-cards") {
        importSampleCards();
        debugRefreshFarm();
        toast("默认测试卡片已导入");
        return;
      }
      if (name === "debug-clear-sample-cards") {
        clearSampleCards();
        debugRefreshFarm();
        refreshVisibleRoute();
        toast("测试卡片已清除");
        return;
      }
      if (name === "debug-save-config") {
        saveDebugConfig(action);
        return;
      }
      if (name === "debug-reset-config") {
        if (confirm("确定重置所有游戏参数为默认值吗？")) {
          localStorage.removeItem("game_config");
          localStorage.removeItem("achievement_config");
          location.reload();
        }
        return;
      }
      if (name === "open-lottery") {
        const state = loadAchievementState();
        if ((state.lotteryTickets || 0) <= 0) return;
        showLotteryOverlay();
        return;
      }
      if (name === "export-season-report") {
        exportSeasonReport();
        return;
      }
      if (name === "view-season") {
        showSeasonArchiveModal(action.dataset.seasonId);
        return;
      }
      if (name === "end-season") {
        endCurrentSeason();
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
      if (name === "skip-rest") {
        window.MochiTimer?.handleAction?.("skip-rest");
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
      () => toast("已复制！"),
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
    if (event.target.id === "season-form") {
      event.preventDefault();
      openSeason(Object.fromEntries(new FormData(event.target)));
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
    if (event.target.id === "reading-font-select") {
      setReadingPreference("font", event.target.value);
      toast("阅读字体已更新");
    }
    if (event.target.id === "reading-size-select") {
      setReadingPreference("size", event.target.value);
      toast("阅读字号已更新");
    }
  }

  function checkSeasonAutoRenew() {
    const current = loadCurrentSeason();
    if (!current || current.status !== "active") return;
    const today = todayKey();
    if (today <= current.endDate) return;

    const snapshot = buildSeasonSnapshot(current);
    const ended = { ...current, status: "ended" };
    const archives = loadSeasonArchives().filter((s) => s.id !== ended.id);
    archives.unshift({ ...ended, snapshot });
    saveSeasonArchives(archives);

    const prevStart = new Date(`${current.startDate}T12:00:00`);
    const prevEnd = new Date(`${current.endDate}T12:00:00`);
    const durationDays = Math.ceil((prevEnd - prevStart) / (1000 * 60 * 60 * 24));
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + durationDays);
    const newEnd = newEndDate.toISOString().slice(0, 10);

    const newId = nextSeasonId(null, archives);
    const newNum = Number(newId.replace(/^S/i, "")) || archives.length + 1;
    const newSeason = {
      id: newId,
      name: `第${newNum}赛季`,
      startDate: today,
      endDate: newEnd,
      status: "active",
    };
    saveCurrentSeason(newSeason);

    const achState = loadAchievementState();
    const carried = Number(achState.lotteryTickets || 0);
    achState.small = {};
    achState.big = {};
    achState.totalSmall = 0;
    achState.totalBig = 0;
    achState.carriedLotteryDraws = (Number(achState.carriedLotteryDraws || 0)) + carried;
    achState.lotteryTickets = carried;
    saveAchievementState(achState);

    toast(`🏆 ${current.name}已结束，${newSeason.name}自动开启！`);
  }

  function init() {
    applyReadingPreferences();
    window.MochiKnowledge.readState();
    window.MochiPet.renderMiniState();
    window.addEventListener("hashchange", () => route());
    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("change", handleChange);
    document.getElementById("mobile-menu")?.addEventListener("click", () => document.querySelector(".side-nav")?.classList.toggle("open"));
    checkSeasonAutoRenew();
    route();
    if (location.search.includes("debug=1")) {
      const debugPanel = document.getElementById("debug-panel");
      if (debugPanel) debugPanel.style.display = "block";
      renderDebugPanel();
    }
    if (new URLSearchParams(location.search).get("admin") === "1") {
      showAdminPasswordPrompt();
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
    applyMochiRecord,
    readStudyLogs,
    writeStudyLogs,
    readFocusLogs,
    parseMochiRecord,
    readJson,
    writeJson,
    readStudyCardMeta,
    writeStudyCardMeta,
    setStudyCardMeta,
    removeStudyCardMeta,
    normalizeCardMeta,
    getHolidays,
    isHolidayToday,
    nextHoliday,
    daysUntilNextHoliday,
    holidayMode,
    setHolidayMode,
    getUnlockedAchievements,
    loadAchievementConfig,
    loadAchievementState,
    loadLotteryConfig,
    calcAchievements,
    checkAndGrantAchievements,
    loadCurrentSeason,
    loadSeasonArchives,
    buildSeasonSnapshot,
    calcSeasonTitle,
    calcStudyStreak,
    getTodayRecordCount,
    escapeHtml,
  };

  init();
})();
