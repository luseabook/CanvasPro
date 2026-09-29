import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SEGMENT_RETAKE_MIN_DURATION_SECONDS,
  SEGMENT_RETAKE_MAX_DURATION_SECONDS,
  normalizeSegmentRetakeRange,
  normalizeSegmentRetakeSmartSegments,
  isSegmentRetakeAnnotationInRange,
  resolveSegmentRetakeInputDirection,
  calcSegmentRetakeInputStart,
  shouldDeleteManagedRetakeInputNode,
  getOrphanedSegmentRetakeAnnotationIds,
  getSegmentRetakeValidation,
  buildSegmentRetakePromptText,
  buildSegmentRetakePromptTime,
} from './segmentRetakeSession.js';

test('the retake window constants stay at four and thirty seconds', () => {
  assert.equal(SEGMENT_RETAKE_MIN_DURATION_SECONDS, 4);
  assert.equal(SEGMENT_RETAKE_MAX_DURATION_SECONDS, 30);
});

test('normalizeSegmentRetakeRange honours a sub-0.2s minimum duration', () => {
  assert.deepEqual(normalizeSegmentRetakeRange({ startSec: 2, endSec: 2.15 }, 10, { minDurationSec: 0.15 }), {
    startSec: 2,
    endSec: 2.15,
    durationSec: 0.15,
  });
});

test('normalizeSegmentRetakeRange yields an empty window for an empty clip', () => {
  assert.deepEqual(normalizeSegmentRetakeRange({}, 0), { startSec: 0, endSec: 0, durationSec: 0 });
  assert.deepEqual(normalizeSegmentRetakeRange({}, -5), { startSec: 0, endSec: 0, durationSec: 0 });
  assert.deepEqual(normalizeSegmentRetakeRange({}, Number.NaN), {
    startSec: 0,
    endSec: 0,
    durationSec: 0,
  });
});

test('normalizeSegmentRetakeRange defaults the end to the whole clip', () => {
  assert.deepEqual(normalizeSegmentRetakeRange({}, 10), { startSec: 0, endSec: 10, durationSec: 10 });
});

test('normalizeSegmentRetakeRange keeps a well-formed range untouched', () => {
  assert.deepEqual(normalizeSegmentRetakeRange({ startSec: 2, endSec: 8 }, 10), {
    startSec: 2,
    endSec: 8,
    durationSec: 6,
  });
});

test('normalizeSegmentRetakeRange clamps the end to the clip length', () => {
  assert.deepEqual(normalizeSegmentRetakeRange({ startSec: 0, endSec: 20 }, 10), {
    startSec: 0,
    endSec: 10,
    durationSec: 10,
  });
});

test('normalizeSegmentRetakeRange truncates a range longer than the maximum', () => {
  assert.deepEqual(normalizeSegmentRetakeRange({ startSec: 0, endSec: 50 }, 60), {
    startSec: 0,
    endSec: 30,
    durationSec: 30,
  });
});

test('normalizeSegmentRetakeRange grows a range shorter than the minimum', () => {
  assert.deepEqual(normalizeSegmentRetakeRange({ startSec: 10, endSec: 12 }, 60), {
    startSec: 10,
    endSec: 14,
    durationSec: 4,
  });
});

test('normalizeSegmentRetakeRange backs a short range off the clip end', () => {
  assert.deepEqual(normalizeSegmentRetakeRange({ startSec: 9, endSec: 9.5 }, 10), {
    startSec: 6,
    endSec: 10,
    durationSec: 4,
  });
});

test('normalizeSegmentRetakeRange honours custom bounds', () => {
  assert.deepEqual(
    normalizeSegmentRetakeRange({ startSec: 0, endSec: 10 }, 60, {
      minDurationSec: 20,
      maxDurationSec: 25,
    }),
    { startSec: 0, endSec: 20, durationSec: 20 },
  );
});

test('normalizeSegmentRetakeRange snaps a start past the clip end back inside', () => {
  assert.deepEqual(normalizeSegmentRetakeRange({ startSec: 99 }, 10), {
    startSec: 6,
    endSec: 10,
    durationSec: 4,
  });
  assert.deepEqual(normalizeSegmentRetakeRange({ startSec: -3 }, 10), {
    startSec: 0,
    endSec: 10,
    durationSec: 10,
  });
});

test('normalizeSegmentRetakeRange rounds every value to the millisecond', () => {
  assert.deepEqual(normalizeSegmentRetakeRange({ startSec: 0.1234567 }, 10), {
    startSec: 0.123,
    endSec: 10,
    durationSec: 9.877,
  });
});

test('normalizeSegmentRetakeSmartSegments returns nothing for an empty clip', () => {
  assert.deepEqual(normalizeSegmentRetakeSmartSegments([], 0), []);
  assert.deepEqual(normalizeSegmentRetakeSmartSegments(null, -1), []);
});

test('normalizeSegmentRetakeSmartSegments falls back to the first window when nothing is given', () => {
  assert.deepEqual(normalizeSegmentRetakeSmartSegments([], 60), [
    { startSec: 0, endSec: 30, durationSec: 30 },
  ]);
  assert.deepEqual(normalizeSegmentRetakeSmartSegments([{ start: 5, end: 3 }], 60), [
    { startSec: 0, endSec: 30, durationSec: 30 },
  ]);
});

test('normalizeSegmentRetakeSmartSegments keeps a single short segment', () => {
  assert.deepEqual(normalizeSegmentRetakeSmartSegments([{ start: 0, end: 10 }], 60), [
    { startSec: 0, endSec: 10, durationSec: 10 },
  ]);
});

test('normalizeSegmentRetakeSmartSegments chops a long span into maximum-length windows', () => {
  assert.deepEqual(normalizeSegmentRetakeSmartSegments([{ start: 0, end: 100 }], 100), [
    { startSec: 0, endSec: 30, durationSec: 30 },
    { startSec: 30, endSec: 60, durationSec: 30 },
    { startSec: 60, endSec: 90, durationSec: 30 },
    { startSec: 90, endSec: 100, durationSec: 10 },
  ]);
});

test('normalizeSegmentRetakeSmartSegments repairs a stub window after chunking', () => {
  assert.deepEqual(normalizeSegmentRetakeSmartSegments([{ start: 0, end: 32 }], 100), [
    { startSec: 0, endSec: 30, durationSec: 30 },
    { startSec: 30, endSec: 34, durationSec: 4 },
  ]);
});

test('normalizeSegmentRetakeSmartSegments merges a segment that is too small', () => {
  assert.deepEqual(
    normalizeSegmentRetakeSmartSegments(
      [
        { start: 0, end: 10 },
        { start: 12, end: 13 },
      ],
      100,
    ),
    [{ startSec: 0, endSec: 13, durationSec: 13 }],
  );
  assert.deepEqual(
    normalizeSegmentRetakeSmartSegments(
      [
        { start: 0, end: 3 },
        { start: 5, end: 20 },
      ],
      100,
    ),
    [{ startSec: 0, endSec: 20, durationSec: 20 }],
  );
});

test('normalizeSegmentRetakeSmartSegments keeps separate segments apart and ordered', () => {
  assert.deepEqual(
    normalizeSegmentRetakeSmartSegments(
      [
        { start: 20, end: 25 },
        { start: 0, end: 10 },
      ],
      100,
    ),
    [
      { startSec: 0, endSec: 10, durationSec: 10 },
      { startSec: 20, endSec: 25, durationSec: 5 },
    ],
  );
});

test('normalizeSegmentRetakeSmartSegments clamps and drops degenerate raw segments', () => {
  assert.deepEqual(normalizeSegmentRetakeSmartSegments([{ start: -5, end: 200 }], 100), [
    { startSec: 0, endSec: 30, durationSec: 30 },
    { startSec: 30, endSec: 60, durationSec: 30 },
    { startSec: 60, endSec: 90, durationSec: 30 },
    { startSec: 90, endSec: 100, durationSec: 10 },
  ]);
});

test('isSegmentRetakeAnnotationInRange includes both edges of the window', () => {
  assert.equal(isSegmentRetakeAnnotationInRange({ timeSec: 5 }, { startSec: 0, endSec: 10 }), true);
  assert.equal(isSegmentRetakeAnnotationInRange({ timeSec: 10 }, { startSec: 0, endSec: 10 }), true);
  assert.equal(isSegmentRetakeAnnotationInRange({ timeSec: 0 }, { startSec: 0, endSec: 10 }), true);
  assert.equal(isSegmentRetakeAnnotationInRange({ timeSec: 10.0001 }, { startSec: 0, endSec: 10 }), false);
});

test('isSegmentRetakeAnnotationInRange rejects a missing timestamp', () => {
  assert.equal(isSegmentRetakeAnnotationInRange({}, { startSec: 0, endSec: 10 }), false);
  assert.equal(isSegmentRetakeAnnotationInRange({ timeSec: 5 }, null), false);
  assert.equal(isSegmentRetakeAnnotationInRange({ timeSec: -0.5 }, { startSec: -1, endSec: 0 }), true);
});

test('resolveSegmentRetakeInputDirection only accepts the downward direction', () => {
  assert.equal(resolveSegmentRetakeInputDirection('down'), 'down');
  assert.equal(resolveSegmentRetakeInputDirection('left'), 'left');
  assert.equal(resolveSegmentRetakeInputDirection('right'), 'left');
  assert.equal(resolveSegmentRetakeInputDirection('DOWN'), 'left');
  assert.equal(resolveSegmentRetakeInputDirection(undefined), 'left');
  assert.equal(resolveSegmentRetakeInputDirection(''), 'left');
});

test('calcSegmentRetakeInputStart defaults to a left-side item', () => {
  assert.deepEqual(calcSegmentRetakeInputStart(), { x: -420, y: 0, direction: 'left' });
});

test('calcSegmentRetakeInputStart stacks items below the target when heading down', () => {
  assert.deepEqual(
    calcSegmentRetakeInputStart({
      targetNode: { x: 100, y: 200, height: 50 },
      itemWidth: 200,
      itemHeight: 150,
      spacing: 20,
      index: 2,
      direction: 'down',
    }),
    { x: 100, y: 610, direction: 'down' },
  );
});

test('calcSegmentRetakeInputStart clamps its numeric options', () => {
  assert.deepEqual(
    calcSegmentRetakeInputStart({
      itemWidth: 0,
      itemHeight: -10,
      spacing: -5,
      index: -3,
      direction: 'left',
    }),
    { x: -1, y: 0, direction: 'left' },
  );
  assert.deepEqual(calcSegmentRetakeInputStart({ itemWidth: 100, itemHeight: 50, spacing: 10, index: 2.9 }), {
    x: -110,
    y: 120,
    direction: 'left',
  });
});

test('shouldDeleteManagedRetakeInputNode only flags managed nodes left without a consumer', () => {
  const node = { id: 'n1', segmentRetakeManaged: true };
  assert.equal(shouldDeleteManagedRetakeInputNode({ node, edges: [{ sourceId: 'n1', id: 'e1' }] }), false);
  assert.equal(
    shouldDeleteManagedRetakeInputNode({ node, ownerEdgeId: 'e1', edges: [{ sourceId: 'n1', id: 'e1' }] }),
    true,
  );
  assert.equal(shouldDeleteManagedRetakeInputNode({ node, edges: [] }), true);
  assert.equal(shouldDeleteManagedRetakeInputNode({ node, edges: [{ sourceId: 'other', id: 'e1' }] }), true);
  assert.equal(shouldDeleteManagedRetakeInputNode({ node: { id: 'n1' }, edges: [] }), false);
});

test('shouldDeleteManagedRetakeInputNode needs an id and tolerates missing edges', () => {
  const managed = { segmentRetakeManaged: true };
  assert.equal(shouldDeleteManagedRetakeInputNode({ node: managed, edges: [] }), false);
  assert.equal(shouldDeleteManagedRetakeInputNode({ node: managed, nodeId: '  ', edges: [] }), false);
  assert.equal(shouldDeleteManagedRetakeInputNode({ node: managed, nodeId: 'n1' }), true);
  assert.equal(
    shouldDeleteManagedRetakeInputNode({
      node: managed,
      nodeId: 'x',
      edges: [{ sourceId: 'n1', id: 'e1' }],
    }),
    true,
  );
});

test('getOrphanedSegmentRetakeAnnotationIds lists annotations missing a node or edge', () => {
  const session = {
    annotations: [
      { id: 'a', nodeId: 'n1', edgeId: 'e1' },
      { id: 'b', nodeId: 'n2', edgeId: 'e1' },
      { id: 'c', nodeId: 'n1', edgeId: 'e2' },
    ],
  };
  assert.deepEqual(getOrphanedSegmentRetakeAnnotationIds({ session, nodes: { n1: {} }, edges: { e1: {} } }), [
    'b',
    'c',
  ]);
});

test('getOrphanedSegmentRetakeAnnotationIds tolerates empty input and missing ids', () => {
  assert.deepEqual(getOrphanedSegmentRetakeAnnotationIds({}), []);
  assert.deepEqual(getOrphanedSegmentRetakeAnnotationIds({ session: { annotations: null } }), []);
  assert.deepEqual(
    getOrphanedSegmentRetakeAnnotationIds({
      session: { annotations: [{ nodeId: 'n1', edgeId: 'e1' }] },
      nodes: {},
      edges: {},
    }),
    [],
  );
});

test('getSegmentRetakeValidation enforces both duration bounds', () => {
  assert.deepEqual(getSegmentRetakeValidation(), { ok: false, reason: 'range-too-short' });
  assert.deepEqual(getSegmentRetakeValidation({ range: { startSec: 0, endSec: 2 } }), {
    ok: false,
    reason: 'range-too-short',
  });
  assert.deepEqual(getSegmentRetakeValidation({ range: { startSec: 0, endSec: 40 } }), {
    ok: false,
    reason: 'range-too-long',
  });
  assert.deepEqual(getSegmentRetakeValidation({ range: { startSec: 0, endSec: 4 } }), {
    ok: true,
    reason: '',
  });
  assert.deepEqual(getSegmentRetakeValidation({ range: { startSec: 0, endSec: 30 } }), {
    ok: true,
    reason: '',
  });
});

test('getSegmentRetakeValidation reports annotations outside the window', () => {
  assert.deepEqual(
    getSegmentRetakeValidation({
      range: { startSec: 0, endSec: 10 },
      annotations: [{ id: 'a', timeSec: 20 }],
    }),
    { ok: false, reason: 'annotation-outside-range', invalidAnnotationIds: ['a'] },
  );
  assert.deepEqual(
    getSegmentRetakeValidation({
      range: { startSec: 0, endSec: 10 },
      annotations: [
        { id: 'a', timeSec: 5 },
        { id: 'b', timeSec: -1 },
      ],
    }),
    { ok: false, reason: 'annotation-outside-range', invalidAnnotationIds: ['b'] },
  );
  assert.deepEqual(
    getSegmentRetakeValidation({
      range: { startSec: 0, endSec: 10 },
      annotations: [{ id: 'a', timeSec: 5 }],
    }),
    { ok: true, reason: '' },
  );
});

test('buildSegmentRetakePromptText prefixes only non-empty text', () => {
  assert.equal(buildSegmentRetakePromptText('hello'), '：hello');
  assert.equal(buildSegmentRetakePromptText('  hi  '), '：hi');
  assert.equal(buildSegmentRetakePromptText(''), '');
  assert.equal(buildSegmentRetakePromptText(null), '');
  assert.equal(buildSegmentRetakePromptText(0), '');
  assert.equal(buildSegmentRetakePromptText(5), '：5');
});

test('buildSegmentRetakePromptTime formats minute and second cues', () => {
  assert.equal(buildSegmentRetakePromptTime(0), '00:00.00');
  assert.equal(buildSegmentRetakePromptTime(5), '00:05.00');
  assert.equal(buildSegmentRetakePromptTime(65), '01:05.00');
  assert.equal(buildSegmentRetakePromptTime(3599), '59:59.00');
  assert.equal(buildSegmentRetakePromptTime(3600), '60:00.00');
  assert.equal(buildSegmentRetakePromptTime(3661.5), '61:01.50');
  assert.equal(buildSegmentRetakePromptTime(-12), '00:00.00');
  assert.equal(buildSegmentRetakePromptTime('abc'), '00:00.00');
});
