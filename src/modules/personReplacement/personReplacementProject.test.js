import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
  PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
  PERSON_REPLACEMENT_SCHEMA_VERSION,
  canTransitionPersonReplacementProject,
  confirmPersonReplacementSourceCharacter,
  createPersonReplacementProject,
  formatPersonReplacementScopeLabel,
  getPersonReplacementActiveImageResult,
  getPersonReplacementBindingOccurrences,
  getPersonReplacementCrossRoleSourceCharacterIds,
  getPersonReplacementImageResults,
  getPersonReplacementVideoResults,
  isGeneratedPersonReplacementLabel,
  mergePersonReplacementSourceCharacters,
  normalizePersonReplacementAiAnalysis,
  normalizePersonReplacementOrientation,
  normalizePersonReplacementPerson,
  normalizePersonReplacementProject,
  normalizePersonReplacementScope,
  normalizePersonReplacementShot,
  normalizePersonReplacementVideoInputMode,
  resolvePersonReplacementImageResultRef,
  resolvePersonReplacementTargetCharacterId,
  resolvePersonReplacementVideoGenerationFps,
  resolvePersonReplacementVideoImageInput,
  resolvePersonReplacementVideoModelId,
  resolvePersonReplacementVideoParameterPolicy,
  resolvePersonReplacementVideoResultRef,
  setPersonReplacementCharacterMapping,
  splitPersonReplacementSourceCharacter,
  transitionPersonReplacementProject,
} from './personReplacementProject.js';

const image = (name = 'a.png') => `output/${name}`;
const video = (name = 'a.mp4') => `output/${name}`;

test('personReplacementProject: schema and default model constants are stable', () => {
  assert.equal(PERSON_REPLACEMENT_SCHEMA_VERSION, 7);
  assert.equal(PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID, 'apimart/gpt-image-2');
  assert.match(PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID, /^runninghub\//);
  assert.equal(normalizePersonReplacementScope('feet'), 'feet');
  assert.equal(normalizePersonReplacementScope('unknown'), 'full-person');
  assert.equal(formatPersonReplacementScopeLabel('feet'), '脚部');
  assert.equal(isGeneratedPersonReplacementLabel('人物A'), true);
  assert.equal(isGeneratedPersonReplacementLabel('Alice'), false);
});

test('personReplacementProject: video model, mode, fps, and parameter policies normalize', () => {
  const videoModel = resolvePersonReplacementVideoModelId(PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID);
  assert.equal(videoModel, PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID);
  assert.equal(resolvePersonReplacementVideoModelId('unknown'), PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID);
  assert.equal(normalizePersonReplacementVideoInputMode('character-reference'), 'character-reference');
  assert.equal(normalizePersonReplacementVideoInputMode('unknown'), 'first-frame');
  assert.equal(resolvePersonReplacementVideoGenerationFps({ processingMode: 'skip', smartClipFps: 12 }), 24);
  assert.equal(resolvePersonReplacementVideoGenerationFps({ smartClipFps: 24 }), 24);

  const firstFrame = resolvePersonReplacementVideoParameterPolicy({
    generationParams: { custom: true },
  });
  assert.equal(firstFrame.generationParams.rhScail2ReplaceSubject, false);
  assert.equal(firstFrame.generationParams.custom, true);

  const characterReference = resolvePersonReplacementVideoParameterPolicy({
    inputMode: 'character-reference',
  });
  assert.equal(characterReference.generationParams.rhScail2ReplaceSubject, true);
  assert.deepEqual(characterReference.uiSchemaFieldState, {
    rhScail2ReplaceSubject: { disabled: true },
  });
});

test('personReplacementProject: orientation aliases and person normalization are deterministic', () => {
  assert.equal(normalizePersonReplacementOrientation('left profile'), 'left_profile');
  assert.equal(normalizePersonReplacementOrientation('over the shoulder right'), 'over_shoulder_right');
  assert.equal(normalizePersonReplacementOrientation('unknown-value'), 'unknown');

  const person = normalizePersonReplacementPerson(
    {
      id: 'p1',
      source_character_id: 'source-1',
      label: 'A',
      bbox: { x: 0.1, y: 0.2, width: 0.2, height: 0.3 },
      identityConfidence: 80,
      detectionConfidence: 0.7,
      orientation: 'front',
      reviewRequired: true,
    },
    { shotId: 'shot-1', index: 3 },
  );

  assert.deepEqual(person.locator.bbox, { x: 0.1, y: 0.2, width: 0.2, height: 0.3 });
  assert.equal(person.locator.horizontal, 'left');
  assert.equal(person.identityConfidence, 0.8);
  assert.equal(person.detectionConfidence, 0.7);
  assert.equal(person.identityMethod, 'fallback');
  assert.equal(person.identityReviewStatus, 'needs_review');
  assert.equal(person.identityReviewRequired, true);
});

test('personReplacementProject: image results keep local refs and clamp active index', () => {
  assert.equal(resolvePersonReplacementImageResultRef({ localPath: image() }), image());
  assert.equal(resolvePersonReplacementImageResultRef({ imageUrl: 'https://example.com/a.png' }), '');
  assert.equal(resolvePersonReplacementImageResultRef('data:image/png;base64,AAAA'), '');

  const state = {
    replacementImage: {
      activeIndex: 99,
      results: [
        { imageUrl: image('a.png'), prompt: ' one ' },
        { imageUrl: image('b.png'), prompt: ' two ' },
        { imageUrl: 'https://example.com/drop.png' },
      ],
    },
  };
  const results = getPersonReplacementImageResults(state);
  assert.equal(results.length, 2);
  assert.equal(results[0].prompt, 'one');
  assert.equal(getPersonReplacementActiveImageResult(state, results).imageUrl, image('b.png'));
});

test('personReplacementProject: video results keep local refs and clamp active index', () => {
  assert.equal(resolvePersonReplacementVideoResultRef({ localPath: video() }), video());
  assert.equal(resolvePersonReplacementVideoResultRef({ videoUrl: 'https://example.com/a.mp4' }), '');

  const state = {
    replacementVideo: {
      activeIndex: -5,
      results: [{ videoUrl: video('a.mp4') }, { videoUrl: video('b.mp4') }],
    },
  };
  const results = getPersonReplacementVideoResults(state);
  assert.equal(results.length, 2);
  assert.equal(state.replacementVideo.results[0].videoUrl, video('a.mp4'));
  assert.equal(
    getPersonReplacementVideoResults({ replacementVideo: { results } })[0].videoUrl,
    video('a.mp4'),
  );
});

test('personReplacementProject: shots normalize timing, people, and selected results', () => {
  const shot = normalizePersonReplacementShot(
    {
      id: 'shot-a',
      start: 2,
      end: 5,
      frame: { width: 1920, height: 1080 },
      keyframeRef: image('frame.png'),
      replacementImage: {
        activeIndex: 0,
        results: [{ imageUrl: image('replacement.png') }],
      },
      replacementVideo: {
        activeIndex: 0,
        results: [{ videoUrl: video('replacement.mp4') }],
      },
      people: [
        {
          id: 'p1',
          sourceCharacterId: 'source-1',
          bbox: { x: 100, y: 200, width: 200, height: 300 },
        },
      ],
    },
    4,
  );

  assert.equal(shot.id, 'shot-a');
  assert.equal(shot.index, 4);
  assert.equal(shot.durationSec, 3);
  assert.equal(shot.keyframeRef, image('frame.png'));
  assert.equal(shot.people.length, 1);
  assert.equal(shot.people[0].promptMarkerIndex, 0);
  assert.equal(shot.analysisStatus, 'succeeded');
  assert.equal(shot.replacementImageRef, image('replacement.png'));
  assert.equal(shot.resultVideoRef, video('replacement.mp4'));
});

test('personReplacementProject: video image input resolves first-frame and character references', () => {
  const project = {
    settings: { replacementVideoInputMode: 'first-frame' },
    shots: [
      {
        id: 'shot-a',
        replacementImage: {
          activeIndex: 0,
          results: [{ imageUrl: image('a.png') }],
        },
      },
    ],
    characters: [
      {
        id: 'character-a',
        name: 'A',
        appearances: [{ id: 'appearance-a', name: 'Base', imageUrl: image('character.png') }],
      },
    ],
  };

  const firstFrame = resolvePersonReplacementVideoImageInput(project, project.shots[0], 'first-frame');
  assert.equal(firstFrame.status, 'ready');
  assert.equal(firstFrame.imageRef, image('a.png'));
  assert.equal(firstFrame.referenceKind, 'replacement-image');

  const characterShot = {
    id: 'shot-b',
    people: [
      {
        id: 'person-a',
        targetCharacterId: 'character-a',
        targetAppearanceId: 'appearance-a',
      },
    ],
  };
  const characterReference = resolvePersonReplacementVideoImageInput(
    { ...project, shots: [...project.shots, characterShot] },
    characterShot,
    'character-reference',
  );
  assert.equal(characterReference.status, 'ready');
  assert.equal(characterReference.imageRef, image('character.png'));
  assert.equal(characterReference.referenceKind, 'character-reference');
  assert.equal(characterReference.reference.personId, 'person-a');
});

test('personReplacementProject: project normalization applies defaults and preserves settings', () => {
  const project = createPersonReplacementProject({
    id: 'project-a',
    title: 'Demo',
    status: 'analyzing',
    source: { videoRef: video('source.mp4'), durationSec: 12 },
    settings: {
      replacementVideoInputMode: 'character-reference',
      replacementPromptEnhancementEnabled: true,
      smartClipMode: 'precise',
      smartClipFps: 30,
      processingMode: 'skip',
      automationMode: 'auto',
    },
  });

  assert.equal(project.schemaVersion, 7);
  assert.equal(project.id, 'project-a');
  assert.equal(project.title, 'Demo');
  assert.equal(project.status, 'analyzing');
  assert.equal(project.source.videoRef, video('source.mp4'));
  assert.equal(project.settings.replacementVideoInputMode, 'character-reference');
  assert.equal(project.settings.replacementPromptEnhancementEnabled, true);
  assert.equal(project.settings.processingMode, 'skip');
  assert.equal(project.settings.automationMode, 'auto');
  assert.equal(normalizePersonReplacementProject(undefined).status, 'draft');
});

test('personReplacementProject: status transitions and mappings enforce project rules', () => {
  assert.equal(canTransitionPersonReplacementProject('draft', 'analyzing'), true);
  assert.equal(canTransitionPersonReplacementProject('draft', 'ready'), false);
  assert.equal(canTransitionPersonReplacementProject('missing', 'draft'), false);

  const project = createPersonReplacementProject({ status: 'ready' });
  const generating = transitionPersonReplacementProject(project, 'generating');
  assert.equal(generating.status, 'generating');
  assert.throws(() => transitionPersonReplacementProject(project, 'completed'), /invalid status transition/);

  const mapped = setPersonReplacementCharacterMapping(project, {
    sourceCharacterId: 'source-1',
    targetCharacterId: 'target-1',
  });
  assert.equal(resolvePersonReplacementTargetCharacterId(mapped, 'source-1'), 'target-1');
  assert.equal(
    resolvePersonReplacementTargetCharacterId(mapped, {
      sourceCharacterId: 'source-1',
      projectMappingDisabled: true,
    }),
    '',
  );
  assert.throws(() => setPersonReplacementCharacterMapping(project, {}), /sourceCharacterId is required/);
});

test('personReplacementProject: binding occurrences and cross-role identities reconcile', () => {
  const project = {
    shots: [
      {
        id: 'shot-1',
        people: [{ id: 'p1', sourceCharacterId: 'source-1', label: 'A' }],
      },
      {
        id: 'shot-2',
        people: [{ id: 'p2', sourceCharacterId: 'source-1', label: 'A' }],
      },
      {
        id: 'shot-3',
        people: [
          { id: 'p3', sourceCharacterId: 'source-1', label: 'B' },
          { id: 'p4', sourceCharacterId: 'source-2', label: 'A' },
        ],
      },
    ],
  };

  assert.deepEqual(getPersonReplacementBindingOccurrences(project, { shotId: 'shot-1', personId: 'p1' }), [
    { shotId: 'shot-1', personId: 'p1', sourceCharacterId: 'source-1' },
    { shotId: 'shot-2', personId: 'p2', sourceCharacterId: 'source-1' },
    { shotId: 'shot-3', personId: 'p4', sourceCharacterId: 'source-2' },
  ]);
  assert.deepEqual([...getPersonReplacementCrossRoleSourceCharacterIds(project)], ['source-1']);
});

test('personReplacementProject: source identities can merge without ambiguous targets', () => {
  const project = {
    shots: [
      {
        id: 'shot-1',
        people: [{ id: 'p1', sourceCharacterId: 'source-1', label: 'A' }],
      },
      {
        id: 'shot-2',
        people: [{ id: 'p2', sourceCharacterId: 'source-2', label: 'B' }],
      },
    ],
    sourceCharacters: [
      { id: 'source-1', name: 'A', imageRefs: [image('a.png')], confidence: 0.8, memberCount: 1 },
      { id: 'source-2', name: 'B', imageRefs: [image('b.png')], confidence: 0.6, memberCount: 2 },
    ],
    mappings: [
      { sourceCharacterId: 'source-1', targetCharacterId: 'target-a' },
      { sourceCharacterId: 'source-2', targetCharacterId: 'target-a' },
    ],
  };

  const merged = mergePersonReplacementSourceCharacters(project, {
    sourceCharacterIds: ['source-1', 'source-2'],
    keepSourceCharacterId: 'source-1',
  });
  assert.deepEqual(
    merged.sourceCharacters.map((item) => item.id),
    ['source-1'],
  );
  assert.equal(merged.sourceCharacters[0].memberCount, 3);
  assert.deepEqual(
    merged.shots.flatMap((shot) => shot.people.map((item) => item.sourceCharacterId)),
    ['source-1', 'source-1'],
  );
  assert.deepEqual(merged.mappings, [{ sourceCharacterId: 'source-1', targetCharacterId: 'target-a' }]);

  assert.throws(
    () =>
      mergePersonReplacementSourceCharacters(
        {
          shots: [
            {
              id: 'shot-1',
              people: [{ sourceCharacterId: 'source-1' }, { sourceCharacterId: 'source-2' }],
            },
          ],
        },
        { sourceCharacterIds: ['source-1', 'source-2'] },
      ),
    /同一镜头/,
  );
});

test('personReplacementProject: source identities can split selected occurrences', () => {
  const project = {
    shots: [
      {
        id: 'shot-1',
        keyframeRef: image('a.png'),
        people: [{ id: 'p1', sourceCharacterId: 'source-1', label: 'A', identityConfidence: 0.8 }],
      },
      {
        id: 'shot-2',
        keyframeRef: image('b.png'),
        people: [{ id: 'p2', sourceCharacterId: 'source-1', label: 'A', identityConfidence: 0.6 }],
      },
    ],
    sourceCharacters: [{ id: 'source-1', name: 'A', memberCount: 2 }],
    mappings: [{ sourceCharacterId: 'source-1', targetCharacterId: 'target-a' }],
  };

  const split = splitPersonReplacementSourceCharacter(project, {
    sourceCharacterId: 'source-1',
    occurrences: [{ shotId: 'shot-1', personId: 'p1' }],
  });
  assert.equal(split.sourceCharacters.length, 2);
  assert.equal(split.shots[0].people[0].sourceCharacterId, 'source-1-split-2');
  assert.equal(split.shots[0].people[0].targetCharacterId, '');
  assert.equal(split.shots[1].people[0].sourceCharacterId, 'source-1');
  assert.equal(split.sourceCharacters[0].memberCount, 1);
  assert.equal(split.sourceCharacters[1].memberCount, 1);
});

test('personReplacementProject: confirming an identity can switch it to an existing source', () => {
  const project = {
    shots: [
      {
        id: 'shot-1',
        people: [
          { id: 'p1', sourceCharacterId: 'source-1', label: 'A', identityReviewStatus: 'needs_review' },
        ],
      },
    ],
    sourceCharacters: [
      { id: 'source-1', name: 'A', reviewRequired: true },
      { id: 'source-2', name: 'B', reviewRequired: true },
    ],
    mappings: [],
  };

  const confirmed = confirmPersonReplacementSourceCharacter(project, {
    sourceCharacterId: 'source-1',
    targetSourceCharacterId: 'source-2',
    shotId: 'shot-1',
    personId: 'p1',
    orientation: 'front',
  });
  assert.deepEqual(
    confirmed.sourceCharacters.map((item) => item.id),
    ['source-2'],
  );
  assert.equal(confirmed.shots[0].people[0].sourceCharacterId, 'source-2');
  assert.equal(confirmed.shots[0].people[0].identityReviewStatus, 'confirmed');
  assert.equal(confirmed.shots[0].people[0].orientation, 'front');
});

test('personReplacementProject: AI analysis unwraps nested payloads and normalizes shots', () => {
  const result = normalizePersonReplacementAiAnalysis(
    '```json\n' +
      JSON.stringify({
        result: {
          shots: [
            {
              shotId: 'shot-1',
              start: 1,
              end: 4,
              people: [{ id: 'p1', bbox: { x: 0.4, y: 0.1, width: 0.2, height: 0.3 } }],
            },
          ],
        },
      }) +
      '\n```',
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'shot-1');
  assert.equal(result[0].durationSec, 3);
  assert.equal(result[0].analysisStatus, 'succeeded');
  assert.equal(result[0].people.length, 1);
});
