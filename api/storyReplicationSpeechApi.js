import {
  enqueueElectronMediaTask,
  cancelElectronMediaTask,
  waitForElectronMediaTask,
} from './localMediaTaskApi.js';
export async function transcribeReplicationSource({
  videoRef: videoRef,
  provider: provider = 'volcengine-speech',
  isActive: isActive = () => !![],
} = {}) {
  if (!isActive()) throw new Error('视频分析所属项目已失效。');
  const enqueueElectronMediaTask2 = await enqueueElectronMediaTask({
    kind: 'recordingTranscribe',
    src: videoRef,
    provider: provider,
  });
  if (!enqueueElectronMediaTask2?.['taskId'])
    throw new Error('录音识别需要桌面媒体服务，请重启桌面应用后重试。');
  const setInterval2 = setInterval(() => {
    if (!isActive()) void cancelElectronMediaTask(enqueueElectronMediaTask2['taskId'])['catch'](() => {});
  }, 500);
  try {
    const waitForElectronMediaTask2 = await waitForElectronMediaTask(enqueueElectronMediaTask2['taskId'], {
      timeout: 7 * 60000,
    });
    if (!isActive()) throw new Error('视频分析所属项目已失效。');
    return waitForElectronMediaTask2;
  } catch (value) {
    await cancelElectronMediaTask(enqueueElectronMediaTask2['taskId'])['catch'](() => {});
    throw value;
  } finally {
    clearInterval(setInterval2);
  }
}
