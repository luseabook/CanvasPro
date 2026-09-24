# 第 111 批 · R12 依赖解锁：模型生成参数记忆（`src/modules/modelGenerationParamMemory.js`）

> 来源为 0.7.16 安装版反混淆端口，逐字保真落地。结论先说：**本批不构成任何用户可见行为完成**——该件在生产代码里**零引用**，未接线、未启动应用、未做真机验收。本批的意义是**解开 `src/modules/agent` 唯一 `BLK` 件 `agentModelControls.js` 的三个跨目录依赖之一**，并把该 BLK 链的真实代价量化记账（见 §6）。

## 1. 落地清单与核验计数

| 项 | 值 |
| --- | --- |
| 源码 | `src/modules/modelGenerationParamMemory.js` **49 行 / 2 679 B / 4 具名导出**（镜像端口排版前 2 375 B） |
| 本批暂存 | `C:/Users/luobote/.qoder/tmp/deobf-tools/b111/port/modelGenerationParamMemory.js` |
| 测试 | `src/modules/modelGenerationParamMemory.test.js` **301 行 / 12 156 B / 32 例**（本项目自研，非移植件） |
| `import` 语句 | **0 条** ⇒ 纯叶件，无 shim、无注入端口 |
| `cmp` 仓库 vs 暂存 | **1/1 IDENTICAL**（`prettier --write` 之后复测仍逐字节相同） |
| `node --check` | 源码 + 测试 **2/2 ok** |
| `prettier --check` | **2/2 通过**（仓库侧仍只命中基线已知未格式化两件 `agentSkillPackage.js`/`agentSkillPackage.test.js`，本批未触碰） |
| 落地前门禁 `b100/verify-exports.mjs` | 该件**零 import** ⇒ 门禁无依赖行可验，改为逐字读源码确认导出名 |
| `node --test` 单跑 | 首跑 **29/31**（2 处失败全为测试侧期望偏差）⇒ 补 1 例后 **32/32 全绿**，`prettier --write` 后复跑 **32/32**，**移植实现一字未改**。三处端口现状：目标模型无历史桶时仍会新建空桶条目、`undefined` 值被默认参数 `= ''` 吞成空串（故不能列入「不支持的值类型」）、原型污染键须用**计算键** `{['__proto__']: x}` 才真正打到分支 |
| 全量 sweep `find src -name '*.test.js'` | **3 359 tests / 3 316 pass / 43 fail**（第110批 3 327/3 284/43 ⇒ 恰好 **+32/+32/±0**）；失败名单与 `b85-fails.txt` **`diff-exit=0`**，43 项仍全部归属缺失夹具 `tests/testPreviewDom.js`，**未伪造**。产物 `b111/src.tap`、`b111-fails.txt` |
| 依赖闭包 `b95/deps-ast.mjs src/modules` | `port=915`；纯叶未落地 **138 → 137**（本件退出 LEAF 池） |
| 依赖闭包 `b95/deps-ast.mjs src/modules/agent` | `port=81 / LEAF=0 / OK=0 / BLK=1` ⇒ **`agentModelControls.js` 仍为 BLK**（三个依赖只补齐一个），**未伪造 shim** |
| 文件计数 | 全仓 `src/**` 测试 **275 → 276** 份；`src/modules` 非测试源码 **380** 件 / 测试 **195** 件 |
| 保护文件 | `api/freeImageHostApi.js` md5 仍为 `1e0458013f5341c99f21faefc1d34d3f`；本批未提交、未推送、未触发构建或发布 |

四个具名导出：`normalizeGenerationParams`、`normalizeGenerationParamsByModel`、`buildModelGenerationParamsSelectionPatch`、`buildActiveModelGenerationParamPatch`。

## 2. 契约

### 2.1 值与键的准入口径

`isPlainObject(v)` = `!!v && typeof v === 'object' && !Array.isArray(v)` ⇒ 数组、`null`、函数、`Map`、类实例一律视作「不可归一」，四个导出对它们都返回空结果而不抛错。
`isSupportedParamValue(v)` = `typeof` 为 `string` / `number` / `boolean` ⇒ `null`、`undefined`、对象、数组、函数、`bigint`、`symbol` 全部静默丢弃。
键侧：`String(key || '').trim()`，**只 trim 不改大小写**；`trim` 后为空即丢弃；命中 `UNSAFE_RECORD_KEYS = {__proto__, constructor, prototype}` 即丢弃。
数字额外闸门：`typeof v === 'number' && !Number.isFinite(v)` ⇒ `NaN`/`Infinity`/`-Infinity` 在归一里被丢弃（`0`、负数、`Number.MIN_VALUE` 保留）。
字符串值一律 `trim()`（trim 成空串仍然写入）。

### 2.2 四个导出的行为

| 导出 | 入参 | 返回 | 关键语义 |
| --- | --- | --- | --- |
| `normalizeGenerationParams(obj)` | 扁平参数表 | 新对象 | 逐键过 §2.1 闸门；键序按 `Object.entries` 插入序；不改写入参 |
| `normalizeGenerationParamsByModel(map)` | `{模型id: 参数表}` | 新对象 | 模型键走同一闸门；每个桶再各自 `normalizeGenerationParams`（**桶值非对象 ⇒ 保留模型键、桶置空**） |
| `buildModelGenerationParamsSelectionPatch(state, nextModelId)` | 会话/节点状态 + 目标模型 id | `{generationParams, generationParamsByModel}` | 先把「旧 `state.model` 的正文」写进其桶，再把「目标桶」读成正文；`state.model` 为空则**不写任何桶**；`nextModelId` 为空则正文为空对象 |
| `buildActiveModelGenerationParamPatch(state, key, value)` | 状态 + 单个参数键值 | 同上，或 `{}` | 键非法（空/污染）或值类型不支持 ⇒ **整条补丁为 `{}`**；否则「归一后的旧正文 + 新键」并回写当前模型桶 |

两个 `build*Patch` 都**只返回这两个键**，不含 `model` ⇒ 切换模型时调用方必须自己写回 `model` 字段，否则正文与桶会指向同一份参数而模型 id 仍是旧值。

## 3. 本批实际执行的检查 / 明确未执行的检查

已执行（全部离线、无网络、无磁盘写入、无进程、无真实 AI 调用）：端口 → 暂存 → 仓库 `cmp`；`node --check` 2/2；`prettier --write` + `--check` 2/2；`node --test` 单跑 32/32；全仓 `src/**` sweep 3 359/3 316/43 且失败名单与基线 `diff-exit=0`；`b95/deps-ast.mjs` 双目录闭包复测（`src/modules` 与 `src/modules/agent`）；仓库与镜像消费者 `grep`；保护文件 md5 与 `git status` 归因。

**未执行**（不得当作已验证）：该件在仓库里**没有任何生产调用方**，故「切换模型时参数是否真的跟随」「同一模型重复切回是否丢参数」「参数记忆是否真的落盘」三条端到端问题**一条都没验**；本批只做纯函数级断言，未接入 `localStorage`/会话存储（持久化在消费方，本件是纯映射）；未跑 Electron、未开浏览器、未构建、未提交、未推送；BLK 链的另外两件（`modelSelector.js` 15 973 B、`runtimeModelParameterControls.js` 14 638 B）本批**只做了依赖清点，未落地**。

## 4. 零生产消费方（按红线未接线）

- 仓库反向 `grep`（`src`/`api`/`electron`/`main.js`）：`modelGenerationParamMemory` 除自身与其测试外 **0 命中**。
- 镜像侧消费者 **5 处**：`src/components/aigenText/runtimeModelParameterControls.js`（本仓**缺失**）、`src/components/aigenText/uiModule.js`（本仓存在但**落后一整代**：32 284 B vs 镜像 25 513 B，且本仓版本不引用本件）、`src/modules/agent/agentModelControls.js`（本仓**缺失**，即本目录唯一 BLK）、`src/modules/agent/agentModelSettings.js`（本仓存在但**落后**：1 645 B vs 镜像 2 649 B）、`api/agentModelRequestParams.js`（本仓**缺失**，296 B）。
- ⇒ 本件要生效必须先有任一消费方换代，而这五件里三件缺失、两件是在用受保护装配件。**未接线、未改装配件、未伪造消费方、未伪造 shim**。

## 5. 端口现状（缺陷照实冻结、实现一字未改，32 例断言即台账）

1. `UNSAFE_RECORD_KEYS` 只列三键，`__defineGetter__`、`__lookupGetter__` 等同样能污染原型的名字**不在**黑名单内。
2. 值侧只走 `Object.entries` ⇒ 继承来的键一律不参与，因此「键命中 `constructor`/`prototype`」在**字面量写法**下根本不会发生（`{__proto__: x}` 走原型 setter），只有计算键或 `Object.assign` 才造得出自有 `__proto__` 键——本批测试正是用计算键才真正打到该分支。
3. `String(key || '')` 对**数字键**无碍（`Object.entries` 已给字符串），但 `buildActiveModelGenerationParamPatch` 的 `key` 是外部直传值 ⇒ **数字 `0` 作为键被 `0 || ''` 吞成空串，整条补丁静默变 `{}`**。
4. **`NaN` / `Infinity` 在 `normalizeGenerationParams` 里被丢弃，却在 `buildActiveModelGenerationParamPatch` 里原样写入**（后者不过归一，直接 `[key]: value`）⇒ 同一份参数表可以「写入成功、下次归一时消失」。
5. `buildActiveModelGenerationParamPatch(state, key)` 的第三参有**默认值 `''`** ⇒ 传 `undefined` 不是「无操作」，而是**把该键写成空串并落桶**。
6. 键非法（空 / 命中三污染键）与值类型不支持都返回 `{}`，**与「什么都没变」无法区分**，调用方拿不到失败原因也不走 i18n。
7. `normalizeGenerationParamsByModel` 对**桶值非纯对象**的情况保留模型键并给空桶（`{a:null}` → `{a:{}}`），与键侧「不合格就整条丢」的口径相反。
8. `buildModelGenerationParamsSelectionPatch` **总为目标模型写一个桶条目**，即使它原本没有 ⇒ 切过一次的所有模型都会在 `generationParamsByModel` 里留下空对象（体积随切换次数增长）。
9. 返回体的 `generationParams` 与 `generationParamsByModel[nextModel]`（或 `[state.model]`）是**同一个对象引用** ⇒ 调用方就地改正文会同时改到桶，两个补丁函数都有此别名问题。
10. 切换模型时若 `state.model` 为空，**当前正文被整体丢弃**（既不落桶也不进返回值），编辑中的参数会静默消失。
11. 目标模型 id 为 `__proto__` 时，`_0x219cc6['__proto__'] = ...` 走的是原型 setter ⇒ **返回对象的 `[[Prototype]]` 被换成一个新空对象**、目标桶丢失，且不污染全局 `Object.prototype`（`Object.keys` 看不到、`getPrototypeOf` 看得到）。
12. 两个补丁都不返回 `model` 字段，`state` 里其余字段（`provider`、`apiType` 等）也不参与搬运 ⇒ 「记忆」的完整性完全依赖调用方合并顺序。
13. 键只做 `trim`、**不做小写化**，而模型 id 侧同样不大小写归一 ⇒ `Temperature` 与 `temperature` 会被当作两个参数并存。
14. 本件是**纯映射、零持久化**：名字里的「Memory」不落在本模块，任何存储都由消费方实现，因此「刷新后是否还记得」无法由本件保证。

## 6. 台账与下一批口径

- 台账：本批新增 **2 个仓库文件**（1 源码 + 1 测试）与本专题文档，**未修改任何既有生产文件**；`git status --porcelain` 落盘前后为 **67 修改 / 591 → 593 未跟踪**（+2 = 本批源码与测试，专题文档与本批台账落盘后继续上修、逐一归因）。`docs/implementation-handoff.md` 的 §6 进度标记、§7 待办勾选项、R12 表行与交付记录四处已同步（表列数保持 **6**）。
- i18n：本批**未新增**待补键（该件无任何面向用户的文案）。
- **BLK 链真实代价（本批清点结果，供第112批决策）**：`agentModelControls.js`（2 342 B）的三个依赖中，本批已解 `../modelGenerationParamMemory.js`（**零 import，纯新增，已落地**）；余两件**都不是纯新增**：
  - `src/components/aigenText/runtimeModelParameterControls.js`（镜像 14 638 B）依赖 `api/cliProviderApi.js`（本仓**缺失** 5 255 B）、`src/manifests/index.js`（本仓 5 182 B **vs** 镜像 8 538 B，**在用受保护装配件**）、`src/components/aigenImage/uiSchemaRenderer.js`（本仓 **135 906 B** vs 镜像 106 337 B，**在用受保护装配件**）+ 本批新落地的 `modelGenerationParamMemory.js`。
  - `src/components/aigenText/modelSelector.js`（镜像 15 973 B）依赖 **10 件**，其中 4 件本仓缺失（`src/modules/modelProviderProfileSelection.js` 5 233 B、`src/components/shared/modelProviderProfileControl.js` 8 519 B、`src/modules/modelCredentialUi.js` 16 178 B、`api/cliProviderApi.js`），6 件本仓存在但**世代不同**（`src/i18n/index.js`、`src/modules/floatingMenuKeyboard.js`、`src/components/shared/nodeFooterControls.js` 4 981 B vs 镜像 25 991 B、`src/components/shared/nodeModelMenu.js`、`src/components/aigenText/apimartTextModelMenu.js`、`src/components/aigenText/customTextModels.js`、`api/configApi.js` 9 941 B vs 镜像 16 889 B）。
  - ⇒ 结论：**R12 的 `src/modules/agent` 81 件端口只剩 1 件未落地，而这一件已被跨目录世代分叉卡死**——继续推进必须先做 `src/components/aigenText` / `src/components/shared` / `api/configApi` 这一族的**升代专批**（牵动 `uiSchemaRenderer`、`configApi`、`manifests/index`、`nodeFooterControls` 等**在用受保护装配件**与其消费者），**须授权 + 真机验证**，不属于「补源码」可单方面完成的范围。
- **第112批口径（纯新增、可单方面推进的候选）**：转向 BLK 链之外的**零依赖/闭包齐全**缺口择一——① `api/agentModelRequestParams.js`（镜像 **296 B**，本仓整体缺失，是 `modelGenerationParamMemory` 的五个镜像消费方之一，落地即让「参数记忆」链在端口侧更接近自洽）；② `src/modules/modelProviderProfileSelection.js`（5 233 B）与 `src/modules/modelCredentialUi.js`（16 178 B）的**依赖闭包审计**（先跑 `b95/deps-ast.mjs` 判 LEAF/OK/BLK，只取闭合者）；③ 全树 leaf 缺口仍有 **286** 候选（含 `src/modules/app/*` 一族 10 件级别的纯叶）。三者都按「落地不接线、零消费方即记账、不伪造 shim」的既有工序执行。
- 承接挂账（本批不解决）：缺失夹具 `tests/testPreviewDom.js` 的 43 项基线失败继续挂账，**不伪造**；受保护装配件换代清单不变（`agentPanel.js`、`agentRuntime.js`、`src/modules/agent/index.js`、`agentActionExecutor.js`、`agentConversationStore.js`、`agentSessionStore.js`、根 `main.js`、`agentSkillCatalog.js`，以及本批新点名的 `uiSchemaRenderer.js`、`configApi.js`、`manifests/index.js`、`nodeFooterControls.js`、`uiModule.js`、`agentModelSettings.js`）。
