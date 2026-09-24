import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertRunningHubDefinitionProfile,
  getDefaultRunningHubProfileId,
  getRunningHubProfileShortLabel,
  syncRunningHubProfileBadge,
} from './rhAiAppRunningHubProfile.js';

const DOM = 'runninghub';
const INTL = 'runninghub-international';

test('assertRunningHubDefinitionProfile：JSON 解析失败一律静默返回，不抛异常', () => {
  for (const bad of ['', '   ', 'not json', '{providerProfileId:', '{"a":', '[', 'undefined']) {
    assert.equal(assertRunningHubDefinitionProfile(bad, DOM), undefined, `input=${JSON.stringify(bad)}`);
  }
  assert.equal(assertRunningHubDefinitionProfile(undefined, DOM), undefined);
});

test('assertRunningHubDefinitionProfile：无 providerProfileId 或其为假值时放行', () => {
  assert.equal(assertRunningHubDefinitionProfile('{}', DOM), undefined);
  assert.equal(assertRunningHubDefinitionProfile('{"providerProfileId":""}', 'anything'), undefined);
  assert.equal(assertRunningHubDefinitionProfile('{"providerProfileId":null}', 'anything'), undefined);
  assert.equal(assertRunningHubDefinitionProfile('{"providerProfileId":0}', 'anything'), undefined);
  assert.equal(assertRunningHubDefinitionProfile('null', DOM), undefined);
  assert.equal(assertRunningHubDefinitionProfile('[{"providerProfileId":"x"}]', DOM), undefined);
});

test('assertRunningHubDefinitionProfile：站点不一致抛固定文案错误，一致则放行', () => {
  assert.equal(assertRunningHubDefinitionProfile(`{"providerProfileId":"${INTL}"}`, INTL), undefined);
  assert.throws(() => assertRunningHubDefinitionProfile(`{"providerProfileId":"${INTL}"}`, DOM), {
    message: '站点与已获取配置不一致，请在当前站点重新获取配置，或切回原站点',
  });
});

test('assertRunningHubDefinitionProfile：比较是严格不等、不做站点归一 ⇒ 大小写与空格都会被判不一致', () => {
  assert.throws(() => assertRunningHubDefinitionProfile(`{"providerProfileId":"${INTL}"}`, ` ${INTL} `));
  assert.throws(() =>
    assertRunningHubDefinitionProfile(`{"providerProfileId":"${INTL}"}`, 'RUNNINGHUB-INTERNATIONAL'),
  );
  assert.throws(() => assertRunningHubDefinitionProfile('{"providerProfileId":5}', '5'));
  assert.equal(assertRunningHubDefinitionProfile('{"providerProfileId":5}', 5), undefined);
});

test('getRunningHubProfileShortLabel：国际站点得「国际」，其余一切折叠为「国内」', () => {
  assert.equal(getRunningHubProfileShortLabel(INTL), '国际');
  assert.equal(getRunningHubProfileShortLabel(`  ${INTL.toUpperCase()}  `), '国际');
  assert.equal(getRunningHubProfileShortLabel(DOM), '国内');
  assert.equal(getRunningHubProfileShortLabel('bogus'), '国内');
  assert.equal(getRunningHubProfileShortLabel(), '国内');
  assert.equal(getRunningHubProfileShortLabel(null), '国内');
});

test('getDefaultRunningHubProfileId：读运行中配置并折叠成两个站点 id 之一（本仓离线配置无该键 ⇒ 国内）', () => {
  const id = getDefaultRunningHubProfileId();
  assert.ok(id === DOM || id === INTL, `unexpected ${id}`);
  assert.equal(id, DOM);
});

test('syncRunningHubProfileBadge：找不到徽章节点返回 false，不抛异常', () => {
  assert.equal(syncRunningHubProfileBadge(null, INTL), false);
  assert.equal(syncRunningHubProfileBadge(undefined, INTL), false);
  assert.equal(syncRunningHubProfileBadge({}, INTL), false);
  assert.equal(syncRunningHubProfileBadge({ querySelector: () => null }, INTL), false);
});

test('syncRunningHubProfileBadge：命中节点时写入短标签与 hidden，返回 true', () => {
  const node = { hidden: null, textContent: '' };
  const root = {
    querySelector: (sel) => (sel === "[data-role='preview-runninghub-runtime-label']" ? node : null),
  };
  assert.equal(syncRunningHubProfileBadge(root, INTL), true);
  assert.equal(node.hidden, false);
  assert.equal(node.textContent, '国际');
  assert.equal(syncRunningHubProfileBadge(root, 'bogus'), true);
  assert.equal(node.textContent, '国内');
});

test('syncRunningHubProfileBadge：第三参数控制 hidden（缺省显示，假值隐藏）', () => {
  const node = { hidden: null, textContent: '' };
  const root = { querySelector: () => node };
  syncRunningHubProfileBadge(root, INTL, false);
  assert.equal(node.hidden, true);
  syncRunningHubProfileBadge(root, INTL, true);
  assert.equal(node.hidden, false);
  assert.equal(syncRunningHubProfileBadge(root, INTL, 0), true);
  assert.equal(node.hidden, true);
});

test('syncRunningHubProfileBadge：只认固定选择器，其它选择器命中不算', () => {
  const seen = [];
  const root = {
    querySelector: (sel) => {
      seen.push(sel);
      return null;
    },
  };
  assert.equal(syncRunningHubProfileBadge(root, INTL), false);
  assert.deepEqual(seen, ["[data-role='preview-runninghub-runtime-label']"]);
});
