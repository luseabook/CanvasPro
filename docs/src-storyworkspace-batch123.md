# 第123批：`src/modules/storyWorkspace/` 依赖已齐件（分 123a / 123b，落地不接线）

批次：第 123 批（纯新增落地，零消费方不接线），按件数拆两段：123a、123b 均已交付，第 123 批完成
能力区：R06（剧本工作室：片段导出与截帧、片段输入槽位、分集剧本批量队列、复刻视频上限、剧本改动与过期守卫、视频缩略图回填等）
源：`C:\Users\luobote\.qoder\tmp\shuo-deobf\src\modules\storyWorkspace\`（0.7.16 反混淆镜像，只读）
暂存：`C:\Users\luobote\.qoder\tmp\deobf-tools\b123\port\src\modules\storyWorkspace\`（10 件源码已暂存并 prettier 格式化，含 123b 的 3 件）、`b123\tests\src\modules\storyWorkspace\`（测试副本）
前置：第 122 批落齐的 24 件纯叶。本批的件都带相对 import，依赖要么是第 122 批的件，要么是本仓在用文件

---

## 1. 重新分级与导出闸门

- 重跑 `b95/deps-ast.mjs src/modules/storyWorkspace`（输出 `b123\deps-storyWorkspace.txt`）：镜像 141 件，LEAF 24 / OK 8 / BLK 109 ⇒ **LEAF 0 / OK 14 / BLK 103**。新转 OK 的 6 件都是因为第 122 批的纯叶落地了。
- deps-ast 的 OK 只看依赖文件在不在，所以 14 件逐件过导出闸门。`b100/verify-exports.mjs` 只认 `import {…}`，漏掉了 `storyEpisodeScriptBatchQueue` 的 `export {…} from` 再导出；本批另写 `b123\b123-gate.mjs`（AST 版，覆盖具名、默认、命名空间导入和两种再导出），两者对其余 13 件的结论一致。

| 件 | 相对依赖 | 闸门 | 去向 |
| --- | --- | --- | --- |
| `storyClipExport` | `services/desktopBridge`、`services/canvasMediaLocalService` | 3/3 | 123a |
| `storyClipFrameCapture` | `components/videoFrameCapture`、`utils/localMediaPath` | 5/5 | 123a |
| `storyClipInputSlots` | `manifests/index`（只读取，不改受保护装配件） | 1/1 | 123a |
| `storyEpisodeScriptBatchQueue` | `./storyTaskBatchCancellation`（再导出） | 1/1 | 123a |
| `storyReplicationVideoLimits` | `manifests/modelRegistry` | 1/1 | 123a |
| `storyScriptRevision` | `./storyScriptImport` | 1/1 | 123a |
| `storyVideoThumbnailBackfill` | `api/videoResultThumbnailApi` | 4/4 | 123a |
| `storyClipFrames` | `utils/localMediaPath` | 1/1 | 123b |
| `storyClipProductionPresentation` | `./storyAsyncButtonPresentation` | 1/1 | 123b |
| `storyWorkspaceChromePresentation` | `./storyAsyncButtonPresentation` | 1/1 | 123b |
| `storyEpisodeCanvas` | 缺 `core/generationResultRenderer.js :: resolveGenerationResultSelection` | 3/4 | 受阻 |
| `storyReplicationCardMotion` | 缺 `core/math.js :: screenToViewportPoint` | 0/1 | 受阻 |
| `storyReplicationPortraitController` | 缺 `core/math.js :: normalizedMediaDragRect` | 1/2 | 受阻 |
| `storyWorkspaceDeveloperDiagnostics` | 缺 `services/diagnosticsService.js :: logDeveloperDiagnosticEvent` | 0/1 | 受阻 |

- 受阻的 4 件缺的都是在用文件的导出，补上就要升代在用文件，必须单独成批、经用户授权并真机验证（TRACKING §7.3）。
- 闸门结果原文：`b123\gate.txt`、`b123\verify-exports.txt`。

---

## 2. 依赖的世代核对（闸门只核对名字）

名字对得上不等于行为一致，所以本批把被 import 的函数和 0.7.16 镜像逐一对照：

| 依赖 | 结论 |
| --- | --- |
| `services/desktopBridge.js`、`api/videoResultThumbnailApi.js` | 镜像经 prettier 格式化后与本仓**逐字节相同** |
| `./storyTaskBatchCancellation`、`./storyScriptImport`、`./storyAsyncButtonPresentation` | 第 122 批移植件，同上逐字节相同 |
| `utils/localMediaPath.js` 的 5 个导出、`canvasMediaLocalService.js` 的 `isRemoteHttpUrl` 和 `resolveCanvasVideoLocalPath` | 两个版本的文件不同；在沙箱里对 61 个输入做差分，共 427 次比较、**0 处不同**（脚本在 `b123\evidence\`） |
| `components/videoFrameCapture.js` | **有世代差异**：本仓的 `captureVideoFrameSnapshot` 不认 `crop`，总是截整帧；`isVideoFrameReady` 不检查 `seeking` |
| `manifests/modelRegistry.js` 的 `resolveModelExecution`、`getModelManifest` | **有世代差异**：本仓不支持按显示名解析；provider 提示与带前缀的 id 不一致时解析失败，0.7.16 对带「/」的 id 直接精确命中。模型清单本身也不同，本仓只有 0.4.12 的模型 |

- 这两处差异只影响相应参数和调用方式，不影响本批落地。测试按本仓实际行为写断言，并标注「世代差异」；以后升代这两个在用文件时，这几条断言会先报出来。

---

## 3. 分段

| 段 | 内容 | 状态 |
| --- | --- | --- |
| 123a | 7 件逻辑件：`storyClipExport`、`storyClipFrameCapture`、`storyClipInputSlots`、`storyEpisodeScriptBatchQueue`、`storyReplicationVideoLimits`、`storyScriptRevision`、`storyVideoThumbnailBackfill` | **已交付**（#0032 源码、#0033 测试） |
| 123b | 3 件大件：`storyClipFrames`（18 KB）、`storyClipProductionPresentation`（30 KB）、`storyWorkspaceChromePresentation`（10 KB） | **已交付**（#0035 源码、#0036 测试） |

---

## 4. 123a 落地清单

| 文件 | 行 / 字节 | 镜像字节 | 具名导出 |
| --- | --- | --- | --- |
| `storyClipExport.js` | 144 / 5 531 | 4 703 | `buildStoryClipExportItem`、`buildStoryClipExportPlan`、`exportStoryClipVideos` |
| `storyClipFrameCapture.js` | 176 / 7 481 | 6 270 | `isStoryClipFrameCanvasSecurityError`、`captureStoryClipFrameFromSource`、`captureStoryClipFrameSnapshot` |
| `storyClipInputSlots.js` | 155 / 6 754 | 5 552 | `normalizeStoryClipInputs`、`buildStoryClipInputSlotViewModel`、`updateStoryClipInput` |
| `storyEpisodeScriptBatchQueue.js` | 49 / 1 918 | 1 592 | `createStoryEpisodeScriptBatchCancellationRegistry`（再导出）、`runStoryEpisodeScriptBatchQueue` |
| `storyReplicationVideoLimits.js` | 22 / 906 | 745 | `STORY_REPLICATION_MAX_VIDEO_BYTES`、`getStoryReplicationVideoMaxBytes`、`validateStoryReplicationVideoSize` |
| `storyScriptRevision.js` | 63 / 2 511 | 2 161 | 7 个：过期提示常量、标记过期、改正文、剧本比较键、两个断言、剧本守卫 |
| `storyVideoThumbnailBackfill.js` | 109 / 3 870 | 2 921 | `backfillStoryVideoThumbnails` |

- 合计 **718 行 / 28 971 B / 22 个具名导出**（镜像 23 944 B）。另有 7 个同名测试文件（1 502 行，69 例，依表中顺序为 13 / 12 / 12 / 9 / 5 / 10 / 8）。
- `storyClipFrameCapture` 的测试内联了一份最小假 DOM（video、canvas、body），约 150 行。本仓 `videoFrameCapture` 截帧时直接用全局 `document` 建 canvas，所以测试里临时替换 `globalThis.document`，结束后还原。
- 其余依赖一律走本仓真实模块：输入槽位和视频上限读 `src/manifests` 的真实模型声明，缩略图回填用 `videoResultThumbnailApi` 的真实判断，只把会发请求的 `ensureThumbnail` 换成替身。

---

## 5. 123a 冻结的端口行为（只记录，不打补丁）

- **`storyClipExport`**：命名为 `E集-C片段`，两位补零；编号取正整数并截断，非法时集号回落 1、片段号回落 clipIndex+1。
  - 只导出 `activeIndex` 指向的结果：先滤掉非对象再夹到有效范围，非数字按 0；当前结果带 error 视为没有视频。
  - 来源优先本地：displayLocalPath 最优先；代理转码（processing、waiting）时不用本地路径。没有本地来源时，取 videoUrl、url、displayUrl 里第一个 http(s) 地址。缺视频的片段记为 `NO_ACTIVE_VIDEO` 跳过项。
  - zip 名依次取项目的 name、title、storyTitle，都没有时用「剧本」。`\ / : * ? " < > |` 和控制字符换成下划线，折叠空白，去掉末尾的点和空格，截到 80 字。
  - 导出函数只收 `{ filename, items }`；返回值合并计划阶段和导出阶段的 skipped。不传导出函数时走 `desktopBridge.nodeExport.exportSelected`，Node 下没有桌面桥会报 `nodeExport.exportSelected unavailable`。
- **`storyClipFrameCapture`**：离屏 video 静音、inline、preload 为 auto，固定在 (-10000px, -10000px)；等画面最多 10 s，等定位最多 8 s；定位时间夹到 duration - 0.001；截图固定为 image/png。
  - 只有画布跨域污染（SecurityError、tainted canvas、insecure）才走回退：取 videoUrl、url、displayUrl、sourceUrl 里第一个 http(s) 地址交给 `saveOutputFromUrl`。扩展名依次看 MIME、地址后缀，都没有时用 mp4；maxBytes 为 512 MB，dedupeKey 为 `story-clip-video:` 加地址。存好后从本地副本重新截帧。
  - 回退路径不传 crop。无论成功还是失败，离屏 video 都会暂停、摘掉 src、重新 load，再从文档移除。
  - 世代差异见 §2：本仓截帧不认 crop，画面就绪判断不看 seeking。
- **`storyClipInputSlots`**：输入按 image、video、audio 三类规范化。单数键优先，复数键兜底；字符串当作 url；url 依次取 url、localUrl、imageUrl、videoUrl、audioUrl、localPath；slotId 取 slotId 或 refSlot。
  - order 能转成有限数就用它，否则用下标。小坑：`Number(null)` 是 0，所以 order 为 null 时得 0。
  - 视图模型只接受视频模型，否则抛「视频模型缺少 manifest：id」。槽数优先取 maxByKind，没有时取「固定槽数、输入数 + 1、minByKind、1」中的最大值。固定槽按 displayOrder 排在前面；必填指固定槽标了 required，或序号小于 minByKind。
  - 带 slotId 的输入先占位，同一槽位先到先得；其余输入依次补空槽，多出来的不显示。
  - `updateStoryClipInput`：先删掉同槽位的输入。index 只删该位置上没有 slotId 的输入。空值等于清空；新值的 order 等于剩余条数。返回新对象，inputs 只保留三类单数键。
  - 世代差异见 §2：provider 提示与带前缀的 id 不一致时解析失败。
- **`storyEpisodeScriptBatchQueue`**：按顺序执行，目标列表先复制。每个目标开始前检查 isLive。
  - runTarget 返回假值，或跑完后已经失活，都返回 interrupted，完成数不含当前目标。
  - 跑完一个目标后检查取消请求：已请求时，after 钩子的 pendingTargets 为空，返回 cancelled 和剩余数。取消登记表是第 122a 批 `storyTaskBatchCancellation` 的再导出。
- **`storyReplicationVideoLimits`**：默认上限 100 MB，provider 为 volcengine 的模型放宽到 500 MB。只看 provider，所以火山的图片模型也算。
  - `getModelManifest` 只做精确查找，不带前缀的 id 查不到。size 严格大于上限才报错；size 转不成数字时视为通过。
- **`storyScriptRevision`**：正文变化时重建 script，并重新切场次。场次 ref 的前缀依次取 script.episodeRef、planningRef、剧集 id；兜底标题取剧集标题；generatedAt 为当前时间。
  - 同时删掉 timingReview、endingState、continuityFacts，把剧集标记为 storyboardStale，并删掉拆分草稿和质检结果。
  - 比较键是 script 的 JSON。守卫在创建时读取 sourceMode：video-replication 项目直接用原对象，并且不做一致性检查；其余项目给深拷贝，assertCurrent 时对比剧本键。
  - 小坑：`assertStoryEpisodeScriptCurrent` 的 project 传 undefined 时抛 TypeError，不是提示文案。
- **`storyVideoThumbnailBackfill`**：只处理需要补图的结果，即有本地来源、但还没有本地图片缩略图的结果。按来源地址分组，每组只生成一次，用的是第一处引用。
  - 生成结果必须带稳定缩略图才写回。只合并 7 个缩略图字段，值为 null 或 undefined 的不写。
  - 写回前复核：原位置的来源没变，而且仍然没有缩略图。写回时把数组元素换成新对象，不改原对象。
  - 生成时抛错计入 failedCount；并发数夹在 1 到来源数之间；changedEpisodeIds 是 trim 后非空的剧集 id。
  - 小坑：同一个结果对象出现在两处时，只登记第一处，第二处不会更新。

---

## 6. 123a 实际做过的检查

| 检查 | 结果 |
| --- | --- |
| 重新分级 | deps-ast：LEAF 0 / OK 14 / BLK 103（§1） |
| 导出闸门 | `b123-gate` 14 件：10 件全部命中，4 件缺在用文件的导出；`verify-exports` 结论相同，但漏看 1 处再导出 |
| 依赖世代核对 | 2 个依赖逐字节相同，2 个依赖差分 427 次 0 不同，2 个依赖有世代差异（§2） |
| 暂存核对 | 镜像经 prettier 3.9.8 格式化后与暂存逐字节一致 10/10（`b123\b123-stage.mjs --check`，含 123b 的 3 件） |
| 暂存 ↔ 仓库逐字节比对 | 源码 7/7、测试 7/7，`apply_patch` 返回的 SHA256 与本地和 `Get-FileHash` 一致 |
| `node --check` | 14/14 |
| `prettier --check` | 14/14 |
| 自研测试 | **69 例**，沙箱（Node 20）预跑和本机（Node 24）首跑全绿；变异抽查 22 处，**22/22** 测出 |
| `src/**` sweep | **3 743 / 3 700 / 43 ⇒ 3 812 / 3 769 / 43**（+69），失败名集合与 `b85-fails.txt` 一致（新增 0、消失 0） |
| `api/**` sweep | 791 / 791 / 0 未变 |
| 消费方反向 grep | api、src、electron、`main.js` 区分大小写 **0 命中**。不区分大小写时有 4 处命中，都是旧件 `storyClipModel` 的 `createStoryClipExportGuard`，属误报。仓库根目录没有 `renderer.js` |
| 受保护文件 | md5 仍为 `1E0458013F5341C99F21FAEFC1D34D3F` |

- 写断言前，先用探查脚本确认了依赖给出的值，例如模型的槽位标签、本地文件 URL 的形式 `/output/…`。首跑没有改过任何期望，也没有改移植代码。
- 原文都在 `deobf-tools\b123\`：`b123a-tests.tap`、`b123a-src-sweep.tap`、`b123a-api-sweep.tap`、`closure.txt`（依赖闭包，沙箱预跑用）、`evidence\`（差分脚本、变异清单）。

---

## 7. 未执行项、缺口与下一段

1. **未执行 / 边界**：没有启动应用，也没有真机验证；7 件都没有调用方。截帧只在假 DOM 上验证过；导出只验证到把参数交给桌面桥，没有真实写出 zip。
2. **0.7.16 里的引用方**（都在 `storyWorkspace` 目录，仓库里都还没有）：
   - 主装配 `storyWorkspace` 引用了 Export、InputSlots、EpisodeScriptBatchQueue、ScriptRevision、VideoThumbnailBackfill。
   - `storyClipFrameCapture` ← `storyClipFrameProductionController`、`storyReplicationRepresentativeFrames`
   - `storyClipInputSlots` ← `storyClipInputWorkspaceController`、`storyClipProduction`、`storyProjectCanvas`
   - `storyReplicationVideoLimits` ← `storyVideoReplication`、`storyVideoReplicationWorkspaceController`
   - `storyScriptRevision` ← `storyClipProductionWorkspaceController`、`storyClipQualityPresentation`、`storyEpisodeSplitWorkspaceController`、`storyProjectPlanning`
3. **接线前要先解决的世代差异**：`videoFrameCapture` 的 crop 和 seeking、`modelRegistry` 的解析方式（§2）。这两个都是在用文件，升代要单独成批。
4. **123b 口径**：`storyClipFrames`、`storyClipProductionPresentation`、`storyWorkspaceChromePresentation` 已暂存格式化，闸门已过。落地、测试、sweep 的做法同 123a。（已完成，见 §8–§11。）0.7.16 里的引用方：`storyClipFrames` 有 6 个，`storyClipProductionPresentation` 只被主装配引用，`storyWorkspaceChromePresentation` 被 `storyCollaborationPresentation` 和主装配引用。
5. **之后**：`storyWorkspace` 剩下的 BLK 件要等更多前置件落地后再重跑 deps-ast；否则按 TRACKING §7.2 转 `collaboration` 的 13 个纯叶。

---

## 8. 123b 落地清单

| 文件 | 行 / 字节 | 镜像字节 | 具名导出 |
| --- | --- | --- | --- |
| `storyClipFrames.js` | 451 / 18 447 | 15 247 | 19 个：提及前缀和两种媒体类型常量、时间格式化、帧 id 与提及 id 的生成和还原、图片与媒体地址解析、单帧和列表规范化、图片帧与视频片段记录、增删、悬停素材、提及候选、提及解析 |
| `storyClipProductionPresentation.js` | 618 / 30 285 | 23 675 | `createStoryClipProductionPresentation`（返回冻结的 `renderAssetRail`、`renderDetail`、`renderOverview`、`resolveEpisodeCardMedia`） |
| `storyWorkspaceChromePresentation.js` | 157 / 9 738 | 8 545 | `createStoryWorkspaceChromePresentation`（返回冻结的 `renderFooter`、`renderToolbar`） |

- 合计 **1 226 行 / 58 470 B / 21 个具名导出**（镜像 47 467 B）。另有 3 个同名测试文件（1 318 行，45 例，依表中顺序为 19 / 17 / 9）。
- 两个渲染件的测试只断言输出的 HTML 字符串（用正则取开始标签和属性），不引入 DOM。`storyClipFrames` 的测试另写了一份独立的 FNV-1a，用来对照帧 id 里的哈希。
- 依赖：`storyClipFrames` 只用本仓 `localMediaPath` 的 `localPathToUrl`（§2 差分 0 不同）；两个渲染件只用第 122a 批的 `storyAsyncButtonPresentation`（与镜像逐字节相同）。

---

## 9. 123b 冻结的端口行为（只记录，不打补丁）

- **`storyClipFrames`**：帧 id 为 `story-frame-` 加哈希加毫秒时间。哈希是「片段 id:结果序号:来源键」的 32 位 FNV-1a，转 36 进制；各字段先 trim，序号取非负整数，时间保留 3 位小数。视频片段记录的 id 再接 `-video-结束毫秒`。
  - 时间格式为「分:秒.一位小数」，分钟不封顶。小坑：秒数四舍五入可能得到 60.0，例如 59.96 秒显示为 `00:60.0`。
  - 只有 mediaType（优先）或 type 为 video 时才算视频。
  - 图片地址依次取 imageUrl、displayLocalPath、localPath、originalLocalPath、thumbLocalPath。视频的预览图只看 thumbUrl、posterUrl、thumbnailUrl 和三种本地缩略路径。所以规范化视频帧时，传入的 imageUrl 会被覆盖，没有缩略图时变成空串。
  - 视频地址依次取 videoUrl、三种本地路径、sourceUrl。本地路径经本仓 `localPathToUrl` 转换，绝对路径和远程地址得到空串。
  - 规范化：缺 id 时按片段 id 生成，片段 id 缺省为「clip-序号」。名称缺省为「片段标题 · 时间」，视频为「片段标题 · 起–止」。视频的结束时间不早于开始；宽高取整且不为负；其余字段原样保留。
  - 列表规范化丢掉没有媒体地址的帧；同一 id 出现多次时，保留第一次的位置，内容用最后一次的。
  - upsert 替换同 id 后按 createdAt 从新到旧排序；新帧无效时，原列表只做规范化，不排序。
  - 提及候选先过滤：帧的分集和片段不在范围内的去掉，但没有分集或片段信息的帧保留。然后按片段分组：清单里的片段按清单顺序排，其余按首次出现追加；标签为「片段NN」。每组只出一个候选，组内其余帧放在 mentionVariants。
  - 查询去掉开头的 @，不区分大小写，匹配标签、副标题、胶囊文字、帧名、分集名，以及固定的「片段帧」。所以查「片段」会命中所有组。
  - 没有帧时给出「暂无片段帧」占位项；查询与「片段帧 视频截帧」无关时返回空。
  - 提及解析从元素的 dataset.assetId 或 data-asset-id 属性取 id。视频节点的时长优先用 videoDuration，否则用结束减开始。
- **`storyClipProductionPresentation`**：工厂可以注入 5 个依赖：localPathToUrl（默认只 trim）、isUsableImageUrl（默认非空即可）、renderImageOrEmpty（默认输出 img 或 is-empty 占位）、删除图标、卡片动作图标。
  - 卡片封面：逐个片段查视频结果。当前结果排第一（activeIndex 在滤掉非对象后夹取），带 error 的跳过；取第一个可用的 poster、thumb、thumbnail、cover 地址或对应的本地路径。都没有时用分集的 coverUrl，再没有就是 empty。
  - 分集卡片：生成模式有「生成分镜脚本」按钮；编辑模式整张卡是按钮，另附「重新生成」。选择模式只保留选择按钮，隐藏操作按钮、开发者操作和拆分草稿。拆分中显示转圈和遮罩；片段数为 0 时显示「待拆分」。
  - 分集页：description 为空串时不显示说明，未传时用默认文案。批量拆分进行中换成停止按钮，已请求停止时禁用并显示「正在停止」。没有卡片或批量控制为 disabled 时，全选和批量拆分都禁用。选择模式显示「拆分选中 (N)」，N 取整。
  - 素材栏：未知标签回落到「本集素材」。本集素材按角色、场景、道具分节，其他类型不显示。
  - 片段帧按片段清单分组；清单外的片段按 clipTitle 追加，缺省为「其他片段」；没有片段 id 的归入 unassigned。视频帧用 video 标签并带 poster。captureSavePending 严格为 true 时禁用删除，并标 aria-busy。
  - 总素材按 trim 后的 sourceAssetId 分组，缺省为 ungrouped；但按钮上的 data-story-reference-asset 用原值，不 trim。
  - 详情页：比例缺省为左 24、中 44。两个分隔条的 aria-valuenow 分别是 round(左) 和 round(左 + 中)，非数字按 0。多片段时预览区可以聚焦；传了 episodeRailMarkup 时外面再包一层复刻容器。
  - 小坑（读代码所见，未单独测）：删除按钮的 aria-label 直接拼帧名，name 缺失时会出现「undefined」；总素材缺 typeLabel 时，占位的 aria-label 同理。
- **`storyWorkspaceChromePresentation`**：工具栏分普通和分集（kind 为 episode）两种。项目名缺省为「剧本项目」；没有步骤时 data-step-count 为 3。
  - 小坑：步骤的 id 和编号原样拼进属性，不转义；标签会转义。
  - 分集切换器：有选项才出菜单和 aria-haspopup。当前页标 aria-current，否则带 data-story-open-episode。片段数原样输出。
  - 分集工具栏有两组菜单：加入画布（同步本集、同步整个项目）和导出（当前片段、本集全部）。canvasSyncPending 严格为 true 时，同步相关的 3 个按钮禁用并显示「加入中…」，导出菜单不受影响。
  - 页脚：actionsMarkup 替换默认按钮，leadingActionsMarkup 总在最前。忙碌时下一步按钮禁用、显示转圈，不带箭头。

---

## 10. 123b 实际做过的检查

| 检查 | 结果 |
| --- | --- |
| 暂存核对 | 123a 阶段已核对，prettier(镜像)==暂存（10/10 含这 3 件） |
| 导出闸门 `b123-gate` | 3/3 |
| 暂存 ↔ 仓库逐字节比对 | 源码 3/3、测试 3/3，`apply_patch` 返回的 SHA256 与本地和 `Get-FileHash` 一致 |
| `node --check` | 6/6 |
| `prettier --check` | 6/6 |
| 自研测试 | **45 例**，沙箱（Node 20）预跑和本机（Node 24）首跑全绿；变异抽查 21 处，**21/21** 测出 |
| `src/**` sweep | **3 812 / 3 769 / 43 ⇒ 3 857 / 3 814 / 43**（+45），失败名集合与 `b85-fails.txt` 一致（新增 0、消失 0） |
| `api/**` sweep | 791 / 791 / 0 未变 |
| 消费方反向 grep | api、src、electron、`main.js`、`index.html` 区分大小写 **0 命中**。不区分大小写时有 2 处命中，都是 `captureStoryClipFrameSnapshot`，属误报 |
| 受保护文件 | md5 仍为 `1E0458013F5341C99F21FAEFC1D34D3F` |

- 自查时改掉 1 处自己写错的断言：页脚转圈的类名写成了不存在的名字。这发生在首跑之前；首跑没有改过任何期望，也没有改移植代码。
- 原文在 `deobf-tools\b123\`：`b123b-tests.tap`、`b123b-src-sweep.tap`、`b123b-src-fails.txt`、`b123b-api-sweep.tap`。

---

## 11. 未执行项、缺口与下一批

1. **未执行 / 边界**：没有启动应用，也没有真机验证；3 件都没有调用方。两个渲染件只验证到 HTML 字符串，真实布局、样式和交互要等接线后真机验收。
2. **0.7.16 里的引用方**（都在 `storyWorkspace` 目录，仓库里都还没有）：
   - `storyClipFrames` ← `storyAssetAppearances`、`storyCanvasMediaSync`、`storyCanvasSyncWorkspaceController`、`storyClipFrameProductionController`、`storyClipMentions`、主装配 `storyWorkspace`
   - `storyClipProductionPresentation` ← 主装配
   - `storyWorkspaceChromePresentation` ← `storyCollaborationPresentation`、主装配
3. **第 123 批完成**：重新分级后的 14 件 OK 件落了 10 件，均未接线；另 4 件受阻（TRACKING §7.3）。
4. **收工后复跑 deps-ast**（`b123\deps-storyWorkspace-after123.txt`）：OK 7 / BLK 100。7 件里有 4 件是已知受阻件；另 3 件因本批落地而新转 OK：`storyCanvasMediaSync`、`storyCanvasSyncWorkspaceController`（依赖 `./storyClipFrames`）、`storyReplicationRepresentativeFrames`（依赖 `./storyClipFrameCapture`、`components/videoFrameCapture`、`services/projectService`）。它们还没有过导出闸门。
5. **第 124 批口径**：按 TRACKING §7.2 转 `collaboration`。`b95/deps-ast.mjs src/modules/collaboration` 的结果（`b123\deps-collaboration.txt`）是：镜像 38 件，LEAF 13 / OK 4 / BLK 21。
   - 先落 13 个纯叶。
   - 4 件 OK 件（`collaborationChatInput`、`collaborationLobby`、`collaborationNicknameEditor`、`collaborationSelect`）过闸门后再定。
   - 上面第 4 条的 3 件 `storyWorkspace` 新 OK 件也要过闸门并做依赖世代核对；尤其是 `storyReplicationRepresentativeFrames`，它依赖的 `videoFrameCapture` 有世代差异（§2）。
   - R10 在 TRACKING 里注明「需要先做服务端设计」。纯叶可以先落，但协作功能真正可用要等服务端。
