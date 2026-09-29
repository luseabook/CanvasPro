import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioVoiceSegmentEditSession } from './audioVoiceSegmentEditSession.js';

test('begin builds a trimmed operation with a unique id and normalized segment ids', () => {
  const session = createAudioVoiceSegmentEditSession();
  const op = session.begin({
    kind: ' detect ',
    sourceNodeId: ' node-a ',
    segmentId: ' seg-1 ',
    segmentIds: [' seg-2 ', '', 'seg-1'],
    payload: { x: 1 },
  });
  assert.equal(op.id, 1);
  assert.equal(op.key, 'detect\x1fnode-a\x1fseg-1');
  assert.equal(op.kind, 'detect');
  assert.equal(op.sourceNodeId, 'node-a');
  assert.equal(op.segmentId, 'seg-1');
  assert.deepEqual(op.segmentIds, ['seg-2', 'seg-1']);
  assert.deepEqual(op.payload, { x: 1 });
  assert.equal(op.invalidated, false);
  assert.equal(session.getActiveCount(), 1);
});

test('begin defaults the payload to null and keeps falsy payloads', () => {
  const session = createAudioVoiceSegmentEditSession();
  assert.equal(session.begin({ kind: 'k', sourceNodeId: 'n', segmentId: 'a' }).payload, null);
  assert.equal(session.begin({ kind: 'k', sourceNodeId: 'n', segmentId: 'b', payload: 0 }).payload, 0);
  assert.equal(session.begin({ kind: 'k', sourceNodeId: 'n', segmentId: 'c', payload: null }).payload, null);
});

test('begin rejects a duplicate operation key', () => {
  const session = createAudioVoiceSegmentEditSession();
  assert.ok(session.begin({ kind: 'k', sourceNodeId: 'n', segmentId: 'a' }));
  assert.equal(session.begin({ kind: 'k', sourceNodeId: 'n', segmentId: 'a' }), null);
  assert.equal(session.getActiveCount(), 1);
});

test('begin rejects an operation that overlaps an active segment on the same node', () => {
  const session = createAudioVoiceSegmentEditSession();
  const first = session.begin({ kind: 'convert', sourceNodeId: 'n', segmentIds: ['a', 'b'] });
  assert.ok(first);
  assert.equal(session.begin({ kind: 'translate', sourceNodeId: 'n', segmentId: 'b' }), null);
  assert.equal(session.getActiveCount(), 1);
  assert.ok(session.begin({ kind: 'translate', sourceNodeId: 'n', segmentId: 'c' }));
});

test('an "all" reservation overlaps any segment on the same node', () => {
  const session = createAudioVoiceSegmentEditSession();
  assert.ok(session.begin({ kind: 'bulk', sourceNodeId: 'n', segmentId: 'all' }));
  assert.equal(session.begin({ kind: 'one', sourceNodeId: 'n', segmentId: 'z' }), null);
  assert.ok(session.begin({ kind: 'one', sourceNodeId: 'other', segmentId: 'z' }));
});

test('the same segment on a different node never overlaps', () => {
  const session = createAudioVoiceSegmentEditSession();
  assert.ok(session.begin({ kind: 'k', sourceNodeId: 'n1', segmentId: 'a' }));
  assert.ok(session.begin({ kind: 'k', sourceNodeId: 'n2', segmentId: 'a' }));
  assert.equal(session.getActiveCount(), 2);
});

test('finish only accepts the live operation and frees its slot', () => {
  const session = createAudioVoiceSegmentEditSession();
  const op = session.begin({ kind: 'k', sourceNodeId: 'n', segmentId: 'a' });
  assert.equal(session.finish(null), false);
  assert.equal(session.finish({ ...op, invalidated: true }), false);
  assert.equal(session.finish(op), true);
  assert.equal(op.invalidated, true);
  assert.equal(session.getActiveCount(), 0);
  assert.equal(session.finish(op), false);
});

test('invalidateAll marks every operation and clears the registry', () => {
  const session = createAudioVoiceSegmentEditSession();
  const a = session.begin({ kind: 'k', sourceNodeId: 'n1', segmentId: 'a' });
  const b = session.begin({ kind: 'k', sourceNodeId: 'n2', segmentId: 'b' });
  session.invalidateAll();
  assert.equal(a.invalidated, true);
  assert.equal(b.invalidated, true);
  assert.equal(session.getActiveCount(), 0);
});

test('listActive filters by kind and source node', () => {
  const session = createAudioVoiceSegmentEditSession();
  session.begin({ kind: 'convert', sourceNodeId: 'n1', segmentId: 'a' });
  session.begin({ kind: 'translate', sourceNodeId: 'n1', segmentId: 'b' });
  session.begin({ kind: 'convert', sourceNodeId: 'n2', segmentId: 'c' });
  assert.equal(session.listActive().length, 3);
  assert.equal(session.listActive({ kind: 'convert' }).length, 2);
  assert.equal(session.listActive({ sourceNodeId: 'n1' }).length, 2);
  assert.equal(session.listActive({ kind: 'convert', sourceNodeId: 'n1' }).length, 1);
  assert.equal(session.listActive({ kind: 'missing' }).length, 0);
});

test('isCurrent validates identity, registry membership and node scope', () => {
  const session = createAudioVoiceSegmentEditSession();
  const op = session.begin({ kind: 'k', sourceNodeId: 'n', segmentId: 'a' });
  assert.equal(session.isCurrent(op), true);
  assert.equal(session.isCurrent(op, ' n '), true);
  assert.equal(session.isCurrent(op, 'other'), false);
  assert.equal(session.isCurrent({ ...op }), false);
  assert.equal(session.isCurrent(null), false);
});

test('isSegmentReserved reports exact and wildcard reservations on a node', () => {
  const session = createAudioVoiceSegmentEditSession();
  assert.equal(session.isSegmentReserved('n', 'a'), false);
  assert.equal(session.isSegmentReserved('', 'a'), false);
  assert.equal(session.isSegmentReserved('n', ''), false);
  const op = session.begin({ kind: 'k', sourceNodeId: 'n', segmentId: 'a' });
  assert.equal(session.isSegmentReserved(' n ', ' a '), true);
  assert.equal(session.isSegmentReserved('n', 'b'), false);
  assert.equal(session.isSegmentReserved('other', 'a'), false);
  session.finish(op);
  const wildcard = session.begin({ kind: 'k', sourceNodeId: 'n', segmentId: 'all' });
  assert.equal(session.isSegmentReserved('n', 'anything'), true);
  session.finish(wildcard);
  assert.equal(session.isSegmentReserved('n', 'anything'), false);
});

test('two operations with empty keys cannot both be active', () => {
  const session = createAudioVoiceSegmentEditSession();
  assert.ok(session.begin());
  assert.equal(session.begin(), null);
});
