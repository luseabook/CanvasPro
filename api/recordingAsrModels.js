export const RECORDING_ASR_MODELS = Object.freeze([
  { id: 'volcengine-speech', label: '火山 · 录音识别极速版', model: 'volc.bigasr.auc_turbo' },
  { id: 'bailian', label: '阿里 · Qwen Audio ASR', model: 'qwen-audio-3.0-asr-flash-filetrans' },
]);
export function getRecordingAsrModel(id = 'volcengine-speech') {
  const model = RECORDING_ASR_MODELS.find((entry) => entry.id === id);
  if (!model) throw new Error('不支持的语音识别模型，请重新选择。');
  return model;
}
