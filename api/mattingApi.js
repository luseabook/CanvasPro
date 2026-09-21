import { get, post } from './requester.js';
const DEFAULT_LONG_TIMEOUT = 0x493e0;
export async function prepareSam3Matting(_0x528cc7, _0x52e383 = {}) {
  return (
    await post('/api/v2/matting/sam3/prepare', _0x528cc7 || {}, {
      provider: 'local',
      signal: _0x52e383.signal,
      timeout: _0x52e383.timeout ?? DEFAULT_LONG_TIMEOUT,
    }),
    true
  );
}
export async function fetchSam3RuntimeInfo(_0x156118 = {}) {
  return await get('/api/v2/matting/sam3/info', {
    provider: 'local',
    signal: _0x156118.signal,
    timeout: _0x156118.timeout,
  });
}
export async function segmentSam3Raw(_0x1e7e34, _0x44b7c9 = {}) {
  try {
    const _0x2e29c9 = await post('/api/v2/matting/sam3/segment_raw', _0x1e7e34 || {}, {
      provider: 'local',
      signal: _0x44b7c9.signal,
      timeout: _0x44b7c9.timeout ?? DEFAULT_LONG_TIMEOUT,
      responseType: 'blob',
      returnMeta: true,
    });
    return {
      blob: _0x2e29c9?.data || null,
      status: Number(_0x2e29c9?.status) || 0,
      headers: _0x2e29c9?.headers || null,
      contentType: String(
        _0x2e29c9?.headers?.get('Content-Type') || _0x2e29c9?.headers?.get('content-type') || '',
      ),
      maskWidth: Number(
        _0x2e29c9?.headers?.get('X-Mask-Width') || _0x2e29c9?.headers?.get('x-mask-width') || NaN,
      ),
      maskHeight: Number(
        _0x2e29c9?.headers?.get('X-Mask-Height') || _0x2e29c9?.headers?.get('x-mask-height') || NaN,
      ),
    };
  } catch (_0x2a7cf6) {
    if (Number(_0x2a7cf6?.status) === 0x194) return null;
    throw _0x2a7cf6;
  }
}
export async function segmentSam3(_0x141a89, _0x2fe1f2 = {}) {
  return await post('/api/v2/matting/sam3/segment', _0x141a89 || {}, {
    provider: 'local',
    signal: _0x2fe1f2.signal,
    timeout: _0x2fe1f2.timeout ?? DEFAULT_LONG_TIMEOUT,
  });
}
