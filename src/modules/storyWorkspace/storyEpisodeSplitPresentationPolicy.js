const normalizeText = (_0x39054c) => String(_0x39054c ?? '')['trim']();
export function getStoryEpisodeSplitPaidRetryChoice(_0x1311cd) {
  return {
    overlayId: 'story-episode-split-paid-retry-' + _0x1311cd['id'],
    title: '第\x20' + (_0x1311cd['number'] || '') + ' 集上次请求尚未安全提交',
    message: '上次请求可能已经计费，或原始响应尚未完成本地提交。确认后才会再次调用模型。',
    fallbackValue: null,
    choices: [
      { label: '暂不重试', value: null, autofocus: !![] },
      { label: '确认重新请求', value: 'retry', primary: !![] },
    ],
  };
}
export function isStoryEpisodeExperimentalSplitAvailable(_0x113fe0 = globalThis['window']) {
  return _0x113fe0?.['DEV_MODE'] === !![];
}
export function shouldUseStoryEpisodeExperimentalSplit(_0x38797c = {}) {
  return ![];
}
export function resolveStoryEpisodeExperimentalErrorMessage(
  _0x46a59,
  { retryActionLabel: retryActionLabel = '开发测试' } = {},
) {
  const _0x1a8e02 = normalizeText(_0x46a59?.['message'] || _0x46a59),
    _0x4e733f =
      typeof _0x46a59?.['getUserMessage'] === 'function' ? normalizeText(_0x46a59['getUserMessage']()) : '',
    _0x403fbb = _0x4e733f || _0x1a8e02;
  if (
    /api\s*key|密钥|额度|余额|未登录|未授权/iu['test'](_0x403fbb) ||
    /缺少(?:可用的)?(?:场景资产|剧本正文|标题)|请先选择可用的文本模型|场景资产(?:未完整覆盖|存在重复绑定)|请先重新提取场景资产/u[
      'test'
    ](_0x403fbb)
  )
    return _0x403fbb['replaceAll']('资产', '素材');
  const _0x2893f2 = normalizeText(retryActionLabel) || '开发测试';
  return '本次分镜生成未完成，已保存当前进度。请稍后再次点击“' + _0x2893f2 + '”继续。';
}
