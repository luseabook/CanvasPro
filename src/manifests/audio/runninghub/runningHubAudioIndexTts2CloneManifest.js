import {
  RH_AUDIO_INSTANCE_FIELD,
  createRunningHubAudioExecutionManifest,
  createRunningHubAudioModelManifest,
} from '../../shared/runningHubAudioManifestShared.js';
export const RH_AUDIO_INDEXTTS2_CLONE_MODEL_ID = 'indextts2_clone';
export const RH_AUDIO_INDEXTTS2_CLONE_EXECUTION_ID = 'runninghub.workflow.audio-indextts2-clone.v1';
export const RH_AUDIO_INDEXTTS2_CLONE_HELP_TOOLTIP = [
  'indextts2音色克隆用法',
  '输入提示词 + [[red:1段参考音色]]，生成[[red:同音色]]的新语音',
  '接入[[red:2段音频]]时可不填提示词，按双音频模式生成',
  '参考音色建议使用[[red:清晰人声]]，环境噪声越少越好',
  '适合配音、旁白、角色语音；[[red:文本内容由提示词决定]]',
  '例：用参考音色说：欢迎来到今天的节目',
].join('\n');
export const rhAudioIndexTts2CloneModelManifest = createRunningHubAudioModelManifest({
  modelId: RH_AUDIO_INDEXTTS2_CLONE_MODEL_ID,
  executionId: RH_AUDIO_INDEXTTS2_CLONE_EXECUTION_ID,
  displayName: 'indextts2音色克隆',
  description: '参考音色克隆',
  extensions: Object.freeze({ audioMenu: Object.freeze({ group: 'runninghubWorkflow', order: 10 }) }),
  help: Object.freeze({ tooltip: RH_AUDIO_INDEXTTS2_CLONE_HELP_TOOLTIP }),
  inputSlots: {
    allowedKinds: ['text', 'audio'],
    minByKind: { audio: 1 },
    maxByKind: { image: 0, video: 0, audio: 2 },
    fixedSlots: Object.freeze([
      Object.freeze({ id: 'audioRef', kind: 'audio', label: '克隆声音', required: true }),
      Object.freeze({ id: 'audio2', kind: 'audio', label: '音频2', required: false }),
    ]),
  },
  uiFields: [RH_AUDIO_INSTANCE_FIELD],
});
export const rhAudioIndexTts2CloneExecutionManifest = createRunningHubAudioExecutionManifest({
  id: RH_AUDIO_INDEXTTS2_CLONE_EXECUTION_ID,
  label: 'indextts2音色克隆',
  workflowId: '2067594933602705409',
  preset: 'rh-audio-indextts2-clone',
  mapping: {
    refAudioNode: Object.freeze({ nodeId: '56', fieldName: 'audio' }),
    audio2Node: Object.freeze({ nodeId: '63', fieldName: 'audio' }),
    promptNode: Object.freeze({ nodeId: '60', fieldName: 'value' }),
    indexNode: Object.freeze({ nodeId: '66', fieldName: 'index' }),
  },
});
