# 右键菜单快捷键目录与 webPreview 远程输入队列（第73批）

本批补两件**渲染器侧缺失源件**，均取自 0.7.16 端口树 `C:\Users\luobote\.qoder\tmp\shuo-deobf\src\`：

1. `src/utils/contextMenuShortcutCatalog.js` + 其唯一依赖 `src/config/productFeatures.js`
2. `src/services/webPreviewRemoteInputQueue.js`

两件在本仓**生产零引用**（沿用第43/56/57/58/59/60/61/62/71/72批口径：宁可留白并记账，也不为了「有引用」而擅自接线）。

## 1. 缺口认定（含对台账旧表述的更正）

### 1.1 右键菜单快捷键目录整块缺失

- 本仓 `grep` `CONTEXT_MENU_SHORTCUTS` / `CONTEXT_MENU_SHORTCUT_IDS` / `isContextMenuShortcut` **全仓 0 命中**；`src/config/productFeatures.js` 文件不存在。端口树同名文件存在（`contextMenuShortcutCatalog.js` 12 577 B、`productFeatures.js` 54 B）。
- 端口消费者两处：`src/modules/shortcuts.js`、`src/services/webPreviewViewSyncService.js`。**两处在端口是新一代**，本仓对应文件为更早一代，故本批只补数据表与判定函数，不改既有 `shortcuts.js`。
- 台账 R17 与 §6（第55批后）均已点名欠项「`contextMenuShortcutCatalog`/`normalizeWebPreviewContextMenuShortcuts`」；本批补上的是**前者**，`normalizeWebPreviewContextMenuShortcuts` 属 `webPreviewViewSyncService.js` 的新一代导出，未在本批。

### 1.2 `webPreviewRemoteInputQueue.js` 是 webPreview 家族**唯一**缺失文件（已用文件名差集证明）

对端口 `src/`（1 550 个 js/cjs/html）与本仓 `src/`（693 个）做 `comm -23` 差集，得 1 044 个「仅在端口存在」的路径；再用 `webpreview|web-preview|chromeshell|chrome-shell|globalcapture` 过滤，**命中恰为 1 条**：

| 仅在端口存在 | 端口大小 | 本仓 |
| --- | --- | --- |
| `services/webPreviewRemoteInputQueue.js` | 1 543 B | 缺失 |

即：webPreview / chromeShell / globalCapture 三个家族的**文件名**在本仓已基本齐备（第56–72批逐批落地），缺的只有这个队列模块。其余 1 043 个差集文件集中在 `modules/storyWorkspace`、`modules/personReplacement`、`modules/storyboard3d`、`modules/runninghubAiApp`、`modules/collaboration`、`manifests/video/modelApi` 等**新一代重构抽取件**，对应 R04/R06/R08/R09/R10/R12/R22 等尚未开工范围，不在本批。

### 1.3 本批**有意不做**的部分（避免把「更新一代文件」当成「补缺失文件」）

| 未做事项 | 事实 | 为什么不并入本批 |
| --- | --- | --- |
| 用端口 `src/components/WebPreviewNode.js` 覆盖本仓同名文件 | 端口 38 600 B（美化后 1 103 行），本仓 861 行 / 37 906 B，**结构不同代**；端口多出 `_isRemoteBrowserSurface`/`_applySnapshot`/`_clearSnapshot`/`_requestLiveWebView`/`_disposeNativeTab` 等**整个远程浏览器表面**（本仓全 0 命中 `is-remote-browser-surface`/`dispatch-input`/`remote-snapshot`） | 本仓该文件是**在用的生产组件**（网页预览节点本体），整体覆盖属大范围 UI 重写，涉及约 17 个 import 目标；且必须在真实浏览器/Electron 内验证，本批无该授权 |
| 给本仓 `src/services/webPreviewViewSyncService.js` 补 2 个导出 | 端口 40 136 B / 本仓 30 189 B，**不同代**：端口还多 `import { readViewportInteractionState }`、`CONTEXT_MENU_SHORTCUT_IDS`、`getShortcutKeys`、`desktopBridge`，且 `FULLSCREEN_OCCLUSION_SELECTOR` 更长；缺 `collectWebPreviewContextMenuShortcuts`、`createWebPreviewNodeActivityTracker` 两导出 | 补两函数必须先连带补 `readViewportInteractionState`、`getShortcutKeys`（本仓 `src/modules/shortcuts.js` 无此导出）与整代 `webPreviewViewSyncService` 的同步逻辑，属「升一代」而非「补缺失」；同样须真实 UI 验证 |
| `desktopBridge.webPreview.surfaceMode` 消费方 | 第55批已落地该字段，本仓**零消费者** | 其消费点在端口 `WebPreviewNode.js` 的远程表面里，随上一行一并归入下一批 |
| 若按端口接线 `collectWebPreviewContextMenuShortcuts` | 端口由 `webPreviewViewSyncService.js` 调用并消费 `CONTEXT_MENU_SHORTCUT_IDS` | 本仓无该调用点；本批**不伪造消费方** |

## 2. 交付物与语义

| 文件 | 规模 | 来源 | 语义 |
| --- | --- | --- | --- |
| `src/config/productFeatures.js` | 57 B / 1 行 | 端口 54 B 逐字 | `SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED = false`（保留端口 `![]` 布尔惯用法） |
| `src/utils/contextMenuShortcutCatalog.js` | 13 351 B / 153 行 | 端口 12 577 B | `createShortcut(label, group, {hidden, disabled})` 产 `Object.freeze({label, keys: Object.freeze([]), group, contextMenuOnly: true, ...可选 hidden/disabled})`；`CONTEXT_MENU_SHORTCUTS` 冻结表 **123 条**；`CONTEXT_MENU_SHORTCUT_IDS = Object.freeze(Object.keys(...))`；`isContextMenuShortcut(id)` 走 `Object.prototype.hasOwnProperty.call` |
| `src/utils/contextMenuShortcutCatalog.test.js` | 8 896 B / 228 行 | 新增 | 9 项用例 |
| `src/services/webPreviewRemoteInputQueue.js` | 1 931 B / 53 行 | 端口 1 543 B | `createWebPreviewRemoteInputQueue({send})`（`send` 非函数 → `TypeError('Web preview remote input sender is required')`）→ `{enqueue, dispose}`；`isMouseInputType` / `mergePendingInput` 私有；`__webPreviewRemoteInputQueueForTest = {mergePendingInput}` |
| `src/services/webPreviewRemoteInputQueue.test.js` | 9 906 B / 284 行 | 新增 | 16 项用例 |

### 2.1 目录数据表（逐组核对）

| 分组 | 条数 |
| --- | --- |
| `右键菜单·画布` | 36 |
| `右键菜单·素材与文件` | 22 |
| `右键菜单·项目与工作区` | 20 |
| `右键菜单·功能面板` | 32 |
| `右键菜单·网页预览` | 13 |
| **合计** | **123** |

- 6 条 `context-workflow-*` 走 `createWorkflowShortcut`，因 `SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED === false` 而带 `hidden: true` + `disabled: true`；其余 117 条**不含**这两个键（`'hidden' in shortcut === false`，已测）。
- 每条 `keys` 是**各自独立**的冻结空数组实例（已测 `Set` 去重后仍为 123）。
- 转义空格条目照旧保留 `\x20`（如 `'画布：创建\x204\x20宫格'`、`'对齐：每行\x205\x20个'`），与端口同一字符串；渲染后与相邻条目的字面空格写法**不一致是端口原样**（端口本身就混用 `\x20` 与普通空格），未做统一。

### 2.2 队列语义

- `enqueue(input)`：已 `dispose` 或 `input` 为 `null`/falsy/非对象 → 返 `false`；否则**先拷贝** `{...input}`，再与**队尾**尝试合并：`mergePendingInput(队尾, 拷贝)` 为真则**替换**队尾，否则 `push`；最后踢一次 drain 并返 `true`。注意 `enqueue()` 无参时默认 `{}` **仍会入队**（默认参数只作用于 `undefined`，端口原样）。
- `mergePendingInput(prev, next)`：双方均为 `{kind:'mouse', type:'mouseMoved'}` → 返 `{...next}`；双方均为 `mouseWheel` → 返 `{...next, deltaX: (Number(prev.deltaX)||0)+(Number(next.deltaX)||0), deltaY: 同}`；其余一律 `null`。非鼠标 `kind` **永不合并**。
- drain：`sending` 守卫防重入，逐条 `await send(item)`，`try/catch` 吞掉发送失败并继续；`finally` 里复位 `sending`，若未 `dispose` 且队列非空则 `void drain()` 重新排空。
- `dispose()`：置 `disposed` 并把队列 `length` 置 0（**在途那条已 `shift` 出去，不会被打断**），幂等，之后 `enqueue` 恒 `false`。

## 3. 接线状态（诚实记录）

| 位置 | 状态 |
| --- | --- |
| `src/utils/contextMenuShortcutCatalog.js` 生产 import | **0**（全仓无 `CONTEXT_MENU_SHORTCUTS` 引用） |
| `src/config/productFeatures.js` 生产 import | 仅被上表的目录文件 import |
| `src/services/webPreviewRemoteInputQueue.js` 生产 import | **0**（端口唯一消费方是端口的 `WebPreviewNode.js`） |
| `main.js` / `mainIpcSetup` / `preload.cjs` | **零改动** |
| `src/modules/shortcuts.js`、`src/services/webPreviewViewSyncService.js`、`src/components/WebPreviewNode.js` | **零改动**（见 §1.3） |

## 4. 已执行的离线验证（本批，全部实际跑过）

1. `node --check` × 5（两个源码 + 两个测试 + `productFeatures.js`）→ 全 exit 0。
2. `prettier --check`（配置 `C:/Users/luobote/.qoder/tmp/deobf-tools/prettierrc.json`）→ 5 个文件全部 `All matched files use Prettier code style!`（`webPreviewRemoteInputQueue.js` 与 `.test.js` 首跑有格式告警，`--write` 后复检通过）。
3. 新测试 **25/25 通过**（目录 9 + 队列 16），`node --test --test-timeout=25000`，**首跑即全绿、实现零改动**。测试**未联网、未启动应用、未跑 Electron、未打开浏览器**：队列用例的 `send` 全为注入替身（一个"自动结算"替身 + 一个"手动结算"替身），用 `setTimeout(0)` 推进 drain。
4. `src/**` 全量 sweep（`--test-reporter=tap`）：**1 465 / 1 422 / 43**（第72批基线 **1 440 / 1 397 / 43**）→ **+25 项恰为本批新增**，43 项失败**逐项未变**（全部归因缺失夹具 `tests/testPreviewDom.js`，0.4.12 遗留，**不伪造**）。`electron/**` 与 `api/**` 本批零改动，未重跑。
5. 忠实性比对（端口 → 本仓）：
   - `productFeatures.js`：`cmp-tokens` **6/6，残差 0**。
   - `webPreviewRemoteInputQueue.js`：`cmp-tokens` port 370 / repo 381 / matched 361；端口独有 9 个 token = `"mouseMoved"`/`"mouseWheel"`/`'deltaX'`/`'deltaY'`/`'enqueue'`/`'dispose'`/`'mergePendingInput'`（**双引号与冗余对象键引号**）等；本仓独有 20 个 = 同类引号差异 + prettier 为逗号表达式补的 `(`/`)`/`,`。**无逻辑分歧**。
   - `contextMenuShortcutCatalog.js`：`cmp-tokens` port 1 278 / repo 1 287 / matched 1 173。因字面量级比对更能定性，另用 `cmp-lits.mjs`（新增于反混淆工具目录）逐条抽取两侧字符串字面量集合：**端口独有仅 5 个**（`label`/`group`/`contextMenuOnly`/`hidden`/`disabled`，即 prettier 按 `quoteProps: as-needed` 去掉的冗余键引号），**263 − 5 = 258 恰等于本仓唯一字面量数**；**123 个 id、123 个 label、5 个分组名、报错文案全部逐字一致**（端口把部分 label 写成双引号、部分写单引号，prettier 统一为单引号，属格式差）。
6. 工作树快照 `staged=0 modified=67 untracked=415 conflicts=0`（第72批落盘后 `0/67/410/0`，**+5** 与本批 5 个新文件逐一相符；本专题文档落盘后为 `0/67/416/0`）。

## 5. 未执行验收（不得当作已完成）

1. **目录未在真实右键菜单渲染**：`CONTEXT_MENU_SHORTCUTS` 的 label/group 只被断言为字符串，未在设置界面的快捷键列表里显示过；`contextMenuOnly: true` 的语义（不进全局快捷键表）无运行证据。
2. **`\x20` 与普通空格混用在真实 i18n/DOM 渲染下是否视觉一致**未验证（本批只锁定字符串本身）。
3. **队列未在任何真实输入路径上跑过**：`enqueue`/drain 的替身 `send` 不涉及真实 IPC、真实 CDP `Input.dispatchMouseEvent`、真实背压；`mergePendingInput` 对真实指针事件的合并率（尤其滚轮 delta 累加在真实帧率下的表现）无证据。
4. **远程浏览器表面整体不可达**：`desktopBridge.webPreview.surfaceMode` 仍零消费者，`dispatch-input` 动作在宿主侧（第59批 `chromeShellWebPreviewManager`）是否已支持未验证。
5. **`SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED` 固定为 `false` 是否与产品当前策略一致**未核对（端口随包值即 `![]`，本批照抄）。

## 6. 约束复核

- 本批**未触碰**：授权校验、`api/freeImageHostApi.js`（工作树手写版）、安装版资源（`D:\shuocanas` 全程只读）、`style.css`、`src/i18n/messages/*.js`、`package.json` 依赖、CI 工作流。
- **未**自动提交/推送/触发发布；**未**运行测试套件之外的应用启动、构建或真实服务调用；**未**新增 npm 依赖（本批零依赖，纯标准 ESM）。
- 新文件不含绝对开发机路径、不含临时目录依赖、不含 MCP 地址/会话 ID/密钥；无内嵌 PowerShell/C#。
- `src/**` 沿用本仓既定的"就地反混淆"命名口径（局部变量保留 `_0x`、导出名语义化、内部成员用 `['x']` 访问、`!![]`/`![]` 布尔惯用法、hex 字面量保留、`\x20` 保留），与第55批 `src/services/desktopBridge.js`、`src/services/chromeShellStartupReadiness.js` 一致——**与 `electron/**` 新移植件用全语义名的口径不同，这是本仓两类文件的既有差异，不是本批的分歧**。
- 属性键、字符串、数字**均未改名**；prettier 仅在语法等价前提下移除冗余键引号（§4.5 已用字面量集合证明）。

## 7. 下一批建议

**推荐（可离线验收、无行为变更风险）**：继续把 R15 渲染器半边补到"文件名齐备"：

1. `src/utils/contextMenuShortcutCatalog.js` 的**真实调用点**——即把本仓 `src/modules/shortcuts.js` 升到能消费 `CONTEXT_MENU_SHORTCUT_IDS` 的一代（须先核对端口 `shortcuts.js` 与本仓多出/缺少的键，避免改动本仓既有「截图快捷键同步」等定制）；
2. `src/services/webPreviewViewSyncService.js` 升到新一代（连带 `readViewportInteractionState`、`getShortcutKeys`、`contextMenuShortcutCatalog` 三个前置），补 `collectWebPreviewContextMenuShortcuts` + `createWebPreviewNodeActivityTracker`；
3. 最后才是 `src/components/WebPreviewNode.js` 的远程浏览器表面（`is-remote-browser-surface`/`remote-snapshot`/`dispatch-input`/远程指针·滚轮·按键），**这一批必须同时给出真实浏览器 UI 验收计划并单独获授权**（它是本仓在用的生产组件）。

**另一条可选主线**：R15 的 `main.js` 最终装配（第72批已备齐 13 个依赖）。**风险提示不变**：一旦接通，打包 win32/darwin 将默认走 chrome-shell，必须同时给出真实 Electron 端到端验收计划并单独获授权（本仓 CI 会从可读树构建 mac arm64 并 `gh release upload`，接通前须确认是否符合预期）。

**仍欠（非本链，可另批）**：`web-preview/*` 5 条路由的渲染器侧消费点、`storage-migration/prepare`、`styles/variables.css` 里 44 个未移植的 0.7.16 CSS 自定义属性。
