import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_CHARACTER_VOICE_FALLBACK_LINE,
  createStoryCharacterVoiceEditorDraft,
  createStoryCharacterVoicePreviewGuard,
  estimateStoryCharacterVoiceDurationSec,
  extractStoryCharacterDialogue,
  getStoryCharacterVoiceSampleText,
  normalizeStoryCharacterVoiceHistory,
  normalizeStoryCharacterVoiceReference,
  replaceStoryCharacterVoiceReference,
  clearStoryCharacterVoiceReference,
  restoreStoryCharacterVoiceHistoryReference,
  buildStoryCharacterVoicePayload,
} from './storyCharacterVoice.js';

function createVoiceReference(id, overrides = {}) {
  return {
    audioUrl: `https://assets.example/${id}.mp3`,
    localPath: `data/uploads/${id}.mp3`,
    source: 'upload',
    fileName: `${id}.mp3`,
    sampleText: `sample-${id}`,
    updatedAt: 100,
    ...overrides,
  };
}

test('storyCharacterVoice: extracts and bounds a character audition sample', () => {
  const project = {
    chapters: [
      { content: 'Alice：第一句。\nBob：不是她的台词。' },
      { content: '旁白：没有说话人。' },
    ],
  };

  assert.equal(
    extractStoryCharacterDialogue({ characterName: 'Alice', project }),
    '第一句。',
  );

  const sample = getStoryCharacterVoiceSampleText({
    characterName: 'Alice',
    project,
  });
  assert.match(sample, /第一句/u);
  assert.match(sample, new RegExp(STORY_CHARACTER_VOICE_FALLBACK_LINE.slice(0, 6), 'u'));
  assert.ok([...sample].length <= 21);
  assert.match(sample, /。$/u);
  assert.equal(estimateStoryCharacterVoiceDurationSec('你好，世界！'), 1);
});

test('storyCharacterVoice: preview guard rejects stale work', () => {
  const guard = createStoryCharacterVoicePreviewGuard();
  const audio = {};
  const ticket = guard.begin({ assetId: 'hero', source: 'sample', audioEl: audio });

  assert.equal(Object.isFrozen(ticket), true);
  assert.equal(guard.isCurrent(ticket), true);
  assert.equal(guard.isCurrent({ ...ticket }), true);
  assert.equal(guard.isCurrent({ ...ticket, generation: ticket.generation + 1 }), false);
  guard.invalidate();
  assert.equal(guard.isCurrent(ticket), false);
});

test('storyCharacterVoice: normalizes, replaces, clears, and restores reference history', () => {
  const first = normalizeStoryCharacterVoiceReference(createVoiceReference('first'));
  const duplicate = normalizeStoryCharacterVoiceReference(
    createVoiceReference('first', { audioUrl: 'https://other.example/first.mp3', updatedAt: 200 }),
  );
  const second = normalizeStoryCharacterVoiceReference(createVoiceReference('second'));

  assert.equal(normalizeStoryCharacterVoiceHistory([first, duplicate, second]).length, 2);
  assert.equal(second.source, 'upload');
  assert.equal(second.fileName, 'second.mp3');

  const asset = {
    voiceReference: first,
    voiceReferenceHistory: [second],
  };
  const replaced = replaceStoryCharacterVoiceReference(asset, second);
  assert.equal(replaced.localPath, second.localPath);
  assert.deepEqual(asset.voiceReference, second);
  assert.equal(asset.voiceReferenceHistory.length, 1);
  assert.equal(asset.voiceReferenceHistory[0].localPath, first.localPath);

  const cleared = clearStoryCharacterVoiceReference(asset);
  assert.equal(cleared.localPath, second.localPath);
  assert.equal(asset.voiceReference, null);
  assert.equal(asset.voiceReferenceHistory[0].localPath, second.localPath);

  const restored = restoreStoryCharacterVoiceHistoryReference(asset, 0);
  assert.equal(restored.localPath, second.localPath);
  assert.equal(asset.voiceReference.localPath, second.localPath);
  assert.equal(asset.voiceReferenceHistory.some((item) => item.localPath === second.localPath), false);
});

test('storyCharacterVoice: builds an editor draft and model payload', () => {
  const asset = {
    id: 'hero',
    name: 'Alice',
    role: '主角',
    description: '冷静、坚定',
    voiceReference: {
      ...createVoiceReference('hero', { modelId: 'indextts2_clone' }),
      generationParams: { prompt: 'saved' },
    },
  };
  const draft = createStoryCharacterVoiceEditorDraft({
    asset,
    data: {
      project: {
        chapters: [{ content: 'Alice：我准备好了吗？' }],
      },
      episodes: [],
    },
  });

  assert.equal(draft.assetId, 'hero');
  assert.equal(draft.voiceDescription, '主角；冷静、坚定');
  assert.match(draft.sampleText, /我准备好了吗/u);
  assert.equal(draft.nodeData.model, 'indextts2_clone');
  assert.equal(draft.nodeData.generationParams.prompt, 'saved');

  const built = buildStoryCharacterVoicePayload({
    asset,
    editor: draft,
    installId: 'install-a',
  });

  assert.equal(built.workflow.key, 'indextts2_clone');
  assert.equal(built.payload.nodeId, 'story-character-voice-hero');
  assert.equal(built.payload.audioWorkflowKey, 'indextts2_clone');
  assert.equal(built.payload.textInputs[0], draft.sampleText);
  assert.equal(built.payload.audioRefs[0].refSlot, 'audioRef');
  assert.equal(built.payload.audioRefs[0].url, asset.voiceReference.audioUrl);
  assert.equal(built.payload.installId, 'install-a');
  assert.match(built.payload.prompt, /Alice/u);
});
