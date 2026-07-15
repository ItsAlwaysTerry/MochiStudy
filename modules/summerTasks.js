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
    { day: 3, week: 1, title: "运动图像 + 追及相遇", subtitle: "把 x-t / v-t 图像和刹车追及补成拿分点", focus: ["运动图像", "刹车陷阱", "追及相遇"] },
    { day: 4, week: 1, title: "受力分析回炉", subtitle: "重力、弹力、摩擦力、正交分解再做题", focus: ["受力图", "摩擦力", "动态平衡"] },
    { day: 5, week: 1, title: "牛二基础题", subtitle: "斜面、连接体、简单多物体，不碰难模型", focus: ["F=ma", "斜面", "连接体"] },
    { day: 6, week: 1, title: "平抛 + 圆周基础", subtitle: "曲线运动只抓分解和向心力", focus: ["平抛分解", "圆周运动", "向心力"] },
    { day: 7, week: 1, title: "周测 + 错题回炉", subtitle: "用小卷检查第 1 周，错题导入记录", focus: ["限时小测", "错题复盘"] },
    { day: 8, week: 2, title: "功与功率二刷", subtitle: "做功正负、平均功率、瞬时功率", focus: ["做功", "功率", "动能定理入口"] },
    { day: 9, week: 2, title: "动能定理 + 机械能", subtitle: "先会列始末状态，再谈复杂过程", focus: ["动能定理", "机械能守恒"] },
    { day: 10, week: 2, title: "万有引力 + 圆周综合", subtitle: "天体题只抓半径、周期、速度比较", focus: ["万有引力", "同步卫星", "轨道半径"] },
    { day: 11, week: 2, title: "电场入门", subtitle: "电场强度、电势、电势能先会认量", focus: ["电场强度", "电势", "电势能"] },
    { day: 12, week: 2, title: "恒定电流基础", subtitle: "串并联、电动势、内阻、路端电压", focus: ["串并联", "电动势", "内阻"] },
    { day: 13, week: 2, title: "电学实验入门", subtitle: "仪器读数、伏安法、测电阻", focus: ["电表读数", "伏安法", "测电阻"] },
    { day: 14, week: 2, title: "第 2 周小测", subtitle: "功能、天体、电路各抽基础题", focus: ["限时小测", "错题导入"] },
    { day: 15, week: 3, title: "力学实验专项", subtitle: "打点计时器、纸带、图像处理", focus: ["纸带", "逐差法", "图像斜率"] },
    { day: 16, week: 3, title: "电学实验专项", subtitle: "测电源电动势与内阻、仪器选择", focus: ["电源实验", "仪器选择", "误差分析"] },
    { day: 17, week: 3, title: "振动与波", subtitle: "低分段先会读图、会判断基本量", focus: ["振动图像", "波形图", "周期频率"] },
    { day: 18, week: 3, title: "热学/光学/原子择一", subtitle: "按考试范围挑最容易拿分的小专题", focus: ["热学", "光学", "原子结构"] },
    { day: 19, week: 3, title: "磁场基础", subtitle: "安培力、洛伦兹力、左手定则", focus: ["安培力", "洛伦兹力", "左手定则"] },
    { day: 20, week: 3, title: "电磁感应入门", subtitle: "磁通量变化、楞次定律先会判断方向", focus: ["磁通量", "楞次定律", "感应电流"] },
    { day: 21, week: 3, title: "第 3 周错题回炉", subtitle: "实验题和小专题错题集中二刷", focus: ["实验错题", "概念错题"] },
    { day: 22, week: 4, title: "选择题公式回炉", subtitle: "把高频公式和二级结论做成可用清单", focus: ["公式清单", "基础选择题"] },
    { day: 23, week: 4, title: "力学综合小卷", subtitle: "运动、受力、能量混合但不追难题", focus: ["力学综合", "限时训练"] },
    { day: 24, week: 4, title: "电学综合小卷", subtitle: "电场、电路、实验混合基础题", focus: ["电学综合", "限时训练"] },
    { day: 25, week: 4, title: "实验专项二刷", subtitle: "把最容易得分的实验题再刷一轮", focus: ["力学实验", "电学实验"] },
    { day: 26, week: 4, title: "限时小卷", subtitle: "按真实考试节奏做一套低压小卷", focus: ["限时", "选择题", "实验题"] },
    { day: 27, week: 4, title: "错题二刷", subtitle: "只做曾经不会、半会、卡住的题", focus: ["错题复盘", "卡点修正"] },
    { day: 28, week: 4, title: "总复盘 + 下一轮计划", subtitle: "导出学习档案，决定下一轮补哪 3 个点", focus: ["学习档案", "复盘报告", "下轮计划"] },
  ];

  function readState() {
    const fallback = { pendingTaskId: "", pendingRouteDay: 0, activeTaskId: "", activeRouteDay: 0, tasks: {}, routeDays: {}, routeDetailDay: 0, examples: {} };
    try {
      const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
      if (!saved || typeof saved !== "object") return fallback;
      return {
        pendingTaskId: String(saved.pendingTaskId || ""),
        pendingRouteDay: Number(saved.pendingRouteDay || 0),
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
      state.routeDays[routeDay.day] = {
        ...currentRoute,
        startedAt: currentRoute.startedAt || new Date().toISOString(),
        completed: true,
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
      completedAt: new Date().toISOString(),
      linkedLogIds,
      lastImportedRecord: {
        id: logEntry?.id || "",
        subject: logEntry?.subject || "",
        nodeLabel: logEntry?.nodeLabel || "",
        stars: logEntry?.stars || 0,
      },
      activeStep: 3,
      updatedAt: new Date().toISOString(),
    };
    state.pendingTaskId = "";
    state.pendingRouteDay = 0;
    state.activeTaskId = "";
    writeState(state);
  }

  function progress(state = readState()) {
    const readyTasks = TASKS.filter((task) => !task.needsExamples);
    const completed = readyTasks.filter((task) => taskState(state, task.id).completed).length;
    const watched = TASKS.filter((task) => taskState(state, task.id).watched).length;
    const waiting = TASKS.filter((task) => task.needsExamples).length;
    return { completed, watched, total: readyTasks.length, all: TASKS.length, waiting };
  }

  function findTask(id) {
    return TASKS.find((task) => task.id === id) || null;
  }

  function routeTasks(day) {
    return (day.taskIds || []).map(findTask).filter(Boolean);
  }

  function routeDayCompleted(day, state) {
    const tasks = routeTasks(day);
    if (tasks.length) return tasks.every((task) => taskState(state, task.id).completed);
    return Boolean(state.routeDays?.[day.day]?.completed);
  }

  function routeDayStarted(day, state) {
    const tasks = routeTasks(day);
    if (!tasks.length) return Boolean(state.routeDays?.[day.day]?.startedAt);
    return tasks.some((task) => {
      const info = taskState(state, task.id);
      return Boolean(info.startedAt || info.lastFocusedAt || info.watched || info.practicingAt || info.completed);
    });
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
      const activeTasks = routeTasks(activeDay).filter((task) => !taskState(state, task.id).completed);
      if (activeTasks.length) return activeTasks.slice(0, limit);
      return [];
    }
    const openTasks = TASKS.filter((task) => !taskState(state, task.id).completed);
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
    const completedDetailed = TASKS.filter((task) => taskState(state, task.id).completed).length;
    const remainingDetailed = TASKS.length - completedDetailed;
    const pendingRoute = ROUTE_DAYS.find((day) => day.day === Number(state.pendingRouteDay || 0));
    return `
      <section class="card summer-task-card">
        <div class="summer-route-hero">
          <div>
            <p class="summer-kicker">暑假物理滚动任务</p>
            <h3>${queue.length ? "先把最前面的任务清掉" : planDay ? `第 ${planDay.day} 天学习单` : "28 天物理路线已完成"}</h3>
            <p>${queue.length
              ? "没做完的不会消失，会自动排在最前面；提前做完就自动解锁下一组。"
              : planDay
                ? `${escapeHtml(planDay.title)} · ${escapeHtml(planDay.subtitle)}`
                : "可以导出学习档案，回看最卡的 3 个点，再决定下一轮。"
            }</p>
          </div>
          <div class="summer-progress-ring" aria-label="详细任务已完成 ${completedDetailed}/${TASKS.length}">
            <strong>${completedDetailed}</strong><span>/${TASKS.length}</span>
          </div>
        </div>
        <div class="summer-route-meta">
          <span>未完成自动顺延</span>
          <span>看完视频要留例题截图</span>
          <span>导入 MOCHI-RECORD 才算完成</span>
        </div>
        ${activeDay && !routeDayCompleted(activeDay, state) ? `
          <div class="summer-active-day-bar">
            <span>当前锁定：第 ${activeDay.day} 天 · ${escapeHtml(activeDay.title)}</span>
            <button class="btn btn-soft btn-sm" data-summer-action="route-auto" type="button">回到自动顺延</button>
          </div>
        ` : ""}
        <div class="summer-progress-track"><div class="summer-progress-fill" style="width:${Math.round((completedDetailed / TASKS.length) * 100)}%"></div></div>
        ${queue.length ? renderRollingQueue(queue, state, remainingDetailed) : renderRouteLearningSheet(planDay, state, { pendingRoute })}
      </section>
    `;
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
            <p>前 7 节是详细视频任务；后续每一天先按主题学习单执行，资源会自动给到一轮合集、基础课和小红书攻略入口。</p>
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
    const nextTask = pendingTask || tasks.find((task) => !taskState(state, task.id).completed);
    return `
      <div class="summer-today-panel">
        <div class="summer-today-summary">
          <div>
            <strong>${pendingTask ? "先把正在导入的任务收尾" : "当前只看这几条"}</strong>
            <span>还剩 ${remainingDetailed} 节详细任务</span>
          </div>
          <p>${nextTask ? `下一步：${escapeHtml(nextTask.title)}。没完成就留在这里，完成后自动顺延。` : "这组已经完成，下一组会自动出现。"}</p>
        </div>
        ${renderDayGroup("滚动任务队列", "按未完成优先排序；不用手动挪计划。", tasks, state)}
      </div>
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
    const completed = Boolean(routeInfo.completed);
    const resources = routeResources(day);
    const focus = Array.isArray(day.focus) ? day.focus : [];
    return `
      <div class="summer-route-placeholder summer-route-sheet ${completed ? "done" : isPending ? "pending" : ""}">
        <span class="material-symbols-outlined">${completed ? "check_circle" : isPending ? "download_done" : "route"}</span>
        <div>
          <strong>${completed ? "这张学习单已完成" : isPending ? "等你导入 MOCHI-RECORD" : "后续学习单已经可以执行"}</strong>
          <p>${escapeHtml(day.title)}：先按资源入口找当天主题，看 1 个最贴近的视频或片段，截 1-3 张例题，再做记录。具体视频之后补得更细，也不会影响今天执行。</p>
          ${focus.length ? `<div class="summer-route-focus">${focus.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
          <div class="summer-sheet-steps">
            <span>1 打开资源找当天主题</span>
            <span>2 看视频时截例题</span>
            <span>3 粘贴 MOCHI-RECORD 完成</span>
          </div>
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
              <span class="material-symbols-outlined">download_done</span>${isPending ? "去粘贴记录" : "关联并导入"}
            </button>
          </div>
          ${routeInfo.lastImportedRecord ? `<p class="summer-import-done">已完成：${escapeHtml(routeInfo.lastImportedRecord.nodeLabel || "物理")} · ${"★".repeat(Number(routeInfo.lastImportedRecord.stars || 0))}</p>` : ""}
        </div>
      </div>
    `;
  }

  function renderTodayRoute(day, state) {
    const tasks = routeTasks(day);
    if (!tasks.length) return renderRoutePlaceholder(day);
    const completed = tasks.filter((task) => taskState(state, task.id).completed).length;
    const nextTask = tasks.find((task) => !taskState(state, task.id).completed);
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
          <p>打开资源找当天关键词，看 1 个最贴近的视频或片段，截 1-3 张例题，再导入 MOCHI-RECORD 完成。</p>
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
    const isCurrent = day.day === currentDayNo;
    const isSelected = day.day === selectedDayNo;
    const status = completed ? "done" : isCurrent ? "current" : tasks.length ? "ready" : "sheet";
    const label = completed ? "已完成" : isCurrent ? "进行中" : tasks.length ? `${tasks.length} 节课` : "学习单";
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
    const completed = tasks.filter((task) => taskState(state, task.id).completed).length;
    const isCurrent = day.day === currentDayNo;
    const isActive = Number(state.activeRouteDay || 0) === day.day && !routeDayCompleted(day, state);
    const focus = Array.isArray(day.focus) ? day.focus : [];
    return `
      <section class="summer-route-detail">
        <div class="summer-route-detail-head">
          <div>
            <span class="summer-route-day-pill">${isCurrent ? "今天" : `第 ${day.day} 天`}</span>
            <h4>${escapeHtml(day.title)}</h4>
            <p>${escapeHtml(day.subtitle)}</p>
          </div>
          <div class="summer-route-detail-actions">
            ${tasks.length ? `<strong>${completed}/${tasks.length} 完成</strong>` : `<strong>${routeDayCompleted(day, state) ? "已完成" : "学习单"}</strong>`}
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
          ${renderRouteLearningSheet(day, state)}
        `}
      </section>
    `;
  }

  function renderRouteDetailTask(task, state) {
    const info = taskState(state, task.id);
    const status = info.completed ? "已完成" : info.practicingAt ? "做题中" : info.watched ? "已看视频" : "未开始";
    const tone = info.completed ? "done" : info.watched || info.practicingAt ? "active" : "";
    return `
      <div class="summer-route-detail-task ${tone}">
        <span class="material-symbols-outlined">${info.completed ? "check_circle" : info.watched ? "radio_button_checked" : "play_circle"}</span>
        <div>
          <strong>${escapeHtml(task.title)}</strong>
          <p>${escapeHtml(task.source)} · ${escapeHtml(task.duration)} · ${getPracticeItems(task).length || 0} 道小题</p>
        </div>
        <em>${status}</em>
      </div>
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
    const completed = Boolean(s.completed);
    const watched = Boolean(s.watched);
    const practiceItems = getPracticeItems(task);
    const flow = getTaskFlow(task, s, isPending);
    const selectedStep = selectedTaskStep(s, flow);
    return `
      <article class="summer-task ${completed ? "completed" : ""} ${isPending ? "pending-import" : ""}" data-summer-task-id="${escapeHtml(task.id)}">
        <div class="summer-task-main">
          <div class="summer-task-title-row">
            <span class="summer-task-check material-symbols-outlined">${completed ? "check_circle" : watched ? "radio_button_checked" : "radio_button_unchecked"}</span>
            <div>
              <h4>${escapeHtml(task.title)}</h4>
              <p>${escapeHtml(task.source)} · ${escapeHtml(task.duration)} · ${escapeHtml(task.videoTitle)}</p>
            </div>
          </div>
          ${renderTaskStepper(task, flow, selectedStep)}
          ${renderTaskStepPanel(task, selectedStep, flow, s)}
          ${renderExampleCollector(task, state)}
          ${isPending ? `<p class="summer-import-waiting">等你把 AI 输出的 MOCHI-RECORD 导入后，这条任务会自动完成。</p>` : ""}
          ${completed && s.lastImportedRecord ? `<p class="summer-import-done">已完成：${escapeHtml(s.lastImportedRecord.nodeLabel || "物理")} · ${"★".repeat(Number(s.lastImportedRecord.stars || 0))}</p>` : ""}
        </div>
        ${renderTaskActions(task, flow)}
      </article>
    `;
  }

  function getTaskFlow(task, taskInfo, isPending) {
    const hasPractice = getPracticeItems(task).length > 0;
    const started = Boolean(taskInfo.startedAt || taskInfo.lastFocusedAt || taskInfo.watched);
    const watched = Boolean(taskInfo.watched);
    const practicing = Boolean(taskInfo.practicingAt);
    if (taskInfo.completed) {
      return { step: 3, action: "done", label: "已完成", icon: "check_circle", tone: "done", hasPractice };
    }
    if (isPending) {
      return { step: 2, action: "import", label: "粘贴记录完成任务", icon: "download_done", tone: "primary", hasPractice };
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
    const steps = ["看视频", "做题", "导入", "完成"];
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
      return `
        <section class="summer-step-panel">
          <div class="summer-step-panel-head">
            <span class="material-symbols-outlined">download_done</span>
            <div>
              <strong>导入学习记录</strong>
              <p>${taskInfo.completed ? "这节已经完成。" : "做完题后，把 AI 输出的 MOCHI-RECORD 粘到右侧导入框。"}</p>
            </div>
          </div>
          <div class="summer-step-actions">
            <button class="btn btn-primary btn-sm" data-summer-action="import" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">download_done</span>关联并去导入
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
      <section class="summer-step-panel ${taskInfo.completed ? "done" : ""}">
        <div class="summer-step-panel-head">
          <span class="material-symbols-outlined">${taskInfo.completed ? "check_circle" : "flag"}</span>
          <div>
            <strong>${taskInfo.completed ? "这节已完成" : "完成条件"}</strong>
            <p>${taskInfo.completed ? "已经关联到学习档案，后面复习会用到这条记录。" : "看完视频、做完小题，并导入 MOCHI-RECORD 后才算真正完成。"}</p>
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
            <button class="btn btn-soft btn-sm" data-summer-action="import" data-task-id="${escapeHtml(task.id)}" type="button">
              <span class="material-symbols-outlined">download_done</span>导入记录
            </button>
          </div>
        </details>
      </div>
    `;
  }

  function renderExampleCollector(task, state) {
    const examples = taskExamples(state, task.id);
    return `
      <section class="summer-example-box">
        <div class="summer-example-head">
          <span class="material-symbols-outlined">add_photo_alternate</span>
          <div>
            <strong>视频例题截图</strong>
            <p>看视频时截 1-3 张代表性例题，直接粘到这里。以后可以拿这些图让 AI 定制同类测试。</p>
          </div>
        </div>
        <div class="summer-example-actions">
          <div class="summer-example-paste" tabindex="0" data-example-paste data-task-id="${escapeHtml(task.id)}" role="button" aria-label="粘贴${escapeHtml(task.title)}的视频例题截图">
            <span class="material-symbols-outlined">content_paste</span>
            <strong>点这里后 Ctrl+V 粘贴截图</strong>
            <small>默认标记为“半会”，保存后可改成会/不会。</small>
          </div>
          <label class="btn btn-soft btn-sm summer-example-file">
            <span class="material-symbols-outlined">upload_file</span>上传图片
            <input data-example-file data-task-id="${escapeHtml(task.id)}" type="file" accept="image/*" hidden>
          </label>
        </div>
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
    hydrateExampleImages(container);
  }

  async function handleAction(event) {
    const action = event.currentTarget.dataset.summerAction;
    const id = event.currentTarget.dataset.taskId || "";
    const task = TASKS.find((item) => item.id === id);
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
      writeState(state);
      refreshHome({ preserveScroll: true });
      if (focusImportBox()) {
        window.MochiApp?.toast?.(`已关联第 ${day.day} 天学习单：粘贴 MOCHI-RECORD 后自动完成`);
        return;
      }
      if (window.MochiApp?.setHolidayMode) {
        window.MochiApp.setHolidayMode("holiday");
        setTimeout(() => focusImportBox(), 350);
        window.MochiApp?.toast?.(`已打开今天的学习模式，并关联第 ${day.day} 天学习单`);
        return;
      }
      window.MochiApp?.toast?.(`已关联第 ${day.day} 天学习单：粘贴 MOCHI-RECORD 后自动完成`);
      return;
    }
    if (!task) return;
    if (action === "example-status") {
      const exampleId = event.currentTarget.dataset.exampleId || "";
      const status = event.currentTarget.dataset.exampleStatus || "半会";
      updateExampleMeta(task.id, exampleId, { status });
      refreshHome(taskAnchorOptions(task.id, event.currentTarget));
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
      window.MochiApp?.toast?.("已记录看完视频，做完小题后再导入记录");
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
      window.MochiApp?.toast?.(hasPractice ? "已打开过关小题，做完后再导入记录" : "先收集这节课的视频例题截图，再导入记录");
      return;
    }
    if (action === "focus") {
      updateTask(task.id, { watched: taskState(readState(), task.id).watched || false, lastFocusedAt: new Date().toISOString(), activeStep: 0 });
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
    if (action === "import") {
      setPendingTask(task.id, { activeStep: 2 });
      if (focusImportBox()) {
        window.MochiApp?.toast?.("已关联这条任务：粘贴 MOCHI-RECORD 后自动完成");
        return;
      }
      if (window.MochiApp?.setHolidayMode) {
        window.MochiApp.setHolidayMode("holiday");
        setTimeout(() => focusImportBox(), 350);
        window.MochiApp?.toast?.("已打开今天的学习模式，粘贴 MOCHI-RECORD 后自动完成");
        return;
      }
      window.MochiApp?.toast?.("已关联这条任务：粘贴 MOCHI-RECORD 后自动完成");
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
      window.MochiApp?.toast?.("已复制给 AI，做完后把 MOCHI-RECORD 粘回来");
    } else {
      showPromptFallback(prompt);
      window.MochiApp?.toast?.("已打开手动复制框，复制后把 AI 输出粘回来");
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

  async function saveExampleFile(taskId, file, trigger) {
    const task = findTask(taskId);
    if (!task || !file) return;
    if (!String(file.type || "").startsWith("image/")) {
      window.MochiApp?.toast?.("请粘贴或上传图片截图");
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
      window.MochiApp?.toast?.(`已保存到「${task.title}」的视频例题`);
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
      item.image ? `题目是 MochiStudy 页面上的这张截图：${item.image}。我会把题图一起发给你；如果你没有看到图片，请先提醒我上传题图，不要凭空编题。` : "",
      `请用零基础方式带我做这道过关小题：${item.question}`,
      item.hint ? `我希望你重点提醒我：${item.hint}` : "",
      "请一步步问我，不要直接给答案；如果我不会，先用更简单的问题铺垫。",
      "最后请按 MochiStudy 格式输出一条 MOCHI-RECORD。",
    ].filter(Boolean).join("\n");
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
