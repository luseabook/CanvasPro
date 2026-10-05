import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
import { clientToViewportNdc, intersectRayWithAxisPlane } from '../../core/math.js';
export class DirectorMultiView {
  constructor(value) {
    ((this['timeline'] = value), (this['scale'] = 12), (this['offset'] = [0, 1, 0]));
  }
  ['identity']() {
    const { project: project, scene: scene } = this['timeline']['_context']();
    return project['id'] + ':' + scene['id'];
  }
  ['toggle']() {
    if (this['layer']) {
      this['destroy']();
      return;
    }
    this['timeline']['cameraPath']['stop']();
    const enabled = this['timeline']['getRuntime']?.();
    if (!enabled?.['bridge']?.['scene']) return;
    ((this['runtime'] = enabled), (this['owner'] = this['identity']()));
    const el = this['timeline']['window']['document'],
      item = enabled['bridge']['renderer']['domElement']['parentElement'];
    ((this['layer'] = el['createElement']('div')),
      (this['layer']['className'] = 'storyboard-3d-director-quad'),
      (this['layer']['innerHTML'] =
        '<canvas data-director-quad tabindex="0" aria-label="四视图，拖动选中物体，滚轮缩放，右键拖动平移"></canvas><span>透视</span><span>俯视</span><span>正视</span><span>右视</span><button type="button" data-director-quad-close>关闭四视图</button>'),
      item['append'](this['layer']),
      (this['canvas'] = this['layer']['querySelector']('canvas')),
      (this['renderer'] = new threeRuntime['WebGLRenderer']({
        canvas: this['canvas'],
        antialias: true,
        alpha: true,
      })),
      (this['renderer']['outputColorSpace'] = enabled['bridge']['renderer']['outputColorSpace']),
      (this['renderer']['toneMapping'] = enabled['bridge']['renderer']['toneMapping']),
      (this['renderer']['toneMappingExposure'] = enabled['bridge']['renderer']['toneMappingExposure']),
      (this['cameras'] = [
        new threeRuntime['PerspectiveCamera'](),
        ...Array['from']({ length: 3 }, () => new threeRuntime['OrthographicCamera']()),
      ]),
      (this['abort'] = new this['timeline']['window']['AbortController']()));
    const signal = this['abort']['signal'];
    (this['layer']['addEventListener']('pointerdown', (key) => this['down'](key), {
      capture: true,
      signal: signal,
    }),
      this['layer']['addEventListener']('contextmenu', (event) => event['preventDefault'](), {
        signal: signal,
      }),
      this['layer']
        ['querySelector']('button')
        ['addEventListener']('click', () => this['destroy'](), { signal: signal }),
      this['layer']['addEventListener'](
        'wheel',
        (event2) => {
          (event2['preventDefault'](),
            event2['stopPropagation'](),
            (this['scale'] = Math['max'](
              1,
              Math['min'](1000, this['scale'] * (event2['deltaY'] > 0 ? 1.1 : 0.9)),
            )));
        },
        { signal: signal, passive: false },
      ),
      this['layer']['addEventListener'](
        'keydown',
        (event3) => {
          if (event3['key'] === 'Escape') {
            (event3['preventDefault'](), event3['stopImmediatePropagation']());
            if (this['cancel']) this['cancel']();
            else this['destroy']();
          }
        },
        { capture: true, signal: signal },
      ));
    let count = 0;
    const index = (result) => {
      if (!this['layer']?.['isConnected'] || enabled['disposed'] || this['owner'] !== this['identity']()) {
        this['destroy']();
        return;
      }
      (result - count > 33 && (this['paint'](), (count = result)),
        (this['frame'] = this['timeline']['window']['requestAnimationFrame'](index)));
    };
    (this['canvas']['focus'](), (this['frame'] = this['timeline']['window']['requestAnimationFrame'](index)));
  }
  ['paint']() {
    const data = Math['max'](2, this['canvas']['clientWidth']),
      options = Math['max'](2, this['canvas']['clientHeight']),
      aspect = Math['floor'](data / 2),
      target = Math['floor'](options / 2);
    if (this['canvas']['width'] !== data || this['canvas']['height'] !== options)
      this['renderer']['setSize'](data, options, false);
    const near = this['runtime']['bridge']['camera'],
      source = new threeRuntime['Vector3'](...this['offset']),
      next = this['cameras'][0];
    (next['position']['copy'](near['position']),
      next['quaternion']['copy'](near['quaternion']),
      Object['assign'](next, {
        aspect: aspect / target,
        near: near['near'],
        far: near['far'],
        fov: near['fov'] || 35,
      }),
      next['updateProjectionMatrix'](),
      [
        [0, 1, 0],
        [0, 0, 1],
        [1, 0, 0],
      ]['forEach']((args, count2) => {
        const current = this['cameras'][count2 + 1];
        (current['position']['copy'](source)['addScaledVector'](new threeRuntime['Vector3'](...args), 1000),
          current['up']['set'](0, count2 === 0 ? 0 : 1, count2 === 0 ? -1 : 0),
          current['lookAt'](source),
          Object['assign'](current, {
            left: (-this['scale'] * aspect) / target / 2,
            right: (this['scale'] * aspect) / target / 2,
            top: this['scale'] / 2,
            bottom: -this['scale'] / 2,
            near: 0.01,
            far: 3000,
          }),
          current['updateProjectionMatrix'](),
          current['updateMatrixWorld']());
      }),
      this['runtime']['bridge']['_withCleanCaptureFrame'](() => {
        (this['renderer']['setScissorTest'](true),
          this['cameras']['forEach']((entry, count3) => {
            const record = (count3 % 2) * aspect,
              payload = count3 < 2 ? target : 0;
            (this['renderer']['setViewport'](record, payload, aspect, target),
              this['renderer']['setScissor'](record, payload, aspect, target),
              this['renderer']['render'](this['runtime']['bridge']['scene'], entry));
          }),
          this['renderer']['setScissorTest'](false));
      }));
  }
  ['ray'](event4, handle) {
    const left = this['canvas']['getBoundingClientRect'](),
      state = {
        left: left['left'] + ((handle % 2) * left['width']) / 2,
        top: left['top'] + (Math['floor'](handle / 2) * left['height']) / 2,
        width: left['width'] / 2,
        height: left['height'] / 2,
      },
      viewportNdc = clientToViewportNdc(event4['clientX'], event4['clientY'], state);
    if (!viewportNdc) return null;
    const config = new threeRuntime['Raycaster']();
    return (config['setFromCamera'](viewportNdc, this['cameras'][handle]), config['ray']);
  }
  ['down'](event5) {
    if (event5['target'] !== this['canvas'] || ![0, 2]['includes'](event5['button'])) return;
    (event5['preventDefault'](), event5['stopImmediatePropagation'](), this['canvas']['focus']());
    const box = this['canvas']['getBoundingClientRect'](),
      count4 =
        (event5['clientX'] >= box['left'] + box['width'] / 2 ? 1 : 0) +
        (event5['clientY'] >= box['top'] + box['height'] / 2 ? 2 : 0),
      { project: project2, scene: scene2, editorState: editorState } = this['timeline']['_context'](),
      enabled2 = scene2['objects']['find'](
        (scope) => scope['id'] === editorState['selectedObjectIds']['at'](-1),
      ),
      enabled3 = event5['button'] === 2;
    if (!enabled3 && (!enabled2 || enabled2['locked'] || enabled2['type'] === 'group')) {
      this['timeline']['setMessage']?.('请先在对象列表选择一个已解锁物体。');
      return;
    }
    const args2 =
        !enabled3 && (this['timeline']['getPreviewTransform'](enabled2['id']) || enabled2['transform']),
      input = count4 === 2 ? 2 : count4 === 3 ? 0 : 1,
      list = enabled3 ? [...this['offset']] : [...args2['position']],
      output = this['ray'](event5, count4),
      enabled4 =
        output &&
        intersectRayWithAxisPlane(
          output['origin']['toArray'](),
          output['direction']['toArray'](),
          input,
          list[input],
        );
    if (!enabled4) return;
    const value2 = JSON['stringify'](scene2),
      signal2 = new this['timeline']['window']['AbortController']();
    let position = list;
    (this['cancel']?.(),
      (this['cancel'] = () => {
        signal2['abort']();
        if (!enabled3) this['runtime']['clearObjectTransformPreview'](enabled2['id']);
        this['cancel'] = null;
      }),
      this['timeline']['window']['addEventListener'](
        'pointermove',
        (event6) => {
          if (event6['pointerId'] !== event5['pointerId']) return;
          const value3 = this['ray'](event6, count4),
            enabled5 =
              value3 &&
              intersectRayWithAxisPlane(
                value3['origin']['toArray'](),
                value3['direction']['toArray'](),
                input,
                list[input],
              );
          if (!enabled5) return;
          position = list['map'](
            (value4, value5) => value4 + (enabled5[value5] - enabled4[value5]) * (enabled3 ? -1 : 1),
          );
          if (enabled3) this['offset'] = position;
          else
            this['runtime']['previewObjectTransforms']({
              [enabled2['id']]: { ...args2, position: position },
            });
        },
        { signal: signal2['signal'] },
      ),
      this['timeline']['window']['addEventListener']('pointercancel', () => this['cancel']?.(), {
        signal: signal2['signal'],
      }),
      this['timeline']['window']['addEventListener'](
        'pointerup',
        (event7) => {
          if (event7['pointerId'] !== event5['pointerId']) return;
          this['cancel']?.();
          if (
            enabled3 ||
            this['owner'] !== this['identity']() ||
            value2 !== JSON['stringify'](this['timeline']['_context']()['scene'])
          )
            return;
          if (
            this['timeline']['recordObjectTransforms'](
              { [enabled2['id']]: { ...args2, position: position } },
              'move',
            )
          ) {
            this['timeline']['requestRender']?.();
            return;
          }
          this['timeline']['commitMutation']({
            type: 'director-quad-transform',
            label: '四视图移动物体',
            mutate: (value6) => {
              if (value6['id'] === project2['id']) {
                const value7 = value6['scenes']
                  ['find']((value8) => value8['id'] === scene2['id'])
                  ?.['objects']['find']((value9) => value9['id'] === enabled2['id']);
                if (value7) value7['transform']['position'] = [...position];
              }
              return value6;
            },
          });
        },
        { signal: signal2['signal'] },
      ));
  }
  ['destroy']() {
    (this['cancel']?.(), this['abort']?.['abort']());
    if (this['frame'] != null) this['timeline']['window']['cancelAnimationFrame'](this['frame']);
    ((this['frame'] = null),
      this['renderer']?.['dispose'](),
      this['renderer']?.['forceContextLoss'](),
      (this['renderer'] = null),
      this['layer']?.['remove'](),
      (this['layer'] = null));
  }
}
