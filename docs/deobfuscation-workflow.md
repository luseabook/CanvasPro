# 反混淆工序（de-obfuscation batches）

> 目标：把源码里的逆向残留名（`_0x17f006` 这类）改成可读名，**只做改名**，并用机器证明
> 等价性。范围不限于某一批，每批都是可独立验证的检查点。

## 0. 为什么不顺手做

- 改的是**在用文件**，与"只新增"的移植批次不是一类改动，必须单独成批。
- 现有回归锚点是"src 失败名单逐条一致"，只有在改名是**独立一次干净改动**时才可比对。
- 会**打断移植工序**（见 §4），必须先想好替代把关方式。

## 1. 每个批次的工序

1. **选件**。起步阶段优先叶子模块（零消费方 + 有同名测试 + 体积可控），但这只是降低心智负担的
   便利手段，**不是必需条件**：闸门会守住导出面，所以任何文件都能安全改名。
   小文件优先，单位时间能清掉的文件更多。

   ```bash
   node tools/deobf-scan.mjs            # 零消费方候选
   node tools/deobf-scan.mjs --all      # 全部候选（含被别处引用、带同名测试的文件）
   ```

   `--all` 会列出全部候选及其消费方数量。**落地前仍要人工看一眼**导出面是否有需要连带修改的情况
   （本仓实测不需要，见 §2）。

2. **备份原件到仓库外**（校验器需要原件做比对）：

   ```bash
   cp <file> "$TMP/deobf-backup/<basename>.original.js"
   ```

3. **建映射表并只做改名**。映射是 file-scoped 的；脚本必须断言
   "文件里出现的所有 `_0x` 名都已在映射表中"，否则**拒绝写入**（防止漏改）。不新建、
   不删除任何标识符，不改字面量，不改结构。

4. **严格校验（未格式化状态）**：

   ```bash
   node tools/deobf-verify.mjs <原件> <新件>
   ```

   必须 `PASS`。`FAIL` 说明改的不只是名字，回退重做。

5. **看 `REVIEW` 行**（可选）。闸门只在"两个不同的旧名映射到同一个新名"时打印 `REVIEW`；
   这种情况本身不会通过闸门（会先 `FAIL` 于遮蔽检查），所以看到 `REVIEW` 说明映射表不单射，
   应直接重做映射。遮蔽已由闸门硬性拒绝，不需要人工逐个判断。

6. **格式化**（配置与移植工序一致）：

   ```bash
   node <prettier>/bin/prettier.cjs --config <prettierrc.json> --write <file>
   ```

   配置：`singleQuote=true, printWidth=110, tabWidth=2, semi=true, arrowParens=always, endOfLine=lf`。

   > **注意：prettier 不是 token 保等的，所以格式化这一步无法用等价闸门证明。**
   > 实测：`startupVisualReadiness.js` 里 `return (……);` 在原名较长时 prettier 保留外层括号，
   > 改名后表达式能收进一行，prettier 就把这对外层括号去掉了（token 少 2 个）。
   > 把"格式化后的原件"当基线再比也不行（同样 FAIL），因为换行/括号决策**依赖内容长度**。
   > 因此闸门只对第 4 步的**纯改名**做等价证明；格式化交给 prettier 自身的语义保持保证，
   > 并用第 7 步的测试兜底。

7. **验收**：`node --check <file>` → 该模块测试 → 全量回归（失败集合必须与上一批次一致）→
   `--explain` 输出改名映射存档。

## 2. 校验器原理与边界

`tools/deobf-verify.mjs` 是**词法级**闸门，不依赖解析器（本仓没有可用的 JS parser）。
词法与括号分类都由 `tools/deobf-lex.mjs` 提供，闸门、取名器、扫描工具共用同一份实现，
避免各写一套规则而结论不一致。

- token 种类序列必须完全一致；
- 字符串字面量**按解码后的值**比较（prettier 会把 `"a"` 改写成 `'a'`，引号风格不属于语义），
  正则按原文比较，数字**按值**比较（因此 `0x200` → `512` 这类规范化是允许的）；
- 标识符必须构成一致映射（同名必映射到同一新名），改名数量与位置一一对应；
- **导出面必须不变**：导出名集合必须相同，且 `export { ... }` 子句里出现的标识符一律不许改名
  （否则 `export { local }` 会指向不存在的绑定）。
- **数据位不许改名**：三类位置上的标识符是数据不是绑定 ——
  成员访问 `obj.name` / `obj?.name`、对象键 `{ name: v }`、**简写属性 `{ name }`**
  （简写时键就是绑定名，改绑定名等于改键）。括号分类是启发式的：`{` 前面若是
  `=` `(` `,` `[` `:` `return` `const`… 才算对象字面量/解构，函数体与 `case x: {` 块不算。
  识别不出来的一律当块处理 —— 代价是漏保护一个名字（保持混淆），而不是错误改名。
- **改名目标不许与文件里既有的绑定/引用同名**：否则会静默遮蔽，
  例如真实踩到的 `const isPlainObject = isPlainObject(item) ? ... : {}`，
  后面的 `isPlainObject(x)` 立刻变成调用一个对象，测试直接挂。
  只出现在数据位的名字不算"已被占用"（`{ sanitizePromptHtml: sanitizePromptHtml }` 是合法的）。
- 多行列表的**尾逗号**做归一化（prettier 只在多行时输出尾逗号，属格式差异）。
  注意 `[,]` 这类空位数组的逗号不会被误删。

实测（用同一套词法器扫全仓 src/electron/api）：**`_0x` 出现在成员名位置 0 处、对象键位置 0 处、
简写属性位置 0 处**。所以数据位检查目前是纯安全网，实际不会触发；也说明本仓的混淆只作用于
绑定名，属性名一直保持原样。早期用正则粗扫得出的"303 处简写属性"是误报（把
`const a = 1, b = 2` 的多变量声明列表和 `case 'x': {` 块当成了对象字面量）。

导出面这条检查是解除"零消费方"限制的前提：它保证改名只在文件内部发生，消费方一行都不用动。
实测全仓 **1659 个**含 `_0x` 名的非测试文件里，**导出名被混淆的为 0 个**，所以这个前提天然成立。

**它证明不了什么**：看不见需要 AST 的改写。以下变换会被判 `FAIL`，需另想法子：

- `!![]` → `true`、`![]` → `false`；
- 改写表达式结构（提取变量、合并条件、提前返回）；
- `obj['key']` → `obj.key`（token 种类会变）。

这些属于后续批次，需要更强校验（引入 parser 或逐条白名单化改写）。

## 3. 已完成的批次

| 批次 | 件数 | 改名数 | 结果 |
|------|------|--------|------|
| 试点 | 1 | 74 | `src/modules/assetPackageMedia.js`；纯改名闸门 PASS，模块测试 8/8，全量回归失败集合不变 |
| 批量 1 | 8 | 233 | 纯改名闸门 8/8 PASS；模块测试合计 78/78；全量回归失败集合不变 |
| 批量 2 | 8 | 234 | 纯改名闸门 8/8 PASS；模块测试合计 93/93；全量回归失败集合不变 |
| 批量 3 | 5 | 79 | 纯改名闸门 5/5 PASS；模块测试合计 29/29；全量回归失败集合不变 |
| 批量 4 | 4 | 79 | 纯改名闸门 4/4 PASS；模块测试合计 22/22；全量回归失败集合不变 |
| 自动批 1 | 39 | 104 | 自动取名；闸门 39/39 PASS；带测试的 23 件全绿；全量回归失败集合不变 |
| 自动批 2 | 59 | 282 | 自动取名；闸门 58/59 PASS（1 件取名器缺陷被驱动拒写，修好后单独落地）；带测试的 37 件全绿；**审计查出 14 件同类遮蔽缺陷，全部重做**；全量回归失败集合不变 |
| 自动批 3 | 59 | 415 | 自动取名；闸门 59/59 PASS（含新增的遮蔽检查）；带测试的 38 件全绿；全量回归失败集合不变 |
| 自动批 4 | 79 | 771 | 自动取名；闸门 79/79 PASS；带测试的 54 件全绿；全量回归失败集合不变 |
| 自动批 5 | 80 | 932 | 自动取名；闸门 80/80 PASS；带测试的 59 件全绿；全量回归失败集合不变 |
| 自动批 6 | 200 | 3364 | 加大批量；闸门 200/200 PASS；带测试的 122 件全绿；全量回归失败集合不变 |

累计 **542 件 / 6567 个名字**；剩余 **1134 件**（`tools/deobf-scan.mjs` 实测）。

**批量大小的实测成本**：80 件约 4 分钟；200 件约 10 分钟（含 122 个模块测试）。
瓶颈是逐文件起 node（闸门 + 语法 + 测试各一次），不是取名本身。单批越大，出问题时的回溯面越大，
但闸门是按件验证的，所以 200 件这个量级仍然安全。清单文件末行无换行，
`while read` 会少处理最后一件 —— 生成后补一个换行即可。

### 3.0.1 闸门强化后的回溯审计（2026-10-04）

新增"数据位不许改名"与"改名目标不许遮蔽既有名"两条硬检查后，把**此前所有已改名文件逐一与
改名前原件对比复核**：120 件 PASS，4 件只差 token 数（prettier 给原本压缩成单行的文件补分号、
去掉多余括号。实证方式：对同一件**只做改名、不格式化**，闸门 PASS 且 token 流完全一致）。
查出的 **14 件遮蔽缺陷**全部从原件重做；其中 `src/components/aigenImage/uiSchemaFieldOverrides.js`
是唯一被测试直接抓到的一件（3 个用例全挂）。

**这批缺陷多数是潜伏的**：全量回归当时是通过的，测试发现不了。所以这类检查必须放进闸门，
不能指望测试覆盖。附带教训：`docs/TRACKING.md` 那套"失败名单与基线逐条一致"的锚点
**只能证明没有回归，证明不了改名本身正确**。

结论：124 件里 120 件逐字节可比对通过，另外 4 件属 prettier 格式副作用（已单独证明纯改名无误）。

批量 3（小文件优先，含一个原本压缩成单行的文件，格式化后由 1 行变 35 行）：

```
src/core/rendererViewportTransform.js                 16 个名字
api/runningHubWorkflowPollingPolicy.js                15
src/components/video-node/legacyVideoRatioPopup.js    16
src/components/aigenImage/uiSchemaParameterGroups.js  15
src/modules/interaction/previewCommitSession.js       17
```

（上表为全部批次；累计进度见 §3 表下。）

## 3.1 全仓规模与推进路线（2026-10-04 实测）

- 含 `_0x` 名的非测试 JS 文件：**1659 个**；去重后共 **125,310 个混淆名**。
- 规模分布：<100 行 **751** 个、100–300 行 **528** 个、300–700 行 **242** 个、≥700 行 **138** 个。
- 带同名测试的 **891** 个；其余 768 个没有测试。
- **导出名被混淆的文件：0 个** → 每个文件都能只改内部而不动消费方。

推进顺序建议：小文件优先（<100 行这一档 751 个文件，单个改名成本低）→ 中档 → 大文件单独成批。
没有测试的文件同样可以改：闸门本身就证明了"只是改名 + 导出面不变"，测试是额外保险而非唯一依据，
但改动后仍要跑全量回归确认失败集合不变。

## 3.2 并入移植工序（落件时顺手改名）

**为什么必须并进去**：反混淆镜像本身仍带 `_0x` 名（已抽查确认），而待移植欠账还有 230+ 件。
也就是说每移植一件就新增一件混淆文件 —— 只清存量会被增量追平。历史上那次全仓反混淆
（提交 `e12ecd1c`）只做了**解字符串表 + 美化**，其提交原文明确写了
"Function-local names stay `_0x…`: the originals are not present anywhere in the output and
there is no source map"，即标识符名从来没被处理过。

**落地某件时的附加步骤**（其余工序照旧）：

1. 镜像文件过 prettier 后先落在**暂存位置**，不要直接覆盖在用文件。
2. 在这个暂存件上用 `tools/deobf-rename.mjs` + 映射表改名（此时消费方还没接进来，最安全）。
3. 用 `tools/deobf-verify.mjs` 比对「改名前的暂存件」vs「改名后的暂存件」→ 必须 PASS。
   这一步一次证明两件事：与镜像一致（逐字节基线）+ 只改了名字。
4. 再按原工序落地，然后跑该件测试与全量回归。

好处：比"先落地、后清理"少一次返工；而且比较对象（镜像落地件）天然存在，不需要额外留参照副本。

## 3.3 自动取名器（可选，用于提高吞吐）

手工取名质量最好但吞吐有限（每批 4–8 件，1600+ 件走不完）。`tools/deobf-auto.mjs` 按**用法证据**
推导名字，输出映射 JSON 供人工过目，再交给 `tools/deobf-rename.mjs` 应用：

```bash
node tools/deobf-auto.mjs <file.js> --explain > map.json   # 看取名依据
node tools/deobf-rename.mjs <file.js> map.json             # 应用
node tools/deobf-verify.mjs <原件> <file.js>               # 必须 PASS
```

取名优先级：解构键 → 被访问的属性集合（`el`/`store`/`list`/`ctx`…）→ 被调用 → rest 参数 →
由工厂函数推导（`normalizeLocalPath` → `localPath`）→ 布尔用法 → 数值比较 → 通用回退名。
映射保证单射（不会把两个名字并成同一个），避免引入重复声明。

**实测质量**（`src/modules/generationHistoryVideoThumbnails.js`，49 个名字）：
11 个来自解构键、4 个 rest、5 个来自属性集合、3 个来自工厂推导、2 个布尔、2 个数值比较、
1 个持有 nodes/edges、1 个被调用，其余 **15 个**落到通用回退名。即约**七成有明确依据**，
三成是通用名（`value`/`item`/`key`/`index` 等），可读性远好于 `_0x1f37aa`，但不如手工命名贴合语义。

**已知坑**（前两个已修）：

1. 工厂推导曾在 `const _0x3ad879 = _0x2eb0ff();` 上把变量命名成另一个混淆名（`_0x2eb0ff`）。
   已修：推导结果的 stem 若仍是 `_0x…` 则跳过该规则；`tools/deobf-rename.mjs` 也新增硬校验，
   **拒绝把标识符映射成另一个混淆名**。
2. 三元表达式被误判成解构键：`cond ? _0x1 : _0x2` 里的 `_0x1 :` 命中"`名: 名`"规则，
   于是 `_0x1 -> _0x1`（同一个名字），改名等于没改，还被驱动拒写。已修：只认前面是 `{` 或 `,`
   的键。
3. **改名目标与文件里既有标识符重名**（遮蔽）。这是最危险的一类：闸门当时只检查"映射是否一致"，
   拦不住它，于是 `uiSchemaFieldOverrides.js` 把 `_0x586272` 命名成了文件里已存在的函数名
   `isPlainObject`，产出 `const isPlainObject = isPlainObject(item) ? ...`，测试立刻失败。
   已修：取名器**用文件里已有的绑定名预填名字池**，生成的名字永远不会撞上既有名；
   闸门也新增同名硬校验。**顺带审计了此前所有已改名文件（126 件），查出 14 件同类问题并全部重做。**
4. 批量脚本不要用 Node 的 `spawnSync` 反复启动同一个 node.exe（Windows 会返回 `EBUSY`），
   用 bash 循环调用即可。

批量 1 的 8 件（均为零消费方叶子模块）：

```
src/modules/settings/nodeManagerSettings.js                       25 个名字
src/modules/taskStatusFeedback.js                                 29
src/modules/generationPromptPolicy.js                             24
src/services/startupVisualReadiness.js                            24
src/modules/canvasCommands/nodeExportCommands.js                  24
src/modules/agent/agentPrecreatedNode.js                          23
src/components/video-node/sourceVideoFramePresentationBatch.js    33
src/modules/promptMentionSelection.js                             51
```

批量 2 的 8 件：

```
src/modules/interaction/dropTargetSpatialQuery.js                 18
src/modules/panoramaSceneNode/characterBodyProfile.js             18
src/core/stores/rendererStateRevisions.js                         22
src/modules/agent/agentConversationCanvasTransferRuntime.js       28
src/modules/taskCenterListView.js                                 32
api/adapters/textResponsesRequest.js                              32
src/modules/app/workspaceCacheIdleScheduler.js                    36
src/modules/agent/agentComposerAttachmentController.js            48
```

（批量文件清单到此为止；后续批次以 `tools/deobf-scan.mjs` 的实测候选池为准。）

## 4. 与移植工序的关系（重要）

现有移植把关是"镜像文件过 prettier 后与仓库**逐字节 cmp**"。改名后这些文件对不上，
所以要分层：

- **尚未改名**的文件：逐字节 cmp 保持不变。
- **已改名**的文件：把 cmp 换成 **token 级等价比对**，原件直接取
  `git show <改名提交>^:<路径>`，天然复用 `tools/deobf-verify.mjs`，不必额外存参照副本。

判定规则改为：对某件，先看它是否被改名批次覆盖过；覆盖过就走 token 级比对，没覆盖过就走
逐字节 cmp。

## 5. 规模与收益（试点时实测）

- 含 `_0x` 名的非测试 JS 文件：**1677 / 1982（84%）**；src 1445/1620、api 194/210、electron 38/152。
- 本仓库**没有任何构建期混淆环节**（package.json 的 scripts 里没有 obfuscator/terser/uglify，
  `build:win` 只是 electron-builder 打包），所以源码里的混淆名**不提供任何保护**，只是逆向残留。
- 可用于批量推进的零消费方候选：97 件（体积 ≥1.2 KB、有同名测试）。
