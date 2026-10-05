import {
  applyStoryAssetDetailSplitRatioToLayout,
  applyStoryAssetSplitRatioToLayout,
  beginStoryHorizontalResizeSession,
  beginStoryVerticalResizeSession,
} from './storyWorkspaceInteractions.js';
export function createStoryAssetLayoutResizeController({
  state: state,
  viewportElement: viewportElement,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  schedulePersistence: schedulePersistence = null,
} = {}) {
  const onFinish = () => schedulePersistence?.({ uiOnly: true });
  function setAssetSplitRatio(
    value,
    { shouldPersist: shouldPersist = false, layout: layout = null, splitter: splitter = null } = {},
  ) {
    const el =
        layout ||
        viewportElement?.['querySelector']?.('.story-page.is-current .story-assets-layout') ||
        viewportElement?.['querySelector']?.('.story-assets-layout'),
      item = splitter || el?.['querySelector']?.('[data-story-assets-splitter]');
    state['assetSplitRatio'] = applyStoryAssetSplitRatioToLayout(el, item, value);
    if (shouldPersist) onFinish();
    return state['assetSplitRatio'];
  }
  function beginAssetSplitResize(event) {
    const splitter2 = event?.['target']?.['closest']?.('[data-story-assets-splitter]');
    if (!splitter2) return false;
    const layout2 = splitter2['closest']?.('.story-assets-layout');
    return beginStoryHorizontalResizeSession({
      event: event,
      splitter: splitter2,
      layout: layout2,
      windowObject: windowObject,
      body: documentObject?.['body'],
      resizingClass: 'story-assets-resizing',
      onRatio: (key) => setAssetSplitRatio(key, { layout: layout2, splitter: splitter2 }),
      onFinish: onFinish,
    });
  }
  function setAssetDetailSplitRatio(
    index,
    { shouldPersist: shouldPersist = false, layout: layout = null, splitter: splitter = null } = {},
  ) {
    const el2 =
        layout ||
        viewportElement?.['querySelector']?.('.story-page.is-current [data-story-asset-detail-layout]'),
      result = splitter || el2?.['querySelector']?.('[data-story-asset-detail-splitter]');
    state['assetDetailSplitRatio'] = applyStoryAssetDetailSplitRatioToLayout(el2, result, index);
    if (shouldPersist) onFinish();
    return state['assetDetailSplitRatio'];
  }
  function beginAssetDetailSplitResize(event2) {
    const splitter3 = event2?.['target']?.['closest']?.('[data-story-asset-detail-splitter]');
    if (!splitter3) return false;
    const layout3 = splitter3['closest']?.('[data-story-asset-detail-layout]');
    return beginStoryVerticalResizeSession({
      event: event2,
      splitter: splitter3,
      layout: layout3,
      windowObject: windowObject,
      body: documentObject?.['body'],
      resizingClass: 'story-asset-detail-resizing',
      onRatio: (data) => setAssetDetailSplitRatio(data, { layout: layout3, splitter: splitter3 }),
      onFinish: onFinish,
    });
  }
  function handleKeyDown(event3) {
    const options = event3?.['target']?.['closest']?.('[data-story-assets-splitter]');
    if (options && ['ArrowLeft', 'ArrowRight']['includes'](event3['key']))
      return (
        event3['preventDefault']?.(),
        event3['stopPropagation']?.(),
        setAssetSplitRatio(state['assetSplitRatio'] + (event3['key'] === 'ArrowLeft' ? -2 : 2), {
          shouldPersist: true,
        }),
        true
      );
    const enabled = event3?.['target']?.['closest']?.('[data-story-asset-detail-splitter]');
    if (!enabled || !['ArrowUp', 'ArrowDown']['includes'](event3['key'])) return false;
    return (
      event3['preventDefault']?.(),
      event3['stopPropagation']?.(),
      setAssetDetailSplitRatio(state['assetDetailSplitRatio'] + (event3['key'] === 'ArrowUp' ? -2 : 2), {
        shouldPersist: true,
      }),
      true
    );
  }
  return Object['freeze']({
    beginAssetDetailSplitResize: beginAssetDetailSplitResize,
    beginAssetSplitResize: beginAssetSplitResize,
    handleKeyDown: handleKeyDown,
    setAssetDetailSplitRatio: setAssetDetailSplitRatio,
    setAssetSplitRatio: setAssetSplitRatio,
  });
}
