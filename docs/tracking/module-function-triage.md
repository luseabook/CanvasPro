# 模块级 function 缺口分类（211 批）

口径：`check-port-parity.mjs` 的 `moduleFunctions` 段，37 条 / 25 文件（2026-10-23 快照）。
判定依据来自三项实测，不是估计：

1. **仓库调用点数**：全仓 2113 个 JS 文件里搜 `name(` → **37 条全部为 0**
   → 没有一条属于「仓库在调但没实现」的死调用，全部是「上游有、仓库从未接入」。
2. **上游同文件内部调用次数**：该函数是不是这个文件的现役逻辑（≥1 说明是）。
3. **上游消费方文件是否存在于仓库**：不存在 → 属于整块未移植，单独补必成死代码。

## A. 真缺（上游同文件在用，仓库对应位置是旧逻辑）—— 可逐条补

按上游内部调用次数排序，即「这个文件的现役逻辑有多依赖它」。

| 函数 | 文件 | 上游内部调用 | 可能影响 |
|---|---|---|---|
| ~~`chromeShellPoll`~~ **已补 212 批** | `services/desktopBridge.js` | 19 | 已实现：合并请求的事件轮询客户端 + 订阅层改长轮询（待真机） |
| `hasSharedCanvasImageAcquisition` ⚠ **需真机** | `components/SourceImageNode.js` | 5 | 判定「共享画布正在获取该图」并跳过自身加载。**风险高**：仓库缺这个概念，判错就是图片不显示 |
| ~~`mentionPattern`~~ **已补 213 批** | `modules/collaboration/collaborationChat.js` | 5 | 已实现：手打 `@名字` 也算提及（原先只认下拉点选）；边界与元字符有测试 |
| `getMascotTipText` | `modules/MascotManager.js` | 3 | 吉祥物提示文案 |
| ~~`setGenerateButtonIcon`~~ **已补 215 批** | `modules/previewGenerateButtonUi.js` | 3 | 已实现：图标相同时不重写 innerHTML（否则旋转动画每次刷新都从 0 度重来） |
| `formatShortcutBinding` | `modules/MascotManager.js` | 2 | 快捷键展示文案 |
| ~~`waitForStatusPoll`~~ **已补 214 批** | `services/smartClipJobService.js` | 2 | 已实现：中止统一翻译为 cancelled + 状态查询超时/断网**重试 3 次**（原仓库无重试，抖动直接判死） |
| `getPersonReplacementSourceProcessingMessage` | `modules/personReplacement/personReplacementProjectSession.js` | 1（+1 外部） | 素材处理中的进度提示 |
| `getPersonReplacementSourceProcessingProgress` | 同上 | 0（+1 外部） | 进程百分比 |
| `getFixedSlotLabelText` / `getRefSourceDisplayStateKey` | `components/video-node/referenceInputModule.js` | 1 / 1 | 固定参考槽标签、来源展示态 key |
| `executeSubmitTask` / `executeResumeTask` | `core/generationTaskRuntime.js` | 1 / 1 | 任务提交/续跑入口（该文件整体差 422 行，见 C） |
| `sanitizeAutoHiddenProviders` / `sanitizeProviderVisibility` | `core/stores/modelMenuPreferenceStore.js` | 1 / 1 | 模型菜单隐藏项清洗 |
| `resolveScaleConstraint` / `scalePositionAroundPivotAxes` | `modules/interaction/PanoramaSceneInteraction.js` | 1 / 1 | 全景场景缩放约束 |
| `preloadProviderIconAssets` | `modules/providerIconLod.js` | 1 | Provider 图标预加载 |
| ~~`presentSaveError`~~ **已补 216 批** | `modules/workspacePersistencePresentation.js` | 1 | 已实现：磁盘满/权限/中文透传/兜底四路映射，技术原文不再直接抛给用户 |

## B. 等价，不补（上游改了名/拆了函数，仓库已有同逻辑）

| 上游 | 仓库等价 | 判据 |
|---|---|---|
| `buildImageSchemaPayloadParams` | `buildModelApiSchemaPayloadParams` | 实参名不同、排除集合完全相同；差异只在放行条件（上游 `modelApi \|\| workflow`，210 批已在调用点补上） |
| `normalizePendingInputRef` + `normalizeMessageInputRef` | `normalizeInputRef` | 上游这两个函数**函数体逐字相同**（重复命名），等价于仓库的一个 |
| `resetProviderIconPreloadForTests` | — | 测试钩子；仓库未移植该预加载机制，随 A 类 `preloadProviderIconAssets` 一起处理或直接弃用 |

## C. 属整块升代（消费方文件在仓库不存在 / 该文件整体落后）

单独补这几个函数必然成为死代码，须按「块」成批。

| 缺口 | 所属未移植块 |
|---|---|
| `createVideoRangePlayheadReadoutView`、`createVideoRangeSelectionView`、`positionVideoRangePlayheadReadout` | **视频区间拖拽/选择**：`videoRangeSelectionController.js`(437 行)、`videoClipRangeDrag.js`(123)、`core/videoTimelineMath.js`(4 helper)、`VideoClipController` 第二处接线 均缺 |
| `insertStoryClipFrameAfter`、`createStoryClipFrameBatch` | **分镜帧插入**：消费方 `storyEpisodeMediaOperations.js` 在仓库不存在 |
| `executeSubmitTask`、`executeResumeTask` | `generationTaskRuntime.js` 1130 vs 上游 1552，差 422 行（完成反馈派发、项目 id 解析、spec 分类均已改写） |
| `hasStoryClipPreviewContent`、`createStoryClipVideoReferenceState`、`reuseStoryReplicationHomeSources`、`createTaskHistoryNotice`、`refreshMountedAIGenTextModelSelectors`、`syncSegmentRetakeController`、`clearModelServiceSettingsFieldReveal`、`canCreateConnectedNode`、`getRegisteredConnectionDecision` | 各自消费方存在但**从不调用它们**——说明仓库对应文件停在上游早期版本，属局部升代 |

## 结论与建议顺序

- **值得单独成批的 A 类**：`chromeShellPoll`（19 处、能力缺口明确）、`mentionPattern`（5 处、用户可感知）、`providerIconLod` 预加载、`modelMenuPreferenceStore` 两个清洗、`referenceInputModule` 两个 key。
- **B 类不必动手**：3 条，其中 2 条上游自己就是重复实现。
- **C 类必须成块规划**：视频区间拖拽、分镜帧插入、`generationTaskRuntime`；都不适合与小块混批。

复核方式：`node tools/check-port-parity.mjs --json` 取 `moduleFunctionRows`，
按上表名字比对；若某条已在仓库出现，说明已补，跑 `--update-baseline` 收紧。

## 复查记录（215 批，逐个核过但决定暂不补）

| 条目 | 复查结论 |
|---|---|
| `hasSharedCanvasImageAcquisition`（5 处） | 语义清楚（共享画布正在取图时本节点不重复加载），但仓库**完全没有共享获取这套机制**，`_assignImageDisplaySource` 是唯一出图路径。守卫判错 = 图片不显示，**必须真机验证**才能做，暂缓 |
| `sanitizeProviderVisibility` / `sanitizeAutoHiddenProviders` | 不是两个函数的事：`modelMenuPreferenceStore` 仓库 55 行 vs 上游 138 行，**provider 可见性/自动隐藏整块功能缺失**。单补会是死代码，应作整块升代 |
| `preloadProviderIconAssets` / `resetProviderIconPreloadForTests` | **上游自己也没有任何消费方**（全镜像 grep 为空）。属「上游遗留的未接线导出」，不建议补 |

## 复查记录（219–220 批）

| 条目 | 结论 |
|---|---|
| `canCreateConnectedNode` / `getRegisteredConnectionDecision` | **219 批已补**。原表判「消费方从不调用」是错的：`EdgeController.js` 仓库 3184 行 vs 上游 3196 行，只差 12 行——`isValidConnection` 与两处「连线建节点」菜单的接线缺了，而且 `registerNode` 的第三参数被整个忽略，节点类型根本无法声明策略。补函数 + 三处接线 +13/-1。目前 `registerNode` 无调用方（唯一调用方 `learning-route/routeCanvasEntry.js` 整块未移植），策略表恒空 → 守卫走默认放行 |
| `getMascotTipText` / `formatShortcutBinding` | **219 批已补**。原表只当「文案工具」，实际是**键位写死在文案里**的坑：换预设/改快捷键后提示一直教错按键。两语种 40 条文案同步换成占位符版 |
| `preloadProviderIconAssets` / `resetProviderIconPreloadForTests` | **220 批已补，且修正上表错误**：先前判「上游也没有消费方」是 grep 姿势错的——上游是在**同文件内**调用（`installProviderIconLodController` 里 `preloadProviderIconAssets()`），跨文件 grep 看不见。仓库 `appViewport.js` 已消费该控制器，所以这是活线。**教训：判「上游有没有消费方」必须连定义文件自己一起搜** |
| `sanitizeProviderVisibility` / `sanitizeAutoHiddenProviders` | 维持 C 类（整块升代）。整块 = `modelMenuPreferenceStore` 升级 + `modelMenuVisibility.js`/`modelCredentialUi.js`/`apiSettings.js` 三处消费 + **新建** `settings/modelProviderVisibilityControl.js`（仓库缺件）。单补两个清洗函数仍是死代码 |
| 上游 `dehydrateProviderIcon` 语义漂移 | 0.8.9 的 `dehydrateProviderIcon` 实际是**恢复**（把 dataset 里的 src 写回去、删 dataset、摘占位类），与函数名和 `shouldDehydrateProviderIcon` 的调用语义相反。推测是「四个图标太小 + 已预热 → 不再需要卸载」的取舍。220 批**没有跟进这个漂移**：只补预热，`dehydrate/hydrate` 保持仓库原语义，避免把低缩放下的行为一起翻掉 |
