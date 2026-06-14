(function () {
  const KEY = "mochi_state";
  const DEFAULT_PET_CONFIG = {
    dailyEnergyDecay: 20,
    dailyFocusDecay: 15,
    studyEnergyBonus: 25,
  };
  const DEFAULT_TIMER_CONFIG = { defaultFocus: 25, defaultRest: 5 };
  const DEFAULT_STATE = {
    xp: 0,
    studyEnergy: 50,
    focusLevel: 50,
    streakDays: 0,
    maxStreakDays: 0,
    lastStudyDate: null,
    lastDecayDate: null,
  };
  let _isFocusing = false;

  function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function isHoliday() {
    return window.MochiApp?.isHolidayToday?.() ?? true;
  }

  function petConfig() {
    return window.MochiApp?.GAME_CONFIG?.pet || DEFAULT_PET_CONFIG;
  }

  function timerConfig() {
    return window.MochiApp?.GAME_CONFIG?.timer || DEFAULT_TIMER_CONFIG;
  }

  function applyDailyDecay(state) {
    const today = todayKey();
    if (!isHoliday() || state.lastDecayDate === today) return state;
    const cfg = petConfig();
    state.studyEnergy = clamp(Number(state.studyEnergy ?? 50) - Number(cfg.dailyEnergyDecay || DEFAULT_PET_CONFIG.dailyEnergyDecay));
    state.focusLevel = clamp(Number(state.focusLevel ?? 50) - Number(cfg.dailyFocusDecay || DEFAULT_PET_CONFIG.dailyFocusDecay));
    state.lastDecayDate = today;
    saveState(state);
    return state;
  }

  function readState() {
    let state;
    try {
      state = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      state = null;
    }
    const rawState = state;
    const hadState = Boolean(rawState);
    state = { ...DEFAULT_STATE, ...(rawState || {}) };
    if (rawState?.mood !== undefined && rawState?.studyEnergy === undefined) state.studyEnergy = rawState.mood;
    if (rawState?.satiety !== undefined && rawState?.focusLevel === undefined) state.focusLevel = rawState.satiety;
    if (rawState?.hunger !== undefined && rawState?.focusLevel === undefined) state.focusLevel = rawState.hunger;
    state.xp = Number(state.xp ?? DEFAULT_STATE.xp);
    state.studyEnergy = Number(state.studyEnergy ?? DEFAULT_STATE.studyEnergy);
    state.focusLevel = Number(state.focusLevel ?? DEFAULT_STATE.focusLevel);
    state = applyDailyDecay(state);
    delete state.stage;
    delete state.hearts;
    delete state.studyPoints;
    delete state.mood;
    delete state.satiety;
    delete state.hunger;
    delete state.evolutionProgress;
    if (!hadState || rawState?.stage !== undefined) saveState(state);
    return state;
  }

  function saveState(state) {
    const next = { ...state };
    delete next.stage;
    delete next.hearts;
    delete next.studyPoints;
    delete next.mood;
    delete next.satiety;
    delete next.hunger;
    delete next.evolutionProgress;
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }

  function streakMultiplier(streakDays) {
    if (streakDays >= 14) return 2;
    if (streakDays >= 7) return 1.5;
    if (streakDays >= 3) return 1.2;
    return 1;
  }

  function updateStreak(state) {
    const today = todayKey();
    if (state.lastStudyDate === today) {
      state.maxStreakDays = Math.max(Number(state.maxStreakDays || 0), Number(state.streakDays || 0));
      return state;
    }
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    state.streakDays = state.lastStudyDate === yesterday ? Number(state.streakDays || 0) + 1 : 1;
    state.maxStreakDays = Math.max(Number(state.maxStreakDays || 0), state.streakDays);
    state.lastStudyDate = today;
    return state;
  }

  function setFocusing(val) {
    _isFocusing = val;
    const sprite = document.getElementById("mochi-sprite");
    const bubble = document.getElementById("mochi-focus-bubble");
    const floaties = document.getElementById("mochi-floaties");

    if (!sprite) return;

    if (val) {
      sprite.classList.add("focusing");
      if (bubble) bubble.hidden = false;
      if (floaties) floaties.hidden = false;
    } else {
      sprite.classList.remove("focusing");
      if (bubble) bubble.hidden = true;
      if (floaties) floaties.hidden = true;
    }
  }

  function addReward({ xp = 0, studyEnergy = 0, focusBonus = 0 } = {}) {
    const before = updateStreak(readState());
    before.xp += Number(xp || 0);
    before.studyEnergy = clamp(before.studyEnergy + Number(petConfig().studyEnergyBonus || DEFAULT_PET_CONFIG.studyEnergyBonus) + Number(studyEnergy || 0));
    before.focusLevel = clamp(before.focusLevel + Number(focusBonus || 0));
    const next = saveState(before);
    return {
      state: next,
      evolved: false,
      masteryBonus: 0,
    };
  }

  function completePomodoro() {
    return addReward({ xp: 5, focusBonus: 20 });
  }

  function renderMiniState() {
    const farmState = window.MochiFarm?.readState?.() || {};
    const farmLevel = window.MochiFarm?.getFarmLevel?.(farmState.totalHarvests || 0);
    const streak = window.MochiApp?.calcStudyStreak?.() || 0;
    const farmResources = streak >= 2
      ? `收获${farmState.totalHarvests || 0}次 · 连续${streak}天`
      : `收获${farmState.totalHarvests || 0}次`;
    const topEl = document.getElementById("sidebar-pet-info");
    const sideResources = document.getElementById("side-resources");
    const topResources = document.getElementById("top-resources");
    const sideLevel = document.getElementById("side-level");
    if (topEl && farmLevel) {
      topEl.innerHTML = `
        <div>
          <h1>我的农场</h1>
          <p id="side-level">Lv.${farmLevel.level} ${farmLevel.name}</p>
          <strong id="side-resources">${farmResources}</strong>
        </div>
      `;
    } else {
      if (sideResources) sideResources.textContent = farmResources;
      if (sideLevel && farmLevel) sideLevel.textContent = `Lv.${farmLevel.level} ${farmLevel.name}`;
    }
    if (topResources) topResources.textContent = farmResources;
  }

  function renderTimer(enabled) {
    const timer = window.MochiTimer?.getState?.() || {
      phase: "setup",
      focusMins: timerConfig().defaultFocus,
      restMins: timerConfig().defaultRest,
      elapsedSecs: 0,
      remaining: 0,
      running: false,
      microGoal: "",
      todayPomodoros: 0,
      todayMinutes: 0,
    };

    if (timer.phase === "setup") {
      window.MochiApp?.exitFocusMode?.();
    }

    if (timer.phase === "setup") {
      const freeActive = Boolean(timer.freeMode);
      return `
        <section class="card timer-setup-card">
          <div class="timer-setup-header">
            <span class="material-symbols-outlined">psychology</span>
            <h3>动态专注</h3>
          </div>
          <div class="timer-goal-wrap">
            <label>目标</label>
            <input id="timer-micro-goal" type="text" placeholder="今天突破哪道题？" value="${escapeAttr(timer.microGoal || "")}" ${enabled ? "" : "disabled"} />
          </div>
          <div class="timer-mode-switch">
            <button id="timer-free-mode-btn" class="timer-mode-btn ${freeActive ? "active" : ""}" type="button" ${enabled ? "" : "disabled"}
              onclick="this.classList.add('active');document.getElementById('timer-timed-mode-btn').classList.remove('active');document.getElementById('timer-time-row').style.display='none'">
              自由专注
            </button>
            <button id="timer-timed-mode-btn" class="timer-mode-btn ${freeActive ? "" : "active"}" type="button" ${enabled ? "" : "disabled"}
              onclick="this.classList.add('active');document.getElementById('timer-free-mode-btn').classList.remove('active');document.getElementById('timer-time-row').style.display=''">
              设定时间
            </button>
          </div>
          <div id="timer-time-row" class="timer-setup-row" style="${freeActive ? "display:none" : ""}">
            <div class="timer-setup-field">
              <label>时长</label>
              <div class="timer-input-wrap">
                <input id="timer-focus-mins" type="number" value="${timer.focusMins}" min="1" max="180" ${enabled ? "" : "disabled"} />
                <span>分钟</span>
              </div>
            </div>
          </div>
          <button class="btn btn-primary" data-action="start-focus" style="width:100%;margin-top:14px" ${enabled ? "" : "disabled"}>
            <span class="material-symbols-outlined">play_arrow</span>
            开始专注
          </button>
          ${!enabled
            ? `<p class="muted" style="text-align:center;font-size:12px;margin-top:8px">放假回来再开始专注吧</p>`
            : `<p class="muted timer-hint">累了就停</p>`
          }
          <div class="timer-today-stats">
            <span>🍅 今日 ${timer.todayPomodoros} 轮</span>
            <span>⏱ ${timer.todayMinutes} 分钟</span>
          </div>
        </section>
      `;
    }

    if (timer.phase === "focusing") {
      const circumference = 2 * Math.PI * 54;
      const progress = timer.freeMode ? 0 : Math.min(1, timer.elapsedSecs / (timer.focusMins * 60));
      const dashOffset = circumference * (1 - progress);
      const mins = String(Math.floor(timer.elapsedSecs / 60)).padStart(2, "0");
      const secs = String(timer.elapsedSecs % 60).padStart(2, "0");
      const overTime = !timer.freeMode && timer.elapsedSecs >= timer.focusMins * 60;
      const quotes = ["Mochi 也在认真学习！", "刚才思路在哪？继续！", "专注的你最厉害！", "感觉思维开始钝了就停～", "加油，快到了！"];
      const quote = quotes[Math.floor(timer.elapsedSecs / 60) % quotes.length];
      return `
        <section class="card timer-focus-card">
          ${timer.microGoal ? `<div class="timer-goal-badge">🎯 ${escapeHtml(timer.microGoal)}</div>` : ""}
          <p class="timer-quote">${quote}</p>
          <div class="timer-ring-wrap">
            <svg class="timer-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--surface-high)" stroke-width="6"></circle>
              <circle class="timer-ring-progress" cx="60" cy="60" r="54" fill="none"
                stroke="${overTime ? "var(--tertiary)" : "var(--primary)"}" stroke-width="6" stroke-linecap="round"
                stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
                transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 1s linear"></circle>
            </svg>
            <div class="timer-display">
              <span class="timer-time">${mins}:${secs}</span>
              <span class="timer-label">${overTime ? "超额完成 🔥" : timer.freeMode ? "自由专注中" : "专注中"}</span>
            </div>
          </div>
          <button class="btn btn-primary timer-rest-btn" data-action="stop-and-rest">
            <span class="material-symbols-outlined">stop_circle</span>
            结束这一轮
          </button>
        </section>
      `;
    }

    if (timer.phase === "resting") {
      const mins = String(Math.floor(timer.remaining / 60)).padStart(2, "0");
      const secs = String(timer.remaining % 60).padStart(2, "0");
      const pct = Math.round((1 - timer.remaining / (timer.restMins * 60)) * 100);
      return `
        <section class="card timer-rest-card">
          <div class="timer-rest-header">
            <h3>☕ 充电中</h3>
            <span class="timer-rest-badge">建议 ${timer.restMins} 分钟</span>
          </div>
          <div class="timer-rest-display">
            <span class="timer-time timer-rest-time">${mins}:${secs}</span>
          </div>
          <div class="timer-rest-bar">
            <div class="timer-rest-fill" style="width:${pct}%"></div>
          </div>
          <button class="btn btn-outline timer-skip-rest-btn" data-action="skip-rest" type="button">
            <span class="material-symbols-outlined">skip_next</span>
            跳过休息
          </button>
          <div class="timer-rest-tips">
            <div class="rest-tip rest-tip-do">
              <span class="rest-tip-icon">✅</span>
              <div>
                <strong>主动恢复</strong>
                <p>站起来走走 · 倒杯水 · 闭眼深呼吸</p>
              </div>
            </div>
            <div class="rest-tip rest-tip-dont">
              <span class="rest-tip-icon">❌</span>
              <div>
                <strong>避免</strong>
                <p>刷手机 · 看短视频（会让大脑更累）</p>
              </div>
            </div>
          </div>
          <p class="muted" style="text-align:center;font-size:12px;margin-top:8px">休息结束后会有提醒音，点击页面回来继续 🔔</p>
        </section>
      `;
    }

    return "";
  }

  function escapeAttr(value) {
    return window.MochiApp?.escapeHtml?.(value) ?? String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function escapeHtml(value) {
    return window.MochiApp?.escapeHtml?.(value) ?? String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  window.MochiPet = {
    readState,
    saveState,
    addReward,
    completePomodoro,
    setFocusing,
    renderMiniState,
    renderTimer,
  };
})();
