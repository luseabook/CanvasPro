# 去掉源代码里最后一类混淆残留（转义与十六进制整数）

> 第 **158b + 159 + 160** 批。改名（`tools/deobf-rename.mjs`）之后，源码里还留着两类**不是标识符**、
> 因此没被改名工序覆盖的混淆痕迹：字符串转义与十六进制整数。本篇记录清理办法、等价性证明与结果。
> 流水账见 `docs/TRACKING.md` §11。

**一句话结论**：转义层已清零（只剩按规则必须保留的控制字符）；十六进制层**全部清完**——
非受保护件 3,115 件全清，6 个受保护件也在 160 批经用户授权清掉（406 处）。全仓代码位十六进制
只剩 **619 处刻意常量**（FNV 基、位掩码、文件魔数、零填充等）。

## 1. 残留清单

审计方式：与仓库里的**内容风格**对照（不是与文件名对照，见 §4 的教训），再全仓扫描。

| 类 | 形态 | 是否混淆残留 | 处理 |
| --- | --- | --- | --- |
| 1 | 字符串字面量里的 `\xNN` 转义 | **是** | 158b 已清（642 件 24,947 处） |
| 2 | `\uNNNN` / `\u{…}` 转义 | **是** | 158b 已清（84 件） |
| 3 | 十六进制整数（`0x3e8` 实为 1000） | **是** | 158b 清 ≥2 位（6,680 处）；**159 清单半字节**（24,169 处）；**160 清受保护件**（189 处） |
| 4 | `_0x` 标识符 | 否（已由改名工序清零） | 源码 0 处 |
| 5 | 未格式化的超长行 | 否 | `src`/`api`/`electron` 均为 0 |

`\xNN` 分布：`\x20`(空格) 17,964、`\x22`(`"`) 5,101、`\x0a`(换行) 1,547、`\x27`(`'`) 167、`\x5c`(`\`) 56，
其余为控制字符——与「混淆器把每个字符串整体转义」的特征完全吻合。

`_0x` 的 38 处命中全部在 `docs/*.md`（35 处，方法论正文/证据引用）与 `tools/deobf-*.mjs`（3 处，
工具自身的模式字符串），**源码里为 0**。

### 1.1 判定「这是不是混淆残留」的可靠办法（158b 的教训）

**数一数同一段代码里十进制与十六进制是否混排。** 混淆器改写了**每一个**整数，所以它留下的痕迹是
「大小整数一律十六进制」，而作者手写的代码在别处一律十进制。四条铁证：

```js
// 1) 自己的测试文件：同一个对象里 id 十进制、currentIndex 十六进制
'Page.getNavigationHistory': { entries: [{ id: 1 }], currentIndex: 0x0 },

// 2) 时间轴刻度表：0.1/0.2/0.5 是十进制，后面同属一个数组的却是十六进制
const MEDIA_CLIP_TIMELINE_RULER_MARK_STEPS_ASC = Object.freeze([0.1, 0.2, 0.5, 0x1, 0x2, 0x5, 0xa, 0xf]);

// 3) 选项表：0xf 与十进制 30 并列
export const STORY_SCENE_MAX_SECONDS_OPTIONS = Object.freeze([0xf, 30]);

// 4) 语义就是「15 秒」：证明 0xf 不是掩码
HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS = 0xf,
maxDurationSeconds: 0xf,
```

`0xf` 全仓 116 处，只有 **10** 处挨着位运算符。所以单半字节**不能**按「位模式/掩码」豁免。

反过来，`5381`（djb2 基）在一处仍是十进制而 `<< 0x5`、`>>> 0x0` 是十六进制，正好说明
**混淆器连 `5381` 也改写过**（原文是 `0x1505`，被 158b 还原成了 `5381`），而 `0x5` 被漏掉了。

## 2. 工具与证明

- **`tools/deobf-unescape.mjs`** — 改写器。
  ```bash
  node tools/deobf-unescape.mjs <file...>                    # 试跑，只报数
  node tools/deobf-unescape.mjs --write <file...>            # 只做转义
  node tools/deobf-unescape.mjs --write --numbers <file...>  # 转义 + 十六进制整数
  node tools/deobf-unescape.mjs --table <file...>            # 数字层预览表
  ```
- **`tools/deobf-unescape-verify.mjs`** — 独立校验器，四道检查**全部必须通过**：
  - **V0** 把两份文件里的字面量正文都删掉后，剩余文本必须**逐字节相同** → 证明只动过字面量
    （`--numbers` 模式下，先按「整数取数值」归一化再比，许可证与 V1 一致）。
  - **V1** 用**共享词法器** `tools/deobf-lex.mjs` 重建 token 流并比对（字符串按解码值、数字按数值）。
  - **V2** 用共享的 `stringValue()` 解码每个字面量正文并比对 → 值变了就报错。
  - **V3** 文件不得变长（朴素写法永远不长于转义写法）。
- **`tools/deobf-unescape.test.js`** — 回归测试 8 例，覆盖下述两个易复发的缺陷。

两个工具是**独立实现**：改写器自带扫描器（正则边界判定借用 `deobf-lex`），校验器只用共享词法器。互相兜底。

## 3. 改写规则（两条都是为了保住值）

### 3.1 转义 → 朴素字符

只有当解出的字符**能在该引用语境里直接写**时才改写：

- `\x22` 在单引号串里写成 `"`，在双引号串里仍写 `\"`；
- `\x0a`/`\x0d`/`\x09` 写成 `\n`/`\r`/`\t`（写字面换行会破坏语法）；
- 无短写法的控制字符（`\x00`、`\x1f`、`\x7f` …）、孤立代理项（U+D800–DFFF）、
  不可见分隔符（U+00A0 / U+2028 / U+2029 / U+FEFF）**保留转义**——写字面字符要么不可读、要么不安全；
- 模板串里解出的 `` ` `` 写 `` \` ``，解出的 `$` 后紧跟 `{` 写 `\$`；
- 正则字面量、注释一律不碰。

### 3.2 十六进制整数 → 十进制

混淆器把**每一个**整数都改写成了十六进制，所以一个文件里 `0x3c` 远更可能是被转写的 60，
而不是作者刻意写的十六进制常量。因此默认**全部还原**，只有「读起来像刻意常量」的形态保留原写法：

| 保留条件 | 例子 |
| --- | --- |
| 位数 > 4 且十进制不是 1000 的整数倍 | `0x811c9dc5`(FNV 基)、`0x7fffffff`(int 上限)、`0x06054b50`(ZIP 签名)、`0x46546c67`(glTF 魔数) |
| 有前导零（零填充是刻意的常量写法） | `0x0002`、`0x0a`、`0x0d`（PNG 签名字节） |
| 位模式：重复半字节或重复块（≥2 位） | `0xffff`、`0xaaaa`、`0xff00`、`0xf0f0`、`0x55` |
| 掩码：连续置位（2ⁿ−1，n ≥ 3）（≥2 位） | `0xff`、`0x7f`、`0x1f`、`0x3fff` |
| 位数 > 4 但十进制是整千 | —— 这类**照还原**：`0xf4240` → `1000000`、`0x5265c00` → `86400000`、`0x927c0` → `600000` |

**单半字节（`0x0`–`0xf`）不适用后两条豁免，一律还原**（159 批的修正）。理由见 §1.1：
位数只有 1 时，`0x0` 只可能是被转写的 0，而 `0x7`/`0xf` 在本仓里也压倒性地是普通整数（15 秒、7 档）
而非掩码。加上这条后全仓单半字节由 24,300 处降到 **1 处**——只剩 `vendor/three` 上游的真掩码。

实测效果：

- `0x3e8`→`1000`、`0x1388`→`5000`、`0xac44`→`44100`、`0x3c`→`60`、`0x1505`→`5381`；
- `0x0`→`0`、`0x1`→`1`、`0xa`→`10`、`0xc`→`12`、`0xf`→`15`；
- 保留 `0xff`（字节掩码）、`0x811c9dc5`/`0x1000193`（FNV 常量）、`0x7fffffff`、
  `0x06054b50`/`0x02014b50`（ZIP 签名）、`0x0002`（C# 常量）、`0x0a`/`0x0d`（PNG 签名字节）；
- `electron/selectedTextCapture.js` 里 C# 的 `VirtualKeyControl = 0x11` 之类虚拟键码全部保留。

可读性示例：

```diff
- const WAVE = 'M10,40\x20L10,40\x20M15,30\x20L15,50\x20…';
+ const WAVE = 'M10,40 L10,40 M15,30 L15,50 …';
- AUDIO_PLAY_LOADING_DEADLINE_MS = 0x1388;
+ AUDIO_PLAY_LOADING_DEADLINE_MS = 5000;
- `renderer-media-${… || `${Date.now()}-${Math.random()}`}`   ← 模板本身不变，但它后面不再有盲区
- for (let input = 0x0; input < part['length']; input += 0x1) { ((scope = ((scope << 0x5) + scope) ^ …), (scope >>>= 0x0)); }
+ for (let input = 0; input < part['length']; input += 1) { ((scope = ((scope << 5) + scope) ^ …), (scope >>>= 0)); }
```

### 3.3 改写器扫描器的一个真缺陷：嵌套模板吞掉文件后半（159 批修）

`scan()` 里的 `skipExpression` 原先用**绝对**层级判闭合（`level = expressionDepth + 1`，
等到 `level === 0` 才返回）。顶层模板没问题，但只要 substitution 里**再嵌一个模板**：

```js
`renderer-media-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`
```

内层 `${…}` 从 2 开始计数，遇到它唯一的 `}` 只降到 1、**永不归零**，于是一路吃到文件末尾。
后果：`api/localMediaTaskApi.js` 里 11128 字节之后的整段代码被登记成一个「模板字面量」，
**其后的所有 `\x` 转义与十六进制都被当成模板正文跳过**——包括该文件真正需要改的 `0x927c0`。

修法：`skipExpression` 改为**相对**计数（恒从 1 起），嵌套靠递归而非起始层级表达。
回归测试断言：任何 substitution 区间都不得越过文件尾。

- 波及面：全仓 13 件含嵌套模板，其中 2 件（`api/localMediaTaskApi.js`、
  `src/modules/storyWorkspace/storyWorkspaceModel.js`）确实有被漏掉的改写；其余 11 件的嵌套模板靠近文件尾，
  尾区本就无可改项。
- **该缺陷只会漏改、不会改错**：伪造区间只用于「排除」，且任何真实语义变化都会被闸门拦下。
  所以 158b「1,189/1,189 PASS」的等价性结论不受影响，只是**不完整**。

## 4. 范围与排除

- 扫描范围：`git ls-files` 出的已跟踪 `*.js`/`*.mjs`/`*.cjs`（3,167 件），核心域
  `src`/`api`/`electron` 3,121 件。
- **10 个受保护件**（`api/configApi.js`、`api/freeImageHostApi.js`、`src/manifests/index.js`、
  `nodeFooterControls.js`、`agentModelSettings.js`、`uiModule.js`×2、`rendererVirtualization.js`、
  `storeRuntimeEffectsService.js`、`uiSchemaRenderer.js`）：158b/159 两批**一律排除**；
  **160 批经用户明确授权后清理**。其中 6 件带残留（`--numbers` 干跑口径）：

  | 文件 | 转义 | 十六进制 |
  | --- | --- | --- |
  | `src/components/aigenImage/uiSchemaRenderer.js` | 214 | 26 |
  | `src/core/rendererVirtualization.js` | 0 | 77 |
  | `src/components/shared/nodeFooterControls.js` | 3 | 61 |
  | `api/configApi.js` | 0 | 13 |
  | `src/services/storeRuntimeEffectsService.js` | 0 | 9 |
  | `src/components/aigenText/uiModule.js` | 0 | 3 |
  | **合计** | **217** | **189** |

  其余 4 件（含 `freeImageHostApi.js`）无需改写。**这三批全程未碰 `freeImageHostApi.js`**，
  其 MD5 仍是 `1e0458013f5341c99f21faefc1d34d3f`。
- **改动的是字面量值，不是标识符**：受保护件之所以受保护，是怕「升代」改变装配行为；
  去混淆只重写字面量拼写（`0x258` → `600`），成员名/对象键/导出面一律不动——这与「升代」是两回事。
  160 批仍有等价性校验 + 全量回归兜底。
- **`vendor/` 必须排除**（159 批的教训）：上游代码里的十六进制是作者刻意写法。实测
  `vendor/three/examples/jsm/loaders/FBXLoader.js:3553` 的 `( … + 160 + 16 ) & ~ 0xf` 是真半字节掩码；
  全仓 46 件非 `src/api/electron` 已跟踪 JS 里，按新规则唯一命中的就是这一处。
  **规则再宽也只能作用于移植件。**
- `tools/deobf-*.mjs` 里可见的 `0x0`/`\xNN` 是工具自身的模式字符串与文档注释，有意保留。
- `docs/`（散文）不在范围内。

## 5. 结果

| 项 | 158b | 159 | 160 | 合计 |
| --- | --- | --- | --- | --- |
| 文件数 | 1,162 | **1,085** | **6** | 2,653 件次（去重后 1,443 件相对 HEAD 有改动） |
| 转义 | 24,625 处 | 83 处 | **217 处** | 24,925 处 |
| 十六进制还原 | ≥2 位 6,680 处 | **24,169 处** | **189 处** | 31,038 处 |
| 等价性校验 | 1,189 / 1,189 | **1,085 / 1,085** | **6 / 6** | 全过 |
| `node --check` | 全过 | 全过 | 全过 | —— |
| 全量回归 | 11185 / 11182 / 3 | **11193 / 11190 / 3** | 同 b159 | 与基线逐条一致（+8 为新增的 `tools/deobf-unescape.test.js`） |

终态（全仓已跟踪 JS）：

- **转义**：范围内仅剩 §3.1 明文保留的控制字符与不可见分隔符（`\x1f`、`\x00`、`\x7f`、`\xa0` 等）。
- **代码位十六进制**：**619 处**，分布在 130 件，**全部是 §3.2 表里的刻意常量**——
  `0xff` 255、`0xffffff` 34、`0x811c9dc5` 31（FNV 基）、`0x1000193` 31（FNV 质数）、
  `0xf423f` 17（=999999，位数 5 且非整千，按规则保留）、`0x7fffffff` 16、零填充 `0x000000` 16 + `0x00` 15、
  `0xffffffff` 13、`0xaa` 12、`0x20000` 10 等。**受保护件里的 189 处已在 160 批清完**。
- **单半字节**：只剩 `vendor/three` 上游真掩码 1 处（`FBXLoader.js:3553` 的 `& ~ 0xf`）；
  另有 4 处是测试字符串 `'0x1'`、C# 内嵌字符串、工具自身正则，均已核实合法。
- 核心域 `src`/`api`/`electron` 3,121 件**全部「无需改动」**（`--numbers` 干跑口径）。

## 6. 复现

```bash
NODE=node
# 1) 列出核心域已跟踪 JS
git ls-files | grep -E '\.(js|cjs|mjs)$' | grep -E '^(src|api|electron)/' > /tmp/core-js.txt

# 2) 归因：受保护件单独隔离，写出可改名单
"$NODE" <b159>/plan.mjs /tmp/core-js.txt <b159>/writable.txt

# 3) 逐件改写（逐件起进程，任何一件返回非 0 都会记进日志而不是静默跳过）
bash <b159>/apply.sh <b159>/writable.txt

# 4) 逐件对照 HEAD 复核等价性 + 语法，然后跑全量回归
bash <b159>/verify.sh <b159>/writable.txt
```

`plan.mjs`（归因与名单）、`apply.sh`（逐件落盘）、`verify.sh`（校验 + 回归）三个脚本落在
`C:/Users/luobote/.qoder/tmp/deobf-tools/b159/`（暂存区，不入库）。

**160 批（受保护件）** 走同一条链，只是名单换成 6 件、改前先备份到 `b160/backup/`：

```bash
NODE=node
B=<b160>/backup
for f in api/configApi.js src/components/shared/nodeFooterControls.js src/core/rendererVirtualization.js \
         src/services/storeRuntimeEffectsService.js src/components/aigenText/uiModule.js \
         src/components/aigenImage/uiSchemaRenderer.js; do
  "$NODE" tools/deobf-unescape.mjs --write --numbers "$f"
  "$NODE" tools/deobf-unescape-verify.mjs --numbers "$B/$f" "$f"   # 必须 PASS
  "$NODE" --check "$f"
done
```
