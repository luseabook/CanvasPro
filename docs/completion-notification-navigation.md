# 完成通知点击回跳与 Alt+E 全局快捷键（第36批，R17）

对应交接台账 **R17**（快捷键加速器 / 通知）与 **R02**（`/api/v2/desktop/notification/*` 四条路由）。

## 1. 本批要解决的缺口

第30批声明了四条 `/api/v2/desktop/notification/*` 桥路由，第30批起也一直把 `getBackgroundCompletionNotifier` 放进主窗口上下文（`mainIpcSetup.js`）并注册了 `notification:showGenerationComplete` IPC；但本仓的 `electron/backgroundCompletionNotification.js` 是 0.4.12 早期最简版，**只导出 `showGenerationComplete`**，因此：

- `/notification/consume-generation-complete-clicks`、`/notification/update-global-shortcut`、`/notification/acknowledge` 三条路由调用的是 `undefined`，实际一直空转；
- 完成通知只能弹一次、点击仅聚焦主窗口，**没有"通知 → 回跳到对应画布节点/工作室步骤"的导航**，也没有"任务完成后按 Alt+E 召回最近一条"的全局快捷键；
- 渲染器侧无 `notification.acknowledge` / `notification.onGenerationCompleteClick` 可用。

与第34批 `diagnosticsCapabilityOperations`、第35批 `screenshotOverlayController` 同属"已声明路由/已存在控制器但从未被真正接线"的模式。

## 2. 交付文件

| 文件 | 性质 | 作用 |
| --- | --- | --- |
| `electron/contextMenuShortcutAccelerators.js` | 新增（零 import 纯函数） | `normalizeContextMenuAccelerator(value)`：接受修饰键别名 `ctrl/control/meta/cmd/command/cmdOrCtrl/cmdOrControl→CommandOrControl`、`alt/option`、`space`、`f1..f24`、单字母数字（大写）、`enter/return/esc/arrow*/标点` 别名；修饰键顺序固定 `CommandOrControl→Shift→Alt`；最多 4 键、必须恰有一个主键；否则返回 `''`。**sha256** `61b65e92…373dd` |
| `electron/notificationShortcutController.js` | 新增 | `createNotificationShortcutController({ globalShortcutApi, activate })`：默认 `Alt+E`；同键早返回；换键先 `unregister` 旧键再 `register` 新键；非法组合返回 `{success:false,reason:'invalid-shortcut'}`；注册被拒/抛错返回 `{success:false,reason:'shortcut-unavailable'}`；空数组表示取消注册；`dispose()` 幂等注销。**sha256** `20aa3cf2…0e9a` |
| `electron/completionNotificationNavigation.js` | 新增（零 import 纯函数） | `createCompletionNotificationNavigation({ focusMainWindow, onClick, logEvent })`：`remember` 记一条待处理导航（上限 40，溢出时结算最旧并调用其 `release(true)`）；`activate`/`activateLatest` 结算并**恰好一次** `release`、异步聚焦主窗口（返回 `false` 记 `notification.generation_complete_focus_failed`）、`onClick` 发事件并入上限 40 的点击事件队列；`acknowledge` 按 `notificationId` 结算；`consumeClickEvents` 取走即清；`dispose` 全结算并清队列。**sha256** `59d4d731…acea` |
| `electron/backgroundCompletionNotification.js` | 重写 | 完整移植：注入 `globalShortcutApi`/`onClick`/`logEvent`/`resolveNotificationIconPath`/`platform`/`setTimeoutFn`/`clearTimeoutFn`；新增 `updateGlobalShortcut`/`acknowledge`/`activateLatest`/`consumeClickEvents`/`dispose`；窗口聚焦时跳过、`Notification.isSupported()` 为假时跳过、win32 生成 `toastXml`（`duration="long"` + 静音）、图标经 `resolveNotificationIconPath` 解析且只接受图片扩展名、`show` 后 10s 自动关闭、`failed` 事件记 `notification.generation_complete_failed` 并 `console.warn`。**sha256** `d7e5b36d…b10a` |
| `electron/ipc/appIpc.js` | 修改 | 新增 `notification:updateGlobalShortcut`、`notification:acknowledge` 两个 IPC 适配器（沿用 `showGenerationComplete` 的"控制器缺失即返回 undefined"风格） |
| `electron/main.js` | 修改 | electron 导入补 `globalShortcut`；`createBackgroundCompletionNotifier` 传入 `globalShortcutApi`/`onClick`（向主窗口发 `notification:generationCompleteClicked`）/`logEvent: logDiagnosticEvent`/`resolveNotificationIconPath: resolveLocalVirtualPath`；`will-quit` 追加 `backgroundCompletionNotifier.dispose()` |
| `electron/preload.cjs` | 修改 | `notification` 能力补 `updateGlobalShortcut`、`acknowledge`、`onGenerationCompleteClick`（沿用 `webPreview:event` 的监听/退订写法） |
| `electron/ipc/mainIpcSetup.test.js` | 修改 | 追加 4 条 `notification/*` 路由存在性断言，并新增 1 项走桥测试（见第 3 节） |
| 4 个测试文件 | 新增 | `contextMenuShortcutAccelerators.test.js`(4)、`notificationShortcutController.test.js`(6)、`completionNotificationNavigation.test.js`(8)、`backgroundCompletionNotification.test.js`(11) |

**未移植（有意）**：新版 `contextMenuShortcutAccelerators.js` 另一个导出 `normalizeWebPreviewContextMenuShortcuts` 依赖 `src/utils/contextMenuShortcutCatalog.js`（含 `SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED` 与 30+ 条右键菜单项）与 `context-web-*` 动作集，属未移植的 **R22 右键菜单 UI** 与 **R15 网页预览**；本批只移植与快捷键解析直接相关、可离线验证的 `normalizeContextMenuAccelerator`，不引入无消费方的 10KB 目录常量。

## 3. 已执行的离线验证

```
node --check electron/contextMenuShortcutAccelerators.js electron/notificationShortcutController.js \
  electron/completionNotificationNavigation.js electron/backgroundCompletionNotification.js \
  electron/ipc/appIpc.js electron/ipc/mainIpcSetup.test.js electron/main.js electron/preload.cjs

node --test electron/contextMenuShortcutAccelerators.test.js electron/notificationShortcutController.test.js \
  electron/completionNotificationNavigation.test.js electron/backgroundCompletionNotification.test.js \
  electron/ipc/mainIpcSetup.test.js
```

- `node --check`：8 个文件全部退出 0；5 个相关相对导入目标存在。
- 新增测试 **29 项全部通过**：`contextMenuShortcutAccelerators` 4 + `notificationShortcutController` 6 + `completionNotificationNavigation` 8 + `backgroundCompletionNotification` 11。
- `mainIpcSetup.test.js` 新增 1 项**通过**：用**真实的** `createBackgroundCompletionNotifier`（stub `globalShortcutApi`/stub `Notification`/窗口处于聚焦）走桥验证——`notification/update-global-shortcut` 返回 `{success:true,accelerator:'Alt+E'}` 且底层收到 `register('Alt+E')`、`notification/acknowledge` 对不存在的 id 返回 `{success:true}`、`consume-generation-complete-clicks` 返回 `[]`、`show-generation-complete` 在窗口聚焦时返回 `{success:true,shown:false,reason:'window-focused'}`。
- `electron/**` 离线测试合计 **276 项 / 275 通过 / 1 失败**（较第35批 +30）。唯一失败仍是既有的 `electron/fullProjectPackageService.test.js`（`missing manifest coverage cannot bind to an existing unrelated local file`），属 R14 第17批既有断言问题，与本批无关。

**测试用桩说明（不得当成真实行为）**：`backgroundCompletionNotification.test.js` 用 stub `Notification` 类捕获构造参数与事件，未创建真实系统通知；`setTimeoutFn`/`clearTimeoutFn` 为桩，未等待真实 10s；`notificationShortcutController.test.js` 用 stub `globalShortcutApi`，**未向操作系统注册任何热键**；未在真实应用内弹通知、点击或按 Alt+E。

## 4. 安全与行为边界

- 通知点击只向**主窗口** `webContents.send('notification:generationCompleteClicked', event)`；窗口已销毁时静默不发。
- `resolveNotificationIconPath` 复用既有 `resolveLocalVirtualPath`（虚拟路径白名单），且图标路径必须匹配图片扩展名，否则忽略。
- 通知内容经 `normalizeText`（折叠空白、截断 title 80 / body 180）与 `escapeToastXml`（`& < > " '` 转义）处理后才进入 win32 `toastXml`，避免 XML 注入。
- 全局快捷键只注册**一个**加速器（默认 `Alt+E`）；换键与 `dispose()` 都会先注销旧键，避免残留。快捷键缺失时返回结构化失败而非抛错。
- 点击事件队列与待处理导航各有 **40** 条上限，避免无界增长。

## 5. 验收欠项（须授权后执行）

- [ ] 真实应用内：生成任务完成且主窗口未聚焦时**真的弹出系统通知**（Windows 上核对 `toastXml` 长时停留与静音）、点击通知**真的回到对应画布节点/工作室步骤**并聚焦主窗口。
- [ ] 真实按 **Alt+E** 召回最近一条完成通知；换成别的组合后**旧键确实失效**；`notification/update-global-shortcut` 与 `notification/acknowledge` 经渲染进程的端到端返回。
- [ ] 通知点击后渲染器 `onGenerationCompleteClick` 订阅者收到事件（本仓渲染器 `src/services/completionNotificationService.js` 仍是最简版，**未**接订阅与导航消费）。
- [ ] `dispose()` 在真实 `will-quit` 时确实释放全局快捷键、关闭未关闭的通知窗口。

## 6. 已知未完成

- 渲染器侧未移植：新版的 `completionNotificationService.js`（`subscribeGenerationCompleteNotificationClicks`、`buildGenerationCompleteNotificationRequest`、`showTaskStatusNotification`、缩略图/导航构造）依赖未移植的 `src/services/desktopBridge.js` 与 `api/videoResultThumbnailApi.js`，本批只补宿主侧，**渲染器仍是"弹出即结束"**。
- `normalizeWebPreviewContextMenuShortcuts` 与 `src/utils/contextMenuShortcutCatalog.js` 未移植（见第 2 节），归 R22/R15。
- 新版在 http-shim 运行时用 `desktopBridge.notification.isAvailable()` 判可用性；本仓渲染器走 `window.electronAPI`，此差异沿用既有约定，未改。
