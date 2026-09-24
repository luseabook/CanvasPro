# 第 112 批 · R12 端口消费方：Agent 模型请求参数装配（`api/agentModelRequestParams.js`）

> 来源为 0.7.16 安装版反混淆端口，逐字保真落地。结论先说：**本批不构成任何用户可见行为完成**——该件在生产代码里**零引用**，未接线、未启动应用、未真实发出任何模型请求。

## 1. 落地清单与核验计数

| 项 | 值 |
| --- | --- |
| 源码 | `api/agentModelRequestParams.js` **5 行 / 320 B / 1 具名导出**（`buildAgentModelRequestParams`；镜像端口排版前 296 B） |
| 本批暂存 | `C:/Users/luobote/.qoder/tmp/deobf-tools/b112/port/agentModelRequestParams.js` |
| 测试 | `api/agentModelRequestParams.test.js` **101 行 / 4 172 B / 12 例**（本项目自研，非移植件） |
| `import` | **1 条**：`../src/modules/modelGenerationParamMemory.js :: normalizeGenerationParams` —— 即第111批刚落地的纯叶件，**依赖闭合、零 shim** |
| `cmp` 仓库 vs 暂存 | **1/1 IDENTICAL**（`prettier --write` 之后复测仍逐字节相同） |
| `node --check` | 源码 + 测试 **2/2 ok** |
| `prettier --check` | 本批 **2/2 通过**（仓库侧仍只命中基线已知未格式化两件 `agentSkillPackage.js`/`agentSkillPackage.test.js`，本批未触碰） |
| 落地前门禁 `b100/verify-exports.mjs` | `ok ../src/modules/modelGenerationParamMemory.js :: normalizeGenerationParams`、零 `MISSING`、零 `DEP-FAIL` |
| `node --test` 单跑 | **12/12 首跑即全绿**（本批无期望偏差修正，**移植实现一字未改**） |
| `api/**` sweep | **475 tests / 475 pass / 0 fail**（`api/*.test.js` 27 份，本批 +12；产物 `b112/api.tap`、`b112-api-fails.txt` 为空名单） |
| `src/**` sweep | 沿用第111批 **3 359/3 316/43**（本批未新增 `src` 测试，43 项仍归属缺失夹具 `tests/testPreviewDom.js`、**不伪造**） |
| 依赖闭包 `b95/deps-ast.mjs api` | `port=204`，未落地纯叶 **42 → 41**（本件退出 LEAF 池；已核实 LEAF 名单只列「端口存在且仓库缺失」的文件、41 条中 0 条在仓库存在） |
| 文件计数 | `api/**` 测试 **26 → 27** 份；全仓 `src/**` 测试 **276** 份不变 |
| 保护文件 | `api/freeImageHostApi.js` md5 仍为 `1e0458013f5341c99f21faefc1d34d3f`；本批未覆盖、未提交、未推送、未触发构建或发布 |

## 2. 契约

`buildAgentModelRequestParams(state = {})` ⇒ 读 `state?.['generationParams']`，交给 `normalizeGenerationParams` 清洗（键 `trim`、丢空键与 `__proto__`/`constructor`/`prototype`、值只留 `string`/`number`/`boolean`、丢非有限数字、字符串值 `trim`）；**清洗后若非空则返回 `{ generationParams: <新对象> }`，若为空则返回 `{}`**。

设计意图很清楚：**「没有可用参数」时不把 `generationParams: {}` 这个键发给模型接口**，避免上游把空对象当显式覆盖。它同时是一道白名单闸：`model`、`provider`、`prompt`、`generationParamsByModel` 等字段一概不透传，请求体只可能有 0 或 1 个键。

## 3. 本批实际执行的检查 / 明确未执行的检查

已执行（全部离线、无网络、无磁盘写入、无进程、无真实 AI 调用）：端口 → 暂存 → 仓库 `cmp`；`node --check`；`prettier --write` + `--check`；落地前具名导入门禁 1/1；`node --test` 单跑 12/12；`api/**` 全量 sweep 475/475/0；`b95/deps-ast.mjs api` 闭包复测；仓库与镜像消费者 `grep`；保护文件 md5 与 `git status` 归因。

**未执行**（不得当作已验证）：**未向任何真实模型接口发过一次请求**，故「上游 API 是否真的拒绝空 `generationParams`」「省略该键与传 `{}` 的behavioural 差异是否真的存在」两条本件存在的理由都没验；未接入真实会话/节点状态（入参全部为手工字面量）；未验证其在 `agentApi.js` 等五个端口消费方的实际调用顺序；未跑 Electron、未构建、未提交、未推送。

## 4. 零生产消费方（按红线未接线）

- 仓库反向 `grep`（`api`/`src`/`electron`/`main.js`）：`buildAgentModelRequestParams` 除自身与其测试外 **0 命中**。
- 镜像消费者 **5 处**：`api/agentApi.js`、`api/agentAssistantApi.js`、`api/agentContextDigestApi.js`、`api/agentSkillAuthoringApi.js`、`api/customProviderDiscoveryApi.js`。**本仓只有 `api/agentApi.js` 存在且属更早世代**，其余四件本仓整体缺失（`agentAssistantApi.js` 的缺失在第104批已记为「`requestAgentContextDigest/requestAgentAssistantReply/requestAgentActionPlan` 三条管线当前无法实例化」的根因）。
- ⇒ 本件是「模型请求参数」链上第一个落地到 `api/` 的**可被真实请求体使用**的装配件，但要生效必须换代上述五个 API 件（全是在用/关键的受保护接口层，须专批 + 真机验证 + 授权）。**未接线、未改装配件、未伪造消费方、未伪造 shim**。

## 5. 端口现状（缺陷照实冻结、实现一字未改，12 例断言即台账）

1. **默认参数 `= {}` 只在实参为 `undefined` 时生效**：传 `null` 会走可选链 `state?.[...]` ⇒ 不抛错但静默产出 `{}`，与「传了空参数」无法区分。
2. 「清洗后为空 ⇒ 整键消失」是**双刃**：用户把所有参数都清空（例如删掉唯一一项）后，请求里不再出现 `generationParams`，**上游可能继续沿用其自身默认值**，而不是收到「显式空」。
3. 值层面的空串仍然算「有参数」：`{ style: '' }` 会让 `generationParams` 上送（清洗只 `trim` 不判空），因此「空字符串」与「键不存在」在请求体里表现不同——这是端口语义，未改动。
4. `NaN`/`Infinity`/`-Infinity` 被剔除（继承第111批 `normalizeGenerationParams` 口径），但**第111批的写入路径却允许把 `NaN` 存进状态** ⇒ 同一份参数可以「在状态里存在、在请求里凭空消失」。
5. 原型污染三键在**函数实参位置**基本打不到（`{__proto__: x}` 是原型 setter），要复现必须用计算键 `{['__proto__']: x}` 或 `Object.assign`；本批测试即按计算键写。
6. 请求体**永远只有一个 `generationParams` 键或零个键**：模型 id、provider、prompt、按模型分桶的 `generationParamsByModel` 都不由本件负责，装配顺序若在别处漏掉 `model`，本件不会报错。
7. 返回值是**新构造的对象**（`normalizeGenerationParams` 已复制一层）⇒ 就地改请求体不会污染会话状态；反之改状态也不会影响已构造的请求体。
8. 键序沿用入参 `Object.entries` 顺序 ⇒ 若上游对参数顺序敏感（理论上不应当），顺序由 UI 侧写入顺序决定，本件不做排序。
9. 本件对 `generationParams` 的类型**不做进一步校验**（如 `size` 是否为合法枚举）⇒ 只要类型是 `string`/`number`/`boolean` 就会直送模型接口。

## 6. 台账与下一批口径

- 台账：本批新增 **2 个仓库文件**（1 源码 + 1 测试）与本专题文档，**未修改任何既有生产文件**；`git status --porcelain` 源码与测试落盘时 **67 修改 / 596 未跟踪**，本专题文档与台账落盘后为 **597**（第111批源码 + 测试落盘时 593、其专题文档落盘后 594 ⇒ 本批 **+3** = 源码 + 测试 + 专题文档；注：`docs/implementation-handoff.md` 与 `docs/next-session-prompt.md` 本身即未跟踪文件，编辑它们只改内容不改计数）。`docs/implementation-handoff.md` 的 §6 进度标记、§7 待办勾选项、R12 表行与交付记录四处已同步（表列数保持 **6**；本批并新增一条工序纪律：**表行内禁止裸 `|`**，逻辑或一律改述，否则会虚增列数）。
- i18n：本批**未新增**待补键（该件无面向用户的文案）。
- **第113批口径（继续纯新增、可单方面推进）**：①`api` 目录仍有 **41** 件端口纯叶未落地（`b95/deps-ast.mjs api` 名单，含 `api/adapters/ComfyUiWorkflowMappingAdapter.js` 9 419 B、`api/adapters/minimaxH3Prompt.js` 251 B 等），可继续按浅链择批；②`src/modules` 纯叶缺口 **137** 件；③全树 leaf 缺口 **286** 候选；④`src/modules/modelProviderProfileSelection.js`（5 233 B）与 `src/modules/modelCredentialUi.js`（16 178 B）的闭包审计——若判为 LEAF/OK 即可落地，是解开 `agentModelControls.js` 这条 BLK 的**唯一无需升代的部分**，但**只要还差一个在用受保护装配件，该 BLK 就继续挂账，不伪造 shim**。
- 承接挂账（本批不解决）：缺失夹具 `tests/testPreviewDom.js` 的 43 项基线失败继续挂账；`src/modules/agent` 最后 1 件 `agentModelControls.js` 仍 BLK（详见第111批 §6 的跨目录分叉清点）；受保护装配件换代清单不变（本批新增 4 件：`api/agentAssistantApi.js`、`api/agentContextDigestApi.js`、`api/agentSkillAuthoringApi.js`、`api/customProviderDiscoveryApi.js` 为**整体缺失**的端口消费方，`api/agentApi.js` 为**落后世代**在用件）。
