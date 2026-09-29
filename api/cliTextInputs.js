const UNSUPPORTED_MEDIA =
    /\.(?:mp4|mov|m4v|webm|mkv|avi|mpeg|mpg|3gp|mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/i,
  IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
function urls(_0x4a881f) {
  return Array['isArray'](_0x4a881f)
    ? _0x4a881f['map']((_0x64fd47) => String(_0x64fd47 || '')['trim']())['filter'](Boolean)
    : [];
}
export async function prepareCliTextImageInputs(_0x1c6bde, _0x374937) {
  const _0x90d0e7 = [...new Set([...urls(_0x1c6bde['inputImageUrls']), ...urls(_0x1c6bde['inputUrls'])])];
  if (
    urls(_0x1c6bde['inputVideoUrls'])['length'] ||
    urls(_0x1c6bde['inputAudioUrls'])['length'] ||
    _0x90d0e7['some'](
      (_0x1027b0) => UNSUPPORTED_MEDIA['test'](_0x1027b0) || /^data:(?:video|audio)\//i['test'](_0x1027b0),
    )
  )
    throw new Error('CLI 文本模型不支持视频或音频参考，请仅使用文本和图片');
  const _0x26356b = _0x374937['inputSlots']['maxByKind']['image'];
  if (_0x90d0e7['length'] > _0x26356b)
    throw new Error(
      'OpenAI CLI 最多支持 ' + _0x26356b + '\x20张参考图，当前共\x20' + _0x90d0e7['length'] + '\x20张',
    );
  return Promise['all'](
    _0x90d0e7['map'](async (_0x514338) => {
      if (!_0x514338['startsWith']('blob:')) return _0x514338;
      const _0x395416 = await fetch(_0x514338, { signal: _0x1c6bde['signal'] });
      if (!_0x395416['ok']) throw new Error('CLI 图片读取失败');
      const _0x2365d8 = await _0x395416['blob']();
      if (!IMAGE_TYPES['has'](_0x2365d8['type']) || _0x2365d8['size'] > 0x14 * 0x400 * 0x400)
        throw new Error('CLI 临时参考图仅支持不超过 20 MB 的 PNG、JPEG 或 WebP');
      const _0x32fea2 = new Uint8Array(await _0x2365d8['arrayBuffer']()),
        _0x4df642 = [];
      for (let _0x54f1fa = 0x0; _0x54f1fa < _0x32fea2['length']; _0x54f1fa += 0x8000) {
        _0x4df642['push'](String['fromCharCode'](..._0x32fea2['subarray'](_0x54f1fa, _0x54f1fa + 0x8000)));
      }
      return 'data:' + _0x2365d8['type'] + ';base64,' + btoa(_0x4df642['join'](''));
    }),
  );
}
