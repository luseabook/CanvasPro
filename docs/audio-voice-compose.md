# 第48批 · R16 语音工作室合成宿主任务链（`audioVoiceCompose`）

> 批次范围：R16（ASR / 转写 / 说话人分离 / **音频合成** / 视频转 GIF）中的「语音工作室合成」一条宿主任务链。
> 本批**不覆盖** `audioVoiceAnalyzeTask.js` 驱动、渲染器面板与 `runtime/ffmpeg/` 打包。
> 所有证据均为**离线**：`node --check` 与 `node --test`，未联网、未启动应用、未执行真实 ffmpeg。

---

## 1 · 缺口（第48批之前）

0.7.16 的 `resources/webapp/electron/mediaTasks/audioVoiceComposeTask.js`（10778 B）在本仓**完全没有对应物**：

| 检查 | 第48批之前 |
| --- | --- |
| `grep -rn "audioVoiceCompose"` 全仓（除本批新增） | **0 命中** |
| `mediaTaskQueue.enqueue({ kind:'audioVoiceCompose' })` | 抛 `Unsupported media task kind: audioVoiceCompose` |
| `api/localMediaTaskApi.js` 的 `SOURCE_REQUIRED_KINDS` | **不含** `audioVoiceCompose`（新版含该 kind 的消费方） |
| `getMediaTaskDisplayName`（本仓 `main.js:1488`） | 原本**无** `audioVoiceCompose` 键（**新版 `mediaTaskRuntime.js:71` 有**：`'语音工作室合成'`） |

新版里这条链的注册点是 `mediaTasks/registerSharedMediaTaskHandlers.js:39` 的 `setHandler('audioVoiceCompose', …)`；本仓此前只注册了八个句柄。本批把宿主侧整条链补齐，并把渲染器校验面补上。

---

## 2 · 本批交付

### 2.1 文件

| 文件 | 性质 | 说明 |
| --- | --- | --- |
| `electron/mediaTasks/audioVoiceComposeTask.js` | 新增（可读移植） | 仅 `node:fs` / `node:path`；3 个导出 + 1 个工厂 |
| `electron/mediaTasks/registerSharedMediaTaskHandlers.js` | 修改 | 新增 import 与 `setHandler('audioVoiceCompose', …)`（**第九个**句柄） |
| `electron/main.js` | 修改 | `getMediaTaskDisplayName` 映射增 `audioVoiceCompose: '语音工作室合成'`（一行） |
| `api/localMediaTaskApi.js` | 修改 | `SOURCE_REQUIRED_KINDS` 增 `'audioVoiceCompose'`（一行） |
| `electron/mediaTasks/audioVoiceComposeTask.test.js` | 新增 | 17 项离线用例 |

### 2.2 行为要点

导出面：

- `normalizeAudioVoiceClips(clips = [])` — 归一化片段轨。非数组返回 `[]`；逐项要求对象且 `src ?? localPath ?? path ?? audioUrl` 去空格后非空，否则丢弃。`startMs`/`timelineStartMs` 默认 `0` 并向下夹到 `0`；`endMs`/`timelineEndMs` 默认等于 `startMs` 且不小于 `startMs`。时长优先级为**显式时长 > 时间轴跨度**：`durationMs` 直接取值，`durationSec` 乘 1000，任一为正即置 `hasExplicitDuration: true`；否则取 `endMs - startMs`。`durationMs <= 0` 的项丢弃。产出 `{ src, startSec, durationSec, hasExplicitDuration }`。
- `buildAudioVoiceComposeFfmpegArgs({ sourceKind, outputKind, sourceAbs, clipAbs, clips, durationSec, outAbs })` — 缺 `outAbs` / 时长为 0 / 片段为空即抛 `Invalid audio voice compose payload`。`sourceKind` 只认 `audio`（其余回落 `video`）；`outputKind` 只认 `audio`，否则回落 `sourceKind`。**仅当"视频源 → 视频输出"时**才把 `sourceAbs` 作为第 0 路输入，否则只吃片段文件（此时 `sourceAbs` 完全不进参数表）。滤镜图为每片段一条 `[<n>:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:<dur>,asetpts=PTS-STARTPTS,adelay=<ms>|<ms>[av<i>]`（`n` 在视频源在场时整体偏移 1，`ms = round(startSec * 1000)`），末段为 `单片段 ? '[av0]apad' : '<各[av<i>]>amix=inputs=<n>:duration=longest:normalize=0,apad'`，再接 `,atrim=0:<总时长>[a]`，全部以 `;` 连接。视频输出补 `-map 0:v:0 -map [a] -t <dur> -c:v libx264 -pix_fmt yuv420p -profile:v high -preset fast -c:a aac -movflags +faststart`；音频输出补 `-map [a] -t <dur> -vn -c:a (视频源 ? 'aac' : 'libmp3lame') -b:a 192k`。
- `createAudioVoiceComposeMediaTaskHandler(deps)` — 任务句柄。流程：`normalizeSourceKind(args.sourceKind ?? payload.sourceKind)` → `normalizeOutputKind(args.outputKind ?? payload.outputKind, sourceKind)` → `resolveMediaTaskSource(payload.src || args.src)` → `normalizeAudioVoiceClips(args.clips || payload.clips)`，**片段为空立即抛 `Invalid audio voice compose clips`（在任何探测/编码之前）** → 逐片段 `resolveMediaTaskSource` → 对**无显式时长**的片段逐个 `ffprobe` 补时长 → `clipTimelineEndSec = max(各 startSec + durationSec, 0)` → 视频源先 `ffprobeVideoMeta` 且宽高任一为 0 抛 `Source video has no video stream` → 总时长取 `durationSec || durationMs/1000 || 源时长 || clipTimelineEndSec`（源时长：视频源取 `ffprobeVideoMeta.duration`，音频源走 `ffprobe format=duration`）→ 输出目录 `AudioVoiceVideo`/`AudioVoiceAudio` 建目录 → 文件名后缀 `mp4`/`m4a`/`mp3` → `runFfmpeg(task, queue, args, { durationSec, progressMessage: 'Composing voice video' | 'Composing voice audio' })` → **视频输出**额外用 `ffmpeg -frames:v 1 -vf scale=240:-2 -q:v 8` 生成 `<out>/VideoThumbs/voice_compose_poster_*.<ext>` 海报（失败被 `.catch(() => ({}))` 吞掉，不影响主结果）。结果对象含 `success/filename/path/localPath/url/audioDuration`，视频输出再加 `videoDuration/videoWidth/videoHeight/fps` 与四个海报字段（`posterLocalPath`/`thumbLocalPath`/`posterUrl`/`thumbUrl`）。
- 依赖注入面：`createOutputFilename` / `ffprobeVideoMeta` / `getOutputDir` / `getRuntimeToolOrFallback` / `resolveMediaTaskSource` / `toOutputLocalPath` 必填；`runFfmpegTask` 可选（缺则回落 `queue.runProcess(task, getRuntimeToolOrFallback('ffmpeg'), args, options)`）。**测试因此完全不 spawn 进程、不调用真实 ffmpeg。**

### 2.3 与新版是否有差异

| 项 | 新版 | 本批 | 说明 |
| --- | --- | --- | --- |
| 算法与字符串 | — | 逐行等价（`0x` 十六进制字面量原样保留） | 无行为差异 |
| 导出面 | **仅**导出 `createAudioVoiceComposeMediaTaskHandler` | 额外导出 `buildAudioVoiceComposeFfmpegArgs` 与 `normalizeAudioVoiceClips` | **有意的加法差异**：新版的 `videoToGifTask` 本来就导出内部函数，本模块没有；为让参数表与片段归一化可离线单测而加 `export`，**不改任何行为** |
| 依赖键 | 传 `runFfmpegTask`（新版 `main.js` 有该键） | **不传** `runFfmpegTask` | 本仓 `main.js` 无该键，句柄内建回落即 `queue.runProcess`，行为一致 |
| `getMediaTaskDisplayName` | **有** `audioVoiceCompose: '语音工作室合成'` | **同样补上**（一行） | 与第46批 `videoToGif` 的处理**不同**——那一项新版也没有，故不加；本项新版有，故照搬 |
| `progressMessage` 进度 | 通过队列透出 | 本仓 `MediaTaskQueue.runProcess` **已实现** `options.durationSec` 解析与 `options.progressMessage` 透出 | 本模块的进度文案**能到渲染器**；`emitProgress` 第 4 参 `{stage}` 曾被忽略，第54批队列升级后亦已透传 |
| 渲染器消费 | 面板 + `api/localMediaTaskApi.js` | 仅 `SOURCE_REQUIRED_KINDS` 放行 | 见 §3 |

---

## 3 · 接线现状与可达性

已接线：

1. `registerSharedMediaTaskHandlers` 注册第九个句柄 `audioVoiceCompose`；所需六键（`createOutputFilename` / `ffprobeVideoMeta` / `getOutputDir` / `getRuntimeToolOrFallback` / `resolveMediaTaskSource` / `toOutputLocalPath`）在第44/45/46批**已供齐**，**本批零新增 `main.js` 依赖键**。
2. `electron/ipc/mediaTaskIpc.js` 的 `mediaTask:enqueue` 对 kind **无白名单**，原样交给 `queue.enqueue`，因此 `window.electronAPI` → IPC → 句柄全链可达。
3. `api/localMediaTaskApi.js` 的 `SOURCE_REQUIRED_KINDS` 增 `audioVoiceCompose`：此后渲染器侧 `enqueueElectronMediaTask({ kind:'audioVoiceCompose', src, args })` 的 `src` 缺失或非法会被明确拒绝，而非静默通过。

**仍未接线（有意如实记录）**：

- 渲染器**没有** `audioVoiceCompose` 的调用点——全仓（除本批新增两文件）仍 **0 命中**；没有"合成语音视频/音频"按钮、工具栏动作或结果渲染分支。故本批交付的是**宿主链 + 渲染器校验面**，不是"用户点得出来"的功能。
- 结果回写：本仓 `mediaTaskService` 的四类白名单结果不含 `audioVoiceCompose` 的产物，故不会被自动写回画布节点，需人工取回（与第25批契约一致）。
- `runtime/ffmpeg/` 未随包，真实编码依赖运行期 `getRuntimeToolOrFallback('ffmpeg')` 能找到 ffmpeg。

---

## 4 · 已执行的验证（离线）

命令与结果（本窗口实测）：

| 命令 | 结果 |
| --- | --- |
| `node --check electron/mediaTasks/audioVoiceComposeTask.js` | exit 0 |
| `node --check electron/mediaTasks/audioVoiceComposeTask.test.js` | exit 0 |
| `node --check electron/mediaTasks/registerSharedMediaTaskHandlers.js` | exit 0 |
| `node --check api/localMediaTaskApi.js` | exit 0 |
| `node --check electron/main.js` | exit 0 |
| `node --test electron/mediaTasks/audioVoiceComposeTask.test.js` | **17/17 通过** |
| `node --test $(find electron -name '*.test.js')` | **567/566/1** |

- 唯一失败仍是既有 `electron/fullProjectPackageService.test.js` 的 `/未包含/` 断言（R14 第17批遗留，用例名 `missing manifest coverage cannot bind to an existing unrelated local file`），与第43–47批一致。
- 相对第47批 550/549/1：本批 **+17**，全量 **567/566/1**。

`audioVoiceComposeTask.test.js` 覆盖面（17 项）：

- `normalizeAudioVoiceClips` 4 项：非数组/非对象/空 `src` 丢弃、`src` 别名与时间轴跨度换算成秒、显式 `durationMs`/`durationSec` 优先于跨度并置 `hasExplicitDuration`、倒置时间轴被夹为 0 时长后丢弃。
- `buildAudioVoiceComposeFfmpegArgs` 4 项：**整表 `deepEqual`**（视频源 + 两片段，含 `adelay` 偏移、`amix` 末段、`atrim` 总时长、视频输出全参数）、视频源转音频整表（含**不出现** `sourceAbs`）、单片段 `apad` 与音频源 `libmp3lame`、三种残缺入参均抛 `Invalid audio voice compose payload`。
- `createAudioVoiceComposeMediaTaskHandler` 7 项：空片段在**任何进程之前**拒绝且不建目录、视频源无视频流在编码前拒绝、零时长片段由**片段守卫**（而非时长守卫）拒绝、视频输出落 `AudioVoiceVideo/…mp4` 并生成海报（两条 ffmpeg 调用的 `options` 深比较 + 海报参数含 `-ss`）、显式时长压过探测源时长（`.m4a`、无 `video*` 字段、无海报字段）、无显式时长的片段被 `ffprobe` 补时长（滤镜图逐字符比对 + `toolCalls === ['ffprobe','ffprobe','ffmpeg']` 证明"先片段后源"的探测顺序）、注入 `runFfmpegTask` 时**进程数与工具查询均为 0**（证明未走回落）。
- 注册面 2 项：用**真实 `MediaTaskQueue`** 注册句柄后平铺 `enqueue({kind:'audioVoiceCompose', taskId, nodeId, src, args})` 跑到 `complete` 并核对 `result` 与 `onUpdate` 快照流；`registerSharedMediaTaskHandlers` 在 stub 队列上落出 `audioVoiceCompose` 函数。

**首跑 4 项失败，其中 3 项是测试期望写错、1 项是实现缺陷（已修）**：

1. "残缺入参"里我写的第二组（`outAbs` 齐全、`durationSec: 5`、单片段）其实是**合法**输入，故未抛错——改为 `outAbs: ''`。
2. "显式时长压过源时长"里我断言 `ffprobeVideoMeta` **未**被调用，但视频源**恒会**调用它（只是结果不用于时长）——改为断言调用 **1 次**。
3. "片段补时长"里我用 `{ src: 'clip-a.mp3' }`（无任何时长/跨度信息），被片段守卫丢弃，根本到不了探测——改为带 `startMs: 1000, endMs: 5000` 的跨度片段。
4. **实现缺陷**：我在两处把 `ffprobeMediaDuration(queue, task, …)` 误写成 `(task, queue, …)`。该函数内部 `try/catch` 会把 `task.runProcess is not a function` 的 `TypeError` 吞掉并返回 `0`，于是**片段与源两条时长探测全部静默失效**，总时长退化为"时间轴跨度"。这是移植时抄错形参顺序导致的真实 bug，若只靠"跑得通"根本不会暴露；测试从滤镜图的 `atrim=0:3.5` 与 `audioDuration` 上抓到了它。修正后 17/17。

**顺带核实的死分支（新版同样存在，未改）**：`Invalid audio voice compose duration` 守卫在 `clips.length > 0` 时**不可达**——片段归一化已丢弃所有 `durationSec <= 0` 的项，故 `clipTimelineEndSec` 恒大于 0，总时长必为正。测试据此改名并断言实际抛的是"片段"错误。

---

## 5 · 验收欠项（仍未执行，须授权）

- **真实应用内**从渲染器发起 `audioVoiceCompose` 任务并得到可播放的 mp4（视频源 → 视频输出）与 mp3/m4a（音频输出），含海报生成。
- **真实 ffmpeg**：`MediaTaskQueue.runProcess` 的 `timeoutMs`（第50批补入）与 `spawnMaxAttempts`/`spawnRetryDelayMs`（第54批补入）均**未经真实 ffmpeg 验证**；本模块调用点未传 `timeoutMs`，故合成与海报阶段实际无超时。
- 多片段时间轴的真实对齐质量：`adelay` 以 `round(startSec * 1000)` 为粒度，长片段叠加后的 A/V 漂移未验证。
- 无音轨的视频源、损坏文件、0 字节文件的真实报错文案。
- 取消语义：真实任务进行中 `mediaTask:cancel` 是否落在两次 ffmpeg 之间（本模块自身**不调用** `queue.throwIfCancelled`，取消只能由 `runProcess` 在 spawn 前后生效）。
- 长任务在 `concurrency: 2` 下与其他 ffmpeg 任务抢占时的表现。
- **未验证**：Windows 上 `AudioVoiceVideo`/`AudioVoiceAudio`/`VideoThumbs` 子目录的输出 URL 是否被画布的本地媒体协议正确解析。

---

## 6 · R16 剩余工作

| 项 | 规模 | 状态 |
| --- | --- | --- |
| `mediaTasks/videoToGifTask.js` + 注册 + 渲染器校验面 | 9115 B | ✅ 第46批 |
| `mediaTasks/doubaoAsrClient.js` + `audioVoiceCloudAsr.js` | 13068 + 1220 B | ✅ 第47批（零生产引用） |
| `mediaTasks/audioVoiceComposeTask.js` + 注册 + 显示名 + 渲染器校验面 | 10778 B | ✅ 本批 |
| `mediaTasks/audioVoiceAnalyzeTask.js` | 55206 B | ❌ 未移植（本地 funasr/sortformer 转写与分离的唯一入口，`python -m backend.services.*`；消费 `getFunasrModelRootDir`/`getSortformerModelRootDir`/`getPythonCertificateEnv`） |
| `main.js` 的 `getFunasrModelRootDir()` / `getSortformerModelRootDir()` 消费点 | — | ❌ 未接线（第43批两个模型根解析器因此仍"生产零引用"） |
| 渲染器 `audioVoicePanel.js`(142 KB) / `audioVoiceAsrProviders.js` / `audioVoiceLocalAsrRuntime.js` | — | ❌ 未移植（含 `audioVoiceCompose`/`videoToGif` 的 UI 入口） |
| `runtime/ffmpeg/` 打包、`/api/v2/video-gif` 等后端路由 | — | ❌ 未做 |

**移植 `audioVoiceAnalyzeTask.js` 的前置阻塞**：该文件第 7 行 `import { createProcessStartError } from '../mediaTaskQueue.js'`，而本仓 `electron/mediaTaskQueue.js` **不导出该符号**。必须先给队列补该工厂（或复用既有 `MediaTaskCancelledError` 等价错误构造），**不得静默丢弃该导入**。

---

## 7 · 约束复核

- 未触碰 `api/freeImageHostApi.js`（本批未改动该文件）。
- 未新增 npm 依赖（`audioVoiceComposeTask.js` 仅用 `node:fs`/`node:path`）。
- 未改 `MediaTaskQueue` 既有签名、未改授权检查、未改安装目录、未改 `style.css`。
- 未联网、未启动应用、未执行真实 ffmpeg、未提交/推送。
