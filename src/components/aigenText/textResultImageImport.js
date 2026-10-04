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
  nodeId: nodeId,
  image: image,
  storeInstance: storeInstance = appStore,
  projectId: projectId = globalThis['window']?.['currentProjectId'] || 'default_v2_project',
  importRemoteAsset: importRemoteAsset = (value) => desktopBridge['assetImport']['importRemoteAsset'](value),
} = {}) {
  const url = normalizeTextResultImages([image])[0x0],
    enabled = storeInstance['getStateRaw']()['nodes'];
  if (!url || !enabled[nodeId]) throw new Error(t('aigenText.result.imageUnavailable'));
  const item = Object['values'](enabled)['find'](
    (key) => key['textResultSourceNodeId'] === nodeId && key['webSourceUrl'] === url['url'],
  );
  if (item) return (storeInstance['setSelectedNodes']([item['id']]), item);
  let map = pendingByCanvas['get'](enabled);
  !map && ((map = new Map()), pendingByCanvas['set'](enabled, map));
  const index = JSON['stringify']([nodeId, url['url']]);
  if (map['has'](index)) return map['get'](index);
  const result = (async () => {
    const assetId = await importRemoteAsset({
      kind: 'image',
      url: url['url'],
      title: url['title'],
      pageUrl: url['pageUrl'],
      projectId: projectId,
    });
    if (storeInstance['getStateRaw']()['nodes'] !== enabled || !enabled[nodeId])
      throw new Error(t('aigenText.result.imageCanvasChanged'));
    const args = buildImageNodeStorageFields(assetId);
    if (!assetId?.['assetId'] || !args['originalLocalPath'])
      throw new Error(t('aigenText.result.imageImportFailed'));
    const box = enabled[nodeId],
      sourceUrl = localPathToUrl(args['originalLocalPath']),
      src = localPathToUrl(args['displayLocalPath']) || sourceUrl,
      box2 = buildSourceMediaNodePayload({
        id: generateId('source-image'),
        type: 'source-image',
        ...args,
        assetId: assetId['assetId'],
        assetRevision: assetId['assetRevision'],
        assetUpdatedAt: assetId['assetUpdatedAt'] || assetId['updatedAt'],
        derivativeStatus: assetId['derivativeStatus'],
        naturalWidth: assetId['originalWidth'] || assetId['width'],
        naturalHeight: assetId['originalHeight'] || assetId['height'],
        name: url['title'],
        src: src,
        imageUrl: src,
        sourceUrl: sourceUrl,
        thumbUrl: localPathToUrl(args['thumbLocalPath']),
        webSourceUrl: url['url'],
        webPageUrl: url['pageUrl'],
        webSourceTitle: url['title'],
        textResultSourceNodeId: nodeId,
      }),
      availablePosition = findAvailablePosition(
        enabled,
        Number(box['x'] || 0x0) + Number(box['width'] || 0x1f4) + 0x28,
        Number(box['y'] || 0x0),
        box2['width'],
        box2['height'],
        0x18,
        'right',
      );
    return (
      Object['assign'](box2, availablePosition),
      storeInstance['addNode'](box2),
      storeInstance['setSelectedNodes']([box2['id']]),
      box2
    );
  })();
  map['set'](index, result);
  try {
    return await result;
  } finally {
    map['delete'](index);
  }
}
