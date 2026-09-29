import { resolveGenerationInputImageUrl } from '../../services/imageReferenceUrlService.js';
import { appendApimartPrivateAvatarProviderAssetRefs } from '../../modules/apimartPrivateAvatarAssets.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
function normalizePositiveNumber(..._0x5d4b64) {
  for (const _0x155d4d of _0x5d4b64) {
    const _0x17ccbb = Number(_0x155d4d);
    if (Number['isFinite'](_0x17ccbb) && _0x17ccbb > 0x0) return _0x17ccbb;
  }
  return 0x0;
}
function getVideoDurationFromSource(_0x4f96b1 = {}, _0x31c29f = null) {
  return normalizePositiveNumber(
    _0x31c29f?.['videoDuration'],
    _0x31c29f?.['duration'],
    _0x4f96b1?.['videoDuration'],
    _0x4f96b1?.['duration'],
  );
}
function getVideoDurationFromAssetRef(_0x41a3f4 = {}) {
  return normalizePositiveNumber(
    _0x41a3f4?.['videoDuration'],
    _0x41a3f4?.['duration'],
    _0x41a3f4?.['nodeData']?.['videoDuration'],
    _0x41a3f4?.['nodeData']?.['duration'],
  );
}
function getImageSizeBytesFromSource(_0xbeb033 = {}) {
  return normalizePositiveNumber(
    _0xbeb033?.['imageSizeBytes'],
    _0xbeb033?.['imageByteSize'],
    _0xbeb033?.['fileSize'],
    _0xbeb033?.['sizeBytes'],
    _0xbeb033?.['byteSize'],
  );
}
function getImageSizeBytesFromAssetRef(_0x4fcf46 = {}) {
  return normalizePositiveNumber(
    _0x4fcf46?.['imageSizeBytes'],
    _0x4fcf46?.['imageByteSize'],
    _0x4fcf46?.['fileSize'],
    _0x4fcf46?.['sizeBytes'],
    _0x4fcf46?.['byteSize'],
    _0x4fcf46?.['nodeData']?.['imageSizeBytes'],
    _0x4fcf46?.['nodeData']?.['imageByteSize'],
    _0x4fcf46?.['nodeData']?.['fileSize'],
    _0x4fcf46?.['nodeData']?.['sizeBytes'],
    _0x4fcf46?.['nodeData']?.['byteSize'],
  );
}
function getVideoSizeBytesFromSource(_0x88acee = {}, _0x28203e = null) {
  return normalizePositiveNumber(
    _0x28203e?.['videoSizeBytes'],
    _0x28203e?.['videoByteSize'],
    _0x28203e?.['fileSize'],
    _0x28203e?.['sizeBytes'],
    _0x28203e?.['byteSize'],
    _0x88acee?.['videoSizeBytes'],
    _0x88acee?.['videoByteSize'],
    _0x88acee?.['fileSize'],
    _0x88acee?.['sizeBytes'],
    _0x88acee?.['byteSize'],
  );
}
function getVideoSizeBytesFromAssetRef(_0x47ab37 = {}) {
  return normalizePositiveNumber(
    _0x47ab37?.['videoSizeBytes'],
    _0x47ab37?.['videoByteSize'],
    _0x47ab37?.['fileSize'],
    _0x47ab37?.['sizeBytes'],
    _0x47ab37?.['byteSize'],
    _0x47ab37?.['nodeData']?.['videoSizeBytes'],
    _0x47ab37?.['nodeData']?.['videoByteSize'],
    _0x47ab37?.['nodeData']?.['fileSize'],
    _0x47ab37?.['nodeData']?.['sizeBytes'],
    _0x47ab37?.['nodeData']?.['byteSize'],
  );
}
function getAudioDurationFromSource(_0x152990 = {}) {
  return normalizePositiveNumber(_0x152990?.['audioDuration'], _0x152990?.['duration']);
}
function getAudioDurationFromAssetRef(_0x14f1c0 = {}) {
  return normalizePositiveNumber(
    _0x14f1c0?.['audioDuration'],
    _0x14f1c0?.['duration'],
    _0x14f1c0?.['nodeData']?.['audioDuration'],
    _0x14f1c0?.['nodeData']?.['duration'],
  );
}
function getAudioSizeBytesFromSource(_0x37f4c1 = {}) {
  return normalizePositiveNumber(
    _0x37f4c1?.['audioSizeBytes'],
    _0x37f4c1?.['audioByteSize'],
    _0x37f4c1?.['fileSize'],
    _0x37f4c1?.['sizeBytes'],
    _0x37f4c1?.['byteSize'],
  );
}
function getAudioSizeBytesFromAssetRef(_0x43b8f1 = {}) {
  return normalizePositiveNumber(
    _0x43b8f1?.['audioSizeBytes'],
    _0x43b8f1?.['audioByteSize'],
    _0x43b8f1?.['fileSize'],
    _0x43b8f1?.['sizeBytes'],
    _0x43b8f1?.['byteSize'],
    _0x43b8f1?.['nodeData']?.['audioSizeBytes'],
    _0x43b8f1?.['nodeData']?.['audioByteSize'],
    _0x43b8f1?.['nodeData']?.['fileSize'],
    _0x43b8f1?.['nodeData']?.['sizeBytes'],
    _0x43b8f1?.['nodeData']?.['byteSize'],
  );
}
function createMediaAccess(_0x1ac783) {
  const _0x5a54b0 = (_0xdfaa5a) => {
      const _0x1d7170 = String(_0xdfaa5a || '')['trim']();
      if (!_0x1d7170) return '';
      return typeof _0x1ac783 === 'function' ? String(_0x1ac783(_0x1d7170) || '')['trim']() : _0x1d7170;
    },
    _0x1cb11c = (_0x1b9fdd, _0x33b3f8) => {
      const _0x4f4a01 = Array['isArray'](_0x1b9fdd?.['videos']) ? _0x1b9fdd['videos'] : [];
      if (_0x4f4a01['length'] <= 0x0) return null;
      const _0x1d62d4 = String(_0x33b3f8?.['sourceMediaKey'] || '')['trim']();
      if (_0x1d62d4) {
        const _0x353c04 = _0x4f4a01['find']((_0x12d1d2) => {
          const _0x9ebc86 =
            String(_0x12d1d2?.['localPath'] || '')['trim']() ||
            String(_0x12d1d2?.['videoUrl'] || '')['trim']();
          return _0x9ebc86 === _0x1d62d4;
        });
        if (_0x353c04) return _0x353c04;
      }
      const _0x13f06f = Number(_0x1b9fdd?.['mainVideoIndex']),
        _0x26f757 = Number['isFinite'](_0x13f06f) ? Math['max'](0x0, Math['trunc'](_0x13f06f)) : 0x0;
      return _0x4f4a01[Math['min'](_0x26f757, _0x4f4a01['length'] - 0x1)] || null;
    },
    _0x33568c = (_0x5d967b, _0x4c7bf1 = null) => {
      const _0x1813f8 =
          String(_0x5d967b?.['type'] || '') === 'ai-video' ? _0x1cb11c(_0x5d967b, _0x4c7bf1) : null,
        _0x1b0792 = [
          localPathToUrl(String(_0x1813f8?.['localPath'] || '')['trim']()),
          localPathToUrl(String(_0x1813f8?.['displayLocalPath'] || '')['trim']()),
          localPathToUrl(String(_0x1813f8?.['originalLocalPath'] || '')['trim']()),
          _0x1813f8?.['videoUrl'],
          localPathToUrl(String(_0x5d967b?.['localPath'] || '')['trim']()),
          localPathToUrl(String(_0x5d967b?.['displayLocalPath'] || '')['trim']()),
          localPathToUrl(String(_0x5d967b?.['originalLocalPath'] || '')['trim']()),
          localPathToUrl(String(_0x5d967b?.['videoLocalPath'] || '')['trim']()),
          _0x5d967b?.['videoUrl'],
          _0x5d967b?.['src'],
          _0x5d967b?.['url'],
          _0x5d967b?.['resultUrl'],
          _0x5d967b?.['sourceUrl'],
        ];
      for (const _0x3de351 of _0x1b0792) {
        const _0x5a4ef2 = _0x5a54b0(_0x3de351);
        if (_0x5a4ef2) return _0x5a4ef2;
      }
      return '';
    },
    _0x5e2894 = (_0x1814ba) => _0x5a54b0(resolveGenerationInputImageUrl(_0x1814ba)),
    _0x499539 = (_0x57e10e) => {
      const _0x3761f2 = String(
        _0x57e10e?.['mask'] ||
          _0x57e10e?.['maskImageDataUrl'] ||
          _0x57e10e?.['maskImageUrl'] ||
          _0x57e10e?.['maskUrl'] ||
          _0x57e10e?.['maskLocalPath'] ||
          '',
      )['trim']();
      return _0x5a54b0(localPathToUrl(_0x3761f2) || _0x3761f2);
    },
    _0x2c6992 = (_0x46653f) => {
      const _0x52daaa = [
        localPathToUrl(String(_0x46653f?.['localPath'] || '')['trim']()),
        _0x46653f?.['audioUrl'],
        _0x46653f?.['src'],
      ];
      for (const _0x3ba11f of _0x52daaa) {
        const _0x2a6a37 = _0x5a54b0(_0x3ba11f);
        if (_0x2a6a37) return _0x2a6a37;
      }
      return '';
    };
  return {
    getAudioUrl: _0x2c6992,
    getImageUrl: _0x5e2894,
    getMaskImageUrl: _0x499539,
    getVideoUrl: _0x33568c,
    pickAiVideoItem: _0x1cb11c,
  };
}
function appendUnique(_0x4ba2c0, _0xaa49ee) {
  const _0x17935b = String(_0xaa49ee || '')['trim']();
  if (_0x17935b && !_0x4ba2c0['includes'](_0x17935b)) _0x4ba2c0['push'](_0x17935b);
}
function appendUniqueVideo(_0x26bac3, _0x3569a2, _0x9aab59, _0x4eb70b = {}) {
  const _0x428891 = String(_0x9aab59 || '')['trim']();
  if (!_0x428891) return;
  const _0x3ac53a = _0x26bac3['indexOf'](_0x428891),
    _0x269b4f = { ..._0x4eb70b, url: _0x428891 };
  if (_0x3ac53a < 0x0) {
    (_0x26bac3['push'](_0x428891), _0x3569a2['push'](_0x269b4f));
    return;
  }
  const _0x3c9f43 = _0x3569a2[_0x3ac53a] || {};
  !(Number(_0x3c9f43['duration']) > 0x0) &&
    Number(_0x269b4f['duration']) > 0x0 &&
    (_0x3569a2[_0x3ac53a] = { ..._0x3c9f43, ..._0x269b4f });
}
function appendUniqueAudio(_0x163342, _0x22ce1f, _0x266258, _0x59c9e0 = {}) {
  const _0x5f2422 = String(_0x266258 || '')['trim']();
  if (!_0x5f2422) return;
  const _0x48c8b9 = _0x163342['indexOf'](_0x5f2422),
    _0x57ff73 = { ..._0x59c9e0, url: _0x5f2422 };
  if (_0x48c8b9 < 0x0) {
    (_0x163342['push'](_0x5f2422), _0x22ce1f['push'](_0x57ff73));
    return;
  }
  const _0xbef10b = _0x22ce1f[_0x48c8b9] || {};
  _0x22ce1f[_0x48c8b9] = {
    ..._0xbef10b,
    ...Object['fromEntries'](
      Object['entries'](_0x57ff73)['filter'](([, _0x88d09d]) => {
        if (_0x88d09d === '' || _0x88d09d == null) return ![];
        if (Number(_0x88d09d) === 0x0) return ![];
        return !![];
      }),
    ),
  };
}
function appendUniqueImage(_0x14b058, _0x4ee502, _0x10071b, _0x5257cc = {}) {
  appendUniqueAudio(_0x14b058, _0x4ee502, _0x10071b, _0x5257cc);
}
export function resolveVideoSubmitInputMaterials({
  inEdges: inEdges = [],
  nodes: nodes = {},
  assetInputRefs: assetInputRefs = [],
  initialImageUrls: initialImageUrls = [],
  resolveMediaUrl: _0x297cb8,
} = {}) {
  const _0x15e068 = createMediaAccess(_0x297cb8),
    _0x2b0f9c = Array['isArray'](assetInputRefs) ? assetInputRefs : [],
    _0x572c15 = Array['isArray'](inEdges) ? inEdges : [],
    _0x8c6f2d = {
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
  ((Array['isArray'](initialImageUrls) ? initialImageUrls : [])['forEach']((_0x547496) =>
    appendUniqueImage(_0x8c6f2d['images'], _0x8c6f2d['imageEntries'], _0x547496),
  ),
    _0x2b0f9c['filter'](
      (_0x5a0910) =>
        _0x5a0910?.['type'] === 'image' &&
        _0x5a0910?.['url'] &&
        _0x8c6f2d['images']['includes'](String(_0x5a0910['url'])['trim']()),
    )['forEach']((_0x1618b7) => {
      const _0x339ab3 = getImageSizeBytesFromAssetRef(_0x1618b7);
      appendUniqueImage(_0x8c6f2d['images'], _0x8c6f2d['imageEntries'], _0x1618b7['url'], {
        ...(_0x339ab3 > 0x0 ? { sizeBytes: _0x339ab3 } : {}),
        assetRefSource: _0x1618b7['assetRefSource'] || '',
      });
    }),
    _0x2b0f9c['filter']((_0x2cdd98) => _0x2cdd98?.['type'] === 'audio' && _0x2cdd98?.['url'])['forEach'](
      (_0x1fffef) => {
        appendUniqueAudio(_0x8c6f2d['audios'], _0x8c6f2d['audioEntries'], _0x1fffef['url'], {
          duration: getAudioDurationFromAssetRef(_0x1fffef),
          sizeBytes: getAudioSizeBytesFromAssetRef(_0x1fffef),
          assetRefSource: _0x1fffef['assetRefSource'] || '',
        });
      },
    ),
    _0x2b0f9c['filter']((_0x1bcc61) => _0x1bcc61?.['type'] === 'video' && _0x1bcc61?.['url'])['forEach'](
      (_0x5a74fd) => {
        const _0x46a346 = getVideoSizeBytesFromAssetRef(_0x5a74fd);
        (appendUniqueVideo(_0x8c6f2d['videos'], _0x8c6f2d['videoEntries'], _0x5a74fd['url'], {
          duration: getVideoDurationFromAssetRef(_0x5a74fd),
          ...(_0x46a346 > 0x0 ? { sizeBytes: _0x46a346 } : {}),
          assetRefSource: _0x5a74fd['assetRefSource'] || '',
        }),
          _0x8c6f2d['videoRefs']['push']({ refSlot: _0x5a74fd?.['refSlot'] || '', url: _0x5a74fd['url'] }));
      },
    ));
  const _0x12103f = {
    images: _0x2b0f9c['filter']((_0x5bfe9d) => _0x5bfe9d?.['type'] === 'image' && _0x5bfe9d?.['url'])['map'](
      (_0xc13c7a) => _0xc13c7a['url'],
    ),
    videos: _0x2b0f9c['filter']((_0x185943) => _0x185943?.['type'] === 'video' && _0x185943?.['url'])['map'](
      (_0x1171c6) => _0x1171c6['url'],
    ),
    audios: _0x2b0f9c['filter']((_0x4d9465) => _0x4d9465?.['type'] === 'audio' && _0x4d9465?.['url'])['map'](
      (_0x10f0a9) => _0x10f0a9['url'],
    ),
    videoEntries: _0x2b0f9c['filter']((_0x1e56d5) => _0x1e56d5?.['type'] === 'video' && _0x1e56d5?.['url'])[
      'map'
    ]((_0x418eee) => ({ url: _0x418eee['url'], duration: getVideoDurationFromAssetRef(_0x418eee) })),
    audioEntries: _0x2b0f9c['filter']((_0x7f44d3) => _0x7f44d3?.['type'] === 'audio' && _0x7f44d3?.['url'])[
      'map'
    ]((_0x2daa76) => ({ url: _0x2daa76['url'], duration: getAudioDurationFromAssetRef(_0x2daa76) })),
    providerAssetRefs: [],
  };
  for (const _0x1b4468 of _0x572c15) {
    const _0x1e4dac = nodes?.[_0x1b4468?.['sourceId']];
    if (!_0x1e4dac) continue;
    const _0xa0263 = String(_0x1e4dac?.['type'] || '')['toLowerCase']();
    if (_0xa0263['includes']('image')) {
      const _0xd5aba9 = _0x15e068['getImageUrl'](_0x1e4dac),
        _0x309854 = String(
          _0xd5aba9 || _0x1e4dac?.['imageUrl'] || _0x1e4dac?.['src'] || _0x1e4dac?.['url'] || '',
        )['trim'](),
        _0x627e6b = getImageSizeBytesFromSource(_0x1e4dac);
      appendUniqueImage(_0x8c6f2d['images'], _0x8c6f2d['imageEntries'], _0x309854, {
        ...(_0x627e6b > 0x0 ? { sizeBytes: _0x627e6b } : {}),
        edgeId: _0x1b4468?.['id'],
      });
      _0x309854 &&
        (_0x8c6f2d['imageRefs']['push']({ refSlot: _0x1b4468?.['refSlot'] || '', url: _0x309854 }),
        appendApimartPrivateAvatarProviderAssetRefs(_0x8c6f2d['providerAssetRefs'], _0x1e4dac, {
          kind: 'image',
          sourceUrl: _0x309854,
          refSlot: _0x1b4468?.['refSlot'],
          edgeId: _0x1b4468?.['id'],
        }));
      _0xd5aba9 &&
        (_0x12103f['images']['push'](_0xd5aba9),
        appendApimartPrivateAvatarProviderAssetRefs(_0x12103f['providerAssetRefs'], _0x1e4dac, {
          kind: 'image',
          sourceUrl: _0xd5aba9,
          refSlot: _0x1b4468?.['refSlot'],
          edgeId: _0x1b4468?.['id'],
        }));
      continue;
    }
    if (_0xa0263['includes']('video')) {
      const _0x2c964e =
          String(_0x1e4dac?.['type'] || '') === 'ai-video'
            ? _0x15e068['pickAiVideoItem'](_0x1e4dac, _0x1b4468)
            : null,
        _0x4556d0 = _0x15e068['getVideoUrl'](_0x1e4dac, _0x1b4468),
        _0x4825d0 = getVideoSizeBytesFromSource(_0x1e4dac, _0x2c964e),
        _0x637342 = {
          duration: getVideoDurationFromSource(_0x1e4dac, _0x2c964e),
          ...(_0x4825d0 > 0x0 ? { sizeBytes: _0x4825d0 } : {}),
          edgeId: _0x1b4468?.['id'],
        };
      appendUniqueVideo(_0x8c6f2d['videos'], _0x8c6f2d['videoEntries'], _0x4556d0, _0x637342);
      _0x4556d0 &&
        (_0x8c6f2d['videoRefs']['push']({ refSlot: _0x1b4468?.['refSlot'] || '', url: _0x4556d0 }),
        _0x12103f['videos']['push'](_0x4556d0),
        _0x12103f['videoEntries']['push']({ url: _0x4556d0, duration: _0x637342['duration'] }),
        appendApimartPrivateAvatarProviderAssetRefs(_0x8c6f2d['providerAssetRefs'], _0x1e4dac, {
          kind: 'video',
          sourceUrl: _0x4556d0,
          refSlot: _0x1b4468?.['refSlot'],
          edgeId: _0x1b4468?.['id'],
        }),
        appendApimartPrivateAvatarProviderAssetRefs(_0x12103f['providerAssetRefs'], _0x1e4dac, {
          kind: 'video',
          sourceUrl: _0x4556d0,
          refSlot: _0x1b4468?.['refSlot'],
          edgeId: _0x1b4468?.['id'],
        }));
      continue;
    }
    if (_0xa0263['includes']('audio')) {
      const _0x533c32 = _0x15e068['getAudioUrl'](_0x1e4dac),
        _0x11c5d2 = {
          duration: getAudioDurationFromSource(_0x1e4dac),
          sizeBytes: getAudioSizeBytesFromSource(_0x1e4dac),
          edgeId: _0x1b4468?.['id'],
        };
      (appendUniqueAudio(_0x8c6f2d['audios'], _0x8c6f2d['audioEntries'], _0x533c32, _0x11c5d2),
        _0x533c32 &&
          (_0x12103f['audios']['push'](_0x533c32),
          _0x12103f['audioEntries']['push']({ url: _0x533c32, duration: _0x11c5d2['duration'] })));
    }
  }
  return {
    assetVideoCount: _0x2b0f9c['filter'](
      (_0x1e5ef0) => _0x1e5ef0?.['type'] === 'video' && _0x1e5ef0?.['url'],
    )['length'],
    dreamina: _0x12103f,
    helpers: _0x15e068,
    modelApi: _0x8c6f2d,
  };
}
