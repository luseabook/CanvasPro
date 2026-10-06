import { resolveGenerationInputImageUrl } from '../../services/imageReferenceUrlService.js';
import { appendApimartPrivateAvatarProviderAssetRefs } from '../../modules/apimartPrivateAvatarAssets.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
function normalizePositiveNumber(...args) {
  for (const value of args) {
    const count = Number(value);
    if (Number.isFinite(count) && count > 0) return count;
  }
  return 0;
}
function getVideoDurationFromSource(options = {}, item = null) {
  return normalizePositiveNumber(
    item?.videoDuration,
    item?.duration,
    options?.videoDuration,
    options?.duration,
  );
}
function getVideoDurationFromAssetRef(options2 = {}) {
  return normalizePositiveNumber(
    options2?.videoDuration,
    options2?.duration,
    options2?.nodeData?.videoDuration,
    options2?.nodeData?.duration,
  );
}
function getImageSizeBytesFromSource(options3 = {}) {
  return normalizePositiveNumber(
    options3?.imageSizeBytes,
    options3?.imageByteSize,
    options3?.fileSize,
    options3?.sizeBytes,
    options3?.byteSize,
  );
}
function getImageSizeBytesFromAssetRef(options4 = {}) {
  return normalizePositiveNumber(
    options4?.imageSizeBytes,
    options4?.imageByteSize,
    options4?.fileSize,
    options4?.sizeBytes,
    options4?.byteSize,
    options4?.nodeData?.imageSizeBytes,
    options4?.nodeData?.imageByteSize,
    options4?.nodeData?.fileSize,
    options4?.nodeData?.sizeBytes,
    options4?.nodeData?.byteSize,
  );
}
function getVideoSizeBytesFromSource(options5 = {}, key = null) {
  return normalizePositiveNumber(
    key?.videoSizeBytes,
    key?.videoByteSize,
    key?.fileSize,
    key?.sizeBytes,
    key?.byteSize,
    options5?.videoSizeBytes,
    options5?.videoByteSize,
    options5?.fileSize,
    options5?.sizeBytes,
    options5?.byteSize,
  );
}
function getVideoSizeBytesFromAssetRef(options6 = {}) {
  return normalizePositiveNumber(
    options6?.videoSizeBytes,
    options6?.videoByteSize,
    options6?.fileSize,
    options6?.sizeBytes,
    options6?.byteSize,
    options6?.nodeData?.videoSizeBytes,
    options6?.nodeData?.videoByteSize,
    options6?.nodeData?.fileSize,
    options6?.nodeData?.sizeBytes,
    options6?.nodeData?.byteSize,
  );
}
function getAudioDurationFromSource(options7 = {}) {
  return normalizePositiveNumber(options7?.audioDuration, options7?.duration);
}
function getAudioDurationFromAssetRef(options8 = {}) {
  return normalizePositiveNumber(
    options8?.audioDuration,
    options8?.duration,
    options8?.nodeData?.audioDuration,
    options8?.nodeData?.duration,
  );
}
function getAudioSizeBytesFromSource(options9 = {}) {
  return normalizePositiveNumber(
    options9?.audioSizeBytes,
    options9?.audioByteSize,
    options9?.fileSize,
    options9?.sizeBytes,
    options9?.byteSize,
  );
}
function getAudioSizeBytesFromAssetRef(options10 = {}) {
  return normalizePositiveNumber(
    options10?.audioSizeBytes,
    options10?.audioByteSize,
    options10?.fileSize,
    options10?.sizeBytes,
    options10?.byteSize,
    options10?.nodeData?.audioSizeBytes,
    options10?.nodeData?.audioByteSize,
    options10?.nodeData?.fileSize,
    options10?.nodeData?.sizeBytes,
    options10?.nodeData?.byteSize,
  );
}
function createMediaAccess(handler) {
  const run = (index) => {
      const enabled = String(index || '').trim();
      if (!enabled) return '';
      return typeof handler === 'function' ? String(handler(enabled) || '').trim() : enabled;
    },
    pickAiVideoItem = (result, data) => {
      const list = Array.isArray(result?.videos) ? result.videos : [];
      if (list.length <= 0) return null;
      const target = String(data?.sourceMediaKey || '').trim();
      if (target) {
        const source = list.find((next) => {
          const current =
            String(next?.localPath || '').trim() || String(next?.videoUrl || '').trim();
          return current === target;
        });
        if (source) return source;
      }
      const entry = Number(result?.mainVideoIndex),
        record = Number.isFinite(entry) ? Math.max(0, Math.trunc(entry)) : 0;
      return list[Math.min(record, list.length - 1)] || null;
    },
    getVideoUrl = (response, payload = null) => {
      const handle =
          String(response?.type || '') === 'ai-video' ? pickAiVideoItem(response, payload) : null,
        state = [
          localPathToUrl(String(handle?.localPath || '').trim()),
          localPathToUrl(String(handle?.displayLocalPath || '').trim()),
          localPathToUrl(String(handle?.originalLocalPath || '').trim()),
          handle?.videoUrl,
          localPathToUrl(String(response?.localPath || '').trim()),
          localPathToUrl(String(response?.displayLocalPath || '').trim()),
          localPathToUrl(String(response?.originalLocalPath || '').trim()),
          localPathToUrl(String(response?.videoLocalPath || '').trim()),
          response?.videoUrl,
          response?.src,
          response?.url,
          response?.resultUrl,
          response?.sourceUrl,
        ];
      for (const config of state) {
        const scope = run(config);
        if (scope) return scope;
      }
      return '';
    },
    getImageUrl = (input) => run(resolveGenerationInputImageUrl(input)),
    getMaskImageUrl = (output) => {
      const value2 = String(
        output?.mask ||
          output?.maskImageDataUrl ||
          output?.maskImageUrl ||
          output?.maskUrl ||
          output?.maskLocalPath ||
          '',
      ).trim();
      return run(localPathToUrl(value2) || value2);
    },
    getAudioUrl = (value3) => {
      const value4 = [
        localPathToUrl(String(value3?.localPath || '').trim()),
        value3?.audioUrl,
        value3?.src,
      ];
      for (const value5 of value4) {
        const value6 = run(value5);
        if (value6) return value6;
      }
      return '';
    };
  return {
    getAudioUrl: getAudioUrl,
    getImageUrl: getImageUrl,
    getMaskImageUrl: getMaskImageUrl,
    getVideoUrl: getVideoUrl,
    pickAiVideoItem: pickAiVideoItem,
  };
}
function appendUnique(list2, value7) {
  const value8 = String(value7 || '').trim();
  if (value8 && !list2.includes(value8)) list2.push(value8);
}
function appendUniqueVideo(list3, list4, value9, args2 = {}) {
  const url = String(value9 || '').trim();
  if (!url) return;
  const count2 = list3.indexOf(url),
    args3 = { ...args2, url: url };
  if (count2 < 0) {
    (list3.push(url), list4.push(args3));
    return;
  }
  const args4 = list4[count2] || {};
  !(Number(args4.duration) > 0) &&
    Number(args3.duration) > 0 &&
    (list4[count2] = { ...args4, ...args3 });
}
function appendUniqueAudio(list5, list6, value10, args5 = {}) {
  const url2 = String(value10 || '').trim();
  if (!url2) return;
  const count3 = list5.indexOf(url2),
    value11 = { ...args5, url: url2 };
  if (count3 < 0) {
    (list5.push(url2), list6.push(value11));
    return;
  }
  const args6 = list6[count3] || {};
  list6[count3] = {
    ...args6,
    ...Object.fromEntries(
      Object.entries(value11).filter(([, value12]) => {
        if (value12 === '' || value12 == null) return false;
        if (Number(value12) === 0) return false;
        return true;
      }),
    ),
  };
}
function appendUniqueImage(value13, value14, value15, value16 = {}) {
  appendUniqueAudio(value13, value14, value15, value16);
}
export function resolveVideoSubmitInputMaterials({
  inEdges: inEdges = [],
  nodes: nodes = {},
  assetInputRefs: assetInputRefs = [],
  initialImageUrls: initialImageUrls = [],
  resolveMediaUrl: resolveMediaUrl,
} = {}) {
  const helpers = createMediaAccess(resolveMediaUrl),
    images = Array.isArray(assetInputRefs) ? assetInputRefs : [],
    value17 = Array.isArray(inEdges) ? inEdges : [],
    modelApi = {
      images: [],
      imageRefs: [],
      imageEntries: [],
      videos: [],
      videoRefs: [],
      videoEntries: [],
      audios: [],
      audioEntries: [],
      providerAssetRefs: [],
    };
  ((Array.isArray(initialImageUrls) ? initialImageUrls : []).forEach((value18) =>
    appendUniqueImage(modelApi.images, modelApi.imageEntries, value18),
  ),
    images.filter(
      (response2) =>
        response2?.type === 'image' &&
        response2?.url &&
        modelApi.images.includes(String(response2.url).trim()),
    ).forEach((assetRefSource) => {
      const sizeBytes = getImageSizeBytesFromAssetRef(assetRefSource);
      appendUniqueImage(modelApi.images, modelApi.imageEntries, assetRefSource.url, {
        ...(sizeBytes > 0 ? { sizeBytes: sizeBytes } : {}),
        assetRefSource: assetRefSource.assetRefSource || '',
      });
    }),
    images.filter((response3) => response3?.type === 'audio' && response3?.url).forEach(
      (assetRefSource2) => {
        appendUniqueAudio(modelApi.audios, modelApi.audioEntries, assetRefSource2.url, {
          duration: getAudioDurationFromAssetRef(assetRefSource2),
          sizeBytes: getAudioSizeBytesFromAssetRef(assetRefSource2),
          assetRefSource: assetRefSource2.assetRefSource || '',
        });
      },
    ),
    images.filter((response4) => response4?.type === 'video' && response4?.url).forEach(
      (assetRefSource3) => {
        const sizeBytes2 = getVideoSizeBytesFromAssetRef(assetRefSource3);
        (appendUniqueVideo(modelApi.videos, modelApi.videoEntries, assetRefSource3.url, {
          duration: getVideoDurationFromAssetRef(assetRefSource3),
          ...(sizeBytes2 > 0 ? { sizeBytes: sizeBytes2 } : {}),
          assetRefSource: assetRefSource3.assetRefSource || '',
        }),
          modelApi.videoRefs.push({
            refSlot: assetRefSource3?.refSlot || '',
            url: assetRefSource3.url,
          }));
      },
    ));
  const dreamina = {
    images: images.filter((response5) => response5?.type === 'image' && response5?.url).map(
      (response6) => response6.url,
    ),
    videos: images.filter((response7) => response7?.type === 'video' && response7?.url).map(
      (response8) => response8.url,
    ),
    audios: images.filter((response9) => response9?.type === 'audio' && response9?.url).map(
      (response10) => response10.url,
    ),
    videoEntries: images.filter((response11) => response11?.type === 'video' && response11?.url).map((url3) => ({ url: url3.url, duration: getVideoDurationFromAssetRef(url3) })),
    audioEntries: images.filter((response12) => response12?.type === 'audio' && response12?.url).map((url4) => ({ url: url4.url, duration: getAudioDurationFromAssetRef(url4) })),
    providerAssetRefs: [],
  };
  for (const edgeId of value17) {
    const response13 = nodes?.[edgeId?.sourceId];
    if (!response13) continue;
    const list7 = String(response13?.type || '').toLowerCase();
    if (list7.includes('image')) {
      const sourceUrl = helpers.getImageUrl(response13),
        url5 = String(
          sourceUrl || response13?.imageUrl || response13?.src || response13?.url || '',
        ).trim(),
        sizeBytes3 = getImageSizeBytesFromSource(response13);
      appendUniqueImage(modelApi.images, modelApi.imageEntries, url5, {
        ...(sizeBytes3 > 0 ? { sizeBytes: sizeBytes3 } : {}),
        edgeId: edgeId?.id,
      });
      url5 &&
        (modelApi.imageRefs.push({ refSlot: edgeId?.refSlot || '', url: url5 }),
        appendApimartPrivateAvatarProviderAssetRefs(modelApi.providerAssetRefs, response13, {
          kind: 'image',
          sourceUrl: url5,
          refSlot: edgeId?.refSlot,
          edgeId: edgeId?.id,
        }));
      sourceUrl &&
        (dreamina.images.push(sourceUrl),
        appendApimartPrivateAvatarProviderAssetRefs(dreamina.providerAssetRefs, response13, {
          kind: 'image',
          sourceUrl: sourceUrl,
          refSlot: edgeId?.refSlot,
          edgeId: edgeId?.id,
        }));
      continue;
    }
    if (list7.includes('video')) {
      const value19 =
          String(response13?.type || '') === 'ai-video'
            ? helpers.pickAiVideoItem(response13, edgeId)
            : null,
        url6 = helpers.getVideoUrl(response13, edgeId),
        sizeBytes4 = getVideoSizeBytesFromSource(response13, value19),
        duration = {
          duration: getVideoDurationFromSource(response13, value19),
          ...(sizeBytes4 > 0 ? { sizeBytes: sizeBytes4 } : {}),
          edgeId: edgeId?.id,
        };
      appendUniqueVideo(modelApi.videos, modelApi.videoEntries, url6, duration);
      url6 &&
        (modelApi.videoRefs.push({ refSlot: edgeId?.refSlot || '', url: url6 }),
        dreamina.videos.push(url6),
        dreamina.videoEntries.push({ url: url6, duration: duration.duration }),
        appendApimartPrivateAvatarProviderAssetRefs(modelApi.providerAssetRefs, response13, {
          kind: 'video',
          sourceUrl: url6,
          refSlot: edgeId?.refSlot,
          edgeId: edgeId?.id,
        }),
        appendApimartPrivateAvatarProviderAssetRefs(dreamina.providerAssetRefs, response13, {
          kind: 'video',
          sourceUrl: url6,
          refSlot: edgeId?.refSlot,
          edgeId: edgeId?.id,
        }));
      continue;
    }
    if (list7.includes('audio')) {
      const url7 = helpers.getAudioUrl(response13),
        duration2 = {
          duration: getAudioDurationFromSource(response13),
          sizeBytes: getAudioSizeBytesFromSource(response13),
          edgeId: edgeId?.id,
        };
      (appendUniqueAudio(modelApi.audios, modelApi.audioEntries, url7, duration2),
        url7 &&
          (dreamina.audios.push(url7),
          dreamina.audioEntries.push({ url: url7, duration: duration2.duration })));
    }
  }
  return {
    assetVideoCount: images.filter(
      (response14) => response14?.type === 'video' && response14?.url,
    ).length,
    dreamina: dreamina,
    helpers: helpers,
    modelApi: modelApi,
  };
}
