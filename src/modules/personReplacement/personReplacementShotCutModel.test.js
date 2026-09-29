import test from 'node:test';
import assert from 'node:assert/strict';
import * as model from './personReplacementShotCutModel.js';
import {
  PERSON_REPLACEMENT_CUT_BASE_VIEWPORT_WIDTH_PX,
  PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
  PERSON_REPLACEMENT_CUT_EPSILON_SEC,
  PERSON_REPLACEMENT_CUT_MIN_SEC,
  buildPersonReplacementDetectedShotCutRanges,
  canMergePersonReplacementShotCutRanges,
  canSplitPersonReplacementShotCutRange,
  countEditablePersonReplacementShotCuts,
  createPersonReplacementShotCutDraft,
  createPersonReplacementShotCutUpdateRequest,
  doesPersonReplacementShotCutDraftReplaceTimeline,
  getPersonReplacementShotCutDisplayDuration,
  getPersonReplacementShotCutFrameSec,
  getPersonReplacementShotCutPositionAtTimelineSec,
  getPersonReplacementShotCutTimelineSec,
  getPersonReplacementShotCutTotalDuration,
  getPersonReplacementShotDurationSec,
  hasPersonReplacementShotCutUpdateChanges,
  mergePersonReplacementShotCutRanges,
  movePersonReplacementShotCutBoundary,
  normalizePersonReplacementShotCutRanges,
  splitPersonReplacementShotCutAtTimelineSec,
} from './personReplacementShotCutModel.js';

const FRAME_24 = 1 / 24;
const cut = (over = {}) => ({
  shotId: 'a',
  sourceId: 's1',
  startSec: 0,
  endSec: 10,
  durationSec: 10,
  outputFps: 24,
  ...over,
});
const pair = () => [
  { shotId: 'a', sourceId: 's1', startSec: 0, endSec: 10, durationSec: 10, outputFps: 24 },
  { shotId: 'b', sourceId: 's1', startSec: 10, endSec: 20, durationSec: 10, outputFps: 24 },
];

test('shotCutModel: 导出面 22 项且常量取值固化', () => {
  assert.equal(Object.keys(model).length, 22);
  assert.equal(PERSON_REPLACEMENT_CUT_DEFAULT_FPS, 24);
  assert.equal(PERSON_REPLACEMENT_CUT_BASE_VIEWPORT_WIDTH_PX, 960);
  assert.equal(PERSON_REPLACEMENT_CUT_MIN_SEC, 0.001);
  assert.equal(PERSON_REPLACEMENT_CUT_EPSILON_SEC, PERSON_REPLACEMENT_CUT_MIN_SEC);
});

test('shotCutModel: 时长/帧步长/总量/展示的回落与钳制', () => {
  const cases = [
    [{ durationSec: 5 }, 5],
    [{ durationSec: '7' }, 7],
    [{ durationSec: Infinity, startTimeSec: 2, endTimeSec: 5 }, 3],
    [{ durationSec: -1, startTimeSec: 2, endTimeSec: 2 }, 0.1],
    [{}, 0.1],
  ];
  for (const [input, expected] of cases) {
    assert.equal(getPersonReplacementShotDurationSec(input), expected, String(input));
  }
  assert.ok(getPersonReplacementShotDurationSec({ durationSec: -0 }) === 0.1);
  assert.equal(getPersonReplacementShotCutFrameSec({}, {}), FRAME_24);
  assert.equal(getPersonReplacementShotCutFrameSec({ outputFps: 60 }, { outputFps: 1 }), 1 / 60);
  assert.equal(getPersonReplacementShotCutFrameSec({ outputFps: 1e9 }), PERSON_REPLACEMENT_CUT_MIN_SEC);
  assert.equal(getPersonReplacementShotCutTotalDuration([{ durationSec: 2 }, { durationSec: 3 }]), 5);
  assert.equal(getPersonReplacementShotCutDisplayDuration([]), 5);
});

test('shotCutModel: countEditable 统计相邻同源对数（undefined 视为同源）', () => {
  assert.equal(countEditablePersonReplacementShotCuts(undefined), 0);
  assert.equal(
    countEditablePersonReplacementShotCuts([{ sourceId: 's1' }, { sourceId: 's1' }, { sourceId: 's1' }]),
    2,
  );
  assert.equal(
    countEditablePersonReplacementShotCuts([{ sourceId: 's1' }, { sourceId: 's2' }, { sourceId: 's1' }]),
    0,
  );
  assert.throws(() => countEditablePersonReplacementShotCuts('s1'), TypeError);
});

test('shotCutModel: canSplit 以帧长为界（含端点），非有限回落 false', () => {
  const r = { durationSec: 1, outputFps: 24 };
  assert.equal(canSplitPersonReplacementShotCutRange(r, 0.5), true);
  assert.equal(canSplitPersonReplacementShotCutRange(r, FRAME_24), true);
  assert.equal(canSplitPersonReplacementShotCutRange(r, 0), false);
  assert.equal(canSplitPersonReplacementShotCutRange(r, NaN), false);
});

test('shotCutModel: buildDetected 切分区间并为首段保留原始 id', () => {
  const out = buildPersonReplacementDetectedShotCutRanges({
    source: { id: 'src1' },
    shots: [{ id: 'a', sourceId: 'src1', startTimeSec: 0, endTimeSec: 10 }],
    shotBundles: [{ start: 0 }, { start: 4 }, { start: 8 }],
  });
  assert.equal(out.length, 3);
  assert.equal(out[0].shotId, 'a');
  assert.equal(out[0].endSec, 4);
  assert.equal(out[1].shotId, 'a:detected:4000');
  assert.equal(out[1].originShotId, 'a');
});

test('shotCutModel: buildDetected 缺源或无可用片段时抛错', () => {
  assert.throws(() =>
    buildPersonReplacementDetectedShotCutRanges({
      source: { id: '' },
      shots: [{ id: 'a', sourceId: 'src1' }],
    }),
  );
  assert.throws(() =>
    buildPersonReplacementDetectedShotCutRanges({
      source: { id: 'src1' },
      shots: [{ id: 'a', sourceId: 'other' }],
    }),
  );
});

test('shotCutModel: normalize 允许内部切口并保留 originShotId', () => {
  const shots = [{ id: 'a', sourceId: 's1', startTimeSec: 0, endTimeSec: 10 }];
  const out = normalizePersonReplacementShotCutRanges(shots, [
    { shotId: 'a', sourceId: 's1', startSec: 0, endSec: 5 },
    { shotId: 'b', originShotId: 'a', sourceId: 's1', startSec: 5, endSec: 10 },
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].endSec, 5);
  assert.equal(out[1].originShotId, 'a');
});

test('shotCutModel: normalize 拒绝改边界/断口/非法区间/覆盖不足', () => {
  const shots = [{ id: 'a', sourceId: 's1', startTimeSec: 0, endTimeSec: 10 }];
  assert.throws(() => normalizePersonReplacementShotCutRanges(shots, [cut({ startSec: 1 })]), /起点/);
  assert.throws(() => normalizePersonReplacementShotCutRanges(shots, [cut({ endSec: 9 })]), /终点/);
  assert.throws(() => normalizePersonReplacementShotCutRanges(shots, [cut({ endSec: 0 })]), /无效/);
  assert.throws(() => normalizePersonReplacementShotCutRanges(shots, [cut({ sourceId: 'x' })]), /无效/);
  assert.throws(() => normalizePersonReplacementShotCutRanges(shots, []), /覆盖/);
  assert.equal(
    normalizePersonReplacementShotCutRanges(
      [
        { id: 'a', sourceId: 's1', startTimeSec: 0, endTimeSec: 10 },
        { id: 'b', sourceId: 's2', startTimeSec: 0, endTimeSec: 3 },
      ],
      [cut()],
      { allowTimelineReplacement: true },
    ).length,
    1,
  );
});

test('shotCutModel: canMerge 要求相邻同源同翻转且切口相接', () => {
  const ranges = [...pair(), { shotId: 'c', sourceId: 's2', startSec: 20, endSec: 22, durationSec: 2 }];
  assert.equal(canMergePersonReplacementShotCutRanges(ranges, ['a', 'b']), true);
  assert.equal(canMergePersonReplacementShotCutRanges(ranges, ['b', 'a']), true);
  assert.equal(canMergePersonReplacementShotCutRanges(ranges, ['b', 'c']), false);
  assert.equal(
    canMergePersonReplacementShotCutRanges(
      [cut({ endSec: 4 }), cut({ shotId: 'b', startSec: 5, endSec: 10, durationSec: 5 })],
      ['a', 'b'],
    ),
    false,
  );
});

test('shotCutModel: merge 生成合并 id、挑关键帧并重排 index', () => {
  const ranges = [
    {
      shotId: 'a',
      sourceId: 's1',
      startSec: 0,
      endSec: 5,
      durationSec: 5,
      outputFps: 24,
      keyframeRef: 'kL',
      keyframeTimeSec: 2,
    },
    {
      shotId: 'b',
      sourceId: 's1',
      startSec: 5,
      endSec: 10,
      durationSec: 5,
      outputFps: 24,
      keyframeRef: 'kR',
      keyframeTimeSec: 6,
    },
    { shotId: 'c', sourceId: 's1', startSec: 10, endSec: 12, durationSec: 2, outputFps: 24 },
  ];
  const merged = mergePersonReplacementShotCutRanges(ranges, ['a', 'b']);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].shotId, 'a:merge:0-10000');
  assert.equal(merged[0].originShotId, 'a');
  assert.equal(merged[0].keyframeRef, 'kL');
  assert.equal(merged[1].shotId, 'c');
  assert.equal(
    mergePersonReplacementShotCutRanges(ranges, ['a', 'b'], { preferredShotId: 'b' })[0].keyframeRef,
    'kR',
  );
});

test('shotCutModel: split 按时间轴切分、定关键帧归属并防重复切口', () => {
  const base = cut();
  const out = splitPersonReplacementShotCutAtTimelineSec([{ ...base }], 5);
  assert.equal(out.length, 2);
  assert.equal(out[0].endSec, 5);
  assert.equal(out[1].shotId, 'a:split:5000');
  assert.equal(out[1].originShotId, 'a');
  assert.equal(
    splitPersonReplacementShotCutAtTimelineSec([{ ...base, keyframeRef: 'k', keyframeTimeSec: 3 }], 5)[0]
      .keyframeRef,
    'k',
  );
  assert.equal(
    splitPersonReplacementShotCutAtTimelineSec([{ ...base, keyframeRef: 'k', keyframeTimeSec: 7 }], 5)[1]
      .keyframeRef,
    'k',
  );
  const src = [{ ...base }];
  assert.equal(splitPersonReplacementShotCutAtTimelineSec(src, 0), src);
});

test('shotCutModel: 时间轴定位与源时间反查（含反向片段）', () => {
  const ranges = pair();
  const mid = getPersonReplacementShotCutPositionAtTimelineSec(ranges, 5);
  assert.equal(mid.shotId, 'a');
  const far = getPersonReplacementShotCutPositionAtTimelineSec(ranges, 999);
  assert.equal(far.timelineSec, 20);
  assert.equal(getPersonReplacementShotCutPositionAtTimelineSec([], 5).shotIndex, -1);
  assert.equal(getPersonReplacementShotCutTimelineSec(ranges, 'zz', 5), 0);
  assert.equal(getPersonReplacementShotCutTimelineSec(ranges, 'a', 5), 5);
  assert.equal(getPersonReplacementShotCutTimelineSec(ranges, 'b', 13), 13);
  assert.equal(getPersonReplacementShotCutTimelineSec(ranges, 'b', 0), 10);
  const rev = [cut({ isReversed: true })];
  assert.equal(getPersonReplacementShotCutTimelineSec(rev, 'a', 0), 10);
  assert.ok(getPersonReplacementShotCutPositionAtTimelineSec(rev, 10).sourceTimeSec === 0);
});

test('shotCutModel: createDraft 修齐同源相邻切口并透传手动关键帧', () => {
  const draft = createPersonReplacementShotCutDraft({
    shots: [
      { id: 'a', sourceId: 's1', startTimeSec: 0, endTimeSec: 10 },
      { id: 'b', sourceId: 's1', startTimeSec: 9, endTimeSec: 20 },
    ],
  });
  assert.equal(draft[0].endSec, 9);
  assert.equal(draft[1].startSec, 9);
  const kf = createPersonReplacementShotCutDraft({
    shots: [
      {
        id: 'a',
        sourceId: 's1',
        startTimeSec: 0,
        endTimeSec: 10,
        keyframeRef: 'k',
        keyframeTimeSec: 3,
        keyframeManuallySelected: true,
      },
    ],
  });
  assert.equal(kf[0].keyframeRef, 'k');
  assert.equal(kf[0].keyframeManuallySelected, true);
});

test('shotCutModel: moveBoundary 仅移动同源相邻切口并按帧对齐', () => {
  const moved = movePersonReplacementShotCutBoundary(pair(), 1, 12);
  assert.equal(moved[0].endSec, 12);
  assert.equal(moved[1].startSec, 12);
  assert.deepEqual(movePersonReplacementShotCutBoundary(pair(), 0, 5), pair());
});

test('shotCutModel: doesReplaceTimeline 与 createUpdateRequest 投影', () => {
  assert.equal(
    doesPersonReplacementShotCutDraftReplaceTimeline(
      [{ id: 'a' }, { id: 'b' }],
      [{ shotId: 'a' }, { shotId: 'b' }],
    ),
    false,
  );
  assert.equal(
    doesPersonReplacementShotCutDraftReplaceTimeline(
      [{ id: 'a' }, { id: 'b' }],
      [{ shotId: 'x', originShotId: 'a' }],
    ),
    true,
  );
  const req = createPersonReplacementShotCutUpdateRequest([{ id: 'a' }], [cut()], ' a ');
  assert.equal(req.selectedShotId, 'a');
  assert.deepEqual(req.ranges[0], { shotId: 'a', sourceId: 's1', startSec: 0, endSec: 10 });
  const reqKf = createPersonReplacementShotCutUpdateRequest(
    [{ id: 'a' }],
    [cut({ keyframeRef: 'k', keyframeTimeSec: 3 })],
    '',
  );
  assert.equal(reqKf.ranges[0].keyframeRef, 'k');
});

test('shotCutModel: hasChanges 归一化比对起止/翻转/关键帧', () => {
  const shots = [{ id: 'a', sourceId: 's1', startTimeSec: 0, endTimeSec: 10 }];
  assert.equal(
    hasPersonReplacementShotCutUpdateChanges(shots, [{ shotId: 'a', startSec: 0, endSec: 10 }]),
    false,
  );
  assert.equal(
    hasPersonReplacementShotCutUpdateChanges(shots, [{ shotId: 'a', startSec: 0, endSec: 10.002 }]),
    true,
  );
  assert.equal(
    hasPersonReplacementShotCutUpdateChanges(shots, [
      { shotId: 'a:split:5000', originShotId: 'a', startSec: 0, endSec: 10 },
    ]),
    true,
  );
  assert.equal(
    hasPersonReplacementShotCutUpdateChanges(
      [{ id: 'a', startTimeSec: 0, endTimeSec: 10, keyframeRef: 'k', keyframeTimeSec: 2 }],
      [{ shotId: 'a', startSec: 0, endSec: 10, keyframeRef: 'k', keyframeTimeSec: 3 }],
    ),
    true,
  );
});
