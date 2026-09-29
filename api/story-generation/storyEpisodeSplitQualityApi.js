import {
  parseStoryEpisodeSplitResult,
  createStoryEpisodeDefaultSplitParseContext,
} from '../storyGenerationApi.js';
import { reviewStoryEpisodeSplitQuality as reviewStoryEpisodeSplitQuality_2 } from './storyEpisodeSplitQualityReview.js';
import { resolveStoryPromptModeClipMaxSeconds } from '../../src/domain/storyGeneration/promptModeRules.js';
import { groupStoryEpisodeRepairClips } from './storyEpisodeRepairGrouping.js';
import { normalizeStoryGenerationAssetReferences } from './storyAssetReferenceContract.js';
import { applyReplicationSegmentPlan } from '../../src/domain/storyGeneration/videoReplicationSegmentPlan.js';
function normalizeText(_0x567c03) {
  return String(_0x567c03 || '')['trim']();
}
export function reviewStoryEpisodeSplitQuality(_0x438c7a = {}) {
  const _0xbb805a = normalizeStoryGenerationAssetReferences(_0x438c7a['assets']),
    _0x5e70e4 = { ...(_0x438c7a['project']?.['planning'] || {}), ...(_0x438c7a['constraints'] || {}) },
    _0x28323d = normalizeText(_0x5e70e4['promptMode']) || 'seedance-2.0';
  return (
    (_0x5e70e4['sceneMaxSeconds'] = resolveStoryPromptModeClipMaxSeconds(
      _0x28323d,
      _0x5e70e4['sceneMaxSeconds'],
    )),
    reviewStoryEpisodeSplitQuality_2({
      ..._0x438c7a,
      assets: _0xbb805a,
      constraints: _0x5e70e4,
      validateClips: ({ episodeRef: _0x4a405a, sourceClipRef: _0x3a01ea, clips: _0x44ca31 }) => {
        const _0xe0aff0 = groupStoryEpisodeRepairClips(
            parseStoryEpisodeSplitResult(
              {
                episodeRef: _0x4a405a,
                clips: _0x438c7a['episode']?.['replication']?.['sourceAnalysis']
                  ? _0x44ca31['map']((_0x176224) => ({
                      ..._0x176224,
                      replicationContentType: _0x438c7a['result']?.['clips']?.['find'](
                        (_0x561a95) => _0x561a95['ref'] === _0x3a01ea,
                      )?.['replicationContentType'],
                    }))
                  : _0x44ca31,
              },
              {
                ...createStoryEpisodeDefaultSplitParseContext({
                  episodeRef: _0x4a405a,
                  episode: _0x438c7a['episode'],
                  scriptMode: normalizeText(_0x438c7a['project']?.['scriptMode']),
                  constraints: _0x5e70e4,
                  assets: _0xbb805a,
                  clipDurationConstraints: _0x438c7a['clipDurationConstraints'],
                  promptMode: _0x28323d,
                }),
                enforceMaxDuration: !![],
                repackOverlongClips: ![],
                completeCharacterAssetUsages: ![],
                rejectUnsupportedClipDuration: Boolean(_0x438c7a['clipDurationConstraints']),
              },
            )['clips'],
            {
              promptMode: _0x28323d,
              maxSeconds: _0x5e70e4['sceneMaxSeconds'],
              assets: _0xbb805a,
              rawClips: _0x44ca31,
            },
          ),
          _0x59788c = _0x438c7a['episode']?.['replication']?.['segmentPlan']?.['find'](
            (_0x49cf19) => _0x49cf19['ref'] === _0x3a01ea,
          );
        return _0x59788c
          ? applyReplicationSegmentPlan({ clips: _0xe0aff0 }, { replication: { segmentPlan: [_0x59788c] } })[
              'clips'
            ]
          : _0xe0aff0;
      },
    })
  );
}
