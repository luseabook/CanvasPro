import { publishTaskCenterSnapshot } from '../generationTaskCenterEvents.js';
import { normalizeTaskCenterStatus } from '../taskCenterModel.js';
import { getModelManifest } from '../../manifests/index.js';
import { resolveTaskCenterThumbnail } from '../taskCenterThumbnail.js';
import { getStoryAssetAppearances } from './storyAssetAppearances.js';
function resultThumbnail(_0x838170, _0x4cb00b) {
  if (_0x4cb00b['type'] === 'asset-image') {
    const _0x22d9d4 = _0x838170['assets']?.['find'](
        (_0x3afa61) => _0x3afa61['id'] === _0x4cb00b['scope']?.['assetId'],
      ),
      _0x4f6414 =
        _0x22d9d4 &&
        getStoryAssetAppearances(_0x22d9d4)['find'](
          (_0x35055c) => _0x35055c['id'] === _0x4cb00b['scope']?.['appearanceId'],
        );
    return _0x4f6414
      ? resolveTaskCenterThumbnail(
          {
            images: _0x4f6414['generatedImages']?.['length']
              ? _0x4f6414['generatedImages']
              : [_0x4f6414['generatedImage'] || _0x4f6414],
          },
          'image',
        )
      : null;
  }
  if (_0x4cb00b['type'] === 'clip-video') {
    const _0x59a17c = _0x838170['episodes']?.['find'](
        (_0x860c8c) => _0x860c8c['id'] === _0x4cb00b['scope']?.['episodeId'],
      ),
      _0x2ec17c = _0x59a17c?.['clips']?.['find'](
        (_0x440369) => _0x440369['id'] === _0x4cb00b['scope']?.['clipId'],
      );
    return resolveTaskCenterThumbnail(_0x2ec17c?.['video']?.['results']?.['at'](-0x1), 'video');
  }
  return null;
}
export function reportStoryTaskCenter(_0x2d577e = {}) {
  const _0x379679 = _0x2d577e['project'];
  if (!_0x379679?.['id']) return;
  const _0x4f9399 = [];
  for (const _0x4864e7 of _0x379679['backgroundTasks'] || []) {
    const _0x4c5a8f = normalizeTaskCenterStatus(_0x4864e7['status']);
    if (!_0x4c5a8f) continue;
    const _0x5d36cc = getModelManifest(_0x4864e7['modelId']);
    _0x4f9399['push']({
      taskId: 'story:' + _0x379679['id'] + ':' + _0x4864e7['id'] + ':' + _0x4864e7['startedAt'],
      source: 'story-workspace',
      kind: _0x4864e7['type'],
      title: _0x4864e7['label'],
      projectId: _0x379679['id'],
      projectTitle: _0x379679['title'] || _0x379679['name'] || '',
      provider: _0x4864e7['provider'] || _0x5d36cc?.['provider'] || '',
      modelId: _0x4864e7['modelId'],
      providerProfileId: _0x4864e7['providerProfileId'] || '',
      adapterType: _0x5d36cc?.['adapterType'] || '',
      remoteTaskId: _0x4864e7['remoteTaskId'],
      status: _0x4c5a8f,
      message: _0x4864e7['message'],
      error: _0x4864e7['error'],
      startedAt: _0x4864e7['startedAt'],
      createdAt: _0x4864e7['startedAt'],
      finishedAt: _0x4864e7['finishedAt'],
      progress: null,
      cancellable: ![],
      thumbnail: _0x4c5a8f === 'complete' ? resultThumbnail(_0x2d577e, _0x4864e7) : null,
      navigation: { source: 'story-workspace', projectId: _0x379679['id'], ..._0x4864e7['scope'] },
    });
  }
  publishTaskCenterSnapshot({ source: 'story-workspace', projectId: _0x379679['id'] }, _0x4f9399);
}
