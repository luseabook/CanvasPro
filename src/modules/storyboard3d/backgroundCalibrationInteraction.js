import {
  normalizeStoryboard3DBackgroundCalibration,
  updateStoryboard3DBackgroundCalibration,
} from './backgroundCalibration.js';
function clamp01(_0x1eae77) {
  return Math['max'](0x0, Math['min'](0x1, Number(_0x1eae77) || 0x0));
}
function toGuideCoordinate(_0x53214e) {
  return Math['round'](clamp01(_0x53214e) * 0x3e8);
}
export function normalizeStoryboard3DBackgroundPointer(_0x112873, _0x1058ae) {
  const _0x366cd6 = Math['max'](0x1, Number(_0x1058ae?.['width']) || 0x1),
    _0x5cc843 = Math['max'](0x1, Number(_0x1058ae?.['height']) || 0x1);
  return {
    x: clamp01(((Number(_0x112873?.['clientX']) || 0x0) - (Number(_0x1058ae?.['left']) || 0x0)) / _0x366cd6),
    y: clamp01(((Number(_0x112873?.['clientY']) || 0x0) - (Number(_0x1058ae?.['top']) || 0x0)) / _0x5cc843),
  };
}
export function computeStoryboard3DBackgroundCalibrationDrag({
  mode: _0x526734,
  background: _0x1dba26,
  startPoint: _0x280198,
  currentPoint: _0x52d6d5,
} = {}) {
  const _0x391115 = normalizeStoryboard3DBackgroundCalibration(_0x1dba26),
    _0x4f524c = { x: clamp01(_0x280198?.['x']), y: clamp01(_0x280198?.['y']) },
    _0x52757a = { x: clamp01(_0x52d6d5?.['x']), y: clamp01(_0x52d6d5?.['y']) };
  let _0x41c71a = _0x391115['horizonY'],
    _0x557a63 = [..._0x391115['vanishingPoint']];
  if (_0x526734 === 'horizon')
    ((_0x41c71a = clamp01(_0x391115['horizonY'] + _0x52757a['y'] - _0x4f524c['y'])),
      (_0x557a63 = [
        _0x391115['vanishingPoint'][0x0],
        clamp01(_0x41c71a + _0x391115['horizonSlope'] * (_0x391115['vanishingPoint'][0x0] - 0.5)),
      ]));
  else
    _0x526734 === 'vanishing-point' &&
      ((_0x41c71a = clamp01(_0x52757a['y'] - _0x391115['horizonSlope'] * (_0x52757a['x'] - 0.5))),
      (_0x557a63 = [_0x52757a['x'], _0x52757a['y']]));
  return updateStoryboard3DBackgroundCalibration(_0x391115, {
    horizonY: _0x41c71a,
    vanishingPoint: _0x557a63,
    calibrationMethod: 'manual',
    calibrationConfidence: 0x1,
  });
}
export function computeStoryboard3DBackgroundGuideGeometry(_0x2baff2) {
  const _0x5b8c7a = normalizeStoryboard3DBackgroundCalibration(_0x2baff2),
    _0x4f375c = clamp01(_0x5b8c7a['vanishingPoint'][0x0]),
    _0x1a5eca = clamp01(_0x5b8c7a['horizonY'] + _0x5b8c7a['horizonSlope'] * (_0x4f375c - 0.5));
  return {
    leftY: toGuideCoordinate(_0x5b8c7a['horizonY'] - _0x5b8c7a['horizonSlope'] * 0.5),
    rightY: toGuideCoordinate(_0x5b8c7a['horizonY'] + _0x5b8c7a['horizonSlope'] * 0.5),
    vanishingPoint: [toGuideCoordinate(_0x4f375c), toGuideCoordinate(_0x1a5eca)],
    groundPoints: _0x5b8c7a['groundRegion']
      ['map'](([_0x1e0aa9, _0x59ba04]) => toGuideCoordinate(_0x1e0aa9) + ',' + toGuideCoordinate(_0x59ba04))
      ['join']('\x20'),
  };
}
function setAttributes(_0x28fde3, _0x103c12) {
  if (!_0x28fde3) return;
  Object['entries'](_0x103c12)['forEach'](([_0x2f1ca6, _0x3c41a3]) => {
    _0x28fde3['setAttribute']?.(_0x2f1ca6, String(_0x3c41a3));
  });
}
export function previewStoryboard3DBackgroundCalibration(_0x155304, _0x339a62) {
  const _0x382a6f = normalizeStoryboard3DBackgroundCalibration(_0x339a62),
    _0x44b561 = computeStoryboard3DBackgroundGuideGeometry(_0x382a6f),
    [_0x2f67b7, _0x850ac5] = _0x44b561['vanishingPoint'];
  setAttributes(_0x155304?.['querySelector']?.('[data-storyboard-3d-background-ground-region]'), {
    points: _0x44b561['groundPoints'],
  });
  for (const _0x3ebbdb of _0x155304?.['querySelectorAll']?.('[data-storyboard-3d-background-horizon-line]') ||
    []) {
    setAttributes(_0x3ebbdb, { y1: _0x44b561['leftY'], y2: _0x44b561['rightY'] });
  }
  (setAttributes(_0x155304?.['querySelector']?.('[data-storyboard-3d-background-axis-left]'), {
    x1: _0x2f67b7,
    y1: _0x850ac5,
  }),
    setAttributes(_0x155304?.['querySelector']?.('[data-storyboard-3d-background-axis-right]'), {
      x1: _0x2f67b7,
      y1: _0x850ac5,
    }));
  for (const _0x119101 of _0x155304?.['querySelectorAll']?.(
    '[data-storyboard-3d-background-vanishing-point]',
  ) || []) {
    setAttributes(_0x119101, { cx: _0x2f67b7, cy: _0x850ac5 });
  }
  const _0x4f72f5 = {
    horizonY: _0x382a6f['horizonY'],
    vanishingPointX: _0x382a6f['vanishingPoint'][0x0],
    vanishingPointY: _0x850ac5 / 0x3e8,
  };
  Object['entries'](_0x4f72f5)['forEach'](([_0x4f3e58, _0x4faa76]) => {
    const _0x3d0d2e = _0x155304?.['querySelector']?.(
      '[data-storyboard-3d-background-field="' + _0x4f3e58 + '\x22]',
    );
    if (_0x3d0d2e)
      _0x3d0d2e['value'] = Number(_0x4faa76)['toFixed'](0x3)['replace'](/0+$/, '')['replace'](/\.$/, '');
  });
  const _0x3d74ba = _0x155304?.['querySelector']?.('[data-storyboard-3d-background-guide-status]');
  if (_0x3d74ba) _0x3d74ba['textContent'] = '正在手动调整\x20·\x20100%';
  return _0x382a6f;
}
export function createStoryboard3DBackgroundCalibrationInteraction({
  root: _0x1e91f5,
  windowObject: windowObject = globalThis['window'],
  getBackground: _0x34d3be,
  onPreview: _0x4c7d33,
  onCommit: _0x38cce8,
  onCancel: _0x26bf80,
} = {}) {
  let _0x339ac7 = null;
  const _0x46c236 = () => {
      if (!_0x339ac7) return;
      (windowObject?.['removeEventListener']?.('pointermove', _0x457a5c, !![]),
        windowObject?.['removeEventListener']?.('pointerup', _0x430d41, !![]),
        windowObject?.['removeEventListener']?.('pointercancel', _0x54ca4b, !![]),
        windowObject?.['removeEventListener']?.('keydown', _0x6ff8ca, !![]),
        _0x339ac7['guide']?.['classList']?.['remove']?.('is-adjusting'));
      try {
        _0x339ac7['handle']?.['releasePointerCapture']?.(_0x339ac7['pointerId']);
      } catch {}
    },
    _0x457a5c = (_0x5850b1) => {
      if (!_0x339ac7 || (_0x339ac7['pointerId'] != null && _0x5850b1['pointerId'] !== _0x339ac7['pointerId']))
        return;
      (_0x5850b1['preventDefault']?.(), _0x5850b1['stopImmediatePropagation']?.());
      const _0x599336 = normalizeStoryboard3DBackgroundPointer(_0x5850b1, _0x339ac7['rect']),
        _0x3e40b5 =
          Math['hypot'](
            (Number(_0x5850b1['clientX']) || 0x0) - _0x339ac7['startClientX'],
            (Number(_0x5850b1['clientY']) || 0x0) - _0x339ac7['startClientY'],
          ) >= 0x1;
      if (!_0x3e40b5 && !_0x339ac7['moved']) return;
      ((_0x339ac7['moved'] = !![]),
        (_0x339ac7['latest'] = computeStoryboard3DBackgroundCalibrationDrag({
          mode: _0x339ac7['mode'],
          background: _0x339ac7['initial'],
          startPoint: _0x339ac7['startPoint'],
          currentPoint: _0x599336,
        })),
        previewStoryboard3DBackgroundCalibration(_0x1e91f5, _0x339ac7['latest']),
        _0x4c7d33?.(_0x339ac7['latest'], { mode: _0x339ac7['mode'] }));
    },
    _0x430d41 = (_0x4f9180) => {
      if (!_0x339ac7 || (_0x339ac7['pointerId'] != null && _0x4f9180['pointerId'] !== _0x339ac7['pointerId']))
        return;
      (_0x4f9180['preventDefault']?.(), _0x4f9180['stopImmediatePropagation']?.());
      const _0x4e7970 = _0x339ac7;
      (_0x46c236(), (_0x339ac7 = null));
      if (_0x4e7970['moved']) _0x38cce8?.(_0x4e7970['latest'], { mode: _0x4e7970['mode'] });
    },
    _0x4faec9 = (_0x1c948a) => {
      if (
        !_0x339ac7 ||
        (_0x1c948a?.['pointerId'] != null &&
          _0x339ac7['pointerId'] != null &&
          _0x1c948a['pointerId'] !== _0x339ac7['pointerId'])
      )
        return;
      (_0x1c948a?.['preventDefault']?.(), _0x1c948a?.['stopImmediatePropagation']?.());
      const _0x2480be = _0x339ac7;
      (_0x46c236(),
        (_0x339ac7 = null),
        _0x2480be['moved'] &&
          (previewStoryboard3DBackgroundCalibration(_0x1e91f5, _0x2480be['initial']),
          _0x26bf80?.(_0x2480be['initial'], { mode: _0x2480be['mode'] })));
    },
    _0x54ca4b = (_0x3d227a) => _0x4faec9(_0x3d227a),
    _0x6ff8ca = (_0x2ac941) => {
      if (_0x2ac941['key'] === 'Escape') _0x4faec9(_0x2ac941);
    },
    _0x590226 = (_0x563596) => {
      if (_0x563596['button'] !== 0x0 || _0x339ac7) return;
      const _0x4bd1c1 = _0x563596['target']?.['closest']?.('[data-storyboard-3d-background-drag]');
      if (!_0x4bd1c1 || (_0x1e91f5?.['contains'] && !_0x1e91f5['contains'](_0x4bd1c1))) return;
      const _0x30c020 = _0x4bd1c1['getAttribute']?.('data-storyboard-3d-background-drag');
      if (!['horizon', 'vanishing-point']['includes'](_0x30c020)) return;
      const _0x5ad503 = normalizeStoryboard3DBackgroundCalibration(_0x34d3be?.());
      if (!_0x5ad503['imageUrl']) return;
      const _0xbcbce4 = _0x4bd1c1['ownerSVGElement'] || _0x4bd1c1['closest']?.('svg'),
        _0xb063c3 = _0xbcbce4?.['getBoundingClientRect']?.();
      if (!_0xb063c3?.['width'] || !_0xb063c3?.['height']) return;
      (_0x563596['preventDefault']?.(),
        _0x563596['stopImmediatePropagation']?.(),
        (_0x339ac7 = {
          mode: _0x30c020,
          initial: _0x5ad503,
          latest: _0x5ad503,
          startPoint: normalizeStoryboard3DBackgroundPointer(_0x563596, _0xb063c3),
          startClientX: Number(_0x563596['clientX']) || 0x0,
          startClientY: Number(_0x563596['clientY']) || 0x0,
          rect: _0xb063c3,
          pointerId: _0x563596['pointerId'],
          handle: _0x4bd1c1,
          guide: _0x4bd1c1['closest']?.('.storyboard-3d-background-calibration-guide'),
          moved: ![],
        }),
        _0x339ac7['guide']?.['classList']?.['add']?.('is-adjusting'));
      try {
        _0x4bd1c1['setPointerCapture']?.(_0x563596['pointerId']);
      } catch {}
      (windowObject?.['addEventListener']?.('pointermove', _0x457a5c, !![]),
        windowObject?.['addEventListener']?.('pointerup', _0x430d41, !![]),
        windowObject?.['addEventListener']?.('pointercancel', _0x54ca4b, !![]),
        windowObject?.['addEventListener']?.('keydown', _0x6ff8ca, !![]));
    };
  return (
    _0x1e91f5?.['addEventListener']?.('pointerdown', _0x590226),
    {
      destroy() {
        (_0x46c236(), (_0x339ac7 = null), _0x1e91f5?.['removeEventListener']?.('pointerdown', _0x590226));
      },
      isDragging: () => Boolean(_0x339ac7),
    }
  );
}
