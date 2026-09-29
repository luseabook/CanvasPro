const MODES = new Set(['translate', 'rotate', 'scale']),
  SPACES = new Set(['local', 'world']),
  CONSTRAINTS = new Set(['free', 'x', 'y', 'z', 'xy', 'xz', 'yz']);
function finiteNumber(_0x5c0439, _0x2909bd = 0x0) {
  const _0x146352 = Number(_0x5c0439);
  return Number['isFinite'](_0x146352) ? _0x146352 : _0x2909bd;
}
function positiveNumber(_0x1f8fa4, _0x582558 = 0x0) {
  const _0x1d7781 = finiteNumber(_0x1f8fa4, _0x582558);
  return _0x1d7781 > 0x0 ? _0x1d7781 : 0x0;
}
function normalizeMode(_0x17053e) {
  const _0x21f0c1 = _0x17053e === 'move' ? 'translate' : String(_0x17053e || 'translate')['trim']();
  return MODES['has'](_0x21f0c1) ? _0x21f0c1 : 'translate';
}
function normalizeSpace(_0x225e85) {
  const _0x13c657 = String(_0x225e85 || 'world')['trim']();
  return SPACES['has'](_0x13c657) ? _0x13c657 : 'world';
}
function normalizeConstraint(_0x2ac6a2) {
  const _0x20c98c = String(_0x2ac6a2 || 'free')
    ['trim']()
    ['toLowerCase']();
  return CONSTRAINTS['has'](_0x20c98c) ? _0x20c98c : 'free';
}
function cloneScale(_0x51a0c6) {
  if (Number['isFinite'](Number(_0x51a0c6))) {
    const _0x99cb7 = Math['max'](0.01, Number(_0x51a0c6));
    return { x: _0x99cb7, y: _0x99cb7, z: _0x99cb7 };
  }
  return {
    x: Math['max'](0.01, finiteNumber(_0x51a0c6?.['x'], 0x1)),
    y: Math['max'](0.01, finiteNumber(_0x51a0c6?.['y'], 0x1)),
    z: Math['max'](0.01, finiteNumber(_0x51a0c6?.['z'], 0x1)),
  };
}
function normalizePose(_0x20e6ef = {}) {
  return {
    position: {
      x: finiteNumber(_0x20e6ef?.['position']?.['x']),
      y: finiteNumber(_0x20e6ef?.['position']?.['y']),
      z: finiteNumber(_0x20e6ef?.['position']?.['z']),
    },
    rotation: {
      x: finiteNumber(_0x20e6ef?.['rotation']?.['x']),
      y: finiteNumber(_0x20e6ef?.['rotation']?.['y']),
      z: finiteNumber(_0x20e6ef?.['rotation']?.['z']),
    },
    quaternion: _0x20e6ef?.['quaternion']
      ? {
          x: finiteNumber(_0x20e6ef['quaternion']['x']),
          y: finiteNumber(_0x20e6ef['quaternion']['y']),
          z: finiteNumber(_0x20e6ef['quaternion']['z']),
          w: finiteNumber(_0x20e6ef['quaternion']['w'], 0x1),
        }
      : null,
    scale: cloneScale(_0x20e6ef?.['scale']),
  };
}
function snapValue(_0x1ce6c3, _0x193358) {
  return _0x193358 > 0x0 ? Math['round'](_0x1ce6c3 / _0x193358) * _0x193358 : _0x1ce6c3;
}
export function normalizeTransformInteractionOptions(_0x35648f = {}) {
  return {
    mode: normalizeMode(_0x35648f['mode']),
    space: normalizeSpace(_0x35648f['space']),
    constraint: normalizeConstraint(_0x35648f['constraint']),
    uniformScale: _0x35648f['uniformScale'] !== ![],
    groundLock: _0x35648f['groundLock'] !== ![],
    snap: {
      enabled: _0x35648f?.['snap']?.['enabled'] === !![],
      translation: positiveNumber(_0x35648f?.['snap']?.['translation'], 0.25),
      rotation: positiveNumber(_0x35648f?.['snap']?.['rotation'], Math['PI'] / 0xc),
      scale: positiveNumber(_0x35648f?.['snap']?.['scale'], 0.1),
    },
  };
}
export function applyTransformInteractionOptions(_0x124749, _0x405478 = {}) {
  const _0x22c1cf = normalizePose(_0x124749),
    _0x5217b5 = normalizeTransformInteractionOptions(_0x405478);
  _0x5217b5['groundLock'] && _0x5217b5['mode'] === 'translate' && (_0x22c1cf['position']['y'] = 0x0);
  if (_0x5217b5['uniformScale'] && _0x5217b5['mode'] === 'scale') {
    const _0x1b2cac = ['x', 'y', 'z']['find']((_0x554b52) => _0x5217b5['constraint']['includes'](_0x554b52)),
      _0x2c2672 = _0x22c1cf['scale'][_0x1b2cac || 'x'];
    _0x22c1cf['scale'] = { x: _0x2c2672, y: _0x2c2672, z: _0x2c2672 };
  }
  if (!_0x5217b5['snap']['enabled']) return _0x22c1cf;
  if (_0x5217b5['mode'] === 'translate') {
    const _0x37c1aa = _0x5217b5['snap']['translation'];
    _0x22c1cf['position'] = {
      x: snapValue(_0x22c1cf['position']['x'], _0x37c1aa),
      y: _0x5217b5['groundLock'] ? 0x0 : snapValue(_0x22c1cf['position']['y'], _0x37c1aa),
      z: snapValue(_0x22c1cf['position']['z'], _0x37c1aa),
    };
  } else {
    if (_0x5217b5['mode'] === 'rotate') {
      const _0x1f9ccb = _0x5217b5['snap']['rotation'];
      ((_0x22c1cf['rotation'] = {
        x: snapValue(_0x22c1cf['rotation']['x'], _0x1f9ccb),
        y: snapValue(_0x22c1cf['rotation']['y'], _0x1f9ccb),
        z: snapValue(_0x22c1cf['rotation']['z'], _0x1f9ccb),
      }),
        (_0x22c1cf['quaternion'] = null));
    } else {
      const _0x4be3d1 = _0x5217b5['snap']['scale'],
        _0x4f3220 = {
          x: Math['max'](0.01, snapValue(_0x22c1cf['scale']['x'], _0x4be3d1)),
          y: Math['max'](0.01, snapValue(_0x22c1cf['scale']['y'], _0x4be3d1)),
          z: Math['max'](0.01, snapValue(_0x22c1cf['scale']['z'], _0x4be3d1)),
        };
      _0x22c1cf['scale'] = _0x5217b5['uniformScale']
        ? { x: _0x4f3220['x'], y: _0x4f3220['x'], z: _0x4f3220['x'] }
        : _0x4f3220;
    }
  }
  return _0x22c1cf;
}
export class TransformInteractionAdapter {
  constructor({
    onPreview: _0x393f6b,
    onCommit: _0x3bc61c,
    onCancel: _0x17c8c6,
    setOrbitEnabled: _0xea9dd5,
  } = {}) {
    ((this['onPreview'] = _0x393f6b),
      (this['onCommit'] = _0x3bc61c),
      (this['onCancel'] = _0x17c8c6),
      (this['setOrbitEnabled'] = _0xea9dd5),
      (this['options'] = normalizeTransformInteractionOptions()),
      (this['drag'] = null));
  }
  ['configure'](_0x30334e = {}) {
    return (
      (this['options'] = normalizeTransformInteractionOptions({
        ...this['options'],
        ..._0x30334e,
        snap: { ...this['options']['snap'], ...(_0x30334e['snap'] || {}) },
      })),
      this['getState']()
    );
  }
  ['begin']({ objectType: _0x5c6f91, objectId: _0x303c47, pose: _0x1e0adc, constraint: _0x2ecace } = {}) {
    if (!_0x5c6f91 || !_0x303c47) return ![];
    if (this['drag']) this['cancel']();
    this['drag'] = {
      objectType: String(_0x5c6f91),
      objectId: String(_0x303c47),
      basePose: normalizePose(_0x1e0adc),
      previewPose: normalizePose(_0x1e0adc),
    };
    if (_0x2ecace) this['configure']({ constraint: _0x2ecace });
    return (this['setOrbitEnabled']?.(![]), !![]);
  }
  ['preview'](_0x345bc0) {
    if (!this['drag']) return null;
    const _0x96c1f7 = applyTransformInteractionOptions(_0x345bc0, this['options']);
    return (
      (this['drag']['previewPose'] = _0x96c1f7),
      this['onPreview']?.({
        objectType: this['drag']['objectType'],
        objectId: this['drag']['objectId'],
        pose: _0x96c1f7,
        options: this['options'],
      }),
      _0x96c1f7
    );
  }
  ['commit']() {
    if (!this['drag']) return null;
    const _0x1af248 = {
      objectType: this['drag']['objectType'],
      objectId: this['drag']['objectId'],
      pose: this['drag']['previewPose'],
    };
    return ((this['drag'] = null), this['setOrbitEnabled']?.(!![]), this['onCommit']?.(_0x1af248), _0x1af248);
  }
  ['cancel']() {
    if (!this['drag']) return null;
    const _0x384ed8 = {
      objectType: this['drag']['objectType'],
      objectId: this['drag']['objectId'],
      pose: this['drag']['basePose'],
    };
    return (
      (this['drag'] = null),
      this['setOrbitEnabled']?.(!![]),
      this['onPreview']?.(_0x384ed8),
      this['onCancel']?.(_0x384ed8),
      _0x384ed8
    );
  }
  ['getState']() {
    return {
      options: normalizeTransformInteractionOptions(this['options']),
      dragging: this['drag'] !== null,
      objectType: this['drag']?.['objectType'] || null,
      objectId: this['drag']?.['objectId'] || null,
    };
  }
}
