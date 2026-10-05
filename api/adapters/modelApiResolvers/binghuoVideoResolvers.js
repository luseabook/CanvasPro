import { translateMinimaxH3EditorAssetMentions } from '../minimaxH3Prompt.js';
function appendUrl(list, list2) {
  if (Array['isArray'](list2)) {
    list2['forEach']((value) => appendUrl(list, value));
    return;
  }
  const item =
      list2 && typeof list2 === 'object'
        ? list2['url'] || list2['src'] || list2['fileUrl'] || list2['file_url'] || ''
        : list2,
    key = String(item || '')['trim']();
  if (key && !list['includes'](key)) list['push'](key);
}
function normalizeUrlList(index) {
  const result = [];
  return (appendUrl(result, index), result);
}
function getSlotUrls(enabled, data) {
  if (!enabled || typeof enabled !== 'object') return [];
  return normalizeUrlList(enabled[data]);
}
function collectImages(options, target, list3 = []) {
  const source = [];
  return (
    list3['forEach']((next) => appendUrl(source, getSlotUrls(target, next))),
    appendUrl(source, options),
    source
  );
}
function getPolicy(current) {
  const entry = current?.['extensions']?.['binghuoVideo'];
  return entry && typeof entry === 'object' && !Array['isArray'](entry) ? entry : {};
}
function requireMaximum(record, list4, handle) {
  const count = Number(handle);
  if (!Number['isFinite'](count) || count < 0 || list4['length'] <= count) return;
  throw new Error('便宜渠道当前模型最多支持 ' + count + ' 个' + record);
}
function requireMinimumImages(list5, state) {
  const count2 = Number(state);
  if (!Number['isFinite'](count2) || count2 <= 0 || list5['length'] >= count2) return;
  throw new Error('便宜渠道当前模型至少需要 ' + count2 + ' 张参考图');
}
function getMode(config, scope) {
  const enabled2 = String(scope['modeField'] || '')['trim']();
  if (!enabled2) return '';
  return String(config?.['generationParams']?.[enabled2] ?? config?.[enabled2] ?? '')['trim']();
}
const RAW_FIELD_ALIASES = Object['freeze']({
  aspectRatio: Object['freeze'](['aspectRatio', 'aspect_ratio', 'ratio', 'size']),
  duration: Object['freeze'](['duration', 'seconds']),
  generateAudio: Object['freeze'](['generateAudio', 'generate_audio']),
  resolution: Object['freeze'](['resolution']),
  skipReview: Object['freeze'](['skipReview', 'skip_review']),
});
function readRawFieldValue(input, output) {
  const value2 = RAW_FIELD_ALIASES[output] || [output],
    value3 =
      input?.['generationParams'] &&
      typeof input['generationParams'] === 'object' &&
      !Array['isArray'](input['generationParams'])
        ? input['generationParams']
        : {};
  for (const value4 of value2) {
    if (Object['prototype']['hasOwnProperty']['call'](value3, value4)) return value3[value4];
  }
  for (const value5 of value2) {
    if (Object['prototype']['hasOwnProperty']['call'](input || {}, value5)) return input[value5];
  }
  return undefined;
}
function getFieldOptionValues(value6) {
  return (Array['isArray'](value6?.['options']) ? value6['options'] : [])['map']((el) =>
    el && typeof el === 'object' && !Array['isArray'](el) ? el['value'] : el,
  );
}
function isSameOptionValue(value7, value8) {
  const value9 = Number(value7),
    value10 = Number(value8);
  if (
    String(value7)['trim']() !== '' &&
    String(value8)['trim']() !== '' &&
    Number['isFinite'](value9) &&
    Number['isFinite'](value10)
  )
    return value9 === value10;
  return (
    String(value7 ?? '')
      ['trim']()
      ['toLowerCase']() ===
    String(value8 ?? '')
      ['trim']()
      ['toLowerCase']()
  );
}
function validateRawFieldValue(value11, value12, value13) {
  const enabled3 = String(value12?.['id'] || '')['trim']();
  if (!enabled3) return;
  const rawFieldValue = readRawFieldValue(value11, enabled3);
  if (rawFieldValue === undefined || rawFieldValue === null || String(rawFieldValue)['trim']() === '') return;
  const value14 = String(value12?.['label'] || enabled3)['trim'](),
    value15 = String(value12?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    list6 = getFieldOptionValues(value12);
  if (list6['length'] > 0 && !list6['some']((value16) => isSameOptionValue(value16, rawFieldValue)))
    throw new Error(
      '便宜渠道 ' +
        value13 +
        ' 的' +
        value14 +
        '不支持“' +
        rawFieldValue +
        '”，可选：' +
        list6['join'](' / '),
    );
  if (value15 === 'toggle') {
    const value17 = String(rawFieldValue)['trim']()['toLowerCase']();
    if (
      rawFieldValue !== !![] &&
      rawFieldValue !== ![] &&
      !['true', 'false', '1', '0', 'yes', 'no', 'on', 'off']['includes'](value17)
    )
      throw new Error('便宜渠道 ' + value13 + ' 的' + value14 + '只能开启或关闭');
    return;
  }
  if (value15 !== 'slider' || list6['length'] > 0) return;
  const value18 = Number(rawFieldValue),
    value19 = Number(value12?.['min']),
    value20 = Number(value12?.['max']),
    count3 = Number(value12?.['step']);
  if (!Number['isFinite'](value18))
    throw new Error('便宜渠道 ' + value13 + ' 的' + value14 + '必须是数字');
  if (Number['isFinite'](value19) && value18 < value19)
    throw new Error('便宜渠道 ' + value13 + ' 的' + value14 + '不能小于 ' + value19);
  if (Number['isFinite'](value20) && value18 > value20)
    throw new Error('便宜渠道 ' + value13 + ' 的' + value14 + '不能大于 ' + value20);
  if (
    Number['isFinite'](count3) &&
    count3 > 0 &&
    Number['isFinite'](value19) &&
    Math['abs']((value18 - value19) / count3 - Math['round']((value18 - value19) / count3)) > 1e-9
  )
    throw new Error('便宜渠道 ' + value13 + ' 的' + value14 + '必须按 ' + count3 + ' 递增');
}
function validateRawUiSchemaParams(value21, value22) {
  const list7 = Array['isArray'](value22?.['uiSchema']?.['fields']) ? value22['uiSchema']['fields'] : [],
    value23 = String(value22?.['displayName'] || value22?.['modelId'] || '当前模型')['trim']();
  list7['forEach']((value24) => validateRawFieldValue(value21, value24, value23));
}
function normalizeRawInputList(value25) {
  return (Array['isArray'](value25) ? value25 : [value25])
    ['map']((value26) => String(value26 || '')['trim']())
    ['filter'](Boolean);
}
function collectRawInputUrls(value27, value28) {
  if (value28 === 'image') {
    const args = Object['values'](
        value27?.['inputUrlsBySlot'] &&
          typeof value27['inputUrlsBySlot'] === 'object' &&
          !Array['isArray'](value27['inputUrlsBySlot'])
          ? value27['inputUrlsBySlot']
          : {},
      )['flatMap'](normalizeRawInputList),
      value29 = [
        ...args,
        ...normalizeRawInputList(value27?.['images']),
        ...normalizeRawInputList(value27?.['inputUrls']),
      ];
    return Array['from'](new Set(value29));
  }
  if (value28 === 'video')
    return Array['from'](
      new Set([
        ...normalizeRawInputList(value27?.['videoUrl']),
        ...normalizeRawInputList(value27?.['videos']),
        ...normalizeRawInputList(value27?.['videoUrls']),
        ...normalizeRawInputList(value27?.['reference_videos']),
      ]),
    );
  return Array['from'](
    new Set([
      ...normalizeRawInputList(value27?.['audioUrl']),
      ...normalizeRawInputList(value27?.['audios']),
      ...normalizeRawInputList(value27?.['audioUrls']),
      ...normalizeRawInputList(value27?.['reference_audios']),
    ]),
  );
}
function collectRawActiveImageUrls(value30, value31, value32) {
  if (value32 !== !![]) return collectRawInputUrls(value30, 'image');
  const value33 =
      value30?.['inputUrlsBySlot'] &&
      typeof value30['inputUrlsBySlot'] === 'object' &&
      !Array['isArray'](value30['inputUrlsBySlot'])
        ? value30['inputUrlsBySlot']
        : {},
    map = new Set(Object['values'](value33)['flatMap'](normalizeRawInputList)),
    args2 = [...normalizeRawInputList(value30?.['images']), ...normalizeRawInputList(value30?.['inputUrls'])][
      'filter'
    ]((value34) => !map['has'](value34)),
    list8 = value31 === 'frames' ? ['firstFrame', 'lastFrame'] : ['referenceImage'];
  return Array['from'](
    new Set([...list8['flatMap']((value35) => normalizeRawInputList(value33[value35])), ...args2]),
  );
}
function validateRawInputCounts(value36, image) {
  const value37 =
      image['supportsFrames'] === !![]
        ? String(readRawFieldValue(value36, image['modeField']) || 'reference')
            ['trim']()
            ['toLowerCase']()
        : 'reference',
    value38 =
      value37 === 'frames'
        ? { image: 2, video: 0, audio: 0 }
        : { image: image['maxImages'], video: image['maxVideos'], audio: image['maxAudios'] };
  for (const [value39, value40] of [
    ['image', '参考图'],
    ['video', '参考视频'],
    ['audio', '参考音频'],
  ]) {
    const list9 =
        value39 === 'image'
          ? collectRawActiveImageUrls(value36, value37, image['supportsFrames'])
          : collectRawInputUrls(value36, value39),
      value41 = Number(value38[value39]);
    if (Number['isFinite'](value41) && list9['length'] > value41)
      throw new Error(
        '便宜渠道当前模型最多支持 ' +
          value41 +
          ' 个' +
          value40 +
          '，当前传入 ' +
          list9['length'] +
          ' 个，请删减后重试',
      );
  }
}
function validateAssetRefs(value42, value43, value44, value45, value46) {
  const map2 = new Set(Array['isArray'](value42['allowAssetRefKinds']) ? value42['allowAssetRefKinds'] : []),
    value47 = value46 && typeof value46 === 'object' ? value46 : {},
    value48 = {
      image: normalizeUrlList([
        value43,
        value47['firstFrame'],
        value47['lastFrame'],
        value47['referenceImage'],
      ]),
      video: normalizeUrlList([value44, value47['referenceVideo']]),
      audio: normalizeUrlList([value45, value47['referenceAudio']]),
    };
  for (const [value49, list10] of Object['entries'](value48)) {
    if (map2['has'](value49)) continue;
    if (!list10['some']((value50) => /^asset:\/\//i['test'](value50))) continue;
    throw new Error(
      '便宜渠道当前模型不支持该 asset:// 预审素材引用；请提供原始素材，系统会先上传到 /v1/assets/uploads',
    );
  }
}
function applySeedanceInputs({
  body: body,
  payload: payload2,
  policy: policy,
  inputImages: inputImages2,
  inputVideos: inputVideos2,
  inputAudios: inputAudios2,
  finalUrlsBySlot: finalUrlsBySlot2,
}) {
  const list11 = normalizeUrlList(inputVideos2),
    list12 = normalizeUrlList(inputAudios2),
    list13 = normalizeUrlList(inputImages2);
  (requireMaximum('参考视频', list11, policy['maxVideos']),
    requireMaximum('参考音频', list12, policy['maxAudios']),
    delete body['images'],
    delete body['start_frame'],
    delete body['end_frame'],
    delete body['reference_videos'],
    delete body['reference_audios']);
  const value51 = policy['supportsFrames'] === !![] ? getMode(payload2, policy) || 'reference' : 'reference';
  if (value51 === 'frames') {
    const args3 = getSlotUrls(finalUrlsBySlot2, 'firstFrame'),
      args4 = getSlotUrls(finalUrlsBySlot2, 'lastFrame'),
      map3 = new Set([...args3, ...args4, ...getSlotUrls(finalUrlsBySlot2, 'referenceImage')]),
      value52 = list13['filter']((value53) => !map3['has'](value53)),
      enabled4 = args3[0] || value52[0] || '',
      value54 = args4[0] || value52[1] || '';
    (requireMaximum('首帧', args3, 1),
      requireMaximum('尾帧', args4, 1),
      requireMaximum('参考视频', list11, 0),
      requireMaximum('参考音频', list12, 0));
    if (!enabled4) throw new Error('便宜渠道首尾帧模式至少需要 1 张首帧图片');
    body['start_frame'] = [enabled4];
    if (value54) body['end_frame'] = [value54];
    return body;
  }
  const map4 = new Set(getSlotUrls(finalUrlsBySlot2, 'firstFrame')),
    map5 = new Set(getSlotUrls(finalUrlsBySlot2, 'lastFrame')),
    list14 = collectImages([], finalUrlsBySlot2, ['referenceImage']);
  (list13['forEach']((value55) => {
    !map4['has'](value55) && !map5['has'](value55) && appendUrl(list14, value55);
  }),
    requireMinimumImages(list14, policy['minImages']),
    requireMaximum('参考图', list14, policy['maxImages']));
  if (policy['audioRequiresImage'] === !![] && list12['length'] > 0 && list14['length'] === 0)
    throw new Error('便宜渠道当前模型使用参考音频时至少需要 1 张参考图');
  if (
    policy['audioRequiresVisual'] === !![] &&
    list12['length'] > 0 &&
    list14['length'] === 0 &&
    list11['length'] === 0
  )
    throw new Error('便宜渠道当前模型使用参考音频时至少需要 1 张参考图或 1 个参考视频');
  if (list14['length']) body['images'] = list14;
  if (list11['length']) body['reference_videos'] = list11;
  if (list12['length']) body['reference_audios'] = list12;
  return body;
}
function applyHappyHorseInputs({
  body: body2,
  payload: payload3,
  policy: policy2,
  inputImages: inputImages3,
  inputVideos: inputVideos3,
  inputAudios: inputAudios3,
  finalUrlsBySlot: finalUrlsBySlot3,
}) {
  const mode = getMode(payload3, policy2) || 'auto',
    list15 = collectImages(inputImages3, finalUrlsBySlot3, ['firstFrame', 'referenceImage']),
    urlList = normalizeUrlList(inputVideos3),
    list16 = normalizeUrlList(inputAudios3);
  (requireMaximum('参考图', list15, policy2['maxImages']),
    requireMaximum('参考视频', urlList, policy2['maxVideos']),
    requireMaximum('参考音频', list16, policy2['maxAudios']));
  if ((mode === 'image' || mode === 'reference') && list15['length'] === 0)
    throw new Error('便宜渠道 HappyHorse 图像模式需要参考图');
  if (list15['length']) body2['images'] = list15;
  else delete body2['images'];
  if (list16['length']) body2['reference_audios'] = list16;
  else delete body2['reference_audios'];
  return (delete body2['reference_videos'], body2);
}
export function binghuoVideo({
  currentBody: currentBody,
  payload: payload = {},
  rawPayload: rawPayload = {},
  modelManifest: modelManifest = null,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  executionManifest: executionManifest = null,
}) {
  validateRawUiSchemaParams(rawPayload, modelManifest);
  const body3 = { ...currentBody },
    policy3 = getPolicy(executionManifest);
  (policy3['family'] === 'minimax-h3' || policy3['component'] === 'minimaxH3') &&
    (body3['prompt'] = translateMinimaxH3EditorAssetMentions(body3['prompt']));
  (validateRawInputCounts(rawPayload, policy3),
    validateAssetRefs(policy3, inputImages, inputVideos, inputAudios, finalUrlsBySlot));
  if (policy3['component'] === 'seedance2')
    return applySeedanceInputs({
      body: body3,
      payload: payload,
      policy: policy3,
      inputImages: inputImages,
      inputVideos: inputVideos,
      inputAudios: inputAudios,
      finalUrlsBySlot: finalUrlsBySlot,
    });
  if (policy3['component'] === 'happyHorse')
    return applyHappyHorseInputs({
      body: body3,
      payload: payload,
      policy: policy3,
      inputImages: inputImages,
      inputVideos: inputVideos,
      inputAudios: inputAudios,
      finalUrlsBySlot: finalUrlsBySlot,
    });
  const list17 = normalizeUrlList(inputImages),
    list18 = normalizeUrlList(inputVideos),
    list19 = normalizeUrlList(inputAudios);
  (requireMinimumImages(list17, policy3['minImages']),
    requireMaximum('参考图', list17, policy3['maxImages']),
    requireMaximum('参考视频', list18, policy3['maxVideos']),
    requireMaximum('参考音频', list19, policy3['maxAudios']));
  if (list17['length']) body3['images'] = list17;
  else delete body3['images'];
  if (list18['length']) body3['reference_videos'] = list18;
  else delete body3['reference_videos'];
  if (list19['length']) body3['reference_audios'] = list19;
  else delete body3['reference_audios'];
  return (delete body3['start_frame'], delete body3['end_frame'], body3);
}
