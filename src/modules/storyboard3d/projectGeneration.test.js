import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORYBOARD_3D_GENERATION_SCHEMA_VERSION,
  STORYBOARD_3D_PROMPT_MAX_CHARACTERS,
  buildStoryboard3DGenerationPrompt,
  createStoryboard3DProjectFromGeneration,
  generateStoryboard3DProjectDraft,
  getStoryboard3DGenerationAssetFamilies,
  parseStoryboard3DGenerationResult,
} from './projectGeneration.js';

const ASSETS = [
  {
    id: 'table-medium-blue',
    familyId: 'table',
    name: 'Dining Table',
    category: 'furniture',
    tags: ['dining', 'desk', 'medium', 'blue', 'extra'],
    size: 'medium',
    colorKey: 'blue',
    spatial: {
      dimensions: { width: 2, height: 0.75, depth: 1 },
      roles: ['table', 'support'],
      supportHeight: 0.75,
    },
  },
  {
    id: 'chair-medium-blue',
    familyId: 'chair',
    name: 'Chair',
    category: 'furniture',
    tags: ['seat', 'dining'],
    size: 'medium',
    colorKey: 'blue',
    spatial: {
      dimensions: { width: 0.5, height: 0.9, depth: 0.5 },
      roles: ['seat'],
      seatHeight: 0.45,
    },
  },
];

function createSequenceIdFactory() {
  const counts = new Map();
  return (kind) => {
    const count = (counts.get(kind) || 0) + 1;
    counts.set(kind, count);
    return `${kind}-${count}`;
  };
}

function createValidGeneration() {
  return {
    projectName: 'Dining Scene',
    sceneName: 'Room',
    environmentType: 'indoor',
    backgroundColor: '#112233',
    layout: { kind: 'dining', participantCount: 2 },
    objects: [
      {
        kind: 'asset',
        name: 'Table',
        familyId: 'table',
        size: 'medium',
        color: 'blue',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      {
        kind: 'character',
        name: 'Alice',
        gender: 'female',
        position: [1, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      {
        kind: 'character',
        name: 'Bob',
        gender: 'male',
        position: [-1, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    ],
    shot: {
      name: 'Main',
      description: 'Two people at a table',
      shotSize: 'CU',
      shotAngle: 'high',
      camera: {
        position: [4, 3, 5],
        target: [0, 1, 0],
        focalLength: 50,
      },
    },
  };
}

test('projectGeneration: extracts bounded asset families and builds a bounded prompt', () => {
  const families = getStoryboard3DGenerationAssetFamilies([
    ...ASSETS,
    { familyId: 'table', category: 'duplicate' },
    { familyId: '', category: 'ignored' },
  ]);

  assert.equal(families.length, 2);
  assert.equal(families[0].familyId, 'table');
  assert.equal(families[0].tags.includes('medium'), false);
  assert.equal(families[0].tags.includes('blue'), false);
  assert.deepEqual(families[0].spatial.roles, ['table', 'support']);

  const prompt = 'x'.repeat(STORYBOARD_3D_PROMPT_MAX_CHARACTERS + 25);
  const payload = JSON.parse(
    buildStoryboard3DGenerationPrompt({
      prompt,
      assetFamilies: families,
      inputImageUrls: ['one.png', null, 'two.png'],
    }),
  );

  assert.equal(payload.schemaVersion, STORYBOARD_3D_GENERATION_SCHEMA_VERSION);
  assert.equal(payload.userPrompt.length, STORYBOARD_3D_PROMPT_MAX_CHARACTERS);
  assert.equal(payload.referenceImageCount, 2);
  assert.equal(payload.availableAssetFamilies[0][0], 'table');
  assert.equal(Array.isArray(payload.outputSchema.objects), true);
});

test('projectGeneration: strictly parses and normalizes generated projects', () => {
  const parsed = parseStoryboard3DGenerationResult(
    JSON.stringify({
      projectName: 'Project',
      sceneName: 'Scene',
      environmentType: 'invalid',
      objects: [
        {
          kind: 'asset',
          name: 'Table',
          familyId: 'table',
          size: 'large',
          color: 'red',
          position: [99, -1, 0],
        },
        {
          kind: 'asset',
          name: 'Missing',
          familyId: 'missing',
        },
        {
          kind: 'character',
          name: 'Alice',
          gender: 'female',
        },
        {
          kind: 'character',
          name: 'Bob',
          gender: 'male',
        },
      ],
      layout: { kind: 'generic', participantCount: 2 },
      shot: {
        name: '',
        shotSize: 'invalid',
        shotAngle: 'invalid',
        camera: {
          position: [100, 0, 0],
          target: [0, 100, 0],
          focalLength: 999,
        },
      },
    }),
    { assetFamilies: getStoryboard3DGenerationAssetFamilies(ASSETS) },
  );

  assert.equal(parsed.environmentType, 'empty');
  assert.equal(parsed.objects.length, 3);
  assert.equal(parsed.objects[0].familyId, 'table');
  assert.equal(parsed.objects[0].size, 'large');
  assert.equal(parsed.objects[0].color, 'red');
  assert.deepEqual(parsed.objects[0].position, [20, 0, 0]);
  assert.equal(parsed.objects[1].kind, 'character');
  assert.equal(parsed.objects[1].gender, 'female');
  assert.equal(parsed.objects[2].kind, 'character');
  assert.equal(parsed.objects[2].gender, 'male');
  assert.deepEqual(parsed.layout, { kind: 'dining', participantCount: 2 });
  assert.equal(parsed.shot.shotSize, 'MED');
  assert.equal(parsed.shot.shotAngle, 'eye');
  assert.deepEqual(parsed.shot.camera.position, [50, 0.1, 0]);
  assert.deepEqual(parsed.shot.camera.target, [0, 20, 0]);
  assert.equal(parsed.shot.camera.focalLength, 120);

  assert.throws(() => parseStoryboard3DGenerationResult('not json'), /JSON/u);
  assert.throws(() => parseStoryboard3DGenerationResult({}), /Agent/u);
});

test('projectGeneration: creates a dining project from generated data', () => {
  const generation = createValidGeneration();
  const project = createStoryboard3DProjectFromGeneration(generation, {
    now: 100,
    idFactory: createSequenceIdFactory(),
    projectId: 'project-a',
    assets: ASSETS,
  });
  const scene = project.scenes[0];
  const shot = scene.shots[0];

  assert.equal(project.id, 'project-a');
  assert.equal(project.name, 'Dining Scene');
  assert.equal(scene.name, 'Room');
  assert.equal(scene.environment.type, 'indoor');
  assert.equal(scene.environment.backgroundColor, '#112233');
  assert.equal(shot.name, 'Main');
  assert.equal(shot.shotSize, 'CU');
  assert.equal(shot.shotAngle, 'high');
  assert.equal(shot.camera.focalLength, 50);
  assert.equal(shot.animation.cameraKeyframes[0].camera.focalLength, 50);
  assert.ok(scene.objects.some((object) => object.assetId === 'table-medium-blue'));
  assert.ok(scene.objects.filter((object) => object.type === 'character').length >= 2);
  assert.ok(scene.objects.filter((object) => object.assetId === 'chair-medium-blue').length >= 2);
});

test('projectGeneration: retries one invalid response with a repair prompt', async () => {
  const requests = [];
  const stages = [];
  const draft = await generateStoryboard3DProjectDraft({
    prompt: 'A dining table for two people',
    model: 'text-model',
    provider: 'provider-a',
    assets: ASSETS,
    inputImageUrls: ['reference.png'],
    request: async (payload) => {
      requests.push(payload);
      return requests.length === 1
        ? { text: 'not json' }
        : { text: JSON.stringify(createValidGeneration()) };
    },
    onProgress: ({ stage }) => stages.push(stage),
    now: 200,
    idFactory: createSequenceIdFactory(),
    projectId: 'repair-project',
  });

  assert.equal(requests.length, 2);
  assert.match(requests[0].prompt, /create_storyboard_3d_project/u);
  assert.match(requests[1].prompt, /repair_invalid_storyboard_3d_project/u);
  assert.deepEqual(requests[0].inputImageUrls, ['reference.png']);
  assert.deepEqual(stages, ['planning', 'repairing', 'building']);
  assert.equal(draft.id, 'repair-project');
  assert.equal(draft.scenes[0].shots[0].shotSize, 'CU');
});
