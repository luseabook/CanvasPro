import { ensureThumbDecoded } from '../refThumbMediaReveal.js';
import { reconcilePersonReplacementStableDom } from './personReplacementStableDom.js';
import {
  captureWorkspaceScrollPosition,
  restoreWorkspaceScrollPosition,
} from '../workspaceWheelNavigation.js';
const VIDEO_REFERENCE_LIST_SELECTOR = '[data-person-replacement-video-reference-list]',
  RESULT_HISTORY_TOGGLE_SELECTOR = ':scope > [data-person-replacement-result-history-toggle]',
  imageSourceReconcileTokens = new WeakMap();
function syncElementAttributes(el, enabled, { preserveAttributeNames: preserveAttributeNames = [] } = {}) {
  if (!el || !enabled) return false;
  const map = new Set(preserveAttributeNames),
    map2 = new Set(Array['from'](enabled['attributes'] || [], (error) => error['name']));
  return (
    Array['from'](el['attributes'] || [])['forEach']((error2) => {
      !map['has'](error2['name']) && !map2['has'](error2['name']) && el['removeAttribute']?.(error2['name']);
    }),
    Array['from'](enabled['attributes'] || [])['forEach']((el2) => {
      !map['has'](el2['name']) &&
        el['getAttribute']?.(el2['name']) !== el2['value'] &&
        el['setAttribute']?.(el2['name'], el2['value']);
    }),
    true
  );
}
function hasEquivalentNodeShape(enabled2, enabled3, value = '') {
  if (!enabled2 || !enabled3 || enabled2['nodeType'] !== enabled3['nodeType']) return false;
  if (enabled2['nodeType'] === 1 && enabled2['tagName'] !== enabled3['tagName']) return false;
  if (value && enabled2['matches']?.(value) && enabled3['matches']?.(value)) return true;
  const list = Array['from'](enabled2['childNodes'] || []),
    list2 = Array['from'](enabled3['childNodes'] || []);
  return (
    list['length'] === list2['length'] &&
    list['every']((item, key) => hasEquivalentNodeShape(item, list2[key], value))
  );
}
function reconcileImageNode(el3, el4) {
  const index = String(el3['getAttribute']?.('src') || '')['trim'](),
    enabled4 = String(el4['getAttribute']?.('src') || '')['trim']();
  if (index === enabled4) {
    imageSourceReconcileTokens['delete'](el3);
    const preserveAttributeNames2 =
      el3['classList']?.['contains']?.('is-ready') && el4['classList']?.['contains']?.('ref-thumb-media');
    syncElementAttributes(el3, el4, { preserveAttributeNames: preserveAttributeNames2 ? ['class'] : [] });
    if (preserveAttributeNames2) {
      const map3 = new Set(
        String(el4['getAttribute']('class') || '')
          ['split'](/\s+/)
          ['filter'](Boolean),
      );
      (map3['delete']('is-pending'), map3['add']('is-ready'));
      const result = [...map3]['join'](' ');
      if (el3['getAttribute']('class') !== result) el3['setAttribute']('class', result);
    }
    return;
  }
  const symbol = Symbol(enabled4);
  (imageSourceReconcileTokens['set'](el3, symbol),
    syncElementAttributes(el3, el4, { preserveAttributeNames: ['src'] }));
  const run = (data) => {
    if (imageSourceReconcileTokens['get'](el3) !== symbol || el3['isConnected'] === false) return;
    (syncElementAttributes(el3, el4),
      data &&
        el3['classList']?.['contains']?.('ref-thumb-media') &&
        (el3['classList']['remove']('is-pending'), el3['classList']['add']('is-ready')),
      imageSourceReconcileTokens['delete'](el3));
  };
  if (!enabled4) {
    run(false);
    return;
  }
  ensureThumbDecoded(enabled4)['then'](run, () => run(false));
}
function syncEquivalentNodeTree(
  options,
  target,
  { preserveImageNodes: preserveImageNodes = false, preserveSelector: preserveSelector = '' } = {},
) {
  if (preserveSelector && options['matches']?.(preserveSelector) && target['matches']?.(preserveSelector))
    return;
  if (
    options?.['nodeType'] === 1 &&
    target?.['nodeType'] === 1 &&
    options['tagName'] === 'IMG' &&
    target['tagName'] === 'IMG'
  ) {
    if (preserveImageNodes) reconcileImageNode(options, target);
    else
      options['getAttribute']?.('src') !== target['getAttribute']?.('src') &&
      typeof options['replaceWith'] === 'function'
        ? options['replaceWith'](target)
        : syncElementAttributes(options, target);
    return;
  }
  if (options['nodeType'] === 1) syncElementAttributes(options, target);
  else options['nodeValue'] !== target['nodeValue'] && (options['nodeValue'] = target['nodeValue']);
  const list3 = Array['from'](options['childNodes'] || []),
    source = Array['from'](target['childNodes'] || []);
  list3['forEach']((next, current) => {
    syncEquivalentNodeTree(next, source[current], {
      preserveImageNodes: preserveImageNodes,
      preserveSelector: preserveSelector,
    });
  });
}
export function reconcileElementTree(
  enabled5,
  enabled6,
  {
    preserveImageNodes: preserveImageNodes = false,
    preserveSelector: preserveSelector = '',
    preserveChildNodes: preserveChildNodes = false,
  } = {},
) {
  if (!enabled5 || !enabled6) return false;
  if (preserveChildNodes)
    return reconcilePersonReplacementStableDom(enabled5, enabled6, {
      preserveSelector: preserveSelector,
      syncAttributes: syncElementAttributes,
      syncImage: reconcileImageNode,
    });
  if (hasEquivalentNodeShape(enabled5, enabled6, preserveSelector))
    return (
      syncEquivalentNodeTree(enabled5, enabled6, {
        preserveImageNodes: preserveImageNodes,
        preserveSelector: preserveSelector,
      }),
      true
    );
  return (
    syncElementAttributes(enabled5, enabled6),
    enabled5['replaceChildren']?.(...Array['from'](enabled6['childNodes'] || [])),
    true
  );
}
function getShotTimelineCardRoot(entry) {
  const record = entry?.['parentElement'];
  return record?.['matches']?.('.person-replacement-shot-card-shell') ? record : entry;
}
function reconcileShotTimelineCardPair(enabled7, enabled8) {
  if (!enabled7 || !enabled8) return null;
  const currentRoot = getShotTimelineCardRoot(enabled7),
    nextRoot = getShotTimelineCardRoot(enabled8),
    payload = currentRoot?.['querySelector']?.(RESULT_HISTORY_TOGGLE_SELECTOR),
    handle = nextRoot?.['querySelector']?.(RESULT_HISTORY_TOGGLE_SELECTOR),
    list4 = Array['from'](currentRoot?.['querySelectorAll']?.('img') || []),
    state = Array['from'](nextRoot?.['querySelectorAll']?.('img') || []);
  return (
    list4['forEach']((config, scope) => {
      const enabled9 = state[scope];
      if (!enabled9) return;
      (reconcileElementTree(config, enabled9, { preserveImageNodes: true }), enabled9['replaceWith'](config));
    }),
    reconcileElementTree(enabled7, enabled8, { preserveImageNodes: true }),
    enabled8['replaceWith'](enabled7),
    payload && handle && (reconcileElementTree(payload, handle), handle['replaceWith'](payload)),
    { currentRoot: currentRoot, nextRoot: nextRoot === enabled8 ? enabled7 : nextRoot }
  );
}
export function reconcilePersonReplacementShotTimelineCard({
  currentScroller: currentScroller,
  nextScroller: nextScroller,
  shotId: shotId = '',
} = {}) {
  const enabled10 = String(shotId ?? '')['trim']();
  if (!enabled10) return false;
  const run2 = (el5) =>
      Array['from'](el5?.['querySelectorAll']?.('[data-person-replacement-shot-card="true"]') || [])[
        'find'
      ]((el6) => String(el6['dataset']?.['shotId'] ?? '')['trim']() === enabled10),
    enabled11 = run2(currentScroller),
    enabled12 = run2(nextScroller);
  if (!enabled11 || !enabled12) return false;
  const shotTimelineCardRoot = getShotTimelineCardRoot(enabled11),
    el7 = shotTimelineCardRoot?.['parentElement'],
    input = shotTimelineCardRoot?.['nextSibling'] || null;
  if (!el7 || typeof el7['insertBefore'] !== 'function') return false;
  const reconcileShotTimelineCardPair2 = reconcileShotTimelineCardPair(enabled11, enabled12);
  if (!reconcileShotTimelineCardPair2?.['nextRoot']) return false;
  return (
    reconcileShotTimelineCardPair2['currentRoot']?.['parentElement'] === el7
      ? reconcileShotTimelineCardPair2['currentRoot']['replaceWith'](
          reconcileShotTimelineCardPair2['nextRoot'],
        )
      : el7['insertBefore'](reconcileShotTimelineCardPair2['nextRoot'], input),
    true
  );
}
export function reconcilePersonReplacementShotCardList({
  currentList: currentList,
  nextList: nextList,
} = {}) {
  if (!currentList || !nextList) return false;
  return reconcileElementTree(currentList, nextList, { preserveChildNodes: true });
}
function getDirectShotPreview(el8) {
  return (
    Array['from'](el8?.['children'] || [])['find'](
      (enabled13) =>
        !enabled13['matches']?.('[data-person-replacement-shot-timeline-stage]') &&
        !enabled13['matches']?.('[data-person-replacement-layout-splitter="center"]') &&
        !enabled13['matches']?.('.person-replacement-middle-preview-slide--outgoing'),
    ) || null
  );
}
function getVideoReferenceCards(el9) {
  return Array['from'](el9?.['querySelectorAll']?.('[data-person-replacement-video-reference-index]') || []);
}
function getVideoReferenceCardKey(el10) {
  return String(
    el10?.['dataset']?.['personReplacementVideoReferenceKey'] ||
      el10?.['dataset']?.['personReplacementVideoReferenceIndex'] ||
      '',
  );
}
function prepareVideoReferenceCardPairs(output, value2) {
  const nextCard = new Map(
    getVideoReferenceCards(value2)['map']((value3) => [getVideoReferenceCardKey(value3), value3]),
  );
  return getVideoReferenceCards(output)
    ['map']((currentCard) => ({
      currentCard: currentCard,
      nextCard: nextCard['get'](getVideoReferenceCardKey(currentCard)),
    }))
    ['filter'](({ nextCard: nextCard2 }) => nextCard2);
}
function reconcileVideoElementTree(value4, value5) {
  return reconcileElementTree(value4, value5, { preserveImageNodes: true });
}
function reconcileVideoReferenceRail(el11, enabled14) {
  if (!el11 || !enabled14) return false;
  const captureWorkspaceScrollPosition2 = captureWorkspaceScrollPosition(
      el11['querySelector']?.(VIDEO_REFERENCE_LIST_SELECTOR),
    ),
    handler = () =>
      restoreWorkspaceScrollPosition(
        el11['querySelector']?.(VIDEO_REFERENCE_LIST_SELECTOR),
        captureWorkspaceScrollPosition2,
      );
  if (hasEquivalentNodeShape(el11, enabled14)) {
    const reconcileVideoElementTree2 = reconcileVideoElementTree(el11, enabled14);
    return (handler(), reconcileVideoElementTree2);
  }
  prepareVideoReferenceCardPairs(el11, enabled14)['forEach'](
    ({ currentCard: currentCard2, nextCard: nextCard3 }) => {
      (reconcileVideoElementTree(currentCard2, nextCard3), nextCard3['replaceWith'](currentCard2));
    },
  );
  const reconcileVideoElementTree3 = reconcileVideoElementTree(el11, enabled14);
  return (handler(), reconcileVideoElementTree3);
}
export function reconcilePersonReplacementReferenceInputs({
  currentInputs: currentInputs,
  nextInputs: nextInputs,
} = {}) {
  if (!currentInputs || !nextInputs) return false;
  const map4 = new Map(
    Array['from'](nextInputs['querySelectorAll']?.('[data-slot]') || [])['map']((el12) => [
      String(el12['dataset']?.['slot'] || ''),
      el12,
    ]),
  );
  return (
    Array['from'](currentInputs['querySelectorAll']?.('[data-slot]') || [])['forEach']((el13) => {
      const enabled15 = map4['get'](String(el13['dataset']?.['slot'] || ''));
      if (!enabled15) return;
      if (el13['tagName'] !== enabled15['tagName']) return;
      (reconcileVideoElementTree(el13, enabled15), enabled15['replaceWith'](el13));
    }),
    reconcileVideoElementTree(currentInputs, nextInputs),
    nextInputs['replaceWith'](currentInputs),
    true
  );
}
export function reconcilePersonReplacementVideoControlContinuity({
  currentReferenceRail: currentReferenceRail,
  nextReferenceRail: nextReferenceRail,
  currentReferenceInputs: currentReferenceInputs,
  nextReferenceInputs: nextReferenceInputs,
  currentPromptEditor: currentPromptEditor,
  nextPromptEditor: nextPromptEditor,
} = {}) {
  if (
    !currentReferenceRail ||
    !nextReferenceRail ||
    !currentReferenceInputs ||
    !nextReferenceInputs ||
    !currentPromptEditor ||
    !nextPromptEditor
  )
    return false;
  if (!reconcileVideoReferenceRail(currentReferenceRail, nextReferenceRail)) return false;
  if (
    !reconcilePersonReplacementReferenceInputs({
      currentInputs: currentReferenceInputs,
      nextInputs: nextReferenceInputs,
    })
  )
    return false;
  return (
    syncElementAttributes(currentPromptEditor, nextPromptEditor),
    nextPromptEditor['replaceWith'](currentPromptEditor),
    true
  );
}
function collectVideoShotSelectionElements(currentReferenceRail2, nextReferenceRail2) {
  const currentMiddle = currentReferenceRail2?.['querySelector']?.('.person-replacement-middle-layout'),
    nextMiddle = nextReferenceRail2?.['querySelector']?.('.person-replacement-middle-layout'),
    currentScroller2 = currentMiddle?.['querySelector']?.('[data-person-replacement-shot-timeline-stage]'),
    nextScroller2 = nextMiddle?.['querySelector']?.('[data-person-replacement-shot-timeline-stage]'),
    currentGenerationPanel = currentReferenceRail2?.['querySelector']?.(
      '.person-replacement-video-generation-panel',
    ),
    nextGenerationPanel = nextReferenceRail2?.['querySelector']?.(
      '.person-replacement-video-generation-panel',
    );
  return {
    currentReferenceRail: currentReferenceRail2?.['querySelector']?.(
      '.person-replacement-video-reference-assets',
    ),
    nextReferenceRail: nextReferenceRail2?.['querySelector']?.('.person-replacement-video-reference-assets'),
    currentLeftSplitter: currentReferenceRail2?.['querySelector']?.(
      '[data-person-replacement-layout-splitter="left"]',
    ),
    nextLeftSplitter: nextReferenceRail2?.['querySelector']?.(
      '[data-person-replacement-layout-splitter="left"]',
    ),
    currentMiddle: currentMiddle,
    nextMiddle: nextMiddle,
    currentPreview: getDirectShotPreview(currentMiddle),
    nextPreview: getDirectShotPreview(nextMiddle),
    currentScroller: currentScroller2?.['querySelector']?.('[data-person-replacement-shot-timeline-scroll]'),
    nextScroller: nextScroller2?.['querySelector']?.('[data-person-replacement-shot-timeline-scroll]'),
    currentRightSplitter: currentReferenceRail2?.['querySelector']?.(
      '[data-person-replacement-layout-splitter="right"]',
    ),
    nextRightSplitter: nextReferenceRail2?.['querySelector']?.(
      '[data-person-replacement-layout-splitter="right"]',
    ),
    currentGenerationPanel: currentGenerationPanel,
    nextGenerationPanel: nextGenerationPanel,
    currentReferenceInputs: currentGenerationPanel?.['querySelector']?.(
      '[data-person-replacement-video-reference-inputs]',
    ),
    nextReferenceInputs: nextGenerationPanel?.['querySelector']?.(
      '[data-person-replacement-video-reference-inputs]',
    ),
    currentFooter: currentReferenceRail2?.['querySelector']?.('.person-replacement-step-footer'),
    nextFooter: nextReferenceRail2?.['querySelector']?.('.person-replacement-step-footer'),
  };
}
export function reconcilePersonReplacementVideoShotSelection({
  currentPage: currentPage,
  nextPage: nextPage,
} = {}) {
  const currentInputs2 = collectVideoShotSelectionElements(currentPage, nextPage);
  if (Object['values'](currentInputs2)['some']((enabled16) => !enabled16)) return false;
  if (
    !reconcileVideoReferenceRail(currentInputs2['currentReferenceRail'], currentInputs2['nextReferenceRail'])
  )
    return false;
  if (
    !reconcilePersonReplacementReferenceInputs({
      currentInputs: currentInputs2['currentReferenceInputs'],
      nextInputs: currentInputs2['nextReferenceInputs'],
    })
  )
    return false;
  return (
    reconcileVideoElementTree(currentInputs2['currentPreview'], currentInputs2['nextPreview']),
    currentInputs2['nextPreview']['replaceWith'](currentInputs2['currentPreview']),
    reconcilePersonReplacementShotCardList({
      currentList: currentInputs2['currentScroller'],
      nextList: currentInputs2['nextScroller'],
    }),
    currentInputs2['nextScroller']['replaceWith'](currentInputs2['currentScroller']),
    reconcileVideoElementTree(currentInputs2['currentLeftSplitter'], currentInputs2['nextLeftSplitter']),
    reconcileVideoElementTree(currentInputs2['currentMiddle'], currentInputs2['nextMiddle']),
    reconcileVideoElementTree(currentInputs2['currentRightSplitter'], currentInputs2['nextRightSplitter']),
    reconcileVideoElementTree(
      currentInputs2['currentGenerationPanel'],
      currentInputs2['nextGenerationPanel'],
    ),
    reconcileVideoElementTree(currentInputs2['currentFooter'], currentInputs2['nextFooter']),
    true
  );
}
function getTargetCharacterCards(el14) {
  return Array['from'](el14?.['querySelectorAll']?.('[data-person-replacement-target-character-id]') || []);
}
function prepareTargetCardPairs(value6, value7) {
  const map5 = new Map(
    getTargetCharacterCards(value7)['map']((el15) => [
      el15['dataset']?.['personReplacementTargetCharacterId'] || '',
      el15,
    ]),
  );
  return getTargetCharacterCards(value6)['map']((currentCard3) => {
    const nextCard4 = map5['get'](currentCard3['dataset']?.['personReplacementTargetCharacterId'] || '');
    return {
      currentCard: currentCard3,
      nextCard: nextCard4,
      currentMedia: currentCard3['querySelector']?.('.story-asset-card-media'),
      nextMedia: nextCard4?.['querySelector']?.('.story-asset-card-media'),
    };
  });
}
function reconcileTargetCardPair({
  currentCard: currentCard4,
  nextCard: nextCard5,
  currentMedia: currentMedia,
  nextMedia: nextMedia,
}) {
  (syncElementAttributes(currentCard4, nextCard5),
    reconcileElementTree(currentMedia, nextMedia, { preserveImageNodes: true }));
}
function reconcileGenerationCopy(value8) {
  const {
    currentCopy: currentCopy,
    nextCopy: nextCopy,
    currentPromptField: currentPromptField,
    nextPromptField: nextPromptField,
    currentPromptHeading: currentPromptHeading,
    nextPromptHeading: nextPromptHeading,
    currentPromptReferenceInputs: currentPromptReferenceInputs,
    nextPromptReferenceInputs: nextPromptReferenceInputs,
    currentPromptEditor: currentPromptEditor2,
    nextPromptEditor: nextPromptEditor2,
    currentFooter: currentFooter,
    nextFooter: nextFooter,
    currentGenerateButton: currentGenerateButton,
    nextGenerateButton: nextGenerateButton,
  } = value8;
  (syncElementAttributes(currentCopy, nextCopy),
    syncElementAttributes(currentPromptField, nextPromptField),
    reconcilePersonReplacementReferenceInputs({
      currentInputs: currentPromptReferenceInputs,
      nextInputs: nextPromptReferenceInputs,
    }),
    reconcileElementTree(currentPromptHeading, nextPromptHeading, { preserveImageNodes: true }),
    reconcileElementTree(currentPromptEditor2, nextPromptEditor2, { preserveImageNodes: true }),
    syncElementAttributes(currentFooter, nextFooter),
    currentGenerateButton['replaceWith']?.(nextGenerateButton),
    Array['from'](currentCopy['children'] || [])
      ['filter']((value9) => value9 !== currentPromptField && value9 !== currentFooter)
      ['forEach']((el16) => el16['remove']?.()));
  let value10 = false;
  Array['from'](nextCopy['children'] || [])['forEach']((value11) => {
    if (value11 === nextPromptField) return;
    if (value11 === nextFooter) {
      value10 = true;
      return;
    }
    if (value10) currentCopy['append']?.(value11);
    else currentCopy['insertBefore']?.(value11, currentFooter);
  });
}
function collectImageShotSelectionElements(el17, el18) {
  const currentMiddle2 = el17?.['querySelector']?.('.person-replacement-middle-layout'),
    nextMiddle2 = el18?.['querySelector']?.('.person-replacement-middle-layout'),
    currentTargetRail = el17?.['querySelector']?.('.person-replacement-target-assets'),
    nextTargetRail = el18?.['querySelector']?.('.person-replacement-target-assets'),
    currentGenerationPanel2 = el17?.['querySelector']?.('.person-replacement-image-generation-panel'),
    nextGenerationPanel2 = el18?.['querySelector']?.('.person-replacement-image-generation-panel'),
    currentCopy2 = currentGenerationPanel2?.['querySelector']?.('.person-replacement-generation-copy'),
    nextCopy2 = nextGenerationPanel2?.['querySelector']?.('.person-replacement-generation-copy'),
    currentPromptField2 = currentCopy2?.['querySelector']?.('.person-replacement-prompt-field'),
    nextPromptField2 = nextCopy2?.['querySelector']?.('.person-replacement-prompt-field'),
    currentFooter2 = currentCopy2?.['querySelector']?.('.prompt-panel-footer'),
    nextFooter2 = nextCopy2?.['querySelector']?.('.prompt-panel-footer');
  return {
    currentMiddle: currentMiddle2,
    nextMiddle: nextMiddle2,
    currentPreview: getDirectShotPreview(currentMiddle2),
    nextPreview: getDirectShotPreview(nextMiddle2),
    currentTargetRail: currentTargetRail,
    nextTargetRail: nextTargetRail,
    currentGenerationPanel: currentGenerationPanel2,
    nextGenerationPanel: nextGenerationPanel2,
    currentResultPreview: currentGenerationPanel2?.['querySelector']?.(
      '.person-replacement-generation-preview',
    ),
    nextResultPreview: nextGenerationPanel2?.['querySelector']?.('.person-replacement-generation-preview'),
    currentCopy: currentCopy2,
    nextCopy: nextCopy2,
    currentPromptField: currentPromptField2,
    nextPromptField: nextPromptField2,
    currentPromptHeading: currentPromptField2?.['querySelector']?.(
      '.person-replacement-prompt-field-heading',
    ),
    nextPromptHeading: nextPromptField2?.['querySelector']?.('.person-replacement-prompt-field-heading'),
    currentPromptReferenceInputs: currentPromptField2?.['querySelector']?.(
      '.person-replacement-prompt-reference-inputs',
    ),
    nextPromptReferenceInputs: nextPromptField2?.['querySelector']?.(
      '.person-replacement-prompt-reference-inputs',
    ),
    currentPromptEditor: currentPromptField2?.['querySelector']?.(
      '[data-person-replacement-field="image-prompt"]',
    ),
    nextPromptEditor: nextPromptField2?.['querySelector']?.(
      '[data-person-replacement-field="image-prompt"]',
    ),
    currentFooter: currentFooter2,
    nextFooter: nextFooter2,
    currentModelSelector: currentFooter2?.['querySelector']?.('[data-aigen-image-model-selector]'),
    nextModelSelector: nextFooter2?.['querySelector']?.('[data-aigen-image-model-selector]'),
    currentGenerateButton: currentFooter2?.['querySelector']?.(
      '[data-person-replacement-action="generate-replacement-image"]',
    ),
    nextGenerateButton: nextFooter2?.['querySelector']?.(
      '[data-person-replacement-action="generate-replacement-image"]',
    ),
  };
}
export function reconcilePersonReplacementImageShotSelection({
  currentPage: currentPage2,
  nextPage: nextPage2,
} = {}) {
  const imageShotSelectionElements = collectImageShotSelectionElements(currentPage2, nextPage2),
    list5 = prepareTargetCardPairs(
      imageShotSelectionElements['currentTargetRail'],
      imageShotSelectionElements['nextTargetRail'],
    ),
    list6 = Object['values'](imageShotSelectionElements);
  if (
    list6['some']((enabled17) => !enabled17) ||
    list5['some']((value12) => Object['values'](value12)['some']((enabled18) => !enabled18))
  )
    return false;
  return (
    reconcileElementTree(
      imageShotSelectionElements['currentPreview'],
      imageShotSelectionElements['nextPreview'],
      { preserveImageNodes: true },
    ),
    list5['forEach'](reconcileTargetCardPair),
    imageShotSelectionElements['currentResultPreview']
      ['querySelectorAll']?.('.person-replacement-image-preview-slide--outgoing')
      ?.['forEach']?.((el19) => el19['remove']?.()),
    reconcileElementTree(
      imageShotSelectionElements['currentResultPreview'],
      imageShotSelectionElements['nextResultPreview'],
      {
        preserveImageNodes: true,
      },
    ),
    reconcileGenerationCopy(imageShotSelectionElements),
    true
  );
}
