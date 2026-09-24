# 浮层捕获面板渲染层三件套（R15 第 66 批）

本批交付 `electron/globalCaptureWindow.js`（渲染器）、`electron/globalCaptureWindow.html`（宿主文档）与 `styles/global-capture-window.css`（面板样式表），并为此补上 1 个缺失的 CSS 自定义属性 `--font-ui`。**本批把 R15「浮层捕获面板集群」的主进程侧与渲染侧全部补齐**——第 41 批的 4 条 IPC 通道、第 63 批的窗口控制器、第 64 批的装配层与 preload、第 65 批的两个渲染器前置依赖，加上本批的渲染器三件套，构成一条**文件闭环**：`globalCaptureWindowController` 的 `loadFile(__dirname + '/globalCaptureWindow.html')` 与 `preload: __dirname + '/globalCaptureWindowPreload.cjs'` 现在**两个目标都在仓内存在**。

## 1. 缺口：为什么是这一批

第 65 批专题文档 §7 与台账都把下一批点名为「浮层捕获渲染层三件套」。三个文件的关系是**同一次 `loadFile` 的三部分**：

| 文件 | 角色 | 消费关系 |
| --- | --- | --- |
| `globalCaptureWindow.html` | 宿主文档（`BrowserWindow.loadFile` 的目标） | 声明 5 个动作按钮、详情区、反馈条；`<script type="module" src="./globalCaptureWindow.js">` |
| `globalCaptureWindow.js` | 面板渲染器（该文档里的唯一脚本） | 通过 `globalThis['globalCaptureWindow']`（= preload 暴露的桥）与主进程往返；`import` 第 65 批的两个模块 |
| `global-capture-window.css` | 面板样式表 | 被文档 `<link>`；全部取值来自 `styles/variables.css` 与主题文件 |

三者的 `import` / `href` 目标在本批之前**只有 2 个存在**（第 65 批的两个 `src/modules/*`），其余全部落空：`globalCaptureWindow.js` 与 `.html` 本仓不存在，`global-capture-window.css` 本仓不存在。所以第 63 批 `ensureWindow` 的真实 `loadFile` 目标不存在、`webContents` 拿不到任何脚本——**该批的 91 项离线用例只能在替身 `loadFile` 上跑**。本批把这个缺口关闭。

两个来源的事实（本批实测复核）：

- **渲染器源码来自反混淆树** `shuo-electron-deobf/globalCaptureWindow.js`（12 406 B / 281 行）。asar 内的同路径文件是 **14 861 B 的混淆构建产物**（含 `a985V` 字符串数组解码器与 `V(123)` 间接调用），不是可移植源。这与第 56–65 批的取源口径一致。
- **HTML 与 CSS 在反混淆树中不存在**（`find shuo-deobf shuo-electron-deobf -name globalCaptureWindow.html -o -name global-capture-window.css` = 0 命中），只能从安装版 `resources/app.asar` **只读提取**（第 63 批首次引入的 `probe-asar.mjs` 技术），提取件落在临时目录 `~/.qoder/tmp/deobf-tools/asar-globalCaptureWindow.html`（3 357 B）与 `asar-global-capture-window.css`（5 424 B）。**本批未改动安装版任何字节**（`openSync(..., 'r')` + `readSync`，无写句柄）。
- 顺带核实：`src/modules/app/globalCaptureReceiver.js` 与 `src/modules/app/globalTextPresetBridge.js` 在 asar 内是**混淆构建产物**（3 258 B / 9 982 B，含 `a985V` 解码器），反混淆树内是**可读源码**（1 721 B / 7 275 B）。即「asar 体积大于反混淆树」是混淆所致，**并非新版本文档**；下一批（渲染器侧桥）取源应取反混淆树。此前的边界清单把 asar 体积与反混淆体积并列而未加解释，本批予以澄清。

## 2. 交付物

### 2.1 源码清单

| 文件 | 行数 | 字节 | 端口源 | 改名 | 品牌改写 |
| --- | --- | --- | --- | --- | --- |
| `electron/globalCaptureWindow.js` | 291 | 13 067 | 12 406（`shuo-electron-deobf/`） | 43 个 `_0x` 名（150 处） | 0 |
| `electron/globalCaptureWindow.html` | 118 | 4 400 | 3 357（asar，单行） | 0 | 1（标题） |
| `styles/global-capture-window.css` | 275 | 6 328 | 5 424（asar，单行） | 0 | 0 |
| `styles/variables.css`（**既有文件，+6 行**） | 533 | — | 0.7.16 `styles/variables.css` 同名单变量 | 0 | 0 |

HTML 与 CSS 的字节增长全部来自 prettier 排版（单行展开为多行声明），**语义内容零改写**（见 §4.1）。渲染器新增的 2 条 `import` 全部命中第 65 批刚落地的本仓模块：

```js
import { createContextMenuIcon } from '../src/modules/interaction/contextMenuIcons.js';
import { scrollElementHorizontallyWithWheel } from '../src/modules/workspaceHorizontalWheel.js';
```

### 2.2 模块契约

**`electron/globalCaptureWindow.js`（0 导出，纯副作用模块）**。模块加载即完成全部装配，把状态机、DOM 绑定与键盘处理一次性挂上：

- **顶层读取**（无 DOM 则直接抛错，即真实浏览器语义）：`globalThis['globalCaptureWindow']`（桥）、12 次 `document['getElementById']`、`panel['querySelectorAll']('[data-action-id]')`（= 5 个动作）、`toolbar['querySelectorAll']('button')`（= 4 个动作 + 更多，共 5 个）、`panel['querySelectorAll']('[data-icon]')`（6 个图标位）。
- **图标注入**：对每个 `[data-icon]` 节点调 `createContextMenuIcon(id, { size: 0x10 })`，成功则 `prepend`。6 个图标 id = `add-to-canvas / text / image / video / save / cancel`，全部命中第 65 批目录（40 个 id）。
- **状态对象**（模块私有，10 个字段）：`{captureId, activeIndex, runImmediately, busy, phase, expanded, layoutVersion, revision, failedAction}`。`revision` 用于**丢弃过期异步响应**（每次 `present`/`cancel` +1），`layoutVersion` 用于**丢弃过期展开响应**（每次 `setExpanded` +1，与 `captureId` 双条件校验）。
- **内部函数**：`updateRunImmediately`（切换 3 个 AI 动作的标签与 `aria-label`，标签表 `[['AI 文本','建文本','AI 文本节点'],…]`）、`syncControls`（`busy || phase !== 'ready'` 时禁用全部动作/开关/更多；`capturing` 时 `is-capturing` + `隐藏 closeCapture` + `aria-busy`）、`showFeedback`（状态/提示/反馈条可见性 + 工具栏让位）、`setExpanded`、`setActiveIndex`（`Math.max(0, Math.min(len-1, index))` + `tabIndex` 0/-1 + `scrollIntoView` + 可选 `focus`）、`choose`、`cancel`、`captureError`、`present`。
- **`present(presentation)`** 是唯一入口（经 `api.onPresent` 注册，并同时暴露为 `globalThis.__presentGlobalCapture`）：重置 `revision`/`layoutVersion`/`busy`/`failedAction`/`expanded`，写入文字与字符数（**`Array.from(...).length`，按码位计**，非 UTF-16 长度）、主题（`theme === 'light' ? 'light' : 'dark'` 写入 `documentElement.dataset.theme`）、切换开关状态、刷新控件，然后按相位输出三选一文案（`capturing` / `error`（3 条 `captureError` 分支）/ 空），并 `setActiveIndex(indexOf(activeActionId))`；最后用**两层 `requestAnimationFrame`** 做「首帧聚焦 + 次帧 `didPresent` 确认」，两帧都以 `captureId` 与 `revision` 做**双重时效校验**（首帧额外要求 `!busy`）。
- **`choose(actionId, runImmediately = state.runImmediately, rememberRunImmediately = true)`**：门禁为 `busy || phase !== 'ready' || !captureId || !actionIds.includes(actionId)`；载荷 `{actionId, runImmediately, ...(remember ? {} : {rememberRunImmediately: false})}`；失败时 `failedAction = error?.retryable === true ? payload : null`（即**只有可重试失败才允许原样重试**），并把焦点交给「重试」或「关闭」。
- **键盘契约**（挂在 `window` 上）：`Escape` 先收详情再取消；数字 `1–5` 直选动作（`actionIds[n-1]`）；`ArrowLeft/Up` 与 `ArrowRight/Down` 循环移动活动项；`Enter` 优先取 `eventTarget.closest('[data-action-id]')`，否则用当前活动项；活动项为第 5 项（`preset-draft`）且事件目标不在动作上时，`Enter` 改为展开/收起详情。**屏蔽规则**：有任何修饰键、或 `busy`、或非 `ready` 相位、或存在 `failedAction` 时全部直接返回；`target` 为预览区、开关、或位于 `#captureFeedback` 内时直接返回；位于 `#captureDetails` 内的方向键被忽略（数字键仍生效）。
- **滚轮契约**：`toolbar` 的 `wheel` 监听以 `{ passive: false }` 注册，**无 `ctrlKey`/`metaKey` 时**才委托 `scrollElementHorizontallyWithWheel(wheelEvent, toolbar)`——即缩放手势交还浏览器。

**`electron/globalCaptureWindow.html`**：`lang="zh-CN" data-theme="dark"`，CSP 为 `default-src 'self'; style-src 'self'; script-src 'self'`（**无 `'unsafe-inline'`**），依次链接 `../styles/variables.css` → `../styles/themes/light.css` → `../styles/global-capture-window.css`，唯一脚本为 `./globalCaptureWindow.js`。结构：`main#capturePanel.global-capture` 内 `#actionList`（5 个 `data-action-id` 按钮，`aria-keyshortcuts` 1–5，中间两个 `__divider`）、`#captureDetails`（`#textPreview` / `#textCount` / `preset-draft` 行 / `#runImmediatelyToggle`）、`#captureFeedback`（`#captureStatus` / `#captureHint` / `#retryAction` / `#closeCapture`）。**`#actionList` 前 4 个按钮的 id 顺序必须与 `actionIds` 前 4 项一致**，渲染器靠这个下标对齐做数字快捷键与方向键导航（本批以静态用例锁定该契约）。

**`styles/global-capture-window.css`**：30 个 `var(--…)` 取值，全部落在 `.global-capture` 命名空间内；渲染器实际切换的 4 个状态选择器为 `.global-capture.is-above`（向上展开 = `flex-direction: column-reverse`）、`.global-capture.is-capturing … svg {visibility:hidden}`、`.global-capture[aria-busy='true'] .global-capture__spinner`（显示 + `global-capture-spin`）、`.global-capture__toggle[aria-checked='true']`（轨道与滑块位移）；`.global-capture [hidden] { display: none }` 是面板用 `hidden` 属性收起各区域的前提。

### 2.3 对既有文件的最小增量：`styles/variables.css`

本仓 `styles/variables.css`（507 个自定义属性）是 0.7.16 同名文件（552 个）的**旧一代子集**，`ONLY IN REPO = 0`，缺失 45 个。其中**恰好 1 个被本批新增样式表读取**：`--font-ui`。它出现在 `body { font: var(--font-13)/1.45 var(--font-ui) }`——**`var()` 未定义会让整条 `font` 简写声明在计算值阶段失效**，面板字体与行高会静默退回浏览器默认值。因此本批只补这 1 个（值逐字取自 0.7.16：`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei UI', 'PingFang SC', 'Noto Sans CJK SC', Arial, sans-serif`），并把「全部 45 个缺失属性」记为后续样式对齐批次的待办，**不在本批顺手扩写**。

该增量是**纯追加**：改前 `grep -rn -- "--font-ui" styles/ style.css` = 0 命中，即本仓此前**无任何消费方**，因此对现有界面零影响；`styles/variables.css` 原为 tracked-unmodified，本批后进入 modified 集合（`modified` 58 → 59）。

### 2.4 测试源码

| 文件 | 行数 | 字节 | 用例 |
| --- | --- | --- | --- |
| `electron/globalCaptureWindow.test.js` | 1 340 | 40 370 | 39 |
| `electron/globalCaptureWindowAssets.test.js` | 157 | 6 943 | 9 |

**`globalCaptureWindow.test.js`** 用**手写最小 DOM 替身**驱动真实模块（无 jsdom、无 Electron、无浏览器、无线程、无网络）：

- 替身面：`createElement`（`dataset` / `classList` / `setAttribute` / `addEventListener`+`click()` / `focus` / `scrollIntoView` / `prepend` / `querySelector(All)` / `closest`）、`documentObject`（`getElementById` / `createElementNS` / `documentElement`）、`window`（仅收 `keydown`）、`globalCaptureWindow` 桥（4 个方法 + 可替换实现 + 调用记录）、`requestAnimationFrame`（可手动 `flush()` 的队列）。
- **模块加载用 `?case=N` 查询串做缓存击穿**，每个用例拿到**全新的模块实例与全新状态**，用例之间零串扰（`import('./globalCaptureWindow.js?case=N')` 经实测确认是不同模块记录，且 `t.after` 复原全部全局）。
- 覆盖：装配 3 条（`onPresent` 注册 / `__presentGlobalCapture` / `keydown` 唯一监听、6 个图标位各得 1 个 svg 且 `width=16`/命名空间正确/至少 1 个形状、桥缺失时仍可用）；`present` 12 项（默认值、码位计数 + 亮色主题、`capturing` 相位、5 条错误文案（含 `shortcutLabel` 覆盖与默认 `Alt+C`）、活动项与 `tabIndex`、首帧聚焦三种分支 + 空 `captureId` 不聚焦 + `busy` 不聚焦、次帧 `didPresent`、`captureId` 变更丢弃确认、取消后不确认、开关标签双向切换、`runImmediately` 带入开关）；`choose` 9 项（成功且不可重入、在途不可重入、非 ready / 空 `captureId` 拒绝、可重试失败 + 原样重试、桥抛异常的等价处理、非可重试失败交焦点给关闭、过期响应被丢弃、重试后成功）；`cancel` 3 项（通知一次、空 `captureId` 不通知、桥抛异常仍通知）；`setExpanded` 4 项（`ok+opensUp` 置 `is-above`、`ok:false` 回滚、抛异常回滚、过期响应不置 `is-above`）；键盘 8 项（`Escape` 两段、数字键、修饰键/相位/失败三态屏蔽、方向键环形、ArrowDown 展开并聚焦第 5 项、三个「焦点在别处」形态、详情区内数字可用方向键不可用、`Enter` 三形态）；滚轮 1 项（`passive:false` + 无修饰键才滚动且 `preventDefault` + 有 `ctrlKey` 不拦截）；桥缺失 1 项。

**`globalCaptureWindowAssets.test.js`** 是**静态契约用例**（只读文件，不加载 DOM），把三件套与上游模块**对接**起来，共 9 项：

1. 文档声明（`doctype` / `lang` / `data-theme` / `charset` / CSP 三段 / 模块脚本 / 3 条样式表**顺序**）；
2. 品牌（标题为 `发送到 AI CanvasPro 无限画布`；html / 渲染器 / 样式表三份文件均无 `Shuo`/`SHUO` 残留）；
3. **动作 id 与控制器逐一相等**（`html 的 data-action-id 顺序 === GLOBAL_CAPTURE_ACTION_IDS === ['source-text','ai-text','ai-image','ai-video','preset-draft']`，来自第 63 批的 `globalCaptureWindowController.js`），`aria-keyshortcuts` 恰为 `1..5`；
4. **工具栏按钮顺序与渲染器 `actionIds` 前 4 项一致**、第 5 个按钮为 `#moreToggle`、`ai-*` 三个按钮的 `data-icon` 为 `text/image/video`；
5. **6 个 `data-icon` 全部能在第 65 批目录中解析**（`resolveContextMenuIconDefinition`）；
6. **渲染器 `getElementById` 读到的 12 个 id 全部在文档中声明**（含命名空间一致性）；
7. **样式表读取的 30 个 `var(--…)` 全部在 `variables.css` ∪ `themes/*.css` 中有定义**（本批新增，正是这条用例抓出了 `--font-ui`），并显式断言 `--font-ui` 在被读集合内；
8. 宿主侧 5 个文件（html / 渲染器 / preload / 控制器 / 装配层）与样式表**同处仓内**（`loadFile` 目标存在）+ 渲染器两条 `import` 逐字断言；
9. 样式表保留渲染器实际切换的 6 个状态选择器，且 11 个 `global-capture__*` 类名**同时**出现在样式表与文档中（防「写了类名没写样式」或反之）。

## 3. 接线状态

### 3.1 上游的 `loadFile` 目标现已存在

第 63 批的 `globalCaptureWindowController.js` 里：

```js
preload: path['join'](__dirname, 'globalCaptureWindowPreload.cjs')   // 第 64 批已落地（字节级复制）
await captureWindow['loadFile'](path['join'](__dirname, 'globalCaptureWindow.html'))  // 本批落地
```

即该控制器**此前只能在替身上跑的两条真实分支**，其目标文件现在都在仓内。**但这不等于端到端可用**：控制器本身在本仓**仍无生产调用方**（`grep -rn "globalCaptureWindowController"` 排除自身与 `node_modules` = 0 命中），第 41 批的 4 条 `globalCaptureWindow:*` 通道仍无供给方，Alt+C 也仍未注册（第 64 批已记账的两项既有缺口）。所以本仓 Electron 渲染器下**浮层捕获仍不可达**。

### 3.2 0.7.16 中的真实消费者（供后续排期）

- **渲染器侧桥（下一步，`src/modules/app/`）**：`globalCaptureReceiver.js`（反混淆树 1 721 B）与 `globalTextPresetBridge.js`（7 275 B）。后者是**浮层动作的真正执行者**：`NODE_ACTION_CONFIGS` 把 5 个动作映射到画布命令（`node.create` + `generation.run`），并处理 `preset-draft`（转交 `openQuickCapturePromptPresetDraft`）、`no-selected-text` / `unsupported-action` / `node-id-missing` / `node-not-ready` / `canvas-changed` / `node-create-failed` / `generation-failed` 等失败原因与 `COPY_FAILURE_REASONS`（6 项）、`onGlobalShortcutStatus` 的 `registration-failed` 提示、`waitForGlobalCaptureNodeMounted`（30 × 16 ms 重试）。它依赖 `../promptPresets.js`、`../../core/nodeRuntimeRegistry.js`、`../../core/stores/appStore.js` **三个本仓是否已有对应实现需在下一批开工时核对**。
- `electron/globalCaptureDelivery.js`（本仓**已有**，3 324 B）与 `electron/globalTextPresetShortcutController.js`（本仓**已有**，21 554 B）、`electron/ipc/textPresetIpc.js`（本仓**已有**，2 054 B）——即主进程侧只剩装配序列未接。
- `web-preview/*` 5 条路由与 `storage-migration/prepare` 属 chrome-shell 路径，与浮层捕获无直接依赖。

### 3.3 本批未做的接线

**本批零接线**：未改 `main.js`、`mainIpcSetup.js`、`preload.cjs`、`electron/ipc/**`，未改 `index.html`（因此**主窗口不会加载**面板渲染器）。理由与第 43/56–65 批一致：**宁可留白并记账，也不为了「有引用」而擅自接线**——面板渲染器只能由浮层窗口的 `webContents` 加载，而拉起浮层窗口需要「控制器装配 + 快捷键注册 + 渲染器侧桥」三件套同时就位，缺任何一件都只会造出一条恒返 `not-supported` 的死路径。本批交付的是**可加载、可契约校验、可离线验收的文件实体**，其端到端可由下一批连同桥一起验收。

## 4. 已执行验证

| 命令 | 结果 |
| --- | --- |
| `node --check electron/globalCaptureWindow.js` | 退出 0 |
| `prettier --check`（`deobf-tools/prettierrc.json`）对 6 个文件（2 源 + 2 测试 + css + variables.css） | `All matched files use Prettier code style!`（首跑对 2 个测试文件与 `variables.css` 告警，`--write` 后复检通过） |
| `node --test --test-timeout=20000 electron/globalCaptureWindow.test.js electron/globalCaptureWindowAssets.test.js` | **48/48/0** |
| `node --test --test-timeout=25000 $(find electron -name '*.test.js')` | **1 368/1 367/1**（第 64 批 1 320/1 319/1，**净增 48** = 本批全部用例；唯一失败仍是既有 `fullProjectPackageService.test.js` → `missing manifest coverage cannot bind to an existing unrelated local file`，归 R14 第 17 批，**未新增未变化**） |

本批未触碰 `api/`、`src/`，故 `api/**` 沿用第 58 批实测 457/457/0、`src/**` 沿用第 65 批实测 1 305/1 262/43（43 项全为缺失夹具 `tests/testPreviewDom.js`，既有）。

快照 **`0/59/388/0`**（本批专题文档落盘后 untracked 为 389）：`modified` 58 → **59** = **`styles/variables.css` 一个既有文件**（`modified` 集内另有 4 份台账文档**本不在**该集合，见第 65 批的实测更正）；`untracked` 383 → **388** = 本批 3 个源/资产文件 + 2 个测试文件；专题文档落盘后为 **389**。

### 4.1 保真度核对（token 级，非目测）

用临时目录脚本 `~/.qoder/tmp/deobf-tools/cmp-tokens.mjs`（**不在仓内**）：

- **渲染器**：`b66/pretty/globalCaptureWindow.js`（端口源，prettier 规范化后）对 `electron/globalCaptureWindow.js` —— port **2 463** / repo **2 465** / matched **2 313**；`ONLY IN PORT = 150` **全部为 `V`**（即 150 处 `_0x`）；`ONLY IN REPO = 152` = **150 个语义名 + 2 个逗号** → **150 对 `_0x`↔语义名一一对应**，非标识符残差恰为 2 个逗号。
- 那 2 个逗号已定位为 prettier 的 `trailingComma: 'all'` 行为：改名后名字变长，两处调用越过 `printWidth: 110` 被折行并补尾逗号——(a) `const expandResult = await api?.['setExpanded']?.({ captureId, expanded })` 的对象字面量折行后补的第 3 个键尾逗号；(b) `panel['classList']['toggle']('is-above', …)` 折行后补的第 2 个实参尾逗号。**零逻辑差、零字符串差、零数字差**。
- **HTML**：`prettier(asar 原件)` 对仓内文件的 `diff` **只有 1 行**——`<title>发送到 Shuo Canvas 无限画布</title>` → `<title>发送到 AI CanvasPro 无限画布</title>`，即**唯一改写就是品牌串**（沿用第 63 批窗口标题的同一译名）。
- **CSS**：`prettier(asar 原件)` 与仓内文件 **`diff -q` 完全相同（byte-identical）**——零改写，纯排版。

### 4.2 改名账目

- 渲染器：**43 个唯一 `_0x` 名 / 150 处**，0 残留（脚本以「0 命中即 throw」+ `_0x` 残留校验 + `Shuo` 残留校验三重守卫），品牌改写 0。
- HTML：改名 0，品牌改写 1。CSS：改名 0，品牌改写 0。
- **保留项**（按本仓约定逐字保留）：十六进制字面量（`0x10` / `0x1` / `0x4` / `-0x1`）、`!![]` / `![]`、`\x20` 转义字面量（`'松开后再按\x20'`、`'AI\x20文本节点'` 等 5 处）、非简写对象属性与方括号成员访问（`path['join']`、`Math['max']`、`requestAnimationFrame` 的全局调用、`/^[1-5]$/['test'](...)`）、全部中文字面量与类名。
- 关键改名避坑：`present` 的形参译为 `presentation`（与 `choose` 内的载荷别名 `dispatchPayload` 区分，避免同名不同义）；`choose` 的 `actionId` 形参不与顶层 `actionIds` 混淆；`setExpanded` 与 `choose` 的 `requestCaptureId` 分处不同函数作用域，逐名替换后无遮蔽。

## 5. 尚未执行的验收项（后续批次接手）

1. **未在真实浏览器里渲染面板**：全部 39 项为最小 DOM 替身用例。`<script type="module">` 在 `file://` 下的加载、CSP `script-src 'self'` 是否放行 `../src/**` 的模块导入、`<link>` 相对路径在 `loadFile` 下的解析、**都没有真实跑过**。
2. **未跑真实 `BrowserWindow`**：窗口尺寸/透明/置顶/离屏居中（第 63 批边界项）与「文档在该窗口内的实际排版」均未验证；`backgroundThrottling: false` 与两层 `requestAnimationFrame` 的真实节流行为未测。
3. **未接真实桥**：`globalThis['globalCaptureWindow']` 由 `globalCaptureWindowPreload.cjs`（第 64 批）注入，但**该 preload 从未在真实 `webContents` 里执行**；`onPresent` / `chooseAction` / `cancel` / `setExpanded` / `didPresent` 五项的跨进程语义全为替身。
4. **未跑真实图标渲染**：`createContextMenuIcon` 走的是 `<svg>` 的 DOM 替身，`getBBox`/CSS 尺寸/暗亮色下的 `currentColor` 观感未验证；本批只断言属性与子节点结构。
5. **CSS 未做视觉验证**：`--font-ui` 补上后面板字体是否与主窗口一致、`is-above` 反向布局、`prefers-reduced-motion` 分支、`::-webkit-scrollbar` 分片、`min(100%, 400px)` / `min(96px, 36vh)` 的实机表现**全部未看**；`--font-ui` 之外的 **44 个 0.7.16 属性仍缺**（`--font-weight-ui` / `--side-panel-*` / `--canvas-*` / `--prompt-panel-*` 等），本仓 `variables.css` 仍是旧一代。
6. **未跑无障碍实测**：`role="toolbar"` / `role="switch"` / `aria-keyshortcuts` / `aria-checked` / `aria-busy` / `aria-live="polite"` 只按属性断言，屏幕阅读器与键盘 Tab 序未实测。
7. **未接 UI / 生产零引用**：`grep -rln "globalCaptureWindow" --include=*.js --include=*.cjs --include=*.html`（排除 `node_modules`）= **12 个文件，全部是该集群自身的交付与测试**（`globalCaptureWindow*.js` / `globalCaptureWindowPreload.cjs` / `globalCaptureControllers.js` / `ipc/textPresetIpc.js` 及其 `.test.js`）；`main.js` / `index.html` / `preload.cjs` **零命中、零改动**——面板渲染器在本仓**没有任何加载入口**，模块**未打包、未在 Electron 内运行**。
8. **R15 仍未完成**：本批补齐的是浮层捕获集群的**宿主侧文件**；渲染器侧桥（`globalCaptureReceiver.js` + `globalTextPresetBridge.js`）与整体装配序列仍未移植/接线，另有 chrome-shell 路径的 21 个零引用模块与 `web-preview/*` 5 条路由、`storage-migration/prepare` 待办。**本批不是 R01 验收，也不是 R15 完成。**

## 6. 约束复核

- 未 `git reset --hard` / `git clean` / 批量 checkout / 目录覆盖 / 重放旧 `apply_patch`；未清理任何 untracked 交付物。
- 未改 `api/freeImageHostApi.js`（本批未触碰 `api/`）；未改授权校验；未动 `D:\shuocancas` 安装版资源（asar 全程**只读**，无写句柄）；未全量替换 `style.css`；未自动提交/推送；未触发发布。
- 未在仓内写入任何 MCP 地址、会话 ID 或密钥；未写入绝对开发机路径——`docs/` 与源码中出现的临时目录路径仅作**取证记录**，运行时不依赖它们（`electron/globalCaptureWindow.js` 只 `import` 仓内相对路径）。
- 反混淆临时目录、`b66/*`、`asar-*`、`transform-b66.mjs`、`cmp-tokens.mjs` 全部只在 `~/.qoder/tmp/deobf-tools/`，**不在仓内**。
- 本批唯一对既有文件的改动是 `styles/variables.css` 追加 1 个自定义属性（纯追加、此前零消费方、零视觉影响），已在上文明确记账。
- 未新增 npm 依赖（渲染器只用相对 `import` + 全局 `document`/`window`/`requestAnimationFrame`；测试只用 `node:test`/`node:assert/strict`/`node:fs`/`node:path`/`node:url`）。

## 7. 下一步建议

**第 67 批：浮层捕获渲染器侧桥（`src/modules/app/globalCaptureReceiver.js` + `src/modules/app/globalTextPresetBridge.js`）**——这两个文件把「浮层动作」翻译成画布命令，是浮层捕获链在**渲染进程内的最后一环**。开工时需先核对三个依赖是否已在本仓存在：`src/modules/promptPresets.js`（`openQuickCapturePromptPresetDraft`）、`src/core/nodeRuntimeRegistry.js`、`src/core/stores/appStore.js`；若缺失则先补依赖（可能又是一次「前置依赖批」，参考第 65 批的处理方式）。

其后才是**装配序列**：把 `createGlobalCaptureControllers`（第 64 批）、`installGlobalShortcut`（Alt+C 的真实注册方，第 64 批已记账缺口）、`preload.cjs` 的 `globalCaptureWindow` 桥（第 64 批 preload 片段）与渲染器侧桥在 `main.js` / `preload` 里接成一条链——**那一批才应触碰 `main.js`**，并同步验收第 41 批的 4 条 `globalCaptureWindow:*` 通道与 `globalCaptureTextPreset*` 5 个桥键。

若先做**样式对齐**：把 0.7.16 `variables.css` 的另外 44 个缺失属性补齐（`--font-weight-ui` / `--text-emphasis` / `--surface-light-solid` / `--canvas-*` / `--side-plus-*` / `--prompt-panel-*` / `--side-panel-*` / `--control-*` 等），可一次性消除多个新版组件的「静默退默认值」问题；这批纯追加、可机器比对，风险低。
