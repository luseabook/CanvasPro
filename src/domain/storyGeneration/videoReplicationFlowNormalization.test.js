import test from "node:test";
import assert from "node:assert/strict";

import { normalizeFlowSource } from "./videoReplicationFlowNormalization.js";

test("videoReplicationFlowNormalization: aligns near boundaries without mutating the source", () => {
  const source = {
    characters: [{ id: "c" }],
    shots: [
      {
        id: "s1",
        startSec: -0.2,
        endSec: 1,
        camera: null,
        sound: null,
        uncertainty: null,
      },
      { id: "s2", startSec: 1.2, endSec: 10.2 },
    ],
    speech: [
      { id: "v", startSec: -0.2, endSec: 10.2, parts: [{ uncertainty: null }] },
    ],
  };
  const result = normalizeFlowSource(source, 10);

  assert.deepEqual(source.shots[0], {
    id: "s1",
    startSec: -0.2,
    endSec: 1,
    camera: null,
    sound: null,
    uncertainty: null,
  });
  assert.deepEqual(result.source.characters, [{ id: "c", appearance: "" }]);
  assert.equal(result.source.shots[0].startSec, 0);
  assert.equal(result.source.shots[0].endSec, 1.2);
  assert.equal(result.source.shots[1].endSec, 10);
  assert.equal(result.source.shots[1].camera, "");
  assert.equal(result.source.speech[0].startSec, 0);
  assert.equal(result.source.speech[0].endSec, 10);
  assert.equal(result.source.speech[0].parts[0].speakerId, "");
});

test("videoReplicationFlowNormalization: groups adjustments into non-blocking notes", () => {
  const result = normalizeFlowSource(
    {
      shots: [{ id: "s", startSec: 0, endSec: 0.8 }],
      speech: [],
    },
    1,
  );

  assert.deepEqual(result.notes, [
    {
      code: "source-normalized",
      blocking: false,
      kind: "time-boundary",
      adjustments: [
        { id: "s", field: "endSec", from: 0.8, to: 1, kind: "time-boundary" },
      ],
      detail: "已自动对齐 1 处不超过 1 秒的时间偏差",
    },
    {
      code: "source-normalized",
      blocking: false,
      kind: "optional-field",
      adjustments: [
        {
          id: "s",
          field: "camera",
          from: null,
          to: "",
          kind: "optional-field",
        },
        { id: "s", field: "sound", from: null, to: "", kind: "optional-field" },
        {
          id: "s",
          field: "uncertainty",
          from: null,
          to: "",
          kind: "optional-field",
        },
      ],
      detail: "已补齐 3 个可选空字段",
    },
  ]);
});

test("videoReplicationFlowNormalization: leaves far boundary drift and complete fields untouched", () => {
  const result = normalizeFlowSource(
    {
      shots: [
        {
          id: "s",
          startSec: 0,
          endSec: 2,
          camera: "wide",
          sound: "wind",
          uncertainty: "none",
        },
      ],
    },
    8,
  );

  assert.equal(result.source.shots[0].endSec, 2);
  assert.deepEqual(result.notes, []);
  assert.equal(normalizeFlowSource(null, 10).source, null);
  assert.deepEqual(normalizeFlowSource({}, 10).notes, []);
});
