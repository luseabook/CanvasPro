import { post } from './apiBase.js';
export async function cancelRunningHubTask({ apiKey: _0x1669df, taskId: _0x1a1e30 }) {
  try {
    const _0x51bbca = await post(
      '/api/v2/runninghubwf/cancel',
      { apiKey: _0x1669df, taskId: _0x1a1e30 },
      60 * 0x3e8,
    );
    if (!_0x51bbca.success) {
      if (
        _0x51bbca.error &&
        (_0x51bbca.error.includes('<') ||
          _0x51bbca.error.includes('DOCTYPE') ||
          _0x51bbca.error.includes('html'))
      )
        throw new Error('取消失败：服务器返回了非预期的响应格式');
      throw new Error(_0x51bbca.error || '取消失败');
    }
    return _0x51bbca.data;
  } catch (_0x5312e6) {
    if (
      _0x5312e6.message &&
      _0x5312e6.message.includes('Unexpected token') &&
      (_0x5312e6.message.includes('DOCTYPE') || _0x5312e6.message.includes('<'))
    )
      throw new Error('取消失败：服务器返回了非预期的响应格式');
    if (_0x5312e6.name === 'AbortError' || _0x5312e6.message.includes('signal is aborted'))
      throw new Error('取消操作已执行');
    throw _0x5312e6;
  }
}
