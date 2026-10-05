import { localPathToUrl } from '../../utils/localMediaPath.js';
export const STORY_CLIP_FRAME_MENTION_PREFIX = 'story-clip-frame:';
export const STORY_CLIP_MEDIA_TYPE_IMAGE = 'image';
export const STORY_CLIP_MEDIA_TYPE_VIDEO = 'video';
function normalizeText(value) {
  return String(value || '')['trim']();
}
function normalizeIndex(item) {
  const count = Math['trunc'](Number(item));
  return Number['isFinite'](count) && count >= 0 ? count : 0;
}
function normalizeTimeSeconds(key) {
  const count2 = Number(key);
  return Number['isFinite'](count2) && count2 >= 0 ? Number(count2['toFixed'](3)) : 0;
}
function hashText(index) {
  let result = 0x811c9dc5;
  for (const data of String(index || '')) {
    ((result ^= data['charCodeAt'](0)), (result = Math['imul'](result, 0x1000193)));
  }
  return (result >>> 0)['toString'](36);
}
export function formatStoryClipFrameTime(options) {
  const timeSeconds = normalizeTimeSeconds(options),
    target = Math['floor'](timeSeconds / 60),
    source = timeSeconds - target * 60;
  return String(target)['padStart'](2, '0') + ':' + source['toFixed'](1)['padStart'](4, '0');
}
export function buildStoryClipFrameId({
  clipId: clipId = '',
  videoResultIndex: videoResultIndex = 0,
  sourceKey: sourceKey = '',
  currentTimeSec: currentTimeSec = 0,
} = {}) {
  const text = normalizeText(clipId) || 'clip',
    index2 = normalizeIndex(videoResultIndex),
    next = Math['max'](0, Math['round'](normalizeTimeSeconds(currentTimeSec) * 1000)),
    current = [text, index2, normalizeText(sourceKey)]['join'](':');
  return 'story-frame-' + hashText(current) + '-' + next;
}
export function buildStoryClipFrameMentionId(entry = '') {
  const text2 = normalizeText(entry);
  return text2 ? '' + STORY_CLIP_FRAME_MENTION_PREFIX + encodeURIComponent(text2) : '';
}
export function getStoryClipFrameIdFromMentionId(record = '') {
  const list = normalizeText(record);
  if (!list['startsWith'](STORY_CLIP_FRAME_MENTION_PREFIX)) return '';
  try {
    return decodeURIComponent(list['slice'](STORY_CLIP_FRAME_MENTION_PREFIX['length']));
  } catch {
    return '';
  }
}
export function resolveStoryClipFrameImageUrl(options2 = {}) {
  if (getStoryClipFrameMediaType(options2) === STORY_CLIP_MEDIA_TYPE_VIDEO)
    return (
      [
        options2['thumbUrl'],
        options2['posterUrl'],
        options2['thumbnailUrl'],
        localPathToUrl(options2['thumbLocalPath']),
        localPathToUrl(options2['posterLocalPath']),
        localPathToUrl(options2['thumbnailLocalPath']),
      ]
        ['map'](normalizeText)
        ['find'](Boolean) || ''
    );
  return (
    [
      options2['imageUrl'],
      localPathToUrl(options2['displayLocalPath']),
      localPathToUrl(options2['localPath']),
      localPathToUrl(options2['originalLocalPath']),
      localPathToUrl(options2['thumbLocalPath']),
    ]
      ['map'](normalizeText)
      ['find'](Boolean) || ''
  );
}
export function getStoryClipFrameMediaType(options3 = {}) {
  return normalizeText(options3['mediaType'] || options3['type'])['toLowerCase']() ===
    STORY_CLIP_MEDIA_TYPE_VIDEO
    ? STORY_CLIP_MEDIA_TYPE_VIDEO
    : STORY_CLIP_MEDIA_TYPE_IMAGE;
}
export function resolveStoryClipFrameMediaUrl(options4 = {}) {
  if (getStoryClipFrameMediaType(options4) === STORY_CLIP_MEDIA_TYPE_VIDEO)
    return (
      [
        options4['videoUrl'],
        localPathToUrl(options4['displayLocalPath']),
        localPathToUrl(options4['localPath']),
        localPathToUrl(options4['originalLocalPath']),
        options4['sourceUrl'],
      ]
        ['map'](normalizeText)
        ['find'](Boolean) || ''
    );
  return resolveStoryClipFrameImageUrl(options4);
}
export function normalizeStoryClipFrame(clipId2 = {}, payload = 0) {
  const mediaType = getStoryClipFrameMediaType(clipId2),
    currentTimeSec2 = normalizeTimeSeconds(clipId2['currentTimeSec']),
    id =
      normalizeText(clipId2['id']) ||
      buildStoryClipFrameId({
        clipId: clipId2['clipId'] || 'clip-' + (payload + 1),
        videoResultIndex: clipId2['videoResultIndex'],
        sourceKey: clipId2['sourceKey'] || clipId2['sourceUrl'],
        currentTimeSec: currentTimeSec2,
      }),
    clipTitle = normalizeText(clipId2['clipTitle']) || '片段',
    endTimeSec2 =
      mediaType === STORY_CLIP_MEDIA_TYPE_VIDEO
        ? Math['max'](currentTimeSec2, normalizeTimeSeconds(clipId2['endTimeSec']))
        : currentTimeSec2,
    name =
      normalizeText(clipId2['name']) ||
      (mediaType === STORY_CLIP_MEDIA_TYPE_VIDEO
        ? clipTitle +
          ' · ' +
          formatStoryClipFrameTime(currentTimeSec2) +
          '–' +
          formatStoryClipFrameTime(endTimeSec2)
        : clipTitle + ' · ' + formatStoryClipFrameTime(currentTimeSec2)),
    handle = {
      ...clipId2,
      id: id,
      name: name,
      mediaType: mediaType,
      episodeId: normalizeText(clipId2['episodeId']),
      episodeTitle: normalizeText(clipId2['episodeTitle']),
      clipId: normalizeText(clipId2['clipId']),
      clipTitle: clipTitle,
      videoResultIndex: normalizeIndex(clipId2['videoResultIndex']),
      currentTimeSec: currentTimeSec2,
      endTimeSec: endTimeSec2,
      sourceKey: normalizeText(clipId2['sourceKey']),
      sourceUrl: normalizeText(clipId2['sourceUrl']),
      imageUrl: normalizeText(clipId2['imageUrl']),
      videoUrl: normalizeText(clipId2['videoUrl']),
      thumbUrl: normalizeText(clipId2['thumbUrl']),
      posterUrl: normalizeText(clipId2['posterUrl']),
      localPath: normalizeText(clipId2['localPath']),
      originalLocalPath: normalizeText(clipId2['originalLocalPath']),
      displayLocalPath: normalizeText(clipId2['displayLocalPath']),
      thumbLocalPath: normalizeText(clipId2['thumbLocalPath']),
      fileName: normalizeText(clipId2['fileName']),
      width: Math['max'](0, Math['trunc'](Number(clipId2['width'] || clipId2['originalWidth']) || 0)),
      height: Math['max'](0, Math['trunc'](Number(clipId2['height'] || clipId2['originalHeight']) || 0)),
      createdAt: Math['max'](0, Number(clipId2['createdAt']) || 0),
    };
  return (
    (handle['imageUrl'] = resolveStoryClipFrameImageUrl(handle)),
    mediaType === STORY_CLIP_MEDIA_TYPE_VIDEO && (handle['videoUrl'] = resolveStoryClipFrameMediaUrl(handle)),
    handle
  );
}
export function normalizeStoryClipFrames(list2 = []) {
  const map = new Map();
  return (
    (Array['isArray'](list2) ? list2 : [])['forEach']((state, config) => {
      const storyClipFrame = normalizeStoryClipFrame(state, config);
      if (!storyClipFrame['id'] || !resolveStoryClipFrameMediaUrl(storyClipFrame)) return;
      map['set'](storyClipFrame['id'], storyClipFrame);
    }),
    Array['from'](map['values']())
  );
}
export function createStoryClipFrameRecord({
  saved: saved = {},
  episode: episode = null,
  clip: clip = null,
  videoResultIndex: videoResultIndex = 0,
  currentTimeSec: currentTimeSec = 0,
  sourceKey: sourceKey = '',
  sourceUrl: sourceUrl = '',
  createdAt: createdAt = Date['now'](),
} = {}) {
  const id2 = buildStoryClipFrameId({
    clipId: clip?.['id'],
    videoResultIndex: videoResultIndex,
    sourceKey: sourceKey || sourceUrl,
    currentTimeSec: currentTimeSec,
  });
  return normalizeStoryClipFrame({
    id: id2,
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
  videoResultIndex: videoResultIndex = 0,
  startTimeSec: startTimeSec = 0,
  endTimeSec: endTimeSec = 0,
  sourceKey: sourceKey = '',
  sourceUrl: sourceUrl = '',
  createdAt: createdAt = Date['now'](),
} = {}) {
  const currentTimeSec3 = normalizeTimeSeconds(startTimeSec),
    endTimeSec3 = Math['max'](currentTimeSec3, normalizeTimeSeconds(endTimeSec)),
    id3 = buildStoryClipFrameId({
      clipId: clip?.['id'],
      videoResultIndex: videoResultIndex,
      sourceKey: sourceKey || sourceUrl,
      currentTimeSec: currentTimeSec3,
    }),
    scope = Math['max'](0, Math['round'](endTimeSec3 * 1000));
  return normalizeStoryClipFrame({
    id: id3 + '-video-' + scope,
    mediaType: STORY_CLIP_MEDIA_TYPE_VIDEO,
    episodeId: episode?.['id'],
    episodeTitle: episode?.['title'],
    clipId: clip?.['id'],
    clipTitle: clip?.['title'],
    videoResultIndex: videoResultIndex,
    currentTimeSec: currentTimeSec3,
    endTimeSec: endTimeSec3,
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
    videoFps: Math['max'](0, Number(saved['videoFps'] || saved['fps']) || 0),
    videoDuration: Math['max'](0, Number(saved['videoDuration']) || endTimeSec3 - currentTimeSec3),
    createdAt: createdAt,
  });
}
export function upsertStoryClipFrame(list3 = [], input = {}) {
  const storyClipFrame2 = normalizeStoryClipFrame(input);
  if (!storyClipFrame2['id'] || !resolveStoryClipFrameMediaUrl(storyClipFrame2))
    return normalizeStoryClipFrames(list3);
  const list4 = normalizeStoryClipFrames(list3)['filter']((output) => output['id'] !== storyClipFrame2['id']);
  return (
    list4['push'](storyClipFrame2),
    list4['sort']((value2, value3) => Number(value3['createdAt']) - Number(value2['createdAt']))
  );
}
export function removeStoryClipFrame(list5 = [], value4 = '') {
  const text3 = normalizeText(value4),
    list6 = normalizeStoryClipFrames(list5);
  if (!text3) return list6;
  return list6['filter']((value5) => value5['id'] !== text3);
}
export function createStoryClipFrameHoverAsset(options5 = {}, value6 = '') {
  const hoverTitle = normalizeStoryClipFrame(options5),
    imageUrl = resolveStoryClipFrameImageUrl(hoverTitle);
  if (!hoverTitle['id'] || !imageUrl) return null;
  const name2 =
    getStoryClipFrameMediaType(hoverTitle) === STORY_CLIP_MEDIA_TYPE_VIDEO ? '视频片段' : '片段帧';
  return {
    id: normalizeText(value6) || buildStoryClipFrameMentionId(hoverTitle['id']),
    kind: 'clip-frame',
    name: name2,
    hoverTitle: hoverTitle['name'] || name2,
    imageUrl: imageUrl,
    isLibraryAsset: !![],
  };
}
export function buildStoryClipFrameMentionCandidates(
  list7 = [],
  { query: query = '', clips: clips = [], episodeId: episodeId = '' } = {},
) {
  const text4 = normalizeText(query)['replace'](/^@+/, '')['toLowerCase'](),
    text5 = normalizeText(episodeId),
    list8 = (Array['isArray'](clips) ? clips : [])
      ['map']((value7, index3) => ({
        id: normalizeText(value7?.['id']),
        title: normalizeText(value7?.['title']),
        index: index3,
      }))
      ['filter']((value8) => value8['id']),
    map2 = new Set(list8['map']((value9) => value9['id'])),
    list9 = normalizeStoryClipFrames(list7)['filter']((value10) => {
      if (text5 && value10['episodeId'] && value10['episodeId'] !== text5) return ![];
      if (map2['size'] && value10['clipId'] && !map2['has'](value10['clipId'])) return ![];
      return !![];
    });
  if (!list9['length']) {
    if (text4 && !'片段帧 视频截帧'['includes'](text4)) return [];
    return [
      {
        origin: 'asset',
        menuDirect: !![],
        assetId: STORY_CLIP_FRAME_MENTION_PREFIX + 'empty',
        assetIndex: 0,
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
  const map3 = new Map();
  list9['forEach']((value11) => {
    const value12 = value11['clipId'] || '__unassigned__';
    if (!map3['has'](value12)) map3['set'](value12, []);
    map3['get'](value12)['push'](value11);
  });
  const index4 = [];
  return (
    list8['forEach']((args) => {
      const frames = map3['get'](args['id']);
      if (!frames?.['length']) return;
      (index4['push']({ ...args, frames: frames }), map3['delete'](args['id']));
    }),
    map3['forEach']((frames2, id4) => {
      index4['push']({
        id: id4,
        title: normalizeText(frames2[0]?.['clipTitle']),
        index: index4['length'],
        frames: frames2,
      });
    }),
    index4['flatMap']((value13, value14) => {
      const value15 = Math['max'](1, Number(value13['index']) + 1 || value14 + 1),
        label = '片段' + String(value15)['padStart'](2, '0'),
        mentionVariants = value13['frames']['map']((storyClipFrameId) => ({
          origin: 'asset',
          menuDirect: !![],
          assetId: buildStoryClipFrameMentionId(storyClipFrameId['id']),
          assetIndex: 0,
          type: getStoryClipFrameMediaType(storyClipFrameId),
          label: label,
          subtitle:
            (normalizeText(value13['title'] || storyClipFrameId['clipTitle']) || '视频提取内容') +
            ' · ' +
            formatStoryClipFrameTime(storyClipFrameId['currentTimeSec']) +
            (getStoryClipFrameMediaType(storyClipFrameId) === STORY_CLIP_MEDIA_TYPE_VIDEO
              ? '–' + formatStoryClipFrameTime(storyClipFrameId['endTimeSec'])
              : ''),
          pillLabel:
            label +
            ' · ' +
            formatStoryClipFrameTime(storyClipFrameId['currentTimeSec']) +
            (getStoryClipFrameMediaType(storyClipFrameId) === STORY_CLIP_MEDIA_TYPE_VIDEO
              ? '–' + formatStoryClipFrameTime(storyClipFrameId['endTimeSec'])
              : ''),
          thumbUrl: resolveStoryClipFrameImageUrl(storyClipFrameId),
          iconType: getStoryClipFrameMediaType(storyClipFrameId),
          assetName: '片段帧',
          assetGroupId: 'story-clip-frames',
          assetGroupSubtitle: '引用从片段视频提取的画面',
          menuPage: 'tools',
          menuGroup: '片段帧',
          menuSection: '',
          suppressBulkMention: !![],
          suppressTooltip: !![],
          storyClipFrameId: storyClipFrameId['id'],
          storyClipId: storyClipFrameId['clipId'],
        })),
        count3 = text4
          ? mentionVariants['findIndex']((value16, value17) =>
              [
                value16['label'],
                value16['subtitle'],
                value16['pillLabel'],
                value13['frames'][value17]?.['name'],
                value13['frames'][value17]?.['episodeTitle'],
                '片段帧',
              ]['some']((value18) => normalizeText(value18)['toLowerCase']()['includes'](text4)),
            )
          : -1;
      if (text4 && count3 < 0) return [];
      const mentionVariantIndex = count3 >= 0 ? count3 : 0;
      return [
        {
          ...mentionVariants[mentionVariantIndex],
          mentionVariants: mentionVariants,
          mentionVariantIndex: mentionVariantIndex,
        },
      ];
    })
  );
}
export function resolveStoryClipFrameMentionRef(el, value19 = []) {
  const storyClipFrameIdFromMentionId = getStoryClipFrameIdFromMentionId(
    el?.['dataset']?.['assetId'] || el?.['getAttribute']?.('data-asset-id'),
  );
  if (!storyClipFrameIdFromMentionId) return null;
  const storyClipFrameId2 = normalizeStoryClipFrames(value19)['find'](
    (value20) => value20['id'] === storyClipFrameIdFromMentionId,
  );
  if (!storyClipFrameId2) return null;
  const type = getStoryClipFrameMediaType(storyClipFrameId2),
    url = resolveStoryClipFrameMediaUrl(storyClipFrameId2);
  if (!url) return null;
  const thumbUrl = resolveStoryClipFrameImageUrl(storyClipFrameId2) || url;
  return {
    origin: 'asset',
    assetId: buildStoryClipFrameMentionId(storyClipFrameId2['id']),
    storyClipFrameId: storyClipFrameId2['id'],
    itemIndex: 0,
    type: type,
    name: storyClipFrameId2['name'],
    label: storyClipFrameId2['name'],
    url: url,
    thumbUrl: thumbUrl,
    localPath: storyClipFrameId2['localPath'],
    nodeData: {
      type: type === STORY_CLIP_MEDIA_TYPE_VIDEO ? 'source-video' : 'source-image',
      name: storyClipFrameId2['name'],
      ...(type === STORY_CLIP_MEDIA_TYPE_VIDEO
        ? {
            src: url,
            videoUrl: url,
            thumbUrl: resolveStoryClipFrameImageUrl(storyClipFrameId2),
            videoDuration:
              Number(storyClipFrameId2['videoDuration']) ||
              Math['max'](0, storyClipFrameId2['endTimeSec'] - storyClipFrameId2['currentTimeSec']),
            videoFps: Number(storyClipFrameId2['videoFps']) || 0,
          }
        : { imageUrl: url }),
      localPath: storyClipFrameId2['localPath'],
      originalLocalPath: storyClipFrameId2['originalLocalPath'],
      displayLocalPath: storyClipFrameId2['displayLocalPath'],
      thumbLocalPath: storyClipFrameId2['thumbLocalPath'],
    },
  };
}
