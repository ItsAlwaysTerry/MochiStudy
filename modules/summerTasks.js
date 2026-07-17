(function () {
  // 多科分桶：物理仍用原 key（数据零迁移），数学/化学各自独立 key。
  // activeSubject 未来由科目 Tab 切换；现在恒为 physics，行为与单科时完全一致。
  const STATE_KEYS = { physics: "summer_task_state", math: "plan_state_math", chemistry: "plan_state_chemistry" };
  let activeSubject = "physics";
  function subjectStateKey(subject = activeSubject) { return STATE_KEYS[subject] || STATE_KEYS.physics; }
  // 科目 Tab：数/物/化切换。activeSubject（上面）同时驱动状态 key 和内容包，保证"状态与内容同科"。
  const SUBJECT_TABS = [["math", "数学"], ["physics", "物理"], ["chemistry", "化学"]];
  const SUBJECT_HAS_PLAN = { physics: true, math: true, chemistry: true };
  const SUBJECT_LABEL = { physics: "物理", math: "数学", chemistry: "化学" };
  function currentSubjectLabel() { return SUBJECT_LABEL[activeSubject] || "物理"; }
  const BASIC_2045_URL = "https://space.bilibili.com/23630128/lists/2045?type=season";
  const BASIC_2181_URL = "https://space.bilibili.com/23630128/lists/2181?type=season";
  const ONE_ROUND_URL = "https://space.bilibili.com/23630128/lists/340933?type=series";
  const XHS_STRATEGY_URL = "https://www.xiaohongshu.com/explore/6955e1e0000000001d03b300";
  const XHS_FORMULA_URL = "https://www.xiaohongshu.com/explore/695de9b9000000000b009294";
  const XHS_LEVEL_URL = "https://www.xiaohongshu.com/explore/697b4bd8000000000a02f417";
  const EXAMPLE_DB_NAME = "mochi_summer_examples";
  const EXAMPLE_STORE = "images";
  const SUMMER_REWARD_CONFIG_KEY = "summer_reward_config";
  const SUMMER_REWARD_PRIZES = [
    { label: "再接再厉", amount: 0, weight: 40, tone: "plain" },
    { label: "5 元小惊喜", amount: 5, weight: 30, tone: "coin" },
    { label: "10 元奖励", amount: 10, weight: 20, tone: "coin" },
    { label: "20 元奖励", amount: 20, weight: 7, tone: "coin" },
    { label: "50 元大奖", amount: 50, weight: 2, tone: "big" },
    { label: "100 元隐藏大奖", amount: 100, weight: 0.8, tone: "big" },
    { label: "200 元超级大奖", amount: 200, weight: 0.2, tone: "jackpot" },
  ];
  const SUMMER_REWARD_BOARD_SIZE = 8;
  let rewardAnimationTimer = null;
  let econAnimTimer = null;
  let econAnimActive = false;
  let examplePointerAnchor = null;
  let routeOverviewOpen = false;
  const supportHelpOpenTasks = new Set();
  const PHYSICS_ONE_ROUND_BVS = {
    kinematics: "BV1D54y1m7Av",
    balance: "BV1vD4y1U7k4",
    newton: "BV1R64y1c7m2",
    curve: "BV1mK4y1773Y",
    projectile: "BV1b54y1r7LD",
    circular: "BV11a4y1s7wJ",
    gravitation: "BV1vv411e7QZ",
    energy: "BV1iK4y1Q7mc",
    electric: "BV1A5411E7Q1",
    experiment: "BV1CK4y1n769",
    magneticBasic: "BV1uK4y1T7ox",
    magneticCircle: "BV1Xb4y1Q7Eq",
    induction: "BV13i4y1N7RJ",
  };
  const PHYSICS_ROUTE_VIDEO_LIBRARY = {
    "kin-chase-template": { source: "黄夫人物理一轮", bvKey: "kinematics", page: 8, duration: "10:35", title: "追及相遇通用解题模板", part: "8.【讲义10】【追及相遇】通用解题模板", require: "截 1 张追及/相遇临界例题" },
    "kin-chase-critical": { source: "黄夫人物理一轮", bvKey: "kinematics", page: 9, duration: "17:15", title: "追及相遇临界讨论", part: "9.【讲义11】【追及相遇】临界讨论", require: "截 1 张临界条件题" },
    "kin-image-basic": { source: "黄夫人物理一轮", bvKey: "kinematics", page: 11, duration: "14:23", title: "基础图像总结", part: "11.【讲义13】基础图像总结", require: "截 1 张 x-t 或 v-t 图像题" },
    "kin-image-special": { source: "黄夫人物理一轮", bvKey: "kinematics", page: 12, duration: "10:51", title: "基础图像特殊问题", part: "12.【讲义14】基础图像特殊问题", require: "截 1 张特殊图像题" },
    "kin-comprehensive": { source: "黄夫人物理一轮", bvKey: "kinematics", page: 10, duration: "24:46", title: "运动学综合例题讲解", part: "10.【讲义12】综合例题讲解", require: "截 1 张综合例题" },
    "kin-paper-tape-basic": { source: "黄夫人物理基础课", bvid: "BV17y4y1V7N1", duration: "15:15", title: "打点计时器-纸带分析", part: "27.【匀变速直线运动】打点计时器-纸带分析", require: "截 1 张纸带/逐差法题" },
    "kin-difference-method": { source: "黄夫人物理一轮", bvKey: "kinematics", page: 3, duration: "10:24", title: "比例式与逐差法", part: "3.【讲义5-6】比例式与逐差法", require: "截 1 张逐差法例题" },

    "balance-elastic": { source: "黄夫人物理一轮", bvKey: "balance", page: 1, duration: "20:57", title: "弹力", part: "1.【讲义19】弹力1", require: "截 1 张弹力/接触面判断题" },
    "balance-friction": { source: "黄夫人物理一轮", bvKey: "balance", page: 3, duration: "19:40", title: "摩擦力", part: "3.【讲义21】摩擦力", require: "截 1 张摩擦力方向判断题" },
    "balance-static-single": { source: "黄夫人物理一轮", bvKey: "balance", page: 4, duration: "21:58", title: "单物体平衡静力学", part: "4.【讲义22-23】单物理平衡静力学", require: "截 1 张受力图题" },
    "balance-dynamic-triangle": { source: "黄夫人物理一轮", bvKey: "balance", page: 9, duration: "13:00", title: "动态三角形", part: "9.【讲义27】【动态分析】动态三角形", require: "截 1 张动态平衡题" },

    "newton-motion": { source: "黄夫人物理一轮", bvKey: "newton", page: 1, duration: "23:28", title: "牛二分析运动", part: "1.【讲义33】牛二分析运动", require: "截 1 张 F=ma 基础题" },
    "newton-orthogonal": { source: "黄夫人物理一轮", bvKey: "newton", page: 3, duration: "19:21", title: "牛二正交分解", part: "3.【讲义34】牛二正交分解", require: "截 1 张正交分解题" },
    "newton-method": { source: "黄夫人物理一轮", bvKey: "newton", page: 5, duration: "14:28", title: "动力学解题", part: "5.【讲义36】动力学解题", require: "截 1 张动力学步骤题" },
    "newton-practice": { source: "黄夫人物理一轮", bvKey: "newton", page: 6, duration: "10:44", title: "动力学练习", part: "6.【讲义37】动力学练习", require: "截 1 张练习题" },
    "newton-multi": { source: "黄夫人物理一轮", bvKey: "newton", page: 10, duration: "15:31", title: "多物体解题思路", part: "10.【讲义41】【多物体】解题思路", require: "截 1 张连接体题" },

    "projectile-basic": { source: "黄夫人物理一轮", bvKey: "projectile", page: 1, duration: "23:03", title: "基础平抛", part: "1.【讲义8】基础平抛", require: "截 1 张基础平抛例题" },
    "projectile-angle": { source: "黄夫人物理一轮", bvKey: "projectile", page: 2, duration: "22:43", title: "带角度平抛", part: "2.【讲义9】带角度平抛", require: "截 1 张角度关系题" },
    "projectile-practice": { source: "黄夫人物理一轮", bvKey: "projectile", page: 3, duration: "24:00", title: "平抛练习", part: "3.【讲义10】【习题】平抛练习1", require: "截 1 张平抛练习题" },
    "circular-basic": { source: "黄夫人物理一轮", bvKey: "circular", page: 1, duration: "21:05", title: "圆周运动基础概念", part: "1.【讲义15】圆周运动基础概念", require: "截 1 张圆周基础量题" },
    "circular-newton": { source: "黄夫人物理一轮", bvKey: "circular", page: 2, duration: "13:45", title: "圆周运动中的牛二", part: "2.【讲义16】圆周运动中的牛二", require: "截 1 张向心力受力题" },
    "circular-practice": { source: "黄夫人物理一轮", bvKey: "circular", page: 4, duration: "22:00", title: "基础圆周练习", part: "4.【讲义18】【习题】基础圆周练习", require: "截 1 张圆周练习题" },

    "energy-basic": { source: "黄夫人物理一轮", bvKey: "energy", page: 1, duration: "19:08", title: "功能三个基础概念", part: "1.【讲义44】三个基础概念", require: "截 1 张做功/能量概念题" },
    "energy-work-image": { source: "黄夫人物理一轮", bvKey: "energy", page: 3, duration: "6:51", title: "求功图像类", part: "3.【讲义46】【求功】图像类", require: "截 1 张图像求功题" },
    "energy-power": { source: "黄夫人物理一轮", bvKey: "energy", page: 6, duration: "12:52", title: "求功功率类", part: "6.【讲义47】【求功】功率类", require: "截 1 张功率题" },
    "energy-kinetic-method": { source: "黄夫人物理一轮", bvKey: "energy", page: 7, duration: "28:17", title: "动能定理解题思路", part: "7.【讲义48-49】【动能定理】解题思路", require: "截 1 张动能定理题" },
    "energy-kinetic-practice": { source: "黄夫人物理一轮", bvKey: "energy", page: 10, duration: "30:07", title: "动能定理练习", part: "10.【讲义50】【动能定理】练习", require: "截 1 张动能定理练习题" },
    "energy-kinetic-practice2": { source: "黄夫人物理一轮", bvKey: "energy", page: 11, duration: "21:26", title: "动能定理练习2", part: "11.【讲义51】【动能定理】练习2", require: "截 1 张变式练习题" },
    "energy-relation": { source: "黄夫人物理一轮", bvKey: "energy", page: 12, duration: "25:11", title: "功能关系介绍", part: "12.【讲义52】【功能关系】介绍", require: "截 1 张功能关系题" },

    "gravitation-law": { source: "黄夫人物理一轮", bvKey: "gravitation", page: 2, duration: "15:59", title: "万有引力定律", part: "2.【讲义27】万有引力定律", require: "截 1 张引力公式题" },
    "gravitation-formulas": { source: "黄夫人物理一轮", bvKey: "gravitation", page: 3, duration: "21:01", title: "天体运动公式", part: "3.【讲义29-30】天体运动公式", require: "截 1 张天体公式题" },
    "gravitation-sync": { source: "黄夫人物理一轮", bvKey: "gravitation", page: 5, duration: "10:11", title: "同步卫星看地面", part: "5.【讲义32】同步卫星看地面", require: "截 1 张同步卫星题" },
    "gravitation-ratio": { source: "黄夫人物理一轮", bvKey: "gravitation", page: 9, duration: "9:42", title: "比值问题", part: "9.【讲义35】比值问题", require: "截 1 张比值题" },

    "electric-basic": { source: "黄夫人物理一轮", bvKey: "electric", page: 1, duration: "18:52", title: "电场基础概念介绍", part: "1.【讲义3】基础概念介绍", require: "截 1 张电场概念题" },
    "electric-field-practice1": { source: "黄夫人物理一轮", bvKey: "electric", page: 7, duration: "17:05", title: "场强电势练习一", part: "7.【讲义9】【场强电势篇】练习一", require: "截 1 张场强/电势题" },
    "electric-field-practice2": { source: "黄夫人物理一轮", bvKey: "electric", page: 8, duration: "17:44", title: "场强电势练习二", part: "8.【讲义10】【场强电势篇】练习二", require: "截 1 张场强/电势变式题" },
    "electric-uniform-concept": { source: "黄夫人物理一轮", bvKey: "electric", page: 11, duration: "28:18", title: "匀强电场电学概念", part: "11.【讲义13】【匀强电场篇】电学概念介绍", require: "截 1 张匀强电场概念题" },
    "electric-uniform-practice": { source: "黄夫人物理一轮", bvKey: "electric", page: 12, duration: "20:43", title: "匀强电场电场类练习", part: "12.【讲义14】【匀强电场篇】电场类练习", require: "截 1 张匀强电场练习题" },
    "electric-comprehensive": { source: "黄夫人物理一轮", bvKey: "electric", page: 17, duration: "16:15", title: "电场综合练习答案", part: "17.【讲义19-21】综合练习答案", require: "截 1 张电场综合题" },

    "circuit-current": { source: "黄夫人物理基础课", bvid: "BV1oE411S7p4", duration: "11:41", title: "电流", part: "192.【高中电路】电流", require: "截 1 张电流概念题" },
    "circuit-emf-internal": { source: "黄夫人物理基础课", bvid: "BV1ZE411S7Rj", duration: "13:15", title: "电动势与内阻", part: "193.【高中电路】电动势与内阻", require: "截 1 张电源内阻题" },
    "circuit-serial": { source: "黄夫人物理基础课", bvid: "BV1FE411D7HH", duration: "9:45", title: "串并联电路规律", part: "194.【高中电路】串并联电路的规律", require: "截 1 张串并联判断题" },
    "circuit-closed-basic": { source: "黄夫人物理基础课", bvid: "BV1SE411h71j", duration: "11:11", title: "认识闭合电路", part: "203.【高中电路】认识闭合电路", require: "截 1 张闭合电路概念题" },
    "circuit-closed-calc": { source: "黄夫人物理基础课", bvid: "BV1SE411h7se", duration: "15:30", title: "闭合电路的计算", part: "208.【高中电路】闭合电路的计算", require: "截 1 张闭合电路计算题" },
    "circuit-basic-practice": { source: "黄夫人物理一轮", bvKey: "experiment", page: 2, duration: "18:16", title: "电路基础练习", part: "2.【讲义24】【习题】电路基础练习", require: "截 1 张电路基础练习题" },

    "experiment-circuit-basic": { source: "黄夫人物理一轮", bvKey: "experiment", page: 1, duration: "25:36", title: "电路基础内容", part: "1.【讲义23】电路基础内容", require: "截 1 张电路基础例题" },
    "experiment-meter": { source: "黄夫人物理一轮", bvKey: "experiment", page: 3, duration: "17:38", title: "电表改装", part: "3.【讲义25】电表改装", require: "截 1 张电表改装题" },
    "experiment-resistance": { source: "黄夫人物理一轮", bvKey: "experiment", page: 9, duration: "21:51", title: "测电阻内接法和外接法", part: "9.【讲义31】【测电阻】内接法和外接法", require: "截 1 张测电阻接法题" },
    "experiment-touch": { source: "黄夫人物理一轮", bvKey: "experiment", page: 10, duration: "20:58", title: "测电阻试触法", part: "10.【讲义31】【测电阻】试触法", require: "截 1 张试触法题" },
    "experiment-limit-divide": { source: "黄夫人物理一轮", bvKey: "experiment", page: 11, duration: "16:21", title: "限流式和分压式", part: "11.【讲义31】限流式和分压式", require: "截 1 张滑变接法题" },
    "experiment-source": { source: "黄夫人物理一轮", bvKey: "experiment", page: 18, duration: "28:10", title: "测电源伏安法", part: "18.【讲义34】【测电源】伏安法", require: "截 1 张测电源题" },
    "experiment-source-practice": { source: "黄夫人物理一轮", bvKey: "experiment", page: 25, duration: "34:56", title: "测电源练习", part: "25.【讲义42-45】【习题】测电源练习", require: "截 1 张测电源练习题" },
    "experiment-reading-caliper": { source: "黄夫人物理一轮", bvKey: "experiment", page: 21, duration: "19:15", title: "游标卡尺读数", part: "21.【讲义36】【读数】游标卡尺", require: "截 1 张读数题" },

    "vibration-basic": { source: "B站基础补充", bvid: "BV1VX4y167tf", page: 1, duration: "39:16", title: "机械振动和简谐运动", part: "【机械振动】1.机械振动和简谐运动（基础课）", require: "截 1 张振动概念题" },
    "wave-basic": { source: "B站基础补充", bvid: "BV1VX4y167tf", page: 10, duration: "14:43", title: "波的产生和传播规律", part: "【机械波】1.波的产生和传播规律（基础课）", require: "截 1 张波传播题" },
    "wave-image": { source: "B站基础补充", bvid: "BV1VX4y167tf", page: 11, duration: "20:44", title: "波形图", part: "【机械波】2.波形图（基础课）", require: "截 1 张波形图题" },

    "magnetic-basic": { source: "黄夫人物理一轮", bvKey: "magneticBasic", page: 1, duration: "16:54", title: "磁场基础", part: "1.【讲义46】磁场基础", require: "截 1 张磁场方向题" },
    "magnetic-ampere": { source: "黄夫人物理一轮", bvKey: "magneticBasic", page: 3, duration: "23:05", title: "安培力概念", part: "3.【讲义47】【安培力】概念", require: "截 1 张安培力题" },
    "magnetic-ampere-practice": { source: "黄夫人物理一轮", bvKey: "magneticBasic", page: 4, duration: "14:07", title: "安培力基础练习", part: "4.【讲义48】【安培力】基础练习1", require: "截 1 张安培力练习题" },
    "magnetic-lorentz": { source: "黄夫人物理一轮", bvKey: "magneticBasic", page: 6, duration: "15:46", title: "洛伦兹力概念", part: "6.【讲义50】【洛伦兹力】概念", require: "截 1 张洛伦兹力题" },
    "induction-lenz-basic": { source: "黄夫人物理一轮", bvKey: "induction", page: 1, duration: "19:09", title: "楞次定律基础概念", part: "1.【讲义63】【楞次定律】基础概念", require: "截 1 张楞次定律题" },
    "induction-lenz-result": { source: "黄夫人物理一轮", bvKey: "induction", page: 3, duration: "11:38", title: "楞次定律最终结论", part: "3.【讲义64】【楞次定律】最终结论", require: "截 1 张方向判断题" },
    "induction-law": { source: "黄夫人物理一轮", bvKey: "induction", page: 5, duration: "12:30", title: "电磁感应定律介绍", part: "5.【讲义65】【电磁感应定律】介绍", require: "截 1 张感应电动势题" },
    "induction-motion": { source: "黄夫人物理一轮", bvKey: "induction", page: 8, duration: "24:21", title: "动生电动势知识总结", part: "8.【讲义66】【动生电动势】知识总结", require: "截 1 张动生电动势题" },
    "induction-practice": { source: "黄夫人物理一轮", bvKey: "induction", page: 4, duration: "16:05", title: "楞次定律练习", part: "4.【讲义72】【楞次定律】练习", require: "截 1 张楞次练习题" },
  };

  const PHYSICS_TASKS = [
    {
      id: "kinematics-basic",
      title: "匀变速直线运动",
      subject: "physics",
      nodeLabel: "运动学",
      day: 1,
      compressedSlot: "上午第一轮",
      source: "HE物理课堂",
      duration: "25:39",
      focusMins: 35,
      url: "https://www.bilibili.com/video/BV1uZubzzEza/",
      videoTitle: "保姆级精讲匀变速直线运动基本公式及计算",
      prep: {
        concepts: ["速度和加速度", "位移和时间", "匀变速五个公式", "刹车陷阱", "v-t 图像"],
        oneRound: "实体书一轮讲义 1 第2-6页；刹车/图像卡住再翻第10-15页",
        backup: "按目录找：速度、加速度、匀变速直线运动、运动图像",
        backupLinks: [{ label: "打开基础课合集", url: BASIC_2045_URL }],
      },
      practiceItems: [
        {
          title: "方向判断",
          question: "小车一开始速度是 8 米/秒。后来加速度大小是 3.5 米/秒²，时间是 8 秒。加速度可能和速度同方向，也可能反方向。请分别算 8 秒后的速度。",
          hint: "先写两个方向：同方向速度变大，反方向速度变小。再用“末速度 = 初速度 + 加速度 × 时间”。",
        },
        {
          title: "刹车会不会反向",
          question: "还是这辆小车：初速度 8 米/秒，加速度大小 3.5 米/秒²。如果加速度和速度反方向，先算它大约几秒停下，再判断 8 秒末物体是不是已经反向运动。",
          hint: "先别急着算 8 秒末。先问自己：速度减到 0 要多久？如果停下时间小于 8 秒，后面就已经反向了。",
        },
      ],
    },
    {
      id: "newton-second-law",
      title: "牛顿第二定律",
      subject: "physics",
      nodeLabel: "动力学",
      day: 1,
      compressedSlot: "上午第一轮",
      source: "HE物理课堂",
      duration: "10:10",
      focusMins: 20,
      url: "https://www.bilibili.com/video/BV1P8BmYVEe4/",
      videoTitle: "牛顿第二定律保姆级教学",
      prep: {
        concepts: ["质量", "合外力", "加速度方向", "F = ma", "正交分解"],
        oneRound: "实体书一轮讲义 1 第33-36页；题目卡住再翻第37-40页",
        backup: "按目录找：牛顿第二定律、合外力、加速度、连接体",
        backupLinks: [{ label: "打开基础课合集", url: BASIC_2045_URL }],
      },
      practiceItems: [
        {
          title: "公式读成中文",
          question: "F = m × a 的意思是什么？如果一个 10 千克的物体，加速度是 1 米/秒²，需要多大的合外力？",
          hint: "先把公式读成中文：合外力 = 质量 × 加速度。再说清楚：加速度方向跟合外力方向一样。",
        },
        {
          title: "同样的力推不同质量",
          question: "同样用 10 牛的合外力，分别推 2 千克和 5 千克的物体。哪个物体加速度更大？分别是多少？",
          hint: "把公式换成：加速度 = 合外力 ÷ 质量。质量越大，同样的力推起来越不容易加速。",
        },
      ],
    },
    {
      id: "force-decomposition",
      title: "力的合成与分解",
      subject: "physics",
      nodeLabel: "动力学",
      day: 1,
      compressedSlot: "上午第二轮",
      source: "一物儿",
      duration: "41:57",
      focusMins: 50,
      url: "https://www.bilibili.com/video/BV1XezpYxE3c/",
      videoTitle: "手把手零基础搞定正交分解",
      prep: {
        concepts: ["重力", "弹力", "摩擦力", "合力和分力", "受力图", "坐标轴"],
        oneRound: "实体书一轮讲义 1 第19-24页，重点第22-24页；动态平衡先不用钻第27-31页",
        backup: "按目录找：受力分析、共点力平衡、力的分解、正交分解",
        backupLinks: [{ label: "打开基础课合集", url: BASIC_2045_URL }],
      },
      practiceItems: [
        {
          title: "绳子受力分解",
          diagram: "force-rope",
          question: "看图做题：重物 G 静止不动。左边绳子水平拉，右边斜绳向右上拉，斜绳和竖直方向夹角是 30°。先判断：哪根绳子提供向上的力？再列出竖直方向和水平方向的平衡关系。",
          hint: "不用自己脑补图。先看重力向下；右边斜绳分成向上、向右两个分力；左边水平绳只负责向左拉。",
        },
        {
          title: "首尾相接看合力",
          question: "五个力按顺序首尾相接，最后刚好回到起点。这个物体受到的合力是多少？它可能处于什么运动状态？",
          hint: "力的首尾相接如果围成封闭图形，合力就是 0。合力为 0 不一定静止，也可能匀速直线运动。",
        },
      ],
    },
    {
      id: "work-power",
      title: "功与功率",
      subject: "physics",
      nodeLabel: "能量守恒",
      day: 2,
      compressedSlot: "下午第一轮",
      source: "一物儿",
      duration: "1:36:17",
      focusMins: 60,
      url: "https://www.bilibili.com/video/BV18GZAYyEtU/",
      videoTitle: "做功算不准？功率算不对？",
      prep: {
        concepts: ["正功和负功", "力和位移夹角", "功率", "动能定理入口"],
        oneRound: "实体书一轮讲义 2 第44-46页；动能定理卡住再翻第48-50页",
        backup: "按目录找：功、功率、动能定理",
        backupLinks: [{ label: "打开基础课合集", url: BASIC_2181_URL }],
      },
      practiceItems: [
        {
          title: "拉力和摩擦力做功",
          question: "一个物体在水平地面上移动 2 米。拉力 F 斜向上拉，大小是 5 牛，方向和水平方向成 37°。摩擦力大小是 2 牛。分别判断：拉力做正功还是负功？摩擦力做正功还是负功？",
          hint: "先看力和位移方向夹角。顺着运动方向的分力做正功，反着运动方向的力做负功。",
        },
        {
          title: "粗糙和光滑比较",
          question: "同一个力 F 拉同一个物体，两次都沿力的方向走了同样远。第一次地面粗糙，第二次地面光滑。问：力 F 两次做的功一样吗？哪一次平均功率更大？",
          hint: "做功先看：力和位移有没有变。功率再看：谁用的时间更短。不要一上来套复杂公式。",
        },
      ],
    },
    {
      id: "closed-circuit-ohm",
      title: "闭合电路欧姆定律",
      subject: "physics",
      nodeLabel: "电场",
      day: 2,
      compressedSlot: "下午第二轮",
      source: "HE物理课堂",
      duration: "47:42",
      focusMins: 55,
      url: "https://www.bilibili.com/video/BV1TDCUBREAk/",
      videoTitle: "闭合电路欧姆定律计算 + 全题型保姆精讲",
      prep: {
        concepts: ["电流", "电压", "电阻", "电动势", "内阻", "路端电压", "串并联"],
        oneRound: "实体书一轮讲义 3 第23-24页；电动势/内阻实验卡住再翻第34-38页",
        backup: "按目录找：闭合电路欧姆定律、电动势、内阻、路端电压、串并联",
        backupLinks: [{ label: "打开基础课合集", url: BASIC_2181_URL }],
      },
      practiceItems: [
        {
          title: "电源电动势和内阻",
          image: "docs/summer-physics-examples/screenshots/closed-circuit-01.png",
          question: "看上方截图，先独立读题并画出电路关系，再把求解过程写出来。",
          hint: "先分清外电路电压、内电压、电动势三个量，不要一看到电压表就直接套公式。",
        },
        {
          title: "开关变化前后比较",
          image: "docs/summer-physics-examples/screenshots/closed-circuit-02.png",
          question: "看上方截图，先判断开关闭合前后电路结构怎么变，再计算对应物理量。",
          hint: "开关题先重画等效电路。不要边看原图边硬算，那样最容易乱。",
        },
        {
          title: "多问计算题",
          image: "docs/summer-physics-examples/screenshots/closed-circuit-03.png",
          question: "看上方截图，按小问顺序做。每一问先写“要求什么、已知什么”。",
          hint: "多问题不要跳步。先把总电阻、电流、路端电压这些基础量列出来。",
        },
        {
          title: "图像和功率判断",
          image: "docs/summer-physics-examples/screenshots/closed-circuit-04.png",
          question: "看上方截图，先读懂图像横纵轴和交点意义，再判断选项。",
          hint: "图像题先翻译图，不要先看选项。交点、斜率、截距通常各代表一个电路量。",
        },
      ],
    },
    {
      id: "projectile-motion",
      title: "平抛运动",
      subject: "physics",
      nodeLabel: "运动学",
      day: 2,
      compressedSlot: "晚上补充轮",
      source: "一物儿",
      duration: "1:43:00",
      focusMins: 45,
      url: "https://www.bilibili.com/video/BV1RTkhYoEhY/",
      videoTitle: "物理平抛运动？你想知道的，这都讲",
      prep: {
        concepts: ["水平匀速", "竖直自由落体", "等时性", "位移分解", "速度分解"],
        oneRound: "实体书一轮讲义 2 第8-10页；角度/类平抛卡住再翻第12-14页",
        backup: "按目录找：平抛运动、运动的合成与分解；一轮合集可找“平抛运动”",
        backupLinks: [
          { label: "打开基础课合集", url: BASIC_2045_URL },
          { label: "打开一轮复习合集", url: ONE_ROUND_URL },
        ],
      },
      practiceItems: [
        {
          title: "平抛概念判断",
          image: "docs/summer-physics-examples/screenshots/projectile-motion-01.png",
          question: "看上方截图，先判断平抛运动水平方向和竖直方向分别是什么运动。",
          hint: "先把运动拆成两条线：水平方向、竖直方向。每条线只问速度和加速度怎么变。",
        },
        {
          title: "水平位移和落地时间",
          image: "docs/summer-physics-examples/screenshots/projectile-motion-06.png",
          question: "看上方截图，先找水平位移和初速度，再求运动时间。",
          hint: "平抛基础题常用两条路：水平位移 = 水平速度 × 时间；竖直方向再用自由落体。",
        },
        {
          title: "分解运动过程",
          image: "docs/summer-physics-examples/screenshots/projectile-motion-07.png",
          question: "看上方截图，把题目拆成水平和竖直两个方向，各写一条式子。",
          hint: "不要试图在脑子里整体想轨迹。先拆方向，再合结果。",
        },
        {
          title: "台阶或斜面情境",
          image: "docs/summer-physics-examples/screenshots/projectile-motion-13.png",
          question: "看上方截图，先标出起点、落点、高度差和水平距离，再开始算。",
          hint: "复杂图先找几何关系。只要能把高度差和水平距离读出来，后面还是平抛两方向。",
        },
      ],
    },
    {
      id: "universal-gravitation",
      title: "万有引力",
      subject: "physics",
      nodeLabel: "动力学",
      day: 2,
      compressedSlot: "晚上补充轮",
      source: "一物儿",
      duration: "1:04:15",
      focusMins: 45,
      url: "https://www.bilibili.com/video/BV141QyYrELE/",
      videoTitle: "天体卫星所有题型",
      prep: {
        concepts: ["万有引力", "圆周运动", "向心力", "轨道半径", "周期", "线速度"],
        oneRound: "实体书一轮讲义 2 第27-35页；双星/追及相遇先放到第38-43页有余力再看",
        backup: "按目录找：万有引力、圆周运动、向心力、卫星问题",
        rescue: {
          pause: "先暂停“天体卫星所有题型”，不要硬跟后面的综合公式。",
          concepts: ["万有引力定律", "公式各字母含义", "引力提供向心力"],
          book: "实体一轮讲义 2 第27-30页",
          keywords: ["万有引力定律", "向心力", "卫星圆周运动"],
          check: "卫星为什么一直在下落，却没有直接掉到地面？",
          avoid: "暂时不看同步卫星、双星、追及相遇和复杂比值题。",
        },
        backupLinks: [
          { label: "打开基础课合集", url: BASIC_2045_URL },
          { label: "打开一轮复习合集", url: ONE_ROUND_URL },
        ],
      },
      practiceItems: [
        {
          title: "卫星基础量判断",
          image: "docs/summer-physics-examples/screenshots/universal-gravitation-01.png",
          question: "看上方截图，先判断题目问的是线速度、角速度、周期还是加速度。",
          hint: "天体题先认量。不要一上来背一串公式，先说清楚比较的是哪个物理量。",
        },
        {
          title: "轨道半径比较",
          image: "docs/summer-physics-examples/screenshots/universal-gravitation-02.png",
          question: "看上方截图，先找谁的轨道半径大，再判断各物理量大小。",
          hint: "绕同一个中心天体运动时，很多量只和轨道半径有关。先抓住半径。",
        },
        {
          title: "圆轨道受力关系",
          image: "docs/summer-physics-examples/screenshots/universal-gravitation-03.png",
          question: "看上方截图，先写出“万有引力提供向心力”，再看选项。",
          hint: "核心句就是：引力负责把物体拉着转圈。先写这句话对应的式子。",
        },
        {
          title: "航天器情境题",
          image: "docs/summer-physics-examples/screenshots/universal-gravitation-04.png",
          question: "看上方截图，先把题目里的星球、轨道、飞行器位置关系画清楚。",
          hint: "真实航天背景看起来吓人，本质还是半径、速度、周期、向心加速度的比较。",
        },
      ],
    }
  ];

  const PHYSICS_ROUTE_DAYS = [
    { day: 1, week: 1, title: "直线运动 + 受力起步", subtitle: "匀变速、牛二、正交分解", taskIds: ["kinematics-basic", "newton-second-law", "force-decomposition"] },
    { day: 2, week: 1, title: "功能、电路、曲线入门", subtitle: "功与功率、闭合电路、平抛、万有引力", taskIds: ["work-power", "closed-circuit-ohm", "projectile-motion", "universal-gravitation"] },
    { day: 3, week: 1, title: "运动图像 + 追及相遇", subtitle: "把 x-t / v-t 图像和刹车追及补成拿分点", focus: ["运动图像", "刹车陷阱", "追及相遇"], videoKeys: ["kin-chase-template", "kin-chase-critical", "kin-image-basic", "kin-image-special"] },
    { day: 4, week: 1, title: "受力分析回炉", subtitle: "重力、弹力、摩擦力、正交分解再做题", focus: ["受力图", "摩擦力", "动态平衡"], videoKeys: ["balance-elastic", "balance-friction", "balance-static-single", "balance-dynamic-triangle"] },
    { day: 5, week: 1, title: "牛二基础题", subtitle: "斜面、连接体、简单多物体，不碰难模型", focus: ["F=ma", "斜面", "连接体"], videoKeys: ["newton-motion", "newton-orthogonal", "newton-method", "newton-multi"] },
    { day: 6, week: 1, title: "平抛 + 圆周基础", subtitle: "曲线运动只抓分解和向心力", focus: ["平抛分解", "圆周运动", "向心力"], videoKeys: ["projectile-basic", "projectile-practice", "circular-basic", "circular-newton"] },
    { day: 7, week: 1, title: "周测 + 错题回炉", subtitle: "用小卷检查第 1 周，错题导入记录", focus: ["限时小测", "错题复盘"], videoKeys: ["kin-comprehensive", "newton-practice", "projectile-practice", "circular-practice"], mission: "不强制新课。先用本周截图复制同类测验包，让 AI 出 6-8 道小题；做错的题再回看对应视频片段。" },
    { day: 8, week: 2, title: "功与功率二刷", subtitle: "做功正负、平均功率、瞬时功率", focus: ["做功", "功率", "动能定理入口"], videoKeys: ["energy-basic", "energy-work-image", "energy-power"] },
    { day: 9, week: 2, title: "动能定理 + 机械能", subtitle: "先会列始末状态，再谈复杂过程", focus: ["动能定理", "机械能守恒"], videoKeys: ["energy-kinetic-method", "energy-kinetic-practice", "energy-relation"] },
    { day: 10, week: 2, title: "万有引力 + 圆周综合", subtitle: "天体题只抓半径、周期、速度比较", focus: ["万有引力", "同步卫星", "轨道半径"], videoKeys: ["gravitation-law", "gravitation-formulas", "gravitation-sync", "gravitation-ratio"] },
    { day: 11, week: 2, title: "电场入门", subtitle: "电场强度、电势、电势能先会认量", focus: ["电场强度", "电势", "电势能"], videoKeys: ["electric-basic", "electric-field-practice1", "electric-field-practice2", "electric-uniform-concept"] },
    { day: 12, week: 2, title: "恒定电流基础", subtitle: "串并联、电动势、内阻、路端电压", focus: ["串并联", "电动势", "内阻"], videoKeys: ["circuit-current", "circuit-emf-internal", "circuit-serial", "circuit-closed-basic", "circuit-closed-calc"] },
    { day: 13, week: 2, title: "电学实验入门", subtitle: "仪器读数、伏安法、测电阻", focus: ["电表读数", "伏安法", "测电阻"], videoKeys: ["experiment-circuit-basic", "experiment-meter", "experiment-resistance", "experiment-limit-divide"] },
    { day: 14, week: 2, title: "第 2 周小测", subtitle: "功能、天体、电路各抽基础题", focus: ["限时小测", "错题导入"], videoKeys: ["energy-kinetic-practice2", "gravitation-ratio", "electric-uniform-practice", "circuit-basic-practice"], mission: "用第 8-13 天截图生成小测。每个专题至少 1 题，错题必须导入 MOCHI-RECORD。" },
    { day: 15, week: 3, title: "力学实验专项", subtitle: "打点计时器、纸带、图像处理", focus: ["纸带", "逐差法", "图像斜率"], videoKeys: ["kin-paper-tape-basic", "kin-difference-method", "kin-image-basic"] },
    { day: 16, week: 3, title: "电学实验专项", subtitle: "测电源电动势与内阻、仪器选择", focus: ["电源实验", "仪器选择", "误差分析"], videoKeys: ["experiment-resistance", "experiment-touch", "experiment-limit-divide", "experiment-source", "experiment-reading-caliper"] },
    { day: 17, week: 3, title: "振动与波", subtitle: "低分段先会读图、会判断基本量", focus: ["振动图像", "波形图", "周期频率"], videoKeys: ["vibration-basic", "wave-basic", "wave-image"] },
    { day: 18, week: 3, title: "热学/光学/原子择一", subtitle: "按考试范围挑最容易拿分的小专题", focus: ["热学", "光学", "原子结构"], mission: "这天先不硬塞随机视频。按老师/考试范围三选一：热学、光学、原子。打开小红书提分思路或学校资料，截 1-3 张代表题，再用同类测验包生成练习。" },
    { day: 19, week: 3, title: "磁场基础", subtitle: "安培力、洛伦兹力、左手定则", focus: ["安培力", "洛伦兹力", "左手定则"], videoKeys: ["magnetic-basic", "magnetic-ampere", "magnetic-ampere-practice", "magnetic-lorentz"] },
    { day: 20, week: 3, title: "电磁感应入门", subtitle: "磁通量变化、楞次定律先会判断方向", focus: ["磁通量", "楞次定律", "感应电流"], videoKeys: ["induction-lenz-basic", "induction-lenz-result", "induction-law", "induction-motion"] },
    { day: 21, week: 3, title: "第 3 周错题回炉", subtitle: "实验题和小专题错题集中二刷", focus: ["实验错题", "概念错题"], videoKeys: ["experiment-source-practice", "induction-practice", "magnetic-ampere-practice", "wave-image"], mission: "只看自己错题对应的片段。每个错题先说清楚卡点，再写本节收尾。" },
    { day: 22, week: 4, title: "选择题公式回炉", subtitle: "把高频公式和二级结论做成可用清单", focus: ["公式清单", "基础选择题"], videoKeys: ["kin-image-basic", "newton-method", "energy-basic", "electric-basic", "magnetic-basic"], mission: "今天重点不是刷长课，而是把常用公式和二级结论写成清单；不会用的公式回看对应短片段。" },
    { day: 23, week: 4, title: "力学综合小卷", subtitle: "运动、受力、能量混合但不追难题", focus: ["力学综合", "限时训练"], videoKeys: ["kin-comprehensive", "balance-static-single", "newton-practice", "energy-kinetic-practice"] },
    { day: 24, week: 4, title: "电学综合小卷", subtitle: "电场、电路、实验混合基础题", focus: ["电学综合", "限时训练"], videoKeys: ["electric-comprehensive", "circuit-closed-calc", "experiment-source", "magnetic-ampere-practice"] },
    { day: 25, week: 4, title: "实验专项二刷", subtitle: "把最容易得分的实验题再刷一轮", focus: ["力学实验", "电学实验"], videoKeys: ["kin-paper-tape-basic", "experiment-reading-caliper", "experiment-source", "experiment-source-practice"] },
    { day: 26, week: 4, title: "限时小卷", subtitle: "按真实考试节奏做一套低压小卷", focus: ["限时", "选择题", "实验题"], videoKeys: ["projectile-practice", "energy-kinetic-practice2", "circuit-basic-practice", "induction-practice"], mission: "用网站里已收集的例题截图生成 8-10 道限时小卷。完成后只记录最卡的 2-3 题。" },
    { day: 27, week: 4, title: "错题二刷", subtitle: "只做曾经不会、半会、卡住的题", focus: ["错题复盘", "卡点修正"], videoKeys: ["kin-image-special", "newton-multi", "energy-relation", "circuit-closed-calc", "induction-practice"], mission: "从学习档案挑 5 张低星/半会卡片，先自己重做，再用同类测验包补 1 道变式。" },
    { day: 28, week: 4, title: "总复盘 + 下一轮计划", subtitle: "导出学习档案，决定下一轮补哪 3 个点", focus: ["学习档案", "复盘报告", "下轮计划"], videoKeys: ["kin-comprehensive", "energy-kinetic-practice", "electric-comprehensive", "experiment-source-practice"], mission: "不追新课。导出学习档案，看哪个专题反复低星，选出下一轮最该补的 3 个点。" },
  ];

  const MATH_ROUTE_VIDEO_LIBRARY = {
    "set-core": { source: "一数", bvid: "BV15XHdehEk7", duration: "51:26", title: "「集合」核心大串讲", part: "「集合」核心大串讲", require: "截 1 张集合例题" },
    "set-condition": { source: "一数", bvid: "BV1NN411H79R", duration: "45:28", title: "“充分必要”傻傻分不清？保姆式梳理所有关键点！", part: "“充分必要”傻傻分不清？保姆式梳理所有关键点！", require: "截 1 张集合例题" },
    "func-system": { source: "一数", bvid: "BV1bu411k7c8", duration: "47:34", title: "2022高考数学!核心点系统复习——函数篇 \| 最后六课第1课", part: "2022高考数学!核心点系统复习——函数篇 \| 最后六课第1课", require: "截 1 张函数例题" },
    "func-props": { source: "一数", bvid: "BV1xk1WYaEkw", duration: "50:22", title: "【函数】单调性！奇偶性！一网打尽！函数性质大串讲", part: "【函数】单调性！奇偶性！一网打尽！函数性质大串讲", require: "截 1 张函数例题" },
    "func-exponential-composite": { source: "神奇小猪的数学课", bvid: "BV1yG411A73o", duration: "16:47", title: "【考前抱佛脚】指数复合函数！请务必在考前一分钟看完！", part: "【考前抱佛脚】指数复合函数！请务必在考前一分钟看完！", require: "截 1 张函数例题" },
    "deriv-intro": { source: "高中数学蔡德锦", bvid: "BV1vD4y1p78r", duration: "54:29", title: "必学：导数模块必学内容哦", part: "必学：导数模块必学内容哦", require: "截 1 张导数例题" },
    "trig-transform-logic": { source: "一数", bvid: "BV15Yi5B9ESN", duration: "27:12", title: "【高一必看】三角恒等变换思路全梳理", part: "【高一必看】三角恒等变换思路全梳理", require: "截 1 张三角函数例题" },
    "trig-transform-formulas": { source: "一数", bvid: "BV1pe411q79E", duration: "38:54", title: "「三角恒等变换」公式多吧？半小时全学会！", part: "「三角恒等变换」公式多吧？半小时全学会！", require: "截 1 张三角函数例题" },
    "trig-omega-range": { source: "一数", bvid: "BV1qJwKe3Ey5", duration: "36:08", title: "三角函数𝜔取值范围大串讲！", part: "三角函数𝜔取值范围大串讲！", require: "截 1 张三角函数例题" },
    "trig-solve-triangle": { source: "一数", bvid: "BV1GXZAY7EWe", duration: "01:24:11", title: "「解三角形」常考题型！基础到进阶！", part: "「解三角形」常考题型！基础到进阶！", require: "截 1 张三角函数例题" },
    "trig-sine-cosine-law": { source: "一数", bvid: "BV1bJ4m177Wb", duration: "43:44", title: "“正余弦定理”核心题型梳理！", part: "“正余弦定理”核心题型梳理！", require: "截 1 张三角函数例题" },
    "trig-range-extreme": { source: "一数", bvid: "BV1Ng4y1x7s9", duration: "21:59", title: "解三角形“范围与最值”没思路？两大做题方法梳理！", part: "解三角形“范围与最值”没思路？两大做题方法梳理！", require: "截 1 张三角函数例题" },
    "seq-an-sn": { source: "一数", bvid: "BV1GN4y1z7vG", duration: "27:30", title: "高考数列常考！an，Sn混搭题型梳理！", part: "高考数列常考！an，Sn混搭题型梳理！", require: "截 1 张数列例题" },
    "seq-general-term": { source: "一数", bvid: "BV1E4c4ePEJT", duration: "46:11", title: "高考必考「数列求通项」方法大总结！", part: "高考必考「数列求通项」方法大总结！", require: "截 1 张数列例题" },
    "seq-sum-methods": { source: "一数", bvid: "BV1f6kbY4EaG", duration: "39:57", title: "【数列求和串讲】错位相减+裂项相消+分组求和！", part: "【数列求和串讲】错位相减+裂项相消+分组求和！", require: "截 1 张数列例题" },
    "seq-discussion": { source: "一数", bvid: "BV1fqfnY5EQy", duration: "48:17", title: "数列必做十题「最值+奇偶+花式讨论」", part: "数列必做十题「最值+奇偶+花式讨论」", require: "截 1 张数列例题" },
    "vector-linear": { source: "一数", bvid: "BV1ZsXDYVEAW", duration: "48:07", title: "向量的线性运算，方法大梳理！", part: "向量的线性运算，方法大梳理！", require: "截 1 张向量例题" },
    "vector-coordinate": { source: "一数", bvid: "BV1A4411X7rV", duration: "23:25", title: "平面向量的坐标运算", part: "平面向量的坐标运算", require: "截 1 张向量例题" },
    "vector-dot-product": { source: "一数", bvid: "BV1RH4y157t9", duration: "57:07", title: "数量积没思路？投影+拆解+极化恒等式！一步到位！", part: "数量积没思路？投影+拆解+极化恒等式！一步到位！", require: "截 1 张向量例题" },
    "solid-vertical": { source: "一数", bvid: "BV1wqMfzrEvT", duration: "39:08", title: "【立体几何】垂直不会做？技巧全在这！", part: "【立体几何】垂直不会做？技巧全在这！", require: "截 1 张立体几何例题" },
    "solid-parallel": { source: "一数", bvid: "BV1uF4m1P7DK", duration: "34:21", title: "“平行证明”不会连辅助线？一个视频讲懂！", part: "“平行证明”不会连辅助线？一个视频讲懂！", require: "截 1 张立体几何例题" },
    "solid-space-vector": { source: "一数", bvid: "BV1Bj411i7ML", duration: "19:13", title: "用「平面向量」的方法学习「空间向量」\| 高考数学大合集", part: "用「平面向量」的方法学习「空间向量」\| 高考数学大合集", require: "截 1 张立体几何例题" },
    "solid-section": { source: "一数", bvid: "BV19y4y1s7za", duration: "14:03", title: "14分钟掌握立体几何 截面常规画法！", part: "14分钟掌握立体几何 截面常规画法！", require: "截 1 张立体几何例题" },
    "solid-coordinate": { source: "一数", bvid: "BV1vX4Ce6Ecy", duration: "48:45", title: "立体几何「不好建系」「不好求坐标」怎么办？", part: "立体几何「不好建系」「不好求坐标」怎么办？", require: "截 1 张立体几何例题" },
    "analytic-line-circle": { source: "一数", bvid: "BV1y14y1872V", duration: "53:06", title: "直线与圆公式、方法、二级结论全梳理，事半功倍！", part: "直线与圆公式、方法、二级结论全梳理，事半功倍！", require: "截 1 张解析几何例题" },
    "analytic-line-circle-advanced": { source: "一数", bvid: "BV1wh4y167cR", duration: "34:04", title: "【直线与圆】进阶题型梳理与破解！", part: "【直线与圆】进阶题型梳理与破解！", require: "截 1 张解析几何例题" },
    "analytic-ellipse": { source: "一数", bvid: "BV1wP4y1273G", duration: "30:59", title: "椭圆 好用的二级结论梳理！", part: "椭圆 好用的二级结论梳理！", require: "截 1 张解析几何例题" },
    "analytic-parabola": { source: "一数", bvid: "BV14WDAYQEyy", duration: "26:49", title: "高考中出现的“抛物线”二级结论！", part: "高考中出现的“抛物线”二级结论！", require: "截 1 张解析几何例题" },
    "analytic-conic-hard": { source: "一数", bvid: "BV1UbSFBTEcm", duration: "01:03:29", title: "圆锥曲线小题重难点题型串讲！", part: "圆锥曲线小题重难点题型串讲！", require: "截 1 张解析几何例题" },
    "prob-analysis": { source: "一数", bvid: "BV1qc411n7w1", duration: "57:14", title: "概率大题看不懂？保姆式分析指导！\| 高考数学", part: "概率大题看不懂？保姆式分析指导！\| 高考数学", require: "截 1 张概率统计例题" },
    "prob-advanced": { source: "一数", bvid: "BV14M4m1k71g", duration: "01:30:32", title: "【最后十课】概率大题束手无策？来拔高！2024高考冲刺！", part: "【最后十课】概率大题束手无策？来拔高！2024高考冲刺！", require: "截 1 张概率统计例题" },
  };

  const MATH_ROUTE_DAYS = [
    { day: 1, week: 1, title: "集合与条件判断", subtitle: "集合与充分必要条件", focus: ["集合"], videoKeys: ["set-core", "set-condition"] },
    { day: 2, week: 1, title: "函数主干框架", subtitle: "函数核心框架", focus: ["函数"], videoKeys: ["func-system"] },
    { day: 3, week: 1, title: "函数性质与复合函数", subtitle: "单调性、奇偶性、复合函数", focus: ["函数"], videoKeys: ["func-props", "func-exponential-composite"] },
    { day: 4, week: 1, title: "导数模块入口", subtitle: "导数基础内容", focus: ["导数"], videoKeys: ["deriv-intro"] },
    { day: 5, week: 1, title: "三角恒等变换", subtitle: "三角恒等变换公式与思路", focus: ["三角函数"], videoKeys: ["trig-transform-logic", "trig-transform-formulas"] },
    { day: 6, week: 2, title: "三角函数参数与图像", subtitle: "ω 参数与取值范围", focus: ["三角函数"], videoKeys: ["trig-omega-range"] },
    { day: 7, week: 2, title: "解三角形常考题", subtitle: "解三角形基础到进阶", focus: ["三角函数"], videoKeys: ["trig-solve-triangle", "trig-sine-cosine-law"] },
    { day: 8, week: 2, title: "解三角形范围与最值", subtitle: "范围与最值方法", focus: ["三角函数"], videoKeys: ["trig-range-extreme"] },
    { day: 9, week: 2, title: "数列通项与 an/Sn", subtitle: "通项与 an/Sn 混搭", focus: ["数列"], videoKeys: ["seq-an-sn", "seq-general-term"] },
    { day: 10, week: 2, title: "数列求和方法", subtitle: "错位相减、裂项相消、分组求和", focus: ["数列"], videoKeys: ["seq-sum-methods"] },
    { day: 11, week: 3, title: "数列讨论与综合题", subtitle: "最值、奇偶、花式讨论", focus: ["数列"], videoKeys: ["seq-discussion"] },
    { day: 12, week: 3, title: "基本不等式配凑", subtitle: "基本不等式配凑题型", focus: ["不等式"], videoKeys: [], mission: '基本不等式：去B站搜"基本不等式 题型"看一个，截图做题。' },
    { day: 13, week: 3, title: "平面向量运算", subtitle: "线性运算与坐标运算", focus: ["向量"], videoKeys: ["vector-linear", "vector-coordinate"] },
    { day: 14, week: 3, title: "数量积与向量结论", subtitle: "数量积、投影、极化恒等式", focus: ["向量"], videoKeys: ["vector-dot-product"] },
    { day: 15, week: 3, title: "立体几何证明", subtitle: "垂直证明与平行证明", focus: ["立体几何"], videoKeys: ["solid-vertical", "solid-parallel"] },
    { day: 16, week: 4, title: "空间向量与截面", subtitle: "空间向量与截面画法", focus: ["立体几何", "向量"], videoKeys: ["solid-space-vector", "solid-section"] },
    { day: 17, week: 4, title: "建系与坐标求解", subtitle: "立体几何建系与坐标求解", focus: ["立体几何"], videoKeys: ["solid-coordinate"] },
    { day: 18, week: 4, title: "直线与圆", subtitle: "直线与圆公式、方法、进阶题型", focus: ["解析几何"], videoKeys: ["analytic-line-circle", "analytic-line-circle-advanced"] },
    { day: 19, week: 4, title: "圆锥曲线二级结论", subtitle: "椭圆、抛物线、圆锥曲线小题", focus: ["解析几何"], videoKeys: ["analytic-ellipse", "analytic-parabola", "analytic-conic-hard"] },
    { day: 20, week: 4, title: "概率统计大题", subtitle: "概率大题分析与拔高", focus: ["概率统计"], videoKeys: ["prob-analysis", "prob-advanced"] },
  ];

  const CHEM_ROUTE_VIDEO_LIBRARY = {
    "atom-structure": { source: "一化儿", bvid: "BV17o6YBREY4", duration: "01:03:23", title: "【高一化学】原子结构+核素与同位素", part: "【高一化学】原子结构+核素与同位素", require: "截 1 张原子结构例题" },
    "amount-concentration": { source: "一化儿", bvid: "BV1S2vkB9ETU", duration: "35:06", title: "【高一化学】物质的量浓度|零基础开始学", part: "【高一化学】物质的量浓度|零基础开始学", require: "截 1 张化学反应例题" },
    "amount-gas-volume": { source: "一化儿", bvid: "BV1Yd23BqEWj", duration: "39:02", title: "【高一化学】物质的量——气体摩尔体积", part: "【高一化学】物质的量——气体摩尔体积", require: "截 1 张化学反应例题" },
    "redox-law": { source: "一化儿", bvid: "BV1KmHJzBE3S", duration: "01:20:38", title: "【高一化学】氧化还原反应的普遍规律（重难点！）", part: "【高一化学】氧化还原反应的普遍规律（重难点！）", require: "截 1 张氧化还原反应例题" },
    "sodium-element": { source: "一化儿", bvid: "BV1Sx2wBKEkG", duration: "01:15:04", title: "【高一化学】钠及其化合物——钠元素+钠单质+钠的氧化物", part: "【高一化学】钠及其化合物——钠元素+钠单质+钠的氧化物", require: "截 1 张氧化还原反应例题" },
    "sodium-carbonate": { source: "一化儿", bvid: "BV1SGCuB7EZh", duration: "01:01:23", title: "【高一化学】钠及其化合物——碳酸钠+碳酸氢钠", part: "【高一化学】钠及其化合物——碳酸钠+碳酸氢钠", require: "截 1 张化学反应例题" },
    "sulfur-oxide-physical": { source: "一化儿", bvid: "BV14RcjzCEHM", duration: "41:22", title: "【高一化学】硫及其化合物：硫单质 硫的氧化物—物理性质", part: "【高一化学】硫及其化合物：硫单质 硫的氧化物—物理性质", require: "截 1 张氧化还原反应例题" },
    "nitrogen-ammonium": { source: "一化儿", bvid: "BV1uNdBBfE6q", duration: "57:19", title: "【高一化学】氮及其化合物-铵盐 氨气实验室制备", part: "【高一化学】氮及其化合物-铵盐 氨气实验室制备", require: "截 1 张化学反应例题" },
    "inorganic-nonmetal-materials": { source: "一化儿", bvid: "BV1SS4y1S7q3", duration: "01:00:46", title: "高中化学【无机非金属材料】知识与解法合集！学渣救星", part: "高中化学【无机非金属材料】知识与解法合集！学渣救星", require: "截 1 张化学反应例题" },
    "organic-functional-groups": { source: "一化儿", bvid: "BV1cf4y1T7hg", duration: "21:05", title: "一节课就记住！有机化学官能团总结", part: "一节课就记住！有机化学官能团总结", require: "截 1 张有机化学例题" },
    "organic-alkane": { source: "一化儿", bvid: "BV13XG16mE6c", duration: "01:16:28", title: "【高一化学】必修二：有机化合物——烷烃", part: "【高一化学】必修二：有机化合物——烷烃", require: "截 1 张有机化学例题" },
    "organic-homolog-isomer": { source: "一化儿", bvid: "BV1cL716rEs7", duration: "01:06:07", title: "【高一化学】必修二：有机化合物——同系物与同分异构体", part: "【高一化学】必修二：有机化合物——同系物与同分异构体", require: "截 1 张有机化学例题" },
    "organic-ethylene-basic": { source: "一化儿", bvid: "BV1RP4y1T7qd", duration: "33:34", title: "【高中有机化学】乙烯、有机高分子材料|0基础救星！", part: "【高中有机化学】乙烯、有机高分子材料|0基础救星！", require: "截 1 张有机化学例题" },
    "organic-ethanol": { source: "一化儿", bvid: "BV1ZW7s6yEkk", duration: "01:36:21", title: "【高一化学】必修二：有机化合物——乙醇", part: "【高一化学】必修二：有机化合物——乙醇", require: "截 1 张有机化学例题" },
    "organic-substitution": { source: "一化儿", bvid: "BV11q4y1C7Rc", duration: "36:23", title: "高中有机化学方程汇总【取代反应】篇", part: "高中有机化学方程汇总【取代反应】篇", require: "截 1 张有机化学例题" },
  };

  const CHEM_ROUTE_DAYS = [
    { day: 1, week: 1, title: "原子结构第一块砖", subtitle: "先会看质子数、中子数、核素和同位素", focus: ["原子结构"], videoKeys: ["atom-structure"] },
    { day: 2, week: 1, title: "化学键补入口", subtitle: "离子键、共价键先认概念", focus: ["化学键"], videoKeys: [], mission: '化学键：去B站搜"高一化学 化学键 离子键 共价键 零基础"看一个，截图做题。' },
    { day: 3, week: 1, title: "物质的量浓度", subtitle: "n、c、V 三个量先连起来", focus: ["化学反应"], videoKeys: ["amount-concentration"] },
    { day: 4, week: 1, title: "气体摩尔体积", subtitle: "22.4 L/mol 的条件和计算", focus: ["化学反应"], videoKeys: ["amount-gas-volume"] },
    { day: 5, week: 1, title: "氧化还原规律", subtitle: "先抓化合价升降和氧化性还原性", focus: ["氧化还原反应"], videoKeys: ["redox-law"] },
    { day: 6, week: 2, title: "钠单质和氧化物", subtitle: "金属钠反应先建立元素化合物套路", focus: ["化学反应", "氧化还原反应"], videoKeys: ["sodium-element"] },
    { day: 7, week: 2, title: "碳酸钠和碳酸氢钠", subtitle: "性质对比和方程式", focus: ["化学反应"], videoKeys: ["sodium-carbonate"] },
    { day: 8, week: 2, title: "硫单质和硫氧化物", subtitle: "先认物质、颜色、状态和基本性质", focus: ["化学反应", "氧化还原反应"], videoKeys: ["sulfur-oxide-physical"] },
    { day: 9, week: 2, title: "硫酸和酸雨补洞", subtitle: "二氧化硫、硫酸根、酸雨关系", focus: ["化学反应", "氧化还原反应"], videoKeys: [], mission: '硫酸/酸雨：去B站搜"高一化学 硫及其化合物 硫酸 酸雨 二氧化硫"看一个，截图做题。' },
    { day: 10, week: 2, title: "氮及其化合物", subtitle: "铵盐和氨气实验室制备", focus: ["化学反应"], videoKeys: ["nitrogen-ammonium"] },
    { day: 11, week: 3, title: "无机非金属材料", subtitle: "把材料题当作基础物质性质题", focus: ["化学反应"], videoKeys: ["inorganic-nonmetal-materials"] },
    { day: 12, week: 3, title: "有机入门：官能团", subtitle: "先把常见官能团认出来", focus: ["有机化学"], videoKeys: ["organic-functional-groups"] },
    { day: 13, week: 3, title: "烷烃", subtitle: "有机第一类物质，先会结构和命名", focus: ["有机化学"], videoKeys: ["organic-alkane"] },
    { day: 14, week: 3, title: "同系物与同分异构体", subtitle: "有机概念题最容易丢分的入口", focus: ["有机化学"], videoKeys: ["organic-homolog-isomer"] },
    { day: 15, week: 3, title: "乙烯和高分子材料", subtitle: "双键、加成、材料常识", focus: ["有机化学"], videoKeys: ["organic-ethylene-basic"] },
    { day: 16, week: 4, title: "乙醇", subtitle: "羟基、氧化和常见反应", focus: ["有机化学"], videoKeys: ["organic-ethanol"] },
    { day: 17, week: 4, title: "取代反应方程式", subtitle: "把有机方程式写法补成可得分动作", focus: ["有机化学"], videoKeys: ["organic-substitution"] },
  ];

  // 多科内容包（P1b）：物理已就绪；数学/化学填了内容后把对应项从 null 换成 {TASKS,ROUTE_DAYS,ROUTE_VIDEO_LIBRARY,ONE_ROUND_BVS} 并把 SUBJECT_HAS_PLAN 翻 true。
  const PLAN_CONTENT = {
    physics: { TASKS: PHYSICS_TASKS, ROUTE_DAYS: PHYSICS_ROUTE_DAYS, ROUTE_VIDEO_LIBRARY: PHYSICS_ROUTE_VIDEO_LIBRARY, ONE_ROUND_BVS: PHYSICS_ONE_ROUND_BVS },
    math: { TASKS: [], ROUTE_DAYS: MATH_ROUTE_DAYS, ROUTE_VIDEO_LIBRARY: MATH_ROUTE_VIDEO_LIBRARY, ONE_ROUND_BVS: {} },
    chemistry: { TASKS: [], ROUTE_DAYS: CHEM_ROUTE_DAYS, ROUTE_VIDEO_LIBRARY: CHEM_ROUTE_VIDEO_LIBRARY, ONE_ROUND_BVS: {} },
  };
  // 引擎里所有函数继续用 TASKS/ROUTE_DAYS/ROUTE_VIDEO_LIBRARY/ONE_ROUND_BVS；这些是 let 别名，
  // 由 applySubjectContent() 在渲染前指向当前科目的内容包（无内容则回退物理，行为不变）。
  let TASKS = PHYSICS_TASKS;
  let ROUTE_DAYS = PHYSICS_ROUTE_DAYS;
  let ROUTE_VIDEO_LIBRARY = PHYSICS_ROUTE_VIDEO_LIBRARY;
  let ONE_ROUND_BVS = PHYSICS_ONE_ROUND_BVS;
  function applySubjectContent(subject = activeSubject) {
    const c = PLAN_CONTENT[subject] || PLAN_CONTENT.physics;
    TASKS = c.TASKS;
    ROUTE_DAYS = c.ROUTE_DAYS;
    ROUTE_VIDEO_LIBRARY = c.ROUTE_VIDEO_LIBRARY;
    ONE_ROUND_BVS = c.ONE_ROUND_BVS;
  }

  function readState() {
    const fallback = { pendingTaskId: "", pendingRouteDay: 0, pendingRouteTaskId: "", activeRouteDay: 0, tasks: {}, routeDays: {}, routeDetailDay: 0, examples: {}, reward: {} };
    try {
      const saved = JSON.parse(localStorage.getItem(subjectStateKey()) || "null");
      if (!saved || typeof saved !== "object") return fallback;
      return {
        pendingTaskId: String(saved.pendingTaskId || ""),
        pendingRouteDay: Number(saved.pendingRouteDay || 0),
        pendingRouteTaskId: String(saved.pendingRouteTaskId || ""),
        activeRouteDay: Number(saved.activeRouteDay || 0),
        tasks: saved.tasks && typeof saved.tasks === "object" ? saved.tasks : {},
        routeDays: saved.routeDays && typeof saved.routeDays === "object" ? saved.routeDays : {},
        routeDetailDay: Number(saved.routeDetailDay || 0),
        examples: saved.examples && typeof saved.examples === "object" ? saved.examples : {},
        reward: saved.reward && typeof saved.reward === "object" ? saved.reward : {},
      };
    } catch {
      return fallback;
    }
  }

  function writeState(state) {
    localStorage.setItem(subjectStateKey(), JSON.stringify(state));
  }

  function taskState(state, id) {
    return state.tasks[id] || {};
  }

  const SUPPORT_STATUSES = new Set(["active", "deferred", "resolved"]);
  const SUPPORT_REASONS = new Set(["concept", "formulas", "long"]);

  function taskSupport(info) {
    const raw = info?.support;
    if (!raw || typeof raw !== "object") return null;
    const status = SUPPORT_STATUSES.has(raw.status) ? raw.status : "";
    const reason = SUPPORT_REASONS.has(raw.reason) ? raw.reason : "";
    if (!status && !reason) return null;
    return {
      status: status || "active",
      reason,
      attempted: Array.isArray(raw.attempted) ? raw.attempted.filter((item) => item === "book" || item === "basic-video") : [],
      note: String(raw.note || ""),
      openedAt: String(raw.openedAt || ""),
      deferredAt: String(raw.deferredAt || ""),
      resolvedAt: String(raw.resolvedAt || ""),
      helpCardCopiedAt: String(raw.helpCardCopiedAt || ""),
    };
  }

  function taskIsDeferred(task, state) {
    return !taskReadyToAdvance(task, state) && taskSupport(taskState(state, task.id))?.status === "deferred";
  }

  function routeDayState(state, dayNo) {
    return state.routeDays?.[dayNo] || {};
  }

  function updateTask(id, patch) {
    const state = readState();
    state.tasks[id] = { ...taskState(state, id), ...patch, updatedAt: new Date().toISOString() };
    writeState(state);
    return state;
  }

  function updateTaskSupport(id, patch) {
    const state = readState();
    const current = taskState(state, id);
    const now = new Date().toISOString();
    const support = taskSupport(current) || {
      status: "active",
      reason: "",
      attempted: [],
      note: "",
      openedAt: now,
      deferredAt: "",
      resolvedAt: "",
      helpCardCopiedAt: "",
    };
    state.tasks[id] = {
      ...current,
      support: { ...support, ...patch },
      updatedAt: now,
    };
    writeState(state);
    return state;
  }

  function setPendingTask(id, patch = {}, options = {}) {
    const state = readState();
    state.pendingTaskId = id;
    state.tasks[id] = {
      ...taskState(state, id),
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    writeState(state);
    refreshHome(options);
  }

  function attachImportedRecord(logEntry) {
    applySubjectContent();
    const state = readState();
    const id = state.pendingTaskId;
    if (!id || !TASKS.some((task) => task.id === id)) {
      const routeDay = ROUTE_DAYS.find((day) => day.day === Number(state.pendingRouteDay || 0));
      if (!routeDay) return;
      const currentRoute = routeDayState(state, routeDay.day);
      const linkedLogIds = Array.isArray(currentRoute.linkedLogIds) ? currentRoute.linkedLogIds.slice() : [];
      if (logEntry?.id && !linkedLogIds.includes(logEntry.id)) linkedLogIds.push(logEntry.id);
      const routeTaskId = state.pendingRouteTaskId || routePrimaryTask(routeDay, state).id;
      const routeTask = findSummerTask(routeTaskId);
      if (routeTask) {
        const currentRouteTask = taskState(state, routeTask.id);
        const routeTaskLogIds = Array.isArray(currentRouteTask.linkedLogIds) ? currentRouteTask.linkedLogIds.slice() : [];
        if (logEntry?.id && !routeTaskLogIds.includes(logEntry.id)) routeTaskLogIds.push(logEntry.id);
        state.tasks[routeTask.id] = {
          ...currentRouteTask,
          watched: true,
          completed: true,
          reflectionRequired: true,
          reflectionDone: Boolean(currentRouteTask.reflectionDone),
          completedAt: new Date().toISOString(),
          linkedLogIds: routeTaskLogIds,
          lastImportedRecord: {
            id: logEntry?.id || "",
            subject: logEntry?.subject || "",
            nodeLabel: logEntry?.nodeLabel || "",
            stars: logEntry?.stars || 0,
          },
          activeStep: currentRouteTask.reflectionDone ? 3 : 2,
          updatedAt: new Date().toISOString(),
        };
      }
      state.routeDays[routeDay.day] = {
        ...currentRoute,
        startedAt: currentRoute.startedAt || new Date().toISOString(),
        completed: true,
        dailyReflectionRequired: true,
        dailyReflectionDone: Boolean(currentRoute.dailyReflectionDone),
        completedAt: new Date().toISOString(),
        linkedLogIds,
        lastImportedRecord: {
          id: logEntry?.id || "",
          subject: logEntry?.subject || "",
          nodeLabel: logEntry?.nodeLabel || "",
          stars: logEntry?.stars || 0,
        },
        updatedAt: new Date().toISOString(),
      };
      state.pendingRouteDay = 0;
      state.pendingRouteTaskId = "";
      writeState(state);
      return;
    }
    const current = taskState(state, id);
    const linkedLogIds = Array.isArray(current.linkedLogIds) ? current.linkedLogIds.slice() : [];
    if (logEntry?.id && !linkedLogIds.includes(logEntry.id)) linkedLogIds.push(logEntry.id);
    state.tasks[id] = {
      ...current,
      watched: true,
      completed: true,
      reflectionRequired: true,
      reflectionDone: Boolean(current.reflectionDone),
      completedAt: new Date().toISOString(),
      linkedLogIds,
      lastImportedRecord: {
        id: logEntry?.id || "",
        subject: logEntry?.subject || "",
        nodeLabel: logEntry?.nodeLabel || "",
        stars: logEntry?.stars || 0,
      },
      activeStep: current.reflectionDone ? 3 : 2,
      updatedAt: new Date().toISOString(),
    };
    state.pendingTaskId = "";
    state.pendingRouteDay = 0;
    state.pendingRouteTaskId = "";
    writeState(state);
  }

  function progress(state = readState()) {
    const readyTasks = TASKS.filter((task) => !task.needsExamples);
    const completed = readyTasks.filter((task) => taskReadyToAdvance(task, state)).length;
    const watched = TASKS.filter((task) => taskState(state, task.id).watched).length;
    const waiting = TASKS.filter((task) => task.needsExamples).length;
    return { completed, watched, total: readyTasks.length, all: TASKS.length, waiting };
  }

  function findTask(id) {
    return TASKS.find((task) => task.id === id) || null;
  }

  function routeVideos(day) {
    return (day?.videoKeys || []).map((key) => {
      const video = ROUTE_VIDEO_LIBRARY[key];
      return video ? { key, ...video } : null;
    }).filter(Boolean);
  }

  function routeVideoUrl(video) {
    if (video.url) return video.url;
    const bvid = video.bvid || ONE_ROUND_BVS[video.bvKey];
    if (!bvid) return ONE_ROUND_URL;
    return `https://www.bilibili.com/video/${bvid}/${video.page ? `?p=${video.page}` : ""}`;
  }

  function routeVideoStudyReference(video) {
    if (!/一轮/.test(String(video.source || ""))) return "";
    const part = String(video.part || "");
    const lecture = part.match(/【讲义([^】]+)】/)?.[1] || "";
    return [
      String(video.source || "一轮复习"),
      Number(video.page) > 0 ? `视频 P${Number(video.page)}` : "",
      lecture ? `讲义 ${lecture}` : "",
      String(video.title || ""),
    ].filter(Boolean).join(" · ");
  }

  function routeVideoTask(day, video) {
    const concepts = Array.isArray(day.focus) ? day.focus : [];
    return {
      id: `route-day-${day.day}-${video.key}`,
      title: video.title || day.title,
      subject: activeSubject,
      nodeLabel: inferRouteNodeLabel(day),
      day: day.day,
      source: video.source || "B站资源",
      duration: video.duration || "按需观看",
      url: routeVideoUrl(video),
      videoTitle: video.part || video.title || day.title,
      focusMins: 35,
      routeVideo: true,
      oneRoundReference: routeVideoStudyReference(video),
      prep: {
        concepts,
        backup: day.subtitle,
        backupLinks: routeResources(day).slice(0, 3),
      },
    };
  }

  function routeSheetTask(day) {
    const concepts = Array.isArray(day.focus) ? day.focus : [];
    return {
      id: `route-day-${day.day}-sheet`,
      title: day.title,
      subject: activeSubject,
      nodeLabel: inferRouteNodeLabel(day),
      day: day.day,
      source: "当天学习单",
      duration: "按需执行",
      url: routeResources(day)[0]?.url || ONE_ROUND_URL,
      videoTitle: day.subtitle,
      focusMins: 45,
      routeVideo: true,
      prep: {
        concepts,
        backup: day.subtitle,
        backupLinks: routeResources(day).slice(0, 3),
      },
    };
  }

  function findRouteVideoTask(id) {
    for (const day of ROUTE_DAYS) {
      if (`route-day-${day.day}-sheet` === id) return routeSheetTask(day);
      for (const video of routeVideos(day)) {
        const task = routeVideoTask(day, video);
        if (task.id === id) return task;
      }
    }
    return null;
  }

  function findSummerTask(id) {
    return findTask(id) || findRouteVideoTask(id);
  }

  function inferRouteNodeLabel(day) {
    // 非物理科目：直接用当天 focus 里的知识点（已是该科预设知识点），不套物理正则
    if (activeSubject !== "physics") {
      const focusLabel = (Array.isArray(day.focus) ? day.focus : []).find(Boolean);
      return focusLabel || (activeSubject === "math" ? "函数" : "化学反应");
    }
    const text = [day.title, day.subtitle, ...(day.focus || [])].join(" ");
    if (/电场|电势|电路|电流|电动势|电阻|实验/.test(text)) return "电场";
    if (/磁场|安培|洛伦兹/.test(text)) return "磁场";
    if (/电磁感应|楞次|磁通量|感应/.test(text)) return "电磁感应";
    if (/功|能|动量|机械能/.test(text)) return "能量守恒";
    if (/万有引力|圆周|平抛|运动|图像|追及|纸带|波|振动/.test(text)) return "运动学";
    if (/受力|牛二|摩擦|平衡|斜面/.test(text)) return "动力学";
    return "运动学";
  }

  function routeTasks(day) {
    return (day.taskIds || []).map(findTask).filter(Boolean);
  }

  function routeTaskPool(day) {
    const tasks = routeTasks(day);
    return tasks.length ? tasks : routeVideoTasks(day);
  }

  function routeDayCompleted(day, state) {
    return routeDayLearningReady(day, state) && dayReflectionDone(day, state);
  }

  function routeDayLearningReady(day, state) {
    const taskPool = routeTaskPool(day);
    return taskPool.length > 0 && taskPool.every((task) => taskReadyToAdvance(task, state));
  }

  function routeDayCanAdvance(day, state) {
    const taskPool = routeTaskPool(day);
    if (!taskPool.length || !taskPool.every((task) => taskReadyToAdvance(task, state) || taskIsDeferred(task, state))) return false;
    if (taskPool.every((task) => taskReadyToAdvance(task, state))) return dayReflectionDone(day, state);
    return true;
  }

  function routeDayStarted(day, state) {
    const taskPool = routeTaskPool(day);
    if (!taskPool.length) return Boolean(state.routeDays?.[day.day]?.startedAt);
    return taskPool.some((task) => {
      const info = taskState(state, task.id);
      return Boolean(info.startedAt || info.lastFocusedAt || info.watched || info.practicingAt || info.completed || taskSupport(info));
    }) || Boolean(state.routeDays?.[day.day]?.startedAt);
  }

  function taskReflectionDone(info) {
    if (!info?.completed) return false;
    if (!info.reflectionRequired) return true;
    return Boolean(info.reflectionDone);
  }

  function taskRewardCompletedAt(info) {
    if (!taskReflectionDone(info)) return "";
    return String(info.rewardCompletedAt || info.completedAt || "");
  }

  function taskReadyToAdvance(task, state) {
    return taskReflectionDone(taskState(state, task.id));
  }

  function routeVideoTasks(day) {
    const videos = routeVideos(day).map((video) => routeVideoTask(day, video));
    return videos.length ? videos : [routeSheetTask(day)];
  }

  function routePrimaryTask(day, state) {
    const tasks = routeVideoTasks(day);
    return tasks.find((task) => !taskReadyToAdvance(task, state) && !taskIsDeferred(task, state)) || tasks[0] || routeSheetTask(day);
  }

  function allPlanTasks() {
    const map = new Map();
    TASKS.concat(ROUTE_DAYS.flatMap((day) => routeVideoTasks(day))).forEach((task) => map.set(task.id, task));
    return Array.from(map.values());
  }

  function taskRouteDay(task) {
    return ROUTE_DAYS.find((day) => day.day === Number(task?.day || 0)) || null;
  }

  function deferredTasks(state) {
    return allPlanTasks().filter((task) => taskIsDeferred(task, state));
  }

  function deferredTasksBlockingDay(day, state) {
    if (!day) return deferredTasks(state);
    const isPhysicsReview = activeSubject === "physics" && day.day % 7 === 0;
    return deferredTasks(state).filter((task) => {
      const sourceDay = taskRouteDay(task);
      if (!sourceDay || sourceDay.day >= day.day) return false;
      if (sourceDay.week < day.week) return true;
      return isPhysicsReview && sourceDay.week === day.week;
    });
  }

  function dayRequiresDailyReflection(day, state) {
    const dayState = routeDayState(state, day.day);
    if (dayState.dailyReflectionRequired) return true;
    const tasks = routeTasks(day);
    if (tasks.length) return tasks.some((task) => Boolean(taskState(state, task.id).reflectionRequired));
    return routeVideoTasks(day).some((task) => Boolean(taskState(state, task.id).reflectionRequired));
  }

  function dayReflectionDone(day, state) {
    const dayState = routeDayState(state, day.day);
    if (!dayRequiresDailyReflection(day, state)) return true;
    return Boolean(dayState.dailyReflectionDone || dayState.reflectionDone);
  }

  function hasPendingTaskReflectionForDay(day, state) {
    const taskPool = routeTasks(day).length ? routeTasks(day) : routeVideoTasks(day);
    return taskPool.some((task) => {
      const info = taskState(state, task.id);
      return Boolean(info.completed && info.reflectionRequired && !info.reflectionDone);
    });
  }

  function dayReadyForDailyReflection(day, state) {
    if (!dayRequiresDailyReflection(day, state)) return false;
    return routeDayLearningReady(day, state) && !hasPendingTaskReflectionForDay(day, state);
  }

  function pendingDailyReflectionDay(state) {
    return ROUTE_DAYS.find((day) => dayReadyForDailyReflection(day, state) && !dayReflectionDone(day, state)) || null;
  }

  function currentRouteDay(state) {
    const pendingTask = findTask(state.pendingTaskId);
    const pendingDay = pendingTask && ROUTE_DAYS.find((day) => (day.taskIds || []).includes(pendingTask.id));
    if (pendingDay && !taskIsDeferred(pendingTask, state)) return pendingDay.day;
    const activeDay = ROUTE_DAYS.find((day) => day.day === Number(state.activeRouteDay || 0));
    if (activeDay && !routeDayCanAdvance(activeDay, state)) return activeDay.day;
    const pendingRouteDay = ROUTE_DAYS.find((day) => day.day === Number(state.pendingRouteDay || 0));
    if (pendingRouteDay && !routeDayCanAdvance(pendingRouteDay, state)) return pendingRouteDay.day;
    const firstOpenDay = ROUTE_DAYS.find((day) => !routeDayCanAdvance(day, state));
    return firstOpenDay?.day || ROUTE_DAYS[ROUTE_DAYS.length - 1].day;
  }

  function routeStats(state) {
    const completed = ROUTE_DAYS.filter((day) => routeDayCompleted(day, state)).length;
    return { completed, total: ROUTE_DAYS.length, pct: Math.round((completed / ROUTE_DAYS.length) * 100) };
  }

  function selectedRouteDay(state, currentDayNo) {
    const savedDay = ROUTE_DAYS.find((day) => day.day === Number(state.routeDetailDay || 0));
    return savedDay || ROUTE_DAYS.find((day) => day.day === currentDayNo) || ROUTE_DAYS[0];
  }

  function rollingTasks(state, limit = 3) {
    const directPending = findTask(state.pendingTaskId);
    const pending = directPending && !taskIsDeferred(directPending, state) ? directPending : null;
    const activeDay = ROUTE_DAYS.find((day) => day.day === Number(state.activeRouteDay || 0));
    if (activeDay && !routeDayCanAdvance(activeDay, state)) {
      const activeTasks = routeTasks(activeDay).filter((task) => !taskReadyToAdvance(task, state) && !taskIsDeferred(task, state));
      if (activeTasks.length) return activeTasks.slice(0, limit);
      return [];
    }
    const openTasks = TASKS.filter((task) => !taskReadyToAdvance(task, state) && !taskIsDeferred(task, state));
    const ordered = pending ? [pending, ...openTasks.filter((task) => task.id !== pending.id)] : openTasks;
    return ordered.slice(0, limit);
  }

  function nextRoutePlanDay(state) {
    const activeDay = ROUTE_DAYS.find((day) => day.day === Number(state.activeRouteDay || 0));
    if (activeDay && !routeTasks(activeDay).length && !routeDayCanAdvance(activeDay, state)) return activeDay;
    return ROUTE_DAYS.find((day) => !routeTasks(day).length && !routeDayCanAdvance(day, state)) || null;
  }

  function oneRoundVideoUrl(key) {
    const bvid = ONE_ROUND_BVS[key];
    return bvid ? `https://www.bilibili.com/video/${bvid}/` : ONE_ROUND_URL;
  }

  function routeResources(day) {
    const focusText = [...(Array.isArray(day.focus) ? day.focus : []), day.title, day.subtitle].join(" ");
    const links = [];
    const add = (label, url) => {
      if (!links.some((item) => item.url === url && item.label === label)) links.push({ label, url });
    };

    if (/运动图像|刹车|追及|直线运动/.test(focusText)) add("一轮运动学合集", oneRoundVideoUrl("kinematics"));
    if (/受力|摩擦|动态平衡|平衡/.test(focusText)) add("一轮平衡力学合集", oneRoundVideoUrl("balance"));
    if (/牛二|F=ma|连接体|斜面/.test(focusText)) add("一轮牛二力学合集", oneRoundVideoUrl("newton"));
    if (/平抛/.test(focusText)) add("一轮平抛运动合集", oneRoundVideoUrl("projectile"));
    if (/圆周|向心力/.test(focusText)) add("一轮圆周运动合集", oneRoundVideoUrl("circular"));
    if (/万有引力|卫星|轨道/.test(focusText)) add("一轮万有引力合集", oneRoundVideoUrl("gravitation"));
    if (/功|功率|动能|机械能|动量|功能/.test(focusText)) add("一轮功能动量合集", oneRoundVideoUrl("energy"));
    if (/电场|电势|电势能|恒定电流|串并联|电动势|内阻/.test(focusText)) add("一轮电场合集", oneRoundVideoUrl("electric"));
    if (/实验|纸带|伏安法|电表|仪器|误差/.test(focusText)) add("一轮电学实验合集", oneRoundVideoUrl("experiment"));
    if (/磁场|安培力|洛伦兹|左手/.test(focusText)) add("一轮磁场基础合集", oneRoundVideoUrl("magneticBasic"));
    if (/电磁感应|磁通量|楞次/.test(focusText)) add("一轮电磁感应合集", oneRoundVideoUrl("induction"));

    if (/力学|运动|受力|牛二|平抛|圆周|万有引力/.test(focusText)) add("黄夫人基础课目录（力学）", BASIC_2045_URL);
    if (/功|电|磁|波|热学|光学|原子/.test(focusText)) add("黄夫人基础课目录（电磁/选修）", BASIC_2181_URL);
    return links.slice(0, 3);
  }

  function renderSubjectTabs() {
    return `
      <div class="plan-subject-tabs" role="tablist" aria-label="选择科目计划">
        ${SUBJECT_TABS.map(([key, label]) => `
          <button class="plan-subject-tab ${activeSubject === key ? "active" : ""}" data-summer-action="switch-subject" data-subject="${key}" type="button" role="tab" aria-selected="${activeSubject === key ? "true" : "false"}">
            ${label}${SUBJECT_HAS_PLAN[key] ? "" : `<span class="plan-subject-soon">准备中</span>`}
          </button>
        `).join("")}
      </div>
    `;
  }

  function supportReasonLabel(reason) {
    return ({ concept: "概念没学过", formulas: "公式太多", long: "视频太长" })[reason] || "需要补基础";
  }

  function deferredDeadlineLabel(task) {
    const day = taskRouteDay(task);
    if (!day) return "本轮结束前处理";
    if (activeSubject === "physics") return `第 ${day.week * 7} 天复盘前处理`;
    return day.week < 4 ? `进入第 ${day.week + 1} 周前处理` : "本轮结束前处理";
  }

  function renderDeferredSummary(state) {
    const items = deferredTasks(state);
    if (!items.length) return "";
    return `
      <details class="summer-deferred-summary" aria-label="暂时搁置的卡点">
        <summary class="summer-deferred-summary-head">
          <span class="material-symbols-outlined">bookmark_added</span>
          <strong>有 ${items.length} 个卡点暂时搁置 · 本周复盘前处理</strong>
          <span class="summer-deferred-view">查看</span>
        </summary>
        <div class="summer-deferred-list">
          ${items.map((task) => {
            const support = taskSupport(taskState(state, task.id));
            return `
              <button data-summer-action="support-return" data-task-id="${escapeHtml(task.id)}" type="button">
                <span>
                  <strong>${escapeHtml(task.title)}</strong>
                  <small>${escapeHtml(supportReasonLabel(support?.reason))} · ${escapeHtml(deferredDeadlineLabel(task))}</small>
                </span>
                <span class="material-symbols-outlined">arrow_forward</span>
              </button>
            `;
          }).join("")}
        </div>
      </details>
    `;
  }

  function renderDeferredGate(day, tasks, state) {
    const target = day
      ? activeSubject === "physics" && day.day % 7 === 0
        ? `进入第 ${day.day} 天周测前`
        : `进入第 ${day.week} 周前`
      : "结束本轮计划前";
    return `
      <section class="summer-deferred-gate">
        <span class="material-symbols-outlined">priority_high</span>
        <div>
          <strong>${escapeHtml(target)}，先补回 ${tasks.length} 个卡点</strong>
          <p>这些任务之前只是暂时放下，还没有完成，也没有计入奖励。选一个回来处理，真正完成后才会解除拦截。</p>
          <div class="summer-deferred-gate-actions">
            ${tasks.map((task) => {
              const support = taskSupport(taskState(state, task.id));
              return `
                <button class="btn btn-primary btn-sm" data-summer-action="support-return" data-task-id="${escapeHtml(task.id)}" type="button">
                  <span class="material-symbols-outlined">restart_alt</span>回来处理：${escapeHtml(task.title)}
                  <small>${escapeHtml(supportReasonLabel(support?.reason))}</small>
                </button>
              `;
            }).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderPlanComingSoon(subject) {
    const name = subject === "math" ? "数学" : "化学";
    return `
      <div class="summer-route-placeholder plan-coming-soon">
        <span class="material-symbols-outlined">hourglass_top</span>
        <div>
          <strong>${name}一轮计划准备中</strong>
          <p>正在按你的分数段整理${name}的视频和练习路线，先把已开放的科目推进就好，${name}准备好会第一时间放这里。</p>
          <button class="btn btn-soft btn-sm" data-summer-action="switch-subject" data-subject="physics" type="button">先去物理</button>
        </div>
      </div>
    `;
  }

  function render() {
    applySubjectContent();
    if (!SUBJECT_HAS_PLAN[activeSubject]) {
      return `
        <section class="card summer-task-card">
          ${renderSubjectTabs()}
          ${renderPlanComingSoon(activeSubject)}
        </section>
      `;
    }
    const state = readState();
    const queue = rollingTasks(state, 3);
    const planDay = queue.length ? null : nextRoutePlanDay(state);
    const gateTasks = queue.length ? [] : deferredTasksBlockingDay(planDay, state);
    const activeDay = ROUTE_DAYS.find((day) => day.day === Number(state.activeRouteDay || 0));
    const completedDetailed = TASKS.filter((task) => taskReadyToAdvance(task, state)).length;
    const remainingDetailed = TASKS.length - completedDetailed;
    const pendingRoute = ROUTE_DAYS.find((day) => day.day === Number(state.pendingRouteDay || 0));
    const dailyGate = pendingDailyReflectionDay(state);
    const hero = buildHeroSummary(state, queue, planDay, remainingDetailed, pendingRoute, dailyGate);
    return `
      <section class="card summer-task-card">
        ${renderSubjectTabs()}
        <div class="summer-route-hero">
          <div class="summer-hero-title-line">
            <div class="summer-hero-copy">
              <p class="summer-kicker"><span class="material-symbols-outlined">calendar_today</span>${activeSubject === "physics" ? "暑假物理" : escapeHtml(currentSubjectLabel())}滚动任务</p>
              <h3>${escapeHtml(hero.title)}</h3>
              <p class="summer-hero-description">${escapeHtml(hero.description)}</p>
            </div>
            <div class="summer-hero-stats" aria-label="今日${escapeHtml(currentSubjectLabel())}任务概览">
              ${hero.stats.map((item) => `
              <span class="summer-hero-stat">
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.value)}</strong>
                ${item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}
              </span>
            `).join("")}
            </div>
          </div>
        </div>
        ${renderDeferredSummary(state)}
        ${activeDay && !routeDayCanAdvance(activeDay, state) ? `
          <div class="summer-active-day-bar">
            <span>当前锁定：第 ${activeDay.day} 天 · ${escapeHtml(activeDay.title)}</span>
            <button class="btn btn-soft btn-sm" data-summer-action="route-auto" type="button">回到自动顺延</button>
          </div>
        ` : ""}
        ${gateTasks.length
          ? renderDeferredGate(planDay, gateTasks, state)
          : queue.length
            ? renderRollingQueue(queue, state, remainingDetailed)
            : renderRouteLearningSheet(planDay, state, { pendingRoute })}
        ${dailyGate ? renderDailyReflectionOverlay(dailyGate, state) : ""}
        ${renderSummerRewardFloat(state)}
        ${routeOverviewOpen ? renderRouteOverviewOverlay() : ""}
      </section>
    `;
  }

  function readSummerRewardConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(SUMMER_REWARD_CONFIG_KEY) || "null");
      const items = Array.isArray(saved?.items) ? saved.items : SUMMER_REWARD_PRIZES;
      return {
        items: items
          .map((item) => ({
            label: String(item.label || ""),
            amount: Number(item.amount || 0),
            weight: Math.max(0, Number(item.weight || 0)),
            tone: String(item.tone || "coin"),
          }))
          .filter((item) => item.label && item.weight > 0),
      };
    } catch {
      return { items: SUMMER_REWARD_PRIZES.slice() };
    }
  }

  function rewardState(state) {
    const reward = state.reward && typeof state.reward === "object" ? state.reward : {};
    const boardCursor = Number(reward.boardCursor);
    return {
      collapsed: Boolean(reward.collapsed),
      open: Boolean(reward.open),
      position: reward.position && typeof reward.position === "object" ? reward.position : null,
      claimed: reward.claimed && typeof reward.claimed === "object" ? reward.claimed : {},
      history: Array.isArray(reward.history) ? reward.history.slice(0, 50) : [],
      lastPrize: reward.lastPrize && typeof reward.lastPrize === "object" ? reward.lastPrize : null,
      drawAnimation: reward.drawAnimation && typeof reward.drawAnimation === "object" ? reward.drawAnimation : null,
      boardCursor: Number.isFinite(boardCursor) ? boardCursor : 0,
    };
  }

  function writeRewardState(nextReward) {
    const state = readState();
    state.reward = { ...rewardState(state), ...nextReward };
    writeState(state);
  }

  // ===== 统一奖励经济（跨三科、独立 key、预算受控）=====
  // 奖池与预算来自 reward-economy-design；日常门槛按 2026-07-17 奖励门槛设计调整。
  const SHARED_REWARD_KEY = "summer_reward";
  const ECON = {
    dailySmall: { 3: 5, 4: 8 },                       // 今日完整任务数 → 当天累计自动小额奖励
    dailyPool: [{ a: 2, w: 45 }, { a: 5, w: 35 }, { a: 10, w: 15 }, { a: 20, w: 5 }],
    stageFixed: 15,
    stagePool: [{ a: 20, w: 52 }, { a: 50, w: 33 }, { a: 100, w: 15 }],
    qualifyNodes: 3,                                   // 达标日门槛（今日能量≥此值）
    stagePerDays: 5,                                   // 每 5 个达标日 = 1 阶段
    dailyCap: 40, weekCap: 150,                        // 硬预算上限
  };

  function sharedRewardFallback() {
    return {
      collapsed: true, position: null,
      paidTodayDate: "", paidToday: 0,
      weekKey: "", weekPaid: 0,
      dailySmallDate: "", dailySmallPaid: 0,
      qualDays: [], stages: 0, streak: 0, lastQualDate: "",
      dailyTickets: 0, stageTickets: 0,
      history: [], lastPrize: null, draw: null,
    };
  }
  function readSharedReward() {
    try {
      const r = JSON.parse(localStorage.getItem(SHARED_REWARD_KEY) || "null");
      if (!r || typeof r !== "object") return sharedRewardFallback();
      return { ...sharedRewardFallback(), ...r };
    } catch { return sharedRewardFallback(); }
  }
  function writeSharedReward(patch) {
    const next = { ...readSharedReward(), ...patch };
    next.history = Array.isArray(next.history) ? next.history.slice(0, 60) : [];
    next.qualDays = Array.isArray(next.qualDays) ? next.qualDays.slice(-400) : [];
    localStorage.setItem(SHARED_REWARD_KEY, JSON.stringify(next));
    return next;
  }
  function econWeekKey(dateStr) {
    const d = new Date(`${dateStr}T12:00:00`);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // 回到本周一
    return d.toISOString().slice(0, 10);
  }
  function econYesterday(dateStr) {
    const d = new Date(`${dateStr}T12:00:00`);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  function econPickPool(pool) {
    const total = pool.reduce((s, x) => s + x.w, 0);
    let roll = Math.random() * total;
    for (const x of pool) { roll -= x.w; if (roll <= 0) return x.a; }
    return pool[pool.length - 1].a;
  }
  // 今日跨三科完成的任务节点数（一个节点=视频走完整流程；直接读三科 state 桶，不受 activeSubject 影响）
  function nodesCompletedToday() {
    const today = todayIso();
    let count = 0;
    Object.values(STATE_KEYS).forEach((key) => {
      try {
        const st = JSON.parse(localStorage.getItem(key) || "null");
        const tasks = st && st.tasks && typeof st.tasks === "object" ? st.tasks : {};
        Object.values(tasks).forEach((info) => {
          if (taskRewardCompletedAt(info).slice(0, 10) === today) count += 1;
        });
      } catch { /* 单科损坏跳过 */ }
    });
    return count;
  }
  function econTierSmall(energy) {
    return Object.entries(ECON.dailySmall)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .reduce((amount, [tasks, reward]) => energy >= Number(tasks) ? Number(reward) : amount, 0);
  }
  // 历史上所有"当天跨三科完成节点数 ≥ 达标门槛"的日期（用于回填之前没同步进能量经济的达标日）
  function qualifyingDatesFromHistory() {
    const byDate = {};
    Object.values(STATE_KEYS).forEach((key) => {
      try {
        const st = JSON.parse(localStorage.getItem(key) || "null");
        const tasks = st && st.tasks && typeof st.tasks === "object" ? st.tasks : {};
        Object.values(tasks).forEach((info) => {
          const d = taskRewardCompletedAt(info).slice(0, 10);
          if (d) byDate[d] = (byDate[d] || 0) + 1;
        });
      } catch { /* 单科损坏跳过 */ }
    });
    return Object.keys(byDate).filter((d) => byDate[d] >= ECON.qualifyNodes);
  }
  // 幂等：每次渲染/导入后调用，把今日小奖补齐、达标日/连续/阶段/券结算好；预算硬上限兜底
  function syncEconomy() {
    const r = readSharedReward();
    const today = todayIso();
    const wk = econWeekKey(today);
    const energy = nodesCompletedToday();
    let paidToday = r.paidTodayDate === today ? r.paidToday : 0;
    let weekPaid = r.weekKey === wk ? r.weekPaid : 0;
    let dailySmallPaid = r.dailySmallDate === today ? r.dailySmallPaid : 0;
    const qualDays = Array.isArray(r.qualDays) ? r.qualDays.slice() : [];
    let stages = Number(r.stages || 0);
    let streak = Number(r.streak || 0);
    let lastQualDate = r.lastQualDate || "";
    let dailyTickets = Number(r.dailyTickets || 0);
    let stageTickets = Number(r.stageTickets || 0);
    // 回填历史达标日：把之前"完成了但没同步进经济"的达标日补进来（幂等，只补没在 qualDays 里的）。
    // 每个补进来的达标日补 1 张日常券，达标日总数每满 5 天补 1 张阶段券；只补券+进度，不追发过去的现金，避免搞乱预算。
    const already = new Set(qualDays);
    const backfillDays = qualifyingDatesFromHistory().filter((d) => d !== today && !already.has(d));
    if (backfillDays.length) {
      backfillDays.forEach((d) => qualDays.push(d));
      qualDays.sort();
      dailyTickets += backfillDays.length;
      const stagesNow = Math.floor(qualDays.length / ECON.stagePerDays);
      if (stagesNow > stages) { stageTickets += stagesNow - stages; stages = stagesNow; }
      // 基于回填后的 qualDays 重算连续 streak 和最近达标日，让显示和后续连续加成正确
      let s = qualDays.length ? 1 : 0;
      for (let i = qualDays.length - 1; i > 0; i--) { if (qualDays[i - 1] === econYesterday(qualDays[i])) s++; else break; }
      streak = s;
      lastQualDate = qualDays[qualDays.length - 1] || lastQualDate;
    }
    const pay = (amt, skipDaily) => {
      let p = amt;
      if (!skipDaily) p = Math.min(p, Math.max(0, ECON.dailyCap - paidToday));
      p = Math.min(p, Math.max(0, ECON.weekCap - weekPaid));
      p = Math.max(0, Math.round(p));
      paidToday += p; weekPaid += p; return p;
    };
    // 渠道A：今日小奖（补差价，当天多做会补到更高档）
    const target = econTierSmall(energy);
    if (target > dailySmallPaid) dailySmallPaid += pay(target - dailySmallPaid, false);
    // 达标日 + 连续加成 + 阶段
    if (energy >= ECON.qualifyNodes && !qualDays.includes(today)) {
      qualDays.push(today);
      dailyTickets += 1;
      streak = lastQualDate === econYesterday(today) ? streak + 1 : 1;
      lastQualDate = today;
      if (streak % 3 === 0) dailyTickets += 1;
      if (qualDays.length % ECON.stagePerDays === 0) {
        stages += 1;
        pay(ECON.stageFixed, true); // 阶段固定奖，不受日限、只受周限
        stageTickets += 1;
      }
    }
    writeSharedReward({
      paidTodayDate: today, paidToday, weekKey: wk, weekPaid,
      dailySmallDate: today, dailySmallPaid,
      qualDays, stages, streak, lastQualDate, dailyTickets, stageTickets,
    });
    return { energy, paidToday, weekPaid, dailySmallPaid, qualDays, stages, streak, dailyTickets, stageTickets };
  }
  // 花一张券抽奖：kind 指定用哪种券（daily=小额池 / stage=大额池），两种独立、由用户点对应按钮触发；预算硬上限兜底
  function econDraw(kind) {
    const r = readSharedReward();
    if (kind !== "stage" && kind !== "daily") return null;
    if (kind === "stage" && r.stageTickets <= 0) return null;
    if (kind === "daily" && r.dailyTickets <= 0) return null;
    const drawn = econPickPool(kind === "stage" ? ECON.stagePool : ECON.dailyPool);
    const today = todayIso();
    const wk = econWeekKey(today);
    let paidToday = r.paidTodayDate === today ? r.paidToday : 0;
    let weekPaid = r.weekKey === wk ? r.weekPaid : 0;
    let paid = drawn;
    if (kind !== "stage") paid = Math.min(paid, Math.max(0, ECON.dailyCap - paidToday)); // 大券不受日限
    paid = Math.max(0, Math.min(paid, Math.max(0, ECON.weekCap - weekPaid)));
    const entry = { kind, drawn, paid, date: today, ts: Date.now() };
    writeSharedReward({
      paidTodayDate: today, paidToday: paidToday + paid,
      weekKey: wk, weekPaid: weekPaid + paid,
      dailyTickets: kind === "daily" ? Math.max(0, r.dailyTickets - 1) : r.dailyTickets,
      stageTickets: kind === "stage" ? Math.max(0, r.stageTickets - 1) : r.stageTickets,
      history: [entry, ...(Array.isArray(r.history) ? r.history : [])].slice(0, 60),
      lastPrize: entry,
    });
    return entry;
  }

  // ===== 抽奖骰子动画（把 econDraw 的结果用"摇骰子走格"呈现）=====
  // 逻辑金额来自 ECON（变体C），骰子只是把已定好的结果演出来，钱在"摇骰子"那一刻由 econDraw 结算。
  function econTone(amount) {
    const v = Number(amount || 0);
    return v >= 100 ? "jackpot" : v >= 50 ? "big" : v >= 20 ? "big" : "coin";
  }
  function econPrizeLabel(amount) {
    const v = Number(amount || 0);
    if (v >= 100) return "超级大奖";
    if (v >= 50) return "大奖";
    if (v >= 20) return "大额奖励";
    if (v >= 10) return "中额奖励";
    if (v >= 5) return "小奖励";
    return "鼓励奖";
  }
  function econCell(amount, index) {
    return { label: econPrizeLabel(amount), amount: Number(amount || 0), weight: 1, tone: econTone(amount), cellId: `reward-cell-${index}` };
  }
  // 用当前券对应的奖池铺满 8 格盘面（阶段券=大额池，日常券=小额池）
  function econBuildBoard(kind) {
    const amounts = (kind === "stage" ? ECON.stagePool : ECON.dailyPool).map((x) => x.a);
    return Array.from({ length: SUMMER_REWARD_BOARD_SIZE }, (_, i) => econCell(amounts[i % amounts.length], i));
  }
  // 某种券此刻能否抽（预算没到顶）："" 可抽 / "week" 周顶 / "day" 日顶（仅日常券受日限）
  function econKindBlocked(kind) {
    const r = readSharedReward();
    const today = todayIso();
    const wk = econWeekKey(today);
    const paidToday = r.paidTodayDate === today ? Number(r.paidToday || 0) : 0;
    const weekPaid = r.weekKey === wk ? Number(r.weekPaid || 0) : 0;
    if (ECON.weekCap - weekPaid <= 0) return "week";
    if (kind === "daily" && ECON.dailyCap - paidToday <= 0) return "day";
    return "";
  }
  // 3 颗骰子：点数相加=走几格（最小 3 格，不再有摇到 1 只走一格的尴尬），加不确定感和"噔噔噔"的游戏感
  const ECON_DICE_COUNT = 3;
  const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  function diceFace(v) { return v >= 1 && v <= 6 ? DICE_FACES[v - 1] : "?"; }
  // 抽小奖/抽大奖：打开对应奖池盘面 + 3 颗待摇骰子（此刻不扣券，摇满 3 颗那一刻才 econDraw 结算）
  function econOpenBoard(kind, trigger) {
    const r = readSharedReward();
    if (r.draw && r.draw.phase && r.draw.phase !== "result") {
      window.MochiApp?.toast?.("抽奖盘已经开着，先把骰子摇完"); return;
    }
    const have = kind === "stage" ? r.stageTickets : kind === "daily" ? r.dailyTickets : 0;
    if (have <= 0) { window.MochiApp?.toast?.("这种券不够了"); return; }
    const blocked = econKindBlocked(kind);
    if (blocked) {
      window.MochiApp?.toast?.(blocked === "week" ? "本周奖金已封顶，券留到下周" : "今天奖金已达上限，小奖券留到明天");
      return;
    }
    writeSharedReward({ draw: {
      phase: "ready", kind, board: econBuildBoard(kind),
      dice: [0, 0, 0], startIndex: 0, cursor: 0, targetIndex: -1, sum: 0,
    } });
    refreshHome({ preserveScroll: true });
    trigger?.blur?.();
  }
  // 摇下一颗骰子：逐颗摇（点骰子或按钮都行），摇满 3 颗才结算并按点数和走格
  function econRollNextDie(trigger) {
    if (econAnimActive) return; // 一颗还在转时忽略连点，避免同一颗被摇两次
    const r0 = readSharedReward();
    const d0 = r0.draw;
    if (!d0 || d0.phase !== "ready") return;
    const idx = (Array.isArray(d0.dice) ? d0.dice : []).findIndex((x) => !x);
    if (idx < 0) return;
    window.clearTimeout(econAnimTimer);
    econAnimActive = true;
    trigger?.blur?.();
    const dieEl = document.querySelectorAll("[data-econ-die]")[idx] || null;
    const final = Math.floor(Math.random() * 6) + 1;
    // 减速旋转：帧间隔由快到慢，越接近停下越慢，像抽奖那样制造悬疑感。
    // 20 帧连续咔哒、总时长约 3 秒（比原来翻倍），音效随之贯穿整个过程。
    const spinDelays = Array.from({ length: 20 }, (_, k) => Math.round(46 * Math.pow(1.115, k)));
    let i = 0;
    const spin = () => {
      if (dieEl) { dieEl.textContent = diceFace(Math.floor(Math.random() * 6) + 1); dieEl.classList.add("rolling"); }
      playDiceSpin(i, spinDelays.length); // 摇骰子音效
      i += 1;
      if (i < spinDelays.length) { econAnimTimer = setTimeout(spin, spinDelays[i - 1]); return; }
      if (dieEl) { dieEl.textContent = diceFace(final); dieEl.classList.remove("rolling"); }
      playDiceLand(); // 出骰子结果音效
      const cur = readSharedReward();
      const d = cur.draw;
      if (!d || d.phase !== "ready") { econAnimActive = false; return; }
      d.dice[idx] = final;
      if (d.dice.every(Boolean)) {
        const entry = econDraw(d.kind);
        if (!entry) { writeSharedReward({ draw: null }); econAnimActive = false; refreshHome({ preserveScroll: true }); window.MochiApp?.toast?.("抽奖券不够"); return; }
        const sum = d.dice.reduce((a, b) => a + Number(b || 0), 0);
        d.sum = sum;
        d.drawn = entry.drawn; d.paid = entry.paid;
        d.targetIndex = (d.startIndex + sum) % SUMMER_REWARD_BOARD_SIZE;
        d.board = d.board.map((c, i) => (i === d.targetIndex ? econCell(entry.drawn, i) : c));
        d.phase = "walking";
        writeSharedReward({ draw: d });
        refreshHome({ preserveScroll: true });
        econWalk(d, 0, d.startIndex);
      } else {
        writeSharedReward({ draw: d });
        econAnimActive = false;
        refreshHome({ preserveScroll: true });
      }
    };
    spin();
  }
  // 走格：点数和是几就走几格（可绕盘多圈），一格一格"噔噔噔"，最后落在中奖格
  // 整体放慢，且最后几格越走越慢——越接近结果越慢，配合升高的走格音效制造悬疑感
  function econWalk(d, step, cursor) {
    const total = Number(d.sum || 0);
    if (step >= total) { econFinishDraw(d); return; }
    const next = (cursor + 1) % SUMMER_REWARD_BOARD_SIZE;
    setRewardCursor(next);
    const remaining = total - step - 1; // 走完这一步后还剩几格
    playWalkTick(remaining); // 走格音效，越接近终点音调越高
    let delay = 420;
    if (remaining <= 4) delay = 470 + (5 - remaining) * 150; // 4→620,3→770,2→920,1→1070,0→1220（停在中奖格前稍作停顿）
    econAnimTimer = setTimeout(() => econWalk(d, step + 1, next), delay);
  }
  // 抽奖盘面（3 骰子版）：ready=待摇 / walking=走格中 / result=定格
  function renderEconBoard(d) {
    if (!d) return "";
    const phase = d.phase || "ready";
    const cursor = Number.isFinite(Number(d.cursor)) ? Number(d.cursor) : 0;
    const targetIndex = Number.isFinite(Number(d.targetIndex)) ? Number(d.targetIndex) : -1;
    const dice = Array.isArray(d.dice) ? d.dice : [0, 0, 0];
    const rolledCount = dice.filter(Boolean).length;
    const remaining = ECON_DICE_COUNT - rolledCount;
    const sum = dice.reduce((a, b) => a + Number(b || 0), 0);
    const cells = (d.board || []).map((item, i) => {
      const isActive = i === cursor && phase !== "ready";
      const isTarget = phase === "result" && i === targetIndex;
      return `<div class="summer-reward-cell ${rewardToneClass(item.tone)} ${isActive ? "active" : ""} ${isTarget ? "target" : ""}" data-reward-cell="${i}">
        <span>${escapeHtml(rewardAmountText(item.amount))}</span>
        <strong>${escapeHtml(item.label || "")}</strong>
      </div>`;
    }).join("");
    const diceRow = `<div class="summer-reward-dice-row">
      ${dice.map((v, i) => `<span class="summer-reward-die3 ${v ? "landed" : "empty"}" data-econ-die="${i}"${phase === "ready" && !v ? ` data-summer-action="reward-roll" role="button" tabindex="0"` : ""}>${diceFace(v)}</span>`).join("")}
    </div>`;
    const caption = phase === "ready"
      ? (rolledCount === 0 ? "摇 3 颗骰子，点数相加就是走几格" : remaining ? `已摇 ${rolledCount} 颗 · ${sum} 点，还剩 ${remaining} 颗` : `共 ${sum} 点，开始走格`)
      : phase === "walking" ? `${sum} 点，噔噔噔走 ${sum} 格` : "停在这一格！";
    return `<div class="summer-reward-game phase-${escapeHtml(phase)}" data-reward-game>
      ${diceRow}
      <p class="summer-reward-dice-caption">${escapeHtml(caption)}</p>
      <div class="summer-reward-board">${cells}</div>
      ${phase === "ready" ? `<button class="summer-reward-roll" data-summer-action="reward-roll" type="button">
        <span class="material-symbols-outlined">casino</span>${rolledCount === 0 ? "摇骰子" : remaining ? `再摇一颗（还剩 ${remaining}）` : "开始走格"}
      </button>` : phase === "result" ? `<div class="summer-reward-result ${rewardToneClass(econTone(d.drawn))}">
        <span>${d.kind === "stage" ? "大奖" : "小奖"}</span>
        <strong>抽中 ¥${Number(d.drawn || 0)}</strong>
        <em>${Number(d.paid) < Number(d.drawn) ? `本周已达上限，实发 ¥${Number(d.paid || 0)}` : `已到账 ¥${Number(d.paid || 0)}`}</em>
        <button class="btn btn-soft btn-sm" data-summer-action="reward-clear-result" type="button">收起结果</button>
      </div>` : `<p class="summer-reward-claim">别急，走完才算数…</p>`}
    </div>`;
  }
  function econFinishDraw(anim) {
    window.clearTimeout(econAnimTimer);
    econAnimTimer = null;
    econAnimActive = false;
    writeSharedReward({ draw: { ...anim, phase: "result", cursor: anim.targetIndex } });
    refreshHome({ preserveScroll: true });
    setTimeout(() => {
      const float = document.querySelector("[data-summer-reward]");
      if (float) {
        float.classList.add("drawn");
        window.MochiApp?.sparkle?.(float, Number(anim.drawn || 0) >= 50 ? "★" : "¥");
        setTimeout(() => float.classList.remove("drawn"), 900);
      }
      playPrizeFanfare(Number(anim.drawn || 0) >= 50); // 出抽奖结果：命运交响曲搞笑小旋律
    }, 80);
    const paidNote = Number(anim.paid) < Number(anim.drawn) ? `本周已达上限，实发 ¥${anim.paid}` : `¥${anim.paid} 已到账`;
    window.MochiApp?.toast?.(`抽中 ¥${anim.drawn}，${paidNote}`);
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function todayFocusMinutes() {
    try {
      const today = todayIso();
      return (JSON.parse(localStorage.getItem("focus_log") || "[]") || [])
        .filter((log) => log.type === "focus" && log.completed && log.date === today)
        .reduce((sum, log) => sum + Number(log.actualMins || log.durationMins || 0), 0);
    } catch {
      return 0;
    }
  }

  function todayImportedCount() {
    try {
      const today = todayIso();
      return (JSON.parse(localStorage.getItem("study_log") || "[]") || [])
        .filter((log) => log.date === today).length;
    } catch {
      return 0;
    }
  }

  function rewardDay(state) {
    const active = ROUTE_DAYS.find((day) => day.day === Number(state.activeRouteDay || 0));
    if (active) return active;
    return ROUTE_DAYS.find((day) => day.day === currentRouteDay(state)) || ROUTE_DAYS[0];
  }

  function taskStepScore(task, state) {
    const info = taskState(state, task.id);
    const examples = taskExamples(state, task.id);
    const hasPractice = getPracticeItems(task).length > 0;
    let score = 0;
    if (info.startedAt || info.lastFocusedAt || info.watched) score += 1;
    if (examples.length || hasPractice || info.practicingAt) score += 1;
    // 第3格只认真实导入/完成，不认"点了复制测验包"（进度环诚实反映真进度）
    if (info.completed) score += 1;
    if (taskReadyToAdvance(task, state)) score += 1;
    return Math.min(4, score);
  }

  function rewardStats(state) {
    const day = rewardDay(state);
    const tasks = day ? routeVideoTasks(day) : [];
    const totalSteps = Math.max(1, tasks.length * 4);
    const doneSteps = tasks.reduce((sum, task) => sum + taskStepScore(task, state), 0);
    const completedTasks = tasks.filter((task) => taskReadyToAdvance(task, state)).length;
    const currentTask = tasks.find((task) => !taskReadyToAdvance(task, state) && !taskIsDeferred(task, state)) || tasks[tasks.length - 1] || null;
    const currentInfo = currentTask ? taskState(state, currentTask.id) : {};
    const currentFlow = currentTask ? getTaskFlow(currentTask, currentInfo, state.pendingTaskId === currentTask.id || state.pendingRouteTaskId === currentTask.id) : null;
    const claims = availableRewardClaims(state);
    return {
      day,
      tasks,
      completedTasks,
      totalTasks: tasks.length,
      doneSteps,
      totalSteps,
      pct: Math.min(100, Math.round((doneSteps / totalSteps) * 100)),
      currentTask,
      currentStep: currentFlow?.label || "已完成",
      focusMins: todayFocusMinutes(),
      importedCount: todayImportedCount(),
      claims,
    };
  }

  function renderRewardProgressGuide(state, eco, sharedReward) {
    const stats = rewardStats(state);
    const energy = Number(eco.energy || 0);
    const dailyNeed = Math.max(0, ECON.qualifyNodes - energy);
    const qualDays = Array.isArray(sharedReward.qualDays) ? sharedReward.qualDays : [];
    const stageDays = qualDays.length % ECON.stagePerDays;
    const stageNeed = Math.max(0, ECON.stagePerDays - stageDays);
    const stageTickets = Number(sharedReward.stageTickets || 0);
    const dailyDone = Math.min(energy, ECON.qualifyNodes);
    const qualifiedToday = qualDays.includes(todayIso());
    const dailyStatus = qualifiedToday
      ? `现在 ${dailyDone}/${ECON.qualifyNodes}，今天的小奖券已获得`
      : dailyNeed === 0
        ? `现在 ${dailyDone}/${ECON.qualifyNodes}，已得到小奖券`
        : `现在 ${dailyDone}/${ECON.qualifyNodes}，还差 ${dailyNeed} 个视频任务`;
    const stageStatus = stageTickets > 0
      ? `现在 ${stageDays}/${ECON.stagePerDays}，已可抽大奖`
      : `现在 ${stageDays}/${ECON.stagePerDays}，还差 ${stageNeed} 个达标日`;
    const dailyPct = Math.min(100, Math.round((Math.min(energy, ECON.qualifyNodes) / ECON.qualifyNodes) * 100));
    const stagePct = Math.min(100, Math.round((stageDays / ECON.stagePerDays) * 100));
    const currentTask = stats.currentTask;
    const currentInfo = currentTask ? taskState(state, currentTask.id) : {};
    const examplesReady = currentTask ? taskExamples(state, currentTask.id).length > 0 : false;
    const hasPractice = currentTask ? getPracticeItems(currentTask).length > 0 : false;
    const stepItems = currentTask ? [
      { label: "开始这节课 / 看视频", done: Boolean(currentInfo.startedAt || currentInfo.lastFocusedAt || currentInfo.watched) },
      { label: hasPractice ? "进入练题区或收集例题" : "收集视频例题", done: Boolean(examplesReady || hasPractice || currentInfo.practicingAt) },
      { label: "粘回学习记录", done: Boolean(currentInfo.completed) },
      { label: "保存本节收尾", done: taskReadyToAdvance(currentTask, state) },
    ] : [];
    const nextStep = stepItems.find((item) => !item.done);
    const currentTitle = currentTask ? currentTask.title : "今天的任务";

    return `
      <div class="summer-reward-guide" aria-label="奖励进度说明">
        <div class="summer-reward-goal">
          <div>
            <strong>日常小奖</strong>
            <span>今天完成 ${ECON.qualifyNodes} 个视频任务 = 1 张小奖券<br>${dailyStatus}</span>
          </div>
          <b>${Math.min(energy, ECON.qualifyNodes)}/${ECON.qualifyNodes}</b>
          <div class="summer-reward-mini-track"><i style="width:${dailyPct}%"></i></div>
        </div>
        <div class="summer-reward-goal stage">
          <div>
            <strong>大奖</strong>
            <span>攒够 ${ECON.stagePerDays} 个达标日 = 1 张大奖券<br>达标日：当天完成 ${ECON.qualifyNodes} 个视频任务<br>${stageStatus}</span>
          </div>
          <b>${stageDays}/${ECON.stagePerDays}</b>
          <div class="summer-reward-mini-track"><i style="width:${stagePct}%"></i></div>
        </div>
        <div class="summer-reward-rule">
          <span class="material-symbols-outlined">info</span>
          <p>什么算完成 1 个视频任务？看课 → 做题/截图 → 粘回学习记录 → 写本节收尾。</p>
        </div>
        ${currentTask ? `
          <div class="summer-reward-node">
            <small>当前视频任务</small>
            <strong>${escapeHtml(currentTitle)}</strong>
            <span>${nextStep ? `下一步：${escapeHtml(nextStep.label)}` : "这个视频任务已完成"}</span>
            <div class="summer-reward-node-steps">
              ${stepItems.map((item, index) => `
                <span class="${item.done ? "done" : ""}" title="${escapeHtml(item.label)}">
                  ${item.done ? "✓" : index + 1}
                </span>
              `).join("")}
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }

  function availableRewardClaims(state) {
    const reward = rewardState(state);
    const claims = [];
    ROUTE_DAYS.forEach((day) => {
      if (routeDayCompleted(day, state)) {
        const key = `day-${day.day}`;
        if (!reward.claimed[key]) claims.push({ key, type: "day", label: `第 ${day.day} 天完成抽奖` });
      }
    });
    [1, 2, 3, 4].forEach((week) => {
      const days = ROUTE_DAYS.filter((day) => day.week === week);
      if (days.length && days.every((day) => routeDayCompleted(day, state))) {
        const key = `week-${week}`;
        if (!reward.claimed[key]) claims.push({ key, type: "week", label: `第 ${week} 周完成抽奖` });
      }
    });
    return claims;
  }

  function drawWeightedPrize(items) {
    const total = items.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    let roll = Math.random() * total;
    for (const item of items) {
      roll -= Number(item.weight || 0);
      if (roll <= 0) return item;
    }
    return items[items.length - 1];
  }

  function normalizeRewardPrize(item, fallbackIndex = 0) {
    const fallback = SUMMER_REWARD_PRIZES[fallbackIndex % SUMMER_REWARD_PRIZES.length];
    const amount = Number(item?.amount ?? fallback.amount ?? 0);
    return {
      label: String(item?.label || fallback.label || "奖励"),
      amount: Number.isFinite(amount) ? amount : 0,
      weight: Math.max(0, Number(item?.weight ?? fallback.weight ?? 1)),
      tone: String(item?.tone || fallback.tone || "coin"),
    };
  }

  function buildRewardBoard(items, prize, targetIndex) {
    const source = (items && items.length ? items : SUMMER_REWARD_PRIZES).map((item, index) => normalizeRewardPrize(item, index));
    const board = Array.from({ length: SUMMER_REWARD_BOARD_SIZE }, (_, index) => {
      const item = source[index % source.length];
      return { ...item, cellId: `reward-cell-${index}` };
    });
    board[targetIndex] = { ...normalizeRewardPrize(prize), cellId: `reward-cell-${targetIndex}` };
    return board;
  }

  function rewardAmountText(amount) {
    const value = Number(amount || 0);
    return value > 0 ? `${value} 元` : "继续攒能量";
  }

  function rewardToneClass(value) {
    return ["plain", "coin", "big", "jackpot"].includes(value) ? value : "coin";
  }

  function renderRewardBoard(boardState) {
    if (!boardState) return "";
    const board = Array.isArray(boardState.board) ? boardState.board : [];
    if (!board.length) return "";
    const phase = boardState.phase || "result";
    const cursor = Number.isFinite(Number(boardState.cursor)) ? Number(boardState.cursor) : 0;
    const targetIndex = Number.isFinite(Number(boardState.targetIndex)) ? Number(boardState.targetIndex) : -1;
    const dice = phase === "ready" ? 0 : Number(boardState.finalDice || boardState.dice || 0);
    const prize = normalizeRewardPrize(boardState.prize || boardState);
    const cells = board.map((item, index) => {
      const isActive = index === cursor;
      const isTarget = phase === "result" && index === targetIndex;
      return `
        <div class="summer-reward-cell ${rewardToneClass(item.tone)} ${isActive ? "active" : ""} ${isTarget ? "target" : ""}" data-reward-cell="${index}">
          <span>${escapeHtml(rewardAmountText(item.amount))}</span>
          <strong>${escapeHtml(item.label || "")}</strong>
        </div>
      `;
    }).join("");
    const phaseText = phase === "ready" ? "抽奖盘已打开" : phase === "rolling" ? "骰子转动中" : phase === "moving" ? `骰子 ${dice || "-"} 点，正在走格` : "结果已定格";
    return `
      <div class="summer-reward-game ${escapeHtml(phase)}" data-reward-game>
        <div class="summer-reward-game-head">
          <div class="summer-reward-dice ${phase === "rolling" ? "rolling" : ""}" data-reward-dice>${dice || "?"}</div>
          <div>
            <strong data-reward-status>${escapeHtml(phaseText)}</strong>
            <span data-reward-caption>${phase === "ready" ? "点下面的骰子按钮，再开始真正抽奖。" : phase === "result" ? "结果会留在这里，方便截图发给家长。" : "慢慢走完，停在哪格算哪格。"}</span>
          </div>
        </div>
        <div class="summer-reward-board" data-reward-board>
          ${cells}
        </div>
        ${phase === "ready" ? `
          <button class="summer-reward-roll" data-summer-action="reward-roll" type="button">
            <span class="material-symbols-outlined">casino</span>
            摇骰子开始
          </button>
        ` : phase === "result" ? `
          <div class="summer-reward-result ${rewardToneClass(prize.tone)}">
            <span>${escapeHtml(boardState.claim?.label || boardState.claim || "暑假任务奖励")}</span>
            <strong>${escapeHtml(prize.label)}</strong>
            <em>${escapeHtml(rewardAmountText(prize.amount))}</em>
            <button class="btn btn-soft btn-sm" data-summer-action="reward-clear-result" type="button">收起结果</button>
          </div>
        ` : `
          <p class="summer-reward-claim">抽奖进行中，先别刷新页面。</p>
        `}
      </div>
    `;
  }

  function renderSummerRewardFloat(state = readState()) {
    const eco = syncEconomy();
    const r = readSharedReward();
    const collapsed = Boolean(r.collapsed);
    const hasPosition = r.position && Number.isFinite(r.position.x) && Number.isFinite(r.position.y);
    const pos = hasPosition
      ? `left:${Math.max(REWARD_EDGE_INSET, Number(r.position.x))}px;top:${Math.max(REWARD_EDGE_INSET, Number(r.position.y))}px;right:auto;bottom:auto` : "";
    const energy = eco.energy;
    const daily = Number(r.dailyTickets || 0);
    const stageT = Number(r.stageTickets || 0);
    const tickets = daily + stageT;
    const canDraw = tickets > 0;
    const daysInStage = (r.qualDays?.length || 0) % ECON.stagePerDays;
    const today = todayIso();
    const earnedToday = r.paidTodayDate === today ? Number(r.paidToday || 0) : 0;
    const weekEarned = r.weekKey === econWeekKey(today) ? Number(r.weekPaid || 0) : 0;
    const last = r.lastPrize;
    // 抽奖盘面状态：ready=待摇 3 骰 / walking=走格中 / result=定格
    const draw = r.draw && r.draw.phase ? r.draw : null;
    const drawResult = draw && draw.phase === "result";
    const drawRunning = draw && draw.phase !== "result";
    // 刷新时若碰到"走格中却没有活动动画"（多为中途刷新/重开页面），补一次结算，避免盘面永久卡住
    if (draw && draw.phase === "walking" && !econAnimActive) {
      const stale = draw;
      econAnimActive = true;
      econAnimTimer = setTimeout(() => econFinishDraw(stale), 60);
    }
    // 两种券各自能否抽（预算到顶则禁用对应按钮、但不消耗券）
    const weekLeft = ECON.weekCap - weekEarned;
    const dayLeft = ECON.dailyCap - earnedToday;
    const dailyDrawable = daily > 0 && weekLeft > 0 && dayLeft > 0;
    const stageDrawable = stageT > 0 && weekLeft > 0;
    const capped = (daily > 0 && !dailyDrawable) || (stageT > 0 && !stageDrawable);
    // 图标环 = 今日能量（每天回填，做满 4 个节点填满）；正文彩条 = 阶段进度（攒向下一次大奖）
    const energyAngle = Math.min(360, Math.round((energy / 4) * 360));
    const stagePct = Math.round((daysInStage / ECON.stagePerDays) * 100);
    const progressGuide = renderRewardProgressGuide(state, eco, r);
    const iconGlyph = drawRunning ? "casino" : canDraw ? "cake" : "savings";
    const iconClass = drawRunning ? "" : canDraw ? "summer-reward-glyph-cake" : "summer-reward-glyph-savings";
    const headTitle = draw
      ? (draw.phase === "ready" ? "摇骰子抽奖" : drawResult ? "抽奖结果" : "走格中")
      : (canDraw ? `可抽奖 ${tickets} 次` : "今日能量");
    const collapsedTitle = canDraw ? `⚡${energy} · 可抽${tickets}` : `⚡${energy}`;
    return `
      <aside class="summer-reward-float ${collapsed ? "collapsed" : ""} ${canDraw ? "ready" : ""} ${drawRunning ? "drawing" : ""}" data-summer-reward data-reward-positioned="${hasPosition ? "true" : "false"}" style="--reward-angle:${energyAngle}deg;${pos}">
        <div class="summer-reward-head" data-summer-reward-drag role="button" tabindex="0" aria-label="${collapsed ? "展开" : "收起"}今日能量">
          <span class="summer-reward-icon">
            <span class="material-symbols-outlined ${iconClass}">${iconGlyph}</span>
          </span>
          <div>
            <strong>${collapsed ? collapsedTitle : headTitle}</strong>
            ${collapsed ? "" : `<span>今日 ${energy} 个视频任务 · ¥${earnedToday}/${ECON.dailyCap}</span>`}
          </div>
          <span class="summer-reward-arrow material-symbols-outlined">${collapsed ? "keyboard_arrow_up" : "keyboard_arrow_down"}</span>
        </div>
        ${collapsed ? "" : `
          <div class="summer-reward-body">
            ${progressGuide}
            <div class="summer-reward-track"><div class="summer-reward-fill" style="width:${stagePct}%"></div></div>
            <div class="summer-reward-stats">
              <span>大奖进度 ${daysInStage}/${ECON.stagePerDays} 达标日</span>
              <span>本周 ¥${weekEarned}/${ECON.weekCap}</span>
            </div>
            ${draw ? renderEconBoard(draw) : (last ? `
              <div class="summer-reward-result ${Number(last.drawn) >= 50 ? "big" : "coin"}">
                <span>${last.kind === "stage" ? "大奖" : "小奖"}</span>
                <strong>抽中 ¥${Number(last.drawn || 0)}</strong>
                <em>${Number(last.paid) < Number(last.drawn) ? `本周已达上限，实发 ¥${Number(last.paid || 0)}` : `已到账 ¥${Number(last.paid || 0)}`}</em>
              </div>
            ` : "")}
            ${draw ? "" : (canDraw
              ? `<div class="summer-reward-draw-row">
                  ${daily > 0 ? `<button class="summer-reward-draw daily" data-summer-action="reward-draw-daily" type="button" ${dailyDrawable ? "" : "disabled"}>
                    <span class="material-symbols-outlined">toll</span>抽小奖<small>小奖券 ${daily}</small>
                  </button>` : ""}
                  ${stageT > 0 ? `<button class="summer-reward-draw stage" data-summer-action="reward-draw-stage" type="button" ${stageDrawable ? "" : "disabled"}>
                    <span class="material-symbols-outlined">redeem</span>抽大奖<small>大奖券 ${stageT}</small>
                  </button>` : ""}
                </div>
                ${capped
                  ? `<p class="summer-reward-claim summer-reward-capnote">${weekLeft <= 0
                      ? `🎉 本周奖金已拿满 ¥${ECON.weekCap}，券先留着、周一自动可用；这周继续做题只涨勋章和达标日，不亏。`
                      : `今天日常奖金已达上限 ¥${ECON.dailyCap}，小奖券留到明天；大奖不受日限、仍能抽。`}</p>`
                  : `<p class="summer-reward-claim">3 颗骰子点数相加就是走几格，越多越刺激</p>`}`
              : `<p class="summer-reward-claim">今天完成 ${ECON.qualifyNodes} 个视频任务得 1 张小奖券；攒 ${ECON.stagePerDays} 个达标日得 1 张大奖券。</p>`)}
          </div>
        `}
      </aside>
    `;
  }

  function buildHeroSummary(state, queue, planDay, remainingDetailed, pendingRoute, dailyGate) {
    const currentDayNo = currentRouteDay(state);
    const currentDay = ROUTE_DAYS.find((day) => day.day === currentDayNo);
    if (dailyGate) {
      return {
        title: `第 ${dailyGate.day} 天收尾复盘`,
        description: "这一组已经学完，先留下今天总感受，再进入下一组。",
        stats: [
          { label: "复盘", value: "必填", note: "30 秒解锁下一组" },
        ],
      };
    }
    if (queue.length) {
      const queueDay = ROUTE_DAYS.find((day) => routeTasks(day).some((task) => task.id === queue[0]?.id)) || currentDay;
      const dayTasks = queueDay ? routeTasks(queueDay) : [];
      const completed = dayTasks.length ? dayTasks.filter((task) => taskReadyToAdvance(task, state)).length : TASKS.length - remainingDetailed;
      const total = dayTasks.length || TASKS.length;
      const nextTask = queue.find((task) => !taskReadyToAdvance(task, state)) || queue[0];
      return {
        title: queueDay ? `第 ${queueDay.day} 天：${queueDay.title}` : "先把最前面的任务清掉",
        description: nextTask ? `下一步只盯一件事：${nextTask.title}` : "这一组已经完成，下一组会自动出现。",
        stats: [
          { label: "今日完成", value: `${completed} 项`, note: `共 ${total} 项` },
        ],
      };
    }
    if (planDay) {
      const videos = routeVideos(planDay);
      const tasks = routeVideoTasks(planDay);
      const completed = routeDayCompleted(planDay, state);
      const pending = Number(pendingRoute?.day || 0) === planDay.day;
      const readyCount = tasks.filter((task) => taskReadyToAdvance(task, state)).length;
      return {
        title: `第 ${planDay.day} 天：${planDay.title}`,
        description: planDay.subtitle,
        stats: [
          { label: "今日资源", value: videos.length ? `${videos.length} 个视频` : "1 张学习单", note: videos.length ? "按顺序看" : "按资料执行" },
          { label: "本节收尾", value: completed ? "已完成" : `${readyCount}/${tasks.length}`, note: pending ? "有记录待归档" : "写完变绿" },
        ],
      };
    }
    return {
      title: `${currentSubjectLabel()}路线已完成`,
      description: "可以导出学习档案，回看最卡的 3 个点，再决定下一轮。",
      stats: [
        { label: "路线", value: "已跑完", note: "准备复盘" },
        { label: "下一步", value: "导出档案", note: "看卡点" },
      ],
    };
  }

  // 首页一行入口：显示 28 天进度，点开进全屏总览
  function renderRouteEntry() {
    if (!SUBJECT_HAS_PLAN[activeSubject]) return "";
    applySubjectContent();
    const stat = routeStats(readState());
    return `
      <button class="card home-status-drawer home-status-link" data-summer-action="open-route-overview" type="button">
        <span class="material-symbols-outlined">calendar_month</span>
        <span class="home-status-digest">${stat.total} 天总路线 · ${stat.completed}/${stat.total}</span>
        <span class="home-status-arrow material-symbols-outlined">chevron_right</span>
      </button>
    `;
  }

  function renderRouteOverviewOverlay() {
    return `
      <div class="summer-route-overlay" data-summer-route-overlay>
        <div class="summer-route-overlay-inner">
          <button class="summer-route-overlay-close" data-summer-action="close-route-overview" type="button" aria-label="关闭总览">
            <span class="material-symbols-outlined">close</span>
          </button>
          ${renderRouteOverviewCard()}
        </div>
      </div>
    `;
  }

  function renderRouteOverviewCard() {
    const state = readState();
    const currentDayNo = currentRouteDay(state);
    const selectedDay = selectedRouteDay(state, currentDayNo);
    const stat = routeStats(state);
    const taskStat = progress(state);
    const routeKicker = activeSubject === "physics" ? "暑假物理" : currentSubjectLabel();
    const routeDesc = activeSubject === "physics"
      ? "前 7 节是完整视频任务；第 3-28 天在学习单里列主线视频、例题截图、本节收尾和统一导入入口。"
      : "按天推进：每天看主线视频、截例题、做同类测验、写本节收尾，绿了再看下一天。";
    return `
      <section class="card summer-route-card">
        <div class="summer-route-card-head">
          <div>
            <p class="summer-kicker">${escapeHtml(routeKicker)} ${stat.total} 天路线</p>
            <h3>总计划</h3>
            <p>${escapeHtml(routeDesc)}</p>
          </div>
          <div class="summer-route-card-stats">
            <span>已完成 ${stat.completed}/${stat.total} 天</span>
            ${taskStat.total > 0 ? `<span>详细视频 ${taskStat.completed}/${taskStat.total} 节</span>` : ""}
          </div>
        </div>
        <div class="summer-progress-track"><div class="summer-progress-fill" style="width:${stat.pct}%"></div></div>
        ${renderRouteDayDetail(selectedDay, state, currentDayNo)}
        ${renderRouteOverview(state, currentDayNo, selectedDay.day)}
      </section>
    `;
  }

  function renderRollingQueue(tasks, state, remainingDetailed) {
    const directPending = findTask(state.pendingTaskId);
    const pendingTask = directPending && !taskIsDeferred(directPending, state) ? directPending : null;
    const nextTask = pendingTask || tasks.find((task) => !taskReadyToAdvance(task, state));
    const nextInfo = nextTask ? taskState(state, nextTask.id) : {};
    const nextText = nextTask
      ? nextInfo.completed && !nextInfo.reflectionDone
        ? `下一步：写完「${escapeHtml(nextTask.title)}」的本节收尾，写完才顺延。`
        : `下一步：${escapeHtml(nextTask.title)}。看视频、练题、写收尾都在这张卡里完成。`
      : "这组已经完成，下一组会自动出现。";
    return `
      <div class="summer-today-panel">
        <div class="summer-today-summary">
          <p>
            <span class="material-symbols-outlined">visibility</span>
            <strong>${pendingTask ? "当前有关联导入" : "当前只看这几条"}</strong>
            <span>还剩 ${remainingDetailed} 节详细任务</span>
            <span>${nextText}</span>
          </p>
        </div>
        ${renderDayGroup("滚动任务队列", "按未完成优先排序；不用手动挪计划。", tasks, state)}
      </div>
    `;
  }

  function renderDailyReflectionOverlay(day, state) {
    const dayState = routeDayState(state, day.day);
    const draft = dayState.dailyReflectionDraft || dayState.dailyReflection || {};
    return `
      <div class="summer-reflection-overlay" role="dialog" aria-modal="true" aria-labelledby="summer-daily-reflection-title">
        <form class="summer-reflection-dialog daily" data-reflection-form="daily" data-route-day="${day.day}">
          <div class="summer-reflection-head">
            <span class="material-symbols-outlined">task_alt</span>
            <div>
              <p class="summer-kicker">第 ${day.day} 天 · ${escapeHtml(day.title)}</p>
              <h3 id="summer-daily-reflection-title">今日总复盘</h3>
              <p>这一组已经完成。想的话留一句今天的感受；不想写，点“先跳过”也能解锁下一组。</p>
            </div>
          </div>
          ${renderMoodPicker(draft.mood)}
          <label class="summer-reflection-field">
            <span>今天最有用的一点</span>
            <textarea name="best" rows="2" placeholder="例如：知道了追及题先画运动过程。">${escapeHtml(draft.best || "")}</textarea>
          </label>
          <label class="summer-reflection-field">
            <span>今天最卡的一点</span>
            <textarea name="hardest" rows="2" placeholder="例如：看到图像还是不知道读哪个量。">${escapeHtml(draft.hardest || "")}</textarea>
          </label>
          <p class="summer-reflection-message" data-reflection-message></p>
          <div class="summer-reflection-actions">
            <button class="btn btn-primary summer-reflection-submit" data-summer-action="save-day-reflection" data-route-day="${day.day}" type="button">
              <span class="material-symbols-outlined">arrow_forward</span>保存复盘，解锁下一组
            </button>
            <button class="btn btn-soft btn-sm summer-reflection-skip" data-summer-action="skip-day-reflection" data-route-day="${day.day}" type="button">先跳过</button>
          </div>
        </form>
      </div>
    `;
  }

  function renderUnderstandingPicker(selected) {
    const selectedValue = normalizeUnderstanding(selected);
    const options = [
      { value: "independent", label: "会了，能独立做同类题" },
      { value: "with-example", label: "看例题能做" },
      { value: "understood", label: "听懂但不会做" },
      { value: "lost", label: "还没听懂" },
    ];
    return `
      <fieldset class="summer-reflection-choice task">
        <legend>现在做到哪一步</legend>
        <div>
          ${options.map((item) => `
            <label>
              <input type="radio" name="understanding" value="${item.value}" ${selectedValue === item.value ? "checked" : ""}>
              <span>${item.label}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>
    `;
  }

  function normalizeUnderstanding(value) {
    const map = {
      clear: "with-example",
      partial: "understood",
      lost: "lost",
      independent: "independent",
      "with-example": "with-example",
      understood: "understood",
    };
    return map[value] || "";
  }

  function understandingLabel(value) {
    const labels = {
      independent: "能独立做同类题",
      "with-example": "看例题能做",
      understood: "听懂但不会做",
      lost: "还没听懂",
      clear: "看例题能做",
      partial: "听懂但不会做",
    };
    return labels[value] || "已记录";
  }

  function renderStuckTagPicker(selected = []) {
    const selectedSet = new Set(Array.isArray(selected) ? selected : []);
    const tags = ["读题", "图像", "公式", "受力", "概念", "计算", "单位", "都顺"];
    return `
      <fieldset class="summer-stuck-tags">
        <legend>哪里最需要回看（可选）</legend>
        <div>
          ${tags.map((tag) => `
            <label>
              <input type="checkbox" name="stuckTags" value="${escapeHtml(tag)}" ${selectedSet.has(tag) ? "checked" : ""}>
              <span>${escapeHtml(tag)}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>
    `;
  }

  function renderMoodPicker(selected) {
    const options = [
      { value: "smooth", label: "很顺" },
      { value: "ok", label: "正常" },
      { value: "tired", label: "有点累" },
      { value: "stuck", label: "卡住了" },
    ];
    return `
      <fieldset class="summer-reflection-choice">
        <legend>今天整体状态</legend>
        <div>
          ${options.map((item) => `
            <label>
              <input type="radio" name="mood" value="${item.value}" ${selected === item.value ? "checked" : ""}>
              <span>${item.label}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>
    `;
  }

  function renderRouteLearningSheet(day, state, options = {}) {
    if (!day) {
      return `
        <div class="summer-route-placeholder summer-route-sheet">
          <span class="material-symbols-outlined">flag</span>
          <div>
            <strong>${escapeHtml(currentSubjectLabel())}主线已跑完</strong>
            <p>现在最重要的是导出学习档案，看哪些卡点反复出现，再定下一轮 7 天小计划。</p>
          </div>
        </div>
      `;
    }
    const routeInfo = routeDayState(state, day.day);
    const isPending = Number(options.pendingRoute?.day || 0) === day.day;
    const imported = Boolean(routeInfo.completed);
    const completed = routeDayCompleted(day, state);
    const waitingReview = (imported || routeDayLearningReady(day, state)) && !completed;
    const resources = routeResources(day);
    const focus = Array.isArray(day.focus) ? day.focus : [];
    const videos = routeVideos(day);
    const intro = day.mission || `${day.title}：按下方主线视频从上到下看。每个视频都按“例题截图 → 同类测验 → 本节收尾”走完，节点变绿后再看下一个。`;
    return `
      <div class="summer-route-placeholder summer-route-sheet ${completed ? "done" : waitingReview || isPending ? "pending" : ""}">
        <span class="material-symbols-outlined">${completed ? "check_circle" : waitingReview ? "rate_review" : isPending ? "download_done" : "route"}</span>
        <div>
          <strong>${completed ? "这张学习单已完成" : waitingReview ? "已导入，先写收尾复盘" : isPending ? "等你导入 MOCHI-RECORD" : "后续学习单已经可以执行"}</strong>
          <p>${escapeHtml(intro)}</p>
          ${focus.length ? `<div class="summer-route-focus">${focus.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
          ${renderRouteVideos(day, state, videos)}
          <div class="summer-sheet-steps">
            <span>1 打开下方视频</span>
            <span>2 每个视频收集例题</span>
            <span>3 复制同类测验包做题</span>
            <span>4 写本节收尾变绿</span>
          </div>
          ${renderSupplementResources(resources)}
          ${routeInfo.lastImportedRecord ? `<p class="summer-import-done">已完成：${escapeHtml(routeInfo.lastImportedRecord.nodeLabel || "物理")} · ${"★".repeat(Number(routeInfo.lastImportedRecord.stars || 0))}</p>` : ""}
        </div>
      </div>
    `;
  }

  function renderSupplementResources(resources = []) {
    if (!resources.length) return "";
    return `
      <details class="summer-supplement-resources">
        <summary>
          <span class="material-symbols-outlined">travel_explore</span>
          <strong>补充资料</strong>
          <small>看不懂概念时再打开，不是今日必做</small>
        </summary>
        <div>
          ${resources.map((link) => `
            <a class="btn btn-soft btn-sm" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
              <span class="material-symbols-outlined">open_in_new</span>${escapeHtml(link.label)}
            </a>
          `).join("")}
        </div>
      </details>
    `;
  }

  function renderUnifiedImportHint(day, state) {
    const pendingTask = findSummerTask(state.pendingRouteTaskId || "");
    const currentTask = pendingTask || routePrimaryTask(day, state);
    const isThisDay = Number(state.pendingRouteDay || 0) === day.day;
    const label = isThisDay && currentTask
      ? `当前关联：${currentTask.title}`
      : currentTask
        ? `导入前会优先关联：${currentTask.title}`
        : "导入前先在上方选择一个视频生成测验包";
    return `
      <div class="summer-unified-import-hint">
        <span class="material-symbols-outlined">move_to_inbox</span>
        <div>
          <strong>统一导入记录</strong>
          <p>${escapeHtml(label)}。做完 AI 练题后，把 MOCHI-RECORD 粘到页面右侧/首页导入框；本节收尾仍在上方进度节点里写。</p>
        </div>
      </div>
    `;
  }

  function taskHasLinkedRecord(info) {
    return Array.isArray(info?.linkedLogIds) && info.linkedLogIds.length > 0;
  }

  function taskNeedsImportDock(task, state) {
    if (taskIsDeferred(task, state)) return false;
    const info = taskState(state, task.id);
    const pending = state.pendingTaskId === task.id || state.pendingRouteTaskId === task.id;
    const copiedForAi = Boolean(info.exampleQuizPromptCopiedAt || info.promptCopiedAt);
    return pending || (copiedForAi && !taskHasLinkedRecord(info));
  }

  function pendingImportTask(state) {
    const direct = findSummerTask(state.pendingTaskId || state.pendingRouteTaskId || "");
    if (direct && !taskIsDeferred(direct, state)) return direct;
    return TASKS.concat(ROUTE_DAYS.flatMap((day) => routeVideoTasks(day))).find((task) => taskNeedsImportDock(task, state)) || null;
  }

  function renderTaskImportDock(task, state, options = {}) {
    if (!taskNeedsImportDock(task, state)) return "";
    const info = taskState(state, task.id);
    const isPending = state.pendingTaskId === task.id || state.pendingRouteTaskId === task.id;
    const title = options.compact ? "粘回记录" : "Gemini 回来后粘贴学习记录";
    const helper = taskHasLinkedRecord(info)
      ? "这节已经归档过记录；Gemini 又给了新记录也能继续粘。"
      : "把 Gemini 给你的记录整段粘进来，会自动归档到这节。";
    return `
      <section class="summer-import-dock ${isPending ? "pending" : ""}" data-summer-import-task-id="${escapeHtml(task.id)}">
        <details ${isPending ? "open" : ""}>
          <summary>
            <span class="material-symbols-outlined">move_to_inbox</span>
            <strong>${escapeHtml(title)}</strong>
            <small>${escapeHtml(task.title)}</small>
          </summary>
          <div class="summer-import-dock-body">
            <p>${escapeHtml(helper)}</p>
            <textarea data-summer-record-paste data-task-id="${escapeHtml(task.id)}" rows="3" placeholder="把 Gemini 给你的记录整段粘进来，会自动导入"></textarea>
            <button class="btn btn-primary btn-sm" data-summer-action="parse-task-record" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">download_done</span>导入到这节课
            </button>
            <div class="summer-import-dock-result" data-summer-record-result hidden></div>
          </div>
        </details>
      </section>
    `;
  }

  // 紧凑胶囊而不是宽卡片：之前的宽版是 position:fixed 常驻右下角，
  // 会一直挡住右栏折叠信息区；改成小图标+短字，点了直接跳到导入位置。
  function renderPendingImportFloat(state) {
    const task = pendingImportTask(state);
    if (!task) return "";
    return `
      <button class="summer-pending-import-float" data-summer-action="open-pending-import" data-task-id="${escapeHtml(task.id)}" type="button" aria-label="等待导入：${escapeHtml(task.title)}">
        <span class="material-symbols-outlined">move_to_inbox</span>
        <span>等待导入</span>
      </button>
    `;
  }

  function renderRouteVideos(day, state, videos = routeVideos(day)) {
    if (!videos.length) {
      const task = routeSheetTask(day);
      const step = routeVideoStepState(day, task, state);
      return `
        <div class="summer-route-videos">
          <div class="summer-route-step ${step.tone}">
            <div class="summer-route-step-marker" aria-label="${escapeHtml(step.label)}">
              <span class="material-symbols-outlined">${escapeHtml(step.icon)}</span>
            </div>
            <div class="summer-route-step-body">
              <div class="summer-route-mission">
                <span class="material-symbols-outlined">assignment</span>
                <div>
                  <strong>今天按资料/错题执行</strong>
                  <p>${escapeHtml(step.label)} · 不用硬看新视频。打开下方资源或学校资料，选 1 个最贴近的小专题，收集例题截图后生成同类测验。</p>
                </div>
              </div>
              ${renderExampleCollector(task, state, { compact: true })}
              ${renderTaskImportDock(task, state, { compact: true })}
              ${renderTaskReflectionPanel(task, state)}
            </div>
          </div>
        </div>
      `;
    }
    return `
      <div class="summer-route-videos">
        <div class="summer-route-videos-title">
          <span class="material-symbols-outlined">video_library</span>
          <strong>主线视频</strong>
          <small>${videos.length} 个资源，按顺序看；太长就先看前半段和例题段。</small>
        </div>
        ${videos.map((video, index) => {
          const task = routeVideoTask(day, video);
          const info = taskState(state, task.id);
          const rescueActive = taskSupport(info)?.status === "active";
          const step = routeVideoStepState(day, task, state);
          const isPending = state.pendingRouteTaskId === task.id;
          const needsReflection = Boolean(info.completed && info.reflectionRequired && !info.reflectionDone);
          const firstOpenIndex = videos.findIndex((item) => {
            const candidate = routeVideoTask(day, item);
            return !taskReadyToAdvance(candidate, state) && !taskIsDeferred(candidate, state);
          });
          const isFutureByOrder = step.tone !== "deferred" && firstOpenIndex >= 0 && index > firstOpenIndex;
          const isNext = !step.tone && index === firstOpenIndex;
          return `
            <div class="summer-route-step ${step.tone} ${isNext ? "next" : ""} ${isFutureByOrder ? "future-order" : ""} ${rescueActive ? "rescue-paused" : ""}">
              <div class="summer-route-step-marker" aria-label="${escapeHtml(step.label)}">
                <span class="material-symbols-outlined">${escapeHtml(step.icon)}</span>
              </div>
              <div class="summer-route-step-body">
                <article class="summer-route-video-card" data-summer-task-id="${escapeHtml(task.id)}">
                  <div class="summer-route-video-main">
                    <span class="summer-route-video-order">${escapeHtml(String(index + 1))}</span>
                    <div>
                      <strong>${escapeHtml(video.title)}</strong>
                      <p>${escapeHtml(video.source || "B站资源")} · ${escapeHtml(video.duration || "按需观看")} · ${escapeHtml(video.part || video.title)}</p>
                      <small>${escapeHtml(step.label)} · ${escapeHtml(video.require || "截 1 张代表例题，后面用来生成同类测验。")}</small>
                    </div>
                  </div>
                  ${renderRouteVideoActions(task, state, rescueActive)}
                </article>
                ${renderTaskRescueSlot(task, info)}
                ${renderTaskSupportDrawer(task, state, {
                  selectedStep: step.tone === "active" || isPending || needsReflection ? 1 : 0,
                  isPending,
                  needsReflection,
                  imported: Boolean(info.completed),
                  compact: true,
                })}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderRouteVideoActions(task, state, rescueActive = false) {
    const info = taskState(state, task.id);
    const examples = taskExamples(state, task.id);
    const completed = taskReadyToAdvance(task, state);
    const needsReflection = Boolean(info.completed && !info.reflectionDone);
    let main = { action: "start-task", icon: "play_arrow", label: "开始这节课", tone: "primary", disabled: false };
    if (completed) {
      main = { action: "open-task-support", icon: "visibility", label: "查看回顾", tone: "soft", disabled: false };
    } else if (needsReflection || info.exampleQuizPromptCopiedAt || info.promptCopiedAt) {
      main = { action: "open-reflection", icon: "edit_note", label: "写本节收尾", tone: "primary", disabled: false };
    } else if (examples.length) {
      main = { action: "copy-example-quiz", icon: "auto_awesome", label: "复制测验包", tone: "primary", disabled: false };
    } else if (info.lastFocusedAt || info.watched || info.practicingAt) {
      main = { action: "open-task-support", icon: "add_photo_alternate", label: "粘贴例题截图", tone: "primary", disabled: false };
    }
    return `
      <div class="summer-route-video-actions" ${rescueActive ? `aria-label="正常任务已暂停"` : ""}>
        <button class="btn btn-${main.tone} btn-sm summer-video-next-btn" data-rescue-blocked-action data-summer-action="${escapeHtml(main.action)}" data-task-id="${escapeHtml(task.id)}" type="button" ${main.disabled || rescueActive ? "disabled" : ""}>
          <span class="material-symbols-outlined">${escapeHtml(main.icon)}</span>${escapeHtml(main.label)}
        </button>
        ${completed ? "" : `<button class="summer-rescue-entry compact" data-summer-action="support-open" data-task-id="${escapeHtml(task.id)}" type="button">
          <span class="material-symbols-outlined">help</span>听不懂
        </button>`}
        ${completed ? "" : `<details class="summer-more-actions compact" data-rescue-blocked-action>
          <summary>更多</summary>
          <div>
            <a class="btn btn-soft btn-sm" href="${escapeHtml(task.url)}" target="_blank" rel="noreferrer">
              <span class="material-symbols-outlined">open_in_new</span>打开视频
            </a>
            <button class="btn btn-soft btn-sm" data-summer-action="focus" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">timer</span>开始专注
            </button>
            <button class="btn btn-soft btn-sm" data-summer-action="watched" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">visibility</span>标记看完
            </button>
          </div>
        </details>`}
      </div>
    `;
  }

  function routeVideoStepState(day, task, state) {
    const info = taskState(state, task.id);
    const examples = taskExamples(state, task.id);
    if (taskReadyToAdvance(task, state)) {
      return { tone: "done", icon: "check_circle", label: "已完成" };
    }
    if (taskIsDeferred(task, state)) return { tone: "deferred", icon: "bookmark", label: "待补基础" };
    if (info.completed && !info.reflectionDone) return { tone: "active", icon: "rate_review", label: "待收尾" };
    if (info.exampleQuizPromptCopiedAt) {
      return { tone: "active", icon: "edit_note", label: "写本节收尾" };
    }
    if (examples.length) {
      return { tone: "active", icon: "radio_button_checked", label: `已收 ${examples.length} 张例题` };
    }
    if (info.lastFocusedAt || info.practicingAt || info.watched) {
      return { tone: "active", icon: "radio_button_checked", label: "进行中" };
    }
    return { tone: "", icon: "radio_button_unchecked", label: "未开始" };
  }

  function renderTodayRoute(day, state) {
    const tasks = routeTasks(day);
    if (!tasks.length) return renderRoutePlaceholder(day);
    const completed = tasks.filter((task) => taskReadyToAdvance(task, state)).length;
    const nextTask = tasks.find((task) => !taskReadyToAdvance(task, state) && !taskIsDeferred(task, state));
    return `
      <div class="summer-today-panel">
        <div class="summer-today-summary">
          <div>
            <strong>今天只做这一组</strong>
            <span>${completed}/${tasks.length} 已完成</span>
          </div>
          <p>${nextTask ? `下一步：${escapeHtml(nextTask.title)}` : "今天这一组已经完成，可以去导出今日报告复盘。"}</p>
        </div>
        ${renderDayGroup(`第 ${day.day} 天任务`, day.subtitle, tasks, state)}
      </div>
    `;
  }

  function renderRoutePlaceholder(day) {
    const focus = Array.isArray(day.focus) ? day.focus : [];
    return `
      <div class="summer-route-placeholder">
        <span class="material-symbols-outlined">event_note</span>
        <div>
          <strong>这一天按学习单执行</strong>
          <p>打开资源找当天关键词，看 1 个最贴近的视频或片段，截 1-3 张例题，练完同类题后写本节收尾。</p>
          ${focus.length ? `<div class="summer-route-focus">${focus.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
        </div>
      </div>
    `;
  }

  function renderRouteOverview(state, currentDayNo, selectedDayNo) {
    const weeks = [1, 2, 3, 4].map((week) => ROUTE_DAYS.filter((day) => day.week === week));
    return `
      <div class="summer-route-overview">
        <div class="summer-route-weeks">
          ${weeks.map((days, index) => `
            <section class="summer-route-week">
              <h4>第 ${index + 1} 周</h4>
              <div class="summer-route-grid">
                ${days.map((day) => renderRouteDay(day, state, currentDayNo, selectedDayNo)).join("")}
              </div>
            </section>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderRouteDay(day, state, currentDayNo, selectedDayNo) {
    const tasks = routeTasks(day);
    const completed = routeDayCompleted(day, state);
    const started = routeDayStarted(day, state);
    const waitingReview = !completed && routeDayLearningReady(day, state);
    const isCurrent = day.day === currentDayNo;
    const isSelected = day.day === selectedDayNo;
    const status = completed ? "done" : isCurrent || waitingReview ? "current" : tasks.length ? "ready" : "sheet";
    const label = completed ? "已完成" : waitingReview ? "待复盘" : isCurrent ? "进行中" : tasks.length ? `${tasks.length} 节课` : "学习单";
    return `
      <button class="summer-route-day ${status} ${isSelected ? "selected" : ""}" data-summer-action="route-day" data-route-day="${day.day}" type="button" aria-pressed="${isSelected ? "true" : "false"}">
        <div class="summer-route-day-head">
          <span class="summer-route-day-num">${day.day}</span>
          <span class="summer-route-status">${started && !completed && !isCurrent ? "已开始" : label}</span>
        </div>
        <strong>${escapeHtml(day.title)}</strong>
        <p>${escapeHtml(day.subtitle)}</p>
      </button>
    `;
  }

  function renderRouteDayDetail(day, state, currentDayNo) {
    const tasks = routeTasks(day);
    const completed = tasks.filter((task) => taskReadyToAdvance(task, state)).length;
    const isCurrent = day.day === currentDayNo;
    const isActive = Number(state.activeRouteDay || 0) === day.day && !routeDayCompleted(day, state);
    const focus = Array.isArray(day.focus) ? day.focus : [];
    const dayState = routeDayState(state, day.day);
    const routeLabel = routeDayCompleted(day, state) ? "已完成" : routeDayLearningReady(day, state) ? "待复盘" : dayState.completed ? "已导入" : "学习单";
    return `
      <section class="summer-route-detail">
        <div class="summer-route-detail-head">
          <div>
            <span class="summer-route-day-pill">${isCurrent ? "今天" : `第 ${day.day} 天`}</span>
            <h4>${escapeHtml(day.title)}</h4>
            <p>${escapeHtml(day.subtitle)}</p>
          </div>
          <div class="summer-route-detail-actions">
            ${tasks.length ? `<strong>${completed}/${tasks.length} 完成</strong>` : `<strong>${routeLabel}</strong>`}
            ${routeDayCompleted(day, state) ? "" : `
              <button class="btn ${isActive ? "btn-soft" : "btn-primary"} btn-sm" data-summer-action="route-activate" data-route-day="${day.day}" type="button">
                <span class="material-symbols-outlined">${isActive ? "done" : "today"}</span>${isActive ? "已设为今日" : "设为今日任务"}
              </button>
            `}
          </div>
        </div>
        ${tasks.length ? `
          <div class="summer-route-detail-tasks">
            ${tasks.map((task) => renderRouteDetailTask(task, state)).join("")}
          </div>
        ` : `
          ${renderRoutePreview(day, state)}
        `}
        ${renderDayReflectionReview(day, state)}
      </section>
    `;
  }

  function renderRoutePreview(day, state) {
    const videos = routeVideos(day);
    const completed = routeDayCompleted(day, state);
    const routeStarted = routeDayStarted(day, state);
    const items = videos.length
      ? videos.map((video) => {
        const task = routeVideoTask(day, video);
        const info = taskState(state, task.id);
        const examples = taskExamples(state, task.id);
        const ready = taskReadyToAdvance(task, state);
        const deferred = taskIsDeferred(task, state);
        const needsReflection = info.completed && !info.reflectionDone;
        const status = ready ? "已完成" : deferred ? "待补基础" : needsReflection ? "待收尾" : info.exampleQuizPromptCopiedAt ? "待写收尾" : examples.length ? `已收 ${examples.length} 图` : info.lastFocusedAt ? "已开始" : "未开始";
        const tone = ready ? "done" : deferred ? "deferred" : needsReflection || info.exampleQuizPromptCopiedAt || examples.length || info.lastFocusedAt ? "active" : "";
        return { task, title: video.title, meta: `${video.source || "B站资源"} · ${video.duration || "按需观看"}`, note: video.require || video.part || "", status, tone };
      })
      : [{
        task: routeSheetTask(day),
        title: day.title,
        meta: "当天学习单 · 按需执行",
        note: day.mission || "按资源/资料选择最贴近的小专题，收集例题并写本节收尾。",
        status: completed ? "已完成" : routeDayLearningReady(day, state) ? "待复盘" : routeStarted ? "已开始" : "未开始",
        tone: completed ? "done" : routeDayLearningReady(day, state) || routeStarted ? "active" : "",
      }];
    return `
      <div class="summer-route-preview-list">
        ${items.map((item) => renderRoutePreviewItem(item, state)).join("")}
      </div>
    `;
  }

  function renderRoutePreviewItem(item, state) {
    const icon = item.tone === "done" ? "check_circle" : item.tone === "deferred" ? "bookmark" : item.tone === "active" ? "radio_button_checked" : "radio_button_unchecked";
    return `
      <article class="summer-route-preview-item ${item.tone}">
        <div class="summer-route-preview-main">
          <span class="material-symbols-outlined">${icon}</span>
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.meta)}</p>
            ${item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}
          </div>
          <em>${escapeHtml(item.status)}</em>
        </div>
        ${renderRouteReviewPanel(item.task, state)}
      </article>
    `;
  }

  function renderRouteDetailTask(task, state) {
    const info = taskState(state, task.id);
    const deferred = taskIsDeferred(task, state);
    const needsReflection = info.completed && info.reflectionRequired && !info.reflectionDone;
    const status = deferred ? "待补基础" : needsReflection ? "待收尾" : info.completed ? "已完成" : info.practicingAt ? "做题中" : info.watched ? "已看视频" : "未开始";
    const tone = deferred ? "deferred" : needsReflection ? "active" : info.completed ? "done" : info.watched || info.practicingAt ? "active" : "";
    const icon = deferred ? "bookmark" : needsReflection ? "rate_review" : info.completed ? "check_circle" : info.watched ? "radio_button_checked" : "play_circle";
    return `
      <div class="summer-route-detail-task ${tone}">
        <span class="material-symbols-outlined">${icon}</span>
        <div>
          <strong>${escapeHtml(task.title)}</strong>
          <p>${escapeHtml(task.source)} · ${escapeHtml(task.duration)} · ${getPracticeItems(task).length || 0} 道小题</p>
        </div>
        <em>${status}</em>
        ${renderRouteReviewPanel(task, state)}
      </div>
    `;
  }

  function renderRouteReviewPanel(task, state) {
    if (!task) return "";
    const examples = taskExamples(state, task.id);
    const info = taskState(state, task.id);
    const note = String(info.studyNote || "");
    const reflection = info.reflection || null;
    const summaryBits = [
      examples.length ? `${examples.length} 张例题` : "暂无例题",
      reflection ? "有收尾" : "无收尾",
      note ? "已记笔记" : "可写笔记",
    ];
    return `
      <details class="summer-route-review">
        <summary>
          <span>查看例题和笔记</span>
          <small>${escapeHtml(summaryBits.join(" · "))}</small>
        </summary>
        <div class="summer-route-review-body">
          <label class="summer-route-note">
            <span>学习备注 / 卡住点</span>
            <textarea data-example-note data-task-id="${escapeHtml(task.id)}" rows="2" placeholder="例如：追及题的临界条件不会找，后面要重看。">${escapeHtml(note)}</textarea>
            <small>离开输入框自动保存，之后复习可以从总计划回看。</small>
          </label>
          ${reflection ? renderSavedTaskReflection(reflection) : ""}
          ${examples.length ? `
            <div class="summer-route-review-examples">
              ${examples.map((item) => renderExampleReviewItem(task, item)).join("")}
            </div>
          ` : `
            <p class="summer-route-review-empty">还没有给这节课保存例题截图。学习时粘贴截图后，这里会自动出现。</p>
          `}
        </div>
      </details>
    `;
  }

  function renderSavedTaskReflection(reflection) {
    const cue = reflection.reviewCue || reflection.takeaway || "";
    const tags = Array.isArray(reflection.stuckTags) ? reflection.stuckTags : [];
    return `
      <div class="summer-saved-reflection">
        <strong>学习收尾 · ${escapeHtml(understandingLabel(reflection.understanding))}</strong>
        ${cue ? `<p><span>下次提醒</span>${escapeHtml(cue)}</p>` : ""}
        ${tags.length ? `<p><span>卡点标签</span>${escapeHtml(tags.join(" / "))}</p>` : ""}
        ${reflection.stuckPoint ? `<p><span>补充</span>${escapeHtml(reflection.stuckPoint)}</p>` : ""}
        ${reflection.takeaway && reflection.takeaway !== cue ? `<p><span>旧收获</span>${escapeHtml(reflection.takeaway)}</p>` : ""}
      </div>
    `;
  }

  function renderDayReflectionReview(day, state) {
    const reflection = routeDayState(state, day.day).dailyReflection;
    if (!reflection) return "";
    const labels = { smooth: "很顺", ok: "正常", tired: "有点累", stuck: "卡住了" };
    return `
      <div class="summer-day-reflection-review">
        <div>
          <strong>今日总复盘 · ${escapeHtml(labels[reflection.mood] || "已记录")}</strong>
          <span>${reflection.updatedAt || reflection.createdAt ? escapeHtml(formatExampleDate(reflection.updatedAt || reflection.createdAt)) : ""}</span>
        </div>
        ${reflection.best ? `<p><span>最有用</span>${escapeHtml(reflection.best)}</p>` : ""}
        ${reflection.hardest ? `<p><span>最卡</span>${escapeHtml(reflection.hardest)}</p>` : ""}
      </div>
    `;
  }

  function renderExampleReviewItem(task, item) {
    const status = item.status || "半会";
    return `
      <article class="summer-route-review-example">
        <div class="summer-example-thumb">
          <img data-example-image-id="${escapeHtml(item.id)}" alt="${escapeHtml(task.title)} 例题截图" hidden>
          <span class="material-symbols-outlined">image</span>
        </div>
        <div>
          <strong>${escapeHtml(status)} · ${formatExampleDate(item.createdAt)}</strong>
          <p>${escapeHtml(item.note || "视频例题截图")}</p>
          <button class="btn btn-soft btn-sm" data-summer-action="copy-example-image" data-task-id="${escapeHtml(task.id)}" data-example-id="${escapeHtml(item.id)}" type="button">
            <span class="material-symbols-outlined">content_copy</span>复制图片
          </button>
        </div>
      </article>
    `;
  }

  function renderDayGroup(title, subtitle, tasks, state) {
    if (!tasks.length) return "";
    const firstOpenIndex = tasks.findIndex((task) => !taskReadyToAdvance(task, state) && !taskIsDeferred(task, state));
    return `
      <div class="summer-day-group">
        <div class="summer-day-title">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(subtitle)}</span>
        </div>
        <div class="summer-task-list">
          ${tasks.map((task, index) => renderTask(task, state, {
            queueTone: firstOpenIndex >= 0 && index === firstOpenIndex ? "current" : firstOpenIndex >= 0 && index > firstOpenIndex ? "future" : "",
          })).join("")}
        </div>
      </div>
    `;
  }

  function renderTask(task, state, options = {}) {
    const s = taskState(state, task.id);
    const isPending = state.pendingTaskId === task.id;
    const completed = taskReadyToAdvance(task, state);
    const imported = Boolean(s.completed);
    const watched = Boolean(s.watched);
    const needsReflection = Boolean(imported && s.reflectionRequired && !s.reflectionDone);
    const rescueActive = taskSupport(s)?.status === "active";
    const flow = getTaskFlow(task, s, isPending);
    const selectedStep = selectedTaskStep(s, flow);
    return `
      <article class="summer-task ${completed ? "completed" : ""} ${isPending ? "pending-import" : ""} ${needsReflection ? "needs-reflection" : ""} ${rescueActive ? "rescue-paused" : ""} ${options.queueTone === "current" ? "queue-current" : ""} ${options.queueTone === "future" ? "queue-future" : ""}" data-summer-task-id="${escapeHtml(task.id)}">
        <div class="summer-task-main">
          <div class="summer-task-title-row">
            <span class="summer-task-check material-symbols-outlined">${needsReflection ? "rate_review" : completed ? "check_circle" : watched ? "radio_button_checked" : "radio_button_unchecked"}</span>
            <div>
              <h4>${escapeHtml(task.title)}</h4>
              <p>${escapeHtml(task.source)} · ${escapeHtml(task.duration)} · ${escapeHtml(task.videoTitle)}</p>
            </div>
          </div>
          ${renderTaskStepper(task, flow, selectedStep, rescueActive)}
          ${renderTaskRescueSlot(task, s)}
          <div class="summer-normal-task-content" ${rescueActive ? `aria-label="正常任务已暂停"` : ""}>
            ${rescueActive ? `<p class="summer-task-paused-label"><span class="material-symbols-outlined">pause_circle</span>正常任务已暂停</p>` : ""}
            ${renderTaskStepPanel(task, selectedStep, flow, s)}
            ${renderTaskSupportDrawer(task, state, { selectedStep, isPending, needsReflection, imported })}
          </div>
        </div>
        ${renderTaskActions(task, flow, rescueActive)}
      </article>
    `;
  }

  function renderTaskSupportDrawer(task, state, options = {}) {
    const info = taskState(state, task.id);
    const examples = taskExamples(state, task.id);
    const hasRecord = Boolean(info.lastImportedRecord);
    const completed = taskReadyToAdvance(task, state);
    const open = !completed && (options.isPending || options.needsReflection || options.selectedStep >= 1 || hasRecord);
    const status = completed
      ? "已完成，可回看"
      : options.needsReflection
        ? "待写本节收尾"
        : options.isPending
          ? "等 Gemini 记录"
          : hasRecord
            ? "已有学习记录"
            : examples.length
              ? `${examples.length} 张例题`
              : "截图 / 导入 / 收尾";
    return `
      <details class="summer-task-support" ${open ? "open" : ""} data-task-support="${escapeHtml(task.id)}">
        <summary>
          <span class="material-symbols-outlined">inventory_2</span>
          <strong>学习材料与记录</strong>
          <small>${escapeHtml(status)}</small>
        </summary>
        <div class="summer-task-support-body">
          ${completed
            ? renderCompletedTaskReview(task, state)
            : `
              ${renderExampleCollector(task, state, { compact: options.compact })}
              ${renderTaskImportDock(task, state, { compact: options.compact })}
              ${renderTaskReflectionPanel(task, state, { forceOpen: options.needsReflection })}
              ${options.isPending ? `<p class="summer-import-waiting">这节课正在等 Gemini 的 MOCHI-RECORD。粘回来后，会自动切到“本节收尾”。</p>` : ""}
              ${hasRecord ? `<p class="summer-import-done">${options.needsReflection ? "已归档，下一步写本节收尾：" : "已归档："}${escapeHtml(info.lastImportedRecord.nodeLabel || "物理")} · ${"★".repeat(Number(info.lastImportedRecord.stars || 0))}</p>` : ""}
            `}
        </div>
      </details>
    `;
  }

  function renderCompletedTaskReview(task, state) {
    const info = taskState(state, task.id);
    const examples = taskExamples(state, task.id);
    return `
      <section class="summer-completed-review">
        <div class="summer-completed-head">
          <span class="material-symbols-outlined">check_circle</span>
          <div>
            <strong>这节已经完成</strong>
            <p>${info.lastImportedRecord ? `学习记录：${escapeHtml(info.lastImportedRecord.nodeLabel || "物理")} · ${"★".repeat(Number(info.lastImportedRecord.stars || 0))}` : "已写完本节收尾，可作为复习资料回看。"}</p>
          </div>
        </div>
        ${info.reflectionDone ? renderSavedTaskReflection(info.reflection || {}) : ""}
        ${examples.length ? `
          <div class="summer-completed-examples">
            <strong>已保存例题</strong>
            <div class="summer-example-list">
              ${examples.map((item) => renderExampleItem(task, item)).join("")}
            </div>
          </div>
        ` : `<p class="summer-example-empty">这节课没有保存例题截图。</p>`}
      </section>
    `;
  }

  function taskLearningReadiness(task, state) {
    const info = taskState(state, task.id);
    const examples = taskExamples(state, task.id);
    const hasPractice = getPracticeItems(task).length > 0;
    const hasExampleEvidence = examples.length > 0 || hasPractice;
    const quizCopied = Boolean(info.exampleQuizPromptCopiedAt || info.promptCopiedAt);
    const reflectionDone = Boolean(info.reflectionDone && info.reflection);
    const missing = [];
    if (!hasExampleEvidence) missing.push("例题截图");
    if (!quizCopied) missing.push("测验包");
    if (!reflectionDone) missing.push("本节收尾");
    return { examples, hasExampleEvidence, quizCopied, reflectionDone, ready: hasExampleEvidence && quizCopied, missing };
  }

  function renderTaskReflectionPanel(task, state, options = {}) {
    const info = taskState(state, task.id);
    const readiness = taskLearningReadiness(task, state);
    const reflection = info.reflection || {};
    const open = options.forceOpen || info.completed || readiness.ready || readiness.reflectionDone;
    if (readiness.reflectionDone) {
      return `
        <section class="summer-task-reflection-card done">
          <div class="summer-task-reflection-head">
            <span class="material-symbols-outlined">check_circle</span>
            <div>
              <strong>本节收尾已完成</strong>
              <p>这个节点已经可以顺延；复习时也能在总计划里回看。</p>
            </div>
          </div>
          ${renderSavedTaskReflection(reflection)}
        </section>
      `;
    }
    return `
      <section class="summer-task-reflection-card ${readiness.ready ? "ready" : ""}" data-task-reflection-card="${escapeHtml(task.id)}">
        <div class="summer-task-reflection-head">
          <span class="material-symbols-outlined">${readiness.ready ? "edit_note" : "lock"}</span>
          <div>
            <strong>本节收尾</strong>
            <p>${readiness.ready ? "做完 AI 练题后，点一下现在能做到哪一步，节点就变绿。想多写一句更好，不写也行。" : `先完成：${escapeHtml(readiness.missing.filter((item) => item !== "本节收尾").join(" / ") || "前面步骤")}`}</p>
          </div>
        </div>
        <div class="summer-reflection-checks" aria-label="本节完成条件">
          <span class="${readiness.hasExampleEvidence ? "done" : ""}"><i>1</i>例题</span>
          <span class="${readiness.quizCopied ? "done" : ""}"><i>2</i>测验包</span>
          <span><i>3</i>收尾</span>
        </div>
        <details class="summer-inline-reflection" ${open ? "open" : ""}>
          <summary>${readiness.ready ? "填写本节收尾" : "查看收尾要求"}</summary>
          <div class="summer-inline-reflection-body">
            ${renderUnderstandingPicker(reflection.understanding)}
            <label class="summer-reflection-field">
              <span>下次看到这类题，先提醒自己什么？（可选）</span>
              <textarea name="reviewCue" rows="2" placeholder="想写再写，例如：先画 v-t 图，再用面积找位移。">${escapeHtml(reflection.reviewCue || reflection.takeaway || "")}</textarea>
            </label>
            <details class="summer-reflection-extra">
              <summary>可选：标一下卡点</summary>
              <div>
                ${renderStuckTagPicker(reflection.stuckTags)}
                <label class="summer-reflection-field">
                  <span>补充一句（可选）</span>
                  <textarea name="stuckPoint" rows="2" placeholder="例如：图像面积什么时候取正负还不稳。">${escapeHtml(reflection.stuckPoint || "")}</textarea>
                </label>
              </div>
            </details>
            <p class="summer-reflection-message" data-reflection-message></p>
            <button class="btn btn-primary summer-reflection-submit" data-summer-action="save-task-reflection" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">check_circle</span>保存本节收尾，节点变绿
            </button>
          </div>
        </details>
      </section>
    `;
  }

  function getTaskFlow(task, taskInfo, isPending) {
    const hasPractice = getPracticeItems(task).length > 0;
    const started = Boolean(taskInfo.startedAt || taskInfo.lastFocusedAt || taskInfo.watched);
    const watched = Boolean(taskInfo.watched);
    const practicing = Boolean(taskInfo.practicingAt);
    const completed = Boolean(taskInfo.completed && (!taskInfo.reflectionRequired || taskInfo.reflectionDone));
    if (completed) {
      return { step: 3, action: "open-task-support", label: "查看回顾", icon: "visibility", tone: "done", hasPractice };
    }
    if (taskInfo.completed || isPending || taskInfo.exampleQuizPromptCopiedAt || taskInfo.promptCopiedAt) {
      return { step: 2, action: "open-reflection", label: "写本节收尾", icon: "edit_note", tone: "primary", hasPractice };
    }
    if (practicing && hasPractice) {
      return { step: 1, action: "copy-first-prompt", label: "复制第 1 题给 AI", icon: "content_copy", tone: "primary", hasPractice };
    }
    if (watched && hasPractice) {
      return { step: 1, action: "practice", label: "做第 1 道题", icon: "edit_note", tone: "primary", hasPractice };
    }
    if (started) {
      return { step: 0, action: "watched-next", label: hasPractice ? "我看完了，去做题" : "我看完了", icon: "visibility", tone: "primary", hasPractice };
    }
    return { step: 0, action: "start-task", label: "开始这节课", icon: "play_arrow", tone: "primary", hasPractice };
  }

  function selectedTaskStep(taskInfo, flow) {
    const saved = Number(taskInfo.activeStep);
    if (Number.isInteger(saved) && saved >= 0 && saved <= 3) return saved;
    return flow.step;
  }

  function renderTaskStepper(task, flow, selectedStep, rescueActive = false) {
    const steps = ["看视频", "做题", "收尾", "完成"];
    return `
      <div class="summer-stepper" aria-label="任务步骤">
        ${steps.map((label, index) => `
          <button class="chip ${index < flow.step ? "done" : index === flow.step ? "active" : ""} ${index > flow.step ? "future" : ""} ${index === selectedStep ? "selected" : ""}" data-rescue-blocked-action data-summer-action="show-step" data-task-id="${escapeHtml(task.id)}" data-step="${index}" type="button" aria-pressed="${index === selectedStep ? "true" : "false"}" ${rescueActive ? "disabled" : ""}>
            <i>${index < flow.step ? "✓" : index + 1}</i>${label}
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderTaskStepPanel(task, selectedStep, flow, taskInfo) {
    const practiceItems = getPracticeItems(task);
    if (selectedStep === 0) {
      return `
        <div class="summer-video-start-row">
          <p class="summer-step-hint">
            <span class="material-symbols-outlined">play_circle</span>
            <strong>先看主线视频</strong>
            <span>${escapeHtml(task.source)} · ${escapeHtml(task.duration)} · 建议专注 ${Number(task.focusMins || 25)} 分钟。按主按钮开始，其他操作已收进抽屉。</span>
          </p>
          <button class="summer-rescue-entry" data-summer-action="support-open" data-task-id="${escapeHtml(task.id)}" type="button">
            <span class="material-symbols-outlined">help</span>听不懂 / 视频太难
          </button>
        </div>
      `;
    }
    if (selectedStep === 1) {
      return `
        <section class="summer-step-panel summer-step-panel-practice">
          <p class="summer-step-hint">
            <span class="material-symbols-outlined">edit_note</span>
            <strong>做过关小题</strong>
            <span>${practiceItems.length ? `这节课有 ${practiceItems.length} 道小题。先自己想，再复制给 AI 带做。` : "这节课先收集视频例题截图，再用 MOCHI-RECORD 完成学习闭环。"}</span>
          </p>
          ${renderPrep(task)}
          ${renderPracticeItems(task, practiceItems)}
        </section>
      `;
    }
    if (selectedStep === 2) {
      const readyToReflect = Boolean(taskInfo.completed || taskInfo.exampleQuizPromptCopiedAt || taskInfo.promptCopiedAt);
      return `
        <p class="summer-step-hint">
          <span class="material-symbols-outlined">edit_note</span>
          <strong>本节收尾</strong>
          <span>${readyToReflect ? "打开下面的“学习材料与记录”，粘回记录后写一句给未来自己的提醒。" : "先完成做题或复制同类测验包，再写本节收尾。"}</span>
        </p>
      `;
    }
    return `
      <p class="summer-step-hint ${taskInfo.completed && (!taskInfo.reflectionRequired || taskInfo.reflectionDone) ? "done" : ""}">
        <span class="material-symbols-outlined">${taskInfo.completed && (!taskInfo.reflectionRequired || taskInfo.reflectionDone) ? "check_circle" : "flag"}</span>
        <strong>${taskInfo.completed && (!taskInfo.reflectionRequired || taskInfo.reflectionDone) ? "这节已完成" : "完成条件"}</strong>
        <span>${taskInfo.completed && (!taskInfo.reflectionRequired || taskInfo.reflectionDone) ? "已经写完本节收尾，后面复习能回看。" : "看完视频、做完练题，并保存本节收尾后才会顺延。"}</span>
      </p>
    `;
  }

  function renderTaskActions(task, flow, rescueActive = false) {
    const disabled = flow.action === "done" || rescueActive ? " disabled" : "";
    const primaryClass = flow.tone === "done" ? "btn-ghost" : "btn-primary";
    return `
      <div class="summer-task-actions">
        <button class="btn ${primaryClass} btn-sm summer-next-btn" data-rescue-blocked-action data-summer-action="${escapeHtml(flow.action)}" data-task-id="${escapeHtml(task.id)}" type="button"${disabled}>
          <span class="material-symbols-outlined">${escapeHtml(flow.icon)}</span>${escapeHtml(flow.label)}
        </button>
        ${flow.action === "open-task-support" && flow.tone === "done" ? "" : `<details class="summer-more-actions" data-rescue-blocked-action>
          <summary>更多操作</summary>
          <div>
            <a class="btn btn-ghost btn-sm" href="${escapeHtml(task.url)}" target="_blank" rel="noreferrer">
              <span class="material-symbols-outlined">open_in_new</span>打开资源
            </a>
            <button class="btn btn-ghost btn-sm" data-summer-action="focus" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">timer</span>开始专注
            </button>
            <button class="btn btn-ghost btn-sm" data-summer-action="practice" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">edit_note</span>${flow.hasPractice ? "做小题" : "收集例题"}
            </button>
            <button class="btn btn-ghost btn-sm" data-summer-action="watched" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">visibility</span>标记看完
            </button>
          </div>
        </details>`}
      </div>
    `;
  }

  function renderExampleCollector(task, state, options = {}) {
    const examples = taskExamples(state, task.id);
    const compact = Boolean(options.compact);
    const title = compact ? "例题截图" : "视频例题截图";
    const helper = examples.length
      ? `已存 ${examples.length} 张。点“复制测验包”和“复制图片”，把文字和图一起发给 Gemini。`
      : "看视频时截 1-3 张代表题，点左侧后 Ctrl+V 存下来。";
    return `
      <section class="summer-example-box ${compact ? "compact" : ""}" data-summer-example-task-id="${escapeHtml(task.id)}">
        <div class="summer-example-head">
          <span class="material-symbols-outlined">add_photo_alternate</span>
          <div>
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(helper)}</p>
          </div>
        </div>
        <div class="summer-example-actions">
          <div class="summer-example-paste" tabindex="0" data-example-paste data-task-id="${escapeHtml(task.id)}" role="button" aria-label="粘贴${escapeHtml(task.title)}的视频例题截图">
            <span class="material-symbols-outlined">content_paste</span>
            <strong>粘贴截图</strong>
            <small>点后 Ctrl+V</small>
          </div>
          <button class="btn btn-primary btn-sm summer-example-quiz" data-summer-action="copy-example-quiz" data-task-id="${escapeHtml(task.id)}" type="button" ${examples.length ? "" : "disabled"}>
            <span class="material-symbols-outlined">auto_awesome</span>${examples.length ? "复制测验包" : "先贴图"}
          </button>
          <button class="btn btn-soft btn-sm summer-example-copy" data-summer-action="copy-example-image" data-task-id="${escapeHtml(task.id)}" data-example-id="${escapeHtml(examples[0]?.id || "")}" type="button" ${examples.length ? "" : "disabled"}>
            <span class="material-symbols-outlined">content_copy</span>${examples.length > 1 ? "复制首图" : "复制图片"}
          </button>
        </div>
        <p class="summer-example-local-note">
          <span class="material-symbols-outlined">save</span>
          截图只存在你自己的浏览器里，不会上传。
        </p>
        ${renderExampleAiStatus(task, examples)}
        ${examples.length ? `
          <div class="summer-example-list">
            ${examples.map((item) => renderExampleItem(task, item)).join("")}
          </div>
        ` : `
          <p class="summer-example-empty">还没有收集这节课的视频例题。看视频时遇到老师讲的代表题，就截一张贴进来。</p>
        `}
      </section>
    `;
  }

  function renderExampleAiStatus(task, examples) {
    const hasExamples = examples.length > 0;
    return `
      <div class="summer-example-ai-status ${hasExamples ? "ready" : ""}">
        <span class="material-symbols-outlined">${hasExamples ? "content_paste_go" : "info"}</span>
        <div>
          <strong>${hasExamples ? "下一步：测验包 + 图片一起发给 Gemini" : "先把视频里的例题截图存到这里"}</strong>
          <p>${hasExamples
            ? "点“复制测验包”粘文字，再点“复制图片”把截图贴进同一条 Gemini 对话（它带不了图，要单独复制图）→ 练完把记录粘回下面。"
            : "截图只存在本机；等下和测验包一起发给 Gemini。"
          }</p>
        </div>
      </div>
    `;
  }

  function renderExampleItem(task, item) {
    const status = item.status || "半会";
    return `
      <article class="summer-example-item">
        <div class="summer-example-thumb">
          <img data-example-image-id="${escapeHtml(item.id)}" alt="${escapeHtml(task.title)} 例题截图" hidden>
          <span class="material-symbols-outlined">image</span>
        </div>
        <div class="summer-example-meta">
          <strong>${escapeHtml(status)} · ${formatExampleDate(item.createdAt)}</strong>
          <p>${escapeHtml(item.note || "视频里收集到的例题截图")}</p>
          <div class="summer-example-statuses" aria-label="标记掌握情况">
            ${["会", "半会", "不会"].map((label) => `
              <button class="${status === label ? "selected" : ""}" data-summer-action="example-status" data-task-id="${escapeHtml(task.id)}" data-example-id="${escapeHtml(item.id)}" data-example-status="${label}" type="button">${label}</button>
            `).join("")}
            <button data-summer-action="copy-example-image" data-task-id="${escapeHtml(task.id)}" data-example-id="${escapeHtml(item.id)}" type="button">复制图</button>
            <button class="danger" data-summer-action="example-delete" data-task-id="${escapeHtml(task.id)}" data-example-id="${escapeHtml(item.id)}" type="button">删除</button>
          </div>
        </div>
      </article>
    `;
  }

  function taskExamples(state, taskId) {
    const entry = state.examples?.[taskId];
    if (Array.isArray(entry)) return entry;
    if (Array.isArray(entry?.items)) return entry.items;
    return [];
  }

  function setTaskExamples(state, taskId, items) {
    state.examples = state.examples && typeof state.examples === "object" ? state.examples : {};
    state.examples[taskId] = { items: items.slice(0, 24) };
  }

  function formatExampleDate(value) {
    if (!value) return "刚刚";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "刚刚";
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function getPracticeItems(task) {
    return Array.isArray(task.practiceItems) ? task.practiceItems : [];
  }

  function renderPracticeItems(task, items) {
    if (!items.length) {
      return `
        <div class="summer-practice-empty">
          <span class="material-symbols-outlined">pending</span>
          <div>
            <strong>先收集视频例题截图</strong>
            <p>${escapeHtml(task.practiceNote || "这节课先看视频，把老师讲的代表题截图存到本节课下面，再导入 MOCHI-RECORD。")}</p>
          </div>
        </div>
      `;
    }
    return `
      <div class="summer-practice-list">
        ${items.map((item, index) => `
          <section class="summer-practice-item">
            <div class="summer-practice-title">
              <span>${index + 1}</span>
              <strong>${escapeHtml(item.title || `小题 ${index + 1}`)}</strong>
            </div>
            ${renderPracticeImage(item)}
            ${renderTaskDiagram(item)}
            <p class="summer-exit-question">${escapeHtml(item.question)}</p>
            <p class="summer-exit-hint">${escapeHtml(item.hint)}</p>
            <button class="btn btn-soft btn-sm" data-summer-action="copy-prompt" data-task-id="${escapeHtml(task.id)}" data-item-index="${index}" type="button">
              <span class="material-symbols-outlined">content_copy</span>复制给 AI
            </button>
          </section>
        `).join("")}
      </div>
    `;
  }

  function rescuePlan(task, reason) {
    const prep = task.prep || {};
    const custom = prep.rescue && typeof prep.rescue === "object" ? prep.rescue : {};
    const concepts = Array.isArray(custom.concepts) && custom.concepts.length
      ? custom.concepts.slice(0, 3)
      : (Array.isArray(prep.concepts) ? prep.concepts.slice(0, 3) : []);
    const reasonAction = {
      concept: "先停下来补最前面的概念，不继续追后面的题型。",
      formulas: "先不背整串公式，只认清每个量和最核心的一条关系。",
      long: "不用硬看完整段，先完成下面的最小基础动作再回来。",
    }[reason] || "先做下面这一小步，再决定要不要回主线。";
    return {
      pause: String(custom.pause || reasonAction),
      concepts,
      book: String(custom.book || prep.oneRound || ""),
      keywords: Array.isArray(custom.keywords) ? custom.keywords.filter(Boolean) : [],
      backup: String(prep.backup || ""),
      links: Array.isArray(prep.backupLinks) ? prep.backupLinks : [],
      oneRoundReference: String(custom.oneRoundReference || task.oneRoundReference || ""),
      check: String(custom.check || (concepts[0] ? `能否用自己的话说清“${concepts[0]}”是什么？` : "能否说清这节课最基础的一个概念？")),
      avoid: String(custom.avoid || ""),
    };
  }

  function buildSupportHelpCard(task, support) {
    const safeSupport = support || { reason: "", attempted: [], note: "" };
    const plan = rescuePlan(task, safeSupport.reason);
    const attempts = [];
    if (safeSupport.attempted?.includes("book")) attempts.push("已经翻过指定讲义");
    if (safeSupport.attempted?.includes("basic-video")) attempts.push("已经找过基础课");
    return [
      "【补基础求助卡】",
      `科目：${currentSubjectLabel()}`,
      `原任务：第 ${task.day || "-"} 天 · ${task.title}`,
      task.videoTitle ? `视频：${task.videoTitle}${task.duration ? `（${task.duration}）` : ""}` : "",
      `我卡住的原因：${supportReasonLabel(safeSupport.reason)}`,
      plan.concepts.length ? `需要先补：${plan.concepts.join("、")}` : "",
      plan.book ? `讲义范围：${plan.book}` : "",
      plan.oneRoundReference ? `一轮复习对应位置：${plan.oneRoundReference}` : "",
      plan.keywords.length ? `可搜索关键词：${plan.keywords.join("、")}` : plan.backup ? `可搜索目录：${plan.backup}` : "",
      attempts.length ? `我已经试过：${attempts.join("、")}` : "我还没有成功找到合适的基础解释。",
      safeSupport.note ? `具体不懂：${safeSupport.note}` : "",
      plan.check ? `我现在还回答不了：${plan.check}` : "",
      "请从零基础开始，一次只解释一个概念；先用直白语言和一个最简单例子，不要直接堆公式或进入综合题。每解释一步先问我是否听懂，再继续。",
    ].filter(Boolean).join("\n");
  }

  function renderTaskRescueSlot(task, info) {
    return `<div class="summer-rescue-slot" data-rescue-slot="${escapeHtml(task.id)}">${renderTaskRescuePanel(task, info)}</div>`;
  }

  function rescuePrimaryResource(plan) {
    if (plan.book) return { icon: "menu_book", label: "实体一轮讲义页码", text: plan.book, link: null };
    const searchText = plan.keywords.length ? plan.keywords.join("、") : plan.backup;
    if (searchText) return { icon: "search", label: "只搜这些词", text: searchText, link: plan.links[0] || null };
    if (plan.links.length) return { icon: "open_in_new", label: "只看这个入口", text: plan.links[0].label || "基础资源", link: plan.links[0] };
    return null;
  }

  function renderTaskRescuePanel(task, info) {
    const support = taskSupport(info);
    if (!support || support.status !== "active") return "";
    const reasons = [
      ["concept", "概念没学过"],
      ["formulas", "公式太多"],
      ["long", "视频太长"],
    ];
    const plan = rescuePlan(task, support.reason);
    const resource = rescuePrimaryResource(plan);
    const helpOpen = supportHelpOpenTasks.has(task.id);
    return `
      <section class="summer-rescue-panel active" aria-label="临时救急，不计任务进度">
        <div class="summer-rescue-label"><span class="material-symbols-outlined">pause_circle</span>临时救急 · 不计任务进度</div>
        <div class="summer-rescue-head">
          <span class="material-symbols-outlined">support</span>
          <div>
            <strong>主线先暂停，先补最小基础</strong>
            <p>选一个最接近的原因。这里只处理眼前这个卡点，不会推进任务或奖励。</p>
          </div>
        </div>
        <div class="summer-rescue-reasons" role="group" aria-label="选择卡住原因">
          ${reasons.map(([value, label]) => `
            <button class="${support.reason === value ? "selected" : ""}" data-summer-action="support-reason" data-task-id="${escapeHtml(task.id)}" data-support-reason="${value}" type="button">${label}</button>
          `).join("")}
        </div>
        ${support.reason ? `
          <div class="summer-rescue-action">
            <span>现在只做这一件事</span>
            <strong>${escapeHtml(plan.pause)}</strong>
            ${plan.concepts.length ? `<p>只补：${escapeHtml(plan.concepts.join("、"))}</p>` : ""}
          </div>
          ${plan.oneRoundReference ? `
            <div class="summer-rescue-resource reference">
              <span class="material-symbols-outlined">video_library</span>
              <div><strong>一轮复习对应位置</strong><p>${escapeHtml(plan.oneRoundReference)}</p></div>
              <a class="btn btn-soft btn-sm" href="${escapeHtml(task.url)}" target="_blank" rel="noreferrer"><span class="material-symbols-outlined">open_in_new</span>打开对应页</a>
            </div>
          ` : ""}
          ${resource ? `
            <div class="summer-rescue-resource">
              <span class="material-symbols-outlined">${escapeHtml(resource.icon)}</span>
              <div><strong>${escapeHtml(resource.label)}</strong><p>${escapeHtml(resource.text)}</p></div>
              ${resource.link ? `<a class="btn btn-soft btn-sm" href="${escapeHtml(resource.link.url)}" target="_blank" rel="noreferrer"><span class="material-symbols-outlined">open_in_new</span>打开</a>` : ""}
            </div>
          ` : ""}
          <div class="summer-rescue-check">
            <span class="material-symbols-outlined">quiz</span>
            <div><strong>能回答再回主线</strong><p>${escapeHtml(plan.check)}</p></div>
          </div>
          <div class="summer-rescue-actions">
            <button class="btn btn-primary btn-sm" data-summer-action="support-resolved" data-task-id="${escapeHtml(task.id)}" type="button"><span class="material-symbols-outlined">check_circle</span>能回答了，回原任务</button>
            <button class="btn btn-soft btn-sm" data-summer-action="support-help-open" data-task-id="${escapeHtml(task.id)}" type="button"><span class="material-symbols-outlined">help</span>还是不懂</button>
          </div>
          ${helpOpen ? `
            <div class="summer-rescue-help">
              <label><span>具体卡在哪里（可选）</span><input data-support-note data-task-id="${escapeHtml(task.id)}" type="text" value="${escapeHtml(support.note)}" placeholder="例如：不知道引力为什么能让卫星转圈"></label>
              <button class="btn btn-soft btn-sm" data-summer-action="support-help-copy" data-task-id="${escapeHtml(task.id)}" type="button"><span class="material-symbols-outlined">content_copy</span>复制求助卡</button>
            </div>
          ` : ""}
        ` : ""}
        <button class="summer-rescue-defer" data-summer-action="support-defer" data-task-id="${escapeHtml(task.id)}" type="button">实在无法继续？暂时放下，本周复盘前回来</button>
      </section>
    `;
  }

  function renderPrep(task) {
    const prep = task.prep;
    if (!prep) return "";
    const concepts = Array.isArray(prep.concepts) ? prep.concepts : [];
    const backupLinks = Array.isArray(prep.backupLinks) ? prep.backupLinks : [];
    return `
      <section class="summer-prep-box">
        <div class="summer-prep-title">
          <span class="material-symbols-outlined">checklist</span>
          <strong>卡住时再看</strong>
        </div>
        ${concepts.length ? `
          <div class="summer-prep-tags">
            ${concepts.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
        ` : ""}
        <div class="summer-prep-lines">
          ${prep.oneRound ? `<p><strong>翻书救急</strong>${escapeHtml(prep.oneRound)}</p>` : ""}
          ${prep.backup ? `<p><strong>不懂再看</strong>${escapeHtml(prep.backup)}</p>` : ""}
        </div>
        ${backupLinks.length ? `
          <div class="summer-prep-links">
            ${backupLinks.map((link) => `
              <a class="btn btn-soft btn-sm" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
                <span class="material-symbols-outlined">open_in_new</span>${escapeHtml(link.label || "打开资源")}
              </a>
            `).join("")}
          </div>
        ` : ""}
      </section>
    `;
  }

  function renderPracticeImage(item) {
    if (!item.image) return "";
    const alt = item.imageAlt || item.title || "过关小题截图";
    return `
      <a class="summer-practice-image-link" href="${escapeHtml(item.image)}" target="_blank" rel="noreferrer" aria-label="打开原题截图">
        <img class="summer-practice-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(alt)}" loading="lazy">
      </a>
    `;
  }

  function bindRescuePanel(panel) {
    if (!panel) return;
    panel.querySelectorAll("[data-summer-action]").forEach((el) => {
      el.addEventListener("click", handleAction);
    });
    panel.querySelectorAll("[data-support-note]").forEach((el) => {
      el.addEventListener("blur", handleSupportNote);
    });
  }

  function findTaskRescueSlot(taskId, trigger) {
    const selector = `[data-rescue-slot="${escapeSelectorAttr(taskId)}"]`;
    const scope = trigger?.closest?.(".summer-route-step, .summer-task");
    return scope?.querySelector?.(selector) || document.querySelector(selector);
  }

  function updateRescuePanelInPlace(task, trigger) {
    const slot = findTaskRescueSlot(task.id, trigger);
    const scope = slot?.closest?.(".summer-route-step, .summer-task");
    if (!slot || !scope) return false;
    const html = renderTaskRescuePanel(task, taskState(readState(), task.id)).trim();
    const active = Boolean(html);
    slot.innerHTML = html;
    scope.classList.toggle("rescue-paused", active);
    scope.querySelectorAll("[data-rescue-blocked-action]").forEach((el) => {
      if (el.tagName === "BUTTON") el.disabled = active;
      else {
        el.toggleAttribute("inert", active);
        el.setAttribute("aria-disabled", active ? "true" : "false");
      }
    });
    const normalContent = scope.querySelector(".summer-normal-task-content");
    if (normalContent) {
      normalContent.setAttribute("aria-label", active ? "正常任务已暂停" : "正常任务");
      const pausedLabel = normalContent.querySelector(".summer-task-paused-label");
      if (active && !pausedLabel) normalContent.insertAdjacentHTML("afterbegin", `<p class="summer-task-paused-label"><span class="material-symbols-outlined">pause_circle</span>正常任务已暂停</p>`);
      if (!active) pausedLabel?.remove?.();
    }
    bindRescuePanel(slot.querySelector(".summer-rescue-panel"));
    return true;
  }

  function refreshSupportView(trigger) {
    trigger?.blur?.();
    refreshHome({ preserveScroll: true, lockScroll: true });
  }

  function bind(container) {
    container.querySelectorAll("[data-summer-action]").forEach((el) => {
      el.addEventListener("click", handleAction);
    });
    container.querySelectorAll("[data-example-paste]").forEach((el) => {
      el.addEventListener("paste", handleExamplePaste);
      el.addEventListener("click", () => el.focus());
    });
    container.querySelectorAll("[data-summer-record-paste]").forEach((el) => {
      el.addEventListener("paste", handleTaskRecordPaste);
    });
    container.querySelectorAll("[data-example-note]").forEach((el) => {
      el.addEventListener("blur", handleExampleNote);
    });
    container.querySelectorAll("[data-support-note]").forEach((el) => {
      el.addEventListener("blur", handleSupportNote);
    });
    container.querySelectorAll(".summer-example-statuses button").forEach((el) => {
      el.addEventListener("pointerdown", captureExamplePointerAnchor);
    });
    container.querySelectorAll("[data-summer-reward-drag]").forEach((el) => {
      el.addEventListener("pointerdown", handleRewardDragStart);
      el.addEventListener("keydown", handleRewardHeadKeydown);
    });
    const rewardFloat = container.querySelector("[data-summer-reward]");
    if (rewardFloat?.dataset.rewardPositioned === "true") {
      requestAnimationFrame(() => clampRewardIntoViewport(rewardFloat, { persist: true }));
    }
    const activeReward = rewardState(readState()).drawAnimation;
    if (activeReward?.active) scheduleRewardAnimation(activeReward, 220);
    hydrateExampleImages(container);
  }

  function captureExamplePointerAnchor(event) {
    const box = event.currentTarget?.closest?.("[data-summer-example-task-id]");
    if (!box) return;
    examplePointerAnchor = {
      selector: `[data-summer-example-task-id="${escapeSelectorAttr(box.dataset.summerExampleTaskId || "")}"]`,
      top: box.getBoundingClientRect().top,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
  }

  function restoreExamplePointerAnchor() {
    const anchor = examplePointerAnchor;
    examplePointerAnchor = null;
    if (!anchor?.selector || !Number.isFinite(anchor.top)) return;
    const restore = () => {
      const next = document.querySelector(anchor.selector);
      if (!next) {
        window.scrollTo(anchor.scrollX || 0, anchor.scrollY || 0);
        return;
      }
      const delta = next.getBoundingClientRect().top - anchor.top;
      if (Math.abs(delta) > 0.5) window.scrollTo(window.scrollX, window.scrollY + delta);
    };
    requestAnimationFrame(() => {
      restore();
      setTimeout(restore, 80);
    });
  }

  async function handleAction(event) {
    const action = event.currentTarget.dataset.summerAction;
    const id = event.currentTarget.dataset.taskId || "";
    const task = findSummerTask(id);
    if (action === "route-day") {
      const dayNo = Number(event.currentTarget.dataset.routeDay || 0);
      if (ROUTE_DAYS.some((day) => day.day === dayNo)) {
        const anchor = elementAnchorOptions(event.currentTarget, `[data-summer-action="route-day"][data-route-day="${dayNo}"]`);
        const state = readState();
        state.routeDetailDay = dayNo;
        writeState(state);
        refreshHome(anchor);
      }
      return;
    }
    if (action === "switch-subject") {
      const subject = event.currentTarget.dataset.subject || "physics";
      if (SUBJECT_HAS_PLAN[subject] !== undefined && subject !== activeSubject) {
        activeSubject = subject;
        refreshHome({ preserveScroll: true });
      }
      return;
    }
    if (action === "open-route-overview") {
      routeOverviewOpen = true;
      refreshHome({ preserveScroll: true });
      return;
    }
    if (action === "close-route-overview") {
      routeOverviewOpen = false;
      refreshHome({ preserveScroll: true });
      return;
    }
    if (action === "route-auto") {
      const state = readState();
      state.activeRouteDay = 0;
      writeState(state);
      refreshHome({ preserveScroll: true });
      window.MochiApp?.toast?.("已回到自动顺延：未完成任务会排在前面");
      return;
    }
    if (action === "route-activate") {
      const dayNo = Number(event.currentTarget.dataset.routeDay || 0);
      const day = ROUTE_DAYS.find((item) => item.day === dayNo);
      if (!day) return;
      const state = readState();
      const blocked = deferredTasksBlockingDay(day, state);
      if (blocked.length) {
        state.routeDetailDay = day.day;
        writeState(state);
        refreshHome({ preserveScroll: true });
        window.MochiApp?.toast?.(`先补回 ${blocked.length} 个“待补基础”，再进入这一天`);
        return;
      }
      state.activeRouteDay = day.day;
      state.routeDetailDay = day.day;
      state.routeDays[day.day] = {
        ...routeDayState(state, day.day),
        startedAt: routeDayState(state, day.day).startedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      writeState(state);
      refreshHome({ preserveScroll: true });
      window.MochiApp?.toast?.(`已把第 ${day.day} 天设为今日任务`);
      return;
    }
    if (action === "route-focus" || action === "route-import") {
      const dayNo = Number(event.currentTarget.dataset.routeDay || 0);
      const day = ROUTE_DAYS.find((item) => item.day === dayNo);
      if (!day) return;
      const state = readState();
      const blocked = deferredTasksBlockingDay(day, state);
      if (blocked.length) {
        state.routeDetailDay = day.day;
        writeState(state);
        refreshHome({ preserveScroll: true });
        window.MochiApp?.toast?.(`先补回 ${blocked.length} 个“待补基础”，再继续`);
        return;
      }
      const current = routeDayState(state, day.day);
      state.routeDays[day.day] = {
        ...current,
        startedAt: current.startedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (action === "route-focus") {
        writeState(state);
        const primaryTask = routePrimaryTask(day, state);
        window.MochiApp?.startCommittedFocus?.(`暑假${currentSubjectLabel()}：${day.title}`, 45, {
          source: "summer-task",
          taskId: primaryTask.id,
          routeDay: day.day,
        });
        return;
      }
      state.pendingTaskId = "";
      state.pendingRouteDay = day.day;
      state.pendingRouteTaskId = routePrimaryTask(day, state).id;
      writeState(state);
      refreshHome({ preserveScroll: true });
      if (focusImportBox()) {
        window.MochiApp?.toast?.(`已关联第 ${day.day} 天：粘贴 MOCHI-RECORD 后归档到当前视频/学习单`);
        return;
      }
      if (window.MochiApp?.setHolidayMode) {
        window.MochiApp.setHolidayMode("holiday");
        setTimeout(() => focusImportBox(), 350);
        window.MochiApp?.toast?.(`已打开今天的学习模式，并关联第 ${day.day} 天学习单`);
        return;
      }
      window.MochiApp?.toast?.(`已关联第 ${day.day} 天：粘贴 MOCHI-RECORD 后归档到当前视频/学习单`);
      return;
    }
    if (action === "save-day-reflection") {
      const dayNo = Number(event.currentTarget.dataset.routeDay || 0);
      saveDayReflection(dayNo, event.currentTarget);
      return;
    }
    if (action === "skip-day-reflection") {
      const dayNo = Number(event.currentTarget.dataset.routeDay || 0);
      skipDayReflection(dayNo);
      return;
    }
    if (action === "reward-draw-daily") {
      econOpenBoard("daily", event.currentTarget);
      return;
    }
    if (action === "reward-draw-stage") {
      econOpenBoard("stage", event.currentTarget);
      return;
    }
    if (action === "reward-roll") {
      econRollNextDie(event.currentTarget);
      return;
    }
    if (action === "reward-clear-result") {
      writeSharedReward({ draw: null });
      refreshHome({ preserveScroll: true });
      return;
    }
    if (!task) return;
    if (action === "support-open") {
      supportHelpOpenTasks.delete(task.id);
      updateTaskSupport(task.id, {
        status: "active",
        openedAt: taskSupport(taskState(readState(), task.id))?.openedAt || new Date().toISOString(),
      });
      updateTask(task.id, { activeStep: 0 });
      if (!updateRescuePanelInPlace(task, event.currentTarget)) refreshSupportView(event.currentTarget);
      return;
    }
    if (action === "support-reason") {
      const reason = event.currentTarget.dataset.supportReason || "";
      if (!SUPPORT_REASONS.has(reason)) return;
      updateTaskSupport(task.id, { status: "active", reason });
      if (!updateRescuePanelInPlace(task, event.currentTarget)) refreshSupportView(event.currentTarget);
      return;
    }
    if (action === "support-resolved") {
      const now = new Date().toISOString();
      updateTaskSupport(task.id, { status: "resolved", resolvedAt: now, deferredAt: "" });
      updateTask(task.id, { activeStep: 0 });
      supportHelpOpenTasks.delete(task.id);
      if (!updateRescuePanelInPlace(task, event.currentTarget)) refreshSupportView(event.currentTarget);
      window.MochiApp?.toast?.("已回到原任务；真正完成视频、练习和收尾后才计入奖励");
      return;
    }
    if (action === "support-help-open") {
      supportHelpOpenTasks.add(task.id);
      if (!updateRescuePanelInPlace(task, event.currentTarget)) refreshSupportView(event.currentTarget);
      return;
    }
    if (action === "support-help-copy") {
      const note = String(event.currentTarget.closest(".summer-rescue-panel")?.querySelector("[data-support-note]")?.value || "").trim();
      updateTaskSupport(task.id, { note });
      const support = taskSupport(taskState(readState(), task.id));
      const card = buildSupportHelpCard(task, support);
      const ok = await copyText(card);
      updateTaskSupport(task.id, { helpCardCopiedAt: new Date().toISOString() });
      if (ok) window.MochiApp?.toast?.("求助卡已复制，可以粘给 AI、老师或同学");
      else showTextFallback("复制补基础求助卡", "浏览器没有放行剪贴板。点下面文本框后 Ctrl+A / Ctrl+C。", card);
      return;
    }
    if (action === "support-defer") {
      supportHelpOpenTasks.delete(task.id);
      const state = readState();
      const current = taskState(state, task.id);
      const support = taskSupport(current) || {};
      const now = new Date().toISOString();
      state.tasks[task.id] = {
        ...current,
        support: { ...support, status: "deferred", deferredAt: now, resolvedAt: "" },
        updatedAt: now,
      };
      if (state.pendingTaskId === task.id) state.pendingTaskId = "";
      if (state.pendingRouteTaskId === task.id) {
        state.pendingRouteTaskId = "";
        state.pendingRouteDay = 0;
      }
      const day = taskRouteDay(task);
      if (day && Number(state.activeRouteDay || 0) === day.day && routeDayCanAdvance(day, state)) state.activeRouteDay = 0;
      writeState(state);
      refreshSupportView(event.currentTarget);
      window.MochiApp?.toast?.(`已放入“待补基础”；${deferredDeadlineLabel(task)}，不算完成、不计奖励`);
      return;
    }
    if (action === "support-return") {
      supportHelpOpenTasks.delete(task.id);
      const state = readState();
      const current = taskState(state, task.id);
      const support = taskSupport(current) || {};
      const now = new Date().toISOString();
      state.tasks[task.id] = {
        ...current,
        activeStep: 0,
        support: { ...support, status: "active", deferredAt: "", openedAt: support.openedAt || now },
        updatedAt: now,
      };
      const day = taskRouteDay(task);
      if (day) {
        state.activeRouteDay = day.day;
        state.routeDetailDay = day.day;
      }
      state.pendingTaskId = "";
      state.pendingRouteDay = 0;
      state.pendingRouteTaskId = "";
      writeState(state);
      refreshSupportView(event.currentTarget);
      window.MochiApp?.toast?.("已回到原任务，先补最小基础，再继续主线");
      return;
    }
    if (action === "open-pending-import") {
      openTaskImportDock(task.id);
      return;
    }
    if (action === "parse-task-record") {
      parseTaskRecord(task, event.currentTarget);
      return;
    }
    if (action === "save-task-reflection") {
      saveTaskReflection(task, event.currentTarget);
      return;
    }
    if (action === "open-task-support") {
      openTaskFollowup(task.id, "materials");
      return;
    }
    if (action === "open-reflection") {
      const card = document.querySelector(`[data-task-reflection-card="${escapeSelectorAttr(task.id)}"]`);
      const support = card?.closest?.(".summer-task-support");
      if (support) support.open = true;
      const details = card?.querySelector?.(".summer-inline-reflection");
      if (details) details.open = true;
      const target = card || event.currentTarget.closest(".summer-task") || event.currentTarget.closest(".summer-route-step");
      scrollIntoViewIfNeeded(target);
      flashTaskCard(task.id);
      setTimeout(() => {
        const firstField = card?.querySelector?.("[name='reviewCue'], textarea, input[name='understanding']");
        firstField?.focus?.({ preventScroll: true });
      }, 180);
      return;
    }
    if (action === "copy-example-image") {
      const exampleId = event.currentTarget.dataset.exampleId || "";
      await copyExampleImage(task, exampleId, event.currentTarget);
      return;
    }
    if (action === "example-status") {
      const exampleId = event.currentTarget.dataset.exampleId || "";
      const status = event.currentTarget.dataset.exampleStatus || "半会";
      if (!examplePointerAnchor) captureExamplePointerAnchor(event);
      updateExampleMeta(task.id, exampleId, { status });
      updateExampleStatusInPlace(event.currentTarget, status);
      restoreExamplePointerAnchor();
      return;
    }
    if (action === "example-delete") {
      const exampleId = event.currentTarget.dataset.exampleId || "";
      await deleteExample(task.id, exampleId, taskAnchorOptions(task.id, event.currentTarget));
      return;
    }
    if (action === "show-step") {
      const step = Math.min(3, Math.max(0, Number(event.currentTarget.dataset.step || 0)));
      const selector = `[data-summer-action="show-step"][data-task-id="${escapeSelectorAttr(task.id)}"][data-step="${step}"]`;
      const anchor = elementAnchorOptions(event.currentTarget, selector);
      updateTask(task.id, { activeStep: step });
      refreshHome(anchor);
      return;
    }
    if (action === "start-task") {
      const anchor = taskAnchorOptions(task.id, event.currentTarget);
      const state = readState();
      const current = taskState(state, task.id);
      const now = new Date().toISOString();
      state.tasks[task.id] = {
        ...current,
        startedAt: current.startedAt || now,
        lastFocusedAt: now,
        activeStep: 0,
        updatedAt: now,
      };
      writeState(state);
      window.MochiApp?.startCommittedFocus?.(`暑假${currentSubjectLabel()}：看${task.title}`, task.focusMins, {
        source: "summer-task",
        taskId: task.id,
        routeDay: task.routeVideo ? task.day : undefined,
      });
      refreshHome(anchor);
      window.MochiApp?.toast?.("已开始计时；需要视频时点“更多操作 → 打开视频”");
      return;
    }
    if (action === "watched-next") {
      const anchor = taskAnchorOptions(task.id, event.currentTarget);
      const state = readState();
      const current = taskState(state, task.id);
      const hasPractice = getPracticeItems(task).length > 0;
      state.tasks[task.id] = {
        ...current,
        watched: true,
        practicingAt: hasPractice ? (current.practicingAt || new Date().toISOString()) : current.practicingAt,
        activeStep: hasPractice ? 1 : 2,
        updatedAt: new Date().toISOString(),
      };
      writeState(state);
      refreshHome(anchor);
      window.MochiApp?.toast?.(hasPractice ? "已打开过关小题，先做第 1 道" : "已记录看完视频");
      return;
    }
    if (action === "watched") {
      const anchor = taskAnchorOptions(task.id, event.currentTarget);
      updateTask(task.id, { watched: true, activeStep: 1 });
      window.MochiApp?.toast?.("已记录看完视频，做完练题后写本节收尾");
      refreshHome(anchor);
      return;
    }
    if (action === "practice") {
      const anchor = taskAnchorOptions(task.id, event.currentTarget);
      const state = readState();
      const hasPractice = getPracticeItems(task).length > 0;
      state.tasks[task.id] = {
        ...taskState(state, task.id),
        watched: hasPractice ? true : taskState(state, task.id).watched || false,
        practicingAt: new Date().toISOString(),
        activeStep: 1,
        updatedAt: new Date().toISOString(),
      };
      writeState(state);
      refreshHome(anchor);
      window.MochiApp?.toast?.(hasPractice ? "已打开过关小题，做完后写本节收尾" : "先收集这节课的视频例题截图，再生成同类测验");
      return;
    }
    if (action === "focus") {
      const now = new Date().toISOString();
      if (task.routeVideo) {
        const state = readState();
        state.tasks[task.id] = {
          ...taskState(state, task.id),
          watched: taskState(state, task.id).watched || false,
          lastFocusedAt: now,
          activeStep: 0,
          updatedAt: now,
        };
        state.routeDays[task.day] = {
          ...routeDayState(state, task.day),
          startedAt: routeDayState(state, task.day).startedAt || now,
          updatedAt: now,
        };
        writeState(state);
      } else {
        updateTask(task.id, { watched: taskState(readState(), task.id).watched || false, lastFocusedAt: now, activeStep: 0 });
      }
      const goal = getPracticeItems(task).length ? `暑假${currentSubjectLabel()}：${task.title}过关小题` : `暑假${currentSubjectLabel()}：看${task.title}`;
      window.MochiApp?.startCommittedFocus?.(goal, task.focusMins, {
        source: "summer-task",
        taskId: task.id,
        routeDay: task.routeVideo ? task.day : undefined,
      });
      return;
    }
    if (action === "copy-first-prompt") {
      await copyPracticePrompt(task, 0, taskAnchorOptions(task.id, event.currentTarget));
      return;
    }
    if (action === "copy-prompt") {
      const itemIndex = Number(event.currentTarget.dataset.itemIndex || 0);
      await copyPracticePrompt(task, itemIndex, taskAnchorOptions(task.id, event.currentTarget));
      return;
    }
    if (action === "copy-example-quiz") {
      await copyExampleQuizPrompt(task, taskAnchorOptions(task.id, event.currentTarget));
      return;
    }
    if (action === "import") {
      if (task.routeVideo) {
        const state = readState();
        state.pendingTaskId = "";
        state.pendingRouteDay = task.day;
        state.routeDays[task.day] = {
          ...routeDayState(state, task.day),
          startedAt: routeDayState(state, task.day).startedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        writeState(state);
        refreshHome({ preserveScroll: true });
        if (focusImportBox()) {
          window.MochiApp?.toast?.(`已关联第 ${task.day} 天：粘贴 MOCHI-RECORD 后归档到这个视频`);
        }
        return;
      }
      setPendingTask(task.id, { activeStep: 2 });
      if (focusImportBox()) {
        window.MochiApp?.toast?.("已关联这条任务：粘贴 MOCHI-RECORD 后归档到这里");
        return;
      }
      if (window.MochiApp?.setHolidayMode) {
        window.MochiApp.setHolidayMode("holiday");
        setTimeout(() => focusImportBox(), 350);
        window.MochiApp?.toast?.("已打开今天的学习模式，粘贴 MOCHI-RECORD 后归档到当前任务");
        return;
      }
      window.MochiApp?.toast?.("已关联这条任务：粘贴 MOCHI-RECORD 后归档到这里");
    }
  }

  function markPendingImport(task) {
    const state = readState();
    if (task.routeVideo) {
      state.pendingTaskId = "";
      state.pendingRouteDay = task.day;
      state.pendingRouteTaskId = task.id;
      state.routeDays[task.day] = {
        ...routeDayState(state, task.day),
        startedAt: routeDayState(state, task.day).startedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      state.pendingTaskId = task.id;
      state.pendingRouteDay = 0;
      state.pendingRouteTaskId = "";
    }
    state.tasks[task.id] = {
      ...taskState(state, task.id),
      updatedAt: new Date().toISOString(),
    };
    writeState(state);
  }

  function parseTaskRecord(task, trigger) {
    markPendingImport(task);
    const root = trigger.closest(".summer-import-dock");
    const textarea = root?.querySelector("[data-summer-record-paste]");
    const result = root?.querySelector("[data-summer-record-result]");
    const hasRecordBlock = /---MOCHI-RECORD-END---/.test(textarea?.value || "");
    window.MochiApp?.parsePastedRecordEl?.(textarea, result);
    if (hasRecordBlock) setTimeout(() => openTaskFollowup(task.id, "imported"), 120);
  }

  function handleTaskRecordPaste(event) {
    const task = findSummerTask(event.currentTarget.dataset.taskId || "");
    if (!task) return;
    setTimeout(() => {
      if (/---MOCHI-RECORD-END---/.test(event.currentTarget.value)) {
        const root = event.currentTarget.closest(".summer-import-dock");
        markPendingImport(task);
        window.MochiApp?.parsePastedRecordEl?.(event.currentTarget, root?.querySelector("[data-summer-record-result]"));
        setTimeout(() => openTaskFollowup(task.id, "imported"), 120);
      }
    }, 0);
  }

  function openTaskImportDock(taskId) {
    const task = findSummerTask(taskId);
    if (!task) return;
    const scrollToDock = () => {
      const dock = document.querySelector(`[data-summer-import-task-id="${escapeSelectorAttr(task.id)}"]`);
      if (!dock) return false;
      const support = dock.closest(".summer-task-support");
      if (support) support.open = true;
      const details = dock.querySelector("details");
      if (details) details.open = true;
      scrollIntoViewIfNeeded(dock);
      flashTaskCard(task.id);
      setTimeout(() => dock.querySelector("[data-summer-record-paste]")?.focus?.(), 220);
      return true;
    };
    if (scrollToDock()) return;
    if (task.routeVideo) {
      const state = readState();
      state.activeRouteDay = task.day;
      state.routeDetailDay = task.day;
      writeState(state);
      refreshHome({ preserveScroll: true });
      setTimeout(scrollToDock, 80);
    }
  }

  function openTaskFollowup(taskId, reason = "followup") {
    const task = findSummerTask(taskId);
    if (!task) return;
    const reveal = () => {
      const card = document.querySelector(`[data-summer-task-id="${escapeSelectorAttr(task.id)}"]`);
      if (!card) return false;
      const support = document.querySelector(`[data-task-support="${escapeSelectorAttr(task.id)}"]`) || card.querySelector(".summer-task-support");
      if (support) support.open = true;
      const reflection = support?.querySelector?.(`[data-task-reflection-card="${escapeSelectorAttr(task.id)}"]`) || card.querySelector(`[data-task-reflection-card="${escapeSelectorAttr(task.id)}"]`);
      const reflectionDetails = reflection?.querySelector?.(".summer-inline-reflection");
      if (reflectionDetails && reason !== "import") reflectionDetails.open = true;
      const dock = support?.querySelector?.(`[data-summer-import-task-id="${escapeSelectorAttr(task.id)}"] details`) || card.querySelector(`[data-summer-import-task-id="${escapeSelectorAttr(task.id)}"] details`);
      if (dock && reason === "import") dock.open = true;
      const exampleBox = support?.querySelector?.("[data-summer-example-task-id]") || card.querySelector("[data-summer-example-task-id]");
      const target = reason === "import"
        ? (dock?.closest(".summer-import-dock") || support || card)
        : reason === "materials"
          ? (exampleBox || support || card)
          : (reflection || support || card);
      scrollIntoViewIfNeeded(target);
      flashTaskCard(task.id);
      if (reason === "materials") {
        window.MochiApp?.toast?.("已打开这节课的截图区：点粘贴框后 Ctrl+V");
        setTimeout(() => exampleBox?.querySelector?.("[data-example-paste]")?.focus?.({ preventScroll: true }), 240);
      }
      if (reason === "imported") {
        window.MochiApp?.toast?.("已回到这节课：下一步写本节收尾");
        setTimeout(() => reflection?.querySelector?.("[name='reviewCue'], textarea")?.focus?.({ preventScroll: true }), 240);
      }
      return true;
    };
    if (reveal()) return;
    if (task.routeVideo) {
      const state = readState();
      state.activeRouteDay = task.day;
      state.routeDetailDay = task.day;
      writeState(state);
      refreshHome({ preserveScroll: true });
      setTimeout(reveal, 80);
    }
  }

  function flashTaskCard(taskId) {
    const card = document.querySelector(`[data-summer-task-id="${escapeSelectorAttr(taskId)}"]`);
    if (!card) return;
    card.classList.remove("focus-flash");
    void card.offsetWidth;
    card.classList.add("focus-flash");
    setTimeout(() => card.classList.remove("focus-flash"), 1600);
  }

  function scrollIntoViewIfNeeded(element) {
    if (!element?.getBoundingClientRect) return;
    const rect = element.getBoundingClientRect();
    const topSafe = 86;
    const bottomSafe = window.innerHeight - 96;
    if (rect.top < topSafe || rect.bottom > bottomSafe) {
      element.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function startSummerRewardDraw(trigger) {
    const state = readState();
    const claims = availableRewardClaims(state);
    if (!claims.length) {
      window.MochiApp?.toast?.("今天的能量还没充满，先完成当前视频任务");
      return;
    }
    const reward = rewardState(state);
    if (reward.drawAnimation?.active) {
      window.MochiApp?.toast?.("这次抽奖还在走格，等它停下来");
      return;
    }
    const config = readSummerRewardConfig();
    const prize = normalizeRewardPrize(drawWeightedPrize(config.items.length ? config.items : SUMMER_REWARD_PRIZES));
    const claim = claims[0];
    const finalDice = Math.floor(Math.random() * 6) + 1;
    const startIndex = ((Number(reward.boardCursor || 0) % SUMMER_REWARD_BOARD_SIZE) + SUMMER_REWARD_BOARD_SIZE) % SUMMER_REWARD_BOARD_SIZE;
    const targetIndex = (startIndex + finalDice) % SUMMER_REWARD_BOARD_SIZE;
    const animation = {
      active: false,
      phase: "ready",
      dice: 0,
      finalDice,
      cursor: startIndex,
      startIndex,
      targetIndex,
      board: buildRewardBoard(config.items, prize, targetIndex),
      prize,
      claim,
      startedAt: new Date().toISOString(),
    };
    state.reward = {
      ...reward,
      collapsed: false,
      open: true,
      drawAnimation: animation,
      lastPrize: null,
    };
    writeState(state);
    refreshHome({ preserveScroll: true });
    trigger?.blur?.();
    window.MochiApp?.toast?.("抽奖盘已打开，点骰子开始");
  }

  function beginSummerRewardRoll(trigger) {
    const state = readState();
    const reward = rewardState(state);
    const animation = reward.drawAnimation;
    if (!animation || animation.phase !== "ready") {
      window.MochiApp?.toast?.("先打开抽奖盘");
      return;
    }
    const activeAnimation = { ...animation, active: true, phase: "rolling", dice: 0 };
    state.reward = {
      ...reward,
      collapsed: false,
      open: true,
      drawAnimation: activeAnimation,
    };
    writeState(state);
    refreshHome({ preserveScroll: true });
    trigger?.blur?.();
    scheduleRewardAnimation(activeAnimation, 120);
  }

  function scheduleRewardAnimation(animation, delay = 120) {
    if (!animation?.active) return;
    window.clearTimeout(rewardAnimationTimer);
    rewardAnimationTimer = setTimeout(() => runSummerRewardAnimation(animation), delay);
  }

  function runSummerRewardAnimation(animation) {
    window.clearTimeout(rewardAnimationTimer);
    const root = document.querySelector("[data-summer-reward]");
    if (!root) {
      rewardAnimationTimer = setTimeout(() => finishSummerRewardDraw(animation), 5600);
      return;
    }
    const rollValues = Array.from({ length: 30 }, (_, index) => ((index * 3 + 1) % 6) + 1).concat(animation.finalDice);
    let rollIndex = 0;
    const rollDice = () => {
      setRewardDice(rollValues[rollIndex], true);
      playRewardTick(rollIndex % 2 ? 520 : 620);
      rollIndex += 1;
      if (rollIndex < rollValues.length) {
        rewardAnimationTimer = setTimeout(rollDice, 145);
        return;
      }
      setRewardDice(animation.finalDice, false);
      moveRewardCursor(animation, 0, animation.startIndex);
    };
    rollDice();
  }

  function moveRewardCursor(animation, step, cursor) {
    if (step >= animation.finalDice) {
      finishSummerRewardDraw({ ...animation, cursor: animation.targetIndex, phase: "result" });
      return;
    }
    const nextCursor = (cursor + 1) % SUMMER_REWARD_BOARD_SIZE;
    setRewardCursor(nextCursor);
    playRewardTick(740 + step * 30);
    rewardAnimationTimer = setTimeout(() => moveRewardCursor(animation, step + 1, nextCursor), 520);
  }

  function setRewardDice(value, rolling) {
    const dice = document.querySelector("[data-reward-dice]");
    const game = document.querySelector("[data-reward-game]");
    const status = document.querySelector("[data-reward-status]");
    const caption = document.querySelector("[data-reward-caption]");
    if (dice) {
      dice.textContent = String(value || "?");
      dice.classList.toggle("rolling", Boolean(rolling));
    }
    if (status) status.textContent = rolling ? "骰子转动中" : `骰子 ${value || "-"} 点，正在走格`;
    if (caption) caption.textContent = rolling ? "先摇出点数，再按点数走格。" : "一格一格走，停下后才结算。";
    if (game) {
      game.classList.toggle("rolling", Boolean(rolling));
      game.classList.toggle("moving", !rolling);
    }
  }

  function setRewardCursor(index) {
    document.querySelectorAll("[data-reward-cell]").forEach((cell) => {
      cell.classList.toggle("active", Number(cell.dataset.rewardCell) === index);
    });
  }

  function finishSummerRewardDraw(animation) {
    window.clearTimeout(rewardAnimationTimer);
    rewardAnimationTimer = null;
    const state = readState();
    const reward = rewardState(state);
    const claim = animation.claim || {};
    const prize = normalizeRewardPrize(animation.prize);
    if (claim.key && reward.claimed[claim.key]) {
      writeRewardState({ drawAnimation: null });
      refreshHome({ preserveScroll: true });
      return;
    }
    const entry = {
      id: `summer_reward_${Date.now()}`,
      date: todayIso(),
      claimKey: claim.key || "",
      claim: claim.label || "暑假任务奖励",
      type: claim.type || "day",
      board: Array.isArray(animation.board) ? animation.board : [],
      cursor: Number(animation.targetIndex || 0),
      targetIndex: Number(animation.targetIndex || 0),
      finalDice: Number(animation.finalDice || 0),
      phase: "result",
      prize,
      ...prize,
      createdAt: new Date().toISOString(),
    };
    state.reward = {
      ...reward,
      collapsed: false,
      open: true,
      claimed: claim.key ? { ...reward.claimed, [claim.key]: entry.createdAt } : reward.claimed,
      boardCursor: entry.targetIndex,
      drawAnimation: null,
      lastPrize: entry,
      history: [entry, ...reward.history].slice(0, 50),
    };
    writeState(state);
    refreshHome({ preserveScroll: true });
    setTimeout(() => {
      const float = document.querySelector("[data-summer-reward]");
      if (float) {
        float.classList.add("drawn");
        window.MochiApp?.sparkle?.(float, Number(prize.amount || 0) >= 50 ? "★" : "¥");
        setTimeout(() => float.classList.remove("drawn"), 900);
      }
      playRewardSound(prize.tone);
    }, 80);
    window.MochiApp?.toast?.(`抽中了：${prize.label}`);
  }

  function playRewardTick(freq = 640) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.035, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
      setTimeout(() => ctx.close?.(), 260);
    } catch {
      // 音效只是反馈，失败不影响学习流程。
    }
  }

  // 抽奖音效用一个共享 AudioContext（摇骰子/走格会连发很多下，逐个 new 会撞浏览器上限）
  let _econAudio = null;
  function econAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!_econAudio) _econAudio = new AudioCtx();
      if (_econAudio.state === "suspended") _econAudio.resume?.();
      return _econAudio;
    } catch { return null; }
  }
  function econBeep({ freq = 600, freq2 = null, type = "triangle", dur = 0.12, vol = 0.05 }) {
    const ctx = econAudio();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (freq2) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq2), now + dur * 0.9);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch { /* 音效失败不影响流程 */ }
  }
  // 摇骰子：短促咔哒，越到后面音越低（配合减速）
  function playDiceSpin(i, total) {
    const base = 560 - Math.round((i / Math.max(1, total)) * 150);
    econBeep({ freq: i % 2 ? base + 70 : base, type: "square", dur: 0.055, vol: 0.03 });
  }
  // 出骰子结果：一声"咚"落定（音高快速下滑）
  function playDiceLand() {
    econBeep({ freq: 470, freq2: 170, type: "triangle", dur: 0.22, vol: 0.11 });
  }
  // 走格：一格一响，越接近终点音越高（悬疑）
  function playWalkTick(remaining) {
    const freq = remaining <= 4 ? 660 + (5 - Math.max(0, remaining)) * 95 : 610;
    econBeep({ freq, type: "triangle", dur: 0.09, vol: 0.05 });
  }
  // 出抽奖结果：取莫扎特《土耳其进行曲》里下行/收束的戏剧性乐句（不用上扬的开头，那个太轻快）。
  // 从高点用回音音型一路往下走，节奏越到后面每个音拖得越长（渐慢 ritardando），最后重重落在
  // 大幅拉长的低音上定格——突出震撼/宿命、意犹未尽的震惊感。大奖叠低八度更厚。
  function playPrizeFanfare(big) {
    const ctx = econAudio();
    if (!ctx) return;
    try {
      const A3 = 220.0, E4 = 329.63, A4 = 440.0, B4 = 493.88, C5 = 523.25, Ds5 = 622.25, E5 = 659.25, F5 = 698.46, Gs5 = 830.61, A5 = 880.0;
      // [频率, 时长(秒)]，从高处急促起、越往下越慢越长
      const notes = [
        [A5, 0.14], [Gs5, 0.12], [A5, 0.12], [E5, 0.22],
        [F5, 0.14], [E5, 0.14], [Ds5, 0.14], [E5, 0.24],
        [C5, 0.20], [B4, 0.22], [A4, 0.30],
        [E4, 0.62], [A3, 1.6], // 结尾大幅拖长，重重落在低音定格
      ];
      const t0 = ctx.currentTime + 0.03;
      let off = 0;
      notes.forEach(([freq, dur]) => {
        const start = t0 + off;
        const vol = big ? 0.16 : 0.11;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(vol, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.95);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.03);
        if (big) {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.value = freq / 2;
          gain2.gain.setValueAtTime(0.0001, start);
          gain2.gain.exponentialRampToValueAtTime(vol * 0.55, start + 0.015);
          gain2.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.95);
          osc2.connect(gain2).connect(ctx.destination);
          osc2.start(start); osc2.stop(start + dur + 0.03);
        }
        off += dur;
      });
    } catch { /* 音效失败不影响流程 */ }
  }

  function playRewardSound(tone = "coin") {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const notes = tone === "jackpot" ? [523, 659, 784, 1046] : tone === "big" ? [523, 659, 880] : [660, 880];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + index * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.08, now + index * 0.09 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.09 + 0.16);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + index * 0.09);
        osc.stop(now + index * 0.09 + 0.18);
      });
      setTimeout(() => ctx.close?.(), 900);
    } catch {
      // Sound is a bonus; ignore browsers that block it.
    }
  }

  function toggleRewardCollapsed() {
    const reward = readSharedReward();
    writeSharedReward({ collapsed: !reward.collapsed });
    refreshHome({ preserveScroll: true });
  }

  // 整个头部区域既能点按（轻触=展开/收起）又能拖动（按住移动=挪位置），
  // 用移动距离区分两者，不用把点击区和拖拽区拆成两块（此前拆分导致交互割裂、易误触）。
  const REWARD_EDGE_INSET = 16;
  const REWARD_MOBILE_BOTTOM_SAFE = 88;
  const REWARD_DRAG_THRESHOLD = 6;

  function rewardBottomInset() {
    return window.matchMedia?.("(max-width: 980px)")?.matches ? REWARD_MOBILE_BOTTOM_SAFE : REWARD_EDGE_INSET;
  }

  function clampRewardPosition(x, y, width, height) {
    const maxX = Math.max(REWARD_EDGE_INSET, window.innerWidth - width - REWARD_EDGE_INSET);
    const maxY = Math.max(REWARD_EDGE_INSET, window.innerHeight - height - rewardBottomInset());
    return {
      x: Math.min(Math.max(REWARD_EDGE_INSET, x), maxX),
      y: Math.min(Math.max(REWARD_EDGE_INSET, y), maxY),
    };
  }

  function clampRewardIntoViewport(float, options = {}) {
    if (!float?.getBoundingClientRect) return null;
    const rect = float.getBoundingClientRect();
    const next = clampRewardPosition(rect.left, rect.top, rect.width, rect.height);
    float.style.left = `${next.x}px`;
    float.style.top = `${next.y}px`;
    float.style.right = "auto";
    float.style.bottom = "auto";
    if (options.persist) writeSharedReward({ position: { x: Math.round(next.x), y: Math.round(next.y) } });
    return next;
  }

  function handleRewardDragStart(event) {
    const float = event.currentTarget.closest("[data-summer-reward]");
    if (!float) return;
    event.preventDefault();
    const rect = float.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const startX = event.clientX;
    const startY = event.clientY;
    let dragged = false;
    float.setPointerCapture?.(event.pointerId);
    const move = (moveEvent) => {
      if (!dragged) {
        const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
        if (dist < REWARD_DRAG_THRESHOLD) return;
        dragged = true;
      }
      const width = float.offsetWidth || rect.width;
      const height = float.offsetHeight || rect.height;
      const next = clampRewardPosition(moveEvent.clientX - offsetX, moveEvent.clientY - offsetY, width, height);
      float.style.left = `${next.x}px`;
      float.style.top = `${next.y}px`;
      float.style.right = "auto";
      float.style.bottom = "auto";
    };
    const up = () => {
      float.removeEventListener("pointermove", move);
      float.removeEventListener("pointerup", up);
      float.removeEventListener("pointercancel", up);
      float.releasePointerCapture?.(event.pointerId);
      if (dragged) {
        const next = clampRewardIntoViewport(float);
        if (next) writeSharedReward({ position: { x: Math.round(next.x), y: Math.round(next.y) } });
      } else {
        toggleRewardCollapsed();
      }
    };
    float.addEventListener("pointermove", move);
    float.addEventListener("pointerup", up);
    float.addEventListener("pointercancel", up);
  }

  function handleRewardHeadKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleRewardCollapsed();
  }

  async function copyPracticePrompt(task, itemIndex, refreshOptions = { preserveScroll: true }) {
    const item = getPracticeItems(task)[itemIndex];
    if (!item) {
      window.MochiApp?.toast?.("这节课还没补例题截图，先不生成题");
      return;
    }
    const prompt = buildPracticePrompt(task, item);
    const ok = await copyText(prompt);
    setPendingTask(task.id, {
      watched: true,
      practicingAt: taskState(readState(), task.id).practicingAt || new Date().toISOString(),
      promptCopiedAt: new Date().toISOString(),
      lastPromptItemIndex: itemIndex,
      activeStep: 2,
    }, refreshOptions);
    if (ok) {
      window.MochiApp?.toast?.("已复制给 AI，做完后回到这张卡写本节收尾");
    } else {
      showPromptFallback(prompt);
      window.MochiApp?.toast?.("已打开手动复制框，复制给 AI 后回本卡写收尾");
    }
  }

  async function copyExampleQuizPrompt(task, refreshOptions = { preserveScroll: true }) {
    const state = readState();
    const examples = taskExamples(state, task.id);
    if (!examples.length) {
      window.MochiApp?.toast?.("先把这节视频里的例题截图贴进来");
      return;
    }
    const prompt = buildExampleQuizPrompt(task, examples);
    const ok = await copyText(prompt);
    const now = new Date().toISOString();
    const nextState = readState();
    nextState.tasks[task.id] = {
      ...taskState(nextState, task.id),
      watched: true,
      practicingAt: taskState(nextState, task.id).practicingAt || now,
      exampleQuizPromptCopiedAt: now,
      activeStep: 2,
      updatedAt: now,
    };
    if (task.routeVideo) {
      nextState.pendingTaskId = "";
      nextState.pendingRouteDay = task.day;
      nextState.pendingRouteTaskId = task.id;
      nextState.routeDays[task.day] = {
        ...routeDayState(nextState, task.day),
        startedAt: routeDayState(nextState, task.day).startedAt || now,
        updatedAt: now,
      };
    } else {
      nextState.pendingTaskId = task.id;
      nextState.pendingRouteDay = 0;
      nextState.pendingRouteTaskId = "";
    }
    writeState(nextState);
    refreshHome(refreshOptions);
    if (ok) {
      window.MochiApp?.toast?.("已复制测验包：再点“复制图片”一起发给 Gemini，练完回来写收尾");
    } else {
      showPromptFallback(prompt);
      window.MochiApp?.toast?.("已打开手动复制框，复制后连同截图发给 AI，练完回本节点写收尾");
    }
  }

  async function handleExamplePaste(event) {
    const taskId = event.currentTarget.dataset.taskId || "";
    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type?.startsWith("image/"));
    if (!imageItem) return;
    event.preventDefault();
    const file = imageItem.getAsFile();
    await saveExampleFile(taskId, file, event.currentTarget);
  }

  function handleExampleNote(event) {
    const taskId = event.currentTarget.dataset.taskId || "";
    if (!taskId) return;
    const value = String(event.currentTarget.value || "").trim();
    updateTask(taskId, { studyNote: value });
    const hint = event.currentTarget.closest(".summer-route-note")?.querySelector("small");
    if (hint) hint.textContent = value ? "已保存。复习时可以从总计划回看。" : "已清空备注，离开输入框会自动保存。";
  }

  function handleSupportNote(event) {
    const taskId = event.currentTarget.dataset.taskId || "";
    if (!taskId) return;
    updateTaskSupport(taskId, { note: String(event.currentTarget.value || "").trim() });
  }

  function saveTaskReflection(task, trigger) {
    const form = trigger.closest("[data-reflection-form='task']");
    const panel = trigger.closest(".summer-task-reflection-card");
    const root = form || panel;
    if (!root) return;
    const currentState = readState();
    const readiness = taskLearningReadiness(task, currentState);
    if (!readiness.ready) {
      showReflectionMessage(root, `先完成：${readiness.missing.filter((item) => item !== "本节收尾").join(" / ") || "前面步骤"}`);
      return;
    }
    const understanding = root.querySelector("input[name='understanding']:checked")?.value || "";
    const normalizedUnderstanding = normalizeUnderstanding(understanding);
    const reviewCue = String(root.querySelector("[name='reviewCue']")?.value || "").trim();
    const stuckPoint = String(root.querySelector("[name='stuckPoint']")?.value || "").trim();
    const stuckTags = Array.from(root.querySelectorAll("input[name='stuckTags']:checked")).map((item) => item.value);
    if (!normalizedUnderstanding) {
      showReflectionMessage(root, "点一下现在能做到哪一步就行。");
      return;
    }
    const now = new Date().toISOString();
    const reflection = {
      understanding: normalizedUnderstanding,
      reviewCue,
      stuckTags,
      stuckPoint,
      takeaway: reviewCue,
      createdAt: now,
      updatedAt: now,
    };
    const state = readState();
    const current = taskState(state, task.id);
    const originalCompletionDate = String(current.completedAt || "").slice(0, 10);
    const sharedQualDays = readSharedReward().qualDays;
    const legacyAlreadyQualified = originalCompletionDate
      && Array.isArray(sharedQualDays)
      && sharedQualDays.includes(originalCompletionDate);
    state.tasks[task.id] = {
      ...current,
      watched: true,
      completed: true,
      completedAt: current.completedAt || now,
      rewardCompletedAt: current.rewardCompletedAt || (legacyAlreadyQualified ? current.completedAt : now),
      reflectionRequired: true,
      reflectionDone: true,
      reflection,
      studyNote: current.studyNote || [reviewCue, stuckTags.join(" / "), stuckPoint].filter(Boolean).join("；"),
      updatedAt: now,
    };
    writeState(state);
    refreshHome(taskAnchorOptions(task.id, trigger));
    window.MochiApp?.toast?.("学习收尾已保存，下一步已解锁");
  }

  function saveDayReflection(dayNo, trigger) {
    const day = ROUTE_DAYS.find((item) => item.day === Number(dayNo || 0));
    const form = trigger.closest("[data-reflection-form='daily']");
    if (!day || !form) return;
    const mood = form.querySelector("input[name='mood']:checked")?.value || "";
    const best = String(form.querySelector("[name='best']")?.value || "").trim();
    const hardest = String(form.querySelector("[name='hardest']")?.value || "").trim();
    if (!mood) {
      showReflectionMessage(form, "先选一下今天整体状态。");
      return;
    }
    if ((best + hardest).trim().length < 4) {
      showReflectionMessage(form, "至少写一句今天有用的点或最卡的点。");
      return;
    }
    const now = new Date().toISOString();
    const state = readState();
    const current = routeDayState(state, day.day);
    state.routeDays[day.day] = {
      ...current,
      completed: true,
      dailyReflectionRequired: true,
      dailyReflectionDone: true,
      dailyReflection: { mood, best, hardest, createdAt: now, updatedAt: now },
      updatedAt: now,
    };
    if (Number(state.activeRouteDay || 0) === day.day && routeDayCompleted(day, state)) state.activeRouteDay = 0;
    writeState(state);
    refreshHome({ preserveScroll: true });
    window.MochiApp?.toast?.("今日复盘已保存，下一组已解锁");
  }

  // 今日总复盘改为非阻塞：不想写也能直接跳过解锁下一组（标记 skipped，不写内容）
  function skipDayReflection(dayNo) {
    const day = ROUTE_DAYS.find((item) => item.day === Number(dayNo || 0));
    if (!day) return;
    const now = new Date().toISOString();
    const state = readState();
    const current = routeDayState(state, day.day);
    state.routeDays[day.day] = {
      ...current,
      completed: true,
      dailyReflectionRequired: true,
      dailyReflectionDone: true,
      dailyReflectionSkipped: true,
      updatedAt: now,
    };
    if (Number(state.activeRouteDay || 0) === day.day && routeDayCompleted(day, state)) state.activeRouteDay = 0;
    writeState(state);
    refreshHome({ preserveScroll: true });
    window.MochiApp?.toast?.("已跳过，下一组已解锁");
  }

  function showReflectionMessage(form, message) {
    const el = form.querySelector("[data-reflection-message]");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
  }

  async function saveExampleFile(taskId, file, trigger) {
    const task = findSummerTask(taskId);
    if (!task || !file) return;
    if (!String(file.type || "").startsWith("image/")) {
      window.MochiApp?.toast?.("请粘贴一张图片截图");
      return;
    }
    const id = `example_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    try {
      await putExampleImage(id, file);
      const state = readState();
      const current = taskExamples(state, taskId);
      setTaskExamples(state, taskId, [{
        id,
        status: "半会",
        note: "",
        type: file.type || "image/png",
        size: Number(file.size || 0),
        createdAt: new Date().toISOString(),
      }, ...current]);
      state.tasks[taskId] = {
        ...taskState(state, taskId),
        watched: taskState(state, taskId).watched || false,
        updatedAt: new Date().toISOString(),
      };
      writeState(state);
      refreshHome(taskAnchorOptions(taskId, trigger));
      window.MochiApp?.toast?.(`已自动保存到本机：「${task.title}」的视频例题`);
    } catch (error) {
      console.error(error);
      window.MochiApp?.toast?.("截图保存失败：浏览器没有放行本地图片存储");
    }
  }

  function updateExampleMeta(taskId, exampleId, patch) {
    if (!exampleId) return;
    const state = readState();
    const next = taskExamples(state, taskId).map((item) => (
      item.id === exampleId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
    ));
    setTaskExamples(state, taskId, next);
    writeState(state);
  }

  function updateExampleStatusInPlace(trigger, status) {
    const item = trigger?.closest?.(".summer-example-item");
    if (!item) return;
    item.querySelectorAll("[data-example-status]").forEach((button) => {
      button.classList.toggle("selected", button.dataset.exampleStatus === status);
    });
    const title = item.querySelector(".summer-example-meta strong");
    if (title) {
      const parts = String(title.textContent || "").split("·");
      const timeText = parts.slice(1).join("·").trim() || "刚刚";
      title.textContent = `${status} · ${timeText}`;
    }
  }

  async function deleteExample(taskId, exampleId, refreshOptions = { preserveScroll: true }) {
    if (!exampleId) return;
    const state = readState();
    setTaskExamples(state, taskId, taskExamples(state, taskId).filter((item) => item.id !== exampleId));
    writeState(state);
    try {
      await deleteExampleImage(exampleId);
    } catch (error) {
      console.warn(error);
    }
    refreshHome(refreshOptions);
    window.MochiApp?.toast?.("已删除这张例题截图");
  }

  async function copyExampleImage(task, exampleId, trigger = null) {
    const state = readState();
    const examples = taskExamples(state, task.id);
    const targetId = exampleId || examples[0]?.id || "";
    if (!targetId) {
      window.MochiApp?.toast?.("这节课还没有例题图片");
      return;
    }
    markPendingImport(task);
    try {
      const blob = await getExampleImage(targetId);
      if (!blob) {
        window.MochiApp?.toast?.("图片本体没找到，重新粘贴一次截图会更稳");
        return;
      }
      const ok = await copyImageBlob(blob);
      if (ok) {
        refreshHome(taskAnchorOptions(task.id, trigger));
        window.MochiApp?.toast?.("例题图片已复制。现在回 Gemini 对话里粘贴图片。");
        return;
      }
      showImageCopyFallback(blob, task.title);
    } catch (error) {
      console.warn(error);
      window.MochiApp?.toast?.("图片复制失败，已打开手动复制窗口");
      try {
        const blob = await getExampleImage(targetId);
        if (blob) showImageCopyFallback(blob, task.title);
      } catch { /* ignore fallback failure */ }
    }
  }

  async function copyImageBlob(blob) {
    try {
      if (!navigator.clipboard?.write || !window.ClipboardItem) return false;
      const imageBlob = await normalizeClipboardImage(blob);
      await navigator.clipboard.write([
        new ClipboardItem({ [imageBlob.type || "image/png"]: imageBlob }),
      ]);
      return true;
    } catch {
      return false;
    }
  }

  async function normalizeClipboardImage(blob) {
    if ((blob.type || "").toLowerCase() === "image/png") return blob;
    if (!window.createImageBitmap) return blob;
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();
    return new Promise((resolve, reject) => {
      canvas.toBlob((nextBlob) => {
        if (nextBlob) resolve(nextBlob);
        else reject(new Error("convert image failed"));
      }, "image/png");
    });
  }

  function showImageCopyFallback(blob, title) {
    const url = URL.createObjectURL(blob);
    window.MochiApp?.modal?.(`
      <h3>手动复制例题图片</h3>
      <p class="muted">浏览器没有放行“直接复制图片”。右键下面图片复制，或者把图片拖到 Gemini 对话框里。</p>
      <img class="summer-image-copy-fallback" src="${escapeHtml(url)}" alt="${escapeHtml(title || "例题图片")}">
      <button class="btn btn-primary u-full-width u-mt-3" data-action="close-modal" type="button">我处理好了</button>
    `);
  }

  function openExampleDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB unavailable"));
        return;
      }
      const request = window.indexedDB.open(EXAMPLE_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(EXAMPLE_STORE)) db.createObjectStore(EXAMPLE_STORE, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("open IndexedDB failed"));
    });
  }

  async function withExampleStore(mode, callback) {
    const db = await openExampleDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(EXAMPLE_STORE, mode);
      const store = tx.objectStore(EXAMPLE_STORE);
      let result;
      try {
        result = callback(store);
      } catch (error) {
        db.close();
        reject(error);
        return;
      }
      tx.oncomplete = () => {
        db.close();
        resolve(result);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error || new Error("IndexedDB transaction failed"));
      };
    });
  }

  function putExampleImage(id, blob) {
    return withExampleStore("readwrite", (store) => store.put({ id, blob, type: blob.type || "", updatedAt: new Date().toISOString() }));
  }

  function getExampleImage(id) {
    return withExampleStore("readonly", (store) => new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => reject(request.error || new Error("get image failed"));
    }));
  }

  function deleteExampleImage(id) {
    return withExampleStore("readwrite", (store) => store.delete(id));
  }

  function hydrateExampleImages(container) {
    container.querySelectorAll("img[data-example-image-id]").forEach((img) => {
      if (img.dataset.loaded) return;
      img.dataset.loaded = "1";
      getExampleImage(img.dataset.exampleImageId)
        .then((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          img.onload = () => URL.revokeObjectURL(url);
          img.src = url;
          img.hidden = false;
          img.closest(".summer-example-thumb")?.classList.add("loaded");
        })
        .catch((error) => console.warn(error));
    });
  }

  function makeCompletedTaskState(task, stars = 2) {
    const now = new Date().toISOString();
    return {
      watched: true,
      completed: true,
      startedAt: now,
      completedAt: now,
      activeStep: 3,
      linkedLogIds: [`demo_${task.id}`],
      lastImportedRecord: {
        id: `demo_${task.id}`,
        subject: "physics",
        nodeLabel: task.nodeLabel || "物理",
        stars,
      },
      updatedAt: now,
    };
  }

  function loadDemoState(name = "reset") {
    const state = {
      pendingTaskId: "",
      pendingRouteDay: 0,
      activeRouteDay: 0,
      tasks: {},
      routeDays: {},
      routeDetailDay: 0,
      examples: {},
    };
    const now = new Date().toISOString();
    if (name === "unfinished") {
      state.tasks["kinematics-basic"] = makeCompletedTaskState(findTask("kinematics-basic"), 3);
      state.tasks["newton-second-law"] = {
        watched: true,
        practicingAt: now,
        activeStep: 1,
        updatedAt: now,
      };
      state.examples["newton-second-law"] = {
        items: [{
          id: "demo_example_newton",
          status: "不会",
          note: "演示截图元信息；图片本体需要实际粘贴后才有预览。",
          createdAt: now,
        }],
      };
    } else if (name === "unlock-day2") {
      TASKS.slice(0, 3).forEach((task) => { state.tasks[task.id] = makeCompletedTaskState(task, 3); });
    } else if (name === "jump-day5") {
      state.activeRouteDay = 5;
      state.routeDetailDay = 5;
      state.routeDays[5] = { startedAt: now, updatedAt: now };
    } else if (name === "route-day3-pending") {
      TASKS.forEach((task) => { state.tasks[task.id] = makeCompletedTaskState(task, 2); });
      state.activeRouteDay = 3;
      state.pendingRouteDay = 3;
      state.routeDetailDay = 3;
      state.routeDays[3] = { startedAt: now, updatedAt: now };
    } else if (name === "route-day3-done") {
      TASKS.forEach((task) => { state.tasks[task.id] = makeCompletedTaskState(task, 2); });
      state.routeDetailDay = 4;
      state.routeDays[3] = {
        startedAt: now,
        completed: true,
        completedAt: now,
        linkedLogIds: ["demo_route_3"],
        lastImportedRecord: { id: "demo_route_3", subject: "physics", nodeLabel: "运动学", stars: 2 },
        updatedAt: now,
      };
    }
    writeState(state);
    refreshHome();
    window.MochiApp?.toast?.(`已载入暑假任务演示状态：${name}`);
    return state;
  }

  function focusImportBox() {
    const textarea = document.getElementById("record-paste");
    if (!textarea) return false;
    textarea.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => textarea.focus(), 250);
    return true;
  }

  function renderTaskDiagram(task) {
    if (task.diagram !== "force-rope") return "";
    return `
      <div class="summer-diagram" aria-label="重物被水平绳和斜绳拉住的示意图">
        <svg viewBox="0 0 320 190" role="img" aria-label="左绳水平，右绳和竖直方向夹角30度，重物G静止">
          <line x1="34" y1="26" x2="286" y2="26" class="diagram-wall" />
          <line x1="58" y1="94" x2="142" y2="94" class="diagram-rope" />
          <line x1="142" y1="94" x2="220" y2="26" class="diagram-rope" />
          <line x1="142" y1="94" x2="142" y2="132" class="diagram-rope diagram-rope-thin" />
          <line x1="142" y1="94" x2="142" y2="44" class="diagram-guide" />
          <path d="M142 58 A36 36 0 0 1 169 70" class="diagram-arc" />
          <circle cx="142" cy="94" r="5" class="diagram-dot" />
          <rect x="122" y="132" width="40" height="30" rx="6" class="diagram-weight" />
          <text x="38" y="91" class="diagram-label">A</text>
          <text x="228" y="25" class="diagram-label">B</text>
          <text x="132" y="88" class="diagram-label">O</text>
          <text x="132" y="153" class="diagram-label diagram-weight-text">G</text>
          <text x="74" y="84" class="diagram-note">左绳水平</text>
          <text x="195" y="70" class="diagram-note">右斜绳</text>
          <text x="172" y="58" class="diagram-note">30°</text>
          <text x="166" y="122" class="diagram-note">重力向下</text>
        </svg>
      </div>
    `;
  }

  function buildPracticePrompt(task, item) {
    const backupLinks = Array.isArray(task.prep?.backupLinks)
      ? task.prep.backupLinks.map((link) => `${link.label || "资源"}：${link.url}`).join("；")
      : "";
    return [
      `我刚看完「${task.title}」视频。`,
      task.prep?.concepts?.length ? `今天相关基础概念：${task.prep.concepts.join("、")}。如果我概念不清楚，请先用一句话帮我补概念，再带我做题。` : "",
      task.prep?.oneRound ? `如果我做题或听课时卡住，翻书救急范围：${task.prep.oneRound}。` : "",
      task.prep?.backup ? `如果我还是听不懂，备用资源按目录找：${task.prep.backup}。${backupLinks ? `链接：${backupLinks}。` : ""}` : "",
      item.image ? `题目是 MochiStudy 页面上的这张截图：${item.image}。我会把题图一起发给你；如果你没有看到图片，请先提醒我补发题图，不要凭空编题。` : "",
      `请用零基础方式带我做这道过关小题：${item.question}`,
      item.hint ? `我希望你重点提醒我：${item.hint}` : "",
      "请一步步问我，不要直接给答案；如果我不会，先用更简单的问题铺垫。",
      "最后请按 MochiStudy 格式输出一条 MOCHI-RECORD。",
    ].filter(Boolean).join("\n");
  }

  function buildExampleQuizPrompt(task, examples) {
    const backupLinks = Array.isArray(task.prep?.backupLinks)
      ? task.prep.backupLinks.map((link) => `${link.label || "资源"}：${link.url}`).join("；")
      : "";
    const exampleLines = examples.map((item, index) => {
      const status = item.status || "半会";
      const note = item.note || "视频例题截图";
      return `例题截图 ${index + 1}：掌握状态=${status}；收集时间=${formatExampleDate(item.createdAt)}；备注=${note}`;
    }).join("\n");
    return [
      `我要根据刚学的视频生成同类测验。`,
      `视频/主题：${task.title}`,
      task.source ? `来源：${task.source}${task.duration ? `，时长 ${task.duration}` : ""}` : "",
      task.videoTitle ? `视频标题/分集：${task.videoTitle}` : "",
      task.url ? `视频链接：${task.url}` : "",
      task.prep?.concepts?.length ? `本节相关概念：${task.prep.concepts.join("、")}。` : "",
      task.prep?.backup ? `卡住时备用范围：${task.prep.backup}。${backupLinks ? `资源链接：${backupLinks}。` : ""}` : "",
      "",
      "我会先粘贴这段文字，然后回 MochiStudy 点“复制图片”，把例题截图粘到同一个对话里。你必须先看截图；如果没收到图片，请只提醒我继续粘图，不要凭空编题。",
      exampleLines,
      "",
      "请按这个流程带我练：",
      "1. 先识别每张截图考的知识点、用到的方法、最容易错在哪里。",
      "2. 基于截图里的题型，生成 2-4 道同类变式题，从最简单到稍微变式。题目必须适合基础很差的学生。",
      "3. 如果题目依赖图像、受力图、电路图或函数图像，请把图形关系说清楚，必要时用简单 ASCII/文字标注；不要用抽象的 theta、v0 这类学生不直观的变量，尽量用中文量和具体数字。",
      "4. 一次只给我一题，不要直接给答案。先让我写思路；我不会时，你用更小的问题一步步引导。",
      "5. 全部练完后，请按 MochiStudy 格式输出一条 MOCHI-RECORD，卡点要写清楚是哪类方法没掌握。",
    ].filter((line) => line !== "").join("\n");
  }

  async function copyText(text) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise((_, reject) => setTimeout(() => reject(new Error("clipboard timeout")), 900)),
      ]);
      return true;
    } catch { /* fallback below */ }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      textarea.remove();
      return ok;
    } catch {
      return false;
    }
  }

  function showPromptFallback(prompt) {
    showTextFallback("复制过关小题 Prompt", "浏览器没有放行剪贴板。点下面文本框后 Ctrl+A / Ctrl+C，再粘给 AI。", prompt);
  }

  function showTextFallback(title, hint, text) {
    window.MochiApp?.modal?.(`
      <h3>${escapeHtml(title)}</h3>
      <p class="muted">${escapeHtml(hint)}</p>
      <textarea class="summer-prompt-fallback" rows="9" readonly>${escapeHtml(text)}</textarea>
      <button class="btn btn-primary u-full-width u-mt-3" data-action="close-modal" type="button">我复制好了</button>
    `);
    setTimeout(() => {
      const textarea = document.querySelector(".summer-prompt-fallback");
      textarea?.focus();
      textarea?.select();
    }, 40);
  }

  function taskAnchorOptions(taskId, trigger) {
    const exampleBox = trigger?.closest?.("[data-summer-example-task-id]");
    if (exampleBox) {
      const selector = `[data-summer-example-task-id="${escapeSelectorAttr(taskId)}"]`;
      return elementAnchorOptions(exampleBox, selector);
    }
    const card = trigger?.closest?.("[data-summer-task-id]");
    const selector = `[data-summer-task-id="${escapeSelectorAttr(taskId)}"]`;
    return elementAnchorOptions(card || trigger, selector);
  }

  function elementAnchorOptions(element, selector) {
    const rect = element?.getBoundingClientRect?.();
    if (!rect) return { preserveScroll: true };
    return { preserveScroll: true, preserveAnchor: { selector, top: rect.top } };
  }

  function escapeSelectorAttr(value) {
    return String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function refreshHome(options = {}) {
    const anchor = options.preserveAnchor;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const view = document.getElementById("view");
    if (view && view.querySelector(".home-flow")) window.MochiFarm?.renderFarm?.(view);
    if (anchor?.selector && Number.isFinite(anchor.top)) {
      const restoreAnchor = () => {
        const next = document.querySelector(anchor.selector);
        if (!next) {
          if (options.preserveScroll) window.scrollTo(scrollX, scrollY);
          return;
        }
        const delta = next.getBoundingClientRect().top - anchor.top;
        if (Math.abs(delta) <= 0.5) return;
        // 锚点在 28 天总览覆盖层里时，滚它自己的内部滚动条而不是窗口：
        // 详情区高度会随选中天变化，只有锚定到点击的那天、按位移补覆盖层滚动，才不会跳
        const overlay = next.closest(".summer-route-overlay");
        if (overlay) overlay.scrollTop += delta;
        else window.scrollTo(scrollX, window.scrollY + delta);
      };
      requestAnimationFrame(() => {
        restoreAnchor();
        requestAnimationFrame(restoreAnchor);
      });
      setTimeout(restoreAnchor, 80);
      setTimeout(restoreAnchor, 220);
      return;
    }
    if (options.preserveScroll) {
      const restoreScroll = () => window.scrollTo(scrollX, scrollY);
      if (options.lockScroll) restoreScroll();
      requestAnimationFrame(restoreScroll);
    }
  }

  function escapeHtml(value) {
    return window.MochiApp?.escapeHtml?.(value) ?? String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  window.MochiSummerTasks = {
    render,
    bind,
    attachImportedRecord,
    progress,
    renderRouteOverviewCard,
    renderRouteEntry,
    getTasks: () => TASKS.slice(),
    getRewardHistory: () => readSharedReward().history,
    // 独立于路由/渲染路径调用：结算今日小奖 + 回填历史达标日 + 发券。之前只在首页"今日能量"浮窗
    // 渲染时才作为副作用调用，导致学生若不在首页刷新页面，同步（含历史回填）永远不会触发。
    // app.js 的 init() 会在每次打开页面时无条件调一次，不再依赖用户停在哪个路由。
    syncEconomy: () => syncEconomy(),
    // 暑假荣誉/收集统计（跨三科），供勋章页显示暑假专属成就；纯荣誉、不发钱（钱只走能量浮窗抽奖，单一预算口）
    getSummerHonorStats: () => {
      let nodesCompleted = 0;
      Object.values(STATE_KEYS).forEach((key) => {
        try {
          const st = JSON.parse(localStorage.getItem(key) || "null") || {};
          const tasks = st.tasks && typeof st.tasks === "object" ? st.tasks : {};
          Object.values(tasks).forEach((info) => { if (info && info.completed) nodesCompleted += 1; });
        } catch { /* 单科损坏跳过 */ }
      });
      const r = readSharedReward();
      return {
        nodesCompleted,
        qualDays: Array.isArray(r.qualDays) ? r.qualDays.length : 0,
        stages: Number(r.stages || 0),
      };
    },
    // 调试用：诊断"历史节点为什么没同步进能量经济"——逐科统计任务数/已完成数/completedAt缺失数/
    // 已识别的历史达标日，方便判断是"数据本来就没有"还是"数据有但字段不匹配同步不上"。
    debugDiagnoseHistory: () => {
      syncEconomy(); // 诊断前先真正结算一次，顺手把之前因为没在首页触发而漏掉的历史回填补上
      const perSubject = {};
      Object.entries(STATE_KEYS).forEach(([subject, key]) => {
        let taskCount = 0, completedCount = 0, missingCompletedAt = 0;
        const sample = [];
        try {
          const st = JSON.parse(localStorage.getItem(key) || "null");
          const tasks = st && st.tasks && typeof st.tasks === "object" ? st.tasks : {};
          Object.entries(tasks).forEach(([taskId, info]) => {
            taskCount += 1;
            if (info && info.completed) {
              completedCount += 1;
              const d = String(info.completedAt || "").slice(0, 10);
              if (!d) missingCompletedAt += 1;
              if (sample.length < 5) sample.push({ taskId, completedAt: info.completedAt || "(无)" });
            }
          });
        } catch (e) { sample.push({ error: String(e) }); }
        perSubject[subject] = { key, taskCount, completedCount, missingCompletedAt, sample };
      });
      const r = readSharedReward();
      return {
        perSubject,
        qualifyingDatesFound: qualifyingDatesFromHistory(),
        sharedReward: { qualDays: r.qualDays, dailyTickets: r.dailyTickets, stageTickets: r.stageTickets, stages: r.stages },
      };
    },
    debugGrantTickets: (d = 1, s = 1) => {
      const r = readSharedReward();
      writeSharedReward({ dailyTickets: Number(r.dailyTickets || 0) + d, stageTickets: Number(r.stageTickets || 0) + s });
    },
    // 调试用：把统一奖励状态清回初始（清空预算计数/券/历史/进行中的抽奖盘），撞上限后可重新测抽奖
    debugResetReward: () => {
      econAnimActive = false;
      window.clearTimeout(econAnimTimer);
      econAnimTimer = null;
      localStorage.removeItem(SHARED_REWARD_KEY);
    },
    loadDemoState,
    openTaskImportDock,
    openTaskFollowup,
  };
})();
