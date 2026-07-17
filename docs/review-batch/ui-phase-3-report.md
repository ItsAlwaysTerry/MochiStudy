# UI Phase 3 Report

执行日期：2026-07-17

范围：按 `docs/ui-redesign-plan.md` Phase 3 改造学习页三 tab（今日学习 / 复习队列 / 学习档案）。本阶段只调整 DOM 结构 class 与 CSS 视觉层级；未改复习引擎逻辑、卡片数据结构、`study_log` 字段、导入解析或原有 `data-*` 事件绑定语义。

## 1. 实现内容

### 三层入口形状分离

- `app.js`：`renderLearn()` 顶层学习 tab 改为 `.seg` 分段控制器，三个按钮保留 `data-action="learn-tab"` / `data-tab`，图标保留。
- `modules/knowledgeMap.js`：档案科目切换改为小号 `.seg`，保留 `data-card-subject`，数量徽章从括号文本改为 `seg-count`。
- `modules/reviewPage.js` 与 `modules/knowledgeMap.js`：动作入口统一为 `.btn-ghost.btn-sm`，保留啃卷子、出测验、从零重学、导出档案等全部入口。

### 复习队列

- `renderReviewRow()` 改成两行结构：第一行是知识点名、科目 chip、今日 chip 和开始按钮；第二行是复习原因。
- 「开始」按钮改为 `.btn-tonal.btn-sm`，不再视觉上吃掉整行。
- `.review-row-reason` 去掉 `white-space: nowrap`、`overflow: hidden` 和 `text-overflow: ellipsis`，允许原因全文换行。
- 「今日」保留绿色左边框，并改为 `.chip review-today-badge`。

### 学习档案

- 核心摘要 `.digest-grid` 从多列自适应压缩改为桌面双列两行、窄屏单列。
- 「测这个知识点」改为摘要右下角常规宽度 `.btn-tonal.btn-sm`，不再是整宽深色巨钮。
- 学习卡片 article 加入 `.card-sub` 语义，CSS 去掉独立阴影；展开详情 `.card-detail` 只用 `--line` 分隔主体和详情。
- 多选测验、星级、删除、来源 pill、展开详情按钮和所有 `data-card-action` 均保留。

### 今日学习

- 顶部统计行维持四格紧凑布局，数字值使用 `--fs-num`，标签保持 `--fs-xs`。
- 日期切换器左右箭头和“回到今天”改为 `.btn-ghost.btn-sm`；日期下拉放入 `.field today-date-field`。
- 页面区块间距统一收紧到 `--sp-5` 节奏，空状态居中展示图标和文案。
- 专注轮、承诺徽章和学生反思引用块未改数据和文案，只做 token 对齐。

## 2. 移动端复习原因对比

Phase 2：移动端复习行的原因在 `.review-row-reason` 上使用 `white-space: nowrap` + `text-overflow: ellipsis`，较长原因只显示开头，学生看不到为什么该知识点今天优先复习。

Phase 3：原因单独占第二行，`grid-column: 1 / -1`，允许自然换行。按钮固定在第一行右侧，知识点名和今日徽章仍在第一行，决策依据不会再被截断。

## 3. 验证

- `node --check app.js`：通过。
- `node --check modules/reviewPage.js`：通过。
- `node --check modules/knowledgeMap.js`：通过。
- `node --check modules/todayStudy.js`：通过。
- `node --check modules/ai.js` / `timer.js` / `summerTasks.js` / `farm.js` / `pet.js` / `reviewEngine.js`：通过。
- `node --check docs/review-batch/screenshots/capture-ui.mjs`：通过。

## 4. 截图产物

目标目录：`docs/review-batch/screenshots/ui-phase-3/`

已生成：

- 当前 `capture-ui.mjs` 完整标准集：24 张 PNG。
- `_contact-sheet.jpg` 联系表。
- 档案页 `03-learn-archive-expanded-desktop.png` 已展开知识点，并展开第一张卡片详情（显示今日套路和原题）。

## 5. 自查问题清单

已完成：

- `02-learn-review-desktop.png`：三 tab 为浅槽分段控制器；复习行原因完整显示，开始按钮为行内小按钮；啃卷子/出测验入口仍在。
- `03-learn-archive-expanded-desktop.png`：顶层 tab、科目 seg、动作按钮三层形状分离；从零重学、啃卷子、出测验、导出档案、测这个知识点、多选按钮均可见；卡片详情与主体之间只有分隔线。
- `04-learn-today-desktop.png`：统计行四格紧凑显示；日期切换器按钮和下拉框未挤压；区块间距正常。
- `13-learn-review-mobile.png`：移动端复习原因全文换行，开始按钮保持在第一行右侧，底部导航未遮住主要按钮。
- `_contact-sheet.jpg`：全局未见明显截断、破碎换行或按钮丢失。

遗留风险：

- 当前截图脚本输出 24 张 PNG，而任务文案写“14 个标准角度”；本次按仓库现有 `capture-ui.mjs` 的完整标准集执行，没有删减脚本角度。
