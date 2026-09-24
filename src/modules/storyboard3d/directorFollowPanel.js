const escape = (_0x310523) =>
    String(_0x310523 ?? '')
      ['replaceAll']('&', '&amp;')
      ['replaceAll']('\x22', '&quot;')
      ['replaceAll']('<', '&lt;'),
  modes = [
    ['relative', '相对运动跟拍'],
    ['path', '沿轨道注视目标'],
    ['fixed', '固定偏移跟拍'],
  ];
export function renderDirectorFollowPanel(_0x37b716, _0x100b36) {
  const _0x4719a8 = _0x37b716['cameraConstraint'],
    _0x47c4aa = (_0x4bbef1, _0x4ceca8, _0x3be035) =>
      '<select data-director-follow="' +
      _0x4bbef1 +
      '\x22>' +
      _0x3be035['map'](
        ([_0x4b3735, _0x468925]) =>
          '<option value="' +
          escape(_0x4b3735) +
          '\x22\x20' +
          (_0x4b3735 === _0x4ceca8 ? 'selected' : '') +
          '>' +
          escape(_0x468925) +
          '</option>',
      )['join']('') +
      '</select>',
    _0x384822 = (_0x41f327, _0x12dc8b, _0x9530d3) =>
      '<label>' +
      _0x9530d3 +
      '<input type="number" step="0.1" data-director-follow="' +
      _0x41f327 +
      '" value="' +
      _0x12dc8b +
      '"></label>',
    _0x57a495 = (_0x52c0da) =>
      '<label>跟拍方式' +
      _0x47c4aa('mode', _0x52c0da['mode'], modes) +
      '</label>' +
      _0x52c0da['followOffset']
        ['map']((_0x31e7ea, _0xa5eb1a) =>
          _0x384822(
            'followOffset-' + _0xa5eb1a,
            _0x31e7ea,
            '偏移 ' + ['X', 'Y', 'Z'][_0xa5eb1a] + '\x20/\x20米',
          ),
        )
        ['join']('');
  return (
    '<div class="storyboard-3d-director-fields">' +
    _0x57a495(_0x4719a8) +
    '<button data-storyboard-3d-action="timeline-follow-add">从播放头添加跟拍段</button></div>\n    ' +
    (_0x37b716['cameraConstraintClips'] || [])
      ['map'](
        (_0x130bc4) =>
          '<div class="storyboard-3d-director-fields" data-director-follow-clip="' +
          escape(_0x130bc4['id']) +
          '\x22>' +
          _0x384822('start', _0x130bc4['start'], '开始\x20/\x20秒') +
          _0x384822('end', _0x130bc4['end'], '结束 / 秒') +
          _0x57a495(_0x130bc4) +
          '<label>跟随' +
          _0x47c4aa('followObjectId', _0x130bc4['followObjectId'], _0x100b36) +
          '</label><label>注视' +
          _0x47c4aa('lookAtObjectId', _0x130bc4['lookAtObjectId'], _0x100b36) +
          '</label>' +
          _0x384822('lookAtOffset-1', _0x130bc4['lookAtOffset'][0x1], '注视高度') +
          '<button data-storyboard-3d-action="timeline-follow-delete" data-clip-id="' +
          escape(_0x130bc4['id']) +
          '">删除跟拍段</button></div>',
      )
      ['join']('')
  );
}
export function changeDirectorFollow(_0x1d052a, _0x507c22) {
  const _0x13e43b = _0x507c22['target'];
  if (!_0x13e43b['matches']?.('[data-director-follow]')) return ![];
  const _0x4344ab = _0x13e43b['closest']('[data-director-follow-clip]')?.['dataset']['directorFollowClip'];
  return (
    _0x1d052a['mutate']('调整跟拍方式与片段', (_0x2c6ce8) => {
      const _0x4f0112 = _0x4344ab
        ? _0x2c6ce8['cameraConstraintClips']['find']((_0x3e9399) => _0x3e9399['id'] === _0x4344ab)
        : _0x2c6ce8['cameraConstraint'];
      if (!_0x4f0112) return _0x2c6ce8;
      const [_0x50ab0c, _0x21898e] = _0x13e43b['dataset']['directorFollow']['split']('-'),
        _0x2475fb = _0x13e43b['type'] === 'number' ? Number(_0x13e43b['value']) : _0x13e43b['value'];
      if (_0x13e43b['type'] === 'number' && !Number['isFinite'](_0x2475fb)) return _0x2c6ce8;
      if (_0x21898e != null) _0x4f0112[_0x50ab0c][Number(_0x21898e)] = _0x2475fb;
      else {
        _0x4f0112[_0x50ab0c] = _0x2475fb;
        if (
          _0x50ab0c === 'mode' &&
          _0x2475fb === 'fixed' &&
          _0x4f0112['followOffset']['every']((_0x5ecd12) => _0x5ecd12 === 0x0)
        )
          _0x4f0112['followOffset'] = [0x0, 0x2, 0x5];
      }
      return _0x2c6ce8;
    }),
    !![]
  );
}
export function clickDirectorFollow(_0xc96a82, _0x19736b, _0x9bcec4) {
  if (!_0x19736b['startsWith']('timeline-follow-')) return ![];
  return (
    _0xc96a82['mutate']('编辑分段跟拍', (_0x1f0e43) => {
      if (_0x19736b === 'timeline-follow-delete')
        _0x1f0e43['cameraConstraintClips'] = _0x1f0e43['cameraConstraintClips']['filter'](
          (_0x4188ec) => _0x4188ec['id'] !== _0x9bcec4['dataset']['clipId'],
        );
      if (_0x19736b === 'timeline-follow-add') {
        const _0x568ab1 = Math['min'](
          0xe0f,
          _0xc96a82['timeline']['_timeForShot'](_0xc96a82['context']()['shot']),
        );
        _0x1f0e43['cameraConstraintClips']['push']({
          ...structuredClone(_0x1f0e43['cameraConstraint']),
          id: 'follow-' + globalThis['crypto']['randomUUID'](),
          start: _0x568ab1,
          end: Math['min'](0xe10, _0x568ab1 + 0x3),
        });
      }
      return _0x1f0e43;
    }),
    _0xc96a82['timeline']['requestRender']?.(),
    !![]
  );
}
