const videoFramePresentationState = new WeakMap();
function normalizeSource(value) {
  const enabled = String(value || '')['trim']();
  if (!enabled) return '';
  try {
    return new URL(enabled, globalThis['location']?.['href'] || globalThis['window']?.['location']?.['href'])[
      'href'
    ];
  } catch {
    return enabled;
  }
}
export function getVideoPresentationSource(el) {
  return normalizeSource(
    el?.['dataset']?.['desktopMediaSourceUrl'] ||
      el?.['currentSrc'] ||
      el?.['getAttribute']?.('src') ||
      el?.['src'],
  );
}
function getDeclaredVideoSource(item) {
  return normalizeSource(item?.['getAttribute']?.('src') || item?.['src'] || item?.['currentSrc']);
}
function cancelPendingFrameCallback(key, enabled2) {
  if (!enabled2 || enabled2['callbackId'] == null) return;
  try {
    key?.['cancelVideoFrameCallback']?.(enabled2['callbackId']);
  } catch {}
  enabled2['callbackId'] = null;
}
function clearPresentedDataset(el2) {
  if (!el2?.['dataset']) return;
  (delete el2['dataset']['firstFramePresented'],
    delete el2['dataset']['firstFramePresentedAt'],
    delete el2['dataset']['firstFramePresentedSource']);
}
function createSourceState(el3, source) {
  const index = videoFramePresentationState['get'](el3);
  (cancelPendingFrameCallback(el3, index), index?.['cleanup']?.(), clearPresentedDataset(el3));
  const result = {
    source: source,
    declaredSource: getDeclaredVideoSource(el3),
    callbackId: null,
    frameCallbackObserved: ![],
    frameCallbackAt: 0x0,
    presented: ![],
    presentedAt: 0x0,
    metadata: null,
    listeners: new Set(),
  };
  videoFramePresentationState['set'](el3, result);
  const data = () => resetVideoFramePresentation(el3);
  return (
    el3['addEventListener']?.('emptied', data),
    (result['cleanup'] = () => el3['removeEventListener']?.('emptied', data)),
    result
  );
}
function readSourceState(options) {
  const source2 = getVideoPresentationSource(options),
    state = videoFramePresentationState['get'](options);
  if (!source2) {
    if (state) createSourceState(options, '');
    return { source: '', state: videoFramePresentationState['get'](options) || null };
  }
  if (!state || state['source'] !== source2 || state['declaredSource'] !== getDeclaredVideoSource(options))
    return { source: source2, state: createSourceState(options, source2) };
  return { source: source2, state: state };
}
function isCurrentPresentedFrameValid(el4, target, next = 0x2) {
  return !!(
    el4 &&
    target &&
    el4['isConnected'] !== ![] &&
    getVideoPresentationSource(el4) === target &&
    videoFramePresentationState['get'](el4)?.['declaredSource'] === getDeclaredVideoSource(el4) &&
    Number(el4['readyState'] || 0x0) >= next &&
    Number(el4['videoWidth'] || 0x0) > 0x0 &&
    Number(el4['videoHeight'] || 0x0) > 0x0 &&
    !el4['error']
  );
}
export function resetVideoFramePresentation(enabled3) {
  if (!enabled3) return;
  const current = videoFramePresentationState['get'](enabled3);
  (cancelPendingFrameCallback(enabled3, current),
    current?.['cleanup']?.(),
    videoFramePresentationState['delete'](enabled3),
    clearPresentedDataset(enabled3));
}
export function hasPresentedVideoFrame(enabled4, entry = '') {
  if (!enabled4) return ![];
  const videoPresentationSource = getVideoPresentationSource(enabled4),
    source3 = normalizeSource(entry);
  if (!videoPresentationSource || (source3 && videoPresentationSource !== source3)) return ![];
  const record = videoFramePresentationState['get'](enabled4);
  return !!(
    record?.['presented'] === !![] &&
    record['source'] === videoPresentationSource &&
    isCurrentPresentedFrameValid(enabled4, videoPresentationSource, 0x1)
  );
}
export function watchVideoFramePresentation(el5, payload) {
  if (!el5) return ![];
  const { source: source4, state: state2 } = readSourceState(el5);
  if (!source4 || !state2) return ![];
  if (!state2['presented'] && state2['frameCallbackObserved'] && isCurrentPresentedFrameValid(el5, source4)) {
    ((state2['presented'] = !![]), (state2['presentedAt'] = state2['frameCallbackAt']));
    el5['dataset'] &&
      ((el5['dataset']['firstFramePresented'] = '1'),
      (el5['dataset']['firstFramePresentedAt'] = String(state2['presentedAt'])),
      (el5['dataset']['firstFramePresentedSource'] = source4));
    globalThis['window']?.['__runtimeCompareMark']?.('video-frame-presentation:ready', {
      source: source4,
      readyState: Number(el5['readyState'] || 0x0),
      videoWidth: Number(el5['videoWidth'] || 0x0),
      videoHeight: Number(el5['videoHeight'] || 0x0),
    });
    const handle = Array['from'](state2['listeners']);
    state2['listeners']['clear']();
    const config = {
      source: source4,
      presentedAt: state2['presentedAt'],
      metadata: state2['metadata'],
    };
    for (const run of handle) {
      if (videoFramePresentationState['get'](el5) !== state2) break;
      run(config);
    }
  }
  if (state2['presented'] && isCurrentPresentedFrameValid(el5, source4))
    return (
      payload?.({
        source: source4,
        presentedAt: state2['presentedAt'],
        metadata: state2['metadata'],
      }),
      !![]
    );
  if (typeof payload === 'function') state2['listeners']['add'](payload);
  if (state2['callbackId'] != null) return !![];
  if (typeof el5['requestVideoFrameCallback'] !== 'function') return ![];
  return (
    (state2['callbackId'] = el5['requestVideoFrameCallback']((scope, box = {}) => {
      const input = videoFramePresentationState['get'](el5);
      if (input !== state2) return;
      state2['callbackId'] = null;
      const output = !!(
        el5?.['isConnected'] !== ![] &&
        getVideoPresentationSource(el5) === source4 &&
        Number(el5?.['videoWidth'] || box['width'] || 0x0) > 0x0 &&
        Number(el5?.['videoHeight'] || box['height'] || 0x0) > 0x0 &&
        !el5?.['error']
      );
      output &&
        ((state2['frameCallbackObserved'] = !![]),
        (state2['frameCallbackAt'] = Number(scope || 0x0)),
        (state2['metadata'] = {
          mediaTime: Number(box['mediaTime'] || 0x0),
          presentedFrames: Number(box['presentedFrames'] || 0x0),
          width: Number(box['width'] || el5['videoWidth'] || 0x0),
          height: Number(box['height'] || el5['videoHeight'] || 0x0),
        }));
      if (!isCurrentPresentedFrameValid(el5, source4)) {
        globalThis['window']?.['__runtimeCompareMark']?.('video-frame-presentation:invalid', {
          source: source4,
          currentSource: getVideoPresentationSource(el5),
          readyState: Number(el5?.['readyState'] || 0x0),
          videoWidth: Number(el5?.['videoWidth'] || 0x0),
          videoHeight: Number(el5?.['videoHeight'] || 0x0),
        });
        return;
      }
      ((state2['presented'] = !![]), (state2['presentedAt'] = state2['frameCallbackAt']));
      el5['dataset'] &&
        ((el5['dataset']['firstFramePresented'] = '1'),
        (el5['dataset']['firstFramePresentedAt'] = String(state2['presentedAt'])),
        (el5['dataset']['firstFramePresentedSource'] = source4));
      globalThis['window']?.['__runtimeCompareMark']?.('video-frame-presentation:ready', {
        source: source4,
        readyState: Number(el5['readyState'] || 0x0),
        videoWidth: Number(el5['videoWidth'] || 0x0),
        videoHeight: Number(el5['videoHeight'] || 0x0),
      });
      const value2 = Array['from'](state2['listeners']);
      state2['listeners']['clear']();
      const value3 = {
        source: source4,
        presentedAt: state2['presentedAt'],
        metadata: state2['metadata'],
      };
      for (const run2 of value2) {
        if (videoFramePresentationState['get'](el5) !== state2) break;
        run2(value3);
      }
    })),
    !![]
  );
}
export const __videoFramePresentationForTest = {
  getState(value4) {
    return videoFramePresentationState['get'](value4) || null;
  },
};
