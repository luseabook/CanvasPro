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
  constructor(value) {
    ((this['timeline'] = value),
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
      (this['onDown'] = (item) => this['pointerDown'](item)),
      (this['onMove'] = (key) => this['pointerMove'](key)),
      (this['onUp'] = (index) => this['pointerEnd'](index)),
      (this['onCancel'] = (result) => this['pointerEnd'](result, !![])),
      (this['onKey'] = (event) => {
        if (this['curves']['key'](event)) return !![];
        const el = event['target']['closest']?.('[data-camera-path-point]');
        if (this['active'] && el && ['Enter', '\x20']['includes'](event['key']))
          return (
            event['preventDefault'](),
            event['stopImmediatePropagation'](),
            this['select'](this['points']()[Number(el['dataset']['cameraPathPoint'])]?.['id']),
            !![]
          );
        if (!this['active'] || event['key'] !== 'Escape') return;
        (event['preventDefault'](), event['stopImmediatePropagation']());
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
      (this['onWheel'] = (event2) => {
        if (
          this['objectId'] ||
          !event2['altKey'] ||
          !event2['target']['closest']?.('[data-camera-path-monitor]') ||
          !this['selected']()
        )
          return;
        (event2['preventDefault'](),
          event2['stopImmediatePropagation'](),
          this['change']({
            camera: adjustSpatialCamera(this['selected']()['camera'], 0x0, -event2['deltaY'], !![]),
          }));
      }));
  }
  ['context']() {
    return this['timeline']['_context']();
  }
  ['identity']() {
    const { project: project, scene: scene, shot: shot } = this['context']();
    return project?.['id'] + ':' + scene?.['id'] + ':' + shot?.['id'];
  }
  ['points']() {
    const data = this['context']()['shot']?.['animation'];
    if (!this['objectId']) return readDirectorCameraPath(data);
    const map = new Set(data?.['objectPaths']?.[this['objectId']]?.['pointIds'] || []);
    return (data?.['objectTracks']?.['find']((options) => options['objectId'] === this['objectId'])?.[
      'positionKeyframes'
    ] || [])
      ['filter']((target) => map['has'](target['id']))
      ['map']((position) => ({
        ...position,
        camera: { ...this['context']()['shot']['camera'], position: position['value'] },
      }));
  }
  ['selected']() {
    return this['points']()['find']((source) => source['id'] === this['selectedId']) || this['points']()[0x0];
  }
  ['render'](next) {
    return renderDirectorCameraPathPanel(this, next);
  }
  ['commit'](handler) {
    if (
      this['objectId'] &&
      this['context']()['scene']?.['objects']['find']((current) => current['id'] === this['objectId'])?.[
        'locked'
      ]
    )
      throw new Error('请先解锁物体再编辑路径。');
    (this['timeline']['stopPlayback']({ render: ![] }),
      this['timeline']['_mutateAnimation']('camera-path', '编辑摄像机轨道', (entry) =>
        normalizeStoryboard3DShotAnimation(handler(entry)),
      ));
    const record = this['selected']();
    if (record) this['timeline']['_sampleAt'](record['time']);
    this['timeline']['requestRender']?.();
  }
  ['change'](args) {
    const enabled = this['selected']();
    if (!enabled) return;
    try {
      this['commit']((payload) => {
        if (!this['objectId']) return updateDirectorCameraPathPoint(payload, enabled['id'], args);
        const handle = payload['objectTracks']['find']((state) => state['objectId'] === this['objectId']),
          el2 = handle?.['positionKeyframes']['find']((config) => config['id'] === enabled['id']);
        if (!el2) return payload;
        if (args['camera']) el2['value'] = [...args['camera']['position']];
        if (args['time'] != null) {
          const count = Math['round'](Number(args['time']) * payload['fps']) / payload['fps'];
          if (
            count < 0x0 ||
            count > 0xe10 ||
            handle['positionKeyframes']['some'](
              (scope) =>
                scope['id'] !== enabled['id'] && Math['abs'](scope['time'] - count) < 0.5 / payload['fps'],
            )
          )
            throw new Error('该时间无效或已有控制点。');
          const input = el2['time'];
          el2['time'] = count;
          const output = handle['rotationKeyframes']['find'](
            (value2) => Math['abs'](value2['time'] - input) < 0.5 / payload['fps'],
          );
          if (output) output['time'] = count;
        }
        args['easing'] && ((el2['easing'] = args['easing']), delete el2['easingCurve']);
        for (const value3 of ['inTangent', 'outTangent', 'easingCurve']) {
          if (Object['hasOwn'](args, value3)) {
            if (args[value3]) el2[value3] = [...args[value3]];
            else delete el2[value3];
          }
        }
        return payload;
      });
    } catch (error) {
      this['timeline']['setMessage']?.(error['message']);
    }
  }
  ['handleClick'](enabled2) {
    if (!enabled2['startsWith']('timeline-camera-path-')) return ![];
    try {
      if (enabled2 === 'timeline-camera-path-edit') {
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
        if (enabled2 === 'timeline-camera-path-draw') this['drawing'] = !this['drawing'];
        else {
          if (enabled2 === 'timeline-camera-path-focus') {
            const value4 = this['viewport']?.['frameSceneView'](
              this['points']()['map']((value5) => value5['camera']['position']),
            );
            value4 &&
              (this['timeline']['getRuntime']?.()?.['setViewProjection']('perspective'),
              this['timeline']['getRuntime']?.()?.['commitSceneView'](value4));
          } else {
            if (enabled2 === 'timeline-camera-path-smooth')
              this['commit']((value6) => {
                const map2 = new Set(this['points']()['map']((value7) => value7['id'])),
                  list = this['objectId']
                    ? value6['objectTracks']['find']((value8) => value8['objectId'] === this['objectId'])?.[
                        'positionKeyframes'
                      ] || []
                    : value6['cameraKeyframes'];
                return (smoothDirectorKeys(list['filter']((value9) => map2['has'](value9['id']))), value6);
              });
            else {
              if (enabled2 === 'timeline-camera-path-linear')
                this['commit']((value10) => {
                  const map3 = new Set(this['points']()['map']((value11) => value11['id'])),
                    list2 = this['objectId']
                      ? value10['objectTracks']['find'](
                          (value12) => value12['objectId'] === this['objectId'],
                        )?.['positionKeyframes'] || []
                      : value10['cameraKeyframes'];
                  return (
                    list2['filter']((value13) => map3['has'](value13['id']))['forEach']((value14) => {
                      (delete value14['inTangent'], delete value14['outTangent']);
                    }),
                    value10
                  );
                });
              else {
                if (enabled2 === 'timeline-camera-path-delete' && this['selected']())
                  this['commit']((value15) => {
                    if (!this['objectId'])
                      return removeDirectorCameraPathPoint(value15, this['selected']()['id']);
                    const value16 = value15['objectTracks']['find'](
                        (value17) => value17['objectId'] === this['objectId'],
                      ),
                      value18 = this['selected']();
                    return (
                      (value16['positionKeyframes'] = value16['positionKeyframes']['filter'](
                        (value19) => value19['id'] !== value18['id'],
                      )),
                      (value16['rotationKeyframes'] = value16['rotationKeyframes']['filter'](
                        (value20) => Math['abs'](value20['time'] - value18['time']) >= 0.5 / value15['fps'],
                      )),
                      value15
                    );
                  });
              }
            }
          }
        }
      }
      this['timeline']['requestRender']?.();
    } catch (error2) {
      this['timeline']['setMessage']?.(error2['message']);
    }
    return !![];
  }
  ['handleChange'](event3) {
    if (this['curves']['change'](event3)) return !![];
    const easing = event3['target'];
    if (easing['matches']?.('[data-camera-path-object]'))
      return (
        (this['objectId'] =
          easing['value'] === 'camera'
            ? ''
            : this['context']()['scene']['objects']['filter'](
                (value21) => !['camera', 'light', 'group']['includes'](value21['type']),
              )[Number(easing['value'])]?.['id'] || ''),
        (this['selectedId'] = ''),
        (this['planeOffset'] =
          this['context']()['scene']['objects']['find']((value22) => value22['id'] === this['objectId'])?.[
            'transform'
          ]['position'][this['plane']] ?? 1.6),
        this['timeline']['requestRender']?.(),
        !![]
      );
    if (easing['matches']?.('[data-camera-path-draw-mode]'))
      return ((this['drawMode'] = easing['value']), !![]);
    if (easing['matches']?.('[data-camera-path-draw-duration]'))
      return (
        (this['drawDuration'] = Math['max'](0.1, Math['min'](0xe10, Number(easing['value']) || 0x3))),
        !![]
      );
    if (easing['matches']?.('[data-camera-path-selection]'))
      return (this['select'](this['points']()[Number(easing['value'])]?.['id']), !![]);
    if (easing['matches']?.('[data-camera-path-plane]'))
      return (
        (this['plane'] = Number(easing['value'])),
        (this['planeOffset'] = this['selected']()?.['camera']['position'][this['plane']] || 0x0),
        this['timeline']['requestRender']?.(),
        !![]
      );
    if (easing['matches']?.('[data-camera-path-easing]'))
      return (this['change']({ easing: easing['value'] }), !![]);
    if (!easing['matches']?.('[data-camera-path-field]')) return ![];
    const value23 = easing['dataset']['cameraPathField'],
      time = Number(easing['value']);
    if (!Number['isFinite'](time)) return !![];
    if (value23 === 'planeOffset') return ((this['planeOffset'] = time), !![]);
    const enabled3 = this['selected']();
    if (!enabled3) return !![];
    if (value23 === 'time') {
      if (enabled3['time'] !== time) this['change']({ time: time });
      return !![];
    }
    const camera = structuredClone(enabled3['camera']),
      [value24, value25] = value23['split']('-');
    if (value25 != null) camera[value24][Number(value25)] = time;
    else {
      camera[value24] = value24 === 'roll' ? (time * Math['PI']) / 0xb4 : time;
      if (value24 === 'focalLength') delete camera['fov'];
    }
    if (JSON['stringify'](camera) !== JSON['stringify'](enabled3['camera']))
      this['change']({ camera: camera });
    return !![];
  }
  ['select'](value26) {
    this['selectedId'] = value26 || '';
    const value27 = this['selected']();
    if (value27) this['timeline']['_sampleAt'](value27['time']);
    this['timeline']['requestRender']?.();
  }
  ['preview'](args2) {
    if (!this['active']) return ![];
    return (
      this['timeline']['getRuntime']?.()?.['previewTimelineSample']({ ...args2, camera: null }),
      (this['monitorCamera'] = args2['camera']),
      !![]
    );
  }
  ['sync']() {
    if (!this['active']) return;
    if (this['owner'] !== this['identity']()) {
      this['stop']();
      return;
    }
    const enabled4 = this['timeline']['getRuntime']?.();
    if (!enabled4 || enabled4['disposed']) return;
    const canvas = enabled4['getDirectorViewport'](),
      value28 = canvas['canvas']['parentElement'];
    if (this['viewport'] !== canvas || this['layer']?.['parentElement'] !== value28) {
      (this['detach'](), (this['viewport'] = canvas));
      const el3 = value28['ownerDocument'];
      ((this['layer'] = el3['createElement']('div')),
        (this['layer']['className'] = 'storyboard-3d-camera-path-overlay'),
        (this['layer']['innerHTML'] =
          '<svg\x20data-camera-path-overlay\x20aria-label=\x22摄像机轨道控制点\x22></svg><div\x20class=\x22storyboard-3d-camera-path-monitor\x22><span>镜头监看</span><canvas\x20data-camera-path-monitor\x20aria-label=\x22镜头监看，拖动调整朝向\x22></canvas></div>'),
        value28['append'](this['layer']),
        (this['svg'] = this['layer']['querySelector']('svg')),
        (this['monitorCanvas'] = this['layer']['querySelector']('canvas')),
        (this['root'] = this['timeline']['getRoot']()),
        this['root']['addEventListener']('pointerdown', this['onDown'], !![]),
        this['root']['addEventListener']('wheel', this['onWheel'], { capture: !![], passive: ![] }));
    }
    if (this['frame'] == null) {
      const value29 = () => {
        this['frame'] = null;
        if (!this['active'] || this['owner'] !== this['identity']() || !this['layer']?.['isConnected']) {
          this['stop']();
          return;
        }
        (this['paint'](), (this['frame'] = this['timeline']['window']['requestAnimationFrame'](value29)));
      };
      this['frame'] = this['timeline']['window']['requestAnimationFrame'](value29);
    }
  }
  ['paint']() {
    const list3 = this['points'](),
      value30 = list3['map'](
        (value31) => value31['id'] + ':' + Boolean(value31['inTangent'] || value31['outTangent']),
      )['join']('|');
    if (value30 !== this['svg']['dataset']['keys']) {
      (this['svg']['replaceChildren'](), (this['svg']['dataset']['keys'] = value30));
      const value32 = this['svg']['ownerDocument'];
      for (let value33 = 0x0; value33 < Math['max'](0x0, list3['length'] - 0x1); value33++) {
        const el4 = value32['createElementNS'](
          'http://www.w3.org/2000/svg',
          list3[value33]['outTangent'] || list3[value33 + 0x1]['inTangent'] ? 'path' : 'line',
        );
        ((el4['dataset']['segment'] = String(value33)), this['svg']['append'](el4));
      }
      list3['forEach']((value34, value35) => {
        const el5 = value32['createElementNS']('http://www.w3.org/2000/svg', 'circle');
        ((el5['dataset']['cameraPathPoint'] = String(value35)),
          el5['setAttribute']('r', '9'),
          el5['setAttribute']('tabindex', '0'),
          el5['setAttribute']('role', 'button'),
          el5['setAttribute']('aria-label', '摄像机控制点 ' + (value35 + 0x1)),
          this['svg']['append'](el5));
      });
    }
    const value36 = list3['map']((value37) =>
      this['viewport']['project'](
        this['drag']?.['id'] === value37['id']
          ? this['drag']['camera']['position']
          : value37['camera']['position'],
      ),
    );
    (this['svg']['querySelectorAll']('[data-segment]')['forEach']((el6, value38) => {
      if (el6['tagName'] === 'path') {
        const list4 = Array['from']({ length: 0x19 }, (value39, value40) =>
          this['viewport']['project'](
            sampleSpatialCurve(list3[value38], list3[value38 + 0x1], value40 / 0x18, 'camera'),
          ),
        );
        let enabled5 = ![];
        const value41 = list4['map']((box) => {
          if (!box) return ((enabled5 = ![]), '');
          const value42 = '' + (enabled5 ? 'L' : 'M') + box['x'] + '\x20' + box['y'];
          return ((enabled5 = !![]), value42);
        })['join']('\x20');
        el6['setAttribute']('d', value41);
        return;
      }
      const x1 = value36[value38],
        x2 = value36[value38 + 0x1];
      el6['style']['display'] = x1 && x2 ? '' : 'none';
      if (x1 && x2) {
        for (const [value43, value44] of Object['entries']({
          x1: x1['x'],
          y1: x1['y'],
          x2: x2['x'],
          y2: x2['y'],
        }))
          el6['setAttribute'](value43, value44);
      }
    }),
      this['svg']['querySelectorAll']('circle')['forEach']((el7, value45) => {
        const box2 = value36[value45];
        ((el7['style']['display'] = box2 ? '' : 'none'),
          box2 && (el7['setAttribute']('cx', box2['x']), el7['setAttribute']('cy', box2['y'])),
          el7['classList']['toggle']('is-selected', list3[value45]['id'] === this['selected']()?.['id']));
      }),
      this['layer']['classList']['toggle']('is-drawing', this['drawing']));
    const value46 =
        (!this['objectId'] && this['drag']?.['camera']) ||
        this['monitorCamera'] ||
        (!this['objectId'] && this['selected']()?.['camera']) ||
        this['context']()['shot']['camera'],
      value47 = this['timeline']['window']['performance']['now']();
    !this['monitorPending'] &&
      (!this['monitorPaintAt'] || value47 - this['monitorPaintAt'] > 0x21) &&
      ((this['monitorPaintAt'] = value47),
      (this['monitorPending'] = !![]),
      Promise['resolve'](this['viewport']['renderMonitor'](this['monitorCanvas'], value46))
        ['catch']((error3) => {
          (this['timeline']['setMessage']?.('镜头监看失败：' + error3['message']), this['stop']());
        })
        ['finally'](() => {
          this['monitorPending'] = ![];
        }));
  }
  ['pointerDown'](x) {
    if (this['curves']['down'](x)) return;
    if (!this['active'] || x['button'] !== 0x0 || this['timeline']['playing']) return;
    const enabled6 = x['target']['closest']?.('[data-camera-path-monitor]');
    if (enabled6 && this['objectId']) {
      (x['preventDefault'](), x['stopImmediatePropagation']());
      return;
    }
    const el8 = x['target']['closest']?.('[data-camera-path-point]'),
      value48 = x['target'] === this['viewport']?.['canvas'] || x['target'] === this['svg'];
    if (!el8 && !enabled6 && !(this['drawing'] && value48)) return;
    (x['preventDefault'](), x['stopImmediatePropagation']());
    if (!el8 && !enabled6) {
      const enabled7 = this['viewport']['pointOnPlane'](
        x['clientX'],
        x['clientY'],
        this['plane'],
        this['planeOffset'],
      );
      if (!enabled7) {
        this['timeline']['setMessage']?.('当前视角与编辑平面平行，请旋转视角或切换编辑平面。');
        return;
      }
      if (this['drawMode'] === 'freehand') {
        this['startFreehand'](x, enabled7);
        return;
      }
      try {
        if (this['objectId']) {
          const object = this['context']()['scene']['objects']['find'](
              (value49) => value49['id'] === this['objectId'],
            ),
            start = this['points']();
          (this['commit']((value50) =>
            authorDirectorPath(value50, {
              object: object,
              points: [
                ...(start['length']
                  ? start['map']((value51) => value51['camera']['position'])
                  : [object['transform']['position']]),
                enabled7,
              ],
              start: start[0x0]?.['time'] ?? this['timeline']['_timeForShot'](this['context']()['shot']),
              duration: Math['max'](0x1, start['length']),
            }),
          ),
            (this['selectedId'] = this['points']()['at'](-0x1)?.['id'] || ''),
            this['select'](this['selectedId']));
          return;
        }
        const structuredClone2 = structuredClone(
          this['selected']()?.['camera'] || this['context']()['shot']['camera'],
        );
        ((structuredClone2['position'] = enabled7),
          this['commit']((value52) => {
            const addDirectorCameraPathPoint2 = addDirectorCameraPathPoint(value52, structuredClone2);
            return (
              (this['selectedId'] = addDirectorCameraPathPoint2['cameraPath']['pointIds']['at'](-0x1)),
              addDirectorCameraPathPoint2
            );
          }));
      } catch (error4) {
        this['timeline']['setMessage']?.(error4['message']);
      }
      return;
    }
    const id = el8 ? this['points']()[Number(el8['dataset']['cameraPathPoint'])] : this['selected']();
    if (!id) return;
    ((this['selectedId'] = id['id']), this['timeline']['_sampleAt'](id['time']));
    const camera2 = structuredClone(id['camera']);
    ((this['drag'] = {
      id: id['id'],
      base: structuredClone(camera2),
      camera: camera2,
      monitor: Boolean(enabled6),
      x: x['clientX'],
      y: x['clientY'],
      origin: this['viewport']['pointOnPlane'](
        x['clientX'],
        x['clientY'],
        this['plane'],
        camera2['position'][this['plane']],
      ),
      snapshot: JSON['stringify'](this['context']()['shot']['animation']),
      target: x['target'],
      pointerId: x['pointerId'],
    }),
      x['target']['setPointerCapture']?.(x['pointerId']));
    const el9 = this['timeline']['window'];
    (el9['addEventListener']('pointermove', this['onMove'], !![]),
      el9['addEventListener']('pointerup', this['onUp'], !![]),
      el9['addEventListener']('pointercancel', this['onCancel'], !![]),
      x['target']['addEventListener']('lostpointercapture', this['onCancel']));
  }
  ['pointerMove'](event4) {
    const box3 = this['drag'];
    if (!box3 || event4['pointerId'] !== box3['pointerId']) return;
    (event4['preventDefault'](), event4['stopImmediatePropagation']());
    if (box3['monitor'])
      box3['camera'] = adjustSpatialCamera(
        box3['base'],
        event4['clientX'] - box3['x'],
        event4['clientY'] - box3['y'],
      );
    else {
      const value53 = this['viewport']['pointOnPlane'](
        event4['clientX'],
        event4['clientY'],
        this['plane'],
        box3['base']['position'][this['plane']],
      );
      if (value53 && box3['origin'])
        box3['camera']['position'] = box3['base']['position']['map'](
          (value54, value55) => value54 + value53[value55] - box3['origin'][value55],
        );
    }
  }
  ['startFreehand'](value56, value57) {
    const value58 = this['identity'](),
      value59 = JSON['stringify'](this['context']()['shot']['animation']),
      points = [value57],
      signal = new this['timeline']['window']['AbortController']();
    ((this['cancelDrawing'] = () => {
      (signal['abort'](),
        (this['cancelDrawing'] = null),
        this['freehandLine']?.['remove'](),
        (this['freehandLine'] = null));
    }),
      (this['freehandLine'] = this['svg']['ownerDocument']['createElementNS'](
        'http://www.w3.org/2000/svg',
        'polyline',
      )),
      this['svg']['append'](this['freehandLine']));
    const value60 = (event5) => {
      const list5 = this['viewport']['pointOnPlane'](
        event5['clientX'],
        event5['clientY'],
        this['plane'],
        this['planeOffset'],
      );
      if (
        !list5 ||
        points['length'] >= 0x64 ||
        Math['hypot'](...list5['map']((value61, value62) => value61 - points['at'](-0x1)[value62])) < 0.04
      )
        return;
      (points['push'](list5),
        this['freehandLine']['setAttribute'](
          'points',
          points['map']((value63) => this['viewport']['project'](value63))
            ['filter'](Boolean)
            ['map']((box4) => box4['x'] + ',' + box4['y'])
            ['join']('\x20'),
        ));
    };
    (this['timeline']['window']['addEventListener']('pointermove', value60, {
      signal: signal['signal'],
    }),
      this['timeline']['window']['addEventListener']('pointercancel', () => this['cancelDrawing']?.(), {
        signal: signal['signal'],
      }),
      this['timeline']['window']['addEventListener'](
        'pointerup',
        () => {
          this['cancelDrawing']?.();
          if (
            value58 !== this['identity']() ||
            value59 !== JSON['stringify'](this['context']()['shot']['animation'])
          )
            return;
          try {
            this['commit']((value64) =>
              authorDirectorPath(value64, {
                points: points,
                camera: this['selected']()?.['camera'] || this['context']()['shot']['camera'],
                object: this['context']()['scene']['objects']['find'](
                  (value65) => value65['id'] === this['objectId'],
                ),
                start: this['timeline']['_timeForShot'](this['context']()['shot']),
                duration: this['drawDuration'],
                smooth: !![],
              }),
            );
          } catch (error5) {
            this['timeline']['setMessage']?.(error5['message']);
          }
        },
        { once: !![], signal: signal['signal'] },
      ));
  }
  ['pointerEnd'](event6, value66 = ![]) {
    const camera3 = this['drag'];
    if (!camera3 || (event6 && event6['pointerId'] !== camera3['pointerId'])) return;
    (event6?.['stopImmediatePropagation'](), (this['drag'] = null));
    const el10 = this['timeline']['window'];
    (el10['removeEventListener']('pointermove', this['onMove'], !![]),
      el10['removeEventListener']('pointerup', this['onUp'], !![]),
      el10['removeEventListener']('pointercancel', this['onCancel'], !![]),
      camera3['target']['removeEventListener']('lostpointercapture', this['onCancel']));
    if (camera3['target']['hasPointerCapture']?.(camera3['pointerId']))
      camera3['target']['releasePointerCapture'](camera3['pointerId']);
    if (
      value66 ||
      this['owner'] !== this['identity']() ||
      camera3['snapshot'] !== JSON['stringify'](this['context']()['shot']['animation'])
    )
      return;
    if (JSON['stringify'](camera3['base']) !== JSON['stringify'](camera3['camera']))
      this['change']({ camera: camera3['camera'] });
    else this['select'](camera3['id']);
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
