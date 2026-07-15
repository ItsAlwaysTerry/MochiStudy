# #8 正式移除赛季功能（执行计划，需你确认后做）

> 赛季对学生无用、已从首页下架（首页不再有赛季徽章，"学习数据"入口已改指向学习档案）。但赛季在代码里很深——**app.js 里约 315 处** `season/赛季` 引用。彻底移除是独立、可逆、要小心的活，**过夜只出计划、不动代码**。

## 现状：赛季牵扯哪些地方

- **常量/存储**：`CURRENT_SEASON_KEY="current_season"`、`SEASON_ARCHIVES_KEY="season_archives"`、`SEASON_TITLES`（16 级称号）、`GAME_CONFIG.season.titleThresholds`。
- **路由**：`#season`（和 `#schedule` 重定向到它）→ `renderSeason()`。
- **赛季页渲染**：`renderSeason` / `renderCurrentSeason` / `renderNoSeason` / `renderSeasonSnapshotCard` / `renderSeasonTitleItem` / `renderSeasonHeatmap` / `renderSeasonWeeklyChart` / `renderSeasonChart` / `renderSeasonArchiveRow`（app.js 1895-2530）。
- **管理后台**：`renderSeasonManager` / `renderAdminSeasonSection`（开启/结束赛季、写 snapshot）。
- **备份**：导出/恢复带 `current_season` / `season_archives`（app.js 5254、5343）。
- **导航**：`index.html` 底部导航/侧边栏是否还有赛季入口需确认；`renderNoSeason` 目前还承担"累计记录/学习天数/专注小时"的展示（V3.2）。

## 关键判断：别把"学习数据可视化"一起误删

赛季页里有**值得留的东西**：热力图 `renderSeasonHeatmap`、周趋势 `renderSeasonWeeklyChart/Chart`、`renderNoSeason` 的累计统计。这些是"学习数据可视化"，学生/家长有用。

**所以移除分两步：**

### 步骤 A：先保留数据可视化，砍掉"赛季"外壳（推荐先做）
- 新建一个轻量"学习数据"页（复用热力图 + 周趋势 + 累计统计），路由如 `#stats`。
- 首页"学习档案"入口旁或设置页给一个"学习数据"入口指向它。
- `#season` / `#schedule` 重定向到这个新页或到学习档案。
- **暂不删** `renderSeasonHeatmap` 等图表函数（被新页复用）。

### 步骤 B：删掉纯赛季的部分
- 删 `renderCurrentSeason` / `renderSeasonSnapshotCard` / `renderSeasonManager` / `renderAdminSeasonSection` / `renderSeasonArchiveRow` / 称号相关（`SEASON_TITLES` / titleThresholds / `renderSeasonTitleItem`）。
- 后台"赛季管理"section 移除。
- 备份**保留**读写 `current_season`/`season_archives`（向后兼容旧备份，别让老备份恢复报错），但导出时可以不再产生新赛季数据。
- 清 `current_season` / `season_archives` 的写入点（开启/结束赛季逻辑）。

## 数据安全
- **不主动删用户的 `current_season` / `season_archives` localStorage**（万一以后想回看）。只是代码不再读它做主流程。
- 备份恢复要容错：老备份里有赛季数据时不报错、忽略即可。

## 风险
- 315 处引用，删漏一处可能路由/后台报错。必须删一批、`node --check`、浏览器点一遍后台和各路由。
- `SEASON_TITLES` 若被别处（非赛季）引用要先确认（初步看只服务赛季）。
- 建议**先做步骤 A**（新数据页），确认可视化搬家成功，再做步骤 B（删壳），分两个 commit。

## 待你确认
1. 同意"先搬数据可视化到独立 `#stats` 页，再删赛季壳"这个两步法吗？
2. 后台的"赛季管理"直接删，还是保留隐藏？
3. 旧 `current_season`/`season_archives` 数据：只停用不删除（推荐），确认？
