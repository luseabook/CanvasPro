# 第124批：协作基础模块（进行中，落地不接线）

## 1. 范围与分段

- 能力区 R10。目标是补齐协作前置模块，不代表多人协作功能交付。
- 124a：2026-09-25 已落 13 个零 import 模块及同名测试（变更 #0039–#0041）；2026-09-28 接手复核并补齐收尾文档，未改变既有实现和测试。
- 124b：2026-09-28 新增 `collaborationConflicts` 与 36 例测试，已完成离线验证；仅依赖本批 `collaborationDocument` 与 `collaborationFieldMerge`，落地不接线。
- 124c：2026-09-28 新增 `collaborationCanvasBinding` 与 50 例测试，已完成离线验证，唯一依赖为本批 Journal；落地不接线，细节见 §7。
- 124d：2026-09-28 新增 `collaborationChatInput` 与 40 例测试，实际模态依赖组合测试通过；落地不接线，细节见 §8。
- 124e：2026-09-28 新增 `collaborationReviewDom` 与 37 例测试，图标依赖受限差分一致；落地不接线，NodeReference 另有导出阻塞，见 §9。
- 源：只读的 `C:/Users/luobote/.qoder/tmp/shuo-deobf/src/modules/collaboration/`。
- 暂存与检查证据：`C:/Users/luobote/.qoder/tmp/deobf-tools/b124/`，源码位于 `port/src/modules/collaboration/`，测试副本位于 `tests/src/modules/collaboration/`。

## 2. 124a 落地清单

每个模块配同名 `.test.js`，共 121 例；全部 0 import。

| 模块（省略 collaboration 前缀） | 源码行数 | 行为范围 |
| --- | --- | --- |
| ChangeFeed | 31 | 协作变更流 |
| ChatPosition | 146 | 聊天浮层定位 |
| ChatState | 184 | 聊天状态 |
| ConnectionIndicator | 43 | 连接状态呈现 |
| Document | 120 | 图投影、私有字段过滤、图变更与依赖冲突检测 |
| Editing | 154 | 编辑锁与编辑协调 |
| FieldMerge | 20 | 字段三方合并；不可合并抛 EDIT_CONFLICT |
| Journal | 53 | 恢复日志 |
| MemberColor | 26 | 成员取色 |
| Preferences | 66 | 协作偏好 |
| PresenceChannel | 73 | 鼠标同步调度、单请求合并、延迟平滑与退避 |
| Previews | 35 | 图片预览补齐 |
| ReviewState | 75 | 评审动态 |

## 3. 124a 检查证据

| 检查 | 结果 | 证据/时间 |
| --- | --- | --- |
| 格式化镜像 = 暂存 = 仓库源码 | 13/13 逐字节相同 | 9 月 28 日重跑 b124-stage.mjs --check 和 Get-FileHash |
| 仓库测试 = 暂存测试 | 13/13 相同 | 9 月 28 日 Get-FileHash |
| 语法 | 26/26 node --check | 9 月 28 日 |
| 格式 | prettier 3.9.8，26/26 | b124-prettier-check.mjs；结合仓库/暂存哈希一致性 |
| 定向测试 | 121/121，0 失败 | b124a-recheck-20260928.tap；9 月 28 日实跑 |
| src 全量 | 3978 总 / 3935 通过 / 43 失败 | 9 月 25 日 b124a-src-sweep.tap，本次只复核既有证据 |
| 失败名集合 | 对 b85 新增 0 / 消失 0 | 本次重跑 b124-fails.ps1；也与 123b 一致 |
| api 全量 | 791/791/0 | 9 月 25 日 b124a-api-sweep.tap，本次只复核 |
| 受保护文件 | MD5 1e0458013f5341c99f21faefc1d34d3f，不变 | api/freeImageHostApi.js |
| 消费方 | api/src/electron 非测试代码及 main.js 外部引用 0 命中 | 本次大小写敏感、逐模块名反查；根目录无 renderer.js |

没有进行应用启动、Electron/浏览器真机验收、构建、真实服务请求或发布。单测和静态检查不等于功能可用。124a 本次未做变异测试；124b 的变异抽查单独见 §6。

## 4. 依赖重新分级与闸门

原 LEAF 13 / OK 4 / BLK 21，13 个纯叶落地后变为 **LEAF 0 / OK 7 / BLK 18**。

7 个 OK 件经 b123-gate.mjs 的 AST 静态声明收集与真实导出检查，MISSING_TOTAL=0：

| 候选 | 本仓依赖 | 下一步 |
| --- | --- | --- |
| collaborationCanvasBinding | collaborationJournal | 124c 已落地；依赖与格式化镜像逐字节相同 |
| collaborationChatInput | services/modalInteractionScope | 124d 已落地；modalInteractionScope 及 focusTrap 与格式化镜像一致 |
| collaborationConflicts | collaborationDocument、collaborationFieldMerge | 两依赖与镜像格式化产物一致；124b 已落地 |
| collaborationLobby | components/contextMenuIcon | 待依赖世代核对 |
| collaborationNicknameEditor | components/contextMenuIcon | 待依赖世代核对 |
| collaborationReviewDom | collaborationMemberColor、components/contextMenuIcon | 124e 已落；MemberColor 字节一致，图标依赖受限行为差分一致，见 §9 |
| collaborationSelect | components/sharedIconMarkup | 待依赖世代核对 |

闸门通过只证明导出存在，不证明行为与新版一致。R10 服务端尚未设计，canvasCollaborationApi、主会话/应用装配、媒体同步及若干核心依赖仍缺失。不得添加伪造导出来绕过阻塞。

## 5. 接线、Git 与后续

- 124a 全部未接线；增量孤立模块台账从 257/1019 更新为 270/1032，非重新运行全图遍历所得。
- 开工 Git：master，0 staged / 1 unstaged / 26 untracked / 0 冲突；源码和测试继承前一会话，不是本次新增实现。
- 124a 阶段只补文档和检查；124b 新增一件源码及测试。不自动提交、推送、安装依赖、升级受保护装配件。
- 124b–124e 已完成冲突、画布绑定、聊天输入和评审 DOM 的落地与测试；当前 124f 优先 CommentThreads，随后 Activity；NodeReference 缺媒体导出仍阻塞，不自动升代在用依赖，详见 §9。


## 6. 124b：冲突管理与冲突分区（2026-09-28）

### 实现与固定行为

- 新增 `src/modules/collaboration/collaborationConflicts.js`，96 行 / 3934 B，与格式化镜像和暂存逐字节一致；两个导出 `createCollaborationConflicts`、`partitionCollaborationConflict`。
- 新增同名测试文件，36 例，只通过公开导出调用真实的 Document/FieldMerge，不加 shim 或伪消费方。
- 冲突登记按 kind/id 去重；节点锁定和边端点阻断；对同对象字段尝试三方合并，不可合并或跨对象依赖冲突时同时保留冲突对象。
- `reconcile` 只筛选本地变更，不会应用合并结果到图中；测试断言输入不被修改。
- 分区考虑节点自身、旧/新父节点和边旧/新端点，检查外部未过期锁及 running 任务，并迭代到依赖阻断固定点。
- **保留源端保守兜底**：找不到具体阻断原因时返回全部 blocked、safe 为空，不能当成通用无冲突过滤器使用。
- **保留源端任务选择语义**：只看该节点第一个 running 任务；若同一节点同时出现自有和外部任务，后一个可能不参与判断。此边界已显式测试，未来服务端/会话接入必须保证契约或单独设计处理，不能宣称已经解决。

### 检查与回归

| 项目 | 结果 | 证据（b124/ 下） |
| --- | --- | --- |
| 源码依赖 | 2/2 导出存在，两依赖均与镜像格式化产物一致 | b123-gate；124a 哈希检查 |
| 主机定向首跑 | 36/36，0 失败；沙箱预跑也为 36/36 | b124b-tests.tap |
| 语法 | 新增源码与测试 2/2 | node --check |
| 字节一致 | 新增源码/测试各自与暂存相同 | Get-FileHash |
| 格式 | 协作暂存源码与测试 28/28 | b124-prettier-check.mjs |
| 变异抽查 | 15/15 有效语法变异被测试检出；不是完整变异覆盖率 | mutate124b.mjs、mutation-20260928/results.json；只改外部暂存副本，最后恢复 |
| src 全量 | 4014 总 / 3971 通过 / 43 失败；退出码 1 | b124b-src-raw.tap |
| 基线比较 | 43 对 43，新增 0、消失 0，与 b85 名单完全一致 | b124b-src-fails-raw.txt、b124b-failure-comparison.json |
| api 全量 | 791/791/0；退出码 0 | b124b-api-raw.tap |
| 现有编辑器诊断 | 新增两文件错误 0、警告 0；只读取已有诊断 | get_diagnostics，未触发构建 |
| 受保护文件 | freeImageHostApi.js MD5 不变 | 1e0458013f5341c99f21faefc1d34d3f |
| 真实消费方 | 大小写敏感模块名反查 api/src/electron 非测试代码与 main.js：0 命中 | 未接线 |

36 例覆盖登记/清理、节点/边阻断、已持有冲突、独立字段与同字段编辑、删除/后代依赖、空输入、保守兜底、锁的 actor/client 与到期边界、任务所有权/状态、旧新父节点及边端点、逆序传递阻断、输入不变性与缺失远端对象。

**日志捕获修正**：首次 PowerShell 管道输出数字正确，但一条中文失败标题转码损坏，旧正则只取到 42 个名称。没有把它报告为测试修复；新增外部 `b124b-sweep-raw.mjs`，用 Node spawnSync 捕获原始字节，再实跑 src/api，确认完整 43 项旧失败。前一份输出保留用于追溯；以 raw.tap 为验收证据。

### 收尾与下一段

- 124b 落地后镜像 38 件中已落 14 件；未落部分重新分级 **LEAF 0 / OK 6 / BLK 18**。Session 不再缺 Conflicts，但仍缺 MediaQueue 和 generationExecutionPolicy。
- 增量孤立模块台账从 270/1032 到 **271/1033**，不是全图重算；Document/FieldMerge 虽被新孤立模块引用，仍不可从入口到达。
- Git：124a 收尾 0/5/27/0 → 124b 收尾 0/5/29/0（staged/unstaged/untracked/conflicted）。没有提交推送或改动既有业务源码。
- 变更 #0042 为 124a 文档收尾，#0043 为 124b 源码/测试新增；最终文档变更由收工脚本追加。
- 124b 收尾时排定 124c：CanvasBinding 优先（现已完成，见 §7）；ChatInput、Lobby、NicknameEditor、ReviewDom、Select 的闸门已过，但须核对在用依赖的行为世代。
- **R10 不算完成**：协作服务端、API、主会话/应用装配、真实运行联调均未完成。

## 7. 124c：画布绑定与恢复检查点（2026-09-28）

### 新增与依赖

- 新增 `src/modules/collaboration/collaborationCanvasBinding.js`（120 行 / 4846 B）及同名 `.test.js`（691 行 / 27741 B），50 例测试。
- 仅导出 `createCollaborationCanvasBinding`；唯一静态依赖 `createCollaborationJournal`，实际导出核验 1/1。本仓 Journal = 暂存 = 格式化镜像，未改在用依赖。
- 源码使用 b124-stage.mjs 格式化镜像并暂存，再 apply_patch 新增；无源码语义修改。源码 SHA256：`4276e73864818b66e2ce34be4eed7eb9dc2fdfc1296b12ab7aa7b06869f6c495`。
- 测试调用真实 Journal 模块，IndexedDB 仅由本文件内的异步内存适配器模拟；失败事务不提交，支持手动完成事务以断言 close 等待。没有安装依赖、改造 Journal 或伪造生产消费方。

### 冻结的行为与边界

1. 房间元数据按当前 actor/room 隔离，host/guest 分别使用 `aicanvas.collaboration.host-canvases.v1` / `aicanvas.collaboration.guest-canvases.v1`。记录 canvasId、projectId、originalAccess、resume；重复 remember 会刷新顺序。
2. `roomFor` 先按最新记录顺序找匹配，支持房间允许列表，空列表不匹配；拒绝同 canvasId 被不同项目重用，也允许按相同 projectId 找回重建画布。相同项目的较新记录可能优先于精确 canvasId。
3. `activate` 与上述查找优先级不同：正确的活动画布直接成功，否则优先精确画布/项目，再找第一个同项目画布；没有候选返回 false。等待 switchTo 后核验活动 ID，不符则抛中文错误，切换异常原样上抛。
4. Journal 使用真实的 schema:1 记录，host/guest clientId 分别为 `host-canvas-baseline` / `guest-canvas-baseline`，数据库为 `aicanvas-collaboration-recovery`。按 actor/room 复用 Journal，close 等待已排队事务并关闭所有已打开连接。
5. **内存不等于持久化成功**：checkpoint 先深拷贝并更新内存，再写 Journal。写入失败时 Promise 拒绝，但当前实例仍能读到内存检查点；新的实例读不到失败记录。无 IndexedDB 时仍可用内存，不具备跨实例恢复保证。
6. **读取不是防御性副本**：checkpoint 输入会深拷贝，但缓存命中时 baseline/mediaBindings 返回缓存引用；调用方修改返回值会改变该实例缓存。只从 Journal 读取的结果不会填入这个内存缓存。
7. **forget 只删房间元数据，不删恢复日志或检查点缓存**；close 也不清空缓存，不应被当作数据删除接口。关闭后如需新持久化会话，应新建绑定实例。
8. 存储读取异常、坏 JSON、数组或非对象顶层按空映射处理，写入错误不吞掉；originalAccess 保留显式 null/false/0/空字符串，只有不存在该属性才用后备值。

这些是镜像源的既有语义，已用测试固定，不宣称完成错误回滚、恢复数据清理或真实浏览器生命周期验收。actorId/canvasTabs 等契约仍需后续 Session/Application 装配验证。

### 测试、静态检查与回归证据

| 检查 | 结果 | 证据（b124/ 下） |
| --- | --- | --- |
| 唯一依赖导出与世代 | 1/1，Journal 与格式化镜像及暂存相同 | b123-gate.mjs、b124-stage.mjs --check collaborationJournal、Get-FileHash |
| 源码/测试与暂存 | 各 1/1 哈希相同，源码再核对镜像格式化一致 | port/ 与 tests/ 下同构文件 |
| 主机与沙箱首跑 | 各 50/50，0 失败、0 跳过，无首跑修正 | b124c-tests.tap |
| 语法 | 新增两文件 node --check 2/2 | 主机实跑 |
| 格式 | 协作暂存源码与测试 30/30，prettier 3.9.8 | b124-prettier-check.mjs |
| 变异抽查 | 21/21 有效语法变异被检出；不是完整覆盖率 | mutate124c.mjs、mutation124c/results.json；仅改外部暂存副本，finally 恢复 |
| src 全量 | 4064 总 / 4021 通过 / 43 失败，退出码 1 | b124c-src-raw.tap |
| 失败名基线 | 与 b85 的 43 项完全一致，新增 0、消失 0 | b124c-src-fails-raw.txt、b124c-failure-comparison.json |
| api 全量 | 791/791/0，退出码 0 | b124c-api-raw.tap |
| 编辑器现有诊断 | 新增两个文件错误 0、警告 0（没有触发构建） | get_diagnostics |
| 受保护文件 | freeImageHostApi.js MD5 不变 | 1e0458013f5341c99f21faefc1d34d3f |
| 生产消费方反查 | api/src/electron 非测试 JS 与 main.js，大小写敏感模块名搜索 0 命中 | 未接线，根目录无 renderer.js |

50 例覆盖元数据与 actor/host/guest 隔离、畸形顶层存储、读写失败、重记排序、允许列表、项目迁移与画布 ID 重用、精确/项目匹配优先级、异步切换等待与后验错误、恢复检查点深拷贝/引用边界、真实 Journal 重开恢复、写失败后重试、连接复用与等待关闭。

全量回归使用 `b124c-sweep-raw.mjs` 从 Node 捕获原始 UTF-8 字节，沿用上一段的日志捕获修正，没有使用中文转码受损的 TAP 做名单比较。未跑 Electron 全套（本次未改 Electron）、未启动应用、未构建、未做真实服务调用或浏览器验收。

### 收尾与后续

- 协作镜像 38 件中已落 15 件，本批累计 207 例；未落部分 **LEAF 0 / OK 5 / BLK 18**。Application 不再缺 CanvasBinding，但仍缺 canvasCollaborationApi 和 Session。
- 本模块及 Journal 仍从入口不可达；增量台账 **272/1034**（上段 271/1033 加 1），非重跑全图遍历。
- Git：开工 0/5/29/0 → 收尾 0/5/31/0（staged/unstaged/untracked/conflicted）。源码/测试为新增，未覆盖既有业务实现，未提交推送。
- 变更 #0045 已登记两件新增；本节及主台账等文档由收工脚本追加记录。主台账只保留 10 条日志，本次把第七次会话原样移至归档。
- 124c 收尾时排定下一段 124d 为 ChatInput（现已完成，见 §8）；Lobby、NicknameEditor、ReviewDom、Select 后续分段，仍不自动升代受保护装配件。
- **R10 未完成**：本次只是前置模块落地，协作服务端、API、Session/Application 实际装配和真实联调仍缺失。

## 8. 124d：聊天输入事件绑定（2026-09-28）

### 新增文件与依赖世代

- 新增 `src/modules/collaboration/collaborationChatInput.js`（55 行 / 2159 B），唯一导出 `bindCollaborationChatInput`；同名测试 526 行 / 18019 B，共 40 例。
- 源码 SHA256：`fa3b17b0bc8256f1028aeacd5e8e138f6b925ff1aee907df2cab7569e53cf87a`，与格式化镜像和暂存逐字节一致，未改变原有语义。
- 静态导入只有 `hasActiveModalInteraction`，导出闸门 1/1。本仓 `src/services/modalInteractionScope.js` 与格式化镜像完全一致；其 `src/utils/focusTrap.js` 也完全一致，故本批不升代或修改任何在用依赖。
- 世代比对证据为 `b124d-dependency-check.mjs` / `b124d-dependency-check.json`（位于外部 b124 暂存目录）。modalInteractionScope SHA256 为 `81ad57b172706b35e169f4c264ec4fb9ba37cb478c6e3aebfb45922037962c46`；focusTrap 为 `d36ba3c3e64fef4ae4485b07c4d55ed83fd404673d9ad28700ae9841477652e7`。

### 固定行为与后续接入注意事项

1. 监听 `shortcut-action`、`pointerdown`、`click`、`blur`；pointerdown/click 使用捕获监听，其余默认非捕获。返回解绑函数使用相同处理函数与 capture 标志移除四项监听；可重复解绑，重新绑定不继承待抑制节点。
2. 快捷动作仅接受 `collaboration-chat-add-selection`，录制或存在连接中的模态窗口时忽略。每次读取当前 selectedNodeIds，将 Set/数组等可迭代值复制成新数组交给 addNodes，空缺值按空数组处理。
3. **两条路径并不等价**：快捷动作不检查聊天是否打开、目标是否可编辑或选中 ID 是否仍在 nodes 中，也不阻止该自定义事件；这些由上游或 chat.addNodes 契约负责。不要把指针路径的保护误认为两条路径共有。
4. 指针路径要求聊天打开、严格 button===0、未录制、无活动模态、目标不处于 input/textarea/contenteditable=true/role=textbox 中，并由快捷键解析器匹配 `collaboration-chat-pick-node`。closest `.v2-node` 的 ID 还必须对应 store.nodes 中的真值记录。
5. **回调按同步真值判断**：解析器匹配和 addNodes 返回值按真值判定，未 await。只有 addNodes 返回真值才阻止 pointerdown 默认行为与后续同目标处理，并记住该 DOM 节点；返回 false 则不拦截。已 defaultPrevented 的 pointerdown 不会在此层自动跳过，接入时必须考虑监听次序。
6. 首个落在记住节点自身或后代上的 click 会被阻止并清除记忆；不相关 click 不拦截，且不清除记忆。下一次任意 pointerdown 或 blur 会清除旧记忆，即便该 pointerdown 随后不符合拾取条件。click 抑制时不再检查聊天、录制或模态状态。
7. 只使用真实 `modalInteractionScope` 的模态状态，连接中的任意 scope 均阻止操作，不仅是最上层；已断开的 root 不算活动。测试通过真实 beginModalInteraction 打开/释放 scope，未伪造 hasActiveModalInteraction 导出。
8. windowObject 可注入；未提供时默认访问浏览器 window。chat、store、解析器、isRecording 都是调用方契约；异常会传播，不自动转换成成功或吞掉。

测试内仅有最小事件目标/节点适配器，保留监听标志、处理函数身份和 contains/closest 行为，并在每项后清理监听与真实模态 scope。**这不是浏览器事件传播、IME/触摸或真实快捷键系统的运行验收**。

### 测试与检查证据

| 项目 | 结果 | 证据（外部 b124/ 下） |
| --- | --- | --- |
| 静态依赖导出 | 1/1 | b123-gate.mjs |
| 依赖世代 | modalInteractionScope 与 focusTrap 各自逐字节一致 | b124d-dependency-check.json，落地前与收尾均复核 |
| 定向首跑 | 沙箱与主机均 40/40，0 失败、0 跳过，无首跑修正 | b124d-tests.tap |
| 语法 | 新增源码/测试 node --check 2/2 | 主机实跑 |
| 字节一致性 | 源码/测试与各自暂存相同 | Get-FileHash；源码再核对格式化镜像 |
| 格式 | prettier 3.9.8，协作暂存源码/测试 32/32 | b124-prettier-check.mjs |
| 变异抽查 | 21/21 有效语法变异被检出，不代表完整覆盖率 | mutate124d.mjs、mutation124d/results.json；只改暂存副本，finally 恢复 |
| src 全量 | 4104 总 / 4061 通过 / 43 失败，退出码 1 | b124d-src-raw.tap |
| 失败名比对 | 对 b85 的 43 项新增 0、消失 0，完全一致 | b124d-failure-comparison.json、b124d-src-fails-raw.txt |
| api 全量 | 791/791/0，退出码 0 | b124d-api-raw.tap |
| 现有编辑器诊断 | 新增两文件错误 0、警告 0；非构建结果 | get_diagnostics |
| 受保护文件 | freeImageHostApi.js MD5 不变 | 1e0458013f5341c99f21faefc1d34d3f |
| 生产消费方 | 模块名及导出名在 api/src/electron 非测试 JS、main.js 中均无外部命中 | 大小写敏感反查；未接线 |

40 例覆盖 listener 注册/解绑/默认 window、选择拷贝和空值、快捷动作门控、两路径差异、五种非左键值、录制/真实模态状态、可编辑目标、快捷键未匹配、缺少 closest/节点、有效或拒绝的拾取、一次性 click 抑制、无关 click、新 pointerdown、blur、重绑与多实例隔离、回调异常。

全量回归沿用 Node 原始 UTF-8 TAP 捕获（b124d-sweep-raw.mjs），没有用 PowerShell 转码后的失败标题判断基线。未改 Electron，未跑 Electron 全套；未启动应用、构建、真实服务调用、安装依赖或真机验收。

### 收尾与下一段

- 协作镜像 38 件中已落 **16 件**，本批累计 **247 例**；剩余 **LEAF 0 / OK 4 / BLK 18**。
- 新模块尚无生产消费方，增量孤立模块台账 **273/1035**（上段 272/1034 加 1）；没有重跑全图入口遍历。
- Git：0/5/31/0 → **0/5/33/0**（staged/unstaged/untracked/conflicted）；新增两件代码/测试并维护文档，无提交推送。记录 #0047 为源码与测试，最终文档由收工脚本登记。
- 124d 收尾时排定 **124e 优先 collaborationReviewDom**（现已完成，见 §9）：源文件约 2176 B，依赖 MemberColor 与 contextMenuIcon，先核对导出和行为世代。它补齐后，Activity、CommentThreads、NodeReference 三件可进入下一轮导出检查，不保证直接可接入。
- 另三件为 Lobby（约 8499 B）、NicknameEditor（2752 B）、Select（5136 B），均须继续做依赖世代核对和独立测试。
- R10 仍未完成：聊天面板本体、协作 API/服务端、Session/Application 装配与真实运行验收都不是本批交付内容。

## 9. 124e：评审 DOM 辅助件（2026-09-28）

### 新增、依赖与兼容性范围

- 新增 `src/modules/collaboration/collaborationReviewDom.js`（63 行 / 2562 B）及同名测试（525 行 / 19836 B），共 37 例；源码与格式化镜像、暂存逐字节一致。
- 源码 SHA256：`1d0be152d3bbd9266f73631a1fb19d73305e5605472c47bf1cf767f7f183cb02`；最终测试 SHA256：`a9c9a8bafa7d6207a2bf6d88dead82d5dd3d95a6691ec3de9063c264b54de73a`。
- 六个公开导出为 reviewElement、reviewTime、colorMemberName、appendMentionText、reviewAvatar、reviewSendButton。两个静态导入均过真实导出闸门；没有伪造导出、消费方或缺失夹具。
- `collaborationMemberColor.js` 与格式化镜像逐字节一致，SHA256 `ef4a74eee3be209bebbc1db2e9126cb44fa3ddebe6abc3dd4a5f33e361fcb224`。
- **图标依赖并非字节相同**：本仓 contextMenuIcon 与 contextMenuIconCatalog 的局部命名和镜像不同。保留现有文件，另用两份真实模块做受限行为差分，不能只凭文件存在或导出名相同认定兼容。
- 差分核对 40 个图标 ID，并加入 4 个别名、带空白 send、未知/空/null/0，共 49 组定义。每组分别核对默认参数、自定义尺寸/颜色、无 dataset、无 SVG 创建能力、null document，共 245 组生成树；均无差异，包含本模块唯一使用的 send 图标。
- 图标工厂 SHA256 `2a91820152e3136a142dd98ddc4f2563fa25eb0c98e549da583b2db26c2e9e15`；图标目录 SHA256 `f2f71bf93e65330bc80f055645e3e0a32e952b9b886f8c2d8ee919124e41633d`。落地前后依赖哈希不变。
- 证据：外部 b124/ 下的 `b124e-dependency-check.mjs/.json`、`b124e-icon-compat.mjs/.json`。比较使用最小 DOM 适配器，不代表所有输入或真实浏览器渲染均已验收。

### 固定语义与调用边界

1. reviewElement 用 createElement、className、textContent 创建节点，不解析 HTML；只有传入的标签名严格为小写 button 时才设 type=button。默认 class/text 为空；不会为其他标签补按钮语义。
2. reviewTime 将输入秒值乘 1000 交给 Date，再以当前环境的本地月、日、两位时/分格式化；不自行校验输入，也不固定时区或语言。
3. colorMemberName 在原节点添加 collaboration-member-name 类并写 --member-color，返回同一节点，保留其他内容/样式；成员颜色来自真实 MemberColor。
4. appendMentionText 仅考虑 mentions.includes(id) 且 name 为真值的成员；不把数字 ID 转成字符串。按 JS 字符串 length 降序选择名字，相同名字取成员数组中的首个允许项，不按 mention ID 列表排序；不修改两个输入数组。
5. **提及右边界只检查一个 UTF-16 码元**：用 Unicode L/N/下划线正则检查紧接姓名的 text[index]。BMP 字母、数字和下划线阻止前缀高亮；标点、组合附加符及非 BMP 字母/数字的首个代理码元不会阻止。测试包含 U+10400、U+1D7CE，不能宣称实现了完整 Unicode 词边界。
6. 提及匹配区分大小写，但不要求 @ 前有边界，email@Ann.example 中仍可高亮 @Ann。更长的未允许名字不阻止较短允许名字在空格处匹配；这些均保留源端语义，未擅自修改匹配规则。
7. 该函数向现有内容追加文本节点和带颜色的 span，不清空宿主；消息正文和昵称中的 HTML 字样都作为文本。首尾及连续提及间会保留显式空文本节点，返回 undefined。
8. reviewAvatar 用 Array.from(name 或“成员”)[0] 取首个 Unicode 码点，空名显示“成”；不 trim，也不取完整字素簇（组合字符/ZWJ 序列会截在首码点）。输出带头像类、成员颜色和 aria-hidden=true 的 span。
9. reviewSendButton 按参数真值设置“发送”或“发送中…”的 aria-label，每次以真实 send SVG 替换全部子节点；不设置 disabled 或 aria-busy，也不复用旧图标。缺少 SVG 创建能力时，源代码仍将 null 传给 replaceChildren，没有补替代图标。

37 例通过公开入口调用真实 MemberColor、图标工厂与图标目录；只模拟 DOM 接口，并在每例结束恢复全局 document 和日期格式化 mock。覆盖身份/样式保留、时间单位与选项、允许列表/排序/重复名、码元边界、纯文本写入、头像与发送状态。未做浏览器布局、样式、焦点或辅助技术验收。

### 测试与回归证据

| 项目 | 结果 | 证据（外部 b124/ 下） |
| --- | --- | --- |
| 定向首跑 | 沙箱与主机均 37/37，无失败或跳过 | b124e-tests-first-spec.txt 保留主机 Node 24 默认 spec 首跑输出 |
| 最终复跑 | 扩充原有一例的非 BMP 断言后，沙箱与主机仍 37/37；未改源码 | b124e-tests.tap 为最终显式 TAP 输出 |
| 语法 | 源码与最终测试 node --check 2/2 | 主机实跑 |
| 字节一致性 | 协作目录全部 34 件源码/测试与各自暂存一致；新源码等于格式化镜像 | b124e-hashes.json、b124-stage.mjs --check |
| 格式 | prettier 3.9.8，暂存源码/测试 34/34 | b124-prettier-check.mjs |
| 变异抽查 | 23/23 有效语法变异检出；每次均完整跑 37 例，无取消；不是完整覆盖率 | mutate124e.mjs、mutation124e/results.json；只改外部副本，完整运行 finally 恢复 |
| src 全量 | 4141 总 / 4098 通过 / 43 失败，退出码 1 | b124e-src-raw.tap |
| 失败名基线 | 与 b85 的 43 项完全一致，新增 0、消失 0 | b124e-src-fails-raw.txt、b124e-failure-comparison.json |
| api 全量 | 791/791/0，退出码 0 | b124e-api-raw.tap |
| 现有编辑器诊断 | 协作目录错误 0、警告 0；非构建结果 | get_diagnostics |
| 受保护文件 | freeImageHostApi.js MD5 不变 | 1e0458013f5341c99f21faefc1d34d3f |
| 消费方反查 | src/api/electron 非测试 JS 与 main.js，排除自身后扫描 1029 件，模块名及完整导出标识符 0 命中 | b124e-consumers.json、b124e-close-checks.mjs；未接线 |

首跑没有红例；#0050 是审读后补充已有测试的码元边界断言，不是修复实现。最终测试已重跑定向、变异和 src/api 全量。

首次后台 sweep/变异尝试因 timeout_ms=1000 被桥接器按 1 秒生命周期终止，未用作通过证据；确认旧进程退出、恢复中断副本并保留 `mutation124e-interrupted/`、`b124e-interrupted-commands.json` 后，给足生命周期重跑。src/api 用 Node 原始 UTF-8 字节捕获，不经 PowerShell 管道转码。

MCP 泛搜触及文件扫描上限，空结果仍带 truncated=true，因此改用完整限定目录遍历并匹配标识符边界；没有把截断的空结果认作消费方为零。未启动应用、构建、安装依赖、调用真实服务或做 Electron/浏览器验收；没有自动提交推送。

### 新解阻项不等于可移植：下一段

- 镜像 38 件中已落 **17 件 / 284 例**。按依赖文件存在性重分级为 **LEAF 0 / OK 6 / BLK 15**；OK 中仍可能有导出级阻塞。
- 新转为文件存在性 OK 的 Activity、CommentThreads 已过真实导出检查，均只从 ReviewDom 导入；仍需各自审读源代码、编写离线组合测试，不代表运行可用。
- **NodeReference 仍阻塞**：它虽然进入文件存在性 OK，但现有 `src/services/canvasMediaLocalService.js` 缺少 `resolveCanvasVideoPosterUrl`。另外三个导入已存在；证据 `b124e-gates.json`。未加 shim，未为它静默升级媒体服务，也未落其源码。
- **124f 优先 CommentThreads**（镜像约 2854 B），随后 Activity（4193 B）；Lobby、NicknameEditor、Select 继续按各自依赖和行为边界核验。NodeReference 单独保留依赖设计/授权闸门。
- 增量孤立台账 **274/1036**，由上段 273/1035 加本模块所得，非全图重算。Git **0/5/33/0 → 0/5/35/0**；记录 #0049 新增源码/测试，#0050 补充测试边界，文档收尾由脚本追加。
- R10 仍未完成：API/服务端、Session/Application 接线和真实多人运行验收均未交付；R01–R26 也不因本次模块落地变成完成。