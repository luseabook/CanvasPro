import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createPersonReplacementPageTransitionController } from './personReplacementPageTransitionController.js';

function createElement({ dataset = {}, className = '', disabled = false, text = '' } = {}) {
  const attributes = new Map();
  const listeners = new Map();
  const element = {
    className,
    dataset: { ...dataset },
    disabled,
    innerHTML: text,
    tabIndex: 0,
    parentElement: null,
    children: [],
    querySelector: () => null,
    querySelectorAll: () => [],
    contains: () => false,
    remove: () => {
      if (element.parentElement) {
        element.parentElement.children = element.parentElement.children.filter((entry) => entry !== element);
      }
    },
    focus(options) {
      element.focusOptions = options;
      element.ownerDocument.activeElement = element;
    },
    closest: () => null,
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    getBoundingClientRect() {
      return { width: 100, height: 20, top: 0, bottom: 20, left: 0 };
    },
  };
  return element;
}

function createHarness(overrides = {}) {
  const root = createElement();
  const documentObject = {
    activeElement: null,
    body: {},
    createElement: () => createElement(),
  };
  documentObject.defaultView = {
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    setTimeout: () => 2,
    clearTimeout() {},
  };
  root.ownerDocument = documentObject;
  const controller = createPersonReplacementPageTransitionController({
    getRoot: () => root,
    getTransitionKey: overrides.getTransitionKey || (() => 'page-1'),
    isCutEditorOpen: overrides.isCutEditorOpen || (() => false),
    requestRender: overrides.requestRender || (() => {}),
    documentObject,
    windowObject: documentObject.defaultView,
  });
  return { controller, documentObject, root };
}

test('personReplacementPageTransitionController: requires all workspace adapters and returns a frozen API', () => {
  assert.throws(
    () => createPersonReplacementPageTransitionController({ getRoot: () => null }),
    /require workspace adapters/,
  );
  const { controller } = createHarness();
  assert.equal(Object.isFrozen(controller), true);
  assert.deepEqual(Object.keys(controller).sort(), [
    'captureFocus',
    'deferRenderIfSettling',
    'destroy',
    'restoreFocus',
    'start',
    'stop',
    'syncProjectToolbarInPlace',
  ]);
  controller.destroy();
});

test('personReplacementPageTransitionController: captureFocus tracks active steps and asset tabs inside the root', () => {
  const { controller, documentObject, root } = createHarness();
  root.contains = (node) => node === documentObject.activeElement;
  const step = createElement({ dataset: { personReplacementStep: ' 2 ' } });
  const tab = createElement({ dataset: { assetTab: ' library ' } });

  documentObject.activeElement = step;
  assert.deepEqual(controller.captureFocus(), { kind: 'step', value: '2' });
  documentObject.activeElement = tab;
  assert.deepEqual(controller.captureFocus(), { kind: 'asset-tab', value: 'library' });
  documentObject.activeElement = {};
  assert.equal(controller.captureFocus(), null);
  controller.destroy();
});

test('personReplacementPageTransitionController: restoreFocus focuses the matching step or asset tab', () => {
  const { controller, documentObject, root } = createHarness();
  const step = createElement({ dataset: { personReplacementStep: '2' } });
  const tab = createElement({ dataset: { assetTab: 'library' } });
  step.ownerDocument = documentObject;
  tab.ownerDocument = documentObject;
  const toolbar = createElement();
  toolbar.querySelectorAll = (selector) => (selector === '[data-person-replacement-step]' ? [step] : []);
  const incomingPage = createElement();
  incomingPage.querySelectorAll = (selector) => (selector === '[data-asset-tab]' ? [tab] : []);
  root.querySelectorAll = (selector) => {
    if (selector === '[data-person-replacement-step]') return [step];
    if (selector === '[data-asset-tab]') return [tab];
    return [];
  };

  assert.equal(controller.restoreFocus({ kind: 'step', value: '2' }, { currentToolbar: toolbar }), true);
  assert.equal(documentObject.activeElement, step);
  assert.deepEqual(step.focusOptions, { preventScroll: true });
  assert.equal(controller.restoreFocus({ kind: 'asset-tab', value: 'library' }, { incomingPage }), true);
  assert.equal(documentObject.activeElement, tab);
  assert.equal(
    controller.restoreFocus({ kind: 'step', value: 'missing' }, { currentToolbar: toolbar }),
    false,
  );
  controller.destroy();
});

test('personReplacementPageTransitionController: syncs toolbar classes, step attributes, and side content in place', () => {
  const { controller } = createHarness();
  const currentStep = createElement({ dataset: { personReplacementStep: '1' }, className: 'old' });
  const nextStep = createElement({ dataset: { personReplacementStep: '1' }, className: 'new' });
  nextStep.setAttribute('aria-current', 'step');
  nextStep.setAttribute('aria-disabled', 'false');
  nextStep.setAttribute('title', '步骤 1');
  const currentSteps = createElement({ dataset: { activeStep: '1' } });
  const nextSteps = createElement({ dataset: { activeStep: '2' } });
  currentSteps.querySelectorAll = () => [currentStep];
  nextSteps.querySelectorAll = () => [nextStep];
  const currentToolbar = createElement({ className: 'old-toolbar' });
  const nextToolbar = createElement({ className: 'new-toolbar' });
  const currentSide = createElement({ text: 'old-side' });
  const nextSide = createElement({ text: 'new-side' });
  currentToolbar.querySelector = (selector) =>
    selector === '.person-replacement-story-steps'
      ? currentSteps
      : selector === '.person-replacement-toolbar-side'
        ? currentSide
        : null;
  nextToolbar.querySelector = (selector) =>
    selector === '.person-replacement-story-steps'
      ? nextSteps
      : selector === '.person-replacement-toolbar-side'
        ? nextSide
        : null;
  const currentPage = createElement();
  const nextPage = createElement();
  currentPage.querySelector = (selector) =>
    selector === '.person-replacement-story-toolbar' ? currentToolbar : null;
  nextPage.querySelector = (selector) =>
    selector === '.person-replacement-story-toolbar' ? nextToolbar : null;

  assert.equal(controller.syncProjectToolbarInPlace(currentPage, nextPage), true);
  assert.equal(currentToolbar.className, 'new-toolbar');
  assert.equal(currentSteps.dataset.activeStep, '2');
  assert.equal(currentStep.className, 'new');
  assert.equal(currentStep.getAttribute('aria-current'), 'step');
  assert.equal(currentStep.getAttribute('title'), '步骤 1');
  assert.equal(currentSide.innerHTML, 'new-side');
  controller.destroy();
});

test('personReplacementPageTransitionController: start rejects incomplete transitions and stop stays idempotent', () => {
  const { controller } = createHarness();
  assert.equal(controller.start(null, null, 'sideways'), false);
  assert.equal(controller.start({}, {}, 'forward'), false);
  assert.equal(controller.deferRenderIfSettling('none'), false);
  controller.stop({ renderPending: false });
  controller.destroy();
  controller.destroy();
});
