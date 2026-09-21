import { post } from './apiBase.js';
import { canUseElectronMediaTask, enqueueElectronMediaTask } from './localMediaTaskApi.js';
export async function separateVideoAudio(_0x427244 = {}) {
  const _0x4c8293 = String(_0x427244?.src || '').trim();
  if (!_0x4c8293) throw new Error('src 不能为空');
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(
      { kind: 'videoAudioSeparate', src: _0x4c8293, nodeId: _0x427244?.nodeId || '' },
      { wait: true, timeout: 0x493e0 },
    );
  const _0x3eded4 = await post('/api/v2/video/separate_audio_video', { src: _0x4c8293 }, 0x2bf20);
  if (!_0x3eded4?.success) throw new Error(_0x3eded4?.error || '音画分离请求失败');
  const _0x4e81c8 = _0x3eded4.data || {};
  if (!_0x4e81c8.success) throw new Error(_0x4e81c8.error || _0x4e81c8.message || '音画分离失败');
  if (!_0x4e81c8.video?.localPath || !_0x4e81c8.audio?.localPath) throw new Error('音画分离返回结果不完整');
  return _0x4e81c8;
}
