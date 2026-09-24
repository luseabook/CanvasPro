"""Text-only DOCX/PDF extraction. Run through the bounded worker, not HTTP threads."""
import io
import re
import zipfile

FILE_LIMIT = 8 * 1024 * 1024
TEXT_LIMIT = 600000
PAGE_LIMIT = 200
XML_LIMIT = 16 * 1024 * 1024
ZIP_TOTAL_LIMIT = 64 * 1024 * 1024
WORD_NAMESPACES = (
    "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "http://purl.oclc.org/ooxml/wordprocessingml/main",
)


class DocumentError(Exception):
    def __init__(self, message, code=422):
        super().__init__(message)
        self.code = code


def _clean_text(value):
    # Do not expose terminal controls or malformed Unicode to the JSON response.
    value = str(value).replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", value)
    return value.encode("utf-8", errors="replace").decode("utf-8")


def _finish(parts, format_name, warnings, page_count=None, empty_pages=None):
    text = "\n\n".join(parts).strip()
    if not text:
        raise DocumentError("未提取到可用文字。扫描件或图片型 PDF 需要先进行 OCR；本功能不提供 OCR。")
    if len(text) > TEXT_LIMIT:
        raise DocumentError("提取文字超过 600000 字符，请先拆分文档。没有返回截断文本。", 413)
    return {"format": format_name, "text": text, "characterCount": len(text),
            "pageCount": page_count, "emptyPages": empty_pages or [], "warnings": warnings}


def _append(parts, text, size):
    cleaned = _clean_text(text).strip()
    if not cleaned:
        return size
    size += len(cleaned) + (2 if parts else 0)
    if size > TEXT_LIMIT:
        raise DocumentError("提取文字超过 600000 字符，请先拆分文档。没有返回截断文本。", 413)
    parts.append(cleaned)
    return size


def extract_docx(data):
    try:
        from defusedxml.ElementTree import fromstring
        from defusedxml.common import DefusedXmlException
    except ImportError as exc:
        raise DocumentError("DOCX 提取依赖 defusedxml 未安装，请更新当前后端的 requirements.txt 依赖。", 503) from exc
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            entries = archive.infolist()
            if len(entries) > 2000:
                raise DocumentError("DOCX 包含过多文件条目。", 413)
            seen, total = set(), 0
            for entry in entries:
                name = entry.filename
                if (name in seen or name.startswith(("/", "\\")) or "\\" in name or ":" in name
                        or any(part in (".", "..") for part in name.split("/"))):
                    raise DocumentError("DOCX 内部文件名无效或重复。")
                if entry.flag_bits & 1:
                    raise DocumentError("不支持加密的 DOCX 文档，请先另存为未加密版本。")
                seen.add(name)
                total += entry.file_size
                if total > ZIP_TOTAL_LIMIT or entry.file_size > max(1, entry.compress_size) * 200:
                    raise DocumentError("DOCX 解压大小或压缩比超过限制。", 413)
            if "[Content_Types].xml" not in seen or "word/document.xml" not in seen:
                raise DocumentError("文件不是有效的 DOCX；旧版 DOC、DOCM 不受支持。")
            info = archive.getinfo("word/document.xml")
            if info.file_size > XML_LIMIT:
                raise DocumentError("DOCX 正文结构超过 16MB。", 413)
            # Never extract ZIP entries to disk or follow relationship targets.
            with archive.open(info) as stream:
                xml = stream.read(XML_LIMIT + 1)
            if len(xml) > XML_LIMIT:
                raise DocumentError("DOCX 正文结构超过 16MB。", 413)
        root = fromstring(xml, forbid_dtd=True, forbid_entities=True, forbid_external=True)
    except DocumentError:
        raise
    except DefusedXmlException as exc:
        raise DocumentError("拒绝含 DTD、实体或外部实体定义的 DOCX。") from exc
    except Exception as exc:
        raise DocumentError("DOCX 文件损坏、格式不支持或正文 XML 无法解析。") from exc
    namespace = next((ns for ns in WORD_NAMESPACES if root.tag == "{" + ns + "}document"), None)
    if not namespace:
        raise DocumentError("DOCX 正文命名空间不受支持。")
    prefix = "{" + namespace + "}"
    body = root.find(prefix + "body")
    if body is None:
        raise DocumentError("DOCX 没有正文。")
    parts, size, paragraph_count = [], 0, 0

    def inline_text(element):
        values = []
        for child in element:
            if child.tag in (prefix + "del", prefix + "moveFrom", prefix + "p"):
                continue
            if child.tag == prefix + "t":
                values.append(child.text or "")
            elif child.tag == prefix + "tab":
                values.append("\t")
            elif child.tag in (prefix + "br", prefix + "cr"):
                values.append("\n")
            else:
                values.append(inline_text(child))
        return "".join(values)

    def walk(element):
        nonlocal size, paragraph_count
        if element.tag in (prefix + "del", prefix + "moveFrom"):
            return
        if element.tag == prefix + "p":
            paragraph_count += 1
            if paragraph_count > 30000:
                raise DocumentError("DOCX 段落数超过限制。", 413)
            size = _append(parts, inline_text(element), size)
        for child in element:
            walk(child)

    walk(body)
    return _finish(parts, "docx", ["仅提取正文及表格单元格文字；不保留排版，不提取图片、页眉页脚、脚注、批注和附件。",
                                     "保留插入文字，忽略删除修订与域指令；请核对修订文档和文本框顺序。"])


def extract_pdf(data):
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise DocumentError("PDF 提取依赖 pypdf 未安装，请更新当前后端的 requirements.txt 依赖。", 503) from exc
    try:
        reader = PdfReader(io.BytesIO(data), strict=True)
        if reader.is_encrypted:
            raise DocumentError("不支持加密 PDF；请先在可信软件中另存为未加密版本。")
        page_count = len(reader.pages)
        if page_count > PAGE_LIMIT:
            raise DocumentError("PDF 超过 200 页，请先拆分。没有返回部分文档。", 413)
        parts, empty_pages, size = [], [], 0
        for number, page in enumerate(reader.pages, start=1):
            text = _clean_text(page.extract_text() or "").strip()
            if not text:
                empty_pages.append(number)
            size = _append(parts, text, size)
    except DocumentError:
        raise
    except Exception as exc:
        raise DocumentError("PDF 损坏、结构过于复杂或文本无法解码，请重新导出或先转换为 TXT。") from exc
    warnings = ["只提取已有文字层，不执行 JavaScript、打开附件或访问文档链接。多栏、表格和特殊字体的阅读顺序需人工核对。"]
    if empty_pages:
        warnings.append("以下页没有可提取文字，可能为空白页或扫描页：" + ", ".join(map(str, empty_pages)) + "。这些页未进行 OCR。")
    return _finish(parts, "pdf", warnings, page_count, empty_pages)


def extract_document(data, extension):
    if not data or len(data) > FILE_LIMIT:
        raise DocumentError("文档必须非空且不超过 8MB。", 413)
    if extension == ".docx":
        if not data.startswith(b"PK\x03\x04"):
            raise DocumentError("DOCX 文件签名不正确，不能通过修改扩展名转换文件。")
        return extract_docx(data)
    if extension == ".pdf":
        if not data.startswith(b"%PDF-"):
            raise DocumentError("PDF 文件签名不正确。")
        return extract_pdf(data)
    raise DocumentError("仅支持 DOCX 和 PDF。", 415)
