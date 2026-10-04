function normalizeResults(value) {
  return (Array['isArray'](value) ? value : [])
    ['filter']((item) => item?.['blob'] instanceof Blob || item?.['blob']?.['type'])
    ['filter']((key) => /^(image|video)\//['test'](String(key['blob']['type'] || '')));
}
export function installStoryboard3DExportCanvasBridge({
  windowObject: windowObject = globalThis['window'],
  createMediaNodeFromBlob: createMediaNodeFromBlob,
  showToast: showToast,
} = {}) {
  if (!windowObject?.['addEventListener'] || typeof createMediaNodeFromBlob !== 'function') return () => {};
  const async2 = async (index) => {
    const result = index?.['detail'] || {};
    if (result['options']?.['returnToCanvas'] === ![]) return;
    const name = normalizeResults(result['results']);
    if (name['length'] === 0x0) return;
    let count = 0x0;
    for (const [data, options] of name['entries']()) {
      const target = await createMediaNodeFromBlob(options['blob'], options['blob']['type'] || 'image/png', {
        name:
          name['length'] > 0x1
            ? (result['projectName'] || '3D 分镜') + '\x20' + (data + 0x1)
            : result['projectName'] || '3D\x20分镜',
        placement: 'viewport-center-sequence',
        sequenceKey: 'storyboard-3d-export:' + (result['projectId'] || 'project'),
      });
      if (target) count += 0x1;
    }
    const source = name['some']((next) => next['blob']['type']['startsWith']('video/'));
    if (count > 0x0)
      showToast?.(
        source ? '已将 ' + count + ' 个 3D 预演结果添加到画布' : '已将 ' + count + ' 张 3D 分镜添加到画布',
        'success',
      );
  };
  return (
    windowObject['addEventListener']('storyboard-3d:export-complete', async2),
    () => windowObject['removeEventListener']('storyboard-3d:export-complete', async2)
  );
}
