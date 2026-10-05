import { fetchVideoFirstFrameThumbFromServer } from '../../../api/videoThumbApi.js';
import { startVideoFrameSnapshotPersistence } from '../../components/videoFrameCapture.js';
import { saveOutputBlob, saveOutputFromUrl } from '../../services/projectService.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { playAssetCreateFly } from '../assetCreateFly.js';
import VideoClipController from '../VideoClipController.js';
import { syncStoryAsyncButton } from './storyAsyncButtonPresentation.js';
import { captureStoryClipFrameSnapshot } from './storyClipFrameCapture.js';
import {
  createStoryClipFrameRecord,
  createStoryClipVideoRecord,
  normalizeStoryClipFrames,
  upsertStoryClipFrame,
} from './storyClipFrames.js';
function normalizeText(value) {
  return String(value || '')['trim']();
}
function findEpisode(item, key) {
  return (
    (Array['isArray'](item?.['episodes']) ? item['episodes'] : [])['find'](
      (index) => normalizeText(index?.['id']) === normalizeText(key),
    ) || null
  );
}
function findClip(result, data) {
  return (
    (Array['isArray'](result?.['clips']) ? result['clips'] : [])['find'](
      (options) => normalizeText(options?.['id']) === normalizeText(data),
    ) || null
  );
}
export function createStoryClipFrameProductionController({
  state: state,
  viewportEl: viewportEl,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  getSelection: getSelection = () => ({ episode: null, clip: null }),
  projectTasks: projectTasks = {},
  schedulePersistence: schedulePersistence = () => {},
  syncFrameToCanvas: syncFrameToCanvas = () => Promise['resolve'](![]),
  syncFrameRail: syncFrameRail = () => ![],
  settleFrameCard: settleFrameCard = () => ![],
  render: render = () => {},
  showToast: showToast = () => {},
} = {}) {
  const map = new Set(),
    handler = projectTasks['createToken'] || (() => null),
    handler2 = projectTasks['isLive'] || (() => ![]),
    handler3 = projectTasks['isCurrent'] || (() => ![]),
    handler4 = projectTasks['syncEntry'] || (() => ![]);
  function trimSelected(el) {
    const el2 = el?.['closest']?.('.story-video-result[data-story-video-result-index]'),
      wrapperEl = el2?.['querySelector']?.('.story-video-stage'),
      videoEl = el2?.['querySelector']?.('[data-story-video-player]'),
      { episode: episode, clip: clip } = getSelection();
    if (!wrapperEl || !videoEl || !episode || !clip) return (showToast('当前片段视频不可用。', 'warn'), ![]);
    const videoResultIndex = Math['max'](
        0,
        Math['trunc'](Number(el?.['dataset']?.['storyVideoResultIndex']) || 0),
      ),
      sourceData = Array['isArray'](clip?.['video']?.['results'])
        ? clip['video']['results'][videoResultIndex] || {}
        : {},
      sourceLocalPath = normalizeText(
        sourceData['displayLocalPath'] || sourceData['localPath'] || sourceData['originalLocalPath'],
      ),
      sourceUrl =
        [
          localPathToUrl(sourceLocalPath),
          sourceData['videoUrl'],
          sourceData['url'],
          sourceData['displayUrl'],
          videoEl['dataset']?.['storyVideoUrl'],
          videoEl['currentSrc'],
          videoEl['getAttribute']?.('src'),
        ]
          ['map'](normalizeText)
          ['find'](Boolean) || '';
    if (!sourceUrl) return (showToast('当前片段视频源不可用。', 'warn'), ![]);
    const sourceKey = normalizeText(sourceData['taskId'] || sourceData['id'] || sourceLocalPath || sourceUrl),
      fromRect = videoEl['getBoundingClientRect']?.(),
      target = handler(),
      posterUrl = normalizeText(
        sourceData['posterUrl'] ||
          sourceData['thumbUrl'] ||
          sourceData['thumbnailUrl'] ||
          sourceData['coverUrl'],
      );
    return VideoClipController['initForSource']({
      anchorId: 'story-video-clip:' + normalizeText(clip['id']) + ':' + videoResultIndex,
      wrapperEl: wrapperEl,
      videoEl: videoEl,
      sourceUrl: sourceUrl,
      sourceLocalPath: sourceLocalPath,
      sourceData: sourceData,
      posterUrl: posterUrl,
      durationSec: Number(videoEl['duration']) || Number(sourceData['videoDuration']) || 0,
      videoWidth: Number(videoEl['videoWidth']) || Number(sourceData['videoWidth']) || 0,
      videoHeight: Number(videoEl['videoHeight']) || Number(sourceData['videoHeight']) || 0,
      dimMode: ![],
      onConfirm: ({
        startSec: startSec,
        endSec: endSec,
        durationSec: durationSec,
        cutLocalPath: cutLocalPath,
        videoUrl: videoUrl,
        fps: fps,
        result: result2,
      }) => {
        if (!handler2(target)) return;
        const episode2 = findEpisode(target['data'], episode['id']),
          clip2 = findClip(episode2, clip['id']);
        if (!episode2 || !clip2) return;
        const assetId = createStoryClipVideoRecord({
          saved: {
            src: videoUrl,
            localPath: cutLocalPath,
            originalLocalPath: cutLocalPath,
            videoDuration: durationSec,
            videoFps: fps,
            videoWidth:
              Number(result2?.['width']) ||
              Number(sourceData['videoWidth']) ||
              Number(videoEl['videoWidth']) ||
              0,
            videoHeight:
              Number(result2?.['height']) ||
              Number(sourceData['videoHeight']) ||
              Number(videoEl['videoHeight']) ||
              0,
          },
          episode: episode2,
          clip: clip2,
          videoResultIndex: videoResultIndex,
          startTimeSec: startSec,
          endTimeSec: endSec,
          sourceKey: sourceKey,
          sourceUrl: sourceUrl,
        });
        ((target['data']['clipFrames'] = upsertStoryClipFrame(target['data']['clipFrames'], assetId)),
          handler4(target),
          schedulePersistence({ immediate: !![] }),
          void syncFrameToCanvas(target, assetId));
        if (handler3(target)) {
          state['episodeAssetRailTab'] = 'frames';
          if (!syncFrameRail({ refreshContent: !![] })) render();
          const contentElement = documentObject['createElement']('video');
          ((contentElement['src'] = videoUrl),
            (contentElement['muted'] = !![]),
            (contentElement['playsInline'] = !![]));
          if (posterUrl) contentElement['poster'] = posterUrl;
          const toElement = viewportEl?.['querySelector']?.('[data-story-episode-asset-tab="frames"]');
          playAssetCreateFly({
            fromRect: fromRect,
            contentElement: contentElement,
            toElement: toElement,
            documentObject: documentObject,
            windowObject: windowObject,
          });
        }
        void fetchVideoFirstFrameThumbFromServer(videoUrl, { assetId: assetId['id'] })
          ['then']((response) => {
            if (!handler2(target)) return;
            const thumbUrl = normalizeText(response?.['thumbUrl'] || response?.['url']),
              thumbLocalPath = normalizeText(response?.['thumbLocalPath'] || response?.['localPath']);
            if (!thumbUrl && !thumbLocalPath) return;
            const args = normalizeStoryClipFrames(target['data']['clipFrames'])['find'](
              (source) => source['id'] === assetId['id'],
            );
            if (!args) return;
            ((target['data']['clipFrames'] = upsertStoryClipFrame(target['data']['clipFrames'], {
              ...args,
              thumbUrl: thumbUrl,
              thumbLocalPath: thumbLocalPath,
            })),
              handler4(target),
              schedulePersistence({ immediate: !![] }));
            const storyClipFrames = normalizeStoryClipFrames(target['data']['clipFrames'])['find'](
              (next) => next['id'] === assetId['id'],
            );
            if (storyClipFrames) void syncFrameToCanvas(target, storyClipFrames);
            handler3(target) && syncFrameRail({ refreshContent: !![] });
          })
          ['catch'](() => {});
      },
    });
  }
  async function captureSelected(el3) {
    const el4 = el3?.['closest']?.('.story-video-result[data-story-video-result-index]'),
      videoEl2 = el4?.['querySelector']?.('[data-story-video-player]'),
      { episode: episode3, clip: clip3 } = getSelection();
    if (!videoEl2 || !episode3 || !clip3) return (showToast('当前片段视频不可用。', 'warn'), ![]);
    const videoResultIndex2 = Math['max'](
        0,
        Math['trunc'](Number(el3?.['dataset']?.['storyVideoResultIndex']) || 0),
      ),
      currentTimeSec = Math['max'](0, Number(videoEl2['currentTime']) || 0),
      current = [
        normalizeText(state['data']?.['project']?.['id']),
        normalizeText(clip3['id']),
        videoResultIndex2,
        Math['round'](currentTimeSec * 1000),
      ]['join'](':');
    if (map['has'](current)) return ![];
    (map['add'](current), (el3['disabled'] = !![]), syncStoryAsyncButton(el3, !![], { spinnerOnly: !![] }));
    const fromRect2 = videoEl2['getBoundingClientRect']?.();
    let enabled = ![];
    const entry = handler(),
      sourceResult = Array['isArray'](clip3?.['video']?.['results'])
        ? clip3['video']['results'][videoResultIndex2] || {}
        : {},
      sourceUrl2 = normalizeText(videoEl2['dataset']?.['storyVideoUrl'] || videoEl2['currentSrc']),
      sourceKey2 = normalizeText(
        sourceResult['taskId'] ||
          sourceResult['id'] ||
          sourceResult['localPath'] ||
          sourceResult['displayLocalPath'] ||
          sourceResult['videoUrl'] ||
          sourceResult['url'] ||
          sourceUrl2,
      );
    try {
      const { snapshot: snapshot, localizedVideo: localizedVideo } = await captureStoryClipFrameSnapshot({
        videoEl: videoEl2,
        sourceResult: sourceResult,
        sourceUrl: sourceUrl2,
        currentTimeSec: currentTimeSec,
        saveOutputFromUrl: saveOutputFromUrl,
        documentObject: documentObject,
        fileNamePrefix: 'story_clip_frame',
      });
      if (!handler2(entry)) return ![];
      const episode4 = findEpisode(entry['data'], episode3['id']),
        clip4 = findClip(episode4, clip3['id']);
      if (!episode4 || !clip4) return ![];
      const record = Array['isArray'](clip4?.['video']?.['results'])
        ? clip4['video']['results'][videoResultIndex2]
        : null;
      record &&
        localizedVideo &&
        ((record['localPath'] = localizedVideo['localPath']),
        (record['originalLocalPath'] = localizedVideo['originalLocalPath']),
        (record['displayLocalPath'] = localizedVideo['displayLocalPath']));
      let payload = null,
        handle = ![];
      const { savePromise: savePromise, previewUrl: previewUrl } = startVideoFrameSnapshotPersistence(
        snapshot,
        saveOutputBlob,
        {
          onPreview: ({ previewUrl: previewUrl2 }) => {
            payload = {
              ...createStoryClipFrameRecord({
                saved: {
                  src: previewUrl2,
                  fileName: snapshot['fileName'],
                  originalWidth: snapshot['originalWidth'],
                  originalHeight: snapshot['originalHeight'],
                },
                episode: episode4,
                clip: clip4,
                videoResultIndex: videoResultIndex2,
                currentTimeSec: currentTimeSec,
                sourceKey: sourceKey2,
                sourceUrl: sourceUrl2,
              }),
              captureSavePending: !![],
              captureSaveError: '',
              isTransient: !![],
            };
            const storyClipFrames2 = normalizeStoryClipFrames(entry['data']['clipFrames'])['find'](
              (config) => config['id'] === payload['id'],
            );
            !storyClipFrames2 &&
              payload['imageUrl'] &&
              ((entry['data']['clipFrames'] = upsertStoryClipFrame(entry['data']['clipFrames'], payload)),
              (handle = !![]));
            if (handler3(entry)) {
              state['episodeAssetRailTab'] = 'frames';
              if (!syncFrameRail({ refreshContent: !![] })) render();
              const contentElement2 = documentObject['createElement']('img');
              ((contentElement2['src'] = previewUrl2), (contentElement2['alt'] = ''));
              const toElement2 = viewportEl?.['querySelector']?.('[data-story-episode-asset-tab="frames"]');
              (playAssetCreateFly({
                fromRect: fromRect2,
                contentElement: contentElement2,
                toElement: toElement2,
                documentObject: documentObject,
                windowObject: windowObject,
              }),
                showToast('当前画面已加入片段帧。', 'success'));
            }
          },
        },
      );
      return (
        (enabled = !![]),
        void savePromise['then']((saved) => {
          if (!handler2(entry)) {
            previewUrl && (windowObject?.['URL'] || globalThis['URL'])?.['revokeObjectURL']?.(previewUrl);
            return;
          }
          const storyClipFrameRecord = createStoryClipFrameRecord({
            saved: saved,
            episode: episode4,
            clip: clip4,
            videoResultIndex: videoResultIndex2,
            currentTimeSec: currentTimeSec,
            sourceKey: sourceKey2,
            sourceUrl: sourceUrl2,
          });
          ((entry['data']['clipFrames'] = upsertStoryClipFrame(
            entry['data']['clipFrames'],
            storyClipFrameRecord,
          )),
            handler4(entry),
            schedulePersistence({ immediate: !![] }),
            void syncFrameToCanvas(entry, storyClipFrameRecord));
          if (handler3(entry)) {
            if (!settleFrameCard(storyClipFrameRecord['id'])) syncFrameRail({ refreshContent: !![] });
          }
          previewUrl && (windowObject?.['URL'] || globalThis['URL'])?.['revokeObjectURL']?.(previewUrl);
        })
          ['catch']((error) => {
            console['warn']('[storyWorkspace] save captured clip frame failed', error);
            if (handle && handler2(entry)) {
              entry['data']['clipFrames'] = normalizeStoryClipFrames(entry['data']['clipFrames'])['map'](
                (args2) =>
                  args2['id'] === payload?.['id']
                    ? {
                        ...args2,
                        captureSavePending: ![],
                        captureSaveError: String(error?.['message'] || '当前帧本地保存失败'),
                        isTransient: !![],
                      }
                    : args2,
              );
              if (handler3(entry)) {
                const errorMessage = String(error?.['message'] || '当前帧本地保存失败');
                (!settleFrameCard(payload?.['id'], { errorMessage: errorMessage }) &&
                  syncFrameRail({ refreshContent: !![] }),
                  showToast('当前帧已显示，但本地保存失败。', 'warning'));
              }
            } else
              (previewUrl && (windowObject?.['URL'] || globalThis['URL'])?.['revokeObjectURL']?.(previewUrl),
                handler3(entry) && showToast('当前帧本地保存失败。', 'warning'));
          })
          ['finally'](() => {
            map['delete'](current);
          }),
        !![]
      );
    } catch (error2) {
      return (
        console['warn']('[storyWorkspace] capture clip frame failed', error2),
        showToast(error2?.['message'] || '截取当前帧失败，请重试。', 'error'),
        ![]
      );
    } finally {
      if (!enabled) map['delete'](current);
      el3?.['isConnected'] !== ![] && ((el3['disabled'] = ![]), syncStoryAsyncButton(el3, ![]));
    }
  }
  return Object['freeze']({ captureSelected: captureSelected, trimSelected: trimSelected });
}
