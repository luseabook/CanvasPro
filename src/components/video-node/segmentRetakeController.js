import appStore from '../../core/stores/appStore.js';
import { findAvailablePosition, generateId } from '../../core/math.js';
import { commit } from '../../modules/history.js';
import { saveOutputBlob } from '../../modules/project.js';
import { getNodeSpawnPrefs } from '../../modules/nodeSpawn.js';
import { createVideoClipController } from '../../modules/VideoClipController.js';
import { SMART_CLIP_OUTPUT_MODE_ANALYSIS, runSmartClipJob } from '../../services/smartClipJobService.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../../services/fileService.js';
import {
  attachMediaElementPlaybackSource,
  getMediaElementCurrentSource,
} from '../../services/desktopMediaBlobSource.js';
import {
  captureAnnotatedVideoFrameSnapshot,
  saveVideoFrameSnapshot,
  waitForVideoFrame,
} from '../videoFrameCapture.js';
import { appendMentionPillToPrompt } from '../../modules/nodePromptShared.js';
import { localPathToUrl, urlToLocalPath } from '../../utils/localMediaPath.js';
import { NODE_ANNOTATE_ICON_SVG } from '../sharedIconMarkup.js';
import { createVideoKeyingProjection } from '../../modules/videoKeyingProjection.js';
import { resolveReferenceVideoSourcePath } from '../../modules/referenceInputThumbnail.js';
import {
  buildSegmentRetakePromptText,
  buildSegmentRetakePromptTime,
  calcSegmentRetakeInputStart,
  getOrphanedSegmentRetakeAnnotationIds,
  isSegmentRetakeAnnotationInRange,
  normalizeSegmentRetakeRange,
  normalizeSegmentRetakeSmartSegments,
  shouldDeleteManagedRetakeInputNode,
} from '../../modules/videoRetake/segmentRetakeSession.js';
import { t } from '../../i18n/index.js';
import { isSegmentRetakeEditing } from '../../modules/videoRetake/segmentRetakeModelPolicy.js';
function text(_0x20f264, _0x23eafb = {}) {
  return t('segmentRetake.' + _0x20f264, _0x23eafb);
}
function readState() {
  return typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']();
}
function clamp(_0xa4ff5a, _0x396a7a, _0x374c88) {
  return Math['max'](_0x396a7a, Math['min'](_0x374c88, _0xa4ff5a));
}
function measureAnnotationProjection(_0x2a52b2, _0x2cf9f4) {
  const _0x501d4f = _0x2a52b2?.['getBoundingClientRect']?.(),
    _0x1c2bea = _0x2cf9f4?.['getBoundingClientRect']?.();
  if (!_0x501d4f || !_0x1c2bea) return null;
  const _0x51cdcd = Math['max'](0x1, Number(_0x2a52b2['offsetWidth']) || _0x501d4f['width'] || 0x1),
    _0x262962 = Math['max'](0x1, Number(_0x2a52b2['offsetHeight']) || _0x501d4f['height'] || 0x1);
  return createVideoKeyingProjection({
    video: {
      rect: _0x501d4f,
      elementWidth: _0x51cdcd,
      elementHeight: _0x262962,
      mediaWidth: Math['max'](0x1, Number(_0x2a52b2['videoWidth']) || _0x51cdcd),
      mediaHeight: Math['max'](0x1, Number(_0x2a52b2['videoHeight']) || _0x262962),
      objectFit: getComputedStyle(_0x2a52b2)['objectFit'],
    },
    layer: {
      rect: _0x1c2bea,
      width: Math['max'](0x1, Number(_0x2cf9f4['offsetWidth']) || _0x1c2bea['width'] || 0x1),
      height: Math['max'](0x1, Number(_0x2cf9f4['offsetHeight']) || _0x1c2bea['height'] || 0x1),
    },
  });
}
function clampClientPointToVideo(_0x2aaab1, _0x440ecf, _0x1a68ef) {
  const _0x217870 = _0x2aaab1?.['video'];
  if (!_0x217870) return null;
  const _0x33a58c = _0x217870['rect']['left'] + _0x217870['ox'] * _0x217870['sx'],
    _0x8ea09a = _0x217870['rect']['top'] + _0x217870['oy'] * _0x217870['sy'],
    _0x4b44fb = _0x33a58c + _0x217870['dw'] * _0x217870['sx'],
    _0x51ccb9 = _0x8ea09a + _0x217870['dh'] * _0x217870['sy'];
  return _0x2aaab1['pickClientPoint'](
    clamp(Number(_0x440ecf), _0x33a58c, _0x4b44fb),
    clamp(Number(_0x1a68ef), _0x8ea09a, _0x51ccb9),
  );
}
function formatTime(_0x1a1841) {
  const _0x4cfa7d = Math['max'](0x0, Number(_0x1a1841) || 0x0),
    _0x186b01 = Math['floor'](_0x4cfa7d / 0x3c),
    _0x5bf732 = _0x4cfa7d - _0x186b01 * 0x3c;
  return String(_0x186b01)['padStart'](0x2, '0') + ':' + _0x5bf732['toFixed'](0x2)['padStart'](0x5, '0');
}
function sameRange(_0x6a6aa2, _0x3181fa) {
  return (
    Math['abs'](Number(_0x6a6aa2?.['startSec']) - Number(_0x3181fa?.['startSec'])) < 0.01 &&
    Math['abs'](Number(_0x6a6aa2?.['endSec']) - Number(_0x3181fa?.['endSec'])) < 0.01
  );
}
function comparableMediaUrl(_0x5a7707) {
  const _0x2a2a19 = String(_0x5a7707 || '')['trim']();
  if (!_0x2a2a19) return '';
  try {
    return new URL(_0x2a2a19, globalThis['location']?.['href'] || 'http://localhost/')['href'];
  } catch {
    return _0x2a2a19;
  }
}
function resolveLiveSourcePlaybackUrl(_0x1babb6, _0x5aa8ae) {
  const _0x24959d = document['getElementById'](String(_0x1babb6?.['sourceNodeId'] || '')),
    _0x5ee074 = Array['from'](_0x24959d?.['querySelectorAll']?.('video') || []);
  if (_0x5ee074['length'] === 0x0) return '';
  const _0x2dcc19 = comparableMediaUrl(_0x5aa8ae),
    _0x1eb611 = _0x5ee074['find']((_0x195266) => {
      const _0x3219f8 = String(_0x195266['dataset']?.['desktopMediaSourceUrl'] || '')['trim'](),
        _0x454352 = getMediaElementCurrentSource(_0x195266);
      return (
        _0x2dcc19 &&
        (comparableMediaUrl(_0x3219f8) === _0x2dcc19 || comparableMediaUrl(_0x454352) === _0x2dcc19)
      );
    }),
    _0x2462a9 =
      _0x1eb611 ||
      _0x5ee074['find']((_0x3c9bf0) => _0x3c9bf0['classList']?.['contains']('video-player')) ||
      _0x5ee074['find']((_0x336412) => _0x336412['paused'] === ![]) ||
      _0x5ee074[0x0];
  return getMediaElementCurrentSource(_0x2462a9);
}
export class SegmentRetakeController {
  constructor(_0x453ccb) {
    ((this['owner'] = _0x453ccb),
      (this['nodeId'] = _0x453ccb['nodeId']),
      (this['clipController'] = createVideoClipController()),
      (this['smartAbortController'] = null),
      (this['disposed'] = ![]),
      (this['annotationMode'] = ![]),
      (this['rangeSyncing'] = ![]),
      (this['draft'] = null),
      (this['smartSegments'] = []),
      (this['annotationSubmitEpoch'] = 0x0),
      (this['markerRenderSignature'] = ''),
      (this['annotationReconcilePending'] = ![]),
      (this['unsubscribeAnnotationDependencies'] = null));
  }
  get ['nodeData']() {
    return readState()['nodes']?.[this['nodeId']] || this['owner']['_data'] || {};
  }
  get ['session']() {
    return this['nodeData']['segmentRetake'] || null;
  }
  ['resolveSourceMedia']() {
    const _0x3b1221 = readState(),
      _0x5c0922 = _0x3b1221['nodes']?.[this['nodeId']]?.['segmentRetake'] || this['session'] || {},
      _0x1b49d7 = _0x3b1221['nodes']?.[_0x5c0922['sourceNodeId']] || null,
      _0x53618a = Object['values'](_0x3b1221['edges'] || {})['find'](
        (_0x4c34be) =>
          _0x4c34be?.['sourceId'] === _0x5c0922['sourceNodeId'] &&
          _0x4c34be?.['targetId'] === this['nodeId'] &&
          _0x4c34be?.['refSlot'] === 'referenceVideo',
      ),
      _0x8b78a2 = _0x1b49d7
        ? resolveReferenceVideoSourcePath(
            _0x1b49d7,
            _0x53618a || { sourceMediaKey: _0x5c0922['sourceMediaKey'] },
          )
        : '',
      _0x349d8a = localPathToUrl(_0x5c0922['sourceLocalPath']),
      _0x467b2 = _0x8b78a2 || _0x349d8a || String(_0x5c0922['sourceUrl'] || '')['trim']();
    return {
      sourceUrl: _0x467b2,
      sourceLocalPath:
        urlToLocalPath(_0x8b78a2) ||
        String(_0x5c0922['sourceLocalPath'] || '')['trim']() ||
        urlToLocalPath(_0x5c0922['sourceUrl']),
    };
  }
  ['mount']({ root: _0x555e7f, previewEl: _0x13255f, promptPanel: _0x2bb044 }) {
    if (!this['session'] || !_0x555e7f || !_0x13255f || !_0x2bb044) return ![];
    ((this['root'] = _0x555e7f),
      (this['previewEl'] = _0x13255f),
      (this['promptPanel'] = _0x2bb044),
      _0x555e7f['classList']['add']('segment-retake-node'),
      _0x13255f['classList']['add']('segment-retake-preview'),
      _0x13255f['querySelector']('.img-node-placeholder')?.['setAttribute']('hidden', ''),
      (this['videoEl'] = document['createElement']('video')),
      (this['videoEl']['className'] = 'segment-retake-video\x20video-player'),
      (this['videoEl']['controls'] = ![]),
      (this['videoEl']['playsInline'] = !![]),
      (this['videoEl']['preload'] = 'auto'),
      _0x13255f['appendChild'](this['videoEl']),
      (this['owner']['videoEl'] = this['videoEl']),
      this['owner']['_ensurePreviewVideoOverlays']?.(),
      (this['annotationButton'] = document['createElement']('button')),
      (this['annotationButton']['type'] = 'button'),
      (this['annotationButton']['className'] = 'segment-retake-annotate-button'),
      (this['annotationButton']['title'] = text('annotate.button')),
      this['annotationButton']['setAttribute']('aria-label', text('annotate.button')),
      (this['annotationButton']['innerHTML'] = NODE_ANNOTATE_ICON_SVG),
      _0x13255f['appendChild'](this['annotationButton']),
      (this['annotationLayer'] = document['createElement']('div')),
      (this['annotationLayer']['className'] = 'segment-retake-annotation-layer'),
      _0x13255f['appendChild'](this['annotationLayer']),
      (this['controlsStack'] = document['createElement']('div')),
      (this['controlsStack']['className'] = 'segment-retake-controls-stack'),
      (this['timelineShell'] = document['createElement']('section')),
      (this['timelineShell']['className'] = 'segment-retake-timeline-shell'),
      this['timelineShell']['setAttribute']('aria-label', text('timeline.label')),
      (this['timelineRow'] = document['createElement']('div')),
      (this['timelineRow']['className'] = 'segment-retake-timeline-row v2-video-cliprow'),
      (this['timelineHost'] = document['createElement']('div')),
      (this['timelineHost']['className'] = 'segment-retake-timeline-host'),
      (this['smartButton'] = document['createElement']('button')),
      (this['smartButton']['type'] = 'button'),
      (this['smartButton']['className'] = 'segment-retake-smart-button\x20v2-video-clip-smartbtn'),
      (this['smartButton']['textContent'] = text('smart.button')),
      this['timelineRow']['append'](this['timelineHost'], this['smartButton']),
      this['timelineShell']['appendChild'](this['timelineRow']),
      (this['segmentList'] = document['createElement']('div')),
      (this['segmentList']['className'] = 'segment-retake-segment-list'),
      (this['segmentList']['hidden'] = !![]),
      this['timelineShell']['appendChild'](this['segmentList']),
      _0x555e7f['insertBefore'](this['controlsStack'], _0x2bb044),
      this['controlsStack']['append'](this['timelineShell'], _0x2bb044),
      this['annotationButton']['addEventListener']('click', this['onAnnotationButtonClick']),
      this['annotationLayer']['addEventListener']('pointerdown', this['onAnnotationPointerDown']),
      this['smartButton']['addEventListener']('click', this['onSmartClick']),
      this['videoEl']['addEventListener']('click', this['onVideoClick']),
      this['videoEl']['addEventListener']('loadedmetadata', this['onVideoPlaybackStateChange']),
      this['videoEl']['addEventListener']('play', this['onVideoPlaybackStateChange']),
      this['videoEl']['addEventListener']('pause', this['onVideoPlaybackStateChange']),
      this['videoEl']['addEventListener']('ended', this['onVideoPlaybackStateChange']));
    const _0x1a2da8 = this['session'],
      { sourceUrl: _0x20ffa6, sourceLocalPath: _0x2be74c } = this['resolveSourceMedia'](),
      _0x44aa13 = resolveLiveSourcePlaybackUrl(_0x1a2da8, _0x20ffa6);
    return (
      (this['videoEl']['dataset']['videoClipSourceUrl'] = _0x20ffa6),
      void attachMediaElementPlaybackSource(this['videoEl'], _0x20ffa6, {
        playbackUrl: _0x44aa13,
        preload: 'auto',
        load: ![],
        shouldAssign: () => !this['disposed'],
      })['catch'](() => {
        if (!this['disposed']) window['showToast']?.(text('errors.invalidSource'), 'error');
      }),
      this['clipController']['initForSource']({
        wrapperEl: this['timelineHost'],
        videoEl: this['videoEl'],
        sourceUrl: _0x20ffa6,
        sourceLocalPath: _0x2be74c,
        durationSec: _0x1a2da8['sourceDurationSec'],
        initialStartSec: _0x1a2da8['range']?.['startSec'],
        initialEndSec: _0x1a2da8['range']?.['endSec'],
        anchorId: this['nodeId'],
        embedded: !![],
        selectionBodyCursor: 'pointer',
        onEscape: () => this['cancelAnnotation'](),
        onRangeChange: (_0x30ef54) => this['onRangeChange'](_0x30ef54),
      }),
      this['owner']['_syncVideoControlsFromVideo']?.(this['videoEl']),
      this['renderMarkers'](),
      this['observePrompt'](),
      this['syncAnnotationPresentation'](),
      this['observeAnnotationDependencies'](),
      !![]
    );
  }
  ['onAnnotationButtonClick'] = (_0x44394f) => {
    (_0x44394f['preventDefault'](), _0x44394f['stopPropagation']());
    if (this['annotationMode']) this['cancelAnnotation']();
    else this['beginAnnotation']();
  };
  ['onVideoClick'] = (_0x4ad076) => {
    if (this['annotationMode']) return;
    (_0x4ad076['preventDefault'](),
      _0x4ad076['stopPropagation'](),
      this['owner']['_toggleVideoPlayPause']?.(this['videoEl']));
  };
  ['onVideoPlaybackStateChange'] = () => {
    this['owner']['_syncVideoControlsFromVideo']?.(this['videoEl']);
  };
  ['beginAnnotation']() {
    ((this['annotationMode'] = !![]),
      this['previewEl']['classList']['add']('is-segment-retake-annotating'),
      this['annotationButton']['classList']['add']('is-active'),
      this['videoEl']['pause']?.(),
      this['owner']['_syncVideoControlsFromVideo']?.(this['videoEl']));
  }
  ['cancelAnnotation']() {
    (this['clearAnnotationDraft'](),
      (this['annotationMode'] = ![]),
      this['previewEl']?.['classList']['remove']('is-segment-retake-annotating'),
      this['annotationButton']?.['classList']['remove']('is-active'),
      this['owner']['_syncVideoControlsFromVideo']?.(this['videoEl']));
  }
  ['clearAnnotationDraft']() {
    ((this['annotationSubmitEpoch'] += 0x1),
      (this['draft'] = null),
      this['annotationLayer']?.['replaceChildren']());
  }
  ['onAnnotationPointerDown'] = (_0x578db2) => {
    if (!this['annotationMode'] || _0x578db2['button'] !== 0x0) return;
    if (_0x578db2['target']?.['closest']?.('.segment-retake-annotation-composer')) {
      _0x578db2['stopPropagation']();
      return;
    }
    const _0x1cd632 = measureAnnotationProjection(this['videoEl'], this['annotationLayer']),
      _0x254cdb = clampClientPointToVideo(_0x1cd632, _0x578db2['clientX'], _0x578db2['clientY']);
    if (!_0x1cd632 || !_0x254cdb) return;
    const _0x54fd90 = document['createElement']('div');
    ((_0x54fd90['className'] = 'segment-retake-draft-rect'),
      this['annotationLayer']['replaceChildren'](_0x54fd90),
      (this['draft'] = { projection: _0x1cd632, startPoint: _0x254cdb, draftEl: _0x54fd90 }),
      this['annotationLayer']['setPointerCapture']?.(_0x578db2['pointerId']));
    const _0x345d26 = (_0x355a42) => {
        if (!this['draft']) return;
        const _0x3f1afa = clampClientPointToVideo(_0x1cd632, _0x355a42['clientX'], _0x355a42['clientY']);
        if (!_0x3f1afa) return;
        const _0x29f2b0 = Math['min'](_0x254cdb['nx'], _0x3f1afa['nx']),
          _0x409eec = Math['min'](_0x254cdb['ny'], _0x3f1afa['ny']),
          _0x131f55 = Math['max'](_0x254cdb['nx'], _0x3f1afa['nx']),
          _0x48f26a = Math['max'](_0x254cdb['ny'], _0x3f1afa['ny']),
          _0x2c2025 = _0x1cd632['normalizedToLayerPoint'](_0x29f2b0, _0x409eec),
          _0x262579 = _0x1cd632['normalizedToLayerPoint'](_0x131f55, _0x48f26a);
        if (!_0x2c2025 || !_0x262579) return;
        const _0x46894f = _0x2c2025['x'],
          _0x26d126 = _0x2c2025['y'],
          _0x3854ff = _0x262579['x'] - _0x2c2025['x'],
          _0x32c566 = _0x262579['y'] - _0x2c2025['y'];
        (Object['assign'](_0x54fd90['style'], {
          left: _0x46894f + 'px',
          top: _0x26d126 + 'px',
          width: _0x3854ff + 'px',
          height: _0x32c566 + 'px',
        }),
          (this['draft']['normalizedRect'] = {
            x: _0x29f2b0,
            y: _0x409eec,
            width: _0x131f55 - _0x29f2b0,
            height: _0x48f26a - _0x409eec,
          }),
          (this['draft']['clientSize'] = {
            width: _0x3854ff * _0x1cd632['layer']['sx'],
            height: _0x32c566 * _0x1cd632['layer']['sy'],
          }));
      },
      _0x1b9633 = (_0x1a9385) => {
        (this['annotationLayer']['removeEventListener']('pointermove', _0x345d26),
          this['annotationLayer']['removeEventListener']('pointerup', _0x264b27),
          this['annotationLayer']['removeEventListener']('pointercancel', _0x1a904e),
          this['annotationLayer']['releasePointerCapture']?.(_0x1a9385));
      },
      _0x264b27 = (_0x283aaf) => {
        _0x1b9633(_0x283aaf['pointerId']);
        if (
          !this['draft']?.['normalizedRect'] ||
          this['draft']['clientSize']?.['width'] < 0x8 ||
          this['draft']['clientSize']?.['height'] < 0x8
        ) {
          this['clearAnnotationDraft']();
          return;
        }
        this['showAnnotationComposer']();
      },
      _0x1a904e = (_0x38537f) => {
        (_0x1b9633(_0x38537f['pointerId']), this['clearAnnotationDraft']());
      };
    (this['annotationLayer']['addEventListener']('pointermove', _0x345d26),
      this['annotationLayer']['addEventListener']('pointerup', _0x264b27),
      this['annotationLayer']['addEventListener']('pointercancel', _0x1a904e),
      _0x578db2['preventDefault'](),
      _0x578db2['stopPropagation']());
  };
  ['showAnnotationComposer']() {
    const _0x4574d4 = document['createElement']('div');
    _0x4574d4['className'] = 'segment-retake-annotation-composer';
    const _0x3fb291 = document['createElement']('input');
    ((_0x3fb291['type'] = 'text'),
      (_0x3fb291['placeholder'] = text('annotate.placeholder')),
      (_0x3fb291['maxLength'] = 0x1f4));
    const _0x3ded1c = document['createElement']('button');
    ((_0x3ded1c['type'] = 'button'), (_0x3ded1c['textContent'] = text('annotate.cancel')));
    const _0x214c3c = document['createElement']('button');
    ((_0x214c3c['type'] = 'button'),
      (_0x214c3c['className'] = 'is-primary'),
      (_0x214c3c['textContent'] = text('annotate.confirm')),
      (_0x214c3c['disabled'] = !![]),
      _0x3fb291['addEventListener']('input', () => {
        _0x214c3c['disabled'] = !_0x3fb291['value']['trim']();
      }),
      _0x3fb291['addEventListener']('keydown', (_0x280664) => {
        (_0x280664['key'] === 'Enter' &&
          !_0x214c3c['disabled'] &&
          (_0x280664['preventDefault'](), void this['confirmAnnotation'](_0x3fb291['value'], _0x214c3c)),
          _0x280664['key'] === 'Escape' && (_0x280664['preventDefault'](), this['clearAnnotationDraft']()));
      }),
      _0x3ded1c['addEventListener']('click', () => this['clearAnnotationDraft']()),
      _0x214c3c['addEventListener'](
        'click',
        () => void this['confirmAnnotation'](_0x3fb291['value'], _0x214c3c),
      ),
      _0x4574d4['append'](_0x3fb291, _0x3ded1c, _0x214c3c),
      this['annotationLayer']['appendChild'](_0x4574d4),
      _0x3fb291['focus'](),
      (this['draft']['composer'] = _0x4574d4));
  }
  async ['confirmAnnotation'](_0x5a25fd, _0x1374ef) {
    const _0x308f74 = String(_0x5a25fd || '')['trim']();
    if (!_0x308f74 || !this['draft'] || _0x1374ef['disabled']) return;
    const _0x4aa908 = this['draft'],
      _0x25a79a = Number(this['videoEl']['currentTime']) || 0x0,
      _0x57ad51 = ++this['annotationSubmitEpoch'];
    ((_0x1374ef['disabled'] = !![]), _0x1374ef['setAttribute']('aria-busy', 'true'));
    try {
      const _0x838b1 = await waitForVideoFrame(this['videoEl']);
      if (_0x57ad51 !== this['annotationSubmitEpoch'] || this['disposed']) return;
      if (!_0x838b1) throw new Error(text('errors.frameNotReady'));
      const { normalizedRect: _0x1c4062, projection: _0x74daf2 } = _0x4aa908,
        _0x3e535d = {
          x: _0x1c4062['x'] * _0x74daf2['video']['vw'],
          y: _0x1c4062['y'] * _0x74daf2['video']['vh'],
          width: _0x1c4062['width'] * _0x74daf2['video']['vw'],
          height: _0x1c4062['height'] * _0x74daf2['video']['vh'],
        },
        _0x322c47 = generateId('retake-annotation'),
        _0x235b51 = getComputedStyle(document['documentElement'])['getPropertyValue']('--purple')['trim'](),
        _0x454137 = await captureAnnotatedVideoFrameSnapshot(this['videoEl'], _0x3e535d, {
          strokeStyle: _0x235b51 || undefined,
        });
      if (_0x57ad51 !== this['annotationSubmitEpoch'] || this['disposed']) return;
      const _0x5adb66 = await saveVideoFrameSnapshot(_0x454137, saveOutputBlob);
      if (_0x57ad51 !== this['annotationSubmitEpoch'] || this['disposed']) return;
      const _0x5ddef3 = this['createAnnotationNode']({
        annotationId: _0x322c47,
        annotationTimeSec: _0x25a79a,
        requirement: _0x308f74,
        sourceRect: _0x3e535d,
        snapshot: _0x454137,
        saved: _0x5adb66,
      });
      if (!this['appendPromptAnnotation'](_0x5ddef3['annotation'], _0x5ddef3['node'])) {
        this['deleteAnnotation'](_0x5ddef3['annotation']['id']);
        throw new Error(text('errors.annotationFailed'));
      }
      (commit(), window['_triggerLocalCacheSave']?.(), this['cancelAnnotation'](), this['renderMarkers']());
    } catch (_0x59409c) {
      (window['showToast']?.(_0x59409c?.['message'] || text('errors.annotationFailed'), 'error'),
        _0x1374ef['isConnected'] &&
          ((_0x1374ef['disabled'] = ![]), _0x1374ef['removeAttribute']('aria-busy')));
    }
  }
  ['createAnnotationNode']({
    annotationId: _0x2db5b0,
    annotationTimeSec: _0x206290,
    requirement: _0x1e9847,
    sourceRect: _0x242da3,
    snapshot: _0x1ba5e9,
    saved: _0x284a93,
  }) {
    const _0x139415 = readState(),
      _0x202c7f = _0x139415['nodes']?.[this['nodeId']],
      _0x4f65df = _0x202c7f?.['segmentRetake'] || this['session'],
      _0x461253 = Array['isArray'](_0x4f65df?.['annotations']) ? _0x4f65df['annotations'] : [],
      { spacing: _0x1b6f44, direction: _0x49dbbe, avoidOverlap: _0x4398a6 } = getNodeSpawnPrefs(),
      _0x55e9b9 = getAutoMediaSizeByShortSide(_0x1ba5e9['width'], _0x1ba5e9['height']),
      _0x21e6fe = calcSegmentRetakeInputStart({
        targetNode: _0x202c7f,
        itemWidth: _0x55e9b9['width'],
        itemHeight: _0x55e9b9['height'],
        index: _0x461253['length'],
        spacing: _0x1b6f44,
        direction: _0x49dbbe,
      }),
      _0x28c5f7 = _0x4398a6
        ? findAvailablePosition(
            _0x139415['nodes'] || {},
            _0x21e6fe['x'],
            _0x21e6fe['y'],
            _0x55e9b9['width'],
            _0x55e9b9['height'],
            _0x1b6f44,
            'down',
          )
        : { x: _0x21e6fe['x'], y: _0x21e6fe['y'] },
      _0xa890c2 = generateId('source-image-retake'),
      _0x36b993 = generateId('edge-retake-annotation'),
      _0x586d96 = buildSourceMediaNodePayload({
        id: _0xa890c2,
        type: 'source-image',
        x: _0x28c5f7['x'],
        y: _0x28c5f7['y'],
        width: _0x55e9b9['width'],
        height: _0x55e9b9['height'],
        naturalWidth: _0x1ba5e9['width'],
        naturalHeight: _0x1ba5e9['height'],
        name: buildSegmentRetakePromptTime(_0x206290),
        src: _0x284a93['src'],
        localPath: _0x284a93['localPath'],
        originalLocalPath: _0x284a93['originalLocalPath'],
        displayLocalPath: _0x284a93['displayLocalPath'],
        thumbLocalPath: _0x284a93['thumbLocalPath'],
        fileName: _0x284a93['fileName'],
        fixedSize: !![],
        needsAutoResize: ![],
        segmentRetakeManaged: !![],
        segmentRetakeOwnerId: this['nodeId'],
        segmentRetakeAnnotationId: _0x2db5b0,
      }),
      _0x3af5bb = {
        id: _0x2db5b0,
        nodeId: _0xa890c2,
        edgeId: _0x36b993,
        timeSec: _0x206290,
        requirement: _0x1e9847,
        rect: _0x242da3,
        thumbnailUrl: _0x284a93['src'],
      };
    return (
      appStore['batch'](() => {
        (appStore['addNode'](_0x586d96),
          appStore['addEdge']({
            id: _0x36b993,
            sourceId: _0xa890c2,
            targetId: this['nodeId'],
            refSlot: 'referenceImage',
          }),
          appStore['updateNodeData'](this['nodeId'], {
            segmentRetake: { ..._0x4f65df, annotations: [..._0x461253, _0x3af5bb] },
          }),
          appStore['setSelectedNodes']([this['nodeId']]));
      }),
      this['owner']['_updateSubmitButtonState']?.(),
      { node: _0x586d96, annotation: _0x3af5bb }
    );
  }
  ['appendPromptAnnotation'](_0x4ec28, _0x2bf4df) {
    const _0x38508f = appendMentionPillToPrompt(
      this['owner'],
      {
        origin: 'node',
        nodeId: _0x2bf4df['id'],
        type: 'image',
        label: _0x2bf4df['name'],
        refLabel: _0x2bf4df['name'],
      },
      { focus: ![] },
    );
    if (!_0x38508f) return ![];
    _0x38508f['dataset']['retakeAnnotationId'] = _0x4ec28['id'];
    const _0x79f0c7 = document['createElement']('span');
    ((_0x79f0c7['className'] = 'segment-retake-prompt-instruction'),
      (_0x79f0c7['dataset']['retakeAnnotationId'] = _0x4ec28['id']),
      (_0x79f0c7['contentEditable'] = 'false'),
      (_0x79f0c7['textContent'] = buildSegmentRetakePromptText(_0x4ec28['requirement'])));
    const _0xe324b9 = document['createTextNode']('\u00a0'),
      _0x37d73d = _0x38508f['nextSibling'] || _0x38508f;
    return (
      _0x37d73d['after'](_0x79f0c7, _0xe324b9),
      this['owner']['promptEl']['dispatchEvent'](new Event('input', { bubbles: !![] })),
      !![]
    );
  }
  ['observePrompt']() {
    if (!this['owner']['promptEl']) return;
    ((this['onPromptInput'] = () => {
      queueMicrotask(() => {
        if (this['disposed']) return;
        for (const _0x2d7afa of this['session']?.['annotations'] || []) {
          const _0x5c6411 = CSS['escape'](_0x2d7afa['id']),
            _0x3863a0 = this['owner']['promptEl']['querySelector'](
              '.ref-pill[data-retake-annotation-id="' + _0x5c6411 + '\x22]',
            ),
            _0x402f39 = this['owner']['promptEl']['querySelector'](
              '.segment-retake-prompt-instruction[data-retake-annotation-id=\x22' + _0x5c6411 + '\x22]',
            );
          (!_0x3863a0 || !_0x402f39) &&
            this['deleteAnnotation'](_0x2d7afa['id'], { promptAlreadyRemoved: !![] });
        }
      });
    }),
      this['owner']['promptEl']['addEventListener']('input', this['onPromptInput']));
  }
  ['syncAnnotationPresentation']() {
    const _0x57ef69 = readState(),
      _0x411350 = this['session']?.['annotations'] || [],
      _0x43cb0e = {};
    let _0xea3294 = ![];
    for (const _0x57ef9c of _0x411350) {
      const _0x5cb260 = buildSegmentRetakePromptTime(_0x57ef9c['timeSec']),
        _0x316e0d = _0x57ef69['nodes']?.[_0x57ef9c['nodeId']];
      _0x316e0d?.['segmentRetakeManaged'] === !![] &&
        _0x316e0d['segmentRetakeOwnerId'] === this['nodeId'] &&
        _0x316e0d['name'] !== _0x5cb260 &&
        (_0x43cb0e[_0x57ef9c['nodeId']] = { name: _0x5cb260 });
      const _0x2f6333 = CSS['escape'](_0x57ef9c['id']);
      this['owner']['promptEl']
        ?.['querySelectorAll'](
          '.segment-retake-prompt-time[data-retake-annotation-id=\x22' + _0x2f6333 + '\x22]',
        )
        ['forEach']((_0x2d5eae) => {
          (_0x2d5eae['remove'](), (_0xea3294 = !![]));
        });
      const _0x79393f = this['owner']['promptEl']?.['querySelector'](
          '.ref-pill[data-retake-annotation-id="' + _0x2f6333 + '\x22]',
        ),
        _0x3c899f = _0x79393f?.['querySelector']?.('.ref-pill-label');
      if (
        _0x79393f &&
        (_0x79393f['dataset']['label'] !== _0x5cb260 || _0x79393f['dataset']['refLabel'] !== _0x5cb260)
      ) {
        ((_0x79393f['dataset']['label'] = _0x5cb260), (_0x79393f['dataset']['refLabel'] = _0x5cb260));
        if (_0x3c899f) _0x3c899f['textContent'] = _0x5cb260;
        else _0x79393f['textContent'] = _0x5cb260;
        _0xea3294 = !![];
      }
    }
    (Object['keys'](_0x43cb0e)['length'] > 0x0 && appStore['updateNodesData'](_0x43cb0e),
      _0xea3294 &&
        (this['owner']['promptEl']?.['dispatchEvent'](new Event('input', { bubbles: !![] })),
        window['_triggerLocalCacheSave']?.()));
  }
  ['observeAnnotationDependencies']() {
    (this['unsubscribeAnnotationDependencies']?.(),
      (this['unsubscribeAnnotationDependencies'] = appStore['subscribeSelector'](
        (_0x5a0a33) => {
          const _0x23bbb4 = _0x5a0a33['nodes']?.[this['nodeId']]?.['segmentRetake']?.['annotations'];
          return JSON['stringify'](
            (Array['isArray'](_0x23bbb4) ? _0x23bbb4 : [])['map']((_0x2882cf) => [
              _0x2882cf['id'],
              Boolean(_0x5a0a33['nodes']?.[_0x2882cf['nodeId']]),
              Boolean(_0x5a0a33['edges']?.[_0x2882cf['edgeId']]),
            ]),
          );
        },
        () => this['scheduleAnnotationReconcile'](),
      )));
  }
  ['scheduleAnnotationReconcile']() {
    if (this['disposed'] || this['annotationReconcilePending']) return;
    const _0x55fb69 = readState(),
      _0x4cc4aa = _0x55fb69['nodes']?.[this['nodeId']];
    if (!isSegmentRetakeEditing(_0x4cc4aa)) return;
    const _0xadb295 = getOrphanedSegmentRetakeAnnotationIds({
      session: _0x4cc4aa['segmentRetake'],
      nodes: _0x55fb69['nodes'],
      edges: _0x55fb69['edges'],
    });
    if (_0xadb295['length'] === 0x0) return;
    ((this['annotationReconcilePending'] = !![]),
      queueMicrotask(() => {
        try {
          if (this['disposed']) return;
          const _0x297923 = readState(),
            _0x86ada3 = _0x297923['nodes']?.[this['nodeId']];
          if (!isSegmentRetakeEditing(_0x86ada3)) return;
          const _0x161bb9 = getOrphanedSegmentRetakeAnnotationIds({
            session: _0x86ada3['segmentRetake'],
            nodes: _0x297923['nodes'],
            edges: _0x297923['edges'],
          });
          _0x161bb9['forEach']((_0x462ca6) => {
            this['deleteAnnotation'](_0x462ca6);
          });
        } finally {
          this['annotationReconcilePending'] = ![];
        }
      }));
  }
  ['deleteAnnotation'](_0x16d741, { promptAlreadyRemoved: promptAlreadyRemoved = ![] } = {}) {
    const _0x4ba9cd = readState(),
      _0x2c1137 = _0x4ba9cd['nodes']?.[this['nodeId']],
      _0x18addb = _0x2c1137?.['segmentRetake'],
      _0x21356f = Array['isArray'](_0x18addb?.['annotations']) ? _0x18addb['annotations'] : [],
      _0x2622fb = _0x21356f['find']((_0x1ca159) => _0x1ca159['id'] === _0x16d741);
    if (!_0x2622fb) return ![];
    const _0x5378ba = Object['values'](_0x4ba9cd['edges'] || {}),
      _0x572c33 = shouldDeleteManagedRetakeInputNode({
        node: _0x4ba9cd['nodes']?.[_0x2622fb['nodeId']],
        nodeId: _0x2622fb['nodeId'],
        ownerEdgeId: _0x2622fb['edgeId'],
        edges: _0x5378ba,
      });
    return (
      appStore['batch'](() => {
        if (_0x4ba9cd['edges']?.[_0x2622fb['edgeId']]) appStore['removeEdge'](_0x2622fb['edgeId']);
        (_0x572c33 && appStore['deleteNodes']([_0x2622fb['nodeId']]),
          appStore['updateNodeData'](this['nodeId'], {
            segmentRetake: {
              ..._0x18addb,
              annotations: _0x21356f['filter']((_0x2372be) => _0x2372be['id'] !== _0x16d741),
            },
          }));
      }),
      !promptAlreadyRemoved &&
        (this['owner']['promptEl']
          ?.['querySelectorAll']('[data-retake-annotation-id="' + CSS['escape'](_0x16d741) + '\x22]')
          ['forEach']((_0x4d1898) => _0x4d1898['remove']()),
        this['owner']['promptEl']?.['dispatchEvent'](new Event('input', { bubbles: !![] }))),
      commit(),
      window['_triggerLocalCacheSave']?.(),
      this['owner']['_updateSubmitButtonState']?.(),
      this['renderMarkers'](),
      !![]
    );
  }
  ['onRangeChange'](_0x178d30) {
    if (this['disposed'] || this['rangeSyncing']) return;
    this['renderMarkers'](_0x178d30);
    if (_0x178d30['transient']) return;
    const _0x139b80 = this['session'],
      _0xe559c3 = normalizeSegmentRetakeRange(
        _0x178d30,
        _0x178d30['sourceDurationSec'] || _0x139b80?.['sourceDurationSec'],
      );
    !sameRange(_0xe559c3, _0x178d30) &&
      ((this['rangeSyncing'] = !![]),
      this['clipController']['setSourceRange'](_0xe559c3['startSec'], _0xe559c3['endSec']),
      (this['rangeSyncing'] = ![]));
    if (sameRange(_0xe559c3, _0x139b80?.['range'])) return;
    (appStore['updateNodeData'](this['nodeId'], { segmentRetake: { ..._0x139b80, range: _0xe559c3 } }),
      this['owner']['_updateSubmitButtonState']?.(),
      window['_triggerLocalCacheSave']?.());
  }
  ['renderMarkers'](_0x3ccba9 = null, { force: force = ![] } = {}) {
    const _0x41aa8b = this['clipController']['getSourceTimelineElements']();
    if (!_0x41aa8b?.['trackEl']) return;
    const _0x1d9973 = this['session'],
      _0x426644 = Number(_0x1d9973?.['sourceDurationSec']) || 0x0,
      _0x53e9b4 = _0x3ccba9 || _0x1d9973?.['range'] || {},
      _0x153aab = JSON['stringify']({
        duration: _0x426644,
        range: [Number(_0x53e9b4['startSec']) || 0x0, Number(_0x53e9b4['endSec']) || 0x0],
        annotations: (_0x1d9973?.['annotations'] || [])['map']((_0x33a9c5) => [
          _0x33a9c5['id'],
          Number(_0x33a9c5['timeSec']) || 0x0,
          _0x33a9c5['requirement'],
          _0x33a9c5['thumbnailUrl'],
        ]),
      });
    if (!force && _0x153aab === this['markerRenderSignature']) return;
    ((this['markerRenderSignature'] = _0x153aab),
      _0x41aa8b['trackEl']
        ['querySelectorAll']('.segment-retake-marker')
        ['forEach']((_0x2ccc75) => _0x2ccc75['remove']()));
    for (const _0x9f498b of _0x1d9973?.['annotations'] || []) {
      const _0x1111e6 = document['createElement']('div');
      ((_0x1111e6['className'] = 'segment-retake-marker'),
        (_0x1111e6['tabIndex'] = 0x0),
        _0x1111e6['setAttribute']('role', 'button'));
      !isSegmentRetakeAnnotationInRange(_0x9f498b, _0x53e9b4) && _0x1111e6['classList']['add']('is-invalid');
      ((_0x1111e6['style']['left'] =
        clamp((Number(_0x9f498b['timeSec']) / _0x426644) * 0x64, 0x0, 0x64) + '%'),
        _0x1111e6['setAttribute'](
          'aria-label',
          text('marker.label', { time: formatTime(_0x9f498b['timeSec']) }),
        ));
      const _0x468621 = document['createElement']('span');
      _0x468621['className'] = 'segment-retake-marker-popover';
      const _0xddc044 = document['createElement']('img');
      ((_0xddc044['src'] = _0x9f498b['thumbnailUrl'] || ''), (_0xddc044['alt'] = ''));
      const _0x588c39 = document['createElement']('span');
      _0x588c39['textContent'] = formatTime(_0x9f498b['timeSec']) + ' · ' + _0x9f498b['requirement'];
      const _0xdc5fa6 = document['createElement']('button');
      ((_0xdc5fa6['type'] = 'button'),
        (_0xdc5fa6['textContent'] = text('marker.delete')),
        _0xdc5fa6['addEventListener']('click', (_0x51dffd) => {
          (_0x51dffd['preventDefault'](),
            _0x51dffd['stopPropagation'](),
            this['deleteAnnotation'](_0x9f498b['id']));
        }),
        _0x468621['append'](_0xddc044, _0x588c39, _0xdc5fa6),
        _0x1111e6['appendChild'](_0x468621));
      const _0x1eb9e9 = () => {
        const _0x267cda = _0x1111e6['getBoundingClientRect']();
        ((_0x468621['style']['left'] =
          clamp(_0x267cda['left'] - 0x2e, 0x8, Math['max'](0x8, window['innerWidth'] - 0x154)) + 'px'),
          (_0x468621['style']['top'] =
            clamp(_0x267cda['bottom'] + 0x8, 0x8, Math['max'](0x8, window['innerHeight'] - 0x96)) + 'px'));
      };
      (_0x1111e6['addEventListener']('mouseenter', _0x1eb9e9),
        _0x1111e6['addEventListener']('focus', _0x1eb9e9));
      const _0x3b1a16 = () => {
        this['videoEl']['currentTime'] = Number(_0x9f498b['timeSec']) || 0x0;
      };
      (_0x1111e6['addEventListener']('click', _0x3b1a16),
        _0x1111e6['addEventListener']('keydown', (_0x1eb58a) => {
          if (_0x1eb58a['key'] !== 'Enter' && _0x1eb58a['key'] !== '\x20') return;
          (_0x1eb58a['preventDefault'](), _0x3b1a16());
        }),
        _0x41aa8b['trackEl']['appendChild'](_0x1111e6));
    }
  }
  ['onSmartClick'] = async (_0x118e42) => {
    (_0x118e42['preventDefault'](), _0x118e42['stopPropagation']());
    if (this['smartAbortController']) {
      this['smartAbortController']['abort']();
      return;
    }
    const _0x225deb = this['session'];
    if (Number(_0x225deb?.['sourceDurationSec']) < 0x4) {
      window['showToast']?.(text('errors.durationTooShort'), 'warn');
      return;
    }
    const _0x258bbd = this['resolveSourceMedia']()['sourceUrl'];
    ((this['smartAbortController'] = new AbortController()),
      this['smartButton']['classList']['add']('is-loading'),
      (this['smartButton']['textContent'] = text('smart.analyzing')));
    try {
      const _0xbab97b = await runSmartClipJob({
        src: _0x258bbd,
        signal: this['smartAbortController']['signal'],
        options: {
          mode: 'stable',
          unlimitedSegments: !![],
          outputMode: SMART_CLIP_OUTPUT_MODE_ANALYSIS,
          maxSegmentDurationSec: 0x1e,
        },
      });
      if (this['disposed']) return;
      ((this['smartSegments'] = normalizeSegmentRetakeSmartSegments(
        _0xbab97b['segments'],
        _0x225deb['sourceDurationSec'],
      )),
        this['renderSmartSegments']());
    } catch (_0x4e97c6) {
      _0x4e97c6?.['code'] !== 'cancelled' &&
        window['showToast']?.(_0x4e97c6?.['message'] || text('errors.smartFailed'), 'error');
    } finally {
      ((this['smartAbortController'] = null),
        this['smartButton']?.['isConnected'] &&
          (this['smartButton']['classList']['remove']('is-loading'),
          (this['smartButton']['textContent'] = text('smart.button'))));
    }
  };
  ['renderSmartSegments']() {
    (this['segmentList']['replaceChildren'](),
      (this['segmentList']['hidden'] = this['smartSegments']['length'] === 0x0),
      this['smartSegments']['forEach']((_0x15d618, _0x186d70) => {
        const _0x3fef5f = document['createElement']('button');
        ((_0x3fef5f['type'] = 'button'),
          (_0x3fef5f['textContent'] = text('smart.segment', {
            index: _0x186d70 + 0x1,
            start: formatTime(_0x15d618['startSec']),
            end: formatTime(_0x15d618['endSec']),
          })),
          _0x3fef5f['addEventListener']('click', () => {
            this['clipController']['setSourceRange'](_0x15d618['startSec'], _0x15d618['endSec']);
          }),
          this['segmentList']['appendChild'](_0x3fef5f));
      }));
  }
  ['update'](_0x45db81) {
    if (this['disposed']) return;
    if (!isSegmentRetakeEditing(_0x45db81)) {
      this['dispose']();
      this['owner']['_segmentRetakeController'] === this &&
        (this['owner']['_segmentRetakeController'] = null);
      (this['owner']['_ensurePreviewVideoOverlays']?.(), this['owner']['_loadVideoWhenMediaReady']?.());
      return;
    }
    (this['renderMarkers'](), this['scheduleAnnotationReconcile']());
  }
  ['dispose']() {
    ((this['disposed'] = !![]),
      this['unsubscribeAnnotationDependencies']?.(),
      (this['unsubscribeAnnotationDependencies'] = null),
      this['smartAbortController']?.['abort'](),
      (this['smartAbortController'] = null),
      this['owner']['promptEl']?.['removeEventListener']('input', this['onPromptInput']),
      (this['onPromptInput'] = null),
      this['clipController']['exit']({ silent: !![], reason: 'unmount' }),
      this['annotationButton']?.['removeEventListener']('click', this['onAnnotationButtonClick']),
      this['annotationLayer']?.['removeEventListener']('pointerdown', this['onAnnotationPointerDown']),
      this['smartButton']?.['removeEventListener']('click', this['onSmartClick']),
      this['videoEl']?.['removeEventListener']('click', this['onVideoClick']),
      this['videoEl']?.['removeEventListener']('loadedmetadata', this['onVideoPlaybackStateChange']),
      this['videoEl']?.['removeEventListener']('play', this['onVideoPlaybackStateChange']),
      this['videoEl']?.['removeEventListener']('pause', this['onVideoPlaybackStateChange']),
      this['videoEl']?.['removeEventListener']('ended', this['onVideoPlaybackStateChange']));
    this['controlsStack']?.['isConnected'] &&
      this['promptPanel']?.['parentElement'] === this['controlsStack'] &&
      this['controlsStack']['before'](this['promptPanel']);
    (this['controlsStack']?.['remove'](),
      this['annotationLayer']?.['remove'](),
      this['annotationButton']?.['remove']());
    if (this['owner']['videoEl'] === this['videoEl']) this['owner']['videoEl'] = null;
    (this['videoEl']?.['remove'](),
      this['root']?.['classList']['remove']('segment-retake-node'),
      this['previewEl']?.['classList']['remove']('segment-retake-preview', 'is-segment-retake-annotating'));
  }
}
export function createSegmentRetakeController(_0x2efe2f) {
  return new SegmentRetakeController(_0x2efe2f);
}
export function mountSegmentRetakeController(_0x52132a, { root: _0x553d70, promptPanel: _0x523c0c } = {}) {
  _0x52132a['_segmentRetakeController']?.['dispose']?.();
  const _0x230a42 = createSegmentRetakeController(_0x52132a);
  return (
    (_0x52132a['_segmentRetakeController'] = _0x230a42),
    _0x230a42['mount']({ root: _0x553d70, previewEl: _0x52132a['previewEl'], promptPanel: _0x523c0c }),
    _0x230a42
  );
}
