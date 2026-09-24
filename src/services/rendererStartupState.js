export function createRendererStartupState() {
  let _0x48a869 = 'entry',
    _0x4d4ce1 = '';
  const _0x1bbc06 = new Set(),
    _0x491a3d = new Set();
  let _0x545830;
  const _0x541268 = new Promise((_0x16168a) => {
      _0x545830 = _0x16168a;
    }),
    _0x5234bd = () => ({ phase: _0x48a869, failure: _0x4d4ce1, ready: _0x48a869 === 'ready' }),
    _0x43907f = () => {
      const _0x10b812 = _0x5234bd();
      for (const _0xa749af of _0x491a3d) _0xa749af(_0x10b812);
      if (_0x10b812['ready'] || _0x4d4ce1) _0x545830(_0x10b812);
      return _0x10b812;
    };
  return {
    snapshot: _0x5234bd,
    settled: _0x541268,
    subscribe(_0x3e5f53) {
      return (_0x491a3d['add'](_0x3e5f53), _0x3e5f53(_0x5234bd()), () => _0x491a3d['delete'](_0x3e5f53));
    },
    setPhase(_0x4bf57e) {
      if (_0x4d4ce1 || _0x48a869 === 'ready') return;
      ((_0x48a869 = _0x4bf57e), _0x43907f());
    },
    complete(_0x49bb5c) {
      if (_0x4d4ce1 || _0x48a869 === 'ready') return;
      _0x1bbc06['add'](_0x49bb5c);
      if (_0x1bbc06['has']('entry') && _0x1bbc06['has']('project')) _0x48a869 = 'ready';
      _0x43907f();
    },
    fail(_0x29bf92 = 'initialization') {
      if (_0x4d4ce1 || _0x48a869 === 'ready') return ![];
      return ((_0x4d4ce1 = _0x29bf92), _0x43907f(), !![]);
    },
  };
}
export const rendererStartupState = createRendererStartupState();
