import test from 'node:test';
import assert from 'node:assert/strict';

// Check wiring independently of decompiler-local variable names and equivalent string/member notation.
// Public method/property names and the operation sequence remain required by each pattern.
function assertSourceWiring(text, pattern, absent = false) {
  const canonical = text
    .replace(/\\x([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\[['"]([A-Za-z_$][\w$]*)['"]\]/g, '.$1')
    .replace(/'/g, '"')
    .replace(/!!\[\]/g, 'true')
    .replace(/!\[\]/g, 'false');
  const locals =
    /\b(?:store|refreshInitialMultiResultStack|imageIndex|plate|plateImg|plateDisplayLod|selectedIds|id|showMainImageImmediately|targetIdx|safeTargetIdx|applyMultiStackCardLayout|expanded|showExpandedCard|mediaEl|multiStackMotionDurationMs|layerImg|layerDisplayLod|frame|stackThrowTransition|playStackPlateTransition)\b/g;
  const portable = new RegExp(
    pattern.source.replace(locals, '[\\w$]+').replace(/;/g, '(?:;|,)'),
    pattern.flags,
  );
  if (absent) assert.doesNotMatch(canonical, portable);
  else assert.match(canonical, portable);
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
    createElement(value) {
      return {
        tagName: String(value || 'div').toUpperCase(),
        className: '',
        children: [],
        dataset: {},
        attributes: {},
        appendChild(el) {
          return (this.children.push(el), (el.parentNode = this), el);
        },
        setAttribute(item, key) {
          this.attributes[item] = String(key);
        },
      };
    },
  };
}
function createClassListHost() {
  const map = new Set();
  return {
    classList: {
      add(...list) {
        list.forEach((item2) => map.add(item2));
      },
      remove(...list2) {
        list2.forEach((item3) => map.delete(item3));
      },
      toggle(index, enabled) {
        const result = enabled === undefined ? !map.has(index) : !!enabled;
        if (result) map.add(index);
        else map.delete(index);
        return result;
      },
      contains(data) {
        return map.has(data);
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
    const fakeDocument = createFakeDocument(),
      el2 = createMultiResultBackplates(fakeDocument, 5);
    (assert.equal(getMultiResultBackplateCount(2), 1),
      assert.equal(getMultiResultBackplateCount(4), 3),
      assert.equal(getMultiResultBackplateCount(10), 3),
      assert.equal(el2.className, MULTI_RESULT_BACKPLATES_CLASS),
      assert.equal(el2.attributes['aria-hidden'], 'true'),
      assert.equal(el2.children.length, 3),
      assert.equal(el2.children[0].className, MULTI_RESULT_BACKPLATE_CLASS),
      assert.equal(el2.children[0].dataset.stackIndex, '1'),
      assert.equal(el2.children[0].dataset.imageIndex, '1'),
      assert.equal(el2.children[2].dataset.stackIndex, '3'));
  }),
  test('multi result stack backplates: items skip main image without rendering source media', () => {
    const items = buildMultiResultBackplateItems({ imageCount: 4, mainIndex: 1 }),
      el3 = createMultiResultBackplates(createFakeDocument(), 4, { items: items });
    (assert.deepEqual(
      items.map((item4) => item4.imageIndex),
      [0, 2, 3],
    ),
      assert.equal(getMultiResultBackplateKey(items), '0,2,3'),
      assert.equal(el3.children.length, 3),
      assert.equal(el3.children[0].dataset.imageIndex, '0'),
      assert.equal(el3.children[0].children.length, 0));
  }),
  test('multi result stack backplates: expanded state is class-derived', () => {
    const previewEl = createClassListHost(),
      stackWrap = createClassListHost();
    (syncMultiResultStackClasses({
      previewEl: previewEl,
      stackWrap: stackWrap,
      isActive: true,
      isExpanded: true,
    }),
      assert.equal(previewEl.classList.contains(MULTI_RESULT_STACK_PREVIEW_CLASS), true),
      assert.equal(previewEl.classList.contains(MULTI_RESULT_STACK_EXPANDED_CLASS), true),
      assert.equal(stackWrap.classList.contains(MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS), true),
      syncMultiResultStackClasses({
        previewEl: previewEl,
        stackWrap: stackWrap,
        isActive: true,
        isExpanded: false,
      }),
      assert.equal(previewEl.classList.contains(MULTI_RESULT_STACK_PREVIEW_CLASS), true),
      assert.equal(previewEl.classList.contains(MULTI_RESULT_STACK_EXPANDED_CLASS), false),
      assert.equal(stackWrap.classList.contains(MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS), false));
  }),
  test('multi result stack backplates: DOM refresh detects missing backdrop state', () => {
    const previewEl2 = createClassListHost(),
      el4 = createFakeDocument(),
      containerEl = el4.createElement('div'),
      stackWrap2 = el4.createElement('div'),
      backdropWrap = createMultiResultBackplates(el4, 4);
    (containerEl.appendChild(stackWrap2),
      assert.equal(
        shouldRefreshMultiResultStackDom({
          imageCount: 4,
          previewEl: previewEl2,
          containerEl: containerEl,
          stackWrap: stackWrap2,
          backdropWrap: null,
        }),
        true,
      ),
      stackWrap2.appendChild(backdropWrap),
      assert.equal(
        shouldRefreshMultiResultStackDom({
          imageCount: 4,
          previewEl: previewEl2,
          containerEl: containerEl,
          stackWrap: stackWrap2,
          backdropWrap: backdropWrap,
        }),
        true,
      ),
      previewEl2.classList.add(MULTI_RESULT_STACK_PREVIEW_CLASS),
      assert.equal(
        shouldRefreshMultiResultStackDom({
          imageCount: 4,
          previewEl: previewEl2,
          containerEl: containerEl,
          stackWrap: stackWrap2,
          backdropWrap: backdropWrap,
        }),
        false,
      ));
  }),
  test('multi result stack backplates: CSS uses the backplate as the animated card', () => {
    const fileSync = readFileSync(new URL('../../../styles/node-types.css', import.meta.url), 'utf8');
    (assert.match(fileSync, /\.multi-stack-backplates\s*\{[\s\S]*pointer-events:\s*none;/),
      assert.match(fileSync, /\.multi-stack-backplates\s*\{[\s\S]*clip-path:\s*inset\(0 -25% 0 0\);/),
      assert.match(
        fileSync,
        /\.multi-stack-wrap\.is-expanded\s+\.multi-stack-backplates\s*\{[\s\S]*pointer-events:\s*auto;/,
      ),
      assert.match(
        fileSync,
        /\.multi-stack-wrap\.is-expanded\s+\.multi-stack-backplates\s*\{[\s\S]*clip-path:\s*none;/,
      ),
      assert.match(
        fileSync,
        /\.multi-images-container\s*\{[\s\S]*contain:\s*layout;[\s\S]*overflow:\s*visible;/,
      ),
      assert.match(fileSync, /\.multi-stack-wrap\s*\{[\s\S]*overflow:\s*visible;/),
      assert.match(fileSync, /\.multi-stack-backplates\s*\{[\s\S]*z-index:\s*1;/),
      assert.match(
        fileSync,
        /\.img-node-preview\.aigen-image-preview\.is-multi-result-stack-expanded\s*\{[\s\S]*overflow:\s*visible;/,
      ),
      assert.match(fileSync, /\.multi-stack-backplate\.is-expanded-card\s*\{[\s\S]*cursor:\s*pointer;/));
    const options = fileSync.match(/\.multi-stack-backplate\s*\{([\s\S]*?)\}/);
    (assert.ok(options),
      assert.match(options[1], /transition:[\s\S]*opacity 0\.18s ease/),
      assert.doesNotMatch(options[1], /top 0\./),
      assert.doesNotMatch(options[1], /transform 0\./),
      assert.match(
        fileSync,
        /\.multi-stack-backplate\s*\{[\s\S]*border-radius:\s*0 var\(--radius-16\) var\(--radius-16\) 0;/,
      ),
      assert.match(
        fileSync,
        /\.multi-stack-backplate\s*\{[\s\S]*background:\s*linear-gradient\(180deg,\s*var\(--white-20\),\s*var\(--white-08\)\);/,
      ),
      assert.match(fileSync, /\.multi-stack-backplate-media\s*\{[\s\S]*opacity:\s*0;/));
    const target = fileSync.match(/\.multi-stack-backplate-media\s*\{([\s\S]*?)\}/);
    (assert.ok(target), assert.doesNotMatch(target[1], /background(?:-image)?:/));
  }),
  test('multi result stack backplates: UI refreshes after renderer wrapper overflow is applied', () => {
    const fileSync2 = readFileSync(new URL('./uiModule.impl.js', import.meta.url), 'utf8');
    (assertSourceWiring(fileSync2, /requestAnimationFrame\(refreshInitialMultiResultStack\)/),
      assertSourceWiring(fileSync2, /_loadAndDisplayImage\(\{\s*force:\s*true\s*\}\)/),
      assertSourceWiring(fileSync2, /this\._root\?\.style\.setProperty\("overflow",\s*"visible"\)/));
  }),
  test('multi result stack backplates: expanded cards reuse backdrop elements', () => {
    const fileSync3 = readFileSync(new URL('./uiModule.impl.js', import.meta.url), 'utf8');
    (assertSourceWiring(fileSync3, /_multiBackplateEls\[imageIndex\] = plate/),
      assertSourceWiring(fileSync3, /plateImg\.className = "multi-stack-backplate-media"/),
      assertSourceWiring(fileSync3, /_setLazyImageDisplaySource\(plateImg,\s*plateDisplayLod\)/),
      assertSourceWiring(fileSync3, /plateImg\.src\s*=\s*plateDisplayLod\.url/, true),
      assertSourceWiring(fileSync3, /_bindResultImageDragOut\(plate,/),
      assertSourceWiring(fileSync3, /_removeCurrentNodeFromSelection\(\)/),
      assertSourceWiring(fileSync3, /selectedIds\.filter\(\(id\) => id !== this\.nodeId\)/),
      assertSourceWiring(
        fileSync3,
        /this\._removeCurrentNodeFromSelection\(\);\s*store\.updateNodeData\(this\.nodeId,\s*\{\s*isImagesExpanded:\s*true\s*\}\)/,
      ),
      assertSourceWiring(fileSync3, /const showMainImageImmediately = \(targetIdx\) =>/),
      assertSourceWiring(
        fileSync3,
        /showMainImageImmediately\(safeTargetIdx\);[\s\S]*setTimeout\(\(\) => \{/,
      ),
      assertSourceWiring(fileSync3, /let applyMultiStackCardLayout = \(\) => \{\}/),
      assertSourceWiring(fileSync3, /applyMultiStackCardLayout = \(expanded\) =>/),
      assertSourceWiring(fileSync3, /plate\.classList\.toggle\("is-expanded-card", showExpandedCard\)/),
      assertSourceWiring(fileSync3, /mediaEl\.style\.opacity = showExpandedCard \? "1" : "0"/),
      assertSourceWiring(fileSync3, /this\._loadLazyImageDisplaySource\(mediaEl\)/),
      assertSourceWiring(
        fileSync3,
        /this\._scheduleClearLazyImageDisplaySource\(\s*mediaEl,\s*multiStackMotionDurationMs,?\s*\)/,
      ),
      assertSourceWiring(fileSync3, /this\._clearLazyImageDisplaySource\(mediaEl\)/),
      assertSourceWiring(fileSync3, /this\._setLazyImageDisplaySource\(layerImg,\s*layerDisplayLod\)/),
      assertSourceWiring(fileSync3, /layerImg\.src\s*=\s*layerDisplayLod\.url/, true),
      assertSourceWiring(fileSync3, /top:\s*frame\.top \+ "px"/),
      assertSourceWiring(fileSync3, /const stackThrowTransition =/),
      assertSourceWiring(fileSync3, /cubic-bezier\(0\.175,\s*0\.885,\s*0\.32,\s*1\.27\)/),
      assertSourceWiring(fileSync3, /const playStackPlateTransition =/),
      assertSourceWiring(fileSync3, /plate\.style\.transition = "none"/),
      assertSourceWiring(fileSync3, /requestAnimationFrame\(\(\) => \{/),
      assertSourceWiring(fileSync3, /filter:\s*"brightness\([^"]*blur\(/, true),
      assertSourceWiring(fileSync3, /plate\.animate\(/, true),
      assertSourceWiring(fileSync3, /buildThrowKeyframes/, true),
      assertSourceWiring(fileSync3, /animateStackCardPath/, true),
      assertSourceWiring(fileSync3, /buildStackCardTransform/, true),
      assertSourceWiring(fileSync3, /buildStackCardOvershootTransform/, true),
      assertSourceWiring(fileSync3, /is-transitioning-out/, true),
      assertSourceWiring(fileSync3, /is-stack-consumed/, true),
      assertSourceWiring(fileSync3, /this\._multiStackWrap\.appendChild\(this\._expandPanel\)/, true));
  }));
