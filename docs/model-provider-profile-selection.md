# 第一百一十三批：RunningHub 站点 profile 与模型 provider profile 选择（R12 依赖解锁）

本批把端口 0.7.16 的 `src/modules/runningHubProviderProfiles.js`（纯叶，0 个 import）与
`src/modules/modelProviderProfileSelection.js`（3 个 import，全部可在本仓解析）作为一组落地，
**落地不接线、本仓零生产消费方**（反向 grep 命中 0 件）。

## 1. 本批实际执行的验证

| 检查项 | 命令 | 结果 |
| --- | --- | --- |
| 端口逐字一致 | `cmp src/modules/<f>.js deobf-tools/b113/port/<f>.js` × 2 | 2/2 完全一致（`prettier --write` 后仍一致） |
| 语法 | `node --check` × 2 | 2/2 exit 0 |
| 命名导入闭合 | `b100/verify-exports.mjs src/modules/modelProviderProfileSelection.js` | 4/4 ok：`../manifests/index.js :: getModelManifest`、`../../api/configApi.js :: getProviderConfig`、`./runningHubProviderProfiles.js :: normalizeRunningHubModelApiProfileId` + `RUNNINGHUB_SITE_PROFILE_IDS` |
| 本批新增测试 | `node --test` 两件 | **43/43 全绿**（首跑 41/43，2 处期望写错，实现未改） |
| 全量 `src/**` 扫描 | `find src -name '*.test.js' \| xargs node --test` | **3 402 / 3 359 / 43**（上批 3 359/3 316/43，恰好 +43） |
| 失败集合零回归 | `diff b85-fails.txt b113-fails.txt` | `diff-exit=0` |
| 依赖扫描 | `b95/deps-ast.mjs src/modules` | `port=915`、纯叶 **137 → 136** |
| 代码风格 | `prettier --check` × 4（2 源 + 2 测） | 全部通过 |
| 受保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f` 未变 |

## 2. 契约要点

`runningHubProviderProfiles.js`（155 行 / 6 611 B，18 个导出）：两个站点 profile 常量
（`runninghub` / `runninghub-international`，后者的 `RUNNINGHUB_MODEL_API_PROFILE_IDS` 与前者的
`RUNNINGHUB_SITE_PROFILE_IDS` **是同一个冻结数组引用**）、30 项国际专属模型 id 清单、
profile 元数据表（标签 + `https://www.runninghub.cn` / `https://www.runninghub.ai`）、
workflow 默认站点读写、URL → 站点判定、URL 重写/拼接。

`modelProviderProfileSelection.js`（128 行 / 6 050 B，9 个导出）：以
`providerProfileIdByModel` 为键的**按模型记忆**读写与归一，profile 列表来源优先
`manifest.extensions.providerProfiles`，其次在 `provider==='runninghubwf' && adapterType==='workflow'`
时回落两个站点 profile，再回落 `getProviderConfig('runninghubwf').providerProfileId`。

## 3. 未执行 / 无法执行

- **未发起任何真实模型请求**，未改任何生产文件、未接线，`main.js`/`index.html` 本批零改动。
- 本仓 `src/manifests/` **全树 0 处 `providerProfiles` 字段**（端口世代新增），故
  `getModelProviderProfileIds` 在本仓真实注册表上只会命中「workflow 回落站点」这一路，
  `extensions.providerProfiles` 优先级分支只能靠合成 manifest 对象测到——这是**代差事实**，不是缺陷。
- `getProviderConfig('runninghubwf')` 在本仓离线可读，返回 `{apiUrl,apiKey:'',modelApiKey:''}`，
  **无 `providerProfileId` 键**，故该回落分支恒返回 `''`，测试按此冻结。
- 未跑真实浏览器 UI：`resolveReadyModelProviderProfileId` 的谓词只由回调注入，本仓无调用方，
  真机行为（就绪探测顺序）未验证。

## 4. 消费方与接线状态

反向 grep `api/ src/ electron/ main.js`（排除本批自身四件）：**0 命中 ⇒ 未接线**。
端口镜像中的消费方（本批刻意不移植、不伪造）：`src/modules/modelCredentialUi.js`、
`src/modules/runninghubAiApp/rhAiAppRunningHubProfile.js`、
`src/modules/settings/runningHubDefaultSiteSettings.js`、`src/modules/nodeFooterControls.js`、
`src/modules/agentModelSettings.js`（后两件在本仓为**在用受保护装配件**，升代须单独成批 + 真机验证 + 授权）。

## 5. 冻结的端口行为（共 43 项，择要）

1. `normalizeRunningHubModelApiProfileId`：**只有** `runninghub-international`（忽略大小写/首尾空格）命中国际，
   其它一切（含 `undefined/null/0/false/NaN/1`、未知串）折叠为国内——`String(值 || '')` 使数字 `0` 先变空串。
   自定义 `toString` 的对象仍可命中国际。
2. `getRunningHubProviderProfileId` 三级优先 `providerProfileId > rhProviderProfileId > taskProviderProfileId`；
   `getRunningHubTaskProviderProfileId` 把 `taskProviderProfileId` 提到最前。
3. `resolveRunningHubSiteProfileIdFromUrl` 用正则从自由文本取**第一个** http(s) 串，识别子域与大小写；
   `http://`、`https://%zz` 命中正则但 `new URL` 抛错 → 走 `catch` 返回空串。
4. `resolveRunningHubModelApiBaseUrl` 的显式覆盖为纯空格时 `String('   ' || 默认)` 真值成立 → 结果为**空串**（不是默认地址）。
5. `remapRunningHubModelApiUrl` 重写域名为 `子域前缀 + runninghub.(cn|ai)`，只去掉**一个**结尾斜杠；
   非 runninghub 主机原样返回；入参 trim 后为空返回空串。
6. `applyRunningHubWorkflowDefaultProfileId(null, …)` 因 `… || {}` 回落空对象，不抛异常。
7. `getModelProviderProfileMemoryKey({})` 得 `'[object Object]'`（对象真值走 `String(对象)`），
   `getModelProviderProfileMemoryKey([])` 得 `''`（空数组 falsy）——**空对象/空数组都不是「无键」**。
8. profile 列表为空 ⇒ `normalizeModelProviderProfileId` 恒返回 `''`，进而该模型在
   `sanitizeModelProviderProfileMemory` 中被**整条丢弃**。
9. `resolveModelGenerationProviderProfileId`：`provider==='runninghub'` 时**先跳过** profile 列表归一
   （置空串），再由 `||` 短路改走 `normalizeRunningHubModelApiProfileId`；
   且条件为 `A || (B && C)`——`provider==='runninghubwf'` 且请求值为空时整体为假 → 返回 `''`。
   `provider` 匹配先 `toLowerCase()`。
10. `resolveReadyModelProviderProfileId` 的谓词只要 **不严格等于 `false`**（含 `null/undefined`）就保留首选；
    顺延只认 `=== true`；全不认时回落首选而非空串。
11. `buildModelProviderProfileSelectionPatch` 恒返回三键（`rhProviderProfileId` **恒为空串**），
    目标模型无 profile 列表时提前返回但仍已把旧模型写进记忆桶；第三参数需
    `!== undefined && !== null && trim() !== ''` 才算显式选择，否则读记忆桶、再读正文（仅同模型时）。
12. `getNextModelProviderProfileId` 以 `(idx + 1 + len) % len` 循环，未知当前值按首项续推。

## 6. 台账与下一批口径

- 交付面：源码 2 件（155/128 行）、测试 2 件（255/209 行）、专题文档 1 件；
  `git status --porcelain` 源码与测试落盘时 **67 修改 / 601 未跟踪**、专题文档与本批台账落盘后 **602**；
  `api/freeImageHostApi.js` md5 仍 `1e0458013f5341c99f21faefc1d34d3f`；未提交、未推送、未构建。
- **受阻记账**：`src/modules/modelCredentialUi.js`（16 178 B）本批评为 **BLK**——
  7 个依赖在本仓 0 命中（`api/cliProviderApi.js`、`services/modelGenerationReadiness.js`、
  `cliLoginMissingToast.js`、`providerApiKeyMissingToast.js`、`core/stores/modelMenuPreferenceStore.js`、
  `modelMenuVisibility.js`、`components/shared/modelMenuPricing.js`），本批只补齐了它的
  `modelProviderProfileSelection` 一条依赖；其传染受阻件 `src/modules/storyWorkspace/storyModelCredentialGuard.js`
  仍 BLK。**不伪造 shim**。
- **第114批口径（继续纯新增）**：本批落地后新转 OK 的两件是最低成本续点——
  ①`src/modules/runninghubAiApp/rhAiAppRunningHubProfile.js`、②`src/modules/settings/runningHubDefaultSiteSettings.js`
  （二者依赖仅 `runningHubProviderProfiles.js` + 本仓在用的 `api/configApi.js`）。
  其后：`src/modules` 纯叶仍有 **136** 件（如 `agnesProviderProfiles.js` 1 011 B）、`api/` 纯叶 **41** 件、
  全树纯叶 286 件；`modelCredentialUi` 家族须先补 7 个依赖（其中 `modelGenerationReadiness` 为服务层，须单独审计）。
  只要仍差一个在用受保护装配件就继续挂账、**不伪造 shim**、**不伪造消费方**。
