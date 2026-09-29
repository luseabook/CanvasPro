import test from "node:test";
import assert from "node:assert/strict";

import {
  getVideoReplicationCharacterRoster,
  getVideoReplicationCharacterSummary,
  REPLICATION_CHARACTER_ROLES,
  REPLICATION_SUBJECT_TYPES,
} from "./videoReplicationCharacters.js";

test("videoReplicationCharacters: exposes stable role and subject labels", () => {
  assert.deepEqual(REPLICATION_CHARACTER_ROLES, {
    main: "主角",
    supporting: "配角",
    background: "背景人物",
    uncertain: "待确认",
  });
  assert.deepEqual(REPLICATION_SUBJECT_TYPES, {
    person: "人物",
    animal: "动物",
    uncertain: "待确认",
  });
});

test("videoReplicationCharacters: derives roster evidence and sorts by role then first appearance", () => {
  const source = {
    characters: [
      { id: "a" },
      { id: "b", role: "main", subjectType: "animal", identityNotes: "x" },
    ],
    events: [
      {
        startSec: 2,
        endSec: 4,
        characterIds: ["a"],
        dialogue: [{ speakerId: "a" }, { speakerId: "b" }],
      },
      {
        startSec: 5,
        endSec: 6,
        characterIds: ["b"],
        dialogue: [{ speakerId: "b" }],
      },
    ],
  };

  assert.deepEqual(getVideoReplicationCharacterRoster(source), [
    {
      id: "b",
      role: "main",
      subjectType: "animal",
      identityNotes: "x",
      eventCount: 1,
      firstSeenSec: 5,
      dialogueCount: 2,
    },
    {
      id: "a",
      role: "uncertain",
      subjectType: "uncertain",
      eventCount: 1,
      firstSeenSec: 2,
      dialogueCount: 1,
    },
  ]);
});

test("videoReplicationCharacters: summarizes observable character categories", () => {
  const summary = getVideoReplicationCharacterSummary({
    characters: [
      { id: "a", role: "main", subjectType: "person" },
      { id: "b", role: "supporting", subjectType: "person" },
      { id: "c", role: "background", subjectType: "animal" },
      { id: "d", role: "uncertain", subjectType: "person" },
      {
        id: "e",
        role: "supporting",
        subjectType: "animal",
        identityNotes: "needs review",
      },
    ],
    events: [],
  });

  assert.deepEqual(summary, {
    total: 5,
    people: 3,
    animals: 2,
    main: 1,
    uncertain: 2,
  });
});
