import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addStoryAudioAssets,
  bindStoryAudioToCharacter,
  getStoryAudioBoundCharacters,
  getStoryAudioUrl,
  getStoryProjectAudioAssets,
  isStoryAudioAsset,
  removeStoryAudioAsset,
} from './storyAudioAssets.js';

test('storyAudioAssets: normalizes URLs and identifies project audio records', () => {
  const localUrl = getStoryAudioUrl({ localPath: 'data/uploads/theme.mp3' });
  assert.ok(localUrl);
  assert.equal(getStoryAudioUrl({ audioUrl: localUrl }), localUrl);
  assert.equal(isStoryAudioAsset({ mediaKind: 'audio' }), true);
  assert.equal(isStoryAudioAsset({ mediaKind: 'image' }), false);

  const audio = { id: 'a', mediaKind: 'audio', audioUrl: 'https://cdn.example/a.mp3' };
  assert.deepEqual(getStoryProjectAudioAssets({ audioAssets: [audio, { mediaKind: 'video' }] }), [audio]);
});

test('storyAudioAssets: adds new audio records and reuses duplicates by URL', () => {
  const project = {
    audioAssets: [
      {
        id: 'existing',
        mediaKind: 'audio',
        audioUrl: 'https://cdn.example/a.mp3',
      },
    ],
  };

  const added = addStoryAudioAssets(project, [
    { mediaKind: 'audio', audioUrl: 'https://cdn.example/a.mp3', name: 'Duplicate' },
    { mediaKind: 'image', audioUrl: 'https://cdn.example/image.png' },
    { mediaKind: 'audio', audioUrl: 'https://cdn.example/b.mp3', name: 'Theme' },
  ]);

  assert.equal(added.length, 2);
  assert.equal(added[0], project.audioAssets[0]);
  assert.match(added[1].id, /^story-audio-/u);
  assert.equal(added[1].name, 'Theme');
  assert.equal(project.audioAssets.length, 2);
});

test('storyAudioAssets: binds an audio asset to a character and removes it safely', () => {
  const character = { id: 'hero', kind: 'character', name: 'Alice', voiceReference: null };
  const project = { assets: [character], audioAssets: [] };

  assert.equal(
    bindStoryAudioToCharacter(
      project,
      {
        mediaKind: 'audio',
        audioUrl: 'https://cdn.example/voice.mp3',
        localPath: 'data/uploads/voice.mp3',
        name: 'Alice voice',
      },
      'hero',
    ),
    true,
  );
  assert.equal(project.audioAssets.length, 1);
  assert.equal(character.voiceReference.audioUrl, 'https://cdn.example/voice.mp3');
  assert.equal(character.voiceReference.fileName, 'Alice voice');
  assert.equal(getStoryAudioBoundCharacters(project, project.audioAssets[0]).length, 1);

  removeStoryAudioAsset(project, project.audioAssets[0].id);
  assert.equal(project.audioAssets.length, 0);
  assert.equal(getStoryAudioBoundCharacters(project, { audioUrl: 'https://cdn.example/voice.mp3' }).length, 1);
  assert.equal(bindStoryAudioToCharacter(project, { mediaKind: 'audio', audioUrl: '' }, 'missing'), false);
});
