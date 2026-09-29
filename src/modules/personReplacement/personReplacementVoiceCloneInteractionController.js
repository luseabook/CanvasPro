import { createAudioPlaybackSurfaceController } from '../../components/audio-node/audioPlaybackSurface.js';
import { attachMediaElementPlaybackSource } from '../../services/desktopMediaBlobSource.js';
import { syncPersonReplacementVoicePreviewUi } from './personReplacementAssetPresentation.js';
import { renderPersonReplacementVoiceCloneSourceCards } from './personReplacementVoiceClonePresentation.js';
import {
  isPersonReplacementVoiceSeparationActive,
  resolvePersonReplacementVoiceSeparationState,
} from './personReplacementVoiceSeparationState.js';
function normalizeText(_0x1863d1) {
  return String(_0x1863d1 ?? '')['trim']();
}
function cloneJson(_0x4b8f1b) {
  return _0x4b8f1b && typeof _0x4b8f1b === 'object' ? JSON['parse'](JSON['stringify'](_0x4b8f1b)) : _0x4b8f1b;
}
function requireFunctions(_0x3d4ce0, _0x2aaaa8) {
  for (const [_0xd2eab0, _0x167c13] of Object['entries'](_0x2aaaa8)) {
    if (typeof _0x167c13 !== 'function')
      throw new TypeError(_0x3d4ce0 + '\x20requires\x20' + _0xd2eab0 + '.');
  }
}
export function createPersonReplacementVoiceCloneInteractionController({
  getRoot: _0x5c7f28,
  getProject: _0x28441d,
  isDestroyed: _0x18ba20,
  commitProject: _0x5a1235,
  mountStudio: _0x14cf91,
  resumeVoiceSeparation: _0x438210,
  resolveCharacterVoiceUrl: _0x303f94,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
} = {}) {
  const _0x121ea3 = 'Person\x20replacement\x20voice-clone\x20interaction';
  requireFunctions(_0x121ea3, {
    commitProject: _0x5a1235,
    getProject: _0x28441d,
    getRoot: _0x5c7f28,
    isDestroyed: _0x18ba20,
    mountStudio: _0x14cf91,
    resolveCharacterVoiceUrl: _0x303f94,
    resumeVoiceSeparation: _0x438210,
  });
  let _0x1a735c = null,
    _0x43295d = null,
    _0x28aa3d = [],
    _0x4b727e = null,
    _0x21fb3e = '',
    _0x497746 = '',
    _0x5aa990 = null,
    _0x294e12 = null,
    _0x53b116 = null,
    _0x49e199 = ![];
  const _0xffcda3 = () => _0x5c7f28() || null,
    _0x2f9f39 = () => _0x28441d() || {};
  function _0x191b17({ active: active = ![] } = {}) {
    _0xffcda3()?.['classList']?.['toggle']?.('is-voice-audio-picking', active === !![]);
  }
  function _0x7e9e78() {
    syncPersonReplacementVoicePreviewUi(_0xffcda3(), { audioEl: _0x4b727e, assetId: _0x21fb3e });
  }
  function _0x4b0fcf(_0x746ccb) {
    ['play', 'pause', 'timeupdate', 'loadedmetadata', 'durationchange', 'ended']['forEach']((_0x4502e7) => {
      _0x746ccb['addEventListener']?.(_0x4502e7, _0x7e9e78);
    });
  }
  function _0x1a3181() {
    _0x5aa990 = null;
    if (_0x4b727e)
      try {
        (_0x4b727e['pause']?.(), (_0x4b727e['currentTime'] = 0x0));
      } catch {}
    ((_0x4b727e = null), (_0x21fb3e = ''), (_0x497746 = ''), _0x7e9e78());
  }
  function _0x26a62e() {
    (_0x28aa3d['forEach']((_0x363e5b) => _0x363e5b?.['destroy']?.()), (_0x28aa3d = []));
  }
  function _0x383535() {
    _0x26a62e();
    const _0x2935d4 = Array['from'](
      _0xffcda3()?.['querySelectorAll']?.('[data-person-replacement-voice-track]') || [],
    );
    _0x2935d4['forEach']((_0x87d12) => {
      let _0x243880 = null;
      _0x243880 = createAudioPlaybackSurfaceController(_0x87d12, {
        onBeforePlay: () => {
          (_0x1a3181(),
            _0x28aa3d['forEach']((_0x1847c9) => {
              if (_0x1847c9 !== _0x243880) _0x1847c9?.['audioEl']?.['pause']?.();
            }));
        },
        onError: () =>
          windowObject?.['showToast']?.(
            _0x87d12['dataset']?.['personReplacementVoiceTrack'] === 'vocals'
              ? '清晰人声播放失败。'
              : '原始声音播放失败。',
            'warn',
          ),
      });
      if (_0x243880) _0x28aa3d['push'](_0x243880);
    });
  }
  function _0xca0826() {
    (_0x1a735c?.(), (_0x1a735c = null), (_0x43295d = null), _0x191b17());
  }
  function _0x50fb0c() {
    _0xca0826();
    const _0x47c1c8 = _0x2f9f39();
    if (_0x47c1c8['workspace']?.['step'] !== 0x4) return ![];
    const _0x203249 = _0xffcda3()?.['querySelector']?.('[data-person-replacement-voice-studio-host]');
    if (!_0x203249) return ![];
    const _0x5775ba = _0x14cf91(_0x203249, {
        project: cloneJson(_0x47c1c8),
        sourceId: _0x47c1c8['workspace']['selectedVoiceSourceId'],
        onAudioPickStateChange: _0x191b17,
      }),
      _0x8d0b60 = normalizeText(_0x47c1c8['workspace']['selectedVoiceSourceId']),
      _0x5d0e71 = resolvePersonReplacementVoiceSeparationState(_0x47c1c8, _0x8d0b60);
    _0x8d0b60 && isPersonReplacementVoiceSeparationActive(_0x5d0e71) && _0x438210(_0x8d0b60);
    if (typeof _0x5775ba === 'function')
      return (
        (_0x1a735c = () => {
          (_0x191b17(), _0x5775ba());
        }),
        !![]
      );
    if (_0x5775ba && typeof _0x5775ba === 'object')
      return (
        (_0x43295d = _0x5775ba),
        typeof _0x5775ba['destroy'] === 'function' &&
          (_0x1a735c = () => {
            (_0x191b17(), _0x5775ba['destroy']());
          }),
        !![]
      );
    return ![];
  }
  function _0x168440(_0x322b67, _0x319260 = {}) {
    const _0xf669d6 = _0x43295d?.['selectVoiceAsset']?.(_0x322b67, _0x319260);
    if (_0xf669d6?.['applied']) _0x191b17();
    else {
      if (_0xf669d6?.['reason'] === 'not-picking')
        windowObject?.['showToast']?.('请先点击右侧句子轨中的声音克隆入参，再选择人物素材。', 'info');
      else
        _0xf669d6?.['reason'] === 'invalid' &&
          windowObject?.['showToast']?.('该人物音频不可用，请重新上传。', 'warn');
    }
    return _0xf669d6;
  }
  async function _0x29ea25(_0x2d97a0) {
    const _0x37febe = normalizeText(_0x2d97a0),
      _0x1377c3 = _0x2f9f39(),
      _0x43a063 = (Array['isArray'](_0x1377c3['characters']) ? _0x1377c3['characters'] : [])['find'](
        (_0xd29240) => _0xd29240['id'] === _0x37febe,
      ),
      _0xd69dd9 = _0x303f94(_0x43a063);
    if (!_0xd69dd9 || typeof windowObject?.['Audio'] !== 'function') return;
    _0x28aa3d['forEach']((_0x26ef03) => _0x26ef03?.['audioEl']?.['pause']?.());
    const _0x1d7477 = Boolean(_0x4b727e && _0x21fb3e === _0x37febe && _0x497746 === _0xd69dd9);
    if (_0x1d7477 && _0x5aa990) {
      await _0x5aa990;
      return;
    }
    if (_0x1d7477 && _0x4b727e['paused'] === ![] && _0x4b727e['ended'] !== !![]) {
      (_0x4b727e['pause']?.(), _0x7e9e78());
      return;
    }
    !_0x1d7477 &&
      (_0x1a3181(),
      (_0x4b727e = new windowObject['Audio']()),
      (_0x4b727e['preload'] = 'auto'),
      (_0x21fb3e = _0x37febe),
      (_0x497746 = _0xd69dd9),
      _0x4b0fcf(_0x4b727e));
    const _0x3f1d89 = _0x4b727e;
    if (_0x3f1d89['ended']) _0x3f1d89['currentTime'] = 0x0;
    _0x7e9e78();
    let _0x3ee091 = null;
    ((_0x3ee091 = (async () => {
      try {
        const _0x3cfb74 = await attachMediaElementPlaybackSource(_0x3f1d89, _0xd69dd9, {
          preload: 'auto',
          shouldAssign: () => _0x4b727e === _0x3f1d89 && _0x21fb3e === _0x37febe && _0x497746 === _0xd69dd9,
        });
        if (!_0x3cfb74 || _0x4b727e !== _0x3f1d89 || _0x21fb3e !== _0x37febe || _0x497746 !== _0xd69dd9)
          return;
        const _0x15ef0a = _0x3f1d89['play']?.();
        _0x15ef0a && typeof _0x15ef0a['then'] === 'function' && (await _0x15ef0a);
        if (_0x4b727e === _0x3f1d89) _0x7e9e78();
      } catch {
        if (_0x4b727e !== _0x3f1d89) return;
        (_0x1a3181(), windowObject?.['showToast']?.('声音参考播放失败。', 'warn'));
      } finally {
        _0x5aa990 === _0x3ee091 && (_0x5aa990 = null);
      }
    })()),
      (_0x5aa990 = _0x3ee091),
      await _0x3ee091);
  }
  function _0xdb36be(_0x3c60d6) {
    const _0x33669e = _0x2f9f39(),
      _0x4c012a = normalizeText(_0x3c60d6);
    if (
      !_0x4c012a ||
      _0x4c012a === _0x33669e['workspace']?.['selectedVoiceSourceId'] ||
      !(Array['isArray'](_0x33669e['sources']) ? _0x33669e['sources'] : [])['some'](
        (_0x48e413) => _0x48e413['id'] === _0x4c012a && _0x48e413['videoRef'],
      )
    )
      return cloneJson(_0x33669e);
    const _0x93f845 = {
      ..._0x33669e,
      workspace: { ..._0x33669e['workspace'], selectedVoiceSourceId: _0x4c012a },
    };
    if (typeof _0x43295d?.['selectSource'] !== 'function')
      return _0x5a1235(_0x93f845, { reason: 'voice-source', render: !![] });
    const _0x55df50 = _0x43295d['selectSource'](_0x4c012a);
    if (_0x55df50?.['selected'] === ![]) return cloneJson(_0x33669e);
    const _0x18facf = _0x5a1235(_0x93f845, { reason: 'voice-source', render: ![] }),
      _0x41125b = _0xffcda3();
    return (
      _0x41125b?.['querySelectorAll']?.('[data-person-replacement-action="select-voice-source"]')?.[
        'forEach'
      ]?.((_0x3e56e0) => {
        const _0x547ddb = normalizeText(_0x3e56e0['dataset']?.['sourceId']) === _0x4c012a;
        (_0x3e56e0['classList']?.['toggle']?.('is-selected', _0x547ddb),
          _0x3e56e0['setAttribute']?.('aria-pressed', _0x547ddb ? 'true' : 'false'));
        const _0x2b56ce = _0x3e56e0['querySelector']?.('.person-replacement-voice-source-state');
        if (_0x2b56ce) _0x2b56ce['textContent'] = _0x547ddb ? '当前' : '选择';
      }),
      _0x41125b?.['querySelectorAll']?.('[data-person-replacement-voice-source-shell]')?.['forEach']?.(
        (_0xb98695) => {
          _0xb98695['classList']?.['toggle']?.(
            'is-selected',
            normalizeText(_0xb98695['dataset']?.['sourceId']) === _0x4c012a,
          );
        },
      ),
      _0x7e9e78(),
      cloneJson(_0x18facf)
    );
  }
  function _0x75199b({ sourceId: sourceId = '', remountVoiceStudio: remountVoiceStudio = ![] } = {}) {
    const _0xce878b = _0x2f9f39();
    if (_0x18ba20() || _0xce878b['workspace']?.['step'] !== 0x4) return ![];
    const _0x5394b1 = _0xffcda3()?.['querySelector']?.('.person-replacement-voice-source-list');
    if (!_0x5394b1) return ![];
    const _0x37f991 = normalizeText(sourceId),
      _0x161159 = documentObject?.['activeElement']?.['closest']?.(
        '[data-person-replacement-voice-source-shell]',
      ),
      _0x229d4c = Boolean(_0x37f991 && normalizeText(_0x161159?.['dataset']?.['sourceId']) === _0x37f991);
    (_0x26a62e(),
      (_0x5394b1['innerHTML'] =
        renderPersonReplacementVoiceCloneSourceCards(_0xce878b) ||
        '<p class="person-replacement-inline-empty">请先在项目首页上传视频</p>'),
      _0x383535());
    if (remountVoiceStudio) _0x50fb0c();
    return (
      _0x229d4c &&
        Array['from'](
          _0x5394b1['querySelectorAll']?.(
            '[data-person-replacement-action="extract-clean-voice"], [data-person-replacement-action="cancel-voice-separation"]',
          ) || [],
        )
          ['find']((_0x5b7dfb) => normalizeText(_0x5b7dfb['dataset']?.['sourceId']) === _0x37f991)
          ?.['focus']?.(),
      !![]
    );
  }
  function _0x1ec5ca() {
    (_0x294e12?.['classList']?.['remove']?.('is-person-replacement-voice-drop-target'), (_0x294e12 = null));
  }
  function _0x209fdf() {
    ((_0x53b116 = null), (_0x49e199 = ![]));
  }
  function _0x28e0e2(_0x1de9a9) {
    if (_0x53b116 === _0x1de9a9) return _0x49e199;
    const _0x3289fa = normalizeText(_0x1de9a9?.['dataset']?.['segmentId']);
    return (
      (_0x53b116 = _0x1de9a9),
      (_0x49e199 = Boolean(
        _0x3289fa && _0x43295d?.['canSelectVoiceAsset']?.({ segmentId: _0x3289fa }) === !![],
      )),
      _0x49e199
    );
  }
  function _0x130539(_0x4e5ef0) {
    if (_0x294e12 === _0x4e5ef0) return;
    (_0x1ec5ca(),
      (_0x294e12 = _0x4e5ef0 || null),
      _0x294e12?.['classList']?.['add']?.('is-person-replacement-voice-drop-target'));
  }
  function _0x450c09() {
    (_0x1ec5ca(), _0x209fdf(), _0x26a62e(), _0xca0826(), _0x1a3181());
  }
  return Object['freeze']({
    bindSourcePlayback: _0x383535,
    canDropOnAudioParam: _0x28e0e2,
    clearDropTarget: _0x1ec5ca,
    destroy: _0x450c09,
    destroySourcePlaybackBindings: _0x26a62e,
    mount: _0x50fb0c,
    playPreview: _0x29ea25,
    refreshSourceCards: _0x75199b,
    resetDropEligibility: _0x209fdf,
    selectSource: _0xdb36be,
    selectVoiceAsset: _0x168440,
    setDropTarget: _0x130539,
    stopPreview: _0x1a3181,
    syncPreviewUi: _0x7e9e78,
    unmount: _0xca0826,
  });
}
