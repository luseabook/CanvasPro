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
  const textGenerationResult = normalizeTextGenerationResult({ text: 'hello' }),
    textGenerationResult2 = normalizeTextGenerationResult({ output: 'world' }),
    textGenerationResult3 = normalizeTextGenerationResult('plain'),
    textGenerationResult4 = normalizeTextGenerationResult({
      texts: [{ content: 'first' }, { message: 'second' }],
    });
  (assert.equal(textGenerationResult.items[0].outputText, 'hello'),
    assert.equal(textGenerationResult2.items[0].outputText, 'world'),
    assert.equal(textGenerationResult3.items[0].outputText, 'plain'),
    assert.equal(textGenerationResult4.items.length, 2),
    assert.equal(textGenerationResult4.items[0].outputText, 'first'));
}),
  test('text generation result renderer: builds success patch', () => {
    const textGenerationResultPatch = buildTextGenerationResultPatch(
      { output: 'generated text' },
      { startedAt: Date.now() - 10 },
    );
    (assert.equal(textGenerationResultPatch.jobStatus, 'success'),
      assert.equal(textGenerationResultPatch.jobError, null),
      assert.equal(textGenerationResultPatch.outputText, 'generated text'),
      assert.equal(typeof textGenerationResultPatch.generationDuration, 'number'));
    const textGenerationResultPatch2 = buildTextGenerationResultPatch({}, { startedAt: Date.now() - 10 });
    (assert.equal(textGenerationResultPatch2.jobStatus, 'success'),
      assert.equal(textGenerationResultPatch2.outputText, undefined));
  }),
  test('text generation result renderer: builds failure patch', () => {
    const textGenerationFailurePatch = buildTextGenerationFailurePatch({
      error: 'provider rejected',
      startedAt: Date.now() - 10,
    });
    (assert.equal(textGenerationFailurePatch.jobStatus, 'error'),
      assert.equal(textGenerationFailurePatch.jobError, 'provider rejected'),
      assert.equal(getTextGenerationResultError({ error: 'provider rejected' }), 'provider rejected'));
  }),
  test('text generation result renderer: exposes timeout failures as node output', () => {
    const error = new Error('请求超时（300秒）');
    error.type = 'TIMEOUT';
    const textGenerationFailurePatch2 = buildTextGenerationFailurePatch({
      error: error,
      startedAt: Date.now() - 10,
    });
    (assert.equal(isTextGenerationTimeoutError(error), true),
      assert.equal(textGenerationFailurePatch2.jobStatus, 'error'),
      assert.equal(textGenerationFailurePatch2.jobError, '请求超时（300秒）'),
      assert.match(textGenerationFailurePatch2.outputText, /生成超时/),
      assert.match(textGenerationFailurePatch2.outputText, /错误详情：请求超时/));
    const textGenerationFailurePatch3 = buildTextGenerationFailurePatch({
      error: 'provider rejected',
      startedAt: Date.now() - 10,
    });
    assert.equal(textGenerationFailurePatch3.outputText, undefined);
  }));
