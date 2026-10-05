export class DirectorNumericDrag {
  constructor(value) {
    ((this['timeline'] = value), (this['onDown'] = (item) => this['down'](item)));
  }
  ['bind'](el) {
    if (el === this['root']) return;
    (this['destroy'](), (this['root'] = el), el?.['addEventListener']('pointerdown', this['onDown'], !![]));
  }
  ['down'](event) {
    const el2 = event['target']['closest']?.('[data-storyboard-3d-shot-timeline] label'),
      el3 = el2?.['querySelector']('input[type="number"]');
    if (
      event['button'] !== 0 ||
      !el3 ||
      el3['disabled'] ||
      event['target']['closest']('input,select,button')
    )
      return;
    const el4 = el3['ownerDocument']['defaultView'],
      key = el3['value'],
      index = Number(el3['step']) || 1,
      result = Number(key);
    if (!Number['isFinite'](result)) return;
    const signal = new el4['AbortController']();
    let enabled = ![];
    this['cancel']?.();
    const run = (data) => {
      (signal['abort'](), (this['cancel'] = null));
      if (!el3['isConnected']) return;
      if (data) el3['value'] = key;
      else {
        if (enabled && el3['value'] !== key)
          el3['dispatchEvent'](new el4['Event']('change', { bubbles: !![] }));
      }
    };
    ((this['cancel'] = () => run(!![])),
      el4['addEventListener'](
        'pointermove',
        (event2) => {
          if (
            event2['pointerId'] !== event['pointerId'] ||
            (Math['abs'](event2['clientX'] - event['clientX']) < 4 && !enabled)
          )
            return;
          ((enabled = !![]), event2['preventDefault']());
          const options = el3['hasAttribute']('min') ? Number(el3['min']) : -Infinity,
            target = el3['hasAttribute']('max') ? Number(el3['max']) : Infinity;
          el3['value'] = String(
            Number(
              Math['max'](
                options,
                Math['min'](
                  target,
                  result +
                    Math['round'](
                      (event2['clientX'] - event['clientX']) / (event2['shiftKey'] ? 20 : 4),
                    ) *
                      index,
                ),
              )['toFixed'](6),
            ),
          );
        },
        { signal: signal['signal'] },
      ),
      el4['addEventListener'](
        'pointerup',
        (event3) => {
          if (event3['pointerId'] === event['pointerId']) run(![]);
        },
        { signal: signal['signal'] },
      ),
      el4['addEventListener']('pointercancel', this['cancel'], { signal: signal['signal'] }));
  }
  ['destroy']() {
    (this['cancel']?.(),
      this['root']?.['removeEventListener']('pointerdown', this['onDown'], !![]),
      (this['root'] = null));
  }
}
