import { normalizePersonReplacementCompositeSidebarWidth } from './personReplacementProjectSession.js';
function normalizeText(_0x2a35db, _0x59ffbb = '') {
  const _0x2fdcc2 = String(_0x2a35db ?? '')['trim']();
  return _0x2fdcc2 || _0x59ffbb;
}
function projectShot(_0x9682d4 = {}) {
  return Object['freeze']({
    id: normalizeText(_0x9682d4?.['id']),
    sourceId: normalizeText(_0x9682d4?.['sourceId']),
    title: normalizeText(_0x9682d4?.['title']),
    videoRef: normalizeText(_0x9682d4?.['videoRef']),
    sourceVideoRef: normalizeText(_0x9682d4?.['sourceVideoRef']),
    resultVideoRef: normalizeText(_0x9682d4?.['resultVideoRef']),
    keyframeRef: normalizeText(_0x9682d4?.['keyframeRef']),
    replacementImageRef: normalizeText(_0x9682d4?.['replacementImageRef']),
    startTimeSec: Number(_0x9682d4?.['startTimeSec']) || 0x0,
    endTimeSec: Number(_0x9682d4?.['endTimeSec']) || 0x0,
    durationSec: Number(_0x9682d4?.['durationSec']) || 0x0,
    outputFps: Number(_0x9682d4?.['outputFps']) || 0x0,
  });
}
function resolveSelectedShot(_0x45e6e9, _0x4c5c93) {
  const _0x11c96e = normalizeText(_0x45e6e9['workspace']?.['selectedShotId']);
  return (
    _0x4c5c93['find']((_0x22202c) => normalizeText(_0x22202c?.['id']) === _0x11c96e) || _0x4c5c93[0x0] || null
  );
}
function resolveFullMedia(_0x2f1c8d) {
  const _0x4f3647 = normalizeText(_0x2f1c8d['output']?.['originalMasterRef']);
  return {
    originalRef: _0x4f3647,
    replacementRef: normalizeText(
      _0x2f1c8d['output']?.['visualMasterRef'] || _0x2f1c8d['output']?.['finalVideoRef'],
    ),
    originalAudioRef: normalizeText(_0x2f1c8d['audio']?.['originalAudioRef'] || _0x4f3647),
    replacementAudioRef: normalizeText(_0x2f1c8d['audio']?.['replacementAudioRef']),
  };
}
function resolveShotMedia(_0x1f11ee, _0x2eac1c, _0x58774c) {
  const _0x191719 = Array['isArray'](_0x1f11ee['sources']) ? _0x1f11ee['sources'] : [],
    _0x23b6a7 =
      _0x191719['find'](
        (_0x496a36) => normalizeText(_0x496a36?.['id']) === normalizeText(_0x58774c?.['sourceId']),
      ) ||
      _0x1f11ee['source'] ||
      {},
    _0x51835c = normalizeText(_0x1f11ee['audio']?.['selectedSourceId']),
    _0x272635 =
      _0x1f11ee['audio']?.['replacementAudioRef'] &&
      (!_0x51835c || _0x51835c === normalizeText(_0x58774c?.['sourceId']) || _0x191719['length'] <= 0x1)
        ? normalizeText(_0x1f11ee['audio']['replacementAudioRef'])
        : '';
  return {
    originalRef: normalizeText(
      _0x58774c?.['videoRef'] || _0x58774c?.['sourceVideoRef'] || _0x23b6a7?.['videoRef'],
    ),
    replacementRef: normalizeText(
      _0x58774c?.['resultVideoRef'] ||
        (_0x2eac1c['length'] === 0x1
          ? _0x1f11ee['output']?.['finalVideoRef'] || _0x1f11ee['output']?.['visualMasterRef']
          : ''),
    ),
    replacementAudioRef: _0x272635,
  };
}
export function buildPersonReplacementCompositePreviewSnapshot(_0x22efcd = {}) {
  const _0x5370f9 = (Array['isArray'](_0x22efcd['shots']) ? _0x22efcd['shots'] : [])['map'](projectShot),
    _0xbd49a9 = resolveSelectedShot(_0x22efcd, _0x5370f9),
    _0x396af1 = resolveFullMedia(_0x22efcd),
    _0x40c360 = resolveShotMedia(_0x22efcd, _0x5370f9, _0xbd49a9),
    _0x1e3cb9 = Boolean(_0x396af1['originalRef'] && _0x396af1['replacementRef']),
    _0x780e4 = _0x22efcd['output']?.['composeStatus'] === 'succeeded' && _0x1e3cb9,
    _0x14c384 = _0x1e3cb9 && !_0x780e4,
    _0x1c8a9b = _0x22efcd['workspace']?.['compositePreviewMode'] === 'full' && _0x1e3cb9 ? 'full' : 'shot',
    _0x43dafa = new Set(
      (Array['isArray'](_0x22efcd['output']?.['composedShotIds'])
        ? _0x22efcd['output']['composedShotIds']
        : [])
        ['map'](normalizeText)
        ['filter'](Boolean),
    ),
    _0xd24045 = _0x5370f9['filter']((_0x394ee6) => _0x43dafa['has'](normalizeText(_0x394ee6?.['id']))),
    _0x36a8ea = Array['isArray'](_0x22efcd['workspace']?.['selectedShotIds'])
      ? _0x22efcd['workspace']['selectedShotIds']
      : [],
    _0x5151de = _0x1c8a9b === 'full' ? _0x396af1 : _0x40c360;
  return Object['freeze']({
    title: normalizeText(_0x22efcd['title']),
    shots: Object['freeze']([..._0x5370f9]),
    selectedShot: _0xbd49a9,
    selectedShotIds: Object['freeze']([..._0x36a8ea]),
    selectionMode: _0x22efcd['workspace']?.['shotSelectionMode'] === !![],
    previewMode: _0x1c8a9b,
    fullAvailable: _0x1e3cb9,
    composedShots: Object['freeze']([..._0xd24045]),
    media: Object['freeze']({ ..._0x5151de }),
    shotMedia: Object['freeze']({ ..._0x40c360 }),
    fullMedia: Object['freeze']({ ..._0x396af1 }),
    previewTrack: _0x22efcd['audio']?.['previewTrack'] === 'original' ? 'original' : 'replacement',
    completed: _0x5370f9['filter']((_0x52a2bf) => normalizeText(_0x52a2bf?.['resultVideoRef']))['length'],
    total: _0x5370f9['length'],
    selectedShotIndex: Math['max'](
      0x0,
      _0x5370f9['findIndex'](
        (_0x240987) => normalizeText(_0x240987?.['id']) === normalizeText(_0xbd49a9?.['id']),
      ),
    ),
    composeSucceeded: _0x780e4,
    compositionStale: _0x14c384,
    canCompare: Boolean(_0x5151de['originalRef'] && _0x5151de['replacementRef']),
    sidebarWidth: normalizePersonReplacementCompositeSidebarWidth(
      _0x22efcd['workspace']?.['compositeSidebarWidth'],
    ),
  });
}
