import test from "node:test";
import assert from "node:assert/strict";

import {
  hasReplicationInternalCut,
  inspectReplicationSourceShotCoverage,
  normalizeReplicationObservedShots,
  REPLICATION_SHOT_GUIDANCE,
} from "./videoReplicationShotEvidence.js";

function sourceEvent(overrides = {}) {
  return {
    startSec: 0,
    endSec: 10,
    dialogue: [{ text: "first" }, { text: "second" }],
    voiceover: [{ text: "third" }],
    ...overrides,
  };
}

test("videoReplicationShotEvidence: detects explicit internal cuts without stripping bare cut verbs", () => {
  assert.equal(hasReplicationInternalCut(), false);
  assert.equal(hasReplicationInternalCut({ visual: "场景切换至室内" }), false);
  assert.equal(
    hasReplicationInternalCut({ visual: "画面切至近景，人物继续行走" }),
    false,
  );
  assert.equal(hasReplicationInternalCut({ visual: "镜头切至近景" }), true);
  assert.equal(hasReplicationInternalCut({ visual: "随后再切到窗外" }), true);
  assert.equal(
    hasReplicationInternalCut({ visual: "固定机位", camera: "正反打" }),
    true,
  );
  assert.equal(hasReplicationInternalCut({ visual: "连续调整构图" }), true);
});

test("videoReplicationShotEvidence: keeps guidance anchored to observable shot boundaries", () => {
  assert.match(REPLICATION_SHOT_GUIDANCE, /events\[\]\.shots/u);
  assert.match(REPLICATION_SHOT_GUIDANCE, /speechRefs/u);
  assert.match(REPLICATION_SHOT_GUIDANCE, /不机械均分秒数/u);
});

test("videoReplicationShotEvidence: normalizes observed shots and copies speech references", () => {
  const event = sourceEvent();
  const result = normalizeReplicationObservedShots(
    [
      {
        id: " shot-1 ",
        startSec: "0",
        endSec: "4",
        speechRefs: ["dialogue:0"],
        visual: " 室内 ",
        camera: " 固定 ",
        sceneKey: " room ",
        ignored: true,
      },
      {
        id: "shot-2",
        startSec: 4,
        endSec: 10,
        speechRefs: ["dialogue:1", "voiceover:0"],
        visual: "街头",
        camera: "推进",
      },
    ],
    event,
  );

  assert.deepEqual(result, [
    {
      id: "shot-1",
      startSec: 0,
      endSec: 4,
      sceneKey: "room",
      visual: "室内",
      camera: "固定",
      speechRefs: ["dialogue:0"],
    },
    {
      id: "shot-2",
      startSec: 4,
      endSec: 10,
      visual: "街头",
      camera: "推进",
      speechRefs: ["dialogue:1", "voiceover:0"],
    },
  ]);
  assert.equal(result === event, false);
});

test("videoReplicationShotEvidence: accepts null but rejects incomplete observed shot evidence", () => {
  assert.equal(
    normalizeReplicationObservedShots(null, sourceEvent()),
    undefined,
  );

  const invalidCases = [
    [[], /缺少可核对/u],
    [[{ id: "", startSec: 0, endSec: 1, speechRefs: [] }], /时间边界无效/u],
    [
      [
        { id: "a", startSec: 0, endSec: 4, speechRefs: [] },
        { id: "a", startSec: 4, endSec: 5, speechRefs: [] },
      ],
      /时间边界无效/u,
    ],
    [
      [
        { id: "a", startSec: 0, endSec: 4, speechRefs: [] },
        { id: "b", startSec: 3, endSec: 5, speechRefs: [] },
      ],
      /时间边界无效/u,
    ],
    [
      [{ id: "a", startSec: 0, endSec: 10, speechRefs: ["dialogue:9"] }],
      /人声引用无效/u,
    ],
    [[{ id: "a", startSec: 0, endSec: 10, speechRefs: [] }], /逐句人声未关联/u],
  ];

  for (const [shots, messagePattern] of invalidCases) {
    assert.throws(
      () => normalizeReplicationObservedShots(shots, sourceEvent()),
      (error) =>
        error.code === "SOURCE_ANALYSIS_REPAIRABLE" &&
        messagePattern.test(error.message),
    );
  }
});

test("videoReplicationShotEvidence: reports missing source shot coverage", () => {
  const issues = inspectReplicationSourceShotCoverage({
    clips: [
      {
        ref: "clip-a",
        sourceStartSec: 0,
        sourceEndSec: 10,
        shots: [{ durationSec: 10 }],
        replicationSpeechEvents: [
          {
            shots: [
              { startSec: 0, endSec: 4 },
              { startSec: 4, endSec: 10 },
            ],
          },
        ],
      },
    ],
  });

  assert.deepEqual(issues, [
    {
      clipRef: "clip-a",
      code: "replication_shot_coverage_missing",
      message:
        "本片段原片有 2 个可见镜头区间，生成结果仅 1 个 shot；需按切镜和人声对应关系补全镜头时间轴，不能把多个镜头写成一段摘要。",
    },
  ]);
});

test("videoReplicationShotEvidence: reports missing generated shot boundaries", () => {
  const issues = inspectReplicationSourceShotCoverage({
    clips: [
      {
        ref: "clip-a",
        sourceStartSec: 0,
        sourceEndSec: 10,
        shots: [{ durationSec: 6 }, { durationSec: 4 }],
        replicationSpeechEvents: [
          {
            shots: [
              { startSec: 0, endSec: 4 },
              { startSec: 4, endSec: 10 },
            ],
          },
        ],
      },
    ],
  });

  assert.deepEqual(issues, [
    {
      clipRef: "clip-a",
      code: "replication_shot_boundary_missing",
      message:
        "原片在本段约 4 秒的切镜缺少对应生成区间；镜头数足够不代表切点正确，不能机械均分或提前挤压画面。",
    },
  ]);
});

test("videoReplicationShotEvidence: accepts aligned boundaries and segment plan overrides", () => {
  assert.deepEqual(
    inspectReplicationSourceShotCoverage({
      clips: [
        {
          ref: "clip-a",
          sourceStartSec: 0,
          sourceEndSec: 10,
          shots: [{ durationSec: 5 }, { durationSec: 5 }],
          replicationSpeechEvents: [
            {
              shots: [
                { startSec: 0, endSec: 5 },
                { startSec: 5, endSec: 10 },
              ],
            },
          ],
        },
      ],
    }),
    [],
  );

  assert.deepEqual(
    inspectReplicationSourceShotCoverage(
      {
        clips: [
          {
            ref: "clip-a",
            sourceStartSec: 0,
            sourceEndSec: 10,
            shots: [{ durationSec: 3 }],
          },
        ],
      },
      {
        replication: {
          segmentPlan: [
            {
              ref: "clip-a",
              sourceStartSec: 2,
              sourceEndSec: 5,
              events: [{ shots: [{ startSec: 2, endSec: 5 }] }],
            },
          ],
        },
      },
    ),
    [],
  );
});

test("videoReplicationShotEvidence: ignores clips without finite source boundaries", () => {
  assert.deepEqual(inspectReplicationSourceShotCoverage(), []);
  assert.deepEqual(
    inspectReplicationSourceShotCoverage({
      clips: [
        {
          ref: "missing",
          sourceStartSec: undefined,
          sourceEndSec: 10,
          shots: [],
        },
      ],
    }),
    [],
  );
});
