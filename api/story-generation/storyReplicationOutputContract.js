import { isStoryContinuousTimelinePromptMode } from '../../src/domain/storyGeneration/promptModes.js';
import { normalizeStoryGenerationAssetReferences } from './storyAssetReferenceContract.js';
import { REPLICATION_CONTENT_TYPES } from '../../src/domain/storyGeneration/videoReplicationContentRouting.js';
import { replicationVisualSchema } from '../../src/domain/storyGeneration/videoReplicationVisualContract.js';
const object = (properties) => ({
    type: 'object',
    additionalProperties: false,
    required: Object['keys'](properties),
    properties: properties,
  }),
  string = { type: 'string' };
export function createReplicationSplitOutput({
  assets: assets = [],
  promptMode: promptMode,
  segmentPlan: segmentPlan = [],
} = {}) {
  const items = normalizeStoryGenerationAssetReferences(assets)['flatMap']((value) =>
      (value['appearances']['length'] ? value['appearances']['map']((item) => item['ref']) : [''])['map'](
        (key) =>
          object({
            assetRef: { type: 'string', enum: [value['ref']] },
            appearanceRef: { type: 'string', enum: [key] },
          }),
      ),
    ),
    d = { type: isStoryContinuousTimelinePromptMode(promptMode) ? 'integer' : 'number' },
    items2 = object({
      d: d,
      ...(isStoryContinuousTimelinePromptMode(promptMode) ? { startSec: d, endSec: d } : {}),
      v: string,
      c: string,
      q: string,
      o: string,
      a: string,
      ...replicationVisualSchema(),
      assetUsages: {
        type: 'array',
        ...(items['length'] ? {} : { maxItems: 0 }),
        items: items['length'] ? { anyOf: items } : object({ assetRef: string, appearanceRef: string }),
      },
    });
  return {
    name: 'replication_episode_split',
    strict: true,
    fallback: 'prompt',
    schema: object({
      contentType: { type: 'string', enum: REPLICATION_CONTENT_TYPES },
      clips: {
        type: 'array',
        minItems: segmentPlan['length'] || 1,
        ...(segmentPlan['length'] ? { maxItems: segmentPlan['length'] } : {}),
        items: object({
          ref: segmentPlan['length']
            ? { type: 'string', enum: segmentPlan['map']((index) => index['ref']) }
            : string,
          s: string,
          durationSec: d,
          shots: { type: 'array', minItems: 1, items: items2 },
        }),
      },
    }),
  };
}
