import test from 'node:test';
import assert from 'node:assert/strict';

import { setLocale } from '../i18n/index.js';
import { formatPrice, priceText } from './modelPricingText.js';

test('modelPricingText: known labels localize and unknown labels pass through', (t) => {
  t.after(() => setLocale('zh-CN', { persist: false, notify: false }));
  setLocale('en-US', { persist: false, notify: false });
  assert.equal(priceText('free'), 'Free');
  assert.equal(priceText('missing-key'), 'missing-key');
});

test('modelPricingText: prices use the expected currency and precision', () => {
  assert.equal(formatPrice(0, 'USD'), '$0');
  assert.equal(formatPrice(0.0000005, 'USD'), '<$0.000001');
  assert.equal(formatPrice(12.5, 'USD'), '$12.50');
  assert.equal(formatPrice(1, 'EUR'), 'EUR 1.00');
});

test('modelPricingText: CNY formatting keeps two decimals', () => {
  assert.match(formatPrice(12.5, 'CNY'), /12\.50$/);
});
