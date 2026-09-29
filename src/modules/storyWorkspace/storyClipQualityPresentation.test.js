import test from 'node:test';
import assert from 'node:assert/strict';

import { STORY_SCRIPT_STALE_MESSAGE } from './storyScriptRevision.js';
import {
  getStoryClipQualityNotes,
  getStoryEpisodeSplitDeliveryMessage,
  renderStoryClipQualityNotes,
} from './storyClipQualityPresentation.js';

test('storyClipQualityPresentation: notes include matching issues, repair errors, and dedupe', () => {
  const project = {
    splitQualityReview: {
      unresolvedItems: [
        {
          clipRef: 'clip-ref',
          issues: [{ reason: '问题一' }, { message: '问题二' }, { reason: '问题一' }, {}],
          error: '修补失败',
        },
        {
          clipRef: 'other-ref',
          issues: [{ reason: '不应显示' }],
        },
      ],
    },
  };
  assert.deepEqual(
    getStoryClipQualityNotes(project, { id: 'clip', ref: 'clip-ref' }),
    ['问题一', '问题二', '自动修补未采用，保留原候选：修补失败'],
  );
});

test('storyClipQualityPresentation: stale scripts and unresolved clip reviews produce notes', () => {
  assert.deepEqual(
    getStoryClipQualityNotes(
      {
        storyboardStale: true,
        splitQualityReview: { unresolvedClipRefs: ['clip-ref'], unresolvedItems: [] },
      },
      { ref: 'clip-ref' },
    ),
    [STORY_SCRIPT_STALE_MESSAGE],
  );
  assert.deepEqual(
    getStoryClipQualityNotes(
      {
        splitQualityReview: { unresolvedClipRefs: ['clip-ref'], unresolvedItems: [] },
      },
      { ref: 'clip-ref' },
    ),
    ['本段内容核对未完成，已保留提示词，请结合原片检查。'],
  );
});

test('storyClipQualityPresentation: incomplete replication evidence is surfaced', () => {
  const clip = {
    ref: 'clip-1',
    sourceStartSec: 0,
    sourceEndSec: 5,
    durationSec: 5,
    events: [],
  };
  const project = {
    replication: { sourceAnalysis: { events: [] } },
    splitQualityReview: { unresolvedItems: [], verificationScope: 'content' },
  };
  const notes = getStoryClipQualityNotes(project, clip);
  assert.equal(notes.length, 1);
  assert.match(notes[0], /原片记录缺少逐镜切点/);
});

test('storyClipQualityPresentation: delivery message distinguishes review states', () => {
  const clips = [{ ref: 'clip-1' }, { ref: 'clip-2' }];
  assert.equal(
    getStoryEpisodeSplitDeliveryMessage({
      clips,
      splitQualityReview: {
        unresolvedItems: [{ clipRef: 'clip-1', issues: [{ reason: '需核对' }] }],
      },
    }),
    '已保存 2 个片段，其中 1 段需核对；请查看片段旁的核对记录。',
  );
  assert.equal(
    getStoryEpisodeSplitDeliveryMessage({
      clips,
      splitQualityReview: { verificationScope: 'format-and-timing' },
    }),
    '已保存 2 个片段，格式与时间检查完成，请自行检查内容。',
  );
  assert.equal(
    getStoryEpisodeSplitDeliveryMessage({
      clips,
      splitQualityReview: { status: 'passed' },
    }),
    '已保存 2 个片段，内容检查已通过。',
  );
  assert.equal(getStoryEpisodeSplitDeliveryMessage({ clips: [] }), '已保存 0 个片段。');
});

test('storyClipQualityPresentation: notes render through the supplied escaper', () => {
  const html = renderStoryClipQualityNotes(
    {
      splitQualityReview: {
        unresolvedItems: [
          { clipRef: 'clip-1', issues: [{ reason: 'A' }] },
          { clipRef: 'clip-1', issues: [{ reason: 'B' }] },
        ],
      },
    },
    { ref: 'clip-1' },
    (value) => `ESC(${value})`,
  );
  assert.match(html, /本段有 2 项需核对/);
  assert.match(html, /<li>ESC\(A\)<\/li>/);
  assert.match(html, /<li>ESC\(B\)<\/li>/);
  assert.equal(renderStoryClipQualityNotes({}, { ref: 'clip-1' }, String), '');
});
