# 第64批 · R15 全局捕获装配层（`globalCaptureControllers` + `globalCaptureWindowPreload`）

> 承接第 63 批：`globalCaptureWindowController`（浮层窗口本体）落地后，第 63 批专题文档 §7 与台账点名「**`globalCaptureControllers` 依赖已全齐，建议下一批**」。本批取该装配层，并把它唯一还缺的宿主侧同伴 `globalCaptureWindowPreload.cjs`（16 行 / 794 B）一并落地。二者加上第 63 批的本体与第 41 批已注册的四条 IPC 通道，构成**主进程侧的完整捕获面板链**；渲染器侧（html/js/css）仍未移植，见 §7。

## 1 · 本批补的缺口

第 63 批解决的是「**浮层窗口本身怎么创建、呈现、展开、派发动作、回收**」；本批解决的是「**谁把浮层窗口、划词捕获控制器、快捷键控制器三件装配起来，并把窗口的 `show`/`hide`/`isVisible` 接到快捷键控制器、把划词控制器的 `capture`/`isKeyReleaseTrackingAvailable` 接回来**」。这正是 0.7.16 `main.js` 里全局捕获链的唯一装配点，也是本仓 `main.js` **当前用内联代码手写的那一小段**（见 §3）的等价函数。

`globalCaptureWindowPreload.cjs` 则是浮层页面的桥：它把第 63 批控制器 `webContents.send` 的 `globalCaptureWindow:present` 事件交给渲染器，并把面板上的四类用户动作通过 `ipcRenderer.invoke` 送回第 41 批已注册的四条通道。

## 2 · 交付物

### 2.1 源文件

| 项 | 值 |
| --- | --- |
| 移植源 | `D:\shuocancas\SHUO Canvas` 0.7.16 → 反混淆树 `globalCaptureControllers.js`，**46 行 / 1 878 B** |
| 落盘 | `electron/globalCaptureControllers.js`，**51 行 / 2 216 B**（+5 行为 prettier 折行） |
| 静态依赖 | 3 条 import，**全部为本仓已有模块**：`./globalCaptureWindowController.js`（第63批）、`./globalTextPresetShortcutController.js`（第41批）、`./selectedTextCapture.js`（第41批） |
| 移植源 | 同树 `globalCaptureWindowPreload.cjs`，**16 行 / 794 B** |
| 落盘 | `electron/globalCaptureWindowPreload.cjs`，**逐字节照搬**（md5 `906184d579c5c088975f0daa7e906306`，与端口源一致；0 映射、0 改写、0 格式化改动） |
| 新增 npm 包 | 0 |
| 本仓改写 | **0 处**（两文件均无品牌字面量） |
| `_0x` 残留 | 0（11 个映射全部替换为语义名） |

### 2.2 公开契约（1 个具名导出）

`export function createGlobalCaptureControllers({ … } = {})`：

| 参数 | 说明 |
| --- | --- |
| `dirname` | 透传给浮层窗口控制器（决定 `globalCaptureWindowPreload.cjs`/`globalCaptureWindow.html` 的解析目录） |
| `accelerator` | 默认 `'Alt+C'`，透传给快捷键控制器；**本层不做归一**，`Ctrl`→`CommandOrControl` 由既有控制器完成 |
| `focusCanvas` / `getMainWindow` / `logDiagnosticEvent` | 透传 |
| `selectedTextCaptureController` | 默认 `null`；**给了就复用**（`||` 短路，不再调用 `createSelectedTextCaptureController`），不给则自建 |

装配顺序（**顺序本身就是语义**，三处依赖它）：

1. 先定 `let shortcutController = null`，再建划词控制器（或复用注入的），其 `onKeyReleased` 闭包**按引用读** `shortcutController?.['releaseShortcutKey']` —— 因为此刻它还没被赋值；
2. 建浮层窗口控制器，`onAction: (capturePayload, dispatchOptions) => shortcutController?.['dispatchCaptureAction']?.(capturePayload, dispatchOptions) || { ok: false, reason: 'controller-unavailable' }` —— 同样按引用读，且**兜底 `||` 只在派发返回 falsy 时才生效**；
3. 建快捷键控制器，把窗口控制器的三个成员原样接成 `showCapturePanel` / `hideCapturePanel` / `isCapturePanelVisible`，把划词控制器的 `capture` 接成 `copySelectedText`、`isKeyReleaseTrackingAvailable() === true` 接成 `hasKeyReleaseTracking`；
4. 返回 `{ globalCaptureWindowController: { ...窗口控制器, prewarm, destroy }, globalTextPresetShortcutController: 快捷键控制器 }` —— **`prewarm`/`destroy` 被聚合覆写**：
   - `prewarm: () => Promise['all']([窗口控制器.prewarm(), 划词控制器.prewarm()])`（**不是** `Promise.allSettled`；但窗口侧 `prewarm` 自身吞错，故不会拒绝）；
   - `destroy: () => { (快捷键控制器.destroy(), 划词控制器.destroy(), 窗口控制器.destroy()); }`（顺序：快捷键 → 划词 → 窗口）。

三条依赖的**契约逐项核对**（本批开工实测，非目测）：`createGlobalTextPresetShortcutController` 与本仓第 41 批版本**签名完全一致**（同样 13 个选项、同样默认值顺序、同样 12 个返回成员）；`createSelectedTextCaptureController` 同样一致（9 个选项、`startupTimeoutMs 0x dac`=3500、`timeoutMs 0x9c4`=2500、4 个返回成员）。故本层的 11 处成员访问（`releaseShortcutKey`/`dispatchCaptureAction`/`capture`/`isKeyReleaseTrackingAvailable`/`prewarm`/`destroy`/`show`/`hide`/`isVisible`）**全部命中**。

### 2.3 preload 契约

`electron/globalCaptureWindowPreload.cjs`（CJS）：`contextBridge.exposeInMainWorld('globalCaptureWindow', { … })`，**恰好 5 个成员**：

| 成员 | 去向 |
| --- | --- |
| `chooseAction(payload)` | `ipcRenderer.invoke('globalCaptureWindow:chooseAction')` |
| `cancel(payload)` | `ipcRenderer.invoke('globalCaptureWindow:cancel')` |
| `setExpanded(payload)` | `ipcRenderer.invoke('globalCaptureWindow:setExpanded')` |
| `didPresent(payload)` | `ipcRenderer.invoke('globalCaptureWindow:didPresent')` |
| `onPresent(callback)` | `ipcRenderer.on('globalCaptureWindow:present', …)`，返回**反注册闭包**；非函数参数返回空函数 |

四条 invoke 通道**正是第 41 批 `electron/ipc/textPresetIpc.js` 已注册的四条**，且其 DI 形状 `(payload, event?.sender)` 与第 63 批控制器成员 `(payload, sender)` 一一对应；`globalCaptureWindow:present` **正是第 63 批控制器 `show` 里 `webContents['send']` 的事件名**。三者的对应关系已写成静态断言（见 2.4）。

### 2.4 测试

| 文件 | 规模 | 项数 | 说明 |
| --- | --- | --- | --- |
| `electron/globalCaptureControllers.test.js` | 244 行 / 8 690 B | **18** | 用**真实三个模块**装配（仅注入替身划词控制器 + 替身日志出口），不注入任何工厂——因此它同时验证了「装配层的成员访问与本仓既有契约确实对得上」 |
| `electron/globalCaptureWindowPreload.test.js` | 50 行 / 2 605 B | **5** | **静态源码文本契约核对**（preload 只能在 Electron 内运行，无法在纯 Node 里 import），把通道名与注册方交叉比对 |

装配层用例分八组：①返回键恰为两个；②窗口控制器暴露**恰 10 个**成员且全为函数；③快捷键控制器为真实件（12 个成员）；④无参构造不抛；⑤显式 `null` 划词控制器回落自建；⑥注入的划词控制器**确被**用作 `copySelectedText` 源（`capture` 收到 0 个实参）；⑦默认 `Alt+C` 与显式 `Ctrl+Shift+K`→`CommandOrControl+Shift+K` 均到达真实快捷键控制器的状态表（**归一由既有控制器完成，本层只透传**）；⑧**胶水是活的**——`captureSelectedText()` 的返回 reason 是 `'window-show-failed'`（第 63 批控制器在纯 Node 下 `new BrowserWindow` 抛错后的归一码），**绝不是**快捷键控制器自带的 `'panel-unavailable'` 兜底，且注入的日志出口收到 `global_capture.window_show_failed`；⑨`prewarm` 聚合为长度 2 的数组、`[0]` 为窗口侧（`undefined`）、`[1]` 为划词侧结果、两次调用**不记忆化**、`destroy` 后仍结算；⑩`destroy` 聚合三件且可重复，并**分别用两个真实件自证**——destroy 后 `captureSelectedText()` 得 `'capture-controller-destroyed'`（快捷键控制器侧）、`show(...)` 得 `'capture-controller-destroyed'`（窗口控制器侧）。

preload 用例（静态）：①是 `require('electron')` 的 CJS 且 `exposeInMainWorld` 恰好一次、世界键为 `globalCaptureWindow`；②**恰好 5 个成员**且顺序一致；③四条 invoke 通道与 `ipc/textPresetIpc.js` 的 `ipcMain.handle` **一一且各一次**对应；④`onPresent` 监听的事件名与控制器 `send` 的事件名一致；⑤订阅/反注册走同一闭包、非函数参数返回空函数。

## 3 · 接线现状：生产零引用，且**已定位到本仓内联的等价实现**

`globalCaptureControllers` 与 `globalCaptureWindowPreload` 在本仓**生产引用数 = 0**；`main.js` / `mainIpcSetup` / `preload.cjs` 本批**零改动**。

**本批的关键发现**：本仓 `electron/main.js:252-263` **已经内联手写了本装配层的第 1–3 步**——

```
let globalTextPresetShortcutController = null;
const selectedTextCaptureController = createSelectedTextCaptureController({ onKeyReleased: (payload) => globalTextPresetShortcutController?.releaseShortcutKey?.(payload) });
globalTextPresetShortcutController = createGlobalTextPresetShortcutController({ accelerator: GLOBAL_CAPTURE_LAUNCHER_ACCELERATOR, copySelectedText: …, hasKeyReleaseTracking: …, focusCanvas: …, getMainWindow: …, logDiagnosticEvent: … });
```

即：**本装配层就是这段内联代码的忠实函数化**，差别只有三点——①少了 `showCapturePanel`/`hideCapturePanel`/`isCapturePanelVisible` 三键（因为第 41 批时还没有浮层窗口控制器，**第 63 批才补上**）；②没有 `prewarm`/`destroy` 聚合；③返回对象而非两个 `let` 变量。故它**不是新功能，而是可维护化 + 补齐三键**。

即便如此，本批**仍不接线**，理由是具体的、可复核的：浮层窗口控制器 `ensureWindow()` 会 `loadFile(<dirname>/globalCaptureWindow.html)`，而该 HTML **本仓尚未移植**（现存于安装版 `resources/app.asar` 内，见 §7）；此刻把装配层接上去，`showCapturePanel` 会从「恒返 `panel-unavailable` 的兜底」变成「真的构造 `BrowserWindow` → `loadFile` 失败 → 记 error → 返 `window-show-failed`」，并可能触发第 60 批 `windowsWindowTransitions` 的真实 PowerShell 分支——**用真实副作用换一个同样打不开的面板**，属于「为了有引用而接线」。口径同第 43/56/57/58/59/60/61/62/63 批：**宁可留白并记账**。

**同时记录本批查实的两个既有缺口**（均非本批引入，属接线批必须一并解决的）：

1. **全局快捷键当前在本仓根本不会注册**：本仓第 41 批把 `globalTextPresetShortcutController` 的 `globalShortcutApi` 默认值定为 `{}`（端口源默认是 `electron` 的 `globalShortcut`，故端口侧的装配层无需该参数）。全仓检索确认：**没有任何生产代码注入 `globalShortcutApi`**，且 `installGlobalShortcut` **无任何生产调用方**（`electron/ipc/mainIpcSetup.js:131` 只暴露了 `configureGlobalShortcut`）。故本装配层如实照搬端口源后，`registerBinding` 会走 `globalShortcutApi?.register?.()` → `undefined` → `registered = false`、`reason: 'registration-failed'`。**接线批必须显式解决**（最可能是在调用点注入 `globalShortcutApi: globalShortcut` 并新增 `installGlobalShortcut()` 调用；是否为此给装配层加一个端口源没有的透传参数，留给该批决定并记账）。
2. **本仓窄于端口源的 `main.js` 调用点**：本仓传 `accelerator: GLOBAL_CAPTURE_LAUNCHER_ACCELERATOR`（模块常量），而装配层默认 `'Alt+C'`；接线时应保持本仓现有常量值，不要因装配层默认值而改变既有快捷键。

## 4 · 已执行验证（离线，本窗口实测）

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 语法 | `node --check` 4 文件（装配层、装配层测试、preload、preload 测试） | 全部通过 |
| 格式 | `prettier --config <tmp>/prettierrc.json --check` 3 个 JS | `All matched files use Prettier code style!`（装配层测试首跑 `--write` 后通过） |
| 本批测试 | `node --test --test-timeout=20000 electron/globalCaptureControllers.test.js electron/globalCaptureWindowPreload.test.js` | **23 / 23 / 0** |
| 全量 sweep | `node --test --test-timeout=25000 $(find electron -name '*.test.js')` | **1 320 / 1 319 / 1**（第 63 批为 1 297/1 296/1，**+23 与本批新增用例数逐一对齐**） |
| 唯一失败 | — | `electron/fullProjectPackageService.test.js` → `missing manifest coverage cannot bind to an existing unrelated local file`（**第 14 批既有失败，与本批无关**） |
| 生产引用 | `grep -rn "globalCaptureControllers\|globalCaptureWindowPreload"`（排除自身与 node_modules） | 0 命中（**唯一一处 `globalCaptureWindowPreload.cjs` 字面量在第 63 批控制器内拼接 preload 路径，非 import**） |
| preload 逐字节 | `md5sum` 落盘件 vs 端口源 | `906184d579c5c088975f0daa7e906306` **两侧一致** |
| git 快照 | `echo "staged=… modified=… untracked=… conflicts=…"` | `0/58/374/0`（本批专题文档落盘后为 **375**） |
| 毒副作用 | — | 无真实 spawn、无真实 BrowserWindow、无真实屏幕读取、无 PowerShell、无网络（`BrowserWindow`/`screen`/`nativeTheme` 取不到 → 全部走「窗口不可用」的同一收敛路径） |

### 4.1 忠实性 token 级比对（非目测）

`C:/Users/luobote/.qoder/tmp/deobf-tools/cmp-tokens.mjs`（先把 `_0x…` 归一为 `V`）：

```
port tokens=275  repo tokens=276
matched=240
```

- **ONLY IN PORT = 35**，**全部是 `V`**（即 35 个 `_0x` 引用）；
- **ONLY IN REPO = 36** = **35 个语义名 + 1 个逗号** → 35 对一一对应，唯一非标识符差异是该逗号，已定位为 prettier 在 `return { … }` 末元素后补的尾逗号（端口源单行无尾逗号）。

`globalCaptureWindowPreload.cjs` 为**逐字节照搬**（md5 相同），故无需 token 比对。

## 5 · 本批本仓改写

**0 处**。两文件均不含品牌/应用名字面量（面板标题在 HTML 里，属 §7 范围）。全部字符串（`'Alt+C'`、`'controller-unavailable'`、`'unbound'` 等）与四条 IPC 通道名、`globalCaptureWindow:present` 事件名**逐字照搬**。11 处 `_0x` 名由临时目录脚本 `transform-capture-controllers.mjs`（11 条标识符映射 + 「0 命中即 throw」守卫 + `_0x`/`Shuo` 双向残留校验）机器改写，**未手工重打一个字符**。

## 6 · 未执行的验收项（不得当作已完成）

1. **`onAction` 委派与 `'controller-unavailable'` 兜底未在运行时触发**：装配层不给浮层窗口控制器留注入缝（直接 import 真实件），而真实件的 `chooseAction` 需要**活呈现**（得先 `show` 成功 → 需要真实 `BrowserWindow`），故 `onAction` 的转发与 `|| { ok:false, reason:'controller-unavailable' }` 的兜底**只做了静态契约核对**（两侧成员名一致）与依赖侧既有覆盖（第 63 批已测「窗口控制器以 `(payload, {signal})` 调 `onAction`」），**本批未跑通**。
2. **`onKeyReleased` → `releaseShortcutKey` 桥未在运行时触发**：仅当**不注入**划词控制器时才建立该闭包，而真实划词控制器的 `capture()` 会去加载 `selection-hook` 原生模块（离线不可跑）。故该桥只有静态核对。
3. **`hasKeyReleaseTracking` 未触发**：其唯一消费点在第 41 批控制器的 `globalShortcutApi.register` 回调内，而本仓未注入 `globalShortcutApi`（见 §3 缺口 1），回调永不执行。
4. **未构造任何真实浮层窗口**：`new BrowserWindow` 在纯 Node 下必然抛错，故「无边框透明 + 置顶 + 离屏居中 + `pop-up-menu`」的真实观感、`prepareChromeShell…`/`disableWindowsWindowTransitions` 的真实副作用均未验证（第 63 批边界照旧）。
5. **未跑真实 IPC 往返**：preload 只能在 Electron 内运行，它的 5 个成员与四条 invoke 通道**只做了源码文本交叉核对**，未端到端跑通「面板按钮 → invoke → 控制器成员」。
6. **未接 UI**：本批**没有**把装配层接到 `main.js`（理由见 §3），故全局捕获浮层在本仓**仍完全不可达**；Alt+C 的全局快捷键也**仍未注册**（§3 缺口 1）。
7. **模块未打包、未在 Electron 主进程内运行**，23 项中 18 项是「真实模块 + 替身叶子」的离线用例、5 项是静态文本核对。

## 7 · 捕获面板集群剩余（本批后）

**本批新查实的完整清单**（从安装版 `resources/app.asar` 只读解析所得，**未解包、未改动安装目录**）：

| 文件 | asar 内大小 | 本仓状态 |
| --- | --- | --- |
| `electron/globalCaptureControllers.js` | 3 038 B | **本批落地** |
| `electron/globalCaptureWindowPreload.cjs` | 798 B（源码 794 B） | **本批落地** |
| `electron/globalCaptureWindowController.js` | 17 974 B | 第 63 批落地 |
| `electron/globalCaptureWindow.js` | 14 861 B | **缺**（反混淆树 281 行 / 12 406 B；需先补 `src/modules/interaction/contextMenuIcons.js` 与 `src/modules/workspaceHorizontalWheel.js`） |
| `electron/globalCaptureWindow.html` | 3 357 B | **缺**（已只读取出，见下） |
| `styles/global-capture-window.css` | 5 424 B | **缺** |
| `src/modules/app/globalCaptureReceiver.js` | 3 258 B | **缺**（反混淆树 1 721 B） |
| `src/modules/app/globalTextPresetBridge.js` | 9 982 B | **缺**（本批新发现，此前未被记录） |
| `electron/ipc/textPresetIpc.js` | 3 112 B | 第 41 批落地（四条 `globalCaptureWindow:*` 通道） |

`globalCaptureWindow.html` 的关键结构（供下一批直接对照）：`<!doctype html lang="zh-CN" data-theme="dark">`，CSP `default-src 'self'; style-src 'self'; script-src 'self'`，**标题 `发送到 Shuo Canvas 无限画布`（接线时须一并改写为 `AI CanvasPro`，与第 63 批窗口 `title` 保持一致）**，链接 `../styles/variables.css`、`../styles/themes/light.css`、`../styles/global-capture-window.css`，结尾 `<script type="module" src="./globalCaptureWindow.js">`；主体 `main#capturePanel.global-capture` 含 `#actionList`（五个 `data-action-id` 按钮：`source-text`/`ai-text`/`ai-image`/`ai-video`/`preset-draft`，`aria-keyshortcuts` 1–5）、`#moreToggle`、`#captureDetails`（`#textPreview`/`#textCount`/`#runImmediatelyToggle`）、`#captureFeedback`（`#captureStatus`/`#captureHint`/`#retryAction`/`#closeCapture`）。按钮用 `data-icon="…"` 引用图标（`add-to-canvas`/`text`/`image`/`video`/`save`/`cancel`）。

**R15 其余**：`web-preview/*` 5 条路由、`storage-migration/prepare`，以及 chrome-shell 路径的整体接线（第 56–64 批的 15 个模块全部生产零引用）。**R15 依赖缺口仍为零**。

> 下一批建议：**捕获面板渲染器侧 + 接线**——补 `globalCaptureWindow.html`（含品牌改写）、`globalCaptureWindow.js` 及其两个渲染器依赖、`global-capture-window.css`、`globalCaptureReceiver.js`/`globalTextPresetBridge.js`，然后把 `main.js:252-263` 的内联装配替换为 `createGlobalCaptureControllers({…})`、解决 §3 的两个缺口（`globalShortcutApi` 注入 + `installGlobalShortcut()` 调用点），使 Alt+C 首次端到端可用。

## 8 · 约束复核

- 未 push、未 commit、未 `git reset --hard` / `git clean` / 批量 checkout / 全量覆盖目录；未清理任何 untracked 文件。
- 未触碰 `api/freeImageHostApi.js`（本批零改动该文件）。
- **未改动安装目录 `D:\shuocancas` 下任何文件**：`probe-asar.mjs` 以只读方式解析 `resources/app.asar` 头部并取出单个 HTML 到**临时目录**，仅作移植依据；输出文件在 `C:/Users/luobote/.qoder/tmp/deobf-tools/`，**不在仓内**。
- 未引入绝对开发机路径或反混淆临时目录为运行时依赖（两文件只有 `./` 相对 import / `require('electron')`）。
- 未改授权检查；未把 MCP 地址/会话 ID/API 密钥写入仓库。
- 测试**离线**：装配层用真实三模块 + 替身划词控制器 + 替身日志出口，**从不构造真实 `BrowserWindow`、从不读真实屏幕、从不跑真实 `disableWindowsWindowTransitions`**（`new BrowserWindow` 取不到构造器即抛，收敛于同一条 `window-show-failed` 路径）；preload 测试只读源码文本。
- 未为「让模块有引用」而擅自接线（§3）。
- 静态检查与运行结果分开报告：`node --check` / `prettier --check` / `md5sum` / asar 只读解析 / `git` 快照属静态；`node --test` 的 23 与 sweep 的 1 320/1 319/1 属实跑结果，均已如实记录。
