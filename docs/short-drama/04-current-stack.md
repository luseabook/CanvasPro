# 04 · 现状梳理 (Current Stack)

> **目的**：把 CanvasPro 已有的 Agent / Storyboard / Canvas 系统**摸清楚**，作为后续架构决策的事实基础。
> **写作日期**：2026-06-28
> **数据来源**：反推混淆代码 + skill JSON 文件 + main.js 导入清单
> **重要性**：本文档与 `01-architecture.md` 冲突时，**以本文档为准**，并触发架构修订。

---

## 0 · TL;DR：三条颠覆性事实

写架构文档时我**没读现有代码**就推进，导致 `01-architecture.md` 的几个核心假设和现实严重不符。摸清后的三条关键事实：

### 0.1 CanvasPro 已经有自己的 Agent 系统

不是没做，是**已经做完了**：12 个文件，完整的"用户消息→上下文构建→LLM 规划→风险评分→预执行安全前缀→确认→执行→恢复"链路。

**已有 Agent 的形态**：
- **Plan-then-execute 模式**——LLM 返回一个 JSON 行动计划（actions[]），系统验证、评估风险、按需要求用户确认，再执行
- **JSON skill 描述符**——目前 4 个生产 skill（`text-to-image` / `text-to-video` / `image-to-video` / `batch-layout`），3 个 future（`storyboard` / `character-consistency` / `ecommerce-product-shot`）
- **JSON 行动计划 = canvas commands 序列**——动作集已注册（`node.create` / `node.setPrompt` / `graph.connect` / `generation.run` / …）
- **5 状态机**：`chat` / `ready` / `need_confirmation` / `need_clarification` / `failed`
- **4 风险等级**：`safe` / `confirm` / `danger` / `blocked`
- **会话与对话存储**：localStorage 多对话支持，按 projectId 隔离

### 0.2 已经有 `StoryboardScriptNode` 类型，且其数据模型 70% 满足短剧需求

这是个意外大彩蛋。已存在的 `StoryboardScriptNode` **已经是"分镜表"节点**：
- LLM 直接产出带 镜号/时长/景别/场景/画面描述/角色/角色描述/角色动作/情绪/角色图/参考/图片提示词/视频提示词/对白/音效 的 shot 行
- 表格视图 + 卡片视图切换
- `mediaMode: image | video` 切换
- 选中若干行 → 一键派发生图任务（`_startGeneratedImageNodes`）
- 引用图片 / 视频通过 `@图片N` 占位符自动绑定到画布上的其他节点

**完整字段（中文列名）**：
```
镜号 / 时长 / 景别 / 场景 / 画面描述 / 角色 / 角色描述 / 角色动作 / 情绪
角色图 / 参考 / 图片提示词 / 视频提示词 / 对白 / 音效
```

这对应 Toonflow 的 `StoryboardTable + StoryboardPanel`，**已经实现**。

### 0.3 `StoryboardNode` 是另一回事，不要混

文件名容易误导。`StoryboardNode` 是**图片网格拼图节点**——把一张大图切成 N×M 格子，或往格子里塞图，最后 Compose 成一张大图。**不是短剧用的分镜节点**。短剧的"分镜表"应该用 `StoryboardScriptNode`。

---

## 1 · 现有 Agent 系统详解

### 1.1 文件清单（`src/modules/agent/`）

| 文件 | 一句话作用 |
| --- | --- |
| `index.js` | 桶式导出，对外的公共 API 都在这里 |
| `agentActionSchema.js` | 定义 `AGENT_PLAN_STATUSES` / `AGENT_RISK_LEVELS` / normalizers，批确认阈值 = 5 |
| `agentActionExecutor.js` | 把 `{type, alias?, args}[]` 数组交给 `executeCanvasCommandPlan` |
| `agentCanvasSummary.js` | 画布快照 + 模型清单按相关性筛选到 ≤22 个候选 |
| `agentContextBuilder.js` | 打包 canvas + commands + skills + policies，并按 ~36KB JSON 预算裁剪 |
| `agentConversationStore.js` | localStorage 多对话存储（按 projectId 隔离） |
| `agentModelSettings.js` | 持久化 agent 自己用哪个 apimart 文本模型 + 手动/自动模式 |
| `agentPanel.js` | 侧栏 UI：聊天、计划预览、确认/取消、恢复、历史、输入引用条、可调宽度 |
| `agentPlanValidator.js` | 行动风险评分、上下文默认参数填充、未知命令拦截 |
| `agentRuntime.js` | 编排器：planner→validate→preExec→confirm→exec，含澄清与恢复流程 |
| `agentSessionStore.js` | 内存会话：历史、近期命令、调试 trace、待执行计划/恢复/澄清 |
| `agentSkillCatalog.js` | 4 个 skill 的硬编码白名单 |

### 1.2 数据 schema

**AgentPlan**：
```js
{
  reply: string,                    // 给用户看的对话回复
  status: "chat"|"ready"|"need_confirmation"|"need_clarification"|"failed",
  question: string,                 // status="need_clarification" 时
  options: [{ id, label }],         // 澄清选项
  requiresConfirmation: boolean,
  riskLevel: "safe"|"confirm"|"danger"|"blocked",
  actions: AgentAction[],
  raw: object
}
```

**AgentAction**：
```js
{
  type: string,                     // 如 "node.create" / "generation.run"
  alias?: string,                   // 用于计划内 "$alias.nodeId" 引用
  args: object,
  // 由 validator 补充：
  riskLevel: "safe"|"confirm"|"danger"|"blocked",
  riskReason?: string
}
```

**Skill 描述符**（`.skill.json`）：
```jsonc
{
  "schemaVersion": 1,
  "id": "kebab-case-id",
  "title": "Human label",
  "riskLevel": "safe"|"confirm"|"danger",
  "appliesWhen": ["natural-language conditions"],
  "requiredInputs": ["prompt", "source image", ...],
  "missingInputQuestions": ["follow-up question 1", ...],
  "recommendedModelKind": "image"|"video"|"audio"|"text"|"",
  "defaultParams": { "duration": 5, "aspectRatio": "16:9" },
  "commands": ["node.create", "node.setPrompt", ...]  // 允许的画布命令
}
```

### 1.3 关键政策（policies）

Agent 不允许：
- `noDomAccess` — planner 输出不可碰 DOM
- `noArbitraryStoreWrites` — 不可直接写 store
- `noDirectNetwork` — 不可直接发请求
- `noElectronAccess` — 不可碰 electron API
- `batchConfirmThreshold: 5` — 批量动作 > 5 强制确认

这意味着 Agent 是**纯逻辑层**，所有副作用通过 `canvasCommands` 系统去做。

### 1.4 全链路（用户消息 → 画布变化）

1. 用户在 `agentPanel.js` 输入 → `runtime.handleUserMessage(text, { inputRefs })`
2. `agentRuntime.createAgentRuntime → handleUserMessage`：清待办、设 currentRun 为 planning
3. `agentContextBuilder.buildAgentContext`：组装 `{ canvas, commands, skills, policies }` 并按 36KB 预算裁剪
4. **调用注入的 planner**（关键点：planner 来自 `main.js` 注入的 `requestAgentActionPlan`，不在 agent 模块内）
5. `agentPlanValidator.validateAgentPlan`：
   - 应用上下文默认值（如 image-to-video 自动选模型）
   - 逐 action 查 `canvasCommandRegistry.get(type)`
   - 评估风险，返回 `{ ok, status, riskLevel, plan }`
6. `agentRuntime` 分支：
   - `chat` → 显示回复
   - `need_clarification` → 显示问题 + 选项
   - `need_confirmation` → 切分 safe prefix 立即执行 + 剩余等确认
   - `ready` → 直接执行
7. `executeAgentActions` 调 `executeCanvasCommandPlan(actions, ctx, scope)`
8. 画布变化由 `canvasCommands` 完成
9. 成功 → 清待办，推 assistant `done` 消息
10. 失败 → 构建恢复描述 `{ errorCode, failedAction, options: [retry/editPrompt/changeModel/keepPrepared] }`

### 1.5 模型如何配置

- **Agent 自己用的 LLM**：`agentModelSettings.createAgentModelSettings` 持久化到 `localStorage["aiCanvas.agentModelSettings.v1"]`，从 apimart 文本模型菜单选
- **画布操作用的模型**：通过 `manifests/index.js` 的 `listModelManifests` 提供给 planner 作 `availableModels`
- **API Key**：**不在 agent 模块**，由 `main.js` 注入的 planner 自己拿

### 1.6 已有 skill 列表

**生产（白名单内）**：
- `text-to-image`（confirm, image）
- `text-to-video`（confirm, video）
- `image-to-video`（confirm, video）
- `batch-layout`（safe, no kind）

**未来（JSON 已写，未上线）**：
- `storyboard`（text-kind, 分镜规划）—— 这正是我们需要的！
- `character-consistency`（image-kind, 角色一致性）—— 短剧也强需要
- `ecommerce-product-shot`（image-kind, 电商产品图）

---

## 2 · 现有 StoryboardScriptNode 详解

### 2.1 节点本身

`StoryboardScriptNode` (`src/components/StoryboardScriptNode.js`) 是一个画布节点类型 `type: 'storyboard-script'`，承载一份**LLM 生成的分镜表**。

### 2.2 列定义（`STORYBOARD_SCRIPT_COLUMNS`）

| 列名 | 字段语义 |
| --- | --- |
| 镜号 | 分镜序号 |
| 时长 | 推荐时长（含 `parseDurationSeconds` 工具） |
| 景别 | 特写 / 中景 / 远景 等 |
| 场景 | 场景描述 |
| 画面描述 | 画面内容文字描述 |
| 角色 | 出场角色名 |
| 角色描述 | 角色外观/性格描述 |
| 角色动作 | 该镜头的角色动作 |
| 情绪 | 情绪关键词 |
| 角色图 | 关联角色图片（`@图片N` 占位符） |
| 参考 | 关联参考图（`@图片N`） |
| 图片提示词 | 用于生图的 prompt |
| 视频提示词 | 用于生视频的 prompt |
| 对白 | 台词 |
| 音效 | 音效描述 |

### 2.3 节点级状态

```js
{
  type: 'storyboard-script',
  rows: [shotRow1, shotRow2, ...],
  viewMode: 'list' | 'card',
  mediaMode: 'image' | 'video',
  selectedRowIndexes: number[],
  selectionMode: boolean,
  title: string,
  detectedIntent: { shotCount, totalDurationSeconds, language },
  warnings: string[],
  rawJson: string,
  canonicalJson: string,
  imageModel: string,
  imageProvider: string,
  generationParams: object,
  referenceImageRefs: [{ id, label, source, ... }]
}
```

### 2.4 支持的操作

- 表格视图 / 卡片视图切换
- 图片模式 / 视频模式切换
- 单元格编辑（`_beginCellEdit` / `_updateCellValue`）
- 行选择 + 多选
- **批量从选中行派发生图任务**（`_startGeneratedImageNodes` / `_createImageNodesFromSelectedStoryboards`）
- 视频帧提取（`extractStoryboardVideoFramesFromServer`）
- 引用资产解析（`getPromptAssetInputRefsFromNode`）

### 2.5 与短剧需求的差距

| 短剧需要 | StoryboardScriptNode 现状 | 差距 |
| --- | --- | --- |
| 每行 = 一个分镜 | ✅ | 无 |
| 提示词每镜独立 | ✅ 图片/视频两套 prompt | 无 |
| 时长（秒） | ✅ | 无 |
| 关联资产 | ✅ `@图片N` 占位符 + reference refs | 无 |
| 场景/角色/对白/音效 | ✅ | 无 |
| 直接派发生图 | ✅ | 无 |
| 直接派发生视频 | ⚠️ 有 mediaMode='video' 与视频 prompt，但生视频路径未完整 | **要补完** |
| 单行生成状态显示 | ❌ 状态在外部 image-gen 节点 | **要补** |
| 拖拽重排 / 增删行 | ✅ 表格内编辑 | 无 |
| 项目级"哪一集的分镜表" | ❌ 节点本身无项目关联 | **要在画布层加** |

**结论**：现有 `StoryboardScriptNode` 是个 70% 完成的短剧分镜节点。补完路径远比从零写新节点便宜。

---

## 3 · `StoryboardNode`（图片拼图节点，与短剧无关）

简要说明，避免混淆：

`StoryboardNode` = 把一张大图切成 N×M 格子，或往每格塞图，最后 Compose 成一张大图。属于"摄影 / 海报排版"工具。**与短剧无关**。

- 支持：方格 2×2/3×3/4×4/5×5、宽高比 1:1/16:9/9:16/4:3/3:4、自由网格（拖拽分割线）、图片拼合输出 JPEG
- 不支持：每格 prompt / duration / 资产关联 / 状态机 / 视频

**短剧不要碰它**。短剧用 `StoryboardScriptNode`。

---

## 4 · 已有的画布节点与命令体系

### 4.1 已注册节点类型（`main.js` 的 `NODE_COMPONENTS`）

```
source-text / source-image / source-video / source-audio
comment-note / web-preview / web-reference-card
media-clip
ai-image / ai-text / ai-video / ai-audio
scene-detection
group / debug
collage
storyboard / storyboard-script ← 我们要的在这里
panorama-scene / panorama-360
```

短剧需要的节点几乎都有现成的：
- 源媒体（图/视/音/文）
- AI 生成节点（图/视/音/文）
- 分镜表节点（storyboard-script）
- 媒体剪辑节点（media-clip）
- 场景检测节点（scene-detection）

短剧**可能需要新增**的节点：
- 项目根节点（含元数据：剧本、风格、角色库引用）
- 资产卡节点（带类型 role/tool/scene/clip + 衍生资产）
- 集容器节点（一集的所有分镜归属此容器）

### 4.2 已有的画布命令

agent 模块引用的命令清单（来自 `agentPlanValidator.js`）：

```
节点级：
  node.create / node.delete / node.select
  node.setPrompt / node.appendPrompt
  node.setParams / node.setModel / node.changeModel
  node.setInputSlot

图级：
  graph.connect

布局：
  layout.align / layout.distribute
  layout.arrangeRow / layout.arrangeColumn / layout.arrangeGrid

视口：
  viewport.focusNodes

生成：
  generation.run
```

这些是 **canvasCommands 系统**的能力，由 `executeCanvasCommandPlan` 派发。短剧版的"add storyboard / add asset / generate storyboard"动作可以通过**扩展这套命令体系**实现，不需要另起一套 socket 协议。

### 4.3 已有的 API 层（`api/`）

```
agentApi.js              ← Agent 请求 plan 的 API
aiTextApi.js             ← LLM 文本生成（agent 用的就是这个）
aiImageApi.js            ← 生图
aiVideoApi.js            ← 生视频
aiAudioApi.js            ← 生音频
configApi.js             ← API Key 配置读写（用户已说"保持现有"）
dreaminaCliApi.js        ← 即梦 CLI 适配
imageUploadApi.js / imageRatioPolicy.js / mattingApi.js
adapters/                ← 各供应商适配器
errors/                  ← 错误处理
projectsV2Api.js         ← 项目持久化
localMediaTaskApi.js     ← 本地媒体任务
```

**这里已经有完整的"多供应商 + 多模型 + 抽象层"**，远比我之前文档假设的更成熟。Toonflow 用 Vercel AI SDK 是其简化方案；CanvasPro 已经有自己的等价物。

### 4.4 已有的核心 store（`src/core/stores/`）

```
appStore.js / graphStore.js / uiStore.js / workspaceStore.js
domainSlices.js / facadeStore.js / runtime.js
legacyKernelStore.js / legacyInitialState.js
```

是一套多 store 体系。Agent 模块通过 `graphStore.getStateRaw()` 读取画布状态。

### 4.5 已有的任务系统（`src/core/`）

```
generationTaskLifecycle.js
generationTaskRuntime.js
generationTaskUiState.js
imageTaskRuntimeState.js
```

**完整的生成任务生命周期管理**已存在。我之前文档说"任务表合并"——现在看应该说"任务管理直接复用现有，加 projectId/scriptId 字段"。

---

## 5 · 已有 vs 短剧需求的能力差距矩阵

| 短剧能力 | 现有状态 | 差距评估 |
| --- | --- | --- |
| **Agent 框架** | 已有 plan-execute + JSON skill | ✅ 完整，需要扩展 |
| **多 LLM 供应商** | 已有 apimart 集成 + 模型选择 | ✅ 完整 |
| **画布节点** | 18+ 类节点已注册 | ✅ 基础齐全 |
| **画布命令系统** | 完整 canvasCommands 注册 | ✅ 完整 |
| **生成任务管理** | `generationTaskLifecycle` 等模块 | ✅ 完整 |
| **分镜表节点** | `StoryboardScriptNode` 70% 完成 | ⚠️ 补完即可 |
| **多对话 Agent 会话** | `agentConversationStore` 已有 | ✅ |
| **画风风格 Skill** | 4 个生产 skill + 3 个 future | ⚠️ 需扩展短剧专属 skill |
| **数据库（SQLite）** | 无 | ❌ **需新增** |
| **项目类型（freeform/shortdrama）** | 无 | ❌ **需新增** |
| **集（Episode）概念** | 无 | ❌ **需新增** |
| **小说→剧本→分镜流程** | 无 | ❌ **需新增** |
| **资产库（项目级 role/tool/scene/clip）** | 节点上有 reference refs，但无库 | ❌ **需新增** |
| **三层 Agent（决策/执行/监督）** | 无（现有是单层 plan-execute） | ❌ 需评估 |
| **流式工具调用（实时 emit）** | 无（现有是 plan-then-execute） | ❌ 需评估 |
| **Skill markdown + activate_skill 动态加载** | 现有是 JSON allowlist | ❌ 风格不同 |
| **本地 ONNX 记忆 embedding** | 无 | ❌ 需新增（或评估必要性） |
| **用户系统 + JWT** | 无 | ❌ 需新增 |
| **局域网团队模式** | 无 | ❌ 需新增 |
| **TTS / 字幕 / BGM 配音** | 部分（audio API + 节点） | ⚠️ 需要短剧专属链 |
| **MP4 直出 + 工程包导出** | 部分（media-clip 节点 + 剪辑模块） | ⚠️ 需补完短剧导出 |
| **ffmpeg 自带** | 未确认 | 需查证 |

---

## 6 · 颠覆性结论

### 6.1 之前的架构方向部分错了

`01-architecture.md §2.1` 推荐"Node.js fork Toonflow Agent 代码"。**这是错的**：
1. CanvasPro 已经有一套完整 Agent 框架，且与 canvasCommands 深度集成
2. 把 Toonflow 的 Agent 塞进来会和现有 Agent 冲突
3. Toonflow 的 streaming + 子 Agent 范式 vs CanvasPro 的 plan-execute 范式是**两种思想**，混用很难

### 6.2 新方向：扩展现有 Agent，加短剧专属层

**主线方向修正**：

1. **保留 + 扩展现有 Agent** — 不引入 Toonflow Agent 代码
2. **新增短剧专属 skills**（JSON）— `script-skeleton` / `adaptation-strategy` / `episode-script` / `derive-assets` / `director-plan` / `storyboard-table` / `storyboard-panel` / `supervisor-script` / `supervisor-production`
3. **补完 `StoryboardScriptNode`** — 补单行生成状态 + 视频生成直派 + 项目/集关联
4. **新增项目/集/资产数据层** — SQLite，17 张表（详见 `01-architecture.md §3.1`，由 27 精简至 17）
5. **新增剧本工作室页面** — 复用现有 agent UI 组件
6. **三层 Agent 转化** — 不一定要"三个 Agent 进程"。可以用**一个 Agent + 三个 skill 类别**实现：决策 skill / 执行 skill / 监督 skill。Toonflow 的三层是结果，不是手段
7. **流式工具调用** — 现有 plan-execute 可以扩展为 streaming plan-execute，让用户看到实时 plan 增长。但不是必须，可后置

### 6.3 节省的工作量

按 `01-architecture.md` 的估算阶段 A 是 11-14 周。摸明现状后修正：

| 模块 | 原估算 | 修正估算 | 原因 |
| --- | --- | --- | --- |
| Agent 框架 fork | 1-2 周 | **0 周** | 不 fork，扩展现有 |
| 画布扩展 | 2-3 周 | **0.5-1 周** | StoryboardScriptNode 已 70% 完成 |
| AI 调用层 | 隐含 1 周 | **0 周** | apimart 已成熟 |
| 任务管理 | 1 周 | **0.5 周** | generationTask 系列已存在 |
| 短剧专属（数据库/页面/skill） | 6-8 周 | **6-8 周** | 这部分还要做 |
| 整体 | **11-14 周** | **8-10 周** | 节省约 4 周 |

---

## 7 · 接下来要做的调整

### 7.1 立即调整 `01-architecture.md`

需要重写的章节：
- **§2.1 Agent 框架决策** — 从"fork Toonflow"改为"扩展 CanvasPro 现有"
- **§2.2 Agent 服务跑哪** — 现有 Agent 是浏览器（renderer）模块，不是子进程；需重新评估
- **§4 Agent 服务详细设计** — 整章重写
- **§5 流程串接示例** — 改写为基于 plan-execute 模式
- **§11 阶段 A 施工拆解** — Phase A.0 改为"扩展现有 Agent + 数据库层"

### 7.2 立即调整 `02-pipeline.md`

需要重写的章节：
- **§3 ScriptAgent 三层** — 改为"现有 Agent + 短剧专属 skill 集合"
- **§4 ProductionAgent 三层** — 同上
- **§4.5 分镜面板** — 用 `StoryboardScriptNode` 而不是新设节点

### 7.3 不需要调整的章节

- `00-vision.md` — 产品定位不变
- `03-glossary.md` — 术语不变（虽然底层实现变了，术语保持）
- `02-pipeline.md` 大部分 — 用户路径不变
- `01-architecture.md` 的数据库、用户系统、ffmpeg、TTS 等决策不变

---

## 8 · 待定的事

写修订版架构之前，还要回答几个问题：

1. **"三层 Agent"还要不要**？看了现有 Agent 是单层 plan-execute，三层是 Toonflow 范式。短剧是不是真的要三层？还是单层 + 多 skill 就够？
2. **Skill 格式**：现有是 JSON 描述符 + 隐式逻辑（在 planner 里）。Toonflow 是 markdown + frontmatter + 完整 prompt 文本。短剧的 skill 选哪种？混合？
3. **planner 在哪**：`requestAgentActionPlan` 在 `api/agentApi.js`，看名字是发到 server.py，但 server.py 没大模型调用代码。所以 plan 是怎么生成的？需要进一步查证。
4. **流式 vs plan-execute**：现有是"一次性出 plan 再执行"，用户体验是"等一下→预览→确认"。Toonflow 是"边说边干"。短剧用哪种？

下一步建议：先做 §7.1 §7.2 的文档修订，把待定的事就地讨论；不动代码。

---

## 9 · 给后续 Agent 与开发者的备忘

如果你来读这份文档准备做事：

- **不要重复"fork Toonflow Agent 框架"的方向** — 那是错的
- **要扩展，不要重写** — CanvasPro 自研 Agent 是值得保留的资产
- **StoryboardScriptNode 是核心节点** — 短剧的分镜表就靠它，不要新建
- **canvasCommands 是底层接口** — 短剧的所有操作（增资产、加分镜、改 prompt）都通过它，不要绕开
- **现有 manifests 系统是模型适配层** — 不要新建 vendor 抽象
- **生成任务用 generationTaskLifecycle** — 不要新建任务表（直接扩展现有）

---

**版本**：v0.1 · 初稿
**最后修订**：2026-06-28
**依赖**：03-glossary.md v0.1（术语仍有效）
**对架构文档的影响**：触发 `01-architecture.md` 修订（§2.1 / §2.2 / §4 / §5 / §11）
**下一步**：根据本文档结论，修订 `01-architecture.md` 与 `02-pipeline.md` 的相关章节
