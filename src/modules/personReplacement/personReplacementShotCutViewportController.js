import {
  getMediaClipTimelineNextZoom,
  getMediaClipTimelineTrackWidthPx,
  getMediaClipTimelineZoomScrollLeft,
} from '../../components/media-clip/mediaClipTimelineModel.js';
import {
  PERSON_REPLACEMENT_CUT_BASE_VIEWPORT_WIDTH_PX,
  canSplitPersonReplacementShotCutRange,
  getPersonReplacementShotCutDisplayDuration,
  getPersonReplacementShotCutPositionAtTimelineSec,
  getPersonReplacementShotCutTotalDuration,
} from './personReplacementShotCutModel.js';
import {
  getPersonReplacementShotCutRulerFrameRate,
  renderPersonReplacementShotCutRulerTicks,
} from './personReplacementShotCutRendering.js';
function clamp(value, item, key, index = item) {
  const result = Number(value);
  return Number['isFinite'](result) ? Math['min'](key, Math['max'](item, result)) : index;
}
function formatPreciseClock(data) {
  const options = Math['max'](0x0, Number(data) || 0x0),
    target = Math['floor'](options / 0x3c),
    source = options - target * 0x3c;
  return String(target)['padStart'](0x2, '0') + ':' + source['toFixed'](0x2)['padStart'](0x5, '0');
}
export function createPersonReplacementShotCutViewportController({
  session: session,
  getRoot: getRoot = () => null,
  renderIcon: renderIcon = () => '',
} = {}) {
  if (!session?.['workspaceState'])
    throw new TypeError('Shot\x20cut\x20viewport\x20requires\x20a\x20session.');
  const enabled = session['workspaceState'],
    isBusy = () => enabled['isSubmitting'] || enabled['isSmartDetecting'],
    isDraftMutationBusy = () => isBusy() || enabled['isKeyframeCapturing'],
    syncPlayhead = () => {
      const el = getRoot(),
        personReplacementShotCutTotalDuration = getPersonReplacementShotCutTotalDuration(enabled['draft']),
        personReplacementShotCutDisplayDuration = getPersonReplacementShotCutDisplayDuration(
          enabled['draft'],
        ),
        clamp2 = clamp(enabled['playheadSec'], 0x0, personReplacementShotCutTotalDuration, 0x0);
      enabled['playheadSec'] = clamp2;
      !enabled['playheadElement'] &&
        (enabled['playheadElement'] =
          el?.['querySelector']?.('[data-person-replacement-shot-cut-playhead]') || null);
      enabled['playheadElement']?.['style']?.['setProperty']?.(
        'left',
        (personReplacementShotCutDisplayDuration > 0x0
          ? (clamp2 / personReplacementShotCutDisplayDuration) * 0x64
          : 0x0) + '%',
      );
      !enabled['clockElement'] &&
        (enabled['clockElement'] =
          el?.['querySelector']?.('[data-person-replacement-shot-cut-current-time]') || null);
      enabled['clockElement'] && (enabled['clockElement']['textContent'] = formatPreciseClock(clamp2));
      const el2 = el?.['querySelector']?.('[data-person-replacement-action=\x27split-shot-cut\x27]');
      if (el2) {
        const personReplacementShotCutPositionAtTimelineSec =
            getPersonReplacementShotCutPositionAtTimelineSec(enabled['draft'], clamp2),
          next = enabled['draft'][personReplacementShotCutPositionAtTimelineSec['shotIndex']],
          enabled2 = Boolean(
            next &&
            canSplitPersonReplacementShotCutRange(
              next,
              personReplacementShotCutPositionAtTimelineSec['sourceTimeSec'] -
                (Number(next['startSec']) || 0x0),
            ),
          ),
          current = enabled['isSubmitting'] || enabled['isSmartDetecting'] || !enabled2;
        el2['disabled'] = current;
        if (current) el2['setAttribute']?.('disabled', '');
        else el2['removeAttribute']?.('disabled');
      }
    },
    syncUndoButton = () => {
      const el3 = getRoot()?.['querySelector']?.("[data-person-replacement-action='undo-shot-cut']");
      if (!el3) return;
      const entry =
        enabled['isSubmitting'] || enabled['isSmartDetecting'] || enabled['undoStack']['length'] === 0x0;
      el3['disabled'] = entry;
      if (entry) el3['setAttribute']?.('disabled', '');
      else el3['removeAttribute']?.('disabled');
    },
    commitDraft = (record, { recordHistory: recordHistory = !![] } = {}) => {
      if (!Array['isArray'](record)) return ![];
      const enabled3 = session['commitDraft'](record, { recordHistory: recordHistory });
      if (!enabled3) return ![];
      return (syncUndoButton(), !![]);
    },
    applyTimelineZoom = (delta = 'reset', { clientX: clientX = Number['NaN'] } = {}) => {
      if (!enabled['isOpen']) return ![];
      const el4 = getRoot(),
        width2 = el4?.['querySelector']?.('[data-person-replacement-shot-timeline-scroll]'),
        el5 = el4?.['querySelector']?.('[data-person-replacement-shot-cut-timeline]');
      if (!width2 || !el5) return ![];
      const currentZoom = Math['max'](0.08, Number(enabled['timelineZoom']) || 0x1),
        zoom =
          delta === 'reset'
            ? 0x1
            : getMediaClipTimelineNextZoom({
                currentZoom: currentZoom,
                delta: delta === 'in' ? -0x1 : 0x1,
                minZoom: 0.08,
                maxZoom: 0x6,
              }),
        box = width2['getBoundingClientRect']?.() || {
          left: 0x0,
          width: width2['clientWidth'] || 0x0,
        },
        viewportWidthPx = Math['max'](0x1, Number(width2['clientWidth']) || Number(box['width']) || 0x1),
        anchorX = clamp(
          Number['isFinite'](Number(clientX))
            ? Number(clientX) - Number(box['left'] || 0x0)
            : viewportWidthPx / 0x2,
          0x0,
          viewportWidthPx,
          viewportWidthPx / 0x2,
        ),
        durationSec = getPersonReplacementShotCutDisplayDuration(enabled['draft']),
        mediaClipTimelineTrackWidthPx = getMediaClipTimelineTrackWidthPx({
          durationSec: getPersonReplacementShotCutTotalDuration(enabled['draft']),
          viewportWidthPx: PERSON_REPLACEMENT_CUT_BASE_VIEWPORT_WIDTH_PX,
          zoom: currentZoom,
        }),
        anchorSec = clamp(
          ((Math['max'](0x0, Number(width2['scrollLeft']) || 0x0) + anchorX) /
            Math['max'](0x1, mediaClipTimelineTrackWidthPx)) *
            durationSec,
          0x0,
          durationSec,
          0x0,
        ),
        trackWidthPx = getMediaClipTimelineTrackWidthPx({
          durationSec: getPersonReplacementShotCutTotalDuration(enabled['draft']),
          viewportWidthPx: PERSON_REPLACEMENT_CUT_BASE_VIEWPORT_WIDTH_PX,
          zoom: zoom,
        }),
        mediaClipTimelineZoomScrollLeft = getMediaClipTimelineZoomScrollLeft({
          anchorSec: anchorSec,
          anchorX: anchorX,
          durationSec: durationSec,
          trackWidthPx: trackWidthPx,
          nextContentWidthPx: trackWidthPx,
          viewportWidthPx: viewportWidthPx,
        });
      ((enabled['timelineZoom'] = zoom),
        el5['style']?.['setProperty']?.('--media-clip-track-content-width', trackWidthPx + 'px'),
        el5['style']?.['setProperty']?.('--media-clip-timeline-content-width', trackWidthPx + 'px'));
      const el6 = el5['querySelector']?.('.person-replacement-shot-cut-ruler');
      return (
        el6 &&
          (el6['innerHTML'] = renderPersonReplacementShotCutRulerTicks(
            getPersonReplacementShotCutTotalDuration(enabled['draft']),
            trackWidthPx,
            durationSec,
            getPersonReplacementShotCutRulerFrameRate(enabled['draft']),
          )),
        (width2['scrollLeft'] = Math['max'](
          0x0,
          Math['min'](
            Math['max'](0x0, trackWidthPx - viewportWidthPx),
            Number(mediaClipTimelineZoomScrollLeft) || 0x0,
          ),
        )),
        syncPlayhead(),
        Math['abs'](zoom - currentZoom) > 0.0001
      );
    },
    toggleSound = (el7) => {
      if (!enabled['isOpen'] || isBusy()) return ![];
      enabled['soundEnabled'] = !enabled['soundEnabled'];
      const root = getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      if (root) root['muted'] = !enabled['soundEnabled'];
      const payload = enabled['soundEnabled'] ? '关闭声音' : '打开声音';
      return (
        el7?.['classList']?.['toggle']?.('is-sound-enabled', enabled['soundEnabled']),
        el7?.['setAttribute']?.('aria-pressed', String(enabled['soundEnabled'])),
        el7?.['setAttribute']?.('aria-label', payload),
        el7?.['setAttribute']?.('data-tooltip', payload),
        el7 && (el7['innerHTML'] = renderIcon(enabled['soundEnabled'] ? 'soundOn' : 'soundOff')),
        !![]
      );
    };
  return Object['freeze']({
    applyTimelineZoom: applyTimelineZoom,
    commitDraft: commitDraft,
    isBusy: isBusy,
    isDraftMutationBusy: isDraftMutationBusy,
    syncPlayhead: syncPlayhead,
    syncUndoButton: syncUndoButton,
    toggleSound: toggleSound,
  });
}
