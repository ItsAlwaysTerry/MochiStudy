(function () {
  const STATE = {
    activeSubject: "math",
    exportSubject: "all",
    expandedNode: "",
    highlightNodeId: "",
    historyExpanded: false,
    expandedCards: new Map(),
    draggingCardId: "",
    container: null,
  };
  const DEFAULT_CARDS_CONFIG = { masteredMinRecent: 2, dormantDays: 30 };
  const CARD_ORDER_KEY = "card_order";
  const NODE_SUMMARY_KEY = "study_node_summary";

  const NODE_DEFS = {
    math: {
      label: "数学",
      color: "#7c6fcd",
      containerColor: "rgba(124, 111, 205, 0.16)",
      icon: "calculate",
      nodes: [
        ["set", "集合"],
        ["function", "函数"],
        ["trigonometry", "三角函数"],
        ["sequence", "数列"],
        ["inequality", "不等式"],
        ["vector", "向量"],
        ["probability_stats", "概率统计"],
        ["derivative", "导数"],
        ["solid_geometry", "立体几何"],
        ["analytic_geometry", "解析几何"],
      ],
    },
    physics: {
      label: "物理",
      color: "#4a9eca",
      containerColor: "rgba(74, 158, 202, 0.16)",
      icon: "bolt",
      nodes: [
        ["kinematics", "运动学"],
        ["dynamics", "动力学"],
        ["momentum", "动量"],
        ["energy", "能量守恒"],
        ["electric_field", "电场"],
        ["magnetic_field", "磁场"],
        ["electromagnetic_induction", "电磁感应"],
        ["wave", "波动"],
        ["thermology", "热学"],
      ],
    },
    chemistry: {
      label: "化学",
      color: "#5ab87a",
      containerColor: "rgba(90, 184, 122, 0.16)",
      icon: "science",
      nodes: [
        ["atom_structure", "原子结构"],
        ["chemical_bond", "化学键"],
        ["redox", "氧化还原反应"],
        ["chemical_reaction", "化学反应"],
        ["equilibrium", "化学平衡"],
        ["electrochemistry", "电化学"],
        ["organic", "有机化学"],
      ],
    },
  };

  const SUBJECTS = Object.fromEntries(Object.entries(NODE_DEFS).map(([subject, def]) => [
    subject,
    {
      ...def,
      nodes: def.nodes.map(([id, label]) => ({ id: `${subject}_${id}`, label, prerequisites: [], tier: 1 })),
    },
  ]));

  const LEGACY_NODE_ALIASES = {
    math: {
      集合与逻辑: "集合",
      函数基础: "函数",
      指数函数: "函数",
      对数函数: "函数",
      反三角函数: "三角函数",
      排列组合: "概率统计",
      概率: "概率统计",
      统计: "概率统计",
      导数应用: "导数",
    },
    physics: {
      牛顿定律: "动力学",
      摩擦力: "动力学",
      曲线运动: "运动学",
      万有引力: "动力学",
      功与能: "能量守恒",
      动量定理: "动量",
      动量守恒: "动量",
      简谐运动: "波动",
      机械波: "波动",
      声波光波: "波动",
      光学: "波动",
      直流电路: "电场",
      交变电流: "电磁感应",
    },
    chemistry: {
      元素周期律: "原子结构",
      氧化还原: "氧化还原反应",
      热化学: "化学反应",
      离子平衡: "化学平衡",
      非金属单质: "化学反应",
      酸碱盐: "化学反应",
      金属: "化学反应",
      合金与材料: "化学反应",
      有机基础: "有机化学",
      烃类: "有机化学",
      官能团: "有机化学",
      有机反应: "有机化学",
      高分子材料: "有机化学",
    },
  };

  const LEGACY_ID_ALIASES = {
    set: "math_集合",
    func: "math_函数",
    exp: "math_函数",
    log: "math_函数",
    trig: "math_三角函数",
    inv: "math_三角函数",
    seq: "math_数列",
    seqlim: "math_数列",
    ineq: "math_不等式",
    deriv: "math_导数",
    derivapp: "math_导数",
    vec: "math_向量",
    solid: "math_立体几何",
    conic: "math_解析几何",
    count: "math_概率统计",
    prob: "math_概率统计",
    stat: "math_概率统计",
    kine: "physics_运动学",
    dyn: "physics_动力学",
    friction: "physics_动力学",
    curve: "physics_运动学",
    gravity: "physics_动力学",
    work: "physics_能量守恒",
    energy: "physics_能量守恒",
    momentum: "physics_动量",
    impulse: "physics_动量",
    shm: "physics_波动",
    wave: "physics_波动",
    sound: "physics_波动",
    thermo: "physics_热学",
    efield: "physics_电场",
    circuit: "physics_电场",
    mfield: "physics_磁场",
    emind: "physics_电磁感应",
    acdc: "physics_电磁感应",
    optics: "physics_波动",
    atom: "chemistry_原子结构",
    period: "chemistry_原子结构",
    bond: "chemistry_化学键",
    redox: "chemistry_氧化还原反应",
    react: "chemistry_化学反应",
    thermo2: "chemistry_化学反应",
    equil: "chemistry_化学平衡",
    ionic: "chemistry_化学平衡",
    electro: "chemistry_电化学",
    organic_base: "chemistry_有机化学",
    hydrocarbon: "chemistry_有机化学",
    func_group: "chemistry_有机化学",
    organic_react: "chemistry_有机化学",
    polymer: "chemistry_有机化学",
  };

  function allNodes() {
    return Object.entries(SUBJECTS).flatMap(([subject, data]) =>
      data.nodes.map((node) => ({ ...node, subject, subjectLabel: data.label }))
    );
  }

  function getNode(id) {
    return allNodes().find((node) => node.id === id) || legacyNodeById(id);
  }

  function legacyNodeById(id) {
    const mapped = LEGACY_ID_ALIASES[id];
    if (!mapped) return null;
    const [subject, label] = splitMappedNode(mapped);
    return allNodes().find((node) => node.subject === subject && node.label === label) || null;
  }

  function splitMappedNode(value) {
    const index = value.indexOf("_");
    return [value.slice(0, index), value.slice(index + 1)];
  }

  function subjectLogs(logs, subject) {
    return logs.filter((log) => log.subject === subject);
  }

  function cardsConfig() {
    return window.MochiApp?.GAME_CONFIG?.cards || DEFAULT_CARDS_CONFIG;
  }

  function normalizeNodeLabel(subject, label, nodeId) {
    const nodes = SUBJECTS[subject]?.nodes || [];
    const fromId = nodeId ? getNode(nodeId) : null;
    if (fromId?.subject === subject) return fromId.label;
    if (nodes.some((node) => node.label === label)) return label;
    const alias = LEGACY_NODE_ALIASES[subject]?.[label];
    if (alias) return alias;
    const fuzzy = nodes.find((node) => String(label || "").includes(node.label) || node.label.includes(String(label || "")));
    return fuzzy?.label || nodes[0]?.label || label || "";
  }

  function logsForNode(logs, subject, nodeLabel) {
    return logs
      .filter((log) => log.subject === subject && normalizeNodeLabel(subject, log.nodeLabel, log.nodeId) === nodeLabel)
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }

  function displayLogsForNode(logs, subject, nodeLabel) {
    const entries = logsForNode(logs, subject, nodeLabel);
    const saved = readCardOrder()[cardOrderKey(subject, nodeLabel)] || [];
    if (!saved.length) return entries;
    const savedIds = new Set(saved);
    const byId = new Map(entries.map((log) => [cardId(log), log]));
    const ordered = saved.map((id) => byId.get(id)).filter(Boolean);
    const rest = entries.filter((log) => !savedIds.has(cardId(log)));
    return [...ordered, ...rest];
  }

  function calcNodeStatus(logs, subject, nodeLabel) {
    const nodeLogs = logsForNode(logs, subject, nodeLabel);
    if (nodeLogs.length === 0) return "untouched";
    const cfg = cardsConfig();
    const masteredMinRecent = Number(cfg.masteredMinRecent || DEFAULT_CARDS_CONFIG.masteredMinRecent);
    const recent = nodeLogs.slice(0, Math.max(masteredMinRecent, 1));
    if (recent.length >= masteredMinRecent && recent.every((log) => Number(log.stars) === 3)) return "mastered";
    const latestDate = new Date(`${String(nodeLogs[0].date || "").slice(0, 10)}T00:00:00`);
    if (!Number.isNaN(latestDate.getTime())) {
      const diffDays = Math.floor((new Date() - latestDate) / 86400000);
      if (diffDays > Number(cfg.dormantDays || DEFAULT_CARDS_CONFIG.dormantDays)) return "dormant";
    }
    return "learning";
  }

  function nodeSummary(logs, subject, node, reviewState = null) {
    const dateEntries = logsForNode(logs, subject, node.label);
    const allEntries = displayLogsForNode(logs, subject, node.label);
    const entries = filterEntriesBySource(allEntries);
    const visibleDateEntries = filterEntriesBySource(dateEntries);
    const latest = visibleDateEntries[0] || dateEntries[0];
    const reviewCount = allEntries.filter((log) => {
      const source = metaForLog(log).source || "lesson";
      return source !== "lesson";
    }).length;
    const lowStarCount = allEntries.filter((log) => Number(log.stars || 1) <= 2).length;
    const latestReview = allEntries.find((log) => {
      const source = metaForLog(log).source || "lesson";
      return source !== "lesson";
    });
    const autoMainPainPoint = mostCommonText([
      ...allEntries.filter((log) => Number(log.stars || 1) <= 2).map((log) => log.painPoint),
      ...allEntries.map((log) => metaForLog(log).stuckStep),
      ...allEntries.map((log) => log.painPoint),
    ]);
    const autoLatestBreakthrough = firstFilled([
      ...allEntries.map((log) => metaForLog(log).keyInsight),
      ...allEntries.map((log) => log.routine),
    ]);
    const latestReviewResult = latestReview ? metaForLog(latestReview).reviewResult || "" : "";
    const reviewItem = reviewState?.items?.find((item) => item.subject === subject && item.nodeLabel === node.label);
    const manualSummary = readNodeSummary(subject, node.label);
    const hasManual = hasManualSummary(manualSummary);
    return {
      key: summaryKey(subject, node.label),
      subject,
      node,
      entries,
      allEntries,
      count: entries.length,
      totalCount: allEntries.length,
      reviewCount,
      lowStarCount,
      latestReviewResult,
      mainPainPoint: manualSummary.mainPainPointOverride || autoMainPainPoint,
      latestBreakthrough: manualSummary.keyBreakthroughOverride || autoLatestBreakthrough,
      reviewNote: manualSummary.reviewNote || "",
      autoMainPainPoint,
      autoLatestBreakthrough,
      manualSummary,
      hasManualSummary: hasManual,
      summaryUpdatedAt: manualSummary.updatedAt || "",
      reviewStatusLabel: reviewItem?.statusLabel || "",
      nextAction: reviewItem?.primaryReason || "",
      nextReviewDate: reviewItem?.nextReviewDate || "",
      latestDate: latest?.date || "",
      latestStars: Number(latest?.stars || 0),
      status: calcNodeStatus(logs, subject, node.label),
    };
  }

  function filterEntriesBySource(entries) {
    return entries;
  }

  function readState() {
    const logs = window.MochiApp?.readStudyLogs?.() || [];
    return Object.fromEntries(allNodes().map((node) => {
      const status = calcNodeStatus(logs, node.subject, node.label);
      const mastery = status === "mastered" ? 100 : status === "learning" ? 55 : status === "dormant" ? 35 : 0;
      return [node.id, { status, mastery }];
    }));
  }

  function saveState() {
    return readState();
  }

  function updateMastery(nodeId) {
    const node = getNode(nodeId);
    return { state: readState(), masteredNow: false, node };
  }

  function render(container) {
    STATE.container = container;
    bindContainer(container);
    const logs = window.MochiApp?.readStudyLogs?.() || [];
    const reviewState = window.MochiReviewEngine?.buildReviewState?.({ logs, meta: readAllCardMeta() }) || null;
    const subject = SUBJECTS[STATE.activeSubject] || SUBJECTS.math;
    const subjectKey = STATE.activeSubject;
    let summaries = subject.nodes
      .map((node) => nodeSummary(logs, subjectKey, node, reviewState))
      .sort((a, b) => {
        if (a.count && !b.count) return -1;
        if (!a.count && b.count) return 1;
        if (a.count && b.count) return String(b.latestDate).localeCompare(String(a.latestDate));
        return subject.nodes.indexOf(a.node) - subject.nodes.indexOf(b.node);
      });
    const hasSubjectLogs = subjectLogs(logs, subjectKey).length > 0;
    const hasVisibleLogs = summaries.some((summary) => summary.count > 0);
    container.innerHTML = `
      <div class="page-head">
        <div>
          <h2>学习档案</h2>
          <p>每条学习记录都会变成一张卡片，按知识点收进这里。</p>
        </div>
        <div class="archive-head-actions">
          <button class="btn btn-outline btn-sm" data-card-export>
            <span class="material-symbols-outlined">ios_share</span>导出档案
          </button>
        </div>
      </div>
      <div class="subject-tabs archive-tabs">
        ${Object.entries(SUBJECTS).map(([key, item]) => {
          const active = key === subjectKey ? "active" : "";
          const count = item.nodes.filter((node) => logsForNode(logs, key, node.label).length > 0).length;
          return `<button class="subject-tab ${active}" data-card-subject="${key}" style="--subject-color:${item.color}">${item.label} (${count})</button>`;
        }).join("")}
      </div>
      ${hasSubjectLogs && hasVisibleLogs ? `
        <section class="archive-list">
          ${summaries.map((summary) => renderNodeRow(summary, subjectKey, subject.color)).join("")}
        </section>
      ` : renderEmpty(subject.label)}
    `;
  }

  function renderEmpty(label) {
    return `
      <section class="card archive-empty">
        <span class="material-symbols-outlined">collections_bookmark</span>
        <h3>${label}还没有学习记录</h3>
        <p class="muted">导入第一条记录后，这里会出现你的第一张卡片 🌱</p>
      </section>
    `;
  }


  function renderNodeRow(summary, subjectKey, color) {
    const expanded = STATE.expandedNode === summary.node.id && summary.count > 0;
    const status = statusInfo(summary.status);
    const highlighted = STATE.highlightNodeId === summary.node.id;
    const today = new Date().toISOString().slice(0, 10);
    const reviewDue = summary.count > 0 && summary.nextReviewDate && !["stable"].includes(summary.status);
    const reviewOverdue = reviewDue && summary.nextReviewDate <= today;
    const reviewSoonDays = reviewDue && !reviewOverdue
      ? Math.ceil((new Date(`${summary.nextReviewDate}T12:00:00`) - new Date()) / 86400000)
      : 0;
    const reviewBadge = reviewOverdue
      ? `<span class="node-review-badge urgent">今天复习</span>`
      : (reviewSoonDays > 0 && reviewSoonDays <= 3)
        ? `<span class="node-review-badge soon">${reviewSoonDays}天后复习</span>`
        : "";
    return `
      <article class="archive-node ${expanded ? "expanded" : ""} ${highlighted ? "highlighted" : ""}" data-archive-node-id="${escapeHtml(summary.node.id)}">
        <button class="node-row ${summary.status}" data-card-node="${summary.node.id}" style="--subject-color:${color}">
          <span class="node-status">${status.icon}</span>
          <span class="node-main">
            <strong>${escapeHtml(summary.node.label)}</strong>
            <small>${status.label}</small>
          </span>
          <span class="node-meta">
            ${reviewBadge}
            <span class="node-count">${summary.count ? `${summary.count}张` : "0张"}</span>
            ${summary.reviewCount ? `<span class="node-review-count">复习${summary.reviewCount}次</span>` : ""}
            ${summary.latestStars ? `<span class="node-stars">${stars(summary.latestStars)}</span>` : ""}
          </span>
        </button>
        ${expanded ? renderNodeDigest(summary, subjectKey) : ""}
      </article>
    `;
  }

  function renderNodeDigest(summary, subjectKey) {
    const summaryMode = summary.hasManualSummary ? "已校正" : "自动整理";
    const cardsLabel = `${summary.totalCount}张历史卡片`;
    return `
      <div class="archive-node-digest">
        <div class="digest-title-row">
          <strong>核心摘要</strong>
          <div class="digest-title-actions">
            <span class="digest-summary-mode">${summaryMode}</span>
            <span>${escapeHtml(summary.reviewStatusLabel || statusInfo(summary.status).label)}</span>
          </div>
        </div>
        <div class="digest-grid">
          <div>
            <small>主要卡点</small>
            <p>${formatRichText(summary.mainPainPoint || "暂时没有稳定重复的卡点。")}</p>
          </div>
          <div>
            <small>最近突破</small>
            <p>${formatRichText(summary.latestBreakthrough || "还没有沉淀出明确突破。")}</p>
          </div>
          <div>
            <small>复习状态</small>
            <p>${summary.reviewCount ? `复习${summary.reviewCount}次${summary.latestReviewResult ? `，上次：${escapeHtml(summary.latestReviewResult)}` : ""}` : "还没复习过"}</p>
          </div>
          <div>
            <small>下一步</small>
            <p>${formatRichText(summary.nextAction || (summary.lowStarCount ? `${summary.lowStarCount}次低星，适合继续压缩成一条稳定套路。` : "最近记录比较稳定，先保留精华即可。"))}</p>
            ${(summary.nextReviewDate && summary.nextReviewDate <= new Date().toISOString().slice(0, 10) && summary.count > 0)
              ? `<button class="btn btn-soft btn-sm" style="margin-top:8px" data-archive-action="go-review" data-review-key="${escapeHtml(summary.subject + "::" + summary.node.label)}" type="button"><span class="material-symbols-outlined">rate_review</span>去复习页</button>`
              : ""}
          </div>
        </div>
        ${summary.reviewNote ? `
          <div class="digest-note">
            <small>复习备注</small>
            <p>${formatRichText(summary.reviewNote)}</p>
          </div>
        ` : ""}
        <details class="archive-history-details"${STATE.historyExpanded ? " open" : ""}>
          <summary>${cardsLabel}</summary>
          <div class="study-card-list" data-card-list data-card-list-subject="${escapeHtml(subjectKey)}" data-card-list-node-label="${escapeHtml(summary.node.label)}">
            ${summary.entries.map((log, index) => renderStudyCard(log, subjectKey, index, summary.node.label)).join("")}
          </div>
        </details>
      </div>
    `;
  }

  function renderStudyCard(log, subjectKey, index, nodeLabel = log.nodeLabel || "") {
    const id = cardId(log);
    const meta = metaForLog(log);
    const source = sourceDisplayInfo(meta.source);
    const expandState = STATE.expandedCards.get(id) || null;
    const subject = SUBJECTS[subjectKey];
    const starCount = Math.max(1, Math.min(3, Number(log.stars || 1)));
    const starClass = starCount === 3 ? "stars-gold" : starCount === 2 ? "stars-orange" : "stars-gray";
    const hasRoutine = Boolean(String(log.routine || "").trim());
    const hasOriginalQuestion = Boolean(originalQuestionText(log));
    return `
      <article class="study-card expand-${expandState || "none"}"
        data-card-id="${escapeHtml(id)}"
        data-card-subject="${escapeHtml(subjectKey)}"
        data-card-node-label="${escapeHtml(nodeLabel)}"
        data-log-index="${index}"
        style="--subject-color:${subject.color}">
        <div class="card-front" data-card-action="toggle-routine">
          <div class="card-header">
            <div class="card-meta">
              <span>${escapeHtml(String(log.date || ""))}</span>
              <span class="card-source-pill ${source.className}">${source.label}</span>
              <span>${Number(log.questionsCompleted || 1)}道题</span>
            </div>
            <div class="card-head-actions">
              <div class="card-stars-badge ${starClass}">${stars(starCount)}</div>
              <button class="card-action-btn card-drag-handle" data-card-action="drag" draggable="true" type="button" title="拖动排序" aria-label="拖动排序">
                <span class="material-symbols-outlined">drag_indicator</span>
              </button>
              <button class="card-action-btn danger" data-card-action="delete" type="button" title="删除卡片" aria-label="删除卡片">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
          ${painPointHtml(log)}
          ${metaSummaryHtml(meta)}
        </div>

        ${hasRoutine ? `
        <div class="card-routine ${expandState === "routine" ? "visible" : ""}">
          <strong>今日套路：</strong>
          <div>${formatRoutine(log.routine)}</div>
        </div>
        ` : ""}

        ${hasOriginalQuestion ? `
        <div class="card-question-area">
          <button class="card-question-toggle" data-card-action="toggle-question" type="button">
            <span class="material-symbols-outlined">quiz</span>
            ${expandState === "question" ? "收起原题" : "看原题"}
          </button>
          <div class="card-question ${expandState === "question" ? "visible" : ""}">
            <p>${formatRichText(originalQuestionText(log))}</p>
          </div>
        </div>
        ` : ""}
      </article>
    `;
  }

  function readAllCardMeta() {
    return window.MochiApp?.readStudyCardMeta?.() || {};
  }

  function metaForLog(log) {
    return readAllCardMeta()[cardId(log)] || {};
  }

  function summaryKey(subject, nodeLabel) {
    return `${subject}::${nodeLabel}`;
  }

  function readNodeSummaries() {
    try {
      const saved = JSON.parse(localStorage.getItem(NODE_SUMMARY_KEY) || "{}");
      return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  }

  function writeNodeSummaries(summaries) {
    localStorage.setItem(NODE_SUMMARY_KEY, JSON.stringify(summaries && typeof summaries === "object" ? summaries : {}));
  }

  function readNodeSummary(subject, nodeLabel) {
    const saved = readNodeSummaries()[summaryKey(subject, nodeLabel)] || {};
    return normalizeNodeSummary(saved);
  }

  function normalizeNodeSummary(summary) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return { mainPainPointOverride: "", keyBreakthroughOverride: "", reviewNote: "", updatedAt: "" };
    }
    return {
      mainPainPointOverride: String(summary.mainPainPointOverride || "").trim(),
      keyBreakthroughOverride: String(summary.keyBreakthroughOverride || "").trim(),
      reviewNote: String(summary.reviewNote || "").trim(),
      updatedAt: String(summary.updatedAt || ""),
    };
  }

  function hasManualSummary(summary) {
    return Boolean(summary?.mainPainPointOverride || summary?.keyBreakthroughOverride || summary?.reviewNote);
  }

  function saveNodeSummary(subject, nodeLabel, summary) {
    const key = summaryKey(subject, nodeLabel);
    const next = normalizeNodeSummary({ ...summary, updatedAt: new Date().toISOString() });
    const all = readNodeSummaries();
    if (hasManualSummary(next)) all[key] = next;
    else delete all[key];
    writeNodeSummaries(all);
    return next;
  }

  function clearNodeSummary(subject, nodeLabel) {
    const all = readNodeSummaries();
    delete all[summaryKey(subject, nodeLabel)];
    writeNodeSummaries(all);
  }

  function sourceInfo(source) {
    return {
      lesson: { label: "新题讲解", className: "source-lesson" },
      review: { label: "复习测验", className: "source-review" },
      quiz: { label: "小测验", className: "source-quiz" },
      reflection: { label: "阶段复盘", className: "source-reflection" },
      reviewGroup: { label: "复习", className: "source-review" },
    }[source || "lesson"] || { label: "新题讲解", className: "source-lesson" };
  }

  function sourceDisplayInfo(source) {
    const normalized = source || "lesson";
    if (normalized === "lesson") return { label: "新学", className: "source-lesson" };
    return { label: "复习", className: "source-review" };
  }

  function metaSummaryHtml(meta) {
    const rows = [];
    if (meta.reviewResult) rows.push(["复习结果", meta.reviewResult]);
    if (meta.errorType) rows.push(["错误类型", meta.errorType]);
    if (meta.stuckStep) rows.push(["卡住步骤", meta.stuckStep]);
    if (meta.keyInsight) rows.push(["关键突破", meta.keyInsight]);
    if (meta.timeSpentMinutes) rows.push(["耗时", `${meta.timeSpentMinutes}分钟`]);
    if (meta.confidence) rows.push(["信心", `${meta.confidence}/5`]);
    if (Array.isArray(meta.tags) && meta.tags.length) rows.push(["题型标签", meta.tags.join("、")]);
    if (!rows.length) return "";
    return `
      <div class="card-meta-summary">
        ${rows.map(([label, value]) => `
          <span><strong>${escapeHtml(label)}：</strong>${formatRichText(value)}</span>
        `).join("")}
      </div>
    `;
  }

  function statusInfo(status) {
    return {
      untouched: { icon: "💤", label: "未开始" },
      learning: { icon: "📈", label: "学习中" },
      mastered: { icon: "⭐", label: "已掌握" },
      dormant: { icon: "🌱", label: "好久没碰" },
    }[status] || { icon: "📈", label: "学习中" };
  }

  function stars(value) {
    const count = Math.max(1, Math.min(3, Number(value || 1)));
    return `${"★".repeat(count)}${"☆".repeat(3 - count)}`;
  }

  function painPointHtml(log) {
    const painPoint = String(log.painPoint || "").trim();
    if (painPoint) return `<div class="card-painpoint">${formatRichText(painPoint)}</div>`;
    if (Number(log.stars) === 3) {
      return `<div class="card-painpoint card-painpoint--perfect">✓ 这次全部掌握，没有明显卡点</div>`;
    }
    return `<div class="card-painpoint card-painpoint--empty">这次还没有填写卡点。</div>`;
  }

  function originalQuestionText(log) {
    return String(log.originalQuestion || "").trim();
  }

  function formatRoutine(value) {
    const text = String(value || "");
    if (!text.trim()) return `<span class="routine-empty">这次还没有填写套路。</span>`;

    const stepPattern = /第[一二三四五六七八九十\d]+步[：:、.．]?/;
    if (stepPattern.test(text)) {
      const steps = text
        .split(/(?=第[一二三四五六七八九十\d]+步[：:、.．]?)/)
        .map((step) => step.trim())
        .filter(Boolean);
      return `<ol class="routine-steps">${steps.map((step) => `<li>${formatRichText(step)}</li>`).join("")}</ol>`;
    }

    return formatRichText(text).replace(/\n/g, "<br>");
  }

  function cardId(log) {
    if (log.id) return String(log.id);
    return `legacy_${hashText(JSON.stringify([
      log.date || "",
      log.subject || "",
      log.nodeLabel || "",
      log.stars || "",
      log.painPoint || "",
      originalQuestionText(log),
      log.routine || "",
    ]))}`;
  }

  function hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  function cardOrderKey(subject, nodeLabel) {
    return `${subject}::${nodeLabel}`;
  }

  function readCardOrder() {
    try {
      const saved = JSON.parse(localStorage.getItem(CARD_ORDER_KEY) || "{}");
      return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  }

  function saveCardOrder(order) {
    localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(order || {}));
  }

  function saveCardOrderFromList(list) {
    if (!list) return;
    const subject = list.dataset.cardListSubject || STATE.activeSubject || "math";
    const nodeLabel = list.dataset.cardListNodeLabel || "";
    if (!nodeLabel) return;
    const ids = [...list.querySelectorAll(".study-card[data-card-id]")]
      .map((card) => card.dataset.cardId)
      .filter(Boolean);
    const order = readCardOrder();
    order[cardOrderKey(subject, nodeLabel)] = ids;
    saveCardOrder(order);
  }

  function removeFromAllOrders(cardIdValue) {
    const order = readCardOrder();
    let changed = false;
    Object.keys(order).forEach((key) => {
      const next = (order[key] || []).filter((id) => id !== cardIdValue);
      if (next.length !== (order[key] || []).length) {
        order[key] = next;
        changed = true;
      }
    });
    if (changed) saveCardOrder(order);
  }

  function bindContainer(container) {
    if (!container || container.__mochiCardsBound) return;
    container.__mochiCardsBound = true;
    container.addEventListener("toggle", (event) => {
      if (event.target.classList.contains("archive-history-details")) {
        STATE.historyExpanded = event.target.open;
      }
    }, true);
    container.addEventListener("dragstart", (event) => {
      const handle = event.target.closest("[data-card-action='drag']");
      if (!handle) return;
      const card = handle.closest(".study-card[data-card-id]");
      if (!card) return;
      STATE.draggingCardId = card.dataset.cardId || "";
      card.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", STATE.draggingCardId);
    });
    container.addEventListener("dragover", (event) => {
      const overCard = event.target.closest(".study-card[data-card-id]");
      const dragged = container.querySelector(".study-card.dragging");
      if (!overCard || !dragged || overCard === dragged) return;
      const list = overCard.closest("[data-card-list]");
      if (!list || dragged.closest("[data-card-list]") !== list) return;
      event.preventDefault();
      const rect = overCard.getBoundingClientRect();
      const placeAfter = event.clientY > rect.top + rect.height / 2;
      list.insertBefore(dragged, placeAfter ? overCard.nextSibling : overCard);
    });
    container.addEventListener("drop", (event) => {
      const dragged = container.querySelector(".study-card.dragging");
      const list = dragged?.closest("[data-card-list]");
      if (!dragged || !list) return;
      event.preventDefault();
      saveCardOrderFromList(list);
      dragged.classList.remove("dragging");
      STATE.draggingCardId = "";
      window.MochiApp?.toast?.("卡片顺序已保存");
    });
    container.addEventListener("dragend", () => {
      const dragged = container.querySelector(".study-card.dragging");
      const list = dragged?.closest("[data-card-list]");
      if (list) saveCardOrderFromList(list);
      dragged?.classList.remove("dragging");
      STATE.draggingCardId = "";
    });
    container.addEventListener("click", (event) => {
      const archiveActionButton = event.target.closest("[data-archive-action]");
      if (archiveActionButton) {
        event.stopPropagation();
        if (archiveActionButton.dataset.archiveAction === "go-review") {
          const key = archiveActionButton.dataset.reviewKey || "";
          if (key) window.MochiReviewPage?.startItem?.(key, "suggestion");
          else window.MochiApp?.navigate?.("review");
        }
        return;
      }
      const exportButton = event.target.closest("[data-card-export]");
      if (exportButton) {
        showExportSheet();
        return;
      }
      const subjectButton = event.target.closest("button[data-card-subject]");
      if (subjectButton) {
        STATE.activeSubject = subjectButton.dataset.cardSubject || "math";
        STATE.expandedNode = "";
        STATE.highlightNodeId = "";
        STATE.historyExpanded = false;
        render(container);
        return;
      }
      const nodeButton = event.target.closest("[data-card-node]");
      if (nodeButton) {
        const id = nodeButton.dataset.cardNode;
        const nextExpanded = STATE.expandedNode === id ? "" : id;
        if (nextExpanded !== STATE.expandedNode) STATE.historyExpanded = false;
        STATE.expandedNode = nextExpanded;
        if (!STATE.expandedNode) STATE.highlightNodeId = "";
        render(container);
        return;
      }
      const card = event.target.closest("[data-card-id]");
      if (card) {
        const id = card.dataset.cardId;
        const action = event.target.closest("[data-card-action]")?.dataset.cardAction;
        if (action === "delete") {
          event.stopPropagation();
          deleteCard(card);
          return;
        }
        if (action === "drag") {
          event.stopPropagation();
          return;
        }
        if (action === "toggle-routine" || (!action && event.target.closest(".card-front"))) {
          if (event.target.closest(".card-question-area") || event.target.closest(".card-head-actions")) return;
          const current = STATE.expandedCards.get(id);
          if (current === "routine") STATE.expandedCards.delete(id);
          else STATE.expandedCards.set(id, "routine");
          rerenderCard(card);
          return;
        }
        if (action === "toggle-question") {
          event.stopPropagation();
          const current = STATE.expandedCards.get(id);
          if (current === "question") STATE.expandedCards.delete(id);
          else STATE.expandedCards.set(id, "question");
          rerenderCard(card);
          return;
        }
      }
    });
  }

  function rerenderCard(cardEl) {
    if (!cardEl) return;
    const subjectKey = cardEl.dataset.cardSubject || STATE.activeSubject || "math";
    const nodeLabel = cardEl.dataset.cardNodeLabel || "";
    const index = Number(cardEl.dataset.logIndex || 0);
    const logs = window.MochiApp?.readStudyLogs?.() || [];
    const entries = displayLogsForNode(logs, subjectKey, nodeLabel);
    const log = entries[index];
    if (!log) return;
    cardEl.outerHTML = renderStudyCard(log, subjectKey, index, nodeLabel);
  }

  function findLogByCardEl(cardEl, logs = window.MochiApp?.readStudyLogs?.() || []) {
    const subjectKey = cardEl.dataset.cardSubject || STATE.activeSubject || "math";
    const nodeLabel = cardEl.dataset.cardNodeLabel || "";
    const targetId = cardEl.dataset.cardId || "";
    const entries = displayLogsForNode(logs, subjectKey, nodeLabel);
    const log = entries.find((item) => cardId(item) === targetId);
    const index = log ? logs.indexOf(log) : -1;
    return { log, index, subjectKey, nodeLabel, targetId };
  }

  function deleteCard(cardEl) {
    const logs = window.MochiApp?.readStudyLogs?.() || [];
    const found = findLogByCardEl(cardEl, logs);
    if (!found.log || found.index < 0) return;
    if (!confirm("确定删除这张学习卡片吗？学习记录会一起删除，已获得的奖励不会倒扣。")) return;
    logs.splice(found.index, 1);
    window.MochiApp?.writeStudyLogs?.(logs);
    window.MochiApp?.removeStudyCardMeta?.(found.targetId);
    removeFromAllOrders(found.targetId);
    STATE.expandedCards.delete(found.targetId);
    window.MochiApp?.toast?.("学习卡片已删除");
    refresh();
  }

  function showEditCard(cardEl) {
    const logs = window.MochiApp?.readStudyLogs?.() || [];
    const found = findLogByCardEl(cardEl, logs);
    if (!found.log) return;
    const log = found.log;
    const meta = metaForLog(log);
    window.MochiApp?.modal?.(`
      <div class="modal-head">
        <div>
          <h2>编辑学习卡片</h2>
          <p class="muted">修改导入时保存的字段，题数仍固定为 1。</p>
        </div>
        <button class="icon-btn" data-action="close-modal" type="button" aria-label="关闭"><span class="material-symbols-outlined">close</span></button>
      </div>
      <form id="card-edit-form" class="form-grid" data-card-id="${escapeHtml(found.targetId)}" data-card-subject="${escapeHtml(found.subjectKey)}" data-card-node-label="${escapeHtml(found.nodeLabel)}">
        <div class="card-edit-grid">
          <div class="field">
            <label>科目</label>
            <select name="subject">${subjectOptions(log.subject)}</select>
          </div>
          <div class="field">
            <label>知识点</label>
            <select name="nodeLabel">${nodeOptions(log.subject, normalizeNodeLabel(log.subject, log.nodeLabel, log.nodeId))}</select>
          </div>
          <div class="field">
            <label>学习日期</label>
            <input name="date" type="date" required value="${escapeHtml(String(log.date || ""))}" />
          </div>
          <div class="field">
            <label>掌握星级</label>
            <select name="stars">${[1, 2, 3].map((value) => `<option value="${value}" ${Number(log.stars || 1) === value ? "selected" : ""}>${stars(value)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="field">
          <label>卡点记录</label>
          <textarea name="painPoint">${escapeHtml(log.painPoint || "")}</textarea>
        </div>
        <div class="field">
          <label>原题</label>
          <textarea name="originalQuestion">${escapeHtml(originalQuestionText(log))}</textarea>
        </div>
        <div class="field">
          <label>今日套路</label>
          <textarea name="routine">${escapeHtml(log.routine || "")}</textarea>
        </div>
        <div class="card-edit-meta">
          <h3>复习素材</h3>
          <div class="card-edit-grid">
            <div class="field">
              <label>学习来源</label>
              <select name="source">${sourceOptions(meta.source || "lesson")}</select>
            </div>
            <div class="field">
              <label>复习结果</label>
              <input name="reviewResult" value="${escapeHtml(meta.reviewResult || "")}" placeholder="独立做对 / 看提示做对 / 仍需讲解" />
            </div>
            <div class="field">
              <label>错误类型</label>
              <input name="errorType" value="${escapeHtml(meta.errorType || "")}" placeholder="审题漏条件 / 概念不清 / 计算错误" />
            </div>
            <div class="field">
              <label>题型标签</label>
              <input name="tags" value="${escapeHtml(Array.isArray(meta.tags) ? meta.tags.join("、") : "")}" placeholder="复合函数、换元、单调区间" />
            </div>
            <div class="field">
              <label>信心分</label>
              <input name="confidence" type="number" min="1" max="5" value="${meta.confidence || ""}" placeholder="1-5" />
            </div>
            <div class="field">
              <label>耗时分钟</label>
              <input name="timeSpentMinutes" type="number" min="1" value="${meta.timeSpentMinutes || ""}" placeholder="例如 12" />
            </div>
          </div>
          <div class="field">
            <label>卡住步骤</label>
            <textarea name="stuckStep">${escapeHtml(meta.stuckStep || "")}</textarea>
          </div>
          <div class="field">
            <label>关键突破</label>
            <textarea name="keyInsight">${escapeHtml(meta.keyInsight || "")}</textarea>
          </div>
        </div>
        <div class="card-edit-actions">
          <button class="btn btn-primary" type="submit"><span class="material-symbols-outlined">save</span>保存修改</button>
          <button class="btn btn-outline" data-action="close-modal" type="button">取消</button>
        </div>
      </form>
    `);
    bindEditForm();
  }

  function subjectOptions(activeSubject) {
    return Object.entries(SUBJECTS).map(([key, item]) => (
      `<option value="${key}" ${key === activeSubject ? "selected" : ""}>${escapeHtml(item.label)}</option>`
    )).join("");
  }

  function nodeOptions(subject, activeLabel) {
    return (SUBJECTS[subject]?.nodes || SUBJECTS.math.nodes).map((node) => (
      `<option value="${escapeHtml(node.label)}" ${node.label === activeLabel ? "selected" : ""}>${escapeHtml(node.label)}</option>`
    )).join("");
  }

  function sourceOptions(activeSource) {
    return [
      ["lesson", "新题讲解"],
      ["review", "复习测验"],
      ["quiz", "小测验"],
      ["reflection", "阶段复盘"],
    ].map(([value, label]) => (
      `<option value="${value}" ${value === activeSource ? "selected" : ""}>${label}</option>`
    )).join("");
  }

  function bindEditForm() {
    const form = document.getElementById("card-edit-form");
    if (!form) return;
    const subjectSelect = form.querySelector("[name='subject']");
    const nodeSelect = form.querySelector("[name='nodeLabel']");
    subjectSelect?.addEventListener("change", () => {
      if (nodeSelect) nodeSelect.innerHTML = nodeOptions(subjectSelect.value, "");
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveEditedCard(form);
    });
  }

  function saveEditedCard(form) {
    const logs = window.MochiApp?.readStudyLogs?.() || [];
    const fakeCard = {
      dataset: {
        cardId: form.dataset.cardId || "",
        cardSubject: form.dataset.cardSubject || STATE.activeSubject || "math",
        cardNodeLabel: form.dataset.cardNodeLabel || "",
      },
    };
    const found = findLogByCardEl(fakeCard, logs);
    if (!found.log || found.index < 0) return;
    const data = new FormData(form);
    const subject = data.get("subject") || "math";
    const nodeLabel = data.get("nodeLabel") || SUBJECTS[subject]?.nodes?.[0]?.label || "";
    const node = (SUBJECTS[subject]?.nodes || []).find((item) => item.label === nodeLabel) || SUBJECTS[subject]?.nodes?.[0];
    logs[found.index] = {
      ...found.log,
      date: data.get("date") || found.log.date || "",
      subject,
      nodeId: node?.id || found.log.nodeId,
      nodeLabel: node?.label || nodeLabel,
      questionsCompleted: 1,
      stars: Math.max(1, Math.min(3, Number(data.get("stars") || found.log.stars || 1))),
      painPoint: String(data.get("painPoint") || "").trim(),
      originalQuestion: String(data.get("originalQuestion") || "").trim(),
      routine: String(data.get("routine") || "").trim(),
    };
    window.MochiApp?.writeStudyLogs?.(logs);
    window.MochiApp?.setStudyCardMeta?.(found.targetId, {
      source: data.get("source") || "lesson",
      reviewResult: String(data.get("reviewResult") || "").trim(),
      errorType: String(data.get("errorType") || "").trim(),
      stuckStep: String(data.get("stuckStep") || "").trim(),
      keyInsight: String(data.get("keyInsight") || "").trim(),
      tags: splitInputTags(data.get("tags")),
      confidence: Number(data.get("confidence") || 0),
      timeSpentMinutes: Number(data.get("timeSpentMinutes") || 0),
    });
    removeFromAllOrders(found.targetId);
    STATE.activeSubject = subject;
    STATE.expandedNode = node?.id || STATE.expandedNode;
    STATE.expandedCards.delete(found.targetId);
    window.MochiApp?.closeModal?.();
    window.MochiApp?.checkAndGrantAchievements?.();
    window.MochiApp?.toast?.("学习卡片已更新");
    refresh();
  }

  function splitInputTags(value) {
    return String(value || "")
      .split(/[,，、\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function refresh() {
    if (!STATE.container || !document.contains(STATE.container)) return;
    render(STATE.container);
  }

  function exportDate() {
    return new Date().toISOString().slice(0, 10);
  }

  function normalizedLogs(logs) {
    return logs.map((log) => {
      const nodeLabel = normalizeNodeLabel(log.subject, log.nodeLabel, log.nodeId);
      const node = allNodes().find((item) => item.subject === log.subject && item.label === nodeLabel);
      return { ...log, nodeId: node?.id || log.nodeId, nodeLabel, originalQuestion: originalQuestionText(log) };
    });
  }

  function nodeExportSummary(logs, subject, node) {
    const entries = logsForNode(logs, subject, node.label);
    const recent = entries[0];
    const chronological = [...entries].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
    return {
      label: node.label,
      count: entries.length,
      status: statusInfo(calcNodeStatus(logs, subject, node.label)).label,
      starTrack: chronological.map((log) => `${Number(log.stars || 1)}星`).join("→"),
      painPoints: unique(entries.map((log) => log.painPoint).filter(Boolean)),
      recentRoutine: recent?.routine || "暂无套路记录",
      lastStudied: recent?.date || "",
      entries,
    };
  }

  function unique(items) {
    return [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];
  }

  function firstFilled(items) {
    return items.map((item) => String(item || "").trim()).find(Boolean) || "";
  }

  function mostCommonText(items) {
    const counts = new Map();
    items.map((item) => String(item || "").trim()).filter(Boolean).forEach((item) => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0]?.[0] || "";
  }

  function scopedSubjects(subjectScope = "all") {
    return subjectScope && subjectScope !== "all" && SUBJECTS[subjectScope]
      ? [[subjectScope, SUBJECTS[subjectScope]]]
      : Object.entries(SUBJECTS);
  }

  function subjectScopedLogs(logs, subjectScope = "all") {
    if (!subjectScope || subjectScope === "all") return logs;
    return logs.filter((log) => log.subject === subjectScope);
  }

  function scopeLabel(subjectScope = "all") {
    return subjectScope === "all" ? "全部科目" : SUBJECTS[subjectScope]?.label || "全部科目";
  }

  function generateExportText(logs = window.MochiApp?.readStudyLogs?.() || [], subjectScope = "all") {
    const normalized = subjectScopedLogs(normalizedLogs(logs), subjectScope);
    if (!normalized.length) return `【学习档案导出】${exportDate()}\n暂无学习记录`;
    const coveredCount = allNodes().filter((node) => logsForNode(normalized, node.subject, node.label).length > 0).length;
    const lines = [
      `【学习档案导出】${exportDate()}`,
      `范围：${scopeLabel(subjectScope)}`,
      `共学习 ${normalized.length} 次，覆盖 ${coveredCount} 个知识点`,
      "",
    ];
    scopedSubjects(subjectScope).forEach(([subject, info]) => {
      const summaries = info.nodes.map((node) => nodeExportSummary(normalized, subject, node));
      const touched = summaries.filter((item) => item.count > 0);
      const untouched = summaries.filter((item) => item.count === 0).map((item) => item.label);
      lines.push(`━━ ${info.label} ━━`);
      if (touched.length) {
        touched
          .sort((a, b) => String(b.lastStudied).localeCompare(String(a.lastStudied)))
          .forEach((item) => {
            lines.push(`[${item.label}] · 学了${item.count}次 · 当前状态:${item.status}`);
            lines.push(`  进步轨迹：${item.starTrack || "暂无星级记录"}`);
            lines.push(`  历史卡点：${item.painPoints.length ? item.painPoints.join("，") : "暂无卡点记录"}`);
            lines.push(`  最近套路：${item.recentRoutine}`);
            lines.push(`  最近学习：${item.lastStudied || "暂无日期"}`);
            lines.push("");
          });
      } else {
        lines.push("暂无学习记录");
        lines.push("");
      }
      lines.push(`未涉及：${untouched.length ? untouched.join("、") : "无"}`);
      lines.push("");
    });
    return lines.join("\n").trim();
  }

  function generateExportDetail(logs = window.MochiApp?.readStudyLogs?.() || [], subjectScope = "all") {
    const normalized = subjectScopedLogs(normalizedLogs(logs), subjectScope);
    if (!normalized.length) return `【详细学习记录】${exportDate()}\n暂无学习记录`;

    const lines = [
      `【详细学习记录】${exportDate()}`,
      `范围：${scopeLabel(subjectScope)}`,
      `共 ${normalized.length} 条记录`,
      "",
    ];

    scopedSubjects(subjectScope).forEach(([subject, info]) => {
      let subjectHeaderAdded = false;

      info.nodes.forEach((node) => {
        const entries = logsForNode(normalized, subject, node.label);
        if (!entries.length) return;

        if (!subjectHeaderAdded) {
          lines.push(`${"━".repeat(20)} ${info.label} ${"━".repeat(20)}`);
          lines.push("");
          subjectHeaderAdded = true;
        }

        lines.push(`【${node.label}】共 ${entries.length} 次`);

        const chronological = [...entries].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
        appendNodeSummaryExportLines(lines, subject, node.label, "  ");
        chronological.forEach((log, index) => {
          const meta = metaForLog(log);
          const source = sourceInfo(meta.source);
          const starCount = Math.max(1, Math.min(3, Number(log.stars || 1)));
          const starText = `${"★".repeat(starCount)}${"☆".repeat(3 - starCount)}`;
          const questions = Number(log.questionsCompleted || 0);
          lines.push(`  第${index + 1}次 | ${log.date || "未知日期"} | ${starText} | ${questions}题`);
          if (source.label !== "新题讲解") lines.push(`  来源：${source.label}`);

          const painPoint = String(log.painPoint || "").trim();
          if (painPoint) lines.push(`  卡点：${painPoint}`);
          else if (Number(log.stars) === 3) lines.push("  卡点：无（这次全部掌握）");

          const originalQuestion = originalQuestionText(log);
          lines.push(`  原题：${originalQuestion || "暂无原题描述"}`);

          const routine = String(log.routine || "").trim();
          if (routine) {
            const routineLines = routine.split("\n").map((line) => line.trim()).filter(Boolean);
            lines.push(`  套路：${routineLines[0] || ""}`);
            routineLines.slice(1).forEach((line) => {
              lines.push(`        ${line}`);
            });
          }
          appendMetaExportLines(lines, meta, "  ");

          lines.push("");
        });
      });

      if (!subjectHeaderAdded) {
        lines.push(`${"━".repeat(20)} ${info.label} ${"━".repeat(20)}`);
        lines.push("暂无学习记录");
        lines.push("");
      }
    });

    return lines.join("\n").trim();
  }

  function appendMetaExportLines(lines, meta, prefix = "") {
    if (!meta || typeof meta !== "object") return;
    if (meta.reviewResult) lines.push(`${prefix}复习结果：${meta.reviewResult}`);
    if (meta.errorType) lines.push(`${prefix}错误类型：${meta.errorType}`);
    if (meta.stuckStep) lines.push(`${prefix}卡住步骤：${meta.stuckStep}`);
    if (meta.keyInsight) lines.push(`${prefix}关键突破：${meta.keyInsight}`);
    if (Array.isArray(meta.tags) && meta.tags.length) lines.push(`${prefix}题型标签：${meta.tags.join("、")}`);
    if (meta.confidence) lines.push(`${prefix}信心分：${meta.confidence}/5`);
    if (meta.timeSpentMinutes) lines.push(`${prefix}耗时：${meta.timeSpentMinutes}分钟`);
  }

  function appendNodeSummaryExportLines(lines, subject, nodeLabel, prefix = "") {
    const summary = readNodeSummary(subject, nodeLabel);
    if (!hasManualSummary(summary)) return;
    lines.push(`${prefix}已校正精华摘要：`);
    if (summary.mainPainPointOverride) lines.push(`${prefix}- 主要卡点：${summary.mainPainPointOverride}`);
    if (summary.keyBreakthroughOverride) lines.push(`${prefix}- 核心突破：${summary.keyBreakthroughOverride}`);
    if (summary.reviewNote) lines.push(`${prefix}- 复习备注：${summary.reviewNote}`);
  }

  function generateExportJSON(logs = window.MochiApp?.readStudyLogs?.() || [], subjectScope = "all") {
    const normalized = subjectScopedLogs(normalizedLogs(logs), subjectScope);
    const result = {
      exportDate: exportDate(),
      scope: subjectScope,
      scopeLabel: scopeLabel(subjectScope),
      totalRecords: normalized.length,
      message: normalized.length ? "" : "暂无学习记录",
      subjects: {},
    };
    scopedSubjects(subjectScope).forEach(([subject, info]) => {
      const subjectLogs = normalized.filter((log) => log.subject === subject);
      const nodes = {};
      info.nodes.forEach((node) => {
        const entries = logsForNode(normalized, subject, node.label);
        if (!entries.length) return;
        const summary = nodeExportSummary(normalized, subject, node);
        nodes[node.label] = {
          count: summary.count,
          status: summary.status,
          stars: entries.map((log) => Number(log.stars || 1)),
          painPoints: summary.painPoints,
          originalQuestions: entries.map((log) => originalQuestionText(log)).filter(Boolean),
          routines: entries.map((log) => log.routine).filter(Boolean),
          lastStudied: summary.lastStudied,
          entries: [...entries].sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))).map(recordForExport),
        };
      });
      result.subjects[subject] = {
        label: info.label,
        totalRecords: subjectLogs.length,
        coveredNodes: Object.keys(nodes).length,
        nodes,
      };
    });
    return JSON.stringify(result, null, 2);
  }

  function recordForExport(log) {
    const meta = metaForLog(log);
    const source = sourceInfo(meta.source);
    return {
      id: cardId(log),
      date: log.date || "",
      subject: log.subject || "",
      subjectLabel: SUBJECTS[log.subject]?.label || "",
      nodeLabel: log.nodeLabel || "",
      questionsCompleted: Number(log.questionsCompleted || 1),
      stars: Number(log.stars || 1),
      source: meta.source || "lesson",
      sourceLabel: source.label,
      painPoint: String(log.painPoint || ""),
      originalQuestion: originalQuestionText(log),
      routine: String(log.routine || ""),
      meta: {
        reviewResult: meta.reviewResult || "",
        errorType: meta.errorType || "",
        stuckStep: meta.stuckStep || "",
        keyInsight: meta.keyInsight || "",
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        confidence: Number(meta.confidence || 0),
        timeSpentMinutes: Number(meta.timeSpentMinutes || 0),
        sourceRecordIds: Array.isArray(meta.sourceRecordIds) ? meta.sourceRecordIds : [],
      },
    };
  }

  function generateReviewPack(logs = window.MochiApp?.readStudyLogs?.() || [], subjectScope = "all") {
    const normalized = subjectScopedLogs(normalizedLogs(logs), subjectScope);
    if (!normalized.length) return `【MochiStudy AI复习素材包】${exportDate()}\n暂无学习记录`;

    const lines = [
      `【MochiStudy AI复习素材包】${exportDate()}`,
      `范围：${scopeLabel(subjectScope)}`,
      "",
      "用途：复制给“高考复习 AI 私教”。请它基于真实学习记录选择旧卡点，生成一题一题的复习测验，并在结束时输出新的 MOCHI-RECORD。",
      "",
      "学生画像：基础薄弱，容易受挫；需要小步提示、具体鼓励、少量高命中题，不适合一次给太多题。",
      "",
      "复习 AI 规则：",
      "1. 只基于下面的记录判断，不要编造学生没有学过的知识点。",
      "2. 优先复习 1 星、反复卡住、很久没碰、复习结果不是“独立做对”的内容。",
      "3. 一次只出 1 道题；先让学生尝试，再给提示，不要直接给完整答案。",
      "4. 题目要贴近原题和卡点，难度不要突然升高。",
      "5. 复习结束必须输出 MochiStudy 可导入的 MOCHI-RECORD。",
      "",
    ];

    const priorities = reviewPriorities(normalized).slice(0, 8);
    lines.push("━━ 待复习优先级 ━━");
    if (priorities.length) {
      priorities.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.subjectLabel} · ${item.nodeLabel}｜建议：${item.reason}`);
      });
    } else {
      lines.push("暂无明显薄弱项，可选择最近学习的知识点做轻量回顾。");
    }
    lines.push("");

    scopedSubjects(subjectScope).forEach(([subject, info]) => {
      const subjectEntries = normalized.filter((log) => log.subject === subject);
      if (!subjectEntries.length) return;
      lines.push(`${"━".repeat(18)} ${info.label} ${"━".repeat(18)}`);
      info.nodes.forEach((node) => {
        const entries = logsForNode(normalized, subject, node.label);
        if (!entries.length) return;
        const chronological = [...entries].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
        const lowStars = chronological.filter((log) => Number(log.stars || 1) <= 2).length;
        const reviewCount = chronological.filter((log) => {
          const source = metaForLog(log).source || "lesson";
          return source !== "lesson";
        }).length;
        lines.push("");
        lines.push(`【${node.label}】共 ${entries.length} 次｜低星 ${lowStars} 次｜复习/测验 ${reviewCount} 次｜状态：${statusInfo(calcNodeStatus(normalized, subject, node.label)).label}`);
        appendNodeSummaryExportLines(lines, subject, node.label, "  ");
        chronological.forEach((log, index) => {
          const meta = metaForLog(log);
          const source = sourceInfo(meta.source);
          lines.push(`- 记录${index + 1}｜id:${cardId(log)}｜${log.date || "未知日期"}｜${source.label}｜${stars(log.stars)}`);
          lines.push(`  卡点：${String(log.painPoint || "").trim() || "暂无卡点记录"}`);
          lines.push(`  原题：${originalQuestionText(log) || "暂无原题描述"}`);
          lines.push(`  套路：${String(log.routine || "").trim() || "暂无套路记录"}`);
          appendMetaExportLines(lines, meta, "  ");
        });
      });
      lines.push("");
    });

    lines.push("━━ 复习结束输出格式 ━━");
    lines.push("---MOCHI-RECORD-START---");
    lines.push("科目：[数学/物理/化学]");
    lines.push("知识点：[必须从 MochiStudy 预设知识点中选择]");
    lines.push("学习来源：复习测验");
    lines.push("掌握星级：[1-3]");
    lines.push("卡点记录：[复习后仍卡住或已经修正的地方，一句话]");
    lines.push("原题：[本次复习题/测验题的核心描述]");
    lines.push("今日套路：[本次复习真正带走的3步套路]");
    lines.push("复习结果：[独立做对/看提示做对/仍需讲解]");
    lines.push("错误类型：[概念不清/审题漏条件/公式选择/计算错误/步骤混乱/时间不够/其他]");
    lines.push("卡住步骤：[具体卡在第几步或哪个判断]");
    lines.push("关键突破：[这次最重要的修正]");
    lines.push("题型标签：[用顿号分隔，例如 复合函数、换元、单调区间]");
    lines.push("信心分：[1-5]");
    lines.push("耗时分钟：[整数]");
    lines.push("学习日期：[YYYY-MM-DD]");
    lines.push("---MOCHI-RECORD-END---");

    return lines.join("\n").trim();
  }

  function reviewPriorities(logs) {
    const items = [];
    Object.entries(SUBJECTS).forEach(([subject, info]) => {
      info.nodes.forEach((node) => {
        const entries = logsForNode(logs, subject, node.label);
        if (!entries.length) return;
        const recent = entries[0];
        const lowStarCount = entries.filter((log) => Number(log.stars || 1) <= 2).length;
        const repeatedPainCount = unique(entries.map((log) => log.painPoint).filter(Boolean)).length;
        const unresolvedReviews = entries.filter((log) => {
          const meta = metaForLog(log);
          return (meta.source && meta.source !== "lesson") && meta.reviewResult && !meta.reviewResult.includes("独立做对");
        }).length;
        const latestDate = new Date(`${String(recent.date || "").slice(0, 10)}T00:00:00`);
        const dormantDays = Number.isNaN(latestDate.getTime()) ? 0 : Math.floor((new Date() - latestDate) / 86400000);
        const score = lowStarCount * 3 + repeatedPainCount + unresolvedReviews * 3 + (dormantDays > 14 ? 2 : 0) + (dormantDays > 30 ? 2 : 0);
        if (score <= 0) return;
        const reasons = [];
        if (lowStarCount) reasons.push(`${lowStarCount}次低星`);
        if (unresolvedReviews) reasons.push(`${unresolvedReviews}次复习未独立做对`);
        if (dormantDays > 14) reasons.push(`${dormantDays}天没碰`);
        if (repeatedPainCount) reasons.push("有明确卡点");
        items.push({
          subject,
          subjectLabel: info.label,
          nodeLabel: node.label,
          score,
          reason: reasons.join("、") || "最近需要回顾",
        });
      });
    });
    return items.sort((a, b) => b.score - a.score);
  }

  function exportContent(format, subjectScope = STATE.exportSubject || "all") {
    const logs = window.MochiApp?.readStudyLogs?.() || [];
    if (format === "json") return generateExportJSON(logs, subjectScope);
    if (format === "review") return generateReviewPack(logs, subjectScope);
    if (format === "detail") return generateExportDetail(logs, subjectScope);
    return generateExportText(logs, subjectScope);
  }

  const EXPORT_FORMAT_HINTS = {
    text: "适合粘贴给 AI 做整体学习分析",
    detail: "适合粘贴给 AI 针对卡点出题或制定复习计划",
    review: "适合粘贴给复习 AI 私教，生成复习测验并回写记录",
    json: "适合开发或自动化处理",
  };

  function showExportSheet() {
    document.getElementById("archive-export-root")?.remove();
    const root = document.createElement("div");
    root.id = "archive-export-root";
    root.className = "archive-export-root";
    root.innerHTML = `
      <section class="archive-export-sheet" role="dialog" aria-modal="true" aria-labelledby="archive-export-title">
        <div class="modal-head">
          <div>
            <h2 id="archive-export-title">导出学习档案</h2>
          </div>
          <button class="icon-btn" data-export-close aria-label="关闭"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="archive-export-switch" role="tablist">
          <button class="active" data-export-format="text">摘要</button>
          <button data-export-format="detail">详细记录</button>
          <button data-export-format="review">AI复习包</button>
          <button data-export-format="json">JSON</button>
        </div>
        <div class="archive-export-scope" aria-label="导出科目范围">
          ${renderExportScopeButtons()}
        </div>
        <p class="archive-export-hint" data-export-hint>${EXPORT_FORMAT_HINTS.text}</p>
        <textarea class="archive-export-preview" readonly></textarea>
        <div class="archive-export-actions">
          <button class="btn btn-primary" data-export-copy><span class="material-symbols-outlined">content_copy</span><span data-copy-label>复制到剪贴板</span></button>
          <button class="btn btn-outline" data-export-close>关闭</button>
        </div>
      </section>
    `;
    document.body.appendChild(root);
    bindExportSheet(root);
    updateExportPreview(root, "text");
  }

  function renderExportScopeButtons() {
    const options = [["all", "全部"], ...Object.entries(SUBJECTS).map(([key, item]) => [key, item.label])];
    return options.map(([value, label]) => (
      `<button class="${STATE.exportSubject === value ? "active" : ""}" data-export-scope="${value}" type="button">${label}</button>`
    )).join("");
  }

  function bindExportSheet(root) {
    root.addEventListener("click", async (event) => {
      if (event.target === root || event.target.closest("[data-export-close]")) {
        root.remove();
        return;
      }
      const formatButton = event.target.closest("[data-export-format]");
      if (formatButton) {
        const format = formatButton.dataset.exportFormat || "text";
        root.querySelectorAll("[data-export-format]").forEach((button) => {
          button.classList.toggle("active", button === formatButton);
        });
        updateExportPreview(root, format);
        return;
      }
      const scopeButton = event.target.closest("[data-export-scope]");
      if (scopeButton) {
        STATE.exportSubject = scopeButton.dataset.exportScope || "all";
        root.querySelectorAll("[data-export-scope]").forEach((button) => {
          button.classList.toggle("active", button === scopeButton);
        });
        const activeFormat = root.querySelector("[data-export-format].active")?.dataset.exportFormat || "text";
        updateExportPreview(root, activeFormat);
        return;
      }
      const copyButton = event.target.closest("[data-export-copy]");
      if (copyButton) {
        const preview = root.querySelector(".archive-export-preview");
        const ok = await copyToClipboard(preview?.value || "");
        const label = copyButton.querySelector("[data-copy-label]");
        if (ok && label) {
          label.textContent = "✓ 已复制";
          setTimeout(() => {
            if (label.isConnected) label.textContent = "复制到剪贴板";
          }, 2000);
        }
      }
    });
  }

  function updateExportPreview(root, format) {
    const preview = root.querySelector(".archive-export-preview");
    if (preview) preview.value = exportContent(format, STATE.exportSubject || "all");
    const hint = root.querySelector("[data-export-hint]");
    if (hint) hint.textContent = EXPORT_FORMAT_HINTS[format] || EXPORT_FORMAT_HINTS.text;
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    }
  }

  function setActiveSubject(subject) {
    if (SUBJECTS[subject]) STATE.activeSubject = subject;
  }

  function renderMap(container) {
    render(container);
  }

  function renderDetail(nodeId, options = {}) {
    const node = getNode(nodeId);
    if (!node || !STATE.container) return;
    STATE.activeSubject = node.subject;
    STATE.expandedNode = node.id;
    STATE.highlightNodeId = node.id;
    render(STATE.container);
    setTimeout(() => {
      const escaped = window.CSS?.escape ? CSS.escape(node.id) : node.id.replace(/"/g, '\\"');
      const target = STATE.container?.querySelector(`[data-archive-node-id="${escaped}"]`);
      target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function formatRichText(value) {
    const escaped = escapeHtml(value).replace(/＄/g, "$");
    return escaped.replace(/\$([^$\n]+)\$/g, (_, formula) => `<span class="math-inline">${formatInlineMath(formula)}</span>`);
  }

  function formatInlineMath(value) {
    let text = String(value || "");
    text = text.replace(/\\cdot/g, "·").replace(/\\times/g, "×").replace(/\\leq/g, "≤").replace(/\\geq/g, "≥").replace(/\\neq/g, "≠");
    const symbols = {
      "\\sin": "sin",
      "\\cos": "cos",
      "\\tan": "tan",
      "\\ln": "ln",
      "\\log": "log",
      "\\rightleftharpoons": "⇌",
      "\\alpha": "α",
      "\\beta": "β",
      "\\gamma": "γ",
      "\\Gamma": "Γ",
      "\\delta": "δ",
      "\\Delta": "Δ",
      "\\epsilon": "ε",
      "\\theta": "θ",
      "\\lambda": "λ",
      "\\mu": "μ",
      "\\pi": "π",
      "\\rho": "ρ",
      "\\sigma": "σ",
      "\\omega": "ω",
      "\\Omega": "Ω",
      "\\phi": "φ",
      "\\Phi": "Φ",
    };
    Object.entries(symbols).forEach(([source, target]) => {
      text = text.replaceAll(source, target);
    });
    text = text.replace(/([A-Za-z0-9)]+)_\{([^{}]+)\}/g, "$1<sub>$2</sub>");
    text = text.replace(/([A-Za-z0-9)]+)_([A-Za-z0-9]+)/g, "$1<sub>$2</sub>");
    text = text.replace(/([A-Za-z0-9)]+)\^\{([^{}]+)\}/g, "$1<sup>$2</sup>");
    text = text.replace(/([A-Za-z0-9)]+)\^([A-Za-z0-9]+)/g, "$1<sup>$2</sup>");
    return text;
  }

  window.MochiCards = {
    SUBJECTS,
    allNodes,
    getNode,
    normalizeNodeLabel,
    calcNodeStatus,
    generateExportText,
    generateExportDetail,
    generateExportJSON,
    generateReviewPack,
    readNodeSummaries,
    readNodeSummary,
    saveNodeSummary,
    clearNodeSummary,
    render,
    refresh,
    showExportSheet,
  };

  window.MochiKnowledge = {
    SUBJECTS,
    allNodes,
    getNode,
    readState,
    saveState,
    updateMastery,
    renderMap,
    renderDetail,
    setActiveSubject,
    controlViewport() {},
  };
})();
