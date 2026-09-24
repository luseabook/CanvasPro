export function renderDirectorCameraKeyEditor(_0xb475b0) {
  const _0x353489 = (_0x4cd34e, _0x4e3c95, _0x1a83e0) =>
    '<label>' +
    _0x1a83e0 +
    '<input type="number" step="0.1" value="' +
    Number(_0x4e3c95)['toFixed'](0x3) +
    '" data-director-camera-key="' +
    _0x4cd34e +
    '"></label>';
  return (
    '<div class="storyboard-3d-camera-key-fields">' +
    ['position', 'target']
      ['map'](
        (_0x38d3b1) =>
          '<div><b>' +
          (_0x38d3b1 === 'position' ? '位置' : '注视目标') +
          '</b>' +
          _0xb475b0['camera'][_0x38d3b1]['map']((_0x323d45, _0x41fe6b) =>
            _0x353489(_0x38d3b1 + '-' + _0x41fe6b, _0x323d45, ['X', 'Y', 'Z'][_0x41fe6b]),
          )['join']('') +
          '</div>',
      )
      ['join']('') +
    '\x0a\x20\x20<div>' +
    _0x353489('focalLength', _0xb475b0['camera']['focalLength'], '焦距 mm') +
    _0x353489('roll', ((_0xb475b0['camera']['roll'] || 0x0) * 0xb4) / Math['PI'], '倾斜°') +
    '<label>缓动<select data-director-camera-key-easing>' +
    ['linear', 'ease-in', 'ease-out', 'ease-in-out']
      ['map'](
        (_0x3117f1) =>
          '<option value="' +
          _0x3117f1 +
          '\x22\x20' +
          (_0xb475b0['easing'] === _0x3117f1 ? 'selected' : '') +
          '>' +
          { linear: '匀速', 'ease-in': '缓入', 'ease-out': '缓出', 'ease-in-out': '缓入缓出' }[_0x3117f1] +
          '</option>',
      )
      ['join']('') +
    '</select></label></div></div>'
  );
}
