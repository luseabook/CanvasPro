import test from "node:test";
import assert from "node:assert/strict";

import { sliceFlowSpeech } from "./videoReplicationFlowSpeech.js";

test("videoReplicationFlowSpeech: slices ASR words exactly by start time", () => {
  const block = {
    id: "a",
    startSec: 0,
    endSec: 4,
    parts: [
      {
        text: "甲乙丙丁",
        timingSource: "asr",
        words: [
          { text: "甲", startSec: 0, endSec: 1 },
          { text: "乙", startSec: 1, endSec: 2 },
          { text: "丙", startSec: 2, endSec: 3 },
          { text: "丁", startSec: 3, endSec: 4 },
        ],
      },
    ],
  };

  assert.deepEqual(sliceFlowSpeech(block, 1, 3), {
    sourceId: "a",
    startSec: 1,
    endSec: 3,
    estimated: false,
    parts: [
      {
        text: "乙丙",
        timingSource: "asr",
        words: [
          { text: "乙", startSec: 1, endSec: 2 },
          { text: "丙", startSec: 2, endSec: 3 },
        ],
        startSec: 1,
        endSec: 3,
      },
    ],
  });
});

test("videoReplicationFlowSpeech: estimates character slices near punctuation boundaries", () => {
  const block = {
    id: "s",
    startSec: 0,
    endSec: 10,
    parts: [{ text: "你好，世界！再见" }],
  };

  assert.deepEqual(sliceFlowSpeech(block, 2.5, 7.5), {
    sourceId: "s",
    startSec: 2.5,
    endSec: 7.5,
    estimated: true,
    parts: [{ text: "，世界！" }],
  });
});

test("videoReplicationFlowSpeech: clamps reported time while preserving requested estimates", () => {
  const block = {
    id: "s",
    startSec: 2,
    endSec: 8,
    parts: [{ text: "abcdef" }],
  };
  const result = sliceFlowSpeech(block, 3, 9);

  assert.equal(result.startSec, 3);
  assert.equal(result.endSec, 8);
  assert.equal(result.estimated, true);
  assert.equal(result.parts[0].text, "bcdef");
});
