import { getAutoMediaSizeByShortSide } from '../services/fileService.js';
const FLAT_MEDIA_TYPES = new Set(['source-image', 'image', 'ai-image', 'source-video', 'video', 'ai-video']);
function toNumber(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function getNodeWidth(box) {
  return Math.max(1, toNumber(box?.width ?? box?.w, 240));
}
function getNodeHeight(box2) {
  return Math.max(1, toNumber(box2?.height ?? box2?.h, 240));
}
function isFlatMediaNode(index) {
  return FLAT_MEDIA_TYPES.has(String(index?.type || ''));
}
export function shouldTopAlignRestoredAsset(list, list2) {
  const list3 = Array.isArray(list) ? list.filter(Boolean) : [];
  if (list3.length <= 1) return false;
  if (!list3.every(isFlatMediaNode)) return false;
  return !Array.isArray(list2) || list2.length === 0;
}
export function createTopAlignedAssetNodes(list4, result = 24) {
  const list5 = Array.isArray(list4) ? list4.filter(Boolean) : [],
    list6 = list5
      .map((node, index2) => ({ node: node, index: index2 }))
      .sort((item2, data) => {
        const toNumber2 = toNumber(item2.node?.x, 0),
          toNumber3 = toNumber(data.node?.x, 0);
        if (toNumber2 !== toNumber3) return toNumber2 - toNumber3;
        const toNumber4 = toNumber(item2.node?.y, 0),
          toNumber5 = toNumber(data.node?.y, 0);
        if (toNumber4 !== toNumber5) return toNumber4 - toNumber5;
        return item2.index - data.index;
      });
  let x = 0;
  return list6.map(({ node: node2 }) => {
    const width = getNodeWidth(node2),
      height = getNodeHeight(node2),
      options = { ...node2, x: x, y: 0, width: width, height: height };
    return ((x += width + result), options);
  });
}

const IMAGE_MEDIA_TYPES = new Set(['source-image', 'image', 'ai-image']);

function getFirstPositiveDimension(...args) {
  for (const target of args) {
    const count = Number(target);
    if (Number['isFinite'](count) && count > 0x0) return count;
  }
  return 0x0;
}

export function prepareAssetNodeForRestore(source, box3) {
  if (!box3 || typeof box3 !== 'object') return box3;
  if (!String(source?.['packageKey'] || '')['trim']()) return box3;
  if (!IMAGE_MEDIA_TYPES['has'](String(box3['type'] || ''))) return box3;
  const firstPositiveDimension = getFirstPositiveDimension(
      box3['originalWidth'],
      box3['imageWidth'],
      box3['naturalWidth'],
      box3['metadata']?.['width'],
      box3['width'],
      box3['w'],
    ),
    firstPositiveDimension2 = getFirstPositiveDimension(
      box3['originalHeight'],
      box3['imageHeight'],
      box3['naturalHeight'],
      box3['metadata']?.['height'],
      box3['height'],
      box3['h'],
    );
  if (!(firstPositiveDimension > 0x0 && firstPositiveDimension2 > 0x0)) return box3;
  const box4 = getAutoMediaSizeByShortSide(firstPositiveDimension, firstPositiveDimension2);
  if (getNodeWidth(box3) === box4['width'] && getNodeHeight(box3) === box4['height']) return box3;
  return { ...box3, width: box4['width'], height: box4['height'] };
}

export function prepareAssetNodesForRestore(next, current = 0x18) {
  const entry = Array['isArray'](next?.['nodes']) ? next['nodes'] : [],
    record = entry['map']((payload) => prepareAssetNodeForRestore(next, payload));
  return shouldTopAlignRestoredAsset(record, next?.['edges'])
    ? createTopAlignedAssetNodes(record, current)
    : record;
}
