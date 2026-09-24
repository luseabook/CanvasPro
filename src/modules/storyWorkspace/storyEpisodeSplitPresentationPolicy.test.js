import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getStoryEpisodeSplitPaidRetryChoice,
  isStoryEpisodeExperimentalSplitAvailable,
  resolveStoryEpisodeExperimentalErrorMessage,
  shouldUseStoryEpisodeExperimentalSplit,
} from './storyEpisodeSplitPresentationPolicy.js';

test('the paid retry choice defaults to not retrying', () => {
  assert.deepEqual(getStoryEpisodeSplitPaidRetryChoice({ id: 'ep-1', number: 3 }), {
    overlayId: 'story-episode-split-paid-retry-ep-1',
    title: '第 3 集上次请求尚未安全提交',
    message: '上次请求可能已经计费，或原始响应尚未完成本地提交。确认后才会再次调用模型。',
    fallbackValue: null,
    choices: [
      { label: '暂不重试', value: null, autofocus: true },
      { label: '确认重新请求', value: 'retry', primary: true },
    ],
  });
  assert.equal(getStoryEpisodeSplitPaidRetryChoice({ id: 'x' }).title, '第  集上次请求尚未安全提交');
});

test('the experimental split is only offered in dev mode and never selected', () => {
  assert.equal(isStoryEpisodeExperimentalSplitAvailable({ DEV_MODE: true }), true);
  assert.equal(isStoryEpisodeExperimentalSplitAvailable({ DEV_MODE: 1 }), false);
  assert.equal(isStoryEpisodeExperimentalSplitAvailable(), false);
  assert.equal(shouldUseStoryEpisodeExperimentalSplit({ experimental: true }), false);
});

test('actionable errors are shown with 素材 wording, others get a resume hint', () => {
  assert.equal(resolveStoryEpisodeExperimentalErrorMessage(new Error('API Key 无效')), 'API Key 无效');
  assert.equal(resolveStoryEpisodeExperimentalErrorMessage('缺少可用的场景资产'), '缺少可用的场景素材');
  assert.equal(
    resolveStoryEpisodeExperimentalErrorMessage({
      message: 'raw',
      getUserMessage: () => '场景资产存在重复绑定',
    }),
    '场景素材存在重复绑定',
  );
  assert.equal(
    resolveStoryEpisodeExperimentalErrorMessage(new Error('timeout')),
    '本次分镜生成未完成，已保存当前进度。请稍后再次点击“开发测试”继续。',
  );
  assert.equal(
    resolveStoryEpisodeExperimentalErrorMessage(null, { retryActionLabel: '生成分镜' }),
    '本次分镜生成未完成，已保存当前进度。请稍后再次点击“生成分镜”继续。',
  );
  assert.match(resolveStoryEpisodeExperimentalErrorMessage('x', { retryActionLabel: ' ' }), /“开发测试”/);
});
