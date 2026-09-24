# 上下文菜单图标与横向滚轮助手（R15 第 65 批）

本批移植 0.7.16 中 `electron/globalCaptureWindow.js`（浮层捕获面板渲染层）**必需的依赖链**共 4 个模块。
它们是捕获面板渲染层的前置条件，也是全项目共享的上下文菜单图标系统与横向滚轮滚动助手。

- 批次：第 65 批（R15「浮层捕获面板集群」的准备批）
- 移植源：`D:\shuocancas\SHUO Canvas\resources\app.asar` → `C:\Users\luobote\.qoder\tmp\shuo-deobf\`（webapp 层反混淆产物）
- 前置批次：第 63 批 `globalCaptureWindowController`、第 64 批 `globalCaptureControllers` + `globalCaptureWindowPreload.cjs`
- 本批**零品牌改写**，全部为纯标识符改名 + prettier 格式化

---

## 1. 缺口：为什么先补这 4 个模块

第 64 批已把主进程侧装配器（`createGlobalCaptureControllers`）落地。它的下游是捕获窗口的**渲染层** `electron/globalCaptureWindow.js`（12 406 B），而该文件的依赖在仓库中**完全不存在**：

```
electron/globalCaptureWindow.js
├── src/modules/interaction/contextMenuIcons.js   （缺失，71 B 再导出层）
│   └── src/components/contextMenuIcon.js          （缺失，1 194 B → 1 470 B）
│       └── src/utils/contextMenuIconCatalog.js    （缺失，5 290 B → 6 586 B）
└── src/modules/workspaceHorizontalWheel.js        （缺失，3 405 B → 4 149 B）
```

即：`globalCaptureWindow.js` 的两条 import 语句指向 4 个缺失文件（其中一条再导出一层）。
若不先补这 4 个文件，直接移植渲染层会得到一个 import 即失败的模块。

本批把这 4 个模块作为**独立可测单元**落地，使下一批移植 `globalCaptureWindow.js` 只剩 HTML/CSS 与接线工作。

---

## 2. 交付物

### 2.1 源码清单

| 仓库路径 | 字节（仓库） | 行（仓库） | 来源字节 | 说明 |
|---|---|---|---|---|
| `src/utils/contextMenuIconCatalog.js` | 6 586 | 182 | 5 290 | 40 个图标的形状表 + 4 个别名 + `resolveContextMenuIconDefinition` |
| `src/components/contextMenuIcon.js` | 1 470 | 37 | 1 194 | `createContextMenuIcon`：把形状表渲染成 SVG 元素 |
| `src/modules/interaction/contextMenuIcons.js` | 77 | 1 | 71 | 纯再导出层（`export { createContextMenuIcon } from '../../components/contextMenuIcon.js'`） |
| `src/modules/workspaceHorizontalWheel.js` | 4 149 | 96 | 3 405 | `scrollElementHorizontallyWithWheel` / `scrollClosestElementHorizontallyWithWheel` |

批次合计源码 **12 282 B / 316 行**（`wc -lc` 实测）。

### 2.2 模块契约

#### `src/utils/contextMenuIconCatalog.js`

- `ICON_ALIASES`（模块内私有，冻结）：`folder`/`open` → `folder-open`，`remove` → `delete`，`settings` → `edit`
- `ICON_SHAPES`（模块内私有，冻结）：40 个条目，值为 `[tag, attributes]` 数组
- `export const CONTEXT_MENU_ICON_IDS`：`Object.freeze(Object.keys(ICON_SHAPES))`，**键序即导出顺序**
- `export function resolveContextMenuIconDefinition(iconId)`
  - `String(iconId || '').trim()` → 空则 `null`
  - 先查别名再查形状表；命中返回**新对象** `{ id: resolvedId, shapes: ICON_SHAPES[resolvedId] }`（`shapes` 与目标条目同一个数组引用）
  - 未命中返回 `null`；**不区分大小写折叠**（`'TEXT'` → `null`）

实测形状表键序（40 项，供测试与文档对照）：

```
comment action add-to-canvas add-to-library archive unarchive audio cancel collage compare
copy cut delete details disable download duplicate edit enable favorite folder-open fullscreen
generated grid image model move paste reveal save save-as package-export select-all send
source text tone undo update video
```

注意两个**连字符 id**：`save-as`、`package-export`；以及 `folder-open` 既是 id 又同时是 `folder`/`open` 两个别名的目标。

#### `src/components/contextMenuIcon.js`

`export function createContextMenuIcon(iconId, { documentObject = globalThis['document'], size = 0x12, stroke = 'currentColor' } = {})`

- `documentObject` 无 `createElementNS` → `null`（**不抛异常**，纯 Node 可安全调用）
- 形状表查不到 → `null`，且**不创建任何元素**（先解析后建元素）
- 根 `<svg>`：命名空间固定 `http://www.w3.org/2000/svg`；固定属性 `viewBox="0 0 24 24"`、`fill="none"`、`stroke-width="1.8"`、`stroke-linecap="round"`、`stroke-linejoin="round"`、`aria-hidden="true"`
- `size` 同时作用于 `width`/`height`，默认 `0x12` = 18，写入前一律 `String(...)`
- 解析后的 id 同时写入 `data-context-menu-icon` 属性与 `svgElement.dataset.contextMenuIcon`；`dataset` 不存在时跳过后者
- 每个形状 → 一个命名空间子元素，按声明顺序 `appendChild`，属性同样 `String(...)` 化

#### `src/modules/interaction/contextMenuIcons.js`

单行再导出层。测试中以 `===` 断言其与 `../components/contextMenuIcon.js` 的导出为**同一函数引用**。

#### `src/modules/workspaceHorizontalWheel.js`

`export function scrollElementHorizontallyWithWheel(wheelEvent, scrollElement, { stopPropagation = false } = {})` → `boolean`

| 判定 | 行为 |
|---|---|
| `scrollElement` 为空 | `false`，不碰事件 |
| `scrollWidth - clientWidth <= 0` | `false` |
| 主导增量（`abs(deltaX) > abs(deltaY) ? deltaX : deltaY`）为 0/NaN | `false` |
| `deltaMode === 1`（行） | ×16 |
| `deltaMode === 2`（页） | ×`max(1, clientWidth)` |
| 其它 `deltaMode` | ×1 |
| 起点 | `max(0, min(maxScrollLeft, scrollLeft))`，负值按 0 处理 |
| 终点 | `max(0, min(maxScrollLeft, 起点 + 增量))` |
| 终点 == 起点 | `false`，**不调用** `preventDefault` |
| 发生滚动 | 写入 `scrollLeft`，调用 `preventDefault`；`stopPropagation` 仅在选项为真时调用 |

`export function scrollClosestElementHorizontallyWithWheel(wheelEvent, selector, { boundaryRoot = null, stopPropagation = false, preserveNestedScrollable = false, getComputedStyle = null } = {})` → `boolean`

- `wheelEvent.target.closest(selector)` 无结果 → `false`
- `boundaryRoot` 存在且不 `contains` 命中元素 → `false`
- `preserveNestedScrollable` 为真时先做**嵌套消费者探测**：从 `wheelEvent.target` 沿 `parentElement` 上溯，**停在命中元素（不含）**，逐个调用 `canConsumeWheelDelta`（模块内私有）
  - 探测源样式：显式 `getComputedStyle` → `target.ownerDocument.defaultView.getComputedStyle.bind(...)` → `globalThis.getComputedStyle`；三者都不是函数则**整体跳过探测**（不否决）
  - 某层可消费（`overflowX/Y ∈ {auto, scroll, overlay}` 且该轴还有剩余可滚动量）→ 放弃接管，返回 `false`
- 命中元素**自身**不会否决自己：上溯循环条件 `candidate !== boundary` 从 `target` 起步，`target === closest` 时立即退出 → 正常滚动

### 2.3 测试源码

| 文件 | 行（仓库） | 用例数 |
|---|---|---|
| `src/utils/contextMenuIconCatalog.test.js` | 136 | 9 |
| `src/components/contextMenuIcon.test.js` | 171 | 14 |
| `src/modules/workspaceHorizontalWheel.test.js` | 320 | 20 |
| 合计 | 627 | **43** |

`src/components/contextMenuIcon.test.js` 用**自建最小 DOM 桩**（`createElementNS`/`setAttribute`/`dataset`/`appendChild`）驱动真实工厂，不起浏览器、不加载 Electron。分组覆盖：

1. **再导出同一性** —— 1 例
2. **缺 DOM 兜底** —— `documentObject` 为 `{}` / `createElementNS: null` / `createElementNS: 'nope'` 三种都返回 `null`
3. **未知图标不建元素** —— 断言桩上 `created.length === 0`
4. **命名空间与固定属性** —— 根 `svg` 的 6 个固定属性逐项断言
5. **size/stroke 契约** —— 默认 18、显式 16、`0` 都按字符串写入；`stroke` 默认与覆盖
6. **id 落点** —— 别名 `remove` → 属性与 `dataset` 都写 `delete`；无 `dataset` 的文档只写属性
7. **形状展开** —— `comment` 两个 `path` 的顺序与 `d`；`action` 的数字属性 `'12'`/`'12'`/`'8.5'`；`grid` 的 `rect` 属性键集合
8. **全量扫掠** —— 对 `CONTEXT_MENU_ICON_IDS` 全部 40 个图标断言「子元素数 == 形状数」「子标签序列 == 形状标签序列」「`data-context-menu-icon` == 解析 id」，把两个模块的契约绑在一起
9. **每次调用都是新树** —— 根与子元素都不是同一引用

`src/utils/contextMenuIconCatalog.test.js`：冻结性、**40 项键序全量 `deepEqual`**、全量表结构完整性（每项非空 `[string, object]`，实测 0 条异常）、4 个别名映射与「别名复用目标数组引用」、别名不出现在 id 列表、6 种不可解析入参、trim 生效但大小写敏感、返回对象是新包装（`shapes` 同引用）、数字属性保持数字。

`src/modules/workspaceHorizontalWheel.test.js`：无元素/无溢出/无增量三种拒绝、基础滚动、`stopPropagation` 开关、主导轴判定（横 vs 纵两向）、三种 `deltaMode` 的倍率（含 `clientWidth = 0` 时页模式退化为 ×1）、未知 `deltaMode` 按像素、两端边界拒绝、越界精确落在边界、负 `scrollLeft` 视为起点、`closest` 三种无命中、`boundaryRoot` 内外、`stopPropagation` 透传、嵌套消费者四例（横向拦截 / 到达滚动极限后放行 / 纵向拦截 / 未开选项则忽略）、自匹配不否决、无 `getComputedStyle` 源时跳过探测（该用例先断言 `typeof globalThis.getComputedStyle !== 'function'` 作为前置条件）。

---

## 3. 接线状态

**本批 4 个模块在仓库中目前零生产引用**（只有彼此之间与测试文件之间的引用）。

按既定准则「**宁可留白并记账，也不为了「有引用」而擅自接线**」，本批**没有**制造任何假消费者。理由与真实消费者清单如下。

### 3.1 直接消费者尚未移植

`electron/globalCaptureWindow.js`（12 406 B）是这 4 个模块的直接消费者，但它**尚未移植**——它还需要同时移植 `electron/globalCaptureWindow.html`（3 357 B，已从 asar 只读提取）与 `styles/global-capture-window.css`（5 424 B）。渲染层、样式、HTML 三者必须同批落地，否则窗口加载即失败。

### 3.2 0.7.16 中的真实消费者清单（供后续排期）

| 模块 | 0.7.16 中的消费者 | 仓库现状 |
|---|---|---|
| `src/modules/interaction/contextMenuIcons.js` | `src/modules/interaction/contextMenuPresenter.js`、`src/components/PanoramaSceneNode.js`、`src/components/media-clip/mediaClipMaterialMenuView.js`、`src/modules/collaboration/*`（7 个文件） | `contextMenuPresenter.js` 在仓库中存在但**未使用图标系统**（其菜单项无 SVG 图标） |
| `src/modules/workspaceHorizontalWheel.js` | `src/modules/app/appCanvasPointerBindings.js`、`src/modules/workspaceWheelNavigation.js`、`src/modules/nodeManager/NodeManagerPanel.js`、`src/modules/imageAnnotate/imageEditControls.js`、`src/modules/personReplacement/*`（2 个文件）、`electron/globalCaptureWindow.js` | `workspaceWheelNavigation.js` **在仓库中不存在**；`appCanvasPointerBindings.js` 存在但只处理滚轮缩放 |
| `src/components/contextMenuIcon.js` | 经上述再导出层，无直接消费者 | — |
| `src/utils/contextMenuIconCatalog.js` | 仅 `src/components/contextMenuIcon.js` | — |

即：这 4 个模块的消费者**全部属于尚未移植的 R15/R16 余量**（`globalCaptureWindow.js`、`workspaceWheelNavigation.js`、协作面板、人像替换工作区等），不存在「仓库里已有代码本可接线却空转」的情形。

### 3.3 本批未做的接线

- 未修改 `src/modules/interaction/contextMenuPresenter.js`（不让既有菜单渲染图标，属行为变更，需与菜单视觉一起验收）
- 未修改 `src/modules/app/appCanvasPointerBindings.js`（其滚轮分支是画布缩放，与横向滚动语义不同）
- 未创建 `workspaceWheelNavigation.js`（它自身还依赖别的模块，应与其整链同批）

---

## 4. 已执行验证

全部为**离线静态/单元验证**，在本机 `F:\CanvasPro` 内执行：

| 项 | 命令 | 结果 |
|---|---|---|
| 语法 | `node --check <7 个文件>` | 全部通过 |
| 本批单测 | `node --test --test-timeout=20000 src/modules/workspaceHorizontalWheel.test.js src/components/contextMenuIcon.test.js src/utils/contextMenuIconCatalog.test.js` | **43 / 43 通过，0 失败** |
| 全量 `src/**` sweep | `node --test --test-timeout=25000 $(find src -name '*.test.js')` | **1305 / 1262 / 43** |
| 格式 | `prettier --config <临时配置> --check <7 个文件>` | `All matched files use Prettier code style!` |

**sweep 差量核对**：本批前记录为 **1262 / 1219 / 43**，本批后为 **1305 / 1262 / 43**。
- 通过数 +43 = 本批新增 43 例，**与新增用例数完全相等**
- 失败数 **43 未变** —— 即既有的 43 例失败（全部源于仓库中不存在的 fixture `tests/testPreviewDom.js`）零变化

> 未执行：GUI/Electron 运行时、真实浏览器渲染、任何构建/打包/联网调用。**本批不声称任何运行时结论。**

### 4.1 保真度核对

工具：`C:\Users\luobote\.qoder\tmp\deobf-tools\cmp-tokens.mjs`（归一化注释、`!![]`/`![]`、`0x` 与 `\x20` 转义、`_0x[0-9a-fA-F]+` → `V`、`['x']` → `.x`）。
比较对象为**同一份 prettier 配置格式化后的移植源副本**（`b65/pretty/`），以消除引号风格与尾逗号造成的噪声：

| 文件 | 移植 tokens | 仓库 tokens | 命中 | ONLY IN PORT | 其中 `V` | ONLY IN REPO（语义名） |
|---|---|---|---|---|---|---|
| `src/utils/contextMenuIconCatalog.js` | 1401 | 1401 | 1389 | 12 | **12（全为 `V`）** | 12 |
| `src/components/contextMenuIcon.js` | 244 | 244 | 216 | 28 | **28（全为 `V`）** | 28 |
| `src/modules/interaction/contextMenuIcons.js` | 7 | 7 | 7 | 0 | 0 | 0 |
| `src/modules/workspaceHorizontalWheel.js` | 799 | 799 | 688 | 111 | **111（全为 `V`）** | 111 |

- 四份文件两侧 token 总数**逐一相等**；`ONLY IN PORT` 集合 100% 是 `V` 占位符，且与 `ONLY IN REPO` 的语义名**逐位一一对应**（12↔12、28↔28、0↔0、111↔111）
- `ONLY IN PORT` 中**没有任何非标识符 token** —— 即属性键、字符串字面量、数字、标点、`\x20` 转义全部逐字保留
- 对照：直接拿**未格式化**的压缩源比较会出现大量 `"..."` vs `'...'` 差异（如目录表 1357 vs 1401），这些差异**全部来自 prettier 的引号统一**，而非改名；故以格式化副本为准

### 4.2 改名账目

| 文件 | 语义名映射数 | 品牌改写数 | `_0x` 残留 | `Shuo`/`SHUO` 残留 |
|---|---|---|---|---|
| `src/utils/contextMenuIconCatalog.js` | 4 | 0 | 0 | 0 |
| `src/components/contextMenuIcon.js` | 10 | 0 | 0 | 0 |
| `src/modules/interaction/contextMenuIcons.js` | 0 | 0 | 0 | 0 |
| `src/modules/workspaceHorizontalWheel.js` | 34 | 0 | 0 | 0 |
| **合计** | **48** | **0** | **0** | **0** |

改名脚本 `transform-b65.mjs` 对每个映射带「无命中即抛错」守卫，并在写盘前对 `_0x[0-9a-fA-F]+` 与 `Shuo|SHUO` 做残留守卫——两者均未触发。

> `src/modules/interaction/contextMenuIcons.js` 与移植源**仅 token 相同**，**不是字节相同**：prettier 在其中插入了分隔空格（源 71 B → 仓库 77 B）。

---

## 5. 尚未执行的验收项（后续批次接手）

1. `electron/globalCaptureWindow.js` + `globalCaptureWindow.html` + `styles/global-capture-window.css` 三件套移植与真实接线
2. `globalCaptureWindow.html` 中的 `title: '发送到 Shuo Canvas 无限画布'` → `AI CanvasPro` 品牌改写（**本批不涉及**，该文件未移植）
3. 捕获面板在真实 `BrowserWindow` 中的 `didPresent` / `setExpanded` / `chooseAction` 端到端联调（需运行授权）
4. `createContextMenuIcon` 的 SVG 在真实 DOM 中的渲染外观确认（需 GUI）
5. `scrollClosestElementHorizontallyWithWheel` 在真实触摸板/滚轮设备上的手感与 `preserveNestedScrollable` 实测（需 GUI）
6. `contextMenuPresenter` 接入图标系统后的菜单视觉回归
7. 第 64 批遗留的两项前置缺口（本批**未**触碰）：`globalTextPresetShortcutController` 的 `globalShortcutApi` 无注入者、生产路径无 `installGlobalShortcut` 调用者

---

## 6. 约束复核

- 本批**只新增文件**，未修改任何既有文件；`git diff --cached = 0`、`git diff = 58`（与本批前一致，均为既有未提交改动）
- 未触碰 `api/freeImageHostApi.js`（用户手写保留版）
- 未触碰 `D:\shuocancas`（只读 asar 提取产物在临时目录）
- 未提交、未推送、未运行构建/测试以外的联网或真实 AI 调用
- 未批量改写 `style.css`，未改动授权校验
- 未制造假消费者；4 个模块当前零生产引用这一事实已在 §3 明确记账
- 临时脚本与提取产物全部留在 `C:\Users\luobote\.qoder\tmp\`，未成为仓库运行时依赖
- 未执行 `git reset --hard` / `git clean` / 批量 checkout，未清理任何未跟踪交付物

---

## 7. 下一步建议

**第 66 批**：移植 `electron/globalCaptureWindow.js`（12 406 B）+ `electron/globalCaptureWindow.html`（3 357 B）+ `styles/global-capture-window.css`（5 424 B）三件套，并接入第 63/64 批已落地的主进程侧链路。

届时需要处理：
- HTML 中的品牌字符串改写（`发送到 Shuo Canvas 无限画布` → `AI CanvasPro`）——**这是本集群唯一的品牌改写点**
- `styles/global-capture-window.css` 的引入方式（HTML 已 `link` 它，需确认仓库静态资源服务路径）
- `electron/main.js` 中是否把第 64 批的 `createGlobalCaptureControllers` 装配器正式替换掉第 252–263 行的内联等价写法

第 66 批落地后，捕获面板集群即可端到端自洽，再考虑 §3.2 表中的其余消费者（`workspaceWheelNavigation.js`、协作面板、人像替换工作区）。
