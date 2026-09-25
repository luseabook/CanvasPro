import {
  ensureVideoResultThumbnail,
  hasStableVideoResultThumbnail,
  needsVideoResultThumbnail,
  resolveVideoResultThumbnailSource,
} from '../../../api/videoResultThumbnailApi.js';
const THUMBNAIL_FIELD_KEYS = Object['freeze']([
  'posterUrl',
  'thumbUrl',
  'posterLocalPath',
  'thumbLocalPath',
  'videoThumbSrc',
  'sourcePosterUrl',
  'sourceThumbUrl',
]);
function collectBackfillGroups(_0x459a49) {
  const _0x1aeb1c = new Map(),
    _0x3c2f1f = new Set();
  for (const _0xc98792 of Array['isArray'](_0x459a49) ? _0x459a49 : []) {
    for (const _0x14dd97 of Array['isArray'](_0xc98792?.['episodes']) ? _0xc98792['episodes'] : []) {
      for (const _0x2d569d of Array['isArray'](_0x14dd97?.['clips']) ? _0x14dd97['clips'] : []) {
        const _0x3416a2 = Array['isArray'](_0x2d569d?.['video']?.['results'])
          ? _0x2d569d['video']['results']
          : [];
        _0x3416a2['forEach']((_0x622d3d, _0x1874a8) => {
          if (
            !_0x622d3d ||
            typeof _0x622d3d !== 'object' ||
            _0x3c2f1f['has'](_0x622d3d) ||
            !needsVideoResultThumbnail(_0x622d3d)
          )
            return;
          _0x3c2f1f['add'](_0x622d3d);
          const _0x20a737 = resolveVideoResultThumbnailSource(_0x622d3d);
          if (!_0x20a737) return;
          const _0x584a25 = _0x1aeb1c['get'](_0x20a737) || [];
          (_0x584a25['push']({
            episode: _0x14dd97,
            clip: _0x2d569d,
            results: _0x3416a2,
            index: _0x1874a8,
            result: _0x622d3d,
          }),
            _0x1aeb1c['set'](_0x20a737, _0x584a25));
        });
      }
    }
  }
  return [..._0x1aeb1c['entries']()]['map'](([_0x282f51, _0x10b38b]) => ({
    source: _0x282f51,
    references: _0x10b38b,
  }));
}
function pickThumbnailFields(_0x2a8c4c = {}) {
  return Object['fromEntries'](
    THUMBNAIL_FIELD_KEYS['filter'](
      (_0x31264a) => _0x2a8c4c[_0x31264a] !== undefined && _0x2a8c4c[_0x31264a] !== null,
    )['map']((_0x30d24e) => [_0x30d24e, _0x2a8c4c[_0x30d24e]]),
  );
}
export async function backfillStoryVideoThumbnails(
  _0x463dcb,
  { concurrency: concurrency = 0x1, ensureThumbnail: ensureThumbnail = ensureVideoResultThumbnail } = {},
) {
  const _0x36c393 = collectBackfillGroups(_0x463dcb),
    _0x41c5fe = new Set();
  let _0x24b952 = 0x0,
    _0x1f6c78 = 0x0,
    _0x473842 = 0x0;
  const _0x367a30 = async () => {
      while (_0x24b952 < _0x36c393['length']) {
        const _0x11509f = _0x36c393[_0x24b952];
        _0x24b952 += 0x1;
        try {
          const _0x5809c7 = await ensureThumbnail(_0x11509f['references'][0x0]['result']);
          if (!hasStableVideoResultThumbnail(_0x5809c7)) continue;
          const _0x2e50c8 = pickThumbnailFields(_0x5809c7);
          for (const _0x4b91cd of _0x11509f['references']) {
            const _0x4ab0e5 = _0x4b91cd['results'][_0x4b91cd['index']];
            if (
              !_0x4ab0e5 ||
              typeof _0x4ab0e5 !== 'object' ||
              resolveVideoResultThumbnailSource(_0x4ab0e5) !== _0x11509f['source'] ||
              hasStableVideoResultThumbnail(_0x4ab0e5)
            )
              continue;
            ((_0x4b91cd['results'][_0x4b91cd['index']] = { ..._0x4ab0e5, ..._0x2e50c8 }),
              _0x41c5fe['add'](String(_0x4b91cd['episode']?.['id'] || '')['trim']()),
              (_0x1f6c78 += 0x1));
          }
        } catch {
          _0x473842 += 0x1;
        }
      }
    },
    _0x1fbc4b = Math['max'](
      0x1,
      Math['min'](_0x36c393['length'] || 0x1, Math['trunc'](Number(concurrency) || 0x1)),
    );
  return (
    await Promise['all'](Array['from']({ length: _0x1fbc4b }, () => _0x367a30())),
    {
      updatedCount: _0x1f6c78,
      sourceCount: _0x36c393['length'],
      failedCount: _0x473842,
      changedEpisodeIds: [..._0x41c5fe]['filter'](Boolean),
    }
  );
}
