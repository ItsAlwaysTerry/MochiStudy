# MochiStudy 项目说明文档

## 项目是什么

这是一个为基础薄弱的高中生设计的学习记录网站，帮助他在假期可视化学习进度、保持学习动力。

核心用户画像：基础差、缺乏自信、习惯做题但不会主动复习、喜欢收集和陈列东西。

核心设计原则：降低记录阻力，把学习痕迹沉淀成 AI 可继续使用的材料。网站负责收集、整理、提醒和导出；外部 skill 负责讲题和复习；复习结果再以 MOCHI-RECORD 回写网站形成闭环。

完整工作流：

```text
高考 AI 私教讲新题 → 输出 MOCHI-RECORD → MochiStudy 导入成新题讲解卡
MochiStudy 导出某科/全部 AI复习包 → 高考复习 AI 私教做复习测验 → 输出增强版 MOCHI-RECORD → MochiStudy 导入成复习卡
```

后续做“复习”页面时，要围绕“不主动复习的学生”设计：自动列出最该复习的知识点，显示低星/久未碰/复习结果，不要做复杂题库或管理后台；每个知识点应能导出定向 AI复习包。

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
  calendar.js       — 日历模块（window.MochiCalendar）
  timer.js          — 番茄钟模块（window.MochiTimer）
  pet.js            — 学习状态模块（window.MochiPet，内部兼容旧命名）
  ai.js             — AI导入解析模块（window.MochiAI）
  reviewEngine.js   — 复习调度引擎，聚合知识点、计算优先级、生成定向复习包
  reviewPage.js     — 复习页面，渲染 #review 待处理列表和回填导入交互
docs/
  review-module.md  — 复习模块设计、V1 边界和后续迭代方向
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
    card_order: {...},
    study_card_meta: {...},
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
- 复习记录仍归入原科目和知识点下，通过 `study_card_meta.source` 显示为新题讲解 / 复习测验 / 小测验 / 阶段复盘
- `study_card_meta` 可选保存复习结果、错误类型、卡住步骤、关键突破、题型标签、信心分和耗时；核心 `study_log` 字段不扩展
- 学习卡片有三种互斥状态：正面 / 今日套路 / 原题；`originalQuestion` 字段在“看原题”第三面显示
- 卡片展开状态用 `Map` 存储，值为 `"routine"` / `"question"` / `null`
- 学习档案可按来源标签筛选：全部 / 新题讲解 / 复习测验 / 小测验 / 阶段复盘
- 顶部有“导出档案”按钮，支持摘要、详细记录、AI复习包、JSON 四种格式，并可选择全部科目或单科导出
- 详细记录由 `knowledgeMap.js` 的 `generateExportDetail()` 生成，按科目 → 知识点 → 时间正序逐张卡片输出日期、星级、题数、卡点、原题、套路
- 卡片文本支持轻量 `$...$` 行内公式显示，优先处理下标/上标，不引入外部公式库

## 复习模块设计（重点保护）

- 复习页路由为 `#review`，它是“今天该复习什么”的指挥台，不是第二个学习档案，也不是题库管理页。
- V1 使用本地规则计算，不接 API；外部 `skill/gaokao复习私教.md` 仍负责出题、追问和讲解。
- 复习页的交互是待处理列表：点“开始复习”自动复制单知识点 AI 复习素材包，并展开回填框。
- 点“开始复习”不代表已复习；只有成功导入复习 AI 输出的 `MOCHI-RECORD`，才算完成一次复习。
- 导入成功后新增一张复习卡片，仍归入原科目/原知识点，复习扩展信息继续写入 `study_card_meta`。
- 复习算法、推荐原因、冷却天数和单知识点复习包生成集中在 `modules/reviewEngine.js`，不要散落到 `reviewPage.js` 或 `app.js`。
- 复习页面交互集中在 `modules/reviewPage.js`，只负责渲染、筛选、复制材料、回填导入和跳转学习档案。
- 首页可以展示一张低压力“今日复习”卡片，但只能作为当天入口；完整复习流程仍归 `reviewPage.js` 管。
- 今日建议必须保持低压力，默认最多 1-2 个；刚复习过的知识点应进入“待巩固/近期稳定”冷却，不要连续压到学生面前。
- 复习页默认不展示大段复习包全文，材料是给 AI 的，不是给学生阅读的；回填输入框要轻量，不要喧宾夺主。
- 复习结果回填应保持单行粘贴入口，和导入按钮在同一行；不要再改回大 textarea，除非用户明确要求看/编辑全文。
- 学习档案前台来源标签默认收敛为“新学 / 复习”，内部 `lesson / review / quiz / reflection` 可以保留用于编辑、导出和分析。
- 学习档案展开知识点时默认先显示摘要：主要卡点、最近突破、复习状态、仍需留意；历史卡片应折叠，避免档案越用越厚。
- 学习档案默认是阅读模式；摘要编辑、卡片编辑、删除和拖拽排序只在“整理模式”下显示，避免学生被维护工具淹没。
- 复习结果导入成功后可以引导用户去更新核心摘要，但不要在复习页承载摘要编辑表单。
- 从复习页点“看卡片”应定位并高亮原知识点，而不是让用户自己在档案里找。
- 核心摘要卡是规则型摘要，不是 AI 生成总结；它只提取已有字段和 `reviewEngine` 状态。不要让文案暗示它能理解题意或自动生成高质量讲义。
- 目标设备可能是 13 寸笔记本，学习卡片、复习卡片和核心摘要的关键文字要偏大、清楚，不要为了密度把字号压小。
- 后续要调整“几天复习一次”“几星算薄弱”“独立做对后冷却多久”等规则，优先改 `DEFAULT_REVIEW_SETTINGS` 或 `reviewEngine`。
- 详细设计见 `docs/review-module.md`。后续 Agent 开发复习模块前应先阅读该文档。

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

v34 之后的改动：

- 农场重设计：固定三块地，按科目，recordCount 驱动生长
- 知识地图替换为卡片收藏册
- 导出学习档案功能
- 数据备份与恢复功能（设置页）
- 设置页“数据管理”：`clearProgressData()` 清空学习进度但保留设置；`factoryResetData()` 恢复出厂设置并清空全部已知数据和设置
- 学习档案导出新增“详细记录”：逐张卡片完整输出日期/星级/题数/卡点/原题/套路；三种格式为摘要（宏观分析用）/ 详细记录（出题复习用）/ JSON（开发用）
- MOCHI-RECORD 新增 `原题` 字段，导入后保存为 `study_log[].originalQuestion`；旧记录缺少该字段时按空字符串处理
- `questionsCompleted` 已固定为 1，不再从 MOCHI-RECORD 的完成题数字段读取
- Obsidian 笔记生成和相关可见文案已删除，导入只保存 MochiStudy 学习记录
- 专注 deciding 界面只有两个按钮：开始休息 / 结束今天的学习
- 调试面板（?debug=1）
- 开发者参数配置面板（?debug=1 的参数配置 Tab，写入 game_config）
- 每日目标改为按当天导入记录自动完成，删除手动每日任务 localStorage
- 学习点/爱心/喂食系统删除，`MochiPet` 仅保留为学习状态内部模块
- 勋章系统完全重写：小勋章/大勋章可重复获得，达到阈值倍数自动累计，并按配置兑换抽奖次数
- 勋章页新增抽奖转盘：消耗抽奖次数，Canvas 转盘按权重抽取奖励/任务，并记录抽奖历史
- 新增赛季制系统：`current_season` 保存当前赛季，`season_archives` 保存历史快照；赛季页展示称号、热力图、趋势图，并可导出文字版/JSON 报告
- 新增管理后台：`?admin=1` 输入管理员密码进入，可维护赛季、勋章参数、称号阈值、转盘内容、学年日历和后台密码
- 首页导入框默认展开，无折叠逻辑
- 勋章页显示抽奖入口、勋章总览、大勋章列表和小勋章列表
- 日历页改名“学习日历”，删除硬编码“萌芽阶段” pill，右上角显示今日题数
- 学习档案知识点行删掉日期列，只保留状态、知识点名、张数和最近星级
- 首页布局改为 `farm-layout-v2`：左侧番茄钟主区，右侧迷你农场、今日目标和导入框
- 三块地改为 `mini-farm-row` 一行迷你显示
- 专注开始触发沉浸模式：`body.focus-mode` + `focus-overlay`
- 沉浸模式保留导入记录小入口 `focus-import-area`
- `parsePastedRecord` 已抽出为 `parsePastedRecordEl(textarea, resultEl)`，供首页和沉浸模式复用
- 番茄钟有自由专注/设定时间两种模式，`timer.state.freeMode` 控制
- 专注结束先进入 `deciding` 阶段，显示“开始休息 / 结束今天的学习”选择
- 沉浸模式无暂停按钮；`tick()` 调用 `tickFocusOverlay()` 只更新数字和圆环，不重建 DOM，避免导入框 textarea 失焦
- `deciding` 阶段有两个可见出口：开始休息 / 结束今天的学习
- `pet.js` 的 `renderTimer()` 在 `deciding` 阶段返回占位卡片，不退出沉浸模式
- 休息倒计时结束时 `tick()` 显式调用 `exitFocusMode()`
- 沉浸模式 overlay 里有低调的“放弃本轮”按钮
- 系统通知（Notification API）已删除，提醒改用 Web Audio API 合成音效，`file://` 下可用
- 休息结束调用 `startRestReminder()`：显示 `rest-reminder-overlay` 半透明遮罩（z-index 600），每 30 秒播放一次所选铃声，点击页面停止，最多提醒 5 分钟
- 默认温柔旋律由 `playReminderMelody()` 控制，8 个音符，约 6-7 秒；遮罩和提醒音同步开始/停止
- `sound_reminder_enabled` 存在 localStorage，由设置页“休息结束提醒音”开关控制
- 休息结束铃声调用 `playRestReminderSound()`，由设置页 `rest_reminder_sound` 选择：温柔旋律 / 小风铃 / 低柔三音 / 清亮提示
- 专注结束提示音调用 `playFocusEndSound()`，由设置页 `focus_end_sound` 选择：不响 / 轻柔双音 / 小风铃 / 清脆短音；设定时间到点会提醒，自由专注没有到点提醒
- 最终打磨版：休息卡片提示文字已修正，`pet.js` 的 deciding 占位卡片已删除，`exitFocusMode()` 加防重入保护，deciding 阶段根据专注时长显示鼓励语，休息提示文字字号已放大
- 旧通知 key `notif_rest_enabled`、`notif_focus_enabled` 已废弃，不再使用
- validDays 历史日期判断修正：不再调用 isHolidayToday()，改为直接判断周六日和 getHolidays() 列表
- 休息遮罩点击监听修正：每次遮罩出现都重新注册 once 监听
- 转盘旋转修正：用 _wheelCurrentAngleDeg 记录停止角度，下次从该角度出发
- 赛季管理从设置页移除，只保留在管理后台（?admin=1）
- 首页新增赛季横幅（season-banner），赛季开启时显示
- renderCurrentSeason 改为从 study_log 实时计算，不依赖 snapshot
- loadCurrentSeason 和 readFocusLogs 已暴露到 window.MochiApp
- 管理后台新增"数据调整"section：可直接修改各科 recordCount、totalHarvests、farm xp、achievement_state 四项勋章/抽奖字段，并可补录手动专注记录
- 备份导出补全缺漏 key：createBackupPayload 新增 achievement_state / achievement_config / lottery_config / lottery_history / current_season / season_archives / game_config / card_order / study_card_meta；restoreKnownBackupData 同步写回这些 key
- 赛季自动续期：赛季结束后下次打开网站自动存档并开启下一个同等时长的赛季
- 首页赛季横幅结束前3天变橙色提醒
- 赛季报告新增亮点标签：最努力的一天、最长专注、进步最快知识点、开拓知识点数、均衡周数、最长连续学习
- 赛季页面补上热力图和每周趋势图的实际渲染（renderSeasonWeeklyChart）
- 学习档案卡片新增编辑、删除和同一知识点内拖拽排序；排序写入 `card_order`，不新增 `study_log` 字段
- 学习档案导入新增复习扩展字段：学习来源、复习结果、错误类型、卡住步骤、关键突破、题型标签、信心分、耗时分钟；写入 `study_card_meta`
- 学习档案导出新增“AI复习包”，给 `skill/gaokao复习私教.md` 使用；复习记录仍回写为 MOCHI-RECORD 并归入原知识点
- 复习 V1 新增 `#review` 页面、`modules/reviewEngine.js` 和 `modules/reviewPage.js`：本地计算待复习知识点，点“开始复习”复制定向复习包，回填复习 AI 输出后才导入并更新状态

### V1.1 摘要可编辑规则

- `study_node_summary` 用于保存知识点级人工摘要，key 为 `subject::nodeLabel`，不要写入 `study_log`。
- 人工摘要只保存 `mainPainPointOverride`、`keyBreakthroughOverride`、`reviewNote`、`updatedAt`。
- 学习档案核心摘要有人工摘要时显示”已校正”，否则显示”自动整理”。
- “恢复自动摘要”只清除 `study_node_summary` 对应项，不删除任何历史卡片。
- 单知识点 AI 复习包应优先携带人工摘要，再携带历史记录。
- 首页新增”今日复习”卡片，点击”开始复习”复制单知识点复习包并跳转 `#review` 展开对应项。
- 学习档案新增”整理模式”，默认隐藏摘要编辑、卡片编辑、删除和拖拽排序；复习导入成功后显示”去更新核心摘要”。

### V1.2 UX 减压与引导优化

- 学习档案拖拽排序 Bug 修复：`reorderCards` 调用 `render()` 后 `<details>` 历史卡片重建为关闭状态。修法：STATE 新增 `historyExpanded`，用 toggle 事件捕获跟踪展开状态，重渲时恢复 `open` 属性；切换节点/科目/来源时重置为 false。
- 首页右侧列顺序调整：农场 → 导入框 → 今日目标 → 今日复习。导入是最高频操作，不应排最后。
- 导入框标题区域增加副标题文案，placeholder 更新为完整格式说明。
- 首页空状态引导：无学习记录时，今日目标和今日复习替换为三步引导卡；有记录后恢复正常。
- 复习页”待处理”默认折叠超出项：超过 4 条时只显示前 4 条，底部虚线按钮”还有 N 项 — 显示全部”；切换筛选时自动重置折叠。
- 学习档案整理模式视觉提示：整理按钮加 tooltip 说明；模式激活时列表上方出现淡紫色状态条，内嵌”完成整理”按钮。
- 移动端底部导航顺序调整为：首页 / 复习 / 档案 / 日历 / 设置，并将”日程”重命名为”日历”。
- README、AGENTS、CLAUDE.md 补全 `study_node_summary`、`card_order`、`study_card_meta` 在 localStorage 表格中的缺漏。
- Instruction/ 目录新增 plan-01 到 plan-04，记录本轮 UX 改进的问题分析、改动范围和设计原则。

### V1.5 连续学习 Streak + 复习行重设计

- `app.js` 新增 `calcStudyStreak()`：倒序遍历有效学习日计算连续打卡天数；新增 `getTodayRecordCount()`：统计今天已导入记录条数；均暴露到 `window.MochiApp`。
- `modules/farm.js` 新增 `renderStreakBanner()`：streak ≥ 1 时渲染连续学习横幅（火焰图标、天数、当日条数、鼓励语）。
- `modules/reviewPage.js` 复习行从七列 grid 重构为 flex 布局（`review-row-main`）；section 副标题文案改为低压力措辞。

### V1.6 导入反馈增强 + 复习卡简化 + sparkle 接通

- `parsePastedRecordEl`（`app.js`）：导入成功卡新增地块进度条（recordCount/harvestTarget）、按 stars 的鼓励语（1★→"能找到卡点就是进步。"，3★→"完全做对，继续保持。"）、今日累计次数，并调用 `sparkle(result, "★")`——sparkle 此前已定义但从未被调用。
- `modules/reviewPage.js` `renderTodayTask()`：删除"状态"第三列，`review-task-grid` 改为两列（主要卡点 + 为什么今天）。
- `modules/reviewPage.js` `importReviewResult()`：`STATE.message` 按 stars 区分结果（3→"做对了，暂时降权"，2→"基本掌握"，1→"记录了卡点"）；re-render 后调用 `window.MochiApp.sparkle(container, "✓")`。

### V1.7 首页体验补全 + escapeHtml 统一

- `modules/farm.js` `renderStreakBanner()`：streak = 0 且为有效学习日、当天无记录时，显示"今天还没开始，打一张就够了"（月亮图标，subdued 样式），而非空白。此前空白对缺乏自信的用户正是最需要引导的时刻。
- `modules/farm.js` `renderTodayReviewCard()`：在 `primaryReason` 上方新增 `mainPainPoint` 为主体文字（`.home-review-pain`），让用户首页即可看到卡点，无需点入复习页；`primaryReason` 降为辅助灰色小字。
- `app.js` 将 `escapeHtml` 加入 `window.MochiApp` 导出；`farm.js` 的 `escapeAttr` 改为优先调用 `window.MochiApp.escapeHtml`，保留内联回退以防加载时序问题。

### V1.8 主动回忆提示 + 导入反馈补强

- `modules/reviewPage.js` `startReview()`：复制复习材料后的 inline message 和 toast 明确提示“可以粘贴给复习 AI”，并提醒先自己回想 20 秒，避免点击“开始复习”被误解为已经完成复习。
- `modules/reviewPage.js` `renderImportPanel()`：复习步骤从 3 步调整为 4 步，新增主动回忆提示卡（`.review-recall-card`），在打开 AI 前先让学生尝试说出卡点。
- `modules/reviewPage.js` 与 `app.js` 的导入失败提示补充说明必须同时包含 `---MOCHI-RECORD-START---` 和 `---MOCHI-RECORD-END---`，并指出缺失记录段时应让 AI 补上。
- `modules/farm.js` 首页“今日复习”按钮文案由“开始复习”改为“复制材料”，更符合实际行为；`app.js` 打卡成功卡补充“已保存到学习档案，可以继续粘贴下一条”。
