# V3.2 执行文档 — 导航革命 + 首页闭环 + 档案瘦身

**目标**：V3.1 重排了首页布局，V3.2 继续推进：把首页的「复制材料」闭合成不需要跳页的完整操作环；把两个低频独立 tab（复习/档案）合并为一个；把档案页删掉从未用到的整理模式和来源筛选。同时填上两个死区：无赛季的赛季页、无复习建议时的首页复习卡。

---

## 起飞前检查

**V3.0/V3.1 已解决，不再重审**（完整列表见 self-iteration.md）：
- 首页单列布局，导入框在最前 ✅
- 复习页扁平化单列表 ✅
- 抽奖导航徽章 ✅
- 主动回忆 details/summary 翻转 ✅
- 日历从侧边栏移除 ✅

---

## 五角色分析结论（本轮）

**诺曼（UX）**：
🔴 点击首页复习卡「复制材料」后，页面跳转到复习页，用户失去首页上下文。操作完成后要再导航回首页。对基础薄弱的学生，每次额外跳转都是潜在放弃点。
🟡 底部导航 5 个 tab（首页/复习/档案/勋章/设置）中，复习和档案是同一数据的两种视角，占了 2/5 的导航空间。用户很少单独访问两者——他们要么「要复习」（review），要么「看看学了什么」（archive），语义上属于「学习」这一父级。

**奥克利（学习科学）**：
🟡 首页「今日无复习」卡显示鼓励语后就结束了，没有给出下一步的时间线。用户不知道「我什么时候需要来复习」，容易忘记回来。

**拉姆斯（减法）**：
🔴 `knowledgeMap.js` 的「整理」按钮开启拖拽排序模式（STATE.organizing）、来源筛选器（SOURCE_FILTERS：全部/新学/复习），以及在整理模式下才出现的「编辑摘要」按钮。这三个功能几乎不被使用（基础差的学生不会主动拖拽排序或筛选来源），却增加了大量状态管理和事件处理代码。
🟡 赛季页（无赛季状态）只显示「请联系管理员」——是一个完全的死路，没有任何实质内容。用户如果导航到这里，什么都做不了。

**福勒（代码质量）**：
🟡 `knowledgeMap.js` 的 STATE 有 11 个字段，其中 `organizing`、`draggingCardId`、`sourceFilter`、`editingSummaryKey` 四个字段服务于三个将要删除的功能，且相关代码（drag handlers、filter 渲染、inline edit 渲染）散布在整个文件里。
🟡 `window.MochiCards.refresh()` 在 `importReviewResult` 里被调用，但调用后 `STATE.container` 可能是已经从 DOM 移除的旧元素（tab 切换后 container 重新创建）。需要加 `document.contains` 守卫。

---

## 芒格裁决

| 改动 | 用户感知 | 实现风险 | 代码范围 | 总分 |
|---|---|---|---|---|
| 改动1：首页复习卡内联导入（不跳页） | 3 | 2 | 2 | **7** |
| 改动2：复习+档案合并为「学习」tab | 3 | 2 | 1 | **6** |
| 改动3：档案页删整理模式+来源筛选 | 2 | 2 | 3 | **7** |
| 改动4：赛季页无赛季→显示累计统计 | 2 | 3 | 3 | **8** |
| 改动5：首页无复习→显示下一到期时间 | 2 | 3 | 3 | **8** |

**执行顺序（风险从低到高）**：改动5 → 改动4 → 改动3 → 改动1 → 改动2

---

## 执行列表

---

### 改动 5（先执行）：首页「今日无复习」→ 显示下一到期时间

**文件**：`modules/farm.js`  
**函数**：`renderTodayReviewCard()`  
**风险**：单函数改动，无副作用。

**问题**：当 `todaySuggestions` 为空时，显示鼓励语后就结束，是一个死路。用户不知道「什么时候需要回来」。

**定位**：找到 `renderTodayReviewCard()` 里 `!item` 分支里的这段（约第 249–265 行）：

```javascript
    if (!item) {
      const hasAnyReview = (reviewState?.items || []).some((i) => i.reviewCount > 0);
      const calmText = hasAnyReview
        ? "近期复习过的知识点都在巩固中，今天可以专心做新题。"
        : "还没有复习过任何知识点，先从学习档案里找一个开始。";
      return `
        <section class="card home-review-card calm">
          <div class="home-review-head">
            <span class="material-symbols-outlined">rate_review</span>
            <div>
              <h3>今日复习</h3>
              <p>${calmText}</p>
            </div>
          </div>
          <button class="btn btn-soft btn-sm" data-route="review" type="button">看复习页</button>
        </section>
      `;
    }
```

**替换为**：

```javascript
    if (!item) {
      const hasAnyReview = (reviewState?.items || []).some((i) => i.reviewCount > 0);
      const calmText = hasAnyReview
        ? "近期复习过的知识点都在巩固中，今天可以专心做新题。"
        : "还没有复习过任何知识点，先从学习档案里找一个开始。";
      const today = new Date().toISOString().slice(0, 10);
      const nextDue = (reviewState?.items || [])
        .filter((i) => i.nextReviewDate && i.nextReviewDate > today)
        .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate))[0];
      let nextDueHint = "";
      if (nextDue) {
        const diff = Math.ceil((new Date(nextDue.nextReviewDate + "T12:00:00") - new Date()) / 86400000);
        const diffLabel = diff === 1 ? "明天" : `${diff} 天后`;
        nextDueHint = `<p class="home-review-next-due">下一个到期：${escapeAttr(nextDue.nodeLabel)} · ${diffLabel}</p>`;
      }
      return `
        <section class="card home-review-card calm">
          <div class="home-review-head">
            <span class="material-symbols-outlined">rate_review</span>
            <div>
              <h3>今日复习</h3>
              <p>${calmText}</p>
            </div>
          </div>
          ${nextDueHint}
          <button class="btn btn-soft btn-sm" data-route="review" type="button">看复习页</button>
        </section>
      `;
    }
```

**CSS 新增**（`style.css`，追加到 `.home-review-card` 相关样式附近）：

```css
.home-review-next-due {
  font-size: 12px;
  color: var(--text-muted);
  margin: 4px 0 8px;
  padding: 4px 10px;
  border-left: 2px solid var(--border);
  line-height: 1.5;
}
```

**验证**：
1. `node --check modules/farm.js` → 无报错
2. 浏览器在「今日无复习建议」状态下（有历史记录但近期都复习过）
3. 首页复习卡显示「下一个到期：[节点名] · N 天后」
4. 无历史记录时不显示 nextDueHint（因为 items 为空）
5. 有复习建议时不影响（走另一个 return 分支）

---

### 改动 4（第二执行）：赛季页无赛季状态 → 显示累计统计

**文件**：`app.js`  
**函数**：`renderNoSeason()`  
**风险**：单函数改动，读取现有 localStorage 数据，不写入。

**问题**：当前 `renderNoSeason()` 只显示「请联系管理员」，是死路。对于未开启赛季的用户，这个 tab 完全无用。

**定位**：找到整个 `renderNoSeason()` 函数（约第 1016 行）：

```javascript
  function renderNoSeason() {
    return `
      <section class="card season-empty">
        <span class="material-symbols-outlined">emoji_events</span>
        <div>
          <h3>还没有开启赛季</h3>
          <p class="muted">管理员可以在设置页开启一个有开始和结束日期的学习周期。开启后，这里会显示倒计时、学习摘要、称号、热力图和趋势图。</p>
        </div>
        <p class="muted" style="font-size:13px;margin-top:8px">
          请联系管理员开启赛季（访问 ?admin=1）
        </p>
      </section>
    `;
  }
```

**替换为**：

```javascript
  function renderNoSeason() {
    const logs = readStudyLogs();
    const focusLogs = readFocusLogs();
    const totalRecords = logs.length;
    const studyDays = new Set(logs.map((l) => String(l.date || "").slice(0, 10)).filter(Boolean)).size;
    const focusMinutes = focusLogs.reduce((sum, l) => sum + Number(l.duration || 0), 0);
    const focusHours = Math.floor(focusMinutes / 60);
    const subjectLabels = { math: "数学", physics: "物理", chemistry: "化学" };
    const subjectCounts = { math: 0, physics: 0, chemistry: 0 };
    logs.forEach((l) => { if (l.subject in subjectCounts) subjectCounts[l.subject] += 1; });
    const hasData = totalRecords > 0;
    return `
      <section class="card season-empty">
        <div class="season-empty-head">
          <span class="material-symbols-outlined">emoji_events</span>
          <div>
            <h3>还没有开启赛季</h3>
            <p class="muted">赛季期间可以看倒计时、称号和热力图。赛季管理在<a href="?admin=1" style="color:var(--primary);margin-left:4px">管理后台</a>。</p>
          </div>
        </div>
        ${hasData ? `
        <div class="season-empty-stats">
          <div class="stat-mini">
            <span class="stat-mini-num">${totalRecords}</span>
            <span class="stat-mini-label">累计记录</span>
          </div>
          <div class="stat-mini">
            <span class="stat-mini-num">${studyDays}</span>
            <span class="stat-mini-label">学习天数</span>
          </div>
          <div class="stat-mini">
            <span class="stat-mini-num">${focusHours}</span>
            <span class="stat-mini-label">专注小时</span>
          </div>
          ${Object.entries(subjectCounts).map(([subj, count]) => `
          <div class="stat-mini">
            <span class="stat-mini-num">${count}</span>
            <span class="stat-mini-label">${subjectLabels[subj]}</span>
          </div>
          `).join("")}
        </div>
        ` : `<p class="muted" style="margin-top:16px">还没有任何学习记录，先去首页导入第一条吧。</p>`}
      </section>
    `;
  }
```

> ⚠️ 确认 `readFocusLogs()` 在 app.js 中已定义（grep `function readFocusLogs`）。如果不存在，改用 `readJson("focus_log", [])` 替代。

**CSS 新增**（`style.css`，追加到 `.season-empty` 相关样式附近，或文件末尾）：

```css
.season-empty-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.season-empty-stats {
  display: flex;
  gap: 0;
  flex-wrap: wrap;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.stat-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 64px;
  padding: 8px 4px;
}
.stat-mini-num {
  font-size: 26px;
  font-weight: 800;
  color: var(--text);
  line-height: 1.1;
}
.stat-mini-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 3px;
}
```

**验证**：
1. `node --check app.js` → 无报错
2. 浏览器打开赛季页（无赛季状态，即 `current_season` 为空）
3. 看到：「还没有开启赛季」+ 管理后台链接 + 累计记录/学习天数/专注小时/三科 4 列数字
4. 完全无记录时显示「还没有任何学习记录」
5. 有赛季时走 `renderCurrentSeason(current)` 分支，不受影响

---

### 改动 3（第三执行）：学习档案删整理模式 + 删来源筛选

**文件**：`modules/knowledgeMap.js`  
**删除代码量约 120–150 行，全部在一个文件内**

**问题**：档案页有「整理」按钮（开启拖拽重排序模式）、来源筛选器（全部/新学/复习），以及整理模式下的内联编辑摘要按钮。这三个功能对目标用户几乎无用，却贡献了大量状态管理代码。

#### 步骤 A：精简 STATE 对象

找到 STATE 定义（约第 1–14 行）：

```javascript
  const STATE = {
    activeSubject: "math",
    sourceFilter: "all",
    exportSubject: "all",
    expandedNode: "",
    highlightNodeId: "",
    editingSummaryKey: "",
    organizing: false,
    historyExpanded: false,
    expandedCards: new Map(),
    draggingCardId: "",
    container: null,
  };
```

替换为（删除 `sourceFilter`、`editingSummaryKey`、`organizing`、`draggingCardId`）：

```javascript
  const STATE = {
    activeSubject: "math",
    exportSubject: "all",
    expandedNode: "",
    highlightNodeId: "",
    historyExpanded: false,
    expandedCards: new Map(),
    container: null,
  };
```

#### 步骤 B：删除 `SOURCE_FILTERS` 常量

找到并整行删除（约第 18–22 行）：
```javascript
  const SOURCE_FILTERS = [
    ["all", "全部"],
    ["lesson", "新学"],
    ["reviewGroup", "复习"],
  ];
```

#### 步骤 C：修改 `filterEntriesBySource()` 为直通函数

找到整个 `filterEntriesBySource()` 函数（约第 311–316 行）：
```javascript
  function filterEntriesBySource(entries, sourceFilter = STATE.sourceFilter) {
    if (!sourceFilter || sourceFilter === "all") return entries;
    if (sourceFilter === "reviewGroup") {
      ...
    }
    return entries.filter(...);
  }
```

替换为（直接返回，不过滤）：
```javascript
  function filterEntriesBySource(entries) {
    return entries;
  }
```

> 注：保留函数签名而非删除，因为它可能被多处调用，避免引发调用错误。

#### 步骤 D：修改 `nodeSummary()` 函数签名，删除 sourceFilter 参数

找到（约第 255 行）：
```javascript
  function nodeSummary(logs, subject, node, sourceFilter = STATE.sourceFilter, reviewState = null) {
```

替换为：
```javascript
  function nodeSummary(logs, subject, node, reviewState = null) {
```

找到该函数内所有对 `filterEntriesBySource(entries, sourceFilter)` 的调用（约第 258–259 行），把第二个参数 `sourceFilter` 删掉（保留单参数调用）：
```javascript
// Before:
const entries = filterEntriesBySource(allEntries, sourceFilter);
const visibleDateEntries = filterEntriesBySource(dateEntries, sourceFilter);
// After:
const entries = filterEntriesBySource(allEntries);
const visibleDateEntries = filterEntriesBySource(dateEntries);
```

找到 `nodeSummary` 的调用处（约第 345 行）：
```javascript
.map((node) => nodeSummary(logs, subjectKey, node, STATE.sourceFilter, reviewState))
```
替换为：
```javascript
.map((node) => nodeSummary(logs, subjectKey, node, reviewState))
```

找到第 352 行（sourceFilter 的过滤逻辑）：
```javascript
if (STATE.sourceFilter !== "all") summaries = summaries.filter((summary) => summary.count > 0);
```
**整行删除**。

#### 步骤 E：删除渲染函数里的「整理」按钮和来源筛选器

在 `render()` 或主渲染函数里，找到以下代码并删除：

**1. 整理按钮**（约第 362–364 行）：
```javascript
          <button class="btn ${STATE.organizing ? "btn-primary" : "btn-soft"} btn-sm" data-card-organize type="button" ...>
            <span class="material-symbols-outlined">...</span>${STATE.organizing ? "完成整理" : "整理"}
          </button>
```
整段删除。

**2. 来源筛选器**（约第 403–410 行）——找到 `SOURCE_FILTERS.map(...)` 整段，包括外层 div，一并删除：
```javascript
        ${SOURCE_FILTERS.map(([value, label]) => {
          const active = STATE.sourceFilter === value ? "active" : "";
          ...
        }).join("")}
```
以及包裹它的 `<div class="...">` 行（如果是独立 div）。

**3. 整理模式下才显示的区块**（约第 378 行）：
```javascript
      ${STATE.organizing ? `
        ...（整理模式专用 UI）
      ` : ""}
```
整段删除（包括条件判断和内容）。

**4. filterLabel 相关**（约第 423 行）：
```javascript
      const filterLabel = sourceInfo(STATE.sourceFilter).label;
```
**整行删除**。同时找到 `filterLabel` 被使用的地方（通常是显示「当前筛选：XX」的文字），一并删除。

**5. 整理模式下的编辑摘要按钮**（约第 479 行）：
```javascript
${editing || !STATE.organizing ? "" : `<button class="card-action-btn" data-summary-action="edit" ...>...</button>`}
```
替换为空字符串（直接删掉这行或改为 `${""}`）。

**6. 拖拽排序手柄按钮**（约第 570–572 行）：
```javascript
              <button class="card-action-btn card-drag-handle" data-card-action="drag-handle" draggable="true" ...>
                <span class="material-symbols-outlined">drag_indicator</span>
              </button>
```
整段删除。

**7. `showOrganizeActions` 相关**（约第 552 行）：
```javascript
      const showOrganizeActions = STATE.organizing;
```
以及后续所有 `showOrganizeActions` 的条件判断（删除判断，保留非整理时的显示内容）。

#### 步骤 F：清理 `bindContainer()` 里的事件处理

在 `bindContainer()` 函数里，找到并删除以下 action 处理：

**1. `data-card-organize` 点击处理**（约第 864–866 行）：
```javascript
        STATE.organizing = !STATE.organizing;
        if (!STATE.organizing) STATE.editingSummaryKey = "";
        ...
```
找到触发条件（`el.matches("[data-card-organize]")` 或类似），连同分支整段删除。

**2. `card-source-filter` 点击处理**（约第 885 行）：
```javascript
        STATE.sourceFilter = sourceButton.dataset.cardSource || "all";
```
找到整个 source filter 点击分支，删除。

**3. `summary-action = "edit"` 点击处理**（约第 675–700 行）：
找到所有 `editingSummaryKey` 赋值，连同分支删除。

**4. `drag-handle` action 处理**（约第 908–920 行）：
```javascript
        if (action === "drag-handle") {
          ...
        }
```
整段删除。

**5. Drag event listeners**（约第 940–971 行，四个事件监听）：
```javascript
    container.addEventListener("dragstart", (event) => { ... });
    container.addEventListener("dragover", (event) => { ... });
    container.addEventListener("drop", (event) => { ... });
    container.addEventListener("dragend", () => { ... });
```
四段全部删除。

#### 步骤 G：删除 `reorderCards()` 函数

grep 找到 `function reorderCards`，整个函数体删除（它处理拖拽后的卡片顺序写入逻辑）。

#### 步骤 H：删除 `sourceInfo()` 函数（如存在且仅服务于 source filter）

grep 找到 `function sourceInfo`，确认它只用于 filter label 显示，删除整个函数。

#### 步骤 I：加 `document.contains` 守卫到 `refresh()` 函数

找到 knowledgeMap.js 里的 `refresh()` 函数或等价的更新函数，添加守卫：

```javascript
  function refresh() {
    if (!STATE.container || !document.contains(STATE.container)) return;
    render(STATE.container);
  }
```

这防止在 tab 切换后（container 被重建）刷新写入已分离的 DOM 元素。

**验证**：
1. `node --check modules/knowledgeMap.js` → 无报错
2. 浏览器打开学习档案页
3. 没有「整理」按钮，没有「全部/新学/复习」筛选 bar
4. 卡片正常展示（正面/套路/原题三面翻转）
5. 知识点展开/收起正常
6. 导出档案功能正常
7. 在复习页完成导入后，档案 refresh 不会报错（container.contains 守卫生效）

---

### 改动 1（第四执行）：首页复习卡 → 内联导入（不跳页）

**文件**：`modules/reviewPage.js` + `modules/farm.js`

**问题**：点击首页复习卡「复制材料」→ 跳转到复习页 → 展开导入面板 → 粘贴。用户离开首页后失去上下文（streak、农场、导入框）。改为：复制材料 + 原地展开 textarea 导入，全程在首页完成。

#### 步骤 A：在 `reviewPage.js` 新增两个导出函数

在 `window.MochiReviewPage = { render, startItem }` **之前**，新增两个函数：

```javascript
  async function copyItemPack(key) {
    const item = findItem(key);
    if (!item) return false;
    const pack = window.MochiReviewEngine.generateNodeReviewPack(item);
    return copyToClipboard(pack);
  }

  function importItemByKey(key, text, callbacks) {
    const item = findItem(key);
    if (!item) {
      callbacks.onError("找不到该复习项目，请刷新后重试。");
      return;
    }
    const record = window.MochiApp?.parseMochiRecord?.(text);
    if (!record) {
      callbacks.onError("没有找到 MOCHI-RECORD，请粘贴 AI 最后输出的完整记录段，必须同时包含 ---MOCHI-RECORD-START--- 和 ---MOCHI-RECORD-END---。");
      return;
    }
    const normalizedLabel = window.MochiCards?.normalizeNodeLabel?.(record.subject, record.nodeLabel, record.nodeId) || record.nodeLabel;
    if (record.subject !== item.subject || normalizedLabel !== item.nodeLabel) {
      callbacks.onError(`这条记录不是「${item.nodeLabel}」的内容，请检查 AI 输出是否匹配本次复习项目。`);
      return;
    }
    record.nodeLabel = item.nodeLabel;
    record.nodeId = item.nodeId;
    record.meta = {
      ...(record.meta || {}),
      source: "review",
      sourceRecordIds: Array.isArray(record.meta?.sourceRecordIds) && record.meta.sourceRecordIds.length
        ? record.meta.sourceRecordIds
        : item.entries.map((log) => window.MochiReviewEngine.cardId(log)),
    };
    const applied = window.MochiApp?.applyMochiRecord?.(record);
    if (!applied) {
      callbacks.onError("导入失败，请刷新后重试。");
      return;
    }
    window.MochiApp?.toast?.("复习结果已导入");
    window.MochiPet?.renderMiniState?.();
    window.MochiFarm?.refreshFarmSummary?.();
    const starMsgs = {
      3: `「${item.nodeLabel}」做对了，下次冷却，继续保持。`,
      2: `「${item.nodeLabel}」基本掌握，下次还会再出现。`,
      1: `「${item.nodeLabel}」记录了卡点，下次重点照顾。`,
    };
    callbacks.onSuccess(starMsgs[record.stars] || `已导入复习结果。`);
  }
```

将 `window.MochiReviewPage = { render, startItem }` 替换为：

```javascript
  window.MochiReviewPage = { render, startItem, copyItemPack, importItemByKey };
```

#### 步骤 B：在 `farm.js` 添加 HOME_REVIEW_STATE

在 IIFE 的最顶部（`const FARM_KEY = "farm_state"` 等常量之后，第一个函数之前）插入：

```javascript
  const HOME_REVIEW_STATE = { activeKey: "", importResult: "", importError: "" };
```

#### 步骤 C：修改 `renderTodayReviewCard()` 展示内联导入

找到 `renderTodayReviewCard()` 函数中有复习建议（item 存在）的 return 语句（约第 267–284 行）：

```javascript
    return `
      <section class="card home-review-card" style="--subject-color:${escapeAttr(item.subjectColor || "#864d61")}">
        <div class="home-review-head">
          <span class="material-symbols-outlined">rate_review</span>
          <div>
            <h3>今日复习</h3>
            <p>${escapeAttr(item.subjectLabel)} · ${escapeAttr(item.nodeLabel)}</p>
          </div>
        </div>
        ${item.mainPainPoint ? `
        <details class="home-review-spoiler">
          <summary class="home-review-recall-hint">还记得吗？先想一想，再展开看卡点</summary>
          <p class="home-review-pain">${escapeAttr(item.mainPainPoint)}</p>
        </details>
        ` : ""}
        <p class="home-review-reason">${escapeAttr(item.primaryReason || item.summaryLine || "适合做一次轻量回顾。")}</p>
        <div class="home-review-actions">
          <button class="btn btn-primary btn-sm" data-home-review-action="start" data-review-key="${escapeAttr(item.key)}" type="button">
            <span class="material-symbols-outlined">content_copy</span>复制材料
          </button>
          <button class="btn btn-outline btn-sm" data-route="review" type="button">看全部</button>
        </div>
      </section>
    `;
```

替换为（增加内联导入区域，基于 `HOME_REVIEW_STATE.activeKey`）：

```javascript
    const isActive = HOME_REVIEW_STATE.activeKey === item.key;
    return `
      <section class="card home-review-card" style="--subject-color:${escapeAttr(item.subjectColor || "#864d61")}">
        <div class="home-review-head">
          <span class="material-symbols-outlined">rate_review</span>
          <div>
            <h3>今日复习</h3>
            <p>${escapeAttr(item.subjectLabel)} · ${escapeAttr(item.nodeLabel)}</p>
          </div>
        </div>
        ${item.mainPainPoint ? `
        <details class="home-review-spoiler"${isActive ? " open" : ""}>
          <summary class="home-review-recall-hint">还记得吗？先想一想，再展开看卡点</summary>
          <p class="home-review-pain">${escapeAttr(item.mainPainPoint)}</p>
        </details>
        ` : ""}
        ${isActive ? `
        <div class="home-review-import">
          ${HOME_REVIEW_STATE.importError ? `<p class="home-review-msg home-review-msg-error">${escapeAttr(HOME_REVIEW_STATE.importError)}</p>` : ""}
          ${HOME_REVIEW_STATE.importResult ? `
            <p class="home-review-msg home-review-msg-success">${escapeAttr(HOME_REVIEW_STATE.importResult)}</p>
            <button class="btn btn-soft btn-sm" data-home-review-action="dismiss" type="button" style="margin-top:6px">继续</button>
          ` : `
            <p class="home-review-import-hint">材料已复制 · 先在脑子里回想 20 秒，再去 AI 粘贴做题</p>
            <textarea id="home-review-paste" rows="3" placeholder="粘贴 AI 输出（含 MOCHI-RECORD 那段即可）" style="width:100%;box-sizing:border-box;margin-top:8px"></textarea>
            <button class="btn btn-primary btn-sm" data-home-review-action="import" data-review-key="${escapeAttr(item.key)}" style="width:100%;margin-top:6px" type="button">
              <span class="material-symbols-outlined">download_done</span>导入复习结果
            </button>
          `}
        </div>
        ` : `
        <div class="home-review-actions">
          <button class="btn btn-primary btn-sm" data-home-review-action="start" data-review-key="${escapeAttr(item.key)}" type="button">
            <span class="material-symbols-outlined">content_copy</span>复制材料
          </button>
          <button class="btn btn-outline btn-sm" data-route="review" type="button">看全部</button>
        </div>
        `}
      </section>
    `;
```

#### 步骤 D：修改 `handleHomeReviewStart()` 处理三个 action

找到并替换整个 `handleHomeReviewStart()` 函数（约第 446–450 行）：

```javascript
  async function handleHomeReviewStart(event) {
    const key = event.currentTarget.dataset.reviewKey || "";
    const copied = await window.MochiReviewPage?.startItem?.(key, "suggestion");
    if (!copied) window.MochiApp?.navigate?.("review");
  }
```

替换为：

```javascript
  async function handleHomeReviewStart(event) {
    const action = event.currentTarget.dataset.homeReviewAction;
    const key = event.currentTarget.dataset.reviewKey || "";

    if (action === "start") {
      const copied = await window.MochiReviewPage?.copyItemPack?.(key);
      HOME_REVIEW_STATE.activeKey = key;
      HOME_REVIEW_STATE.importResult = "";
      HOME_REVIEW_STATE.importError = "";
      window.MochiApp?.toast?.(copied ? "复习材料已复制，先自己回想 20 秒" : "复制失败，请手动获取材料");
    } else if (action === "import") {
      const textarea = document.getElementById("home-review-paste");
      const text = textarea?.value || "";
      window.MochiReviewPage?.importItemByKey?.(key, text, {
        onSuccess(msg) {
          HOME_REVIEW_STATE.importResult = msg;
          HOME_REVIEW_STATE.importError = "";
          const view = document.getElementById("view");
          if (view && view.querySelector(".home-flow")) {
            renderFarm(view);
            window.MochiApp?.sparkle?.(view, "✓");
          }
        },
        onError(msg) {
          HOME_REVIEW_STATE.importError = msg;
          HOME_REVIEW_STATE.importResult = "";
          const view = document.getElementById("view");
          if (view && view.querySelector(".home-flow")) renderFarm(view);
        },
      });
      return;
    } else if (action === "dismiss") {
      HOME_REVIEW_STATE.activeKey = "";
      HOME_REVIEW_STATE.importResult = "";
      HOME_REVIEW_STATE.importError = "";
    }

    const view = document.getElementById("view");
    if (view && view.querySelector(".home-flow")) renderFarm(view);
  }
```

#### 步骤 E：更新 `renderFarm()` 里的事件绑定

找到（约第 431–432 行）：
```javascript
    container.querySelectorAll("[data-home-review-action='start']").forEach((button) => {
      button.addEventListener("click", handleHomeReviewStart);
    });
```

替换为（绑定所有 home-review-action）：
```javascript
    container.querySelectorAll("[data-home-review-action]").forEach((button) => {
      button.addEventListener("click", handleHomeReviewStart);
    });
```

**CSS 新增**（`style.css`）：

```css
.home-review-import {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.home-review-import-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
}
.home-review-msg {
  font-size: 13px;
  padding: 8px 10px;
  border-radius: 8px;
  margin: 0;
  line-height: 1.5;
}
.home-review-msg-error {
  color: var(--danger, #c0392b);
  background: rgba(192, 57, 43, 0.08);
}
.home-review-msg-success {
  color: var(--success, #27ae60);
  background: rgba(39, 174, 96, 0.08);
}
```

**验证**：
1. `node --check modules/reviewPage.js` + `node --check modules/farm.js` → 无报错
2. 浏览器首页，有复习建议时：
   - 点击「复制材料」→ 显示 textarea + 「导入复习结果」按钮，不跳页
   - 粘贴有效 MOCHI-RECORD → 显示成功消息 + 继续按钮
   - 粘贴无效内容 → 显示错误消息，仍然可以继续编辑
   - 点击「继续」→ textarea 隐藏，回到原始复习卡
3. 「看全部」按钮仍然跳转到复习页（data-route="review"）
4. 导入成功后 streak 横幅更新（farm 重新渲染）

---

### 改动 2（最后执行）：合并「复习」+「档案」为「学习」tab

**文件**：`app.js` + `index.html` + `style.css`  
**这是导航结构性改动，最后执行**

**问题**：底部导航 5 个 tab，「复习」和「档案」占 2/5 但在逻辑上是同一「学习」功能的两个视角。合并后底部 4 tab：首页/学习/勋章/设置，侧边栏也对应简化。

#### 步骤 A：在 app.js 添加 `renderLearn()` 函数和 `learnActiveTab` 状态

在 `route()` 函数**之前**，插入：

```javascript
  let learnActiveTab = "review";

  function renderLearn(container, tab) {
    if (tab === "review" || tab === "map") learnActiveTab = tab;
    container.innerHTML = `
      <div class="learn-tab-bar">
        <button class="learn-tab-btn ${learnActiveTab === "review" ? "active" : ""}" data-action="learn-tab" data-tab="review" type="button">
          <span class="material-symbols-outlined">rate_review</span>复习队列
        </button>
        <button class="learn-tab-btn ${learnActiveTab === "map" ? "active" : ""}" data-action="learn-tab" data-tab="map" type="button">
          <span class="material-symbols-outlined">collections_bookmark</span>学习档案
        </button>
      </div>
      <div id="learn-content-pane"></div>
    `;
    const pane = container.querySelector("#learn-content-pane");
    if (learnActiveTab === "review") {
      window.MochiReviewPage?.render?.(pane);
    } else {
      window.MochiCards?.render?.(pane);
    }
    container.querySelectorAll("[data-action='learn-tab']").forEach((btn) => {
      btn.addEventListener("click", () => {
        renderLearn(container, btn.dataset.tab || "review");
      });
    });
  }
```

#### 步骤 B：修改 `route()` 函数处理新路由

找到 `route()` 函数（约第 961 行），找到这两行：
```javascript
    else if (routeId === "map") window.MochiCards.render(view);
    else if (routeId === "review") window.MochiReviewPage?.render?.(view);
```

替换为（三条路由都映射到 renderLearn）：
```javascript
    else if (routeId === "learn") renderLearn(view);
    else if (routeId === "review") renderLearn(view, "review");
    else if (routeId === "map") renderLearn(view, "map");
```

同时，找到 `route()` 末尾附近检查是否有对 `map` 的特殊处理（约第 3840 行附近），找到：
```javascript
    if (routeId === "map") window.MochiCards?.refresh?.();
```
替换为：
```javascript
    if (routeId === "map" || routeId === "learn") {
      if (learnActiveTab === "map") window.MochiCards?.refresh?.();
    }
```

#### 步骤 C：修改 `setActive()` 让「学习」按钮在 review/map 路由时高亮

找到 `setActive()` 函数（约第 1002 行）：
```javascript
  function setActive(routeId) {
    document.querySelectorAll("[data-route]").forEach((el) => {
      el.classList.toggle("active", el.dataset.route === routeId);
    });
    document.querySelector(".side-nav")?.classList.remove("open");
    updateNavBadge();
  }
```

替换为：
```javascript
  function setActive(routeId) {
    const isLearnRoute = routeId === "review" || routeId === "map" || routeId === "learn";
    document.querySelectorAll("[data-route]").forEach((el) => {
      const match = el.dataset.route === routeId || (el.dataset.route === "learn" && isLearnRoute);
      el.classList.toggle("active", match);
    });
    document.querySelector(".side-nav")?.classList.remove("open");
    updateNavBadge();
  }
```

#### 步骤 D：修改 `index.html` 导航结构

**侧边栏（sidebar nav）**：找到（约第 23–30 行）：
```html
          <button class="nav-item" data-route="schedule">...</button>  ← 已在V3.1删除
          <button class="nav-item" data-route="map"><span class="material-symbols-outlined">collections_bookmark</span>学习档案</button>
          <button class="nav-item" data-route="review"><span class="material-symbols-outlined">rate_review</span>复习</button>
```
把这两行替换为一行：
```html
          <button class="nav-item" data-route="learn"><span class="material-symbols-outlined">school</span>学习</button>
```

**底部导航（bottom-nav）**：找到（约第 44–50 行）：
```html
          <button class="nav-item" data-route="review"><span class="material-symbols-outlined">rate_review</span>复习</button>
          <button class="nav-item" data-route="map"><span class="material-symbols-outlined">collections_bookmark</span>档案</button>
```
把这两行替换为一行：
```html
          <button class="nav-item" data-route="learn"><span class="material-symbols-outlined">school</span>学习</button>
```

底部导航从 5 个 tab 缩减为 4 个：首页 / 学习 / 勋章 / 设置。

#### 步骤 E：CSS 新增 learn-tab-bar 样式

追加到 `style.css`：

```css
.learn-tab-bar {
  display: flex;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}
.learn-tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 24px;
  border: 1px solid var(--border);
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-muted);
  font-family: inherit;
}
.learn-tab-btn.active {
  background: var(--primary, #7c6fcd);
  border-color: var(--primary, #7c6fcd);
  color: #fff;
}
.learn-tab-btn .material-symbols-outlined {
  font-size: 18px;
}
#learn-content-pane .page-head {
  display: none;
}
```

> 最后一条规则隐藏了子页面的 `<div class="page-head">` 标题区（因为 learn-tab-bar 已承担导航角色，子页面的「复习」「学习档案」标题重复了）。

**验证**：
1. `node --check app.js` → 无报错
2. 浏览器侧边栏：看到「学习」按钮，不再有独立的「复习」和「档案」按钮
3. 底部导航：4 个 tab（首页/学习/勋章/设置）
4. 点击「学习」→ 进入复习队列子 tab（默认 review）
5. 点击「学习档案」子 tab → 显示档案内容
6. 切换回「复习队列」子 tab → 显示复习列表
7. 从首页「看全部」→ 跳转到学习页复习队列 tab
8. `data-route="review"` 和 `data-route="map"` 的旧链接仍然工作（通过 route 别名）
9. 完成导入后页面刷新正常

---

## 全部完成后

### 1. 更新 `CLAUDE.md`

追加：

```
### V3.2 导航革命 + 首页闭环 + 档案瘦身

- `modules/farm.js`：`renderTodayReviewCard()` 无建议时显示下一到期项（nodeLabel + 天数）
- `modules/farm.js`：新增 `HOME_REVIEW_STATE`；复习卡「复制材料」后展开内联 textarea，导入全程在首页完成，不跳页；三个 action：start / import / dismiss
- `modules/reviewPage.js`：新增导出函数 `copyItemPack(key)` 和 `importItemByKey(key, text, callbacks)`，供 farm.js 调用
- `modules/knowledgeMap.js`：删除 STATE 中 `organizing`/`draggingCardId`/`sourceFilter`/`editingSummaryKey`；删除 SOURCE_FILTERS 常量；`filterEntriesBySource()` 改为直通函数；删除整理按钮、来源筛选器、拖拽事件（dragstart/dragover/drop/dragend）、reorderCards()、拖拽手柄按钮、内联编辑按钮；`refresh()` 加 `document.contains` 守卫
- `app.js`：新增 `learnActiveTab` 状态 + `renderLearn(container, tab)` 函数；`route()` 让 learn/review/map 都走 renderLearn；`setActive()` 让 data-route="learn" 在 review/map 路由时高亮
- `app.js`：`renderNoSeason()` 改为显示累计记录、学习天数、专注小时、三科记录数；无数据时显示引导语
- `index.html`：侧边栏「复习」+「学习档案」合并为「学习」；底部导航从 5 tab（首页/复习/档案/勋章/设置）缩减为 4 tab（首页/学习/勋章/设置）
- `style.css`：新增 .learn-tab-bar/.learn-tab-btn、.home-review-import 系列、.home-review-msg、.home-review-next-due、.season-empty-stats/.stat-mini 系列
```

### 2. 更新 `Instruction/self-iteration.md` 第零步

追加：
```
- V3.2：首页复习卡内联导入（copyItemPack + importItemByKey + HOME_REVIEW_STATE）✅
- V3.2：复习+档案合并为「学习」tab，底部导航 5→4 ✅
- V3.2：学习档案删整理模式+来源筛选+拖拽相关全部代码 ✅
- V3.2：赛季页无赛季状态显示累计统计 ✅
- V3.2：首页今日无复习显示下一到期项 ✅
```

### 3. git commit

```
git add index.html app.js modules/farm.js modules/reviewPage.js modules/knowledgeMap.js style.css CLAUDE.md Instruction/self-iteration.md Instruction/plan-v32-radical.md
git commit -m "V3.2 radical: inline review import, merge learn tab, slim archive, season stats, next-due hint"
git push
```

---

## 改动相互独立性说明

| 改动 | 依赖 |
|---|---|
| 改动5（next-due hint） | 独立 |
| 改动4（season stats） | 独立 |
| 改动3（archive slim） | 独立 |
| 改动1（inline import） | 依赖 reviewPage.js 新增 copyItemPack/importItemByKey，需在 farm.js 之前写 |
| 改动2（merge nav） | 独立于 1/3/4/5；但改动 1 完成后，改动 2 的 review tab 里用户看到的是内联导入已处理后的列表 |

执行顺序：**5 → 4 → 3 → 1 → 2**

每个改动完成后独立验证，出现复杂 bug 时降级处理（只做安全部分），剩余留下一轮。
