(function () {
  const STATE = {
    activeSubject: "math",
    expandedNode: "",
    expandedCards: new Set(),
    container: null,
  };
  const DEFAULT_CARDS_CONFIG = { masteredMinRecent: 2, dormantDays: 30 };

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

  function nodeSummary(logs, subject, node) {
    const entries = logsForNode(logs, subject, node.label);
    const latest = entries[0];
    return {
      node,
      entries,
      count: entries.length,
      latestDate: latest?.date || "",
      latestStars: Number(latest?.stars || 0),
      status: calcNodeStatus(logs, subject, node.label),
    };
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
    const subject = SUBJECTS[STATE.activeSubject] || SUBJECTS.math;
    const subjectKey = STATE.activeSubject;
    const summaries = subject.nodes
      .map((node) => nodeSummary(logs, subjectKey, node))
      .sort((a, b) => {
        if (a.count && !b.count) return -1;
        if (!a.count && b.count) return 1;
        if (a.count && b.count) return String(b.latestDate).localeCompare(String(a.latestDate));
        return subject.nodes.indexOf(a.node) - subject.nodes.indexOf(b.node);
      });
    const hasSubjectLogs = subjectLogs(logs, subjectKey).length > 0;
    container.innerHTML = `
      <div class="page-head">
        <div>
          <h2>学习档案</h2>
          <p>每条学习记录都会变成一张卡片，按知识点收进这里。</p>
        </div>
        <button class="btn btn-outline btn-sm" data-card-export>
          <span class="material-symbols-outlined">ios_share</span>导出档案
        </button>
      </div>
      <div class="subject-tabs archive-tabs">
        ${Object.entries(SUBJECTS).map(([key, item]) => {
          const active = key === subjectKey ? "active" : "";
          const count = item.nodes.filter((node) => logsForNode(logs, key, node.label).length > 0).length;
          return `<button class="subject-tab ${active}" data-card-subject="${key}" style="--subject-color:${item.color}">${item.label} (${count})</button>`;
        }).join("")}
      </div>
      ${hasSubjectLogs ? `
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
    return `
      <article class="archive-node ${expanded ? "expanded" : ""}">
        <button class="node-row ${summary.status}" data-card-node="${summary.node.id}" style="--subject-color:${color}">
          <span class="node-status">${status.icon}</span>
          <span class="node-main">
            <strong>${escapeHtml(summary.node.label)}</strong>
            <small>${status.label}</small>
          </span>
          <span class="node-meta">
            <span class="node-count">${summary.count ? `${summary.count}张` : "0张"}</span>
            ${summary.latestStars ? `<span class="node-stars">${stars(summary.latestStars)}</span>` : ""}
          </span>
        </button>
        ${expanded ? `<div class="study-card-list">${summary.entries.map((log, index) => renderStudyCard(log, subjectKey, index)).join("")}</div>` : ""}
      </article>
    `;
  }

  function renderStudyCard(log, subjectKey, index) {
    const id = cardId(log, index);
    const expanded = STATE.expandedCards.has(id);
    const subject = SUBJECTS[subjectKey];
    const starCount = Math.max(1, Math.min(3, Number(log.stars || 1)));
    const starClass = starCount === 3 ? "stars-gold" : starCount === 2 ? "stars-orange" : "stars-gray";
    return `
      <article class="study-card ${expanded ? "expanded" : ""}" data-card-id="${id}" style="--subject-color:${subject.color}">
        <div class="card-header">
          <div class="card-meta">
            <span>${escapeHtml(String(log.date || ""))}</span>
            <span>${Number(log.questionsCompleted || 0)}道题</span>
          </div>
          <div class="card-stars-badge ${starClass}">${stars(starCount)}</div>
        </div>
        ${painPointHtml(log)}
        <div class="card-routine">
          <strong>今日套路：</strong>
          <div>${formatRoutine(log.routine)}</div>
        </div>
      </article>
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
    if (painPoint) return `<div class="card-painpoint">${escapeHtml(painPoint)}</div>`;
    if (Number(log.stars) === 3) {
      return `<div class="card-painpoint card-painpoint--perfect">✓ 这次全部掌握，没有明显卡点</div>`;
    }
    return `<div class="card-painpoint card-painpoint--empty">这次还没有填写卡点。</div>`;
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
      return `<ol class="routine-steps">${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`;
    }

    return escapeHtml(text).replace(/\n/g, "<br>");
  }

  function cardId(log, index) {
    return log.id || `${log.date || "no-date"}_${log.subject || ""}_${log.nodeLabel || ""}_${index}`;
  }

  function bindContainer(container) {
    if (!container || container.__mochiCardsBound) return;
    container.__mochiCardsBound = true;
    container.addEventListener("click", (event) => {
      const exportButton = event.target.closest("[data-card-export]");
      if (exportButton) {
        showExportSheet();
        return;
      }
      const subjectButton = event.target.closest("[data-card-subject]");
      if (subjectButton) {
        STATE.activeSubject = subjectButton.dataset.cardSubject || "math";
        STATE.expandedNode = "";
        render(container);
        return;
      }
      const nodeButton = event.target.closest("[data-card-node]");
      if (nodeButton) {
        const id = nodeButton.dataset.cardNode;
        STATE.expandedNode = STATE.expandedNode === id ? "" : id;
        render(container);
        return;
      }
      const card = event.target.closest("[data-card-id]");
      if (card) {
        const id = card.dataset.cardId;
        if (STATE.expandedCards.has(id)) STATE.expandedCards.delete(id);
        else STATE.expandedCards.add(id);
        render(container);
      }
    });
  }

  function refresh() {
    if (STATE.container) render(STATE.container);
  }

  function exportDate() {
    return new Date().toISOString().slice(0, 10);
  }

  function normalizedLogs(logs) {
    return logs.map((log) => {
      const nodeLabel = normalizeNodeLabel(log.subject, log.nodeLabel, log.nodeId);
      const node = allNodes().find((item) => item.subject === log.subject && item.label === nodeLabel);
      return { ...log, nodeId: node?.id || log.nodeId, nodeLabel };
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

  function generateExportText(logs = window.MochiApp?.readStudyLogs?.() || []) {
    const normalized = normalizedLogs(logs);
    if (!normalized.length) return `【学习档案导出】${exportDate()}\n暂无学习记录`;
    const coveredCount = allNodes().filter((node) => logsForNode(normalized, node.subject, node.label).length > 0).length;
    const lines = [
      `【学习档案导出】${exportDate()}`,
      `共学习 ${normalized.length} 次，覆盖 ${coveredCount} 个知识点`,
      "",
    ];
    Object.entries(SUBJECTS).forEach(([subject, info]) => {
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

  function generateExportJSON(logs = window.MochiApp?.readStudyLogs?.() || []) {
    const normalized = normalizedLogs(logs);
    const result = {
      exportDate: exportDate(),
      totalRecords: normalized.length,
      message: normalized.length ? "" : "暂无学习记录",
      subjects: {},
    };
    Object.entries(SUBJECTS).forEach(([subject, info]) => {
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
          routines: entries.map((log) => log.routine).filter(Boolean),
          lastStudied: summary.lastStudied,
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

  function exportContent(format) {
    const logs = window.MochiApp?.readStudyLogs?.() || [];
    return format === "json" ? generateExportJSON(logs) : generateExportText(logs);
  }

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
          <button data-export-format="json">JSON 格式</button>
          <button class="active" data-export-format="text">文字格式</button>
        </div>
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
    if (preview) preview.value = exportContent(format);
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

  function renderDetail(nodeId) {
    const node = getNode(nodeId);
    if (!node || !STATE.container) return;
    STATE.activeSubject = node.subject;
    STATE.expandedNode = node.id;
    render(STATE.container);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  window.MochiCards = {
    SUBJECTS,
    allNodes,
    getNode,
    normalizeNodeLabel,
    calcNodeStatus,
    generateExportText,
    generateExportJSON,
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
