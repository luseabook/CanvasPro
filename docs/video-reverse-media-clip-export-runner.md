# 第53批 · 共享媒体句柄 `runFfmpegTask` 收尾（`videoReverse` + `mediaClipExport`）

> 本批是第52批的收尾：0.7.16 的共享句柄注册里共有 **4 个**句柄声明 `runFfmpegTask` 依赖（`audioVoiceCompose` / `mediaClipExport` / `videoReverse` / `videoToGif`），第52批只接上了前 1 个和第 4 个的**生产侧**，`mediaClipExport` 与 `videoReverse` 两个句柄**既没有声明该依赖、也没有注入**，因此这两条链在任何情况下都只能走 `queue.runProcess(…, libx264, …)`，硬件编码运行时对它们完全不生效。
> 交付物：2 个既有句柄文件升级（`+6` / `+6` 行有效差异）+ 1 处注册接线 + 2 个新离线测试文件（24 个用例）。
> 全部验证为**离线**：`node --check` + `node --test`。未联网、未启动应用、未执行真实 ffmpeg、未提交。

---

## 1 · 缺口（第53批之前）

1. **两个句柄缺 `runFfmpegTask` 形参**——0.7.16 的 `mediaTasks/videoReverseTask.js` / `mediaTasks/mediaClipExportTask.js` 均从 deps 解构 `runFfmpegTask`，并在真正调进程前做一次选择：
   ```js
   runFfmpeg =
     typeof runFfmpegTask === 'function'
       ? runFfmpegTask
       : (task, queue, args, options) => queue.runProcess(task, getRuntimeToolOrFallback('ffmpeg'), args, options);
   ```
   本仓这两个文件在第53批之前是**第46–50批按 0.4.12 语义写的版本**，直接 `await queue.runProcess(task, getRuntimeToolOrFallback('ffmpeg'), args, options)`，没有选择分支。
2. **注册侧只注入了一半**——`electron/mediaTasks/registerSharedMediaTaskHandlers.js` 第52批已给 `audioVoiceCompose` 与 `videoToGif` 加了 `runFfmpegTask: _0x554062.runFfmpegTask`，但 `mediaClipExport`（第 53–61 行）与 `videoReverse`（第 77–85 行）两个调用对象里没有该键。即便句柄声明了形参，注册侧不传也仍是 `undefined`。
3. **两个文件此前完全没有测试**——全仓 `videoReverseTask.test.js` / `mediaClipExportTask.test.js` 均 0 命中（`videoToGifTask`、`audioVoiceComposeTask` 等同类句柄都有），这两个句柄的参数构造与结果回写没有离线保护网。

---

## 2 · 本批交付

| 文件 | 行 | 字节 | 变更 |
| --- | --- | --- | --- |
| `electron/mediaTasks/videoReverseTask.js` | 68 | 2 601 | deps 增 `runFfmpegTask`；尾部替换为 `runFfmpeg` 选择分支 + `await runFfmpeg(...)` |
| `electron/mediaTasks/mediaClipExportTask.js` | 515 | 19 166 | 同上（`runFfmpeg` 定义在 `_0x473683` 时长计算之后） |
| `electron/mediaTasks/registerSharedMediaTaskHandlers.js` | 157 | 7 070 | `mediaClipExport` / `videoReverse` 两个调用对象各增一行 `runFfmpegTask: _0x554062.runFfmpegTask,` |
| `electron/mediaTasks/videoReverseTask.test.js` | 215 | 7 615 | 新增，10 个用例 |
| `electron/mediaTasks/mediaClipExportTask.test.js` | 350 | 11 673 | 新增，14 个用例 |

**有效差异与 0.7.16 逐字对齐**（`diff` 端口源 `…/tmp/shuo-electron-deobf/mediaTasks/*.js` 后，除 `_0x` 变量名与 `![]`→`false`、`0x0`→`0` 的既有可读化改写外，仅剩本批的这三处）：

- `videoReverseTask.js`：deps 第 6 键 `runFfmpegTask`（在 `getRuntimeToolOrFallback` 之后、`resolveMediaTaskSource` 之前，与端口源第 26 行同位）；`_0x24fb73`/`runFfmpeg` 选择分支；`await runFfmpeg(_0x50ded9, _0x507084, _0x9f09d5, {durationSec: …||0, progressMessage:'Reversing video'})`。
- `mediaClipExportTask.js`：deps 第 6 键同位（端口源第 464 行）；`_0x582306`/`runFfmpeg` 选择分支在 `_0x1b56d7`（时长）之后（端口源第 534–538 行）；`progressMessage:'Exporting clip'`。
- 注册侧：端口源 `registerSharedMediaTaskHandlers.js` 的 `runFfmpegTask` 出现在**恰好 4 处**（第 45/114/127/139 行 = `audioVoiceCompose`/`mediaClipExport`/`videoReverse`/`videoToGif`），本仓现在同样是这 4 处。

**关键契约（全部可离线验证）**：

- `buildVideoReverseFfmpegArgs({sourceAbs, outAbs, hasAudio})`：缺 `sourceAbs` 或 `outAbs` → `Error('Invalid video reverse source')`；无音轨 → `-an` 且**不含** `-c:a`；有音轨 → `[0:a]areverse,asetpts=PTS-STARTPTS[a]` + `-map [a]` + `-c:a aac`。其余固定为 `-filter_complex '[0:v]reverse,setpts=PTS-STARTPTS,format=yuv420p[v]'`、`-c:v libx264 -pix_fmt yuv420p -profile:v high -preset fast -movflags +faststart`。
- `createVideoReverseMediaTaskHandler`：先 `ffprobeVideoMeta`，`width`/`height` 任一为假 → `Error('Source video has no video stream')`（**在任何进程之前**，且不建 `ReverseVideo` 目录）；`ffprobeHasAudio` 决定音轨分支；产物落 `<outputDir>/ReverseVideo/<prefix>-<ext>`；结果含 `videoDuration/fps/videoWidth/videoHeight`（`duration`/`fps` 缺失回落 `0`）。
- `buildMediaClipExportFfmpegArgs` 单源路径：`-ss/-t` 取 `videoStart|videoEnd`（缺失回落 `videoEnd` 前的 `end`）；无音轨 → `-map 0:v:0 -map 0:a?`；有 `audioAbs` → 追加第二个输入 + `[1:a]aformat=…,apad[a]` + `-map [a] -t <duration>`；`fps` 只在 `[16,24,30]` 内才落 `-r`，其余**静默丢弃**；`-r` 排在 `-movflags +faststart` **之前**。
- 多片段路径（`clips` 非空数组）：每个 video 片段 `trim=start=:end=` → `scale=…:force_original_aspect_ratio=decrease,pad=…:black,setsar=1,fps=<fps>` → `format=yuv420p` → `concat=n=N:v=1:a=0[v]`；`outputWidth`/`outputHeight` 任一为 0 → `Error('Invalid video output size')`；`clips` 无效 → `Error('Invalid video clip range')`；`audioAbs` 范围倒置 → `Error('Invalid audio clip range')`。
- `createMediaClipExportTaskHandler`：`audioSrc` 与 `audioClips` **互斥**（有 audioClips 时 `audioSrc` 被忽略）；显式 `audioSrc` 无合法范围 → `Error('Invalid audio clip range')`（在任何进程之前）；单源无合法视频范围 → `Error('Invalid video clip range')`；多片段时对每个非 image 片段探音轨（`ffprobeHasAudio`）；探测源优先取**第一个 video 片段的 abs**，其次首个片段的 abs，最后才是单源 abs；结果 `videoDuration` = 片段时长之和（多片段）或范围时长（单源），`fps` = 显式合法值 `||` 探测值 `||` 0。

---

## 3 · 接线现状与可达性

`registerSharedMediaTaskHandlers.js`（本批唯一接线点，第 53–61 / 77–85 行）：

```js
_0x1548b1.setHandler(
  'mediaClipExport',
  createMediaClipExportTaskHandler({
    createOutputFilename: _0x554062.createOutputFilename,
    ffprobeHasAudio: _0x554062.ffprobeHasAudio,
    ffprobeVideoMeta: _0x554062.ffprobeVideoMeta,
    getOutputDir: _0x554062.getOutputDir,
    getRuntimeToolOrFallback: _0x554062.getRuntimeToolOrFallback,
    runFfmpegTask: _0x554062.runFfmpegTask,   // ← 本批
    resolveMediaTaskSource: _0x554062.resolveMediaTaskSource,
    toOutputLocalPath: _0x554062.toOutputLocalPath,
  }),
),
```

`_0x554062` 即 `main.js` 的 `registerSharedMediaTaskHandlers` 注入对象，其中的 `runFfmpegTask: runFfmpegVideoTask` 是第52批接上的（`configureFfmpegVideoEncoderRuntime` 已在 `getMediaTaskQueue()` 内先于两个注册器调用）。**至此 6 个消费点全部拿到生产侧**：

| # | 消费点 | 批次 |
| --- | --- | --- |
| 1 | `registerLocalMediaTaskHandlers.runVideoTranscode`（本地 7 句柄） | 46–50（分支）/ 52（生产侧） |
| 2 | `audioVoiceComposeTask` | 50（分支）/ 52（生产侧 + 注册） |
| 3 | `videoToGifTask` | 50（分支）/ 52（生产侧 + 注册） |
| 4 | `main.js` 播放代理转码（`ensureAssetVideoPlaybackProxy`） | 52 |
| 5 | `mediaClipExportTask` | 53 |
| 6 | `videoReverseTask` | 53 |

**回退语义不变**：`runFfmpegTask` 缺省（`undefined` / 非函数）时选择分支落在 `(task, queue, args, options) => queue.runProcess(task, getRuntimeToolOrFallback('ffmpeg'), args, options)`，与升级前的直接调用**逐参数一致**——因此本批对未注入的场景是**零行为变更**，测试用「注入时 `queue.runProcess` 抛错也不被调用」「未注入时 `cmd === '/runtime/ffmpeg'`」两侧锁住。

---

## 4 · 已执行的验证（离线）

| 命令 | 结果 |
| --- | --- |
| `node --check` × 5（2 个句柄、注册器、2 个新测试） | 5/5 exit 0 |
| `node --test electron/mediaTasks/videoReverseTask.test.js` | **10/10 通过** |
| `node --test electron/mediaTasks/mediaClipExportTask.test.js` | **14/14 通过** |
| `node --test $(find electron -name '*.test.js')` | **794/793/1**（第52批 770/769/1，**+24**） |
| `node --test $(find api -name '*.test.js')` | **446/446/0**（本批未触碰 `api/` 面） |
| `git diff --cached/--name-only` 快照 | `0/56/321/0`（第52批 `0/55/317/0`） |

- 唯一失败仍是既有 `electron/fullProjectPackageService.test.js` 的用例 `missing manifest coverage cannot bind to an existing unrelated local file`（R14 第17批遗留），与第43–52批一致，未新增、未变化。
- 快照 `+1 modified` = 本批改动的 `registerSharedMediaTaskHandlers.js`（`videoReverseTask.js` / `mediaClipExportTask.js` 属于**未跟踪**的移植新增文件，计入 untracked）；`+3 untracked` = 本批 2 个测试文件 + **1 项未归因**，与第52批已记录的同类口径一致（第52批也是 `+4` 可归因、余 1 项最可能是上一批文档落盘晚于其快照取值的时间差），本批未据此改动任何计数叙事。已核查：最新的未跟踪文件只有本批 2 个测试与既有 `docs/*.md`，**无测试运行产物泄漏进仓库**。
- 首跑 `mediaClipExportTask.test.js` 14 项中 1 项失败 —— **测试写错，实现未改**：我把 `-r` 断言写成 `args.slice(-3)`，实际 `-r` 落在 `-movflags +faststart <out>` **之前**，尾 3 项是 `-movflags/+faststart/out`。已改为按 `indexOf('-r')` 取两项并追加「`-r` 必须早于 `-movflags`」的顺序断言。

---

## 5 · 验收欠项（仍未执行，须授权）

- **真实硬件编码生效**：本批只证明「注入 `runFfmpegTask` 时句柄会调用它」；`runFfmpegTask` → 真实 `ffmpeg -encoders` 探测 → nvenc/amf/qsv/videotoolbox 试编 → 失败回退 libx264 的**端到端**行为仍未在真机跑过（第52批同样欠）。
- **真实反转/剪辑产物**：`reverse` 滤镜 + `areverse` 的 A/V 同步、多片段 `concat` 的接缝、`adelay` 对齐、`pad=…:black` 的黑边、`+faststart` 后的可播性，均未产出实文件。
- **UI 可达性**：本批不新增调用点。`videoReverse` / `mediaClipExport` 的渲染器入口沿用既有 IPC 链，未在真实应用里点过。
- 大片段列表（数十个 clips）的 `filter_complex` 长度与 `-t` 精度未实测。

---

## 6 · 剩余工作

| 项 | 规模 | 状态 |
| --- | --- | --- |
| `videoReverseTask` / `mediaClipExportTask` 的 `runFfmpegTask` 声明与注入（6 个消费点收尾） | 2 文件 + 1 接线 | ✅ **本批** |
| `ffmpegVideoEncoderRuntime.js` + `toolCapture.js` | 11 862 B | ✅ 第52批 |
| 资产能力操作层（`assetCapabilityOperations` + 5 依赖 + `imageDerivativeWorker`） | 41 967 B | ✅ 第51批 |
| 本地句柄层（8 kind）+ 播放代理共享模块 + 队列 `timeoutMs` | 20 146 B | ✅ 第50批 |
| `runProcess` 启动重试（`spawnMaxAttempts`/`spawnRetryDelayMs`）、`_pump` 优先级、`spawnImpl` 注入 | — | ❌ 未移植（R02） |
| 渲染器 `audioVoicePanel.js`(142 KB) / `audioVoiceAsrProviders.js` / `audioVoiceLocalAsrRuntime.js` 及 `videoToGif`/`audioVoiceCompose`/`audioVoiceAnalyze`/4 funasr/8 local kind 的调用点 | — | ❌ 未移植（R16） |
| `text-preset` 浮动采集面板、`contextMenuShortcutCatalog.js`、`completionNotificationService.js`、`desktopBridge.js`、新时间线链（`timelinePlan`/`jianyingDraft`/`toolCapture`）、`chromeShell*` 簇、`globalCaptureWindow*` | — | ❌ 未移植 |
| `runtime/ffmpeg/` + `runtime/python/` 打包、`/api/v2/video-gif`、`backend/services/*.py` 随包核实 | — | ❌ 未做 |
| R01 验收（全量新增用例 + 全量回归 + 其余 6 个 Python 测试文件） | — | ❌ 须列命令/依赖/费用并授权 |

---

## 7 · 约束复核

- 未触碰 `api/freeImageHostApi.js`（本批未改动该文件，`api` 面 446/446/0）。
- 未新增 npm 依赖（两个句柄本就只 `import node:fs` / `node:path`；测试只用 `node:test` / `node:assert/strict` / `node:fs` / `node:os` / `node:path`）。
- 未改授权检查、未改安装目录、未改 `style.css`；`registerSharedMediaTaskHandlers` 其余 11 个句柄的注入对象**一字未动**。
- 句柄文件保留本仓既有的 `_0x` 形参/局部名（第46–50批的移植风格），仅新增的 `runFfmpegTask` / `runFfmpeg` 使用语义名——与第52批 `videoToGifTask` 的落法一致，属**最小差异**选择。
- 未做 `git reset --hard` / `git clean` / 批量 checkout / 目录覆盖；未清理任何未跟踪文件；未联网、未启动应用、未执行真实 ffmpeg、未提交/推送。
