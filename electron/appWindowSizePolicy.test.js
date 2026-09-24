import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_WINDOW_MIN_HEIGHT, APP_WINDOW_MIN_WIDTH } from './appWindowSizePolicy.js';

test('APP_WINDOW_MIN_WIDTH is the 1280 DIP floor used by the taskbar identity script', () => {
  assert.equal(APP_WINDOW_MIN_WIDTH, 0x500);
  assert.equal(APP_WINDOW_MIN_WIDTH, 1280);
});

test('APP_WINDOW_MIN_HEIGHT is the 720 DIP floor used by the taskbar identity script', () => {
  assert.equal(APP_WINDOW_MIN_HEIGHT, 0x2d0);
  assert.equal(APP_WINDOW_MIN_HEIGHT, 720);
});

test('both window size floors are positive integers', () => {
  for (const value of [APP_WINDOW_MIN_WIDTH, APP_WINDOW_MIN_HEIGHT]) {
    assert.equal(typeof value, 'number');
    assert.ok(Number.isInteger(value));
    assert.ok(value > 0x0);
  }
});
