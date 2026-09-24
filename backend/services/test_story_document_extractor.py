"""Offline synthetic fixtures; run explicitly after installing requirements."""
import io
import unittest
import zipfile

from backend.services.story_document_extractor import DocumentError, FILE_LIMIT, extract_document

NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


def docx(body, prefix="", extra=None):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_STORED) as archive:
        archive.writestr("[Content_Types].xml", "<Types/>")
        xml = prefix + '<w:document xmlns:w="' + NS + '"><w:body>' + body + '</w:body></w:document>'
        archive.writestr("word/document.xml", xml)
        for name, content in (extra or {}).items():
            archive.writestr(name, content)
    return buffer.getvalue()


def pdf_with_text(text="Hello document", pages=1, password=None):
    from pypdf import PdfWriter
    from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject
    writer = PdfWriter()
    for _ in range(pages):
        page = writer.add_blank_page(width=300, height=300)
        if text:
            font = DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'), NameObject('/BaseFont'): NameObject('/Helvetica')})
            page[NameObject('/Resources')] = DictionaryObject({NameObject('/Font'): DictionaryObject({NameObject('/F1'): font})})
            content = DecodedStreamObject()
            content.set_data(('BT /F1 12 Tf 20 250 Td (' + text + ') Tj ET').encode('ascii'))
            page[NameObject('/Contents')] = writer._add_object(content)
    if password:
        writer.encrypt(password)
    buffer = io.BytesIO(); writer.write(buffer); return buffer.getvalue()


class DocumentExtractionTests(unittest.TestCase):
    def test_docx_paragraphs_tables_tabs_and_revisions(self):
        data = docx('<w:p><w:r><w:t>第一段</w:t><w:tab/><w:t>文字</w:t><w:br/><w:t>换行</w:t></w:r></w:p>'
                    '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>表格内容</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
                    '<w:p><w:del><w:r><w:delText>删除内容</w:delText></w:r></w:del><w:ins><w:r><w:t>插入内容</w:t></w:r></w:ins></w:p>')
        result = extract_document(data, '.docx')
        self.assertEqual(result['text'], '第一段\t文字\n换行\n\n表格内容\n\n插入内容')
        self.assertNotIn('删除内容', result['text'])

    def test_docx_entities_are_rejected(self):
        data = docx('<w:p><w:r><w:t>&x;</w:t></w:r></w:p>', '<!DOCTYPE document [<!ENTITY x "expanded">]>')
        with self.assertRaises(DocumentError) as raised:
            extract_document(data, '.docx')
        self.assertEqual(raised.exception.code, 422)

    def test_docx_path_traversal_is_rejected_without_disk_extraction(self):
        with self.assertRaises(DocumentError):
            extract_document(docx('<w:p/>', extra={'../outside.txt': 'not extracted'}), '.docx')

    def test_docx_zip_bomb_metadata_is_rejected(self):
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
            archive.writestr('[Content_Types].xml', '<Types/>')
            archive.writestr('word/document.xml', 'x' * 200000)
        with self.assertRaises(DocumentError) as raised:
            extract_document(buffer.getvalue(), '.docx')
        self.assertEqual(raised.exception.code, 413)

    def test_empty_docx_is_not_success(self):
        with self.assertRaises(DocumentError):
            extract_document(docx('<w:p/>'), '.docx')

    def test_pdf_text_and_page_count(self):
        result = extract_document(pdf_with_text(), '.pdf')
        self.assertIn('Hello document', result['text'])
        self.assertEqual(result['pageCount'], 1)

    def test_empty_pdf_is_not_success(self):
        with self.assertRaises(DocumentError) as raised:
            extract_document(pdf_with_text(text=''), '.pdf')
        self.assertIn('OCR', str(raised.exception))

    def test_pdf_encryption_and_page_limit(self):
        with self.assertRaises(DocumentError):
            extract_document(pdf_with_text(password='secret'), '.pdf')
        with self.assertRaises(DocumentError) as raised:
            extract_document(pdf_with_text(text='', pages=201), '.pdf')
        self.assertEqual(raised.exception.code, 413)

    def test_signature_size_and_extension(self):
        for data, extension in ((b'not a PDF', '.pdf'), (b'not a ZIP', '.docx'), (b'abc', '.doc'), (b'x' * (FILE_LIMIT + 1), '.pdf')):
            with self.subTest(extension=extension):
                with self.assertRaises(DocumentError):
                    extract_document(data, extension)


if __name__ == '__main__':
    unittest.main()
