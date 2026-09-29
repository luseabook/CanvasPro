import { playAssetCreateFly } from '../assetCreateFly.js';
import { getPersonReplacementLibraryAudioRef } from './personReplacementVoiceLibrary.js';
import { PERSON_REPLACEMENT_WORKSPACE_INTENTS } from './personReplacementWorkspaceIntentPort.js';
export function requestPersonReplacementLibraryAssignment({
  project: _0x296747,
  selectedAssetIds: _0x45ec7f,
  targetKind: _0x3c552a,
  root: _0x45e00b,
  documentObject: _0x4bb1f3,
  windowObject: _0x464544,
  hasWorkspaceIntent: _0x2c03a1,
  runIntent: _0x58d993,
}) {
  const _0x30f1d4 = _0x296747['libraryAssets']['filter']((_0x5890b0) => {
    if (!_0x45ec7f['includes'](_0x5890b0['id'])) return ![];
    if (_0x3c552a === 'audio')
      return (
        normalizeText(_0x5890b0?.['mediaKind'])['toLowerCase']() === 'audio' &&
        Boolean(getPersonReplacementLibraryAudioRef(_0x5890b0))
      );
    return (
      normalizeText(_0x5890b0?.['mediaKind'])['toLowerCase']() === 'image' &&
      Boolean(normalizeText(_0x5890b0?.['sourceUrl'] || _0x5890b0?.['imageUrl']))
    );
  });
  if (!_0x30f1d4['length']) {
    _0x464544?.['showToast']?.(
      _0x3c552a === 'audio' ? '请选择总素材中的音频后再加入项目。' : '请选择总素材中的图片后再加入项目。',
      'warn',
    );
    return;
  }
  const _0x172328 = _0x2c03a1(PERSON_REPLACEMENT_WORKSPACE_INTENTS['ADD_LIBRARY_ASSETS_TO_PROJECT']);
  if (_0x3c552a === 'scene' && !_0x172328) {
    _0x464544?.['showToast']?.('当前场景素材导入能力尚未初始化。', 'warn');
    return;
  }
  const _0x16f375 = getNewPersonReplacementLibraryAssets(_0x296747, _0x30f1d4, _0x3c552a),
    _0x57dd97 = _0x30f1d4['map']((_0x628584) => ({
      assetId: _0x628584['sourceAssetId'],
      itemIndex: _0x628584['sourceItemIndex'],
    })),
    _0x35df53 = _0x58d993(
      _0x172328
        ? PERSON_REPLACEMENT_WORKSPACE_INTENTS['ADD_LIBRARY_ASSETS_TO_PROJECT']
        : PERSON_REPLACEMENT_WORKSPACE_INTENTS['ADD_LIBRARY_ASSETS_TO_CHARACTERS'],
      _0x172328 ? { assetRefs: _0x57dd97, targetKind: _0x3c552a } : { assetRefs: _0x57dd97 },
    ),
    _0x5e314f = (_0x595db1) =>
      playPersonReplacementLibraryAssetsIntoProjectTab(
        _0x45e00b,
        _0x16f375,
        _0x595db1?.['addedCount'],
        _0x3c552a,
        _0x4bb1f3,
        _0x464544,
      );
  if (_0x35df53?.['then']) void _0x35df53['then'](_0x5e314f);
  else _0x5e314f(_0x35df53);
  return _0x35df53;
}
function normalizeText(_0x26b4bb) {
  return String(_0x26b4bb ?? '')['trim']();
}
function getLibraryAssetSourceKey(_0x4406d2 = {}) {
  return (
    normalizeText(_0x4406d2['sourceAssetId']) +
    ':' +
    Math['max'](0x0, Math['trunc'](Number(_0x4406d2['sourceItemIndex']) || 0x0))
  );
}
function getRenderableElementRect(_0x258a46) {
  const _0x5bdfd1 = _0x258a46?.['getBoundingClientRect']?.();
  return _0x5bdfd1?.['width'] > 0x0 && _0x5bdfd1?.['height'] > 0x0 ? _0x5bdfd1 : null;
}
function resolveLibraryAssetFlySource(_0x1d6777, _0x5da139, _0x2e3139 = []) {
  const _0x315a71 = _0x2e3139['find'](
      (_0xe0aaa5) => normalizeText(_0xe0aaa5?.['dataset']?.['storyAssetId']) === _0x5da139['id'],
    ),
    _0x485304 = _0x315a71?.['querySelector']?.('.story-asset-card-image'),
    _0x1c622f = getRenderableElementRect(_0x485304);
  if (_0x1c622f) return { fromRect: _0x1c622f, contentElement: _0x485304 };
  const _0x541e11 = Array['from'](
      _0x1d6777?.['querySelectorAll']?.('[data-story-asset-prompt-asset-id]') || [],
    )['find'](
      (_0x2e2e4d) => normalizeText(_0x2e2e4d?.['dataset']?.['storyAssetPromptAssetId']) === _0x5da139['id'],
    ),
    _0x4b9e6d = _0x541e11?.['closest']?.('.story-asset-detail')?.['querySelector']?.('.story-asset-preview'),
    _0x1ff16e = getRenderableElementRect(_0x4b9e6d);
  return _0x1ff16e ? { fromRect: _0x1ff16e, contentElement: _0x4b9e6d } : null;
}
export function getNewPersonReplacementLibraryAssets(
  _0x1e49aa = {},
  _0x55b19d = [],
  _0x46822b = 'character',
) {
  const _0x155a74 =
      _0x46822b === 'scene'
        ? _0x1e49aa['scenes']
        : _0x46822b === 'audio'
          ? _0x1e49aa['audioAssets']
          : _0x1e49aa['characters'],
    _0x1b5695 = new Set(
      (Array['isArray'](_0x155a74) ? _0x155a74 : [])
        ['filter']((_0x1f70ea) => normalizeText(_0x1f70ea?.['sourceOrigin']) === 'library')
        ['map']((_0x2b2e15) => getLibraryAssetSourceKey(_0x2b2e15)),
    );
  return _0x55b19d['filter']((_0x4e6074) => !_0x1b5695['has'](getLibraryAssetSourceKey(_0x4e6074)));
}
export function playPersonReplacementLibraryAssetsIntoProjectTab(
  _0x15de5f,
  _0x47d859 = [],
  _0x335a50 = 0x0,
  _0x4fd72a = 'character',
  _0x4befd6 = globalThis['document'],
  _0x343ee6 = globalThis['window'],
) {
  const _0x3b3317 = Math['min'](
    _0x47d859['length'],
    Math['max'](0x0, Math['trunc'](Number(_0x335a50) || 0x0)),
  );
  if (!_0x3b3317) return ![];
  const _0x983bc4 = _0x15de5f?.['querySelector']?.('[data-asset-tab="' + _0x4fd72a + '\x22]');
  if (!_0x983bc4) return ![];
  const _0x2540aa = Array['from'](_0x15de5f?.['querySelectorAll']?.('[data-story-asset-id]') || []);
  return (
    _0x47d859['slice'](0x0, _0x3b3317)['forEach']((_0x407108) => {
      const _0x564d50 = resolveLibraryAssetFlySource(_0x15de5f, _0x407108, _0x2540aa);
      if (!_0x564d50) return;
      playAssetCreateFly({
        ..._0x564d50,
        toElement: _0x983bc4,
        documentObject: _0x4befd6,
        windowObject: _0x343ee6,
      });
    }),
    !![]
  );
}
export async function addPersonReplacementAppearanceToLibraryWithFly(
  _0xabc602,
  _0x22c6fa,
  _0x135968,
  _0x1ed934,
  _0x5c86b8,
  _0x462eab,
  _0x1f8ab6,
) {
  const _0x1043a0 = _0xabc602?.['querySelector']?.(
      '.person-replacement-assets-page .story-asset-detail .story-asset-preview',
    ),
    _0x47d742 = _0x1043a0?.['getBoundingClientRect']?.() || null,
    _0x32bbc6 = await _0x5c86b8(_0x1ed934, {
      characterId: _0x22c6fa?.['id'],
      appearanceId: _0x135968?.['id'],
    });
  if (!_0x32bbc6?.['ok'] || !_0x1043a0 || !_0x47d742) return null;
  return playAssetCreateFly({
    fromRect: _0x47d742,
    contentElement: _0x1043a0,
    toElement: _0xabc602?.['querySelector']?.('[data-asset-tab=\x22library\x22]'),
    documentObject: _0x462eab,
    windowObject: _0x1f8ab6,
  });
}
