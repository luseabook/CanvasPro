# 第一百一十五批：Provider 连接校验状态机纯叶（R12 链路 `modelCredentialUi` → `modelGenerationReadiness` 前置）

落地 `src/services/providerConnectionVerification.js`（端口 11 349 B ⇒ 本仓 **301 行 / 13 614 B / 7 具名导出 / 0 import 纯叶**）。
本件是第114批 §5「第115批口径」点名的解锁前置：它一旦落地，`src/services/providerConnectionAutoVerification.js`
即由 **BLK 转 OK**，从而把 `modelCredentialUi.js` → `modelGenerationReadiness.js` 这条链推进到只剩
`api/providerConnectionTestApi.js` 与 `api/cliProviderApi.js`（含 `api/cliTextStream.js`）两个缺口。
**零生产消费方 ⇒ 落地不接线**。

## 1. 本批实际执行的验证

| 检查项 | 结果 |
| --- | --- |
| 端口逐字一致 | `cmp` 1/1 与 `deobf-tools/b115/port/` 一致（`prettier --write` 测试文件后源文件仍一致） |
| 语法 | `node --check` exit 0 |
| 依赖闭合 | 0 个 import ⇒ 无需 `verify-exports`（纯叶） |
| 本批测试 | **501 行 / 19 935 B / 28 例全绿**（首跑 23/28，5 处均为**我方期望写错**，实现未改一字） |
| 全量 `src/**` | **3 452 / 3 409 / 43**（上批 3 424/3 381/43，恰好 +28），`diff b85-fails.txt` **exit 0** |
| 依赖扫描 | `b95/deps-ast.mjs src/services`：`port=74`、纯叶 **12 → 11**，`providerConnectionAutoVerification.js` **BLK → OK** |
| 代码风格 | `prettier --check` 2/2 通过 |
| 反向消费方 grep | 排除本批两件后 **0 命中 ⇒ 未接线** |
| 受保护文件 | `api/freeImageHostApi.js` md5 `1e0458013f5341c99f21faefc1d34d3f` 未变 |

首跑 5 处期望纠正（记录以免后人重犯）：`{steps:[], detail:'d'}` **首行也会短路到 `detail`** ⇒ 输出 `d\nd`；
步骤无 `label` 时**用 `id` 当标签**（`'a：通过'`），只有既无 label 又无 id 才用 `'步骤'`；
comfyui 的 `cloudApiUrl` **只要非空就算已配置能力**（即便本步被跳过/保留集里没有它 ⇒ `partial`）；
`apimart` 的连接标识**含 `apiKey`**（改 key 即删旧校验结果）；
`mergeCurrentProviderConnectionResults` 对两侧皆空的未知 provider 判为 **current**（进 `appliedProviderIds` 而非丢弃）。

## 2. 契约要点

本件是**纯函数状态机**：把「连接测试结果」与「已存配置」合并成可持久化的 `connectionVerification`
（`status` ∈ `passed`/`partial`/`failed` + `verifiedAt` + 可选 `capabilities` 分能力明细），
并在配置变更后判断旧校验结果是否仍然有效（标识比对）。三套 provider 语义各不同：
RunningHub 按 `apiKey`/`modelApiKey` 推「已配置能力」，ComfyUI 恒含 `local` 且按 `cloudApiUrl` 追加 `cloud`，
`volcengine-speech` 走 `asr`/`tts`/`audioGeneration` 白名单，其它 provider 直接记 `passed`。

## 3. 未执行 / 无法执行

- **未发起任何真实连接测试**（本件不含网络调用，真实探测在 `api/providerConnectionTestApi.js`，本仓仍缺）。
- 未运行应用、未打开设置面板 ⇒ 诊断文案 `formatProviderDiagnosticDetail` 的**实际渲染效果**（换行、i18n 覆盖词、
  长文本溢出）未验证；本批只断言字符串返回值。
- 本件在端口由 `providerConnectionAutoVerification` / `modelGenerationReadiness` 消费，二者本仓**均未落地** ⇒
  真实调用序列（谁先写 `connectionVerification`、`providerResults` 的字段来源）**未验证**，属静态契约。
- `mergePassedProviderApiConfig` 无 `verifiedAt` 时取 `Date.now()` ⇒ 测试只能断言「是有限数」，非确定值。

## 4. 冻结的端口行为（28 例，择要）

1. 步骤态：`ok===true` 且**未** `skipped` ⇒ `passed`；`skipped` ⇒ `unknown`；其余 ⇒ `failed`。
   **`skipped` 优先于 `ok`**（`{ok:true, skipped:true}` 记 `unknown`、文案记「跳过」）。
2. 状态汇总只对**已配置能力**求值：全 `passed` ⇒ `passed`；有任一 `passed` ⇒ `partial`；否则 `failed`。
   ⇒ 保留下来的能力不足以覆盖已配置集合时会**降级**（第 15 例 comfyui `partial`）。
3. `capabilities` **键存在性受控**：能力集为空时整个键消失（`Object.keys().length > 0` 才展开）。
4. 保留判据是**逐字段比对**（trim 后）：RunningHub 看 `apiUrl`+`apiKey`+`modelApiKey`，ComfyUI 看 `apiUrl`+`cloudApiUrl`；
   任一不同则该能力不保留 ⇒ 可能整键被 `delete`（旧校验结果作废）。
   **注意 RunningHub 的保留判据先比 `apiUrl`，不同则直接返回 `{}`**（后续字段不再看），ComfyUI 无此前置短路。
5. `shouldPersistProviderConnectionResult`：`ok===true` 一票通过；**comfyui 分支完全不看 `ok`**（只看步骤 id 且未跳过），
   而 runninghub 分支**必须** `ok===true` ⇒ 两者不对称；其它 provider 恒 `false`（不落盘）。
6. `getProviderConnectionIdentity`：comfyui 只比两个 URL；runninghub 两 id 比 `apiUrl`+`apiKey`+`modelApiKey`；
   其余比 `apiUrl`+`apiKey`，且 **`routeId` 只在 `apimart` 时计入**。
7. `mergePassedProviderApiConfig` 三层合并优先级：base < next < `override` **必须是 `Map`**（传普通对象视作空 Map），
   第四参数非 Map 时**静默忽略**；id 归一（trim+小写）后才落键，空 id 跳过；返回 `{...base, providers}`，
   **不改写入参对象**（但能力值是浅拷贝 `{...caps[k]}`）。
8. `volcengine-speech` 的 `capabilities` 只在**标识未变**时继承旧值；步骤 id 不在白名单则忽略；
   其外层 `status` 恒 `passed`（与普通 provider 同路），`capabilities` 只是附加明细。
9. 文案拼接：首行 `suggestion||summary||error||detail` 短路，`steps` 为非空数组才走逐步展开，
   否则 else 分支再补一次 `detail` ⇒ **`detail` 可同时出现在首行与第二行**；
   步骤的 `message`/`detail` 用 ` · ` 连接且**按首次出现去重**（同一字符串只留一次），
   `String({})` 得 `[object Object]` 也照样算一条；行间分隔符是 `\x0a`。
   覆盖词为**假值**（`0`/`''`）时回落内置中文，故不能靠传 `0` 来清空文案。
10. `reconcile` 的返回值**永远是新对象**（`{...next}`），第二参数非对象时被替换成 `{}`；
    无历史 `connectionVerification` 时原样返回副本。

## 5. 台账与下一批口径

- 交付面：源码 1 件（301 行）、测试 1 件（501 行）、专题文档 1 件；
  `git status --porcelain` 源码与测试落盘时 **67 修改 / 608 未跟踪**，专题文档与本批台账落盘后 **609**；
  `api/freeImageHostApi.js` md5 未变；未提交、未推送、未构建、未运行应用。i18n 本批未新增待补键。
- **第116批口径（继续纯新增）**：①落地已转 OK 的 `src/services/providerConnectionAutoVerification.js`（3 191 B，
  依赖 `api/configApi.js` + `api/providerConnectionTestApi.js` + 本批纯叶）——**先核实
  `api/providerConnectionTestApi.js` 在本仓是否存在**，缺失则记 BLK 并继续往上游补；
  ②`src/services` 纯叶仍有 **11** 件，其中 `binghuoCatalogPricing.js` 728 B、`canvasProjectAccess.js` 795 B、
  `fastImagePreviewService.js` 6 980 B、`mediaObjectUrlRegistry.js` 2 379 B、`projectSaveQueue.js` 794 B、
  `legacyStorageMigrationDeadline.js` 872 B、`packagedBrowserShortcutGuard.js` 2 961 B、
  `rendererStartupEvidence.js` 1 917 B、`rendererStartupState.js` 1 091 B 等；
  ③`modelGenerationReadiness.js`（18 179 B）仍缺 `api/cliProviderApi.js`（5 255 B，其依赖 `api/apiBase.js` + `api/cliTextStream.js`）
  ⇒ 该链须**逐层**补，不伪造 shim；④`api/` 纯叶 41、`src/modules` 纯叶 136、全树纯叶 286 候选。
  凡零消费方一律落地不接线；桩覆盖一律 `'k' in over ? over.k : default`；台账表行内禁止裸竖线。
