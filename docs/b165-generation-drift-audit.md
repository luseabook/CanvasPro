# 第 165 批：代际漂移审计（暂存树溯源 + 全仓距离复算 + 第四层混淆）

> 本批**未改动仓库任何源码**（唯一新增是 `tools/mirror-drift-sweep.mjs`）。全部是只读侦察与口径复算。
> 起因：第 163 批「受保护件 `aigenText/uiModule.js` 单独成批升代」在落地前做版本溯源，
> 结果发现**该件的暂存件并非取自标尺 0.8.0**，由此顺藤查出整条 b157 暂存树、以及全仓欠账口径的问题。

## 1. 结论先行

1. **b157 暂存树（`deobf-tools/b157/port/`）全部取自 0.7.16 镜像，不是标尺 0.8.0。**
   因此第 162/163 批从它落地的 11 件**是 0.7.16 代内容**，其中 7 件在 0.8.0 已有实质变化。
2. **第 161–164 批是在 b158 §6 明确冻结的口径上推进的。** b158 写「未决定前，不再按 0.7.16 口径推进任何批次」，
   而 b158 §6 的 A/B/C 三选一**至今没有留下裁决记录**（TRACKING 顶部的「维持 0.4.12 基线」与 §6 文本不自洽，且 162–164 三批它都没更新）。
3. **仓库对两代的距离首次被量出来**：对 0.7.16 **1149 件内容不符**（非 0），对 0.8.0 **1261 件不符 + 184 件缺失**。
   b158 §4.2 的「仓库在文件层面已对 0.7.16 满格、剩余欠账是接线」**只在「文件是否缺失」这一层成立**，内容层欠账被 200 孤立口径掩盖。
4. **存在第四层混淆从未处理**：`!![]`／`![]`（即 `true`／`false`）共 **17,253 处、1,044 件**。
   前三层（`_0x` 名、`\x` 转义、十六进制）已收官，这一层一直没进工序。
5. 换标尺的**真实增量成本**：0.8.0 相对 0.7.16 改 **429 件**、新增 **184 件**；
   已完成的 606 件里有 **113 件被 0.8.0 作废**，需重做。

## 2. 证据一：b157 暂存树的镜像来源（决定性）

方法：`tools/deobf-verify.mjs` 是「只允许改标识符名」的词法闸门，对改名不敏感。
暂存件 = 「镜像件 → prettier → 改名」的产物，所以拿**两侧都 prettier、都不去转义**的镜像件去比暂存件，
PASS 就等价于「这份暂存件就是从该镜像来的」。

```bash
node tools/deobf-verify.mjs <mirror>.716.raw.js <staging>.js   # PASS => 源自 0.7.16
node tools/deobf-verify.mjs <mirror>.080.raw.js <staging>.js   # PASS => 源自 0.8.0
```

12 件全部 `vs0.7.16 = PASS`；8 件 `vs0.8.0 = fail`，另 4 件两代完全相同故两侧都 PASS：

| 件 | vs0.7.16 | vs0.8.0 | 判定 |
| --- | --- | --- | --- |
| `src/components/AIGenAudioNode.js` | PASS | fail | **源自 0.7.16** |
| `src/components/AIGenVideoNode.js` | PASS | fail | **源自 0.7.16** |
| `src/components/SourceVideoNode.js` | PASS | PASS | 两代同（无差别） |
| `src/components/aigenImage/stateSyncModule.js` | PASS | fail | **源自 0.7.16** |
| `src/components/aigenText/stateSyncModule.js` | PASS | fail | **源自 0.7.16** |
| `src/components/video-node/parameterPanelModule.js` | PASS | fail | **源自 0.7.16** |
| `src/components/video-node/taskOrchestrationModule.js` | PASS | fail | **源自 0.7.16** |
| `src/modules/VideoKeyingController.js` | PASS | PASS | 两代同（无差别） |
| `src/modules/app/projectLifecycle.js` | PASS | fail | **源自 0.7.16** |
| `src/modules/promptPresets.js` | PASS | PASS | 两代同（无差别） |
| `api/adapters/modelApiResolvers/index.js` | PASS | PASS | 两代同（无差别） |
| `src/components/aigenText/uiModule.js` | PASS | fail | **源自 0.7.16** |

**独立佐证（时间戳）**：`b157/port/` 内所有文件 mtime 为 `2026-10-05 02:02–02:03`；
0.8.0 镜像 `shuo-deobf-080` 的 mtime 是 `2026-10-05 02:56`。**暂存树比标尺镜像早 54 分钟生成**，
在 0.8.0 镜像存在之前，它不可能取自 0.8.0。

## 3. 证据二：仓库对两代的真实距离（token 多重集口径）

新工具 `tools/mirror-drift-sweep.mjs`：把两侧源码都过同一份 prettier，再取**词法 token 多重集**做 FNV 哈希。
该口径对移植工序的四类改写**全部免疫**——标识符名（全部并成一桶）、字面量转义（按解码值比）、
十/十六进制（按数值比）、`x['y']` vs `x.y`（token 相同）；多重集又对**顺序不敏感**，
所以 import 重排既不能掩盖也不能伪造差异。**基线校验**：12 件已知落地件里，
`aigenText/stateSyncModule.js` 判「与 0.7.16 相同」、`modelApiResolvers/index.js` 判「与两代都相同」，
与第 2 节的闸门结论一致；`projectLifecycle.js`/`desktopBridge.js` 因人工回移防线而对两代都不符。

```bash
node tools/mirror-drift-sweep.mjs --prettier=<prettier/index.cjs> \
    /c/Users/luobote/.qoder/tmp/shuo-deobf-080 F:/CanvasPro <out>.json   # 仓库 vs 0.8.0
node tools/mirror-drift-sweep.mjs --prettier=<prettier/index.cjs> \
    /c/Users/luobote/.qoder/tmp/shuo-deobf     F:/CanvasPro <out>.json   # 仓库 vs 0.7.16
node tools/mirror-drift-sweep.mjs --prettier=<prettier/index.cjs> \
    /c/Users/luobote/.qoder/tmp/shuo-deobf-080 /c/Users/luobote/.qoder/tmp/shuo-deobf <out>.json  # 两代互比
```

| 比较 | 扫描件 | 相同 | 不符 | 其中 \|Δ\|≤2（近似残渣） | 其中 \|Δ\|>2（真实内容） | 目标侧缺失 |
| --- | --- | --- | --- | --- | --- | --- |
| 仓库 vs **0.8.0** | 1938 | 493 | **1261** | 352 | **909** | **184** |
| 仓库 vs **0.7.16** | 1755 | 606 | **1149** | 456 | **693** | 0 |
| **0.8.0 vs 0.7.16** | 1938 | 1325 | **429** | — | — | **184** |

最后一行是独立复算 b158 §3 的结论：b158 用字节差口径得「455 件变化 + 184 新增」，
本批用 token 口径得「429 件变化 + 184 新增」。**两法互证，184 件新增完全一致**。

### 3.1 换标尺的增量成本

- **0.8.0 相对 0.7.16**：改 429 件 + 新增 184 件 = **613 件新工作量**。
- **已完成的 606 件里，113 件被 0.8.0 作废**（对 0.7.16 相符但对 0.8.0 不符）→ 需重做。
- **到 0.8.0 的剩余总量**：**1261 件改 + 184 件新 = 1445 件**，其中 909 件是真实内容改动。
- 对比：**到 0.7.16 的剩余量是 1149 件（693 件真实）**。

也就是说：**仓库离 0.7.16 还有 1149 件的距离，离 0.8.0 有 1445 件。**
「换标尺」只多出 296 件左右，真正的大头是那 1149 件的既有欠账——它一直被「孤立 200」的口径挡在视线外。

## 4. 证据三：0.7.16 → 0.8.0 在受影响件上的实际变化

用 `cmp2.mjs`（同款 token 多重集）逐件量化，可见 8 件里有 7 件是真功能差：

| 件 | token Δ | 实质变化 |
| --- | --- | --- |
| `video-node/parameterPanelModule.js` | **−1228** | 弃用 `generationTaskUiState`/`previewGenerateButtonUi`/`generationPromptPolicy`/`segmentRetakeSession`，改用 `submitButtonState`、`videoSubmitFailure`、`shared/nodeModelMenuFeedback`；底栏 schema 弹层改 portal |
| `video-node/taskOrchestrationModule.js` | **−419** | 移除 Dreamina 任务中心事件上报；改用 `videoSubmitPreparationUi`、`generationSubmitHint`、`videoSubmitFailure` |
| `aigenText/stateSyncModule.js` | **+117** | 新增 `./textGenerationDraftPresentation.js`、`./textAudioSubmitPolicy.js`，接入 `_maybeResumeTextTask`、`textGenerationDraft` |
| `AIGenVideoNode.js` | **+100** | 新增 uiSchema 字段 `modelApiConnectedVideoCount`/`modelApiConnectedAudioCount`/`disableWhen`，接入 `_videoSubmitPreparing` |
| `aigenText/uiModule.js` | −54 | 新增 `./textGenerationDraftPresentation.js`、`./modelRegistryRefresh.js`；移除 `apimart/kimi-k2-instruct`；**新增输入法合成态处理（`isComposing`/`keyCode 229`）** |
| `app/projectLifecycle.js` | −45 | 新增 `./headerProjectNameEditor.js`；移除 keydown/Enter/blur 处置 |
| `aigenImage/stateSyncModule.js` | −35 | 参考区上传槽 HTML 模板改写 |
| `AIGenAudioNode.js` | −35 | 一处 title 属性字面量消失，余为计数位移 |

### 4.1 单件落地会拖出闭包

`aigenText/uiModule.js` 的 0.8.0 版依赖 **两个仓库里根本不存在的新模块**
（`src/components/aigenText/textGenerationDraftPresentation.js` 975 B、`modelRegistryRefresh.js` 1963 B，两版镜像互比确认它们**只存在于 0.8.0**），
并引用两个仓库 locale 里没有的键（`aigenText.result.streamingDraft` / `interruptedDraft`；
0.8.0 的 `zh-CN.js`/`en-US.js` 各比仓库多约 **+10,700 / +10,163** token）。
**所以「单独成批升代一个受保护件」在当前口径下不成立**——它必然带出 ≥2 个新模块与一次 i18n 增量。

## 5. 证据四：第四层混淆（布尔常量）

`_0x` 名、`\x` 转义、十六进制三层的收官结论没有任何问题；但源码里还有一层一直没进工序：

- `!![]`（=`true`）**8,849 处**、`![]`（=`false`）**8,404 处**，合计 **17,253 处**。
- 落在 **1,044 件**里（`src`/`api`/`electron` 共 3,117 件 JS）。
- 分布：**1,020 件是渲染侧且在 0.8.0 镜像里有对应件**（16,790 处）；**24 件是 `electron/` 主进程**（463 处，镜像本来就不含 `electron/`）——最大的是 `electron/chromeShellWebPreviewManager.js`（95 处）。
- 这层不是移植带进来的：仓库**首个提交**（`9eaab7cb`，V0.2.13）就有 **4,337 处 / 297 件**，现已涨到 17,253 处。
- 受保护件不统一：`aigenText/uiModule.js`、`src/manifests/index.js` 为 0，而 `api/configApi.js` 仍有 **14 处**。

**为什么必须单独成批、不能顺手改**：`![]` 后面若紧跟成员访问，`![].length` 实为 `!([].length) === true`；
按文本盲替成 `false.length` 会改语义。所以和前三层一样，需要「按 token 上下文识别 + 独立校验器」，
不能在这个落地批里夹带。**建议列为第 166 批**。

## 6. 对已交付工作的影响

| 已交付物 | 影响 |
| --- | --- |
| b162/b163 落地的 11 件 | 7 件是 0.7.16 代内容，需按 0.8.0 重取；4 件两代同、不受影响 |
| b163 的「T 19 已改 / A 33 登记」裁决 | **判据仍成立**（T/A 比的是「产生该行为的文件是否为目标版本」），但「目标版本」应指 **0.8.0**；按 0.7.16 判出的 A 组会**低估**差异 |
| b164 回移的 fail-closed 恢复防线 | **不受影响，必须保留**。它按 0.4.12 语义回移，两代镜像都没有；若后续重取 `projectLifecycle.js`，须在新基线上**重新叠加**该防线 |
| 去混淆三批（158b/159/160） | 不受影响（与代际无关），但**未覆盖布尔层** |
| 受保护件 `aigenText/uiModule.js` 的「授权」 | **暂缓执行**：授权本身有效，但取 0.7.16 内容会落错代；按 0.8.0 取又必须带出闭包，宜先定标尺 |

## 7. 建议

**建议按 b158 §6 的 A 案收口：全面切到 0.8.0。** 理由：

1. **增量小**：换标尺只多 296 件（113 件重做 + 184 件新增），而既有欠账 1149 件本来就欠着，怎么算都要做。
2. **两阶段反而更贵**：先补到 0.7.16 再补到 0.8.0，会把这 113 件做两遍。
3. **来源唯一**：工序第 ① 步是「镜像件与仓库逐字节比对落地」，标尺只能有一个；两个镜像并存正是本批暴露的问题根源。
4. **符合用户目标**：目标是「功能上追平**已安装**的 SHUO Canvas」，已安装版就是 0.8.0。

配套动作（切标尺后）：把 `b157/port` 等**所有 0.7.16 暂存目录标注为作废**，
`deobf-tools` 下各批暂存一律以 0.8.0 镜像重取，并在工序里加一句「暂存件落地前必须先用 `deobf-verify` 反查镜像来源」。

## 8. 待裁决

1. **标尺**：A 全面切 0.8.0 / B 只补 184 新件 / C 暂不切（维持现状）。**建议 A。**
2. **是否启动第 166 批**处理 `!![]`/`![]` 布尔层（17,253 处）。**建议排期但单独成批。**
3. **b163 那 7 件**：切 0.8.0 则重取；不切则维持并记录在案。
4. **受保护件 `aigenText/uiModule.js`**：按裁决 1 的结果决定取哪一代；若取 0.8.0，需同时授权其 2 个新依赖与 i18n 增量。
