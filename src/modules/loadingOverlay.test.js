import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewContainer as createFakePreviewContainer, installDomEnvironment as installPreviewDomStubs } from '../../tools/dom-test-environment.mjs';
import { startLoading, stopLoading } from './loadingOverlay.js';
const restoreDom = installPreviewDomStubs();
(test.after(() => {
  restoreDom();
}),
  test('loadingOverlay: repeated start before delay does not postpone visible loading', () => {
    const _0x1d049f = globalThis.setTimeout,
      _0x490ac2 = createFakePreviewContainer(),
      _0x3a9d24 = [];
    globalThis.setTimeout = (_0x253fc0, _0x4267c9) => {
      return (_0x3a9d24.push({ callback: _0x253fc0, delay: _0x4267c9 }), _0x3a9d24.length);
    };
    try {
      (startLoading(_0x490ac2),
        startLoading(_0x490ac2),
        assert.equal(_0x3a9d24.length, 1),
        _0x3a9d24[0].callback(),
        assert.equal(_0x490ac2.classList.contains('img-preview-loading'), true),
        assert.equal(!!_0x490ac2.querySelector('.img-loading-overlay'), true),
        stopLoading(_0x490ac2),
        assert.equal(_0x490ac2.classList.contains('img-preview-loading'), false));
    } finally {
      globalThis.setTimeout = _0x1d049f;
    }
  }));
