import {
  normalizeStoryboard3DBackgroundCalibration,
  updateStoryboard3DBackgroundCalibration,
} from './backgroundCalibration.js';
function clamp01(value) {
  return Math['max'](0, Math['min'](1, Number(value) || 0));
}
function toGuideCoordinate(item) {
  return Math['round'](clamp01(item) * 1000);
}
export function normalizeStoryboard3DBackgroundPointer(event, box) {
  const key = Math['max'](1, Number(box?.['width']) || 1),
    index = Math['max'](1, Number(box?.['height']) || 1);
  return {
    x: clamp01(((Number(event?.['clientX']) || 0) - (Number(box?.['left']) || 0)) / key),
    y: clamp01(((Number(event?.['clientY']) || 0) - (Number(box?.['top']) || 0)) / index),
  };
}
export function computeStoryboard3DBackgroundCalibrationDrag({
  mode: mode,
  background: background,
  startPoint: startPoint,
  currentPoint: currentPoint,
} = {}) {
  const args = normalizeStoryboard3DBackgroundCalibration(background),
    box2 = { x: clamp01(startPoint?.['x']), y: clamp01(startPoint?.['y']) },
    box3 = { x: clamp01(currentPoint?.['x']), y: clamp01(currentPoint?.['y']) };
  let horizonY = args['horizonY'],
    vanishingPoint = [...args['vanishingPoint']];
  if (mode === 'horizon')
    ((horizonY = clamp01(args['horizonY'] + box3['y'] - box2['y'])),
      (vanishingPoint = [
        args['vanishingPoint'][0],
        clamp01(horizonY + args['horizonSlope'] * (args['vanishingPoint'][0] - 0.5)),
      ]));
  else
    mode === 'vanishing-point' &&
      ((horizonY = clamp01(box3['y'] - args['horizonSlope'] * (box3['x'] - 0.5))),
      (vanishingPoint = [box3['x'], box3['y']]));
  return updateStoryboard3DBackgroundCalibration(args, {
    horizonY: horizonY,
    vanishingPoint: vanishingPoint,
    calibrationMethod: 'manual',
    calibrationConfidence: 1,
  });
}
export function computeStoryboard3DBackgroundGuideGeometry(result) {
  const groundPoints = normalizeStoryboard3DBackgroundCalibration(result),
    clamp012 = clamp01(groundPoints['vanishingPoint'][0]),
    clamp013 = clamp01(groundPoints['horizonY'] + groundPoints['horizonSlope'] * (clamp012 - 0.5));
  return {
    leftY: toGuideCoordinate(groundPoints['horizonY'] - groundPoints['horizonSlope'] * 0.5),
    rightY: toGuideCoordinate(groundPoints['horizonY'] + groundPoints['horizonSlope'] * 0.5),
    vanishingPoint: [toGuideCoordinate(clamp012), toGuideCoordinate(clamp013)],
    groundPoints: groundPoints['groundRegion']
      ['map'](([data, options]) => toGuideCoordinate(data) + ',' + toGuideCoordinate(options))
      ['join'](' '),
  };
}
function setAttributes(el, target) {
  if (!el) return;
  Object['entries'](target)['forEach'](([source, next]) => {
    el['setAttribute']?.(source, String(next));
  });
}
export function previewStoryboard3DBackgroundCalibration(el2, current) {
  const horizonY2 = normalizeStoryboard3DBackgroundCalibration(current),
    points = computeStoryboard3DBackgroundGuideGeometry(horizonY2),
    [x1, y1] = points['vanishingPoint'];
  setAttributes(el2?.['querySelector']?.('[data-storyboard-3d-background-ground-region]'), {
    points: points['groundPoints'],
  });
  for (const entry of el2?.['querySelectorAll']?.('[data-storyboard-3d-background-horizon-line]') || []) {
    setAttributes(entry, { y1: points['leftY'], y2: points['rightY'] });
  }
  (setAttributes(el2?.['querySelector']?.('[data-storyboard-3d-background-axis-left]'), {
    x1: x1,
    y1: y1,
  }),
    setAttributes(el2?.['querySelector']?.('[data-storyboard-3d-background-axis-right]'), {
      x1: x1,
      y1: y1,
    }));
  for (const record of el2?.['querySelectorAll']?.('[data-storyboard-3d-background-vanishing-point]') || []) {
    setAttributes(record, { cx: x1, cy: y1 });
  }
  const payload = {
    horizonY: horizonY2['horizonY'],
    vanishingPointX: horizonY2['vanishingPoint'][0],
    vanishingPointY: y1 / 1000,
  };
  Object['entries'](payload)['forEach'](([handle, state]) => {
    const el3 = el2?.['querySelector']?.('[data-storyboard-3d-background-field="' + handle + '"]');
    if (el3) el3['value'] = Number(state)['toFixed'](3)['replace'](/0+$/, '')['replace'](/\.$/, '');
  });
  const el4 = el2?.['querySelector']?.('[data-storyboard-3d-background-guide-status]');
  if (el4) el4['textContent'] = '正在手动调整 · 100%';
  return horizonY2;
}
export function createStoryboard3DBackgroundCalibrationInteraction({
  root: root,
  windowObject: windowObject = globalThis['window'],
  getBackground: getBackground,
  onPreview: onPreview,
  onCommit: onCommit,
  onCancel: onCancel,
} = {}) {
  let mode2 = null;
  const run = () => {
      if (!mode2) return;
      (windowObject?.['removeEventListener']?.('pointermove', config, !![]),
        windowObject?.['removeEventListener']?.('pointerup', scope, !![]),
        windowObject?.['removeEventListener']?.('pointercancel', input, !![]),
        windowObject?.['removeEventListener']?.('keydown', output, !![]),
        mode2['guide']?.['classList']?.['remove']?.('is-adjusting'));
      try {
        mode2['handle']?.['releasePointerCapture']?.(mode2['pointerId']);
      } catch {}
    },
    config = (event2) => {
      if (!mode2 || (mode2['pointerId'] != null && event2['pointerId'] !== mode2['pointerId'])) return;
      (event2['preventDefault']?.(), event2['stopImmediatePropagation']?.());
      const currentPoint2 = normalizeStoryboard3DBackgroundPointer(event2, mode2['rect']),
        enabled =
          Math['hypot'](
            (Number(event2['clientX']) || 0) - mode2['startClientX'],
            (Number(event2['clientY']) || 0) - mode2['startClientY'],
          ) >= 1;
      if (!enabled && !mode2['moved']) return;
      ((mode2['moved'] = !![]),
        (mode2['latest'] = computeStoryboard3DBackgroundCalibrationDrag({
          mode: mode2['mode'],
          background: mode2['initial'],
          startPoint: mode2['startPoint'],
          currentPoint: currentPoint2,
        })),
        previewStoryboard3DBackgroundCalibration(root, mode2['latest']),
        onPreview?.(mode2['latest'], { mode: mode2['mode'] }));
    },
    scope = (event3) => {
      if (!mode2 || (mode2['pointerId'] != null && event3['pointerId'] !== mode2['pointerId'])) return;
      (event3['preventDefault']?.(), event3['stopImmediatePropagation']?.());
      const mode3 = mode2;
      (run(), (mode2 = null));
      if (mode3['moved']) onCommit?.(mode3['latest'], { mode: mode3['mode'] });
    },
    handler = (event4) => {
      if (
        !mode2 ||
        (event4?.['pointerId'] != null &&
          mode2['pointerId'] != null &&
          event4['pointerId'] !== mode2['pointerId'])
      )
        return;
      (event4?.['preventDefault']?.(), event4?.['stopImmediatePropagation']?.());
      const mode4 = mode2;
      (run(),
        (mode2 = null),
        mode4['moved'] &&
          (previewStoryboard3DBackgroundCalibration(root, mode4['initial']),
          onCancel?.(mode4['initial'], { mode: mode4['mode'] })));
    },
    input = (value2) => handler(value2),
    output = (event5) => {
      if (event5['key'] === 'Escape') handler(event5);
    },
    value3 = (pointerId) => {
      if (pointerId['button'] !== 0 || mode2) return;
      const handle2 = pointerId['target']?.['closest']?.('[data-storyboard-3d-background-drag]');
      if (!handle2 || (root?.['contains'] && !root['contains'](handle2))) return;
      const mode5 = handle2['getAttribute']?.('data-storyboard-3d-background-drag');
      if (!['horizon', 'vanishing-point']['includes'](mode5)) return;
      const initial = normalizeStoryboard3DBackgroundCalibration(getBackground?.());
      if (!initial['imageUrl']) return;
      const el5 = handle2['ownerSVGElement'] || handle2['closest']?.('svg'),
        rect = el5?.['getBoundingClientRect']?.();
      if (!rect?.['width'] || !rect?.['height']) return;
      (pointerId['preventDefault']?.(),
        pointerId['stopImmediatePropagation']?.(),
        (mode2 = {
          mode: mode5,
          initial: initial,
          latest: initial,
          startPoint: normalizeStoryboard3DBackgroundPointer(pointerId, rect),
          startClientX: Number(pointerId['clientX']) || 0,
          startClientY: Number(pointerId['clientY']) || 0,
          rect: rect,
          pointerId: pointerId['pointerId'],
          handle: handle2,
          guide: handle2['closest']?.('.storyboard-3d-background-calibration-guide'),
          moved: ![],
        }),
        mode2['guide']?.['classList']?.['add']?.('is-adjusting'));
      try {
        handle2['setPointerCapture']?.(pointerId['pointerId']);
      } catch {}
      (windowObject?.['addEventListener']?.('pointermove', config, !![]),
        windowObject?.['addEventListener']?.('pointerup', scope, !![]),
        windowObject?.['addEventListener']?.('pointercancel', input, !![]),
        windowObject?.['addEventListener']?.('keydown', output, !![]));
    };
  return (
    root?.['addEventListener']?.('pointerdown', value3),
    {
      destroy() {
        (run(), (mode2 = null), root?.['removeEventListener']?.('pointerdown', value3));
      },
      isDragging: () => Boolean(mode2),
    }
  );
}
