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
function getState(_0x5699b0) {
  return _0x5699b0['store']?.['getStateRaw']?.() || _0x5699b0['store']?.['getState']?.() || {};
}
function getStore(_0x5b9c20) {
  return _0x5b9c20['graphStore'] || _0x5b9c20['store'];
}
function getNode(_0x1cc97f, _0x56c624) {
  const _0x4c4721 = String(_0x56c624 || '')['trim']();
  return _0x4c4721 ? getState(_0x1cc97f)['nodes']?.[_0x4c4721] || null : null;
}
function getSelectedNodeIds(_0x2944e5) {
  const _0x3781df = getState(_0x2944e5)['selectedNodeIds'];
  return Array['isArray'](_0x3781df)
    ? _0x3781df['map']((_0x55d699) => String(_0x55d699 || '')['trim']())['filter'](Boolean)
    : [];
}
function isImageNode(_0x5221aa) {
  return IMAGE_NODE_TYPES['has'](String(_0x5221aa?.['type'] || '')['trim']());
}
function trimString(_0x484f70) {
  return typeof _0x484f70 === 'string' ? _0x484f70['trim']() : '';
}
function firstString(..._0x6b7b5) {
  for (const _0x34396f of _0x6b7b5) {
    const _0x5e798c = trimString(_0x34396f);
    if (_0x5e798c) return _0x5e798c;
  }
  return '';
}
function positiveNumber(..._0x9b843c) {
  for (const _0x411ecc of _0x9b843c) {
    const _0x2ca6cb = Number(_0x411ecc);
    if (Number['isFinite'](_0x2ca6cb) && _0x2ca6cb > 0x0) return _0x2ca6cb;
  }
  return 0x0;
}
function positiveInt(_0x2fef1c, _0xcacdaf, { min: min = 0x1, max: max = 0xc } = {}) {
  const _0x58230c = Number(_0x2fef1c),
    _0x4ae192 = Number['isFinite'](_0x58230c) ? Math['trunc'](_0x58230c) : _0xcacdaf;
  return Math['max'](min, Math['min'](max, _0x4ae192));
}
function pickMainImage(_0x160e63 = {}) {
  const _0x3ba296 = Array['isArray'](_0x160e63['images']) ? _0x160e63['images'] : [];
  if (_0x3ba296['length'] === 0x0) return null;
  const _0x44cfcf = Math['max'](0x0, Math['trunc'](Number(_0x160e63['mainImageIndex']) || 0x0));
  return _0x3ba296[_0x44cfcf] || _0x3ba296[0x0] || null;
}
function resolveImageNodeAsset(_0x531111 = {}) {
  const _0x614ef9 = pickMainImage(_0x531111) || {},
    _0x263edb = firstString(
      _0x614ef9['localPath'],
      _0x614ef9['originalLocalPath'],
      _0x614ef9['displayLocalPath'],
      _0x531111['localPath'],
      _0x531111['originalLocalPath'],
      _0x531111['displayLocalPath'],
    ),
    _0x459c1a = firstString(_0x614ef9['thumbLocalPath'], _0x531111['thumbLocalPath']),
    _0x337876 = firstString(
      _0x614ef9['imageUrl'],
      _0x614ef9['url'],
      _0x614ef9['sourceUrl'],
      _0x614ef9['thumbUrl'],
      _0x614ef9['capturePreviewUrl'],
      _0x531111['imageUrl'],
      _0x531111['url'],
      _0x531111['sourceUrl'],
      _0x531111['src'],
      _0x531111['thumbUrl'],
      _0x531111['capturePreviewUrl'],
    ),
    _0x393f7f = positiveNumber(
      _0x614ef9['originalWidth'],
      _0x614ef9['imageWidth'],
      _0x614ef9['width'],
      _0x614ef9['naturalWidth'],
      _0x531111['originalWidth'],
      _0x531111['imageWidth'],
      _0x531111['imgWidth'],
      _0x531111['naturalWidth'],
      _0x531111['width'],
    ),
    _0x573bb6 = positiveNumber(
      _0x614ef9['originalHeight'],
      _0x614ef9['imageHeight'],
      _0x614ef9['height'],
      _0x614ef9['naturalHeight'],
      _0x531111['originalHeight'],
      _0x531111['imageHeight'],
      _0x531111['imgHeight'],
      _0x531111['naturalHeight'],
      _0x531111['height'],
    );
  return {
    localPath: _0x263edb,
    thumbLocalPath: _0x459c1a,
    url: _0x263edb ? '' : _0x337876,
    width: _0x393f7f,
    height: _0x573bb6,
    hasAsset: Boolean(_0x263edb || _0x459c1a || _0x337876),
  };
}
function resolveStoryboardSourceIds(_0x4faece = {}, _0x520252 = {}) {
  const _0x460cfe = Array['isArray'](_0x4faece['ids']) && _0x4faece['ids']['length'] > 0x0,
    _0x291750 = Boolean(String(_0x4faece['nodeId'] || '')['trim']()),
    _0x45f8e7 = _0x460cfe
      ? _0x4faece['ids']
      : _0x291750
        ? [_0x4faece['nodeId']]
        : getSelectedNodeIds(_0x520252)['filter']((_0x1f7ebc) => isImageNode(getNode(_0x520252, _0x1f7ebc))),
    _0x4144d8 = [],
    _0x45285d = new Set();
  for (const _0xd6a6cf of _0x45f8e7) {
    const _0x3682cd = String(_0xd6a6cf || '')['trim']();
    if (!_0x3682cd || _0x45285d['has'](_0x3682cd)) continue;
    const _0x115451 = getNode(_0x520252, _0x3682cd);
    if (!_0x115451)
      throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas\x20node\x20not\x20found:\x20' + _0x3682cd, {
        nodeId: _0x3682cd,
      });
    if (!isImageNode(_0x115451))
      throw createCanvasCommandError(
        'UNSUPPORTED_NODE_TYPE',
        'storyboard.createFromImages does not support node type: ' + (_0x115451['type'] || '(unknown)'),
        { nodeId: _0x3682cd, nodeType: _0x115451['type'] },
      );
    (_0x4144d8['push'](_0x3682cd), _0x45285d['add'](_0x3682cd));
  }
  if (_0x4144d8['length'] === 0x0)
    throw createCanvasCommandError(
      'MISSING_IMAGE_NODES',
      'storyboard.createFromImages requires image node ids or selected image nodes.',
    );
  if (_0x4144d8['length'] > MAX_STORYBOARD_CELLS)
    throw createCanvasCommandError(
      'TOO_MANY_STORYBOARD_CELLS',
      'storyboard.createFromImages supports up to ' + MAX_STORYBOARD_CELLS + ' image nodes.',
      { count: _0x4144d8['length'], max: MAX_STORYBOARD_CELLS },
    );
  return _0x4144d8;
}
function normalizeOrder(_0x76cba0 = '') {
  const _0x38c4a4 = String(_0x76cba0 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x38c4a4 === 'visual' || _0x38c4a4 === 'grid' || _0x38c4a4 === 'reading') return 'visual';
  if (_0x38c4a4 === 'left-to-right' || _0x38c4a4 === 'x' || _0x38c4a4 === 'horizontal')
    return 'left-to-right';
  if (_0x38c4a4 === 'top-to-bottom' || _0x38c4a4 === 'y' || _0x38c4a4 === 'vertical') return 'top-to-bottom';
  return 'selection';
}
function sortImageIds(_0x4f9a31 = [], _0x2be442 = {}, _0x219822 = 'selection') {
  const _0x55e545 = normalizeOrder(_0x219822);
  if (_0x55e545 === 'selection' || _0x4f9a31['length'] <= 0x1) return _0x4f9a31;
  const _0x3498da = getState(_0x2be442)['nodes'] || {};
  return [..._0x4f9a31]['sort']((_0x1f2af4, _0x5a79f0) => {
    const _0x347e24 = _0x3498da[_0x1f2af4] || {},
      _0x3ad091 = _0x3498da[_0x5a79f0] || {},
      _0x1a7ff8 = Number(_0x347e24['x']) || 0x0,
      _0x4af5e3 = Number(_0x347e24['y']) || 0x0,
      _0x2fde38 = Number(_0x3ad091['x']) || 0x0,
      _0x4bb92a = Number(_0x3ad091['y']) || 0x0;
    if (_0x55e545 === 'left-to-right') return _0x1a7ff8 - _0x2fde38 || _0x4af5e3 - _0x4bb92a;
    if (_0x55e545 === 'top-to-bottom') return _0x4af5e3 - _0x4bb92a || _0x1a7ff8 - _0x2fde38;
    return _0x4af5e3 - _0x4bb92a || _0x1a7ff8 - _0x2fde38;
  });
}
function resolveGrid(_0x525468 = {}, _0x4c8401 = 0x1) {
  const _0x4c3bbc =
      Object['prototype']['hasOwnProperty']['call'](_0x525468, 'cols') ||
      Object['prototype']['hasOwnProperty']['call'](_0x525468, 'columns'),
    _0x50665c = Object['prototype']['hasOwnProperty']['call'](_0x525468, 'rows');
  let _0x7153ed = _0x4c3bbc ? positiveInt(_0x525468['cols'] ?? _0x525468['columns'], 0x0) : 0x0,
    _0x18687e = _0x50665c ? positiveInt(_0x525468['rows'], 0x0) : 0x0;
  if (!_0x7153ed && !_0x18687e)
    ((_0x7153ed = Math['max'](0x1, Math['ceil'](Math['sqrt'](_0x4c8401)))),
      (_0x18687e = Math['max'](0x1, Math['ceil'](_0x4c8401 / _0x7153ed))));
  else {
    if (_0x7153ed && !_0x18687e) _0x18687e = Math['max'](0x1, Math['ceil'](_0x4c8401 / _0x7153ed));
    else {
      if (!_0x7153ed && _0x18687e) _0x7153ed = Math['max'](0x1, Math['ceil'](_0x4c8401 / _0x18687e));
      else
        _0x7153ed * _0x18687e < _0x4c8401 &&
          (_0x18687e = Math['max'](_0x18687e, Math['ceil'](_0x4c8401 / _0x7153ed)));
    }
  }
  return { cols: _0x7153ed, rows: _0x18687e };
}
function buildStoryboardCells(_0xafbf73, _0xccaab7 = [], _0x5861ad = {}, _0x5e3730 = _0xccaab7['length']) {
  const _0x3bff7f = [];
  for (let _0x3ec3be = 0x0; _0x3ec3be < _0x5e3730; _0x3ec3be += 0x1) {
    const _0x3a4d64 = _0xccaab7[_0x3ec3be] || '',
      _0x3941a8 = _0x3a4d64 ? getNode(_0x5861ad, _0x3a4d64) : null;
    if (!_0x3941a8) {
      _0x3bff7f['push']({ id: _0xafbf73 + '-cell-' + (_0x3ec3be + 0x1), url: '', isEmpty: !![] });
      continue;
    }
    const _0x505b80 = resolveImageNodeAsset(_0x3941a8);
    if (!_0x505b80['hasAsset'])
      throw createCanvasCommandError(
        'IMAGE_ASSET_NOT_FOUND',
        'Image node has no usable local path or URL: ' + _0x3a4d64,
        { nodeId: _0x3a4d64 },
      );
    _0x3bff7f['push']({
      id: _0xafbf73 + '-cell-' + (_0x3ec3be + 0x1),
      localPath: _0x505b80['localPath'] || null,
      thumbLocalPath: _0x505b80['thumbLocalPath'] || null,
      url: _0x505b80['url'],
      originalWidth: _0x505b80['width'] || null,
      originalHeight: _0x505b80['height'] || null,
      imageWidth: _0x505b80['width'] || null,
      imageHeight: _0x505b80['height'] || null,
      storyboardSourceNodeId: _0x3a4d64,
      storyboardExtractedCell: !![],
      storyboardLockedCell: !![],
      isEmpty: ![],
    });
  }
  return _0x3bff7f;
}
function getFirstAssetSize(_0x31ea6b = [], _0x122fc4 = {}) {
  for (const _0x4ee75f of _0x31ea6b) {
    const _0x40c2e5 = resolveImageNodeAsset(getNode(_0x122fc4, _0x4ee75f) || {});
    if (_0x40c2e5['width'] > 0x0 && _0x40c2e5['height'] > 0x0)
      return { width: _0x40c2e5['width'], height: _0x40c2e5['height'] };
  }
  return { width: 0x1, height: 0x1 };
}
function resolveStoryboardPosition(_0x1fc9b9 = {}, _0x3342c3 = {}, _0x591ea5 = {}, _0x147272 = []) {
  const _0x1260f4 = Number(_0x1fc9b9['x']),
    _0x2dfb1e = Number(_0x1fc9b9['y']);
  if (Number['isFinite'](_0x1260f4) && Number['isFinite'](_0x2dfb1e)) return { x: _0x1260f4, y: _0x2dfb1e };
  const _0x10979b = getState(_0x3342c3)['nodes'] || {},
    _0x1a2615 = getNode(_0x3342c3, _0x147272[0x0]) || {},
    _0x310518 = (Number(_0x1a2615['x']) || 0x0) + Math['max'](0x0, Number(_0x1a2615['width']) || 0x0) + 0x50,
    _0x276e8f = Number(_0x1a2615['y']) || 0x0;
  return findAvailablePosition(
    _0x10979b,
    _0x310518,
    _0x276e8f,
    Math['max'](0x1, Number(_0x591ea5['width']) || 0x1),
    Math['max'](0x1, Number(_0x591ea5['height']) || 0x1),
    0x28,
    'right',
  );
}
export function registerStoryboardCommands(_0x355f20) {
  (_0x355f20['register']({
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
    validate(_0x464137 = {}, _0x556d2e = {}) {
      try {
        const _0xdd2263 = sortImageIds(
            resolveStoryboardSourceIds(_0x464137, _0x556d2e),
            _0x556d2e,
            _0x464137['orderBy'],
          ),
          _0x22bd9f = resolveGrid(_0x464137, _0xdd2263['length']);
        return {
          args: {
            ..._0x464137,
            ids: _0xdd2263,
            cols: _0x22bd9f['cols'],
            rows: _0x22bd9f['rows'],
            name: String(_0x464137['name'] || 'Storyboard')['trim']() || 'Storyboard',
          },
        };
      } catch (_0xc4dd73) {
        return {
          ok: ![],
          errorCode: _0xc4dd73['errorCode'] || 'INVALID_STORYBOARD_IMAGES',
          message: _0xc4dd73['message'] || 'Invalid storyboard image nodes.',
          details: _0xc4dd73['details'],
        };
      }
    },
    execute(_0x433c46, _0x4624d5) {
      const _0x22c492 = getStore(_0x4624d5),
        _0x2e24d7 = generateId('storyboard'),
        _0x358b0c = getFirstAssetSize(_0x433c46['ids'], _0x4624d5),
        _0x548bf1 = resolveNearestStoryboardAspect(_0x358b0c['width'], _0x358b0c['height']),
        _0x4a5ea0 = computePreparedStoryboardSize({
          aspectLabel: _0x548bf1,
          cols: _0x433c46['cols'],
          rows: _0x433c46['rows'],
          sourceWidth: _0x358b0c['width'],
          sourceHeight: _0x358b0c['height'],
        }),
        _0x464707 = resolveStoryboardPosition(_0x433c46, _0x4624d5, _0x4a5ea0, _0x433c46['ids']),
        _0x957dad = buildStoryboardCells(
          _0x2e24d7,
          _0x433c46['ids'],
          _0x4624d5,
          _0x433c46['cols'] * _0x433c46['rows'],
        ),
        _0xe50fa8 = buildStoryboardNodePayload({
          id: _0x2e24d7,
          name: _0x433c46['name'],
          x: _0x464707['x'],
          y: _0x464707['y'],
          width: _0x4a5ea0['width'],
          height: _0x4a5ea0['height'],
          cols: _0x433c46['cols'],
          rows: _0x433c46['rows'],
          aspectRatio: _0x548bf1,
          cells: _0x957dad,
          isEditing: ![],
        }),
        _0x1901a8 = () => {
          (_0x22c492?.['addNode']?.(_0xe50fa8), _0x22c492?.['setSelectedNodes']?.([_0x2e24d7]));
        };
      if (typeof _0x22c492?.['batch'] === 'function') _0x22c492['batch'](_0x1901a8);
      else _0x1901a8();
      return (
        _0x4624d5['commit']?.(),
        {
          nodeId: _0x2e24d7,
          node: _0xe50fa8,
          sourceNodeIds: [..._0x433c46['ids']],
          cols: _0x433c46['cols'],
          rows: _0x433c46['rows'],
          cellCount: _0x957dad['length'],
        }
      );
    },
  }),
    _0x355f20['register']({
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
      validate(_0x159af9 = {}, _0x277ffd = {}) {
        const _0x51a5d4 = String(_0x159af9['sourceId'] || '')['trim'](),
          _0x59dc6e = getNode(_0x277ffd, _0x51a5d4);
        if (!_0x51a5d4 || !_0x59dc6e)
          return {
            ok: ![],
            errorCode: 'NODE_NOT_FOUND',
            message: 'Canvas node not found: ' + (_0x51a5d4 || '(empty)'),
          };
        if (!resolveStoryboardSourceImageRef(_0x59dc6e))
          return {
            ok: ![],
            errorCode: 'IMAGE_ASSET_NOT_FOUND',
            message: 'Canvas\x20node\x20has\x20no\x20storyboard-compatible\x20image:\x20' + _0x51a5d4,
          };
        return {
          args: {
            ..._0x159af9,
            sourceId: _0x51a5d4,
            name: String(_0x159af9['name'] || 'Storyboard')['trim']() || 'Storyboard',
            cols: positiveInt(_0x159af9['cols'], 0x2),
            rows: positiveInt(_0x159af9['rows'], 0x2),
            baseShortSide: positiveNumber(_0x159af9['baseShortSide'], 0x190),
          },
        };
      },
      execute(_0x417772, _0x33070e) {
        const _0x2636b6 = getStore(_0x33070e),
          _0x426bff = getNode(_0x33070e, _0x417772['sourceId']),
          _0x58a19d = resolveStoryboardSourceImageRef(_0x426bff),
          _0x1dc4a3 = generateId('storyboard'),
          _0x384f0a = computeQuickCreateStoryboardSize({
            sourceWidth: _0x426bff['width'],
            sourceHeight: _0x426bff['height'],
            baseShortSide: _0x417772['baseShortSide'],
          }),
          _0x1a60a7 = calcSafeSpawnPosNearNode(
            getState(_0x33070e)['nodes'] || {},
            _0x426bff,
            _0x384f0a['width'],
            _0x384f0a['height'],
          ),
          _0x3d6287 = buildStoryboardNodePayload({
            id: _0x1dc4a3,
            name: _0x417772['name'],
            x: _0x1a60a7['x'],
            y: _0x1a60a7['y'],
            width: _0x384f0a['width'],
            height: _0x384f0a['height'],
            cols: _0x417772['cols'],
            rows: _0x417772['rows'],
            aspectRatio: resolveNearestStoryboardAspect(_0x426bff['width'], _0x426bff['height']),
            cells: buildQuickCreateStoryboardCells({
              cols: _0x417772['cols'],
              rows: _0x417772['rows'],
              imageRef: _0x58a19d,
            }),
          });
        return (
          _0x2636b6?.['addNode']?.(_0x3d6287),
          _0x2636b6?.['setSelectedNodes']?.([_0x1dc4a3]),
          _0x33070e['commit']?.(),
          {
            nodeId: _0x1dc4a3,
            node: _0x3d6287,
            sourceId: _0x417772['sourceId'],
            cols: _0x417772['cols'],
            rows: _0x417772['rows'],
            cellCount: _0x3d6287['cells']['length'],
          }
        );
      },
    }));
}
