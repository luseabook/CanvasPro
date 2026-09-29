import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyReplicationSegmentPlan,
  buildReplicationSegmentPlan,
  getReplicationSegmentPlanGuidance,
  inspectReplicationSegmentTiming,
  inspectReplicationShotGranularity,
} from './videoReplicationSegmentPlan.js';

function event(id, startSec, endSec, text) {
  return {
    id,
    startSec,
    endSec,
    dialogue: [{ speakerId: 'c1', kind: 'dialogue', text, uncertainty: '' }],
    voiceover: [],
  };
}

test('videoReplicationSegmentPlan: segments at planned limits and observed shot boundaries', () => {
  const plan = buildReplicationSegmentPlan(
    {
      events: [
        event('event-1', 0, 3, '第一句'),
        event('event-2', 3, 6, '第二句'),
      ],
    },
    { durationSec: 6, maxSeconds: 4 },
  );

  assert.deepEqual(
    plan.map(({ ref, sourceStartSec, sourceEndSec, durationSec }) => ({
      ref,
      sourceStartSec,
      sourceEndSec,
      durationSec,
    })),
    [
      {
        ref: 'clip-1',
        sourceStartSec: 0,
        sourceEndSec: 3,
        durationSec: 3,
      },
      {
        ref: 'clip-2',
        sourceStartSec: 3,
        sourceEndSec: 6,
        durationSec: 3,
      },
    ],
  );
  assert.equal(plan[0].events[0].dialogue[0].text, '第一句');
  assert.equal(plan[1].events[0].dialogue[0].text, '第二句');
  assert.throws(
    () => buildReplicationSegmentPlan({ events: [] }, { durationSec: 6, maxSeconds: 4 }),
    /缺少可分段的时间证据/u,
  );
});

test('videoReplicationSegmentPlan: guidance is optional and reports the fixed plan size', () => {
  assert.equal(getReplicationSegmentPlanGuidance({}), '');
  const guidance = getReplicationSegmentPlanGuidance({
    replication: { segmentPlan: [{ ref: 'clip-1' }, { ref: 'clip-2' }] },
  });

  assert.match(guidance, /程序已确定 2 个片段/u);
  assert.match(guidance, /timingEstimated/u);
  assert.match(guidance, /speechOrder/u);
});

test('videoReplicationSegmentPlan: granularity inspection reports internal and collapsed cuts', () => {
  const internal = inspectReplicationShotGranularity({
    clips: [
      {
        ref: 'clip-1',
        shots: [
          {
            durationSec: 3,
            visual: '人物先站在门口，随后切至近景',
            camera: '固定镜头',
            dialogue: '',
          },
        ],
      },
    ],
  });
  assert.deepEqual(
    internal.map(({ clipRef, shotIndex, code }) => ({ clipRef, shotIndex, code })),
    [
      {
        clipRef: 'clip-1',
        shotIndex: 0,
        code: 'replication_shot_internal_cut',
      },
    ],
  );

  const collapsed = inspectReplicationShotGranularity({
    clips: [
      {
        ref: 'clip-1',
        shots: [
          {
            durationSec: 16,
            visual: '两人站在窗边',
            camera: '正反打切换',
            dialogue: '甲：第一句\n乙：第二句\n甲：第三句',
          },
        ],
      },
    ],
  });
  assert.deepEqual(
    collapsed.map(({ code, message }) => ({ code, hasMessage: Boolean(message) })),
    [{ code: 'replication_shot_collapsed', hasMessage: true }],
  );
});

test('videoReplicationSegmentPlan: applying a plan enforces clip count and restores source timing', () => {
  const result = applyReplicationSegmentPlan(
    {
      clips: [
        {
          ref: 'model-clip',
          shots: [{ durationSec: 2 }, { durationSec: 2 }],
          replicationContentType: 'model-value',
        },
      ],
    },
    {
      replication: {
        segmentPlan: [
          {
            ref: 'clip-1',
            sourceStartSec: 4,
            sourceEndSec: 8,
            durationSec: 4,
            events: [{ id: 'event-1' }],
          },
        ],
        sourceAnalysis: {
          contentType: 'story',
          characters: [{ id: 'c1' }],
        },
      },
    },
  );

  assert.equal(result.clips.length, 1);
  assert.equal(result.clips[0].ref, 'clip-1');
  assert.equal(result.clips[0].durationSec, 4);
  assert.equal(result.clips[0].sourceStartSec, 4);
  assert.equal(result.clips[0].sourceEndSec, 8);
  assert.equal(result.clips[0].replicationContentType, 'story');
  assert.deepEqual(result.clips[0].replicationCharacters, [{ id: 'c1' }]);
  assert.throws(
    () =>
      applyReplicationSegmentPlan(
        { clips: [] },
        { replication: { segmentPlan: [{ ref: 'clip-1' }] } },
      ),
    /模型返回 0 段/u,
  );
});

test('videoReplicationSegmentPlan: timing inspection rejects rewritten clip durations', () => {
  const issues = inspectReplicationSegmentTiming(
    {
      clips: [
        {
          ref: 'clip-1',
          shots: [{ durationSec: 2 }, { durationSec: 1 }],
        },
      ],
    },
    {
      replication: {
        segmentPlan: [
          {
            ref: 'clip-1',
            durationSec: 4,
          },
        ],
      },
    },
    3.5,
  );

  assert.equal(issues.length, 1);
  assert.equal(issues[0].clipRef, 'clip-1');
  assert.equal(issues[0].code, 'replication_duration_extreme');
  assert.match(issues[0].message, /模型上限 3.5 秒/u);
});
