# 第78批：媒体任务运行时装配层（`mediaTaskRuntime.js` + `main.js` 真实接线）

## 1. 本批要补的缺口

第77批 §补充建议里列出的「A 类最后一件」：`electron/mediaTaskRuntime.js`（端口源 474 行 / 19 065 B）是整个 `electron/` 顶层**唯一**其消费方在本仓是「真实存在的散落内联实现」的剩余模块。本仓 `main.js` 的 `getMediaTaskQueue()` 及其周边的 12 个内联函数（媒体任务队列装配、ffprobe 封装、播放代理、状态补丁、通知、活动上报、波形峰值）就是它的旧世代对应物。

本批同时补齐**第46–54批遗留的装配层缺口**：第46–54批把 `toolCapture`/`ffmpegVideoEncoderRuntime`/`videoPlaybackProxy`/`MediaTaskQueue`/`registerLocalMediaTaskHandlers`/`registerSharedMediaTaskHandlers` 逐个落地（并把 `runFfmpegTask` 注入 6 个消费点），但**「谁来装配这些件」**一直散落在 `main.js` 内联代码里；本批把装配职责交回端口模块，内联实现整体删除。

## 2. 交付物

| 文件 | 行数 / 字节 | 说明 |
| --- | --- | --- |
| `electron/mediaTaskRuntime.js` | 482 行 / 19 733 B | 端口源 474 行 / 19 065 B 的忠实移植（全语义命名 + 本仓 explicit-pair/括号调用风格）。导出 `buildMediaTaskStatePatch(update)` 与 `createMediaTaskRuntime({...22 个注入键})` → `{buildStatePatch, getActivity, getQueue, probeVideoPlaybackInfoForImport}` |
| `electron/mediaTaskRuntime.test.js` | 732 行 / 25 843 B | **33 项离线测试，首跑 29/33（4 项期望写错，已修正）→ 33/33 全绿** |

模块语义要点：
- `createMediaTaskRuntime` 的**全部协作者均可注入**：除 21 个宿主依赖外，`MediaTaskQueueCtor`/`registerLocalHandlers`/`registerSharedHandlers`/`configureFfmpegRuntime`/`runCapture`/`runFfmpegTask` 六个**件依赖**也可替换 ⇒ 这是第75–78批里**第二个可完全离线测量的宿主装配模块**（第一个是第77批 `localPreviewProtocolRuntime`）。
- 内部私有件（端口没有导出，本仓也未导出）：`requireFunction`、`parseFfprobeRatio`、`getMediaTaskDisplayName`（12 类）、`formatNotificationBody`（0xb4 / 0xb1）、`createOutputFilename`、`toOutputLocalPath`、`toAssetLocalPath`、`resolveLocalMediaSource`、`readFfprobeJson`（`runCapture` 路径）、`readQueuedFfprobeJson`（`queue.runProcess` 路径）、`ffprobeVideoMeta`、`ffprobeHasAudio`、`ffprobeVideoPlaybackInfo`、`buildVideoPlaybackInfo`、`probeVideoPlaybackInfoForImport`、`getVideoProxyPaths`、`runAssetVideoPlaybackProxy`、`ensureAssetVideoPlaybackProxy`、`buildWaveformJsonFromFloat32`、`handleTaskActivity`、`maybeNotifyLongMediaTask`、`handleTaskUpdate`、`getQueue`。
- 常量：`ASSET_IMPORT_FFPROBE_TIMEOUT_MS = 0x7530`、`LONG_MEDIA_TASK_NOTIFICATION_MS = 0x4e20`、`PERSON_REPLACEMENT_COMPOSE_TASK_PURPOSE = 'person-replacement-compose'`、`VIDEO_PROXY_TRANSCODE_PRESET = 'veryfast'`、`VIDEO_PROXY_TRANSCODE_CRF = '23'`（后两个由 `main.js` 内联常量移入模块）。

## 3. 接线状态（`main.js`，真实接线，经锚点脚本）

用 `C:\Users\luobote\.qoder\tmp\deobf-tools\b78-wire.mjs`（先备份 `main.before-b78.js`；9 处 cut + 5 处单行 edit + 1 处导入块替换，全部断言锚点唯一）执行：**删除 419 行、新增 62 行（净 −357 行）**。

删除（按脚本报告）：
- `getMediaTaskQueue()`（81 行）→ 替换为 60 行（见下）
- `ffprobeVideoMeta`/`ffprobeHasAudio`/`ffprobeVideoPlaybackInfo`/`ffprobeVideoPlaybackInfoForImport`/`getVideoProxyPaths`/`runAssetVideoPlaybackProxy`/`ensureAssetVideoPlaybackProxy`/`buildMediaTaskStatePatch`/`getMediaTaskDisplayName`/`formatNotificationBody`/`handleMediaTaskActivity`/`maybeNotifyLongMediaTask`/`sendMediaTaskUpdate`（303 行）
- `createOutputFilename`/`toOutputLocalPath`/`resolveMediaTaskSource`（16 行）
- `readFfprobeJsonCapture`（10 行）、`readFfprobeJson`+`parseFfprobeRatio`（含在 303 行内）
- 模块级状态 `mediaTaskQueue`(171)、`mediaTaskActivity`(177)、`notifiedMediaTaskIds`(194)、`videoPlaybackProxyWorkDeduper`(195)
- 模块级常量 `LONG_MEDIA_TASK_NOTIFICATION_MS`/`VIDEO_PROXY_TRANSCODE_PRESET`/`VIDEO_PROXY_TRANSCODE_CRF`(154–156)
- 孤儿导入：`ffmpegVideoEncoderRuntime`(56)、`registerShared/LocalMediaTaskHandlers`(66/67)、`videoPlaybackProxy` 6 符号整块、`node:fs` 的 `unlinkSync`

新增（`main.js:92`、`main.js:888–945`）：
```js
import { createMediaTaskRuntime } from './mediaTaskRuntime.js';

class MediaTaskQueueWithHistory extends MediaTaskQueue {
  constructor(options) {
    super({ ...options, onSnapshot: (snapshot, task) => getMediaTaskHistory().observe(snapshot, task) });
  }
}
const mediaTaskRuntime = createMediaTaskRuntime({ /* 21 个依赖键 + MediaTaskQueueCtor */ });
function getMediaTaskQueue() { return mediaTaskRuntime['getQueue'](); }
function getRuntimePythonCertificateEnv() { … }
function resolveMediaTaskFallbackPythonCommand() { … }
function resolveMediaTaskPythonCommand() { … }
```

调用点变更：`probeVideoPlaybackInfo` 注入由 `ffprobeVideoPlaybackInfoForImport`（`main.js:793`）改为 `mediaTaskRuntime['probeVideoPlaybackInfoForImport']`；`getMediaTaskQueue`(669/790) 与 `getMediaTaskHistory`(670) 注入点不变。模块加载期构造无 TDZ：21 个依赖中 `Notification`/`app`/`mainWindow` 均为惰性使用，两个 `resolve*Config` 用惰性箭头包裹（其 `const` 声明在 `main.js:1661/1667`，晚于构造点），三个 python 辅助用函数声明（提升）。

**保留为本仓独有、未随端口覆盖**：`MediaTaskQueueWithHistory` 的 `onSnapshot` 历史观察者（第54批增强，端口 `createMediaTaskRuntime` 不传 `onSnapshot`）；`getMediaTaskHistory()`/`mediaTaskHistory`/`MediaTaskHistoryStore` 因此仍是活代码（另有 `main.js:670` 消费方）；`main.js` 自己的 `toAssetLocalPath`(822, 转调 `assetCapabilityOperations`，另有 1329/1365 两个 ffmpeg 消费方)。

## 4. 行为差异（必须记账，均未真机验证）

1. **4 处 ffprobe 调用新增 30 000 ms 超时**：`ffprobeVideoMeta`/`ffprobeHasAudio`/`ffprobeVideoPlaybackInfo`（走 `queue.runProcess`）与 `probeVideoPlaybackInfoForImport`（走 `runCapture`）均带 `{timeoutMs: 0x7530}`；旧内联**无超时**。超时会终结原本可能长时间挂起的 ffprobe（对坏文件是改善，对超长素材是风险）。
2. **`getMediaTaskDisplayName` 由 11 类扩到 12 类**，新增 `videoAudioMux: '完整视频封装'`（旧内联缺该类 ⇒ 旧内联对 `videoAudioMux` 任务会显示兜底文案「媒体任务」）。
3. **长任务通知新增 `purpose === 'person-replacement-compose'` 跳过守卫**（旧内联没有 ⇒ 旧内联会给人物替换合成任务弹通知）。
4. **通知新增 `silent: kind === 'audioVoiceCompose'`**（旧内联没有 ⇒ 旧内联对语音工作室合成任务不静音）。
5. `Notification`/`isSupported` 由硬编码改为注入的 `NotificationCtor`（本仓传 Electron 全局 `Notification`，行为等价，但测试可注入替身）。
6. `handleTaskUpdate` 里资产补丁的 `status` 由旧内联的三元式恒 `'partial'` 改为字面量 `'partial'`（等价，仅去掉了无意义三元）。
7. 队列装配的 `onUpdate`/`onActivity` 语义不变，但 `handleTaskUpdate` 内 `maybeNotifyLongMediaTask` 与「推送给渲染器」的先后顺序保持不变（先通知、后推送）。
8. `buildStatePatch`（= `buildMediaTaskStatePatch`）与 `getActivity` 在本仓**仍为零消费方**（接线前后一致——模块导出不等于必须有消费方；本批**未**为它们伪造接线）。
9. `createOutputFilename`/`toOutputLocalPath`/`toAssetLocalPath`/`resolveMediaTaskSource` 在模块内有私有副本；`main.js` 侧仅保留仍有其它消费方的 `toAssetLocalPath`。两处实现逐字等价（见离线验证），但**同一逻辑在仓内出现两份**，是端口本来的形状（端口 `main.js` 不定义这些函数）。

## 5. 本批已执行的离线验证

- `node --test electron/mediaTaskRuntime.test.js` → **33/33 通过**（29 首跑通过，4 项为本批期望写错后修正：`createOutputFilename` 的双下划线、`nb_frames` 在复合参数串内、`buildWaveformJsonFromFloat32` 默认 190 桶、`resolveVideoPlaybackProxyTimeoutMs(600) = 7 200 000`）。
- `node --test $(find electron -name '*.test.js')` → **1 570 / 1 569 / 1**（第77批基线 1 537/1 536/1，**恰好 +33**）；唯一失败仍是既有 R14 第17批 `fullProjectPackageService.test.js` 的 `missing manifest coverage cannot bind to an existing unrelated local file`，与本批无关。
- `node --check electron/main.js`、`node --check electron/mediaTaskRuntime.js` → exit 0。
- `prettier --check` → `electron/mediaTaskRuntime.js`、`electron/mediaTaskRuntime.test.js`、`electron/main.js` 三件全过（测试文件首跑即过）。
- 忠实性：`litdiff2.mjs` → `portLits=330 repoLits=330 uniquePort=158 uniqueRepo=158 onlyPort(0)=[] onlyRepo(0)=[]`，**字面量逐字一致**；`cmp-tokens.mjs` → port 3 152 / repo 3 157 / matched 2 699，ONLY IN PORT 的 453 个 token **全部是 `V`（被归一化的标识符）**，ONLY IN REPO 为对应语义名，**无字面量或关键字缺失**。
- 接线残留：对 20 个被删符号名（`ffprobeVideoMeta`/`ffprobeHasAudio`/`parseFfprobeRatio`/`readFfprobeJson(Capture)`/`ensureAssetVideoPlaybackProxy`/`buildMediaTaskStatePatch`/`getMediaTaskDisplayName`/`formatNotificationBody`/`handleMediaTaskActivity`/`maybeNotifyLongMediaTask`/`sendMediaTaskUpdate`/`getVideoProxyPaths`/`runAssetVideoPlaybackProxy`/`createOutputFilename`/`toOutputLocalPath`/`resolveMediaTaskSource`/`ffprobeVideoPlaybackInfoForImport`/`videoPlaybackProxyWorkDeduper`/`notifiedMediaTaskIds`/`mediaTaskActivity` + 4 个导入名）在 `main.js` 内 grep → **0 命中**。
- 快照：`staged=0 modified=67 untracked=452 conflicts=0`（第77批台账 `0/67/450/0`，+2 = 本批 1 源码 + 1 测试）；`api/freeImageHostApi.js` md5 = `1e0458013f5341c99f21faefc1d34d3f` **未变**。
- 测试**未联网、未跑 Electron、未起服务、未打开真实窗口、未写任何仓库内文件**：`MediaTaskQueueCtor`/`registerLocalHandlers`/`registerSharedHandlers`/`configureFfmpegRuntime`/`runCapture`/`runFfmpegTask`/`NotificationCtor` 全为替身；真实 fs 只在 `mkdtempSync` 临时目录内创建/读取代理文件（含 `.tmp.mp4` 清理断言）。

## 6. 未执行的验收项（不得当已通过）

- 真实 Electron 启动、真实 `ffmpeg`/`ffprobe` 子进程、真实 `Notification` 弹出/点击、真实队列并发与取消。
- 第4节 1–4 项行为差异的实际影响（尤其「新增 30 000 ms 超时是否误杀超长素材的 ffprobe」与「人物替换合成任务不再弹通知」是否符合预期）。
- `main.js` 改动**未经任何测试覆盖**（未写接线静态断言测试，第71批 `captureChainWiring.test.js` 之先例未复用）。
- 本批**未**把 `getMediaTaskQueue` 交给 `desktopHttpBridge` 的媒体任务路由做端到端核对（第54批已核对 `cancel(onlyIfWaiting)`）。

## 7. 约束复核

- `api/freeImageHostApi.js` 未触碰（md5 复核）。
- 未提交、未推送、未触发任何 CI/发布；未运行真实服务/未产生费用。
- 未删除仍未消费的既有导出、未伪造消费方、未改动 `src/i18n/messages/*`、未新增 npm 依赖、未把临时目录或绝对开发机路径写入运行时依赖。
- 回滚点：`C:\Users\luobote\.qoder\tmp\deobf-tools\main.before-b78.js`（`main.js` 接线前全文备份）。

## 8. 下一批建议

- **A（低风险、纯新增、无需额外授权）**：`electron/` 顶层仅端口存在的文件由 9 降至 **8** 件，剩余为 `dialogPresenter.js`(331 B)、`dialogPresenterCore.js`(3 667 B)、`nativeContextMenuIcons.js`(2 058 B)、`diagnosticsEvidence.js`(2 058 B)、`diagnosticsLaunchVersion.js`(1 307 B)、以及本轮新侦察项。其中 `diagnosticsEvidence`/`diagnosticsLaunchVersion` 的消费方是在用的 `electron/diagnostics.js`（本仓 268 行 vs 端口 663 行），属**升代**且端口版还引用本仓不存在的 `src/utils/diagnosticError.js` ⇒ 须单独成批并先补依赖。**（第79批已完成：`diagnostics.js` 升到 663 行 / 27 495 B，三件缺失依赖全部落地，57 项离线测试通过，`main.js` 零改动；详见 `docs/diagnostics-generation.md`。）**
- **B（需真实运行授权）**：按第6节逐项验收本批 + 第75–77批遗留差异；补 `main.js` 接线的静态断言测试。
- **C（需真实运行授权）**：第75批遗留后端 spawn 站点切换到 `resolveBackendLaunchSpec`；`main.js` 的 chrome-shell 最终装配（13 个依赖模块已落地）。
- **仍欠（不变）**：`src/core/rendererPanPreviewReconcile.js`（11 189 B，须与其 3 个依赖成组移植）；第74批 `b74-scan.mjs` 判定的 481 条「无级联」渲染器池；`web-preview/*` 5 条路由的渲染器侧消费点；`storage-migration/prepare`；44 个未移植 CSS 自定义属性。
