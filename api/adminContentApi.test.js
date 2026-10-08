import test from 'node:test';
import assert from 'node:assert/strict';

import {
  checkAppUpdate,
  fetchAnnouncements,
  fetchCatalog,
  fetchPromotions,
  fetchSubscriptionGates,
  redeemCoupon,
  refreshAdminContent,
  reportEvent,
  submitFeedback,
} from './adminContentApi.js';

function stubFetch(impl) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return () => {
    globalThis.fetch = original;
  };
}

function ok(body) {
  return {
    ok: true,
    json: async () => body,
  };
}

function failing() {
  return async () => {
    throw new Error('本地服务未就绪');
  };
}

function httpError(status) {
  return async () => ({ ok: false, status, json: async () => ({}) });
}

test('adminContentApi: announcements unwrap the envelope and pass filters', async () => {
  let url;
  const restore = stubFetch(async (target) => {
    url = target;
    return ok({ data: { items: [{ id: 1, title: '维护通知' }] } });
  });
  try {
    const items = await fetchAnnouncements({ plan: 'pro', version: '0.4.12' });
    assert.deepEqual(items, [{ id: 1, title: '维护通知' }]);
    assert.match(url, /plan=pro/);
    assert.match(url, /version=0\.4\.12/);
  } finally {
    restore();
  }
});

test('adminContentApi: read failures degrade to empty results instead of throwing', async () => {
  const restore = stubFetch(failing());
  try {
    assert.deepEqual(await fetchAnnouncements(), []);
    assert.deepEqual(await fetchCatalog(), []);
    assert.deepEqual(await fetchPromotions(), []);
    assert.deepEqual(await fetchSubscriptionGates(), []);
    const update = await checkAppUpdate({ currentVersion: '0.4.12' });
    assert.equal(update.hasUpdate, false);
  } finally {
    restore();
  }
});

test('adminContentApi: non-ok responses degrade the same way', async () => {
  const restore = stubFetch(httpError(500));
  try {
    assert.deepEqual(await fetchAnnouncements(), []);
    assert.equal((await checkAppUpdate()).hasUpdate, false);
  } finally {
    restore();
  }
});

test('adminContentApi: malformed bodies never leak into the UI', async () => {
  for (const body of [null, [], 'x', { items: 'nope' }, {}]) {
    const restore = stubFetch(async () => ok(body));
    try {
      assert.deepEqual(await fetchPromotions(), []);
    } finally {
      restore();
    }
  }
});

test('adminContentApi: update check always reports hasUpdate as a boolean', async () => {
  const restore = stubFetch(async () => ok({ hasUpdate: true, version: '0.4.13' }));
  try {
    const result = await checkAppUpdate({ currentVersion: '0.4.12', channel: 'beta' });
    assert.equal(result.hasUpdate, true);
    assert.equal(result.version, '0.4.13');
  } finally {
    restore();
  }
});

test('adminContentApi: catalog forwards the kind filter', async () => {
  let url;
  const restore = stubFetch(async (target) => {
    url = target;
    return ok({ items: [{ key: 'sdxl', kind: 'model' }] });
  });
  try {
    const items = await fetchCatalog({ kind: 'model' });
    assert.equal(items.length, 1);
    assert.match(url, /kind=model/);
  } finally {
    restore();
  }
});

test('adminContentApi: writes report failures honestly instead of faking success', async () => {
  const restore = stubFetch(failing());
  try {
    const feedback = await submitFeedback({ content: '登不上' });
    assert.equal(feedback.ok, false);
    const coupon = await redeemCoupon({ code: 'ABC123' });
    assert.equal(coupon.ok, false, '兑换失败不能回 ok:true，否则用户以为已经生效');
    const event = await reportEvent({ event: 'startup' });
    assert.equal(event.ok, false);
  } finally {
    restore();
  }
});

test('adminContentApi: writes send the expected payload', async () => {
  const seen = [];
  const restore = stubFetch(async (target, options) => {
    seen.push({ url: target, method: options.method, body: JSON.parse(options.body) });
    return ok({ ok: true, ticketId: 7 });
  });
  try {
    const result = await submitFeedback({ installId: 'i1', content: '登不上', category: 'bug' });
    assert.equal(result.ticketId, 7);
    assert.equal(seen[0].method, 'POST');
    assert.match(seen[0].url, /\/feedback$/);
    assert.equal(seen[0].body.content, '登不上');
    assert.equal(seen[0].body.installId, 'i1');
    await redeemCoupon({ code: 'ABC123', plan: 'pro' });
    assert.equal(seen[1].body.code, 'ABC123');
    await reportEvent({ event: 'startup', detail: { k: 'v' } });
    assert.deepEqual(seen[2].body.detail, { k: 'v' });
    await refreshAdminContent();
    assert.match(seen[3].url, /\/refresh$/);
  } finally {
    restore();
  }
});

test('adminContentApi: event reports omit detail when it is absent', async () => {
  const seen = [];
  const restore = stubFetch(async (target, options) => {
    seen.push(JSON.parse(options.body));
    return ok({ ok: true });
  });
  try {
    await reportEvent({ event: 'startup' });
    assert.equal('detail' in seen[0], false);
    await reportEvent({ event: 'startup', detail: 'not-an-object' });
    assert.equal('detail' in seen[1], false);
  } finally {
    restore();
  }
});
