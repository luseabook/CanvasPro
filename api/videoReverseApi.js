import { post } from './apiBase.js';
import { canUseElectronMediaTask, enqueueElectronMediaTask } from './localMediaTaskApi.js';
export async function reverseVideo(_0x49f878 = {}) {
  const _0x43b1d2 = String(_0x49f878?.src || '').trim();
  if (!_0x43b1d2) throw new Error('src 不能为空');
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(
      { kind: 'videoReverse', src: _0x43b1d2, nodeId: _0x49f878?.nodeId || '' },
      { wait: true, timeout: 0x927c0 },
    );
  const _0x13e826 = await post('/api/v2/video/reverse', { src: _0x43b1d2 }, 0x927c0);
  if (!_0x13e826?.success) throw new Error(_0x13e826?.error || '视频倒放请求失败');
  const _0x442d74 = _0x13e826.data || {};
  if (!_0x442d74.success) throw new Error(_0x442d74.error || _0x442d74.message || '视频倒放失败');
  if (!_0x442d74.localPath) throw new Error('视频倒放返回结果不完整');
  return _0x442d74;
}
