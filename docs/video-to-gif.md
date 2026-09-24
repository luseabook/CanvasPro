# 第46批 · R16 视频转 GIF 宿主任务链（`videoToGif`）

> 批次范围：R16（ASR / 转写 / 说话人分离 / 音频合成 / **视频转 GIF**）中的「视频转 GIF」一条宿主任务链。
> 本批**不覆盖** R16 的本地转写/分离驱动、音频合成与 `runtime/ffmpeg/` 打包。
> 所有证据均为**离线**：`node --check` 与 `node --test`，未联网、未启动应用、未执行真实 ffmpeg。

---

## 1 · 缺口（第46批之前）

0.7.16 的 `resources/webapp/electron/mediaTasks/videoToGifTask.js`（9115 B）在本仓**完全没有对应物**：

| 检查 | 第46批之前 |
| --- | --- |
| `grep -rn "videoGif\|video-gif\|toGif"` 全仓 | **0 命中** |
| `mediaTaskQueue.enqueue({kind:'videoToGif'})` | 抛 `Unsupported media task kind: videoToGif` |
| `api/localMediaTaskApi.js` 的 `SOURCE_REQUIRED_KINDS` | **不含** `videoToGif`（新版含） |
| `getMediaTaskDisplayName`（本仓 `main.js:1488`） | 无 `videoToGif` 键（**新版 `mediaTaskRuntime.js:60` 同样没有**，两者一致） |

新版里这条链的调用方是渲染器 `api/localMediaTaskApi.js`（`SOURCE_REQUIRED_KINDS` 含 `videoToGif`），最终落到 `mediaTasks/registerSharedMediaTaskHandlers.js:132` 的 `setHandler('videoToGif', …)`。本批把宿主侧整条链补齐，并把渲染器校验面从"必拒"改为"必校"。

---

## 2 · 本批交付

### 2.1 文件

| 文件 | 性质 | 说明 |
| --- | --- | --- |
| `electron/mediaTasks/videoToGifTask.js` | 新增（可读移植） | 仅 `node:fs` / `node:path`；4 个导出 + 1 个工厂 |
| `electron/mediaTasks/registerSharedMediaTaskHandlers.js` | 修改 | 新增 import 与 `setHandler('videoToGif', …)` 第八个句柄 |
| `api/localMediaTaskApi.js` | 修改 | `SOURCE_REQUIRED_KINDS` 增 `'videoToGif'`（一行） |
| `electron/mediaTasks/videoToGifTask.test.js` | 新增 | 25 项离线用例 |

### 2.2 行为要点

导出面：

- `normalizeVideoToGifOptions(options = {}, meta = {})` — 归一化整份编码参数。
  - `preset`：仅 `hd` 视作 `hd`，其余一律回落 `wechat`。
  - `quality`：仅 `compact` / `balanced` / `high` 有效，否则回落（`wechat` → `high`，其余 → `balanced`）。
  - `start` / `end` / `duration`：`start` 夹到 `[0, duration - minGap]`（`minGap = duration > 0 ? min(0.1, duration) : 0.1`）；`end` 夹到 `[start + minGap, duration]`，缺省回落"源时长"或 `start + 3`；`duration` 恒为 `end - start`。
  - 画幅：`size` 先由 `options.size` → `max(options.width, options.height)` → 720 逐级回落，再夹到 `[64, 1920]`；已探明源宽高时按短边适配（横屏 `height = round(size / ratio)`，竖屏 `width = round(size * ratio)`），否则宽高同为 `size`。
  - 质量派生默认：`maxColors`（`compact 64` / `balanced 128` / `high 256`）、`bayerScale`（`compact 5` / `balanced 3` / `high 2`）。
  - `fps` 夹到 `[4, 30]`，默认 `wechat 15` / `hd 20`；`targetBytes` 夹到 `[0, 50 MiB]`，默认 `wechat 1 MiB` / `hd 0`（即不设目标）。
- `buildVideoToGifFfmpegArgs({ sourceAbs, outAbs, options })` — 缺任一绝对路径即抛 `Invalid video to GIF source`。产出确定性参数表：`-y -ss <start> -t <duration> -i <src> -filter_complex <三段调色板滤镜图> -map [out] -an -loop 0 -gifflags +transdiff <out>`。滤镜图为 `fps=<fps>,scale=<w>:<h>:flags=lanczos,setsar=1,format=rgba,split[palette_source][gif_source]` → `palettegen=max_colors=<n>:reserve_transparent=1:stats_mode=diff[palette]` → `paletteuse=dither=bayer:bayer_scale=<s>:diff_mode=rectangle[out]`，三段以 `;` 连接。
- `resolveNextVideoGifAdaptiveProfile({ profile, fileSize, targetBytes, attempt })` — 只有"超出目标且目标为正"才产出下一档；`maxColors` 每次 `× 0.75`（下限 32），`fps` 仅在 `attempt >= 2` 时 `× 0.85`（下限 6）；若结果与当前档完全相同则返回 `null` 以终止自适应。
- `createVideoToGifMediaTaskHandler(deps)` — 任务句柄。流程：`resolveMediaTaskSource(payload.src)` → `ffprobeVideoMeta` → 无视频流抛 `Source video has no video stream`（**在任何编码之前**）→ `normalizeVideoToGifOptions(payload.args || payload, meta)` → `mkdirSync(<out>/Gif, {recursive:true})` → 循环 `attempt ∈ [0, targetBytes > 0 ? 6 : 1)`：先 `throwIfCancelled`，再 `emitProgress(task, task.progress || 0.01, attempt === 0 ? 'Encoding GIF' : 'Optimizing GIF (n/6)', {stage: attempt === 0 ? 'encode' : 'optimize'})`，随后 `runFfmpeg` 并 `statFile(outAbs)`；命中目标或到上限即停，否则按 `resolveNextVideoGifAdaptiveProfile` 收窄后重编。结果对象含 `success/filename/path/localPath/url/mimeType:'image/gif'/imageWidth/imageHeight/duration/fps/maxColors/fileSize/targetBytes/targetExceeded/preset`。
- 依赖注入面：`createOutputFilename` / `ffprobeVideoMeta` / `getOutputDir` / `getRuntimeToolOrFallback` / `resolveMediaTaskSource` / `toOutputLocalPath` 必填；`runFfmpegTask` 与 `statFile` 可选（缺 `runFfmpegTask` 时回落 `queue.runProcess(task, getRuntimeToolOrFallback('ffmpeg'), args, options)`，缺 `statFile` 时用 `statSync`）。**测试因此完全不 spawn 进程、不调用真实 ffmpeg。**

### 2.3 与新版是否有差异

| 项 | 新版 | 本批 | 说明 |
| --- | --- | --- | --- |
| 算法与字符串 | — | 逐行等价（`0x` 十六进制字面量原样保留） | 无行为差异 |
| 依赖键 | 传 `runFfmpegTask`（新版 `main.js` 有该键） | **不传** `runFfmpegTask` | 本仓 `main.js` 无该键，句柄内建回落即 `queue.runProcess`，行为一致 |
| `emitProgress` 第 4 参 `{stage}` | 新版 `mediaTaskRuntime` 有阶段名 | 本仓 3 参 `MediaTaskQueue.emitProgress` **忽略第 4 参** | 与第44/45批同源差异；本批未改既有队列签名 |
| `getMediaTaskDisplayName` | 无 `videoToGif` 键 | 同样无 | **有意不加**，保持与新版一致；任务中心显示回落文案「媒体任务」 |
| 渲染器消费 | `api/localMediaTaskApi.js` + 面板 | 仅 `SOURCE_REQUIRED_KINDS` 放行 | 见 §3 |

---

## 3 · 接线现状与可达性

已接线：

1. `registerSharedMediaTaskHandlers` 注册第八个句柄 `videoToGif`，`main.js` 早在第44/45批就把 `createOutputFilename` / `ffprobeVideoMeta` / `getOutputDir` / `getRuntimeToolOrFallback` / `resolveMediaTaskSource` / `toOutputLocalPath` 六键供齐，**本批零新增 `main.js` 键**。
2. `electron/ipc/mediaTaskIpc.js` 的 `mediaTask:enqueue` 对 kind **无白名单**，原样交给 `queue.enqueue`，因此 `window.electronAPI` → IPC → 句柄全链可达。
3. `api/localMediaTaskApi.js` 的 `SOURCE_REQUIRED_KINDS` 增 `videoToGif`：以前渲染器传该 kind 会被 `missing` 校验挡下（若带 `src` 则完全不校验），现在 `src` 缺失或非法会被明确拒绝。这使渲染器侧的 `enqueueElectronMediaTask({ kind:'videoToGif', src, args })` 成为**受校验的合法路径**。

**仍未接线（有意如实记录）**：

- 渲染器**没有** `videoToGif` 的调用点——全仓 `grep -rn "videoToGif\|toGif"`（除本批新增文件）仍 **0 命中**；没有"导出 GIF"按钮 / 工具栏动作 / 结果渲染分支。故本批交付的是**宿主链 + 渲染器校验面**，不是"用户点得出来"的功能。
- `api/index.js` 未新增 GIF 转发函数（新版也没有独立 `videoToGifApi.js`，其调用点在任务 API 内部）。
- 结果回写：本仓 `mediaTaskService` 的四类白名单结果不含 GIF，故 GIF 结果不会被自动写回画布节点，需人工取回（与第25批契约一致）。
- `runtime/ffmpeg/` 未随包，真实编码依赖运行期 `getRuntimeToolOrFallback('ffmpeg')` 能找到 ffmpeg。

---

## 4 · 已执行的验证（离线）

命令与结果（本窗口实测）：

| 命令 | 结果 |
| --- | --- |
| `node --check electron/mediaTasks/videoToGifTask.js` | exit 0 |
| `node --check electron/mediaTasks/registerSharedMediaTaskHandlers.js` | exit 0 |
| `node --check electron/mediaTasks/videoToGifTask.test.js` | exit 0 |
| `node --check api/localMediaTaskApi.js` | exit 0 |
| `node --test electron/mediaTasks/videoToGifTask.test.js` | **25/25 通过** |
| `node --test $(find electron -name '*.test.js')` | **514/513/1** |

- 唯一失败仍是既有 `electron/fullProjectPackageService.test.js` 的 `/未包含/` 断言（R14 第17批遗留），与第43–45批一致。
- 相对第45批 489/488/1：本批 **+25**，全量 **514/513/1**。

`videoToGifTask.test.js` 覆盖面（25 项）：

- `normalizeVideoToGifOptions` 11 项：`wechat` 默认（`maxColors 256`、`targetBytes 1 MiB`、`fps 15`、`bayerScale 2`）、`HD` 大小写归一与 `hd` 默认、`start`/`end`/`duration` 三种夹取（超尾、负起点、`end` 未给 / 过早 / 未知时长）、横屏与竖屏短边适配、显式源尺寸优先、尺寸与帧率与颜色上下限、非法 `quality` 回落。
- `buildVideoToGifFfmpegArgs` 2 项：整表 `deepEqual`（含三段滤镜图逐字符比对）、缺 `sourceAbs` / 缺 `outAbs` 均抛错。
- `resolveNextVideoGifAdaptiveProfile` 3 项：未超目标返回 `null`、目标为 0 返回 `null`、第一档只收颜色/第二档同时降帧、无变化返回 `null`。
- `createVideoToGifMediaTaskHandler` 7 项：无视频流在编码前拒绝、落盘到 `<out>/Gif/` 且本地路径与 `url` 映射正确、`hd` 单次编码（`cmd === '/runtime/ffmpeg'`、`options` 深比较）、`wechat` 文件名前缀不同、超目标触发第二轮（进度文案 `Encoding GIF` → `Optimizing GIF (2/6)`、`{stage}` 为 `encode`/`optimize`、第二份参数含 `max_colors=192`）、6 次上限后 `targetExceeded:true`、取消在编码前抛出、注入 `runFfmpegTask` 时**不**走 `getRuntimeToolOrFallback`（其被写成抛错以证明未被调用）。
- 注册面 3 项：用**真实 `MediaTaskQueue`** 注册句柄后平铺 `enqueue({kind:'videoToGif', taskId, nodeId, src, args})` 跑到 `complete` 并核对 `result.filename/localPath/imageWidth/imageHeight` 与 `onUpdate` 快照流；`registerSharedMediaTaskHandlers` 在 stub 队列上落出 `videoToGif` 函数；`null` / `{}` 队列被容忍。

首跑 3 项失败**全部是测试期望写错，非实现错误**：`wechat` 的 `quality` 默认为 `high` 故 `maxColors` 是 `256` 而非 `128`；`duration` 存在浮点尾差（`0.10000000000000009`）需容差断言；自适应第二轮的 `maxColors` 由 `256 → 192` 而非 `128 → 96`，且 `args.includes('max_colors=192')` 要改查 `args.join(' ')`（滤镜图是**单个数组元素**）。修正后 25/25。

---

## 5 · 验收欠项（仍未执行，须授权）

- **真实应用内**从渲染器发起 `videoToGif` 任务并得到一个可播放的 GIF（含 `wechat` 与 `hd` 两条预设、`targetBytes` 自适应是否真能压到 1 MiB 以内）。
- **真实 ffmpeg**：本仓 `MediaTaskQueue.runProcess` **不实现 `timeoutMs`**（`electron/mediaTaskQueue.js:137`），故 GIF 编码阶段无超时；`-ss` 在 `-i` 之前属输入侧快进，需在真实长视频上核对首帧准确性。
- 无视频流的源（纯音频 mp4）在真实 ffprobe 下的报错文案；损坏文件与 0 字节文件的行为。
- 取消语义：真实任务进行中 `mediaTask:cancel` 是否能在两次编码之间生效（本批只验证了"编码前抛出"这条路径）。
- 长任务在 `concurrency: 2` 下与其他 ffmpeg 任务抢占时的表现。
- `targetExceeded:true` 时渲染器是否有对应提示（当前无消费者，无提示）。
- **未验证**：Windows 上 `Gif` 子目录的创建与输出 URL 是否被画布的本地媒体协议正确解析。

---

## 6 · R16 剩余工作

| 项 | 规模 | 状态 |
| --- | --- | --- |
| `mediaTasks/videoToGifTask.js` + 注册 + 渲染器校验面 | 9115 B | ✅ 本批 |
| `mediaTasks/doubaoAsrClient.js` | 13068 B | ❌ 未移植（`volc.seedasr.auc` 的 submit/query 轮询客户端；与第45批 `doubaoRecordedAsrApi.js` 的 `volc.bigasr.auc_turbo` 是**两个不同资源**） |
| `mediaTasks/audioVoiceCloudAsr.js` | 1220 B | ❌ 未移植（依赖 `doubaoAsrClient` 的适配层） |
| `mediaTasks/audioVoiceAnalyzeTask.js` | 55206 B | ❌ 未移植（本地 funasr/sortformer 转写与分离的唯一入口，`python -m backend.services.*`；消费 `getFunasrModelRootDir`/`getSortformerModelRootDir`/`getPythonCertificateEnv`） |
| `mediaTasks/audioVoiceComposeTask.js` | 10778 B | ❌ 未移植 |
| `main.js` 的 `getFunasrModelRootDir()` / `getSortformerModelRootDir()` 消费点 | — | ❌ 未接线（第43批两个模型根解析器因此仍"生产零引用"） |
| 渲染器 `audioVoicePanel.js`(142 KB) / `audioVoiceAsrProviders.js` / `audioVoiceLocalAsrRuntime.js` | — | ❌ 未移植（含本批 GIF 的 UI 入口） |
| `runtime/ffmpeg/` 打包、`/api/v2/video-gif` 等后端路由 | — | ❌ 未做 |

---

## 7 · 约束复核

- 未触碰 `api/freeImageHostApi.js`（本批未改动该文件）。
- 未新增 npm 依赖（`videoToGifTask.js` 仅用 `node:fs`/`node:path`）。
- 未改 `MediaTaskQueue` 既有签名、未改授权检查、未改安装目录。
- 未联网、未启动应用、未执行真实 ffmpeg、未提交/推送。
