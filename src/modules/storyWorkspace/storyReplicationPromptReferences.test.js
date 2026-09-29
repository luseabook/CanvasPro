import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getStoryReplicationCharacterDisplayLabel,
  syncStoryReplicationPromptReferences,
} from './storyReplicationPromptReferences.js';

test('storyReplicationPromptReferences: display labels enumerate replicated characters and appearances', () => {
  const asset = {
    id: 'character-a',
    kind: 'character',
    name: 'Alice',
    replicationSource: { name: 'Alice' },
    appearances: [
      { id: 'appearance-a', name: 'Base' },
      { id: 'appearance-b', name: 'Twin', sourceOrigin: 'library' },
    ],
  };

  assert.equal(
    getStoryReplicationCharacterDisplayLabel(asset, asset.appearances[1], [asset]),
    '角色1 · 替换形象2',
  );
  assert.equal(getStoryReplicationCharacterDisplayLabel({ ...asset, kind: 'scene' }, asset.appearances[0]), '');
  assert.equal(
    getStoryReplicationCharacterDisplayLabel(
      { ...asset, replicationSource: null },
      asset.appearances[0],
    ),
    '',
  );
  assert.equal(
    getStoryReplicationCharacterDisplayLabel(asset, asset.appearances[0], [{ ...asset, id: 'other' }]),
    '',
  );
});

test('storyReplicationPromptReferences: complete seedance 2.5 prompts are left untouched', () => {
  const prompt = '【参考素材】\n人物\n【分镜与声音】\n分镜1：动作';
  assert.equal(
    syncStoryReplicationPromptReferences(
      prompt,
      { promptMode: 'seedance-2.5', shots: [] },
      [],
    ),
    prompt,
  );
});

test('storyReplicationPromptReferences: character names become stable image mentions', () => {
  const assets = [
    {
      id: 'character-a',
      kind: 'character',
      name: 'Alice',
      replicationSource: { name: 'Alice' },
      appearances: [{ id: 'appearance-a', name: 'Base' }],
    },
  ];
  const prompt = '分镜1\nAlice 推开门。';
  const synced = syncStoryReplicationPromptReferences(
    prompt,
    {
      promptMode: 'seedance-2.0',
      shots: [
        {
          id: 'shot-1',
          assetUsages: [{ assetRef: 'character-a', appearanceRef: 'appearance-a' }],
        },
      ],
    },
    assets,
  );

  assert.match(synced, /@Alice · Base/);
  assert.match(synced, /推开门/);
  assert.equal(synced.includes('\nAlice 推开门。'), false);
});
