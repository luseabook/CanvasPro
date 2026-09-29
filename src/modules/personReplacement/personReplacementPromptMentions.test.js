import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PERSON_REPLACEMENT_PROMPT_ASSET_PREFIX,
  buildPersonReplacementPromptMentionCandidates,
  renderPersonReplacementPromptHtml,
  resolvePersonReplacementPromptMentionRef,
} from './personReplacementPromptMentions.js';

function createProject(overrides = {}) {
  return {
    characters: [
      {
        id: 'char-a',
        name: 'Alice',
        appearances: [
          {
            id: 'appearance-a',
            name: 'Red Coat',
            imageUrl: 'data/assets/char.png',
          },
        ],
      },
    ],
    scenes: [
      {
        id: 'scene-a',
        name: 'Studio',
        appearances: [
          {
            id: 'scene-appearance-a',
            name: 'Wide',
            imageUrl: 'data/assets/scene.png',
          },
        ],
      },
    ],
    libraryAssets: [
      {
        id: 'library-item',
        sourceAssetId: 'library-a',
        sourceItemIndex: 2,
        mediaKind: 'image',
        name: 'Library Shot',
        assetName: 'Library',
        imageUrl: 'data/assets/library.png',
      },
    ],
    ...overrides,
  };
}

function createPromptPackage() {
  return {
    referenceImages: [
      {
        slot: 1,
        label: '图像1',
        role: 'source-keyframe',
        ref: 'data/assets/source.png',
      },
      {
        slot: 2,
        label: '图2',
        role: 'target-character',
        targetCharacterId: 'char-a',
        targetAppearanceId: 'appearance-a',
        ref: 'data/assets/char.png',
      },
    ],
  };
}

test('personReplacementPromptMentions: current references are encoded and queryable', () => {
  const candidates = buildPersonReplacementPromptMentionCandidates(createProject(), {
    query: 'alice',
    promptPackage: createPromptPackage(),
    shot: { id: 'shot-1' },
  });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].personReplacementAssetKind, 'reference');
  assert.equal(candidates[0].label, '图2');
  assert.equal(candidates[0].assetName, 'Alice');
  assert.equal(candidates[0].thumbUrl, '/data/assets/char.png');
  assert.ok(candidates[0].assetId.startsWith(PERSON_REPLACEMENT_PROMPT_ASSET_PREFIX));
});

test('personReplacementPromptMentions: manual mode adds project and library image assets', () => {
  const candidates = buildPersonReplacementPromptMentionCandidates(createProject(), {
    promptPackage: createPromptPackage(),
    shot: { id: 'shot-1', replacementPromptMode: 'manual' },
  });

  assert.deepEqual(
    candidates.map((candidate) => candidate.personReplacementAssetKind),
    ['reference', 'reference', 'scene', 'character', 'library'],
  );
  assert.equal(candidates[3].label, 'Alice · Red Coat');
  assert.equal(candidates[3].menuSection, '人物');
  assert.equal(candidates[4].label, 'Library Shot');
  assert.equal(candidates[4].menuSection, '图片');
  assert.equal(candidates[4].personReplacementSourceItemIndex, 2);
});

test('personReplacementPromptMentions: regular mode keeps references and scenes only', () => {
  const candidates = buildPersonReplacementPromptMentionCandidates(createProject(), {
    promptPackage: createPromptPackage(),
    shot: { id: 'shot-1' },
  });

  assert.deepEqual(
    candidates.map((candidate) => candidate.personReplacementAssetKind),
    ['reference', 'reference', 'scene'],
  );
});

test('personReplacementPromptMentions: encoded references resolve back to source images', () => {
  const project = createProject();
  const promptPackage = createPromptPackage();
  const shot = { id: 'shot-1', replacementPromptMode: 'manual' };
  const candidates = buildPersonReplacementPromptMentionCandidates(project, {
    promptPackage,
    shot,
  });
  const sourceCandidate = candidates[0];
  const characterCandidate = candidates.find(
    (candidate) => candidate.personReplacementAssetKind === 'character',
  );

  assert.deepEqual(
    resolvePersonReplacementPromptMentionRef(
      {
        dataset: {
          assetId: sourceCandidate.assetId,
          assetIndex: '0',
        },
      },
      { project, promptPackage, shot },
    ),
    {
      origin: 'asset',
      assetId: '1',
      itemIndex: 0,
      type: 'image',
      name: '图像1 · 当前首帧',
      label: '图像1',
      referenceSlot: 1,
      url: '/data/assets/source.png',
      thumbUrl: '/data/assets/source.png',
      nodeData: {
        type: 'source-image',
        imageUrl: '/data/assets/source.png',
      },
    },
  );
  assert.equal(
    resolvePersonReplacementPromptMentionRef(
      {
        dataset: {
          assetId: characterCandidate.assetId,
          assetIndex: '0',
        },
      },
      { project, promptPackage, shot },
    ).url,
    '/data/assets/char.png',
  );
});

test('personReplacementPromptMentions: unknown ids fall back to the external asset resolver', () => {
  let fallbackInput = null;
  const resolved = resolvePersonReplacementPromptMentionRef(
    {
      dataset: {
        assetId: 'external-a',
        assetIndex: '3',
      },
    },
    {
      project: createProject(),
      resolveExternalAssetRef(input) {
        fallbackInput = input;
        return { resolved: true };
      },
    },
  );

  assert.deepEqual(fallbackInput, { assetId: 'external-a', itemIndex: 3 });
  assert.deepEqual(resolved, { resolved: true });
});

test('personReplacementPromptMentions: plain text is escaped while mention html is retained', () => {
  assert.equal(
    renderPersonReplacementPromptHtml('第一行 <b>粗体</b>\n第二行'),
    '第一行 &lt;b&gt;粗体&lt;/b&gt;<br>第二行',
  );
  const html = renderPersonReplacementPromptHtml(
    '<span class="ref-pill" data-asset-id="asset-1" data-label="图1">图1</span>',
  );
  assert.match(html, /class="ref-pill"/u);
  assert.match(html, /data-asset-id="asset-1"/u);
  assert.match(html, /data-label="图1"/u);
});
