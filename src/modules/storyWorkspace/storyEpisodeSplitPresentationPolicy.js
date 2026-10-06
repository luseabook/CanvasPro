const normalizeText = (value) => String(value ?? '').trim();
export function getStoryEpisodeSplitPaidRetryChoice(item) {
  return {
    overlayId: 'story-episode-split-paid-retry-' + item.id,
    title: '第 ' + (item.number || '') + ' 集上次请求尚未安全提交',
    message: '上次请求可能已经计费，或原始响应尚未完成本地提交。确认后才会再次调用模型。',
    fallbackValue: null,
    choices: [
      { label: '暂不重试', value: null, autofocus: true },
      { label: '确认重新请求', value: 'retry', primary: true },
    ],
  };
}
export function isStoryEpisodeExperimentalSplitAvailable(key = globalThis.window) {
  return key?.DEV_MODE === true;
}
export function shouldUseStoryEpisodeExperimentalSplit(options = {}) {
  return false;
}
export function resolveStoryEpisodeExperimentalErrorMessage(
  error,
  { retryActionLabel: retryActionLabel = '开发测试' } = {},
) {
  const text = normalizeText(error?.message || error),
    index = typeof error?.getUserMessage === 'function' ? normalizeText(error.getUserMessage()) : '',
    result = index || text;
  if (
    /api\s*key|密钥|额度|余额|未登录|未授权/iu.test(result) ||
    /缺少(?:可用的)?(?:场景资产|剧本正文|标题)|请先选择可用的文本模型|场景资产(?:未完整覆盖|存在重复绑定)|请先重新提取场景资产/u.test(result)
  )
    return result.replaceAll('资产', '素材');
  const text2 = normalizeText(retryActionLabel) || '开发测试';
  return '本次分镜生成未完成，已保存当前进度。请稍后再次点击“' + text2 + '”继续。';
}
