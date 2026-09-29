import test from "node:test";
import assert from "node:assert/strict";

import { formatStoryPromptShotHeading } from "./promptShotFormat.js";

test("promptShotFormat: uses the source time range for Seedance 2.5", () => {
  assert.equal(
    formatStoryPromptShotHeading({
      promptMode: "seedance-2.5",
      index: 2,
      durationSec: 2.34,
      timeRange: "4.2-6.5s",
    }),
    "4.2-6.5s",
  );
});

test("promptShotFormat: prefixes Wan 3 shot numbers to the time range", () => {
  assert.equal(
    formatStoryPromptShotHeading({
      promptMode: "wan-3.0",
      index: 1,
      durationSec: 2.34,
      timeRange: "2.1-4.4s",
    }),
    "镜头2 [2.1-4.4s]",
  );
});

test("promptShotFormat: uses duration headings outside continuous timeline modes", () => {
  assert.equal(
    formatStoryPromptShotHeading({
      promptMode: "seedance-2.0",
      index: 2,
      durationSec: 2.34,
      timeRange: "ignored",
    }),
    "分镜3 ⏱ 2.3s",
  );
  assert.equal(
    formatStoryPromptShotHeading({
      promptMode: "unknown",
      index: 0,
      durationSec: 5,
      timeRange: "ignored",
    }),
    "分镜1 ⏱ 5.0s",
  );
});
