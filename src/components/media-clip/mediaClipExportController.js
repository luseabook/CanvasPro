import { showStoryClipRecovery } from '../../modules/storyWorkspace/StoryClipPreview.js';
import { createStoryClipExportGuard, validateStoryClipOutput } from '../../modules/storyWorkspace/storyClipModel.js';
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
function mediaClipText(_0x30cbad, _0x3023a6 = {}) {
  return t('mediaClip.' + _0x30cbad, _0x3023a6);
}
export function singleVisualClipExportTrack(_0x4b56f3 = {}) {
  return {
    sourceKey: _0x4b56f3.sourceKey,
    startSec: _0x4b56f3.startSec,
    endSec: _0x4b56f3.endSec,
    durationSec: _0x4b56f3.durationSec,
  };
}
export function exportVisualClips(_0x5eda5d, _0x2cdfda = _0x5eda5d._mediaClip.tracks?.video) {
  return _0x5eda5d
    ._videoTimelineClips(_0x2cdfda)
    .map((_0x36272c, _0x19df7c) => {
      const _0x297131 = _0x5eda5d._videoClipSource(_0x36272c, _0x19df7c),
        _0x2263e0 = firstNonEmpty(
          resolveMediaClipSourceKey(_0x297131),
          _0x36272c?.sourceKey,
          resolveMediaClipLocalPath(_0x297131),
        );
      if (!_0x2263e0) return null;
      return {
        source: _0x297131,
        sourceKey: _0x2263e0,
        kind: _0x5eda5d._visualClipKind(_0x36272c, _0x297131),
        startSec: _0x36272c.startSec,
        endSec: _0x36272c.endSec,
        durationSec: _0x36272c.durationSec,
        timelineStartSec: _0x36272c.timelineStartSec,
        timelineEndSec: _0x36272c.timelineEndSec,
      };
    })
    .filter(Boolean);
}
export function firstExportVideoSource(_0x43a657, _0x1089fe = []) {
  return (
    _0x1089fe.find((_0x2f30f5) => _0x2f30f5.kind === 'video')?.source ||
    _0x1089fe[0]?.source ||
    _0x43a657._firstVideoSource()
  );
}
export function exportVisualDurationSec(_0x308f7c = []) {
  return _0x308f7c.reduce((_0x3147a2, _0x4b07f8) => {
    const _0x563aff = toNumber(_0x4b07f8?.startSec, 0),
      _0x1345bc = Math.max(_0x563aff, toNumber(_0x4b07f8?.endSec, _0x563aff));
    return _0x3147a2 + Math.max(0, _0x1345bc - _0x563aff);
  }, 0);
}
export function exportAudioClips(_0x16be59, _0x4090be = _0x16be59._mediaClip.tracks?.audio) {
  return _0x16be59
    ._audioTimelineClips(_0x4090be)
    .map((_0x19efc3, _0x45849e) => {
      const _0x2968dd = _0x16be59._audioClipSource(_0x19efc3, _0x45849e),
        _0xa4b13 = firstNonEmpty(
          resolveMediaClipSourceKey(_0x2968dd),
          _0x19efc3?.sourceKey,
          resolveMediaClipLocalPath(_0x2968dd),
        );
      if (!_0xa4b13) return null;
      return {
        source: _0x2968dd,
        sourceKey: _0xa4b13,
        startSec: _0x19efc3.startSec,
        endSec: _0x19efc3.endSec,
        durationSec: _0x19efc3.durationSec,
        timelineStartSec: _0x19efc3.timelineStartSec,
        timelineEndSec: _0x19efc3.timelineEndSec,
        laneIndex: _0x19efc3.laneIndex,
        muted: _0x19efc3.muted === true,
        disabled: _0x19efc3.disabled === true,
        ...(_0x19efc3.volume !== undefined ? { volume: _0x19efc3.volume } : {}),
      };
    })
    .filter(Boolean);
}
export function exportLoadingTargetElement(_0x3ea77d) {
  return (
    _0x3ea77d.el?.querySelector?.('.media-clip-preview') ||
    _0x3ea77d.el?.querySelector?.('.media-clip-compact-body') ||
    _0x3ea77d.el ||
    null
  );
}
export function startExportLoading(_0xdaaa61, _0x4058a4 = mediaClipText('export.loading')) {
  if (typeof document === 'undefined') return;
  const _0x2e3d37 = _0xdaaa61._exportLoadingTargetElement();
  if (!_0x2e3d37) return;
  _0xdaaa61._exportLoadingTarget &&
    _0xdaaa61._exportLoadingTarget !== _0x2e3d37 &&
    _0xdaaa61._stopExportLoading();
  ((_0xdaaa61._exportLoadingTarget = _0x2e3d37), _0x2e3d37.classList?.add('is-exporting-material'));
  const _0x2c8598 = _0x2e3d37.querySelector?.('.media-clip-export-loading-overlay');
  if (_0x2c8598) {
    const _0x1d3169 = _0x2c8598.querySelector?.('.media-clip-export-loading-label');
    if (_0x1d3169) _0x1d3169.textContent = _0x4058a4;
    return;
  }
  const _0x57b0a2 = document.createElement('div');
  ((_0x57b0a2.className = 'media-clip-export-loading-overlay'),
    _0x57b0a2.setAttribute('role', 'status'),
    _0x57b0a2.setAttribute('aria-live', 'polite'));
  const _0x26a2cd = document.createElement('div');
  _0x26a2cd.className = 'media-clip-export-loading-spinner';
  const _0x5e470e = document.createElement('div');
  ((_0x5e470e.className = 'media-clip-export-loading-label'), (_0x5e470e.textContent = _0x4058a4));
  const _0x143084 = document.createElement('div');
  _0x143084.className = 'media-clip-export-loading-bar';
  const _0x257768 = document.createElement('div');
  ((_0x257768.className = 'media-clip-export-loading-bar-fill'),
    _0x143084.appendChild(_0x257768),
    _0x57b0a2.append(_0x26a2cd, _0x5e470e, _0x143084),
    _0x2e3d37.appendChild(_0x57b0a2));
}
export function stopExportLoading(_0x518d8e) {
  const _0xcbe1b2 = _0x518d8e._exportLoadingTarget;
  (_0xcbe1b2?.classList?.remove('is-exporting-material'),
    _0xcbe1b2?.querySelectorAll?.('.media-clip-export-loading-overlay')?.forEach((_0x2d851f) => {
      if (typeof _0x2d851f.remove === 'function') {
        _0x2d851f.remove();
        return;
      }
      _0x2d851f.parentNode?.removeChild?.(_0x2d851f);
    }),
    (_0x518d8e._exportLoadingTarget = null));
}
export function waitForExportLoadingFrame() {
  return new Promise((_0x16c342) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => _0x16c342());
      return;
    }
    setTimeout(_0x16c342, 0);
  });
}
export async function exportMaterialToCanvas(_0x49a06d, _0x4de78d = 'video', _0x40dbd5 = 0) {
  if (_0x49a06d.nodeData?.storySequence || _0x49a06d._storyClipNodesContext) { window.showToast?.('本批初剪请使用整段导出；单素材请定位原已采纳媒体。'); return; }
  if (_0x49a06d._exporting) return;
  const _0x18a61d = _0x4de78d === 'audio' ? 'audio' : 'video';
  let _0x28c425 = null,
    _0x447dc5 = null,
    _0x18ec48 = '',
    _0x40aba4 = {},
    _0x39184c = null;
  if (_0x18a61d === 'audio') {
    const _0x44d66c = _0x49a06d._mediaClip.tracks?.audio || null,
      _0x20d35e = _0x49a06d._audioTimelineClips(_0x44d66c),
      _0x3813f3 = Math.max(0, Math.min(_0x20d35e.length - 1, Math.trunc(toNumber(_0x40dbd5, 0)))),
      _0x33cfc8 = _0x20d35e[_0x3813f3] || null,
      _0x1e7b8c = _0x33cfc8
        ? {
            sourceKey: _0x33cfc8.sourceKey,
            startSec: _0x33cfc8.startSec,
            endSec: _0x33cfc8.endSec,
            durationSec: _0x33cfc8.durationSec,
          }
        : _0x44d66c;
    ((_0x447dc5 = _0x33cfc8 ? _0x49a06d._audioClipSource(_0x33cfc8, _0x3813f3) : _0x49a06d._sources.audio),
      (_0x28c425 = buildMediaClipExportPayload({ audioSource: _0x447dc5, audioTrack: _0x1e7b8c })),
      (_0x18ec48 = 'audio'),
      (_0x40aba4 = {
        source: _0x447dc5,
        name: mediaClipText('outputNames.audio'),
        durationSec: Math.max(0, toNumber(_0x1e7b8c?.endSec, 0) - toNumber(_0x1e7b8c?.startSec, 0)),
      }));
  } else {
    const _0x5062a5 = _0x49a06d._videoTimelineClips(_0x49a06d._mediaClip.tracks?.video),
      _0x45570c = Math.max(0, Math.min(_0x5062a5.length - 1, Math.trunc(toNumber(_0x40dbd5, 0)))),
      _0x391215 = _0x5062a5[_0x45570c];
    if (!_0x391215) return;
    _0x447dc5 = _0x49a06d._videoClipSource(_0x391215, _0x45570c);
    const _0x687d45 = _0x49a06d._visualClipKind(_0x391215, _0x447dc5);
    _0x687d45 === 'image'
      ? ((_0x39184c = _0x447dc5), (_0x40aba4 = { name: mediaClipText('outputNames.image') }))
      : ((_0x28c425 = buildMediaClipExportPayload({
          videoSource: _0x447dc5,
          videoTrack: _0x49a06d._singleVisualClipExportTrack(_0x391215),
        })),
        (_0x18ec48 = 'video'),
        (_0x40aba4 = {
          source: _0x447dc5,
          name: mediaClipText('outputNames.video'),
          durationSec: Math.max(0, toNumber(_0x391215.endSec, 0) - toNumber(_0x391215.startSec, 0)),
        }));
  }
  if (!_0x28c425 && !_0x39184c) {
    window.showToast?.(mediaClipText('export.noMaterial'));
    return;
  }
  ((_0x49a06d._exporting = true),
    _0x49a06d.el?.classList?.add('is-exporting'),
    _0x49a06d._startExportLoading());
  try {
    await _0x49a06d._waitForExportLoadingFrame();
    if (_0x39184c) _0x49a06d._addImageOutputNodeFromSource(_0x39184c, _0x40aba4);
    else {
      const _0x2682f7 = await runLocalMediaClipExport(_0x28c425, { timeout: 0x927c0 });
      _0x49a06d._addOutputNode(_0x18ec48 || _0x28c425.outputType, _0x2682f7, _0x40aba4);
    }
    window.showToast?.(mediaClipText('export.materialAdded'));
  } catch (_0x396c91) {
    window.showToast?.(_0x396c91?.message || mediaClipText('export.materialFailed'));
  } finally {
    ((_0x49a06d._exporting = false),
      _0x49a06d.el?.classList?.remove('is-exporting'),
      _0x49a06d._stopExportLoading(),
      _0x49a06d._render());
  }
}
export function renderDownloadMenu(_0x470609) {
  const _0x3ca330 = document.createElement('div');
  _0x3ca330.className = 'v2-canvas-ctx-menu media-clip-menu';
  const _0x33cd2c = mediaClipText('menu.addToCanvas'),
    _0x334e47 = makeButton('v2-menu-row media-clip-menu-item', _0x33cd2c, _0x33cd2c);
  _0x334e47.addEventListener('click', async (_0x4ccab1) => {
    (stopPointer(_0x4ccab1), _0x470609._setDownloadMenuOpen(false), await _0x470609._exportAndUse('canvas'));
  });
  const _0x3c61c6 = mediaClipText('menu.export'),
    _0x424558 = makeButton('v2-menu-row media-clip-menu-item', _0x3c61c6, _0x3c61c6);
  return (
    _0x424558.addEventListener('click', async (_0x1ad03e) => {
      (stopPointer(_0x1ad03e),
        _0x470609._setDownloadMenuOpen(false),
        await _0x470609._exportAndUse('download'));
    }),
    _0x3ca330.append(_0x334e47, _0x424558),
    _0x3ca330
  );
}
export async function exportAndUse(_0x2b04ab, _0x5c25c5) {
  if (_0x2b04ab._exporting) return;
  const _0xa40bf5 = _0x2b04ab._mediaClip.tracks?.video || null,
    _0xb08d2e = _0x2b04ab._mediaClip.tracks?.audio || null,
    _0x9fcd7e = _0x2b04ab._exportVisualClips(_0xa40bf5),
    _0xd28170 = _0x2b04ab._exportAudioClips(_0xb08d2e),
    _0xf2e234 = _0x2b04ab._firstExportVideoSource(_0x9fcd7e),
    _0x3e51e4 = _0x2b04ab._exportVisualDurationSec(_0x9fcd7e),
    _0x2bde47 = buildMediaClipExportPayload({
      videoSource: _0xf2e234,
      videoTrack: _0xa40bf5,
      audioTrack: _0xb08d2e,
      videoClips: _0x9fcd7e,
      audioClips: _0xd28170,
    });
  if (!_0x2bde47) {
    window.showToast?.(mediaClipText('export.noClips'));
    return;
  }
  let storyClipGuard, storyClipResult = null;
  try {
    storyClipGuard = createStoryClipExportGuard({ store: appStore, nodeId: _0x2b04ab.id, payload: _0x2bde47,
      expectedNodes: _0x2b04ab._storyClipNodesContext, requireMarked: !!(_0x2b04ab._storyClipNodesContext || _0x2b04ab.nodeData?.storySequence) });
    if (storyClipGuard && !canUseElectronMediaTask()) throw new Error('镜头初剪渲染需更新后的桌面端，不调用浏览器后端');
    if (storyClipGuard && !window.confirm(storyClipGuard.confirmation)) return;
  } catch (error) { window.showToast?.(error.message); return; }
  ((_0x2b04ab._exporting = true),
    _0x2b04ab.el.classList.add('is-exporting'),
    _0x2b04ab._startExportLoading());
  try {
    await _0x2b04ab._waitForExportLoadingFrame();
    storyClipGuard?.assertCurrent();
    let _0x3b7acd = null;
    if (
      !storyClipGuard && _0x2b04ab._mediaClip.lastOutput?.signature === _0x2bde47.signature &&
      _0x2b04ab._mediaClip.lastOutput?.localPath
    )
      _0x3b7acd = { ..._0x2b04ab._mediaClip.lastOutput };
    else {
      _0x3b7acd = await runLocalMediaClipExport(storyClipGuard?.request || _0x2bde47, { timeout: 0x927c0 });
      if (storyClipGuard) { storyClipResult = { ..._0x3b7acd, localPath: validateStoryClipOutput(_0x3b7acd) }; storyClipGuard.assertCurrent(); }
      const _0x297095 = pickResultLocalPath(_0x3b7acd) || _0x3b7acd?.localPath || _0x3b7acd?.path || '',
        _0x229d3f = {
          ..._0x3b7acd,
          outputType: _0x2bde47.outputType,
          signature: _0x2bde47.signature,
          localPath: _0x297095,
        };
      (_0x2b04ab._setMediaClip({ ..._0x2b04ab._mediaClip, lastOutput: _0x229d3f }, true, { render: false }),
        (_0x3b7acd = _0x229d3f));
    }
    storyClipGuard?.assertCurrent();
    (_0x5c25c5 === 'download'
      ? downloadLocalPath(_0x3b7acd.localPath, _0x3b7acd.filename)
      : _0x2b04ab._addOutputNode(_0x2bde47.outputType, _0x3b7acd, {
          source: _0xf2e234,
          ...(storyClipGuard ? { storySequenceOutput: storyClipGuard.outputSource } : {}),
          durationSec:
            _0x3e51e4 || Math.max(0, toNumber(_0xa40bf5?.endSec, 0) - toNumber(_0xa40bf5?.startSec, 0)),
        }),
      window.showToast?.(mediaClipText('export.clipExported')));
  } catch (_0x36ab6d) {
    if (storyClipGuard && storyClipResult?.localPath) showStoryClipRecovery(storyClipResult.localPath, _0x36ab6d?.message);
    window.showToast?.(_0x36ab6d?.message || mediaClipText('export.clipFailed'));
  } finally {
    ((_0x2b04ab._exporting = false),
      _0x2b04ab.el.classList.remove('is-exporting'),
      _0x2b04ab._stopExportLoading());
  }
}
export function resolveOutputNodePosition(_0x460aed, _0x5a85ed, _0x1909a4) {
  return calcSafeSpawnPosNearNode(
    appStore.getState()?.nodes || {},
    _0x460aed.nodeData || {},
    _0x5a85ed,
    _0x1909a4,
  );
}
export function addImageOutputNodeFromSource(_0x40a2be, _0x43355b = {}, _0x6a5df4 = {}) {
  const _0x142932 = resolveMediaClipImageUrl(_0x43355b),
    _0x2afb61 = resolveMediaClipLocalPath(_0x43355b);
  if (!_0x142932 && !_0x2afb61) return;
  const _0x215861 = resolveMediaClipDimensions(_0x43355b),
    _0x5eda05 = getAutoMediaSizeByShortSide(_0x215861.width, _0x215861.height),
    _0x24c41f = _0x40a2be._resolveOutputNodePosition(_0x5eda05.width, _0x5eda05.height),
    _0x3467c1 = generateId('source-image'),
    _0x2cd904 = buildSourceMediaNodePayload({
      id: _0x3467c1,
      type: 'source-image',
      x: _0x24c41f.x,
      y: _0x24c41f.y,
      width: _0x5eda05.width,
      height: _0x5eda05.height,
      name: _0x6a5df4.name || mediaClipText('outputNames.image'),
      src: _0x142932,
      imageUrl: _0x142932,
      sourceUrl: normalizeText(_0x43355b?.sourceUrl || _0x142932),
      thumbUrl: normalizeText(_0x43355b?.thumbUrl || resolveMediaClipThumbUrl(_0x43355b)),
      localPath: _0x2afb61,
      originalLocalPath: normalizeText(_0x43355b?.originalLocalPath || _0x2afb61),
      displayLocalPath: normalizeText(_0x43355b?.displayLocalPath || _0x2afb61),
      naturalWidth: _0x215861.width,
      naturalHeight: _0x215861.height,
      fileName: _0x43355b?.fileName || '',
      needsAutoResize: false,
    });
  (appStore.addNode(_0x2cd904), appStore.setSelectedNodes([_0x3467c1]), commit());
}
export function addOutputNode(_0x26f004, _0x565558, _0x3a1029 = {}, _0xd33e66 = {}) {
  const _0x175eb8 = pickResultLocalPath(_0x3a1029) || normalizeText(_0x3a1029.localPath || _0x3a1029.path);
  if (!_0x175eb8) return;
  const _0x303cbb = localPathToUrl(_0x175eb8);
  if (_0x565558 === 'audio') {
    const _0x201d19 = generateId('source-audio'),
      _0xd29dbd = _0x26f004._resolveOutputNodePosition(0x140, 140),
      _0x5b99ad = buildSourceAudioNodePayload({
        id: _0x201d19,
        type: 'source-audio',
        x: _0xd29dbd.x,
        y: _0xd29dbd.y,
        width: 0x140,
        height: 140,
        name: _0xd33e66.name || mediaClipText('outputNames.audio'),
        src: _0x303cbb,
        audioUrl: _0x303cbb,
        localPath: _0x175eb8,
        audioDuration: toNumber(_0x3a1029.audioDuration, _0xd33e66.durationSec || 0),
        fileName: _0x3a1029.filename || '',
      });
    (appStore.addNode(_0x5b99ad), appStore.setSelectedNodes([_0x201d19]), commit());
    return;
  }
  const _0x4a95df = _0xd33e66.source || _0x26f004._sources.video,
    _0x52a4b3 = resolveMediaClipOutputVideoDimensions(_0x4a95df, _0x3a1029),
    _0x333df3 = getAutoMediaSizeByShortSide(_0x52a4b3.width, _0x52a4b3.height),
    _0x275feb = _0x26f004._resolveOutputNodePosition(_0x333df3.width, _0x333df3.height),
    _0xd38ad0 = generateId('source-video'),
    _0x4b6e7b = resolveMediaClipPosterImageFields(_0x4a95df, _0x3a1029, _0xd33e66),
    _0x3bf1e2 = _0x4b6e7b.isOutputPoster === true,
    _0x4c599c = {
      ...(_0xd33e66.storySequenceOutput ? { storySequenceOutput: _0xd33e66.storySequenceOutput } : {}),
      ...buildSourceMediaNodePayload({
        id: _0xd38ad0,
        type: 'source-video',
        x: _0x275feb.x,
        y: _0x275feb.y,
        width: _0x333df3.width,
        height: _0x333df3.height,
        name: _0xd33e66.name || mediaClipText('outputNames.video'),
        src: _0x303cbb,
        videoUrl: _0x303cbb,
        localPath: _0x175eb8,
        originalLocalPath: _0x175eb8,
        displayLocalPath: _0x175eb8,
        thumbUrl: _0x3bf1e2 ? _0x4b6e7b.thumbUrl : '',
        posterUrl: _0x3bf1e2 ? _0x4b6e7b.posterUrl : '',
        thumbLocalPath: _0x3bf1e2 ? _0x4b6e7b.thumbLocalPath : '',
        posterLocalPath: _0x3bf1e2 ? _0x4b6e7b.posterLocalPath : '',
        videoThumbSrc: _0x303cbb,
        naturalWidth: _0x52a4b3.width,
        naturalHeight: _0x52a4b3.height,
        videoWidth: _0x52a4b3.width,
        videoHeight: _0x52a4b3.height,
        videoDuration: toNumber(
          _0x3a1029.videoDuration,
          _0xd33e66.durationSec || _0x26f004._mediaClip.tracks?.video?.endSec || 0,
        ),
        fileName: _0x3a1029.filename || '',
        needsAutoResize: false,
      }),
      naturalWidth: _0x52a4b3.width,
      naturalHeight: _0x52a4b3.height,
      videoWidth: _0x52a4b3.width,
      videoHeight: _0x52a4b3.height,
      needsAutoResize: false,
    };
  (appStore.addNode(_0x4c599c), appStore.setSelectedNodes([_0xd38ad0]), commit());
}
