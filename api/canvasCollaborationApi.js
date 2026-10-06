import { requester } from './requester.js';
import { buildApiUrl } from './apiUrl.js';
import { localPathToUrl, normalizeLocalPath } from '../src/utils/localMediaPath.js';
import { ensureImageDerivativesToServer, stageAssetUploadToServer } from './projectsV2Api.js';
import { detectCollaborationMediaContentType } from './collaborationMediaContentType.js';
export const COLLABORATION_PROTOCOL = 5;
export const COLLABORATION_DOCUMENT_SCHEMA = '1';
export const COLLABORATION_IDENTITY_PROTOCOL = 2;
export const COLLABORATION_IDENTITY_VERSION = '0.7.13';
export const COLLABORATION_CHUNK_BYTES = 256 * 1024;
export const COLLABORATION_MAX_ASSET_BYTES = 256 * 1024 * 1024;
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
export const isCollaborationMediaType = (value) => Object.hasOwn(MEDIA_EXTENSIONS, value);
export async function fetchCollaborationConfig() {
  return requester({
    url: '/api/v2/collaboration/config',
    provider: 'local',
    method: 'GET',
    timeout: 15000,
  });
}
export function encodeCollaborationInvite(url, invite) {
  const inviteText = JSON.stringify({
    endpoint: { url: url.url, fingerprint: url.fingerprint, hostId: url.hostId },
    invite: invite,
  });
  return 'AICLAN2.' + btoa(inviteText).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeCollaborationInvite(key) {
  const inviteCode = String(key || '').trim();
  if (!inviteCode.startsWith('AICLAN2.') || inviteCode.length > 4096)
    throw new Error('请粘贴房主生成的完整邀请连接信息');
  try {
    const decoded = JSON.parse(atob(inviteCode.slice(8).replace(/-/g, '+').replace(/_/g, '/')));
    if (
      !decoded.endpoint?.url ||
      !decoded.endpoint.fingerprint ||
      !decoded.endpoint.hostId ||
      typeof decoded.invite !== 'string'
    )
      throw new Error();
    return decoded;
  } catch {
    throw new Error('邀请连接信息不完整，请重新复制');
  }
}
async function localControl(timeout, signal) {
  return requester({
    url: '/api/v2/collaboration/control',
    provider: 'local',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(timeout),
    signal: signal,
    timeout: timeout.payload?.action === 'presence' ? 5000 : 45000,
  });
}
export function createCollaborationApi({
  serverUrl: serverUrl,
  token: token = '',
  fetchImpl: fetchImpl = globalThis.fetch,
  controlRequest: controlRequest = localControl,
} = {}) {
  const uRL = new URL(serverUrl);
  if (
    uRL.protocol !== 'https:' &&
    !(uRL.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(uRL.hostname))
  )
    throw new Error('协作服务器必须使用 HTTPS');
  if (uRL.username || uRL.password || uRL.search || uRL.hash)
    throw new Error('协作服务器地址无效');
  const index = uRL.href.replace(/\/$/, '') + '/api/collaboration/v1';
  let connectionId = null,
    enabled2 = null,
    promise = null,
    result = 0;
  async function run(data, options) {
    const response = await controlRequest(data, options);
    if (!response || response.success === false) {
      const response2 = new Error(response?.message || '本机协作服务不可用');
      ((response2.code = response?.code || 'HOST_UNAVAILABLE'),
        (response2.status = response?.status),
        (response2.details = response?.details));
      throw response2;
    }
    return response;
  }
  async function run2(target, source, el) {
    const signal2 = new AbortController(),
      handler = () => signal2.abort();
    if (el?.aborted) handler();
    el?.addEventListener('abort', handler, { once: true });
    const setTimeout2 = setTimeout(handler, 30000);
    try {
      let status;
      try {
        status = await fetchImpl(index + '/' + target, {
          method: 'POST',
          signal: signal2.signal,
          credentials: 'omit',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: 'Bearer ' + token } : {}),
          },
          body: JSON.stringify(source),
        });
      } catch (cause) {
        if (cause?.name === 'AbortError') throw cause;
        throw Object.assign(
          new Error('无法连接协作授权服务。请检查网络；若网络正常，请联系管理员确认服务已上线。', {
            cause: cause,
          }),
          { code: 'AUTH_UNAVAILABLE' },
        );
      }
      if ([404, 405].includes(status.status))
        throw Object.assign(new Error('协作授权接口尚未接通，请联系管理员完成服务部署。'), {
          code: 'AUTH_NOT_DEPLOYED',
          status: status.status,
        });
      let error;
      try {
        error = await status.json();
      } catch {
        throw new Error('协作服务返回了无效响应，请检查服务部署和网络连接');
      }
      if (!status.ok || error.success === false) {
        const response3 = new Error(error.message || '协作请求失败');
        ((response3.code = error.code || 'COLLABORATION_UNAVAILABLE'),
          (response3.status = status.status));
        throw response3;
      }
      return error;
    } finally {
      (clearTimeout(setTimeout2), el?.removeEventListener('abort', handler));
    }
  }
  function run3(args, next) {
    if (promise || (connectionId && !enabled2))
      return Promise.reject(
        Object.assign(new Error('请先结束已有协作连接'), { code: 'CONNECTION_BUSY' }),
      );
    const current = result;
    return (
      (promise = (async () => {
        await enabled2;
        if (current !== result || next?.aborted) throw new DOMException('Aborted', 'AbortError');
        const connectionId2 = crypto.randomUUID();
        let connectionId3;
        try {
          connectionId3 = await run(
            {
              ...args,
              protocol: COLLABORATION_PROTOCOL,
              documentSchema: COLLABORATION_DOCUMENT_SCHEMA,
              identityToken: token,
              connectionId: connectionId2,
            },
            next,
          );
        } catch (entry) {
          await run({ action: 'disconnect', connectionId: connectionId2 }).catch(() => {});
          throw entry;
        }
        if (current !== result || next?.aborted) {
          await run({ action: 'disconnect', connectionId: connectionId3.connectionId });
          throw new DOMException('Aborted', 'AbortError');
        }
        return ((connectionId = connectionId3), connectionId3);
      })().finally(() => {
        promise = null;
      })),
      promise
    );
  }
  return {
    async authenticate(args2, record) {
      const enabled3 = await run2(
        'session',
        { ...args2, protocol: COLLABORATION_IDENTITY_PROTOCOL, version: COLLABORATION_IDENTITY_VERSION },
        record,
      );
      if (
        !enabled3.token ||
        !enabled3.actorId ||
        enabled3.protocol !== COLLABORATION_IDENTITY_PROTOCOL ||
        enabled3.version !== COLLABORATION_IDENTITY_VERSION
      )
        throw new Error('协作服务尚未部署或返回了不兼容的响应');
      return ((token = enabled3.token), enabled3);
    },
    startHost: (payload, { replacePort: replacePort = false } = {}) =>
      run3({ action: 'start', replacePort: replacePort }, payload),
    connectHost: (endpoint, handle) => run3({ action: 'connect', endpoint: endpoint }, handle),
    listRooms: (clientId, state) => run({ action: 'list', identityToken: token, clientId: clientId }, state),
    getConnection: () => connectionId,
    async imagePreviews(config) {
      const localPath = normalizeLocalPath(config);
      if (
        !localPath ||
        /^data\/assets\/_(?:deferred|hosted)\//.test(localPath) ||
        !/\.(png|jpe?g|webp|avif)$/i.test(localPath)
      )
        return null;
      return ensureImageDerivativesToServer({ localPath: localPath });
    },
    async uploadMedia(type, scope, input, output) {
      const enabled4 = MEDIA_EXTENSIONS[type.type.split(';')[0]];
      if (!enabled4) throw Object.assign(new Error('不支持的协作素材格式'), { code: 'ASSET_TYPE' });
      const server = await stageAssetUploadToServer(
        new File([type], 'collaboration.' + enabled4, { type: type.type }),
      );
      if (input?.aborted) throw new DOMException('Aborted', 'AbortError');
      return this.registerMedia(server.localPath, scope, input, output);
    },
    events(args3, value2) {
      if (!connectionId)
        return Promise.reject(Object.assign(new Error('连接已结束'), { code: 'HOST_OFFLINE' }));
      return run(
        {
          action: 'relay',
          connectionId: connectionId.connectionId,
          payload: { ...args3, action: 'events' },
        },
        value2,
      );
    },
    presence(args4, value3) {
      if (!connectionId)
        return Promise.reject(Object.assign(new Error('连接已结束'), { code: 'HOST_OFFLINE' }));
      return run(
        {
          action: 'relay',
          connectionId: connectionId.connectionId,
          payload: { ...args4, action: 'presence' },
        },
        value3,
      );
    },
    async registerMedia(value4, args5, enabled5, handler2 = () => {}) {
      const source2 = normalizeLocalPath(value4);
      if (
        !connectionId ||
        !source2 ||
        (!connectionId.hosting && source2.startsWith('data/assets/_deferred/'))
      )
        return null;
      const connectionId4 = connectionId.connectionId;
      if (connectionId.hosting)
        return run(
          { action: 'registerAsset', connectionId: connectionId4, source: source2, ...args5 },
          enabled5,
        );
      const { jobId: jobId } = await run(
        { action: 'startUpload', connectionId: connectionId4, source: source2, ...args5 },
        enabled5,
      );
      while (!enabled5?.aborted) {
        const code = await run(
          { action: 'uploadStatus', connectionId: connectionId4, jobId: jobId },
          enabled5,
        );
        if (code.error)
          throw Object.assign(new Error(code.error.message), {
            code: code.error.code,
          });
        handler2(
          code.phase === 'hashing'
            ? '正在校验本机素材'
            : code.phase === 'verifying'
              ? '房主正在校验素材完整性'
              : '正在传送素材给房主 · ' +
                Math.round((code.offset / Math.max(1, code.size)) * 100) +
                '%',
        );
        if (code.done) return code.result;
        await new Promise((value5) => setTimeout(value5, 250));
      }
      throw new DOMException('Aborted', 'AbortError');
    },
    async bindMedia(hashes, args6, value6) {
      if (!connectionId) throw Object.assign(new Error('请先连接房主'), { code: 'HOST_OFFLINE' });
      const { sources: sources } = await run(
        { action: 'bindMedia', connectionId: connectionId.connectionId, hashes: hashes, ...args6 },
        value6,
      );
      return sources;
    },
    async disconnect() {
      result += 1;
      if (promise) await promise.catch(() => {});
      if (enabled2) return enabled2;
      const connectionId5 = connectionId;
      if (!connectionId5) return;
      return (
        (enabled2 = run({ action: 'disconnect', connectionId: connectionId5.connectionId }).finally(
          () => {
            if (connectionId === connectionId5) connectionId = null;
            enabled2 = null;
          },
        )),
        enabled2
      );
    },
    rpc(clientId2, value7) {
      const connectionId6 = connectionId;
      if (!connectionId6)
        return Promise.reject(Object.assign(new Error('请先开房或连接房主'), { code: 'HOST_OFFLINE' }));
      const promise2 = run(
        {
          action: 'relay',
          connectionId: connectionId6.connectionId,
          payload: {
            ...clientId2,
            ...(['join', 'open', 'sync'].includes(clientId2.action) ? { paged: true } : {}),
          },
        },
        value7,
      ).then(async (roomId) => {
        if (!roomId.snapshot) return roomId;
        const snapshotId = roomId.snapshot;
        if (
          !Number.isInteger(snapshotId.pages) ||
          snapshotId.pages < 1 ||
          snapshotId.pages > 1024
        )
          throw new Error('画布快照信息无效');
        const list2 = [];
        let value8 = 0;
        for (let page = 0; page < snapshotId.pages; page++) {
          const response4 = await run(
            {
              action: 'relay',
              connectionId: connectionId6.connectionId,
              payload: {
                action: 'snapshotPart',
                roomId: roomId.roomId,
                clientId: clientId2.clientId,
                snapshotId: snapshotId.id,
                page: page,
              },
            },
            value7,
          );
          if (
            response4.page !== page ||
            typeof response4.text !== 'string' ||
            (value8 += response4.text.length) > 64 * 1024 * 1024
          )
            throw new Error('画布快照分片无效');
          list2.push(response4.text);
        }
        const document = JSON.parse(list2.join(''));
        return { ...roomId, document: document };
      });
      if (clientId2.action !== 'disconnect') return promise2;
      return (
        (enabled2 = promise2.finally(() => {
          if (connectionId === connectionId6) connectionId = null;
          enabled2 = null;
        })),
        enabled2
      );
    },
  };
}
export function normalizeCollaborationMediaSource(value9) {
  return localPathToUrl(value9) || value9;
}
export async function readCollaborationMedia(value10, el2) {
  const collaborationMediaSource = normalizeCollaborationMediaSource(value10),
    value11 = /^(https?:|blob:|data:)/i.test(collaborationMediaSource)
      ? collaborationMediaSource
      : buildApiUrl(collaborationMediaSource),
    signal3 = new AbortController(),
    handler3 = () => signal3.abort();
  if (el2?.aborted) handler3();
  el2?.addEventListener('abort', handler3, { once: true });
  const setTimeout3 = setTimeout(handler3, 30000);
  try {
    const response5 = await fetch(value11, { signal: signal3.signal });
    if (!response5.ok) throw new Error('无法读取待共享素材');
    const value12 = Number(response5.headers.get('Content-Length') || 0);
    if (value12 > COLLABORATION_MAX_ASSET_BYTES)
      throw Object.assign(new Error('协作素材单文件不能超过 256 MiB'), { code: 'ASSET_LIMIT' });
    const list3 = await response5.blob();
    if (list3.size > COLLABORATION_MAX_ASSET_BYTES)
      throw Object.assign(new Error('协作素材单文件不能超过 256 MiB'), { code: 'ASSET_LIMIT' });
    const detectCollaborationMediaContentType2 = await detectCollaborationMediaContentType(list3);
    if (el2?.aborted) throw new DOMException('Aborted', 'AbortError');
    return detectCollaborationMediaContentType2 && detectCollaborationMediaContentType2 !== list3.type
      ? list3.slice(0, list3.size, detectCollaborationMediaContentType2)
      : list3;
  } catch (cause2) {
    if (el2?.aborted || ['ASSET_LIMIT', 'ASSET_TYPE'].includes(cause2.code)) throw cause2;
    throw Object.assign(
      new Error(
        signal3.signal.aborted
          ? '读取共享素材超时，正在重试；未同步修改保留在本机'
          : '无法读取待共享素材，正在重试；请检查素材是否仍可访问，未同步修改保留在本机',
        { cause: cause2 },
      ),
      { code: 'MEDIA_UNAVAILABLE' },
    );
  } finally {
    (clearTimeout(setTimeout3), el2?.removeEventListener('abort', handler3));
  }
}
