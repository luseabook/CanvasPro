import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTextGenerationFailurePatch,
  buildTextGenerationResultPatch,
  isTextGenerationTimeoutError,
  getTextGenerationResultError,
  normalizeTextGenerationResult,
} from './textGenerationResultRenderer.js';
(test('text generation result renderer: normalizes common text result shapes', () => {
  const _0x15010d = normalizeTextGenerationResult({ text: 'hello' }),
    _0x59e9f8 = normalizeTextGenerationResult({ output: 'world' }),
    _0x169cdc = normalizeTextGenerationResult('plain'),
    _0x28136f = normalizeTextGenerationResult({ texts: [{ content: 'first' }, { message: 'second' }] });
  (assert.equal(_0x15010d.items[0].outputText, 'hello'),
    assert.equal(_0x59e9f8.items[0].outputText, 'world'),
    assert.equal(_0x169cdc.items[0].outputText, 'plain'),
    assert.equal(_0x28136f.items.length, 2),
    assert.equal(_0x28136f.items[0].outputText, 'first'));
}),
  test('text generation result renderer: builds success patch', () => {
    const _0xb23909 = buildTextGenerationResultPatch(
      { output: 'generated text' },
      { startedAt: Date.now() - 10 },
    );
    (assert.equal(_0xb23909.jobStatus, 'success'),
      assert.equal(_0xb23909.jobError, null),
      assert.equal(_0xb23909.outputText, 'generated text'),
      assert.equal(typeof _0xb23909.generationDuration, 'number'));
    const _0x4352db = buildTextGenerationResultPatch({}, { startedAt: Date.now() - 10 });
    (assert.equal(_0x4352db.jobStatus, 'success'), assert.equal(_0x4352db.outputText, undefined));
  }),
  test('text generation result renderer: builds failure patch', () => {
    const _0x38fe91 = buildTextGenerationFailurePatch({
      error: 'provider rejected',
      startedAt: Date.now() - 10,
    });
    (assert.equal(_0x38fe91.jobStatus, 'error'),
      assert.equal(_0x38fe91.jobError, 'provider rejected'),
      assert.equal(getTextGenerationResultError({ error: 'provider rejected' }), 'provider rejected'));
  }),
  test('text generation result renderer: exposes timeout failures as node output', () => {
    const _0x4175aa = new Error('请求超时（300秒）');
    _0x4175aa.type = 'TIMEOUT';
    const _0x371569 = buildTextGenerationFailurePatch({ error: _0x4175aa, startedAt: Date.now() - 10 });
    (assert.equal(isTextGenerationTimeoutError(_0x4175aa), true),
      assert.equal(_0x371569.jobStatus, 'error'),
      assert.equal(_0x371569.jobError, '请求超时（300秒）'),
      assert.match(_0x371569.outputText, /生成超时/),
      assert.match(_0x371569.outputText, /错误详情：请求超时/));
    const _0x3c84df = buildTextGenerationFailurePatch({
      error: 'provider rejected',
      startedAt: Date.now() - 10,
    });
    assert.equal(_0x3c84df.outputText, undefined);
  }));
