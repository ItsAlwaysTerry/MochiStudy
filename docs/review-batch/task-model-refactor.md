# #6 双任务模型对齐 + 收敛重叠状态（执行计划，需你在场时做）

> 这是较大重构，语法能过、浏览器里可能出问题，且没有自动化测试。**过夜没动代码，只出计划**。要在你能刷新浏览器验证时做。

## 问题一：两套任务模型 → 体验断崖

- **第 1-2 天**：手写的富 `TASKS`（`summerTasks.js` ~117 行起），每个含 `practiceItems`（小题、配图、讲解）。
- **第 3-28 天**：`routeVideoTask()` / `routeSheetTask()` 现场用 `ROUTE_VIDEO_LIBRARY` + `ROUTE_DAYS` 生成的壳，无 practiceItems。
- 学生前两天体验"有小题有讲解"，第三天突然变成"一堆视频链接 + 自己截图"——**落差正好在他刚建立一点习惯时出现**。

### 方案：向下对齐（不是向上）

把第 1-2 天也简化成和 3-28 天一致的"看视频 → 截图 → 测验 → 一句收尾"，**牺牲前两天的丰富度换全程一致**。一致性对这个用户比丰富度值钱。

具体：
- 保留 `TASKS` 的 day1-2 作为"路线里的具体视频"，但渲染走和 route video 一样的 `renderRouteVideos` 路径，不再走 `renderTask` / `renderTaskStepper` / `renderTaskStepPanel` 那套富 UI。
- `practiceItems` 可保留为"可选过关小题"（放在支持抽屉里，不强制），但主线动作统一成截图+测验+收尾。
- **可删的死/半死渲染**：`renderTask`、`renderTaskStepper`、`renderTaskStepPanel`、`renderDayGroup`、`renderTodayRoute` 等一大票只服务 day1-2 富 UI 的函数（确认无其他引用后删，能瘦不少行）。

## 问题二：6 个重叠指针状态 → bug 温床

`summer_task_state` 里同时有：
`pendingTaskId` / `pendingRouteTaskId` / `activeTaskId` / `activeRouteDay` / `pendingRouteDay` / `routeDetailDay`

它们互相牵制（见 `currentRouteDay` / `rollingTasks` / `attachImportedRecord` 里的大段分叉），直接表现为"队列跳错、下一步指错、导入归档到错节点"。

### 方案：收敛到 2 个状态

- `activeDay`（当前在做哪一天）
- `activeTaskId`（当前在做哪个任务/视频）
- 删掉 pending/route 的平行体系，"等待导入"改为从 `activeTaskId` 的 `info` 状态派生（有没有 `exampleQuizPromptCopiedAt` 且无 `linkedLogIds`），不再单独存指针。
- `routeDetailDay`（总览里看哪天）可保留，它是纯 UI、和进度无关，冲突小。

## 执行顺序（都要在场验证）

1. **先收敛状态**（问题二）：风险高，但把状态机理顺是后续一切的基础。每改一步在浏览器点一遍：开始→截图→测验→粘回→收尾→顺延。
2. **再对齐模型**（问题一）：删富 UI、统一渲染路径。
3. 这两步做完，`summerTasks.js` 能从 ~3800 行瘦到估计 2500 行以内。
4. 之后才好接 #9 多科（在干净状态机上加 subject 维度）。

## 验证清单（重构后逐条走）
- [ ] day1-2 和 day3-28 的任务卡长得一致、动作一致
- [ ] 开始一节 → 截图 → 复制测验包 → 粘回 MOCHI-RECORD → 归档到**正确**的节点
- [ ] 未完成任务留在队列前、完成后顺延
- [ ] 今日复盘跳过/保存都能解锁
- [ ] 奖励进度只随真实完成走
- [ ] 28 天总览各天状态正确、点某天不跳顶（已修，别回归）

## 风险
- 无自动化测试，只有 `node --check`。每一步都必须人肉过浏览器。
- 涉及 `attachImportedRecord`（app.js 导入回调也调它），改状态字段时要同步 app.js `parsePastedRecordEl` 那条线。
