import test from 'node:test';
import assert from 'node:assert/strict';
import { VIDEO_TOOLBAR_HTML } from './videoToolbarHtml.js';
(test('videoToolbarHtml: replace 按钮展示为补帧且不再是开发中', () => {
  (assert.match(VIDEO_TOOLBAR_HTML, /act-replace/),
    assert.match(VIDEO_TOOLBAR_HTML, /data-tooltip="补帧"/),
    assert.match(VIDEO_TOOLBAR_HTML, /aria-label="补帧"/),
    assert.doesNotMatch(VIDEO_TOOLBAR_HTML, /替换（开发中）/),
    assert.doesNotMatch(VIDEO_TOOLBAR_HTML, /is-dev act-replace|act-replace is-dev/));
}),
  test('videoToolbarHtml: replace 图标为双人拖影补帧图标', () => {
    const _0x341784 = VIDEO_TOOLBAR_HTML.match(
      /<button class="[^"]*\bact-replace\b[^"]*"[^>]*>.*?<\/button>/s,
    )?.[0];
    (assert.ok(_0x341784),
      assert.match(
        _0x341784,
        /<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"/,
      ),
      assert.equal(_0x341784.match(/<circle\b/g)?.length, 2),
      assert.match(_0x341784, /<path d="M9\.4 11\.4c1\.3-.9 3\.9-.9 5\.2 0" opacity="\.6"\/>/));
  }),
  test('videoToolbarHtml: 音画分离按钮保留在视频工具池中', () => {
    (assert.match(VIDEO_TOOLBAR_HTML, /act-separate-av/),
      assert.match(VIDEO_TOOLBAR_HTML, /data-tooltip="音画分离"/),
      assert.match(VIDEO_TOOLBAR_HTML, /aria-label="音画分离"/),
      assert.ok(VIDEO_TOOLBAR_HTML.indexOf('act-clip') < VIDEO_TOOLBAR_HTML.indexOf('act-separate-av')));
  }),
  test('videoToolbarHtml: 视频倒放按钮在裁剪之后并使用倒放图标', () => {
    const _0x48a7d3 = VIDEO_TOOLBAR_HTML.match(
      /<button class="[^"]*\bact-reverse\b[^"]*"[^>]*>.*?<\/button>/s,
    )?.[0];
    (assert.ok(_0x48a7d3),
      assert.match(_0x48a7d3, /data-tooltip="视频倒放"/),
      assert.match(_0x48a7d3, /aria-label="视频倒放"/),
      assert.doesNotMatch(_0x48a7d3, /\[0:v\]/),
      assert.match(_0x48a7d3, /<path d="M5 5v14"\/>/),
      assert.ok(VIDEO_TOOLBAR_HTML.indexOf('act-clip') < VIDEO_TOOLBAR_HTML.indexOf('act-reverse')),
      assert.ok(
        VIDEO_TOOLBAR_HTML.indexOf('act-reverse') < VIDEO_TOOLBAR_HTML.indexOf('act-extract-keyframes'),
      ));
  }),
  test('videoToolbarHtml: 提取关键帧按钮保留在裁剪之后', () => {
    (assert.match(VIDEO_TOOLBAR_HTML, /act-extract-keyframes/),
      assert.match(VIDEO_TOOLBAR_HTML, /data-tooltip="提取关键帧"/),
      assert.match(VIDEO_TOOLBAR_HTML, /aria-label="提取关键帧"/),
      assert.ok(
        VIDEO_TOOLBAR_HTML.indexOf('act-clip') < VIDEO_TOOLBAR_HTML.indexOf('act-extract-keyframes'),
      ));
  }),
  test('videoToolbarHtml: 分镜脚本按钮替代反推开发中入口', () => {
    (assert.match(VIDEO_TOOLBAR_HTML, /act-storyboard-script/),
      assert.match(VIDEO_TOOLBAR_HTML, /data-tooltip="分镜脚本"/),
      assert.match(VIDEO_TOOLBAR_HTML, /aria-label="分镜脚本"/),
      assert.doesNotMatch(VIDEO_TOOLBAR_HTML, /反推/),
      assert.doesNotMatch(VIDEO_TOOLBAR_HTML, /is-dev act-storyboard-script|act-storyboard-script is-dev/));
  }),
  test('videoToolbarHtml: APIMart 人脸检测按钮在工具池中', () => {
    (assert.match(VIDEO_TOOLBAR_HTML, /act-apimart-face-detect/),
      assert.match(VIDEO_TOOLBAR_HTML, /data-tooltip="apimart提供 seedance2\.0人脸检测"/),
      assert.match(VIDEO_TOOLBAR_HTML, /aria-label="人脸检测"/));
  }),
  test('videoToolbarHtml: 更多菜单参考图像工具栏浮层结构', () => {
    (assert.match(VIDEO_TOOLBAR_HTML, /act-more-tools/),
      assert.match(VIDEO_TOOLBAR_HTML, /data-tooltip="更多"/),
      assert.match(VIDEO_TOOLBAR_HTML, /aria-label="更多"/),
      assert.match(
        VIDEO_TOOLBAR_HTML,
        /class="v2-img-toolbar-zone v2-img-toolbar-zone-primary" data-zone="outside-primary"/,
      ),
      assert.match(
        VIDEO_TOOLBAR_HTML,
        /class="v2-img-toolbar-zone v2-img-toolbar-zone-secondary" data-zone="outside-secondary"/,
      ),
      assert.match(
        VIDEO_TOOLBAR_HTML,
        /class="v2-img-toolbar-more-menu v2-video-toolbar-more-menu" data-role="more-menu" hidden/,
      ),
      assert.match(VIDEO_TOOLBAR_HTML, /class="v2-img-toolbar-more-title">更多工具/),
      assert.match(VIDEO_TOOLBAR_HTML, /class="v2-img-toolbar-zone v2-img-toolbar-zone-more"/),
      assert.match(VIDEO_TOOLBAR_HTML, /act-customize-tools/),
      assert.match(VIDEO_TOOLBAR_HTML, /data-role="button-pool" hidden/));
  }),
  test('videoToolbarHtml: 按钮池包含全部可自定义视频工具', () => {
    const _0x59d45f = VIDEO_TOOLBAR_HTML.match(
      /<div class="v2-img-toolbar-button-pool v2-video-toolbar-button-pool"[\s\S]*?<\/div>/,
    )?.[0];
    assert.ok(_0x59d45f);
    for (const _0x10a345 of [
      'clip',
      'reverse',
      'extract-keyframes',
      'keying',
      'storyboard-script',
      'apimart-face-detect',
      'fullscreen',
      'download',
      'reset-size',
      'hd',
      'replace',
      'remove',
      'separate-av',
    ]) {
      assert.match(_0x59d45f, new RegExp('act-' + _0x10a345));
    }
  }));
