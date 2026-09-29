import {
  addDirectorCameraPathPoint,
  readDirectorCameraPath,
  removeDirectorCameraPathPoint,
  updateDirectorCameraPathPoint,
} from './directorCameraPath.js';
import { normalizeStoryboard3DShotAnimation } from './shotAnimation.js';
import { renderDirectorCameraPathPanel } from './directorCameraPathPanel.js';
import { adjustSpatialCamera } from '../../core/math.js';
import { authorDirectorPath } from './directorPathAuthoring.js';
import { smoothDirectorKeys, sampleSpatialCurve } from './directorCurves.js';
import { DirectorCurveEditor } from './directorCurveEditor.js';
export class DirectorCameraPathController {
  constructor(_0x39b7a9) {
    ((this['timeline'] = _0x39b7a9),
      (this['curves'] = new DirectorCurveEditor(this)),
      (this['active'] = ![]),
      (this['drawing'] = ![]),
      (this['plane'] = 0x1),
      (this['planeOffset'] = 1.6),
      (this['selectedId'] = ''),
      (this['drawMode'] = 'points'),
      (this['drawDuration'] = 0x3),
      (this['objectId'] = ''),
      (this['frame'] = null),
      (this['onDown'] = (_0xe7696a) => this['pointerDown'](_0xe7696a)),
      (this['onMove'] = (_0x2b32f4) => this['pointerMove'](_0x2b32f4)),
      (this['onUp'] = (_0x228543) => this['pointerEnd'](_0x228543)),
      (this['onCancel'] = (_0x5a112c) => this['pointerEnd'](_0x5a112c, !![])),
      (this['onKey'] = (_0xf5cb1) => {
        if (this['curves']['key'](_0xf5cb1)) return !![];
        const _0x253eb4 = _0xf5cb1['target']['closest']?.('[data-camera-path-point]');
        if (this['active'] && _0x253eb4 && ['Enter', '\x20']['includes'](_0xf5cb1['key']))
          return (
            _0xf5cb1['preventDefault'](),
            _0xf5cb1['stopImmediatePropagation'](),
            this['select'](this['points']()[Number(_0x253eb4['dataset']['cameraPathPoint'])]?.['id']),
            !![]
          );
        if (!this['active'] || _0xf5cb1['key'] !== 'Escape') return;
        (_0xf5cb1['preventDefault'](), _0xf5cb1['stopImmediatePropagation']());
        if (this['curves']['cancel']) this['curves']['cancel']();
        else {
          if (this['cancelDrawing']) this['cancelDrawing']();
          else {
            if (this['drag']) this['pointerEnd'](null, !![]);
            else (this['stop'](), this['timeline']['requestRender']?.());
          }
        }
        return !![];
      }),
      (this['onWheel'] = (_0x584155) => {
        if (
          this['objectId'] ||
          !_0x584155['altKey'] ||
          !_0x584155['target']['closest']?.('[data-camera-path-monitor]') ||
          !this['selected']()
        )
          return;
        (_0x584155['preventDefault'](),
          _0x584155['stopImmediatePropagation'](),
          this['change']({
            camera: adjustSpatialCamera(this['selected']()['camera'], 0x0, -_0x584155['deltaY'], !![]),
          }));
      }));
  }
  ['context']() {
    return this['timeline']['_context']();
  }
  ['identity']() {
    const { project: _0x448b20, scene: _0x5b3f8a, shot: _0x4a7a85 } = this['context']();
    return _0x448b20?.['id'] + ':' + _0x5b3f8a?.['id'] + ':' + _0x4a7a85?.['id'];
  }
  ['points']() {
    const _0x42bfd8 = this['context']()['shot']?.['animation'];
    if (!this['objectId']) return readDirectorCameraPath(_0x42bfd8);
    const _0x311523 = new Set(_0x42bfd8?.['objectPaths']?.[this['objectId']]?.['pointIds'] || []);
    return (_0x42bfd8?.['objectTracks']?.['find'](
      (_0x42e1be) => _0x42e1be['objectId'] === this['objectId'],
    )?.['positionKeyframes'] || [])
      ['filter']((_0x5be87a) => _0x311523['has'](_0x5be87a['id']))
      ['map']((_0x40dfce) => ({
        ..._0x40dfce,
        camera: { ...this['context']()['shot']['camera'], position: _0x40dfce['value'] },
      }));
  }
  ['selected']() {
    return (
      this['points']()['find']((_0x23b821) => _0x23b821['id'] === this['selectedId']) || this['points']()[0x0]
    );
  }
  ['render'](_0x22b0c1) {
    return renderDirectorCameraPathPanel(this, _0x22b0c1);
  }
  ['commit'](_0x1c2d19) {
    if (
      this['objectId'] &&
      this['context']()['scene']?.['objects']['find']((_0xdd0ce6) => _0xdd0ce6['id'] === this['objectId'])?.[
        'locked'
      ]
    )
      throw new Error('请先解锁物体再编辑路径。');
    (this['timeline']['stopPlayback']({ render: ![] }),
      this['timeline']['_mutateAnimation']('camera-path', '编辑摄像机轨道', (_0x1bc366) =>
        normalizeStoryboard3DShotAnimation(_0x1c2d19(_0x1bc366)),
      ));
    const _0x499bf4 = this['selected']();
    if (_0x499bf4) this['timeline']['_sampleAt'](_0x499bf4['time']);
    this['timeline']['requestRender']?.();
  }
  ['change'](_0x5f1cb8) {
    const _0x5bf30b = this['selected']();
    if (!_0x5bf30b) return;
    try {
      this['commit']((_0x164b6d) => {
        if (!this['objectId']) return updateDirectorCameraPathPoint(_0x164b6d, _0x5bf30b['id'], _0x5f1cb8);
        const _0x44ab94 = _0x164b6d['objectTracks']['find'](
            (_0x3c52d0) => _0x3c52d0['objectId'] === this['objectId'],
          ),
          _0x3627ab = _0x44ab94?.['positionKeyframes']['find'](
            (_0x4cbba2) => _0x4cbba2['id'] === _0x5bf30b['id'],
          );
        if (!_0x3627ab) return _0x164b6d;
        if (_0x5f1cb8['camera']) _0x3627ab['value'] = [..._0x5f1cb8['camera']['position']];
        if (_0x5f1cb8['time'] != null) {
          const _0x154951 = Math['round'](Number(_0x5f1cb8['time']) * _0x164b6d['fps']) / _0x164b6d['fps'];
          if (
            _0x154951 < 0x0 ||
            _0x154951 > 0xe10 ||
            _0x44ab94['positionKeyframes']['some'](
              (_0x426eda) =>
                _0x426eda['id'] !== _0x5bf30b['id'] &&
                Math['abs'](_0x426eda['time'] - _0x154951) < 0.5 / _0x164b6d['fps'],
            )
          )
            throw new Error('该时间无效或已有控制点。');
          const _0x179b6f = _0x3627ab['time'];
          _0x3627ab['time'] = _0x154951;
          const _0x2053a8 = _0x44ab94['rotationKeyframes']['find'](
            (_0x2447c9) => Math['abs'](_0x2447c9['time'] - _0x179b6f) < 0.5 / _0x164b6d['fps'],
          );
          if (_0x2053a8) _0x2053a8['time'] = _0x154951;
        }
        _0x5f1cb8['easing'] && ((_0x3627ab['easing'] = _0x5f1cb8['easing']), delete _0x3627ab['easingCurve']);
        for (const _0xb6126e of ['inTangent', 'outTangent', 'easingCurve']) {
          if (Object['hasOwn'](_0x5f1cb8, _0xb6126e)) {
            if (_0x5f1cb8[_0xb6126e]) _0x3627ab[_0xb6126e] = [..._0x5f1cb8[_0xb6126e]];
            else delete _0x3627ab[_0xb6126e];
          }
        }
        return _0x164b6d;
      });
    } catch (_0x45011c) {
      this['timeline']['setMessage']?.(_0x45011c['message']);
    }
  }
  ['handleClick'](_0x27d484) {
    if (!_0x27d484['startsWith']('timeline-camera-path-')) return ![];
    try {
      if (_0x27d484 === 'timeline-camera-path-edit') {
        if (this['active']) this['stop']();
        else
          (this['timeline']['stopPlayback']({ render: ![], clear: !![] }),
            (this['active'] = !![]),
            (this['owner'] = this['identity']()),
            (this['drawing'] = !this['points']()['length']),
            this['timeline']['multiView']?.['destroy'](),
            (this['selectedId'] = this['selected']()?.['id'] || ''),
            this['sync']());
      } else {
        if (_0x27d484 === 'timeline-camera-path-draw') this['drawing'] = !this['drawing'];
        else {
          if (_0x27d484 === 'timeline-camera-path-focus') {
            const _0x5cf84c = this['viewport']?.['frameSceneView'](
              this['points']()['map']((_0x19a7dd) => _0x19a7dd['camera']['position']),
            );
            _0x5cf84c &&
              (this['timeline']['getRuntime']?.()?.['setViewProjection']('perspective'),
              this['timeline']['getRuntime']?.()?.['commitSceneView'](_0x5cf84c));
          } else {
            if (_0x27d484 === 'timeline-camera-path-smooth')
              this['commit']((_0x5434a5) => {
                const _0x1f41b1 = new Set(this['points']()['map']((_0x26fe64) => _0x26fe64['id'])),
                  _0x2ba5fb = this['objectId']
                    ? _0x5434a5['objectTracks']['find'](
                        (_0x4adc62) => _0x4adc62['objectId'] === this['objectId'],
                      )?.['positionKeyframes'] || []
                    : _0x5434a5['cameraKeyframes'];
                return (
                  smoothDirectorKeys(_0x2ba5fb['filter']((_0x3b14a0) => _0x1f41b1['has'](_0x3b14a0['id']))),
                  _0x5434a5
                );
              });
            else {
              if (_0x27d484 === 'timeline-camera-path-linear')
                this['commit']((_0x499d75) => {
                  const _0x87c8a7 = new Set(this['points']()['map']((_0x5726d5) => _0x5726d5['id'])),
                    _0x1e96b8 = this['objectId']
                      ? _0x499d75['objectTracks']['find'](
                          (_0x3db35a) => _0x3db35a['objectId'] === this['objectId'],
                        )?.['positionKeyframes'] || []
                      : _0x499d75['cameraKeyframes'];
                  return (
                    _0x1e96b8['filter']((_0x143c6f) => _0x87c8a7['has'](_0x143c6f['id']))['forEach'](
                      (_0x5233c3) => {
                        (delete _0x5233c3['inTangent'], delete _0x5233c3['outTangent']);
                      },
                    ),
                    _0x499d75
                  );
                });
              else {
                if (_0x27d484 === 'timeline-camera-path-delete' && this['selected']())
                  this['commit']((_0x130f6f) => {
                    if (!this['objectId'])
                      return removeDirectorCameraPathPoint(_0x130f6f, this['selected']()['id']);
                    const _0x4254ed = _0x130f6f['objectTracks']['find'](
                        (_0x1411e4) => _0x1411e4['objectId'] === this['objectId'],
                      ),
                      _0x119b8c = this['selected']();
                    return (
                      (_0x4254ed['positionKeyframes'] = _0x4254ed['positionKeyframes']['filter'](
                        (_0x5b2155) => _0x5b2155['id'] !== _0x119b8c['id'],
                      )),
                      (_0x4254ed['rotationKeyframes'] = _0x4254ed['rotationKeyframes']['filter'](
                        (_0x451762) =>
                          Math['abs'](_0x451762['time'] - _0x119b8c['time']) >= 0.5 / _0x130f6f['fps'],
                      )),
                      _0x130f6f
                    );
                  });
              }
            }
          }
        }
      }
      this['timeline']['requestRender']?.();
    } catch (_0x407121) {
      this['timeline']['setMessage']?.(_0x407121['message']);
    }
    return !![];
  }
  ['handleChange'](_0x37134a) {
    if (this['curves']['change'](_0x37134a)) return !![];
    const _0x2a3269 = _0x37134a['target'];
    if (_0x2a3269['matches']?.('[data-camera-path-object]'))
      return (
        (this['objectId'] =
          _0x2a3269['value'] === 'camera'
            ? ''
            : this['context']()['scene']['objects']['filter'](
                (_0x42eb05) => !['camera', 'light', 'group']['includes'](_0x42eb05['type']),
              )[Number(_0x2a3269['value'])]?.['id'] || ''),
        (this['selectedId'] = ''),
        (this['planeOffset'] =
          this['context']()['scene']['objects']['find'](
            (_0x51271d) => _0x51271d['id'] === this['objectId'],
          )?.['transform']['position'][this['plane']] ?? 1.6),
        this['timeline']['requestRender']?.(),
        !![]
      );
    if (_0x2a3269['matches']?.('[data-camera-path-draw-mode]'))
      return ((this['drawMode'] = _0x2a3269['value']), !![]);
    if (_0x2a3269['matches']?.('[data-camera-path-draw-duration]'))
      return (
        (this['drawDuration'] = Math['max'](0.1, Math['min'](0xe10, Number(_0x2a3269['value']) || 0x3))),
        !![]
      );
    if (_0x2a3269['matches']?.('[data-camera-path-selection]'))
      return (this['select'](this['points']()[Number(_0x2a3269['value'])]?.['id']), !![]);
    if (_0x2a3269['matches']?.('[data-camera-path-plane]'))
      return (
        (this['plane'] = Number(_0x2a3269['value'])),
        (this['planeOffset'] = this['selected']()?.['camera']['position'][this['plane']] || 0x0),
        this['timeline']['requestRender']?.(),
        !![]
      );
    if (_0x2a3269['matches']?.('[data-camera-path-easing]'))
      return (this['change']({ easing: _0x2a3269['value'] }), !![]);
    if (!_0x2a3269['matches']?.('[data-camera-path-field]')) return ![];
    const _0x5b9036 = _0x2a3269['dataset']['cameraPathField'],
      _0x4e1b84 = Number(_0x2a3269['value']);
    if (!Number['isFinite'](_0x4e1b84)) return !![];
    if (_0x5b9036 === 'planeOffset') return ((this['planeOffset'] = _0x4e1b84), !![]);
    const _0xd9ca76 = this['selected']();
    if (!_0xd9ca76) return !![];
    if (_0x5b9036 === 'time') {
      if (_0xd9ca76['time'] !== _0x4e1b84) this['change']({ time: _0x4e1b84 });
      return !![];
    }
    const _0x58525b = structuredClone(_0xd9ca76['camera']),
      [_0x1107e9, _0x35d23d] = _0x5b9036['split']('-');
    if (_0x35d23d != null) _0x58525b[_0x1107e9][Number(_0x35d23d)] = _0x4e1b84;
    else {
      _0x58525b[_0x1107e9] = _0x1107e9 === 'roll' ? (_0x4e1b84 * Math['PI']) / 0xb4 : _0x4e1b84;
      if (_0x1107e9 === 'focalLength') delete _0x58525b['fov'];
    }
    if (JSON['stringify'](_0x58525b) !== JSON['stringify'](_0xd9ca76['camera']))
      this['change']({ camera: _0x58525b });
    return !![];
  }
  ['select'](_0x5a382a) {
    this['selectedId'] = _0x5a382a || '';
    const _0x2f2fa0 = this['selected']();
    if (_0x2f2fa0) this['timeline']['_sampleAt'](_0x2f2fa0['time']);
    this['timeline']['requestRender']?.();
  }
  ['preview'](_0x3cd3cf) {
    if (!this['active']) return ![];
    return (
      this['timeline']['getRuntime']?.()?.['previewTimelineSample']({ ..._0x3cd3cf, camera: null }),
      (this['monitorCamera'] = _0x3cd3cf['camera']),
      !![]
    );
  }
  ['sync']() {
    if (!this['active']) return;
    if (this['owner'] !== this['identity']()) {
      this['stop']();
      return;
    }
    const _0xbbc2bf = this['timeline']['getRuntime']?.();
    if (!_0xbbc2bf || _0xbbc2bf['disposed']) return;
    const _0x16597d = _0xbbc2bf['getDirectorViewport'](),
      _0x5860e2 = _0x16597d['canvas']['parentElement'];
    if (this['viewport'] !== _0x16597d || this['layer']?.['parentElement'] !== _0x5860e2) {
      (this['detach'](), (this['viewport'] = _0x16597d));
      const _0x65a3bc = _0x5860e2['ownerDocument'];
      ((this['layer'] = _0x65a3bc['createElement']('div')),
        (this['layer']['className'] = 'storyboard-3d-camera-path-overlay'),
        (this['layer']['innerHTML'] =
          '<svg\x20data-camera-path-overlay\x20aria-label=\x22摄像机轨道控制点\x22></svg><div\x20class=\x22storyboard-3d-camera-path-monitor\x22><span>镜头监看</span><canvas\x20data-camera-path-monitor\x20aria-label=\x22镜头监看，拖动调整朝向\x22></canvas></div>'),
        _0x5860e2['append'](this['layer']),
        (this['svg'] = this['layer']['querySelector']('svg')),
        (this['monitorCanvas'] = this['layer']['querySelector']('canvas')),
        (this['root'] = this['timeline']['getRoot']()),
        this['root']['addEventListener']('pointerdown', this['onDown'], !![]),
        this['root']['addEventListener']('wheel', this['onWheel'], { capture: !![], passive: ![] }));
    }
    if (this['frame'] == null) {
      const _0x1849b3 = () => {
        this['frame'] = null;
        if (!this['active'] || this['owner'] !== this['identity']() || !this['layer']?.['isConnected']) {
          this['stop']();
          return;
        }
        (this['paint'](), (this['frame'] = this['timeline']['window']['requestAnimationFrame'](_0x1849b3)));
      };
      this['frame'] = this['timeline']['window']['requestAnimationFrame'](_0x1849b3);
    }
  }
  ['paint']() {
    const _0x5972ce = this['points'](),
      _0x3b1f8b = _0x5972ce['map'](
        (_0x10d428) => _0x10d428['id'] + ':' + Boolean(_0x10d428['inTangent'] || _0x10d428['outTangent']),
      )['join']('|');
    if (_0x3b1f8b !== this['svg']['dataset']['keys']) {
      (this['svg']['replaceChildren'](), (this['svg']['dataset']['keys'] = _0x3b1f8b));
      const _0x4e98cd = this['svg']['ownerDocument'];
      for (let _0x2dc457 = 0x0; _0x2dc457 < Math['max'](0x0, _0x5972ce['length'] - 0x1); _0x2dc457++) {
        const _0x1c5b02 = _0x4e98cd['createElementNS'](
          'http://www.w3.org/2000/svg',
          _0x5972ce[_0x2dc457]['outTangent'] || _0x5972ce[_0x2dc457 + 0x1]['inTangent'] ? 'path' : 'line',
        );
        ((_0x1c5b02['dataset']['segment'] = String(_0x2dc457)), this['svg']['append'](_0x1c5b02));
      }
      _0x5972ce['forEach']((_0x5ef537, _0x20e77e) => {
        const _0x4af1a8 = _0x4e98cd['createElementNS']('http://www.w3.org/2000/svg', 'circle');
        ((_0x4af1a8['dataset']['cameraPathPoint'] = String(_0x20e77e)),
          _0x4af1a8['setAttribute']('r', '9'),
          _0x4af1a8['setAttribute']('tabindex', '0'),
          _0x4af1a8['setAttribute']('role', 'button'),
          _0x4af1a8['setAttribute']('aria-label', '摄像机控制点 ' + (_0x20e77e + 0x1)),
          this['svg']['append'](_0x4af1a8));
      });
    }
    const _0x3ced3b = _0x5972ce['map']((_0xb238bc) =>
      this['viewport']['project'](
        this['drag']?.['id'] === _0xb238bc['id']
          ? this['drag']['camera']['position']
          : _0xb238bc['camera']['position'],
      ),
    );
    (this['svg']['querySelectorAll']('[data-segment]')['forEach']((_0x42b43d, _0x5adeab) => {
      if (_0x42b43d['tagName'] === 'path') {
        const _0x2d2797 = Array['from']({ length: 0x19 }, (_0x2c8268, _0x5215a2) =>
          this['viewport']['project'](
            sampleSpatialCurve(_0x5972ce[_0x5adeab], _0x5972ce[_0x5adeab + 0x1], _0x5215a2 / 0x18, 'camera'),
          ),
        );
        let _0x153a80 = ![];
        const _0x1b384b = _0x2d2797['map']((_0x51559b) => {
          if (!_0x51559b) return ((_0x153a80 = ![]), '');
          const _0x3af406 = '' + (_0x153a80 ? 'L' : 'M') + _0x51559b['x'] + '\x20' + _0x51559b['y'];
          return ((_0x153a80 = !![]), _0x3af406);
        })['join']('\x20');
        _0x42b43d['setAttribute']('d', _0x1b384b);
        return;
      }
      const _0x5f8aeb = _0x3ced3b[_0x5adeab],
        _0xc7540d = _0x3ced3b[_0x5adeab + 0x1];
      _0x42b43d['style']['display'] = _0x5f8aeb && _0xc7540d ? '' : 'none';
      if (_0x5f8aeb && _0xc7540d) {
        for (const [_0x2c1138, _0x32cf8d] of Object['entries']({
          x1: _0x5f8aeb['x'],
          y1: _0x5f8aeb['y'],
          x2: _0xc7540d['x'],
          y2: _0xc7540d['y'],
        }))
          _0x42b43d['setAttribute'](_0x2c1138, _0x32cf8d);
      }
    }),
      this['svg']['querySelectorAll']('circle')['forEach']((_0x2d116d, _0x348c27) => {
        const _0x2f83ae = _0x3ced3b[_0x348c27];
        ((_0x2d116d['style']['display'] = _0x2f83ae ? '' : 'none'),
          _0x2f83ae &&
            (_0x2d116d['setAttribute']('cx', _0x2f83ae['x']),
            _0x2d116d['setAttribute']('cy', _0x2f83ae['y'])),
          _0x2d116d['classList']['toggle'](
            'is-selected',
            _0x5972ce[_0x348c27]['id'] === this['selected']()?.['id'],
          ));
      }),
      this['layer']['classList']['toggle']('is-drawing', this['drawing']));
    const _0x382d9f =
        (!this['objectId'] && this['drag']?.['camera']) ||
        this['monitorCamera'] ||
        (!this['objectId'] && this['selected']()?.['camera']) ||
        this['context']()['shot']['camera'],
      _0x3c588b = this['timeline']['window']['performance']['now']();
    !this['monitorPending'] &&
      (!this['monitorPaintAt'] || _0x3c588b - this['monitorPaintAt'] > 0x21) &&
      ((this['monitorPaintAt'] = _0x3c588b),
      (this['monitorPending'] = !![]),
      Promise['resolve'](this['viewport']['renderMonitor'](this['monitorCanvas'], _0x382d9f))
        ['catch']((_0x46eee4) => {
          (this['timeline']['setMessage']?.('镜头监看失败：' + _0x46eee4['message']), this['stop']());
        })
        ['finally'](() => {
          this['monitorPending'] = ![];
        }));
  }
  ['pointerDown'](_0x616fd0) {
    if (this['curves']['down'](_0x616fd0)) return;
    if (!this['active'] || _0x616fd0['button'] !== 0x0 || this['timeline']['playing']) return;
    const _0x285d66 = _0x616fd0['target']['closest']?.('[data-camera-path-monitor]');
    if (_0x285d66 && this['objectId']) {
      (_0x616fd0['preventDefault'](), _0x616fd0['stopImmediatePropagation']());
      return;
    }
    const _0x19ce4d = _0x616fd0['target']['closest']?.('[data-camera-path-point]'),
      _0x97aa56 = _0x616fd0['target'] === this['viewport']?.['canvas'] || _0x616fd0['target'] === this['svg'];
    if (!_0x19ce4d && !_0x285d66 && !(this['drawing'] && _0x97aa56)) return;
    (_0x616fd0['preventDefault'](), _0x616fd0['stopImmediatePropagation']());
    if (!_0x19ce4d && !_0x285d66) {
      const _0x167ecb = this['viewport']['pointOnPlane'](
        _0x616fd0['clientX'],
        _0x616fd0['clientY'],
        this['plane'],
        this['planeOffset'],
      );
      if (!_0x167ecb) {
        this['timeline']['setMessage']?.('当前视角与编辑平面平行，请旋转视角或切换编辑平面。');
        return;
      }
      if (this['drawMode'] === 'freehand') {
        this['startFreehand'](_0x616fd0, _0x167ecb);
        return;
      }
      try {
        if (this['objectId']) {
          const _0x4dd0c0 = this['context']()['scene']['objects']['find'](
              (_0x3f6846) => _0x3f6846['id'] === this['objectId'],
            ),
            _0x584011 = this['points']();
          (this['commit']((_0x3e1b7) =>
            authorDirectorPath(_0x3e1b7, {
              object: _0x4dd0c0,
              points: [
                ...(_0x584011['length']
                  ? _0x584011['map']((_0x20831e) => _0x20831e['camera']['position'])
                  : [_0x4dd0c0['transform']['position']]),
                _0x167ecb,
              ],
              start: _0x584011[0x0]?.['time'] ?? this['timeline']['_timeForShot'](this['context']()['shot']),
              duration: Math['max'](0x1, _0x584011['length']),
            }),
          ),
            (this['selectedId'] = this['points']()['at'](-0x1)?.['id'] || ''),
            this['select'](this['selectedId']));
          return;
        }
        const _0x4918c0 = structuredClone(
          this['selected']()?.['camera'] || this['context']()['shot']['camera'],
        );
        ((_0x4918c0['position'] = _0x167ecb),
          this['commit']((_0x3e6873) => {
            const _0x56df18 = addDirectorCameraPathPoint(_0x3e6873, _0x4918c0);
            return ((this['selectedId'] = _0x56df18['cameraPath']['pointIds']['at'](-0x1)), _0x56df18);
          }));
      } catch (_0x5d0d4e) {
        this['timeline']['setMessage']?.(_0x5d0d4e['message']);
      }
      return;
    }
    const _0x9777a = _0x19ce4d
      ? this['points']()[Number(_0x19ce4d['dataset']['cameraPathPoint'])]
      : this['selected']();
    if (!_0x9777a) return;
    ((this['selectedId'] = _0x9777a['id']), this['timeline']['_sampleAt'](_0x9777a['time']));
    const _0x51302a = structuredClone(_0x9777a['camera']);
    ((this['drag'] = {
      id: _0x9777a['id'],
      base: structuredClone(_0x51302a),
      camera: _0x51302a,
      monitor: Boolean(_0x285d66),
      x: _0x616fd0['clientX'],
      y: _0x616fd0['clientY'],
      origin: this['viewport']['pointOnPlane'](
        _0x616fd0['clientX'],
        _0x616fd0['clientY'],
        this['plane'],
        _0x51302a['position'][this['plane']],
      ),
      snapshot: JSON['stringify'](this['context']()['shot']['animation']),
      target: _0x616fd0['target'],
      pointerId: _0x616fd0['pointerId'],
    }),
      _0x616fd0['target']['setPointerCapture']?.(_0x616fd0['pointerId']));
    const _0x5517e5 = this['timeline']['window'];
    (_0x5517e5['addEventListener']('pointermove', this['onMove'], !![]),
      _0x5517e5['addEventListener']('pointerup', this['onUp'], !![]),
      _0x5517e5['addEventListener']('pointercancel', this['onCancel'], !![]),
      _0x616fd0['target']['addEventListener']('lostpointercapture', this['onCancel']));
  }
  ['pointerMove'](_0x59f71e) {
    const _0x1d3866 = this['drag'];
    if (!_0x1d3866 || _0x59f71e['pointerId'] !== _0x1d3866['pointerId']) return;
    (_0x59f71e['preventDefault'](), _0x59f71e['stopImmediatePropagation']());
    if (_0x1d3866['monitor'])
      _0x1d3866['camera'] = adjustSpatialCamera(
        _0x1d3866['base'],
        _0x59f71e['clientX'] - _0x1d3866['x'],
        _0x59f71e['clientY'] - _0x1d3866['y'],
      );
    else {
      const _0x555860 = this['viewport']['pointOnPlane'](
        _0x59f71e['clientX'],
        _0x59f71e['clientY'],
        this['plane'],
        _0x1d3866['base']['position'][this['plane']],
      );
      if (_0x555860 && _0x1d3866['origin'])
        _0x1d3866['camera']['position'] = _0x1d3866['base']['position']['map'](
          (_0x41b7ed, _0x43985f) => _0x41b7ed + _0x555860[_0x43985f] - _0x1d3866['origin'][_0x43985f],
        );
    }
  }
  ['startFreehand'](_0x1b7e87, _0x3286e1) {
    const _0x27b26f = this['identity'](),
      _0x43fd5a = JSON['stringify'](this['context']()['shot']['animation']),
      _0x2d6ef5 = [_0x3286e1],
      _0x51f056 = new this['timeline']['window']['AbortController']();
    ((this['cancelDrawing'] = () => {
      (_0x51f056['abort'](),
        (this['cancelDrawing'] = null),
        this['freehandLine']?.['remove'](),
        (this['freehandLine'] = null));
    }),
      (this['freehandLine'] = this['svg']['ownerDocument']['createElementNS'](
        'http://www.w3.org/2000/svg',
        'polyline',
      )),
      this['svg']['append'](this['freehandLine']));
    const _0x489f1b = (_0x4c0e69) => {
      const _0x1b5b21 = this['viewport']['pointOnPlane'](
        _0x4c0e69['clientX'],
        _0x4c0e69['clientY'],
        this['plane'],
        this['planeOffset'],
      );
      if (
        !_0x1b5b21 ||
        _0x2d6ef5['length'] >= 0x64 ||
        Math['hypot'](
          ..._0x1b5b21['map']((_0x1cfdca, _0x453bd4) => _0x1cfdca - _0x2d6ef5['at'](-0x1)[_0x453bd4]),
        ) < 0.04
      )
        return;
      (_0x2d6ef5['push'](_0x1b5b21),
        this['freehandLine']['setAttribute'](
          'points',
          _0x2d6ef5['map']((_0x352b55) => this['viewport']['project'](_0x352b55))
            ['filter'](Boolean)
            ['map']((_0x5dc482) => _0x5dc482['x'] + ',' + _0x5dc482['y'])
            ['join']('\x20'),
        ));
    };
    (this['timeline']['window']['addEventListener']('pointermove', _0x489f1b, {
      signal: _0x51f056['signal'],
    }),
      this['timeline']['window']['addEventListener']('pointercancel', () => this['cancelDrawing']?.(), {
        signal: _0x51f056['signal'],
      }),
      this['timeline']['window']['addEventListener'](
        'pointerup',
        () => {
          this['cancelDrawing']?.();
          if (
            _0x27b26f !== this['identity']() ||
            _0x43fd5a !== JSON['stringify'](this['context']()['shot']['animation'])
          )
            return;
          try {
            this['commit']((_0x1f6eb6) =>
              authorDirectorPath(_0x1f6eb6, {
                points: _0x2d6ef5,
                camera: this['selected']()?.['camera'] || this['context']()['shot']['camera'],
                object: this['context']()['scene']['objects']['find'](
                  (_0x657b88) => _0x657b88['id'] === this['objectId'],
                ),
                start: this['timeline']['_timeForShot'](this['context']()['shot']),
                duration: this['drawDuration'],
                smooth: !![],
              }),
            );
          } catch (_0x17b916) {
            this['timeline']['setMessage']?.(_0x17b916['message']);
          }
        },
        { once: !![], signal: _0x51f056['signal'] },
      ));
  }
  ['pointerEnd'](_0x3b2dfb, _0x3195cb = ![]) {
    const _0x51e854 = this['drag'];
    if (!_0x51e854 || (_0x3b2dfb && _0x3b2dfb['pointerId'] !== _0x51e854['pointerId'])) return;
    (_0x3b2dfb?.['stopImmediatePropagation'](), (this['drag'] = null));
    const _0x1f3109 = this['timeline']['window'];
    (_0x1f3109['removeEventListener']('pointermove', this['onMove'], !![]),
      _0x1f3109['removeEventListener']('pointerup', this['onUp'], !![]),
      _0x1f3109['removeEventListener']('pointercancel', this['onCancel'], !![]),
      _0x51e854['target']['removeEventListener']('lostpointercapture', this['onCancel']));
    if (_0x51e854['target']['hasPointerCapture']?.(_0x51e854['pointerId']))
      _0x51e854['target']['releasePointerCapture'](_0x51e854['pointerId']);
    if (
      _0x3195cb ||
      this['owner'] !== this['identity']() ||
      _0x51e854['snapshot'] !== JSON['stringify'](this['context']()['shot']['animation'])
    )
      return;
    if (JSON['stringify'](_0x51e854['base']) !== JSON['stringify'](_0x51e854['camera']))
      this['change']({ camera: _0x51e854['camera'] });
    else this['select'](_0x51e854['id']);
  }
  ['detach']() {
    (this['curves']['cancel']?.(),
      this['cancelDrawing']?.(),
      this['pointerEnd'](null, !![]),
      this['root']?.['removeEventListener']('pointerdown', this['onDown'], !![]),
      this['root']?.['removeEventListener']('wheel', this['onWheel'], !![]));
    if (this['frame'] != null) this['timeline']['window']['cancelAnimationFrame'](this['frame']);
    ((this['frame'] = null),
      this['viewport']?.['disposeMonitor'](),
      this['layer']?.['remove'](),
      (this['layer'] = null),
      (this['viewport'] = null));
  }
  ['stop']() {
    if (!this['active'] && !this['layer']) return;
    ((this['active'] = ![]),
      (this['drawing'] = ![]),
      (this['monitorCamera'] = null),
      this['detach'](),
      this['timeline']['clearPreview']?.());
  }
  ['destroy']() {
    this['stop']();
  }
}
