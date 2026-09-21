import test from 'node:test';
import assert from 'node:assert/strict';
import { IMAGE_TOOLBAR_HTML } from './imageToolbarHtml.js';
test('imageToolbarHtml: APIMart 人脸检测按钮在工具池中', () => {
  (assert.match(IMAGE_TOOLBAR_HTML, /act-apimart-face-detect/),
    assert.match(IMAGE_TOOLBAR_HTML, /data-tooltip="apimart提供 seedance2\.0人脸检测"/),
    assert.match(IMAGE_TOOLBAR_HTML, /aria-label="人脸检测"/));
});
