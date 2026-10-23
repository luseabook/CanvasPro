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
| `chromeShellPoll` | `services/desktopBridge.js` | 19 | chrome-shell 运行时只有单次 POST，缺**轮询**：更新状态、外部打开请求、打包进度、素材更新都拿不到 |
| `hasSharedCanvasImageAcquisition` | `components/SourceImageNode.js` | 5 | 共享画布图片获取能力判定 |
| `mentionPattern` | `modules/collaboration/collaborationChat.js` | 5 | 聊天里 `@所有人` / `@名字` 的识别与高亮 |
| `getMascotTipText` | `modules/MascotManager.js` | 3 | 吉祥物提示文案 |
| `setGenerateButtonIcon` | `modules/previewGenerateButtonUi.js` | 3 | 生成按钮图标切换 |
| `formatShortcutBinding` | `modules/MascotManager.js` | 2 | 快捷键展示文案 |
| `waitForStatusPoll` | `services/smartClipJobService.js` | 2 | 智能剪辑任务状态轮询 |
| `getPersonReplacementSourceProcessingMessage` | `modules/personReplacement/personReplacementProjectSession.js` | 1（+1 外部） | 素材处理中的进度提示 |
| `getPersonReplacementSourceProcessingProgress` | 同上 | 0（+1 外部） | 进程百分比 |
| `getFixedSlotLabelText` / `getRefSourceDisplayStateKey` | `components/video-node/referenceInputModule.js` | 1 / 1 | 固定参考槽标签、来源展示态 key |
| `executeSubmitTask` / `executeResumeTask` | `core/generationTaskRuntime.js` | 1 / 1 | 任务提交/续跑入口（该文件整体差 422 行，见 C） |
| `sanitizeAutoHiddenProviders` / `sanitizeProviderVisibility` | `core/stores/modelMenuPreferenceStore.js` | 1 / 1 | 模型菜单隐藏项清洗 |
| `resolveScaleConstraint` / `scalePositionAroundPivotAxes` | `modules/interaction/PanoramaSceneInteraction.js` | 1 / 1 | 全景场景缩放约束 |
| `preloadProviderIconAssets` | `modules/providerIconLod.js` | 1 | Provider 图标预加载 |
| `presentSaveError` | `modules/workspacePersistencePresentation.js` | 1 | 保存失败提示 |

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
