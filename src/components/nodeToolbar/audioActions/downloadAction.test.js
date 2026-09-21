import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAudioDownloadTarget, triggerAudioDownload } from './downloadAction.js';
(test('audio download action: uses local audio path and preserves real extension', () => {
  const _0x2f2d03 = resolveAudioDownloadTarget({
    nodeData: { name: '剪辑自 音频', localPath: 'output/CutAudio/audio_fixed.wav' },
    audioElement: { src: 'http://127.0.0.1:8777/output/CutAudio/audio_fixed.wav' },
  });
  assert.deepEqual(_0x2f2d03, { url: '/output/CutAudio/audio_fixed.wav', filename: 'audio_fixed.wav' });
}),
  test('audio download action: appends audio extension when fileName has no suffix', () => {
    const _0x48cbcd = resolveAudioDownloadTarget({
      nodeData: { fileName: '旁白成片', audioUrl: '/output/final_voice.m4a?cache=1' },
    });
    assert.deepEqual(_0x48cbcd, { url: '/output/final_voice.m4a?cache=1', filename: '旁白成片.m4a' });
  }),
  test('audio download action: falls back to node name with mp3 suffix', () => {
    const _0x5a6561 = resolveAudioDownloadTarget({
      nodeData: { name: 'AI 音频结果' },
      audioElement: { currentSrc: 'blob:http://localhost/audio-preview' },
    });
    assert.deepEqual(_0x5a6561, {
      url: 'blob:http://localhost/audio-preview',
      filename: 'AI 音频结果.mp3',
    });
  }),
  test('audio download action: creates a safe anchor download', () => {
    const _0x4e5cce = [],
      _0x26d18c = {
        children: [],
        appendChild(_0x56e7dc) {
          ((_0x56e7dc.parentNode = this), this.children.push(_0x56e7dc));
        },
        removeChild(_0x1f2f79) {
          ((this.children = this.children.filter((_0x521300) => _0x521300 !== _0x1f2f79)),
            (_0x1f2f79.parentNode = null));
        },
      },
      _0x36f2e9 = {
        body: _0x26d18c,
        createElement(_0x49e0ce) {
          return (
            assert.equal(_0x49e0ce, 'a'),
            {
              href: '',
              download: '',
              rel: '',
              parentNode: null,
              click() {
                _0x4e5cce.push({ href: this.href, download: this.download, rel: this.rel });
              },
              remove() {
                if (this.parentNode) this.parentNode.removeChild(this);
              },
            }
          );
        },
      },
      _0x4a3092 = triggerAudioDownload({ url: '/output/final.wav', filename: 'final.wav' }, _0x36f2e9);
    (assert.equal(_0x4a3092, true),
      assert.deepEqual(_0x4e5cce, [{ href: '/output/final.wav', download: 'final.wav', rel: 'noopener' }]),
      assert.equal(_0x26d18c.children.length, 0));
  }));
