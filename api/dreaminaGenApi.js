import { requester } from './requester.js';
import { runTaskSingleFlight } from './taskSingleFlight.js';
import {
  ensureDreaminaVideoModelForTask,
  getDreaminaVideoModelVersion,
  normalizeDreaminaVideoDuration,
  normalizeDreaminaVideoAspectRatio,
  normalizeDreaminaVideoModel,
  normalizeDreaminaVideoResolution,
  normalizeDreaminaVideoRouteMode,
  resolveDreaminaVideoTaskType,
  validateDreaminaVideoRouteSelection,
} from '../src/modules/dreaminaVideoModelHelper.js';
import { localPathToUrl, normalizeLocalPath } from '../src/utils/localMediaPath.js';
const DREAMINA_SUBMIT_TIMEOUT = 0xafc8,
  DREAMINA_QUERY_TIMEOUT = 0xea60,
  DREAMINA_POLL_INTERVAL = 0x7d0,
  DREAMINA_MAX_WAIT = 10 * 60 * 0x3e8,
  DREAMINA_QUERY_RETRIES = 2,
  DREAMINA_QUERY_RETRY_DELAY = 0x15e,
  DREAMINA_MAX_TRANSIENT_ERRORS = 12;
export const DREAMINA_POLL_TIMEOUT_CODE = 'DREAMINA_POLL_TIMEOUT';
const DREAMINA_QUEUE_HINTS = ['queue', 'queued', 'waiting', 'wait', 'pending'],
  DREAMINA_TRANSIENT_ERROR_HINTS = [
    'timeout',
    'time out',
    'timed out',
    '超时',
    '网络',
    'network',
    'connect',
    'connection',
    'socket',
    'econn',
    'enotfound',
    'eai_again',
    'temporary',
    'temporarily',
    '暂时',
    '稍后',
    'busy',
    'service unavailable',
    'rate limit',
    'too many requests',
    '429',
    '500',
    '502',
    '503',
    '504',
  ];
function toStatus(_0x34514c) {
  const _0x32d0d1 = String(_0x34514c || '')
    .trim()
    .toLowerCase();
  if (['success', 'succeeded', 'done', 'finish', 'finished'].includes(_0x32d0d1)) return 'success';
  if (['fail', 'failed', 'error'].includes(_0x32d0d1)) return 'failed';
  if (['cancelled', 'canceled'].includes(_0x32d0d1)) return 'cancelled';
  return 'pending';
}
function collectPayloadObjects(..._0x12d875) {
  const _0x2a69cd = [],
    _0x48d228 = new Set(),
    _0x2a5f0e = (_0x3e1ba9, _0x2a6214 = 0) => {
      if (!_0x3e1ba9 || _0x2a6214 > 5) return;
      if (Array.isArray(_0x3e1ba9)) {
        _0x3e1ba9.forEach((_0x3e6f27) => _0x2a5f0e(_0x3e6f27, _0x2a6214 + 1));
        return;
      }
      if (typeof _0x3e1ba9 !== 'object') return;
      if (_0x48d228.has(_0x3e1ba9)) return;
      (_0x48d228.add(_0x3e1ba9),
        _0x2a69cd.push(_0x3e1ba9),
        ['data', 'result', 'queryResult', 'listTask', 'task', 'tasks'].forEach((_0x274571) =>
          _0x2a5f0e(_0x3e1ba9[_0x274571], _0x2a6214 + 1),
        ));
    };
  return (_0x12d875.forEach((_0x1d005a) => _0x2a5f0e(_0x1d005a, 0)), _0x2a69cd);
}
function firstPayloadString(_0x5df285, _0x45b102) {
  for (const _0x4b0460 of _0x5df285) {
    for (const _0x236721 of _0x45b102) {
      const _0x2c0756 = String(_0x4b0460?.[_0x236721] || '').trim();
      if (_0x2c0756) return _0x2c0756;
    }
  }
  return '';
}
function extractDreaminaRawStatus(_0x24abba, _0x51aaee) {
  const _0x528e39 = collectPayloadObjects(_0x24abba, _0x51aaee)
    .map((_0x17fa60) => firstPayloadString([_0x17fa60], ['status', 'gen_status', 'genStatus']).toLowerCase())
    .filter(Boolean);
  if (_0x528e39.some((_0x5c2ac4) => ['fail', 'failed', 'error'].includes(_0x5c2ac4))) return 'failed';
  if (
    _0x528e39.some((_0x2defb3) => ['success', 'succeeded', 'done', 'finish', 'finished'].includes(_0x2defb3))
  )
    return 'success';
  return '';
}
function extractDreaminaRawFailReason(_0x33d8ad, _0x1cca88) {
  return firstPayloadString(collectPayloadObjects(_0x33d8ad, _0x1cca88), [
    'failReason',
    'fail_reason',
    'failureReason',
    'failure_reason',
  ]);
}
function extractDreaminaRawErrorMessage(_0x16c027, _0x38ba5f) {
  return firstPayloadString(collectPayloadObjects(_0x16c027, _0x38ba5f), [
    'error',
    'errorMessage',
    'message',
    'msg',
  ]);
}
function isDreaminaTerminalFailureMessage(_0x2b864b) {
  const _0x17f12e = String(_0x2b864b || '')
    .trim()
    .toLowerCase();
  if (!_0x17f12e) return false;
  return [
    '失败',
    '审核未通过',
    '内容安全',
    '安全审核',
    '违规',
    '敏感',
    '不符合',
    '拦截',
    '风控',
    'failed',
    'failure',
    'error',
    'review failed',
    'content safety',
    'content filter',
    'violation',
    'sensitive',
    'flagged',
    'blocked',
    'not allowed',
  ].some((_0x58bde0) => _0x17f12e.includes(_0x58bde0));
}
function normalizeResolutionType(_0x111c12) {
  const _0xd6e63e = String(_0x111c12 || '').trim();
  if (!_0xd6e63e) return '';
  return _0xd6e63e.toLowerCase();
}
function toTrimmedArray(_0x36971b) {
  if (!Array.isArray(_0x36971b)) return [];
  const _0xd3597f = [];
  return (
    _0x36971b.forEach((_0x105390) => {
      const _0x155655 = String(_0x105390 || '').trim();
      if (_0x155655) _0xd3597f.push(_0x155655);
    }),
    _0xd3597f
  );
}
function basenameFromPath(_0x5af682) {
  const _0x6bc77 = String(_0x5af682 || '')
    .trim()
    .replace(/\\/g, '/');
  if (!_0x6bc77) return '';
  return _0x6bc77.split('/').filter(Boolean).pop() || '';
}
export function normalizeDreaminaErrorMessage(_0x5ac19b) {
  const _0x26cad5 = String(_0x5ac19b || '').trim();
  if (!_0x26cad5) return '';
  const _0x469540 = _0x26cad5.toLowerCase();
  if (
    _0x469540.includes('do request:') &&
    (_0x469540.includes('context deadline exceeded') ||
      _0x469540.includes('client.timeout') ||
      _0x469540.includes('awaiting headers'))
  )
    return '即梦官方生成接口响应超时，本次没有拿到任务ID。网页可用不代表 CLI 生成接口稳定，请稍后重试；如果连续出现，请切换网络/代理或重新登录即梦后再试。';
  let _0x2ebc21 = _0x26cad5.match(
    /upload resource\s+"([^"]+)"\s*:\s*upload (video|audio)\s*:\s*duration\s+([0-9.]+)\s+seconds\s+is\s+out\s+of\s+allowed\s+range\s+\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/i,
  );
  !_0x2ebc21 &&
    ((_0x2ebc21 = _0x26cad5.match(
      /upload (video|audio)\s*:\s*duration\s+([0-9.]+)\s+seconds\s+is\s+out\s+of\s+allowed\s+range\s+\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/i,
    )),
    _0x2ebc21 && (_0x2ebc21 = ['', '', ..._0x2ebc21.slice(1)]));
  if (_0x2ebc21) {
    const [, _0xf83356, _0x219c96, _0x4444b5, _0x3583f3, _0x425ca1] = _0x2ebc21,
      _0x56d6e1 = String(_0x219c96 || '').toLowerCase() === 'audio',
      _0x323b85 = basenameFromPath(_0xf83356),
      _0x5a5bc5 = _0x56d6e1 ? '源音频' : '源视频',
      _0x2dd1c0 = _0x323b85 ? '“' + _0x323b85 + '”' : _0x5a5bc5,
      _0x774d1 = _0x56d6e1
        ? '请将音频裁剪到 ' + _0x425ca1 + ' 秒以内后再上传。'
        : '请将视频裁剪到 ' + _0x425ca1 + ' 秒以内，建议裁到 14.9 秒后再上传。';
    return (
      '上传' +
      _0x5a5bc5 +
      '失败：' +
      _0x2dd1c0 +
      '时长 ' +
      _0x4444b5 +
      ' 秒，超出即梦允许范围（' +
      _0x3583f3 +
      '-' +
      _0x425ca1 +
      ' 秒）。' +
      _0x774d1
    );
  }
  return _0x26cad5;
}
function normalizeDreaminaThrownError(_0x4af0d7) {
  if (_0x4af0d7 && typeof _0x4af0d7 === 'object') {
    const _0x3bb803 = normalizeDreaminaErrorMessage(_0x4af0d7.message);
    if (_0x3bb803) _0x4af0d7.message = _0x3bb803;
  }
  return _0x4af0d7;
}
function normalizeModelVersion(_0x532308) {
  const _0x4e8ffe = String(_0x532308?.modelVersion || '').trim();
  if (_0x4e8ffe) return _0x4e8ffe;
  const _0x4bf07e = String(_0x532308?.model || '').trim();
  if (!_0x4bf07e.startsWith('dreamina/')) return '';
  const _0xa9c393 = _0x4bf07e.slice('dreamina/'.length).trim();
  if (
    _0xa9c393 === 'text2image' ||
    _0xa9c393 === 'image2image' ||
    _0xa9c393 === 'text2video' ||
    _0xa9c393 === 'image2video'
  )
    return '';
  return _0xa9c393;
}
function normalizeDreaminaRatio(_0x30a6d3, _0x22917b) {
  const _0x2ea4e4 = String(_0x30a6d3?.aspectRatio || '').trim();
  if (!_0x2ea4e4) return '';
  if (_0x2ea4e4 === '自适应' || _0x2ea4e4 === 'auto') return _0x22917b ? '' : '1:1';
  return _0x2ea4e4;
}
function toLocalPath(_0xcfa09f) {
  return normalizeLocalPath(_0xcfa09f);
}
function toLocalUrl(_0x49266c) {
  return localPathToUrl(_0x49266c);
}
function normalizeOutputsArray(_0x584433) {
  const _0xe4db = [],
    _0x2fd137 = new Set(),
    _0x4dd696 = new Set([
      'data',
      'result',
      'results',
      'output',
      'outputs',
      'raw',
      'queryResult',
      'image',
      'images',
      'image_list',
      'imageList',
      'image_infos',
      'imageInfos',
      'video',
      'videos',
      'video_list',
      'videoList',
      'video_infos',
      'videoInfos',
      'media',
      'medias',
      'media_list',
      'mediaList',
      'file',
      'files',
      'file_list',
      'fileList',
      'resource',
      'resources',
      'download',
      'downloads',
      'content',
      'contents',
    ]),
    _0x31d08e = [
      'url',
      'uri',
      'download_url',
      'downloadUrl',
      'file_url',
      'fileUrl',
      'media_url',
      'mediaUrl',
      'image_url',
      'imageUrl',
      'origin_image_url',
      'originImageUrl',
      'original_image_url',
      'originalImageUrl',
      'result_image_url',
      'resultImageUrl',
      'video_url',
      'videoUrl',
      'cover_url',
      'coverUrl',
      'src',
    ],
    _0x1829e1 = [
      'local_path',
      'localPath',
      'path',
      'file_path',
      'filePath',
      'download_path',
      'downloadPath',
      'local_uri',
      'localUri',
    ],
    _0x1977eb = (_0x4b1704, _0x3bbf1c) => {
      for (const _0x3f1f73 of _0x3bbf1c) {
        const _0x47dee7 = String(_0x4b1704?.[_0x3f1f73] || '').trim();
        if (_0x47dee7) return _0x47dee7;
      }
      return '';
    },
    _0x4566b2 = (_0x477dc7) => {
      if (!_0x477dc7 || typeof _0x477dc7 !== 'object') return;
      const _0x24d692 = _0x1977eb(_0x477dc7, _0x31d08e),
        _0x1a1ead = _0x1977eb(_0x477dc7, _0x1829e1),
        _0xe016cf = String(_0x477dc7?.mimeType || _0x477dc7?.mime_type || '').trim();
      if (!_0x24d692 && !_0x1a1ead) return;
      const _0x40129a = [_0x24d692, _0x1a1ead, _0xe016cf].join('|');
      if (_0x2fd137.has(_0x40129a)) return;
      (_0x2fd137.add(_0x40129a), _0xe4db.push(_0x477dc7));
    },
    _0x387ccf = (_0x23d8f7) => {
      const _0x4ab50c = String(_0x23d8f7 || '').trim(),
        _0x85220a = _0x4ab50c.toLowerCase();
      if (_0x85220a.includes('input') || _0x85220a.includes('reference') || _0x85220a.includes('prompt'))
        return false;
      return (
        _0x4dd696.has(_0x4ab50c) ||
        _0x85220a.includes('output') ||
        _0x85220a.includes('result') ||
        _0x85220a.includes('image') ||
        _0x85220a.includes('video') ||
        _0x85220a.includes('media') ||
        _0x85220a.includes('file') ||
        _0x85220a.includes('url') ||
        _0x85220a.includes('uri')
      );
    },
    _0x370181 = (_0x5f405a, _0x4800b6 = 0) => {
      if (!_0x5f405a || _0x4800b6 > 8) return;
      if (typeof _0x5f405a === 'string') {
        const _0x342cc1 = _0x5f405a.trim();
        if (/^https?:\/\//i.test(_0x342cc1)) _0x4566b2({ url: _0x342cc1 });
        return;
      }
      if (Array.isArray(_0x5f405a)) {
        _0x5f405a.forEach((_0x5c8ea8) => _0x370181(_0x5c8ea8, _0x4800b6 + 1));
        return;
      }
      if (typeof _0x5f405a !== 'object') return;
      (_0x4566b2({
        url: _0x1977eb(_0x5f405a, _0x31d08e),
        localPath: _0x1977eb(_0x5f405a, _0x1829e1),
        mimeType: String(_0x5f405a?.mimeType || _0x5f405a?.mime_type || '').trim(),
      }),
        Object.entries(_0x5f405a).forEach(([_0x3c4526, _0x46187f]) => {
          if (_0x387ccf(_0x3c4526)) _0x370181(_0x46187f, _0x4800b6 + 1);
        }));
    };
  return (
    _0x370181(_0x584433),
    _0xe4db
      .map((_0x137c56) => {
        const _0x394da7 = toLocalPath(_0x137c56?.localPath);
        return {
          url: String(_0x137c56?.url || '').trim(),
          localPath: _0x394da7,
          localUrl: toLocalUrl(_0x394da7),
          mimeType: String(_0x137c56?.mimeType || '').trim(),
        };
      })
      .filter((_0x49490f) => _0x49490f.url || _0x49490f.localPath)
  );
}
function hasDreaminaUsableOutputs(_0x54b357) {
  return normalizeOutputsArray(_0x54b357).length > 0;
}
function normalizeQueueMetric(_0x490b14) {
  const _0x21ebf0 = Number(_0x490b14);
  if (!Number.isFinite(_0x21ebf0) || _0x21ebf0 < 0) return null;
  return Math.trunc(_0x21ebf0);
}
function normalizeQueueStatus(_0x578a43) {
  return String(_0x578a43 || '')
    .trim()
    .toLowerCase();
}
function isDreaminaQueuedState(_0x4d0f10, _0x404fe0) {
  if (_0x4d0f10 !== 'pending') return false;
  if (!_0x404fe0) return false;
  return DREAMINA_QUEUE_HINTS.some((_0x45bf4a) => _0x404fe0.includes(_0x45bf4a));
}
function phaseToLabel(_0xf5f4bb, _0x1cfd03 = '') {
  if (_0xf5f4bb === 'queued') return '排队中';
  if (_0xf5f4bb === 'generating') return '生成中';
  if (_0xf5f4bb === 'syncing') return '正在同步结果';
  if (_0xf5f4bb === 'done') return '已完成';
  if (_0xf5f4bb === 'failed') return String(_0x1cfd03 || '').trim() || '查询失败';
  return '处理中';
}
function sleep(_0x52adf7) {
  return new Promise((_0x175441) => setTimeout(_0x175441, _0x52adf7));
}
function includesTransientHint(_0x12ea7b) {
  const _0x489ff9 = String(_0x12ea7b || '')
    .trim()
    .toLowerCase();
  if (!_0x489ff9) return false;
  return DREAMINA_TRANSIENT_ERROR_HINTS.some((_0x4ff3f6) => _0x489ff9.includes(_0x4ff3f6));
}
function isTransientDreaminaError(_0x2dd701) {
  if (_0x2dd701?.dreaminaReturnedError === true) return false;
  const _0x225a21 = String(_0x2dd701?.code || '')
      .trim()
      .toUpperCase(),
    _0x511f0c = String(_0x2dd701?.type || '')
      .trim()
      .toUpperCase(),
    _0x4639f1 = Number(_0x2dd701?.status);
  if (
    _0x225a21 === 'TIMEOUT' ||
    _0x225a21 === 'ETIMEDOUT' ||
    _0x225a21 === 'ECONNRESET' ||
    _0x225a21 === 'ECONNREFUSED' ||
    _0x225a21 === 'ENOTFOUND' ||
    _0x225a21 === 'EAI_AGAIN'
  )
    return true;
  if (
    _0x511f0c === 'TIMEOUT' ||
    _0x511f0c === 'NETWORK_ERROR' ||
    _0x511f0c === 'DNS_ERROR' ||
    _0x511f0c === 'RATE_LIMIT' ||
    _0x511f0c === 'SERVER_ERROR' ||
    _0x511f0c === 'SERVICE_UNAVAILABLE'
  )
    return true;
  if (_0x4639f1 === 0x1ad || _0x4639f1 >= 0x1f4) return true;
  return includesTransientHint(_0x2dd701?.message || _0x2dd701);
}
export function normalizeDreaminaTaskSnapshot(_0x40ad60, _0x34da21 = {}) {
  const _0x5ae155 = String(
      _0x34da21?.submitId || _0x40ad60?.submitId || _0x40ad60?.raw?.submitId || '',
    ).trim(),
    _0x38e2ef = normalizeOutputsArray(_0x40ad60),
    _0x3cf608 = toStatus(_0x40ad60?.status),
    _0x2ba222 =
      _0x40ad60?.raw && typeof _0x40ad60.raw === 'object' && !Array.isArray(_0x40ad60.raw)
        ? _0x40ad60.raw
        : {},
    _0x263c1f = extractDreaminaRawStatus(_0x40ad60, _0x2ba222),
    _0x3f5321 = normalizeQueueStatus(
      _0x2ba222.queue_status || _0x2ba222.queueStatus || _0x40ad60?.queueStatus,
    ),
    _0x41de93 = normalizeQueueMetric(_0x2ba222.queue_idx ?? _0x2ba222.queueIndex ?? _0x40ad60?.queueIndex),
    _0x331232 = normalizeQueueMetric(
      _0x2ba222.queue_length ?? _0x2ba222.queueLength ?? _0x40ad60?.queueLength,
    ),
    _0x217e55 = extractDreaminaRawFailReason(_0x40ad60, _0x2ba222),
    _0x5bee9f = extractDreaminaRawErrorMessage(_0x40ad60, _0x2ba222),
    _0x568804 = _0x263c1f === 'failed' || _0x3cf608 === 'failed',
    _0x47fb63 = _0x568804 || isDreaminaTerminalFailureMessage(_0x5bee9f) ? _0x5bee9f : '',
    _0x392964 = _0x217e55 || _0x47fb63,
    _0x483152 = _0x568804 || _0x392964 ? 'failed' : _0x263c1f || _0x3cf608;
  let _0x47feb1 = 'generating';
  if (_0x483152 === 'failed') _0x47feb1 = 'failed';
  else {
    if (_0x483152 === 'cancelled') _0x47feb1 = 'cancelled';
    else {
      if (_0x483152 === 'success') _0x47feb1 = _0x38e2ef.length > 0 ? 'done' : 'syncing';
      else isDreaminaQueuedState(_0x483152, _0x3f5321) && (_0x47feb1 = 'queued');
    }
  }
  const _0x1f85af =
    _0x483152 === 'failed'
      ? 'failed'
      : _0x483152 === 'cancelled'
        ? 'cancelled'
        : _0x483152 === 'success' && _0x38e2ef.length > 0
          ? 'success'
          : 'pending';
  return {
    submitId: _0x5ae155,
    status: _0x1f85af,
    phase: _0x47feb1,
    label: phaseToLabel(_0x47feb1, _0x392964),
    queueStatus: _0x3f5321,
    queueIndex: _0x41de93,
    queueLength: _0x331232,
    outputs: _0x38e2ef,
    failReason: _0x392964,
    raw: _0x2ba222,
    isTerminal: _0x47feb1 === 'done' || _0x47feb1 === 'failed' || _0x47feb1 === 'cancelled',
    hasOutputs: _0x38e2ef.length > 0,
    lastCheckedAt: Date.now(),
  };
}
function postJson(_0x3ad9e9, _0x240920) {
  return requester({
    url: _0x3ad9e9,
    method: 'POST',
    provider: 'dreamina',
    timeout: DREAMINA_SUBMIT_TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(_0x240920 || {}),
  });
}
export async function submitDreaminaText2Image(_0x121c94) {
  return postJson('/api/v2/dreamina/text2image', _0x121c94);
}
export async function submitDreaminaImage2Image(_0x1b5e3c) {
  return postJson('/api/v2/dreamina/image2image', _0x1b5e3c);
}
export async function submitDreaminaText2Video(_0x34c72d) {
  return postJson('/api/v2/dreamina/text2video', _0x34c72d);
}
export async function submitDreaminaImage2Video(_0x5e7887) {
  return postJson('/api/v2/dreamina/image2video', _0x5e7887);
}
export async function submitDreaminaFrames2Video(_0x26b937) {
  return postJson('/api/v2/dreamina/frames2video', _0x26b937);
}
export async function submitDreaminaMultiframe2Video(_0x20ba2e) {
  return postJson('/api/v2/dreamina/multiframe2video', _0x20ba2e);
}
export async function submitDreaminaMultimodal2Video(_0x331091) {
  return postJson('/api/v2/dreamina/multimodal2video', _0x331091);
}
export async function cancelDreaminaVideoQueueTask(_0x17ba96) {
  const _0x20fcf4 = String(_0x17ba96 || '').trim();
  if (!_0x20fcf4) throw new Error('submitId 不能为空');
  const _0x52163b = await postJson('/api/v2/dreamina/video_queue/cancel', { submitId: _0x20fcf4 });
  if (_0x52163b?.success === false) throw new Error(_0x52163b?.message || '取消即梦视频队列任务失败');
  return _0x52163b || {};
}
export async function queryDreaminaResult(_0x543e96, _0x516f85 = {}) {
  const _0x113098 = String(_0x543e96 || '').trim();
  if (!_0x113098) throw new Error('submitId 不能为空');
  const _0x18bc29 = _0x516f85?.autoDownload !== false,
    _0x34687e = new URLSearchParams({ submitId: _0x113098, autoDownload: _0x18bc29 ? '1' : '0' }),
    _0xac9dea = await requester({
      url: '/api/v2/dreamina/query_result?' + _0x34687e.toString(),
      method: 'GET',
      provider: 'dreamina',
      timeout: DREAMINA_QUERY_TIMEOUT,
      retries: Number.isFinite(Number(_0x516f85?.retries))
        ? Math.max(0, Math.trunc(Number(_0x516f85.retries)))
        : DREAMINA_QUERY_RETRIES,
      retryDelay: Number.isFinite(Number(_0x516f85?.retryDelay))
        ? Math.max(0, Math.trunc(Number(_0x516f85.retryDelay)))
        : DREAMINA_QUERY_RETRY_DELAY,
    });
  if (_0xac9dea?.success === false) {
    const _0x27a5a7 = new Error(normalizeDreaminaErrorMessage(_0xac9dea?.message) || '即梦任务查询失败');
    ((_0x27a5a7.code = 'DREAMINA_RETURNED_ERROR'), (_0x27a5a7.dreaminaReturnedError = true));
    throw _0x27a5a7;
  }
  return _0xac9dea || {};
}
async function pollDreaminaUntilDoneOnce(_0x22bdfc, _0x1b46ce = {}) {
  const _0x13ffc5 = Number(_0x1b46ce?.maxWaitMs || DREAMINA_MAX_WAIT),
    _0x228560 = Number(_0x1b46ce?.intervalMs || DREAMINA_POLL_INTERVAL),
    _0x597444 = Number.isFinite(Number(_0x1b46ce?.maxTransientErrors))
      ? Math.max(0, Math.trunc(Number(_0x1b46ce.maxTransientErrors)))
      : DREAMINA_MAX_TRANSIENT_ERRORS,
    _0x35cf6f = Date.now();
  let _0x292081 = null,
    _0x131116 = 0;
  while (Date.now() - _0x35cf6f < _0x13ffc5) {
    if (_0x1b46ce?.signal?.aborted) throw new Error('CANCELLED');
    let _0x297e7b = null;
    try {
      ((_0x292081 = await queryDreaminaResult(_0x22bdfc, { autoDownload: true })),
        (_0x297e7b = normalizeDreaminaTaskSnapshot(_0x292081, { submitId: _0x22bdfc })));
    } catch (_0x457d30) {
      if (
        _0x1b46ce?.signal?.aborted ||
        _0x457d30?.name === 'AbortError' ||
        _0x457d30?.message === 'CANCELLED'
      )
        throw _0x457d30;
      if (isTransientDreaminaError(_0x457d30)) {
        _0x131116 += 1;
        if (_0x131116 > _0x597444) {
          const _0x55905f = new Error('即梦任务查询连续异常（' + _0x131116 + ' 次），请稍后重试');
          ((_0x55905f.code = 'DREAMINA_QUERY_TRANSIENT_EXHAUSTED'),
            (_0x55905f.submitId = String(_0x22bdfc || '').trim()),
            (_0x55905f.cause = _0x457d30));
          throw _0x55905f;
        }
        await sleep(_0x228560);
        continue;
      }
      throw _0x457d30;
    }
    _0x131116 = 0;
    typeof _0x1b46ce?.onProgress === 'function' && (await _0x1b46ce.onProgress(_0x297e7b));
    const _0x21fc15 = toStatus(_0x297e7b?.status);
    if (_0x21fc15 === 'cancelled') throw new Error('CANCELLED');
    if (_0x21fc15 === 'failed') return _0x292081;
    if (_0x21fc15 === 'success' && hasDreaminaUsableOutputs(_0x292081)) return _0x292081;
    await sleep(_0x228560);
  }
  try {
    const _0x5d7561 = await queryDreaminaResult(_0x22bdfc, { autoDownload: true }),
      _0x2745ca = normalizeDreaminaTaskSnapshot(_0x5d7561, { submitId: _0x22bdfc });
    typeof _0x1b46ce?.onProgress === 'function' && (await _0x1b46ce.onProgress(_0x2745ca));
    const _0x3f02dc = toStatus(_0x2745ca?.status);
    if (_0x3f02dc === 'cancelled') throw new Error('CANCELLED');
    if (_0x3f02dc === 'failed') return _0x5d7561;
    if (_0x3f02dc === 'success' && hasDreaminaUsableOutputs(_0x5d7561)) return _0x5d7561;
    _0x292081 = _0x5d7561;
  } catch (_0x41cf9b) {
    throw _0x41cf9b;
  }
  const _0x154556 =
      Number.isFinite(_0x13ffc5) && _0x13ffc5 > 0 ? Math.max(1, Math.ceil(_0x13ffc5 / 0xea60)) : 0,
    _0x327d2f = new Error(
      _0x154556 > 0 ? '即梦任务处理超时（已等待约 ' + _0x154556 + ' 分钟）' : '即梦任务处理超时，请稍后重试',
    );
  ((_0x327d2f.code = DREAMINA_POLL_TIMEOUT_CODE), (_0x327d2f.submitId = String(_0x22bdfc || '').trim()));
  throw _0x327d2f;
}
export async function pollDreaminaUntilDone(_0x22a191, _0x220e56 = {}) {
  const _0x44480d = String(_0x22a191 || '').trim(),
    _0x5e517b = String(_0x220e56?.taskKind || _0x220e56?.kind || 'task').trim() || 'task';
  return runTaskSingleFlight({ provider: 'dreamina', kind: _0x5e517b, submitId: _0x44480d }, () =>
    pollDreaminaUntilDoneOnce(_0x44480d, _0x220e56),
  );
}
export async function runDreaminaImageGeneration(_0x3656d5, _0x2b6425 = {}) {
  const _0x314e66 = String(_0x3656d5?.prompt || '').trim(),
    _0x40979e = Array.isArray(_0x3656d5?.inputUrls) ? _0x3656d5.inputUrls.filter(Boolean) : [],
    _0x457d15 = _0x40979e.length > 0,
    _0x3fb593 = normalizeDreaminaRatio(_0x3656d5, _0x457d15),
    _0x5b3db6 = normalizeResolutionType(_0x3656d5?.imageSize),
    _0x310703 = normalizeModelVersion(_0x3656d5),
    _0x111928 = { prompt: _0x314e66 };
  if (_0x3fb593) _0x111928.ratio = _0x3fb593;
  if (_0x5b3db6) _0x111928.resolutionType = _0x5b3db6;
  if (_0x310703) _0x111928.modelVersion = _0x310703;
  let _0x4c1796 = null;
  _0x40979e.length > 0
    ? (_0x4c1796 = await submitDreaminaImage2Image({ images: _0x40979e, ..._0x111928 }))
    : (_0x4c1796 = await submitDreaminaText2Image({ ..._0x111928 }));
  if (_0x4c1796?.success === false)
    throw new Error(normalizeDreaminaErrorMessage(_0x4c1796?.message) || '即梦图片任务提交失败');
  const _0x24abf7 = String(_0x4c1796?.submitId || '').trim();
  if (!_0x24abf7) throw new Error('即梦图片任务提交失败：未返回 submitId');
  (_0x2b6425?.onTaskMeta?.({ taskId: _0x24abf7, submitId: _0x24abf7, provider: 'dreamina', kind: 'image' }),
    _0x2b6425?.onTaskId?.(_0x24abf7));
  const _0x3997ab = await pollDreaminaUntilDone(_0x24abf7, { ..._0x2b6425, taskKind: 'image' }),
    _0x410e8a = normalizeDreaminaTaskSnapshot(_0x3997ab, { submitId: _0x24abf7 });
  if (_0x410e8a?.phase === 'failed')
    throw new Error(normalizeDreaminaErrorMessage(_0x410e8a?.failReason) || '即梦图片生成失败');
  const _0x443914 = Array.isArray(_0x410e8a?.outputs) ? _0x410e8a.outputs : [];
  if (!_0x443914.length) throw new Error('即梦图片生成完成，但没有可用输出');
  return _0x443914.map((_0x46f964) => {
    const _0x12996e = _0x46f964.localUrl || _0x46f964.url;
    return {
      sourceId: null,
      thumbId: null,
      sourceUrl: _0x46f964.url || _0x12996e,
      thumbUrl: _0x12996e,
      imageUrl: _0x12996e,
      localPath: _0x46f964.localPath || '',
    };
  });
}
export function buildDreaminaVideoSubmitRequest(_0x2688fb = {}) {
  const _0x57efa7 = toTrimmedArray(
      Array.isArray(_0x2688fb?.images) && _0x2688fb.images.length ? _0x2688fb.images : _0x2688fb?.inputUrls,
    ),
    _0x579872 = toTrimmedArray(_0x2688fb?.videos),
    _0x1ce01f = toTrimmedArray(_0x2688fb?.audios),
    _0x46191 = normalizeDreaminaVideoRouteMode(_0x2688fb?.dreaminaRouteMode, _0x2688fb?.mode),
    _0x3ce060 =
      String(_0x2688fb?.dreaminaTaskType || '').trim() ||
      resolveDreaminaVideoTaskType({
        routeMode: _0x46191,
        imageCount: _0x57efa7.length,
        videoCount: _0x579872.length,
        audioCount: _0x1ce01f.length,
      }),
    _0x97891e = validateDreaminaVideoRouteSelection({
      routeMode: _0x46191,
      taskType: _0x3ce060,
      imageCount: _0x57efa7.length,
      videoCount: _0x579872.length,
      audioCount: _0x1ce01f.length,
    });
  if (_0x97891e) throw new Error(_0x97891e);
  const _0x182299 = String(_0x2688fb?.prompt || '').trim(),
    _0x4d6bae = normalizeDreaminaVideoModel(_0x2688fb?.model, _0x2688fb?.provider),
    _0x321e0f = ensureDreaminaVideoModelForTask(_0x3ce060, _0x4d6bae, 'dreamina') || _0x4d6bae,
    _0x409047 =
      String(_0x2688fb?.modelVersion || '').trim() ||
      getDreaminaVideoModelVersion(_0x321e0f, 'dreamina') ||
      normalizeModelVersion(_0x2688fb),
    _0x530533 = String(_0x2688fb?.installId || '').trim(),
    _0x2fe2b6 = normalizeDreaminaVideoResolution(
      _0x3ce060,
      _0x321e0f,
      _0x2688fb?.videoResolution || _0x2688fb?.videoSize || _0x2688fb?.resolution,
      'dreamina',
    ),
    _0xbbbca5 = normalizeDreaminaVideoAspectRatio(_0x2688fb?.aspectRatio),
    _0x589e18 = normalizeDreaminaVideoDuration(_0x3ce060, _0x321e0f, _0x2688fb?.duration, 'dreamina');
  if (_0x3ce060 === 'text2video') {
    if (!_0x182299) throw new Error('文生视频需要填写提示词');
    return {
      taskType: _0x3ce060,
      url: '/api/v2/dreamina/text2video',
      body: {
        prompt: _0x182299,
        duration: _0x589e18,
        ratio: _0xbbbca5,
        videoResolution: _0x2fe2b6,
        ...(_0x530533 ? { installId: _0x530533 } : {}),
        ...(_0x409047 ? { modelVersion: _0x409047 } : {}),
      },
    };
  }
  if (_0x3ce060 === 'image2video') {
    const _0x493d18 = String(_0x2688fb?.image || _0x57efa7[0] || '').trim();
    if (!_0x182299) throw new Error('首帧生视频需要填写提示词');
    if (!_0x493d18) throw new Error('首帧生视频至少需要 1 张图片');
    return {
      taskType: _0x3ce060,
      url: '/api/v2/dreamina/image2video',
      body: {
        image: _0x493d18,
        prompt: _0x182299,
        duration: _0x589e18,
        videoResolution: _0x2fe2b6,
        ...(_0x530533 ? { installId: _0x530533 } : {}),
        ...(_0x409047 ? { modelVersion: _0x409047 } : {}),
      },
    };
  }
  if (_0x3ce060 === 'frames2video') {
    const _0x5e3c46 = String(_0x2688fb?.first || _0x57efa7[0] || '').trim(),
      _0x2d1a52 = String(_0x2688fb?.last || _0x57efa7[1] || '').trim();
    if (!_0x182299) throw new Error('首尾帧模式需要填写提示词');
    if (!_0x5e3c46 || !_0x2d1a52) throw new Error('首尾帧模式至少需要 2 张图片');
    return {
      taskType: _0x3ce060,
      url: '/api/v2/dreamina/frames2video',
      body: {
        first: _0x5e3c46,
        last: _0x2d1a52,
        prompt: _0x182299,
        duration: _0x589e18,
        videoResolution: _0x2fe2b6,
        ...(_0x530533 ? { installId: _0x530533 } : {}),
        ...(_0x409047 ? { modelVersion: _0x409047 } : {}),
      },
    };
  }
  if (_0x3ce060 === 'multiframe2video') {
    const _0x289c7a = _0x57efa7.slice(0, 20);
    if (_0x289c7a.length < 2) throw new Error('多帧叙事至少需要 2 张图片');
    const _0x5d08fc = Array.isArray(_0x2688fb?.transitionPrompts)
        ? _0x2688fb.transitionPrompts.map((_0x5d26ec) => String(_0x5d26ec || '').trim())
        : [],
      _0x237bc0 = Array.isArray(_0x2688fb?.transitionDurations) ? _0x2688fb.transitionDurations : [],
      _0x308db9 = Math.max(0, _0x289c7a.length - 1),
      _0x598f69 = [],
      _0x1c9081 = [];
    for (let _0x255b82 = 0; _0x255b82 < _0x308db9; _0x255b82 += 1) {
      _0x598f69.push(String(_0x5d08fc[_0x255b82] || '').trim() || _0x182299);
      const _0x24c290 = Number(_0x237bc0[_0x255b82]);
      _0x1c9081.push(Number.isFinite(_0x24c290) && _0x24c290 > 0 ? Math.max(1, Math.trunc(_0x24c290)) : 3);
    }
    const _0x596ea0 = { images: _0x289c7a };
    if (_0x530533) _0x596ea0.installId = _0x530533;
    if (_0x289c7a.length === 2) {
      if (!(_0x598f69[0] || _0x182299)) throw new Error('两张图的多帧叙事需要提示词');
      ((_0x596ea0.prompt = _0x598f69[0] || _0x182299), (_0x596ea0.duration = _0x1c9081[0] || _0x589e18 || 3));
    } else {
      if (!_0x598f69.every((_0x3609c9) => String(_0x3609c9 || '').trim()))
        throw new Error('多帧叙事的每段 transition prompt 都不能为空');
      ((_0x596ea0.transitionPrompts = _0x598f69), (_0x596ea0.transitionDurations = _0x1c9081));
    }
    return { taskType: _0x3ce060, url: '/api/v2/dreamina/multiframe2video', body: _0x596ea0 };
  }
  if (_0x3ce060 === 'multimodal2video') {
    if (!_0x57efa7.length && !_0x579872.length) throw new Error('全能参考至少需要 1 个图片或视频参考');
    return {
      taskType: _0x3ce060,
      url: '/api/v2/dreamina/multimodal2video',
      body: {
        images: _0x57efa7,
        videos: _0x579872,
        audios: _0x1ce01f,
        prompt: _0x182299,
        duration: _0x589e18,
        ratio: _0xbbbca5,
        videoResolution: _0x2fe2b6,
        ...(_0x530533 ? { installId: _0x530533 } : {}),
        ...(_0x409047 ? { modelVersion: _0x409047 } : {}),
      },
    };
  }
  throw new Error('未识别的即梦视频任务类型');
}
export async function runDreaminaVideoGeneration(_0x8eea56, _0x4d389d = {}) {
  const _0x296447 = buildDreaminaVideoSubmitRequest(_0x8eea56 || {});
  let _0x1c9f82 = null;
  try {
    if (_0x296447.url === '/api/v2/dreamina/text2video')
      _0x1c9f82 = await submitDreaminaText2Video(_0x296447.body);
    else {
      if (_0x296447.url === '/api/v2/dreamina/image2video')
        _0x1c9f82 = await submitDreaminaImage2Video(_0x296447.body);
      else {
        if (_0x296447.url === '/api/v2/dreamina/frames2video')
          _0x1c9f82 = await submitDreaminaFrames2Video(_0x296447.body);
        else {
          if (_0x296447.url === '/api/v2/dreamina/multiframe2video')
            _0x1c9f82 = await submitDreaminaMultiframe2Video(_0x296447.body);
          else {
            if (_0x296447.url === '/api/v2/dreamina/multimodal2video')
              _0x1c9f82 = await submitDreaminaMultimodal2Video(_0x296447.body);
            else throw new Error('未知的即梦视频请求路由');
          }
        }
      }
    }
  } catch (_0x41d438) {
    throw normalizeDreaminaThrownError(_0x41d438);
  }
  if (_0x1c9f82?.success === false) {
    const _0xf189db = new Error(normalizeDreaminaErrorMessage(_0x1c9f82?.message) || '即梦视频任务提交失败');
    if (_0x1c9f82?.code != null) _0xf189db.code = String(_0x1c9f82.code || '');
    _0x1c9f82?.requiredModelId != null &&
      (_0xf189db.requiredModelId = String(_0x1c9f82.requiredModelId || '').trim());
    _0x1c9f82?.subscriptionStatus != null &&
      (_0xf189db.subscriptionStatus = String(_0x1c9f82.subscriptionStatus || '').trim());
    _0x1c9f82?.reasonCode != null && (_0xf189db.reasonCode = String(_0x1c9f82.reasonCode || '').trim());
    ((_0xf189db.contactText = String(_0x1c9f82?.contactText || '').trim()),
      (_0xf189db.contactUrl = String(_0x1c9f82?.contactUrl || '').trim()));
    throw _0xf189db;
  }
  const _0x3433b6 = String(_0x1c9f82?.submitId || '').trim();
  if (!_0x3433b6) throw new Error('即梦视频任务提交失败：未返回 submitId');
  (_0x4d389d?.onTaskMeta?.({ taskId: _0x3433b6, submitId: _0x3433b6, provider: 'dreamina', kind: 'video' }),
    _0x4d389d?.onTaskId?.(_0x3433b6));
  const _0x56bb1a = await pollDreaminaUntilDone(_0x3433b6, { ..._0x4d389d, taskKind: 'video' }),
    _0x1f3e0f = normalizeDreaminaTaskSnapshot(_0x56bb1a, { submitId: _0x3433b6 });
  if (_0x1f3e0f?.phase === 'failed')
    throw new Error(normalizeDreaminaErrorMessage(_0x1f3e0f?.failReason) || '即梦视频生成失败');
  const _0x32d4f9 = Array.isArray(_0x1f3e0f?.outputs) ? _0x1f3e0f.outputs : [];
  if (!_0x32d4f9.length) throw new Error('即梦视频生成完成，但没有可用输出');
  const _0x57aad8 = _0x32d4f9.map((_0x301892) => ({
    videoUrl: _0x301892.localUrl || _0x301892.url,
    localPath: _0x301892.localPath || '',
  }));
  return {
    isBatch: _0x57aad8.length > 1,
    videos: _0x57aad8,
    videoUrl: _0x57aad8[0]?.videoUrl || '',
    localPath: _0x57aad8[0]?.localPath || '',
  };
}
