> **给 AI 助手和开发者**：在本仓库做任何分析或修改之前，先读 [`AGENTS.md`](AGENTS.md)（强制规则），再读项目入口文档 [`docs/TRACKING.md`](docs/TRACKING.md)。
> ⚠️ 文件改动跟踪机制自 2026-09-29 起**暂停**，详见 `AGENTS.md` §0。

<div align="center">

<img src="images/favicon.svg" width="64" height="64" alt="Canvas Logo"/>

# Canvas

**基于节点的 AI 多模态画布编辑器**

一款纯原生 Web 应用（HTML / CSS / ES Modules），在无限画布上通过可视化节点连线组合 AI 能力，生成文本、图像、视频与音频；可运行于浏览器，也可打包为 Electron 桌面应用。

</div>

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | 原生 ES Modules（无框架、无打包器）、原生 CSS |
| 本地后端 | Python 3.10+，标准库 `http.server` + 自定义路由分发 |
| 桌面 | Electron（可选），渲染进程全面沙箱化 |
| 存储 | JSON 文件（`user/`）+ SQLite（knex 迁移）+ 本地媒体目录 |
| 测试 | `node --test` 单测、Playwright E2E / 桌面测试、Python `unittest` |

## 目录结构

```
.
├── index.html          # 单入口 SPA（仅 2 个 module script）
├── main.js             # 前端引导入口
├── server.py           # 本地后端（HTTP 服务 + API 路由）
├── src/                # 前端源码
│   ├── core/           # 运行期内核（画布 / 任务 / 生成流转）
│   ├── modules/        # 业务模块（storyWorkspace、personReplacement 等）
│   ├── components/     # 画布节点与 UI 组件
│   ├── services/       # 前端服务层
│   ├── manifests/      # 模型 / 厂商清单
│   ├── i18n/           # 多语言
│   └── config/ domain/ hooks/ ui/ utils/
├── api/                # 前端 API 客户端与请求适配
├── backend/            # Python 后端服务与路由（backend/services/）
├── electron/           # Electron 主进程 / 预加载 / 窗口
├── db/                 # SQLite schema 与 knex 迁移
├── styles/ + style.css # 样式（模块 css + 主样式）
├── tools/              # 门禁与开发脚本
├── e2e/                # Playwright 测试
├── docs/               # 专题文档与跟踪记录
└── vendor/ native/ images/ assets/
```

## 快速开始（开发环境）

前置：Node.js ≥ 24、Python ≥ 3.10、Git；视频处理需 FFmpeg（可用 `AIC_FFMPEG_EXE` / `AIC_FFPROBE_EXE` 指定路径）。

```bash
git clone https://github.com/luseaer-ship-it/CanvasPro.git
cd CanvasPro
npm ci
python -m venv venv
venv\Scripts\activate.bat        # Windows
pip install -r requirements.txt
```

启动：

```bash
# 浏览器版 → http://localhost:8777
python server.py
# 等价于
npm run web

# 桌面版（Electron）
npm run desktop
```

首次使用（或剧本工作室等依赖数据库的能力）先执行迁移：`npm run migrate`。

## 主要能力

画布支持自由缩放平移、小地图、多画布与项目 JSON 导入导出；节点类型涵盖 AI 图像 / 文本 / 视频 / 音频生成、360 全景、3D 导演台与注释节点。完整功能与操作见 [`使用说明.md`](使用说明.md)。

## 开发命令

| 命令 | 说明 |
| --- | --- |
| `npm run web` | 以 venv Python 启动本地服务 |
| `npm run desktop` / `npm run desktop:solo` | 启动 Electron 桌面应用（带 / 不带预设端口） |
| `npm run migrate` / `npm run migrate:rollback` | 数据库迁移 / 回滚 |
| `npm run build:win` | 打包 Windows 桌面应用（electron-builder） |
| `npm test` | 门禁合集：去混淆 + JS 单测 + CSP + 后端测试 |

## 测试与质量门禁

项目自带完整门禁，CI（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)）逐步执行：

| 命令 | 内容 |
| --- | --- |
| `npm run check:obfuscation` | 去混淆残留扫描（全仓） |
| `npm run test:js` | `node --test` 全量 JS 单测 |
| `npm run check:csp` | CSP 静态门禁（禁止内联脚本 / `eval`） |
| `npm run test:backend` | Python 后端单测 |
| `npm run test:migrations` | 迁移与 17 表 schema 检查 |
| `npm run check:package` | 打包结构检查（不安装、不发布） |
| `npm run test:e2e` / `test:desktop` / `test:stability` / `verify:startup` | E2E / 桌面 / 稳定性 / 启动检查 |

测试的隔离、端口与清理约定见 [`TESTING.md`](TESTING.md)。

## 架构概览

- **前端**：`index.html` 单入口加载 `main.js`，再沿 ESM 依赖图装配 `src/`。`src/core` 承担运行期内核，`src/modules` 承载业务，`src/components` 提供画布节点，`api/` 封装对外请求。
- **后端**：`server.py` 基于标准库 HTTP 服务器；除静态资源外，路由按职责拆分到 `backend/services/*_route_service.py`，由 `HttpRouteDispatcher` 分发。出站请求统一走 `outbound_http_transport`（含 SSRF 防护），文件访问经 `static_file_access` / `path_security` 收敛。
- **桌面**：`electron/main.js` 主进程 + `preload.cjs` 预加载，所有窗口统一 `contextIsolation: true` / `nodeIntegration: false` / `sandbox: true`。
- **安全基线**：严格 CSP（`script-src 'self'`，无 `unsafe-inline`）、本地 API 访问控制（Origin / loopback / 本地令牌）。

## 数据与存储

| 路径 | 内容 |
| --- | --- |
| `user/Canvas Project/` | 画布项目（标准 JSON） |
| `user/{settings,config,shortcuts}.json` | 应用设置 / API Key / 快捷键 |
| `data/uploads/`、`data/assets/` | 上传文件与素材 |
| `output/` | 生成结果 |
| SQLite（`db/`） | 剧本工作室等领域数据 |

以上目录均在 `.gitignore` 中，属本机运行时数据。

## 配置与环境变量（常用）

| 变量 | 作用 |
| --- | --- |
| `AICANVAS_PORT` | 后端端口（默认 `8777`） |
| `AIC_BIND_HOST` | 绑定地址（默认 `127.0.0.1`） |
| `AIC_LAN_MODE` / `AIC_ENABLE_LAN` | 开启局域网访问 |
| `AIC_FFMPEG_EXE` / `AIC_FFPROBE_EXE` | 指定 FFmpeg / FFprobe |
| `AIC_ALLOWED_ORIGINS` | 允许的跨源来源 |
| `AIC_TEST_PYTHON` | 测试使用的 Python 解释器 |

运行后在应用内「**设置 → API 输入**」填写各厂商 API Key（厂商清单见 [`使用说明.md`](使用说明.md)）。

## 发布

Windows 一键整合包从 [Releases](https://github.com/luseaer-ship-it/CanvasPro/releases) 下载；开发者本地打包使用 `npm run build:win`。

## 文档索引

| 文档 | 用途 |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | 本仓库强制规则（AI 与开发者必读） |
| [`docs/TRACKING.md`](docs/TRACKING.md) | 项目入口文档：现状、进度与批次记账 |
| [`使用说明.md`](使用说明.md) | 面向用户的功能与操作手册 |
| [`TESTING.md`](TESTING.md) | 测试与隔离验收说明 |
| `docs/*.md` | 各子系统专题文档 |

## 开发约定

- 遵守 `AGENTS.md` 的强制规则；改动前先读 `docs/TRACKING.md`。
- 文件改动跟踪机制当前**暂停**（2026-09-29 起），不要运行跟踪脚本或恢复自动监视。
- 前端遵守严格 CSP：不得引入内联脚本 / 事件处理器、`eval` / `new Function`。
- 新增或修改逻辑请配套 `*.test.js`，提交前跑对应门禁。

## 许可

见 [`LICENSE`](LICENSE)。
