import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyFlowRepair,
  applyFlowRepairIndividually,
  classifyFlowReview,
  createFlowReviewWindows,
  flowEvidenceWindows,
  inspectFlowSpeech,
  mapFlowReviewTimes,
  validateFlowSource,
} from './videoReplicationFlowContract.js';

function character(id = 'c1') {
  return {
    id,
    name: 'Alice',
    appearance: 'red coat',
  };
}

function shot(overrides = {}) {
  return {
    id: 'shot-1',
    startSec: 0,
    endSec: 5,
    visual: 'Alice stands',
    camera: 'wide shot',
    sound: 'ambient room tone',
    uncertainty: '',
    characterIds: ['c1'],
    ...overrides,
  };
}

function speech(overrides = {}) {
  return {
    id: 'speech-1',
    startSec: 1,
    endSec: 2,
    parts: [
      {
        speakerId: '',
        kind: 'voiceover',
        text: 'hello',
        uncertainty: '',
      },
    ],
    ...overrides,
  };
}

function source(overrides = {}) {
  return {
    title: 'source',
    videoObserved: true,
    characters: [character()],
    shots: [shot()],
    speech: [],
    ...overrides,
  };
}

test('videoReplicationFlowContract: speech implied by a shot must overlap speech evidence', () => {
  assert.deepEqual(
    inspectFlowSpeech(
      source({
        shots: [shot({ sound: '旁白：hello' })],
      }),
    ),
    ['shot-1'],
  );
  assert.deepEqual(
    inspectFlowSpeech(
      source({
        shots: [shot({ sound: '旁白：hello' })],
        speech: [speech()],
      }),
    ),
    [],
  );
});

test('videoReplicationFlowContract: validation normalizes optional fields and rejects broken references', () => {
  const notes = [];
  const normalized = validateFlowSource(
    source({
      shots: [
        {
          ...shot(),
          camera: undefined,
        },
      ],
    }),
    5,
    notes,
  );

  assert.equal(normalized.shots[0].camera, '');
  assert.equal(notes.length, 1);
  assert.equal(notes[0].code, 'source-normalized');
  assert.throws(
    () =>
      validateFlowSource(
        source({
          shots: [shot({ characterIds: ['missing'] })],
        }),
        5,
      ),
    /人物引用无效/u,
  );
});

test('videoReplicationFlowContract: review classification separates blockers from notes', () => {
  const base = source();
  const result = classifyFlowReview(
    base,
    {
      videoObserved: true,
      checkedSpeechIds: [],
      checkedShotIds: ['shot-1'],
      hasMoreIssues: false,
      issues: [
        {
          id: 'issue-blocking',
          sourceIds: ['shot-1'],
          startSec: 0,
          endSec: 1,
          evidence: 'visible',
          confidence: 'high',
          category: 'plot',
        },
        {
          id: 'issue-wording',
          sourceIds: ['shot-1'],
          startSec: 1,
          endSec: 2,
          evidence: 'visible',
          confidence: 'high',
          category: 'minor_wording',
        },
        {
          id: 'issue-uncertain',
          sourceIds: ['shot-1'],
          startSec: 2,
          endSec: 3,
          evidence: 'uncertain',
          confidence: 'uncertain',
          category: 'plot',
        },
      ],
    },
    5,
  );

  assert.deepEqual(
    result.actionable.map((issue) => issue.id),
    ['issue-blocking'],
  );
  assert.equal(
    result.notes.filter((note) => note.code === 'review-note').length,
    2,
  );
});

test('videoReplicationFlowContract: reel review times map into source windows and merge evidence', () => {
  const notes = [];
  const mapped = mapFlowReviewTimes(
    {
      timeBasis: 'reel',
      issues: [
        {
          id: 'issue-1',
          sourceIds: ['shot-1'],
          startSec: 1,
          endSec: 3,
          evidence: 'visible',
          confidence: 'high',
          category: 'plot',
        },
        {
          id: 'issue-outside',
          sourceIds: ['shot-1'],
          startSec: 30,
          endSec: 31,
          evidence: 'visible',
          confidence: 'high',
          category: 'plot',
        },
      ],
    },
    [
      {
        shotId: 'shot-1',
        sourceStartSec: 10,
        sourceEndSec: 20,
        reelStartSec: 0,
        reelEndSec: 10,
      },
    ],
    notes,
  );

  assert.deepEqual(
    mapped.issues.map(({ id, startSec, endSec }) => ({ id, startSec, endSec })),
    [{ id: 'issue-1', startSec: 11, endSec: 13 }],
  );
  assert.equal(notes.length, 1);
  assert.equal(notes[0].code, 'review-issue-skipped');

  assert.deepEqual(
    flowEvidenceWindows(
      source({
        shots: [
          shot({ id: 'shot-1', startSec: 0, endSec: 5 }),
          shot({ id: 'shot-2', startSec: 5, endSec: 10 }),
        ],
        speech: [
          speech({ id: 'speech-1', startSec: 2, endSec: 4 }),
          speech({ id: 'speech-2', startSec: 7, endSec: 8 }),
        ],
      }),
      [
        {
          id: 'issue-1',
          sourceIds: ['shot-1'],
          startSec: 1,
          endSec: 3,
        },
        {
          id: 'issue-2',
          sourceIds: ['speech-2'],
          startSec: 7,
          endSec: 8,
        },
      ],
      10,
    ),
    [
      {
        sourceStartSec: 0,
        sourceEndSec: 9,
        reelStartSec: 0,
        reelEndSec: 9,
      },
    ],
  );
});

test('videoReplicationFlowContract: review windows group distant evidence into separate scopes', () => {
  const windows = createFlowReviewWindows(
    source({
      shots: [
        shot({ id: 'shot-1', startSec: 0, endSec: 5 }),
        shot({ id: 'shot-2', startSec: 55, endSec: 60 }),
      ],
      speech: [
        speech({ id: 'speech-1', startSec: 2, endSec: 4 }),
        speech({ id: 'speech-2', startSec: 56, endSec: 57 }),
      ],
    }),
    60,
    30,
  );

  assert.equal(windows.length, 2);
  assert.deepEqual(
    windows[0].scope.shots.map((entry) => entry.id),
    ['shot-1'],
  );
  assert.deepEqual(
    windows[1].scope.shots.map((entry) => entry.id),
    ['shot-2'],
  );
});

test('videoReplicationFlowContract: repairs must cover every issue and validate the result', () => {
  const base = source();
  const issues = [
    {
      id: 'issue-1',
      sourceIds: ['shot-1'],
      startSec: 0,
      endSec: 1,
      evidence: 'visible',
      confidence: 'high',
      category: 'plot',
    },
  ];
  const repaired = applyFlowRepair(
    base,
    issues,
    {
      speechPatches: [],
      shotPatches: [
        {
          id: 'shot-1',
          visual: 'updated',
          camera: 'wide shot',
          sound: 'ambient room tone',
          characterIds: ['c1'],
          uncertainty: '',
        },
      ],
      characterPatches: [],
      addedSpeech: [],
      issueResults: [
        {
          issueId: 'issue-1',
          status: 'repaired',
          reason: 'updated',
        },
      ],
    },
    5,
  );

  assert.equal(repaired.shots[0].visual, 'updated');
  assert.throws(
    () =>
      applyFlowRepair(
        base,
        issues,
        {
          speechPatches: [],
          shotPatches: [],
          characterPatches: [],
          addedSpeech: [],
          issueResults: [],
        },
        [],
      ),
    /未逐项回应审查问题/u,
  );
});

test('videoReplicationFlowContract: individual repair rejects only the invalid patch', () => {
  const base = source({
    shots: [
      shot({ id: 'shot-1', startSec: 0, endSec: 5 }),
      shot({ id: 'shot-2', startSec: 5, endSec: 10 }),
    ],
  });
  const issues = [
    {
      id: 'issue-1',
      sourceIds: ['shot-1'],
      startSec: 0,
      endSec: 1,
      evidence: 'visible',
      confidence: 'high',
      category: 'plot',
    },
    {
      id: 'issue-2',
      sourceIds: ['shot-2'],
      startSec: 5,
      endSec: 6,
      evidence: 'visible',
      confidence: 'high',
      category: 'plot',
    },
  ];
  const result = applyFlowRepairIndividually(
    base,
    issues,
    {
      speechPatches: [],
      shotPatches: [
        {
          id: 'shot-1',
          visual: 'updated',
          camera: 'wide shot',
          sound: 'ambient room tone',
          characterIds: ['c1'],
          uncertainty: '',
        },
        {
          id: 'shot-2',
          visual: 'invalid',
          camera: 'wide shot',
          sound: 'ambient room tone',
          characterIds: ['missing'],
          uncertainty: '',
        },
      ],
      characterPatches: [],
      addedSpeech: [],
      issueResults: [
        { issueId: 'issue-1', status: 'repaired', reason: 'updated' },
        { issueId: 'issue-2', status: 'repaired', reason: 'updated' },
      ],
    },
    10,
  );

  assert.equal(result.candidate.shots[0].visual, 'updated');
  assert.equal(result.candidate.shots[1].visual, 'Alice stands');
  assert.deepEqual(result.rejected, [
    {
      field: 'shotPatches',
      ids: ['shot-2'],
      detail: '镜头人物引用无效：shot-2',
    },
  ]);
});
