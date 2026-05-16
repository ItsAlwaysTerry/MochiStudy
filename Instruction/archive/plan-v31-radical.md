# V3.1 执行文档 — 激进简化：布局重构 + 页面拆解 + 交互整合

**目标**：这一轮不做微调，做结构性改动。首页布局推倒重来，复习页删掉三分之一代码，日历页从导航下架，抽奖机会在导航上直接可见。所有改动不触碰 localStorage 数据结构和备份格式。

---

## 起飞前检查

**已确认的不可触碰边界**：
- `study_log` 字段结构不变
- `localStorage` key 不新增、不改名
- 备份文件格式（version / data 结构）不变
- 精灵图不用 SVG / emoji 替代
- 农场币 / 种子 / 学习点系统不加回

**V3.0 已解决，不要重审**（完整列表见 self-iteration.md 第零步）：
- 首页复习卡 mainPainPoint → details/summary 主动回忆翻转 ✅
- 赛季徽章 → 可点击按钮 ✅
- 复习页待处理去重 ✅
- 今日建议删掉「为什么今天」列 ✅
- renderDailyGoalDots 死代码已删 ✅

---

## 五角色分析结论

### 诺曼：最大发现
🔴 **首页：番茄钟占据视觉中心，但大多数打开 App 的时刻不是要开始专注，而是要导入刚做完的题**。用户视线第一眼落在 timer，core action（导入框）在右侧 300px 栏里，向下滚动才能看全。「想要导入」和「被迫先看 timer」之间的摩擦，每天都在发生。

🟡 **日历页（`#schedule`）从导航下架后（V2.0 移出底部 tab），仍留在侧边栏**。用户在侧边栏里看到「日历」，点进去，既不能配置假期（那在 `?admin=1`），也不能看到比赛季页更有用的数据。唯一独特价值是月历 + 点击看当天详情，但这是超低频操作。继续留在侧边栏造成认知负担。

🟡 **勋章页有抽奖次数，但不在任何导航入口上显示**。用户需要主动导航到勋章页才会发现「我有 3 次可抽奖」。这个发现路径过长，很多人直接错过。

### 奥克利：最大发现
🔴 **复习页的「今日建议」和「待处理」两个分区，让用户在「该做哪个」上浪费认知资源**。V3.0 已在首页用 details/summary 解决了主动回忆问题，但复习页的信息架构仍是「两个区域、一个 filter bar、一个展开/折叠」——这对基础差的学生是认知过载，导致不知道从哪开始，直接放弃。

🟡 **复习导入面板（`renderImportPanel`）有 4 个编号步骤 + 独立的「主动回忆」卡片**，合计 5 个视觉块出现在用户真正要操作（粘贴）之前。一个已经决定要复习的学生，不需要被这么多步骤引导，直接粘贴就行。

### 拉姆斯：最大发现
🔴 **首页 `farm-focus-area` 的 CSS `min-height: 520px`** 意味着 timer 卡片在所有状态下（包括 idle）强制占据 520px 高度。这不仅让 timer 成为首页视觉绝对中心，还在移动端（<980px timer 在上、farm 在下）导致用户滚动很长距离才能到导入框。

🟡 **日历页的 `renderWeeklyAchievements()` 和 `moodCard()` 两个 section** 在日历页显示勋章进度和心情卡——这些功能和日历完全无关，是功能蔓延的典型症状。

🟢 **复习页 filter bar（全部/数学/物理/化学）**：这个学生只有三科，每科都需要复习，筛选功能几乎无意义。filter bar 占据宝贵的顶部空间但零实际使用价值。

### 福勒：最大发现
🟡 **`renderTodayTask()` 和 `renderReviewRow()` 是同一件事的两种表现形式**（expanded card vs compact row），但现在 V3.0 已删了 renderTodayTask 的第二列，两者差距更小。用一个函数加 `isToday` 参数就能统一。

🟢 **`STATE.subjectFilter` 和 `STATE.pendingExpanded`** 是 reviewPage.js 的两个状态变量，如果删了 filter bar 和展开/折叠，这两个变量可以完全删除，STATE 对象缩小 40%。

🟢 **`farm-side-area` / `farm-focus-area` / `farm-layout-v2`** 这三个 CSS class + 对应的 50 行 CSS 规则，将在首页重构后变成死 CSS。

---

## 芒格裁决

| 改动 | 用户感知 | 实现风险 | 代码范围 | 总分 |
|---|---|---|---|---|
| 改动1：首页单列布局，导入最优先，timer 折叠 | 3 | 2 | 2 | **7** |
| 改动2：复习页扁平化（单列表 + 删 filter） | 3 | 2 | 2 | **7** |
| 改动3：日历从侧边栏导航删除 | 2 | 3 | 2 | **7** |
| 改动4：勋章导航抽奖徽章 | 2 | 2 | 2 | **6** |
| 改动5：复习导入面板 4步→2步，删回忆卡 | 2 | 3 | 3 | **8** |

**反转检验**：
- 改动1：「不做」→ 每天开 App 都先看 timer，核心动线继续有摩擦。不能不做。
- 改动2：「不做」→ 复习页继续是认知过载的三分区界面。不能不做。
- 改动3：「不做」→ 日历继续占侧边栏一席，用户偶尔误入空洞页面。可以接受，但做了更干净。
- 改动4：「不做」→ 抽奖次数继续沉没在勋章页内部。影响学习动力循环。做了更好。
- 改动5：「不做」→ 复习时每次都要看 4+1 步才能到粘贴区。每天都在发生。必须做。

**执行顺序**：改动5 → 改动3 → 改动4 → 改动2 → 改动1（风险从低到高）

---

## 执行列表

---

### 改动 5（先执行）：复习导入面板 4步→2步，删回忆卡

**文件**：`modules/reviewPage.js`  
**函数**：`renderImportPanel(item)`

**问题**：导入面板有 4 个编号步骤 + 独立 `.review-recall-card` 卡片，用户要在 5 个视觉块后才能到达 textarea。对已决定要复习的学生，这是不必要的摩擦。

**找到以下整段（约第 317–355 行）**：

```javascript
    return `
      <div class="review-import-panel">
        <ol class="review-steps">
          <li class="review-step done">
            <span class="review-step-num">1</span>
            <span>复习材料已复制到剪贴板</span>
          </li>
          <li class="review-step">
            <span class="review-step-num">2</span>
            <span>先别急着粘贴，自己回想 20 秒：这个卡点到底卡在哪里？</span>
          </li>
          <li class="review-step">
            <span class="review-step-num">3</span>
            <span>打开「高考复习 AI 私教」→ 粘贴材料，让它出一道题</span>
          </li>
          <li class="review-step">
            <span class="review-step-num">4</span>
            <span>复习完成后，把 AI 最后输出的内容（含 MOCHI-RECORD）整段粘到下方</span>
          </li>
        </ol>
        <div class="review-recall-card">
          <span class="material-symbols-outlined">psychology_alt</span>
          <p>先在脑子里试着说出解题入口，再看 AI 出题。想不出来也没关系，这一下才是有效复习的开始。</p>
        </div>
        <div class="review-import-inline">
          <textarea id="review-input-${escapeHtml(item.key)}" data-review-input rows="2" placeholder="粘贴 AI 输出（只要包含 ---MOCHI-RECORD-START--- 那段即可）"></textarea>
          <button class="btn btn-primary" data-review-action="import" data-review-key="${escapeHtml(item.key)}" type="button">
            <span class="material-symbols-outlined">download_done</span>导入复习结果
          </button>
        </div>
        <details class="review-pack-preview">
          <summary>查看复习材料</summary>
          <textarea readonly>${escapeHtml(pack)}</textarea>
        </details>
        <div class="review-import-result" data-review-result hidden></div>
      </div>
    `;
```

**替换为**：

```javascript
    return `
      <div class="review-import-panel">
        <p class="review-panel-hint">
          ✓ 材料已复制 · 先自己回想 20 秒，再去 AI 那里粘贴做题<br>
          做完后，把 AI 最后输出的内容（含 MOCHI-RECORD）整段粘到下方
        </p>
        <div class="review-import-inline">
          <textarea id="review-input-${escapeHtml(item.key)}" data-review-input rows="3" placeholder="粘贴 AI 输出（只要包含 ---MOCHI-RECORD-START--- 那段即可）"></textarea>
          <button class="btn btn-primary" data-review-action="import" data-review-key="${escapeHtml(item.key)}" type="button">
            <span class="material-symbols-outlined">download_done</span>导入复习结果
          </button>
        </div>
        <details class="review-pack-preview">
          <summary>查看复习材料</summary>
          <textarea readonly>${escapeHtml(pack)}</textarea>
        </details>
        <div class="review-import-result" data-review-result hidden></div>
      </div>
    `;
```

**CSS 新增**（`style.css`，找到 `.review-recall-card` 附近，追加）：

```css
.review-panel-hint {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0 0 12px;
  padding: 10px 12px;
  background: var(--bg-soft, rgba(0,0,0,0.03));
  border-radius: 8px;
}
```

**验证**：
1. `node --check modules/reviewPage.js` → 无报错
2. 浏览器进入复习页，点击某个「开始复习」
3. 展开的卡片直接显示：一行提示文字 → textarea → 导入按钮 → 查看复习材料（折叠）
4. 没有 4 步列表，没有单独的回忆卡片
5. 导入成功 / 失败提示正常显示

---

### 改动 3（第二执行）：日历从侧边栏导航删除

**文件**：`index.html`  
**同时修改**：`app.js`（路由重定向）

**问题**：日历页（`#schedule`）已从底部导航移除（V2.0），但仍在桌面侧边栏。日历页除了月历视图外，`renderWeeklyAchievements()` 和 `moodCard()` 两个 section 和「日历」语义无关，是功能蔓延。用户进入后找不到能操作的东西（假期配置在 `?admin=1`）。

**修改一**（index.html）：找到侧边栏 `<nav class="nav-list">` 中的日历按钮（约第 25 行）：

```html
          <button class="nav-item" data-route="schedule"><span class="material-symbols-outlined">calendar_month</span>日历</button>
```

**整行删除**。

**修改二**（app.js）：找到 `route()` 函数（约第 961 行）：

```javascript
    else if (routeId === "schedule") window.MochiCalendar.renderSchedule(view);
```

**替换为**：

```javascript
    else if (routeId === "schedule") renderSeason(view);
```

> 这样直接在 URL 输入 `#schedule` 的用户会被重定向到赛季页，不会看到空白。日历的 JS 模块保留不删，不产生报错。

**修改三**（`modules/calendar.js`）：`renderWeeklyAchievements()` 和 `moodCard()` 两个函数在 renderSchedule 里被调用（第 56–57 行），但它们依赖 `window.MochiApp.getUnlockedAchievements`。由于 renderSchedule 不再被正常路由调用，这两个函数可以保留原样，不需要删除。**本改动不改 calendar.js**。

**验证**：
1. `node --check app.js` → 无报错
2. 浏览器打开侧边栏，确认「日历」按钮不存在
3. 在 URL 输入 `index.html#schedule` → 跳转到赛季页，不报错
4. 底部导航和剩余的侧边栏导航（首页/复习/档案/勋章/赛季/设置）全部正常

---

### 改动 4（第三执行）：勋章导航抽奖徽章

**文件**：`app.js` + `style.css`  
**新增函数**：`updateNavBadge()`

**问题**：`achievement_state.lotteryTickets` 存储可用抽奖次数，但没有任何导航入口提示用户「现在有可抽奖次数」。用户需要主动导航到勋章页才能发现，漏过的概率极高。

**app.js 修改一**：找到 `setActive()` 函数（约第 979 行），在函数体末尾（`document.querySelector(".side-nav")?.classList.remove("open");` 之后）添加一行调用：

找到：
```javascript
  function setActive(routeId) {
    document.querySelectorAll("[data-route]").forEach((el) => {
      el.classList.toggle("active", el.dataset.route === routeId);
    });
    document.querySelector(".side-nav")?.classList.remove("open");
  }
```

替换为：
```javascript
  function setActive(routeId) {
    document.querySelectorAll("[data-route]").forEach((el) => {
      el.classList.toggle("active", el.dataset.route === routeId);
    });
    document.querySelector(".side-nav")?.classList.remove("open");
    updateNavBadge();
  }
```

**app.js 修改二**：在 `setActive()` 函数**之前**插入新函数 `updateNavBadge()`（位置：`setActive` 定义之前的空行处）：

```javascript
  function updateNavBadge() {
    const tickets = loadAchievementState().lotteryTickets || 0;
    document.querySelectorAll('[data-route="achievements"]').forEach((btn) => {
      let badge = btn.querySelector(".nav-lottery-badge");
      if (tickets > 0) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "nav-lottery-badge";
          btn.appendChild(badge);
        }
        badge.textContent = tickets;
      } else if (badge) {
        badge.remove();
      }
    });
  }
```

**app.js 修改三**：找到 `checkAndGrantAchievements()` 函数，在其函数体**末尾**、return 语句之前（或最后一行之后）追加一行：

```javascript
    updateNavBadge();
```

> 定位方法：`grep -n "checkAndGrantAchievements" app.js` 找到函数定义，滚动到函数体末尾的 `}` 前一行插入。

**CSS 新增**（`style.css`，追加到文件末尾或勋章相关样式附近）：

```css
[data-route="achievements"] {
  position: relative;
}
.nav-lottery-badge {
  position: absolute;
  top: 2px;
  right: 4px;
  background: #e53935;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 8px;
  text-align: center;
  line-height: 16px;
  pointer-events: none;
  z-index: 1;
}
```

**验证**：
1. `node --check app.js` → 无报错
2. 浏览器打开，通过调试面板（`?debug=1`）增加勋章状态直到有抽奖次数
3. 侧边栏和底部导航的「勋章」按钮右上角出现红色数字徽章
4. 进入勋章页抽奖后，导航徽章数字减少
5. tickets=0 时徽章消失

---

### 改动 2（第四执行）：复习页扁平化

**文件**：`modules/reviewPage.js` + `style.css`  
**删除代码量约 50-60 行，添加约 20 行**

**问题**：复习页三分区（今日建议 / 待处理 / 冷却）+ filter bar + 展开/折叠，对基础差的学生是认知过载。用户扫到「全部 / 数学 / 物理 / 化学」filter 后不知道该点哪个；看到两个分区后不知道区别；看到「还有 N 项」后不知道要不要展开。

**目标状态**：
- 单一排序列表，按 priority score 降序
- `todaySuggestions` 里的条目在顶部，有「今日」小绿标（颜色徽章）
- 非 todaySuggestions 的待处理条目紧随其后
- 冷却/稳定 条目在最底部折叠（`<details>`），默认关闭
- 完全删除 filter bar
- 完全删除展开/折叠「还有 N 项」逻辑

#### 步骤 A：删除 STATE 中不再需要的字段

找到（约第 4–11 行）：
```javascript
  const STATE = {
    subjectFilter: "all",
    activeKey: "",
    activeOrigin: "",
    message: "",
    pendingExpanded: false,
    container: null,
  };
```

替换为：
```javascript
  const STATE = {
    activeKey: "",
    activeOrigin: "",
    message: "",
    container: null,
  };
```

#### 步骤 B：删除 `renderFilters()` 函数

找到整个 `renderFilters()` 函数（约第 249–260 行），**整段删除**：
```javascript
  function renderFilters() {
    const subjects = [["all", "全部"], ...Object.entries(window.MochiKnowledge?.SUBJECTS || {}).map(([key, item]) => [key, item.label])];
    return `
      <div class="review-filter-bar">
        <div class="review-filter-group">
          ${subjects.map(([value, label]) => `
            <button class="${STATE.subjectFilter === value ? "active" : ""}" data-review-action="filter-subject" data-value="${escapeHtml(value)}" type="button">${escapeHtml(label)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }
```

#### 步骤 C：修改 `bindContainer()` 里的 filter 和 expand 事件处理

找到（约第 93–107 行）：
```javascript
      if (action === "filter-subject") {
        STATE.subjectFilter = button.dataset.value || "all";
        STATE.pendingExpanded = false;
        render(container);
        return;
      }
      if (action === "expand-pending") {
        STATE.pendingExpanded = !STATE.pendingExpanded;
        render(container);
        return;
      }
```

**整段删除**（保留其余 action 处理）。

#### 步骤 D：修改 `filterItems()` 函数

找到（约第 218–224 行）：
```javascript
  function filterItems(items, todaySuggestions) {
    const skipKeys = new Set((todaySuggestions || []).map((s) => s.key));
    return items.filter((item) => {
      if (skipKeys.has(item.key)) return false;
      if (STATE.subjectFilter !== "all" && item.subject !== STATE.subjectFilter) return false;
      return !["stable", "consolidating"].includes(item.status) && item.score > 0;
    });
  }
```

替换为（删掉 subjectFilter 逻辑）：
```javascript
  function filterItems(items, todaySuggestions) {
    const skipKeys = new Set((todaySuggestions || []).map((s) => s.key));
    return items.filter((item) => {
      if (skipKeys.has(item.key)) return false;
      return !["stable", "consolidating"].includes(item.status) && item.score > 0;
    });
  }
```

#### 步骤 E：修改 `renderPendingList()` — 删除展开/折叠逻辑

找到整个 `renderPendingList()` 函数（约第 232–247 行）：
```javascript
  function renderPendingList(items) {
    if (!items.length) return renderEmpty("当前筛选下没有待处理的薄弱点。");
    if (items.length <= PENDING_VISIBLE_CAP || STATE.pendingExpanded) {
      const rows = items.map((item) => renderReviewRow(item)).join("");
      if (items.length <= PENDING_VISIBLE_CAP) return rows;
      return rows + `
        <button class="review-pending-toggle" data-review-action="expand-pending" type="button">
          <span class="material-symbols-outlined">expand_less</span>收起
        </button>`;
    }
    const hidden = items.length - PENDING_VISIBLE_CAP;
    return items.slice(0, PENDING_VISIBLE_CAP).map((item) => renderReviewRow(item)).join("") + `
      <button class="review-pending-toggle" data-review-action="expand-pending" type="button">
        <span class="material-symbols-outlined">expand_more</span>还有 ${hidden} 项待处理 — 显示全部
      </button>`;
  }
```

替换为（去掉展开折叠，全量显示，同时接受 todaySuggestions 参数用于「今日」徽章）：
```javascript
  function renderFlatList(activeItems, todaySuggestions, cooldownItems) {
    const todayKeys = new Set((todaySuggestions || []).map((s) => s.key));
    if (!activeItems.length && !todaySuggestions.length) {
      return renderEmpty("目前没有需要处理的薄弱点，继续导入新记录吧。");
    }
    const allVisible = [...todaySuggestions, ...activeItems];
    const rows = allVisible.map((item) => renderReviewRow(item, todayKeys.has(item.key))).join("");
    const cooldown = cooldownItems.length ? `
      <details class="review-cooldown-section">
        <summary class="review-cooldown-summary">
          <span>冷却 / 已稳定</span>
          <span class="review-cooldown-count">${cooldownItems.length} 项近期不需要处理</span>
        </summary>
        <div class="review-table review-cooldown-table">
          ${cooldownItems.map((item) => renderReviewRow(item, false)).join("")}
        </div>
      </details>
    ` : "";
    return rows + cooldown;
  }
```

#### 步骤 F：修改 `renderReviewRow()` 函数，接受 `isToday` 参数

找到（约第 297 行）：
```javascript
  function renderReviewRow(item) {
```

替换为：
```javascript
  function renderReviewRow(item, isToday = false) {
```

在函数内部，找到 `review-row-main` div（约第 300–309 行），在 `review-row-chip` 那行之后、`review-row-info` 之前，**无需改动**。只在文章元素 `<article>` 标签里的 class 后面添加 `isToday` 判断：

找到（约第 301 行）：
```javascript
      <article class="review-row ${expanded ? "active" : ""}" data-review-card data-review-key="${escapeHtml(item.key)}" style="--subject-color:${escapeHtml(item.subjectColor || "#864d61")}">
```

替换为：
```javascript
      <article class="review-row ${expanded ? "active" : ""} ${isToday ? "review-row-today" : ""}" data-review-card data-review-key="${escapeHtml(item.key)}" style="--subject-color:${escapeHtml(item.subjectColor || "#864d61")}">
```

在 `review-row-main` 里，找到 subject chip 行（约第 303 行）：
```javascript
          <span class="chip ${item.subject} review-row-chip">${escapeHtml(item.subjectLabel)}</span>
```

替换为（加今日徽章）：
```javascript
          <span class="chip ${item.subject} review-row-chip">${escapeHtml(item.subjectLabel)}</span>
          ${isToday ? `<span class="review-today-badge">今日</span>` : ""}
```

#### 步骤 G：修改 `render()` 主函数，使用新的 `renderFlatList`

找到 `render()` 函数（约第 13 行起），当前结构：
```javascript
  function render(container) {
    ...
    const filteredItems = filterItems(reviewState.items, reviewState.todaySuggestions);
    const cooldownItems = filterCooldownItems(reviewState.items);
    container.innerHTML = `
      <div class="page-head review-head">
        ...
      </div>

      ${STATE.message ? `...` : ""}

      <section class="review-section">
        <div class="section-title-row">
          <div>
            <h3>今日建议</h3>
            ...
          </div>
        </div>
        <div class="review-suggestion-list">
          ${reviewState.todaySuggestions.length
            ? reviewState.todaySuggestions.map((item, index) => renderTodayTask(item, index)).join("")
            : renderTodayEmpty(filteredItems.length)}
        </div>
      </section>

      <section class="review-section">
        <div class="section-title-row">
          <div>
            <h3>待处理</h3>
            ...
          </div>
        </div>
        ${renderFilters()}
        <div class="review-table">
          ${renderPendingList(filteredItems)}
        </div>
      </section>

      ${cooldownItems.length ? `
      <details class="review-section review-cooldown-section">
        ...
      </details>
      ` : ""}

      <section class="review-help">
        ...
      </section>
    `;
    scrollActiveReviewItem(container);
  }
```

将整个 `container.innerHTML = \`...\`` 段替换为：

```javascript
  function render(container) {
    if (!container) return;
    STATE.container = container;
    bindContainer(container);
    const reviewState = window.MochiReviewEngine?.buildReviewState?.() || { items: [], todaySuggestions: [] };
    const filteredItems = filterItems(reviewState.items, reviewState.todaySuggestions);
    const cooldownItems = filterCooldownItems(reviewState.items);
    container.innerHTML = `
      <div class="page-head review-head">
        <div>
          <h2>复习</h2>
          <p>从最需要复习的开始，做完一个就算赢。</p>
        </div>
      </div>

      ${STATE.message ? `<div class="review-toast-inline">${escapeHtml(STATE.message)}</div>` : ""}

      <div class="review-table">
        ${renderFlatList(filteredItems, reviewState.todaySuggestions, cooldownItems)}
      </div>

      <section class="review-help">
        <span class="material-symbols-outlined">sync_alt</span>
        <p>开始复习会复制材料；只有把复习 AI 输出粘回并成功导入，才算完成。</p>
      </section>
    `;
    scrollActiveReviewItem(container);
  }
```

#### 步骤 H：删除不再用的函数

以下函数整段删除（grep 定位，整个 function 体删掉）：
- `renderTodayTask()` — 已被合并到 `renderReviewRow(item, isToday)`
- `renderTodayEmpty()` — 已被 `renderFlatList` 的 empty state 替代
- `renderPendingList()` — 已被 `renderFlatList` 替代

删除后检查文件中是否有残留调用（grep `renderTodayTask\|renderTodayEmpty\|renderPendingList`）。

#### CSS 新增

在 `style.css` 中，追加：

```css
.review-today-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  background: var(--success-bg, rgba(46,160,67,0.12));
  color: var(--success, #2ea843);
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  margin-left: 4px;
  vertical-align: middle;
}
.review-row-today {
  border-left: 3px solid var(--success, #2ea843);
}
```

**验证**：
1. `node --check modules/reviewPage.js` → 无报错
2. 浏览器进入复习页（有历史记录）
3. 看到单一列表，没有「今日建议」和「待处理」两个 section 标题，没有筛选 bar
4. 今日建议的条目有绿色左边框 + 「今日」徽章，排在列表最前
5. 冷却条目在列表最底部，默认折叠
6. 「开始复习」按钮展开导入面板正常工作
7. 导入成功后页面正常刷新

---

### 改动 1（最后执行）：首页单列布局 + 导入最优先 + timer 折叠

**文件**：`modules/farm.js` + `style.css`  
**这是本轮最大改动**

**问题**：`farm-layout-v2` 两列布局（timer 1fr | side 300px）让 timer 占据约 520px 高度的视觉中心位置，导入框在 300px 右栏里排第三位。日常使用中，80% 的打开场景是「导入记录」，不是「开始专注」。布局应反映实际优先级。

**目标**：
```
[赛季徽章]
[streak 横幅]
[导入框 / 休眠卡]   ← 最优先
[今日复习卡 / 引导卡]
[迷你农场]
▶ 开始专注（折叠的 <details>）
```

#### 步骤 A：修改 `renderFarm()` 函数的 HTML 结构

找到 `renderFarm()` 函数中 `container.innerHTML = \`...\`` 这段（约第 389 行），当前结构：

```javascript
    container.innerHTML = `
      ${seasonBanner}
      <div class="farm-layout-v2">
        <div class="farm-focus-area">
          ${window.MochiPet?.renderTimer?.(holiday) || ""}
        </div>

        <div class="farm-side-area">
          <section class="card mini-farm-card">
            ...
          </section>
          ${renderStreakBanner()}
          ${holiday
            ? `<section class="card import-card">...</section>`
            : `<section class="card farm-hibernate-card">...</section>`
          }
          ${hasRecords ? renderTodayReviewCard() : (holiday ? renderGuideCard() : "")}
        </div>
      </div>
    `;
```

**替换为**（重排顺序，单列 `.home-flow`，timer 在 details 里）：

```javascript
    container.innerHTML = `
      ${seasonBanner}
      <div class="home-flow">
        ${renderStreakBanner()}
        ${holiday
          ? `<section class="card import-card">
              <div class="import-header">
                <span class="material-symbols-outlined">upload_file</span>
                <div>
                  <h3>导入学习记录</h3>
                  <p class="import-header-hint">把 AI 家教输出的 MOCHI-RECORD 粘贴进来</p>
                </div>
              </div>
              <textarea id="record-paste" rows="3" placeholder="粘贴 MOCHI-RECORD 完整内容（START 到 END 整段）"></textarea>
              <button class="btn btn-primary" data-action="parse-record" style="width:100%;margin-top:8px">
                <span class="material-symbols-outlined">auto_awesome</span>确认导入
              </button>
              <div id="upload-result" class="upload-result" hidden></div>
            </section>`
          : `<section class="card farm-hibernate-card">
              <p class="farm-hibernate-icon">😴</p>
              <p class="farm-hibernate-title">农场休眠中</p>
              <p class="muted" style="font-size:13px">放假回来继续种植吧。</p>
              <button class="btn btn-soft" data-action="set-holiday-mode" data-mode="holiday" style="margin-top:12px">今天想学习</button>
            </section>`
        }
        ${hasRecords ? renderTodayReviewCard() : (holiday ? renderGuideCard() : "")}
        <section class="card mini-farm-card">
          <div class="mini-farm-header">
            <span class="farm-level-badge">Lv.${farmLv.level} ${farmLv.name}</span>
            <span class="farm-xp-hint">${nextLv ? `还需 ${nextLv.minHarvests - state.totalHarvests} 次收获` : "已达最高等级"}</span>
          </div>
          <div class="mini-farm-row">
            ${SUBJECTS.map((subject) => renderMiniPlot(subject, state)).join("")}
          </div>
          <div class="mini-farm-xp-track">
            <div class="mini-farm-xp-fill" style="width:${harvestPct}%"></div>
          </div>
        </section>
        ${holiday ? `
        <details class="home-focus-details">
          <summary class="home-focus-summary">
            <span class="material-symbols-outlined">timer</span>
            开始专注
          </summary>
          ${window.MochiPet?.renderTimer?.(holiday) || ""}
        </details>
        ` : ""}
      </div>
    `;
```

> ⚠️ 注意：上面的导入框 HTML 是完整复制自原来 `farm-side-area` 内的 import-card，务必与原始代码保持一致（placeholder 文字、data-action 值等）。如果原始 import-card 内容和这里不同，以原始文件为准，只改外层结构。

#### 步骤 B：更新 `refreshFarmSummary()` 的选择器

找到（约第 218–221 行）：
```javascript
  function refreshFarmSummary() {
    const view = document.getElementById("view");
    if (view && view.querySelector(".farm-layout-v2")) renderFarm(view);
    window.MochiPet?.renderMiniState?.();
  }
```

替换为：
```javascript
  function refreshFarmSummary() {
    const view = document.getElementById("view");
    if (view && view.querySelector(".home-flow")) renderFarm(view);
    window.MochiPet?.renderMiniState?.();
  }
```

#### 步骤 C：CSS 修改（`style.css`）

**新增 `.home-flow` 布局**（追加到文件末尾或 `farm-layout-v2` 附近）：

```css
.home-flow {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}
```

**新增专注折叠区样式**：

```css
.home-focus-details {
  border-radius: 16px;
  overflow: hidden;
}
.home-focus-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  cursor: pointer;
  background: var(--card-bg, #fff);
  border: 1px solid var(--border, rgba(0,0,0,0.08));
  border-radius: 16px;
  font-weight: 600;
  font-size: 15px;
  list-style: none;
  user-select: none;
}
.home-focus-summary::-webkit-details-marker { display: none; }
.home-focus-details[open] .home-focus-summary {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.home-focus-details[open] > *:not(summary) {
  border: 1px solid var(--border, rgba(0,0,0,0.08));
  border-top: none;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  padding: 16px;
  background: var(--card-bg, #fff);
}
```

**可选清理**（如果旧 CSS 不影响其他功能，可以删掉以下规则块）：
- `.farm-layout-v2 { ... }` （约第 4914 行起的约 5 行）
- `.farm-focus-area, .farm-side-area { ... }` （约第 4921 行起的约 5 行）
- `.farm-focus-area .timer-setup-card, .farm-focus-area .timer-focus-card, .farm-focus-area .timer-rest-card { min-height: 520px; ... }` （约第 4928 行起）
- `.farm-focus-area .timer-ring-wrap, .farm-focus-area .timer-ring { width: 180px; height: 180px; }` 
- 其余所有以 `.farm-focus-area` 为选择器的规则块（约 4921–4972 行）

> ⚠️ 删除前先确认这些 CSS class 没有在其他地方（非 farm-layout-v2 内）使用。

**验证**：
1. `node --check modules/farm.js` → 无报错
2. 浏览器打开首页（有历史记录）
3. 看到从上到下：streak 横幅 → 导入框 → 今日复习卡 → 迷你农场 → 「开始专注」折叠按钮
4. timer 默认折叠，点击「开始专注」展开，timer 功能正常（开始专注、自由模式等）
5. 导入一条记录 → farm 更新，streak 更新，均正常
6. 收获操作（mini-harvest-btn）正常
7. 在 980px 以下断点（移动端），布局仍然合理（max-width 600px 已处理）

---

## 全部改动完成后

### 1. 更新 `CLAUDE.md` 当前版本状态

追加：

```
### V3.1 激进简化：布局重构 + 页面下架 + 交互整合

- `modules/farm.js`：`renderFarm()` 改为单列 `.home-flow` 布局，删除 `farm-layout-v2` 两列结构；导入框升至第一位，迷你农场移至第三位，番茄钟折叠进 `<details class="home-focus-details">`
- `modules/farm.js`：`refreshFarmSummary()` 选择器从 `.farm-layout-v2` 改为 `.home-flow`
- `modules/reviewPage.js`：整页扁平化——删除 filter bar、删除三分区（今日建议/待处理/冷却）、删除展开/折叠逻辑；改为单一 `renderFlatList()` 函数，今日优先条目用绿色左边框 + 「今日」徽章区分
- `modules/reviewPage.js`：删除 `renderTodayTask()`、`renderTodayEmpty()`、`renderPendingList()`、`renderFilters()` 四个函数；删除 `STATE.subjectFilter`、`STATE.pendingExpanded`
- `modules/reviewPage.js`：`renderImportPanel()` 从 4步+回忆卡 简化为 2行提示文字 + textarea（rows=3）
- `app.js`：新增 `updateNavBadge()` 函数；在 `setActive()` 末尾和 `checkAndGrantAchievements()` 末尾各调用一次；`lotteryTickets > 0` 时在「勋章」导航按钮右上角显示数字红色徽章
- `app.js`：路由 `#schedule` 重定向到 `renderSeason(view)`
- `index.html`：删除侧边栏日历导航按钮
- `style.css`：新增 `.home-flow`、`.home-focus-details`、`.home-focus-summary`、`.nav-lottery-badge`、`.review-today-badge`、`.review-row-today`、`.review-panel-hint`；删除旧 `.farm-layout-v2` / `.farm-focus-area` / `.farm-side-area` 相关规则（约 50 行）
```

### 2. 更新 `Instruction/self-iteration.md` 第零步已解决列表

追加：
```
- V3.1：首页单列布局，timer 折叠入 details，导入框升至第一位 ✅
- V3.1：复习页扁平化，删 filter bar，删三分区，改 renderFlatList ✅
- V3.1：日历从侧边栏导航删除，#schedule 重定向到赛季页 ✅
- V3.1：勋章导航徽章，lotteryTickets>0 时显示红色数字 ✅
- V3.1：复习导入面板 4步+回忆卡 → 2行提示+大 textarea ✅
```

### 3. git commit

```
git add index.html app.js modules/farm.js modules/reviewPage.js style.css CLAUDE.md Instruction/self-iteration.md Instruction/plan-v31-radical.md
git commit -m "V3.1 radical: single-col home, flat review, no calendar nav, lottery badge, slim import panel"
git push
```

---

## 执行顺序

```
改动5 → 改动3 → 改动4 → 改动2 → 改动1
```

从低风险到高风险，每步完成后独立验证，不依赖后续改动。

**兜底**：执行前 `git stash` 或确认 `git status` clean，出现无法解决的 bug 时 `git stash pop` 回滚到执行前。

---

## 已知注意事项

1. **改动 1 的 import-card HTML**：原版本的 import-card 内容在当前 `renderFarm()` 的 `farm-side-area` 内。Agent 执行时必须先读取原始代码，确认 HTML 内容，不要使用本文档里的简化版本，要以实际代码为准。

2. **改动 2 删除 `renderTodayTask`**：确保 `scrollActiveReviewItem()` 不依赖该函数（它只依赖 `STATE.activeKey` 和 DOM 查询，安全）。

3. **改动 4 的 `checkAndGrantAchievements` 末尾**：在 app.js 里 grep 找到该函数，滚动到最后一个 `}` 前插入 `updateNavBadge()`。如果函数在 IIFE 内，注意缩进层级，不要误插到 IIFE 外。

4. **改动 1 的移动端**：原来 980px 断点 CSS（`.farm-focus-area { order: 1; }` 和 `.farm-side-area { order: 2; }`）在删除旧 CSS 后自然失效，不需要专门处理，`.home-flow` 是纯单列 flex。
