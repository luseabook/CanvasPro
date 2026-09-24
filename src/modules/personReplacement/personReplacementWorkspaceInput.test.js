import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readPersonReplacementVideoPromptEditor,
  isPersonReplacementVideoFile,
  isPersonReplacementImageFile,
  isPersonReplacementAudioFile,
} from './personReplacementWorkspaceInput.js';

test('workspaceInput: 非 contenteditable 元素读 value，空元素返回空串', () => {
  assert.equal(readPersonReplacementVideoPromptEditor(null), '');
  assert.equal(readPersonReplacementVideoPromptEditor(undefined), '');
  assert.equal(readPersonReplacementVideoPromptEditor({ value: 'hello' }), 'hello');
  assert.equal(readPersonReplacementVideoPromptEditor({}), '');
  assert.equal(readPersonReplacementVideoPromptEditor({ value: 0 }), '');
  assert.equal(
    readPersonReplacementVideoPromptEditor({ matches: () => false, value: 'v', innerText: 'nope' }),
    'v',
  );
});

test('workspaceInput: contenteditable 优先 innerText', () => {
  assert.equal(
    readPersonReplacementVideoPromptEditor({
      matches: (sel) => sel === '[contenteditable="true"]',
      innerText: 'line1',
      value: 'ignored',
    }),
    'line1',
  );
});

test('workspaceInput: contenteditable 无 innerText 时按 HTML 归一（换行与实体）', () => {
  const el = (innerHTML) => ({
    matches: () => true,
    innerHTML,
  });
  assert.equal(readPersonReplacementVideoPromptEditor(el('a<br>b</div>')), 'a\nb\n');
  assert.equal(readPersonReplacementVideoPromptEditor(el('x<p>y</p>z<span>w</span>')), 'xy\nzw');
  assert.equal(readPersonReplacementVideoPromptEditor(el('&lt;b&gt;&amp;&nbsp;')), '<b>& ');
  assert.equal(
    readPersonReplacementVideoPromptEditor({ matches: () => true, textContent: 'plain' }),
    'plain',
  );
});

test('workspaceInput: 视频判定认 MIME 前缀与扩展名（不区分大小写）', () => {
  assert.equal(isPersonReplacementVideoFile({ type: 'video/mp4' }), true);
  assert.equal(isPersonReplacementVideoFile({ type: ' VIDEO/WEBM ' }), true);
  assert.equal(isPersonReplacementVideoFile({ name: 'clip.MKV' }), true);
  assert.equal(isPersonReplacementVideoFile({ name: 'a.mov' }), true);
  assert.equal(isPersonReplacementVideoFile({ name: 'a.mp4' }), true);
  assert.equal(isPersonReplacementVideoFile({ name: 'a.webm' }), true);
  assert.equal(isPersonReplacementVideoFile({ name: 'a.mp3' }), false);
  assert.equal(isPersonReplacementVideoFile({ name: 'a.mp4x' }), false);
  assert.equal(isPersonReplacementVideoFile({}), false);
  assert.equal(isPersonReplacementVideoFile(null), false);
});

test('workspaceInput: 图片判定含 avif/gif/jpeg/jpg/png/webp', () => {
  assert.equal(isPersonReplacementImageFile({ type: 'image/png' }), true);
  assert.equal(isPersonReplacementImageFile({ name: 'a.AVIF' }), true);
  assert.equal(isPersonReplacementImageFile({ name: 'a.jpeg' }), true);
  assert.equal(isPersonReplacementImageFile({ name: 'a.JPG' }), true);
  assert.equal(isPersonReplacementImageFile({ name: 'a.gif' }), true);
  assert.equal(isPersonReplacementImageFile({ name: 'a.webp' }), true);
  assert.equal(isPersonReplacementImageFile({ name: 'a.bmp' }), false);
  assert.equal(isPersonReplacementImageFile({}), false);
});

test('workspaceInput: 音频判定含 aac/flac/m4a/mp3/ogg/opus/wav', () => {
  assert.equal(isPersonReplacementAudioFile({ type: 'audio/mpeg' }), true);
  assert.equal(isPersonReplacementAudioFile({ name: 'a.FLAC' }), true);
  assert.equal(isPersonReplacementAudioFile({ name: 'a.aac' }), true);
  assert.equal(isPersonReplacementAudioFile({ name: 'a.m4a' }), true);
  assert.equal(isPersonReplacementAudioFile({ name: 'a.mp3' }), true);
  assert.equal(isPersonReplacementAudioFile({ name: 'a.ogg' }), true);
  assert.equal(isPersonReplacementAudioFile({ name: 'a.opus' }), true);
  assert.equal(isPersonReplacementAudioFile({ name: 'a.wav' }), true);
  assert.equal(isPersonReplacementAudioFile({ name: 'a.mp4' }), false);
  assert.equal(isPersonReplacementAudioFile({}), false);
});
