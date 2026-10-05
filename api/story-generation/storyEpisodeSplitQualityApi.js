import {
  parseStoryEpisodeSplitResult,
  createStoryEpisodeDefaultSplitParseContext,
} from '../storyGenerationApi.js';
import { reviewStoryEpisodeSplitQuality as reviewStoryEpisodeSplitQuality_2 } from './storyEpisodeSplitQualityReview.js';
import { resolveStoryPromptModeClipMaxSeconds } from '../../src/domain/storyGeneration/promptModeRules.js';
import { groupStoryEpisodeRepairClips } from './storyEpisodeRepairGrouping.js';
import { normalizeStoryGenerationAssetReferences } from './storyAssetReferenceContract.js';
import { applyReplicationSegmentPlan } from '../../src/domain/storyGeneration/videoReplicationSegmentPlan.js';
function normalizeText(value) {
  return String(value || '')['trim']();
}
export function reviewStoryEpisodeSplitQuality(clips = {}) {
  const assets = normalizeStoryGenerationAssetReferences(clips['assets']),
    constraints = { ...(clips['project']?.['planning'] || {}), ...(clips['constraints'] || {}) },
    promptMode = normalizeText(constraints['promptMode']) || 'seedance-2.0';
  return (
    (constraints['sceneMaxSeconds'] = resolveStoryPromptModeClipMaxSeconds(
      promptMode,
      constraints['sceneMaxSeconds'],
    )),
    reviewStoryEpisodeSplitQuality_2({
      ...clips,
      assets: assets,
      constraints: constraints,
      validateClips: ({ episodeRef: episodeRef, sourceClipRef: sourceClipRef, clips: clips2 }) => {
        const clips3 = groupStoryEpisodeRepairClips(
            parseStoryEpisodeSplitResult(
              {
                episodeRef: episodeRef,
                clips: clips['episode']?.['replication']?.['sourceAnalysis']
                  ? clips2['map']((args) => ({
                      ...args,
                      replicationContentType: clips['result']?.['clips']?.['find'](
                        (item) => item['ref'] === sourceClipRef,
                      )?.['replicationContentType'],
                    }))
                  : clips2,
              },
              {
                ...createStoryEpisodeDefaultSplitParseContext({
                  episodeRef: episodeRef,
                  episode: clips['episode'],
                  scriptMode: normalizeText(clips['project']?.['scriptMode']),
                  constraints: constraints,
                  assets: assets,
                  clipDurationConstraints: clips['clipDurationConstraints'],
                  promptMode: promptMode,
                }),
                enforceMaxDuration: true,
                repackOverlongClips: false,
                completeCharacterAssetUsages: false,
                rejectUnsupportedClipDuration: Boolean(clips['clipDurationConstraints']),
              },
            )['clips'],
            {
              promptMode: promptMode,
              maxSeconds: constraints['sceneMaxSeconds'],
              assets: assets,
              rawClips: clips2,
            },
          ),
          key = clips['episode']?.['replication']?.['segmentPlan']?.['find'](
            (index) => index['ref'] === sourceClipRef,
          );
        return key
          ? applyReplicationSegmentPlan({ clips: clips3 }, { replication: { segmentPlan: [key] } })['clips']
          : clips3;
      },
    })
  );
}
