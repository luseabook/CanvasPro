const text = (_0x5dcbdb) => String(_0x5dcbdb ?? '')['trim'](),
  present = (_0x9c444c) =>
    _0x9c444c !== undefined && _0x9c444c !== null && _0x9c444c !== ![] && text(_0x9c444c) !== '';
export function validateRunningHubAudioParameters(
  _0x4423e2,
  _0x5ca22e,
  _0xdcef89,
  _0x2fd0dd,
  _0x187ca4,
  _0x345409,
) {
  if (_0x5ca22e['promptRequired'] && !_0xdcef89) throw new Error('请填写生成文本');
  const _0x1b7a04 = _0x5ca22e['rules'] || {},
    _0x39aa1d = _0x1b7a04['weightedChinesePrompt']
      ? [..._0xdcef89]['reduce'](
          (_0x5f4160, _0x3b7c3c) => _0x5f4160 + (/\p{Script=Han}/u['test'](_0x3b7c3c) ? 0x2 : 0x1),
          0x0,
        )
      : [..._0xdcef89]['length'];
  if (_0x5ca22e['promptMaxLength'] && _0x39aa1d > _0x5ca22e['promptMaxLength'])
    throw new Error(
      '生成文本超过 ' +
        _0x5ca22e['promptMaxLength'] +
        ' 字符限制' +
        (_0x1b7a04['weightedChinesePrompt'] ? '（汉字按 2 字符计）' : ''),
    );
  const _0x45e397 = Object['fromEntries'](
      (_0x4423e2['uiSchema']?.['fields'] || [])['map']((_0x37b302) => [
        _0x37b302['id'],
        _0x2fd0dd[_0x37b302['id']] ?? _0x37b302['defaultValue'],
      ]),
    ),
    _0x4cc792 = (_0x1dca68) =>
      _0x4423e2['uiSchema']?.['fields']?.['find']((_0x8791e0) => _0x8791e0['id'] === _0x1dca68)?.['label'] ||
      _0x1dca68;
  for (const _0x59a7f6 of _0x4423e2['uiSchema']?.['fields'] || []) {
    const _0x2af609 = _0x45e397[_0x59a7f6['id']];
    if (_0x2af609 === undefined || _0x2af609 === null || _0x2af609 === '') continue;
    if (_0x59a7f6['type'] === 'slider' || _0x59a7f6['type'] === 'stepper') {
      const _0x3f6513 = Number(_0x2af609);
      if (
        !Number['isFinite'](_0x3f6513) ||
        _0x3f6513 < _0x59a7f6['min'] ||
        _0x3f6513 > _0x59a7f6['max'] ||
        (_0x59a7f6['step'] === 0x1 && !Number['isInteger'](_0x3f6513))
      )
        throw new Error(_0x59a7f6['label'] + '超出允许范围');
    }
    if (_0x59a7f6['maxLength'] && [...text(_0x2af609)]['length'] > _0x59a7f6['maxLength'])
      throw new Error(_0x59a7f6['label'] + '最多 ' + _0x59a7f6['maxLength'] + ' 字符');
    if (
      _0x59a7f6['options'] &&
      !_0x59a7f6['options']['some'](
        (_0x355f54) => String(_0x355f54['value'] ?? _0x355f54) === String(_0x2af609),
      )
    )
      throw new Error(_0x59a7f6['label'] + '选项无效');
  }
  if (
    _0x1b7a04['promptWhen'] &&
    _0x45e397[_0x1b7a04['promptWhen']['field']] === _0x1b7a04['promptWhen']['value'] &&
    !_0xdcef89
  )
    throw new Error('请选择随机台词或填写台词文本');
  for (const _0x2a983f of _0x1b7a04['requiredFields'] || [])
    if (!text(_0x45e397[_0x2a983f]))
      throw new Error(
        '请填写' +
          (_0x4423e2['uiSchema']['fields']['find']((_0x11e1e3) => _0x11e1e3['id'] === _0x2a983f)?.['label'] ||
            _0x2a983f),
      );
  for (const _0x1bca01 of _0x1b7a04['requiredWhen'] || [])
    if (_0x45e397[_0x1bca01['when']] === _0x1bca01['value'] && !text(_0x45e397[_0x1bca01['field']]))
      throw new Error('请填写音色描述');
  for (const _0xd588c1 of _0x1b7a04['dependencies'] || [])
    if (present(_0x45e397[_0xd588c1['field']]) && !text(_0x45e397[_0xd588c1['requires']]))
      throw new Error(
        '使用' + _0x4cc792(_0xd588c1['field']) + '时需要填写' + _0x4cc792(_0xd588c1['requires']),
      );
  for (const [_0x5d7b16, _0x172f21] of Object['entries'](_0x1b7a04['minLengths'] || {}))
    if (text(_0x45e397[_0x5d7b16]) && [...text(_0x45e397[_0x5d7b16])]['length'] < _0x172f21)
      throw new Error(_0x4cc792(_0x5d7b16) + '至少需要 ' + _0x172f21 + ' 字符');
  for (const [_0x155509, _0xc77586] of Object['entries'](_0x1b7a04['maxLines'] || {}))
    if (
      text(_0x45e397[_0x155509])
        ['split'](/\r?\n/)
        ['filter']((_0x2b9141) => _0x2b9141['trim']())['length'] > _0xc77586
    )
      throw new Error('发音词典最多 ' + _0xc77586 + '\x20条');
  if (
    _0x1b7a04['customVoiceId'] &&
    !/^[A-Za-z](?=.*\d)[A-Za-z0-9_-]{7,}$/['test'](text(_0x45e397['customVoiceId']))
  )
    throw new Error('新音色 ID 至少 8 字符，以字母开头并包含数字');
  for (const _0x24a009 of ['audio', 'image']) {
    const _0x2cc242 = _0x24a009 === 'audio' ? _0x187ca4 : _0x345409,
      _0x272a54 = Number(_0x4423e2['inputSlots']?.['maxByKind']?.[_0x24a009] || 0x0);
    if (_0x2cc242['length'] > _0x272a54)
      throw new Error(
        '最多支持 ' + _0x272a54 + '\x20个' + (_0x24a009 === 'audio' ? '音频' : '图片') + '输入',
      );
    const _0x4f05b8 = (_0x4423e2['inputSlots']?.['fixedSlots'] || [])['filter'](
      (_0x535e9c) => _0x535e9c['kind'] === _0x24a009,
    );
    for (const _0x4145ec of _0x4f05b8)
      if (
        _0x4145ec['required'] &&
        !_0x2cc242['some']((_0xf79830) => _0xf79830['refSlot'] === _0x4145ec['id'])
      )
        throw new Error('请连接' + _0x4145ec['label']);
    if (_0x2cc242['some']((_0x1b2ca9) => !_0x1b2ca9['url']))
      throw new Error('参考' + (_0x24a009 === 'audio' ? '音频' : '图片') + '尚无可用文件');
  }
  const _0x1136a9 = new Set();
  for (const _0x17c2f6 of _0x187ca4) {
    if (!_0x17c2f6['url']) throw new Error('参考音频地址为空');
    if (_0x1136a9['has'](_0x17c2f6['refSlot'])) throw new Error('同一个参考槽不能连接多个音频');
    _0x1136a9['add'](_0x17c2f6['refSlot']);
    const _0x2cf7d2 = _0x17c2f6['fileName'] || text(_0x17c2f6['url'])['split'](/[?#]/)[0x0],
      _0x3d534e = _0x2cf7d2['match'](/\.([a-z0-9]+)$/i)?.[0x1]?.['toLowerCase']();
    if (_0x1b7a04['audioExtensions'] && _0x3d534e && !_0x1b7a04['audioExtensions']['includes'](_0x3d534e))
      throw new Error('参考音频只支持 ' + _0x1b7a04['audioExtensions']['join']('、'));
    if (
      _0x1b7a04['maxAudioBytes'] &&
      Number(_0x17c2f6['size'] || _0x17c2f6['fileSize']) > _0x1b7a04['maxAudioBytes']
    )
      throw new Error('参考音频不能超过\x2010\x20MB');
    const _0x49b6f0 = Number(_0x17c2f6['audioDuration'] || _0x17c2f6['duration']);
    if (
      _0x1b7a04['audioDuration'] &&
      _0x49b6f0 > 0x0 &&
      (_0x49b6f0 < _0x1b7a04['audioDuration']['min'] || _0x49b6f0 > _0x1b7a04['audioDuration']['max'])
    )
      throw new Error('原曲长度必须在 6 秒到 6 分钟之间');
  }
  const _0x45da10 = Object['fromEntries'](_0x187ca4['map']((_0x517ba7) => [_0x517ba7['refSlot'], _0x517ba7]));
  for (const _0x376a61 of _0x5ca22e['preparations'] || []) {
    if (
      _0x376a61['resultType'] === 'id' &&
      _0x45da10[_0x376a61['slot']] &&
      text(_0x45e397[_0x376a61['targetField']])
    )
      throw new Error('同一参考素材请选择连接音频或填写已有 ID，不能同时使用');
  }
  if (
    _0x1b7a04['exclusiveInputs'] &&
    [present(_0x45e397['speaker']), _0x187ca4['length'] > 0x0, _0x345409['length'] > 0x0]['filter'](Boolean)[
      'length'
    ] > 0x1
  )
    throw new Error('音色 ID、参考音频和参考图片只能选一种');
  if (_0x1b7a04['controlMode'] === 'murekaBgm') {
    const _0xea46f = present(_0x45e397['instrumentalId']) || Boolean(_0x45da10['instrumental']);
    if (Boolean(_0xdcef89) === Boolean(_0xea46f))
      throw new Error('伴奏生成需要选择风格描述或参考伴奏，二者不能同时使用');
  }
  if (_0x1b7a04['controlMode'] === 'murekaSong') {
    const _0x491edb = present(_0x45e397['stylePrompt']),
      _0xb7237f = present(_0x45e397['referenceId']) || Boolean(_0x45da10['reference']),
      _0x4c0f5f = present(_0x45e397['vocalId']) || Boolean(_0x45da10['vocal']),
      _0x5504cf = present(_0x45e397['melodyId']) || Boolean(_0x45da10['melody']);
    if (_0x5504cf && (_0x491edb || _0xb7237f || _0x4c0f5f))
      throw new Error('旋律参考不能与风格、歌曲参考或人声参考混用');
    if (_0x491edb && _0xb7237f) throw new Error('歌曲风格描述和参考歌曲只能选一种');
  }
}
