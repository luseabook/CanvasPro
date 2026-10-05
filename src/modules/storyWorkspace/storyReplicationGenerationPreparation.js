import { getStoryReplicationPromptInputKey } from './storyReplicationPromptFreshness.js';
import { buildReplicationSegmentPlan } from '../../domain/storyGeneration/videoReplicationSegmentPlan.js';
import { resolveStoryPromptModeDefaultVideoModelId } from '../../domain/storyGeneration/promptModes.js';
import { resolveStoryVideoClipDurationConstraints } from './storyVideoGenerationSettings.js';
export function assertStoryReplicationGenerationCurrent(value, item) {
  const enabled = item['replication']?.['generationInputKey'];
  if (!enabled) return;
  const enabled2 = value['episodes']['find']((key) => key['id'] === item['id']);
  if (!enabled2 || getStoryReplicationPromptInputKey(value, enabled2) !== enabled)
    throw new Error('替换设置或原片核对内容已变化，请按最新设置重新生成；本次结果未覆盖原片。');
}
export async function prepareStoryReplicationGenerationEpisode({
  episode: episode,
  projectData: projectData,
  onProgress: onProgress,
  isActive: isActive,
}) {
  if (!episode['replication']?.['sourceAnalysis']) return episode;
  if (!isActive()) throw new Error('视频生成所属项目已失效。');
  onProgress?.({ message: '正在结合原片时间线和当前素材编排分段提示词' });
  const structuredClone2 = structuredClone(episode);
  (delete structuredClone2['replication']['adaptedScript'],
    delete structuredClone2['replication']['generationPrepared'],
    (structuredClone2['replication']['generationInputKey'] = getStoryReplicationPromptInputKey(
      projectData,
      episode,
    )));
  const index = projectData['project']['planning'] || {},
    promptMode = index['promptMode'] || 'seedance-2.0',
    storyVideoClipDurationConstraints = resolveStoryVideoClipDurationConstraints(
      resolveStoryPromptModeDefaultVideoModelId(promptMode),
    ),
    result = storyVideoClipDurationConstraints?.['maxSeconds'] || 15;
  return (
    (structuredClone2['replication']['segmentPlan'] = buildReplicationSegmentPlan(
      structuredClone2['replication']['sourceAnalysis'],
      {
        durationSec: episode['sourceVideo']['durationSec'],
        promptMode: promptMode,
        maxSeconds: Math['min'](
          result,
          Number(index['sceneMaxSeconds']) > 0 ? Number(index['sceneMaxSeconds']) : result,
        ),
      },
    )),
    structuredClone2
  );
}
