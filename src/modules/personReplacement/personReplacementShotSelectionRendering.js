import { ensureThumbDecoded } from '../refThumbMediaReveal.js';
import { reconcilePersonReplacementStableDom } from './personReplacementStableDom.js';
import {
  captureWorkspaceScrollPosition,
  restoreWorkspaceScrollPosition,
} from '../workspaceWheelNavigation.js';
const VIDEO_REFERENCE_LIST_SELECTOR = '[data-person-replacement-video-reference-list]',
  RESULT_HISTORY_TOGGLE_SELECTOR = ':scope\x20>\x20[data-person-replacement-result-history-toggle]',
  imageSourceReconcileTokens = new WeakMap();
function syncElementAttributes(
  _0x2bcb99,
  _0x4fa7bc,
  { preserveAttributeNames: preserveAttributeNames = [] } = {},
) {
  if (!_0x2bcb99 || !_0x4fa7bc) return ![];
  const _0x2eed7b = new Set(preserveAttributeNames),
    _0x26ce7b = new Set(Array['from'](_0x4fa7bc['attributes'] || [], (_0x63a114) => _0x63a114['name']));
  return (
    Array['from'](_0x2bcb99['attributes'] || [])['forEach']((_0x5353c5) => {
      !_0x2eed7b['has'](_0x5353c5['name']) &&
        !_0x26ce7b['has'](_0x5353c5['name']) &&
        _0x2bcb99['removeAttribute']?.(_0x5353c5['name']);
    }),
    Array['from'](_0x4fa7bc['attributes'] || [])['forEach']((_0x5244b3) => {
      !_0x2eed7b['has'](_0x5244b3['name']) &&
        _0x2bcb99['getAttribute']?.(_0x5244b3['name']) !== _0x5244b3['value'] &&
        _0x2bcb99['setAttribute']?.(_0x5244b3['name'], _0x5244b3['value']);
    }),
    !![]
  );
}
function hasEquivalentNodeShape(_0x1b9630, _0x47e8e9, _0x4bea71 = '') {
  if (!_0x1b9630 || !_0x47e8e9 || _0x1b9630['nodeType'] !== _0x47e8e9['nodeType']) return ![];
  if (_0x1b9630['nodeType'] === 0x1 && _0x1b9630['tagName'] !== _0x47e8e9['tagName']) return ![];
  if (_0x4bea71 && _0x1b9630['matches']?.(_0x4bea71) && _0x47e8e9['matches']?.(_0x4bea71)) return !![];
  const _0x299593 = Array['from'](_0x1b9630['childNodes'] || []),
    _0x353d2c = Array['from'](_0x47e8e9['childNodes'] || []);
  return (
    _0x299593['length'] === _0x353d2c['length'] &&
    _0x299593['every']((_0x5d5e45, _0xabd550) =>
      hasEquivalentNodeShape(_0x5d5e45, _0x353d2c[_0xabd550], _0x4bea71),
    )
  );
}
function reconcileImageNode(_0x200701, _0x5d25cd) {
  const _0x3c859c = String(_0x200701['getAttribute']?.('src') || '')['trim'](),
    _0x440674 = String(_0x5d25cd['getAttribute']?.('src') || '')['trim']();
  if (_0x3c859c === _0x440674) {
    imageSourceReconcileTokens['delete'](_0x200701);
    const _0x3885b0 =
      _0x200701['classList']?.['contains']?.('is-ready') &&
      _0x5d25cd['classList']?.['contains']?.('ref-thumb-media');
    syncElementAttributes(_0x200701, _0x5d25cd, { preserveAttributeNames: _0x3885b0 ? ['class'] : [] });
    if (_0x3885b0) {
      const _0x4209b1 = new Set(
        String(_0x5d25cd['getAttribute']('class') || '')
          ['split'](/\s+/)
          ['filter'](Boolean),
      );
      (_0x4209b1['delete']('is-pending'), _0x4209b1['add']('is-ready'));
      const _0x3246dd = [..._0x4209b1]['join']('\x20');
      if (_0x200701['getAttribute']('class') !== _0x3246dd) _0x200701['setAttribute']('class', _0x3246dd);
    }
    return;
  }
  const _0x235e7c = Symbol(_0x440674);
  (imageSourceReconcileTokens['set'](_0x200701, _0x235e7c),
    syncElementAttributes(_0x200701, _0x5d25cd, { preserveAttributeNames: ['src'] }));
  const _0x126507 = (_0x1101ee) => {
    if (imageSourceReconcileTokens['get'](_0x200701) !== _0x235e7c || _0x200701['isConnected'] === ![])
      return;
    (syncElementAttributes(_0x200701, _0x5d25cd),
      _0x1101ee &&
        _0x200701['classList']?.['contains']?.('ref-thumb-media') &&
        (_0x200701['classList']['remove']('is-pending'), _0x200701['classList']['add']('is-ready')),
      imageSourceReconcileTokens['delete'](_0x200701));
  };
  if (!_0x440674) {
    _0x126507(![]);
    return;
  }
  ensureThumbDecoded(_0x440674)['then'](_0x126507, () => _0x126507(![]));
}
function syncEquivalentNodeTree(
  _0x30abad,
  _0x2d8b12,
  { preserveImageNodes: preserveImageNodes = ![], preserveSelector: preserveSelector = '' } = {},
) {
  if (
    preserveSelector &&
    _0x30abad['matches']?.(preserveSelector) &&
    _0x2d8b12['matches']?.(preserveSelector)
  )
    return;
  if (
    _0x30abad?.['nodeType'] === 0x1 &&
    _0x2d8b12?.['nodeType'] === 0x1 &&
    _0x30abad['tagName'] === 'IMG' &&
    _0x2d8b12['tagName'] === 'IMG'
  ) {
    if (preserveImageNodes) reconcileImageNode(_0x30abad, _0x2d8b12);
    else
      _0x30abad['getAttribute']?.('src') !== _0x2d8b12['getAttribute']?.('src') &&
      typeof _0x30abad['replaceWith'] === 'function'
        ? _0x30abad['replaceWith'](_0x2d8b12)
        : syncElementAttributes(_0x30abad, _0x2d8b12);
    return;
  }
  if (_0x30abad['nodeType'] === 0x1) syncElementAttributes(_0x30abad, _0x2d8b12);
  else _0x30abad['nodeValue'] !== _0x2d8b12['nodeValue'] && (_0x30abad['nodeValue'] = _0x2d8b12['nodeValue']);
  const _0x4cc507 = Array['from'](_0x30abad['childNodes'] || []),
    _0x159242 = Array['from'](_0x2d8b12['childNodes'] || []);
  _0x4cc507['forEach']((_0x4680b2, _0x41dd90) => {
    syncEquivalentNodeTree(_0x4680b2, _0x159242[_0x41dd90], {
      preserveImageNodes: preserveImageNodes,
      preserveSelector: preserveSelector,
    });
  });
}
export function reconcileElementTree(
  _0x7510a9,
  _0x5b59ec,
  {
    preserveImageNodes: preserveImageNodes = ![],
    preserveSelector: preserveSelector = '',
    preserveChildNodes: preserveChildNodes = ![],
  } = {},
) {
  if (!_0x7510a9 || !_0x5b59ec) return ![];
  if (preserveChildNodes)
    return reconcilePersonReplacementStableDom(_0x7510a9, _0x5b59ec, {
      preserveSelector: preserveSelector,
      syncAttributes: syncElementAttributes,
      syncImage: reconcileImageNode,
    });
  if (hasEquivalentNodeShape(_0x7510a9, _0x5b59ec, preserveSelector))
    return (
      syncEquivalentNodeTree(_0x7510a9, _0x5b59ec, {
        preserveImageNodes: preserveImageNodes,
        preserveSelector: preserveSelector,
      }),
      !![]
    );
  return (
    syncElementAttributes(_0x7510a9, _0x5b59ec),
    _0x7510a9['replaceChildren']?.(...Array['from'](_0x5b59ec['childNodes'] || [])),
    !![]
  );
}
function getShotTimelineCardRoot(_0x19b343) {
  const _0x21209d = _0x19b343?.['parentElement'];
  return _0x21209d?.['matches']?.('.person-replacement-shot-card-shell') ? _0x21209d : _0x19b343;
}
function reconcileShotTimelineCardPair(_0x547003, _0x151f26) {
  if (!_0x547003 || !_0x151f26) return null;
  const _0x12b04d = getShotTimelineCardRoot(_0x547003),
    _0x4fcc55 = getShotTimelineCardRoot(_0x151f26),
    _0x10235d = _0x12b04d?.['querySelector']?.(RESULT_HISTORY_TOGGLE_SELECTOR),
    _0x3445ee = _0x4fcc55?.['querySelector']?.(RESULT_HISTORY_TOGGLE_SELECTOR),
    _0x5d9625 = Array['from'](_0x12b04d?.['querySelectorAll']?.('img') || []),
    _0x45379c = Array['from'](_0x4fcc55?.['querySelectorAll']?.('img') || []);
  return (
    _0x5d9625['forEach']((_0x4c19cd, _0xe08572) => {
      const _0x423d69 = _0x45379c[_0xe08572];
      if (!_0x423d69) return;
      (reconcileElementTree(_0x4c19cd, _0x423d69, { preserveImageNodes: !![] }),
        _0x423d69['replaceWith'](_0x4c19cd));
    }),
    reconcileElementTree(_0x547003, _0x151f26, { preserveImageNodes: !![] }),
    _0x151f26['replaceWith'](_0x547003),
    _0x10235d &&
      _0x3445ee &&
      (reconcileElementTree(_0x10235d, _0x3445ee), _0x3445ee['replaceWith'](_0x10235d)),
    { currentRoot: _0x12b04d, nextRoot: _0x4fcc55 === _0x151f26 ? _0x547003 : _0x4fcc55 }
  );
}
export function reconcilePersonReplacementShotTimelineCard({
  currentScroller: _0x56f63e,
  nextScroller: _0x47b1ab,
  shotId: shotId = '',
} = {}) {
  const _0x5da83f = String(shotId ?? '')['trim']();
  if (!_0x5da83f) return ![];
  const _0x1881b7 = (_0x376149) =>
      Array['from'](
        _0x376149?.['querySelectorAll']?.('[data-person-replacement-shot-card=\x22true\x22]') || [],
      )['find']((_0x1de7c9) => String(_0x1de7c9['dataset']?.['shotId'] ?? '')['trim']() === _0x5da83f),
    _0x44572f = _0x1881b7(_0x56f63e),
    _0x4e3c23 = _0x1881b7(_0x47b1ab);
  if (!_0x44572f || !_0x4e3c23) return ![];
  const _0x10e745 = getShotTimelineCardRoot(_0x44572f),
    _0x1f1513 = _0x10e745?.['parentElement'],
    _0x2bbda8 = _0x10e745?.['nextSibling'] || null;
  if (!_0x1f1513 || typeof _0x1f1513['insertBefore'] !== 'function') return ![];
  const _0x8033ee = reconcileShotTimelineCardPair(_0x44572f, _0x4e3c23);
  if (!_0x8033ee?.['nextRoot']) return ![];
  return (
    _0x8033ee['currentRoot']?.['parentElement'] === _0x1f1513
      ? _0x8033ee['currentRoot']['replaceWith'](_0x8033ee['nextRoot'])
      : _0x1f1513['insertBefore'](_0x8033ee['nextRoot'], _0x2bbda8),
    !![]
  );
}
export function reconcilePersonReplacementShotCardList({ currentList: _0x2610bf, nextList: _0x411eb4 } = {}) {
  if (!_0x2610bf || !_0x411eb4) return ![];
  return reconcileElementTree(_0x2610bf, _0x411eb4, { preserveChildNodes: !![] });
}
function getDirectShotPreview(_0x975371) {
  return (
    Array['from'](_0x975371?.['children'] || [])['find'](
      (_0x1dc2df) =>
        !_0x1dc2df['matches']?.('[data-person-replacement-shot-timeline-stage]') &&
        !_0x1dc2df['matches']?.('[data-person-replacement-layout-splitter="center"]') &&
        !_0x1dc2df['matches']?.('.person-replacement-middle-preview-slide--outgoing'),
    ) || null
  );
}
function getVideoReferenceCards(_0x34e1b3) {
  return Array['from'](
    _0x34e1b3?.['querySelectorAll']?.('[data-person-replacement-video-reference-index]') || [],
  );
}
function getVideoReferenceCardKey(_0x1f212e) {
  return String(
    _0x1f212e?.['dataset']?.['personReplacementVideoReferenceKey'] ||
      _0x1f212e?.['dataset']?.['personReplacementVideoReferenceIndex'] ||
      '',
  );
}
function prepareVideoReferenceCardPairs(_0x22161d, _0xbab2a7) {
  const _0x5c0750 = new Map(
    getVideoReferenceCards(_0xbab2a7)['map']((_0x24db4d) => [getVideoReferenceCardKey(_0x24db4d), _0x24db4d]),
  );
  return getVideoReferenceCards(_0x22161d)
    ['map']((_0x321afd) => ({
      currentCard: _0x321afd,
      nextCard: _0x5c0750['get'](getVideoReferenceCardKey(_0x321afd)),
    }))
    ['filter'](({ nextCard: _0x15278c }) => _0x15278c);
}
function reconcileVideoElementTree(_0x529cc3, _0x58b39e) {
  return reconcileElementTree(_0x529cc3, _0x58b39e, { preserveImageNodes: !![] });
}
function reconcileVideoReferenceRail(_0xb6ecf2, _0x26c873) {
  if (!_0xb6ecf2 || !_0x26c873) return ![];
  const _0x53ad28 = captureWorkspaceScrollPosition(
      _0xb6ecf2['querySelector']?.(VIDEO_REFERENCE_LIST_SELECTOR),
    ),
    _0xc8a35a = () =>
      restoreWorkspaceScrollPosition(_0xb6ecf2['querySelector']?.(VIDEO_REFERENCE_LIST_SELECTOR), _0x53ad28);
  if (hasEquivalentNodeShape(_0xb6ecf2, _0x26c873)) {
    const _0xb2a242 = reconcileVideoElementTree(_0xb6ecf2, _0x26c873);
    return (_0xc8a35a(), _0xb2a242);
  }
  prepareVideoReferenceCardPairs(_0xb6ecf2, _0x26c873)['forEach'](
    ({ currentCard: _0x1038f9, nextCard: _0x35af84 }) => {
      (reconcileVideoElementTree(_0x1038f9, _0x35af84), _0x35af84['replaceWith'](_0x1038f9));
    },
  );
  const _0x1e184b = reconcileVideoElementTree(_0xb6ecf2, _0x26c873);
  return (_0xc8a35a(), _0x1e184b);
}
export function reconcilePersonReplacementReferenceInputs({
  currentInputs: _0x347ffe,
  nextInputs: _0x438811,
} = {}) {
  if (!_0x347ffe || !_0x438811) return ![];
  const _0x13f383 = new Map(
    Array['from'](_0x438811['querySelectorAll']?.('[data-slot]') || [])['map']((_0x424375) => [
      String(_0x424375['dataset']?.['slot'] || ''),
      _0x424375,
    ]),
  );
  return (
    Array['from'](_0x347ffe['querySelectorAll']?.('[data-slot]') || [])['forEach']((_0x38b54e) => {
      const _0x3f4afc = _0x13f383['get'](String(_0x38b54e['dataset']?.['slot'] || ''));
      if (!_0x3f4afc) return;
      if (_0x38b54e['tagName'] !== _0x3f4afc['tagName']) return;
      (reconcileVideoElementTree(_0x38b54e, _0x3f4afc), _0x3f4afc['replaceWith'](_0x38b54e));
    }),
    reconcileVideoElementTree(_0x347ffe, _0x438811),
    _0x438811['replaceWith'](_0x347ffe),
    !![]
  );
}
export function reconcilePersonReplacementVideoControlContinuity({
  currentReferenceRail: _0x62d94c,
  nextReferenceRail: _0x56a96f,
  currentReferenceInputs: _0xac0a91,
  nextReferenceInputs: _0x191cd8,
  currentPromptEditor: _0x3a7ab4,
  nextPromptEditor: _0x287df2,
} = {}) {
  if (!_0x62d94c || !_0x56a96f || !_0xac0a91 || !_0x191cd8 || !_0x3a7ab4 || !_0x287df2) return ![];
  if (!reconcileVideoReferenceRail(_0x62d94c, _0x56a96f)) return ![];
  if (!reconcilePersonReplacementReferenceInputs({ currentInputs: _0xac0a91, nextInputs: _0x191cd8 }))
    return ![];
  return (syncElementAttributes(_0x3a7ab4, _0x287df2), _0x287df2['replaceWith'](_0x3a7ab4), !![]);
}
function collectVideoShotSelectionElements(_0x55fd63, _0x23f5fb) {
  const _0xa4cf4a = _0x55fd63?.['querySelector']?.('.person-replacement-middle-layout'),
    _0x2e44e6 = _0x23f5fb?.['querySelector']?.('.person-replacement-middle-layout'),
    _0x190332 = _0xa4cf4a?.['querySelector']?.('[data-person-replacement-shot-timeline-stage]'),
    _0x4c1b6f = _0x2e44e6?.['querySelector']?.('[data-person-replacement-shot-timeline-stage]'),
    _0x16b733 = _0x55fd63?.['querySelector']?.('.person-replacement-video-generation-panel'),
    _0x1ce9fc = _0x23f5fb?.['querySelector']?.('.person-replacement-video-generation-panel');
  return {
    currentReferenceRail: _0x55fd63?.['querySelector']?.('.person-replacement-video-reference-assets'),
    nextReferenceRail: _0x23f5fb?.['querySelector']?.('.person-replacement-video-reference-assets'),
    currentLeftSplitter: _0x55fd63?.['querySelector']?.('[data-person-replacement-layout-splitter="left"]'),
    nextLeftSplitter: _0x23f5fb?.['querySelector']?.('[data-person-replacement-layout-splitter="left"]'),
    currentMiddle: _0xa4cf4a,
    nextMiddle: _0x2e44e6,
    currentPreview: getDirectShotPreview(_0xa4cf4a),
    nextPreview: getDirectShotPreview(_0x2e44e6),
    currentScroller: _0x190332?.['querySelector']?.('[data-person-replacement-shot-timeline-scroll]'),
    nextScroller: _0x4c1b6f?.['querySelector']?.('[data-person-replacement-shot-timeline-scroll]'),
    currentRightSplitter: _0x55fd63?.['querySelector']?.(
      '[data-person-replacement-layout-splitter=\x22right\x22]',
    ),
    nextRightSplitter: _0x23f5fb?.['querySelector']?.(
      '[data-person-replacement-layout-splitter=\x22right\x22]',
    ),
    currentGenerationPanel: _0x16b733,
    nextGenerationPanel: _0x1ce9fc,
    currentReferenceInputs: _0x16b733?.['querySelector']?.(
      '[data-person-replacement-video-reference-inputs]',
    ),
    nextReferenceInputs: _0x1ce9fc?.['querySelector']?.('[data-person-replacement-video-reference-inputs]'),
    currentFooter: _0x55fd63?.['querySelector']?.('.person-replacement-step-footer'),
    nextFooter: _0x23f5fb?.['querySelector']?.('.person-replacement-step-footer'),
  };
}
export function reconcilePersonReplacementVideoShotSelection({
  currentPage: _0x757b57,
  nextPage: _0x1718e0,
} = {}) {
  const _0x8b4923 = collectVideoShotSelectionElements(_0x757b57, _0x1718e0);
  if (Object['values'](_0x8b4923)['some']((_0x2bad5b) => !_0x2bad5b)) return ![];
  if (!reconcileVideoReferenceRail(_0x8b4923['currentReferenceRail'], _0x8b4923['nextReferenceRail']))
    return ![];
  if (
    !reconcilePersonReplacementReferenceInputs({
      currentInputs: _0x8b4923['currentReferenceInputs'],
      nextInputs: _0x8b4923['nextReferenceInputs'],
    })
  )
    return ![];
  return (
    reconcileVideoElementTree(_0x8b4923['currentPreview'], _0x8b4923['nextPreview']),
    _0x8b4923['nextPreview']['replaceWith'](_0x8b4923['currentPreview']),
    reconcilePersonReplacementShotCardList({
      currentList: _0x8b4923['currentScroller'],
      nextList: _0x8b4923['nextScroller'],
    }),
    _0x8b4923['nextScroller']['replaceWith'](_0x8b4923['currentScroller']),
    reconcileVideoElementTree(_0x8b4923['currentLeftSplitter'], _0x8b4923['nextLeftSplitter']),
    reconcileVideoElementTree(_0x8b4923['currentMiddle'], _0x8b4923['nextMiddle']),
    reconcileVideoElementTree(_0x8b4923['currentRightSplitter'], _0x8b4923['nextRightSplitter']),
    reconcileVideoElementTree(_0x8b4923['currentGenerationPanel'], _0x8b4923['nextGenerationPanel']),
    reconcileVideoElementTree(_0x8b4923['currentFooter'], _0x8b4923['nextFooter']),
    !![]
  );
}
function getTargetCharacterCards(_0x3224e5) {
  return Array['from'](
    _0x3224e5?.['querySelectorAll']?.('[data-person-replacement-target-character-id]') || [],
  );
}
function prepareTargetCardPairs(_0x5c3863, _0x29e79c) {
  const _0x4c4119 = new Map(
    getTargetCharacterCards(_0x29e79c)['map']((_0x548caa) => [
      _0x548caa['dataset']?.['personReplacementTargetCharacterId'] || '',
      _0x548caa,
    ]),
  );
  return getTargetCharacterCards(_0x5c3863)['map']((_0x1d60f3) => {
    const _0x176c94 = _0x4c4119['get'](_0x1d60f3['dataset']?.['personReplacementTargetCharacterId'] || '');
    return {
      currentCard: _0x1d60f3,
      nextCard: _0x176c94,
      currentMedia: _0x1d60f3['querySelector']?.('.story-asset-card-media'),
      nextMedia: _0x176c94?.['querySelector']?.('.story-asset-card-media'),
    };
  });
}
function reconcileTargetCardPair({
  currentCard: _0x1fd5fe,
  nextCard: _0x1555c9,
  currentMedia: _0x4055ca,
  nextMedia: _0x404804,
}) {
  (syncElementAttributes(_0x1fd5fe, _0x1555c9),
    reconcileElementTree(_0x4055ca, _0x404804, { preserveImageNodes: !![] }));
}
function reconcileGenerationCopy(_0x4588ab) {
  const {
    currentCopy: _0x3552b8,
    nextCopy: _0x4ee892,
    currentPromptField: _0x1150fc,
    nextPromptField: _0x3d6cb0,
    currentPromptHeading: _0x12f3d0,
    nextPromptHeading: _0x342f96,
    currentPromptReferenceInputs: _0x1fcd7c,
    nextPromptReferenceInputs: _0x3db58b,
    currentPromptEditor: _0x3414b5,
    nextPromptEditor: _0x1c25c2,
    currentFooter: _0x36eafc,
    nextFooter: _0xa5fb6f,
    currentGenerateButton: _0x3a2e79,
    nextGenerateButton: _0x2ffbc0,
  } = _0x4588ab;
  (syncElementAttributes(_0x3552b8, _0x4ee892),
    syncElementAttributes(_0x1150fc, _0x3d6cb0),
    reconcilePersonReplacementReferenceInputs({ currentInputs: _0x1fcd7c, nextInputs: _0x3db58b }),
    reconcileElementTree(_0x12f3d0, _0x342f96, { preserveImageNodes: !![] }),
    reconcileElementTree(_0x3414b5, _0x1c25c2, { preserveImageNodes: !![] }),
    syncElementAttributes(_0x36eafc, _0xa5fb6f),
    _0x3a2e79['replaceWith']?.(_0x2ffbc0),
    Array['from'](_0x3552b8['children'] || [])
      ['filter']((_0x1ccd23) => _0x1ccd23 !== _0x1150fc && _0x1ccd23 !== _0x36eafc)
      ['forEach']((_0x8f7568) => _0x8f7568['remove']?.()));
  let _0x3560a3 = ![];
  Array['from'](_0x4ee892['children'] || [])['forEach']((_0x1d7b54) => {
    if (_0x1d7b54 === _0x3d6cb0) return;
    if (_0x1d7b54 === _0xa5fb6f) {
      _0x3560a3 = !![];
      return;
    }
    if (_0x3560a3) _0x3552b8['append']?.(_0x1d7b54);
    else _0x3552b8['insertBefore']?.(_0x1d7b54, _0x36eafc);
  });
}
function collectImageShotSelectionElements(_0x47bcf0, _0x102707) {
  const _0x53c4da = _0x47bcf0?.['querySelector']?.('.person-replacement-middle-layout'),
    _0x39437e = _0x102707?.['querySelector']?.('.person-replacement-middle-layout'),
    _0x29bdcb = _0x47bcf0?.['querySelector']?.('.person-replacement-target-assets'),
    _0x4b2963 = _0x102707?.['querySelector']?.('.person-replacement-target-assets'),
    _0x2d4851 = _0x47bcf0?.['querySelector']?.('.person-replacement-image-generation-panel'),
    _0x59fb62 = _0x102707?.['querySelector']?.('.person-replacement-image-generation-panel'),
    _0x6031fc = _0x2d4851?.['querySelector']?.('.person-replacement-generation-copy'),
    _0x519c30 = _0x59fb62?.['querySelector']?.('.person-replacement-generation-copy'),
    _0xb6e8ff = _0x6031fc?.['querySelector']?.('.person-replacement-prompt-field'),
    _0x1be64a = _0x519c30?.['querySelector']?.('.person-replacement-prompt-field'),
    _0x4ca6f1 = _0x6031fc?.['querySelector']?.('.prompt-panel-footer'),
    _0x417058 = _0x519c30?.['querySelector']?.('.prompt-panel-footer');
  return {
    currentMiddle: _0x53c4da,
    nextMiddle: _0x39437e,
    currentPreview: getDirectShotPreview(_0x53c4da),
    nextPreview: getDirectShotPreview(_0x39437e),
    currentTargetRail: _0x29bdcb,
    nextTargetRail: _0x4b2963,
    currentGenerationPanel: _0x2d4851,
    nextGenerationPanel: _0x59fb62,
    currentResultPreview: _0x2d4851?.['querySelector']?.('.person-replacement-generation-preview'),
    nextResultPreview: _0x59fb62?.['querySelector']?.('.person-replacement-generation-preview'),
    currentCopy: _0x6031fc,
    nextCopy: _0x519c30,
    currentPromptField: _0xb6e8ff,
    nextPromptField: _0x1be64a,
    currentPromptHeading: _0xb6e8ff?.['querySelector']?.('.person-replacement-prompt-field-heading'),
    nextPromptHeading: _0x1be64a?.['querySelector']?.('.person-replacement-prompt-field-heading'),
    currentPromptReferenceInputs: _0xb6e8ff?.['querySelector']?.(
      '.person-replacement-prompt-reference-inputs',
    ),
    nextPromptReferenceInputs: _0x1be64a?.['querySelector']?.('.person-replacement-prompt-reference-inputs'),
    currentPromptEditor: _0xb6e8ff?.['querySelector']?.(
      '[data-person-replacement-field=\x22image-prompt\x22]',
    ),
    nextPromptEditor: _0x1be64a?.['querySelector']?.('[data-person-replacement-field=\x22image-prompt\x22]'),
    currentFooter: _0x4ca6f1,
    nextFooter: _0x417058,
    currentModelSelector: _0x4ca6f1?.['querySelector']?.('[data-aigen-image-model-selector]'),
    nextModelSelector: _0x417058?.['querySelector']?.('[data-aigen-image-model-selector]'),
    currentGenerateButton: _0x4ca6f1?.['querySelector']?.(
      '[data-person-replacement-action="generate-replacement-image"]',
    ),
    nextGenerateButton: _0x417058?.['querySelector']?.(
      '[data-person-replacement-action=\x22generate-replacement-image\x22]',
    ),
  };
}
export function reconcilePersonReplacementImageShotSelection({
  currentPage: _0x11f33b,
  nextPage: _0x2e5ef6,
} = {}) {
  const _0x7778e1 = collectImageShotSelectionElements(_0x11f33b, _0x2e5ef6),
    _0x20dc93 = prepareTargetCardPairs(_0x7778e1['currentTargetRail'], _0x7778e1['nextTargetRail']),
    _0x2f2de5 = Object['values'](_0x7778e1);
  if (
    _0x2f2de5['some']((_0x310e1c) => !_0x310e1c) ||
    _0x20dc93['some']((_0x5dab6d) => Object['values'](_0x5dab6d)['some']((_0x1f9f64) => !_0x1f9f64))
  )
    return ![];
  return (
    reconcileElementTree(_0x7778e1['currentPreview'], _0x7778e1['nextPreview'], { preserveImageNodes: !![] }),
    _0x20dc93['forEach'](reconcileTargetCardPair),
    _0x7778e1['currentResultPreview']
      ['querySelectorAll']?.('.person-replacement-image-preview-slide--outgoing')
      ?.['forEach']?.((_0x18a5b8) => _0x18a5b8['remove']?.()),
    reconcileElementTree(_0x7778e1['currentResultPreview'], _0x7778e1['nextResultPreview'], {
      preserveImageNodes: !![],
    }),
    reconcileGenerationCopy(_0x7778e1),
    !![]
  );
}
