const MODES = new Set(['translate', 'rotate', 'scale']),
  SPACES = new Set(['local', 'world']),
  CONSTRAINTS = new Set(['free', 'x', 'y', 'z', 'xy', 'xz', 'yz']);
function finiteNumber(value, item = 0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function positiveNumber(index, result = 0) {
  const finiteNumber2 = finiteNumber(index, result);
  return finiteNumber2 > 0 ? finiteNumber2 : 0;
}
function normalizeMode(data) {
  const options = data === 'move' ? 'translate' : String(data || 'translate')['trim']();
  return MODES['has'](options) ? options : 'translate';
}
function normalizeSpace(target) {
  const source = String(target || 'world')['trim']();
  return SPACES['has'](source) ? source : 'world';
}
function normalizeConstraint(next) {
  const current = String(next || 'free')
    ['trim']()
    ['toLowerCase']();
  return CONSTRAINTS['has'](current) ? current : 'free';
}
function cloneScale(box) {
  if (Number['isFinite'](Number(box))) {
    const x = Math['max'](0.01, Number(box));
    return { x: x, y: x, z: x };
  }
  return {
    x: Math['max'](0.01, finiteNumber(box?.['x'], 1)),
    y: Math['max'](0.01, finiteNumber(box?.['y'], 1)),
    z: Math['max'](0.01, finiteNumber(box?.['z'], 1)),
  };
}
function normalizePose(quaternion = {}) {
  return {
    position: {
      x: finiteNumber(quaternion?.['position']?.['x']),
      y: finiteNumber(quaternion?.['position']?.['y']),
      z: finiteNumber(quaternion?.['position']?.['z']),
    },
    rotation: {
      x: finiteNumber(quaternion?.['rotation']?.['x']),
      y: finiteNumber(quaternion?.['rotation']?.['y']),
      z: finiteNumber(quaternion?.['rotation']?.['z']),
    },
    quaternion: quaternion?.['quaternion']
      ? {
          x: finiteNumber(quaternion['quaternion']['x']),
          y: finiteNumber(quaternion['quaternion']['y']),
          z: finiteNumber(quaternion['quaternion']['z']),
          w: finiteNumber(quaternion['quaternion']['w'], 1),
        }
      : null,
    scale: cloneScale(quaternion?.['scale']),
  };
}
function snapValue(entry, count) {
  return count > 0 ? Math['round'](entry / count) * count : entry;
}
export function normalizeTransformInteractionOptions(uniformScale = {}) {
  return {
    mode: normalizeMode(uniformScale['mode']),
    space: normalizeSpace(uniformScale['space']),
    constraint: normalizeConstraint(uniformScale['constraint']),
    uniformScale: uniformScale['uniformScale'] !== false,
    groundLock: uniformScale['groundLock'] !== false,
    snap: {
      enabled: uniformScale?.['snap']?.['enabled'] === true,
      translation: positiveNumber(uniformScale?.['snap']?.['translation'], 0.25),
      rotation: positiveNumber(uniformScale?.['snap']?.['rotation'], Math['PI'] / 12),
      scale: positiveNumber(uniformScale?.['snap']?.['scale'], 0.1),
    },
  };
}
export function applyTransformInteractionOptions(record, payload = {}) {
  const box2 = normalizePose(record),
    y = normalizeTransformInteractionOptions(payload);
  y['groundLock'] && y['mode'] === 'translate' && (box2['position']['y'] = 0);
  if (y['uniformScale'] && y['mode'] === 'scale') {
    const handle = ['x', 'y', 'z']['find']((state) => y['constraint']['includes'](state)),
      x2 = box2['scale'][handle || 'x'];
    box2['scale'] = { x: x2, y: x2, z: x2 };
  }
  if (!y['snap']['enabled']) return box2;
  if (y['mode'] === 'translate') {
    const config = y['snap']['translation'];
    box2['position'] = {
      x: snapValue(box2['position']['x'], config),
      y: y['groundLock'] ? 0 : snapValue(box2['position']['y'], config),
      z: snapValue(box2['position']['z'], config),
    };
  } else {
    if (y['mode'] === 'rotate') {
      const scope = y['snap']['rotation'];
      ((box2['rotation'] = {
        x: snapValue(box2['rotation']['x'], scope),
        y: snapValue(box2['rotation']['y'], scope),
        z: snapValue(box2['rotation']['z'], scope),
      }),
        (box2['quaternion'] = null));
    } else {
      const input = y['snap']['scale'],
        x3 = {
          x: Math['max'](0.01, snapValue(box2['scale']['x'], input)),
          y: Math['max'](0.01, snapValue(box2['scale']['y'], input)),
          z: Math['max'](0.01, snapValue(box2['scale']['z'], input)),
        };
      box2['scale'] = y['uniformScale'] ? { x: x3['x'], y: x3['x'], z: x3['x'] } : x3;
    }
  }
  return box2;
}
export class TransformInteractionAdapter {
  constructor({
    onPreview: onPreview,
    onCommit: onCommit,
    onCancel: onCancel,
    setOrbitEnabled: setOrbitEnabled,
  } = {}) {
    ((this['onPreview'] = onPreview),
      (this['onCommit'] = onCommit),
      (this['onCancel'] = onCancel),
      (this['setOrbitEnabled'] = setOrbitEnabled),
      (this['options'] = normalizeTransformInteractionOptions()),
      (this['drag'] = null));
  }
  ['configure'](args = {}) {
    return (
      (this['options'] = normalizeTransformInteractionOptions({
        ...this['options'],
        ...args,
        snap: { ...this['options']['snap'], ...(args['snap'] || {}) },
      })),
      this['getState']()
    );
  }
  ['begin']({ objectType: objectType, objectId: objectId, pose: pose, constraint: constraint } = {}) {
    if (!objectType || !objectId) return false;
    if (this['drag']) this['cancel']();
    this['drag'] = {
      objectType: String(objectType),
      objectId: String(objectId),
      basePose: normalizePose(pose),
      previewPose: normalizePose(pose),
    };
    if (constraint) this['configure']({ constraint: constraint });
    return (this['setOrbitEnabled']?.(false), true);
  }
  ['preview'](output) {
    if (!this['drag']) return null;
    const pose2 = applyTransformInteractionOptions(output, this['options']);
    return (
      (this['drag']['previewPose'] = pose2),
      this['onPreview']?.({
        objectType: this['drag']['objectType'],
        objectId: this['drag']['objectId'],
        pose: pose2,
        options: this['options'],
      }),
      pose2
    );
  }
  ['commit']() {
    if (!this['drag']) return null;
    const value2 = {
      objectType: this['drag']['objectType'],
      objectId: this['drag']['objectId'],
      pose: this['drag']['previewPose'],
    };
    return ((this['drag'] = null), this['setOrbitEnabled']?.(true), this['onCommit']?.(value2), value2);
  }
  ['cancel']() {
    if (!this['drag']) return null;
    const value3 = {
      objectType: this['drag']['objectType'],
      objectId: this['drag']['objectId'],
      pose: this['drag']['basePose'],
    };
    return (
      (this['drag'] = null),
      this['setOrbitEnabled']?.(true),
      this['onPreview']?.(value3),
      this['onCancel']?.(value3),
      value3
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
