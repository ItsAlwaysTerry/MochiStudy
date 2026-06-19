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

- `modules/reviewPage.js` `startReview()`：复制复习材料后的 inline message 和 toast 明确提示”可以粘贴给复习 AI”，并提醒先自己回想 20 秒，避免点击”开始复习”被误解为已经完成复习。
- `modules/reviewPage.js` `renderImportPanel()`：复习步骤从 3 步调整为 4 步，新增主动回忆提示卡（`.review-recall-card`），在打开 AI 前先让学生尝试说出卡点。
- `modules/reviewPage.js` 与 `app.js` 的导入失败提示补充说明必须同时包含 `---MOCHI-RECORD-START---` 和 `---MOCHI-RECORD-END---`，并指出缺失记录段时应让 AI 补上。
- `modules/farm.js` 首页”今日复习”按钮文案由”开始复习”改为”复制材料”，更符合实际行为；`app.js` 打卡成功卡补充”已保存到学习档案，可以继续粘贴下一条”。

### 当前实际状态（截至 2026-05-24）

以下是版本历史之外、目前实际存在但上方未记录的功能：

- **抽奖系统**：现为全屏两栏布局（`.lottery-body` flex row）。左侧 `.lottery-sidebar`（260px）放厌倦进度条 pity bar 和木鱼；右侧 `.lottery-stage` 放各阶段 UI（spread → pick → result）。已删除旧的可拖拽浮窗 `.lottery-muyu-float`，木鱼移入 sidebar 固定位置。`initMuyuFloat()` 已不调用。
- **今日学习报告**：`app.js` 中有 `renderTodayReport()` 和 `exportTodayReportImage()`，支持生成今日学习汇总图并复制到剪贴板。入口在首页或设置页（具体看路由）。
- **首页 AI 工作流指南**：`modules/farm.js` 中 `renderAiGuideCard()` 在首页渲染一张可折叠卡（`<details class=”card home-ai-guide”>`），展示三步使用流程，并提供跳转设置页按钮。
- **设置页 AI Prompt 复制**：`app.js` 中 `renderSettings()` 在”AI 使用指南”section 放置两个 `<details>` 条目（高考 AI 私教 / 高考复习私教），各有”复制 Prompt”按钮；`copyAiPromptFile(btn)` 用 `fetch()` 读取 `skill/` 目录下的 `.md` 文件，剥离 YAML frontmatter 后写入剪贴板；`file://` 协议下 fallback 为 `window.open()`。
- **番茄钟默认自由专注**：`modules/timer.js` 的 `state.freeMode` 初始值为 `true`，打开页面时默认选中”自由专注”，时间输入行隐藏。

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

第二轮追加（build `20260614i`）：
- **奖池发牌入场。** `.showcase-card` 加 `showcase-deal` 入场关键帧（从下方 + 缩放 + 微旋转淡入），`renderLotteryWheel` 给每张卡 `animation-delay:${i*55}ms` 逐张"发牌"。hover 改为只动阴影/边框（不再 translateY，避开和入场动画 transform 收尾的冲突）。
- **中大奖/保底金光庆祝。** 新增 `showBigWinCelebration()`：往 body 插 `.lottery-bigwin-burst`（金色径向闪光 `.bigwin-flash` + 16 个随机下落撒花 `.bigwin-sparkles span`），2.4s 后自动移除；在 `showLotteryResult` 里当 `chosenPrize.type==="bigReward" || pityActive` 时触发。
- **牌背质感。** `.pick-card-front` 加 45° 重复斜纹 + 金边 + 内描边，`.pick-card-mark` 的 `?` 改金色发光，翻牌前的牌堆更像真卡。翻牌本身已是 3D（preserve-3d + backface-hidden），未改。

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

按 `docs/prd/question-desk-prd.md` 的 Phase 0 先验证站内视觉 AI，而不是先做题桌 UI。`modules/ai.js` 保持旧 `callAI(systemPrompt, text)` 兼容，同时新增多模态调用链：`callMessages()`、`callAIWithImage()`、`testVisionAI()`；OpenAI-compatible endpoint 使用 content array + `image_url`，Anthropic endpoint 转为 `image` base64 block；`max_tokens` 从硬编码 1000 改为可配置，默认 2200。设置页 AI 配置新增“最大输出 tokens”和“视觉 AI 验证”卡片，可选一张题图直接测试当前 `api_config` 的 endpoint/model 是否真能读图，并展示原始返回或失败原因。新增 `skill/gaokao题桌.md` 作为一图一题的单题视觉讲解 prompt，区别于 `gaokao啃卷子.md` 的跨题排序。`index.html` 静态资源版本号更新到 `20260618a`。

后续校准：视觉验证 prompt 强制模型先抄出图片里的具体数字、题号、公式或题干原文，避免文本模型胡编导致 false pass；设置页验证结果提示用户核对【图中原文】是否真实存在。`docs/prd/question-desk-prd.md` 补充 Phase 1 学习记录草稿字段契约，明确中文标签到 `recordDraft/meta` 的映射；`skill/gaokao题桌.md` 收紧 `原题` 要求，必须尽力转写题干核心文字/数字/公式，不能默认写“见原图”。

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

### V5.5 题桌 Phase 3 起步：题本、搜索与归档（build `20260618q`）

按 `docs/prd/question-desk-prd.md` Phase 3 推进长期资料管理，不继续打磨题目识别完整度。新增 `question_desk_notebooks` localStorage key 保存自定义题本；老题图没有 `notebookId` 时自动归入内置「收件箱」，新增题图如果当前打开某个题本会直接放入该题本。题桌左侧升级为资料柜：支持新建题本、按题本筛选、按科目/已学习/未学习/归档筛选、按已有知识点筛选，并可搜索题图名、科目、题本名、知识点、识别摘要、题干转写和草稿原题。

当前题图顶部新增题本移动下拉、归档/恢复、删除入口；左侧当前筛选列表支持批量归档和批量删除。删除只清理题桌图片、题桌 item 和 IndexedDB blob，不删除已经保存到 `study_log` 的学习档案卡片。设置页清空题桌数据和备份相关 key 列表同步纳入 `question_desk_notebooks`。`study_log`、`study_card_meta` 和备份主结构保持不变。`index.html` 静态资源版本号更新到 `20260618q`。

### V5.6 题桌 Phase 3 简化：轻量题盒替代文件系统（build `20260619a`）

根据产品反馈，V5.5 的自定义题本、归档、批量操作与科目筛选并列，形成了过重的文件系统心智，学生需要额外学习“题本/归档/批量管理”，违背题桌要低认知负担的原则。本版把 Phase 3 收敛为轻量题盒：左侧只保留搜索、全部、未整理、数学、物理、化学；去掉显性题本、新建题本、归档/恢复、批量归档/批量删除、知识点筛选和题本移动下拉。题图的“题本感”改由命名承担，例如 `数学-第3周周测-01`，搜索负责找回。

新粘贴题图默认进入「未整理」；当 AI 识别、生成草稿或保存记录确认科目后，题图自动归到对应科目，并在当前界面切到该科目，避免从「未整理」中消失造成困惑。点击空分类时，中间题图区和右侧 AI 面板显示该分类空态，不再继续显示上一张题。保留单张题图的重命名与删除；删除只清理题桌图片、题桌 item 和 IndexedDB blob，不删除已保存到 `study_log` 的学习档案卡片。`question_desk_notebooks` 仅作为历史试验/清理兼容 key，不再是当前主 UI 模型。`index.html` 静态资源版本号更新到 `20260619a`。

### V5.7 题桌 Phase 4 起步：啃卷子批量排序（build `20260619b`）

按 `docs/prd/question-desk-prd.md` Phase 4 做最小闭环，不新增批量文件管理、不恢复题本/归档心智。题桌左侧上传区新增「啃卷子」入口，打开轻量排序面板；面板列出未保存到学习档案的题图，学生勾选 2-8 张后，浏览器把这些题图合成一张 A/B/C 编号总览图，继续复用现有 `window.MochiAI.callAIWithImage()` 单图视觉调用。新增 `PAPER_GRIND_PROMPT` 与 `parsePaperGrind()`，让 AI 按高考考频、短期提分空间和基础薄弱学生 ROI 输出排序 JSON。

排序结果保存到 `question_desk_ui_state.grindPlan`，只作为学习顺序建议，不写入 `study_log` / `study_card_meta`。结果列表展示推荐顺序、考频/提分/优先级和一句原因；点「开始学」会关闭排序面板、切到对应题图，并继续走原有一图一题 AI 问答与保存闭环。`index.html` 静态资源版本号更新到 `20260619b`。

后续小修：啃卷子排序面板的选题列表改为明确的内滚动区域，避免候选题图较多时只露出前三项；静态资源版本号更新到 `20260619c`。

排序选择逻辑按真实学生场景调整：候选题图默认都视为“不会/要排序”，默认勾选前 8 张；学生只需要取消已经会的题。未勾选项在 UI 中弱化显示为“已会，暂不排序”。静态资源版本号更新到 `20260619d`。

排序候选逻辑修正：不再只列出未保存的整张图片，而是列出全部上传素材；如果一张卷子已有框选题目，则按这些题目区域作为候选，否则按整张图/卷子作为候选。排序总览图会对框选题自动裁剪后编号，点排序结果「开始学」可直接切到对应题目区域。啃卷子面板设定固定可用高度，选择列表成为真正的内滚动区，避免只露出前三项。静态资源版本号更新到 `20260619e`。

啃卷子流程改为题目级排序：面板左侧先选择卷子/题图，右侧在点击「识别题目」后展示 AI 从每张素材里拆出的题目清单；已有手动套索区域的素材优先复用套索题目，未套索的整张卷子调用视觉模型拆题。拆题结果保留原卷子题号，识别不到题号时显示「未标号」；默认前 12 道按「不会，参与排序」勾选，学生取消会的题后再让 AI 排序。排序结果仍只写入 `question_desk_ui_state.grindPlan`，点「开始学」时若候选带 rect 会即时创建题目区域并回到原有问答/保存闭环。新增 `PAPER_SCAN_PROMPT` 与 `parsePaperScan()`；静态资源版本号更新到 `20260619f`。

交互补丁：选择不会题时不再整弹窗重绘，改为局部刷新勾选态、计数和排序按钮，避免滚动列表回到顶部。啃卷子弹窗改成阶段式视图：未识别时看选素材，识别后主要看题目清单，排序完成后只展示排序结果并给「重新选题」入口。候选题显示来源标签（手动框选 / AI识别区域 / 整张图），手动框选但未识别的题不再显示抽象的“题目标记”，而显示“手动框选 · 未识别题号”。静态资源版本号更新到 `20260619g`。

啃卷子升级为学习模式：排序结果不再只是弹窗里的单次跳转，点击排序卡片的「从这题开始」会写入 `question_desk_ui_state.grindSession`，关闭弹窗并回到题桌主界面。题桌题图上方新增轻量模式条，显示「啃卷子中 · 第 N / M 题」、当前题标题，并提供上一题、下一题、退出。下一题会自动按排序列表定位到对应题图/题目区域；若候选带 rect 且尚未生成题目 item，会即时创建区域 item 后继续走原有 AI 问答和保存闭环。`study_log`、`study_card_meta`、备份结构不变；静态资源版本号更新到 `20260619h`。

修正同名渲染函数覆盖导致排序结果仍显示旧「开始学」按钮的问题；最终生效的排序卡按钮统一为「从这题开始」，触发 `start-grind-session` 进入啃卷子模式。静态资源版本号更新到 `20260619i`。

啃卷子模式修复：模式条移入题图头部容器，避免被 `.qd-canvas` 的主图 grid 行拉伸成忽大忽小的浅蓝大块。进入啃卷子学习后，题面不再显示可拖拽/可删除的编辑框；当前题如果有 rect，只显示不可编辑的「当前题」定位高亮，其他选区收为小标。拆题 prompt 强化为尽量必须返回 rect；识别结果写入前新增本地疑似重复题去重（基于科目、原题号、真实标题/摘要），并避免误删“手动框选 · 未识别题号”这类泛标题。静态资源版本号更新到 `20260619j`。

啃卷子选区编辑逻辑补全：学习态默认只显示无文字蓝色定位框，避免遮挡题目；模式条在当前题有区域时显示「调整框」入口。点击「调整框」后，仅当前题进入可拖动/缩放的编辑态，其他选区仍保持小标或高亮；切换上一题/下一题或退出啃卷子会自动结束调整态。这样学习态不被编辑框干扰，但框选不完整时仍有明确入口修正。静态资源版本号更新到 `20260619k`。

选区调整入口继续打磨：点击「调整框」后，模式条原位置切换为「完成」按钮，可直接退出当前题编辑态；框自身左上角的勾选按钮仍可完成调整。右侧「题目识别」从一行胶囊改为信息卡，识别完成后常驻显示题号/科目/摘要和题干核心转写，学生可直接核对有没有识别准、有没有框完整；未识别时显示引导文案。静态资源版本号更新到 `20260619l`。

微调补丁：选区编辑框自身的确认按钮从左上角移到框外上方居中，并在调整态显示「完成」文字，避免和四角缩放圆点重叠导致看不清、误触。删除按钮同步移到框外上方右侧，四个角只保留缩放控制点。静态资源版本号更新到 `20260619m`。

上下文补丁：框选题新增轻量 `contextVersion`，当已问过/已识别的选区被明显调整时，当前题上下文版本自动递增，旧识别标记为「需要重识别」，旧聊天折叠为「调整前旧对话」。新的 AI 提问和学习记录草稿只携带当前版本聊天，并优先把已识别题号、科目、题干摘要和题干转写作为稳定上下文传给 AI，避免调整框后旧题对话污染新题。`study_log`、`study_card_meta` 和备份结构不变；静态资源版本号更新到 `20260619n`。

公式渲染补丁：题桌聊天记录、识别转写和草稿预览统一走 `window.MochiApp.formatRichText()`，并在题桌层兼容 AI 常见的 `\(...\)`、`\[...\]` LaTeX 写法，避免对话区把科学公式显示成原始代码。静态资源版本号更新到 `20260619o`。

题桌与旧学习站协作补丁：专注沉浸页新增「最小化计时」入口，专注中可收成右下角可拖动计时浮窗，题桌和“我的成长”页面恢复可操作；点击浮窗回到完整专注页。结束这一轮、放弃本轮、进入休息决策时自动退出最小化，保留原有专注记录、自评和休息流程。浮窗位置存在 `focus_mini_position`，纳入恢复出厂清理；`study_log`、`focus_log` 和备份结构不变。静态资源版本号更新到 `20260619p`。

题干修正与专注最小化修复：题桌右侧已识别题目卡片改为可编辑题干卡，学生可直接修正题号、科目、题干摘要和题干原文并保存到本地 `question_desk_items[].recognition`，下一次问 AI 会优先使用手动修正后的题干，不需要重新调用视觉识别 API。专注最小化从“保留 focus-mode 再抵消隐藏”改为真正移除 `focus-mode`、只保留 `focus-mini-mode` 浮窗；`exitFocusMode()` 同时识别两种状态，修复从题桌/我的成长页面结束专注后外壳残留隐藏的问题。静态资源版本号更新到 `20260619q`。
