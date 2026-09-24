# 第 97 批：Agent 能力路由与参数提示（2 件纯叶落地，不接线）

本批承接第 96 批 §8 排定的「剩余 3 件纯叶」，落地其中 2 件；第 3 件（`agentTaskBindingRuntime.js`）本批不承接，原因见 §6。

## 1. 缺口与闭包审计

| 指标 | 本批前 | 本批后 |
| --- | --- | --- |
| 移植源 `src/modules/agent`（0.7.16 反混淆镜像） | 81 件 | 81 件 |
| 仓库 `src/modules/agent` 非测试源码 | 36 件 | 38 件 |
| 仓库 `src/modules/agent` 测试文件 | 24 件 | 26 件 |
| 未落地 | 45 件 | 43 件 |
| AST 分级：纯叶 LEAF | 3 | 1 |
| AST 分级：依赖齐全 OK | 22 | 24 |
| AST 分级：依赖缺失 BLK | 20 | 18 |

复算命令：`node C:/Users/luobote/.qoder/tmp/deobf-tools/b95/deps-ast.mjs src/modules/agent`。

闭包效果（BLK→OK 的 2 件全部由 `agentParameterHints.js` 解锁）：

- `agentLoopRecovery.js` ← `./agentParameterHints.js`
- `agentPlanLifecycle.js` ← `../../i18n/manifestText.js` + `../../manifests/index.js` + `./agentParameterHints.js`

`agentCapabilityRouter.js` 本批未解锁任何移植文件：移植全镜像里只有 `agentContextBuilder.js` 引用它（`grep -rl agentCapabilityRouter` 于 `shuo-deobf` 命中 2 个文件：自身与 `agentContextBuilder.js`），而后者是**已在仓库运行的上一代装配件**，属受保护升级对象。

## 2. 交付物

| 文件 | 行数 | 字节 | 导出 | 来源（`cmp` 一致） |
| --- | --- | --- | --- | --- |
| `src/modules/agent/agentParameterHints.js` | 271 | 11 621 | 4 | `b96/port/`（原始移植体 9 905 B） |
| `src/modules/agent/agentParameterHints.test.js` | 298 | 14 393 | — | 新写，16 例 |
| `src/modules/agent/agentCapabilityRouter.js` | 343 | 14 162 | 2 | `b96/port/`（原始移植体 11 947 B） |
| `src/modules/agent/agentCapabilityRouter.test.js` | 304 | 12 339 | — | 新写，17 例 |

合计 2 件源码 / 6 个导出 / 2 件测试 / 33 例。仓库字节数与移植源字节数不同，是因为落库前统一跑过 Prettier（`printWidth:110`、`singleQuote`、`arrowParens:always`）；`cmp` 比对对象是同一份 Prettier 产物。

### 2.1 `agentParameterHints.js` 关键行为

导出：`extractAgentDuplicateCountHint`、`extractAgentParameterHints`、`buildSupportedAgentParamsFromHints`、`isAgentEditableParamField`。零相对依赖。

- 提示抽取顺序固定为 尺寸 → 比例 → 分辨率 → 时长 → 批量，`requestedParamIds` 按该顺序产出。
- 尺寸正则 `(\d{3,5})\s*(?:x|×|\*)\s*(\d{3,5})` 只接受 3–5 位；比例用 GCD 约简；`resolution` 直接取高度拼 `p`。
- 比例抽取接受 `:`、全角 `：`、汉字 `比` 三种分隔符，且约简后必须命中 8 项常用表（`1:1 3:4 4:3 9:16 16:9 21:9 3:2 2:3`），否则丢弃并回落到关键词（横版/竖版/方图）或尺寸推导。
- 副本数提示支持阿拉伯数字与「一–十 / 十X / X十Y」中文十进制，结果裁剪到 1–12，越界与非整数返回 `undefined`。
- 落地阶段逐字段归类，一个字段最多只吃一个参数；`options` 非空且匹配不到时整字段 `continue`。
- `unsupportedParamIds` 由「请求集合减去被任一字段接住的规范名」得到，因此字段 id 用了别名（`ratio`/`max_images`）也能正确判为已支持。

### 2.2 `agentCapabilityRouter.js` 关键行为

导出：`routeAgentCapabilities`、`agentCapabilityRouterInternals`（冻结的 `inferNamespaces` / `findIntentCommandIds` / `COMMAND_NAMESPACES`）。零相对依赖。

- 注册表 ≤ 12 条（`SMALL_REGISTRY_FULL_DISCLOSURE_LIMIT`）时走 `full`：整表披露、`deferredCommandIds` 恒为空、`maxCommands` 被忽略。
- 超过 12 条走 `progressive`，打分来源与共 6 层（`addCommandPriority` 取 max）：

| 来源 | 分值 | 常量 |
| --- | --- | --- |
| `requiredCommandIds` | 700 | `0x2bc` |
| 用户消息里出现命令 id 字面量 | 600 | `0x258` |
| `COMMAND_INTENT_PATTERNS` 17 组中英意图模式 | 500 | `0x1f4` |
| `skills[].commands` | 400 | `0x190` |
| `ALWAYS_AVAILABLE_COMMANDS` 6 条 | 350 | `0x15e` |
| 推断出的命名空间成员 | 200 − 推断序号 | `0xc8 - i` |

- 9 个命名空间（generation/edit/selection/layout/media/storyboard/task/export/scene）各自带命令白名单与中英正则；`intent` 的 `namespace`/`route`/`capability`/`action`/`operation` 与 `namespaces[]` 都参与推断，`targetKind` 非空且 `canvasAction` 或 `mutatesCanvas` 为真时补 `generation`。
- `maxCommands` 下限为常驻命令数 6；非有限值（如 `'abc'` → `NaN`）回落到默认 18，而不是回落到下限。
- `catalog.namespaces` 始终按**全量可用命令**统计，两种模式下同样内容，与被披露的子集无关；空成员命名空间被过滤。

## 3. 接线状态与前置条件

`grep -rl "agentCapabilityRouter\|agentParameterHints"` 覆盖 `src` `api` `electron`（排除本批 2 件自身与 2 件测试）：**0 命中**。本批 2 件按「不编造消费者」原则原样落地、不接线、不改任何装配件。

后续接线前置条件（逐项都需单独批次 + 真机验证 + 运行授权）：

| 消费方 | 需要哪个代际 | 状态 |
| --- | --- | --- |
| `agentCapabilityRouter` | `agentContextBuilder.js` 升级到 0.7.16 代际后按 `routeAgentCapabilities` 组装提示 | 受保护装配件，未获升级授权 |
| `agentParameterHints` | `agentLoopRecovery.js` / `agentPlanLifecycle.js`（依赖已齐全，可作下一批纯移植）→ 再由 `agentRuntime.js` 代际升级后调用 | 前者可落地，后者受保护 |

## 4. 审计发现与端口现状冻结清单

以下为通读 + 测试实测得到的端口现状，一律**以断言冻结、不修改实现**（移植要求字节一致）：

1. **打分只决定入选集合，不决定输出顺序。** `progressive` 的最终 `commands` 是 `_0x219b75.filter(命令 ∈ 入选集)`，因此模型看到的命令顺序恒为注册表原序；`includedCommandIds` 同理。
2. **没被打分命令永远不会入选，`maxCommands` 再大也补不满。** 空消息、无 required/skill 时，注册表 18 条只会披露 6 条常驻命令；命名空间层命中不足时同样会少于 `maxCommands`。
3. **常驻层(350) 恒高于命名空间层(≤200)**，所以「按意图聚焦」永远排在「命名空间补齐」之前，`maxCommands` 吃紧时先裁掉整个命名空间层。
4. `agentParameterHints` 里 `isAgentEditableParamField` 的候选词表**短于** `buildSupportedAgentParamsFromHints`（`['resolution']` vs `['resolution','quality','size']`；`['duration']` vs `['duration','seconds']`；`['batchSize','max_images']` vs 再加 `'count'`）⇒ 同一字段可能「能被提示填值」却「被判不可编辑」。
5. `normalizeOptionText` 归一空白、`，,`、`×→x`，但**不**归一全角 `：` ⇒ 选项标签写成 `竖版 9：16` 时永远匹配不上（抽取侧反而接受全角冒号）。
6. `fieldLooksLike` 的标签匹配只比对拉丁候选词 ⇒ 中文标签（`输出分辨率`/`生成数量`）在两个函数里都判不出角色；命名空间正则一侧则有完整中文分支，两侧不对称。
7. 类型白名单判定 `String(type).toLowerCase()` 未 `trim` ⇒ `'SELECT'` 判可编辑、`' Slider '` 判不可编辑。
8. `options` 非空且未命中时在 `normalizeBatchValue` 之前就 `continue` ⇒ 「批量字段无匹配项保留原值」这条兜底路径在**有** options 时是死代码，只有无 options 才会原样写入。
9. 同一档位可被多个字段重复吃值：`batchSize` 与 `max_images` 同时存在时，一次批量提示会写出两个参数（端口现状，测试已固化）。
10. `resolution` 由尺寸高度推导 ⇒ `1080 × 1920` 得到 `'1920p'`；分辨率词表用 `\b(720p|1080p|2160p|4k|2k|1k)\b`，数字与单位间有空格即整段落空（`2 k` 不识别）。
11. `normalizeCommands` 用 `cmd?.id` 真值过滤 ⇒ `id: ''`、`id: 0`、非对象条目被丢弃；重复 id 会保留两次并同时入选。

## 5. 验证矩阵（全部离线，已实际执行）

| 项 | 命令 | 结果 |
| --- | --- | --- |
| 字节一致 | `cmp -s` 仓库 vs `b96/port/src/modules/agent/` | 2/2 IDENTICAL |
| 语法 | `node --check` 2 件源码 | SYNTAX-OK |
| 零依赖 | `grep -c '^import'` | 两件均 0 |
| 格式 | Prettier `--check` / `--write` | 源码 unchanged；测试 written |
| 本批测试 | `node --test` 2 件测试 | 16/16、17/17 全绿 |
| src 全量 | `find src -name '*.test.js'`（233 件）`node --test --test-reporter=tap` | 2594 例 / 2551 pass / 43 fail |
| 失败集合 | `diff b85-fails.txt b97-fails.txt` | `diff-exit=0`（与基线逐名一致，无新增回归） |
| electron 全量 | `find electron -name '*.test.js'` | 1649 / 1648 / 1（与本批前一致） |
| 受保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f` 未变 |
| 工作区快照 | `git status --porcelain` / `git ls-files --others` | 暂存 0 / 已改 67 / 未跟踪 675 / 冲突 0（+5：2 件源码 + 2 件测试 + 本文档） |

本批测试首跑即暴露 3 处**测试侧**期望错误（把「打分顺序」当成了「输出顺序」），已按实现现状改写断言，未动实现。

## 6. 本批明确不承接

- `agentTaskBindingRuntime.js`（移植体 13 818 B，AST 复核后 `src/modules/agent` 剩下的**唯一**纯叶，`LEAF(0 deps)=1`）：本批未落地。它零导入，因此不会被任何依赖卡住；但它与已落地的 `agentDurableRunState.js` 共用任务绑定词表（文件内 `binding` 出现 15 次、`notifiedTerminal` 5 次，后者正是 `normalizeAgentTaskBinding` 的字段），终态与幂等口径必须逐行通读后单独出断言集。460 行的量塞进本批会让测试退化成未经实测的猜测，故整体挪到第 98 批首批。
- 不升级任何在用的 Agent 装配件（`index.js` / `agentRuntime.js` / `agentPanel.js` / `agentContextBuilder.js` / `agentConversationStore.js` / `agentSessionStore.js`）。
- 不补 `api/agentAssistantApi.js`，不动 `src/core/math.js`（62 处消费方）。
- 不加 i18n 文案、不加 npm 依赖、不改授权判定。

## 7. 约束复核

- 未执行 build / 启动 / 真实 AI 服务调用；只有 `node --check`、`node --test`、`cmp`、`md5sum`、`git status`。
- 未做批量覆盖式文件操作；落库仅 `cp` 2 件源码 + 新建 2 件测试，逐件 `cmp` 复验。
- 未推送、未提交、未触发 release workflow。
- 反混淆临时目录与绝对开发机路径只出现在文档与测试命令里，未进入任何运行时依赖。
- 无消费方的 2 件按台账记为「落地不接线」，未擅自接线、未伪造 shim。

## 8. 下一批建议

**第 98 批**：取最后一件纯叶 `agentTaskBindingRuntime.js`，与已落地的 `agentDurableRunState.js` 做绑定语义对齐测试；随后按依赖齐全度推进 `agentLoopRecovery.js`、`agentPlanLifecycle.js`（两者 OK 级，`agentPlanLifecycle` 还需 `../../i18n/manifestText.js` 与 `../../manifests/index.js` 的导出核对）。**必须以 AST 结果 + 逐行通读为准**，任何缺导出即记 BLK，不写 shim。
