import test from 'node:test';
import assert from 'node:assert/strict';
import { isStoryCollaborationProject } from './storyCollaborationPolicy.js';

test('only writing and confirmed collaboration stages count as collaboration projects', () => {
  assert.equal(isStoryCollaborationProject({ project: { collaboration: { stage: 'writing' } } }), true);
  assert.equal(isStoryCollaborationProject({ project: { collaboration: { stage: 'confirmed' } } }), true);
  assert.equal(isStoryCollaborationProject({ project: { collaboration: { stage: 'draft' } } }), false);
  assert.equal(isStoryCollaborationProject({ project: {} }), false);
  assert.equal(isStoryCollaborationProject(null), false);
});
