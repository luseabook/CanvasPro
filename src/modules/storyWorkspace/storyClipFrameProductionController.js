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
function normalizeText(_0xcd513d) {
  return String(_0xcd513d || '')['trim']();
}
function findEpisode(_0x44d3b1, _0x2f9c2f) {
  return (
    (Array['isArray'](_0x44d3b1?.['episodes']) ? _0x44d3b1['episodes'] : [])['find'](
      (_0xbd23ac) => normalizeText(_0xbd23ac?.['id']) === normalizeText(_0x2f9c2f),
    ) || null
  );
}
function findClip(_0x2dbbf6, _0x6ca098) {
  return (
    (Array['isArray'](_0x2dbbf6?.['clips']) ? _0x2dbbf6['clips'] : [])['find'](
      (_0x338aac) => normalizeText(_0x338aac?.['id']) === normalizeText(_0x6ca098),
    ) || null
  );
}
export function createStoryClipFrameProductionController({
  state: _0x1ca9af,
  viewportEl: _0x550518,
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
  const _0x35f1ff = new Set(),
    _0x229638 = projectTasks['createToken'] || (() => null),
    _0x58ff82 = projectTasks['isLive'] || (() => ![]),
    _0x585355 = projectTasks['isCurrent'] || (() => ![]),
    _0x3e2e15 = projectTasks['syncEntry'] || (() => ![]);
  function _0x3f4158(_0x1acbb8) {
    const _0x57efa5 = _0x1acbb8?.['closest']?.('.story-video-result[data-story-video-result-index]'),
      _0x4c55c1 = _0x57efa5?.['querySelector']?.('.story-video-stage'),
      _0x91d63 = _0x57efa5?.['querySelector']?.('[data-story-video-player]'),
      { episode: _0x27e6b2, clip: _0x1e5fa7 } = getSelection();
    if (!_0x4c55c1 || !_0x91d63 || !_0x27e6b2 || !_0x1e5fa7)
      return (showToast('当前片段视频不可用。', 'warn'), ![]);
    const _0x802cbb = Math['max'](
        0x0,
        Math['trunc'](Number(_0x1acbb8?.['dataset']?.['storyVideoResultIndex']) || 0x0),
      ),
      _0xb180be = Array['isArray'](_0x1e5fa7?.['video']?.['results'])
        ? _0x1e5fa7['video']['results'][_0x802cbb] || {}
        : {},
      _0x50123b = normalizeText(
        _0xb180be['displayLocalPath'] || _0xb180be['localPath'] || _0xb180be['originalLocalPath'],
      ),
      _0x29417d =
        [
          localPathToUrl(_0x50123b),
          _0xb180be['videoUrl'],
          _0xb180be['url'],
          _0xb180be['displayUrl'],
          _0x91d63['dataset']?.['storyVideoUrl'],
          _0x91d63['currentSrc'],
          _0x91d63['getAttribute']?.('src'),
        ]
          ['map'](normalizeText)
          ['find'](Boolean) || '';
    if (!_0x29417d) return (showToast('当前片段视频源不可用。', 'warn'), ![]);
    const _0x1b33a2 = normalizeText(_0xb180be['taskId'] || _0xb180be['id'] || _0x50123b || _0x29417d),
      _0x5e9b83 = _0x91d63['getBoundingClientRect']?.(),
      _0x486db1 = _0x229638(),
      _0xc4b919 = normalizeText(
        _0xb180be['posterUrl'] || _0xb180be['thumbUrl'] || _0xb180be['thumbnailUrl'] || _0xb180be['coverUrl'],
      );
    return VideoClipController['initForSource']({
      anchorId: 'story-video-clip:' + normalizeText(_0x1e5fa7['id']) + ':' + _0x802cbb,
      wrapperEl: _0x4c55c1,
      videoEl: _0x91d63,
      sourceUrl: _0x29417d,
      sourceLocalPath: _0x50123b,
      sourceData: _0xb180be,
      posterUrl: _0xc4b919,
      durationSec: Number(_0x91d63['duration']) || Number(_0xb180be['videoDuration']) || 0x0,
      videoWidth: Number(_0x91d63['videoWidth']) || Number(_0xb180be['videoWidth']) || 0x0,
      videoHeight: Number(_0x91d63['videoHeight']) || Number(_0xb180be['videoHeight']) || 0x0,
      dimMode: ![],
      onConfirm: ({
        startSec: _0x1a4379,
        endSec: _0x56a70f,
        durationSec: _0x504618,
        cutLocalPath: _0x6d5238,
        videoUrl: _0x35f698,
        fps: _0x41910d,
        result: _0x5e5a4e,
      }) => {
        if (!_0x58ff82(_0x486db1)) return;
        const _0x36374c = findEpisode(_0x486db1['data'], _0x27e6b2['id']),
          _0xdeca89 = findClip(_0x36374c, _0x1e5fa7['id']);
        if (!_0x36374c || !_0xdeca89) return;
        const _0x2194a4 = createStoryClipVideoRecord({
          saved: {
            src: _0x35f698,
            localPath: _0x6d5238,
            originalLocalPath: _0x6d5238,
            videoDuration: _0x504618,
            videoFps: _0x41910d,
            videoWidth:
              Number(_0x5e5a4e?.['width']) ||
              Number(_0xb180be['videoWidth']) ||
              Number(_0x91d63['videoWidth']) ||
              0x0,
            videoHeight:
              Number(_0x5e5a4e?.['height']) ||
              Number(_0xb180be['videoHeight']) ||
              Number(_0x91d63['videoHeight']) ||
              0x0,
          },
          episode: _0x36374c,
          clip: _0xdeca89,
          videoResultIndex: _0x802cbb,
          startTimeSec: _0x1a4379,
          endTimeSec: _0x56a70f,
          sourceKey: _0x1b33a2,
          sourceUrl: _0x29417d,
        });
        ((_0x486db1['data']['clipFrames'] = upsertStoryClipFrame(_0x486db1['data']['clipFrames'], _0x2194a4)),
          _0x3e2e15(_0x486db1),
          schedulePersistence({ immediate: !![] }),
          void syncFrameToCanvas(_0x486db1, _0x2194a4));
        if (_0x585355(_0x486db1)) {
          _0x1ca9af['episodeAssetRailTab'] = 'frames';
          if (!syncFrameRail({ refreshContent: !![] })) render();
          const _0xcaf5b6 = documentObject['createElement']('video');
          ((_0xcaf5b6['src'] = _0x35f698), (_0xcaf5b6['muted'] = !![]), (_0xcaf5b6['playsInline'] = !![]));
          if (_0xc4b919) _0xcaf5b6['poster'] = _0xc4b919;
          const _0x55e4d9 = _0x550518?.['querySelector']?.('[data-story-episode-asset-tab="frames"]');
          playAssetCreateFly({
            fromRect: _0x5e9b83,
            contentElement: _0xcaf5b6,
            toElement: _0x55e4d9,
            documentObject: documentObject,
            windowObject: windowObject,
          });
        }
        void fetchVideoFirstFrameThumbFromServer(_0x35f698, { assetId: _0x2194a4['id'] })
          ['then']((_0x38db68) => {
            if (!_0x58ff82(_0x486db1)) return;
            const _0x58cc3d = normalizeText(_0x38db68?.['thumbUrl'] || _0x38db68?.['url']),
              _0x36920c = normalizeText(_0x38db68?.['thumbLocalPath'] || _0x38db68?.['localPath']);
            if (!_0x58cc3d && !_0x36920c) return;
            const _0x569217 = normalizeStoryClipFrames(_0x486db1['data']['clipFrames'])['find'](
              (_0xe5deb2) => _0xe5deb2['id'] === _0x2194a4['id'],
            );
            if (!_0x569217) return;
            ((_0x486db1['data']['clipFrames'] = upsertStoryClipFrame(_0x486db1['data']['clipFrames'], {
              ..._0x569217,
              thumbUrl: _0x58cc3d,
              thumbLocalPath: _0x36920c,
            })),
              _0x3e2e15(_0x486db1),
              schedulePersistence({ immediate: !![] }));
            const _0x76f948 = normalizeStoryClipFrames(_0x486db1['data']['clipFrames'])['find'](
              (_0x1a701d) => _0x1a701d['id'] === _0x2194a4['id'],
            );
            if (_0x76f948) void syncFrameToCanvas(_0x486db1, _0x76f948);
            _0x585355(_0x486db1) && syncFrameRail({ refreshContent: !![] });
          })
          ['catch'](() => {});
      },
    });
  }
  async function _0x255fc1(_0x15758c) {
    const _0x2dcb5a = _0x15758c?.['closest']?.('.story-video-result[data-story-video-result-index]'),
      _0x2ea488 = _0x2dcb5a?.['querySelector']?.('[data-story-video-player]'),
      { episode: _0x58d973, clip: _0x2beb5e } = getSelection();
    if (!_0x2ea488 || !_0x58d973 || !_0x2beb5e) return (showToast('当前片段视频不可用。', 'warn'), ![]);
    const _0x5b058c = Math['max'](
        0x0,
        Math['trunc'](Number(_0x15758c?.['dataset']?.['storyVideoResultIndex']) || 0x0),
      ),
      _0x2e6576 = Math['max'](0x0, Number(_0x2ea488['currentTime']) || 0x0),
      _0x3b2d21 = [
        normalizeText(_0x1ca9af['data']?.['project']?.['id']),
        normalizeText(_0x2beb5e['id']),
        _0x5b058c,
        Math['round'](_0x2e6576 * 0x3e8),
      ]['join'](':');
    if (_0x35f1ff['has'](_0x3b2d21)) return ![];
    (_0x35f1ff['add'](_0x3b2d21),
      (_0x15758c['disabled'] = !![]),
      syncStoryAsyncButton(_0x15758c, !![], { spinnerOnly: !![] }));
    const _0x2e5443 = _0x2ea488['getBoundingClientRect']?.();
    let _0x4665e4 = ![];
    const _0x2379e4 = _0x229638(),
      _0x10b754 = Array['isArray'](_0x2beb5e?.['video']?.['results'])
        ? _0x2beb5e['video']['results'][_0x5b058c] || {}
        : {},
      _0x48fc2c = normalizeText(_0x2ea488['dataset']?.['storyVideoUrl'] || _0x2ea488['currentSrc']),
      _0x2240ac = normalizeText(
        _0x10b754['taskId'] ||
          _0x10b754['id'] ||
          _0x10b754['localPath'] ||
          _0x10b754['displayLocalPath'] ||
          _0x10b754['videoUrl'] ||
          _0x10b754['url'] ||
          _0x48fc2c,
      );
    try {
      const { snapshot: _0x5850cf, localizedVideo: _0x5d7b39 } = await captureStoryClipFrameSnapshot({
        videoEl: _0x2ea488,
        sourceResult: _0x10b754,
        sourceUrl: _0x48fc2c,
        currentTimeSec: _0x2e6576,
        saveOutputFromUrl: saveOutputFromUrl,
        documentObject: documentObject,
        fileNamePrefix: 'story_clip_frame',
      });
      if (!_0x58ff82(_0x2379e4)) return ![];
      const _0x2f0598 = findEpisode(_0x2379e4['data'], _0x58d973['id']),
        _0x54d155 = findClip(_0x2f0598, _0x2beb5e['id']);
      if (!_0x2f0598 || !_0x54d155) return ![];
      const _0x50d98f = Array['isArray'](_0x54d155?.['video']?.['results'])
        ? _0x54d155['video']['results'][_0x5b058c]
        : null;
      _0x50d98f &&
        _0x5d7b39 &&
        ((_0x50d98f['localPath'] = _0x5d7b39['localPath']),
        (_0x50d98f['originalLocalPath'] = _0x5d7b39['originalLocalPath']),
        (_0x50d98f['displayLocalPath'] = _0x5d7b39['displayLocalPath']));
      let _0xcb3ffa = null,
        _0x5aac75 = ![];
      const { savePromise: _0x27cfb3, previewUrl: _0x4c7163 } = startVideoFrameSnapshotPersistence(
        _0x5850cf,
        saveOutputBlob,
        {
          onPreview: ({ previewUrl: _0x486b9e }) => {
            _0xcb3ffa = {
              ...createStoryClipFrameRecord({
                saved: {
                  src: _0x486b9e,
                  fileName: _0x5850cf['fileName'],
                  originalWidth: _0x5850cf['originalWidth'],
                  originalHeight: _0x5850cf['originalHeight'],
                },
                episode: _0x2f0598,
                clip: _0x54d155,
                videoResultIndex: _0x5b058c,
                currentTimeSec: _0x2e6576,
                sourceKey: _0x2240ac,
                sourceUrl: _0x48fc2c,
              }),
              captureSavePending: !![],
              captureSaveError: '',
              isTransient: !![],
            };
            const _0x1d9b95 = normalizeStoryClipFrames(_0x2379e4['data']['clipFrames'])['find'](
              (_0x195bc7) => _0x195bc7['id'] === _0xcb3ffa['id'],
            );
            !_0x1d9b95 &&
              _0xcb3ffa['imageUrl'] &&
              ((_0x2379e4['data']['clipFrames'] = upsertStoryClipFrame(
                _0x2379e4['data']['clipFrames'],
                _0xcb3ffa,
              )),
              (_0x5aac75 = !![]));
            if (_0x585355(_0x2379e4)) {
              _0x1ca9af['episodeAssetRailTab'] = 'frames';
              if (!syncFrameRail({ refreshContent: !![] })) render();
              const _0x3574fe = documentObject['createElement']('img');
              ((_0x3574fe['src'] = _0x486b9e), (_0x3574fe['alt'] = ''));
              const _0x113a10 = _0x550518?.['querySelector']?.('[data-story-episode-asset-tab="frames"]');
              (playAssetCreateFly({
                fromRect: _0x2e5443,
                contentElement: _0x3574fe,
                toElement: _0x113a10,
                documentObject: documentObject,
                windowObject: windowObject,
              }),
                showToast('当前画面已加入片段帧。', 'success'));
            }
          },
        },
      );
      return (
        (_0x4665e4 = !![]),
        void _0x27cfb3['then']((_0x41aa3d) => {
          if (!_0x58ff82(_0x2379e4)) {
            _0x4c7163 && (windowObject?.['URL'] || globalThis['URL'])?.['revokeObjectURL']?.(_0x4c7163);
            return;
          }
          const _0x1759e8 = createStoryClipFrameRecord({
            saved: _0x41aa3d,
            episode: _0x2f0598,
            clip: _0x54d155,
            videoResultIndex: _0x5b058c,
            currentTimeSec: _0x2e6576,
            sourceKey: _0x2240ac,
            sourceUrl: _0x48fc2c,
          });
          ((_0x2379e4['data']['clipFrames'] = upsertStoryClipFrame(
            _0x2379e4['data']['clipFrames'],
            _0x1759e8,
          )),
            _0x3e2e15(_0x2379e4),
            schedulePersistence({ immediate: !![] }),
            void syncFrameToCanvas(_0x2379e4, _0x1759e8));
          if (_0x585355(_0x2379e4)) {
            if (!settleFrameCard(_0x1759e8['id'])) syncFrameRail({ refreshContent: !![] });
          }
          _0x4c7163 && (windowObject?.['URL'] || globalThis['URL'])?.['revokeObjectURL']?.(_0x4c7163);
        })
          ['catch']((_0x1ba236) => {
            console['warn']('[storyWorkspace] save captured clip frame failed', _0x1ba236);
            if (_0x5aac75 && _0x58ff82(_0x2379e4)) {
              _0x2379e4['data']['clipFrames'] = normalizeStoryClipFrames(_0x2379e4['data']['clipFrames'])[
                'map'
              ]((_0x3c4e39) =>
                _0x3c4e39['id'] === _0xcb3ffa?.['id']
                  ? {
                      ..._0x3c4e39,
                      captureSavePending: ![],
                      captureSaveError: String(_0x1ba236?.['message'] || '当前帧本地保存失败'),
                      isTransient: !![],
                    }
                  : _0x3c4e39,
              );
              if (_0x585355(_0x2379e4)) {
                const _0x10ae7e = String(_0x1ba236?.['message'] || '当前帧本地保存失败');
                (!settleFrameCard(_0xcb3ffa?.['id'], { errorMessage: _0x10ae7e }) &&
                  syncFrameRail({ refreshContent: !![] }),
                  showToast('当前帧已显示，但本地保存失败。', 'warning'));
              }
            } else
              (_0x4c7163 && (windowObject?.['URL'] || globalThis['URL'])?.['revokeObjectURL']?.(_0x4c7163),
                _0x585355(_0x2379e4) && showToast('当前帧本地保存失败。', 'warning'));
          })
          ['finally'](() => {
            _0x35f1ff['delete'](_0x3b2d21);
          }),
        !![]
      );
    } catch (_0x499008) {
      return (
        console['warn']('[storyWorkspace]\x20capture\x20clip\x20frame\x20failed', _0x499008),
        showToast(_0x499008?.['message'] || '截取当前帧失败，请重试。', 'error'),
        ![]
      );
    } finally {
      if (!_0x4665e4) _0x35f1ff['delete'](_0x3b2d21);
      _0x15758c?.['isConnected'] !== ![] &&
        ((_0x15758c['disabled'] = ![]), syncStoryAsyncButton(_0x15758c, ![]));
    }
  }
  return Object['freeze']({ captureSelected: _0x255fc1, trimSelected: _0x3f4158 });
}
