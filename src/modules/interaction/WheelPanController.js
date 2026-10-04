import { setCanvasMediaSchedulerPaused } from '../canvasMediaScheduler.js';
const WHEEL_PAN_END_DELAY_MS = 0xa0,
  WHEEL_PAN_MEDIA_RESUME_DELAY_MS = 0x78,
  WHEEL_PAN_MEDIA_PAUSE_SOURCE = 'wheel-pan',
  WHEEL_PAN_PREVIEW_OWNER = 'wheel-pan';
export function createWheelPanController({
  store: store,
  scheduleTimer: scheduleTimer = (value, item) => setTimeout(value, item),
  clearScheduledTimer: clearScheduledTimer = (key) => clearTimeout(key),
  requestFrame: requestFrame = (index) =>
    typeof requestAnimationFrame === 'function' ? requestAnimationFrame(index) : setTimeout(index, 0x0),
  cancelFrame: cancelFrame = (result) =>
    typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(result) : clearTimeout(result),
  viewportPreview: viewportPreview,
} = {}) {
  if (
    typeof viewportPreview?.['acquire'] !== 'function' ||
    typeof viewportPreview?.['update'] !== 'function' ||
    typeof viewportPreview?.['commit'] !== 'function'
  )
    throw new TypeError('[WheelPanController] viewportPreview is required');
  let data = 0x0,
    scheduleTimer2 = 0x0,
    options,
    enabled = ![],
    target = 0x0,
    enabled2 = ![];
  function run() {
    (scheduleTimer2 && (clearScheduledTimer(scheduleTimer2), (scheduleTimer2 = 0x0)),
      setCanvasMediaSchedulerPaused(!![], { bypassPriority: 0x3e8, source: WHEEL_PAN_MEDIA_PAUSE_SOURCE }));
  }
  function run2() {
    if (scheduleTimer2) clearScheduledTimer(scheduleTimer2);
    scheduleTimer2 = scheduleTimer(() => {
      ((scheduleTimer2 = 0x0), setCanvasMediaSchedulerPaused(![], { source: WHEEL_PAN_MEDIA_PAUSE_SOURCE }));
    }, WHEEL_PAN_MEDIA_RESUME_DELAY_MS);
  }
  function run3() {
    if (data) clearScheduledTimer(data);
    const scheduleTimer3 = scheduleTimer(() => {
      if (data !== scheduleTimer3) return;
      ((data = 0x0), settleWheelPan());
    }, WHEEL_PAN_END_DELAY_MS);
    data = scheduleTimer3;
  }
  function run4(pointerTarget) {
    const source = typeof window !== 'undefined' ? window : null,
      handler =
        typeof source?.['_v2UpdateSidePlusNow'] === 'function'
          ? source['_v2UpdateSidePlusNow']
          : source?.['_v2UpdateSidePlus'];
    if (typeof handler !== 'function') return;
    const next = Number(source?.['_lastMx']) || 0x0,
      current = Number(source?.['_lastMy']) || 0x0;
    handler(next, current, { pointerTarget: pointerTarget });
  }
  function run5() {
    target && (cancelFrame(target), (target = 0x0));
    if (!enabled) return ![];
    const entry = options;
    return ((options = undefined), (enabled = ![]), run4(entry), !![]);
  }
  function run6() {
    if (target) cancelFrame(target);
    ((target = 0x0), (options = undefined), (enabled = ![]));
  }
  function run7(record) {
    ((options = record), (enabled = !![]));
    if (target) return;
    const requestFrame2 = requestFrame(() => {
      if (target !== requestFrame2) return;
      ((target = 0x0), run5());
    });
    target = requestFrame2;
  }
  function settleWheelPan() {
    if (!enabled2) return null;
    enabled2 = ![];
    data && (clearScheduledTimer(data), (data = 0x0));
    const payload = typeof window !== 'undefined' ? window : null,
      box = viewportPreview['commit'](WHEEL_PAN_PREVIEW_OWNER);
    return (
      box
        ? (payload?.['_v2FlushMinimapViewportPreview']?.(box),
          store['updateViewport'](box['x'], box['y'], box['zoom']),
          store['markViewportPersist']?.(),
          run5())
        : run6(),
      payload?.['v2Renderer']?.['releaseViewportInteractionBusy']?.(),
      run2(),
      box
    );
  }
  function handleWheelPan(handle, state, config) {
    const scope = Number(handle),
      input = Number(state),
      count = Number['isFinite'](scope) ? scope : 0x0,
      count2 = Number['isFinite'](input) ? input : 0x0;
    if (count === 0x0 && count2 === 0x0) return ![];
    const output =
        (typeof store?.['getStateRaw'] === 'function' && store['getStateRaw']()) ||
        (typeof store?.['getState'] === 'function' && store['getState']()) ||
        {},
      enabled3 = viewportPreview['acquire'](WHEEL_PAN_PREVIEW_OWNER, output['viewport']);
    if (!enabled3) return ![];
    const value2 = typeof window !== 'undefined' ? window : null;
    (value2?.['v2Renderer']?.['markViewportInteractionBusy']?.(), run());
    const x = enabled3,
      value3 = {
        ...x,
        x: x['x'] - count,
        y: x['y'] - count2,
        zoom: x['zoom'],
      };
    return (
      viewportPreview['update'](WHEEL_PAN_PREVIEW_OWNER, value3),
      value2?.['_v2ScheduleMinimapViewportPreview']?.(value3),
      (enabled2 = !![]),
      run3(),
      run7(config),
      !![]
    );
  }
  return { handleWheelPan: handleWheelPan, settleWheelPan: settleWheelPan };
}
