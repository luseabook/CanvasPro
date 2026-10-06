import { buildIdleGenerationProtocolPatch } from '../generationTaskProtocolState.js';
const RUNNING = new Set([
    'pending',
    'queued',
    'queueing',
    'waiting',
    'submitted',
    'submitting',
    'submit',
    'running',
    'processing',
    'generating',
    'in_progress',
    'in-progress',
    'recovering',
  ]),
  STATUS_FIELDS = ['jobStatus', 'rhTaskStatus', 'dreaminaTaskStatus', 'dreaminaTaskPhase', 'asyncTaskStatus'];
function hasResult(enabled) {
  if (!enabled || enabled.error) return false;
  return [
    'imageUrl',
    'videoUrl',
    'audioUrl',
    'sourceUrl',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
    'thumbUrl',
    'thumbId',
    'sourceId',
    'outputText',
  ].some((value) => typeof enabled[value] === 'string' && enabled[value].trim());
}
function normalizeUnownedGeneration(item) {
  const enabled2 =
    item.isGenerating === true ||
    item.rhTaskRecovering === true ||
    item.dreaminaTaskRecovering === true ||
    item.asyncTaskRecovering === true ||
    STATUS_FIELDS.some((key) =>
      RUNNING.has(
        String(item[key] || '')
          .trim()
          .toLowerCase(),
      ),
    );
  if (!enabled2) return;
  const jobStatus =
    hasResult(item) ||
    ['images', 'videos', 'audios'].some(
      (index) => Array.isArray(item[index]) && item[index].some(hasResult),
    );
  Object.assign(item, buildIdleGenerationProtocolPatch(), {
    isGenerating: false,
    jobStatus: jobStatus ? 'success' : null,
    jobError: null,
    statusMessage: '',
    rhStatusMessage: null,
    rhStatusCode: null,
  });
}
export function createGenerationHistoryState() {
  const map = new Map();
  return {
    record(result, data, { history: history } = {}) {
      if (history !== 'preserve' && !map.has(result)) return;
      const map2 = map.get(result) || new Set();
      for (const options of Object.keys(data)) {
        if (options === 'id' || options === '_bizRev') continue;
        if (history === 'preserve') map2.add(options);
        else map2.delete(options);
      }
      if (map2.size) map.set(result, map2);
      else map.delete(result);
    },
    restore(target, enabled3) {
      normalizeUnownedGeneration(target);
      if (!enabled3 || enabled3.type !== target.type) return;
      for (const source of map.get(target.id) || []) {
        if (Object.hasOwn(enabled3, source)) target[source] = enabled3[source];
        else delete target[source];
      }
    },
    delete(next) {
      map.delete(next);
    },
    clear() {
      map.clear();
    },
    prune(enabled4) {
      for (const current of map.keys()) if (!enabled4[current]) map.delete(current);
    },
  };
}
