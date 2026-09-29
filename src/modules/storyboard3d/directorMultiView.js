import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
import { clientToViewportNdc, intersectRayWithAxisPlane } from '../../core/math.js';
export class DirectorMultiView {
  constructor(_0x455d8a) {
    ((this['timeline'] = _0x455d8a), (this['scale'] = 0xc), (this['offset'] = [0x0, 0x1, 0x0]));
  }
  ['identity']() {
    const { project: _0x51238f, scene: _0x1c174a } = this['timeline']['_context']();
    return _0x51238f['id'] + ':' + _0x1c174a['id'];
  }
  ['toggle']() {
    if (this['layer']) {
      this['destroy']();
      return;
    }
    this['timeline']['cameraPath']['stop']();
    const _0xd271b1 = this['timeline']['getRuntime']?.();
    if (!_0xd271b1?.['bridge']?.['scene']) return;
    ((this['runtime'] = _0xd271b1), (this['owner'] = this['identity']()));
    const _0x34b4e3 = this['timeline']['window']['document'],
      _0xf94828 = _0xd271b1['bridge']['renderer']['domElement']['parentElement'];
    ((this['layer'] = _0x34b4e3['createElement']('div')),
      (this['layer']['className'] = 'storyboard-3d-director-quad'),
      (this['layer']['innerHTML'] =
        '<canvas data-director-quad tabindex="0" aria-label="四视图，拖动选中物体，滚轮缩放，右键拖动平移"></canvas><span>透视</span><span>俯视</span><span>正视</span><span>右视</span><button type="button" data-director-quad-close>关闭四视图</button>'),
      _0xf94828['append'](this['layer']),
      (this['canvas'] = this['layer']['querySelector']('canvas')),
      (this['renderer'] = new threeRuntime['WebGLRenderer']({
        canvas: this['canvas'],
        antialias: !![],
        alpha: !![],
      })),
      (this['renderer']['outputColorSpace'] = _0xd271b1['bridge']['renderer']['outputColorSpace']),
      (this['renderer']['toneMapping'] = _0xd271b1['bridge']['renderer']['toneMapping']),
      (this['renderer']['toneMappingExposure'] = _0xd271b1['bridge']['renderer']['toneMappingExposure']),
      (this['cameras'] = [
        new threeRuntime['PerspectiveCamera'](),
        ...Array['from']({ length: 0x3 }, () => new threeRuntime['OrthographicCamera']()),
      ]),
      (this['abort'] = new this['timeline']['window']['AbortController']()));
    const _0x1ad27a = this['abort']['signal'];
    (this['layer']['addEventListener']('pointerdown', (_0x41a959) => this['down'](_0x41a959), {
      capture: !![],
      signal: _0x1ad27a,
    }),
      this['layer']['addEventListener']('contextmenu', (_0x1800af) => _0x1800af['preventDefault'](), {
        signal: _0x1ad27a,
      }),
      this['layer']
        ['querySelector']('button')
        ['addEventListener']('click', () => this['destroy'](), { signal: _0x1ad27a }),
      this['layer']['addEventListener'](
        'wheel',
        (_0x4f1fef) => {
          (_0x4f1fef['preventDefault'](),
            _0x4f1fef['stopPropagation'](),
            (this['scale'] = Math['max'](
              0x1,
              Math['min'](0x3e8, this['scale'] * (_0x4f1fef['deltaY'] > 0x0 ? 1.1 : 0.9)),
            )));
        },
        { signal: _0x1ad27a, passive: ![] },
      ),
      this['layer']['addEventListener'](
        'keydown',
        (_0x3e7da8) => {
          if (_0x3e7da8['key'] === 'Escape') {
            (_0x3e7da8['preventDefault'](), _0x3e7da8['stopImmediatePropagation']());
            if (this['cancel']) this['cancel']();
            else this['destroy']();
          }
        },
        { capture: !![], signal: _0x1ad27a },
      ));
    let _0x227d0d = 0x0;
    const _0x43d6bf = (_0x501182) => {
      if (!this['layer']?.['isConnected'] || _0xd271b1['disposed'] || this['owner'] !== this['identity']()) {
        this['destroy']();
        return;
      }
      (_0x501182 - _0x227d0d > 0x21 && (this['paint'](), (_0x227d0d = _0x501182)),
        (this['frame'] = this['timeline']['window']['requestAnimationFrame'](_0x43d6bf)));
    };
    (this['canvas']['focus'](),
      (this['frame'] = this['timeline']['window']['requestAnimationFrame'](_0x43d6bf)));
  }
  ['paint']() {
    const _0x598d68 = Math['max'](0x2, this['canvas']['clientWidth']),
      _0x1d99b9 = Math['max'](0x2, this['canvas']['clientHeight']),
      _0x2b9cea = Math['floor'](_0x598d68 / 0x2),
      _0x4989d3 = Math['floor'](_0x1d99b9 / 0x2);
    if (this['canvas']['width'] !== _0x598d68 || this['canvas']['height'] !== _0x1d99b9)
      this['renderer']['setSize'](_0x598d68, _0x1d99b9, ![]);
    const _0xd5617b = this['runtime']['bridge']['camera'],
      _0x480534 = new threeRuntime['Vector3'](...this['offset']),
      _0x2d14aa = this['cameras'][0x0];
    (_0x2d14aa['position']['copy'](_0xd5617b['position']),
      _0x2d14aa['quaternion']['copy'](_0xd5617b['quaternion']),
      Object['assign'](_0x2d14aa, {
        aspect: _0x2b9cea / _0x4989d3,
        near: _0xd5617b['near'],
        far: _0xd5617b['far'],
        fov: _0xd5617b['fov'] || 0x23,
      }),
      _0x2d14aa['updateProjectionMatrix'](),
      [
        [0x0, 0x1, 0x0],
        [0x0, 0x0, 0x1],
        [0x1, 0x0, 0x0],
      ]['forEach']((_0x35d6a6, _0x5b0cad) => {
        const _0x4feded = this['cameras'][_0x5b0cad + 0x1];
        (_0x4feded['position']
          ['copy'](_0x480534)
          ['addScaledVector'](new threeRuntime['Vector3'](..._0x35d6a6), 0x3e8),
          _0x4feded['up']['set'](0x0, _0x5b0cad === 0x0 ? 0x0 : 0x1, _0x5b0cad === 0x0 ? -0x1 : 0x0),
          _0x4feded['lookAt'](_0x480534),
          Object['assign'](_0x4feded, {
            left: (-this['scale'] * _0x2b9cea) / _0x4989d3 / 0x2,
            right: (this['scale'] * _0x2b9cea) / _0x4989d3 / 0x2,
            top: this['scale'] / 0x2,
            bottom: -this['scale'] / 0x2,
            near: 0.01,
            far: 0xbb8,
          }),
          _0x4feded['updateProjectionMatrix'](),
          _0x4feded['updateMatrixWorld']());
      }),
      this['runtime']['bridge']['_withCleanCaptureFrame'](() => {
        (this['renderer']['setScissorTest'](!![]),
          this['cameras']['forEach']((_0x444018, _0x535801) => {
            const _0x50b5af = (_0x535801 % 0x2) * _0x2b9cea,
              _0xd34454 = _0x535801 < 0x2 ? _0x4989d3 : 0x0;
            (this['renderer']['setViewport'](_0x50b5af, _0xd34454, _0x2b9cea, _0x4989d3),
              this['renderer']['setScissor'](_0x50b5af, _0xd34454, _0x2b9cea, _0x4989d3),
              this['renderer']['render'](this['runtime']['bridge']['scene'], _0x444018));
          }),
          this['renderer']['setScissorTest'](![]));
      }));
  }
  ['ray'](_0x491a97, _0x57fe5f) {
    const _0x2b54f2 = this['canvas']['getBoundingClientRect'](),
      _0x1a9430 = {
        left: _0x2b54f2['left'] + ((_0x57fe5f % 0x2) * _0x2b54f2['width']) / 0x2,
        top: _0x2b54f2['top'] + (Math['floor'](_0x57fe5f / 0x2) * _0x2b54f2['height']) / 0x2,
        width: _0x2b54f2['width'] / 0x2,
        height: _0x2b54f2['height'] / 0x2,
      },
      _0x19bfb3 = clientToViewportNdc(_0x491a97['clientX'], _0x491a97['clientY'], _0x1a9430);
    if (!_0x19bfb3) return null;
    const _0xffdc90 = new threeRuntime['Raycaster']();
    return (_0xffdc90['setFromCamera'](_0x19bfb3, this['cameras'][_0x57fe5f]), _0xffdc90['ray']);
  }
  ['down'](_0x114af5) {
    if (_0x114af5['target'] !== this['canvas'] || ![0x0, 0x2]['includes'](_0x114af5['button'])) return;
    (_0x114af5['preventDefault'](), _0x114af5['stopImmediatePropagation'](), this['canvas']['focus']());
    const _0x58ab10 = this['canvas']['getBoundingClientRect'](),
      _0x773333 =
        (_0x114af5['clientX'] >= _0x58ab10['left'] + _0x58ab10['width'] / 0x2 ? 0x1 : 0x0) +
        (_0x114af5['clientY'] >= _0x58ab10['top'] + _0x58ab10['height'] / 0x2 ? 0x2 : 0x0),
      { project: _0x30edd2, scene: _0x100f80, editorState: _0x4c4f37 } = this['timeline']['_context'](),
      _0x1ce723 = _0x100f80['objects']['find'](
        (_0x5e5936) => _0x5e5936['id'] === _0x4c4f37['selectedObjectIds']['at'](-0x1),
      ),
      _0xcbb9f7 = _0x114af5['button'] === 0x2;
    if (!_0xcbb9f7 && (!_0x1ce723 || _0x1ce723['locked'] || _0x1ce723['type'] === 'group')) {
      this['timeline']['setMessage']?.('请先在对象列表选择一个已解锁物体。');
      return;
    }
    const _0x5a23cd =
        !_0xcbb9f7 && (this['timeline']['getPreviewTransform'](_0x1ce723['id']) || _0x1ce723['transform']),
      _0x41f2e4 = _0x773333 === 0x2 ? 0x2 : _0x773333 === 0x3 ? 0x0 : 0x1,
      _0x51ed40 = _0xcbb9f7 ? [...this['offset']] : [..._0x5a23cd['position']],
      _0x5af659 = this['ray'](_0x114af5, _0x773333),
      _0x1dd9f5 =
        _0x5af659 &&
        intersectRayWithAxisPlane(
          _0x5af659['origin']['toArray'](),
          _0x5af659['direction']['toArray'](),
          _0x41f2e4,
          _0x51ed40[_0x41f2e4],
        );
    if (!_0x1dd9f5) return;
    const _0x572a12 = JSON['stringify'](_0x100f80),
      _0x20e7c3 = new this['timeline']['window']['AbortController']();
    let _0x16b6d7 = _0x51ed40;
    (this['cancel']?.(),
      (this['cancel'] = () => {
        _0x20e7c3['abort']();
        if (!_0xcbb9f7) this['runtime']['clearObjectTransformPreview'](_0x1ce723['id']);
        this['cancel'] = null;
      }),
      this['timeline']['window']['addEventListener'](
        'pointermove',
        (_0x1b1539) => {
          if (_0x1b1539['pointerId'] !== _0x114af5['pointerId']) return;
          const _0xc36e34 = this['ray'](_0x1b1539, _0x773333),
            _0x4030eb =
              _0xc36e34 &&
              intersectRayWithAxisPlane(
                _0xc36e34['origin']['toArray'](),
                _0xc36e34['direction']['toArray'](),
                _0x41f2e4,
                _0x51ed40[_0x41f2e4],
              );
          if (!_0x4030eb) return;
          _0x16b6d7 = _0x51ed40['map'](
            (_0x1f587, _0xded9e4) =>
              _0x1f587 + (_0x4030eb[_0xded9e4] - _0x1dd9f5[_0xded9e4]) * (_0xcbb9f7 ? -0x1 : 0x1),
          );
          if (_0xcbb9f7) this['offset'] = _0x16b6d7;
          else
            this['runtime']['previewObjectTransforms']({
              [_0x1ce723['id']]: { ..._0x5a23cd, position: _0x16b6d7 },
            });
        },
        { signal: _0x20e7c3['signal'] },
      ),
      this['timeline']['window']['addEventListener']('pointercancel', () => this['cancel']?.(), {
        signal: _0x20e7c3['signal'],
      }),
      this['timeline']['window']['addEventListener'](
        'pointerup',
        (_0xe88e9b) => {
          if (_0xe88e9b['pointerId'] !== _0x114af5['pointerId']) return;
          this['cancel']?.();
          if (
            _0xcbb9f7 ||
            this['owner'] !== this['identity']() ||
            _0x572a12 !== JSON['stringify'](this['timeline']['_context']()['scene'])
          )
            return;
          if (
            this['timeline']['recordObjectTransforms'](
              { [_0x1ce723['id']]: { ..._0x5a23cd, position: _0x16b6d7 } },
              'move',
            )
          ) {
            this['timeline']['requestRender']?.();
            return;
          }
          this['timeline']['commitMutation']({
            type: 'director-quad-transform',
            label: '四视图移动物体',
            mutate: (_0x2fdffe) => {
              if (_0x2fdffe['id'] === _0x30edd2['id']) {
                const _0x183c69 = _0x2fdffe['scenes']
                  ['find']((_0x4b41c6) => _0x4b41c6['id'] === _0x100f80['id'])
                  ?.['objects']['find']((_0xfab3ac) => _0xfab3ac['id'] === _0x1ce723['id']);
                if (_0x183c69) _0x183c69['transform']['position'] = [..._0x16b6d7];
              }
              return _0x2fdffe;
            },
          });
        },
        { signal: _0x20e7c3['signal'] },
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
