# 第 125e 批 · `src/modules` 直属纯叶（第 1–2 组，21 件）

> 承接 `docs/src-modules-leaf-batch125d.md`（125d）。125e 是把重跑后的 `b125e/deps-modules.txt`（`LEAF 47 / OK 109 / BLK 319`）里 **`src/modules` 直属目录**的 47 件零相对依赖叶成组落地。第 1 组（§1–§6）：语音分析/确认/片段编辑 5 件、提示词 3 件、视频抠像 2 件，共 10 件。第 2 组（§7–§12）：厂商档案 3 件、桌面更新策略 1 件、画布工具条放置 1 件、运行实例类型 1 件、任务中心 1 件、DOM/几何纯叶 4 件，共 11 件。逐件过导出闸门、prettier 暂存、逐字节落地、配同名 `node:test` 测试，**落地不接线**。
> 落地日期：2026-09-28。仓库文件路径一律 `src/modules/<name>.js`（两组 21 件都在 `src/modules` 直属目录，无二级目录）。

## 1. 落地清单

| # | 模块 | 字节 / 行 | SHA256 前 12 | 测试数 |
| --- | --- | --- | --- | --- |
| 1 | `audioVoicePanelEvents.js` | 68 / 1 | `1b72d18b7fe2` | 2 |
| 2 | `audioVoiceAnalysisSegments.js` | 2406 / 65 | `4e2839eab295` | 10 |
| 3 | `audioVoiceAnalysisSession.js` | 2033 / 53 | `e68bf97c6412` | 13 |
| 4 | `audioVoiceConfirmDialog.js` | 4046 / 86 | `a6fbdd4cc66d` | 9 |
| 5 | `audioVoiceSegmentEditSession.js` | 3449 / 95 | `f257b1907a2a` | 12 |
| 6 | `promptMentionMatcher.js` | 2686 / 65 | `2f7c5cd06810` | 20 |
| 7 | `promptReferenceSignature.js` | 267 / 6 | `105583399b94` | 7 |
| 8 | `promptTriggerComposition.js` | 1934 / 47 | `30c041a22d07` | 9 |
| 9 | `videoKeyingProjection.js` | 6407 / 157 | `6c98ef648473` | 20 |
| 10 | `videoKeyingSourceVideoLimit.js` | 826 / 22 | `02611dcf1781` | 5 |

合计新增 20 个文件（10 源 + 10 测试），24122 字节，597 行，**107 例**离线测试（其中 4 例是变异抽查收口时补写的边界用例，另有 1 例在既有用例里补了一条断言）。

## 2. 依赖与闸门

- 10 件在 `deps-ast` 分级里都是 LEAF（0 条相对 import），导出闸门报告「无相对依赖」，`MISSING_TOTAL=0`。
- 暂存用 `deobf-tools/b125e/stage.mjs` 复核：10/10 `prettier(mirror)==staged:true`，SHA256 与 §1 一致。
- 落地用 `cmp` 与暂存产物逐字节比对，`staged-identical` 10/10；镜像原文（未格式化）与仓库不同是预期，闸门比的是 `prettier(mirror)`。
- `node --check` 对 20 个文件全部通过。
- 只新增文件，未覆盖任何在用件；`api/freeImageHostApi.js` 的 MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f`。
- 消费方反查（`b125e/consumers.mjs`）：遍历 `src/api/electron/main.js/renderer.js` 共 1097 个非测试文件，10 件的模块名与 15 个导出名真实命中 0。

## 3. 冻结行为与接入契约

1. **audioVoicePanelEvents**：只冻结导出一个常量 `AUDIO_VOICE_PANEL_OPEN_EVENT = 'audioVoicePanel:open'`（命名空间 `:` 事件名，全文件 1 行）。语音面板的打开信号靠它跨模块广播，接线时须由面板与宿主共用此常量。

2. **audioVoiceAnalysisSegments**：`normalizeAudioVoiceAnalyzeSegments(payload, {normalizeSegment})`。`payload.segments` 非数组给 `[]`。逐段装配 `{id, startMs, endMs, sourceText, targetText, speakerId, speaker, sourceAudioLocalPath, sourceAudioUrl, sourceAudioReady:true, convertedAudioReady:false, activeAudio:'source', status:'detected'}` 后交给归一器；归一器默认 `normalizeSharedAnalyzeSegment`（展开原对象、把 id/startMs/endMs/sourceText/speakerId/speaker/sourceAudioLocalPath/sourceAudioUrl 强制成字符串或数字、`targetText` 强制空串），注入的 `normalizeSegment` 非函数时回落默认。装配侧：`speakerId` 取 9 个候选字段里第一个非空（`speakerId`、`speaker`、`speaker_id`、`spk`、`speakerInfo.speakerId`、`speakerInfo.speaker_id`、`speaker_info.speakerId`、`speaker_info.speaker_id`、`label`）并去空白；`speaker` 另取 6 个候选（`speaker`、`spk`、`speakerLabel`、`speaker_label`、`label`、已解析的 `speakerId`）；`id` 缺省为 `audio-voice-segment-<下标+1>`；`targetText` 恒为 `''`。

3. **audioVoiceAnalysisSession**：`createAudioVoiceAnalysisSession({cancelMediaTask})` 返回 `{begin, complete, getActive, invalidate, isActiveFor, isCurrent, trackTask}`。`begin({sourceNodeId, sourceKey})` 先作废上一会话（置 `invalidated`、经 `Promise.allSettled` 逐个 `cancelMediaTask` 撤一次任务）再建新记录 `{id: ++n, …去空白, taskIds: new Set(), tasksCancelled:false, invalidated:false}`。`trackTask(session, taskId)`：`taskId` 去空白后为空返回假且不做任何事；会话不是当前时先 `await cancelMediaTask(taskId).catch(()=>{})`（吞掉拒绝）再返回假；否则加入 `taskIds` 并返回真。`complete(session)` 只在当前时清空当前并置 `invalidated`，**不撤任务**。`invalidate()` 作废当前、清空当前并撤一次任务。`isCurrent` 要求对象为真、未作废、且仍是注册在案的那一个；`isActiveFor(nodeId)` 在此基础上再比 `sourceNodeId`。

4. **audioVoiceConfirmDialog**：`createAudioVoiceConfirmDialog({root, documentObject, windowObject})` 返回冻结的 `{confirm, close, destroy}`。`confirm({className, title, message, cancelLabel='取消', confirmLabel='确定', returnFocus})` 会先关掉既有弹窗（按假 resolve），再返回 Promise；拿不到 `body/root` 或没有 `createElement` 时直接 resolve 假。遮罩类名是 `('custom-confirm-overlay ' + className).trim()`；弹窗盒带 `role=dialog`、`aria-modal=true`、`aria-labelledby`/`aria-describedby`（每弹窗自增序号）；两个按钮是 `confirm-btn confirm-cancel`（经注入的 `setTimeout(…, 0)` 抢焦点）与 `confirm-btn confirm-ok`；取消/Escape 给假，确定/Enter 给真（Escape、Enter 都 `preventDefault`）；点遮罩自身给假；新的 confirm 会顶掉旧的。关闭时移除 keydown 监听、移除遮罩、只 resolve 一次（幂等）。`destroy()` 等于按假关闭。

5. **audioVoiceSegmentEditSession**：`createAudioVoiceSegmentEditSession()` 返回 `{begin, finish, getActiveCount, invalidateAll, isCurrent, isSegmentReserved, listActive}`。操作键 = `kind \x1f sourceNodeId \x1f segmentId`（三者去空白）；`begin(opts)` 在键重复、或与活动操作重叠时返回 `null`——重叠判定为「同 `sourceNodeId` 且任一侧的 `segmentIds` 含 `'all'` 或两侧有交集」；否则登记 `{id: ++n, key, …, segmentIds: [...segmentIds, segmentId] 去空白去重, payload: opts.payload ?? null, invalidated:false}`。`finish(op)` 仅在 `isCurrent` 时删除并作废；`isCurrent(op, nodeId=op.sourceNodeId)` 要求注册表里还是同一对象、未作废、`sourceNodeId` 相符；`listActive({kind, sourceNodeId})` 过滤未作废并按可选 kind/node 过滤；`isSegmentReserved(nodeId, segmentId)` 在该节点有活动操作覆盖 `'all'` 或该段号时为真；`invalidateAll()` 全部置作废并清空。

6. **promptMentionMatcher**：`matchPromptMentions(text, candidates=[])`。先用每个候选的 `label`/`refLabel`/`assetName`（跳过有 `pillKind` 或 `missingAsset` 的、去掉前导 `^[@＠]+`）建小写码点前缀树；候选身份键为 `asset:<assetId>:<assetIndex ?? 0>` 或 `node:<nodeId>`。扫描：命中 `@`/`＠` 且其前一字符不属于 `[a-z0-9_@＠.]`，按码点走树；取「有候选且其后续字符不是词字符（`[\p{L}\p{N}_-]`）」的最深节点——例外是 ASCII 字母数字后紧跟汉字也算边界；匹配名不含触发器；命中后不回头重扫；树内无候选可接受时降级为 `^[\p{L}\p{N}_-]+` 的整段普通名并给 `candidates: []`。返回按出现顺序的 `{start, end, name, candidates}`；共用一个标签的多个候选按身份键去重后同挂在一次匹配下。

7. **promptReferenceSignature**：`getPromptReferenceSignature(html='')` 取 `/<span\b[^>]*>/gi` 的全部标签，只留 class 命中 `\bclass=["'][^"']*\bref-pill\b`（大小写不敏感）的，用 `\n` 连接。非 span 标签与纯文本忽略；`ref-pill-2` 命中但 `ref-pilly` 不命中（词边界）。

8. **promptTriggerComposition**：`shouldSkipPromptTriggerForBulkInput(ev)` 在 `inputType` 属于 `insertFromPaste/insertFromDrop/insertReplacementText/insertHTML`、或 `typeof ev.data === 'string' && ev.data.length > 1` 时为真。`deferPromptTriggerUntilCompositionEnd({event, promptEl, triggerKey, onCompositionEnd})`：非组合态（`isComposing !== true` 且 `inputType !== 'insertCompositionText'`）→ 删掉该元素上这个 triggerKey 的挂起回调并返回假；元素不可用（无 `addEventListener`）或回调不是函数 → 返回真（挂但永不成帧）；其余情况重挂计时器并把回调按 triggerKey 存进该元素的 WeakMap 状态、返回真；`compositionend` 清掉计时器后在一个 `setTimeout(…, 0)` 里先取快照再清表、逐个执行。

9. **videoKeyingProjection**：`createVideoKeyingProjection({video, layer})` 在视频盒不完整（rect/元素尺寸/媒体尺寸任一非正或非有限）时给 `null`。`video` 几何是冻结的 `{rect, ew, eh, vw, vh, fit, scale, dw, dh, ox, oy, sx, sy}`：`fit` 仅在 `objectFit === 'cover'` 时才是 `'cover'`；`scale` 取 `ew/vw` 与 `eh/vh` 的 `max`（cover）或 `min`（contain）；`dw/dh` 为媒体尺寸乘 `scale`；`ox/oy` 为居中偏移；`sx/sy` 为 rect 宽/元素宽、rect 高/元素高。外层冻结对象为 `{video, layer, pickClientPoint, normalizedToLayerPoint, getVideoRectInLayer}`。`pickClientPoint(cx, cy)` 给 `{nx, ny, videoProjection}`（夹到 `[0,1]`）；contain 下落在有效视口（`ox…ox+dw`、`oy…oy+dh`）之外给 `null`；非数值坐标给 `null`。`normalizedToLayerPoint(nx, ny)` 需要可用图层（否则 `null`），先 `clampNormalized` 再经视频 client 矩形换算到图层空间。`getVideoRectInLayer()` 给 `{x, y, width, height}`，宽高下限 1px。`measureVideoKeyingProjection({videoElement, layerElement})` 读实时 `getBoundingClientRect` + `offsetWidth/offsetHeight`（视频侧**不回退** client 尺寸）+ `videoWidth/videoHeight`，`objectFit` 取自 `ownerDocument.defaultView`（或 `window`）的 computed style，缺省 `'contain'`；图层侧尺寸取 offset，为 0 时可回退 client。

10. **videoKeyingSourceVideoLimit**：`VIDEO_KEYING_MAX_SOURCE_VIDEO_BYTES = 30 * 1024 * 1024`。字段优先级 `videoSizeBytes`、`videoByteSize`、`fileSize`、`sizeBytes`、`byteSize`；`resolveVideoKeyingSourceVideoSizeBytes` 返回第一个「有限且为正」的 `Number` 值，否则 0；`isVideoKeyingSourceVideoTooLarge` 为**严格大于**上限；`getVideoKeyingMaxSourceVideoMB()` 返回 `30`。

## 4. 验证结果

- 10 个测试首跑全绿，经 prettier 复排后复跑仍全绿，合计 **107/107**（2+10+13+9+12+20+7+9+20+5）。
- 变异抽查（`b125e/mutate.mjs`）：**102 个变异全检出、0 存活、0 跳过**；10 个外部副本基线全绿、`restored=true`，只改副本。首轮 105 个变异检出 94、存活 11、跳过 2，收口方式：
  - 5 个存活者靠补断言转检出——`speakerId`/`speaker` 分离（`{speakerId, speaker}` 同时给且不同）、按码点推进（星面字符留在匹配名内）、词字符边界（数字/下划线/连字符跟随候选名应降级而非命中）、非方形媒体的 `nx` 归一（`vw ≠ vh`）、亚像素视频矩形的 1px 下限；
  - 6 个判定为**等价变异**并剔除（在公开行为上不可观测）：节点键前缀 `node:`/`nodeX:`、命中后回退一格重扫、降级名的索引推进、composition 计时器重挂、参考签名的默认入参与默认参数（`'' || ''` 与 `'x'` 都匹配不到 span）；
  - 2 个跳过者改用正确锚串：`forEach` 锚少了一个右括号（`…_0x26fb6a()));`）、`||` 与 `(` 之间被 prettier 折行。
- 原始 UTF-8 TAP 实跑（`b125e/sweep-raw.mjs`）：src **5273 / 5230 / 43**（较 125d 基线 5166 增加 107），43 项失败名与 `b85-fails.txt` 完全一致、新增 0 消失 0；api **791 / 791 / 0**。受保护 `freeImageHostApi.js` MD5 不变。
- 未启动应用、Electron，未构建，未联调，未提交或推送。

## 5. 未执行项与边界

- 10 件全部**未接线**：从 `index.html`/`main.js` 等入口沿相对 import 遍历都走不到，消费方反查 0 真实命中。
- `audioVoiceConfirmDialog`/`promptTriggerComposition` 直接依赖浏览器 `document`/`window`/`WeakMap`，`videoKeyingProjection` 依赖元素的 `getBoundingClientRect`/computed style，测试全用假宿主注入。
- `videoKeyingSourceVideoLimit` 的 30 MB 上限是本组唯一「数值型策略」件，接线时须与上传入口共用该常量，勿另抄字面量。
- 语音 5 件（R16 方向）缺媒体任务队列与面板装配；`promptMentionMatcher`/`promptTriggerComposition`/`promptReferenceSignature` 属 R17/R22 提示词链路，缺输入框与胶囊渲染装配；`videoKeyingProjection` 属视频抠像交互（R04/R22 方向），缺画布与取点交互装配。
- R01–R26 都没有完成。

## 6. 收尾与下一段

- 孤立台账 331→341 / 1093→1103；专题见本文件。
- 125e 队列 47 件，本组落 10 件，**余 37 件**（21 个 `workspace*` + `agnesProviderProfiles`、`assetCreateFly`、`autoUpdatePolicy`、`backgroundTaskCanvasSnapshot`、`canvasImageDisplayHandoff`、`canvasToolbarPlacement`、`clipboardMediaSignature`、`groupNodeLayout`、`imageOverlayReadiness`、`materialComparisonViewport`、`materialLibraryPolicy`、`minimaxProviderProfiles`、`modelMediaInputLimits`、`nodeCreationMenuIcons`、`runningHubInstanceTypes`、`taskCenterModel`）。接下来按能力区继续成组落地这 37 件直属叶，再转 **109 件 OK**（须先过导出闸门）。
- 7.3 受阻项与 15 件协作受阻件不变，须另行授权的生成件升级批；NodeReference 仍缺 `resolveCanvasVideoPosterUrl`。
- R01–R26 都没有完成。

## 7. 第 2 组：落地清单

| # | 模块 | 字节 / 行 | SHA256 前 12 | 测试数 |
| --- | --- | --- | --- | --- |
| 11 | `agnesProviderProfiles.js` | 1120 / 30 | `11c5f4a52cc5` | 9 |
| 12 | `assetCreateFly.js` | 2544 / 55 | `4f24f5e67a72` | 12 |
| 13 | `autoUpdatePolicy.js` | 1736 / 39 | `cd869e5a5840` | 14 |
| 14 | `backgroundTaskCanvasSnapshot.js` | 1414 / 37 | `834b69c2f99c` | 13 |
| 15 | `canvasToolbarPlacement.js` | 466 / 7 | `7c85dba00d59` | 4 |
| 16 | `clipboardMediaSignature.js` | 965 / 22 | `83639c7c1bfe` | 11 |
| 17 | `groupNodeLayout.js` | 2819 / 75 | `a2e89515e45a` | 16 |
| 18 | `imageOverlayReadiness.js` | 1364 / 33 | `43c8f4bbcadb` | 12 |
| 19 | `minimaxProviderProfiles.js` | 1167 / 30 | `71ef6a383a8e` | 9 |
| 20 | `runningHubInstanceTypes.js` | 1304 / 27 | `ab43dc42ff63` | 6 |
| 21 | `taskCenterModel.js` | 1521 / 37 | `f4ee605ba7d7` | 13 |

合计新增 22 个文件（11 源 + 11 测试），16420 字节，392 行，**119 例**离线测试（首跑 3 例期望写错、按落地实现改正后全绿）。

## 8. 第 2 组：依赖与闸门

- 11 件在 `deps-ast` 分级里都是 LEAF（0 条相对 import），导出闸门报告「无相对依赖」，`MISSING_TOTAL=0`。
- 暂存用 `b125e/stage.mjs --check` 复核：11/11 `prettier(mirror)==staged:true`，SHA256 与 §7 一致。
- 落地用 `cmp` 与暂存产物逐字节比对，`staged-identical` 11/11；`node --check` 对 22 个文件全部通过。
- 只新增文件，未覆盖任何在用件；`api/freeImageHostApi.js` 的 MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f`。
- 消费方反查（`b125e/consumers.mjs`，本次把第 2 组 11 件并入第 1 组的 10 件一起查）遍历 1108 个非测试文件，`TOTAL_CONSUMER_HITS=0`。

## 9. 第 2 组：冻结行为与接入契约

1. **agnesProviderProfiles**：冻结 `AGNES_MODEL_API_PROFILE_IDS=['agnes-domestic','agnes']` 与 `AGNES_MODEL_API_PROFILES`（两条记录各自冻结）。`getAgnesModelApiProfile(v)` 把 `String(v || '')` 去空白后查表，未命中回落国内档；国内 `region 'domestic'`、`apiUrl 'https://api.agnes-ai.cn'`，国际 `region 'international'`、`apiUrl 'https://apihub.agnes-ai.com'`，两者 `credentialLabel` 都是 `'API Key'`。

2. **minimaxProviderProfiles**：与 Agnes 同构，`MINIMAX_DOMESTIC_PROFILE_ID='minimax'`、`MINIMAX_INTERNATIONAL_PROFILE_ID='minimax-international'`，`getMinimaxModelApiProfile(v)` 同样「去空白 → 查表 → 回落国内」。国内 `apiUrl 'https://api.minimaxi.com'`、标签 `'MiniMAX官方（国内版）'`；国际 `apiUrl 'https://api.minimax.io'`、标签 `'MiniMAX官方（国际版）'`。

3. **canvasToolbarPlacement**：冻结 `CANVAS_TOOLBAR_PLACEMENTS=['left','right','bottom']`，默认 `'left'`，事件名 `CANVAS_TOOLBAR_PLACEMENT_EVENT='canvas-toolbar-placement-changed'`。`normalizeCanvasToolbarPlacement(v)` 用 `Set` 判成员，非成员（含大小写变体、带空白、null）一律回落 `'left'`。

4. **runningHubInstanceTypes**：`RUNNINGHUB_DEFAULT/PLUS/ULTRA_INSTANCE_TYPE` 为 `'default'/'plus'/'ultra'`，`RUNNINGHUB_INSTANCE_OPTIONS`（冻结数组，元素也冻结）给出 `24G/48G/84G` 三档，`RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES` 冻结值表。`normalizeRunningHubInstanceType(v)` 去空白 + 小写后只认 `plus`/`ultra`，其余回落 `'default'`；`getRunningHubInstanceTypeLabel(v)` 先归一再给 `'84G'/'48G'/'24G'`。

5. **taskCenterModel**：`ACTIVE_TASK_STATUSES={waiting,processing}`、`TERMINAL_TASK_STATUSES={complete,failed,cancelled,untracked}`。`normalizeTaskCenterStatus(v)` 去空白 + 小写后按五段映射：`untracked` 原样返回；`waiting/queued/paused → waiting`；`processing/running/submitting/pending/recovering/uploading/cutting/extracting-keyframes/detecting/identifying → processing`；`complete/completed/success/succeeded → complete`；`failed/error/interrupted → failed`；`cancelled/canceled → cancelled`；其余（含空串与非字符串）返回 `''`。`pruneTaskCenterRecords(records, limit=120)`：先按输入顺序取出 `waiting/processing` 的活动记录，再把其余按 `finishedAt || createdAt || 0` 降序排列并只留前 `limit` 条，拼成新数组返回（不改入参、不排序入参）。

6. **autoUpdatePolicy**：`AUTO_UPDATE_PRIMARY_ACTIONS` 冻结六动作。`resolveAutoUpdatePrimaryAction(state={}, {desktopUpdaterAvailable=false}={})` 按序判定：`previewOnly` 或没有 `hasUpdate` → `close`；`installDownloadedUpdate` → `install-desktop`；`retryDesktopDownload` → `retry-desktop`；`startDesktopDownload` 或 `desktopUpdaterAvailable` → `download-desktop`；`canHotApply` → `hot-apply`；否则 `unavailable`。`ensureDesktopUpdateAvailable(bridge)` 先 `getUpdateState()`，`available`/`downloaded`/（`error` 且有 `latestInfo`）直接返回；否则 `checkForUpdates()`，若 `skipped` 或 `ok === false` 抛 `desktop updater unavailable`；再取一次状态，仍不可用时抛 `desktop update not available`，否则返回该状态。

7. **groupNodeLayout**：`GROUP_NODE_CONTENT_INSETS` 冻结为 `{top:80, right:32, bottom:32, left:32}`。`createGroupNodeLayout({x,y,contentWidth,contentHeight,minWidth,minHeight})` 把非有限数值一律归零、宽高取 `max(0, …)`，宽 = `max(max(0,minWidth), left+contentWidth+right)`、高同理，并给出 `contentX = x + left`、`contentY = y + top`。`calculateGroupNodeBounds(nodes, {defaultNodeWidth=260, defaultNodeHeight=100, minWidth, minHeight})`：非数组当空、过滤 falsy 项，空表抛 `calculateGroupNodeBounds requires at least one node`；逐节点取 `x/y` 的最小值与 `x+width`、`y+height` 的最大值（宽高缺失或为 0 时用默认尺寸），再经 `createGroupNodeLayout` 包一层 insets，只返回 `{x,y,width,height}`。

8. **imageOverlayReadiness**：`waitForImageElementReady({image, onReady, onError, onTimeout=onError, timeoutMs=10000, setTimeoutFn, clearTimeoutFn})` 返回一个 cleanup。内部先挂 `load`/`error` 监听，再按 `max(0, Number(timeoutMs) || 0) > 0` 决定是否起定时器；无 `image` 时立即走 `onError`；`image.complete` 时按 `naturalWidth > 0` 走 `onReady` 或 `onError`。结算用一次性守卫：首次结算后摘掉两个监听、清掉定时器，之后的事件与定时回调全部忽略。cleanup 只摘监听并清定时器，重复调用不会二次清。

9. **clipboardMediaSignature**：`buildClipboardMediaSignature(blob, type = blob?.type)` 用 `crypto.subtle.digest('SHA-256', await blob.arrayBuffer())`，把每个字节 `toString(16).padStart(2,'0')` 拼成小写十六进制，返回 `'media:' + String(type).toLowerCase() + '|sha256:' + hex`；无 blob、无 `crypto.subtle` 或 `arrayBuffer` 抛错时返回 `''`。`clipboardImageBlobFromBase64(base64, type='image/png')` 用 `atob` 逐字节填 `Uint8Array` 后包成 `Blob`。

10. **assetCreateFly**：`playAssetCreateFly({fromElement, fromRect, contentElement, toElement, documentObject, windowObject})` 在「减少动态」生效、无 `document.body`、无 `toElement`、无 `contentElement||fromElement` 的 `cloneNode`、源矩形宽或高为 0、目标矩形取不到时都返回 `null`。否则建一个 `.v2-asset-create-fly` 的 `div`，按源矩形写 `left/top/width/height`，深拷贝内容元素并摘掉其 `id`，把层挂到 `body`；若该层没有 `animate` 则移除它并返回 `null`。动画从源矩形中心到目标矩形中心，位移按 `translate(dx,dy) scale(0.12)`、`opacity 1 → 0.2`、时长 520ms、`cubic-bezier(0.2, 0, 0, 1)`；`onfinish` 移除飞层，并在目标元素可动画时再放一组 `scale 1→1.08→1`、`brightness 1→1.2→1`、时长 260ms 的脉冲。返回该层元素（`onfinish` 挂在返回的动画句柄上）。

11. **backgroundTaskCanvasSnapshot**：模块级 `WeakMap` 按 store 存镜像（`canvas` + 四个版本号）。`captureBackgroundTaskCanvas(store, canvas, nodeId)` 读 `store.getStateRaw()`，当「传了 `nodeId`、镜像里的 `canvas` 与传入的同一个、`nodes` 里能找到该 id、store 有 `serializeNode`、且 `_persistRev === 镜像.persistRev+1`、`_contentPersistRev === 镜像.contentRev+1`、`_nodeMembershipRev === 镜像.membershipRev`、`_edgesRev === 镜像.edgesRev`」全部成立时，用 `serializeNode(nodeId)` 的结果替换 `canvas.nodes` 里那一项并浅拷贝 canvas；任一条件不成立就回落 `store.serialize()`。返回 `{snapshot, remember(canvas)}`，`remember` 把当前 canvas 与四个版本号写进镜像。

## 10. 第 2 组：验证结果

- 11 个测试首跑 **116/119**，3 处失败全在本文件期望侧：`assetCreateFly` 的假元素把 `animateCalls` 初始化成空数组（不是 `undefined`）、`backgroundTaskCanvasSnapshot` 两处把镜像版本号与 canvas `id` 写错；按落地实现改正后 **119/119** 全绿，经 prettier 复排（6 个测试文件被重排）复跑仍全绿。
- 变异抽查（`b125e/mutate.g2.mjs`）：**68 个变异全检出、0 存活、0 跳过**；11 个外部副本基线全绿、`restored=true`，只改副本。首轮 1 个跳过是锚串被 prettier 折行（`label: '48G' },` 实为 `value: …, label: '48G' }`），改准后检出。
- 原始 UTF-8 TAP 实跑（`b125e/sweep-raw.mjs`）：src **5392 / 5349 / 43**（较第 1 组基线 5230 增加 119），43 项失败名与 `b85-fails.txt` 完全一致、新增 0 消失 0；api **791 / 791 / 0**。
- 未启动应用、Electron，未构建，未联调，未提交或推送。

## 11. 第 2 组：未执行项与边界

- 11 件全部**未接线**：从 `index.html`/`main.js` 等入口沿相对 import 遍历都走不到，消费方反查 0 真实命中。
- `assetCreateFly` 直接依赖 `document`/`window`/`Element.animate`/`matchMedia`，`imageOverlayReadiness` 依赖 `addEventListener` 与定时器，`clipboardMediaSignature` 依赖 `crypto.subtle`/`atob`/`Blob`，`backgroundTaskCanvasSnapshot` 依赖 store 的 `getStateRaw/serialize/serializeNode`——测试全用假宿主或注入式依赖。
- 两组厂商档案（Agnes/MiniMAX）是 R13 方向的纯数据，接线时须由厂商选择与凭据面板消费；`autoUpdatePolicy` 属 R25 方向，接线时须接桌面更新桥；`taskCenterModel` 属 R03，接线时须接任务中心视图；`groupNodeLayout`/`backgroundTaskCanvasSnapshot`/`imageOverlayReadiness`/`assetCreateFly`/`canvasToolbarPlacement` 分别是画布分组布局、后台快照、图片就绪、创建动效与工具条放置的底座件，缺各自的宿主装配。
- R01–R26 都没有完成。

## 12. 第 2 组：收尾与下一段

- 孤立台账 341→352 / 1103→1114；专题见本文件。
- 125e 队列 47 件，两组共落 21 件，**余 26 件**（21 个 `workspace*` 加 `canvasImageDisplayHandoff`、`materialComparisonViewport`、`materialLibraryPolicy`、`modelMediaInputLimits`、`nodeCreationMenuIcons`）。接下来按能力区继续成组落地这 26 件直属叶，再转 **109 件 OK**（须先过导出闸门）。
- 7.3 受阻项与 15 件协作受阻件不变，须另行授权的生成件升级批；NodeReference 仍缺 `resolveCanvasVideoPosterUrl`。
- R01–R26 都没有完成。

## 13. 第 3 组：落地清单

| # | 模块 | 字节 / 行 | SHA256 前 12 | 测试数 |
| --- | --- | --- | --- | --- |
| 22 | `workspaceActionIcons.js` | 2321 / 44 | `af1c5ba7224e` | 5 |
| 23 | `workspaceAssetAppearance.js` | 1467 / 37 | `4079b2e6ca65` | 8 |
| 24 | `workspaceAssetDragPreview.js` | 1669 / 43 | `440d673f6ebc` | 15 |
| 25 | `workspaceAssetHover.js` | 713 / 20 | `8b07dbd0eb7a` | 8 |
| 26 | `workspaceAssetLibraryContextMenu.js` | 578 / 17 | `52a4ae2fbf80` | 8 |
| 27 | `workspaceAssetSelection.js` | 3963 / 88 | `e5fea08e9e34` | 21 |
| 28 | `workspaceBetaNotice.js` | 3238 / 83 | `5e701c0053fb` | 16 |
| 29 | `workspaceContextMenuGuard.js` | 173 / 4 | `0f4d0c8767b3` | 3 |
| 30 | `workspaceStepShortcut.js` | 1456 / 42 | `b5d09e77678a` | 9 |
| 31 | `workspacePresentationLifecycle.js` | 2637 / 81 | `151cc940cf45` | 16 |
| 32 | `workspacePersistencePresentation.js` | 3384 / 75 | `ea7438b268cd` | 13 |

合计新增 22 个文件（11 源 + 11 测试），源 21599 字节 / 534 行，测试 62132 字节 / 1787 行，**132 例**离线测试（首跑 125/131，6 处期望写错、按落地实现改正后复跑 131/131，再补 1 例边界后 132/132）。

## 14. 第 3 组：依赖与闸门

- 11 件在 `deps-ast` 分级里都是 LEAF（0 条相对 import），导出闸门报告「无相对依赖」，`MISSING_TOTAL=0`。
- 暂存用 `b125e/stage.mjs --check` 复核：11/11 `prettier(mirror)==staged:true`，SHA256 与 §13 一致。
- 落地用 `cmp` 与暂存产物逐字节比对，`staged-identical` 11/11；`node --check` 对 22 个文件全部通过。
- 只新增文件，未覆盖任何在用件；`api/freeImageHostApi.js` 的 MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f`。
- 消费方反查（`b125e/consumers.mjs`，本次把第 3 组 11 件并入前两组共 32 件一起查）遍历 1119 个非测试文件，`TOTAL_CONSUMER_HITS=0`。

## 15. 第 3 组：冻结行为与接入契约

1. **workspaceContextMenuGuard**：最小件。`isWorkspaceContextMenuTarget(node, selector)` 用 `node?.closest?.(selector)` 判定，缺 `selector` 或 `closest` 时返回 `false`；命中即 `true`。

2. **workspaceAssetLibraryContextMenu**：冻结上下文菜单项定义与构造。`createWorkspaceAssetLibraryContextMenu(...)` 返回菜单项数组，各项 `id`/`label`/`disabled`/`action` 由传入能力决定，缺能力时给出禁用项。

3. **workspaceAssetHover**：`resolveWorkspaceAssetHover(...)` 按注入的 `selector` 与指针数据判定悬停目标，空白选择器或空指针返回 `null`；空字符串触发默认选择器（`undefined` 会走默认参数）。

4. **workspaceActionIcons**：冻结动作→图标的映射表，`getWorkspaceActionIcon(action)` 查表，未命中回落默认图标。

5. **workspaceAssetAppearance**：`resolveWorkspaceAssetAppearance(...)` 把资产项归一成展示用的 `{ label, ... }` 外观对象，缺字段时给默认值。

6. **workspaceStepShortcut**：`resolveWorkspaceStepShortcut(...)` / `matchWorkspaceStepShortcut(...)` 按注入的键位映射与键盘事件判定步骤快捷键，未命中返回 `null`。

7. **workspaceBetaNotice**：`shouldShowBetaNotice(...)`、`markBetaNoticeSeen({ windowObject, storageKey })` 等。`markBetaNoticeSeen` 写 `windowObject.localStorage`；写入抛错时返回 `false`（报「记录失败」），无 `localStorage` 宿主（`windowObject` 为 `null`/缺省）时可选链不抛，返回 `true`。

8. **workspaceAssetDragPreview**：`resolveWorkspaceAssetDragPreview(...)` 计算拖拽预览的位置与尺寸。URL 取值顺序为 `[currentSrc, src, poster].map(normalizeText).find(Boolean)`——**图片的 `poster` 也作为候选**；`pointerGap` 默认 `24`，显式传 `undefined` 会触发默认值（测试需避开）。

9. **workspaceAssetSelection**：`toggleWorkspaceAssetSelection(selection, id, allowed)` 做增删切换；非数组 selection 当空表处理后追加，`allowed` 为假时只做归一化返回。`selectedCount` 仅参与真值判定（`count || primaryActionHtml`），负数/异常值不会走钳制分支。

10. **workspacePresentationLifecycle**：`createWorkspacePresentationLifecycle({ getRoot, getContentKey, initiallyActive })`。`activate()` 返回是否需要重建内容（`invalidate()` 或 `getContentKey()` 变化时为 `true`），并在激活时播放被记录的暂停动画；`deactivate()` 先把 `root` 下 `video, audio` 全部 `pause`，再把 `getAnimations({subtree:true})` 里 `playState==='running'` 的动画 `pause` 并记入暂停集合。恢复时只对「`effect.target.isConnected` 且 `playState==='paused'`」的动画 `play`，随后清空集合。单个动画 `pause()` 抛错时被跳过、不会被记录、也不会被恢复。`isActive()` = 激活且未 dispose；`dispose()` 先 `deactivate()` 再摘监听、清集合、封死后续 `activate()`。

11. **workspacePersistencePresentation**：`createWorkspacePersistencePresentation({ getRoot, showDelayMs=300, setTimeoutFn, clearTimeoutFn })`。惰性建 `.workspace-persistence-status`（`role=status`、`aria-live=polite`）并把 `data-state` 设为 `error` 或当前 `status`；`saving` 首次延迟 `showDelayMs` 才显形，`error` 或 `saving && retryAttempt>0` 立即显形并给「保存失败，正在重试：…」文案；`destroy()` 清定时器、摘节点并封死后续 `update()`。

## 16. 第 3 组：验证结果

- 11 个测试首跑 **125/131**，6 处失败全在本文件期望侧：`workspaceAssetDragPreview` 的 `poster` 候选与 `pointerGap: undefined`、`workspaceAssetHover` 的 `selector: undefined`、`workspaceAssetSelection` 的非数组 toggle 与 `selectedCount` 真值语义、`workspaceBetaNotice` 的无 storage 宿主返回。按落地实现改正后 **131/131** 全绿。
- 追加 1 例边界（`does not resume a paused animation whose target left the document`）后 **132/132**；经 prettier 复排（8 个测试文件被重排）复跑仍全绿。
- 变异抽查（`b125e/mutate.g3.mjs`）：**92 个变异全检出、0 存活、0 跳过**；11 个外部副本基线全绿、`restored=true`，只改副本。首轮 2 个存活 1 个跳过：`isActive` 的等价变异换成 `() => true` 检出，「已暂停动画目标脱离文档」缺用例补测后检出，`reveal root` 锚串补 `)` 后检出。
- 原始 UTF-8 TAP 实跑（`b125e/sweep-raw.mjs`）：src **5524 / 5481 / 43**（较第 2 组基线 5392 增加 132，与测试数吻合），43 项失败名与 `b85-fails.txt` 完全一致、新增 0 消失 0；api **791 / 791 / 0**。
- 未启动应用、Electron，未构建，未联调，未提交或推送。

## 17. 第 3 组：未执行项与边界

- 11 件全部**未接线**：从 `index.html`/`main.js` 等入口沿相对 import 遍历都走不到，消费方反查 0 真实命中。
- `workspacePresentationLifecycle` 依赖 `getAnimations`/`video,audio` 查询与 `getRoot`，`workspacePersistencePresentation` 依赖 DOM 创建与定时器，`workspaceAssetDragPreview` 依赖图片元素与指针数据，`workspaceBetaNotice` 依赖 `localStorage`——测试全用假宿主或注入式依赖。
- 这批是工作区表现层底座件：`workspacePresentationLifecycle`（激活/失活时暂停恢复媒体与动画）、`workspacePersistencePresentation`（保存状态提示条）、`workspaceBetaNotice`（内测提示）、`workspaceAssetSelection`/`workspaceAssetDragPreview`/`workspaceAssetHover`/`workspaceAssetLibraryContextMenu`/`workspaceAssetAppearance`（资产选择与拖拽）、`workspaceActionIcons`/`workspaceStepShortcut`/`workspaceContextMenuGuard`（动作图标、步骤快捷键、右键目标守卫），接线时须接各自的工作区宿主装配。
- R01–R26 都没有完成。

## 18. 第 3 组：收尾与下一段

- 孤立台账 352→363 / 1114→1125；专题见本文件。
- 125e 队列 47 件，三组共落 32 件，**余 15 件**（10 个 `workspace*`：workspaceAssetSettingsShell、workspaceEpisodeRailPresentation、workspaceMarqueeSelection、workspaceMediaHistory、workspaceMenuController、workspacePageTransition、workspacePersistenceCoordinator、workspaceProjectHome、workspaceResizeSession、workspaceVideoPlaybackControls；加 `canvasImageDisplayHandoff`、`materialComparisonViewport`、`materialLibraryPolicy`、`modelMediaInputLimits`、`nodeCreationMenuIcons`）。接下来按能力区继续成组落地这 15 件直属叶，再转 **109 件 OK**（须先过导出闸门）。
- 7.3 受阻项与 15 件协作受阻件不变，须另行授权的生成件升级批；NodeReference 仍缺 `resolveCanvasVideoPosterUrl`。
- R01–R26 都没有完成。
## 19. 第 4–5 组：落地清单

| # | 模块 | 字节 / 行 | SHA256 前 12 | 测试数 |
| --- | --- | --- | --- | --- |
| 33 | `workspaceEpisodeRailPresentation.js` | 3339 / 88 | `5b058ed42df9` | 15 |
| 34 | `workspaceResizeSession.js` | 3043 / 68 | `7d5238c31f77` | 30 |
| 35 | `workspaceMenuController.js` | 5254 / 128 | `b672949dae98` | 39 |
| 36 | `workspaceAssetSettingsShell.js` | 5971 / 139 | `b4ded3e2c763` | 26 |
| 37 | `workspacePersistenceCoordinator.js` | 6841 / 173 | `0f23a462732f` | 47 |
| 38 | `nodeCreationMenuIcons.js` | 5294 / 131 | `e9d6c7cb032e` | 15 |
| 39 | `canvasImageDisplayHandoff.js` | 8486 / 211 | `7438dea38690` | 30 |
| 40 | `materialComparisonViewport.js` | 6120 / 153 | `dfdd948fe59d` | 31 |
| 41 | `workspaceMarqueeSelection.js` | 12213 / 294 | `b5f816ea4794` | 82 |
| 42 | `workspaceMediaHistory.js` | 9303 / 216 | `86f418d9e85d` | 57 |
| 43 | `workspacePageTransition.js` | 10222 / 249 | `e0791bb30e5f` | 48 |
| 44 | `workspaceProjectHome.js` | 14787 / 318 | `139e5a9c8150` | 55 |
| 45 | `workspaceVideoPlaybackControls.js` | 14680 / 339 | `b04dbde26fac` | 58 |
| 46 | `materialLibraryPolicy.js` | 13469 / 327 | `0c2fdaeb7746` | 62 |
| 47 | `modelMediaInputLimits.js` | 8017 / 206 | `18f711569184` | 36 |

合计新增 30 个文件（15 源 + 15 测试），源 127039 字节 / 3040 行，测试 402228 字节 / 10638 行，**631 例**离线测试（第 4 组 8 件共 233 例 = 15+30+39+26+47+15+30+31，第 5 组 7 件共 398 例 = 82+57+48+55+58+62+36）。

## 20. 第 4–5 组：依赖与闸门

- 15 件在 `deps-ast` 分级里都是 LEAF（0 条相对 import），导出闸门报告「无相对依赖」，`MISSING_TOTAL=0`。
- 暂存用 `b125e/stage.mjs --check` 复核：15/15 `prettier(mirror)==staged:true`，SHA256 与 §19 一致。
- 落地用 `cmp` 与暂存产物逐字节比对，`staged-identical` 15/15；`node --check` 对 30 个文件全部通过。
- 只新增文件，未覆盖任何在用件；`api/freeImageHostApi.js` 的 MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f`。
- 消费方反查（`b125e/consumers.mjs`，本次把第 4–5 组 15 件并入前三组共 47 件一起查）遍历 1134 个非测试文件，`TOTAL_CONSUMER_HITS=0`。

## 21. 第 4–5 组：冻结行为与接入契约

本组 15 件全部**未接线**（从 `index.html`/`main.js` 等入口沿相对 import 遍历都走不到），每件末尾注明接线时须接的宿主。

1. **workspaceEpisodeRailPresentation**：唯一导出 `renderWorkspaceEpisodeRail({items, selectedId, label='分集', ariaLabel='分集列表', asideData, listData, getButtonData})`，返回整段 `.workspace-episode-rail` 的 `<aside>` 字符串。`items` 非数组当空表；逐项装配 `number = 去空白后的 number || String(下标+1)`（数字 `0` 归一成 `'0'` 仍算有效值）、`title = 去空白后的 title || '第 N 集'`、`meta = 去空白后的 meta || '0'`，`busy`/`disabled` **仅在严格等于 `true`** 时为真，最后按 `id` 去空白后非空过滤（id 空的项整条丢弃，因此头部计数与后续分集序号都可能缩水）。`selectedId` 去空白后与每项 id 比对，命中者加 `is-active`、`aria-pressed="true"` 与 `aria-current="page"`。`asideData`/`listData`/`getButtonData(item)` 的值经 `renderDataAttributes` 渲染：键先 `String(键).trim().toLowerCase()` 并要求匹配 `^data-[a-z][a-z0-9-]*$`，`true` 输出裸属性名、`false`/`null`/`undefined` 跳过、其余输出 `名字="值"`，非法键一律丢弃；所有文本经 `escapeHtml`（`&<>"'` → `&amp;/&lt;/&gt;/&quot;/&#39;`）。接线时须接工作区剧集栏（脚本分集列表）宿主。

2. **workspaceResizeSession**：`beginWorkspaceResizeSession({event, splitter, layout, orientation='horizontal', windowObject, body, resizingClass='', onRatio, onFinish=null, signal=null})` 返回布尔，另有 `beginWorkspaceHorizontalResizeSession`/`beginWorkspaceVerticalResizeSession` 两个只强制方向的薄包装（同样在选项不全时返回假）。开闸条件：四要素齐备、`typeof onRatio === 'function'`、`signal.aborted` 为假；`event.isPrimary === false`、或 `Number.isFinite(event.button) && event.button !== 0` 时拒绝——**这里用的是不带 `Number()` 的 `Number.isFinite`，按钮值传字符串（如 `'1'`）不会被判为非零，会被放行**。尺寸取 `layout.getBoundingClientRect()`，`orientation === 'vertical'` 用 `height`、其余一律用 `width`（其它字符串也走宽度），非正数直接拒绝。通过后先 `preventDefault`/`stopPropagation`、`splitter.setPointerCapture(pointerId)`（抛错吞掉）、给 splitter 加 `is-active`，`resizingClass` 非空时才加到 `body`。比率 = `((clientX|clientY - rect.left|top) / 尺寸) * 100`，起点缺失按 `0`，经 `onRatio(比率, 事件)` 回调；指针匹配用 `Number()` 比较，`pointerId` 与记录不符的移动被忽略，而记录到的 `pointerId` 非有限时**任何移动都接收**。结束时摘掉三个监听、解捕获、去掉 `is-active` 与 body 类、回调 `onFinish(event)`；`signal` 的中止会以其自身 `pointerId` 走一次结束流程，`windowObject`/`body` 缺失时全程用可选链降级。接线时须接工作区面板分隔条（列表/详情分栏）宿主。

3. **workspaceMenuController**：`createWorkspaceMenuController({root, wrapperSelector, triggerSelector, menuSelector, optionSelector, openClass='is-open'})` 返回冻结的 `{close, open, toggle, handleKeyDown}`；`root` 可以是访问器函数，每次调用重新求值。`close(exclude = null)` 遍历 `root.querySelectorAll(wrapperSelector)`，对「不是 exclude、且带 `openClass`」的包装去掉类，并把其 trigger 的 `aria-expanded` 置 `false`、menu 的 `aria-hidden` 置 `true`。`open(wrapper, trigger = wrapper.querySelector(triggerSelector))` 要求包装、trigger、menu 三者都在且 trigger 未 `disabled === true`，先独占关闭其它包装再返回真。`toggle(element)` 用 `element.closest(wrapperSelector)` 找包装，元素已禁用返回假；若包装已在打开态则**调用无参 `close()` 关掉全部包装并返回假**，否则转 `open`。`handleKeyDown(ev)`：焦点在 trigger 上按 `ArrowDown`/`ArrowUp` 会先打开菜单，再把焦点送到第一个/最后一个「可用项」（过滤 `disabled === true` 或 `aria-disabled === 'true'`，打开失败则不处理）；`Escape` 关菜单并把焦点还给 trigger；焦点在选项上时 `ArrowDown`/`ArrowUp` 循环步进（含首尾回绕）、`Home`/`End` 跳到首尾，其余键忽略。焦点写入用 `focus(element, {preventScroll: true})`（抛错回落普通 `focus()`），若焦点未生效会在 `requestAnimationFrame` 里再试一轮。另导出 `syncWorkspaceInlineMenuExpandedWidth(element)`：把 `ceil(Number(element.scrollWidth) || 0)`（非正数返回 `0` 且不写样式）写进 CSS 变量 `--workspace-inline-menu-expanded-width` 并返回该整数，元素没有 `style` 时仍返回宽度。接线时须接工作区各处下拉菜单（项目排序、素材操作等）宿主。

4. **workspaceAssetSettingsShell**：导出 6 个常量——列表分隔比 `WORKSPACE_ASSET_SPLIT_RATIO_MIN=28`、`MAX=72`、`DEFAULT=50`；详情分隔比 `MIN=32`、`MAX=68`、`DEFAULT=50`。`normalizeWorkspaceAssetSplitRatio(v)`/`normalizeWorkspaceAssetDetailSplitRatio(v)` 先 `Number(v)`，**非有限值回落各自的默认 `50`（不是钳制到零/边界）**，有限值再 `max(下限, min(上限, v))` 钳制；因此空串（`Number('') === 0`）会被钳到 28，越界值钳到最近边界，数字字符串按数字处理。`applyWorkspaceAssetSplitRatioToLayout(listEl, splitterEl, ratio, {styleProperty='--story-assets-left'})` 把归一化比值写成 `'<值>%'` 到 `listEl.style`，同时给 `splitterEl` 写 `aria-valuenow = String(Math.round(值))`，**返回归一化后的原始（未取整）比值**；详情版 `applyWorkspaceAssetDetailSplitRatioToLayout` 默认写 `--workspace-asset-detail-top`。`renderWorkspaceAssetSettingsShell({...})` 直接拼页面骨架：`tabCount` 取 `max(1, trunc(Number(值) || 1))`、`splitRatio` 默认 `50` 并归一化进内联 `--story-assets-left`，`activeTab === 'library'` 时用 `story-asset-grid--workspace-library` 网格类、否则用 `workspace-project-asset-grid`，`cardsHtml` 为空时回落 `story-inline-empty` 包 `emptyText`（默认 `暂无素材`），`calloutInHeading` 决定提示块进标题栏还是列表列（标题栏变体带 `data-tooltip`、`ⓘ` 与可选 `role="status"`），`headingInListColumn` 决定整个标题块落到列表列；所有标签经 `escapeHtml`（单引号用 `&#039;`），而 `tabsHtml`/`calloutActionsHtml`/`detailHtml`/`footerHtml` 原样注入不转义。接线时须接工作区素材设置页宿主。

5. **workspacePersistenceCoordinator**：`createWorkspacePersistenceCoordinator({save, getSnapshot, ready=true, debounceMs=500, maxWaitMs=0, retryBaseMs=1000, retryMaxMs=10000, setTimeoutFn, clearTimeoutFn, onStateChange, onError})` 返回冻结的 `{schedule, flush, setReady, setHydrationError, destroy, getRevision, getPersistedRevision, getState, isReady, isDirty}`；四个延时经 `normalizeDelay`（`Number` 后有限且 `>= 0`，否则回落默认），**负值不使用而 `0` 是合法定时器**，重试上限再做一次 `max(retryBaseMs, …)` 以免上限小于基数。初始状态在 `save` 与 `getSnapshot` 都是函数时为 `'saved'`、否则 `'idle'`，内部状态是 `{status, error, retryAttempt}`，`getState()` 与 `onStateChange` 都只给副本。`schedule({immediate=false, delayMs})` 先把修订号加一；仅在就绪、回调可用且当前状态不是 `'error'`/`'saving'` 时置 `'pending'`；未就绪或回调缺失时只累计修订号；`immediate` 立即冲刷，否则防抖（后到的更短延时会替换挂起的更长计时器、更长延时被忽略），`maxWaitMs > 0` 时另起一次性最大等待计时器。`flush({force=false})` 是唯一真正保存的入口：`force` 且修订号未落后时先补一条 `'pending'`，循环把 `getSnapshot()` 交给 `save()`，第二次调用复用进行中的 promise；失败时区分「取快照就失败」（直接记 `error`、`retryAttempt` 归零）与「保存请求已发出才失败」（退避重试）。退避为 `min(retryBaseMs * 2^(attempt-1), retryMaxMs)`，仅在未销毁、就绪、回调可用、且没有挂起的重试计时器时排；重试期间新的防抖排程被阻塞，失败一律经 `onError` 上报（未注入 `onError` 时静默）。`setReady(true)` 会把积压的修订号按防抖排一次（可 `immediate`），`setReady` **只接受字面 `true`**；`setHydrationError(err)` 置 `ready=false`、清计时器、`retryAttempt` 归零并记 `error`（消息取 `err.message || err || '自动保存失败'`，去空白后为空再回落 `'自动保存失败'`）。`destroy({flush=true, force=false})` 封死后按需最后冲刷一次并返回该 promise，之后再 `schedule`/`flush` 都不工作。接线时须接工作区自动保存宿主（`save`/`getSnapshot` 由画布 store 提供）。

6. **nodeCreationMenuIcons**：`createNodeCreationMenuIcon(kind, {documentObject=globalThis.document, stroke='currentColor'})` 用 `createElementNS` 建 24×24 的 SVG 图标并返回该元素。`documentObject` 没有 `createElementNS` 函数、或查不到形状表时返回 `null`；查表顺序是 `ICON_ALIASES[kind] || kind` 再 `ICON_SHAPES[键]`——`ICON_ALIASES` 把 `source-text`/`source-image`/`source-video`/`source-audio`/`panorama-360` 分别折到 `ai-text`/`ai-image`/`ai-video`/`ai-audio`/`panorama-scene`。两张表都是冻结的字面量对象，**查表会穿透到 `Object.prototype` 的键**（如 `constructor`/`toString`/`hasOwnProperty`）：别名那一跳会取到继承来的函数（真值），随后形状一跳必然失配，因此仍返回 `null` 而不会抛错或渲染垃圾图标。根节点固定写 `width`/`height`=`'18'`、`viewBox='0 0 24 24'`、`fill='none'`、`stroke`（可覆盖，显式 `undefined` 走默认 `'currentColor'`）、`stroke-width='1.8'`、`stroke-linecap`/`stroke-linejoin`=`'round'`、`aria-hidden='true'`，并把 `dataset.nodeCreationIcon` 设为 `String(kind || '')`；形状按表内顺序逐个 `createElementNS`、`setAttribute(名字, String(值))` 后再挂载，每次调用都新建独立元素树，不缓存。接线时须接画布节点创建菜单宿主（`documentObject` 与 `stroke` 由宿主注入）。

7. **canvasImageDisplayHandoff**：模块级 `WeakMap` 按图片元素保存一次显示交接，用 `is-canvas-image-handoff` 类与 `--canvas-image-handoff-fallback`/`-fallback-position`/`-fallback-size` 三个自定属性做兜底呈现；导出 `assignCanvasImageDisplaySource`、`deferCanvasImageDisplayFallbackRelease`、`clearCanvasImageDisplayHandoff`。`assignCanvasImageDisplaySource(image, source)`：源去空白且元素存在才继续，源与当前源相同（且没有交接或交接目标一致）直接返回假。它先挑「兜底源」——旧交接的目标就是当前已绘制源、且 `hasPaintedImageSource` 与 `isImagePaintReady` 都成立时沿用当前源；否则沿用旧交接的 `fallbackSource`；再否则在旧源已绘制时取旧源。`hasPaintedImageSource` 要求 `style.display !== 'none'`、`complete !== false`，并把 `naturalWidth === undefined` 视为已绘制；`isImagePaintReady` 才严格要 `complete === true` 且 `naturalWidth > 0`。旧交接的推迟回调只在兜底源不变时被继承（复制成新 `Set`），兜底源变化时立刻释放。没有兜底源时清掉兜底样式、**直接写 `src` 并返回真（不挂任何监听）**。有兜底源时写 `url(<JSON.stringify(源)>)` 到兜底属性、按 `readFallbackLayout` 写位置/尺寸（内联 `objectFit`/`objectPosition` 优先，其次 `getComputedStyle`，读取抛错吞掉；`contain`/`scale-down` → `'contain'`、`fill` → `'100% 100%'`、`none` → `'auto'`、其余 → `'cover'`，位置默认 `'center'`），加类、挂一次性 `load`/`error` 监听、再写 `src`。`load` 走 `schedulePaintedHandoffFinish`（有 `decode()` 先 `await` 并吞掉拒绝，仍未绘制就解开排程标志等下一次，已绘制才收尾）；`error` 走 `restoreFallbackAfterError`：无兜底源就结束交接，否则写回 `dataset.lodSrc`（捕获的 `fallbackLod` 为空则删除该字段）、把目标源换成兜底源、重挂监听并写 `src`，已绘制时同步收尾并标记 `restoredFallback`。`deferCanvasImageDisplayFallbackRelease(image, source, cb)` 仅当去空白的 `source` 等于当前交接的兜底源、且 `cb` 是函数时登记并返回真。`clearCanvasImageDisplayHandoff(image)` 有交接时按 `WeakMap` 同一性校验后收尾（默认逐个调用推迟回调并吞掉回调抛错），**无交接时只清兜底样式并返回 `false`**。接线时须接画布图片节点显示层宿主（图片元素与 LOD 源由宿主提供）。

8. **materialComparisonViewport**：`createMaterialComparisonViewport({state, main, stage, stageShell, viewport, windowObject})` 返回（未冻结的）`{syncGeometry, syncDivider, zoomBy, cancelZoom, dispose}`，所有量算结果都写回传入的 `state`（`stageWidth`/`stageHeight`/`zoom`）。`syncGeometry()` 量尺寸时优先 `main.clientWidth`/`clientHeight`，退回 `getBoundingClientRect()`，再退回 `windowObject.innerWidth`/`innerHeight`，减去 `stageShell` 的四个 padding 后**下限 1px**；`leftAspectRatio`/`rightAspectRatio` **非正数回落 `1`**（不是钳制到极小值）；`state.mode === 'side-by-side'` 时按两个比值之和适配，否则取面积较大的那块（面积相等取左块）；舞台尺寸 = 适配尺寸 × `zoom`，同样下限 1px，写 `--material-comparison-stage-width`/`-height` 时取整到两位小数、`dataset.zoom` 取整到三位小数。`syncDivider()` 用 `main` 的尺寸与 `dividerPercent` 算分隔位置，再按 `stage` 的 `clientLeft`/`clientWidth`（缺失时退回矩形）换算成百分比并**钳制到 `[0, 100]`**，写 `--material-comparison-divider-x`/`-height` 与 `--material-comparison-divider`（零或非数值百分比写 0）；任一侧矩形缺失就跳过。`zoomBy(ev)` 取 `deltaY || deltaX || 0`，为 0 直接返回；否则 `preventDefault`/`stopPropagation`，按 `zoom * exp(-delta * 0.0015)` **钳制到 `[0.25, 6]` 并取整到三位小数**，用 `requestAnimationFrame` 合并连续滚轮（无 rAF 时同步应用），应用时保持指针下的画面点不动（改写 `main.scrollLeft`/`scrollTop`）。`cancelZoom()` 丢弃挂起帧与暂存缩放，`dispose()` 后再调用一律 no-op。接线时须接素材对比视图宿主（`state`、`main`/`stage`/`stageShell`/`viewport` 由宿主提供）。

9. **workspaceMarqueeSelection**：导出常量 `WORKSPACE_MARQUEE_DRAG_THRESHOLD = 5` 与 4 个纯函数。`hasWorkspaceMarqueeDrag(x0, y0, x1, y1, 阈值 = 5)` 用 `hypot` 与 `max(0, 归一化阈值)` 比较，**阈值非正时任何位移都算拖动**；`createWorkspaceMarqueeRect(x0, y0, x1, y1, bounds = null)` 把非有限坐标归零、按两个对角取 min/max 出 `{left, top, right, bottom, width, height}`，给了 `bounds` 时先把四个坐标夹进 `[left, right]`/`[top, bottom]`（**反向 bounds 会塌成一条边而不是镜像**），`bounds` 为假值则忽略；`doesWorkspaceMarqueeIntersect(a, b)` 任一为空给假，**贴边（相等）算相交**；`resolveWorkspaceMarqueeSelection(ids, existing = [], {additive = false})` 把两边字符串化 + 去空白 + 去空 + 去重，**命中 id 在前、原选中在后**，`additive` 为假时完全忽略原选中（原选中非数组也只在 additive 下才被读）。`createWorkspaceMarqueeSelectionController({root, documentObject, windowObject, getConfig, surfaceSelector, resolveSurface=null, blockedControlSelector, overlayClassName, itemSelector, getItemId, hitClassName='is-marquee-hit', rootClassName='is-marquee-selecting', dragThreshold=5, onActivate=null, onCommit=null})` 缺 `root`/`documentObject`/`windowObject`/`getConfig` 或 `surfaceSelector` 为空、或 `itemSelector` 与 `getItemId` 缺失时抛错；随后在 window 上以捕获方式挂 `pointermove`/`pointerup`/`pointercancel`。`begin(ev)` 只接受 `button === 0`、非 `isPrimary === false`、`pointerType` 为鼠标（或没给）的按下，用 `resolveSurface(ev)` 或 `ev.target.closest(surfaceSelector)` 找面并要求 `root.contains(面)`；再向 `getConfig(面)` 要 `enabled`、`commit` 与可选 `canBegin`（`canBegin` 不是函数会抛错，返回 `false` 才算拒绝）；落在被阻止控件里且该元素不匹配 `itemSelector` 时拒绝；`additive` 优先取配置里的布尔值，否则看 `shift`/`ctrl`/`meta`，并复制一份 `selectedIds` 快照。`update(ev)` 在位移未达阈值前不建遮罩，越过才建 `div`、拼类名（空类名过滤）、写 `aria-hidden='true'`、挂到 `root`、加根类名、调 `onActivate` 并尝试 `setPointerCapture`；矩形按 `面.getBoundingClientRect()` 夹紧后写遮罩 `left/top/width/height`，逐项 `toggle(hitClassName)` 并收集去空白非空的 id。`finish(ev)` 会用最终坐标重算一次，只有真正激活过才算提交：先清场、按 `additive` 合并命中与原选中、调 `commit(ids)` 与 `onCommit(ids)`，并在 `setTimeout(…, 0)` 里放一个一次性标志供 `consumeClick` 吞掉紧随其后的那次点击；未激活、取消或指针不符一律不提交（取消路径还不重算）。`destroy()` 清场并摘掉三个 window 监听。接线时须接工作区多选宿主（`getConfig` 提供选中集合、`itemSelector` 与提交回调）。

10. **workspaceMediaHistory**：`renderWorkspaceMediaHistoryMenu({title='媒体结果', results=[], activeIndex=0, countLabel='', menuLabel='', minimumItemCount=2, getItemLabel, getItemStatus, renderMedia, getItemAttributes, renderItemAction})` 返回整段历史菜单 HTML。`results` 只保留对象项；数量小于 `max(1, trunc(Number(minimumItemCount) || 2))` 时返回空串；`activeIndex` 经 `max(0, min(n-1, trunc(Number(值) || 0)))` 钳制。渲染出的条目**整体 `reverse()` 反转**（输入里靠后的版本显示在最上）。标题/计数/菜单名的回落是 `String(值 || 默认).trim()`——**先判真值再 trim，纯空白串会被当成有效值并被 trim 成空**；三个文案回调的结果同样 trim 后非空才用，否则回落默认。`renderMedia` 与 `getItemAttributes`/`renderItemAction` 的结果原样注入不转义（含复选框/角标标记），标签与状态经 `escapeHtml`（全局 `replace` 版）；`renderItemAction` 返回非空时才把条目包进 `story-media-history-entry` 外层。`createWorkspaceMediaHistoryMenuController({menuElement, windowObject=globalThis.window || globalThis, getMarkup=()=>'', hideDelayMs=120})` 返回冻结的 `{show, refresh, hide, position, clearHideTimer, getAnchor, destroy}`，并在 `menuElement` 上挂 `pointerenter`（撤销待隐藏）、`pointerleave`（延迟隐藏）、`wheel`（非被动）。`show(anchor, context)` 在缺元素/缺锚点、或 `context.event.pointerType === 'touch'` 时拒绝；`getMarkup` 为假值时收起并返回假（**纯空白串算有内容**），成功则写 `innerHTML`、加 `is-visible`、置 `aria-hidden='false'` 并定位。`position(anchor)` 需要菜单已带 `is-visible`，水平居中于锚点并夹到 `[10, 视口宽 - 菜单宽 - 10]`，垂直优先放锚点上方，空间不足才翻到下方并加 `opens-downward`，视口尺寸缺失按 `1024×768`。`refresh({anchor, context, focusSelector, fallbackFocus})` 在重挂之前先记住列表滚动与「焦点原本是否在菜单内」，重挂后恢复滚动（负值归零），原本在菜单内且有 `focusSelector` 时把焦点送回，`show` 失败时用 `fallbackFocus`。`wheel` 只处理列表自身的水平溢出，取绝对值较大的轴，写 `scrollLeft`，到边界时不消费事件。接线时须接工作区媒体结果历史菜单宿主（锚点与标记生成器由宿主提供）。

11. **workspacePageTransition**：`createWorkspacePageTransitionController({windowObject=globalThis, fallbackMs=520, transitionProperty='transform', disposePage, captureFocus=null, restoreFocus=null})` 返回 `{start, cancel, settle, destroy, getActiveTransition}`。方向类名表冻结为 `forward`/`backward` 两组（`is-entering-forward`/`is-leaving-forward` 等），可按 `classNames.directions[方向]` 逐键覆盖；`resolveDirectionClasses(dir)` 用 `DEFAULT_DIRECTION_CLASSES[dir]` 判存在，**原型链上的键（如 `toString`）会取到继承值而返回一组 `undefined` 类名，而不是 `null`**（不会进入拒绝分支）。`start({current, next, parent, direction='forward', transitionElement, classNames, focusKey, focusContext, mount, forceLayout, onBeforeCommit, onAfterCommit, onCommit, onRollback, onSettled, onTransitionComplete})`：控制器已销毁、缺 `current`/`next`/`parent`/`transitionElement` 或方向未知时返回 `null`；`parent` 缺省按 `next.parentElement` → `current.parentElement` 推导，`transitionElement` 缺省取 `next`；会先把在飞的上一段以它自身的提交状态结算（原因 `'replaced'`）。类名默认 `current='is-current'`、`page`/`parent`/`scope*` 为 `''`，`retainCurrentOnCommit` **只有显式传 `false` 才关**；两页分别加 `page+current+scopeCurrent` 与 `page+entering+scopeNext+scopeTarget`，当前页失活、下一页激活（写 `aria-hidden` 与 `inert`，写 `inert` 抛错吞掉）；`focusKey` 为 `undefined` 时才调 `captureFocus`。随后挂 `transitionend`（要求 `target === transitionElement`，且 `transitionProperty` 非空时还要求 `propertyName` 相等）、在 `requestAnimationFrame` 里切换类名（无 rAF 则同步切换，且发生在 `start` 返回前）、并起 `max(0, Number(fallbackMs) || 0)` 的兜底计时器——**兜底会先提交再结算，原因 `'fallback'`**。结算只在提交时 `restoreFocus(focusKey, focusContext, transition)` 并 `disposePage(current)`，回滚时反过来恢复当前页、`disposePage(next)`；`onSettled` 恒收到 `{committed, notify, reason, transition}`，`notify` 为真才再调 `onTransitionComplete`；`committed` 是 promise，`commit`/`settle`/`rollback`/`cancel({commit})` 分别对应切换类名、按选项结算、回滚与按当前提交态取消（`cancel` 的 `commit` 默认取交接自身状态）。`destroy({commit=false})` 结算在飞段并封死后续所有调用。接线时须接工作区页面切换宿主（焦点捕获/恢复与旧页释放由宿主注入）。

12. **workspaceProjectHome**：`getWorkspaceProjectTaskPresentation({activeCount=0, failedCount=0})` 把两个计数 `max(0, trunc(Number(值) || 0))` 后返回 `{activeCount, failedCount, label}`，label 优先级为 `'后台生成中 · N 个任务'` → `'N 个任务需重试'` → `'制作中'`（active 压过 failed）。`normalizeWorkspaceProjectSortOrder(v)` 只在冻结表 `['updated-desc', 'created-asc', 'title-asc']` 里精确匹配（去空白后、大小写敏感），否则回落 `'updated-desc'`。`getWorkspaceProjectHomeEntries(list, {query='', sortOrder='updated-desc', showArchived=false})`：非数组当空表；先按 `Boolean(Number(archivedAt || 0)) === Boolean(showArchived)` 过滤归档、再按 `query`（去空白 + `toLocaleLowerCase('zh-CN')`）匹配 `title` 或 `data.project.title`——**不匹配 id**；排序 `title-asc` 用 `localeCompare(…, 'zh-CN')`、`created-asc` 依次回落 `createdAt` → id 里的 10 位以上数字 → `updatedAt`、`updated-desc` 按 `updatedAt` 降序，三者都以原下标为并列次序，返回原对象且不改入参。`refreshWorkspaceProjectResultsInPlace({root, documentObject, renderResults})` 用 `<template>` 装 `String(renderResults() || '').trim()`，要求首个子元素匹配 `.story-project-grid, .story-project-empty`，否则返回假，成功则 `replaceWith` 原位替换并返回真。`renderWorkspaceProjectSortControl(order)` 渲染排序控件，选中项在 `data-workspace-project-sort-option` 与 `data-story-project-sort-option` 上重复写同一个值。`renderWorkspaceProjectCard(entry, {…})` 渲染整张项目卡：id 取 `entry.id || data.project.id` 去空白后回落 `'current'`，标题按 `data.project.title` → `entry.title` → `fallbackTitle` → `'未命名项目'` 回落，**只有 `archivedAt > 0` 才算归档**，`itemCount` 非有限归零，封面拼贴最多 3 个去重去空白的 URL（无 URL 时出 `story-media-empty` 空封面，有项目类型时不再补空标签），任务状态按 `taskSummary.activeCount`/`failedCount` 决定 `is-generating`/`has-task-error`/内联状态与文案（归档文案只在既无生成中又无失败时优先，`label` 为空白时回落默认文案），菜单项在归档态切到「取消归档」，删除确认态下菜单隐藏；`updatedAt` 为真值出「已自动保存」、否则「刚刚更新」；用户字段与标签经 `escapeHtml`（单引号 `&#039;`），`coverImageUrls` 等插槽不转义。接线时须接工作区项目首页宿主（项目列表、任务摘由与封面由宿主提供）。

13. **workspaceVideoPlaybackControls**：三件能力。`renderWorkspaceVideoPlaybackControls({…})` 拼控件 HTML：根类名 `video-controls story-video-controls <className>`（去空拼接），标签由 `label`（默认 `'视频'`）派生为 `播放视频`/`视频播放进度`/`视频音量`/`静音视频`（显式标签优先），每个属性袋经 `renderAttributes` 渲染（`false`/`null`/`undefined` 跳过、`true` 输出裸属性名、其余 `名字="值"`，名字与值都转义），`playTitle` 有值才出 `title`，`slots.afterPlay`/`beforeVolume`/`afterVolume` 原样注入；这里的 `disabled` 走真值判断，**非布尔的真值也会被当成 disabled 渲染**。`createWorkspaceVideoPlaybackControls(documentObject, {…})` 用同一套选项建真实元素树，返回 `{root, playButton, currentTime, progress, progressFill, progressKnob, totalTime, volumeControl, volumeToggle, volume}`；`documentObject` 没有 `createElement` 时返回 `null`；此路径下 `disabled` **只在严格 `=== true` 时禁用播放按钮与音量**（`setDisabled` 才置 `disabled` 属性），而进度条的 `aria-disabled` 取 `String(disabled === true)`、`tabindex` 取 `disabled ? '-1' : '0'`（真值即生效），插槽子节点按数组或单值追加，非对象项跳过。`bindWorkspaceVideoVolumeControls({volumeSlider, volumeToggle, getMediaElements, defaultVolume=1, getToggleLabel, onChange})` 返回冻结的 `{sync, setVolumePercent, toggleMuted, dispose}`：媒体元素经 `getMediaElements()` 每次重读、按 `Set` 去重并丢掉非对象项；初始音量取第一个「未静音且音量 > 0」的元素，其次第一个音量 > 0 的元素，再次滑块的 `value/100`，最后回落 `defaultVolume`（0–1 钳制后再兜底 `1`）；`sync()` 把音量写成 `round(音量 * 100)` 的滑块值、`--story-video-volume-progress` 与 `aria-valuetext`，按「音量是否为 0」切换 `is-muted` 与 `aria-pressed`，`getToggleLabel(isMuted)` 返回空白串时**保留原有 `aria-label` 不覆盖**；`setVolumePercent(p)` 把 `p/100` 钳制后写到所有媒体元素并解除静音；`toggleMuted()` 在当前可听时记住音量并给所有元素置 `muted = true`，否则恢复记住的音量（无记忆时 `1`）并解除静音，两条路径都回调 `onChange`；`dispose()` 摘掉 `input`/`click` 监听且幂等，之后 `sync`/`setVolumePercent`/`toggleMuted` 都是空操作。接线时须接工作区视频播放控件宿主（媒体元素与滑块/按钮元素由宿主提供）。

14. **materialLibraryPolicy**：导出 `MATERIAL_LIBRARY_CATEGORY_LIMIT = 99`、冻结的 6 项默认分类 `['人物','场景','物品','风格','音效','Others']` 与 10 个函数。`getMaterialAssetItems(asset)` 在 `items` 数组非空时按位置补 `nodeData`（缺则取 `nodes[下标]`），否则把 `nodes` 映射成 `{type: type || 'other', name: name || '', thumbSrc: '', nodeData}`。`isMaterialAssetFavorite` **只在严格 `=== true`** 时认 `favorite`/`isFavorite`。`getMaterialLibraryGroups({assets, categories, query, favoritesOnly, categoryKey})` 先按 `categories`、再按资产自带的 `category` 登记分组（键 = `categoryKey`，默认 `trim + toLocaleLowerCase`，空键与重复键跳过），随后逐资产投递——**分类键不在登记表里的资产被整条丢弃**；`query` 匹配 `name + category + 各 item 名（或 nodeData.name）` 的拼接串，`favoritesOnly` 先滤收藏；有查询或只看收藏时剔除空组，否则保留空文件夹与登记顺序。`getMaterialFolderAssetCounts({groups, parents, categoryKey})` 返回「键 → 数量」的 `Map`：先写入每个组的资产数，再按父映射把子组数量沿父链上滚（用访问集合防环）。`buildMaterialCategoryRenamePlan({assets, userCategories, allCategories, currentCategory, nextCategory, categoryKey, now})`：源分类键为空、目标键为空、或源分类不在 `userCategories` 里 → `{status:'invalid'}`；去空白后原名与目标完全相同 → `'unchanged'`；目标键在 `allCategories` 里已存在且与源键不同 → `'duplicate'`；否则 `'ready'`，给出替换后的分类数组、命中源分类的 `originalAssets` 与 `renamedAssets`（每项 `updatedAt = now + 下标`，`now` 非有限时改用 `Date.now()`）。`normalizeMaterialFolderParents` 返回「目录标签 → 父目录标签」的普通对象：只有 `userCategories` 里的键能当子节点，未知/自指/重名的对丢弃，**参与环的边全部丢弃**，同一键的标签以 `allCategories` 里第一个出现的为准。`renameMaterialFolderParent` 把键与值里命中当前分类的改写为新名（返回浅拷贝；**改名后不同原键可能撞成同一个键而互相覆盖**），当前或新名为空、或键不在父映射里时同样只返回浅拷贝。`deleteMaterialFolderParent` 删掉该目录节点，把它的直接子目录改挂到它的父目录，**没有父目录记录的孙辈会被丢弃**。`buildMaterialDuplicate(asset, {id, now, nameSuffix=' 副本'})` 用 `JSON` 往返深拷贝，缺目标 id 或不是对象时返回 `null`；重设 `id`、`name = (原名 || '未命名素材') + 后缀`、`createdAt`/`updatedAt = now`、`favorite = false`，并删掉 `isFavorite`/`packageKey`/`packageMetadata`、每个 item 的 `packageItemKey` 与 `nodeData.assetPackageItemKey`、每个 node 的 `assetPackageItemKey`。`buildMaterialDownloadFiles(asset)` 逐 item 产出 `{kind, localPath, url, filename}`：`kind` 由 `normalizeMaterialKind` 把 `source-*`/`ai-*` 折成 `image`/`video`/`audio`，**未知类型直接跳过**；本地路径与 URL 都为空也跳过；文件名 = 清洗后的素材名（`[<>:"/\\|?*]` 与 `\u0000-\u001F` 换 `-`、折叠空白、去尾部点与空白、**截断到 80 字符**、空则 `'material'`）+（有 item 名时加 `-名字`，否则仅在 item 多于一个时加 `-序号`）+ 扩展名（路径去 `?#` 后匹配 `\.([a-z0-9]{1,10})$` 并小写，否则按类型 `png`/`mp4`/`mp3`，再否则 `'bin'`）。接线时须接素材库策略消费方（素材库列表/下载/重命名/删除流程）。

15. **modelMediaInputLimits**：冻结常量 `SEEDANCE2_INPUT_MAX_BY_KIND = {image:9, video:3, audio:3}`、`SEEDANCE25_INPUT_MAX_BY_KIND = {image:30, video:10, audio:10}`、`SEEDANCE2_MAX_TOTAL_DURATION_SECONDS_BY_KIND = {video:15.09, audio:15}`、`SEEDANCE25_MAX_TOTAL_DURATION_SECONDS_BY_KIND = {video:30, audio:30}`。唯一函数 `validateModelMediaInputLimits({inputSlots, images, videos, audios, imageEntries, videoEntries, audioEntries, outputDurationSeconds=0})` 返回冻结结果，校验顺序固定为四段。①按 `inputSlots.maxByKind` 查每类数量上限：`readPositiveLimit` 只认「`Number` 后有限且 > 0」，**非正数/非数值上限等于无限制**（`null`），超限即返回 `code='maxImages'`/`'maxVideos'`/`'maxAudios'`（按 image → video → audio 顺序判定）。②按 `inputSlots.mediaConstraintsByKind[kind]` 逐目校验：`minDurationSeconds` 仅当上限有限且 > 0、该目时长 > 0、且时长小于下限时命中（**时长 0/未知不触发下限**）；`maxDurationSeconds` 超过即命中（等于上限放行）；`allowedExtensions` 先小写并去掉一个前导点，**只有能从 URL 解析出扩展名时才校验**（`data:` URL 与无扩展名 url 直接跳过；路径扩展名优先，其次 URL 查询参数值，均经 `decodeURIComponent`）；`maxBytes` 超过字节上限时报 `max<Kind>Megabytes`，数值按 `/1024/1024` 换算成 MB 一并返回。③按 `maxTotalDurationSecondsByKind` 校验 video 与 audio 的时长合计（**从不校验 image**）。④`maxVideoInputAndOutputDurationSeconds` 需要上限与 `outputDurationSeconds` **都 > 0**，且「视频输入合计 + `max(0, 输出时长)`」超过上限才命中 `maxVideoInputAndOutputSeconds`。统计一律按 URL 去重（`Set` 保插入序），同一 URL 取各来源里最大的时长与字节数，只出现在 `*Entries` 里的 URL 也会以 0 计数；每类的 `{count, totalDurationSeconds, entries}` 与每个 entry 都冻结，全部通过时返回 `{ok: true, statsByKind}`。接线时须接模型输入校验宿主（Seedance 系列媒体输入槽位与提交入口）。
## 22. 第 4–5 组：验证结果

- 第 4 组 8 个测试首跑 232 例全绿；变异抽查时发现 1 处覆盖空洞（`materialComparisonViewport` 的 `leftAspectRatio > 0` 上界在并排模式下可见），补 1 例后 **233/233**。第 5 组 7 个测试首跑 394 例全绿；变异抽查同样补齐 4 处（`workspaceMediaHistory` 2 断言、`workspaceProjectHome` 1 例、`workspaceVideoPlaybackControls` 3 例、`modelMediaInputLimits` 2 断言）后 **398/398**。两组共 **631/631**，30 个文件经 prettier 复排（第 4 组 8 个、第 5 组 6 个被重排）后复跑仍全绿。
- 变异抽查：第 4 组 `b125e/mutate.g4.mjs` **112 个变异全检出、0 存活、0 跳过**，首轮 1 个存活判为真实覆盖空洞并补测检出（无等价变异剔除）；第 5 组 `b125e/mutate.g5.mjs` **101 个变异全检出、0 存活、0 跳过**，3 个判为等价并剔除（视频音量兜底 `|| 1` 为死分支、两个 `??`/`||` 等价点、`collectUniqueUrls` 的 `Set` 被后续 `Map` 再去重）。15 个外部副本基线全绿、`restored=true`，只改副本。
- 原始 UTF-8 TAP 实跑（`b125e/sweep-raw.mjs`）：src **6155 / 6112 / 43**（较第 3 组基线 5524 增加 631，与测试数吻合），43 项失败名与 `b85-fails.txt` 完全一致、新增 0 消失 0；api **791 / 791 / 0**。
- 受保护 `api/freeImageHostApi.js` 的 MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f`；消费方反查（32 件并入共 47 件）遍历 1134 个非测试文件 `TOTAL_CONSUMER_HITS=0`。
- 未启动应用、Electron，未构建，未联调，未提交或推送。
## 23. 第 4–5 组：未执行项与边界

- 15 件全部**未接线**：从 `index.html`/`main.js` 等入口沿相对 import 遍历都走不到，消费方反查 1134 个非测试文件 0 真实命中。
- 这批是工作区与素材侧的底座件：`workspaceEpisodeRailPresentation`/`workspaceProjectHome`/`workspaceMediaHistory`/`workspaceAssetSettingsShell`/`workspaceMenuController` 是工作区四面板与菜单的渲染/交互底座；`workspaceResizeSession`/`workspaceMarqueeSelection` 是分栏拖拽与框选会话；`workspacePageTransition`/`workspacePersistenceCoordinator`/`workspaceVideoPlaybackControls` 是切页过渡、自动保存编排与视频控件；`canvasImageDisplayHandoff`/`materialComparisonViewport`/`nodeCreationMenuIcons` 是画布图片交接、素材对比视口与节点创建菜单图标；`materialLibraryPolicy`/`modelMediaInputLimits` 是素材库策略与模型媒体输入校验。接线时各自须补宿主装配（列表/详情分栏、框选面与选中集合、焦点捕获与旧页释放、`save`/`getSnapshot` 画布 store 端口、媒体元素与滑块、图片元素与 LOD 源、对比视图 state、`documentObject` 与 `stroke`、素材库消费方、Seedance 输入槽位与提交入口）。
- 这批模块大量依赖注入式宿主（`document`/`window`/`getComputedStyle`/`requestAnimationFrame`/定时器/`WeakMap` 缓存/媒体元素），离线测试全用假宿主与注入依赖；真实渲染、拖拽手感、切页动画与自动保存节流都未在真机验证。
- 7.3 受阻项与 15 件协作受阻件不变，须另行授权的生成件升级批；NodeReference 仍缺 `resolveCanvasVideoPosterUrl`。
- R01–R26 都没有完成。

## 24. 第 4–5 组：收尾与下一段

- 孤立台账 363→378 / 1125→1140；专题见本文件。
- 125e 队列 47 件**已全部落地**（前三组 32 件 + 第 4–5 组 15 件），余 **0 LEAF**。
- 下一段转 **109 件 OK**：先跑导出闸门，77 件「无缺失导出」可直接成批落地，另 32 件因 46 个缺失导出（如 `storyAgentComposition` 2、`directorViewportRuntime` 3、`panoramaSceneCommands` 4、`emptyCanvasOnboarding` 4 等）受阻，须先补依赖侧导出或结伴落地，不得为过闸门而放宽实现。
- 7.3 受阻项与 15 件协作受阻件不变，须另行授权的生成件升级批；NodeReference 仍缺 `resolveCanvasVideoPosterUrl`。
- R01–R26 都没有完成。
