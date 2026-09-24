# 文本预设快捷捕获：设置子系统与渲染器桥（R15 第 68–69 批）

本文件覆盖两批前后咬合的交付：**第 68 批**（渲染器侧桥的最后一个缺口——`promptPresets` 快捷捕获预设设置子系统 + 其宿主路由与前端 API）与**第 69 批**（桥本体 `globalTextPresetBridge.js` 及其 i18n 文案）。两批合起来闭合「宿主半边（第 41/63/67 批）↔ 渲染器半边」这条链的**源码层**，但**产品层仍不可达**（原工程体系尚未按新版装配序列接线，见第 5 节）。

---

## 1. 第 68 批：为什么先补 `promptPresets` 侧闭包

第 67 批台账点名下一批为「渲染器侧桥对」，并勘定桥的四个导入目标里唯一缺口是 `../promptPresets.js` 的具名导出 `openQuickCapturePromptPresetDraft`。动工前核对端口源（`C:/Users/luobote/.qoder/tmp/shuo-deobf/src/modules/promptPresets.js`，112 727 B）确认该导出依赖一条**设置子系统**闭包：

- `openQuickCapturePromptPresetDraft(text)` → `loadPromptPresetSettings()` + `getDefaultQuickCapturePresetNodeType()` + `openCustomPresetsManager({nodeType, initialDraftTemplate})`
- `loadPromptPresetSettings({force})` → 模块态 `promptPresetSettings` / `promptPresetSettingsLoaded` / `promptPresetSettingsLoadPromise` + `normalizePromptPresetSettings()`
- `normalizePromptPresetSettings()` → `PRESET_MANAGER_TABS`（仓内原本 0 命中）
- `openCustomPresetsManager` **扩参**：`initialDraftTemplate`（仓内原签名只有 `{nodeType}`）+ 预设栏星标（右键设为全局复制文本默认预设栏）
- `api/promptPresetsApi.js` 缺 `fetchPromptPresetSettingsFromServer` / `savePromptPresetSettingsToServer`
- 宿主路由 `GET|POST /api/v2/user/presets/settings` **全仓不存在**

### 1.1 先做宿主路由勘定（避免移植出死路）

移植前端 API 前先查后端：本仓 `json_file_route_service` 的 GET 分支**显式排除** `/api/v2/user/presets` 前缀，`library_file_route_service` 没有 settings 分支 ⇒ 若只移植 `api/promptPresetsApi.js` 的两个新函数，它们会**恒 404**。故第 68 批同时补宿主：

- `backend/services/library_file_route_service.py`（+48 行）：新增 `_PRESET_SETTINGS_FILENAME = "settings.json"`、`_preset_settings_path()`、`_normalize_quick_capture_node_type()`、`_read_preset_settings()`、`_save_preset_settings()`，并在 `handle_get` / `handle_post` 各加一条分支。读写落在 `<user_dir>/prompt/settings.json`，**只暴露一个键** `defaultQuickCaptureNodeType`（非法值一律收敛为 `''`），未知键丢弃，坏 JSON / 非对象载荷 → `json_err 400`。
- `backend/services/http_route_dispatcher.py`（+1 行）：把 `"/api/v2/user/presets/settings"` 加入 `library_file_post_paths` 元组，保证 POST 体在 library 分支前被读取；实测 library POST 分支（第 413 行附近）早于 `json_file_route_service.handle_post`（第 433 行附近），故 library 胜出，语义与 GET 侧一致。

### 1.2 渲染器侧交付（纯增量）

`src/modules/promptPresets.js`（`git diff --numstat` = `188 35`；1 104 → 1 257 行）：

- 导入扩为 `{deletePromptPresetFromServer, fetchPromptPresetSettingsFromServer, fetchPromptPresetsFromServer, savePromptPresetSettingsToServer, savePromptPresetToServer}`；
- 模块态新增 `promptPresetSettings` / `promptPresetSettingsLoaded` / `promptPresetSettingsLoadPromise` / `activePresetManagerOverlay` / `closeActivePresetManager`；
- 新增导出 `getPromptPresetCollectionLabel`、`isPromptPresetNodeTypeSupported`、`normalizePromptPresetSettings`（内部）、`loadPromptPresetSettings`、`getDefaultQuickCapturePresetNodeType`、`setDefaultQuickCapturePresetNodeType`、`__setPromptPresetSettingsForTest`、`openQuickCapturePromptPresetDraft`；
- `loadCustomPresets` 改为 `Promise.all([fetchPromptPresetsFromServer(), loadPromptPresetSettings()])`；
- `openCustomPresetsManager({nodeType, initialDraftTemplate})`：新增草稿预填（`initialDraftTemplate` → 指定目录的 draft 条目并选中）、目录按钮加星标 `★`（`dataset.nodeType` + `contextmenu` 设为默认 + 乐观更新与失败回滚、`aria-selected`/`aria-label`/`title`）、`closeActivePresetManager?.()` 先关旧浮层，**并修正一处既有不忠实**——函数尾原本不返回浮层（`(…, document.body.appendChild(_0x3446a8));`），端口源是 `return (…, _0x11e467);`，现已补 `return`（仓内既有调用方 `slashMenu.js`/`AIGenerateNode.js`/`AIGenTextNode.js` 均忽略返回值，零行为风险）。

`api/promptPresetsApi.js`（`+17/-0`；1 228 → 1 778 B）：新增 `fetchPromptPresetSettingsFromServer()`（`get('/api/v2/user/presets/settings', {provider:'local'})`，非对象载荷与传输失败均回落 `{}`）与 `savePromptPresetSettingsToServer({defaultQuickCaptureNodeType})`。

`src/i18n/messages/{zh-CN,en-US}.js`：`promptPresets.manager` 新增 4 键 `quickCaptureDefaultSet` / `quickCaptureDefaultFailed` / `quickCaptureDefaultAria` / `quickCaptureSetAria`（两语言各 4 行）。

`styles/modal.css`：新增 `.preset-manager-tab.is-quick-capture-default` 与 `.preset-manager-tab-star` 两条规则（`--indigo-50` / `--font-12` 均已存在于 `styles/variables.css`）。**注意**：端口构建的 CSS 未回收（反混淆树无 `styles/`），本仓两条规则是按类名与既有变量**自写近似**，非逐字移植。

`backend/services/test_preset_settings_route.py`（**新增，119 行 / 5 463 B / 10 项**）：源码级回归用例，覆盖 `/api/v2/user/presets/settings` 的 GET/POST 配对——默认空对象、非法 `defaultQuickCaptureNodeType`（未知 nodeType / 非字符串 / 空串）一律收敛为 `''`、未知键丢弃（只回传一个键）、坏 JSON 与标量载荷 → `json_err 400`、写入落在 `<user_dir>/prompt/settings.json` 且可回读、往返幂等。文件头与仓内既有 Python 测试同口径声明「仅用临时夹具，**有意不随源码交接执行**，运行须另行授权」。

### 1.3 第 68 批有意未移植（记账）

- `openCustomPresetsManager` 的 `sourceNodeId` 形参：其唯一消费者需要未移植的 `src/modules/presetCoverResolver.js`（5 818 B）及其 5 模块闭包；
- 端口源删除 `canCreateCustomPromptPreset` / `requestSubscriptionFromPresetManager` 门禁的改动：**授权相关，属保护面，不做**；
- `getPromptPresetThumbSrc` / `showPresetButtonPending` / `applyPromptPresetLeafTriggerMode` / 16 个新提示词模板常量 / 手动 `+` 按钮的触发模式改动。

---

## 2. 第 69 批：桥本体 `globalTextPresetBridge.js`

### 2.1 源码清单

| 文件 | 状态 | 规模 |
| --- | --- | --- |
| `src/modules/app/globalTextPresetBridge.js` | 新增 | 238 行 / 9 530 B（端口源 7 275 B / 单行压缩） |
| `src/modules/app/globalTextPresetBridge.test.js` | 新增 | 672 行 / 26 582 B / **43 项** |
| `src/i18n/messages/zh-CN.js` | 编辑（纯增量） | +19 行（两个新命名空间） |
| `src/i18n/messages/en-US.js` | 编辑（纯增量） | +19 行 |
| `docs/global-text-preset-bridge.md` | 新增 | 本文件 |

### 2.2 导出与契约（实现即规格）

**`waitForGlobalCaptureNodeMounted({nodeId, isNodeMounted, scheduleFrame, attempts = 0x1e})`**

- `nodeId` 先 `String(...)['trim']()`；空串或 `isNodeMounted` 非函数 → 立即 `false`，**一次都不探测**；
- 最多 `attempts`（默认 `0x1e` = 30）轮，每轮「探测 → 未就绪则等一帧」；
- **只有严格 `=== true` 才算就绪**（返回 `1` 不算）；
- 等待一帧 `waitForNextFrame`：优先注入的 `scheduleFrame`，否则 `globalThis['requestAnimationFrame']`，两条都不可用时由 `setTimeout(finish, 0x10)` 兜底；`finish` 幂等（`settled` 守卫 + `clearTimeout`）。

**`installGlobalTextPresetBridge({textPresetApi, showToast, translate, openDraft, executeCanvasCommand, isNodeMounted, isNodeGenerationReady, scheduleFrame, consoleObject, getCanvasIdentity})`**

- 无 `textPresetApi` → 直接返回 no-op `() => {}`；
- 默认注入面：`openDraft = openQuickCapturePromptPresetDraft`；`isNodeMounted` 走 `globalThis['window']?.['v2Renderer']?.['isNodeMounted']`；`isNodeGenerationReady` 走 `nodeRuntimeRegistry['resolve'](id, {store: appStore})?.['runGeneration'] === 'function'`；`scheduleFrame` 走 `window.requestAnimationFrame` 否则 `setTimeout(…, 0x10)`；`consoleObject = console`；`getCanvasIdentity = () => ''`；
- `translate` 缺省时退化为 `String(key)['replace'](/\{(\w+)\}/g, (m, k) => params[k] || '')`，即**原样吐出 i18n 键**（只有键里带 `{占位}` 时才会被替换）；
- 动作表 `NODE_ACTION_CONFIGS`（`Object['freeze']`）：`source-text → {type:'source-text', textField:'content', nameKey:'globalCapture.nodeNames.sourceText'}`，`ai-text` / `ai-image` / `ai-video → textField:'prompt'`；**`preset-draft` 在查表之前特判**；
- 画布一致性：进入处理时取一次 `getCanvasIdentity()` 存为闭包常量，后续用 `!disposed && canvasIdentity === getCanvasIdentity()` 判定；**创建完成后**与**生成 `.then` 回调内**各复核一次，变了就静默返回（不弹失败 toast）；
- `canvasIdentity` 变化的两种情形语义不同：**创建后变了** → 返回 `{ok: 创建结果.ok, reason: 创建结果.reason, retryable: false}`；**生成期间变了** → 外层已返回 `{ok:true}`，回调内直接 `return`（无 toast）；
- `runImmediately === true && actionId !== 'source-text'` 才触发立即生成（`source-text` 永远只建节点）；立即生成路径先弹 `globalCapture.preparingGeneration`（info），再 `node.create` → 等挂载/就绪 → `generation.run`，结果经 `.then`/`.catch` **异步**弹 `generationStarted`(success) / `generationFailed`(error)；
- `node.create` 失败时 `retryable = Boolean(errorCode && errorCode !== 'COMMAND_EXECUTION_FAILED')`，`reason` 取 `message || errorCode || error` 的 `trim()`，都为空则 `'node-create-failed'`；`ok === true` 但拿不到 nodeId（`result.nodeId` 或 `result.node.id`，会 `trim`）→ `'node-id-missing'`；
- 无 `executeCanvasCommand` 或动作不在表内 → `'canvas-command-unavailable'` / `'unsupported-action'`（后者不弹 actionFailed，单独弹 `globalCapture.unsupportedAction`）；
- 顶层 `try/catch`：意外异常 → `consoleObject['error']?.('[globalCapture]\x20failed\x20to\x20handle\x20selected\x20text', error)` + `globalCapture.actionFailed{reason}`，并归一为 `{ok:false, reason: String(error.message || error), retryable:false}`；
- 订阅：`textPresetApi['onSelectedText']` 的返回值是函数才计入 `disposers`；`onGlobalShortcutStatus` 处理 `registered === false && reason === 'registration-failed'` → `globalTextPreset.shortcutRegistrationFailed{accelerator 默认 'Alt+C'}`（warn），`registered === true && COPY_FAILURE_REASONS.has(reason)` → `globalTextPreset.noSelectedText`（warn），其余静默；
- 返回 disposer：`disposed = true` → `receiver.dispose()` → 逐个调用 `disposers`（幂等）。
- `COPY_FAILURE_REASONS` = 6 项 `Set`：`no-selection` / `no-selected-text` / `copy-command-failed` / `copy-command-timeout` / `unsupported-platform` / `capture-failed`。
- **投递语义复用第 67 批接收器**：`createGlobalCaptureReceiver({api: textPresetApi, handle: handleSelectedText})`，即 `claimEvent` 失败短路、在飞去重、已结算重放应答、结果经 `acknowledgeEvent` 回执——本节所有「返回 xx」的断言在离线测试里都从 `acknowledgeEvent` 的回执读出（`receive()` 自身 resolve `undefined`）。

### 2.3 i18n

新增两个命名空间（两语言各 19 行）：

- `globalTextPreset.noSelectedText` / `.defaultMissing` / `.shortcutRegistrationFailed`；
- `globalCapture.unsupportedAction` / `.preparingGeneration` / `.nodeAdded` / `.actionFailed{reason}` / `.generationFailed{reason}` / `.generationStarted` / `.nodeNames.{sourceText,aiText,aiImage,aiVideo}`。

逐字保留端口源里的 `\x20` 转义（如 `'选中文本\x20·\x20AI\x20图像'`、`'Creating\x20the\x20node\x20and\x20preparing\x20generation'`）与中文标题里的间隔号 `·`。

**有意未移植**：`globalTextPreset.openFailed`（端口源 `src/` 与 `main.js` 里 `grep` 均 0 命中，是 0.7.16 里的孤儿键；不为「凑齐命名空间」而添加无消费者文案）。

---

## 3. 接线现状：有意不接线，生产零新引用

- `globalTextPresetBridge.js` 的**唯一引用就是它自己的测试**；
- 真实消费者在新版 `main.js`（编译产物）里，调用形态实测为：
  `installGlobalTextPresetBridge({'getCanvasIdentity':()=>appProjectContext.getCurrentProjectId()+':'+CanvasTabManager.getActiveCanvasId(), 'textPresetApi':desktopBridge.textPreset.isAvailable()?desktopBridge.textPreset:null, 'showToast':(…args)=>window.showToast?.(…args), 'translate':translateAppText, 'executeCanvasCommand':(name,payload)=>executeCanvasCommand_2(name,payload,canvasCommand…), …})`；
- 本仓**缺三个装配前置**：①`executeCanvasCommand` **本仓不存在**（`src/core/interaction.js` 无该导出，`grep` 0 命中）；②`appProjectContext` / `CanvasTabManager` 组合出的画布身份与新版不同；③`translateAppText` 与 `desktopBridge.textPreset` 的可用性判定（`isAvailable()`）在本仓未接。故本批**不接线**，口径同第 43/56–68 批：**宁可留白并记账，也不为了「有引用」而擅自接线**。本批未改 `main.js`/`preload`、未注册 Alt+C。

---

## 4. 已执行的验证（离线，本窗口实测；未联网、未启动应用、未起浏览器、未跑 Electron）

### 4.1 命令与结果

- `node --check` × 2（桥源 + 测试）、`prettier --check`（`deobf-tools/prettierrc.json`）对桥源 / 桥测试 / `zh-CN.js` / `en-US.js` → `All matched files use Prettier code style!`
- `node --test --test-timeout=20000 src/modules/app/globalTextPresetBridge.test.js` = **43 / 43 / 0**
- `node --test --test-timeout=25000 $(find src -name '*.test.js')` = **1420 / 1377 / 43**
  （对上两批：第 67 批记录 1366/1323/43；第 68 批 +11 项（`promptPresets.test.js`）→ 1377/1334/43；本批 +43 → 1420/1377/43。**失败数 43 未变**，`1420−43=1377`、`1377−43=1334`、`1366+11=1377` 逐项吻合。）
- `node --test --test-timeout=25000 $(find api -name '*.test.js')` = **463 / 463 / 0**（第 58 批 457/457/0；第 68 批 `api/promptPresetsApi.test.js` +6 → 463/463/0）
- 本批未触碰 `electron/`，故 `electron/**` 沿用第 67 批的 **1368 / 1367 / 1**（唯一失败仍是 `electron/fullProjectPackageService.test.js` 的 R14 存量项），**未重跑**。
- **Python 侧只做语法检查，未执行任何用例**：`py -3 -c "import ast; ast.parse(...)"`（本机 `python`/`python3` 不在 PATH，`py -3` = Python 3.14.3；用 `ast.parse` 而非 `py_compile` 以免写出 `__pycache__`）对 `library_file_route_service.py` / `http_route_dispatcher.py` / `test_preset_settings_route.py` 三文件全部 **AST OK**。第 68 批的 `test_preset_settings_route.py` **10 项未执行**（文件头已声明须另行授权）。

### 4.2 首跑 15 项失败已归因——**全部是测试写错，实现侧零改动**

①**14 项同为根因**：我最初假设桥的 `onSelectedText` 包装器会把 `handle` 的结果返回出来（`const outcome = await deliver…; outcome.ok`），但第 67 批接收器的 `receive()` 本身**没有返回值**（结果只经 `acknowledgeEvent` 回执）。错的是**测试的取值路径**，不是实现：改为让夹具 `deliverSelectedText` 在投递后回读**该次投递新增的 `acknowledgeEvent` 载荷**（即真实回执），断言即恢复精确（`ok` / `reason` / `retryable` 全部对齐 `receive` 的归一规则）。
②1 项是我把 `generationFailed` 的原因写成 `'Error: renderer exploded'`：端口源码是 `String(_0x53ae73?.['message'] || _0x53ae73)`，`Error.message` 为真值故取 `'renderer exploded'`（没有 `Error: ` 前缀）。按实现改正。
③另有 2 项是我对夹具的 `translateCalls` / `commands` 断言写错（`commands` 只由**默认**画布命令记录，自定义替身不记录；`translateCalls` 在同一次处理里会先出现 `nodeNames.*` 再出现 `actionFailed`）。均按实现语义改正。

**合计：43 / 43 / 0。**

### 4.3 忠实性用 token 级比对工具核对（非目测）

`~/.qoder/tmp/deobf-tools/cmp-tokens.mjs`（比较对象为**同一 prettier 配置格式化后的移植源副本**，`b69/port-raw.js`）：

- 直接比对：port **1617** / repo **1618** / matched **1416**；`ONLY IN PORT` 201 条 = 199 个 `V` + 2 个 `,`，`ONLY IN REPO` 202 条 = 200 个语义标识符 + 2 个 `,`；
- **把两侧的裸标识符一律归一为 `ID` 后再比对**：port **1617** / repo **1618** / matched **1615**，**失配 run 仅 5 个、每个都是单个 `,`**（port 2 个 / repo 3 个）。即：**除 5 个逗号外，两侧 token 逐位一一对应，没有任何非标识符差异**（属性键、字符串字面量、数字、`0x` 十六进制、`\x20` 转义、标点、`![]`/`!![]` 全部逐字保留）。
- 那 5 个逗号是第 66/67 批同类的 **prettier `printWidth: 110` 行为**：改名后标识符变短，若干 `({…})` 调用与形参列由「多行 + 尾逗号」折回单行，**各少/多 1 个尾逗号**。
- 改名采用语义映射（例：`_0xf14e8f → commandResult`、`_0x250094 → finish`、`_0x3a9bf2 → nodeId`、`_0x1db9c1/_0x591d11 → actionId`、`_0x1a977c/_0x53ae73 → error`、`_0x28c306 → disposers`、`_0xaf3d70 → selectedTextUnsubscribe`、`_0x371f30 → shortcutStatusUnsubscribe`…），**未手工重打一个字符**；比对脚本 `b69/cmp-ident.mjs` 只在临时目录，**不在仓内**。

### 4.4 本批本仓改写 0 处

无品牌串、无中文文案改写：`globalTextPreset.*` / `globalCapture.*` 的文案是端口源**逐字**移植；桥里唯一的字符串字面量是内部协议码（`'canvas-command-unavailable'` / `'node-create-failed'` / `'node-id-missing'` / `'no-selected-text'` / `'unsupported-action'` / `'canvas-changed'` / `'node-not-ready'` / `'generation-failed'` / `'registration-failed'` / `'Alt+C'`）与 `'[globalCapture]\x20failed\x20to\x20handle\x20selected\x20text'` 日志前缀。

---

## 5. 未执行的验收项（不得当作已完成）

- **这不是 R01 验收，也不是 R15 完成。**
- **未在真实 Electron 渲染进程下跑**：43 项全是纯 Node 用例（注入 `textPresetApi` / `executeCanvasCommand` / `showToast` / `translate`）；`window.v2Renderer.isNodeMounted`、`requestAnimationFrame`、`window.showToast` 的**真实存在性未验证**。
- **未接 UI，且在本仓不可达**：生产零引用（第 3 节三个装配前置未备），故「Alt+C 划词 → 建节点 → 自动生成」在本仓**一次都走不通**。
- **未验证 `nodeRuntimeRegistry.resolve` 与真实 store 形状的匹配**（沿用第 67 批欠项）：`isNodeGenerationReady` 的默认实现依赖 `getStateRaw()?.nodes?.[id]`，本批仍只证明「形状不符时静默回退」，不证明「按 type 解析」在真实 store 下走通。
- **未跑真实快捷键链路**：Alt+C 注册、`onSelectedText` 推送、`onGlobalShortcutStatus` 回执（含 `selection-hook` 原生依赖）均未在真机触发；`COPY_FAILURE_REASONS` 的 6 个原因名**全部来自端口源字面量**，未与真实宿主回执比对。
- **未验证 `executeCanvasCommand('node.create' | 'generation.run')` 的真实契约**：本仓无该命令总线，`result.nodeId` / `result.node.id` / `placement:'viewport-center-sequence'` / `sequenceKey:'global-capture'` / `errorCode:'COMMAND_EXECUTION_FAILED'` 均为按端口源对齐的**约定**。
- **异步生成回执的时序未在真实渲染器下验证**（本批用 `setTimeout(0)` 收敛微任务）。
- **魔法数未具名化**：`0x1e` / `0x10` 按仓内口径保留十六进制字面量。
- **第 68 批的 UI 面未做浏览器验收**：预设栏星标、右键设默认、草稿预填都只有离线 DOM 契约测试，**未在真实页面点过**；`styles/modal.css` 两条规则是自写近似，未与端口构建的视觉比对。

---

## 6. 约束复核

- 未改授权校验（第 68 批**明确拒绝**移植端口源对 `canCreateCustomPromptPreset` / `requestSubscriptionFromPresetManager` 门禁的删除）。
- 未动安装版资源（`D:\shuocancas` 全程只读）、未自动提交/推送/触发发布。
- 未全量替换 `style.css`；未把反混淆临时目录或绝对开发机路径变成运行依赖（脚本全在 `~/.qoder/tmp/deobf-tools/`）。
- 未新增任何 npm 包；未伪造夹具；未删除任何既有文件（第 68 批的 `openCustomPresetsManager` 尾部是**加 `return`**，非重写）。

---

## 7. 下一批建议（第 70 批）

按新版装配序列，R15/R17 这条链在本仓的可达化还差**四步**（建议按此顺序，每步单独成批、单独验收）：

1. **`executeCanvasCommand` 命令总线**：新版从 `src/core/interaction.js` 导出，本仓无。需先界定 `node.create` / `generation.run` 两个命令的真实入参/返回契约（含 `placement` / `sequenceKey` / `errorCode`），否则桥即便接线也无处执行。
2. **画布身份**：`appProjectContext.getCurrentProjectId() + ':' + CanvasTabManager.getActiveCanvasId()` 的本仓等价物（本仓有 `CanvasTabManager` 吗？需核对 `src/modules/` 与 `src/core/stores/`）。
3. **`translateAppText` 与 `desktopBridge.textPreset.isAvailable()`**：第 55 批已移植 `src/services/desktopBridge.js`（含 `textPreset` 组），需核对 `isAvailable()` 的落地形态。
4. **装配**：在 `main.js` 调用 `installGlobalTextPresetBridge(...)` + 浮层捕获面板（`globalCaptureWindow*` 4 通道在第 41 批恒 `not-supported`）与 Alt+C 启动注册。

同时仍欠（非本链）：chrome-shell 的 21 个零引用模块、`web-preview/*` 5 条路由、`storage-migration/prepare`、`styles/variables.css` 里 44 个未移植的 0.7.16 CSS 自定义属性。
