import {
  applyStoryAssetDetailSplitRatioToLayout,
  applyStoryAssetSplitRatioToLayout,
  beginStoryHorizontalResizeSession,
  beginStoryVerticalResizeSession,
} from './storyWorkspaceInteractions.js';
export function createStoryAssetLayoutResizeController({
  state: _0x5bc272,
  viewportElement: _0x32c7f7,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  schedulePersistence: schedulePersistence = null,
} = {}) {
  const _0x2bf2f3 = () => schedulePersistence?.({ uiOnly: !![] });
  function _0x10ef93(
    _0x261c8a,
    { shouldPersist: shouldPersist = ![], layout: layout = null, splitter: splitter = null } = {},
  ) {
    const _0xa99c12 =
        layout ||
        _0x32c7f7?.['querySelector']?.('.story-page.is-current\x20.story-assets-layout') ||
        _0x32c7f7?.['querySelector']?.('.story-assets-layout'),
      _0x16913c = splitter || _0xa99c12?.['querySelector']?.('[data-story-assets-splitter]');
    _0x5bc272['assetSplitRatio'] = applyStoryAssetSplitRatioToLayout(_0xa99c12, _0x16913c, _0x261c8a);
    if (shouldPersist) _0x2bf2f3();
    return _0x5bc272['assetSplitRatio'];
  }
  function _0x4e5e41(_0x5c9bdb) {
    const _0x40b488 = _0x5c9bdb?.['target']?.['closest']?.('[data-story-assets-splitter]');
    if (!_0x40b488) return ![];
    const _0x1006c8 = _0x40b488['closest']?.('.story-assets-layout');
    return beginStoryHorizontalResizeSession({
      event: _0x5c9bdb,
      splitter: _0x40b488,
      layout: _0x1006c8,
      windowObject: windowObject,
      body: documentObject?.['body'],
      resizingClass: 'story-assets-resizing',
      onRatio: (_0xeb50c2) => _0x10ef93(_0xeb50c2, { layout: _0x1006c8, splitter: _0x40b488 }),
      onFinish: _0x2bf2f3,
    });
  }
  function _0x1fad7c(
    _0x2668e1,
    { shouldPersist: shouldPersist = ![], layout: layout = null, splitter: splitter = null } = {},
  ) {
    const _0x49f234 =
        layout || _0x32c7f7?.['querySelector']?.('.story-page.is-current [data-story-asset-detail-layout]'),
      _0x227699 = splitter || _0x49f234?.['querySelector']?.('[data-story-asset-detail-splitter]');
    _0x5bc272['assetDetailSplitRatio'] = applyStoryAssetDetailSplitRatioToLayout(
      _0x49f234,
      _0x227699,
      _0x2668e1,
    );
    if (shouldPersist) _0x2bf2f3();
    return _0x5bc272['assetDetailSplitRatio'];
  }
  function _0x42979c(_0x13cf2a) {
    const _0x15f76d = _0x13cf2a?.['target']?.['closest']?.('[data-story-asset-detail-splitter]');
    if (!_0x15f76d) return ![];
    const _0x5df686 = _0x15f76d['closest']?.('[data-story-asset-detail-layout]');
    return beginStoryVerticalResizeSession({
      event: _0x13cf2a,
      splitter: _0x15f76d,
      layout: _0x5df686,
      windowObject: windowObject,
      body: documentObject?.['body'],
      resizingClass: 'story-asset-detail-resizing',
      onRatio: (_0x53b9b9) => _0x1fad7c(_0x53b9b9, { layout: _0x5df686, splitter: _0x15f76d }),
      onFinish: _0x2bf2f3,
    });
  }
  function _0x2f54ed(_0x390825) {
    const _0x19c1d2 = _0x390825?.['target']?.['closest']?.('[data-story-assets-splitter]');
    if (_0x19c1d2 && ['ArrowLeft', 'ArrowRight']['includes'](_0x390825['key']))
      return (
        _0x390825['preventDefault']?.(),
        _0x390825['stopPropagation']?.(),
        _0x10ef93(_0x5bc272['assetSplitRatio'] + (_0x390825['key'] === 'ArrowLeft' ? -0x2 : 0x2), {
          shouldPersist: !![],
        }),
        !![]
      );
    const _0x8494dd = _0x390825?.['target']?.['closest']?.('[data-story-asset-detail-splitter]');
    if (!_0x8494dd || !['ArrowUp', 'ArrowDown']['includes'](_0x390825['key'])) return ![];
    return (
      _0x390825['preventDefault']?.(),
      _0x390825['stopPropagation']?.(),
      _0x1fad7c(_0x5bc272['assetDetailSplitRatio'] + (_0x390825['key'] === 'ArrowUp' ? -0x2 : 0x2), {
        shouldPersist: !![],
      }),
      !![]
    );
  }
  return Object['freeze']({
    beginAssetDetailSplitResize: _0x42979c,
    beginAssetSplitResize: _0x4e5e41,
    handleKeyDown: _0x2f54ed,
    setAssetDetailSplitRatio: _0x1fad7c,
    setAssetSplitRatio: _0x10ef93,
  });
}
