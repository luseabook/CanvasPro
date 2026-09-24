# 第十七批：原工程包格式上的全部画布收集与独立工程恢复

更新：2026-09-23。R14有限源码增量，**未运行验收**，未执行打包/恢复/应用/测试。

## 核对结论：原工程已有 `.aicpkg`

`electron/projectPackageService.js` 已实现原 v1 工程包：`manifest.json`（schemaVersion 1、`aiCanvas.projectPackage`、`project/project.aicanvas`、素材 `localPath/archivePath/size/sha256`）、`yazl` 写入、`extract-zip` 解包、素材复制到 `ProjectImports/<时间戳>/` 并重写工程内本地引用，导入走原 `buildProjectOpenResponse`。本批**不重建打包器、不另造工程格式**，只补原格式缺的两件事：

1. 菜单“收集当前工程”走 `_0x1f9266()`，只取**当前一张画布**；`multiData.canvases` 被缩成一项。
2. 菜单“加载项目包”走 `_0x30ef2b()`，只把包内**活动画布**作为一张新画布加进当前工程，其余画布丢弃。

## 本批接入

工程下拉菜单新增两项（原四项本地操作保留）：

| 入口 | 行为 |
| --- | --- |
| 收集完整工程（全部画布） | 原生确认写明画布/节点数 → 另存为**新的 `.aicpkg`**，不含在途任务；不覆盖旧包 |
| 恢复完整工程包（独立工程） | 原生选择 `.aicpkg`（**不接受渲染进程传路径**）→ 严格校验 → 原生确认 → 独立目录/独立 `.aicanvas` → 前端再确认是否切换 |

**收集**：沿用原导出器写包，但先拒绝生成中/恢复中/排队等状态（不导出未落定任务），校验引用素材都在批准根目录（`output/`、`data/uploads/`、`data/assets/`、`data/workflows/thumbs/`）内且为普通文件，再写入**临时文件**并立即用本批严格读回校验，通过后原子复制为目标包；目标已存在则拒绝，不截断旧文件。

**恢复**：
1. 一次性改名读取并与原 `extract-zip` 依赖（`yauzl`）解到临时目录；逐条在进入磁盘前检查条目名/实际解压字节，拒绝链接、加密、未清单条目、重复/大小写冲突、目录穿越、符号链接根。
2. `manifest.json` 与 `project/project.aicanvas` 有独立字节上限；JSON 递归拒绝 `__proto__/prototype/constructor` 键和非有限数字。
3. 原格式验证后加：素材路径与归档路径一致、无重复/大小写冲突、大小与 SHA-256 有效、总容量 10GiB、单素材 5GiB、包 10GiB、条目 12000、素材 5000、画布 ≤100、节点 ≤50000。
4. **带原素材缺失/替代警告的包、引用未入包的素材、仍含未本地化远程媒体的包一律拒绝**，不部分恢复。
5. 全部哈希/覆盖核对通过后才落盘：素材写入 `<根>/ProjectImports/full-<uuid>-<根>/`，工程写入 `<项目根>/ProjectImports/full-<uuid>-project/`，用独占创建（`COPYFILE_EXCL`/`mkdir` 非递归），**不覆盖现有素材或工程**；落盘后重写工程引用并再次校验。
6. 前端只在宿主明确返回成功且版本为1后请求切换；切换前再次核对当前工程快照；放弃切换也**保留已落盘文件**并给出可复制路径。

## 前端切换守卫（不覆盖用户改动）

`fullProjectPackageSession.js`：
- 开始时抓取当前工程快照（多画布数据、nodes/canvases 对象身份、当前工程标识），与原 `CanvasProjectDropdownManager` 的 `_0x478d29` 打开桥接复用。
- 宿主能力探测（`project:fullPackageCapabilities` 返回 version 1）失败/版本不符/旧宿主无新通道时明确报“请更新并重启对应桌面端”，**不调用旧导入接口、不回退浏览器**。
- 等待期间若当前工程数据、nodes/canvases 身份或工程标识改变，或宿主返回数据含在途状态，切换被拒绝，已落盘文件改为“保留文件”对话框。
- 确认切换时明确告知：未应用的工作室草稿和当前工程未保存修改不会写入恢复文件；节点打开后原媒体/外部资源加载行为仍可能发生。
- `_0x478d29` 打开失败时同样保留文件，不重试、不回滚称述。
- 仅复用原有 IPC 通道模式；新通道沿用第10批 `assertNodeExportSender` 主窗口校验（`event.sender` + `mainFrame` + 本地 app url），不新增 HTTP 桥。

## 不能承诺的边界

- **SHA-256 只校验包内与落盘一致性，不是可信签名**；请只恢复可信来源。工程包内含工程正文与节点配置（可能含提示词/来源线索），不复制密钥，但分享仍需谨慎。
- **不是任务恢复**：旧任务 ID、已完成任务记录、宿主任务历史、浏览器队列副本、未应用的工作室草稿都不会随包迁移；在途/排队状态会直接阻断收集或恢复。
- 恢复后的节点打开时，原媒体加载/预览/可能的派生任务仍可能发生；不承诺“什么都不探测/不渲染”。
- 严格校验（路径规范、容量、条目、大小写冲突）会拒绝部分旧包/第三方工具改过的包，属预期；此时不改包、不降级。
- 操作开始后不能中途取消；宿主侧串行锁与前端侧串行锁避免重复开始。异常退出可能残留临时目录（尽力清理，清理失败会原文列出，不静默）。
- 最近工程列表登记失败时仍返回成功与真实路径，并带上 `recentRegistrationError`；**不谎称已回滚**。
- 未自动保存当前工程、不自动提交/推送/发布、不修改安装目录。

## 文件与验证

新增：`src/modules/projectPackage/fullProjectPackageModel.js`、`fullProjectPackageSession.js`、`electron/fullProjectPackageService.js`、`electron/fullProjectPackageController.js` 及 4 个测试文件。
修改：`electron/projectPackageController.js`、`electron/projectPackageService.js`（仅补原 ZIP 写入错误传播）、`electron/ipc/projectIpc.js`、`electron/ipc/mainIpcSetup.js`、`electron/preload.cjs`、`src/modules/CanvasProjectDropdownManager.js`。另新增本文档并更新 2 份交接文档，共 **17 个交付文件**。

源码检查点 `71d2705e0d2af6cf26a580ad1dcf8c8f6053eb3a`；审阅 `84bb728d7b5ff79d44ae207a0a2be2e7503fe298`、`3af68b420c00c947bd1d9895c0ad94762f161a76`。检查点不是提交/发布。

实际检查：**22 个相关 JS/CJS 语法与直接相对导入存在性检查 exit0**；`electron`、`src/modules/projectPackage`、`CanvasProjectDropdownManager.js` 诊断 error 0；只读解析 `extract-zip/yauzl/yazl` 三者均已在 `node_modules` 中解析成功（仅路径解析，未执行模块、新依赖）。**74 项测试源码（39 模型 / 15 前端会话 / 10 控制器 / 10 宿主文件与 ZIP）均未执行**，未运行应用/打包/恢复/渲染/厂商请求。

待授权离线命令（本批未执行）：
```powershell
node --test src/modules/projectPackage/fullProjectPackageModel.test.js src/modules/projectPackage/fullProjectPackageSession.test.js electron/fullProjectPackageController.test.js electron/fullProjectPackageService.test.js
```

需另行授权验收：真实多画布包往返、大小/条目/容量边界、损坏与大小写冲突包、原生确认与取消、主窗口丢失/切换竞态、最近列表失败、旧宿主缺失新通道、安装目录只读对照、原单画布收集/加载与旧项目打开回归。
