const fs = require("fs");
const path = require("path");

const CONFIG = {
  seed: 20260716,
  weeks: 5000,
  dailyCap: 40,
  stageCap: 150,
  stageTargetDays: 5,
  consecutiveBonusEvery: 3,
  studyDaysPerWeek: {
    values: [3, 4, 5, 6],
    weights: [0.2, 0.35, 0.3, 0.15],
  },
  nodesPerStudyDay: {
    values: [1, 2, 3, 4],
    weights: [0.2, 0.4, 0.3, 0.1],
  },
  dailyTicketPool: {
    values: [2, 5, 10, 20],
    weights: [35, 35, 22, 8],
  },
  stageTicketPool: {
    values: [20, 50, 100],
    weights: [50, 35, 15],
  },
};

function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedChoice(pool, rng) {
  const total = pool.weights.reduce((sum, weight) => sum + weight, 0);
  let ticket = rng() * total;
  for (let i = 0; i < pool.values.length; i += 1) {
    ticket -= pool.weights[i];
    if (ticket < 0) return pool.values[i];
  }
  return pool.values[pool.values.length - 1];
}

function smallRewardForNodes(nodes) {
  if (nodes >= 4) return 12;
  if (nodes === 3) return 8;
  if (nodes === 2) return 5;
  return 0;
}

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(sortedValues.length - 1, Math.ceil((p / 100) * sortedValues.length) - 1);
  return sortedValues[index];
}

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length / 2;
  const median =
    sorted.length === 0
      ? 0
      : sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[Math.floor(middle)];

  return {
    count: values.length,
    mean: mean(values),
    median,
    p95: percentile(sorted, 95),
    max: sorted.length ? sorted[sorted.length - 1] : 0,
  };
}

function yuan(value) {
  return `¥${value.toFixed(2)}`;
}

function pct(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function oneIn(count, hits) {
  if (hits === 0) return "未命中";
  return `约每 ${(count / hits).toFixed(2)} 个阶段 1 次`;
}

function simulate(config = CONFIG) {
  const rng = mulberry32(config.seed);
  const studyDayPayouts = [];
  const weekPayouts = [];
  const completedStagePayouts = [];
  const completedStageRawPayouts = [];
  const stageTicket100PaidAmounts = [];

  const counters = {
    weeks: config.weeks,
    studyDays: 0,
    targetDays: 0,
    completedStages: 0,
    dailyCapHits: 0,
    stageCapHitStages: 0,
    stageCapHitEvents: 0,
    dailyTickets: 0,
    bonusDailyTickets: 0,
    stageTickets: 0,
    stageTicket100Hits: 0,
    stageTicket100FullyPaid: 0,
  };

  let qualifyingStreak = 0;
  let stageTargetDays = 0;
  let currentStage = {
    raw: 0,
    paid: 0,
    capHit: false,
  };

  function applyStageCap(amount) {
    currentStage.raw += amount;
    const remaining = Math.max(0, config.stageCap - currentStage.paid);
    const paid = Math.min(amount, remaining);
    if (paid < amount) {
      currentStage.capHit = true;
      counters.stageCapHitEvents += 1;
    }
    currentStage.paid += paid;
    return paid;
  }

  function completeStage() {
    completedStagePayouts.push(currentStage.paid);
    completedStageRawPayouts.push(currentStage.raw);
    counters.completedStages += 1;
    if (currentStage.capHit) counters.stageCapHitStages += 1;
    stageTargetDays = 0;
    currentStage = {
      raw: 0,
      paid: 0,
      capHit: false,
    };
  }

  for (let week = 0; week < config.weeks; week += 1) {
    const studyDaysThisWeek = weightedChoice(config.studyDaysPerWeek, rng);
    let weekPaid = 0;

    for (let day = 0; day < studyDaysThisWeek; day += 1) {
      counters.studyDays += 1;

      const nodes = weightedChoice(config.nodesPerStudyDay, rng);
      const isTargetDay = nodes >= 2;
      let rawDailyChannel = smallRewardForNodes(nodes);

      if (isTargetDay) {
        counters.dailyTickets += 1;
        rawDailyChannel += weightedChoice(config.dailyTicketPool, rng);
        qualifyingStreak += 1;

        if (qualifyingStreak % config.consecutiveBonusEvery === 0) {
          counters.bonusDailyTickets += 1;
          rawDailyChannel += weightedChoice(config.dailyTicketPool, rng);
        }
      } else {
        qualifyingStreak = 0;
      }

      if (rawDailyChannel > config.dailyCap) counters.dailyCapHits += 1;
      const dailyChannelAfterDailyCap = Math.min(rawDailyChannel, config.dailyCap);

      let dayPaid = applyStageCap(dailyChannelAfterDailyCap);

      if (isTargetDay) {
        counters.targetDays += 1;
        stageTargetDays += 1;

        if (stageTargetDays >= config.stageTargetDays) {
          dayPaid += applyStageCap(25);

          const stageTicket = weightedChoice(config.stageTicketPool, rng);
          counters.stageTickets += 1;
          if (stageTicket === 100) counters.stageTicket100Hits += 1;

          const stageTicketPaid = applyStageCap(stageTicket);
          dayPaid += stageTicketPaid;
          if (stageTicket === 100) stageTicket100PaidAmounts.push(stageTicketPaid);
          if (stageTicket === 100 && stageTicketPaid === 100) {
            counters.stageTicket100FullyPaid += 1;
          }

          completeStage();
        }
      }

      studyDayPayouts.push(dayPaid);
      weekPaid += dayPaid;
    }

    weekPayouts.push(weekPaid);
  }

  const dayStats = summarize(studyDayPayouts);
  const weekStats = summarize(weekPayouts);
  const stageStats = summarize(completedStagePayouts);
  const rawStageStats = summarize(completedStageRawPayouts);
  const stageTicket100PaidStats = summarize(stageTicket100PaidAmounts);

  return {
    config,
    counters,
    dayStats,
    weekStats,
    stageStats,
    rawStageStats,
    stageTicket100PaidStats,
    rates: {
      dailyCap: counters.dailyCapHits / counters.studyDays,
      stageCap: counters.stageCapHitStages / counters.completedStages,
      stageTicket100: counters.stageTicket100Hits / counters.stageTickets,
      stageTicket100FullyPaid: counters.stageTicket100FullyPaid / counters.stageTickets,
    },
  };
}

function makeStatRow(label, stats, includeP95 = true) {
  const p95 = includeP95 ? `| ${yuan(stats.p95)} ` : "";
  return `| ${label} | ${stats.count} | ${yuan(stats.mean)} | ${yuan(stats.median)} ${p95}| ${yuan(stats.max)} |`;
}

function makeAdvice(result) {
  const advice = [];
  const weekMeanHigh = result.weekStats.mean > 120;
  const dailyCapOften = result.rates.dailyCap >= 0.05;
  const stageCapOften = result.rates.stageCap >= 0.2;

  if (!weekMeanHigh && !dailyCapOften && !stageCapOften) {
    advice.push("当前不需要下调权重；日池和阶段池都只是兜底，没有频繁吞奖励。");
    return advice;
  }

  if (weekMeanHigh || stageCapOften) {
    advice.push(
      "优先下调阶段大券池：把 `¥100` 权重从 `15` 降到 `8`，`¥50` 从 `35` 降到 `30`，`¥20` 提到 `62`。阶段大券期望会从 ¥42.50 降到约 ¥35.40。"
    );
    advice.push("如果还想更稳，把阶段固定奖从 `¥25` 降到 `¥20`，每阶段再少 ¥5，且不会影响小奖的即时反馈。");
  }

  if (result.rates.stageTicket100FullyPaid === 0) {
    advice.push(
      "如果不想出现“抽到 ¥100 但实际被打折”的体感落差，最稳妥是把阶段大券最高档改成 `¥80` 或 `¥90`；如果必须全额发 ¥100，就需要把阶段上限提高到约 `¥200`，或让渠道 A 不计入阶段池，但这两种都会放松预算。"
    );
  }

  if (dailyCapOften) {
    advice.push(
      "日常券池可以轻微降尾部：把 `¥20` 权重从 `8` 降到 `4`，`¥10` 从 `22` 降到 `20`，释放出来的权重加到 `¥2/¥5`。这会减少连续加成日触发日 40 封顶。"
    );
  }

  return advice;
}

function renderMarkdown(result) {
  const generatedAt = new Date().toISOString().slice(0, 10);
  const advice = makeAdvice(result);
  const weeklyBudgetJudgement =
    result.weekStats.max <= 150
      ? "单周最大值没有超过 ¥150。"
      : "单周最大值超过 ¥150；这不是脚本错误，而是因为规则只有“阶段 150”硬上限，没有“自然周 150”硬上限。若把 ¥150 当作周预算，需要额外加周预算池。";
  const conclusion =
    result.weekStats.mean > 120 || result.rates.stageCap >= 0.2 || result.rates.dailyCap >= 0.05
      ? "结论：这套数值能被硬上限兜住，但当前不够松弛，建议先下调阶段大券池后再上线。"
      : "结论：这套数值可行，暂时不用调。";

  return `# 学习奖励经济蒙特卡洛模拟结果

生成日期：${generatedAt}

## 模拟口径

- 脚本：\`docs/resources/reward-sim.js\`
- 运行方式：\`node docs/resources/reward-sim.js\`
- 固定随机种子：\`${result.config.seed}\`
- 模拟周数：${result.config.weeks}
- 总 study-day：${result.counters.studyDays}
- 完成阶段数：${result.counters.completedStages}
- 统计口径：单个 study-day 发放额包含当日渠道 A 实付，以及当天如果完成阶段时拿到的阶段固定奖和阶段大券实付。
- 连续加成假设：由于输入没有给出 7 天内 study-day 的具体日期，连续 3 个达标日按“相邻 study-day 达标 streak”计算；这是偏保守的预算口径，真实日历里如果非学习日打断连续，成本会更低。
- 预算裁剪顺序：渠道 A 当日原始金额先过日预算池 ¥40；过日池后的金额进入阶段预算池。阶段固定奖和阶段大券不走日池，只走阶段预算池 ¥150。
- P95 采用 nearest-rank 口径。

## 核心统计

| 指标 | 样本数 | 均值 | 中位数 | P95 | 最大值 |
|---|---:|---:|---:|---:|---:|
${makeStatRow("单个 study-day 实付", result.dayStats)}
${makeStatRow("单周实付", result.weekStats)}

| 指标 | 样本数 | 均值 | 最大值 |
|---|---:|---:|---:|
| 单阶段实付 | ${result.stageStats.count} | ${yuan(result.stageStats.mean)} | ${yuan(result.stageStats.max)} |
| 单阶段未裁剪原始额 | ${result.rawStageStats.count} | ${yuan(result.rawStageStats.mean)} | ${yuan(result.rawStageStats.max)} |

## 预算池触发

| 预算池 | 触发次数 | 分母 | 触发比例 | 说明 |
|---|---:|---:|---:|---|
| 日预算池 ¥40 | ${result.counters.dailyCapHits} | ${result.counters.studyDays} 个 study-day | ${pct(result.rates.dailyCap)} | 当日渠道 A 原始额超过 ¥40 时计 1 次 |
| 阶段预算池 ¥150 | ${result.counters.stageCapHitStages} | ${result.counters.completedStages} 个完成阶段 | ${pct(result.rates.stageCap)} | 阶段内任意一次发放被阶段余额裁剪时计 1 个阶段 |

## 大奖命中

| 项目 | 次数 | 比例 | 频率 |
|---|---:|---:|---:|
| 阶段大券抽到 ¥100 | ${result.counters.stageTicket100Hits} / ${result.counters.stageTickets} | ${pct(result.rates.stageTicket100)} | ${oneIn(result.counters.stageTickets, result.counters.stageTicket100Hits)} |
| 抽到 ¥100 且全额实付 ¥100 | ${result.counters.stageTicket100FullyPaid} / ${result.counters.stageTickets} | ${pct(result.rates.stageTicket100FullyPaid)} | ${oneIn(result.counters.stageTickets, result.counters.stageTicket100FullyPaid)} |

抽到 ¥100 时的实际实付均值：${yuan(result.stageTicket100PaidStats.mean)}；中位数：${yuan(result.stageTicket100PaidStats.median)}；最高：${yuan(result.stageTicket100PaidStats.max)}。

关键发现：在“日常发放也计入阶段 ¥150”的口径下，阶段大券发出前至少已经有 5 个达标日的日常发放和阶段固定奖。理论最低占用是 \`5 × (¥5 小奖 + ¥2 日常券) + ¥25 固定奖 = ¥60\`，所以阶段大券前最多只剩 ¥90，抽到 ¥100 也不可能全额实付。

## 判断

- 周均：${yuan(result.weekStats.mean)}，${result.weekStats.mean < 120 ? "明显低于 ¥150，也低于 ¥120 预警线。" : result.weekStats.mean < 150 ? "低于 ¥150，但高于约 ¥120 的预警线，预算余量不算宽。" : "已经超过 ¥150，周均预算不守。"}
- 单日：渠道 A 有日 ¥40 硬上限；单个 study-day 总实付最大 ${yuan(result.dayStats.max)}，仍被阶段 ¥150 上限兜住。
- 单周：${weeklyBudgetJudgement}
- 阶段：单阶段实付最大 ${yuan(result.stageStats.max)}，阶段硬上限生效；未裁剪原始额最大 ${yuan(result.rawStageStats.max)}。
- 大奖：¥100 的经验命中率是 ${pct(result.rates.stageTicket100)}，${oneIn(result.counters.stageTickets, result.counters.stageTicket100Hits)}，接近设计权重 15%；但在当前阶段池口径下，它是“抽中 ¥100 档”，不是“全额拿到 ¥100”。

## 调整建议

${advice.map((item) => `- ${item}`).join("\n")}

${conclusion}
`;
}

function main() {
  const result = simulate();
  const markdown = renderMarkdown(result);
  const outputPath = path.join(__dirname, "reward-sim-结果.md");
  fs.writeFileSync(outputPath, markdown, "utf8");

  console.log(`模拟完成：${result.config.weeks} 周，${result.counters.studyDays} 个 study-day，${result.counters.completedStages} 个完成阶段`);
  console.log(`周均 ${yuan(result.weekStats.mean)}，单周 P95 ${yuan(result.weekStats.p95)}，单周最大 ${yuan(result.weekStats.max)}`);
  console.log(`日池触发 ${pct(result.rates.dailyCap)}，阶段池触发 ${pct(result.rates.stageCap)}`);
  console.log(`报告已写入：${outputPath}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  CONFIG,
  simulate,
  renderMarkdown,
};
