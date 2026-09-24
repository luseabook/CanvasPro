# ASR 运行时分发与安装（R16 第44批）

本文对应交接台账 R16，记录第44批交付。**结论先行：新版"按平台/架构从清单选包 → 下载 → SHA-256 校验 → 解压 → 从解压产物里定位 python → 冒烟验证 → 写 `current.json` 状态"的整条 ASR 运行时分发/安装链已移植进本仓（3 个新文件），并**首次接进本仓既有的媒体任务队列**（`registerSharedMediaTaskHandlers` 注册 `asrRuntimeInstall` 句柄，`main.js` 供齐 4 个依赖键）。因此 `mediaTask:enqueue` 传 `kind: 'asrRuntimeInstall'` 现在可以真的走完整条链路；`pythonRuntimeResolver.js` 不再是"落地但零引用"，而是被 `main.js` 与安装任务同时引用。29 项离线测试已实际执行通过。但**语音转写/说话人分离的任务驱动（`audioVoiceAnalyzeTask.js`）与渲染器面板仍未移植**，R16 因此仍是"运行时可以被安装与校验、但没有转写功能可调"，不是已完成的语音转写能力。**

## 1. 缺口（第44批之前）

- 第43批移植了三个可读 Python 服务（`funasr_transcription_service.py` / `sortformer_diarization_service.py` / `outbound_http_transport.py`），它们由 `python -m backend.services.*` 启动，**但本仓没有任何东西负责把"可用的 python 运行时"准备出来**：没有 ASR 运行时目录契约、没有清单/选包/校验/解压/状态落盘，也没有登记 `asrRuntimeInstall` 任务类型。
- 本仓 `electron/mediaTasks/` 在批次前只有 `audioComposeTask`/`mediaClipExportTask`/`storySequenceExportTask`/`registerSharedMediaTaskHandlers`/`videoReverseTask`，**`asrRuntimeInstall` 未注册**；`queue.enqueue({kind:'asrRuntimeInstall'})` 会抛 `Unsupported media task kind`。
- 本仓也没有 `electron/pythonRuntimeResolver.js`（`grep -rn "pythonRuntimeResolver\|asrRuntimeResolver" electron/` 批次前 0 命中）：运行时根、`versions/<version>` 安装目录、`current.json` 状态文件、以及"从已安装运行时解析 python 命令"这套契约完全缺失。

## 2. 本批交付

| 文件 | 来源 | 作用 |
| --- | --- | --- |
| `electron/pythonRuntimeResolver.js`（新） | 新版同名文件，**残留 `_0x` 形参已还原为语义名** | 纯解析层（只依赖 `node:path`，`existsSync`/`readFileSync` 全部注入）：`resolvePreferredRuntimePythonCommand`（win32 先 `python/python.exe` 再 `python/Scripts/python.exe`，posix 先 `bin/python3` 再 `bin/python`，最后落到 `fallbackCommand`；绝对路径必须 `exists`，裸命令名直接采用）、`resolveAsrRuntimeBaseDir`（`<userDataRoot>/runtime/asr`）、`resolveAsrRuntimeStatePath`（`current.json`）、`normalizeAsrRuntimeVersion`（非 `[a-zA-Z0-9._-]` 替换为 `_`，截断 80 字符，空则 `unknown`）、`resolveAsrRuntimeInstallDir`（`versions/<sanitized>`）、`readInstalledAsrRuntimeState`（JSON 解析失败/`runtimeRoot` 逃出基目录/`runtimeRoot` 已不存在 → 一律 `null`）、`resolveAsrRuntimePythonCommand` |
| `electron/asrRuntimeResolver.js`（新） | 新版同名文件 | 6 个符号的再导出薄层（单一实现源，测试用 `assert.equal` 校验是同一函数引用） |
| `electron/mediaTasks/asrRuntimeInstallTask.js`（新） | 新版同名文件，**残留 `_0x` 形参已还原为语义名** | `selectAsrRuntimePackage`（`packages[]` 或裸清单二态；`platform`/`arch` 归一为小写；无 `url` 且无 `mirrors` 的条目不算命中）、`createAsrRuntimeInstallMediaTaskHandler`（完整安装流程，见下） |
| `electron/mediaTasks/registerSharedMediaTaskHandlers.js`（改） | 新版同名文件的对应登记块 | 新增 `setHandler('asrRuntimeInstall', ...)`，传入 `appRoot`/`getAsrRuntimeManifestUrl`/`getUserDataRoot`/`resolveFallbackPythonCommand` |
| `electron/main.js`（改） | 新版 `mediaTaskRuntime.js` 的对应依赖 | 新增 `import { resolvePreferredRuntimePythonCommand }`（第53行），并在 `registerSharedMediaTaskHandlers(...)`（第1821行）里补 `appRoot: APP_ROOT`、`getAsrRuntimeManifestUrl`（`AIC_ASR_RUNTIME_MANIFEST_URL` 环境变量优先，默认新版同款 modelscope 清单 URL）、`getUserDataRoot: () => app.getPath('userData')`、`resolveFallbackPythonCommand`（`resolvePreferredRuntimePythonCommand` 包住既有 `resolvePythonCommand()`） |
| `electron/pythonRuntimeResolver.test.js`（新） | 本批编写 | **15 项**离线测试（已执行通过） |
| `electron/mediaTasks/asrRuntimeInstallTask.test.js`（新） | 本批编写 | **14 项**离线测试（已执行通过） |

### 行为要点（安装任务）

- **三段来源判定，顺序固定**：`installed`（`current.json` 有效且 `runtimeRoot` 内解析得到 python）→ `bundled`（`resolveFallbackPythonCommand()` 指向的文件存在，且**冒烟通过**）→ `downloaded`（清单选包）。`payload.args.forceRepair === true` 时**跳过前两段**，强制重装。
- **冒烟命令是硬约束**：`python -c "import torch; import torchaudio; import funasr; import modelscope; from nemo.collections.asr.models import SortformerEncLabelModel; print('asr runtime smoke ok')"`，`cwd` 为 `appRoot`，跑在注入的 `queue.runProcess` 上（进程由媒体队列持有，可被 `mediaTask:cancel` 杀掉）。
- **下载与校验**：`fetch(url)` → 断言 `response.ok` → `content-length` 存在时按字节推进度（进度区间 `0.18→0.60`，四舍五入的百分比进文案）→ `pipeline` 流式写入 zip。清单给出 `sha256` 时**必须先校验再解压**，不一致即 `ASR runtime checksum verification failed`，此时既不写状态也不落安装目录。
- **解压后的根定位**：解压目录本身含 python 就用它；否则 `readdir` 只允许**唯一一个子目录**且该子目录含 python，才把它当作运行时根；否则抛 `ASR runtime archive must contain a python runtime directory`（不允许"随便挑一个子目录"）。
- **落盘是"先删后写"**：`rm(current.json)` → `rm(sysInstallDir)` → `mkdir(parent)` → `rename(解压根 → installDir)`。临时目录固定在 `<base>/_tmp/<taskId>`，成功与失败路径都只清该任务子目录。
- **状态文件**：`{version, runtimeRoot, platform, arch, sha256, manifestUrl, installedAt}`，缩进 2 空格并以 `\n` 收尾；`readInstalledAsrRuntimeState` 只认"`runtimeRoot` 位于 `<base>` 之内且仍存在"的记录——**手改 `current.json` 指向仓外路径不会被采纳**。

### 与新版的有意差异

| 项 | 新版 | 本批 | 原因 |
| --- | --- | --- | --- |
| `emitProgress` 第 4 参 `{ stage }` | 新版队列透传阶段名 | **已于第54批闭合**：本仓 `MediaTaskQueue.emitProgress(task, progress, message, { stage })` 现为 4 参并写入 `task.stage`（第44–53批期间是 3 参，第 4 个实参被忽略） | 移植本批**任务模块**时未动队列；队列签名由第54批的队列升级单独补上 |
| 清单 URL 环境变量 | `env['AIC_ASR_RUNTIME_MANIFEST_URL']` | `process.env.AIC_ASR_RUNTIME_MANIFEST_URL` | 本仓 `main.js` 无 `env` 常量，全文件用 `process.env` |
| `extract-zip` | 新版依赖 | 本仓 `package.json` 已有 `extract-zip@^2.0.1`（`electron/projectPackageService.js:15` 已在用） | **未新增任何 npm 依赖** |

## 3. 接线现状与可达性

- **注册**：`electron/mediaTasks/registerSharedMediaTaskHandlers.js:10-17` 注册 `asrRuntimeInstall`；依赖键由 `electron/main.js:1821-1841` 提供。
- **可达**：`electron/ipc/mediaTaskIpc.js:4` 的 `mediaTask:enqueue` 把 payload 原样交给 `queue.enqueue`，`MediaTaskQueue.enqueue` 按 `payload.kind` 查 `handlers`。所以渲染器（或任何 IPC 客户端）发 `{ kind: 'asrRuntimeInstall' }` 即触发整条链路，进度/结果经既有 `mediaTask:update` 通道回传。
- **取消**：冒烟阶段由队列持有子进程，`mediaTask:cancel` 可中断；**下载阶段不可中断**（新版亦然，`pipeline` 未接 `AbortSignal`）。
- **未接线（有意）**：`audioVoiceAnalyzeTask.js`（真正的转写/分离任务，会用 `getFunasrModelRootDir`/`getSortformerModelRootDir`/`getPythonCertificateEnv`/`getDoubaoAsrConfig`/`getBailianAsrConfig`）未移植，因此 `main.js` **没有**传这些键——第43批的两个模型根解析器仍是生产零引用。渲染器侧 `audioVoicePanel.js` 等未动。

## 4. 已执行的验证（离线）

| 命令 | 结果 |
| --- | --- |
| `node --check` ×5（2 个解析器 + 安装任务 + 2 个测试） | 全部 exit 0 |
| `node --test electron/pythonRuntimeResolver.test.js electron/mediaTasks/asrRuntimeInstallTask.test.js` | **29 tests / 29 pass / 0 fail** |
| `node --test $(find electron -name '*.test.js')` | **426 tests / 425 pass / 1 fail**（唯一失败是 `electron/fullProjectPackageService.test.js` 的 `/未包含/` 断言，R14 第17批遗留，自第30批起每轮均在；本批 +29 项全部通过） |

测试里**没有真实网络、没有真实进程、没有真实模型**：`fetchImpl` 与媒体队列均为注入替身，下载用的归档是 yazl 现场构造的**真实临时 ZIP**，因此"下载→SHA-256→解压→解压根定位→改名落盘→写状态→清临时目录"这条路径是被真跑过的（含 `100%` 进度文案与 `0.6` 进度值断言）。覆盖：已安装复用（零网络零进程）、bundled 冒烟成功、下载安装成功、单层嵌套归档解包、校验和不符中止、归档无 python 拒绝、清单 URL 未配置/`file://` 非法协议、清单 HTTP 503、无匹配平台架构、`forceRepair` 重装、状态文件越界/损坏/运行根消失三种拒绝。

## 5. 验收欠项

- **真实下载安装未验证**：需要联网到 modelscope（或自备清单镜像）+ 数 GB 归档 + 真实解压，且冒烟会 import torch/torchaudio/funasr/modelscope/nemo。**未获授权前不得执行**；费用为下载流量，无付费 API。
- **未验证**：真实 `python` 运行时目录布局（新版打包的 runtime 结构）、Windows 路径长度/权限/杀软、断网重试、下载中断后的残留、并发两个 `forceRepair` 任务、`mediaTask:cancel` 在真实 spawn 上的行为、渲染器端入口。
- 本批测试**不构成**"ASR 可用了"的证据：没有转写驱动，就没有转写结果可验收。

## 6. R16 剩余工作

| 项 | 状态 |
| --- | --- |
| 三个 Python 服务 | 第43批已移植 + 34 项离线测试 |
| 模型根解析器（funasr/sortformer） | 第43批已移植 + 9 项离线测试；**仍生产零引用**（等 `getFunasrModelRootDir()` 进 `main.js` 与 `audioVoiceAnalyzeTask`） |
| `pythonRuntimeResolver` / `asrRuntimeResolver` / `asrRuntimeInstallTask` | **本批已移植、已注册、已接线、29 项离线测试通过** |
| `mediaTasks/audioVoiceAnalyzeTask.js`（转写/分离任务驱动，55 KB） | 未移植（下一步主体） |
| `mediaTasks/audioVoiceComposeTask.js`、`audioVoiceCloudAsr.js`、`doubaoAsrClient.js`、`recordingAsrProviders.js`、`recordingTranscribeTask.js`、`videoToGifTask.js` | 未移植 |
| 渲染器侧 `audioVoicePanel.js`（142 KB）/`audioVoiceAsrProviders.js`/`audioVoiceLocalAsrRuntime.js`/`api/bailianAsrApi.js` | 未移植 |
| `/api/v2/video-gif`、音频合成、`runtime/ffmpeg/` 打包 | 未移植 |
