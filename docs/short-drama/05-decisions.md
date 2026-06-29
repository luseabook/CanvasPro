# 05 · 决策书 (Decisions Log)

> **目的**：把跨多个文档的关键决策**锁死在一处**，避免每次写新文档重复辩论。
> **格式**：每个决策含 [背景 / 决定 / 备选方案 / 拍板理由 / 后果与代价 / 撤销条件]。
> **维护规则**：决策一旦写入此处即生效；想推翻必须**显式增补撤销记录**（不直接删除原条目）。
> **依赖**：本文件与 `00-vision.md` 冲突时以 `00-vision.md` 为准；与其他文档冲突时以本文件为准。

---

## 决策汇总表

| # | 决策 | 简版 | 影响章节 |
| --- | --- | --- | --- |
| D1 | Agent 框架选型 | **扩展 CanvasPro 现有 Agent，不 fork Toonflow** | 01-arch §2.1 §4 |
| D2 | Skill 文件格式 | **frontmatter + markdown 双格式**（旧 4 个 JSON 平移） | 01-arch §4.5 |
| D3 | 三层 Agent 实现 | **单层 runtime + skill 按上下文分组暴露** | 01-arch §2.1 / 02-pipeline §3 §4 |
| D4 | LLM 流式策略 | **阶段 A plan-execute，阶段 B 加 streaming** | 01-arch §2.4 / 02-pipeline §4 |
| D5 | 分镜节点选型 | **复用 StoryboardScriptNode，不新建** | 02-pipeline §4.4 §4.5 |
| D6 | Agent 进程位置 | **renderer 内运行；server.py 不塞 AI 调用** | 01-arch §1.1 §2.2 §4.1 |
| D7 | Prompt 预算管理 | **skill 集合按角色/页面动态裁剪** | 01-arch §4 / 02-pipeline §3 §4 |
| D8 | 已敲定的 8 项业务决策 | 见 02-pipeline §11、01-arch §12 | 不变 |

---

## D1 · Agent 框架选型：扩展现有，不 fork Toonflow

### 背景
- 旧架构文档（`01-architecture.md §2.1`）推荐"Node.js fork Toonflow 整套 Agent 框架到 UtilityProcess"
- 反推 CanvasPro 代码后发现：**已有完整自研 Agent 框架**（12 个文件，plan-execute 范式，已与 canvasCommands 深度集成）
- 现有 Agent 在 `src/modules/agent/`，通过 `requestAgentActionPlan` 走 `aiTextApi.generateText`

### 决定
- ✅ 保留并**扩展**现有 Agent 框架
- ❌ 不引入 Toonflow 的 `src/agents/scriptAgent` / `productionAgent` 代码
- ✅ 借鉴 Toonflow 的 **prompt 工程**与 **skill 设计**思路（见 D2 D3）
- ✅ 短剧的所有业务逻辑通过**新增 skill + 扩充 system prompt 细则**实现

### 备选方案与否决理由
| 备选 | 否决理由 |
| --- | --- |
| Fork Toonflow，扔掉现有 Agent | 现有自由画布的 AI 操作（text-to-image / text-to-video / batch-layout）会全部失效；推翻已稳定运行的 12 个文件 |
| 双轨共存：自由画布用现有，短剧用 fork | 用户在 UI 上看到两套 Agent 对话；代码两套维护；很快变成技术债 |

### 拍板理由
1. **CanvasPro 自研 Agent 设计良好**：5 状态机 + 4 风险等级 + plan-then-execute + 安全前缀 + 恢复流程，对自用工作室质量优先的诉求很对路
2. **canvasCommands 系统已是底层抽象**：所有动作都走它，Toonflow 的 socket emit 协议进来反而是双轨
3. **Toonflow 真正值得借鉴的是 prompt**：他们的 skill markdown 文件磨过的提示词可以搬过来重用（D2）
4. **Node.js UtilityProcess 不必要**：现有 Agent 跑在 renderer，没崩过，没必要造进程开销

### 后果与代价
- ✅ 节省 1-2 周开发时间
- ✅ 自由画布的 AI 能力完全保留
- ❌ 失去 Toonflow 的"流式工具调用"现成实现（短期不需要，见 D4）
- ❌ 失去 Toonflow 的"三层 Agent 进程"现成实现（通过 D3 用单层模拟）

### 撤销条件
本决策可撤销，当且仅当：
- 短剧业务确实复杂到一个 Agent 无法管理（超 50 个 skill 仍无法分组）
- Plan-execute 模式无法满足体验诉求（实测延迟无法接受）

---

## D2 · Skill 文件格式：frontmatter + markdown 双格式

### 背景
- CanvasPro 现有 4 个 skill：纯 JSON 描述符（`text-to-image.skill.json` 等），prompt 隐式在 planner 内部
- Toonflow 现有 100+ skill：markdown + frontmatter，prompt 显式在 .md 正文
- 短剧业务的 skill 估算 20-30 个（director.* + production.* + supervisor.* 三类）

### 决定
- ✅ 短剧新增 skill 全用 **frontmatter + markdown** 格式
- ✅ 现有 4 个 JSON skill **平移**为同格式（保留原 id 与默认参数，prompt 抽到 markdown 正文）
- ✅ Skill 路径：`<userData>/skills/<category>/<id>.skill.md`
- ✅ Markdown 正文支持**模板插值**（`{episode_script}` / `{art_style}` 等）

### Skill 文件结构示例

```markdown
---
id: director.storyboard-table
title: 生成分镜表
category: director
riskLevel: confirm
appliesWhen:
  - 用户要求生成分镜
  - 用户要求把剧本拆成分镜表
requiredInputs:
  - episode_script
missingInputQuestions:
  - 请问要分多少个镜头？
  - 请问参考画风是哪一类？
recommendedModelKind: text
commands:
  - node.create
  - node.setParams
defaultParams:
  shotDurationDefault: 5
  shotCountHint: 12
---

# 分镜表生成

你是一个短剧分镜师。基于给定的剧本，生成 N 个分镜……

## 输入
{episode_script}

## 输出格式
返回 JSON，包含 rows[]，每行 15 个字段：
- 镜号 / 时长 / 景别 / 场景 / 画面描述 / 角色 / 角色描述 / 角色动作 / 情绪
- 角色图 / 参考 / 图片提示词 / 视频提示词 / 对白 / 音效

## 思维步骤
1. 先识别剧本中的"动作单元"
2. 每个动作单元拆 1-3 个镜头
3. 镜头时长 3-8 秒为主，关键画面可 10 秒
4. ...

## 反例（不要这样）
- 不要把对白写进画面描述
- 不要把镜号写成 "shot1"，要写 "01"

## few-shot 示例
...
```

### 备选方案与否决理由
| 备选 | 否决理由 |
| --- | --- |
| 纯 JSON（现有风格） | prompt 隐式，调 prompt 要改代码；不能塞 few-shot；A/B 测试粒度是代码 |
| 纯 markdown（无 frontmatter） | 失去机器可校验的元数据；validator 无依据 |
| 用 YAML/TOML 单文件 | 与 markdown 工具链生态不兼容；编辑体验差 |

### 拍板理由
1. **prompt 工程是产品差异化点**：让产品/编剧能改 prompt 比工程师改代码强 10 倍
2. **Toonflow 的 prompt 可低成本搬过来**：换个 frontmatter 即可
3. **frontmatter 与现有 JSON schema 兼容**：4 个老 skill 迁移成本小，validator 复用
4. **可演进**：以后开放用户自定义 skill 是 .md 文件，比 JSON 友好

### 后果与代价
- 需新建一个 markdown skill loader（解析 frontmatter + 模板插值，约 1 天工作量）
- 4 个老 skill 要迁移（约半天）
- `agentApi.js` 的 `buildPlannerPrompt` 需要从"代码内拼 prompt"改为"读 skill 正文注入 prompt"

### 撤销条件
- 实测 markdown 解析成性能瓶颈（每次构建 prompt 解析全部 skill）
  - 缓解：启动时一次性加载 + watch 重载

---

## D3 · 三层 Agent 实现：单层 runtime + skill 按上下文分组

### 背景
- Toonflow 的 ScriptAgent 与 ProductionAgent 各拆三层（决策/执行/监督），用三套 runtime
- CanvasPro 现有是单层 plan-execute runtime
- 短剧业务**直觉上**需要三层（统筹想做什么、编剧/导演具体干、编辑/监制审稿）
- 但**架构上不必为这个直觉做三个 runtime**

### 决定
- ✅ 保持**单层** `agentRuntime`，不拆三个进程/对话/runtime
- ✅ Skill 用**三类前缀**承载"层"概念：
  - `director.*` ——剧本工作室侧（统筹+编剧+编辑）
  - `production.*` ——生产画布侧（视频策划+执行导演+监制）
  - `supervisor.*` ——质量审查类（编辑+监制，跨页面通用）
- ✅ Skill 按**当前页面/上下文**动态暴露：
  - 在剧本工作室页面 → 只暴露 `director.*` + `supervisor.*`
  - 在生产画布页面 → 只暴露 `production.*` + `supervisor.*`
- ✅ Skill 间通过**约定式触发**协作：例如执行类 skill 输出后，由用户或上下文条件触发监督类 skill
- ✅ "监督"是**可选层**：用户可在 settings 关闭自动监督，留人工触发

### 备选方案与否决理由
| 备选 | 否决理由 |
| --- | --- |
| 三个独立 runtime（Toonflow 风格） | 代码量翻 3 倍；Agent 间通讯协议要新设；延迟增加 1-3 秒；推翻 CanvasPro 现有 runtime |
| 两层（合并监督） | 监督要做成 middleware 反而难维护；不上不下 |
| 单层无分类（所有 skill 平铺） | 23+ skill 全摆出来 Prompt 撑爆 45KB 预算；模型选错 skill 概率高 |

### 拍板理由
1. **Prompt 预算 45KB 是硬约束**：所有 skill 平铺撑不住，必须按上下文分组（详见 D7）
2. **分组天然给出"层"效果**：用户在不同页面看到不同 skill 集合，行为像不同 Agent
3. **可演进**：阶段 D-E 真需要分 runtime，把 director/production 类 skill 拆出来另起 runtime 即可
4. **延迟与代码量都最优**：一次 LLM 调用拿到 plan，不绕路

### 后果与代价
- ✅ 不动现有 `agentRuntime.js` 主干
- ✅ Prompt 预算可控
- ❌ 无法对决策/执行/监督**分别配模型**（所有走 `agentModelSettings` 的同一个模型）
  - 缓解：在 skill 元数据加 `preferredModel` 字段，特殊 skill 调用前在 `requestAgentActionPlan` 临时切模型（V1 加）
- ❌ 监督层"自动跑"难做（要拦截 plan 输出后再走一次 skill）
  - 阶段 A 接受**手动触发监督**：用户点"让编辑看看"按钮

### 撤销条件
- 实测单一 runtime 无法承载所有职责（确认/恢复/澄清交错混乱）
- 商业模式必须**对外开放多 Agent 协作**作为卖点

---

## D4 · LLM 流式策略：阶段 A plan-execute，阶段 B 加 streaming

### 背景
- 现有 `agentApi.js` 用 `generateText`（非流式）
- Toonflow 用流式 + 工具调用（边说边干）
- 短剧业务里**生成分镜表/剧本**这类长内容，plan-execute 等待感强

### 决定
- ✅ **阶段 A** 沿用现有 plan-execute（一次性出 plan→预览→确认→执行）
- ✅ **阶段 B+** 在保留 plan-execute 的同时，**新增 streaming 路径**作为补充
  - 由 skill frontmatter 标记 `streaming: true` 选择路径
  - 长内容（分镜表 / 剧本 / 拍摄计划）→ streaming
  - 短动作（改 prompt / 连节点 / 加资产）→ plan-execute
- ✅ 阶段 A **不开发** streaming 基础设施

### 备选方案与否决理由
| 备选 | 否决理由 |
| --- | --- |
| 阶段 A 直接上 streaming | 改造 `agentRuntime.js` + 新建 `generateTextStream` + 改 validator + 改 UI 渲染，工作量 2-3 周；推翻现有 5 状态机 |
| 永远不做 streaming | 长内容体验真的差，阶段 D-E 用户量大后会反弹 |

### 拍板理由
1. **阶段 A 目标是功能闭环**：质量优先，体验可以稍后优化
2. **plan-execute 对短剧自用工作室友好**：确认 → 才动手，用户对结果有控制感
3. **streaming 是产品差异化点**：阶段 B+ 上有助于打造"边说边干"的旗舰体验
4. **现有架构平滑可扩**：plan-execute 与 streaming 不冲突，可共存

### 后果与代价
- ✅ 节省阶段 A 2-3 周开发时间
- ❌ 长内容生成时用户盯 spinner 较久（缓解：UI 显示进度条 + 估算剩余时间）

### 撤销条件
- 用户实测无法接受等待（典型剧本生成 > 60 秒）
- 模型供应商主动推流式 API + 工具调用，成本明显下降

---

## D5 · 分镜节点选型：复用 StoryboardScriptNode

### 背景
- 旧架构文档假设要新建 `StoryboardNode` 类型用于短剧
- 反推代码发现：CanvasPro **已存在 `StoryboardScriptNode`**，是个 LLM 驱动的分镜表节点
- 已有 15 个字段（镜号/时长/景别/场景/画面描述/角色/角色描述/角色动作/情绪/角色图/参考/图片提示词/视频提示词/对白/音效）
- 已支持表格/卡片视图切换、image/video 模式切换、批量派发生图

### 决定
- ✅ **直接复用** `StoryboardScriptNode` 作为短剧分镜节点
- ✅ 补完短剧需要但现有缺失的部分：
  - 单行级别的**生成状态显示**（pending / running / done / failed）
  - **视频生成直派**链路（现在 `mediaMode: 'video'` 但没完整跑通）
  - 节点与**项目/集**的关联（增 `projectId` / `episodeId` 字段）
  - **可拖入资产卡**（拖入主角资产 → 自动绑定到该镜头）
- ❌ 不动 `StoryboardNode`（图片拼图节点，与短剧无关）

### 备选方案与否决理由
| 备选 | 否决理由 |
| --- | --- |
| 新建短剧专属节点 | 重复造轮子，70% 功能 `StoryboardScriptNode` 已有 |
| 改造 `StoryboardNode` | 数据模型完全错配（图片拼图 vs 分镜表），改造比新建还贵 |

### 拍板理由
1. **节省 2-3 周开发时间**（节点骨架 + DOM + 序列化 + 编辑器）
2. **已有用户已习惯**该节点的交互，短剧用户上手成本低
3. **重新做一个反而不一致**：现有 prompt 字段命名都对齐了，没必要换

### 后果与代价
- ✅ 大量代码复用
- ❌ 补完缺失部分依然有 1-2 周工作量
- ❌ 该节点未来要支持自由画布与短剧两种用法，命名/字段需平衡

### 撤销条件
- 补完时发现节点深度耦合自由画布逻辑，无法解耦
- 短剧业务需求与节点设计哲学冲突（暂未发现）

---

## D6 · Agent 进程位置：renderer 内运行

### 背景
- 旧架构文档推荐"Agent 跑独立 UtilityProcess 子进程"
- 反推代码发现：现有 Agent **完全在 renderer 内**，通过 `aiTextApi.generateText` 调 LLM，不经过 server.py 也不经过 Electron 主进程

### 决定
- ✅ Agent 继续在 **renderer 进程内**运行
- ✅ `server.py` 不承担 AI 调用职责，只做：媒体处理 / 静态资源 / 数据库 / 远程代理 / 文件管理
- ✅ 主进程 IPC 只做：文件 / 窗口 / 系统集成 / 媒体任务队列调度（不参与 LLM 调用决策）

### 备选方案与否决理由
| 备选 | 否决理由 |
| --- | --- |
| 独立 UtilityProcess | 引入跨进程通信复杂度；为不存在的崩溃风险买单（现有 Agent 跑得很稳）|
| 跑 server.py | server.py 不是 AI 调用层；把它改造成 AI 层会破坏其媒体处理职责 |

### 拍板理由
1. **现有 Agent 已经稳定运行**：renderer 模式工作良好，没有崩溃问题
2. **renderer ↔ canvasCommands 零开销**：Agent 直接读 graphStore，调命令系统，性能最优
3. **UtilityProcess 适合长跑 + 重 IO 任务**：但短剧的 LLM 调用是请求响应式，不是长跑

### 后果与代价
- ✅ 架构简单
- ❌ Renderer 崩溃会带走 Agent（但 renderer 本就是 UI，没了也无意义）
- ❌ Agent 处理大 prompt（45KB）时占用 renderer 主线程
  - 缓解：现有 `generateText` 是 async 调用，不阻塞 UI
  - 缓解：预算管理（D7）保证 prompt 不会太大

### 撤销条件
- 短剧业务出现需要后台长跑的 AI 任务（如长剧本一次生成 30 集，需 1+ 小时）
  - 这种情况应该走"任务队列"而不是"Agent 子进程"

---

## D7 · Prompt 预算管理：skill 按角色/页面动态裁剪

### 背景
- 现有 `agentApi.js` 的 prompt 预算 **45,872 字符**（0xb3b0）
- 已经塞了：system prompt（20+ 细则）+ context（commands/skills/canvas/models）+ history + examples
- 短剧业务要新增 20-30 个 skill 描述 + 短剧专属细则
- 直接平铺撑爆预算的概率 = 100%

### 决定
- ✅ Skill 集合按**当前上下文**动态构造：
  - 页面维度：`/script-studio` → 只暴露 `director.*` + `supervisor.*`
  - 页面维度：`/canvas` → 只暴露 `production.*` + `supervisor.*` + 原 4 个自由画布 skill
  - 项目类型维度：`projectType: freeform` → 只暴露原 4 个 skill，**不暴露任何短剧 skill**
- ✅ Skill 描述符在 prompt 里只携带**摘要**（id + title + appliesWhen + commands 列表），**正文不进 prompt**
- ✅ 当用户消息匹配某 skill 的 `appliesWhen` 时，由 planner **二次调用**取该 skill 的完整 prompt 正文（D2 的 markdown 正文）注入到下一轮调用
- ✅ 现有的 6 级 prompt 压缩机制（`compactPlannerContext`）保留，作为最后兜底

### 备选方案与否决理由
| 备选 | 否决理由 |
| --- | --- |
| 所有 skill 平铺到 prompt | 撑爆预算；模型选错 skill 概率高 |
| 全部走 RAG/embedding 检索 | 引入 embedding 依赖（ONNX 模型 + 索引）+ 增加延迟 + 复杂度激增 |
| 让用户手动选 skill 后再用 | 失去"自然语言驱动"的产品价值 |

### 拍板理由
1. **预算硬约束**：45KB 是 prompt 上限，必须裁剪
2. **页面/项目类型是天然分组**：用户在哪个页面就该有哪些能力
3. **二次调用是 Anthropic / OpenAI 都支持的标准模式**：第一轮选 skill，第二轮带 skill prompt 出 plan
4. **D3 的"三层 skill 分组"在此自然落地**：分组 = 减少 prompt 暴露面

### 后果与代价
- ✅ Prompt 预算可控
- ✅ 自由画布用户不会被短剧 skill 干扰
- ❌ 二次调用增加 LLM 成本（每个用户请求要调 2 次 LLM）
  - 缓解：第一轮只用便宜的 Haiku/Flash 类模型选 skill，第二轮才上强模型
- ❌ 二次调用增加延迟 ~1-2 秒
  - 缓解：UI 显示"正在挑选合适的工具…"的过渡状态，掩盖延迟感

### 撤销条件
- 模型供应商推出超大上下文（200K+）且价格亲民，平铺也撑得住
- 二次调用模式实测无法满足质量诉求（一轮选错 skill 二轮没救）

---

## D8 · 已敲定的 8 项业务决策

这 8 项已在 02-pipeline §11 和 01-architecture §12 里有完整记录，此处仅汇总，**不再展开**：

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

## 决策的优先级与冲突处理

文档间冲突的处理顺序：

```
00-vision.md     (最高: 产品定位)
   ↑
05-decisions.md  (本文件: 跨文档决策)
   ↑
03-glossary.md   (术语)
   ↑
04-current-stack.md (现状摸底，事实层)
   ↑
02-pipeline.md   (流程)
   ↑
01-architecture.md (架构)
```

发现冲突时：
1. 看上层文档怎么说，按上层处理
2. 上层未涉及 → 在本文件加新决策条目
3. 决策需推翻 → 加"撤销记录"小节，**不删除原条目**

---

## 撤销记录

> 任何决策被后续推翻，在此追加一条记录，**保留历史可追溯性**。
> 格式：`[D#] 推翻日期 / 原因 / 替代方案 / 影响章节`

（暂无撤销记录）

---

## 待补条目（V1+）

以下决策暂未到拍板时机，留位：

- **D9**：实时协作冲突解决方案（OT vs CRDT）— 阶段 E 再定
- **D10**：SQLite → PostgreSQL 切换阈值 — 待团队规模数据
- **D11**：Skill 第三方上传与审核机制 — 阶段 F 商业化时
- **D12**：版权水印策略（生成内容是否强制水印） — 阶段 F 商业化时

---

## 给后续开发者的快速参考卡

> 如果你只看这一页就开工，记住这 7 条：

1. **不要 fork Toonflow Agent 代码**，扩展 `src/modules/agent/`
2. **Skill 写 markdown**，不写代码内的字符串数组
3. **不要做三个 Agent 进程**，单 Agent + skill 分组分类
4. **阶段 A 不做 streaming**，沿用 plan-execute
5. **分镜节点用 `StoryboardScriptNode`**，不要新建
6. **Agent 跑 renderer**，不要塞进 server.py 或 UtilityProcess
7. **Prompt 预算 45KB**，skill 摘要进 prompt，正文按需二次调用注入

---

**版本**：v0.1 · 初稿
**最后修订**：2026-06-28
**依赖**：04-current-stack.md v0.1（事实层）, 03-glossary.md v0.1（术语）
**下一步**：根据本文件修订 `01-architecture.md` §2/§4/§5/§11 和 `02-pipeline.md` §3/§4
