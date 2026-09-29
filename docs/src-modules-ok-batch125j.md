# 第 125j 批：OK 队列第 5 组（图像输入与提示词族 10 件）

> 落地方式：只新增文件，不覆盖在用代码；本批**落地不接线**，运行时行为零变化。
> 落地时间：2026-09-28。上游镜像：`C:\Users\luobote\.qoder\tmp\shuo-deobf`（0.7.16 反混淆）。
> 上游批次台账：OK 队列第 5 组。落地依据：`b125/deps-modules.txt` 的 OK 段 + `b123/b123-gate.mjs` 逐件闸门。

## 1. 落地清单（10 件实现 + 10 件同名测试，94 例）

| 模块 | 实现字节/行 | sha256 前 12 位 | 用例 | 测试字节/行 |
| --- | --- | --- | --- | --- |
| `src/modules/generationPromptPolicy.js` | 4408/104 | 6c1ff7e0d595 | 11 | 5686/146 |
| `src/modules/imageFreeAngleAspectRatio.js` | 1611/46 | b7b2f8ef31a1 | 8 | 3188/91 |
| `src/modules/imageHdModelMenu.js` | 388/11 | ed118c2dc3db | 4 | 1923/47 |
| `src/modules/imageNodeImageUrl.js` | 2665/85 | 72bcecdd1b9f | 7 | 3606/81 |
| `src/modules/imageOverlayViewportPreview.js` | 1788/44 | cd3b6fa43439 | 6 | 4348/101 |
| `src/modules/promptAssetInputRefs.js` | 10131/240 | 9404b3f4394e | 15 | 9890/238 |
| `src/modules/promptPasteVirtualization.js` | 5542/135 | 5bdd611fefdb | 13 | 8549/204 |
| `src/modules/referenceInputThumbnail.js` | 6997/179 | 83b47994da36 | 14 | 7113/148 |
| `src/modules/characterAssets/characterAssetImageGeneration.js` | 1498/39 | d788216591b7 | 9 | 4051/84 |
| `src/modules/workspaceAssetPromptPresets.js` | 3433/76 | 3a45b5cc2c74 | 7 | 4524/83 |

源合计 38 461 B / 959 行；测试合计 52 878 B / 1 223 行。

`src/modules/characterAssets/` 是本批新建的目录（仓库此前没有同名或近名目录，已核对 `ls src/modules/ | grep -i character` 为空）。

## 2. 候选池实测与受阻件（本批取件依据）

对 51 件未落地的 OK 件**逐件单独跑闸门**（一次跑多件时 `MISSING` 行不标模块，只能逐件跑），得到确定排期：**23 件可落、28 件受阻**。本批取其中 10 件。

可落但本批未取的 13 件：`interaction/WheelPanController`、`interaction/dropTargetSpatialQuery`、`panoramaSceneNode/articulatedCharacterModel`、`panoramaSceneNode/scene3dGizmoVisual`、`panoramaSceneNode/scene3dPanoramaTexture`、`panoramaSceneNode/scene3dProceduralAssetVisual`、`storyWorkspace/storyCanvasMediaSync`、`storyWorkspace/storyCanvasSyncWorkspaceController`、`storyWorkspace/storyReplicationRepresentativeFrames`、`toolbarPendingResultNodes`、`videoRetake/segmentRetakeModelPolicy`、`whiteboard/whiteboardBackgroundPreview`、`workspaceCanvasMaterialization`。

受阻 28 件（均为依赖件缺具名导出，解阻须升代既有件或补清单扩展，另行授权）：`app/appTopbarCustomProviderPolicy`、`app/storyAgentComposition`、`assetCoverResolver`、`canvasOnboarding/emptyCanvasOnboarding`、`cliLoginMissingToast`、`collaboration/collaborationNodeReference`、`interaction/interactionCommandAdapter`、`materialComparisonEntries`、`materialLibraryContextMenu`、`personReplacement/replacementStudioAccess`、`presetCoverResolver`、`providerApiKeyGuide`、`providerApiKeyMissingToast`、`runningHubApiKeyGuide`、`runninghubAiApp/customAiAppNodeBundleRegistry`、`runninghubAiApp/runningHubAiAppContextMenu`、`storyWorkspace/storyEpisodeCanvas`、`storyWorkspace/storyReplicationCardMotion`、`storyWorkspace/storyReplicationPortraitController`、`storyWorkspace/storyWorkspaceDeveloperDiagnostics`、`storyboard3d/directorMultiView`、`storyboard3d/directorViewportRuntime`、`subscriptionAccessMissingToast`、`taskCenterMediaController`、`videoKeyingTaskRuntime`、`volcengineSpeechApiKeyGuide`、`workspaceEntityContextMenu`、`workspaceProjectPackageCoordinator`。

## 3. 冻结的端口行为（写测试时逐条实测确认）

### 3.1 `generationPromptPolicy`

- `PROMPT_EMPTY_POLICIES` = `block` / `allowWithInput` / `allow`，两个常量对象都冻结。
- `countPromptCharacters` 先在 `trim` 后按**码点**计数，代理对只算 1（`'😀'.length` 是 2，这里返回 1）；`null` / `undefined` / 纯空白都返回 0。
- `resolveGenerationPromptPolicy` 拿不到清单（或清单里的 `prompt.emptyPolicy` 非法）时回落 `block` + `minLength 1` + `source: 'default'`；非法值**不会被改写**，仍随 `modelManifest` 原样带回。
- 默认放行的唯一通路：`adapterType === 'workflow'` 且 `[provider, modelManifest.provider, executionManifest.provider]` 归一后含 `runninghubwf`。
- `evaluateGenerationPromptBoundary` 的分支顺序：够长 → 放行；长度为 0 < len < minLength → `promptTooShort`；空 → 按空策略（`allow` 放行；`allowWithInput` 只在 `hasInput === true` 时放行，否则 `promptOrInputRequired`；其余 `promptRequired`）。
- 返回值里除 `ok` / `reason` / `promptLength` 外，还会把策略字段一起铺平带出。

### 3.2 `imageFreeAngleAspectRatio`

- 源尺寸候选键顺序：`originalWidth` → `imageWidth` → `imgWidth` → `naturalWidth` → 元素 `naturalWidth`（高度同构）；只接受有限正数，任一维度取不到就返回 `null`。
- 具体比例标签（如 `4:3`）`trim` 后原样返回；`''` / `auto` / `自适应` 等自适应标签走 `pickClosestRatioForProviderModel`，用源尺寸当宽高、`imageSize` 原样透传。
- 自适应判定用 `api/imageRatioPolicy.js :: isAdaptiveRatioLabel`，它对带空白的 `'  auto  '` 也判真。

### 3.3 `imageHdModelMenu`

- 唯一导出 `getImageHdModelIds()`：从 `listModelManifests()` 里筛 `kind === 'image'` **且** `adapterType === 'workflow'` **且** `extensions.imageHdMenu.enabled === true`，返回 `modelId` 数组（每次调用新数组）。

### 3.4 `imageNodeImageUrl`

- 三档地址的取值顺序（都先 `getPrimaryImageItem`，主图由 `mainImageIndex` 指定，非整数按 0，越界取不到）：
  - **预览**：节点 `displayLocalPath` → 主图 `displayLocalPath` → 节点 `previewLocalPath` → 主图 `previewLocalPath`，再退到同名的四个 `…Url`。
  - **展示**：先取预览结果，再 `thumbLocalPath` → `thumbnailLocalPath`，再退到 `thumbUrl` → `thumbnailUrl`。
  - **原始**：`originalLocalPath` → `localPath`，再退到 `src` → `sourceUrl` → `imageUrl` → `displayUrl` → `thumbUrl`。
- `resolveImageNodeUrl(node)` 默认 `original || display`；`{ preferPreview: true }` 时反过来。
- 本地路径走 `utils/localMediaPath.js :: localPathToUrl`，**只认 `data/uploads/`、`data/assets/`、`output/` 前缀**，其它前缀返回空串（写测试/接线时踩这个必失败）。

### 3.5 `imageOverlayViewportPreview`

- `mergeImageOverlayPreviewViewport(view, preview)`：`view` 不是对象 → `null`；`preview` 不是对象 / `x`、`y`、`zoom` 任一非有限数 / `zoom <= 0` → `null`；成功时数字被 `Number` 规整，`view` 的其它字段与旧 `viewport` 字段都保留。
- `bindImageOverlayViewportPreview`：缺 `windowObject.addEventListener`、或 `getView` / `updateView` 不是函数 → 返回空函数；否则挂 `aicanvas:viewport-pan-preview-frame`、**立刻套用一次**当前预览（`getCurrentPreview`，默认 `core/viewportPanPreview.js :: getViewportPanPreview`），返回的卸载函数移除监听。

### 3.6 `promptAssetInputRefs`

- 隐藏字段名 `promptAssetInputRefs`（常量 `PROMPT_ASSET_INPUT_REFS_FIELD`）。
- 提及类型把 `source-*` / `ai-*` 归一到 `text/image/video/audio`。
- 记录规范化：`assetId` 去空白必填；索引取 `itemIndex`，没有才用 `assetIndex`，必须是有限数并 `trunc` 后夹到 ≥ 0；类型归一后为空或是 `text` 就判非法（文本不算素材输入）。
- 三条来路（DOM 药丸 / 提示词 HTML / 节点隐藏字段）都要求 `resolveAssetMentionRef` 能解析到、且**声明类型与注册表里的实际类型一致**，否则丢弃。
- `assetRefSource` 分别是 `prompt` / `prompt` / `hidden`；页码 `assetMentionOccurrence` 按 `assetId:itemIndex:type` 递增。
- 一个实现细节：HTML 来路的 `promptAssetRefIndex` 因为默认值是 `null`、而 `Number(null)` 是有限数，所以**恒为 0**；隐藏字段来路才是真实字段下标。
- `getAssetInputRefsFromPromptAndNode` 默认不去重；`dedupe: true` 时同一 `assetId:itemIndex:type:assetRefSource` 只留一份，并把 `assetMentionOccurrence` 标成 `-1`。

### 3.7 `promptPasteVirtualization`

- 阈值 `65536`（64 KiB）、分块 `4096`（4 KiB）；`buildVirtualizedPromptPasteHtml` 每块一个 `<span class="prompt-virtual-chunk" data-prompt-virtual-chunk="true">`，末尾追加零宽结束标记 `<span class="prompt-virtual-paste-end" …>&#8203;</span>`，文本做 `& < >` 转义。
- `canVirtualizePromptPaste` 要同时满足：长度 ≥ 阈值、`documentObject.execCommand` 是函数、`documentObject.defaultView.CSS`（或全局 `CSS`）的 `supports('content-visibility','auto')` 为真。
- `serializeVirtualizedPromptHtml`：没有分块返回 `null`；文本转义、`br` 还原、`div`/`p` 保留包裹、`ref-pill` 走 `sanitizePromptHtml` 重建、危险标签（`iframe/object/embed/script/style/link/meta`）丢弃、结束标记跳过。
- 提交值的记忆只在存在分块时生效；没有分块会把 `_virtualizedPromptCommitValue` 清成 `null`。
- 插入走 `execCommand('insertHTML', false, html)`，成功后摘掉结束标记；有 `createRange` 与 `getSelection` 时用范围摘并把光标落回原处，否则直接 `remove()`；`execCommand` 抛错被吞掉并返回 `false`。

### 3.8 `referenceInputThumbnail`

- `resolveReferenceVideoItemByEdge`：没有 `videos` → `{ item: null, index: -1, matchedByKey: false }`；有 `sourceMediaKey` 时按键匹配（媒体键**去掉前导斜杠**后比对），命中则 `matchedByKey: true`；否则用 `mainVideoIndex`（非有限数按 0，越界夹回边界）。
- 缩略图优先级：选中项 `thumbUrl` → `thumbnailUrl` → `firstFrameThumbUrl` → `firstFrameUrl` → `imageUrl`；取不到时回退到 `mainVideoIndex` 那一项；顶层 `thumbUrl` **只在索引一致时**才用（键命中别处时不冒充）。
- 源路径：`type === 'ai-video'` 时优先用视频项，其它类型时顶层字段优先；两者都过 `localPathToUrl`。
- 媒体签名：选中项媒体键 → 顶层 `localPath` → `displayLocalPath` → `originalLocalPath` → `videoLocalPath` → `videoUrl` → `src`，都做去前导斜杠归一。
- `createReferenceInputThumbnailHtml`：`kind` 不合法返回 `''`；`text`/`audio` 走文字兜底块（`>TEXT<` / `>AUDIO<`）；`image`/`video` 没有地址时出图标兜底块；`video` 无缩略图但有 `videoUrl` 时出 `<video … preload="metadata">`；有缩略图时出 `<img … class="… is-pending">`。`additionalClassName` 会剥掉非 `[A-Za-z0-9_-]` 字符，地址做 HTML 属性转义，`extraHtml` 原样拼在末尾。

### 3.9 `characterAssets/characterAssetImageGeneration`

- `normalizeCharacterAssetImageGenerationParams(modelId, params)` = `sanitizeModelUiSchemaParams(modelId, params, { includeDefaults: true })`，仅当结果里**自有** `batchSize` 时把它改写成 `1`（人设图不支持批量）。
- `buildCharacterAssetImageGenerationPayload`：`model` 去空白；`provider` 用 `resolveModelProvider(model, provider)`（显式传入优先）；`providerProfileId` 只有非空才出现；`prompt` 去空白；`inputUrls` 去空白 + 去重 + 去空项；`aspectRatio` / `imageSize` 取自净化后的参数，缺省 `1:1` / `2K`；`batchSize` 恒为 1。

### 3.10 `workspaceAssetPromptPresets`

- 两张表都冻结，首项固定是 `{ id: 'none', label: '无', description: '直接使用当前提示词', template: null }`。
- 表体只收**能从 `PROMPT_PRESETS['ai-image']` 的「人设参考」/「场景参考」组里按标题找到**的项，并且都带非空模板；本仓解析出的 id 是 `none` + `character-three-view` / `character-three-view-face` / `character-analysis`（角色）与 `none` + `scene-four-view`（场景）。
- 找不到或传空 id 都回落到「无」；模板为空时应用函数只把提示词 `trim`，有模板时套进 `resolvePromptPresetTemplate`。

## 4. 检查结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| 导出闸门 `b123-gate.mjs` | 10/10 `MISSING_TOTAL=0`（19 条具名导入全命中） |
| prettier(镜像) 逐字节 | 10/10 相同 |
| `node --check` | 20/20 通过 |
| bare node 导入 | 10/10 成功，无顶层 DOM 副作用 |
| 本组单测 | **94 / 94 / 0**（首跑即全绿，未改任何移植实现） |
| 消费方反查 | 真实命中 **0** → 落地不接线（见 §6） |
| src 全量回归 | **6757 / 6714 / 43**（+94 例，与新增用例数吻合） |
| src 失败名单 | 43 项与 `b85-fails.txt` **逐条相同**，新增 0、消失 0 |
| api 全量回归 | **791 / 791 / 0**（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

证据文件（`deobf-tools` 下）：`b125j-gate.txt`、`b125j-src-raw.tap`、`b125j-fails.txt`、`b125j-api-raw.tap`、`b125j/port/`。

## 5. 未执行项与边界

- 未启动应用、未构建、未联调；本批**不接线**，运行时行为零变化。
- 未提交、未推送。
- 未做变异测试（本批未跑 `b124*` 的变异工具）。
- 独立验证只覆盖离线单测这一级；运行验收、厂商验收都没做（见 TRACKING §7.5）。

## 6. 接线候选（本批新发现，须单独成批 + 用户授权）

按导出名反查时，命中集中在两个方向：

1. **`src/modules/nodePromptShared.js`** 里**自带私有副本**：`getAssetMentionRefFromPillNode`、`getAssetInputRefsFromPromptHtml`、`getPromptAssetInputRefsFromNode`、`getAssetInputRefsFromNodeData`、`getAssetInputRefsFromPromptAndNode` 在该文件里都是本文件定义的 `export function`（另有私有 `_normalizePromptAssetInputRefRecord`）。也就是说本批的 `promptAssetInputRefs` 正是从它里面抽出来的——**它是第一优先的接线候选**，但要先逐条比对两边行为差异（`nodePromptShared` 里还并着 i18n、素材提及候选等一整套逻辑，不能整块替换）。
2. **组件侧消费方**：`src/components/StoryboardScriptNode.js`、`src/components/video-node/taskOrchestrationModule.js`、`src/components/video-node/referenceInputModule.js`、`src/components/aigenImage/{uiModule.impl,taskOrchestrationModule.impl,stateSyncModule}.js`、`src/components/AIGenAudioNode.js`、`src/modules/fixedInputAssetRefs.js`、`src/modules/promptAssetInputOverride.js` 各自调用**同名局部函数**，同样是抽取源。

其余 8 件（`generationPromptPolicy`、`imageFreeAngleAspectRatio`、`imageHdModelMenu`、`imageNodeImageUrl`、`imageOverlayViewportPreview`、`promptPasteVirtualization`、`referenceInputThumbnail`、`characterAssetImageGeneration`、`workspaceAssetPromptPresets`）在 `api`/`src`/`electron`/`main.js` 里**零命中**。

## 7. 世代差异（接线前必须先处理）

1. **`imageHdModelMenu` 在本仓恒为空**：`src/manifests/**` 里没有任何清单带 `extensions.imageHdMenu`，所以 `getImageHdModelIds()` 现在返回 `[]`。接线前必须先补 0.7.16 的图像清单扩展，否则接了也等于没开。
2. **`workspaceAssetPromptPresets` 的 6 条定义只解析出 4 条**：`PROMPT_PRESETS['ai-image']` 的「人设参考」组里没有 `character-front-back-view-face`，「场景参考」组里没有 `scene-nine-view`——这两条因找不到标题而被过滤掉。要补齐得先补 `promptPresets.js`。
3. **`characterAssetImageGeneration` 的 `batchSize` 守卫在本仓多数模型上不生效**：`sanitizeModelUiSchemaParams` 只对清单里有 `uiSchema.fields` 的模型返回参数；本仓 143 个模型里有 44 个带 `batchSize` 字段（如 `apimart/nano-banana-2`），这些才会走到强制改写。

## 8. 下一段

- **OK 队列第 6 组**：可落件还剩 13 件（清单见 §2），建议按能力区成组：分镜 3D 族 4 件（`panoramaSceneNode/*`）、交互族 3 件（`interaction/*` 2 + `toolbarPendingResultNodes`）、工作室族 4 件（`storyWorkspace/storyCanvasMediaSync` 等）、其余 2 件（`videoRetake/segmentRetakeModelPolicy`、`whiteboard/whiteboardBackgroundPreview`）。
- 28 件受阻件解阻需要升代既有件或补清单扩展，**另行授权**。
- R01–R26 仍未闭环，接线欠账（§6）与运行验收欠账（§7.5）未动。
