import { STORY_SCENE_MAX_SECONDS_OPTIONS, normalizeStoryPlanningConstraints } from './planningContract.js';
export const STORY_EPISODE_SPLIT_CAMERA_PRESETS = Object['freeze']([
  '中景，平视机位，固定镜头。',
  '近景，平视机位，固定镜头。',
  '特写，平视机位，固定镜头。',
  '全景，平视机位，固定镜头。',
  '中景，镜头缓慢推进。',
  '近景，镜头缓慢推进。',
  '中景，侧向跟拍。',
  '低角度仰拍，固定镜头。',
  '高角度俯拍，固定镜头。',
  '过肩中景，固定镜头。',
  '手部或道具特写，固定镜头。',
  '环境远景，镜头缓慢横移。',
]);
function normalizePositiveNumber(value) {
  const count = Number(value);
  return Number['isFinite'](count) && count > 0 ? count : 0;
}
function createAssetUsageResponseSchema() {
  return {
    type: 'object',
    additionalProperties: ![],
    required: ['assetRef', 'appearanceRef'],
    properties: { assetRef: { type: 'string' }, appearanceRef: { type: 'string' } },
  };
}
function createShotResponseSchema({
  maxDurationSeconds: maxDurationSeconds = 0,
  requiredFields: requiredFields = null,
  compactExperimental: compactExperimental = ![],
  includeDirectorContinuity: includeDirectorContinuity = ![],
  includeTimeline: includeTimeline = ![],
} = {}) {
  const args = normalizePositiveNumber(maxDurationSeconds),
    item = Array['isArray'](requiredFields)
      ? requiredFields
      : ['durationSec', 'assetUsages', 'visual', 'camera', 'dialogue', 'voiceover', 'audio'];
  return {
    type: 'object',
    additionalProperties: ![],
    required: item,
    properties: {
      durationSec: { type: 'number', minimum: 0.1, ...(args ? { maximum: args } : {}) },
      ...(includeTimeline
        ? { startSec: { type: 'integer', minimum: 0 }, endSec: { type: 'integer', minimum: 1 } }
        : {}),
      ...(compactExperimental
        ? { assetRefs: { type: 'array', items: { type: 'string' } } }
        : { assetUsages: { type: 'array', items: createAssetUsageResponseSchema() } }),
      visual: { type: 'string' },
      camera: { type: 'string' },
      dialogue: { type: 'string' },
      voiceover: { type: 'string' },
      audio: { type: 'string' },
      ...(includeDirectorContinuity ? { transitionFromPrevious: { type: 'string' } } : {}),
      cutAfter: { type: 'string', enum: ['preferred', 'allowed', 'forbidden'] },
    },
  };
}
function createClipResponseSchema({
  maxDurationSeconds: maxDurationSeconds = 0,
  minimumShotsPerClip: minimumShotsPerClip = 2,
  maximumShotsPerClip: maximumShotsPerClip = 5,
  requiredClipFields: requiredClipFields = null,
  requiredShotFields: requiredShotFields = null,
  compactExperimental: compactExperimental = ![],
  includeDirectorContinuity: includeDirectorContinuity = ![],
  includeTimeline: includeTimeline = ![],
} = {}) {
  const key = Math['max'](1, Math['trunc'](Number(minimumShotsPerClip) || 1)),
    args2 = Math['max'](0, Math['trunc'](Number(maximumShotsPerClip) || 0));
  return {
    type: 'object',
    additionalProperties: ![],
    required: Array['isArray'](requiredClipFields)
      ? requiredClipFields
      : compactExperimental
        ? ['ref', 'shots']
        : ['ref', 'script', 'creativeIntent', 'transition', 'shots'],
    properties: {
      ref: { type: 'string' },
      ...(!compactExperimental
        ? { script: { type: 'string' }, creativeIntent: { type: 'string' }, transition: { type: 'string' } }
        : {}),
      shots: {
        type: 'array',
        minItems: key,
        ...(args2 ? { maxItems: args2 } : {}),
        items: createShotResponseSchema({
          maxDurationSeconds: maxDurationSeconds,
          requiredFields: requiredShotFields,
          compactExperimental: compactExperimental,
          includeDirectorContinuity: includeDirectorContinuity,
          includeTimeline: includeTimeline,
        }),
      },
    },
  };
}
export function buildStoryEpisodeSplitBlueprintResponseSchema({
  sceneMaxSeconds: sceneMaxSeconds = STORY_SCENE_MAX_SECONDS_OPTIONS[1],
  enforceMaxDuration: enforceMaxDuration = !![],
  includeSceneAssetRef: includeSceneAssetRef = !![],
  includeDirectorContinuity: includeDirectorContinuity = ![],
} = {}) {
  const storyPlanningConstraints = normalizeStoryPlanningConstraints({ sceneMaxSeconds: sceneMaxSeconds })[
    'sceneMaxSeconds'
  ];
  return {
    type: 'object',
    additionalProperties: ![],
    required: ['episodeRef', 'clipPlans'],
    properties: {
      episodeRef: { type: 'string' },
      clipPlans: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: ![],
          required: [
            'sourceBeatRefs',
            'beat',
            ...(includeSceneAssetRef ? ['sceneAssetRef'] : []),
            'sceneAppearanceRef',
            'entryState',
            'exitState',
            ...(includeDirectorContinuity ? ['openingShotIntent', 'closingShotIntent'] : []),
            'characterAssetRefs',
            'propAssetRefs',
            'targetDurationSec',
          ],
          properties: {
            sourceBeatRefs: { type: 'array', minItems: 1, items: { type: 'string' } },
            beat: { type: 'string' },
            ...(includeSceneAssetRef ? { sceneAssetRef: { type: 'string' } } : {}),
            sceneAppearanceRef: { type: 'string' },
            entryState: { type: 'string' },
            exitState: { type: 'string' },
            ...(includeDirectorContinuity
              ? { openingShotIntent: { type: 'string' }, closingShotIntent: { type: 'string' } }
              : {}),
            characterAssetRefs: { type: 'array', items: { type: 'string' } },
            propAssetRefs: { type: 'array', items: { type: 'string' } },
            targetDurationSec: {
              type: 'number',
              minimum: 0.1,
              ...(enforceMaxDuration ? { maximum: storyPlanningConstraints } : {}),
            },
          },
        },
      },
    },
  };
}
export function buildStoryEpisodeSplitBatchResponseSchema({
  clipCount: clipCount = 1,
  maxDurationSeconds: maxDurationSeconds = 0,
  minimumShotsPerClip: minimumShotsPerClip = 2,
  maximumShotsPerClip: maximumShotsPerClip = 5,
  requiredClipFields: requiredClipFields = null,
  requiredShotFields: requiredShotFields = null,
  compactExperimental: compactExperimental = ![],
  includeDirectorContinuity: includeDirectorContinuity = ![],
  includeTimeline: includeTimeline = ![],
} = {}) {
  const index = Math['max'](1, Math['trunc'](Number(clipCount) || 1));
  return {
    type: 'object',
    additionalProperties: ![],
    required: ['episodeRef', 'clips'],
    properties: {
      episodeRef: { type: 'string' },
      clips: {
        type: 'array',
        minItems: index,
        maxItems: index,
        items: createClipResponseSchema({
          maxDurationSeconds: maxDurationSeconds,
          minimumShotsPerClip: minimumShotsPerClip,
          maximumShotsPerClip: maximumShotsPerClip,
          requiredClipFields: requiredClipFields,
          requiredShotFields: requiredShotFields,
          compactExperimental: compactExperimental,
          includeDirectorContinuity: includeDirectorContinuity,
          includeTimeline: includeTimeline,
        }),
      },
    },
  };
}
export function buildStoryEpisodeSplitSingleResponseSchema() {
  return {
    type: 'object',
    additionalProperties: ![],
    required: ['clips'],
    properties: {
      clips: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: ![],
          required: ['s', 'shots'],
          properties: {
            s: { type: 'string' },
            shots: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                additionalProperties: ![],
                required: ['v'],
                properties: {
                  d: { type: 'number', minimum: 0.1 },
                  r: { type: 'array', items: { type: 'string' } },
                  v: { type: 'string' },
                  c: {
                    type: 'integer',
                    minimum: 0,
                    maximum: STORY_EPISODE_SPLIT_CAMERA_PRESETS['length'] - 1,
                  },
                  q: { type: 'string' },
                  o: { type: 'string' },
                  a: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  };
}
