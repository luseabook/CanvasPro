const SIZE = '--person-replacement-results-height';
export function createPersonReplacementResultHistoryLayout() {
  let _0x2ab9f1 = null,
    _0x13f19d = null,
    _0x5084f6 = null;
  const _0x17ca06 = (_0x37f810, _0x25b613 = !![]) => {
      if (!_0x2ab9f1) return [];
      if (!_0x25b613) _0x2ab9f1['classList']['add']('is-results-layout-static');
      _0x2ab9f1['style']['setProperty'](SIZE, _0x37f810 + 'px');
      const _0x3dedc2 = (_0x2ab9f1['getAnimations']?.() || [])['filter'](
        (_0x1d403b) => _0x1d403b['transitionProperty'] === SIZE,
      );
      if (!_0x25b613) _0x2ab9f1['classList']['remove']('is-results-layout-static');
      return _0x3dedc2;
    },
    _0x160381 = () => {
      (_0x5084f6?.['disconnect'](), (_0x5084f6 = null), (_0x13f19d = null));
    },
    _0x410a00 = () => {
      const _0x293cb9 = _0x13f19d?.['getBoundingClientRect']?.()['height'];
      if (Number['isFinite'](_0x293cb9)) _0x17ca06(_0x293cb9);
    };
  return Object['freeze']({
    show(_0x2468a1) {
      const _0x83489f = _0x2468a1?.['closest']?.('.person-replacement-middle-layout');
      _0x83489f !== _0x2ab9f1 && (_0x160381(), _0x17ca06(0x0, ![]), (_0x2ab9f1 = _0x83489f));
      const _0xb9cde7 = _0x2468a1?.['querySelector']?.('.person-replacement-result-history-content');
      if (_0xb9cde7 !== _0x13f19d) {
        (_0x160381(), (_0x13f19d = _0xb9cde7));
        const _0x224e61 = _0x2468a1?.['ownerDocument']?.['defaultView']?.['ResizeObserver'];
        _0x13f19d && _0x224e61 && ((_0x5084f6 = new _0x224e61(_0x410a00)), _0x5084f6['observe'](_0x13f19d));
      }
      _0x410a00();
    },
    hide({ animate: animate = ![] } = {}) {
      return (_0x160381(), _0x17ca06(0x0, animate));
    },
    destroy() {
      (_0x160381(), _0x17ca06(0x0, ![]), (_0x2ab9f1 = null));
    },
  });
}
