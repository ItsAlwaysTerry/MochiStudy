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
  const HOME_REVIEW_STATE = { activeKey: "", importResult: "", importError: "" };

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
    if (view && view.querySelector(".home-flow")) renderFarm(view);
    window.MochiPet?.renderMiniState?.();
  }

  function renderTodayReviewCard() {
    const reviewState = window.MochiReviewEngine?.buildReviewState?.();
    const item = reviewState?.todaySuggestions?.[0];
    if (!item) {
      if (HOME_REVIEW_STATE.importResult) {
        return `
          <section class="card home-review-card calm">
            <div class="home-review-head">
              <span class="material-symbols-outlined">rate_review</span>
              <div>
                <h3>今日复习</h3>
                <p>复习结果已保存。</p>
              </div>
            </div>
            <p class="home-review-msg home-review-msg-success">${escapeAttr(HOME_REVIEW_STATE.importResult)}</p>
            <button class="btn btn-soft btn-sm" data-home-review-action="dismiss" type="button">继续</button>
          </section>
        `;
      }
      const hasAnyReview = (reviewState?.items || []).some((i) => i.reviewCount > 0);
      const calmText = hasAnyReview ? "暂无到期复习" : "暂无复习卡";
      const today = new Date().toISOString().slice(0, 10);
      const nextDue = (reviewState?.items || [])
        .filter((i) => i.nextReviewDate && i.nextReviewDate > today)
        .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate))[0];
      let nextDueHint = "";
      if (nextDue) {
        const diff = Math.ceil((new Date(`${nextDue.nextReviewDate}T12:00:00`) - new Date()) / 86400000);
        const diffLabel = diff === 1 ? "明天" : `${diff} 天后`;
        nextDueHint = `<p class="home-review-next-due">下一个到期：${formatRichText(nextDue.nodeLabel)} · ${diffLabel}</p>`;
      }
      return `
        <section class="card home-review-card calm">
          <div class="home-review-head">
            <span class="material-symbols-outlined">rate_review</span>
            <div>
              <h3>今日复习</h3>
              <p>${calmText}</p>
            </div>
          </div>
          ${nextDueHint}
          <button class="btn btn-soft btn-sm" data-route="review" type="button">复习队列</button>
        </section>
      `;
    }
    const isActive = HOME_REVIEW_STATE.activeKey === item.key;
    return `
      <section class="card home-review-card" style="--subject-color:${escapeAttr(item.subjectColor || "#864d61")}">
        <div class="home-review-head">
          <span class="material-symbols-outlined">rate_review</span>
          <div>
            <h3>今日复习</h3>
            <p>${escapeAttr(item.subjectLabel)} · ${formatRichText(item.nodeLabel)}</p>
          </div>
        </div>
        ${item.mainPainPoint ? `<p class="home-review-pain">${formatRichText(item.mainPainPoint)}</p>` : ""}
        ${isActive ? `
        <div class="home-review-import">
          ${HOME_REVIEW_STATE.importError ? `<p class="home-review-msg home-review-msg-error">${escapeAttr(HOME_REVIEW_STATE.importError)}</p>` : ""}
          ${HOME_REVIEW_STATE.importResult ? `
            <p class="home-review-msg home-review-msg-success">${escapeAttr(HOME_REVIEW_STATE.importResult)}</p>
            <button class="btn btn-soft btn-sm" data-home-review-action="dismiss" type="button" style="margin-top:6px">继续</button>
          ` : `
            <ol class="review-stepper review-stepper-compact">
              <li class="review-step done"><span class="review-step-num"><span class="material-symbols-outlined">check</span></span><span class="review-step-text">材料已复制</span></li>
              <li class="review-step"><span class="review-step-num">2</span><span class="review-step-text">去复习 AI 做题，再把输出（含 MOCHI-RECORD）粘到下面</span></li>
            </ol>
            <textarea id="home-review-paste" rows="3" placeholder="粘贴 AI 输出（含 MOCHI-RECORD 那段即可）" style="width:100%;box-sizing:border-box;margin-top:8px"></textarea>
            <button class="btn btn-primary btn-sm" data-home-review-action="import" data-review-key="${escapeAttr(item.key)}" style="width:100%;margin-top:6px" type="button">
              <span class="material-symbols-outlined">download_done</span>导入复习结果
            </button>
          `}
        </div>
        ` : `
        <div class="home-review-actions">
          <button class="btn btn-primary btn-sm" data-home-review-action="start" data-review-key="${escapeAttr(item.key)}" type="button">
            <span class="material-symbols-outlined">content_copy</span>开始复习
          </button>
          <button class="btn btn-outline btn-sm" data-route="review" type="button">全部</button>
        </div>
        `}
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

  function renderStreakBanner() {
    const streak = window.MochiApp?.calcStudyStreak?.() || 0;
    const todayCount = window.MochiApp?.getTodayRecordCount?.() || 0;
    const focusLogs = window.MochiApp?.readFocusLogs?.() || [];
    const today = new Date().toISOString().slice(0, 10);
    const minutes = focusLogs
      .filter((log) => log.type === "focus" && log.completed && log.date === today)
      .reduce((sum, log) => sum + Number(log.duration || 0), 0);

    const streakSub = streak >= 2
      ? `连续 ${streak} 天`
      : todayCount > 0
        ? "今天已经开始了"
        : "导入一条就开始生长";

    const statLine = todayCount > 0 && minutes > 0
      ? `今天 ${todayCount} 张卡片 · ${minutes} 分钟专注`
      : `今天已导入 ${todayCount} 张卡片`;

    return `
      <section class="card streak-banner ${todayCount > 0 ? "" : "streak-banner-zero"}">
        <div class="streak-banner-row">
          <span class="material-symbols-outlined streak-fire-icon">${todayCount > 0 ? "local_fire_department" : "bedtime"}</span>
          <div class="streak-banner-text">
            <strong class="streak-num">${escapeAttr(statLine)}</strong>
            <span class="streak-sub">${escapeAttr(streakSub)}</span>
          </div>
          ${todayCount > 0
            ? `<button class="btn btn-soft btn-sm" data-route="today" type="button">报告</button>`
            : `<button class="btn btn-soft btn-sm streak-zero-cta" data-action="scroll-to-import" type="button">去导入</button>`}
        </div>
      </section>
    `;
  }

  function renderWeekTrend() {
    const logs = window.MochiApp?.readStudyLogs?.() || [];
    const counts = {};
    logs.forEach((log) => {
      const day = String(log.date || log.importedAt || "").slice(0, 10);
      if (day) counts[day] = (counts[day] || 0) + 1;
    });
    const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"];
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({ key, count: counts[key] || 0, label: weekdayNames[d.getDay()], isToday: i === 0 });
    }
    const max = Math.max(1, ...days.map((d) => d.count));
    const weekTotal = days.reduce((sum, d) => sum + d.count, 0);
    if (weekTotal === 0) return "";
    const bars = days.map((d) => {
      const pct = d.count === 0 ? 0 : Math.max(12, Math.round((d.count / max) * 100));
      return `
        <div class="week-trend-col${d.isToday ? " today" : ""}">
          <span class="week-trend-count">${d.count || ""}</span>
          <div class="week-trend-bar-wrap">
            <div class="week-trend-bar" style="height:${pct}%"></div>
          </div>
          <span class="week-trend-day">${d.label}</span>
        </div>
      `;
    }).join("");
    return `
      <section class="card week-trend-card">
        <div class="week-trend-head">
          <span class="material-symbols-outlined">bar_chart</span>
          <h3>本周学习</h3>
          <span class="week-trend-total">共 ${weekTotal} 张</span>
        </div>
        <div class="week-trend-bars">${bars}</div>
      </section>
    `;
  }

  // 说到做到：回看最近几轮"目标 vs 完成"，让规划准确度可见，形成长期反馈
  function renderCommitmentRecap() {
    const stat = window.MochiApp?.commitmentKeptRate?.(7);
    if (!stat || !stat.total) return "";
    const recent = stat.recent.slice(-4).reverse();
    const outcomeInfo = {
      done: { icon: "✓", cls: "kept", text: "搞定" },
      partial: { icon: "◐", cls: "partial", text: "部分" },
      none: { icon: "✕", cls: "missed", text: "没完成" },
    };
    const rows = recent.map((c) => {
      const info = outcomeInfo[c.outcome] || outcomeInfo.none;
      return `
        <div class="commit-recap-row">
          <span class="commit-recap-mark ${info.cls}">${info.icon}</span>
          <span class="commit-recap-goal">${escapeAttr(c.goal)}</span>
          <span class="commit-recap-mins">${c.plannedMins ? `${c.plannedMins}分` : "自由"}</span>
        </div>
      `;
    }).join("");
    const rate = Math.round((stat.done / stat.total) * 100);
    const summaryTone = rate >= 70 ? "说到做到，保持！" : rate >= 40 ? "目标可以再定准一点。" : "目标定得偏大，下轮试试更小的。";
    return `
      <section class="card commit-recap-card">
        <div class="commit-recap-head">
          <span class="material-symbols-outlined">task_alt</span>
          <h3>说到做到</h3>
          <span class="commit-recap-rate">近 ${stat.total} 轮做到 ${stat.done} 轮</span>
        </div>
        <div class="commit-recap-list">${rows}</div>
        <p class="commit-recap-summary">${summaryTone}</p>
      </section>
    `;
  }

  function renderAiGuideCard(open = false) {
    return `
      <details class="card home-ai-guide"${open ? " open" : ""}>
        <summary class="home-ai-guide-summary">
          <span class="material-symbols-outlined">school</span>
          <span>怎么用 AI 家教学习？</span>
          <span class="home-ai-guide-arrow material-symbols-outlined">expand_more</span>
        </summary>
        <div class="home-ai-guide-body">
          <div class="home-ai-guide-steps">
            <div class="home-ai-guide-step">
              <span class="step-num">1</span>
              <div>
                <strong>学新题</strong>
                <p>打开 AI 家教 → 发图片或描述题目 → 按引导一步步做题 → AI 自动生成记录块 → 复制粘贴到上面导入框</p>
              </div>
            </div>
            <div class="home-ai-guide-step">
              <span class="step-num">2</span>
              <div>
                <strong>复习旧卡点</strong>
                <p>在「学习」页找到待复习项 → 点「复制材料」→ 粘贴给复习 AI → 按引导复习 → 把 AI 输出粘贴回来导入</p>
              </div>
            </div>
            <div class="home-ai-guide-step">
              <span class="step-num">3</span>
              <div>
                <strong>记录自动更新</strong>
                <p>每次导入后，农场、学习档案、复习优先级全部自动更新，不需要手动操作</p>
              </div>
            </div>
          </div>
          <div class="home-ai-guide-actions">
            <p class="home-ai-guide-hint">两个 AI Prompt 在「设置 → AI 使用指南」里可以复制</p>
            <button class="btn btn-soft btn-sm" data-route="settings" type="button">
              <span class="material-symbols-outlined">arrow_forward</span>去设置页复制 Prompt
            </button>
          </div>
        </div>
      </details>
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
      const icon = isEndingSoon ? "⚠️" : "🏆";
      const countdown = daysLeft === 0 ? "今天结束" : isEndingSoon ? `还剩 ${daysLeft} 天` : `${daysLeft} 天`;
      return `<button class="season-badge${isEndingSoon ? " ending-soon" : ""}" data-route="season" type="button">${icon} ${escapeAttr(currentSeason.name)} · ${countdown}</button>`;
    })() : "";

    container.innerHTML = `
      ${seasonBanner}
      <div class="home-flow">
        <div class="home-left-stack">
          ${renderStreakBanner()}
          ${!hasRecords && holiday ? renderAiGuideCard(true) : ""}
          ${holiday
            ? `
              <section class="card import-card home-import-card">
                <div class="import-header">
                  <span class="material-symbols-outlined">upload_file</span>
                  <div>
                    <h3>导入学习记录</h3>
                  </div>
                </div>
                <textarea id="record-paste" rows="3" placeholder="把 AI 给你的记录整段粘进来，会自动导入"></textarea>
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
          ${hasRecords ? renderTodayReviewCard() : ""}
          ${hasRecords ? renderAiGuideCard(false) : ""}
        </div>
        <div class="home-right-stack">
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
          ${hasRecords ? renderWeekTrend() : ""}
          <div class="home-focus-panel">
            ${window.MochiPet?.renderTimer?.(true) || ""}
          </div>
          ${renderCommitmentRecap()}
        </div>
      </div>
    `;

    container.querySelectorAll("[data-farm-action]").forEach((button) => {
      button.addEventListener("click", handleFarmAction);
    });
    container.querySelectorAll("[data-home-review-action]").forEach((button) => {
      button.addEventListener("click", handleHomeReviewStart);
    });
    container.querySelectorAll("[data-action='scroll-to-import']").forEach((button) => {
      button.addEventListener("click", () => {
        const textarea = container.querySelector("#record-paste");
        if (textarea) {
          textarea.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => textarea.focus(), 300);
        }
      });
    });
    // 粘贴即导入：贴进来的内容已含完整记录块时，省掉那次「确认导入」点击。
    const pasteBox = container.querySelector("#record-paste");
    if (pasteBox) {
      pasteBox.addEventListener("paste", () => {
        setTimeout(() => {
          if (/---MOCHI-RECORD-END---/.test(pasteBox.value)) {
            window.MochiApp?.parsePastedRecordEl?.(pasteBox, container.querySelector("#upload-result"));
          }
        }, 0);
      });
    }
    const homeReviewPaste = container.querySelector("#home-review-paste");
    if (homeReviewPaste) {
      homeReviewPaste.addEventListener("paste", () => {
        setTimeout(() => {
          if (/---MOCHI-RECORD-END---/.test(homeReviewPaste.value)) {
            container.querySelector('[data-home-review-action="import"]')?.click();
          }
        }, 0);
      });
    }
    window.MochiPet?.renderMiniState?.();
  }

  async function handleHomeReviewStart(event) {
    const action = event.currentTarget.dataset.homeReviewAction;
    const key = event.currentTarget.dataset.reviewKey || "";

    if (action === "start") {
      const copied = await window.MochiReviewPage?.copyItemPack?.(key);
      HOME_REVIEW_STATE.activeKey = key;
      HOME_REVIEW_STATE.importResult = "";
      HOME_REVIEW_STATE.importError = "";
      window.MochiApp?.toast?.(copied ? "复习材料已复制，先自己回想 20 秒" : "复制失败，请手动获取材料");
    } else if (action === "import") {
      const textarea = document.getElementById("home-review-paste");
      const text = textarea?.value || "";
      window.MochiReviewPage?.importItemByKey?.(key, text, {
        onSuccess(msg) {
          HOME_REVIEW_STATE.importResult = msg;
          HOME_REVIEW_STATE.importError = "";
          const view = document.getElementById("view");
          if (view && view.querySelector(".home-flow")) {
            renderFarm(view);
            window.MochiApp?.sparkle?.(view, "✓");
          }
        },
        onError(msg) {
          HOME_REVIEW_STATE.importError = msg;
          HOME_REVIEW_STATE.importResult = "";
          const view = document.getElementById("view");
          if (view && view.querySelector(".home-flow")) renderFarm(view);
        },
      });
      return;
    } else if (action === "dismiss") {
      HOME_REVIEW_STATE.activeKey = "";
      HOME_REVIEW_STATE.importResult = "";
      HOME_REVIEW_STATE.importError = "";
    }

    const view = document.getElementById("view");
    if (view && view.querySelector(".home-flow")) renderFarm(view);
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
    return window.MochiApp?.escapeHtml?.(value) ?? String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function formatRichText(value) {
    return window.MochiApp?.formatRichText?.(value) ?? escapeAttr(value);
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
