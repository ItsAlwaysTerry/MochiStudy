# #9 多科计划架构：物理 → 数/物/化 可切换（设计方案，等你拍板）

> 现在只有物理（`modules/summerTasks.js`，`window.MochiSummerTasks`）。学生升高三要一轮复习全科。这份是把"暑假物理"泛化成按科目切换的设计，先给你看方案，认可后再落地。

## 目标与约束

- 首页**只有一张**"学习计划卡"，顶部科目 Tab（数学 / 物理 / 化学）切换，视觉同级。切 Tab 不让首页变三倍长。
- 现在只有物理有内容；数学/化学 Tab 先显示"计划准备中"，不是半成品占位。
- **不改 `study_log` 字段、不改备份结构、不推翻农场/档案。**
- 命名从"暑假物理"泛化为"一轮复习计划"（学生本来就是全科一轮）。

## 心智模型

```
学习计划卡
 ├─ [数学] [物理•] [化学]   ← 科目 Tab
 └─ 当前科目的滚动任务队列（和现在物理一模一样的逻辑）
```

数据上，物理现有的 `TASKS` / `ROUTE_DAYS` / `ROUTE_VIDEO_LIBRARY` 是"物理这一科的内容包"。多科 = 三个内容包 + 一个 subject 维度。

## 数据结构（关键：不动 study_log）

**localStorage `summer_task_state` → 泛化为按科目分桶**（建议新 key 或平滑迁移）：

方案一（推荐，平滑）：保留 `summer_task_state` 作为物理桶，新增 `plan_state_math` / `plan_state_chemistry`，或统一成：
```js
// 新 key: plan_state（或复用 summer_task_state 升级）
{
  activeSubject: "physics",        // 当前 Tab
  subjects: {
    physics:   { pendingTaskId, activeRouteDay, tasks:{}, routeDays:{}, examples:{}, reward:{} },
    math:      { ...同结构... },
    chemistry: { ...同结构... },
  }
}
```
- **迁移**：首次读取时，若发现旧 `summer_task_state`，整体搬进 `subjects.physics`，写回新结构，删旧 key。一次性、幂等。
- 例题图片 IndexedDB（`mochi_summer_examples`）：store 里的 key 已按 taskId，taskId 本身带科目前缀即可隔离，不用改 DB。

## 内容包结构（每科一份）

把物理现在硬编码在 `summerTasks.js` 顶部的三张表抽成"内容包"：
```js
const PLAN_CONTENT = {
  physics:   { TASKS, ROUTE_DAYS, ROUTE_VIDEO_LIBRARY, ONE_ROUND_BVS, ... },
  math:      null,   // 未做 → Tab 显示"计划准备中"
  chemistry: null,
};
```
- 物理内容原样搬进 `PLAN_CONTENT.physics`，逻辑函数（render/rollingQueue/routeDayCompleted…）全部改成"读当前 subject 的内容包 + 当前 subject 的 state 桶"。
- 数学/化学内容包等你有资源了再填（和物理同格式：视频库 + 28 天路线）。

## UI

1. **首页计划卡顶部加科目 Tab**（复用 `.learn-tab-bar` 那种轻量 tab 样式）。
   - 有内容的科目正常显示队列；无内容的显示一张"计划准备中，先用物理"占位卡（不是灰死按钮）。
2. **抽屉里的 "28 天总路线" 摘要**变成"各科进度"：物理 12/28、数学 —、化学 —，一眼看三科。
3. 专注/导入/例题/收尾流程**每科独立**，互不干扰。

## 落地分期（建议）

- **P1 架构**：抽 subject 维度 + state 分桶 + 旧数据迁移 + 内容包结构（物理照旧跑通，纯重构，行为不变）。**这步最大，要你在场，能浏览器验证。**
- **P2 UI**：科目 Tab + 占位卡 + 各科进度摘要。
- **P3 内容**：数学/化学的视频库 + 28 天路线（靠你/资源，不是纯编码）。

## 风险

- 这是 #6（双任务模型对齐 + 收敛状态）的**上层**——建议**先做 #6 把物理这科的状态机理顺，再做 #9 分科**，否则在混乱状态机上加 subject 维度会更乱。见 `task-model-refactor.md`。
- 迁移旧 `summer_task_state` 必须幂等、可回退，别丢学生已有进度。

## 待你拍板
1. 认可"单卡 + 科目 Tab"这个形态吗？还是你想要别的（比如三张独立卡 / 三个入口）？

   1. 认可

2. 落地顺序：同意"先 #6 再 #9"吗？

   1. 同意

3. 数学/化学的内容包你打算什么时候给资源（决定 P3 时机）。

   ​	我贴的资源帖子，都不是说学生必须全部学习，我只是在一个推荐学习资源的小红书博主筛选相关的帖子给你，你可以根据知识量和覆盖程度以及符合学生难度安排

   1. 数学（学生平时有六七十分）：
      1. https://www.xiaohongshu.com/explore/69611fba000000000a030867?xsec_token=ABNPz-8xG0w6J6tLApjzANcSS8GkX4Z7jUza1flinmEjE=&xsec_source=pc_user
      2. https://www.xiaohongshu.com/explore/69789e96000000000c03621f?xsec_token=AB0LuwzTltpwm7rKvwrpOr67NV7PE9PS6lwLYipvCeIZM=&xsec_source=pc_user
      3. https://www.xiaohongshu.com/explore/69758a35000000000a03f5a8?xsec_token=ABOe8Yo9sT6_dcDRmLx66yy6Kek5sDwWq0DyY1GLDzM80=&xsec_source=pc_user
      4. https://www.xiaohongshu.com/explore/6974bc2b000000000903858b?xsec_token=ABppKTzojWGjE1XWmujzSXfYf4fVQ6CxzVoKq5RdYxGt0=&xsec_source=pc_user
   2. 化学（学生只有二十多分，感觉在化学这一科，这个博主有没有很体系的一些方法？他给过一些帖子，就是说要构建体系啊，就是化学这一科比较散。然后呢，他感觉感觉他也没有像数学还有物理这两科一样啊，说针对几十分以下会怎么做啊？嗯，怎么构建知识体系啊，不同分段或怎么学啊，他这些都没有，他的教程都比较零碎）
      1. https://www.xiaohongshu.com/explore/697d8037000000000b00b97b?xsec_token=ABQOObZyWxYO9PPo6buzCA8eAAkyGiuq4mDsrHvSmaxFU=&xsec_source=pc_user
      2. https://www.xiaohongshu.com/explore/69bfe33400000000230258b6?xsec_token=ABP6uSz7QVFUTBqgHYaSXs2cCVe976wx8KVflR-yON8o0=&xsec_source=pc_user
      3. https://www.xiaohongshu.com/explore/6a450f54000000002201bbe7?xsec_token=ABKTNtlkWeWNovpGHcF08rLud7A-7lhYz7vbNsLnhFTIs=&xsec_source=pc_user
