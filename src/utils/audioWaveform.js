import { fetchRemoteBlob } from '../../api/projectsV2Api.js';
let _ctx = null;
const _cache = new Map(),
  _bufferCache = new Map(),
  _bufferInflight = new Map();
function _queueDeferredTask(_0x1d171e) {
  if (typeof _0x1d171e !== 'function') return () => {};
  let _0x276b14 = false;
  if (typeof queueMicrotask === 'function')
    return (
      queueMicrotask(() => {
        if (!_0x276b14) _0x1d171e();
      }),
      () => {
        _0x276b14 = true;
      }
    );
  const _0x3dd379 = setTimeout(() => {
    if (!_0x276b14) _0x1d171e();
  }, 0);
  return () => {
    ((_0x276b14 = true), clearTimeout(_0x3dd379));
  };
}
export function deferWaveformPathUntilAudioReady(_0x5002ab, _0x2e631a) {
  if (typeof _0x2e631a !== 'function') return () => {};
  if (!_0x5002ab || typeof _0x5002ab.addEventListener !== 'function') return _queueDeferredTask(_0x2e631a);
  let _0x37cf02 = null,
    _0x26f5ae = false;
  const _0x2b13ec = () => {
      (_0x5002ab.removeEventListener('loadeddata', _0x461cc1),
        _0x5002ab.removeEventListener('error', _0x17fc06));
    },
    _0x461cc1 = () => {
      _0x2b13ec();
      if (_0x26f5ae) return;
      _0x37cf02 = _queueDeferredTask(() => {
        _0x37cf02 = null;
        if (!_0x26f5ae) _0x2e631a();
      });
    },
    _0x17fc06 = () => {
      _0x2b13ec();
    };
  return (
    Number(_0x5002ab.readyState || 0) >= 2
      ? (_0x37cf02 = _queueDeferredTask(() => {
          _0x37cf02 = null;
          if (!_0x26f5ae) _0x2e631a();
        }))
      : (_0x5002ab.addEventListener('loadeddata', _0x461cc1, { once: true }),
        _0x5002ab.addEventListener('error', _0x17fc06, { once: true })),
    () => {
      ((_0x26f5ae = true), _0x2b13ec(), typeof _0x37cf02 === 'function' && (_0x37cf02(), (_0x37cf02 = null)));
    }
  );
}
function _getAudioContext() {
  if (_ctx) return _ctx;
  const _0x20491c = window.AudioContext || window.webkitAudioContext;
  if (!_0x20491c) return null;
  return ((_ctx = new _0x20491c()), _ctx);
}
function _decodeAudioData(_0x564c24, _0x5360ba) {
  return new Promise((_0x13e81a, _0x5a751d) => {
    const _0x2f20e7 = _0x564c24.decodeAudioData(_0x5360ba, _0x13e81a, _0x5a751d);
    if (_0x2f20e7 && typeof _0x2f20e7.then === 'function') _0x2f20e7.then(_0x13e81a).catch(_0x5a751d);
  });
}
function _buildMinMaxBarsPath(_0x1f02c9, { width: _0x18fdca, height: _0x359f86, samples: _0x273d5a }) {
  const _0x3b52d7 = Number(_0x18fdca) || 200,
    _0x465dcc = Number(_0x359f86) || 80,
    _0x5a3403 = Math.max(40, Math.min(0x190, Math.round(Number(_0x273d5a) || 180))),
    _0x57f31a = _0x465dcc / 2,
    _0xcf5d90 = Math.max(1, Math.round(_0x465dcc * 0.08)),
    _0xd11af0 = Math.max(1, _0x57f31a - _0xcf5d90),
    _0x10fbf9 = Math.max(1, Number(_0x1f02c9?.numberOfChannels) || 1),
    _0x1cc109 = Number(_0x1f02c9?.length) || 0;
  if (!_0x1cc109) return '';
  const _0x5b065a = [];
  for (let _0x2f1461 = 0; _0x2f1461 < _0x10fbf9; _0x2f1461++) {
    try {
      _0x5b065a.push(_0x1f02c9.getChannelData(_0x2f1461));
    } catch (_0x1131a4) {}
  }
  if (!_0x5b065a.length) return '';
  const _0x1e2955 = Math.max(1, Math.floor(_0x1cc109 / _0x5a3403));
  let _0x4e3538 = '';
  for (let _0x49fdc6 = 0; _0x49fdc6 < _0x5a3403; _0x49fdc6++) {
    const _0x36ba2c = _0x49fdc6 * _0x1e2955,
      _0x57625c = Math.min(_0x1cc109, _0x36ba2c + _0x1e2955);
    let _0x2ee7e0 = 1,
      _0x643227 = -1;
    for (let _0x1806de = 0; _0x1806de < _0x5b065a.length; _0x1806de++) {
      const _0x4e930b = _0x5b065a[_0x1806de];
      for (let _0x413bb8 = _0x36ba2c; _0x413bb8 < _0x57625c; _0x413bb8++) {
        const _0x36c64c = _0x4e930b[_0x413bb8] || 0;
        if (_0x36c64c < _0x2ee7e0) _0x2ee7e0 = _0x36c64c;
        if (_0x36c64c > _0x643227) _0x643227 = _0x36c64c;
      }
    }
    const _0x4d48ce = Math.min(1, Math.max(Math.abs(_0x2ee7e0), Math.abs(_0x643227))),
      _0x2d8048 = _0x57f31a - _0x4d48ce * _0xd11af0,
      _0x4e829e = _0x57f31a + _0x4d48ce * _0xd11af0,
      _0x164cda = ((_0x49fdc6 + 0.5) / _0x5a3403) * _0x3b52d7;
    _0x4e3538 +=
      'M' +
      _0x164cda.toFixed(2) +
      ',' +
      _0x2d8048.toFixed(2) +
      ' L' +
      _0x164cda.toFixed(2) +
      ',' +
      _0x4e829e.toFixed(2) +
      ' ';
  }
  return _0x4e3538.trim();
}
function _buildBarsPathFromPeaks(_0x4a9fce, { width: _0x4c9592, height: _0x569fd0, samples: _0x39aa4e }) {
  const _0x52347e = Array.isArray(_0x4a9fce) ? _0x4a9fce : [];
  if (!_0x52347e.length) return '';
  const _0xdfcae3 = Number(_0x4c9592) || 200,
    _0x3e90cb = Number(_0x569fd0) || 80,
    _0xaa3adb = Math.max(1, Math.min(_0x52347e.length, Math.round(Number(_0x39aa4e) || _0x52347e.length))),
    _0x8f4bb0 = _0x3e90cb / 2,
    _0x305dd7 = Math.max(1, Math.round(_0x3e90cb * 0.08)),
    _0x2e6783 = Math.max(1, _0x8f4bb0 - _0x305dd7);
  let _0x433032 = '';
  for (let _0x36d8d8 = 0; _0x36d8d8 < _0xaa3adb; _0x36d8d8++) {
    const _0x3a4ce0 = Math.min(_0x52347e.length - 1, Math.floor((_0x36d8d8 / _0xaa3adb) * _0x52347e.length)),
      _0x49e585 = Math.min(1, Math.max(0, Number(_0x52347e[_0x3a4ce0]) || 0)),
      _0x4dcdfc = _0x8f4bb0 - _0x49e585 * _0x2e6783,
      _0x1d97e6 = _0x8f4bb0 + _0x49e585 * _0x2e6783,
      _0x42bb56 = ((_0x36d8d8 + 0.5) / _0xaa3adb) * _0xdfcae3;
    _0x433032 +=
      'M' +
      _0x42bb56.toFixed(2) +
      ',' +
      _0x4dcdfc.toFixed(2) +
      ' L' +
      _0x42bb56.toFixed(2) +
      ',' +
      _0x1d97e6.toFixed(2) +
      ' ';
  }
  return _0x433032.trim();
}
export async function getWaveformBarsPathFromPersistedUrl(
  _0x32f52b,
  { width: width = 200, height: height = 80, samples: samples = 180 } = {},
) {
  const _0x5eec07 = String(_0x32f52b || '').trim();
  if (!_0x5eec07) return '';
  const _0x37b6e7 = 'persisted:' + _0x5eec07 + '|' + width + '|' + height + '|' + samples,
    _0x256af0 = _cache.get(_0x37b6e7);
  if (_0x256af0) return _0x256af0;
  try {
    const _0x566576 = await fetchRemoteBlob(_0x5eec07),
      _0x9a1276 = JSON.parse(await _0x566576.text()),
      _0x588276 = _buildBarsPathFromPeaks(_0x9a1276?.peaks, {
        width: width,
        height: height,
        samples: samples,
      });
    if (_0x588276) _cache.set(_0x37b6e7, _0x588276);
    return _0x588276;
  } catch {
    return '';
  }
}
async function _getDecodedAudioBufferFromUrl(_0x231938) {
  const _0x399797 = String(_0x231938 || '').trim();
  if (!_0x399797) return null;
  const _0x3d178d = _getAudioContext();
  if (!_0x3d178d) return null;
  let _0x4b216c = _bufferCache.get(_0x399797);
  if (!_0x4b216c) {
    let _0x3b4ab2 = _bufferInflight.get(_0x399797);
    !_0x3b4ab2 &&
      ((_0x3b4ab2 = (async () => {
        let _0xac6e25;
        try {
          const _0x4d8b74 = await fetchRemoteBlob(_0x399797);
          _0xac6e25 = await _0x4d8b74.arrayBuffer();
        } catch (_0x378942) {
          return null;
        }
        if (!_0xac6e25) return null;
        try {
          const _0x181c34 = await _decodeAudioData(_0x3d178d, _0xac6e25);
          return _0x181c34 || null;
        } catch (_0xf35ef0) {
          return null;
        }
      })()),
      _bufferInflight.set(_0x399797, _0x3b4ab2));
    try {
      _0x4b216c = await _0x3b4ab2;
    } finally {
      if (_bufferInflight.get(_0x399797) === _0x3b4ab2) _bufferInflight.delete(_0x399797);
    }
    if (_0x4b216c) _bufferCache.set(_0x399797, _0x4b216c);
  }
  return _0x4b216c || null;
}
export async function getAudioDurationFromUrl(_0x55786d) {
  const _0x232cf1 = await _getDecodedAudioBufferFromUrl(_0x55786d),
    _0x52c32f = Number(_0x232cf1?.duration || 0);
  return Number.isFinite(_0x52c32f) && _0x52c32f > 0 ? _0x52c32f : 0;
}
export async function getWaveformBarsPathFromUrl(
  _0x5aa3da,
  { width: width = 200, height: height = 80, samples: samples = 180 } = {},
) {
  const _0x56377d = String(_0x5aa3da || '').trim();
  if (!_0x56377d) return '';
  const _0x24fa58 = _0x56377d + '|' + width + '|' + height + '|' + samples,
    _0x496962 = _cache.get(_0x24fa58);
  if (_0x496962) return _0x496962;
  const _0x38bbdc = await _getDecodedAudioBufferFromUrl(_0x56377d);
  if (!_0x38bbdc) return '';
  const _0x4a2e06 = _buildMinMaxBarsPath(_0x38bbdc, { width: width, height: height, samples: samples });
  if (_0x4a2e06) _cache.set(_0x24fa58, _0x4a2e06);
  return _0x4a2e06;
}
