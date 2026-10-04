import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPreviewContainer as createFakePreviewContainer,
  installDomEnvironment as installPreviewDomStubs,
} from '../../tools/dom-test-environment.mjs';
import { startLoading, stopLoading } from './loadingOverlay.js';
const restoreDom = installPreviewDomStubs();
(test.after(() => {
  restoreDom();
}),
  test('loadingOverlay: repeated start before delay does not postpone visible loading', () => {
    const value = globalThis.setTimeout,
      el = createFakePreviewContainer(),
      list = [];
    globalThis.setTimeout = (callback, delay) => {
      return (list.push({ callback: callback, delay: delay }), list.length);
    };
    try {
      (startLoading(el),
        startLoading(el),
        assert.equal(list.length, 1),
        list[0].callback(),
        assert.equal(el.classList.contains('img-preview-loading'), true),
        assert.equal(!!el.querySelector('.img-loading-overlay'), true),
        stopLoading(el),
        assert.equal(el.classList.contains('img-preview-loading'), false));
    } finally {
      globalThis.setTimeout = value;
    }
  }));
