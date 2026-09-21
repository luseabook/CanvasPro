import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAudioGenerationResultPatch,
  buildLocalAudioGenerationResultPatch,
  getAudioGenerationResultError,
  getSuccessfulAudioGenerationItems,
  normalizeAudioGenerationResult,
} from './audioGenerationResultRenderer.js';
import { setLocale } from '../../i18n/index.js';
(test('audio generation result renderer: normalizes single and batch audio results', () => {
  const _0x54855a = normalizeAudioGenerationResult({
      url: 'https://cdn.example.com/final.mp3',
      localPath: 'output/final.mp3',
      duration: 8.5,
    }),
    _0x541e6e = normalizeAudioGenerationResult({
      audios: [
        { audioUrl: 'https://cdn.example.com/vocals.mp3', role: 'vocals' },
        { audioUrl: 'https://cdn.example.com/bg.mp3', role: 'background' },
      ],
    });
  (assert.equal(_0x54855a.outputType, 'audio'),
    assert.equal(_0x54855a.items[0].audioUrl, 'https://cdn.example.com/final.mp3'),
    assert.equal(_0x54855a.items[0].localPath, 'output/final.mp3'),
    assert.equal(_0x54855a.items[0].audioDuration, 8.5),
    assert.equal(_0x541e6e.items.length, 2),
    assert.equal(_0x541e6e.items[0].role, 'vocals'));
}),
  test('audio generation result renderer: builds success patch and persists remote result', async () => {
    const _0xebb292 = [],
      _0x153f76 = await buildAudioGenerationResultPatch(
        { audioUrl: 'https://cdn.example.com/final.mp3' },
        {
          startedAt: Date.now() - 10,
          persistAudioOutput: async (_0x2bc270) => {
            return (_0xebb292.push(_0x2bc270), { localPath: 'output/final.mp3', audioDuration: 6.25 });
          },
        },
      );
    (assert.deepEqual(_0xebb292, ['https://cdn.example.com/final.mp3']),
      assert.equal(_0x153f76.jobStatus, 'success'),
      assert.equal(_0x153f76.jobError, null),
      assert.equal(_0x153f76.audioUrl, '/output/final.mp3'),
      assert.equal(_0x153f76.src, '/output/final.mp3'),
      assert.equal(_0x153f76.localPath, 'output/final.mp3'),
      assert.equal(_0x153f76.audioDuration, 6.25),
      assert.equal(_0x153f76.rhStatusMessage, null));
  }),
  test('audio generation result renderer: builds failure patch from error item', async () => {
    const _0x4d77f7 = await buildAudioGenerationResultPatch({ error: 'provider rejected' });
    (assert.equal(_0x4d77f7.jobStatus, 'error'),
      assert.equal(_0x4d77f7.jobError, 'provider rejected'),
      assert.equal(getAudioGenerationResultError({ error: 'provider rejected' }), 'provider rejected'),
      assert.deepEqual(getSuccessfulAudioGenerationItems({ error: 'provider rejected' }), []));
  }),
  test('audio generation result renderer: localizes persistence failure fallback', async () => {
    setLocale('en-US', { persist: false, notify: false });
    try {
      await assert.rejects(
        () => buildAudioGenerationResultPatch({ audioUrl: 'https://cdn.example.com/final.mp3' }),
        /Generated, but local save failed/,
      );
    } finally {
      setLocale('zh-CN', { persist: false, notify: false });
    }
  }),
  test('audio generation result renderer: builds local audio patch without persistence', () => {
    const _0x4b3f6f = buildLocalAudioGenerationResultPatch(
      { audioUrl: '/output/local.mp3', localPath: 'output/local.mp3', fileName: 'local.mp3' },
      { duration: 0 },
    );
    (assert.equal(_0x4b3f6f.jobStatus, 'success'),
      assert.equal(_0x4b3f6f.generationDuration, 0),
      assert.equal(_0x4b3f6f.audioUrl, '/output/local.mp3'),
      assert.equal(_0x4b3f6f.src, '/output/local.mp3'),
      assert.equal(_0x4b3f6f.localPath, 'output/local.mp3'),
      assert.equal(_0x4b3f6f.fileName, 'local.mp3'));
  }),
  test('audio generation result renderer: preserves local audio result duration', () => {
    const _0x5ec04f = buildLocalAudioGenerationResultPatch({
      audioUrl: '/output/local-duration.mp3',
      localPath: 'output/local-duration.mp3',
      duration: 4.75,
    });
    (assert.equal(_0x5ec04f.audioDuration, 4.75),
      assert.equal(_0x5ec04f.audioUrl, '/output/local-duration.mp3'));
  }));
