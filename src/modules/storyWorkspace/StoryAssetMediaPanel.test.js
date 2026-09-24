import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryAssetMediaPanel } from './StoryAssetMediaPanel.js';
import { buildStoryAssetGenerationNode, buildStoryAssetResultNode, readStoryAssetTask } from './storyAssetMediaModel.js';

// Local DOM substitute for this new card extension; not the missing legacy fixture or a browser test.
class Element {
  constructor(tag, cls = '', text = '') { this.tag = tag; this.className = cls; this.textContent = String(text); this.children = []; this.attrs = {}; this.events = {}; this.value = ''; }
  append(...children) { for (const child of children) { this.children.push(child); if (this.tag === 'select' && this.children.length === 1) this.value = child.value; } }
  setAttribute(key, value) { this.attrs[key] = value; }
  addEventListener(type, action) { (this.events[type] ||= []).push(action); }
  emit(type) { if (!this.disabled) for (const action of this.events[type] || []) action({ target: this }); }
  set selectedIndex(value) { this._selectedIndex = value; if (value === -1) this.value = ''; }
  get selectedIndex() { return this._selectedIndex; }
}
function walk(node) { return [node, ...node.children.flatMap(walk)]; }
function fixture({ count = 2, catalog = true, unavailableReference = false, rememberedModel = '' } = {}) {
  const assets = Array.from({ length: count }, (_, i) => ({ id: `asset-${i}`, name: `角色${i}`, description: '<img src=private>蓝衣', referenceNodeId: '' }));
  const model = { provider: 'vendor', model: 'vendor/image', label: '图片模型' }, calls = [], messages = [];
  const context = { workspaceNodeId: 'workspace', assetKind: 'characters', assetId: assets[0].id };
  const generation = buildStoryAssetGenerationNode({ id: 'gen', ...context, asset: assets[0], model, batchId: 'batch' });
  Object.assign(generation, { jobStatus: 'success', generationStartTime: 1, images: [{ localPath: 'output/person.png' }] });
  const task = readStoryAssetTask(generation, context, assets[0]);
  const accepted = buildStoryAssetResultNode({ id: 'accepted', node: generation, context, asset: assets[0], index: 0, expectedKey: task.results[0].key });
  if (unavailableReference) accepted.src = '/output/replaced.png';
  const editor = { nodeId: 'workspace', draft: { characters: assets, scenes: [] }, nodesContext: { gen: generation, accepted },
    assetModelChoices: rememberedModel ? { characters: rememberedModel } : {}, main: new Element('main'),
    listen: (node, type, action) => node.addEventListener(type, action), message: text => messages.push(text),
    render: () => calls.push({ method: 'render' }),
    createAssetBatch: (...args) => calls.push({ method: 'batch', args }), adoptAssetResult: (...args) => calls.push({ method: 'adopt', args }),
    bindAssetReference: (...args) => calls.push({ method: 'bind', args }), setAssetReference: (...args) => calls.push({ method: 'set', args }),
    locateMediaNode: (...args) => calls.push({ method: 'locate', args }),
    button: (text, action) => { const button = new Element('button', '', text); button.addEventListener('click', action); return button; } };
  const panel = createStoryAssetMediaPanel({ editor, element: (tag, cls, text) => new Element(tag, cls, text), assetKind: 'characters', getModels: () => catalog ? [model] : [] });
  for (const asset of assets) { const card = new Element('section'); panel.appendCard(card, asset); editor.main.append(card); }
  const field = label => walk(editor.main).find(node => node.attrs['aria-label'] === label);
  const button = text => walk(editor.main).find(node => node.tag === 'button' && node.textContent === text);
  return { editor, calls, assets, messages, field, button, accepted, generation };
}

test('rendering new asset cards neither calls generation nor adopts/binds anything', () => {
  const f = fixture(); assert.deepEqual(f.calls, []); assert.equal(f.editor.assetMediaSelection.size, 0);
  const text = f.field('asset-0 待发送资料文字'); assert.equal(text.readOnly, true); assert.match(text.value, /<img src=private>/);
});
test('choosing assets calls the real editor batch action with IDs and an explicit model', () => {
  const f = fixture(); const check = f.field('选择资料 asset-1'); check.checked = true; check.emit('change');
  f.button('已选资料 → 图片批次（先建节点）').emit('click');
  assert.deepEqual(f.calls[0].args.slice(0, 2), ['characters', ['asset-1']]); assert.equal(f.calls[0].args[2].model, 'vendor/image');
});
test('selection is capped at six without silently replacing an earlier choice', () => {
  const f = fixture({ count: 7 });
  for (let i = 0; i < 7; i++) { const check = f.field(`选择资料 asset-${i}`); check.checked = true; check.emit('change'); }
  assert.equal(f.editor.assetMediaSelection.size, 6); assert.equal(f.field('选择资料 asset-6').checked, false); assert.match(f.messages[0], /最多6项/);
});
test('existing results remain adoptable and bindable with an unavailable model catalog', () => {
  const f = fixture({ catalog: false });
  assert.equal(f.button('采纳资料结果 1（不绑定参考）').disabled, false);
  assert.equal(f.button('显式设为本资料参考图并应用…').disabled, false);
});
test('adoption and explicit binding are different callbacks; adoption does not change the reference field', () => {
  const f = fixture(); f.button('采纳资料结果 1（不绑定参考）').emit('click');
  assert.equal(f.calls[0].method, 'adopt'); assert.equal(f.assets[0].referenceNodeId, ''); assert.equal(f.calls.length, 1);
  f.button('显式设为本资料参考图并应用…').emit('click'); assert.equal(f.calls[1].method, 'bind');
  assert.deepEqual(Object.keys(f.calls[1].args[2]).sort(), ['localPath', 'nodeId', 'resultKey', 'version']);
});
test('changed original image remains locatable but cannot be bound through the card', () => {
  const f = fixture({ unavailableReference: true }); assert.equal(f.button('显式设为本资料参考图并应用…').disabled, true);
  f.button('关闭并定位已采纳资料图').emit('click'); assert.deepEqual(f.calls[0], { method: 'locate', args: ['accepted'] });
});
test('remembered model removal does not silently select a different first model', () => {
  const f = fixture({ rememberedModel: JSON.stringify(['other', 'other/image']) });
  assert.equal(f.field('人物图片模型').selectedIndex, -1); assert.equal(f.field('人物图片模型').value, '');
});
test('clearing selection preserves generated and accepted nodes', () => {
  const f = fixture(); const check = f.field('选择资料 asset-0'); check.checked = true; check.emit('change');
  f.button('清空资料选择').emit('click'); assert.equal(f.editor.assetMediaSelection.size, 0);
  assert.equal(f.editor.nodesContext.gen, f.generation); assert.equal(f.editor.nodesContext.accepted, f.accepted);
});
