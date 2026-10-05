import { consumeWorkspaceWheelDirection } from '../workspaceAssetPresentation.js';
import { storyClipProduction } from './storyClipProduction.js';
import {
  findStoryClipCardShell,
  syncSelectedClipVideoMetadataInPlace,
  syncStoryClipCardVideoInPlace,
} from './storyClipVideoResultDom.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function createStoryClipResultSelectionController({
  state: state,
  viewport: viewport,
  documentObject: documentObject = globalThis['document'],
  getSelectedEpisode: getSelectedEpisode,
  getSelectedClip: getSelectedClip,
  resetAdjustmentUi: resetAdjustmentUi,
  applyVideoSettings: applyVideoSettings,
  refreshSelectedClip: refreshSelectedClip,
  refreshSelectedVideoResult: refreshSelectedVideoResult,
  refreshHistory: refreshHistory,
  hideHistory: hideHistory,
  render: render,
  schedulePersistence: schedulePersistence,
} = {}) {
  if (
    !state ||
    !viewport ||
    !documentObject ||
    typeof getSelectedEpisode !== 'function' ||
    typeof getSelectedClip !== 'function' ||
    typeof resetAdjustmentUi !== 'function' ||
    typeof applyVideoSettings !== 'function' ||
    typeof refreshSelectedClip !== 'function' ||
    typeof refreshSelectedVideoResult !== 'function' ||
    typeof refreshHistory !== 'function' ||
    typeof hideHistory !== 'function' ||
    typeof render !== 'function' ||
    typeof schedulePersistence !== 'function'
  )
    throw new TypeError(
      'Story clip result selection requires navigation, persistence, and presentation adapters.',
    );
  const item = { accumulator: 0, lockedUntil: 0 };
  function switchSelectedClip(key) {
    const index = getSelectedEpisode(state),
      list = Array['isArray'](index?.['clips']) ? index['clips'] : [];
    if (list['length'] < 2) return false;
    const result = storyClipProduction['getAdjacentClipId'](list, state['selectedClipId'], key),
      enabled = list['find']((data) => data['id'] === result);
    if (!enabled || enabled['id'] === state['selectedClipId']) return false;
    const options = Number(key) < 0 ? 'previous' : 'next';
    (resetAdjustmentUi({ close: true }),
      (state['selectedClipId'] = enabled['id']),
      applyVideoSettings(enabled));
    if (!refreshSelectedClip(options)) render();
    return (schedulePersistence(), true);
  }
  function selectVideoResult(target, source, { delta: delta = 0 } = {}) {
    const next = getSelectedEpisode(state),
      list2 = Array['isArray'](next?.['clips']) ? next['clips'] : [],
      enabled2 = list2['find']((current) => normalizeText(current?.['id']) === normalizeText(target));
    if (!enabled2) return false;
    const entry = storyClipProduction['renderEpisode'](state, next, enabled2),
      list3 = entry['videoResults'];
    if (list3['length'] < 2) return false;
    const record = entry['activeVideoResultIndex'],
      payload = Math['trunc'](Number(source)),
      activeIndex = Number['isFinite'](payload)
        ? Math['max'](0, Math['min'](list3['length'] - 1, payload))
        : entry['getAdjacentVideoResultIndex'](delta),
      enabled3 = state['selectedClipId'] !== enabled2['id'];
    if (!enabled3 && activeIndex === record) return (hideHistory(), false);
    const handle = list2['findIndex']((config) => config['id'] === state['selectedClipId']),
      count = list2['findIndex']((scope) => scope['id'] === enabled2['id']);
    ((enabled2['video'] = { ...(enabled2['video'] || {}), activeIndex: activeIndex }),
      (state['pendingDeleteClipId'] = ''),
      (state['selectedClipId'] = enabled2['id']));
    if (enabled3) {
      (resetAdjustmentUi({ close: true }), applyVideoSettings(enabled2));
      const input = count >= 0 && count < handle ? 'previous' : 'next';
      if (!refreshSelectedClip(input)) render();
    } else {
      const output = Number(delta) < 0 || (!delta && activeIndex < record) ? 'previous' : 'next';
      if (!refreshSelectedVideoResult(output)) render();
    }
    return (hideHistory(), schedulePersistence(), true);
  }
  function deleteVideoResult(value2, value3) {
    const value4 = getSelectedEpisode(state),
      clipId = (Array['isArray'](value4?.['clips']) ? value4['clips'] : [])['find'](
        (value5) => normalizeText(value5?.['id']) === normalizeText(value2),
      );
    if (!clipId) return false;
    const resultCount = storyClipProduction['removeVideoResult'](clipId, value3);
    if (!resultCount['changed']) return false;
    clipId['video'] = resultCount['clip']['video'];
    const text = normalizeText(state['selectedClipId']) === normalizeText(clipId['id']);
    if (text && resultCount['activeResultChanged']) {
      if (!refreshSelectedVideoResult(resultCount['direction'])) render();
    } else {
      const root = viewport['querySelector']('.story-page.is-current');
      (text &&
        syncSelectedClipVideoMetadataInPlace(
          root,
          resultCount['activeIndex'],
          resultCount['results']['length'],
        ),
        syncStoryClipCardVideoInPlace({
          root: root,
          documentObject: documentObject,
          clipId: clipId['id'],
          resultCount: resultCount['results']['length'],
          refreshThumbnail: resultCount['activeResultChanged'],
          thumbnailMarkup: resultCount['activeResultChanged']
            ? storyClipProduction['renderTimelineVideoThumbnail'](clipId)
            : '',
        }));
    }
    const value6 = viewport['querySelector']('.story-page.is-current'),
      anchor = findStoryClipCardShell(value6, clipId['id']),
      value7 = Math['min'](
        Math['max'](0, Math['trunc'](Number(value3) || 0)),
        resultCount['results']['length'] - 1,
      );
    return (
      refreshHistory({
        anchor: anchor,
        focusSelector:
          '[data-story-action="select-video-result"][data-story-video-result-index="' + value7 + '"]',
        fallbackFocus: anchor?.['querySelector']?.('.story-clip-card'),
      }),
      schedulePersistence(),
      true
    );
  }
  function switchSelectedVideoResult(delta2) {
    const enabled4 = getSelectedClip(state, getSelectedEpisode(state));
    if (!enabled4) return false;
    return selectVideoResult(
      enabled4['id'],
      storyClipProduction['renderEpisode'](state, getSelectedEpisode(state), enabled4)[
        'getAdjacentVideoResultIndex'
      ](delta2),
      { delta: delta2 },
    );
  }
  function handleNavigationWheel(event) {
    const enabled5 = event['target']['closest']?.('[data-story-clip-navigation="true"]');
    if (!enabled5 || state['view'] !== 'episode') return false;
    event['preventDefault']();
    const consumeWorkspaceWheelDirection2 = consumeWorkspaceWheelDirection(event, item, {
      threshold: 24,
      lockDuration: 220,
    });
    if (consumeWorkspaceWheelDirection2) switchSelectedClip(consumeWorkspaceWheelDirection2);
    return true;
  }
  return {
    deleteVideoResult: deleteVideoResult,
    handleNavigationWheel: handleNavigationWheel,
    selectVideoResult: selectVideoResult,
    switchSelectedClip: switchSelectedClip,
    switchSelectedVideoResult: switchSelectedVideoResult,
  };
}
