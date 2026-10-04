import {
  audioText,
  audioTextarea,
  audioSelect,
  audioSlider,
  audioSlot,
  createRunningHubAudioCatalogEntry,
  paramMapping,
  slotMapping,
  constantMapping,
  RH_AUDIO_HELPER_IDS,
} from './runningHubAudioCatalogShared.js';
const COUNT = audioSelect('count', '生成数量', [0x1, 0x2, 0x3], 0x2, {
    placement: 'batch',
    description: '一次请求生成 1–3 首，按生成数量计费。',
    showInfoTip: !![],
  }),
  STYLE = audioTextarea('stylePrompt', '音乐风格', '描述曲风、情绪、乐器和人声，最多 1024 字符。', {
    maxLength: 0x400,
  }),
  idField = (value, item) =>
    audioText(value, item, '可选。已有 Mureka 素材 ID 可直接复用；连接对应参考音频时自动处理。', {
      maxLength: 0x40,
    }),
  prepare = (slot, targetField, purpose, executionId = ![]) => ({
    executionId: executionId ? RH_AUDIO_HELPER_IDS['murekaClone'] : RH_AUDIO_HELPER_IDS['murekaUpload'],
    slot: slot,
    inputField: 'fileUrl',
    targetField: targetField,
    ...(purpose ? { purpose: purpose } : {}),
    resultType: 'id',
  }),
  fileRules = { audioExtensions: ['mp3', 'm4a'], maxAudioBytes: 0xa * 0x400 * 0x400 };
export const runningHubMurekaAudioEntries = Object['freeze']([
  ...[
    ['v7.6', 0x1d7ef044],
    ['v8', 0x1d7ef045],
    ['v9', 0x1d7ef043],
  ]['map'](([key, docId], index) =>
    createRunningHubAudioCatalogEntry({
      id: 'mureka-' + key + '-bgm',
      name: 'Mureka ' + key + ' 伴奏生成',
      endpoint: '/openapi/v2/mureka-ai/mureka-' + key + '/generate-bgm',
      docId: docId,
      order: 0xf0 + index,
      promptField: 'prompt',
      promptRequired: ![],
      promptMaxLength: 0x400,
      promptPlaceholder: '描述伴奏风格，或连接一段参考伴奏（二选一）',
      slots: [audioSlot('instrumental', '参考伴奏')],
      fields: [COUNT, idField('instrumentalId', '伴奏素材 ID')],
      mapping: [paramMapping('n', 'count'), paramMapping('instrumentalId'), constantMapping('stream', ![])],
      rules: { ...fileRules, controlMode: 'murekaBgm' },
      preparations: [prepare('instrumental', 'instrumentalId', 'instrumental')],
    }),
  ),
  ...[
    ['v7.6', 0x1d7ef046],
    ['o2', 0x1d7ef047],
    ['v8', 0x1d7ef048],
    ['v9', 0x1d7ef049],
  ]['map'](([result, docId2], data) => {
    const supportsVoice = result !== 'o2';
    return createRunningHubAudioCatalogEntry({
      id: 'mureka-' + result + '-song',
      name: 'Mureka\x20' + result + ' 歌曲生成',
      endpoint: '/openapi/v2/mureka-ai/mureka-' + result + '/generate-song',
      docId: docId2,
      order: 0xfa + data,
      promptField: 'lyrics',
      promptMaxLength: 0xbb8,
      promptPlaceholder: '输入歌词，支持 [Verse]、[Chorus] 等段落标记，最多 3000 字符',
      slots: [
        audioSlot('reference', '参考歌曲'),
        ...(supportsVoice ? [audioSlot('vocal', '参考人声'), audioSlot('melody', '参考旋律')] : []),
      ],
      fields: [
        COUNT,
        STYLE,
        idField('referenceId', '歌曲素材 ID'),
        ...(supportsVoice ? [idField('vocalId', '人声音色\x20ID'), idField('melodyId', '旋律素材 ID')] : []),
      ],
      mapping: [
        paramMapping('n', 'count'),
        paramMapping('prompt', 'stylePrompt'),
        paramMapping('referenceId'),
        ...(supportsVoice
          ? [paramMapping('vocalId'), paramMapping('melodyId'), constantMapping('stream', ![])]
          : []),
      ],
      rules: { ...fileRules, controlMode: 'murekaSong', supportsVoice: supportsVoice },
      preparations: [
        prepare('reference', 'referenceId', 'reference'),
        ...(supportsVoice
          ? [prepare('vocal', 'vocalId', null, !![]), prepare('melody', 'melodyId', 'melody')]
          : []),
      ],
      description: supportsVoice
        ? '参考人声会自动创建 Mureka 音色；参考旋律与其他控制项互斥。'
        : '支持歌词、风格或参考歌曲。此版本不支持独立人声和旋律参考。',
    });
  }),
  ...[
    ['v7.6', 0x1d7ef04c],
    ['v8', 0x1d7ef04d],
  ]['map'](([options, docId3], target) =>
    createRunningHubAudioCatalogEntry({
      id: 'mureka-' + options + '-extend',
      name: 'Mureka ' + options + ' 短歌延长',
      endpoint: '/openapi/v2/mureka-ai/mureka-' + options + '/extend-song',
      docId: docId3,
      order: 0x104 + target,
      promptField: 'lyrics',
      promptMaxLength: 0xbb8,
      promptPlaceholder: '输入延长部分的歌词，最多 3000 字符',
      slots: [audioSlot('sourceAudio', '待延长歌曲', !![])],
      fields: [
        audioSlider('extendAt', '延长起点（秒）', 0x8, 0x1a4, 0x8, 0.001),
        ...(options === 'v8'
          ? [
              audioSelect(
                'extendType',
                '延长方向',
                [
                  { value: 'tail', label: '尾部延长' },
                  { value: 'head', label: '头部延长' },
                ],
                'tail',
                { placement: 'mode' },
              ),
            ]
          : []),
      ],
      mapping: [
        slotMapping('fileUrl', 'sourceAudio'),
        paramMapping('extendAt', 'extendAt', { transform: 'secondsToMilliseconds' }),
        ...(options === 'v8' ? [paramMapping('extendType')] : []),
      ],
      rules: { audioExtensions: ['mp3', 'm4a'] },
    }),
  ),
]);
