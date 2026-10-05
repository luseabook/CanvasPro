import { fetchRemoteBlob } from '../../api/projectsV2Api.js';
let _ctx = null;
const _cache = new Map(),
  _bufferCache = new Map(),
  _bufferInflight = new Map();
function _queueDeferredTask(handler) {
  if (typeof handler !== 'function') return () => {};
  let enabled = false;
  if (typeof queueMicrotask === 'function')
    return (
      queueMicrotask(() => {
        if (!enabled) handler();
      }),
      () => {
        enabled = true;
      }
    );
  const setTimeout2 = setTimeout(() => {
    if (!enabled) handler();
  }, 0);
  return () => {
    ((enabled = true), clearTimeout(setTimeout2));
  };
}
export function deferWaveformPathUntilAudioReady(el, handler2) {
  if (typeof handler2 !== 'function') return () => {};
  if (!el || typeof el.addEventListener !== 'function') return _queueDeferredTask(handler2);
  let run = null,
    enabled2 = false;
  const run2 = () => {
      (el.removeEventListener('loadeddata', value), el.removeEventListener('error', item));
    },
    value = () => {
      run2();
      if (enabled2) return;
      run = _queueDeferredTask(() => {
        run = null;
        if (!enabled2) handler2();
      });
    },
    item = () => {
      run2();
    };
  return (
    Number(el.readyState || 0) >= 2
      ? (run = _queueDeferredTask(() => {
          run = null;
          if (!enabled2) handler2();
        }))
      : (el.addEventListener('loadeddata', value, { once: true }),
        el.addEventListener('error', item, { once: true })),
    () => {
      ((enabled2 = true), run2(), typeof run === 'function' && (run(), (run = null)));
    }
  );
}
function _getAudioContext() {
  if (_ctx) return _ctx;
  const run3 = window.AudioContext || window.webkitAudioContext;
  if (!run3) return null;
  return ((_ctx = new run3()), _ctx);
}
function _decodeAudioData(key, index) {
  return new Promise((result, data) => {
    const promise = key.decodeAudioData(index, result, data);
    if (promise && typeof promise.then === 'function') promise.then(result).catch(data);
  });
}
function _buildMinMaxBarsPath(list, { width: width2, height: height2, samples: samples2 }) {
  const options = Number(width2) || 200,
    target = Number(height2) || 80,
    source = Math.max(40, Math.min(400, Math.round(Number(samples2) || 180))),
    next = target / 2,
    current = Math.max(1, Math.round(target * 0.08)),
    entry = Math.max(1, next - current),
    record = Math.max(1, Number(list?.numberOfChannels) || 1),
    enabled3 = Number(list?.length) || 0;
  if (!enabled3) return '';
  const list2 = [];
  for (let payload = 0; payload < record; payload++) {
    try {
      list2.push(list.getChannelData(payload));
    } catch (handle) {}
  }
  if (!list2.length) return '';
  const state = Math.max(1, Math.floor(enabled3 / source));
  let config = '';
  for (let scope = 0; scope < source; scope++) {
    const input = scope * state,
      output = Math.min(enabled3, input + state);
    let value2 = 1,
      value3 = -1;
    for (let value4 = 0; value4 < list2.length; value4++) {
      const value5 = list2[value4];
      for (let value6 = input; value6 < output; value6++) {
        const value7 = value5[value6] || 0;
        if (value7 < value2) value2 = value7;
        if (value7 > value3) value3 = value7;
      }
    }
    const value8 = Math.min(1, Math.max(Math.abs(value2), Math.abs(value3))),
      value9 = next - value8 * entry,
      value10 = next + value8 * entry,
      value11 = ((scope + 0.5) / source) * options;
    config +=
      'M' +
      value11.toFixed(2) +
      ',' +
      value9.toFixed(2) +
      ' L' +
      value11.toFixed(2) +
      ',' +
      value10.toFixed(2) +
      ' ';
  }
  return config.trim();
}
function _buildBarsPathFromPeaks(value12, { width: width3, height: height3, samples: samples3 }) {
  const list3 = Array.isArray(value12) ? value12 : [];
  if (!list3.length) return '';
  const value13 = Number(width3) || 200,
    value14 = Number(height3) || 80,
    value15 = Math.max(1, Math.min(list3.length, Math.round(Number(samples3) || list3.length))),
    value16 = value14 / 2,
    value17 = Math.max(1, Math.round(value14 * 0.08)),
    value18 = Math.max(1, value16 - value17);
  let value19 = '';
  for (let value20 = 0; value20 < value15; value20++) {
    const value21 = Math.min(list3.length - 1, Math.floor((value20 / value15) * list3.length)),
      value22 = Math.min(1, Math.max(0, Number(list3[value21]) || 0)),
      value23 = value16 - value22 * value18,
      value24 = value16 + value22 * value18,
      value25 = ((value20 + 0.5) / value15) * value13;
    value19 +=
      'M' +
      value25.toFixed(2) +
      ',' +
      value23.toFixed(2) +
      ' L' +
      value25.toFixed(2) +
      ',' +
      value24.toFixed(2) +
      ' ';
  }
  return value19.trim();
}
export async function getWaveformBarsPathFromPersistedUrl(
  value26,
  { width: width = 200, height: height = 80, samples: samples = 180 } = {},
) {
  const enabled4 = String(value26 || '').trim();
  if (!enabled4) return '';
  const value27 = 'persisted:' + enabled4 + '|' + width + '|' + height + '|' + samples,
    value28 = _cache.get(value27);
  if (value28) return value28;
  try {
    const response = await fetchRemoteBlob(enabled4),
      value29 = JSON.parse(await response.text()),
      _buildBarsPathFromPeaks2 = _buildBarsPathFromPeaks(value29?.peaks, {
        width: width,
        height: height,
        samples: samples,
      });
    if (_buildBarsPathFromPeaks2) _cache.set(value27, _buildBarsPathFromPeaks2);
    return _buildBarsPathFromPeaks2;
  } catch {
    return '';
  }
}
async function _getDecodedAudioBufferFromUrl(value30) {
  const enabled5 = String(value30 || '').trim();
  if (!enabled5) return null;
  const _getAudioContext2 = _getAudioContext();
  if (!_getAudioContext2) return null;
  let enabled6 = _bufferCache.get(enabled5);
  if (!enabled6) {
    let enabled7 = _bufferInflight.get(enabled5);
    !enabled7 &&
      ((enabled7 = (async () => {
        let enabled8;
        try {
          const fetchRemoteBlob2 = await fetchRemoteBlob(enabled5);
          enabled8 = await fetchRemoteBlob2.arrayBuffer();
        } catch (value31) {
          return null;
        }
        if (!enabled8) return null;
        try {
          const _decodeAudioData2 = await _decodeAudioData(_getAudioContext2, enabled8);
          return _decodeAudioData2 || null;
        } catch (value32) {
          return null;
        }
      })()),
      _bufferInflight.set(enabled5, enabled7));
    try {
      enabled6 = await enabled7;
    } finally {
      if (_bufferInflight.get(enabled5) === enabled7) _bufferInflight.delete(enabled5);
    }
    if (enabled6) _bufferCache.set(enabled5, enabled6);
  }
  return enabled6 || null;
}
export async function getAudioDurationFromUrl(value33) {
  const _getDecodedAudioBufferFromUrl2 = await _getDecodedAudioBufferFromUrl(value33),
    count = Number(_getDecodedAudioBufferFromUrl2?.duration || 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
export async function getWaveformBarsPathFromUrl(
  value34,
  { width: width = 200, height: height = 80, samples: samples = 180 } = {},
) {
  const enabled9 = String(value34 || '').trim();
  if (!enabled9) return '';
  const value35 = enabled9 + '|' + width + '|' + height + '|' + samples,
    value36 = _cache.get(value35);
  if (value36) return value36;
  const _getDecodedAudioBufferFromUrl3 = await _getDecodedAudioBufferFromUrl(enabled9);
  if (!_getDecodedAudioBufferFromUrl3) return '';
  const _buildMinMaxBarsPath2 = _buildMinMaxBarsPath(_getDecodedAudioBufferFromUrl3, {
    width: width,
    height: height,
    samples: samples,
  });
  if (_buildMinMaxBarsPath2) _cache.set(value35, _buildMinMaxBarsPath2);
  return _buildMinMaxBarsPath2;
}

const _decodeQueue = [];

let _activeDecodes = 0;

const MAX_CONCURRENT_AUDIO_DECODES = 2,
  MAX_WAVEFORM_PATHS = 256;

function _cachePath(value37, enabled10, count2 = 0) {
  if (!enabled10) return;
  (_cache['delete'](value37),
    _cache['set'](value37, {
      path: enabled10,
      duration: Number['isFinite'](count2) && count2 > 0 ? count2 : 0,
    }));
  while (_cache['size'] > MAX_WAVEFORM_PATHS) _cache['delete'](_cache['keys']()['next']()['value']);
}

function _readWaveformResult(value38, value39) {
  const count3 = Number(value38?.['duration']);
  if (Number['isFinite'](count3) && count3 > 0) value39?.(count3);
  return value38?.['path'] || '';
}

function _queueAudioDecode(handler3, value40) {
  return new Promise((handler4) => {
    const value41 = () => {
        const count4 = _decodeQueue['indexOf'](handler5);
        count4 >= 0 && (_decodeQueue['splice'](count4, 1), handler4(null));
      },
      handler5 = async () => {
        (value40?.['removeEventListener']('abort', value41), (_activeDecodes += 1));
        try {
          handler4(value40?.['aborted'] ? null : await handler3());
        } catch {
          handler4(null);
        } finally {
          _activeDecodes -= 1;
          while (_activeDecodes < MAX_CONCURRENT_AUDIO_DECODES && _decodeQueue['length']) {
            void _decodeQueue['shift']()();
          }
        }
      };
    if (value40?.['aborted']) return handler4(null);
    if (_activeDecodes < MAX_CONCURRENT_AUDIO_DECODES) void handler5();
    else (_decodeQueue['push'](handler5), value40?.['addEventListener']('abort', value41, { once: !![] }));
  });
}

function _createDecodedAudioBufferJob(value42, value43) {
  const value44 = typeof AbortController === 'function' ? new AbortController() : null,
    value45 = { consumers: 0, controller: value44, settled: ![], promise: null };
  return (
    (value45['promise'] = _queueAudioDecode(async () => {
      let enabled11;
      try {
        const fetchRemoteBlob3 = await fetchRemoteBlob(value42, { signal: value44?.['signal'] });
        enabled11 = await fetchRemoteBlob3['arrayBuffer']();
      } catch {
        return null;
      }
      if (!enabled11 || value44?.['signal']?.['aborted']) return null;
      try {
        const _decodeAudioData3 = await _decodeAudioData(value43, enabled11);
        return value44?.['signal']?.['aborted'] ? null : _decodeAudioData3 || null;
      } catch {
        return null;
      }
    }, value44?.['signal'])['finally'](() => {
      value45['settled'] = !![];
      if (_bufferInflight['get'](value42) === value45) _bufferInflight['delete'](value42);
    })),
    _bufferInflight['set'](value42, value45),
    value45
  );
}

async function _waitForDecodedAudioBufferJob(enabled12, value46) {
  if (!enabled12 || value46?.['aborted']) return null;
  enabled12['consumers'] += 1;
  let value47 = ![],
    value48 = null;
  const value49 = value46
    ? new Promise((handler6) => {
        ((value48 = () => {
          ((value47 = !![]), handler6(null));
        }),
          value46['addEventListener']('abort', value48, { once: !![] }));
      })
    : null;
  try {
    return await (value49 ? Promise['race']([enabled12['promise'], value49]) : enabled12['promise']);
  } finally {
    if (value46 && value48) value46['removeEventListener']('abort', value48);
    ((enabled12['consumers'] = Math['max'](0, enabled12['consumers'] - 1)),
      value47 &&
        !enabled12['settled'] &&
        enabled12['consumers'] === 0 &&
        enabled12['controller']?.['abort']());
  }
}

export async function getAudioNodeWaveformPath(value50, value51, args = {}) {
  if (args['signal']?.['aborted']) return '';
  const value52 = JSON['stringify']([
      'audio-node',
      value50,
      value51,
      args['width'],
      args['height'],
      args['samples'],
    ]),
    value53 = _cache['get'](value52);
  if (value53 && (value53['duration'] > 0 || !args['onDuration']))
    return _readWaveformResult(value53, args['onDuration']);
  const value54 = value51 ? await getWaveformBarsPathFromPersistedUrl(value51, args) : '';
  if (args['signal']?.['aborted']) return '';
  let audioDurationFromUrl = 0;
  if (value54) {
    args['onDuration'] &&
      (audioDurationFromUrl = await getAudioDurationFromUrl(value50, {
        signal: args['signal'],
        cacheBuffer: ![],
      }));
    if (args['signal']?.['aborted']) return '';
    return (
      _cachePath(value52, value54, audioDurationFromUrl),
      _readWaveformResult({ path: value54, duration: audioDurationFromUrl }, args['onDuration'])
    );
  }
  const waveformBarsPathFromUrl = await getWaveformBarsPathFromUrl(value50, {
    ...args,
    cacheBuffer: ![],
    onDuration: (value55) => {
      audioDurationFromUrl = value55;
    },
  });
  if (args['signal']?.['aborted']) return '';
  return (
    _cachePath(value52, waveformBarsPathFromUrl, audioDurationFromUrl),
    _readWaveformResult({ path: waveformBarsPathFromUrl, duration: audioDurationFromUrl }, args['onDuration'])
  );
}
