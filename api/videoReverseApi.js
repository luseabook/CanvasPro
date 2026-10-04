import { post } from './apiBase.js';
import { canUseElectronMediaTask, enqueueElectronMediaTask } from './localMediaTaskApi.js';
export async function reverseVideo(nodeId = {}) {
  const src = String(nodeId?.src || '').trim();
  if (!src) throw new Error('src 不能为空');
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(
      { kind: 'videoReverse', src: src, nodeId: nodeId?.nodeId || '' },
      { wait: true, timeout: 0x927c0 },
    );
  const response = await post('/api/v2/video/reverse', { src: src }, 0x927c0);
  if (!response?.success) throw new Error(response?.error || '视频倒放请求失败');
  const error = response.data || {};
  if (!error.success) throw new Error(error.error || error.message || '视频倒放失败');
  if (!error.localPath) throw new Error('视频倒放返回结果不完整');
  return error;
}
