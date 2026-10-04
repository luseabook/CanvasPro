import test from 'node:test';
import assert from 'node:assert/strict';
import { __desktopMediaWakeServiceForTest, initDesktopMediaWakeService } from './desktopMediaWakeService.js';
class FakeCustomEvent {
  constructor(value, item = {}) {
    ((this.type = value), (this.detail = item.detail));
  }
}
(test('desktop media wake: init emits wake notifications without media source resets', () => {
  const key = globalThis.window,
    index = globalThis.document,
    result = globalThis.CustomEvent,
    map = new Map(),
    map2 = new Map(),
    list = [];
  try {
    ((globalThis.CustomEvent = FakeCustomEvent),
      (globalThis.window = {
        electronAPI: {},
        addEventListener(data, options) {
          map.set(data, options);
        },
        dispatchEvent(target) {
          list.push(target);
        },
      }),
      (globalThis.document = {
        visibilityState: 'visible',
        addEventListener(source, next) {
          map2.set(source, next);
        },
      }),
      initDesktopMediaWakeService(),
      assert.deepEqual([...map.keys()].sort(), ['focus', 'pageshow']),
      assert.deepEqual([...map2.keys()], ['visibilitychange']),
      assert.equal(map.has('pause'), false),
      assert.equal(map.has('pointerover'), false),
      assert.equal(map2.has('pause'), false),
      assert.equal(map2.has('pointerover'), false),
      map.get('focus')(),
      map.get('pageshow')(),
      map2.get('visibilitychange')(),
      assert.deepEqual(
        list.map((item2) => [item2.type, item2.detail.reason]),
        [
          ['aicanvas:desktop-media-wake', 'focus'],
          ['aicanvas:desktop-media-wake', 'pageshow'],
          ['aicanvas:desktop-media-wake', 'visibilitychange'],
        ],
      ));
  } finally {
    if (typeof key === 'undefined') delete globalThis.window;
    else globalThis.window = key;
    if (typeof index === 'undefined') delete globalThis.document;
    else globalThis.document = index;
    if (typeof result === 'undefined') delete globalThis.CustomEvent;
    else globalThis.CustomEvent = result;
  }
}),
  test('desktop media wake: direct notification carries reason', () => {
    const current = globalThis.window,
      entry = globalThis.CustomEvent,
      list2 = [];
    try {
      ((globalThis.CustomEvent = FakeCustomEvent),
        (globalThis.window = {
          dispatchEvent(record) {
            list2.push(record);
          },
        }),
        __desktopMediaWakeServiceForTest.dispatchRendererWake('manual'),
        assert.equal(list2.length, 1),
        assert.equal(list2[0].type, 'aicanvas:desktop-media-wake'),
        assert.equal(list2[0].detail.reason, 'manual'));
    } finally {
      if (typeof current === 'undefined') delete globalThis.window;
      else globalThis.window = current;
      if (typeof entry === 'undefined') delete globalThis.CustomEvent;
      else globalThis.CustomEvent = entry;
    }
  }));
