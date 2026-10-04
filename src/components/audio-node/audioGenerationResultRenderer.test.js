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
  const audioGenerationResult = normalizeAudioGenerationResult({
      url: 'https://cdn.example.com/final.mp3',
      localPath: 'output/final.mp3',
      duration: 8.5,
    }),
    audioGenerationResult2 = normalizeAudioGenerationResult({
      audios: [
        { audioUrl: 'https://cdn.example.com/vocals.mp3', role: 'vocals' },
        { audioUrl: 'https://cdn.example.com/bg.mp3', role: 'background' },
      ],
    });
  (assert.equal(audioGenerationResult.outputType, 'audio'),
    assert.equal(audioGenerationResult.items[0].audioUrl, 'https://cdn.example.com/final.mp3'),
    assert.equal(audioGenerationResult.items[0].localPath, 'output/final.mp3'),
    assert.equal(audioGenerationResult.items[0].audioDuration, 8.5),
    assert.equal(audioGenerationResult2.items.length, 2),
    assert.equal(audioGenerationResult2.items[0].role, 'vocals'));
}),
  test('audio generation result renderer: builds success patch and persists remote result', async () => {
    const list = [],
      audioGenerationResultPatch = await buildAudioGenerationResultPatch(
        { audioUrl: 'https://cdn.example.com/final.mp3' },
        {
          startedAt: Date.now() - 10,
          persistAudioOutput: async (value) => {
            return (list.push(value), { localPath: 'output/final.mp3', audioDuration: 6.25 });
          },
        },
      );
    (assert.deepEqual(list, ['https://cdn.example.com/final.mp3']),
      assert.equal(audioGenerationResultPatch.jobStatus, 'success'),
      assert.equal(audioGenerationResultPatch.jobError, null),
      assert.equal(audioGenerationResultPatch.audioUrl, '/output/final.mp3'),
      assert.equal(audioGenerationResultPatch.src, '/output/final.mp3'),
      assert.equal(audioGenerationResultPatch.localPath, 'output/final.mp3'),
      assert.equal(audioGenerationResultPatch.audioDuration, 6.25),
      assert.equal(audioGenerationResultPatch.rhStatusMessage, null));
  }),
  test('audio generation result renderer: builds failure patch from error item', async () => {
    const audioGenerationResultPatch2 = await buildAudioGenerationResultPatch({ error: 'provider rejected' });
    (assert.equal(audioGenerationResultPatch2.jobStatus, 'error'),
      assert.equal(audioGenerationResultPatch2.jobError, 'provider rejected'),
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
    const localAudioGenerationResultPatch = buildLocalAudioGenerationResultPatch(
      { audioUrl: '/output/local.mp3', localPath: 'output/local.mp3', fileName: 'local.mp3' },
      { duration: 0 },
    );
    (assert.equal(localAudioGenerationResultPatch.jobStatus, 'success'),
      assert.equal(localAudioGenerationResultPatch.generationDuration, 0),
      assert.equal(localAudioGenerationResultPatch.audioUrl, '/output/local.mp3'),
      assert.equal(localAudioGenerationResultPatch.src, '/output/local.mp3'),
      assert.equal(localAudioGenerationResultPatch.localPath, 'output/local.mp3'),
      assert.equal(localAudioGenerationResultPatch.fileName, 'local.mp3'));
  }),
  test('audio generation result renderer: preserves local audio result duration', () => {
    const localAudioGenerationResultPatch2 = buildLocalAudioGenerationResultPatch({
      audioUrl: '/output/local-duration.mp3',
      localPath: 'output/local-duration.mp3',
      duration: 4.75,
    });
    (assert.equal(localAudioGenerationResultPatch2.audioDuration, 4.75),
      assert.equal(localAudioGenerationResultPatch2.audioUrl, '/output/local-duration.mp3'));
  }));
