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
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('<', '&lt;');
export class DirectorCharacterPanel {
  constructor(item) {
    ((this['panel'] = item),
      (this['poseName'] = '自定义姿势'),
      (this['poseId'] = ''),
      (this['crowd'] = { rows: 0x2, cols: 0x3, spacing: 1.8, yaw: 0x0 }));
  }
  ['render']() {
    const { project: project, object: object } = this['panel']['context']();
    if (object?.['type'] !== 'character') return '';
    const key =
      object['heightCm'] ||
      (STORYBOARD_3D_BODY_PRESETS['find']((index) => index['id'] === object['bodyPresetId'])?.['height'] ||
        1.78) * 0x64;
    return (
      '<fieldset\x20data-director-character><legend>角色造型与群众</legend><div\x20class=\x22storyboard-3d-director-fields\x22>\x0a\x20\x20\x20\x20\x20\x20<label>身高\x20/\x20厘米<input\x20type=\x22number\x22\x20min=\x2255\x22\x20max=\x22230\x22\x20step=\x221\x22\x20value=\x22' +
      key +
      '" data-director-character="heightCm"></label>\n      <label>辨识色<select data-director-character="colorKey">' +
      DIRECTOR_CHARACTER_COLORS['map'](
        (result, data) =>
          '<option value="' +
          result +
          '\x22\x20' +
          (result === (object['colorKey'] || 'blue') ? 'selected' : '') +
          '>' +
          ['蓝', '红', '绿', '黄', '紫', '青', '白', '黑'][data] +
          '</option>',
      )['join']('') +
      '</select></label>\n    </div><details><summary>语义姿势调节</summary><div class="storyboard-3d-director-fields">' +
      DIRECTOR_POSE_CHANNELS['map'](([options, target, source, next, current], entry) => {
        const storyboard3DEuler =
          (quaternionToStoryboard3DEuler(object['boneOverrides']?.[target])[source] * 0xb4) / Math['PI'];
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
          storyboard3DEuler['toFixed'](0x0) +
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
            '\x22\x20' +
            (record['id'] === this['poseId'] ? 'selected' : '') +
            '>' +
            escape(record['name']) +
            '</option>',
        )
        ['join']('') +
      '</select></label><button\x20data-storyboard-3d-action=\x22timeline-character-apply-pose\x22>应用姿势</button><button\x20data-storyboard-3d-action=\x22timeline-character-delete-pose\x22>移除姿势</button>\x0a\x20\x20\x20\x20</div><div\x20class=\x22storyboard-3d-director-fields\x22>' +
      Object['entries'](this['crowd'])
        ['map'](
          ([payload, handle], state) =>
            '<label>' +
            ['行数', '列数', '间距\x20/\x20米', '朝向 / 度'][state] +
            '<input type="number" step="' +
            (payload === 'spacing' ? 0.1 : 0x1) +
            '" value="' +
            handle +
            '" data-director-crowd="' +
            payload +
            '"></label>',
        )
        ['join']('') +
      '<button\x20data-storyboard-3d-action=\x22timeline-character-crowd\x22>创建群众阵列</button></div></fieldset>'
    );
  }
  ['mutate'](config, handler, { requireUnlocked: requireUnlocked = !![] } = {}) {
    const { scene: scene, object: object2 } = this['panel']['context']();
    if (object2?.['type'] !== 'character') return;
    if (requireUnlocked && object2['locked']) {
      this['panel']['timeline']['setMessage']?.('请先解锁角色。');
      return;
    }
    this['panel']['timeline']['stopPlayback']({ render: ![] });
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
    if (el['matches']?.('[data-director-pose-name]')) return ((this['poseName'] = el['value']), !![]);
    if (el['matches']?.('[data-director-pose-id]')) return ((this['poseId'] = el['value']), !![]);
    if (el['matches']?.('[data-director-crowd]'))
      return ((this['crowd'][el['dataset']['directorCrowd']] = Number(el['value'])), !![]);
    if (el['matches']?.('[data-director-character]'))
      return (
        this['mutate']('调整角色造型', (value5, value6, value7) => {
          value7[el['dataset']['directorCharacter']] =
            el['type'] === 'number' ? Number(el['value']) : el['value'];
        }),
        !![]
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
        !![]
      );
    return ![];
  }
  ['click'](enabled) {
    if (!enabled['startsWith']('timeline-character-')) return ![];
    return (
      this['mutate'](
        '角色姿势与群众编排',
        (value11, value12, value13) => {
          if (enabled === 'timeline-character-save-pose') {
            if ((value11['poseLibrary'] || [])['length'] >= 0xc8)
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
            Object['assign'](value13, structuredClone(args), { actionPlaying: ![] });
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
      !![]
    );
  }
}
