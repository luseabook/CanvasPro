# 第52批 · FFmpeg 编码器运行时（`toolCapture` + `ffmpegVideoEncoderRuntime`）

> 本批补上第46–50批一直缺失的 `runFfmpegTask` 注入侧：0.7.16 构建里把「硬件 H.264 编码器探测 / 升级 / 回退」独立成运行时模块，本仓此前没有该模块，因此 `videoToGif` / `audioVoiceCompose` / 本地 7 句柄 / 播放代理转码这四条链虽然早已写好「若注入 `runFfmpegTask` 就用它」的分支，却始终拿不到该依赖，全部退化为 `queue.runProcess(…, libx264, …)`。
> 交付物：2 个新模块（11 862 B 源码，零 import 除 `node:child_process`）+ 2 个离线测试文件（36 个用例）+ `main.js` 去内联化接线。
> 全部验证为**离线**：`node --check` + `node --test`。未联网、未启动应用、未执行真实 ffmpeg、未探测真实显卡编码器、未提交。

---

## 1 · 缺口（第52批之前）

1. **`ffmpegVideoEncoderRuntime.js` 缺失**——0.7.16 的 `mediaTaskRuntime.js` 从该模块 `import { configureFfmpegVideoEncoderRuntime, runFfmpegVideoTask }`，并把它作为默认值注入两个句柄注册对象（`mediaTaskRuntime.js:110/434/457`）+ 在播放代理转码处直接调用（`mediaTaskRuntime.js:297`）。本仓无此模块，`main.js` 也就无从 `configure`。
2. **`toolCapture.js` 缺失**——编码器运行时的探测依赖「跑一次 `ffmpeg -encoders` 并抓取输出」，0.7.16 用的是独立模块 `toolCapture.js` 的 `runToolCapture`（带 `timeoutMs`、`input`、`windowsHide`）。本仓 `main.js` 只有一份**更老一代**的内联 `runToolCapture`（硬编码 `cwd: APP_ROOT`、无超时、监听 `exit` 而非 `close`、无 stdin 错误容忍），既不能被共享，也与新版语义（默认 `cwd: process.cwd()`、可超时）不一致。
3. **四个消费点全部空转**——第46–50批已把「优先使用 `deps.runFfmpegTask`」的分支写进 4 处（`registerLocalMediaTaskHandlers.runVideoTranscode`、`audioVoiceComposeTask`、`videoToGifTask`，以及本批新接的 `main.js` 播放代理转码），但生产者一个都不存在（全仓 `runFfmpegTask` 0 命中），硬件编码从未生效。

---

## 2 · 本批交付

2 个新模块（无新增 npm 依赖；`ffmpegVideoEncoderRuntime.js` 零 import，`toolCapture.js` 仅用 `node:child_process`）：

| 模块 | 行 | 字节 | 导出 |
| --- | --- | --- | --- |
| `electron/toolCapture.js` | 70 | 2 275 | `runToolCapture` |
| `electron/ffmpegVideoEncoderRuntime.js` | 304 | 9 587 | `buildHardwareH264EncoderArgs`、`usesSoftwareH264Encoder`、`applyHardwareH264EncoderProfile`、`probeFfmpegH264Encoder`、`createFfmpegVideoEncoderRuntime`、`configureFfmpegVideoEncoderRuntime`、`runFfmpegVideoTask`、`SOFTWARE_H264_ENCODER_PROFILE` |

**关键契约（全部可离线验证）**：

- `runToolCapture(command, args, {cwd = process.cwd(), input = null, timeoutMs = 0, windowsHide = true})`：Promise 解析为 **stdout 的 `Buffer`**（多 chunk 按序 `Buffer.concat`）；`code === 0` 才 resolve，否则以 **trim 后的 stderr 文本** reject，stderr 为空时退回 `'<command> exited with <code>'`（有 `signal` 时追加 `' (<signal>)'`）；`timeoutMs` 经 `Math.max(0, Math.trunc(Number(x) || 0))` 归一，> 0 时起 `setTimeout` → 先 `child.kill()` 再以 `ToolCaptureTimeoutError`（`code:'TOOL_CAPTURE_TIMEOUT'`、`timeoutMs`、`message:'<command> timed out after <n>ms'`）reject，`timer.unref?.()`；`input !== null && input !== undefined` 时 stdio 首位改 `'pipe'` 并 `stdin.end(input)`，stdin 的 `error` 只在 **code 非 `EPIPE`** 时生效；`settled` 守卫保证只结算一次。
- 硬件档位表：`PLATFORM_H264_ENCODER_PROFILES` 为 `win32 → [nvidia-nvenc/h264_nvenc, amd-amf/h264_amf, intel-qsv/h264_qsv]`、`darwin → [apple-videotoolbox/h264_videotoolbox]`，全部 `Object.freeze`；`SOFTWARE_H264_ENCODER_PROFILE = {id:'software', codec:'libx264', hardware:false}`。
- `buildHardwareH264EncoderArgs(profile, {softwarePreset = 'fast', crf = 23})`：nvenc → `yuv420p/high/-preset(p3|p5|p6|p4)/-tune hq/-rc vbr/-cq <crf>/-b:v 0`；amf → `yuv420p/high/-quality(speed|balanced)/-rc cqp/-qp_i|-qp_p|-qp_b`；qsv → `nv12/high/-preset/-global_quality`；videotoolbox → `yuv420p/high/-q:v/-prio_speed`；未知 codec → `['-c:v','libx264']`。`crf` 统一过 `normalizeCrf`（0–51，非法回落 23）；videotoolbox 的 `-q:v = clamp(100 − crf×1.5, 1, 100, 65)`。
- `applyHardwareH264EncoderProfile(args, profile)`：非硬件档或 args 不含 `['-c:v','libx264']` 时返回**浅拷贝、原样不改**；命中时替换该 `-c:v` 对并**丢弃 `-crf`/`-pix_fmt`/`-preset`/`-profile:v` 及其值**，其余 token 顺序保留；`-preset`/`-crf` 缺失时分别回落 `'fast'`/`'23'`。
- `probeFfmpegH264Encoder({ffmpegPath, platform = process.platform, runCapture, cwd = process.cwd(), timeoutMs = 15 000})`：缺 `ffmpegPath` 或 `runCapture` 非函数 → 直接软件档；`-hide_banner -encoders` 抓取失败 → 软件档；随后按平台档位表逐个「精确名匹配（`(?:^|\s)<codec>(?:\s|$)`，转义后建 RegExp）+ 真实试编（lavfi 黑帧 256×256 r=1 → `-frames:v 1` → 硬件参数 → `-f null -`）」，命中即返回该档；全失败或平台不在表内（如 `linux`）→ 软件档。
- `createFfmpegVideoEncoderRuntime({ffmpegPath, platform, runCapture, cwd, logger = console})`：`getProfile()` 惰性探测并**缓存**（`pendingProbe` 去重，并发只探一次）、成功后 `logger.info('[ffmpeg] H.264 encoder selected: <id> (<codec>)')`；`getCachedProfile()`、`warmup()`。`runTask(task, queue, args, options)`：无 `queue.runProcess` → `Error('Missing media task process runner')`；args 不含软件编码器 → 原样透传；探测结果非硬件 → 原样透传；否则替换为硬件参数执行，**失败时（非取消/非超时）**记住软件档、`logger.warn('[ffmpeg] <codec> failed; falling back to libx264 for this session.')`、`emitProgress(task, task?.progress || 0, 'Hardware encoder unavailable; retrying with CPU')`、`throwIfCancelled?.(task)`，再以**原始 args** 重跑一次（本会话后续一律走软件档）。
- `shouldSkipSoftwareFallback`（内部）：`name` 为 `MediaTaskCancelledError` / `MediaTaskProcessTimeoutError` 或 `code === 'MEDIA_TASK_PROCESS_TIMEOUT'` 时**直接抛出、不回退**。
- `configureFfmpegVideoEncoderRuntime(options)` 设模块级单例并 `void warmup()`；`runFfmpegVideoTask(task, queue, args, options)` 在未配置时抛 `Error('FFmpeg video encoder runtime is not configured')`。

---

## 3 · 接线现状与可达性

`main.js`：

- 新增 `import { configureFfmpegVideoEncoderRuntime, runFfmpegVideoTask } from './ffmpegVideoEncoderRuntime.js';` 与 `import { runToolCapture } from './toolCapture.js';`。
- 删除**内联** `function runToolCapture(_0x5a780a, _0x50fe43, {input} = {})`（24 行，老一代：硬编码 `cwd: APP_ROOT`、无超时、依赖 `exit` 事件），改由模块承担；其 3 个内部调用点补上 `{ cwd: APP_ROOT }` 以保留既有 cwd 语义：

```js
async function readFfprobeJsonCapture(args, message = 'FFprobe failed') {
  const captured = await runToolCapture(getRuntimeToolOrFallback('ffprobe'), args, { cwd: APP_ROOT });
  …
}
```

- 在 `getMediaTaskQueue()` 内、两个句柄注册之前配置运行时（与 0.7.16 的 `mediaTaskRuntime` 同位置）:

```js
(mediaTaskQueue = new MediaTaskQueue({ concurrency: 2, … })),
  configureFfmpegVideoEncoderRuntime({
    ffmpegPath: getRuntimeToolOrFallback('ffmpeg'),
    platform: process.platform,
    runCapture: runToolCapture,
    cwd: APP_ROOT,
  }),
  registerLocalMediaTaskHandlers(mediaTaskQueue, { …, runFfmpegTask: runFfmpegVideoTask, … }),
  registerSharedMediaTaskHandlers(mediaTaskQueue, { …, runFfmpegTask: runFfmpegVideoTask, … }),
```

- 播放代理转码由 `queue.runProcess(task, ffmpeg, buildVideoPlaybackProxyFfmpegArgs(…), {durationSec, progressMessage, timeoutMs})` 改为 `runFfmpegVideoTask(task, queue, buildVideoPlaybackProxyFfmpegArgs(…), {同左})`——与 0.7.16 `mediaTaskRuntime.js:297` 逐参数对齐（`task, queue` 顺序一致）。

**四个消费点与可达性**（`runFfmpegTask` 现在真正拿到函数）：

| 消费点 | 触发路径 | 状态 |
| --- | --- | --- |
| `registerLocalMediaTaskHandlers.runVideoTranscode` | `videoPoster`/`audioWaveform`/`videoFirstFrame`/`videoCut`/`audioCut`/`videoAudioSeparate`/`videoCompose`/`videoAudioMux` 8 个本地 kind | ✅ 本批注入（`main.js:1431`） |
| `audioVoiceComposeTask` | `audioVoiceCompose` kind | ✅ 本批注入（`registerSharedMediaTaskHandlers.js:47`） |
| `videoToGifTask` | `videoToGif` kind | ✅ 本批注入（`registerSharedMediaTaskHandlers.js:95`） |
| `main.js` 播放代理转码 | `ensureAssetVideoPlaybackProxy` ← `createVideoPosterHandler`（资产视频导入链） | ✅ 本批改调用点（`main.js:1257`） |

**未注入的两个共享句柄（有意留待第53批）**：`mediaClipExportTask.js`（本仓 510 行 vs 新版 555 行）与 `videoReverseTask.js`（62 vs 68 行）属**更老一代**，其 `deps` 里根本没有 `runFfmpegTask` 键（`grep` 0 命中），注入也无消费者；0.7.16 是把 `runFfmpegTask` 注进**扁平共享 deps 对象**从而顺带覆盖这两个句柄。按「先升级句柄、再注入」的顺序，本批不注入以免出现「注入了但被忽略」的假接线。

---

## 4 · 已执行的验证（离线）

| 命令 | 结果 |
| --- | --- |
| `node --check` × 5（`toolCapture.js`、`ffmpegVideoEncoderRuntime.js`、`main.js`、`registerSharedMediaTaskHandlers.js`、2 个新测试文件） | 6/6 exit 0 |
| `node --test electron/toolCapture.test.js` | **11/11 通过** |
| `node --test electron/ffmpegVideoEncoderRuntime.test.js` | **25/25 通过** |
| `node --test $(find electron -name '*.test.js')` | **770/769/1** |
| `node --test $(find api -name '*.test.js')` | **446/446/0** |
| `git diff --cached/--name-only` 快照 | `0/55/317/0`（第51批为 `0/55/312/0`） |

- 唯一失败仍是既有 `electron/fullProjectPackageService.test.js` 的用例 `missing manifest coverage cannot bind to an existing unrelated local file`（R14 第17批遗留），与第43–51批一致，未新增、未变化。
- 相对第51批 734/733/1：本批 **+36**（11 + 25），全量 **770/769/1**；`api` 面 446/446/0 证明本批未触碰 `api/` 面。
- 未跟踪文件 312 → 317（+5）。本批新增 4 个文件可逐一列名（2 模块 + 2 测试）；余 **+1 未能归因**——最可能是第51批的 `docs/asset-capability-operations.md` 落盘晚于其快照取值，属记账口径差，未做删除/归档，故无文件缺失风险。
- `toolCapture.test.js` 的 11 个用例中，10 个是真实 `spawn(process.execPath, …)` 跑本地 `node` 子进程（不联网、不调外部工具）；仅 `ENOENT` 用例故意用不存在的命令名。

**首跑修正 3 处测试期望（均为测试写错，实现未改）**：

1. `slice(0,9)` 断言探针前缀时漏了 `-frames:v` 的值 `'1'`（应为 `slice(0,10)`）；`slice(-2)` 断言探针尾部时实际是 `['null','-']`（应为 `slice(-3) === ['-f','null','-']`）。
2. `probeFfmpegH264Encoder` 的 darwin 用例我复用了 win32 编码器列表（其中没有 `h264_videotoolbox`），因此实际落软件档；已改为 darwin 专用列表，并**补一条**「darwin + win32 列表 → 软件档」的反向断言。
3. `probeFfmpegH264Encoder` 的 win32 试探顺序用例（nvenc 试探抛错 → 回落 amf）首跑通过；`videotoolbox` 的 `-q:v` 上界我误写成 `crf 999 → '1'`，实际 `crf` 先被 `normalizeCrf` 夹到 51，故最小值是 24（已改为断言 `crf 0 → 100`、`crf 999 → 24`）。

**首跑暴露 1 处**真实平台行为**（忠于新版，未修正）**：

- `toolCapture.js` 只容忍 stdin 写入错误的 `code === 'EPIPE'`。在本机 win32 上，向**已关闭的管道**写入由 libuv 报成 `EOF`（`errno -4095`），因此「子进程先退出、输入未读完」时 `runToolCapture({input})` 会 **reject** 而不是静默成功。已实测 6/6 稳定复现为 `REJECTED code=EOF`。0.7.16 的同一份守卫也是只认 `EPIPE`，故本批**保持逐字节忠实**、不擅自放宽；该路径在本仓**目前不可达**（无任何调用点传 `input`，本批 4 个调用点只传 `cwd`）。已用测试固定该行为（断言 code ∈ `{EPIPE, EOF}`）。

---

## 5 · 验收欠项（仍未执行，须授权）

- **真实 `ffmpeg -encoders` 探测**：本机（RTX 显卡 / NVENC 驱动）上 `-encoders` 列表与真实试编结果、`probeFfmpegH264Encoder` 选到的档位，均未实测；本批只用脚本化 `runCapture` 覆盖了判定逻辑。
- **真实硬件编码与回退**：nvenc/amf/qsv/videotoolbox 的**参数是否被真实 ffmpeg 接受**（如 `-rc vbr -cq`、`-quality speed -rc cqp`、`-global_quality`、`-prio_speed`）以及首帧失败后「本会话永久回落 libx264」的真实表现，未验证。
- **打包运行时**：随包 `runtime/ffmpeg/` 是否含 nvenc/amf/qsv 编译支持未核实（`getRuntimeToolOrFallback('ffmpeg')` 指向的二进制未随本批打包）。
- **`configureFfmpegVideoEncoderRuntime` 的启动开销**：`void warmup()` 会在创建媒体任务队列时异步跑两次 ffmpeg（`-encoders` + 试编），真实启动耗时未测。
- 播放代理转码改走 `runFfmpegVideoTask` 后，真实 hevc 视频导入的端到端代理产物未跑过（R16 既定欠项）。

---

## 6 · 剩余工作

| 项 | 规模 | 状态 |
| --- | --- | --- |
| `toolCapture` + `ffmpegVideoEncoderRuntime` + 4 消费点接线 | 11 862 B | ✅ **本批** |
| 资产能力操作层（`assetCapabilityOperations` + 5 依赖 + `imageDerivativeWorker`） | 41 967 B | ✅ 第51批 |
| `mediaClipExportTask.js`（510→555 行）/ `videoReverseTask.js`（62→68 行）升级到新版代际后再注入 `runFfmpegTask` | ~51 行差 | ❌ 第53批 |
| `runProcess` 启动重试（`spawnMaxAttempts`/`spawnRetryDelayMs`）、`_pump` 优先级、`spawnImpl` 注入 | — | ❌ 未移植（R02） |
| 渲染器 `audioVoicePanel.js`(142 KB) / `audioVoiceAsrProviders.js` / `audioVoiceLocalAsrRuntime.js` 及 `videoToGif`/`audioVoiceCompose`/`audioVoiceAnalyze`/4 funasr/8 local kind 的调用点 | — | ❌ 未移植（R16） |
| `text-preset` 浮动采集面板、`contextMenuShortcutCatalog.js`、`completionNotificationService.js`、`desktopBridge.js`、新时间线链（`timelinePlan`/`jianyingDraft`）、`chromeShell*` 簇、`globalCaptureWindow*` | — | ❌ 未移植 |
| `runtime/ffmpeg/` + `runtime/python/` 打包、`/api/v2/video-gif`、`backend/services/*.py` 随包核实 | — | ❌ 未做 |
| R01 验收（全部新增用例 + 全量回归 + 其余 6 个 Python 测试文件） | — | ❌ 须列命令/依赖/费用并授权 |

---

## 7 · 约束复核

- 未触碰 `api/freeImageHostApi.js`（本批未改动该文件，`api` 面 446/446/0）。
- 未新增 npm 依赖（`ffmpegVideoEncoderRuntime.js` 零 import；`toolCapture.js` 仅 `node:child_process`）。
- 未改授权检查、未改安装目录、未改 `style.css`；未改任何既有方法签名（`readFfprobeJsonCapture` 的签名与默认值未变，仅内部调用改为传 `cwd`）。
- `spawn` import 因 `main.js` 另有 1 处使用者（启动 `server.py`，`main.js:1689`）而保留；删除内联 `runToolCapture` 前已确认其 3 处调用点全部改由模块承担，无遗留引用。
- 未联网、未启动应用、未执行真实 ffmpeg、未探测真实编码器、未提交/推送。
