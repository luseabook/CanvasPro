# 125i：`src/modules` OK 队列第 4 组落地记录

> 本专题记录 OK 队列第 4 组的成组落地。判据同前三组：每件模块的相对 import 目标都能在本仓找到，且导出闸门 `MISSING_TOTAL=0`。**全部落地不接线**：从入口沿相对 import 走不到它们，运行时行为、UI、联调一概未变；本批没有提交、没有推送。
>
> 第 1–3 组见 `docs/src-modules-ok-batch125.md`、`-batch125g.md`、`-batch125h.md`。本组是对**全部 61 件未落地 OK 件**逐件跑闸门后筛出的 33 件可落件里的前 10 件（任务中心与媒体缩略图族）。

## 1. 第 4 组：落地清单

| # | 模块 | 字节 / 行 | SHA256 前 12 | 测试数 |
| --- | --- | --- | --- | --- |
| 1 | generationHistoryVideoThumbnails | 6019/164 | 6125e0c77cce | 11 |
| 2 | videoTimelineThumbnails | 12270/272 | 24a2cd81262f | 12 |
| 3 | taskCenterThumbnail | 1268/34 | bb842465ffac | 6 |
| 4 | taskCenterListView | 5619/107 | 4a456eb34e14 | 6 |
| 5 | nodeVideoElement | 1436/28 | b6e2bac5a503 | 7 |
| 6 | videoAspectRatioExecution | 4831/118 | dbf2e1b6d984 | 11 |
| 7 | modelApiVideoResolverPolicy | 3360/66 | a3188b5cf83b | 8 |
| 8 | materialComparisonImageCache | 4231/121 | c8b07ee67f7a | 8 |
| 9 | workspaceMediaDownload | 4822/126 | 9fc8ef51ba48 | 8 |
| 10 | workspaceWheelNavigation | 3997/94 | b1d132c25fd9 | 6 |

合计：10 件（源 47 853 字节 / 1130 行；测试 60 695 字节 / 1468 行，共 83 例）。

## 2. 第 4 组：候选池与闸门

- 本批先对**全部 61 件未落地的 OK 件逐件**跑 `b123-gate.mjs`（一次跑多件时 `MISSING` 行不标模块，必须逐件单独跑才不误配）：**33 件 `MISSING_TOTAL=0` 可落、28 件受阻**。
- 本批 10 件闸门口径：`MISSING_TOTAL=0`，共 20 条具名导入/再导出全部命中（证据 `b125i-gate.txt`）。
- 新增受阻件已并入 `docs/TRACKING.md` §7.3：`collaboration/collaborationNodeReference`、`interaction/interactionCommandAdapter`、`materialComparisonEntries`、`materialLibraryContextMenu`、`personReplacement/replacementStudioAccess`、`presetCoverResolver`、`providerApiKeyGuide`、`providerApiKeyMissingToast`、`runningHubApiKeyGuide`、`runninghubAiApp/customAiAppNodeBundleRegistry`、`runninghubAiApp/runningHubAiAppContextMenu`、`subscriptionAccessMissingToast`、`taskCenterMediaController`、`videoKeyingTaskRuntime`、`volcengineSpeechApiKeyGuide`、`workspaceEntityContextMenu`、`workspaceProjectPackageCoordinator` 等（另有前几批已记录的 `appTopbarCustomProviderPolicy`、`assetCoverResolver`、`cliLoginMissingToast`、`storyAgentComposition`、`emptyCanvasOnboarding`、`directorMultiView`、`directorViewportRuntime`、`storyEpisodeCanvas` 等）。
- 相对依赖全部已在 0.7.16 基线：`api/imageRatioPolicy.js`、`api/storyboardVideoFrameApi.js`；`src/services/` 的 `canvasMediaLocalService`、`desktopMediaBlobSource`、`downloadSaveService`；`src/utils/localMediaPath`、`src/utils/validators`；`src/manifests/index`；`src/components/videoFrameCapture`；组内 `loadingOverlay`、`workspaceHorizontalWheel`。
- prettier 暂存核对：本机 prettier 3.9.8 + `deobf-tools/prettierrc.json`，镜像格式化产物与仓库文件 **10/10 逐字节相同**（暂存目录 `deobf-tools/b125i/port/`）。
- `node --check` 20/20 通过（10 实现 + 10 测试）。
- bare node 下 `import` 10/10 成功。

## 3. 第 4 组：冻结行为与接入契约

1. `generationHistoryVideoThumbnails`
   - 主要导出：`resolveGenerationHistoryVideoPresentation`、`applyGenerationHistoryVideoThumbnail`、`createVideoThumbnailRequestQueue`。
   - 冻结行为：媒体地址取「记录 `localPath` → `outputItem.localPath` → 第一条节点的 `originalLocalPath`/`localPath`/`displayLocalPath`」归一后转 URL，再依次回落节点的 `videoUrl`/`sourceUrl`/`src`。海报候选顺序是「节点 `posterLocalPath` → 节点 `thumbLocalPath` → `outputItem.thumbLocalPath` → 节点 `posterUrl`/`thumbUrl` → 记录 `coverUrl` → 第一条条目 `thumbSrc`」，逐个过滤：候选与媒体地址相同（比对归一后的本地路径）或本身带视频扩展名（`mp4/webm/mov/m4v/avi/mkv`，允许带查询串）就不算海报。`needsBackfill` = 有本地视频地址但没找到海报。`apply...` 在没海报时**原样返回入参对象**；有海报时只改第一条节点与第一条条目（含其 `nodeData`），写 `posterUrl`/`thumbUrl`/`posterLocalPath`/`thumbLocalPath`/`videoThumbSrc` 与顶层 `coverUrl`、`thumbLocalPath`，**不就地改动入参**（节点/条目都是新对象）。请求队列：空地址直接拒绝（`Missing video thumbnail source`），同地址复用同一个 promise，并发上限非法值归 1，失败的任务不阻塞后续。
   - 接线时须接生成历史的视频缩略图回填链路。
2. `videoTimelineThumbnails`
   - 主要导出：`paintVideoTimelineThumbnailUrls`、`extractClientVideoTimelineFrameUrls`、`renderVideoTimelineThumbnails`。
   - 冻结行为：铺图按「槽位数」把地址均分——第 i 个槽取 `min(可用地址数-1, floor((i+0.5)*地址数/槽位数))` 号地址，并把**首个地址作为兜底**一起写进 `background-image`（命中地址在前、兜底在后，重复时去重）；同时打上 `dataset.thumbnailState`、`video-timeline-thumbnail` 类与 `aria-busy="false"`；槽位或地址为空时返回 0 且不写任何东西。渲染主流程的返回 `source` 取值：`empty`（没有槽位）→ `cancelled`（已被取代）→ 有海报先铺海报 → 没源时 `poster`/`empty` → 服务端出帧成功 `server` → 服务端失败回落浏览器出帧 `client` → 两条都失败时按有无海报给 `poster`/`empty`，`errors` 里按发生顺序累积两条错误。服务端返回里 `frames[].url`/`localUrl`/`localPath`/`path` 任一可用即可，`duration` 有效时回调 `onDuration`。客户端抽帧在**缺地址或没有 document 时直接返回空数组**；渲染中对每个槽位 await 一次 `waitForFrame`，任一次超时即整条链路失败。
   - 接线时须接时间线缩略图渲染宿主。
3. `taskCenterThumbnail`
   - 主要导出：`resolveTaskCenterThumbnail(entry, taskType)`。
   - 冻结行为：非对象直接返回 `null`。优先按 `images` → `videos` → `audios` 找第一个非空数组，找到就用它定种类（`image`/`video`/`audio`）与数量；都没有时把入参当单条，种类按任务类型文本正则推断（`/video/` → video、`/audio/` → audio、`/image|appearance/` → image，其余 `text`），数量恒为 1。缩略图只认**静态图扩展名**（`png/jpg/jpeg/webp/avif/bmp`）的候选，候选顺序是 `thumbLocalPath`/`thumbnailLocalPath`/`posterLocalPath`/`coverLocalPath`/`thumbUrl`/`thumbnailUrl`/`posterUrl`/`coverUrl`，都过 `localPathToUrl` 后取第一个静态图，取不到就给空串（不影响数量与种类）。
   - 接线时须接任务中心卡片缩略图。
4. `taskCenterListView`
   - 主要导出：`syncTaskElements(container, nodes)`、`createTaskCardView(taskId)`。
   - 冻结行为：`syncTaskElements` 先摘掉不在目标清单里的子节点，再按下标把清单里的节点 `insertBefore` 到位（`insertBefore` 会移动已有节点，所以顺序能被纠正）。`createTaskCardView` 组装出「头部（缩略图 + 标题/上下文/元信息 + 状态）+ 进度条 + 错误 + 远端 ID + 动作区」，缩略图 img 固定 `alt=""`、`decoding="async"`、`draggable=false` 且初始隐藏；`update` 写入文案与状态类（`v2-task-status v2-task-status--<status>`）、`aria-busy`、错误与远端 ID 的显隐（远端 ID 前缀固定 `API ID: `），进度按 `Math.round(progress*100)` 写宽度与 `aria-valuenow`；**激活但进度为 null 时**隐藏填充条、删掉 `aria-valuenow` 并交给 `startLoading`，否则 `stopLoading` 并写宽度。动作按钮按 `id` 复用（同一 id 第二次更新不会新建节点），按参数改类名（danger 加 `v2-task-card-action--danger`）、文案、`disabled`、`aria-busy` 与 `dataset.localPath`，pending 时走 `startLoading`；动作清空时整个动作区隐藏。
   - 接线时须接任务中心列表渲染。
5. `nodeVideoElement`
   - 主要导出：`resolveNodeVideoElement(root, index)`。
   - 冻结行为：按 `querySelectorAll('video')` 取全部候选，`index` 归一为 `max(0, trunc(Number(index)||0))`。判定优先级：`_0x3cb6f7`（有当前播放源，且类型命中时优先覆盖）→ `_0x51cdf9`（首个 class 含 `video-player` 或 `dataset.idx` 命中索引的元素）→ `_0x460e06`（首个可见元素：`display` 不为 none、`visibility` 不为 hidden、`opacity` 不是有限数或大于 0、且宽高都非 0）→ 第一个候选 → `null`。有当前源的元素会**立即返回**（不再往后看）。
   - 接线时须接节点视频元素解析（右键导出/抽帧等入口）。
6. `videoAspectRatioExecution`
   - 主要导出：`findVideoAspectRatioField`、`getConcreteVideoAspectRatioOptions`、`resolveVideoAspectRatioInput`、`resolveVideoAdaptiveAspectRatio`、`applyVideoAdaptiveAspectRatio`。
   - 冻结行为：比例字段先按 `displayRole === 'aspectRatio'` 找，再按 `id === 'aspectRatio'` 找，找不到给 `null`。具体比例只保留 trim 后**含冒号**且非自适应标签（`''`/`auto`/`default`/`adaptive`/`自适应`/`默认`）的选项。取值优先级：若字段 id 不是 `aspectRatio`，先查「节点 `generationParams[字段id]` → payload `generationParams[字段id]` → payload `[字段id]`」，再统一查「节点 `generationParams.aspectRatio` → 节点 `aspectRatio` → payload `generationParams.aspectRatio` → payload `aspectRatio`」，命中即返回（**显式 null 也算命中**），全没有才回落字段 `defaultValue`。自适应解析：没有具体比例选项时给空串；有 `displayWidth × displayHeight`（都为正）优先，其次 `sourceWidth × sourceHeight`，交给比例选择器；都没有时 `1:1` 优先，否则取第一个具体比例。`apply` 在找不到比例字段时原样返回；当前值不是自适应标签时原样返回；`extensions.ratioPolicy.preserveAdaptiveAtSubmit === true` 时**保留自适应标签**（清掉 `resolvedRatioLabel`，把标签写进 `aspectRatio`、`generationParams` 与专属字段 id）；否则解析出具体比例后写 `resolvedRatioLabel`、`aspectRatio`、`generationParams` 与专属字段 id，解析不出具体比例也原样返回。全程就地改写并返回同一个 payload 对象。
   - 接线时须接视频节点的提交前比例解析。
7. `modelApiVideoResolverPolicy`
   - 主要导出：`getModelApiVideoBodyResolverName`、`getModelApiVideoExtension`、`getModelApiVideoFamily`、`getModelApiVideoFamilyOptions`、`isModelApiVideoFamily`、`getModelApiVideoMaxInputVideoSeconds`、`isHappyHorseModelApiVideo`、`getHappyHorseModelApiVideoOptions`、`supportsHappyHorseModelApiVideoEdit`、`isSeedance2ModelApiVideo`、`isWan27ModelApiVideo`。
   - 冻结行为：前置闸门要求 `modelManifest.kind === 'video'`、`modelManifest.adapterType === 'modelApi'` 且 `executionManifest.adapterType === 'modelApi'`，任一不满足一律按「不是 modelApi 视频模型」处理。`bodyResolver` 只从执行清单扩展读。扩展查询要先查模型清单扩展、再查执行清单扩展，键 trim 后为空直接 `undefined`。family 只从模型清单扩展读；家族选项只有在查询的家族等于模型实际家族时才回原对象，否则回冻结空对象。`maxInputVideoSeconds` 取有限且大于 0 的整数，否则回落调用方给的兜底值。`supportsEdit` 只把严格 `false` 当假（缺扩展时算允许编辑）。
   - **本仓世代差异（重要）**：本仓 `src/manifests/**` 里**没有任何 manifest 定义 `videoFamily` 或 `maxInputVideoSeconds`**（`bodyResolver` 有，例如 `apimart/kling-video-o1`，但它同样在 model 清单里没有 family 键）。所以在本仓，家族相关的查询一律回落 `''`/`false`/空对象——这不是实现缺陷，而是清单还没升代。接线前必须先把 0.7.16 的 model 清单扩展补上，否则这些开关等于常关。
   - 接线时须接视频参数面板的家族开关与提交前校验。
8. `materialComparisonImageCache`
   - 主要导出：`getComparisonOriginalKey`、`createComparisonImageCache`、`getComparisonImageCache`。
   - 冻结行为：原图键 = `sourceId`（先条目主图后记录自身）与解析出的图片地址组成的 JSON 串，两者都空则给空串（不缓存）。缓存写入的门槛：代次必须等于当前代次、键与地址非空、图片 `complete` 为真、字节数（`naturalWidth × naturalHeight × 4`）有限且落在 `(0, maxBytes]`、`maxEntries >= 1`；同一张图重复放直接成功。入缓存时会把图片从原处 `remove()` 并在 `clear`/淘汰/过期/被同键替换时 `removeAttribute('src')`。淘汰策略是先按过期时间清理，再按插入顺序逐个淘汰直到同时满足字节与条目上限；被淘汰或替换且地址变了、且标记了 `revokeUrlOnClose` 的地址会被 `revoke`。`take` 先清过期再取出并删除（取走即失效），重复放同一地址时不会重复回收该地址。`clear` 推进代次并清空全部条目（此后旧代次的写入一律被丢弃）。`getComparisonImageCache` 按 `ownerDocument` 缓存实例，并只在首次创建时挂 `aicanvas:active-canvas-changed` 与 `pagehide` 两个清理监听。
   - 接线时须接素材对比视图的图片缓存。
9. `workspaceMediaDownload`
   - 主要导出：`buildWorkspaceMediaDownloadPayload`、`saveWorkspaceMediaDownload`、`renderWorkspaceMediaDownloadButton`、`runWorkspaceMediaDownloadAction`。
   - 冻结行为：只支持 `image`/`video`（`audio` 等一律 `null`），且媒体引用必须通过本地路径白名单（`data/uploads/`、`data/assets/`、`output/`），否则 `null`；默认文件名是「生成图片/生成视频」，默认标题是「下载图片/下载视频」；文件名基名会把 `\ / : * ? " < > |` 换成 `-`、折叠连续 `-`、去掉结尾的 `.`/空白/`-`、截到 96 字符（超长截断、空白回落默认名）；扩展名先看 `data:` MIME 映射（avif/gif/jpg/png/svg/webp/mp4/mov/webm），否则看地址扩展名（允许带 `?`/`#`），都没有才用 image→png、video→mp4。保存失败按三种情况给不同文案：没有引用「当前没有可下载的图片/视频。」、有引用但不落地「图片/视频尚未成功保存到本地，请重新生成后再下载。」、服务缺失「图片/视频保存服务尚未初始化。」。按钮渲染在 `enabled` 为假时给空串，否则输出固定 svg 图标按钮，`action`/`label`/`className` 全部过 HTML 转义（`&`、`<`、`>`、`"`、`'`）。下载动作在元素带 `is-pending` 类时直接返回 `null`（不重复触发），执行期间置 `disabled`、加 `is-pending`、写 `aria-busy="true"`，`finally` 里恢复原 `disabled`，并按「原本没有 `aria-busy` 就删掉、有就写回原值」收尾；动作抛错也会解锁并把错误抛出去。
   - 接线时须接工作区媒体下载按钮。
10. `workspaceWheelNavigation`
    - 主要导出：`hasWorkspaceScrollableOverflow`、`shouldPreserveWorkspaceNestedWheel`、`captureWorkspaceScrollPosition`、`restoreWorkspaceScrollPosition`、`captureWorkspaceNestedScrollPositions`、`restoreWorkspaceNestedScrollPositions`、`scrollWorkspaceTrackWithWheel`。
    - 冻结行为：可滚判定要求 `overflowX/overflowY` **严格等于** `auto`/`scroll`/`overlay`（大小写敏感）且该方向内容确实超出。`shouldPreserveWorkspaceNestedWheel` 先看 `closest(nestedSelector)` 命中且（没有边界或在边界内）就直接为真；否则从当前元素沿 `parentElement` 上溯，遇到任一可滚祖先即为真，遇到 `boundaryRoot` 或 `matches(boundarySelector)` 就停；拿不到 `getComputedStyle` 一律为假。滚动位置抓取把 `scrollTop`/`scrollLeft` 归一为非负数（非数字归 0），入参为空返回 `null`；还原要求元素与快照都在，返回布尔。嵌套位置按「选择器 + 序号」成对保存，选择器列表会 trim 去空；还原时按选择器缓存查询结果再按下标取元素，任一还原成功即整体为真，选择器或快照非法直接为假。轨道滚轮在空选择器时不接管（返回假）。
    - 接线时须接工作区横向轨道滚轮与页面切换时的滚动位置保留。

## 4. 第 4 组：验证结果

| 检查项 | 结果 | 证据 |
| --- | --- | --- |
| 候选池闸门 | 61 件未落 OK 件逐件跑：33 件可落、28 件受阻 | 本机实跑 |
| 本组闸门 | 10/10 `MISSING_TOTAL=0`（20 条命中） | `b125i-gate.txt` |
| prettier 逐字节 | 10/10 与 prettier(镜像) 相同 | `b125i/port/` |
| `node --check` | 20/20 通过 | 本机实跑 |
| bare node 导入 | 10/10 成功 | 本机实跑 |
| 本组单测 | 83 / 83 / 0 | 本机实跑 |
| src 全量回归 | 6663 / 6620 / 43（125h 后为 6580/6537/43） | `b125i-src-raw.tap` |
| src 失败名单 | 43 项与 `b85-fails.txt` 逐条相同，新增 0 消失 0 | `b125i-fails.txt` |
| api 全量回归 | 791 / 791 / 0（未变） | `b125i-api-raw.tap` |
| 消费方反查 | 真实命中 0 | 见下 |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` | 本机实跑 |

消费方反查的细节：按 10 个模块的文件名逐条扫描 `src`、`api`、`electron`、`main.js`，**没有任何文件引用这些新模块**；按导出名扫描时只有 `findVideoAspectRatioField` 在 `src/components/video-node/taskOrchestrationModule.js`（6 处）与 `api/adapters/ModelApiManifestNormalizer.js`（4 处）命中，经查是这两个**在用文件自带的同名私有实现**（模块是从它们里抽出来的），不是本批模块的消费方。这两处是未来的接线候选：实现已经在仓里了，接线时可直接替换私有副本，但要先按 §8 第 6 条核对世代差异并写清行为差异。

首跑记录：本组 10 个测试文件首跑 83 例中 5 例失败，全部定为**测试侧问题**——测试数据用了非法本地路径前缀（`normalizeLocalPath` 只认 `data/uploads/`、`data/assets/`、`output/`）、把「`insertBefore` 会把节点从旧位置移走」当成追加、把 `paintVideoTimelineThumbnailUrls` 的兜底地址顺序写反、把缓存 `expiresAt` 算错、拿 `assert.equal` 比两个不同的冻结空对象。改正后 83/83 全绿，**未改动任何移植实现**。

## 5. 第 4 组：未执行项与边界

- 本体未接线：10 件都没有接入任何入口，从入口沿相对 import 走不到，运行时零影响。
- 未跑变异测试。
- 已知边界（不改移植实现，仅记录）：`nodeVideoElement` 依赖全局 `window.getComputedStyle`，在无 window 环境会抛错；`modelApiVideoResolverPolicy` 的家族/时长开关在本仓清单里没有数据来源，实际恒为关闭（见 §3.7）；`taskCenterListView` 与 `materialComparisonImageCache` 的测试用最小 DOM 假件驱动，不代表真实浏览器行为已验收。
- 未启动应用、未构建、未联调、未提交推送。

## 6. 第 4 组：收尾与下一段

- 本批落地不接线，代码与 `docs/tracking/` 只做记录，不提交不推送。
- 落完之后，61 件未落 OK 件还剩 **23 件可落**（33 − 10）与 **28 件受阻**。
- 下一段继续 **OK 队列第 5 组**，从余下 23 件可落件里按能力区成组取件；受阻件要先解阻（升代既有件或补清单扩展），需另行授权。
- R01–R26 未完成，仍待后续批次逐条清账。
