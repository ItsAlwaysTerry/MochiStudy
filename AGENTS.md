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
  cat_crops.png     — 猫咪植物农场精灵图，3 行 × 6 列，对应三科与六个成长阶段
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
summer_task_state             — 暑假任务区状态，保存滚动任务队列中的 watched/completed/activeStep/studyNote/reflectionRequired/reflectionDone/reflection、卡住救援状态 tasks[].support、当前展开任务 activeTaskId、用户锁定为今日任务的 activeRouteDay、待关联视频任务 pendingTaskId、待关联路线学习单 pendingRouteDay、待关联路线视频/学习单 pendingRouteTaskId、28天路线详情 routeDetailDay、每日总复盘 routeDays[].dailyReflection、视频例题截图元信息 examples 和已关联学习记录 id；不改 study_log 字段。截图图片本体存在 IndexedDB `mochi_summer_examples`
summer_reward_config          — 暑假奖励浮窗的隐藏奖项配置，字段 items: [{label, amount, weight, tone}]；学生端不展示概率，未设置时使用代码默认权重
summer_reward                 — 暑假统一抽奖状态；V2 现金只来自抽奖，保存 rewardModelVersion、paidToday、dailyDrawPaid、weekPaid、达标日/阶段、大小奖券、最近 60 条真实抽奖历史和当前骰子盘面
sidebar_expanded              — 桌面端侧边栏展开状态，"1" 为展开文字导航，默认收起为窄图标栏
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
- 作物精灵使用 PNG sprite sheet；当前首页农场使用 assets/farm/cat_crops.png，并保留 image-rendering:pixelated
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
3. 农场作物不能用 SVG 或 emoji 替代，必须使用 PNG sprite sheet；当前使用 assets/farm/cat_crops.png
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
- 注：AGENTS.md「勋章系统」里旧描述「转盘用 Canvas 绘制…easeOutCubic」已过时，抽奖实为 DOM 卡牌玩法，非 Canvas 转盘。

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

### V5.1 暑假任务区：视频输入 + 出口题 + MOCHI-RECORD 闭环（build `20260713a`）

面向暑假 28 天补基础，首页新增轻量“暑假物理补基础 / 今日任务”区。当前先接入已整理出的 5 个物理视频任务（匀变速、牛顿第二定律、力的合成与分解、功与功率、闭合电路欧姆定律），提供“两天推荐版 / 一天压缩版”切换。

- `modules/summerTasks.js`：新增独立任务模块，保存到 `summer_task_state`，不改 `study_log`。每条任务包含 B 站资源链接、建议专注分钟、出口题、提示和可复制给 AI 的做题 prompt。
- `modules/farm.js`：首页在有效学习日渲染暑假任务区；绑定“打开资源 / 开始专注 / 看完了 / 导入记录 / 复制给 AI”。任务区放在导入框之前，先给学生明确目标。
- `app.js`：`applyMochiRecord()` 导入成功后调用 `MochiSummerTasks.attachImportedRecord(logEntry)`；当任务处于 pending 导入状态，粘回 MOCHI-RECORD 会自动把该任务标记完成并记录关联 log id。新增 `startCommittedFocus(goal, durationMins)`，让任务按钮直接启动带目标和时限的专注轮，仍进入原有 deciding 反思链路。
- `style.css`：新增 `.summer-task-*` 样式，做成紧凑清单而非新页面；移动端任务按钮自动两列换行。
- `index.html`：新增 `modules/summerTasks.js` 脚本并把静态资源版本号更新为 `20260713a`。

### V5.2 暑假任务入口修正 + 已看视频直接做题（build `20260713b`）

- **入口常驻首页**：`farm.js` 暑假任务区不再受 `holiday` 条件控制，避免系统没识别成假期时首页完全看不到新功能。非学习日点任务的“导入记录”会自动调用 `setHolidayMode("holiday")`，打开当天学习模式并跳到导入框。
- **已看过视频路径**：`summerTasks.js` 每条任务新增“做出口题”按钮。学生如果已经看过视频，可以跳过“打开资源/看完了”，直接展开出口题；系统会把该任务标记为 watched，并等待后续 MOCHI-RECORD 导入完成。
- **版本可见**：`index.html` 顶部 build 文案从旧 `build-AE` 改成 `build-20260713b`，静态资源版本号同步更新到 `20260713b`，方便确认是否刷新到了新版本。

### V5.3 过关小题文案降噪 + 力学题加图（build `20260713c`）

- **学生可理解的命名**：把学生界面里的“出口题”改为“过关小题 / 做小题”，专注目标、toast、复制 Prompt 标题同步改掉，减少生硬感。
- **题干降复杂度**：匀变速、牛二、功与功率、闭合电路题干改成更口语的中文单位，例如“8 米/秒”“1 米/秒²”“10 千克”，减少 `1m/s^2` 这类机器式写法。
- **力的分解题加示意图**：`summerTasks.js` 为“力的合成与分解”增加内联 SVG 简图，展示左绳水平、右斜绳、30°角、重物 G 和重力方向；题干从“theta 抽象描述”改成“看图做题”，不再要求学生凭文字脑补图形。
- `style.css` 新增 `.summer-diagram` 和图内线条/标签样式；`index.html` 静态资源版本号更新为 `20260713c`。

### V5.4 课程计划补全 + 小题多题位 + 缺截图不乱出题（build `20260713d`）

- **完整列课**：暑假任务区补上“平抛运动”和“万有引力”，并保留“闭合电路欧姆定律”。三节目前都标为“待补例题截图”，视频入口、开始专注、看完、导入记录等任务功能照常显示。
- **不乱生成题**：闭合电路此前用自动抓到的一帧临时编了题，已删除。没有用户贴例题截图的课程只显示占位说明：“等你贴例题截图后补题”，不提供复制给 AI 的题目 Prompt。
- **一课多题位**：已有截图支撑的课程改为 `practiceItems` 多题列表。匀变速、牛顿第二定律、力的合成与分解、功与功率各先放 2 个过关小题；每题都有独立“复制给 AI”按钮。
- **交互调整**：`copy-prompt` 按小题索引生成 Prompt；无题课程点“待补题”只展开占位说明。静态资源版本号更新为 `20260713d`。
- **进度口径**：任务区会显示已列 7 节课，其中 3 节待补例题截图；进度圈只统计当前已有小题的 4 节课，避免占位课造成无法完成的压力。

### V5.5 DOCX 例题截图导入 + 首页图题化（build `20260714a`）

- **截图导入**：从 `C:\Users\Administrator\Downloads\例题.docx` 提取闭合电路欧姆定律、平抛运动、万有引力三节截图，复制到 `docs/summer-physics-examples/screenshots/`，并在 `例题收件箱.md` 按视频区域展示完整原图。DOCX 中重复引用的平抛截图只保留去重后的原图。
- **三节解除占位**：`modules/summerTasks.js` 删除这三节的 `needsExamples` 占位状态，补入带原始截图的 `practiceItems`。两天版改为第 1 天 3 节、第 2 天 4 节；一天压缩版新增“晚上补充轮”。
- **过关小题显示题图**：`renderPracticeItems()` 支持 `item.image`，首页小题卡直接显示截图，点击题图可打开原图。`copy-prompt` 会提醒 AI 必须看题图，若没收到图片要先让学生上传，不可凭空编题。
- **静态资源版本号**：`index.html` 更新到 `20260714a`，方便确认刷新到了最新 JS/CSS。

### V5.6 暑假物理课前概念急救（build `20260714b`）

- **本地计划沉淀**：新增 `docs/summer-physics-execution-plan.md`，记录“课前概念急救 → 主线视频 → 例题留痕 → 过关题 → MOCHI-RECORD”的执行闭环；新增 `docs/summer-physics-resource-inventory.md`，记录小红书攻略、已买 PDF、黄夫人 B 站合集和 API 抓取方式。
- **任务卡补课前概念**：`modules/summerTasks.js` 每个暑假物理任务新增 `prep` 字段，包含当天必须会的概念、一轮讲义对应范围、基础课/基础讲义备用入口。
- **首页展示**：任务展开区 summary 改为“课前概念 + 过关小题”，顶部渲染 `.summer-prep-box`，先显示概念标签、讲义范围和不懂时看的备用资源；`copy-prompt` 会把当天基础概念一起交给 AI。
- **样式和缓存**：`style.css` 新增 `.summer-prep-*` 样式，`index.html` 静态资源版本号更新为 `20260714b`。

### V5.7 暑假物理实体书页码收紧（build `20260714c`）

- **实体书优先口径**：学生端不再写“目录页码/PDF页码”，`modules/summerTasks.js` 的课前资源改为“实体书一轮讲义 X 第几页”，PDF 只保留在本地计划文档里给家长/Codex 核对。
- **范围减负**：现有 7 节任务的课前翻书范围从整章粗范围收紧为“先看核心页，卡住再翻补充页”，例如匀变速先第2-6页、刹车/图像卡住再第10-15页。
- **Prompt 同步**：复制过关小题 Prompt 时，会带上当天课前翻书范围和备用资源，方便 AI 私教按同一计划接住学生。
- **计划文档同步**：`docs/summer-physics-execution-plan.md` 与 `docs/summer-physics-resource-inventory.md` 新增实体书页码/PDF核对页映射表；`index.html` 静态资源版本号更新为 `20260714c`。

### V5.8 暑假物理主线优先 + 卡住救急（build `20260714d`）

- **依据学生反馈调整策略**：学生反馈前两天主线视频基本能听懂，偶尔靠弹幕理解，所以实体书/基础课从“课前硬任务”降级为“听课或做题卡住时救急”。
- **学生端文案减压**：`modules/summerTasks.js` 将任务展开 summary 改为“卡住再看 + 过关小题”，区块标题改为“卡住时再看”，资源标签改为“翻书救急”。
- **AI Prompt 同步**：复制过关小题 Prompt 时，不再说“课前翻书范围”，改为“如果听课或做题卡住，翻书救急范围”。
- **计划文档同步**：`docs/summer-physics-execution-plan.md` 和 `docs/summer-physics-resource-inventory.md` 改为“主线视频 → 过关题检验 → 卡住再翻实体书/基础课 → MOCHI-RECORD”的执行闭环；`index.html` 静态资源版本号更新为 `20260714d`。

### V5.9 暑假任务下一步引导（build `20260714f`）

- **按钮墙降噪**：`modules/summerTasks.js` 每条暑假任务从 5 个并列按钮改为 1 个“下一步”主按钮；原来的打开资源、开始专注、做小题、标记看完、导入记录收进“更多操作”。
- **状态驱动工作流**：新增轻量状态判断，按 `startedAt / watched / practicingAt / pendingTaskId / completed` 自动切换主按钮：开始这节课 → 我看完了，去做题 → 做第 1 道题 → 复制第 1 题给 AI → 粘贴记录完成任务 → 已完成。
- **减少漏记**：点“开始这节课”会同时打开视频资源并启动对应专注；复制过关题 Prompt 后自动关联任务并进入等待 MOCHI-RECORD 导入状态。剪贴板 API 加 900ms 超时，卡住时自动走手动复制框，不阻断任务状态推进。
- **步骤条**：任务卡新增 `看视频 / 做题 / 导入 / 完成` stepper，`style.css` 新增 `.summer-stepper`、`.summer-next-btn`、`.summer-more-actions` 样式；`index.html` 静态资源版本号更新为 `20260714f`。

### V5.10 暑假物理 28 天路线界面（build `20260714g`）

- **去掉旧两天入口**：`modules/summerTasks.js` 不再渲染“一天压缩版 / 两天推荐版”切换，首页暑假区改为“暑假物理 28 天路线”，显示当前第几天、路线进度和今天这一组任务。
- **当前任务优先**：当前天由第一组未完成任务自动计算。前两天继续复用已经落实的 7 节详细视频任务和原有“下一步”闭环；学生只看到当天队列，不需要自己在两个版本之间选择。
- **后续不乱派任务**：第 3-28 天先作为路线占位，展示主题和焦点标签，明确“待补具体视频/题目后再变成可点击任务”，避免为了填计划生成低质量任务。
- **路线总览折叠**：新增 28 天折叠总览，按 4 周展示完成、进行中、已落实课程、待补资源状态；`style.css` 新增 `.summer-route-*` 和 `.summer-today-*` 样式，`index.html` 静态资源版本号更新为 `20260714g`。

### V5.11 暑假路线区拆分 + 基础课入口直观化（build `20260714h`）

- **今日任务和总路线分离**：`modules/summerTasks.js` 的 `render()` 只渲染当前第 N 天任务；新增 `renderRouteOverviewCard()` 专门渲染 28 天总计划。`modules/farm.js` 把总计划放到 `.home-flow` 之后，作为独立全宽区域，不再挤在左侧今日任务卡里。
- **基础课不再写内部编号**：7 个已落实任务的 `prep.backup` 从 `season 2045：1-28` 这类不直观文案，改为“按目录找：速度、加速度、匀变速直线运动”等学生能对照目录查找的知识点。
- **备用资源可点击**：任务的 `prep.backupLinks` 保存基础课/一轮复习 B 站合集链接；`renderPrep()` 在“卡住时再看”里渲染“打开基础课合集 / 打开一轮复习合集”按钮，复制给 AI 的过关题 Prompt 也会带上这些链接。
- **样式和缓存**：`style.css` 新增 `.summer-route-card-*` 与 `.summer-prep-links` 样式；`index.html` 静态资源版本号更新为 `20260714h`。

### V5.12 首页主工作区扩宽（build `20260714i`）

- **桌面侧栏默认收起**：`style.css` 把 `--nav-width` 默认改为 76px 图标栏；`index.html` 新增侧栏展开按钮；`app.js` 新增 `sidebar_expanded` 状态，点击后切换 `body.sidebar-expanded` 并持久化，展开时恢复 240px 文字导航。移动端汉堡菜单仍显示完整文字导航。
- **右辅助栏压缩**：首页 `.home-flow` 从近似 1:1 两栏改成 `主栏 + 280px 辅助栏`，最大宽度提升到 1360px；右侧迷你农场 padding、地块、精灵图和文字尺寸同步压缩，给中间每日计划让出更多空间。
- **总路线同步扩宽**：`.summer-route-card` 最大宽度跟随首页提升到 1360px，28 天总计划继续作为独立全宽区域展示；`index.html` 静态资源版本号更新为 `20260714i`。

### V5.13 首页学习工作台交互化（build `20260714j`）

- **右侧操作栏**：`modules/farm.js` 把首页“导入学习记录”和“今日复习”从主学习栏移到 `.home-right-stack`，右侧顺序变成导入/复习/迷你农场/趋势/专注/承诺/AI指南；主栏更专注显示“今日暑假任务”。
- **28天路线可点击**：`modules/summerTasks.js` 新增 `routeDetailDay` UI 状态。总计划里的每一天从静态卡改成可点击按钮，点击后在总计划顶部显示该日详情；第 1-2 天展示已落实视频任务和状态，第 3-28 天展示主题焦点和待补资源说明，不改变当前今日任务。
- **任务步骤可点击**：暑假任务卡的 `看视频 / 做题 / 导入 / 完成` 步骤条改成按钮，记录到每个任务的 `activeStep`。点击步骤只切换任务卡内的操作面板，不会误标记完成；真实进度仍由“下一步”和 MOCHI-RECORD 导入推进。
- **样式和缓存**：`style.css` 新增路线详情、步骤面板、右栏紧凑导入/复习样式；`index.html` 静态资源版本号更新为 `20260714j`。

### V5.14 首页互动防跳动（build `20260714k`）

- **纯查看操作保持当前位置**：`modules/summerTasks.js` 的 `route-day` 和 `show-step` 不再调用 `scrollIntoView()`，改为按被点击按钮做锚点恢复；点击 28 天路线或任务步骤时，即使上方详情高度变化，按钮也保持在原来的屏幕位置。
- **状态推进也减少跳动**：看完视频、打开做题区、标记看完、开始视频、复制过关小题等会重渲染任务卡的操作改为按整张任务卡做锚点恢复；只有“关联并去导入”仍会主动滚到右侧导入框。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260714k`。

### V5.15 暑假物理滚动队列 + 例题截图收集（build `20260714l`）

- **滚动任务队列**：首页暑假物理区从固定“第 N 天”改为未完成优先队列。未完成的视频任务会一直排在前面，完成后自动露出下一组；提前完成不需要手动切计划。
- **28 天路线可执行**：第 3-28 天不再显示学生端占位/待补资源文案，改为“学习单”形态。每张学习单都有主题、资源入口、截图要求、开始专注、关联并导入 MOCHI-RECORD，导入后写入 `routeDays[day].completed`。
- **资源入口补齐**：后续学习单会按主题关键词自动给出一轮复习 B 站合集、基础课合集和小红书攻略入口；一轮合集 BV 来自 B 站公开 API，可直接点击。
- **视频例题截图收集**：每个视频任务新增“视频例题截图”区，支持点击后 Ctrl+V 粘贴截图或上传图片，并标记“会 / 半会 / 不会”。元信息存入 `summer_task_state.examples`，图片本体存入 IndexedDB `mochi_summer_examples`，不污染 `study_log`。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260714l`。

### V5.16 路线学习单可设为今日 + 开发测试场景（build `20260714m`）

- **路线日可切入今日**：28 天总计划详情新增“设为今日任务”。点击后写入 `summer_task_state.activeRouteDay`，首页从自动顺延队列切到该日；第 1-2 天显示对应未完成视频任务，第 3-28 天显示该日学习单。首页显示“当前锁定”条，并可点“回到自动顺延”清除锁定。
- **完成与顺延口径**：视频任务仍以导入 MOCHI-RECORD 完成并从滚动队列消失；路线学习单以 `pendingRouteDay` 关联导入记录，写入 `routeDays[day].completed` 后消失并顺延到下一天。
- **开发体验数据**：`window.MochiSummerTasks.loadDemoState(name)` 新增演示状态：`reset`、`unfinished`、`unlock-day2`、`jump-day5`、`route-day3-pending`、`route-day3-done`，用于不用真实学习也能测试滚动、拖延、跳天、导入完成流程。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260714m`。

### V5.17 后续路线视频化 + 例题同类测验包（build `20260714n`）

- **第 3-28 天主线视频化**：`modules/summerTasks.js` 新增 `ROUTE_VIDEO_LIBRARY`，把后续路线从单纯主题学习单升级为逐日主线视频清单。大部分资源来自黄夫人物理一轮/基础课的 B 站公开分 P 标题和时长；第 17 天补入机械振动/机械波基础视频；第 18 天暂按考试范围三选一执行，不硬塞未确认随机资源。
- **每个路线视频独立收集例题**：路线学习单里每个视频都有自己的“本视频例题截图”区，使用 `route-day-{day}-{videoKey}` 作为截图桶 id，学生粘贴/上传截图时不会和其他视频混在一起；没有精确视频的学习单使用 `route-day-{day}-sheet` 作为当天资料截图桶。图片仍存 IndexedDB `mochi_summer_examples`，元信息仍存 `summer_task_state.examples`。
- **同类测验包闭环**：视频截图区新增“复制同类测验包”。已有截图后会复制一段 Prompt，要求 AI 先识别截图考点，再按截图题型生成 2-4 道基础变式题，一次一题引导，最后输出 MOCHI-RECORD。路线视频复制测验包后会关联到当天学习单，粘回记录后完成该日。
- **学生端去半成品文案**：学习单不再显示“具体视频之后补得更细”之类占位口径，改成“打开下方视频 / 每个视频收集例题 / 复制同类测验包 / 粘贴 MOCHI-RECORD”的明确步骤。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260714n`。

### V5.18 暑假任务降噪 + 滚动稳定（build `20260714o`）

- **顶部反馈重做**：首页暑假物理区删除不直观的 `详细任务完成数/7` 方块和抽象进度条，改成“今日完成 / 当前显示 / 剩余详细课”或“今日资源 / 例题截图 / 学习记录”的小仪表板。
- **路线视频按钮降噪**：路线视频卡只保留“打开视频 / 开始专注”，不再在每个视频卡上重复放“先贴例题/同类测验”按钮，降低按钮墙压力。
- **例题截图区压缩**：截图区改为紧凑工具条，文案从“大块粘贴框 + 上传图片 + 复制同类测验包”压缩为“粘贴截图 / 上传 / 测验包”，按钮高度和间距缩小。
- **滚动抖动修复**：截图区新增 `data-summer-example-task-id` 作为锚点；粘贴截图、改“会/半会/不会”、删除截图后重渲染时按当前截图区恢复位置，不再跳到视频卡或页面其他位置。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260714o`。

### V5.19 暑假路线预览 + 今日进度线（build `20260714p`）

- **总计划只做预览**：28 天路线详情中，第 3-28 天不再复制完整执行单；点击某天只显示 compact 视频/学习单预览、来源时长、截图要求和完成状态。真正开始学习时仍通过“设为今日任务”迁移到首页今日区展开完整流程。
- **今日执行进度线**：今日任务和路线视频执行区新增左侧竖向进度线；完成点显示绿色对勾，进行中显示高亮圆点，未开始保持空心点，让学生能从视觉上看出走到哪一步。
- **例题状态修复**：例题截图的“会 / 半会 / 不会”改为原地更新按钮选中态和标题，不再依赖整页重绘；删除后重新粘贴的新截图仍可重新选择掌握状态。
- **AI 识图反馈占位**：例题截图区新增持久状态提示，明确当前网站只负责保存截图；已有截图时提示“复制测验包并把截图一起发给 Gemini”，后续接多模态 API 时可在同一区域显示“识别中 / 识别失败 / 需要手动补图”。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260714p`。

### V5.20 无 API 例题图片复制 + 总计划回顾（build `20260714q`）

- **同类测验包改成人工顺滑链路**：例题截图区新增“复制图片”按钮，直接从 IndexedDB 取已保存截图写入系统剪贴板。学生流程变成：复制测验包文字粘给 Gemini → 回 MochiStudy 点复制图片 → 到 Gemini 粘贴图片；不需要接多模态 API。
- **图片复制兜底**：浏览器不允许图片剪贴板时，弹出可见的大图窗口，提示学生右键复制或拖进 Gemini，避免只靠短 toast。
- **总计划回顾详情**：28 天总计划预览卡保持简洁，但每条视频/学习单新增“查看例题和笔记”折叠入口；展开后可回看本视频保存过的例题截图、掌握状态，并单独复制图片。
- **学习备注**：总计划回顾里新增“学习备注 / 卡住点”输入框，离开输入框自动保存到 `summer_task_state.tasks[id].studyNote`，方便后续复习时看到学生自己的反馈。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260714q`。

### V5.21 强制学习收尾 + 今日总复盘（build `20260714r`）

- **完成不等于翻篇**：暑假任务导入 MOCHI-RECORD 后只进入 `completed=true + reflectionRequired=true + reflectionDone=false`，任务仍挡在滚动队列最前面；只有保存学习收尾后才算 `taskReadyToAdvance`，才会自动顺延。
- **单节学习收尾弹窗**：导入后显示固定遮罩弹窗，要求选择“会一点/半懂/还是懵”，并至少写一句收获或卡点。保存后写入 `summer_task_state.tasks[id].reflection`，同时可回填 `studyNote` 供总计划回看。
- **每日总复盘弹窗**：同一天全部任务都完成且单节收尾完成后，系统先弹“今日总复盘”，保存整体状态、最有用的一点、最卡的一点和明天先看什么；保存到 `routeDays[day].dailyReflection` 后才解锁下一组。
- **路线视频也有门禁**：从路线视频“测验包”导入时记录 `pendingRouteTaskId`，先收该视频的学习收尾，再收当天总复盘；从整天学习单导入时用 `route-day-N-sheet` 作为收尾对象。
- **总计划回看增强**：总计划展开详情会显示单节学习收尾和今日总复盘，不再只是手写备注和例题截图。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260714r`。

### V5.22 进度节点内收尾 + 统一导入归档（build `20260715a`）

- **收尾迁回进度条**：单节学习收尾不再由导入 MOCHI-RECORD 后弹窗触发，改为嵌入每个视频/任务节点下方的“本节收尾”小卡。学生在当天进度线里完成“例题截图 → 测验包 → 本节收尾”，保存后节点才变绿。
- **完成口径重做**：第 3-28 天不再靠 `routeDays[day].completed` 判完成，改为当天所有路线视频任务 `taskReadyToAdvance` 后触发今日总复盘；总复盘保存后该天才算完成并顺延到下一天。旧 completed 数据不强制倒补复盘。
- **统一导入只做归档**：MOCHI-RECORD 导入入口仍统一放在当天学习单/首页导入区；复制某个视频的测验包会写入 `pendingRouteTaskId`，后续导入只归档到当前关联视频/学习单，不再负责触发本节收尾或自动翻篇。
- **前 7 节也去掉单节导入按钮**：详细任务的步骤从“看视频/做题/导入/完成”改为“看视频/做题/收尾/完成”；主按钮引导写本节收尾，MOCHI-RECORD 仍走统一导入框。
- **节点状态更准确**：路线进度点只有保存本节收尾后才绿色完成；已贴例题、已复制测验包只显示为进行中/待写收尾，避免“收集了资料但没真正复盘”被误判完成。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260715a`。

### V5.23 低摩擦本节收尾（build `20260715b`）

- **状态改成做题能力判断**：本节收尾的选项从“会一点 / 半懂 / 还是懵”改成“会了，能独立做同类题 / 看例题能做 / 听懂但不会做 / 还没听懂”，避免只有负向选项。
- **只保留一个必填输入**：学生只需要写“下次看到这类题，先提醒自己什么”，不再强制分别填写收获、卡点和复习提醒，减少形式化负担。
- **卡点改为可选标签**：读题、图像、公式、受力、概念、计算、单位、都顺作为可选标签，补充说明折叠起来；旧 reflection 数据继续兼容显示。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260715b`。

### V5.24 例题截图本机保存提示（build `20260715c`）

- **截图保存口径澄清**：例题截图粘贴后立即写入 IndexedDB，元信息写入 `summer_task_state.examples`；不需要再点额外按钮才保存。
- **按钮去误导**：原“上传”按钮改为“从文件添加”，说明它只是本地文件选择备用入口，不会上传到 GitHub 或云端。
- **界面提示**：例题区新增“粘贴成功就已保存到本机浏览器；从文件添加只是备用”的小提示，避免学生误以为没点上传会丢图。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260715c`。

### V5.25 导入粘回入口 + 专注收起小窗（build `20260715d`）

- **就近粘回学习记录**：复制同类测验包或例题图片后，当前视频节点下方出现折叠式 `summer-import-dock`，学生可直接把 Gemini 输出的 MOCHI-RECORD 粘回该视频；右下角同步显示“等待导入”浮条。
- **导入归档仍统一**：粘回条导入前会写入 `pendingTaskId` / `pendingRouteTaskId`，继续复用 `parsePastedRecordEl()` 和 `attachImportedRecord()`，不新增 `study_log` 字段。
- **专注可收起**：专注 overlay 新增“收起计时”，计时继续运行，右下角 `focus-mini-dock` 可回到专注或结束本轮，学生能在页面里继续粘截图、复制提示词、导入记录。
- **反思分场景**：暑假任务启动专注时传入 `{ source: "summer-task", taskId }`，结束后引导回当前任务写本节收尾，不再重复强制普通承诺反思；普通专注仍保留轻量小结、学习类型标签和完成状态选择。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260715d`。

### V5.26 暑假任务注意力降噪（build `20260715e`）

- **单主按钮推进**：今日任务和路线视频卡只突出一个当前“下一步”按钮；打开视频、开始专注、标记看完等备用动作收进“更多”抽屉。
- **材料抽屉化**：例题截图、MOCHI-RECORD 粘回、本节收尾统一放入“学习材料与记录”抽屉；只有待导入、待收尾或正在做题时自动展开。
- **未到步骤灰化**：任务步骤条和路线视频序列中，未到的步骤降低透明度，当前节点保持正常颜色，减少学生扫视压力。
- **回到任务更明确**：暑假专注结束页文案改为“回到这节课”；点击后打开对应任务的材料/收尾区并短暂高亮任务卡，不再只跳回密集页面。
- **暑假专注文案去误导**：暑假任务结束页不再突出“数学/物理卡片”这种调试感科目摘要，只提示记录条数和下一步收尾。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260715e`。

### V5.27 进度线增强 + 完成态回看（build `20260715f`）

- **进度线加粗加亮**：今日任务左侧进度线和路线视频节点改为更粗的 4-5px 视觉线，当前节点有更明显的紫色光圈，完成节点为绿色。
- **按顺序灰化**：今日队列和路线视频按“最前面的未完成项”决定视觉焦点；后面的任务即使被历史数据乱序完成，也会先降权显示，避免抢走当前步骤注意力。
- **完成态收起执行入口**：已完成任务的主按钮改为“查看回顾”，默认不再展示粘贴截图、测验包、导入记录等执行入口；抽屉里只回看学习记录、收尾和已保存例题，例题仍可改状态、复制或删除。
- **底部资源降噪**：每天学习单底部不再铺开“一轮合集/基础课/小红书/开始专注/统一导入记录”等按钮；B站/基础课补充资料收进“补充资料”折叠入口，并移除容易失效的小红书链接。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260715f`。

### V5.28 暑假奖励浮窗 + 主线摩擦修复（build `20260715g`）

- **开始不再强跳视频**：点击“开始这节课”只启动 MochiStudy 内的学习/专注状态，不再自动 `window.open` B 站，避免浏览器切走导致学生丢失网站定位；视频入口仍在“更多操作 → 打开视频”。
- **滚动稳定继续收紧**：保存本节收尾、复制例题图片等改变卡片高度的动作改用当前任务卡锚点恢复位置；`openTaskFollowup()` 改为只在承接区不在视口时滚动，减少导入/保存后的页面跳动。
- **主线来源澄清**：第 3 天之后的学习单新增 `summer-route-source-note`，说明当前是“小红书攻略主题方向 + 已买黄夫人一轮/基础课兜底视频”，不是已经完全替换成小红书原帖推荐 BV。
- **即时反馈浮窗**：新增右下角可拖动 `summer-reward-float`，显示当天视频完成数、本节进度、今日专注分钟和导入记录数；状态存在 `summer_task_state.reward`。
- **浮窗内抽奖**：当某天/某周完成并复盘后，浮窗显示“抽一次奖励”，直接在浮窗内按隐藏权重抽奖、播放轻音效并触发 sparkle；奖项权重可通过 `summer_reward_config` 调整。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260715g`。

### V5.29 暑假能量骰子走格抽奖（build `20260715h`）

- **抽奖过程游戏化**：右下角暑假能量浮窗不再瞬间显示结果，改为 8 格奖励棋盘；点击抽奖后先滚动骰子，再按点数每 520ms 走一格，最后停格结算。
- **结果常驻截图**：抽中结果会保留在浮窗内，显示奖励原因、奖项和金额，并提供“收起结果”按钮；不再只闪一下就消失。
- **历史记录**：暑假奖励历史继续存在 `summer_task_state.reward.history`，最多 50 条；勋章页新增“暑假能量奖励”区，记录日期、日/周奖励、骰子点数、奖项和累计金额。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260715h`。

### V5.30 能量进度环 + 抽奖二段式（build `20260715i`）

- **小金猪外圈进度**：`summer-reward-icon` 外圈新增 conic-gradient 能量环，直接读取当天完成度 `stats.pct`；折叠状态也能看到今日推进程度，展开后仍保留原横向进度条。
- **抽奖二段式**：浮窗“打开抽奖盘”只展示棋盘，不消耗奖励；学生需要再点“摇骰子开始”才进入抽奖，骰子滚动约 4.5 秒后再走格结算。
- **今日总复盘降摩擦**：整体状态按“很顺 / 正常 / 有点累 / 卡住了”排序；删除“明天开始前先看”输入和回看展示，避免学生填写无用项。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260715i`。

### V5.31 猫咪植物农场精灵（build `20260716m`）

- **农场素材替换实验**：新增 `assets/farm/cat_crops.png`，由用户生成的 3 行 × 6 列猫咪植物图处理为透明 sprite sheet；三行分别对应数学、物理、化学，六列对应休眠、种子、发芽、幼苗、开花、成熟。
- **农场渲染接入**：`modules/farm.js` 的 `cropSpriteStyle()` 改为读取猫咪植物精灵表，不改 `farm_state`、`recordCount`、成长阈值或收获逻辑；0 条记录时也显示休眠小种子，仍通过 `0/15` 表示未开始。
- **迷你农场可读性**：放大 `.mini-plot-sprite`，去掉旧星露谷素材专用的 `mix-blend-mode: screen`，保留 `image-rendering: pixelated`，让成熟态猫咪花在首页右栏更清楚。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260716m`。

### V5.32 迷你农场图片区放大（build `20260716n`）

- **去掉套娃黑框**：`.mini-plot` 不再作为深色卡片背景，只负责纵向排版；深色区域集中到真正承载植物的 `.mini-plot-sprite`。
- **植物显示区域放大**：`.mini-plot-sprite` 从 58px 放大到 80px，`.mini-crop-sprite` 同步放大到 `scale(0.63)`，让猫咪植物成为三格农场的视觉主体。
- **文字移到图片框外**：科目名和 `recordCount/harvestTarget` 改为深色文字显示在图片方块下方，不再占用植物画面区域。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260716n`。

### V5.33 右栏农场常驻顶部（build `20260716o`）

- **农场固定展开**：`modules/farm.js` 新增 `renderMiniFarmCard()`，把迷你农场从 `renderHomeStatusArea()` 的折叠抽屉中抽出，改为右栏第一张常驻展开卡。
- **右栏顺序调整**：首页右栏顺序改为迷你农场 → 导入学习记录 / 休眠提示 → 动态专注 → 其他状态抽屉；专注时间继续展开，其余复习、节奏、路线、档案入口保持默认折叠或入口形态。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260716o`。

### V5.34 学习页三 tab UI 改造 Phase 3（build `20260716s`）

- **入口形状分层**：学习页顶层 tab 和学习档案科目切换统一接入 `.seg` 分段控制器；档案/复习动作入口统一为 `.btn-ghost` 小按钮并保留全部原 `data-*` 行为。
- **复习队列可读性**：复习行改为知识点/徽章/开始按钮一行、复习原因单独一行；原因不再省略截断，移动端自然换行。
- **档案降层**：核心摘要改为双列两行布局；“测这个知识点”降为常规 `.btn-tonal`；学习卡片改为 `.card-sub` 风格，展开详情用分隔线连接主体。
- **今日学习收紧**：统计行压成四格紧凑展示，日期切换器接入 `.btn-ghost` 和 `.field` 规范，空状态居中减空白。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260716s`。

### V5.35 勋章页 + 设置页 UI 改造 Phase 4（build `20260716t`）

- **勋章页首屏减负**：抽奖机会、兑换规则和勋章统计合并为一行 `lottery-entry-card`；大/小勋章列表上移，桌面首屏可直接看到多条勋章。
- **勋章空态轻量化**：`x0` 勋章行改为透明/白底、灰字和去饱和图标；已获得勋章保留实底和 `--primary-tint` 数量 chip，展开详情不变。
- **设置页手风琴化**：设置页改为六个默认收起的 `settings-group`，顶部六个 chip 可展开并滚动到对应组；原有开关、复制 Prompt、API、备份、假期和更新入口保留。
- **表单与锚点修复**：`.field` 输入框统一到 `--r-md` / `--line`，危险操作使用 `--bad` ghost；新增 `scroll-padding-top` 和 `scroll-margin-top` 避免固定顶栏遮挡锚点。
- **验证产物**：报告写入 `docs/review-batch/ui-phase-4-report.md`，截图输出到 `docs/review-batch/screenshots/ui-phase-4/`。
- **缓存版本号**：`index.html` 静态资源版本号更新为 `20260716t`。

### V5.36 UI 改造 Phase 5 收官（build `20260716u`）

- **专注沉浸态收口**：放弃按钮改为暗背景下可辨的白描边 ghost；导入入口加半透明卡底；deciding 结果按钮纵向等宽排列，承诺弹窗和反思 textarea 对齐字体/field token。
- **抽奖深梅桥接**：抽奖 overlay 改为深梅底色，标题/骰子/按钮/奖池卡片统一使用 `--gold` 系和 `--r-md`/`--r-lg` 圆角；三段式流程、动画、音效、near-miss、保底和权重未改。
- **移动端终扫**：补齐学习页、设置、暑假任务区、抽奖关闭按钮等可见交互目标到 40px+；收起态暑假能量浮窗移到移动端顶栏空位，避免遮挡任务按钮。
- **复习原因标点修复**：`buildPrimaryReason()` 拼接前去掉卡点文本尾部 `。/．/.`，避免 “。” 叠加。
- **验证产物**：报告写入 `docs/review-batch/ui-phase-5-report.md`，截图输出到 `docs/review-batch/screenshots/ui-phase-5/`，CDP 冒烟和三档移动扫描通过。
- **缓存版本号**：`index.html` 静态资源版本号和 `BUILD_ID` 更新为 `20260716u`。

### V5.37 暑假能量奖励进度可见化（build `20260717j`）

- **浮窗奖励规则说清楚**：暑假能量浮窗展开态新增“日常小奖”和“大奖”两条进度，直接写明“今天完成 2 个视频任务 = 1 张小奖券”“攒够 5 个达标日 = 1 张大奖券”。
- **计分点解释**：新增说明卡，明确“什么算完成 1 个视频任务”：看课 → 做题/截图 → 粘回学习记录 → 写本节收尾。
- **当前视频任务四步回看**：浮窗内显示当前视频任务、下一步和 4 格步骤状态，学生不用猜哪一步会推进奖励。
- **缓存版本号**：`index.html` 静态资源版本号和 `BUILD_ID` 更新为 `20260717j`。

### V5.38 暑假奖励门槛按真实任务量校准（build `20260717k`）

- **日常门槛从 2 调整为 3**：当天跨三科完成 3 个完整视频任务，才获得 1 张小奖券并记为达标日；累计 5 个达标日获得 1 张大奖券。
- **自动小额奖励同步收紧**：1-2 个任务不发自动奖金；3 个任务当天累计 ¥5；4 个及以上当天累计 ¥8。每日 ¥40、每周 ¥150 上限和奖池均未改动。
- **旧奖励保留**：已经发放的奖金、券和达标日不追回；更新当天如已按旧规则领奖，只在达到新档位时补差额。
- **浮窗状态修正**：奖励说明统一读取配置门槛；账户里留有旧小奖券时，不再误写成“今天已达标”。
- **完整流程才计分**：奖励能量只统计已经保存本节收尾的任务；新完成任务用 `rewardCompletedAt` 记录四步流程真正结束的时间，旧达标日仍按原日期保留。
- **缓存版本号**：`index.html` 静态资源版本号和 `BUILD_ID` 更新为 `20260717k`。

### V5.39 卡住任务补基础闭环（build `20260717l`）

- **视频内即时求救**：未完成视频旁新增“听不懂 / 视频太难”入口，学生可选择“概念没学过 / 公式太多 / 视频太长”，页面只给当前最小补救动作，不再等到练习步骤才显示讲义和基础课。
- **万有引力精确救援**：第 2 天万有引力卡点明确指向实体一轮讲义 2 第 27-30 页和“万有引力定律 / 向心力 / 卫星圆周运动”关键词，并暂缓同步卫星、双星、追及相遇和复杂比值题。
- **三种处理结果**：“解决了”回原任务但不算完成；“还是不懂”复制包含已尝试内容和具体卡点的求助卡；“先放一放”写入 `tasks[].support.status = deferred`，退出当前队列但不计完成、不计奖励。
- **待补基础与周节点拦截**：待补任务集中显示并可随时返回；物理在第 7/14/21/28 天周测前强制补回同周任务，数学/化学在进入下一周前强制补回，防止无限拖延。
- **兼容与完成规则**：旧状态没有 `support` 时行为不变；正常完成一天仍需完成原有今日复盘才顺延，`study_log` 和备份结构均未改动。
- **缓存版本号**：`index.html` 静态资源版本号和 `BUILD_ID` 更新为 `20260717l`。

### V5.40 补基础按钮滚动稳定（build `20260717m`）

- **局部更新代替整页重绘**：打开补基础、选择卡住原因、勾选已尝试资源和“解决了”只替换当前救援面板，不再重绘整个首页，避免点击后滚动锚点连续修正。
- **任务切换锁定视口**：“先放一放”和“回来处理”仍需重排任务队列，但刷新前主动释放按钮焦点，并在重绘当帧锁定原始滚动坐标，避免浏览器自动聚焦导致页面跳动。
- **缓存版本号**：`index.html` 静态资源版本号和 `BUILD_ID` 更新为 `20260717m`。

### V5.41 临时救急与正常任务分层（build `20260717n`）

- **救急移出材料区**：“听不懂 / 视频太难”不再展开在“学习材料与记录”里，而是在四步任务下方显示独立的暖色暂停带，并明确标注“临时救急 · 不计任务进度”。
- **主线暂停而非新增任务**：救急开启时保留任务标题与四步进度，正常步骤、材料区和主操作进入暂停态；解决后原地恢复，仍需完成原有视频、做题、收尾才计入进度和奖励。
- **一次只给一个动作**：保留三个卡住原因，每次只显示一个最小补救动作、一个精确资源入口和一个返回自检；已尝试勾选和默认备注框从学生界面删除，旧 `attempted` 数据继续兼容。
- **求助按需展开**：“还是不懂”先展开一行可选卡点说明，再由学生复制求助卡；不会一点击就弹出输入区或自动复制。
- **暂缓提醒轻量化**：原大块“待补基础”改为一条可展开提醒，“暂时放下”仍不算完成、不计奖励，原有周复盘节点拦截继续生效。
- **局部更新继续保留**：打开、选原因、展开求助和解决都只刷新当前暂停带，不重绘首页、不改变滚动位置。
- **缓存版本号**：`index.html` 静态资源版本号和 `BUILD_ID` 更新为 `20260717n`。

### V5.42 日常任务浅绿底色（build `20260717o`）

- **正常任务改为清新浅绿**：当前日常任务、等待导入任务和路线里的当前/下一视频任务由浅蓝高亮改为低饱和浅绿色；完成态、收尾提醒与临时救急暖色带保持原有语义配色。
- **缓存版本号**：`index.html` 静态资源版本号和 `BUILD_ID` 更新为 `20260717o`。

### V5.43 日常任务摘要带（build `20260717p`）

- **裸文字改为任务摘要带**：科目 Tab 下方的滚动任务说明增加浅绿底、绿色强调线和日历图标，今日主题使用深色标题，说明文字收紧为辅助层级。
- **进度状态块**：右侧资源数、完成度和收尾状态由普通行内文字改为紧凑状态块，桌面并排、移动端自然换行，不与下方正式任务区混淆。
- **缓存版本号**：`index.html` 静态资源版本号和 `BUILD_ID` 更新为 `20260717p`。

### V5.44 补回一轮复习精确位置（build `20260717q`）

- **实体讲义页码恢复强调**：补基础暂停带中的实体书范围固定标为“实体一轮讲义页码”，不再用含糊的“只翻这里”。
- **路线视频精确对应**：物理一轮路线视频进入“看不懂”后，新增“一轮复习对应位置”，同时显示视频分 P、讲义页码和视频标题，并可直接打开对应分 P；该信息与最小补救动作同时保留，不再二选一。
- **求助卡同步**：复制求助卡时也会带上相同的一轮复习具体位置，便于 AI、老师或同学按同一页讲解。
- **缓存版本号**：`index.html` 静态资源版本号和 `BUILD_ID` 更新为 `20260717q`。

### V5.45 看不懂入口跟随整节任务（build `20260717r`）

- **入口不再绑定“看视频”步骤**：详细视频任务的“看不懂 / 视频太难”从第 1 步内部移到四步进度条下方，属于整节任务级入口。
- **已有例题仍可补基础**：只要视频任务尚未真正完成，即使已经导入例题、进入做题、已有学习记录或等待本节收尾，入口仍然显示；只有完成原有视频、练习和收尾闭环后才隐藏。
- **缓存版本号**：`index.html` 静态资源版本号和 `BUILD_ID` 更新为 `20260717r`。

### V5.46 待补基础入口显性化（build `20260717s`）

- **入口由弱提醒改为明确操作条**：任务摘要下方的“待补基础”使用暖色底、左侧强调线、卡点数量、规则说明和“查看并处理”操作，不再是一行难发现的淡色文字。
- **暂时放下后直接定位**：点击“暂时放下”会重排任务后主动定位到“待补基础”入口并自动展开刚放入的任务；这是有目的的导航，不再锁在原位置让学生猜入口在哪里。
- **移动端可见性**：入口在窄屏改为两行布局，操作按钮独立换行，卡点列表保持可读。
- **缓存版本号**：`index.html` 静态资源版本号和 `BUILD_ID` 更新为 `20260717s`。

### V5.47 专注收尾减压 + 今日报告去判分（build `20260718a`）

- **专注收尾变轻**：普通专注 deciding 阶段把“这轮学了什么？”改为“收尾一下（可选）”，标签和文字都只是辅助记录，不再像额外作业。
- **结果按钮去羞辱化**：“搞定了 / 部分完成 / 没完成”改为“完成了 / 先记一半 / 下次继续”，仍写入原有 `commitment_history.outcome`，不改 localStorage 结构。
- **今日报告只保留客观数据**：学习时间轴不再展示“目标达成 / 部分完成 / 没完成”徽章，页面和导出长图只显示目标、计划分钟、实际分钟和学生备注，避免学生超时完成后仍被“部分完成”误导。
- **缓存版本号**：`index.html` 静态资源版本号和 `BUILD_ID` 更新为 `20260718a`。

### V5.48 暑假奖励改为仅抽奖现金 + 奖池预览（build `20260721a`）

- **删除隐藏固定现金**：完成 3/4 个视频任务不再自动发 ¥5/¥8；每 5 个达标日不再固定发 ¥15。任务只负责发小奖券、大奖券和推进达标日/阶段，现金只来自抽奖。
- **旧额度按真实抽奖重建**：`summer_reward` 升级为 `rewardModelVersion: 2`，首次运行时用 `history` 重算今日/本周真实抽奖金额，清除以前混入额度的固定奖励；券、达标日、阶段和抽奖记录不变。
- **日限与周限分账**：新增 `dailyDrawPaidDate` / `dailyDrawPaid`；每日 ¥40 只限制小奖抽奖，大奖不占日限，小奖与大奖共同受每周 ¥150 限制。
- **按钮直接预览奖池**：能量浮窗始终显示小奖 `¥2 / ¥5 / ¥10 / ¥20`、大奖 `¥20 / ¥50 / ¥100`；无券或封顶时按钮禁用但金额仍可见。
- **到账与封顶文案纠正**：浮窗改显示“今日到账 ¥X”；裁剪结果区分今日小奖额度和本周额度；奖励记录明确现金只来自抽奖。
- **缓存版本号**：`index.html` 静态资源版本号和 `BUILD_ID` 更新为 `20260721a`。
