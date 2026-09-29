# 第 129 批：首波第二批（工作区下载、Beta 提示、复刻辅助、框选与快捷键）

> 第 127 批首波 260 件里的第二批（`src/modules` 余量再取 10 件），沿用 §4 单批工序，**落地不接线**。
> 源 10 件共 **18 024 B / 440 行**；测试 10 个同名件共 **45 618 B / 1 255 行**、**55 例**。

## 1. 落地清单

| 模块 | 源 B/行 | sha256 前 12 | 用例 | 测试 B/行 |
| --- | --- | --- | --- | --- |
| `storyWorkspace/storyWorkspaceBetaNotice` | 1199/21 | 8f95cd5fb364 | 4 | 3411/110 |
| `workspaceImageDownload` | 1314/48 | 12eeb1eea39f | 7 | 4765/127 |
| `workspaceVideoDownload` | 1326/48 | 2537599ebdb8 | 6 | 3989/97 |
| `personReplacement/replacementStudioBetaNotice` | 1281/27 | 69508a448446 | 4 | 3168/102 |
| `videoRetake/segmentRetakeModelPreference` | 1341/33 | 7b193fef3cb9 | 6 | 3980/86 |
| `storyWorkspace/storyAssetPromptPresets` | 1382/26 | c07a2242a0d6 | 4 | 3415/72 |
| `canvasShortcuts/shortcutPresentation` | 1965/39 | 0b27512242c2 | 6 | 4084/111 |
| `storyWorkspace/storyReplicationReviewThumbnails` | 2865/78 | 51c6c1b041ac | 5 | 5359/160 |
| `storyWorkspace/storyReplicationAssetFrames` | 2691/62 | 9340486a6d43 | 7 | 6762/191 |
| `storyWorkspace/storyMarqueeSelection` | 2660/58 | 3c9e6d67329b | 6 | 6685/199 |

## 2. 冻结的端口行为（写测试时的契约）

**两个 Beta 提示件**（`storyWorkspaceBetaNotice`、`replacementStudioBetaNotice`）：固定各自的 storage key（`aicanvas.storyWorkspace.betaNoticeSeen.v1` / `aicanvas.replacementStudio.betaNoticeSeen.v1`）与专属文案，`hasSeen`/`mark` 走**传入的 window**，展示件复用 128 批测过的 `workspaceBetaNotice` 管线（浮层 id 都是 `story-beta-notice-overlay`）。

**两个下载件**（`workspaceImageDownload`、`workspaceVideoDownload`）：全部**按 kind 委派**给 `workspaceMediaDownload`，默认值换成图片/视频口径（图片：`下载图片`、`download-asset-image`；视频：`下载替换视频`、`download-replacement-video`）。底层语义：

- `buildWorkspaceMediaDownloadPayload` 要求 `mediaRef` 是**合法本地路径**（`data/uploads/`、`data/assets/`、`output/` 前缀），否则 `null`；**不校验媒体类型**——把 `.png` 路径按视频口径出载荷也允许，扩展名沿用引用自身后缀。
- `saveWorkspaceMediaDownload` 的错误文案按 kind 分流：空引用「当前没有可下载的图片/视频。」；引用不合法「图片/视频尚未成功保存到本地，请重新生成后再下载。」；`saveMedia` 不是函数「图片/视频保存服务尚未初始化。」
- `runWorkspaceMediaDownloadAction(node, handler)`：node 为空或 handler 非函数返回 `null`；`classList.contains('is-pending')` 也会返回 `null`（防重入）；执行期间 `disabled=true`、加 `is-pending`、`aria-busy='true'`，结束后**恢复原状**。

**`segmentRetakeModelPreference`**：默认模型 `apimart/doubao-seedance-2.5`、storage key `v2-segment-retake-model`；读取时把存值过 `isSegmentRetakeModelSupported`，不受支持一律回落默认值；记忆只在该分段处于 `phase === 'editing'` 且模型受支持时写入。

**`storyAssetPromptPresets`**：4 个常量是 `workspaceAssetPromptPresets` 的**同一引用**（纯别名），get/apply 逐条转发；`none`/未知 id 统一落到 `{id:'none', label:'无', description:'直接使用当前提示词', template:null}`。

**`shortcutPresentation`**：`element(tag, className, text)` 空文本不写字；`createShortcutCard(shortcut, {preview})` —— 非 preview 是 `<button type="button" data-shortcut-id=… aria-label=名称>`，preview 是 `<div>` 且不带交互属性；描述优先级为**自带副标题 > 节点目录副标题 > 「添加预设节点和连线」**；`icon === 'template'` 时图标键映射到 `storyboard-script`；本仓图标目录没有对应键（`createNodeCreationMenuIcon` 返回 `null`），图标 span 保持为空。

**`storyReplicationReviewThumbnails`**：`bindStoryReplicationReviewThumbnails(state, data)` 返回 `{suspend, resume, destroy}`；用 `IntersectionObserver`（root=分段容器、rootMargin `120px`）懒加载：入队后**立即解除观察**；已有 `<img>` 的分段直接跳过；分批每次最多 6 个；抽样时刻 = `startSec + min(0.25, (endSec−startSec)/2)`，事件按 `dataset.replicationSegment` 在 `sourceAnalysis.events` 里找。

**`storyReplicationAssetFrames`**：`collectStoryReplicationAssetFrames({data, assets, projectId, sources, isActive, onProgress, capture})`。

- 只处理 `kind ∈ ['scene','prop']` 且 `replicationSource.episodeId` 存在的素材；**就地**给 `replicationSource` 写 `frame`/`frameError`（未处理的素材不加这两个键）。
- `sources` 一旦给出，就必须**命中同集且 revision 一致**，否则整体返回 `false`。
- 缓存键 = `episodeId:representativeTimeSec`，同键只截一次帧，各素材拿到**拷贝**。
- 失败逐条记录不中断：无视频「原视频不可用，请重新导入后提取素材。」；截图为空「原片截图未保存，请重新提取素材。」；异常用其 `message`。
- 进度文案「正在提取场景/道具原片截图 i/n」；返回值 = `isActive() && 所有守卫仍成立`。

**`storyMarqueeSelection`**：5 个几何/去重原语是 `workspaceMarqueeSelection` 的**原样别名**（阈值 5）；`createStoryAssetMarqueeConfig` 只在 `view==='project' && step===2` 启用，`commit(selectedIds)` 顺序为 `beforeCommit() → 按可见素材收敛（素材库视图只留带地址的 image/audio）→ 写 selectedAssetIds/assetSelectionMode → selectedAssetId 取最后一个（空则保留旧值）→ render()`；`createStoryMarqueeSelectionController` 注入 story 的默认选择器与 `getItemId`，但 root/documentObject/windowObject/getConfig 依旧必填。

## 3. 验证结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| prettier(镜像) 逐字节 | 10/10 相同 |
| `node --check` | 20/20 通过 |
| 导出闸门 `b123-gate.mjs` | 10/10 `MISSING_TOTAL=0`（34 条具名导入全命中） |
| bare node 导入 | 10/10 成功，无顶层 DOM 副作用 |
| 本组单测 | **55 / 55 / 0** |
| 消费方反查 | 真实命中 **0** → 确认「落地不接线」 |
| src 全量回归 | **7019 / 6976 / 43**（+55，与新增用例数吻合） |
| src 失败名单 | 43 项与 `b85-fails.txt` **逐条一致**，新增 0、消失 0 |
| api 全量回归 | 791 / 791 / 0（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

首跑 55 例中 **5 例失败**，全部是测试侧问题，未动移植实现：

1. 两个下载测试的相对导入写成了 `../workspaceMediaDownload.js`（测试文件在 `src/modules/`，应为 `./`）。
2. 视频下载测试以为 `data/uploads/a.png` 会被拒——实际底层**不校验媒体类型**，只校验路径前缀。
3. 素材帧测试以为未处理的素材 `replicationSource` 是 `undefined`——实际模块**就地改写**传入对象，未处理只是不加 `frame`/`frameError`。
4. 框选负例的报错顺序：依赖不全先报 `dependencies are incomplete`，`surfaceSelector` 缺失在 `itemSelector` 之前。

## 4. 世代差异与未覆盖路径

- **`segmentRetakeModelPreference` 的记忆路径在本仓不可达**：54 个视频模型没有一个声明 `extensions.segmentRetake`，`isSegmentRetakeModelSupported` 恒 `false` → 记忆永远为空、读取永远回落默认值。测试用两条用例把该差异钉死；将来清单补上能力后，写读回环需要重新验。
- `storyReplicationReviewThumbnails` 的**成帧分支**离线不可验：`extractClientVideoTimelineFrameUrls` 在 bare node 下解析为 `[]`（需要真实视频元素），所以本批只覆盖调度分支（观察/出队/跳过/暂停/销毁），缩略图 URL 回填走真机验收。
- `shortcutPresentation` 的图标分支同样受本仓图标目录限制（返回 `null`），`cover` 分支已覆盖。

## 5. 未执行项与边界

- 未启动应用、未构建、未做真机验收；本批**落地不接线**，运行时行为零变化。
- 未提交、未推送。
- 首波余量：**240 件**（`src/modules` 余 29、`src/core` 36、`src/components` 61、`src/manifests` 20 等）。

## 6. 证据文件

`deobf-tools/b129/port/`（10 件 prettier 产物）；回归证据 `b129-src-raw.tap`、`b129-src-raw.err`、`b129-fails.txt`、`b129-api-raw.tap`、`b129-gate.txt`。
