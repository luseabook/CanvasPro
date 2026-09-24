# 第50批 · 本地媒体任务句柄层与播放代理共享模块（`registerLocalMediaTaskHandlers` + `videoPlaybackProxy` + 队列超时）

> 批次范围：把本仓 `main.js` 里**内联且已过期**的 7 个本地媒体任务句柄抽成新版同名模块 `mediaTasks/registerLocalMediaTaskHandlers.js`，补上**从未存在**的 `videoAudioMux` 句柄；同时移植新版共享模块 `videoPlaybackProxy.js`，让 `main.js` 与 `projectPackageService.js` 改用**版本化**代理文件名；并把新版 `MediaTaskQueue.runProcess` 的 `options.timeoutMs` 实现补进本仓（第49批文档记为欠项的那条）。
> 本批**不覆盖**渲染器 `audioVoicePanel.js`(142 KB) / `audioVoiceAsrProviders.js` / `audioVoiceLocalAsrRuntime.js`，也不含 `runtime/ffmpeg/` 打包、`assetCapabilityOperations.js`（R02）与新版 `runProcess` 的启动重试/优先级调度。
> 所有证据均为**离线**：`node --check` 与 `node --test`，未联网、未启动应用、未执行真实 ffmpeg 转码。

---

## 1 · 缺口（第50批之前）

新版把媒体任务宿主拆成了 `mediaTaskRuntime.js`（本仓对应 `main.js` 的媒体任务段）+ `mediaTasks/registerLocalMediaTaskHandlers.js`（本地句柄）+ `videoPlaybackProxy.js`（播放代理共享助手）。本仓只有 `main.js` 里的**内联版**，且三处都比新版落后一代：

| 检查 | 第50批之前 |
| --- | --- |
| `electron/mediaTasks/registerLocalMediaTaskHandlers.js` | **不存在** |
| `main.js` 内联本地句柄 | **7 个**（`videoPoster` / `audioWaveform` / `videoFirstFrame` / `videoCut` / `audioCut` / `videoAudioSeparate` / `videoCompose`），共 357 行 |
| `videoAudioMux` 句柄 | **全仓 0 个** ⇒ 第49批已把该 kind 写进 `api/localMediaTaskApi.js` 的 `SOURCE_REQUIRED_KINDS`（渲染器会校验 `src`），但 `enqueue` 必然抛 `Unsupported media task kind: videoAudioMux` — **校验面与句柄面不一致** |
| 内联 `videoCompose` 的 `includeAudio` | **不支持** ⇒ 第49批渲染器校验已允许 `includeAudio === false` 时只传 1 路源，内联句柄却仍要求 ≥2 路，抛 `Invalid video compose sources` — **又一处校验面/句柄面不一致** |
| `electron/videoPlaybackProxy.js` | **不存在** ⇒ 内联 `needsBrowserVideoProxy` 无**长边 1280 门槛**；`getVideoProxyPaths` 产出 `foo.proxy.mp4`（**无版本后缀**）；无并发去重；结果无 `videoProxyVersion` 字段；转码不设超时 |
| `projectPackageService.js` 的可恢复派生物回退链 | 只认 `foo.proxy.mp4` ⇒ 与新版 `foo.proxy-v2-1280.mp4` 不匹配 |
| `MediaTaskQueue.runProcess` 的 `options.timeoutMs` | **未实现**（静默忽略）——第49批文档已记为验收欠项「长转写无超时」 |

**关键判断**：`videoPlaybackProxy.js` 是**被 4 个不同模块消费**的共享模块（新版 `mediaTaskRuntime.js` / `assetCapabilityOperations.js` / `mediaTasks/registerLocalMediaTaskHandlers.js` / `projectPackageService.js`），不是某模块的私有助手。因此本批按新版原样移植该模块，并把本仓已有的内联副本**改接**到它，而不是保留两份会各自漂移的 `needsBrowserVideoProxy`。

---

## 2 · 本批交付

### 2.1 文件

| 文件 | 性质 | 说明 |
| --- | --- | --- |
| `electron/videoPlaybackProxy.js` | 新增（可读移植，3867 B） | **零 import**；8 个导出：2 常量 + 6 函数 |
| `electron/mediaTasks/registerLocalMediaTaskHandlers.js` | 新增（可读移植，16279 B） | 仅 `node:crypto` / `node:fs` / `node:path` + `../videoPlaybackProxy.js`；1 个导出 `registerLocalMediaTaskHandlers(queue, deps)`，注册 **8** 个 kind |
| `electron/main.js` | 修改 | +1 import（`videoPlaybackProxy.js` 的 6 个符号）；新增模块级 `videoPlaybackProxyWorkDeduper`；删除内联 `needsBrowserVideoProxy`；`getVideoProxyPaths` 改用版本化文件名；`ensureAssetVideoPlaybackProxy` 拆为 `runAssetVideoPlaybackProxy`（真正干活）+ `ensureAssetVideoPlaybackProxy`（去重包装）；**删除 7 个内联 `setHandler` 块**（357 行）→ 1 次 `registerLocalMediaTaskHandlers(mediaTaskQueue, {13 键})` |
| `electron/mediaTaskQueue.js` | 修改 | 新增 `export class MediaTaskProcessTimeoutError`；`runProcess` 实现 `options.timeoutMs`（定时器 + `kill()` + `unref()`，结算时 `clearTimeout`） |
| `electron/projectPackageService.js` | 修改 | +1 import；可恢复派生物回退链**首位**改为 `getVideoPlaybackProxyFilename(name)`，`.proxy.mp4` 保留为第二位（兼容旧包） |
| `electron/videoPlaybackProxy.test.js` | 新增 | 13 项离线用例 |
| `electron/mediaTasks/registerLocalMediaTaskHandlers.test.js` | 新增 | 21 项离线用例 |
| `electron/mediaTaskQueue.processTimeout.test.js` | 新增 | 5 项离线用例 |

### 2.2 行为要点

**`videoPlaybackProxy.js`（8 导出）**

- 常量：`VIDEO_PLAYBACK_PROXY_MAX_LONG_EDGE = 0x500`、`VIDEO_PLAYBACK_PROXY_VERSION = 'v2-1280'`。
- `resolveVideoPlaybackProxyTimeoutMs(durationSec)`：`durationMs * 12`，夹在 `[5 分钟, 6 小时]`。**原样保留的怪癖**：`Number('abc')` 为 `NaN`，故传非数字字符串返回 `NaN`（测试按实现如实断言）。
- `createVideoPlaybackProxyWorkDeduper()`：`Map` 支撑的 `{ async run(key, factory) }`——同 key 并发折叠到同一 Promise，成功后**删除**条目（后续调用重新执行），失败后也删除（后续调用可重试），空 key / 非函数直接执行不缓存。
- `finalizeVideoPlaybackProxyMigrationResult(result, {sourceLocalPath, targetVersion})`：**仅**当 `targetVersion === 'v2-1280'` 且 `result.videoProxyStatus === 'not_required'` 且源路径非空时，补 `displayLocalPath` / `displayUrl` / `videoProxyVersion`；其余情况**原样返回**（同一对象）。`\\`→`/` 归一化由 `.replace(/\\/g,'/')` 完成，因此**以反斜杠开头**的输入会得到前导 `/`。
- `needsBrowserVideoProxy(meta)`：长边 > `0x500` → `true`（**新版独有**）；无 `codecName` → `true`；`h264` → `!!pixelFormat && !== 'yuv420p' && !== 'yuvj420p'`（**空 `pixelFormat` 为 `false`**）；`vp8`/`vp9` → `formatName` 不含 `webm`/`matroska`；`av1` → `false`；其余 → `true`。
- `getVideoPlaybackProxyFilename(assetKey)` / `isCurrentVideoPlaybackProxyLocalPath(localPath, assetKey)`：`<key>.proxy-v2-1280.mp4`，路径判定先 `\`→`/` 再 `endsWith('/derived/video/' + filename)`。
- `buildVideoPlaybackProxyFfmpegArgs({inputPath, outputPath, preset, crf})`：28 段 argv，含 `-map 0:v:0 -map 0:a? -dn -sn`、`libx264/yuv420p/profile high`、`aac 192k`、`+faststart`；缩放图串为 `scale=w='min(iw\,1280)':h='min(ih\,1280)':force_original_aspect_ratio=decrease:force_divisible_by=2`（**保留转义逗号**）。

**`registerLocalMediaTaskHandlers.js`（8 kind / 13 依赖）**

- 依赖键（与 `main.js` 传入一一对应）：`buildWaveformJsonFromFloat32`、`createOutputFilename`、`ensureAssetVideoPlaybackProxy`、`ffprobeHasAudio`、`ffprobeVideoMeta`、`getAssetsDir`、`getOutputDir`、`getRuntimeToolOrFallback`、`resolveMediaTaskSource`、`sendAssetUpdated`、`toAssetLocalPath`、`toOutputLocalPath`、`updateAssetRecord`。
- 内部 `runVideoTranscode(deps, task, queue, args, options)`：`deps.runFfmpegTask` 是函数时优先用它，否则回落 `queue.runProcess(task, deps.getRuntimeToolOrFallback('ffmpeg'), args, options)`。本仓**不传** `runFfmpegTask`（仓内无该键），因此走回落路径——与新版转码等价。
- 常量：`VIDEO_POSTER_TIMEOUT_MS = 0xea60`（60 s）、`AUDIO_WAVEFORM_TIMEOUT_MS = 0x1e * 0x3c * 0x3e8`（30 min）。
- `videoPoster`：`assetKey = payload.assetId.trim()` 或源路径的 sha1；写 `assets/derived/video/<key>.poster.jpg`（`-y -ss 0.1 -i <src> -frames:v 1 -vf scale=640:-2`，`timeoutMs: 60 s`）；`ensureAssetVideoPlaybackProxy` 的结果经 `finalizeVideoPlaybackProxyMigrationResult(..., {sourceLocalPath, targetVersion: payload.videoProxyTargetVersion})` 包装；有 `assetId` 时调 `updateAssetRecord(assetId, patch, {expectedMediaTaskId})` + `sendAssetUpdated`（本仓 `updateAssetRecord` 只吃 2 参，第 3 参被其实现忽略，**不是**本模块的缺陷）。
- `audioWaveform`：`-v error -i <src> -ac 1 -ar 8000 -f f32le pipe:1` → `assets/derived/audio/<key>.waveform.json`（`timeoutMs: 30 min`，末尾补 `'\n'`）。
- `videoFirstFrame`：`src.replace(/^\/+/,'') + '|' + mtimeMs + '|' + size` 的 12 位十六进制 → `<out>/VideoThumbs/vthumb_<hash>.jpg`（`-ss 0 -frames:v 1 -vf scale=240:-2 -q:v 8 -an`）。
- `videoCut` / `audioCut`：范围非法抛 `Invalid video cut range` / `Invalid audio cut range`；`videoCut` 仅在 fps ∈ `[0x10, 0x18, 0x1e]` 时保留 fps。
- `videoAudioSeparate`：无视频流抛 `Source video has no video stream`、无音频流抛 `Source video has no audio stream`；两次 `runProcess`（视频 `-map 0:v:0 -an -c:v copy`，`initialProgress: 0.05`；音频 `-map 0:a:0 -vn -c:a libmp3lame -b:a 192k`，`initialProgress: 0.55`），中间 `emitProgress(task, 0.55, 'Extracting audio')`。
- `videoCompose`：**新增** `includeAudio = payload.args?.includeAudio !== false`；守卫 `absList.length < 1 || (absList.length < 2 && includeAudio)` → `Invalid video compose sources`；逐源滤镜 `scale=W:H:force_original_aspect_ratio=decrease,pad=...,setsar=1,fps=F,format=yuv420p,setpts=PTS-STARTPTS[vi]`（有音频再加 `aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS[ai]`），`concat=n=N:v=1:a=1`（或 `:v=1:a=0`），`-c:a aac` 仅在 `hasAudio` 时加。
- `videoAudioMux`（**此前完全缺失**）：读 `payload.src || args.src` 与 `args.audioSrc || payload.audioSrc`；缺视频流抛 `Source video has no video stream`、缺音频流抛 `Source audio has no audio stream`；`-y -i <v> -i <a> -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -af apad`，`duration > 0` 时 `-t <duration>` 否则 `-shortest`，再 `-movflags +faststart`，`{durationSec, progressMessage: 'Muxing video audio'}`。

**`MediaTaskQueue.runProcess` 的 `timeoutMs`**

- `timeoutMs = max(0, trunc(Number(options.timeoutMs || 0) || 0))`；> 0 时挂 `setTimeout`：构造 `MediaTaskProcessTimeoutError(command, timeoutMs)` → `child.kill()`（包 `try/catch`）→ 以该错误 reject；句柄 `unref?.()`，且**在 resolve / reject / cancel 任一结算路径上 `clearTimeout`**。

### 2.3 与新版是否有差异

| 项 | 新版 | 本仓本批 | 影响 |
| --- | --- | --- | --- |
| 转码驱动 | `runFfmpegTask`（`ffmpegVideoEncoderRuntime.js`） | `queue.runProcess`（模块已支持 `deps.runFfmpegTask` 优先） | 无行为差异；`ffmpegVideoEncoderRuntime.js` 仍缺（属 §6） |
| `runProcess` 启动重试 | `spawnMaxAttempts` / `spawnRetryDelayMs` + `shouldRetrySpawnError` | **未实现**（单次 spawn） | 启动竞态容错仍弱（属 §6） |
| `runProcess` 结算闸门 | 有独立 `settled` 标志 | 用「结算即 `clearTimeout`」达成同效 | 极窄竞态下可能二次 reject（Promise 语义下为无害 no-op） |
| `_pump` 调度 | 按 `priority` 选队 | 仍 FIFO | 属 §6 |
| `MediaTaskQueue` 构造 | 可注入 `spawnImpl` | 不支持（测试改用真实 `process.execPath` 子进程） | 仅影响可测性 |
| `assetCapabilityOperations.js` 对 `needsBrowserVideoProxy` 的消费 | 已消费 | 模块未移植，`main.js:1805` 的**导入期**判定暂留 main.js | 待 R02 移植时一并收编 |

---

## 3 · 接线现状与可达性

已接线：

1. **宿主链**：`main.js` 的 `getMediaTaskQueue()` 现按新版顺序 `new MediaTaskQueue(...)` → `registerLocalMediaTaskHandlers(...)`（13 键）→ `registerSharedMediaTaskHandlers(...)`；句柄总数 **14**（本地 8 + 共享 6，另含第49批的 5 个分析/模型句柄）。`mediaTask:enqueue` 对 kind **无白名单**，`window.electronAPI` → IPC → 句柄全链可达。
2. **校验面/句柄面一致**：第49批写入 `SOURCE_REQUIRED_KINDS` 的 `videoAudioMux` 现在**真有句柄**；第49批放行的 `videoCompose({includeAudio:false, 单源})` 现在**真被接受**。两处此前的不一致已消除。
3. **代理文件名统一**：转码产物、去重键、导入期代理判定、项目包回退链四处**同一**版本号来源（`VIDEO_PLAYBACK_PROXY_VERSION`），不再有 `foo.proxy.mp4` 与 `foo.proxy-v2-1280.mp4` 的分叉。
4. **超时可生效**：`ensureAssetVideoPlaybackProxy` 与 `audioVoiceAnalyzeTask` 之外的长任务现在**可以**通过 `runProcess(..., {timeoutMs})` 真正设超时（此前该键被静默丢弃）。

**仍未接线（有意如实记录）**：

- **8 个本地 kind 仍无渲染器调用点**——没有「视频倒放 / 合并音视频 / 独立封面」等按钮，本批交付的是宿主链与一致性修复；`api/localMediaTaskApi.js` 只提供校验与 enqueue 通道。
- 结果回写：本仓 `mediaTaskService` 的四类回写白名单不含本批多数 kind 产物（仅 `videoPoster` 走 `updateAssetRecord` + `sendAssetUpdated` 的资产回写路径）。
- `runtime/ffmpeg/` 未随包；`getRuntimeToolOrFallback('ffmpeg')` 在真实打包产物中能否解析到二进制未在本批核实。
- 旧代理文件（`foo.proxy.mp4`）在版本化后**不再被新代码当作当前代理**：`isCurrentVideoPlaybackProxyLocalPath` 判定为 `false`，项目包回退链仍把旧名作为兼容候选。

---

## 4 · 已执行的验证（离线）

命令与结果（本窗口实测）：

| 命令 | 结果 |
| --- | --- |
| `node --check` × 8（`videoPlaybackProxy.js`、`mediaTasks/registerLocalMediaTaskHandlers.js`、`mediaTaskQueue.js`、`main.js`、`projectPackageService.js` + 3 个新测试文件） | 8/8 exit 0 |
| `node --test electron/videoPlaybackProxy.test.js` | **13/13 通过** |
| `node --test electron/mediaTasks/registerLocalMediaTaskHandlers.test.js` | **21/21 通过** |
| `node --test electron/mediaTaskQueue.processTimeout.test.js` | **5/5 通过** |
| `node --test $(find electron -name '*.test.js')` | **651/650/1** |
| `node --test $(find api -name '*.test.js')` | **446/446/0** |
| `git diff --cached/--name-only` 快照 | `0/55/297/0`（第49批落盘后为 `0/55/292/0`，**+5** 与本批 5 个新文件逐一相符） |

- 唯一失败仍是既有 `electron/fullProjectPackageService.test.js` 的用例 `missing manifest coverage cannot bind to an existing unrelated local file`（R14 第17批遗留），与第43–49批一致——**注意本批改了 `projectPackageService.js`，故该文件也是本批改动的回归面**，其失败未新增、未变化。
- 相对第49批 612/611/1：本批 **+39**（13+21+5），全量 **651/650/1**；`api` 面 446/446/0 证明本批未触碰 `api/` 面。

**首跑修正 2 处测试期望（均为测试写错，实现未改）**：

1. `needsBrowserVideoProxy({codecName:'h264', pixelFormat:''})` 我期望 `true`，实际 `false`——实现是 `!!pixelFormat && ...`，`!!''` 为 `false`；已改为 `false` 并补一条 `{codecName:'h264'}`（无 `pixelFormat`）的同值断言。
2. `finalizeVideoPlaybackProxyMigrationResult` 的 `displayLocalPath` 我期望 `'data/assets/clip.mp4'`，实际 `'/data/assets/clip.mp4'`——输入 `'\data\assets\clip.mp4'` 的**前导反斜杠**经 `.replace(/\\/g,'/')` 变成前导斜杠；已按实现改正期望。

---

## 5 · 验收欠项（仍未执行，须授权）

- **真实 ffmpeg 转码代理**：1280 长边缩放、`yuv420p`、`+faststart` 的真实产物与时长为 0 / 极短 / 无音轨的输入组合；`timeoutMs` 目前只在 **Node 子进程**上验证，未在真实 ffmpeg 长任务上验证。
- **真实应用内**导入大尺寸 / `yuv444p` / vp9-in-mp4 视频，是否实际生成 `<key>.proxy-v2-1280.mp4` 并写回 `videoProxyVersion`；旧 `<key>.proxy.mp4` 资产的画布表现。
- **8 个 kind 的真实端到端**（`videoAudioMux` / `videoCompose(includeAudio:false)` 优先，因其校验面-句柄面一致性是本批刚修好的）。
- **`projectPackageService` 打包/恢复**：版本化代理名是否被正确打进 `.aicpkg` 并在恢复端解析（本批只改了「可恢复派生物」回退链首位）。
- 取消语义：`mediaTask:cancel` 与新增 `timeoutMs` 定时器的交互（取消先到 / 超时先到两条路径）。
- 打包：`runtime/ffmpeg/` 是否随包；`ffmpegVideoEncoderRuntime.js` 缺失时转码在真实产物中的表现。

---

## 6 · 剩余工作

| 项 | 规模 | 状态 |
| --- | --- | --- |
| 本地句柄层（8 kind）+ 播放代理共享模块 + 队列 `timeoutMs` | 3867 + 16279 B | ✅ **本批** |
| `audioVoiceAnalyze` 宿主链 + 5 句柄 + 3 前置模块 | 55206 B | ✅ 第49批 |
| `audioVoiceComposeTask` + 注册 | 10778 B | ✅ 第48批 |
| `doubaoAsrClient` + `audioVoiceCloudAsr` | 13068 + 1220 B | ✅ 第47批 |
| `videoToGifTask` + 注册 | 9115 B | ✅ 第46批 |
| 渲染器 `audioVoicePanel.js`(142 KB) / `audioVoiceAsrProviders.js` / `audioVoiceLocalAsrRuntime.js` | — | ❌ 未移植（含本批多数 kind 的 UI 入口） |
| `assetCapabilityOperations.js`（含 `needsBrowserVideoProxy` 的第 4 个消费点） | ~21 KB + 6 依赖 | ❌ 未移植（R02） |
| `runProcess` 启动重试（`spawnMaxAttempts`/`spawnRetryDelayMs`）、`_pump` 优先级、`spawnImpl` 注入 | — | ❌ 未移植 |
| `ffmpegVideoEncoderRuntime.js`（`runFfmpegTask` + 编码器运行时） | — | ❌ 未移植 |
| `runtime/ffmpeg/` 打包、`/api/v2/video-gif`、`backend/services/*.py` 随包核实 | — | ❌ 未做 |

---

## 7 · 约束复核

- 未触碰 `api/freeImageHostApi.js`（本批未改动该文件）。
- 未新增 npm 依赖（新增模块仅用 `node:crypto` / `node:fs` / `node:path`）。
- 未改授权检查、未改安装目录、未改 `style.css`；未改 `MediaTaskQueue` 既有方法签名（**仅新增** `timeoutMs` 行为与 `MediaTaskProcessTimeoutError` 导出）。
- 删除的是 `main.js` 中**已被同名模块取代**的内联句柄，`main.js` 净删 87 行（642 行改动中 357 行删自 7 个句柄块），未删除任何仍被引用的函数。
- 未联网、未启动应用、未执行真实 ffmpeg、未调用真实 ASR、未提交/推送。
