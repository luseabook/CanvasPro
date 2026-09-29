import { buildStoryReplicationAdaptationInput } from '../../../api/storyReplicationAdaptationApi.js';
import { buildVideoReplicationGenerationAssets } from '../../domain/storyGeneration/videoReplicationGenerationAssets.js';
export function getStoryReplicationPromptInputKey(_0x2f9e54, _0x1c5020) {
  return JSON['stringify']({
    ...buildStoryReplicationAdaptationInput({
      project: _0x2f9e54['project'],
      episode: _0x1c5020,
      assets: _0x2f9e54['assets'],
    }),
    assets: buildVideoReplicationGenerationAssets(_0x2f9e54['assets'], _0x2f9e54['project']),
    planning: _0x2f9e54['project']['planning'],
    pipeline: _0x1c5020['replication']?.['sourceAnalysis']?.['speechEvidence']
      ? 'source-asr-plan-v4-user-review'
      : 'source-shot-plan-v6-user-review',
  });
}
export function isStoryReplicationPromptStale(_0x25b2e9, _0xdd9193) {
  if (_0x25b2e9?.['project']?.['sourceMode'] !== 'video-replication' || !_0xdd9193?.['clips']?.['length'])
    return ![];
  return (
    _0xdd9193['replication']?.['promptsStale'] === !![] ||
    Boolean(
      _0xdd9193['replication']?.['promptInputKey'] &&
      _0xdd9193['replication']['promptInputKey'] !== getStoryReplicationPromptInputKey(_0x25b2e9, _0xdd9193),
    )
  );
}
export function markStoryReplicationPromptsStale(_0x397c9a, _0x1455ec = '') {
  for (const _0x250546 of _0x397c9a['episodes'] || []) {
    if (_0x250546['clips']?.['length'] && (!_0x1455ec || _0x250546['id'] === _0x1455ec))
      _0x250546['replication']['promptsStale'] = !![];
  }
}
