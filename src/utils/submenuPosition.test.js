import test from 'node:test';
import assert from 'node:assert/strict';

import { positionAnchoredSubmenu } from './submenuPosition.js';

function createSubmenu({ width = 120, height = 200 } = {}) {
  return {
    style: {},
    offsetWidth: width,
    offsetHeight: height,
    scrollHeight: height,
    getBoundingClientRect() {
      return { width, height };
    },
  };
}

test('submenuPosition: returns null when the submenu or anchor is unavailable', () => {
  assert.equal(positionAnchoredSubmenu({ submenu: null, anchorRect: {} }), null);
  assert.equal(positionAnchoredSubmenu({ submenu: createSubmenu(), anchorRect: null }), null);
});

test('submenuPosition: places a fitting submenu on the preferred side', () => {
  const submenu = createSubmenu();
  const anchorRect = { left: 100, right: 200, top: 100, bottom: 140, width: 100, height: 40 };

  const result = positionAnchoredSubmenu({
    submenu,
    anchorRect,
    containerRect: { left: 0, top: 0 },
    viewportWidth: 1000,
    viewportHeight: 800,
  });

  assert.deepEqual(result, { left: 206, top: 100, width: 120, height: 200 });
  assert.equal(submenu.style.position, 'absolute');
  assert.equal(submenu.style.left, '206px');
  assert.equal(submenu.style.top, '100px');
  assert.equal(submenu.style.right, 'auto');
});

test('submenuPosition: flips to the left when the right side lacks room', () => {
  const submenu = createSubmenu({ width: 150, height: 100 });
  const anchorRect = { left: 200, right: 280, top: 20, bottom: 60, width: 80, height: 40 };

  const result = positionAnchoredSubmenu({
    submenu,
    anchorRect,
    containerRect: { left: 0, top: 0 },
    viewportWidth: 300,
    viewportHeight: 400,
  });

  assert.equal(result.left, 44);
  assert.equal(result.top, 20);
  assert.equal(submenu.style.left, '44px');
});

test('submenuPosition: constrains height and vertical position to the viewport', () => {
  const submenu = createSubmenu({ width: 120, height: 200 });
  const anchorRect = { left: 20, right: 100, top: 100, bottom: 140, width: 80, height: 40 };

  const result = positionAnchoredSubmenu({
    submenu,
    anchorRect,
    containerRect: { left: 0, top: 0 },
    verticalPlacement: 'below',
    viewportWidth: 500,
    viewportHeight: 150,
  });

  assert.equal(result.height, 126);
  assert.equal(result.top, 12);
  assert.equal(submenu.style.maxHeight, '126px');
  assert.equal(submenu.style.overflowY, 'auto');
});
