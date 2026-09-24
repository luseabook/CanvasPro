# 第一百一十四批：RunningHub 站点 profile 的两名首批消费者（R12 纯新增两件落地不接线）

第113批补齐 `runningHubProviderProfiles.js` 后，本批落地其**首批可解析消费者两件**：
`src/modules/runninghubAiApp/rhAiAppRunningHubProfile.js`（新目录）与
`src/modules/settings/runningHubDefaultSiteSettings.js`。**零生产消费方 ⇒ 落地不接线**。

## 1. 本批实际执行的验证

| 检查项 | 结果 |
| --- | --- |
| 端口逐字一致 | `cmp` 2/2 与 `deobf-tools/b114/port/` 一致（`prettier --write` 后仍一致） |
| 语法 | `node --check` 2/2 exit 0 |
| 命名导入闭合 | `b100/verify-exports.mjs` **7/7 ok**（`api/configApi.js :: getProviderConfig` + `runningHubProviderProfiles.js` 6 个符号） |
| 本批测试 | 2 件 **22 例、22/22 首跑全绿**，实现与期望均未回改 |
| 全量 `src/**` | **3 424 / 3 381 / 43**（上批 3 402/3 359/43，恰好 +22），`diff b85-fails.txt` **exit 0** |
| 依赖扫描 | `b95/deps-ast.mjs src/modules`：`port=915`、纯叶仍 **136**（本批两件属 OK 而非纯叶，落地后从 OK 名单消失） |
| 代码风格 | `prettier --check` 4/4 通过 |
| 反向消费方 grep | `api`/`src`/`electron`/`main.js` 排除本批四件后 **0 命中 ⇒ 未接线** |
| 受保护文件 | `api/freeImageHostApi.js` md5 `1e0458013f5341c99f21faefc1d34d3f` 未变 |

## 2. 契约要点

`rhAiAppRunningHubProfile.js`（32 行 / 1 278 B / 4 导出）：自定义 AI 应用「获取配置」路径上的
**站点一致性校验**（`assertRunningHubDefinitionProfile` 解析定义 JSON 后比对 `providerProfileId`）、
默认站点读取、短标签（`国际`/`国内`）、徽章节点同步（固定选择器 `[data-role='preview-runninghub-runtime-label']`）。

`runningHubDefaultSiteSettings.js`（58 行 / 2 261 B / 1 导出）：`[data-runninghub-default-site]`
按钮组的**默认站点选择控件工厂**，返回 `bind`/`destroy`/`loadConfig`/`applyToConfig`/
`getSelectedProfileId`/`setSelectedProfileId` 六键面；`loadConfig` 读 workflow 默认站点、
`applyToConfig` 写回同一位置。

## 3. 未执行 / 无法执行

- **未运行应用、未在真实浏览器点击过任何按钮**；本批 DOM 交互全部由自研**手写桩节点**（`classList.toggle`、
  `setAttribute`、`addEventListener`/`removeEventListener`、`dataset`）驱动，故只能断言
  **类名/`aria-pressed`/监听器数量/回调值/选中态**，**不能**证明真实页面上按钮视觉态、CSS 选择器命中与事件冒泡。
  第113批确立的「假 DOM 禁断言富文本产物」同样适用（本批不涉及 `sanitizeRichTextHtml`，未使用真实 `document`）。
- 未发起任何真实模型请求或 RunningHub 网络调用；`getDefaultRunningHubProfileId()` 只读离线
  `getProviderConfig('runninghubwf')`，本仓该配置**无 `providerProfileId` 键** ⇒ 恒折叠为国内，测试按此冻结。
- 本批只落 2 件消费者，端口真正装配它们的宿主（自定义 AI 应用面板 / 设置面板）在本仓为**在用件或整体缺失**，
  ⇒ 面板上用户仍看不到这两个能力，**不算功能已接通**。

## 4. 冻结的端口行为（22 例，择要）

1. `assertRunningHubDefinitionProfile` 对**任何 JSON 解析失败静默返回**（含 `''`、`'   '`、截断串），
   即"定义串损坏"不会被拦下；`'null'`、`'[{...}]'` 也不抛。
2. 比对是**严格不等、不做站点归一** ⇒ 存了 `runninghub-international` 而当前传 `' RUNNINGHUB-INTERNATIONAL '`
   或大小写不同都会抛「站点与已获取配置不一致…」；数字 `5` 与字符串 `'5'` 亦判不一致。
3. `providerProfileId` 为**假值**（`''`/`0`/`null`/缺键）时一律放行 ⇒ 空串配置永远不算冲突。
4. 短标签只有 `normalizeRunningHubModelApiProfileId` 判国际才给「国际」，其余（含未知串、`null`）给「国内」。
5. `syncRunningHubProfileBadge` 用**可选链**取节点：`root` 为 `null`/无 `querySelector`/返回 `null` 均返回 `false`；
   命中时写 `hidden = !第三参数`（缺省 `!![]`）与 `textContent` 后返回 `true`；**只认那一条固定选择器**。
6. `createRunningHubDefaultSiteSettings` 的按钮集合是**工厂创建时的一次性快照**（`querySelectorAll` 只调用一次），
   之后 DOM 里新增的按钮不会被 `bind` 挂监听、也不会被同步。
7. 未点击前 `getSelectedProfileId()` 恒为国内；`loadConfig(state)` 会把选中态**覆盖**为 state 里的 workflow 默认值，
   但一旦**点过一次**（`dirty`）就永久忽略 `loadConfig` 入参、保留用户选择。
8. 点击把 `dataset.runninghubDefaultSite` **归一后**同时写入选中态并回调；`dataset` 缺失（`{}`）算一次「选中国内」的有效点击。
9. `bind()` 幂等：内部 `Map` 以元素为键，重复 `bind` 不会重复挂 `click` 监听；`destroy()` 摘监听并清 `Map`，
   之后再 `bind` 可重新挂上（监听器数 0 → 1）。
10. `setSelectedProfileId` 与 `loadConfig` 都返回**归一后**的值（非原样入参）；`applyToConfig()` 无参时
    会**新建**嵌套对象且不改写入参。

## 5. 台账与下一批口径

- 交付面：源码 2 件（90 行 / 3 539 B）、测试 2 件（286 行 / 11 557 B）、专题文档 1 件。
  快照 `git status --porcelain`：**67 修改 / 605 未跟踪**。
  **本批新记一条快照口径**：新建目录 `src/modules/runninghubAiApp/` 内两件文件被 git **折叠成一行 `??`**，
  故「+4 文件 ⇒ +3 未跟踪条目」；核对条目数时须按目录折叠理解，不可据此判定文件未落地（本批四件均可 `git status --porcelain` 与 `wc -c` 双证）。
  `api/freeImageHostApi.js` md5 未变；未提交、未推送、未构建、未运行应用。
- **第115批口径（继续纯新增）**：①`modelCredentialUi` 家族须先补 7 件依赖，其中
  `src/services/modelGenerationReadiness.js` 是服务层 ⇒ 先对它跑 `b95/deps-ast.mjs src/services` 闭包审计并落地其 LEAF/OK 件，
  再顺次 `cliLoginMissingToast.js`、`providerApiKeyMissingToast.js`、`core/stores/modelMenuPreferenceStore.js`、
  `modelMenuVisibility.js`、`components/shared/modelMenuPricing.js`、`api/cliProviderApi.js`；
  ②`src/modules` 纯叶仍有 **136** 件（如 `agnesProviderProfiles.js` 1 011 B）、`api/` 纯叶 **41** 件、全树纯叶 **286** 候选；
  ③真实接线须升代在用的 `nodeFooterControls.js`/`agentModelSettings.js`（**须真机验证 + 单独授权**）。
  凡零消费方一律落地不接线；桩覆盖一律 `'k' in over ? over.k : default`；呈现类不可断言富文本产物；
  台账表行内禁止裸竖线；**不伪造 shim、不伪造消费方**。
