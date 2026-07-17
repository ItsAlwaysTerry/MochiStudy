# UI Phase 5 Report

## 实现记录

- 专注沉浸态：提升 `.focus-overlay-actions .btn-ghost` 在暗背景上的白描边和半透明底；`.focus-import-area` 改为半透明卡底；deciding 阶段 `.focus-commitment-reflect` 改为纵向按钮组，按钮固定宽度且不换行。
- 承诺/反思层级：承诺弹窗标题改用 `--fs-lg`，正文说明改用 `--fs-md`；deciding 反思 textarea 按暗色 `.field` 思路统一 padding、圆角、边框和字号。
- 抽奖桥接：`.lottery-overlay` 底色改为基于 `#2d1420` 的深梅渐变；抽奖金色统一到 `--gold` / `--gold-rgb`；主按钮、卡片、骰子、运气槽、结果层圆角改用 `--r-md` / `--r-lg` / `--r-full`。
- 暑假能量浮窗：只对 `.summer-reward-*` 骰盘/按钮/格子做色值与圆角 token 对齐，未改奖励计算、骰子动画、音效或状态字段。
- 复习原因标点：`modules/reviewEngine.js` 的 `buildPrimaryReason()` 在拼接前 strip 卡点末尾 `。/．/.`，保留外层引号和句号。
- 首页导入反馈：冒烟发现首页导入成功卡会被同次首页重渲染立即覆盖；已仅在当前路由为首页时跳过导入后的全页重渲染，数据写入、勋章、农场计数和解析逻辑不变。
- 缓存版本：`index.html` 资源后缀和 `app.js` `BUILD_ID` 从 `20260716t` 更新到 `20260716u`。

## 移动端修复清单

- 390px / 640px / 980px：CDP 扫描首页、学习三 tab、勋章、设置、承诺弹窗、沉浸态、抽奖；结果均无横向溢出，扫描范围内小于 40px 的可见交互目标为 0。
- 学习页 tab、今日页日期切换、设置锚点、复习/档案小按钮、暑假任务区小按钮和抽奖关闭按钮补足 `min-height: 40px` 或等效点击面积。
- 移动端收起态暑假能量浮窗缩为图标胶囊，并移到顶栏右侧空位；展开态骰盘保持完整，避免遮挡首页任务卡按钮和底部导航。
- 最新截图自查：`12-home-mobile.png` / `19-home-scrolled-bottom-mobile.png` 中卡片左右边距一致，底部导航无遮挡正文操作。

## 删除的 CSS 规则

- `.schedule-grid`：设置页 Phase 4 已改为 `settings-groups`，全局搜索仅剩 CSS 自引用。
- `.home-grid` / `.home-right`：旧首页布局残留，全局搜索无 HTML/JS 引用；当前首页使用 `.home-flow` / `.home-right-stack`。

## 保留存疑清单

- `.lottery-sidebar*` / `.muyu-*`：当前抽奖 DOM 未渲染木鱼，但 `app.js` 仍保留 `tapMuyuFloat()` / `initMuyuFloat()` 旧函数，保守不删。
- `.summer-pending-import-float` / `.summer-task.pending-import`：仍由 `modules/summerTasks.js` 渲染和切换，保留。
- `.admin-calendar-*`：管理后台学年日历仍引用，保留。
- 动态拼接类名前缀：`phase-*`、reward tone、subject/status 类、`level-*` 等不按静态未命中删除。
- 抽奖骰子点数、牌背符号、计时数字等图形化字号：保留专用 px 尺寸，不强行套正文 token。
- 旧业务区仍有若干历史硬编码色值/尺寸，涉及管理后台、复杂暑假任务布局和图形化控件；本轮只替换 Phase 5 范围内能安全 token 化的焦点/抽奖/能量浮窗相关项。

## 一致性 Sweep

- z-index 清册已核对并更新：抽奖 overlay 700、抽奖特效 710、管理后台 900、后台认证 920，其余既有层级保留。
- 抽奖主流程涉及的深色背景、金色、卡片/按钮圆角和文本阶级已对齐 token；玩法流程、动画、音效、near-miss、保底和权重未改。
- 能量浮窗展开态骰盘仅做颜色/圆角/点击面积对齐；骰子点数和格子逻辑未改。

## 冒烟结果

- 通过。CDP 实际点击路径：首页 → 开始专注（25 分，填目标）→ 沉浸态 → 结束这一轮 → 填反思 → 选结果 → 学习页三 tab → 勋章页 → 抽奖完整走到结果 → 设置页展开阅读外观/AI → 首页导入合法 MOCHI-RECORD 并看到成功卡。
- 抽奖测试使用已有券状态，实际走过摇骰、翻牌、结果页；未改抽奖数据结构和权重。

## Console Error 记录

- CDP 冒烟：无 console error / runtime exception。
- 截图脚本：无脚本错误，成功生成联系表。

## 截图自查

- 已生成：`docs/review-batch/screenshots/ui-phase-5/`，含 `_contact-sheet.jpg`。
- `08-focus-overlay-running-desktop.png`：放弃按钮暗背景下可辨，导入入口有半透明卡底。
- `09-focus-deciding-desktop.png`：结果按钮纵向等宽，反思 textarea 层级清楚。
- `11-lottery-overlay-desktop.png`：深梅底色和统一金色生效，流程入口未变。
- 移动端截图：`12-home-mobile.png`、`13-learn-review-mobile.png`、`14-achievements-mobile.png`、`18-mobile-nav-active.png`、`19-home-scrolled-bottom-mobile.png` 未见横向溢出或明显文本截断。
