import appStore from '../core/stores/appStore.js';
import { requester } from '../../api/requester.js';
import { t } from '../i18n/index.js';
import { canUseElectronMediaTask, enqueueElectronMediaTask } from '../../api/localMediaTaskApi.js';
import { generateId } from '../core/math.js';
import { commit } from './history.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import {
  buildSourceAudioNodePayload,
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from '../services/fileService.js';
import { localPathToUrl, pickResultLocalPath } from '../utils/localMediaPath.js';
import { getOrderedMediaComposeIds, getSelectedMediaComposeKind } from './mediaComposeSelection.js';
const MEDIA_COMPOSE_CONFIG = Object.freeze({
  video: Object.freeze({
    taskKind: 'videoCompose',
    endpoint: '/api/v2/video/compose',
    textKey: 'video',
    resultIdPrefix: 'source-video-compose',
    sourceFields: Object.freeze(['localPath', 'src', 'videoUrl', 'url', 'resultUrl']),
  }),
  audio: Object.freeze({
    taskKind: 'audioCompose',
    endpoint: '/api/v2/audio/compose',
    textKey: 'audio',
    resultIdPrefix: 'source-audio-compose',
    sourceFields: Object.freeze(['localPath', 'audioUrl', 'src', 'url', 'resultUrl']),
  }),
});
function mediaComposeText(_0xf6e7a2, _0x391653, _0x377ef8 = {}) {
  return t('mediaProcessing.compose.' + _0xf6e7a2.textKey + '.' + _0x391653, _0x377ef8);
}
function resolveNodeSrc(_0x185bd2, _0xcec199) {
  const _0x1539d8 = Array.isArray(_0xcec199?.sourceFields) ? _0xcec199.sourceFields : [];
  for (const _0x17206e of _0x1539d8) {
    const _0x25de3b = localPathToUrl(_0x185bd2?.[_0x17206e]);
    if (_0x25de3b) return _0x25de3b;
  }
  return '';
}
function getResultNodeSize(_0x2f4c90, _0x26e56a) {
  if (_0x2f4c90 === 'audio')
    return { width: Number(_0x26e56a?.width || 0) || 0x140, height: Number(_0x26e56a?.height || 0) || 140 };
  return getAutoMediaSizeByShortSide(_0x26e56a?.width || 0x200, _0x26e56a?.height || 0x120);
}
function buildComposedNodePayload(
  _0x204a60,
  _0x524481,
  { id: _0x3be1aa, x: _0x408827, y: _0x3f7f9b, width: _0x49bf91, height: _0x52c1ba, localPath: _0x1841b1 },
) {
  const _0x64ea7 = localPathToUrl(_0x1841b1);
  if (_0x204a60 === 'audio')
    return buildSourceAudioNodePayload({
      id: _0x3be1aa,
      type: 'source-audio',
      x: _0x408827,
      y: _0x3f7f9b,
      width: _0x49bf91,
      height: _0x52c1ba,
      name: mediaComposeText(_0x524481, 'resultName'),
      src: _0x64ea7,
      audioUrl: _0x64ea7,
      localPath: _0x1841b1,
      needsAutoResize: false,
      fixedSize: true,
    });
  return buildSourceMediaNodePayload({
    id: _0x3be1aa,
    type: 'source-video',
    x: _0x408827,
    y: _0x3f7f9b,
    width: _0x49bf91,
    height: _0x52c1ba,
    name: mediaComposeText(_0x524481, 'resultName'),
    src: _0x64ea7,
    localPath: _0x1841b1,
    needsAutoResize: false,
    fixedSize: true,
  });
}
async function runMediaComposeRequest(_0x9c347a, _0x42d573) {
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(
      { kind: _0x9c347a.taskKind, srcs: _0x42d573, args: { srcs: _0x42d573 } },
      { wait: true, timeout: 0x927c0 },
    );
  const _0x2084c2 = await requester({
    url: _0x9c347a.endpoint,
    method: 'POST',
    provider: 'local',
    timeout: 0x493e0,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ srcs: _0x42d573 }),
    allow404Null: true,
    returnMeta: true,
  });
  if (_0x2084c2?.status === 0x194 || _0x2084c2?.data == null)
    throw new Error(mediaComposeText(_0x9c347a, 'missingApi'));
  return _0x2084c2.data || {};
}
async function composeSelectedMedia(_0x2cefb4, _0x5a748, _0x1405e6) {
  const _0x2c9c80 = MEDIA_COMPOSE_CONFIG[_0x1405e6];
  if (!_0x2c9c80) return;
  const _0x55a3aa = appStore.getState(),
    _0x5b77af = _0x55a3aa.nodes || {},
    _0x5ec70f = _0x55a3aa.selectionMeta || {},
    _0x444ede = Array.isArray(_0x2cefb4) ? _0x2cefb4.slice() : [];
  if (getSelectedMediaComposeKind(_0x5b77af, _0x444ede) !== _0x1405e6) {
    window.showToast?.(mediaComposeText(_0x2c9c80, 'minSelection'), 'info');
    return;
  }
  const _0x2a92fa = getOrderedMediaComposeIds(_0x5b77af, _0x444ede, _0x5ec70f),
    _0x27ca05 = _0x2a92fa.map((_0x17f703) => resolveNodeSrc(_0x5b77af[_0x17f703], _0x2c9c80)).filter(Boolean);
  if (_0x27ca05.length < 2) {
    window.showToast?.(mediaComposeText(_0x2c9c80, 'invalidSource'), 'error');
    return;
  }
  _0x5a748 && ((_0x5a748.dataset.loading = 'true'), (_0x5a748.disabled = true));
  window.showToast?.(mediaComposeText(_0x2c9c80, 'progress'), 'info');
  try {
    const _0x4a19d9 = await runMediaComposeRequest(_0x2c9c80, _0x27ca05),
      _0x268872 = pickResultLocalPath(_0x4a19d9);
    if (!_0x4a19d9.success || !_0x268872)
      throw new Error(_0x4a19d9.error || _0x4a19d9.message || mediaComposeText(_0x2c9c80, 'fallback'));
    const _0x1d64b1 = _0x2a92fa[0],
      _0x45f354 = _0x5b77af[_0x1d64b1],
      { width: _0x30a361, height: _0x3b10d6 } = getResultNodeSize(_0x1405e6, _0x45f354),
      _0x419587 = calcSafeSpawnPosNearNode(appStore.getState().nodes, _0x45f354, _0x30a361, _0x3b10d6),
      _0x5a27ef = generateId(_0x2c9c80.resultIdPrefix);
    (appStore.addNode(
      buildComposedNodePayload(_0x1405e6, _0x2c9c80, {
        id: _0x5a27ef,
        x: _0x419587.x,
        y: _0x419587.y,
        width: _0x30a361,
        height: _0x3b10d6,
        localPath: _0x268872,
      }),
    ),
      appStore.setSelectedNodes([_0x5a27ef]),
      commit(),
      window.v2FocusOnNodes?.([..._0x2a92fa, _0x5a27ef]),
      window._triggerLocalCacheSave?.(),
      window.showToast?.(mediaComposeText(_0x2c9c80, 'success'), 'success'));
  } catch (_0x20d641) {
    const _0x3ca89e =
      _0x20d641 instanceof Error
        ? _0x20d641.message
        : String(_0x20d641 || mediaComposeText(_0x2c9c80, 'fallback'));
    window.showToast?.(mediaComposeText(_0x2c9c80, 'failedWithMessage', { message: _0x3ca89e }), 'error');
  } finally {
    _0x5a748 && ((_0x5a748.dataset.loading = 'false'), (_0x5a748.disabled = false));
  }
}
export async function composeSelectedVideos(_0x22f172, _0x4e182b) {
  return composeSelectedMedia(_0x22f172, _0x4e182b, 'video');
}
export async function composeSelectedAudios(_0xb77ba9, _0x486199) {
  return composeSelectedMedia(_0xb77ba9, _0x486199, 'audio');
}
