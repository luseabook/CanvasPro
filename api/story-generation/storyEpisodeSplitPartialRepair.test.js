import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyStoryEpisodeSplitPartialRepairs,
  canRepairStoryEpisodeSplitPartialDraft,
} from './storyEpisodeSplitPartialRepair.js';

test('storyEpisodeSplitPartialRepair detects mixed valid and failed items', () => {
  assert.equal(
    canRepairStoryEpisodeSplitPartialDraft({
      items: [{ status: 'valid' }, { status: 'invalid' }],
    }),
    true,
  );
  assert.equal(
    canRepairStoryEpisodeSplitPartialDraft({
      items: [{ status: 'valid' }, { status: 'valid' }],
    }),
    false,
  );
});

test('storyEpisodeSplitPartialRepair applies repairs and retains valid items', () => {
  const validItem = {
    status: 'valid',
    sourceIndex: 0,
    sourceClipRef: 'clip-1',
    clips: [{ ref: 'existing' }],
  };
  const draft = {
    episodeRef: 'episode-1',
    attempts: 1,
    items: [
      validItem,
      {
        status: 'invalid',
        sourceIndex: 1,
        sourceClipRef: 'clip-2',
        error: { message: 'needs repair' },
      },
    ],
  };

  const result = applyStoryEpisodeSplitPartialRepairs(
    {
      episodeRef: 'episode-1',
      repairs: [{ sourceClipRef: 'clip-2', clips: [{ ref: 'repaired-2' }] }],
    },
    draft,
    {
      parseReplacementClips: (clips) => clips.map((clip) => ({ ...clip, parsed: true })),
    },
  );

  assert.equal(result.attempts, 2);
  assert.equal(result.items[0], validItem);
  assert.equal(result.items[1].status, 'valid');
  assert.deepEqual(result.items[1].clips, [{ ref: 'repaired-2', parsed: true }]);
});

test('storyEpisodeSplitPartialRepair rejects duplicate repaired clip refs', () => {
  const result = applyStoryEpisodeSplitPartialRepairs(
    {
      episodeRef: 'episode-1',
      repairs: [
        { sourceClipRef: 'clip-1', clips: [{ ref: 'duplicate' }] },
        { sourceClipRef: 'clip-2', clips: [{ ref: 'duplicate' }] },
      ],
    },
    {
      episodeRef: 'episode-1',
      items: [
        { status: 'invalid', sourceIndex: 0, sourceClipRef: 'clip-1' },
        { status: 'invalid', sourceIndex: 1, sourceClipRef: 'clip-2' },
      ],
    },
    {
      parseReplacementClips: (clips) => clips,
    },
  );

  assert.equal(result.items[0].status, 'valid');
  assert.equal(result.items[1].status, 'invalid');
  assert.match(result.items[1].error.message, /duplicate/);
});
