import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assignCanvasImageDisplaySource,
  clearCanvasImageDisplayHandoff,
  deferCanvasImageDisplayFallbackRelease,
} from './canvasImageDisplayHandoff.js';

const HANDOFF_CLASS = 'is-canvas-image-handoff';
const FALLBACK_PROPERTY = '--canvas-image-handoff-fallback';
const FALLBACK_POSITION_PROPERTY = '--canvas-image-handoff-fallback-position';
const FALLBACK_SIZE_PROPERTY = '--canvas-image-handoff-fallback-size';

function image(over = {}) {
  const styleValues = new Map();
  const removedStyleProperties = [];
  const classNames = new Set();
  const listeners = [];

  const style = {
    display: 'block',
    objectFit: '',
    objectPosition: '',
    setProperty(name, value) {
      styleValues.set(name, value);
    },
    removeProperty(name) {
      removedStyleProperties.push(name);
      styleValues.delete(name);
    },
  };

  const classList = {
    add(name) {
      classNames.add(name);
    },
    remove(name) {
      classNames.delete(name);
    },
  };

  const element = {
    tagName: 'IMG',
    src: 'src' in over ? over.src : '',
    currentSrc: 'currentSrc' in over ? over.currentSrc : undefined,
    complete: 'complete' in over ? over.complete : false,
    naturalWidth: 'naturalWidth' in over ? over.naturalWidth : 0,
    dataset: 'dataset' in over ? over.dataset : {},
    style: 'style' in over ? over.style : style,
    classList: 'classList' in over ? over.classList : classList,
    decode: 'decode' in over ? over.decode : undefined,
    getAttribute: 'getAttribute' in over ? over.getAttribute : undefined,
    addEventListener:
      'addEventListener' in over
        ? over.addEventListener
        : (type, handler, options) => {
            listeners.push({ type, handler, options });
          },
    removeEventListener:
      'removeEventListener' in over
        ? over.removeEventListener
        : (type, handler) => {
            const index = listeners.findIndex((entry) => entry.type === type && entry.handler === handler);
            if (index >= 0) listeners.splice(index, 1);
          },
  };

  element.dispatchEvent = (type) => {
    const matching = listeners.filter((entry) => entry.type === type);
    for (const entry of matching) {
      if (entry.options && entry.options.once) element.removeEventListener(type, entry.handler);
      entry.handler({ type });
    }
    return matching.length;
  };

  return { el: element, styleValues, removedStyleProperties, classNames, listeners };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function withComputedStyle(implementation, run) {
  const original = globalThis.getComputedStyle;
  globalThis.getComputedStyle = implementation;
  try {
    return run();
  } finally {
    if (original === undefined) delete globalThis.getComputedStyle;
    else globalThis.getComputedStyle = original;
  }
}

test('rejects a missing element or a blank source', () => {
  const blank = image();
  for (const [element, source] of [
    [null, 'a.jpg'],
    [undefined, 'a.jpg'],
    [blank.el, ''],
    [blank.el, '   '],
    [blank.el, null],
    [blank.el, undefined],
    [blank.el, 0],
  ]) {
    assert.equal(assignCanvasImageDisplaySource(element, source), false);
  }
  assert.deepEqual([...blank.classNames], []);
  assert.equal(blank.el.src, '');
});

test('writes the trimmed source directly when nothing is painted', () => {
  const handoff = image();
  const source = '  plain.jpg  ';
  assert.equal(assignCanvasImageDisplaySource(handoff.el, source), true);
  assert.equal(handoff.el.src, 'plain.jpg');
  assert.equal(source, '  plain.jpg  ');
  assert.deepEqual([...handoff.classNames], []);
  assert.deepEqual([...handoff.styleValues.keys()], []);
  assert.deepEqual(handoff.listeners, []);
});

test('ignores a source that already matches the element', () => {
  assert.equal(assignCanvasImageDisplaySource(image({ src: 'a.jpg' }).el, 'a.jpg'), false);
  assert.equal(assignCanvasImageDisplaySource(image({ src: 'a.jpg' }).el, ' a.jpg '), false);
  assert.equal(
    assignCanvasImageDisplaySource(image({ src: 'old.jpg', currentSrc: 'live.jpg' }).el, 'live.jpg'),
    false,
  );
  assert.equal(assignCanvasImageDisplaySource(image({ src: 'prop.jpg' }).el, 'prop.jpg'), false);
});

test('reads the source from the attribute before the live url and the property', () => {
  const attributed = image({
    src: 'prop.jpg',
    currentSrc: 'live.jpg',
    getAttribute: (name) => (name === 'src' ? 'attr.jpg' : null),
  });
  assert.equal(assignCanvasImageDisplaySource(attributed.el, 'attr.jpg'), false);
  assert.equal(assignCanvasImageDisplaySource(attributed.el, 'live.jpg'), true);

  const live = image({ src: 'prop.jpg', currentSrc: 'live.jpg' });
  assert.equal(assignCanvasImageDisplaySource(live.el, 'live.jpg'), false);
  assert.equal(assignCanvasImageDisplaySource(live.el, 'prop.jpg'), true);

  const unknownAttribute = image({ src: 'prop.jpg', getAttribute: () => null });
  assert.equal(assignCanvasImageDisplaySource(unknownAttribute.el, 'prop.jpg'), false);
});

test('adopts the painted source as the handoff fallback', () => {
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 320 });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  assert.equal(handoff.el.src, 'b.jpg');
  assert.equal(handoff.classNames.has(HANDOFF_CLASS), true);
  assert.equal(handoff.styleValues.get(FALLBACK_PROPERTY), 'url("a.jpg")');
  assert.equal(handoff.styleValues.get(FALLBACK_POSITION_PROPERTY), 'center');
  assert.equal(handoff.styleValues.get(FALLBACK_SIZE_PROPERTY), 'cover');
  assert.deepEqual(
    handoff.listeners.map((entry) => entry.type),
    ['load', 'error'],
  );
  assert.deepEqual(
    handoff.listeners.map((entry) => entry.options),
    [{ once: true }, { once: true }],
  );
  assert.deepEqual(handoff.el.dataset, {});
});

test('escapes the fallback source through json stringify', () => {
  const handoff = image({ src: 'a"b.jpg', complete: true, naturalWidth: 10 });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'c.jpg'), true);
  assert.equal(handoff.styleValues.get(FALLBACK_PROPERTY), 'url("a\\"b.jpg")');
});

test('maps the object fit to the fallback size', () => {
  const cases = [
    ['contain', 'center', 'contain'],
    ['scale-down', 'center', 'contain'],
    ['fill', 'center', '100% 100%'],
    ['none', 'center', 'auto'],
    ['cover', 'center', 'cover'],
    ['unexpected', 'center', 'cover'],
    ['', 'center', 'cover'],
    ['contain', 'top left', 'contain'],
    ['contain', '  ', 'contain'],
  ];
  for (const [fit, position, size] of cases) {
    const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 5 });
    handoff.el.style.objectFit = fit;
    handoff.el.style.objectPosition = position;
    assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
    assert.equal(handoff.styleValues.get(FALLBACK_SIZE_PROPERTY), size, `${fit} size`);
    assert.equal(
      handoff.styleValues.get(FALLBACK_POSITION_PROPERTY),
      position.trim() === '' ? 'center' : position,
      `${fit} position`,
    );
  }
});

test('prefers an inline object fit over the computed style', () => {
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 5 });
  handoff.el.style.objectFit = 'none';
  handoff.el.style.objectPosition = 'bottom right';
  withComputedStyle(
    () => ({ objectFit: 'fill', objectPosition: 'top left' }),
    () => {
      assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
    },
  );
  assert.equal(handoff.styleValues.get(FALLBACK_SIZE_PROPERTY), 'auto');
  assert.equal(handoff.styleValues.get(FALLBACK_POSITION_PROPERTY), 'bottom right');
});

test('falls back to the default layout when the computed style read throws', () => {
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 5 });
  withComputedStyle(
    () => {
      throw new Error('getComputedStyle is unavailable');
    },
    () => {
      assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
    },
  );
  assert.equal(handoff.styleValues.get(FALLBACK_SIZE_PROPERTY), 'cover');
  assert.equal(handoff.styleValues.get(FALLBACK_POSITION_PROPERTY), 'center');
});

test('treats a missing natural width as painted', () => {
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: undefined });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  assert.equal(handoff.classNames.has(HANDOFF_CLASS), true);
  assert.equal(handoff.styleValues.get(FALLBACK_PROPERTY), 'url("a.jpg")');
});

test('skips the handoff when the element cannot paint', () => {
  const cases = [
    { src: 'a.jpg', complete: true, naturalWidth: 100, display: 'none' },
    { src: 'a.jpg', complete: false, naturalWidth: 100 },
    { src: 'a.jpg', complete: true, naturalWidth: 0 },
  ];
  for (const over of cases) {
    const handoff = image(over);
    handoff.el.style.display = over.display || 'block';
    assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
    assert.equal(handoff.el.src, 'b.jpg');
    assert.deepEqual([...handoff.classNames], []);
    assert.deepEqual([...handoff.styleValues.keys()], []);
    assert.deepEqual(handoff.listeners, []);
  }
});

test('leaves a whitespace attribute source out of the handoff', () => {
  const handoff = image({
    currentSrc: 'live.jpg',
    complete: true,
    naturalWidth: 100,
    getAttribute: () => '   ',
  });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  assert.equal(handoff.el.src, 'b.jpg');
  assert.deepEqual([...handoff.classNames], []);
  assert.deepEqual([...handoff.styleValues.keys()], []);
});

test('deferring requires a matching handoff and a function', () => {
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 1 });
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', () => {}),
    false,
  );
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'b.jpg', () => {}),
    false,
  );
  assert.equal(deferCanvasImageDisplayFallbackRelease(handoff.el, '  a.jpg  ', 'nope'), false);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, '', () => {}),
    false,
  );
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(null, 'a.jpg', () => {}),
    false,
  );
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', () => {}),
    true,
  );
});

test('releases the deferred callbacks when the handoff clears', () => {
  const released = [];
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 1 });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', (source) => released.push(source)),
    true,
  );
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', (source) => released.push(`${source}!`)),
    true,
  );
  assert.equal(clearCanvasImageDisplayHandoff(handoff.el), true);
  assert.deepEqual(released, ['a.jpg', 'a.jpg!']);
  assert.equal(handoff.classNames.has(HANDOFF_CLASS), false);
  assert.deepEqual(handoff.removedStyleProperties, [
    FALLBACK_PROPERTY,
    FALLBACK_POSITION_PROPERTY,
    FALLBACK_SIZE_PROPERTY,
  ]);
  assert.deepEqual(handoff.listeners, []);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', () => {}),
    false,
  );
});

test('clears the fallback styling even without a handoff', () => {
  const handoff = image({ src: 'a.jpg' });
  handoff.el.style.setProperty(FALLBACK_PROPERTY, 'url("old.jpg")');
  handoff.el.classList.add(HANDOFF_CLASS);
  assert.equal(clearCanvasImageDisplayHandoff(handoff.el), false);
  assert.equal(handoff.classNames.has(HANDOFF_CLASS), false);
  assert.deepEqual(handoff.removedStyleProperties, [
    FALLBACK_PROPERTY,
    FALLBACK_POSITION_PROPERTY,
    FALLBACK_SIZE_PROPERTY,
  ]);
  assert.equal(clearCanvasImageDisplayHandoff(null), false);
});

test('carries the deferred callbacks over when the fallback survives', () => {
  const released = [];
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 10 });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', (source) => released.push(source)),
    true,
  );
  handoff.el.complete = false;
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'c.jpg'), true);
  assert.deepEqual(released, []);
  assert.equal(handoff.el.src, 'c.jpg');
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', () => {}),
    true,
  );
});

test('releases the previous callbacks when the fallback is replaced', () => {
  const released = [];
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 10 });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', (source) => released.push(source)),
    true,
  );
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'c.jpg'), true);
  assert.deepEqual(released, ['a.jpg']);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', () => {}),
    false,
  );
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'b.jpg', () => {}),
    true,
  );
});

test('removes the previous listeners when a handoff is reassigned', () => {
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 10 });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  const firstLoad = handoff.listeners.find((entry) => entry.type === 'load').handler;
  assert.equal(handoff.listeners.length, 2);
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'c.jpg'), true);
  assert.equal(handoff.el.src, 'c.jpg');
  assert.equal(handoff.listeners.length, 2);
  assert.equal(
    handoff.listeners.some((entry) => entry.handler === firstLoad),
    false,
  );
});

test('ignores a source that already matches the live handoff target', () => {
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 10 });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), false);
  assert.equal(assignCanvasImageDisplaySource(handoff.el, ' b.jpg '), false);
});

test('finishes the handoff once the replacement has painted', async () => {
  const released = [];
  const decoded = [];
  const handoff = image({
    src: 'a.jpg',
    complete: true,
    naturalWidth: 10,
    decode: () => {
      decoded.push('decode');
      return Promise.resolve();
    },
  });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', (source) => released.push(source)),
    true,
  );
  assert.equal(handoff.el.dispatchEvent('load'), 1);
  await settle();
  assert.deepEqual(decoded, ['decode']);
  assert.deepEqual(released, ['a.jpg']);
  assert.equal(handoff.classNames.has(HANDOFF_CLASS), false);
  assert.deepEqual(handoff.removedStyleProperties, [
    FALLBACK_PROPERTY,
    FALLBACK_POSITION_PROPERTY,
    FALLBACK_SIZE_PROPERTY,
  ]);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', () => {}),
    false,
  );
});

test('finishes the handoff when decoding rejects', async () => {
  const handoff = image({
    src: 'a.jpg',
    complete: true,
    naturalWidth: 10,
    decode: () => Promise.reject(new Error('decode failed')),
  });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  assert.equal(handoff.el.dispatchEvent('load'), 1);
  await settle();
  assert.equal(handoff.classNames.has(HANDOFF_CLASS), false);
});

test('leaves the handoff pending when the replacement is not painted yet', async () => {
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 10 });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  handoff.el.complete = false;
  handoff.el.naturalWidth = 0;
  assert.equal(handoff.el.dispatchEvent('load'), 1);
  await settle();
  assert.equal(handoff.classNames.has(HANDOFF_CLASS), true);
  assert.deepEqual(handoff.removedStyleProperties, []);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', () => {}),
    true,
  );
  assert.equal(
    handoff.listeners.some((entry) => entry.type === 'load'),
    false,
  );
  assert.equal(handoff.el.dispatchEvent('load'), 0);
  await settle();
  assert.equal(handoff.classNames.has(HANDOFF_CLASS), true);
});

test('restores the fallback source and lod after a load error', () => {
  const released = [];
  const handoff = image({
    src: 'a.jpg',
    complete: true,
    naturalWidth: 10,
    dataset: { lodSrc: 'lod-a.jpg' },
  });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', (source) => released.push(source)),
    true,
  );
  delete handoff.el.dataset.lodSrc;
  handoff.el.complete = false;
  handoff.el.naturalWidth = 0;
  assert.equal(handoff.el.dispatchEvent('error'), 1);
  assert.equal(handoff.el.src, 'a.jpg');
  assert.equal(handoff.el.dataset.lodSrc, 'lod-a.jpg');
  assert.equal(handoff.classNames.has(HANDOFF_CLASS), true);
  assert.deepEqual(released, []);
  assert.deepEqual(
    handoff.listeners.map((entry) => entry.type),
    ['load', 'error'],
  );
});

test('restores the fallback synchronously when it is already painted', () => {
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 10 });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  assert.equal(handoff.el.dispatchEvent('error'), 1);
  assert.equal(handoff.el.src, 'a.jpg');
  assert.equal(handoff.classNames.has(HANDOFF_CLASS), false);
  assert.deepEqual(handoff.listeners, []);
});

test('drops the deferred callbacks when the restored fallback also fails', () => {
  const released = [];
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 10 });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', (source) => released.push(source)),
    true,
  );
  handoff.el.complete = false;
  handoff.el.naturalWidth = 0;
  assert.equal(handoff.el.dispatchEvent('error'), 1);
  assert.equal(handoff.el.src, 'a.jpg');
  assert.equal(handoff.el.dispatchEvent('error'), 1);
  assert.equal(handoff.classNames.has(HANDOFF_CLASS), false);
  assert.deepEqual(released, []);
  assert.equal(handoff.el.dataset.lodSrc, undefined);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', () => {}),
    false,
  );
});

test('finishes the restored fallback without dropping the handoff', () => {
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 10 });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  handoff.el.complete = false;
  handoff.el.naturalWidth = 0;
  assert.equal(handoff.el.dispatchEvent('error'), 1);
  handoff.el.complete = true;
  handoff.el.naturalWidth = 12;
  assert.equal(handoff.el.dispatchEvent('load'), 1);
  assert.equal(handoff.classNames.has(HANDOFF_CLASS), false);
  assert.deepEqual(handoff.removedStyleProperties, [
    FALLBACK_PROPERTY,
    FALLBACK_POSITION_PROPERTY,
    FALLBACK_SIZE_PROPERTY,
  ]);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', () => {}),
    true,
  );
});

test('deletes a stale lod source when the handoff captured none', () => {
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 10 });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  handoff.el.dataset.lodSrc = 'stale.jpg';
  handoff.el.complete = false;
  assert.equal(handoff.el.dispatchEvent('error'), 1);
  assert.equal('lodSrc' in handoff.el.dataset, false);
});

test('keeps handoff state per element', () => {
  const first = image({ src: 'a1.jpg', complete: true, naturalWidth: 5 });
  const second = image({ src: 'b1.jpg', complete: true, naturalWidth: 5 });
  assert.equal(assignCanvasImageDisplaySource(first.el, 'a2.jpg'), true);
  assert.equal(assignCanvasImageDisplaySource(second.el, 'b2.jpg'), true);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(first.el, 'a1.jpg', () => {}),
    true,
  );
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(second.el, 'b1.jpg', () => {}),
    true,
  );
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(first.el, 'b1.jpg', () => {}),
    false,
  );
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(second.el, 'a1.jpg', () => {}),
    false,
  );
  assert.equal(clearCanvasImageDisplayHandoff(first.el), true);
  assert.equal(clearCanvasImageDisplayHandoff(second.el), true);
});

test('tolerates elements without styling or event hooks', () => {
  const bare = { src: 'a.jpg', complete: true, naturalWidth: 5, dataset: {} };
  assert.equal(assignCanvasImageDisplaySource(bare, 'b.jpg'), true);
  assert.equal(bare.src, 'b.jpg');
  assert.equal(clearCanvasImageDisplayHandoff(bare), true);

  const unstyled = image({ src: 'a.jpg', complete: true, naturalWidth: 5, style: null, classList: null });
  assert.equal(assignCanvasImageDisplaySource(unstyled.el, 'b.jpg'), true);
  assert.equal(unstyled.el.src, 'b.jpg');
  assert.equal(clearCanvasImageDisplayHandoff(unstyled.el), true);

  const silent = image({
    src: 'a.jpg',
    complete: true,
    naturalWidth: 5,
    addEventListener: null,
    removeEventListener: null,
  });
  assert.equal(assignCanvasImageDisplaySource(silent.el, 'b.jpg'), true);
  assert.equal(clearCanvasImageDisplayHandoff(silent.el), true);
});

test('releases the deferred callbacks once and swallows callback errors', () => {
  const released = [];
  const handoff = image({ src: 'a.jpg', complete: true, naturalWidth: 5 });
  assert.equal(assignCanvasImageDisplaySource(handoff.el, 'b.jpg'), true);
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', () => {
      throw new Error('callback exploded');
    }),
    true,
  );
  assert.equal(
    deferCanvasImageDisplayFallbackRelease(handoff.el, 'a.jpg', (source) => released.push(source)),
    true,
  );
  assert.equal(clearCanvasImageDisplayHandoff(handoff.el), true);
  assert.deepEqual(released, ['a.jpg']);
  assert.equal(clearCanvasImageDisplayHandoff(handoff.el), false);
});
