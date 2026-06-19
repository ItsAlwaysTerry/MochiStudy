# MochiStudy 项目说明文档

## 项目是什么

这是一个为基础薄弱的高中生设计的学习记录网站，帮助他在假期可视化学习进度、保持学习动力。

核心用户画像：基础差、缺乏自信、习惯做题但不会主动复习、喜欢收集和陈列东西。

## 技术栈

- 纯原生 HTML + CSS + JS，无任何框架
- 数据全部存在浏览器 localStorage
- 不依赖任何后端服务

## 文件结构

```text
index.html          — 入口，包含页面骨架和底部导航
style.css           — 全部样式
app.js              — 主逻辑，路由、导入记录、勋章、备份
modules/
  farm.js           — 农场模块（window.MochiFarm）
  knowledgeMap.js   — 卡片收藏册模块（window.MochiCards）
  timer.js          — 番茄钟模块（window.MochiTimer）
  pet.js            — 学习状态模块（window.MochiPet，内部兼容旧命名）
  ai.js             — AI导入解析模块（window.MochiAI）
  reviewEngine.js   — 复习优先级算法（window.MochiReview）
  reviewPage.js     — 复习页渲染（window.MochiReviewPage）
assets/farm/
  crops_.png        — 星露谷物语植物精灵图（已授权）
  tools_.png
  Craftables_.png
  critters_.png
```

## localStorage 实际数据结构（不能随意改动）

```text
study_log                     — 学习记录数组，核心数据
farm_state                    — 农场状态
mochi_state                   — 学习状态/连续学习状态
focus_log                     — 番茄钟/专注记录
api_config                    — AI API 配置
school_holidays               — 手动配置的假期列表
holiday_mode_override         — 今日学习模式覆盖状态
game_config                   — 游戏参数配置覆盖值，和默认 GAME_CONFIG 深合并
achievement_config            — 勋章阈值配置，和默认 ACHIEVEMENT_CONFIG_DEFAULTS 深合并
achievement_state             — 已获得勋章数量、抽奖次数和最近新增提示
lottery_config                — 抽奖转盘项目、类型、权重和颜色配置
lottery_history               — 最近 50 条抽奖结果历史
current_season                — 当前赛季，包含 id/name/startDate/endDate/status
season_archives               — 历史赛季数组，每条包含赛季信息和结束时 snapshot
card_order                    — 学习档案卡片自定义排序，按 subject::nodeLabel 保存卡片 id 顺序；不改 study_log 字段
study_card_meta               — 学习卡片复习元信息，按 logId 保存来源、复习结果、错误类型、卡住步骤、标签、信心和耗时；不改 study_log 字段
study_node_summary            — 知识点级人工精华摘要，按 subject::nodeLabel 保存；字段：mainPainPointOverride / keyBreakthroughOverride / reviewNote / updatedAt
admin_password                — 管理后台密码，默认未设置时使用 mochi2025
sound_reminder_enabled        — 休息结束提醒音开关（用户主动开启）
focus_end_sound               — 专注结束提示音选择：off / soft / bell / ding
rest_reminder_sound           — 休息结束铃声选择：melody / bell / soft / bright
mochi_debug_panel_open        — 调试面板展开状态
mochi_debug_float_collapsed   — 右下角调试浮窗收起状态
mochi_debug_tab               — 调试浮窗当前 Tab
commitment_history            — 专注承诺历史，每轮一条 {id,date,goal,plannedMins,actualMins,outcome,ts}；最多 50 条；用于首页"说到做到"回看
```

注意：当前代码没有单独的 `pet_state`、`achievements`、`calendar_state` 这三个 localStorage key。

- 备份文件里的 `data.pet_state` 映射自 localStorage 的 `mochi_state`
- 代码里的 `MochiPet` 仍作为后台“学习状态”模块使用；前台和配置面板文案应叫“学习状态”，不要再写成可见宠物玩法
- `achievements` 是导出快照，不是独立持久化 key；实际勋章领取状态存在 `achievement_state`，阈值配置存在 `achievement_config`
- 备份文件里的 `data.calendar_state` 是结构化导出对象，来源包括 `focus_log`、`school_holidays`、`holiday_mode_override`

### study_log 单条记录结构（严格遵守，不能随意新增或删除字段）

```javascript
{
  subject: "math" | "physics" | "chemistry",
  nodeLabel: string,          // 来自预设知识点列表，不能自由填写
  questionsCompleted: 1,      // 固定为 1，不再从 MOCHI-RECORD 读取
  stars: 1 | 2 | 3,
  painPoint: string,          // 卡点，一句话
  originalQuestion: string,   // 原题描述；旧记录没有时读取为空字符串
  routine: string,            // 今日套路，3步
  date: "YYYY-MM-DD"
}
```

### 备份文件结构（不能改动，用于版本迁移）

```javascript
{
  version: "1.0",             // 版本号，迁移时靠这个判断兼容性
  exportDate: "YYYY-MM-DD",
  data: {
    study_log: [...],
    farm_state: {...},
    pet_state: {...},         // 来自 mochi_state
    achievements: {...},      // 导出时实时计算的快照；恢复时忽略，系统重新计算
    calendar_state: {
      focus_log: [...],
      school_holidays: [...],
      holiday_mode_override: {...}
    },
    localStorage: {
      // 所有当前 localStorage key 的原始字符串快照，用于完整恢复
    }
  }
}
```

## 预设知识点列表（不能改动）

```javascript
数学：集合、函数、三角函数、数列、不等式、向量、概率统计、导数、立体几何、解析几何
物理：运动学、动力学、动量、能量守恒、电场、磁场、电磁感应、波动、热学
化学：原子结构、化学键、氧化还原反应、化学反应、化学平衡、电化学、有机化学
```

## 农场系统设计（不能推翻重来）

- 固定三块地：数学 / 物理 / 化学各一块
- 作物生长由该科目本轮累计导入记录条数驱动（recordCount）
- 生长阶段：0条=荒地，1-2条=种子，3-5条=发芽，6-9条=幼苗，10-14条=开花，15条+=成熟
- 收获后 recordCount 归零，开始下一轮
- 精灵图使用 assets/farm/crops_.png，必须加 image-rendering:pixelated 和 mix-blend-mode:screen
- 农场升级基于 totalHarvests（总收获次数），不基于 xp
- 无农场币系统，已删除

## 卡片收藏册设计（不能推翻重来）

- 替换了旧的知识地图，现在叫“学习档案”
- 三层结构：科目Tab → 知识点分组 → 卡片列表
- 每个知识点有四种状态：untouched / learning / mastered / dormant
- 卡片正面显示：日期、题数、星级（★☆符号）、卡点文字（字号最大）
- 学习卡片有三种互斥状态：正面 / 今日套路 / 原题；`originalQuestion` 字段在“看原题”第三面显示
- 卡片展开状态用 `Map` 存储，值为 `"routine"` / `"question"` / `null`
- 顶部有“导出档案”按钮，支持摘要、详细记录、JSON 三种格式
- 详细记录由 `knowledgeMap.js` 的 `generateExportDetail()` 生成，按科目 → 知识点 → 时间正序逐张卡片输出日期、星级、题数、卡点、原题、套路

## 有效学习日规则

- 只有假期、周六日、以及用户手动点击“今天想学习”的日子才算有效学习日
- 上学日（工作日非假期）不计入任何学习统计
- 判断函数：window.MochiApp.isHolidayToday(date)，已存在，直接调用

## 勋章系统

- 勋章基于累计阈值倍数触发，无上限重复获得。
- 两级体系：`small` 小勋章、`big` 大勋章。
- 阈值配置存在 `achievement_config` localStorage key。
- 已获得数量、累计大小勋章、可用抽奖次数存在 `achievement_state` localStorage key。
- 每次导入记录、完成番茄钟、收获农场后调用 `checkAndGrantAchievements()`。
- 抽奖次数 = `Math.floor(totalSmall / smallPerDraw) + Math.floor(totalBig / bigPerDraw) - usedLotteryCount`。
- 抽奖转盘在 `lottery-overlay` 中显示，z-index 700。
- 转盘用 Canvas 绘制，按 `lottery_config.items[].weight` 随机选结果，4 秒 easeOutCubic 动画。
- 抽奖历史存在 `lottery_history` localStorage key，最多保留 50 条。
- 抽奖消耗 1 次机会后更新 `achievement_state.lotteryTickets` 和 `usedLotteryCount`。

## 赛季系统

- 底部导航和侧边栏有“赛季”tab，路由为 `#season`。
- 当前赛季存在 `current_season`，历史赛季存在 `season_archives`。
- 设置页“赛季管理”可以开启赛季、结束当前赛季并写入历史快照。
- 称号体系 16 级，常量为 `SEASON_TITLES`；阈值配置在 `GAME_CONFIG_DEFAULTS.season.titleThresholds`，可通过调试面板参数配置修改并写入 `game_config`。
- 赛季页显示倒计时、赛季进度、记录数、专注时长、有效学习日、三科称号、总称号、SVG 热力图和 SVG 每周趋势图。
- 赛季报告支持文字版和 JSON 两种格式弹窗复制；历史赛季点击后用结束时保存的 snapshot 回看。

## 管理后台

- 访问 `index.html?admin=1` 触发管理员密码弹窗；默认密码为 `mochi2025`，修改后存在 `admin_password`。
- 后台是独立全屏覆盖层，包含六个 section：赛季管理 / 勋章参数 / 称号阈值 / 转盘内容 / 学年日历 / 修改密码。
- 后台开启新赛季会写入 `current_season`，并重置当季勋章计数；未使用抽奖机会通过 `achievement_state.carriedLotteryDraws` 带入新赛季。
- 后台结束赛季会生成 snapshot，写入 `season_archives`，并清除当前赛季。
- 勋章参数写入 `achievement_config`；称号阈值写入 `game_config.season.titleThresholds`；转盘内容写入 `lottery_config`。
- 学年日历仍使用原有 `school_holidays` key，保持 `{ id, label, start, end }` 范围数组格式；单日切换会增删单日假期，取消范围中的某天时会拆分该范围。

## 调试方式

访问 index.html?debug=1，右下角出现调试面板，可以手动设置各科 recordCount。

## 游戏参数配置

所有游戏参数集中在 `app.js` 顶部的 `GAME_CONFIG_DEFAULTS` 对象里。
运行时配置读自 `localStorage` 的 `game_config` key，启动时和默认值深合并。
访问 `index.html?debug=1` 打开悬浮面板，Tab2“参数配置”可以直接修改所有参数。
**不要在代码里硬编码游戏数值，统一引用 GAME_CONFIG。**

## 重要约束

1. 不能随意改动 study_log 的字段结构，这个数据将来要给AI分析用；当前每条记录包含 `originalQuestion`，`questionsCompleted` 固定为 1
2. 不能改动备份文件的 version 和 data 结构，导入时靠这个判断兼容性
3. 精灵图不能用 SVG 或 emoji 替代，必须用 crops_.png
4. 知识点名称必须来自预设列表，不能自由发明
5. 农场币系统已删除，不要重新加回来
6. 种子/水桶/肥料资源系统已删除，不要重新加回来
7. 学习点/爱心/喂食系统已删除，不要重新加回来；旧 key `mochi_study_points`、`mochi_hearts` 只用于跳过或清理兼容数据
8. 每日目标由当天导入记录自动完成，不再有手动完成按钮，也不再使用 `daily_task_settings` 或 `daily_tasks_YYYY-MM-DD`
9. “假期全勤”勋章已删除，不要重新加回来
10. “知识点亮”统计任何有学习记录的知识点（status 不是 `untouched`）；“精通达人”统计连续 2 次 3 星达成 `mastered` 的知识点
11. 每次修改后用 node --check 验证 JS 文件语法

## Codex 协作规则

- 修改项目前，先阅读本文件，确认当前架构和禁止事项。
- 每次完成实质性功能改动后，更新“当前版本状态”。
- 如果发现代码实现和本文档冲突，先向用户说明冲突点，再决定是修代码还是修文档。
- 不要为了实现新功能推翻农场系统、学习档案、localStorage 数据结构或备份格式。

## 当前版本状态

v34 → V3.2 改动摘要（已稳定，详见 git 历史）：

- 农场固定三块地按科目，recordCount 驱动生长；知识地图替换为卡片收藏册
- 勋章/抽奖（DOM 卡牌玩法，非 Canvas 转盘）/赛季/管理后台全部建立
- 首页单列 `.home-flow` 布局；四 tab 导航（首页/学习/勋章/设置）
- 沉浸模式专注 + deciding 阶段；`parsePastedRecordEl()` 供首页和沉浸复用
- 番茄钟默认自由专注；提醒改用 Web Audio API；旧通知 key 废弃
- 抽奖为全屏两栏布局（`.lottery-body` flex row），木鱼在左侧 `.lottery-sidebar`
- 设置页支持 AI Prompt 复制（`copyAiPromptFile()`，`file://` 下 fallback `window.open()`）
- 今日学习报告：`renderTodayReport()` + `exportTodayReportImage()`

### V3.3 代码债治理 + 首页减负 + 本周趋势（2026-06-14）

- **共享数学公式渲染**：`formatRichText`/`formatInlineMath`/`replaceMathCommand` 抽到 `app.js` 并经 `window.MochiApp` 导出（`formatRichText`/`formatInlineMath`）。`farm.js`、`reviewPage.js`、`knowledgeMap.js`、`calendar.js` 四处各自复制的约 90 行实现改为薄包装 `window.MochiApp?.formatRichText?.(value) ?? escapeHtml(value)`，共删除约 340 行重复代码，并修掉旧版里 `dfrac/tfrac/frac` 被连续写两遍的复制错误。新增渲染逻辑统一改 `app.js` 这一份。
- **死代码清理**：`reviewPage.js` 删除无人调用的 `stars()`、`statusLabel()`（`subjectLabel()` 仍在用，保留）；`style.css` 删除已无引用的 `.home-guide-card`/`.home-help-details`/`.home-guide-steps`/`.home-guide-head`/`.home-guide-note` 规则。
- **首页减负**：删除 `farm.js` 的 `renderGuideCard()`（“第一次用？查看步骤”小卡），与功能重叠的 `renderAiGuideCard()` 合并为一张；`renderAiGuideCard(open)` 新增 `open` 参数，首次使用（无任何记录）时默认展开，有记录后默认折叠。
- **侧边栏头部**：`pet.js` `renderMiniState()` 把无意义的 `XP{n}`（农场等级实际由 `totalHarvests` 驱动，XP 不影响任何东西）替换为对学生更有激励的「连续{streak}天」（streak<2 时只显示收获次数）；`index.html` 静态初始值同步从 `收获0次 · XP0` 改为 `收获0次`。
- **复习导入放宽**：知识点不匹配时不再硬拒绝、丢失学生劳动。`reviewPage.js` `importReviewResult()` 改为提示并提供「按识别到的知识点导入」按钮（新 action `import-anyway` + 新函数 `importReviewAsDetected()`），记录照实归档到 AI 识别到的知识点下、不计入本次复习项、不污染标签；首页 `importItemByKey()` 同步改为不匹配时照实导入并经 `onSuccess` 提示。
- **本周趋势小图**：`farm.js` 新增 `renderWeekTrend()`，在首页右栏迷你农场下方渲染近 7 天每日卡片数的纯 CSS 柱状图（今日高亮、本周为 0 时不显示、仅有记录时显示）；`style.css` 新增 `.week-trend-card` 系列样式，配色用 `--primary`/`--primary-soft`。

### V3.4 首页第一屏精简 + 复习傻瓜化步骤 + 缓存版本号（2026-06-14）

- **首页第一屏精简**：`farm.js` 删除 `renderTodayStudyEntry()`（单独的「今日学习报告」卡）。它和 `renderStreakBanner()` 重复显示今天的数字。现把专注分钟和「报告」入口合并进 streak 横幅：横幅主文案改为「今天 N 张卡片 · M 分钟专注」（无专注时退化为「今天已导入 N 张卡片」），右侧按钮在有记录时为「报告」（`data-route="today"`）、无记录时为「去导入」。`style.css` 删除已无引用的 `.home-today-study-card` 系列规则（含 640px 媒体查询里的相关选择器，保留 `.today-title-row`）。
- **复习剪贴板往返傻瓜化**：`reviewPage.js` `renderImportPanel()` 把原来一行 `.review-panel-hint` 提示改为三步导引 `<ol class="review-stepper">`：① 材料已复制（done 态打勾）② 打开复习 AI 先回想 20 秒再粘贴做题 ③ 把含 MOCHI-RECORD 的输出整段粘回导入。`farm.js` 首页复习卡导入态同步加 `.review-stepper.review-stepper-compact` 两步精简版，替换原 `.home-review-import-hint`。`style.css` 用 `.review-stepper`/`.review-step`/`.review-step-num`/`.review-step-text`（含 `.done` 绿色打勾态）替换 `.review-panel-hint`，并新增 compact 变体；删除 `.home-review-import-hint`。
- **静态资源缓存版本号**：`index.html` 给 `style.css` 和全部 `modules/*.js`、`app.js` 的引用加 `?v=` 查询串，强制浏览器在每次版本变更后重新加载，避免改了源文件但页面仍用旧缓存（本地 `file://`/简单静态托管下尤其常见）。**以后每完成一轮实质改动，把这个版本号一起更新（当前为 `20260614c`，每轮递增后缀），用户刷新即可见。**

### V3.5 导入成长庆祝 + 综合测验闭环（2026-06-14）

- **导入成长庆祝**：`app.js` `parsePastedRecordEl()` 单条导入路径，在 `applyMochiRecord` 前后用 `window.MochiFarm.calcPlotStage(subject)` 取地块生长阶段；若跨过一个阶段则在成功卡里加一条高亮 `.checkin-growth`（如「🌱 数学地块长大了：发芽 → 幼苗」，成熟时为「🌟 …可以收获啦！」）并额外触发一次 `sparkle(result, "🌱")`，把「做题」和「看得见的成长」直接挂钩。`style.css` 新增 `.checkin-growth` 及 `checkin-pop`/`checkin-icon-pop`/`checkin-growth-pop` 三个关键帧，给成功卡和 ✓ 图标加弹入动效。阶段名常量 `STAGE_NAMES = ["荒地","种子","发芽","幼苗","开花","成熟"]`。
- **综合测验闭环**：原来综合测验在复习页复制测验包，但做完的多条记录只能粘回首页导入框，复习页无粘回入口。`reviewPage.js` 新增 `STATE.sessionActive`：点「综合测验」后置 true，复习页顶部展开 `renderSessionPanel()`（三步 stepper + 批量 textarea + 导入按钮 + 关闭✕）。新增 `importSession()` 用导出的 `window.MochiApp.parseAllMochiRecords`/`applyMochiRecord` 在复习页内批量导入，**不调用 `parsePastedRecordEl`**（后者的 `refreshVisibleRoute()` 会把用户弹回「今日」tab 并冲掉面板）；导入后清 `sessionActive`、留在复习页、显示成功 inline 提示。`bindContainer` 新增 `session-import`/`session-dismiss` 两个 action。`style.css` 新增 `.review-session-panel`/`.review-session-head`/`.review-session-dismiss` 样式。

### V3.6 第一性原理打磨现有链路（不加功能，2026-06-14）

方向：纯打磨现有界面/操作逻辑的"顺手度"，不新增功能。版本号 → `20260614d`。

- **导航：学习子 tab 不再被弹回。** `app.js` `renderLearn(container, tab)` 删除 `if (!tab) learnActiveTab = "today"`。原逻辑导致任何不带 tab 的刷新（`refreshVisibleRoute()`、点底部「学习」）都把正在「复习/档案」的用户强制弹回「今日」。改为不带 tab 时保留 `learnActiveTab`（模块初值仍是 "today"）。
- **导入动作：粘贴即导入（省一次点击）。** 核心动作"粘贴→点确认导入"里那次点击多余。多处导入框新增 `paste` 监听：贴进的文本含完整 `---MOCHI-RECORD-END---` 时自动导入，按钮保留为兜底。覆盖：首页主导入框 `#record-paste`（farm.js，调 `parsePastedRecordEl`）、首页复习卡 `#home-review-paste`（farm.js，自动点击 import 按钮）、沉浸模式 `#focus-record-paste`（app.js `bindFocusOverlay`）、复习页逐项 `[data-review-input]` 与综合测验 `[data-session-input]`（reviewPage.js `bindContainer` 委托 paste，自动点击对应导入按钮）。placeholder 文案统一改成「把 AI 给你的记录整段粘进来，会自动导入」一类人话，去掉 “MOCHI-RECORD” 术语。
- **专注：结束按钮措辞前后一致。** 专注中按钮原为「我累了，现在休息」（已替用户决定休息），但点完进 deciding 又问「开始休息 / 结束今天」，逻辑矛盾。改为中性的「结束这一轮」（图标 `stop_circle`，action 仍是 `stop-and-rest`），真正的休息/结束选择留在 deciding 屏。`app.js` 沉浸 overlay 和 `pet.js` `renderTimer` focusing 卡同步改。

### V3.7 全自动打磨：代码一致性 + 空状态 + 接通悬空 prompt（2026-06-14）

本轮为「成品推送 GitHub 后」的全自动迭代，纯打磨、不加功能。版本号 → `20260614f`，顶部加 `build-X` 可见标记便于确认缓存刷新。

- **escapeHtml/escapeAttr 统一。** 原本 6 个模块各复制一份。`knowledgeMap.js`/`reviewPage.js`/`calendar.js`/`pet.js`（escapeAttr+escapeHtml）改为薄包装 `window.MochiApp?.escapeHtml?.(value) ?? …`（`farm.js`/`todayStudy.js` 此前已是包装）。`app.js` 的规范版 `escapeHtml` 改为 `String(value ?? "")`，避免 `undefined`/`null` 渲染成字面文字，惠及所有委托模块。
- **空状态消除死胡同 + 分场景。** `knowledgeMap.js` `renderEmpty()` 加「去导入第一条」按钮（`data-route="home"`）。`reviewPage.js` `renderFlatList()` 空态区分两种：零学习记录 → 「还没有学习记录，先去导入」+ 去导入按钮；已无到期项 → 「目前没有需要复习的薄弱点，先去学新题吧 👍」，新用户不再被「没有薄弱点」误导。
- **接通悬空的综合测验 prompt。** `skill/gaokao综合测验.md` 一直存在、且复习页「综合测验」流程引用它，但设置页 AI 指南只挂了 2 个 prompt、用户拿不到它。`app.js` `renderSettings()` 新增第三个 `<details>` 条目（高考综合测验 AI 私教，`data-prompt-path="./skill/gaokao综合测验.md"`），并把「两个 AI Prompt」改为「三个」，闭合断掉的引用。
- **GitHub：** 当前网站作为成品推送到 `github.com/ItsAlwaysTerry/MochiStudy` main 分支；`.gitignore` 新增忽略 `.agents/` 与 `skills-lock.json`（技能工具产物，非网站文件）。

### V3.8 抽奖「命运牌局」质感重做（不改抽奖逻辑，2026-06-14）

抽奖三段式逻辑（showcase 看奖池 → dice 摇双骰子 → pick 翻牌 + near-miss + result）和保底/运气槽机制**保持不变**，只做视觉质感和一处交互打磨。版本号 → `20260614h`。

- **骰子一键同掷（交互）。** 原 dice 阶段有「摇第一颗 / 摇第二颗」两个按钮、要点两次。`app.js`：lp-dice 标记去掉两个 per-die 按钮，改为单个 `data-action="roll-both"` 按钮；`rollSingleDie()` 重构为不碰按钮的 `animateDie(index, extraSteps)`，新增 `rollBothDice()` 用 `Promise.all` 并行滚两颗（第二颗 `extraSteps=2` 稍晚落定更有戏），全停后统一 `updateDiceState()`。handler `roll-die` → `roll-both`。`phase-to-pick-direct`/`btn-phase-pick-direct` 残留引用已无害（守卫存在）。
- **沉浸式背景。** `style.css` `.lottery-overlay` 从半透明 `rgba(18,12,16,.96)` 改为多层径向+线性渐变的「牌桌」氛围 + `inset` 暗角，不再透出背后页面。
- **烫金标题。** `.lottery-title` 用 `background-clip:text` 金色渐变 + 字距 + 柔光（带 `#f7e3b0` 回退色）。
- **奖池卡片质感。** `.showcase-card` 改为带顶部 `--item-color` 色条、深色渐变底、内/外阴影、hover 上浮 4px 的「牌」质感。
- **主行动按钮。** `.lottery-action-btn` 暖金渐变 + 光泽扫过 `::after` + 轻微呼吸 `lottery-btn-pulse`；`:disabled`/`.is-rolling` 时停动画、隐藏光泽。
- **骰子区。** `.lottery-dice-panel` 加绿绒径向渐变 + 内阴影；`.lottery-die` 加大到 88px、金边、双高光。
- 注：CLAUDE.md「勋章系统」里旧描述「转盘用 Canvas 绘制…easeOutCubic」已过时，抽奖实为 DOM 卡牌玩法，非 Canvas 转盘。

第二轮（build `20260614i`）：奖池 `showcase-deal` 发牌入场动效（逐张 55ms delay）；`showBigWinCelebration()` 在大奖/保底时撒金光花；`.pick-card-front` 加斜纹+金边牌背质感。

### V3.9 主动出测验：学习档案就地选范围（build `20260614j`）

需求：原来学生只能等算法判定"该复习"才能测，或一次性导出全部素材；没法主动选范围测。底层出包能力其实都在（`generateNodeReviewPack(单点)`、`generateSessionPack(任意 overrideItems)`），只缺"选范围"的 UI。方案：**学习档案三层就地选 + 偏弱点优先的随机周测**，统一复用复习页的综合测验粘回面板，不改数据结构。

- `reviewPage.js`：新增并导出 `openSessionForPack(pack, label)`——复制任意范围的测验包、置 `STATE.sessionActive`、`navigate("review")` 打开综合测验粘回面板。
- `knowledgeMap.js` 新增 `reviewItems()`（取 `buildReviewState().items`，含所有有记录的知识点，不止到期项）、`quizNode(key)`（单知识点 → `generateNodeReviewPack`）、`quizCard(nodeKey, cardId)`（克隆 item 把 entries 换成单张卡）、`quizSubject()`（本科目 `pickWeakFirst` 抽最多 4 个 → `generateSessionPack`）、`pickWeakFirst()`（按 `score+1` 加权不放回随机，弱点优先）。
- UI 入口三层：学习档案顶部「随机周测」（`data-archive-action="quiz-subject"`，按当前科目 `STATE.activeSubject`）；知识点摘要里「测这个知识点」（`quiz-node` + `data-review-key="subject::label"`，不再受到期限制）；每张卡片操作区「测这张」图标（`data-card-action="quiz-card"`，用卡片 `data-card-subject/-node-label/-id` 定位）。`item.key` 格式为 `subject::nodeLabel`。
- `style.css` 新增 `.archive-quiz-node-btn`（整宽 + 上间距）。

第二轮修正 + 增强（build `20260614k`）：
- **修可见性 bug**：`#learn-content-pane .page-head { display:none }` 把整个 page-head（含原来放在 `.archive-head-actions` 里的「随机周测/导出档案」）隐藏了，所以学生看不到随机周测。把动作按钮移出 page-head，放到科目 tab 下方的可见行 `.archive-actions-row`。
- **随机周测加选项**：点「随机周测」改为弹出自包含 overlay `showQuizSheet()`（复用 `.archive-export-root/.archive-export-sheet` 外层），可选**科目**（全部/数学/物理/化学，默认当前科目）和**题量**（2/3/4/5 个知识点），确认后 `quizSubjectScoped(scope, count)` 出包。
- **「测这张」改为多选**：卡片 quiz 图标（`add_task`/选中 `check_circle`）改为切换 `STATE.quizSelected`(Set of cardId)；知识点摘要里出现 sticky 操作条 `.quiz-select-bar`「已选 N 张 / 清空 / 测这 N 张」；`quizSelectedCards(nodeKey)` 把选中卡片打成单知识点包。切换知识点/科目时清空选择。删除原 `quizCard()` 单卡即时函数。

第三轮增强（build `20260614l`）：
- **随机周测加"只测哪类"过滤**：`showQuizSheet` 第三个字段 `filters`（全部弱点 / 没复习过 / 有低星）；`quizSubjectScoped(scope, count, filter)` 按 `it.reviewCount` / `it.lowStarCount` 过滤后再 `pickWeakFirst`。
- **多选改为跨知识点（甚至跨科）**：选择不再在切换节点/科目时清空（删除两处 `STATE.quizSelected.clear()`）。新增 `selectedGroups()` 把选中卡片按所属知识点分组；`quizSelectedCards()`（无参）单组用 `generateNodeReviewPack`、多组用 `generateSessionPack(overrideItems)`。选择条改为**全局浮条** `renderQuizSelectBar()`（在 `render()` 末尾输出，`.quiz-select-bar-global` 固定在视口底部、≤980px 上移到 88px 避开底部导航），显示"已选 N 张 · M 个知识点"。

### V4.0 滚动复位 + 删除孤儿日历 + 复习空状态出口（build `20260614n`）

- **导航回顶**（build m）：文档/窗口是滚动容器，跳转继承旧滚动位置（档案下滑后跳复习页看不到顶部面板）。`route()` 末尾加 `window.scrollTo(0,0)`（只有真实导航走 route，`refreshVisibleRoute`/局部 render 不受影响）；学习子 tab 切换也回顶。
- **删除孤儿日历模块**：`route()` 把 `#schedule` 重写为 `#season`，`renderSchedule` 永不渲染；`data-month/data-date/data-node-id/day-detail/day-summary` 全是只消费无产出的死处理。删除 `modules/calendar.js`（424 行，加载时无副作用）、index.html 的 calendar script、`refreshVisibleRoute`/handleClick 里的两处 `renderSchedule` 分支和四段死点击处理。`window.MochiCalendar` 已不存在；日历相关数据（`focus_log`/`school_holidays`）本就经 `MochiApp` 读取，不受影响。`.calendar-*`/`.schedule-grid` 死 CSS 暂留。
- **复习已追平的出口**：`reviewPage.js` `renderFlatList` 已追平空状态（系统无建议项）原本是死胡同，新增「去出随机周测」按钮（`data-route="map"` → 学习档案），把想继续主动测的学生导向随机周测。

### V4.1 入口归并 + 命名梳理 + 死 CSS 清理 + 身份/默认页（build `20260615a`）

确立测验/复习的二元心智模型：**「复习」= 系统建议（复习队列 tab + 首页今日复习卡，被动）** vs **「测验」= 自己挑范围出题（出测验按钮 + 测这个/测这 N 张，主动）**。

- **入口归并**：`knowledgeMap.js` `showQuizSheet(defaultScope)` 加默认科目参数并经 `window.MochiCards` 导出，复习页与档案共用同一个"出测验"弹窗。`reviewPage.js` 删除藏在隐藏 `.page-head` 里、其实看不见的「综合测验」按钮（`start-session` + `startSessionReview` 一并删除），改为**可见的** `.review-actions-row`「🎲 出测验」按钮（`open-quiz` → `MochiCards.showQuizSheet("all")`）+ 一行说明。已追平空状态的出口也改为就地 `open-quiz`。
- **命名梳理**：弹窗标题「随机周测」→「出测验」，go 按钮「出这份周测」→「出这份测验」，档案头部按钮「随机周测」→「出测验」，session 面板标题「综合测验进行中」→「测验进行中」，`quizSubjectScoped` 的 label「随机周测」→「测验」。保留指向真实 AI 角色"综合测验 AI 私教"（`skill/gaokao综合测验.md`）的措辞。
- **死 CSS 清理**：删除已删日历模块遗留的 `.calendar-card/.calendar-head/.month-switch/.calendar-legend/.weekday-row/.calendar-grid/.day-cell（及 .level-1/2/3/.has-data/.muted-day/strong）/.day-number/.day-subjects` 主块（style.css 约 98 行）和移动端媒体查询里的相关规则。`.schedule-grid` 仍被设置页用，保留；season 热力图 `heatmap` 类与 admin 日历类保留。
- **侧边栏身份**：`index.html` 静态 + `pet.js` `renderMiniState` 的侧边栏头部 `<h1>` 从「我的农场」改为「Mochii」（农场已是配角，一级身份用品牌名）。
- **默认子 tab**：`app.js` `learnActiveTab` 初值 `"today"` → `"review"`，点底部「学习」首次落在「复习队列」（更可操作）；之后仍记住上次所在子 tab（V3.6 起无参 `renderLearn` 保留 tab）。

### V4.2 从零重学一章（针对基础极差、想从头学的学生，build `20260615b`）

背景：真实用户基础极差（一张卷子 80-90% 不会），不会主动复习旧错题；但他有"某章太烂、想从零重学"的意愿，而这块此前完全空白。方案：新增**讲解型**（区别于做题型）AI 私教，由 app 把章节名预填，走和测验一样的"复制 → 粘给 AI → 粘回导入"闭环。不动数据结构。

- `reviewPage.js`：把粘回面板从写死"测验"**泛化**。`openSessionForPack(pack, label, opts)` 新增 `opts.ai`（AI 角色名）/`opts.verb`（动作词）；`STATE` 加 `sessionLabel/sessionAi/sessionVerb`；`renderSessionPanel` 标题/步骤文案、`importSession` 完成提示都按 STATE 取词。测验路径用默认值（综合测验 AI 私教 / 测验）不变。
- `knowledgeMap.js`：新增 `buildRelearnPack(subjectLabel, nodeLabel)`（自包含讲解型 prompt，章节预填，以「【MochiStudy 从零重学】」开头过 `openSessionForPack` 守卫，记录段 `学习来源：新学`）；`showRelearnSheet()`（自包含 overlay：选科目 → 点一个知识点立刻生成并 `openSessionForPack(..., { ai:"从零重学 AI 私教", verb:"重学" })`）。学习档案动作行新增「从零重学」按钮（`data-archive-action="relearn"`）。
- `skill/gaokao重学.md`：从零重学私教 persona（建直觉 → 拆最小台阶 → 每步出超简单题确认 → 学会一步输出一条记录）。`app.js` 设置页 AI 指南补为**第 4 个** prompt 条目（`./skill/gaokao重学.md`），说明从「三个」改「四个」。
- `style.css`：`.relearn-node-options` 知识点列表超高时可滚动。

### V4.3 学习档案陈列精简（中度去下钻，build `20260615d`）

用户反馈档案下钻太深（知识点行 → 摘要 → 历史卡片折叠 → 卡片 → 套路 → 看原题，4 层）。中度精简到 2 层：

- **去掉中间"历史卡片"折叠层**：`renderNodeDigest` 删除 `<details class="archive-history-details">`，展开知识点直接显示卡片列表；新增 `.archive-cards-head`（卡片数 + 多选提示一行）。`STATE.historyExpanded` 与 toggle 监听不再使用（监听已删，STATE 字段留存无害）。
- **卡片一次展开看全**：`renderStudyCard` 把原来互斥的"今日套路 toggle"和"看原题 toggle"合并为单一展开——点卡片展开 `.card-detail`（套路 + 原题一起显示，原题加「原题：」标签）；删除独立的「看原题」按钮和 `.card-question-area/.card-question-toggle`。`STATE.expandedCards` 值由 `"routine"|"question"` 改为布尔 `true`；点击处理 `toggle-routine`/`toggle-question` 合并为 `toggle-card`。卡片底部加 `.card-expand-hint`（▾/▴）提示可展开；无套路无原题的卡不可展开。
- **顺带**：删除每张卡的拖动手柄 `data-card-action="drag"`（多余；拖拽监听变空操作，暂留）。`source` 标签已有「新学/复习」区分（`sourceDisplayInfo`），新学卡片在档案里天然带「新学」标签，不与错题混淆。
- `style.css`：新增 `.card-detail`/`.card-expand-hint`/`.archive-cards-head`；删除死的 `.archive-history-details`/`.card-question-area`/`.card-question-toggle` 及 `#learn-content-pane .card-question-toggle` 引用。

### V4.4 啃卷子 AI 私教 + 入口三处（build `20260615g`）

背景：学生拿老师的考卷，80-90% 不会。新增**做题型**啃卷子私教，先排优先级再逐题带。

- `skill/gaokao啃卷子.md`：自包含 prompt。两维度评分排序——**高考考频 × 短期提分空间**（各 1-5，综合 = 考频×0.5 + 提分×0.5）。学生信息写死广东省全国卷理科。先让学生报错题 → AI 排序表 → 确认后逐题带 → 每题输出一条 MOCHI-RECORD（`学习来源：错题`）→ 整段粘回批量导入。
- 入口三处：设置页 AI 指南第 5 条（`data-prompt-path="./skill/gaokao啃卷子.md"`，文案「四个」→「五个」）；复习页 `.review-actions-row`「啃卷子」按钮；学习档案 `.archive-actions-row`「啃卷子」按钮。三处都走全局 `copy-ai-prompt` handler。
- `style.css`：`.ai-prompt-summary` 加 `justify-content:space-between`，修复 5 个 prompt 复制按钮右对齐不一致。

### V4.5 专注承诺门：每轮强制设目标 + DDL + 说到做到留痕（build `20260615i`）

针对真实痛点：学生用"埋头盲做"逃避"思考规划"，没 DDL 时间就蔓延填满（帕金森定律）。让每轮专注前强制设目标和时限。**第一版做歪了**（进网站全屏锁所有功能、且今天填过就不再弹），本版重做：

- **门绑定到"开始专注"动作，不锁其他功能。** 番茄钟 setup 卡（`pet.js` `renderTimer` setup 分支）简化为一个大「开始专注」按钮（`data-action="open-commitment"`）+ 今日统计，删掉原目标输入/模式切换/时长输入。看卡片、复习、成果都不被拦。
- **每一轮都弹，不是每天一次。** `app.js` `showCommitmentModal()`：居中 modal（`#commitment-gate` z-index 950，半透明 backdrop），填「这一轮目标」（≥2 字）+ 选时长（25/45/60/自定义，**去掉"自由"——选时长才有 DDL**），两者齐全才能点「开始这一轮」→ `MochiTimer.startFocusDirect(goal, mins)`。可点 ✕ 关闭。上学日（非有效学习日）不拦，走 `startFocusFreeFallback()` 自由专注。
- **`timer.js` 新增 `startFocusDirect(goal, durationMins)`**：绕过 DOM 读取，由门直接传参启动；选了时长 `freeMode=false`，否则自由。
- **结束对照 + 留痕。** deciding 阶段显示「你说要：<目标>」+ 三档反馈（搞定/部分/没完成 → `data-action="commitment-done/partial/none"`）。`reflectCommitment(outcome)` 把 `{goal,plannedMins,actualMins,outcome,date,ts}` 追加到 `commitment_history`（新 localStorage key，最多 50 条）。当前轮承诺存内存 `_activeCommitment`（跨刷新不留，没反馈就丢）。
- **首页"说到做到"回看卡。** `farm.js` `renderCommitmentRecap()`：有历史时在右栏渲染近 4 轮目标 + 完成标记（✓绿/◐黄/✕红）+「近 N 轮做到 M 轮」+ 按做到率给一句话（≥70%/≥40%/更低）。这是长期反馈——让学生看见自己规划准不准，是软件唯一能施加的"真实压力"（软件无法物理阻止绕过）。导出 `showCommitmentModal`/`commitmentKeptRate`/`readCommitmentHistory` 给 farm 用。
- `style.css`：`#commitment-gate` 加 backdrop-blur + pop/fade 动画 + `.commitment-close`/`.commitment-tip`/`.commitment-custom-input`；新增 `.commit-recap-*` 系列。

### V4.6 学习记录接入承诺 + 历史多日翻阅（给家长监督，build `20260615j`）

需求：① 把每轮专注的"目标 + 完成情况"显示在今日学习报告里，方便家长翻阅评估孩子学习前有没有认真定目标；② 今日学习页原本只能看今天，加历史回看，能翻所有学过的日子。

- **承诺接入今日报告（`todayStudy.js`）**：`focus_log` 完成时已存 `microGoal`（专注目标），完成情况（done/partial/none）在 `commitment_history`。新增 `attachCommitments(sessions, date)` 按 **日期+目标文本** 把承诺 join 到对应专注轮（不改 `focus_log` 结构）。`renderSession` 把目标从一句话灰字升级为 `<b>这一轮目标：</b>` + 完成标记徽章（✓达成绿/◐部分黄/✕没完成红）+「计划N分·实际M分」。导出长图 `drawExportTimeline` 副标题同步加「目标：… · 目标达成✓」。
- **历史多日翻阅（`todayStudy.js`）**：`readTodayData()` 泛化为 `readDayData(date)`（`currentFocusSession()` 仅当 date 是今天才并入）；模块状态 `viewDate` 默认今天。新增 `allStudyDates()`（study_log/focus_log/commitment_history 日期并集，降序）。`render(container, dateOverride)` 顶部加 `renderDateSwitcher()`：◀更早 / 日期下拉（含周几、今天标注）/ 更近▶ / 「回到今天」。非今天时标题显示「学习记录」。`window.MochiTodayStudy.render` 签名兼容旧调用（无 dateOverride 保留 viewDate）。
- `style.css`：新增 `.today-date-switcher`/`.today-date-nav`/`.today-date-select`、`.today-session-goal`/`.today-session-nogoal`、`.today-commit-row`/`.today-commit-badge`(kept/partial/missed)/`.today-commit-plan`。

### V4.7 三人格审视后打磨目标功能：保护自信 + 零摩擦 + 自评有据（build `20260615k`）

经"学习专家 / 乔布斯 / 芒格"三人格 5 轮讨论 + 投票，对目标功能做 4 项改动，核心矛盾：当前版本对"缺乏自信"的用户画像是净伤害（天天暴露失败次数 → 习得性无助）。

- **P0 保护自信（红线）**：`farm.js` `renderCommitmentRecap()` 从"近 N 轮做到 M 轮"（暴露失败）重写为成长导向「你的节奏」——只讲做了什么：本周专注次数 vs 上周（`weekStartKey` 算周一）、连续按时收尾轮数、兜底鼓励，**不显示失败计数**。连续 2 轮 `outcome==="none"` 时显示拆小引导 `.commit-recap-shrink`「目标是不是定大了？下轮只挑 1 道」，把失败重构成"目标该拆小"而非羞辱。卡片不再逐条列 outcome（移交今日报告），底部「看每一轮的目标和完成 →」跳 `data-route="today"`。
- **P1 承诺门零摩擦**：`app.js` `commitmentPresets()` 拉 `buildReviewState().todaySuggestions`/`items` 生成「复习X」预设 chip（≤3 个），`showCommitmentModal` 目标输入框上方一键填入、保留手写；时长默认高亮 25 分（`selectedMins=25`，25 按钮带 `active`）——差基础专注力弱，1 小时反人性。
- **P2 自评有据**：`app.js` `roundImportSummary(sessionId)` 按 study_log 的 `sessionId` 统计本轮导入卡片数 + 科目；deciding 反馈前显示「这一轮你导入了 N 张卡片（科目）」，问法改「对照你的目标，搞定了吗？」。让自评锚定客观痕迹、顺带逼一次回顾。无导入时提示"光想没动笔也算没搞定"。
- **P3 去冗余**：P0 后首页卡只剩成长摘要 + 跳转链接，逐轮明细归今日报告独有，两处不再重叠。`commitmentKeptRate` 仍导出但 farm 已不用（留存无害）。
- `style.css`：重写 `.commit-recap-*`（headline/shrink/detail），新增 `.commitment-presets`/`.commitment-preset-chip`/`.commitment-presets-label`、`.focus-commitment-imported`。

### V4.8 deciding 反思从"点按钮"升级为"显眼输入框"（build `20260615m`）

用户反馈：deciding 的"搞定/部分/没完成"字小、点一下就消失，触发不了主动回想。改为让学生**自己写下这一轮真实情况**，并进今日学习记录给家长看。

- `app.js` renderFocusOverlay deciding 分支：目标文字放大加粗；新增显眼 `<textarea id="commitment-reflect-note" class="focus-reflect-input">`（placeholder 引导"搞懂了什么/卡在哪/为什么没完成/哪里花太多时间"）；三个 outcome 按钮放大为 `btn-soft`。`bindFocusOverlay` 的 commitment-* 分支读取 textarea 值，传给 `reflectCommitment(outcome, note)`。`reflectCommitment` 新增 `note` 参数，存进 `commitment_history` 条目的 `note` 字段。
- `todayStudy.js` `renderSession`：`session.commitment.note` 存在时显示 `.today-commit-note`（带左边框引用样式），让家长在「今日」页看到学生原话，不止"部分完成"。
- `style.css`：`.focus-commitment-goal-label` 18px 加粗；新增 `.focus-reflect-label`/`.focus-reflect-input`（深色遮罩上的白字输入框）；`.focus-deciding-hint` 14→16px；新增 `.today-commit-note`。
- 导出长图（canvas）：`drawSession` 在副标题和卡片之间插入学生反思——浅色底框 + 左色条 +「我的记录」标题 + 换行正文；新增 `sessionNoteHeight()` 估算额外高度，`estimateExportHeight` 的 session 循环同步加上，避免裁切（build `20260615n`）。
- **反思必填（build `20260615o`）**：deciding 有未反思承诺时，反思框写够 2 字前，完成按钮 `disabled`。`bindFocusOverlay` 给 `#commitment-reflect-note` 绑 input 监听 `sync()`，`value.trim().length>=2` 时解锁。`style.css` 加 `.focus-commitment-reflect .btn:disabled`/`.focus-overlay-actions .btn:disabled` 灰显。
- **修复跳过漏洞（build `20260615p`）**：原来第一屏「开始休息/结束今天」和完成按钮并列，用户填了反思直接点休息就**跳过选结果**、`reflectCommitment` 没被调用、note 和 outcome 全丢。改为：有未反思承诺（`c`）时第一屏 `${!c ? actions : ""}` **不渲染**休息/结束，唯一出口是三个完成按钮（仍受反思必填锁）；点完成 → `reflectCommitment` 记录 → 重渲染 c 变 null → 第二屏才出现休息/结束。强制顺序：填反思 → 选结果 → 休息/结束。提示文案随之改为「先写两句，再选这一轮的结果」/「选一个这一轮的结果，再去休息」。

### V4.9 设置页加「更新到最新版本」git 指南（build `20260615q`）

换电脑/同步最新版本时方便操作，把 git 拉取指南直接放进设置页（「更新到最新版本」section，在「关于」之前）。三步可折叠：① 常规 `git checkout main` + `git pull origin main`；② 报错时强制同步 `git reset --hard origin/main`（带丢改动警告）；③ 首次 `git clone`。每步有「复制命令」按钮——新 action `copy-cmd` + `copyCmd(btn)` 读 `data-copy-text`（多行用 `&#10;` 编码）写剪贴板。`style.css` 新增 `.update-step`/`.update-step-head`/`.update-step-summary`/`.update-cmd`（深色等宽代码块）。

### V5.0 题桌 Phase 0：视觉 AI go/no-go 验证（build `20260618a`）

先验证站内视觉 AI 再做题桌 UI。`modules/ai.js` 保持旧 `callAI()` 兼容，新增多模态链：`callMessages()`/`callAIWithImage()`/`testVisionAI()`（OpenAI 用 content array + `image_url`，Anthropic 用 `image` base64 block）；`max_tokens` 改可配置（默认 2200）。设置页加「最大输出 tokens」和「视觉 AI 验证」卡片。新增 `skill/gaokao题桌.md`（一图一题视觉讲解 prompt，区别于 `gaokao啃卷子.md` 跨题排序）。验证 prompt 强制模型先抄图中数字/题号/公式原文，避免文本模型胡编 false pass；`原题` 须尽力转写题干核心，不能写「见原图」。

### V5.1 题桌 Phase 1 MVP：一图一题站内学习闭环（build `20260618b`）

在「学习」页新增「题桌」子 tab，并设为学习页默认入口；不新增第 5 个底部导航。新增 `modules/questionDesk.js`：支持复制截图后在题桌 `Ctrl+V`、或上传图片；图片 Blob 存 IndexedDB（`mochi_question_desk/question_images_blob`），索引存 localStorage（`question_desk_images` / `question_desk_items` / `question_desk_ui_state`）；默认命名 `未分类-拍题-YYYY-MM-DD-编号`，左侧文件栏按收件箱/三科/已学习/未学习过滤，中间单图查看器，右侧 AI 学习面板。

题桌右侧使用 `window.MochiAI.callAIWithImage()` 把当前题图发给视觉模型，支持多轮提问和“生成学习记录草稿”。草稿 parser 按 PRD 8.6 中文字段契约解析，`meta.source` 由题桌固定注入 `lesson`；知识点必须精确命中预设列表，否则要求学生在表单里手动选择，绝不静默 fallback。保存时复用现有 `applyMochiRecord()` 写入 `study_log` / `study_card_meta`，并刷新农场、学习档案、复习队列和侧边栏状态。Phase 1 暂不做框选、裁剪、题旁小圆标、PDF 和题桌图片包导出；页面提示题图目前保存在本机浏览器，普通 MochiStudy 备份暂不包含题桌图片/索引，清空进度和恢复出厂会清理题桌 IndexedDB。`index.html` 静态资源版本号更新到 `20260618b`。

### V5.2 题桌外壳化：题桌成为默认主界面（build `20260618d`）

按 `docs/prd/question-desk-prd.md` 的 2026-06-18 方向修订，题桌从「学习页子 tab」升级为应用默认主外壳。空 hash 默认渲染 `#desk`，`#desk` 不再经过 `renderLearn()`，而是直接调用 `MochiQuestionDesk.render(view)`；`body.desk-mode` 隐藏旧 MochiStudy 的侧边栏、顶栏和移动端底部导航，并让题桌三栏占满视口。旧 MochiStudy 仍保留原有首页/学习/勋章/赛季/设置结构，作为次级“成长世界”通过题桌左上角「我的成长」进入；旧站侧边栏和顶栏新增「返回题桌」入口。

「学习」页子 tab 恢复为 今日学习 / 复习队列 / 学习档案，默认回到复习队列；题桌不再出现在学习 tab 内。V5.1 中“题桌是学习页默认子 tab”的表述仅作为历史记录，不代表当前架构。`body` 默认预置 `desk-mode`，避免首屏闪现旧外壳；侧边栏「返回题桌」使用独立样式区分于普通导航。`index.html` 静态资源版本号更新到 `20260618d`。

### V5.3 题桌 Phase 1.5 清爽化（build `20260618e`）

按 `docs/prd/question-desk-prd.md` Phase 1.5 打磨题桌内部体验，不做框选、小标、浮窗，不改 `study_log` / `study_card_meta` / 备份结构和保存闭环。`modules/questionDesk.js` 的 AI 面板新增三态 UI 偏好：常规 `open`、收起 `collapsed`、全屏 `expanded`，状态写入既有 `question_desk_ui_state.panelMode`；切换前会先把当前草稿表单内容回写到题桌 item，避免开合时丢未保存编辑。收起后题图区铺满、右侧只留 AI 小入口；全屏时隐藏题图和文件栏，专注读对话和草稿。

学习记录草稿从密集表单改为清新卡片：科目用 chip，星级用星星选择，关键字段（卡点记录、原题、今日套路）放在主体卡片，错误类型/卡住步骤/关键突破/标签/信心分/耗时等 meta 字段默认折叠到「更多归档细节」。`style.css` 统一题桌卡片、按钮、空状态、面板和移动端收起态的浅灰/白纸/蓝色强调风格。`index.html` 静态资源版本号更新到 `20260618e`。

### V5.4 题桌 Phase 2 起步：套索选区、小标与学习浮窗（build `20260618p`）

按 `docs/prd/question-desk-prd.md` Phase 2 的最小闭环起步，不做 PDF、复杂缩放工具或反向跳转。题桌中间题图新增显式「套索」工具：开启后可在题图上圈/划题目区域，拖动过程只更新轻量 SVG 预览线，不重绘整页，避免题图闪白和多选卡顿。松手后将套索轨迹转为扩边后的相对坐标 `rect: {x,y,w,h}` 写入既有 `question_desk_items`；旧的一图一题 item 继续兼容。同一张题图只允许一个未问 AI 的待确认选区：重新圈选会替换旧待确认框，套索开启且已有待确认框时按钮文案变为「取消选区」，再次点击会取消当前待确认框并退出套索，题桌非输入控件按 Esc 也可取消当前套索/待确认框/重新调整态。未问 AI 的区域题保留为可调整虚线框并显示「待确认」状态，可拖动、拖四角缩放、删除误框；右侧面板新增一行式「题目识别」确认条，调用视觉模型只识别题号、科目、题干摘要、核心转写和选区是否完整，结果写入 `question_desk_items[].recognition`，不写入 `study_log`，核心转写只放在 title 悬浮提示里，不常驻挤占聊天区。聊天记录改为可折叠历史：无消息时只显示一行轻提示，有消息时按内容自然长高，超过 280px 后内部滚动，不再由右侧面板 grid 强制占用 180px 空间。真正问过 AI 或生成草稿后才收起为无编号小图标。AI 请求失败不会写入 chat 或触发定型，选区仍保持可编辑。已定型小标的浮窗提供「重新调整选区」，可临时展开为可拖拽框并正常拖动/缩放，完成后再收回小标。点击小标打开贴近该标记的题桌内浮窗，浮窗先显示学习档案卡片，再显示 AI 对话摘要。为控制主模块体量，新增 `modules/questionDeskAI.js` 承载题桌 prompt 与识别解析，新增 `modules/questionDeskSelection.js` 承载套索/矩形几何纯函数，`modules/questionDesk.js` 保留渲染、事件编排和存储调用。

AI 问答和生成草稿仍走原 `callAIWithImage()` 链路，但区域题会先在浏览器中按 rect 裁剪题图 Blob，再把裁剪图作为上下文发给视觉模型。保存逻辑仍复用 `applyMochiRecord()`，不改 `study_log` / `study_card_meta` 字段和备份结构。`index.html` 静态资源版本号更新到 `20260618p`。

### V5.5 题桌 Phase 3（build `20260618q`，已被 V5.6 收敛）

曾加 `question_desk_notebooks` + 资料柜式题本/归档/批量操作，后因心智过重被 V5.6 简化为轻量题盒；仅作历史。

### V5.6 题桌 Phase 3 简化：轻量题盒替代文件系统（build `20260619a`）

根据产品反馈，V5.5 的自定义题本、归档、批量操作与科目筛选并列，形成了过重的文件系统心智，学生需要额外学习“题本/归档/批量管理”，违背题桌要低认知负担的原则。本版把 Phase 3 收敛为轻量题盒：左侧只保留搜索、全部、未整理、数学、物理、化学；去掉显性题本、新建题本、归档/恢复、批量归档/批量删除、知识点筛选和题本移动下拉。题图的“题本感”改由命名承担，例如 `数学-第3周周测-01`，搜索负责找回。

新粘贴题图默认进入「未整理」；当 AI 识别、生成草稿或保存记录确认科目后，题图自动归到对应科目，并在当前界面切到该科目，避免从「未整理」中消失造成困惑。点击空分类时，中间题图区和右侧 AI 面板显示该分类空态，不再继续显示上一张题。保留单张题图的重命名与删除；删除只清理题桌图片、题桌 item 和 IndexedDB blob，不删除已保存到 `study_log` 的学习档案卡片。`question_desk_notebooks` 仅作为历史试验/清理兼容 key，不再是当前主 UI 模型。`index.html` 静态资源版本号更新到 `20260619a`。

### V5.7 题桌 Phase 4 起步：啃卷子批量排序（build `20260619b`）

按 `docs/prd/question-desk-prd.md` Phase 4 做最小闭环，不新增批量文件管理、不恢复题本/归档心智。题桌左侧上传区新增「啃卷子」入口，打开轻量排序面板；面板列出未保存到学习档案的题图，学生勾选 2-8 张后，浏览器把这些题图合成一张 A/B/C 编号总览图，继续复用现有 `window.MochiAI.callAIWithImage()` 单图视觉调用。新增 `PAPER_GRIND_PROMPT` 与 `parsePaperGrind()`，让 AI 按高考考频、短期提分空间和基础薄弱学生 ROI 输出排序 JSON。

排序结果保存到 `question_desk_ui_state.grindPlan`，只作为学习顺序建议，不写入 `study_log` / `study_card_meta`。结果列表展示推荐顺序、考频/提分/优先级和一句原因；点「开始学」会关闭排序面板、切到对应题图，并继续走原有一图一题 AI 问答与保存闭环。`index.html` 静态资源版本号更新到 `20260619b`。

后续打磨（builds `20260619c`–`20260619m`，最终状态）：
- 候选逻辑：全部素材参与；已套索卷子按题目区域为候选，未套索按整张图；默认勾选前 12 道（视为”不会”），学生取消已会题。
- 流程改为题目级排序：新增 `PAPER_SCAN_PROMPT`/`parsePaperScan()`，AI 拆题后展示题目清单 → 排序 → 结果写 `grindSession`。
- 弹窗阶段式视图（选素材 → 题目清单 → 排序结果），局部刷新勾选态不重绘整列表。
- 啃卷子进入学习模式：题桌上方模式条（第 N/M 题）+ 上一题/下一题/退出，学习态只显示蓝色定位框，「调整框」入口临时进编辑态。
- 「题目识别」升级为信息卡，常驻显示题号/科目/摘要/题干转写；选区编辑框确认/删除按钮移至框外上方，四角保留缩放控制点。

上下文补丁：框选题新增轻量 `contextVersion`，当已问过/已识别的选区被明显调整时，当前题上下文版本自动递增，旧识别标记为「需要重识别」，旧聊天折叠为「调整前旧对话」。新的 AI 提问和学习记录草稿只携带当前版本聊天，并优先把已识别题号、科目、题干摘要和题干转写作为稳定上下文传给 AI，避免调整框后旧题对话污染新题。`study_log`、`study_card_meta` 和备份结构不变；静态资源版本号更新到 `20260619n`。

公式渲染补丁：题桌聊天记录、识别转写和草稿预览统一走 `window.MochiApp.formatRichText()`，并在题桌层兼容 AI 常见的 `\(...\)`、`\[...\]` LaTeX 写法，避免对话区把科学公式显示成原始代码。静态资源版本号更新到 `20260619o`。

题桌与旧学习站协作补丁：专注沉浸页新增「最小化计时」入口，专注中可收成右下角可拖动计时浮窗，题桌和“我的成长”页面恢复可操作；点击浮窗回到完整专注页。结束这一轮、放弃本轮、进入休息决策时自动退出最小化，保留原有专注记录、自评和休息流程。浮窗位置存在 `focus_mini_position`，纳入恢复出厂清理；`study_log`、`focus_log` 和备份结构不变。静态资源版本号更新到 `20260619p`。

题干修正与专注最小化修复：题桌右侧已识别题目卡片改为可编辑题干卡，学生可直接修正题号、科目、题干摘要和题干原文并保存到本地 `question_desk_items[].recognition`，下一次问 AI 会优先使用手动修正后的题干，不需要重新调用视觉识别 API。专注最小化从“保留 focus-mode 再抵消隐藏”改为真正移除 `focus-mode`、只保留 `focus-mini-mode` 浮窗；`exitFocusMode()` 同时识别两种状态，修复从题桌/我的成长页面结束专注后外壳残留隐藏的问题。静态资源版本号更新到 `20260619q`。

紧急修复：重建 `index.html` 静态应用外壳，恢复侧边栏/顶部栏/底部导航的中文文案和合法 HTML 属性，修复“我的成长”页面导航消失、右上角「返回题桌」乱码的问题。静态资源版本号更新到 `20260619r`。

### V5.8 题桌一图一题操作流减负（build `20260619v`）

按用户反馈打磨题桌操作流，不改数据结构/保存闭环（`study_log`/`study_card_meta`/备份不变）。

- **识别卡降级为可折叠核对条**：`renderRecognitionCard` 从常驻 `<section>` 改为 `<details class="qd-recognition-card">` + `summary.qd-recognition-row`。未识别时折叠成「核对题号/题干（可选）」一行入口；已识别且完整时折叠，仅在「需要重识别」或「可能没截全」时默认 `open`。识别本身是可选步骤——`generateDraft` 已会读图把转写写进草稿 `originalQuestion`，直接问 AI / 整理记录即可。
- **主操作按钮人话化**：`renderPanel` 主动作改为「问 AI」+「学懂了，整理成记录」，下方 `.qd-panel-flow-hint` 一句引导。
- **套索降级为说明行（不再消失）**：套索从与「重命名/删除」并列移到题图下方独立 `.qd-viewer-lasso-row`，左侧说明「多题才圈、单题直接问 AI」。**修复**：套索行曾被 `${grindSession() ? "" : …}` 隐藏，残留啃卷子状态会让套索永久消失；已去掉该条件，套索始终可见。
- `style.css`：`.qd-recognition-card` 由 `grid` 改 `block`（grid 干扰 `<details>` 折叠）；新增 `summary.qd-recognition-row`（隐 marker + 旋转箭头）/`.qd-recognition-state`/`.qd-recognition-edit-actions`/`.qd-panel-flow-hint`/`.qd-viewer-lasso-row`/`.qd-viewer-lasso-hint`。旧 `.qd-recognition-head` 已无引用、暂留。

### V5.9 题桌图片包导出导入（build `20260619v`）

- **题桌数据保命补丁**：设置页「数据备份与恢复」新增「导出题桌图片包 / 导入题桌图片包」。题桌包为独立 JSON，包含 `question_desk_images`、`question_desk_items`、`question_desk_ui_state`、历史兼容 `question_desk_notebooks` 以及 IndexedDB 里的题图 Blob（base64 data URL）。
- **导入边界清晰**：导入题桌包会替换当前题桌现场，但不删除已保存到 `study_log` / `study_card_meta` 的学习档案记录。普通 Mochii 备份继续负责学习档案、专注、农场和设置；换设备前建议同时导出普通备份和题桌图片包。

### V5.10 题桌 Phase 5 起步：PDF 多页题图容器（build `20260619w`）

- **PDF 最小可用版**：题桌上传入口支持 `image/*` 和 `.pdf`。PDF 不进入新的数据模型，上传时通过浏览器端 PDF.js 把每一页渲染成普通题图 Blob，写入既有 `question_desk_images` + IndexedDB；每页自动命名为 `文件名-P01/P02...`。
- **复用现有学习闭环**：PDF 页作为普通题图参与左侧列表、搜索、套索框题、站内 AI 问答、保存到学习档案和啃卷子排序。`study_log` / `study_card_meta` / 普通备份主结构不变；题桌图片包导出/导入会自然包含这些 PDF 页图片。
- **运行边界**：PDF.js 从 CDN 动态加载，加载失败时提示 PDF 导入失败；失败后允许再次上传重试。第一版不保存原始 PDF 文件、不做 PDF 批注层、不做 PDF 页缩略目录，只先解决“整份 PDF 试卷不用手动截图”的输入摩擦。
### V5.11 PDF 左栏分组与滚动修复（build `20260619x`）

- **PDF 不再平铺挤爆左栏**：PDF 渲染出的页面仍沿用既有题图数据，但左侧列表按 `pdfId` 聚合成一个 PDF 主条目，页面缩进显示在该 PDF 下方，避免 12 页 PDF 把普通题图全部挤走。
- **左栏可滚动**：题桌左侧文件列表改为在剩余高度内滚动，`qd-sidebar` 限制到视口高度，题图/PDF 页再多也不会消失在屏幕外。
- **保持学习链路不变**：点击 PDF 主条目打开第 1 页；点击某一页打开对应页，套索、问 AI、保存学习档案、啃卷子排序继续复用普通题图逻辑。
