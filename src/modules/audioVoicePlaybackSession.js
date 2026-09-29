import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
  isMediaElementPlaybackSource,
  normalizeMediaPlaybackSourceUrl,
} from '../services/desktopMediaBlobSource.js';
import { beginAudioPlayback, registerAudioPlaybackClient } from './audioPlaybackCoordinator.js';
const AUDIO_VOICE_PREVIEW_ACTIONS = new Set(['play-source', 'play-converted', 'play-history']);
let audioVoicePlaybackOwnerSequence = 0x0;
function normalizeAudioUrl(_0x390641) {
  return String(_0x390641 || '')['trim']();
}
function getAudioCacheKey(_0x5ec0f1) {
  const _0x3dee4d = normalizeAudioUrl(_0x5ec0f1);
  return _0x3dee4d ? normalizeMediaPlaybackSourceUrl(_0x3dee4d) || _0x3dee4d : '';
}
export async function prepareAudioVoicePlaybackElement(
  _0x23d920,
  _0x196a27,
  {
    attachSource: attachSource = attachMediaElementPlaybackSource,
    isPlaybackSource: isPlaybackSource = isMediaElementPlaybackSource,
    preload: preload = 'auto',
    shouldAssign: _0x9b0b3f,
  } = {},
) {
  const _0x1ea8d5 = normalizeAudioUrl(_0x196a27);
  if (!_0x23d920 || !_0x1ea8d5) return '';
  const _0x59b7e4 = preload === 'metadata' ? 'metadata' : 'auto',
    _0x5ebb6a = String(_0x23d920['__audioVoiceRequestedPreload'] || ''),
    _0x1a6ca4 = _0x59b7e4 === 'auto' || _0x5ebb6a === 'auto' ? 'auto' : 'metadata';
  _0x23d920['__audioVoiceRequestedPreload'] = _0x1a6ca4;
  const _0x60b39d = String(_0x23d920['preload'] || ''),
    _0xe7f9ac = isPlaybackSource(_0x23d920, _0x1ea8d5);
  _0x23d920['preload'] = _0x1a6ca4;
  if (typeof attachSource === 'function') {
    const _0x38f717 = { preload: _0x1a6ca4 };
    typeof _0x9b0b3f === 'function' && (_0x38f717['shouldAssign'] = _0x9b0b3f);
    const _0x7a5c24 = await attachSource(_0x23d920, _0x1ea8d5, _0x38f717),
      _0x4d010b = _0x23d920['__audioVoiceRequestedPreload'] === 'auto' ? 'auto' : _0x1a6ca4;
    return (
      _0x7a5c24 &&
        isPlaybackSource(_0x23d920, _0x1ea8d5) &&
        _0x4d010b === 'auto' &&
        (_0x23d920['preload'] !== 'auto' || (_0xe7f9ac && _0x1a6ca4 === 'auto' && _0x60b39d !== 'auto')) &&
        ((_0x23d920['preload'] = 'auto'), _0x23d920['load']?.()),
      _0x7a5c24
    );
  }
  if (typeof _0x9b0b3f === 'function' && _0x9b0b3f() !== !![]) return '';
  return ((_0x23d920['src'] = _0x1ea8d5), _0x23d920['load']?.(), _0x1ea8d5);
}
export function isAudioVoicePreviewControlTarget(_0x499cbc) {
  const _0x41be26 = String(
    _0x499cbc?.['closest']?.('[data-audio-voice-action]')?.['dataset']?.['audioVoiceAction'] || '',
  )['trim']();
  return AUDIO_VOICE_PREVIEW_ACTIONS['has'](_0x41be26);
}
export function createAudioVoicePlaybackSession({
  windowObject: windowObject = globalThis['window'],
  documentObject: documentObject = globalThis['document'],
  createAudioElement: createAudioElement = () => {
    const _0x665b31 = windowObject?.['Audio'] || globalThis['Audio'];
    return typeof _0x665b31 === 'function' ? new _0x665b31() : null;
  },
  attachSource: attachSource = attachMediaElementPlaybackSource,
  clearPlaybackMetadata: clearPlaybackMetadata = clearDesktopMediaPlaybackSourceMetadata,
  isPlaybackSource: isPlaybackSource = isMediaElementPlaybackSource,
  isPreviewControlTarget: isPreviewControlTarget = isAudioVoicePreviewControlTarget,
  beginPlayback: beginPlayback = beginAudioPlayback,
  registerPlaybackClient: registerPlaybackClient = registerAudioPlaybackClient,
  ownerId: ownerId = 'audio-voice-preview:' + ++audioVoicePlaybackOwnerSequence,
  maxCachedAudioElements: maxCachedAudioElements = 0x10,
} = {}) {
  const _0x7e6ad7 = new Map(),
    _0x1521d9 = Math['max'](0x1, Number(maxCachedAudioElements) || 0x10);
  let _0x2ba759 = null,
    _0x2e417c = '',
    _0x17ac87 = null,
    _0x4a5905 = null,
    _0x4ba352 = 0x0,
    _0x283534 = 0x0,
    _0x41edaa = ![];
  const _0x400fd1 = registerPlaybackClient(ownerId, { stopForExternalPlayback: () => _0x380c24() });
  function _0x23d528(_0x153c95) {
    if (!_0x153c95) return;
    try {
      _0x153c95['pause']?.();
    } catch {}
    try {
      (_0x153c95['removeAttribute']?.('src'),
        clearPlaybackMetadata(_0x153c95),
        delete _0x153c95['__audioVoiceRequestedPreload'],
        (_0x153c95['preload'] = 'none'),
        _0x153c95['load']?.());
    } catch {}
  }
  function _0x3b0884() {
    if (!_0x2ba759 || !_0x17ac87) {
      _0x17ac87 = null;
      return;
    }
    (_0x2ba759['removeEventListener']?.('ended', _0x17ac87),
      _0x2ba759['removeEventListener']?.('error', _0x17ac87),
      (_0x17ac87 = null));
  }
  function _0x22bebb(_0x6618c8) {
    _0x3b0884();
    if (!_0x6618c8?.['addEventListener']) return;
    ((_0x17ac87 = () => {
      if (_0x2ba759 !== _0x6618c8) return;
      (_0x3b0884(), (_0x2ba759 = null), (_0x2e417c = ''), _0xdeeed8());
    }),
      _0x6618c8['addEventListener']('ended', _0x17ac87),
      _0x6618c8['addEventListener']('error', _0x17ac87));
  }
  function _0xb9b567(_0x34c1f6, _0x2dcff5) {
    if (_0x7e6ad7['get'](_0x34c1f6) !== _0x2dcff5) return;
    (_0x7e6ad7['delete'](_0x34c1f6), (_0x283534 += 0x1), _0x23d528(_0x2dcff5));
  }
  function _0x1890e6() {
    while (_0x7e6ad7['size'] > _0x1521d9) {
      const _0x49afb4 = [..._0x7e6ad7['entries']()]['find'](([, _0x304b22]) => _0x304b22 !== _0x2ba759);
      if (!_0x49afb4) return;
      const [_0x433d0c, _0x63bd69] = _0x49afb4;
      _0xb9b567(_0x433d0c, _0x63bd69);
    }
  }
  function _0x418b8f(_0x32ae07) {
    const _0x59cdbc = normalizeAudioUrl(_0x32ae07);
    if (!_0x59cdbc || _0x41edaa) return null;
    const _0x341bcd = getAudioCacheKey(_0x59cdbc),
      _0x253bf9 = _0x7e6ad7['get'](_0x341bcd);
    if (_0x253bf9) return (_0x7e6ad7['delete'](_0x341bcd), _0x7e6ad7['set'](_0x341bcd, _0x253bf9), _0x253bf9);
    const _0x298070 = createAudioElement(_0x59cdbc);
    if (!_0x298070) return null;
    return ((_0x298070['preload'] = 'auto'), _0x7e6ad7['set'](_0x341bcd, _0x298070), _0x1890e6(), _0x298070);
  }
  function _0xdeeed8() {
    if (!_0x4a5905) return;
    (documentObject?.['removeEventListener']?.('pointerdown', _0x4a5905, !![]), (_0x4a5905 = null));
  }
  function _0x1a7517() {
    const _0x6469a9 = _0x2ba759;
    (_0x3b0884(), (_0x2ba759 = null), (_0x2e417c = ''));
    if (!_0x6469a9) return;
    try {
      _0x6469a9['pause']?.();
    } catch {}
  }
  function _0xf9d363() {
    ((_0x4ba352 += 0x1), _0x1a7517(), _0xdeeed8());
  }
  function _0x12e6b8() {
    if (_0x4a5905) return;
    ((_0x4a5905 = (_0x10123d) => {
      if (isPreviewControlTarget(_0x10123d['target'])) return;
      _0xf9d363();
    }),
      documentObject?.['addEventListener']?.('pointerdown', _0x4a5905, !![]));
  }
  async function _0x57db8c(_0x58d806) {
    const _0x23536f = normalizeAudioUrl(_0x58d806),
      _0x2bc223 = getAudioCacheKey(_0x23536f),
      _0x573706 = _0x418b8f(_0x23536f);
    if (!_0x573706) return { status: _0x23536f ? 'unavailable' : 'missing' };
    const _0x25e4c6 = _0x283534,
      _0x26909c = () => !_0x41edaa && _0x25e4c6 === _0x283534 && _0x7e6ad7['get'](_0x2bc223) === _0x573706;
    try {
      const _0x20e343 = await prepareAudioVoicePlaybackElement(_0x573706, _0x23536f, {
        attachSource: attachSource,
        isPlaybackSource: isPlaybackSource,
        preload: 'auto',
        shouldAssign: _0x26909c,
      });
      return { status: _0x20e343 && _0x26909c() ? 'ready' : 'unavailable', audioEl: _0x573706 };
    } catch {
      return { status: 'failed', audioEl: _0x573706 };
    }
  }
  async function _0x88a450(_0x304404 = [], { limit: limit = 0x4 } = {}) {
    const _0x42aaa5 = [
      ...new Set((Array['isArray'](_0x304404) ? _0x304404 : [])['map'](normalizeAudioUrl)['filter'](Boolean)),
    ]['slice'](0x0, Math['max'](0x0, Number(limit) || 0x0));
    return await Promise['all'](_0x42aaa5['map'](_0x57db8c));
  }
  async function _0x21fcf1(_0x56fd2e) {
    const _0x580773 = normalizeAudioUrl(_0x56fd2e);
    if (!_0x580773) return { status: 'missing' };
    const _0x210f7c = getAudioCacheKey(_0x580773);
    if (_0x2ba759 && _0x2e417c !== _0x210f7c) _0x1a7517();
    const _0x1e1439 = _0x418b8f(_0x580773);
    if (!_0x1e1439) return { status: 'unavailable' };
    const _0xa863af = ++_0x4ba352;
    ((_0x2ba759 = _0x1e1439), (_0x2e417c = _0x210f7c));
    const _0x2f80da = () => !_0x41edaa && _0xa863af === _0x4ba352 && _0x2ba759 === _0x1e1439;
    beginPlayback(ownerId);
    try {
      const _0x366ccd = await prepareAudioVoicePlaybackElement(_0x1e1439, _0x580773, {
        attachSource: attachSource,
        isPlaybackSource: isPlaybackSource,
        preload: 'auto',
        shouldAssign: _0x2f80da,
      });
      if (!_0x366ccd || !_0x2f80da()) return { status: 'stale', audioEl: _0x1e1439 };
      try {
        (Number['isFinite'](_0x1e1439['duration']) || _0x1e1439['currentTime'] > 0x0) &&
          (_0x1e1439['currentTime'] = 0x0);
      } catch {}
      (_0x12e6b8(), _0x22bebb(_0x1e1439));
      const _0x5cd99f = _0x1e1439['play']?.();
      _0x5cd99f && typeof _0x5cd99f['then'] === 'function' && (await _0x5cd99f);
      if (!_0x2f80da()) {
        try {
          _0x1e1439['pause']?.();
        } catch {}
        return { status: 'stale', audioEl: _0x1e1439 };
      }
      return { status: 'playing', audioEl: _0x1e1439 };
    } catch (_0x2af9f6) {
      if (!_0x2f80da()) return { status: 'stale', audioEl: _0x1e1439 };
      return (
        _0xf9d363(),
        _0xb9b567(_0x210f7c, _0x1e1439),
        { status: 'failed', audioEl: _0x1e1439, error: _0x2af9f6 }
      );
    }
  }
  function _0x380c24() {
    ((_0x283534 += 0x1),
      _0xf9d363(),
      _0x7e6ad7['forEach']((_0x455dfa) => {
        _0x23d528(_0x455dfa);
      }),
      _0x7e6ad7['clear']());
  }
  function _0x10e021() {
    if (_0x41edaa) return;
    (_0x380c24(), _0x400fd1?.(), (_0x41edaa = !![]));
  }
  return {
    clear: _0x380c24,
    destroy: _0x10e021,
    play: _0x21fcf1,
    stop: _0xf9d363,
    warm: _0x57db8c,
    warmMany: _0x88a450,
    getCacheSize: () => _0x7e6ad7['size'],
  };
}
