# 浮层捕获接收器与节点运行时解析器（R15 第 67 批）

本批交付 `src/modules/app/globalCaptureReceiver.js`（**新增**，捕获事件的领取/去重/应答状态机）与 `src/core/nodeRuntimeRegistry.js`（**既有文件加 2 个方法** `registerResolver` / `resolve`）。两者都是「渲染器侧桥」`src/modules/app/globalTextPresetBridge.js` 的**前置依赖**，而后者本批**有意不移植**——它的 `import` 闭包里有 1 个本仓尚缺的大件（`promptPresets` 快捷捕获预设设置子系统），见 §7。

## 1. 缺口：为什么是这一批，以及为什么不是「桥本身」

第 66 批专题文档 §7 与台账把第 67 批点名为「渲染器侧桥对（`globalCaptureReceiver.js` + `globalTextPresetBridge.js`）」。本批在动工前先做了一次 `import` 闭包核对（取源＝反混淆树 `shuo-deobf/`，口径同第 56–66 批），结果**否掉了原计划的一半**：

| 桥的 `import` 目标 | 本仓状态（本批实测） | 结论 |
| --- | --- | --- |
| `../../core/stores/appStore.js` | **存在**，与端口源**逐行等价**（仅 prettier 排版差异） | 就绪 |
| `../../core/nodeRuntimeRegistry.js` | 文件存在，但**缺 `resolve` / `registerResolver`**（仓内 `grep -c resolve` = 0，端口源 = 1） | 本批补齐 |
| `./globalCaptureReceiver.js` | **不存在** | 本批补齐 |
| `../promptPresets.js` 的具名导出 `openQuickCapturePromptPresetDraft` | 文件存在（1 104 行 / 87 418 B），但**该导出不存在**（`grep -c` = 0；端口源 1 命中） | **本批不补**，见 §7 |

**关键发现**：`promptPresets.js` 在本仓与 0.7.16 之间已**大幅漂移**（87 418 B vs 112 727 B，约 +29%），而 `openQuickCapturePromptPresetDraft` 不是孤立的 2 行函数——它的依赖闭包是一个**完整设置子系统**（§7 给出逐项清单），且要改的是本仓**活的 1 104 行 UI 文件**与 `api/promptPresetsApi.js`。把它塞进本批会让一个「纯 Node 离线可验证的前置批」变成「跨 UI/设置面板/API 路由的混装批」。

因此本批**只取两个闭包干净、零 UI 风险的前置件**，并按既有口径记账留白：

- `globalCaptureReceiver.js` **自身零 `import`**（只依赖 `globalThis['crypto']['randomUUID']`、`Map`、`Date`），可独立移植与独立验证；
- `nodeRuntimeRegistry.js` 的升级是**严格超集**（现有 4 个方法逐字节未动，只新增 2 个），对仓内 4 个既有消费者（`rendererNodeRuntimeBridge.js`、`canvasCommands/commandContext.js`、`canvasCommands/generationCommands.js`、`storyWorkspace/StoryWorkspaceEditor.js`）**零行为影响**。

这三件套（接收器 + 解析器 + 已就绪的 appStore）落地后，第 68 批移植 `globalTextPresetBridge.js` 时**只剩 `promptPresets` 一个缺口**。

## 2. 交付物

### 2.1 源码清单

| 文件 | 行数 | 字节 | 端口源 | 改名 | 品牌改写 |
| --- | --- | --- | --- | --- | --- |
| `src/modules/app/globalCaptureReceiver.js`（**新增**） | 60 | 2 226 | 1 721（`shuo-deobf/src/modules/app/`） | 17 个 `_0x` 名（66 处） | 0 |
| `src/core/nodeRuntimeRegistry.js`（**既有，+20 行 / -1 行**） | 55 | 2 077 | 1 738（`shuo-deobf/src/core/`，同路径） | 新增代码用语义名；**既有 4 方法 + 2 辅助函数逐字节未动**（唯一改动行＝为新增第二个 `Map` 而重写的 `const` 声明） | 0 |
| `src/modules/app/globalCaptureReceiver.test.js`（**新增**） | 516 | 19 208 | — | — | — |
| `src/core/nodeRuntimeRegistry.test.js`（**新增**） | 249 | 10 009 | — | — | — |

端口源是**单行压缩件**，仓内文件的多行形态全部来自 prettier 排版，**语义零改写**（见 §4.1）。接收器 `export function createGlobalCaptureReceiver({ api: api, handle: handle, capacity: capacity = 0x40 } = {})` 是**唯一导出**，`0` 个 `import`。

### 2.2 `createGlobalCaptureReceiver` 契约（实现即规格）

入参 `{ api, handle, capacity = 0x40 }`；出参 `{ receive, dispose }`。

- `receiverId` 在**工厂调用时**由 `globalThis['crypto']['randomUUID']()` 生成一次，此后每次 `api` 调用都复用同一个值。
- `receive(payload = {})`：
  - `disposed` 为真直接返回；
  - `eventId = String(payload['eventId'] || '')`，空串返回（**不做 `trim()`**——`'   '` 是**真值**，会被当成合法事件下发，见 §4.2 的改名更正）；
  - 命中 `pendingEvents` 的**在飞**记录 → 直接返回（不重复领取）；命中**已结算**记录 → 只**重放应答**（`acknowledgeEvent`），**不重新 `handle`**；
  - 容量控制：`pendingEvents['size'] >= capacity` 时，在 `[...pendingEvents]['find'](...)` 里淘汰**第一个**「非在飞 且（已应答 或 `expiresAt <= Date.now()`）」的键；**找不到候选就整个丢弃本次事件**；
  - 记录 `{ pending: !![], expiresAt: Number(payload['expiresAt']) || Date['now']() + 0x7530 }`（默认 30 000 ms 窗口）；
  - `api['claimEvent']({eventId, receiverId})` 的 `ok !== true` → 删除记录并返回，**不调 `handle`、不应答**（该项保持可重领）；
  - `disposed` 三元判断发生在 **`claimEvent` 之后、`handle` 之前**（本批实测确认的时序，见 §4.2）；
  - `handle` 结果归一为 `{ok: true}` 或 `{ok: false, reason: String(reason || 'action-failed'), retryable: Boolean}`；**`handle` 或 `claimEvent` 抛异常** → `{ok: false, reason: 'delivery-uncertain', retryable: false}`；
  - 结算后 `entry['pending'] = ![]`，再 `acknowledgeEvent`。
- `acknowledgeEvent(eventId, record)`：`api['acknowledgeEvent']({eventId, receiverId, ...record['outcome']})`；**抛异常被 `catch {}` 静默吞掉**；成功后置 `record['acknowledged'] = !![]`。
- `dispose()`：置 `disposed`、`pendingEvents['clear']()`；**幂等**，且此后所有 `receive` 直接返回。

### 2.3 `nodeRuntimeRegistry` 新增的 2 个方法

既有 `register` / `unregister` / `get` / `clear` / `normalizeNodeId` / `hasGenerationRuntimeMethod` **一行未改**。新增：

- `registerResolver(nodeType, resolver)`：`resolver` 非函数抛 `TypeError('Node runtime resolver must be a function')`（**该字符串逐字保留**）；成功则 `set` 并返回一个**退订闭包**——退订时只在「当前登记的仍是自己」才 `delete`（防止误删后续替换者）。
- `resolve(nodeId, options = {})`：
  - `normalizedId = normalizeNodeId(nodeId)`（**这里确实有 `trim()`**，与接收器相反）；
  - 先从 `options.store` 取节点记录：**优先** `getStateRaw()?.nodes?.[id]`，**回退** `getState()?.nodes?.[id]`；
  - 记录存在且其 `type` 有解析器 → `resolver(normalizedId, options)`（**第二个参数是整个 `options` 对象**，不是 store）；
  - 否则回退到按 nodeId 直登的 `runtimeByNodeId`；`normalizedId` 为空返回 `null`。

整套 `store` 访问用可选链，`store` 缺失/形状不符时**静默回退**，不抛异常。

## 3. 接线现状：有意不接线，生产零新引用

- **`globalCaptureReceiver.js` 生产引用数 = 1，且该唯一引用就是它自己的测试文件**（`grep -rln globalCaptureReceiver` 排除 `node_modules` 后仅 `src/modules/app/globalCaptureReceiver.test.js`）。它的真实消费者 `src/modules/app/globalTextPresetBridge.js` **本仓不存在**（`ls` 实测 ENOENT）。
- **`nodeRuntimeRegistry.js` 的 4 个既有消费者未做任何改动**；新增的 `resolve` / `registerResolver` 目前**零调用点**（`grep -rn registerResolver src/ electron/ api/` 排除测试后无生产命中）。
- 宿主侧链路**已存在且未动**：第 55 批的 `src/services/desktopBridge.js` 已暴露 `onSelectedText`（第 826、1 115 行附近），第 63 批的 `electron/globalCaptureControllers.js` 已装配 `globalTextPresetShortcutController`。也就是说**「主进程/桥 → 渲染器」的宿主半边在第 41/63/64 批已完成，缺的正是渲染器半边**——本批补了它的下半截（接收器 + 解析器），上半截（`globalTextPresetBridge`）留给第 68 批。
- 口径同第 43/56–66 批：**宁可留白并记账，也不为了「有引用」而擅自接线**。本批未改 `main.js`、未改 `preload`、未注册 Alt+C、未新建任何「消费者」。

## 4. 已执行的验证（离线，本窗口实测；未联网、未启动应用、未起浏览器、未跑 Electron）

### 4.1 命令与结果

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 语法 | `node --check` × 4 文件（2 源 + 2 测试） | 退出 0 |
| 排版 | `prettier --check`（`deobf-tools/prettierrc.json`）× 4 文件 | `All matched files use Prettier code style!` |
| 本批用例 | `node --test --test-timeout=20000` 两个测试文件 | **61 / 61 / 0**（接收器 35 + 解析器 26） |
| `src/**` 全量 | `node --test --test-timeout=25000 $(find src -name '*.test.js')` | **1366 / 1323 / 43** |
| `electron/**` | `node --test --test-timeout=25000 $(find electron -name '*.test.js')` | **1368 / 1367 / 1** |
| `api/**` | `node --test --test-timeout=25000 $(find api -name '*.test.js')` | **457 / 457 / 0** |
| 快照 | `git diff --cached/-name-only/--others/unmerged` 计数 | **0 / 60 / 392 / 0**（专题文档落盘后 untracked 为 **393**） |

- `src/**` 对照第 65 批记录的 **1305 / 1262 / 43**：**+61 通过 = 本批全部用例**，**失败数 43 未变**。`1366 − 61 = 1305`、`1323 − 61 = 1262`，逐项吻合。
- `electron/**` 与第 66 批记录**逐项相同**（1 368 / 1 367 / 1）；`api/**` 与第 58 批记录**逐项相同**（457 / 457 / 0）。本批未触碰 `electron/`、`api/`，两套数字属于**本批重跑复现**而非沿用。
- 快照对照第 66 批 **0 / 59 / 389 / 0**：`modified` **+1** = `src/core/nodeRuntimeRegistry.js`（本批唯一被编辑的**既有**文件）；`untracked` **+3** = 2 个新源/测试 + 1 个新测试，再加 1 份专题文档 = **393**。台账三份文档（`docs/implementation-handoff.md`、`docs/missing-features-review.md`、`docs/next-session-prompt.md`）在本仓**是 untracked 而非 modified**，故编辑它们**不移动 `modified` 计数**（第 65 批已实测更正，本批复核仍成立）。

### 4.2 首跑 4 项失败已逐一归因——**3 项是我的测试写错，1 项暴露了一个改名不忠实**

首跑 **59 / 55 / 4**。逐条定位：

1. `ignores a payload with no eventId …` 与 2. `trims the eventId before use` —— 二者同源。我原以为接收器会 `trim()`，于是把 `{eventId: '   '}` 列为「应被丢弃」、把 `'  evt-pad  '` 断言为 `'evt-pad'`。**实测反了**：端口源是 `const _0x341471 = String(_0x482d77["eventId"] || '');`——**根本没有 `trim()`**。我把它改名成 `normalizedEventId`，这个名字**暗示了一个不存在的行为**。已把改名更正为 **`eventId`**（更忠实），并把测试改为「**逐字保留、不裁剪**」+ 新增「**纯空白 `eventId` 是真值，会照常下发**」；`trim()` 只存在于**解析器**的 `normalizeNodeId` 里（§2.3）。
3. `an acknowledgement transport failure is swallowed` —— 我用 `api.acknowledgeEvent = async () => { throw … }` 直接**覆盖了记录器方法**，统计自然为 0。实现无误。已改用夹具的 `setAcknowledgeImpl(...)`（保留 `calls` 记录），并顺带把另外 4 处同类覆盖（淘汰与过期窗口用例）一并规范化。
4. `dispose during an in-flight handle acknowledges receiver-disposed and retryable` —— 我的**时序假设错**。实测确认：`disposed` 三元判断在 **`claimEvent` 之后、`handle` 之前**求值；因此「在 `handle` 在飞时调 `dispose`」**不会**产生 `receiver-disposed`，`handle` 的结果照常胜出。已拆成两个用例，把这个**真实语义（含时序怪癖）**固定下来：`dispose` 落在 **claim 在飞**窗口 → `receiver-disposed` 且**不调 `handle`**；落在 **handle 在飞**窗口 → **`handle` 结果胜出**。

**实现侧零改动**：4 项全部只改测试/改名映射，`globalCaptureReceiver.js` 的语义与 `nodeRuntimeRegistry.js` 的新增方法**未因失败而调整**。修正后 **61 / 61 / 0**。

### 4.3 忠实性用 token 级比对工具核对（非目测）

工具 `~/.qoder/tmp/deobf-tools/cmp-tokens.mjs`，比较对象为**同一 prettier 配置格式化后的端口源副本**（消除引号风格与尾逗号噪声）：

| 文件 | 端口 tokens | 仓内 tokens | matched | ONLY IN PORT | ONLY IN REPO |
| --- | --- | --- | --- | --- | --- |
| `globalCaptureReceiver.js` | 467 | 465 | 399 | 68（= 66 个 `V` + **2 个 `,`**） | 66（**全部是语义标识符**） |

- 66 个 `V` 与仓内 66 个语义名**逐位一一对应**（= 17 个改名映射的出现次数之和：3+2+3+8+4+3+2+3+2+4+8+4+3+4+6+2+5 = 66）。
- **2 个多出的 `,` 是 prettier 换行所致**：改名后标识符变短，两处调用刚好落回 `printWidth: 110` 以内，prettier 由「多行 + 尾逗号」折回单行，各少 1 个尾逗号。位置落在 `createGlobalCaptureReceiver({ … })` 签名与 `api['acknowledgeEvent']({ … })` 两处，**与第 66 批 `globalCaptureWindow.js` 的 2 个 prettier 尾逗号属同一类噪声**。
- 端口源 token 数 467 = 仓内 465 + 2，`matched = 399`，**没有任何非标识符 token 差异**（属性键、字符串字面量、数字、`0x` 十六进制、标点、`![]`/`!![]` 全逐字保留）。
- **解析器不做 token 比对**：它是**超集升级**（既有方法逐字节保留、`git diff --numstat` = `20 1`），比对无意义；改为逐行核对端口源的 `registerResolver` / `resolve` 两段与本批新增段，并已用 26 项用例逐条固定语义。

改名脚本 `transform-b67.mjs`（17 条映射 + 「0 命中即 throw」+ `_0x` / `Shuo` 双向残留守卫）与提取/比对脚本**全部只在临时目录，不在仓内**。

### 4.4 本批本仓改写 0 处

无品牌串、无中文文案改动（接收器与解析器都不含用户可见文案；唯一字符串字面量是 `'delivery-uncertain'` / `'action-failed'` / `'receiver-disposed'` 等**内部协议码**与 `TypeError` 消息，全部逐字保留）。

### 4.5 更正：`src/**` 的 43 项失败**不全是**缺失夹具

此前台账（第 55/65 批）把 `src/**` 的 43 项失败概括为「全部是缺失夹具 `tests/testPreviewDom.js`」。本批逐文件统计后确认该概括**不准确**，实测构成是：

| 类别 | 数量 | 代表文件 |
| --- | --- | --- |
| `ERR_MODULE_NOT_FOUND`（缺 `tests/testPreviewDom.js`） | **10** | `AIGenAudioNode`、`AIGenVideoNode`、`aigenImage/taskOrchestrationModule`、`aigenText/taskOrchestrationModule`、`aigenText/uiModule`、`video-node/taskOrchestrationModule`、`loadingOverlay`、`previewMode`、`previewUploadEntry`、`previewUploadResult`（**逐一实测**，各 1 项） |
| `ERR_ASSERTION`：**按反混淆前源码写的正则契约测试** | **25** | `src/components/video-node/parameterPanelModule.officialLabel.test.js`（断言 `function getDreaminaProviderLabel(provider)`、`_buildVideoModelMenuHtml(activeModel = "")` 等**未改名源码**的文本，而本仓已改名，故必然不匹配） |
| `ERR_ASSERTION`：其余 | **8** | `projectPackage/fullProjectPackageSession.test.js`（4）、`aigenImage/multiResultStackBackplates.test.js`（2）、`MediaTaskHistoryPanel.test.js`（1）、`mediaTaskHistoryModel.test.js`（1） |

（`10 + 25 + 8 = 43`；`ERR_ASSERTION` 合计 `25 + 8 = 33`，`ERR_MODULE_NOT_FOUND` `10`，与按错误码统计的 `33 / 10` 一致。）

合计 **43**，与第 65 批的失败**总数相同**、**涉及同一批 15 个文件**。**本批两个文件贡献 0 项失败**（`grep -c` 于失败清单 = 0）。这些失败是**存量**（既不因本批引入、也不因本批修复），但**成因描述应予更正**，后续若处理需分两类：加固夹具 vs. 重写针对改名源码的正则契约。

## 5. 未执行的验收项（不得当作已完成）

1. **未跑真实 Electron**——接收器是纯 Node 用例（自带 `api` 替身），**从未在真实 `ipcRenderer` 桥下跑过**；`globalThis['crypto']['randomUUID']` 走的是 Node 的 WebCrypto，与 Electron 渲染进程的能力面是否一致**未验证**。
2. **未接 UI**——两件都是**生产零引用**，`globalCaptureReceiver` 的唯一消费者（`globalTextPresetBridge`）**本仓不存在**，`nodeRuntimeRegistry.resolve` **零调用点**；故在本仓 Electron 下**全不可达**。
3. **未验证 `resolve` 与真实 store 形状的匹配**——`resolve` 读 `store.getStateRaw()?.nodes?.[id]` / `store.getState()?.nodes?.[id]`；本仓 `src/core/stores/runtime.js` 是 23 行的 facade 装配层，**本批未追查 facade 是否真的暴露 `getStateRaw` / `getState` 且其返回含 `nodes` 映射**。可选链保证了「形状不符时静默回退到按 nodeId 直登」，**不会抛异常**，但「按 type 解析」这条路径在真实 store 下**是否能走通未验证**。
4. **未跑真实快捷键链路**——Alt+C 注册、`onSelectedText` 推送、`onGlobalShortcutStatus` 回执均未在真机触发。
5. **未打包**，61 项全是纯 Node 离线用例。
6. **未做容量/时钟的边界压测**——`capacity` 与 `expiresAt` 的用例全部用**冻结的 `Date.now`** 与**同步替身**驱动，未验证真实长时运行下的淘汰行为（如高频事件下的 map 增长曲线）。
7. **`0x40` / `0x7530` 等魔法数未做具名化**——按仓内既有口径**保留十六进制字面量**（与 `0x1e`/`0x10`/`0x12` 等一致），未引入常量名。

## 6. 约束复核

- 未 `git reset --hard` / `git clean` / 批量 checkout / 全量覆盖目录 / 重放旧 `apply_patch`。
- **唯一被编辑的既有文件是 `src/core/nodeRuntimeRegistry.js`，且是纯增量**（`git diff --numstat` = `20 1`；那 1 行删除是 `const _0x5f51a2 = new Map();` → 加第二个 `Map` 声明所必需的同一行重写；既有 4 个方法与其辅助函数**逐字节未动**）。未覆盖任何既有定制；`api/freeImageHostApi.js` 未触碰。
- 未改授权校验、未动安装版资源、未自动提交/推送、未触发发布。**未读写 `D:\shuocancas` 的任何字节**（本批端口源全部取自临时目录里的反混淆树，**未使用 asar 提取**）。
- 未把反混淆临时目录或开发机绝对路径写成运行时依赖（`import` 全部是仓内相对路径）。
- 未把 MCP 地址/会话 ID/密钥写入仓内任何文件。

## 7. 下一批建议（第 68 批）

**第 68 批 = 渲染器侧桥 `globalTextPresetBridge.js` + 其唯一缺口 `promptPresets` 快捷捕获预设设置子系统。**

桥本身是**单行压缩件 7 275 B**（反混淆树），其可读契约已在前批台账记录：`NODE_ACTION_CONFIGS`（4 项：`source-text` / `ai-text` / `ai-image` / `ai-video`，各带 `{type, textField, nameKey}`；`preset-draft` 在查表**之前**被特判）、`COPY_FAILURE_REASONS`（6 项 `Set`）、`DEFAULT_MOUNT_ATTEMPTS = 0x1e`（30）、`DEFAULT_MOUNT_DELAY_MS = 0x10`（16），以及 `waitForGlobalCaptureNodeMounted` / `installGlobalTextPresetBridge` 两个导出。三个 `import` 中的两个（`appStore`、`nodeRuntimeRegistry`）**本批已就绪**，`globalCaptureReceiver`（相对导入 `./globalCaptureReceiver.js`）**本批已落地**。

**唯一缺口 `promptPresets.js` 的逐项闭包清单（本批已勘定，供第 68 批直接施工）**：

| 需补的项 | 端口源规模 | 依赖 |
| --- | --- | --- |
| `openQuickCapturePromptPresetDraft(draftText)` | 2 语句（`@75415`） | 下面三项 |
| `loadPromptPresetSettings({force})` | 757 B（`@43919`） | 模块级状态 `promptPresetSettings` / `promptPresetSettingsLoaded` / `promptPresetSettingsLoadPromise`、`fetchPromptPresetSettingsFromServer`、`normalizePromptPresetSettings` |
| `getDefaultQuickCapturePresetNodeType()` | 112 B（`@44683`） | `promptPresetSettings['defaultQuickCaptureNodeType']` |
| `normalizePromptPresetSettings(settings)` | 260 B（`@43646`） | `PRESET_MANAGER_TABS`（仓内 `grep -c` = 0） |
| `openCustomPresetsManager` **升级** | 端口签名多出 `sourceNodeId` 与 `initialDraftTemplate` | 仓内现签名只有 `{ nodeType }`（`@852`），需扩参 |
| `api/promptPresetsApi.js` 补 2 个导出 | 仓内 1 228 B → 端口 1 480 B | `fetchPromptPresetSettingsFromServer`、`savePromptPresetSettingsToServer`（可能需配套宿主路由） |
| i18n 键 | — | `globalTextPreset.*`、`globalCapture.*`（桥内 `translate` 的取值键） |

**风险提示**：这一批要改的是本仓**活的 1 104 行 UI 文件**与设置面板（`openCustomPresetsManager` / `PRESET_MANAGER_TABS`），**不是纯新增**；建议第 68 批**先只补齐 `promptPresets` 侧闭包并加测试**（可作为 68-A），**再**移植桥（68-B），避免「新桥 + 改活 UI」同时落地而难以归因。

**备选的独立小批**（若第 68 批想先走低风险项）：`styles/variables.css` 还有 **44 个 0.7.16 自定义属性未移植**（第 66 批只补了 `--font-ui`；`--font-weight-ui`、`--text-emphasis`、`--canvas-*`、`--side-panel-*`(13)、`--side-plus-*`(7)、`--prompt-panel-*`(3)、`--control-*` 等），属**纯增量、零逻辑**的风格对齐批。
