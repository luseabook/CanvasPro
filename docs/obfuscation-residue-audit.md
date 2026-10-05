# 混淆残留普查与编译核验（第 167 批）

> 起因：用户要求「检查项目是否还有混淆残留，确保无任何混淆，并且可以正常编译」。
> 结论：**真正的混淆已清零**；但 166 批报出的「残留 0」当时是**假零**，本批把普查器的盲区修掉，
> 并因此补上了两处此前从未被任何工具看见的残留。
> 本批**未提交、未推送**。

## 1. 先说最重要的：166 批的「残留 0」不成立

`tools/deobf-residue-scan.mjs` 是 166 批新写的普查器，也是那批唯一的「已清零」依据。它有三处盲区，
每一处都能让残留整层穿过而计数仍为 0：

| 盲区 | 代码 | 漏掉什么 |
| --- | --- | --- |
| 扩展名 | `entry.name.endsWith('.js')` | 一切 `.mjs` / `.cjs` / `.jsx`。本仓 `.mjs` 是**生产代码**不是脚本，`.cjs` 是 Electron preload 桥 |
| 标识符下限 | `/^_0x[0-9a-f]{4,}$/` | `_0x1`、`_0x2` 这类短式。混淆器产出短式和 `_0x17f006` 一样常见，四位下限等于放行 |
| 扫描起点 | `ROOTS = ['src','api','electron','vendor']` | 从树根**以下**起步，`main.js` 与根级配置从来没进过扫描 |

另有第四处：`ROOTS` 之外的文件即使存在也不被计入，「扫过了」和「压根没看」在输出里长得一样。

**为什么前几批没发现**：改名、转义、十六进制、布尔四批各自扫的是不同层（标识符层／字面量层／运算符层），
每层结论单独看都对，**合起来错**。166 批已经吃过一次这个亏（运算符层），但它的普查器本身又带三层新盲区。

## 2. 据此查出的两处真实残留

### 2.1 `src/modules/providerApiKeyMissingToast.mjs` — `!![]` / `![]` 共 15 处

- 全仓**唯一**一个非 vendor 的 `.mjs`（`git ls-files "*.mjs"` 除 `tools/` 外只此一件）。
- 它的 `.js` 孪生件 `providerApiKeyMissingToast.js` **已被 166 批改写干净**（提交 `ea55817c`），
  `.mjs` 因扩展名漏掉——两份文件并排放在同一目录，肉眼很难发现。
- 处理：用 166 批自己的改写器 `tools/deobf-bool.mjs --write`，再由**独立校验器**
  `tools/deobf-bool-verify.mjs` 复核，四道检查全过（其中一道把 `!![]` 交给 JS 引擎实跑，证等于 `true`，
  不靠模式匹配）。15 处跨度，长度核算 +8 字节与预期一致。

### 2.2 `src/modules/agent/agentMessageTime.test.js` — `_0x1` / `_0x2` 共 4 处

在测试桩 `makeElement()` 的 `setAttribute` 上。四位下限放行了短式。改回 `name` / `value`。

## 3. 普查器的修法与反向验证

改了四处（`tools/deobf-residue-scan.mjs`）：补 `.mjs/.cjs/.jsx`、标识符下限放宽到 `{1,}`、补扫 `main.js`。

**反向验证**（关键一步，否则无法区分「修好了」和「本来就没问题」）：把**修复前**的两份原件摆进夹具目录，
用修复后的普查器扫——

| | 修复前普查器 | 修复后普查器 |
| --- | --- | --- |
| `providerApiKeyMissingToast.mjs` 的 `!![]` | **0** | **26** |
| `agentMessageTime.test.js` 的 `_0x` | **0** | **4** |

修复前报 0，修复后报得出来，证明这 15 + 4 处是真的、不是误报。（`!![]` 记 26 而非 15 是普查器自身的计数口径：
`!![]` 的两个 `!` 各命中一次。这是 166 批就有的显示口径问题，不影响改写器——改写器按跨度报 15，是对的。）

## 4. 另建全仓签名普查（既往工具全部不覆盖的面）

`deobf-residue-scan.mjs` 只看 `src/api/electron/vendor` 的 `.js`。于是 `backend/`（Python）、
`main.js`、`index.html`、`*.cjs`、`tests/`、`e2e/` 从未被扫过。另写一个覆盖
`.js/.cjs/.mjs/.html/.css/.py/.json/.yml` 的签名普查，查 14 类形态：
`_0x` 长短式、`!![]`/`![]`、`eval(`、`new Function`、`String.fromCharCode`、`atob`/`base64`、
`unescape(`、`document.write`、`debugger`、`__defineGetter__`、`while(!![])`、
字符串数组 IIFE、`\x`/`\u` 转义、长十六进制串。

**结果：`tools/` 以外全部归零。** 余下命中逐条核对为正当用法：

- `backend/services/sortformer_diarization_service.py:255` 的 `model.eval()` —— PyTorch 的推理模式，不是 JS `eval`。
- `electron/legacyRendererStorageMigration.test.js:210` 的 `new Function(...)` —— 测试夹具，用来证明内嵌的
  导出脚本是自执行函数；对应生产文件里**没有** `new Function`。
- `atob` / `fromCharCode` —— base64 与字节流转换（图片 data URL、剪贴板、PNG 派生图）。
- 长十六进制串 —— SHA-256 前缀、测试用 RSA 模数、资源索引哈希。
- `vendor/three`、`vendor/mediapipe` —— 上游代码，压缩过，本就不该动。

## 5. 编译与回归

编译面：`build:win` 是 electron-builder 打包，本仓**没有打包前的编译步骤**，所以「能编译」在这里
等价于「Node 能解析每个模块」。逐件 `node --check`：

```
checked : 9374 JS files
failures: 0
```

回归（三棵树，失败集与改前逐条一致）：

| 范围 | 结果 |
| --- | --- |
| src | 8442 / 8418 / 24 |
| api | 1050 / 1047 / 3 |
| electron | 1693 / 1691 / 1 |

**回归证明不是靠「数字看着没变」**：把本批改的三份文件回退成改前原件，用**同一条命令**重跑 src 全量，
得到完全相同的 24 条失败，逐条 diff 一致（`Compare-Object` 无输出）→ **0 回归**。
失败项全部落在视频/音频域（`aigenAudio` payload、`video task orchestration`、`videoToolbar`、抠像），
与本批三个文件无交集，是基线旧账。受保护件 `api/freeImageHostApi.js` 的 MD5 仍为
`1E0458013F5341C99F21FAEFC1D34D3F`。两个改到的文件定向跑：**16/16**。

## 6. 遗留（不是混淆，待裁决）

1. **`providerApiKeyMissingToast.mjs` 与 `.js` 是两份无人引用的重复孪生。** 全仓无任何文件 import 那个 `.mjs`
   （含 `index.html`、`electron-builder.win.cjs`、`preload.cjs`）。且 `.mjs` 停在**更早一代**：
   它的形参还叫 `state`（函数体里又 `const state = String(...)`，名字自撞），`.js` 已被后续批次理顺成 `error`。
   **建议删 `.mjs`**。未获授权，本批只把它去混淆、只报告，不删。
2. **212,953 处 `['bracket-member']` 方括号取属性**（`String(x)['trim']()`、`Object['freeze']`、`JSON['parse']`）。
   这不是混淆——逻辑完全可读，是移植时的house style，代价是编辑器补全和 grep 失效。
   166 批的文档已把它标为「可读性残留」。**规模 21 万处，属独立批次**，动它之前要先定标尺（是否连 `vendor/` 一起、
   是否纳入格式化流程），不宜顺手做。
3. **改名批留下的通用回退名**（`value22`、`options2`、`message2`、`list8`、`providerId2`）。
   `_0x` 已归零，但自动取名器对约三成名字落到通用回退名（`deobfuscation-workflow.md` §3 已自陈）。
   这类名字**不是混淆**（一致、可推导、无隐藏），但个别处名实不符，如
   `canvasCollaborationApi.js` 里解析出来的邀请对象叫 `enabled`。同样属独立批次。

## 7. 第 167 批改动清单

```
src/modules/agent/agentMessageTime.test.js |  4 ++--     _0x1/_0x2 -> name/value
src/modules/providerApiKeyMissingToast.mjs | 30 ++++----  15 处 !![]/![] -> true/false
tools/deobf-residue-scan.mjs               | 24 +++++++--  普查器四处盲区
```

## 8. 第 168 批：把「已清零」从声明变成闸门

> 用户裁决：按 167 批的建议执行。三件事——删掉无人引用的重复孪生、把无混淆做成构建门禁、修名实不符的名字。

### 8.1 删除 `providerApiKeyMissingToast.mjs`

补证据后才删，结论比 167 批更强：

| 证据 | 结果 |
| --- | --- |
| 0.7.16 镜像里有几个 | **两个都在**，`providerApiKeyMissingToast.js` 与 `.mjs`，且 SHA-256 完全相同（上游就发两份） |
| 上游谁 import `.mjs` | **零个**（全镜像扫 `providerApiKeyMissingToast.mjs` 无命中） |
| 上游谁 import `.js` | **21 个**文件 |
| 0.8.0 镜像里有几个 | **只有 `.js`**（5723 字节） |

即：上游 0.7.16 多发的那份从来没人用，**0.8.0 已经把它删了**。仓库跟着删，是向 0.8.0 代际靠拢，不是自创裁剪。

连带更新 `docs/tracking/orphans.md`——它把该文件列为 19 个 `src/modules/` 孤立件之一。顺带发现**该台账自第 161 批后就没再重算**：
它记 可达 1792 / 孤立 200，而手上 `reach.mjs` 在同一 scope 下实测 **1864 / 127**。已按实测整表刷新（30 个目录段、
汇总表与分段合计均为 127）。**不手工加减这张表**，改完接线一律重跑脚本。

### 8.2 `tools/deobf-gate.mjs`——构建门禁

167 批的结论是「四批里有两批报了假零，根因是结论来自一个手工跑一次、只扫一部分的脚本」。
所以真正该做的不是再写一个更好的扫描器，而是**让人没法再相信「我扫过了」这句话**。

`deobf-gate.mjs` 与旧普查器的关键差别：

- **走整棵树，不走手挑的 `ROOTS`**——167 批的盲区之一正是 `ROOTS` 从树根以下起步。
- **命中即 `exit 1`**，并已挂进 `npm test`（`npm run check:obfuscation && node --test ...`）。
  现在 `npm test` 会先跑闸门，命中就 fail fast。
- **只对零歧义信号 fail**：`_0x` 标识符（任意长度）、`![]`/`!![]`、`debugger`、字符串数组解码 IIFE、自防护钩子。
- **`eval` / `new Function` 只警告不 fail**：本仓有正当用法（测试夹具 `new Function`）。会误报的闸门迟早被关掉，
  关掉之后等于没有。
- 排除项全部显式列出并打印计数，不静默丢弃：`vendor/`（上游）、构建产物、`tools/deobf-*`（14 件，
  它们必须包含自己要检测的形态）、`.kilo/`。

**闸门当场抓到我漏掉的东西**：首次运行报 **1,048,627** 处命中，全在 `.kilo/worktrees/`——
那是 `git worktree list` 里**本仓库的两个已注册 worktree**（`frosted-date` @ cf191eac、`speckle-psychiatrist` @ 57f10635，
均为 2026-09-30 的提交，早于去混淆批次），装着约 6,198 个文件的**去混淆前完整副本**。
已显式排除并在摘要里打印为「older worktrees, not source」。**这两个 worktree 建议 `git worktree remove` 清掉**（见 §8.4）。

### 8.3 闸门必须先被证明会失败

「一个从没失败过的闸门，和一个永远通过的闸门没有区别」——尤其这个闸门的存在理由就是前两批的假零。
所以配了 `tools/deobf-gate.test.js`，**11 例**，用 `node:test` 起子进程跑真闸门：

| 用例 | 锁住的行为 |
| --- | --- |
| 干净源码 | exit 0 |
| **167 批那两处残留** | 15 处 `!![]` + 4 处 `_0x` 都被抓到，exit 1 |
| `_0x` 短式与长式 | `_0x1` / `_0xa` / `_0x17f006` 都抓 |
| **`.mjs` / `.cjs` 也扫** | 167 批那处漏网的根因 |
| **根级文件也扫** | 另一处盲区（`main.js`） |
| **注释 / 字符串 / 正则字面量不算** | `// !![]`、`"!![]"`、`/!!?\[\]/`、模板串都不能触发 |
| `![][0]` / `![].x` | 是在索引数组，必须放过 |
| `debugger` / 字符串数组 IIFE / 自防护 | 逐条命中 |
| `eval` / `new Function` | 只进 warnings，exit 0 |
| `vendor/` | 排除且摘要里报出来 |

现态：**11/11**。

### 8.4 名实不符的名字（小批，两处）

按 167 批的建议，**只修主动误导的，不全量洗 6.7 万处**：

- `api/canvasCollaborationApi.js`：`enabled` 装的是**解析出来的邀请对象**，校验段读作
  `if (!enabled.endpoint.url)` 会以为是功能开关。连同同函数里的 `item` / `list` 改为
  `decoded` / `inviteText` / `inviteCode`。
- `api/adapters/modelApiMappingEngine.js`：只改 `normalizeImageBase64DataUrl` 一个函数——
  `list8` 是 base64 载荷、`list9` 是解码后的魔数头、被改写的 `value24` 是 mime，
  原文 `return 'data:' + value24 + ';base64,' + list8` 完全读不出在拼什么。
  同文件其余 `enabled2..5` / `list2..12` / `value8..29` **不动**，那属于 67k 那批。

两处都走 `tools/deobf-verify.mjs` 改名闸门：**token 流完全一致**（3061 / 2100 tokens），
导出面不变，改名数一一对应。

**闸门两次替我拦下错**（这是它比「看着对就行」强的地方）：
1. 第一次取名 `payload` / `code` / `decoded`，闸门报 *shadowing*——`payload` 是 222 行 `startHost` 的形参，
   `code` 是 289 行的局部变量。换成 `inviteText` / `inviteCode` / `decoded` 才过。
2. 第二处我自己写的遮蔽检查把「改名后函数内计数」和「改名前全文件计数」比，方向反了，
   把每个改名都误报成冲突。**修正后先检查、确认文件哈希未变，才重跑。**

### 8.5 回归与门禁现态

- `npm test`（已含闸门）：**11215 / 11186 / 28 / skipped 1**，与本批改动前**逐条一致**。
- 分树 TAP 与第 167 批开工前的基线同样逐条一致：src **8442/8418/24**、api **1050/1047/3**、electron **1693/1691/1**。
- 闸门：**3146 件 / 0 命中 / exit 0**；闸门自测 **11/11**。
- 受保护件 `api/freeImageHostApi.js` MD5 仍为 `1E0458013F5341C99F21FAEFC1D34D3F`。

### 8.6 仍然遗留（按 167 批判断继续推迟）

1. **21 万处方括号取属性**——不是混淆，且现有 token 等价闸门**证明不了** `x['a']` → `x.a`（token 流不同）。
   要做须先扩展词法器写专用闸门，并排除数字下标、非标识符键、`vendor/`。**独立批次。**
2. **`value22` 类通用回退名约 6.7 万处 / 667 件**——一致、可推导、不隐藏逻辑，全量洗是高风险低回报。
   本批只修了其中最误导的两处。
3. **`.kilo/` 的两个旧 worktree**——各含一份去混淆前的完整副本（约 6,198 个 JS 文件），
   白占磁盘也容易在 grep 时把结论带歪。建议 `git worktree remove`；未获授权，未动。

未提交、未推送。跟踪脚本按 AGENTS.md §0 处于停用状态，未运行。
