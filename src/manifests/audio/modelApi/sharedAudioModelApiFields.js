function freezeField(value) {
  return Object.freeze(value);
}
export function createAudioModelApiManifest({
  modelId: modelId,
  executionId: executionId,
  provider: provider,
  displayName: displayName,
  aliases: aliases,
  icon: icon,
  description: description,
  fields: fields,
  extensions: extensions,
  inputSlots: inputSlots,
  help: help,
  prompt: prompt,
  vip: vip = false,
  async: async = false,
  cancellable: cancellable = false,
  modelType: modelType = '',
}) {
  const item = {};
  extensions && Object.assign(item, extensions);
  modelType && (item.modelType = String(modelType));
  const key = Object.keys(item).length > 0;
  return Object.freeze({
    schemaVersion: '1.0',
    modelId: modelId,
    provider: provider,
    kind: 'audio',
    adapterType: 'modelApi',
    executionId: executionId,
    displayName: displayName,
    ...(aliases ? { aliases: Object.freeze([...(aliases || [])]) } : {}),
    icon: icon || 'images/volcengine.svg',
    description: description,
    ...(help ? { help: Object.freeze(help) } : {}),
    ...(prompt ? { prompt: Object.freeze(prompt) } : {}),
    ...(key ? { extensions: Object.freeze(item) } : {}),
    vip: vip,
    uiPlacement: Object.freeze(['modelMenu']),
    capabilities: Object.freeze({
      inputKinds: Object.freeze((inputSlots && inputSlots.allowedKinds) || ['text', 'audio']),
      outputType: 'audio',
      fixedAssetSlots: Object.freeze(
        ((inputSlots && inputSlots.fixedSlots) || []).map((index) => index.id),
      ),
    }),
    inputSlots: inputSlots
      ? Object.freeze({
          allowedKinds: Object.freeze([...(inputSlots.allowedKinds || [])]),
          minByKind: Object.freeze({ ...(inputSlots.minByKind || { text: 1 }) }),
          maxByKind: Object.freeze({
            image: 0,
            video: 0,
            audio: 1,
            ...(inputSlots.maxByKind || {}),
          }),
          ...(inputSlots.fixedSlots
            ? {
                fixedSlots: Object.freeze(
                  inputSlots.fixedSlots.map((result) => Object.freeze({ ...(result || {}) })),
                ),
              }
            : {}),
        })
      : Object.freeze({
          allowedKinds: Object.freeze(['text']),
          minByKind: Object.freeze({ text: 1 }),
          maxByKind: Object.freeze({ image: 0, video: 0, audio: 0 }),
        }),
    uiSchema: Object.freeze({ fields: Object.freeze(fields || []) }),
    async: async,
    cancellable: cancellable,
    outputType: 'audio',
  });
}
export function createAudioModelApiExecutionManifest({
  id: id,
  provider: provider2,
  model: model,
  endpoint: endpoint,
  method: method = 'POST',
  headers: headers,
  bodyMapping: bodyMapping,
  responseMapping: responseMapping,
  extensions: extensions2,
}) {
  return Object.freeze({
    schemaVersion: '1.0',
    id: id,
    provider: provider2,
    kind: 'audio',
    adapterType: 'modelApi',
    endpoint: endpoint,
    method: method,
    model: model,
    ...(extensions2 ? { extensions: Object.freeze({ ...extensions2 }) } : {}),
    headers: Object.freeze({ 'Content-Type': 'application/json', ...(headers || {}) }),
    bodyMapping: Object.freeze(bodyMapping || []),
    responseMapping: Object.freeze({
      taskIdPath: '',
      statusPath: 'code',
      statusSuccessValue: 0,
      errorPath: Object.freeze(['message', 'msg', 'error']),
      base64AudioField: 'data',
      ...(responseMapping || {}),
    }),
    result: Object.freeze({ taskIdPath: '', audioPaths: Object.freeze(['data']) }),
  });
}
export const VOLCENGINE_VOICE_TYPE_FIELD = Object.freeze({
  id: 'voiceType',
  type: 'segmented',
  variant: 'voiceQualityRatio',
  placement: 'mode',
  label: '默认音色',
  compositeWith: 'speakerId',
  modeField: 'voiceMode',
  modeValue: 'default',
  defaultModeValue: 'default',
  customModeValue: 'custom',
  defaultValue: 'zh_female_vv_uranus_bigtts',
  options: Object.freeze([
    Object.freeze({ value: 'zh_female_vv_uranus_bigtts', label: 'Vivi', selectedLabel: 'Vivi' }),
    Object.freeze({ value: 'zh_female_cancan_uranus_bigtts', label: '灿灿', selectedLabel: '灿灿' }),
    Object.freeze({ value: 'zh_male_m191_uranus_bigtts', label: '云舟(男)', selectedLabel: '云舟' }),
    Object.freeze({
      value: 'zh_female_qingxinnvsheng_uranus_bigtts',
      label: '清新女声',
      selectedLabel: '清新',
    }),
    Object.freeze({
      value: 'zh_female_gaolengyujie_uranus_bigtts',
      label: '高冷御姐',
      selectedLabel: '御姐',
    }),
  ]),
});
export const VOLCENGINE_SPEAKER_ID_FIELD = Object.freeze({
  id: 'speakerId',
  type: 'text',
  placement: 'mode',
  label: '自定义音色ID',
  defaultValue: '',
  allowEmpty: true,
  modeField: 'voiceMode',
  filledModeValue: 'custom',
  emptyModeValue: 'default',
  defaultModeValue: 'default',
  customModeValue: 'custom',
  placeholder: '留空使用预设音色',
  description:
    '填写后覆盖预设音色，默认音色将不可选。_uranus_bigtts 走 TTS 2.0，_mars_bigtts 走 TTS 1.0，其它火山自定义/音色设计音色 ID 走 ICL 2.0。',
  helpUrl: 'https://console.volcengine.com/speech/new/voices',
  showInfoTip: true,
});
export const VOLCENGINE_SPEED_FIELD = Object.freeze({
  id: 'speechRate',
  type: 'slider',
  placement: 'advanced',
  label: '语速',
  defaultValue: 0,
  min: -50,
  max: 100,
  step: 10,
  displayValueTemplate: '{value}',
});
export const VOLCENGINE_VOLUME_FIELD = Object.freeze({
  id: 'loudnessRate',
  type: 'slider',
  placement: 'advanced',
  label: '音量',
  defaultValue: 0,
  min: -50,
  max: 100,
  step: 10,
  displayValueTemplate: '{value}',
});
export const VOLCENGINE_PITCH_FIELD = Object.freeze({
  id: 'pitch',
  type: 'slider',
  placement: 'advanced',
  label: '音调',
  defaultValue: 0,
  min: -12,
  max: 12,
  step: 1,
  displayValueTemplate: '{value}',
});
export const VOLCENGINE_FORMAT_FIELD = Object.freeze({
  id: 'format',
  type: 'segmented',
  placement: 'advanced',
  label: '格式',
  defaultValue: 'mp3',
  options: Object.freeze([
    Object.freeze({ value: 'mp3', label: 'MP3', selectedLabel: 'MP3' }),
    Object.freeze({ value: 'wav', label: 'WAV', selectedLabel: 'WAV' }),
    Object.freeze({ value: 'pcm', label: 'PCM', selectedLabel: 'PCM' }),
    Object.freeze({ value: 'ogg_opus', label: 'OGG', selectedLabel: 'OGG' }),
  ]),
});
export const VOLCENGINE_SAMPLE_RATE_FIELD = Object.freeze({
  id: 'sampleRate',
  type: 'segmented',
  placement: 'advanced',
  label: '采样率',
  defaultValue: 24000,
  options: Object.freeze([
    Object.freeze({ value: 8000, label: '8k', selectedLabel: '8k' }),
    Object.freeze({ value: 16000, label: '16k', selectedLabel: '16k' }),
    Object.freeze({ value: 24000, label: '24k', selectedLabel: '24k' }),
    Object.freeze({ value: 44100, label: '44k', selectedLabel: '44k' }),
  ]),
});
