import { post } from './apiBase.js';
import { canUseElectronMediaTask, enqueueElectronMediaTask } from './localMediaTaskApi.js';
export async function separateVideoAudio(nodeId = {}) {
  const src = String(nodeId?.src || '').trim();
  if (!src) throw new Error('src 不能为空');
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(
      { kind: 'videoAudioSeparate', src: src, nodeId: nodeId?.nodeId || '' },
      { wait: true, timeout: 300000 },
    );
  const response = await post('/api/v2/video/separate_audio_video', { src: src }, 180000);
  if (!response?.success) throw new Error(response?.error || '音画分离请求失败');
  const error = response.data || {};
  if (!error.success) throw new Error(error.error || error.message || '音画分离失败');
  if (!error.video?.localPath || !error.audio?.localPath) throw new Error('音画分离返回结果不完整');
  return error;
}
