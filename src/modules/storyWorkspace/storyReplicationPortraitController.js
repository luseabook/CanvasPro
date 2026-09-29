import { normalizedMediaDragRect } from '../../core/math.js';
import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
export function createStoryReplicationPortraitEditor({
  card: _0x4baf6f,
  character: _0x240c00,
  capture: _0x224858,
  isActive: _0x504762,
  onSaved: _0x289c14,
  showToast: _0x2836a6,
}) {
  if (!_0x240c00['frame']?.['url'])
    return (_0x2836a6('请先保存该人物的代表画面，再裁剪人物图。', 'warn'), null);
  const _0x7172be = _0x240c00['frame'],
    _0x522b14 = () => _0x504762() && _0x240c00['frame'] === _0x7172be,
    _0x4aae11 = _0x4baf6f['ownerDocument'],
    _0x26e908 = _0x4aae11['createElement']('section');
  ((_0x26e908['className'] = 'story-source-portrait-editor'),
    (_0x26e908['innerHTML'] =
      '<strong>拖动框选人物，或输入裁剪百分比</strong><div class="story-source-portrait-image"><img draggable="false" alt="框选原片人物"><span class="story-source-portrait-rect"></span></div>\n    <div class="story-source-portrait-values">' +
      [
        ['x', '左侧'],
        ['y', '顶部'],
        ['width', '宽度'],
        ['height', '高度'],
      ]
        ['map'](
          ([_0x46eec0, _0xe91395]) =>
            '<label>' +
            _0xe91395 +
            '%<input type="number" min="0" max="100" step="1" data-crop-value="' +
            _0x46eec0 +
            '\x22></label>',
        )
        ['join']('') +
      '</div>\x0a\x20\x20\x20\x20<div\x20class=\x22story-source-actions\x22><button\x20type=\x22button\x22\x20data-crop-save>保存人物图</button><button\x20type=\x22button\x22\x20data-crop-close>取消</button></div><span\x20role=\x22status\x22></span>'),
    (_0x26e908['querySelector']('img')['src'] = _0x7172be['url']),
    _0x4baf6f['append'](_0x26e908));
  const _0x11bfb1 = _0x26e908['querySelector']('.story-source-portrait-image'),
    _0x459d34 = _0x11bfb1['querySelector']('img'),
    _0x43883c = _0x11bfb1['querySelector']('span');
  let _0x23c000 = { x: 0x0, y: 0x0, width: 0x1, height: 0x1 },
    _0x418de5 = null,
    _0x1c9982 = null,
    _0x427f65 = ![],
    _0x236842 = ![];
  function _0x18deae() {
    for (const [_0x4ca0f3, _0x443b7e] of Object['entries'](_0x23c000)) {
      (_0x43883c['style']['setProperty']('--crop-' + _0x4ca0f3, _0x443b7e * 0x64 + '%'),
        (_0x26e908['querySelector']('[data-crop-value=\x22' + _0x4ca0f3 + '\x22]')['value'] = String(
          Math['round'](_0x443b7e * 0x64),
        )));
    }
  }
  function _0x4866e2() {
    const _0xb1d715 = _0x1c9982;
    ((_0x1c9982 = null), (_0x418de5 = null));
    if (_0xb1d715 !== null && _0x11bfb1['hasPointerCapture']?.(_0xb1d715))
      _0x11bfb1['releasePointerCapture'](_0xb1d715);
  }
  function _0x5dbf21() {
    ((_0x427f65 = !![]), _0x4866e2(), _0x26e908['remove']());
  }
  (_0x11bfb1['addEventListener']('pointerdown', (_0x7314f5) => {
    if (_0x236842 || _0x7314f5['button'] !== 0x0 || !_0x459d34['naturalWidth']) return;
    ((_0x418de5 = { x: _0x7314f5['clientX'], y: _0x7314f5['clientY'] }),
      (_0x1c9982 = _0x7314f5['pointerId']),
      _0x11bfb1['setPointerCapture'](_0x7314f5['pointerId']),
      _0x7314f5['preventDefault']());
  }),
    _0x11bfb1['addEventListener']('pointermove', (_0xfa63b7) => {
      if (!_0x418de5 || _0x236842) return;
      ((_0x23c000 = normalizedMediaDragRect(_0x459d34['getBoundingClientRect'](), _0x418de5, {
        x: _0xfa63b7['clientX'],
        y: _0xfa63b7['clientY'],
      })),
        _0x18deae());
    }));
  for (const _0x4a57fe of ['pointerup', 'pointercancel', 'lostpointercapture'])
    _0x11bfb1['addEventListener'](_0x4a57fe, _0x4866e2);
  return (
    _0x26e908['addEventListener']('input', (_0x409b60) => {
      if (_0x236842 || !_0x409b60['target']['dataset']['cropValue']) return;
      ((_0x23c000[_0x409b60['target']['dataset']['cropValue']] = Number(_0x409b60['target']['value']) / 0x64),
        _0x18deae());
    }),
    _0x26e908['addEventListener']('click', async (_0x51531b) => {
      if (_0x51531b['target']['closest']('[data-crop-close]')) {
        _0x5dbf21();
        return;
      }
      if (!_0x51531b['target']['closest']('[data-crop-save]') || _0x236842 || _0x427f65) return;
      if (!_0x522b14()) {
        (_0x2836a6('代表画面已变化，请重新打开人物裁剪。', 'warn'), _0x5dbf21());
        return;
      }
      if (
        Object['values'](_0x23c000)['some'](
          (_0x575870) => !Number['isFinite'](_0x575870) || _0x575870 < 0x0,
        ) ||
        _0x23c000['width'] <= 0x0 ||
        _0x23c000['height'] <= 0x0 ||
        _0x23c000['x'] + _0x23c000['width'] > 1.000001 ||
        _0x23c000['y'] + _0x23c000['height'] > 1.000001
      ) {
        _0x2836a6('请在原图范围内框选完整人物。', 'warn');
        return;
      }
      ((_0x236842 = !![]),
        _0x26e908['setAttribute']('aria-busy', 'true'),
        (_0x26e908['querySelector']('[role=status]')['innerHTML'] =
          renderStoryGenerationSpinner({ button: !![] }) + '正在保存人物图…'),
        _0x26e908['querySelectorAll']('input, [data-crop-save]')['forEach']((_0x1073c4) => {
          _0x1073c4['disabled'] = !![];
        }));
      try {
        const _0x33d87d = await _0x224858({
          crop: { ..._0x23c000 },
          timeSec: _0x7172be['timeSec'] ?? _0x240c00['representativeTimeSec'],
          isActive: () => !_0x427f65 && _0x522b14(),
        });
        _0x33d87d &&
          !_0x427f65 &&
          _0x522b14() &&
          ((_0x240c00['portrait'] = _0x33d87d), _0x289c14(), _0x5dbf21());
      } catch (_0x8217a3) {
        if (!_0x427f65) _0x2836a6(_0x8217a3?.['message'] || '人物图保存失败。', 'error');
      } finally {
        ((_0x236842 = ![]),
          !_0x427f65 &&
            (_0x26e908['setAttribute']('aria-busy', 'false'),
            (_0x26e908['querySelector']('[role=status]')['textContent'] = ''),
            _0x26e908['querySelectorAll']('input, [data-crop-save]')['forEach']((_0x4c274b) => {
              _0x4c274b['disabled'] = ![];
            })));
      }
    }),
    _0x18deae(),
    { destroy: _0x5dbf21 }
  );
}
