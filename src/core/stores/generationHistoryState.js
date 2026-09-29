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
function hasResult(_0x2be661) {
  if (!_0x2be661 || _0x2be661['error']) return ![];
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
  ]['some']((_0xd02610) => typeof _0x2be661[_0xd02610] === 'string' && _0x2be661[_0xd02610]['trim']());
}
function normalizeUnownedGeneration(_0x4a7721) {
  const _0x4ac532 =
    _0x4a7721['isGenerating'] === !![] ||
    _0x4a7721['rhTaskRecovering'] === !![] ||
    _0x4a7721['dreaminaTaskRecovering'] === !![] ||
    _0x4a7721['asyncTaskRecovering'] === !![] ||
    STATUS_FIELDS['some']((_0x3ec6d4) =>
      RUNNING['has'](
        String(_0x4a7721[_0x3ec6d4] || '')
          ['trim']()
          ['toLowerCase'](),
      ),
    );
  if (!_0x4ac532) return;
  const _0x1a9e0d =
    hasResult(_0x4a7721) ||
    ['images', 'videos', 'audios']['some'](
      (_0x472fa2) => Array['isArray'](_0x4a7721[_0x472fa2]) && _0x4a7721[_0x472fa2]['some'](hasResult),
    );
  Object['assign'](_0x4a7721, buildIdleGenerationProtocolPatch(), {
    isGenerating: ![],
    jobStatus: _0x1a9e0d ? 'success' : null,
    jobError: null,
    statusMessage: '',
    rhStatusMessage: null,
    rhStatusCode: null,
  });
}
export function createGenerationHistoryState() {
  const _0x1fff6e = new Map();
  return {
    record(_0x3b71e0, _0x16625c, { history: _0x398183 } = {}) {
      if (_0x398183 !== 'preserve' && !_0x1fff6e['has'](_0x3b71e0)) return;
      const _0x3e468a = _0x1fff6e['get'](_0x3b71e0) || new Set();
      for (const _0x23046e of Object['keys'](_0x16625c)) {
        if (_0x23046e === 'id' || _0x23046e === '_bizRev') continue;
        if (_0x398183 === 'preserve') _0x3e468a['add'](_0x23046e);
        else _0x3e468a['delete'](_0x23046e);
      }
      if (_0x3e468a['size']) _0x1fff6e['set'](_0x3b71e0, _0x3e468a);
      else _0x1fff6e['delete'](_0x3b71e0);
    },
    restore(_0x1e810d, _0x549e03) {
      normalizeUnownedGeneration(_0x1e810d);
      if (!_0x549e03 || _0x549e03['type'] !== _0x1e810d['type']) return;
      for (const _0x1970f8 of _0x1fff6e['get'](_0x1e810d['id']) || []) {
        if (Object['hasOwn'](_0x549e03, _0x1970f8)) _0x1e810d[_0x1970f8] = _0x549e03[_0x1970f8];
        else delete _0x1e810d[_0x1970f8];
      }
    },
    delete(_0x43cf1d) {
      _0x1fff6e['delete'](_0x43cf1d);
    },
    clear() {
      _0x1fff6e['clear']();
    },
    prune(_0x175f01) {
      for (const _0x385f44 of _0x1fff6e['keys']()) if (!_0x175f01[_0x385f44]) _0x1fff6e['delete'](_0x385f44);
    },
  };
}
