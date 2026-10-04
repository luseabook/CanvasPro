# 反混淆工序（de-obfuscation batches）

> 目标：把源码里的逆向残留名（`_0x17f006` 这类）改成可读名，**只做改名**，并用机器证明
> 等价性。范围不限于某一批，每批都是可独立验证的检查点。

## 0. 为什么不顺手做

- 改的是**在用文件**，与"只新增"的移植批次不是一类改动，必须单独成批。
- 现有回归锚点是"src 失败名单逐条一致"，只有在改名是**独立一次干净改动**时才可比对。
- 会**打断移植工序**（见 §4），必须先想好替代把关方式。

## 1. 每个批次的工序

1. **选件**。优先叶子模块：零消费方 + 有同名 `*.test.js` + 体积可控。

   ```bash
   # 列候选（零消费方、含 _0x 名、有同名测试），按混淆名数量排序
   node tools/deobf-scan.mjs
   ```

   零消费方判定：文件基名不出现在任何其它源码文件里。**命中后仍要人工复核一次**，
   防止经由 barrel/manifest 间接引用。

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

5. **通读 REVIEW 列表**。校验器会把"改名目标与文件中既有标识符同名"的条目列出来。
   正常情况几乎全是解构/对象字面量的属性名（`itemKey: itemKey`、`width: width`），安全；
   但若出现与**同作用域局部变量/参数**同名，那是真实遮蔽，必须换名。

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

`tools/deobf-verify.mjs` 是**词法级**闸门，不依赖解析器（本仓没有可用的 JS parser）：

- token 种类序列必须完全一致；
- 字符串/正则字面量按原文比较，数字**按值**比较（因此 `0x200` → `512` 这类规范化是允许的）；
- 标识符必须构成一致映射（同名必映射到同一新名），改名数量与位置一一对应；
- 多行列表的**尾逗号**做归一化（prettier 只在多行时输出尾逗号，属格式差异）。
  注意 `[,]` 这类空位数组的逗号不会被误删。

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

累计 17 件 / 541 个名字。零消费方候选池还剩 60 件（`tools/deobf-scan.mjs` 实测）。

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
