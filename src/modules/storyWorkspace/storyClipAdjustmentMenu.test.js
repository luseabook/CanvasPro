import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canGenerateStoryClipAdjustment,
  syncStoryClipAdjustmentMenu,
} from './storyClipAdjustmentMenu.js';

function baseState(overrides = {}) {
  return {
    clipAdjustmentInstruction: '',
    clipAdjustmentLanguage: '',
    clipAdjustmentPromptMode: 'wan-3.0',
    clipSelectionMode: false,
    selectedClipGenerationIds: [],
    clipAdjustmentPromptModeOpen: false,
    clipAdjustmentLanguageOpen: false,
    data: { project: { planning: { promptMode: 'seedance-2.0' } } },
    ...overrides,
  };
}

test('storyClipAdjustmentMenu: generation requires an instruction, language, or mode change', () => {
  const clip = { id: 'clip-1', promptMode: 'seedance-2.0' };
  const episode = { clips: [clip, { id: 'clip-2', promptMode: 'wan-3.0' }] };

  assert.equal(canGenerateStoryClipAdjustment(baseState(), episode, clip), true);
  assert.equal(
    canGenerateStoryClipAdjustment(baseState({ clipAdjustmentInstruction: '  tightening  ' }), episode, clip),
    true,
  );
  assert.equal(
    canGenerateStoryClipAdjustment(baseState({ clipAdjustmentLanguage: 'en-US' }), episode, clip),
    true,
  );
  assert.equal(
    canGenerateStoryClipAdjustment(
      baseState({ clipAdjustmentPromptMode: '', clipAdjustmentInstruction: '', clipAdjustmentLanguage: '' }),
      episode,
      clip,
    ),
    false,
  );
  assert.equal(
    canGenerateStoryClipAdjustment(
      baseState({
        clipAdjustmentPromptMode: 'wan-3.0',
        clipSelectionMode: true,
        selectedClipGenerationIds: ['clip-2'],
      }),
      episode,
      clip,
    ),
    false,
  );
});

function createMenuDom() {
  const focusCalls = [];
  const createOption = (value) => {
    const classes = new Set();
    const attributes = new Map();
    return {
      dataset: { storyClipAdjustmentModeOption: value },
      classList: {
        toggle(name, enabled) {
          if (enabled) classes.add(name);
          else classes.delete(name);
        },
        contains: (name) => classes.has(name),
      },
      setAttribute(name, next) {
        attributes.set(name, String(next));
      },
      getAttribute: (name) => attributes.get(name) || null,
    };
  };
  const modeOptions = [createOption('seedance-2.0'), createOption('wan-3.0')];
  const languageOptions = [createOption(''), createOption('en-US')];
  const modeListbox = {
    hidden: true,
    querySelectorAll: () => modeOptions,
    querySelector(selector) {
      if (selector === '[aria-selected="true"]') {
        return modeOptions.find((option) => option.getAttribute('aria-selected') === 'true') || null;
      }
      return modeOptions[0] || null;
    },
  };
  const languageListbox = {
    hidden: true,
    querySelectorAll: () => languageOptions,
    querySelector(selector) {
      if (selector === '[aria-selected="true"]') {
        return languageOptions.find((option) => option.getAttribute('aria-selected') === 'true') || null;
      }
      return languageOptions[0] || null;
    },
  };
  const modeTrigger = {
    attributes: new Map(),
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
    focus() {
      focusCalls.push('mode-trigger');
    },
  };
  const languageTrigger = {
    attributes: new Map(),
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
    focus() {
      focusCalls.push('language-trigger');
    },
  };
  const modeLabel = { textContent: '' };
  const languageLabel = { textContent: '' };
  const kindSections = {
    mode: {
      querySelector(selector) {
        if (selector === '[data-story-action="toggle-clip-adjustment-mode"]') return modeTrigger;
        if (selector === '[role="listbox"]') return modeListbox;
        if (selector === '[data-story-clip-adjustment-mode-label]') return modeLabel;
        return null;
      },
    },
    language: {
      querySelector(selector) {
        if (selector === '[data-story-action="toggle-clip-adjustment-mode"]') return languageTrigger;
        if (selector === '[role="listbox"]') return languageListbox;
        if (selector === '[data-story-clip-adjustment-mode-label]') return languageLabel;
        return null;
      },
    },
  };
  const generateButton = { disabled: true };
  const instructionInput = { focus: () => focusCalls.push('instruction') };
  const bar = {
    querySelector(selector) {
      const kindMatch = selector.match(/data-story-adjustment-kind="([^"]+)"/);
      if (kindMatch) return kindSections[kindMatch[1]] || null;
      if (selector === '[data-story-action="generate-clip-adjustment"]') return generateButton;
      if (selector === '[data-story-clip-adjustment-instruction]') return instructionInput;
      return null;
    },
  };
  const root = {
    querySelector: (selector) => (selector === '[data-story-clip-adjustment-bar]' ? bar : null),
  };
  return {
    root,
    modeTrigger,
    languageTrigger,
    modeListbox,
    languageListbox,
    modeLabel,
    languageLabel,
    modeOptions,
    languageOptions,
    generateButton,
    focusCalls,
  };
}

test('storyClipAdjustmentMenu: sync updates expansion, labels, selection, and disabled state', () => {
  const dom = createMenuDom();
  const state = baseState({
    clipAdjustmentPromptModeOpen: true,
    clipAdjustmentPromptMode: 'wan-3.0',
  });
  const clip = { id: 'clip-1', promptMode: 'wan-3.0' };
  const episode = { clips: [clip], promptMode: 'wan-3.0' };

  assert.equal(
    syncStoryClipAdjustmentMenu({
      state,
      root: dom.root,
      episode,
      clip,
      kind: 'mode',
      focus: 'trigger',
      updateSelection: true,
    }),
    true,
  );
  assert.equal(dom.modeTrigger.attributes.get('aria-expanded'), 'true');
  assert.equal(dom.modeListbox.hidden, false);
  assert.equal(dom.modeLabel.textContent, 'Wan 3.0');
  assert.equal(dom.modeOptions[1].getAttribute('aria-selected'), 'true');
  assert.equal(dom.generateButton.disabled, true);
  assert.equal(dom.focusCalls.includes('mode-trigger'), true);

  state.clipAdjustmentLanguageOpen = true;
  state.clipAdjustmentLanguage = 'en-US';
  assert.equal(
    syncStoryClipAdjustmentMenu({
      state,
      root: dom.root,
      episode,
      clip,
      kind: 'language',
      updateSelection: true,
    }),
    true,
  );
  assert.equal(dom.languageListbox.hidden, false);
  assert.equal(dom.languageLabel.textContent, '英文');
  assert.equal(dom.languageOptions[1].getAttribute('aria-selected'), 'true');
  assert.equal(
    syncStoryClipAdjustmentMenu({
      state,
      root: { querySelector: () => null },
      episode,
      clip,
    }),
    false,
  );
});
