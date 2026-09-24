# 第70–71批 · R15/R17 文本预设捕获链的装配（`node.create`/`generation.run` 契约 + 渲染器侧接线 + 主进程侧装配与 Alt+C 注册）

> 承接第 69 批：`globalTextPresetBridge.js` 落地后，第 69 批专题文档 §7 与台账把这条链的剩余工作定为「**四步装配**」——①`executeCanvasCommand` 命令总线契约；②画布身份等价物；③`translateAppText` 与 `desktopBridge.textPreset.isAvailable()` 落地形态；④在 `main.js` 装配、接浮层捕获面板、注册 Alt+C。第 70 批闭合 ①②③ 与 ④ 的渲染器半边；第 71 批闭合 ④ 的主进程半边（把第 63/64 批已落地的浮层窗口装配层真正装进 `electron/main.js`，并让四条 `globalCaptureWindow:*` 通道脱离 `not-supported`）。

## 1 · 本批补的缺口

第 69 批交付的桥是「**浮层动作的真正执行者**」，但它的两侧都没有生产消费者：

- **渲染器侧**：桥调 `executeCanvasCommand('node.create', …)`，而 `node.create` 在本仓**不接受** `placement` / `sequenceKey` / 显式 `x`/`y`（`argsSchema` 无这些字段），`createNodeAtCursor` 也不接受第 5 个 options 参数 ⇒ 即便桥接线，`placement:'viewport-center-sequence'` 与 `sequenceKey:'global-capture'` 会被**静默丢弃**，浮层建出的节点不会按序列避让、也不会带序列键。
- **主进程侧**：`electron/globalCaptureControllers.js`（第 64 批装配层）与 `electron/globalCaptureWindowController.js`（第 63 批本体）生产**零引用**；`electron/main.js` 用一小段内联代码**手写**了该装配层的子集（`selectedTextCapture` + `globalTextPresetShortcutController`），且**从未**调用 `installGlobalShortcut()` ⇒ Alt+C 从未注册；`textPresetIpc` 的 4 条 `globalCaptureWindow:*` 通道因依赖恒 `undefined` 而**恒返回 `not-supported`**。

## 2 · 交付物

### 2.1 第 70 批（渲染器侧）

| 项 | 值 |
| --- | --- |
| `src/modules/canvasCommands/graphCommands.js` | 4 处编辑，numstat **82 / 9**：新增 `hasExplicitCreatePosition()`；`node.create.argsSchema` 增 `x`/`y`/`placement`/`sequenceKey`（默认 `placement: 'viewport-center-sequence'`）；`validate` 改为「显式坐标 + `buildNodeData`」或 `createNodeAtCursor` 二者其一即可；`execute` 整体替换为 0.7.16 移植版（`agentReservation` / `reuseNodeId` / 显式坐标 `buildNodeData` 分支 / `createNodeSequenceKey` 回落） |
| `src/modules/app/canvasNodeFlows.js` | numstat **25 / 7**：`createNodeAtCursor` 增第 5 个 options 参数，`viewport-center-sequence` 时按 `getNodeSpawnPrefs()` 的 `spacing`/`direction`/`avoidOverlap` 调 `findAvailablePosition` 并把 `sequenceKey` 写入 `spawnSequenceKey`；新增 `skipCommit` 选项 |
| `main.js` | numstat **48 / 0**：导入并调用 `installGlobalTextPresetBridge({ getCanvasIdentity, textPresetApi, showToast, translate, executeCanvasCommand, isNodeMounted, scheduleFrame })`，紧随既有的 `installGlobalScreenshotBridge()` |
| `src/i18n/messages/{zh-CN,en-US}.js` | 各 **2** 处编辑：**修正第 69 批的嵌套缺陷**——`globalTextPreset` / `globalCapture` 两组原在 locale **根层**，而解析走 `t('app.' + key)`，运行时会吐出原始 key；现移入 `app` 内（缩进 2→4），根层重复定义已删除 |
| 新增测试 | `src/modules/canvasCommands/nodeCreateCaptureContract.test.js`（14 项）、`src/i18n/messages/globalCaptureMessages.test.js`（6 项），**共 20 项已执行通过** |
| 新增 npm 包 | 0 |

**端口独有分支在本仓是「休眠」的**：`agentReservation` / `reuseNodeId` / `buildNodeData` / `createNodeSequenceKey` / `hasExplicitCreatePosition` 五个标识符在移植前的本仓 `grep` **0 命中**，故全量忠实移植对既有调用方**零行为变更**。

### 2.2 第 71 批（主进程侧）

| 项 | 值 |
| --- | --- |
| `electron/main.js` | 删除 `createSelectedTextCaptureController` / `createGlobalTextPresetShortcutController` 两条 import 与那段内联装配，改为单次 `const { globalCaptureWindowController, globalTextPresetShortcutController } = createGlobalCaptureControllers({ dirname: __dirname, accelerator: GLOBAL_CAPTURE_LAUNCHER_ACCELERATOR, focusCanvas, getMainWindow, logDiagnosticEvent })`；IPC context 增 `globalCaptureWindowController`；`startApp` 增 `void globalCaptureWindowController.prewarm()` 与 `globalTextPresetShortcutController.installGlobalShortcut()`；`will-quit` 改为 `globalTextPresetShortcutController?.uninstallGlobalShortcut?.()` + `globalCaptureWindowController?.destroy?.()` |
| `electron/ipc/mainIpcSetup.js` | 解构增 `globalCaptureWindowController: _0x331d63`，返回体增 4 键：`chooseGlobalCaptureWindowAction` / `cancelGlobalCaptureWindow` / `setGlobalCaptureWindowExpanded` / `acknowledgeGlobalCaptureWindowPresentation`（逐字对齐端口源 `mainIpcSetup.js:132-136`） |
| 新增测试 | `electron/captureChainWiring.test.js`（8 项，**已执行通过**）：4 项走 `buildMainIpcHandlerDeps` + `registerTextPresetIpcHandlers` 的真实路径（含 sender 透传、缺控制器时 `not-supported`），4 项静态核对 `main.js`/`mainIpcSetup.js` 的装配与生命周期 |
| 新增 npm 包 | 0 |
| 本仓改写 | **0 处品牌字面量**；两文件均无品牌串改动 |

装配层自带的 `managedCaptureWindowController.prewarm` = `Promise.all([窗口 prewarm, 划词控制器 prewarm])`，`destroy` = 快捷键控制器 + 划词控制器 + 窗口三者一并回收——故本批把原先**分散三处**的生命周期收敛为一处，语义严格覆盖旧行为。

## 3 · 接线现状（第 71 批后）

| 环节 | 状态 |
| --- | --- |
| Alt+C 启动注册 | ✅ `startApp` → `installGlobalShortcut()`；`will-quit` → `uninstallGlobalShortcut()` |
| 划词捕获 → 浮层面板 | ✅ `createGlobalCaptureControllers` 把 `selectedTextCapture.capture` 接给快捷键控制器，`captureWindowController.show/hide/isVisible` 接为 `showCapturePanel/hideCapturePanel/isCapturePanelVisible` |
| 面板动作 → 命令 | ✅ 面板 `globalCaptureWindow:chooseAction` → `chooseGlobalCaptureWindowAction` → `controller.chooseAction` → `onAction` → `shortcutController.dispatchCaptureAction` → text-preset 事件队列 |
| 事件 → 渲染器桥 | ✅ `textPreset:consumeEvents|claimEvent|acknowledgeEvent`（第 41 批）→ `electronAPI.textPreset` → `globalCaptureReceiver`（第 67 批）→ `globalTextPresetBridge`（第 69/70 批） |
| 桥 → 建节点 / 生成 | ✅ `node.create` 现接受 `placement`/`sequenceKey`/显式坐标（第 70 批），`generation.run` 已注册（本仓既有） |
| 浮层窗口呈现 | ✅ 窗口本体（第 63 批）+ 装配层（第 64 批）+ 预加载桥（第 64 批）+ 面板渲染层（第 65/66 批）+ `globalCaptureWindow.html` 齐备 |

**仍不可达的部分**：①chrome-shell 运行时本体（`chromeShellRuntime` 仍生产零引用）——**但本链不再依赖它**，浮层捕获走的是主窗口 + 独立浮层窗口，不经过 chrome 浏览器进程；②`selection-hook` native 模块**未安装**（`node_modules/selection-hook` 不存在）⇒ `ensureSelectionHook()` 会返回 `native-selection-unavailable`，win32 下回落到 PowerShell 复制工作线程（`selectedTextCapture.js` 内自带，无需额外依赖）；③浮层面板的 CSS 未与端口构建做视觉比对。

## 4 · 已执行验证（离线，本窗口实测）

- `electron/captureChainWiring.test.js` = **8 / 8 / 0**；`src/modules/canvasCommands/nodeCreateCaptureContract.test.js` + `src/i18n/messages/globalCaptureMessages.test.js` = **20 / 20 / 0**。
- `electron/**` sweep = **1 376 / 1 375 / 1**（第 63 批基线 1 368 / 1 367 / 1 → +8 项本批新测试，唯一失败仍为既有 R14 第 17 批 `missing manifest coverage cannot bind to an existing unrelated local file`，与本批无关）。
- `node --check electron/main.js` 通过。
- 全部用 `node --test --test-reporter=tap` 落到临时目录（默认 spec reporter 在本窗口不出 `ℹ tests` 汇总块）；**未联网、未启动应用、未跑 Electron、未做真实 AI 调用**。
- 快照：`staged=0 modified=67 untracked=402 conflicts=0`（第 69 批为 `0/65/399/0`；`modified` 中 `main.js`、`electron/main.js`、`electron/ipc/mainIpcSetup.js`、两个 i18n、`graphCommands.js`、`canvasNodeFlows.js` 均为**已在集合内**的文件，本批无新增被编辑文件；`untracked` +3 = 第 70 批 2 个测试 + 第 71 批 1 个测试）。

## 5 · 未执行的验收项（不得当作已完成）

- **未在真实 Electron 下跑**：8 项 IPC 用例全为注入替身（假 `ipcMain`、假 sender、假控制器）；真实 `BrowserWindow` 创建、`loadFile('globalCaptureWindow.html')`、`disableWindowsWindowTransitions` 的 native 路径、`capturePage` 首帧、`showInactive` 焦点重试**均未触发**。
- **未跑真实快捷键链路**：`globalShortcut.register('Alt+C')` 的成功/冲突/`registration-failed` 回执未在真机验证；`selection-hook` 未安装，win32 PowerShell 复制工作线程**未启动过**。
- **未做 UI 验收**：浮层面板未在浏览器/Electron 中打开过；面板动作到建节点的端到端路径（包括 `viewport-center-sequence` 的真实序列避让）**一次都没走通**。
- **第 70 批的 i18n 修正只有键集/嵌套断言**，未在真实渲染器下验证 toast 文案渲染。
- **未打包**；未验证 `globalCaptureWindowPreload.cjs` 在 `sandbox: true` 下的实际可用性（`contextBridge` 暴露名 `globalCaptureWindow` 与渲染层读取一致，但仅静态核对）。

## 6 · 约束复核

- 未改授权校验；未动安装版资源（`D:\shuocancas` 全程只读）；未自动提交/推送/触发发布。
- 未全量替换 `style.css`；未新增 npm 包；未伪造夹具；未为「有引用」而擅自接线（浮层窗口的接线依据是端口源 `main.js` 的同一装配点，非自造消费者）。
- 未 `git reset --hard` / `git clean` / 批量 checkout / 全量覆盖目录。
- 不改 `src/i18n/messages/*.js` 既有键的语义，本批仅**修正嵌套层级**（根层→`app`），键名与文案逐字保留。

## 7 · 下一批建议

本链已两端接通，剩余为**运行期验收 + 本仓边界**：

1. **运行期授权验收**（需用户授权）：在真实 Electron 下验证 Alt+C 注册、划词捕获、浮层面板呈现、四动作建节点与 `generation.run` 入队。注意 `selection-hook` 需先安装（新增 native 依赖，须先列体积/平台/许可并获授权）。
2. 仍欠（非本链）：`web-preview/*` 5 条路由实为**空壳**（`electron/ipc/webPreviewIpc.js` 仅 22 行）、`storage-migration/prepare`、`chromeShellRuntime` 的最终装配、`styles/variables.css` 里 44 个未移植的 0.7.16 CSS 自定义属性。
3. R03/R14/R16 的其余缺口按台账 §5/§6 继续。
