import test from 'node:test';
import assert from 'node:assert/strict';

import {
  advanceStoryProjectSession,
  createStoryProjectTaskToken,
  isStoryProjectTaskTokenCurrent,
  isStoryProjectTaskTokenLive,
  sanitizeStoryTaskResumePayload,
} from './storyProjectTaskToken.js';

test('storyProjectTaskToken: sanitizes resume payload secrets', () => {
  const source = {
    apiKey: 'secret',
    installId: 'install',
    authorization: 'Bearer token',
    headers: { authorization: 'token' },
    project: { id: 'project-a' },
    keep: true,
  };
  const sanitized = sanitizeStoryTaskResumePayload(source);

  assert.deepEqual(sanitized, { project: { id: 'project-a' }, keep: true });
  assert.deepEqual(sanitizeStoryTaskResumePayload(null), {});
  assert.deepEqual(sanitizeStoryTaskResumePayload(['bad']), {});
});

test('storyProjectTaskToken: captures project session and model settings', () => {
  const token = createStoryProjectTaskToken({
    data: { project: { id: 'project-a', title: 'A' } },
    storyProjectSessionById: { 'project-a': '7' },
    projectTitleEdited: true,
    models: { text: 'text-model' },
    textProvider: 'runninghub',
    textProviderProfileId: 'ignored',
    imageProvider: ' image ',
    videoProvider: 'video',
  });

  assert.equal(token.projectId, 'project-a');
  assert.equal(token.sessionId, 7);
  assert.equal(token.projectTitleEdited, true);
  assert.equal(token.data.project.title, 'A');
  assert.deepEqual(token.modelSettings.models, { text: 'text-model' });
  assert.equal(token.modelSettings.textProviderProfileId, 'runninghub');
  assert.equal(token.modelSettings.imageProvider, 'image');
});

test('storyProjectTaskToken: validates live and current tokens', () => {
  const token = createStoryProjectTaskToken({
    data: { project: { id: 'project-a' } },
    storyProjectSessionById: { 'project-a': 3 },
  });

  assert.equal(
    isStoryProjectTaskTokenLive(
      {
        data: { project: { id: 'project-a' } },
        storyProjectSessionById: { 'project-a': 3 },
      },
      token,
    ),
    true,
  );
  assert.equal(
    isStoryProjectTaskTokenLive(
      {
        data: { project: { id: 'project-b' } },
        projects: [{ id: 'project-a' }],
        storyProjectSessionById: { 'project-a': 3 },
      },
      token,
    ),
    true,
  );
  assert.equal(
    isStoryProjectTaskTokenLive(
      {
        data: { project: { id: 'project-b' } },
        storyProjectSessionById: { 'project-a': 4 },
      },
      token,
    ),
    false,
  );
  assert.equal(isStoryProjectTaskTokenLive({}, token), false);
  assert.equal(isStoryProjectTaskTokenCurrent({ data: { project: { id: 'project-b' } } }, token), false);
});

test('storyProjectTaskToken: advances per-project and active session counters', () => {
  const state = {
    data: { project: { id: 'project-a' } },
    storyProjectSessionId: 2,
    storyProjectSessionById: { 'project-a': 2 },
  };

  assert.equal(advanceStoryProjectSession(state, 'project-a'), 3);
  assert.equal(state.storyProjectSessionId, 3);
  assert.equal(state.storyProjectSessionById['project-a'], 3);
  assert.equal(advanceStoryProjectSession(state, 'project-b'), 1);
  assert.equal(state.storyProjectSessionById['project-b'], 1);
  assert.equal(state.storyProjectSessionId, 3);
  assert.equal(advanceStoryProjectSession({}, ''), 0);
});
