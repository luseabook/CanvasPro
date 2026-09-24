const curvePath = (_0x545b37) =>
  'M20 120 C' +
  (0x14 + _0x545b37[0x0] * 0xa0) +
  '\x20' +
  (0x78 - _0x545b37[0x1] * 0x64) +
  ',' +
  (0x14 + _0x545b37[0x2] * 0xa0) +
  '\x20' +
  (0x78 - _0x545b37[0x3] * 0x64) +
  ',180 20';
export function renderDirectorCurveEditor(_0x150426) {
  const _0x41bd95 = _0x150426['easingCurve'] || [0x0, 0x0, 0x1, 0x1];
  return (
    '<details class="storyboard-3d-director-curve"><summary>运动曲线与空间切线</summary>\n    <svg viewBox="0 0 200 140" data-director-curve aria-label="缓动曲线，拖动控制柄调整速度">\n      <path data-curve-line d="' +
    curvePath(_0x41bd95) +
    '"/>\n      ' +
    [0x0, 0x1]
      ['map'](
        (_0x282a2c) =>
          '<circle tabindex="0" role="slider" aria-label="缓动控制柄 ' +
          (_0x282a2c + 0x1) +
          '，方向键微调" data-curve-handle="' +
          _0x282a2c +
          '" cx="' +
          (0x14 + _0x41bd95[_0x282a2c * 0x2] * 0xa0) +
          '" cy="' +
          (0x78 - _0x41bd95[_0x282a2c * 0x2 + 0x1] * 0x64) +
          '\x22\x20r=\x226\x22/>',
      )
      ['join']('') +
    '\n    </svg><div class="storyboard-3d-director-fields">' +
    _0x41bd95['map'](
      (_0x4ea349, _0x4da26e) =>
        '<label>' +
        ['起点 X', '起点\x20Y', '终点\x20X', '终点 Y'][_0x4da26e] +
        '<input type="number" step="0.05" min="' +
        (_0x4da26e % 0x2 ? -0x4 : 0x0) +
        '" max="' +
        (_0x4da26e % 0x2 ? 0x4 : 0x1) +
        '" data-curve-value="' +
        _0x4da26e +
        '" value="' +
        _0x4ea349 +
        '"></label>',
    )['join']('') +
    '</div>\x0a\x20\x20\x20\x20' +
    ['inTangent', 'outTangent']
      ['map'](
        (_0x1a5535) =>
          '<div class="storyboard-3d-director-fields"><b>' +
          (_0x1a5535 === 'inTangent' ? '入' : '出') +
          '切线 / 米</b>' +
          (_0x150426[_0x1a5535] || [0x0, 0x0, 0x0])
            ['map'](
              (_0x1b5250, _0x59bf80) =>
                '<label>' +
                ['X', 'Y', 'Z'][_0x59bf80] +
                '<input type="number" step="0.1" data-curve-tangent="' +
                _0x1a5535 +
                '" data-axis="' +
                _0x59bf80 +
                '\x22\x20value=\x22' +
                _0x1b5250 +
                '\x22></label>',
            )
            ['join']('') +
          '</div>',
      )
      ['join']('') +
    '</details>'
  );
}
export class DirectorCurveEditor {
  constructor(_0x258312) {
    this['path'] = _0x258312;
  }
  ['change'](_0x338ee3) {
    const _0x11d69e = _0x338ee3['target'],
      _0x3441b4 = this['path']['selected']();
    if (!_0x3441b4 || !_0x11d69e['matches']?.('[data-curve-value],[data-curve-tangent]')) return ![];
    const _0x52b2bf = Number(_0x11d69e['value']);
    if (!Number['isFinite'](_0x52b2bf)) return !![];
    if (_0x11d69e['dataset']['curveValue'] != null) {
      const _0x513bd3 = [...(_0x3441b4['easingCurve'] || [0x0, 0x0, 0x1, 0x1])];
      ((_0x513bd3[Number(_0x11d69e['dataset']['curveValue'])] = _0x52b2bf),
        this['path']['change']({ easingCurve: _0x513bd3 }));
    } else {
      const _0x1244d6 = _0x11d69e['dataset']['curveTangent'],
        _0x16b0f5 = [...(_0x3441b4[_0x1244d6] || [0x0, 0x0, 0x0])];
      ((_0x16b0f5[Number(_0x11d69e['dataset']['axis'])] = _0x52b2bf),
        this['path']['change']({ [_0x1244d6]: _0x16b0f5 }));
    }
    return !![];
  }
  ['key'](_0x1c2358) {
    const _0x2f694e = _0x1c2358['target']?.['dataset']?.['curveHandle'];
    if (
      _0x2f694e == null ||
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']['includes'](_0x1c2358['key'])
    )
      return ![];
    const _0x392e25 = [...(this['path']['selected']()?.['easingCurve'] || [0x0, 0x0, 0x1, 0x1])],
      _0x5a89fb = _0x1c2358['key'] === 'ArrowLeft' || _0x1c2358['key'] === 'ArrowRight' ? 0x0 : 0x1;
    return (
      (_0x392e25[Number(_0x2f694e) * 0x2 + _0x5a89fb] +=
        _0x1c2358['key'] === 'ArrowLeft' || _0x1c2358['key'] === 'ArrowDown' ? -0.05 : 0.05),
      _0x1c2358['preventDefault'](),
      _0x1c2358['stopImmediatePropagation'](),
      this['path']['change']({ easingCurve: _0x392e25 }),
      !![]
    );
  }
  ['down'](_0x59d385) {
    const _0x13ce5b = _0x59d385['target']['closest']?.('[data-curve-handle]');
    if (!_0x13ce5b || _0x59d385['button'] !== 0x0) return ![];
    (_0x59d385['preventDefault'](), _0x59d385['stopImmediatePropagation']());
    const _0x41f7a6 = this['path']['selected'](),
      _0x4126e1 = this['path']['identity'](),
      _0x3f7f97 = JSON['stringify'](_0x41f7a6),
      _0x2ef892 = _0x13ce5b['ownerSVGElement'],
      _0x1394a7 = [...(_0x41f7a6['easingCurve'] || [0x0, 0x0, 0x1, 0x1])],
      _0x24a873 = Number(_0x13ce5b['dataset']['curveHandle']) * 0x2,
      _0x5adc97 = _0x2ef892['getBoundingClientRect'](),
      _0x177de8 = new this['path']['timeline']['window']['AbortController']();
    return (
      this['cancel']?.(),
      (this['cancel'] = () => {
        (_0x177de8['abort'](), (this['cancel'] = null), this['path']['timeline']['requestRender']?.());
      }),
      this['path']['timeline']['window']['addEventListener'](
        'pointermove',
        (_0x2130b5) => {
          if (_0x2130b5['pointerId'] !== _0x59d385['pointerId']) return;
          ((_0x1394a7[_0x24a873] = Math['max'](
            0x0,
            Math['min'](
              0x1,
              (((_0x2130b5['clientX'] - _0x5adc97['left']) / _0x5adc97['width']) * 0xc8 - 0x14) / 0xa0,
            ),
          )),
            (_0x1394a7[_0x24a873 + 0x1] = Math['max'](
              -0x4,
              Math['min'](
                0x4,
                (0x78 - ((_0x2130b5['clientY'] - _0x5adc97['top']) / _0x5adc97['height']) * 0x8c) / 0x64,
              ),
            )),
            _0x13ce5b['setAttribute']('cx', 0x14 + _0x1394a7[_0x24a873] * 0xa0),
            _0x13ce5b['setAttribute']('cy', 0x78 - _0x1394a7[_0x24a873 + 0x1] * 0x64),
            _0x2ef892['querySelector']('[data-curve-line]')['setAttribute']('d', curvePath(_0x1394a7)));
        },
        { signal: _0x177de8['signal'] },
      ),
      this['path']['timeline']['window']['addEventListener']('pointercancel', () => this['cancel']?.(), {
        signal: _0x177de8['signal'],
      }),
      this['path']['timeline']['window']['addEventListener'](
        'pointerup',
        (_0x4afcbd) => {
          if (_0x4afcbd['pointerId'] !== _0x59d385['pointerId']) return;
          this['cancel']?.();
          if (
            _0x4126e1 === this['path']['identity']() &&
            _0x3f7f97 === JSON['stringify'](this['path']['selected']())
          )
            this['path']['change']({ easingCurve: _0x1394a7 });
        },
        { signal: _0x177de8['signal'] },
      ),
      !![]
    );
  }
}
