import { buildStoryReplicationAdaptationInput } from '../../../api/storyReplicationAdaptationApi.js';
import { buildVideoReplicationGenerationAssets } from '../../domain/storyGeneration/videoReplicationGenerationAssets.js';
export function getStoryReplicationPromptInputKey(project, episode) {
  return JSON['stringify']({
    ...buildStoryReplicationAdaptationInput({
      project: project['project'],
      episode: episode,
      assets: project['assets'],
    }),
    assets: buildVideoReplicationGenerationAssets(project['assets'], project['project']),
    planning: project['project']['planning'],
    pipeline: episode['replication']?.['sourceAnalysis']?.['speechEvidence']
      ? 'source-asr-plan-v4-user-review'
      : 'source-shot-plan-v6-user-review',
  });
}
export function isStoryReplicationPromptStale(value, enabled) {
  if (value?.['project']?.['sourceMode'] !== 'video-replication' || !enabled?.['clips']?.['length'])
    return ![];
  return (
    enabled['replication']?.['promptsStale'] === !![] ||
    Boolean(
      enabled['replication']?.['promptInputKey'] &&
      enabled['replication']['promptInputKey'] !== getStoryReplicationPromptInputKey(value, enabled),
    )
  );
}
export function markStoryReplicationPromptsStale(item, enabled2 = '') {
  for (const key of item['episodes'] || []) {
    if (key['clips']?.['length'] && (!enabled2 || key['id'] === enabled2))
      key['replication']['promptsStale'] = !![];
  }
}
