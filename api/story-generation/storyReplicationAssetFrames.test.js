import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addReplicationAssetFrameContract,
  addReplicationAssetFrameSchema,
  attachReplicationAssetFrames,
} from './storyReplicationAssetFrames.js';

const SOURCES = [
  {
    episodeId: 'v1',
    durationSec: 30,
    events: [
      { id: 'e1', startSec: 0, endSec: 10 },
      { id: 'e2', startSec: 10, endSec: 40 },
    ],
  },
];
const CONTEXT = { replicationFrameSources: SOURCES };

function makeResult(overrides = {}) {
  return {
    assets: [
      { ref: 'c1', kind: 'character', name: '张三', sourceChapterIds: ['v1'] },
      { ref: 's1', kind: 'scene', name: '客厅', sourceChapterIds: ['v1'], ...overrides },
    ],
  };
}

function responseWith(sourceFrame, extra = []) {
  return JSON.stringify({ assets: [{ ref: 's1', kind: 'scene', sourceFrame }, ...extra] });
}

test('contract and schema are untouched without frame sources', () => {
  const prompt = { requirements: [] };
  const schema = { properties: {} };
  assert.equal(addReplicationAssetFrameContract(prompt, {}), prompt);
  assert.deepEqual(prompt, { requirements: [] });
  assert.equal(addReplicationAssetFrameSchema(schema, { replicationFrameSources: [] }), schema);
  assert.deepEqual(schema, { properties: {} });
});

test('the prompt contract gains source videos, a requirement and an output template', () => {
  const prompt = { requirements: ['r0'], outputSchema: { assets: [{ ref: 'x' }] } };
  const result = addReplicationAssetFrameContract(prompt, CONTEXT);
  assert.equal(result, prompt);
  assert.equal(prompt.sourceVideos, SOURCES);
  assert.equal(prompt.requirements.length, 2);
  assert.ok(prompt.requirements[1].startsWith('每个场景、道具必须返回 sourceFrame'));
  assert.deepEqual(prompt.outputSchema.assets[0].sourceFrame, {
    episodeId: '来源视频 id',
    eventId: '出场事件 id',
    timeSec: '代表画面的绝对秒数；无法确定返回 null',
  });
  const bare = addReplicationAssetFrameContract({ requirements: [] }, CONTEXT);
  assert.equal('outputSchema' in bare, false);
});

test('the response schema requires a nullable sourceFrame object', () => {
  const schema = { properties: { assets: { items: { required: ['ref'], properties: {} } } } };
  addReplicationAssetFrameSchema(schema, CONTEXT);
  const items = schema.properties.assets.items;
  assert.deepEqual(items.required, ['ref', 'sourceFrame']);
  assert.deepEqual(items.properties.sourceFrame.anyOf[0], { type: 'null' });
  assert.deepEqual(items.properties.sourceFrame.anyOf[1].required, ['episodeId', 'eventId', 'timeSec']);
  assert.equal(items.properties.sourceFrame.anyOf[1].additionalProperties, false);
});

test('attach is a no-op without frame sources', () => {
  const result = makeResult();
  assert.equal(attachReplicationAssetFrames(result, 'not json', {}), result);
  assert.equal('replicationSource' in result.assets[1], false);
});

test('a valid frame is attached to scenes and props only', () => {
  const result = makeResult();
  attachReplicationAssetFrames(result, responseWith({ episodeId: 'v1', eventId: 'e1', timeSec: 0 }), CONTEXT);
  assert.equal('replicationSource' in result.assets[0], false);
  assert.deepEqual(result.assets[1].replicationSource, {
    name: '客厅',
    ref: 's1',
    episodeId: 'v1',
    eventId: 'e1',
    representativeTimeSec: 0,
  });
});

test('a null frame records a frame error instead of failing', () => {
  const result = makeResult();
  attachReplicationAssetFrames(result, { text: responseWith(null) }, CONTEXT);
  assert.deepEqual(result.assets[1].replicationSource, {
    name: '客厅',
    ref: 's1',
    frameError: '未能确定原片出场画面',
  });
});

test('missing or ambiguous frames abort extraction', () => {
  const message = '场景或道具缺少原片代表画面信息，请重新提取素材。';
  assert.throws(() => attachReplicationAssetFrames(makeResult(), JSON.stringify({ assets: [] }), CONTEXT), {
    message,
  });
  assert.throws(
    () =>
      attachReplicationAssetFrames(
        makeResult(),
        JSON.stringify({ assets: [{ ref: 's1', kind: 'prop', sourceFrame: null }] }),
        CONTEXT,
      ),
    { message },
  );
  const frame = { episodeId: 'v1', eventId: 'e1', timeSec: 1 };
  assert.throws(
    () =>
      attachReplicationAssetFrames(
        makeResult(),
        responseWith(frame, [{ ref: 's1', kind: 'scene', sourceFrame: frame }]),
        CONTEXT,
      ),
    { message },
  );
});

test('frames outside the source video or event window are rejected', () => {
  const message = '场景或道具的原片代表时间不属于其来源视频或出场片段，请重新提取素材。';
  const cases = [
    [{ episodeId: 'v9', eventId: 'e1', timeSec: 1 }, {}],
    [{ episodeId: 'v1', eventId: 'e9', timeSec: 1 }, {}],
    [{ episodeId: 'v1', eventId: 'e1', timeSec: '1' }, {}],
    [{ episodeId: 'v1', eventId: 'e1', timeSec: 10 }, {}],
    [{ episodeId: 'v1', eventId: 'e2', timeSec: 30 }, {}],
    [{ episodeId: 'v1', eventId: 'e1', timeSec: 1 }, { sourceChapterIds: ['v2'] }],
  ];
  for (const [frame, overrides] of cases) {
    assert.throws(() => attachReplicationAssetFrames(makeResult(overrides), responseWith(frame), CONTEXT), {
      message,
    });
  }
});
