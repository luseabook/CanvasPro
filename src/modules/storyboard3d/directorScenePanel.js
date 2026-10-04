import { normalizeDirectorSceneSettings } from './directorSceneSettings.js';
import {
  DIRECTOR_AXIS_VIEWS,
  transformDirectorScene,
  findDirectorObstacleRoute,
  sampleDirectorGroundRoute,
} from './directorSceneAuthoring.js';
import { authorDirectorPath } from './directorPathAuthoring.js';
import { validateStoryboard3DBackgroundImageFile } from './backgroundImageController.js';
const escape = (value) =>
  String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('<', '&lt;');
export class DirectorScenePanel {
  constructor(item) {
    ((this['panel'] = item),
      (this['transform'] = { x: 0x0, y: 0x0, z: 0x0, yaw: 0x0, scale: 0x1 }),
      (this['loading'] = ![]),
      (this['disposed'] = ![]));
  }
  ['render']() {
    const { scene: scene } = this['panel']['context']();
    if (!scene) return '';
    const directorSceneSettings = normalizeDirectorSceneSettings(scene['directorSettings']);
    return (
      '<fieldset\x20data-director-scene\x20aria-busy=\x22' +
      this['loading'] +
      '"><legend>场景与全景</legend><div class="storyboard-3d-director-fields">\n      ' +
      DIRECTOR_AXIS_VIEWS['map'](
        ([key, index]) =>
          '<button data-storyboard-3d-action="timeline-scene-view" data-view="' +
          key +
          '\x22>' +
          index +
          '视图</button>',
      )['join']('') +
      '\n      <button data-storyboard-3d-action="timeline-scene-perspective">透视图</button><button data-storyboard-3d-action="timeline-scene-quad">四视图</button>\n      <label>显示<select data-director-scene="displayMode">' +
      [
        ['solid', '实体'],
        ['transparent', '半透明'],
        ['clay', '灰模'],
      ]
        ['map'](
          ([result, data]) =>
            '<option value="' +
            result +
            '\x22\x20' +
            (directorSceneSettings['displayMode'] === result ? 'selected' : '') +
            '>' +
            data +
            '</option>',
        )
        ['join']('') +
      '</select></label>\n      <label><input type="checkbox" data-director-scene="labels" ' +
      (directorSceneSettings['labels'] ? 'checked' : '') +
      '>对象标签</label><label><input type="checkbox" data-director-scene="groundVisible" ' +
      (directorSceneSettings['groundVisible'] ? 'checked' : '') +
      '>显示地面</label>\n      <label>地面高度 / 米<input type="number" step="0.1" data-director-scene="groundHeight" value="' +
      directorSceneSettings['groundHeight'] +
      '"></label><label>地面透明度<input type="number" min="0" max="1" step="0.05" data-director-scene="groundOpacity" value="' +
      directorSceneSettings['groundOpacity'] +
      '"></label>\n      <button data-storyboard-3d-action="timeline-scene-ground">选中物体贴合模型表面</button><button data-storyboard-3d-action="timeline-scene-path-ground">路线贴合模型表面</button><button data-storyboard-3d-action="timeline-scene-avoid">路线绕开障碍</button>\n    </div><details><summary>场景整体变换（含所有镜头与轨迹）</summary><div class="storyboard-3d-director-fields">' +
      Object['entries'](this['transform'])
        ['map'](
          ([options, target]) =>
            '<label>' +
            (options === 'yaw'
              ? '旋转\x20/\x20度'
              : options === 'scale'
                ? '缩放'
                : '平移 ' + options['toUpperCase']() + ' / 米') +
            '<input type="number" step="0.1" data-director-scene-transform="' +
            options +
            '\x22\x20value=\x22' +
            target +
            '"></label>',
        )
        ['join']('') +
      '<button data-storyboard-3d-action="timeline-scene-transform">应用整体变换</button></div></details>\n    <div class="storyboard-3d-director-fields"><label><input type="checkbox" data-director-panorama="enabled" ' +
      (directorSceneSettings['panorama']['enabled'] ? 'checked' : '') +
      '>球面全景</label>\n      <label>' +
      (this['loading'] ? '正在导入全景…' : '导入全景图片') +
      '<input\x20type=\x22file\x22\x20accept=\x22image/*\x22\x20data-director-panorama-file\x20' +
      (this['loading'] ? 'disabled' : '') +
      '></label>\n      <label>历史<select data-director-panorama="assetId"><option value="">选择全景</option>' +
      directorSceneSettings['panorama']['history']
        ['map'](
          (source) =>
            '<option value="' +
            escape(source['assetId']) +
            '\x22\x20' +
            (directorSceneSettings['panorama']['assetId'] === source['assetId'] ? 'selected' : '') +
            '>' +
            escape(source['name']) +
            '</option>',
        )
        ['join']('') +
      '</select></label>\n      <label>半径 / 米<input type="number" min="5" max="2000" value="' +
      directorSceneSettings['panorama']['radius'] +
      '" data-director-panorama="radius"></label>\n      ' +
      directorSceneSettings['panorama']['rotation']
        ['map'](
          (next, current) =>
            '<label>' +
            ['俯仰', '方位', '倾斜'][current] +
            ' / 度<input type="number" step="1" value="' +
            (next * 0xb4) / Math['PI'] +
            '" data-director-panorama="rotation-' +
            current +
            '"></label>',
        )
        ['join']('') +
      '\n    </div>' +
      (this['loading'] ? '<progress aria-label="正在导入全景"></progress>' : '') +
      '</fieldset>'
    );
  }
  ['mutate'](entry, handler) {
    const { scene: scene2, project: project } = this['panel']['context']();
    try {
      this['panel']['timeline']['commitMutation']({
        type: 'director-scene',
        label: entry,
        mutate: (record) => {
          if (record['id'] !== project['id']) return record;
          const payload = record['scenes']['find']((handle) => handle['id'] === scene2['id']);
          return (
            payload &&
              ((payload['directorSettings'] = normalizeDirectorSceneSettings(payload['directorSettings'])),
              handler(payload, record)),
            record
          );
        },
      });
    } catch (state) {
      this['panel']['timeline']['setMessage']?.(state['message']);
    }
  }
  ['change'](event) {
    const el = event['target'];
    if (el['matches']?.('[data-director-panorama-file]')) {
      const config = el['files']?.[0x0];
      el['value'] = '';
      if (config) void this['importPanorama'](config);
      return !![];
    }
    if (el['matches']?.('[data-director-scene-transform]'))
      return ((this['transform'][el['dataset']['directorSceneTransform']] = Number(el['value'])), !![]);
    if (el['matches']?.('[data-director-scene]'))
      return (
        this['mutate']('调整场景显示', (scope) => {
          scope['directorSettings'][el['dataset']['directorScene']] =
            el['type'] === 'checkbox'
              ? el['checked']
              : el['type'] === 'number'
                ? Number(el['value'])
                : el['value'];
        }),
        !![]
      );
    if (el['matches']?.('[data-director-panorama]'))
      return (
        this['mutate']('调整全景背景', (input) => {
          const [output, value2] = el['dataset']['directorPanorama']['split']('-');
          if (value2 != null)
            input['directorSettings']['panorama']['rotation'][Number(value2)] =
              (Number(el['value']) * Math['PI']) / 0xb4;
          else
            input['directorSettings']['panorama'][output] =
              el['type'] === 'checkbox'
                ? el['checked']
                : el['type'] === 'number'
                  ? Number(el['value'])
                  : el['value'];
        }),
        !![]
      );
    return ![];
  }
  ['click'](enabled, value3) {
    if (!enabled['startsWith']('timeline-scene-')) return ![];
    const enabled2 = this['panel']['timeline']['getRuntime']?.(),
      { object: object, scene: scene3 } = this['panel']['context']();
    if (!enabled2) return !![];
    if (enabled === 'timeline-scene-view') {
      const value4 = DIRECTOR_AXIS_VIEWS['find'](([value5]) => value5 === value3['dataset']['view']),
        args = enabled2['getSceneView']();
      value4 &&
        args &&
        (enabled2['setViewProjection']('orthographic'),
        enabled2['commitSceneView']({ ...args, orbitYaw: value4[0x2], orbitPitch: value4[0x3] }));
    }
    if (enabled === 'timeline-scene-perspective') enabled2['setViewProjection']('perspective');
    if (enabled === 'timeline-scene-quad') this['panel']['timeline']['multiView']?.['toggle']();
    if (enabled === 'timeline-scene-transform')
      this['mutate']('整体变换场景', (value6) =>
        Object['assign'](value6, transformDirectorScene(value6, this['transform'])),
      );
    if (enabled === 'timeline-scene-ground' && object && !object['locked']) {
      const value7 = enabled2['directorScene']['surfaceHeight'](
          object['transform']['position'][0x0],
          object['transform']['position'][0x2],
          [object['id']],
        ),
        value8 = enabled2['resolveObjectGroundPosition'](object['id']) || 0x0;
      this['mutate']('贴合模型表面', (value9) => {
        value9['objects']['find']((value10) => value10['id'] === object['id'])['transform']['position'][0x1] =
          value7 + value8;
      });
    }
    if (['timeline-scene-path-ground', 'timeline-scene-avoid']['includes'](enabled)) {
      const value11 = this['panel']['timeline']['cameraPath'],
        value12 = value11['points']()['map']((value13) => value13['camera']['position']),
        enabled3 = scene3['objects']['find']((value14) => value14['id'] === value11['objectId']);
      if (!enabled3 || enabled3['locked'] || value12['length'] < 0x2)
        return (
          this['panel']['timeline']['setMessage']?.('请先选择已解锁物体的路线，至少设置两个控制点。'),
          !![]
        );
      try {
        const value15 =
            enabled === 'timeline-scene-avoid'
              ? findDirectorObstacleRoute(
                  value12[0x0],
                  value12['at'](-0x1),
                  enabled2['directorScene']['obstacles']([enabled3['id']]),
                )
              : value12,
          value16 = enabled2['resolveObjectGroundPosition'](enabled3['id']) || 0x0,
          sampleDirectorGroundRoute2 = sampleDirectorGroundRoute(
            value15,
            (value17, value18) =>
              enabled2['directorScene']['surfaceHeight'](value17, value18, [enabled3['id']]),
            value16,
          ),
          value19 = value11['points']();
        value11['commit']((value20) =>
          authorDirectorPath(value20, {
            object: enabled3,
            points: sampleDirectorGroundRoute2,
            start: value19[0x0]['time'],
            duration: value19['at'](-0x1)['time'] - value19[0x0]['time'],
            smooth: ![],
          }),
        );
      } catch (value21) {
        this['panel']['timeline']['setMessage']?.(value21['message']);
      }
    }
    return !![];
  }
  async ['importPanorama'](error) {
    if (this['loading']) return;
    const response = validateStoryboard3DBackgroundImageFile(error);
    if (!response['ok']) {
      this['panel']['timeline']['setMessage']?.(response['errors'][0x0]['message']);
      return;
    }
    const { project: project2, scene: scene4 } = this['panel']['context'](),
      value22 = 'panorama-' + globalThis['crypto']['randomUUID']();
    ((this['loading'] = !![]), this['panel']['timeline']['requestRender']?.());
    try {
      await this['panel']['timeline']
        ['getBinaryAssetRepository']()
        ['put']({
          assetId: value22,
          kind: 'background',
          descriptor: { sceneId: scene4['id'], fileName: error['name'], projection: 'equirectangular' },
          primaryFile: error,
          relatedFiles: [],
        });
      if (this['disposed'] || this['panel']['context']()['project']['id'] !== project2['id']) return;
      this['panel']['timeline']['commitMutation']({
        type: 'director-panorama',
        label: '导入全景背景',
        mutate: (value23) => {
          if (value23['id'] !== project2['id']) return value23;
          const args2 = value23['scenes']['find']((value24) => value24['id'] === scene4['id']);
          if (!args2) return value23;
          return (
            (args2['directorSettings'] = normalizeDirectorSceneSettings(args2['directorSettings'])),
            Object['assign'](args2['directorSettings']['panorama'], {
              assetId: value22,
              enabled: !![],
              history: [
                ...args2['directorSettings']['panorama']['history'],
                { assetId: value22, name: error['name'] },
              ],
            }),
            value23
          );
        },
      });
    } catch (value25) {
      if (!this['disposed']) this['panel']['timeline']['setMessage']?.('全景导入失败：' + value25['message']);
    } finally {
      this['loading'] = ![];
      if (!this['disposed']) this['panel']['timeline']['requestRender']?.();
    }
  }
  ['destroy']() {
    this['disposed'] = !![];
  }
}
