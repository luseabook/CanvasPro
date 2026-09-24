# 管理后台需求文档 (Admin Console Requirements)

> **文档性质**：需求规格说明书（SRS）。描述当前项目**缺失的管理后台能力**及应补齐的功能范围。
> **撰写立场**：用户为项目所有者 / 运营方，需要一个能管理授权码、套餐、联系方式、更新源、公告等的运营侧后台。
> **现状基线**：截至 2026-09-22，仓库内**不存在任何管理后台**（无 admin 页面 / 路由 / 数据表）。

---

## 1 · 背景与结论

### 1.1 现状

项目当前的"配置"只有两类，**都不是运营侧后台**：

| 类型 | 位置 | 面向对象 | 可改性 |
|---|---|---|---|
| 设置面板（7 个 pane） | `index.html:806-897` | 终端用户 | 改本机行为 |
| 服务端环境变量（约 15 个 `AIC_*`） | `server.py` | 部署者 | 需改环境 + 重启 |

菜单栏里最接近"管理"的只有设置 → **API Key**（`index.html:2295`），那是让**用户自己**填各家 provider 的密钥，与运营无关。

### 1.2 核心结论

所有运营参数目前以三种方式散落：

1. **硬编码常量**（如授权服务地址、GitHub 更新源、联系方式兜底）；
2. **服务端环境变量**（需重启才生效、无 UI）；
3. **前后端双份字面量**（如 VIP 门禁清单在 JSON 与 JS 各存一份，需人工保持一致）。

结果是：**改动成本高、无法远程下发、容易前后端不一致**。本需求文档旨在定义一套管理后台，把上述参数收拢为可运营、可审计的配置。

### 1.3 关键约束（影响方案边界）

| 约束 | 说明 | 影响 |
|---|---|---|
| C1 · 远端授权服务不在本仓库 | 授权码校验 100% 转发到 `api.ashuoai.com`（`subscription_client.py:176-190`），本地只做透传 | 授权码的真实签发/校验逻辑**必须落在远端服务**，本地后台只能做代理或需远端配合 |
| C2 · 本地无授权相关数据表 | 唯一迁移 `db/migrations/001_short_drama_core.cjs` 是 17 张短剧表，无 cdkey/subscription/order 表 | 若要本地落库，需新增迁移 |
| C3 · 更新源硬编码 | `hot_update_service.py:26-29`、`AutoUpdate.js:10`、`index.html:320` | 改为可配置需同时改多处 |
| C4 · 热更新为强覆盖 | `apply_hot_update()` 执行 `git fetch` + `git reset --hard FETCH_HEAD`（`hot_update_service.py:333-357`） | 无渠道/灰度，改动风险高 |
| C5 · 桌面端 updater 无本地 publish 配置 | `package.json` 无 `build`/`publish` 字段，feed 由 CI 生成（`.github/workflows/mac-arm64-build.yml:117-183`） | 桌面更新源管理需与 CI 流程联动 |
| C6 · 双份门禁清单 | `src/manifests/subscription/subscriptionGateManifest.json` 与 `subscriptionAccess.js:8-91` | 需消除手抄两份的隐患 |

---

## 2 · 目标与范围

### 2.1 目标

- **G1** 运营方无需改代码/改环境变量，即可管理授权码、套餐、联系方式、更新源、公告。
- **G2** 消除前后端双份配置，改为单一数据源下发。
- **G3** 具备最小可用的操作审计能力（谁在何时改了什么）。

### 2.2 范围内（In Scope）

- 授权码（CDKEY）生命周期管理
- 套餐与模型门禁（VIP gate）配置
- 联系方式（微信 / 二维码 / 文案）配置
- 远端授权服务地址、超时等运营参数配置
- 更新源（仓库 / 分支 / 渠道）与版本发布信息管理
- 公告、教程、供应商推广链接管理
- 设备与用户（授权维度）查看与处置

### 2.3 范围外（Out of Scope）

- 短剧业务（`o_*` 表）的内容运营
- 用户端各 provider 的 API Key 管理（属客户端本地设置）
- 原生安装包签名 / 应用商店发布流程

---

## 3 · 角色与权限

| 角色 | 说明 | 权限 |
|---|---|---|
| 超级管理员 | 项目所有者 | 全部功能，含管理员账号管理与审计导出 |
| 运营 | 日常运营人员 | 授权码、联系方式、公告、推广位；不可管理管理员/更新源 |
| 只读 | 客服 / 观察者 | 查询授权码、设备状态；无写权限 |

> 注：当前本地"清空授权"是**开发模式专属且只清本机**（`server.py:1333-1378`），不能作为运营手段，需由后台的正式能力替代。

---

## 4 · 功能需求

编号约定：`FR-<模块>-<序号>`；优先级：`P0` 必须、`P1` 重要、`P2` 可选。

### FR-1 授权码（CDKEY）管理

| 编号 | 需求 | 优先级 |
|---|---|---|
| FR-1.1 | 单个/批量生成授权码（自定义前缀、数量、有效期、绑定套餐） | P0 |
| FR-1.2 | 列表查询：按状态（未用/已用/过期/作废）、套餐、批次、关键字筛选与分页 | P0 |
| FR-1.3 | 查看使用详情：绑定设备、激活时间、到期时间、最近校验时间 | P0 |
| FR-1.4 | 作废/回收单个或整批授权码；支持解绑设备 | P0 |
| FR-1.5 | 延长/缩短有效期；套餐变更（升/降级） | P1 |
| FR-1.6 | 导出 CSV/Excel；生成兑换链接与二维码 | P1 |
| FR-1.7 | 用量统计：激活数、活跃数、到期趋势、套餐分布 | P1 |

> **依赖**：C1/C2。真实签发与校验须在远端服务实现；本地侧提供**透传代理 + 可选本地缓存**，不得在客户端落地明文密钥。
> **现状缺口**：`server.py:327-328` 定义了 `INVALID_CDKEY` / `CDKEY_ALREADY_USED` 错误码但**全项目无人使用**，说明本地从无校验逻辑。

### FR-2 套餐与模型门禁（VIP Gate）管理

| 编号 | 需求 | 优先级 |
|---|---|---|
| FR-2.1 | 套餐 CRUD：名称、显示名、价格、有效期 | P0 |
| FR-2.2 | 套餐↔模型映射：维护 `modelId / workflowId / aliases / legacyAliases / providers / modelPrefixes` | P0 |
| FR-2.3 | 一键校验/生成门禁清单，**同时下发**给前端与后端，消除双份手抄（C6） | P0 |
| FR-2.4 | `legacyAliases[].deleteWhen` 的到期提醒（提示何时可删旧别名） | P2 |
| FR-2.5 | 授权用户已购模型集合（`entitledModelIds`）的查询与人工调整 | P1 |

> **现状基线**：8 个 gate，字段结构见 `subscriptionGateManifest.py` 的 `_normalize_gate_entry`；前端内联副本见 `subscriptionAccess.js:8-91`。

### FR-3 联系方式管理

| 编号 | 需求 | 优先级 |
|---|---|---|
| FR-3.1 | 编辑联系文案（`contactText`）、微信（`contactWechat`）、二维码图片（`contactUrl`） | P0 |
| FR-3.2 | 支持多语言（zh-CN / en-US）分别配置 | P1 |
| FR-3.3 | 预览：模拟订阅中心与拦截弹窗中的展示效果 | P2 |
| FR-3.4 | 图片上传/替换，避免依赖固定 URL | P1 |

> **现状缺口**：值只来自远端 payload 或环境变量 `AIC_SUB_CONTACT_TEXT` / `AIC_SUB_CONTACT_WECHAT` / `AIC_SUB_CONTACT_URL`（`server.py:332-343`），前端还有硬编码兜底（`subscriptionAccess.js:245-246`、`appPanels.js:18-20`、`legacyInitialState.js:76`）。

### FR-4 服务端运营参数管理

| 编号 | 需求 | 优先级 |
|---|---|---|
| FR-4.1 | 配置远端授权服务地址（当前硬编码 `https://api.ashuoai.com`，`server.py:345`） | P0 |
| FR-4.2 | 配置备用线路 / 超时（`AIC_SUBSCRIPTION_TIMEOUT_SEC`，默认 5s，`server.py:1108-1112`） | P1 |
| FR-4.3 | 配置门禁缓存容量与开关（`SubscriptionGateService` 的 `cache_max=2048`） | P2 |
| FR-4.4 | 生成/轮换本地访问令牌（`AIC_LOCAL_TOKEN`，`server.py:233`） | P1 |

> **现状**：地址与超时仅能通过环境变量覆盖，且需 `AIC_DEV_MODE` / `AIC_ALLOW_SUBSCRIPTION_API_OVERRIDE` 才生效（`server.py:1096-1104`），无 UI。

### FR-5 更新源与版本发布管理

| 编号 | 需求 | 优先级 |
|---|---|---|
| FR-5.1 | 配置热更新仓库地址、分支、remote 优先级（现硬编码 `hot_update_service.py:26-29`） | P0 |
| FR-5.2 | 配置更新渠道（stable / beta），支持灰度比例 | P1 |
| FR-5.3 | 编辑版本号与发布说明（现为 `index.html:7` meta + 根目录 `release_notes.txt`） | P0 |
| FR-5.4 | 上传/替换预览视频（`[previewVideoUrl]` 语法，`hot_update_service.py:15-18`） | P2 |
| FR-5.5 | 更新前风险确认（因 C4 强覆盖式热更新，需二次确认 + 回滚提示） | P0 |

> **现状**：`AutoUpdate.js:10` 的 `FALLBACK_RELEASE_URL` 与 `index.html:320` 亦为硬编码；桌面端 feed 需与 CI（`.github/workflows/mac-arm64-build.yml`）联动（C5）。

### FR-6 公告 / 教程 / 推广位管理

| 编号 | 需求 | 优先级 |
|---|---|---|
| FR-6.1 | 公告的增删改查与定时上下线 | P1 |
| FR-6.2 | 教程视频列表维护（现硬编码于 `appPanels.js:29-42`） | P2 |
| FR-6.3 | 供应商注册链接与推广参数维护（现硬编码 9 条 `data-external-url`，如 `aff=ashuoai`、`inviteCode=rh-v1312`） | P1 |

### FR-7 设备与用户（授权维度）管理

| 编号 | 需求 | 优先级 |
|---|---|---|
| FR-7.1 | 设备列表：`installId` / `deviceId` / 最近活跃 / 绑定套餐 | P0 |
| FR-7.2 | 单设备解绑 / 封禁 / 强制下线 | P0 |
| FR-7.3 | 按 installId 查询完整授权历史 | P1 |

> **现状**：无任何设备/用户管理；`o_user` 表属短剧业务，与授权无关。

---

## 5 · 非功能需求

| 类别 | 需求 |
|---|---|
| 安全 | 后台独立鉴权（不复用客户端本地 token）；所有写操作需二次确认；CDKEY 明文仅在生成时展示一次，库中存哈希 |
| 审计 | 记录操作人 / 时间 / 对象 / 变更前后值，支持导出（对应 G3） |
| 性能 | 列表查询支持万级授权码分页 < 500ms；缓存失效需与 `SubscriptionGateService.clear_vip_allow_cache` 联动 |
| 兼容 | 联系方式/更新源改动需对**已发布客户端**生效（即走后端下发或服务端配置，而非改前端常量） |
| 可用性 | 后台不可用不得阻塞客户端激活与门禁校验（保留现有"远端不可达则按未激活"降级，`subscription_client.py` 返回 `None` 的语义） |
| 部署 | 本地后台需 `AIC_DEV_MODE` 之外，另设独立运行模式，避免与客户端同端口暴露 |

---

## 6 · 分阶段落地建议

| 阶段 | 内容 | 说明 |
|---|---|---|
| MVP | FR-1.1/1.2/1.3/1.4、FR-3.1、FR-4.1 | 打通"发码 → 用户激活 → 改联系方式"最小闭环；**须远端服务提供 admin API** |
| P1 | FR-2.1/2.2/2.3、FR-5.1/5.3/5.5、FR-6.1/6.3、FR-7.1/7.2、FR-1.5/1.6 | 消除双份清单、引入渠道与审计 |
| P2 | 其余 | 统计、灰度、预览类增强 |

> **前置工作**：MVP 之前需在远端 `api.ashuoai.com` 侧定义 `/admin/*` 接口契约（本仓库无法单独完成，见 C1）。

---

## 7 · 验收标准（摘）

- 无需修改任何源码或环境变量，即可完成：生成一批授权码 → 用户激活成功 → 后台看到绑定设备。
- 修改联系方式后，**未重新打包的旧客户端**重启即可看到新值。
- VIP 门禁清单只有**一处**数据源，改后前后端一致（消除 C6）。
- 所有后台写操作均产生审计记录。

---

## 附录 A · 现状硬编码点清单（改造目标位置）

| 项 | 位置 |
|---|---|
| 授权服务地址 | `server.py:345`（`OFFICIAL_SUBSCRIPTION_API_BASE`） |
| 授权服务覆盖开关 | `server.py:1096-1104`；超时 `server.py:1108-1112` |
| 联系文案 / 微信 / 图片默认值 | `server.py:332-343` |
| 联系方式前端兜底 | `subscriptionAccess.js:242-246`、`appPanels.js:18-20`、`legacyInitialState.js:76` |
| 门禁清单（后端） | `src/manifests/subscription/subscriptionGateManifest.json` |
| 门禁清单（前端副本） | `subscriptionAccess.js:8-91` |
| 更新源 / 分支 / remote 优先级 | `hot_update_service.py:26-29` |
| 更新兜底链接 | `AutoUpdate.js:10` |
| 版本号 | `index.html:7`（`app-version`） |
| 发布说明 / 预览视频 | 根目录 `release_notes.txt` |
| GitHub 与推广外链 | `index.html`（9 条 `data-external-url`） |
| 教程视频列表 | `appPanels.js:29-42` |
| 服务端开关 | `server.py:228`（`AIC_BIND_HOST`）、`server.py:233`（`AIC_LOCAL_TOKEN`）、`server.py:298`（`AIC_USER_DIR`） |
| 未使用的错误码（历史遗留） | `server.py:327-328` |
