import test from "node:test";
import assert from "node:assert/strict";

import {
  findReplicationSpeechBlock,
  groupContinuousReplicationVoiceover,
} from "./videoReplicationSpeechLayout.js";

const blocks = [
  { id: "a", startSec: 0, endSec: 4 },
  { id: "b", startSec: 4, endSec: 7 },
  { id: "c", startSec: 7, endSec: 10 },
];

test("videoReplicationSpeechLayout: finds the containing block with the final block as fallback", () => {
  assert.equal(findReplicationSpeechBlock(blocks, 0, Math.round), 0);
  assert.equal(findReplicationSpeechBlock(blocks, 3.9, Math.round), 1);
  assert.equal(findReplicationSpeechBlock(blocks, 4, Math.round), 1);
  assert.equal(findReplicationSpeechBlock(blocks, 6.9, Math.round), 2);
  assert.equal(findReplicationSpeechBlock(blocks, 20, Math.round), 2);
  assert.equal(findReplicationSpeechBlock(blocks, -1, Math.round), 2);
  assert.equal(findReplicationSpeechBlock([], 0, Math.round), -1);
});

test("videoReplicationSpeechLayout: preserves sub-second distinction within a shared rounded bucket", () => {
  const twoBlocks = [
    { startSec: 3.6, endSec: 4.4 },
    { startSec: 4.4, endSec: 5 },
  ];

  assert.equal(
    findReplicationSpeechBlock(twoBlocks, 3.7, Math.round, 0, 3.8),
    0,
  );
});

test("videoReplicationSpeechLayout: merges only adjacent continuous matching voiceover", () => {
  const first = {
    id: "a",
    startSec: 0,
    endSec: 2,
    parts: [{ kind: "voiceover", speakerId: "s", text: "甲" }],
  };
  const second = {
    id: "b",
    startSec: 2,
    endSec: 4,
    parts: [{ kind: "voiceover", speakerId: "s", text: "乙" }],
  };
  const third = {
    id: "c",
    startSec: 4,
    endSec: 6,
    parts: [{ kind: "voiceover", speakerId: "other", text: "丙" }],
  };

  assert.deepEqual(
    groupContinuousReplicationVoiceover(
      [first, second, third],
      [first, second, third],
      Math.round,
      (part) => part.speakerId,
    ),
    [
      {
        id: "a",
        startSec: 0,
        endSec: 4,
        parts: [{ kind: "voiceover", speakerId: "s", text: "甲乙" }],
      },
      third,
    ],
  );
});

test("videoReplicationSpeechLayout: does not merge through gaps or non-adjacent ordering", () => {
  const first = {
    id: "a",
    startSec: 0,
    endSec: 2,
    parts: [{ kind: "voiceover", speakerId: "s", text: "甲" }],
  };
  const gapped = {
    id: "b",
    startSec: 3,
    endSec: 4,
    parts: [{ kind: "voiceover", speakerId: "s", text: "乙" }],
  };

  assert.deepEqual(
    groupContinuousReplicationVoiceover(
      [first, gapped],
      [first, { id: "other" }, gapped],
      Math.round,
      (part) => part.speakerId,
    ),
    [first, gapped],
  );
});
