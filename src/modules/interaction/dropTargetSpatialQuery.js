import { createNodeSpatialIndex, queryNodeSpatialIndexAtWorldPoint } from '../../core/math.js';
import { getStoryboardCellMetrics } from '../../core/storyboardCellUtils.js';
import { resolveCollageItemFrames } from '../collage/collageFactory.js';
export function createDropTargetSpatialQuery() {
  let _0x2967ab, _0x5654ab, _0x2601d7;
  return (_0x23c69e, _0x2c68ae, _0x14ba0b) => {
    const _0x1f1877 = _0x23c69e['nodes'] || {},
      _0x113e46 = _0x23c69e['_persistRev'];
    return (
      (!_0x2601d7 || _0x2967ab !== _0x1f1877 || _0x5654ab !== _0x113e46 || !Number['isFinite'](_0x113e46)) &&
        ((_0x2601d7 = createNodeSpatialIndex(_0x1f1877, {
          resolveRect(_0x17e33a) {
            if (_0x17e33a?.['type'] === 'storyboard')
              return { x: _0x17e33a['x'], y: _0x17e33a['y'], ...getStoryboardCellMetrics(_0x17e33a) };
            if (_0x17e33a?.['type'] !== 'collage') return null;
            const _0x369935 = resolveCollageItemFrames(_0x17e33a)
              ['map']((_0x519d97) => _0x519d97['frame'])
              ['filter'](Boolean);
            if (!_0x369935['length']) return null;
            const _0x1ba8f9 = Math['min'](..._0x369935['map']((_0x13a3c2) => _0x13a3c2['x'])),
              _0x511ba0 = Math['min'](..._0x369935['map']((_0x36f7df) => _0x36f7df['y']));
            return {
              x: (Number(_0x17e33a['x']) || 0x0) + _0x1ba8f9,
              y: (Number(_0x17e33a['y']) || 0x0) + _0x511ba0,
              width:
                Math['max'](..._0x369935['map']((_0x4a5c42) => _0x4a5c42['x'] + _0x4a5c42['width'])) -
                _0x1ba8f9,
              height:
                Math['max'](..._0x369935['map']((_0x5dd3c4) => _0x5dd3c4['y'] + _0x5dd3c4['height'])) -
                _0x511ba0,
            };
          },
        })),
        (_0x2967ab = _0x1f1877),
        (_0x5654ab = _0x113e46)),
      queryNodeSpatialIndexAtWorldPoint(_0x2601d7, _0x2c68ae, _0x14ba0b)
        ['map']((_0x347893) => _0x1f1877[_0x347893])
        ['filter'](Boolean)
    );
  };
}
