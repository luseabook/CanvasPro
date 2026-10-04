const MIN_ZOOM = 0.25,
  MAX_ZOOM = 0x6,
  WHEEL_ZOOM_INTENSITY = 0.0015;
function clamp(value, item, key) {
  return Math['min'](key, Math['max'](item, Number(value) || 0x0));
}
function fitAspectWithin(index, box) {
  const width = Math['min'](box['width'], box['height'] * index),
    height = width / index;
  return { width: width, height: height, area: width * height };
}
export function createMaterialComparisonViewport({
  state: state,
  main: main,
  stage: stage,
  stageShell: stageShell,
  viewport: viewport,
  windowObject: windowObject,
}) {
  let value2 = null,
    box2 = null,
    result = ![];
  function run() {
    const box3 = main['getBoundingClientRect']?.(),
      data = windowObject?.['getComputedStyle']?.(stageShell),
      options = {
        width: Math['max'](
          0x1,
          Number(main['clientWidth'] || box3?.['width'] || windowObject?.['innerWidth'] || 0x0) -
            (parseFloat(data?.['paddingLeft']) || 0x0) -
            (parseFloat(data?.['paddingRight']) || 0x0),
        ),
        height: Math['max'](
          0x1,
          Number(main['clientHeight'] || box3?.['height'] || windowObject?.['innerHeight'] || 0x0) -
            (parseFloat(data?.['paddingTop']) || 0x0) -
            (parseFloat(data?.['paddingBottom']) || 0x0),
        ),
      },
      target = state['leftAspectRatio'] > 0x0 ? state['leftAspectRatio'] : 0x1,
      source = state['rightAspectRatio'] > 0x0 ? state['rightAspectRatio'] : 0x1,
      fitAspectWithin2 = fitAspectWithin(target, options),
      fitAspectWithin3 = fitAspectWithin(source, options),
      box4 =
        state['mode'] === 'side-by-side'
          ? fitAspectWithin(target + source, options)
          : fitAspectWithin2['area'] >= fitAspectWithin3['area']
            ? fitAspectWithin2
            : fitAspectWithin3;
    ((state['stageWidth'] = Math['max'](0x1, box4['width'] * state['zoom'])),
      (state['stageHeight'] = Math['max'](0x1, box4['height'] * state['zoom'])),
      stage['style']['setProperty'](
        '--material-comparison-stage-width',
        Math['round'](state['stageWidth'] * 0x64) / 0x64 + 'px',
      ),
      stage['style']['setProperty'](
        '--material-comparison-stage-height',
        Math['round'](state['stageHeight'] * 0x64) / 0x64 + 'px',
      ),
      (stage['dataset']['zoom'] = String(Math['round'](state['zoom'] * 0x3e8) / 0x3e8)));
  }
  function syncDivider() {
    if (result) return;
    const box5 = main['getBoundingClientRect']?.(),
      box6 = stage['getBoundingClientRect']?.();
    if (!box5 || !box6) return;
    const next = Number(main['clientWidth'] || box5['width']),
      current = Number(main['clientHeight'] || box5['height']),
      entry = (next * state['dividerPercent']) / 0x64,
      clamp2 = clamp(
        ((box5['left'] + entry - box6['left'] - Number(stage['clientLeft'] || 0x0)) /
          Math['max'](0x1, Number(stage['clientWidth'] || box6['width']))) *
          0x64,
        0x0,
        0x64,
      );
    (viewport['style']['setProperty']('--material-comparison-divider-x', entry + 'px'),
      viewport['style']['setProperty']('--material-comparison-divider-height', current + 'px'),
      stage['style']['setProperty']('--material-comparison-divider', clamp2 + '%'));
  }
  function syncGeometry() {
    if (result) return;
    (run(), syncDivider());
  }
  function run2() {
    value2 = null;
    if (result || !box2) return;
    const { zoom: zoom, clientX: clientX, clientY: clientY } = box2;
    box2 = null;
    if (zoom === state['zoom']) return;
    const box7 = stage['getBoundingClientRect']?.(),
      clamp3 = clamp(
        (clientX - Number(box7?.['left'] || 0x0)) / Math['max'](0x1, Number(box7?.['width'] || 0x0)),
        0x0,
        0x1,
      ),
      clamp4 = clamp(
        (clientY - Number(box7?.['top'] || 0x0)) / Math['max'](0x1, Number(box7?.['height'] || 0x0)),
        0x0,
        0x1,
      );
    ((state['zoom'] = zoom), run());
    const box8 = stage['getBoundingClientRect']?.();
    if (box7 && box8) {
      const record = Number(main['scrollLeft'] || 0x0) + box8['left'] + box8['width'] * clamp3 - clientX,
        payload = Number(main['scrollTop'] || 0x0) + box8['top'] + box8['height'] * clamp4 - clientY;
      ((main['scrollLeft'] = record), (main['scrollTop'] = payload));
    }
    syncDivider();
  }
  function cancelZoom() {
    if (value2 !== null) windowObject?.['cancelAnimationFrame']?.(value2);
    ((value2 = null), (box2 = null));
  }
  return {
    syncGeometry: syncGeometry,
    syncDivider: syncDivider,
    zoomBy(event) {
      if (result) return;
      const enabled = Number(event?.['deltaY'] || event?.['deltaX'] || 0x0);
      if (!enabled) return;
      (event['preventDefault']?.(), event['stopPropagation']?.());
      const handle = box2?.['zoom'] ?? state['zoom'],
        zoom2 =
          Math['round'](
            clamp(handle * Math['exp'](-enabled * WHEEL_ZOOM_INTENSITY), MIN_ZOOM, MAX_ZOOM) * 0x3e8,
          ) / 0x3e8;
      box2 = {
        zoom: zoom2,
        clientX: Number(event['clientX']) || 0x0,
        clientY: Number(event['clientY']) || 0x0,
      };
      if (value2 !== null) return;
      if (typeof windowObject?.['requestAnimationFrame'] === 'function')
        value2 = windowObject['requestAnimationFrame'](run2);
      else run2();
    },
    cancelZoom: cancelZoom,
    dispose() {
      ((result = !![]), cancelZoom());
    },
  };
}
