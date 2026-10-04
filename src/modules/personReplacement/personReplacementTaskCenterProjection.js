import { publishTaskCenterSnapshot } from '../generationTaskCenterEvents.js';
import { normalizeTaskCenterStatus } from '../taskCenterModel.js';
import { getModelManifest } from '../../manifests/index.js';
import { resolveTaskCenterThumbnail } from '../taskCenterThumbnail.js';
function latestBatch(list = []) {
  const enabled = list['at'](-0x1);
  if (!enabled) return [];
  return enabled['createdAt']
    ? list['filter']((value) => value['createdAt'] === enabled['createdAt'])
    : [enabled];
}
export function reportReplacementTaskCenter(projectId = {}) {
  if (!projectId['id']) return;
  const status = projectId['workspace'] || {},
    list2 = [],
    handler = (kind, title, modelId = {}, args = {}, item = null) => {
      const status2 = normalizeTaskCenterStatus(modelId['status']);
      if (!status2) return;
      const adapterType = getModelManifest(modelId['modelId']);
      list2['push']({
        taskId:
          'replacement:' +
          projectId['id'] +
          ':' +
          kind +
          ':' +
          (modelId['requestId'] || modelId['startedAt'] || 'current'),
        source: 'replacement-studio',
        kind: kind['split'](':')[0x0],
        title: title,
        projectId: projectId['id'],
        projectTitle: projectId['name'] || projectId['title'] || '',
        modelId: modelId['modelId'] || '',
        provider: modelId['provider'] || adapterType?.['provider'] || '',
        providerProfileId: modelId['providerProfileId'] || '',
        adapterType: adapterType?.['adapterType'] || '',
        remoteTaskId: modelId['taskId'] || '',
        status: status2,
        message: modelId['message'] || '',
        error: modelId['error'] || '',
        progress: Number['isFinite'](modelId['progress']) ? modelId['progress'] / 0x64 : null,
        createdAt: Number(modelId['startedAt']) || 0x0,
        startedAt: Number(modelId['startedAt']) || 0x0,
        finishedAt: Number(modelId['finishedAt']) || 0x0,
        cancellable: ![],
        thumbnail: status2 === 'complete' ? resolveTaskCenterThumbnail(item, kind['split'](':')[0x0]) : null,
        navigation: { source: 'replacement-studio', projectId: projectId['id'], ...args },
      });
    };
  for (const [step, key] of [
    ['image', status['imageGenerationsByShotId']],
    ['video', status['videoGenerationsByShotId']],
  ]) {
    for (const [shotId, index] of Object['entries'](key || {})) {
      const error = projectId['shots']?.['find']((result) => result['id'] === shotId),
        list3 = latestBatch(error?.[step === 'image' ? 'replacementImage' : 'replacementVideo']?.['results']);
      handler(
        step + ':' + shotId,
        (error?.['name'] || error?.['title'] || shotId) +
          '\x20·\x20' +
          (step === 'image' ? '图片生成' : '视频生成'),
        index,
        { shotId: shotId, step: step === 'image' ? 0x2 : 0x3 },
        list3['length'] ? { [step === 'image' ? 'images' : 'videos']: list3 } : null,
      );
    }
  }
  (handler('analysis', '原片分析', {
    ...status['sourceAnalysis'],
    status:
      status['sourceAnalysis']?.['status'] === 'ready' ? 'succeeded' : status['sourceAnalysis']?.['status'],
  }),
    handler('identity', '人物识别', status['identityAnalysis']),
    handler('preparation', '镜头准备', status['videoPreparation']));
  for (const characterId of projectId['characters'] || []) {
    for (const status3 of characterId['appearances'] || []) {
      if (
        String(status3['generationStatus'] || '')
          ['trim']()
          ['toLowerCase']() === 'pending'
      )
        continue;
      handler(
        'appearance:' + characterId['id'] + ':' + status3['id'],
        (characterId['name'] || '角色') + '\x20·\x20' + (status3['name'] || '形象生成'),
        { status: status3['generationStatus'], error: status3['error'] },
        { characterId: characterId['id'], appearanceId: status3['id'] },
        status3['generatedImage'] || status3,
      );
    }
  }
  publishTaskCenterSnapshot({ source: 'replacement-studio', projectId: projectId['id'] }, list2);
}
