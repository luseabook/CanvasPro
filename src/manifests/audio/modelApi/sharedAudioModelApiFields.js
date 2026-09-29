function freezeField(_0x12b83d) {
  return Object['freeze'](_0x12b83d);
}
export function createAudioModelApiManifest({
  modelId: _0x3eef2a,
  executionId: _0x4f82a3,
  provider: _0x4a3834,
  displayName: _0xb47046,
  aliases: _0x1f483e,
  icon: _0x4d3d82,
  description: _0x3405af,
  fields: _0x3338c6,
  extensions: _0x40351c,
  inputSlots: _0x4771c4,
  help: _0x2d7baa,
  prompt: _0x2b8415,
  vip: vip = ![],
  async: async = ![],
  cancellable: cancellable = ![],
  modelType: modelType = '',
}) {
  const _0x35ae3f = {};
  _0x40351c && Object['assign'](_0x35ae3f, _0x40351c);
  modelType && (_0x35ae3f['modelType'] = String(modelType));
  const _0xde9a8b = Object['keys'](_0x35ae3f)['length'] > 0x0;
  return Object['freeze']({
    schemaVersion: '1.0',
    modelId: _0x3eef2a,
    provider: _0x4a3834,
    kind: 'audio',
    adapterType: 'modelApi',
    executionId: _0x4f82a3,
    displayName: _0xb47046,
    ...(_0x1f483e ? { aliases: Object['freeze']([...(_0x1f483e || [])]) } : {}),
    icon: _0x4d3d82 || 'images/volcengine.svg',
    description: _0x3405af,
    ...(_0x2d7baa ? { help: Object['freeze'](_0x2d7baa) } : {}),
    ...(_0x2b8415 ? { prompt: Object['freeze'](_0x2b8415) } : {}),
    ...(_0xde9a8b ? { extensions: Object['freeze'](_0x35ae3f) } : {}),
    vip: vip,
    uiPlacement: Object['freeze'](['modelMenu']),
    capabilities: Object['freeze']({
      inputKinds: Object['freeze']((_0x4771c4 && _0x4771c4['allowedKinds']) || ['text', 'audio']),
      outputType: 'audio',
      fixedAssetSlots: Object['freeze'](
        ((_0x4771c4 && _0x4771c4['fixedSlots']) || [])['map']((_0xeaaa7b) => _0xeaaa7b['id']),
      ),
    }),
    inputSlots: _0x4771c4
      ? Object['freeze']({
          allowedKinds: Object['freeze']([...(_0x4771c4['allowedKinds'] || [])]),
          minByKind: Object['freeze']({ ...(_0x4771c4['minByKind'] || { text: 0x1 }) }),
          maxByKind: Object['freeze']({
            image: 0x0,
            video: 0x0,
            audio: 0x1,
            ...(_0x4771c4['maxByKind'] || {}),
          }),
          ...(_0x4771c4['fixedSlots']
            ? {
                fixedSlots: Object['freeze'](
                  _0x4771c4['fixedSlots']['map']((_0x523bea) => Object['freeze']({ ...(_0x523bea || {}) })),
                ),
              }
            : {}),
        })
      : Object['freeze']({
          allowedKinds: Object['freeze'](['text']),
          minByKind: Object['freeze']({ text: 0x1 }),
          maxByKind: Object['freeze']({ image: 0x0, video: 0x0, audio: 0x0 }),
        }),
    uiSchema: Object['freeze']({ fields: Object['freeze'](_0x3338c6 || []) }),
    async: async,
    cancellable: cancellable,
    outputType: 'audio',
  });
}
export function createAudioModelApiExecutionManifest({
  id: _0x2816df,
  provider: _0x5eaaed,
  model: _0x3c594c,
  endpoint: _0x1e9905,
  method: method = 'POST',
  headers: _0x8be54,
  bodyMapping: _0x3d7c02,
  responseMapping: _0xc13db,
  extensions: _0x3cc241,
}) {
  return Object['freeze']({
    schemaVersion: '1.0',
    id: _0x2816df,
    provider: _0x5eaaed,
    kind: 'audio',
    adapterType: 'modelApi',
    endpoint: _0x1e9905,
    method: method,
    model: _0x3c594c,
    ...(_0x3cc241 ? { extensions: Object['freeze']({ ..._0x3cc241 }) } : {}),
    headers: Object['freeze']({ 'Content-Type': 'application/json', ...(_0x8be54 || {}) }),
    bodyMapping: Object['freeze'](_0x3d7c02 || []),
    responseMapping: Object['freeze']({
      taskIdPath: '',
      statusPath: 'code',
      statusSuccessValue: 0x0,
      errorPath: Object['freeze'](['message', 'msg', 'error']),
      base64AudioField: 'data',
      ...(_0xc13db || {}),
    }),
    result: Object['freeze']({ taskIdPath: '', audioPaths: Object['freeze'](['data']) }),
  });
}
export const VOLCENGINE_VOICE_TYPE_FIELD = Object['freeze']({
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
  options: Object['freeze']([
    Object['freeze']({ value: 'zh_female_vv_uranus_bigtts', label: 'Vivi', selectedLabel: 'Vivi' }),
    Object['freeze']({ value: 'zh_female_cancan_uranus_bigtts', label: '灿灿', selectedLabel: '灿灿' }),
    Object['freeze']({ value: 'zh_male_m191_uranus_bigtts', label: '云舟(男)', selectedLabel: '云舟' }),
    Object['freeze']({
      value: 'zh_female_qingxinnvsheng_uranus_bigtts',
      label: '清新女声',
      selectedLabel: '清新',
    }),
    Object['freeze']({
      value: 'zh_female_gaolengyujie_uranus_bigtts',
      label: '高冷御姐',
      selectedLabel: '御姐',
    }),
  ]),
});
export const VOLCENGINE_SPEAKER_ID_FIELD = Object['freeze']({
  id: 'speakerId',
  type: 'text',
  placement: 'mode',
  label: '自定义音色ID',
  defaultValue: '',
  allowEmpty: !![],
  modeField: 'voiceMode',
  filledModeValue: 'custom',
  emptyModeValue: 'default',
  defaultModeValue: 'default',
  customModeValue: 'custom',
  placeholder: '留空使用预设音色',
  description:
    '填写后覆盖预设音色，默认音色将不可选。_uranus_bigtts\x20走\x20TTS\x202.0，_mars_bigtts\x20走\x20TTS\x201.0，其它火山自定义/音色设计音色\x20ID\x20走\x20ICL\x202.0。',
  helpUrl: 'https://console.volcengine.com/speech/new/voices',
  showInfoTip: !![],
});
export const VOLCENGINE_SPEED_FIELD = Object['freeze']({
  id: 'speechRate',
  type: 'slider',
  placement: 'advanced',
  label: '语速',
  defaultValue: 0x0,
  min: -0x32,
  max: 0x64,
  step: 0xa,
  displayValueTemplate: '{value}',
});
export const VOLCENGINE_VOLUME_FIELD = Object['freeze']({
  id: 'loudnessRate',
  type: 'slider',
  placement: 'advanced',
  label: '音量',
  defaultValue: 0x0,
  min: -0x32,
  max: 0x64,
  step: 0xa,
  displayValueTemplate: '{value}',
});
export const VOLCENGINE_PITCH_FIELD = Object['freeze']({
  id: 'pitch',
  type: 'slider',
  placement: 'advanced',
  label: '音调',
  defaultValue: 0x0,
  min: -0xc,
  max: 0xc,
  step: 0x1,
  displayValueTemplate: '{value}',
});
export const VOLCENGINE_FORMAT_FIELD = Object['freeze']({
  id: 'format',
  type: 'segmented',
  placement: 'advanced',
  label: '格式',
  defaultValue: 'mp3',
  options: Object['freeze']([
    Object['freeze']({ value: 'mp3', label: 'MP3', selectedLabel: 'MP3' }),
    Object['freeze']({ value: 'wav', label: 'WAV', selectedLabel: 'WAV' }),
    Object['freeze']({ value: 'pcm', label: 'PCM', selectedLabel: 'PCM' }),
    Object['freeze']({ value: 'ogg_opus', label: 'OGG', selectedLabel: 'OGG' }),
  ]),
});
export const VOLCENGINE_SAMPLE_RATE_FIELD = Object['freeze']({
  id: 'sampleRate',
  type: 'segmented',
  placement: 'advanced',
  label: '采样率',
  defaultValue: 0x5dc0,
  options: Object['freeze']([
    Object['freeze']({ value: 0x1f40, label: '8k', selectedLabel: '8k' }),
    Object['freeze']({ value: 0x3e80, label: '16k', selectedLabel: '16k' }),
    Object['freeze']({ value: 0x5dc0, label: '24k', selectedLabel: '24k' }),
    Object['freeze']({ value: 0xac44, label: '44k', selectedLabel: '44k' }),
  ]),
});
