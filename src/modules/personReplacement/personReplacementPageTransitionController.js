import { createWorkspacePageTransitionController } from '../workspacePageTransition.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function createPersonReplacementPageTransitionController({
  getRoot: getRoot,
  getTransitionKey: getTransitionKey,
  isCutEditorOpen: isCutEditorOpen,
  isDestroyed: isDestroyed = () => false,
  requestRender: requestRender,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
} = {}) {
  if (
    typeof getRoot !== 'function' ||
    typeof getTransitionKey !== 'function' ||
    typeof isCutEditorOpen !== 'function' ||
    typeof requestRender !== 'function'
  )
    throw new TypeError('Person replacement page transitions require workspace adapters.');
  let value2 = null,
    item = '',
    key = false;
  const run = (el, el2) => {
      const el3 = el?.['querySelector']?.('.story-asset-tabs'),
        el4 = el2?.['querySelector']?.('.story-asset-tabs');
      if (!el3 || !el4) return;
      ((el3['dataset']['activeTab'] = el4['dataset']['activeTab']),
        el3['querySelectorAll']?.('[data-asset-tab]')?.['forEach']?.((el5) => {
          const text = normalizeText(el5['dataset']?.['assetTab']),
            el6 = Array['from'](el4['querySelectorAll']?.('[data-asset-tab]') || [])['find'](
              (el7) => normalizeText(el7['dataset']?.['assetTab']) === text,
            );
          if (!el6) return;
          el5['classList']?.['toggle']?.('is-active', el6['classList']?.['contains']?.('is-active') === true);
          const index = el6['getAttribute']?.('aria-selected');
          if (index == null) el5['removeAttribute']?.('aria-selected');
          else el5['setAttribute']?.('aria-selected', index);
          el5['tabIndex'] = el6['tabIndex'];
          const el8 = el5['querySelector']?.('.story-asset-tab-count'),
            el9 = el6['querySelector']?.('.story-asset-tab-count');
          el8 && el9 && (el8['textContent'] = el9['textContent']);
        }));
    },
    syncProjectToolbarInPlace = (el10, el11) => {
      const el12 = el10?.['querySelector']?.('.person-replacement-story-toolbar'),
        el13 = el11?.['querySelector']?.('.person-replacement-story-toolbar'),
        el14 = el12?.['querySelector']?.('.person-replacement-story-steps'),
        el15 = el13?.['querySelector']?.('.person-replacement-story-steps');
      if (!el12 || !el13 || !el14 || !el15) return false;
      ((el12['className'] = el13['className']),
        (el14['dataset']['activeStep'] = el15['dataset']['activeStep']),
        el14['querySelectorAll']?.('[data-person-replacement-step]')?.['forEach']?.((el16) => {
          const text2 = normalizeText(el16['dataset']?.['personReplacementStep']),
            enabled = Array['from'](el15['querySelectorAll']?.('[data-person-replacement-step]') || [])[
              'find'
            ]((el17) => normalizeText(el17['dataset']?.['personReplacementStep']) === text2);
          if (!enabled) return;
          ((el16['className'] = enabled['className']),
            ['aria-current', 'aria-disabled', 'title']['forEach']((result) => {
              const data = enabled['getAttribute']?.(result);
              if (data == null) el16['removeAttribute']?.(result);
              else el16['setAttribute']?.(result, data);
            }));
        }));
      const el18 = el12['querySelector']?.('.person-replacement-toolbar-side'),
        el19 = el13['querySelector']?.('.person-replacement-toolbar-side');
      if (el18 && el19) el18['innerHTML'] = el19['innerHTML'];
      return true;
    },
    captureFocus = () => {
      const enabled2 = getRoot(),
        el20 = documentObject?.['activeElement'];
      if (!el20 || !enabled2?.['contains']?.(el20)) return null;
      const value3 = normalizeText(el20['dataset']?.['personReplacementStep']);
      if (value3) return { kind: 'step', value: value3 };
      const value4 = normalizeText(el20['dataset']?.['assetTab']);
      if (value4) return { kind: 'asset-tab', value: value4 };
      const options = isCutEditorOpen()
        ? el20['closest']?.(
            ['[data-person-replacement-shot-cut-editor]', '#person-replacement-shot-cut-smart-detect-panel'][
              'join'
            ](','),
          )
        : null;
      if (options) {
        const el21 = el20['closest']?.('[data-person-replacement-action]');
        return {
          kind: 'cut-editor',
          value: normalizeText(el21?.['dataset']?.['personReplacementAction']) || 'surface',
          shotId: normalizeText(el21?.['dataset']?.['shotId']),
          smartClipMode: normalizeText(el21?.['dataset']?.['smartClipMode']),
        };
      }
      return null;
    },
    restoreFocus = (
      el22,
      { currentToolbar: currentToolbar = null, incomingPage: incomingPage = null } = {},
    ) => {
      const el23 = getRoot();
      if (!el22?.['value']) return false;
      if (el22['kind'] === 'cut-editor') {
        const target = el23?.['querySelector']?.('[data-person-replacement-shot-cut-editor]'),
          el24 =
            el22['value'] === 'surface'
              ? null
              : Array['from'](el23?.['querySelectorAll']?.('[data-person-replacement-action]') || [])['find'](
                  (el25) =>
                    normalizeText(el25['dataset']?.['personReplacementAction']) === el22['value'] &&
                    (!el22['shotId'] || normalizeText(el25['dataset']?.['shotId']) === el22['shotId']) &&
                    (!el22['smartClipMode'] ||
                      normalizeText(el25['dataset']?.['smartClipMode']) === el22['smartClipMode']),
                ),
          el26 = el24 && !el24['disabled'] ? el24 : target;
        if (!el26) return false;
        try {
          el26['focus']?.({ preventScroll: true });
        } catch {
          el26['focus']?.();
        }
        return documentObject?.['activeElement'] === el26;
      }
      const el27 = el22['kind'] === 'step' ? currentToolbar || el23 : incomingPage || el23,
        enabled3 =
          el22['kind'] === 'step' ? 'personReplacementStep' : el22['kind'] === 'asset-tab' ? 'assetTab' : '';
      if (!el27 || !enabled3) return false;
      const source = el22['kind'] === 'step' ? '[data-person-replacement-step]' : '[data-asset-tab]',
        el28 = Array['from'](el27['querySelectorAll']?.(source) || [])['find'](
          (el29) => normalizeText(el29['dataset']?.[enabled3]) === el22['value'],
        );
      if (!el28 || el28['disabled']) return false;
      try {
        el28['focus']?.({ preventScroll: true });
      } catch {
        el28['focus']?.();
      }
      return documentObject?.['activeElement'] === el28;
    },
    workspacePageTransitionController = createWorkspacePageTransitionController({
      windowObject: windowObject,
      disposePage: (el30) => el30?.['remove']?.(),
      restoreFocus: (next, current) => {
        if (documentObject?.['activeElement'] !== documentObject?.['body']) return false;
        return restoreFocus(next, current);
      },
    }),
    stop = ({ renderPending: renderPending = false } = {}) => {
      (value2?.({ renderPending: renderPending }), (value2 = null));
    },
    deferRenderIfSettling = (entry = 'none') => {
      if (value2 && entry === 'none' && item === getTransitionKey()) return ((key = true), true);
      return false;
    },
    start = (
      current2,
      next2,
      direction,
      record,
      {
        currentToolbar: currentToolbar = null,
        nextToolbar: nextToolbar = null,
        focusKey: focusKey = null,
      } = {},
    ) => {
      const parent = next2?.['parentElement'];
      if (!current2 || !next2 || !parent || !['forward', 'backward']['includes'](direction)) return false;
      const entering = direction === 'backward' ? 'is-entering-backward' : 'is-entering-forward',
        leaving = direction === 'backward' ? 'is-leaving-backward' : 'is-leaving-forward',
        payload = current2['querySelector']?.('[data-story-assets-switch-region]'),
        handle = next2['querySelector']?.('[data-story-assets-switch-region]'),
        state = current2['querySelector']?.('.story-assets-list'),
        config = next2['querySelector']?.('.story-assets-list'),
        scope = record === 'asset-content' && payload && handle,
        input = record === 'asset-list' && state && config,
        output = scope || input,
        el31 = next2['querySelector']?.('.story-asset-tabs'),
        value5 = el31?.['dataset']['activeTab'];
      scope &&
        el31 &&
        (el31['dataset']['activeTab'] =
          current2['querySelector']?.('.story-asset-tabs')?.['dataset']['activeTab'] || value5);
      const scopeCurrent = input
          ? 'person-replacement-page--asset-list-transition'
          : scope
            ? 'person-replacement-page--asset-content-transition'
            : '',
        scopeTarget = input
          ? 'person-replacement-page--asset-list-transition-target'
          : scope
            ? 'person-replacement-page--asset-content-transition-target'
            : '',
        transitionElement = input ? config : scope ? handle : next2;
      next2['remove']?.();
      let value6 = true,
        enabled4 = null;
      const value7 = ({ renderPending: renderPending = true } = {}) => {
        ((value6 = renderPending), enabled4?.['cancel']?.({ commit: true }));
      };
      enabled4 = workspacePageTransitionController['start']({
        current: current2,
        next: next2,
        parent: parent,
        direction: direction,
        transitionElement: transitionElement,
        classNames: {
          current: 'is-current',
          page: 'person-replacement-page-transition',
          parent: 'person-replacement-page-transitioning',
          scopeCurrent: scopeCurrent,
          scopeNext: scopeCurrent,
          scopeTarget: scopeTarget,
          retainCurrentOnCommit: false,
          directions: { [direction]: { entering: entering, leaving: leaving } },
        },
        focusKey: focusKey,
        focusContext: { currentToolbar: currentToolbar, incomingPage: next2 },
        mount: () => {
          (next2['parentElement'] !== parent && parent['appendChild']?.(next2),
            parent['insertBefore']?.(current2, next2));
        },
        forceLayout: () => {
          (el31?.['getBoundingClientRect']?.(),
            currentToolbar?.['getBoundingClientRect']?.(),
            current2['querySelector']?.('.story-asset-tabs')?.['getBoundingClientRect']?.(),
            transitionElement?.['getBoundingClientRect']?.());
        },
        onBeforeCommit: () => {
          if (scope && el31) el31['dataset']['activeTab'] = value5;
          (syncProjectToolbarInPlace(currentToolbar, nextToolbar), output && run(current2, next2));
        },
        onSettled: () => {
          if (value2 === value7) value2 = null;
          item = '';
          const value8 = value6 && key;
          key = false;
          if (value8 && !isDestroyed()) requestRender();
        },
      });
      if (!enabled4) return false;
      return ((value2 = value7), (item = getTransitionKey()), true);
    },
    destroy = () => {
      (stop({ renderPending: false }), workspacePageTransitionController['destroy']());
    };
  return Object['freeze']({
    captureFocus: captureFocus,
    deferRenderIfSettling: deferRenderIfSettling,
    destroy: destroy,
    restoreFocus: restoreFocus,
    start: start,
    stop: stop,
    syncProjectToolbarInPlace: syncProjectToolbarInPlace,
  });
}
