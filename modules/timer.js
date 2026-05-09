(function () {
  const FOCUS_LOG_KEY = "focus_log";
  const DEFAULT_TIMER_CONFIG = { defaultFocus: 25, defaultRest: 5 };

  function config() {
    return window.MochiApp?.GAME_CONFIG?.timer || DEFAULT_TIMER_CONFIG;
  }

  const state = {
    phase: "setup",
    focusMins: config().defaultFocus,
    restMins: config().defaultRest,
    remaining: config().defaultFocus * 60,
    running: false,
    elapsedSecs: 0,
    sessionId: null,
    sessionStart: null,
    microGoal: "",
    freeMode: false,
    pendingRestMins: null,
    pendingActualMins: null,
    todayPomodoros: 0,
    todayMinutes: 0,
    weekMinutes: 0,
  };

  let interval = null;

  function readLog() {
    const logs = window.MochiApp?.readJson?.(FOCUS_LOG_KEY, []) || [];
    return Array.isArray(logs) ? logs : [];
  }

  function writeLog(logs) {
    window.MochiApp?.writeJson?.(FOCUS_LOG_KEY, logs);
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function mondayKey() {
    const date = new Date();
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return date.toISOString().slice(0, 10);
  }

  function calcStats() {
    const logs = readLog();
    const today = todayKey();
    const monday = mondayKey();
    const todayLogs = logs.filter((log) => log.date === today && log.type === "focus" && log.completed);
    const weekLogs = logs.filter((log) => log.date >= monday && log.type === "focus" && log.completed);
    state.todayPomodoros = todayLogs.length;
    state.todayMinutes = todayLogs.reduce((sum, log) => sum + Number(log.duration || 0), 0);
    state.weekMinutes = weekLogs.reduce((sum, log) => sum + Number(log.duration || 0), 0);
  }

  function calcRecommendedRest(focusedMins) {
    return Math.max(1, Math.round(focusedMins / 3));
  }

  function startFocus() {
    window.MochiApp?.stopRestReminder?.();
    const goalInput = document.getElementById("timer-micro-goal");
    if (goalInput) state.microGoal = goalInput.value.trim();

    const freeModeBtn = document.getElementById("timer-free-mode-btn");
    state.freeMode = freeModeBtn?.classList.contains("active") || false;

    if (!state.freeMode) {
      const focusInput = document.getElementById("timer-focus-mins");
      if (focusInput) {
        const value = parseInt(focusInput.value, 10);
        if (value >= 1 && value <= 180) state.focusMins = value;
      }
    }

    state.phase = "focusing";
    state.remaining = state.freeMode ? 0 : state.focusMins * 60;
    state.elapsedSecs = 0;
    state.running = true;
    state.sessionId = `focus_${Date.now()}`;
    state.sessionStart = new Date().toTimeString().slice(0, 5);
    state.pendingRestMins = null;
    state.pendingActualMins = null;
    clearInterval(interval);
    interval = setInterval(tick, 1000);
    window.MochiPet?.setFocusing?.(true);
    window.MochiApp?.enterFocusMode?.();
    fullRender();
  }

  function togglePause() {
    if (state.phase !== "focusing") return;
    if (state.running) {
      state.running = false;
      clearInterval(interval);
      window.MochiPet?.setFocusing?.(false);
    } else {
      state.running = true;
      interval = setInterval(tick, 1000);
      window.MochiPet?.setFocusing?.(true);
    }
    updateTimerDom();
  }

  function stopAndRest() {
    clearInterval(interval);
    const actualMins = Math.round(state.elapsedSecs / 60);
    const restMins = calcRecommendedRest(Math.max(1, actualMins));

    if (state.sessionId && actualMins >= 1) {
      const logs = readLog();
      logs.push({
        id: state.sessionId,
        date: todayKey(),
        startTime: state.sessionStart,
        duration: actualMins,
        type: "focus",
        completed: true,
        microGoal: state.microGoal,
      });
      writeLog(logs);
      calcStats();
      window.MochiPet?.addReward?.({ xp: actualMins, focusBonus: 15 });
      window.MochiFarm?.addResources?.({ xp: 5 });
    }

    state.running = false;
    state.phase = "deciding";
    state.pendingRestMins = restMins;
    state.pendingActualMins = actualMins;
    window.MochiPet?.setFocusing?.(false);
    window.MochiApp?.playFocusEndSound?.();
    window.MochiApp?.refreshFocusOverlay?.();
  }

  function confirmRest() {
    const restMins = state.pendingRestMins || calcRecommendedRest(1);
    const actualMins = state.pendingActualMins || 0;
    state.sessionId = null;
    state.sessionStart = null;
    state.restMins = restMins;
    state.phase = "resting";
    state.remaining = restMins * 60;
    state.running = true;
    state.pendingRestMins = null;
    state.pendingActualMins = null;
    clearInterval(interval);
    interval = setInterval(tick, 1000);
    window.MochiApp?.toast?.(`专注了 ${actualMins} 分钟！休息 ${restMins} 分钟让大脑充电～`);
    window.MochiApp?.exitFocusMode?.();
    fullRender();
  }

  function keepFocusing() {
    state.phase = "focusing";
    state.elapsedSecs = 0;
    state.running = true;
    state.remaining = state.freeMode ? 0 : state.focusMins * 60;
    state.sessionId = `focus_${Date.now()}`;
    state.sessionStart = new Date().toTimeString().slice(0, 5);
    state.pendingRestMins = null;
    state.pendingActualMins = null;
    clearInterval(interval);
    interval = setInterval(tick, 1000);
    window.MochiPet?.setFocusing?.(true);
    window.MochiApp?.refreshFocusOverlay?.();
  }

  function giveUp() {
    clearInterval(interval);
    const actualMins = Math.round(state.elapsedSecs / 60);
    if (state.sessionId && actualMins >= 1) {
      const logs = readLog();
      logs.push({
        id: state.sessionId,
        date: todayKey(),
        startTime: state.sessionStart,
        duration: actualMins,
        type: "focus",
        completed: false,
        microGoal: state.microGoal,
      });
      writeLog(logs);
      calcStats();
    }
    state.sessionId = null;
    state.sessionStart = null;
    state.running = false;
    state.phase = "setup";
    state.pendingRestMins = null;
    state.pendingActualMins = null;
    window.MochiPet?.setFocusing?.(false);
    window.MochiApp?.exitFocusMode?.();
    fullRender();
  }

  function endToday() {
    clearInterval(interval);
    state.sessionId = null;
    state.sessionStart = null;
    state.running = false;
    state.phase = "setup";
    state.pendingRestMins = null;
    state.pendingActualMins = null;
    window.MochiPet?.setFocusing?.(false);
    window.MochiApp?.exitFocusMode?.();
    fullRender();
  }

  function tick() {
    if (state.phase === "resting") {
      if (state.remaining <= 0) {
        clearInterval(interval);
        state.running = false;
        state.phase = "setup";
        window.MochiApp?.startRestReminder?.();
        window.MochiApp?.exitFocusMode?.();
        window.MochiApp?.toast?.("⚡ 充电完毕！准备好开始下一轮了吗？");
        fullRender();
        return;
      }
      state.remaining -= 1;
    } else if (state.phase === "focusing") {
      state.elapsedSecs += 1;
      if (!state.freeMode && state.elapsedSecs === state.focusMins * 60) {
        window.MochiApp?.playFocusEndSound?.();
        window.MochiApp?.toast?.(`⏰ 已专注 ${state.focusMins} 分钟！感觉思维还清晰就继续，累了就点「现在休息」`);
      }
      state.remaining = state.elapsedSecs;
    }

    updateTimerDom();
    if (document.body.classList.contains("focus-mode")) {
      window.MochiApp?.tickFocusOverlay?.();
    } else {
      window.MochiPet?.renderMiniState?.();
    }
  }

  function updateTimerDom() {
    if (state.phase === "focusing") {
      const mins = String(Math.floor(state.elapsedSecs / 60)).padStart(2, "0");
      const secs = String(state.elapsedSecs % 60).padStart(2, "0");
      const timeEl = document.querySelector(".timer-time");
      if (timeEl) timeEl.textContent = `${mins}:${secs}`;

      const ring = document.querySelector(".timer-ring-progress");
      if (ring) {
        const radius = parseFloat(ring.getAttribute("r")) || 54;
        const circumference = 2 * Math.PI * radius;
        const progress = state.freeMode ? 0 : Math.min(1, state.elapsedSecs / (state.focusMins * 60));
        ring.style.strokeDashoffset = String(circumference * (1 - progress));
      }

    }

    if (state.phase === "resting") {
      const mins = String(Math.floor(state.remaining / 60)).padStart(2, "0");
      const secs = String(state.remaining % 60).padStart(2, "0");
      const timeEl = document.querySelector(".timer-time");
      if (timeEl) timeEl.textContent = `${mins}:${secs}`;

      const restFill = document.querySelector(".timer-rest-fill");
      if (restFill) {
        const pct = Math.round((1 - state.remaining / (state.restMins * 60)) * 100);
        restFill.style.width = `${pct}%`;
      }
    }
  }

  function fullRender() {
    const view = document.getElementById("view");
    if (view) window.MochiFarm?.renderFarm?.(view);
  }

  function getState() {
    calcStats();
    if (state.phase === "setup") {
      state.focusMins = Number(config().defaultFocus || DEFAULT_TIMER_CONFIG.defaultFocus);
      state.restMins = Number(config().defaultRest || DEFAULT_TIMER_CONFIG.defaultRest);
    }
    return { ...state };
  }

  function handleAction(action) {
    if (action === "start-focus") startFocus();
    else if (action === "pause-focus") togglePause();
    else if (action === "stop-and-rest") stopAndRest();
    else if (action === "give-up") giveUp();
    else if (action === "confirm-rest") confirmRest();
    else if (action === "keep-focusing") keepFocusing();
    else if (action === "end-today") endToday();
  }

  window.MochiTimer = { getState, handleAction, calcStats, startFocus, togglePause, stopAndRest, confirmRest, keepFocusing, giveUp, endToday };
})();
