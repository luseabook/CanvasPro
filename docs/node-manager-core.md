# 第82批专题：节点管理器无头内核 `src/modules/nodeManager/`（4 件落地不接线，2 件受阻记账）

本批属于 **R22（交互/节点管理/画布快捷操作）** 行。0.7.16 端口里的「节点管理器面板」是一个完整特性区：面板渲染（`NodeManagerPanel.js` 34 037 B）、批量导出（`nodeBatchExport.js` 13 217 B）、清单模型、拖拽复制、位置持久化。本批只落地其中**依赖已闭合、可离线验证的无头内核** 4 件，其余按闭合证据记账，不外扩范围、不伪造消费方。

---

## 1. 本批要补的缺口

端口 `src/modules/nodeManager/` 整个目录在本仓**不存在**；`src/modules/assetCoverResolver.js` 亦不存在。开工前实测：

- `ls -d src/modules/nodeManager` → 无此目录；
- `grep -rn "nodeManager\|NodeManager" src api electron main.js` → **全仓 0 命中**。

即这 6 个文件在本仓既无源码、也无任何引用点。本批目标是把其中**依赖闭合**的部分先原文落地并配离线测试，为后续面板装配（b83）备好被依赖的底座。

## 2. 交付物

| 文件 | 行数 | 字节 | 依赖闭合 | 说明 |
| --- | --- | --- | --- | --- |
| `src/modules/nodeManager/nodeManagerDragContract.js` | 4 | 214 | 0 依赖 | `NODE_MANAGER_DRAG_MIME` + `hasNodeManagerDragType(transfer)` |
| `src/modules/nodeManager/nodeManagerPlacement.js` | 7 | 448 | 0 依赖 | 位置枚举 `left/right/bottom` + `normalizeNodeManagerPlacement` |
| `src/modules/nodeManager/nodeManagerModel.js` | 216 | 8 745 | 1（`src/modules/nodeMeta.js` 已存在） | 清单树模型：稳定序读取、父子装配、环打断、过滤/搜索/折叠、计数 |
| `src/modules/nodeManager/nodeManagerDragController.js` | 103 | 4 272 | 2（`src/core/math.js` 已存在 + 同族 contract） | 拖拽复制：命中判定、偏移换算、`node.duplicate` 命令、行级 drag 事件装配 |
| `src/modules/nodeManager/nodeManagerDragContract.test.js` | 33 | 1 620 | — | 6 项 |
| `src/modules/nodeManager/nodeManagerPlacement.test.js` | 41 | 1 709 | — | 5 项 |
| `src/modules/nodeManager/nodeManagerModel.test.js` | 343 | 12 634 | — | 24 项 |
| `src/modules/nodeManager/nodeManagerDragController.test.js` | 268 | 9 539 | — | 16 项 |

四件源码**逐字节等于端口**（`cmp` 全 `IDENTICAL`），保留 `_0x` 局部名与端口书写风格（`!![]`、`Object['freeze']`、`0x` 十六进制、逗号表达式/返回元组）。

### 2.1 关键行为（供 b83 接线时对照）

- **清单模型**：`buildNodeManagerModel({nodes, filter, query, collapsedGroupIds})` 返回 `{filter, query, roots, items, rows, groupIds, totalNodeCount, visibleNodeCount, totalContentCount, matchingContentCount, visibleContentCount, totalGroupCount, visibleGroupCount}`；`rows` 与 `items` **同引用**（`model.rows === model.items`）。分类由 `nodeMeta` 的 `refKind` 决定，未归属类型落 `other`。
- **环打断**：分组 `parentId` 成环时，沿链取 `sourceIndex` **最小**者断链（`parentId` 清空）。三节点环 `a→b→c→a` 断 `a` 后，`parentId` 仍是 `b→c`、`c→a`，故展开链为 **`a → c → b`（b 深 2）**——与「按输入顺序成链」的直觉相反，已在测试中固定。
- **折叠语义**：折叠分组不计入 `visibleNodeCount`，但其子孙仍计入 `matchingContentCount`（过滤树先于扁平化计算）。
- **拖拽偏移**：`resolveNodeManagerDuplicateOffset` 用 `screenToWorld(clientX, clientY, viewport)` 减去源节点**中心**（`x + width/2`, `y + height/2`），返回世界坐标增量。
- **命中判定**：拖放需同时满足「非阻断区（`.node-manager-panel`/`.sidebar-floating`/`.header`/`.canvas-controls`/`[data-ui-stop="1"]`）」「落在画布容器 `getBoundingClientRect` 内」「`dataTransfer` 或内部 id 有节点 id」「id 命中 `graphStore` 现节点」。

## 3. 接线状态（零消费方，记账）

本批 4 件**全部落地不接线**，本仓**零生产消费方**。原因：整个节点管理器面板（`NodeManagerPanel.js`，面板装配与行渲染）属 b83，`main.js` 中 `createNodeManagerPanel({...})` 的宿主装配在本仓**不存在**。

按既定纪律：**不为「有引用」而擅自接线**，也不伪造消费方。缺口如实记账于本节与台账第82批记录。

## 4. 依赖闭合审计（受阻两件）

端口 6 件中另有 2 件**依赖未闭合**，本批不落地：

| 受阻件 | 行数 | 缺失依赖 | 受阻证据 |
| --- | --- | --- | --- |
| `src/modules/assetCoverResolver.js` | 249 / 10 216 B | `resolveCanvasVideoDisplayUrl`、`resolveCanvasVideoPosterUrl`（来自 `../services/canvasMediaLocalService.js`） | 本仓 `canvasMediaLocalService.js` 全仓 `grep` 对该两名 **0 命中**；且该服务已分叉为**不同世代** |
| `src/modules/nodeManager/nodeManagerListSnapshot.js` | 61 / 2 297 B | `./assetCoverResolver.js`（同族） | 传染受阻，随上游一并延后 |

`canvasMediaLocalService.js` 世代分叉实测：本仓 421 行（原地反混淆世代）vs 端口 1 行（0.7.16 压缩世代）；`litdiff2` 显示 **`onlyPort(72)` 与 `onlyRepo(32)` 均非空**——端口多出 `videoProxyVersion`、`pendingVideoProxyLocalPath`、`remoteFallbackUrl`、`videoProxyMigration*` 等 72 个字面量，本仓另有 32 个端口没有的字面量，**互非超集**。该服务有 **28 个消费方**。

⇒ 升级 `canvasMediaLocalService.js` 是对在用模块的**行为变更**，须单独成批 + 真机验证，本批不做（符合既有「在用模块升代须单独授权」纪律）。端口此件还新增导入 `./imageDerivativeService.js` 的 6 个函数——该 6 名本仓**均已导出**，故上游链并非不可达，但代价落在「替换 28 消费方共用的服务」上。

## 5. 已执行的离线验证

全部为**离线静态检查**，未联网、未跑 Electron、未起服务、未打开真实窗口、未写任何仓库外运行状态：

- `node --check` × 4 源码 → 全 `exit 0`。
- `prettier --check` × 8（4 源码 + 4 测试）→ 全过（2 个测试文件先 `--write` 一次）。
- 忠实性：`cmp` 4 源码对端口 **逐字节一致**；`litdiff2` `onlyPort(0)=[]`/`onlyRepo(0)=[]` 全空（portLits 4 / 7 / 140 / 76，unique 4 / 6 / 44 / 48）；`cmp-tokens` port=repo 且 matched 全等（34/34、58/58、1666/1666、813/813）。
- 测试：`node --test src/modules/nodeManager/*.test.js` → **51/51 全绿**（6 + 5 + 24 + 16）。首跑 50/51，1 处**期望写错**（三节点环的深度预期）已修正，**实现未改**。
- 回归：`src/**` 全量 **1 584/1 541/43 → 1 635/1 592/43**（恰好 +51/+51/0）；43 项失败仍**全部**归属缺失夹具 `tests/testPreviewDom.js`，不伪造。本批**未触碰 `electron/`**（沿用 1 649/1 648/1）。
- 快照：`0/67/471/0 → 0/67/480/0`（+9 = 4 源码 + 4 测试 + 1 专题文档）。
- `api/freeImageHostApi.js` md5 `1e0458013f5341c99f21faefc1d34d3f` **未变**。

## 6. 未执行的验收项

- 未做 UI 接线，故**未做**任何面板级验收：未验证行渲染、拖拽视觉反馈、`is-dragging` 类样式、面板位置切换事件 `node-manager-placement-changed` 的实际触发与布局回写。
- `executeCanvasCommand('node.duplicate', ...)` 的宿主返回值契约（`{ok, result:{ids}}`）以端口调用面为准，本仓 `canvasCommands` 侧未对照验收。
- 未真机运行 Electron/未做构建。

## 7. 约束复核

- 未改 `api/freeImageHostApi.js`（md5 不变）；未改 `style.css`；未改 `src/i18n/messages/*`；未新增 npm 依赖。
- 未做批量覆盖式操作：本批为 4 件**新建**（`cp` 逐件指定文件名），开工前已 `git status` 记基线 `0/67/471/0`。
- 未 `git reset/clean/checkout`；未动 `D:\shuocancas`。
- 未伪造消费方（§3）。

## 8. 下一批建议

1. **b83：节点管理器面板装配**——`NodeManagerPanel.js`（34 037 B）+ `nodeBatchExport.js`（13 217 B）+ `sharedIconMarkup.js`（3 025 B）+ `downloadNamingService.js`（469 B）+ `mediaDownloadFilename.js`（3 330 B），并在 `main.js` 装配 `createNodeManagerPanel({graphStore, wrap, canvasStage, executeCanvasCommand, ...})`。需先审计面板的 import 面（含 `sharedIconMarkup`、下载命名链）是否闭合。
2. **受阻件解阻路径**：若 `assetCoverResolver.js` + `nodeManagerListSnapshot.js` 要落地，前置是对 `canvasMediaLocalService.js`（28 消费方）做世代升代——**须单独成批 + 真机验证**，与 pan-preview 家族的 `rendererVirtualization.js` 升代同属「在用模块升代」一类。
3. 其余不变：`rendererVirtualization.js` 0.7.16 升代仍是渲染器池的前置网关。
