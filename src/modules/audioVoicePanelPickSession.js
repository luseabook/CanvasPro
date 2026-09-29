import { createLinkCursor, getCursorSize } from './cursorUtils.js';
const VIDEO_NODE_TYPES = new Set(['source-video', 'ai-video', 'video']),
  AUDIO_NODE_TYPES = new Set(['source-audio', 'ai-audio', 'audio']),
  SOURCE_NODE_TYPES = new Set([...VIDEO_NODE_TYPES, ...AUDIO_NODE_TYPES]),
  CANVAS_NODE_SELECTOR = '.v2-node,\x20.v2-fast-preview-node';
export const AUDIO_VOICE_BATCH_AUDIO_PICK_ID = '__audioVoiceSelectedSegments__';
export function isAudioVoiceVideoNode(_0x524483 = {}) {
  return VIDEO_NODE_TYPES['has'](String(_0x524483?.['type'] || '')['trim']());
}
export function isAudioVoiceAudioNode(_0x4acaea = {}) {
  return AUDIO_NODE_TYPES['has'](String(_0x4acaea?.['type'] || '')['trim']());
}
export function isAudioVoiceSourceNode(_0x59fc29 = {}) {
  return SOURCE_NODE_TYPES['has'](String(_0x59fc29?.['type'] || '')['trim']());
}
export function resolveAudioVoiceSelectionTargetIds(
  _0x758fa7 = '',
  _0x2cc355 = [],
  _0x5bfea6 = [],
  _0xd1e9f7 = {},
) {
  const _0x355cde = String(_0x758fa7 || '')['trim']();
  if (!_0x355cde) return [];
  const _0x2abe54 = String(_0xd1e9f7['batchId'] || AUDIO_VOICE_BATCH_AUDIO_PICK_ID),
    _0x5a64df = new Set(
      (Array['isArray'](_0x5bfea6) ? _0x5bfea6 : [])
        ['map']((_0x80cb43) => String(_0x80cb43?.['id'] || '')['trim']())
        ['filter'](Boolean),
    ),
    _0x54317e = _0x2cc355 instanceof Set ? _0x2cc355 : new Set(Array['isArray'](_0x2cc355) ? _0x2cc355 : []),
    _0x253df8 = [..._0x5a64df]['filter']((_0x544419) => _0x54317e['has'](_0x544419));
  if (_0x355cde === _0x2abe54) return _0x253df8;
  if (_0x54317e['has'](_0x355cde) && _0x253df8['length'] > 0x1) return _0x253df8;
  return _0x5a64df['has'](_0x355cde) ? [_0x355cde] : [];
}
function getStateSnapshot(_0x27a10c) {
  return _0x27a10c?.['getStateRaw']?.() || _0x27a10c?.['getState']?.() || {};
}
function createConnectCursor() {
  try {
    return createLinkCursor({ size: getCursorSize() });
  } catch {
    return createLinkCursor({ size: 'small' });
  }
}
export function createAudioVoicePanelPickSession({
  panel: _0x448505,
  noticeElement: noticeElement = null,
  store: store = null,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  getSegments: getSegments = () => [],
  getSelectedSegmentIds: getSelectedSegmentIds = () => new Set(),
  doesSegmentSupportAudioReference: doesSegmentSupportAudioReference = () => !![],
  loadSourceNode: loadSourceNode = () => {},
  applyAudioReference: applyAudioReference = () => ({ applied: ![], appliedIds: [], reason: 'no-target' }),
  syncSourceUi: syncSourceUi = () => {},
  syncAudioTargetUi: syncAudioTargetUi = () => {},
  onAudioPickStateChange: onAudioPickStateChange = null,
  text: text = (_0x2e8512) => _0x2e8512,
  getConnectCursor: getConnectCursor = createConnectCursor,
} = {}) {
  let _0x44b3ea = ![],
    _0x5a0382 = null,
    _0xa4de3f = '',
    _0x193298 = new Set(),
    _0x44688e = null,
    _0x19bff9 = null,
    _0x62b544 = ![];
  function _0x400fff() {
    return documentObject?.['getElementById']?.('v2-wrap') || null;
  }
  function _0x42e79d() {
    return Array['from'](_0x400fff()?.['querySelectorAll']?.(CANVAS_NODE_SELECTOR) || []);
  }
  function _0x2aea1c() {
    return documentObject?.['documentElement'] || globalThis['document']?.['documentElement'] || null;
  }
  function _0x51143f() {
    return getStateSnapshot(store)['nodes'] || {};
  }
  function _0x2794cf(_0x511845, _0x54fb67) {
    windowObject?.['showToast']?.(_0x511845, _0x54fb67);
  }
  function _0x2e9a3a(_0x2d6a5d) {
    if (!noticeElement) return;
    ((noticeElement['textContent'] = text('source.pickNotice')),
      (noticeElement['hidden'] = _0x2d6a5d !== !![]));
  }
  function _0x58eb69() {
    const _0x57b800 = getStateSnapshot(store)['pickConnectMode'] || null;
    if (_0x57b800?.['active']) store?.['setPickConnectMode']?.({ active: ![] });
  }
  function _0x4cd5d5() {
    (_0x5a0382?.['classList']?.['remove']?.('audio-voice-video-pick-hover'), (_0x5a0382 = null));
  }
  function _0x1ea239() {
    (_0x44688e?.['classList']?.['remove']?.('audio-voice-audio-pick-hover'), (_0x44688e = null));
  }
  function _0x9db293(_0x59761f) {
    if (_0x5a0382 === _0x59761f) return;
    _0x4cd5d5();
    if (!_0x59761f) return;
    ((_0x5a0382 = _0x59761f), _0x5a0382['classList']?.['add']?.('audio-voice-video-pick-hover'));
  }
  function _0x194c93(_0x2ead9d) {
    if (_0x44688e === _0x2ead9d) return;
    _0x1ea239();
    if (!_0x2ead9d) return;
    ((_0x44688e = _0x2ead9d), _0x44688e['classList']?.['add']?.('audio-voice-audio-pick-hover'));
  }
  function _0x2d04c4() {
    _0x42e79d()['forEach']((_0x4ba69e) => {
      _0x4ba69e['classList']?.['remove']?.(
        'audio-voice-video-pick-accepted',
        'audio-voice-video-pick-disabled',
      );
    });
  }
  function _0x458237() {
    _0x42e79d()['forEach']((_0xa2dc06) => {
      _0xa2dc06['classList']?.['remove']?.(
        'audio-voice-audio-pick-accepted',
        'audio-voice-audio-pick-disabled',
      );
    });
  }
  function _0x195bbf() {
    const _0x5d1e9d = _0x51143f();
    _0x42e79d()['forEach']((_0x33330f) => {
      const _0x204be0 = String(_0x33330f['id'] || _0x33330f['dataset']?.['nodeId'] || '')['trim'](),
        _0xc3f943 = isAudioVoiceSourceNode(_0x5d1e9d[_0x204be0]);
      (_0x33330f['classList']?.['toggle']?.('audio-voice-video-pick-accepted', _0xc3f943),
        _0x33330f['classList']?.['toggle']?.('audio-voice-video-pick-disabled', !_0xc3f943));
    });
  }
  function _0x1ac5a6() {
    const _0x16481c = _0x51143f();
    _0x42e79d()['forEach']((_0x1841a8) => {
      const _0x1cb666 = String(_0x1841a8['id'] || _0x1841a8['dataset']?.['nodeId'] || '')['trim'](),
        _0x425dfa = isAudioVoiceAudioNode(_0x16481c[_0x1cb666]);
      (_0x1841a8['classList']?.['toggle']?.('audio-voice-audio-pick-accepted', _0x425dfa),
        _0x1841a8['classList']?.['toggle']?.('audio-voice-audio-pick-disabled', !_0x425dfa));
    });
  }
  function _0x7a687b() {
    if (_0x44b3ea) _0x195bbf();
    if (_0xa4de3f) _0x1ac5a6();
  }
  function _0x46fb95() {
    if (!_0x44b3ea && !_0xa4de3f) return;
    if (_0x62b544) return;
    _0x62b544 = !![];
    const _0x24c981 = () => {
      _0x62b544 = ![];
      if (!_0x44b3ea && !_0xa4de3f) return;
      _0x7a687b();
    };
    if (typeof windowObject?.['requestAnimationFrame'] === 'function') {
      windowObject['requestAnimationFrame'](_0x24c981);
      return;
    }
    if (typeof windowObject?.['setTimeout'] === 'function') {
      windowObject['setTimeout'](_0x24c981, 0x0);
      return;
    }
    _0x24c981();
  }
  function _0x404cf4(_0x1350cb) {
    return !!(
      _0x1350cb?.['classList']?.['contains']?.('v2-node') ||
      _0x1350cb?.['classList']?.['contains']?.('v2-fast-preview-node') ||
      _0x1350cb?.['querySelector']?.(CANVAS_NODE_SELECTOR)
    );
  }
  function _0xc83923(_0xf26537 = []) {
    return _0xf26537['some']((_0x52c9eb) => {
      if (_0x52c9eb?.['type'] === 'attributes') return _0x404cf4(_0x52c9eb['target']);
      if (_0x52c9eb?.['type'] !== 'childList') return ![];
      return (
        Array['from'](_0x52c9eb['addedNodes'] || [])['some'](_0x404cf4) ||
        Array['from'](_0x52c9eb['removedNodes'] || [])['some'](_0x404cf4)
      );
    });
  }
  function _0x401ecb() {
    if (_0x19bff9) return;
    const _0x3cd466 = _0x400fff(),
      _0x3602a8 = windowObject?.['MutationObserver'] || globalThis['MutationObserver'];
    if (!_0x3cd466 || typeof _0x3602a8 !== 'function') return;
    ((_0x19bff9 = new _0x3602a8((_0x3fa02b) => {
      if (_0xc83923(_0x3fa02b)) _0x46fb95();
    })),
      _0x19bff9['observe'](_0x3cd466, {
        attributeFilter: ['class'],
        attributes: !![],
        childList: !![],
        subtree: !![],
      }));
  }
  function _0x4df82f() {
    (_0x19bff9?.['disconnect']?.(), (_0x19bff9 = null), (_0x62b544 = ![]));
  }
  function _0x35a495() {
    if (_0x44b3ea || _0xa4de3f) return;
    _0x4df82f();
  }
  function _0x7e07b4(_0x57665f, _0x573343) {
    const _0x472553 = _0x57665f?.['closest']?.(CANVAS_NODE_SELECTOR) || null,
      _0xef109b = String(_0x472553?.['id'] || _0x472553?.['dataset']?.['nodeId'] || '')['trim']();
    if (!_0xef109b) return { nodeElement: null, node: null, accepted: ![] };
    const _0x563911 = _0x51143f()[_0xef109b] || null;
    return { nodeElement: _0x472553, node: _0x563911, accepted: _0x573343(_0x563911) };
  }
  function _0x516090(_0x584413) {
    if (!_0x44b3ea || _0x448505?.['contains']?.(_0x584413['target'])) return;
    const { nodeElement: _0x1e4c0f, accepted: _0x6169db } = _0x7e07b4(
      _0x584413['target'],
      isAudioVoiceSourceNode,
    );
    _0x9db293(_0x6169db ? _0x1e4c0f : null);
  }
  function _0x4afe75(_0x399e05) {
    if (!_0x44b3ea || _0x448505?.['contains']?.(_0x399e05['target'])) return;
    const { node: _0x282f2b, accepted: _0x27cea7 } = _0x7e07b4(_0x399e05['target'], isAudioVoiceSourceNode);
    if (!_0x282f2b) return;
    (_0x399e05['preventDefault']?.(),
      _0x399e05['stopPropagation']?.(),
      _0x399e05['stopImmediatePropagation']?.());
    if (!_0x27cea7) {
      _0x2794cf(text('toasts.sourcePickUnsupported'), 'warn');
      return;
    }
    (loadSourceNode(_0x282f2b, { markLastUsed: !![] }), _0x53099f());
  }
  function _0x4e7114(_0x315841) {
    if (!_0x44b3ea || _0x315841['key'] !== 'Escape') return;
    (_0x315841['preventDefault']?.(),
      _0x315841['stopPropagation']?.(),
      _0x53099f({ toastText: text('toasts.sourcePickCancelled') }));
  }
  function _0x5a8387(_0x8d6734) {
    if (!_0xa4de3f || _0x448505?.['contains']?.(_0x8d6734['target'])) return;
    const { nodeElement: _0x21bc82, accepted: _0x4e331a } = _0x7e07b4(
      _0x8d6734['target'],
      isAudioVoiceAudioNode,
    );
    _0x194c93(_0x4e331a ? _0x21bc82 : null);
  }
  function _0x5b34fa(_0x85339f) {
    if (!_0xa4de3f || _0x448505?.['contains']?.(_0x85339f['target'])) return;
    const { node: _0x5e4f65, accepted: _0x5bde19 } = _0x7e07b4(_0x85339f['target'], isAudioVoiceAudioNode);
    if (!_0x5e4f65) return;
    (_0x85339f['preventDefault']?.(),
      _0x85339f['stopPropagation']?.(),
      _0x85339f['stopImmediatePropagation']?.());
    if (!_0x5bde19) {
      _0x2794cf(text('toasts.audioPickUnsupported'), 'warn');
      return;
    }
    const _0x3a1a31 = _0x1debf0(_0x5e4f65);
    !_0x3a1a31['applied'] &&
      _0x3a1a31['reason'] === 'invalid' &&
      _0x2794cf(text('toasts.audioPickInvalid'), 'warn');
  }
  function _0x35553b(_0x2bc103) {
    if (!_0xa4de3f || _0x2bc103['key'] !== 'Escape') return;
    (_0x2bc103['preventDefault']?.(),
      _0x2bc103['stopPropagation']?.(),
      _0x53bbc1({ toastText: text('toasts.audioPickCancelled') }));
  }
  function _0x53099f({ toastText: toastText = '' } = {}) {
    (documentObject?.['body']?.['classList']?.['remove']?.('audio-voice-video-pick-active'), _0x2e9a3a(![]));
    if (!_0x44b3ea) return;
    ((_0x44b3ea = ![]),
      _0x4cd5d5(),
      _0x2d04c4(),
      _0x448505?.['classList']?.['remove']?.('is-video-picking'),
      _0x400fff()?.['classList']?.['remove']?.('is-connecting', 'audio-voice-video-pick-mode'),
      _0x35a495());
    const _0x240dc0 = _0x2aea1c();
    (_0x240dc0?.['classList']?.['remove']?.('is-connecting-mode'),
      _0x240dc0?.['style']?.['removeProperty']?.('--connect-cursor'),
      documentObject?.['removeEventListener']?.('click', _0x4afe75, !![]),
      documentObject?.['removeEventListener']?.('pointermove', _0x516090, !![]),
      documentObject?.['removeEventListener']?.('keydown', _0x4e7114, !![]),
      syncSourceUi());
    if (toastText) _0x2794cf(toastText, 'info');
  }
  function _0x5a2080({ toggle: toggle = !![] } = {}) {
    if (_0x44b3ea) {
      toggle && _0x53099f({ toastText: text('toasts.sourcePickCancelled') });
      return;
    }
    (_0x58eb69(),
      _0x53bbc1(),
      (_0x44b3ea = !![]),
      _0x448505?.['classList']?.['add']?.('is-video-picking'),
      documentObject?.['body']?.['classList']?.['add']?.('audio-voice-video-pick-active'),
      _0x2e9a3a(!![]),
      _0x400fff()?.['classList']?.['add']?.('is-connecting', 'audio-voice-video-pick-mode'),
      _0x401ecb(),
      _0x195bbf());
    const _0x2ec642 = _0x2aea1c();
    (_0x2ec642?.['classList']?.['add']?.('is-connecting-mode'),
      _0x2ec642?.['style']?.['setProperty']?.('--connect-cursor', getConnectCursor()),
      documentObject?.['addEventListener']?.('click', _0x4afe75, !![]),
      documentObject?.['addEventListener']?.('pointermove', _0x516090, !![]),
      documentObject?.['addEventListener']?.('keydown', _0x4e7114, !![]),
      syncSourceUi(),
      _0x2794cf(text('toasts.sourcePickStarted'), 'info'));
  }
  function _0x279e58(_0x55d721) {
    const _0x5f17ce = String(_0x55d721 || '')['trim'](),
      _0x5bc42d = getSegments(),
      _0x2e2a37 = (Array['isArray'](_0x5bc42d) ? _0x5bc42d : [])['filter'](
        (_0x1d9921) => _0x1d9921?.['status'] !== 'removed',
      ),
      _0x197922 = resolveAudioVoiceSelectionTargetIds(_0x5f17ce, getSelectedSegmentIds(), _0x2e2a37);
    if (_0x197922['length'] <= 0x0) return { eligible: ![], reason: 'no-target', targetIds: _0x197922 };
    const _0x467aaf = _0x197922['some']((_0x506d4d) => {
      const _0x3dcf48 = _0x2e2a37['find']((_0x433084) => _0x433084?.['id'] === _0x506d4d);
      return _0x3dcf48 && !doesSegmentSupportAudioReference(_0x3dcf48);
    });
    return { eligible: !_0x467aaf, reason: _0x467aaf ? 'unsupported' : '', targetIds: _0x197922 };
  }
  function _0x51d066({ segmentId: segmentId = '' } = {}) {
    return _0x279e58(segmentId)['eligible'];
  }
  function _0x53bbc1({ toastText: toastText = '' } = {}) {
    if (!_0xa4de3f) return;
    const _0x3e702f = [..._0x193298];
    ((_0xa4de3f = ''),
      (_0x193298 = new Set()),
      _0x1ea239(),
      _0x458237(),
      _0x448505?.['classList']?.['remove']?.('is-audio-picking'),
      _0x400fff()?.['classList']?.['remove']?.('is-connecting', 'audio-voice-audio-pick-mode'),
      _0x35a495());
    const _0x437c25 = _0x2aea1c();
    (_0x437c25?.['classList']?.['remove']?.('is-connecting-mode'),
      _0x437c25?.['style']?.['removeProperty']?.('--connect-cursor'),
      documentObject?.['removeEventListener']?.('click', _0x5b34fa, !![]),
      documentObject?.['removeEventListener']?.('pointermove', _0x5a8387, !![]),
      documentObject?.['removeEventListener']?.('keydown', _0x35553b, !![]),
      syncAudioTargetUi(_0x3e702f),
      onAudioPickStateChange?.({ active: ![], segmentId: '', targetSegmentIds: [] }));
    if (toastText) _0x2794cf(toastText, 'info');
  }
  function _0x2dc69c(_0x3d2243, { announce: announce = !![] } = {}) {
    const _0xf5b660 = String(_0x3d2243 || '')['trim']();
    if (!_0xf5b660) return;
    const _0x51f72b = _0x279e58(_0xf5b660),
      { targetIds: _0x58a319 } = _0x51f72b;
    if (_0x51f72b['reason'] === 'no-target') {
      _0x2794cf(text('toasts.selectSentenceForVoice'), 'warn');
      return;
    }
    if (_0x51f72b['reason'] === 'unsupported') {
      _0x2794cf(text('toasts.voiceCloneUnsupported'), 'warn');
      return;
    }
    if (_0xa4de3f === _0xf5b660) {
      _0x53bbc1({ toastText: text('toasts.audioPickCancelled') });
      return;
    }
    (_0x58eb69(),
      _0x53099f(),
      _0x53bbc1(),
      (_0xa4de3f = _0xf5b660),
      (_0x193298 = new Set(_0x58a319)),
      _0x448505?.['classList']?.['add']?.('is-audio-picking'),
      _0x400fff()?.['classList']?.['add']?.('is-connecting', 'audio-voice-audio-pick-mode'),
      _0x401ecb(),
      _0x1ac5a6());
    const _0x4ff933 = _0x2aea1c();
    (_0x4ff933?.['classList']?.['add']?.('is-connecting-mode'),
      _0x4ff933?.['style']?.['setProperty']?.('--connect-cursor', getConnectCursor()),
      documentObject?.['addEventListener']?.('click', _0x5b34fa, !![]),
      documentObject?.['addEventListener']?.('pointermove', _0x5a8387, !![]),
      documentObject?.['addEventListener']?.('keydown', _0x35553b, !![]),
      syncAudioTargetUi(_0x58a319),
      onAudioPickStateChange?.({ active: !![], segmentId: _0xf5b660, targetSegmentIds: [..._0x58a319] }));
    if (announce) _0x2794cf(text('toasts.audioPickStarted'), 'info');
  }
  function _0x1debf0(_0x5690e6 = {}, { segmentId: segmentId = '' } = {}) {
    const _0x15271f = String(segmentId || '')['trim']();
    if (_0x15271f && _0x15271f !== _0xa4de3f) {
      _0x2dc69c(_0x15271f, { announce: ![] });
      if (_0xa4de3f !== _0x15271f) return { applied: ![], reason: 'no-target', appliedIds: [] };
    }
    if (!_0xa4de3f) return { applied: ![], reason: 'not-picking', appliedIds: [] };
    const _0x2a1674 = applyAudioReference(_0x5690e6, [..._0x193298]);
    if (!_0x2a1674?.['appliedIds']?.['length'])
      return { applied: ![], reason: _0x2a1674?.['reason'] || 'invalid', appliedIds: [] };
    return (
      _0x53bbc1(),
      _0x2794cf(
        _0x2a1674['appliedIds']['length'] > 0x1
          ? text('toasts.audioPickBatchSelected', { count: _0x2a1674['appliedIds']['length'] })
          : text('toasts.audioPickSelected'),
        'success',
      ),
      { applied: !![], reason: '', appliedIds: _0x2a1674['appliedIds'] }
    );
  }
  function _0x3a1ee8() {
    (_0x53099f(), _0x53bbc1());
  }
  function _0x359f5c() {
    return { sourceActive: _0x44b3ea, audioSegmentId: _0xa4de3f, audioTargetSegmentIds: [..._0x193298] };
  }
  function _0x2b512b() {
    (_0x3a1ee8(), _0x4df82f());
  }
  return {
    canSelectAudioReference: _0x51d066,
    destroy: _0x2b512b,
    getSnapshot: _0x359f5c,
    selectAudioReference: _0x1debf0,
    startAudioPick: _0x2dc69c,
    startSourcePick: _0x5a2080,
    stopAll: _0x3a1ee8,
  };
}
