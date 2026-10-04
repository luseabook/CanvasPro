export function renderDirectorCameraKeyEditor(value) {
  const run = (item, key, index) =>
    '<label>' +
    index +
    '<input type="number" step="0.1" value="' +
    Number(key)['toFixed'](0x3) +
    '" data-director-camera-key="' +
    item +
    '"></label>';
  return (
    '<div class="storyboard-3d-camera-key-fields">' +
    ['position', 'target']
      ['map'](
        (result) =>
          '<div><b>' +
          (result === 'position' ? '位置' : '注视目标') +
          '</b>' +
          value['camera'][result]['map']((data, options) =>
            run(result + '-' + options, data, ['X', 'Y', 'Z'][options]),
          )['join']('') +
          '</div>',
      )
      ['join']('') +
    '\x0a\x20\x20<div>' +
    run('focalLength', value['camera']['focalLength'], '焦距 mm') +
    run('roll', ((value['camera']['roll'] || 0x0) * 0xb4) / Math['PI'], '倾斜°') +
    '<label>缓动<select data-director-camera-key-easing>' +
    ['linear', 'ease-in', 'ease-out', 'ease-in-out']
      ['map'](
        (target) =>
          '<option value="' +
          target +
          '\x22\x20' +
          (value['easing'] === target ? 'selected' : '') +
          '>' +
          { linear: '匀速', 'ease-in': '缓入', 'ease-out': '缓出', 'ease-in-out': '缓入缓出' }[target] +
          '</option>',
      )
      ['join']('') +
    '</select></label></div></div>'
  );
}
