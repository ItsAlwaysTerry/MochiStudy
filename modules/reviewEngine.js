(function () {
  const DEFAULT_REVIEW_SETTINGS = {
    lowStarThreshold: 2,
    newKnowledgeReviewAfterDays: 2,
    staleAfterDays: 7,
    masteredCooldownDays: 14,
    weakCooldownDays: 3,
    maxTodaySuggestions: 2,
  };

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function dateOnly(value) {
    return String(value || "").slice(0, 10);
  }

  function parseDate(value) {
    const date = new Date(`${dateOnly(value)}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function addDays(value, days) {
    const date = parseDate(value);
    if (!date) return "";
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function daysSince(value) {
    const date = parseDate(value);
    if (!date) return 0;
    const today = parseDate(todayKey());
    return Math.max(0, Math.floor((today - date) / 86400000));
  }

  function cardId(log) {
    if (log?.id) return String(log.id);
    return `legacy_${hashText(JSON.stringify([
      log?.date || "",
      log?.subject || "",
      log?.nodeLabel || "",
      log?.stars || "",
      log?.painPoint || "",
      log?.originalQuestion || "",
      log?.routine || "",
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

  function metaFor(log, allMeta) {
    return allMeta?.[cardId(log)] || {};
  }

  function sourceLabel(source) {
    return {
      lesson: "新题讲解",
      review: "复习测验",
      quiz: "综合测验",
      reflection: "阶段复盘",
    }[source || "lesson"] || "新题讲解";
  }

  function stars(value) {
    const count = Math.max(1, Math.min(3, Number(value || 1)));
    return `${"★".repeat(count)}${"☆".repeat(3 - count)}`;
  }

  function normalizeLogs(logs) {
    return (Array.isArray(logs) ? logs : []).map((log) => {
      const subject = log.subject || "math";
      const label = window.MochiCards?.normalizeNodeLabel?.(subject, log.nodeLabel || "", log.nodeId) || log.nodeLabel || "";
      const node = window.MochiKnowledge?.allNodes?.().find((item) => item.subject === subject && item.label === label);
      return {
        ...log,
        subject,
        nodeLabel: label,
        nodeId: node?.id || log.nodeId,
        originalQuestion: String(log.originalQuestion || ""),
      };
    });
  }

  function isReviewLike(meta) {
    const source = meta?.source || "lesson";
    return source && source !== "lesson";
  }

  function classifyReviewResult(value) {
    const text = String(value || "").trim();
    if (!text) return "unknown";
    if (/未掌握|仍需|不会|没做对|讲解|卡住/.test(text)) return "weak";
    if (/独立做对|基本掌握|已掌握|掌握/.test(text)) return "mastered";
    if (/提示|部分|不稳|半懂/.test(text)) return "partial";
    return "partial";
  }

  function mostCommonText(values) {
    const counts = new Map();
    values
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0]?.[0] || "";
  }

  function buildReviewState(options = {}) {
    const settings = { ...DEFAULT_REVIEW_SETTINGS, ...(options.settings || {}) };
    const logs = normalizeLogs(options.logs || window.MochiApp?.readStudyLogs?.() || []);
    const allMeta = options.meta || window.MochiApp?.readStudyCardMeta?.() || {};
    const items = [];
    const subjects = window.MochiKnowledge?.SUBJECTS || {};

    Object.entries(subjects).forEach(([subject, info]) => {
      info.nodes.forEach((node) => {
        const entries = logs
          .filter((log) => log.subject === subject && log.nodeLabel === node.label)
          .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
        if (!entries.length) return;

        const reviewEntries = entries.filter((log) => isReviewLike(metaFor(log, allMeta)));
        const lowStarEntries = entries.filter((log) => Number(log.stars || 1) <= settings.lowStarThreshold);
        const latest = entries[0];
        const latestReview = reviewEntries[0] || null;
        const latestReviewMeta = latestReview ? metaFor(latestReview, allMeta) : {};
        const lastStudyDate = dateOnly(latest?.date);
        const lastReviewDate = dateOnly(latestReview?.date);
        const lastReviewResult = latestReviewMeta.reviewResult || "";
        const reviewClass = classifyReviewResult(lastReviewResult);
        const unresolvedReviews = reviewEntries.filter((log) => {
          const meta = metaFor(log, allMeta);
          return classifyReviewResult(meta.reviewResult) !== "mastered";
        }).length;
        const mainPainPoint = mostCommonText([
          ...lowStarEntries.map((log) => log.painPoint),
          ...reviewEntries.map((log) => metaFor(log, allMeta).stuckStep),
          ...entries.map((log) => log.painPoint),
        ]);
        const painCounts = new Map();
        entries.forEach((log) => {
          const p = String(log.painPoint || "").trim();
          if (p) painCounts.set(p, (painCounts.get(p) || 0) + 1);
        });
        const repeatedPainCount = Math.max(0, ...[...painCounts.values()]);
        const nextReviewDate = calcNextReviewDate(entries, latestReview, reviewClass, settings, reviewEntries, allMeta);
        const due = !nextReviewDate || nextReviewDate <= todayKey();
        const recencyDays = daysSince(lastStudyDate);
        const reviewDays = lastReviewDate ? daysSince(lastReviewDate) : null;
        const score = calcPriorityScore({
          lowStarCount: lowStarEntries.length,
          unresolvedReviews,
          repeatedPainCount,
          recencyDays,
          reviewCount: reviewEntries.length,
          reviewClass,
          due,
          reviewDays,
          settings,
        });
        const reasons = buildReasons({
          lowStarCount: lowStarEntries.length,
          unresolvedReviews,
          repeatedPainCount,
          recencyDays,
          reviewCount: reviewEntries.length,
          lastReviewResult,
          due,
          nextReviewDate,
          mainPainPoint,
          settings,
        });
        const status = statusFor({ score, due, lowStarCount: lowStarEntries.length, reviewClass, latestReview });
        const statusLabel = statusInfo(status).label;
        const primaryReason = buildPrimaryReason({
          reasons,
          status,
          nextReviewDate,
          mainPainPoint,
          recencyDays,
          lowStarCount: lowStarEntries.length,
          lastReviewResult,
        });

        items.push({
          key: `${subject}::${node.label}`,
          subject,
          subjectLabel: info.label,
          subjectColor: info.color,
          nodeId: node.id,
          nodeLabel: node.label,
          entries,
          totalCards: entries.length,
          lowStarCount: lowStarEntries.length,
          reviewCount: reviewEntries.length,
          unresolvedReviews,
          lastStudyDate,
          lastReviewDate,
          lastReviewResult,
          mainPainPoint,
          repeatedPainCount,
          daysSinceLastStudy: recencyDays,
          daysSinceLastReview: reviewDays,
          nextReviewDate,
          due,
          score,
          status,
          statusLabel,
          primaryReason,
          reasons,
          summaryLine: summaryLine({ recencyDays, lowStarCount: lowStarEntries.length, reviewCount: reviewEntries.length, lastReviewResult }),
          settings,
        });
      });
    });

    const sorted = items.sort((a, b) => b.score - a.score || String(b.lastStudyDate).localeCompare(String(a.lastStudyDate)));
    const todaySuggestions = sorted
      .filter((item) => item.due && ["not-reviewed", "review-soon", "needs-work"].includes(item.status) && item.score > 0)
      .slice(0, settings.maxTodaySuggestions);
    return { settings, items: sorted, todaySuggestions };
  }

  function calcNextReviewDate(entries, latestReview, reviewClass, settings, reviewEntries, allMeta) {
    if (latestReview) {
      let cooldown;
      if (reviewClass === "mastered") {
        let consecutiveMastered = 0;
        for (const log of (reviewEntries || [])) {
          if (classifyReviewResult(metaFor(log, allMeta || {}).reviewResult) === "mastered") {
            consecutiveMastered += 1;
          } else {
            break;
          }
        }
        cooldown = Math.min(settings.masteredCooldownDays * Math.pow(2, consecutiveMastered - 1), 60);
      } else {
        cooldown = settings.weakCooldownDays;
      }
      return addDays(latestReview.date, cooldown);
    }
    const latest = entries[0];
    const hasLowStar = entries.some((log) => Number(log.stars || 1) <= settings.lowStarThreshold);
    return addDays(latest?.date, hasLowStar ? settings.newKnowledgeReviewAfterDays : settings.staleAfterDays);
  }

  function calcPriorityScore(input) {
    let score = 0;
    score += input.lowStarCount * 12;
    score += input.unresolvedReviews * 16;
    score += Math.min(18, Math.floor(input.recencyDays / 3) * 2);
    if (input.reviewCount === 0) score += 10;
    if (input.repeatedPainCount > 1) score += 6;
    if (input.reviewClass === "partial") score += 8;
    if (input.reviewClass === "weak") score += 14;
    if (input.reviewClass === "mastered") score -= 18;
    if (!input.due) score -= input.reviewClass === "mastered" ? 60 : 18;
    return Math.max(0, score);
  }

  function buildReasons(input) {
    const reasons = [];
    if (input.lowStarCount) reasons.push(`${input.lowStarCount}次低星`);
    if (input.reviewCount === 0) reasons.push("还没复习过");
    if (input.recencyDays >= input.settings.staleAfterDays) reasons.push(`${input.recencyDays}天没碰`);
    if (input.lastReviewResult) reasons.push(`上次：${input.lastReviewResult}`);
    if (input.unresolvedReviews) reasons.push(`${input.unresolvedReviews}次复习未稳`);
    if (input.repeatedPainCount > 1 && input.mainPainPoint) reasons.push("卡点反复出现");
    if (!input.due && input.nextReviewDate) reasons.push(`下次建议：${input.nextReviewDate}`);
    return reasons.slice(0, 4);
  }

  function statusFor(input) {
    if (!input.due && input.latestReview) {
      if (input.reviewClass === "mastered") return "stable";
      return "consolidating";
    }
    if (input.reviewClass === "weak") return "needs-work";
    if (input.reviewClass === "partial") return "review-soon";
    if (!input.latestReview) return "not-reviewed";
    if (input.lowStarCount) return "review-soon";
    return input.score > 0 ? "review-soon" : "stable";
  }

  function statusInfo(status) {
    return {
      "not-reviewed": { label: "待复习", tone: "pending" },
      "review-soon": { label: "待复习", tone: "pending" },
      "needs-work": { label: "仍需继续", tone: "weak" },
      consolidating: { label: "待巩固", tone: "cooldown" },
      stable: { label: "近期稳定", tone: "stable" },
    }[status] || { label: "待复习", tone: "pending" };
  }

  function buildPrimaryReason(input) {
    if (input.status === "stable") return `已进入冷却期，下次建议 ${input.nextReviewDate || "稍后"} 再看。`;
    if (input.status === "consolidating") return `刚复习过，${input.nextReviewDate || "过几天"} 再巩固，避免今天反复消耗。`;
    if (input.mainPainPoint) {
      const prefix = input.lowStarCount ? `${input.lowStarCount}次低星` : `${input.recencyDays}天没碰`;
      const painPoint = String(input.mainPainPoint || "").replace(/[。．.]+$/u, "");
      return `${prefix}，主要卡在“${painPoint}”。`;
    }
    if (input.lastReviewResult) return `上次复习结果是“${input.lastReviewResult}”，需要确认是否真的稳了。`;
    return input.reasons[0] || "最近需要轻量回顾。";
  }

  function summaryLine(input) {
    const parts = [];
    parts.push(`${input.recencyDays}天没碰`);
    if (input.lowStarCount) parts.push(`${input.lowStarCount}次低星`);
    parts.push(input.reviewCount ? `${input.reviewCount}次复习` : "还没复习过");
    if (input.lastReviewResult) parts.push(`上次：${input.lastReviewResult}`);
    return parts.join("｜");
  }

  function generateNodeReviewPack(item) {
    if (!item) return "暂无可复习内容";
    const chronological = [...item.entries].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
    const recordIds = chronological.map(cardId);
    const nodeSummary = window.MochiCards?.readNodeSummary?.(item.subject, item.nodeLabel) || {};
    const hasNodeSummary = Boolean(nodeSummary.mainPainPointOverride || nodeSummary.keyBreakthroughOverride || nodeSummary.reviewNote);
    const lines = [
      `【MochiStudy AI复习素材包】${todayKey()}`,
      `范围：${item.subjectLabel} · ${item.nodeLabel}`,
      "",
      "用途：复制给“高考复习 AI 私教”。请它只围绕这个知识点做一次小复习，先测再提示，结束后输出可导入 MochiStudy 的 MOCHI-RECORD。",
      "",
      "学生画像：基础薄弱，容易受挫；需要小步提示、具体鼓励、少量高命中题，不适合一次给太多题。",
      "",
      "待复习原因：",
      ...(item.reasons.length ? item.reasons.map((reason) => `- ${reason}`) : ["- 最近需要轻量回顾"]),
      item.mainPainPoint ? `- 主要卡点：${item.mainPainPoint}` : "",
      hasNodeSummary ? "已校正精华摘要：" : "",
      nodeSummary.mainPainPointOverride ? `- 主要卡点：${nodeSummary.mainPainPointOverride}` : "",
      nodeSummary.keyBreakthroughOverride ? `- 核心突破：${nodeSummary.keyBreakthroughOverride}` : "",
      nodeSummary.reviewNote ? `- 复习备注：${nodeSummary.reviewNote}` : "",
      hasNodeSummary ? "" : "",
      "",
      "复习 AI 规则：",
      "1. 只基于下面的历史记录出题，不要编造学生没有学过的新知识点。",
      "2. 一次只出 1 道题；先让学生尝试，再给提示，不要直接给完整答案。",
      "3. 题目要贴近原题和卡点，难度不要突然升高。",
      "4. 复习结束必须输出下面格式的 MOCHI-RECORD。",
      "",
      "历史记录：",
    ].filter(Boolean);

    chronological.forEach((log, index) => {
      const meta = window.MochiApp?.readStudyCardMeta?.()?.[cardId(log)] || {};
      lines.push(`- 记录${index + 1}｜id:${cardId(log)}｜${log.date || "未知日期"}｜${sourceLabel(meta.source)}｜${stars(log.stars)}`);
      lines.push(`  卡点：${String(log.painPoint || "").trim() || "暂无卡点记录"}`);
      lines.push(`  原题：${String(log.originalQuestion || "").trim() || "暂无原题描述"}`);
      lines.push(`  套路：${String(log.routine || "").trim() || "暂无套路记录"}`);
      if (meta.reviewResult) lines.push(`  复习结果：${meta.reviewResult}`);
      if (meta.errorType) lines.push(`  错误类型：${meta.errorType}`);
      if (meta.stuckStep) lines.push(`  卡住步骤：${meta.stuckStep}`);
      if (meta.keyInsight) lines.push(`  关键突破：${meta.keyInsight}`);
      if (Array.isArray(meta.tags) && meta.tags.length) lines.push(`  题型标签：${meta.tags.join("、")}`);
    });

    lines.push("");
    lines.push("━━ 复习结束输出格式 ━━");
    lines.push("---MOCHI-RECORD-START---");
    lines.push(`科目：${item.subjectLabel}`);
    lines.push(`知识点：${item.nodeLabel}`);
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
    lines.push(`关联记录：${recordIds.join("、")}`);
    lines.push("学习日期：[YYYY-MM-DD]");
    lines.push("---MOCHI-RECORD-END---");

    return lines.join("\n").trim();
  }

  function generateSessionPack(overrideItems, maxItems = 4) {
    const reviewState = buildReviewState();
    const pool = overrideItems || reviewState.items
      .filter((item) => item.score > 0 || item.due)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems);

    if (!pool.length) return "暂无足够的复习内容，继续学习后再来。";

    // Put lowest-score item first as warm-up, rest ordered most-urgent first
    const sorted = [...pool].sort((a, b) => b.score - a.score);
    const warmup = sorted.length >= 2 ? sorted.pop() : null;
    const ordered = warmup ? [warmup, ...sorted] : sorted;

    const lines = [
      `【MochiStudy 综合测验包】${todayKey()}`,
      `今日测验：${ordered.length} 个知识点`,
      "",
      "学生画像：基础薄弱，容易受挫；需要小步提示、具体鼓励；已积累多张学习卡片。",
      "",
      "━━ 测验规则 ━━",
      "1. 从第一个知识点（热身）开始，出一道题，等学生作答",
      "2. 先让学生尝试，最多两层提示，不直接给完整答案",
      "3. 每个知识点测完一题后，让学生一句话总结，然后进入下一个",
      "4. 热身题稍容易；核心题直指卡点",
      "5. 全部做完后一次性输出所有 MOCHI-RECORD，中途不要提前输出",
      "",
    ];

    ordered.forEach((item, index) => {
      const isWarmup = index === 0;
      const chronological = [...item.entries].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
      const recent = chronological.slice(-3);
      const recordIds = chronological.map(cardId);
      const nodeSummary = window.MochiCards?.readNodeSummary?.(item.subject, item.nodeLabel) || {};

      lines.push(`━━ 知识点 ${index + 1}${isWarmup ? "（热身）" : ""}：${item.subjectLabel} · ${item.nodeLabel} ━━`);
      lines.push(`卡片数：${item.totalCards} 张　低星记录：${item.lowStarCount} 张`);
      if (item.mainPainPoint) lines.push(`主要卡点：${item.mainPainPoint}`);
      if (nodeSummary.mainPainPointOverride) lines.push(`精华摘要-卡点：${nodeSummary.mainPainPointOverride}`);
      if (nodeSummary.keyBreakthroughOverride) lines.push(`精华摘要-突破：${nodeSummary.keyBreakthroughOverride}`);
      if (item.reasons.length) lines.push(`复习原因：${item.reasons[0]}`);
      lines.push("");

      if (recent.length) {
        lines.push("最近记录：");
        recent.forEach((log) => {
          const meta = window.MochiApp?.readStudyCardMeta?.()?.[cardId(log)] || {};
          lines.push(`  ${log.date || "未知"}｜${"★".repeat(log.stars || 1)}${"☆".repeat(3 - (log.stars || 1))}｜${sourceLabel(meta.source)}`);
          lines.push(`    卡点：${String(log.painPoint || "").trim() || "暂无"}`);
          if (String(log.originalQuestion || "").trim()) lines.push(`    原题：${String(log.originalQuestion).trim()}`);
          lines.push(`    套路：${String(log.routine || "").trim() || "暂无"}`);
          if (meta.reviewResult) lines.push(`    复习结果：${meta.reviewResult}`);
        });
      }
      lines.push("");
    });

    lines.push("━━ 全部做完后统一输出（按顺序每个知识点一条）━━");
    lines.push("");

    ordered.forEach((item) => {
      const chronological = [...item.entries].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
      const recordIds = chronological.map(cardId);
      lines.push("---MOCHI-RECORD-START---");
      lines.push(`科目：${item.subjectLabel}`);
      lines.push(`知识点：${item.nodeLabel}`);
      lines.push("学习来源：综合测验");
      lines.push("掌握星级：[1-3]");
      lines.push("卡点记录：[本次仍卡住或已修正的地方，一句话]");
      lines.push("原题：[本次测验题核心描述]");
      lines.push("今日套路：[本次带走的3步套路]");
      lines.push("复习结果：[独立做对/看提示做对/仍需讲解]");
      lines.push("错误类型：[概念不清/审题漏条件/公式选择/计算错误/步骤混乱/时间不够/其他]");
      lines.push("卡住步骤：[具体卡在哪一步；没有就写 无]");
      lines.push("关键突破：[最重要的一次修正]");
      lines.push("题型标签：[用顿号分隔]");
      lines.push("信心分：[1-5]");
      lines.push("耗时分钟：[整数]");
      lines.push(`关联记录：${recordIds.join("、")}`);
      lines.push(`学习日期：${todayKey()}`);
      lines.push("---MOCHI-RECORD-END---");
      lines.push("");
    });

    return lines.join("\n").trim();
  }

  window.MochiReviewEngine = {
    DEFAULT_REVIEW_SETTINGS,
    buildReviewState,
    generateNodeReviewPack,
    generateSessionPack,
    classifyReviewResult,
    statusInfo,
    cardId,
  };
})();
