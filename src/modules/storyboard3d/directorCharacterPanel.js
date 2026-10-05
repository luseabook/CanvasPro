import {
  DIRECTOR_CHARACTER_COLORS,
  DIRECTOR_POSE_CHANNELS,
  applyDirectorPoseChannel,
  createDirectorCrowd,
} from './directorCharacterAuthoring.js';
import { STORYBOARD_3D_BODY_PRESETS, quaternionToStoryboard3DEuler } from './characterRig.js';
const escape = (value) =>
  String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('<', '&lt;');
export class DirectorCharacterPanel {
  constructor(item) {
    ((this['panel'] = item),
      (this['poseName'] = '自定义姿势'),
      (this['poseId'] = ''),
      (this['crowd'] = { rows: 2, cols: 3, spacing: 1.8, yaw: 0 }));
  }
  ['render']() {
    const { project: project, object: object } = this['panel']['context']();
    if (object?.['type'] !== 'character') return '';
    const key =
      object['heightCm'] ||
      (STORYBOARD_3D_BODY_PRESETS['find']((index) => index['id'] === object['bodyPresetId'])?.['height'] ||
        1.78) * 100;
    return (
      '<fieldset data-director-character><legend>角色造型与群众</legend><div class="storyboard-3d-director-fields">\n      <label>身高 / 厘米<input type="number" min="55" max="230" step="1" value="' +
      key +
      '" data-director-character="heightCm"></label>\n      <label>辨识色<select data-director-character="colorKey">' +
      DIRECTOR_CHARACTER_COLORS['map'](
        (result, data) =>
          '<option value="' +
          result +
          '" ' +
          (result === (object['colorKey'] || 'blue') ? 'selected' : '') +
          '>' +
          ['蓝', '红', '绿', '黄', '紫', '青', '白', '黑'][data] +
          '</option>',
      )['join']('') +
      '</select></label>\n    </div><details><summary>语义姿势调节</summary><div class="storyboard-3d-director-fields">' +
      DIRECTOR_POSE_CHANNELS['map'](([options, target, source, next, current], entry) => {
        const storyboard3DEuler =
          (quaternionToStoryboard3DEuler(object['boneOverrides']?.[target])[source] * 180) / Math['PI'];
        return (
          '<label>' +
          options +
          '<input type="range" min="' +
          next +
          '" max="' +
          current +
          '" step="1" value="' +
          storyboard3DEuler +
          '" data-director-pose-channel="' +
          entry +
          '"><output>' +
          storyboard3DEuler['toFixed'](0) +
          '°</output></label>'
        );
      })['join']('') +
      '</div></details><div class="storyboard-3d-director-fields">\n      <label>姿势名称<input maxlength="120" data-director-pose-name value="' +
      escape(this['poseName']) +
      '"></label><button data-storyboard-3d-action="timeline-character-save-pose">保存当前姿势</button>\n      <label>项目姿势库<select data-director-pose-id><option value="">选择姿势</option>' +
      (project['poseLibrary'] || [])
        ['map'](
          (record) =>
            '<option value="' +
            escape(record['id']) +
            '" ' +
            (record['id'] === this['poseId'] ? 'selected' : '') +
            '>' +
            escape(record['name']) +
            '</option>',
        )
        ['join']('') +
      '</select></label><button data-storyboard-3d-action="timeline-character-apply-pose">应用姿势</button><button data-storyboard-3d-action="timeline-character-delete-pose">移除姿势</button>\n    </div><div class="storyboard-3d-director-fields">' +
      Object['entries'](this['crowd'])
        ['map'](
          ([payload, handle], state) =>
            '<label>' +
            ['行数', '列数', '间距 / 米', '朝向 / 度'][state] +
            '<input type="number" step="' +
            (payload === 'spacing' ? 0.1 : 1) +
            '" value="' +
            handle +
            '" data-director-crowd="' +
            payload +
            '"></label>',
        )
        ['join']('') +
      '<button data-storyboard-3d-action="timeline-character-crowd">创建群众阵列</button></div></fieldset>'
    );
  }
  ['mutate'](config, handler, { requireUnlocked: requireUnlocked = true } = {}) {
    const { scene: scene, object: object2 } = this['panel']['context']();
    if (object2?.['type'] !== 'character') return;
    if (requireUnlocked && object2['locked']) {
      this['panel']['timeline']['setMessage']?.('请先解锁角色。');
      return;
    }
    this['panel']['timeline']['stopPlayback']({ render: false });
    try {
      this['panel']['timeline']['commitMutation']({
        type: 'director-character',
        label: config,
        mutate: (scope) => {
          const input = scope['scenes']['find']((output) => output['id'] === scene['id']),
            value2 = input?.['objects']['find']((value3) => value3['id'] === object2['id']);
          if (value2?.['type'] === 'character') handler(scope, input, value2);
          return scope;
        },
      });
    } catch (value4) {
      this['panel']['timeline']['setMessage']?.(value4['message']);
    }
  }
  ['change'](event) {
    const el = event['target'];
    if (el['matches']?.('[data-director-pose-name]')) return ((this['poseName'] = el['value']), true);
    if (el['matches']?.('[data-director-pose-id]')) return ((this['poseId'] = el['value']), true);
    if (el['matches']?.('[data-director-crowd]'))
      return ((this['crowd'][el['dataset']['directorCrowd']] = Number(el['value'])), true);
    if (el['matches']?.('[data-director-character]'))
      return (
        this['mutate']('调整角色造型', (value5, value6, value7) => {
          value7[el['dataset']['directorCharacter']] =
            el['type'] === 'number' ? Number(el['value']) : el['value'];
        }),
        true
      );
    if (el['matches']?.('[data-director-pose-channel]'))
      return (
        this['mutate']('调整角色姿势', (value8, value9, value10) =>
          Object['assign'](
            value10,
            applyDirectorPoseChannel(
              value10,
              Number(el['dataset']['directorPoseChannel']),
              Number(el['value']),
            ),
          ),
        ),
        true
      );
    return false;
  }
  ['click'](enabled) {
    if (!enabled['startsWith']('timeline-character-')) return false;
    return (
      this['mutate'](
        '角色姿势与群众编排',
        (value11, value12, value13) => {
          if (enabled === 'timeline-character-save-pose') {
            if ((value11['poseLibrary'] || [])['length'] >= 200)
              throw new Error('项目姿势库最多保存 200 项。');
            const {
                actionId: actionId,
                actionTime: actionTime,
                leftHandPoseId: leftHandPoseId,
                rightHandPoseId: rightHandPoseId,
                boneOverrides: boneOverrides,
              } = value13,
              value14 = {
                id: 'pose-' + globalThis['crypto']['randomUUID'](),
                name: this['poseName']['trim']() || '自定义姿势',
                actionId: actionId,
                actionTime: actionTime,
                leftHandPoseId: leftHandPoseId,
                rightHandPoseId: rightHandPoseId,
                boneOverrides: structuredClone(boneOverrides || {}),
              };
            ((value11['poseLibrary'] ||= [])['push'](value14), (this['poseId'] = value14['id']));
          }
          if (enabled === 'timeline-character-delete-pose')
            value11['poseLibrary'] = (value11['poseLibrary'] || [])['filter'](
              (value15) => value15['id'] !== this['poseId'],
            );
          if (enabled === 'timeline-character-apply-pose') {
            const enabled2 = value11['poseLibrary']?.['find']((value16) => value16['id'] === this['poseId']);
            if (!enabled2) return;
            const { id: id, name: name, ...args } = enabled2;
            Object['assign'](value13, structuredClone(args), { actionPlaying: false });
          }
          if (enabled === 'timeline-character-crowd')
            value12['objects'] = createDirectorCrowd(value12, value13, this['crowd'])['objects'];
        },
        {
          requireUnlocked:
            enabled !== 'timeline-character-save-pose' && enabled !== 'timeline-character-delete-pose',
        },
      ),
      this['panel']['timeline']['requestRender']?.(),
      true
    );
  }
}
