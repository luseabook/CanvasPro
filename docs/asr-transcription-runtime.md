# ASR / 说话人分离运行时（R16 第43批）

本文对应交接台账 R16，记录第43批交付。**结论先行：新版随包发布的三个可读 Python 服务（`outbound_http_transport.py`、`funasr_transcription_service.py`、`sortformer_diarization_service.py`）已逐字节移植进本仓 `backend/services/`，并补了 34 项**已实际执行通过**的离线测试；两个模型根目录解析器（`funasrModelRoot.js`、`sortformerModelRoot.js`）也已移植并有 9 项已执行通过的离线测试。但**驱动这三个服务的新版 Electron 媒体任务链（`audioVoiceAnalyzeTask.js` 等）本轮未移植**，所以 R16 目前是"后端服务与模型路径契约到位、任务驱动与渲染器面板未到位"，不是可用的语音转写/说话人分离功能。**

## 1. 缺口（第43批之前）

- 新版 `resources/webapp/backend/services/` 里有 **5 个可读 `.py`**，本仓只有其中一对 `__init__.py`；`funasr_transcription_service.py`、`sortformer_diarization_service.py`、`outbound_http_transport.py` **本仓 0 命中**（`grep -rn "funasr|sortformer|diariz|outbound_http"` 全仓为空）。
- 后果：本仓**完全没有**语音转写（FunASR）、说话人分离（NVIDIA Sortformer）、以及统一的出站 TLS 信任链这三项后端能力。新版其余后端是编译产物（`resources/runtime/backend/`），无法作为移植依据——**这三个 `.py` 是新版后端里唯一可读的部分**。
- 新版 Electron 侧驱动链也是可读的（反混淆树中）：`mediaTasks/audioVoiceAnalyzeTask.js`（55 KB，`backend.services.funasr_transcription_service` / `backend.services.sortformer_diarization_service` 作为 `python -m` 模块被启动）、`mediaTasks/asrRuntimeInstallTask.js`（12 KB）、`mediaTasks/registerSharedMediaTaskHandlers.js`、`pythonRuntimeResolver.js`/`asrRuntimeResolver.js`、`main.js`（`funasrModelRoot.js` 的导入与 `getFunasrModelRootDir()`）；渲染器侧 `src/modules/audioVoicePanel.js`（142 KB）、`audioVoiceAsrProviders.js`、`audioVoiceLocalAsrRuntime.js`、`api/bailianAsrApi.js`。本仓 `electron/mediaTasks/` 只有 `audioComposeTask/mediaClipExportTask/storySequenceExportTask/registerSharedMediaTaskHandlers/videoReverseTask`，**没有任何 ASR 任务**。

## 2. 本批交付

| 文件 | 来源 | 作用 |
| --- | --- | --- |
| `backend/services/outbound_http_transport.py`（新） | 新版同名文件**逐字节** | 统一出站 TLS 信任链：系统信任根 + certifi + 环境 CA **合并**（环境值不能替换基础信任根）；`is_loopback_http_url` 只认真正回环；`urlopen`/`build_opener` 拒绝调用方传 `context`；`_RequestsClient` 拒绝逐调用 `verify`；加载不到任何信任根时抛 `ssl.SSLError`；构建后打印一行 JSON 状态 |
| `backend/services/funasr_transcription_service.py`（新） | 新版同名文件**逐字节** | FunASR 转写 CLI（JSON-lines 协议）：`--check-runtime-only`/`--prepare-only`/正常转写三态；`configure_funasr_environment` 把缓存全部约束到 `--model-root` 下；`normalize_funasr_segments` 归一 `sentence_info`/`sentences`/`segments`；`check_torch_gpu_runtime` 区分"无 torch"/"CPU-only torch"/"CUDA 不可用"三种 GPU 拒绝原因 |
| `backend/services/sortformer_diarization_service.py`（新） | 新版同名文件**逐字节** | Sortformer 说话人分离 CLI：`normalize_speaker_label` 归一到 `SPEAKER_NN`、`normalize_sortformer_segments` 排序并按媒体时长夹取、`apply_low_latency_sortformer_config` 写入低延迟流式参数（80/24/104/80/188）；模型经 `download_file_with_progress` 下载（`.part` + 原子 `replace`，无注入时走 `outbound_http_transport`） |
| `electron/funasrModelRoot.js`（新） | 新版同名文件，**残留 `_0x` 形参已还原** | `FUNASR_MODEL_DIR_NAME='funasr'`；`inferFileSaveRootDirFromManagedPaths` 由 `canvasDir/dataDir/outputDir` 的 basename 反推文件保存根；`resolveFunasrModelRootDir` 优先 `fileSavePathsMeta.rootDir`，否则反推，否则 `fallbackDataDir`，皆无则 `''` |
| `electron/sortformerModelRoot.js`（新） | 同上 | `SORTFORMER_MODEL_DIR_NAME='sortformer'`，复用同一反推函数 |
| `backend/services/test_asr_transcription_services.py`（新） | 本批编写 | **34 项**离线测试（已执行通过） |
| `electron/funasrModelRoot.test.js`（新） | 本批编写 | **9 项**离线测试（已执行通过），覆盖两个解析器 |

### 行为要点

- **`--model-root` 是唯一写入边界**：两个 `configure_*_environment` 都先 `Path(model_root).expanduser().resolve()`，再在该根下建 `cache/ models/ torch/ tmp/`，并把 `MODELSCOPE_*`/`HF_HOME`/`HUGGINGFACE_HUB_CACHE`/`TRANSFORMERS_CACHE`/`TORCH_HOME`/`XDG_CACHE_HOME`/`TMPDIR`/`TEMP`/`TMP` 全部指向根内。用户可传的路径不会被写进这些变量。
- **默认离线**：`apply_offline_mode_if_needed(False)`（即默认）会设 `MODELSCOPE_OFFLINE/TRANSFORMERS_OFFLINE/HF_DATASETS_OFFLINE=1`，只有显式 `--download-model-if-missing` 才允许联网取模型。
- **重依赖全部懒加载**：`funasr`、`torch`、`nemo.collections.asr` 都在函数体内 import，因此两个模块可以在**没有这些依赖**的解释器里被 import 并单测；本仓 `venv`（Python 3.14.3）里 `funasr`/`torch`/`nemo` 均不存在，两条运行时就绪探测因此稳定返回"不可用"而**不抛异常**。
- **TLS 策略不可被调用方削弱**：`urlopen(..., context=...)` 与 `client.get(..., verify=...)` 都会 `TypeError`；企业 CA 只能**追加**。
- **模型根解析是纯函数**：两个解析器只依赖 `node:path`，无 Electron 依赖，`fileSavePathsMeta.rootDir` 缺失时按 basename 反推；多个托管目录父级不一致时**不臆造**共同根。

### 与新版的有意差异

- **无**：本批四个源文件均为逐字节移植（JS 侧仅把残留 `_0x` 形参还原为语义化名称，逻辑与字符串完全一致）。第 5 节的"未完成"是本轮**没有**移植的部分，不是对已移植文件的改写。

## 3. 接线现状与安全边界

- **Python 侧**：三个服务是**可独立 spawn 的 CLI 入口**（`python -m backend.services.<name>` + JSON-lines 输出），与既有 `backend/services/story_document_worker.py` 同属"私有一次性子进程"类别，因此不构成"孤立模块"。本仓现有的 Python 路由分发器（`backend/services/http_route_dispatcher.py`）**没有**任何 ASR 路由，本轮**未新增路由**——原因是新版的真正调用方在编译产物里，任何自造路由形状都属臆造。
- **JS 侧（诚实标注）**：`electron/funasrModelRoot.js` 与 `sortformerModelRoot.js` 目前**只被各自的测试引用**，生产代码尚无消费者。新版中 `resolveFunasrModelRootDir` 的消费者是 `main.js` 的 `getFunasrModelRootDir()`（反混淆树 `main.js:61` 导入、`main.js:871` 调用），该消费者属于未移植的 ASR 任务链。本仓 `main.js` 有对应的输入（既有 `readConfiguredFileSavePathsSync()` 与 `getDataDir()`），但**本仓 `main.js` 里没有任何消费点**，故本轮**不往 `main.js` 里加无消费者的 `getFunasrModelRootDir()`**，以免在 2400+ 行的主进程文件里留死代码。这两个文件因此是本仓目前**唯一一对"已落地但生产零引用"**的源码，列入第 5 节待接线项。
- **不改变任何授权/校验**：未新增 IPC 通道、未新增路由、未改 `assert*Sender`、未改 `style.css`、未触碰安装目录。
- **网络面**：`outbound_http_transport` 只被 `sortformer` 的模型下载使用，且默认离线；测试全部用注入的假传输，**未发起任何真实请求**。

## 4. 已执行的验证（离线，本窗口实测）

命令：

```
node --check electron/funasrModelRoot.js electron/sortformerModelRoot.js electron/funasrModelRoot.test.js
node --test electron/funasrModelRoot.test.js
node --test $(find electron -name '*.test.js')

venv/Scripts/python.exe -c "import ast,pathlib; [ast.parse(pathlib.Path(f).read_text(encoding='utf-8'), f) for f in (...4 个文件...)]"
venv/Scripts/python.exe -m unittest backend.services.test_asr_transcription_services -v
```

结果：

- `node --check` 三个文件全部退出 0。
- `electron/funasrModelRoot.test.js`：**9 项通过 / 0 失败**。
- `electron/**` 合计 **397 项 / 396 通过 / 1 失败**（较第42批基线 388/387/1 净增 9 项，即本批新增的 JS 测试）。唯一失败仍是既有 `electron/fullProjectPackageService.test.js`（归 R14 第17批），与本批无关。
- Python AST 解析 4 个文件全部通过（静态，不执行）。
- `backend.services.test_asr_transcription_services`：**Ran 34 tests — OK**。其中 `test_tls_status_reports_a_merged_trust_store` 实际构建了信任链并打印状态：`caCertificateCount: 138`、`systemTrustLoaded: true`、`certifiBundleLoaded: true`（certifi `2026.06.17`）、`opensslVersion: OpenSSL 3.0.18`。

覆盖点（Python 34 项）：

- `outbound_http_transport`（7 项）：回环判定（`127.0.0.1`/`127.0.0.5`/`[::1]` 真，`example.com`/`ftp://`/空/相对路径/`None`/带 userinfo 假）、`RequestLike.full_url` 取值、`urlopen(context=)` 拒绝、`_request(verify=)` 拒绝、真实合并信任链状态、`certifi=None` 且系统根失败时抛 `ssl.SSLError`。
- `funasr`（12 项）：`normalize_time_ms` 坏值/负值归零、毫秒直通 vs 秒级按 `duration_ms` 放大、`first_text` 跳空、`sentence_info` 归一（含 `spk`）、零长/倒置句丢弃、纯文本整段回退（且 `duration_ms=0` 时不给假时间轴）、非 dict 结果忽略、环境变量只写注入的 mapping 且建齐 4 个目录、离线模式开关、`--check-runtime-only` 返回 0 且输出 `funasr_missing`、缺音频先报 `audio_required` 返回 2、无 torch 时 GPU 解析抛错而 CPU 直通、arg 默认值（`paraformer-zh`/`fsmn-vad`/`ct-punc-c`/`cam++`/`ms`/300s）。
- `sortformer`（15 项）：说话人标签归一与自由文本直通、段字符串需 3 字段、嵌套输入展平、按媒体时长夹取并排序、缺说话人/零长丢弃、字符串段与 dict 段等价、环境只写注入 mapping 且建齐 4 个目录、模型路径固定在 `models/` 下、低延迟参数五项 + `_check_streaming_parameters` 被调用、无 `sortformer_modules` 时是 no-op、缺模型文件先报 `SortformerModelMissingError`（不发下载）、注入传输的原子下载（`.part` 不存在、内容完整、进度末值为 1.0）、`--check-runtime-only` 返回 0 且输出 `sortformer_missing`、缺音频先报 `audio_required` 返回 2、arg 默认值。

**这些不是功能验收**：没有安装 `funasr`/`torch`/`nemo`，没有下载任何模型，没有转写或分离任何真实音频，没有在应用内跑通任务链。

## 5. 验收欠项 / R16 剩余工作

| 项 | 状态 |
| --- | --- |
| 三个 Python 服务 + 两个模型根解析器源码 | ✅ 本批落地并逐字节对齐 |
| 纯函数/契约离线测试 | ✅ 本批 43 项（Python 34 + JS 9）已执行通过 |
| `electron/mediaTasks/audioVoiceAnalyzeTask.js`（55 KB 驱动，`python -m backend.services.*` 启动、进度/取消/产物回传） | ❌ 未移植（R16 最大缺口） |
| `electron/pythonRuntimeResolver.js` + `asrRuntimeResolver.js`（ASR 运行时安装目录/状态/版本/python 命令解析） | ❌ 未移植 |
| `electron/mediaTasks/asrRuntimeInstallTask.js`（运行时 ZIP 下载/校验/解包/版本状态） | ❌ 未移植 |
| `main.js` 的 `getFunasrModelRootDir()` 消费点（反混淆树 `main.js:61`/`871`）与 `electron/sortformerModelRoot.js` 的消费者 | ❌ 未接线（本仓这两个解析器目前生产零引用） |
| 渲染器面板：`audioVoicePanel.js`（142 KB）、`audioVoiceAsrProviders.js`、`audioVoiceLocalAsrRuntime.js`、`api/bailianAsrApi.js` | ❌ 未移植 |
| `/api/v2/video-gif`（R16 另一子项）与音频合成 | ❌ 未移植 |
| `runtime/ffmpeg/` 随包二进制的打包接入（新版本仓有 `resources/runtime/ffmpeg/`） | ❌ 未接入；本仓无 `runtime/` |
| 真实运行验收（装依赖、下模型、转写/分离真实音频、应用内任务链） | ❌ **未做，且需要授权**：需先列出依赖体积（`funasr`+`torch`+`nemo_toolkit[asr]`）、模型下载地址与体积、磁盘与耗时，再经用户同意 |

## 6. 已知未完成（明确不假装已做）

- 本批**只**补了 R16 的"后端服务 + 模型路径契约"，**没有**让语音转写/说话人分离在产品里可用：没有任务驱动、没有运行时安装、没有渲染器面板、没有 ffmpeg 打包。
- `electron/funasrModelRoot.js`/`sortformerModelRoot.js` 是本仓第一对"生产零引用"的落地源码（详见第 3 节理由）；这是**有意的**而非疏漏，接线点在下一批。
- `resolveSortformerModelRootDir` 在新版树里**同样**没有消费者（已用 grep 核实），因此它是忠实移植，不是本仓新造的用法。
- Python 测试的执行命令已在第 4 节列出；本轮执行的是**纯函数与运行时探测**，未安装任何模型依赖。
