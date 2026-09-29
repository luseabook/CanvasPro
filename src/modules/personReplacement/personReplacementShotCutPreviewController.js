import { localPathToUrl } from '../../utils/localMediaPath.js';
import {
  PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
  PERSON_REPLACEMENT_CUT_MIN_SEC,
  getPersonReplacementShotCutPositionAtTimelineSec,
  getPersonReplacementShotCutTimelineSec,
  getPersonReplacementShotCutTotalDuration,
} from './personReplacementShotCutModel.js';
import { syncPersonReplacementVideoStageFrame } from './personReplacementVideoPresentation.js';
function normalizeText(_0x2a5719) {
  return String(_0x2a5719 ?? '')['trim']();
}
function normalizeMediaUrl(_0x202cef) {
  const _0x1d3226 = normalizeText(_0x202cef);
  if (!_0x1d3226) return '';
  return localPathToUrl(_0x1d3226) || _0x1d3226;
}
function clamp(_0x5020b4, _0x35a6c6, _0xf55a4e, _0x2c2922 = _0x35a6c6) {
  const _0x47c69b = Number(_0x5020b4);
  return Number['isFinite'](_0x47c69b)
    ? Math['min'](_0xf55a4e, Math['max'](_0x35a6c6, _0x47c69b))
    : _0x2c2922;
}
export function createPersonReplacementShotCutPreviewController({
  session: _0xf2467a,
  mediaController: _0x2a4eff,
  viewportController: _0x17b206,
  getRoot: getRoot = () => null,
  getProject: getProject = () => ({}),
} = {}) {
  if (!_0xf2467a?.['workspaceState'] || !_0xf2467a?.['playback'])
    throw new TypeError('Shot cut preview requires a playback session.');
  if (!_0x2a4eff || !_0x17b206)
    throw new TypeError('Shot\x20cut\x20preview\x20requires\x20media\x20and\x20viewport\x20owners.');
  const _0x42ecb2 = _0xf2467a['workspaceState'],
    _0xcedf7c = _0xf2467a['playback'],
    _0x325fa7 = () => _0xf2467a['stopPlayback'](),
    _0x3fd2de = (_0x54b2cb) => _0xcedf7c['isReverseActive']() || _0x54b2cb?.['paused'] === ![],
    _0x3b1d0f = () => {
      ((_0x42ecb2['previewSeekToken'] += 0x1), _0xf2467a['cancelPreviewFrameWait']());
    },
    _0x2f3904 = () => _0xf2467a['clearPreviewMetadata'](),
    _0x234605 = () => _0xf2467a['cancelHoverPreview'](),
    _0x221e2d = (_0x4ef116 = {}) => {
      ((_0x42ecb2['playheadSec'] = Number(_0x4ef116['timelineSec']) || 0x0),
        (_0x42ecb2['previewShotId'] = normalizeText(_0x4ef116['shotId'])),
        _0x17b206['syncPlayhead']());
    },
    _0x2c55b6 = (_0x3dd3dc, _0x469129, _0x128b4b) => {
      if (
        !_0x469129 ||
        _0x128b4b !== _0x42ecb2['previewSeekToken'] ||
        _0x42ecb2['pendingPreviewSeek'] !== _0x469129 ||
        _0x3dd3dc !== getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-video]')
      )
        return ![];
      const _0x51f65f = Number(_0x469129['sourceSec']),
        _0x5f5b62 = Number(_0x469129['presentedSourceSec']),
        _0x4afa73 = Math['max'](0.04, Number(_0x469129['toleranceSec']) || 0x0);
      if (
        _0x469129['seeked'] !== !![] ||
        !Number['isFinite'](_0x51f65f) ||
        !Number['isFinite'](_0x5f5b62) ||
        Math['abs'](_0x5f5b62 - _0x51f65f) > _0x4afa73
      )
        return ![];
      return (
        (_0x42ecb2['pendingPreviewSeek'] = null),
        (_0x42ecb2['previewFrameReadyToken'] = _0x128b4b),
        (_0x42ecb2['previewFrameCallbackId'] = null),
        (_0x42ecb2['previewFrameCallbackVideo'] = null),
        !![]
      );
    },
    _0x41e66b = (_0x109ad9, _0x328be0, _0x53ffbb) => {
      if (
        !_0x109ad9 ||
        !_0x328be0 ||
        _0x53ffbb !== _0x42ecb2['previewSeekToken'] ||
        _0x42ecb2['pendingPreviewSeek'] !== _0x328be0
      )
        return ![];
      _0xf2467a['cancelPreviewFrameWait']();
      if (typeof _0x109ad9['requestVideoFrameCallback'] !== 'function') return ![];
      try {
        return (
          (_0x42ecb2['previewFrameCallbackVideo'] = _0x109ad9),
          (_0x42ecb2['previewFrameCallbackId'] = _0x109ad9['requestVideoFrameCallback'](
            (_0x179314, _0x471ffb = {}) => {
              if (_0x53ffbb !== _0x42ecb2['previewSeekToken']) return;
              ((_0x42ecb2['previewFrameCallbackId'] = null), (_0x42ecb2['previewFrameCallbackVideo'] = null));
              const _0x37ab59 = Number(_0x471ffb?.['mediaTime']);
              ((_0x328be0['presentedSourceSec'] = Number['isFinite'](_0x37ab59)
                ? _0x37ab59
                : Number(_0x109ad9['currentTime'])),
                _0x2c55b6(_0x109ad9, _0x328be0, _0x53ffbb) && _0xb17f7a(_0x109ad9));
            },
          )),
          !![]
        );
      } catch {
        return (
          (_0x42ecb2['previewFrameCallbackId'] = null),
          (_0x42ecb2['previewFrameCallbackVideo'] = null),
          ![]
        );
      }
    },
    _0x2ef093 = (
      _0x15b0db,
      _0xf13b33,
      {
        timelineSec: timelineSec = null,
        autoplay: autoplay = ![],
        hover: hover = ![],
        preservePlayhead: preservePlayhead = ![],
      } = {},
    ) => {
      const _0x251da0 = normalizeText(_0x15b0db),
        _0x3ff915 = getProject(),
        _0x1e1760 = _0x42ecb2['draft']['find'](
          (_0x40d7ef) => normalizeText(_0x40d7ef?.['shotId']) === _0x251da0,
        ),
        _0x486f0c =
          _0x3ff915['shots']['find']((_0x52a879) => _0x52a879['id'] === _0x251da0) ||
          _0x3ff915['shots']['find'](
            (_0x178e82) => _0x178e82['id'] === normalizeText(_0x1e1760?.['originShotId']),
          ),
        _0x2d3f3c = _0x2a4eff['getSourceMediaRef'](_0x486f0c?.['sourceId']),
        _0x50ea3a = getRoot(),
        _0x2a7ff0 = _0x50ea3a?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      if (!_0x486f0c || !_0x2d3f3c || !_0x2a7ff0) return ![];
      const _0x142491 = _0x1e1760?.['shotId'] || _0x486f0c['id'],
        _0x151fc4 = Math['max'](
          PERSON_REPLACEMENT_CUT_MIN_SEC,
          0x1 / Math['max'](0x1, Number(_0x1e1760?.['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS),
        );
      _0x3b1d0f();
      const _0x1a6e51 = _0x42ecb2['previewSeekToken'],
        _0x40e97e =
          timelineSec !== null && timelineSec !== undefined && Number['isFinite'](Number(timelineSec)),
        _0x142940 = _0x40e97e
          ? clamp(Number(timelineSec), 0x0, getPersonReplacementShotCutTotalDuration(_0x42ecb2['draft']), 0x0)
          : getPersonReplacementShotCutTimelineSec(_0x42ecb2['draft'], _0x142491, _0xf13b33);
      !hover
        ? ((_0x42ecb2['hoverPreviewActive'] = ![]),
          (_0x42ecb2['hoverPreviewTimeSec'] = null),
          (_0x42ecb2['previewShotId'] = _0x142491),
          (_0x42ecb2['pendingPreviewSeek'] = {
            rangeId: _0x142491,
            sourceSec: Number(_0xf13b33) || 0x0,
            kind: preservePlayhead ? 'boundary-preview' : 'playhead',
            token: _0x1a6e51,
            toleranceSec: Math['max'](0.04, _0x151fc4 * 0x2),
            seeked: ![],
            presentedSourceSec: Number['NaN'],
          }),
          !preservePlayhead && ((_0x42ecb2['playheadSec'] = _0x142940), _0x17b206['syncPlayhead']()),
          _0x50ea3a?.['querySelectorAll']?.('[data-person-replacement-cut-shot-index]')?.['forEach']?.(
            (_0x41f362) => {
              const _0x9b0fbb = _0x41f362['dataset']?.['shotId'] === _0x142491;
              (_0x41f362['classList']?.['toggle']?.('is-previewing', _0x9b0fbb),
                _0x41f362['setAttribute']?.('aria-pressed', String(_0x9b0fbb)));
              if (_0x9b0fbb) _0x41f362['setAttribute']?.('data-selected-clip', 'true');
              else _0x41f362['removeAttribute']?.('data-selected-clip');
            },
          ))
        : (_0x42ecb2['pendingPreviewSeek'] = {
            rangeId: _0x142491,
            sourceSec: Number(_0xf13b33) || 0x0,
            kind: 'hover',
            token: _0x1a6e51,
            toleranceSec: Math['max'](0.04, _0x151fc4 * 0x2),
            seeked: ![],
            presentedSourceSec: Number['NaN'],
          });
      const _0x40c193 = normalizeMediaUrl(_0x2d3f3c),
        _0xe5ef97 = _0x2a7ff0['dataset']?.['sourceId'] !== _0x486f0c['sourceId'];
      let _0x477288 = ![];
      const _0x36035b = () => {
          if (!autoplay || _0x1e1760?.['isReversed'] === !![] || _0x477288) return;
          _0x477288 = !![];
          try {
            const _0x2bb533 = _0x2a4eff['playPreviewVideo'](_0x2a7ff0);
            Promise['resolve'](_0x2bb533)['then'](
              (_0x3b62de) => {
                if (_0x3b62de === ![]) _0x477288 = ![];
              },
              () => {
                _0x477288 = ![];
              },
            );
          } catch {
            _0x477288 = ![];
          }
        },
        _0x2964c6 = () => {
          (_0x2f3904(), syncPersonReplacementVideoStageFrame(_0x2a7ff0));
          const _0x22695f = _0x42ecb2['pendingPreviewSeek'];
          let _0x38c510 = ![];
          try {
            const _0x28f287 = Math['max'](0x0, Number(_0xf13b33) || 0x0);
            (!Number['isFinite'](Number(_0x2a7ff0['currentTime'])) ||
              Math['abs'](Number(_0x2a7ff0['currentTime']) - _0x28f287) > 0.02) &&
              ((_0x2a7ff0['currentTime'] = _0x28f287), (_0x38c510 = !![]));
          } catch {}
          _0x22695f && !_0x38c510 && (_0x22695f['seeked'] = _0x2a7ff0['seeking'] !== !![]);
          let _0x808a31 = ![];
          _0x22695f && !_0x38c510 && !_0xe5ef97
            ? ((_0x22695f['presentedSourceSec'] = Number(_0x2a7ff0['currentTime'])),
              _0x2c55b6(_0x2a7ff0, _0x22695f, _0x1a6e51))
            : (_0x808a31 = _0x41e66b(_0x2a7ff0, _0x22695f, _0x1a6e51));
          _0x22695f &&
            !_0x808a31 &&
            ((_0x22695f['presentedSourceSec'] = Number(_0x2a7ff0['currentTime'])),
            _0x2c55b6(_0x2a7ff0, _0x22695f, _0x1a6e51));
          if (autoplay && _0x1e1760?.['isReversed'] === !![]) _0xcedf7c['startReverse'](_0x2a7ff0, _0x142940);
          else _0x36035b();
        };
      ((_0x2a7ff0['preload'] = 'auto'), (_0x2a7ff0['muted'] = !_0x42ecb2['soundEnabled']), _0x2f3904());
      if (_0xe5ef97)
        (_0x325fa7(),
          _0x2a4eff['attachPreviewMedia'](_0x2a7ff0, _0x486f0c['sourceId'], _0x40c193),
          _0x2a7ff0['addEventListener']?.('loadedmetadata', _0x2964c6, { once: !![] }),
          (_0x42ecb2['previewMetadataCleanup'] = () => {
            _0x2a7ff0['removeEventListener']?.('loadedmetadata', _0x2964c6);
          }));
      else
        Number(_0x2a7ff0['readyState']) >= 0x1
          ? _0x2964c6()
          : (_0x2a7ff0['addEventListener']?.('loadedmetadata', _0x2964c6, { once: !![] }),
            (_0x42ecb2['previewMetadataCleanup'] = () => {
              _0x2a7ff0['removeEventListener']?.('loadedmetadata', _0x2964c6);
            }),
            _0x36035b());
      return (autoplay && _0x1e1760?.['isReversed'] !== !![] && _0xcedf7c['startNative'](_0x2a7ff0), !![]);
    },
    _0x5be8fe = (_0x35d0c1, { autoplay: autoplay = ![] } = {}) => {
      if (!_0x42ecb2['isOpen'] || _0x17b206['isBusy']() || _0x42ecb2['isKeyframeCapturing']) return ![];
      const _0x373422 = getPersonReplacementShotCutPositionAtTimelineSec(_0x42ecb2['draft'], _0x35d0c1);
      if (_0x373422['shotIndex'] < 0x0) return ![];
      return _0x2ef093(_0x373422['shotId'], _0x373422['sourceTimeSec'], {
        timelineSec: _0x373422['timelineSec'],
        autoplay: autoplay,
      });
    },
    _0x529a92 = () => {
      if (!_0x42ecb2['isOpen'] || _0x17b206['isBusy']() || _0x42ecb2['isKeyframeCapturing']) return ![];
      const _0x5f23a0 = getRoot(),
        _0x2e10f8 = _0x5f23a0?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      if (!_0x2e10f8) return ![];
      if (_0x3fd2de(_0x2e10f8)) return (_0x2e10f8['pause']?.(), _0x325fa7(), !![]);
      const _0x565206 = getPersonReplacementShotCutTotalDuration(_0x42ecb2['draft']),
        _0x55318a = getPersonReplacementShotCutPositionAtTimelineSec(
          _0x42ecb2['draft'],
          _0x42ecb2['playheadSec'],
        ),
        _0x24c7fb = Math['max'](
          PERSON_REPLACEMENT_CUT_MIN_SEC,
          0x1 /
            Math['max'](
              0x1,
              Number(_0x42ecb2['draft'][_0x55318a['shotIndex']]?.['outputFps']) ||
                PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
            ),
        );
      _0x42ecb2['playheadSec'] >= _0x565206 - _0x24c7fb / 0x2 && (_0x42ecb2['playheadSec'] = 0x0);
      ((_0x42ecb2['hoverPreviewActive'] = ![]), (_0x42ecb2['hoverPreviewTimeSec'] = null), _0x234605());
      const _0xa055c6 = _0x5f23a0?.['querySelector']?.('[data-person-replacement-shot-cut-hover-playhead]');
      return (
        _0xa055c6 && ((_0xa055c6['hidden'] = !![]), _0xa055c6['classList']?.['remove']?.('is-visible')),
        _0x5be8fe(_0x42ecb2['playheadSec'], { autoplay: !![] })
      );
    },
    _0x39fe03 = (_0x72a729, _0x1119fd = 0x1) => {
      const _0x40c753 = getPersonReplacementShotCutPositionAtTimelineSec(
          _0x42ecb2['draft'],
          _0x42ecb2['playheadSec'],
        ),
        _0x6c8c28 = Math['max'](
          0x1,
          Number(_0x42ecb2['draft'][_0x40c753['shotIndex']]?.['outputFps']) ||
            PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
        );
      return _0x5be8fe(
        _0x42ecb2['playheadSec'] +
          ((Number(_0x72a729) < 0x0 ? -0x1 : 0x1) * Math['max'](0x1, Number(_0x1119fd) || 0x1)) / _0x6c8c28,
      );
    },
    _0xb17f7a = (_0x250332) => {
      if (!_0x42ecb2['isOpen'] || !_0x250332 || _0x42ecb2['boundaryDrag']) return;
      const _0x4d1e3f = _0x42ecb2['pendingPreviewSeek'],
        _0x53e9f5 = _0x4d1e3f?.['rangeId'] || _0x42ecb2['previewShotId'],
        _0x387a28 = _0x42ecb2['draft']['findIndex'](
          (_0x1df337) => normalizeText(_0x1df337?.['shotId']) === normalizeText(_0x53e9f5),
        ),
        _0x4753ed = _0x42ecb2['draft'][_0x387a28];
      if (!_0x4753ed) return;
      const _0xcce989 = Number(_0x250332['currentTime']);
      if (!Number['isFinite'](_0xcce989)) return;
      if (_0xcedf7c['isReverseActive']()) {
        _0x17b206['syncPlayhead']();
        return;
      }
      const _0x31539c = Math['max'](
        PERSON_REPLACEMENT_CUT_MIN_SEC,
        0x1 / Math['max'](0x1, Number(_0x4753ed['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS),
      );
      if (_0x4d1e3f) {
        if (Number(_0x4d1e3f['token']) !== _0x42ecb2['previewSeekToken']) return;
        if (_0x42ecb2['previewFrameReadyToken'] !== Number(_0x4d1e3f['token'])) return;
      }
      if (_0x42ecb2['hoverPreviewActive'] && _0x250332['paused'] !== ![]) return;
      if (_0xcce989 >= Number(_0x4753ed['endSec']) - _0x31539c / 0x2) {
        const _0xa0e3b1 = _0x42ecb2['draft'][_0x387a28 + 0x1];
        if (_0x250332['paused'] === ![] && _0xa0e3b1) {
          const _0x30ca15 = getPersonReplacementShotCutTimelineSec(
            _0x42ecb2['draft'],
            _0xa0e3b1['shotId'],
            _0xa0e3b1['startSec'],
          );
          _0x2ef093(_0xa0e3b1['shotId'], _0xa0e3b1['startSec'], { timelineSec: _0x30ca15, autoplay: !![] });
          return;
        }
        if (!_0xa0e3b1) {
          ((_0x42ecb2['playheadSec'] = getPersonReplacementShotCutTotalDuration(_0x42ecb2['draft'])),
            _0x250332['pause']?.(),
            _0x17b206['syncPlayhead']());
          return;
        }
      }
      ((_0x42ecb2['playheadSec'] = getPersonReplacementShotCutTimelineSec(
        _0x42ecb2['draft'],
        _0x4753ed['shotId'],
        _0xcce989,
      )),
        _0x17b206['syncPlayhead']());
    };
  return Object['freeze']({
    armFrameWait: _0x41e66b,
    cancelFrameWait: _0x3b1d0f,
    cancelHoverPreview: _0x234605,
    clearPreviewMetadata: _0x2f3904,
    isPlaybackActive: _0x3fd2de,
    markFrameReady: _0x2c55b6,
    preview: _0x2ef093,
    seekTimeline: _0x5be8fe,
    stepTimeline: _0x39fe03,
    stopPlayback: _0x325fa7,
    syncPlaybackFromVideo: _0xb17f7a,
    syncTimelinePosition: _0x221e2d,
    togglePlayback: _0x529a92,
  });
}
