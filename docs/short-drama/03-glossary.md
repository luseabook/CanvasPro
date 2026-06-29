# 03 · 术语表 (Glossary)

> **目的**：钉死全套术语的中英文名、定义、所在代码位置。后续所有文档、代码、UI 文案必须以此为准。
> **参考来源**：Toonflow-app 现有实现（`F:\Toonflow\Toonflow-app`），CanvasPro 现有画布。
> **维护规则**：发现新术语先加进来，再写代码；改名先改这里，再改代码。任何文档与本表冲突，以本表为准。

---

## 0 · 速查表

| 中文 | 英文 / 代号 | 一句话定义 |
| --- | --- | --- |
| 项目 | Project | 一部短剧作品的顶层容器 |
| 集 | Episode | 项目下一集，对应一份剧本 + 一份分镜 + 一块画布 |
| 章节 | Chapter | 小说原文按章拆分的单位（输入侧） |
| 小说 | Novel | 用户上传的原始长文本 |
| 剧本 | Script | 改编后的、可拍摄的分集文本 |
| 故事骨架 | StorySkeleton | 全剧主线、人设、世界观的浓缩骨架 |
| 改编策略 | AdaptationStrategy | 从小说到短剧的二次创作方针 |
| 拍摄计划 | ScriptPlan / DirectorPlan | 一集的导演工作方案 |
| 分镜 | Storyboard (shot) | 单个镜头：画面 + 提示词 + 时长 + 资产 |
| 分镜表 | StoryboardTable | 整集分镜的表格化文档（可读） |
| 分镜面板 | StoryboardPanel | 整集分镜的结构化数组（机读，写入画布） |
| 资产 | Asset | 角色 / 道具 / 场景 / 片段四类可复用素材 |
| 衍生资产 | DeriveAsset | 同一资产的变体（不同表情/服装/角度…） |
| 画布 | Canvas | 无限画布，承载分镜与资产的可视化工作台 |
| 工作区 | Workspace / FlowData | 画布序列化后的 JSON 状态 |
| 事件 | Event | 章节中抽取出的结构化情节单元 |
| 技能 | Skill | 带 frontmatter 的提示词文件，可被 Agent 动态激活 |
| 三层 Agent | Three-tier Agent | 决策 / 执行 / 监督三层协作的 Agent 框架 |
| 决策层 | DecisionAgent | 统筹/视频策划，负责拆任务、调度子 Agent |
| 执行层 | ExecutionAgent | 编剧/执行导演，负责具体产出 |
| 监督层 | SupervisionAgent | 编辑/监制，负责校验与质量评审 |

---

## 1 · 业务层术语

### 1.1 项目（Project）

- **定义**：一部短剧作品的顶层容器。一个项目对应若干集（Episode），共享相同的画风、模型、世界观、资产库。
- **Toonflow 表**：`o_project`（见 `src/types/database.d.ts:115-130`）
  - 关键字段：`name`、`projectType`、`artStyle`、`imageModel`、`videoModel`、`videoRatio`、`mode`、`directorManual`
- **CanvasPro 映射**：现有"项目/工作区"的概念扩展，新增 `projectType` 字段区分 `freeform`（自由画布，旧）与 `shortdrama`（短剧）。
- **UI 文案**：「项目」。新建项目时选择类型（自由画布 / 短剧）。

### 1.2 集（Episode）

- **定义**：项目下一个独立可拍摄的单元，对应**一份剧本 + 一份分镜面板 + 一块画布**。
- **Toonflow 表**：以 `o_script` 行为锚，`o_agentWorkData.episodesId` 关联，`o_storyboard` 通过 `scriptId` 关联到集。
- **CanvasPro 映射**：每集一块独立画布（一对一），切集即切画布。
- **命名规则**：集编号从 1 开始，与小说章节顺序解耦（一章可拆多集，也可合多章为一集）。
- **UI 文案**：「第 N 集」。

### 1.3 章节（Chapter）

- **定义**：小说原文按章拆分的输入单位。仅在「小说改编」流程中存在；用户直接粘剧本时无此概念。
- **Toonflow 表**：`o_novel`（见 `src/types/database.d.ts:103-114`）
  - 关键字段：`chapter`（标题）、`chapterData`（正文）、`chapterIndex`、`event`、`eventState`、`reel`
- **CanvasPro 映射**：保持原名 `chapter`，库表沿用。

### 1.4 小说（Novel）

- **定义**：用户上传的原始长文本，作为短剧的素材来源。可以是网文、剧本草稿、剧情大纲。
- **范围**：仅作为**输入**存在，不作为最终交付物。一旦解析为章节并生成骨架/剧本，后续工作以剧本为准。

### 1.5 剧本（Script）

- **定义**：改编后、可直接进入分镜生产的分集文本。是项目的核心交付物之一。
- **Toonflow 表**：`o_script`（见 `src/types/database.d.ts:138-146`）
  - 关键字段：`name`（剧名/集名）、`content`（剧本正文）、`extractState`（拆分镜状态）
- **CanvasPro 映射**：保持表名 `o_script`，含义不变。
- **生成路径**：
  - 路径 A（小说改编）：`小说 → 章节 → 事件 → 故事骨架 → 改编策略 → 剧本`
  - 路径 B（直接粘剧本）：用户粘贴 → 直接为 `o_script.content`
  - 路径 C（剧本助手）：与 ScriptAgent 对话产出

### 1.6 故事骨架（StorySkeleton）

- **定义**：全剧的主线脉络、核心人物、世界观、风格基调的高度浓缩文档。是后续所有分集改编的"宪法"。
- **Toonflow 产出**：由 ScriptAgent 的 `run_sub_agent_storySkeleton` 子 Agent 产出，以 XML 写入 `<storySkeleton>…</storySkeleton>`。
- **写入位置**：工作区 FlowData（剧本工作室侧的 FlowData，区别于画布 FlowData）。
- **何时生成**：在小说章节解析完成、分集开始之前。

### 1.7 改编策略（AdaptationStrategy）

- **定义**：从原著小说到短剧的二次创作方针，包含节奏调整、情节取舍、爽点设计、人物简化原则等。
- **Toonflow 产出**：由 ScriptAgent 的 `run_sub_agent_adaptationStrategy` 产出。
- **作用域**：项目级，对所有集生效。后续编剧步骤强依赖此策略文档。

### 1.8 拍摄计划（ScriptPlan / DirectorPlan）

- **定义**：一集的导演工作方案。包含场景规划、镜头风格、节奏控制、关键画面预想。是分镜表的上游。
- **Toonflow 产出**：由 ProductionAgent 的 `run_sub_agent_director_plan` 产出，以 XML 写入 `<scriptPlan>…</scriptPlan>`。
- **FlowData 键**：`scriptPlan`（`src/agents/productionAgent/tools.ts:45-51` 的 `flowDataSchema`）。
- **代号选择**：内部代码用 `scriptPlan`（沿用 Toonflow），UI 文案用「拍摄计划」。

### 1.9 分镜（Storyboard / Shot）

- **定义**：**单个**镜头的最小单位。包含视频描述、提示词、时长、轨道、关联资产、生成的图片/视频路径。
- **Toonflow 表**：`o_storyboard`（见 `src/types/database.d.ts:171-187`）
  - 关键字段：`videoDesc`、`prompt`、`duration`、`track`、`trackId`、`index`、`filePath`、`state`、`shouldGenerateImage`
- **强约束**：分镜的 `id` 必须是数据库真实 id，不能由 LLM 编造（Toonflow 在 `storyboardSchema` 里特别注明）。
- **歧义辨析**：
  - 「分镜 (Storyboard)」= 单个镜头（本词）
  - 「分镜表 (StoryboardTable)」= 整集的镜头表格文档
  - 「分镜面板 (StoryboardPanel)」= 整集的镜头数组（结构化）

### 1.10 分镜表（StoryboardTable）

- **定义**：整集分镜的**可读表格文档**，给人看的。包含编号、画面描述、台词、时长、关联资产等列。
- **Toonflow 产出**：由 ProductionAgent 的 `run_sub_agent_storyboard_table` 产出，以 XML 写入 `<storyboardTable>…</storyboardTable>`。
- **FlowData 键**：`storyboardTable`。
- **与分镜面板的关系**：先生成分镜表（人审），再据其拆为分镜面板（机执行）。

### 1.11 分镜面板（StoryboardPanel）

- **定义**：整集分镜的**结构化数组**，给系统消费的。每项对应一条 `o_storyboard` 记录。直接渲染到画布。
- **Toonflow 产出**：由 ProductionAgent 的 `run_sub_agent_storyboard_panel` 产出，以 XML 逐条写入 `<storyboardItem …/>`。
- **FlowData 键**：`storyboard`（数组）。
- **写入工具**：`add_flowData_storyboard`（`src/agents/productionAgent/tools.ts:243-295`）。

### 1.12 资产（Asset）

- **定义**：可在多个分镜间复用的素材。分四类：
  - `role`（角色）—— 角色头像、立绘
  - `tool`（道具）—— 武器、物件
  - `scene`（场景）—— 背景图
  - `clip`（片段）—— 既有视频片段
- **Toonflow 表**：`o_assets`（见 `src/types/database.d.ts:45-61`）
  - 关键字段：`name`、`type`、`prompt`、`describe`、`promptState`、`imageId`、`flowId`
- **关联表**：
  - `o_scriptAssets`：剧本 ↔ 资产（一集用到的资产清单）
  - `o_assets2Storyboard`：资产 ↔ 分镜
  - `o_assetsRole2Audio`：角色 ↔ 配音

### 1.13 衍生资产（DeriveAsset）

- **定义**：同一主资产的**变体**。例：主角的"惊讶表情"、"战斗服装"、"侧脸角度"是主角资产的衍生。
- **Toonflow 实现**：复用 `o_assets` 表，通过 `assetsId` 字段指向父资产形成层级。
- **用途**：解决"一个角色多种状态"的图像一致性问题。生成分镜时按需关联具体衍生项。

### 1.14 画布（Canvas）

- **定义**：CanvasPro 的核心——无限缩放的可视化工作台。承载图层、节点、连线、媒体。
- **CanvasPro 现状**：项目根目录已存在，是项目最强资产。
- **短剧场景下的角色**：每一**集**对应一块画布。集内分镜面板的项 = 画布上的节点；资产 = 画布上的可拖入素材。
- **延续策略**：完全沿用现有画布引擎，仅扩展节点类型（StoryboardNode、AssetNode）与 IO（导入分镜面板、导出剪辑序列）。

### 1.15 工作区 / FlowData（Workspace / FlowData）

- **定义**：画布的序列化状态 JSON。包含所有节点、连线、视图、当前业务数据。
- **Toonflow 中的二义性**（需注意）：
  - **剧本工作室 FlowData**：ScriptAgent 维护的业务数据 `{ novel, storySkeleton, adaptationStrategy, scriptList, … }`
  - **画布 FlowData**：ProductionAgent 维护的业务数据 `{ script, scriptPlan, assets, storyboardTable, storyboard }`（`flowDataSchema`）
- **CanvasPro 命名约定**（消歧）：
  - 业务侧统一叫 **工作区数据 (Workspace Data)** —— 业务字段集合
  - 画布侧叫 **画布状态 (CanvasState)** —— 图形节点、视图等画布引擎自有数据
  - 持久化时合并写库
  - **实现差异（v0.2，按 D3/D5）**：CanvasPro 的工作区数据**只存计算产物**（storySkeleton/adaptationStrategy/scriptPlan），`novel`/`scriptList`/`script` 全量走数据库表，`storyboardTable` 仅存 `{ nodeId }` 指针（行内容在 `StoryboardScriptNode`），`assets`/`storyboard` 只存摘要。详见 `02-pipeline.md §3.2 §4.3`。

### 1.16 事件（Event）

- **定义**：从章节中抽取出的结构化情节单元。一个章节可有多个事件。
- **Toonflow 表**：
  - `o_event`（见 `src/types/database.d.ts:70-75`）：`name`、`detail`、`createTime`
  - `o_eventChapter`：事件 ↔ 章节多对多关联
- **作用**：解构小说，便于跨章节调度（重排、合并、跳过）。是骨架→剧本中间的可选枢纽。
- **范围**：仅在「小说改编」流程使用。

### 1.17 技能 / Skill

- **定义**：带 YAML frontmatter 的 Markdown 提示词文件。Agent 可通过 `activate_skill(name)` 动态加载。
- **Toonflow 位置**：`data/skills/`（运行时路径，由 `u.getPath("skills")` 解析）
- **结构**：
  ```markdown
  ---
  name: skill-name
  description: 简短描述（决定 Agent 是否调用此技能）
  ---
  正文：详细的提示词、指令、示例……
  ```
- **三类技能库**：
  - 主流程技能：`production_agent_decision.md`、`production_execution_storyboard_panel.md` 等（一对一固定调用）
  - 美术风格技能 (`art_skills`)：11 种画风（如水墨、二次元、写实），每种含 `driector_skills/*.md`
  - 故事题材技能 (`story_skills`)：12 种题材（如悬疑、甜宠、玄幻），每种含 `driector_skills/*.md`
- **CanvasPro 策略**：fork CanvasPro 自己的版本，Toonflow 的仅作参考。

### 1.18 事件状态机（State）

各表的 `state` / `*State` 字段在系统内有统一枚举，避免散落定义：

| 表 | 字段 | 取值 |
| --- | --- | --- |
| `o_assets` | `promptState` | `未生成` / `生成中` / `已完成` / `生成失败` |
| `o_assets` | `audioBindState` | （数字）未绑定 / 已绑定 |
| `o_script` | `extractState` | （数字）未拆分镜 / 拆分镜中 / 完成 / 失败 |
| `o_storyboard` | `state` | `未生成` / `生成中` / `已完成` / `生成失败` |
| `o_image` | `state` | 同上 |
| `o_video` | `state` | 同上 |
| `o_novel` | `eventState` | （数字）未抽事件 / 抽取中 / 完成 / 失败 |
| `o_tasks` | `state` | `pending` / `running` / `done` / `failed` |

> 后续 Python 实现应用枚举类承载，避免字符串字面量遍地。

---

## 2 · Agent 层术语

### 2.1 三层 Agent 架构（Three-tier Agent）

> ⚠️ **实现说明（v0.2 补）**：本节描述的是 **Toonflow 的参考范式**，是理解"决策/执行/监督"概念的词汇表。**CanvasPro 短剧版不照此实现**——按 `05-decisions.md D3`，用**单层 `agentRuntime` + skill 按 `role` 分组**模拟三层效果。下文 `run_sub_agent_*` / DecisionAgent / ExecutionAgent / SupervisionAgent 均为 Toonflow 术语，CanvasPro 对应物是 `director.*` / `production.*` / `supervisor.*` 三类 skill。术语保留以便查 Toonflow 文档，实现以 04/05 为准。

Toonflow 的核心范式：每个业务 Agent（ScriptAgent / ProductionAgent）拆为三层。

```
┌─────────────────────────────────────────┐
│  决策层 DecisionAgent                    │ ←—— 用户对话入口
│  （"统筹" / "视频策划"）                  │
│   职责：拆任务、选子Agent、调度          │
└────────────┬────────────────────────────┘
             ↓ 分派
┌─────────────────────────────────────────┐
│  执行层 ExecutionAgent (多个子Agent)     │ ←—— 真正干活
│  （"编剧" / "执行导演"）                  │
│   职责：写骨架/剧本/分镜表/分镜面板…       │
└────────────┬────────────────────────────┘
             ↓ 产出
┌─────────────────────────────────────────┐
│  监督层 SupervisionAgent                 │ ←—— 校验质量
│  （"编辑" / "监制"）                      │
│   职责：检查规范、提建议、不直接改写      │
└─────────────────────────────────────────┘
```

### 2.2 决策层（DecisionAgent）

- **定义**：直接面向用户的 Agent。负责理解需求、规划步骤、按需调用执行层与监督层。
- **命名约定**：
  - 在 ScriptAgent 下叫「**统筹**」
  - 在 ProductionAgent 下叫「**视频策划**」
- **代码位置**：`src/agents/*/index.ts` 中的 `runDecisionAI` 函数。
- **配置键**：`scriptAgent:decisionAgent`、`productionAgent:decisionAgent`（在 `o_agentDeploy` 表中绑定模型）。

### 2.3 执行层（ExecutionAgent）

- **定义**：决策层调用的若干个**专精子 Agent**。每个子 Agent 对应一个明确产出（骨架、剧本、分镜表…）。
- **命名约定**：
  - 在 ScriptAgent 下统一显示「**编剧**」
  - 在 ProductionAgent 下统一显示「**执行导演**」
- **当前子 Agent 清单**（CanvasPro 短剧版需对齐）：

  **ScriptAgent 侧**：
  - `run_sub_agent_storySkeleton` —— 写故事骨架
  - `run_sub_agent_adaptationStrategy` —— 写改编策略
  - `run_sub_agent_script` —— 写分集剧本

  **ProductionAgent 侧**：
  - `run_sub_agent_derive_assets` —— 衍生资产分析与信息写入
  - `run_sub_agent_generate_assets` —— 衍生资产图像生成
  - `run_sub_agent_director_plan` —— 写拍摄计划
  - `run_sub_agent_storyboard_table` —— 写分镜表
  - `run_sub_agent_storyboard_panel` —— 写分镜面板
  - `run_sub_agent_storyboard_gen` —— 分镜图像生成

### 2.4 监督层（SupervisionAgent）

- **定义**：独立的质量评审 Agent。不改稿，只评分 / 提建议 / 标问题。
- **命名约定**：ScriptAgent 下叫「**编辑**」，ProductionAgent 下叫「**监制**」。
- **触发方式**：决策层主动调用 `run_sub_agent_supervision` 或 `run_supervision_agent`。
- **配置键**：`scriptAgent:supervisionAgent`、`productionAgent:supervisionAgent`。

### 2.5 ResTool / 消息流

- **ResTool**：Toonflow 的对话协议封装（`src/socket/resTool.ts`）。负责把 LLM 流式输出包装成「消息块」，前端按块渲染。
- **消息类型**：
  - `text`：正文流式输出
  - `thinking`：思考过程折叠块（带标题、内容、完成态）
  - `tool_call` / `tool_result`：工具调用与回包（在 thinking 内呈现）
- **CanvasPro 映射**：复刻同一协议；前端短剧侧的聊天面板直接复用此渲染。

### 2.6 记忆（Memory）

- **定义**：每个 Agent 独立的对话记忆体。三层结构：
  - **短期 (shortTerm)**：最近 N 条对话
  - **摘要 (summaries)**：滚动压缩历史
  - **RAG (rag)**：基于 embedding 的语义检索
- **Toonflow 表**：`memories`（见 `src/types/database.d.ts:4-15`）
  - 关键字段：`role`、`content`、`embedding`、`type`、`summarized`、`isolationKey`、`relatedMessageIds`
- **隔离键 (isolationKey)**：通常为 `{projectId}:{episodeId}` 或 `{projectId}`，确保不同项目/集的记忆互不干扰。
- **CanvasPro 实现**：embedding 沿用 ONNX 本地模型（已存在），Python 侧用 `sqlalchemy` 持久化。

### 2.7 工作区数据键（FlowData Key）

`get_flowData` 工具的 `key` 参数枚举（Toonflow 参考：`src/agents/productionAgent/tools.ts:55`）：

| key | 中文标签 | Toonflow 形态 | CanvasPro 形态（D5） |
| --- | --- | --- | --- |
| `script` | 剧本内容 | string | string（只读，DB 来） |
| `scriptPlan` | 拍摄计划 | string | string |
| `assets` | 衍生资产 | `AssetItem[]` | 摘要 `{id,name,type}[]`，全量走 `o_assets` |
| `storyboardTable` | 分镜表 | string | `{ nodeId }` 指针 |
| `storyboard` | 分镜面板 | `Storyboard[]` | 摘要，已落 `o_storyboard` |

> 剧本工作室侧的工作区数据键不同（含 `storySkeleton`、`adaptationStrategy`），02-pipeline.md §3.2 详述。CanvasPro 不照搬 Toonflow string 形态，详见 §1.15 实现差异。

---

## 3 · 工程层术语

### 3.1 项目类型（projectType）

- **取值**：
  - `freeform` —— 自由画布模式（CanvasPro 历史用法，纯创作工具，无短剧业务流）
  - `shortdrama` —— 短剧项目（本次新增，激活剧本工作室 + 生产画布两页面 + 分集逻辑；按 D3 共用一个 `agentRuntime`，切 role 暴露 `director.*` / `production.*` skill）
- **存储**：`o_project.projectType`（字段已存在）
- **路由作用**：前端首页据此分流到不同工作台；后端据此加载不同 role 的 skill 子集（非不同 Agent 进程）。

### 3.2 模型配置（Model Config）

- **三段表**：
  - `o_vendorConfig`：供应商配置（API key、可用模型列表、启用开关）
  - `o_agentDeploy`：Agent 配置（每个 Agent 绑定哪个模型、温度、maxTokens、系统提示词覆盖）
  - `o_modelPrompt`：模型级提示词（同一供应商不同模型的提示词差异）
- **配置键格式**：`agentName:subAgentName`，如 `productionAgent:decisionAgent`、`scriptAgent:storySkeletonAgent`。
- **CanvasPro 沿用**：表结构不变，Python 侧重写读取逻辑。

### 3.3 任务（Task）

- **定义**：长时运行的异步生成任务的状态记录（生图、生视频、抽事件等）。
- **Toonflow 表**：`o_tasks`（见 `src/types/database.d.ts:188-198`）
  - 关键字段：`taskClass`、`describe`、`state`、`startTime`、`relatedObjects`、`model`、`reason`
- **CanvasPro 现状**：已有自己的任务表与队列，需评估迁移/合并策略（见 01-architecture.md 的"决策记录"）。

### 3.4 流（Flow / ImageFlow）

- **定义**：图像生成的工作流配置（ComfyUI 风格的节点图）。每个资产/分镜可能绑定一个 flow。
- **Toonflow 表**：
  - `o_imageFlow`：flow 的节点图 JSON
  - `o_assets.flowId`、`o_storyboard.flowId`：关联使用
- **CanvasPro 映射**：与现有画布的节点系统在概念上相似，可考虑共用基础设施。

### 3.5 OSS / 静态资源目录

- **OSS 目录**：用户数据根目录下的 `oss/`，存放生成产物（图、视频、音频）。
- **路径解析**：`u.getPath("oss")` —— 自动识别 Electron 用户数据目录。
- **CanvasPro 映射**：现有 `data/assets/`、`data/uploads/`、`output/` 三套目录与此对应；Python 侧统一抽 `getPath()` 工具。

### 3.6 命名空间（Socket Namespace）

- Toonflow 前后端通信用 Socket.IO 命名空间区分 Agent：
  - `/api/socket/productionAgent`
  - `/api/socket/scriptAgent`
- **CanvasPro 沿用**：Python 端用 `python-socketio` 注册同名命名空间。
- **事件协议**：`getFlowData` / `addStoryboard` / `generateStoryboard` / `addDeriveAsset` / `delDeriveAsset` / `generateDeriveAsset` 等，由画布响应。

---

## 4 · 反义对照表（容易混淆的术语）

| 用 A，不要用 B | 原因 |
| --- | --- |
| 「集 (Episode)」not 「分集」 | 「分集」是动词，名词用「集」 |
| 「章节 (Chapter)」not 「章」 | 「章」太短易撞码字段，用「章节」 |
| 「分镜 (Storyboard)」单数 not 「分镜们」 | 中文用上下文区分单复数，UI 标签上单数即可 |
| 「分镜表」not 「分镜清单」 / 「镜头表」 | 与 Toonflow 对齐，便于检索代码 |
| 「拍摄计划」not 「导演手册」 | 「导演手册 (directorManual)」是项目级风格说明，另有其字段 |
| 「资产 (Asset)」not 「素材 (Material)」 | 「素材」太泛，且 Toonflow 全用 asset |
| 「画布 (Canvas)」not 「画板」 / 「工作台」 | 沿用 CanvasPro 既有命名 |
| 「工作区数据」not 「画布数据」 | 「画布数据」语义偏图形；业务数据用「工作区数据」 |
| 「短剧 (Short Drama)」not 「短片」 | 短片≠短剧，垂直市场不同 |

---

## 5 · 待补充列表（V1+）

以下术语在 MVP 后引入，先占位：

- **音轨 (Track)** / **音轨ID (trackId)** —— `o_storyboard.track` / `trackId`
- **视频轨 (VideoTrack)** —— `o_videoTrack` 表
- **海报 (Poster)** —— `posterItemSchema`，项目封面
- **封面 (Cover)** —— 项目工作区的 `workbenchDataSchema.cover`
- **渐变 (Gradient)** —— 项目主题色 `workbenchDataSchema.gradient`
- **导出包 (Export Bundle)** —— 一键导出剪辑序列 / Final Cut XML
- **预览版本 (Preview Version)** —— 同一集的多个候选剪辑

---

## 附录 · 命名规则速查

- **数据库表**：`o_` 前缀沿用，新表也用此前缀（如 `o_episode` 而非 `episode`）
- **字段**：camelCase（如 `videoDesc`、`shouldGenerateImage`）
- **Agent 子工具**：`run_sub_agent_*` / `add_*` / `del_*` / `get_*` / `generate_*` 动词前缀
- **Skill 文件名**：`{业务域}_{子域}_{动作}.md`（如 `production_execution_storyboard_panel.md`）
- **配置键**：`{agentName}:{subAgentName}`（如 `productionAgent:storyboardPanelAgent`）
- **前端 UI 文案**：中文为主，仅在术语首次出现处加英文括注

---

**版本**：v0.2 · 加 D3/D5 实现差异补注
**最后修订**：2026-06-29
**变更**：§1.15 / §2.1 / §2.7 / §3.1 加 CanvasPro 实现口径（单 runtime + skill 分组、storyboardTable 存 nodeId、workspaceData 瘦身）；术语保留 Toonflow 词汇以便查文档，实现以 04/05 为准
**下一步**：四文档集已对齐，进入 Phase A.0 施工
