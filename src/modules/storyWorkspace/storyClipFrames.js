import { localPathToUrl } from '../../utils/localMediaPath.js';
export const STORY_CLIP_FRAME_MENTION_PREFIX = 'story-clip-frame:';
export const STORY_CLIP_MEDIA_TYPE_IMAGE = 'image';
export const STORY_CLIP_MEDIA_TYPE_VIDEO = 'video';
function normalizeText(_0x2192cb) {
  return String(_0x2192cb || '')['trim']();
}
function normalizeIndex(_0x1f0f6b) {
  const _0x2c8b3c = Math['trunc'](Number(_0x1f0f6b));
  return Number['isFinite'](_0x2c8b3c) && _0x2c8b3c >= 0x0 ? _0x2c8b3c : 0x0;
}
function normalizeTimeSeconds(_0x1170e9) {
  const _0x292b50 = Number(_0x1170e9);
  return Number['isFinite'](_0x292b50) && _0x292b50 >= 0x0 ? Number(_0x292b50['toFixed'](0x3)) : 0x0;
}
function hashText(_0x1b8770) {
  let _0x2499ee = 0x811c9dc5;
  for (const _0x35a47b of String(_0x1b8770 || '')) {
    ((_0x2499ee ^= _0x35a47b['charCodeAt'](0x0)), (_0x2499ee = Math['imul'](_0x2499ee, 0x1000193)));
  }
  return (_0x2499ee >>> 0x0)['toString'](0x24);
}
export function formatStoryClipFrameTime(_0x39e58b) {
  const _0x36a82a = normalizeTimeSeconds(_0x39e58b),
    _0x38c955 = Math['floor'](_0x36a82a / 0x3c),
    _0x3dcaad = _0x36a82a - _0x38c955 * 0x3c;
  return String(_0x38c955)['padStart'](0x2, '0') + ':' + _0x3dcaad['toFixed'](0x1)['padStart'](0x4, '0');
}
export function buildStoryClipFrameId({
  clipId: clipId = '',
  videoResultIndex: videoResultIndex = 0x0,
  sourceKey: sourceKey = '',
  currentTimeSec: currentTimeSec = 0x0,
} = {}) {
  const _0x33aefa = normalizeText(clipId) || 'clip',
    _0x211a6 = normalizeIndex(videoResultIndex),
    _0x5bf13c = Math['max'](0x0, Math['round'](normalizeTimeSeconds(currentTimeSec) * 0x3e8)),
    _0x3f0017 = [_0x33aefa, _0x211a6, normalizeText(sourceKey)]['join'](':');
  return 'story-frame-' + hashText(_0x3f0017) + '-' + _0x5bf13c;
}
export function buildStoryClipFrameMentionId(_0xc4082f = '') {
  const _0x1cacb2 = normalizeText(_0xc4082f);
  return _0x1cacb2 ? '' + STORY_CLIP_FRAME_MENTION_PREFIX + encodeURIComponent(_0x1cacb2) : '';
}
export function getStoryClipFrameIdFromMentionId(_0x2c29f8 = '') {
  const _0x6fb333 = normalizeText(_0x2c29f8);
  if (!_0x6fb333['startsWith'](STORY_CLIP_FRAME_MENTION_PREFIX)) return '';
  try {
    return decodeURIComponent(_0x6fb333['slice'](STORY_CLIP_FRAME_MENTION_PREFIX['length']));
  } catch {
    return '';
  }
}
export function resolveStoryClipFrameImageUrl(_0x3ca293 = {}) {
  if (getStoryClipFrameMediaType(_0x3ca293) === STORY_CLIP_MEDIA_TYPE_VIDEO)
    return (
      [
        _0x3ca293['thumbUrl'],
        _0x3ca293['posterUrl'],
        _0x3ca293['thumbnailUrl'],
        localPathToUrl(_0x3ca293['thumbLocalPath']),
        localPathToUrl(_0x3ca293['posterLocalPath']),
        localPathToUrl(_0x3ca293['thumbnailLocalPath']),
      ]
        ['map'](normalizeText)
        ['find'](Boolean) || ''
    );
  return (
    [
      _0x3ca293['imageUrl'],
      localPathToUrl(_0x3ca293['displayLocalPath']),
      localPathToUrl(_0x3ca293['localPath']),
      localPathToUrl(_0x3ca293['originalLocalPath']),
      localPathToUrl(_0x3ca293['thumbLocalPath']),
    ]
      ['map'](normalizeText)
      ['find'](Boolean) || ''
  );
}
export function getStoryClipFrameMediaType(_0x1a6618 = {}) {
  return normalizeText(_0x1a6618['mediaType'] || _0x1a6618['type'])['toLowerCase']() ===
    STORY_CLIP_MEDIA_TYPE_VIDEO
    ? STORY_CLIP_MEDIA_TYPE_VIDEO
    : STORY_CLIP_MEDIA_TYPE_IMAGE;
}
export function resolveStoryClipFrameMediaUrl(_0x3cabd7 = {}) {
  if (getStoryClipFrameMediaType(_0x3cabd7) === STORY_CLIP_MEDIA_TYPE_VIDEO)
    return (
      [
        _0x3cabd7['videoUrl'],
        localPathToUrl(_0x3cabd7['displayLocalPath']),
        localPathToUrl(_0x3cabd7['localPath']),
        localPathToUrl(_0x3cabd7['originalLocalPath']),
        _0x3cabd7['sourceUrl'],
      ]
        ['map'](normalizeText)
        ['find'](Boolean) || ''
    );
  return resolveStoryClipFrameImageUrl(_0x3cabd7);
}
export function normalizeStoryClipFrame(_0x584804 = {}, _0x192f64 = 0x0) {
  const _0x26d405 = getStoryClipFrameMediaType(_0x584804),
    _0x4aa1bc = normalizeTimeSeconds(_0x584804['currentTimeSec']),
    _0x5f9c7 =
      normalizeText(_0x584804['id']) ||
      buildStoryClipFrameId({
        clipId: _0x584804['clipId'] || 'clip-' + (_0x192f64 + 0x1),
        videoResultIndex: _0x584804['videoResultIndex'],
        sourceKey: _0x584804['sourceKey'] || _0x584804['sourceUrl'],
        currentTimeSec: _0x4aa1bc,
      }),
    _0x220aa5 = normalizeText(_0x584804['clipTitle']) || '片段',
    _0x1cce55 =
      _0x26d405 === STORY_CLIP_MEDIA_TYPE_VIDEO
        ? Math['max'](_0x4aa1bc, normalizeTimeSeconds(_0x584804['endTimeSec']))
        : _0x4aa1bc,
    _0x510e01 =
      normalizeText(_0x584804['name']) ||
      (_0x26d405 === STORY_CLIP_MEDIA_TYPE_VIDEO
        ? _0x220aa5 + ' · ' + formatStoryClipFrameTime(_0x4aa1bc) + '–' + formatStoryClipFrameTime(_0x1cce55)
        : _0x220aa5 + ' · ' + formatStoryClipFrameTime(_0x4aa1bc)),
    _0x26a1a2 = {
      ..._0x584804,
      id: _0x5f9c7,
      name: _0x510e01,
      mediaType: _0x26d405,
      episodeId: normalizeText(_0x584804['episodeId']),
      episodeTitle: normalizeText(_0x584804['episodeTitle']),
      clipId: normalizeText(_0x584804['clipId']),
      clipTitle: _0x220aa5,
      videoResultIndex: normalizeIndex(_0x584804['videoResultIndex']),
      currentTimeSec: _0x4aa1bc,
      endTimeSec: _0x1cce55,
      sourceKey: normalizeText(_0x584804['sourceKey']),
      sourceUrl: normalizeText(_0x584804['sourceUrl']),
      imageUrl: normalizeText(_0x584804['imageUrl']),
      videoUrl: normalizeText(_0x584804['videoUrl']),
      thumbUrl: normalizeText(_0x584804['thumbUrl']),
      posterUrl: normalizeText(_0x584804['posterUrl']),
      localPath: normalizeText(_0x584804['localPath']),
      originalLocalPath: normalizeText(_0x584804['originalLocalPath']),
      displayLocalPath: normalizeText(_0x584804['displayLocalPath']),
      thumbLocalPath: normalizeText(_0x584804['thumbLocalPath']),
      fileName: normalizeText(_0x584804['fileName']),
      width: Math['max'](0x0, Math['trunc'](Number(_0x584804['width'] || _0x584804['originalWidth']) || 0x0)),
      height: Math['max'](
        0x0,
        Math['trunc'](Number(_0x584804['height'] || _0x584804['originalHeight']) || 0x0),
      ),
      createdAt: Math['max'](0x0, Number(_0x584804['createdAt']) || 0x0),
    };
  return (
    (_0x26a1a2['imageUrl'] = resolveStoryClipFrameImageUrl(_0x26a1a2)),
    _0x26d405 === STORY_CLIP_MEDIA_TYPE_VIDEO &&
      (_0x26a1a2['videoUrl'] = resolveStoryClipFrameMediaUrl(_0x26a1a2)),
    _0x26a1a2
  );
}
export function normalizeStoryClipFrames(_0x54e9c7 = []) {
  const _0x4c1d7f = new Map();
  return (
    (Array['isArray'](_0x54e9c7) ? _0x54e9c7 : [])['forEach']((_0x3fdfec, _0x2c67fb) => {
      const _0x1d8a90 = normalizeStoryClipFrame(_0x3fdfec, _0x2c67fb);
      if (!_0x1d8a90['id'] || !resolveStoryClipFrameMediaUrl(_0x1d8a90)) return;
      _0x4c1d7f['set'](_0x1d8a90['id'], _0x1d8a90);
    }),
    Array['from'](_0x4c1d7f['values']())
  );
}
export function createStoryClipFrameRecord({
  saved: saved = {},
  episode: episode = null,
  clip: clip = null,
  videoResultIndex: videoResultIndex = 0x0,
  currentTimeSec: currentTimeSec = 0x0,
  sourceKey: sourceKey = '',
  sourceUrl: sourceUrl = '',
  createdAt: createdAt = Date['now'](),
} = {}) {
  const _0x303a78 = buildStoryClipFrameId({
    clipId: clip?.['id'],
    videoResultIndex: videoResultIndex,
    sourceKey: sourceKey || sourceUrl,
    currentTimeSec: currentTimeSec,
  });
  return normalizeStoryClipFrame({
    id: _0x303a78,
    episodeId: episode?.['id'],
    episodeTitle: episode?.['title'],
    clipId: clip?.['id'],
    clipTitle: clip?.['title'],
    videoResultIndex: videoResultIndex,
    currentTimeSec: currentTimeSec,
    sourceKey: sourceKey,
    sourceUrl: sourceUrl,
    mediaType: STORY_CLIP_MEDIA_TYPE_IMAGE,
    imageUrl: saved['src'] || saved['url'],
    localPath: saved['localPath'],
    originalLocalPath: saved['originalLocalPath'],
    displayLocalPath: saved['displayLocalPath'],
    thumbLocalPath: saved['thumbLocalPath'],
    fileName: saved['fileName'] || saved['filename'],
    width: saved['originalWidth'] || saved['width'],
    height: saved['originalHeight'] || saved['height'],
    createdAt: createdAt,
  });
}
export function createStoryClipVideoRecord({
  saved: saved = {},
  episode: episode = null,
  clip: clip = null,
  videoResultIndex: videoResultIndex = 0x0,
  startTimeSec: startTimeSec = 0x0,
  endTimeSec: endTimeSec = 0x0,
  sourceKey: sourceKey = '',
  sourceUrl: sourceUrl = '',
  createdAt: createdAt = Date['now'](),
} = {}) {
  const _0x4387cf = normalizeTimeSeconds(startTimeSec),
    _0x1a98e4 = Math['max'](_0x4387cf, normalizeTimeSeconds(endTimeSec)),
    _0x3af02f = buildStoryClipFrameId({
      clipId: clip?.['id'],
      videoResultIndex: videoResultIndex,
      sourceKey: sourceKey || sourceUrl,
      currentTimeSec: _0x4387cf,
    }),
    _0xcd50c2 = Math['max'](0x0, Math['round'](_0x1a98e4 * 0x3e8));
  return normalizeStoryClipFrame({
    id: _0x3af02f + '-video-' + _0xcd50c2,
    mediaType: STORY_CLIP_MEDIA_TYPE_VIDEO,
    episodeId: episode?.['id'],
    episodeTitle: episode?.['title'],
    clipId: clip?.['id'],
    clipTitle: clip?.['title'],
    videoResultIndex: videoResultIndex,
    currentTimeSec: _0x4387cf,
    endTimeSec: _0x1a98e4,
    sourceKey: sourceKey,
    sourceUrl: sourceUrl,
    videoUrl: saved['src'] || saved['url'] || saved['videoUrl'],
    localPath: saved['localPath'],
    originalLocalPath: saved['originalLocalPath'] || saved['localPath'],
    displayLocalPath: saved['displayLocalPath'],
    thumbUrl: saved['thumbUrl'],
    posterUrl: saved['posterUrl'],
    thumbLocalPath: saved['thumbLocalPath'],
    posterLocalPath: saved['posterLocalPath'],
    fileName: saved['fileName'] || saved['filename'],
    width: saved['videoWidth'] || saved['originalWidth'] || saved['width'],
    height: saved['videoHeight'] || saved['originalHeight'] || saved['height'],
    videoFps: Math['max'](0x0, Number(saved['videoFps'] || saved['fps']) || 0x0),
    videoDuration: Math['max'](0x0, Number(saved['videoDuration']) || _0x1a98e4 - _0x4387cf),
    createdAt: createdAt,
  });
}
export function upsertStoryClipFrame(_0x57b9c8 = [], _0x455726 = {}) {
  const _0x117294 = normalizeStoryClipFrame(_0x455726);
  if (!_0x117294['id'] || !resolveStoryClipFrameMediaUrl(_0x117294))
    return normalizeStoryClipFrames(_0x57b9c8);
  const _0xd6ef53 = normalizeStoryClipFrames(_0x57b9c8)['filter'](
    (_0x1585f1) => _0x1585f1['id'] !== _0x117294['id'],
  );
  return (
    _0xd6ef53['push'](_0x117294),
    _0xd6ef53['sort'](
      (_0x3e08ef, _0x3cdfd6) => Number(_0x3cdfd6['createdAt']) - Number(_0x3e08ef['createdAt']),
    )
  );
}
export function removeStoryClipFrame(_0x5c8d9d = [], _0x4b5ae7 = '') {
  const _0x117ff1 = normalizeText(_0x4b5ae7),
    _0x4c1c01 = normalizeStoryClipFrames(_0x5c8d9d);
  if (!_0x117ff1) return _0x4c1c01;
  return _0x4c1c01['filter']((_0x92e9ba) => _0x92e9ba['id'] !== _0x117ff1);
}
export function createStoryClipFrameHoverAsset(_0x1433ef = {}, _0x4bb177 = '') {
  const _0x2577e3 = normalizeStoryClipFrame(_0x1433ef),
    _0x31f586 = resolveStoryClipFrameImageUrl(_0x2577e3);
  if (!_0x2577e3['id'] || !_0x31f586) return null;
  const _0x585579 =
    getStoryClipFrameMediaType(_0x2577e3) === STORY_CLIP_MEDIA_TYPE_VIDEO ? '视频片段' : '片段帧';
  return {
    id: normalizeText(_0x4bb177) || buildStoryClipFrameMentionId(_0x2577e3['id']),
    kind: 'clip-frame',
    name: _0x585579,
    hoverTitle: _0x2577e3['name'] || _0x585579,
    imageUrl: _0x31f586,
    isLibraryAsset: !![],
  };
}
export function buildStoryClipFrameMentionCandidates(
  _0x3e38ab = [],
  { query: query = '', clips: clips = [], episodeId: episodeId = '' } = {},
) {
  const _0x1b6674 = normalizeText(query)['replace'](/^@+/, '')['toLowerCase'](),
    _0x3c1de1 = normalizeText(episodeId),
    _0x4f7d14 = (Array['isArray'](clips) ? clips : [])
      ['map']((_0x435f18, _0x16dbad) => ({
        id: normalizeText(_0x435f18?.['id']),
        title: normalizeText(_0x435f18?.['title']),
        index: _0x16dbad,
      }))
      ['filter']((_0x2603cb) => _0x2603cb['id']),
    _0x3d4a80 = new Set(_0x4f7d14['map']((_0x222765) => _0x222765['id'])),
    _0x352ee4 = normalizeStoryClipFrames(_0x3e38ab)['filter']((_0x4d54ab) => {
      if (_0x3c1de1 && _0x4d54ab['episodeId'] && _0x4d54ab['episodeId'] !== _0x3c1de1) return ![];
      if (_0x3d4a80['size'] && _0x4d54ab['clipId'] && !_0x3d4a80['has'](_0x4d54ab['clipId'])) return ![];
      return !![];
    });
  if (!_0x352ee4['length']) {
    if (_0x1b6674 && !'片段帧 视频截帧'['includes'](_0x1b6674)) return [];
    return [
      {
        origin: 'asset',
        menuDirect: !![],
        assetId: STORY_CLIP_FRAME_MENTION_PREFIX + 'empty',
        assetIndex: 0x0,
        type: 'image',
        label: '暂无片段帧',
        subtitle: '在视频预览中截取当前画面',
        assetName: '片段帧',
        assetGroupId: 'story-clip-frames',
        assetGroupSubtitle: '引用从片段视频提取的画面',
        menuPage: 'tools',
        menuGroup: '片段帧',
        menuSection: '',
        suppressBulkMention: !![],
        suppressTooltip: !![],
        limitReason: '请先在片段视频预览中截取当前帧。',
      },
    ];
  }
  const _0x5e8b32 = new Map();
  _0x352ee4['forEach']((_0xb6f949) => {
    const _0x2c0726 = _0xb6f949['clipId'] || '__unassigned__';
    if (!_0x5e8b32['has'](_0x2c0726)) _0x5e8b32['set'](_0x2c0726, []);
    _0x5e8b32['get'](_0x2c0726)['push'](_0xb6f949);
  });
  const _0x209ce9 = [];
  return (
    _0x4f7d14['forEach']((_0x43b7b8) => {
      const _0x38fa69 = _0x5e8b32['get'](_0x43b7b8['id']);
      if (!_0x38fa69?.['length']) return;
      (_0x209ce9['push']({ ..._0x43b7b8, frames: _0x38fa69 }), _0x5e8b32['delete'](_0x43b7b8['id']));
    }),
    _0x5e8b32['forEach']((_0x26f861, _0x123cd2) => {
      _0x209ce9['push']({
        id: _0x123cd2,
        title: normalizeText(_0x26f861[0x0]?.['clipTitle']),
        index: _0x209ce9['length'],
        frames: _0x26f861,
      });
    }),
    _0x209ce9['flatMap']((_0xd5ee28, _0x3f562d) => {
      const _0x5a59ac = Math['max'](0x1, Number(_0xd5ee28['index']) + 0x1 || _0x3f562d + 0x1),
        _0x174728 = '片段' + String(_0x5a59ac)['padStart'](0x2, '0'),
        _0x5e65cc = _0xd5ee28['frames']['map']((_0x19dc9a) => ({
          origin: 'asset',
          menuDirect: !![],
          assetId: buildStoryClipFrameMentionId(_0x19dc9a['id']),
          assetIndex: 0x0,
          type: getStoryClipFrameMediaType(_0x19dc9a),
          label: _0x174728,
          subtitle:
            (normalizeText(_0xd5ee28['title'] || _0x19dc9a['clipTitle']) || '视频提取内容') +
            ' · ' +
            formatStoryClipFrameTime(_0x19dc9a['currentTimeSec']) +
            (getStoryClipFrameMediaType(_0x19dc9a) === STORY_CLIP_MEDIA_TYPE_VIDEO
              ? '–' + formatStoryClipFrameTime(_0x19dc9a['endTimeSec'])
              : ''),
          pillLabel:
            _0x174728 +
            ' · ' +
            formatStoryClipFrameTime(_0x19dc9a['currentTimeSec']) +
            (getStoryClipFrameMediaType(_0x19dc9a) === STORY_CLIP_MEDIA_TYPE_VIDEO
              ? '–' + formatStoryClipFrameTime(_0x19dc9a['endTimeSec'])
              : ''),
          thumbUrl: resolveStoryClipFrameImageUrl(_0x19dc9a),
          iconType: getStoryClipFrameMediaType(_0x19dc9a),
          assetName: '片段帧',
          assetGroupId: 'story-clip-frames',
          assetGroupSubtitle: '引用从片段视频提取的画面',
          menuPage: 'tools',
          menuGroup: '片段帧',
          menuSection: '',
          suppressBulkMention: !![],
          suppressTooltip: !![],
          storyClipFrameId: _0x19dc9a['id'],
          storyClipId: _0x19dc9a['clipId'],
        })),
        _0x36e405 = _0x1b6674
          ? _0x5e65cc['findIndex']((_0xc25daf, _0x5a0c2e) =>
              [
                _0xc25daf['label'],
                _0xc25daf['subtitle'],
                _0xc25daf['pillLabel'],
                _0xd5ee28['frames'][_0x5a0c2e]?.['name'],
                _0xd5ee28['frames'][_0x5a0c2e]?.['episodeTitle'],
                '片段帧',
              ]['some']((_0x348eec) => normalizeText(_0x348eec)['toLowerCase']()['includes'](_0x1b6674)),
            )
          : -0x1;
      if (_0x1b6674 && _0x36e405 < 0x0) return [];
      const _0x41e3b0 = _0x36e405 >= 0x0 ? _0x36e405 : 0x0;
      return [{ ..._0x5e65cc[_0x41e3b0], mentionVariants: _0x5e65cc, mentionVariantIndex: _0x41e3b0 }];
    })
  );
}
export function resolveStoryClipFrameMentionRef(_0x77dcb8, _0x251f30 = []) {
  const _0x40286f = getStoryClipFrameIdFromMentionId(
    _0x77dcb8?.['dataset']?.['assetId'] || _0x77dcb8?.['getAttribute']?.('data-asset-id'),
  );
  if (!_0x40286f) return null;
  const _0x41833c = normalizeStoryClipFrames(_0x251f30)['find']((_0x343a8a) => _0x343a8a['id'] === _0x40286f);
  if (!_0x41833c) return null;
  const _0x9b29cb = getStoryClipFrameMediaType(_0x41833c),
    _0x2a4388 = resolveStoryClipFrameMediaUrl(_0x41833c);
  if (!_0x2a4388) return null;
  const _0x1bd132 = resolveStoryClipFrameImageUrl(_0x41833c) || _0x2a4388;
  return {
    origin: 'asset',
    assetId: buildStoryClipFrameMentionId(_0x41833c['id']),
    storyClipFrameId: _0x41833c['id'],
    itemIndex: 0x0,
    type: _0x9b29cb,
    name: _0x41833c['name'],
    label: _0x41833c['name'],
    url: _0x2a4388,
    thumbUrl: _0x1bd132,
    localPath: _0x41833c['localPath'],
    nodeData: {
      type: _0x9b29cb === STORY_CLIP_MEDIA_TYPE_VIDEO ? 'source-video' : 'source-image',
      name: _0x41833c['name'],
      ...(_0x9b29cb === STORY_CLIP_MEDIA_TYPE_VIDEO
        ? {
            src: _0x2a4388,
            videoUrl: _0x2a4388,
            thumbUrl: resolveStoryClipFrameImageUrl(_0x41833c),
            videoDuration:
              Number(_0x41833c['videoDuration']) ||
              Math['max'](0x0, _0x41833c['endTimeSec'] - _0x41833c['currentTimeSec']),
            videoFps: Number(_0x41833c['videoFps']) || 0x0,
          }
        : { imageUrl: _0x2a4388 }),
      localPath: _0x41833c['localPath'],
      originalLocalPath: _0x41833c['originalLocalPath'],
      displayLocalPath: _0x41833c['displayLocalPath'],
      thumbLocalPath: _0x41833c['thumbLocalPath'],
    },
  };
}
