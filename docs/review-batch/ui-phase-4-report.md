# UI Phase 4 Report - 勋章页 + 设置页

## 盘点结果

### 上轮已完成

- `app.js` 已落地设置页六组 `<details class="settings-group">` 手风琴，默认不带 `open`，因此默认全收起。
- 设置页顶部六个 `.settings-anchor-chip` 已落地，点击走 `data-action="open-settings-group"`，由 `openSettingsGroup()` 打开对应组并 `scrollIntoView()`。
- `renderAchievements()` 已把抽奖机会、兑换规则、大/小勋章、已抽奖统计合并到一行 `lottery-entry-card`。
- `renderBadgeItem()` 已输出 `badge-earned` / `badge-empty` / `badge-new` 状态，展开详情仍保留在 `<details>` 内。
- 危险操作按钮已改为 `btn-danger-ghost`，原 `data-action="clear-progress"` / `factory-reset` 和二次确认逻辑未改。
- `BUILD_ID` 已是 `build-20260716t`。
- `index.html` 全部静态资源 `?v=` 已是 `20260716t`，本轮复查未发现残留 `20260716s`。

### 本轮补完

- 补齐 Phase 4 模板 class 对 CSS 的直接覆盖：`ai-guide-prompts`、`summer-honor-card`、`lottery-entry-card.has-tickets`、暑假奖励 history 的 `plain/coin` tone。
- 强化 `lottery-entry-card.is-quiet`：无券时数字、说明和按钮都更低调；有券时保持白底与主色数字。
- 收紧 x0 勋章轻空态：透明/白底、`--ink-3` 灰字、去饱和图标、无数量 chip 实底，hover 也只给极浅子块底。
- 保留已获得勋章实底和 `--primary-tint` 数量 chip。
- 全局补 `html { scroll-padding-top: 112px; }`，配合 `.settings-group { scroll-margin-top: 112px; }` 兜底固定顶栏下的锚点滚动。
- `.field input/textarea/select` 统一到 `--line` 边框、`--r-md` 圆角、`--ink` 文本和一致 focus 状态。
- 移动端补 AI Prompt summary 防溢出：复制按钮在窄屏下换到整行。

## A. 勋章页核对

- [x] 抽奖机会横幅压成一行：数字、兑换说明、统计小字和右侧「去抽奖」同卡呈现。
- [x] 有券时数字使用 `--primary`；无券时 `.is-quiet` 降低文字权重。
- [x] 大勋章 / 小勋章 / 已抽奖统计改为紧凑小字，不再占用独立大卡。
- [x] x0 勋章行是透明/白底 + 灰字 + 去饱和图标，不再是灰实底大条。
- [x] x≥1 勋章行保留实底，数量 `xN` 使用 `--primary-tint` chip。
- [x] 展开箭头和展开后的规则/进度详情保留。
- [x] 暑假计划成就、暑假能量奖励、抽奖历史入口保留，空态/列表使用 `.card-sub`。

## B. 设置页核对

- [x] 六组设置全部收进 `<details class="settings-group">`，默认全收起。
- [x] summary 行包含图标、组名、一句摘要和 chevron。
- [x] 顶部六个 chip 可打开对应组并滚动到位。
- [x] 组内原 id/class/data-action 保留，事件委托路径未改。
- [x] 表单控件统一走 `.field` 样式；组内 select 仍保留原 id。
- [x] 危险操作统一 `--bad` ghost 样式。
- [x] `.page-head` 未使用 sticky；锚点滚动有 `scroll-padding-top` / `scroll-margin-top` 兜底。
- [x] 管理后台未改。

## 功能自查清单

- [x] 阅读字体选择：`#reading-font-select` 保留，仍走 `handleChange()`。
- [x] 阅读字号选择：`#reading-size-select` 保留，仍走 `handleChange()`。
- [x] 休息提醒音开关：`#sound-reminder-toggle` 保留 inline 保存逻辑。
- [x] 休息结束铃声选择/试听：`#rest-reminder-sound-select` 保留，仍走 `handleChange()`。
- [x] 专注到点提示音选择/试听：`#focus-end-sound-select` 保留，仍走 `handleChange()`。
- [x] 复制 Prompt x4：四个 `data-action="copy-ai-prompt"` 和 prompt path 保留。
- [x] API 保存：`#api-form` 保留，仍走 `handleSubmit()`。
- [x] 导出备份：`data-action="export-data"` 保留。
- [x] 导入恢复：`#backup-import` 保留，仍走 `handleChange()`。
- [x] 清空学习进度：`data-action="clear-progress"` 保留。
- [x] 恢复出厂设置：`data-action="factory-reset"` 保留。
- [x] 假期添加：`data-action="open-holiday-form"` 保留。
- [x] 假期删除：`data-action="delete-holiday"` 和 `data-holiday-id` 保留。
- [x] 假期模式切换：三个 `data-action="set-holiday-mode"` 保留。
- [x] 复制更新命令：三个 `data-action="copy-cmd"` 保留。
- [x] 关于 build 行显示 `build-20260716t`。

## 静态验证

- [x] Phase 4 模板 class 对照 CSS：缺口 0。
- [x] `index.html` / `app.js` 版本号：`20260716t` / `build-20260716t`。
- [x] `node --check app.js`。
- [x] `node --check modules/ai.js`。
- [x] `node --check modules/timer.js`。
- [x] `node --check modules/summerTasks.js`。
- [x] `node --check modules/farm.js`。
- [x] `node --check modules/pet.js`。
- [x] `node --check modules/knowledgeMap.js`。
- [x] `node --check modules/reviewEngine.js`。
- [x] `node --check modules/reviewPage.js`。
- [x] `node --check modules/todayStudy.js`。
- [x] `node --check docs/review-batch/screenshots/capture-ui.mjs`。

## 截图自查

- [x] `capture-ui.mjs ui-phase-4` 已输出到 `docs/review-batch/screenshots/ui-phase-4/`。
- [x] 联系表 `_contact-sheet.jpg` 已生成。
- [x] 桌面 800px 高度首屏至少露出 3 条大勋章；实际桌面截图中 5 条大勋章可见。
- [x] 移动端勋章页抽奖横幅和列表不溢出，x0 行保持轻空态。
- [x] 设置页全收起态显示六组 summary 和顶部 chip。
- [x] 设置页展开 AI 组后 Prompt 按钮和 API 表单可见；该截图通过点击 AI 锚点 chip 生成，覆盖 chip 展开路径。
