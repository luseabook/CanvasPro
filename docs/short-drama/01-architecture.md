# 01 · 技术架构 (Architecture)

> **目的**：把 02-pipeline 描述的产品功能，**翻译成可施工的系统设计**。
> **立场**：完整成品 + 团队模式 + 局域网内 + 本地化深度 + **扩展现有不重建**。
> **遵循**：术语严格按 03-glossary；功能边界严格按 02-pipeline 与 00-vision；技术决策严格按 05-decisions。
> **阅读对象**：核心开发者 + 与 AI 协作的 prompt 引用。

> **本文 v0.2 在 v0.1 基础上根据 04-current-stack 的现状摸底和 05-decisions 的决策做了大幅修订**。主要变化：
> - 不再 fork Toonflow Agent 代码（D1）
> - Agent 仍跑 renderer，不上 UtilityProcess 子进程（D6）
> - 分镜节点复用 `StoryboardScriptNode`（D5）
> - Skill 用 frontmatter + markdown（D2）
> - 三层 Agent 改用 skill 分组实现（D3）
> - 阶段 A 不做 streaming（D4）
> - Prompt 预算分阶段二次调用（D7）

---

## 0 · 现状摸底（CanvasPro 已有什么）

> 完整版见 `04-current-stack.md`。本节是快速索引。

### 0.1 Electron 主进程（已成熟）

- IPC 11 类、媒体任务队列、本地资源管理、远程素材导入、设备身份、混淆打包、node:test 测试

### 0.2 前端 renderer（已成熟，且远超预期）

- 完整 Agent 框架：12 个文件（`src/modules/agent/`）实现 plan-execute 范式
- **`StoryboardScriptNode` 已存在**，是 LLM 驱动的分镜表节点（15 个字段，70% 满足短剧需求）
- 完整画布命令系统（canvasCommands）、节点注册（18+ 类型）
- 多 LLM 供应商抽象（`api/aiTextApi.js` + `manifests/`）
- 生成任务生命周期（`generationTaskLifecycle.js` 等）

### 0.3 Python 后端（边缘地位）

- `server.py` 用 Python 标准库 `http.server`，主要做：媒体处理、静态资源、远程代理、配置 JSON 文件
- **不参与 AI 调用决策**，AI 调用全在 renderer 的 `aiTextApi.generateText`

### 0.4 当前缺什么（短剧版要新增）

- 数据库层（SQLite）—— 现有全 JSON 文件存
- 项目类型分流（`projectType: freeform | shortdrama`）
- 集（Episode）/ 资产库 / 小说-剧本-分镜数据模型
- 短剧专属 skill 库（markdown 文件）
- 用户系统 + JWT（团队模式）
- ffmpeg 自带打包
- 短剧专属页面（剧本工作室）+ 画布扩展（资产卡 / 集容器节点）

---

## 1 · 顶层架构

### 1.1 修订后的分层（v0.2）

```
┌─────────────────────────────────────────────────────────────────┐
│            CanvasPro 短剧版分层架构 (v0.2)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 前端 Renderer (主战场)                                       │  │
│  │  - 画布引擎 (现有)                                            │  │
│  │  - 现有 Agent 框架 (扩展)                                     │  │
│  │     • src/modules/agent/ 12 个文件 (不动主干,补 skill loader) │  │
│  │     • api/agentApi.js 的 planner (扩 system prompt,改预算逻辑)│  │
│  │  - 短剧专属页面 (新增)                                         │  │
│  │     • /script-studio  剧本工作室                              │  │
│  │     • /canvas        生产画布 (复用现有 + 短剧节点)            │  │
│  │     • /asset-library 资产库                                   │  │
│  │  - 新增节点类型 (尽量少)                                       │  │
│  │     • episode-container 集容器节点                            │  │
│  │     • asset-card 资产卡节点 (有 type/derive 字段)              │  │
│  │  - 现有节点改造                                                │  │
│  │     • StoryboardScriptNode 补 4 项 (详见 §3.2)                │  │
│  └────────────┬──────────────────────────────────────────────┘  │
│               │ IPC                                              │
│               ↓                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Electron 主进程 (扩展)                                       │  │
│  │  - 11 类 IPC handler (现有,不动)                              │  │
│  │  - 媒体任务队列 (现有,加 projectId/episodeId 字段)            │  │
│  │  - AI API 调度 (现有,不动)                                    │  │
│  │  ⊕ 数据库适配层 (新增,better-sqlite3)                         │  │
│  │  ⊕ 用户/JWT (新增,团队模式时启用)                             │  │
│  │  ⊕ 短剧专属 IPC (shortDramaIpc.js)                            │  │
│  │  ⊕ Skill loader (从 userData/skills 加载 markdown)            │  │
│  │  ⊕ ffmpeg 调度 (用打包内的二进制)                              │  │
│  └────────────┬──────────────────────────────────────────────┘  │
│               │                                                  │
│               ↓                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 持久化层 (SQLite 新增 + 现有 JSON 保留)                       │  │
│  │  - SQLite: 17 张 o_* 表 (精简后,见 §3.1)                       │  │
│  │  - JSON 文件: settings.json / config.json (现有,继续用)        │  │
│  │  - 文件系统: oss/ + uploads/ + assets/ + skills/               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Python server.py (边缘地位,基本不动)                          │  │
│  │  - 静态资源 / 媒体处理 / 远程代理 / 配置 JSON                  │  │
│  │  - 短剧业务不经过这里                                          │  │
│  │  - 团队模式时与 Electron 主进程都绑 0.0.0.0                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 核心原则

**P1：不重建，只扩展**。CanvasPro 12 个 Agent 文件 + 完整 canvasCommands + `StoryboardScriptNode` 都是宝贵资产。

**P2：renderer 优先**。Agent 在 renderer，画布在 renderer，UI 在 renderer。Electron 主进程只做 IPC + 数据库适配 + 文件 + 媒体队列。

**P3：Skill 是主要扩展点**。短剧业务的 90% 通过新增 markdown skill + 微调 system prompt 实现，**不动 Agent runtime**。

**P4：数据库是新增层**。Electron 主进程嵌 SQLite，所有跨项目的元数据（项目、集、资产、分镜、记忆）走它；现有 JSON 文件保留作配置。

### 1.3 与现有 CanvasPro 的耦合

| 现有模块 | 短剧改动 | 风险 |
| --- | --- | --- |
| `src/modules/agent/` | **不动主干**，扩 skill loader + 增 skill 摘要构造逻辑 | 低 |
| `api/agentApi.js` | 扩 system prompt 细则；改 prompt 预算逻辑（按角色取 skill 子集） | 中（要测自由画布场景） |
| `src/components/StoryboardScriptNode.js` | 补 4 项（生成态/视频派/项目集关联/资产卡支持） | 中（要保自由画布场景兼容） |
| `src/modules/canvasCommands/` | 扩 4-6 个短剧专属命令（如 `episode.create` / `asset.derive`） | 低 |
| `electron/ipc/` | 加 `shortDramaIpc.js` | 低 |
| `electron/main.js` | 初始化 SQLite；启动时检测 `team_mode`；加载 skill 目录 | 中 |
| `server.py` | **不动** | 零 |

---

## 2 · 关键技术决策（按 05-decisions 锁定）

> 本节只复述决策结论，详细论证见 `05-decisions.md`。

### 2.1 Agent 框架（D1）

**决定**：扩展 `src/modules/agent/` 现有 12 个文件，**不引入 Toonflow 的 Agent 代码**。

**实施**：
- `agentRuntime.js` / `agentActionSchema.js` / `agentActionExecutor.js` / `agentPlanValidator.js` / `agentSessionStore.js` / `agentConversationStore.js` —— **不动**
- `agentContextBuilder.js` —— 改"按当前角色取 skill 子集"（D3 D7）
- `agentCanvasSummary.js` —— 加短剧业务的 canvas 字段提取
- `agentSkillCatalog.js` —— 从硬编码 4 个 skill 改为**动态从 markdown 文件加载**（D2）
- `agentPanel.js` —— UI 加"当前角色"标签 + skill 集合提示
- `agentModelSettings.js` —— 加"按 skill 偏好覆盖默认模型"字段

### 2.2 Skill 格式（D2）

**决定**：frontmatter + markdown 双格式，老 4 个 JSON skill 平移过来。

**实施**：
- 新建 `src/modules/agent/skills/loader.js`（markdown 解析器）
- skill 文件路径：`<userData>/skills/<category>/<id>.skill.md`
- frontmatter 字段：`id / title / category / riskLevel / appliesWhen / requiredInputs / missingInputQuestions / recommendedModelKind / commands / defaultParams / preferredModel?`
- 正文为 LLM prompt（含模板插值如 `{episode_script}`）
- 启动时一次性扫描 + 缓存；watch 热重载（dev mode）

### 2.3 三层 Agent（D3）

**决定**：单 runtime + skill 按 `category` 字段分组，按"当前页面/上下文"动态暴露。

**Skill category 三类**：
- `director.*` —— 剧本工作室侧（含决策/编剧/编辑三层职能）
- `production.*` —— 生产画布侧（含视频策划/执行导演/监制三层职能）
- `supervisor.*` —— 横切的监督类（用户主动触发或自动条件触发）

**暴露规则**（在 `agentContextBuilder.js` 实现）：
- 当前页面 = `/script-studio` → 暴露 `director.*` + `supervisor.*` + （可选）原 `text-to-*` 通用 skill
- 当前页面 = `/canvas` + `projectType=shortdrama` → 暴露 `production.*` + `supervisor.*` + 原 4 个通用 skill
- 当前页面 = `/canvas` + `projectType=freeform` → 只暴露原 4 个通用 skill（保自由画布）

### 2.4 LLM 流式策略（D4）

**决定**：阶段 A 沿用 `generateText`（非流式），阶段 B 加 `generateTextStream` 路径。

**阶段 A 实施**：
- `agentApi.js` 不改流式相关代码
- Skill frontmatter 暂不支持 `streaming` 字段（阶段 B 加）

**阶段 B 预留接口**（阶段 A 不实现，仅留位）：
- `api/aiTextApi.js` 已有 streaming 能力 → 新建 `requestAgentActionPlanStream`
- `agentRuntime` 加 streaming 分支：识别 skill frontmatter 中 `streaming: true` 走流式
- UI 加流式渲染分支（边推边显）

### 2.5 分镜节点（D5）

**决定**：复用 `src/components/StoryboardScriptNode.js`，补 4 项。

**4 项补完**（详见 §3.2）：
1. 单行级别生成状态（pending / running / done / failed）
2. 视频生成直派链路（`mediaMode: 'video'` 完整跑通）
3. `projectId` + `episodeId` 字段
4. 资产卡拖入支持

### 2.6 Agent 进程位置（D6）

**决定**：Agent 在 renderer 内运行；`server.py` 不塞 AI 调用。

**实施**：
- 不引入 `UtilityProcess`
- 不为 Agent 新建子进程
- Renderer 崩溃 = UI 没了，不需要单独保护 Agent

### 2.7 Prompt 预算（D7）

**决定**：Skill 集合按角色/页面裁剪；skill 摘要进 prompt；正文按需二次调用注入。

**两轮调用模式**：

```
第一轮：选 skill
  - 用 cheap model (如 Haiku/qwen-turbo)
  - prompt 含：system + skill 摘要(id/title/appliesWhen) + 用户消息 + history
  - 输出：选中的 skill id（或 chat 直答）

第二轮：出 plan
  - 用 strong model (用户配置的 agentModel)
  - prompt 含：system + 选中 skill 的完整 markdown 正文 + 用户消息 + history + canvas context
  - 输出：完整 AgentPlan JSON
```

**阶段 A 简化**：先做单轮，所有 skill 摘要塞进去（最多 8 个所以撑得住），二轮调用阶段 B 加。

### 2.8 数据库（沿用 v0.1 决策，结合新现状修订）

**决定**：SQLite 用 `better-sqlite3`，ORM 用 `knex`，27 张表精简为 **17 张**。

**精简理由**：现有 CanvasPro 已有部分概念用其他方式表达，不必新建表：
- `o_imageFlow` —— 沿用现有 `manifests/` 系统
- `o_agentDeploy` / `o_vendorConfig` / `o_modelPrompt` —— 复用现有 `agentModelSettings` + `apimart` 配置
- `o_skillList` / `o_skillAttribution` —— 用文件系统目录结构表达（不入库）
- `memories` —— 用 `agentConversationStore` 的 localStorage（短期）+ 项目级 JSON 文件（长期）
- `o_prompt` —— 现有 prompt presets 已有，不重做
- `o_artStyle` —— 用 skill 文件目录表达（`art_skills/` 目录）

**最终保留的 17 张表**：

```
o_project           o_user              o_setting
o_novel             o_event             o_eventChapter
o_script (集)        o_storyboard       o_assets
o_assets2Storyboard o_scriptAssets     o_assetsRole2Audio
o_image             o_video             o_videoTrack
o_tasks (合并)       o_agentWorkData
```

### 2.9 任务表合并（沿用 v0.1）

**决定**：CanvasPro 的 `mediaTaskQueue` 改为读写 `o_tasks` 表，旧 JSON 一次性导入。

### 2.10 资产库不迁移（沿用 v0.1）

**决定**：自由画布 `data/assets/` 不动；短剧从零建 `o_assets`。

### 2.11 用户系统（沿用 v0.1）

**决定**：默认单机 = `team_mode: false`，匿名 `o_user(id=1)`；团队模式 = 局域网 0.0.0.0 + JWT。

### 2.12 模型供应商 UI（沿用 v0.1）

**决定**：扩展 CanvasPro 现有 API Key 配置 UI，加"Agent 绑定"子页。

### 2.13 ffmpeg 自带（沿用 v0.1）

**决定**：用 `electron-builder` 的 `extraResources` 打包 ffmpeg.exe（Windows 优先）。

### 2.14 画风/题材首套（沿用 v0.1）

**决定**：阶段 A 先做 **都市写实** + **都市**配对的 skill 文件（借鉴 Toonflow 后自主迭代，按 D2/D12，非代码 fork）。

### 2.15 TTS（沿用 v0.1）

**决定**：云端为主（火山引擎/Azure/OpenAI tts）。

### 2.16 视频模型默认值（D8.8）

**决定**：保持 CanvasPro 现有视频模型接入，用户在供应商配置里手动添加，不预置默认两家。`o_project.videoModel` + `o_project.mode`（多参配置）承载选择。

---

## 3 · 模块详细设计

### 3.1 数据库 schema（17 张表）

```sql
-- 顶层
CREATE TABLE o_project (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  projectType TEXT NOT NULL DEFAULT 'freeform',  -- 'freeform' | 'shortdrama'
  artStyle TEXT,                                  -- 画风 skill 目录名
  storyStyle TEXT,                                -- 题材 skill 目录名
  imageModel TEXT,
  videoModel TEXT,
  videoRatio TEXT,                                -- '16:9' | '9:16'
  mode TEXT,                                      -- JSON 序列化的视频模型多参配置
  directorManual TEXT,                            -- 项目级风格说明
  intro TEXT,
  userId INTEGER,
  createTime INTEGER,
  updateTime INTEGER
);
CREATE INDEX idx_project_type ON o_project(projectType);
CREATE INDEX idx_project_user ON o_project(userId);

CREATE TABLE o_user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  password TEXT,                                  -- bcrypt hash
  role TEXT DEFAULT 'editor',                     -- 'owner'|'editor'|'viewer' (V1+)
  createTime INTEGER
);

CREATE TABLE o_setting (
  key TEXT PRIMARY KEY,
  value TEXT                                      -- JSON 字符串
);
-- 内置 keys: tokenKey, team_mode, app_version, db_version, ...

-- 输入侧
CREATE TABLE o_novel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projectId INTEGER NOT NULL,
  chapter TEXT,                                   -- 章节标题
  chapterData TEXT,                               -- 章节正文
  chapterIndex INTEGER,
  eventState INTEGER DEFAULT 0,                   -- 0未抽取/1抽取中/2完成/3失败
  errorReason TEXT,
  createTime INTEGER,
  FOREIGN KEY (projectId) REFERENCES o_project(id) ON DELETE CASCADE
);
CREATE INDEX idx_novel_project ON o_novel(projectId);

CREATE TABLE o_event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  detail TEXT,
  createTime INTEGER
);

CREATE TABLE o_eventChapter (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  eventId INTEGER NOT NULL,
  novelId INTEGER NOT NULL,
  FOREIGN KEY (eventId) REFERENCES o_event(id) ON DELETE CASCADE,
  FOREIGN KEY (novelId) REFERENCES o_novel(id) ON DELETE CASCADE
);

-- 集
CREATE TABLE o_script (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projectId INTEGER NOT NULL,
  name TEXT,                                      -- '第1集' 等
  content TEXT,                                   -- 剧本正文
  extractState INTEGER DEFAULT 0,                 -- 0未拆分镜/1拆分镜中/2完成/3失败
  errorReason TEXT,
  episodeIndex INTEGER,                           -- 第几集
  createTime INTEGER,
  FOREIGN KEY (projectId) REFERENCES o_project(id) ON DELETE CASCADE
);
CREATE INDEX idx_script_project ON o_script(projectId);

-- 资产
CREATE TABLE o_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projectId INTEGER NOT NULL,
  assetsId INTEGER,                               -- 父资产 ID,衍生资产用
  type TEXT NOT NULL,                             -- 'role'|'tool'|'scene'|'clip'
  name TEXT NOT NULL,
  prompt TEXT,
  describe TEXT,
  imageId INTEGER,                                -- 关联生成的图
  promptState TEXT DEFAULT '未生成',
  promptErrorReason TEXT,
  audioBindState INTEGER DEFAULT 0,
  startTime INTEGER,
  remark TEXT,
  FOREIGN KEY (projectId) REFERENCES o_project(id) ON DELETE CASCADE,
  FOREIGN KEY (assetsId) REFERENCES o_assets(id) ON DELETE SET NULL
);
CREATE INDEX idx_assets_project ON o_assets(projectId);
CREATE INDEX idx_assets_parent ON o_assets(assetsId);

CREATE TABLE o_scriptAssets (
  scriptId INTEGER NOT NULL,
  assetId INTEGER NOT NULL,
  PRIMARY KEY (scriptId, assetId),
  FOREIGN KEY (scriptId) REFERENCES o_script(id) ON DELETE CASCADE,
  FOREIGN KEY (assetId) REFERENCES o_assets(id) ON DELETE CASCADE
);

CREATE TABLE o_assetsRole2Audio (
  assetsRoleId INTEGER NOT NULL,
  assetsAudioId INTEGER NOT NULL,
  PRIMARY KEY (assetsRoleId, assetsAudioId)
);

-- 分镜
CREATE TABLE o_storyboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projectId INTEGER NOT NULL,
  scriptId INTEGER NOT NULL,
  index_ INTEGER,                                  -- 分镜序号 (避开 SQL 关键字)
  videoDesc TEXT,
  prompt TEXT,
  track TEXT,
  trackId INTEGER,
  duration TEXT,                                   -- 字符串以便存 "3s" 或 "3.5"
  state TEXT DEFAULT '未生成',
  shouldGenerateImage INTEGER DEFAULT 1,
  filePath TEXT,                                   -- 生成的图/视频路径
  flowId INTEGER,                                  -- 关联 flow (V1+,暂可空)
  reason TEXT,
  createTime INTEGER,
  FOREIGN KEY (projectId) REFERENCES o_project(id) ON DELETE CASCADE,
  FOREIGN KEY (scriptId) REFERENCES o_script(id) ON DELETE CASCADE
);
CREATE INDEX idx_storyboard_script ON o_storyboard(scriptId);
CREATE INDEX idx_storyboard_track ON o_storyboard(scriptId, track, index_);

CREATE TABLE o_assets2Storyboard (
  storyboardId INTEGER NOT NULL,
  assetId INTEGER NOT NULL,
  PRIMARY KEY (storyboardId, assetId),
  FOREIGN KEY (storyboardId) REFERENCES o_storyboard(id) ON DELETE CASCADE,
  FOREIGN KEY (assetId) REFERENCES o_assets(id) ON DELETE CASCADE
);

-- 媒体产物
CREATE TABLE o_image (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assetsId INTEGER,
  filePath TEXT,
  model TEXT,
  resolution TEXT,
  type TEXT,
  state TEXT DEFAULT '未生成',
  errorReason TEXT,
  createTime INTEGER
);
CREATE INDEX idx_image_assets ON o_image(assetsId);

CREATE TABLE o_video (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projectId INTEGER,
  scriptId INTEGER,
  videoTrackId INTEGER,
  filePath TEXT,
  state TEXT DEFAULT '未生成',
  errorReason TEXT,
  time INTEGER
);
CREATE INDEX idx_video_script ON o_video(scriptId);

CREATE TABLE o_videoTrack (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projectId INTEGER,
  scriptId INTEGER,
  videoId INTEGER,
  selectVideoId INTEGER,
  prompt TEXT,
  duration INTEGER,
  state TEXT DEFAULT '未生成',
  reason TEXT
);

-- 任务表（合并 CanvasPro 的 mediaTaskQueue 与短剧的 o_tasks）
CREATE TABLE o_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taskClass TEXT NOT NULL,                         -- 'image_gen'|'video_gen'|'audio_compose'|'media_clip_export'|...
  projectId INTEGER,                                -- 自由画布场景可空
  scriptId INTEGER,                                 -- 集 ID
  relatedObjects TEXT,                              -- JSON: { storyboardId, assetId, ... }
  describe TEXT,
  model TEXT,
  state TEXT NOT NULL DEFAULT 'pending',           -- 'pending'|'running'|'done'|'failed'|'canceled'
  reason TEXT,
  legacySource TEXT,                                -- 'freeform_canvas'|'short_drama' 来源标记
  startTime INTEGER,
  endTime INTEGER
);
CREATE INDEX idx_tasks_state ON o_tasks(state);
CREATE INDEX idx_tasks_project ON o_tasks(projectId);

-- 画布工作区数据 (一集一行)
CREATE TABLE o_agentWorkData (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projectId INTEGER NOT NULL,
  episodesId INTEGER,                               -- = o_script.id
  key TEXT,                                         -- 'canvas' (画布状态) 或其他
  data TEXT,                                        -- JSON 序列化
  createTime INTEGER,
  updateTime INTEGER,
  FOREIGN KEY (projectId) REFERENCES o_project(id) ON DELETE CASCADE,
  UNIQUE (projectId, episodesId, key)
);
CREATE INDEX idx_workdata_episode ON o_agentWorkData(episodesId);
```

### 3.2 `StoryboardScriptNode` 4 项补完

**当前现状**（详见 `04-current-stack.md §2`）：
- 15 个字段已就位
- 表格/卡片视图、image/video 模式切换、批量派发生图已就位
- 缺：单行生成态、视频直派、项目集关联、资产卡支持

**补完 1：单行生成状态**

为每一行（shot）新增字段：
```js
{
  // 已有: 镜号, 时长, 景别, 场景, 画面描述, ...
  generationState: {                  // 新增
    image: 'pending'|'running'|'done'|'failed',
    video: 'pending'|'running'|'done'|'failed',
    imageJobId: string|null,
    videoJobId: string|null,
    imageError: string|null,
    videoError: string|null
  },
  outputImageUrl: string|null,        // 新增
  outputVideoUrl: string|null         // 新增
}
```

DOM 改造：行渲染时显示状态徽章（pending=灰、running=蓝转圈、done=绿、failed=红）。

**补完 2：视频直派链路**

`mediaMode: 'video'` 现有但未跑通。补：
- 节点新增 `_startGeneratedVideoNodes` 方法（对照 `_startGeneratedImageNodes`）
- 取选中行的 `视频提示词` + `outputImageUrl`（作为首帧）
- 调 `generation.run` 命令配 i2v 模型
- 写入 `o_video` + `o_tasks`
- 完成后回写 `outputVideoUrl` + `generationState.video='done'`

**补完 3：项目集关联**

节点 `_data` 新增字段：
```js
{
  // 已有: rows, viewMode, mediaMode, ...
  projectId: number,                  // 新增
  episodeId: number                   // 新增 (= o_script.id)
}
```

效果：节点序列化时持久化到 `o_agentWorkData`；切集时通过 `episodeId` 索引加载。

**补完 4：资产卡拖入支持**

接收新增节点类型 `asset-card`（见 §3.3）拖入：
- 拖入时识别为 `assetCard.assetId`
- 自动绑定到该行 `角色图` 或 `参考` 字段（按资产 type 路由）
- 写入 `o_assets2Storyboard`

### 3.3 新增节点类型（最少新增）

只新增 2 个节点类型（其他全部复用现有）：

**`asset-card` 资产卡节点**

```js
{
  type: 'asset-card',
  name: string,                       // 资产名（"主角"、"宝剑"、"主角房间"）
  assetType: 'role'|'tool'|'scene'|'clip',
  assetId: number,                    // FK → o_assets.id
  parentAssetId: number|null,         // 衍生时指向父资产
  thumbnailUrl: string,
  prompt: string,
  describe: string,
  generationState: 'pending'|'running'|'done'|'failed',
  derives: AssetCard[]                // 衍生资产卡（嵌套或引用，二选一）
}
```

UI：
- 顶部带 type 图标 + 名称
- 中部缩略图
- 底部小按钮：编辑 / 衍生 / 重新生成

**`episode-container` 集容器节点**

```js
{
  type: 'episode-container',
  name: string,                       // "第3集"
  scriptId: number,                   // FK → o_script.id
  scriptSummary: string,              // 剧本前 200 字
  childStoryboardIds: number[]        // 该集所有分镜的画布节点 id
}
```

UI：
- 半透明大框，圈住一集所有分镜节点
- 顶部标题栏：第 N 集 + 剧本预览
- 拖动容器 = 所有子分镜节点跟随移动

> **不新增**：分镜节点（用 `StoryboardScriptNode` 补完）、画风节点、Agent 配置节点（用菜单/侧栏 UI）

### 3.4 Skill loader（D2 实施细节）

**目录结构**（首次启动从 `resources/` 复制到 `userData/skills/`）：

```
<userData>/skills/
├── director/                           # 剧本工作室类
│   ├── novel-import.skill.md
│   ├── chapter-event-extract.skill.md
│   ├── story-skeleton.skill.md
│   ├── adaptation-strategy.skill.md
│   ├── episode-split.skill.md
│   ├── episode-script.skill.md
│   └── ...
├── production/                         # 生产画布类
│   ├── derive-assets-analysis.skill.md
│   ├── derive-assets-generate.skill.md
│   ├── director-plan.skill.md
│   ├── storyboard-table.skill.md
│   ├── storyboard-panel.skill.md
│   ├── storyboard-image-gen.skill.md
│   ├── storyboard-video-gen.skill.md
│   └── ...
├── supervisor/                         # 监督类
│   ├── script-quality.skill.md
│   ├── storyboard-consistency.skill.md
│   └── ...
├── universal/                          # 通用 (原 4 个老 skill 平移)
│   ├── text-to-image.skill.md
│   ├── text-to-video.skill.md
│   ├── image-to-video.skill.md
│   └── batch-layout.skill.md
├── art_skills/                         # 画风库 (V1+)
│   └── 都市写实/
│       ├── style.md                    # 画风总述,默认激活
│       └── director_skills/
│           ├── 镜头语言.md
│           └── 资产风格.md
└── story_skills/                       # 题材库 (V1+)
    └── 都市/
        ├── genre.md
        └── director_skills/
            └── 节奏模板.md
```

**Loader 接口**：

```js
// src/modules/agent/skills/loader.js (新增)
export class SkillLoader {
  async loadAll(userDataPath)           // 启动时扫描全部
  async reload(skillPath)               // dev 模式 watch 重载
  getByCategory(category)               // 取 'director' | 'production' | ...
  getById(id)                           // 取单个
  getActivePromptText(id, vars)         // 取正文 + 模板插值
}
```

**Skill 在 prompt 中的两种存在形式**：

```js
// 摘要 (进 prompt 给 LLM 选 skill 用)
{
  id: 'director.storyboard-table',
  title: '生成分镜表',
  riskLevel: 'confirm',
  appliesWhen: ['用户要求生成分镜', '用户要求把剧本拆成分镜表'],
  commands: ['node.create', 'node.setParams']
}

// 完整正文 (按需注入)
"# 分镜表生成\n你是一个短剧分镜师...\n## 输入\n{episode_script}\n..."
```

### 3.5 `agentApi.js` 改造（D7 实施细节）

**当前现状**：
- `AGENT_SYSTEM_PROMPT` = 20+ 条字符串拼成的英文细则
- 系统 prompt + context + history + examples + outputSchema 一次性塞进 prompt
- 预算 45,872 字符，超了走 6 级压缩

**改造点**：

1. **`buildPlannerPrompt`** 改为先按角色取 skill 子集，再构造 prompt

```js
function buildPlannerPrompt({ message, context, history, locale, role }) {
  // role: 'director' | 'production' | 'universal'
  // 由调用方根据当前页面/projectType 传入
  const relevantSkills = SkillLoader.getByCategory(role);
  context.skills = relevantSkills.map(toSkillSummary);
  // 后续逻辑沿用
}
```

2. **`requestAgentActionPlan`** 入口加 `role` 参数

```js
export async function requestAgentActionPlan({
  message, context, history, settings,
  role = 'universal'   // 新增
}) { ... }
```

3. **`agentRuntime`** 传 `role` 给 planner

```js
// 在 agentRuntime 内部调 planner 时
const role = determineRoleFromContext(context);
return planner({ message, context, history, role, ... });
```

`determineRoleFromContext` 逻辑：
- 当前 URL = `/script-studio` → `director`
- 当前 URL = `/canvas` + projectType=shortdrama → `production`
- 否则 → `universal`

4. **`AGENT_SYSTEM_PROMPT` 短剧细则**（按 role 追加）

阶段 A 系统 prompt 在原有 20+ 条基础上**根据 role** 追加：
- `director` 角色追加："你是 CanvasPro 短剧的剧本工作室助手..."
- `production` 角色追加："你是 CanvasPro 短剧的生产画布助手..."
- `universal` 角色保持原样

5. **二轮调用**（阶段 B 加，阶段 A 暂不做）

阶段 A 单轮：所有 skill 摘要塞进 prompt（最多 8-10 个/角色，撑得住）
阶段 B 二轮：先 cheap model 选 skill → 再 strong model 出 plan

### 3.6 IPC 短剧专属（`electron/ipc/shortDramaIpc.js`）

新增 IPC 端点（与现有 11 类并列）：

```
project:createShortDrama       创建短剧项目
project:listEpisodes           列出某项目下所有集
project:openEpisode            打开某集 → 切换画布

novel:upload                   上传小说
novel:parseChapters            按章解析

script:create                  新建集（空剧本）
script:save                    保存剧本

storyboard:save                保存分镜表节点状态
storyboard:queueGen            派发生图/视频任务

assets:create                  新建资产
assets:listByProject           列出项目级资产
assets:derive                  创建衍生资产
```

### 3.7 数据库适配（`electron/db/`）

```
electron/db/
├── knexfile.js                # knex 配置
├── connection.js              # 单例连接
├── migrations/                # 17 张表 migration 脚本
│   ├── 001_initial.js
│   ├── 002_add_legacy_source.js
│   └── ...
└── repositories/              # 仓储模式 (跨 IPC 复用)
    ├── projectRepo.js
    ├── novelRepo.js
    ├── scriptRepo.js
    ├── assetRepo.js
    ├── storyboardRepo.js
    ├── taskRepo.js
    └── workDataRepo.js
```

**首次启动**：
1. 检测 `<userData>/data.sqlite` 是否存在
2. 不存在 → 跑 migration → 写种子数据（管理员 `o_user` + tokenKey）
3. 存在 → 检查 `o_setting.db_version`，与代码版本对比，跑增量 migration

**事务策略**：
- 写多表的 IPC 端点用 `db.transaction()`（如 `script:create` 涉及 `o_script` + `o_agentWorkData`）

### 3.8 用户系统与团队模式（D8 第 3 项）

**`o_setting.team_mode`** 控制：

**`team_mode=false`（默认单机）**：
- Electron 启动后直接显示主窗口
- 默认登录为 `o_user(id=1, name='我')` 匿名用户
- IPC handler 不校验 token
- `server.py` 绑 127.0.0.1

**`team_mode=true`（团队模式）**：
- 启动时显示登录页
- Electron 主进程在端口 `userData/team-port.json` 暴露 Socket（V1+）
- 客户端 Electron 启动时填"主机地址"，连 Socket 走远程 IPC
- `server.py` 绑 0.0.0.0
- IPC handler 验 JWT（沿用 `o_setting.tokenKey` 签名）

**MVP 简化**：阶段 A 只做 `team_mode=false` 单机模式，团队模式留到阶段 C 一起做（与多集长项目能力同步上）。

### 3.9 ffmpeg 自带

**打包**：`package.json` 加 `extraResources`：

```json
{
  "build": {
    "extraResources": [
      { "from": "resources/ffmpeg/", "to": "ffmpeg/" }
    ]
  }
}
```

**调用**：

```js
// electron/utils/ffmpegPath.js (新增)
import path from 'node:path';
export function getFfmpegPath() {
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, '../../resources/ffmpeg/ffmpeg.exe');
  }
  return path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe');
}
```

**调用方**：现有 `electron/mediaTasks/audioComposeTask.js` 和 `mediaClipExportTask.js` 改用 `getFfmpegPath()`，**不引入新依赖**。

### 3.10 短剧专属页面（renderer）

**新增路由**：

```
/                       现有首页（项目列表）
/canvas/:projectId      现有自由画布
/script-studio/:projectId  ← 新增 剧本工作室
/canvas-shortdrama/:projectId/:episodeId  ← 新增 短剧生产画布
/asset-library/:projectId  ← 新增 资产库
/settings/agent-bind    ← 新增 Agent 模型绑定
```

**项目路由分流**：
- 用户点项目卡 → 查 `projectType`
- `freeform` → `/canvas/:projectId`
- `shortdrama` → 看项目状态：无剧本 → `/script-studio`；有剧本 → 默认进第一集 `/canvas-shortdrama/:projectId/:episodeId`

**剧本工作室页面**布局：

```
┌────────────────────────────────────────────┐
│ 顶部: 项目名 / 集列表 (横向 tab)            │
├────────────────────────────────────────────┤
│            │                                │
│ 左: 大纲   │ 右: Agent 对话面板               │
│  - 小说    │  (复用现有 agentPanel)           │
│  - 章节    │                                │
│  - 骨架    │                                │
│  - 策略    │                                │
│  - 剧本    │                                │
│            │                                │
└────────────────────────────────────────────┘
```

**短剧生产画布**：复用现有画布引擎，加：
- 顶部集列表 tab（切集）
- 右下角"开拍/导出"快捷按钮
- 现有 agentPanel（`/canvas` 已用）继续显示，但 skill 集合自动切到 `production.*`

---

## 4 · Agent 服务详细设计（v0.2 简化版）

> v0.1 在此处大谈"独立 UtilityProcess"，v0.2 按 D6 决策直接砍掉。

### 4.1 Agent 在哪里跑

renderer 内。具体位置：`src/modules/agent/`。

**生命周期**：
- 用户打开 `/script-studio` 或 `/canvas` → 调 `createAgentRuntime` + `initAgentPanel`
- Agent 对话存到 `agentConversationStore`（localStorage, projectId 隔离）
- Agent 跑 plan 时调 renderer 内的 `requestAgentActionPlan` → `aiTextApi.generateText`
- 用户关页面 → runtime 内存释放

### 4.2 通信

- 用户 ↔ Agent UI：`agentPanel.js` 直接事件
- Agent ↔ 画布：通过 `executeAgentActions` → `executeCanvasCommandPlan` → 操作 `graphStore`
- Agent ↔ 数据库：通过 IPC（`shortDramaIpc.js`）
  - 例：写分镜 → 画布命令 `node.create` → 画布更新 → 用户保存 → IPC `storyboard:save` → DB
- Agent ↔ LLM：renderer 直接 `aiTextApi.generateText`，走对应供应商的 SDK

### 4.3 三层 Agent 通过 skill 分组实现（D3）

不分 3 个 runtime。技术上是：

```
agentRuntime
   ↓
agentContextBuilder.buildAgentContext({ role: 'director' })
   ↓
SkillLoader.getByCategory('director') → 8 个 skill 摘要
   ↓
buildPlannerPrompt 把 skill 摘要塞进 context.skills
   ↓
LLM 看到的世界 = director 类 skill + 通用 universal 类 skill
```

用户视角：
- 进剧本工作室 → 看到 Agent 帮你写骨架、策略、剧本
- 进生产画布 → 看到 Agent 帮你建资产、出分镜、生图
- 用户**感觉是不同 Agent**，**实际是同一个**

### 4.4 监督层

用户主动触发：
- 剧本工作室 → 右上角按钮"让编辑看看" → 调 `supervisor.script-quality` skill
- 生产画布 → 右上角按钮"让监制看看" → 调 `supervisor.storyboard-consistency` skill

阶段 A 不做自动监督；阶段 C-D 评估加自动触发条件（"骨架完成时自动跑 1 轮编辑评审"）。

### 4.5 Memory

**阶段 A 简化**：用现有 `agentConversationStore`（localStorage）。
- 按 projectId 隔离
- 每个 conversation 最多 100 条消息
- 不引入 ONNX embedding

**阶段 C+ 升级**（按需）：
- 加 RAG：用 `aiTextApi` 调 embedding API（云端，避免本地 ONNX 模型 100MB 包袱）
- 索引存 SQLite（`memories` 表，需要时再加）
- 摘要功能（长对话自动总结）

---

## 5 · 流程串接示例（v0.2 修订）

### 5.1 用户创建短剧项目

```
1. 前端：点"新建项目" → 选 'shortdrama' → 填表
2. 前端：IPC.invoke('project:createShortDrama', payload)
3. Electron 主进程 shortDramaIpc.js：
   a. 校验 + 鉴权
   b. db.transaction:
      INSERT o_project (...) RETURNING id
   c. 创建 oss/{projectId}/ 目录
   d. 返回 projectId
4. 前端：跳转 /script-studio/:projectId
5. 前端：初始化 agentRuntime + agentPanel，role='director'
6. 前端：agentConversationStore.ensureActiveConversation(projectId)
```

### 5.2 用户上传小说并请求生成骨架

```
1. 前端：拖入 novel.txt → IPC.invoke('novel:upload', { projectId, file })
2. Electron：保存文件 → IPC.invoke('novel:parseChapters', { projectId })
3. Electron：解析章节 → db.transaction: INSERT o_novel 多行
4. 前端：剧本工作室左侧大纲刷新
5. 前端：用户在 Agent 对话框输入 "写故事骨架"
6. Agent runtime → buildPlannerPrompt with role='director'
   a. SkillLoader.getByCategory('director') 取 8 个 director skill 摘要
   b. agentCanvasSummary 加 short-drama 字段:novels, scripts
   c. 拼 prompt → 调 aiTextApi.generateText
7. LLM 返回 plan，含 actions:
   - { type: 'node.create', args: { type: 'storyboard-script', ...}, as: 'plan' }
   - 这里其实不太合适,骨架不是分镜表。可能更合理是新建一个"骨架文本节点"或在工作区数据中存
8. 现实做法（修订）:骨架不创节点,作为工作区数据写入
   - 加新画布命令 'workspace.setField',参数 { field: 'storySkeleton', value: '...' }
   - LLM 返回 actions: [{ type: 'workspace.setField', args: { ... } }]
9. agentRuntime 执行 → 写入剧本工作室的 workspaceData
10. UI 实时更新骨架展示区
```

### 5.3 用户开拍某集

```
1. 前端在剧本工作室点 "第1集·开拍"
2. IPC.invoke('project:openEpisode', { projectId, episodeId })
3. Electron:
   a. 查 o_agentWorkData WHERE projectId=? AND episodesId=? AND key='canvas'
   b. 不存在 → 创建空记录
   c. 返回 { canvasData, scriptContent }
4. 前端跳转 /canvas-shortdrama/:projectId/:episodeId
5. 前端加载画布 → 渲染节点 → 切换 Agent role='production'
6. 前端 agentConversationStore 用 conversationId 加 episodeId 后缀,避免跨集对话错乱
7. 用户输入 "分析这一集需要哪些资产"
8. Agent → role='production',SkillLoader 取 production.* skill
9. LLM 选 'production.derive-assets-analysis' skill,生成 plan,包含批量 node.create 'asset-card'
10. 执行后:
    - 每个 asset-card 节点 IPC.invoke('assets:create', ...)
    - DB INSERT o_assets + o_scriptAssets
    - 画布渲染资产卡节点
```

### 5.4 异步生图

```
1. 用户在画布选 5 个资产卡 → 右键"全部生成"
2. 画布命令 'generation.run' (针对 asset-card 类节点的 handler)
3. 命令调度 IPC.invoke('storyboard:queueGen', { ids: [...], kind: 'image' })
4. Electron taskRepo:
   - db.transaction: INSERT o_tasks 5 条 state='pending' taskClass='image_gen'
   - 提交到 mediaTaskQueue
5. mediaTaskQueue worker:
   - 取一个任务 → 调 aiImageApi
   - 完成后:
     - INSERT o_image
     - UPDATE o_assets.imageId
     - UPDATE o_tasks state='done'
     - IPC.send(renderer, 'asset:generated', { assetId, filePath })
6. 前端收事件 → 资产卡节点显示图
```

---

## 6 · 安全与团队模式

> 阶段 A 只做单机模式。本节为阶段 C 实施做准备。

### 6.1 单机模式（阶段 A 默认）

`o_setting.team_mode=false`：
- Renderer / Electron 主进程 / Python 全绑 127.0.0.1
- 启动直进主窗口，无登录
- 默认 `o_user(id=1, name='我')` 创建于首次启动

### 6.2 团队模式（阶段 C）

`o_setting.team_mode=true`：
- 主机模式 vs 客户端模式 区分
- 主机：Electron + DB + 媒体队列 + Agent；端口绑 0.0.0.0
- 客户端：仅 Electron renderer；通过远程 IPC 连主机（V1+ 详细设计）

### 6.3 JWT

- `o_setting.tokenKey` 首次启动随机生成
- 登录返回 token
- 单机模式默认有效期 30 天（团队模式同）

### 6.4 mDNS（阶段 D）

阶段 D 加 mDNS 广播，团员看到服务列表免填 IP。

---

## 7 · 部署与升级

### 7.1 打包产物

```
CanvasPro-0.5.0-Setup-x64.exe
├── resources/
│   ├── app.asar (混淆代码)
│   ├── ffmpeg/
│   │   └── ffmpeg.exe                      # 新增 ~80MB
│   └── skills/                             # 新增 内置 skill
│       ├── director/                       # ~10 个 skill
│       ├── production/                     # ~10 个 skill
│       ├── supervisor/                     # ~3 个 skill
│       ├── universal/                      # 平移老 4 个
│       ├── art_skills/都市写实/             # 阶段 A 首套
│       └── story_skills/都市/               # 阶段 A 首套
└── ...
```

### 7.2 首次启动

```
1. 检测 <userData>/data.sqlite 是否存在
2. 不存在 → 跑 17 张表 migration → 写种子数据
3. 检测 <userData>/skills/ 是否存在
4. 不存在 → 从 resources 复制
5. 检测 <userData>/user/config.json (CanvasPro 现有)
6. 不存在 → 让用户填 API Key
```

### 7.3 升级

- `o_setting.app_version` + `o_setting.db_version` 对比代码版本
- 增量 migration（**不破坏老项目**）
- skill 文件**不覆盖**用户修改过的副本（用 `.skill-version` 标记）
- 升级前自动备份 SQLite 到 `<userData>/backups/data-{ts}.sqlite`

---

## 8 · 目录结构（修订建议）

```
F:\CanvasPro\
├── electron/                            # 现有
│   ├── ipc/
│   │   ├── shortDramaIpc.js             # 新增
│   │   └── ...
│   ├── db/                              # 新增
│   │   ├── knexfile.js
│   │   ├── connection.js
│   │   ├── migrations/
│   │   └── repositories/
│   └── utils/
│       └── ffmpegPath.js                # 新增
├── src/                                 # 现有 renderer
│   ├── modules/agent/                   # 现有,扩展
│   │   ├── skills/
│   │   │   ├── loader.js                # 新增
│   │   │   └── (老的 .skill.json 平移到 userData/skills/)
│   │   └── ...
│   ├── components/
│   │   ├── StoryboardScriptNode.js      # 现有,补完
│   │   ├── AssetCardNode.js             # 新增
│   │   └── EpisodeContainerNode.js      # 新增
│   └── shortDrama/                      # 新增
│       ├── studio/                      # 剧本工作室页面
│       ├── canvas/                      # 短剧画布页面扩展
│       └── assetLibrary/                # 资产库页面
├── api/                                 # 现有
│   ├── agentApi.js                      # 改 (按 role 取 skill)
│   ├── shortDramaApi.js                 # 新增 (前端调 IPC 的 wrapper)
│   └── ...
├── resources/                           # 新增打包资源
│   ├── ffmpeg/
│   └── skills/
│       ├── director/
│       ├── production/
│       ├── supervisor/
│       ├── universal/
│       ├── art_skills/都市写实/
│       └── story_skills/都市/
├── server.py                            # 现有,不动
├── backend/                             # 现有,不动
└── docs/short-drama/                    # 本文档系列
```

---

## 9 · 测试策略

### 9.1 单元测试（沿用现有 node:test）

- IPC handler：`electron/ipc/shortDramaIpc.test.js`
- 数据库 repo：mock SQLite，跑 CRUD
- Skill loader：mock 文件系统，跑解析 + 模板插值
- Agent prompt builder：mock skill，跑预算压缩

### 9.2 集成测试

- Skill 加载 + agentContextBuilder 取子集 + buildPlannerPrompt 输出
- Mock LLM 返回预设 plan → 跑全链路 validate → execute

### 9.3 E2E（沿用现有 Playwright）

- 全流程：新建短剧项目 → 上传小说 → 生成骨架 → 开拍 → 资产 → 分镜 → 导出
- Mock LLM 与生图 API（避免真调用花钱）

### 9.4 性能基线

- 数据库：项目级查询 < 100ms
- Agent prompt 构造：< 50ms（不含 LLM）
- 画布大数据：500 节点不掉帧
- 启动时间：< 5 秒（不含 LLM 预热）

---

## 10 · 风险与缓解

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| 现有 Agent 改造影响自由画布 | 老用户体验下降 | 严格保证 `projectType=freeform` 时只暴露老 4 skill；E2E 测试覆盖 |
| `StoryboardScriptNode` 补完破坏现有用法 | 自由画布老用户分镜表节点崩 | 字段全部加 default；老节点序列化数据保兼容 |
| Skill markdown 解析性能 | Agent 启动慢 | 启动时一次性扫描 + 缓存；dev 模式 watch |
| Prompt 预算撑爆 | LLM 返回失败/截断 | 现有 6 级压缩兜底；按 role 拿 skill 子集 |
| LLM 选错 skill | 用户期望 ≠ 行为 | Skill `appliesWhen` 写细；恢复流程让用户重选 |
| SQLite 大项目锁竞争 | 慢 | WAL 模式 + 短事务；阶段 D+ 评估 PG 切换 |
| ffmpeg 二进制大 ~80MB | 安装包膨胀 | 接受；阶段 D+ 评估按需下载 |
| 团队模式安全 | 数据泄露 | 阶段 C 前**不上线团队模式**；阶段 C 上前做安全审计 |

---

## 11 · 阶段 A 施工拆解（v0.2 修订）

按 02-pipeline §7.1 阶段 A 目标"小说改编主干贯通"，按依赖排序：

### Phase A.0：基础设施（1 周）

- [ ] `electron/db/` knex + 17 张 migration + 种子
- [ ] `electron/utils/ffmpegPath.js` 与打包配置
- [ ] `electron/ipc/shortDramaIpc.js` 框架（空 handler）
- [ ] 现有 `mediaTaskQueue.js` 改造为读写 `o_tasks` 表
- [ ] 数据迁移脚本：旧 `mediaTaskQueue` JSON → `o_tasks`

### Phase A.1：Skill loader + Agent 扩展（1 周）

- [ ] `src/modules/agent/skills/loader.js` markdown 解析 + 模板插值
- [ ] 老 4 个 JSON skill 平移到 markdown 格式
- [ ] `agentContextBuilder.js` 改"按 role 取 skill"
- [ ] `agentApi.js` 加 `role` 参数 + role-specific system prompt
- [ ] `agentRuntime.js` 加 `determineRoleFromContext`
- [ ] 现有 agentPanel UI 加"当前 Agent 角色"提示
- [ ] 测试：所有原有自由画布场景不破

### Phase A.2：项目类型分流（0.5 周）

- [ ] 项目创建表单加 `projectType` 选择
- [ ] 项目卡 UI 标记类型
- [ ] 路由分流（`/canvas` vs `/script-studio`）
- [ ] 设置页加"Agent 绑定"子页

### Phase A.3：剧本工作室页面（2 周）

- [ ] 页面骨架：大纲 + Agent 面板
- [ ] 小说上传 + 章节解析（`o_novel`）
- [ ] 事件抽取（`o_event` + `o_eventChapter`）—— skill `director.chapter-event-extract`
- [ ] 故事骨架（写入 `o_agentWorkData` key=`storySkeleton`）—— skill `director.story-skeleton`
- [ ] 改编策略（key=`adaptationStrategy`）—— skill `director.adaptation-strategy`
- [ ] 分集（创建 `o_script` 多行）—— skill `director.episode-split`
- [ ] 分集剧本（写 `o_script.content`）—— skill `director.episode-script`
- [ ] 编辑监督手动触发 —— skill `supervisor.script-quality`

### Phase A.4：StoryboardScriptNode 补完 + 短剧画布（2 周）

- [ ] 4 项补完（生成态/视频派/项目集关联/资产卡支持）
- [ ] 新增 `AssetCardNode` 节点类型
- [ ] 新增 `EpisodeContainerNode` 节点类型
- [ ] 短剧画布页面路由 + 顶部集列表
- [ ] 集容器 ↔ DB 同步（`o_agentWorkData`）

### Phase A.5：ProductionAgent 类 skill（2 周）

- [ ] `production.derive-assets-analysis` —— 写资产
- [ ] `production.derive-assets-generate` —— 出资产图
- [ ] `production.director-plan` —— 拍摄计划
- [ ] `production.storyboard-table` —— 分镜表
- [ ] `production.storyboard-panel` —— 分镜面板
- [ ] `production.storyboard-image-gen` —— 分镜出图
- [ ] `production.storyboard-video-gen` —— 分镜出视频
- [ ] `supervisor.storyboard-consistency` —— 监制评审
- [ ] 都市写实画风 skill fork（`art_skills/都市写实/`）
- [ ] 都市题材 skill fork（`story_skills/都市/`）

### Phase A.6：剪辑与导出（2 周）

- [ ] 画布 → 时间轴映射
- [ ] TTS 适配（云端，火山引擎/Azure/OpenAI）
- [ ] 字幕生成
- [ ] ffmpeg MP4 直出
- [ ] FCP XML 导出

### Phase A.7：通过标准验证（1 周）

- [ ] 选 1 章网文跑全流程
- [ ] 失败率 < 5%
- [ ] 单集时长 < 2 小时
- [ ] 质量验收

**总计**：**11.5 周**（约 3 个月），1 人 + AI 协作；预留 25-50% 缓冲。

---

## 12 · 决策与文档间的对照表

> 与 05-decisions.md 严格对应。

| 决策 | 本文档体现 |
| --- | --- |
| D1 扩展现有 Agent | §1.2 P1 / §2.1 / §3.4 / §4 |
| D2 Skill markdown | §2.2 / §3.4 |
| D3 单层 + skill 分组 | §2.3 / §3.4 §3.5 / §4.3 |
| D4 阶段 A 不做 streaming | §2.4 |
| D5 复用 StoryboardScriptNode | §2.5 / §3.2 |
| D6 Agent 在 renderer | §2.6 / §4.1 |
| D7 Prompt 预算 | §2.7 / §3.5 |
| D8.1 任务表合并 | §2.9 / §3.1 (o_tasks) |
| D8.2 资产不迁移 | §2.10 |
| D8.3 用户 + JWT | §2.11 / §6 |
| D8.4 模型 UI 扩展 | §2.12 / §3.10 |
| D8.5 ffmpeg 自带 | §2.13 / §3.9 / §7.1 |
| D8.6 画风首套 | §2.14 / §11 Phase A.5 |
| D8.7 TTS 云端 | §2.15 / §11 Phase A.6 |
| D8.8 视频模型保持 | §2.16 |

---

## 13 · 给后续开发者的快速参考

7 条最重要的：

1. **不动 `src/modules/agent/` 主干** — 只改 `agentContextBuilder.js`、`agentApi.js`、`agentRuntime.js` 的少量逻辑
2. **Skill 是扩展点** — 新业务 = 新 skill，不是新代码模块
3. **`StoryboardScriptNode` 是短剧主节点** — 不要新建
4. **数据库走 IPC** — Renderer 不直接读数据库；IPC handler 是唯一入口
5. **canvasCommands 是底层接口** — 短剧所有"做事"都通过它
6. **现有 4 个 universal skill 不能破** — `projectType=freeform` 时行为完全不变
7. **阶段 A 不上 streaming + 不分进程 + 不三层** — 都是阶段 B+ 的事

---

**版本**：v0.2 · 按 04-current-stack 与 05-decisions 修订
**最后修订**：2026-06-28
**依赖**：00-vision v0.2, 02-pipeline v0.2, 03-glossary v0.2, 04-current-stack v0.1, 05-decisions v0.1
**下一步**：进入 Phase A.0 施工（knex + 17 迁移 + ffmpeg 路径 + shortDramaIpc 骨架）
