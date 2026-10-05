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
function text(value, item = {}) {
  return t('segmentRetake.' + value, item);
}
function readState() {
  return typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']();
}
function clamp(key, index, result) {
  return Math['max'](index, Math['min'](result, key));
}
function measureAnnotationProjection(el, el2) {
  const rect = el?.['getBoundingClientRect']?.(),
    rect2 = el2?.['getBoundingClientRect']?.();
  if (!rect || !rect2) return null;
  const elementWidth = Math['max'](1, Number(el['offsetWidth']) || rect['width'] || 1),
    elementHeight = Math['max'](1, Number(el['offsetHeight']) || rect['height'] || 1);
  return createVideoKeyingProjection({
    video: {
      rect: rect,
      elementWidth: elementWidth,
      elementHeight: elementHeight,
      mediaWidth: Math['max'](1, Number(el['videoWidth']) || elementWidth),
      mediaHeight: Math['max'](1, Number(el['videoHeight']) || elementHeight),
      objectFit: getComputedStyle(el)['objectFit'],
    },
    layer: {
      rect: rect2,
      width: Math['max'](1, Number(el2['offsetWidth']) || rect2['width'] || 1),
      height: Math['max'](1, Number(el2['offsetHeight']) || rect2['height'] || 1),
    },
  });
}
function clampClientPointToVideo(data, options, target) {
  const enabled = data?.['video'];
  if (!enabled) return null;
  const source = enabled['rect']['left'] + enabled['ox'] * enabled['sx'],
    next = enabled['rect']['top'] + enabled['oy'] * enabled['sy'],
    current = source + enabled['dw'] * enabled['sx'],
    entry = next + enabled['dh'] * enabled['sy'];
  return data['pickClientPoint'](clamp(Number(options), source, current), clamp(Number(target), next, entry));
}
function formatTime(record) {
  const payload = Math['max'](0, Number(record) || 0),
    handle = Math['floor'](payload / 60),
    state = payload - handle * 60;
  return String(handle)['padStart'](2, '0') + ':' + state['toFixed'](2)['padStart'](5, '0');
}
function sameRange(config, scope) {
  return (
    Math['abs'](Number(config?.['startSec']) - Number(scope?.['startSec'])) < 0.01 &&
    Math['abs'](Number(config?.['endSec']) - Number(scope?.['endSec'])) < 0.01
  );
}
function comparableMediaUrl(input) {
  const enabled2 = String(input || '')['trim']();
  if (!enabled2) return '';
  try {
    return new URL(enabled2, globalThis['location']?.['href'] || 'http://localhost/')['href'];
  } catch {
    return enabled2;
  }
}
function resolveLiveSourcePlaybackUrl(output, value2) {
  const el3 = document['getElementById'](String(output?.['sourceNodeId'] || '')),
    list = Array['from'](el3?.['querySelectorAll']?.('video') || []);
  if (list['length'] === 0) return '';
  const comparableMediaUrl2 = comparableMediaUrl(value2),
    value3 = list['find']((el4) => {
      const value4 = String(el4['dataset']?.['desktopMediaSourceUrl'] || '')['trim'](),
        mediaElementCurrentSource = getMediaElementCurrentSource(el4);
      return (
        comparableMediaUrl2 &&
        (comparableMediaUrl(value4) === comparableMediaUrl2 ||
          comparableMediaUrl(mediaElementCurrentSource) === comparableMediaUrl2)
      );
    }),
    value5 =
      value3 ||
      list['find']((el5) => el5['classList']?.['contains']('video-player')) ||
      list['find']((value6) => value6['paused'] === ![]) ||
      list[0];
  return getMediaElementCurrentSource(value5);
}
export class SegmentRetakeController {
  constructor(value7) {
    ((this['owner'] = value7),
      (this['nodeId'] = value7['nodeId']),
      (this['clipController'] = createVideoClipController()),
      (this['smartAbortController'] = null),
      (this['disposed'] = ![]),
      (this['annotationMode'] = ![]),
      (this['rangeSyncing'] = ![]),
      (this['draft'] = null),
      (this['smartSegments'] = []),
      (this['annotationSubmitEpoch'] = 0),
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
    const state2 = readState(),
      sourceMediaKey2 = state2['nodes']?.[this['nodeId']]?.['segmentRetake'] || this['session'] || {},
      value8 = state2['nodes']?.[sourceMediaKey2['sourceNodeId']] || null,
      value9 = Object['values'](state2['edges'] || {})['find'](
        (value10) =>
          value10?.['sourceId'] === sourceMediaKey2['sourceNodeId'] &&
          value10?.['targetId'] === this['nodeId'] &&
          value10?.['refSlot'] === 'referenceVideo',
      ),
      value11 = value8
        ? resolveReferenceVideoSourcePath(
            value8,
            value9 || { sourceMediaKey: sourceMediaKey2['sourceMediaKey'] },
          )
        : '',
      url = localPathToUrl(sourceMediaKey2['sourceLocalPath']),
      sourceUrl = value11 || url || String(sourceMediaKey2['sourceUrl'] || '')['trim']();
    return {
      sourceUrl: sourceUrl,
      sourceLocalPath:
        urlToLocalPath(value11) ||
        String(sourceMediaKey2['sourceLocalPath'] || '')['trim']() ||
        urlToLocalPath(sourceMediaKey2['sourceUrl']),
    };
  }
  ['mount']({ root: root, previewEl: previewEl, promptPanel: promptPanel }) {
    if (!this['session'] || !root || !previewEl || !promptPanel) return ![];
    ((this['root'] = root),
      (this['previewEl'] = previewEl),
      (this['promptPanel'] = promptPanel),
      root['classList']['add']('segment-retake-node'),
      previewEl['classList']['add']('segment-retake-preview'),
      previewEl['querySelector']('.img-node-placeholder')?.['setAttribute']('hidden', ''),
      (this['videoEl'] = document['createElement']('video')),
      (this['videoEl']['className'] = 'segment-retake-video video-player'),
      (this['videoEl']['controls'] = ![]),
      (this['videoEl']['playsInline'] = !![]),
      (this['videoEl']['preload'] = 'auto'),
      previewEl['appendChild'](this['videoEl']),
      (this['owner']['videoEl'] = this['videoEl']),
      this['owner']['_ensurePreviewVideoOverlays']?.(),
      (this['annotationButton'] = document['createElement']('button')),
      (this['annotationButton']['type'] = 'button'),
      (this['annotationButton']['className'] = 'segment-retake-annotate-button'),
      (this['annotationButton']['title'] = text('annotate.button')),
      this['annotationButton']['setAttribute']('aria-label', text('annotate.button')),
      (this['annotationButton']['innerHTML'] = NODE_ANNOTATE_ICON_SVG),
      previewEl['appendChild'](this['annotationButton']),
      (this['annotationLayer'] = document['createElement']('div')),
      (this['annotationLayer']['className'] = 'segment-retake-annotation-layer'),
      previewEl['appendChild'](this['annotationLayer']),
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
      (this['smartButton']['className'] = 'segment-retake-smart-button v2-video-clip-smartbtn'),
      (this['smartButton']['textContent'] = text('smart.button')),
      this['timelineRow']['append'](this['timelineHost'], this['smartButton']),
      this['timelineShell']['appendChild'](this['timelineRow']),
      (this['segmentList'] = document['createElement']('div')),
      (this['segmentList']['className'] = 'segment-retake-segment-list'),
      (this['segmentList']['hidden'] = !![]),
      this['timelineShell']['appendChild'](this['segmentList']),
      root['insertBefore'](this['controlsStack'], promptPanel),
      this['controlsStack']['append'](this['timelineShell'], promptPanel),
      this['annotationButton']['addEventListener']('click', this['onAnnotationButtonClick']),
      this['annotationLayer']['addEventListener']('pointerdown', this['onAnnotationPointerDown']),
      this['smartButton']['addEventListener']('click', this['onSmartClick']),
      this['videoEl']['addEventListener']('click', this['onVideoClick']),
      this['videoEl']['addEventListener']('loadedmetadata', this['onVideoPlaybackStateChange']),
      this['videoEl']['addEventListener']('play', this['onVideoPlaybackStateChange']),
      this['videoEl']['addEventListener']('pause', this['onVideoPlaybackStateChange']),
      this['videoEl']['addEventListener']('ended', this['onVideoPlaybackStateChange']));
    const durationSec = this['session'],
      { sourceUrl: sourceUrl2, sourceLocalPath: sourceLocalPath } = this['resolveSourceMedia'](),
      playbackUrl = resolveLiveSourcePlaybackUrl(durationSec, sourceUrl2);
    return (
      (this['videoEl']['dataset']['videoClipSourceUrl'] = sourceUrl2),
      void attachMediaElementPlaybackSource(this['videoEl'], sourceUrl2, {
        playbackUrl: playbackUrl,
        preload: 'auto',
        load: ![],
        shouldAssign: () => !this['disposed'],
      })['catch'](() => {
        if (!this['disposed']) window['showToast']?.(text('errors.invalidSource'), 'error');
      }),
      this['clipController']['initForSource']({
        wrapperEl: this['timelineHost'],
        videoEl: this['videoEl'],
        sourceUrl: sourceUrl2,
        sourceLocalPath: sourceLocalPath,
        durationSec: durationSec['sourceDurationSec'],
        initialStartSec: durationSec['range']?.['startSec'],
        initialEndSec: durationSec['range']?.['endSec'],
        anchorId: this['nodeId'],
        embedded: !![],
        selectionBodyCursor: 'pointer',
        onEscape: () => this['cancelAnnotation'](),
        onRangeChange: (value12) => this['onRangeChange'](value12),
      }),
      this['owner']['_syncVideoControlsFromVideo']?.(this['videoEl']),
      this['renderMarkers'](),
      this['observePrompt'](),
      this['syncAnnotationPresentation'](),
      this['observeAnnotationDependencies'](),
      !![]
    );
  }
  ['onAnnotationButtonClick'] = (event) => {
    (event['preventDefault'](), event['stopPropagation']());
    if (this['annotationMode']) this['cancelAnnotation']();
    else this['beginAnnotation']();
  };
  ['onVideoClick'] = (event2) => {
    if (this['annotationMode']) return;
    (event2['preventDefault'](),
      event2['stopPropagation'](),
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
    ((this['annotationSubmitEpoch'] += 1),
      (this['draft'] = null),
      this['annotationLayer']?.['replaceChildren']());
  }
  ['onAnnotationPointerDown'] = (event3) => {
    if (!this['annotationMode'] || event3['button'] !== 0) return;
    if (event3['target']?.['closest']?.('.segment-retake-annotation-composer')) {
      event3['stopPropagation']();
      return;
    }
    const projection = measureAnnotationProjection(this['videoEl'], this['annotationLayer']),
      startPoint = clampClientPointToVideo(projection, event3['clientX'], event3['clientY']);
    if (!projection || !startPoint) return;
    const draftEl = document['createElement']('div');
    ((draftEl['className'] = 'segment-retake-draft-rect'),
      this['annotationLayer']['replaceChildren'](draftEl),
      (this['draft'] = { projection: projection, startPoint: startPoint, draftEl: draftEl }),
      this['annotationLayer']['setPointerCapture']?.(event3['pointerId']));
    const value13 = (event4) => {
        if (!this['draft']) return;
        const video = clampClientPointToVideo(projection, event4['clientX'], event4['clientY']);
        if (!video) return;
        const x = Math['min'](startPoint['nx'], video['nx']),
          y = Math['min'](startPoint['ny'], video['ny']),
          width = Math['max'](startPoint['nx'], video['nx']),
          height = Math['max'](startPoint['ny'], video['ny']),
          box = projection['normalizedToLayerPoint'](x, y),
          box2 = projection['normalizedToLayerPoint'](width, height);
        if (!box || !box2) return;
        const left = box['x'],
          top = box['y'],
          width2 = box2['x'] - box['x'],
          height2 = box2['y'] - box['y'];
        (Object['assign'](draftEl['style'], {
          left: left + 'px',
          top: top + 'px',
          width: width2 + 'px',
          height: height2 + 'px',
        }),
          (this['draft']['normalizedRect'] = {
            x: x,
            y: y,
            width: width - x,
            height: height - y,
          }),
          (this['draft']['clientSize'] = {
            width: width2 * projection['layer']['sx'],
            height: height2 * projection['layer']['sy'],
          }));
      },
      handler = (value14) => {
        (this['annotationLayer']['removeEventListener']('pointermove', value13),
          this['annotationLayer']['removeEventListener']('pointerup', value15),
          this['annotationLayer']['removeEventListener']('pointercancel', value16),
          this['annotationLayer']['releasePointerCapture']?.(value14));
      },
      value15 = (event5) => {
        handler(event5['pointerId']);
        if (
          !this['draft']?.['normalizedRect'] ||
          this['draft']['clientSize']?.['width'] < 8 ||
          this['draft']['clientSize']?.['height'] < 8
        ) {
          this['clearAnnotationDraft']();
          return;
        }
        this['showAnnotationComposer']();
      },
      value16 = (event6) => {
        (handler(event6['pointerId']), this['clearAnnotationDraft']());
      };
    (this['annotationLayer']['addEventListener']('pointermove', value13),
      this['annotationLayer']['addEventListener']('pointerup', value15),
      this['annotationLayer']['addEventListener']('pointercancel', value16),
      event3['preventDefault'](),
      event3['stopPropagation']());
  };
  ['showAnnotationComposer']() {
    const value17 = document['createElement']('div');
    value17['className'] = 'segment-retake-annotation-composer';
    const el6 = document['createElement']('input');
    ((el6['type'] = 'text'), (el6['placeholder'] = text('annotate.placeholder')), (el6['maxLength'] = 500));
    const el7 = document['createElement']('button');
    ((el7['type'] = 'button'), (el7['textContent'] = text('annotate.cancel')));
    const el8 = document['createElement']('button');
    ((el8['type'] = 'button'),
      (el8['className'] = 'is-primary'),
      (el8['textContent'] = text('annotate.confirm')),
      (el8['disabled'] = !![]),
      el6['addEventListener']('input', () => {
        el8['disabled'] = !el6['value']['trim']();
      }),
      el6['addEventListener']('keydown', (event7) => {
        (event7['key'] === 'Enter' &&
          !el8['disabled'] &&
          (event7['preventDefault'](), void this['confirmAnnotation'](el6['value'], el8)),
          event7['key'] === 'Escape' && (event7['preventDefault'](), this['clearAnnotationDraft']()));
      }),
      el7['addEventListener']('click', () => this['clearAnnotationDraft']()),
      el8['addEventListener']('click', () => void this['confirmAnnotation'](el6['value'], el8)),
      value17['append'](el6, el7, el8),
      this['annotationLayer']['appendChild'](value17),
      el6['focus'](),
      (this['draft']['composer'] = value17));
  }
  async ['confirmAnnotation'](value18, el9) {
    const requirement = String(value18 || '')['trim']();
    if (!requirement || !this['draft'] || el9['disabled']) return;
    const value19 = this['draft'],
      annotationTimeSec = Number(this['videoEl']['currentTime']) || 0,
      value20 = ++this['annotationSubmitEpoch'];
    ((el9['disabled'] = !![]), el9['setAttribute']('aria-busy', 'true'));
    try {
      const waitForVideoFrame2 = await waitForVideoFrame(this['videoEl']);
      if (value20 !== this['annotationSubmitEpoch'] || this['disposed']) return;
      if (!waitForVideoFrame2) throw new Error(text('errors.frameNotReady'));
      const { normalizedRect: normalizedRect, projection: projection2 } = value19,
        sourceRect = {
          x: normalizedRect['x'] * projection2['video']['vw'],
          y: normalizedRect['y'] * projection2['video']['vh'],
          width: normalizedRect['width'] * projection2['video']['vw'],
          height: normalizedRect['height'] * projection2['video']['vh'],
        },
        annotationId = generateId('retake-annotation'),
        strokeStyle = getComputedStyle(document['documentElement'])['getPropertyValue']('--purple')['trim'](),
        snapshot = await captureAnnotatedVideoFrameSnapshot(this['videoEl'], sourceRect, {
          strokeStyle: strokeStyle || undefined,
        });
      if (value20 !== this['annotationSubmitEpoch'] || this['disposed']) return;
      const saved = await saveVideoFrameSnapshot(snapshot, saveOutputBlob);
      if (value20 !== this['annotationSubmitEpoch'] || this['disposed']) return;
      const value21 = this['createAnnotationNode']({
        annotationId: annotationId,
        annotationTimeSec: annotationTimeSec,
        requirement: requirement,
        sourceRect: sourceRect,
        snapshot: snapshot,
        saved: saved,
      });
      if (!this['appendPromptAnnotation'](value21['annotation'], value21['node'])) {
        this['deleteAnnotation'](value21['annotation']['id']);
        throw new Error(text('errors.annotationFailed'));
      }
      (commit(), window['_triggerLocalCacheSave']?.(), this['cancelAnnotation'](), this['renderMarkers']());
    } catch (error) {
      (window['showToast']?.(error?.['message'] || text('errors.annotationFailed'), 'error'),
        el9['isConnected'] && ((el9['disabled'] = ![]), el9['removeAttribute']('aria-busy')));
    }
  }
  ['createAnnotationNode']({
    annotationId: annotationId2,
    annotationTimeSec: annotationTimeSec2,
    requirement: requirement2,
    sourceRect: sourceRect2,
    snapshot: snapshot2,
    saved: saved2,
  }) {
    const state3 = readState(),
      targetNode = state3['nodes']?.[this['nodeId']],
      args = targetNode?.['segmentRetake'] || this['session'],
      index2 = Array['isArray'](args?.['annotations']) ? args['annotations'] : [],
      { spacing: spacing, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
      itemWidth = getAutoMediaSizeByShortSide(snapshot2['width'], snapshot2['height']),
      x2 = calcSegmentRetakeInputStart({
        targetNode: targetNode,
        itemWidth: itemWidth['width'],
        itemHeight: itemWidth['height'],
        index: index2['length'],
        spacing: spacing,
        direction: direction,
      }),
      x3 = avoidOverlap
        ? findAvailablePosition(
            state3['nodes'] || {},
            x2['x'],
            x2['y'],
            itemWidth['width'],
            itemWidth['height'],
            spacing,
            'down',
          )
        : { x: x2['x'], y: x2['y'] },
      id = generateId('source-image-retake'),
      edgeId = generateId('edge-retake-annotation'),
      node = buildSourceMediaNodePayload({
        id: id,
        type: 'source-image',
        x: x3['x'],
        y: x3['y'],
        width: itemWidth['width'],
        height: itemWidth['height'],
        naturalWidth: snapshot2['width'],
        naturalHeight: snapshot2['height'],
        name: buildSegmentRetakePromptTime(annotationTimeSec2),
        src: saved2['src'],
        localPath: saved2['localPath'],
        originalLocalPath: saved2['originalLocalPath'],
        displayLocalPath: saved2['displayLocalPath'],
        thumbLocalPath: saved2['thumbLocalPath'],
        fileName: saved2['fileName'],
        fixedSize: !![],
        needsAutoResize: ![],
        segmentRetakeManaged: !![],
        segmentRetakeOwnerId: this['nodeId'],
        segmentRetakeAnnotationId: annotationId2,
      }),
      annotation = {
        id: annotationId2,
        nodeId: id,
        edgeId: edgeId,
        timeSec: annotationTimeSec2,
        requirement: requirement2,
        rect: sourceRect2,
        thumbnailUrl: saved2['src'],
      };
    return (
      appStore['batch'](() => {
        (appStore['addNode'](node),
          appStore['addEdge']({
            id: edgeId,
            sourceId: id,
            targetId: this['nodeId'],
            refSlot: 'referenceImage',
          }),
          appStore['updateNodeData'](this['nodeId'], {
            segmentRetake: { ...args, annotations: [...index2, annotation] },
          }),
          appStore['setSelectedNodes']([this['nodeId']]));
      }),
      this['owner']['_updateSubmitButtonState']?.(),
      { node: node, annotation: annotation }
    );
  }
  ['appendPromptAnnotation'](value22, nodeId) {
    const el10 = appendMentionPillToPrompt(
      this['owner'],
      {
        origin: 'node',
        nodeId: nodeId['id'],
        type: 'image',
        label: nodeId['name'],
        refLabel: nodeId['name'],
      },
      { focus: ![] },
    );
    if (!el10) return ![];
    el10['dataset']['retakeAnnotationId'] = value22['id'];
    const el11 = document['createElement']('span');
    ((el11['className'] = 'segment-retake-prompt-instruction'),
      (el11['dataset']['retakeAnnotationId'] = value22['id']),
      (el11['contentEditable'] = 'false'),
      (el11['textContent'] = buildSegmentRetakePromptText(value22['requirement'])));
    const value23 = document['createTextNode']('\xa0'),
      value24 = el10['nextSibling'] || el10;
    return (
      value24['after'](el11, value23),
      this['owner']['promptEl']['dispatchEvent'](new Event('input', { bubbles: !![] })),
      !![]
    );
  }
  ['observePrompt']() {
    if (!this['owner']['promptEl']) return;
    ((this['onPromptInput'] = () => {
      queueMicrotask(() => {
        if (this['disposed']) return;
        for (const value25 of this['session']?.['annotations'] || []) {
          const value26 = CSS['escape'](value25['id']),
            enabled3 = this['owner']['promptEl']['querySelector'](
              '.ref-pill[data-retake-annotation-id="' + value26 + '"]',
            ),
            enabled4 = this['owner']['promptEl']['querySelector'](
              '.segment-retake-prompt-instruction[data-retake-annotation-id="' + value26 + '"]',
            );
          (!enabled3 || !enabled4) && this['deleteAnnotation'](value25['id'], { promptAlreadyRemoved: !![] });
        }
      });
    }),
      this['owner']['promptEl']['addEventListener']('input', this['onPromptInput']));
  }
  ['syncAnnotationPresentation']() {
    const state4 = readState(),
      value27 = this['session']?.['annotations'] || [],
      value28 = {};
    let value29 = ![];
    for (const value30 of value27) {
      const name = buildSegmentRetakePromptTime(value30['timeSec']),
        error2 = state4['nodes']?.[value30['nodeId']];
      error2?.['segmentRetakeManaged'] === !![] &&
        error2['segmentRetakeOwnerId'] === this['nodeId'] &&
        error2['name'] !== name &&
        (value28[value30['nodeId']] = { name: name });
      const value31 = CSS['escape'](value30['id']);
      this['owner']['promptEl']
        ?.['querySelectorAll'](
          '.segment-retake-prompt-time[data-retake-annotation-id="' + value31 + '"]',
        )
        ['forEach']((el12) => {
          (el12['remove'](), (value29 = !![]));
        });
      const el13 = this['owner']['promptEl']?.['querySelector'](
          '.ref-pill[data-retake-annotation-id="' + value31 + '"]',
        ),
        el14 = el13?.['querySelector']?.('.ref-pill-label');
      if (el13 && (el13['dataset']['label'] !== name || el13['dataset']['refLabel'] !== name)) {
        ((el13['dataset']['label'] = name), (el13['dataset']['refLabel'] = name));
        if (el14) el14['textContent'] = name;
        else el13['textContent'] = name;
        value29 = !![];
      }
    }
    (Object['keys'](value28)['length'] > 0 && appStore['updateNodesData'](value28),
      value29 &&
        (this['owner']['promptEl']?.['dispatchEvent'](new Event('input', { bubbles: !![] })),
        window['_triggerLocalCacheSave']?.()));
  }
  ['observeAnnotationDependencies']() {
    (this['unsubscribeAnnotationDependencies']?.(),
      (this['unsubscribeAnnotationDependencies'] = appStore['subscribeSelector'](
        (state5) => {
          const value32 = state5['nodes']?.[this['nodeId']]?.['segmentRetake']?.['annotations'];
          return JSON['stringify'](
            (Array['isArray'](value32) ? value32 : [])['map']((value33) => [
              value33['id'],
              Boolean(state5['nodes']?.[value33['nodeId']]),
              Boolean(state5['edges']?.[value33['edgeId']]),
            ]),
          );
        },
        () => this['scheduleAnnotationReconcile'](),
      )));
  }
  ['scheduleAnnotationReconcile']() {
    if (this['disposed'] || this['annotationReconcilePending']) return;
    const nodes = readState(),
      session = nodes['nodes']?.[this['nodeId']];
    if (!isSegmentRetakeEditing(session)) return;
    const list2 = getOrphanedSegmentRetakeAnnotationIds({
      session: session['segmentRetake'],
      nodes: nodes['nodes'],
      edges: nodes['edges'],
    });
    if (list2['length'] === 0) return;
    ((this['annotationReconcilePending'] = !![]),
      queueMicrotask(() => {
        try {
          if (this['disposed']) return;
          const nodes2 = readState(),
            session2 = nodes2['nodes']?.[this['nodeId']];
          if (!isSegmentRetakeEditing(session2)) return;
          const list3 = getOrphanedSegmentRetakeAnnotationIds({
            session: session2['segmentRetake'],
            nodes: nodes2['nodes'],
            edges: nodes2['edges'],
          });
          list3['forEach']((value34) => {
            this['deleteAnnotation'](value34);
          });
        } finally {
          this['annotationReconcilePending'] = ![];
        }
      }));
  }
  ['deleteAnnotation'](value35, { promptAlreadyRemoved: promptAlreadyRemoved = ![] } = {}) {
    const node2 = readState(),
      value36 = node2['nodes']?.[this['nodeId']],
      args2 = value36?.['segmentRetake'],
      annotations = Array['isArray'](args2?.['annotations']) ? args2['annotations'] : [],
      nodeId2 = annotations['find']((value37) => value37['id'] === value35);
    if (!nodeId2) return ![];
    const edges = Object['values'](node2['edges'] || {}),
      shouldDeleteManagedRetakeInputNode2 = shouldDeleteManagedRetakeInputNode({
        node: node2['nodes']?.[nodeId2['nodeId']],
        nodeId: nodeId2['nodeId'],
        ownerEdgeId: nodeId2['edgeId'],
        edges: edges,
      });
    return (
      appStore['batch'](() => {
        if (node2['edges']?.[nodeId2['edgeId']]) appStore['removeEdge'](nodeId2['edgeId']);
        (shouldDeleteManagedRetakeInputNode2 && appStore['deleteNodes']([nodeId2['nodeId']]),
          appStore['updateNodeData'](this['nodeId'], {
            segmentRetake: {
              ...args2,
              annotations: annotations['filter']((value38) => value38['id'] !== value35),
            },
          }));
      }),
      !promptAlreadyRemoved &&
        (this['owner']['promptEl']
          ?.['querySelectorAll']('[data-retake-annotation-id="' + CSS['escape'](value35) + '"]')
          ['forEach']((el15) => el15['remove']()),
        this['owner']['promptEl']?.['dispatchEvent'](new Event('input', { bubbles: !![] }))),
      commit(),
      window['_triggerLocalCacheSave']?.(),
      this['owner']['_updateSubmitButtonState']?.(),
      this['renderMarkers'](),
      !![]
    );
  }
  ['onRangeChange'](value39) {
    if (this['disposed'] || this['rangeSyncing']) return;
    this['renderMarkers'](value39);
    if (value39['transient']) return;
    const args3 = this['session'],
      range = normalizeSegmentRetakeRange(
        value39,
        value39['sourceDurationSec'] || args3?.['sourceDurationSec'],
      );
    !sameRange(range, value39) &&
      ((this['rangeSyncing'] = !![]),
      this['clipController']['setSourceRange'](range['startSec'], range['endSec']),
      (this['rangeSyncing'] = ![]));
    if (sameRange(range, args3?.['range'])) return;
    (appStore['updateNodeData'](this['nodeId'], { segmentRetake: { ...args3, range: range } }),
      this['owner']['_updateSubmitButtonState']?.(),
      window['_triggerLocalCacheSave']?.());
  }
  ['renderMarkers'](value40 = null, { force: force = ![] } = {}) {
    const enabled5 = this['clipController']['getSourceTimelineElements']();
    if (!enabled5?.['trackEl']) return;
    const value41 = this['session'],
      duration = Number(value41?.['sourceDurationSec']) || 0,
      value42 = value40 || value41?.['range'] || {},
      value43 = JSON['stringify']({
        duration: duration,
        range: [Number(value42['startSec']) || 0, Number(value42['endSec']) || 0],
        annotations: (value41?.['annotations'] || [])['map']((value44) => [
          value44['id'],
          Number(value44['timeSec']) || 0,
          value44['requirement'],
          value44['thumbnailUrl'],
        ]),
      });
    if (!force && value43 === this['markerRenderSignature']) return;
    ((this['markerRenderSignature'] = value43),
      enabled5['trackEl']
        ['querySelectorAll']('.segment-retake-marker')
        ['forEach']((el16) => el16['remove']()));
    for (const value45 of value41?.['annotations'] || []) {
      const el17 = document['createElement']('div');
      ((el17['className'] = 'segment-retake-marker'),
        (el17['tabIndex'] = 0),
        el17['setAttribute']('role', 'button'));
      !isSegmentRetakeAnnotationInRange(value45, value42) && el17['classList']['add']('is-invalid');
      ((el17['style']['left'] = clamp((Number(value45['timeSec']) / duration) * 100, 0, 100) + '%'),
        el17['setAttribute']('aria-label', text('marker.label', { time: formatTime(value45['timeSec']) })));
      const el18 = document['createElement']('span');
      el18['className'] = 'segment-retake-marker-popover';
      const value46 = document['createElement']('img');
      ((value46['src'] = value45['thumbnailUrl'] || ''), (value46['alt'] = ''));
      const el19 = document['createElement']('span');
      el19['textContent'] = formatTime(value45['timeSec']) + ' · ' + value45['requirement'];
      const el20 = document['createElement']('button');
      ((el20['type'] = 'button'),
        (el20['textContent'] = text('marker.delete')),
        el20['addEventListener']('click', (event8) => {
          (event8['preventDefault'](), event8['stopPropagation'](), this['deleteAnnotation'](value45['id']));
        }),
        el18['append'](value46, el19, el20),
        el17['appendChild'](el18));
      const value47 = () => {
        const box3 = el17['getBoundingClientRect']();
        ((el18['style']['left'] =
          clamp(box3['left'] - 46, 8, Math['max'](8, window['innerWidth'] - 340)) + 'px'),
          (el18['style']['top'] =
            clamp(box3['bottom'] + 8, 8, Math['max'](8, window['innerHeight'] - 150)) + 'px'));
      };
      (el17['addEventListener']('mouseenter', value47), el17['addEventListener']('focus', value47));
      const run = () => {
        this['videoEl']['currentTime'] = Number(value45['timeSec']) || 0;
      };
      (el17['addEventListener']('click', run),
        el17['addEventListener']('keydown', (event9) => {
          if (event9['key'] !== 'Enter' && event9['key'] !== ' ') return;
          (event9['preventDefault'](), run());
        }),
        enabled5['trackEl']['appendChild'](el17));
    }
  }
  ['onSmartClick'] = async (event10) => {
    (event10['preventDefault'](), event10['stopPropagation']());
    if (this['smartAbortController']) {
      this['smartAbortController']['abort']();
      return;
    }
    const value48 = this['session'];
    if (Number(value48?.['sourceDurationSec']) < 4) {
      window['showToast']?.(text('errors.durationTooShort'), 'warn');
      return;
    }
    const src = this['resolveSourceMedia']()['sourceUrl'];
    ((this['smartAbortController'] = new AbortController()),
      this['smartButton']['classList']['add']('is-loading'),
      (this['smartButton']['textContent'] = text('smart.analyzing')));
    try {
      const runSmartClipJob2 = await runSmartClipJob({
        src: src,
        signal: this['smartAbortController']['signal'],
        options: {
          mode: 'stable',
          unlimitedSegments: !![],
          outputMode: SMART_CLIP_OUTPUT_MODE_ANALYSIS,
          maxSegmentDurationSec: 30,
        },
      });
      if (this['disposed']) return;
      ((this['smartSegments'] = normalizeSegmentRetakeSmartSegments(
        runSmartClipJob2['segments'],
        value48['sourceDurationSec'],
      )),
        this['renderSmartSegments']());
    } catch (error3) {
      error3?.['code'] !== 'cancelled' &&
        window['showToast']?.(error3?.['message'] || text('errors.smartFailed'), 'error');
    } finally {
      ((this['smartAbortController'] = null),
        this['smartButton']?.['isConnected'] &&
          (this['smartButton']['classList']['remove']('is-loading'),
          (this['smartButton']['textContent'] = text('smart.button'))));
    }
  };
  ['renderSmartSegments']() {
    (this['segmentList']['replaceChildren'](),
      (this['segmentList']['hidden'] = this['smartSegments']['length'] === 0),
      this['smartSegments']['forEach']((value49, index3) => {
        const el21 = document['createElement']('button');
        ((el21['type'] = 'button'),
          (el21['textContent'] = text('smart.segment', {
            index: index3 + 1,
            start: formatTime(value49['startSec']),
            end: formatTime(value49['endSec']),
          })),
          el21['addEventListener']('click', () => {
            this['clipController']['setSourceRange'](value49['startSec'], value49['endSec']);
          }),
          this['segmentList']['appendChild'](el21));
      }));
  }
  ['update'](value50) {
    if (this['disposed']) return;
    if (!isSegmentRetakeEditing(value50)) {
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
export function createSegmentRetakeController(value51) {
  return new SegmentRetakeController(value51);
}
export function mountSegmentRetakeController(previewEl2, { root: root2, promptPanel: promptPanel2 } = {}) {
  previewEl2['_segmentRetakeController']?.['dispose']?.();
  const segmentRetakeController = createSegmentRetakeController(previewEl2);
  return (
    (previewEl2['_segmentRetakeController'] = segmentRetakeController),
    segmentRetakeController['mount']({
      root: root2,
      previewEl: previewEl2['previewEl'],
      promptPanel: promptPanel2,
    }),
    segmentRetakeController
  );
}
