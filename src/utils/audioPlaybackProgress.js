export function formatAudioTime(_0x34466a) {
  const _0x1ac22b = Number(_0x34466a);
  if (!Number.isFinite(_0x1ac22b) || _0x1ac22b <= 0) return '0:00';
  return Math.floor(_0x1ac22b / 60) + ':' + String(Math.floor(_0x1ac22b % 60)).padStart(2, '0');
}
function clamp01(_0x311255) {
  const _0x6e6723 = Number(_0x311255);
  if (!Number.isFinite(_0x6e6723)) return 0;
  return Math.max(0, Math.min(1, _0x6e6723));
}
function getRafFns(_0x2ec82c = {}) {
  const _0x21ddc6 =
      _0x2ec82c.requestFrame ||
      (typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
          ? window.requestAnimationFrame.bind(window)
          : null),
    _0x51485b =
      _0x2ec82c.cancelFrame ||
      (typeof cancelAnimationFrame === 'function'
        ? cancelAnimationFrame
        : typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function'
          ? window.cancelAnimationFrame.bind(window)
          : null);
  return {
    requestFrame: _0x21ddc6 || ((_0x5d0225) => setTimeout(_0x5d0225, 16)),
    cancelFrame: _0x51485b || ((_0x35f296) => clearTimeout(_0x35f296)),
  };
}
export function createAudioPlaybackProgressController(_0x3d05eb = {}) {
  const {
      audioEl: _0x585d4a,
      wavePlayedEl: _0x1b74e8,
      progressLineEl: _0x49b477,
      timeEl: _0x5449f0,
      trackEl: _0x5ec39a,
      formatTime: formatTime = formatAudioTime,
      shouldSuppressSync: shouldSuppressSync = () => false,
    } = _0x3d05eb,
    { requestFrame: _0x33ea34, cancelFrame: _0x5bdf1b } = getRafFns(_0x3d05eb);
  let _0x309ff9 = null,
    _0x2d4dc8 = false,
    _0x2eb968 = false,
    _0x1bbef2 = 0,
    _0x1ba818 = null,
    _0x24b1f6 = '',
    _0x1083bd = '',
    _0x29b2fb = '',
    _0x5b7ca8 = '';
  const _0x216802 = () => {
      const _0x3401b7 =
        Number(_0x5ec39a?.clientWidth) ||
        Number(_0x5ec39a?.getBoundingClientRect?.().width) ||
        Number(_0x49b477?.parentElement?.clientWidth) ||
        0;
      if (Number.isFinite(_0x3401b7) && _0x3401b7 > 0) _0x1bbef2 = _0x3401b7;
      return _0x1bbef2;
    },
    _0x579eae = () => {
      return !!_0x585d4a && _0x585d4a.paused === false && _0x585d4a.ended !== true;
    },
    _0x3c8e81 = (_0x251592) => {
      if (!_0x49b477 || _0x5b7ca8 === _0x251592) return;
      ((_0x49b477.style.opacity = _0x251592), (_0x5b7ca8 = _0x251592));
    },
    _0x5a4551 = () => {
      _0x3c8e81('0');
    },
    _0x5ddf19 = ({
      currentTime: currentTime = _0x585d4a?.currentTime,
      duration: duration = _0x585d4a?.duration,
      force: force = false,
      showLine: showLine = true,
    } = {}) => {
      const _0x24a5f5 = Number(duration);
      if (!Number.isFinite(_0x24a5f5) || _0x24a5f5 <= 0) return false;
      const _0x56bdbf = Number(currentTime),
        _0x297069 = clamp01(_0x56bdbf / _0x24a5f5),
        _0x297478 = (_0x297069 * 100).toFixed(2);
      _0x1b74e8 &&
        (force || _0x24b1f6 !== _0x297478) &&
        (_0x1b74e8.style.clipPath = 'inset(0 0 0 ' + _0x297478 + '%)');
      if (_0x49b477 && (force || _0x24b1f6 !== _0x297478)) {
        const _0x3c519a = _0x216802();
        if (_0x3c519a > 0) {
          const _0x2a53d6 = (_0x297069 * _0x3c519a).toFixed(2) + 'px';
          (force || _0x29b2fb !== _0x2a53d6) &&
            ((_0x49b477.style.left = '0'),
            (_0x49b477.style.transform = 'translateX(' + _0x2a53d6 + ')'),
            (_0x29b2fb = _0x2a53d6));
        } else {
          const _0x119fc1 = _0x297478 + '%';
          (force || _0x29b2fb !== _0x119fc1) &&
            ((_0x49b477.style.left = _0x119fc1), (_0x49b477.style.transform = ''), (_0x29b2fb = _0x119fc1));
        }
      }
      if (showLine) _0x3c8e81('1');
      const _0x27d32a = formatTime(_0x56bdbf) + ' / ' + formatTime(_0x24a5f5);
      return (
        _0x5449f0 &&
          (force || _0x1083bd !== _0x27d32a) &&
          ((_0x5449f0.textContent = _0x27d32a), (_0x1083bd = _0x27d32a)),
        (_0x24b1f6 = _0x297478),
        true
      );
    },
    _0x2cb540 = () => {
      if (_0x2d4dc8 || _0x309ff9 !== null) return;
      _0x309ff9 = _0x33ea34(_0x5f4d00);
    },
    _0x971d81 = () => {
      if (_0x309ff9 === null) return;
      (_0x5bdf1b(_0x309ff9), (_0x309ff9 = null));
    },
    _0x5f4d00 = () => {
      _0x309ff9 = null;
      if (_0x2d4dc8 || !_0x579eae()) return;
      (!shouldSuppressSync() && _0x5ddf19({ showLine: true }), _0x2cb540());
    },
    _0x58cf27 = () => {
      _0x2cb540();
    },
    _0x175f85 = () => {
      _0x971d81();
      if (_0x2d4dc8 || shouldSuppressSync()) return;
      if (_0x585d4a?.ended === true) {
        (_0x5ddf19({ force: true, showLine: false }), _0x5a4551());
        return;
      }
      _0x5ddf19({ showLine: true });
    },
    _0x584254 = () => {
      if (_0x2d4dc8 || _0x579eae() || shouldSuppressSync()) return;
      _0x5ddf19({ showLine: true });
    },
    _0x44bf78 = () => {
      if (_0x2d4dc8) return;
      const _0x1d908e = Number(_0x585d4a?.currentTime || 0);
      _0x5ddf19({
        currentTime: _0x1d908e,
        duration: _0x585d4a?.duration,
        force: true,
        showLine: _0x1d908e > 0,
      });
      if (_0x1d908e <= 0) _0x5a4551();
    },
    _0x3401c4 = () => {
      (_0x971d81(), _0x5ddf19({ force: true, showLine: false }), _0x5a4551());
    },
    _0x4ced30 = () => {
      if (_0x2eb968 || !_0x585d4a?.addEventListener) return _0x4297fe;
      ((_0x2eb968 = true), (_0x2d4dc8 = false), _0x216802());
      typeof ResizeObserver === 'function' &&
        _0x5ec39a &&
        typeof _0x5ec39a === 'object' &&
        ((_0x1ba818 = new ResizeObserver(() => {
          (_0x216802(), _0x5ddf19({ force: true, showLine: _0x5b7ca8 === '1' }));
        })),
        _0x1ba818.observe(_0x5ec39a));
      (_0x585d4a.addEventListener('play', _0x58cf27),
        _0x585d4a.addEventListener('pause', _0x175f85),
        _0x585d4a.addEventListener('timeupdate', _0x584254),
        _0x585d4a.addEventListener('loadedmetadata', _0x44bf78),
        _0x585d4a.addEventListener('durationchange', _0x44bf78),
        _0x585d4a.addEventListener('ended', _0x3401c4));
      if (_0x579eae()) _0x2cb540();
      return _0x4297fe;
    },
    _0x1af9f8 = ({ hide: hide = true } = {}) => {
      ((_0x24b1f6 = ''), (_0x1083bd = ''), (_0x29b2fb = ''));
      if (_0x1b74e8) _0x1b74e8.style.clipPath = 'inset(0 0 0 0)';
      _0x49b477 && ((_0x49b477.style.left = '0'), (_0x49b477.style.transform = 'translateX(0px)'));
      if (hide) _0x5a4551();
      _0x5449f0 && ((_0x5449f0.textContent = '0:00 / 0:00'), (_0x1083bd = '0:00 / 0:00'));
    },
    _0x138f61 = () => {
      ((_0x2d4dc8 = true),
        _0x971d81(),
        _0x2eb968 &&
          _0x585d4a?.removeEventListener &&
          (_0x585d4a.removeEventListener('play', _0x58cf27),
          _0x585d4a.removeEventListener('pause', _0x175f85),
          _0x585d4a.removeEventListener('timeupdate', _0x584254),
          _0x585d4a.removeEventListener('loadedmetadata', _0x44bf78),
          _0x585d4a.removeEventListener('durationchange', _0x44bf78),
          _0x585d4a.removeEventListener('ended', _0x3401c4)),
        (_0x2eb968 = false),
        _0x1ba818 && (_0x1ba818.disconnect(), (_0x1ba818 = null)));
    },
    _0x4297fe = {
      attach: _0x4ced30,
      destroy: _0x138f61,
      reset: _0x1af9f8,
      hideLine: _0x5a4551,
      start: _0x2cb540,
      stop: _0x971d81,
      sync: _0x5ddf19,
      isRunning: () => _0x309ff9 !== null,
    };
  return _0x4297fe;
}
