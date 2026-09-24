# 第四批：剧本工作室 DOCX / PDF 文本导入

本批提供真实的文件文本提取 → 预览/校正 → 追加单集草稿 → 应用到项目流程，不使用空白占位结果，不自动调用 AI 或 OCR。

## 使用与部署

1. 在**运行当前源码 Python 后端的同一 Python 环境**更新依赖：

   ```powershell
   python -m pip install -r requirements.txt
   ```

   如果机器没有全局 `python` 命令，请使用项目实际虚拟环境/解释器的完整路径，不能用另一个 Python 环境代替。新增依赖为 `defusedxml` 与 `pypdf`。本轮只修改依赖清单，未自动安装。
2. 重启源码版 Python 后端，刷新前端。
3. 打开剧本工作室，选择 **导入 JSON / TXT / MD / DOCX / PDF**。
4. DOCX/PDF 会上传到**当前 Canvas 后端**提取；若 Canvas 后端部署在远程，文件会传到该远程主机。代码不将文档发送到 AI 厂商，不访问文档链接，不保存原文件到磁盘。
5. 先查看提取预览与警告，可在预览框校正文字。点击 **确认追加到草稿**，不覆盖已有单集。
6. 点击 **应用到项目**，再使用原有工程保存功能落盘。放弃预览不会更改原草稿。

**运行时边界：**独立解析进程要求源码版 Python 后端。当前冻结/打包 EXE 后端会明确返回 503，不尝试把 EXE 当 Python 解释器启动；本批未补 PyInstaller 工作进程打包方案，也未修改安装目录中的 EXE。新增源码不会自动更新已安装程序。

## 支持范围

- DOCX：正文、表格单元格中的文字与段落/制表符/换行；支持常见 Transitional 与 Strict WordprocessingML 命名空间。插入修订保留、删除修订和域指令忽略。
- PDF：读取已有文字层，最多 200 页，输出没有文字的页码警告。不执行 JavaScript、不打开附件、不跟随链接。
- 文本框、修订、隐藏文字、特殊字体、多栏和表格的提取顺序需人工核对；这不是 Word/PDF 原样渲染。
- DOCX 图片、页眉页脚、脚注、批注、附件及格式不提取。
- 加密 PDF/ZIP、旧版 DOC、DOCM、仅图片的扫描 PDF 不支持。没有文字时明确报错；混合 PDF 对无文字页作提示，不假装已 OCR。
- 现有 JSON/TXT/MD 本地导入路径保留，不为它们新增后端上传。

## 资源与安全边界

- 接口：POST `/api/v2/story-workspace/document/extract`，受原有本地访问令牌/Origin 校验保护，加入敏感路径范围。
- 请求为原始 DOCX/PDF 二进制，限定 MIME 与文件签名；需要 Content-Length，不接收 chunked 上传。不接收本地路径、URL、外部命令或密码参数。
- 每文件 8MB；上传读超时 15 秒；后端一次只允许一个提取请求，忙时返回 429，不自动重试。
- 每份文档独立子进程，无 shell、无文档临时文件。进程墙钟超时 35 秒后 kill/wait 回收；CPU 上限约 20 秒。
- 512MB 解析进程内存上限：Windows 使用 Job Object 的提交内存限制，POSIX 使用 RLIMIT_AS。不能建立限制时明确失败，不降级为无界解析。二者不是完全相同的内存指标。
- DOCX ZIP 至多 2000 条目、声明总解压大小 64MB、正文 XML 16MB、单条目压缩比 200；拒绝路径异常、重复条目、加密与 DTD/实体。只读取固定 `word/document.xml`，从不解压到文件系统。
- 提取文本最多 600000 Unicode 码点；超限拒绝，不返回截断正文。前端按 UTF-16 长度校验与拆段，并保持有效代理对完整。
- 前端每个单集仍最多 200000 UTF-16 单位，按长度/段落边界分段，不推断故事集数；所有新单集先整体校验，再一次追加，保留现有 100 集/4MB 工作室上限。
- 前端取消/关闭会中止等待并忽略过期结果。**这不保证立即终止后端解析**：正在进行的工作进程仍受服务器截止时间限制；取消后立即重试可能暂时收到 429。
- 来源节点卸载、画布切换或草稿版本变化时，不向新上下文写入提取结果。

资源限制并不是 OS 权限沙箱；解析器仍应使用维护中的依赖版本，不应以管理员身份运行后端。不要向不可信来源公开该本地解析接口。

## 文件与验证

- `backend/services/story_document_extractor.py`：DOCX/PDF 文字提取与格式/尺寸约束。
- `backend/services/story_document_worker.py`：子进程协议、内存/CPU 约束。
- `backend/services/story_document_route_service.py`：上传、并发限制、超时回收与结构化错误。
- `api/storyDocumentApi.js`：同源二进制上传，无自动重试。
- `src/modules/storyWorkspace/storyDocumentImport.js`：无损长度拆段与原子追加。
- `src/modules/storyWorkspace/StoryDocumentPreview.js`：提取文字预览与确认。
- `StoryWorkspaceEditor.js`、`server.py`、样式及依赖清单：接入。

离线测试源码覆盖 DOCX 段落/表格/修订、实体/ZIP 边界、PDF 空页/加密/超限、路由状态与工作进程超时，以及前端无损拆段/追加。测试、依赖安装、构建、真实文档解析与 Windows 资源限制运行验收均未自动执行。

本轮静态检查：5 个新增/修改 JavaScript 文件在目标机通过 `node --check`，相对导入文件均存在。落盘后的 `server.py` 和 6 个新增 Python 文件读回后，通过本地 Python AST 解析（目标机裸 `python` 命令在前批已确认不可用，本轮未重复尝试）。工作室前端目录与后端服务目录的现有编辑器 error 诊断为空。共新增 25 项离线测试源码，未执行；以上检查不代表运行验收通过。

手动验收应覆盖中文 DOCX、文字 PDF、扫描/混合 PDF、加密/损坏文件、超限、缺依赖、超时、取消/切画布、预览修订后确认、放弃不改草稿、应用/保存/重开，以及原 JSON/TXT/MD 导入与白板/ComfyUI 不回归。
