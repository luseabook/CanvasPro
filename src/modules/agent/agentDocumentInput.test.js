import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AGENT_EXTERNAL_DOCUMENT_FILE_LIMIT,
  AGENT_EXTERNAL_DOCUMENT_TOOL_ID,
  createAgentDocumentSource,
  validateAgentDocumentFile,
} from './agentDocumentInput.js';

test('文档输入：工具标识与文件数上限常量', () => {
  assert.equal(AGENT_EXTERNAL_DOCUMENT_TOOL_ID, 'document.read_file');
  assert.equal(AGENT_EXTERNAL_DOCUMENT_FILE_LIMIT, 3);
});

test('文档输入：未注入校验器时只判真假', () => {
  assert.deepEqual(validateAgentDocumentFile(null), { ok: false, error: '请选择文档。' });
  assert.deepEqual(validateAgentDocumentFile(undefined, 'not a function'), {
    ok: false,
    error: '请选择文档。',
  });
  assert.deepEqual(validateAgentDocumentFile({ name: 'a.txt' }), { ok: true });
});

test('文档输入：校验通过时原样返回校验器结果', () => {
  const verdict = { ok: true, warning: 'x' };
  assert.equal(
    validateAgentDocumentFile({}, () => verdict),
    verdict,
  );
});

test('文档输入：校验失败时强制 ok=false 并归一案话', () => {
  assert.deepEqual(
    validateAgentDocumentFile({}, () => ({ ok: false, error: '剧本文件过大，无法作为剧本读取。' })),
    { ok: false, error: '文档过大，无法作为文档读取。' },
  );
  assert.deepEqual(
    validateAgentDocumentFile({}, () => ({ error: '加密文档' })),
    {
      ok: false,
      error: '加密文档',
    },
  );
});

test('文档输入：校验器返回假值时落到默认文案', () => {
  for (const verdict of [null, undefined, false])
    assert.deepEqual(
      validateAgentDocumentFile({}, () => verdict),
      {
        ok: false,
        error: '文档不可读取。',
      },
    );
});

test('文档来源：文件名优先于 File，扩展名小写入 contentType 表', () => {
  const source = createAgentDocumentSource({ fileName: 'a.DOCX', text: 'hello' }, { name: 'z.txt' });
  assert.equal(source.sourceKind, 'document');
  assert.equal(source.displayName, 'a.DOCX');
  assert.equal(source.title, 'a.DOCX');
  assert.equal(source.extension, 'docx');
  assert.equal(source.contentType, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  assert.equal(source.content, 'hello');
  assert.equal(source.characterCount, 5);
});

test('文档来源：缺文件名时用 document 兜底，未知扩展回落 text/plain', () => {
  assert.equal(createAgentDocumentSource({}).displayName, 'document');
  const unknown = createAgentDocumentSource({}, { name: 'noext' });
  assert.equal(unknown.extension, 'noext');
  assert.equal(unknown.contentType, 'text/plain');
  for (const [name, type] of [
    ['f.txt', 'text/plain'],
    ['f.pdf', 'application/pdf'],
  ])
    assert.equal(createAgentDocumentSource({}, { name }).contentType, type);
});

test('文档来源：文件名截断到 255、扩展名截断到 12 字符', () => {
  const source = createAgentDocumentSource({ fileName: `x${'y'.repeat(400)}` });
  assert.equal(source.displayName.length, 255);
  assert.equal(source.extension.length, 12);
});

test('文档来源：characterCount 可数值化时优先，否则取正文长度', () => {
  assert.equal(createAgentDocumentSource({ text: 'abc', characterCount: '7' }).characterCount, 7);
  assert.equal(createAgentDocumentSource({ text: 'abc', characterCount: 'abc' }).characterCount, 3);
  assert.equal(createAgentDocumentSource({ text: 'abc' }).characterCount, 3);
});

test('文档来源：pageCount 仅在有限数值时出现', () => {
  assert.equal(createAgentDocumentSource({ pageCount: '3' }).pageCount, 3);
  assert.equal('pageCount' in createAgentDocumentSource({ pageCount: 'abc' }), false);
  assert.equal('pageCount' in createAgentDocumentSource({}), false);
});

test('文档来源：warnings 去空白去空并截断到 8 条', () => {
  const source = createAgentDocumentSource({
    warnings: ['  甲 ', '', '   ', '乙', '1', '2', '3', '4', '5', '6', '7'],
  });
  assert.deepEqual(source.warnings, ['甲', '乙', '1', '2', '3', '4', '5', '6']);
  assert.deepEqual(createAgentDocumentSource({ warnings: 'x' }).warnings, []);
  assert.deepEqual(createAgentDocumentSource({}).warnings, []);
});

test('文档来源：truncated 只在严格 true 时为真', () => {
  assert.equal(createAgentDocumentSource({ truncated: true }).truncated, true);
  assert.equal(createAgentDocumentSource({ truncated: 'yes' }).truncated, false);
  assert.equal(createAgentDocumentSource({}).truncated, false);
});
