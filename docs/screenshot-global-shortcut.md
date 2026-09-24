# 全局截图快捷键与截图事件队列（R02/R17）— 移植说明与验收欠项

本文对应交接台账的 R17（桌面快捷键/截图）与 R02（桌面 HTTP 桥）第三十五批交付。**结论先行：宿主侧的"可配置全局截图快捷键 + 截图事件队列"已按可读源码移植并接入主窗口 IPC、preload 与桥路由，11 项新增离线测试已执行通过（另 1 项接入断言并入既有文件）；但真实按键注册、真实截屏落剪贴板、桥的端到端调用均未运行，渲染器侧只补了设置保存后的同步调用，未做真实编辑 UI 联调。**

## 1. 缺口是什么

0.4.12 的 `electron/screenshotOverlayController.js` 只有 7 个导出（`captureDesktopDisplay`/`destroyScreenshotOverlayWindow`/`handleScreenshotOverlayCancel`/`handleScreenshotOverlayConfirm`/`installGlobalScreenshotShortcut`/`sendGlobalScreenshotShortcutStatus`/`uninstallGlobalScreenshotShortcut`），快捷键是从 `main.js` 的常量 `GLOBAL_SCREENSHOT_ACCELERATOR = 'Alt+Q'` 一次性注册的，**没有任何通道让渲染器改它**：

- 宿主的 `electron/ipc/screenshotIpc.js` 只有 3 个 handler，缺 `screenshot:updateGlobalShortcut`；
- `electron/preload.cjs` 的 `screenshot` 能力缺 `updateGlobalShortcut`；
- 桥的 `/api/v2/desktop/screenshot/update-global-shortcut`、`/consume-global-capture-events`、`/get-global-shortcut-status` 三条路由虽然早就写在路由表里（`desktopHttpBridge.js:345-357`），但 `buildMainIpcHandlerDeps()` 没有产出对应键，因此恒返回"不可用"；
- 控制器内部没有状态快照、没有截图事件队列，`screenshot:globalShortcutStatus` 只发注册结果，无法回答"当前快捷键是什么、有没有注册上"。

新版（0.7.16）的做法：控制器内部维护 `currentAccelerator` + 状态对象 + 有界截图事件队列，对外多暴露 `configureGlobalScreenshotShortcut`/`consumeGlobalScreenshotCaptureEvents`/`getGlobalScreenshotShortcutStatus`，并让编辑器里改 `canvas-screenshot` 快捷键后同步到宿主。

## 2. 本批落地内容

| 文件 | 作用 |
| --- | --- |
| `electron/screenshotShortcutAccelerators.js`（新） | 纯函数（零 import）：单个按键 token 归一化、修饰键排序 + 唯一主键校验、`{keys}/{accelerator}` 两种载荷解析。**独立成模块的原因**：`screenshotOverlayController.js` 顶部是 `import { BrowserWindow, ... } from 'electron'` 具名导入，在纯 Node 下会直接抛 `SyntaxError`（已验证），逻辑留在控制器里就无法离线测试。 |
| `electron/screenshotCaptureEventQueue.js`（新） | 纯函数有界队列（默认 8 条，超出丢最旧，`consume()` 取走即清），对应新版 `_0x5b77cf`/`_0x371d99` 的行为。 |
| `electron/screenshotOverlayController.js`（重写） | 保留原有 7 个导出及全部既有分支（overlay 窗口、原生 helper 子进程、日志事件名、`native-helper-*` 原因字串），新增：可变 `currentAccelerator`、注册状态快照、带加速键比对的注册/注销（换键会先注销旧键）、`configureGlobalScreenshotShortcut`/`consumeGlobalScreenshotCaptureEvents`/`getGlobalScreenshotShortcutStatus`、截图结果投递时**写入剪贴板**（`actionId === 'reverse-prompt'` 时改为聚焦画布）、向有界队列入队、`captureDesktopDisplay` 返回值新增 `cursor`；`startNativeHelper` 的 env 补 `AICANVAS_THEME_TOKENS_PATH`；新增 `focusCanvas` 与 `globalShortcutApi` 两个可注入参数（后者默认取 electron 的 `globalShortcut`，便于离线测试注入桩）。 |
| `electron/ipc/screenshotIpc.js`（改） | 新增 `configureGlobalScreenshotShortcut` 参数与 `screenshot:updateGlobalShortcut` handler，逐行对齐新版。 |
| `electron/ipc/mainIpcSetup.js`（改） | 扁平 deps 新增 `configureGlobalScreenshotShortcut`/`consumeGlobalScreenshotCaptureEvents`/`getGlobalScreenshotShortcutStatus` 三键，使桥的三条截图路由返回真实结果。 |
| `electron/preload.cjs`（改） | `screenshot.updateGlobalShortcut(payload)` → `ipcRenderer.invoke('screenshot:updateGlobalShortcut', payload)`。 |
| `electron/main.js`（改） | 构造控制器时传 `focusCanvas: () => focusMainWindow()`。 |
| `src/modules/shortcuts.js`（改） | 新增 `_syncCanvasScreenshotShortcutToElectron()`（读 `_shortcuts['canvas-screenshot'].keys`，缺失则回落 `DEFAULT_SHORTCUTS`，仅在 `window.electronAPI.screenshot.updateGlobalShortcut` 存在时调用，失败只 `console.warn` 不上抛），并在原有 `_syncShortcutsToGlobal()` 末尾调用；该函数已覆盖"加载/保存/应用预设/录制完成"四条既有路径（`shortcuts.js:468/469/471/482/504/734`），因此编辑器里改快捷键即会重新注册全局热键。 |

**有意不做**：没有把 `shortcutStatus` 暴露到渲染器 UI 上展示、没有做快捷键编辑面板的文案/冲突提示改造（新版走 `desktopBridge.screenshot.isAvailable()` 与 `settings.shortcuts.*` 文案体系，本仓渲染器没有 `src/services/desktopBridge.js`）；控制器里新版那个恒为 `true` 的 `_0x36a304()` 守卫（"是否优先原生 helper"）被去掉，因为它不改变任何分支。

## 3. 安全边界

- 快捷键字符串只来自"渲染器 → IPC/桥"的 `{keys}` 数组或 `{accelerator}` 字符串，经白名单 token 归一化后才会交给 `globalShortcut.register`；非法载荷一律返回 `{ok:false, reason:'invalid-shortcut'}` 且**不注销**当前已注册的键。
- 换键顺序是"先注销旧键 → 改 `currentAccelerator` → 重新注册"，不会出现两条热键同时有效的窗口。
- 控制器不会把快捷键写进任何配置文件；`main.js` 的默认值仍是常量 `Alt+Q`（重启回到默认，除非渲染器在启动后再次同步）。
- 截图投递写到系统剪贴板是新增副作用（`actionId !== 'reverse-prompt'` 时），失败只记 `screenshot.clipboard_write_failed` 警告，不阻断 `screenshot:globalCaptureReady`。
- 有界队列上限 8，避免桥消费者不来取时无限增长。

## 4. 已执行的验证（离线）

```
node --check electron/screenshotShortcutAccelerators.js \
  electron/screenshotCaptureEventQueue.js electron/screenshotOverlayController.js \
  electron/ipc/screenshotIpc.js electron/ipc/mainIpcSetup.js electron/main.js \
  src/modules/shortcuts.js electron/preload.cjs \
  electron/screenshotShortcutAccelerators.test.js electron/screenshotCaptureEventQueue.test.js \
  electron/ipc/mainIpcSetup.test.js
node --test electron/screenshotShortcutAccelerators.test.js \
  electron/screenshotCaptureEventQueue.test.js electron/ipc/mainIpcSetup.test.js
node --test "electron/**/*.test.js"
```

结果：全部 `node --check` 退出 0；新增两块测试 **11 项全部通过**（accelerators 7 项 + 队列 4 项）；`mainIpcSetup.test.js` **7 项全部通过**（含新增 1 项桥截图路由）；`electron/**` 合计 **246 项 / 245 通过 / 1 失败**，唯一失败仍是既有的 `electron/fullProjectPackageService.test.js`（`missing manifest coverage cannot bind to an existing unrelated local file`，归 R14 第17批）。14 个相关相对导入目标存在。

覆盖点：token 别名（ctrl/control/cmdorctrl/commandorctrl、shift、alt/option、space、反引号三写法、F1–F24、单字母、数字、enter/esc/ins/del/pageup/right、`=`→Plus、`,`→Comma 等）；拒绝 `meta`/`cmd`（新版截图控制器**不**接受这两个别名）、`f25`、空值与未知串；修饰键排序与"必须且只能有一个主键"（`['Ctrl','Shift']`、`['Ctrl','A','B']`、五键、`['Ctrl','Unknown']` 全部判非法）；`{keys}` 数组与 `{accelerator}` 字符串两种载荷、`''` 与非数组非字符串载荷；队列的插入顺序、超限丢最旧（11 条留后 8 条）、自定义上限 2、非法上限回落默认、`consume` 取走即清、实例互不干扰。桥侧用桩控制器验证三条路由确实取到 `configureGlobalScreenshotShortcut`/`consumeGlobalScreenshotCaptureEvents`/`getGlobalScreenshotShortcutStatus` 的返回值。

## 5. 验收欠项（须授权后执行）

- [ ] 真实应用内注册全局热键（`Alt+Q`）后按键是否唤起覆盖层，并核对 `screenshot:globalShortcutStatus` 的 `accelerator/ok/registered/reason` 与界面提示一致。
- [ ] 在快捷键设置里把 `canvas-screenshot` 改成另一个合法组合，确认宿主重新注册、旧键失效、重启后回到 `Alt+Q`；再输入非法组合确认只提示、不丢已有注册。
- [ ] Windows 上存在 `native/screenshot-helper/bin/screenshot-helper.exe` 时走原生 helper 的注册路径（env 中 `AICANVAS_SCREENSHOT_ACCELERATOR`/`AICANVAS_CURSOR_DIR`/`AICANVAS_THEME_TOKENS_PATH`），核对 helper 退出/错误时状态回落与 Electron 兜底注册。
- [ ] 核对确认截图后图片确实进入系统剪贴板；`actionId === 'reverse-prompt'` 时不写剪贴板而聚焦主窗口。
- [ ] 经桥调用 `/api/v2/desktop/screenshot/update-global-shortcut|consume-global-capture-events|get-global-shortcut-status` 的端到端行为与返回结构；确认 `consume` 之后队列为空（取走即清）。
- [ ] 核对 `src/modules/shortcuts.js` 的同步调用在浏览器（非 Electron）环境下不报错、不产生未捕获 Promise 拒绝。

## 6. 已知未完成（不计入本批）

- 渲染器侧只有"保存后同步"，**没有**截图/全局快捷键的设置界面改造，也没有 `desktopBridge` 渲染层（`src/services/desktopBridge.js` 本仓不存在，走的是 `window.electronAPI`）。新版 `settings.shortcuts.notificationShortcutUnavailable` 之类文案未移植。
- 新版 `contextMenuShortcutAccelerators.js`（右键菜单快捷键归一化，依赖本仓缺失的 `src/utils/contextMenuShortcutCatalog.js`）与 `notificationShortcutController.js`（通知快捷键 `Alt+E`）**本批未移植**；`screenshot/*` 与 `notification-sound/*` 是两套不同链路。
- `text-preset/*`（5 路由）与 `node-export/*`（6 路由）仍因缺能力对象返回"不可用"；`storage-migration/*` 还依赖本仓不存在的 `electron/legacyStorageMigration.html`。
- 未跑 `electron .`、未做构建/打包、未做真实按键与剪贴板验收。
