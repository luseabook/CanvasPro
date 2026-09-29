import {
  enqueueElectronMediaTask,
  cancelElectronMediaTask,
  waitForElectronMediaTask,
} from './localMediaTaskApi.js';
export async function transcribeReplicationSource({
  videoRef: _0x103d6a,
  provider: provider = 'volcengine-speech',
  isActive: isActive = () => !![],
} = {}) {
  if (!isActive()) throw new Error('视频分析所属项目已失效。');
  const _0xa4c139 = await enqueueElectronMediaTask({
    kind: 'recordingTranscribe',
    src: _0x103d6a,
    provider: provider,
  });
  if (!_0xa4c139?.['taskId']) throw new Error('录音识别需要桌面媒体服务，请重启桌面应用后重试。');
  const _0x4658fc = setInterval(() => {
    if (!isActive()) void cancelElectronMediaTask(_0xa4c139['taskId'])['catch'](() => {});
  }, 0x1f4);
  try {
    const _0x209149 = await waitForElectronMediaTask(_0xa4c139['taskId'], {
      timeout: 0x7 * 0xea60,
    });
    if (!isActive()) throw new Error('视频分析所属项目已失效。');
    return _0x209149;
  } catch (_0x483f71) {
    await cancelElectronMediaTask(_0xa4c139['taskId'])['catch'](() => {});
    throw _0x483f71;
  } finally {
    clearInterval(_0x4658fc);
  }
}
