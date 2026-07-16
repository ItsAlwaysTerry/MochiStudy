// 统一奖励经济模拟 v2：周硬上限150 + 日硬上限40，验证结构是否守预算、大奖能否真发出。
// 直接 node docs/resources/reward-sim2.js [configJSON]
"use strict";

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function weightedPick(rng, amounts, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < amounts.length; i++) { r -= weights[i]; if (r <= 0) return amounts[i]; }
  return amounts[amounts.length - 1];
}
function pct(arr, p) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))];
}

function simulate(cfg, weeks = 20000, seed = 20260716) {
  const rng = mulberry32(seed);
  const WEEK_CAP = 150, DAY_CAP = 40;
  const dayStudyN = [3, 4, 5, 6], dayStudyW = [0.2, 0.35, 0.3, 0.15];
  const nodeN = [1, 2, 3, 4], nodeW = [0.2, 0.4, 0.3, 0.1];

  const weekPays = [], dayPays = [];
  let daBankStreak = 0, daCount = 0;        // 达标日：连续streak + 累计(阶段用)
  let weekCapHits = 0, dayCapHits = 0;
  let big100Draws = 0, big100Full = 0, big100PaySum = 0;
  let stages = 0;

  for (let w = 0; w < weeks; w++) {
    const studyDays = weightedPick(rng, dayStudyN, dayStudyW);
    let weekPaid = 0;
    for (let d = 0; d < studyDays; d++) {
      const nodes = weightedPick(rng, nodeN, nodeW);
      // 渠道A当日原始额（受日40 + 周余额约束）
      let dayRaw = 0;
      dayRaw += nodes >= 4 ? cfg.A4 : nodes >= 3 ? cfg.A3 : nodes >= 2 ? cfg.A2 : 0;
      let dailyTickets = 0;
      if (nodes >= 2) dailyTickets += 1;
      // 达标日 + 连续加成
      if (nodes >= 2) {
        daBankStreak += 1; daCount += 1;
        if (daBankStreak > 0 && daBankStreak % 3 === 0) dailyTickets += 1; // 连续3达标日额外日常券
      } else {
        daBankStreak = 0;
      }
      for (let t = 0; t < dailyTickets; t++) dayRaw += weightedPick(rng, [2, 5, 10, 20], cfg.dailyW);
      // 日40 上限
      let dayRawCapped = dayRaw;
      if (dayRawCapped > DAY_CAP) { dayRawCapped = DAY_CAP; dayCapHits++; }
      // 周余额
      let dayPay = Math.min(dayRawCapped, Math.max(0, WEEK_CAP - weekPaid));
      weekPaid += dayPay;
      let dayTotal = dayPay;

      // 阶段结算（本达标日促成满5个达标日）
      if (nodes >= 2 && daCount % 5 === 0) {
        stages++;
        // 阶段固定奖（受周余额；不受日40）
        const fixedPay = Math.min(cfg.F, Math.max(0, WEEK_CAP - weekPaid));
        weekPaid += fixedPay; dayTotal += fixedPay;
        // 阶段大券（受周余额；不受日40）
        const bigDraw = weightedPick(rng, [20, 50, 100], cfg.bigW);
        const bigPay = Math.min(bigDraw, Math.max(0, WEEK_CAP - weekPaid));
        weekPaid += bigPay; dayTotal += bigPay;
        if (bigDraw === 100) { big100Draws++; big100PaySum += bigPay; if (bigPay === 100) big100Full++; }
        if (fixedPay + bigPay > 0 && (cfg.F + bigDraw) > (fixedPay + bigPay)) weekCapHits++;
      }
      dayPays.push(dayTotal);
    }
    weekPays.push(weekPaid);
    if (weekPaid >= WEEK_CAP - 0.001) weekCapHits++;
  }

  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  return {
    weekMean: +mean(weekPays).toFixed(2), weekMed: pct(weekPays, 50), weekP95: pct(weekPays, 95), weekMax: Math.max(...weekPays),
    dayMean: +mean(dayPays).toFixed(2), dayMax: Math.max(...dayPays),
    weekCapHitPct: +(100 * weekCapHits / weeks).toFixed(2),
    dayCapHitPct: +(100 * dayCapHits / dayPays.length).toFixed(2),
    stages, stagesPerWeek: +(stages / weeks).toFixed(2),
    big100EveryStages: big100Draws ? +(stages / big100Draws).toFixed(1) : Infinity,
    big100FullPct: big100Draws ? +(100 * big100Full / big100Draws).toFixed(1) : 0,
    big100AvgPay: big100Draws ? +(big100PaySum / big100Draws).toFixed(1) : 0,
  };
}

const cfg = process.argv[2] ? JSON.parse(process.argv[2]) : {
  A2: 3, A3: 5, A4: 8, F: 15,
  dailyW: [45, 35, 15, 5],   // 金额[2,5,10,20]
  bigW: [55, 32, 13],        // 金额[20,50,100]
};
console.log("CONFIG:", JSON.stringify(cfg));
console.log(simulate(cfg));
