import { requester } from './requester.js';
import { buildApiUrl } from './apiUrl.js';
import { localPathToUrl, normalizeLocalPath } from '../src/utils/localMediaPath.js';
import { ensureImageDerivativesToServer, stageAssetUploadToServer } from './projectsV2Api.js';
import { detectCollaborationMediaContentType } from './collaborationMediaContentType.js';
export const COLLABORATION_PROTOCOL = 0x5;
export const COLLABORATION_DOCUMENT_SCHEMA = '1';
export const COLLABORATION_IDENTITY_PROTOCOL = 0x2;
export const COLLABORATION_IDENTITY_VERSION = '0.7.13';
export const COLLABORATION_CHUNK_BYTES = 0x100 * 0x400;
export const COLLABORATION_MAX_ASSET_BYTES = 0x100 * 0x400 * 0x400;
const MEDIA_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/vnd.wave': 'wav',
  'audio/x-pn-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/webm': 'webm',
  'audio/aac': 'aac',
  'audio/vnd.dlna.adts': 'aac',
  'audio/flac': 'flac',
  'audio/x-flac': 'flac',
  'image/bmp': 'bmp',
  'image/x-ms-bmp': 'bmp',
  'image/svg+xml': 'svg',
  'video/x-msvideo': 'avi',
  'video/avi': 'avi',
  'video/x-matroska': 'mkv',
  'video/x-m4v': 'm4v',
};
export const isCollaborationMediaType = (_0x236ed0) => Object['hasOwn'](MEDIA_EXTENSIONS, _0x236ed0);
export async function fetchCollaborationConfig() {
  return requester({
    url: '/api/v2/collaboration/config',
    provider: 'local',
    method: 'GET',
    timeout: 0x3a98,
  });
}
export function encodeCollaborationInvite(_0x2ed457, _0x489bc8) {
  const _0x2ecfdd = JSON['stringify']({
    endpoint: { url: _0x2ed457['url'], fingerprint: _0x2ed457['fingerprint'], hostId: _0x2ed457['hostId'] },
    invite: _0x489bc8,
  });
  return 'AICLAN2.' + btoa(_0x2ecfdd)['replace'](/\+/g, '-')['replace'](/\//g, '_')['replace'](/=+$/, '');
}
export function decodeCollaborationInvite(_0x414865) {
  const _0x2d590c = String(_0x414865 || '')['trim']();
  if (!_0x2d590c['startsWith']('AICLAN2.') || _0x2d590c['length'] > 0x1000)
    throw new Error('请粘贴房主生成的完整邀请连接信息');
  try {
    const _0x5e1da0 = JSON['parse'](
      atob(_0x2d590c['slice'](0x8)['replace'](/-/g, '+')['replace'](/_/g, '/')),
    );
    if (
      !_0x5e1da0['endpoint']?.['url'] ||
      !_0x5e1da0['endpoint']['fingerprint'] ||
      !_0x5e1da0['endpoint']['hostId'] ||
      typeof _0x5e1da0['invite'] !== 'string'
    )
      throw new Error();
    return _0x5e1da0;
  } catch {
    throw new Error('邀请连接信息不完整，请重新复制');
  }
}
async function localControl(_0x4c856b, _0x516661) {
  return requester({
    url: '/api/v2/collaboration/control',
    provider: 'local',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON['stringify'](_0x4c856b),
    signal: _0x516661,
    timeout: _0x4c856b['payload']?.['action'] === 'presence' ? 0x1388 : 0xafc8,
  });
}
export function createCollaborationApi({
  serverUrl: _0x38ed85,
  token: token = '',
  fetchImpl: fetchImpl = globalThis['fetch'],
  controlRequest: controlRequest = localControl,
} = {}) {
  const _0x3108cf = new URL(_0x38ed85);
  if (
    _0x3108cf['protocol'] !== 'https:' &&
    !(
      _0x3108cf['protocol'] === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]']['includes'](_0x3108cf['hostname'])
    )
  )
    throw new Error('协作服务器必须使用 HTTPS');
  if (_0x3108cf['username'] || _0x3108cf['password'] || _0x3108cf['search'] || _0x3108cf['hash'])
    throw new Error('协作服务器地址无效');
  const _0x156560 = _0x3108cf['href']['replace'](/\/$/, '') + '/api/collaboration/v1';
  let _0x3b8416 = null,
    _0x50bc82 = null,
    _0x14e7bc = null,
    _0x38cb5a = 0x0;
  async function _0x142e76(_0x3b3b57, _0x2b902b) {
    const _0x3e9e77 = await controlRequest(_0x3b3b57, _0x2b902b);
    if (!_0x3e9e77 || _0x3e9e77['success'] === ![]) {
      const _0x4316e4 = new Error(_0x3e9e77?.['message'] || '本机协作服务不可用');
      ((_0x4316e4['code'] = _0x3e9e77?.['code'] || 'HOST_UNAVAILABLE'),
        (_0x4316e4['status'] = _0x3e9e77?.['status']),
        (_0x4316e4['details'] = _0x3e9e77?.['details']));
      throw _0x4316e4;
    }
    return _0x3e9e77;
  }
  async function _0x2f9a16(_0x479b49, _0x53e117, _0x5cac65) {
    const _0x5140c2 = new AbortController(),
      _0x43b8b9 = () => _0x5140c2['abort']();
    if (_0x5cac65?.['aborted']) _0x43b8b9();
    _0x5cac65?.['addEventListener']('abort', _0x43b8b9, { once: !![] });
    const _0x485c38 = setTimeout(_0x43b8b9, 0x7530);
    try {
      let _0x452891;
      try {
        _0x452891 = await fetchImpl(_0x156560 + '/' + _0x479b49, {
          method: 'POST',
          signal: _0x5140c2['signal'],
          credentials: 'omit',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: 'Bearer ' + token } : {}),
          },
          body: JSON['stringify'](_0x53e117),
        });
      } catch (_0x5666fc) {
        if (_0x5666fc?.['name'] === 'AbortError') throw _0x5666fc;
        throw Object['assign'](
          new Error('无法连接协作授权服务。请检查网络；若网络正常，请联系管理员确认服务已上线。', {
            cause: _0x5666fc,
          }),
          { code: 'AUTH_UNAVAILABLE' },
        );
      }
      if ([0x194, 0x195]['includes'](_0x452891['status']))
        throw Object['assign'](new Error('协作授权接口尚未接通，请联系管理员完成服务部署。'), {
          code: 'AUTH_NOT_DEPLOYED',
          status: _0x452891['status'],
        });
      let _0x439acc;
      try {
        _0x439acc = await _0x452891['json']();
      } catch {
        throw new Error('协作服务返回了无效响应，请检查服务部署和网络连接');
      }
      if (!_0x452891['ok'] || _0x439acc['success'] === ![]) {
        const _0x31ac66 = new Error(_0x439acc['message'] || '协作请求失败');
        ((_0x31ac66['code'] = _0x439acc['code'] || 'COLLABORATION_UNAVAILABLE'),
          (_0x31ac66['status'] = _0x452891['status']));
        throw _0x31ac66;
      }
      return _0x439acc;
    } finally {
      (clearTimeout(_0x485c38), _0x5cac65?.['removeEventListener']('abort', _0x43b8b9));
    }
  }
  function _0x4e4bdf(_0xece0a, _0x109221) {
    if (_0x14e7bc || (_0x3b8416 && !_0x50bc82))
      return Promise['reject'](
        Object['assign'](new Error('请先结束已有协作连接'), { code: 'CONNECTION_BUSY' }),
      );
    const _0x55f46e = _0x38cb5a;
    return (
      (_0x14e7bc = (async () => {
        await _0x50bc82;
        if (_0x55f46e !== _0x38cb5a || _0x109221?.['aborted'])
          throw new DOMException('Aborted', 'AbortError');
        const _0x135273 = crypto['randomUUID']();
        let _0x33fa4b;
        try {
          _0x33fa4b = await _0x142e76(
            {
              ..._0xece0a,
              protocol: COLLABORATION_PROTOCOL,
              documentSchema: COLLABORATION_DOCUMENT_SCHEMA,
              identityToken: token,
              connectionId: _0x135273,
            },
            _0x109221,
          );
        } catch (_0x597222) {
          await _0x142e76({ action: 'disconnect', connectionId: _0x135273 })['catch'](() => {});
          throw _0x597222;
        }
        if (_0x55f46e !== _0x38cb5a || _0x109221?.['aborted']) {
          await _0x142e76({ action: 'disconnect', connectionId: _0x33fa4b['connectionId'] });
          throw new DOMException('Aborted', 'AbortError');
        }
        return ((_0x3b8416 = _0x33fa4b), _0x33fa4b);
      })()['finally'](() => {
        _0x14e7bc = null;
      })),
      _0x14e7bc
    );
  }
  return {
    async authenticate(_0x260773, _0x22f910) {
      const _0x166090 = await _0x2f9a16(
        'session',
        { ..._0x260773, protocol: COLLABORATION_IDENTITY_PROTOCOL, version: COLLABORATION_IDENTITY_VERSION },
        _0x22f910,
      );
      if (
        !_0x166090['token'] ||
        !_0x166090['actorId'] ||
        _0x166090['protocol'] !== COLLABORATION_IDENTITY_PROTOCOL ||
        _0x166090['version'] !== COLLABORATION_IDENTITY_VERSION
      )
        throw new Error('协作服务尚未部署或返回了不兼容的响应');
      return ((token = _0x166090['token']), _0x166090);
    },
    startHost: (_0x4100c0, { replacePort: replacePort = ![] } = {}) =>
      _0x4e4bdf({ action: 'start', replacePort: replacePort }, _0x4100c0),
    connectHost: (_0x1554ac, _0x258112) => _0x4e4bdf({ action: 'connect', endpoint: _0x1554ac }, _0x258112),
    listRooms: (_0x42edeb, _0xfd2d1) =>
      _0x142e76({ action: 'list', identityToken: token, clientId: _0x42edeb }, _0xfd2d1),
    getConnection: () => _0x3b8416,
    async imagePreviews(_0x87a65c) {
      const _0x43e1dc = normalizeLocalPath(_0x87a65c);
      if (
        !_0x43e1dc ||
        /^data\/assets\/_(?:deferred|hosted)\//['test'](_0x43e1dc) ||
        !/\.(png|jpe?g|webp|avif)$/i['test'](_0x43e1dc)
      )
        return null;
      return ensureImageDerivativesToServer({ localPath: _0x43e1dc });
    },
    async uploadMedia(_0x4bb044, _0x4569cd, _0xdf4096, _0x4d8eae) {
      const _0x27db29 = MEDIA_EXTENSIONS[_0x4bb044['type']['split'](';')[0x0]];
      if (!_0x27db29) throw Object['assign'](new Error('不支持的协作素材格式'), { code: 'ASSET_TYPE' });
      const _0x45b5a4 = await stageAssetUploadToServer(
        new File([_0x4bb044], 'collaboration.' + _0x27db29, { type: _0x4bb044['type'] }),
      );
      if (_0xdf4096?.['aborted']) throw new DOMException('Aborted', 'AbortError');
      return this['registerMedia'](_0x45b5a4['localPath'], _0x4569cd, _0xdf4096, _0x4d8eae);
    },
    events(_0x53fc9f, _0x267549) {
      if (!_0x3b8416)
        return Promise['reject'](Object['assign'](new Error('连接已结束'), { code: 'HOST_OFFLINE' }));
      return _0x142e76(
        {
          action: 'relay',
          connectionId: _0x3b8416['connectionId'],
          payload: { ..._0x53fc9f, action: 'events' },
        },
        _0x267549,
      );
    },
    presence(_0x4ce73f, _0x530e1b) {
      if (!_0x3b8416)
        return Promise['reject'](Object['assign'](new Error('连接已结束'), { code: 'HOST_OFFLINE' }));
      return _0x142e76(
        {
          action: 'relay',
          connectionId: _0x3b8416['connectionId'],
          payload: { ..._0x4ce73f, action: 'presence' },
        },
        _0x530e1b,
      );
    },
    async registerMedia(_0x4139d7, _0x4f426f, _0x1853de, _0x24cff8 = () => {}) {
      const _0x344875 = normalizeLocalPath(_0x4139d7);
      if (
        !_0x3b8416 ||
        !_0x344875 ||
        (!_0x3b8416['hosting'] && _0x344875['startsWith']('data/assets/_deferred/'))
      )
        return null;
      const _0x546a8b = _0x3b8416['connectionId'];
      if (_0x3b8416['hosting'])
        return _0x142e76(
          { action: 'registerAsset', connectionId: _0x546a8b, source: _0x344875, ..._0x4f426f },
          _0x1853de,
        );
      const { jobId: _0x3ae492 } = await _0x142e76(
        { action: 'startUpload', connectionId: _0x546a8b, source: _0x344875, ..._0x4f426f },
        _0x1853de,
      );
      while (!_0x1853de?.['aborted']) {
        const _0x377894 = await _0x142e76(
          { action: 'uploadStatus', connectionId: _0x546a8b, jobId: _0x3ae492 },
          _0x1853de,
        );
        if (_0x377894['error'])
          throw Object['assign'](new Error(_0x377894['error']['message']), {
            code: _0x377894['error']['code'],
          });
        _0x24cff8(
          _0x377894['phase'] === 'hashing'
            ? '正在校验本机素材'
            : _0x377894['phase'] === 'verifying'
              ? '房主正在校验素材完整性'
              : '正在传送素材给房主 · ' +
                Math['round']((_0x377894['offset'] / Math['max'](0x1, _0x377894['size'])) * 0x64) +
                '%',
        );
        if (_0x377894['done']) return _0x377894['result'];
        await new Promise((_0x59316b) => setTimeout(_0x59316b, 0xfa));
      }
      throw new DOMException('Aborted', 'AbortError');
    },
    async bindMedia(_0x59f129, _0xd3fe01, _0x484d87) {
      if (!_0x3b8416) throw Object['assign'](new Error('请先连接房主'), { code: 'HOST_OFFLINE' });
      const { sources: _0x4f6e70 } = await _0x142e76(
        { action: 'bindMedia', connectionId: _0x3b8416['connectionId'], hashes: _0x59f129, ..._0xd3fe01 },
        _0x484d87,
      );
      return _0x4f6e70;
    },
    async disconnect() {
      _0x38cb5a += 0x1;
      if (_0x14e7bc) await _0x14e7bc['catch'](() => {});
      if (_0x50bc82) return _0x50bc82;
      const _0x2c1fb3 = _0x3b8416;
      if (!_0x2c1fb3) return;
      return (
        (_0x50bc82 = _0x142e76({ action: 'disconnect', connectionId: _0x2c1fb3['connectionId'] })['finally'](
          () => {
            if (_0x3b8416 === _0x2c1fb3) _0x3b8416 = null;
            _0x50bc82 = null;
          },
        )),
        _0x50bc82
      );
    },
    rpc(_0x5cc8eb, _0x4c9fce) {
      const _0x1d6a1a = _0x3b8416;
      if (!_0x1d6a1a)
        return Promise['reject'](Object['assign'](new Error('请先开房或连接房主'), { code: 'HOST_OFFLINE' }));
      const _0x2b6fc6 = _0x142e76(
        {
          action: 'relay',
          connectionId: _0x1d6a1a['connectionId'],
          payload: {
            ..._0x5cc8eb,
            ...(['join', 'open', 'sync']['includes'](_0x5cc8eb['action']) ? { paged: !![] } : {}),
          },
        },
        _0x4c9fce,
      )['then'](async (_0x12cdaa) => {
        if (!_0x12cdaa['snapshot']) return _0x12cdaa;
        const _0x40647c = _0x12cdaa['snapshot'];
        if (
          !Number['isInteger'](_0x40647c['pages']) ||
          _0x40647c['pages'] < 0x1 ||
          _0x40647c['pages'] > 0x400
        )
          throw new Error('画布快照信息无效');
        const _0x31b560 = [];
        let _0x309ca4 = 0x0;
        for (let _0x5df93d = 0x0; _0x5df93d < _0x40647c['pages']; _0x5df93d++) {
          const _0xa31a90 = await _0x142e76(
            {
              action: 'relay',
              connectionId: _0x1d6a1a['connectionId'],
              payload: {
                action: 'snapshotPart',
                roomId: _0x12cdaa['roomId'],
                clientId: _0x5cc8eb['clientId'],
                snapshotId: _0x40647c['id'],
                page: _0x5df93d,
              },
            },
            _0x4c9fce,
          );
          if (
            _0xa31a90['page'] !== _0x5df93d ||
            typeof _0xa31a90['text'] !== 'string' ||
            (_0x309ca4 += _0xa31a90['text']['length']) > 0x40 * 0x400 * 0x400
          )
            throw new Error('画布快照分片无效');
          _0x31b560['push'](_0xa31a90['text']);
        }
        const _0x314dc5 = JSON['parse'](_0x31b560['join'](''));
        return { ..._0x12cdaa, document: _0x314dc5 };
      });
      if (_0x5cc8eb['action'] !== 'disconnect') return _0x2b6fc6;
      return (
        (_0x50bc82 = _0x2b6fc6['finally'](() => {
          if (_0x3b8416 === _0x1d6a1a) _0x3b8416 = null;
          _0x50bc82 = null;
        })),
        _0x50bc82
      );
    },
  };
}
export function normalizeCollaborationMediaSource(_0x461ea0) {
  return localPathToUrl(_0x461ea0) || _0x461ea0;
}
export async function readCollaborationMedia(_0x384c3, _0x252e9e) {
  const _0x3e1f4c = normalizeCollaborationMediaSource(_0x384c3),
    _0x22011a = /^(https?:|blob:|data:)/i['test'](_0x3e1f4c) ? _0x3e1f4c : buildApiUrl(_0x3e1f4c),
    _0x1a958f = new AbortController(),
    _0x1c32b8 = () => _0x1a958f['abort']();
  if (_0x252e9e?.['aborted']) _0x1c32b8();
  _0x252e9e?.['addEventListener']('abort', _0x1c32b8, { once: !![] });
  const _0x3e9a56 = setTimeout(_0x1c32b8, 0x7530);
  try {
    const _0x25f522 = await fetch(_0x22011a, { signal: _0x1a958f['signal'] });
    if (!_0x25f522['ok']) throw new Error('无法读取待共享素材');
    const _0x20d8c9 = Number(_0x25f522['headers']['get']('Content-Length') || 0x0);
    if (_0x20d8c9 > COLLABORATION_MAX_ASSET_BYTES)
      throw Object['assign'](new Error('协作素材单文件不能超过\x20256\x20MiB'), { code: 'ASSET_LIMIT' });
    const _0x81ba1 = await _0x25f522['blob']();
    if (_0x81ba1['size'] > COLLABORATION_MAX_ASSET_BYTES)
      throw Object['assign'](new Error('协作素材单文件不能超过\x20256\x20MiB'), { code: 'ASSET_LIMIT' });
    const _0x2af83e = await detectCollaborationMediaContentType(_0x81ba1);
    if (_0x252e9e?.['aborted']) throw new DOMException('Aborted', 'AbortError');
    return _0x2af83e && _0x2af83e !== _0x81ba1['type']
      ? _0x81ba1['slice'](0x0, _0x81ba1['size'], _0x2af83e)
      : _0x81ba1;
  } catch (_0x5123cd) {
    if (_0x252e9e?.['aborted'] || ['ASSET_LIMIT', 'ASSET_TYPE']['includes'](_0x5123cd['code']))
      throw _0x5123cd;
    throw Object['assign'](
      new Error(
        _0x1a958f['signal']['aborted']
          ? '读取共享素材超时，正在重试；未同步修改保留在本机'
          : '无法读取待共享素材，正在重试；请检查素材是否仍可访问，未同步修改保留在本机',
        { cause: _0x5123cd },
      ),
      { code: 'MEDIA_UNAVAILABLE' },
    );
  } finally {
    (clearTimeout(_0x3e9a56), _0x252e9e?.['removeEventListener']('abort', _0x1c32b8));
  }
}
