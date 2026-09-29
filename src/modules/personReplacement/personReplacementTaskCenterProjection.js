import { publishTaskCenterSnapshot } from '../generationTaskCenterEvents.js';
import { normalizeTaskCenterStatus } from '../taskCenterModel.js';
import { getModelManifest } from '../../manifests/index.js';
import { resolveTaskCenterThumbnail } from '../taskCenterThumbnail.js';
function latestBatch(_0x6ecbfe = []) {
  const _0x2e18f4 = _0x6ecbfe['at'](-0x1);
  if (!_0x2e18f4) return [];
  return _0x2e18f4['createdAt']
    ? _0x6ecbfe['filter']((_0x4ad370) => _0x4ad370['createdAt'] === _0x2e18f4['createdAt'])
    : [_0x2e18f4];
}
export function reportReplacementTaskCenter(_0xaaf468 = {}) {
  if (!_0xaaf468['id']) return;
  const _0x189ae0 = _0xaaf468['workspace'] || {},
    _0x133487 = [],
    _0x37c4b9 = (_0x25ccd4, _0x105d66, _0x37049b = {}, _0x56e863 = {}, _0x8028bf = null) => {
      const _0x34ca36 = normalizeTaskCenterStatus(_0x37049b['status']);
      if (!_0x34ca36) return;
      const _0xe2702b = getModelManifest(_0x37049b['modelId']);
      _0x133487['push']({
        taskId:
          'replacement:' +
          _0xaaf468['id'] +
          ':' +
          _0x25ccd4 +
          ':' +
          (_0x37049b['requestId'] || _0x37049b['startedAt'] || 'current'),
        source: 'replacement-studio',
        kind: _0x25ccd4['split'](':')[0x0],
        title: _0x105d66,
        projectId: _0xaaf468['id'],
        projectTitle: _0xaaf468['name'] || _0xaaf468['title'] || '',
        modelId: _0x37049b['modelId'] || '',
        provider: _0x37049b['provider'] || _0xe2702b?.['provider'] || '',
        providerProfileId: _0x37049b['providerProfileId'] || '',
        adapterType: _0xe2702b?.['adapterType'] || '',
        remoteTaskId: _0x37049b['taskId'] || '',
        status: _0x34ca36,
        message: _0x37049b['message'] || '',
        error: _0x37049b['error'] || '',
        progress: Number['isFinite'](_0x37049b['progress']) ? _0x37049b['progress'] / 0x64 : null,
        createdAt: Number(_0x37049b['startedAt']) || 0x0,
        startedAt: Number(_0x37049b['startedAt']) || 0x0,
        finishedAt: Number(_0x37049b['finishedAt']) || 0x0,
        cancellable: ![],
        thumbnail:
          _0x34ca36 === 'complete'
            ? resolveTaskCenterThumbnail(_0x8028bf, _0x25ccd4['split'](':')[0x0])
            : null,
        navigation: { source: 'replacement-studio', projectId: _0xaaf468['id'], ..._0x56e863 },
      });
    };
  for (const [_0x42220e, _0x45aaef] of [
    ['image', _0x189ae0['imageGenerationsByShotId']],
    ['video', _0x189ae0['videoGenerationsByShotId']],
  ]) {
    for (const [_0x38192d, _0x5a491e] of Object['entries'](_0x45aaef || {})) {
      const _0x521213 = _0xaaf468['shots']?.['find']((_0x561b45) => _0x561b45['id'] === _0x38192d),
        _0x333b28 = latestBatch(
          _0x521213?.[_0x42220e === 'image' ? 'replacementImage' : 'replacementVideo']?.['results'],
        );
      _0x37c4b9(
        _0x42220e + ':' + _0x38192d,
        (_0x521213?.['name'] || _0x521213?.['title'] || _0x38192d) +
          '\x20·\x20' +
          (_0x42220e === 'image' ? '图片生成' : '视频生成'),
        _0x5a491e,
        { shotId: _0x38192d, step: _0x42220e === 'image' ? 0x2 : 0x3 },
        _0x333b28['length'] ? { [_0x42220e === 'image' ? 'images' : 'videos']: _0x333b28 } : null,
      );
    }
  }
  (_0x37c4b9('analysis', '原片分析', {
    ..._0x189ae0['sourceAnalysis'],
    status:
      _0x189ae0['sourceAnalysis']?.['status'] === 'ready'
        ? 'succeeded'
        : _0x189ae0['sourceAnalysis']?.['status'],
  }),
    _0x37c4b9('identity', '人物识别', _0x189ae0['identityAnalysis']),
    _0x37c4b9('preparation', '镜头准备', _0x189ae0['videoPreparation']));
  for (const _0x3aee0b of _0xaaf468['characters'] || []) {
    for (const _0x45ad55 of _0x3aee0b['appearances'] || []) {
      if (
        String(_0x45ad55['generationStatus'] || '')
          ['trim']()
          ['toLowerCase']() === 'pending'
      )
        continue;
      _0x37c4b9(
        'appearance:' + _0x3aee0b['id'] + ':' + _0x45ad55['id'],
        (_0x3aee0b['name'] || '角色') + '\x20·\x20' + (_0x45ad55['name'] || '形象生成'),
        { status: _0x45ad55['generationStatus'], error: _0x45ad55['error'] },
        { characterId: _0x3aee0b['id'], appearanceId: _0x45ad55['id'] },
        _0x45ad55['generatedImage'] || _0x45ad55,
      );
    }
  }
  publishTaskCenterSnapshot({ source: 'replacement-studio', projectId: _0xaaf468['id'] }, _0x133487);
}
