import { buildPersonReplacementLocationGuide } from './personReplacementLocationGuide.js';
import { buildPersonReplacementAnnotatedSource } from './personReplacementAnnotatedSource.js';
import { normalizeLocalPath } from '../../utils/localMediaPath.js';
export async function materializePersonReplacementGuide({
  entry: entry,
  project: project,
  adapter: adapter,
  canReuseCanvas: canReuseCanvas,
  previousNodes: previousNodes,
  canvasId: canvasId,
  saveOutputBlob: saveOutputBlob,
  buildNodeData: buildNodeData,
  createLocationGuide: createLocationGuide = buildPersonReplacementLocationGuide,
}) {
  const name = entry['data'],
    args = name['personReplacementBinding'],
    args2 = args['annotatedSource'] || args['locationGuide'],
    locationGuideSignature = JSON['stringify']({ version: 0x1, ...args2 }),
    value = previousNodes[entry['key']];
  let imageRef = '',
    args3 = {};
  if (canReuseCanvas && value && adapter['getNode'] && (await adapter['nodeExists'](value, canvasId))) {
    const item = await adapter['getNode'](value, canvasId);
    item?.['personReplacementBinding']?.['locationGuideSignature'] === locationGuideSignature &&
      ((imageRef = normalizeLocalPath(item['originalLocalPath'] || item['localPath'])), (args3 = item));
  }
  if (!imageRef) {
    if (typeof saveOutputBlob !== 'function') throw new Error('人物定位图本地保存服务不可用');
    const await2 = await (
      args['annotatedSource'] ? buildPersonReplacementAnnotatedSource : createLocationGuide
    )(args2);
    if (!await2?.['dataUrl']?.['startsWith']('data:image/png;base64,'))
      throw new Error('人物定位图 PNG 导出失败');
    const key = Uint8Array['from'](atob(await2['dataUrl']['split'](',')[0x1]), (index) =>
        index['charCodeAt'](0x0),
      ),
      response = await saveOutputBlob(new Blob([key], { type: 'image/png' }), {
        ext: 'png',
        subDir: 'person-replacement-guides',
        kind: 'image',
      });
    ((imageRef = normalizeLocalPath(
      response?.['originalLocalPath'] || response?.['localPath'] || response?.['path'] || response?.['url'],
    )),
      (args3 = response));
    if (!imageRef) throw new Error('人物定位图保存后未返回本地路径');
  }
  entry['data'] = {
    ...name,
    ...buildNodeData({
      project: project,
      imageRef: imageRef,
      results: [{ ...args3, localPath: imageRef }],
      name: name['name'],
      type: name['type'],
      binding: { ...args, locationGuideSignature: locationGuideSignature },
    }),
    imageWidth: name['imageWidth'],
    imageHeight: name['imageHeight'],
  };
}
