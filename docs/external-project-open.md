# 第二十一批：R14 原外部打开的目标工程与消费权限保护

更新：2026-09-24。**仅源码检查点，未执行测试、构建、桌面应用或真实外部文件打开。** 本批是既有 R14 外部打开入口的安全增量，不是新增工程格式或完成存储迁移。

后续：第22批已另接“可信OS包票据→独立完整恢复”源码。本文件记录**第21批当时的边界**；现行系统包路径见 `os-full-package-restore.md`，两批均未运行验收。

## 原链路与根因

- `electron/main.js` 接收系统打开/第二实例路径，原 `project:consumeExternalOpenRequests` 交付排队结果；`electron/preload.cjs` 提供通知与一次性消费；`CanvasProjectDropdownManager.js` 复用原 `_0x478d29` 打开 `.aicanvas`，或 `_0x188164` 通过原包导入器把 `.aicpkg` 的活动画布追加到当前工程。
- 原消费 IPC 无主窗口/主 frame/本地应用 URL 校验，任何能调用该通道的 renderer 都可能取走并清空含工程正文的队列；通知与启动消费各自可并发处理。
- `.aicanvas` 在**等待渲染帧以前**确认脏画布，等待期间的编辑/切换不参与最终确认；导入 `.aicpkg` 也会跨异步宿主导入和渲染等待，目标工程可变化。
- 第十七批“恢复完整工程包（独立工程）”已通过原生选包和严格校验另行接入；本批**不**把渲染器传来的 OS 路径当成完整恢复的可信选包来源，也**不**改变原单画布包导入语义。

## 接入与失败保护

1. `project:consumeExternalOpenRequests` 复用现有主窗口断言：仅活动主窗口的主 frame 且 URL 属于本地应用时才消费。拒绝请求时不调用原队列消费函数；原启动入口/preload 无新协议参数。
2. `externalProjectOpen.js` 为**通知批次和启动 drain 共用一个串行处理链**；单项失败报告后继续处理后项。队列仅串行化当前 renderer 的处理，不伪称宿主队列有持久投递或跨进程严格顺序。
3. 外部 `.aicanvas` 处理开始时捕获当前 tab manager、节点对象、多画布数组及工程/文件/活动画布标识；等待渲染帧后复核，再执行**最新** `hasDirtyCanvases()` 确认，确认之后同步复核、复用原 `_0x478d29`，不自动保存/覆盖磁盘工程。目标变化则拒绝打开，提示从原入口重选。
4. 原菜单“加载项目包”、拖入包的全局回调以及 OS `.aicpkg` 均走同一个 `_0x188164`：在第一个等待前捕获目标，宿主导入前及实际追加画布前复核；目标变化不把导入结果加到另一工程。**宿主导入已复制的素材/独立文件可能保留**，本增量不擅自删除，也不宣称已回滚。
5. 成功时仍由原 `CanvasTabManager` 初始化/追加、原历史与本地缓存/最近工程路径管理；失败与取消不走暗中备用保存/浏览器兜底。不改 Electron 原解析器、包服务、preload、`.aicpkg` 格式或安装目录。

## 保留缺口与边界

- 已消费但 UI 尚未处理的结果在崩溃时可能丢失；主进程通知与消费返回的到达顺序仍需实际验证。不是 durable/exactly-once 外部打开队列。
- 若多个外部文件先后打开，仍只显示最后切换的工程；脏数据最后时点需确认，但**不会自动为每个外部文件生成独立标签页或备份**。从打开菜单/拖入读取单包时，原有包格式仍只追加活动画布；独立恢复全部画布需明确使用第十七批菜单入口。
- `desktopProjectFileStore.readProjectJson()` 目前仍为同步 JSON 解析且无文件体积上限；本批未改变其信任/容量边界。`project:open` 等其他 IPC 未在本批全面权限审计。
- 目标守卫是 renderer 对象/标识复核，不能替代磁盘事务、文件内容冻结、宿主侧并发控制或外部文件真实性校验；原打开桥接可能触发既有缩略图迁移/缓存写入。本批未运行桌面行为。
- 第十七批完整恢复有自身 64MiB 工程正文等上限和原生选包。若下一批要让 OS `.aicpkg` 直接进入全部画布恢复，必须在主进程绑定**一次性可信 OS 路径 token**，而非给已有 restore IPC 增加任意 renderer 路径参数，且不破坏旧单画布导入菜单回归。存储迁移、旧项目兼容及重开验收均仍待办。

## 文件、离线测试源码与验收

新增 `src/modules/externalProjectOpen.js`、`externalProjectOpen.test.js`、`electron/externalProjectOpenIpc.test.js`；修改 `src/modules/CanvasProjectDropdownManager.js`、`electron/ipc/projectIpc.js`。离线测试源码 **9 项**（7 个守卫/排队/确认，2 个 IPC 权限），**未执行**。

实际仅在目标机对上述5个JS文件执行 `node --check`（exit0），查看5路径**已有**编辑器诊断error0（未主动编译）；8个交付文件SHA与落盘工具版本一致，Git `master` 0 staged / 33 unstaged / 148 untracked / 0 conflicts。语法和诊断不证明 Electron IPC、外部打开或导入运行成功。

待授权后可先运行（本批未运行）：
```powershell
node --test src/modules/externalProjectOpen.test.js electron/externalProjectOpenIpc.test.js
```

还需真实验收：应用未就绪时双击工程；脏画布等待期间继续编辑与切工程；通知批次/启动消费并发；原菜单和拖包导入时切画布、已复制素材保留；多个系统文件、损坏/超大包、主窗口丢失与最近列表；第十七批完整恢复及原保存/重开回归。若未获运行授权，不得把静态语法/诊断零错误写成这些验收通过。
