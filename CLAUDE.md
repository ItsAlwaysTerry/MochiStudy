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
  calendar.js       — 日历模块（window.MochiCalendar）
  timer.js          — 番茄钟模块（window.MochiTimer）
  pet.js            — 学习状态模块（window.MochiPet，内部兼容旧命名）
  ai.js             — AI导入解析模块（window.MochiAI）
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

### V1.5 连续学习 Streak + 复习行重设计

- `app.js` 新增 `calcStudyStreak()`：倒序遍历有效学习日计算连续打卡天数；新增 `getTodayRecordCount()`：统计今天已导入记录条数；均暴露到 `window.MochiApp`。
- `modules/farm.js` 新增 `renderStreakBanner()`：streak ≥ 1 时渲染连续学习横幅（火焰图标、天数、当日条数、鼓励语）。
- `modules/reviewPage.js` 复习行从七列 grid 重构为 flex 布局；section 副标题文案改为低压力措辞。

### V1.6 导入反馈增强 + 复习卡简化 + sparkle 接通

- `parsePastedRecordEl`（`app.js`）：导入成功卡新增地块进度条（recordCount/harvestTarget）、按 stars 的鼓励语（1★→"能找到卡点就是进步。"，3★→"完全做对，继续保持。"）、今日累计次数，并调用 `sparkle(result, "★")`——sparkle 此前定义但从未调用。
- `modules/reviewPage.js` `renderTodayTask()`：删除"状态"第三列，grid 改为两列。
- `modules/reviewPage.js` `importReviewResult()`：`STATE.message` 按 stars 区分；re-render 后调用 `window.MochiApp.sparkle(container, "✓")`。

### V1.7 首页体验补全 + escapeHtml 统一

- `modules/farm.js` `renderStreakBanner()`：streak = 0 且为有效学习日无记录时显示"今天还没开始，打一张就够了"（月亮图标，subdued 样式），不再返回空白。
- `modules/farm.js` `renderTodayReviewCard()`：新增 `mainPainPoint` 作为主体文字（`.home-review-pain`），用户在首页即可看到卡点；`primaryReason` 降为辅助灰色。
- `app.js` 将 `escapeHtml` 加入 `window.MochiApp` 导出；`farm.js` 的 `escapeAttr` 改为优先调用 `window.MochiApp.escapeHtml`，消除重复。

### V2.0 80/20 大刀阔斧简化

- `index.html` 底部导航：将「日历」替换为「勋章」——日历是回顾功能（低频），勋章/抽奖是每日激励循环（高频），移动端现可直接进入。
- `modules/farm.js` + `style.css`：删除首页 `daily-goal-compact` 区块（三个学科圆圈打卡点），该信息已被迷你农场的 `N/15` 数字完全覆盖，纯冗余。同时删除 `.daily-goal-row`、`.goal-dot` 等相关 CSS。
- `modules/farm.js` + `style.css`：赛季横幅从多行 flex 卡片压缩为单行徽章（`.season-badge`），保留名称和倒计时，去掉日期范围——首页顶部视觉负担降低约 70%。
- `modules/farm.js`：导入框 `rows="2"→"3"`，placeholder 从 40 字缩短为 18 字——导入框是首页核心操作，更大的输入区域配合简洁提示减少认知摩擦。

### V3.0 80/20 学习体验优化

- `modules/farm.js`：首页「今日复习」卡的 `mainPainPoint` 改为 `<details>/<summary>` 翻转，默认隐藏卡点，用户主动点击才展开，强制主动回忆。
- `modules/farm.js`：赛季徽章（`.season-badge`）从 `<div>` 改为 `<button data-route="season">`，点击直接跳转赛季页。
- `modules/farm.js`：删除 `renderDailyGoalDots` 死代码（V2.0 起无调用）。
- `modules/reviewPage.js`：`filterItems()` 新增 `todaySuggestions` 参数，「待处理」列表不再重复显示今日建议里的条目。
- `modules/reviewPage.js`：`renderTodayTask()` 删掉 `.review-task-grid` 两列，改为单行 `.review-task-pain`，「为什么今天」列下线。
- `style.css`：新增 `.home-review-spoiler` 系列样式、`.review-task-pain`，删除无用 `.review-task-grid` 声明。

### V3.1 激进简化：布局重构 + 页面下架 + 交互整合

- `modules/farm.js`：`renderFarm()` 改为单列 `.home-flow` 布局，删除 `farm-layout-v2` 两列结构；导入框升至第一位，迷你农场移至第三位，番茄钟折叠进 `<details class="home-focus-details">`。
- `modules/farm.js`：`refreshFarmSummary()` 选择器从 `.farm-layout-v2` 改为 `.home-flow`。
- `modules/reviewPage.js`：整页扁平化，删除 filter bar、删除三分区（今日建议/待处理/冷却）、删除展开/折叠逻辑；改为单一 `renderFlatList()` 函数，今日优先条目用绿色左边框 + 「今日」徽章区分。
- `modules/reviewPage.js`：删除 `renderTodayTask()`、`renderTodayEmpty()`、`renderPendingList()`、`renderFilters()` 四个函数；删除 `STATE.subjectFilter`、`STATE.pendingExpanded`。
- `modules/reviewPage.js`：`renderImportPanel()` 从 4步+回忆卡 简化为 2行提示文字 + textarea（rows=3）。
- `app.js`：新增 `updateNavBadge()` 函数；在 `setActive()` 末尾和 `checkAndGrantAchievements()` 末尾调用；抽奖结束后同步刷新；`lotteryTickets > 0` 时在「勋章」导航按钮右上角显示数字红色徽章。
- `app.js`：路由 `#schedule` 重定向到赛季页。
- `index.html`：删除侧边栏日历导航按钮。
- `style.css`：新增 `.home-flow`、`.home-focus-details`、`.home-focus-summary`、`.nav-lottery-badge`、`.review-today-badge`、`.review-row-today`、`.review-panel-hint`；删除旧 `.farm-layout-v2` / `.farm-focus-area` / `.farm-side-area` 相关规则。

### V3.2 导航革命 + 首页闭环 + 档案瘦身

- `modules/farm.js`：`renderTodayReviewCard()` 无建议时显示下一到期项（nodeLabel + 天数）。
- `modules/farm.js`：新增 `HOME_REVIEW_STATE`；复习卡「复制材料」后展开内联 textarea，导入全程在首页完成，不跳页；三个 action：start / import / dismiss。
- `modules/reviewPage.js`：新增导出函数 `copyItemPack(key)` 和 `importItemByKey(key, text, callbacks)`，供 `farm.js` 调用。
- `modules/knowledgeMap.js`：删除 STATE 中 `organizing`/`draggingCardId`/`sourceFilter`/`editingSummaryKey`；删除 `SOURCE_FILTERS` 常量；`filterEntriesBySource()` 改为直通函数；删除整理按钮、来源筛选器、拖拽事件、`reorderCards()`、拖拽手柄按钮、内联编辑按钮；`refresh()` 加 `document.contains` 守卫。
- `app.js`：新增 `learnActiveTab` 状态 + `renderLearn(container, tab)` 函数；`route()` 让 learn/review/map 都走 `renderLearn`；`setActive()` 让 `data-route="learn"` 在 review/map 路由时高亮。
- `app.js`：`renderNoSeason()` 改为显示累计记录、学习天数、专注小时、三科记录数；无数据时显示引导语。
- `index.html`：侧边栏「复习」+「学习档案」合并为「学习」；底部导航从 5 tab（首页/复习/档案/勋章/设置）缩减为 4 tab（首页/学习/勋章/设置）。
- `style.css`：新增 `.learn-tab-bar`/`.learn-tab-btn`、`.home-review-import` 系列、`.home-review-msg`、`.home-review-next-due`、`.season-empty-stats`/`.stat-mini` 系列。

### V1.9 自我迭代修复：readJSON bug + 导入动线 + 主动回忆前缀

- `app.js` `parsePastedRecordEl()`：修复 `readJSON` 拼写错误（应为 `readJson`），该 bug 导致打卡成功卡不显示、sparkle 不触发、textarea 不清空，记录本身正常保存不受影响。
- `modules/farm.js` `renderStreakBanner()`：streak=0 兜底卡（"今天还没开始"）新增「去导入」按钮，点击滚动并 focus 导入框，解决死区问题。
- `modules/farm.js` `renderTodayReviewCard()`：首页今日复习卡的 `mainPainPoint` 前加「还记得吗？」前缀（`.home-review-recall-hint`），从被动展示答案改为主动提取引导。
- `modules/reviewPage.js` `startItem()`：从首页触发复习时的 message 补充「先自己回想 20 秒，再去 AI 那里粘贴」，与 `startReview()` 保持一致。

### V1.8 主动回忆提示 + 导入反馈补强

- `modules/reviewPage.js` `startReview()`：复制复习材料后的 inline message 和 toast 明确提示“可以粘贴给复习 AI”，并提醒先自己回想 20 秒，避免点击“开始复习”被误解为已经完成复习。
- `modules/reviewPage.js` `renderImportPanel()`：复习步骤从 3 步调整为 4 步，新增主动回忆提示卡（`.review-recall-card`），在打开 AI 前先让学生尝试说出卡点。
- `modules/reviewPage.js` 与 `app.js` 的导入失败提示补充说明必须同时包含 `---MOCHI-RECORD-START---` 和 `---MOCHI-RECORD-END---`，并指出缺失记录段时应让 AI 补上。
- `modules/farm.js` 首页“今日复习”按钮文案由“开始复习”改为“复制材料”，更符合实际行为；`app.js` 打卡成功卡补充“已保存到学习档案，可以继续粘贴下一条”。
