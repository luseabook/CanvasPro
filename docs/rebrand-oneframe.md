# 品牌换牌：一帧 OneFrame

> 本文件记录 **CanvasPro → 一帧 OneFrame** 这次换牌的完整边界：改了什么、**刻意没改**什么、
> 老用户数据怎么迁、升级时会看到什么。后续任何人再动品牌相关代码，先读这份再改。

参考实现：`F:\Canvas`（同一上游的换牌版，0.8.9 血统）。本仓库是 0.4.12 血统，
所以只沿用它的**命名规范与迁移策略**，没有直接搬它的文件（两代结构不同）。

---

## 1. 命名规范（唯一口径）

| 场景 | 取值 | 出现位置 |
| --- | --- | --- |
| 产品全名 / 署名 / 安装程序 | `一帧 OneFrame` | `package.json` productName、`electron-builder.win.cjs`、安装向导、关于页署名 |
| 正文中的产品名（句子内） | `OneFrame` | i18n 文案、Electron 窗口标题/对话框/通知、后端 `DEFAULT_PRODUCT_DISPLAY_NAME` |
| logo 中文简称 | `一帧` | 左上角 wordmark（`data-product-name="wordmark"`） |
| 文档标题 | `一帧 OneFrame · 无限画布` | `index.html` `<title>`、i18n `app.documentTitle` |
| 应用标识（AppUserModelId / appId） | `com.oneframe.app`（dev `com.oneframe.app.dev`） | builder 配置、任务栏身份 |
| userData 目录 | `OneFrame` | `electron/main.js` |
| 工程目录名（web 模式默认） | `OneFrame Project` | `server.py` |

替换口径由 `src/services/productBranding.js` 统一执行：它把文案里的 `Canvas` / `SHUO Canvas` /
`AI CanvasPro` / `AiCanvas` / `AICanvas` 统一换成产品名，并负责 wordmark、关于页、页脚、
保存路径占位符。**新增品牌文案请走 i18n + 该模块，不要在各处硬编码。**

---

## 2. 改动分层

| 层 | 文件 | 内容 |
| --- | --- | --- |
| 包与安装 | `package.json`、`electron-builder.win.cjs`、`electron-builder.win.dev.cjs` | name/productName/description/author、appId、artifactName、shortcutName、copyright |
| 主进程 | `electron/main.js` | `APP_DISPLAY_NAME`、userData 目录、启动迁移钩子、工程对话框过滤器 |
| 数据迁移 | `electron/brandDataMigration.js`（新增） | `%APPDATA%/CanvasPro` → `%APPDATA%/OneFrame` 复制式迁移 |
| 通知/诊断 | `backgroundCompletionNotification`、`diagnostics`、`chromeShell*`、`windowsTaskbarIdentity` | 默认应用名、诊断包名、窗口标题匹配（新旧品牌都认） |
| 渲染层 | `index.html`、`src/i18n/messages/*`、`productBranding.js`、`providers.js`、`modelConfig.js`、`shortcuts.js`、story/storyboard 首页 | 标题、logo、关于页、页脚、Agent 名、预设名、开发者占位厂商名 |
| 后端 | `server.py`、`backend/shortdrama_db.py`、`shortdrama_routes.py`、`knexfile.cjs`、各 service | 服务标题、默认工程目录、短剧库目录、User-Agent、argparse 描述 |
| 安装清理 | `build/uninstall-program-files.ps1` | 卸载时保留的数据目录白名单加入新品牌名 |
| 资源 | `images/favicon.svg`、`images/brand/oneframe-*.svg`、`build/app-icon.ico` | 取自参考项目 `F:\Canvas` 的 OneFrame 图标 |

---

## 3. 刻意**没有**改的（换牌不等于全仓替换）

| 保留项 | 原因 |
| --- | --- |
| `https://github.com/luseaer-ship-it/CanvasPro` 等仓库地址 | 更新源/教程源的真实地址，改了会直接断更新 |
| `https://gateway.ashuoai.com`、`api.ashuoai.com` 等域名 | 账号/订阅/反馈图床的真实服务端；换域名等于换后端 |
| `OBJECT_STORAGE_KEY_PREFIX = 'SHUO-Canvas'` | 对象存储 key 前缀，改了会让已上传素材对不上号 |
| `X-AICanvas-Server: Canvas` 协议头与 `SERVER_ID_VALUE` | 前后端握手值，改一侧就永远「正在启动」（已在代码里注释说明） |
| `%LOCALAPPDATA%/AI-CanvasPro`、`user/Canvas Project` 等 legacy 路径 | 只作为**回退**保留，保证老数据能读到；新写入走新品牌目录 |
| `src/modules/shortcuts.js` 的 `ASHUO_PRESET_*` 常量名 | 只改值（预设显示名），标识符保留以免大面积改测试与调用点 |
| `windowsTaskbarIdentity.js` 的 `namespace ShuoCanvas` 与 native 导出名 | 与 `native/` 里的 C# hook 导出名绑定，改名会直接失效 |
| 代码里的 `Canvas` API / `canvasTitle` / `Canvas 转码失败` 等 | 指 HTML Canvas 或画布概念，不是品牌 |
| `release_notes.txt`、`docs/TRACKING.md` 等历史记录 | 历史流水不改写 |
| `tools/` 里的 `F:\CanvasPro` 路径 | 仓库目录名没变，改工具路径会跑不起来 |

---

## 4. 老用户数据怎么迁

`electron/brandDataMigration.js` 在 `app.setPath('userData')` **之前**执行：

1. 旧目录 `%APPDATA%/CanvasPro`（其次 `%APPDATA%/AI CanvasPro`）存在、新目录不存在或为空
   → 复制用户数据到 `%APPDATA%/OneFrame`，并写标记文件 `.migrated-from-canvaspro`；
2. 新目录已有内容 → 跳过（不覆盖新数据）；
3. 旧目录**保留不删**，可随时回滚；
4. 跳过 `Cache`、`GPUCache`、`Code Cache`、`chrome-shell-profile*` 等可再生目录；
5. 单个文件失败不中断，最多记录 20 条错误；
6. 测试隔离环境（`AIC_USER_DATA_ROOT`）或 `AIC_SKIP_USERDATA_MIGRATION=1` 时跳过。

短剧 SQLite 库（`%APPDATA%/<品牌>/shortdrama.db`）**不复制**，只做目录回退：新目录不存在时继续用旧的，
避免运行中复制数据库拿到半写状态。web 模式的 `user/OneFrame Project` 同理——旧目录还在就继续用旧目录。

---

## 5. 升级影响（交付时必须告知用户）

- `appId` 由 `com.aicanvaspro.editor` 改为 `com.oneframe.app`，NSIS 会把它当**全新产品**：
  与旧版**并列安装**（独立安装目录、开始菜单项、卸载记录），不会覆盖旧版。
  正式切换时建议先卸载旧版，避免同时存在两个自动更新源。
- 安装包名由 `Canvas-Setup-*.exe` 改为 `OneFrame-Setup-*.exe`；发布脚本/下载页链接需同步。
- 用户数据自动迁移一次，旧目录保留。

---

## 6. 验收

| 项 | 结果 |
| --- | --- |
| `node tools/deobf-gate.mjs` | PASS |
| `node tools/check-csp.mjs` | PASS |
| 换牌相关单测（迁移/标题匹配/通知/截图窗口/taskbar） | 222/222 |
| 新增 `electron/brandDataMigration.test.js` | 6/6 |
| 全量 JS | **11319 / 11319 通过 / 0 失败**（原基线 14 例失败一并清零） |
| 后端全量 | 223 例 / 3 失败，均为**既有符号链接环境限制**（本机 `os.symlink` 只建 0 字节普通文件），与换牌无关 |
