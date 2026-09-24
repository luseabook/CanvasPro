import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryWorkspace, createEpisode, createShot } from './storyWorkspaceModel.js';
import { createStoryAiQueueBatch, storyAiQueueTask, assertStoryAiQueueSource, serializeStoryAiQueue, parseStoryAiQueueSnapshot } from './storyAiQueueModel.js';
const model = { provider: 'volcengine', model: 'volcengine/test-model' };
function fixture() {
  const workspace = createStoryWorkspace(); workspace.episodes[0].script = '第一段\n\n第二段';
  workspace.episodes.push(createEpisode('第二集', '第三段'));
  workspace.characters.push({ id: 'person-one', name: '甲', description: '灰衣', referenceNodeId: 'PRIVATE_IMAGE_ID' });
  const jobs = createStoryAiQueueBatch(workspace, workspace.episodes.map(episode => episode.id), model, { count: 1, characterIds: ['person-one'] });
  return { workspace, jobs };
}
test('batch construction snapshots only selected source text and metadata', () => {
  const { workspace, jobs } = fixture(); assert.equal(jobs.length, 2);
  const raw = serializeStoryAiQueue('owner', jobs); assert.ok(!raw.includes('PRIVATE_IMAGE_ID'));
  assert.ok(!raw.includes('apiKey')); assert.equal(jobs[0].input.count, 1);
  workspace.episodes[0].script = '改动'; assert.equal(jobs[0].input.script, '第一段\n\n第二段');
});
test('empty, duplicate and oversized episode selections fail before requests', () => {
  const { workspace } = fixture(), id = workspace.episodes[0].id;
  for (const ids of [[], [id, id], Array(7).fill(id)]) assert.throws(() => createStoryAiQueueBatch(workspace, ids, model));
});
test('batch checks aggregate shot capacity, not only each episode in isolation', () => {
  const { workspace } = fixture();
  for (let i = 0; i < 6; i++) { const episode = createEpisode(); episode.shots = Array.from({ length: 300 }, () => createShot()); workspace.episodes.push(episode); }
  workspace.episodes[2].shots.splice(0, 2);
  const extra = createEpisode(); extra.shots = Array.from({ length: 200 }, () => createShot()); workspace.episodes.push(extra);
  assert.throws(() => createStoryAiQueueBatch(workspace, [workspace.episodes[0].id, workspace.episodes[1].id], model, { count: 2 }));
});
test('reconstructed task uses whitelisted inputs and local-only project IDs', () => {
  const { jobs } = fixture(), task = storyAiQueueTask(jobs[0]);
  assert.ok(task.prompt.includes('灰衣')); assert.ok(!task.prompt.includes('person-one')); assert.ok(!task.prompt.includes('PRIVATE_IMAGE_ID'));
});
test('changed source or selected setting blocks dispatch', () => {
  const { workspace, jobs } = fixture(); assert.doesNotThrow(() => assertStoryAiQueueSource(workspace, jobs[0]));
  workspace.characters[0].description = '红衣'; assert.throws(() => assertStoryAiQueueSource(workspace, jobs[0]));
});
test('pending snapshots are held, and in-flight snapshots become uncertain', () => {
  const { jobs } = fixture(); jobs[1].status = 'running'; jobs[1].attempts = 1;
  const restored = parseStoryAiQueueSnapshot(serializeStoryAiQueue('owner', jobs), 'owner');
  assert.equal(restored[0].status, 'held'); assert.equal(restored[1].status, 'unknown');
});
test('wrong owner or schema is rejected without trusting file title', () => {
  const { jobs } = fixture(), raw = serializeStoryAiQueue('owner', jobs);
  assert.throws(() => parseStoryAiQueueSnapshot(raw, 'other'));
  const value = JSON.parse(raw); value.schemaVersion = 'wrong'; assert.throws(() => parseStoryAiQueueSnapshot(JSON.stringify(value), 'owner'));
});
test('duplicate IDs and malformed source plans fail snapshot import', () => {
  const { jobs } = fixture(), value = JSON.parse(serializeStoryAiQueue('owner', jobs));
  value.jobs[1].id = value.jobs[0].id; assert.throws(() => parseStoryAiQueueSnapshot(JSON.stringify(value), 'owner'));
  value.jobs.pop(); value.jobs[0].input.script = ''; assert.throws(() => parseStoryAiQueueSnapshot(JSON.stringify(value), 'owner'));
});
test('snapshot cannot inject API addresses, keys, system instructions or unsupported providers', () => {
  const { jobs } = fixture(); jobs[0].model.apiKey = 'SECRET_KEY'; jobs[0].model.apiUrl = 'https://invalid.test'; jobs[0].input.systemPrompt = 'BAD_SYSTEM_PROMPT';
  const raw = serializeStoryAiQueue('owner', jobs); assert.ok(!raw.includes('SECRET_KEY')); assert.ok(!raw.includes('invalid.test')); assert.ok(!raw.includes('BAD_SYSTEM_PROMPT'));
  const value = JSON.parse(raw); value.jobs[0].model.provider = 'other'; assert.throws(() => parseStoryAiQueueSnapshot(JSON.stringify(value), 'owner'));
});
test('invalid ready response becomes review-needed, not queued for a paid repair', () => {
  const { jobs } = fixture(); jobs[0].status = 'ready'; jobs[0].raw = 'not JSON';
  const restored = parseStoryAiQueueSnapshot(serializeStoryAiQueue('owner', jobs), 'owner'); assert.equal(restored[0].status, 'invalid');
});
test('applied marker survives restore but does not assert project persistence', () => {
  const { jobs } = fixture(); jobs[0].status = 'applied';
  assert.equal(parseStoryAiQueueSnapshot(serializeStoryAiQueue('owner', jobs), 'owner')[0].status, 'applied');
});
test('snapshot size and attempts are bounded', () => {
  assert.throws(() => parseStoryAiQueueSnapshot(' '.repeat(8 * 1024 * 1024 + 1), 'owner'));
  const { jobs } = fixture(); jobs[0].attempts = 4; assert.throws(() => serializeStoryAiQueue('owner', jobs));
});
