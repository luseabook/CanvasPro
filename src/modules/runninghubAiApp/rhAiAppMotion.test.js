import test from 'node:test';
import assert from 'node:assert/strict';
import { reduceMotion, animatePreviewOrder, showGroupPanel } from './rhAiAppMotion.js';

function withMediaQuery(value, run) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'matchMedia');
  if (value === undefined) delete globalThis.matchMedia;
  else globalThis.matchMedia = (query) => ({ query, matches: value });
  try {
    return run();
  } finally {
    if (previous) Object.defineProperty(globalThis, 'matchMedia', previous);
    else delete globalThis.matchMedia;
  }
}

function makeElement(over = {}) {
  const el = {
    rect: 'rect' in over ? over.rect : { left: 0, top: 0, width: 10, height: 10 },
    hidden: 'hidden' in over ? over.hidden : undefined,
    matchedSelector: 'matchedSelector' in over ? over.matchedSelector : null,
    animations: [],
    cancelled: 0,
    animate: 'animate' in over ? over.animate : undefined,
  };
  el.getBoundingClientRect = () => el.rect;
  el.matches = (selector) => el.matchedSelector === selector;
  if (el.animate !== null && el.animate === undefined) {
    el.animate = (keyframes, options) => {
      const handle = {
        keyframes,
        options,
        cancelCount: 0,
        cancel() {
          this.cancelCount += 1;
          el.cancelled += 1;
        },
      };
      el.animations.push(handle);
      return handle;
    };
  }
  return el;
}

test('reduceMotion reflects the reduced-motion media query', () => {
  withMediaQuery(true, () => assert.equal(reduceMotion(), true));
  withMediaQuery(false, () => assert.equal(reduceMotion(), false));
  withMediaQuery(undefined, () => assert.equal(reduceMotion(), false));
});

test('animatePreviewOrder animates an element that moved', () => {
  withMediaQuery(false, () => {
    const el = makeElement({ rect: { left: 100, top: 40 } });
    animatePreviewOrder([el], () => {
      el.rect = { left: 70, top: 55 };
    });
    assert.equal(el.animations.length, 1);
    assert.deepEqual(el.animations[0].keyframes, [
      { transform: 'translate(30px, -15px)' },
      { transform: 'translate(0, 0)' },
    ]);
    assert.equal(el.animations[0].options.duration, 0xd2);
    assert.equal(el.animations[0].options.easing, 'cubic-bezier(0.2, 0, 0.2, 1)');
  });
});

test('animatePreviewOrder skips a sub-pixel move', () => {
  withMediaQuery(false, () => {
    const el = makeElement({ rect: { left: 0, top: 0 } });
    animatePreviewOrder([el], () => {
      el.rect = { left: 0.4, top: 0.4 };
    });
    assert.equal(el.animations.length, 0);
  });
});

test('animatePreviewOrder treats exactly one pixel as animatable and anything less as sub-pixel', () => {
  withMediaQuery(false, () => {
    const below = makeElement({ rect: { left: 0, top: 0 } });
    animatePreviewOrder([below], () => {
      below.rect = { left: 0.49, top: 0.49 };
    });
    assert.equal(below.animations.length, 0);
    const exact = makeElement({ rect: { left: 0, top: 0 } });
    animatePreviewOrder([exact], () => {
      exact.rect = { left: 0.5, top: 0.5 };
    });
    assert.equal(exact.animations.length, 1);
  });
});

test('animatePreviewOrder measures every element before mutating the DOM', () => {
  withMediaQuery(false, () => {
    const first = makeElement({ rect: { left: 0, top: 0 } });
    const second = makeElement({ rect: { left: 0, top: 0 } });
    const order = [];
    const instrument = (element, name) => {
      const original = element.getBoundingClientRect;
      element.getBoundingClientRect = () => {
        order.push(name);
        return original();
      };
    };
    instrument(first, 'measure-first');
    instrument(second, 'measure-second');
    animatePreviewOrder([first, second], () => {
      order.push('swap');
      first.rect = { left: 20, top: 0 };
    });
    assert.deepEqual(order, ['measure-first', 'measure-second', 'swap', 'measure-first', 'measure-second']);
  });
});

test('animatePreviewOrder does nothing under reduced motion', () => {
  withMediaQuery(true, () => {
    const el = makeElement({ rect: { left: 100, top: 0 } });
    animatePreviewOrder([el], () => {
      el.rect = { left: 0, top: 0 };
    });
    assert.equal(el.animations.length, 0);
  });
});

test('animatePreviewOrder skips an element that is being dragged', () => {
  withMediaQuery(false, () => {
    const el = makeElement({
      rect: { left: 100, top: 0 },
      matchedSelector: '.is-dragging, :has(> .is-dragging)',
    });
    animatePreviewOrder([el], () => {
      el.rect = { left: 0, top: 0 };
    });
    assert.equal(el.animations.length, 0);
  });
});

test('animatePreviewOrder cancels the previous animation of the same element', () => {
  withMediaQuery(false, () => {
    const el = makeElement({ rect: { left: 10, top: 0 } });
    animatePreviewOrder([el], () => {
      el.rect = { left: 0, top: 0 };
    });
    const first = el.animations[0];
    animatePreviewOrder([el], () => {
      el.rect = { left: -10, top: 0 };
    });
    assert.equal(first.cancelCount, 1);
    assert.equal(el.animations.length, 2);
  });
});

test('showGroupPanel reveals immediately and stays revealed when the reveal finishes', () => {
  withMediaQuery(false, () => {
    const panel = makeElement({ hidden: true });
    showGroupPanel(panel, true);
    assert.equal(panel.hidden, false);
    assert.equal(panel.animations.length, 1);
    assert.deepEqual(panel.animations[0].keyframes, [
      { opacity: 0, transform: 'translateY(6px) scale(.98)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ]);
    assert.equal(panel.animations[0].options.duration, 0xb4);
    assert.equal(panel.animations[0].options.easing, 'ease-out');
    panel.animations[0].onfinish();
    assert.equal(panel.hidden, false);
  });
});

test('showGroupPanel reverses the keyframes with the shorter duration when hiding', () => {
  withMediaQuery(false, () => {
    const panel = makeElement({ hidden: false });
    showGroupPanel(panel, false);
    assert.equal(panel.hidden, false);
    assert.deepEqual(panel.animations[0].keyframes, [
      { opacity: 1, transform: 'translateY(0) scale(1)' },
      { opacity: 0, transform: 'translateY(6px) scale(.98)' },
    ]);
    assert.equal(panel.animations[0].options.duration, 0x78);
    panel.animations[0].onfinish();
    assert.equal(panel.hidden, true);
  });
});

test('showGroupPanel ignores a stale finish callback after a newer animation', () => {
  withMediaQuery(false, () => {
    const panel = makeElement({ hidden: true });
    showGroupPanel(panel, true);
    const stale = panel.animations[0];
    showGroupPanel(panel, false);
    stale.onfinish();
    assert.equal(panel.hidden, false);
    panel.animations[1].onfinish();
    assert.equal(panel.hidden, true);
  });
});

test('showGroupPanel toggles hidden without animating under reduced motion', () => {
  withMediaQuery(true, () => {
    const panel = makeElement({ hidden: true });
    showGroupPanel(panel, true);
    assert.equal(panel.hidden, false);
    showGroupPanel(panel, false);
    assert.equal(panel.hidden, true);
    assert.equal(panel.animations.length, 0);
  });
});

test('showGroupPanel toggles hidden when the element cannot animate', () => {
  withMediaQuery(false, () => {
    const panel = makeElement({ hidden: true, animate: null });
    showGroupPanel(panel, true);
    assert.equal(panel.hidden, false);
    showGroupPanel(panel, false);
    assert.equal(panel.hidden, true);
  });
});
