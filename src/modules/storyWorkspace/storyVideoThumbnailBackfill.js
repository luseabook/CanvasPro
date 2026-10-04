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
function collectBackfillGroups(value) {
  const map = new Map(),
    map2 = new Set();
  for (const item of Array['isArray'](value) ? value : []) {
    for (const episode of Array['isArray'](item?.['episodes']) ? item['episodes'] : []) {
      for (const clip of Array['isArray'](episode?.['clips']) ? episode['clips'] : []) {
        const results = Array['isArray'](clip?.['video']?.['results']) ? clip['video']['results'] : [];
        results['forEach']((result, index) => {
          if (
            !result ||
            typeof result !== 'object' ||
            map2['has'](result) ||
            !needsVideoResultThumbnail(result)
          )
            return;
          map2['add'](result);
          const videoResultThumbnailSource = resolveVideoResultThumbnailSource(result);
          if (!videoResultThumbnailSource) return;
          const list = map['get'](videoResultThumbnailSource) || [];
          (list['push']({
            episode: episode,
            clip: clip,
            results: results,
            index: index,
            result: result,
          }),
            map['set'](videoResultThumbnailSource, list));
        });
      }
    }
  }
  return [...map['entries']()]['map'](([source, references]) => ({
    source: source,
    references: references,
  }));
}
function pickThumbnailFields(options = {}) {
  return Object['fromEntries'](
    THUMBNAIL_FIELD_KEYS['filter']((key) => options[key] !== undefined && options[key] !== null)['map'](
      (data) => [data, options[data]],
    ),
  );
}
export async function backfillStoryVideoThumbnails(
  target,
  { concurrency: concurrency = 0x1, ensureThumbnail: ensureThumbnail = ensureVideoResultThumbnail } = {},
) {
  const sourceCount = collectBackfillGroups(target),
    args = new Set();
  let next = 0x0,
    updatedCount = 0x0,
    failedCount = 0x0;
  const run = async () => {
      while (next < sourceCount['length']) {
        const current = sourceCount[next];
        next += 0x1;
        try {
          const thumbnail = await ensureThumbnail(current['references'][0x0]['result']);
          if (!hasStableVideoResultThumbnail(thumbnail)) continue;
          const args2 = pickThumbnailFields(thumbnail);
          for (const entry of current['references']) {
            const args3 = entry['results'][entry['index']];
            if (
              !args3 ||
              typeof args3 !== 'object' ||
              resolveVideoResultThumbnailSource(args3) !== current['source'] ||
              hasStableVideoResultThumbnail(args3)
            )
              continue;
            ((entry['results'][entry['index']] = { ...args3, ...args2 }),
              args['add'](String(entry['episode']?.['id'] || '')['trim']()),
              (updatedCount += 0x1));
          }
        } catch {
          failedCount += 0x1;
        }
      }
    },
    length = Math['max'](
      0x1,
      Math['min'](sourceCount['length'] || 0x1, Math['trunc'](Number(concurrency) || 0x1)),
    );
  return (
    await Promise['all'](Array['from']({ length: length }, () => run())),
    {
      updatedCount: updatedCount,
      sourceCount: sourceCount['length'],
      failedCount: failedCount,
      changedEpisodeIds: [...args]['filter'](Boolean),
    }
  );
}
