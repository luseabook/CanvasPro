import { localPathToUrl, normalizeLocalPath, urlToLocalPath } from '../utils/localMediaPath.js';
const VIDEO_EXTENSION_RE = /\.(?:mp4|webm|mov|m4v|avi|mkv)(?:[?#].*)?$/i;
function firstText(...args) {
  for (const value of args) {
    const item = String(value || '').trim();
    if (item) return item;
  }
  return '';
}
function firstNode(state = {}) {
  return Array.isArray(state?.nodes) ? state.nodes[0] || {} : {};
}
function firstItem(options = {}) {
  return Array.isArray(options?.items) ? options.items[0] || {} : {};
}
function resolveMediaSrc(options2 = {}) {
  const node = firstNode(options2),
    localPath = normalizeLocalPath(
      options2?.localPath ||
        options2?.outputItem?.localPath ||
        node?.originalLocalPath ||
        node?.localPath ||
        node?.displayLocalPath,
    );
  return firstText(localPathToUrl(localPath), node?.videoUrl, node?.sourceUrl, node?.src);
}
function isUsablePosterCandidate(key, index) {
  const enabled = String(key || '').trim();
  if (!enabled || enabled === index) return false;
  const localPath2 = urlToLocalPath(enabled),
    localPath3 = urlToLocalPath(index);
  if (localPath2 && localPath2 === localPath3) return false;
  return !VIDEO_EXTENSION_RE.test(enabled);
}
export function resolveGenerationHistoryVideoPresentation(options3 = {}) {
  const node2 = firstNode(options3),
    item2 = firstItem(options3),
    mediaSrc = resolveMediaSrc(options3),
    list = [
      localPathToUrl(node2?.posterLocalPath),
      localPathToUrl(node2?.thumbLocalPath),
      localPathToUrl(options3?.outputItem?.thumbLocalPath),
      node2?.posterUrl,
      node2?.thumbUrl,
      options3?.coverUrl,
      item2?.thumbSrc,
    ],
    enabled2 = list.find((result) => isUsablePosterCandidate(result, mediaSrc)) || '';
  return {
    mediaSrc: mediaSrc,
    posterSrc: String(enabled2 || '').trim(),
    needsBackfill: Boolean(mediaSrc && urlToLocalPath(mediaSrc) && !enabled2),
  };
}
export function applyGenerationHistoryVideoThumbnail(args2 = {}, data = {}) {
  const posterLocalPath = normalizeLocalPath(
      data?.posterLocalPath || data?.thumbLocalPath || data?.posterUrl || data?.thumbUrl,
    ),
    posterUrl = firstText(localPathToUrl(posterLocalPath), data?.posterUrl, data?.thumbUrl);
  if (!posterUrl) return args2;
  const videoThumbSrc = firstText(
      data?.videoThumbSrc,
      resolveGenerationHistoryVideoPresentation(args2).mediaSrc,
    ),
    nodes = Array.isArray(args2?.nodes)
      ? args2.nodes.map((args3, count) =>
          count === 0
            ? {
                ...args3,
                posterUrl: posterUrl,
                thumbUrl: posterUrl,
                posterLocalPath: posterLocalPath,
                thumbLocalPath: posterLocalPath,
                videoThumbSrc: videoThumbSrc,
              }
            : args3,
        )
      : [],
    items = Array.isArray(args2?.items)
      ? args2.items.map((args4, count2) =>
          count2 === 0
            ? {
                ...args4,
                thumbSrc: posterUrl,
                ...(args4?.nodeData
                  ? {
                      nodeData: {
                        ...args4.nodeData,
                        posterUrl: posterUrl,
                        thumbUrl: posterUrl,
                        posterLocalPath: posterLocalPath,
                        thumbLocalPath: posterLocalPath,
                        videoThumbSrc: videoThumbSrc,
                      },
                    }
                  : {}),
              }
            : args4,
        )
      : [];
  return {
    ...args2,
    coverUrl: posterUrl,
    ...(posterLocalPath ? { thumbLocalPath: posterLocalPath } : {}),
    nodes: nodes,
    items: items,
  };
}
export function createVideoThumbnailRequestQueue({ concurrency: concurrency = 1 } = {}) {
  const target = Math.max(1, Math.trunc(Number(concurrency) || 1)),
    list2 = [],
    map = new Map();
  let source = 0;
  const run = () => {
    while (source < target && list2.length > 0) {
      const promise = list2.shift();
      ((source += 1),
        Promise.resolve()
          .then(promise.task)
          .then(
            (next) => {
              source -= 1;
              if (map.get(promise.key) === promise.promise) map.delete(promise.key);
              (run(), promise.resolve(next));
            },
            (current) => {
              source -= 1;
              if (map.get(promise.key) === promise.promise) map.delete(promise.key);
              (run(), promise.reject(current));
            },
          ));
    }
  };
  return {
    enqueue(entry, task) {
      const key2 = String(entry || '').trim();
      if (!key2) return Promise.reject(new Error('Missing video thumbnail source'));
      const record = map.get(key2);
      if (record) return record;
      let resolve, reject;
      const promise2 = new Promise((payload, handle) => {
          ((resolve = payload), (reject = handle));
        }),
        config = {
          key: key2,
          task: task,
          promise: promise2,
          resolve: resolve,
          reject: reject,
        };
      return (map.set(key2, promise2), list2.push(config), run(), promise2);
    },
  };
}
