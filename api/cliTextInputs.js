const UNSUPPORTED_MEDIA =
    /\.(?:mp4|mov|m4v|webm|mkv|avi|mpeg|mpg|3gp|mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/i,
  IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
function urls(list) {
  return Array['isArray'](list)
    ? list['map']((value) => String(value || '')['trim']())['filter'](Boolean)
    : [];
}
export async function prepareCliTextImageInputs(signal, item) {
  const list2 = [...new Set([...urls(signal['inputImageUrls']), ...urls(signal['inputUrls'])])];
  if (
    urls(signal['inputVideoUrls'])['length'] ||
    urls(signal['inputAudioUrls'])['length'] ||
    list2['some']((key) => UNSUPPORTED_MEDIA['test'](key) || /^data:(?:video|audio)\//i['test'](key))
  )
    throw new Error('CLI 文本模型不支持视频或音频参考，请仅使用文本和图片');
  const index = item['inputSlots']['maxByKind']['image'];
  if (list2['length'] > index)
    throw new Error('OpenAI CLI 最多支持 ' + index + '\x20张参考图，当前共\x20' + list2['length'] + '\x20张');
  return Promise['all'](
    list2['map'](async (enabled) => {
      if (!enabled['startsWith']('blob:')) return enabled;
      const response = await fetch(enabled, { signal: signal['signal'] });
      if (!response['ok']) throw new Error('CLI 图片读取失败');
      const result = await response['blob']();
      if (!IMAGE_TYPES['has'](result['type']) || result['size'] > 0x14 * 0x400 * 0x400)
        throw new Error('CLI 临时参考图仅支持不超过 20 MB 的 PNG、JPEG 或 WebP');
      const list3 = new Uint8Array(await result['arrayBuffer']()),
        list4 = [];
      for (let data = 0x0; data < list3['length']; data += 0x8000) {
        list4['push'](String['fromCharCode'](...list3['subarray'](data, data + 0x8000)));
      }
      return 'data:' + result['type'] + ';base64,' + btoa(list4['join'](''));
    }),
  );
}
