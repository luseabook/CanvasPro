import { getPersonReplacementShotCutPositionAtTimelineSec } from './personReplacementShotCutModel.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function togglePersonReplacementShotReverseAtTimelineSec(draft = [], item = 0) {
  const position = getPersonReplacementShotCutPositionAtTimelineSec(draft, item),
    enabled = draft[position['shotIndex']];
  if (!enabled) return null;
  const isReversed = enabled['isReversed'] !== true;
  return {
    draft: draft['map']((args, key) =>
      key === position['shotIndex'] ? { ...args, isReversed: isReversed } : args,
    ),
    position: position,
    isReversed: isReversed,
    message: isReversed ? '当前片段已倒放。' : '已取消当前片段倒放。',
  };
}
export function resolveShotCutSubmissionUi(index = '', loadingTitle = false) {
  const reversePending = index === 'reverse',
    cutSubmitting = index === 'cuts';
  return {
    reversePending: reversePending,
    cutSubmitting: cutSubmitting,
    editorBusy: Boolean(index) || loadingTitle,
    loadingTitle: loadingTitle ? '智能裁切中' : reversePending ? '正在倒放视频' : '正在应用切口',
    loadingDescription: loadingTitle
      ? '正在检测并裁切视频，完成后会自动更新时间线。'
      : reversePending
        ? '正在处理当前片段，完成后会直接更新时间线。'
        : '正在裁切视频，完成后会自动更新时间线。',
  };
}
export async function materializePersonReplacementShotPlayback({
  currentShot: currentShot,
  range: range,
  isNewShot: isNewShot = false,
  sourceVideoRef: sourceVideoRef,
  outputFps: outputFps,
  epsilonSec: epsilonSec,
  enqueueMediaTask: enqueueMediaTask,
  resolveMediaRef: resolveMediaRef,
} = {}) {
  if (
    !currentShot ||
    !range ||
    typeof enqueueMediaTask !== 'function' ||
    typeof resolveMediaRef !== 'function'
  )
    throw new Error('镜头片段倒放参数不完整');
  const enabled2 =
      isNewShot ||
      Math['abs'](Number(range['startSec']) - Number(currentShot['startTimeSec'])) > epsilonSec ||
      Math['abs'](Number(range['endSec']) - Number(currentShot['endTimeSec'])) > epsilonSec,
    reverseChanged =
      Boolean(range['isReversed']) !==
      Boolean(
        typeof currentShot['materializedIsReversed'] === 'boolean'
          ? currentShot['materializedIsReversed']
          : normalizeText(currentShot['videoRef']) && currentShot['isReversed'],
      ),
    result = Boolean(
      typeof currentShot['materializedIsReversed'] === 'boolean'
        ? currentShot['materializedIsReversed']
        : normalizeText(currentShot['videoRef']) && currentShot['isReversed'],
    );
  let src = normalizeText(currentShot['videoRef']);
  const videoRefIsCropped = Boolean(currentShot['videoRefIsCropped'] === true && !enabled2 && src),
    enabled3 = Boolean(videoRefIsCropped && reverseChanged);
  if (enabled2 || !src || (result && range['isReversed'] !== true && !enabled3)) {
    const error = await enqueueMediaTask(
      {
        kind: 'mediaClipExport',
        src: sourceVideoRef,
        args: { videoStart: range['startSec'], videoEnd: range['endSec'], fps: outputFps },
      },
      { wait: true, timeout: 600000 },
    );
    src = resolveMediaRef(error);
    if (error?.['success'] === false || !src)
      throw new Error(error?.['error'] || error?.['message'] || '镜头片段导出失败');
  }
  if (
    enabled3 ||
    (range['isReversed'] === true && (enabled2 || reverseChanged || !normalizeText(currentShot['videoRef'])))
  ) {
    const error2 = await enqueueMediaTask(
      { kind: 'videoReverse', src: src },
      { wait: true, timeout: 600000 },
    );
    src = resolveMediaRef(error2);
    if (error2?.['success'] === false || !src)
      throw new Error(error2?.['error'] || error2?.['message'] || '镜头片段倒放失败');
  }
  return { videoRef: src, reverseChanged: reverseChanged, videoRefIsCropped: videoRefIsCropped };
}
