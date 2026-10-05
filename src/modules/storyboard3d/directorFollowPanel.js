const escape = (value) =>
    String(value ?? '')
      ['replaceAll']('&', '&amp;')
      ['replaceAll']('"', '&quot;')
      ['replaceAll']('<', '&lt;'),
  modes = [
    ['relative', '相对运动跟拍'],
    ['path', '沿轨道注视目标'],
    ['fixed', '固定偏移跟拍'],
  ];
export function renderDirectorFollowPanel(item, key) {
  const index = item['cameraConstraint'],
    handler = (result, data, list) =>
      '<select data-director-follow="' +
      result +
      '">' +
      list['map'](
        ([options, target]) =>
          '<option value="' +
          escape(options) +
          '" ' +
          (options === data ? 'selected' : '') +
          '>' +
          escape(target) +
          '</option>',
      )['join']('') +
      '</select>',
    handler2 = (source, next, current) =>
      '<label>' +
      current +
      '<input type="number" step="0.1" data-director-follow="' +
      source +
      '" value="' +
      next +
      '"></label>',
    handler3 = (entry) =>
      '<label>跟拍方式' +
      handler('mode', entry['mode'], modes) +
      '</label>' +
      entry['followOffset']
        ['map']((record, payload) =>
          handler2('followOffset-' + payload, record, '偏移 ' + ['X', 'Y', 'Z'][payload] + ' / 米'),
        )
        ['join']('');
  return (
    '<div class="storyboard-3d-director-fields">' +
    handler3(index) +
    '<button data-storyboard-3d-action="timeline-follow-add">从播放头添加跟拍段</button></div>\n    ' +
    (item['cameraConstraintClips'] || [])
      ['map'](
        (handle) =>
          '<div class="storyboard-3d-director-fields" data-director-follow-clip="' +
          escape(handle['id']) +
          '">' +
          handler2('start', handle['start'], '开始 / 秒') +
          handler2('end', handle['end'], '结束 / 秒') +
          handler3(handle) +
          '<label>跟随' +
          handler('followObjectId', handle['followObjectId'], key) +
          '</label><label>注视' +
          handler('lookAtObjectId', handle['lookAtObjectId'], key) +
          '</label>' +
          handler2('lookAtOffset-1', handle['lookAtOffset'][1], '注视高度') +
          '<button data-storyboard-3d-action="timeline-follow-delete" data-clip-id="' +
          escape(handle['id']) +
          '">删除跟拍段</button></div>',
      )
      ['join']('')
  );
}
export function changeDirectorFollow(state, event) {
  const el = event['target'];
  if (!el['matches']?.('[data-director-follow]')) return false;
  const config = el['closest']('[data-director-follow-clip]')?.['dataset']['directorFollowClip'];
  return (
    state['mutate']('调整跟拍方式与片段', (scope) => {
      const enabled = config
        ? scope['cameraConstraintClips']['find']((input) => input['id'] === config)
        : scope['cameraConstraint'];
      if (!enabled) return scope;
      const [output, value2] = el['dataset']['directorFollow']['split']('-'),
        value3 = el['type'] === 'number' ? Number(el['value']) : el['value'];
      if (el['type'] === 'number' && !Number['isFinite'](value3)) return scope;
      if (value2 != null) enabled[output][Number(value2)] = value3;
      else {
        enabled[output] = value3;
        if (
          output === 'mode' &&
          value3 === 'fixed' &&
          enabled['followOffset']['every']((count) => count === 0)
        )
          enabled['followOffset'] = [0, 2, 5];
      }
      return scope;
    }),
    true
  );
}
export function clickDirectorFollow(value4, enabled2, el2) {
  if (!enabled2['startsWith']('timeline-follow-')) return false;
  return (
    value4['mutate']('编辑分段跟拍', (value5) => {
      if (enabled2 === 'timeline-follow-delete')
        value5['cameraConstraintClips'] = value5['cameraConstraintClips']['filter'](
          (value6) => value6['id'] !== el2['dataset']['clipId'],
        );
      if (enabled2 === 'timeline-follow-add') {
        const start = Math['min'](3599, value4['timeline']['_timeForShot'](value4['context']()['shot']));
        value5['cameraConstraintClips']['push']({
          ...structuredClone(value5['cameraConstraint']),
          id: 'follow-' + globalThis['crypto']['randomUUID'](),
          start: start,
          end: Math['min'](3600, start + 3),
        });
      }
      return value5;
    }),
    value4['timeline']['requestRender']?.(),
    true
  );
}
