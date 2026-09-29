import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildVideoNodeFooterControlSig,
  buildVideoNodePromptBoxSizeSig,
  buildVideoNodePromptUiSig,
  buildVideoNodeSubmitButtonSig,
  buildVideoNodeVideoViewSig,
} from './videoNodeUpdateSignatures.js';

test('videoNodeUpdateSignatures: prompt UI signature only tracks model and provider', () => {
  const base = { model: 'video-model', provider: 'runninghub', unrelated: 1 };
  assert.equal(buildVideoNodePromptUiSig(base), buildVideoNodePromptUiSig({ ...base, unrelated: 2 }));
  assert.notEqual(buildVideoNodePromptUiSig(base), buildVideoNodePromptUiSig({ ...base, model: 'other' }));
  assert.equal(buildVideoNodePromptBoxSizeSig({ promptBoxHeight: 42 }), '42');
  assert.equal(buildVideoNodePromptBoxSizeSig({}), '0');
});

test('videoNodeUpdateSignatures: video view signature includes media and task fields', () => {
  const base = {
    videos: [{ videoUrl: 'https://cdn.example/video.mp4', thumbUrl: 'https://cdn.example/thumb.jpg' }],
    mainVideoIndex: 0,
    isGenerating: false,
    rhTaskId: '',
  };
  const changed = buildVideoNodeVideoViewSig({ ...base, rhTaskId: 'task-1' });

  assert.equal(buildVideoNodeVideoViewSig(base), buildVideoNodeVideoViewSig({ ...base }));
  assert.notEqual(buildVideoNodeVideoViewSig(base), changed);
  assert.match(changed, /task-1/);
});

test('videoNodeUpdateSignatures: footer signature ignores layout and media payload fields', () => {
  const nodeData = {
    x: 10,
    width: 300,
    videoUrl: 'https://cdn.example/a.mp4',
    model: 'video-model',
    provider: 'runninghub',
    mode: 'reference',
  };
  const sameVisual = {
    ...nodeData,
    x: 50,
    width: 500,
    videoUrl: 'https://cdn.example/b.mp4',
  };
  const changed = { ...nodeData, mode: 'first-last' };

  assert.equal(
    buildVideoNodeFooterControlSig(nodeData, 'locale'),
    buildVideoNodeFooterControlSig(sameVisual, 'locale'),
  );
  assert.notEqual(
    buildVideoNodeFooterControlSig(nodeData, 'locale'),
    buildVideoNodeFooterControlSig(changed, 'locale'),
  );
});

test('videoNodeUpdateSignatures: submit signature tracks cancel state', () => {
  const nodeData = { model: 'video-model', generationParams: { duration: 5 } };
  const idle = buildVideoNodeSubmitButtonSig(nodeData, 'locale', { rhCancelInFlight: false });
  const cancelling = buildVideoNodeSubmitButtonSig(nodeData, 'locale', { rhCancelInFlight: true });

  assert.notEqual(idle, cancelling);
  assert.match(cancelling, /cancel:1/);
});
