import { isStoryContinuousTimelinePromptMode } from '../../src/domain/storyGeneration/promptModes.js';
import { normalizeStoryGenerationAssetReferences } from './storyAssetReferenceContract.js';
import { REPLICATION_CONTENT_TYPES } from '../../src/domain/storyGeneration/videoReplicationContentRouting.js';
import { replicationVisualSchema } from '../../src/domain/storyGeneration/videoReplicationVisualContract.js';
const object = (_0xa603dd) => ({
    type: 'object',
    additionalProperties: ![],
    required: Object['keys'](_0xa603dd),
    properties: _0xa603dd,
  }),
  string = { type: 'string' };
export function createReplicationSplitOutput({
  assets: assets = [],
  promptMode: _0x536c6b,
  segmentPlan: segmentPlan = [],
} = {}) {
  const _0x28f688 = normalizeStoryGenerationAssetReferences(assets)['flatMap']((_0xc80f2f) =>
      (_0xc80f2f['appearances']['length']
        ? _0xc80f2f['appearances']['map']((_0x379dc7) => _0x379dc7['ref'])
        : [''])['map']((_0xb07da4) =>
        object({
          assetRef: { type: 'string', enum: [_0xc80f2f['ref']] },
          appearanceRef: { type: 'string', enum: [_0xb07da4] },
        }),
      ),
    ),
    _0x14b977 = { type: isStoryContinuousTimelinePromptMode(_0x536c6b) ? 'integer' : 'number' },
    _0x2d61ea = object({
      d: _0x14b977,
      ...(isStoryContinuousTimelinePromptMode(_0x536c6b) ? { startSec: _0x14b977, endSec: _0x14b977 } : {}),
      v: string,
      c: string,
      q: string,
      o: string,
      a: string,
      ...replicationVisualSchema(),
      assetUsages: {
        type: 'array',
        ...(_0x28f688['length'] ? {} : { maxItems: 0x0 }),
        items: _0x28f688['length']
          ? { anyOf: _0x28f688 }
          : object({ assetRef: string, appearanceRef: string }),
      },
    });
  return {
    name: 'replication_episode_split',
    strict: !![],
    fallback: 'prompt',
    schema: object({
      contentType: { type: 'string', enum: REPLICATION_CONTENT_TYPES },
      clips: {
        type: 'array',
        minItems: segmentPlan['length'] || 0x1,
        ...(segmentPlan['length'] ? { maxItems: segmentPlan['length'] } : {}),
        items: object({
          ref: segmentPlan['length']
            ? { type: 'string', enum: segmentPlan['map']((_0x130be5) => _0x130be5['ref']) }
            : string,
          s: string,
          durationSec: _0x14b977,
          shots: { type: 'array', minItems: 0x1, items: _0x2d61ea },
        }),
      },
    }),
  };
}
