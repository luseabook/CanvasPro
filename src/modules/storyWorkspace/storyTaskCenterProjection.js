import { publishTaskCenterSnapshot } from '../generationTaskCenterEvents.js';
import { normalizeTaskCenterStatus } from '../taskCenterModel.js';
import { getModelManifest } from '../../manifests/index.js';
import { resolveTaskCenterThumbnail } from '../taskCenterThumbnail.js';
import { getStoryAssetAppearances } from './storyAssetAppearances.js';
function resultThumbnail(value, item) {
  if (item.type === 'asset-image') {
    const key = value.assets?.find((index) => index.id === item.scope?.assetId),
      images =
        key &&
        getStoryAssetAppearances(key).find((result) => result.id === item.scope?.appearanceId);
    return images
      ? resolveTaskCenterThumbnail(
          {
            images: images.generatedImages?.length
              ? images.generatedImages
              : [images.generatedImage || images],
          },
          'image',
        )
      : null;
  }
  if (item.type === 'clip-video') {
    const data = value.episodes?.find((options) => options.id === item.scope?.episodeId),
      target = data?.clips?.find((source) => source.id === item.scope?.clipId);
    return resolveTaskCenterThumbnail(target?.video?.results?.at(-1), 'video');
  }
  return null;
}
export function reportStoryTaskCenter(options2 = {}) {
  const projectId = options2.project;
  if (!projectId?.id) return;
  const list = [];
  for (const kind of projectId.backgroundTasks || []) {
    const status = normalizeTaskCenterStatus(kind.status);
    if (!status) continue;
    const adapterType = getModelManifest(kind.modelId);
    list.push({
      taskId: 'story:' + projectId.id + ':' + kind.id + ':' + kind.startedAt,
      source: 'story-workspace',
      kind: kind.type,
      title: kind.label,
      projectId: projectId.id,
      projectTitle: projectId.title || projectId.name || '',
      provider: kind.provider || adapterType?.provider || '',
      modelId: kind.modelId,
      providerProfileId: kind.providerProfileId || '',
      adapterType: adapterType?.adapterType || '',
      remoteTaskId: kind.remoteTaskId,
      status: status,
      message: kind.message,
      error: kind.error,
      startedAt: kind.startedAt,
      createdAt: kind.startedAt,
      finishedAt: kind.finishedAt,
      progress: null,
      cancellable: false,
      thumbnail: status === 'complete' ? resultThumbnail(options2, kind) : null,
      navigation: { source: 'story-workspace', projectId: projectId.id, ...kind.scope },
    });
  }
  publishTaskCenterSnapshot({ source: 'story-workspace', projectId: projectId.id }, list);
}
