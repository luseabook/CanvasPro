import { STORYBOARD_3D_ACTIONS } from './characterRig.js';
import {
  DIRECTOR_CAMERA_MOTIONS,
  applyDirectorCameraMotion,
  applyDirectorObjectPath,
} from './directorAuthoring.js';
import { normalizeStoryboard3DShotAnimation, upsertStoryboard3DCameraKeyframe } from './shotAnimation.js';
import { DIRECTOR_CAMERA_PRESETS, createDirectorCameraPreset } from './directorCameraPresets.js';
import {
  renderDirectorFollowPanel,
  changeDirectorFollow,
  clickDirectorFollow,
} from './directorFollowPanel.js';
import { DirectorCharacterPanel } from './directorCharacterPanel.js';
import { DirectorScenePanel } from './directorScenePanel.js';
import { DirectorDeliveryPanel } from './directorDeliveryPanel.js';
import { DirectorGenerationPanel } from './directorGenerationPanel.js';
import { DirectorMobileCamera } from './directorMobileCamera.js';
const escapeHtml = (value) =>
    String(value ?? '')
      ['replaceAll']('&', '&amp;')
      ['replaceAll']('"', '&quot;')
      ['replaceAll']('<', '&lt;')
      ['replaceAll']('>', '&gt;'),
  options = (list, item) =>
    list['map'](
      ([key, index]) =>
        '<option value="' +
        escapeHtml(key) +
        '" ' +
        (key === item ? 'selected' : '') +
        '>' +
        escapeHtml(index) +
        '</option>',
    )['join'](''),
  input = (result, data, target, source = '') =>
    '<label>' +
    result +
    '<input type="number" step="0.1" value="' +
    target +
    '" data-director-field="' +
    data +
    '" ' +
    source +
    '></label>';
export class DirectorTimelinePanel {
  constructor(next) {
    ((this['timeline'] = next),
      (this['characters'] = new DirectorCharacterPanel(this)),
      (this['scenePanel'] = new DirectorScenePanel(this)),
      (this['delivery'] = new DirectorDeliveryPanel(this)),
      (this['generation'] = new DirectorGenerationPanel(this)),
      (this['mobile'] = new DirectorMobileCamera(this)),
      (this['open'] = ![]),
      (this['drafts'] = new Map()));
  }
  ['draft'](current, entry) {
    const record = current['id'] + ':' + (entry?.['id'] || 'camera');
    if (!this['drafts']['has'](record))
      this['drafts']['set'](record, {
        preset: 'push',
        cameraPreset: 'front-medium',
        duration: 3,
        amount: 3,
        append: ![],
        start: 0,
        actionId: 'walking-left',
        speed: 1,
        orient: !![],
        points: [],
        span: 12,
        pathDuration: 3,
      });
    return this['drafts']['get'](record);
  }
  ['context']() {
    const args = this['timeline']['_context'](),
      object = args['scene']?.['objects']['find'](
        (payload) => payload['id'] === args['editorState']['selectedObjectIds']?.['at'](-1),
      );
    return {
      ...args,
      object: object && !['group', 'camera', 'light']['includes'](object['type']) ? object : null,
    };
  }
  ['render']() {
    if (!this['open']) return '';
    const { scene: scene, shot: shot, object: object2 } = this['context']();
    if (!shot) return '';
    const handle = this['draft'](shot, object2),
      storyboard3DShotAnimation = normalizeStoryboard3DShotAnimation(shot['animation']),
      state = storyboard3DShotAnimation['cameraConstraint'],
      config = [
        ['', '无'],
        ...scene['objects']
          ['filter']((scope) => !['camera', 'group', 'light']['includes'](scope['type']))
          ['map']((error) => [error['id'], error['name']]),
      ],
      output = object2?.['transform']['position'] || [0, 0, 0],
      list2 = handle['points']['map'](
        (value2) =>
          50 +
          ((value2[0] - output[0]) / handle['span']) * 100 +
          ',' +
          (50 + ((value2[2] - output[2]) / handle['span']) * 100),
      ),
      list3 = storyboard3DShotAnimation['actionClips']['filter'](
        (value3) => value3['objectId'] === object2?.['id'],
      );
    return (
      '<div class="storyboard-3d-director-panel" data-director-panel>\n      ' +
      this['timeline']['cameraPath']['render'](storyboard3DShotAnimation) +
      '\n      ' +
      this['characters']['render']() +
      '\n      ' +
      this['scenePanel']['render']() +
      '\n      ' +
      this['delivery']['render']() +
      '\n      ' +
      this['generation']['render']() +
      '\n      ' +
      this['mobile']['render']() +
      '\n      <fieldset><legend>摄像机运镜</legend><div class="storyboard-3d-director-fields">\n        <label>机位<select data-director-field="cameraPreset">' +
      options(
        DIRECTOR_CAMERA_PRESETS['map']((error2) => [error2['id'], error2['name']]),
        handle['cameraPreset'],
      ) +
      '</select></label><button type="button" data-storyboard-3d-action="timeline-director-camera-preset">应用到当前帧</button>\n      </div><div class="storyboard-3d-director-fields">\n        <label>预设<select data-director-field="preset">' +
      options(DIRECTOR_CAMERA_MOTIONS, handle['preset']) +
      '</select></label>\n        ' +
      input('时长 / 秒', 'duration', handle['duration'], 'min="0.1" max="3600"') +
      input('移动距离 / 米', 'amount', handle['amount'], 'min="0.1" max="100"') +
      '\n        <label><input type="checkbox" data-director-field="append" ' +
      (handle['append'] ? 'checked' : '') +
      '>追加到末尾</label>\n        <button type="button" data-storyboard-3d-action="timeline-director-motion">应用运镜</button>\n      </div><div class="storyboard-3d-director-fields">\n        <label>跟随目标<select data-director-constraint="followObjectId">' +
      options(config, state['followObjectId']) +
      '</select></label>\n        <label>注视目标<select data-director-constraint="lookAtObjectId">' +
      options(config, state['lookAtObjectId']) +
      '</select></label>\n        <label><input type="checkbox" data-director-constraint="followHeading" ' +
      (state['followHeading'] ? 'checked' : '') +
      '>跟随朝向</label>\n        <label>注视高度 / 米<input type="number" step="0.1" value="' +
      state['lookAtOffset'][1] +
      '" data-director-constraint="lookAtHeight"></label>\n      </div>' +
      renderDirectorFollowPanel(storyboard3DShotAnimation, config) +
      '</fieldset>\n      <fieldset><legend>' +
      escapeHtml(object2?.['name'] || '选择角色或物体后编排走位与动作') +
      '</legend>\n        <div class="storyboard-3d-director-fields">' +
      input('开始 / 秒', 'start', handle['start'], 'min="0" max="3599.9"') +
      input('走位 / 动作时长', 'pathDuration', handle['pathDuration'], 'min="0.1" max="3600"') +
      '\n          ' +
      input('地图范围 / 米', 'span', handle['span'], 'min="2" max="200"') +
      '\n          <label><input type="checkbox" data-director-field="orient" ' +
      (handle['orient'] ? 'checked' : '') +
      '>朝向路径</label>\n        </div>\n        <div class="storyboard-3d-director-path-row"><button type="button" class="storyboard-3d-director-path-map" data-storyboard-3d-action="timeline-director-point" aria-label="俯视走位图，点击添加路径点" ' +
      (object2 ? '' : 'disabled') +
      '>\n          <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 0V100 M0 50H100"/><polyline points="' +
      list2['join'](' ') +
      '"/>' +
      list2['map'](
        (value4, value5) =>
          '<circle cx="' +
          value4['split'](',')[0] +
          '" cy="' +
          value4['split'](',')[1] +
          '" r="1.8"/><text x="' +
          (Number(value4['split'](',')[0]) + 2) +
          '" y="' +
          (Number(value4['split'](',')[1]) - 2) +
          '">' +
          (value5 + 1) +
          '</text>',
      )['join']('') +
      '<text x="52" y="8">−Z</text><text x="89" y="48">+X</text></svg>\n        </button><div class="storyboard-3d-director-path-points">\n          ' +
      (handle['points']
        ['map'](
          (list4, value6) =>
            '<div><b>' +
            (value6 + 1) +
            '</b>' +
            list4['map'](
              (value7, value8) =>
                '<input aria-label="路径点 ' +
                (value6 + 1) +
                ' ' +
                ['X', 'Y', 'Z'][value8] +
                '" type="number" step="0.1" value="' +
                value7['toFixed'](2) +
                '" data-director-point="' +
                value6 +
                '" data-axis="' +
                value8 +
                '">',
            )['join']('') +
            '<button type="button" data-storyboard-3d-action="timeline-director-remove-point" data-index="' +
            value6 +
            '" aria-label="删除路径点 ' +
            (value6 + 1) +
            '">×</button></div>',
        )
        ['join']('') || '点击俯视图设置走位；首点自动使用物体当前位置。') +
      '\n        </div></div><div class="storyboard-3d-director-fields"><button type="button" data-storyboard-3d-action="timeline-director-path" ' +
      (object2 && handle['points']['length'] > 1 ? '' : 'disabled') +
      '>生成走位关键帧</button><button type="button" data-storyboard-3d-action="timeline-director-clear-path">清空路径草稿</button></div>\n        ' +
      (object2?.['type'] === 'character'
        ? '<div class="storyboard-3d-director-fields"><label>动作<select data-director-field="actionId">' +
          options(
            STORYBOARD_3D_ACTIONS['map']((error3) => [error3['id'], error3['name']]),
            handle['actionId'],
          ) +
          '</select></label>' +
          input('播放倍速', 'speed', handle['speed'], 'min="0.1" max="4"') +
          '<button type="button" data-storyboard-3d-action="timeline-director-add-clip">添加动作片段</button></div>\n        <div class="storyboard-3d-director-clips">' +
          list3['map'](
            (value9) =>
              '<div data-director-clip="' +
              escapeHtml(value9['id']) +
              '"><strong>' +
              escapeHtml(
                STORYBOARD_3D_ACTIONS['find']((value10) => value10['id'] === value9['actionId'])?.['name'],
              ) +
              '</strong>' +
              ['start', 'end', 'speed']
                ['map'](
                  (value11) =>
                    '<label>' +
                    { start: '开始', end: '结束', speed: '倍速' }[value11] +
                    '<input type="number" step="0.1" value="' +
                    value9[value11] +
                    '" data-director-clip-field="' +
                    value11 +
                    '"></label>',
                )
                ['join']('') +
              '<button type="button" data-storyboard-3d-action="timeline-director-copy-clip" data-clip-id="' +
              escapeHtml(value9['id']) +
              '">复制到末尾</button><button type="button" data-storyboard-3d-action="timeline-director-delete-clip" data-clip-id="' +
              escapeHtml(value9['id']) +
              '">删除</button></div>',
          )['join']('') +
          '</div>'
        : '') +
      '\n      </fieldset>\n    </div>'
    );
  }
  ['mutate'](value12, value13) {
    (this['timeline']['stopPlayback']({ render: ![] }),
      this['timeline']['_mutateAnimation']('director-motion', value12, value13));
    const { shot: shot2 } = this['context']();
    if (shot2) this['timeline']['_sampleAt'](this['timeline']['_timeForShot'](shot2));
  }
  ['handleClick'](enabled, el, event) {
    if (this['mobile']['click'](enabled)) return !![];
    if (this['generation']['click'](enabled, el)) return !![];
    if (this['delivery']['click'](enabled, el)) return !![];
    if (this['scenePanel']['click'](enabled, el)) return !![];
    if (this['characters']['click'](enabled)) return !![];
    if (clickDirectorFollow(this, enabled, el)) return !![];
    if (this['timeline']['cameraPath']['handleClick'](enabled)) return !![];
    if (!enabled['startsWith']('timeline-director-')) return ![];
    if (enabled === 'timeline-director-toggle') {
      this['open'] = !this['open'];
      !this['open'] &&
        (this['timeline']['cameraPath']['stop'](), this['mobile']['disconnect']({ render: ![] }));
      if (this['open']) this['timeline']['expandDirectorPanel']?.();
      return (this['timeline']['requestRender']?.(), !![]);
    }
    const { scene: scene2, shot: shot3, object: object3 } = this['context']();
    if (!shot3 || el['disabled']) return !![];
    const preset = this['draft'](shot3, object3);
    try {
      switch (enabled) {
        case 'timeline-director-camera-preset':
          this['mutate']('应用机位预设', (value14) =>
            upsertStoryboard3DCameraKeyframe(value14, {
              time: this['timeline']['_timeForShot'](shot3),
              camera: createDirectorCameraPreset(scene2, {
                preset: preset['cameraPreset'],
                objectId: object3?.['id'],
                camera: shot3['camera'],
              }),
            }),
          );
          break;
        case 'timeline-director-motion':
          this['mutate']('应用摄像机运镜', (camera) =>
            applyDirectorCameraMotion(camera, {
              ...preset,
              camera: camera['cameraConstraint']['followObjectId']
                ? shot3['camera']
                : this['timeline']['readCurrentCamera']?.() || shot3['camera'],
            }),
          );
          break;
        case 'timeline-director-point': {
          if (!object3 || !event || preset['points']['length'] >= 100) break;
          const box = el['getBoundingClientRect']();
          if (!preset['points']['length']) preset['points']['push']([...object3['transform']['position']]);
          const value15 = object3['transform']['position'];
          preset['points']['push']([
            value15[0] + ((event['clientX'] - box['left']) / box['width'] - 0.5) * preset['span'],
            value15[1],
            value15[2] + ((event['clientY'] - box['top']) / box['height'] - 0.5) * preset['span'],
          ]);
          break;
        }
        case 'timeline-director-remove-point':
          preset['points']['splice'](Number(el['dataset']['index']), 1);
          break;
        case 'timeline-director-clear-path':
          preset['points'] = [];
          break;
        case 'timeline-director-path':
          this['mutate']('生成物体走位', (value16) =>
            applyDirectorObjectPath(value16, {
              ...preset,
              duration: preset['pathDuration'],
              object: object3,
            }),
          );
          break;
        case 'timeline-director-add-clip':
          if (object3?.['type'] !== 'character') break;
          this['mutate']('添加角色动作片段', (args2) =>
            normalizeStoryboard3DShotAnimation({
              ...args2,
              actionClips: [
                ...args2['actionClips'],
                {
                  id: 'clip-' + globalThis['crypto']['randomUUID'](),
                  objectId: object3['id'],
                  actionId: preset['actionId'],
                  start: preset['start'],
                  end: preset['start'] + preset['pathDuration'],
                  speed: preset['speed'],
                },
              ],
            }),
          );
          break;
        case 'timeline-director-delete-clip':
          this['mutate']('删除动作片段', (actionClips) => ({
            ...actionClips,
            actionClips: actionClips['actionClips']['filter'](
              (value17) => value17['id'] !== el['dataset']['clipId'],
            ),
          }));
          break;
        case 'timeline-director-copy-clip':
          this['mutate']('复制动作片段', (args3) => {
            const args4 = args3['actionClips']['find'](
              (value18) => value18['id'] === el['dataset']['clipId'],
            );
            if (!args4) return args3;
            const start2 = Math['max'](
              ...args3['actionClips']
                ['filter']((value19) => value19['objectId'] === args4['objectId'])
                ['map']((value20) => value20['end']),
            );
            if (start2 + args4['end'] - args4['start'] > 3600) throw new Error('动作片段超过时长上限。');
            return normalizeStoryboard3DShotAnimation({
              ...args3,
              actionClips: [
                ...args3['actionClips'],
                {
                  ...args4,
                  id: 'clip-' + globalThis['crypto']['randomUUID'](),
                  start: start2,
                  end: start2 + args4['end'] - args4['start'],
                },
              ],
            });
          });
          break;
      }
      this['timeline']['requestRender']?.();
    } catch (error4) {
      this['timeline']['setMessage']?.(error4['message']);
    }
    return !![];
  }
  ['handleChange'](event2) {
    if (this['generation']['change'](event2)) return !![];
    if (this['delivery']['change'](event2)) return !![];
    if (this['scenePanel']['change'](event2)) return !![];
    if (this['characters']['change'](event2)) return !![];
    if (changeDirectorFollow(this, event2)) return !![];
    if (this['timeline']['cameraPath']['handleChange'](event2)) return !![];
    const el2 = event2['target'],
      { shot: shot4, object: object4 } = this['context']();
    if (!shot4) return ![];
    const value21 = this['draft'](shot4, object4);
    if (el2['matches']?.('[data-director-field]')) {
      const value22 = el2['dataset']['directorField'];
      value21[value22] =
        el2['type'] === 'checkbox'
          ? el2['checked']
          : el2['type'] === 'number'
            ? Number(el2['value'])
            : el2['value'];
      if (value22 === 'span')
        value21['span'] = Math['max'](2, Math['min'](200, Number(value21['span']) || 12));
      if (value22 === 'span') this['refreshMap']();
      return !![];
    }
    if (el2['matches']?.('[data-director-point]')) {
      const value23 = value21['points'][Number(el2['dataset']['directorPoint'])],
        value24 = Number(el2['value']);
      if (value23 && Number['isFinite'](value24)) value23[Number(el2['dataset']['axis'])] = value24;
      return (this['refreshMap'](), !![]);
    }
    if (el2['matches']?.('[data-director-constraint]')) {
      const value25 = el2['dataset']['directorConstraint'];
      return (
        this['mutate']('修改摄像机跟随与注视', (value26) => {
          if (value25 === 'lookAtHeight')
            value26['cameraConstraint']['lookAtOffset'][1] = Number(el2['value']) || 0;
          else
            value26['cameraConstraint'][value25] = el2['type'] === 'checkbox' ? el2['checked'] : el2['value'];
          return normalizeStoryboard3DShotAnimation(value26);
        }),
        !![]
      );
    }
    if (el2['matches']?.('[data-director-clip-field]')) {
      const value27 = el2['closest']('[data-director-clip]')?.['dataset']['directorClip'];
      if (
        shot4['animation']['actionClips']['find']((value28) => value28['id'] === value27)?.[
          el2['dataset']['directorClipField']
        ] === Number(el2['value'])
      )
        return !![];
      return (
        this['mutate']('调整动作片段', (value29) => {
          const value30 = value29['actionClips']['find']((value31) => value31['id'] === value27);
          if (value30) value30[el2['dataset']['directorClipField']] = Number(el2['value']);
          return normalizeStoryboard3DShotAnimation(value29);
        }),
        !![]
      );
    }
    return ![];
  }
  ['refreshMap']() {
    const enabled2 = this['timeline']
      ['getRoot']?.()
      ?.['querySelector']('.storyboard-3d-director-path-map svg');
    if (!enabled2) return;
    const el3 = enabled2['ownerDocument']['createElement']('template');
    el3['innerHTML'] = this['render']();
    const value32 = el3['content']['querySelector']('.storyboard-3d-director-path-map svg');
    if (value32) enabled2['replaceWith'](value32);
  }
  ['destroy']() {
    (this['generation']['destroy'](),
      this['mobile']['destroy'](),
      this['delivery']['destroy'](),
      this['scenePanel']['destroy'](),
      this['drafts']['clear']());
  }
}
