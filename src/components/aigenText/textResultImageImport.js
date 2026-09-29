import appStore from '../../core/stores/appStore.js';
import { findAvailablePosition, generateId } from '../../core/math.js';
import { desktopBridge } from '../../services/desktopBridge.js';
import { buildSourceMediaNodePayload } from '../../services/fileService.js';
import { buildImageNodeStorageFields } from '../../services/imageDerivativeService.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { normalizeTextResultImages } from '../../utils/textResultImages.js';
import { t } from '../../i18n/index.js';
const pendingByCanvas = new WeakMap();
export async function addTextResultImageToCanvas({
  nodeId: _0x42d314,
  image: _0x23d508,
  storeInstance: storeInstance = appStore,
  projectId: projectId = globalThis['window']?.['currentProjectId'] || 'default_v2_project',
  importRemoteAsset: importRemoteAsset = (_0x500818) =>
    desktopBridge['assetImport']['importRemoteAsset'](_0x500818),
} = {}) {
  const _0x2a05a9 = normalizeTextResultImages([_0x23d508])[0x0],
    _0x14b04e = storeInstance['getStateRaw']()['nodes'];
  if (!_0x2a05a9 || !_0x14b04e[_0x42d314]) throw new Error(t('aigenText.result.imageUnavailable'));
  const _0x443c3a = Object['values'](_0x14b04e)['find'](
    (_0x38d75a) =>
      _0x38d75a['textResultSourceNodeId'] === _0x42d314 && _0x38d75a['webSourceUrl'] === _0x2a05a9['url'],
  );
  if (_0x443c3a) return (storeInstance['setSelectedNodes']([_0x443c3a['id']]), _0x443c3a);
  let _0x30f668 = pendingByCanvas['get'](_0x14b04e);
  !_0x30f668 && ((_0x30f668 = new Map()), pendingByCanvas['set'](_0x14b04e, _0x30f668));
  const _0x33c174 = JSON['stringify']([_0x42d314, _0x2a05a9['url']]);
  if (_0x30f668['has'](_0x33c174)) return _0x30f668['get'](_0x33c174);
  const _0x51de4e = (async () => {
    const _0x5a86fd = await importRemoteAsset({
      kind: 'image',
      url: _0x2a05a9['url'],
      title: _0x2a05a9['title'],
      pageUrl: _0x2a05a9['pageUrl'],
      projectId: projectId,
    });
    if (storeInstance['getStateRaw']()['nodes'] !== _0x14b04e || !_0x14b04e[_0x42d314])
      throw new Error(t('aigenText.result.imageCanvasChanged'));
    const _0x5670e2 = buildImageNodeStorageFields(_0x5a86fd);
    if (!_0x5a86fd?.['assetId'] || !_0x5670e2['originalLocalPath'])
      throw new Error(t('aigenText.result.imageImportFailed'));
    const _0x6923e7 = _0x14b04e[_0x42d314],
      _0x54ac2c = localPathToUrl(_0x5670e2['originalLocalPath']),
      _0x2fc716 = localPathToUrl(_0x5670e2['displayLocalPath']) || _0x54ac2c,
      _0x4736fe = buildSourceMediaNodePayload({
        id: generateId('source-image'),
        type: 'source-image',
        ..._0x5670e2,
        assetId: _0x5a86fd['assetId'],
        assetRevision: _0x5a86fd['assetRevision'],
        assetUpdatedAt: _0x5a86fd['assetUpdatedAt'] || _0x5a86fd['updatedAt'],
        derivativeStatus: _0x5a86fd['derivativeStatus'],
        naturalWidth: _0x5a86fd['originalWidth'] || _0x5a86fd['width'],
        naturalHeight: _0x5a86fd['originalHeight'] || _0x5a86fd['height'],
        name: _0x2a05a9['title'],
        src: _0x2fc716,
        imageUrl: _0x2fc716,
        sourceUrl: _0x54ac2c,
        thumbUrl: localPathToUrl(_0x5670e2['thumbLocalPath']),
        webSourceUrl: _0x2a05a9['url'],
        webPageUrl: _0x2a05a9['pageUrl'],
        webSourceTitle: _0x2a05a9['title'],
        textResultSourceNodeId: _0x42d314,
      }),
      _0x1938c4 = findAvailablePosition(
        _0x14b04e,
        Number(_0x6923e7['x'] || 0x0) + Number(_0x6923e7['width'] || 0x1f4) + 0x28,
        Number(_0x6923e7['y'] || 0x0),
        _0x4736fe['width'],
        _0x4736fe['height'],
        0x18,
        'right',
      );
    return (
      Object['assign'](_0x4736fe, _0x1938c4),
      storeInstance['addNode'](_0x4736fe),
      storeInstance['setSelectedNodes']([_0x4736fe['id']]),
      _0x4736fe
    );
  })();
  _0x30f668['set'](_0x33c174, _0x51de4e);
  try {
    return await _0x51de4e;
  } finally {
    _0x30f668['delete'](_0x33c174);
  }
}
