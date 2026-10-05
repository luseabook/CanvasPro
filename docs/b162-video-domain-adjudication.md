# 视频节点域消费方升代裁决清单（第 162 批）

> 本批**不改任何代码**。目的是把「整代升代＋同步改测试」这条已裁决路径的第一步做完：
> 把 b157 回滚的 **12 件**整体落地一次，用**全量回归**（而非 14 个同名测试）采集失败，
> 逐条给出「期望值 / 实际值 / 位置 / 初判」，交用户逐条确认或推翻。
>
> 采集完成后 12 件**已全部回滚**，工作区干净（HEAD `45078f26`）。

## 1. 范围与口径

| 项 | 值 |
| --- | --- |
| 采集对象 | b157 回滚的 12 件消费方升代件（同一批暂存件 `deobf-tools/b157/port/`） |
| 采集方式 | 12 件整体落地 → `node tools/run-full-tests.mjs --js-only`（全部 1,077 个 JS 测试文件） |
| 基线 | `run-Znrjcn`：**11193 / 11190 / 3**（3 例全为 `electron/installerSafety.test.js`，环境性既有失败） |
| 落地后 | `run-sCxseM`：**11147 / 11076 / 71** |
| 净增 | **68 例**（71 − 3 基线）= 67 用例级 + 1 文件级 |
| tests 少 46 | `parameterPanelModule.officialLabel.test.js` **整文件加载失败**，其内部 46 个用例不再计入 |

12 件（改动规模）：

| 件 | 增/删行 | 备注 |
| --- | --- | --- |
| `api/adapters/modelApiResolvers/index.js` | +5 / −3122 | 清空为 re-export 壳，逻辑搬到同目录 resolver 文件 |
| `src/components/AIGenAudioNode.js` | +2698 / −2081 | |
| `src/components/AIGenVideoNode.js` | +1041 / −930 | |
| `src/components/SourceVideoNode.js` | +2764 / −1813 | |
| `src/components/aigenImage/stateSyncModule.js` | +461 / −436 | |
| `src/components/aigenText/stateSyncModule.js` | +256 / −223 | |
| `src/components/aigenText/uiModule.js` | +438 / −376 | **§2.3 受保护装配件** |
| `src/components/video-node/parameterPanelModule.js` | +1692 / −2019 | |
| `src/components/video-node/taskOrchestrationModule.js` | +2161 / −2983 | |
| `src/modules/VideoKeyingController.js` | +1578 / −2019 | |
| `src/modules/app/projectLifecycle.js` | +2281 / −1233 | |
| `src/modules/promptPresets.js` | +1030 / −738 | |

> **注意**：12 件中含 1 件**受保护装配件**（`src/components/aigenText/uiModule.js`）。
> 真正升代时必须单独成批 + 用户授权 + 真机验证（`docs/TRACKING.md` §2.3）。
> 本批只做实验性落地，跑完即回滚。

## 2. 依赖面体检：先排除「缺件型」失败

在归因之前先证明失败**不是**「升代件找不到依赖」造成的：

| 检查 | 结果 |
| --- | --- |
| 12 件新增的 import 目标**文件**是否都在仓库 | **148 个新增导入，缺失 0** |
| 12 件新增的具名导入，目标模块**是否导出该名字** | **缺失 0** |
| 12 件自身**删掉**的导出，是否仍被 0.4.12 消费方 import | **3 个被删导出仍有使用者**（见 §4.1） |

结论：**「模块或具名导出不存在」这一最常见的装配失配形态被排除**。剩下的装配问题
只可能出在**运行期契约**（同名工厂返回的对象缺方法、注册表缺条目、协作模块行为不同代）。

## 3. 实测失败矩阵（按测试文件聚合）

| 测试文件 | 例数 | 基线? |
| --- | --- | --- |
| `src/components/AIGenAudioNode.test.js` | 12 | |
| `src/components/SourceVideoNode.test.js` | 12 | |
| `src/components/video-node/taskOrchestrationModule.test.js` | 12 | |
| `src/modules/app/projectLifecycleRecovery.test.js` | 6 | |
| `src/components/aigenText/uiModule.test.js` | 5 | |
| `src/components/video-node/referenceInputModule.test.js` | 5 | |
| `src/modules/promptPresets.test.js` | 5 | |
| `api/aiVideoApi.test.js` | 4 | |
| `api/aiImageApi.routing.test.js` | 2 | |
| `src/components/aigenImage/stateSyncModule.test.js` | 2 | |
| `api/adapters/modelApiMappingEngine.test.js` | 1 | |
| `src/components/AIGenVideoNode.test.js` | 1 | |
| `src/components/video-node/parameterPanelModule.officialLabel.test.js` | 1（文件级） | |
| `electron/installerSafety.test.js` | 3 | **基线** |

合计 71（含基线 3）。

## 4. 逐条清单与初判

下表编号 1–71 与 `deobf-tools/b162/fails-report.txt` 的序号一致（8/9/10 为基线三项，
见 §3，不再单列）。

初判码：

- **T** 规格变更 —— 实现按 0.7.16 新规格取值，测试仍断言 0.4.12 旧值。**改测试即可**。
- **A** 装配失配 —— 升代件依赖**同代其他件**的运行期契约，孤立升代时不存在。**必须成组升代**。
- **S** 源码形状断言 —— 测试用正则读**源码文本**，升代后写法变了。改测试为行为断言或更新正则。
- **R** 接口断裂 —— 测试 import 了被删的导出名，文件整体加载失败。

### 4.1 接口断裂（1 例，文件级）

| # | 位置 | 现象 | 初判 |
| --- | --- | --- | --- |
| 43 | `video-node/parameterPanelModule.officialLabel.test.js:1` | 整个文件加载失败（tests 少 46） | **R** |

`parameterPanelModule.js` 升代后删掉 3 个导出，而该测试仍静态 import：

| 被删导出 | b157 记录的搬去地 | 该导出在仓库仍有其他消费者？ |
| --- | --- | --- |
| `resolveVideoPromptPlaceholder` | `video-node/parameterPanelPresentationPolicy.js` | 只有该测试文件 |
| `shouldShowVideoPromptInput` | `video-node/parameterPanelPresentationPolicy.js` | 只有该测试文件 |
| `buildVideoModelApiModelSelectionPatch` | `video-node/parameterPanelModelSelectionPolicy.js` | 只有该测试文件 |

→ 处理方式：把测试的 import 源改到新模块（若新模块确实导出同名）或把断言改成行为断言。
**不是功能回归**，是依赖搬家。

### 4.2 装配失配（17 例，初判 A）

| # | 位置 | 现象 | 根因 |
| --- | --- | --- | --- |
| 6 | `api/aiVideoApi.test.js:1496` | `Unsupported model API bodyResolver: runninghubHailuo02Video` | `registry.js` 仍是 0.4.12，未注册该 resolver |
| 7 | `api/aiVideoApi.test.js:2554` | 同上 | 同上 |
| 23 | `AIGenVideoNode.test.js:178` | `this._mustRenderTerminalVideoState is not a function` | `video-node/resultRenderModule.js` 仍是 0.4.12：工厂 `createVideoNodeResultRenderModule` **存在**，但返回的模块**没有**该方法 |
| 24–27 | `SourceVideoNode.test.js:331,386,425,453` | `Cannot read properties of undefined (reading 'clear')` | 抠像取消链路依赖同代协作件（`VideoKeyingController` 已升代、其协作者未升代） |
| 67–71 | `promptPresets.test.js:254,285,305,329,346` | `undefined is not iterable` | `openQuickCapturePromptPresetDraft` 依赖 `presetCoverResolver.js` / `promptPresetTrigger.js` / `nodePromptExpansion.js` 的同代行为 |
| 12–16 | `AIGenAudioNode.test.js:224,241,253,265,277` | 文本引用未被替换：`'旁白 @文本1 开场'`（期望 `'旁白 来自音频文本节点的提示词 开场'`） | 引用替换逻辑依赖 `nodePromptShared.js` / `textResultSources.js` 同代版本 |

最后两行置信度低于前四行（未逐件复现），标注为**待核**。

### 4.3 规格变更（45 例，初判 T）

**比例解析（最典型的一类，7 例）**

| # | 位置 | 期望 | 实际 |
| --- | --- | --- | --- |
| 49 | `taskOrchestrationModule.test.js:845` | `自适应` | `9:16` |
| 50 | `:874` | `自适应` | `16:9` |
| 51 | `:916` | `自适应` | `16:9` |
| 52 | `:934` | `自适应` | `1:1` |
| 58 | `:2106` | `16:9` | `1:1` |
| 59 | `:2127` | `16:9` | `1:1` |
| 60 | `:3149` | `16:9` | `1:1` |

0.7.16 把「自适应」在请求体里**解析成具体比例**（`videoNodeAdaptiveAspectRatio.js`），
0.4.12 是原样透传 `自适应`。这是明确的产品行为升级，**改测试**。

**校验/过滤策略：从「抛错」变「过滤后照常提交」（8 例）**

| # | 位置 | 现象 |
| --- | --- | --- |
| 5 | `aiVideoApi.test.js:538` | 抛 `'Gemini Omni 1.1 Flash Ext frame mode supports at most 1 image'` |
| 21–22 | `AIGenAudioNode.test.js:540,570` | 期望 reject，实际 resolve 出完整 request 对象 |
| 53–55 | `taskOrchestrationModule.test.js:952,1091,1148` | 期望 reject，实际 resolve 出 request |
| 56 | `:1686` | HappyHorse 应过滤 `ref-1.png`，实际保留（`['ref-1','ref-2']`） |
| 57 | `:1723` | 期望 reject，实际 resolve 出 request |

0.7.16 把「非法输入」从抛错改为**规范化后照常提交**（多余媒体被裁掉而非报错），
另有部分新增了校验消息。需逐条确认是产品意图还是缺陷。

**取值变更（30 例）**

| # | 位置 | 期望 | 实际 |
| --- | --- | --- | --- |
| 1 | `modelApiMappingEngine.test.js:75` | `2K` | `4K` |
| 2 | `aiImageApi.routing.test.js:431` | `2K` | `4K` |
| 3 | `aiImageApi.routing.test.js:465` | `2K` | `4K` |
| 4 | `aiVideoApi.test.js:241` | `42` | `undefined` |
| 17 | `AIGenAudioNode.test.js:347` | `true` | `false` |
| 18 | `:379` | 匹配 `/提示词\|prompt/i` | `'请接入参考音色'` |
| 19 | `:464` | 两个音频槽 | `[]` |
| 20 | `:504` | audio1/audio2 归槽 | `[]` |
| 28 | `SourceVideoNode.test.js:626` | `1` | `0` |
| 29 | `:665` | `0` | `''` |
| 30 | `:717` | `0` | `''` |
| 31 | `:759` | `1` | `0` |
| 32 | `:924` | `0` | `''` |
| 33 | `:949` | `0` | `''` |
| 34 | `:1030` | `auto` | `none` |
| 35 | `:1471` | `null` | `123` |
| 36 | `aigenImage/stateSyncModule.test.js:313` | `1` | `0` |
| 37 | `:381` | `1` | `0` |
| 42 | `aigenText/uiModule.test.js:335` | `0` | `1` |
| 44 | `referenceInputModule.test.js:949` | `false` | `true` |
| 45 | `:2447` | `false` | `true` |
| 46 | `:2485` | `''` | `undefined` |
| 47 | `:2523` | `var(--unavailable-cursor)` | `undefined` |
| 48 | `:2560` | `var(--unavailable-cursor)` | `undefined` |
| 61 | `projectLifecycleRecovery.test.js:23` | 返回 cache 对象 | `null` |
| 63 | `:62` | `0` | `1` |
| 64 | `:110` | `0` | `2` |
| 65 | `:135` | `RECOVERY_SNAPSHOT_PROTECTED` | `undefined` |
| 66 | `:155` | `RECOVERY_SNAPSHOT_PROTECTED` | `undefined` |
| 62 | `:36` | 期望 rejection | `Missing expected rejection` |

（`SourceVideoNode` 的 `''`/`'0'` 系列是 DOM 属性是否被清除的断言，同一类。）

### 4.4 源码形状断言（5 例，初判 S）

这 5 例是测试**读取源码文本做正则匹配**，升代后代码写法变了：

| # | 位置 | 正则找的东西 |
| --- | --- | --- |
| 11 | `AIGenAudioNode.test.js:213` | `from '../modules/nodePromptShared.js';` 与 `this.promptEl.addEventListener('input', …_checkAtTrigger(this, …)` 的**相邻顺序** |
| 38 | `aigenText/uiModule.test.js:48` | `buildTextProviderMenuGroupsHTML(x)` |
| 39 | `:135` | `this._data.model \|\| 'apimart/kimi-k2-instruct'` |
| 40 | `:171` | `bindReadonlyTextSelection(this.outputEl, {` |
| 41 | `:212` | `this._markOutputScrollTopDirty()` |

→ 需逐个确认新实现里存在**等价物**；若存在，把断言改成行为断言。这是最需要人工判断的一类。

### 4.5 汇总

| 初判 | 例数 | 占净增 |
| --- | --- | --- |
| T 规格变更 | 45（比例 7 + 校验/过滤 8 + 取值 30） | 66% |
| A 装配失配 | 17（高置信 12 + 待核 5） | 25% |
| S 源码形状断言 | 5 | 7% |
| R 接口断裂 | 1（文件级，吞掉 46 个用例） | 1.5% |
| 基线（剔除） | 3 | — |
| **净增合计** | **68** | 100% |

## 5. 装配失配的闭包（必须同批升代的件）

由 §4.2 反推出的同代依赖：

| 升代件 | 必须一起升代的同代件 | 该件当前状态 |
| --- | --- | --- |
| `AIGenVideoNode.js` | `video-node/resultRenderModule.js` | 在用文件（b161 实验二候选，升代自身有 5 例失败） |
| `taskOrchestrationModule.js` → resolver | `api/adapters/modelApiResolvers/registry.js` + 各 `*Resolvers.js` | registry 仍是 0.4.12 |
| `AIGenAudioNode.js` | `modules/nodePromptShared.js`、`textResultSources.js` | nodePromptShared 是 b161 候选（升代有 1 例失败） |
| `SourceVideoNode.js` → 抠像取消 | `modules/VideoKeyingController.js`（已在本批）+ 其协作者 | 待核 |
| `promptPresets.js` | `presetCoverResolver.js`、`promptPresetTrigger.js`、`nodePromptExpansion.js` | 待核 |
| `api/adapters/modelApiResolvers/index.js` | `registry.js`、`imageResolvers.js` | registry 未升代 |

**结论**：装配失配的解法天然是「闭包成组升代」，与 b156 的 manifests 聚合层结论同构。

## 6. 建议

按「先易后难」分三步，每步独立可验收：

1. **T + R + S（51 例）**：规格/形状类，只需要改测试或被删导出的 import 源。
   风险最低，且**不依赖任何其他件升代**。建议先做，把 12 件从 68 例压到 17 例。
2. **A 的闭包（17 例）**：把 §5 的组一次性升代。逐组做、逐组全量回归。
3. **受保护件**：`aigenText/uiModule.js` 单独成批 + 授权 + 真机验证。

## 7. 复现

```bash
bash C:/Users/luobote/.qoder/tmp/deobf-tools/b162/land12.sh     # 落地 12 件
node tools/run-full-tests.mjs --js-only                          # 全量回归
node C:/Users/luobote/.qoder/tmp/deobf-tools/b162/parse-tap.mjs \
     test-artifacts/full-review/run-XXXXXX b162/landed-fails.json  # 解析失败
bash C:/Users/luobote/.qoder/tmp/deobf-tools/b162/revert12.sh   # 回滚
```

辅助脚本（均不入库）：`parse-tap.mjs`（TAP→结构化失败）、`imports-diff.mjs`（导入面差异）、
`check-deps.mjs`（新增依赖文件存在性）、`check-named-exports.mjs`（具名导出可用性）、
`exports-face.mjs`（导出面差异与断裂风险）、`format-fails.mjs`（精简报告）。

原始数据：基线 `test-artifacts/full-review/run-Znrjcn/`，落地 `run-sCxseM/`；
结构化失败 JSON 与 `fails-report.txt` 在 `deobf-tools/b162/`。
