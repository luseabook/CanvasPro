import test from 'node:test';
import assert from 'node:assert/strict';

import { setLocale } from '../i18n/index.js';
import {
  buildBinghuoPriceView,
  formatBinghuoUnitPrice,
} from './binghuoPricingPresentation.js';

function useEnglishLocale(t) {
  t.after(() => setLocale('zh-CN', { persist: false, notify: false }));
  setLocale('en-US', { persist: false, notify: false });
}

test('binghuoPricingPresentation: unit prices localize their billing unit', (t) => {
  useEnglishLocale(t);
  assert.equal(
    formatBinghuoUnitPrice({ billing: 'per_second', amount: 0.12 }, { kind: 'video' }),
    '0.12 CNY / second',
  );
  assert.equal(
    formatBinghuoUnitPrice({ billing: 'per_call', amount: 2 }, { kind: 'image' }),
    '2 CNY / image',
  );
});

test('binghuoPricingPresentation: per-second estimates include duration and batch size', (t) => {
  useEnglishLocale(t);
  const view = buildBinghuoPriceView(
    { billing: 'per_second', amount: 0.5 },
    { kind: 'video', model: 'Video Model', params: { batchSize: 2, duration: 3 } },
  );

  assert.equal(view.prefix, 'Reference price');
  assert.equal(view.amountText, '¥3.00');
  assert.equal(view.estimate, 3);
  assert.equal(view.currency, 'CNY');
  assert.deepEqual(view.rows, [
    {
      label: 'Video Model',
      amount: 0.5,
      unit: 'CNY / second',
      section: '',
    },
  ]);
  assert.deepEqual(view.notes, [
    'For reference only; your account invoice is authoritative.',
    'Output usage, references and tools may change the final charge.',
  ]);
});

test('binghuoPricingPresentation: per-image estimates use the requested batch size', (t) => {
  useEnglishLocale(t);
  const supported = buildBinghuoPriceView(
    { billing: 'per_call', amount: 0.25 },
    { kind: 'image', model: 'Image Model', params: { n: 4 } },
  );
  assert.equal(supported.estimate, 1);
  assert.equal(supported.amountText, '¥1.00');
  assert.equal(supported.rows[0].unit, 'CNY / image');

  const invalid = buildBinghuoPriceView(
    { billing: 'per_call', amount: 0.25 },
    { kind: 'image', model: 'Image Model', params: { batchSize: 0 } },
  );
  assert.equal(invalid.estimate, null);
  assert.equal(invalid.amountText, '0.25 CNY / image');
});
