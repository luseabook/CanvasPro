import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAudioDownloadTarget, triggerAudioDownload } from './downloadAction.js';
(test('audio download action: uses local audio path and preserves real extension', () => {
  const audioDownloadTarget = resolveAudioDownloadTarget({
    nodeData: { name: '剪辑自 音频', localPath: 'output/CutAudio/audio_fixed.wav' },
    audioElement: { src: 'http://127.0.0.1:8777/output/CutAudio/audio_fixed.wav' },
  });
  assert.deepEqual(audioDownloadTarget, {
    url: '/output/CutAudio/audio_fixed.wav',
    filename: 'audio_fixed.wav',
  });
}),
  test('audio download action: appends audio extension when fileName has no suffix', () => {
    const audioDownloadTarget2 = resolveAudioDownloadTarget({
      nodeData: { fileName: '旁白成片', audioUrl: '/output/final_voice.m4a?cache=1' },
    });
    assert.deepEqual(audioDownloadTarget2, {
      url: '/output/final_voice.m4a?cache=1',
      filename: '旁白成片.m4a',
    });
  }),
  test('audio download action: falls back to node name with mp3 suffix', () => {
    const audioDownloadTarget3 = resolveAudioDownloadTarget({
      nodeData: { name: 'AI 音频结果' },
      audioElement: { currentSrc: 'blob:http://localhost/audio-preview' },
    });
    assert.deepEqual(audioDownloadTarget3, {
      url: 'blob:http://localhost/audio-preview',
      filename: 'AI 音频结果.mp3',
    });
  }),
  test('audio download action: creates a safe anchor download', () => {
    const list = [],
      body = {
        children: [],
        appendChild(el) {
          ((el.parentNode = this), this.children.push(el));
        },
        removeChild(el2) {
          ((this.children = this.children.filter((item) => item !== el2)), (el2.parentNode = null));
        },
      },
      value = {
        body: body,
        createElement(key) {
          return (
            assert.equal(key, 'a'),
            {
              href: '',
              download: '',
              rel: '',
              parentNode: null,
              click() {
                list.push({ href: this.href, download: this.download, rel: this.rel });
              },
              remove() {
                if (this.parentNode) this.parentNode.removeChild(this);
              },
            }
          );
        },
      },
      triggerAudioDownload2 = triggerAudioDownload(
        { url: '/output/final.wav', filename: 'final.wav' },
        value,
      );
    (assert.equal(triggerAudioDownload2, true),
      assert.deepEqual(list, [{ href: '/output/final.wav', download: 'final.wav', rel: 'noopener' }]),
      assert.equal(body.children.length, 0));
  }));
