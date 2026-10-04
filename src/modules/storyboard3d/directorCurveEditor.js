const curvePath = (value) =>
  'M20 120 C' +
  (0x14 + value[0x0] * 0xa0) +
  '\x20' +
  (0x78 - value[0x1] * 0x64) +
  ',' +
  (0x14 + value[0x2] * 0xa0) +
  '\x20' +
  (0x78 - value[0x3] * 0x64) +
  ',180 20';
export function renderDirectorCurveEditor(item) {
  const list = item['easingCurve'] || [0x0, 0x0, 0x1, 0x1];
  return (
    '<details class="storyboard-3d-director-curve"><summary>运动曲线与空间切线</summary>\n    <svg viewBox="0 0 200 140" data-director-curve aria-label="缓动曲线，拖动控制柄调整速度">\n      <path data-curve-line d="' +
    curvePath(list) +
    '"/>\n      ' +
    [0x0, 0x1]
      ['map'](
        (key) =>
          '<circle tabindex="0" role="slider" aria-label="缓动控制柄 ' +
          (key + 0x1) +
          '，方向键微调" data-curve-handle="' +
          key +
          '" cx="' +
          (0x14 + list[key * 0x2] * 0xa0) +
          '" cy="' +
          (0x78 - list[key * 0x2 + 0x1] * 0x64) +
          '\x22\x20r=\x226\x22/>',
      )
      ['join']('') +
    '\n    </svg><div class="storyboard-3d-director-fields">' +
    list['map'](
      (index, result) =>
        '<label>' +
        ['起点 X', '起点\x20Y', '终点\x20X', '终点 Y'][result] +
        '<input type="number" step="0.05" min="' +
        (result % 0x2 ? -0x4 : 0x0) +
        '" max="' +
        (result % 0x2 ? 0x4 : 0x1) +
        '" data-curve-value="' +
        result +
        '" value="' +
        index +
        '"></label>',
    )['join']('') +
    '</div>\x0a\x20\x20\x20\x20' +
    ['inTangent', 'outTangent']
      ['map'](
        (data) =>
          '<div class="storyboard-3d-director-fields"><b>' +
          (data === 'inTangent' ? '入' : '出') +
          '切线 / 米</b>' +
          (item[data] || [0x0, 0x0, 0x0])
            ['map'](
              (options, target) =>
                '<label>' +
                ['X', 'Y', 'Z'][target] +
                '<input type="number" step="0.1" data-curve-tangent="' +
                data +
                '" data-axis="' +
                target +
                '\x22\x20value=\x22' +
                options +
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
  constructor(source) {
    this['path'] = source;
  }
  ['change'](event) {
    const el = event['target'],
      enabled = this['path']['selected']();
    if (!enabled || !el['matches']?.('[data-curve-value],[data-curve-tangent]')) return ![];
    const next = Number(el['value']);
    if (!Number['isFinite'](next)) return !![];
    if (el['dataset']['curveValue'] != null) {
      const easingCurve = [...(enabled['easingCurve'] || [0x0, 0x0, 0x1, 0x1])];
      ((easingCurve[Number(el['dataset']['curveValue'])] = next),
        this['path']['change']({ easingCurve: easingCurve }));
    } else {
      const current = el['dataset']['curveTangent'],
        entry = [...(enabled[current] || [0x0, 0x0, 0x0])];
      ((entry[Number(el['dataset']['axis'])] = next), this['path']['change']({ [current]: entry }));
    }
    return !![];
  }
  ['key'](event2) {
    const record = event2['target']?.['dataset']?.['curveHandle'];
    if (record == null || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']['includes'](event2['key']))
      return ![];
    const easingCurve2 = [...(this['path']['selected']()?.['easingCurve'] || [0x0, 0x0, 0x1, 0x1])],
      payload = event2['key'] === 'ArrowLeft' || event2['key'] === 'ArrowRight' ? 0x0 : 0x1;
    return (
      (easingCurve2[Number(record) * 0x2 + payload] +=
        event2['key'] === 'ArrowLeft' || event2['key'] === 'ArrowDown' ? -0.05 : 0.05),
      event2['preventDefault'](),
      event2['stopImmediatePropagation'](),
      this['path']['change']({ easingCurve: easingCurve2 }),
      !![]
    );
  }
  ['down'](event3) {
    const el2 = event3['target']['closest']?.('[data-curve-handle]');
    if (!el2 || event3['button'] !== 0x0) return ![];
    (event3['preventDefault'](), event3['stopImmediatePropagation']());
    const handle = this['path']['selected'](),
      state = this['path']['identity'](),
      config = JSON['stringify'](handle),
      el3 = el2['ownerSVGElement'],
      easingCurve3 = [...(handle['easingCurve'] || [0x0, 0x0, 0x1, 0x1])],
      scope = Number(el2['dataset']['curveHandle']) * 0x2,
      box = el3['getBoundingClientRect'](),
      signal = new this['path']['timeline']['window']['AbortController']();
    return (
      this['cancel']?.(),
      (this['cancel'] = () => {
        (signal['abort'](), (this['cancel'] = null), this['path']['timeline']['requestRender']?.());
      }),
      this['path']['timeline']['window']['addEventListener'](
        'pointermove',
        (event4) => {
          if (event4['pointerId'] !== event3['pointerId']) return;
          ((easingCurve3[scope] = Math['max'](
            0x0,
            Math['min'](0x1, (((event4['clientX'] - box['left']) / box['width']) * 0xc8 - 0x14) / 0xa0),
          )),
            (easingCurve3[scope + 0x1] = Math['max'](
              -0x4,
              Math['min'](0x4, (0x78 - ((event4['clientY'] - box['top']) / box['height']) * 0x8c) / 0x64),
            )),
            el2['setAttribute']('cx', 0x14 + easingCurve3[scope] * 0xa0),
            el2['setAttribute']('cy', 0x78 - easingCurve3[scope + 0x1] * 0x64),
            el3['querySelector']('[data-curve-line]')['setAttribute']('d', curvePath(easingCurve3)));
        },
        { signal: signal['signal'] },
      ),
      this['path']['timeline']['window']['addEventListener']('pointercancel', () => this['cancel']?.(), {
        signal: signal['signal'],
      }),
      this['path']['timeline']['window']['addEventListener'](
        'pointerup',
        (event5) => {
          if (event5['pointerId'] !== event3['pointerId']) return;
          this['cancel']?.();
          if (
            state === this['path']['identity']() &&
            config === JSON['stringify'](this['path']['selected']())
          )
            this['path']['change']({ easingCurve: easingCurve3 });
        },
        { signal: signal['signal'] },
      ),
      !![]
    );
  }
}
