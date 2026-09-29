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
const escapeHtml = (_0x2e9531) =>
    String(_0x2e9531 ?? '')
      ['replaceAll']('&', '&amp;')
      ['replaceAll']('\x22', '&quot;')
      ['replaceAll']('<', '&lt;')
      ['replaceAll']('>', '&gt;'),
  options = (_0x12c3d2, _0x3d093b) =>
    _0x12c3d2['map'](
      ([_0x5b23d8, _0x470a29]) =>
        '<option value="' +
        escapeHtml(_0x5b23d8) +
        '\x22\x20' +
        (_0x5b23d8 === _0x3d093b ? 'selected' : '') +
        '>' +
        escapeHtml(_0x470a29) +
        '</option>',
    )['join'](''),
  input = (_0x52e267, _0x16dd78, _0x139375, _0x29416f = '') =>
    '<label>' +
    _0x52e267 +
    '<input\x20type=\x22number\x22\x20step=\x220.1\x22\x20value=\x22' +
    _0x139375 +
    '\x22\x20data-director-field=\x22' +
    _0x16dd78 +
    '\x22\x20' +
    _0x29416f +
    '></label>';
export class DirectorTimelinePanel {
  constructor(_0x2bca18) {
    ((this['timeline'] = _0x2bca18),
      (this['characters'] = new DirectorCharacterPanel(this)),
      (this['scenePanel'] = new DirectorScenePanel(this)),
      (this['delivery'] = new DirectorDeliveryPanel(this)),
      (this['generation'] = new DirectorGenerationPanel(this)),
      (this['mobile'] = new DirectorMobileCamera(this)),
      (this['open'] = ![]),
      (this['drafts'] = new Map()));
  }
  ['draft'](_0x1cf48e, _0x3eb0e5) {
    const _0x1c52f3 = _0x1cf48e['id'] + ':' + (_0x3eb0e5?.['id'] || 'camera');
    if (!this['drafts']['has'](_0x1c52f3))
      this['drafts']['set'](_0x1c52f3, {
        preset: 'push',
        cameraPreset: 'front-medium',
        duration: 0x3,
        amount: 0x3,
        append: ![],
        start: 0x0,
        actionId: 'walking-left',
        speed: 0x1,
        orient: !![],
        points: [],
        span: 0xc,
        pathDuration: 0x3,
      });
    return this['drafts']['get'](_0x1c52f3);
  }
  ['context']() {
    const _0x3cdedd = this['timeline']['_context'](),
      _0x98abe2 = _0x3cdedd['scene']?.['objects']['find'](
        (_0x519175) => _0x519175['id'] === _0x3cdedd['editorState']['selectedObjectIds']?.['at'](-0x1),
      );
    return {
      ..._0x3cdedd,
      object: _0x98abe2 && !['group', 'camera', 'light']['includes'](_0x98abe2['type']) ? _0x98abe2 : null,
    };
  }
  ['render']() {
    if (!this['open']) return '';
    const { scene: _0x16301c, shot: _0x3a7cef, object: _0x1a37d2 } = this['context']();
    if (!_0x3a7cef) return '';
    const _0x187367 = this['draft'](_0x3a7cef, _0x1a37d2),
      _0x9b6368 = normalizeStoryboard3DShotAnimation(_0x3a7cef['animation']),
      _0x3731b4 = _0x9b6368['cameraConstraint'],
      _0x159aee = [
        ['', '无'],
        ..._0x16301c['objects']
          ['filter']((_0x2492fc) => !['camera', 'group', 'light']['includes'](_0x2492fc['type']))
          ['map']((_0x5a099e) => [_0x5a099e['id'], _0x5a099e['name']]),
      ],
      _0xed3cc2 = _0x1a37d2?.['transform']['position'] || [0x0, 0x0, 0x0],
      _0x1d194d = _0x187367['points']['map'](
        (_0x3211cf) =>
          0x32 +
          ((_0x3211cf[0x0] - _0xed3cc2[0x0]) / _0x187367['span']) * 0x64 +
          ',' +
          (0x32 + ((_0x3211cf[0x2] - _0xed3cc2[0x2]) / _0x187367['span']) * 0x64),
      ),
      _0x1b358a = _0x9b6368['actionClips']['filter'](
        (_0x24ad3b) => _0x24ad3b['objectId'] === _0x1a37d2?.['id'],
      );
    return (
      '<div class="storyboard-3d-director-panel" data-director-panel>\n      ' +
      this['timeline']['cameraPath']['render'](_0x9b6368) +
      '\x0a\x20\x20\x20\x20\x20\x20' +
      this['characters']['render']() +
      '\n      ' +
      this['scenePanel']['render']() +
      '\n      ' +
      this['delivery']['render']() +
      '\x0a\x20\x20\x20\x20\x20\x20' +
      this['generation']['render']() +
      '\n      ' +
      this['mobile']['render']() +
      '\n      <fieldset><legend>摄像机运镜</legend><div class="storyboard-3d-director-fields">\n        <label>机位<select data-director-field="cameraPreset">' +
      options(
        DIRECTOR_CAMERA_PRESETS['map']((_0x21d1e5) => [_0x21d1e5['id'], _0x21d1e5['name']]),
        _0x187367['cameraPreset'],
      ) +
      '</select></label><button\x20type=\x22button\x22\x20data-storyboard-3d-action=\x22timeline-director-camera-preset\x22>应用到当前帧</button>\x0a\x20\x20\x20\x20\x20\x20</div><div\x20class=\x22storyboard-3d-director-fields\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<label>预设<select\x20data-director-field=\x22preset\x22>' +
      options(DIRECTOR_CAMERA_MOTIONS, _0x187367['preset']) +
      '</select></label>\n        ' +
      input('时长\x20/\x20秒', 'duration', _0x187367['duration'], 'min="0.1" max="3600"') +
      input('移动距离 / 米', 'amount', _0x187367['amount'], 'min="0.1" max="100"') +
      '\n        <label><input type="checkbox" data-director-field="append" ' +
      (_0x187367['append'] ? 'checked' : '') +
      '>追加到末尾</label>\n        <button type="button" data-storyboard-3d-action="timeline-director-motion">应用运镜</button>\n      </div><div class="storyboard-3d-director-fields">\n        <label>跟随目标<select data-director-constraint="followObjectId">' +
      options(_0x159aee, _0x3731b4['followObjectId']) +
      '</select></label>\n        <label>注视目标<select data-director-constraint="lookAtObjectId">' +
      options(_0x159aee, _0x3731b4['lookAtObjectId']) +
      '</select></label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<label><input\x20type=\x22checkbox\x22\x20data-director-constraint=\x22followHeading\x22\x20' +
      (_0x3731b4['followHeading'] ? 'checked' : '') +
      '>跟随朝向</label>\n        <label>注视高度 / 米<input type="number" step="0.1" value="' +
      _0x3731b4['lookAtOffset'][0x1] +
      '" data-director-constraint="lookAtHeight"></label>\n      </div>' +
      renderDirectorFollowPanel(_0x9b6368, _0x159aee) +
      '</fieldset>\n      <fieldset><legend>' +
      escapeHtml(_0x1a37d2?.['name'] || '选择角色或物体后编排走位与动作') +
      '</legend>\n        <div class="storyboard-3d-director-fields">' +
      input('开始 / 秒', 'start', _0x187367['start'], 'min=\x220\x22\x20max=\x223599.9\x22') +
      input('走位 / 动作时长', 'pathDuration', _0x187367['pathDuration'], 'min="0.1" max="3600"') +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      input('地图范围 / 米', 'span', _0x187367['span'], 'min=\x222\x22\x20max=\x22200\x22') +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<label><input\x20type=\x22checkbox\x22\x20data-director-field=\x22orient\x22\x20' +
      (_0x187367['orient'] ? 'checked' : '') +
      '>朝向路径</label>\n        </div>\n        <div class="storyboard-3d-director-path-row"><button type="button" class="storyboard-3d-director-path-map" data-storyboard-3d-action="timeline-director-point" aria-label="俯视走位图，点击添加路径点" ' +
      (_0x1a37d2 ? '' : 'disabled') +
      '>\n          <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 0V100 M0 50H100"/><polyline points="' +
      _0x1d194d['join']('\x20') +
      '"/>' +
      _0x1d194d['map'](
        (_0x531ffa, _0x599eeb) =>
          '<circle cx="' +
          _0x531ffa['split'](',')[0x0] +
          '" cy="' +
          _0x531ffa['split'](',')[0x1] +
          '\x22\x20r=\x221.8\x22/><text\x20x=\x22' +
          (Number(_0x531ffa['split'](',')[0x0]) + 0x2) +
          '" y="' +
          (Number(_0x531ffa['split'](',')[0x1]) - 0x2) +
          '\x22>' +
          (_0x599eeb + 0x1) +
          '</text>',
      )['join']('') +
      '<text x="52" y="8">−Z</text><text x="89" y="48">+X</text></svg>\n        </button><div class="storyboard-3d-director-path-points">\n          ' +
      (_0x187367['points']
        ['map'](
          (_0x3092b4, _0x3499ef) =>
            '<div><b>' +
            (_0x3499ef + 0x1) +
            '</b>' +
            _0x3092b4['map'](
              (_0x440268, _0x4b7dcf) =>
                '<input aria-label="路径点 ' +
                (_0x3499ef + 0x1) +
                '\x20' +
                ['X', 'Y', 'Z'][_0x4b7dcf] +
                '" type="number" step="0.1" value="' +
                _0x440268['toFixed'](0x2) +
                '" data-director-point="' +
                _0x3499ef +
                '\x22\x20data-axis=\x22' +
                _0x4b7dcf +
                '\x22>',
            )['join']('') +
            '<button type="button" data-storyboard-3d-action="timeline-director-remove-point" data-index="' +
            _0x3499ef +
            '" aria-label="删除路径点 ' +
            (_0x3499ef + 0x1) +
            '">×</button></div>',
        )
        ['join']('') || '点击俯视图设置走位；首点自动使用物体当前位置。') +
      '\n        </div></div><div class="storyboard-3d-director-fields"><button type="button" data-storyboard-3d-action="timeline-director-path" ' +
      (_0x1a37d2 && _0x187367['points']['length'] > 0x1 ? '' : 'disabled') +
      '>生成走位关键帧</button><button\x20type=\x22button\x22\x20data-storyboard-3d-action=\x22timeline-director-clear-path\x22>清空路径草稿</button></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
      (_0x1a37d2?.['type'] === 'character'
        ? '<div\x20class=\x22storyboard-3d-director-fields\x22><label>动作<select\x20data-director-field=\x22actionId\x22>' +
          options(
            STORYBOARD_3D_ACTIONS['map']((_0x483f7c) => [_0x483f7c['id'], _0x483f7c['name']]),
            _0x187367['actionId'],
          ) +
          '</select></label>' +
          input('播放倍速', 'speed', _0x187367['speed'], 'min="0.1" max="4"') +
          '<button\x20type=\x22button\x22\x20data-storyboard-3d-action=\x22timeline-director-add-clip\x22>添加动作片段</button></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-director-clips\x22>' +
          _0x1b358a['map'](
            (_0x20b203) =>
              '<div data-director-clip="' +
              escapeHtml(_0x20b203['id']) +
              '\x22><strong>' +
              escapeHtml(
                STORYBOARD_3D_ACTIONS['find']((_0x8ed049) => _0x8ed049['id'] === _0x20b203['actionId'])?.[
                  'name'
                ],
              ) +
              '</strong>' +
              ['start', 'end', 'speed']
                ['map'](
                  (_0x3ca1ed) =>
                    '<label>' +
                    { start: '开始', end: '结束', speed: '倍速' }[_0x3ca1ed] +
                    '<input type="number" step="0.1" value="' +
                    _0x20b203[_0x3ca1ed] +
                    '" data-director-clip-field="' +
                    _0x3ca1ed +
                    '"></label>',
                )
                ['join']('') +
              '<button\x20type=\x22button\x22\x20data-storyboard-3d-action=\x22timeline-director-copy-clip\x22\x20data-clip-id=\x22' +
              escapeHtml(_0x20b203['id']) +
              '">复制到末尾</button><button type="button" data-storyboard-3d-action="timeline-director-delete-clip" data-clip-id="' +
              escapeHtml(_0x20b203['id']) +
              '\x22>删除</button></div>',
          )['join']('') +
          '</div>'
        : '') +
      '\n      </fieldset>\n    </div>'
    );
  }
  ['mutate'](_0x3e59db, _0x1f569d) {
    (this['timeline']['stopPlayback']({ render: ![] }),
      this['timeline']['_mutateAnimation']('director-motion', _0x3e59db, _0x1f569d));
    const { shot: _0xb635a } = this['context']();
    if (_0xb635a) this['timeline']['_sampleAt'](this['timeline']['_timeForShot'](_0xb635a));
  }
  ['handleClick'](_0xd83e13, _0x59af38, _0x23e37a) {
    if (this['mobile']['click'](_0xd83e13)) return !![];
    if (this['generation']['click'](_0xd83e13, _0x59af38)) return !![];
    if (this['delivery']['click'](_0xd83e13, _0x59af38)) return !![];
    if (this['scenePanel']['click'](_0xd83e13, _0x59af38)) return !![];
    if (this['characters']['click'](_0xd83e13)) return !![];
    if (clickDirectorFollow(this, _0xd83e13, _0x59af38)) return !![];
    if (this['timeline']['cameraPath']['handleClick'](_0xd83e13)) return !![];
    if (!_0xd83e13['startsWith']('timeline-director-')) return ![];
    if (_0xd83e13 === 'timeline-director-toggle') {
      this['open'] = !this['open'];
      !this['open'] &&
        (this['timeline']['cameraPath']['stop'](), this['mobile']['disconnect']({ render: ![] }));
      if (this['open']) this['timeline']['expandDirectorPanel']?.();
      return (this['timeline']['requestRender']?.(), !![]);
    }
    const { scene: _0x1d87da, shot: _0x1c339f, object: _0x79c66c } = this['context']();
    if (!_0x1c339f || _0x59af38['disabled']) return !![];
    const _0x45c32a = this['draft'](_0x1c339f, _0x79c66c);
    try {
      switch (_0xd83e13) {
        case 'timeline-director-camera-preset':
          this['mutate']('应用机位预设', (_0x1400d1) =>
            upsertStoryboard3DCameraKeyframe(_0x1400d1, {
              time: this['timeline']['_timeForShot'](_0x1c339f),
              camera: createDirectorCameraPreset(_0x1d87da, {
                preset: _0x45c32a['cameraPreset'],
                objectId: _0x79c66c?.['id'],
                camera: _0x1c339f['camera'],
              }),
            }),
          );
          break;
        case 'timeline-director-motion':
          this['mutate']('应用摄像机运镜', (_0x352acf) =>
            applyDirectorCameraMotion(_0x352acf, {
              ..._0x45c32a,
              camera: _0x352acf['cameraConstraint']['followObjectId']
                ? _0x1c339f['camera']
                : this['timeline']['readCurrentCamera']?.() || _0x1c339f['camera'],
            }),
          );
          break;
        case 'timeline-director-point': {
          if (!_0x79c66c || !_0x23e37a || _0x45c32a['points']['length'] >= 0x64) break;
          const _0x15f6dd = _0x59af38['getBoundingClientRect']();
          if (!_0x45c32a['points']['length'])
            _0x45c32a['points']['push']([..._0x79c66c['transform']['position']]);
          const _0x43bf4d = _0x79c66c['transform']['position'];
          _0x45c32a['points']['push']([
            _0x43bf4d[0x0] +
              ((_0x23e37a['clientX'] - _0x15f6dd['left']) / _0x15f6dd['width'] - 0.5) * _0x45c32a['span'],
            _0x43bf4d[0x1],
            _0x43bf4d[0x2] +
              ((_0x23e37a['clientY'] - _0x15f6dd['top']) / _0x15f6dd['height'] - 0.5) * _0x45c32a['span'],
          ]);
          break;
        }
        case 'timeline-director-remove-point':
          _0x45c32a['points']['splice'](Number(_0x59af38['dataset']['index']), 0x1);
          break;
        case 'timeline-director-clear-path':
          _0x45c32a['points'] = [];
          break;
        case 'timeline-director-path':
          this['mutate']('生成物体走位', (_0x306613) =>
            applyDirectorObjectPath(_0x306613, {
              ..._0x45c32a,
              duration: _0x45c32a['pathDuration'],
              object: _0x79c66c,
            }),
          );
          break;
        case 'timeline-director-add-clip':
          if (_0x79c66c?.['type'] !== 'character') break;
          this['mutate']('添加角色动作片段', (_0x4c5fae) =>
            normalizeStoryboard3DShotAnimation({
              ..._0x4c5fae,
              actionClips: [
                ..._0x4c5fae['actionClips'],
                {
                  id: 'clip-' + globalThis['crypto']['randomUUID'](),
                  objectId: _0x79c66c['id'],
                  actionId: _0x45c32a['actionId'],
                  start: _0x45c32a['start'],
                  end: _0x45c32a['start'] + _0x45c32a['pathDuration'],
                  speed: _0x45c32a['speed'],
                },
              ],
            }),
          );
          break;
        case 'timeline-director-delete-clip':
          this['mutate']('删除动作片段', (_0xaca035) => ({
            ..._0xaca035,
            actionClips: _0xaca035['actionClips']['filter'](
              (_0x5c2f48) => _0x5c2f48['id'] !== _0x59af38['dataset']['clipId'],
            ),
          }));
          break;
        case 'timeline-director-copy-clip':
          this['mutate']('复制动作片段', (_0x172b21) => {
            const _0x582a3d = _0x172b21['actionClips']['find'](
              (_0x16ca50) => _0x16ca50['id'] === _0x59af38['dataset']['clipId'],
            );
            if (!_0x582a3d) return _0x172b21;
            const _0x4b40d2 = Math['max'](
              ..._0x172b21['actionClips']
                ['filter']((_0x5c8c7) => _0x5c8c7['objectId'] === _0x582a3d['objectId'])
                ['map']((_0x5b3375) => _0x5b3375['end']),
            );
            if (_0x4b40d2 + _0x582a3d['end'] - _0x582a3d['start'] > 0xe10)
              throw new Error('动作片段超过时长上限。');
            return normalizeStoryboard3DShotAnimation({
              ..._0x172b21,
              actionClips: [
                ..._0x172b21['actionClips'],
                {
                  ..._0x582a3d,
                  id: 'clip-' + globalThis['crypto']['randomUUID'](),
                  start: _0x4b40d2,
                  end: _0x4b40d2 + _0x582a3d['end'] - _0x582a3d['start'],
                },
              ],
            });
          });
          break;
      }
      this['timeline']['requestRender']?.();
    } catch (_0x35f717) {
      this['timeline']['setMessage']?.(_0x35f717['message']);
    }
    return !![];
  }
  ['handleChange'](_0x41e1a6) {
    if (this['generation']['change'](_0x41e1a6)) return !![];
    if (this['delivery']['change'](_0x41e1a6)) return !![];
    if (this['scenePanel']['change'](_0x41e1a6)) return !![];
    if (this['characters']['change'](_0x41e1a6)) return !![];
    if (changeDirectorFollow(this, _0x41e1a6)) return !![];
    if (this['timeline']['cameraPath']['handleChange'](_0x41e1a6)) return !![];
    const _0x386292 = _0x41e1a6['target'],
      { shot: _0x46b36a, object: _0x53a01c } = this['context']();
    if (!_0x46b36a) return ![];
    const _0x37499b = this['draft'](_0x46b36a, _0x53a01c);
    if (_0x386292['matches']?.('[data-director-field]')) {
      const _0x3845cd = _0x386292['dataset']['directorField'];
      _0x37499b[_0x3845cd] =
        _0x386292['type'] === 'checkbox'
          ? _0x386292['checked']
          : _0x386292['type'] === 'number'
            ? Number(_0x386292['value'])
            : _0x386292['value'];
      if (_0x3845cd === 'span')
        _0x37499b['span'] = Math['max'](0x2, Math['min'](0xc8, Number(_0x37499b['span']) || 0xc));
      if (_0x3845cd === 'span') this['refreshMap']();
      return !![];
    }
    if (_0x386292['matches']?.('[data-director-point]')) {
      const _0x1634fd = _0x37499b['points'][Number(_0x386292['dataset']['directorPoint'])],
        _0xbabb08 = Number(_0x386292['value']);
      if (_0x1634fd && Number['isFinite'](_0xbabb08))
        _0x1634fd[Number(_0x386292['dataset']['axis'])] = _0xbabb08;
      return (this['refreshMap'](), !![]);
    }
    if (_0x386292['matches']?.('[data-director-constraint]')) {
      const _0x520737 = _0x386292['dataset']['directorConstraint'];
      return (
        this['mutate']('修改摄像机跟随与注视', (_0x3571b0) => {
          if (_0x520737 === 'lookAtHeight')
            _0x3571b0['cameraConstraint']['lookAtOffset'][0x1] = Number(_0x386292['value']) || 0x0;
          else
            _0x3571b0['cameraConstraint'][_0x520737] =
              _0x386292['type'] === 'checkbox' ? _0x386292['checked'] : _0x386292['value'];
          return normalizeStoryboard3DShotAnimation(_0x3571b0);
        }),
        !![]
      );
    }
    if (_0x386292['matches']?.('[data-director-clip-field]')) {
      const _0x32ae0b = _0x386292['closest']('[data-director-clip]')?.['dataset']['directorClip'];
      if (
        _0x46b36a['animation']['actionClips']['find']((_0x5544bf) => _0x5544bf['id'] === _0x32ae0b)?.[
          _0x386292['dataset']['directorClipField']
        ] === Number(_0x386292['value'])
      )
        return !![];
      return (
        this['mutate']('调整动作片段', (_0x19d007) => {
          const _0x2d39c7 = _0x19d007['actionClips']['find']((_0x38fa7a) => _0x38fa7a['id'] === _0x32ae0b);
          if (_0x2d39c7) _0x2d39c7[_0x386292['dataset']['directorClipField']] = Number(_0x386292['value']);
          return normalizeStoryboard3DShotAnimation(_0x19d007);
        }),
        !![]
      );
    }
    return ![];
  }
  ['refreshMap']() {
    const _0xca5b7f = this['timeline']
      ['getRoot']?.()
      ?.['querySelector']('.storyboard-3d-director-path-map svg');
    if (!_0xca5b7f) return;
    const _0x32ca8f = _0xca5b7f['ownerDocument']['createElement']('template');
    _0x32ca8f['innerHTML'] = this['render']();
    const _0x527a0b = _0x32ca8f['content']['querySelector']('.storyboard-3d-director-path-map svg');
    if (_0x527a0b) _0xca5b7f['replaceWith'](_0x527a0b);
  }
  ['destroy']() {
    (this['generation']['destroy'](),
      this['mobile']['destroy'](),
      this['delivery']['destroy'](),
      this['scenePanel']['destroy'](),
      this['drafts']['clear']());
  }
}
