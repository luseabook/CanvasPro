# CanvasPro 跟踪文档（新对话唯一入口）

> **新对话只读这一份就能接手，不要通读项目。** 本文件体积 ≤45 KB、单行 ≤400 字，一次 `read_files` 就能读完。
> 入口链：用户只需说「读一下项目文档」→ `README.md` 顶部或 `AGENTS.md` → 本文件。所有文件改动都会自动记录（§12）。
> 最后更新：2026-09-25 · 状态：第 122 批分三段，122a 已交付（**122b 未开始，§7.2**）；第 1–122a 批的未提交工作已按功能目录分 18 条提交入库，**未推送** · 维护规则见 §9。

## 0. 现状速览

- **项目**：`F:\CanvasPro` 是 AI CanvasPro 0.4.12 的源码，技术栈为原生 ESM 前端、Python `server.py`、可选 Electron。结构见 §10，细节见 `docs/tracking/project-map.md`。
- **总目标**（用户原话要点）：对照已安装的 0.7.16（`D:\shuocancas\SHUO Canvas\resources\webapp`），把缺失功能的**可维护源码加进来，并实际接入工程**。
  - R01–R26 全范围不缩减；单批交付只是检查点。
  - 直接实施，不要只分析，也不要每批再问是否开发。
- **进度**：已交付 121 批，第 122 批已交付 122a 段，逐批索引见 `docs/tracking/batches.md`。R01–R26 **都没有完成**（§6）。
- **必须清楚的偏差**：第 84–122a 批几乎都是「落地不接线」，即模块和单测进了仓库，但从入口走不到。
  - 静态分析显示，996 个非测试 JS 模块里有 **234 个从任何入口都不可达**（含第 122a 批新增的 11 个），清单见 `docs/tracking/orphans.md`。
  - 总目标要求「实际接入」，所以接线欠账（§7.4）迟早要还。
- **下一步**：122b（`storyEpisodeSplitBatchExecution`、`storyWorkspacePersistence`、`storySummaryRun`、`storyScriptImport`、`storyStyleCatalog`、`storyWorkspaceData`），再做 122c。分段见 `docs/src-storyworkspace-batch122.md` §1。
- **变更记录**：全自动。任何人改了任何项目文件，都会被记到 `docs/tracking/changes/`，机制见 §12。

## 1. 开工流程（新对话照做）

用户开新对话时通常只说一句「读一下项目文档」（MCP 会话会另外给连接地址）。`README.md` 顶部和 `AGENTS.md` 会把你带到这里。接下来照做，不需要用户再介入。

1. 连接 MCP，方法见 §3.1。连接地址由用户私下提供，**不要写进仓库**。
2. **补记会话外改动**：运行 `node tools/tracking/track.mjs --by session-start`。然后读 `docs/tracking/changes/` 里最新那个文件的末尾几条，了解上次以来发生了什么（机制见 §12）。
3. 调 `git_status`，和 §5 的快照对比。对不上时先查明原因（第 2 步的记录里通常就有，可能是用户手动改过），不要覆盖。
4. 读本文件的 §2、§4、§7；另外只读本批涉及的专题文档（§7 里给了路径）。**不要通读项目。**
5. 授权以 §1.1 为准，**不要再问用户**；只有超出 §1.1 的事才需要先问。
6. 按 §4 的单批工序做 §7 的第一项。每做完一批，立刻按 §9 收工（包括登记变更），然后再做下一批。

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
11. **改动必须留痕**：每完成一项改动都要运行 `track.mjs --by agent --note`（§12）。不得修改或删除 `docs/tracking/changes/` 里已有的记录，不得手改 `docs/tracking/state/`，不得停用自动监视。

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
# src 回归 sweep（基线 3624 / 3581 / 43）
node --test --test-timeout=25000 (Get-ChildItem src -Recurse -Filter *.test.js).FullName
# api 回归（基线 791 / 791 / 0）
node --test (Get-ChildItem api -Recurse -Filter *.test.js).FullName
# 本机 Node 24 默认 spec 输出，没有 "# pass" 行；要数用例时在 --test 后加 --test-reporter=tap
# electron 回归（基线 1649 / 1648 / 1；只在改了 electron 时跑）
node --test --test-timeout=25000 (Get-ChildItem electron -Recurse -Filter *.test.js).FullName
# 受保护文件校验（应为 1E0458013F5341C99F21FAEFC1D34D3F）
(Get-FileHash api\freeImageHostApi.js -Algorithm MD5).Hash
# 暂存文件与仓库文件逐字节比对
(Get-FileHash <暂存文件>).Hash -eq (Get-FileHash <仓库文件>).Hash
# 只读查询冻结的超大台账
Select-String -Path docs\implementation-handoff.md -Pattern '第119批' -Encoding UTF8
# 变更记录（§12）：开工补记、登记改动、查看状态
node tools/tracking/track.mjs --by session-start
node tools/tracking/track.mjs --by agent --note "第119批：落地 api/utils 等 7 件并补测试"
node tools/tracking/track.mjs --status
```

## 4. 单批工序（沿用第 100–118 批的做法）

1. **选件**：取 §7 队列的第一项。
   - 纯叶（0 条相对 import）可以直接排期。
   - 带相对 import 的，先用 `verify-exports.mjs` 核验每个具名导入在本仓真实存在。原因是 `deps-ast` 的 OK 只看依赖文件在不在，第 116 批因此出现过 25% 的假阳性。
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
6. **反查消费方**：在 `api`、`src`、`electron`、`main.js`、`renderer.js` 里 grep 模块名。
   - 0 命中就记为「落地不接线」。
   - 如果本仓有真实消费方且依赖闭合，可以接线（参考第 75–78 批），但要写清行为差异，并注明「需真机验收」。
7. **收尾核对**：受保护文件 MD5 不变；记下 git_status 前后的数字。
8. **记录**：
   - 写专题文档 `docs/<主题>.md`，结构参照 `docs/services-image-preview-and-video-frame.md`：落地清单、冻结的端口行为、检查结果表、未执行项与边界、下一批口径。
   - 然后按 §9 更新本文件和 `docs/tracking/batches.md`。

## 5. 仓库快照（2026-09-25）

| 项 | 值 |
| --- | --- |
| 分支 | master，本地领先 `origin/master` 18 个提交（`A.0:` 系列），**未推送**；`origin/master` 仍为 `e12ecd1` |
| git_status | 0 staged / 0 unstaged / 0 untracked / 0 冲突（2026-09-25 07:30 收工核对，工作区干净）。此前未提交的 956 个文件已全部入库 |
| 提交情况 | 经用户授权的分组提交已完成：第 1–121 批的 956 件按功能目录切成 17 条（逐批归属试过但不可靠，覆盖率仅 49.9%、91.6% 的文件被多批互相认领，故降级按目录分组），第 122a 批 27 件单独 1 条。`api/freeImageHostApi.js` 未被任何提交触及，MD5 不变。agent 不 push |
| src sweep | 3624 / 3581 / 43（第 122a 批 +37）。43 项失败都是因为缺夹具 `tests/testPreviewDom.js` |
| api sweep | 791 / 791 / 0（第 121c 批 +34） |
| electron sweep | 1649 / 1648 / 1。那 1 项是 R14 第 17 批的遗留 |
| 静态检查 | 1390 个 JS 文件 `node --check` 全部通过；所有 Python 文件都能 `ast.parse`。这是 2026-09-25 在本地镜像上做的离线检查；第 119、120、121、122a 批新增的 14、20、26、22 个 JS 文件也都通过 |
| 孤立模块 | 234 / 996，见 `docs/tracking/orphans.md` |
| 变更记录 | `docs/tracking/changes/2026-09.md`，基线 #0001 纳入 1824 个文件；最新编号用 `node tools/tracking/track.mjs --status` 查看 |
| 台账 | `docs/implementation-handoff.md`，1 325 173 B / 1773 行，**已冻结**（§8 第 3 条） |

## 6. R01–R26 进度（精简版；原表在台账第 1499–1527 行）

| ID | 优先级与状态 | 范围 | 进展与主要缺口 |
| --- | --- | --- | --- |
| R01 | P0 待验收 | 测试、Python 环境、UI/存储/保存回归、真实联调 | 第 75–78 批改过 `main.js`，但从没在真实 Electron 上启动过；所有运行验收都还欠着 |
| R02 | P1 地基已补 | 桌面桥、IPC、preload、能力检查 | 第 30–42 批补了 `/api/v2/desktop/*` 82 条路由、能力操作层和 preload 三个能力组。缺：桥的 `web-preview/*` 5 条路由（`electron/ipc/webPreviewIpc.js` 只有 22 行，只转发旧 IPC）、`storage-migration/prepare` |
| R03 | P1 部分待验收 | 媒体任务中心、后台与跨画布调度、历史、恢复 | 第 16/20/24/25/54 批。缺：完整的持久队列、厂商查询与可靠取消、真正的后台跨画布调度 |
| R04 | P1 部分待验收 | 分镜图片和视频生成、人物场景批量、镜头媒体关联 | 第 12–14/19 批。缺：其余模型、多图和首尾帧、参考输入批次、多外观和变体、远程落地、后台任务 |
| R05 | P1 部分待验收 | 成片、时间线、剪映和 PR 导出 | 第 11/15/18/37 批。缺：剪映草稿 `draft_content.json`、Premiere 工程目录、多轨和字幕 |
| R06 | P2 待补全 | 工作室的其余差异：外观、变体、本地提取、批量、视频复刻 | 要按 0.7.16 的 `storyWorkspace`、`storyGeneration` 重新核对。§7.1 的 `api/story-generation/` 和 §7.2 的 `src/modules/storyWorkspace` 纯叶属于这一项。第 119 批落了 `api/utils/` 剧本生成工具 4 件，第 120、121 批落了 `api/story-generation/` 32 件中的 23 件，第 122a 批落了 `storyWorkspace` 纯叶 24 件中的 11 件（均未接线） |
| R07 | P2 待补全 | 扫描 PDF、OCR、更多文档格式 | 还没有批次 |
| R08 | P2 待实现 | 人物检测、识别、替换、素材库 | 第 85 批落了替换工作室核心 9 件（未接线）；`personReplacement` 还有 12 个纯叶没落；后端接口缺失 |
| R09 | P2 待实现 | 分镜 3D、导演相机、模型包、全景 | 第 86–93 批落了约 45/97 件（未接线）；主装配（依赖 three.js 的 `workspaceController`、`sceneRuntime` 等）没落 |
| R10 | P2 待实现 | 多用户协作 | 还没有批次；`collaboration` 有 13 个纯叶待落；需要先做服务端设计 |
| R11 | P2 待实现 | 产品内置的 Canvas MCP | 还没有批次 |
| R12 | P2 待实现 | Agent 会话、技能、能力发现、自定义 AI 应用、RunningHub 应用 | 第 31/32/40/42/94–115 批落了大量模块，端口 `src/modules/agent` 的 81 件只剩 1 件受阻，但**几乎全部没接线**。缺渲染器消费方和会话本体的装配。第 119 批补了 RunningHub 上传响应、轮询策略、上传错误 3 件（未接线） |
| R13 | P2 待补全 | CLI 厂商、组件管理、自定义厂商发现 | 缺 `api/cliTextStream.js` 和 `api/cliProviderApi.js`，它们卡住了 `modelGenerationReadiness` |
| R14 | P2 部分待验收 | 工程包、恢复快照、外部打开、存储迁移 | 第 17/21–29/38 批。缺：旧绝对素材引用的转换、系统文件关联、保存后重开的验收 |
| R15 | P2 待实现 | 内嵌浏览器节点、Chrome 工作进程、预览生命周期 | 第 55–73 批基本落了运行时本体和渲染器半边，但 **`chromeShellRuntime` 的最终装配没做**，第 56–69 批的模块在生产代码里零引用 |
| R16 | P2 部分待验收 | ASR、转写、说话人分离、配音、视频转 GIF | 第 43–53 批，多数已接进媒体任务队列；没有真机验证 |
| R17 | P2 部分待验收 | 全局截图、划词、剪贴板、文本预设、通知 | 第 34–36/41/68–71 批，文本预设捕获链已装配完成，欠运行验收。`selection-hook` 是 native 依赖，需要单独授权 |
| R18 | P2 部分待验收 | 节点批量导出、输出命名、素材清理、资产索引、对象存储 | 第 10/83 批；远程和多结果导出、对象存储待核对 |
| R19 | P2 待补全 | 白板高级图层 | 还没有批次 |
| R20 | P2 待补全 | ComfyUI WebSocket 进度、更多参数、云协议 | 还没有批次 |
| R21 | P2 待补全 | 队列副本管理、旧键、损坏记录恢复 | 还没有批次 |
| R22 | P3 待实现 | 交互、节点管理、快捷操作、预设、教程、标注、视频重拍等 | 第 73/74/82 批落了原语和无头内核（未接线） |
| R23 | P3 待实现 | 新 manifest、参数表单、报价、播放、性能 | 第 81/84 批落了渲染器性能前置件（未接线）；`rendererPanPreviewReconcile` 受阻 |
| R24 | P3 部分完成 | 安全、诊断、启动恢复、存储路径、样式、i18n | 第 23/75–80 批，其中第 75–78 批真实接线了 `main.js`。第 71 批统计时，`styles/variables.css` 还缺 44 个 0.7.16 的 CSS 变量 |
| R25 | P3 待实现 | native/runtime 打包、更新、发布 | 还没有批次；不得自动升级或发布 |
| R26 | 独立 | `admin-console-requirements.md` 等已有规划 | 先核对是否属于本次范围 |

## 7. 下一步队列

### 7.1 第 121 批（已完成）

- 121a / 121b / 121c 三段都已交付：`api/story-generation/` 32 件已落 23 件（第 120 批 10、121a 8、121b 3、121c 2），全部未接线。细节见 `docs/api-story-generation-batch121.md`。
- 其余 9 件依赖本仓没有的 `src/domain/storyGeneration/*` 或 `api/storyGenerationApi.js`，要等这些依赖就位（同 §7.3，单独成批、用户授权），不要硬上。
- 下一批转 §7.2。api sweep 基线现为 791/791/0。

### 7.2 之后的纯新增队列

1. **`src/modules` 的 136 个纯叶**，按能力区成组落地：`storyWorkspace` 24（第 122 批进行中：122a 已落 11 件，122b 6 件、122c 7 件待做）、`collaboration` 13、`app` 13、`personReplacement` 12、`runninghubAiApp` 6、`panoramaSceneNode` 5 等。完整清单在 `deobf-tools\b119\screen.txt`。
2. **`api/` 的其余纯叶**：34 件（原 41 件，第 119 批已落 7 件）。
3. **`src/services`**：零依赖纯叶已经清零，剩下的都带相对 import，必须先过导出闸门。

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

### 7.4 接线欠账（总目标要求「实际接入」）

- 共 234 个孤立模块。大块有：
  - R15 chrome-shell 运行时：`chromeShellRuntime` 没装配。
  - R12 Agent 扩展层：`src/modules/agent` 的 80 个模块只有 13 个接进了运行时。
  - R09 分镜 3D：约 43 件。
  - R22 节点管理和快捷键原语。
  - R23 渲染器性能件。
  - R08 替换工作室核心。
- 接线会改变在用代码的行为，所以必须单独成批、写清行为差异，并在用户授权后真机验收。
- 第 119 批发现的接线候选：`api/imageUploadApi.js` 有 RunningHub 上传响应解析的私有副本，可改为 import `api/runningHubUploadResponse.js`；但两边失败码判定不同（本仓 `code: 200` 会抛错，端口视为成功），差异见 `docs/api-request-response-utils.md` §4。
- 建议用户授权运行应用后，先接「消费方已存在、依赖已闭合」的。例如把第 74 批的 3 个键盘原语接进 `shortcuts.js` 和 `keyboardService.js`，每接一处就真机验证一处。

### 7.5 运行验收欠账（台账 §7）

- 离线 JS 单测以外的都还没验过，包括：
  - Python 适配测试：先找到可用的解释器，裸 `python` 曾经不可用。
  - UI，以及工程保存后重开。
  - 浏览器存储、真实 DOCX/PDF 文件、ComfyUI 真实连接、多厂商真实调用。
  - 真实启动 Electron。
- 这些都需要用户授权，有的会产生费用。

## 8. 已知风险与坑

1. **热更新会清掉未提交的修改。**
   - `backend/services/hot_update_service.py` 的 `apply_hot_update` 执行 `git fetch <remote> master`，然后 `git reset --hard FETCH_HEAD`。
   - 触发方式是点更新横幅：`src/modules/AutoUpdate.js` 的 `_doApply` → `POST /api/v2/update/apply`，没有二次确认。
   - 现在因为缺 `双击运行.bat` 而不会生效。
   - 建议加上「工作区不干净就拒绝」的保护，但要先经用户同意再改。
2. **分组提交已完成（2026-09-25 07:30）**：第 1–122a 批的未提交内容已全部入库（18 条 `A.0:` 提交），工作区干净，**未 push**。后续 agent 仍不得自动提交或推送；新落的文件会重新造成未跟踪状态，本条第 1 项的热更新风险也随之重新积累。
3. **台账已冻结。**
   - `docs/implementation-handoff.md` 超过 1 MiB，`read_files` 和 `search_files` 都拒读，`apply_patch` 也改不了它。
   - 它保留为历史档案：R01–R26 原表在第 1499–1527 行，第 119 批预筛在第 1755 行。只能用 `run_command` 加 `Select-String` 只读查询。
   - 新记录一律写到本文件、`docs/tracking/batches.md` 和专题文档里。
4. **`docs/next-session-prompt.md` 已过时**：15 万字符，很多行超过 3000 字符会被截断，「下次继续做什么」还停在第 70 批。只作历史参考。
5. **测试基线里的失败是已知的。**
   - src 的 43 项来自缺失的夹具 `tests/testPreviewDom.js`，整个 `tests/` 目录都不存在。
   - electron 的 1 项是 R14 第 17 批的遗留。
   - 不要伪造夹具去「修」它们。
6. **导出闸门**：`deps-ast` 的 OK 只看依赖文件在不在，不看具名导出；第 116 批就因此撤回过一件。
7. **git 条目折叠**：新建目录里的多个未跟踪文件，在 porcelain 输出里只算 1 条（第 114 批发现），不能靠条目增量判断文件有没有落地。
8. **反混淆残留**：
   - 局部变量名仍是 `_0x…`，读代码时别被误导。
   - 约 13 个文件有超长单行（内联 SVG/HTML），MCP 读取会截断，改这些行之前要精确重读。
9. **其他小坑**：
   - 桌面模式下 Python 带 token，用浏览器直接打开桌面端口会返回 403，这是正常的。
   - `playwright.config.js` 指向不存在的 `e2e/` 和 `tools/`。
   - `package.json` 里没有 test 脚本。
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
7. **最后登记变更**：运行 `node tools/tracking/track.mjs --by agent --note "收工：<本批或本次做了什么>"`，把本次所有改动（包括刚更新的本文件）写进变更记录。

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

## 11. 会话日志（最新在上，只保留 10 条）

- 2026-09-25（第九次）：经用户授权做分组提交——第 1–121 批遗留的 956 个未提交文件按功能目录切成 17 条 `A.0:` 提交，第 122a 批 27 件另成 1 条，共 18 条；**未 push**，`origin/master` 仍为 `e12ecd1`。
  - 逐批归属先做过测算，结论是不可靠：专题文档互相引用导致命中仅 477/956（49.9%），且 91.6% 的命中文件被多批同时认领，最早认领法把绝大部分文件吸进 2 个批次。按计划预先约定的降级方案改为按功能目录分组，分桶规则与清单可复现。
  - 核对：17 桶逐条 `committed=list` 全等；`git diff --name-only e12ecd1..HEAD` 去重后 956 件全覆盖、无残差；`git status` 为 0/0/0。
  - 受保护件 `api/freeImageHostApi.js` MD5 不变且无任何提交触及；未提交集合内无凭据、无二进制（扫出的 `apiKey`／`mcp-session-id` 字样均为测试假值与文档正文）。
  - 提交期间另一会话交付第 122a 批（变更 #0019–#0021），其 27 个文件未被卷进前 17 条提交，单独成条。
- 2026-09-25（第八次）：交付第 122a 批，`src/modules/storyWorkspace/` 落 11 个 0 import 纯叶，落地不接线。24 件纯叶已全部暂存格式化，按 122a / 122b / 122c 分段。
  - 11 件与暂存逐字节一致，`node --check` 11/11，prettier 22/22；自研 37 例测试沙箱和本机首跑全绿。
  - src sweep 3587→3624 / 3544→3581 / 43（失败名集合一致）；api 791 未变；受保护文件 MD5 不变；消费方 0 命中。
  - 期间用户开始按目录分组提交（`A.0:` 系列），git 计数随之变化；专题文档 `docs/src-storyworkspace-batch122.md`；orphans 223→234；变更 #0019、#0020。
- 2026-09-25（第七次）：交付第 121c 批，`api/story-generation/` 再落 2 件（`storyEpisodeOutlinePlanning`、`storyAssetParallelExtraction`，均为依赖注入工厂），落地不接线；第 121 批至此完成。
  - 2 件过导出闸门，与暂存逐字节一致；`src/domain` 缺失的依赖只在测试里用替身注入，没有落 shim。
  - 自研 34 例测试落地后首跑全绿（沙箱预跑 4 例期望写错，改测试不改实现）；api sweep 757→791（+34）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-story-generation-batch121.md` 增 §9–§11；orphans 221→223；git 0/68/884/0 → 0/68/888/0；变更 #0016、#0017。
- 2026-09-25（第六次）：交付第 121b 批，`api/story-generation/` 再落 3 件（`storyAssetRequirementEvidence`、`storyEpisodeScriptTiming`、`storyAssetHybridBudget`），落地不接线。
  - 3 件过导出闸门（HybridBudget 在同段前置件落地后复跑）；27 个导出，与暂存逐字节一致。
  - 自研 47 例测试落地后首跑全绿（沙箱预跑 1 例期望算错，改测试不改实现）；api sweep 710→757（+47）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-story-generation-batch121.md` 增 §6–§8；orphans 218→221；git 0/68/878/0 → 0/68/884/0；变更 #0013、#0014。
- 2026-09-25（第五次）：交付第 121a 批，`api/story-generation/` 再落 8 件（第 120 批解阻的 7 件 + 链式解阻的 `storyAssetReferenceContract`），落地不接线。
  - 8 件全部过导出闸门；源码 30 个导出，与暂存逐字节一致；`node --check` 18/18。
  - 自研 82 例测试落地后首跑全绿（沙箱预跑时 2 例测试数据写错，改测试不改实现）；api sweep 628→710（+82）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-story-generation-batch121.md`；orphans 210→218；git 0/68/861/0 → 0/68/878/0；变更 #0010、#0011。
- 2026-09-25（第四次）：交付第 120 批，`api/story-generation/` 首批 10 件（8 纯叶 + 2 件依赖 `api/utils/`），落地不接线。
  - 镜像目录实有 32 件（LEAF 10 / OK 2 / BLK 20）；2 个 OK 件过了导出闸门；两个大纯叶留给第 121 批。源码 29 个导出，与暂存逐字节一致。
  - 自研 96 例测试首跑全绿；api sweep 532→628（+96）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合与 `b85-fails.txt` 一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-story-generation-leaves.md`；orphans 200→210；git 0/68/840/0 → 0/68/861/0；变更 #0007、#0008。
- 2026-09-25（第三次）：交付第 119 批，`api/` 请求响应工具区 7 个零 import 纯叶，落地不接线。
  - 新建 `api/utils/`，落了 strictJson、storyGenerationValues、storySceneIdentity、storyAssetPublicText，另有 `api/` 下 mediaUploadErrors、runningHubWorkflowPollingPolicy、runningHubUploadResponse；共 25 个导出，与暂存逐字节一致。
  - 自研 57 例测试首跑全绿；api sweep 475→532（+57）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合与 `b85-fails.txt` 一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-request-response-utils.md`；orphans 193→200；git 0/68/825/0 → 0/68/840/0。
- 2026-09-25（第二次）：上线全自动跟踪机制。
  - 新增 `AGENTS.md`、`CLAUDE.md`、`.github/copilot-instructions.md`；`README.md` 顶部加入口提示。（试过在 `.agents/skills/` 放项目技能，MCP 桥不会扫描，已删除。）
  - 新增 `tools/tracking/track.mjs`（零依赖的变更记录脚本）和 `.vscode/tasks.json`（打开文件夹时自动启动监视）；已建立基线并启动监视。
  - 本文件新增 §1.1 常设授权和 §12 变更记录机制；§1、§2、§3.3、§9 相应调整。
  - git：改动前 0/67/820/0，改动后 0/68/825/0。监视进程已自动记下 #0002（入口文件和本文件的改动），端到端验证通过。
- 2026-09-25：通读全项目（1674 个文件）后建立本跟踪体系。
  - 新增 `docs/TRACKING.md`，以及 `docs/tracking/` 下的 project-map、batches、orphans 三份文档。
  - 在 `docs/next-session-prompt.md` 顶部加了一段说明，指向本文件。
  - 没有改业务代码，没有跑测试。
  - git：改动前 0/67/816/0，改动后 0/67/820/0。

## 12. 变更记录机制（全自动）

- **记录什么**：git 会跟踪的所有文件，即已跟踪文件加上未被 `.gitignore` 忽略的新文件；排除 `user/`、`data/`、`output/`、`venv/`、`deobfuscated/` 等运行数据。代码和文档的增、删、改都会被记下来。
- **记在哪**：`docs/tracking/changes/<年-月>.md`，按月分文件、只追加。单个文件超过 400 KB 会自动分卷为 `<年-月>-p2.md`、`-p3.md`……，保证 MCP 读得了。
  - 每条记录有编号、时间、来源、说明、增删改文件清单和行数变化；改到受保护文件会打 ⚠。
  - 文件可能很长：用 `read_files` 时先看 `total_lines`，再只读最后 80 行左右。
- **谁来记**：
  1. **自动监视**：VS Code 或 Qoder 打开本仓库时，`.vscode/tasks.json` 会自动启动 `node tools/tracking/track.mjs --watch`（第一次可能要在编辑器里允许一次「自动任务」）。文件改动静默 90 秒后记一条；持续改动时最长 10 分钟必记一次；另外每 30 分钟兜底检查一次。
  2. **智能体**：开工时 `--by session-start`，每完成一项改动 `--by agent --note "…"`，收工再登记一次。说明要写清「改了什么、为什么」。
  3. **兜底**：监视没开、智能体忘了登记，改动也不会丢。下一次任何人运行脚本时，快照差异会被完整补记。
- **状态文件**：在 `docs/tracking/state/`，存快照、锁和监视日志；只在本机，不进 git，不要手改。快照丢了，脚本会自动重建基线，并在记录里注明。
- **常用命令**：`--status` 查看快照、最近 3 条记录和监视是否在运行；`--dry-run` 只看差异、不写入。
- **修改脚本**：`tools/tracking/track.mjs` 零依赖；排除目录、受保护文件、静默时间等都在文件开头的 `CONFIG` 里。改脚本本身也会被记录。
