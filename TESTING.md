# 本地回归与隔离验收

依赖：Node.js 24、Python 3.10+；Windows 默认复用 `venv/Scripts/python.exe`，可用 `AIC_TEST_PYTHON` 指定解释器。先执行 `npm ci`，再安装项目 `requirements.txt` 中后端需要的 Python 依赖。没有系统 Chrome/Edge 时执行 `npx playwright install chromium`（Linux CI 可加 `--with-deps`）。

```sh
npm run test:stability
npm run test:backend
npm run test:migrations
npm run test:e2e
npm run test:desktop
npm run verify:startup
```

- E2E 启动真实 `server.py`，默认独占 `127.0.0.1:18779`；可用 `AIC_E2E_PORT` 换端口。**不会复用已经运行的服务**。
- 每次创建独立临时用户目录、作品目录和 SQLite 数据库；不读写安装版或现有作品。测试环境不继承密钥、令牌、代理配置。
- 浏览器禁止跨源请求；临时 `sitecustomize.py` 禁止 Python 访问外网和其他本机模型服务。不会点击模型生成，不产生真实模型调用。
- 断言覆盖 Story 布局/弹出菜单/隐藏上传输入/窄屏/模式切换、Toast 边界、真实 HTTP 鉴权/静态文件访问/JSON 路径边界。
- 截图、失败 trace 和报告保存在已忽略的 `test-results/`、`playwright-report/`；测试结束清理临时后端和测试目录。
- `test:stability` 是本次修复的定向回归集，不等同于整个仓库所有单测。`test:backend` 的符号链接用例会在 Windows 没有创建权限时明确跳过。

构建前需按项目打包约定准备 `.electron-runtime/runtime`。只做解包目录检查，不覆盖安装版：

```sh
npm run check:package
```

检查脚本为每次构建新建 `test-artifacts/package-check-*` 目录，复用版本一致的 Electron 依赖，固定 `--publish never`，关闭签名和发布凭据，验证包内 CSS/数据库 schema/后端文件，并用打包的 Python 检查依赖与 17 表初始化。本地验证不会安装应用、提交、推送或发布。Mac 打包需要在 macOS/CI 中验证。


## 桌面测试的额外隔离

`test:desktop` 每例创建独立 Electron 用户目录、文件目录和随机空闲端口。关闭端口抢占/回收、全局快捷键、选择文本/剪贴板捕获预热和系统最近文档同步；设备身份与设置不会回读历史安装目录。测试会构造一个自己的隐藏窗口验证退出，不读取桌面截图或剪贴板，也不触发模型生成。

四项桌面断言分别验证：等待真实 Story 保存请求再关闭；保存失败默认取消退出且后端仍可用；更新事件与 IPC 失败反馈去重；用户明确放弃后能够关闭（即使渲染器还在阻止卸载）。macOS 保持关闭窗口不直接退出应用的约定。仅测试清理阶段可以跳过人为注入的保存失败以回收测试进程；生产关闭逻辑没有此绕过。

正常运行不设置这些隔离变量，原有账户、授权和保存目录选择保持默认行为。不要把测试数据目录当作正式作品目录使用。


## 资源与验证边界

源仓库未包含 `images/story-styles/` 的原始风格预览图。界面保留原预览地址，缺图时切换为明确标注“预览暂缺”的本地占位图，原始风格标签、提示词与生成参数不变；以后补回原素材即可恢复原图。没有伪造真实风格效果图，也未为此调用模型。

浏览器与桌面报告分别在 `playwright-report/browser/`、`playwright-report/desktop/`，结果在 `test-results/browser/`、`test-results/desktop/`，可并行运行而不互相删除报告。Windows 强制停止测试服务时，拥有该服务的 Playwright CLI 会在退出阶段清理有本测试指纹的临时目录；不会扫描或清理正常作品目录。

本机 venv 可能输出 `Could not find platform independent libraries <prefix>` 提示；请以断言结果和退出码判断测试结果。随包 Python 另有实际依赖导入和数据库 schema 检查。解包检查不执行安装程序、真实更新或签名，不能替代这些最终发布验收。
