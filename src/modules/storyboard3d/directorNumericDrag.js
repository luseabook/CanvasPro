export class DirectorNumericDrag {
  constructor(_0x4ebc0c) {
    ((this['timeline'] = _0x4ebc0c), (this['onDown'] = (_0x28bb41) => this['down'](_0x28bb41)));
  }
  ['bind'](_0x56b506) {
    if (_0x56b506 === this['root']) return;
    (this['destroy'](),
      (this['root'] = _0x56b506),
      _0x56b506?.['addEventListener']('pointerdown', this['onDown'], !![]));
  }
  ['down'](_0x358e78) {
    const _0x443a76 = _0x358e78['target']['closest']?.('[data-storyboard-3d-shot-timeline]\x20label'),
      _0x155b44 = _0x443a76?.['querySelector']('input[type="number"]');
    if (
      _0x358e78['button'] !== 0x0 ||
      !_0x155b44 ||
      _0x155b44['disabled'] ||
      _0x358e78['target']['closest']('input,select,button')
    )
      return;
    const _0x4b87e7 = _0x155b44['ownerDocument']['defaultView'],
      _0xabd480 = _0x155b44['value'],
      _0x5f5681 = Number(_0x155b44['step']) || 0x1,
      _0x3ceba2 = Number(_0xabd480);
    if (!Number['isFinite'](_0x3ceba2)) return;
    const _0x14c5bb = new _0x4b87e7['AbortController']();
    let _0x3f228f = ![];
    this['cancel']?.();
    const _0x5a556a = (_0x229881) => {
      (_0x14c5bb['abort'](), (this['cancel'] = null));
      if (!_0x155b44['isConnected']) return;
      if (_0x229881) _0x155b44['value'] = _0xabd480;
      else {
        if (_0x3f228f && _0x155b44['value'] !== _0xabd480)
          _0x155b44['dispatchEvent'](new _0x4b87e7['Event']('change', { bubbles: !![] }));
      }
    };
    ((this['cancel'] = () => _0x5a556a(!![])),
      _0x4b87e7['addEventListener'](
        'pointermove',
        (_0x1fa602) => {
          if (
            _0x1fa602['pointerId'] !== _0x358e78['pointerId'] ||
            (Math['abs'](_0x1fa602['clientX'] - _0x358e78['clientX']) < 0x4 && !_0x3f228f)
          )
            return;
          ((_0x3f228f = !![]), _0x1fa602['preventDefault']());
          const _0x5dcf2f = _0x155b44['hasAttribute']('min') ? Number(_0x155b44['min']) : -Infinity,
            _0x3a1468 = _0x155b44['hasAttribute']('max') ? Number(_0x155b44['max']) : Infinity;
          _0x155b44['value'] = String(
            Number(
              Math['max'](
                _0x5dcf2f,
                Math['min'](
                  _0x3a1468,
                  _0x3ceba2 +
                    Math['round'](
                      (_0x1fa602['clientX'] - _0x358e78['clientX']) / (_0x1fa602['shiftKey'] ? 0x14 : 0x4),
                    ) *
                      _0x5f5681,
                ),
              )['toFixed'](0x6),
            ),
          );
        },
        { signal: _0x14c5bb['signal'] },
      ),
      _0x4b87e7['addEventListener'](
        'pointerup',
        (_0x313c57) => {
          if (_0x313c57['pointerId'] === _0x358e78['pointerId']) _0x5a556a(![]);
        },
        { signal: _0x14c5bb['signal'] },
      ),
      _0x4b87e7['addEventListener']('pointercancel', this['cancel'], { signal: _0x14c5bb['signal'] }));
  }
  ['destroy']() {
    (this['cancel']?.(),
      this['root']?.['removeEventListener']('pointerdown', this['onDown'], !![]),
      (this['root'] = null));
  }
}
