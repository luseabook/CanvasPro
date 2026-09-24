# 全局划词/文本预设捕获链（R02 第41批）

本文对应交接台账 R02（`text-preset/update-global-shortcut|consume-events|claim-event|acknowledge-event|get-global-shortcut-status` 五条路由），记录第41批交付。**结论先行：五条路由首次由真实控制器产出（不再是 `undefined` 兜底），划词捕获的宿主侧链路（事件投递/认领/确认、原生 hook 与 Windows PowerShell 回退、全局快捷键注册与状态广播）已完整落地并有离线测试；但浮层捕获面板（`globalCaptureWindow*`）、`selection-hook` 原生模块的依赖声明、以及"启动即注册 `Alt+C`"**有意未接线**，故本批是"宿主链完整 + 面板与启动注册待接"，不是"新版划词功能已全量可运行"。**

## 1. 缺口（第41批之前）

- `electron/desktopHttpBridge.js` 自第30批声明这五条路由；`mainIpcSetup` 从未产出 `configureGlobalTextPresetShortcut`/`consumeGlobalTextPresetEvents`/`claimGlobalTextPresetEvent`/`acknowledgeGlobalTextPresetEvent`/`getGlobalTextPresetShortcutStatus` 任一键，五条路由**恒为兜底值**（`update-global-shortcut` 得 `undefined`、`consume-events` 得 `[]`、`claim/acknowledge` 得 `{ ok: false }`、`get-global-shortcut-status` 得 `null`）。
- 这是同一缺陷模式的**第八次命中**：桥与 IPC 都声明了入口，但底层控制器从未存在。第34–41批依次补上 `diagnosticsCapabilityOperations`、`screenshotOverlayController`、`backgroundCompletionNotification`、`node-export/*`、`storage-migration/*`、`saveTimeline`（横跨两层）、`consumeAssetUpdateEvents`+`getDataDir`、本批五键。
- 新版实现分散在 `selectedTextCapture.js`（原生 hook + PowerShell 回退）、`globalTextPresetShortcutController.js`（快捷键绑定/捕获/投递/状态）、`globalCaptureDelivery.js`（有界事件邮箱）、`globalCaptureControllers.js`（编排）、`globalCaptureWindow*.js`（浮层面板）与 `ipc/textPresetIpc.js`（IPC 注册）。

## 2. 本批交付

| 文件 | 作用 |
| --- | --- |
| `electron/globalCaptureDelivery.js`（新，**零 import**） | 有界"捕获邮箱"：`createGlobalCaptureDelivery({ capacity = 12, timeoutMs = 15000, setTimeoutFn, clearTimeoutFn })`。`enqueue(event, { signal })` 先查容量（满 → `capture-queue-full`/`retryable:true`）、再查重复 `eventId`，写入 `expiresAt = now + timeoutMs` 并返回 `{ ok: true, completion }`；`claim({ eventId, receiverId })` / `acknowledge({ eventId, receiverId, ok, reason, retryable })` 按 `receiverId` 配对结算；`consumeEvents()` 是**非破坏性 peek**（返回事件副本，不删除）；超时按"是否已被认领"决定 `retryable`；`destroy()` 用 `capture-controller-destroyed` 结算全部在途 |
| `electron/selectedTextCapture.js`（新，仅 import `node:child_process` 等） | `createSelectedTextCaptureController({ platform, spawnProcess, loadSelectionHook, startupTimeoutMs = 3500, timeoutMs = 2500, windowsCopyStrategies, onKeyReleased })` → `{ capture, prewarm, destroy, isKeyReleaseTrackingAvailable }`。原生优先（`getCurrentSelection()`，空白即 `no-selection`）；非 Windows 走 hook 直读，Windows 走 hook → PowerShell worker 回退。另导出 `WINDOWS_CAPTURE_WORKER_SCRIPT`（内嵌 C# `SendInput` 辅助类的 PowerShell 脚本，**与新版逐字节一致，4392 字符**）、`resolveWindowsCaptureWorkerCommand()`、`mapWindowsWorkerStatus`、`WINDOWS_COPY_STRATEGIES = ['INPUT','SENDKEYS']`、`shouldRetryWindowsCopy`、`copySelectedTextToClipboard` |
| `electron/globalTextPresetShortcutController.js`（新，**零 electron import**） | `createGlobalTextPresetShortcutController({ accelerator = 'Alt+C', clipboardApi, globalShortcutApi, copySelectedText, focusCanvas, getMainWindow, showCapturePanel, hideCapturePanel, isCapturePanelVisible, logDiagnosticEvent, delivery, hasKeyReleaseTracking })`。两条快捷方式（`global-capture-launcher`、`global-text-preset`），5 个动作（`source-text`/`ai-text`/`ai-image`/`ai-video`/`preset-draft`）；返回 `configureGlobalShortcut`/`getShortcutStatus`/`sendShortcutStatus`/`installGlobalShortcut`/`uninstallGlobalShortcut`/`consumeEvents`/`claimEvent`/`acknowledgeEvent`/`dispatchCaptureAction`/`releaseShortcutKey`/`destroy` |
| `electron/ipc/textPresetIpc.js`（新） | 注册 8 个 IPC 通道并做 `typeof !== 'function'` → `{ ok: false, reason: 'not-supported' }` 守卫 |
| `electron/main.js`（改） | `GLOBAL_CAPTURE_LAUNCHER_ACCELERATOR = 'Alt+C'`；构造 `selectedTextCaptureController`（`onKeyReleased` 回灌控制器）与 `globalTextPresetShortcutController`；IPC context 增 `globalTextPresetShortcutController`；`did-finish-load` 广播一次快捷键状态；`will-quit` 调 `destroy()` 与 `selectedTextCaptureController.destroy()` |
| `electron/ipc/mainIpcSetup.js`（改） | 解构 `globalTextPresetShortcutController`，扁平对象补 5 个 pass-through 键（`configureGlobalShortcut`/`consumeEvents`/`claimEvent`/`acknowledgeEvent`/`getShortcutStatus`），与新版 `npm` 同名键形状一致 |
| `electron/ipc/registerIpcHandlers.js`（改） | import 并调用 `registerTextPresetIpcHandlers(_0x14a149)` |
| `electron/preload.cjs`（改） | `electronAPI.textPreset`：`claimEvent`/`acknowledgeEvent`/`updateGlobalShortcut`/`onSelectedText`（订阅 `textPreset:selectedTextReady` **并**每 150ms 轮询 `textPreset:consumeEvents`，`unref` 定时器）/`onGlobalShortcutStatus` |
| 测试 | `globalCaptureDelivery.test.js` 10 项、`globalTextPresetShortcutController.test.js` 24 项、`selectedTextCapture.test.js` 17 项、`ipc/textPresetIpc.test.js` 5 项、`ipc/mainIpcSetup.test.js` +1 项真实走桥 |

### 行为要点

- **事件邮箱是 peek 不是 drain**：`consumeEvents()` 返回副本供渲染器预览，真正的移除发生在 `claim` + `acknowledge`；这与第40批 `assetUpdateEventBuffer`（取走即清）**不同**，因为划词事件需要"先展示再决定采纳"。
- **`claim` 抢单**：同一 `eventId` 只有一个 `receiverId` 能认领成功，其余得 `{ ok: false }`；超时结算的 `retryable` 取决于是否已被认领（无人认领才可重试）。
- **Windows 键盘过滤**：`key-up` 回调里 `platform === 'win32' && flags & 0x10` 的事件被丢弃（0x10 = `KEYEVENTF_KEYUP`，即真实"抬起"才通知释放），非 Windows 不过滤——因为 `selection-hook` 仅在 Windows 提供该标志。此点已有测试分别覆盖两平台。
- **Windows 复制重试**：`INPUT` 失败且状态为 `NO_SELECTION`/`SEND_FAILED`/`FAILED` 时换下一策略（`INPUT` → `SENDKEYS`）；`KEYS_HELD` 不重试（用户还按着快捷键，重试无意义）；策略耗尽后原样上报 worker 状态，不伪造成功。
- **启动超时 vs 复制超时**：worker 未在 `startupTimeoutMs` 内输出 `READY` → `copy-worker-startup-timeout`；已 READY 后 `COPY` 无响应 → `copy-command-timeout`；两者都 kill 子进程。
- **降级诚实**：未接面板时 launcher 捕获返回 `{ ok: false, reason: 'panel-unavailable' }`，不静默改剪贴板；无文本返回 `no-selected-text`；捕获抛错返回 `capture-failed`。
- **状态广播**：`sendShortcutStatus` 向 `getMainWindow()` 发 `textPreset:globalShortcutStatus`（含 `updatedAt`）；`textPreset:` 与既有 `screenshot:` 通道分离，互不覆盖。

### 与新版的有意差异（未移植）

- **浮层捕获面板未移植**：新版 `globalCaptureWindowController.js` + `globalCaptureWindow.js` + `globalCaptureWindowPreload.cjs` + 渲染器 `src/modules/.../globalCaptureWindow.js`（依赖 `contextMenuIcons.js`、`workspaceHorizontalWheel.js` 与面板 HTML/CSS）属**跨主进程/渲染器两层**，归 R15。因此 `showCapturePanel`/`hideCapturePanel`/`isCapturePanelVisible` 三个注入项本批不传，launcher 捕获落到 `panel-unavailable`。
- **`selection-hook` 原生模块未声明依赖**：本仓不引入该 npm 原生模块（不可离线移植、无预编译产物）；`selectedTextCapture` 通过注入 `loadSelectionHook` 支持它，未注入时加载失败即回退 PowerShell worker（Windows）或 `native-selection-unavailable`（其它平台）。
- **不移植 `globalCaptureControllers.js` 编排**、**不移植新版 `src/services/desktopBridge.js`**（R15）。
- **启动注册有意未接线**：新版在 `installGlobalShortcut()` 里**无条件**注册 `Alt+C`，并在 `will-quit` 注销。本批**只接线构造与销毁**，不调 `installGlobalShortcut()`——因为面板未移植时 `Alt+C` 会抢走系统热键却只得到 `panel-unavailable`。渲染器可随时经 `textPreset:updateGlobalShortcut`（或桥 `text-preset/update-global-shortcut`）显式注册，即为一行式再启用路径（同样先例见第38批 `storage-migration/prepare()`）。
- **`prewarm` 未在启动调用**：新版编排层开机预热原生 hook 与 worker 以消除首用延迟；面板未接时预热只会在 Windows 上凭空起一个 PowerShell 进程，故不接。

## 3. 安全边界

- 新模块不新增文件系统写入、不发起网络请求；PowerShell worker 仅以 `-NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command <内嵌脚本>` 启动固定脚本，不接收渲染器传入的命令文本。
- 剪贴板只在"原生读取成功但文本为空/失败"的降级路径被写入（`copySelectedTextToClipboard`），且注释掉任何渲染器可控的路径写入。
- IPC 四条 `textPreset:*` 通道与四条 `globalCaptureWindow:*` 通道都保留 `typeof` 守卫；`globalCaptureWindow:*` 通道当前**未接线**故恒返回 `not-supported`，一旦接入也不会放宽 sender 校验（本批未加 `assertNodeExportSender`，与新版一致——面板窗口是自己的 sender）。
- 桥的 token/回环/POST-only 约束不变。

## 4. 已执行的验证（离线）

命令：

```
node --check electron/globalCaptureDelivery.js electron/selectedTextCapture.js \
  electron/globalTextPresetShortcutController.js electron/ipc/textPresetIpc.js \
  electron/main.js electron/ipc/mainIpcSetup.js electron/ipc/registerIpcHandlers.js \
  electron/preload.cjs

node --test electron/globalCaptureDelivery.test.js electron/selectedTextCapture.test.js \
  electron/globalTextPresetShortcutController.test.js electron/ipc/textPresetIpc.test.js \
  electron/ipc/mainIpcSetup.test.js
node --test $(find electron -name '*.test.js')
```

结果：`node --check` 八个文件全部退出 0；本批新增测试 **57 项全部通过**（10 + 24 + 17 + 5 + 1）；`electron/**` 合计 **382 项 / 381 通过 / 1 失败**（较第40批 +57）。唯一失败是既有 `electron/fullProjectPackageService.test.js`（归 R14 第17批），与本次改动无关。

覆盖点（摘要）：

- 邮箱：peek 语义、副本隔离、`claim`/`acknowledge` 矩阵、`retryable` 标志、容量与重复的判定顺序、`AbortSignal` 取消、超时、`destroy`、定时器清理。
- 原生读取：不支持平台、macOS 直读、细调列表仅 Windows 生效、空白/缺失选择、抛错后清理可重试、`start` 失败/加载失败闩锁 `native-selection-unavailable`。
- worker：`READY`→`COPY:1:INPUT`→`RESULT:1:OK`、半行重组、`NO_SELECTION` 换策略、`KEYS_HELD` 不重试、策略耗尽、复制超时 kill、启动超时、`spawn` 抛错/提前退出、`prewarm` 矩阵、`destroy` 幂等。
- 控制器：键名归一化（含 `meta`/`cmd` 丢弃、`Alt+Plus`）、默认状态、`configure` 前置/后置、注册失败诊断 `global_capture.shortcut_register_failed`、面板不可用/无选中/空白/抛错路径、`preset-draft` 投递与 claim/ack 结算、按释放键、`destroy`、非法动作、窗口缺失/已销毁、状态广播。
- IPC：8 通道注册、委派、未接线 `not-supported`、面板通道转发 sender。

## 5. 验收欠项（须授权后执行）

- [ ] 真实应用内按 `Alt+C`（需先经 `textPreset:updateGlobalShortcut` 注册）确认状态广播与诊断记录。
- [ ] Windows 真机上确认 PowerShell worker 能真正读出选中文本（`SendInput`/`SendKeys` 两条策略各自的成功率）。
- [ ] 确认 `key-up` 的 `flags & 0x10` 过滤在真实 `selection-hook` 下不会漏掉有效释放。
- [ ] 接入面板后（R15）验证 launcher 捕获的完整链路与 `preset-draft` 草稿落地。
- [ ] 验证 `onSelectedText` 的"订阅 + 150ms 轮询"双通道**不重复投递**同一事件（`claim` 抢单应保证只结算一次，需真机确认）。

## 6. 已知未完成（不计入本批）

- **浮层捕获面板**：`globalCaptureWindow*.js`（主进程 + 渲染器 + preload + HTML/CSS），归 R15。
- **`selection-hook` 原生模块**：本仓不引入，无预编译产物。
- **启动注册与预热**：`installGlobalShortcut()`/`prewarm()` 有意未接线（见 §2）。
- **仍缺的 R02 项**：`assetCapabilityOperations.js` 其余约 21 KB 及六个依赖、`contextMenuShortcutCatalog.js` + `normalizeWebPreviewContextMenuShortcuts`、新版渲染器 `completionNotificationService.js`/`desktopBridge.js`、`electron/legacyStorageMigration.html`、新版时间线链 `timelinePlan.js`/`jianyingDraft.js`/`jianyingDraftLocation.js`/`toolCapture.js`。
- 未做真实桌面联调，未跑构建/打包，未在 Windows 真机执行划词捕获。
