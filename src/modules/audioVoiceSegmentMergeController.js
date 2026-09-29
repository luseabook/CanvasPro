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
  session: _0x1ae433,
  getSourceNodeId: getSourceNodeId = () => '',
  getSegments: getSegments = () => [],
  composeAudio: _0x549874,
  commitSegments: commitSegments = noop,
  render: render = noop,
  markMutation: markMutation = noop,
  showPending: showPending = noop,
  showError: showError = noop,
  showStale: showStale = noop,
} = {}) {
  if (!_0x1ae433) throw new TypeError('session\x20is\x20required');
  if (typeof _0x549874 !== 'function') throw new TypeError('composeAudio is required');
  function _0xc7d18f() {
    return _0x1ae433['listActive']({ kind: 'merge', sourceNodeId: getSourceNodeId() });
  }
  function _0x65103c() {
    return _0xc7d18f()
      ['map']((_0x50ff7d) => _0x50ff7d['payload'])
      ['filter'](Boolean);
  }
  function _0x30969e() {
    return projectAudioVoicePendingSegmentMerges(getVisibleAudioVoiceSegments(getSegments()), _0x65103c());
  }
  function _0x421404() {
    return _0xc7d18f()['length'] > 0x0;
  }
  function _0x3110e8(_0x18b740 = {}) {
    const _0xc232 = String(_0x18b740?.['id'] || _0x18b740 || '')['trim']();
    if (!_0xc232) return ![];
    return _0x65103c()['some']((_0x5f3f97) => _0x5f3f97['currentSegmentId'] === _0xc232);
  }
  function _0x5d6950(_0x971044 = {}) {
    return _0x1ae433['isSegmentReserved'](
      getSourceNodeId(),
      String(_0x971044?.['id'] || _0x971044 || '')['trim'](),
    );
  }
  async function _0x4079a6(_0x3df1cc) {
    const _0x1b27b4 = String(getSourceNodeId() || '')['trim'](),
      _0x582308 = getSegments(),
      _0x3d79f6 = getVisibleAudioVoiceSegments(_0x582308),
      _0x3463d2 = _0x3d79f6['findIndex']((_0x5ade97) => _0x5ade97['id'] === _0x3df1cc),
      _0x4cad5c = _0x3d79f6[_0x3463d2],
      _0x158d19 = _0x3d79f6[_0x3463d2 + 0x1];
    if (!_0x4cad5c || !_0x158d19) return { status: 'missing' };
    const _0x2f844b = buildAudioVoicePendingSegmentMerge(_0x4cad5c, _0x158d19);
    if (!_0x2f844b) return { status: 'missing' };
    const _0x1abd1f = _0x1ae433['begin']({
      kind: 'merge',
      sourceNodeId: _0x1b27b4,
      segmentId: _0x3df1cc,
      segmentIds: [_0x4cad5c['id'], _0x158d19['id']],
      payload: _0x2f844b,
    });
    if (!_0x1abd1f) return (showPending(), { status: 'pending' });
    render();
    try {
      const _0x2b17d2 = await mergeAudioVoiceSourceSegments(_0x4cad5c, _0x158d19, {
        composeAudio: (_0x2358ea, _0x1cea81 = {}) =>
          _0x549874({
            sourceNodeId: _0x1b27b4,
            srcs: _0x2358ea,
            durationMs: Number(_0x1cea81['durationMs'] || 0x0),
          }),
      });
      if (!_0x1ae433['isCurrent'](_0x1abd1f, getSourceNodeId())) return { status: 'stale' };
      const _0x4b4960 = getSegments();
      if (!isAudioVoicePendingSegmentMergeCurrent(_0x2f844b, _0x4b4960))
        return (_0x1ae433['finish'](_0x1abd1f), render(), showStale(), { status: 'stale' });
      return (
        _0x1ae433['finish'](_0x1abd1f),
        markMutation(_0x4cad5c['id']),
        commitSegments(
          _0x4b4960['map']((_0x8c6257) => (_0x8c6257['id'] === _0x4cad5c['id'] ? _0x2b17d2 : _0x8c6257))[
            'filter'
          ]((_0x2ac49e) => _0x2ac49e['id'] !== _0x158d19['id']),
        ),
        { status: 'success', merged: _0x2b17d2 }
      );
    } catch (_0x19abb8) {
      if (!_0x1ae433['isCurrent'](_0x1abd1f, getSourceNodeId())) return { status: 'stale', error: _0x19abb8 };
      return (
        _0x1ae433['finish'](_0x1abd1f),
        render(),
        showError(_0x19abb8),
        { status: 'failed', error: _0x19abb8 }
      );
    } finally {
      _0x1ae433['finish'](_0x1abd1f) && String(getSourceNodeId() || '')['trim']() === _0x1b27b4 && render();
    }
  }
  return {
    blocksGlobalAction: (_0xebe367) => GLOBAL_BLOCKED_ACTIONS['has'](_0xebe367),
    getOperations: _0xc7d18f,
    getProjectedVisibleSegments: _0x30969e,
    hasPending: _0x421404,
    isMerging: _0x3110e8,
    isReserved: _0x5d6950,
    merge: _0x4079a6,
  };
}
