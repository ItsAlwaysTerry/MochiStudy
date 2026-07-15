(function () {
  const STATE_KEY = "summer_task_state";
  const BASIC_2045_URL = "https://space.bilibili.com/23630128/lists/2045?type=season";
  const BASIC_2181_URL = "https://space.bilibili.com/23630128/lists/2181?type=season";
  const ONE_ROUND_URL = "https://space.bilibili.com/23630128/lists/340933?type=series";
  const XHS_STRATEGY_URL = "https://www.xiaohongshu.com/explore/6955e1e0000000001d03b300";
  const XHS_FORMULA_URL = "https://www.xiaohongshu.com/explore/695de9b9000000000b009294";
  const XHS_LEVEL_URL = "https://www.xiaohongshu.com/explore/697b4bd8000000000a02f417";
  const EXAMPLE_DB_NAME = "mochi_summer_examples";
  const EXAMPLE_STORE = "images";
  let examplePointerAnchor = null;
  const ONE_ROUND_BVS = {
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
  const ROUTE_VIDEO_LIBRARY = {
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

  const TASKS = [
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

  const ROUTE_DAYS = [
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

  function readState() {
    const fallback = { pendingTaskId: "", pendingRouteDay: 0, pendingRouteTaskId: "", activeTaskId: "", activeRouteDay: 0, tasks: {}, routeDays: {}, routeDetailDay: 0, examples: {} };
    try {
      const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
      if (!saved || typeof saved !== "object") return fallback;
      return {
        pendingTaskId: String(saved.pendingTaskId || ""),
        pendingRouteDay: Number(saved.pendingRouteDay || 0),
        pendingRouteTaskId: String(saved.pendingRouteTaskId || ""),
        activeTaskId: String(saved.activeTaskId || ""),
        activeRouteDay: Number(saved.activeRouteDay || 0),
        tasks: saved.tasks && typeof saved.tasks === "object" ? saved.tasks : {},
        routeDays: saved.routeDays && typeof saved.routeDays === "object" ? saved.routeDays : {},
        routeDetailDay: Number(saved.routeDetailDay || 0),
        examples: saved.examples && typeof saved.examples === "object" ? saved.examples : {},
      };
    } catch {
      return fallback;
    }
  }

  function writeState(state) {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function taskState(state, id) {
    return state.tasks[id] || {};
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

  function setPendingTask(id, patch = {}, options = {}) {
    const state = readState();
    state.pendingTaskId = id;
    state.activeTaskId = id;
    state.tasks[id] = {
      ...taskState(state, id),
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    writeState(state);
    refreshHome(options);
  }

  function attachImportedRecord(logEntry) {
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
    state.activeTaskId = "";
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

  function routeVideoTask(day, video) {
    const concepts = Array.isArray(day.focus) ? day.focus : [];
    return {
      id: `route-day-${day.day}-${video.key}`,
      title: video.title || day.title,
      subject: "physics",
      nodeLabel: inferRouteNodeLabel(day),
      day: day.day,
      source: video.source || "B站资源",
      duration: video.duration || "按需观看",
      url: routeVideoUrl(video),
      videoTitle: video.part || video.title || day.title,
      focusMins: 35,
      routeVideo: true,
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
      subject: "physics",
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

  function routeDayCompleted(day, state) {
    return routeDayLearningReady(day, state) && dayReflectionDone(day, state);
  }

  function routeDayLearningReady(day, state) {
    const tasks = routeTasks(day);
    const taskPool = tasks.length ? tasks : routeVideoTasks(day);
    return taskPool.length > 0 && taskPool.every((task) => taskReadyToAdvance(task, state));
  }

  function routeDayStarted(day, state) {
    const tasks = routeTasks(day);
    const taskPool = tasks.length ? tasks : routeVideoTasks(day);
    if (!taskPool.length) return Boolean(state.routeDays?.[day.day]?.startedAt);
    return taskPool.some((task) => {
      const info = taskState(state, task.id);
      return Boolean(info.startedAt || info.lastFocusedAt || info.watched || info.practicingAt || info.completed);
    }) || Boolean(state.routeDays?.[day.day]?.startedAt);
  }

  function taskReflectionDone(info) {
    if (!info?.completed) return false;
    if (!info.reflectionRequired) return true;
    return Boolean(info.reflectionDone);
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
    return tasks.find((task) => !taskReadyToAdvance(task, state)) || tasks[0] || routeSheetTask(day);
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
    if (pendingDay) return pendingDay.day;
    const activeDay = ROUTE_DAYS.find((day) => day.day === Number(state.activeRouteDay || 0));
    if (activeDay && !routeDayCompleted(activeDay, state)) return activeDay.day;
    const pendingRouteDay = ROUTE_DAYS.find((day) => day.day === Number(state.pendingRouteDay || 0));
    if (pendingRouteDay && !routeDayCompleted(pendingRouteDay, state)) return pendingRouteDay.day;
    const firstOpenDay = ROUTE_DAYS.find((day) => !routeDayCompleted(day, state));
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
    const pending = findTask(state.pendingTaskId);
    const activeDay = ROUTE_DAYS.find((day) => day.day === Number(state.activeRouteDay || 0));
    if (activeDay && !routeDayCompleted(activeDay, state)) {
      const activeTasks = routeTasks(activeDay).filter((task) => !taskReadyToAdvance(task, state));
      if (activeTasks.length) return activeTasks.slice(0, limit);
      return [];
    }
    const openTasks = TASKS.filter((task) => !taskReadyToAdvance(task, state));
    const ordered = pending ? [pending, ...openTasks.filter((task) => task.id !== pending.id)] : openTasks;
    return ordered.slice(0, limit);
  }

  function nextRoutePlanDay(state) {
    const activeDay = ROUTE_DAYS.find((day) => day.day === Number(state.activeRouteDay || 0));
    if (activeDay && !routeTasks(activeDay).length && !routeDayCompleted(activeDay, state)) return activeDay;
    return ROUTE_DAYS.find((day) => !routeTasks(day).length && !routeDayCompleted(day, state)) || null;
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

    if (/力学|运动|受力|牛二|平抛|圆周|万有引力/.test(focusText)) add("基础课目录找当天关键词", BASIC_2045_URL);
    if (/功|电|磁|波|热学|光学|原子/.test(focusText)) add("基础课目录找当天关键词", BASIC_2181_URL);
    add("小红书基础题拿分公式", XHS_FORMULA_URL);
    if (/实验|热学|光学|原子|磁场|电磁/.test(focusText)) add("小红书 60 分以下提分思路", XHS_STRATEGY_URL);
    if (/综合|小卷|复盘|错题|下一轮|公式/.test(focusText)) add("小红书分数段视频汇总", XHS_LEVEL_URL);
    return links.slice(0, 5);
  }

  function render() {
    const state = readState();
    const queue = rollingTasks(state, 3);
    const planDay = queue.length ? null : nextRoutePlanDay(state);
    const activeDay = ROUTE_DAYS.find((day) => day.day === Number(state.activeRouteDay || 0));
    const completedDetailed = TASKS.filter((task) => taskReadyToAdvance(task, state)).length;
    const remainingDetailed = TASKS.length - completedDetailed;
    const pendingRoute = ROUTE_DAYS.find((day) => day.day === Number(state.pendingRouteDay || 0));
    const dailyGate = pendingDailyReflectionDay(state);
    const hero = buildHeroSummary(state, queue, planDay, remainingDetailed, pendingRoute, dailyGate);
    return `
      <section class="card summer-task-card">
        <div class="summer-route-hero">
          <div>
            <p class="summer-kicker">暑假物理滚动任务</p>
            <h3>${escapeHtml(hero.title)}</h3>
            <p>${escapeHtml(hero.description)}</p>
          </div>
          <div class="summer-hero-stats" aria-label="今日暑假物理任务概览">
            ${hero.stats.map((item) => `
              <div class="summer-hero-stat">
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.value)}</strong>
                ${item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}
              </div>
            `).join("")}
          </div>
        </div>
        <div class="summer-route-meta">
          <span>未完成自动顺延</span>
          <span>看完视频要留例题截图</span>
          <span>写完本节收尾才会顺延</span>
        </div>
        ${activeDay && !routeDayCompleted(activeDay, state) ? `
          <div class="summer-active-day-bar">
            <span>当前锁定：第 ${activeDay.day} 天 · ${escapeHtml(activeDay.title)}</span>
            <button class="btn btn-soft btn-sm" data-summer-action="route-auto" type="button">回到自动顺延</button>
          </div>
        ` : ""}
        ${queue.length ? renderRollingQueue(queue, state, remainingDetailed) : renderRouteLearningSheet(planDay, state, { pendingRoute })}
        ${dailyGate ? renderDailyReflectionOverlay(dailyGate, state) : ""}
      </section>
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
          { label: "今日任务", value: "已完成", note: "待复盘" },
          { label: "复盘", value: "必填", note: "30 秒" },
          { label: "下一组", value: "待解锁", note: "写完出现" },
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
          { label: "当前显示", value: `${queue.length} 项`, note: "先做最前面" },
          { label: "剩余详细课", value: `${remainingDetailed} 节`, note: "完成后顺延" },
        ],
      };
    }
    if (planDay) {
      const videos = routeVideos(planDay);
      const tasks = routeVideoTasks(planDay);
      const exampleCount = tasks.reduce((sum, task) => sum + taskExamples(state, task.id).length, 0);
      const completed = routeDayCompleted(planDay, state);
      const pending = Number(pendingRoute?.day || 0) === planDay.day;
      const readyCount = tasks.filter((task) => taskReadyToAdvance(task, state)).length;
      return {
        title: `第 ${planDay.day} 天：${planDay.title}`,
        description: planDay.subtitle,
        stats: [
          { label: "今日资源", value: videos.length ? `${videos.length} 个视频` : "1 张学习单", note: videos.length ? "按顺序看" : "按资料执行" },
          { label: "例题截图", value: `${exampleCount} 张`, note: "看课时收集" },
          { label: "本节收尾", value: completed ? "已完成" : `${readyCount}/${tasks.length}`, note: pending ? "有记录待归档" : "写完变绿" },
        ],
      };
    }
    return {
      title: "28 天物理路线已完成",
      description: "可以导出学习档案，回看最卡的 3 个点，再决定下一轮。",
      stats: [
        { label: "路线", value: "已跑完", note: "准备复盘" },
        { label: "下一步", value: "导出档案", note: "看卡点" },
      ],
    };
  }

  function renderRouteOverviewCard() {
    const state = readState();
    const currentDayNo = currentRouteDay(state);
    const selectedDay = selectedRouteDay(state, currentDayNo);
    const stat = routeStats(state);
    const taskStat = progress(state);
    return `
      <section class="card summer-route-card">
        <div class="summer-route-card-head">
          <div>
            <p class="summer-kicker">暑假物理 28 天路线</p>
            <h3>总计划</h3>
            <p>前 7 节是完整视频任务；第 3-28 天在学习单里列主线视频、例题截图、本节收尾和统一导入入口。</p>
          </div>
          <div class="summer-route-card-stats">
            <span>已完成 ${stat.completed}/28 天</span>
            <span>详细视频 ${taskStat.completed}/${taskStat.total} 节</span>
          </div>
        </div>
        <div class="summer-progress-track"><div class="summer-progress-fill" style="width:${stat.pct}%"></div></div>
        ${renderRouteDayDetail(selectedDay, state, currentDayNo)}
        ${renderRouteOverview(state, currentDayNo, selectedDay.day)}
      </section>
    `;
  }

  function renderRollingQueue(tasks, state, remainingDetailed) {
    const pendingTask = findTask(state.pendingTaskId);
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
          <div>
            <strong>${pendingTask ? "当前有关联导入" : "当前只看这几条"}</strong>
            <span>还剩 ${remainingDetailed} 节详细任务</span>
          </div>
          <p>${nextText}</p>
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
              <p>这一组已经完成。先留下今天的总体感受，写完才会解锁下一组。</p>
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
          <label class="summer-reflection-field compact">
            <span>明天开始前先看</span>
            <input name="tomorrow" value="${escapeHtml(draft.tomorrow || "")}" placeholder="例如：先复习 v-t 图像面积">
          </label>
          <p class="summer-reflection-message" data-reflection-message></p>
          <button class="btn btn-primary summer-reflection-submit" data-summer-action="save-day-reflection" data-route-day="${day.day}" type="button">
            <span class="material-symbols-outlined">arrow_forward</span>保存复盘，解锁下一组
          </button>
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
      { value: "ok", label: "正常" },
      { value: "tired", label: "累" },
      { value: "smooth", label: "顺" },
      { value: "stuck", label: "崩" },
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
            <strong>物理 28 天主线已跑完</strong>
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
          ${renderUnifiedImportHint(day, state)}
          <div class="summer-sheet-links">
            ${resources.map((link) => `
              <a class="btn btn-soft btn-sm" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
                <span class="material-symbols-outlined">open_in_new</span>${escapeHtml(link.label)}
              </a>
            `).join("")}
            <button class="btn btn-soft btn-sm" data-summer-action="route-focus" data-route-day="${day.day}" type="button">
              <span class="material-symbols-outlined">timer</span>开始专注
            </button>
            <button class="btn btn-primary btn-sm" data-summer-action="route-import" data-route-day="${day.day}" type="button">
              <span class="material-symbols-outlined">download_done</span>${isPending ? "去粘贴记录" : "统一导入记录"}
            </button>
          </div>
          ${routeInfo.lastImportedRecord ? `<p class="summer-import-done">已完成：${escapeHtml(routeInfo.lastImportedRecord.nodeLabel || "物理")} · ${"★".repeat(Number(routeInfo.lastImportedRecord.stars || 0))}</p>` : ""}
        </div>
      </div>
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
        ${videos.map((video) => {
          const task = routeVideoTask(day, video);
          const step = routeVideoStepState(day, task, state);
          return `
            <div class="summer-route-step ${step.tone}">
              <div class="summer-route-step-marker" aria-label="${escapeHtml(step.label)}">
                <span class="material-symbols-outlined">${escapeHtml(step.icon)}</span>
              </div>
              <div class="summer-route-step-body">
                <article class="summer-route-video-card" data-summer-task-id="${escapeHtml(task.id)}">
                  <div class="summer-route-video-main">
                    <span class="summer-route-video-order">${escapeHtml(String(videos.indexOf(video) + 1))}</span>
                    <div>
                      <strong>${escapeHtml(video.title)}</strong>
                      <p>${escapeHtml(video.source || "B站资源")} · ${escapeHtml(video.duration || "按需观看")} · ${escapeHtml(video.part || video.title)}</p>
                      <small>${escapeHtml(step.label)} · ${escapeHtml(video.require || "截 1 张代表例题，后面用来生成同类测验。")}</small>
                    </div>
                  </div>
                  <div class="summer-route-video-actions">
                    <a class="btn btn-soft btn-sm" href="${escapeHtml(task.url)}" target="_blank" rel="noreferrer">
                      <span class="material-symbols-outlined">open_in_new</span>打开视频
                    </a>
                    <button class="btn btn-soft btn-sm" data-summer-action="focus" data-task-id="${escapeHtml(task.id)}" type="button">
                      <span class="material-symbols-outlined">timer</span>开始专注
                    </button>
                  </div>
                </article>
                ${renderExampleCollector(task, state, { compact: true })}
                ${renderTaskReflectionPanel(task, state)}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function routeVideoStepState(day, task, state) {
    const info = taskState(state, task.id);
    const examples = taskExamples(state, task.id);
    if (taskReadyToAdvance(task, state)) {
      return { tone: "done", icon: "check_circle", label: "已完成" };
    }
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
    const nextTask = tasks.find((task) => !taskReadyToAdvance(task, state));
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
        const needsReflection = info.completed && !info.reflectionDone;
        const status = ready ? "已完成" : needsReflection ? "待收尾" : info.exampleQuizPromptCopiedAt ? "待写收尾" : examples.length ? `已收 ${examples.length} 图` : info.lastFocusedAt ? "已开始" : "未开始";
        const tone = ready ? "done" : needsReflection || info.exampleQuizPromptCopiedAt || examples.length || info.lastFocusedAt ? "active" : "";
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
    return `
      <article class="summer-route-preview-item ${item.tone}">
        <div class="summer-route-preview-main">
          <span class="material-symbols-outlined">${item.tone === "done" ? "check_circle" : item.tone === "active" ? "radio_button_checked" : "radio_button_unchecked"}</span>
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
    const needsReflection = info.completed && info.reflectionRequired && !info.reflectionDone;
    const status = needsReflection ? "待收尾" : info.completed ? "已完成" : info.practicingAt ? "做题中" : info.watched ? "已看视频" : "未开始";
    const tone = needsReflection ? "active" : info.completed ? "done" : info.watched || info.practicingAt ? "active" : "";
    return `
      <div class="summer-route-detail-task ${tone}">
        <span class="material-symbols-outlined">${needsReflection ? "rate_review" : info.completed ? "check_circle" : info.watched ? "radio_button_checked" : "play_circle"}</span>
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
    const labels = { ok: "正常", tired: "累", smooth: "顺", stuck: "崩" };
    return `
      <div class="summer-day-reflection-review">
        <div>
          <strong>今日总复盘 · ${escapeHtml(labels[reflection.mood] || "已记录")}</strong>
          <span>${reflection.updatedAt || reflection.createdAt ? escapeHtml(formatExampleDate(reflection.updatedAt || reflection.createdAt)) : ""}</span>
        </div>
        ${reflection.best ? `<p><span>最有用</span>${escapeHtml(reflection.best)}</p>` : ""}
        ${reflection.hardest ? `<p><span>最卡</span>${escapeHtml(reflection.hardest)}</p>` : ""}
        ${reflection.tomorrow ? `<p><span>下次先看</span>${escapeHtml(reflection.tomorrow)}</p>` : ""}
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
    return `
      <div class="summer-day-group">
        <div class="summer-day-title">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(subtitle)}</span>
        </div>
        <div class="summer-task-list">
          ${tasks.map((task) => renderTask(task, state)).join("")}
        </div>
      </div>
    `;
  }

  function renderTask(task, state) {
    const s = taskState(state, task.id);
    const isPending = state.pendingTaskId === task.id;
    const completed = taskReadyToAdvance(task, state);
    const imported = Boolean(s.completed);
    const watched = Boolean(s.watched);
    const needsReflection = Boolean(imported && s.reflectionRequired && !s.reflectionDone);
    const flow = getTaskFlow(task, s, isPending);
    const selectedStep = selectedTaskStep(s, flow);
    return `
      <article class="summer-task ${completed ? "completed" : ""} ${isPending ? "pending-import" : ""} ${needsReflection ? "needs-reflection" : ""}" data-summer-task-id="${escapeHtml(task.id)}">
        <div class="summer-task-main">
          <div class="summer-task-title-row">
            <span class="summer-task-check material-symbols-outlined">${needsReflection ? "rate_review" : completed ? "check_circle" : watched ? "radio_button_checked" : "radio_button_unchecked"}</span>
            <div>
              <h4>${escapeHtml(task.title)}</h4>
              <p>${escapeHtml(task.source)} · ${escapeHtml(task.duration)} · ${escapeHtml(task.videoTitle)}</p>
            </div>
          </div>
          ${renderTaskStepper(task, flow, selectedStep)}
          ${renderTaskStepPanel(task, selectedStep, flow, s)}
          ${renderExampleCollector(task, state)}
          ${renderTaskReflectionPanel(task, state, { forceOpen: needsReflection })}
          ${isPending ? `<p class="summer-import-waiting">测验包已关联这节课；AI 练题后的 MOCHI-RECORD 统一粘到页面导入框，收尾仍在这里写。</p>` : ""}
          ${imported && s.lastImportedRecord ? `<p class="summer-import-done">${needsReflection ? "已归档，待本节收尾：" : "已归档："}${escapeHtml(s.lastImportedRecord.nodeLabel || "物理")} · ${"★".repeat(Number(s.lastImportedRecord.stars || 0))}</p>` : ""}
        </div>
        ${renderTaskActions(task, flow)}
      </article>
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
            <p>${readiness.ready ? "做完 AI 练题后，只留一句给未来自己的提醒，写完这个节点变绿。" : `先完成：${escapeHtml(readiness.missing.filter((item) => item !== "本节收尾").join(" / ") || "前面步骤")}`}</p>
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
              <span>下次看到这类题，先提醒自己什么？</span>
              <textarea name="reviewCue" rows="2" placeholder="例如：先画 v-t 图，再用面积找位移。">${escapeHtml(reflection.reviewCue || reflection.takeaway || "")}</textarea>
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
      return { step: 3, action: "done", label: "已完成", icon: "check_circle", tone: "done", hasPractice };
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

  function renderTaskStepper(task, flow, selectedStep) {
    const steps = ["看视频", "做题", "收尾", "完成"];
    return `
      <div class="summer-stepper" aria-label="任务步骤">
        ${steps.map((label, index) => `
          <button class="${index < flow.step ? "done" : index === flow.step ? "active" : ""} ${index === selectedStep ? "selected" : ""}" data-summer-action="show-step" data-task-id="${escapeHtml(task.id)}" data-step="${index}" type="button" aria-pressed="${index === selectedStep ? "true" : "false"}">
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
        <section class="summer-step-panel">
          <div class="summer-step-panel-head">
            <span class="material-symbols-outlined">play_circle</span>
            <div>
              <strong>先看主线视频</strong>
              <p>${escapeHtml(task.source)} · ${escapeHtml(task.duration)} · 建议专注 ${Number(task.focusMins || 25)} 分钟</p>
            </div>
          </div>
          <div class="summer-step-actions">
            <a class="btn btn-primary btn-sm" href="${escapeHtml(task.url)}" target="_blank" rel="noreferrer">
              <span class="material-symbols-outlined">open_in_new</span>打开资源
            </a>
            <button class="btn btn-soft btn-sm" data-summer-action="focus" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">timer</span>开始专注
            </button>
            <button class="btn btn-soft btn-sm" data-summer-action="watched-next" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">visibility</span>我看完了
            </button>
          </div>
        </section>
      `;
    }
    if (selectedStep === 1) {
      return `
        <section class="summer-step-panel summer-step-panel-practice">
          <div class="summer-step-panel-head">
            <span class="material-symbols-outlined">edit_note</span>
            <div>
              <strong>做过关小题</strong>
              <p>${practiceItems.length ? `这节课有 ${practiceItems.length} 道小题。先自己想，再复制给 AI 带做。` : "这节课先收集视频例题截图，再用 MOCHI-RECORD 完成学习闭环。"}</p>
            </div>
          </div>
          ${renderPrep(task)}
          ${renderPracticeItems(task, practiceItems)}
        </section>
      `;
    }
    if (selectedStep === 2) {
      const readyToReflect = Boolean(taskInfo.completed || taskInfo.exampleQuizPromptCopiedAt || taskInfo.promptCopiedAt);
      return `
        <section class="summer-step-panel">
          <div class="summer-step-panel-head">
            <span class="material-symbols-outlined">edit_note</span>
            <div>
              <strong>本节收尾</strong>
              <p>${readyToReflect ? "回到下面的收尾卡，写一句收获和一句卡点；MOCHI-RECORD 统一粘到页面导入框归档。" : "先完成做题或复制同类测验包，再写本节收尾。"}</p>
            </div>
          </div>
          <div class="summer-step-actions">
            <button class="btn btn-primary btn-sm" data-summer-action="open-reflection" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">edit_note</span>去写本节收尾
            </button>
            ${practiceItems.length ? `
              <button class="btn btn-soft btn-sm" data-summer-action="copy-first-prompt" data-task-id="${escapeHtml(task.id)}" type="button">
                <span class="material-symbols-outlined">content_copy</span>复制第 1 题给 AI
              </button>
            ` : ""}
          </div>
        </section>
      `;
    }
    return `
      <section class="summer-step-panel ${taskInfo.completed && (!taskInfo.reflectionRequired || taskInfo.reflectionDone) ? "done" : ""}">
        <div class="summer-step-panel-head">
          <span class="material-symbols-outlined">${taskInfo.completed && (!taskInfo.reflectionRequired || taskInfo.reflectionDone) ? "check_circle" : "flag"}</span>
          <div>
            <strong>${taskInfo.completed && (!taskInfo.reflectionRequired || taskInfo.reflectionDone) ? "这节已完成" : "完成条件"}</strong>
            <p>${taskInfo.completed && (!taskInfo.reflectionRequired || taskInfo.reflectionDone) ? "已经写完本节收尾，后面复习能回看。" : "看完视频、做完练题，并保存本节收尾后才会顺延。"}</p>
          </div>
        </div>
      </section>
    `;
  }

  function renderTaskActions(task, flow) {
    const disabled = flow.action === "done" ? " disabled" : "";
    const primaryClass = flow.tone === "done" ? "btn-soft" : "btn-primary";
    return `
      <div class="summer-task-actions">
        <button class="btn ${primaryClass} btn-sm summer-next-btn" data-summer-action="${escapeHtml(flow.action)}" data-task-id="${escapeHtml(task.id)}" type="button"${disabled}>
          <span class="material-symbols-outlined">${escapeHtml(flow.icon)}</span>${escapeHtml(flow.label)}
        </button>
        <details class="summer-more-actions">
          <summary>更多操作</summary>
          <div>
            <a class="btn btn-soft btn-sm" href="${escapeHtml(task.url)}" target="_blank" rel="noreferrer">
              <span class="material-symbols-outlined">open_in_new</span>打开资源
            </a>
            <button class="btn btn-soft btn-sm" data-summer-action="focus" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">timer</span>开始专注
            </button>
            <button class="btn btn-soft btn-sm" data-summer-action="practice" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">edit_note</span>${flow.hasPractice ? "做小题" : "收集例题"}
            </button>
            <button class="btn btn-soft btn-sm" data-summer-action="watched" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">visibility</span>标记看完
            </button>
          </div>
        </details>
      </div>
    `;
  }

  function renderExampleCollector(task, state, options = {}) {
    const examples = taskExamples(state, task.id);
    const compact = Boolean(options.compact);
    const title = compact ? "例题截图" : "视频例题截图";
    const helper = examples.length
      ? `已自动保存 ${examples.length} 张到本机。点“同类测验包”，再把这些截图一起发给 AI。`
      : compact ? "截老师讲的代表题，点左侧后 Ctrl+V，会自动保存到本机。" : "看视频时截 1-3 张代表性例题，点左侧后 Ctrl+V，会自动保存到本机。";
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
          <label class="btn btn-soft btn-sm summer-example-file">
            <span class="material-symbols-outlined">add_photo_alternate</span>从文件添加
            <input data-example-file data-task-id="${escapeHtml(task.id)}" type="file" accept="image/*" hidden>
          </label>
          <button class="btn btn-primary btn-sm summer-example-quiz" data-summer-action="copy-example-quiz" data-task-id="${escapeHtml(task.id)}" type="button" ${examples.length ? "" : "disabled"}>
            <span class="material-symbols-outlined">auto_awesome</span>${examples.length ? "测验包" : "先贴图"}
          </button>
          <button class="btn btn-soft btn-sm summer-example-copy" data-summer-action="copy-example-image" data-task-id="${escapeHtml(task.id)}" data-example-id="${escapeHtml(examples[0]?.id || "")}" type="button" ${examples.length ? "" : "disabled"}>
            <span class="material-symbols-outlined">content_copy</span>${examples.length > 1 ? "复制首图" : "复制图片"}
          </button>
        </div>
        <p class="summer-example-local-note">
          <span class="material-symbols-outlined">save</span>
          粘贴成功就已保存到本机浏览器；“从文件添加”只是备用，不会上传到 GitHub。
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
          <strong>${hasExamples ? "下一步：测验包和图片发给 Gemini，练完写本节收尾" : "当前：先把视频里的例题截图存到这里"}</strong>
          <p>${hasExamples
            ? "不用接多模态 API。先点“测验包”复制文字，再点“复制图片”把截图贴到同一个 Gemini 对话里；练完回到下方收尾卡。"
            : "截图保存在本机浏览器里；生成同类题时，把提示词和图片一起交给 Gemini。"
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

  function bind(container) {
    container.querySelectorAll("[data-summer-action]").forEach((el) => {
      el.addEventListener("click", handleAction);
    });
    container.querySelectorAll("[data-example-paste]").forEach((el) => {
      el.addEventListener("paste", handleExamplePaste);
      el.addEventListener("click", () => el.focus());
    });
    container.querySelectorAll("[data-example-file]").forEach((el) => {
      el.addEventListener("change", handleExampleFile);
    });
    container.querySelectorAll("[data-example-note]").forEach((el) => {
      el.addEventListener("blur", handleExampleNote);
    });
    container.querySelectorAll(".summer-example-statuses button").forEach((el) => {
      el.addEventListener("pointerdown", captureExamplePointerAnchor);
    });
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
      const current = routeDayState(state, day.day);
      state.routeDays[day.day] = {
        ...current,
        startedAt: current.startedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (action === "route-focus") {
        writeState(state);
        window.MochiApp?.startCommittedFocus?.(`暑假物理：${day.title}`, 45);
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
    if (!task) return;
    if (action === "save-task-reflection") {
      saveTaskReflection(task, event.currentTarget);
      return;
    }
    if (action === "open-reflection") {
      const card = document.querySelector(`[data-task-reflection-card="${escapeSelectorAttr(task.id)}"]`);
      const details = card?.querySelector?.(".summer-inline-reflection");
      if (details) details.open = true;
      const target = card || event.currentTarget.closest(".summer-task") || event.currentTarget.closest(".summer-route-step");
      target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        const firstField = card?.querySelector?.("[name='reviewCue'], textarea, input[name='understanding']");
        firstField?.focus?.({ preventScroll: true });
      }, 180);
      return;
    }
    if (action === "copy-example-image") {
      const exampleId = event.currentTarget.dataset.exampleId || "";
      await copyExampleImage(task, exampleId);
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
      state.activeTaskId = task.id;
      state.tasks[task.id] = {
        ...current,
        startedAt: current.startedAt || now,
        lastFocusedAt: now,
        activeStep: 0,
        updatedAt: now,
      };
      writeState(state);
      window.open(task.url, "_blank", "noopener,noreferrer");
      window.MochiApp?.startCommittedFocus?.(`暑假物理：看${task.title}`, task.focusMins);
      refreshHome(anchor);
      return;
    }
    if (action === "watched-next") {
      const anchor = taskAnchorOptions(task.id, event.currentTarget);
      const state = readState();
      const current = taskState(state, task.id);
      const hasPractice = getPracticeItems(task).length > 0;
      state.activeTaskId = task.id;
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
      state.activeTaskId = task.id;
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
      const goal = getPracticeItems(task).length ? `暑假物理：${task.title}过关小题` : `暑假物理：看${task.title}`;
      window.MochiApp?.startCommittedFocus?.(goal, task.focusMins);
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
      nextState.activeTaskId = task.id;
    }
    writeState(nextState);
    refreshHome(refreshOptions);
    if (ok) {
      window.MochiApp?.toast?.("已复制测验包：发给 AI 练完后，回到本节点写收尾");
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

  async function handleExampleFile(event) {
    const taskId = event.currentTarget.dataset.taskId || "";
    const file = event.currentTarget.files?.[0];
    await saveExampleFile(taskId, file, event.currentTarget);
    event.currentTarget.value = "";
  }

  function handleExampleNote(event) {
    const taskId = event.currentTarget.dataset.taskId || "";
    if (!taskId) return;
    const value = String(event.currentTarget.value || "").trim();
    updateTask(taskId, { studyNote: value });
    const hint = event.currentTarget.closest(".summer-route-note")?.querySelector("small");
    if (hint) hint.textContent = value ? "已保存。复习时可以从总计划回看。" : "已清空备注，离开输入框会自动保存。";
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
      showReflectionMessage(root, "先选一下现在能做到哪一步。");
      return;
    }
    if (reviewCue.length < 4) {
      showReflectionMessage(root, "只写一句下次提醒就行，例如：先画图，再列式。");
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
    state.tasks[task.id] = {
      ...current,
      watched: true,
      completed: true,
      completedAt: current.completedAt || now,
      reflectionRequired: true,
      reflectionDone: true,
      reflection,
      studyNote: current.studyNote || [reviewCue, stuckTags.join(" / "), stuckPoint].filter(Boolean).join("；"),
      updatedAt: now,
    };
    writeState(state);
    refreshHome({ preserveScroll: true });
    window.MochiApp?.toast?.("学习收尾已保存，下一步已解锁");
  }

  function saveDayReflection(dayNo, trigger) {
    const day = ROUTE_DAYS.find((item) => item.day === Number(dayNo || 0));
    const form = trigger.closest("[data-reflection-form='daily']");
    if (!day || !form) return;
    const mood = form.querySelector("input[name='mood']:checked")?.value || "";
    const best = String(form.querySelector("[name='best']")?.value || "").trim();
    const hardest = String(form.querySelector("[name='hardest']")?.value || "").trim();
    const tomorrow = String(form.querySelector("[name='tomorrow']")?.value || "").trim();
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
      dailyReflection: { mood, best, hardest, tomorrow, createdAt: now, updatedAt: now },
      updatedAt: now,
    };
    if (Number(state.activeRouteDay || 0) === day.day && routeDayCompleted(day, state)) state.activeRouteDay = 0;
    writeState(state);
    refreshHome({ preserveScroll: true });
    window.MochiApp?.toast?.("今日复盘已保存，下一组已解锁");
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
      window.MochiApp?.toast?.("请粘贴截图，或从文件添加一张图片");
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
      state.activeTaskId = taskId;
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

  async function copyExampleImage(task, exampleId) {
    const state = readState();
    const examples = taskExamples(state, task.id);
    const targetId = exampleId || examples[0]?.id || "";
    if (!targetId) {
      window.MochiApp?.toast?.("这节课还没有例题图片");
      return;
    }
    try {
      const blob = await getExampleImage(targetId);
      if (!blob) {
        window.MochiApp?.toast?.("图片本体没找到，重新粘贴一次截图会更稳");
        return;
      }
      const ok = await copyImageBlob(blob);
      if (ok) {
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
      <button class="btn btn-primary" data-action="close-modal" type="button" style="width:100%;margin-top:10px">我处理好了</button>
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
      activeTaskId: "",
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
      state.activeTaskId = "newton-second-law";
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
      "我会先粘贴这段文字，然后回 MochiStudy 点击“复制图片”，把例题截图粘到同一个 Gemini 对话里。你必须先看截图；如果你没有收到图片，请只提醒我继续粘贴图片，不要凭空编题。",
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
    window.MochiApp?.modal?.(`
      <h3>复制过关小题 Prompt</h3>
      <p class="muted">浏览器没有放行剪贴板。点下面文本框后 Ctrl+A / Ctrl+C，再粘给 AI。</p>
      <textarea class="summer-prompt-fallback" rows="9" readonly>${escapeHtml(prompt)}</textarea>
      <button class="btn btn-primary" data-action="close-modal" type="button" style="width:100%;margin-top:10px">我复制好了</button>
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
        if (Math.abs(delta) > 0.5) window.scrollTo(scrollX, window.scrollY + delta);
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
      requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
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
    getTasks: () => TASKS.slice(),
    loadDemoState,
  };
})();
