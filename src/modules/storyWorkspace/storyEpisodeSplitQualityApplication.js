import { buildVideoReplicationGenerationAssets } from '../../domain/storyGeneration/videoReplicationGenerationAssets.js';

export async function runStoryEpisodeSplitQualityReview({
  reviewEpisodeSplit,
  result,
  episode,
  context,
  projectData,
  splitRun,
  clipDurationConstraints = null,
  onProgress = null,
} = {}) {
  if (typeof reviewEpisodeSplit !== 'function' || !result) return result;

  return reviewEpisodeSplit({
    project: context?.project,
    episode,
    result,
    assets: buildVideoReplicationGenerationAssets(projectData?.assets, context?.project),
    constraints: context?.project?.planning,
    model: splitRun.execution.modelId,
    provider: splitRun.execution.provider,
    providerProfileId: splitRun.execution.providerProfileId,
    clipDurationConstraints,
    resumeDraft: splitRun.qualityReview,
    onCheckpoint: splitRun.saveQualityReview,
    onInvocation: splitRun.onInvocation,
    onProgress,
  });
}
