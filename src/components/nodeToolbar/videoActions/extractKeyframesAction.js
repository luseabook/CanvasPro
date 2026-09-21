import { t } from '../../../i18n/index.js';
function videoToolbarText(_0x237587, _0xb01d0 = {}) {
  return t('nodeToolbar.video.' + _0x237587, _0xb01d0);
}
export function bindVideoExtractKeyframesAction(_0x298bf6) {
  const {
      toolbarEl: _0xad9f7f,
      nodeData: _0x3b1183,
      getStateSnapshot: _0x185048,
      VideoClipController: _0x30b460,
      VideoKeyingController: _0x20d4b0,
      runSmartClipKeyframeExtractionFromVideoNode: _0xc7c2b1,
    } = _0x298bf6,
    _0x15f9ee = _0xad9f7f?.querySelector?.('.act-extract-keyframes');
  if (!_0x15f9ee) return;
  const _0x572e04 = videoToolbarText('extractKeyframes'),
    _0x214346 = _0x15f9ee.querySelector?.('svg'),
    _0x4c9c02 = (_0x1c83b6, _0x88caf2 = _0x572e04) => {
      ((_0x15f9ee.dataset.loading = _0x1c83b6 ? 'true' : 'false'),
        (_0x15f9ee.disabled = !!_0x1c83b6),
        _0x15f9ee.setAttribute?.('aria-busy', _0x1c83b6 ? 'true' : 'false'),
        _0x15f9ee.setAttribute?.('data-tooltip', _0x88caf2),
        _0x214346?.classList?.toggle?.('v2-spinning', !!_0x1c83b6));
    };
  _0x15f9ee.addEventListener('click', async (_0x4402ff) => {
    _0x4402ff.stopPropagation();
    if (_0x15f9ee.dataset.loading === 'true') return;
    const _0x5ada2a = _0x185048();
    if (_0x5ada2a.videoKeying?.active) {
      window.showToast?.(videoToolbarText('exitCurrentEditMode'), 'info');
      return;
    }
    if (_0x5ada2a.videoClip?.active) {
      window.showToast?.(videoToolbarText('exitClipMode'), 'info');
      return;
    }
    if (typeof _0xc7c2b1 !== 'function') {
      window.showToast?.(videoToolbarText('extractUnavailable'), 'error');
      return;
    }
    (_0x30b460?.exit?.({ silent: true }),
      _0x20d4b0?.exit?.({ silent: true }),
      _0x4c9c02(true, videoToolbarText('extractPreparing')),
      window.showToast?.(videoToolbarText('extractStarted'), 'info'));
    try {
      const _0x3ca030 = await _0xc7c2b1({
        nodeId: _0x3b1183?.id,
        onProgress: (_0x50bee7) => {
          if (!_0x50bee7?.text) return;
          _0x4c9c02(true, videoToolbarText('extractProgress', { progress: _0x50bee7.text }));
        },
      });
      if (!_0x3ca030?.ok) {
        window.showToast?.(
          _0x3ca030?.reason === 'no-segments'
            ? videoToolbarText('extractNoSegments')
            : videoToolbarText('extractNoKeyframes'),
          _0x3ca030?.reason === 'no-segments' ? 'info' : 'error',
        );
        return;
      }
      window.showToast?.(videoToolbarText('extractComplete', { count: _0x3ca030.nodeIds.length }), 'success');
    } catch (_0x14d306) {
      const _0x2abe5c =
        _0x14d306 instanceof Error
          ? _0x14d306.message
          : String(_0x14d306 || videoToolbarText('smartClipFailed'));
      window.showToast?.(videoToolbarText('extractFailed', { error: _0x2abe5c }), 'error');
    } finally {
      _0x4c9c02(false);
    }
  });
}
