import { renderDirectorCurveEditor } from './directorCurveEditor.js';
export function renderDirectorCameraPathPanel(_0x19cf72, _0x391fb2) {
  const _0x3986d9 = _0x19cf72['points'](),
    _0x21f3cd =
      _0x3986d9['find']((_0x2f3e22) => _0x2f3e22['id'] === _0x19cf72['selectedId']) || _0x3986d9[0x0],
    _0x5a3722 = (_0x576128, _0x528c06, _0x23aec5 = ![]) =>
      '<button\x20type=\x22button\x22\x20data-storyboard-3d-action=\x22timeline-camera-path-' +
      _0x576128 +
      '\x22\x20' +
      (_0x23aec5 ? 'disabled' : '') +
      '>' +
      _0x528c06 +
      '</button>',
    _0x34a433 = (_0x4efac1, _0x48b6b2, _0x5856f7, _0xb17451 = '') =>
      '<label>' +
      _0x5856f7 +
      '<input type="number" data-camera-path-field="' +
      _0x4efac1 +
      '" value="' +
      Number(_0x48b6b2)['toFixed'](0x3) +
      '" step="0.1" ' +
      _0xb17451 +
      '></label>';
  return (
    '<fieldset\x20data-camera-path-panel><legend>运动轨迹</legend><div\x20class=\x22storyboard-3d-director-fields\x22>\x0a\x20\x20\x20\x20<label>轨迹对象<select\x20data-camera-path-object><option\x20value=\x22camera\x22\x20' +
    (!_0x19cf72['objectId'] ? 'selected' : '') +
    '>摄像机</option>' +
    _0x19cf72['context']()
      ['scene']['objects']['filter'](
        (_0x1cb359) => !['camera', 'light', 'group']['includes'](_0x1cb359['type']),
      )
      ['map'](
        (_0x14a081, _0x328931) =>
          '<option value="' +
          _0x328931 +
          '\x22\x20' +
          (_0x19cf72['objectId'] === _0x14a081['id'] ? 'selected' : '') +
          '>' +
          String(_0x14a081['name'])['replaceAll']('&', '&amp;')['replaceAll']('<', '&lt;') +
          '</option>',
      )
      ['join']('') +
    '</select></label>\x0a\x20\x20\x20\x20' +
    _0x5a3722('edit', _0x19cf72['active'] ? '结束轨道编辑' : '编辑画面轨道') +
    (_0x19cf72['active'] ? _0x5a3722('focus', '查看整条轨道', !_0x3986d9['length']) : '') +
    '\n    ' +
    (_0x19cf72['active']
      ? _0x5a3722('draw', _0x19cf72['drawing'] ? '停止点选' : '在画面点选路线') +
        '\x0a\x20\x20\x20\x20<label>绘制<select\x20data-camera-path-draw-mode><option\x20value=\x22points\x22\x20' +
        (_0x19cf72['drawMode'] === 'points' ? 'selected' : '') +
        '>逐点</option><option value="freehand" ' +
        (_0x19cf72['drawMode'] === 'freehand' ? 'selected' : '') +
        '>手绘</option></select></label><label>手绘时长<input type="number" min="0.1" max="3600" step="0.1" value="' +
        _0x19cf72['drawDuration'] +
        '" data-camera-path-draw-duration></label>\n    ' +
        _0x5a3722('smooth', '平滑曲线', _0x3986d9['length'] < 0x2) +
        _0x5a3722('linear', '直线路径', _0x3986d9['length'] < 0x2) +
        '\x0a\x20\x20\x20\x20<label>编辑平面<select\x20data-camera-path-plane>' +
        [
          [0x1, 'XZ 地面'],
          [0x2, 'XY 高度'],
          [0x0, 'YZ\x20高度'],
        ]
          ['map'](
            ([_0x5b7a3a, _0x2cfac1]) =>
              '<option\x20value=\x22' +
              _0x5b7a3a +
              '\x22\x20' +
              (_0x19cf72['plane'] === _0x5b7a3a ? 'selected' : '') +
              '>' +
              _0x2cfac1 +
              '</option>',
          )
          ['join']('') +
        '</select></label>\n    ' +
        _0x34a433('planeOffset', _0x19cf72['planeOffset'], '平面位置\x20/\x20米')
      : '') +
    '\x0a\x20\x20\x20\x20<span>' +
    _0x3986d9['length'] +
    ' 个控制点</span>\n  </div>' +
    (_0x19cf72['active']
      ? '<p>' +
        (_0x19cf72['objectId']
          ? '在画面绘制物体路线，拖动控制点调整走位。'
          : '点击画面添加机位，拖动圆点改路线；监看窗拖动调整朝向，Alt＋滚轮沿镜头推进。') +
        'Esc 取消拖动或结束编辑。</p>\n  <div class="storyboard-3d-director-fields"><label>控制点<select data-camera-path-selection>' +
        _0x3986d9['map'](
          (_0x1e8709, _0x915108) =>
            '<option\x20value=\x22' +
            _0x915108 +
            '\x22\x20' +
            (_0x1e8709['id'] === _0x21f3cd?.['id'] ? 'selected' : '') +
            '>' +
            (_0x915108 + 0x1) +
            ' · ' +
            _0x1e8709['time']['toFixed'](0x2) +
            ' 秒</option>',
        )['join']('') +
        '</select></label>' +
        _0x5a3722(
          'delete',
          '删除控制点',
          !_0x21f3cd || (!_0x19cf72['objectId'] && _0x391fb2['cameraKeyframes']['length'] <= 0x1),
        ) +
        '</div>\n  ' +
        (_0x21f3cd
          ? '<div class="storyboard-3d-director-fields">' +
            _0x34a433('time', _0x21f3cd['time'], '时间 / 秒', 'min="0" max="3600"') +
            (_0x19cf72['objectId']
              ? ''
              : '' +
                _0x34a433(
                  'focalLength',
                  _0x21f3cd['camera']['focalLength'],
                  '焦距 / mm',
                  'min="1" max="500"',
                ) +
                _0x34a433(
                  'roll',
                  ((_0x21f3cd['camera']['roll'] || 0x0) * 0xb4) / Math['PI'],
                  '倾斜 / 度',
                  'min=\x22-180\x22\x20max=\x22180\x22',
                )) +
            '\n  <label>缓动<select data-camera-path-easing>' +
            [
              ['linear', '匀速'],
              ['ease-in', '缓入'],
              ['ease-out', '缓出'],
              ['ease-in-out', '缓入缓出'],
            ]
              ['map'](
                ([_0x1de412, _0x5b71e7]) =>
                  '<option value="' +
                  _0x1de412 +
                  '\x22\x20' +
                  (_0x21f3cd['easing'] === _0x1de412 ? 'selected' : '') +
                  '>' +
                  _0x5b71e7 +
                  '</option>',
              )
              ['join']('') +
            '</select></label></div>\n  ' +
            (_0x19cf72['objectId'] ? ['position'] : ['position', 'target'])
              ['map'](
                (_0x29ddc0) =>
                  '<div class="storyboard-3d-director-fields"><b>' +
                  (_0x29ddc0 === 'position' ? '位置' : '注视目标') +
                  '</b>' +
                  _0x21f3cd['camera'][_0x29ddc0]['map']((_0x1eb93b, _0x2f8c6f) =>
                    _0x34a433(_0x29ddc0 + '-' + _0x2f8c6f, _0x1eb93b, ['X', 'Y', 'Z'][_0x2f8c6f]),
                  )['join']('') +
                  '</div>',
              )
              ['join']('') +
            renderDirectorCurveEditor(_0x21f3cd)
          : '')
      : '') +
    '</fieldset>'
  );
}
