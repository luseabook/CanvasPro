import test from 'node:test';
import assert from 'node:assert/strict';

import { parseRunningHubResourceReference } from './runningHubDefinitionApi.js';

test('runningHubDefinitionApi: parses domestic workflow and international app links', () => {
  assert.deepEqual(parseRunningHubResourceReference('https://www.runninghub.cn/workflow/123456', 'auto'), {
    resourceId: '123456',
    providerProfileId: 'runninghub',
    sourceType: 'runninghub-workflow',
  });
  assert.deepEqual(
    parseRunningHubResourceReference('https://www.runninghub.ai/en-us/ai-detail/654321/', 'auto'),
    {
      resourceId: '654321',
      providerProfileId: 'runninghub-international',
      sourceType: 'runninghub-ai-app',
    },
  );
});

test('runningHubDefinitionApi: validates ambiguous ids and mismatched link types', () => {
  assert.throws(() => parseRunningHubResourceReference('123456', 'auto'), /仅凭 ID 无法识别类型/);
  assert.throws(
    () =>
      parseRunningHubResourceReference('https://www.runninghub.cn/ai-detail/123456', 'runninghub-workflow'),
    /请提供工作流链接/,
  );
  assert.throws(
    () => parseRunningHubResourceReference('http://www.runninghub.cn/workflow/123456', 'auto'),
    /请使用 RunningHub 官方国内或国际站链接/,
  );
});
