import { STORYBOARD_3D_ACTIONS } from './characterRig.js';
const ACTION_IDS = new Set(STORYBOARD_3D_ACTIONS['map']((value) => value['id'])),
  finite = (item, key = 0x0) => (Number['isFinite'](Number(item)) ? Number(item) : key),
  vector = (index, result = [0x0, 0x0, 0x0]) =>
    result['map']((data, options) => finite(index?.[options], data)),
  bounded = (target, source, next, current) =>
    Math['max'](source, Math['min'](next, finite(target, current)));
function normalizeConstraint(entry, handler) {
  return {
    mode: ['relative', 'path', 'fixed']['includes'](entry['mode']) ? entry['mode'] : 'relative',
    followOffset: vector(entry['followOffset']),
    followObjectId: handler(entry['followObjectId']) ? entry['followObjectId'] : '',
    lookAtObjectId: handler(entry['lookAtObjectId']) ? entry['lookAtObjectId'] : '',
    followHeading: entry['followHeading'] === !![],
    lookAtOffset: vector(entry['lookAtOffset'], [0x0, 1.2, 0x0]),
  };
}
export function normalizeDirectorMotion(options2 = {}, map = null) {
  const run = (record) => typeof record === 'string' && record && (!map || map['has'](record)),
    payload = options2['cameraConstraint'] || {},
    constraint = normalizeConstraint(payload, run),
    handle = (Array['isArray'](options2['cameraConstraintClips']) ? options2['cameraConstraintClips'] : [])
      ['slice'](0x0, 0x12c)
      ['map']((state, config) => {
        const bounded2 = bounded(state['start'], 0x0, 3599.9, 0x0);
        return {
          id: String(state['id'] || 'follow-' + config),
          start: bounded2,
          end: bounded(state['end'], bounded2 + 0.1, 0xe10, bounded2 + 0x1),
          ...normalizeConstraint(state, run),
        };
      })
      ['sort'](
        (scope, input) => scope['start'] - input['start'] || scope['id']['localeCompare'](input['id']),
      ),
    output = (Array['isArray'](options2['actionClips']) ? options2['actionClips'] : [])
      ['filter']((value2) => run(value2['objectId']) && ACTION_IDS['has'](value2['actionId']))
      ['map']((value3, value4) => {
        const bounded3 = bounded(value3['start'], 0x0, 3599.9, 0x0);
        return {
          id: String(value3['id'] || 'action-clip-' + (value4 + 0x1)),
          objectId: value3['objectId'],
          actionId: value3['actionId'],
          start: bounded3,
          end: bounded(value3['end'], bounded3 + 0.1, 0xe10, bounded3 + 0x1),
          speed: bounded(value3['speed'], 0.1, 0x4, 0x1),
          offset: bounded(value3['offset'], 0x0, 0xe10, 0x0),
        };
      })
      ['sort'](
        (value5, value6) => value5['start'] - value6['start'] || value5['id']['localeCompare'](value6['id']),
      );
  return { cameraConstraint: constraint, cameraConstraintClips: handle, actionClips: output };
}
export function directorConstraintAt(value7, value8) {
  return (
    value7['cameraConstraintClips']
      ['filter']((value9) => value8 >= value9['start'] && value8 < value9['end'])
      ['at'](-0x1) || value7['cameraConstraint']
  );
}
export function applyDirectorCameraConstraint(args, args2, value10, value11) {
  if (!args) return args;
  const value12 = { ...args, position: [...args['position']], target: [...args['target']] },
    value13 = value11[args2['followObjectId']],
    value14 = value10[args2['followObjectId']] || value13;
  if (value13 && value14 && args2['mode'] !== 'path') {
    const value15 = args2['followHeading']
        ? (value14['rotation']?.[0x1] || 0x0) - (value13['rotation']?.[0x1] || 0x0)
        : 0x0,
      value16 = Math['cos'](value15),
      value17 = Math['sin'](value15);
    for (const value18 of ['position', 'target']) {
      const value19 =
        args2['mode'] === 'fixed' && value18 === 'position'
          ? [...(args2['followOffset'] || [0x0, 0x2, 0x5])]
          : value12[value18]['map'](
              (value20, value21) =>
                value20 -
                value13['position'][value21] +
                (value18 === 'position' ? args2['followOffset']?.[value21] || 0x0 : 0x0),
            );
      value12[value18] = [
        value14['position'][0x0] + value19[0x0] * value16 + value19[0x2] * value17,
        value14['position'][0x1] + value19[0x1],
        value14['position'][0x2] - value19[0x0] * value17 + value19[0x2] * value16,
      ];
    }
  }
  const value22 =
      args2['lookAtObjectId'] ||
      (args2['mode'] === 'path' || args2['mode'] === 'fixed' ? args2['followObjectId'] : ''),
    value23 = value10[value22] || value11[value22];
  if (value23)
    value12['target'] = value23['position']['map'](
      (value24, value25) => value24 + args2['lookAtOffset'][value25],
    );
  return value12;
}
export function sampleDirectorActions(value26, value27, value28 = []) {
  return Object['fromEntries'](
    value28['filter']((value29) => value29['type'] === 'character')['map']((value30) => {
      const value31 = value26['filter'](
        (value32) =>
          value32['objectId'] === value30['id'] && value27 >= value32['start'] && value27 < value32['end'],
      )['at'](-0x1);
      return [
        value30['id'],
        value31
          ? {
              actionId: value31['actionId'],
              actionTime: value31['offset'] + (value27 - value31['start']) * value31['speed'],
            }
          : {
              actionId: value30['actionId'],
              actionTime: finite(value30['actionTime']) + (value30['actionPlaying'] ? value27 : 0x0),
            },
      ];
    }),
  );
}
