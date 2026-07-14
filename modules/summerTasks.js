(function () {
  const STATE_KEY = "summer_task_state";

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
        backup: "基础课 season 2045：1-28；优先看 13-23、26-28",
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
        backup: "基础课 season 2045：55-64；必要时看高一高二讲义一",
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
        backup: "基础课 season 2045：29-35、45-54；必要时看高一高二讲义一",
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
        backup: "基础课 season 2181：100-108",
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
        backup: "基础课 season 2181：192-212；必要时看高一高二讲义三",
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
        backup: "基础课 season 2045：95-98；一轮平抛合集 P1-P4",
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
        backup: "基础课 season 2045：113-120；一轮万有引力合集 P1-P9",
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

  const PLAN_LABELS = {
    twoDay: "两天推荐版",
    oneDay: "一天压缩版",
  };

  function readState() {
    const fallback = { plan: "twoDay", pendingTaskId: "", activeTaskId: "", tasks: {} };
    try {
      const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
      if (!saved || typeof saved !== "object") return fallback;
      return {
        plan: saved.plan === "oneDay" ? "oneDay" : "twoDay",
        pendingTaskId: String(saved.pendingTaskId || ""),
        activeTaskId: String(saved.activeTaskId || ""),
        tasks: saved.tasks && typeof saved.tasks === "object" ? saved.tasks : {},
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

  function updateTask(id, patch) {
    const state = readState();
    state.tasks[id] = { ...taskState(state, id), ...patch, updatedAt: new Date().toISOString() };
    writeState(state);
    return state;
  }

  function setPlan(plan) {
    const state = readState();
    state.plan = plan === "oneDay" ? "oneDay" : "twoDay";
    writeState(state);
    refreshHome();
  }

  function setPendingTask(id, patch = {}) {
    const state = readState();
    state.pendingTaskId = id;
    state.activeTaskId = id;
    state.tasks[id] = {
      ...taskState(state, id),
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    writeState(state);
    refreshHome();
  }

  function attachImportedRecord(logEntry) {
    const state = readState();
    const id = state.pendingTaskId;
    if (!id || !TASKS.some((task) => task.id === id)) return;
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
      updatedAt: new Date().toISOString(),
    };
    state.pendingTaskId = "";
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

  function render() {
    const state = readState();
    const stat = progress(state);
    const pct = Math.round((stat.completed / stat.total) * 100);
    const plan = state.plan === "oneDay" ? "oneDay" : "twoDay";
    return `
      <section class="card summer-task-card">
        <div class="summer-task-head">
          <div>
            <p class="summer-kicker">暑假物理补基础</p>
            <h3>今日任务</h3>
            <p>看过视频就直接做小题；导入一条学习记录才算完成。已列 ${stat.all} 节课${stat.waiting ? `，${stat.waiting} 节待补例题截图` : ""}。</p>
          </div>
          <div class="summer-progress-ring" aria-label="已完成 ${stat.completed}/${stat.total}">
            <strong>${stat.completed}</strong><span>/${stat.total}</span>
          </div>
        </div>
        <div class="summer-plan-tabs" role="tablist" aria-label="任务计划">
          ${Object.entries(PLAN_LABELS).map(([key, label]) => `
            <button class="summer-plan-tab ${plan === key ? "active" : ""}" data-summer-action="plan" data-plan="${key}" type="button">${label}</button>
          `).join("")}
        </div>
        <div class="summer-progress-track"><div class="summer-progress-fill" style="width:${pct}%"></div></div>
        ${plan === "oneDay" ? renderOneDay(state) : renderTwoDay(state)}
      </section>
    `;
  }

  function renderTwoDay(state) {
    const day1 = TASKS.filter((task) => task.day === 1 && !task.needsExamples);
    const day2 = TASKS.filter((task) => task.day === 2 && !task.needsExamples);
    const waiting = TASKS.filter((task) => task.needsExamples);
    return `
      <div class="summer-day-list">
        ${renderDayGroup("第 1 天", "运动 + 受力基础", day1, state)}
        ${renderDayGroup("第 2 天", "功率 + 电路 + 曲线/天体", day2, state)}
        ${renderDayGroup("待补例题截图", "先占住视频入口，题目等截图后补", waiting, state)}
      </div>
    `;
  }

  function renderOneDay(state) {
    const groups = [
      ["上午第一轮", TASKS.filter((task) => task.compressedSlot === "上午第一轮")],
      ["上午第二轮", TASKS.filter((task) => task.compressedSlot === "上午第二轮")],
      ["下午第一轮", TASKS.filter((task) => task.compressedSlot === "下午第一轮")],
      ["下午第二轮", TASKS.filter((task) => task.compressedSlot === "下午第二轮")],
      ["晚上补充轮", TASKS.filter((task) => task.compressedSlot === "晚上补充轮")],
      ["待补例题截图", TASKS.filter((task) => task.needsExamples)],
    ];
    return `
      <div class="summer-day-list">
        ${groups.map(([title, tasks]) => renderDayGroup(
          title,
          title === "待补例题截图" ? "先占住视频入口，题目等截图后补" : "压缩版只保留过关小题，不追求全吃透",
          tasks,
          state
        )).join("")}
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
    const isActive = state.activeTaskId === task.id || isPending;
    const completed = Boolean(s.completed);
    const watched = Boolean(s.watched);
    const practiceItems = getPracticeItems(task);
    const flow = getTaskFlow(task, s, isPending);
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
          ${renderTaskStepper(flow)}
          <details class="summer-exit-box" ${isActive ? "open" : ""}>
            <summary>${practiceItems.length ? `卡住再看 + 过关小题：${practiceItems.length} 题` : "卡住再看 + 过关小题：待补截图"}</summary>
            ${renderPrep(task)}
            ${renderPracticeItems(task, practiceItems)}
          </details>
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

  function renderTaskStepper(flow) {
    const steps = ["看视频", "做题", "导入", "完成"];
    return `
      <div class="summer-stepper" aria-label="任务步骤">
        ${steps.map((label, index) => `
          <span class="${index < flow.step ? "done" : index === flow.step ? "active" : ""}">
            <i>${index < flow.step ? "✓" : index + 1}</i>${label}
          </span>
        `).join("")}
      </div>
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
              <span class="material-symbols-outlined">edit_note</span>${flow.hasPractice ? "做小题" : "待补题"}
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

  function getPracticeItems(task) {
    return Array.isArray(task.practiceItems) ? task.practiceItems : [];
  }

  function renderPracticeItems(task, items) {
    if (!items.length) {
      return `
        <div class="summer-practice-empty">
          <span class="material-symbols-outlined">pending</span>
          <div>
            <strong>等你贴例题截图后补题</strong>
            <p>${escapeHtml(task.practiceNote || "这节课先保留视频入口，不生成低质量题。")}</p>
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
  }

  async function handleAction(event) {
    const action = event.currentTarget.dataset.summerAction;
    const id = event.currentTarget.dataset.taskId || "";
    const task = TASKS.find((item) => item.id === id);
    if (action === "plan") {
      setPlan(event.currentTarget.dataset.plan || "twoDay");
      return;
    }
    if (!task) return;
    if (action === "start-task") {
      const state = readState();
      const current = taskState(state, task.id);
      const now = new Date().toISOString();
      state.activeTaskId = task.id;
      state.tasks[task.id] = {
        ...current,
        startedAt: current.startedAt || now,
        lastFocusedAt: now,
        updatedAt: now,
      };
      writeState(state);
      window.open(task.url, "_blank", "noopener,noreferrer");
      window.MochiApp?.startCommittedFocus?.(`暑假物理：看${task.title}`, task.focusMins);
      refreshHome();
      return;
    }
    if (action === "watched-next") {
      const state = readState();
      const current = taskState(state, task.id);
      const hasPractice = getPracticeItems(task).length > 0;
      state.activeTaskId = task.id;
      state.tasks[task.id] = {
        ...current,
        watched: true,
        practicingAt: hasPractice ? (current.practicingAt || new Date().toISOString()) : current.practicingAt,
        updatedAt: new Date().toISOString(),
      };
      writeState(state);
      refreshHome();
      setTimeout(() => scrollToTask(task.id), 120);
      window.MochiApp?.toast?.(hasPractice ? "已打开过关小题，先做第 1 道" : "已记录看完视频");
      return;
    }
    if (action === "watched") {
      updateTask(task.id, { watched: true });
      window.MochiApp?.toast?.("已记录看完视频，做完小题后再导入记录");
      refreshHome();
      return;
    }
    if (action === "practice") {
      const state = readState();
      const hasPractice = getPracticeItems(task).length > 0;
      state.activeTaskId = task.id;
      state.tasks[task.id] = {
        ...taskState(state, task.id),
        watched: hasPractice ? true : taskState(state, task.id).watched || false,
        practicingAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      writeState(state);
      refreshHome();
      setTimeout(() => scrollToTask(task.id), 120);
      window.MochiApp?.toast?.(hasPractice ? "已打开过关小题，做完后再导入记录" : "这节课先占位，等你贴例题截图后补题");
      return;
    }
    if (action === "focus") {
      updateTask(task.id, { watched: taskState(readState(), task.id).watched || false, lastFocusedAt: new Date().toISOString() });
      const goal = getPracticeItems(task).length ? `暑假物理：${task.title}过关小题` : `暑假物理：看${task.title}`;
      window.MochiApp?.startCommittedFocus?.(goal, task.focusMins);
      return;
    }
    if (action === "copy-first-prompt") {
      await copyPracticePrompt(task, 0);
      return;
    }
    if (action === "copy-prompt") {
      const itemIndex = Number(event.currentTarget.dataset.itemIndex || 0);
      await copyPracticePrompt(task, itemIndex);
      return;
    }
    if (action === "import") {
      setPendingTask(task.id);
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

  async function copyPracticePrompt(task, itemIndex) {
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
    });
    if (ok) {
      window.MochiApp?.toast?.("已复制给 AI，做完后把 MOCHI-RECORD 粘回来");
    } else {
      showPromptFallback(prompt);
      window.MochiApp?.toast?.("已打开手动复制框，复制后把 AI 输出粘回来");
    }
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
    return [
      `我刚看完「${task.title}」视频。`,
      task.prep?.concepts?.length ? `今天相关基础概念：${task.prep.concepts.join("、")}。如果我概念不清楚，请先用一句话帮我补概念，再带我做题。` : "",
      task.prep?.oneRound ? `如果我做题或听课时卡住，翻书救急范围：${task.prep.oneRound}。` : "",
      task.prep?.backup ? `如果我还是听不懂，备用资源是：${task.prep.backup}。` : "",
      item.image ? `题目是 MochiStudy 页面上的这张截图：${item.image}。我会把题图一起发给你；如果你没有看到图片，请先提醒我上传题图，不要凭空编题。` : "",
      `请用零基础方式带我做这道过关小题：${item.question}`,
      item.hint ? `我希望你重点提醒我：${item.hint}` : "",
      "请一步步问我，不要直接给答案；如果我不会，先用更简单的问题铺垫。",
      "最后请按 MochiStudy 格式输出一条 MOCHI-RECORD。",
    ].filter(Boolean).join("\n");
  }

  function scrollToTask(id) {
    const taskEl = document.querySelector(`[data-summer-task-id="${CSS.escape(id)}"]`);
    taskEl?.scrollIntoView({ behavior: "smooth", block: "center" });
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

  function refreshHome() {
    const view = document.getElementById("view");
    if (view && view.querySelector(".home-flow")) window.MochiFarm?.renderFarm?.(view);
  }

  function escapeHtml(value) {
    return window.MochiApp?.escapeHtml?.(value) ?? String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  window.MochiSummerTasks = {
    render,
    bind,
    attachImportedRecord,
    progress,
    getTasks: () => TASKS.slice(),
  };
})();
