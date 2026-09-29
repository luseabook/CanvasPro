function normalizeText(_0x235ac4, _0x7dd3d3 = '') {
  const _0x42d4b6 = String(_0x235ac4 ?? '')['trim']();
  return _0x42d4b6 || _0x7dd3d3;
}
export function createPersonReplacementVideoSyncPlayback({
  sourceVideo: _0x3b8f62,
  resultVideo: _0x14a2e5,
  sourcePlay: sourcePlay = () => _0x3b8f62?.['play']?.(),
  resultPlay: resultPlay = () => _0x14a2e5?.['play']?.(),
  button: button = null,
  driftToleranceSec: driftToleranceSec = 0.08,
  initiallyEnabled: initiallyEnabled = ![],
  onEnabledChange: onEnabledChange = null,
} = {}) {
  if (!_0x3b8f62 || !_0x14a2e5) throw new Error('同步播放需要原视频和替换结果视频');
  const _0x33b030 = Math['max'](0.02, Number(driftToleranceSec) || 0.08);
  let _0x3d5610 = ![],
    _0x5de4aa = initiallyEnabled === !![],
    _0x50e2a6 = ![],
    _0x3aa5d4 = ![],
    _0x5f3992 = ![],
    _0x48b92a = ![],
    _0x7f2477 = 'result';
  const _0x1bb8fe = (_0x1161e4) => _0x1161e4?.['paused'] === ![] && _0x1161e4?.['ended'] !== !![],
    _0x124a3f = (_0x158170) => (_0x158170 === 'source' ? _0x3b8f62 : _0x14a2e5),
    _0x418db1 = (_0x2a3f28) => (_0x2a3f28 === 'source' ? sourcePlay : resultPlay),
    _0x58f47e = (_0x307039) => {
      const _0x1b54e2 = Number(_0x307039?.['currentTime']);
      return Number['isFinite'](_0x1b54e2) && _0x1b54e2 > 0x0 ? _0x1b54e2 : 0x0;
    },
    _0x39dc7d = (_0x59c91e, _0x5797c5) => {
      const _0x52f8cc = Number(_0x59c91e?.['duration']),
        _0x26f086 =
          Number['isFinite'](_0x52f8cc) && _0x52f8cc > 0x0
            ? _0x52f8cc
            : Math['max'](0x0, Number(_0x5797c5) || 0x0);
      return Math['max'](0x0, Math['min'](_0x26f086, Number(_0x5797c5) || 0x0));
    },
    _0x5bcb28 = (_0x3075dc, _0x4e336b, { force: force = ![] } = {}) => {
      const _0x1605d3 = _0x39dc7d(_0x3075dc, _0x4e336b);
      if (!force && Math['abs'](_0x58f47e(_0x3075dc) - _0x1605d3) <= _0x33b030) return ![];
      try {
        return ((_0x3075dc['currentTime'] = _0x1605d3), !![]);
      } catch {
        return ![];
      }
    },
    _0x5a0a80 = () => {
      const _0x391301 = _0x5de4aa && !_0x3d5610;
      (button?.['classList']?.['toggle']?.('is-active', _0x391301),
        button?.['setAttribute']?.('aria-pressed', String(_0x391301)),
        button?.['setAttribute']?.('aria-label', _0x391301 ? '关闭同步播放' : '开启同步播放'));
    },
    _0x33612a = () => {
      if (typeof onEnabledChange !== 'function') return;
      try {
        onEnabledChange(_0x5de4aa);
      } catch {}
    },
    _0x437df5 = ({ force: force = ![] } = {}) => {
      const _0x42e478 = _0x7f2477 === 'source' ? 'result' : 'source',
        _0x4dff94 = _0x124a3f(_0x7f2477),
        _0x171031 = _0x124a3f(_0x42e478);
      _0x48b92a = !![];
      const _0x35c606 = _0x5bcb28(_0x171031, _0x58f47e(_0x4dff94), { force: force });
      return ((_0x48b92a = ![]), _0x35c606);
    },
    _0x861c95 = () => {
      ((_0x50e2a6 = ![]), (_0x5f3992 = ![]));
      if (_0x3aa5d4) return;
      _0x3aa5d4 = !![];
      if (_0x3b8f62['paused'] === ![]) _0x3b8f62['pause']?.();
      if (_0x14a2e5['paused'] === ![]) _0x14a2e5['pause']?.();
      ((_0x3aa5d4 = ![]), _0x5a0a80());
    },
    _0x440a55 = () => {
      if (_0x3d5610 || _0x3aa5d4 || !_0x50e2a6 || _0x5f3992) {
        _0x5a0a80();
        return;
      }
      _0x861c95();
    },
    _0x208ecf = (_0x5982e1, _0x386940) => {
      if (!_0x5de4aa || _0x3d5610 || _0x48b92a) return;
      if (_0x386940?.['type'] === 'seeking') _0x7f2477 = _0x5982e1;
      if (!_0x50e2a6) return;
      if (_0x5f3992) {
        _0x5a0a80();
        return;
      }
      if (!_0x1bb8fe(_0x3b8f62) || !_0x1bb8fe(_0x14a2e5)) {
        _0x440a55();
        return;
      }
      if (_0x5982e1 === _0x7f2477) _0x437df5();
      _0x5a0a80();
    },
    _0xa2435f = ['playing', 'timeupdate', 'seeking', 'seeked'],
    _0x375375 = ['pause', 'ended', 'emptied'],
    _0x5bc86 = [
      ['source', _0x3b8f62],
      ['result', _0x14a2e5],
    ]['map'](([_0x50a43a, _0x1156a4]) => {
      const _0x22dea9 = (_0x387619) => _0x208ecf(_0x50a43a, _0x387619);
      return (
        _0xa2435f['forEach']((_0x21064d) => {
          _0x1156a4['addEventListener']?.(_0x21064d, _0x22dea9);
        }),
        _0x375375['forEach']((_0x26a758) => {
          _0x1156a4['addEventListener']?.(_0x26a758, _0x440a55);
        }),
        { video: _0x1156a4, onProgress: _0x22dea9 }
      );
    });
  _0x5a0a80();
  const _0x5caa92 = async (_0x53a0c6 = 'result') => {
    if (_0x3d5610 || !_0x5de4aa) return ![];
    _0x7f2477 = _0x53a0c6 === 'source' ? 'source' : 'result';
    const _0x746a96 = _0x124a3f(_0x7f2477),
      _0x1fc5e1 = _0x3b8f62['ended'] === !![] || _0x14a2e5['ended'] === !![],
      _0x3598cc = _0x1fc5e1 ? 0x0 : _0x58f47e(_0x746a96);
    (_0x5bcb28(_0x746a96, _0x3598cc, { force: _0x1fc5e1 }),
      _0x437df5({ force: !![] }),
      (_0x50e2a6 = !![]),
      (_0x5f3992 = !![]));
    const _0x122549 = await Promise['allSettled']([
      Promise['resolve']()['then'](() => _0x418db1('source')()),
      Promise['resolve']()['then'](() => _0x418db1('result')()),
    ]);
    _0x5f3992 = ![];
    if (
      _0x3d5610 ||
      !_0x5de4aa ||
      !_0x50e2a6 ||
      _0x122549['some']((_0x392114) => _0x392114['status'] === 'rejected') ||
      !_0x1bb8fe(_0x3b8f62) ||
      !_0x1bb8fe(_0x14a2e5)
    )
      return (_0x861c95(), ![]);
    return (_0x437df5({ force: !![] }), _0x5a0a80(), !![]);
  };
  return Object['freeze']({
    async toggleEnabled() {
      if (_0x3d5610) return ![];
      ((_0x5de4aa = !_0x5de4aa), _0x5a0a80(), _0x33612a());
      if (!_0x5de4aa) return ((_0x50e2a6 = ![]), ![]);
      if (_0x1bb8fe(_0x3b8f62) || _0x1bb8fe(_0x14a2e5)) {
        const _0x578b10 = _0x1bb8fe(_0x14a2e5) ? 'result' : 'source';
        await _0x5caa92(_0x578b10);
      }
      return _0x5de4aa;
    },
    async togglePlayback({ master: _0x268751 = 'result' } = {}) {
      if (_0x3d5610 || !_0x5de4aa) return ![];
      if (_0x1bb8fe(_0x3b8f62) || _0x1bb8fe(_0x14a2e5)) return (_0x861c95(), ![]);
      return _0x5caa92(_0x268751);
    },
    pause: _0x861c95,
    isEnabled: () => _0x5de4aa && !_0x3d5610,
    isPlayingTogether: () => _0x50e2a6 && !_0x3d5610,
    destroy() {
      if (_0x3d5610) return;
      if (_0x50e2a6) _0x861c95();
      ((_0x5de4aa = ![]),
        (_0x3d5610 = !![]),
        _0x5bc86['forEach'](({ video: _0x4323ff, onProgress: _0x53f757 }) => {
          (_0xa2435f['forEach']((_0x1d0a2e) => {
            _0x4323ff['removeEventListener']?.(_0x1d0a2e, _0x53f757);
          }),
            _0x375375['forEach']((_0x34582c) => {
              _0x4323ff['removeEventListener']?.(_0x34582c, _0x440a55);
            }));
        }),
        _0x5a0a80());
    },
  });
}
export function shouldReusePersonReplacementVideoPlaybackStage(_0x2c518e, _0x1c42ae) {
  const _0x5eda7b = normalizeText(_0x2c518e?.['dataset']?.['personReplacementVideoPlaybackStage']),
    _0x3179d1 = normalizeText(_0x1c42ae?.['dataset']?.['personReplacementVideoPlaybackStage']),
    _0x19d5b7 = normalizeText(_0x2c518e?.['dataset']?.['personReplacementVideoUrl']),
    _0x2de47c = normalizeText(_0x1c42ae?.['dataset']?.['personReplacementVideoUrl']),
    _0x2b7fc8 = ['personReplacementVideoPoster', 'personReplacementVideoReversed']['every'](
      (_0x742039) =>
        normalizeText(_0x2c518e?.['dataset']?.[_0x742039]) ===
        normalizeText(_0x1c42ae?.['dataset']?.[_0x742039]),
    );
  return Boolean(_0x5eda7b && _0x5eda7b === _0x3179d1 && _0x19d5b7 && _0x19d5b7 === _0x2de47c && _0x2b7fc8);
}
