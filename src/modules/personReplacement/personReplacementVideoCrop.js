import { localPathToUrl } from '../../utils/localMediaPath.js';
import { resolvePersonReplacementVideoSourceRef } from './personReplacementProject.js';
function normalizeText(value) {
  return String(value ?? '').trim();
}
function normalizeMediaUrl(item) {
  const text = normalizeText(item);
  return text ? localPathToUrl(text) || text : '';
}
function findShot(options = {}, key = '') {
  const text2 = normalizeText(key);
  return (
    (Array.isArray(options?.shots) ? options.shots : []).find(
      (index) => normalizeText(index?.id) === text2,
    ) || null
  );
}
function resolveCropReverseState(options2 = {}) {
  const isReversed = Boolean(options2.videoIterationReferenceRef);
  return {
    isReversed: isReversed
      ? options2.videoIterationInputIsReversed === true
      : options2.isReversed === true,
    materializedIsReversed: isReversed
      ? options2.videoIterationInputIsReversed === true
      : options2.materializedIsReversed === true,
  };
}
export function isPersonReplacementVideoCropReverseRunning(enabled = {}) {
  return (
    !enabled.videoIterationReferenceRef &&
    normalizeText(enabled.materializationStatus) === 'running' &&
    Boolean(enabled.isReversed) !== Boolean(enabled.materializedIsReversed)
  );
}
export function assertPersonReplacementVideoCropSourceCurrent({
  project: project = {},
  projectId: projectId = '',
  shotId: shotId = '',
  result: result = {},
} = {}) {
  const text3 = normalizeText(projectId),
    shot = findShot(project, shotId),
    text4 = normalizeText(result?.sourceLocalPath),
    { isReversed: isReversed2, materializedIsReversed: materializedIsReversed } = resolveCropReverseState(
      shot || {},
    ),
    data = typeof result?.isReversed === 'boolean' ? result.isReversed : isReversed2;
  if (text3 && normalizeText(project?.id) !== text3) throw new Error('当前项目已切换，请重新打开裁剪。');
  if (
    !shot ||
    (text4 && resolvePersonReplacementVideoSourceRef(shot) !== text4) ||
    isReversed2 !== data ||
    materializedIsReversed !== data
  )
    throw new Error('当前片段的倒放状态已变化，请重新打开裁剪。');
  return shot;
}
function createReverseControl({
  selectedShot: selectedShot,
  getProject: getProject2,
  acceptProject: acceptProject2,
  requestReverseChange: requestReverseChange2,
}) {
  const iterationReferenceRef = normalizeText(selectedShot.videoIterationReferenceRef),
    target = Boolean(iterationReferenceRef);
  return {
    ...resolveCropReverseState(selectedShot),
    async onChange(source) {
      const promise = requestReverseChange2(
          selectedShot.id,
          source,
          target
            ? {
                iterationReferenceRef: iterationReferenceRef,
                sourceRef: resolvePersonReplacementVideoSourceRef(
                  findShot(getProject2(), selectedShot.id),
                ),
              }
            : {},
        ),
        enabled2 = promise?.then ? await promise : promise;
      if (!enabled2) throw new Error('视频倒放服务不可用');
      const ok = enabled2.completion ? await enabled2.completion : enabled2,
        enabled3 = ok?.stale === true,
        next = ok?.project || enabled2.project || getProject2(),
        current = enabled3 ? getProject2() : acceptProject2(next),
        shot2 = findShot(current, selectedShot.id);
      if (!shot2) throw new Error('倒放完成后未找到当前片段');
      return {
        ok: ok?.ok !== false && !enabled3,
        ...resolveCropReverseState(shot2),
        sourceLocalPath: resolvePersonReplacementVideoSourceRef(shot2),
        sourceUrl: normalizeMediaUrl(resolvePersonReplacementVideoSourceRef(shot2)),
        posterUrl: normalizeMediaUrl(shot2.keyframeRef),
        error: ok?.error || shot2.error || '',
        suppressToast: true,
      };
    },
  };
}
export function createPersonReplacementVideoCropOptions({
  projectId: projectId = '',
  selectedShot: selectedShot2,
  stage: stage,
  videoEl: videoEl,
  durationSec: durationSec = 0,
  getProject: getProject = () => ({}),
  acceptProject: acceptProject = (entry) => entry,
  requestReverseChange: requestReverseChange = () => null,
  onConfirm: onConfirm = () => {},
  onExit: onExit = () => {},
} = {}) {
  const sourceLocalPath = resolvePersonReplacementVideoSourceRef(selectedShot2);
  return {
    anchorId:
      'person-replacement-video:' + normalizeText(projectId) + ':' + normalizeText(selectedShot2?.id),
    wrapperEl: stage,
    videoEl: videoEl,
    sourceUrl: normalizeMediaUrl(sourceLocalPath),
    sourceLocalPath: sourceLocalPath,
    sourceData: {
      videoDuration: durationSec,
      videoFps: selectedShot2?.outputFps,
      videoWidth: Number(videoEl?.videoWidth) || Number(selectedShot2?.frame?.width) || 0,
      videoHeight: Number(videoEl?.videoHeight) || Number(selectedShot2?.frame?.height) || 0,
    },
    posterUrl: normalizeMediaUrl(selectedShot2?.keyframeRef),
    durationSec: durationSec,
    videoWidth: Number(videoEl?.videoWidth) || Number(selectedShot2?.frame?.width) || 0,
    videoHeight: Number(videoEl?.videoHeight) || Number(selectedShot2?.frame?.height) || 0,
    initialStartSec: 0,
    initialEndSec: durationSec,
    dimMode: false,
    reverseControl: createReverseControl({
      selectedShot: selectedShot2,
      getProject: getProject,
      acceptProject: acceptProject,
      requestReverseChange: requestReverseChange,
    }),
    onConfirm: (result2) => {
      return (
        assertPersonReplacementVideoCropSourceCurrent({
          project: getProject(),
          projectId: projectId,
          shotId: selectedShot2?.id,
          result: result2,
        }),
        onConfirm(result2)
      );
    },
    onExit: onExit,
  };
}
