import assert from 'node:assert/strict';
import test from 'node:test';
import {
  scrollClosestElementHorizontallyWithWheel,
  scrollElementHorizontallyWithWheel,
} from './workspaceHorizontalWheel.js';

function createScrollable({
  scrollWidth = 300,
  clientWidth = 100,
  scrollLeft = 0,
  extra = {},
  ...rest
} = {}) {
  return { scrollWidth: scrollWidth, clientWidth: clientWidth, scrollLeft: scrollLeft, ...rest, ...extra };
}

function createWheelEvent({ deltaX = 0, deltaY = 0, deltaMode = 0, target = null } = {}) {
  const calls = { preventDefault: 0, stopPropagation: 0 };
  return {
    calls: calls,
    deltaX: deltaX,
    deltaY: deltaY,
    deltaMode: deltaMode,
    target: target,
    preventDefault: () => {
      calls.preventDefault += 1;
    },
    stopPropagation: () => {
      calls.stopPropagation += 1;
    },
  };
}

test('a missing scroll element is declined without touching the event', () => {
  const event = createWheelEvent({ deltaY: 40 });
  assert.equal(scrollElementHorizontallyWithWheel(event, null), false);
  assert.equal(scrollElementHorizontallyWithWheel(event, undefined), false);
  assert.equal(event.calls.preventDefault, 0);
  assert.equal(event.calls.stopPropagation, 0);
});

test('a container without horizontal overflow is declined', () => {
  const event = createWheelEvent({ deltaY: 40 });
  const element = createScrollable({ scrollWidth: 100, clientWidth: 100 });
  assert.equal(scrollElementHorizontallyWithWheel(event, element), false);
  assert.equal(element.scrollLeft, 0);
  assert.equal(event.calls.preventDefault, 0);

  const narrower = createScrollable({ scrollWidth: 80, clientWidth: 100 });
  assert.equal(scrollElementHorizontallyWithWheel(event, narrower), false);
});

test('a wheel event with no usable delta is declined', () => {
  const element = createScrollable({ scrollLeft: 50 });
  for (const event of [
    createWheelEvent(),
    createWheelEvent({ deltaX: 0, deltaY: 0 }),
    createWheelEvent({ deltaX: 'nope', deltaY: null }),
  ]) {
    assert.equal(scrollElementHorizontallyWithWheel(event, element), false);
    assert.equal(event.calls.preventDefault, 0);
  }
  assert.equal(element.scrollLeft, 50);
});

test('a plain wheel gesture scrolls and consumes the event', () => {
  const event = createWheelEvent({ deltaY: 40 });
  const element = createScrollable({ scrollLeft: 50 });
  assert.equal(scrollElementHorizontallyWithWheel(event, element), true);
  assert.equal(element.scrollLeft, 90);
  assert.equal(event.calls.preventDefault, 1);
  assert.equal(event.calls.stopPropagation, 0);
});

test('stopPropagation is forwarded only when asked for', () => {
  const event = createWheelEvent({ deltaY: 40 });
  const element = createScrollable({ scrollLeft: 50 });
  assert.equal(scrollElementHorizontallyWithWheel(event, element, { stopPropagation: true }), true);
  assert.equal(element.scrollLeft, 90);
  assert.equal(event.calls.preventDefault, 1);
  assert.equal(event.calls.stopPropagation, 1);
});

test('the dominant axis wins when both deltas are present', () => {
  const event = createWheelEvent({ deltaX: -10, deltaY: 3 });
  const element = createScrollable({ scrollLeft: 150 });
  assert.equal(scrollElementHorizontallyWithWheel(event, element), true);
  assert.equal(element.scrollLeft, 140);

  const verticalEvent = createWheelEvent({ deltaX: -3, deltaY: 10 });
  const verticalElement = createScrollable({ scrollLeft: 150 });
  assert.equal(scrollElementHorizontallyWithWheel(verticalEvent, verticalElement), true);
  assert.equal(verticalElement.scrollLeft, 160);
});

test('line and page delta modes scale the movement', () => {
  const lineEvent = createWheelEvent({ deltaY: 1, deltaMode: 1 });
  const lineElement = createScrollable({ scrollLeft: 50 });
  assert.equal(scrollElementHorizontallyWithWheel(lineEvent, lineElement), true);
  assert.equal(lineElement.scrollLeft, 66);

  const pageEvent = createWheelEvent({ deltaY: 1, deltaMode: 2 });
  const pageElement = createScrollable({ clientWidth: 100, scrollLeft: 50 });
  assert.equal(scrollElementHorizontallyWithWheel(pageEvent, pageElement), true);
  assert.equal(pageElement.scrollLeft, 150);

  const narrowPageEvent = createWheelEvent({ deltaY: 1, deltaMode: 2 });
  const narrowPageElement = createScrollable({ clientWidth: 0, scrollLeft: 50 });
  assert.equal(scrollElementHorizontallyWithWheel(narrowPageEvent, narrowPageElement), true);
  assert.equal(narrowPageElement.scrollLeft, 51);
});

test('an unknown delta mode behaves like pixel mode', () => {
  const event = createWheelEvent({ deltaY: 7, deltaMode: 3 });
  const element = createScrollable({ scrollLeft: 50 });
  assert.equal(scrollElementHorizontallyWithWheel(event, element), true);
  assert.equal(element.scrollLeft, 57);
});

test('movement is clamped and refused at both ends', () => {
  const atStart = createWheelEvent({ deltaY: -40 });
  const startElement = createScrollable({ scrollLeft: 0 });
  assert.equal(scrollElementHorizontallyWithWheel(atStart, startElement), false);
  assert.equal(startElement.scrollLeft, 0);
  assert.equal(atStart.calls.preventDefault, 0);

  const atEnd = createWheelEvent({ deltaY: 40 });
  const endElement = createScrollable({ scrollLeft: 200 });
  assert.equal(scrollElementHorizontallyWithWheel(atEnd, endElement), false);
  assert.equal(endElement.scrollLeft, 200);
  assert.equal(atEnd.calls.preventDefault, 0);
});

test('an overshooting gesture lands exactly on the boundary', () => {
  const event = createWheelEvent({ deltaY: 500 });
  const element = createScrollable({ scrollLeft: 50 });
  assert.equal(scrollElementHorizontallyWithWheel(event, element), true);
  assert.equal(element.scrollLeft, 200);
  assert.equal(event.calls.preventDefault, 1);
});

test('a negative reported scrollLeft is treated as the start', () => {
  const event = createWheelEvent({ deltaY: 5 });
  const element = createScrollable({ scrollLeft: -50 });
  assert.equal(scrollElementHorizontallyWithWheel(event, element), true);
  assert.equal(element.scrollLeft, 5);
});

test('the closest-element helper declines when nothing matches', () => {
  const event = createWheelEvent({ deltaY: 40, target: {} });
  assert.equal(scrollClosestElementHorizontallyWithWheel(event, '.scroll-row'), false);
  const matchingTarget = { closest: () => null };
  assert.equal(
    scrollClosestElementHorizontallyWithWheel(
      createWheelEvent({ deltaY: 40, target: matchingTarget }),
      '.scroll-row',
    ),
    false,
  );
  const noTargetEvent = createWheelEvent({ deltaY: 40 });
  assert.equal(scrollClosestElementHorizontallyWithWheel(noTargetEvent, '.scroll-row'), false);
});

test('the closest-element helper honours a boundary root', () => {
  const element = createScrollable({ scrollLeft: 50 });
  const target = { closest: () => element };
  const boundaryRoot = { contains: () => true };

  const event = createWheelEvent({ deltaY: 40, target: target });
  assert.equal(
    scrollClosestElementHorizontallyWithWheel(event, '.scroll-row', { boundaryRoot: boundaryRoot }),
    true,
  );
  assert.equal(element.scrollLeft, 90);

  const outsideRoot = { contains: () => false };
  const outsideElement = createScrollable({ scrollLeft: 50 });
  const outsideEvent = createWheelEvent({ deltaY: 40, target: { closest: () => outsideElement } });
  assert.equal(
    scrollClosestElementHorizontallyWithWheel(outsideEvent, '.scroll-row', { boundaryRoot: outsideRoot }),
    false,
  );
  assert.equal(outsideElement.scrollLeft, 50);
});

test('the closest-element helper forwards stopPropagation to the scroll', () => {
  const element = createScrollable({ scrollLeft: 50 });
  const event = createWheelEvent({ deltaY: 40, target: { closest: () => element } });
  assert.equal(
    scrollClosestElementHorizontallyWithWheel(event, '.scroll-row', { stopPropagation: true }),
    true,
  );
  assert.equal(element.scrollLeft, 90);
  assert.equal(event.calls.stopPropagation, 1);
});

test('a nested horizontal consumer keeps the gesture for itself', () => {
  const container = createScrollable({ scrollWidth: 600, clientWidth: 200, scrollLeft: 100 });
  const nested = createScrollable({
    scrollWidth: 400,
    clientWidth: 100,
    scrollLeft: 50,
    extra: { parentElement: container, closest: () => container },
  });
  const event = createWheelEvent({ deltaX: 30, target: nested });
  const readComputedStyle = (element) => ({
    overflowX: element === nested ? 'auto' : 'visible',
    overflowY: 'visible',
  });

  assert.equal(
    scrollClosestElementHorizontallyWithWheel(event, '.scroll-row', {
      preserveNestedScrollable: true,
      getComputedStyle: readComputedStyle,
    }),
    false,
  );
  assert.equal(container.scrollLeft, 100);
  assert.equal(nested.scrollLeft, 50);
  assert.equal(event.calls.preventDefault, 0);
});

test('a nested consumer at a scroll limit no longer holds the gesture', () => {
  const container = createScrollable({ scrollWidth: 600, clientWidth: 200, scrollLeft: 100 });
  const nested = createScrollable({
    scrollWidth: 400,
    clientWidth: 100,
    scrollLeft: 300,
    extra: { parentElement: container, closest: () => container },
  });
  const event = createWheelEvent({ deltaX: 30, target: nested });
  const readComputedStyle = (element) => ({ overflowX: element === nested ? 'auto' : 'visible' });

  assert.equal(
    scrollClosestElementHorizontallyWithWheel(event, '.scroll-row', {
      preserveNestedScrollable: true,
      getComputedStyle: readComputedStyle,
    }),
    true,
  );
  assert.equal(container.scrollLeft, 130);
  assert.equal(nested.scrollLeft, 300);
});

test('a nested vertical consumer also wins over horizontal scrolling', () => {
  const container = createScrollable({ scrollWidth: 600, clientWidth: 200, scrollLeft: 100 });
  const nested = createScrollable({
    scrollHeight: 500,
    clientHeight: 120,
    scrollTop: 40,
    extra: { parentElement: container, closest: () => container },
  });
  const event = createWheelEvent({ deltaY: 25, target: nested });
  const readComputedStyle = (element) => ({
    overflowX: 'visible',
    overflowY: element === nested ? 'scroll' : 'visible',
  });

  assert.equal(
    scrollClosestElementHorizontallyWithWheel(event, '.scroll-row', {
      preserveNestedScrollable: true,
      getComputedStyle: readComputedStyle,
    }),
    false,
  );
  assert.equal(container.scrollLeft, 100);
});

test('nested consumers are ignored unless the option is on', () => {
  const container = createScrollable({ scrollWidth: 600, clientWidth: 200, scrollLeft: 100 });
  const nested = createScrollable({
    scrollWidth: 400,
    clientWidth: 100,
    scrollLeft: 50,
    extra: { parentElement: container, closest: () => container },
  });
  const event = createWheelEvent({ deltaX: 30, target: nested });
  const readComputedStyle = () => ({ overflowX: 'auto', overflowY: 'auto' });

  assert.equal(
    scrollClosestElementHorizontallyWithWheel(event, '.scroll-row', { getComputedStyle: readComputedStyle }),
    true,
  );
  assert.equal(container.scrollLeft, 130);
});

test('a container that matches itself never vetoes its own gesture', () => {
  const element = createScrollable({ scrollWidth: 600, clientWidth: 200, scrollLeft: 100 });
  element.closest = () => element;
  const event = createWheelEvent({ deltaX: 30, target: element });
  const readComputedStyle = () => ({ overflowX: 'auto', overflowY: 'visible' });

  assert.equal(
    scrollClosestElementHorizontallyWithWheel(event, '.scroll-row', {
      preserveNestedScrollable: true,
      getComputedStyle: readComputedStyle,
    }),
    true,
  );
  assert.equal(element.scrollLeft, 130);
});

test('without any computed-style source the nested check steps aside', () => {
  assert.equal(typeof globalThis['getComputedStyle'] !== 'function', true);
  const container = createScrollable({ scrollWidth: 600, clientWidth: 200, scrollLeft: 100 });
  const nested = createScrollable({
    scrollWidth: 400,
    clientWidth: 100,
    scrollLeft: 50,
    extra: { parentElement: container, closest: () => container },
  });
  const event = createWheelEvent({ deltaX: 30, target: nested });

  assert.equal(
    scrollClosestElementHorizontallyWithWheel(event, '.scroll-row', { preserveNestedScrollable: true }),
    true,
  );
  assert.equal(container.scrollLeft, 130);
});
