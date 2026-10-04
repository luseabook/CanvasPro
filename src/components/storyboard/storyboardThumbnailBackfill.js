export function clearInlineStoryboardThumbUrls(list = []) {
  if (!Array.isArray(list)) return null;
  let value = false;
  const item = list.map((args) => {
    if (args && typeof args.thumbUrl === 'string' && args.thumbUrl.startsWith('data:image/'))
      return ((value = true), { ...args, thumbUrl: '' });
    return args;
  });
  return value ? item : null;
}
