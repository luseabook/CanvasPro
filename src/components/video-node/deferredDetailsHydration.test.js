import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  disposeVideoNodePromptDetails,
  hydrateDeferredVideoNodeToolbar,
  hydrateVideoNodeDeferredDetails,
  initializeVideoNodePromptDetailsOnMount,
  renderInitialVideoNodeFooter,
} from './deferredDetailsHydration.js';

const originalDocument = globalThis.document;

afterEach(() => {
  if (typeof originalDocument === 'undefined') delete globalThis.document;
  else globalThis.document = originalDocument;
});

test('deferredDetailsHydration: dispose removes every prompt detail element', () => {
  const removed = [];
  const node = {
    _generationNodeHelpTip: { remove: () => removed.push('help') },
    _promptPresetTrigger: { remove: () => removed.push('preset') },
    _promptExpansion: { remove: () => removed.push('expansion') },
    _modelProviderProfileControl: { remove: () => removed.push('provider') },
  };

  disposeVideoNodePromptDetails(node);

  assert.deepEqual(removed, ['help', 'preset', 'expansion', 'provider']);
  assert.equal(node._generationNodeHelpTip, null);
  assert.equal(node._modelProviderProfileControl, null);
});

test('deferredDetailsHydration: mount initialization skips deferred renderers', () => {
  assert.equal(initializeVideoNodePromptDetailsOnMount(null), false);
  assert.equal(initializeVideoNodePromptDetailsOnMount({ _rendererDetailsDeferred: true }), false);

  const calls = [];
  const node = {
    _rendererDetailsDeferred: false,
    _data: { prompt: '<b>prompt</b>' },
    promptEl: { innerHTML: '' },
    _syncPromptBoxSizeFromData: () => calls.push('size'),
    _setupPromptBoxResize: () => calls.push('resize'),
    _initPromptPills: () => calls.push('pills'),
    _syncPromptInputVisibility: () => calls.push('visibility'),
    _syncGenerationNodeHelpTip: () => calls.push('help'),
    _syncModelProviderProfileControl: () => calls.push('provider'),
    _syncLocaleTexts: () => calls.push('locale'),
  };

  assert.equal(
    initializeVideoNodePromptDetailsOnMount(node, {
      sanitizePromptHtml: (value) => `safe:${value}`,
    }),
    true,
  );
  assert.equal(node.promptEl.innerHTML, 'safe:<b>prompt</b>');
  assert.deepEqual(calls, ['size', 'resize', 'pills', 'visibility', 'help', 'provider', 'locale']);
});

test('deferredDetailsHydration: toolbar hydration disposes old cleanup and stores replacement', () => {
  const calls = [];
  const node = {
    _deferredToolbarEl: { id: 'toolbar' },
    _data: { id: 'node-1' },
    _videoToolbarCleanup: () => calls.push('old-cleanup'),
  };
  const replacement = () => calls.push('new-cleanup');

  assert.equal(
    hydrateDeferredVideoNodeToolbar(node, (element, data) => {
      calls.push(['render', element.id, data.id]);
      return replacement;
    }),
    true,
  );
  assert.equal(node._deferredToolbarEl, null);
  assert.equal(node._videoToolbarCleanup, replacement);
  assert.deepEqual(calls, ['old-cleanup', ['render', 'toolbar', 'node-1']]);
});

test('deferredDetailsHydration: deferred details reload data, prompt, footer, and async presentation', () => {
  globalThis.document = { activeElement: null };
  const calls = [];
  const promptEl = { innerHTML: '' };
  const node = {
    _rendererDetailsDeferred: true,
    nodeId: 'node-1',
    _data: { prompt: 'old' },
    footerEl: { dataset: { thinVideoHydration: '1' } },
    promptEl,
    _renderFooter: (footer) => calls.push(['footer', footer.dataset.thinVideoHydration]),
    _initPromptPills: () => calls.push('pills'),
    _syncPromptInputVisibility: () => calls.push('visibility'),
    _syncPromptBoxSizeFromData: () => calls.push('size'),
    _setupPromptBoxResize: () => calls.push('resize'),
    _syncGenerationNodeHelpTip: () => calls.push('help'),
    _syncModelProviderProfileControl: () => calls.push('provider'),
    _syncLocaleTexts: () => calls.push('locale'),
    _renderRefBarWhenMediaReady: () => calls.push('refbar'),
    _updateSubmitButtonState: () => calls.push('submit'),
    _syncInitialUpdateSignatures: () => calls.push('signatures'),
    _hydrateDeferredToolbarEvents: () => calls.push('toolbar-events'),
    hydrateRendererThinVideoPresentation: async () => calls.push('presentation'),
  };

  hydrateVideoNodeDeferredDetails(node, {
    readStoreState: () => ({
      nodes: { 'node-1': { id: 'node-1', prompt: '<p>fresh</p>' } },
    }),
    sanitizePromptHtml: (value) => `safe:${value}`,
  });

  assert.equal(node._rendererDetailsDeferred, false);
  assert.equal(node._lastFooterSig, '');
  assert.equal(promptEl.innerHTML, 'safe:<p>fresh</p>');
  assert.equal(Object.hasOwn(node.footerEl.dataset, 'thinVideoHydration'), false);
  assert.equal(
    calls.some((entry) => Array.isArray(entry) && entry[0] === 'footer'),
    true,
  );
  assert.equal(calls.includes('presentation'), true);
});

test('deferredDetailsHydration: initial footer respects thin and deferred render modes', () => {
  const calls = [];
  const footer = { dataset: {}, innerHTML: 'existing' };
  const thin = {
    _rendererThinVideoHydration: true,
    btnEl: { id: 'button' },
    _renderFooter: () => calls.push('thin-render'),
  };
  renderInitialVideoNodeFooter(thin, footer);
  assert.equal(footer.dataset.thinVideoHydration, '1');
  assert.equal(footer.innerHTML, '');
  assert.equal(thin.btnEl, null);

  const deferred = {
    _rendererDetailsDeferred: true,
    _renderFooterShell: () => calls.push('shell'),
    _renderFooter: () => calls.push('deferred-render'),
  };
  renderInitialVideoNodeFooter(deferred, footer);

  const regular = {
    _renderFooter: () => calls.push('regular-render'),
  };
  renderInitialVideoNodeFooter(regular, footer);
  assert.deepEqual(calls, ['shell', 'regular-render']);
});
