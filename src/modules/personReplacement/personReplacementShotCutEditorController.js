import { captureVideoFrameSnapshot, waitForVideoFrame } from '../../components/videoFrameCapture.js';
import {
  countEditablePersonReplacementShotCuts,
  createPersonReplacementShotCutDraft,
  getPersonReplacementShotCutPositionAtTimelineSec,
} from './personReplacementShotCutModel.js';
import { hasSplittablePersonReplacementShotCut } from './personReplacementShotCutRendering.js';
import { togglePersonReplacementShotReverseAtTimelineSec } from './personReplacementShotReverse.js';
const PREVIEW_READY_TIMEOUT_MS = 0x7530;
function normalizeText(_0x1a8769) {
  return String(_0x1a8769 ?? '')['trim']();
}
function clone(_0x3be889) {
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(_0x3be889);
    } catch {}
  return JSON['parse'](JSON['stringify'](_0x3be889));
}
export function createPersonReplacementShotCutEditorController({
  session: _0xd6045,
  previewController: _0x1a8f72,
  mediaController: _0x4a756f,
  viewportController: _0xc991ca,
  getRoot: getRoot = () => null,
  getProject: getProject = () => ({}),
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis,
  isDestroyed: isDestroyed = () => ![],
  requestRender: requestRender = () => {},
  onShotKeyframeSelected: onShotKeyframeSelected = () => {},
  onShotReverseRequested: onShotReverseRequested = () => {},
  hideResultHistoryMenu: hideResultHistoryMenu = () => {},
  scrollShotCardIntoView: scrollShotCardIntoView = () => {},
} = {}) {
  if (!_0xd6045?.['workspaceState'] || !_0xd6045?.['playback'])
    throw new TypeError('Shot\x20cut\x20editor\x20requires\x20a\x20session.');
  if (!_0x1a8f72 || !_0x4a756f || !_0xc991ca)
    throw new TypeError('Shot cut editor requires preview, media, and viewport owners.');
  const _0x19622c = _0xd6045['workspaceState'],
    _0x38ee14 = _0xd6045['playback'],
    _0x47d446 = () => {
      _0xd6045['close']({ releaseBuffer: ![] });
    },
    _0x13fbe0 = (_0x369b2a, _0x54c138, _0x3fdbda = {}) => {
      const _0xaa79bc = onShotReverseRequested({
        ..._0x3fdbda,
        shotId: normalizeText(_0x369b2a),
        isReversed: _0x54c138 === !![],
      });
      return (_0xaa79bc?.['completion']?.['catch']?.(() => {}), _0xaa79bc);
    },
    _0x52ba39 = () => {
      const _0x19212c = getProject();
      for (const _0x3a9028 of _0x19622c['draft']) {
        const _0x27cbae = normalizeText(_0x3a9028?.['shotId']),
          _0x390c96 = normalizeText(_0x3a9028?.['originShotId']),
          _0x1d9c43 =
            _0x19212c['shots']['find']((_0x131c4c) => _0x131c4c['id'] === _0x27cbae) ||
            _0x19212c['shots']['find']((_0x74f0d4) => _0x74f0d4['id'] === _0x390c96);
        if (!_0x1d9c43 || Boolean(_0x1d9c43['isReversed']) === Boolean(_0x3a9028?.['isReversed'])) continue;
        _0x13fbe0(_0x1d9c43['id'], _0x3a9028?.['isReversed'] === !![]);
      }
    },
    _0x16a183 = () => {
      if (!_0x19622c['isOpen'] || _0xc991ca['isDraftMutationBusy']()) return ![];
      const _0x375f67 = { draft: clone(_0x19622c['draft']), undoStack: clone(_0x19622c['undoStack']) },
        _0xf3d719 = _0x19622c['playheadSec'],
        _0x38d6fb = getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-video]'),
        _0x1fa030 = _0x38ee14['isReverseActive']() || _0x38d6fb?.['paused'] === ![],
        _0x41d665 = togglePersonReplacementShotReverseAtTimelineSec(
          _0x19622c['draft'],
          _0x19622c['playheadSec'],
        );
      if (!_0x41d665 || !_0xc991ca['commitDraft'](_0x41d665['draft'])) return ![];
      _0x19622c['previewShotId'] = _0x41d665['position']['shotId'];
      try {
        _0x13fbe0(_0x41d665['position']['shotId'], _0x41d665['isReversed']);
      } catch (_0x12af28) {
        return (
          (_0x19622c['draft'] = _0x375f67['draft']),
          (_0x19622c['undoStack'] = _0x375f67['undoStack']),
          requestRender(),
          _0x1a8f72['seekTimeline'](_0xf3d719),
          windowObject?.['showToast']?.(_0x12af28?.['message'] || '视频倒放失败，请重试。', 'error'),
          ![]
        );
      }
      return (
        requestRender(),
        _0x1a8f72['seekTimeline'](_0xf3d719, { autoplay: _0x1fa030 }),
        windowObject?.['showToast']?.(_0x41d665['message'], 'success'),
        !![]
      );
    },
    _0xca2f56 = () => {
      if (!_0x19622c['isOpen'] || _0xc991ca['isDraftMutationBusy']()) return ![];
      if (!_0xd6045['splitAtPlayhead']())
        return (windowObject?.['showToast']?.('请把播放头放在片段中间再裁剪。', 'warn'), ![]);
      const _0x5517ea = getPersonReplacementShotCutPositionAtTimelineSec(
        _0x19622c['draft'],
        _0x19622c['playheadSec'],
      );
      return (
        (_0x19622c['previewShotId'] = _0x5517ea['shotId']),
        requestRender(),
        _0x1a8f72['preview'](_0x5517ea['shotId'], _0x5517ea['sourceTimeSec'], {
          timelineSec: _0x19622c['playheadSec'],
        }),
        !![]
      );
    },
    _0x1f946f = () => {
      if (!_0x19622c['isOpen'] || _0xc991ca['isDraftMutationBusy']()) return ![];
      if (!_0xd6045['mergeSelectedRanges']()) return ![];
      const _0x5c2923 = _0x19622c['draft']['find'](
        (_0x5e1286) => normalizeText(_0x5e1286?.['shotId']) === normalizeText(_0x19622c['previewShotId']),
      );
      return (
        requestRender(),
        _0x5c2923 &&
          _0x1a8f72['preview'](_0x5c2923['shotId'], _0x5c2923['startSec'], {
            timelineSec: _0x19622c['playheadSec'],
          }),
        !![]
      );
    },
    _0x1c6901 = async () => {
      if (!_0x19622c['isOpen'] || _0xc991ca['isBusy']() || _0x19622c['isKeyframeCapturing']) return ![];
      const _0x31e221 = getPersonReplacementShotCutPositionAtTimelineSec(
          _0x19622c['draft'],
          _0x19622c['playheadSec'],
        ),
        _0x2e51cd = _0x19622c['draft'][_0x31e221['shotIndex']],
        _0x44ed54 = getRoot(),
        _0x1a1cbc = _0x44ed54?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      if (!_0x2e51cd || !_0x1a1cbc)
        return (windowObject?.['showToast']?.('当前片段画面不可用。', 'warn'), ![]);
      const _0x44aad0 = getProject(),
        _0x3dc364 = {
          projectId: normalizeText(_0x44aad0['id']),
          rangeId: normalizeText(_0x2e51cd['shotId']),
          originRangeId: normalizeText(_0x2e51cd['originShotId'] || _0x2e51cd['shotId']),
          sourceId: normalizeText(_0x2e51cd['sourceId']),
          sourceTimeSec: _0x31e221['sourceTimeSec'],
          timelineSec: _0x31e221['timelineSec'],
          seekToken: _0x19622c['previewSeekToken'],
          video: _0x1a1cbc,
        };
      if (
        _0x19622c['pendingPreviewSeek'] ||
        _0x19622c['previewFrameReadyToken'] !== _0x3dc364['seekToken'] ||
        _0x1a1cbc['seeking'] === !![] ||
        Math['abs'](Number(_0x1a1cbc['currentTime']) - _0x3dc364['sourceTimeSec']) > 0.04
      )
        return (windowObject?.['showToast']?.('当前画面仍在定位，请稍后再获取关键帧。', 'info'), ![]);
      _0x19622c['isKeyframeCapturing'] = !![];
      const _0x432c53 =
        _0x44ed54?.['querySelectorAll']?.(
          [
            "[data-person-replacement-action='capture-shot-keyframe']",
            "[data-person-replacement-action='split-shot-cut']",
            '[data-person-replacement-action=\x27toggle-shot-cut-reverse\x27]',
            '[data-person-replacement-action=\x27merge-shot-cuts\x27]',
            "[data-person-replacement-action='undo-shot-cut']",
            '[data-person-replacement-action=\x27reset-shot-cuts\x27]',
            "[data-person-replacement-action='cancel-shot-cuts']",
            "[data-person-replacement-action='confirm-shot-cuts']",
          ]['join'](',\x20'),
        ) || [];
      _0x432c53['forEach']((_0x4daf3a) => _0x4daf3a['setAttribute']('disabled', ''));
      const _0x263e27 = _0x44ed54?.['querySelector']?.(
        '[data-person-replacement-action=\x27capture-shot-keyframe\x27]',
      );
      (_0x263e27?.['setAttribute']?.('aria-busy', 'true'), _0x263e27?.['classList']?.['add']?.('is-loading'));
      try {
        const _0x30447f = await waitForVideoFrame(_0x1a1cbc, { timeoutMs: 0x2710 });
        if (!_0x30447f) throw new Error('当前视频画面尚未加载完成');
        const _0x36cdbd = await captureVideoFrameSnapshot(_0x1a1cbc, {
            type: 'image/png',
            fileNamePrefix: 'person_replacement_' + (normalizeText(_0x2e51cd['shotId']) || 'shot'),
          }),
          _0x1df722 = windowObject?.['File'] || globalThis['File'];
        let _0x595024 = _0x36cdbd['blob'];
        if (typeof _0x1df722 === 'function')
          _0x595024 = new _0x1df722([_0x36cdbd['blob']], _0x36cdbd['fileName'], {
            type: _0x36cdbd['type'] || 'image/png',
          });
        else
          try {
            Object['defineProperty'](_0x595024, 'name', { configurable: !![], value: _0x36cdbd['fileName'] });
          } catch {}
        const _0x306542 = await onShotKeyframeSelected(_0x595024, {
            shotId: _0x3dc364['rangeId'],
            originShotId: _0x3dc364['originRangeId'],
            keyframeTimeSec: _0x3dc364['sourceTimeSec'],
            frame: { width: _0x36cdbd['width'], height: _0x36cdbd['height'] },
          }),
          _0x130da1 = normalizeText(
            _0x306542?.['keyframeRef'] ||
              _0x306542?.['localPath'] ||
              _0x306542?.['imageUrl'] ||
              _0x306542?.['url'] ||
              _0x306542,
          );
        if (!_0x130da1) throw new Error('关键帧保存结果缺少可用地址');
        if (
          !_0x19622c['isOpen'] ||
          normalizeText(getProject()['id']) !== _0x3dc364['projectId'] ||
          getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-video]') !== _0x3dc364['video']
        )
          return ![];
        const _0x4438cf = _0x19622c['draft']['find'](
          (_0x19d459) => normalizeText(_0x19d459?.['shotId']) === _0x3dc364['rangeId'],
        );
        if (!_0x4438cf || normalizeText(_0x4438cf['sourceId']) !== _0x3dc364['sourceId']) return ![];
        return (
          _0xc991ca['commitDraft'](
            _0x19622c['draft']['map']((_0x3426df) =>
              normalizeText(_0x3426df?.['shotId']) === _0x3dc364['rangeId']
                ? {
                    ..._0x3426df,
                    keyframeRef: _0x130da1,
                    keyframeTimeSec: _0x3dc364['sourceTimeSec'],
                    keyframeManuallySelected: !![],
                    frame: { width: _0x36cdbd['width'], height: _0x36cdbd['height'] },
                  }
                : _0x3426df,
            ),
          ),
          (_0x19622c['previewShotId'] = _0x3dc364['rangeId']),
          (_0x19622c['playheadSec'] = _0x3dc364['timelineSec']),
          (_0x19622c['isKeyframeCapturing'] = ![]),
          windowObject?.['showToast']?.('已将当前关键帧设为该片段的替换帧，应用切口后生效。', 'success'),
          requestRender(),
          _0x1a8f72['preview'](_0x3dc364['rangeId'], _0x3dc364['sourceTimeSec'], {
            timelineSec: _0x3dc364['timelineSec'],
          }),
          !![]
        );
      } catch (_0x2adfea) {
        return (
          windowObject?.['showToast']?.(_0x2adfea?.['message'] || '获取关键帧失败，请重试。', 'error'),
          ![]
        );
      } finally {
        _0x19622c['isKeyframeCapturing'] && ((_0x19622c['isKeyframeCapturing'] = ![]), requestRender());
      }
    },
    _0x4fc1f1 = () => _0xd6045['clearMotionTimer'](),
    _0x370aed = () => _0xd6045['stopBoundaryDrag'](),
    _0x2e0b22 = (_0x335d89, _0x486003) => {
      (_0x4fc1f1(),
        (_0x19622c['motionTimer'] =
          windowObject?.['setTimeout']?.(() => {
            _0x19622c['motionTimer'] = 0x0;
            if (_0x19622c['motion'] !== _0x335d89) return;
            _0x486003();
          }, 0x230) || 0x0));
    },
    _0x408f2c = (_0x2b63f3) => {
      _0x47d446();
      const _0x1a9cde = getProject();
      return (
        _0xd6045['open'](_0x1a9cde, _0x2b63f3),
        (_0x19622c['isOpen'] = !![]),
        (_0x19622c['motion'] = 'to-editor'),
        (_0x19622c['draft'] = _0x2b63f3),
        (_0x19622c['initialDraft'] = clone(_0x2b63f3)),
        (_0x19622c['previewShotId'] =
          _0x1a9cde['workspace']['selectedShotId'] || _0x2b63f3[0x0]?.['shotId'] || ''),
        requestRender(),
        _0x1a8f72['preview'](
          _0x19622c['previewShotId'],
          _0x2b63f3['find']((_0x44f0e7) => _0x44f0e7['shotId'] === _0x19622c['previewShotId'])?.['startSec'],
        ),
        _0x2e0b22('to-editor', () => {
          _0x19622c['motion'] = '';
          if (_0x19622c['isOpen']) {
            const _0x53949e = getRoot()?.['querySelector']?.('[data-person-replacement-shot-timeline-stage]'),
              _0x44319c = _0x53949e?.['querySelector']?.('.person-replacement-shot-timeline-cube');
            (_0x53949e?.['classList']?.['remove']?.('is-animating'),
              _0x53949e?.['classList']?.['add']?.('is-settled'),
              _0x44319c?.['classList']?.['remove']?.('is-flipping-to-editor'));
            const _0x5581e2 = getPersonReplacementShotCutPositionAtTimelineSec(
              _0x19622c['draft'],
              _0x19622c['playheadSec'],
            );
            _0x5581e2['shotIndex'] >= 0x0 &&
              _0x1a8f72['preview'](_0x5581e2['shotId'], _0x5581e2['sourceTimeSec'], {
                timelineSec: _0x19622c['playheadSec'],
              });
          }
        }),
        !![]
      );
    },
    _0x4a1e5d = (_0x4090bb) =>
      Boolean(
        _0x4090bb &&
        !_0x4090bb['error'] &&
        _0x4090bb['seeking'] !== !![] &&
        Number(_0x4090bb['readyState']) >= 0x2 &&
        normalizeText(_0x4090bb['currentSrc'] || _0x4090bb['getAttribute']?.('src') || _0x4090bb['src']),
      ),
    _0x2c1fb9 = () => {
      const _0x2bf683 = getProject(),
        _0x2b7a58 = createPersonReplacementShotCutDraft(_0x2bf683);
      if (
        !_0x2b7a58['length'] ||
        (!countEditablePersonReplacementShotCuts(_0x2b7a58) &&
          !hasSplittablePersonReplacementShotCut(_0x2b7a58))
      )
        return (windowObject?.['showToast']?.('当前时间轴没有可调整或新增的切口。', 'warn'), ![]);
      if (_0x19622c['isOpening']) return ![];
      const _0x339d0e = Boolean(documentObject?.['defaultView']?.['HTMLVideoElement']),
        _0x274f74 = _0x4a756f['preparePreviewVideo']();
      if (!_0x339d0e) return _0x408f2c(_0x2b7a58);
      if (!_0x274f74 || !_0x19622c['bufferedVideo'])
        return (windowObject?.['showToast']?.('当前视频片段尚未准备完成。', 'warn'), ![]);
      if (_0x4a1e5d(_0x19622c['bufferedVideo'])) return _0x408f2c(_0x2b7a58);
      return ((_0x19622c['isOpening'] = !![]), requestRender(), ![]);
    },
    _0x49d231 = () => {
      (_0x19622c['openingCleanup']?.(), (_0x19622c['openingCleanup'] = null));
      if (!_0x19622c['isOpening']) return ![];
      _0x4a756f['preparePreviewVideo']();
      const _0x3db5aa = _0x19622c['bufferedVideo'];
      if (!_0x3db5aa) return ![];
      const _0x464c48 = ['loadeddata', 'canplay', 'canplaythrough', 'seeked', 'progress'];
      let _0x42ce39 = 0x0;
      const _0x3a8003 = () => {
          (_0x42ce39 && (windowObject?.['clearTimeout']?.(_0x42ce39), (_0x42ce39 = 0x0)),
            _0x464c48['forEach']((_0x1ad312) => {
              _0x3db5aa['removeEventListener']?.(_0x1ad312, _0x554d2a);
            }),
            _0x3db5aa['removeEventListener']?.('error', _0x46575e),
            _0x3db5aa['removeEventListener']?.('abort', _0x46575e));
        },
        _0x554d2a = () => {
          if (!_0x19622c['isOpening'] || _0x3db5aa !== _0x19622c['bufferedVideo'] || !_0x4a1e5d(_0x3db5aa))
            return;
          (_0x3a8003(),
            (_0x19622c['openingCleanup'] = null),
            (_0x19622c['isOpening'] = ![]),
            Promise['resolve']()['then'](() => {
              if (!isDestroyed() && !_0x19622c['isOpen']) _0x2c1fb9();
            }));
        },
        _0x46575e = () => {
          if (!_0x19622c['isOpening'] || _0x3db5aa !== _0x19622c['bufferedVideo']) return;
          (_0x3a8003(),
            (_0x19622c['openingCleanup'] = null),
            (_0x19622c['isOpening'] = ![]),
            _0x4a756f['releaseBufferedVideo'](),
            requestRender(),
            windowObject?.['showToast']?.('裁剪预览视频加载失败，请稍后重试。', 'warn'));
        };
      return (
        _0x464c48['forEach']((_0x1ff6f2) => {
          _0x3db5aa['addEventListener']?.(_0x1ff6f2, _0x554d2a);
        }),
        _0x3db5aa['addEventListener']?.('error', _0x46575e),
        _0x3db5aa['addEventListener']?.('abort', _0x46575e),
        (_0x42ce39 = windowObject?.['setTimeout']?.(_0x46575e, PREVIEW_READY_TIMEOUT_MS) || 0x0),
        (_0x19622c['openingCleanup'] = _0x3a8003),
        _0x554d2a(),
        !![]
      );
    },
    _0x1928c8 = ({ animate: animate = !![], renderWorkspace: renderWorkspace = !![] } = {}) => {
      if (_0x19622c['isOpening']) {
        _0x47d446();
        if (renderWorkspace) requestRender();
        return !![];
      }
      if (!_0x19622c['isOpen'] && !_0x19622c['motion']) return ![];
      (_0x370aed(), _0x4fc1f1());
      if (!animate) {
        (_0x47d446(), hideResultHistoryMenu());
        if (renderWorkspace) requestRender();
        return !![];
      }
      _0x19622c['motion'] = 'to-timeline';
      if (renderWorkspace) requestRender();
      return (
        _0x2e0b22('to-timeline', () => {
          (_0x47d446(),
            renderWorkspace &&
              (requestRender(), scrollShotCardIntoView(getProject()['workspace']['selectedShotId'])));
        }),
        !![]
      );
    };
  return Object['freeze']({
    captureKeyframeAtPlayhead: _0x1c6901,
    close: _0x1928c8,
    mergeSelected: _0x1f946f,
    open: _0x2c1fb9,
    requestReverseChange: _0x13fbe0,
    reset: _0x47d446,
    splitAtPlayhead: _0xca2f56,
    syncReverseDraftToProject: _0x52ba39,
    toggleReverse: _0x16a183,
    watchOpeningVideo: _0x49d231,
  });
}
