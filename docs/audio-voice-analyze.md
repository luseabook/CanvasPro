# 第49批 · R16 语音工作室分析宿主任务链（`audioVoiceAnalyze` 及其四个模型/运行时句柄）

> 批次范围：R16（ASR / 转写 / 说话人分离 / 音频合成 / 视频转 GIF）中的「语音工作室分析」宿主任务链，连同它依赖的四个模型/运行时句柄。
> 本批**不覆盖**渲染器 `audioVoicePanel.js`(142 KB) / `audioVoiceAsrProviders.js` / `audioVoiceLocalAsrRuntime.js`，也不含 `runtime/ffmpeg/` 打包与 Node 侧结果回写白名单。
> 所有证据均为**离线**：`node --check` 与 `node --test`，未联网、未启动应用、未调用任何真实 ASR/模型服务。

---

## 1 · 缺口（第49批之前）

新版 `mediaTasks/audioVoiceAnalyzeTask.js`（55206 B）是本仓**最大的一块缺失宿主源码**。它是本地 funasr / sortformer 转写与说话人分离的唯一入口：以 `python -m backend.services.funasr_transcription_service` / `...sortformer_diarization_service` 启动 Python 服务，并消费 `getFunasrModelRootDir` / `getSortformerModelRootDir` / `getPythonCertificateEnv` / `resolvePythonCommand` / `getDoubaoAsrConfig` / `getBailianAsrConfig`。

| 检查 | 第49批之前 |
| --- | --- |
| `grep -rn "audioVoiceAnalyze"` 全仓 | **0 命中**（`api/localMediaTaskApi.js` 的 `SOURCE_REQUIRED_KINDS` 也不含该 kind） |
| `mediaTaskQueue.enqueue({ kind:'audioVoiceAnalyze' })` | 抛 `Unsupported media task kind: audioVoiceAnalyze` |
| `mediaTasks/registerSharedMediaTaskHandlers.js` | 只注册 9 个句柄，无 `audioVoiceAnalyze` / `audioVoiceModelPrepare` / `funasrModelPrepare` / `funasrRuntimeCheck` / `funasrGpuTorchInstall` |
| `main.js` 的 `getFunasrModelRootDir` 消费点 | **不存在** ⇒ 第43批的 `funasrModelRoot.js` / `sortformerModelRoot.js` 长期"生产零引用" |
| `electron/runtimeAssetResolver.js` | **不存在**（`getPythonCertificateEnv` 的提供者） |
| `electron/fileSaveSettingsReader.js` | **不存在**（新版 `readConfiguredUserSettingsSync()` 的读取器，需识别 `fileSavePathsMeta`） |
| `electron/applicationResourceRoot.js` | **不存在**（新版该模块的 `DEFAULT_APP_ROOT` 解析器） |

**前置阻塞（第47批遗留，本批已解）**：该文件第 7 行 `import { createProcessStartError } from '../mediaTaskQueue.js'`，而本仓 `electron/mediaTaskQueue.js` **不导出**该符号。本批按新版 `mediaTaskQueue.js` 忠实补上该工厂与其 `getCommandLabel` 助手，未静默丢弃导入。

---

## 2 · 本批交付

### 2.1 文件

| 文件 | 性质 | 说明 |
| --- | --- | --- |
| `electron/mediaTasks/audioVoiceAnalyzeTask.js` | 新增（可读移植，1427 行） | 仅 `node:child_process` / `node:fs` / `node:path` / `node:url` + 4 个同目录模块；26 个导出 + 若干私有助手 |
| `electron/mediaTaskQueue.js` | 修改 | 增 `import path`、`getCommandLabel`、`export function createProcessStartError`（解第47批阻塞） |
| `electron/applicationResourceRoot.js` | 新增 | 7 行：`app.asar` → 同级 `webapp`，否则原样返回 |
| `electron/fileSaveSettingsReader.js` | 新增 | 19 行：`readUserSettingsFromFilesSync(candidatePaths)`，接受带 `fileSavePaths` **或** `fileSavePathsMeta` 的首个设置对象 |
| `electron/runtimeAssetResolver.js` | 新增 | 139 行：运行时根/工具/CA 证书/环境变量解析，仅 `node:path` |
| `electron/mediaTasks/registerSharedMediaTaskHandlers.js` | 修改 | 新增 import 与 5 个 `setHandler`（`audioVoiceAnalyze` / `audioVoiceModelPrepare` / `funasrModelPrepare` / `funasrRuntimeCheck` / `funasrGpuTorchInstall`）——句柄总数 9 → 14 |
| `electron/main.js` | 修改 | 新增 4 个 import + `readdirSync`；`readConfiguredUserSettingsSync()`/`getFunasrModelRootDir()`；注册对象增 3 键（`getFunasrModelRootDir`/`getPythonCertificateEnv`/`resolvePythonCommand`） |
| `api/localMediaTaskApi.js` | 修改 | `SOURCE_REQUIRED_KINDS` 增 `audioVoiceAnalyze`/`videoAudioMux`；补 `normalizePayloadAudioVoiceClipSources` 与 `videoAudioMux`/`audioVoiceCompose` 校验分支；`videoCompose` 的 `includeAudio === false` 只要求 1 路源 |
| `electron/mediaTasks/audioVoiceAnalyzeTask.test.js` | 新增 | 28 项离线用例 |
| `electron/runtimeAssetResolver.test.js` | 新增 | 6 项离线用例 |
| `electron/fileSaveSettingsReader.test.js` | 新增 | 5 项离线用例 |
| `electron/applicationResourceRoot.test.js` | 新增 | 2 项离线用例 |
| `electron/mediaTaskQueue.processStartError.test.js` | 新增 | 4 项离线用例 |

### 2.2 行为要点

**常量表**（原样保留十六进制字面量）：

- `AUDIO_VOICE_ASR_STAGE`：`model-download` / `model-prepare` / `transcribe` / `diarization-model-download` / `diarization-model-prepare` / `diarize` / `slice`。
- `FUNASR_GPU_TORCH_STAGE`：`gpu-torch-check` / `gpu-torch-install` / `gpu-torch-verify`。
- `FUNASR_STAGE_RANGES`：`model-download:[0.08,0.32]`、`model-prepare:[0.32,0.42]`、`transcribe:[0.42,0.52]`、`diarization-model-download:[0.52,0.64]`、`diarization-model-prepare:[0.64,0.7]`、`diarize:[0.7,0.8]`。
- 默认模型 `paraformer-zh` / `fsmn-vad` / `ct-punc-c` / `cam++`；默认 Sortformer 文件 `diar_streaming_sortformer_4spk-v2.1.nemo`（HuggingFace NVIDIA 仓库）。
- 合并默认：`maxGapMs=800`、`maxDurationMs=10000`、`maxTextChars=100`；说话人桥接 `maxBridgeGapMs=120`。
- GPU Torch 默认：`https://download.pytorch.org/whl/cu128` + `torch==2.11.0+cu128` / `torchaudio==2.11.0+cu128`。

**导出面（26 项）**：

- 纯函数：`normalizeFunasrEngine`（只有显式 `gpu` 才返回 `gpu`）、`parseSilenceDetectRanges`（`/silence_(start|end):\s*([0-9]+(?:\.[0-9]+)?)/g`；`end <= start` 不闭合端点；悬挂的 `start` 以 `durationSec` 收尾；结果按 `startSec` 排序）、`buildAudioVoiceSpeechSegments`（对静音区间取补集、去短段（`<0.25s` 与前段合并、`<=0.05s` 丢弃）、按 `paddingMs` 外扩且前段尾夹住后段头）、`buildAudioVoiceSegmentCutArgs`（`-ss <s>` / `-t <s>` 三位小数、`libmp3lame 192k`；零长夹到 `0.001`）。
- 归一化/合并：`normalizeFunasrTranscriptSegments`、`normalizeDiarizationSegments`（后者**必须有说话人**否则丢弃）、`mergeFunasrTranscriptSegments`（**仅当两侧说话人标签相同且非空**才合并；受 `maxGapMs`/`maxDurationMs`/`maxTextChars` 三重约束；`joinTranscriptText` 只在"左尾 ∈ `[A-Za-z0-9,.;:!?)]` 且右首 ∈ `[A-Za-z0-9(]`"时插空格）、`assignDiarizationSpeakersToTranscriptSegments`（按**重叠毫秒总和**取最大说话人，再做说话人变更桥接）、`hasRecognizedTranscriptText`、`mapFunasrProgressToOverall`（阶段窗口线性插值，未知阶段回落 `transcribe`）。
- 参数/环境构造：`buildFunasrTranscriptionArgs`（`-m backend.services.funasr_transcription_service`，`--audio` 插在 `-m` 之后；`--check-runtime-only` 与 `--prepare-only` 互斥，`prepareOnly` 时不带 `--audio`）、`buildSortformerDiarizationArgs`、`buildFunasrEnv`/`buildSortformerEnv`（把 `MODELSCOPE_CACHE`/`HF_HOME`/`HUGGINGFACE_HUB_CACHE`/`TORCH_HOME`/`PIP_CACHE_DIR`/`TMPDIR` 等全部指向 `<modelRoot>/{models,cache,torch,pip-cache,tmp}` 并建目录；Sortformer 额外 `WANDB_DISABLED=true`/`HF_HUB_DISABLE_TELEMETRY=1`）、`buildFunasrGpuTorchInstallArgs`。
- 进程驱动：`runPipInstallProcess` / `runFunasrTranscriptionProcess` / `runSortformerDiarizationProcess` — 均以 `spawn(pythonCommand, args, {cwd: appRoot, env, stdio:['ignore','pipe','pipe'], windowsHide:true})` 起进程，逐行解析 stdout 的 JSON（`{type:'progress'|'result'|'error'}`），定时器**仅**在未取消时递增进度，取消即 `child.kill()` 并 reject `MediaTaskCancelledError`，启动失败包成 `createProcessStartError(...)`。`task.child` 在结束时置回 `null`。
- 5 个句柄工厂：`createAudioVoiceAnalyzeMediaTaskHandler`、`createFunasrModelPrepareMediaTaskHandler`、`createAudioVoiceModelPrepareMediaTaskHandler`、`createFunasrRuntimeCheckMediaTaskHandler`、`createFunasrGpuTorchInstallMediaTaskHandler`。

**分析句柄流程**（`createAudioVoiceAnalyzeMediaTaskHandler`）：

1. `resolveMediaTaskSource(payload.src)` → `normalizeSilenceOptions(args)`（`noiseDb=-35` 四舍五入、`minSilenceSec=0.35`、`paddingMs=80` 非负取整）→ `ffprobeVideoMeta`。
2. **音频守卫**：`ffprobeHasAudio` 为假时，有视频流抛 `Source video has no audio stream`，否则抛 `Source media has no audio stream`；随后 `durationSec <= 0` 抛 `Source media duration is unavailable`。
3. 建 `AudioVoiceAnalyze` / `AudioVoiceSegments` 输出目录。
4. `args.asrProvider`（去空格小写）命中 `doubao`/`bailian` 适配器则走云端：抽 16k 单声道 **64k mp3** → 适配器 `run` → `adapter.normalize` → `mergeFunasrTranscriptSegments`；识别文本为空则置 `fallbackReason='empty'`。
5. 否则若 `asrProvider === 'funasr'`：要求 `getFunasrModelRootDir()` 非空（否则抛 `FunASR model directory is unavailable`），抽 16k 单声道 **pcm_s16le wav** → `runFunasrTranscriptionProcess` → `normalizeFunasrTranscriptSegments` → 去说话人标签；`diarizationProvider` 非 `none`（`none`/`off`/`disabled`/`false` 之外恒为 `sortformer`）且确有转写段时，解析 Sortformer 根（`getSortformerModelRootDir()` 为空则回落 `<funasr 根的父目录>/sortformer`）、起分离进程、按重叠分配说话人，再合并。
6. 仍无转写段 → **静音兜底**：`ffmpeg -af silencedetect=... -f null -` 解析静音区间，取补集为语音段（`sourceText:''`）。
7. 抽 192k 源 mp3 到 `AudioVoiceAnalyze/`；逐段 `buildAudioVoiceSegmentCutArgs` 剪到 `AudioVoiceSegments/segment_<n>.mp3`，进度 `min(0.95, 0.62 + i/len*0.33)`、文案 `Cutting sentence audio`。
8. 返回 `{ success, durationSec, sourceAudio:{localPath,url}, asr:{provider, baseUrl, modelRoot, diarizationProvider, diarizationModelRoot, fallbackReason}, segments[] }`；`provider` 在未走任何 ASR 时为 `'silence'`。每段含 `{ id:'audio-voice-segment-<n>', startMs, endMs, sourceText, (speaker), sourceAudioLocalPath, sourceAudioUrl }`。

**GPU Torch 安装句柄**：先 `nvidia-smi --query-gpu=name --format=csv,noheader`（空名抛 `No NVIDIA GPU was detected`），再 `pip install --upgrade --prefer-binary --no-input --disable-pip-version-check --index-url <url> <packages>`，最后以 `checkRuntimeOnly` 复检，`available === false` 时抛 `GPU acceleration is still unavailable`。

### 2.3 与新版是否有差异

| 项 | 新版 | 本批 | 说明 |
| --- | --- | --- | --- |
| 算法与字符串 | — | 逐行等价（`0x` 字面量原样保留） | 无行为差异 |
| 导出面 | 含 `MediaTaskProcessTimeoutError` | **不移植**该导出 | 本仓 `MediaTaskQueue.runProcess` **不实现 `timeoutMs`**，故该错误类在本仓无任何触发点；移植它只会是死符号 |
| `{stage}` 第四参 | 队列透出 | 本仓 `emitProgress(task, progress, message)` 为 3 参，第 4 参 `{stage}` 被**静默忽略** | 与第44–48批一致；进度百分比与文案仍能到渲染器 |
| `getSortformerModelRootDir` | `registerSharedMediaTaskHandlers` 里有该键，但新版**调用方从不传**（`mediaTaskRuntime.js` 的 `registerSharedHandlers` 无此键） | **同样不传**；句柄内回落 `<funasr 根父目录>/sortformer` | 因此 `main.js` **不新增** `getSortformerModelRootDir`，与新版一致；第43批 `sortformerModelRoot.js` 仍为生产零引用（新版亦然） |
| `getMediaTaskDisplayName` | 新版**没有**这五个 kind 的显示名 | **不加** | 与第46批 `videoToGif` 同处理；第48批 `audioVoiceCompose` 有则加 |
| `runFfmpegTask` | 新版的 `registerSharedMediaTaskHandlers` 里多处传该键 | 本仓 `main.js` 无该键，**不传** | 相关句柄（`audioVoiceCompose`/`mediaClipExport`/`videoReverse`/`videoToGif`）在本仓内建回落即 `queue.runProcess`；本批不涉及 |

---

## 3 · 接线现状与可达性

已接线：

1. **宿主链**：`registerSharedMediaTaskHandlers` 现注册 **14** 个句柄；`mediaTask:enqueue` 对 kind **无白名单**，`window.electronAPI` → IPC → 句柄全链可达。
2. **生产引用解除**：`main.js` 新增 `getFunasrModelRootDir()`（`resolveFunasrModelRootDir(readConfiguredUserSettingsSync(), { fallbackDataDir: getDataDir() })`）并作为注册键供出，第43批的 `funasrModelRoot.js` 自此脱离"生产零引用"；`getPythonCertificateEnv`（`runtimeAssetResolver.js`）与 `resolvePythonCommand`（`asrRuntimeResolver.resolveAsrRuntimePythonCommand`，回落 `resolvePreferredRuntimePythonCommand(resolvePythonCommand())`）同样接入。
3. **设置读取**：`readConfiguredFileSavePathsSync()` 改为经 `readConfiguredUserSettingsSync()`（新 `fileSaveSettingsReader.js`）取 `.fileSavePaths`，从而能识别**只有 `fileSavePathsMeta`** 的设置文件——这是 `resolveFunasrModelRootDir` 读 `fileSavePathsMeta.rootDir` 的前提。
4. **渲染器校验面**：`api/localMediaTaskApi.js` 的 `SOURCE_REQUIRED_KINDS` 增 `audioVoiceAnalyze`，`enqueueElectronMediaTask({kind:'audioVoiceAnalyze', src, args})` 的 `src` 缺失/非法会被明确拒绝。

**仍未接线（有意如实记录）**：

- 渲染器**仍无** `audioVoiceAnalyze` 调用点——没有"提取字幕 / 分离说话人"按钮或结果分支；本批交付的是**宿主链 + 生产引用解除 + 渲染器校验面**。
- 结果回写：本仓 `mediaTaskService` 的四类白名单不含分析产物，`segments`/`sourceAudio` 不会自动写回画布。
- `runtime/ffmpeg/` 未随包；`backend/services/funasr_transcription_service.py` / `...sortformer_diarization_service.py` 是否随包**未在本批核实**（属验收欠项）。
- 第47批的 `audioVoiceCloudAsr.js` / `doubaoAsrClient.js` 现已**有消费者**（本模块经 `createAudioVoiceCloudAsrAdapters` 调用），但该消费仍**无渲染器触发点**。

---

## 4 · 已执行的验证（离线）

命令与结果（本窗口实测）：

| 命令 | 结果 |
| --- | --- |
| `node --check` × 8（`mediaTasks/registerSharedMediaTaskHandlers.js`、`main.js`、`api/localMediaTaskApi.js`、`mediaTaskQueue.js`、`mediaTasks/audioVoiceAnalyzeTask.js`、`applicationResourceRoot.js`、`fileSaveSettingsReader.js`、`runtimeAssetResolver.js`） | 8/8 exit 0 |
| `node --test electron/mediaTasks/audioVoiceAnalyzeTask.test.js` | **28/28 通过** |
| `node --test` × 4 新套件（`runtimeAssetResolver` / `fileSaveSettingsReader` / `applicationResourceRoot` / `mediaTaskQueue.processStartError`） | **17/17 通过** |
| `node --test $(find electron -name '*.test.js')` | **612/611/1** |
| `node --test $(find api -name '*.test.js')` | **446/446/0** |

- 唯一失败仍是既有 `electron/fullProjectPackageService.test.js` 的用例 `missing manifest coverage cannot bind to an existing unrelated local file`（R14 第17批遗留），与第43–48批一致。
- 相对第48批 567/566/1：本批 **+45**（28+17），全量 **612/611/1**；`api` 面 446/446/0 证明 `localMediaTaskApi.js` 的补丁零回归。

**首跑 2 项失败，均为测试期望写错（实现未改）**：

1. `parseSilenceDetectRanges('silence_start: 6\nsilence_end: 4', 10)` 我期望 `[]`，实际 `[{startSec:6,endSec:10}]`——`end <= start` 只**不闭合端点**，悬挂的 `start` 仍以 `durationSec` 收尾。
2. `mergeFunasrTranscriptSegments` 我期望无说话人的英文段 `Hello`+`world` 合并为 `Hello world`，实际**不合并**——`canMergeFunasrTranscriptSegments` 第一行就要求两侧说话人标签相同**且非空**。改为带 `speaker:'S1'` 后合并；并补一条"无标签不合并"的断言。

---

## 5 · 验收欠项（仍未执行，须授权）

- **真实应用内**从渲染器发起 `audioVoiceAnalyze`：`asrProvider:'bailian'`/`'doubao'` 云端路径（**会产生真实 API 调用与费用**）、`'funasr'` 本地路径（**需先下载 paraformer/fsmn-vad/ct-punc-c/cam++ 与 Sortformer .nemo 权重**）。
- **Python 服务存在性**：`backend/services/funasr_transcription_service.py` 与 `...sortformer_diarization_service.py` 的 CLI 参数面（`--model-root`/`--duration-ms`/`--engine`/`--prepare-only`/`--check-runtime-only`/`--download-model-if-missing`）是否与本模块构造的 argv 一致，**未离线核实**。
- **真实 ffmpeg**：静音检测、16k 单声道抽取、逐段剪切的时长精度；`runProcess` **不实现 `timeoutMs`**，故长转写无超时。
- 取消语义：真实任务中 `mediaTask:cancel` 是否落在 `runFunasrTranscriptionProcess` 的定时器/`child.kill()` 路径上。
- GPU 安装：`nvidia-smi` 缺失、无独显、pip 镜像不可达时的真实报错。
- Windows 上 `AudioVoiceAnalyze`/`AudioVoiceSegments` 输出 URL 是否被画布本地媒体协议正确解析。

---

## 6 · R16 剩余工作

| 项 | 规模 | 状态 |
| --- | --- | --- |
| `mediaTasks/videoToGifTask.js` + 注册 + 渲染器校验面 | 9115 B | ✅ 第46批 |
| `mediaTasks/doubaoAsrClient.js` + `audioVoiceCloudAsr.js` | 13068 + 1220 B | ✅ 第47批（本批起**有消费者**） |
| `mediaTasks/audioVoiceComposeTask.js` + 注册 + 显示名 + 渲染器校验面 | 10778 B | ✅ 第48批 |
| `mediaTasks/audioVoiceAnalyzeTask.js` + 5 个句柄 + `main.js` 三键 + 3 个前置模块 | 55206 B | ✅ **本批** |
| 渲染器 `audioVoicePanel.js`(142 KB) / `audioVoiceAsrProviders.js` / `audioVoiceLocalAsrRuntime.js` | — | ❌ 未移植（含 `audioVoiceAnalyze`/`audioVoiceCompose`/`videoToGif` 的 UI 入口） |
| `runtime/ffmpeg/` 打包、`/api/v2/video-gif`、`backend/services/*.py` 随包核实 | — | ❌ 未做 |

---

## 7 · 约束复核

- 未触碰 `api/freeImageHostApi.js`（本批未改动该文件）。
- 未新增 npm 依赖（新增模块仅用 `node:path` / `node:fs` / `node:child_process` / `node:url`）。
- 未改 `MediaTaskQueue` 既有签名（**仅新增** `createProcessStartError` 导出与私有 `getCommandLabel`）、未改授权检查、未改安装目录、未改 `style.css`。
- 未联网、未启动应用、未执行真实 ffmpeg、未调用真实 ASR、未提交/推送。
