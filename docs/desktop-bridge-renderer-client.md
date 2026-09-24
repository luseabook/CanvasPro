# 第55批 · 渲染器侧桌面桥客户端链（`src/services/desktopBridge.js`）

> 第30–54批把宿主侧（`electron/`）的 82 条 `/api/v2/desktop/*` 路由与能力操作层补齐，但**渲染器侧没有任何消费者**：本仓渲染器走 `window.electronAPI`（preload），新版渲染器走 `src/services/desktopBridge.js`（HTTP 桥 shim）。本批把这条**客户端链**落地：`desktopBridge`（22 组能力对象 + `installDesktopBridgeCompat()`）、`chromeShellStartupReadiness`（chrome-shell 启动就绪上报）、`deferredMediaApi`（延迟素材预览）、`videoResultThumbnailApi`（视频结果首帧补全），并升级 `completionNotificationService` 为「桥优先」形态，最后在 `main.js` 接入**两条入口调用**与**一条点击回跳适配器**。
> 全部验证为**离线**：`node --check` + `node --test`。未联网、未启动应用、未在 chrome-shell 运行时内跑过。

---

## 1 · 缺口（第55批之前）

| # | 缺什么 | 依据 |
| --- | --- | --- |
| 1 | `src/services/desktopBridge.js` 整个模块 | 新版渲染器**所有**宿主能力都经此模块；本仓 `desktopBridge` = **0**（见 R02/R15 台账），渲染器只能直连 `window.electronAPI`，在 chrome-shell（外部浏览器）运行时下**完全无宿主能力** |
| 2 | `installDesktopBridgeCompat()` 的调用点 | 新版渲染器入口（`main.js`）在建 UI 前调用它，给 chrome-shell 注入 `window.aiCanvasDesktop`/`window.electronAPI` 两个 HTTP shim；本仓 `main.js` 无此调用 → 即便模块存在也**不会被安装** |
| 3 | `src/services/chromeShellStartupReadiness.js` 及其调用点 | 新版渲染器入口在启动末尾调用 `scheduleChromeShellStartupReady(...)`，让 chrome-shell 宿主知道渲染器已就绪；本仓无该模块、无调用 → 宿主只能盲等超时 |
| 4 | `api/deferredMediaApi.js` | 新版「房主在线时才取素材」的延迟素材预览；`desktopBridge.mediaPreview` 依赖它 |
| 5 | `api/videoResultThumbnailApi.js` | 新版「视频结果通知带首帧缩略图」的补全客户端；`completionNotificationService` 依赖它 |
| 6 | `completionNotificationService` 的桥形态 | 本仓版本只发 toast；新版经 `desktopBridge.notification.showGenerationComplete` 发**原生系统通知**、经 `desktopBridge.notificationSound.play` 发**系统提示音**、并订阅 `onGenerationCompleteClick` 做**点击回跳** |
| 7 | 点击回跳的渲染器侧落地 | 新版在 `completionNavigation.js` 里做「切画布→选中节点→聚焦」（多工作区形态）；本仓**无该模块**（`requestWorkspaceMode`/`replacement-studio` 多工作区体系未移植），故需**改写**为单工作区多画布形态，否则点击通知后无任何定位动作 |

---

## 2 · 本批交付

**新增 4 个源模块 + 升级 1 个源模块 + 修改 2 个接线文件 + 新增 4 个测试文件 + 升级 1 个测试文件**（零新增 npm 包；`desktopBridge` 只 `import` 本仓已有的 `api/apiBase.js`、`api/deferredMediaApi.js` 与同批的 `chromeShellStartupReadiness.js`）：

| 文件 | 变化 | 说明 |
| --- | --- | --- |
| `src/services/desktopBridge.js` | **新增** 1 165 行 / 52 617 B | `desktopBridge`（22 组能力对象 + 3 个 getter：`usesHttpCompat`/`isElectron`/`isChromeShell`）、`installDesktopBridgeCompat()`、`getDesktopBridge()`、`__desktopBridgeForTest` |
| `src/services/chromeShellStartupReadiness.js` | **新增** 167 行 / 6 515 B | `CHROME_SHELL_STARTUP_READY_EVENT`/`..._FAILED_EVENT`、两个 URL 参数常量、`isChromeShellRuntimeHref`、`isChromeShellStartupAttemptId`、`buildChromeShellStartupMetadataUrl`、`readChromeShellStartupMetadata`、`scheduleChromeShellStartupReady` |
| `api/deferredMediaApi.js` | **新增** 49 行 / 1 773 B | `deferredMediaPreview`、`withDeferredMediaFiles` |
| `api/videoResultThumbnailApi.js` | **新增** 105 行 / 4 140 B | `resolveVideoResultThumbnailSource`、`hasStableVideoResultThumbnail`、`needsVideoResultThumbnail`、`ensureVideoResultThumbnail` |
| `src/services/completionNotificationService.js` | 29 → **235 行** / 9 103 B | 由「只发 toast」升级为「toast + 原生通知 + 系统提示音 + 点击回跳订阅」；产出 `buildGenerationCompleteNotificationRequest` 等 |
| `main.js` | 3 处调用/导入 + 1 个适配器 | 见 §3 |
| `src/i18n/messages/{zh-CN,en-US}.js` | 各 +3 行 | 新增 `coreServices.completionNavigation.nodeMissing`（**两语言都新增**，本批作者撰写，非从新版逐字拷贝） |
| `src/services/desktopBridge.test.js` | **新增** 173 行 / 7 013 B / **6 项** | |
| `src/services/chromeShellStartupReadiness.test.js` | **新增** 206 行 / 7 690 B / **8 项** | |
| `api/deferredMediaApi.test.js` | **新增** 79 行 / 2 901 B / **5 项** | |
| `api/videoResultThumbnailApi.test.js` | **新增** 97 行 / 4 585 B / **6 项** | |
| `src/services/completionNotificationService.test.js` | 3 → **10 项**（203 行 / 8 342 B） | 原 3 项逐字保留 + 新 7 项 |

`desktopBridge` 的 **22 组**能力对象：`app`、`project`、`shell`、`mediaPreview`、`assetImport`、`dialog`、`webPreview`、`customAiApps`、`agentSkills`、`agentInformation`、`storageMigration`、`secureSettings`、`mediaTask`、`diagnostics`、`nodeExport`、`notification`、`screenshot`、`textPreset`、`notificationSound`、`localAssetCleanup`、`clipboard`、`canvasVisualSnapshot`。这 22 组与第30–42批补齐的 82 条宿主路由**一一对应**（客户端调用名 → `/api/v2/desktop/*` 路径）。

---

## 3 · 接线现状与可达性

这是本批**唯一有真实收益**的部分，且**修的是一个此前无人发现的入口缺口**：新版渲染器入口调用 `installDesktopBridgeCompat()` 与 `scheduleChromeShellStartupReady(...)`，而本仓 `main.js` **两个都没调**——两个模块虽然落地，却**生产不可达**。

三处 `main.js` 改动（对齐新版入口的相对位置）：

```js
// main.js:62-63（导入）
import { desktopBridge, installDesktopBridgeCompat } from './src/services/desktopBridge.js';
import { scheduleChromeShellStartupReady } from './src/services/chromeShellStartupReadiness.js';
```

```js
// main.js:141（紧随 initI18nDomBindings/initToastService，与新版同序：立即在 initDiagnosticsService() 之前）
  installDesktopBridgeCompat(),
  initDiagnosticsService(),
```

```js
// main.js:572（启动末尾；新版把它放在 rendererStartupState.settled.then 内，本仓无该状态机，故直接调用）
scheduleChromeShellStartupReady({ windowObject: window, diagnostics: desktopBridge['diagnostics'] });
```

**两条入口在本仓 Electron 渲染器下可证明是惰性的（no-op）**：

- `installDesktopBridgeCompat()` 的第一道守卫是 `if (!window || !desktopBridge.isChromeShell || window.electronAPI || window.aiCanvasDesktop) return false;`。本仓 `electron/preload.cjs` **同时**暴露 `window.electronAPI` 与 `window.aiCanvasDesktop`，故该函数**立即返回 `false`**，一个 shim 都不写。它只在 chrome-shell（外部浏览器 + 回环 origin + `aicRuntime=chrome-shell`）下才真正安装。
- `scheduleChromeShellStartupReady(...)` 先算 `readChromeShellStartupMetadata(location.href)`，**非**回环 `aicRuntime=chrome-shell` 的 href 一律返回 `null` → 函数返回 `null`，不装定时器、不发日志。本仓 Electron 渲染器 href 是 `file://`（打包后）或 `http://127.0.0.1:<dev>/`（无 `aicRuntime` 参数），两条都不匹配。

**渲染器侧点击回跳适配器**（本批作者撰写，非新版逐字拷贝）：新版点击回跳在 `completionNavigation.js`（多工作区 `requestWorkspaceMode`），本仓无该模块，故在 `main.js:486-510` 写了一个还原为本仓**单工作区多画布**形态的适配器：

```js
// main.js:486-510
function installCompletionNotificationBridge() {
  subscribeGenerationCompleteNotificationClicks(async (_0x39a4f2 = {}) => {
    const _0x1a2f6e = String(_0x39a4f2?.nodeId || '').trim();
    if (!_0x1a2f6e) return;
    // 在 CanvasTabManager 的所有画布中定位节点；<canvasId> 可缩小范围
    ...
    if (_0x5a6f5d.length !== 1) {                       // 0 个或多个 → 不猜
      window.showToast?.(mainText('completionNavigation.nodeMissing'), 'warn');
      return;
    }
    const _0x4c4aaf = _0x5a6f5d[0].id;
    if (_0x4c4aaf !== CanvasTabManager.getActiveCanvasId()) await CanvasTabManager.switchTo(_0x4c4aaf);
    if (CanvasTabManager.getActiveCanvasId() !== _0x4c4aaf) return;   // 切换未成功 → 放弃
    if (!graphStore.getState()?.nodes?.[_0x1a2f6e]) return;           // 切过去了但节点没了 → 放弃
    (graphStore.setSelectedNodes([_0x1a2f6e]), appViewport.focusNodes([_0x1a2f6e]));
  });
}
installCompletionNotificationBridge();   // main.js:510
```

该适配器用到的 `CanvasTabManager`（main.js:91 导入）、`graphStore`（main.js:1）、`appViewport`（main.js:233 构造）、`mainText`（main.js:280）**都已在调用点之前就绪**，`installCompletionNotificationBridge()` 在 main.js:510 顶层调用（紧随 main.js:485 的同类 `installGlobalScreenshotBridge()`）。

**`completionNotificationService` 的调用链是活的**：`src/core/generationTaskRuntime.js` 无参调用 `showGenerationCompleteNotification()`，因此 `main.js` → `completionNotificationService.js` → `desktopBridge.js`（→ `api/deferredMediaApi.js` + `chromeShellStartupReadiness.js`）与 → `api/videoResultThumbnailApi.js` 都是**生产可达**的。

---

## 4 · 已执行的验证（全部离线，本窗口实测）

| 命令 | 结果 |
| --- | --- |
| `node --check main.js` | 退出 0 |
| `node --check src/services/{desktopBridge,chromeShellStartupReadiness,completionNotificationService}.js` | 退出 0 |
| `node --check api/{deferredMediaApi,videoResultThumbnailApi}.js` | 退出 0 |
| `node --test src/services/{desktopBridge,chromeShellStartupReadiness,completionNotificationService}.test.js api/{deferredMediaApi,videoResultThumbnailApi}.test.js` | **35 / 35 / 0**（6+8+10+5+6） |
| `node --test $(find api -name '*.test.js')` | **457 / 457 / 0**（第54批 446/446/0，净增 **11** = 本批两个新 api 测试文件） |
| `node --test $(find src -name '*.test.js')` | **1 262 / 1 219 / 43**（本批首次记录该面基线） |
| `node --test $(find electron -name '*.test.js')` | **823 / 822 / 1**（第54批同值，本批未触碰 `electron/`） |
| `node .../prettier.cjs --check main.js` | `All matched files use Prettier code style!` |

- `api/**` 的 **457/457/0** 是**全绿**基线（第54批记录为 446/446/0）。
- `src/**` 的 **43 项失败已全部归因于同一个缺失夹具**：`tests/testPreviewDom.js` **在本仓不存在**（`ls tests/testPreviewDom.js` → No such file），而 **10 个既有测试文件**`import { createFakePreviewContainer, installPreviewDomStubs } from '.../tests/testPreviewDom.js'`（`AIGenAudioNode`、`AIGenVideoNode`、`aigenImage/taskOrchestrationModule`、`aigenText/taskOrchestrationModule`、`aigenText/uiModule`、`video-node/taskOrchestrationModule`、`loadingOverlay`、`previewMode`、`previewUploadEntry`、`previewUploadResult`）。该夹具**在 0.4.12 与 0.7.16 反混淆树中都不存在**，属**0.4.12 遗留缺口**，本批**不伪造**（另有 2 个文件只在注释里提到它，不构成 import）。本批新增的 `storyMediaBatchRecovery.test.js`/`StoryClipPreview.test.js` 的回归**独立于**该夹具。
- `electron/**` 的唯一失败仍是既有 `electron/fullProjectPackageService.test.js` 用例 `missing manifest coverage cannot bind to an existing unrelated local file`（归 R14 第17批），**未新增、未变化**。
- 快照 `0/58/332/0`（第54批为 `0/56/322/0`）：`modified` +2、`untracked` +10，其中 **9 项已逐一归因** = 4 个新源模块（本批的 `desktopBridge.js`/`chromeShellStartupReadiness.js`/`deferredMediaApi.js`/`videoResultThumbnailApi.js`）+ 4 个新测试文件 + 1 个专题文档（本文件）；**余 1 项未归因**，与第54批自身「新增 1 测试文件 + 1 专题文档却只记 +1」的记账口径一致。`modified` 的 +2 未逐一归因（未保存第54批 modified 名单），本批所改的已跟踪文件为 `main.js`、`completionNotificationService.js`、`completionNotificationService.test.js`、两份 i18n 与 3 份台账文档（后三者在批次前即属既有 modified 集合）。

**忠实性核对方法（工具化，非目测）**：`C:\Users\luobote\.qoder\tmp\deobf-tools\cmp-tokens.mjs` 把两文件归一（去注释、`['x']`→`.x`、`!![]`/`![]`→`true`/`false`、`0x..`→十进制、`_0x..`→`V`、`\x20`→空格）后**按 token 做最长公共子序列比对**：

| 文件 | port token | repo token | 匹配 | 仅在 port |
| --- | --- | --- | --- | --- |
| `src/services/desktopBridge.js` | 8 076 | 8 488 | **7 560** | 516 |
| `src/services/chromeShellStartupReadiness.js` | 1 094 | 1 114 | **1 063** | 31 |
| `src/services/completionNotificationService.js` | 1 630 | 1 668 | **1 570** | 60 |
| `api/videoResultThumbnailApi.js` | 683 | 703 | **668** | 15 |
| `api/deferredMediaApi.js` | 60 | 336 | **60** | **0** |

- `deferredMediaApi.js` **仅在 port 出现 0 token** = 对一份被压缩的源做了**完整覆盖**（repo 侧多出的 276 token 是本仓把它展开为可读多行 + 本仓既有的 `apiBase` 约定）。
- `desktopBridge.js` 的「仅在 port」516 token 与「仅在 repo」928 token **互为同一批字符串的重排**：所有 `/api/v2/desktop/*` 路由字面量**两份清单里都出现**，差异来自 (a) port 的 `return![]` 单行 vs prettier 拆成 `return`/`false` 两行，(b) 箭头函数/对象字面量被 prettier 折行的 `(`/`)`/`,` 残差，(c) 少数助手用语义名而非 `_0x` 名。**无一是缺失逻辑**。

---

## 5 · 本仓独有增量（**必须保留**，三份账目都不得删）

新版源码里**没有**以下 3 处，任何后续「按新版覆盖」都会把它们改坏：

| # | 本仓独有 | 作用 |
| --- | --- | --- |
| 1 | `main.js:486-510` 的 `installCompletionNotificationBridge()` | 新版点击回跳依赖未移植的 `completionNavigation.js`（多工作区 `requestWorkspaceMode`/`replacement-studio`）；本仓改写为「`CanvasTabManager.getMultiDataSnapshot` 定位 → 唯一命中才 `switchTo` → 复核活动画布 → 复核节点存在 → `setSelectedNodes`+`focusNodes`」，**0 或多个命中一律不猜**并提示 |
| 2 | `src/i18n/messages/{zh-CN,en-US}.js` 的 `completionNavigation.nodeMissing` | 上述适配器的提示文案，**两语言均为本批撰写**（新版对应文案在未移植的模块里） |
| 3 | `completionNotificationService` 的**播放/通知顺序**：浏览器 `Audio` 优先、原生 `notificationSound.play` 兜底 | 本仓渲染器走 preload（`window.electronAPI`），新版 chrome-shell 下是「原生优先」；本仓保留第34批已定的「浏览器优先」形态，避免重复播放 |

**零行为变更证明**：`installDesktopBridgeCompat()` 在本仓 Electron 渲染器下命中 `window.electronAPI` 守卫**立即 `return false`**（不写任何 shim）；`scheduleChromeShellStartupReady(...)` 因 `readChromeShellStartupMetadata` 返回 `null` 而**不装定时器、不发日志**；`installCompletionNotificationBridge()` 只在**收到桌面通知点击回调**时才动作，而本仓此前本来就**不订阅**点击事件（订阅前 `clickSubscribers` 为空集），故启动路径行为与升级前逐字相同。

---

## 6 · 验收欠项（仍未执行，须授权）

- **chrome-shell 运行时未移植（R15）**：`installDesktopBridgeCompat()` 的 **shim 安装分支**与 `scheduleChromeShellStartupReady` 的**就绪上报分支**在本仓**永远不可达**——它们服务的 `electron/chromeShell*` 簇、`chromeCdpPipeClient`、`chromeBrowserWorker`、`web-preview/*` 路由（R15）**仍未移植**。因此本批只是把**入口备好**，真实 chrome-shell 下 82 条桥路由的端到端行为**完全未验证**。
- **真实点击回跳**：未在应用内弹真实系统通知并点击；`CanvasTabManager.switchTo` 的异步切换失败分支、节点在切换期间被删分支均只由代码路径推演，**未跑过**。
- **真实视频首帧**：`ensureVideoResultThumbnail` 会退回到 `fetchVideoFirstFrameThumbFromServer`（真实后端），本批只注入 stub；真实服务端首帧生成**未验证**。
- **真实延迟素材**：`deferredMediaPreview` 指向 `/data/assets/_deferred/*` 与 `/data/assets/_hosted/*`，本批只验证「非该前缀→`null`」与解析器调用去重；真实房主上下线行为**未验证**。
- **`nodeExport`/`screenshot`/`textPreset`/`notificationSound` 的渲染器消费**：`desktopBridge` 已暴露这 22 组，但本仓渲染器**仍走 `window.electronAPI`**，故这些组在本仓**无生产调用点**（它们是 chrome-shell 备件）。
- `src/**` 的 43 项失败（缺失夹具 `tests/testPreviewDom.js`）**未修复**（0.4.12 遗留，非本批范围）。

---

## 7 · 剩余工作（不在本批）

- **R15（真正的归属批）**：`electron/chromeShell*` 8 个 + `chromeCdpPipeClient` + `chromeBrowserWorker` + `web-preview/*` 5 条路由——只有它们落地后，本批两个入口才**真正被行使**。
- R02 其余：`legacyStorageMigration.html` + `storage-migration/prepare()` 接线、`text-preset` 浮动捕获面板（`globalCaptureWindow*`）、`contextMenuShortcutCatalog.js`、`assetCapabilityOperations.js`、新时间线链（`timelinePlan.js`/`jianyingDraft.js`/`jianyingDraftLocation.js`）。
- R16 其余：渲染器 `audioVoicePanel.js`(142 KB)/`audioVoiceAsrProviders.js`/`audioVoiceLocalAsrRuntime.js` 与 5 个 funasr kind + `videoToGif`/`audioVoiceCompose`/`audioVoiceAnalyze` + 8 个本地 kind 的**渲染器调用点**、`/api/v2/video-gif`、`runtime/ffmpeg/` + `runtime/python/` 打包、渲染器 `VideoGifController.js`（41 KB）。
- **遗留夹具**：`tests/testPreviewDom.js`（0.4.12 遗留；10 个测试文件引用；反混淆树中不存在，**不得伪造**）。
- R01 验收（新增用例全量 + 7 个 Python 测试文件）仍需先列命令/依赖/耗时并**取得授权**。

---

## 8 · 约束复核

- 未改授权校验，未动安装版资源，未自动提交/推送，未触发发布；**未推送 `master`**（推送会触发 `mac-arm64-build.yml` 构建并 `gh release upload v0.4.12 --clobber`）。
- `api/freeImageHostApi.js` **未被触碰**（本批只改 `src/`、`api/` 新文件、`main.js` 与两份 i18n + 文档）。
- 未 `git reset --hard`/`git clean`/批量 checkout/整目录覆盖；未清理任何 untracked 交付物。
- **零新增 npm 依赖**；未把反混淆临时目录或绝对开发机路径写成运行依赖（比对脚本只存在于 `~/.qoder/tmp`，**不在仓内**）。
- 未运行测试套件以外的任何真实调用：无联网、无应用启动、无 Chrome/chrome-shell、无 ffmpeg、无厂商 AI 调用。
