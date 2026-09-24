import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RUNNINGHUB_DOMESTIC_PROFILE_ID,
  RUNNINGHUB_INTERNATIONAL_PROFILE_ID,
  RUNNINGHUB_SITE_PROFILE_IDS,
  RUNNINGHUB_MODEL_API_PROFILE_IDS,
  RUNNINGHUB_WORKFLOW_SETTINGS_KEY,
  RUNNINGHUB_WORKFLOW_DEFAULT_PROFILE_FIELD,
  RUNNINGHUB_INTERNATIONAL_ONLY_MODEL_IDS,
  RUNNINGHUB_MODEL_API_PROFILES,
  normalizeRunningHubModelApiProfileId,
  getRunningHubProviderProfileId,
  getRunningHubTaskProviderProfileId,
  resolveRunningHubSiteProfileIdFromUrl,
  getRunningHubWorkflowDefaultProfileId,
  applyRunningHubWorkflowDefaultProfileId,
  isRunningHubInternationalOnlyModel,
  getRunningHubModelApiProfileIds,
  resolveRunningHubModelApiProfileId,
  getRunningHubModelApiProfile,
  resolveRunningHubModelApiBaseUrl,
  buildRunningHubModelApiUrl,
  remapRunningHubModelApiUrl,
} from './runningHubProviderProfiles.js';

test('站点 profile 常量：国内/国际两个 id，模型 API 列表与站点列表是同一个冻结数组', () => {
  assert.equal(RUNNINGHUB_DOMESTIC_PROFILE_ID, 'runninghub');
  assert.equal(RUNNINGHUB_INTERNATIONAL_PROFILE_ID, 'runninghub-international');
  assert.deepEqual([...RUNNINGHUB_SITE_PROFILE_IDS], ['runninghub', 'runninghub-international']);
  assert.equal(RUNNINGHUB_MODEL_API_PROFILE_IDS, RUNNINGHUB_SITE_PROFILE_IDS);
  assert.equal(Object.isFrozen(RUNNINGHUB_SITE_PROFILE_IDS), true);
});

test('normalizeRunningHubModelApiProfileId：只有国际 id（忽略大小写与首尾空格）命中国际，其余一律国内', () => {
  assert.equal(normalizeRunningHubModelApiProfileId('runninghub-international'), 'runninghub-international');
  assert.equal(
    normalizeRunningHubModelApiProfileId('  RunningHub-International  '),
    'runninghub-international',
  );
  assert.equal(normalizeRunningHubModelApiProfileId('runninghub'), 'runninghub');
  assert.equal(normalizeRunningHubModelApiProfileId('bogus'), 'runninghub');
});

test('normalizeRunningHubModelApiProfileId：假值与数字被 `String(值 || 空串)` 折叠成国内，对象走 toString', () => {
  for (const value of [undefined, null, '', 0, false, NaN]) {
    assert.equal(normalizeRunningHubModelApiProfileId(value), 'runninghub', `value=${String(value)}`);
  }
  assert.equal(normalizeRunningHubModelApiProfileId(1), 'runninghub');
  assert.equal(
    normalizeRunningHubModelApiProfileId({ toString: () => 'runninghub-international' }),
    'runninghub-international',
  );
});

test('getRunningHubProviderProfileId：三级优先 providerProfileId > rhProviderProfileId > taskProviderProfileId', () => {
  assert.equal(
    getRunningHubProviderProfileId({
      providerProfileId: ' p ',
      rhProviderProfileId: ' r ',
      taskProviderProfileId: ' t ',
    }),
    'p',
  );
  assert.equal(getRunningHubProviderProfileId({ rhProviderProfileId: 'r', taskProviderProfileId: 't' }), 'r');
  assert.equal(getRunningHubProviderProfileId({ taskProviderProfileId: 't' }), 't');
  assert.equal(getRunningHubProviderProfileId({}), '');
  assert.equal(getRunningHubProviderProfileId(), '');
  assert.equal(getRunningHubProviderProfileId(null), '');
});

test('getRunningHubTaskProviderProfileId：task 优先，缺失时回落 providerProfileId 再回落 rhProviderProfileId', () => {
  assert.equal(
    getRunningHubTaskProviderProfileId({ taskProviderProfileId: 't', providerProfileId: 'p' }),
    't',
  );
  assert.equal(getRunningHubTaskProviderProfileId({ providerProfileId: 'p' }), 'p');
  assert.equal(getRunningHubTaskProviderProfileId({ rhProviderProfileId: 'r' }), 'r');
  assert.equal(getRunningHubTaskProviderProfileId({ taskProviderProfileId: '   ' }), '');
});

test('resolveRunningHubSiteProfileIdFromUrl：按 hostname 后缀判定国际/国内，识别子域名并忽略大小写', () => {
  assert.equal(
    resolveRunningHubSiteProfileIdFromUrl('https://www.runninghub.ai/x'),
    'runninghub-international',
  );
  assert.equal(resolveRunningHubSiteProfileIdFromUrl('https://runninghub.cn'), 'runninghub');
  assert.equal(
    resolveRunningHubSiteProfileIdFromUrl('https://API.RunningHub.AI/v1'),
    'runninghub-international',
  );
  assert.equal(resolveRunningHubSiteProfileIdFromUrl('http://gw.runninghub.cn:8080/a'), 'runninghub');
});

test('resolveRunningHubSiteProfileIdFromUrl：从自由文本里取第一个 http(s) 串，非 runninghub 域名与无 URL 返回空串', () => {
  assert.equal(
    resolveRunningHubSiteProfileIdFromUrl(
      'base=https://www.runninghub.cn/api other=https://www.runninghub.ai/api',
    ),
    'runninghub',
  );
  assert.equal(resolveRunningHubSiteProfileIdFromUrl('https://example.com/runninghub.cn'), '');
  assert.equal(resolveRunningHubSiteProfileIdFromUrl('runninghub.cn'), '');
  assert.equal(resolveRunningHubSiteProfileIdFromUrl(''), '');
  assert.equal(resolveRunningHubSiteProfileIdFromUrl(undefined), '');
});

test('resolveRunningHubSiteProfileIdFromUrl：正则命中但 URL 解析失败时走 catch 返回空串', () => {
  assert.equal(resolveRunningHubSiteProfileIdFromUrl('http://'), '');
  assert.equal(resolveRunningHubSiteProfileIdFromUrl('https://%zz'), '');
});

test('workflow 设置读写：键名常量、默认回落国内、只覆盖目标字段并保留同级其它键', () => {
  assert.equal(RUNNINGHUB_WORKFLOW_SETTINGS_KEY, 'runningHubWorkflow');
  assert.equal(RUNNINGHUB_WORKFLOW_DEFAULT_PROFILE_FIELD, 'defaultProviderProfileId');
  assert.equal(getRunningHubWorkflowDefaultProfileId({}), 'runninghub');
  assert.equal(
    getRunningHubWorkflowDefaultProfileId({
      runningHubWorkflow: { defaultProviderProfileId: 'runninghub-international' },
    }),
    'runninghub-international',
  );
  const state = { keep: 1, runningHubWorkflow: { other: 2, defaultProviderProfileId: 'runninghub' } };
  const next = applyRunningHubWorkflowDefaultProfileId(state, '  RUNNINGHUB-INTERNATIONAL ');
  assert.notEqual(next, state);
  assert.deepEqual(next, {
    keep: 1,
    runningHubWorkflow: { other: 2, defaultProviderProfileId: 'runninghub-international' },
  });
  assert.deepEqual(state.runningHubWorkflow, { other: 2, defaultProviderProfileId: 'runninghub' });
});

test('applyRunningHubWorkflowDefaultProfileId：缺省第二参数写国内；未知值折叠国内；嵌套缺失时只造目标字段', () => {
  assert.deepEqual(applyRunningHubWorkflowDefaultProfileId({}), {
    runningHubWorkflow: { defaultProviderProfileId: 'runninghub' },
  });
  assert.equal(
    applyRunningHubWorkflowDefaultProfileId({}, 'bogus').runningHubWorkflow.defaultProviderProfileId,
    'runninghub',
  );
});

test('applyRunningHubWorkflowDefaultProfileId：状态为 null 时被 `||` 回落成空对象，不抛异常', () => {
  assert.deepEqual(applyRunningHubWorkflowDefaultProfileId(null, 'runninghub-international'), {
    runningHubWorkflow: { defaultProviderProfileId: 'runninghub-international' },
  });
});

test('国际专属模型清单：冻结、按 trim 判定、大小写敏感', () => {
  assert.equal(Object.isFrozen(RUNNINGHUB_INTERNATIONAL_ONLY_MODEL_IDS), true);
  assert.equal(isRunningHubInternationalOnlyModel('runninghub-model/rhart-image-v1'), true);
  assert.equal(isRunningHubInternationalOnlyModel('  runninghub-model/veo3  '), true);
  assert.equal(isRunningHubInternationalOnlyModel('RHART-IMAGE-V1'), false);
  assert.equal(isRunningHubInternationalOnlyModel('runninghub-model/unknown'), false);
  assert.equal(isRunningHubInternationalOnlyModel(''), false);
  assert.equal(isRunningHubInternationalOnlyModel(undefined), false);
});

test('模型 API profile 列表：国际专属模型只剩国际一项，其余返回共享的冻结两项数组', () => {
  const only = getRunningHubModelApiProfileIds('runninghub-model/rhart-image-v1');
  assert.deepEqual([...only], ['runninghub-international']);
  assert.notEqual(only, RUNNINGHUB_MODEL_API_PROFILE_IDS);
  assert.equal(getRunningHubModelApiProfileIds('other/model'), RUNNINGHUB_MODEL_API_PROFILE_IDS);
});

test('resolveRunningHubModelApiProfileId：专属模型把国内请求改写成国际，普通模型保留国际', () => {
  assert.equal(
    resolveRunningHubModelApiProfileId('runninghub-model/rhart-image-v1', 'runninghub'),
    'runninghub-international',
  );
  assert.equal(
    resolveRunningHubModelApiProfileId('runninghub-model/rhart-image-v1', 'bogus'),
    'runninghub-international',
  );
  assert.equal(
    resolveRunningHubModelApiProfileId('other/model', 'runninghub-international'),
    'runninghub-international',
  );
  assert.equal(resolveRunningHubModelApiProfileId('other/model', 'bogus'), 'runninghub');
  assert.equal(resolveRunningHubModelApiProfileId('other/model'), 'runninghub');
});

test('RUNNINGHUB_MODEL_API_PROFILES：两个 profile 的标签与站点地址逐项冻结', () => {
  assert.deepEqual(Object.keys(RUNNINGHUB_MODEL_API_PROFILES), ['runninghub', 'runninghub-international']);
  assert.equal(RUNNINGHUB_MODEL_API_PROFILES.runninghub.apiUrl, 'https://www.runninghub.cn');
  assert.equal(RUNNINGHUB_MODEL_API_PROFILES.runninghub.label, 'RunningHUB（国内）');
  assert.equal(RUNNINGHUB_MODEL_API_PROFILES['runninghub-international'].apiUrl, 'https://www.runninghub.ai');
  assert.equal(RUNNINGHUB_MODEL_API_PROFILES['runninghub-international'].shortLabel, '国际');
  assert.equal(Object.isFrozen(RUNNINGHUB_MODEL_API_PROFILES.runninghub), true);
});

test('getRunningHubModelApiProfile：未知 id 回落国内 profile', () => {
  assert.equal(getRunningHubModelApiProfile('bogus'), RUNNINGHUB_MODEL_API_PROFILES.runninghub);
  assert.equal(
    getRunningHubModelApiProfile('runninghub-international'),
    RUNNINGHUB_MODEL_API_PROFILES['runninghub-international'],
  );
});

test('resolveRunningHubModelApiBaseUrl：显式覆盖优先于 profile 默认值，尾部斜杠被去掉，纯空格覆盖成空串', () => {
  assert.equal(resolveRunningHubModelApiBaseUrl('runninghub'), 'https://www.runninghub.cn');
  assert.equal(resolveRunningHubModelApiBaseUrl('runninghub-international'), 'https://www.runninghub.ai');
  assert.equal(
    resolveRunningHubModelApiBaseUrl('runninghub', 'https://gw.example.com///'),
    'https://gw.example.com',
  );
  assert.equal(resolveRunningHubModelApiBaseUrl('runninghub', '   '), '');
  assert.equal(resolveRunningHubModelApiBaseUrl('bogus', ''), 'https://www.runninghub.cn');
});

test('buildRunningHubModelApiUrl：空路径只返回基址，前后斜杠只留一个', () => {
  assert.equal(buildRunningHubModelApiUrl('runninghub', ''), 'https://www.runninghub.cn');
  assert.equal(buildRunningHubModelApiUrl('runninghub', '/v1/list'), 'https://www.runninghub.cn/v1/list');
  assert.equal(buildRunningHubModelApiUrl('runninghub', 'v1/list'), 'https://www.runninghub.cn/v1/list');
  assert.equal(buildRunningHubModelApiUrl('bogus', undefined), 'https://www.runninghub.cn');
});

test('remapRunningHubModelApiUrl：绝对地址的域名后缀按目标 profile 重写，子域前缀保留', () => {
  assert.equal(
    remapRunningHubModelApiUrl('https://www.runninghub.cn/api/task', 'runninghub-international'),
    'https://www.runninghub.ai/api/task',
  );
  assert.equal(
    remapRunningHubModelApiUrl('https://api.runninghub.ai/v1/x', 'runninghub'),
    'https://api.runninghub.cn/v1/x',
  );
  assert.equal(
    remapRunningHubModelApiUrl('https://www.runninghub.cn/api/', 'runninghub-international'),
    'https://www.runninghub.ai/api',
  );
});

test('remapRunningHubModelApiUrl：相对地址按目标基址解析，非 runninghub 域名原样返回', () => {
  assert.equal(remapRunningHubModelApiUrl('v1/list', 'runninghub'), 'https://www.runninghub.cn/v1/list');
  assert.equal(
    remapRunningHubModelApiUrl('/v1/list', 'runninghub-international'),
    'https://www.runninghub.ai/v1/list',
  );
  assert.equal(
    remapRunningHubModelApiUrl('https://cdn.example.com/a', 'runninghub'),
    'https://cdn.example.com/a',
  );
});

test('remapRunningHubModelApiUrl：入参 trim 后为空返回空串；自定义基址参与重写与回落拼接', () => {
  assert.equal(remapRunningHubModelApiUrl('   ', 'runninghub'), '');
  assert.equal(
    remapRunningHubModelApiUrl('v1/list', 'runninghub', 'https://gw.runninghub.cn'),
    'https://gw.runninghub.cn/v1/list',
  );
  assert.equal(
    remapRunningHubModelApiUrl('https://www.runninghub.cn/x', 'runninghub', 'https://gw.runninghub.ai'),
    'https://www.runninghub.ai/x',
  );
});
