# CanvasPro 跟踪文档（新对话唯一入口）

> **新对话只读这一份就能接手，不要通读项目。** 本文件体积 ≤45 KB、单行 ≤400 字，一次 `read_files` 就能读完。
> 入口链：用户只需说「读一下项目文档」→ `README.md` 顶部或 `AGENTS.md` → 本文件。所有文件改动都会自动记录（§12）。
> **当前状态：跟踪机制已按用户要求暂停（2026-09-29）。不要运行开工、改动或收工登记，也不要恢复自动监视。**
> 最后更新：2026-10-08（第 182 批·Agnes 视频轮询线路修复）。跟踪机制自 2026-09-29 起停用；提交与推送状态见 §5。124a–f 曾用的 `port/batches-1-122a` 分支 2026-09-28 经授权本地与远端双删（3c3b3ae 可恢复）。
> 第 125k–141 批落首波 135 件 510 例；未落地 771 **已清零**（142 批复算：镜像 0 缺失）。130 发现 `core/math.js` 死循环。见 `docs/b126-reachability.md`。
> 余 **200 个未接线孤立模块**（现行口径 200/1992；§7.6）。
> **⚠ 第 158/165 批：代际漂移（未改动源码）**——已安装应用升至 **0.8.0**（镜像 `shuo-deobf-080`）；比 0.7.16 **+184 新增、455 件有变**（165 批 token 口径复算 429 件，184 一致）。**156 批待裁决项作废**；**标尺切换 A/B/C 至今无裁决记录**，而 161–164 批继续按 0.7.16 推进。
> **b157 暂存树实测 12/12 源自 0.7.16 镜像**，故 162/163 落地的 11 件里 **7 件是 0.7.16 代内容**。全仓距离首次量出：对 0.7.16 **1149 件不符**（非 0）、对 0.8.0 **1261 件不符 + 184 件缺失**——b158「剩余欠账只是接线」仅在「文件是否缺失」层成立。另查出**第四层混淆** `!![]`/`![]` **17,253 处 / 1,044 件**。见 `docs/b158-version-rebaseline.md`、`docs/b165-generation-drift-audit.md`。
> **去混淆已收官（四批）**：改名（`_0x` 归零）+ 转义 24,925 处 + 十六进制还原 31,038 处+ **布尔层 17,253 处**（166 批），共 **2,653 + 1,044 件次**。四批各有一道独立闸门，全量 **11193/11163/30**（净增 3 例为基线本有的环境性失败）。源码现无 `_0x`、无未解释转义、无 `![]`/`!![]`；代码位十六进制剩 **661 处**（`vendor` 上游 304 本应如此、项目代码 357 为刻意常量如 `0xff`/`0x811c9dc5`）。见 `docs/unescape-normalization.md`、`docs/boolean-deobfuscation.md`。

> **第 161–162 批：逐件接线到顶 → 转整代升代**——161 批整组落地净增 67 例、新候选 33 例，逐件接线已到极限（**只跑同名测试会假阴性**，须并入交叉影响文件），仅落 1 件；162 批 12 件整体落地净增 68 例后回滚。见 `docs/b161-consumer-upgrade-sweep.md`、`docs/b162-video-domain-adjudication.md`。

## 0. 现状速览

- **项目**：`F:\CanvasPro` 是 AI CanvasPro 0.4.12 的源码，技术栈为原生 ESM 前端、Python `server.py`、可选 Electron。结构见 §10，细节见 `docs/tracking/project-map.md`。
- **总目标**（用户原话要点）：对照已安装的应用（`D:\shuocancas\SHUO Canvas\resources\webapp`；**2026-10-05 起实际版本为 0.8.0**，此前为 0.7.16），把缺失功能的**可维护源码加进来，并实际接入工程**。
  - R01–R26 全范围不缩减；单批交付只是检查点。
  - 直接实施，不要只分析，也不要每批再问是否开发。
- **进度**：第1–123批已提交推送；124a–f 业务代码与末尾记账（8fafc80、ba8e9b4、3b8fc6e、3c3b3ae）均已推远端移植分支，远端 master 未更新；124g/124h 至 141 共 307 件新模块未提交（工作树 614 个未跟踪 src 文件）。R01–R26 **都没有完成**（§6）；不把模块落地或推送成功误写成功能已完成。
- **本批（2026-10-08，第 182 批）**：更正第 180 批 ③ 的错误归因——**不是余额问题**（Agnes 文本/图像/flash 视频在 ￥0 下均实测可用）；并修掉真缺陷：只配国内档时视频**轮询**丢 API Key（创建 200、轮询 400）。③ 真机已 PASS。细节见 `docs/agnes-video-poll-profile-fix.md`。
- **必须清楚的偏差**：第 84 批以来的新增移植多数是「落地不接线」，即模块和单测进了仓库，但从入口走不到。
  - 增量台账（`docs/tracking/orphans.md`）**已实测重算**：现行口径 **200 不可达 / 1992 模块**（断链 0；方法见 `docs/b126-reachability.md`）。旧的 483/1238 是更窄口径，**不可直接相减**。
  - 总目标要求「实际接入」，所以接线欠账（§7.4）迟早要还。
- **下一步**：移植欠账已清零（第 142 批复算：镜像 1754 件 0 缺失、首波闸门 `MISSING_TOTAL=0`）。剩余 **200 个未接线孤立模块**（方案见 `docs/porting-closure-and-wiring-plan.md`）。**第 161 批实测：逐件升代接线收益已到极限**——剩件普遍带「规格变更」或「装配失配」回归，后续须在「整代升代＋同步改测试」「真机验证驱动」「暂停接线」三者中裁决；接线须改在用文件，需授权。
  - 125a–125l 的逐件清单见对应专题；远端 master 是否推送须用户另行选择（会触发发布路径），不自行推。
- **变更记录**：当前已暂停。用户要求恢复前，不再运行跟踪命令或自动监视；机制原文见 §12。

## 1. 开工流程（新对话照做）

用户开新对话时通常只说一句「读一下项目文档」（MCP 会话会另外给连接地址）。`README.md` 顶部和 `AGENTS.md` 会把你带到这里。接下来照做，不需要用户再介入。

1. **跟踪已暂停**：不要运行 `node tools/tracking/track.mjs --by session-start`、`--by agent` 或 `--watch`；直接进入第 2 步。
2. 连接 MCP，方法见 §3.1。连接地址由用户私下提供，**不要写进仓库**。
3. 如确需了解最近改动，再读 `docs/tracking/changes/` 里最新文件的末尾几条；不要为读取历史而运行跟踪脚本。
4. 调 `git_status`，和 §5 的快照对比。对不上时先查明原因（历史记录或用户手动改动），不要覆盖。
5. 读本文件的 §2、§4、§7；另外只读本批涉及的专题文档（§7 里给了路径）。**不要通读项目。**
6. 授权以 §1.1 为准，**不要再问用户**；只有超出 §1.1 的事才需要先问。
7. 按 §4 的单批工序做 §7 的第一项。当前不要登记跟踪变更。

### 1.1 常设授权（用户 2026-09-25 要求全自动；用户可随时删改本节）

- **可以直接做**：
  - 用 `run_command` 只读访问 §3.2 的外部目录；
  - 在 `deobf-tools` 下建暂存目录、写暂存文件；
  - 执行离线单测（`node --test`），第 30–118 批每批都执行过；
  - 运行 `tools/tracking/track.mjs`。
- **必须先问**：启动应用或 Electron、构建、安装依赖、真实模型或云服务请求（会花钱）、`git commit` 或 push、升代受保护装配件。

## 2. 硬规则

1. **写入流程**：`git_status` → `read_files` 取新鲜 `version` → `apply_patch` 并带上 `expected_versions`。
   - 仓库只用 `apply_patch` 写。
   - 多文件补丁失败时，先核对实际落盘结果。
   - 遇到 STALE_FILE 就重读文件、重新生成补丁，不要盲目重试。
2. **禁止**：
   - `git reset --hard`、`git clean`；
   - 整目录替换，或用新版发布文件覆盖；
   - 自动 commit、push、发布；
   - 修改 `D:\shuocancas` 安装目录。
3. **保护**：
   - `api/freeImageHostApi.js`：MD5 为 `1e0458013f5341c99f21faefc1d34d3f`，任何批量操作都要排除它。
   - 短剧、账号、授权和原有生成逻辑。
   - 在用的「受保护装配件」，例如 `api/configApi.js`、`src/manifests/index.js`、`uiSchemaRenderer.js`、`nodeFooterControls.js`、`agentModelSettings.js`、`uiModule.js`、`rendererVirtualization.js`、`storeRuntimeEffectsService.js`。升代必须**单独成批，经用户授权并真机验证**。
4. **授权**：常设授权见 §1.1；除此之外，未经用户同意，不执行以下操作：
   - 跑测试套件、构建、安装依赖；
   - 启动应用或 Electron；
   - 发起真实模型或云服务请求（会产生费用）。
   - 需要时先说明范围和费用。
5. **不伪造**：
   - 不写 shim 冒充缺失的导出，不伪造消费方，不伪造缺失的夹具 `tests/testPreviewDom.js`。
   - 静态检查、测试通过、应用运行通过、厂商验收是四件不同的事，报告时分开写。
6. **不找借口**：没有原 Python 源码不等于不能实现，按已核对的契约写可维护实现；不要留 404 的界面壳。
7. **保密**：MCP 地址、会话 ID、API Key 不写进仓库或文档；不输出 `user/config.json` 里的密钥。
8. **别点「更新」横幅**：应用内热更新会执行 `git reset --hard`，抹掉当时所有未提交的修改（写入本条时为 0，见 §5；当前数字以开工第 3 步的 `git_status` 为准，§8 第 1 条）。
9. **文档格式**：表格行内不写裸竖线 `|`，否则会虚增列数（第 112 批定的规矩）。
10. **测试桩约定**：覆盖项一律写成 `'k' in over ? over.k : 默认值`。
11. **改动登记（当前暂停）**：不要运行 `track.mjs --by agent --note`；不要修改或删除 `docs/tracking/changes/` 里已有的记录，也不要手改 `docs/tracking/state/`。只有用户明确要求恢复时才重新启用 §12。

## 3. 环境与工具

### 3.1 MCP 桥（ccming-bridge 0.2.2）

- **传输**：只能用 Streamable HTTP。
  - 用 POST 发 `initialize`，请求头 `Content-Type: application/json` 和 `Accept: application/json, text/event-stream`。
  - 从响应头取 `mcp-session-id`，之后每个请求都带上；再发 `notifications/initialized`。
  - **不要用 GET 开 SSE 流**，会返回 405 或挂起。
  - 会话过期（404）就重新初始化，但不要重放已经成功的写操作。
- **限制**：
  - `read_files`：每次最多 20 个文件、每个文件最多 1000 行、合计最多 10 万字符。
  - **单行超过 3000 字符会被截断**，看返回的 `truncated_line_numbers`。
  - **超过 1 MiB 的文件直接拒读。**
  - `list_directory` 深度最多 2、最多 300 条；`find_files` 只匹配路径（参数 `patterns`），最多 300 条；`search_files` 参数为 `pattern`。
  - 调用太快会返回 429：间隔至少 0.4 秒，遇到 429 就退避。
  - 后台 direct 命令实测 timeout_ms=1000 会按 1 秒生命周期终止；长回归应给足生命周期（本次 600000），不要把它当初始输出等待。重跑前先确认旧进程退出。
- **权限**：写入和 shell 都要用户在本机批准。文件工具**只能访问工作区内**的相对路径，外部目录只能通过 `run_command` 访问。
- **工具**：共 20 个。
  - 文件：list_directory、find_files、read_files、search_files、apply_patch
  - 命令：run_command，另有 6 个终端管理工具
  - 代码与 git：get_diagnostics、lsp、get_file_outline、git_status、git_diff
  - 协作：set_todos、report_progress、skill（只有 3 个通用技能，和本项目无关）
- **如果你在沙箱里用 HTTP 调 MCP**：
  - 大输出先写到文件再做摘要。
  - 不要假设上一次对话的脚本或缓存还在，以远端文件和本次工具结果为准。

### 3.2 主机与外部目录

- **主机**：Windows，工作区 `F:\CanvasPro`，shell 是 **PowerShell 5.1**。
  - 语句用 `;` 分隔，不支持 `&&` 和 `||`；读 `$LASTEXITCODE` 判断结果。
  - 输出中文前先执行 `[Console]::OutputEncoding=[Text.Encoding]::UTF8;`，读文件时加 `-Encoding UTF8`。
  - `run_command` 建议用 `execution:"direct"`、`background:false`；长输出用 `get_command_output` 按 `next_offset` 分页读取。
- 以往批次文档里的命令是 bash 写法（`$(find …)`），在本主机上要改写成 §3.3 的形式。
- 外部目录只能只读访问，而且需要用户批准 `run_command`：

| 用途 | 路径 |
| --- | --- |
| 0.7.16 安装版（不得修改） | `D:\shuocancas\SHUO Canvas\resources\webapp` |
| 0.7.16 反混淆镜像（移植源） | `C:\Users\luobote\.qoder\tmp\shuo-deobf\`，下有 `api\`、`src\` 等，路径与仓库同构 |
| 工具与暂存 | `C:\Users\luobote\.qoder\tmp\deobf-tools\` |

- `deobf-tools` 里常用的文件如下，用法以脚本头部注释为准：
  - `b100\verify-exports.mjs`：跨树具名导出闸门。
  - `b95\deps-ast.mjs`：LEAF/OK/BLK 分级。
  - `b119\screen-leaves.mjs` 和 `b119\screen.txt`：第 119 批候选的筛选脚本和结果。
  - `b85-fails.txt`：src 基线 43 项失败的名单。
  - `prettierrc.json`、`cmp-tokens.mjs`，以及各批暂存目录 `b<批号>\port\`。

### 3.3 常用命令

以下是以往批次 bash 命令的 PowerShell 改写，首次使用前先确认能跑通。

```powershell
# src 回归 sweep（基线 4176 / 4133 / 43）
node --test --test-timeout=25000 (Get-ChildItem src -Recurse -Filter *.test.js).FullName
# 用 FullName 跑时 10 个文件级失败名带 F:\\CanvasPro\\ 前缀，去掉后再和 b85-fails.txt 比；TAP 约 8 MB，先 Out-File 到 deobf-tools 再统计
# api 回归（基线 791 / 791 / 0）
node --test (Get-ChildItem api -Recurse -Filter *.test.js).FullName
# 本机 Node 24 默认 spec 输出；统计用 --test-reporter=tap。PowerShell 管道可能损坏中文 TAP，优先用 b124/b124f-sweep-raw.mjs 原始字节捕获（专题文档 §10）
# electron 回归（基线 1649 / 1648 / 1；只在改了 electron 时跑）
node --test --test-timeout=25000 (Get-ChildItem electron -Recurse -Filter *.test.js).FullName
# 受保护文件校验（应为 1E0458013F5341C99F21FAEFC1D34D3F）
(Get-FileHash api\freeImageHostApi.js -Algorithm MD5).Hash
# 暂存文件与仓库文件逐字节比对
(Get-FileHash <暂存文件>).Hash -eq (Get-FileHash <仓库文件>).Hash
# 只读查询冻结的超大台账
Select-String -Path docs\implementation-handoff.md -Pattern '第119批' -Encoding UTF8
# 变更记录（§12）：当前暂停，以下命令不要执行
node tools/tracking/track.mjs --by session-start
node tools/tracking/track.mjs --by agent --note "第119批：落地 api/utils 等 7 件并补测试"
node tools/tracking/track.mjs --status
```

## 4. 单批工序（沿用第 100–118 批的做法）

1. **选件**：取 §7 队列的第一项。
   - 纯叶（0 条相对 import）可以直接排期。
   - 带相对 import 的，先用 `verify-exports.mjs` 核验每个具名导入在本仓真实存在。原因是 `deps-ast` 的 OK 只看依赖文件在不在，第 116 批因此出现过 25% 的假阳性。
   - `verify-exports.mjs` 只认 `import {…}`，会漏掉 `export {…} from` 再导出；第 123 批起改用 `b123\b123-gate.mjs`（AST 版）。闸门只核对名字，被 import 的在用文件还要和镜像对照世代差异（§8 第 6 条）。
2. **暂存**：把镜像文件复制到 `deobf-tools\b<批号>\port\`，用 `prettierrc.json` 格式化。
3. **落地**：
   - 用 `apply_patch` 的 Add File 写到仓库的同一相对路径，新目录会自动创建；内容和暂存产物一致。
   - 落地后用 `Get-FileHash` 逐字节比对。不一致多半是末尾换行或 CRLF 的差别。
   - 再跑 `node --check`。
   - **只新增文件，不覆盖在用文件。**
4. **测试**：
   - 每件配一个同名的 `*.test.js`，用 `node:test` 和 `node:assert/strict`，放在同一目录；只从公开导出进入。
   - 首跑失败时先查自己的期望写得对不对，**不改移植过来的实现**。
   - 如实记录首跑结果和改了什么。
5. **回归**（需要授权）：跑 src 和 api 的 sweep，改了 electron 再加跑 electron。
   - 通过数应该恰好增加新增用例数，失败数不变。
   - src 的 43 项失败名单必须和 `b85-fails.txt` 完全一致。
6. **反查消费方**：在 `api`、`src`、`electron`、`main.js`、`renderer.js` 里 grep 模块名（仓库根目录其实没有 `renderer.js`；要区分大小写，否则 `createStoryClipExportGuard` 这类名字会误报）。
   - 0 命中就记为「落地不接线」。
   - 如果本仓有真实消费方且依赖闭合，可以接线（参考第 75–78 批），但要写清行为差异，并注明「需真机验收」。
7. **收尾核对**：受保护文件 MD5 不变；记下 git_status 前后的数字。
8. **记录（当前暂停）**：
   - 写专题文档 `docs/<主题>.md`，结构参照 `docs/services-image-preview-and-video-frame.md`：落地清单、冻结的端口行为、检查结果表、未执行项与边界、下一批口径。
   - 更新本文件和 `docs/tracking/batches.md` 时不要运行跟踪登记。

## 5. 仓库快照（2026-09-29，141 批落地并记账后）

| 项 | 值 |
| --- | --- |
| 分支 | 只有 `master`（本地 9e36518，绑 origin/master，ahead 5）。`port/batches-1-122a` 已本地与远端双删（2026-09-28 用户授权，3c3b3ae 可恢复）。远端 master 仍 1a42e29。勿据 ahead 提示推 master |
| git_status | 141 批后源码、专题与记账文档仍未提交；`git status --untracked-files=all` 实测未跟踪 src **614** 个。工作树干净不代表远端 master 已同步 |
| 提交情况 | 8fafc80（40件）、ba8e9b4（8件）、3b8fc6e、3c3b3ae 均已推远端移植分支（该分支已删）。全程不强推、不跟随标签、未推 master |
| src sweep | 7426 / 7383 / 43（141 新增 37；140 为 7389/7346/43），实跑。43 项失败名与 b85 完全一致，新增 0 消失 0；证据 `b131-src-raw.tap`、`b131-src-fails-raw.txt`、`b131-failure-comparison.json` |
| api sweep | 791 / 791 / 0（135 复跑未变）；证据 `b131-api-raw.tap` |
| electron sweep | 1649 / 1648 / 1（R14 第 17 批遗留） |
| 静态检查 | 本批 10 个源与同名测试 `node --check` 20/20 通过；Python 文件都能 `ast.parse`（2026-09-25 镜像离线检查）。124g/124h 至 141 新增源与同名测试逐批通过 |
| 孤立模块 | 现行口径 **200 / 1992**（断链 0，第 161 批重算）。旧记的 483/1238、403/1238 是更窄口径的历史值，**不可直接相减**。完整清单见 `docs/tracking/orphans.md`，方法见 `docs/b126-reachability.md` |
| 移植欠账 | 第 127 批实测原欠账 **771**；第 128–141 批落首波 135 件（510 例）。**第 142 批复算已清零**：镜像范围 1754 件仓库 0 缺失、首波闸门 `MISSING_TOTAL=0`。剩余 **200 个未接线孤立模块**（第 150–157 批接 167 件、第 161 批接 1 件），方案见 `docs/porting-closure-and-wiring-plan.md`。**第 161 批实测：逐件接线已到收益极限**（见 `docs/b161-consumer-upgrade-sweep.md`） |
| 变更记录 | `docs/tracking/changes/2026-09.md`（基线 #0001 纳入 1824 个文件）；最新编号用 `track.mjs --status` 查看 |
| 台账 | `docs/implementation-handoff.md`，1 325 173 B / 1773 行，**已冻结**（§8 第 3 条） |
| 第 180–182 批回归（2026-10-08） | 全量 JS `run-full-tests.mjs --js-only`：**11244/11230/14**，14 例既有失败（`installerSafety` 3 + `deobf-gate` 11，同 180 批基线失败集）；181/182 新增 7 例全过；`check-csp` PASS；受保护 `freeImageHostApi.js` MD5 未变 |

## 6. R01–R26 进度（精简版；原表在台账第 1499–1527 行）

> 125a–125e 共 99 件零依赖纯叶（`app` 13、`personReplacement` 12、`runninghubAiApp` 6、`panoramaSceneNode` 5、9 个目录 16、`src/modules` 直属 47），跨 R03/R04/R08/R09/R11/R12/R13/R14/R16/R17/R18/R19/R20/R22/R23/R24/R25；逐件清单见 §7.2 与对应专题，均未接线。
> 125f–125l 七期 OK 队列共落 69 件：`personReplacement` 13 归 R08；`app` 4 + `canvasCommands` 4 + `settings` 5 归 R03/R08/R17/R18/R22；素材包与语音族 7 件 + 画布保存事务 + 协作面板 2 件；任务中心与媒体缩略图族 10 件；
> 其余：图像输入与提示词族 10 件（R04/R08/R17/R22/R23）；分镜 3D 与交互族 10 件（`panoramaSceneNode` 4 归 R09、`interaction` 2 + `toolbarPendingResultNodes` + `segmentRetakeModelPolicy` 归 R22、`whiteboard` 1 归 R19、`workspaceCanvasMaterialization` 归 R11/R12）；`storyWorkspace` 3 件归 R06。专题见 `docs/src-modules-ok-batch125*.md`；均未接线。

| ID | 优先级与状态 | 范围 | 进展与主要缺口 |
| --- | --- | --- | --- |
| R01 | P0 待验收 | 测试、Python 环境、UI/存储/保存回归、真实联调 | 第 75–78 批改过 `main.js`，但从没在真实 Electron 上启动过；所有运行验收都还欠着 |
| R02 | P1 地基已补 | 桌面桥、IPC、preload、能力检查 | 第 30–42 批补了 `/api/v2/desktop/*` 82 条路由、能力操作层和 preload 三个能力组。缺：桥的 `web-preview/*` 5 条路由（`electron/ipc/webPreviewIpc.js` 只有 22 行，只转发旧 IPC）、`storage-migration/prepare` |
| R03 | P1 部分待验收 | 媒体任务中心、后台与跨画布调度、历史、恢复 | 第 16/20/24/25/54 批。缺：完整的持久队列、厂商查询与可靠取消、真正的后台跨画布调度。第 125e 批第 2 组补了任务中心状态归一与记录裁剪 2 件纯叶（`taskCenterModel`，未接线）；第 125g 批再补 `taskCommands`（任务结果定位与重试两条画布命令，未接线） |
| R04 | P1 部分待验收 | 分镜图片和视频生成、人物场景批量、镜头媒体关联 | 第 12–14/19 批。缺：其余模型、多图和首尾帧、参考输入批次、多外观和变体、远程落地、后台任务。第 125e/125j 批补媒体输入上限、提示词边界、自适应比例与参考缩略图；第 140–141 批补随机种子、比例源、源视频上传、图像执行 owner、表现层和生成显示策略；均未接线。**第 180 批修好 Agnes 图像（后端豁免）与视频（`/agnesapi` 轮询）两条在用生成链路**，见 §11 |
| R05 | P1 部分待验收 | 成片、时间线、剪映和 PR 导出 | 第 11/15/18/37 批。缺：剪映草稿 `draft_content.json`、Premiere 工程目录、多轨和字幕。第 141 批补媒体片段预览、时间线编辑与视口控制，未接线 |
| R06 | P2 待补全 | 工作室的其余差异：外观、变体、本地提取、批量、视频复刻 | 要按 0.7.16 的 `storyWorkspace`、`storyGeneration` 重新核对。第 119–123 批落了 `api/utils/` 剧本生成工具 4 件、`api/story-generation/` 32 件里的 23 件、`storyWorkspace` 24 件纯叶 + 10 件依赖已齐件；第 125l 批再落 `storyWorkspace` 3 件（画布媒体与片段帧双向对账、加入画布流程与待处理态、复刻代表帧提取）；均未接线 |
| R07 | P2 待补全 | 扫描 PDF、OCR、更多文档格式 | 还没有批次 |
| R08 | P2 待实现 | 人物检测、识别、替换、素材库 | 第 85 批落了替换工作室核心 9 件，第 125b 批再落 12 件零依赖纯叶，第 125f 批再落 13 件过闸门的 OK 件（共 33 件，均未接线）；剩余带相对 import 的件须先过导出闸门；后端接口缺失。第 125j 批再落 `characterAssets/characterAssetImageGeneration`（人设图生成载荷与 batchSize 守卫），未接线；第 138–139 批补语音动作、音频 workflow 输入与本地图像编辑动作，未接线 |
| R09 | P2 待实现 | 分镜 3D、导演相机、模型包、全景 | 第 86–93 批落了约 45/97 件；第 125c 批再落 `panoramaSceneNode` 5 件零依赖纯叶（共 50 件）；第 125k 批再落 4 件；134–136 批补 3D 工程状态、空间投影数学和渲染桥 3 件；主装配没落，均未接线 |
| R10 | P2 基础件已落地 | 多用户协作 | 124a–124h 共22件/483例，其中124a–f已推移植分支、124g–h未提交，均未接线；离线全绿不能视为协作功能验收；协作镜像的文件存在性 OK 件已全部落完，余 15 件受阻；NodeReference缺媒体导出，服务端及主装配未完成。第 125h 批再落邀请面板与成员列表面板 2 件（未接线） |
| R11 | P2 待实现 | 产品内置的 Canvas MCP | 第 125d 批落了 `canvasMcp` 2 件零依赖纯叶（自动连接调度、工具面构建与结果净化脱敏、模型目录分页），未接线；缺 MCP 服务本体与传输层装配 |
| R12 | P2 待实现 | Agent 会话、技能、能力发现、自定义 AI 应用、RunningHub 应用 | 第 31/32/40/42/94–115 批落了大量模块，端口 `src/modules/agent` 的 81 件只剩 1 件受阻，但**几乎全部没接线**。缺渲染器消费方和会话本体的装配。第 119/125c/137 批补 RunningHub 上传、应用与绑定；第 140 批补自定义 AI Logo；均未接线 |
| R13 | P2 待补全 | CLI 厂商、组件管理、自定义厂商发现 | 缺 `api/cliTextStream.js` 和 `api/cliProviderApi.js`，它们卡住了 `modelGenerationReadiness`。第 125e 批第 2 组补了 Agnes/MiniMAX 厂商档案（国内/国际双档）与 RunningHub 实例类型 3 件纯叶，未接线；**第 180 批把 Agnes 双档真正接进生成链路**（按选中/可用线路解析 provider），见 §11 |
| R14 | P2 部分待验收 | 工程包、恢复快照、外部打开、存储迁移 | 第 17/21–29/38 批。缺：旧绝对素材引用的转换、系统文件关联、保存后重开的验收。第 125e 批第 4 组再落 `workspacePersistenceCoordinator`（工作区自动保存协调器）1 件纯叶，未接线 |
| R15 | P2 待实现 | 内嵌浏览器节点、Chrome 工作进程、预览生命周期 | 第 55–73 批基本落了运行时本体和渲染器半边，但 **`chromeShellRuntime` 的最终装配没做**，第 56–69 批的模块在生产代码里零引用 |
| R16 | P2 部分待验收 | ASR、转写、说话人分离、配音、视频转 GIF | 第 43–53 批，多数已接进媒体任务队列；没有真机验证。第 125e 批第 1 组再落 5 件零依赖纯叶（面板打开事件常量、分析段归一、分析会话、确认弹窗、片段编辑会话）；第 125h 批再落 7 件（运行时装机与修复、任务进度跟踪、生成完成反馈、参考音频选段会话、段落状态与历史、试听播放会话、翻译）；第 139 批补音频 workflow 参考槽，均未接线 |
| R17 | P2 部分待验收 | 全局截图、划词、剪贴板、文本预设、通知 | 第 34–36/41/68–71 批，文本预设捕获链已装配完成，欠运行验收。`selection-hook` 是 native 依赖，需要单独授权。第 125g/125j 批补截图反推、通知同步和提示词虚拟化；第 140 批补 mention 菜单，均未接线 |
| R18 | P2 部分待验收 | 节点批量导出、输出命名、素材清理、资产索引、对象存储 | 第 10/83 批；远程和多结果导出、对象存储待核对。第 125e 批第 5 组再落 `materialLibraryPolicy`（素材库归属与上限策略）1 件纯叶；第 125g 批再落 `nodeExportCommands`（节点批量导出画布命令）、`localAssetCleanupList`（素材清理列表呈现）与 `downloadNamingSettings`（下载命名设置）；第 125h 批再落 `assetPackageMedia`（素材包图片/音频节点构建）、`canvasProjectSaveTransaction`（画布工程保存事务）；均未接线 |
| R19 | P2 待补全 | 白板高级图层 | 第 125d 批落白板几何/数据 4 件，第 125e 批补分组和剪贴板底座，第 125k 批补背景预览，第 140 批补画布标注表面；均未接线；缺画布渲染与交互装配 |
| R20 | P2 待补全 | ComfyUI WebSocket 进度、更多参数、云协议 | 还没有批次 |
| R21 | P2 待补全 | 队列副本管理、旧键、损坏记录恢复 | 还没有批次 |
| R22 | P3 待实现 | 交互、节点管理、快捷操作、预设、教程、标注、视频重拍等 | 第 73/74/82 批落原语和无头内核；125d/125e/125g/125j/125k 落多组纯叶；133–141 批补节点编辑、选择快速路径、视频 GIF、图像编辑、提示词动画、视频底栏、时间线与标注表面等；均未接线 |
| R23 | P3 待实现 | 新 manifest、参数表单、报价、播放、性能 | 第 81/84 批落渲染器性能前置件；`rendererPanPreviewReconcile` 受阻。第 125j 批图像高清菜单受本仓清单无 `extensions.imageHdMenu` 限制。133–141 批补视口、绘制、回压、虚拟化、媒体槽、播放反馈、参数组、错误卡、悬停生命周期、可见性签名与比例来源等，未接线 |
| R24 | P3 部分完成 | 安全、诊断、启动恢复、存储路径、样式、i18n | 第 23/75–80 批，其中第 75–78 批真实接线了 `main.js`。第 71 批统计时，`styles/variables.css` 还缺 44 个 0.7.16 的 CSS 变量。第 125e 批第 3 组补了工作区表现层生命周期（切页时暂停/恢复媒体与动画）与保存状态提示条 2 件纯叶（未接线）；第 125e 批第 4 组再补 `workspaceAssetSettingsShell`（素材设置页骨架与分隔比归一）1 件纯叶（未接线） |
| R25 | P3 待实现 | native/runtime 打包、更新、发布 | 还没有批次；不得自动升级或发布 |
| R26 | 独立 | `admin-console-requirements.md` 等已有规划 | 先核对是否属于本次范围 |

## 7. 下一步队列

### 7.1 第 121 批（已完成）

- 121a–121c 已交付（`api/story-generation/` 32 件落 23 件，全部未接线），细节见 `docs/api-story-generation-batch121.md`；余 9 件待 `src/domain/storyGeneration/*` 就位（同 §7.3，单独成批、用户授权），不要硬上。

### 7.2 之后的纯新增队列

1. **全仓移植欠账（第 142 批复算，替代第 127 批口径）**：原未落地 **771 件，现已清零** —— 镜像范围（`api/ src/ vendor/ main.js`）**1754 件非测试模块在仓库 0 缺失**，首波 326 件重跑闸门 **`MISSING_TOTAL=0`**，原 66 件受阻件随既有件升代一并解阻；循环 0、断链 0、解析失败 0。**真正的剩余是接线**：可达性重算 scope 1992 / 可达 1791 / **孤立 201**。接线方案见 `docs/porting-closure-and-wiring-plan.md`。
   - 已落（第 119–125l 批共 168 件）：`api/story-generation/` 23、`storyWorkspace` 27、`collaboration` 24、`app` 13、`personReplacement` 25、`runninghubAiApp` 6、`panoramaSceneNode` 9、9 个目录 16、`src/modules` 直属 47、OK 队列 69（13/13/10/10/10/10/3）；逐件清单见 §6 引言与各期专题，均未接线。
   - 旧「OK 队列可落件余 0」只是 `src/modules` **直属**一层的清零（125l 达成），不代表全仓无件可落；现行队列一律以 §7.6 为准。
2. **下一段队列**：继续按首波推进（`src/components` 11 → `src/manifests` 20），沿用 §4 单批工序；第 128–141 批专题按 `src-modules-batch128.md`、`src-core-batch133.md`、`src-components-batch137.md` 及后续编号。130 批发现 `core/math.js` 死循环缺陷，修复须单独授权。
3. **66 件受阻件**单独成批解阻（35 个普通文件补导出；5 个受保护装配件须先经用户授权），见 §7.6。
4. `vendor/mediapipe` 2 件（322 KB 级 wasm 加载器）体积大但无依赖，可随任意批落地。

### 7.3 受阻项

这些不要硬上。解阻需要单独成批升代，并且要用户授权、真机验证。

| 模块 | 卡在哪里 |
| --- | --- |
| `src/services/providerConnectionAutoVerification.js` | 缺 `api/configApi.js :: getApiConfigSnapshot`，需要升代受保护的 `configApi.js` |
| `src/services/initialThemeBootstrap.js` | 缺 `storeRuntimeEffectsService.js :: applyStoredThemeToDom` |
| `modelGenerationReadiness.js` | 缺 `api/cliTextStream.js` → `api/cliProviderApi.js` |
| `modelCredentialUi.js`（连带 `storyModelCredentialGuard.js`） | 缺 7 件依赖，需要升代 `nodeFooterControls.js` 和 `agentModelSettings.js` |
| `agentModelControls.js`（`src/modules/agent` 最后 1 件受阻） | 压着 5 个缺失件，以及 6 个世代分叉的受保护装配件 |
| `src/core/rendererPanPreviewReconcile.js` | 在用的 `rendererVirtualization.js` 缺 `resolveRendererVirtualizationTier` 和 `resolveRendererLowZoomMountLimit` |
| 节点管理面板装配 | `canvasMediaLocalService.js` 的 28 个消费方世代分叉 |
| `directorMultiView` / `directorViewportRuntime` | 导出面受阻（第 91 批记录） |
| `storyWorkspace` 的 `storyEpisodeCanvas`、`storyReplicationCardMotion`、`storyReplicationPortraitController`、`storyWorkspaceDeveloperDiagnostics` | 在用的 `core/generationResultRenderer.js`、`core/math.js`、`services/diagnosticsService.js` 缺对应导出（第 123 批闸门，见 `docs/src-storyworkspace-batch123.md` §1） |
| 125h/125i/125j 批实测受阻件（41 件，已并入第 127 批口径） | 均为依赖件缺具名导出，全部归因见 §7.6 |

### 7.4 接线欠账（总目标要求「实际接入」）

- 第 126 批实测：**483 个孤立模块 / 1238 个非测试 JS 模块**（断链 0；旧的「434/447」是增量估算，已废弃）。其中**在用触达 > 0 的 130 件**（引用了在用代码、通常是从在用文件抽出来的），**孤岛 353 件**（接线等于新建整块装配）。大块有：
  - R15 chrome-shell 运行时：`chromeShellRuntime` 没装配。
  - R12 Agent 扩展层：`src/modules/agent` 的 80 个模块只有 13 个接进了运行时。
  - R09 分镜 3D：约 43 件。
  - R22 节点管理和快捷键原语。
  - R23 渲染器性能件。
  - R08 替换工作室核心。
- 接线会改变在用代码的行为，所以必须单独成批、写清行为差异，并在用户授权后真机验收。
- 接线候选（第 119/125j/127/128 批）：① `api/imageUploadApi.js` 自带 RunningHub 上传响应解析私有副本（失败码判定与端口不同）；② `src/modules/nodePromptShared.js` 自带 `getAssetMentionRefFromPillNode`、`getAssetInputRefsFromPromptHtml`、`getPromptAssetInputRefsFromNode` 等私有副本（125j 的抽取源）；③ `modelProviderProfileSelection.js` 的 `getModelProviderProfileIds` 与 128 的 `modelProviderProfiles` 不是同一函数；④ 127 批归因的 40 个「旧世代」文件本身就是升代目标。
- 第 125j 批发现的接线候选：`src/modules/nodePromptShared.js` 自带 `getAssetMentionRefFromPillNode`、`getAssetInputRefsFromPromptHtml`、`getPromptAssetInputRefsFromNode`、`getAssetInputRefsFromNodeData`、`getAssetInputRefsFromPromptAndNode` 的私有副本，本批 `promptAssetInputRefs` 正是从它抽出来的；组件侧还有 6 处同名局部调用。要先逐条比对行为差异，不能整块替换。
- 第 126 批接线分批建议（风险从低到高）：① `src/hooks/` 4 件 + `src/core/stores/index.js`；② `src/modules/canvasCommands/` 4 件；③ `storyboard3d` 触达 >0 的 9 件；④ `agent` 触达 >0 的 19 件；⑤ 其余 353 个孤岛须连同外部装配一起设计。明细见 `docs/b126-reachability.md` §5。
- 建议用户授权运行应用后，先接「消费方已存在、依赖已闭合」的。例如把第 74 批的 3 个键盘原语接进 `shortcuts.js` 和 `keyboardService.js`，每接一处就真机验证一处。

### 7.5 运行验收欠账（台账 §7）

- 离线 JS 单测以外的都还没验过，包括：
  - Python 适配测试：先找到可用的解释器，裸 `python` 曾经不可用。
  - UI，以及工程保存后重开。
  - 浏览器存储、真实 DOCX/PDF 文件、ComfyUI 真实连接、多厂商真实调用。
  - 真实启动 Electron。
- 这些都需要用户授权，有的会产生费用。

### 7.6 全仓移植欠账（第 127 批实测）

- **原始未落地 771**（镜像 1767 − 仓库 1212）；**第 142 批复算：已清零**。镜像范围 1754 件非测试模块在仓库全部存在；首波 326 件闸门 `MISSING_TOTAL=0`；波次清单（第 1 波 326、第 2–18 波 445）已无未落地件可用；循环 0、真断链 0、解析失败 0。
- 首波 326 件跑 `b123-gate.mjs`：**通过 260 / 受阻 66**，DEP-FAIL 为 0。
- 受阻根因统一：被依赖的**仓库文件是旧世代**，共缺 **105 个具名导出**（40 个文件），而这 105 个在 0.7.16 镜像里**全部存在** → 解阻手段是**升代既有件**，不是新写实现。
- 其中 5 个是 §2.3 受保护装配件：`api/configApi.js`（5）、`src/manifests/index.js`（1）、`src/components/shared/nodeFooterControls.js`（1）、`src/core/rendererVirtualization.js`（3）、`src/services/storeRuntimeEffectsService.js`（1）→ **升代须先经用户授权**；其余 35 个普通文件可照常补导出。
- 缺导出最多的普通文件：`canvasMediaLocalService.js`（10）、`video-node/parameterPanelModelHelpers.js`（9）、`manifests/shared/runningHubImageManifestShared.js`（8）、`core/math.js`（8）、`settings/panelSettings.js`（7）、`core/rendererNodePresentation.js`（6）。
- 清单与重算命令见 `docs/b127-porting-backlog.md`；证据在 `deobf-tools/b127/`。
- **⚠ 第 165 批修正上表口径**：以上「已清零」只在**文件是否存在**层成立。token 多重集比对量出实际内容距离——仓库对 0.7.16 **1149 件不符**、对 0.8.0（现行标尺）**1261 件不符 + 184 件缺失**。「解阻 = 升代既有件」这 105 个导出仍成立，但升代源须按 **0.8.0** 选，不是 0.7.16。

## 8. 已知风险与坑

1. **热更新会清掉未提交的修改。**
   - `backend/services/hot_update_service.py` 的 `apply_hot_update` 执行 `git fetch <remote> master`，然后 `git reset --hard FETCH_HEAD`。
   - 触发方式是点更新横幅：`src/modules/AutoUpdate.js` 的 `_doApply` → `POST /api/v2/update/apply`，没有二次确认。
   - 现在因为缺 `双击运行.bat` 而不会生效。
   - 建议加上「工作区不干净就拒绝」的保护，但要先经用户同意再改。
   - 本次仅推移植分支，origin/master 仍旧；即使工作树干净，热更新的 reset 也可能把本地 master 回退到旧版本。不要点击更新横幅。
2. **提交与推送已完成（2026-09-25）**：第 1–123b 批的内容全部入库，共 28 条 `A.0:` 提交，`master` 与 `port/batches-1-122a` 都已推送。
   - 推 master 是用户在「只推分支」与「同时推 master」之间选定的；两轮都选了推 master，后果两次都当面说明过：`.github/workflows/mac-arm64-build.yml` 会因此构建，并在 tag `v0.4.12` 已存在时执行 `gh release upload --clobber`，覆盖现有 macOS 资产。
   - 构建是否真的触发、是否成功，本机 `gh` 不可用，**两轮都未核实**。这个后果可能已经发生，不要假设 v0.4.12 的资产还是原样。
   - 后续 agent 仍不得自行提交或推送；2026-09-28 本次仅推移植分支，不能沿用 9 月 25 日的 master 发布授权。工作树干净也不等于热更新安全，见本节第 1 项。
  - 该移植分支已于 2026-09-28 经用户授权删除（本地 + origin，见 §5），此后只有 master 一条线；需要历史落点时从 master 的 3c3b3ae 回溯即可。
3. **台账已冻结。**
   - `docs/implementation-handoff.md` 超过 1 MiB，`read_files` 和 `search_files` 都拒读，`apply_patch` 也改不了它。
   - 它保留为历史档案：R01–R26 原表在第 1499–1527 行，第 119 批预筛在第 1755 行。只能用 `run_command` 加 `Select-String` 只读查询。
   - 新记录一律写到本文件、`docs/tracking/batches.md` 和专题文档里。
4. **`docs/next-session-prompt.md` 已过时**：15 万字符，很多行超过 3000 字符会被截断，「下次继续做什么」还停在第 70 批。只作历史参考。
5. **测试基线里的失败是已知的。**
   - src 的 43 项与 b85 名单一致，包含缺失夹具及视频参数断言等旧失败，不能全归因为缺少 `tests/testPreviewDom.js`。
   - electron 的 1 项是 R14 第 17 批的遗留。
   - 不要伪造夹具去「修」它们。
6. **导出闸门**：`deps-ast` 的 OK 只看依赖文件在不在，不看具名导出；第 116 批就因此撤回过一件。闸门也只核对名字：第 123 批发现本仓 `videoFrameCapture`（不认 crop）和 `modelRegistry`（id 解析方式）与 0.7.16 有世代差异，接线前要先处理。
7. **git 条目折叠**：新建目录里的多个未跟踪文件，在 porcelain 输出里只算 1 条（第 114 批发现），不能靠条目增量判断文件有没有落地。
8. **反混淆残留**：
   - 局部变量名仍是 `_0x…`，读代码时别被误导。
   - 约 13 个文件有超长单行（内联 SVG/HTML），MCP 读取会截断，改这些行之前要精确重读。
9. **其他小坑**：
   - 桌面模式下 Python 带 token，用浏览器直接打开桌面端口会返回 403，这是正常的。
   - `playwright.config.js` 指向不存在的 `e2e/` 和 `tools/`。
   - `package.json` 里没有 test 脚本。
   - 用 `run_command` 给 `track.mjs --note` 传说明时，文字里不能再嵌套英文双引号：PowerShell 会把参数截断，脚本报「未知参数」且不记录。要引用就用「」。
10. **许可**：CanvasPro 采用非商业源码许可加商业授权。从 0.7.16 移植来的代码只适合个人非商业使用，商业用途要先核对作者的条款。

## 9. 收工协议（每批做完，或对话要结束时）

1. 更新本文件：
   - 顶部的「最后更新」和状态；
   - §0 的进度；
   - §5 的快照（git_status、sweep 数字）；
   - §6 受影响的 R 行，一句话即可；
   - §7：删掉已完成的，写明下一批；
   - §11：追加一条日志，不超过 5 行。
2. 在 `docs/tracking/batches.md` 的表尾追加一行。
3. 细节只写进专题文档，本文件只放结论和指针。
4. **体积自检**：本文件不超过 45 KB，单行不超过 400 字。超了就把 §11 最旧的日志挪到 `docs/tracking/log-archive.md`，该文件不存在就新建。
5. 对话中途被打断时，至少在 §11 写一行：做到哪一步、哪些文件已经落地、哪些还没核对。
6. 不写 MCP 地址、会话 ID 和密钥；表格行内不用裸 `|`。
7. **最后登记变更（当前暂停）**：不要运行 `node tools/tracking/track.mjs --by agent --note`；跟踪机制恢复前，收工只完成常规开发收尾。

## 10. 项目地图（找代码用）

- **运行**：
  - `npm run web` 启动 `server.py`，监听 127.0.0.1:8777。
  - `npm run desktop` 启动 Electron（端口 8778），会拉起或复用 Python 进程，并注入随机的 `AIC_LOCAL_TOKEN`。
- **前端**：
  - 入口是 `index.html` 和 `main.js`。`main.js` 注册 23 种节点，并装配各层。
  - `src/core`：renderer、interaction、stores、generationTaskRuntime。
  - `src/modules`：功能模块；`src/components`：节点组件。
  - `src/manifests`：模型声明；`src/i18n`：多语言。
- **状态**：`src/core/stores/legacyKernelStore.js` 经 `facadeStore.js` 拆成 graphStore、uiStore、workspaceStore。撤销在 `src/modules/history.js`，基于快照，最多 50 步。
- **生成链路**：节点 → manifests → `api/ai*Api.js` 和 `api/adapters/*` → `api/requester.js` → Python `/api/v2/proxy/*` → `src/core/generationTaskRuntime.js`（提交、轮询、取消、恢复）。
- **Agent**：
  - 核心在 `src/modules/agent/` 下的 agentRuntime、agentContextBuilder、agentPlanValidator、agentPanel，以及 `api/agentApi.js`。
  - 画布命令总线在 `src/modules/canvasCommands/*`，分 node、graph、layout、viewport、generation 几类；`generation.run` 需要用户确认。
- **桌面**：
  - `electron/main.js` → `electron/mainIpcSetup.js` 和 `electron/ipc/*` → `electron/preload.cjs`，对外暴露 `window.electronAPI`，共 84 个 invoke 通道。
  - 媒体任务：`electron/mediaTaskQueue.js` 和 `electron/mediaTasks/*`。
  - 桌面 HTTP 桥：`electron/desktopHttpBridge.js`，目前休眠。
- **后端**：`server.py`（标准库 http.server）→ `backend/services/http_route_dispatcher.py` → 各个 `*_route_service.py`。
- **工程与保存**：`src/modules/CanvasTabManager.js`、`src/modules/app/projectLifecycle.js`、`src/services/projectService.js`、`src/services/desktopProjectService.js`、`electron/projectPackageService.js`。
- **更细的说明**见 `docs/tracking/project-map.md`：进程关系、节点系统、持久化、Electron、Python 路由与安全模型，以及「按需求找代码」表。

## 11. 会话日志（最新在上；挤出的最旧条目移入 `docs/tracking/log-archive.md`）

- 2026-10-09（183 批·**管理后台接入客户端 + 换牌残留修复**）：① `tutorialCatalog.js:1` 的 `CONTENT_ORIGIN` 仍是旧域名 `https://api.ashuoai.com`（教程拉不到）→ `https://api.1e1e.cn`，可由后台 `content_sources.tutorialOrigin` 覆盖。② `subscription_client.py` 新增 `normalize_structured_config()`，解析后台 10 个结构化命名空间。③ 新增 `admin_content_gateway.py` + `/api/v2/admin-content/*` + `api/adminContentApi.js`：公告/更新/目录/推广位/门禁/工单/优惠码/事件，TTL 缓存 + 离线降级 + 脏数据裁剪。④ 新增 `brandIdentity.js` + `clientConfigStore.js`；`http_route_dispatcher` 加 `contact_overrides_getter`，后台 brand/contact 优先于硬编码。⑤ `set_remote_subscription_gates()`：后台门禁为权威来源，本地 manifest 退化兜底（FR-2.3）。**验证**：JS **11275/11261/14**（既有失败同前）；后端 219；两门禁 PASS。

## 12. 变更记录机制（**已冻结**）

- **已暂停**，除非用户明确要求恢复不得执行。实际记账改用 §11+ `docs/tracking/batches.md`（人工批次制）。
- 原机制：`.vscode/tasks.json` 拉起 `tools/tracking/track.mjs --watch` 监视改动并写入
  `docs/tracking/changes/<年-月>.md`（只追加、超 400 KB 自动分卷）；也可用 `--by agent --note "…"` 手工登记。
- 快照/锁在 `docs/tracking/state/`（只在本机、不进 git）。`--status` 看状态，`--dry-run` 只看差异。
