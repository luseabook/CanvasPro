import {
  COLLABORATION_CHUNK_BYTES,
  COLLABORATION_MAX_ASSET_BYTES,
  isCollaborationMediaType,
  normalizeCollaborationMediaSource,
  readCollaborationMedia,
} from '../../../api/canvasCollaborationApi.js';
import { projectGraph } from './collaborationDocument.js';
import { createCollaborationPreviews } from './collaborationPreviews.js';
function toBase64(_0x4d9eaa) {
  let _0x3887cc = '';
  for (let _0x4e362a = 0x0; _0x4e362a < _0x4d9eaa['length']; _0x4e362a += 0x2000)
    _0x3887cc += String['fromCharCode'](..._0x4d9eaa['subarray'](_0x4e362a, _0x4e362a + 0x2000));
  return btoa(_0x3887cc);
}
async function hashBytes(_0x36860a) {
  return [...new Uint8Array(await crypto['subtle']['digest']('SHA-256', _0x36860a))]
    ['map']((_0x75e792) => _0x75e792['toString'](0x10)['padStart'](0x2, '0'))
    ['join']('');
}
export function createCollaborationMedia({
  rpc: _0x4f8051,
  readMedia: readMedia = readCollaborationMedia,
  registerMedia: registerMedia = async () => null,
  uploadMedia: _0x48bd32,
  bindMedia: _0x21ff91,
  imagePreviews: _0x139f7e,
  onProgress: onProgress = () => {},
  signal: _0x29e8fd,
}) {
  const _0x5e8197 = new Map(),
    _0x153872 = new Map(),
    _0x2f3a0f = createCollaborationPreviews(_0x139f7e),
    _0x5ec209 = () => {
      if (_0x29e8fd?.['aborted']) throw new DOMException('Aborted', 'AbortError');
    },
    _0xa2903a = (_0x1b1cd3) => _0x5e8197['get'](normalizeCollaborationMediaSource(_0x1b1cd3)) || _0x1b1cd3;
  return {
    resolveSource: _0xa2903a,
    snapshotBindings(_0x585487) {
      const _0x4a2018 = new Map();
      return (
        projectGraph(_0x585487, (_0x92e017) => {
          const _0x1bc289 = _0xa2903a(_0x92e017);
          if (_0x1bc289 !== _0x92e017)
            _0x4a2018['set'](normalizeCollaborationMediaSource(_0x92e017), _0x1bc289);
          return _0x1bc289;
        }),
        [..._0x4a2018]
      );
    },
    restoreBindings(_0x1d585f = []) {
      for (const _0x264d3c of _0x1d585f) {
        if (
          !Array['isArray'](_0x264d3c) ||
          typeof _0x264d3c[0x0] !== 'string' ||
          !/^aic-asset:[a-f0-9]{64}$/['test'](_0x264d3c[0x1])
        )
          continue;
        _0x5e8197['set'](normalizeCollaborationMediaSource(_0x264d3c[0x0]), _0x264d3c[0x1]);
      }
    },
    project: (_0x118936) => projectGraph(_0x118936, _0xa2903a),
    async prepare(_0x10b16c) {
      _0x10b16c = await _0x2f3a0f(_0x10b16c);
      const _0x59bc9e = new Set();
      projectGraph(_0x10b16c, (_0x2bbb7e) => {
        const _0x2c2288 = normalizeCollaborationMediaSource(_0x2bbb7e);
        if (!_0x5e8197['has'](_0x2c2288)) _0x59bc9e['add'](_0x2c2288);
        return _0x2bbb7e;
      });
      let _0x2aca54 = 0x0;
      for (const _0x2d8e9d of _0x59bc9e) {
        (_0x5ec209(), onProgress('正在准备素材地址 ' + ++_0x2aca54 + '/' + _0x59bc9e['size']));
        const _0x1eef48 = await registerMedia(_0x2d8e9d);
        _0x5ec209();
        if (_0x1eef48) {
          if (!/^[a-f0-9]{64}$/['test'](_0x1eef48['hash'])) throw new Error('本机素材登记响应无效');
          const _0x125385 = 'aic-asset:' + _0x1eef48['hash'];
          (_0x5e8197['set'](_0x2d8e9d, _0x125385), _0x153872['set'](_0x125385, _0x2d8e9d));
          continue;
        }
        onProgress('正在传送素材给房主\x20' + _0x2aca54 + '/' + _0x59bc9e['size']);
        const _0x480fd8 = await readMedia(_0x2d8e9d, _0x29e8fd);
        if (!_0x480fd8['size'])
          throw Object['assign'](new Error('素材文件为空，请等待文件写入完成后重试'), {
            code: 'ASSET_EMPTY',
          });
        if (_0x480fd8['size'] > COLLABORATION_MAX_ASSET_BYTES)
          throw Object['assign'](new Error('临时或远程协作素材单文件不能超过\x20256\x20MiB'), {
            code: 'ASSET_LIMIT',
          });
        if (!isCollaborationMediaType(_0x480fd8['type']['split'](';')[0x0]))
          throw Object['assign'](new Error('无法识别协作素材类型，请使用支持的图片、视频或音频'), {
            code: 'ASSET_TYPE',
          });
        if (_0x48bd32) {
          const _0xcb25ca = await _0x48bd32(_0x480fd8, onProgress);
          _0x5ec209();
          if (!/^[a-f0-9]{64}$/['test'](_0xcb25ca?.['hash'])) throw new Error('素材传输响应无效');
          const _0x545370 = 'aic-asset:' + _0xcb25ca['hash'];
          (_0x5e8197['set'](_0x2d8e9d, _0x545370), _0x153872['set'](_0x545370, _0x2d8e9d));
          continue;
        }
        const _0x1fe2db = new Uint8Array(await _0x480fd8['arrayBuffer']()),
          _0x556a9f = await hashBytes(_0x1fe2db),
          _0x395278 = 'aic-asset:' + _0x556a9f;
        let _0x58bce9 = 0x0;
        while (!_0x153872['has'](_0x395278) && _0x58bce9 < _0x1fe2db['length']) {
          _0x5ec209();
          const _0x500046 = await _0x4f8051({
            action: 'assetPut',
            hash: _0x556a9f,
            size: _0x1fe2db['length'],
            mime: _0x480fd8['type']['split'](';')[0x0],
            offset: _0x58bce9,
            data: toBase64(_0x1fe2db['subarray'](_0x58bce9, _0x58bce9 + COLLABORATION_CHUNK_BYTES)),
          });
          if (
            !Number['isSafeInteger'](_0x500046['offset']) ||
            _0x500046['offset'] <= _0x58bce9 ||
            _0x500046['offset'] > _0x1fe2db['length'] ||
            _0x500046['complete'] !== (_0x500046['offset'] === _0x1fe2db['length'])
          )
            throw new Error('素材上传响应无效');
          ((_0x58bce9 = _0x500046['offset']),
            onProgress(
              '正在传送素材给房主 ' +
                _0x2aca54 +
                '/' +
                _0x59bc9e['size'] +
                ' · ' +
                Math['round']((_0x58bce9 / _0x1fe2db['length']) * 0x64) +
                '%',
            ));
        }
        (_0x5ec209(), _0x5e8197['set'](_0x2d8e9d, _0x395278), _0x153872['set'](_0x395278, _0x2d8e9d));
      }
      return this['project'](_0x10b16c);
    },
    async materialize(_0x37d513) {
      const _0x4f8689 = new Set();
      function _0x4434bc(_0x422b81, _0x37d515) {
        if (typeof _0x422b81 === 'string' && /^aic-asset:[a-f0-9]{64}$/['test'](_0x422b81)) {
          if (!_0x153872['has'](_0x422b81)) _0x4f8689['add'](_0x422b81);
          return _0x37d515 ? _0x153872['get'](_0x422b81) : _0x422b81;
        }
        if (Array['isArray'](_0x422b81))
          return _0x422b81['map']((_0x579303) => _0x4434bc(_0x579303, _0x37d515));
        if (_0x422b81 && typeof _0x422b81 === 'object')
          return Object['fromEntries'](
            Object['entries'](_0x422b81)['map'](([_0x173d35, _0x692c89]) => [
              _0x173d35,
              _0x4434bc(_0x692c89, _0x37d515),
            ]),
          );
        return _0x422b81;
      }
      (_0x5ec209(), _0x4434bc(_0x37d513, ![]));
      const _0x5ecd2e = [..._0x4f8689];
      for (let _0x1aa391 = 0x0; _0x1aa391 < _0x5ecd2e['length']; _0x1aa391 += 0x3e8) {
        const _0x3b4a06 = _0x5ecd2e['slice'](_0x1aa391, _0x1aa391 + 0x3e8),
          _0x1cbd5c = await _0x21ff91(_0x3b4a06['map']((_0x489faf) => _0x489faf['slice'](0xa)));
        _0x5ec209();
        for (const _0x347152 of _0x3b4a06) {
          const _0x11bea4 = _0x1cbd5c?.[_0x347152['slice'](0xa)];
          if (
            typeof _0x11bea4 !== 'string' ||
            !new RegExp(
              '^data/assets/(?:_deferred/[\\w-]+|_hosted)/[\\w-]+/' +
                _0x347152['slice'](0xa) +
                '\\.[a-z0-9]+$',
            )['test'](_0x11bea4)
          )
            throw new Error('共享素材地址无效');
          (_0x153872['set'](_0x347152, _0x11bea4),
            _0x5e8197['set'](normalizeCollaborationMediaSource(_0x11bea4), _0x347152));
        }
      }
      return _0x4434bc(_0x37d513, !![]);
    },
    dispose() {
      (_0x5e8197['clear'](), _0x153872['clear']());
    },
  };
}
