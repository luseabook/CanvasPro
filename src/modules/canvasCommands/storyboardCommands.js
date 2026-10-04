import { findAvailablePosition, generateId } from '../../core/math.js';
import {
  buildQuickCreateStoryboardCells,
  buildStoryboardNodePayload,
  computeQuickCreateStoryboardSize,
  computePreparedStoryboardSize,
  resolveNearestStoryboardAspect,
  resolveStoryboardSourceImageRef,
} from '../../core/storyboardFactory.js';
import { calcSafeSpawnPosNearNode } from '../nodeSpawn.js';
import { createCanvasCommandError } from './commandRegistry.js';
const IMAGE_NODE_TYPES = new Set(['source-image', 'ai-image', 'image']),
  MAX_STORYBOARD_CELLS = 0x64;
function getState(value) {
  return value['store']?.['getStateRaw']?.() || value['store']?.['getState']?.() || {};
}
function getStore(item) {
  return item['graphStore'] || item['store'];
}
function getNode(key, index) {
  const result = String(index || '')['trim']();
  return result ? getState(key)['nodes']?.[result] || null : null;
}
function getSelectedNodeIds(data) {
  const list = getState(data)['selectedNodeIds'];
  return Array['isArray'](list)
    ? list['map']((options) => String(options || '')['trim']())['filter'](Boolean)
    : [];
}
function isImageNode(target) {
  return IMAGE_NODE_TYPES['has'](String(target?.['type'] || '')['trim']());
}
function trimString(source) {
  return typeof source === 'string' ? source['trim']() : '';
}
function firstString(...args) {
  for (const next of args) {
    const trimString2 = trimString(next);
    if (trimString2) return trimString2;
  }
  return '';
}
function positiveNumber(...args2) {
  for (const current of args2) {
    const count = Number(current);
    if (Number['isFinite'](count) && count > 0x0) return count;
  }
  return 0x0;
}
function positiveInt(entry, record, { min: min = 0x1, max: max = 0xc } = {}) {
  const payload = Number(entry),
    handle = Number['isFinite'](payload) ? Math['trunc'](payload) : record;
  return Math['max'](min, Math['min'](max, handle));
}
function pickMainImage(options2 = {}) {
  const list2 = Array['isArray'](options2['images']) ? options2['images'] : [];
  if (list2['length'] === 0x0) return null;
  const state = Math['max'](0x0, Math['trunc'](Number(options2['mainImageIndex']) || 0x0));
  return list2[state] || list2[0x0] || null;
}
function resolveImageNodeAsset(box = {}) {
  const box2 = pickMainImage(box) || {},
    localPath = firstString(
      box2['localPath'],
      box2['originalLocalPath'],
      box2['displayLocalPath'],
      box['localPath'],
      box['originalLocalPath'],
      box['displayLocalPath'],
    ),
    thumbLocalPath = firstString(box2['thumbLocalPath'], box['thumbLocalPath']),
    string = firstString(
      box2['imageUrl'],
      box2['url'],
      box2['sourceUrl'],
      box2['thumbUrl'],
      box2['capturePreviewUrl'],
      box['imageUrl'],
      box['url'],
      box['sourceUrl'],
      box['src'],
      box['thumbUrl'],
      box['capturePreviewUrl'],
    ),
    width = positiveNumber(
      box2['originalWidth'],
      box2['imageWidth'],
      box2['width'],
      box2['naturalWidth'],
      box['originalWidth'],
      box['imageWidth'],
      box['imgWidth'],
      box['naturalWidth'],
      box['width'],
    ),
    height = positiveNumber(
      box2['originalHeight'],
      box2['imageHeight'],
      box2['height'],
      box2['naturalHeight'],
      box['originalHeight'],
      box['imageHeight'],
      box['imgHeight'],
      box['naturalHeight'],
      box['height'],
    );
  return {
    localPath: localPath,
    thumbLocalPath: thumbLocalPath,
    url: localPath ? '' : string,
    width: width,
    height: height,
    hasAsset: Boolean(localPath || thumbLocalPath || string),
  };
}
function resolveStoryboardSourceIds(options3 = {}, config = {}) {
  const scope = Array['isArray'](options3['ids']) && options3['ids']['length'] > 0x0,
    input = Boolean(String(options3['nodeId'] || '')['trim']()),
    output = scope
      ? options3['ids']
      : input
        ? [options3['nodeId']]
        : getSelectedNodeIds(config)['filter']((value2) => isImageNode(getNode(config, value2))),
    count2 = [],
    map = new Set();
  for (const value3 of output) {
    const nodeId = String(value3 || '')['trim']();
    if (!nodeId || map['has'](nodeId)) continue;
    const nodeType = getNode(config, nodeId);
    if (!nodeType)
      throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas\x20node\x20not\x20found:\x20' + nodeId, {
        nodeId: nodeId,
      });
    if (!isImageNode(nodeType))
      throw createCanvasCommandError(
        'UNSUPPORTED_NODE_TYPE',
        'storyboard.createFromImages does not support node type: ' + (nodeType['type'] || '(unknown)'),
        { nodeId: nodeId, nodeType: nodeType['type'] },
      );
    (count2['push'](nodeId), map['add'](nodeId));
  }
  if (count2['length'] === 0x0)
    throw createCanvasCommandError(
      'MISSING_IMAGE_NODES',
      'storyboard.createFromImages requires image node ids or selected image nodes.',
    );
  if (count2['length'] > MAX_STORYBOARD_CELLS)
    throw createCanvasCommandError(
      'TOO_MANY_STORYBOARD_CELLS',
      'storyboard.createFromImages supports up to ' + MAX_STORYBOARD_CELLS + ' image nodes.',
      { count: count2['length'], max: MAX_STORYBOARD_CELLS },
    );
  return count2;
}
function normalizeOrder(value4 = '') {
  const value5 = String(value4 || '')
    ['trim']()
    ['toLowerCase']();
  if (value5 === 'visual' || value5 === 'grid' || value5 === 'reading') return 'visual';
  if (value5 === 'left-to-right' || value5 === 'x' || value5 === 'horizontal') return 'left-to-right';
  if (value5 === 'top-to-bottom' || value5 === 'y' || value5 === 'vertical') return 'top-to-bottom';
  return 'selection';
}
function sortImageIds(list3 = [], value6 = {}, value7 = 'selection') {
  const order = normalizeOrder(value7);
  if (order === 'selection' || list3['length'] <= 0x1) return list3;
  const state2 = getState(value6)['nodes'] || {};
  return [...list3]['sort']((value8, value9) => {
    const box3 = state2[value8] || {},
      box4 = state2[value9] || {},
      value10 = Number(box3['x']) || 0x0,
      value11 = Number(box3['y']) || 0x0,
      value12 = Number(box4['x']) || 0x0,
      value13 = Number(box4['y']) || 0x0;
    if (order === 'left-to-right') return value10 - value12 || value11 - value13;
    if (order === 'top-to-bottom') return value11 - value13 || value10 - value12;
    return value11 - value13 || value10 - value12;
  });
}
function resolveGrid(options4 = {}, value14 = 0x1) {
  const value15 =
      Object['prototype']['hasOwnProperty']['call'](options4, 'cols') ||
      Object['prototype']['hasOwnProperty']['call'](options4, 'columns'),
    value16 = Object['prototype']['hasOwnProperty']['call'](options4, 'rows');
  let cols = value15 ? positiveInt(options4['cols'] ?? options4['columns'], 0x0) : 0x0,
    rows = value16 ? positiveInt(options4['rows'], 0x0) : 0x0;
  if (!cols && !rows)
    ((cols = Math['max'](0x1, Math['ceil'](Math['sqrt'](value14)))),
      (rows = Math['max'](0x1, Math['ceil'](value14 / cols))));
  else {
    if (cols && !rows) rows = Math['max'](0x1, Math['ceil'](value14 / cols));
    else {
      if (!cols && rows) cols = Math['max'](0x1, Math['ceil'](value14 / rows));
      else cols * rows < value14 && (rows = Math['max'](rows, Math['ceil'](value14 / cols)));
    }
  }
  return { cols: cols, rows: rows };
}
function buildStoryboardCells(id, list4 = [], value17 = {}, value18 = list4['length']) {
  const list5 = [];
  for (let value19 = 0x0; value19 < value18; value19 += 0x1) {
    const nodeId2 = list4[value19] || '',
      enabled = nodeId2 ? getNode(value17, nodeId2) : null;
    if (!enabled) {
      list5['push']({ id: id + '-cell-' + (value19 + 0x1), url: '', isEmpty: !![] });
      continue;
    }
    const localPath2 = resolveImageNodeAsset(enabled);
    if (!localPath2['hasAsset'])
      throw createCanvasCommandError(
        'IMAGE_ASSET_NOT_FOUND',
        'Image node has no usable local path or URL: ' + nodeId2,
        { nodeId: nodeId2 },
      );
    list5['push']({
      id: id + '-cell-' + (value19 + 0x1),
      localPath: localPath2['localPath'] || null,
      thumbLocalPath: localPath2['thumbLocalPath'] || null,
      url: localPath2['url'],
      originalWidth: localPath2['width'] || null,
      originalHeight: localPath2['height'] || null,
      imageWidth: localPath2['width'] || null,
      imageHeight: localPath2['height'] || null,
      storyboardSourceNodeId: nodeId2,
      storyboardExtractedCell: !![],
      storyboardLockedCell: !![],
      isEmpty: ![],
    });
  }
  return list5;
}
function getFirstAssetSize(list6 = [], value20 = {}) {
  for (const value21 of list6) {
    const width2 = resolveImageNodeAsset(getNode(value20, value21) || {});
    if (width2['width'] > 0x0 && width2['height'] > 0x0)
      return { width: width2['width'], height: width2['height'] };
  }
  return { width: 0x1, height: 0x1 };
}
function resolveStoryboardPosition(box5 = {}, value22 = {}, box6 = {}, value23 = []) {
  const x = Number(box5['x']),
    y = Number(box5['y']);
  if (Number['isFinite'](x) && Number['isFinite'](y)) return { x: x, y: y };
  const state3 = getState(value22)['nodes'] || {},
    box7 = getNode(value22, value23[0x0]) || {},
    value24 = (Number(box7['x']) || 0x0) + Math['max'](0x0, Number(box7['width']) || 0x0) + 0x50,
    value25 = Number(box7['y']) || 0x0;
  return findAvailablePosition(
    state3,
    value24,
    value25,
    Math['max'](0x1, Number(box6['width']) || 0x1),
    Math['max'](0x1, Number(box6['height']) || 0x1),
    0x28,
    'right',
  );
}
export function registerStoryboardCommands(value26) {
  (value26['register']({
    id: 'storyboard.createFromImages',
    description: 'Create\x20a\x20storyboard\x20node\x20from\x20existing\x20image\x20nodes.',
    riskLevel: 'safe',
    argsSchema: {
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
        nodeId: { type: 'string' },
        name: { type: 'string' },
        cols: { type: 'number' },
        columns: { type: 'number' },
        rows: { type: 'number' },
        orderBy: { type: 'string' },
        x: { type: 'number' },
        y: { type: 'number' },
      },
      defaults: { orderBy: 'selection', placement: 'right-of-first-image' },
      selectionFallback: !![],
    },
    capabilitySchema: {
      reads: ['nodes', 'selection'],
      writes: ['nodes', 'selection'],
      selectionFallback: !![],
      requiresMountedRuntime: ![],
    },
    returnSchema: { aliasFields: ['nodeId', 'node', 'sourceNodeIds', 'cols', 'rows', 'cellCount'] },
    validate(error = {}, value27 = {}) {
      try {
        const ids = sortImageIds(resolveStoryboardSourceIds(error, value27), value27, error['orderBy']),
          cols2 = resolveGrid(error, ids['length']);
        return {
          args: {
            ...error,
            ids: ids,
            cols: cols2['cols'],
            rows: cols2['rows'],
            name: String(error['name'] || 'Storyboard')['trim']() || 'Storyboard',
          },
        };
      } catch (errorCode) {
        return {
          ok: ![],
          errorCode: errorCode['errorCode'] || 'INVALID_STORYBOARD_IMAGES',
          message: errorCode['message'] || 'Invalid storyboard image nodes.',
          details: errorCode['details'],
        };
      }
    },
    execute(cols3, store) {
      const store2 = getStore(store),
        id2 = generateId('storyboard'),
        sourceWidth = getFirstAssetSize(cols3['ids'], store),
        aspectLabel = resolveNearestStoryboardAspect(sourceWidth['width'], sourceWidth['height']),
        width3 = computePreparedStoryboardSize({
          aspectLabel: aspectLabel,
          cols: cols3['cols'],
          rows: cols3['rows'],
          sourceWidth: sourceWidth['width'],
          sourceHeight: sourceWidth['height'],
        }),
        x2 = resolveStoryboardPosition(cols3, store, width3, cols3['ids']),
        cells = buildStoryboardCells(id2, cols3['ids'], store, cols3['cols'] * cols3['rows']),
        node = buildStoryboardNodePayload({
          id: id2,
          name: cols3['name'],
          x: x2['x'],
          y: x2['y'],
          width: width3['width'],
          height: width3['height'],
          cols: cols3['cols'],
          rows: cols3['rows'],
          aspectRatio: aspectLabel,
          cells: cells,
          isEditing: ![],
        }),
        handler = () => {
          (store2?.['addNode']?.(node), store2?.['setSelectedNodes']?.([id2]));
        };
      if (typeof store2?.['batch'] === 'function') store2['batch'](handler);
      else handler();
      return (
        store['commit']?.(),
        {
          nodeId: id2,
          node: node,
          sourceNodeIds: [...cols3['ids']],
          cols: cols3['cols'],
          rows: cols3['rows'],
          cellCount: cells['length'],
        }
      );
    },
  }),
    value26['register']({
      id: 'storyboard.createGridFromNode',
      description: 'Create a repeated-image storyboard grid next to one canvas node.',
      riskLevel: 'safe',
      argsSchema: {
        required: ['sourceId', 'cols', 'rows'],
        properties: {
          sourceId: { type: 'string' },
          name: { type: 'string' },
          cols: { type: 'number' },
          rows: { type: 'number' },
          baseShortSide: { type: 'number' },
        },
        defaults: { baseShortSide: 0x190, placement: 'right-of-source' },
      },
      capabilitySchema: { reads: ['nodes'], writes: ['nodes', 'selection'] },
      returnSchema: { aliasFields: ['nodeId', 'node', 'sourceId', 'cols', 'rows', 'cellCount'] },
      validate(error2 = {}, value28 = {}) {
        const sourceId = String(error2['sourceId'] || '')['trim'](),
          node2 = getNode(value28, sourceId);
        if (!sourceId || !node2)
          return {
            ok: ![],
            errorCode: 'NODE_NOT_FOUND',
            message: 'Canvas node not found: ' + (sourceId || '(empty)'),
          };
        if (!resolveStoryboardSourceImageRef(node2))
          return {
            ok: ![],
            errorCode: 'IMAGE_ASSET_NOT_FOUND',
            message: 'Canvas\x20node\x20has\x20no\x20storyboard-compatible\x20image:\x20' + sourceId,
          };
        return {
          args: {
            ...error2,
            sourceId: sourceId,
            name: String(error2['name'] || 'Storyboard')['trim']() || 'Storyboard',
            cols: positiveInt(error2['cols'], 0x2),
            rows: positiveInt(error2['rows'], 0x2),
            baseShortSide: positiveNumber(error2['baseShortSide'], 0x190),
          },
        };
      },
      execute(baseShortSide, store3) {
        const store4 = getStore(store3),
          sourceWidth2 = getNode(store3, baseShortSide['sourceId']),
          imageRef = resolveStoryboardSourceImageRef(sourceWidth2),
          id3 = generateId('storyboard'),
          width4 = computeQuickCreateStoryboardSize({
            sourceWidth: sourceWidth2['width'],
            sourceHeight: sourceWidth2['height'],
            baseShortSide: baseShortSide['baseShortSide'],
          }),
          x3 = calcSafeSpawnPosNearNode(
            getState(store3)['nodes'] || {},
            sourceWidth2,
            width4['width'],
            width4['height'],
          ),
          node3 = buildStoryboardNodePayload({
            id: id3,
            name: baseShortSide['name'],
            x: x3['x'],
            y: x3['y'],
            width: width4['width'],
            height: width4['height'],
            cols: baseShortSide['cols'],
            rows: baseShortSide['rows'],
            aspectRatio: resolveNearestStoryboardAspect(sourceWidth2['width'], sourceWidth2['height']),
            cells: buildQuickCreateStoryboardCells({
              cols: baseShortSide['cols'],
              rows: baseShortSide['rows'],
              imageRef: imageRef,
            }),
          });
        return (
          store4?.['addNode']?.(node3),
          store4?.['setSelectedNodes']?.([id3]),
          store3['commit']?.(),
          {
            nodeId: id3,
            node: node3,
            sourceId: baseShortSide['sourceId'],
            cols: baseShortSide['cols'],
            rows: baseShortSide['rows'],
            cellCount: node3['cells']['length'],
          }
        );
      },
    }));
}
