import { showStoryClipRecovery } from '../../modules/storyWorkspace/StoryClipPreview.js';
import {
  createStoryClipExportGuard,
  validateStoryClipOutput,
} from '../../modules/storyWorkspace/storyClipModel.js';
import { runLocalMediaClipExport, canUseElectronMediaTask } from '../../../api/localMediaTaskApi.js';
import appStore from '../../core/stores/appStore.js';
import { generateId } from '../../core/math.js';
import { commit } from '../../modules/history.js';
import { t } from '../../i18n/index.js';
import { calcSafeSpawnPosNearNode } from '../../modules/nodeSpawn.js';
import {
  buildSourceAudioNodePayload,
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from '../../services/fileService.js';
import { localPathToUrl, pickResultLocalPath } from '../../utils/localMediaPath.js';
import {
  buildMediaClipExportPayload,
  resolveMediaClipDimensions,
  resolveMediaClipSourceKey,
} from './mediaClipState.js';
import {
  downloadLocalPath,
  resolveMediaClipImageUrl,
  resolveMediaClipLocalPath,
  resolveMediaClipOutputVideoDimensions,
  resolveMediaClipPosterImageFields,
  resolveMediaClipThumbUrl,
} from './mediaClipSourceResolver.js';
import { firstNonEmpty, normalizeText, stopPointer, toNumber } from './mediaClipUtils.js';
import { makeButton } from './mediaClipViewUtils.js';
function mediaClipText(value, item = {}) {
  return t('mediaClip.' + value, item);
}
export function singleVisualClipExportTrack(sourceKey = {}) {
  return {
    sourceKey: sourceKey.sourceKey,
    startSec: sourceKey.startSec,
    endSec: sourceKey.endSec,
    durationSec: sourceKey.durationSec,
  };
}
export function exportVisualClips(kind, key = kind._mediaClip.tracks?.video) {
  return kind
    ._videoTimelineClips(key)
    .map((startSec, index) => {
      const source = kind._videoClipSource(startSec, index),
        sourceKey2 = firstNonEmpty(
          resolveMediaClipSourceKey(source),
          startSec?.sourceKey,
          resolveMediaClipLocalPath(source),
        );
      if (!sourceKey2) return null;
      return {
        source: source,
        sourceKey: sourceKey2,
        kind: kind._visualClipKind(startSec, source),
        startSec: startSec.startSec,
        endSec: startSec.endSec,
        durationSec: startSec.durationSec,
        timelineStartSec: startSec.timelineStartSec,
        timelineEndSec: startSec.timelineEndSec,
      };
    })
    .filter(Boolean);
}
export function firstExportVideoSource(result, list = []) {
  return (
    list.find((item2) => item2.kind === 'video')?.source || list[0]?.source || result._firstVideoSource()
  );
}
export function exportVisualDurationSec(list2 = []) {
  return list2.reduce((item3, data) => {
    const toNumber2 = toNumber(data?.startSec, 0),
      options = Math.max(toNumber2, toNumber(data?.endSec, toNumber2));
    return item3 + Math.max(0, options - toNumber2);
  }, 0);
}
export function exportAudioClips(target, next = target._mediaClip.tracks?.audio) {
  return target
    ._audioTimelineClips(next)
    .map((startSec2, current) => {
      const source2 = target._audioClipSource(startSec2, current),
        sourceKey3 = firstNonEmpty(
          resolveMediaClipSourceKey(source2),
          startSec2?.sourceKey,
          resolveMediaClipLocalPath(source2),
        );
      if (!sourceKey3) return null;
      return {
        source: source2,
        sourceKey: sourceKey3,
        startSec: startSec2.startSec,
        endSec: startSec2.endSec,
        durationSec: startSec2.durationSec,
        timelineStartSec: startSec2.timelineStartSec,
        timelineEndSec: startSec2.timelineEndSec,
        laneIndex: startSec2.laneIndex,
        muted: startSec2.muted === true,
        disabled: startSec2.disabled === true,
        ...(startSec2.volume !== undefined ? { volume: startSec2.volume } : {}),
      };
    })
    .filter(Boolean);
}
export function exportLoadingTargetElement(entry) {
  return (
    entry.el?.querySelector?.('.media-clip-preview') ||
    entry.el?.querySelector?.('.media-clip-compact-body') ||
    entry.el ||
    null
  );
}
export function startExportLoading(record, mediaClipText2 = mediaClipText('export.loading')) {
  if (typeof document === 'undefined') return;
  const el = record._exportLoadingTargetElement();
  if (!el) return;
  record._exportLoadingTarget && record._exportLoadingTarget !== el && record._stopExportLoading();
  ((record._exportLoadingTarget = el), el.classList?.add('is-exporting-material'));
  const el2 = el.querySelector?.('.media-clip-export-loading-overlay');
  if (el2) {
    const el3 = el2.querySelector?.('.media-clip-export-loading-label');
    if (el3) el3.textContent = mediaClipText2;
    return;
  }
  const el4 = document.createElement('div');
  ((el4.className = 'media-clip-export-loading-overlay'),
    el4.setAttribute('role', 'status'),
    el4.setAttribute('aria-live', 'polite'));
  const payload = document.createElement('div');
  payload.className = 'media-clip-export-loading-spinner';
  const el5 = document.createElement('div');
  ((el5.className = 'media-clip-export-loading-label'), (el5.textContent = mediaClipText2));
  const el6 = document.createElement('div');
  el6.className = 'media-clip-export-loading-bar';
  const handle = document.createElement('div');
  ((handle.className = 'media-clip-export-loading-bar-fill'),
    el6.appendChild(handle),
    el4.append(payload, el5, el6),
    el.appendChild(el4));
}
export function stopExportLoading(state) {
  const el7 = state._exportLoadingTarget;
  (el7?.classList?.remove('is-exporting-material'),
    el7?.querySelectorAll?.('.media-clip-export-loading-overlay')?.forEach((el8) => {
      if (typeof el8.remove === 'function') {
        el8.remove();
        return;
      }
      el8.parentNode?.removeChild?.(el8);
    }),
    (state._exportLoadingTarget = null));
}
export function waitForExportLoadingFrame() {
  return new Promise((handler) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => handler());
      return;
    }
    setTimeout(handler, 0);
  });
}
export async function exportMaterialToCanvas(videoTrack, config = 'video', scope = 0) {
  if (videoTrack.nodeData?.storySequence || videoTrack._storyClipNodesContext) {
    window.showToast?.('本批初剪请使用整段导出；单素材请定位原已采纳媒体。');
    return;
  }
  if (videoTrack._exporting) return;
  const input = config === 'audio' ? 'audio' : 'video';
  let mediaClipExportPayload = null,
    audioSource = null,
    output = '',
    value2 = {},
    enabled = null;
  if (input === 'audio') {
    const value3 = videoTrack._mediaClip.tracks?.audio || null,
      list3 = videoTrack._audioTimelineClips(value3),
      value4 = Math.max(0, Math.min(list3.length - 1, Math.trunc(toNumber(scope, 0)))),
      sourceKey4 = list3[value4] || null,
      audioTrack = sourceKey4
        ? {
            sourceKey: sourceKey4.sourceKey,
            startSec: sourceKey4.startSec,
            endSec: sourceKey4.endSec,
            durationSec: sourceKey4.durationSec,
          }
        : value3;
    ((audioSource = sourceKey4 ? videoTrack._audioClipSource(sourceKey4, value4) : videoTrack._sources.audio),
      (mediaClipExportPayload = buildMediaClipExportPayload({
        audioSource: audioSource,
        audioTrack: audioTrack,
      })),
      (output = 'audio'),
      (value2 = {
        source: audioSource,
        name: mediaClipText('outputNames.audio'),
        durationSec: Math.max(0, toNumber(audioTrack?.endSec, 0) - toNumber(audioTrack?.startSec, 0)),
      }));
  } else {
    const list4 = videoTrack._videoTimelineClips(videoTrack._mediaClip.tracks?.video),
      value5 = Math.max(0, Math.min(list4.length - 1, Math.trunc(toNumber(scope, 0)))),
      enabled2 = list4[value5];
    if (!enabled2) return;
    audioSource = videoTrack._videoClipSource(enabled2, value5);
    const value6 = videoTrack._visualClipKind(enabled2, audioSource);
    value6 === 'image'
      ? ((enabled = audioSource), (value2 = { name: mediaClipText('outputNames.image') }))
      : ((mediaClipExportPayload = buildMediaClipExportPayload({
          videoSource: audioSource,
          videoTrack: videoTrack._singleVisualClipExportTrack(enabled2),
        })),
        (output = 'video'),
        (value2 = {
          source: audioSource,
          name: mediaClipText('outputNames.video'),
          durationSec: Math.max(0, toNumber(enabled2.endSec, 0) - toNumber(enabled2.startSec, 0)),
        }));
  }
  if (!mediaClipExportPayload && !enabled) {
    window.showToast?.(mediaClipText('export.noMaterial'));
    return;
  }
  ((videoTrack._exporting = true),
    videoTrack.el?.classList?.add('is-exporting'),
    videoTrack._startExportLoading());
  try {
    await videoTrack._waitForExportLoadingFrame();
    if (enabled) videoTrack._addImageOutputNodeFromSource(enabled, value2);
    else {
      const runLocalMediaClipExport2 = await runLocalMediaClipExport(mediaClipExportPayload, {
        timeout: 600000,
      });
      videoTrack._addOutputNode(
        output || mediaClipExportPayload.outputType,
        runLocalMediaClipExport2,
        value2,
      );
    }
    window.showToast?.(mediaClipText('export.materialAdded'));
  } catch (error2) {
    window.showToast?.(error2?.message || mediaClipText('export.materialFailed'));
  } finally {
    ((videoTrack._exporting = false),
      videoTrack.el?.classList?.remove('is-exporting'),
      videoTrack._stopExportLoading(),
      videoTrack._render());
  }
}
export function renderDownloadMenu(value7) {
  const value8 = document.createElement('div');
  value8.className = 'v2-canvas-ctx-menu media-clip-menu';
  const mediaClipText3 = mediaClipText('menu.addToCanvas'),
    el9 = makeButton('v2-menu-row media-clip-menu-item', mediaClipText3, mediaClipText3);
  el9.addEventListener('click', async (value9) => {
    (stopPointer(value9), value7._setDownloadMenuOpen(false), await value7._exportAndUse('canvas'));
  });
  const mediaClipText4 = mediaClipText('menu.export'),
    el10 = makeButton('v2-menu-row media-clip-menu-item', mediaClipText4, mediaClipText4);
  return (
    el10.addEventListener('click', async (value10) => {
      (stopPointer(value10), value7._setDownloadMenuOpen(false), await value7._exportAndUse('download'));
    }),
    value8.append(el9, el10),
    value8
  );
}
export async function exportAndUse(nodeId, value11) {
  if (nodeId._exporting) return;
  const videoTrack2 = nodeId._mediaClip.tracks?.video || null,
    audioTrack2 = nodeId._mediaClip.tracks?.audio || null,
    videoClips = nodeId._exportVisualClips(videoTrack2),
    audioClips = nodeId._exportAudioClips(audioTrack2),
    videoSource = nodeId._firstExportVideoSource(videoClips),
    durationSec = nodeId._exportVisualDurationSec(videoClips),
    payload2 = buildMediaClipExportPayload({
      videoSource: videoSource,
      videoTrack: videoTrack2,
      audioTrack: audioTrack2,
      videoClips: videoClips,
      audioClips: audioClips,
    });
  if (!payload2) {
    window.showToast?.(mediaClipText('export.noClips'));
    return;
  }
  let storyClipGuard,
    storyClipResult = null;
  try {
    storyClipGuard = createStoryClipExportGuard({
      store: appStore,
      nodeId: nodeId.id,
      payload: payload2,
      expectedNodes: nodeId._storyClipNodesContext,
      requireMarked: !!(nodeId._storyClipNodesContext || nodeId.nodeData?.storySequence),
    });
    if (storyClipGuard && !canUseElectronMediaTask())
      throw new Error('镜头初剪渲染需更新后的桌面端，不调用浏览器后端');
    if (storyClipGuard && !window.confirm(storyClipGuard.confirmation)) return;
  } catch (error) {
    window.showToast?.(error.message);
    return;
  }
  ((nodeId._exporting = true), nodeId.el.classList.add('is-exporting'), nodeId._startExportLoading());
  try {
    await nodeId._waitForExportLoadingFrame();
    storyClipGuard?.assertCurrent();
    let args = null;
    if (
      !storyClipGuard &&
      nodeId._mediaClip.lastOutput?.signature === payload2.signature &&
      nodeId._mediaClip.lastOutput?.localPath
    )
      args = { ...nodeId._mediaClip.lastOutput };
    else {
      args = await runLocalMediaClipExport(storyClipGuard?.request || payload2, { timeout: 600000 });
      if (storyClipGuard) {
        storyClipResult = { ...args, localPath: validateStoryClipOutput(args) };
        storyClipGuard.assertCurrent();
      }
      const localPath = pickResultLocalPath(args) || args?.localPath || args?.path || '',
        lastOutput = {
          ...args,
          outputType: payload2.outputType,
          signature: payload2.signature,
          localPath: localPath,
        };
      (nodeId._setMediaClip({ ...nodeId._mediaClip, lastOutput: lastOutput }, true, { render: false }),
        (args = lastOutput));
    }
    storyClipGuard?.assertCurrent();
    (value11 === 'download'
      ? downloadLocalPath(args.localPath, args.filename)
      : nodeId._addOutputNode(payload2.outputType, args, {
          source: videoSource,
          ...(storyClipGuard ? { storySequenceOutput: storyClipGuard.outputSource } : {}),
          durationSec:
            durationSec || Math.max(0, toNumber(videoTrack2?.endSec, 0) - toNumber(videoTrack2?.startSec, 0)),
        }),
      window.showToast?.(mediaClipText('export.clipExported')));
  } catch (error3) {
    if (storyClipGuard && storyClipResult?.localPath)
      showStoryClipRecovery(storyClipResult.localPath, error3?.message);
    window.showToast?.(error3?.message || mediaClipText('export.clipFailed'));
  } finally {
    ((nodeId._exporting = false), nodeId.el.classList.remove('is-exporting'), nodeId._stopExportLoading());
  }
}
export function resolveOutputNodePosition(value12, value13, value14) {
  return calcSafeSpawnPosNearNode(appStore.getState()?.nodes || {}, value12.nodeData || {}, value13, value14);
}
export function addImageOutputNodeFromSource(value15, fileName = {}, name = {}) {
  const src = resolveMediaClipImageUrl(fileName),
    localPath2 = resolveMediaClipLocalPath(fileName);
  if (!src && !localPath2) return;
  const naturalWidth = resolveMediaClipDimensions(fileName),
    width = getAutoMediaSizeByShortSide(naturalWidth.width, naturalWidth.height),
    x = value15._resolveOutputNodePosition(width.width, width.height),
    id = generateId('source-image'),
    sourceMediaNodePayload = buildSourceMediaNodePayload({
      id: id,
      type: 'source-image',
      x: x.x,
      y: x.y,
      width: width.width,
      height: width.height,
      name: name.name || mediaClipText('outputNames.image'),
      src: src,
      imageUrl: src,
      sourceUrl: normalizeText(fileName?.sourceUrl || src),
      thumbUrl: normalizeText(fileName?.thumbUrl || resolveMediaClipThumbUrl(fileName)),
      localPath: localPath2,
      originalLocalPath: normalizeText(fileName?.originalLocalPath || localPath2),
      displayLocalPath: normalizeText(fileName?.displayLocalPath || localPath2),
      naturalWidth: naturalWidth.width,
      naturalHeight: naturalWidth.height,
      fileName: fileName?.fileName || '',
      needsAutoResize: false,
    });
  (appStore.addNode(sourceMediaNodePayload), appStore.setSelectedNodes([id]), commit());
}
export function addOutputNode(value16, value17, fileName2 = {}, name2 = {}) {
  const localPath3 = pickResultLocalPath(fileName2) || normalizeText(fileName2.localPath || fileName2.path);
  if (!localPath3) return;
  const src2 = localPathToUrl(localPath3);
  if (value17 === 'audio') {
    const id2 = generateId('source-audio'),
      x2 = value16._resolveOutputNodePosition(320, 140),
      sourceAudioNodePayload = buildSourceAudioNodePayload({
        id: id2,
        type: 'source-audio',
        x: x2.x,
        y: x2.y,
        width: 320,
        height: 140,
        name: name2.name || mediaClipText('outputNames.audio'),
        src: src2,
        audioUrl: src2,
        localPath: localPath3,
        audioDuration: toNumber(fileName2.audioDuration, name2.durationSec || 0),
        fileName: fileName2.filename || '',
      });
    (appStore.addNode(sourceAudioNodePayload), appStore.setSelectedNodes([id2]), commit());
    return;
  }
  const value18 = name2.source || value16._sources.video,
    naturalWidth2 = resolveMediaClipOutputVideoDimensions(value18, fileName2),
    width2 = getAutoMediaSizeByShortSide(naturalWidth2.width, naturalWidth2.height),
    x3 = value16._resolveOutputNodePosition(width2.width, width2.height),
    id3 = generateId('source-video'),
    mediaClipPosterImageFields = resolveMediaClipPosterImageFields(value18, fileName2, name2),
    thumbUrl = mediaClipPosterImageFields.isOutputPoster === true,
    value19 = {
      ...(name2.storySequenceOutput ? { storySequenceOutput: name2.storySequenceOutput } : {}),
      ...buildSourceMediaNodePayload({
        id: id3,
        type: 'source-video',
        x: x3.x,
        y: x3.y,
        width: width2.width,
        height: width2.height,
        name: name2.name || mediaClipText('outputNames.video'),
        src: src2,
        videoUrl: src2,
        localPath: localPath3,
        originalLocalPath: localPath3,
        displayLocalPath: localPath3,
        thumbUrl: thumbUrl ? mediaClipPosterImageFields.thumbUrl : '',
        posterUrl: thumbUrl ? mediaClipPosterImageFields.posterUrl : '',
        thumbLocalPath: thumbUrl ? mediaClipPosterImageFields.thumbLocalPath : '',
        posterLocalPath: thumbUrl ? mediaClipPosterImageFields.posterLocalPath : '',
        videoThumbSrc: src2,
        naturalWidth: naturalWidth2.width,
        naturalHeight: naturalWidth2.height,
        videoWidth: naturalWidth2.width,
        videoHeight: naturalWidth2.height,
        videoDuration: toNumber(
          fileName2.videoDuration,
          name2.durationSec || value16._mediaClip.tracks?.video?.endSec || 0,
        ),
        fileName: fileName2.filename || '',
        needsAutoResize: false,
      }),
      naturalWidth: naturalWidth2.width,
      naturalHeight: naturalWidth2.height,
      videoWidth: naturalWidth2.width,
      videoHeight: naturalWidth2.height,
      needsAutoResize: false,
    };
  (appStore.addNode(value19), appStore.setSelectedNodes([id3]), commit());
}
