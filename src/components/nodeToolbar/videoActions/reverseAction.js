import { t } from '../../../i18n/index.js';
function videoReverseText(_0x2cee0e, _0x2dda75 = {}) {
  return t('nodeToolbar.video.' + _0x2cee0e, _0x2dda75);
}
export function bindVideoReverseAction(_0x385ba7) {
  const {
      toolbarEl: _0x1ae3bc,
      nodeData: _0x4716f0,
      getStateSnapshot: _0x394db0,
      VideoClipController: _0x3b5f68,
      VideoKeyingController: _0xecb82f,
      runVideoReverseFromNode: _0x25b00f,
    } = _0x385ba7,
    _0x4b2cb8 = _0x1ae3bc.querySelector('.act-reverse');
  if (_0x4b2cb8) {
    const _0x5713c4 = _0x4b2cb8.dataset?.tooltip || _0x4b2cb8.getAttribute?.('data-tooltip') || '',
      _0xd3d929 = !!_0x4b2cb8.disabled,
      _0x2af7bd = _0x4b2cb8.getAttribute?.('aria-busy'),
      _0x5916cc = _0x4b2cb8.querySelector?.('svg'),
      _0x372e7d = (_0x318aad) => {
        const _0x4acded = String(_0x318aad || '').trim();
        if (_0x4acded) _0x4b2cb8.setAttribute?.('data-tooltip', _0x4acded);
        else {
          _0x4b2cb8.removeAttribute?.('data-tooltip');
          if (_0x4b2cb8.dataset) delete _0x4b2cb8.dataset.tooltip;
        }
      },
      _0x3fe255 = () => {
        _0x2af7bd == null
          ? _0x4b2cb8.removeAttribute?.('aria-busy')
          : _0x4b2cb8.setAttribute?.('aria-busy', _0x2af7bd);
      },
      _0x9d6548 = (_0x338473) => {
        ((_0x4b2cb8.dataset.loading = _0x338473 ? 'true' : 'false'),
          (_0x4b2cb8.disabled = _0x338473 ? true : _0xd3d929),
          _0x338473
            ? (_0x4b2cb8.setAttribute?.('aria-busy', 'true'),
              _0x372e7d(
                _0x5713c4 ? videoReverseText('reverseBusyTooltip', { tooltip: _0x5713c4 }) : _0x5713c4,
              ))
            : (_0x3fe255(), _0x372e7d(_0x5713c4)),
          _0x5916cc?.classList?.toggle?.('v2-spinning', !!_0x338473));
      };
    _0x4b2cb8.addEventListener('click', async (_0x5a3fbe) => {
      _0x5a3fbe.stopPropagation();
      if (_0x4b2cb8.dataset.loading === 'true') return;
      const _0xe4cfe5 = _0x394db0();
      if (_0xe4cfe5.videoKeying?.active) {
        window.showToast?.(videoReverseText('exitCurrentEditMode'), 'info');
        return;
      }
      if (_0xe4cfe5.videoClip?.active) {
        window.showToast?.(videoReverseText('exitClipMode'), 'info');
        return;
      }
      if (typeof _0x25b00f !== 'function') {
        window.showToast?.(videoReverseText('reverseUnavailable'), 'error');
        return;
      }
      (_0x3b5f68.exit({ silent: true }), _0xecb82f.exit({ silent: true }), _0x9d6548(true));
      try {
        await _0x25b00f(_0x4716f0.id);
      } catch (_0xd4c0df) {
        const _0x2b0d11 =
          _0xd4c0df instanceof Error
            ? _0xd4c0df.message
            : String(_0xd4c0df || videoReverseText('reverseFailed'));
        window.showToast?.(videoReverseText('reverseFailedWithError', { error: _0x2b0d11 }), 'error');
      } finally {
        _0x9d6548(false);
      }
    });
  }
}
