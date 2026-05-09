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
- `achievements` 是根据学习记录、农场状态、专注记录实时计算出来的导出快照，不是独立持久化 key；恢复备份时忽略 `data.achievements`，恢复基础数据后由系统重新计算
- 备份文件里的 `data.calendar_state` 是结构化导出对象，来源包括 `focus_log`、`school_holidays`、`holiday_mode_override`

### study_log 单条记录结构（严格遵守，不能新增或删除字段）

```javascript
{
  subject: "math" | "physics" | "chemistry",
  nodeLabel: string,          // 来自预设知识点列表，不能自由填写
  questionsCompleted: number,
  stars: 1 | 2 | 3,
  painPoint: string,          // 卡点，一句话
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
- 卡片展开显示：今日套路
- 顶部有“导出档案”按钮，支持文字格式和JSON格式

## 有效学习日规则

- 只有假期、周六日、以及用户手动点击“今天想学习”的日子才算有效学习日
- 上学日（工作日非假期）不计入任何学习统计
- 判断函数：window.MochiApp.isHolidayToday(date)，已存在，直接调用

## 调试方式

访问 index.html?debug=1，右下角出现调试面板，可以手动设置各科 recordCount。

## 游戏参数配置

所有游戏参数集中在 `app.js` 顶部的 `GAME_CONFIG_DEFAULTS` 对象里。
运行时配置读自 `localStorage` 的 `game_config` key，启动时和默认值深合并。
访问 `index.html?debug=1` 打开悬浮面板，Tab2“参数配置”可以直接修改所有参数。
**不要在代码里硬编码游戏数值，统一引用 GAME_CONFIG。**

## 重要约束

1. 不能改动 study_log 的字段结构，这个数据将来要给AI分析用
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
- 调试面板（?debug=1）
- 开发者参数配置面板（?debug=1 的参数配置 Tab，写入 game_config）
- 每日目标改为按当天导入记录自动完成，删除手动每日任务 localStorage
- 学习点/爱心/喂食系统删除，`MochiPet` 仅保留为学习状态内部模块
- 勋章逻辑调整：“知识点亮”统计有记录知识点，新增“精通达人”，删除“假期全勤”
- 首页导入框默认展开，无折叠逻辑
- 勋章页已解锁卡片排在每个分组最上面，并有顶部“已解锁”摘要
- 日历页改名“学习日历”，删除硬编码“萌芽阶段” pill，右上角显示今日题数
- 学习档案知识点行删掉日期列，只保留状态、知识点名、张数和最近星级
- 首页布局改为 `farm-layout-v2`：左侧番茄钟主区，右侧迷你农场、今日目标和导入框
- 三块地改为 `mini-farm-row` 一行迷你显示
- 专注开始触发沉浸模式：`body.focus-mode` + `focus-overlay`
- 沉浸模式保留导入记录小入口 `focus-import-area`
- `parsePastedRecord` 已抽出为 `parsePastedRecordEl(textarea, resultEl)`，供首页和沉浸模式复用
- 番茄钟有自由专注/设定时间两种模式，`timer.state.freeMode` 控制
- 专注结束先进入 `deciding` 阶段，显示“开始休息 / 继续专注”选择
- 沉浸模式无暂停按钮；`tick()` 调用 `tickFocusOverlay()` 只更新数字和圆环，不重建 DOM，避免导入框 textarea 失焦
- `deciding` 阶段有三个出口：开始休息 / 继续专注 / 结束今天的学习
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
