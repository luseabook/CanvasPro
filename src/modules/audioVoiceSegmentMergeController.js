import {
  buildAudioVoicePendingSegmentMerge,
  isAudioVoicePendingSegmentMergeCurrent,
  mergeAudioVoiceSourceSegments,
  projectAudioVoicePendingSegmentMerges,
} from './audioVoicePanelSegmentEditing.js';
import { getVisibleAudioVoiceSegments } from './audioVoicePanelSegmentState.js';
const GLOBAL_BLOCKED_ACTIONS = new Set([
  'start-analyze',
  'translate-language',
  'select-all',
  'voice',
  'batch-generate',
  'compose-all',
  'audio-param',
  'clear-audio-param',
  'toggle-imitate-tone',
]);
function noop() {}
export function createAudioVoiceSegmentMergeController({
  session: session,
  getSourceNodeId: getSourceNodeId = () => '',
  getSegments: getSegments = () => [],
  composeAudio: composeAudio,
  commitSegments: commitSegments = noop,
  render: render = noop,
  markMutation: markMutation = noop,
  showPending: showPending = noop,
  showError: showError = noop,
  showStale: showStale = noop,
} = {}) {
  if (!session) throw new TypeError('session is required');
  if (typeof composeAudio !== 'function') throw new TypeError('composeAudio is required');
  function getOperations() {
    return session['listActive']({ kind: 'merge', sourceNodeId: getSourceNodeId() });
  }
  function run() {
    return getOperations()
      ['map']((value) => value['payload'])
      ['filter'](Boolean);
  }
  function getProjectedVisibleSegments() {
    return projectAudioVoicePendingSegmentMerges(getVisibleAudioVoiceSegments(getSegments()), run());
  }
  function hasPending() {
    return getOperations()['length'] > 0;
  }
  function isMerging(options = {}) {
    const enabled = String(options?.['id'] || options || '')['trim']();
    if (!enabled) return false;
    return run()['some']((item) => item['currentSegmentId'] === enabled);
  }
  function isReserved(options2 = {}) {
    return session['isSegmentReserved'](
      getSourceNodeId(),
      String(options2?.['id'] || options2 || '')['trim'](),
    );
  }
  async function merge(segmentId) {
    const sourceNodeId = String(getSourceNodeId() || '')['trim'](),
      segments = getSegments(),
      list = getVisibleAudioVoiceSegments(segments),
      key = list['findIndex']((index) => index['id'] === segmentId),
      enabled2 = list[key],
      enabled3 = list[key + 1];
    if (!enabled2 || !enabled3) return { status: 'missing' };
    const payload = buildAudioVoicePendingSegmentMerge(enabled2, enabled3);
    if (!payload) return { status: 'missing' };
    const enabled4 = session['begin']({
      kind: 'merge',
      sourceNodeId: sourceNodeId,
      segmentId: segmentId,
      segmentIds: [enabled2['id'], enabled3['id']],
      payload: payload,
    });
    if (!enabled4) return (showPending(), { status: 'pending' });
    render();
    try {
      const merged = await mergeAudioVoiceSourceSegments(enabled2, enabled3, {
        composeAudio: (srcs, result = {}) =>
          composeAudio({
            sourceNodeId: sourceNodeId,
            srcs: srcs,
            durationMs: Number(result['durationMs'] || 0),
          }),
      });
      if (!session['isCurrent'](enabled4, getSourceNodeId())) return { status: 'stale' };
      const list2 = getSegments();
      if (!isAudioVoicePendingSegmentMergeCurrent(payload, list2))
        return (session['finish'](enabled4), render(), showStale(), { status: 'stale' });
      return (
        session['finish'](enabled4),
        markMutation(enabled2['id']),
        commitSegments(
          list2['map']((data) => (data['id'] === enabled2['id'] ? merged : data))['filter'](
            (target) => target['id'] !== enabled3['id'],
          ),
        ),
        { status: 'success', merged: merged }
      );
    } catch (error) {
      if (!session['isCurrent'](enabled4, getSourceNodeId())) return { status: 'stale', error: error };
      return (session['finish'](enabled4), render(), showError(error), { status: 'failed', error: error });
    } finally {
      session['finish'](enabled4) && String(getSourceNodeId() || '')['trim']() === sourceNodeId && render();
    }
  }
  return {
    blocksGlobalAction: (source) => GLOBAL_BLOCKED_ACTIONS['has'](source),
    getOperations: getOperations,
    getProjectedVisibleSegments: getProjectedVisibleSegments,
    hasPending: hasPending,
    isMerging: isMerging,
    isReserved: isReserved,
    merge: merge,
  };
}
