(function () {
  const FARM_KEY = "farm_state";
  const SUBJECTS = ["math", "physics", "chemistry"];
  const FRAME_W = 16;
  const FRAME_H = 32;
  const DEFAULT_FARM_CONFIG = {
    harvestTarget: 15,
    growthStages: [0, 3, 6, 10, 15],
    harvestXP: 20,
    levelMinHarvests: [0, 3, 8, 18, 35],
  };

  const SUBJECT_CROP_DEFS = {
    math: {
      label: "数学",
      skins: [
        { id: "math_default", cropY: 0, emoji: "🌿", color: "#4CAF50" },
        { id: "math_rare", cropY: 128, emoji: "🍅", color: "#FF5722" },
      ],
    },
    physics: {
      label: "物理",
      skins: [
        { id: "physics_default", cropY: 192, emoji: "🌱", color: "#2196F3" },
        { id: "physics_rare", cropY: 256, emoji: "🫐", color: "#3F51B5" },
      ],
    },
    chemistry: {
      label: "化学",
      skins: [
        { id: "chem_default", cropY: 448, emoji: "🌺", color: "#9C27B0" },
        { id: "chem_rare", cropY: 512, emoji: "🌻", color: "#FFC107" },
      ],
    },
  };

  const FARM_LEVEL_NAMES = ["小菜园", "家庭农场", "村庄农场", "大庄园", "星愿农场"];

  const FARM_LEVEL_SKINS = {
    1: { plotClass: "plot-skin-1", label: "泥土地" },
    2: { plotClass: "plot-skin-2", label: "翻耕地" },
    3: { plotClass: "plot-skin-3", label: "肥沃土地" },
    4: { plotClass: "plot-skin-4", label: "黄金土地" },
    5: { plotClass: "plot-skin-5", label: "星愿土地" },
  };

  const GROWTH_FRAMES = [
    { stage: 0, label: "休眠", col: -1 },
    { stage: 1, label: "种子", col: 0 },
    { stage: 2, label: "发芽", col: 1 },
    { stage: 3, label: "幼苗", col: 3 },
    { stage: 4, label: "开花", col: 5 },
    { stage: 5, label: "成熟", col: 7 },
  ];

  const SCALE = 3;
  const CROP_W = FRAME_W * SCALE;
  const CROP_H = FRAME_H * SCALE;

  function config() {
    return window.MochiApp?.GAME_CONFIG?.farm || DEFAULT_FARM_CONFIG;
  }

  function farmLevels() {
    const mins = config().levelMinHarvests || DEFAULT_FARM_CONFIG.levelMinHarvests;
    return FARM_LEVEL_NAMES.map((name, index) => ({ level: index + 1, name, minHarvests: Number(mins[index] ?? DEFAULT_FARM_CONFIG.levelMinHarvests[index]) }));
  }

  function defaultFarmState() {
    return {
      xp: 0,
      totalHarvests: 0,
      plots: {
        math: { recordCount: 0, harvestCount: 0, activeSkin: "math_default" },
        physics: { recordCount: 0, harvestCount: 0, activeSkin: "physics_default" },
        chemistry: { recordCount: 0, harvestCount: 0, activeSkin: "chem_default" },
      },
    };
  }

  function normalizeState(rawState) {
    const base = defaultFarmState();
    if (!rawState || Array.isArray(rawState.plots) || typeof rawState.plots !== "object") return base;

    const next = { ...base, ...rawState };
    next.xp = Number(next.xp || 0);
    next.totalHarvests = Number(next.totalHarvests || 0);
    next.plots = { ...base.plots, ...(rawState.plots || {}) };
    SUBJECTS.forEach((subject) => {
      const fallback = base.plots[subject];
      const plot = next.plots[subject] || {};
      const subjectDef = SUBJECT_CROP_DEFS[subject];
      const skinExists = subjectDef.skins.some((skin) => skin.id === plot.activeSkin);
      next.plots[subject] = {
        ...fallback,
        ...plot,
        recordCount: Number(plot.recordCount || 0),
        harvestCount: Number(plot.harvestCount || 0),
        activeSkin: skinExists ? plot.activeSkin : fallback.activeSkin,
      };
    });
    delete next["co" + "ins"];
    delete next["unlocked" + "Skins"];
    return next;
  }

  function readState() {
    try {
      const rawState = JSON.parse(localStorage.getItem(FARM_KEY) || "null");
      const next = normalizeState(rawState);
      if (!rawState || Array.isArray(rawState.plots) || typeof rawState.plots !== "object") {
        localStorage.setItem(FARM_KEY, JSON.stringify(next));
      }
      return next;
    } catch {
      return defaultFarmState();
    }
  }

  function saveState(state) {
    const next = normalizeState(state);
    localStorage.setItem(FARM_KEY, JSON.stringify(next));
    return next;
  }

  function getFarmLevel(totalHarvests = 0) {
    const levels = farmLevels();
    let level = levels[0];
    levels.forEach((item) => {
      if (Number(totalHarvests || 0) >= item.minHarvests) level = item;
    });
    return level;
  }

  function getCropDef(subject) {
    const state = readState();
    const subjectDef = SUBJECT_CROP_DEFS[subject] || SUBJECT_CROP_DEFS.math;
    const activeSkin = state.plots[subject]?.activeSkin || subjectDef.skins[0].id;
    return subjectDef.skins.find((skin) => skin.id === activeSkin) || subjectDef.skins[0];
  }

  function addResources({ xp = 0 } = {}) {
    const state = readState();
    state.xp = Math.max(0, state.xp + Number(xp || 0));
    return saveState(state);
  }

  function addSubjectRecord(subject) {
    if (!SUBJECTS.includes(subject)) return readState();
    const state = readState();
    state.plots[subject].recordCount += 1;
    return saveState(state);
  }

  function calcPlotStage(subject) {
    const count = readState().plots[subject]?.recordCount || 0;
    const cfg = config();
    const stages = cfg.growthStages || DEFAULT_FARM_CONFIG.growthStages;
    const harvestTarget = Number(cfg.harvestTarget || DEFAULT_FARM_CONFIG.harvestTarget);
    if (count === 0) return 0;
    if (count >= harvestTarget) return 5;
    if (count < Number(stages[1] ?? 3)) return 1;
    if (count < Number(stages[2] ?? 6)) return 2;
    if (count < Number(stages[3] ?? 10)) return 3;
    return 4;
  }

  function harvest(subject) {
    if (!SUBJECTS.includes(subject)) return { ok: false, msg: "未知科目地块。" };
    if (calcPlotStage(subject) !== 5) return { ok: false, msg: `${SUBJECT_CROP_DEFS[subject].label}地块还没有成熟。` };

    const state = readState();
    const beforeLevel = getFarmLevel(state.totalHarvests);
    const harvestXP = Number(config().harvestXP || DEFAULT_FARM_CONFIG.harvestXP);
    state.xp += harvestXP;
    state.totalHarvests += 1;
    state.plots[subject].harvestCount += 1;
    state.plots[subject].recordCount = 0;
    const saved = saveState(state);
    window.MochiApp?.checkAndGrantAchievements?.();
    const nextLevel = getFarmLevel(saved.totalHarvests);
    const levelText = nextLevel.level > beforeLevel.level ? ` 农场升级！Lv.${nextLevel.level} ${nextLevel.name}，地块焕然一新 ✨` : "";
    return {
      ok: true,
      msg: `${SUBJECT_CROP_DEFS[subject].label}地块收获成功，获得 +${harvestXP} XP，累计收获 ${saved.totalHarvests} 次。${levelText}`,
      state: saved,
    };
  }

  function cropSpriteStyle(subject, stage) {
    if (stage < 1) return "";
    const def = getCropDef(subject);
    const frame = GROWTH_FRAMES[stage];
    if (!frame || frame.col < 0) return "";
    const x = -(frame.col * FRAME_W * SCALE);
    const y = -(def.cropY * SCALE);
    return [
      "background-image:url('assets/farm/crops_.png')",
      `background-size:${256 * SCALE}px ${672 * SCALE}px`,
      `background-position:${x}px ${y}px`,
      "background-repeat:no-repeat",
      `width:${CROP_W}px`,
      `height:${CROP_H}px`,
      "image-rendering:pixelated",
      "image-rendering:crisp-edges",
      "mix-blend-mode:screen",
    ].join(";");
  }

  function calcHarvestPercent(current, nextLevel) {
    if (!nextLevel) return 100;
    const currentLevel = getFarmLevel(current);
    const start = currentLevel.minHarvests || 0;
    const span = Math.max(1, nextLevel.minHarvests - start);
    return Math.max(0, Math.min(100, Math.round(((current - start) / span) * 100)));
  }

  function refreshFarmSummary() {
    const view = document.getElementById("view");
    if (view && view.querySelector(".farm-layout-v2")) renderFarm(view);
    window.MochiPet?.renderMiniState?.();
  }

  function renderDailyGoalDots() {
    const state = window.MochiApp?.getDailyTaskState?.() || {};
    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = (window.MochiApp?.readStudyLogs?.() || []).filter((log) => String(log.date || "").slice(0, 10) === today);
    const labels = { math: "数学", physics: "物理", chemistry: "化学" };
    return SUBJECTS.map((subject) => {
      const done = state[subject]?.completed;
      const todayLog = done ? todayLogs.find((log) => log.subject === subject) : null;
      const nodeLabel = todayLog?.nodeLabel || "";
      return `
        <span class="goal-dot ${done ? "done" : ""}">
          <span class="material-symbols-outlined">${done ? "check_circle" : "radio_button_unchecked"}</span>
          <span class="goal-dot-label">
            <strong>${labels[subject] || subject}</strong>
            ${nodeLabel ? `<em>${escapeAttr(nodeLabel)}</em>` : ""}
          </span>
        </span>
      `;
    }).join("");
  }

  function renderTodayReviewCard() {
    const reviewState = window.MochiReviewEngine?.buildReviewState?.();
    const item = reviewState?.todaySuggestions?.[0];
    if (!item) {
      const hasAnyReview = (reviewState?.items || []).some((i) => i.reviewCount > 0);
      const calmText = hasAnyReview
        ? "近期复习过的知识点都在巩固中，今天可以专心做新题。"
        : "还没有复习过任何知识点，先从学习档案里找一个开始。";
      return `
        <section class="card home-review-card calm">
          <div class="home-review-head">
            <span class="material-symbols-outlined">rate_review</span>
            <div>
              <h3>今日复习</h3>
              <p>${calmText}</p>
            </div>
          </div>
          <button class="btn btn-soft btn-sm" data-route="review" type="button">看复习页</button>
        </section>
      `;
    }
    return `
      <section class="card home-review-card" style="--subject-color:${escapeAttr(item.subjectColor || "#864d61")}">
        <div class="home-review-head">
          <span class="material-symbols-outlined">rate_review</span>
          <div>
            <h3>今日复习</h3>
            <p>${escapeAttr(item.subjectLabel)} · ${escapeAttr(item.nodeLabel)}</p>
          </div>
        </div>
        <p class="home-review-reason">${escapeAttr(item.primaryReason || item.summaryLine || "适合做一次轻量回顾。")}</p>
        <div class="home-review-actions">
          <button class="btn btn-primary btn-sm" data-home-review-action="start" data-review-key="${escapeAttr(item.key)}" type="button">
            <span class="material-symbols-outlined">play_arrow</span>开始复习
          </button>
          <button class="btn btn-outline btn-sm" data-route="review" type="button">看全部</button>
        </div>
      </section>
    `;
  }

  function renderMiniPlot(subject, state) {
    const subjectDef = SUBJECT_CROP_DEFS[subject];
    const stage = calcPlotStage(subject);
    const recordCount = state.plots[subject]?.recordCount || 0;
    const harvestTarget = Number(config().harvestTarget || DEFAULT_FARM_CONFIG.harvestTarget);
    return `
      <div class="mini-plot subject-${subject}">
        <div class="mini-plot-sprite">
          ${stage > 0 ? `<div class="mini-crop-sprite" style="${cropSpriteStyle(subject, stage)}"></div>` : `<div class="mini-plot-empty"></div>`}
        </div>
        <span class="mini-plot-label">${subjectDef.label}</span>
        <span class="mini-plot-count">${recordCount}/${harvestTarget}</span>
        ${stage === 5 ? `<button class="mini-harvest-btn" data-farm-action="harvest" data-subject="${subject}" type="button">收</button>` : ""}
      </div>
    `;
  }

  function renderGuideCard() {
    return `
      <section class="card home-guide-card">
        <div class="home-guide-head">
          <span class="material-symbols-outlined">school</span>
          <h3>怎么开始？</h3>
        </div>
        <ol class="home-guide-steps">
          <li>打开 <strong>AI 私教</strong>，做一道题</li>
          <li>AI 输出 MOCHI-RECORD → <strong>复制</strong></li>
          <li>粘贴到下面的导入框 → <strong>导入</strong></li>
        </ol>
        <p class="muted home-guide-note">导入第一条记录后，学习档案和农场就会动起来。</p>
      </section>
    `;
  }

  function renderFarm(container) {
    const state = readState();
    const farmLv = getFarmLevel(state.totalHarvests);
    const nextLv = farmLevels().find((item) => item.minHarvests > state.totalHarvests);
    const harvestPct = calcHarvestPercent(state.totalHarvests, nextLv);
    const holiday = window.MochiApp?.isHolidayToday?.() ?? true;
    const hasRecords = (window.MochiApp?.readStudyLogs?.() || []).length > 0;

    const currentSeason = window.MochiApp?.loadCurrentSeason?.();
    const seasonBanner = (currentSeason?.status === "active") ? (() => {
      const today = new Date();
      const end = new Date(`${currentSeason.endDate}T12:00:00`);
      const daysLeft = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));
      const isEndingSoon = daysLeft <= 3 && daysLeft > 0;
      return `
        <div class="season-banner${isEndingSoon ? " ending-soon" : ""}">
          <span class="season-banner-icon">${isEndingSoon ? "⚠️" : "🏆"}</span>
          <span class="season-banner-name">${escapeAttr(currentSeason.name)}</span>
          <span class="season-banner-sep">·</span>
          <span class="season-banner-dates">${currentSeason.startDate} — ${currentSeason.endDate}</span>
          <span class="season-banner-countdown">${isEndingSoon ? `还剩 ${daysLeft} 天，即将结束` : `${daysLeft} 天后结束`}</span>
        </div>
      `;
    })() : "";

    container.innerHTML = `
      ${seasonBanner}
      <div class="farm-layout-v2">
        <div class="farm-focus-area">
          ${window.MochiPet?.renderTimer?.(holiday) || ""}
        </div>

        <div class="farm-side-area">
          <section class="card mini-farm-card">
            <div class="mini-farm-header">
              <span class="farm-level-badge">Lv.${farmLv.level} ${farmLv.name}</span>
              <span class="farm-xp-hint">${nextLv ? `还需 ${nextLv.minHarvests - state.totalHarvests} 次收获` : "已达最高等级"}</span>
            </div>
            <div class="mini-farm-row">
              ${SUBJECTS.map((subject) => renderMiniPlot(subject, state)).join("")}
            </div>
            <div class="mini-farm-xp-track">
              <div class="mini-farm-xp-fill" style="width:${harvestPct}%"></div>
            </div>
          </section>
          ${holiday
            ? `
              <section class="card import-card">
                <div class="import-header">
                  <span class="material-symbols-outlined">upload_file</span>
                  <div>
                    <h3>导入学习记录</h3>
                    <p class="import-header-hint">把 AI 家教输出的 MOCHI-RECORD 粘贴进来</p>
                  </div>
                </div>
                <textarea id="record-paste" rows="2" placeholder="粘贴 ---MOCHI-RECORD-START--- 到 ---MOCHI-RECORD-END--- 之间的完整内容"></textarea>
                <button class="btn btn-primary" data-action="parse-record" style="width:100%;margin-top:8px">
                  <span class="material-symbols-outlined">auto_awesome</span>确认导入
                </button>
                <div id="upload-result" class="upload-result" hidden></div>
              </section>
            `
            : `
              <section class="card farm-hibernate-card">
                <p class="farm-hibernate-icon">😴</p>
                <p class="farm-hibernate-title">农场休眠中</p>
                <p class="muted" style="font-size:13px">放假回来继续种植吧。</p>
                <button class="btn btn-soft" data-action="set-holiday-mode" data-mode="holiday" style="margin-top:12px">今天想学习</button>
              </section>
            `
          }
          ${holiday && hasRecords ? `
            <section class="card daily-goal-compact">
              <div class="daily-goal-row">
                <span class="daily-goal-label">今日</span>
                ${renderDailyGoalDots()}
              </div>
            </section>
          ` : ""}
          ${hasRecords ? renderTodayReviewCard() : (holiday ? renderGuideCard() : "")}
        </div>
      </div>
    `;

    container.querySelectorAll("[data-farm-action]").forEach((button) => {
      button.addEventListener("click", handleFarmAction);
    });
    container.querySelectorAll("[data-home-review-action='start']").forEach((button) => {
      button.addEventListener("click", handleHomeReviewStart);
    });
    window.MochiPet?.renderMiniState?.();
  }

  async function handleHomeReviewStart(event) {
    const key = event.currentTarget.dataset.reviewKey || "";
    const copied = await window.MochiReviewPage?.startItem?.(key, "suggestion");
    if (!copied) window.MochiApp?.navigate?.("review");
  }

  function handleFarmAction(event) {
    const button = event.currentTarget;
    const action = button.dataset.farmAction;
    const subject = button.dataset.subject;
    if (action === "harvest") {
      const result = harvest(subject);
      window.MochiApp?.toast?.(result.msg);
      if (result.ok) renderFarm(document.getElementById("view"));
      return;
    }
  }

  function escapeAttr(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  window.MochiFarm = {
    get FARM_LEVELS() {
      return farmLevels();
    },
    SUBJECT_CROP_DEFS,
    GROWTH_FRAMES,
    readState,
    saveState,
    getFarmLevel,
    getCurrentLevel: () => getFarmLevel(readState().totalHarvests),
    getCropDef,
    addResources,
    addSubjectRecord,
    calcPlotStage,
    harvest,
    refreshFarmSummary,
    renderFarm,
  };
})();
