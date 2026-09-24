import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryClipPreview } from './StoryClipPreview.js';

// Local, deliberately small DOM substitute for this panel only. Not the missing legacy
// tests/testPreviewDom.js, not a browser or Electron end-to-end fixture.
class Element {
  constructor(tag, className = '', text = '') { this.tag = tag; this.className = className; this.textContent = String(text); this.children = []; this.attrs = {}; this.events = {}; this.value = ''; }
  set value(value) { this._value = String(value); }
  get value() { return this._value; }
  append(...children) { for (const child of children) { this.children.push(child); child.parent = this; } }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  setAttribute(name, value) { this.attrs[name] = value; }
  addEventListener(type, callback, options = {}) { (this.events[type] ||= []).push({ callback, signal: options.signal }); }
  emit(type) { if (this.disabled) return; for (const event of this.events[type] || []) if (!event.signal?.aborted) event.callback({ target: this }); }
  remove() { this.removed = true; if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
  focus() { this.focused = true; }
}
function walk(node) { return [node, ...node.children.flatMap(walk)]; }
function fixture() {
  const items = [{ shotId: 's1', description: '静态', localPath: 'output/v1.mp4', nodeId: 'v1', duration: 6, plannedDuration: 8 },
    { shotId: 's2', description: '视频', localPath: 'output/v2.mp4', nodeId: 'v2', duration: 6, plannedDuration: 5 }];
  const calls = [], kindsRead = [];
  const audioSources = [{ nodeId: 'audio', label: '旁白', localPath: 'output/speech.wav', duration: 20 },
    { nodeId: 'bad', label: '未就绪', error: '记录时长未知' }];
  const panel = createStoryClipPreview({ element: (tag, cls, text) => new Element(tag, cls, text), items, audioSources,
    readItems: kinds => { kindsRead.push(kinds); return items.map(item => kinds[item.shotId] === 'image' ?
      { ...item, kind: 'image', nodeId: 'image', localPath: 'output/still.png', duration: item.plannedDuration } : item); },
    onApply: (ranges, selection) => calls.push({ ranges, selection }), onClose: () => calls.push('close'), onLocate: id => calls.push({ locate: id }) });
  const field = label => walk(panel.root).find(node => node.attrs['aria-label'] === label);
  const button = text => walk(panel.root).find(node => node.tag === 'button' && node.textContent === text);
  const apply = button('确认应用全部草稿并建立初剪（不渲染）');
  const change = (label, value, type = 'input') => { const node = field(label); node.value = value; node.emit(type); };
  return { panel, calls, items, audioSources, kindsRead, field, button, apply, change };
}

test('panel defaults to video and no audio, and opening performs no apply or source-switch callback', () => {
  const f = fixture(); assert.equal(f.field('s1 初剪媒体').value, 'video'); assert.equal(f.field('独立音轨素材').value, '');
  assert.deepEqual(f.calls, []); assert.deepEqual(f.kindsRead, []);
  f.apply.emit('click'); assert.equal(f.calls[0].selection.audio, null);
});
test('explicit image choice is read and shown, with zero fixed origin and planned default hold', () => {
  const f = fixture(); f.change('s1 初剪媒体', 'image', 'change');
  assert.equal(f.kindsRead[0].s1, 'image'); assert.equal(f.field('s1 入点（秒，图片固定0）').disabled, true);
  assert.equal(f.field('s1 保留时长（秒）').value, '8');
  f.change('s1 保留时长（秒）', '12'); f.apply.emit('click');
  assert.equal(f.calls[0].ranges[0].end, 12); assert.equal(f.calls[0].selection.items[0].kind, 'image');
});
test('one selected audio carries explicit source range, timeline start and gain into apply', () => {
  const f = fixture(); f.change('独立音轨素材', 'audio', 'change');
  assert.equal(f.field('音频素材出点（秒）').value, '12');
  f.change('音频素材入点（秒）', '1'); f.change('音频素材出点（秒）', '5');
  f.change('音轨在成片的起点（秒）', '2'); f.change('独立音轨音量（0–1）', '0.25'); f.apply.emit('click');
  const audio = f.calls[0].selection.audio;
  assert.equal(audio.source.nodeId, 'audio'); assert.equal(audio.volume, 0.25); assert.equal(audio.timelineEnd, 6); assert.equal(audio.muted, false);
});
test('editing a track outside the movie disables apply rather than silently cropping it', () => {
  const f = fixture(); f.change('独立音轨素材', 'audio', 'change');
  f.change('音轨在成片的起点（秒）', '10'); assert.equal(f.apply.disabled, true); f.apply.emit('click'); assert.deepEqual(f.calls, []);
  assert.equal(f.field('音频素材出点（秒）').value, '12');
});
test('zero gain and explicit mute survive form parsing', () => {
  const f = fixture(); f.change('独立音轨素材', 'audio', 'change'); f.change('独立音轨音量（0–1）', '0');
  const muted = f.field('独立音轨静音'); muted.checked = true; muted.emit('change'); f.apply.emit('click');
  assert.equal(f.calls[0].selection.audio.volume, 0); assert.equal(f.calls[0].selection.audio.muted, true);
});
test('invalid local audio entries remain visible but unavailable', () => {
  const f = fixture(); const option = walk(f.panel.root).find(node => node.tag === 'option' && node.value === 'bad');
  assert.equal(option.disabled, true);
  // Simulate a forged select value: validation still rejects it.
  f.change('独立音轨素材', 'bad', 'change'); assert.equal(f.apply.disabled, true);
});
test('choosing no audio after a selection removes the selection, not the original source asset', () => {
  const f = fixture(); f.change('独立音轨素材', 'audio', 'change'); f.change('独立音轨素材', '', 'change'); f.apply.emit('click');
  assert.equal(f.calls[0].selection.audio, null); assert.equal(f.audioSources[0].duration, 20);
});
test('preview edits do not mutate the supplied visual snapshot or audio source record', () => {
  const f = fixture(); const before = JSON.stringify([f.items, f.audioSources]);
  f.change('s1 初剪媒体', 'image', 'change'); f.change('独立音轨素材', 'audio', 'change'); f.apply.emit('click');
  assert.equal(JSON.stringify([f.items, f.audioSources]), before);
});
test('destroy aborts panel handlers; abandoned preview cannot apply afterwards', () => {
  const f = fixture(); f.panel.focus(); assert.equal(f.panel.root.focused, true);
  f.panel.destroy(); f.apply.emit('click'); f.button('返回，不创建').emit('click');
  assert.deepEqual(f.calls, []); assert.equal(f.panel.root.removed, true);
});
