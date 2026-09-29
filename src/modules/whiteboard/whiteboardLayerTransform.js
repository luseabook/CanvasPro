import { getArrowGeometry } from '../imageAnnotate/arrowGeometry.js';
import { getWhiteboardShapeBounds } from '../imageAnnotate/whiteboardShapes.js';
import { getPolylineBounds } from './whiteboardInteractionGeometry.js';
export const WHITEBOARD_LAYER_HANDLE_RADIUS_SCREEN = 0xa;
export const WHITEBOARD_LAYER_ROTATE_OFFSET_SCREEN = 0x18;
export const WHITEBOARD_LAYER_MIN_SCALE = 0.05;
export const WHITEBOARD_LAYER_MAX_SCALE = 0x28;
const TRANSFORMABLE_TYPES = new Set(['brush', 'eraser', 'rect', 'shape', 'arrow', 'number-label']),
  GENERIC_RESIZE_TYPES = new Set(['brush', 'eraser', 'rect', 'shape', 'number-label']),
  GENERIC_ROTATE_TYPES = new Set(['brush', 'eraser', 'rect', 'shape']),
  finiteNumberOr = (_0x1bc3c4, _0x58524e = 0x0) => {
    const _0x4cd57a = Number(_0x1bc3c4);
    return Number['isFinite'](_0x4cd57a) ? _0x4cd57a : _0x58524e;
  },
  clamp = (_0x24c5e8, _0xebbbe, _0x4c89ad) => Math['max'](_0xebbbe, Math['min'](_0x4c89ad, _0x24c5e8)),
  rotatePointAround = (_0x456e7b, _0x2d67fa, _0x441db8) => {
    const _0x5955a4 = Math['cos'](finiteNumberOr(_0x441db8)),
      _0x1b3ad2 = Math['sin'](finiteNumberOr(_0x441db8)),
      _0x35f793 = finiteNumberOr(_0x456e7b?.['x']) - finiteNumberOr(_0x2d67fa?.['x']),
      _0x54bb1b = finiteNumberOr(_0x456e7b?.['y']) - finiteNumberOr(_0x2d67fa?.['y']);
    return {
      x: finiteNumberOr(_0x2d67fa?.['x']) + _0x35f793 * _0x5955a4 - _0x54bb1b * _0x1b3ad2,
      y: finiteNumberOr(_0x2d67fa?.['y']) + _0x35f793 * _0x1b3ad2 + _0x54bb1b * _0x5955a4,
    };
  },
  boundsFromPoints = (_0x39ef41, _0x5f5936 = 0x0) => {
    let _0x12cbb4 = Infinity,
      _0x19166a = Infinity,
      _0x2c777d = -Infinity,
      _0x821cb = -Infinity;
    (Array['isArray'](_0x39ef41) ? _0x39ef41 : [])['forEach']((_0x37f10e) => {
      const _0x34de0a = Number(_0x37f10e?.['x']),
        _0xf5d7bc = Number(_0x37f10e?.['y']);
      if (!Number['isFinite'](_0x34de0a) || !Number['isFinite'](_0xf5d7bc)) return;
      ((_0x12cbb4 = Math['min'](_0x12cbb4, _0x34de0a)),
        (_0x19166a = Math['min'](_0x19166a, _0xf5d7bc)),
        (_0x2c777d = Math['max'](_0x2c777d, _0x34de0a)),
        (_0x821cb = Math['max'](_0x821cb, _0xf5d7bc)));
    });
    if (!Number['isFinite'](_0x12cbb4)) return null;
    const _0x1cda65 = Math['max'](0x0, finiteNumberOr(_0x5f5936));
    return {
      x: _0x12cbb4 - _0x1cda65,
      y: _0x19166a - _0x1cda65,
      width: _0x2c777d - _0x12cbb4 + _0x1cda65 * 0x2,
      height: _0x821cb - _0x19166a + _0x1cda65 * 0x2,
    };
  },
  getArrowPathPoints = (_0x59950e) => {
    const _0x41dd41 = getArrowGeometry(_0x59950e);
    if (_0x41dd41['type'] === 'elbow') return _0x41dd41['points'];
    if (_0x41dd41['type'] !== 'arc') return [_0x41dd41['start'], _0x41dd41['end']];
    const _0x5cf52c = [],
      _0x2f6d7c = 0x10;
    for (let _0x501d8e = 0x0; _0x501d8e <= _0x2f6d7c; _0x501d8e += 0x1) {
      const _0x30084e = _0x501d8e / _0x2f6d7c,
        _0x140d40 = _0x41dd41['anticlockwise']
          ? _0x41dd41['startAngle'] - _0x41dd41['sweep'] * _0x30084e
          : _0x41dd41['startAngle'] + _0x41dd41['sweep'] * _0x30084e;
      _0x5cf52c['push']({
        x: _0x41dd41['center']['x'] + Math['cos'](_0x140d40) * _0x41dd41['radius'],
        y: _0x41dd41['center']['y'] + Math['sin'](_0x140d40) * _0x41dd41['radius'],
      });
    }
    return _0x5cf52c;
  },
  getLayerBounds = (_0x52e770) => {
    const _0x48fe2d = Math['max'](0x0, finiteNumberOr(_0x52e770?.['sizeWorld'], 0x1) / 0x2);
    if (_0x52e770?.['type'] === 'brush' || _0x52e770?.['type'] === 'eraser')
      return getPolylineBounds(_0x52e770['points'], _0x48fe2d);
    if (_0x52e770?.['type'] === 'rect' || _0x52e770?.['type'] === 'shape')
      return getWhiteboardShapeBounds(_0x52e770);
    if (_0x52e770?.['type'] === 'arrow') return boundsFromPoints(getArrowPathPoints(_0x52e770), _0x48fe2d);
    if (_0x52e770?.['type'] === 'number-label') {
      const _0x337957 = Math['max'](0x1, finiteNumberOr(_0x52e770['sizeWorld'], 0x12) / 0x2);
      return {
        x: finiteNumberOr(_0x52e770['x']) - _0x337957,
        y: finiteNumberOr(_0x52e770['y']) - _0x337957,
        width: _0x337957 * 0x2,
        height: _0x337957 * 0x2,
      };
    }
    return null;
  };
export const isWhiteboardLayerTransformable = (_0x2b973c) => TRANSFORMABLE_TYPES['has'](_0x2b973c?.['type']);
export function getWhiteboardLayerGeometry(_0x36d303, { zoom: zoom = 0x1 } = {}) {
  if (!isWhiteboardLayerTransformable(_0x36d303)) return null;
  const _0x21ce42 = getLayerBounds(_0x36d303);
  if (!_0x21ce42) return null;
  const _0x3d453c = Math['max'](0.001, finiteNumberOr(zoom, 0x1)),
    _0x1a49a9 = {
      x: _0x21ce42['x'] + _0x21ce42['width'] / 0x2,
      y: _0x21ce42['y'] + _0x21ce42['height'] / 0x2,
    },
    _0x3e00a1 =
      _0x36d303['type'] === 'rect' || _0x36d303['type'] === 'shape'
        ? finiteNumberOr(_0x36d303['rotation'])
        : 0x0,
    _0x439869 = [
      { id: 'nw', point: { x: _0x21ce42['x'], y: _0x21ce42['y'] } },
      { id: 'ne', point: { x: _0x21ce42['x'] + _0x21ce42['width'], y: _0x21ce42['y'] } },
      {
        id: 'se',
        point: { x: _0x21ce42['x'] + _0x21ce42['width'], y: _0x21ce42['y'] + _0x21ce42['height'] },
      },
      { id: 'sw', point: { x: _0x21ce42['x'], y: _0x21ce42['y'] + _0x21ce42['height'] } },
    ],
    _0x4c9dfe = _0x439869['map'](({ point: _0x1ff93a }) =>
      rotatePointAround(_0x1ff93a, _0x1a49a9, _0x3e00a1),
    ),
    _0x65b2a5 = GENERIC_RESIZE_TYPES['has'](_0x36d303['type']),
    _0x21bf5a = GENERIC_ROTATE_TYPES['has'](_0x36d303['type']),
    _0x202018 = _0x65b2a5
      ? _0x439869['map'](({ id: _0x1e0f21, point: _0x14aa6c }) => ({
          id: _0x1e0f21,
          mode: 'scale',
          point: rotatePointAround(_0x14aa6c, _0x1a49a9, _0x3e00a1),
        }))
      : [],
    _0xff7e5b = rotatePointAround({ x: _0x1a49a9['x'], y: _0x21ce42['y'] }, _0x1a49a9, _0x3e00a1),
    _0x20fd46 = _0x21bf5a
      ? {
          id: 'rotate',
          mode: 'rotate',
          point: rotatePointAround(
            { x: _0x1a49a9['x'], y: _0x21ce42['y'] - WHITEBOARD_LAYER_ROTATE_OFFSET_SCREEN / _0x3d453c },
            _0x1a49a9,
            _0x3e00a1,
          ),
        }
      : null;
  return {
    bounds: _0x21ce42,
    center: _0x1a49a9,
    rotation: _0x3e00a1,
    corners: _0x4c9dfe,
    topMiddle: _0xff7e5b,
    scaleHandles: _0x202018,
    rotationHandle: _0x20fd46,
    supportsResize: _0x65b2a5,
    supportsRotation: _0x21bf5a,
  };
}
export function getWhiteboardLayerTransformHandleAtPoint(_0x434756, _0x2ff592, { zoom: zoom = 0x1 } = {}) {
  const _0x43341f = getWhiteboardLayerGeometry(_0x434756, { zoom: zoom });
  if (!_0x43341f) return null;
  const _0x212081 = WHITEBOARD_LAYER_HANDLE_RADIUS_SCREEN / Math['max'](0.001, finiteNumberOr(zoom, 0x1)),
    _0x3be885 = [
      ...(_0x43341f['rotationHandle'] ? [_0x43341f['rotationHandle']] : []),
      ..._0x43341f['scaleHandles'],
    ];
  return (
    _0x3be885['find'](
      (_0x27b69d) =>
        Math['hypot'](
          finiteNumberOr(_0x2ff592?.['x']) - _0x27b69d['point']['x'],
          finiteNumberOr(_0x2ff592?.['y']) - _0x27b69d['point']['y'],
        ) <= _0x212081,
    ) || null
  );
}
const cloneCommand = (_0x2a059a) => ({
  ..._0x2a059a,
  points: Array['isArray'](_0x2a059a?.['points'])
    ? _0x2a059a['points']['map']((_0xc228db) => ({
        x: finiteNumberOr(_0xc228db?.['x']),
        y: finiteNumberOr(_0xc228db?.['y']),
      }))
    : _0x2a059a?.['points'],
});
export function createWhiteboardLayerTransformSession({
  command: _0x24d9fd,
  index: _0x1f3c83,
  mode: _0x220a37,
  startPoint: _0x4c6f4f,
} = {}) {
  const _0x30c3c9 = getWhiteboardLayerGeometry(_0x24d9fd);
  if (!_0x30c3c9) return null;
  if (_0x220a37 === 'scale' && !_0x30c3c9['supportsResize']) return null;
  if (_0x220a37 === 'rotate' && !_0x30c3c9['supportsRotation']) return null;
  if (_0x220a37 !== 'move' && _0x220a37 !== 'scale' && _0x220a37 !== 'rotate') return null;
  const _0x2929ea = { x: finiteNumberOr(_0x4c6f4f?.['x']), y: finiteNumberOr(_0x4c6f4f?.['y']) };
  return {
    index: Number(_0x1f3c83),
    mode: _0x220a37,
    start: _0x2929ea,
    center: { ..._0x30c3c9['center'] },
    startDistance: Math['max'](
      0.001,
      Math['hypot'](_0x2929ea['x'] - _0x30c3c9['center']['x'], _0x2929ea['y'] - _0x30c3c9['center']['y']),
    ),
    startAngle: Math['atan2'](
      _0x2929ea['y'] - _0x30c3c9['center']['y'],
      _0x2929ea['x'] - _0x30c3c9['center']['x'],
    ),
    base: cloneCommand(_0x24d9fd),
    moved: ![],
  };
}
const transformPoint = (
    _0x482963,
    _0x43d492,
    { scale: scale = 0x1, rotation: rotation = 0x0, dx: dx = 0x0, dy: dy = 0x0 } = {},
  ) => {
    const _0x321b05 = {
        x: _0x43d492['x'] + (finiteNumberOr(_0x482963?.['x']) - _0x43d492['x']) * scale,
        y: _0x43d492['y'] + (finiteNumberOr(_0x482963?.['y']) - _0x43d492['y']) * scale,
      },
      _0x4eee88 = rotatePointAround(_0x321b05, _0x43d492, rotation);
    return { x: _0x4eee88['x'] + dx, y: _0x4eee88['y'] + dy };
  },
  applyPointPair = (_0x1b4aed, _0x1df141, _0x2a197c) => {
    const _0x2a4dae = transformPoint(
        { x: _0x1df141['x1'], y: _0x1df141['y1'] },
        _0x2a197c['center'],
        _0x2a197c,
      ),
      _0x1c6ea2 = transformPoint({ x: _0x1df141['x2'], y: _0x1df141['y2'] }, _0x2a197c['center'], _0x2a197c);
    ((_0x1b4aed['x1'] = _0x2a4dae['x']),
      (_0x1b4aed['y1'] = _0x2a4dae['y']),
      (_0x1b4aed['x2'] = _0x1c6ea2['x']),
      (_0x1b4aed['y2'] = _0x1c6ea2['y']));
  };
export function applyWhiteboardLayerTransform(_0x496501, _0x389be8, _0x2b107b) {
  if (!_0x496501 || !_0x389be8?.['base'] || _0x496501['type'] !== _0x389be8['base']['type']) return ![];
  const _0xaac7e9 = { x: finiteNumberOr(_0x2b107b?.['x']), y: finiteNumberOr(_0x2b107b?.['y']) };
  let _0x2cc01f = 0x1,
    _0x595040 = 0x0,
    _0x16246a = 0x0,
    _0x17725b = 0x0;
  if (_0x389be8['mode'] === 'move')
    ((_0x16246a = _0xaac7e9['x'] - _0x389be8['start']['x']),
      (_0x17725b = _0xaac7e9['y'] - _0x389be8['start']['y']));
  else {
    if (_0x389be8['mode'] === 'scale')
      _0x2cc01f = clamp(
        Math['hypot'](_0xaac7e9['x'] - _0x389be8['center']['x'], _0xaac7e9['y'] - _0x389be8['center']['y']) /
          _0x389be8['startDistance'],
        WHITEBOARD_LAYER_MIN_SCALE,
        WHITEBOARD_LAYER_MAX_SCALE,
      );
    else {
      if (_0x389be8['mode'] === 'rotate')
        _0x595040 =
          Math['atan2'](
            _0xaac7e9['y'] - _0x389be8['center']['y'],
            _0xaac7e9['x'] - _0x389be8['center']['x'],
          ) - _0x389be8['startAngle'];
      else return ![];
    }
  }
  const _0x350725 =
      _0x389be8['mode'] === 'move'
        ? Math['hypot'](_0x16246a, _0x17725b) > 0.01
        : _0x389be8['mode'] === 'scale'
          ? Math['abs'](_0x2cc01f - 0x1) > 0.001
          : Math['abs'](_0x595040) > 0.001,
    _0x3b9e25 = {
      center: _0x389be8['center'],
      scale: _0x2cc01f,
      rotation: _0x595040,
      dx: _0x16246a,
      dy: _0x17725b,
    },
    _0x3feb59 = _0x389be8['base'];
  if (_0x496501['type'] === 'brush' || _0x496501['type'] === 'eraser')
    ((_0x496501['points'] = _0x3feb59['points']['map']((_0x18b206) =>
      transformPoint(_0x18b206, _0x389be8['center'], _0x3b9e25),
    )),
      (_0x496501['sizeWorld'] = Math['max'](0x1, finiteNumberOr(_0x3feb59['sizeWorld'], 0x1) * _0x2cc01f)));
  else {
    if (_0x496501['type'] === 'rect' || _0x496501['type'] === 'shape')
      (applyPointPair(_0x496501, _0x3feb59, { ..._0x3b9e25, rotation: 0x0 }),
        (_0x496501['sizeWorld'] = Math['max'](0x1, finiteNumberOr(_0x3feb59['sizeWorld'], 0x1) * _0x2cc01f)),
        (_0x496501['rotation'] = finiteNumberOr(_0x3feb59['rotation']) + _0x595040));
    else {
      if (_0x496501['type'] === 'arrow')
        (applyPointPair(_0x496501, _0x3feb59, _0x3b9e25),
          (_0x496501['sizeWorld'] = Math['max'](
            0x1,
            finiteNumberOr(_0x3feb59['sizeWorld'], 0x1) * _0x2cc01f,
          )),
          (_0x496501['bend'] = finiteNumberOr(_0x3feb59['bend']) * _0x2cc01f),
          (_0x496501['elbowOffset'] = finiteNumberOr(_0x3feb59['elbowOffset']) * _0x2cc01f));
      else {
        if (_0x496501['type'] === 'number-label') {
          const _0x3d9307 = transformPoint(_0x3feb59, _0x389be8['center'], _0x3b9e25);
          ((_0x496501['x'] = _0x3d9307['x']),
            (_0x496501['y'] = _0x3d9307['y']),
            (_0x496501['sizeWorld'] = Math['max'](
              0x1,
              finiteNumberOr(_0x3feb59['sizeWorld'], 0x12) * _0x2cc01f,
            )));
        }
      }
    }
  }
  return ((_0x389be8['moved'] = _0x350725), _0x350725);
}
