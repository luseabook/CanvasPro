# 第84批专题：渲染器索引与快速预览内核 `src/core/`（6 件零依赖落地不接线）

本批属于 **R15（渲染器/大图与稠密场景性能）** 行。0.7.16 端口里「稠密场景渲染调度」是一整片不含任何 `import` 的纯计算内核：边索引（可见性 + 命中）、快速预览准入/续接、栅格代理策略、媒体运行时预构建。本批把这 6 件**逐字节**落地并配离线测试，其余受阻部分按证据记账。

---

## 1. 本批要补的缺口

开工前实测：`src/core/` 下这 6 个文件名在本仓**均不存在**（`ls` 逐个 `NEW`），且全仓对 6 个模块名 **0 命中**（`grep -rn "core/<name>.js|from './<name>" src electron api main.js` 全 0）。即既无源码、也无任何引用点。

本批开工前重跑依赖闭合扫描（`b84/scan-closure.mjs` → `b84/closure-scan.json`）：端口 `src/**`+`api/**` → **1 162 缺失 / 557 闭合 / 605 受阻**；闭合集中有 **363 件零相对依赖**（自包含、无世代风险）。本批从零依赖簇里选「同一特性区、彼此协作」的 6 件成批落地。

## 2. 交付物

| 文件 | 行数 | 字节 | 依赖 | 说明 |
| --- | --- | --- | --- | --- |
| `src/core/rendererEdgeHitIndex.js` | 365 | 14 476 | 0 | 边命中：三次贝塞尔求值/点到曲线距离（采样+三分细化）、点到折线距离、网格空间索引（upsert/hitTest/queryCandidates/remove/clear/getStats） |
| `src/core/rendererEdgeVisibilityIndex.js` | 359 | 14 692 | 0 | 边可见性：1024 世界格索引 + 跨格边回退，低缩放全量渲染判定，几何签名哈希与缓存 |
| `src/core/rendererRasterProxyPolicy.js` | 235 | 9 196 | 0 | 栅格代理策略：密集低缩放强度、投影面积/紧凑度、栅格 ⇄ DOM 代理分配与覆盖签名 |
| `src/core/rendererFastPreviewAdmission.js` | 544 | 23 849 | 0 | 快速预览准入：候选分级/排序、立即创建预算、延迟队列、媒体 src 上限档位、运动前方预取 |
| `src/core/rendererFastPreviewContinuation.js` | 321 | 11 781 | 0 | 快速预览续接：生命周期修订计数、延迟同步判定、帧合并控制器（reset/shouldRunFullSync/syncIfNeeded/excludeNodes） |
| `src/core/rendererMediaRuntimePreparer.js` | 244 | 9 031 | 0 | 媒体运行时预构建：空闲调度、队列/已备上限与淘汰、暂停/恢复、失效跳过 |
| `src/core/rendererEdgeHitIndex.test.js` | 133 | 5 740 | — | 9 项 |
| `src/core/rendererEdgeVisibilityIndex.test.js` | 200 | 7 915 | — | 8 项 |
| `src/core/rendererRasterProxyPolicy.test.js` | 116 | 5 069 | — | 9 项 |
| `src/core/rendererMediaRuntimePreparer.test.js` | 227 | 9 683 | — | 10 项 |
| `src/core/rendererFastPreviewContinuation.test.js` | 356 | 12 729 | — | 12 项 |
| `src/core/rendererFastPreviewAdmission.test.js` | 248 | 10 445 | — | 11 项 |

6 件源码**逐字节等于端口**（`cmp` 全 `IDENTICAL`；`litdiff2` `onlyPort(0)=[]`/`onlyRepo(0)=[]`；`cmp-tokens` port=repo 且 matched 全等 4 036/1 761/2 663/2 668/1 793/1 803），保留原地反混淆的 `_0x` 局部名与端口书写风格（`!![]`、`Object['freeze']`、`Math['max']`、`0x` 十六进制、逗号表达式/返回元组）。

### 2.1 关键行为（供接线时对照）

- **贝塞尔命中**：`normalizeGeometry` 把缺失/非有限坐标归零，`hitPoints` 过滤后 **少于 2 点即丢弃**（回落曲线分支）；`evaluateCubicBezier` 把 `t` 夹到 `[0,1]`，非法几何返回 `null`。`distanceToCubicBezierSquared` 采样数下限 **8**、细化默认 14 次三分；采样网格 + 细化只减不增。
- **命中优先级**：`upsert` 拒绝空 `edgeId`/空几何（返回 `![]`），重挂同 id 先撤旧格；`hitTest` 先取格内候选，按 **`order` 降序 → `edgeId` 降序**取第一个满足 `d² ≤ tolerance²` 者。`queryCandidates` 同一排序（降序）。
- **可见性索引**：格边长 1024，单边跨格数 > **64** 时不计网格而进 `spanningEdgeIds`（查询时全量按包围盒判定；查询框跨格数 > `max(64, cells.size)` 时整体退化为遍历 `edgeBounds`）。包围盒 `minY = y + h/2`、`spanX = max(|x2-(x1+w1)|*0.5, 60)`；相交判定是**严格不等号**（故 `minY === maxY` 的水平边需查询框上下都留余量）。
- **缓存语义**：`getCachedEdgeVisibilityIndex` 在 `edges.length < threshold(96)` 时**清缓存并返回 `null`**；命中缓存要求「签名串 + 节点对象同一性」双匹配，签名 = `长度:edgesRev:geometrySignature或geometryRev`。`clearCachedEdgeVisibilityIndex` 同时清几何签名缓存。几何签名对**内容**稳定（换等价新对象仍同串），对节点位移敏感。
- **全量渲染签名**：`buildFullEdgeRenderSignature` 在「边数 ≥ 96 且无拖拽」时退化为 `compact:<n>:<rev>:<hash>`，否则逐边展开（缺端点写 `:missing`）；`dragIds`/`highlight` 为**排序后逗号连接**，非 `Set` 输入退化为空标签。
- **栅格代理**：`activationSignal = (1-(1-scenePressure)*(1-smoothstep(12,72,候选数))) * 平均紧凑度`，与 `activationFloor` 比较（存在 `previousRasterIds` 时下限 **0.24**，否则 **0.32**）；达标即**全部**候选转栅格，否则**全部**落 DOM 代理（全或无）。紧凑度阈值 0.2，投影面积门槛随密集强度在 3 000→14 000 间插值。`reason` 取值：`no-proxy-candidates` / `dom-required-only` / `below-raster-load` / `rasterized-all-proxies` / `mixed-raster-dom`。
- **快速预览准入**：`classifyCandidates` **就地**写入 `visible/motionAhead/motionFront/nearViewport/fullEligibleMotionAhead/order`；必需候选（选中/可见/运动前方/已挂载等）不计背景上限（512），非图/视频背景候选另受 48 上限。立即创建预算 = `max(resolveImmediateCreateLimit(候选数), min(必需未存在数, resolveRequiredImmediateCreateLimit(选项)))`，**已存在预览节点不占预算**，超预算的进 `deferredCandidates`。
- **媒体 src 上限档位**：`deferVisibleMediaSrc` → 2/1（含 `mediaSrcBatchLimit=2`、`videoMediaSrcBatchLimit=1`）；`viewportBusy` → 16/2；低优先级（`zoom ≤ 0.45`）→ 24（候选 ≥ 180 时 12）；常规 → 32/16。
- **续接控制器**：`shouldRunFullSync` 仅在 `hasPendingStructuralOps === true` 时按「签名键 + 节点同一性」去重（默认 `false` 时恒为 `true`）；`syncIfNeeded(deferFullSync)` 排队一帧、**后到者覆盖载荷**（`deferred-coalesced`），帧回调再走完整同步。探测事件 `deferred-created/deferred-flush` 由内部载荷生成，**不含** `deferFullSync` 字段（恒报 `false`）。
- **媒体预构建**：准入要求媒体类型 ∈ {`source-image`,`source-video`} 且节点数 ≥ 稠密阈值、有精确可见预览、非交互繁忙/优先、`deferMediaOnMount` 且允许空闲准备。调度优先 `requestIdleCallback`（超时 240ms），否则 `setTimeout(32ms)`；空闲余额 < 12ms 或交互繁忙（重试 120ms）即改期。队列上限默认 24、已备上限 4（超出时按插入序淘汰最旧并 dispose）。

## 3. 接线状态（零消费方，记账）

本批 6 件**全部落地不接线**，本仓**零生产消费方**（逐名 `grep` 均为 0）。原因：端口里这 6 件的调用方是渲染器池与快速预览宿主（渲染循环、边绘制、媒体挂载编排），属 R15 渲染器升代/接线批次；本仓这些宿主或不存在、或仍是旧世代。

按既定纪律：**不为「有引用」而擅自接线**，也不伪造消费方。缺口如实记账于本节与台账第84批记录。

## 4. 依赖闭合与目标选择审计

本批的选目标是两次过滤的结果，证据如下。

**(a) 否掉看似最优的 `src/components/media-clip`**：闭合扫描把它整片报为「闭合」，导出名对照也基本通过，但**端口与仓库同名兄弟文件互为不同世代**（`litdiff2` `onlyPort`/`onlyRepo` **双非空 ⇒ 互非超集**）：

| 文件 | 端口 literals | 仓库 literals | onlyPort / onlyRepo |
| --- | --- | --- | --- |
| `mediaClipState.js` | 1 004 | 138 | 124 / 9 |
| `mediaClipSourceResolver.js` | 194 | 82 | 61 / 18 |
| `mediaClipViewUtils.js` | 77 | 27 | 26 / 2 |
| `mediaClipTimelineInteractionController.js` | 85 | 18 | 23 / 1 |
| `mediaClipTimelineModel.js` | 135 | 0 | 49 / 0 |
| `mediaClipUtils.js` | 37 | 9 | 19 / 0 |

端口 `src/components/media-clip/` 有 16 件、仓库有 10 件（缺 6 件）。**替换在用兄弟文件是在用模块升代**，须单独成批 + 真机验证，本批不做。另 `mediaClipMaterialMenuView.js`（端口 3 109 B）依赖 `import {getShortcutLabel} from '../../modules/shortcuts.js'`，而本仓 `src/modules/shortcuts.js`（39 059 B）对该名 **0 命中**（本仓对应导出是 `settingsShared.js` 的 `getShortcutLabelByAction`）⇒ 亦受阻。

**(b) 继续受阻的渲染器前置**：`resolveRendererVirtualizationTier`（仓库 0 命中 / 端口 4）与 `resolveRendererLowZoomMountLimit`（仓库 0 命中 / 端口 5）仍是 pan-preview 家族（`rendererPanPreviewReconcile.js` 等）的网关，落地前提是 `rendererVirtualization.js` 升代——属「在用模块升代」，**须单独成批 + 真机验证**，本批不做。

**(c) 结论**：本仓自带一致性——**没有任何一条缺失但闭合的模块被现有仓库文件 import**（逐名 0 命中）。因此每批只能以「特性区自洽 + 可离线验证」立批，并把「未接线」如实记账，而不是靠修一条断链来立批。

## 5. 已执行的离线验证

全部为**离线静态检查**，未联网、未跑 Electron、未起服务、未打开真实窗口、未写任何仓库外运行状态：

- `node --check` × 6 源码 → 全 `exit 0`；纯 Node `import()` 冒烟 × 6 → 导出名清单与预期一致（共 5/4/10/4/2/2 个导出）。
- `prettier --check` × 12（6 源码 + 6 测试）→ 全过（6 个测试文件先 `--write` 一次，源码本身已在端口阶段格式化、无需改动）。
- 忠实性：`cmp` × 6 对端口 **逐字节一致**；`litdiff2` `onlyPort(0)=[]`/`onlyRepo(0)=[]`（portLits 342/102/226/178/111/121，unique 75/69/60/45/50/37）；`cmp-tokens` port=repo 且 matched 全等（4 036/1 761/2 663/2 668/1 793/1 803）。
- 测试：`node --test src/core/rendererEdgeHitIndex.test.js … rendererFastPreviewAdmission.test.js` → **59/59 全绿**（9+8+9+10+12+11）。首跑 **56/59**，3 处**期望写错**已修正、**实现未改**：①`deferred-created` 探测事件恒报 `deferFullSync:false`（内部载荷不含该键）；②把 `assert.deepEqual` 误写成 `assert.equal(...).toMatchObject(...)`；③`prune(['a1'])` 保留在集合内的已备项（预期应为 1 而非 0）。
- 回归：`src/**` 全量 **1 735/1 692/43 → 1 794/1 751/43**（恰好 +59/+59/0）；43 项失败的名字集合与 b81、b83 **逐行 `diff` 一致**（全部仍归属缺失夹具 `tests/testPreviewDom.js` 家族，不伪造）。本批**未触碰 `electron/`**（7 分钟窄窗 `find -mmin` 仅命中本批 12 个 `src/core/` 文件；沿用 1 649/1 648/1）。
- 快照：`0/67/491/0 → 0/67/503/0`（+12 = 6 源码 + 6 测试；专题文档另计 +1）。
- `api/freeImageHostApi.js` md5 `1e0458013f5341c99f21faefc1d34d3f` **未变**。

## 6. 未执行的验收项

- 未做 UI/渲染循环接线，故**未做**任何渲染级验收：未验证边命中是否真的替代了 DOM 命中、栅格代理是否真的落 canvas、快速预览帧合并是否真的减少了同步次数、媒体运行时预构建是否真的降低了首帧丢帧。
- 未真机运行 Electron、未做构建、未做大图/稠密场景压测（`MANY_EDGES_THRESHOLD=96`、`BACKGROUND_NODE_LIMIT=512`、`DENSE_...` 等阈值是否适配本仓实际场景未验）。
- `syncRendererFastPreviewAfterNodeRender` 依赖 `layer.getStats()/prune/isNodePreviewReady` 与 `continuation.syncIfNeeded` 的宿主契约，本仓宿主侧未对照验收。
- `globalThis.window.__runtimeCompareRecordFastPreviewContinuation` 探针对照工装本仓不存在，测试以临时挂载 `globalThis.window` 断言事件序列（`finally` 还原）。

## 7. 约束复核

- 未改 `api/freeImageHostApi.js`（md5 不变）；未改 `style.css`；未改 `src/i18n/messages/*`；未新增 npm 依赖。
- 未做批量覆盖式操作：本批为 6 件**新建**（`cp` 逐件指定文件名，且开工前 `ls` 确认目标 `NEW`）+ 6 件**新建**测试；开工前已 `git status` 记基线 `0/67/491/0`。
- 未 `git reset/clean/checkout`；未动 `D:\shuocancas`（端口资源仅只读）。
- 未伪造消费方（§3）。

## 8. 下一批建议

1. **b85 候选（同为闭零依赖簇）**：继续在 363 件零依赖闭合模块里按特性区成批落地——优先渲染器池外围（`rendererResizePreview` 相关、边绘制辅助）与媒体挂载辅助，仍走「导出名对照 + 世代对照（`litdiff2` 对仓库兄弟）+ 逐字节落地」三步。
2. **受阻解阻路径（均须单独成批 + 真机验证）**：①`rendererVirtualization.js` 升代 → 解 pan-preview 家族 2 名导入；②`canvasMediaLocalService.js` 升代（28 消费方）→ 解 `assetCoverResolver.js`/`nodeManagerListSnapshot.js`/`NodeManagerPanel.js`；③`src/components/media-clip` 6 件（同名兄弟升代）与 `mediaClipMaterialMenuView.js`（`shortcuts.js` 缺 `getShortcutLabel` 导出）。
3. 不变项：`main.js` chrome-shell 最终装配、`nodeBatchExport.toasts.*` 7 键 × 2 locale 补词（需授权改 `src/i18n/messages/*`）、后端 spawn 点切 `resolveBackendLaunchSpec`。
