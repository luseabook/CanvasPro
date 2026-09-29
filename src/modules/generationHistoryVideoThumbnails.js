import { localPathToUrl, normalizeLocalPath, urlToLocalPath } from '../utils/localMediaPath.js';
const VIDEO_EXTENSION_RE = /\.(?:mp4|webm|mov|m4v|avi|mkv)(?:[?#].*)?$/i;
function firstText(..._0x246a3) {
  for (const _0x515ad7 of _0x246a3) {
    const _0x2cbe40 = String(_0x515ad7 || '')['trim']();
    if (_0x2cbe40) return _0x2cbe40;
  }
  return '';
}
function firstNode(_0x3e0a90 = {}) {
  return Array['isArray'](_0x3e0a90?.['nodes']) ? _0x3e0a90['nodes'][0x0] || {} : {};
}
function firstItem(_0x5aad59 = {}) {
  return Array['isArray'](_0x5aad59?.['items']) ? _0x5aad59['items'][0x0] || {} : {};
}
function resolveMediaSrc(_0x50e677 = {}) {
  const _0x268f38 = firstNode(_0x50e677),
    _0x3d1d78 = normalizeLocalPath(
      _0x50e677?.['localPath'] ||
        _0x50e677?.['outputItem']?.['localPath'] ||
        _0x268f38?.['originalLocalPath'] ||
        _0x268f38?.['localPath'] ||
        _0x268f38?.['displayLocalPath'],
    );
  return firstText(
    localPathToUrl(_0x3d1d78),
    _0x268f38?.['videoUrl'],
    _0x268f38?.['sourceUrl'],
    _0x268f38?.['src'],
  );
}
function isUsablePosterCandidate(_0x426201, _0x2cb514) {
  const _0x10ff48 = String(_0x426201 || '')['trim']();
  if (!_0x10ff48 || _0x10ff48 === _0x2cb514) return ![];
  const _0x57ebd5 = urlToLocalPath(_0x10ff48),
    _0x39a6d3 = urlToLocalPath(_0x2cb514);
  if (_0x57ebd5 && _0x57ebd5 === _0x39a6d3) return ![];
  return !VIDEO_EXTENSION_RE['test'](_0x10ff48);
}
export function resolveGenerationHistoryVideoPresentation(_0x4ff127 = {}) {
  const _0x4b0096 = firstNode(_0x4ff127),
    _0x3e90cc = firstItem(_0x4ff127),
    _0x17b7f7 = resolveMediaSrc(_0x4ff127),
    _0x17454a = [
      localPathToUrl(_0x4b0096?.['posterLocalPath']),
      localPathToUrl(_0x4b0096?.['thumbLocalPath']),
      localPathToUrl(_0x4ff127?.['outputItem']?.['thumbLocalPath']),
      _0x4b0096?.['posterUrl'],
      _0x4b0096?.['thumbUrl'],
      _0x4ff127?.['coverUrl'],
      _0x3e90cc?.['thumbSrc'],
    ],
    _0x2a5e63 = _0x17454a['find']((_0x31c3d9) => isUsablePosterCandidate(_0x31c3d9, _0x17b7f7)) || '';
  return {
    mediaSrc: _0x17b7f7,
    posterSrc: String(_0x2a5e63 || '')['trim'](),
    needsBackfill: Boolean(_0x17b7f7 && urlToLocalPath(_0x17b7f7) && !_0x2a5e63),
  };
}
export function applyGenerationHistoryVideoThumbnail(_0x3e0182 = {}, _0x1fd559 = {}) {
  const _0x3777a9 = normalizeLocalPath(
      _0x1fd559?.['posterLocalPath'] ||
        _0x1fd559?.['thumbLocalPath'] ||
        _0x1fd559?.['posterUrl'] ||
        _0x1fd559?.['thumbUrl'],
    ),
    _0x284a11 = firstText(localPathToUrl(_0x3777a9), _0x1fd559?.['posterUrl'], _0x1fd559?.['thumbUrl']);
  if (!_0x284a11) return _0x3e0182;
  const _0x1d91d1 = firstText(
      _0x1fd559?.['videoThumbSrc'],
      resolveGenerationHistoryVideoPresentation(_0x3e0182)['mediaSrc'],
    ),
    _0x14a7fc = Array['isArray'](_0x3e0182?.['nodes'])
      ? _0x3e0182['nodes']['map']((_0x1a555a, _0xde4d89) =>
          _0xde4d89 === 0x0
            ? {
                ..._0x1a555a,
                posterUrl: _0x284a11,
                thumbUrl: _0x284a11,
                posterLocalPath: _0x3777a9,
                thumbLocalPath: _0x3777a9,
                videoThumbSrc: _0x1d91d1,
              }
            : _0x1a555a,
        )
      : [],
    _0x19a49b = Array['isArray'](_0x3e0182?.['items'])
      ? _0x3e0182['items']['map']((_0x45a26e, _0x34e2d6) =>
          _0x34e2d6 === 0x0
            ? {
                ..._0x45a26e,
                thumbSrc: _0x284a11,
                ...(_0x45a26e?.['nodeData']
                  ? {
                      nodeData: {
                        ..._0x45a26e['nodeData'],
                        posterUrl: _0x284a11,
                        thumbUrl: _0x284a11,
                        posterLocalPath: _0x3777a9,
                        thumbLocalPath: _0x3777a9,
                        videoThumbSrc: _0x1d91d1,
                      },
                    }
                  : {}),
              }
            : _0x45a26e,
        )
      : [];
  return {
    ..._0x3e0182,
    coverUrl: _0x284a11,
    ...(_0x3777a9 ? { thumbLocalPath: _0x3777a9 } : {}),
    nodes: _0x14a7fc,
    items: _0x19a49b,
  };
}
export function createVideoThumbnailRequestQueue({ concurrency: concurrency = 0x1 } = {}) {
  const _0x55839e = Math['max'](0x1, Math['trunc'](Number(concurrency) || 0x1)),
    _0x51703a = [],
    _0x3fa601 = new Map();
  let _0x5dca47 = 0x0;
  const _0x1b001b = () => {
    while (_0x5dca47 < _0x55839e && _0x51703a['length'] > 0x0) {
      const _0x4d72d1 = _0x51703a['shift']();
      ((_0x5dca47 += 0x1),
        Promise['resolve']()
          ['then'](_0x4d72d1['task'])
          ['then'](
            (_0x4f52f3) => {
              _0x5dca47 -= 0x1;
              if (_0x3fa601['get'](_0x4d72d1['key']) === _0x4d72d1['promise'])
                _0x3fa601['delete'](_0x4d72d1['key']);
              (_0x1b001b(), _0x4d72d1['resolve'](_0x4f52f3));
            },
            (_0x45a20f) => {
              _0x5dca47 -= 0x1;
              if (_0x3fa601['get'](_0x4d72d1['key']) === _0x4d72d1['promise'])
                _0x3fa601['delete'](_0x4d72d1['key']);
              (_0x1b001b(), _0x4d72d1['reject'](_0x45a20f));
            },
          ));
    }
  };
  return {
    enqueue(_0x4cf8e1, _0x3e3d2b) {
      const _0x24d7af = String(_0x4cf8e1 || '')['trim']();
      if (!_0x24d7af) return Promise['reject'](new Error('Missing video thumbnail source'));
      const _0x1a52a4 = _0x3fa601['get'](_0x24d7af);
      if (_0x1a52a4) return _0x1a52a4;
      let _0x21b06a, _0x6a1481;
      const _0x484a3e = new Promise((_0x1cab16, _0xc7a5bd) => {
          ((_0x21b06a = _0x1cab16), (_0x6a1481 = _0xc7a5bd));
        }),
        _0xa54bf6 = {
          key: _0x24d7af,
          task: _0x3e3d2b,
          promise: _0x484a3e,
          resolve: _0x21b06a,
          reject: _0x6a1481,
        };
      return (_0x3fa601['set'](_0x24d7af, _0x484a3e), _0x51703a['push'](_0xa54bf6), _0x1b001b(), _0x484a3e);
    },
  };
}
