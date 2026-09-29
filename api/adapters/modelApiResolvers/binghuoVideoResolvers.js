import { translateMinimaxH3EditorAssetMentions } from '../minimaxH3Prompt.js';
function appendUrl(_0x19a916, _0x3cf588) {
  if (Array['isArray'](_0x3cf588)) {
    _0x3cf588['forEach']((_0xc16f97) => appendUrl(_0x19a916, _0xc16f97));
    return;
  }
  const _0x5d57eb =
      _0x3cf588 && typeof _0x3cf588 === 'object'
        ? _0x3cf588['url'] || _0x3cf588['src'] || _0x3cf588['fileUrl'] || _0x3cf588['file_url'] || ''
        : _0x3cf588,
    _0x981724 = String(_0x5d57eb || '')['trim']();
  if (_0x981724 && !_0x19a916['includes'](_0x981724)) _0x19a916['push'](_0x981724);
}
function normalizeUrlList(_0x38a723) {
  const _0x3dabea = [];
  return (appendUrl(_0x3dabea, _0x38a723), _0x3dabea);
}
function getSlotUrls(_0x591a7b, _0x19bbed) {
  if (!_0x591a7b || typeof _0x591a7b !== 'object') return [];
  return normalizeUrlList(_0x591a7b[_0x19bbed]);
}
function collectImages(_0x26a063, _0x31e1d0, _0x4aea88 = []) {
  const _0x42ccdc = [];
  return (
    _0x4aea88['forEach']((_0x83a653) => appendUrl(_0x42ccdc, getSlotUrls(_0x31e1d0, _0x83a653))),
    appendUrl(_0x42ccdc, _0x26a063),
    _0x42ccdc
  );
}
function getPolicy(_0x3c8a73) {
  const _0x15d11c = _0x3c8a73?.['extensions']?.['binghuoVideo'];
  return _0x15d11c && typeof _0x15d11c === 'object' && !Array['isArray'](_0x15d11c) ? _0x15d11c : {};
}
function requireMaximum(_0x2b9ef2, _0x4f58e1, _0x79e075) {
  const _0x29a3b1 = Number(_0x79e075);
  if (!Number['isFinite'](_0x29a3b1) || _0x29a3b1 < 0x0 || _0x4f58e1['length'] <= _0x29a3b1) return;
  throw new Error('便宜渠道当前模型最多支持\x20' + _0x29a3b1 + '\x20个' + _0x2b9ef2);
}
function requireMinimumImages(_0x1f0bed, _0x2e6f7e) {
  const _0x166ecc = Number(_0x2e6f7e);
  if (!Number['isFinite'](_0x166ecc) || _0x166ecc <= 0x0 || _0x1f0bed['length'] >= _0x166ecc) return;
  throw new Error('便宜渠道当前模型至少需要 ' + _0x166ecc + ' 张参考图');
}
function getMode(_0x57d9a3, _0x38dbc1) {
  const _0x189d63 = String(_0x38dbc1['modeField'] || '')['trim']();
  if (!_0x189d63) return '';
  return String(_0x57d9a3?.['generationParams']?.[_0x189d63] ?? _0x57d9a3?.[_0x189d63] ?? '')['trim']();
}
const RAW_FIELD_ALIASES = Object['freeze']({
  aspectRatio: Object['freeze'](['aspectRatio', 'aspect_ratio', 'ratio', 'size']),
  duration: Object['freeze'](['duration', 'seconds']),
  generateAudio: Object['freeze'](['generateAudio', 'generate_audio']),
  resolution: Object['freeze'](['resolution']),
  skipReview: Object['freeze'](['skipReview', 'skip_review']),
});
function readRawFieldValue(_0x332421, _0x1f024d) {
  const _0x523e60 = RAW_FIELD_ALIASES[_0x1f024d] || [_0x1f024d],
    _0x3c0193 =
      _0x332421?.['generationParams'] &&
      typeof _0x332421['generationParams'] === 'object' &&
      !Array['isArray'](_0x332421['generationParams'])
        ? _0x332421['generationParams']
        : {};
  for (const _0x3938e5 of _0x523e60) {
    if (Object['prototype']['hasOwnProperty']['call'](_0x3c0193, _0x3938e5)) return _0x3c0193[_0x3938e5];
  }
  for (const _0x568b7b of _0x523e60) {
    if (Object['prototype']['hasOwnProperty']['call'](_0x332421 || {}, _0x568b7b))
      return _0x332421[_0x568b7b];
  }
  return undefined;
}
function getFieldOptionValues(_0x5481e1) {
  return (Array['isArray'](_0x5481e1?.['options']) ? _0x5481e1['options'] : [])['map']((_0x2ea11e) =>
    _0x2ea11e && typeof _0x2ea11e === 'object' && !Array['isArray'](_0x2ea11e)
      ? _0x2ea11e['value']
      : _0x2ea11e,
  );
}
function isSameOptionValue(_0x1c57a0, _0x3afc87) {
  const _0x501ade = Number(_0x1c57a0),
    _0x5ddc1d = Number(_0x3afc87);
  if (
    String(_0x1c57a0)['trim']() !== '' &&
    String(_0x3afc87)['trim']() !== '' &&
    Number['isFinite'](_0x501ade) &&
    Number['isFinite'](_0x5ddc1d)
  )
    return _0x501ade === _0x5ddc1d;
  return (
    String(_0x1c57a0 ?? '')
      ['trim']()
      ['toLowerCase']() ===
    String(_0x3afc87 ?? '')
      ['trim']()
      ['toLowerCase']()
  );
}
function validateRawFieldValue(_0x30f119, _0x30162c, _0x21f72c) {
  const _0x240d58 = String(_0x30162c?.['id'] || '')['trim']();
  if (!_0x240d58) return;
  const _0x539da3 = readRawFieldValue(_0x30f119, _0x240d58);
  if (_0x539da3 === undefined || _0x539da3 === null || String(_0x539da3)['trim']() === '') return;
  const _0x3d0c33 = String(_0x30162c?.['label'] || _0x240d58)['trim'](),
    _0x1098f1 = String(_0x30162c?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0xbc4ee6 = getFieldOptionValues(_0x30162c);
  if (_0xbc4ee6['length'] > 0x0 && !_0xbc4ee6['some']((_0x5c75c4) => isSameOptionValue(_0x5c75c4, _0x539da3)))
    throw new Error(
      '便宜渠道\x20' +
        _0x21f72c +
        '\x20的' +
        _0x3d0c33 +
        '不支持“' +
        _0x539da3 +
        '”，可选：' +
        _0xbc4ee6['join'](' / '),
    );
  if (_0x1098f1 === 'toggle') {
    const _0x18abc2 = String(_0x539da3)['trim']()['toLowerCase']();
    if (
      _0x539da3 !== !![] &&
      _0x539da3 !== ![] &&
      !['true', 'false', '1', '0', 'yes', 'no', 'on', 'off']['includes'](_0x18abc2)
    )
      throw new Error('便宜渠道 ' + _0x21f72c + '\x20的' + _0x3d0c33 + '只能开启或关闭');
    return;
  }
  if (_0x1098f1 !== 'slider' || _0xbc4ee6['length'] > 0x0) return;
  const _0x3c6350 = Number(_0x539da3),
    _0x42d1d8 = Number(_0x30162c?.['min']),
    _0x3c3ae4 = Number(_0x30162c?.['max']),
    _0x5b319a = Number(_0x30162c?.['step']);
  if (!Number['isFinite'](_0x3c6350))
    throw new Error('便宜渠道 ' + _0x21f72c + '\x20的' + _0x3d0c33 + '必须是数字');
  if (Number['isFinite'](_0x42d1d8) && _0x3c6350 < _0x42d1d8)
    throw new Error('便宜渠道 ' + _0x21f72c + '\x20的' + _0x3d0c33 + '不能小于 ' + _0x42d1d8);
  if (Number['isFinite'](_0x3c3ae4) && _0x3c6350 > _0x3c3ae4)
    throw new Error('便宜渠道 ' + _0x21f72c + '\x20的' + _0x3d0c33 + '不能大于 ' + _0x3c3ae4);
  if (
    Number['isFinite'](_0x5b319a) &&
    _0x5b319a > 0x0 &&
    Number['isFinite'](_0x42d1d8) &&
    Math['abs']((_0x3c6350 - _0x42d1d8) / _0x5b319a - Math['round']((_0x3c6350 - _0x42d1d8) / _0x5b319a)) >
      1e-9
  )
    throw new Error('便宜渠道\x20' + _0x21f72c + '\x20的' + _0x3d0c33 + '必须按\x20' + _0x5b319a + ' 递增');
}
function validateRawUiSchemaParams(_0x25b4ca, _0x10bba2) {
  const _0x1998f7 = Array['isArray'](_0x10bba2?.['uiSchema']?.['fields'])
      ? _0x10bba2['uiSchema']['fields']
      : [],
    _0xc8dec5 = String(_0x10bba2?.['displayName'] || _0x10bba2?.['modelId'] || '当前模型')['trim']();
  _0x1998f7['forEach']((_0x5ba297) => validateRawFieldValue(_0x25b4ca, _0x5ba297, _0xc8dec5));
}
function normalizeRawInputList(_0x249398) {
  return (Array['isArray'](_0x249398) ? _0x249398 : [_0x249398])
    ['map']((_0x4d7354) => String(_0x4d7354 || '')['trim']())
    ['filter'](Boolean);
}
function collectRawInputUrls(_0x37a549, _0x1cc2f7) {
  if (_0x1cc2f7 === 'image') {
    const _0x2a2721 = Object['values'](
        _0x37a549?.['inputUrlsBySlot'] &&
          typeof _0x37a549['inputUrlsBySlot'] === 'object' &&
          !Array['isArray'](_0x37a549['inputUrlsBySlot'])
          ? _0x37a549['inputUrlsBySlot']
          : {},
      )['flatMap'](normalizeRawInputList),
      _0x34c87d = [
        ..._0x2a2721,
        ...normalizeRawInputList(_0x37a549?.['images']),
        ...normalizeRawInputList(_0x37a549?.['inputUrls']),
      ];
    return Array['from'](new Set(_0x34c87d));
  }
  if (_0x1cc2f7 === 'video')
    return Array['from'](
      new Set([
        ...normalizeRawInputList(_0x37a549?.['videoUrl']),
        ...normalizeRawInputList(_0x37a549?.['videos']),
        ...normalizeRawInputList(_0x37a549?.['videoUrls']),
        ...normalizeRawInputList(_0x37a549?.['reference_videos']),
      ]),
    );
  return Array['from'](
    new Set([
      ...normalizeRawInputList(_0x37a549?.['audioUrl']),
      ...normalizeRawInputList(_0x37a549?.['audios']),
      ...normalizeRawInputList(_0x37a549?.['audioUrls']),
      ...normalizeRawInputList(_0x37a549?.['reference_audios']),
    ]),
  );
}
function collectRawActiveImageUrls(_0x15bdfb, _0x3b1a0e, _0x470235) {
  if (_0x470235 !== !![]) return collectRawInputUrls(_0x15bdfb, 'image');
  const _0x3831c2 =
      _0x15bdfb?.['inputUrlsBySlot'] &&
      typeof _0x15bdfb['inputUrlsBySlot'] === 'object' &&
      !Array['isArray'](_0x15bdfb['inputUrlsBySlot'])
        ? _0x15bdfb['inputUrlsBySlot']
        : {},
    _0x4f9456 = new Set(Object['values'](_0x3831c2)['flatMap'](normalizeRawInputList)),
    _0x18d586 = [
      ...normalizeRawInputList(_0x15bdfb?.['images']),
      ...normalizeRawInputList(_0x15bdfb?.['inputUrls']),
    ]['filter']((_0x19cb09) => !_0x4f9456['has'](_0x19cb09)),
    _0x256b09 = _0x3b1a0e === 'frames' ? ['firstFrame', 'lastFrame'] : ['referenceImage'];
  return Array['from'](
    new Set([
      ..._0x256b09['flatMap']((_0xe81962) => normalizeRawInputList(_0x3831c2[_0xe81962])),
      ..._0x18d586,
    ]),
  );
}
function validateRawInputCounts(_0x5b56ff, _0x326a4c) {
  const _0x23fe2d =
      _0x326a4c['supportsFrames'] === !![]
        ? String(readRawFieldValue(_0x5b56ff, _0x326a4c['modeField']) || 'reference')
            ['trim']()
            ['toLowerCase']()
        : 'reference',
    _0x264404 =
      _0x23fe2d === 'frames'
        ? { image: 0x2, video: 0x0, audio: 0x0 }
        : { image: _0x326a4c['maxImages'], video: _0x326a4c['maxVideos'], audio: _0x326a4c['maxAudios'] };
  for (const [_0x1ce093, _0x2af081] of [
    ['image', '参考图'],
    ['video', '参考视频'],
    ['audio', '参考音频'],
  ]) {
    const _0x160774 =
        _0x1ce093 === 'image'
          ? collectRawActiveImageUrls(_0x5b56ff, _0x23fe2d, _0x326a4c['supportsFrames'])
          : collectRawInputUrls(_0x5b56ff, _0x1ce093),
      _0x2db7ce = Number(_0x264404[_0x1ce093]);
    if (Number['isFinite'](_0x2db7ce) && _0x160774['length'] > _0x2db7ce)
      throw new Error(
        '便宜渠道当前模型最多支持 ' +
          _0x2db7ce +
          '\x20个' +
          _0x2af081 +
          '，当前传入\x20' +
          _0x160774['length'] +
          ' 个，请删减后重试',
      );
  }
}
function validateAssetRefs(_0x3dca94, _0x44132c, _0x3812c3, _0x4a8699, _0x42facf) {
  const _0x10a02f = new Set(
      Array['isArray'](_0x3dca94['allowAssetRefKinds']) ? _0x3dca94['allowAssetRefKinds'] : [],
    ),
    _0x41d6b1 = _0x42facf && typeof _0x42facf === 'object' ? _0x42facf : {},
    _0x44b6b7 = {
      image: normalizeUrlList([
        _0x44132c,
        _0x41d6b1['firstFrame'],
        _0x41d6b1['lastFrame'],
        _0x41d6b1['referenceImage'],
      ]),
      video: normalizeUrlList([_0x3812c3, _0x41d6b1['referenceVideo']]),
      audio: normalizeUrlList([_0x4a8699, _0x41d6b1['referenceAudio']]),
    };
  for (const [_0x194e6e, _0x4510ff] of Object['entries'](_0x44b6b7)) {
    if (_0x10a02f['has'](_0x194e6e)) continue;
    if (!_0x4510ff['some']((_0x3d49cb) => /^asset:\/\//i['test'](_0x3d49cb))) continue;
    throw new Error(
      '便宜渠道当前模型不支持该 asset:// 预审素材引用；请提供原始素材，系统会先上传到 /v1/assets/uploads',
    );
  }
}
function applySeedanceInputs({
  body: _0x1035ff,
  payload: _0x5b51a2,
  policy: _0xcbf075,
  inputImages: _0x5536b6,
  inputVideos: _0x590407,
  inputAudios: _0x31203e,
  finalUrlsBySlot: _0x4b822e,
}) {
  const _0x20d2a2 = normalizeUrlList(_0x590407),
    _0x590e4f = normalizeUrlList(_0x31203e),
    _0x4a76ed = normalizeUrlList(_0x5536b6);
  (requireMaximum('参考视频', _0x20d2a2, _0xcbf075['maxVideos']),
    requireMaximum('参考音频', _0x590e4f, _0xcbf075['maxAudios']),
    delete _0x1035ff['images'],
    delete _0x1035ff['start_frame'],
    delete _0x1035ff['end_frame'],
    delete _0x1035ff['reference_videos'],
    delete _0x1035ff['reference_audios']);
  const _0x2b397c =
    _0xcbf075['supportsFrames'] === !![] ? getMode(_0x5b51a2, _0xcbf075) || 'reference' : 'reference';
  if (_0x2b397c === 'frames') {
    const _0x4add88 = getSlotUrls(_0x4b822e, 'firstFrame'),
      _0x56ebab = getSlotUrls(_0x4b822e, 'lastFrame'),
      _0x19cd2b = new Set([..._0x4add88, ..._0x56ebab, ...getSlotUrls(_0x4b822e, 'referenceImage')]),
      _0xf3b586 = _0x4a76ed['filter']((_0x546f0c) => !_0x19cd2b['has'](_0x546f0c)),
      _0x2680fc = _0x4add88[0x0] || _0xf3b586[0x0] || '',
      _0x1058dc = _0x56ebab[0x0] || _0xf3b586[0x1] || '';
    (requireMaximum('首帧', _0x4add88, 0x1),
      requireMaximum('尾帧', _0x56ebab, 0x1),
      requireMaximum('参考视频', _0x20d2a2, 0x0),
      requireMaximum('参考音频', _0x590e4f, 0x0));
    if (!_0x2680fc) throw new Error('便宜渠道首尾帧模式至少需要\x201\x20张首帧图片');
    _0x1035ff['start_frame'] = [_0x2680fc];
    if (_0x1058dc) _0x1035ff['end_frame'] = [_0x1058dc];
    return _0x1035ff;
  }
  const _0x37346e = new Set(getSlotUrls(_0x4b822e, 'firstFrame')),
    _0x36ad05 = new Set(getSlotUrls(_0x4b822e, 'lastFrame')),
    _0x43fd0a = collectImages([], _0x4b822e, ['referenceImage']);
  (_0x4a76ed['forEach']((_0x2b97cf) => {
    !_0x37346e['has'](_0x2b97cf) && !_0x36ad05['has'](_0x2b97cf) && appendUrl(_0x43fd0a, _0x2b97cf);
  }),
    requireMinimumImages(_0x43fd0a, _0xcbf075['minImages']),
    requireMaximum('参考图', _0x43fd0a, _0xcbf075['maxImages']));
  if (_0xcbf075['audioRequiresImage'] === !![] && _0x590e4f['length'] > 0x0 && _0x43fd0a['length'] === 0x0)
    throw new Error('便宜渠道当前模型使用参考音频时至少需要\x201\x20张参考图');
  if (
    _0xcbf075['audioRequiresVisual'] === !![] &&
    _0x590e4f['length'] > 0x0 &&
    _0x43fd0a['length'] === 0x0 &&
    _0x20d2a2['length'] === 0x0
  )
    throw new Error('便宜渠道当前模型使用参考音频时至少需要\x201\x20张参考图或\x201\x20个参考视频');
  if (_0x43fd0a['length']) _0x1035ff['images'] = _0x43fd0a;
  if (_0x20d2a2['length']) _0x1035ff['reference_videos'] = _0x20d2a2;
  if (_0x590e4f['length']) _0x1035ff['reference_audios'] = _0x590e4f;
  return _0x1035ff;
}
function applyHappyHorseInputs({
  body: _0x2fe4a1,
  payload: _0x43bf97,
  policy: _0x2622b3,
  inputImages: _0x723446,
  inputVideos: _0x451d32,
  inputAudios: _0x3aa361,
  finalUrlsBySlot: _0x3f138b,
}) {
  const _0x29b6c2 = getMode(_0x43bf97, _0x2622b3) || 'auto',
    _0x1f3d76 = collectImages(_0x723446, _0x3f138b, ['firstFrame', 'referenceImage']),
    _0x403234 = normalizeUrlList(_0x451d32),
    _0x1660c0 = normalizeUrlList(_0x3aa361);
  (requireMaximum('参考图', _0x1f3d76, _0x2622b3['maxImages']),
    requireMaximum('参考视频', _0x403234, _0x2622b3['maxVideos']),
    requireMaximum('参考音频', _0x1660c0, _0x2622b3['maxAudios']));
  if ((_0x29b6c2 === 'image' || _0x29b6c2 === 'reference') && _0x1f3d76['length'] === 0x0)
    throw new Error('便宜渠道 HappyHorse 图像模式需要参考图');
  if (_0x1f3d76['length']) _0x2fe4a1['images'] = _0x1f3d76;
  else delete _0x2fe4a1['images'];
  if (_0x1660c0['length']) _0x2fe4a1['reference_audios'] = _0x1660c0;
  else delete _0x2fe4a1['reference_audios'];
  return (delete _0x2fe4a1['reference_videos'], _0x2fe4a1);
}
export function binghuoVideo({
  currentBody: _0x3c0c3b,
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
  const _0x19ce43 = { ..._0x3c0c3b },
    _0x38ed9a = getPolicy(executionManifest);
  (_0x38ed9a['family'] === 'minimax-h3' || _0x38ed9a['component'] === 'minimaxH3') &&
    (_0x19ce43['prompt'] = translateMinimaxH3EditorAssetMentions(_0x19ce43['prompt']));
  (validateRawInputCounts(rawPayload, _0x38ed9a),
    validateAssetRefs(_0x38ed9a, inputImages, inputVideos, inputAudios, finalUrlsBySlot));
  if (_0x38ed9a['component'] === 'seedance2')
    return applySeedanceInputs({
      body: _0x19ce43,
      payload: payload,
      policy: _0x38ed9a,
      inputImages: inputImages,
      inputVideos: inputVideos,
      inputAudios: inputAudios,
      finalUrlsBySlot: finalUrlsBySlot,
    });
  if (_0x38ed9a['component'] === 'happyHorse')
    return applyHappyHorseInputs({
      body: _0x19ce43,
      payload: payload,
      policy: _0x38ed9a,
      inputImages: inputImages,
      inputVideos: inputVideos,
      inputAudios: inputAudios,
      finalUrlsBySlot: finalUrlsBySlot,
    });
  const _0x2ae30f = normalizeUrlList(inputImages),
    _0x3e2a7c = normalizeUrlList(inputVideos),
    _0x2393e2 = normalizeUrlList(inputAudios);
  (requireMinimumImages(_0x2ae30f, _0x38ed9a['minImages']),
    requireMaximum('参考图', _0x2ae30f, _0x38ed9a['maxImages']),
    requireMaximum('参考视频', _0x3e2a7c, _0x38ed9a['maxVideos']),
    requireMaximum('参考音频', _0x2393e2, _0x38ed9a['maxAudios']));
  if (_0x2ae30f['length']) _0x19ce43['images'] = _0x2ae30f;
  else delete _0x19ce43['images'];
  if (_0x3e2a7c['length']) _0x19ce43['reference_videos'] = _0x3e2a7c;
  else delete _0x19ce43['reference_videos'];
  if (_0x2393e2['length']) _0x19ce43['reference_audios'] = _0x2393e2;
  else delete _0x19ce43['reference_audios'];
  return (delete _0x19ce43['start_frame'], delete _0x19ce43['end_frame'], _0x19ce43);
}
