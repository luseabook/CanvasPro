import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildStoryClipMentionCandidates,
  getStoryAssetIdFromMentionNodeId,
  getStoryClipMentionVoiceState,
  getStoryEpisodeCharacterVoiceEnabled,
  normalizeStoryClipTimeLabel,
  renderStoryClipPromptMentions,
  resolveStoryClipAssetMentionRefs,
  resolveStoryClipPromptAssetRefs,
  resolveStoryClipPromptPillPresentation,
  setStoryClipMentionVoiceEnabled,
  setStoryEpisodeCharacterVoiceEnabled,
  syncStoryClipPromptPillHoverTarget,
} from './storyClipMentions.js';

const ASSETS = [
  {
    id: 'hero',
    kind: 'character',
    name: 'Alice',
    baseAppearanceId: 'hero-base',
    appearances: [
      { id: 'hero-alt', name: 'Alt', imageUrl: 'https://cdn.example/alt.png' },
      { id: 'hero-base', name: 'Base', imageUrl: 'https://cdn.example/base.png' },
    ],
    voiceReference: {
      audioUrl: 'https://cdn.example/voice.mp3',
      localPath: 'data/voice.mp3',
    },
  },
  {
    id: 'room',
    kind: 'scene',
    name: 'Room',
    imageUrl: 'https://cdn.example/room.png',
  },
];

test('storyClipMentions: normalizes time labels to bounded tenths of a second', () => {
  assert.equal(normalizeStoryClipTimeLabel(''), '3.0s');
  assert.equal(normalizeStoryClipTimeLabel('0'), '3.0s');
  assert.equal(normalizeStoryClipTimeLabel('12.34s'), '12.3s');
  assert.equal(normalizeStoryClipTimeLabel(5000), '999.0s');
  assert.equal(normalizeStoryClipTimeLabel(-2, '5.0s'), '5.0s');
});

test('storyClipMentions: builds asset variants, filters queries, and exposes the time tool', () => {
  const candidates = buildStoryClipMentionCandidates({
    assets: ASSETS,
    includeTime: true,
  });
  const hero = candidates.find((candidate) => candidate.storyAssetId === 'hero');

  assert.ok(hero);
  assert.deepEqual(
    hero.mentionVariants.map((variant) => variant.storyAppearanceId),
    ['hero-base', 'hero-alt'],
  );
  assert.equal(hero.mentionVariantIndex, 0);
  assert.equal(hero.storyAssetKind, 'character');
  assert.equal(hero.missingAsset, false);

  const time = candidates.find((candidate) => candidate.pillKind === 'time');
  assert.equal(time.pillLabel, '3.0s');
  assert.equal(time.assetId, 'story-meta:time');

  const alt = buildStoryClipMentionCandidates({
    assets: ASSETS,
    query: 'alt',
  })[0];
  assert.equal(alt.mentionVariantIndex, 1);
  assert.equal(alt.mentionVariants[1].storyAppearanceId, 'hero-alt');
});

test('storyClipMentions: renders prompt pills and resolves image references', () => {
  const html = renderStoryClipPromptMentions('@Alice', { assets: ASSETS });

  assert.match(html, /class="ref-pill/u);
  assert.match(html, /data-story-asset-hover-id="hero"/u);
  assert.match(html, /data-story-asset-hover-appearance-id="hero-base"/u);
  assert.match(html, /src="https:\/\/cdn\.example\/base\.png"/u);
  assert.equal(html.includes('data-ref-unresolved="true"'), false);

  const refs = resolveStoryClipPromptAssetRefs('@Alice', { assets: ASSETS });
  assert.equal(refs.length, 2);
  assert.equal(refs[0].type, 'image');
  assert.equal(refs[0].storyAssetId, 'hero');
  assert.equal(refs[0].url, 'https://cdn.example/base.png');
  assert.equal(refs[1].type, 'audio');
  assert.equal(refs[1].url, 'https://cdn.example/voice.mp3');
  assert.equal(getStoryAssetIdFromMentionNodeId(refs[0].assetId), 'hero');
});

test('storyClipMentions: resolves character voice state and appends an audio reference', () => {
  const episode = {};
  assert.equal(getStoryEpisodeCharacterVoiceEnabled(episode, 'hero'), undefined);
  assert.equal(setStoryEpisodeCharacterVoiceEnabled(episode, 'hero', true), true);
  assert.equal(getStoryEpisodeCharacterVoiceEnabled(episode, 'hero'), true);

  const node = { dataset: { assetId: 'story-asset:hero:hero-base' } };
  const state = getStoryClipMentionVoiceState(node, ASSETS);
  assert.equal(state.available, true);
  assert.equal(state.enabled, true);
  assert.equal(state.url, 'https://cdn.example/voice.mp3');

  const refs = resolveStoryClipAssetMentionRefs(node, ASSETS, { voiceEnabled: true });
  assert.equal(Array.isArray(refs), true);
  assert.equal(refs.length, 2);
  assert.equal(refs[1].type, 'audio');
  assert.equal(refs[1].url, 'https://cdn.example/voice.mp3');

  const disabled = setStoryClipMentionVoiceEnabled(node, ASSETS, false);
  assert.equal(disabled.enabled, false);
  assert.equal(node.dataset.storyVoiceEnabled, 'false');
  assert.deepEqual(resolveStoryClipPromptPillPresentation(node, ASSETS), {
    pillKind: '',
    missingAsset: false,
  });
  assert.equal(syncStoryClipPromptPillHoverTarget(node), 'hero');
});
