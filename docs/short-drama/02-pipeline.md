# 02 · 流水线 (Pipeline)

> **目的**：把用户从「新建项目」到「导出一集」走完的完整路径钉死。每个阶段：**输入 / 产出 / 责任方 / 工作区数据键 / Skill / 数据库写入**。
> **术语**：严格按 `03-glossary.md`。文中出现的中文术语都能在术语表里查到。
> **配套图**：阶段图、状态机图、数据流图，全部用 ASCII，方便 PR diff。

---

## 0 · 流水线全景图

```
┌──────────────────────────────────────────────────────────────────────┐
│                          短剧项目生命周期                              │
└──────────────────────────────────────────────────────────────────────┘

  ① 新建项目                                                          
     ↓                                                                
     projectType = shortdrama                                         
     画风 + 模型 + 题材 + 视频比例                                       
                                                                      
  ② 输入                                                              
     ┌────────────────┬────────────────┬────────────────┐               
     │ A. 小说改编     │ B. 直接粘剧本   │ C. 与编剧对话   │               
     │  上传 .txt/粘贴 │  粘剧本到编辑器  │  自然语言生成    │               
     └────────┬───────┴────────┬───────┴────────┬───────┘               
              ↓                ↓                ↓                      
                                                                      
  ③ 剧本工作室                       ←——— agentRuntime · role='director'   
     ┌─────────────────────────────────┐                              
     │  章节解析 → 故事骨架 → 改编策略   │                              
     │           → 分集 → 各集剧本      │                              
     └────────────┬────────────────────┘                              
                  ↓ 用户选「这一集开始拍」                                
                                                                      
  ④ 生产画布                        ←——— agentRuntime · role='production'  
     ┌─────────────────────────────────┐                              
     │  资产分析 → 衍生资产 → 资产生图  │                              
     │  → 拍摄计划 → 分镜表 → 分镜面板  │                              
     │  → 分镜出图 → 分镜出视频         │                              
     └────────────┬────────────────────┘                              
                  ↓ 用户审稿                                            
                                                                      
  ⑤ 剪辑 / 配音 / 导出                                                  
     ┌─────────────────────────────────┐                              
     │  画布 → 时间轴 → MP4 / FCP XML  │                              
     └─────────────────────────────────┘                              
                                                                      
        循环：回到 ③ 选下一集
```

各阶段的责任方：

| 阶段 | 主要参与者 |
| --- | --- |
| ① 新建项目 | 用户 + 系统模板 |
| ② 输入 | 用户 |
| ③ 剧本工作室 | agentRuntime（role='director'，含 `director.*` + `supervisor.*` skill）+ 用户 |
| ④ 生产画布 | agentRuntime（role='production'，含 `production.*` + `supervisor.*` skill）+ 用户 |
| ⑤ 剪辑导出 | 用户 + 现有剪辑模块 |

> **术语备注**：本文 v0.2 起，"ScriptAgent"/"ProductionAgent" 已退役为**直觉概念**——它们**不是**独立 Agent 进程或独立 runtime，而是同一个 `agentRuntime` 切 `role` 参数后呈现出的两种行为模式（详见 §3.1 / §4.2 与 `05-decisions.md D3`）。文档后续如出现这两个词，仅作章节标题/历史称呼，不代表代码层有该类。

---

## 1 · 阶段 ①：新建项目

### 1.1 用户操作

1. 在首页点「**新建项目**」
2. 选择**项目类型**：`shortdrama`（本流程）/ `freeform`（旧自由画布，走原 CanvasPro 流程）
3. 填写元数据：
   - **项目名**
   - **画风**（从 `art_skills/` 11 种中选，如「水墨」、「二次元」、「写实」）
   - **题材**（从 `story_skills/` 12 种中选，如「玄幻」、「都市」、「甜宠」）
   - **图像模型**（如 `flux:dev`、`sd-xl`）
   - **视频模型**（如 `kling:v2`、`runway:gen3`）
   - **视频比例**（9:16 竖屏 / 16:9 横屏）
   - **导演手册** (`directorManual`, 可选) —— 项目级风格说明
4. 点「**创建**」

### 1.2 系统动作

```
o_project  INSERT
  name, projectType='shortdrama', artStyle, imageModel, videoModel,
  videoRatio, directorManual, mode, createTime, userId
```

- 立即为该项目生成**项目根目录**（`oss/{projectId}/`）
- 初始化**项目级工作区数据**（空骨架占位）：
  ```
  workspaceData: {
    novel: '',
    storySkeleton: '',
    adaptationStrategy: '',
    scriptList: []
  }
  ```
- 跳转到**剧本工作室**页面（阶段 ③）

### 1.3 设计要点

- **画风与题材的双选**决定了后续可激活的 Skill 集合（见 `productionAgent/index.ts:377-396` 的 `createArtSkills`）
- 项目类型一旦选定**不可改**（改类型 = 数据结构换轨，不值得做）
- 模型选择**项目级**默认值，集级别可覆盖（V1+）

---

## 2 · 阶段 ②：输入

三条互斥的输入路径，用户在剧本工作室页面选一条进入。

### 2.A 小说改编（核心路径）

**用户操作**：

- 上传 `.txt` / `.md` 文件，或粘贴长文本
- 系统按用户标记（章节标题正则）或长度阈值自动分章

**系统动作**：

```
o_novel  INSERT 多行 (一行 = 一章)
  chapter (章节标题), chapterData (正文),
  chapterIndex (顺序), projectId
```

**阶段 A 含事件抽取**（完整成品立场，按 §7.1 + §10 决策 4）：
- 解析后跑事件抽取，写 `o_event` / `o_eventChapter`（骨架质量靠它，不砍）
- `o_novel.event` / `eventState` 标记抽取进度
- 故事骨架由 `director.chapter-event-extract` 先抽事件，再喂 `director.story-skeleton`

### 2.B 直接粘剧本

**用户操作**：贴入已有的可拍摄剧本（单集或多集）

**系统动作**：

```
o_script  INSERT
  name='第N集' (用户填或自动编号),
  content='剧本正文',
  extractState=0 (未拆分镜),
  projectId
```

- 跳过整个剧本工作室阶段，直接进入生产画布

### 2.C 与编剧对话

**用户操作**：在剧本工作室的对话框直接说「帮我写一个『XX题材』的 1 分钟短剧」

**系统动作**：

- 由 `agentRuntime`（role='director'）的 planner 接管，按 D7 二次调用模式
- 自动串调 `director.story-skeleton` → `director.episode-split` → `director.episode-script`
- 与小说改编路径殊途同归

### 2.D 路径选择规则

| 用户给了什么 | 走哪条 |
| --- | --- |
| 长文本（>3000 字）含章节 | A |
| 短文本（<3000 字）含场景/对白格式 | B |
| 啥都没有，只有一句创意 | C |

---

## 3 · 阶段 ③：剧本工作室

> **v0.2 修订**：原 v0.1 说"三层 Agent（决策/执行/监督）"是 Toonflow 范式。按 D3 决策，实际通过**单 Agent + skill 按类别分组**实现。下面更新为修订后的设计。

### 3.1 Agent 角色机制（按 D3）

- **物理上**：CanvasPro 现有的单 `agentRuntime`，不分层
- **逻辑上**：通过 `role='director'` 参数，让 `agentContextBuilder` 只暴露 `director.*` + `supervisor.*` 类 skill
- **用户视角**：在剧本工作室对话面板里，感觉像在和"统筹/编剧/编辑"三角色合作；其实是同一个 Agent 在拿不同 skill

```
agentRuntime (单层)
   ↓ role='director'
context.skills = director.* + supervisor.* (共 ~10 个 skill)
   ↓
planner 选 skill,出 plan
   ↓
canvasCommands 执行
```

**三种"角色"对应的 skill 命名**（按 D3 D2）：

| 直觉角色 | skill 命名前缀 | 阶段 A 含哪些 |
| --- | --- | --- |
| 统筹（决策） | 无独立前缀，融入 planner system prompt | 由 LLM 决定调用哪个 skill |
| 编剧（执行） | `director.*` | story-skeleton / adaptation-strategy / episode-split / episode-script / chapter-event-extract |
| 编辑（监督） | `supervisor.*` | script-quality / consistency-check |

### 3.2 工作区数据键

剧本工作室的工作区数据存到 `o_agentWorkData`（key 字段区分）：

| key | 中文 | 形态 | 写入者 |
| --- | --- | --- | --- |
| `novel` | 小说原文 | string | 用户上传时不存（直接走 `o_novel` 表） |
| `chapters` | 章节摘要 | `Chapter[]` | 不存（直接查 `o_novel`） |
| `storySkeleton` | 故事骨架 | string | `director.story-skeleton` skill |
| `adaptationStrategy` | 改编策略 | string | `director.adaptation-strategy` skill |
| `scriptList` | 分集剧本列表摘要 | `Script[]` | 不存（直接查 `o_script`） |

> v0.2 修订：**不**像 v0.1 把所有键都塞 workspaceData。`novel` 和 `scriptList` 直接走数据库表更干净；只把"工作区计算产物"（骨架/策略）存 workspaceData。

### 3.3 工作流

#### Step 3.1 故事骨架（StorySkeleton）

**触发**：用户在对话框说「写骨架」。

**Skill**：`director.story-skeleton`（位置 `<userData>/skills/director/story-skeleton.skill.md`）

**调用链**（按 D7 + D4）：
```
agentRuntime ← role='director'
   ↓
buildPlannerPrompt:
  - skills 子集 = director.* + supervisor.*
  - canvas context 含 novelChapters (前 N 章摘要)
   ↓
LLM 选 'director.story-skeleton' skill,出 plan
   ↓
plan.actions = [{ type: 'workspace.setField', args: { key: 'storySkeleton', value: '...' }}]
   ↓
执行 → IPC 'project:saveWorkData' → o_agentWorkData 写入
   ↓
UI 大纲区刷新
```

**产出物**：全剧主线 + 核心人物 + 世界观 + 风格基调。

**何时回写**：plan 执行成功后一次性写入（非流式，按 D4）。

#### Step 3.2 改编策略（AdaptationStrategy）

**前置**：骨架已完成。

**Skill**：`director.adaptation-strategy`

**调用链**（同骨架，skill 切换为 adaptation-strategy）：
- LLM 读 `workspaceData.storySkeleton + novelChapters` → 生成策略文本
- 写入 `workspaceData.adaptationStrategy`

**产出物**：节奏调整 + 爽点设计 + 人物简化 + 集数规划。

#### Step 3.3 分集 + 剧本

**两阶段**：

**3.3.a 分集**（`director.episode-split` skill）：
- 输入：策略 + 章节
- 输出：plan.actions 含多个 `script.create` 动作（创建 `o_script` 多行）
- 每行 `content=''`，等待后续填充

**3.3.b 写各集剧本**（`director.episode-script` skill）：
- 用户在剧本列表里点某一集 → 触发该集剧本生成
- 输入：`storySkeleton + adaptationStrategy + 集编号 + 上集剧本（如有）+ 关联章节正文`
- 输出：plan.actions 含 `script.setContent` 动作（写 `o_script.content`）

**剧本格式约定**：
```
【场景 1·内·主角房间·夜】
（人物：李明、王芳）

李明走进房间，关上门。
李明：（低声）今晚必须解决这件事。
王芳从衣柜里走出来：你回来了。
……
```

#### Step 3.4 编辑评审（可选）

- 用户在任何阶段点工作室右上角"让编辑看看" → 调 `supervisor.script-quality` skill
- skill 输出**评审报告**（写入 conversation 但**不**修改稿件）
- 用户可据此让 director 类 skill 重做某步

### 3.4 用户的交付物

阶段 ③ 结束时：

- `o_novel`：N 行（每章一行）
- `o_agentWorkData (key='storySkeleton')`：1 篇骨架
- `o_agentWorkData (key='adaptationStrategy')`：1 篇策略
- `o_script`：M 行（每集一行，`content` 已填）

用户选一集，点「**开拍**」，进入阶段 ④。

---

## 4 · 阶段 ④：生产画布（role='production'）

> 这是 CanvasPro 最强势的部分——**每一集独占一块画布**。一集的资产、分镜、生图、剪辑全部在这块画布上发生。

### 4.1 切集即切画布

```
用户在剧本工作室点「第 3 集 · 开拍」
   ↓
系统：
  - 找/建该集的 canvasId (一对一)
  - 加载该 canvas 的 workspaceData
  - 加载该 canvas 的 canvasState（节点、视图）
  - 跳转到生产画布页面
```

**对应表**：

```
o_agentWorkData
  projectId, episodesId (= o_script.id),
  key='canvas', data=画布的 workspaceData JSON
```

### 4.2 Agent 角色机制（按 D3：单层 runtime + skill 分组）

生产画布**不**起独立 Agent 进程，**不**做三层多 Agent。沿用 CanvasPro 现有的单层 `agentRuntime`，靠 `role` 参数切换 skill 子集（同剧本工作室的机制，详见 §3.1）：

```
画布右侧聊天面板
   ↓ role='production'
context.skills = production.* + supervisor.* + 通用 4 技能
   ↓
planner 选 skill,出 plan
   ↓
canvasCommands / socket 执行
```

**三种"直觉角色"对应的 skill 命名**（按 D3 D2）：

| 直觉角色 | skill 命名前缀 | 阶段 A 含哪些 |
| --- | --- | --- |
| 视频策划（决策） | 无独立前缀，融入 planner system prompt | 由 LLM 决定调用哪个 skill |
| 执行导演（执行） | `production.*` | derive-assets-analysis / derive-assets-generate / director-plan / storyboard-table / storyboard-panel / storyboard-image-gen / storyboard-video-gen |
| 监制（监督） | `supervisor.*` | storyboard-quality / asset-consistency |
| 通用底座 | 现有 4 技能 | text-to-image / text-to-video / image-to-video / batch-layout（出图出视频时被 production skill 间接调用） |

> 与 Toonflow 的差异：Toonflow 用 `run_sub_agent_*` 起 7 个独立子 Agent；CanvasPro 把这 7 件事做成 7 个 `production.*` skill，由同一个 planner 按对话意图选用。少了进程编排，复用现有 plan-execute 主干（D1）。

### 4.3 工作区数据键（画布侧）

画布侧的工作区数据存到 `o_agentWorkData`（按 episodesId 隔离）：

| key | 中文 | 形态 | 写入者 | 备注 |
| --- | --- | --- | --- | --- |
| `script` | 剧本内容 | string | 只读，由切集时从 `o_script.content` 复制 | 画布**不**回写剧本 |
| `scriptPlan` | 拍摄计划 | string (markdown) | `production.director-plan` skill | 自由文本，含场景/镜头/节奏 |
| `assets` | 资产摘要 | `AssetItem[]` | 用户 + `production.derive-assets-analysis` | **不存全量**，仅摘要供 prompt 选用；全量走 `o_assets` 表查 |
| `storyboardTable` | 分镜表锚点 | `{ nodeId: string }` | `production.storyboard-table` | 仅记录画布上 `StoryboardScriptNode` 的 nodeId；分镜行存在节点里 |
| `storyboard` | 分镜面板列表 | `Storyboard[]` | `production.storyboard-panel` | 已落 `o_storyboard` 表，此处仅留摘要供后续 step 引用 |

> **v0.2 修订重点**：
> - 分镜表不重复存"行内容"——`StoryboardScriptNode` 节点的 `rows[]` 是单一数据源，按 D5 复用现有节点
> - `assets` 在 workspaceData 只放摘要（`{ id, name, type }[]`），完整记录走 `o_assets`，避免 workData blob 膨胀
> - 与 Toonflow 的 `flowDataSchema` 差异：Toonflow 把 `storyboardTable` 当 XML 字符串塞 workData，CanvasPro 让 `StoryboardScriptNode` 作为数据载体，workData 只存指针

### 4.4 工作流（每集走一遍）

#### Step 4.1 资产分析（Derive Assets · Analysis）

**前置**：剧本已就位（`script` 键有值）。

**Skill**：`production.derive-assets-analysis`

**用户起手**：「分析这一集需要哪些资产」 或 planner 自动判断。

**调用链**（按 D7 + D4）：
```
agentRuntime ← role='production'
   ↓
planner 选 'production.derive-assets-analysis',出 plan
   ↓
plan.actions = [
  { type: 'asset.create', args: { name, type, desc, prompt, derive[] } },  // 每个资产一条
  ...
]
   ↓
执行 actions:
  for each asset:
    IPC 'shortdrama:asset.create' → o_assets INSERT + o_scriptAssets INSERT
    → 画布添加 asset-card 节点（D5 新增节点类型）
```

**产出物**：
- 主角、配角、关键道具、关键场景的资产清单
- 每个资产含 `name`、`type`、`desc`、`prompt`、`derive[]`
- 画布上以 **asset-card 节点**形式可视化

#### Step 4.2 资产生图（Derive Assets · Generate）

**前置**：资产清单已写入。

**Skill**：`production.derive-assets-generate`

**调用链**：
```
planner 选 'production.derive-assets-generate'
   ↓
skill 内部引用画风 prompt 模板（项目级配置的画风 skill）
   ↓
plan.actions = [
  { type: 'generation.run', args: { assetId, prompt, model } },  // 复用现有通用技能 text-to-image
  ...
]
   ↓
执行：生图任务入 o_tasks 队列 → 写 o_image → 回包 filePath
   ↓
asset-card 节点显示图（socket 实时更新）
```

> **复用点**：实际生图动作落到现有通用技能 `text-to-image` / `generation.run` 命令，`production.derive-assets-generate` 只负责"为每个资产组织合适的 prompt 词条 + 选画风"。

**异步性**：生图耗时长，任务并发跑；前端订阅更新。

#### Step 4.3 拍摄计划（Director Plan）

**前置**：剧本就位（资产是否就位不强约束）。

**Skill**：`production.director-plan`

**调用链**：
```
planner 选 'production.director-plan'
   ↓
LLM 读 script → 输出拍摄计划正文
   ↓
plan.actions = [{ type: 'workspace.setField', args: { key: 'scriptPlan', value: '...' }}]
   ↓
执行 → o_agentWorkData 写入
```

**产出物**：
- 场景规划（几场，每场多长）
- 镜头风格（特写/中景/远景比例，运镜偏好）
- 关键画面预想（开场镜头、高潮镜头）
- 节奏控制（前 10 秒钩子，30 秒反转）

#### Step 4.4 分镜表（Storyboard Table）

**前置**：拍摄计划就位。

**Skill**：`production.storyboard-table`

**调用链**（按 D5：直接落 `StoryboardScriptNode`）：
```
planner 选 'production.storyboard-table'
   ↓
LLM 读 script + scriptPlan + assets 摘要
   ↓
plan.actions = [
  { type: 'node.create', args: { type: 'storyboard-script', rows: [...] }}
]
   每行 row = { 镜号, 时长, 景别, 场景, 画面描述, 角色, 对白, 音效, 图片提示词, 视频提示词 }
   ↓
执行 → 画布新增 StoryboardScriptNode（现有节点，15 列已满足，D5）
   ↓
workspaceData.storyboardTable = { nodeId }
```

**格式参考**（落到 StoryboardScriptNode 的 rows）：

| 镜号 | 时长 | 景别 | 画面描述 | 对白 | 角色 |
| --- | --- | --- | --- | --- | --- |
| 1 | 3s | 特写 | 主角眼神 | - | 主角@惊讶 |
| 2 | 5s | 中景 | 主角走入房间 | 台词A | 主角@默认 |

**作用**：给人审，过审后才出图。分镜表与分镜面板**合一**——`StoryboardScriptNode` 既是表（list 视图）又是面板（card 视图），靠节点自带的 `viewMode: 'list' | 'card'` 切换（D5）。

#### Step 4.5 分镜面板（Storyboard Panel）

**前置**：分镜表就位（已被用户审阅）。

> **按 D5 的关键变更**：CanvasPro **不**新增独立"分镜面板节点"。分镜面板就是 `StoryboardScriptNode` 切到 `viewMode='card'` 的视图。Toonflow 的"先表后面板"两步在这里合并——同一节点，两种视图。

**Skill**：`production.storyboard-panel`（用于在表的基础上**补全**面板字段）

**调用链**：
```
planner 选 'production.storyboard-panel'
   ↓
LLM 读 storyboardTable 节点的 rows + assets 摘要
   ↓
plan.actions = [
  { type: 'node.updateRows', args: {
      nodeId,
      patch: 每行补全 { 图片提示词, 视频提示词, 角色图引用, shouldGenerateImage, associateAssetIds }
  }}
]
   ↓
执行 → 更新 StoryboardScriptNode 的 rows
   ↓
o_storyboard UPSERT（每行一条）+ o_assets2Storyboard 关联
```

**重要约束**：
- `associateAssetIds` 必须是真实数据库 ID，服务端校验（见 §8.2），不存在则丢弃 + warning
- `shouldGenerateImage` 决定下一步是否出图
- 行的排序 = 节点内 row 顺序，无需额外 track 字段（节点已支持）

#### Step 4.6 分镜出图（Storyboard Image Gen）

**前置**：分镜面板就位。

**Skill**：`production.storyboard-image-gen`（或用户在节点上直接点「全部生成」走现成的 `_startGeneratedImageNodes`）

**调用链**（按 D5：复用 StoryboardScriptNode 现有批量出图）：
```
用户点「全部生成」/「重生第N格」
   或 planner 选 'production.storyboard-image-gen'
   ↓
StoryboardScriptNode._startGeneratedImageNodes(rowIds)   // 现有方法
   ↓
for each row:
  读 row.图片提示词 + 关联资产的 imageRef（保一致性）
  generation.run（text-to-image，带资产参考图）
  o_image INSERT, o_storyboard.filePath UPDATE
   ↓
节点对应格显示图
```

> **复用点**：`StoryboardScriptNode` 已有 `_startGeneratedImageNodes` 批量派发逻辑（见 04-current-stack.md），阶段 A 直接接上，无需重写。

**串行化**：批量出图走渲染端的串行队列（参考 Toonflow 的 `socketQueue(800)` 思路），避免任务洪峰假死。

#### Step 4.7 分镜出视频（Storyboard Video Gen）

**前置**：分镜图已就位。

**Skill**：`production.storyboard-video-gen`（或用户在节点上把 `mediaMode` 切到 `video` 后点「全部出片」）

**调用链**（按 D5：复用 StoryboardScriptNode 的 video 模式 + 现有 image-to-video 通用技能）：
```
用户把节点 mediaMode 切到 'video' → 点「全部出片」/「重生第N格视频」
   或 planner 选 'production.storyboard-video-gen'
   ↓
for each row (shouldGenerate):
  读 row.filePath (关键帧) + row.视频提示词
  选 videoModel (项目级配置)
  generation.run（image-to-video，i2v：kling / runway / wan / 即梦）
  o_video INSERT, o_storyboard.filePath UPDATE (覆盖为视频路径)
   ↓
节点对应格显示视频
```

> **复用点**：`StoryboardScriptNode` 已有 `mediaMode: 'image' | 'video'` 切换（见 04-current-stack.md）。视频派发复用现有通用技能 `image-to-video` / `text-to-video`，`production.storyboard-video-gen` 只负责组织 prompt + 选模型。

**多参模式 (isRef)**：项目配置里视频模型若支持多图参考（首帧+尾帧），系统传两张图代替一张。

**串行化**：与出图同样走渲染端串行队列。视频任务更耗时（30s-3min/个），UI 必须显式提示进度。

### 4.5 用户的交付物

阶段 ④ 结束时，单集画布上：

- 1 张画布，含若干 **asset-card 节点** + 1 个 **StoryboardScriptNode**（分镜表/面板合一）
- `o_assets`：N 条，含衍生
- `o_scriptAssets`：N 条
- `o_storyboard`：M 条（= 节点 M 行），每条有图（或图 + 视频）
- `o_image` / `o_video`：附带的媒体记录

---

## 5 · 阶段 ⑤：剪辑 / 导出

### 5.1 画布 → 时间轴

画布上的分镜节点按 `track + index` 排序，自动映射为一条时间轴。CanvasPro 已有时间轴模块（在 `electron/` 中可见线索），沿用并扩展：
- 多 track 即多视频轨（`o_videoTrack`），支持画面/字幕/配音/BGM 分层
- 节点的 `duration` 自动同步到时间轴片段长度
- 用户可在画布上手动拖拽改顺序，时间轴实时跟随

### 5.2 配音（TTS）

**链路**：
```
角色资产 (o_assets type='role')
   ↓ 配音绑定
o_assetsRole2Audio  ←———— 用户在资产库给角色挑配音音色
   ↓
剧本台词解析（who 说什么）
   ↓
TTS 生成（按音色 + 文本）
   ↓
o_video (type='audio') 或独立音频表
   ↓
时间轴音轨自动对齐
```

- 音色库：项目级共享，挑过的角色音色全集通用
- 多角色对话场景：按台词归属切片，分别 TTS

### 5.3 字幕

- 从剧本台词 + TTS 时长自动生成 SRT/VTT
- 渲染到时间轴字幕轨
- 风格预设（字体、位置、描边）项目级配置

### 5.4 BGM / 音效

- 用户拖入音频文件 → 画布上音效节点 → 时间轴音轨
- V2 可接 AI 配乐（按情绪标签生成）

### 5.5 导出格式

完整成品系统提供三种导出：

**A. MP4 直出**：
- 画布渲染服务把时间轴序列化成 ffmpeg 命令
- 后台 ffmpeg 合成（视频 + 音频 + 字幕烧录或软字幕）
- 输出 `output/{projectId}/episode-{N}.mp4`

**B. 工程包导出**（专业剪辑用）：
- Final Cut Pro XML (.fcpxml)
- Premiere XML / DaVinci Resolve XML
- 含所有素材路径 + 时间轴片段 + 转场/字幕信息

**C. 素材包导出**（社媒分发用）：
- 关键帧 PNG 序列 + 视频片段 + 音频片段 + metadata JSON
- 配套竖屏/横屏双比例（已有 videoRatio 字段）

---

## 6 · 画布与剧本工作室的桥

这是整个系统最关键的接口。需要明确：

### 6.1 物理边界

- **剧本工作室**：独立页面（左：编辑器，右：agentRuntime 对话面板，role='director'）
- **生产画布**：独立页面（中央：无限画布，右：agentRuntime 对话面板，role='production'）
- 二者用顶部 Tab / 集列表切换
- 同一个 `agentRuntime` 实例，在两页面间切换时通过 `role` 参数切 skill 子集（按 D3）

### 6.2 数据边界

```
剧本工作室                          生产画布
   ↓ 写入                              ↑ 读取
   o_script.content                    workspaceData.script (只读)
   o_novel.chapterData                 （不直接用）
   workspaceData.scriptList            (按 episodesId 取一行)
```

**单向流动**：剧本工作室是源，生产画布是消费者。生产画布不回写剧本（要改剧本回剧本工作室改）。

### 6.3 切换语义

```
剧本工作室         用户点「第3集·开拍」      生产画布
    │ ─────────────────────────────────→ │
    │   带 episodeId = o_script.id        │
    │                                     │ 加载 episodeId 对应的画布
    │                                     │ 加载 o_script.content → workspaceData.script
    │                                     │ 加载该集所有 assets / storyboard
    │ ←───────────────── 用户点回退 ─────  │
```

### 6.4 多集间的资产复用

- 同项目下的**资产可跨集复用**（资产库视图）
- 用户在 A 集生成的"主角@惊讶"衍生，B 集可直接拖入画布
- 数据上：`o_assets.scriptId` 改为可空，配合"全局资产" + 通过 `o_scriptAssets` 标记本集使用

---

## 7 · 分阶段交付节奏（不砍功能，按依赖排序）

> 用户立场：**做完整成品，不做最小 MVP**。Toonflow 已有的全部能力 + CanvasPro 画布优势全部要做。
> 这里规划的是"上线节奏"——每个阶段都是**可用的完整切片**，但功能纵深逐步加深。

### 7.1 阶段 A：小说改编主干贯通

**范围**：阶段 ①→②A→③→④→⑤ 全链路单集跑通。

- 项目类型 `shortdrama` 创建流程
- 小说上传 + 章节解析 + 事件抽取（`o_event` / `o_eventChapter`）
- 剧本工作室 skill 全套：`director.*`（story-skeleton / adaptation-strategy / episode-split / episode-script / chapter-event-extract）+ `supervisor.*`（script-quality / consistency-check）（按 D2 D3，单 runtime + role='director'）
- 生产画布 skill 全套：`production.*`（derive-assets-analysis/generate、director-plan、storyboard-table/panel、storyboard-image-gen/video-gen）+ `supervisor.*`（storyboard-quality / asset-consistency）（role='production'）
- 画布扩展：asset-card 节点（新增）+ StoryboardScriptNode 4 项补全（按 D5 复用现有节点）+ 数据双向绑定
- 分镜全链路：分镜表/面板（合一节点）→ 出图 → 出视频
- 单画风跑通：先做 **1 套画风 skill**（建议「都市写实」覆盖最广题材）
- 单题材跑通：先做 **1 套题材 skill**（建议「都市」）
- 导出：MP4 直出（含字幕，含 TTS 配音）

**通过标准**：把 1 章网文 → 1 集成片走通，质量达可发布水准（不是 demo 水准）。

### 7.2 阶段 B：画风/题材矩阵铺开

**范围**：在 A 的链路上横向扩 skill 库。

- 画风 fork 齐全 **11 套**（水墨/二次元/写实/3D/赛博朋克 等）
- 题材 fork 齐全 **12 套**（玄幻/都市/甜宠/悬疑/古装 等）
- 每套 skill 配套：导演技能 + 资产生成 prompt 模板 + 分镜风格指引
- 项目可自由组合画风 × 题材（11 × 12 = 132 种 baseline）
- 用户可在项目设置里替换技能，或自行添加自定义 skill

**通过标准**：覆盖头部短剧赛道全部主流题材 + 画风。

### 7.3 阶段 C：多集 + 长项目能力

**范围**：从单集深化到完整项目（30-60 集长剧）。

- 跨集资产复用（项目级资产库 UI）
- 跨集骨架/策略一致性（编辑监督层的跨集校验）
- 项目级时间轴（多集拼接预览）
- 集列表管理：批量生成、批量重生、批量导出
- 海报/封面：`posterItemSchema` + 项目封面生成
- 项目元数据：渐变色、播放列表、对外分享页

**通过标准**：能做出一部 30 集完整短剧并整包导出。

### 7.4 阶段 D：直接粘剧本 + 创意对话路径

**范围**：补齐 ②B / ②C 两条输入路径。

- 路径 B：可拍剧本格式校验 + 自动分集
- 路径 C：纯创意对话生成完整项目（包含骨架+策略+多集剧本）
- 与路径 A 共用下游所有产线

**通过标准**：三条输入路径产出的下游质量一致。

### 7.5 阶段 E：高阶生产能力

**范围**：拉开与 Toonflow 的差距，发挥 CanvasPro 画布优势。

- 画布上**任意层级可视化**：剧本 → 章节 → 场景 → 分镜 → 资产 全部能在同一画布展开
- 节点级复用：一个角色衍生在 N 个分镜里引用，改一处全更新
- 实时协作（多人编辑同一项目）
- 版本快照：每次大改自动 snapshot，可回滚
- 跨项目模板：把一个成功项目存为模板，新项目一键继承

**通过标准**：能力上甩开 Toonflow，画布是核心竞争力。

### 7.6 阶段 F：发布与运营

**范围**：成片→平台的最后一公里。

- 多平台适配：抖音/快手/视频号竖屏，B 站/油管横屏，自动转码
- 自动剪辑预设：开头钩子、中段反转、结尾留悬念的剪辑模板
- 投放数据回流：观看数据反哺爽点优化（与项目级 directorManual 联动）
- 商业化模板：付费拆条点、广告插入位标记

**通过标准**：从生产到发布是一条龙，不止生产工具。

### 7.7 阶段优先级与依赖

```
A (主干贯通)
   ↓ 阻塞所有
B (画风/题材矩阵)  ←—— 横向扩展
C (多集/长项目)    ←—— 纵向深化（需要 A）
D (输入路径)       ←—— 与 B/C 可并行
E (画布高阶)       ←—— 需要 A + C
F (发布运营)       ←—— 需要 A，与其他并行
```

> 各阶段之间**不是大版本边界**，每个阶段内完成的功能持续合入主干，不存在"A 没做完不能开 B"。
> 但写代码时仍按 A → B/C/D 顺序排优先级。

---

## 8 · 异常路径

### 8.1 LLM 输出格式错误（XML 丢标签）

**频繁场景**：执行子 Agent 应该输出 `<storyboardItem .../>`，但 LLM 偶尔吐成 markdown 或纯文本。

**Toonflow 现状**：靠 `add_flowData_storyboard` 工具自动重试 + system prompt 强调（见 `index.ts:308` 的 `addPrompt`）。

**CanvasPro 策略**：
- Pydantic 工具签名作硬约束（schema 不匹配则 retry）
- 系统提示词反复强调 XML 格式 + 提供 1-2 个 few-shot 例子
- 监督层（V1）抽样检查

### 8.2 资产 ID 编造

**场景**：分镜面板 Agent 编造 `associateAssetsIds=[999]`，但库里无此 ID。

**Toonflow 策略**：`storyboardSchema` 字段注释「必须为真实 id」（`tools.ts:26`），但仍依赖 LLM 自律。

**CanvasPro 策略**：
- `add_flowData_storyboard` 服务端校验 ID 存在性，不存在则**丢弃该 ID** + 返回 warning
- 在 Agent 上下文里提供"当前可用资产 ID 列表"作 ground truth

### 8.3 用户中断 / 切集

**场景**：分镜出图跑到一半，用户点切到下一集。

**策略**：
- 任务在 `o_tasks` 表标记 `state=running` 持续跑
- 切集只切画布显示，不杀任务
- 完成后通过 socket 推送到对应画布（即使不在前台）

---

## 9 · 数据流总览（一图镇楼）

```
USER INPUT
  │
  ├──── 小说 ────→ o_novel ──┐
  ├──── 剧本 ──────────────┐ │
  └──── 创意 ──────────────│ │
                           │ │
                           ↓ ↓
              ┌─────────────────────────┐
              │  agentRuntime           │
              │  role='director'        │
              │  剧本工作室              │
              │  workspaceData {        │
              │    storySkeleton,       │
              │    adaptationStrategy   │
              │  }                      │
              │  (novel/chapters/script │
              │   走数据库表，不进 workData) │
              └────────────┬────────────┘
                           │ 写
                           ↓
                       o_script (集)
                           │
                  「开拍」  │ episodesId
                           ↓
              ┌─────────────────────────┐
              │  agentRuntime           │
              │  role='production'      │
              │  生产画布                │
              │  workspaceData {        │
              │    script (只读),        │
              │    scriptPlan,          │
              │    assets (摘要),        │
              │    storyboardTable      │
              │      ={ nodeId },       │
              │    storyboard (摘要)     │
              │  }                      │
              └────┬────────┬────┬──────┘
                   │ 写     │ 写  │ 写
                   ↓        ↓    ↓
              o_assets  o_storyboard  o_image / o_video
              (含衍生)   (StoryboardScriptNode 落盘)
                                   │
                                   ↓
                              剪辑 / 导出
                                   │
                                   ↓
                              MP4 / 序列帧
```

---

## 10 · 关键决策记录

> 这些是流水线设计中已拍板的事，避免后续反复讨论。详细决策书见 `05-decisions.md`（D1-D7）。

| # | 决策 | 替代方案 | 拍板理由 |
| --- | --- | --- | --- |
| 1 | 每集一块画布 | 全项目共用一块画布 | 隔离，单集复杂度可控 |
| 2 | 剧本工作室 → 画布**单向数据流** | 双向同步 | 避免冲突，画布只读剧本 |
| 3 | 资产**项目级共享** | 集级独享 | 主角不能 N 集 N 个图 |
| 4 | 阶段 A **不砍**事件抽取 | 砍枝节简化 | 完整成品立场，事件抽取是骨架质量的关键 |
| 5 | 阶段 A **不砍**改编策略 | 砍枝节简化 | 同上，是分集合理性的依据 |
| 6 | 阶段 A **要做**视频生成 | 先到分镜图 | 不出视频就不是成片，不算成品 |
| 7 | 阶段 A **要做**字幕 + TTS | 后置 | 短剧没配音没字幕不成立 |
| 8 | **单层 agentRuntime + skill 分组**（按 role） | 三层独立 Agent | D3：复用现有 plan-execute 主干，prompt 预算可控 |
| 9 | **不 fork** Toonflow Agent 代码 | fork 整套 | D1：CanvasPro 已有完整 Agent，扩展更省时 |
| 10 | 分镜表/面板**合一**用 `StoryboardScriptNode` | 新建两种节点 | D5：现有节点 70% 满足，补 4 项即可 |
| 11 | Skill 文件 = **frontmatter + markdown** | 纯 JSON 描述符 | D2：产品/编剧可改 prompt，不必动代码 |
| 12 | 画风/题材 skill 内容借鉴 Toonflow 后**自主迭代** | 直接照搬 | 差异化 + License 风险 |
| 13 | 阶段 A 先做 **1 套画风 + 1 套题材** | 一开始全做 | 单套先打磨到可发布质量，再横向铺 |
| 14 | 阶段 A **必须**通过 `supervisor.*` 监督层（可手动触发） | 砍监督简化 | 自用工作室质量优先，监督是质量基线 |

---

## 11 · 已敲定的业务决策

写本文 v0.2 时已拍板的 8 项业务决策（详见 `01-architecture.md §12` 与 `05-decisions.md D8`）：

| # | 项 | 答 |
| --- | --- | --- |
| 1 | 任务表 | 合并到 `o_tasks`（旧 `mediaTaskQueue` 数据迁移） |
| 2 | 资产库迁移 | 不迁移，短剧从零建 `o_assets`；自由画布原素材保留 |
| 3 | 用户系统 | 启用 `o_user` + JWT；团队模式默认局域网 0.0.0.0 |
| 4 | 模型供应商 UI | 扩展现有，加"Agent 绑定"子页 |
| 5 | ffmpeg | 打包自带（~80MB） |
| 6 | 画风/题材首套 | 都市写实 + 都市配对 |
| 7 | TTS | 云端为主（火山/Azure/OpenAI） |
| 8 | 视频模型 | 保持现有，用户手动添加 |

---

**版本**：v0.2 · 与 04-current-stack / 05-decisions 对齐
**最后修订**：2026-06-28
**依赖**：`03-glossary.md` v0.1, `04-current-stack.md` v0.1, `05-decisions.md` v0.1
**主要变更**（v0.1 → v0.2）：
- §3 §4 改为单层 runtime + skill 分组（按 D3）
- §4.2-4.7 重写：用 `production.*` skill 替代 `run_sub_agent_*`
- §4.4 分镜表与 §4.5 分镜面板合一到 `StoryboardScriptNode`（按 D5）
- §4.3 workspaceData 键瘦身：只存"工作区计算产物"，全量走数据库表
- §7.1 阶段 A 范围按 D1/D5 重写
- §10 决策表更新 + §11 业务决策表新增
- 移除"待回答问题"——已全部在 `01-architecture.md` 与 `05-decisions.md` 中答案化
