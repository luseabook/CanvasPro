import test from 'node:test';
import assert from 'node:assert/strict';

// Check wiring independently of decompiler-local variable names and equivalent string/member notation.
// Public method/property names and the operation sequence remain required by each pattern.
function assertSourceWiring(text, pattern, absent = false) {
  const canonical = text.replace(/\\x([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex,16)))
    .replace(/\[['"]([A-Za-z_$][\w$]*)['"]\]/g, '.$1').replace(/'/g, '"').replace(/!!\[\]/g, 'true').replace(/!\[\]/g, 'false');
  const locals = /\b(?:store|refreshInitialMultiResultStack|imageIndex|plate|plateImg|plateDisplayLod|selectedIds|id|showMainImageImmediately|targetIdx|safeTargetIdx|applyMultiStackCardLayout|expanded|showExpandedCard|mediaEl|multiStackMotionDurationMs|layerImg|layerDisplayLod|frame|stackThrowTransition|playStackPlateTransition)\b/g;
  const portable = new RegExp(pattern.source.replace(locals, '[\\w$]+').replace(/;/g, '(?:;|,)'), pattern.flags);
  if (absent) assert.doesNotMatch(canonical, portable); else assert.match(canonical, portable);
}

import { readFileSync } from 'node:fs';
import {
  MULTI_RESULT_BACKPLATES_CLASS,
  MULTI_RESULT_BACKPLATE_CLASS,
  MULTI_RESULT_STACK_EXPANDED_CLASS,
  MULTI_RESULT_STACK_PREVIEW_CLASS,
  MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS,
  buildMultiResultBackplateItems,
  createMultiResultBackplates,
  getMultiResultBackplateKey,
  getMultiResultBackplateCount,
  shouldRefreshMultiResultStackDom,
  syncMultiResultStackClasses,
} from './multiResultStackBackplates.js';
function createFakeDocument() {
  return {
    createElement(_0x1c4151) {
      return {
        tagName: String(_0x1c4151 || 'div').toUpperCase(),
        className: '',
        children: [],
        dataset: {},
        attributes: {},
        appendChild(_0x5bd2f3) {
          return (this.children.push(_0x5bd2f3), (_0x5bd2f3.parentNode = this), _0x5bd2f3);
        },
        setAttribute(_0x4f5711, _0x200ab6) {
          this.attributes[_0x4f5711] = String(_0x200ab6);
        },
      };
    },
  };
}
function createClassListHost() {
  const _0x50e99d = new Set();
  return {
    classList: {
      add(..._0x564160) {
        _0x564160.forEach((_0x8bfc0d) => _0x50e99d.add(_0x8bfc0d));
      },
      remove(..._0x46f061) {
        _0x46f061.forEach((_0x1cb933) => _0x50e99d.delete(_0x1cb933));
      },
      toggle(_0x55dd3e, _0x39617c) {
        const _0x36380b = _0x39617c === undefined ? !_0x50e99d.has(_0x55dd3e) : !!_0x39617c;
        if (_0x36380b) _0x50e99d.add(_0x55dd3e);
        else _0x50e99d.delete(_0x55dd3e);
        return _0x36380b;
      },
      contains(_0x359c65) {
        return _0x50e99d.has(_0x359c65);
      },
    },
  };
}
(test('multi result stack backplates: single image does not render a backdrop', () => {
  (assert.equal(getMultiResultBackplateCount(0), 0),
    assert.equal(getMultiResultBackplateCount(1), 0),
    assert.equal(createMultiResultBackplates(createFakeDocument(), 1), null));
}),
  test('multi result stack backplates: renders up to three backplates', () => {
    const _0x14d3ec = createFakeDocument(),
      _0x572ffb = createMultiResultBackplates(_0x14d3ec, 5);
    (assert.equal(getMultiResultBackplateCount(2), 1),
      assert.equal(getMultiResultBackplateCount(4), 3),
      assert.equal(getMultiResultBackplateCount(10), 3),
      assert.equal(_0x572ffb.className, MULTI_RESULT_BACKPLATES_CLASS),
      assert.equal(_0x572ffb.attributes['aria-hidden'], 'true'),
      assert.equal(_0x572ffb.children.length, 3),
      assert.equal(_0x572ffb.children[0].className, MULTI_RESULT_BACKPLATE_CLASS),
      assert.equal(_0x572ffb.children[0].dataset.stackIndex, '1'),
      assert.equal(_0x572ffb.children[0].dataset.imageIndex, '1'),
      assert.equal(_0x572ffb.children[2].dataset.stackIndex, '3'));
  }),
  test('multi result stack backplates: items skip main image without rendering source media', () => {
    const _0x48c53a = buildMultiResultBackplateItems({ imageCount: 4, mainIndex: 1 }),
      _0x47ae49 = createMultiResultBackplates(createFakeDocument(), 4, { items: _0x48c53a });
    (assert.deepEqual(
      _0x48c53a.map((_0x121aca) => _0x121aca.imageIndex),
      [0, 2, 3],
    ),
      assert.equal(getMultiResultBackplateKey(_0x48c53a), '0,2,3'),
      assert.equal(_0x47ae49.children.length, 3),
      assert.equal(_0x47ae49.children[0].dataset.imageIndex, '0'),
      assert.equal(_0x47ae49.children[0].children.length, 0));
  }),
  test('multi result stack backplates: expanded state is class-derived', () => {
    const _0x38a331 = createClassListHost(),
      _0x1e49ad = createClassListHost();
    (syncMultiResultStackClasses({
      previewEl: _0x38a331,
      stackWrap: _0x1e49ad,
      isActive: true,
      isExpanded: true,
    }),
      assert.equal(_0x38a331.classList.contains(MULTI_RESULT_STACK_PREVIEW_CLASS), true),
      assert.equal(_0x38a331.classList.contains(MULTI_RESULT_STACK_EXPANDED_CLASS), true),
      assert.equal(_0x1e49ad.classList.contains(MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS), true),
      syncMultiResultStackClasses({
        previewEl: _0x38a331,
        stackWrap: _0x1e49ad,
        isActive: true,
        isExpanded: false,
      }),
      assert.equal(_0x38a331.classList.contains(MULTI_RESULT_STACK_PREVIEW_CLASS), true),
      assert.equal(_0x38a331.classList.contains(MULTI_RESULT_STACK_EXPANDED_CLASS), false),
      assert.equal(_0x1e49ad.classList.contains(MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS), false));
  }),
  test('multi result stack backplates: DOM refresh detects missing backdrop state', () => {
    const _0x4b12c5 = createClassListHost(),
      _0x3aef50 = createFakeDocument(),
      _0xe5c1c = _0x3aef50.createElement('div'),
      _0x91633 = _0x3aef50.createElement('div'),
      _0x3736a7 = createMultiResultBackplates(_0x3aef50, 4);
    (_0xe5c1c.appendChild(_0x91633),
      assert.equal(
        shouldRefreshMultiResultStackDom({
          imageCount: 4,
          previewEl: _0x4b12c5,
          containerEl: _0xe5c1c,
          stackWrap: _0x91633,
          backdropWrap: null,
        }),
        true,
      ),
      _0x91633.appendChild(_0x3736a7),
      assert.equal(
        shouldRefreshMultiResultStackDom({
          imageCount: 4,
          previewEl: _0x4b12c5,
          containerEl: _0xe5c1c,
          stackWrap: _0x91633,
          backdropWrap: _0x3736a7,
        }),
        true,
      ),
      _0x4b12c5.classList.add(MULTI_RESULT_STACK_PREVIEW_CLASS),
      assert.equal(
        shouldRefreshMultiResultStackDom({
          imageCount: 4,
          previewEl: _0x4b12c5,
          containerEl: _0xe5c1c,
          stackWrap: _0x91633,
          backdropWrap: _0x3736a7,
        }),
        false,
      ));
  }),
  test('multi result stack backplates: CSS uses the backplate as the animated card', () => {
    const _0x5e23e6 = readFileSync(new URL('../../../styles/node-types.css', import.meta.url), 'utf8');
    (assert.match(_0x5e23e6, /\.multi-stack-backplates\s*\{[\s\S]*pointer-events:\s*none;/),
      assert.match(_0x5e23e6, /\.multi-stack-backplates\s*\{[\s\S]*clip-path:\s*inset\(0 -25% 0 0\);/),
      assert.match(
        _0x5e23e6,
        /\.multi-stack-wrap\.is-expanded\s+\.multi-stack-backplates\s*\{[\s\S]*pointer-events:\s*auto;/,
      ),
      assert.match(
        _0x5e23e6,
        /\.multi-stack-wrap\.is-expanded\s+\.multi-stack-backplates\s*\{[\s\S]*clip-path:\s*none;/,
      ),
      assert.match(
        _0x5e23e6,
        /\.multi-images-container\s*\{[\s\S]*contain:\s*layout;[\s\S]*overflow:\s*visible;/,
      ),
      assert.match(_0x5e23e6, /\.multi-stack-wrap\s*\{[\s\S]*overflow:\s*visible;/),
      assert.match(_0x5e23e6, /\.multi-stack-backplates\s*\{[\s\S]*z-index:\s*1;/),
      assert.match(
        _0x5e23e6,
        /\.img-node-preview\.aigen-image-preview\.is-multi-result-stack-expanded\s*\{[\s\S]*overflow:\s*visible;/,
      ),
      assert.match(_0x5e23e6, /\.multi-stack-backplate\.is-expanded-card\s*\{[\s\S]*cursor:\s*pointer;/));
    const _0x2c0968 = _0x5e23e6.match(/\.multi-stack-backplate\s*\{([\s\S]*?)\}/);
    (assert.ok(_0x2c0968),
      assert.match(_0x2c0968[1], /transition:[\s\S]*opacity 0\.18s ease/),
      assert.doesNotMatch(_0x2c0968[1], /top 0\./),
      assert.doesNotMatch(_0x2c0968[1], /transform 0\./),
      assert.match(
        _0x5e23e6,
        /\.multi-stack-backplate\s*\{[\s\S]*border-radius:\s*0 var\(--radius-16\) var\(--radius-16\) 0;/,
      ),
      assert.match(
        _0x5e23e6,
        /\.multi-stack-backplate\s*\{[\s\S]*background:\s*linear-gradient\(180deg,\s*var\(--white-20\),\s*var\(--white-08\)\);/,
      ),
      assert.match(_0x5e23e6, /\.multi-stack-backplate-media\s*\{[\s\S]*opacity:\s*0;/));
    const _0x30500d = _0x5e23e6.match(/\.multi-stack-backplate-media\s*\{([\s\S]*?)\}/);
    (assert.ok(_0x30500d), assert.doesNotMatch(_0x30500d[1], /background(?:-image)?:/));
  }),
  test('multi result stack backplates: UI refreshes after renderer wrapper overflow is applied', () => {
    const _0x244e7f = readFileSync(new URL('./uiModule.impl.js', import.meta.url), 'utf8');
    (assertSourceWiring(_0x244e7f, /requestAnimationFrame\(refreshInitialMultiResultStack\)/),
      assertSourceWiring(_0x244e7f, /_loadAndDisplayImage\(\{\s*force:\s*true\s*\}\)/),
      assertSourceWiring(_0x244e7f, /this\._root\?\.style\.setProperty\("overflow",\s*"visible"\)/));
  }),
  test('multi result stack backplates: expanded cards reuse backdrop elements', () => {
    const _0xb0ea94 = readFileSync(new URL('./uiModule.impl.js', import.meta.url), 'utf8');
    (assertSourceWiring(_0xb0ea94, /_multiBackplateEls\[imageIndex\] = plate/),
      assertSourceWiring(_0xb0ea94, /plateImg\.className = "multi-stack-backplate-media"/),
      assertSourceWiring(_0xb0ea94, /_setLazyImageDisplaySource\(plateImg,\s*plateDisplayLod\)/),
      assertSourceWiring(_0xb0ea94, /plateImg\.src\s*=\s*plateDisplayLod\.url/, true),
      assertSourceWiring(_0xb0ea94, /_bindResultImageDragOut\(plate,/),
      assertSourceWiring(_0xb0ea94, /_removeCurrentNodeFromSelection\(\)/),
      assertSourceWiring(_0xb0ea94, /selectedIds\.filter\(\(id\) => id !== this\.nodeId\)/),
      assertSourceWiring(_0xb0ea94,
        /this\._removeCurrentNodeFromSelection\(\);\s*store\.updateNodeData\(this\.nodeId,\s*\{\s*isImagesExpanded:\s*true\s*\}\)/,
      ),
      assertSourceWiring(_0xb0ea94, /const showMainImageImmediately = \(targetIdx\) =>/),
      assertSourceWiring(_0xb0ea94, /showMainImageImmediately\(safeTargetIdx\);[\s\S]*setTimeout\(\(\) => \{/),
      assertSourceWiring(_0xb0ea94, /let applyMultiStackCardLayout = \(\) => \{\}/),
      assertSourceWiring(_0xb0ea94, /applyMultiStackCardLayout = \(expanded\) =>/),
      assertSourceWiring(_0xb0ea94, /plate\.classList\.toggle\("is-expanded-card", showExpandedCard\)/),
      assertSourceWiring(_0xb0ea94, /mediaEl\.style\.opacity = showExpandedCard \? "1" : "0"/),
      assertSourceWiring(_0xb0ea94, /this\._loadLazyImageDisplaySource\(mediaEl\)/),
      assertSourceWiring(_0xb0ea94,
        /this\._scheduleClearLazyImageDisplaySource\(\s*mediaEl,\s*multiStackMotionDurationMs,\s*\)/,
      ),
      assertSourceWiring(_0xb0ea94, /this\._clearLazyImageDisplaySource\(mediaEl\)/),
      assertSourceWiring(_0xb0ea94, /this\._setLazyImageDisplaySource\(layerImg,\s*layerDisplayLod\)/),
      assertSourceWiring(_0xb0ea94, /layerImg\.src\s*=\s*layerDisplayLod\.url/, true),
      assertSourceWiring(_0xb0ea94, /top:\s*frame\.top \+ "px"/),
      assertSourceWiring(_0xb0ea94, /const stackThrowTransition =/),
      assertSourceWiring(_0xb0ea94, /cubic-bezier\(0\.175,\s*0\.885,\s*0\.32,\s*1\.27\)/),
      assertSourceWiring(_0xb0ea94, /const playStackPlateTransition =/),
      assertSourceWiring(_0xb0ea94, /plate\.style\.transition = "none"/),
      assertSourceWiring(_0xb0ea94, /requestAnimationFrame\(\(\) => \{/),
      assertSourceWiring(_0xb0ea94, /filter:\s*"brightness\([^"]*blur\(/, true),
      assertSourceWiring(_0xb0ea94, /plate\.animate\(/, true),
      assertSourceWiring(_0xb0ea94, /buildThrowKeyframes/, true),
      assertSourceWiring(_0xb0ea94, /animateStackCardPath/, true),
      assertSourceWiring(_0xb0ea94, /buildStackCardTransform/, true),
      assertSourceWiring(_0xb0ea94, /buildStackCardOvershootTransform/, true),
      assertSourceWiring(_0xb0ea94, /is-transitioning-out/, true),
      assertSourceWiring(_0xb0ea94, /is-stack-consumed/, true),
      assertSourceWiring(_0xb0ea94, /this\._multiStackWrap\.appendChild\(this\._expandPanel\)/, true));
  }));
