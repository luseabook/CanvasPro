import test from 'node:test';
import assert from 'node:assert/strict';
import { protectStoryPromptPills, syncStoryClipPromptReferences } from './storyClipPromptReferences.js';

// 占位符两端是私用区字符 U+E000 / U+E001，避免 story-pill-1 与 story-pill-10 前缀串位
const token = (index) => `\uE000story-pill-${index}\uE001`;
const pill = (label, extra = '') => `<span class="ref-pill" data-label="${label}"${extra}>@${label}</span>`;

test('reference pills are swapped for private-use tokens and restored', () => {
  const nested = '<span class="ref-pill" data-label="张三"><span class="at">@</span>张三</span>';
  const single = "<SPAN CLASS='chip REF-PILL'>李四</SPAN>";
  const html = `前${nested}中${single}后<span class="ref-pillow">不是胶囊</span>`;
  const protectedPrompt = protectStoryPromptPills(html);
  assert.equal(
    protectedPrompt.source,
    `前${token(0)}中${token(1)}后<span class="ref-pillow">不是胶囊</span>`,
  );
  assert.deepEqual(protectedPrompt.pills, [
    { token: token(0), html: nested },
    { token: token(1), html: single },
  ]);
  assert.equal(protectedPrompt.restore(protectedPrompt.source), html);
  assert.equal(protectedPrompt.restore(`${token(1)}+${token(1)}`), `${single}+${single}`);
});

test('eleven or more pills restore without token collisions', () => {
  const html = Array.from({ length: 11 }, (_, index) => pill(`P${index}`)).join(' ');
  const protectedPrompt = protectStoryPromptPills(html);
  assert.equal(protectedPrompt.pills.length, 11);
  assert.equal(protectedPrompt.restore(protectedPrompt.source), html);
});

test('an unclosed pill stops protection and keeps the rest verbatim', () => {
  const html = `a${pill('甲')}b<span class="ref-pill">c<span>d</span>`;
  const protectedPrompt = protectStoryPromptPills(html);
  assert.equal(protectedPrompt.source, `a${token(0)}b<span class="ref-pill">c<span>d</span>`);
  assert.equal(protectedPrompt.pills.length, 1);
  const empty = protectStoryPromptPills();
  assert.deepEqual([empty.source, empty.pills, empty.restore('原样')], ['', [], '原样']);
  assert.equal(protectStoryPromptPills('纯文本').restore('纯文本'), '纯文本');
});

test('already structured prompts are returned untouched', () => {
  const prompt = '【参考素材】\n@张三\n【分镜与声音】\n镜头一';
  assert.equal(syncStoryClipPromptReferences(prompt, [{ replicationSource: true, appearances: [] }]), prompt);
  assert.equal(syncStoryClipPromptReferences(null), '');
  assert.equal(syncStoryClipPromptReferences('  只有文字  '), '只有文字');
});

const libraryCharacter = {
  id: 'char 1',
  name: '张三',
  kind: 'character',
  appearances: [{ id: 'look 1', name: '校服', sourceOrigin: 'library', imageUrl: 'zhang.png' }],
};

test('library character references gain the reference-image sentence and drop voice lines', () => {
  const prompt = '将<@张三 · 校服>定义为<张三>。\n声音设定（张三）：低沉\n声音设定（李四）：清脆\n镜头推进';
  assert.equal(
    syncStoryClipPromptReferences(prompt, [libraryCharacter]),
    '将<@张三 · 校服>定义为<张三>。人物外观、发型和服装以该参考图为准。\n声音设定（李四）：清脆\n镜头推进',
  );
  const once = syncStoryClipPromptReferences(prompt, [libraryCharacter]);
  assert.equal(syncStoryClipPromptReferences(once, [libraryCharacter]), once);
});

test('library character pills are matched by asset id or by label', () => {
  const byId = pill('张三 · 校服', ' data-asset-id="story-asset:char%201:look%201"');
  const byLabel = pill('张三 · 校服');
  for (const reference of [byId, byLabel]) {
    const prompt = `<div>将&lt;${reference}&gt;定义为&lt;张三&gt;。</div>`;
    assert.equal(
      syncStoryClipPromptReferences(prompt, [libraryCharacter]),
      `<div>将&lt;${reference}&gt;定义为&lt;张三&gt;。人物外观、发型和服装以该参考图为准。</div>`,
    );
  }
});

test('characters that are not library images are left as written', () => {
  const prompt = '将<@张三 · 校服>定义为<张三>。\n声音设定（张三）：低沉';
  const generated = {
    ...libraryCharacter,
    appearances: [{ ...libraryCharacter.appearances[0], sourceOrigin: 'generated' }],
  };
  const noImage = {
    ...libraryCharacter,
    appearances: [{ ...libraryCharacter.appearances[0], imageUrl: '' }],
  };
  assert.equal(syncStoryClipPromptReferences(prompt, [generated]), prompt);
  assert.equal(syncStoryClipPromptReferences(prompt, [noImage]), prompt);
});

const replicatedScene = {
  id: 'scene-1',
  name: '客厅',
  kind: 'scene',
  replicationSource: true,
  description: '老房子客厅',
  appearances: [{ id: 'night', name: '夜晚', imageUrl: ' ', description: '' }],
};

test('replicated scenes without images are written out as text', () => {
  const prompt =
    '@客厅 · 夜晚，灯光昏暗。\n@客厅 · 夜晚里有人\n保留原视频的视觉风格、场景和道具\n结尾@客厅 · 夜晚';
  // 端口行为：提及后面紧跟文字（如「里」）时不替换
  assert.equal(
    syncStoryClipPromptReferences(prompt, [replicatedScene]),
    '客厅（老房子客厅），灯光昏暗。\n@客厅 · 夜晚里有人\n结尾客厅（老房子客厅）',
  );
  const described = {
    ...replicatedScene,
    appearances: [{ ...replicatedScene.appearances[0], description: '昏暗的客厅' }],
  };
  assert.equal(syncStoryClipPromptReferences('@客厅 · 夜晚。', [described]), '客厅（昏暗的客厅）。');
  const plain = { ...replicatedScene, description: '' };
  assert.equal(syncStoryClipPromptReferences('@客厅 · 夜晚', [plain]), '客厅');
});

test('replicated scene pills are replaced by escaped text', () => {
  const scene = { ...replicatedScene, name: 'A&B', description: '<旧宅>' };
  const prompt = `看${pill('A&amp;B · 夜晚')}。`;
  assert.equal(syncStoryClipPromptReferences(prompt, [scene]), '看A&amp;B（&lt;旧宅&gt;）。');
});

test('the keep-original-style line is only dropped for replication prompts', () => {
  const prompt = '镜头一\n  保留原视频的视觉风格、场景和道具  \n镜头二';
  assert.equal(syncStoryClipPromptReferences(prompt, [libraryCharacter]), prompt);
  assert.equal(syncStoryClipPromptReferences(prompt, [{ replicationSource: true }]), '镜头一\n镜头二');
});
