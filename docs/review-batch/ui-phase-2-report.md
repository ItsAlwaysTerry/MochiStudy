# UI Phase 2 Report

执行日期：2026-07-17

范围：按 `docs/ui-redesign-plan.md` Phase 2 改造首页“一屏一件事”。本阶段只改首页 DOM 组合与 CSS 视觉层级；未改暑假任务数据、任务状态计算、奖励经济结算、localStorage key、学习记录结构。

## 1. 实现内容

### 暑假任务卡减嵌套

- `modules/summerTasks.js`：
  - hero 右侧统计从独立统计卡改为标题行内联信息，保留“今日完成 / 共 N 项”等原信息。
  - “当前只看这几条 / 当前有关联导入”从米黄 callout 改为一行轻提示，保留剩余详细任务数和下一步说明。
  - 队列项仍保留原 `article[data-summer-task-id]`，但视觉上改成分隔线列表。
  - 步骤按钮显式使用 `.chip`，当前步为 `--primary-tint` 底 + `--primary` 字，未到步为灰字无底。
  - “先看主线视频 / 做过关小题 / 本节收尾 / 完成条件”从块状提示改为一行小字提示。
  - “学习材料与记录”仍是 `details[data-task-support]`，视觉降为轻链接式入口；截图、导入、收尾抽屉内容和 `data-summer-action` 保留。
  - “开始这节课 / 更多操作”保留，主按钮为 `.btn-primary`，更多操作为 `.btn-ghost` 语义。

### 首页右栏重排

- `modules/farm.js`：
  - 右栏顺序改为：动态专注 → 导入学习记录 → 成长卡 → home status 区 → AI 指南。
  - 导入框从独立 `.card` 降为 `.card-sub import-card home-import-card`，粘贴即导入监听保留。
  - 新“成长”卡合并原迷你农场和本周趋势：上半三块地，下半本周柱状图，中间 `--line` 分隔。
  - streak 横幅改为一行轻量条：图标 + 今日卡片/专注分钟/连续天数 + 报告或去导入按钮。

### 移动端修缮

- `style.css`：
  - `@media (max-width: 980px)` 下 `.home-flow` 增加 `padding-bottom: 112px`。
  - 390px 宽度下任务按钮组改为同一行，避免“更多操作”落到固定能量胶囊下方。
  - 队列项卡壳、步骤提示块、材料抽屉壳、截图/导入/收尾外壳均降为分隔线和留白分层。

## 2. 嵌套层数对比

Phase 1 视觉层级：

- 首页主卡 `.summer-task-card`
- hero 统计卡 `.summer-hero-stat`
- 米黄提示块 `.summer-today-summary`
- 队列项白底卡 `.summer-task`
- 步骤提示块 `.summer-step-panel`
- 材料抽屉卡 `.summer-task-support`
- 抽屉内截图/导入/收尾卡 `.summer-example-box` / `.summer-import-dock` / `.summer-task-reflection-card`

最深处约 5 层视觉面。

Phase 2 后：

- 首页主卡 `.summer-task-card` 保留为唯一主舞台。
- hero 统计为内联文字。
- 队列项为分隔线列表行。
- 步骤为 `.chip` 行内控件。
- 当前步骤说明为一行小字提示。
- 材料抽屉为轻链接入口，展开后只保留真实工具控件和分隔线。

常态任务队列约 1 层主面 + 1 层功能控件，不再有通用“卡中卡”。

## 3. 农场地块调色

- 保留铁律：`.mini-crop-sprite` 仍使用 `mix-blend-mode: screen`，精灵 style 仍含 `image-rendering: pixelated` / `image-rendering: crisp-edges`。
- 地块底色从原深棕改为暖土色渐变：`#bda37a → #7a573a → #56371f`。
- 截图复核：`01-home-desktop-top.png` 中数学、物理、化学三块作物精灵均清晰可见，没有被浅底色洗掉。

## 4. 验证

- `node --check` 改动文件：通过。
- `node --check` 全部 JS/MJS：18 个文件，0 failures。
- 已生成截图 PNG 到 `docs/review-batch/screenshots/ui-phase-2/`，包括新增：
  - `19-home-scrolled-bottom-mobile.png`
- 已补 HTML 联系表 fallback：
  - `docs/review-batch/screenshots/ui-phase-2/_contact-sheet.html`
- 视觉自查：
  - `01-home-desktop-top.png`：右栏顺序正确，专注卡在最上方，成长卡合并农场和本周趋势。
  - `12-home-mobile.png`：任务队列呼吸感改善，按钮组不再被胶囊完全遮住。
  - `19-home-scrolled-bottom-mobile.png`：页底正文与 AI 指南不被能量胶囊和底部导航压住。

## 5. 遗留与风险

- 截图脚本第二次重跑时 PNG 全部生成成功，但最后 `_contact-sheet.jpg` 生成阶段被 Windows 进程错误 `0xc0000142` / 管道错误打断；当前目录缺少 JPG 联系表。已补 `_contact-sheet.html`，需要在命令宿主恢复后单独重跑联系表生成或整段 `capture-ui.mjs` 以补齐 JPG。
- 本阶段未改业务逻辑。事件绑定属性仍保留在对应元素上：科目 tab、步骤 chip、开始这节课、更多操作、截图、导入、收尾、路线入口。
