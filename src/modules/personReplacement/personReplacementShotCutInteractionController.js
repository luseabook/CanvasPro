import { getMediaClipTimelineRangeRect } from '../../components/media-clip/mediaClipTimelineModel.js';
import { formatDurationLabel } from '../../components/media-clip/mediaClipUtils.js';
import {
  PERSON_REPLACEMENT_CUT_MIN_SEC,
  createPersonReplacementShotCutUpdateRequest,
  getPersonReplacementShotCutDisplayDuration,
  getPersonReplacementShotCutPositionAtTimelineSec,
  getPersonReplacementShotCutTotalDuration,
  hasPersonReplacementShotCutUpdateChanges,
} from './personReplacementShotCutModel.js';
function normalizeText(_0x29aa87, _0x9cfd61 = '') {
  const _0x1a67aa = String(_0x29aa87 ?? '')['trim']();
  return _0x1a67aa || _0x9cfd61;
}
function clone(_0x52d0c9) {
  return _0x52d0c9 && typeof _0x52d0c9 === 'object' ? JSON['parse'](JSON['stringify'](_0x52d0c9)) : _0x52d0c9;
}
function clamp(_0x34b78c, _0x4b61c1, _0x44bc7f, _0x174ba9 = _0x4b61c1) {
  const _0x25d49b = Number(_0x34b78c);
  return Number['isFinite'](_0x25d49b)
    ? Math['min'](_0x44bc7f, Math['max'](_0x4b61c1, _0x25d49b))
    : _0x174ba9;
}
export function createPersonReplacementShotCutInteractionController({
  session: _0x1dad05,
  previewController: _0x1f3b8c,
  viewportController: _0x3ceefc,
  editorController: _0x14aa8e,
  getRoot: getRoot = () => null,
  getProject: getProject = () => ({}),
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis,
  isDestroyed: isDestroyed = () => ![],
  requestRender: requestRender = () => {},
  onShotCutDetectionRequested: onShotCutDetectionRequested = null,
  onShotCutRangesRequested: onShotCutRangesRequested = null,
  runRequest: runRequest = (_0x4571e9, _0x4ed059) => _0x4571e9?.(_0x4ed059),
  updateSmartClipSettings: updateSmartClipSettings = () => {},
} = {}) {
  if (!_0x1dad05?.['workspaceState'])
    throw new TypeError('Shot\x20cut\x20interactions\x20require\x20a\x20session.');
  if (!_0x1f3b8c || !_0x3ceefc || !_0x14aa8e)
    throw new TypeError('Shot cut interactions require preview, viewport, and editor owners.');
  const _0x4bda5c = _0x1dad05['workspaceState'],
    _0x54d598 = (_0x77fe17, _0x5e0834) => {
      const _0x51fae9 = _0x5e0834?.['getBoundingClientRect']?.(),
        _0x2c9501 = Number(_0x51fae9?.['width']);
      if (!(_0x2c9501 > 0x0)) return _0x4bda5c['playheadSec'];
      const _0x4274ac = getPersonReplacementShotCutDisplayDuration(_0x4bda5c['draft']),
        _0x20fab1 = clamp(
          (Number(_0x77fe17?.['clientX']) - Number(_0x51fae9?.['left'] || 0x0)) / _0x2c9501,
          0x0,
          0x1,
          0x0,
        );
      return clamp(
        _0x20fab1 * _0x4274ac,
        0x0,
        getPersonReplacementShotCutTotalDuration(_0x4bda5c['draft']),
        _0x4bda5c['playheadSec'],
      );
    },
    _0x6c0a37 = () => {
      if (
        _0x4bda5c['isKeyframeCapturing'] ||
        _0x4bda5c['hoverPreviewRaf'] ||
        !_0x4bda5c['hoverPreviewActive']
      )
        return;
      const _0x53dab8 = () => {
          _0x4bda5c['hoverPreviewRaf'] = 0x0;
          if (_0x4bda5c['isKeyframeCapturing'] || !_0x4bda5c['hoverPreviewActive'] || !_0x4bda5c['isOpen'])
            return;
          const _0x33cb93 = getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
          if (_0x1f3b8c['isPlaybackActive'](_0x33cb93)) return;
          const _0x3e856c = Number(_0x4bda5c['hoverPreviewRequest']);
          if (!Number['isFinite'](_0x3e856c)) return;
          const _0x1b555a = getPersonReplacementShotCutPositionAtTimelineSec(_0x4bda5c['draft'], _0x3e856c);
          if (_0x1b555a['shotIndex'] < 0x0) return;
          _0x1f3b8c['preview'](_0x1b555a['shotId'], _0x1b555a['sourceTimeSec'], {
            timelineSec: _0x1b555a['timelineSec'],
            hover: !![],
          });
        },
        _0x3a1229 = windowObject?.['requestAnimationFrame'] || globalThis['requestAnimationFrame'];
      typeof _0x3a1229 === 'function'
        ? (_0x4bda5c['hoverPreviewRaf'] = _0x3a1229(_0x53dab8))
        : (_0x4bda5c['hoverPreviewRaf'] = windowObject?.['setTimeout']?.(_0x53dab8, 0x10) || 0x0);
    },
    _0x27e8be = (_0x48401f) => {
      const _0x3f404a = getRoot(),
        _0x56bcc6 = _0x48401f?.['target']?.['closest']?.('[data-person-replacement-shot-cut-timeline]'),
        _0x36bbeb = _0x3f404a?.['querySelector']?.('[data-person-replacement-shot-cut-hover-playhead]');
      if (_0x4bda5c['boundaryDrag'] || _0x4bda5c['isKeyframeCapturing'])
        return (
          (_0x4bda5c['hoverPreviewActive'] = ![]),
          (_0x4bda5c['hoverPreviewTimeSec'] = null),
          _0x1f3b8c['cancelHoverPreview'](),
          _0x36bbeb && ((_0x36bbeb['hidden'] = !![]), _0x36bbeb['classList']?.['remove']?.('is-visible')),
          ![]
        );
      if (!_0x4bda5c['isOpen'] || !_0x56bcc6 || !_0x36bbeb)
        return (
          _0x36bbeb && ((_0x36bbeb['hidden'] = !![]), _0x36bbeb['classList']?.['remove']?.('is-visible')),
          ![]
        );
      const _0x10f706 = _0x54d598(_0x48401f, _0x56bcc6),
        _0x56a056 = getPersonReplacementShotCutDisplayDuration(_0x4bda5c['draft']);
      ((_0x36bbeb['hidden'] = ![]),
        _0x36bbeb['style']?.['setProperty']?.(
          'left',
          (_0x56a056 > 0x0 ? (_0x10f706 / _0x56a056) * 0x64 : 0x0) + '%',
        ),
        _0x36bbeb['classList']?.['add']?.('is-visible'),
        (_0x4bda5c['hoverPreviewActive'] = !![]),
        (_0x4bda5c['hoverPreviewTimeSec'] = _0x10f706));
      const _0x268813 = _0x3f404a?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      return (
        !_0x1f3b8c['isPlaybackActive'](_0x268813) &&
          ((_0x4bda5c['hoverPreviewRequest'] = _0x10f706), _0x6c0a37()),
        !![]
      );
    },
    _0x3c3e82 = (_0x381648) => {
      const _0x134fda = getRoot(),
        _0x41179c = _0x381648?.['target']?.['closest']?.('[data-person-replacement-shot-cut-timeline]');
      if (_0x41179c && _0x381648?.['relatedTarget'] && _0x41179c['contains']?.(_0x381648['relatedTarget']))
        return ![];
      const _0x50d771 = _0x134fda?.['querySelector']?.('[data-person-replacement-shot-cut-hover-playhead]');
      if (_0x4bda5c['boundaryDrag'])
        return (
          (_0x4bda5c['hoverPreviewActive'] = ![]),
          (_0x4bda5c['hoverPreviewTimeSec'] = null),
          _0x1f3b8c['cancelHoverPreview'](),
          _0x50d771 && ((_0x50d771['hidden'] = !![]), _0x50d771['classList']?.['remove']?.('is-visible')),
          ![]
        );
      const _0x40bbb6 = _0x4bda5c['hoverPreviewActive'];
      ((_0x4bda5c['hoverPreviewActive'] = ![]),
        (_0x4bda5c['hoverPreviewTimeSec'] = null),
        _0x1f3b8c['cancelHoverPreview']());
      _0x50d771 && ((_0x50d771['hidden'] = !![]), _0x50d771['classList']?.['remove']?.('is-visible'));
      const _0x4a62aa = _0x134fda?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      if (_0x40bbb6 && _0x4a62aa?.['paused'] !== ![]) {
        const _0x123bd4 = getPersonReplacementShotCutPositionAtTimelineSec(
          _0x4bda5c['draft'],
          _0x4bda5c['playheadSec'],
        );
        _0x123bd4['shotIndex'] >= 0x0 &&
          _0x1f3b8c['preview'](_0x123bd4['shotId'], _0x123bd4['sourceTimeSec'], {
            timelineSec: _0x4bda5c['playheadSec'],
          });
      }
      return Boolean(_0x50d771 || _0x40bbb6);
    },
    _0x4ca8bf = (_0x3199d6 = null) => {
      const _0x19b5b0 = getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-track]');
      if (!_0x19b5b0) return;
      const _0x1e5d99 = getPersonReplacementShotCutTotalDuration(_0x4bda5c['draft']);
      let _0x56c3d8 = 0x0;
      (_0x4bda5c['draft']['forEach']((_0x532271, _0x389efa) => {
        const _0xb4a1d0 = Math['max'](
            PERSON_REPLACEMENT_CUT_MIN_SEC,
            Number(_0x532271['durationSec']) || 0x0,
          ),
          _0x4330ff = getMediaClipTimelineRangeRect({
            startSec: _0x56c3d8,
            endSec: _0x56c3d8 + _0xb4a1d0,
            durationSec: _0x1e5d99,
            minWidthPct: 0x0,
          }),
          _0x28c0a2 = _0x19b5b0['querySelector']?.(
            '[data-person-replacement-cut-shot-index="' + _0x389efa + '\x22]',
          );
        (_0x28c0a2?.['style']?.['setProperty']?.('left', _0x4330ff['leftPct'] + '%'),
          _0x28c0a2?.['style']?.['setProperty']?.('width', _0x4330ff['widthPct'] + '%'),
          (_0x56c3d8 += _0xb4a1d0));
        const _0x577928 = _0x28c0a2?.['querySelector']?.(
          '[data-person-replacement-cut-duration="' + _0x389efa + '\x22]',
        );
        _0x577928 && (_0x577928['textContent'] = formatDurationLabel(_0xb4a1d0));
      }),
        _0x19b5b0['querySelectorAll']?.('[data-person-replacement-cut-boundary-index]')?.['forEach']?.(
          (_0x2e3fef) => {
            const _0x5eb882 = Math['trunc'](
                Number(_0x2e3fef['dataset']?.['personReplacementCutBoundaryIndex']),
              ),
              _0x2efba6 = _0x4bda5c['draft'][_0x5eb882];
            if (!(_0x5eb882 > 0x0) || !_0x2efba6) return;
            (_0x2e3fef['classList']?.['toggle']?.('is-dragging', _0x5eb882 === _0x3199d6),
              _0x2e3fef['setAttribute']?.('aria-valuenow', _0x2efba6['startSec']['toFixed'](0x4)));
          },
        ),
        _0x3ceefc['syncPlayhead']());
    },
    _0x3fdcc4 = (
      _0x1445c8,
      _0x284621,
      {
        preview: preview = !![],
        active: active = null,
        recordHistory: recordHistory = !![],
        preservePlayhead: preservePlayhead = ![],
      } = {},
    ) => {
      const _0x3bb349 = Math['trunc'](Number(_0x1445c8)),
        _0x14058a = _0x4bda5c['draft'][_0x3bb349]?.['startSec'],
        _0x39cf7c = _0x1dad05['moveBoundary'](_0x3bb349, _0x284621, { recordHistory: recordHistory }),
        _0x39b667 = _0x4bda5c['draft'][_0x3bb349];
      if (!_0x39cf7c || !_0x39b667 || _0x39b667['startSec'] === _0x14058a) return (_0x4ca8bf(active), ![]);
      return (
        _0x4ca8bf(active),
        preview &&
          _0x1f3b8c['preview'](_0x39b667['shotId'], _0x39b667['startSec'], {
            preservePlayhead: preservePlayhead,
          }),
        !![]
      );
    },
    _0x3f0756 = (_0x2c75fd, _0x246176, _0x50ec31) => {
      const _0x31d3af = Math['trunc'](Number(_0x246176)),
        _0x3286d3 = _0x50ec31?.['getBoundingClientRect']?.(),
        _0x10c0d3 = Number(_0x3286d3?.['width']);
      if (!(_0x10c0d3 > 0x0)) return _0x4bda5c['draft'][_0x31d3af]?.['startSec'];
      const _0x6e6059 = getPersonReplacementShotCutDisplayDuration(_0x4bda5c['draft']);
      let _0x5b0552 = _0x31d3af - 0x1;
      while (
        _0x5b0552 > 0x0 &&
        _0x4bda5c['draft'][_0x5b0552 - 0x1]?.['sourceId'] === _0x4bda5c['draft'][_0x31d3af]?.['sourceId']
      ) {
        _0x5b0552 -= 0x1;
      }
      const _0x441964 = _0x4bda5c['draft']
          ['slice'](0x0, _0x5b0552)
          ['reduce']((_0x5947f1, _0x3d1aba) => _0x5947f1 + _0x3d1aba['durationSec'], 0x0),
        _0x34f480 = Number(_0x4bda5c['draft'][_0x5b0552]?.['startSec']) || 0x0,
        _0x3c8cbf = clamp(
          (Number(_0x2c75fd?.['clientX']) - Number(_0x3286d3['left'] || 0x0)) / _0x10c0d3,
          0x0,
          0x1,
          0x0,
        );
      return _0x34f480 + _0x3c8cbf * _0x6e6059 - _0x441964;
    },
    _0x1c50bd = (_0x35d392, _0xbb36bd) => {
      if (!_0x4bda5c['isOpen'] || _0x3ceefc['isDraftMutationBusy']() || !_0xbb36bd) return ![];
      const _0x5eb6d6 = Math['trunc'](Number(_0xbb36bd['dataset']?.['personReplacementCutBoundaryIndex'])),
        _0x9be9d4 = _0xbb36bd['closest']?.('[data-person-replacement-shot-cut-track]');
      if (!(_0x5eb6d6 > 0x0) || !_0x9be9d4) return ![];
      _0x35d392['preventDefault']?.();
      try {
        _0xbb36bd['focus']?.({ preventScroll: !![] });
      } catch {
        _0xbb36bd['focus']?.();
      }
      (_0x1dad05['stopBoundaryDrag'](),
        (_0x4bda5c['hoverPreviewActive'] = ![]),
        (_0x4bda5c['hoverPreviewTimeSec'] = null),
        _0x1f3b8c['cancelHoverPreview']());
      const _0xef51da = getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-hover-playhead]');
      _0xef51da && ((_0xef51da['hidden'] = !![]), _0xef51da['classList']?.['remove']?.('is-visible'));
      (_0xbb36bd['classList']?.['add']?.('is-dragging'),
        documentObject?.['body']?.['classList']?.['add']?.('person-replacement-cut-resizing'));
      try {
        _0xbb36bd['setPointerCapture']?.(_0x35d392['pointerId']);
      } catch {}
      const _0x38d4a2 = (_0x2ede98) => {
          _0x2ede98['preventDefault']?.();
          const _0x454bd7 = _0x3fdcc4(_0x5eb6d6, _0x3f0756(_0x2ede98, _0x5eb6d6, _0x9be9d4), {
            active: _0x5eb6d6,
            recordHistory: !_0x4bda5c['boundaryDrag']?.['historyCaptured'],
            preservePlayhead: !![],
          });
          if (_0x454bd7 && _0x4bda5c['boundaryDrag']) _0x4bda5c['boundaryDrag']['historyCaptured'] = !![];
        },
        _0x315aad = (_0x3da676) => {
          (_0x3da676?.['preventDefault']?.(), _0x1dad05['stopBoundaryDrag'](), _0x4ca8bf());
        },
        _0x52afa2 = () => {
          (windowObject?.['removeEventListener']?.('pointermove', _0x38d4a2, !![]),
            windowObject?.['removeEventListener']?.('pointerup', _0x315aad, !![]),
            windowObject?.['removeEventListener']?.('pointercancel', _0x315aad, !![]));
          try {
            _0xbb36bd['releasePointerCapture']?.(_0x35d392['pointerId']);
          } catch {}
          _0xbb36bd['classList']?.['remove']?.('is-dragging');
        };
      return (
        (_0x4bda5c['boundaryDrag'] = { boundaryIndex: _0x5eb6d6, cleanup: _0x52afa2, historyCaptured: ![] }),
        windowObject?.['addEventListener']?.('pointermove', _0x38d4a2, !![]),
        windowObject?.['addEventListener']?.('pointerup', _0x315aad, !![]),
        windowObject?.['addEventListener']?.('pointercancel', _0x315aad, !![]),
        _0x38d4a2(_0x35d392),
        !![]
      );
    },
    _0x55d711 = () => {
      if (!_0x4bda5c['isOpen'] || _0x3ceefc['isDraftMutationBusy']()) return ![];
      if (!_0x1dad05['resetDraft']()) return ![];
      try {
        _0x14aa8e['syncReverseDraftToProject']();
      } catch (_0xad76d6) {
        return (
          windowObject?.['showToast']?.(_0xad76d6?.['message'] || '重置倒放状态失败，请重试。', 'error'),
          ![]
        );
      }
      const _0x4e6e15 = getProject();
      return (
        (_0x4bda5c['previewShotId'] =
          _0x4e6e15['workspace']['selectedShotId'] || _0x4bda5c['draft'][0x0]?.['shotId'] || ''),
        requestRender(),
        _0x1f3b8c['preview'](
          _0x4bda5c['previewShotId'],
          _0x4bda5c['draft']['find']((_0x46994c) => _0x46994c['shotId'] === _0x4bda5c['previewShotId'])?.[
            'startSec'
          ],
        ),
        !![]
      );
    },
    _0x38882a = () => {
      if (!_0x4bda5c['isOpen'] || _0x3ceefc['isDraftMutationBusy']()) return ![];
      if (!_0x1dad05['undo']()) return ![];
      try {
        _0x14aa8e['syncReverseDraftToProject']();
      } catch (_0x2a75e0) {
        return (
          windowObject?.['showToast']?.(_0x2a75e0?.['message'] || '撤回倒放状态失败，请重试。', 'error'),
          ![]
        );
      }
      const _0x10834a = getPersonReplacementShotCutTotalDuration(_0x4bda5c['draft']);
      _0x4bda5c['playheadSec'] = clamp(_0x4bda5c['playheadSec'], 0x0, _0x10834a, 0x0);
      const _0x2ca0c4 = getPersonReplacementShotCutPositionAtTimelineSec(
        _0x4bda5c['draft'],
        _0x4bda5c['playheadSec'],
      );
      return (
        (_0x4bda5c['previewShotId'] = _0x2ca0c4['shotId'] || _0x4bda5c['draft'][0x0]?.['shotId'] || ''),
        requestRender(),
        _0x2ca0c4['shotIndex'] >= 0x0 &&
          _0x1f3b8c['preview'](_0x2ca0c4['shotId'], _0x2ca0c4['sourceTimeSec'], {
            timelineSec: _0x2ca0c4['timelineSec'],
          }),
        !![]
      );
    },
    _0x4d3344 = () => {
      if (
        !_0x4bda5c['isOpen'] ||
        _0x3ceefc['isDraftMutationBusy']() ||
        typeof onShotCutDetectionRequested !== 'function'
      )
        return ![];
      ((_0x4bda5c['isSmartDetectOpen'] = ![]), (_0x4bda5c['isSmartDetecting'] = !![]));
      const _0x59699a = ++_0x4bda5c['smartDetectionToken'],
        _0x750c71 = normalizeText(getProject()['id']),
        _0x15a127 = () =>
          !isDestroyed() &&
          _0x4bda5c['isOpen'] &&
          _0x59699a === _0x4bda5c['smartDetectionToken'] &&
          normalizeText(getProject()['id']) === _0x750c71;
      requestRender();
      let _0x869135;
      try {
        const _0x272ae1 = getProject();
        _0x869135 = onShotCutDetectionRequested(
          { mode: _0x272ae1['settings']['smartClipMode'], fps: _0x272ae1['settings']['smartClipFps'] },
          { project: clone(_0x272ae1) },
        );
      } catch (_0x132922) {
        _0x869135 = Promise['reject'](_0x132922);
      }
      return (
        Promise['resolve'](_0x869135)
          ['then']((_0x33a473) => {
            if (!_0x15a127()) return;
            const _0x2af3e0 = Array['isArray'](_0x33a473?.['ranges']) ? _0x33a473['ranges'] : [];
            if (!_0x2af3e0['length']) throw new Error('智能检测未返回可用切口');
            const _0x2aedde = _0x3ceefc['commitDraft'](_0x2af3e0);
            ((_0x4bda5c['isSmartDetecting'] = ![]), (_0x4bda5c['isSmartDetectOpen'] = ![]));
            if (!_0x2aedde) {
              (requestRender(), windowObject?.['showToast']?.('智能检测结果与当前切口一致。', 'info'));
              return;
            }
            ((_0x4bda5c['playheadSec'] = 0x0),
              (_0x4bda5c['previewShotId'] = _0x2af3e0[0x0]?.['shotId'] || ''),
              requestRender(),
              _0x1f3b8c['preview'](_0x4bda5c['previewShotId'], Number(_0x2af3e0[0x0]?.['startSec']) || 0x0, {
                timelineSec: 0x0,
              }),
              windowObject?.['showToast']?.(
                '智能检测完成，已覆盖为\x20' + _0x2af3e0['length'] + '\x20个片段。',
                'success',
              ));
          })
          ['catch']((_0x738696) => {
            if (!_0x15a127()) return;
            ((_0x4bda5c['isSmartDetecting'] = ![]),
              (_0x4bda5c['isSmartDetectOpen'] = !![]),
              requestRender(),
              _0x1f3b8c['preview'](
                _0x4bda5c['previewShotId'],
                _0x4bda5c['draft']['find'](
                  (_0x124080) => _0x124080['shotId'] === _0x4bda5c['previewShotId'],
                )?.['startSec'],
              ),
              windowObject?.['showToast']?.(_0x738696?.['message'] || '智能检测失败，请重试。', 'error'));
          }),
        !![]
      );
    },
    _0x216244 = ({
      submissionKind: submissionKind = 'cuts',
      closeOnSuccess: closeOnSuccess = !![],
      rollback: rollback = null,
      successMessage: successMessage = '',
      errorMessage: errorMessage = '镜头切口更新失败，请重试。',
    } = {}) => {
      ((_0x4bda5c['isSubmitting'] = submissionKind), requestRender());
      const _0x1c1539 = getProject(),
        _0x6e8203 = runRequest(
          onShotCutRangesRequested,
          createPersonReplacementShotCutUpdateRequest(
            _0x1c1539['shots'],
            _0x4bda5c['draft'],
            _0x4bda5c['previewShotId'],
          ),
        );
      return (
        Promise['resolve'](_0x6e8203)
          ['then'](() => {
            ((_0x4bda5c['isSubmitting'] = ![]),
              closeOnSuccess
                ? _0x14aa8e['close']({ animate: !![], renderWorkspace: !![] })
                : ((_0x4bda5c['initialDraft'] = clone(_0x4bda5c['draft'])),
                  (_0x4bda5c['undoStack'] = []),
                  requestRender(),
                  _0x1f3b8c['seekTimeline'](_0x4bda5c['playheadSec']),
                  successMessage && windowObject?.['showToast']?.(successMessage, 'success')));
          })
          ['catch']((_0x178a1a) => {
            ((_0x4bda5c['isSubmitting'] = ![]),
              rollback &&
                ((_0x4bda5c['draft'] = rollback['draft']), (_0x4bda5c['undoStack'] = rollback['undoStack'])),
              requestRender(),
              _0x1f3b8c['seekTimeline'](_0x4bda5c['playheadSec']),
              windowObject?.['showToast']?.(_0x178a1a?.['message'] || errorMessage, 'error'));
          }),
        !![]
      );
    },
    _0x54dc6d = () => {
      const _0x508aaa = getProject();
      if (
        !_0x4bda5c['isOpen'] ||
        _0x3ceefc['isDraftMutationBusy']() ||
        !hasPersonReplacementShotCutUpdateChanges(_0x508aaa['shots'], _0x4bda5c['draft'])
      )
        return ![];
      return _0x216244();
    };
  return (
    _0x1dad05['configureActionHandlers']({
      open: () => _0x14aa8e['open'](),
      toggleSmartDetect: () => {
        !_0x4bda5c['isSubmitting'] &&
          !_0x4bda5c['isSmartDetecting'] &&
          ((_0x4bda5c['isSmartDetectOpen'] = !_0x4bda5c['isSmartDetectOpen']),
          _0x1dad05['setSmartDetectOpen'](_0x4bda5c['isSmartDetectOpen']),
          requestRender());
      },
      setSmartDetectMode: ({ target: _0x515ef1 }) =>
        updateSmartClipSettings(
          { settings: { smartClipMode: _0x515ef1['dataset']['smartClipMode'] } },
          { notify: !![] },
        ),
      confirmSmartDetect: () => _0x4d3344(),
      toggleSound: ({ target: _0x1524d5 }) => _0x3ceefc['toggleSound'](_0x1524d5),
      toggleReverse: () => _0x14aa8e['toggleReverse'](),
      captureKeyframe: () => {
        void _0x14aa8e['captureKeyframeAtPlayhead']();
      },
      undo: () => _0x38882a(),
      reset: () => _0x55d711(),
      cancel: () => _0x14aa8e['close']({ animate: !![], renderWorkspace: !![] }),
      confirm: () => _0x54dc6d(),
      togglePlayback: () => _0x1f3b8c['togglePlayback'](),
      step: ({ target: _0x5f3874 }) =>
        _0x1f3b8c['stepTimeline'](
          Number(_0x5f3874['dataset']['personReplacementStepDirection']) < 0x0 ? -0x1 : 0x1,
        ),
      zoom: ({ target: _0x4e004d, event: _0x13aef0 }) =>
        _0x3ceefc['applyTimelineZoom'](_0x4e004d['dataset']['personReplacementZoomDirection'], {
          clientX: _0x13aef0['clientX'],
        }),
      split: () => _0x14aa8e['splitAtPlayhead'](),
      merge: () => _0x14aa8e['mergeSelected'](),
      preview: ({ target: _0x52e3e6, event: _0x4093d8 }) => {
        const _0x2fb9b7 =
          _0x4bda5c['draft'][Math['trunc'](Number(_0x52e3e6['dataset']['personReplacementCutShotIndex']))];
        if (!_0x2fb9b7) return;
        const _0x1d2ddf = _0x52e3e6['closest']?.('[data-person-replacement-shot-cut-timeline]');
        _0x1d2ddf && Number['isFinite'](Number(_0x4093d8['clientX']))
          ? _0x1f3b8c['seekTimeline'](_0x54d598(_0x4093d8, _0x1d2ddf))
          : _0x1f3b8c['preview'](_0x2fb9b7['shotId'], _0x2fb9b7['startSec']);
      },
    }),
    Object['freeze']({
      applyBoundaryTime: _0x3fdcc4,
      beginBoundaryDrag: _0x1c50bd,
      confirmDraft: _0x54dc6d,
      getTimelineSecFromPointer: _0x54d598,
      hideHoverPlayhead: _0x3c3e82,
      resetDraft: _0x55d711,
      runSmartDetection: _0x4d3344,
      submitDraft: _0x216244,
      syncEditorDom: _0x4ca8bf,
      syncHoverPlayhead: _0x27e8be,
      undoDraft: _0x38882a,
    })
  );
}
