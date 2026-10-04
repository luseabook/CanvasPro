import { get, post } from './requester.js';
const DEFAULT_LONG_TIMEOUT = 0x493e0;
export async function prepareSam3Matting(value, signal = {}) {
  return (
    await post('/api/v2/matting/sam3/prepare', value || {}, {
      provider: 'local',
      signal: signal.signal,
      timeout: signal.timeout ?? DEFAULT_LONG_TIMEOUT,
    }),
    true
  );
}
export async function fetchSam3RuntimeInfo(signal2 = {}) {
  return await get('/api/v2/matting/sam3/info', {
    provider: 'local',
    signal: signal2.signal,
    timeout: signal2.timeout,
  });
}
export async function segmentSam3Raw(item, signal3 = {}) {
  try {
    const blob = await post('/api/v2/matting/sam3/segment_raw', item || {}, {
      provider: 'local',
      signal: signal3.signal,
      timeout: signal3.timeout ?? DEFAULT_LONG_TIMEOUT,
      responseType: 'blob',
      returnMeta: true,
    });
    return {
      blob: blob?.data || null,
      status: Number(blob?.status) || 0,
      headers: blob?.headers || null,
      contentType: String(blob?.headers?.get('Content-Type') || blob?.headers?.get('content-type') || ''),
      maskWidth: Number(blob?.headers?.get('X-Mask-Width') || blob?.headers?.get('x-mask-width') || NaN),
      maskHeight: Number(blob?.headers?.get('X-Mask-Height') || blob?.headers?.get('x-mask-height') || NaN),
    };
  } catch (response) {
    if (Number(response?.status) === 0x194) return null;
    throw response;
  }
}
export async function segmentSam3(key, signal4 = {}) {
  return await post('/api/v2/matting/sam3/segment', key || {}, {
    provider: 'local',
    signal: signal4.signal,
    timeout: signal4.timeout ?? DEFAULT_LONG_TIMEOUT,
  });
}
