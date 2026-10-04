import { renderDirectorCurveEditor } from './directorCurveEditor.js';
export function renderDirectorCameraPathPanel(enabled, value) {
  const list = enabled['points'](),
    enabled2 = list['find']((item) => item['id'] === enabled['selectedId']) || list[0x0],
    handler = (key, index, result = ![]) =>
      '<button\x20type=\x22button\x22\x20data-storyboard-3d-action=\x22timeline-camera-path-' +
      key +
      '\x22\x20' +
      (result ? 'disabled' : '') +
      '>' +
      index +
      '</button>',
    handler2 = (data, options, target, source = '') =>
      '<label>' +
      target +
      '<input type="number" data-camera-path-field="' +
      data +
      '" value="' +
      Number(options)['toFixed'](0x3) +
      '" step="0.1" ' +
      source +
      '></label>';
  return (
    '<fieldset\x20data-camera-path-panel><legend>运动轨迹</legend><div\x20class=\x22storyboard-3d-director-fields\x22>\x0a\x20\x20\x20\x20<label>轨迹对象<select\x20data-camera-path-object><option\x20value=\x22camera\x22\x20' +
    (!enabled['objectId'] ? 'selected' : '') +
    '>摄像机</option>' +
    enabled['context']()
      ['scene']['objects']['filter']((next) => !['camera', 'light', 'group']['includes'](next['type']))
      ['map'](
        (error, current) =>
          '<option value="' +
          current +
          '\x22\x20' +
          (enabled['objectId'] === error['id'] ? 'selected' : '') +
          '>' +
          String(error['name'])['replaceAll']('&', '&amp;')['replaceAll']('<', '&lt;') +
          '</option>',
      )
      ['join']('') +
    '</select></label>\x0a\x20\x20\x20\x20' +
    handler('edit', enabled['active'] ? '结束轨道编辑' : '编辑画面轨道') +
    (enabled['active'] ? handler('focus', '查看整条轨道', !list['length']) : '') +
    '\n    ' +
    (enabled['active']
      ? handler('draw', enabled['drawing'] ? '停止点选' : '在画面点选路线') +
        '\x0a\x20\x20\x20\x20<label>绘制<select\x20data-camera-path-draw-mode><option\x20value=\x22points\x22\x20' +
        (enabled['drawMode'] === 'points' ? 'selected' : '') +
        '>逐点</option><option value="freehand" ' +
        (enabled['drawMode'] === 'freehand' ? 'selected' : '') +
        '>手绘</option></select></label><label>手绘时长<input type="number" min="0.1" max="3600" step="0.1" value="' +
        enabled['drawDuration'] +
        '" data-camera-path-draw-duration></label>\n    ' +
        handler('smooth', '平滑曲线', list['length'] < 0x2) +
        handler('linear', '直线路径', list['length'] < 0x2) +
        '\x0a\x20\x20\x20\x20<label>编辑平面<select\x20data-camera-path-plane>' +
        [
          [0x1, 'XZ 地面'],
          [0x2, 'XY 高度'],
          [0x0, 'YZ\x20高度'],
        ]
          ['map'](
            ([entry, record]) =>
              '<option\x20value=\x22' +
              entry +
              '\x22\x20' +
              (enabled['plane'] === entry ? 'selected' : '') +
              '>' +
              record +
              '</option>',
          )
          ['join']('') +
        '</select></label>\n    ' +
        handler2('planeOffset', enabled['planeOffset'], '平面位置\x20/\x20米')
      : '') +
    '\x0a\x20\x20\x20\x20<span>' +
    list['length'] +
    ' 个控制点</span>\n  </div>' +
    (enabled['active']
      ? '<p>' +
        (enabled['objectId']
          ? '在画面绘制物体路线，拖动控制点调整走位。'
          : '点击画面添加机位，拖动圆点改路线；监看窗拖动调整朝向，Alt＋滚轮沿镜头推进。') +
        'Esc 取消拖动或结束编辑。</p>\n  <div class="storyboard-3d-director-fields"><label>控制点<select data-camera-path-selection>' +
        list['map'](
          (payload, handle) =>
            '<option\x20value=\x22' +
            handle +
            '\x22\x20' +
            (payload['id'] === enabled2?.['id'] ? 'selected' : '') +
            '>' +
            (handle + 0x1) +
            ' · ' +
            payload['time']['toFixed'](0x2) +
            ' 秒</option>',
        )['join']('') +
        '</select></label>' +
        handler(
          'delete',
          '删除控制点',
          !enabled2 || (!enabled['objectId'] && value['cameraKeyframes']['length'] <= 0x1),
        ) +
        '</div>\n  ' +
        (enabled2
          ? '<div class="storyboard-3d-director-fields">' +
            handler2('time', enabled2['time'], '时间 / 秒', 'min="0" max="3600"') +
            (enabled['objectId']
              ? ''
              : '' +
                handler2('focalLength', enabled2['camera']['focalLength'], '焦距 / mm', 'min="1" max="500"') +
                handler2(
                  'roll',
                  ((enabled2['camera']['roll'] || 0x0) * 0xb4) / Math['PI'],
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
                ([state, config]) =>
                  '<option value="' +
                  state +
                  '\x22\x20' +
                  (enabled2['easing'] === state ? 'selected' : '') +
                  '>' +
                  config +
                  '</option>',
              )
              ['join']('') +
            '</select></label></div>\n  ' +
            (enabled['objectId'] ? ['position'] : ['position', 'target'])
              ['map'](
                (scope) =>
                  '<div class="storyboard-3d-director-fields"><b>' +
                  (scope === 'position' ? '位置' : '注视目标') +
                  '</b>' +
                  enabled2['camera'][scope]['map']((input, output) =>
                    handler2(scope + '-' + output, input, ['X', 'Y', 'Z'][output]),
                  )['join']('') +
                  '</div>',
              )
              ['join']('') +
            renderDirectorCurveEditor(enabled2)
          : '')
      : '') +
    '</fieldset>'
  );
}
