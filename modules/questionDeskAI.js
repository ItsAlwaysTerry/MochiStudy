(function () {
  const QUESTION_DESK_PROMPT = [
    "你是 MochiStudy 题桌里的单题 AI 私教，专门陪基础薄弱的高中理科学生啃一张题图。",
    "先读图识别题目大意，再判断科目和最接近的知识点。",
    "不要一次性给完整答案。先问学生卡在哪里，再用脚手架一步一步提示。",
    "学生说不知道时，把问题拆得更小；学生方向错了，不说错了，而是引导他验证。",
    "当学生要求生成记录或你判断题目已经讲通时，输出以下固定格式：",
    "【MochiStudy 学习记录草稿】",
    "科目：[数学/物理/化学]",
    "知识点：[必须从预设列表选择]",
    "掌握星级：[1-3]",
    "卡点记录：[一句话]",
    "原题：[尽力转写题干核心文字、数字和关键公式，不超过120字；不能只写见原图]",
    "今日套路：[3步以内]",
    "错误类型：[概念不清/审题/计算/其他]",
    "卡住步骤：[一句话，可为空]",
    "关键突破：[一句话]",
    "题型标签：[用顿号分隔，最多6个]",
    "信心分：[1-5]",
    "耗时分钟：[整数]",
    "学习日期：[YYYY-MM-DD]",
    "知识点必须从以下列表选：数学：集合、函数、三角函数、数列、不等式、向量、概率统计、导数、立体几何、解析几何；物理：运动学、动力学、动量、能量守恒、电场、磁场、电磁感应、波动、热学；化学：原子结构、化学键、氧化还原反应、化学反应、化学平衡、电化学、有机化学。",
  ].join("\n");

  const QUESTION_RECOGNITION_PROMPT = [
    "你是 MochiStudy 题桌的题目识别器，只负责判断截图选区里是不是一整道题。",
    "不要讲解，不要解题，不要输出多余文字。",
    "请只输出 JSON，字段固定为：",
    '{"questionNumber":"","subject":"","summary":"","transcript":"","isComplete":true,"warning":""}',
    "questionNumber 写图中题号，没有就空字符串。",
    "subject 只能写 math / physics / chemistry / unknown。",
    "summary 用 30 字以内概括题目在问什么。",
    "transcript 尽量转写题干核心文字、数字和公式，控制在 160 字以内。",
    "isComplete 判断选区是否像完整一道题；如果题干/选项/小问明显被截断，写 false。",
    "warning 写需要学生调整框的原因；如果看起来完整就空字符串。",
  ].join("\n");

  const PAPER_GRIND_PROMPT = [
    "你是 MochiStudy 题桌里的啃卷子排序教练，服务对象是广东省理科高考备考、基础薄弱的学生。",
    "你会看到一张总览图，里面把多张题图用 A、B、C、D 等字母编号排在一起。",
    "你的任务不是解题，而是判断学生应该先学哪几题。",
    "排序依据：高考考频、短期提分空间、基础薄弱学生能否快速建立套路。",
    "高考考频 1-5：全国卷理科中该类知识点/题型的重要程度。",
    "短期提分空间 1-5：1-2 周内靠套路训练提分的可能性。",
    "综合优先级 1-5：结合前两项给出，分高的先学。",
    "请只输出 JSON，不要 markdown，不要解释题目解法。格式固定：",
    '{"items":[{"label":"A","rank":1,"subject":"math","title":"题目简述","frequency":4,"scoreGain":5,"priority":5,"reason":"为什么先学这题"}]}',
    "label 必须使用图中已有字母。rank 从 1 开始，不能重复。subject 只能是 math/physics/chemistry/unknown。",
    "title 控制在 24 字以内；reason 控制在 36 字以内。",
  ].join("\n");

  const PAPER_SCAN_PROMPT = [
    "你是 MochiStudy 题桌的卷子拆题识别器，只负责把一张试卷/题图拆成题目清单。",
    "不要解题，不要排序，不要输出 markdown。",
    "必须尽量保留原卷子里的题号：能读到第几题就写原题号；读不到就写空字符串。",
    "如果一张图里有多个小问，但它们明显属于同一道大题，先按大题合并成一个 question。",
    "rect 使用相对坐标，范围 0-1，表示这道题在整张图里的大概区域；只要能大概定位就必须输出 rect，只有完全无法判断位置时才省略。",
    "请只输出 JSON，格式固定：",
    '{"questions":[{"questionNumber":"2","subject":"math","title":"对数函数定义域","summary":"求对数函数定义域","rect":{"x":0.08,"y":0.18,"w":0.84,"h":0.16},"confidence":4}]}',
    "subject 只能是 math / physics / chemistry / unknown。",
    "title 控制在 24 字以内；summary 控制在 48 字以内。",
  ].join("\n");

  function nowIso() {
    return new Date().toISOString();
  }

  function parseRecognition(text) {
    const raw = String(text || "").trim();
    const jsonText = (raw.match(/\{[\s\S]*\}/) || [raw])[0];
    try {
      const value = JSON.parse(jsonText);
      return {
        questionNumber: String(value.questionNumber || "").trim().slice(0, 24),
        subject: ["math", "physics", "chemistry", "unknown"].includes(value.subject) ? value.subject : "unknown",
        summary: String(value.summary || "").trim().slice(0, 80),
        transcript: String(value.transcript || "").trim().slice(0, 260),
        isComplete: value.isComplete !== false,
        warning: String(value.warning || "").trim().slice(0, 120),
        raw,
        updatedAt: nowIso(),
      };
    } catch {
      return {
        questionNumber: "",
        subject: "unknown",
        summary: "",
        transcript: raw.slice(0, 260),
        isComplete: false,
        warning: "识别结果格式不稳定，请看原文并确认选区。",
        raw,
        updatedAt: nowIso(),
      };
    }
  }

  function clampScore(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.max(1, Math.min(5, Math.round(num)));
  }

  function parseRect(value) {
    if (!value || typeof value !== "object") return null;
    const x = Number(value.x);
    const y = Number(value.y);
    const w = Number(value.w);
    const h = Number(value.h);
    if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return null;
    return {
      x: Math.max(0, Math.min(0.98, x)),
      y: Math.max(0, Math.min(0.98, y)),
      w: Math.max(0.02, Math.min(1, w)),
      h: Math.max(0.02, Math.min(1, h)),
    };
  }

  function parsePaperScan(text) {
    const raw = String(text || "").trim();
    const jsonText = (raw.match(/\{[\s\S]*\}/) || [raw])[0];
    try {
      const value = JSON.parse(jsonText);
      const rows = Array.isArray(value.questions) ? value.questions : [];
      return rows
        .map((row) => ({
          questionNumber: String(row.questionNumber || "").trim().slice(0, 24),
          subject: ["math", "physics", "chemistry", "unknown"].includes(row.subject) ? row.subject : "unknown",
          title: String(row.title || row.summary || "").trim().slice(0, 48),
          summary: String(row.summary || row.title || "").trim().slice(0, 80),
          rect: parseRect(row.rect),
          confidence: clampScore(row.confidence),
          raw,
        }))
        .filter((row) => row.questionNumber || row.title || row.summary || row.rect);
    } catch {
      return [];
    }
  }

  function parsePaperGrind(text, allowedLabels = []) {
    const allowed = new Set(allowedLabels);
    const raw = String(text || "").trim();
    const jsonText = (raw.match(/\{[\s\S]*\}/) || [raw])[0];
    try {
      const value = JSON.parse(jsonText);
      const rows = Array.isArray(value.items) ? value.items : [];
      return rows
        .map((row, index) => {
          const label = String(row.label || "").trim().toUpperCase();
          if (allowed.size && !allowed.has(label)) return null;
          return {
            label,
            rank: Math.max(1, Number(row.rank) || index + 1),
            subject: ["math", "physics", "chemistry", "unknown"].includes(row.subject) ? row.subject : "unknown",
            title: String(row.title || "").trim().slice(0, 48),
            frequency: clampScore(row.frequency),
            scoreGain: clampScore(row.scoreGain),
            priority: clampScore(row.priority),
            reason: String(row.reason || "").trim().slice(0, 80),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.rank - b.rank);
    } catch {
      return allowedLabels.map((label, index) => ({
        label,
        rank: index + 1,
        subject: "unknown",
        title: `题图 ${label}`,
        frequency: 0,
        scoreGain: 0,
        priority: 0,
        reason: "AI 排序格式不稳定，请按原顺序先学。",
      }));
    }
  }

  window.MochiQuestionDeskAI = {
    QUESTION_DESK_PROMPT,
    QUESTION_RECOGNITION_PROMPT,
    PAPER_SCAN_PROMPT,
    PAPER_GRIND_PROMPT,
    parseRecognition,
    parsePaperScan,
    parsePaperGrind,
  };
})();
