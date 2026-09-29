import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeStoryboard3DSubjectBounds,
  deduplicateStoryboard3DShotCandidates,
  estimateStoryboard3DOcclusion,
  evaluateStoryboard3DFraming,
  generateStoryboard3DShotCandidates,
  identifyStoryboard3DSubjects,
  scoreStoryboard3DShotCandidate,
  selectDiverseStoryboard3DShotCandidates,
} from './shotExploration.js';

function character(id, position) {
  return {
    id,
    type: 'character',
    name: id,
    visible: true,
    transform: { position, rotation: [0, 0, 0], scale: [1, 1, 1] },
    dimensions: [0.65, 1.8, 0.5],
  };
}

test('shotExploration: identifies subjects and merges their bounds', () => {
  const scene = {
    objects: [
      character('hero', [0, 0, 0]),
      character('partner', [2, 0, 0]),
      { id: 'light', type: 'light', visible: true, transform: { position: [0, 5, 0] } },
      { id: 'hidden', type: 'character', visible: false, transform: { position: [5, 0, 0] } },
    ],
  };

  const subjects = identifyStoryboard3DSubjects(scene);
  assert.deepEqual(subjects.map((subject) => subject.id), ['hero', 'partner']);
  assert.deepEqual(
    identifyStoryboard3DSubjects(scene, { subjectIds: ['partner'] }).map((subject) => subject.id),
    ['partner'],
  );

  const bounds = computeStoryboard3DSubjectBounds(scene);
  assert.deepEqual(bounds.subjectIds, ['hero', 'partner']);
  assert.ok(bounds.size[0] > 2);
  assert.ok(bounds.size[1] > 1.7);
});

test('shotExploration: evaluates framing and estimates occlusion', () => {
  const emptyFraming = evaluateStoryboard3DFraming({}, null);
  assert.equal(emptyFraming.outOfFrameRatio, 1);
  assert.equal(emptyFraming.projectedBounds, null);

  const bounds = {
    min: [-0.5, 0, -0.25],
    max: [0.5, 2, 0.25],
    center: [0, 1, 0],
    size: [1, 2, 0.5],
  };
  const framing = evaluateStoryboard3DFraming(
    {
      position: [0, 1, 5],
      target: [0, 1, 0],
      focalLength: 35,
      near: 0.1,
      far: 1000,
      aspectRatio: '16:9',
    },
    bounds,
  );
  assert.ok(framing.outOfFrameRatio >= 0 && framing.outOfFrameRatio <= 1);
  assert.ok(framing.projectedBounds.minY < framing.projectedBounds.maxY);
  assert.ok(Number.isFinite(framing.headroom));
  assert.ok(Number.isFinite(framing.centerOffset));

  const subjects = [
    { id: 'hero', bounds },
    {
      id: 'occluder',
      bounds: {
        min: [-0.5, 0, 2],
        max: [0.5, 2, 3],
        center: [0, 1, 2.5],
        size: [1, 2, 1],
      },
    },
  ];
  const occlusion = estimateStoryboard3DOcclusion(
    { position: [0, 1, 5] },
    subjects,
    subjects,
  );
  assert.equal(occlusion, 0.5);
  assert.equal(estimateStoryboard3DOcclusion({ position: [0, 0, 0] }, [], []), 1);
});

test('shotExploration: scores, deduplicates, and selects diverse candidates', () => {
  const framing = {
    outOfFrameRatio: 0,
    headroom: 0.12,
    centerOffset: 0,
    projectedBounds: { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5 },
  };
  const scored = scoreStoryboard3DShotCandidate(
    {
      camera: {
        position: [0, 1, 5],
        target: [0, 1, 0],
        focalLength: 35,
      },
      subjectBounds: {},
    },
    { framing, occlusionRatio: 0 },
  );
  assert.equal(scored.score, 1);
  assert.ok(scored.reasons.includes('subjects-in-frame'));
  assert.ok(scored.reasons.includes('low-occlusion'));

  const candidates = [
    {
      id: 'a',
      score: 0.9,
      shotSize: 'MED',
      camera: { position: [0, 1, 5], target: [0, 1, 0], focalLength: 35 },
    },
    {
      id: 'b',
      score: 0.8,
      shotSize: 'MED',
      camera: { position: [0, 1, 5], target: [0, 1, 0], focalLength: 35 },
    },
    {
      id: 'c',
      score: 0.7,
      shotSize: 'CU',
      camera: { position: [0, 1, 2], target: [0, 1, 0], focalLength: 85 },
    },
  ];
  const deduplicated = deduplicateStoryboard3DShotCandidates(candidates);
  assert.deepEqual(deduplicated.map((candidate) => candidate.id), ['a', 'c']);
  assert.deepEqual(
    selectDiverseStoryboard3DShotCandidates(candidates, 2).map((candidate) => candidate.id),
    ['a', 'c'],
  );
});

test('shotExploration: generates bounded candidates for scene subjects', () => {
  const scene = {
    objects: [
      character('hero', [0, 0, 0]),
      character('partner', [1, 0, 0]),
    ],
  };
  const candidates = generateStoryboard3DShotCandidates(scene, {
    count: 4,
    shotSizes: ['MED', 'MCU'],
  });

  assert.equal(candidates.length, 4);
  assert.ok(candidates.every((candidate) => candidate.subjectIds.length === 2));
  assert.ok(candidates.every((candidate) => candidate.score >= 0 && candidate.score <= 1));
  assert.ok(candidates.every((candidate) => candidate.camera.aspectRatio === '16:9'));

  const twoSubjects = generateStoryboard3DShotCandidates(scene, {
    count: 3,
    subjectIds: ['partner'],
  });
  assert.ok(twoSubjects.every((candidate) => candidate.subjectIds.length === 1));
  assert.deepEqual(generateStoryboard3DShotCandidates({ objects: [] }), []);
});
