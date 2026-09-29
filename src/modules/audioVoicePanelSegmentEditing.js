import { localPathToUrl, normalizeLocalPath } from '../utils/localMediaPath.js';
import {
  cloneAudioVoiceSegment,
  createAudioVoicePayloadError,
  firstNonEmptyString,
} from './audioVoicePanelSegmentState.js';
export const AUDIO_VOICE_SOURCE_CLIP_MIN_MS = 0x64;
function buildAudioVoiceSegmentFingerprint(_0x4660f5 = {}) {
  return JSON['stringify'](cloneAudioVoiceSegment(_0x4660f5));
}
export function buildAudioVoicePendingSegmentMerge(_0x401836 = {}, _0x3b4f07 = {}) {
  const _0x3b51d4 = String(_0x401836['id'] || '')['trim'](),
    _0x3a9d46 = String(_0x3b4f07['id'] || '')['trim']();
  if (!_0x3b51d4 || !_0x3a9d46) return null;
  const _0x3511b0 = Math['max'](0x0, Math['round'](Number(_0x401836['startMs']) || 0x0)),
    _0x2741e8 = Math['max'](_0x3511b0, Math['round'](Number(_0x3b4f07['endMs']) || _0x3511b0)),
    _0x53eebd = cloneAudioVoiceSegment({
      ..._0x401836,
      startMs: _0x3511b0,
      endMs: _0x2741e8,
      sourceText: [_0x401836['sourceText'], _0x3b4f07['sourceText']]['filter'](Boolean)['join']('\x20'),
      targetText: [_0x401836['targetText'], _0x3b4f07['targetText']]['filter'](Boolean)['join']('\x20'),
      convertedAudioLocalPath: '',
      convertedAudioUrl: '',
      convertedAudioDuration: 0x0,
      convertedAudioReady: ![],
      activeAudio: 'source',
      status: 'edited',
      error: '',
      rhTaskId: '',
    });
  return {
    currentSegmentId: _0x3b51d4,
    nextSegmentId: _0x3a9d46,
    currentFingerprint: buildAudioVoiceSegmentFingerprint(_0x401836),
    nextFingerprint: buildAudioVoiceSegmentFingerprint(_0x3b4f07),
    draftSegment: _0x53eebd,
  };
}
export function projectAudioVoicePendingSegmentMerges(_0x5a9aa2 = [], _0xc080e3 = []) {
  const _0x1b78e3 = Array['isArray'](_0x5a9aa2) ? _0x5a9aa2 : [],
    _0x51be04 = (Array['isArray'](_0xc080e3) ? _0xc080e3 : [])['filter'](
      (_0x5b7546) =>
        _0x5b7546?.['currentSegmentId'] && _0x5b7546?.['nextSegmentId'] && _0x5b7546?.['draftSegment'],
    );
  if (_0x51be04['length'] <= 0x0) return [..._0x1b78e3];
  const _0x5084ea = new Map(
      _0x51be04['map']((_0x1dc304) => [String(_0x1dc304['currentSegmentId']), _0x1dc304['draftSegment']]),
    ),
    _0x1ca466 = new Set(_0x51be04['map']((_0x5d943c) => String(_0x5d943c['nextSegmentId'])));
  return _0x1b78e3['filter']((_0x4c3da5) => !_0x1ca466['has'](String(_0x4c3da5?.['id'] || '')))['map'](
    (_0x1e30d4) => _0x5084ea['get'](String(_0x1e30d4?.['id'] || '')) || _0x1e30d4,
  );
}
export function isAudioVoicePendingSegmentMergeCurrent(_0x34a174 = {}, _0x297e45 = []) {
  const _0x50f79a = (Array['isArray'](_0x297e45) ? _0x297e45 : [])['filter'](
      (_0x16adc7) => _0x16adc7?.['status'] !== 'removed',
    ),
    _0x3336c2 = _0x50f79a['findIndex'](
      (_0x574959) => String(_0x574959?.['id'] || '') === String(_0x34a174['currentSegmentId'] || ''),
    );
  if (_0x3336c2 < 0x0) return ![];
  const _0x4fae7d = _0x50f79a[_0x3336c2],
    _0x4a0ff4 = _0x50f79a[_0x3336c2 + 0x1];
  if (!_0x4a0ff4 || String(_0x4a0ff4['id'] || '') !== String(_0x34a174['nextSegmentId'] || '')) return ![];
  return (
    buildAudioVoiceSegmentFingerprint(_0x4fae7d) === String(_0x34a174['currentFingerprint'] || '') &&
    buildAudioVoiceSegmentFingerprint(_0x4a0ff4) === String(_0x34a174['nextFingerprint'] || '')
  );
}
export async function mergeAudioVoiceSourceSegments(_0x543b13 = {}, _0x2b9880 = {}, _0x3f69ba = {}) {
  const _0x2251c3 = _0x3f69ba['composeAudio'];
  if (typeof _0x2251c3 !== 'function') throw new TypeError('composeAudio is required');
  const _0xe5b60a = normalizeLocalPath(_0x543b13['sourceAudioLocalPath'] || ''),
    _0x5ecf0b = normalizeLocalPath(_0x2b9880['sourceAudioLocalPath'] || '');
  if (!_0xe5b60a || !_0x5ecf0b) throw createAudioVoicePayloadError('audioMissing');
  const _0x16f14b =
      Math['max'](
        0x0,
        Math['round'](Number(_0x543b13['endMs']) || 0x0) - Math['round'](Number(_0x543b13['startMs']) || 0x0),
      ) +
      Math['max'](
        0x0,
        Math['round'](Number(_0x2b9880['endMs']) || 0x0) - Math['round'](Number(_0x2b9880['startMs']) || 0x0),
      ),
    _0x5a28b3 = await _0x2251c3([_0xe5b60a, _0x5ecf0b], { durationMs: _0x16f14b }),
    _0x27c2ff = normalizeLocalPath(_0x5a28b3?.['localPath'] || _0x5a28b3?.['path'] || ''),
    _0x49ad10 = firstNonEmptyString(_0x5a28b3?.['audioUrl'], _0x5a28b3?.['url'], localPathToUrl(_0x27c2ff));
  if (!_0x27c2ff && !_0x49ad10) throw createAudioVoicePayloadError('sourceClipFailed');
  const _0x424e41 = buildAudioVoicePendingSegmentMerge(_0x543b13, _0x2b9880);
  if (!_0x424e41) throw createAudioVoicePayloadError('sourceClipFailed');
  const _0x28c2ac = _0x424e41['draftSegment'],
    _0x284fe7 = _0x28c2ac['startMs'],
    _0x1787f8 = _0x28c2ac['endMs'];
  return cloneAudioVoiceSegment({
    ..._0x28c2ac,
    ...buildAudioVoiceApplySourceClipPatch(_0x28c2ac, {
      startMs: _0x284fe7,
      endMs: _0x1787f8,
      localPath: _0x27c2ff,
      audioUrl: _0x49ad10,
      sourceClipBaseAudioLocalPath: _0x27c2ff,
      sourceClipBaseAudioUrl: _0x49ad10,
      sourceClipBaseStartMs: _0x284fe7,
      sourceClipBaseEndMs: _0x284fe7 + _0x16f14b,
    }),
  });
}
export function buildAudioVoiceTextEditPatch(_0xcdbd = {}, _0x10c1c7 = '') {
  const _0x1f158d = String(_0xcdbd['sourceText'] || ''),
    _0x5d1bc8 = String(_0x10c1c7 || ''),
    _0x535489 = _0x5d1bc8['trim']() && _0x5d1bc8['trim']() !== _0x1f158d['trim']();
  return {
    targetText: _0x535489 ? _0x5d1bc8 : '',
    convertedAudioLocalPath: '',
    convertedAudioUrl: '',
    convertedAudioDuration: 0x0,
    convertedAudioReady: ![],
    activeAudio: 'source',
    status: _0x535489 ? 'edited' : _0xcdbd['sourceAudioReady'] ? 'detected' : 'edited',
    error: '',
    rhTaskId: '',
  };
}
export function shouldCloseAudioVoiceEmptyConvertedTextEdit(_0x2d22ea = {}, _0xc2080f = {}) {
  return (
    _0x2d22ea?.['key'] === 'Backspace' &&
    _0xc2080f?.['dataset']?.['audioVoiceTextKind'] === 'converted' &&
    String(_0xc2080f?.['value'] ?? '') === ''
  );
}
export function applyAudioVoiceTranslationResults(_0xc068d4 = [], _0x535a44 = []) {
  const _0x1ea0e6 = new Map(
    (Array['isArray'](_0x535a44) ? _0x535a44 : [])
      ['map']((_0x3c61ff) => [
        String(_0x3c61ff?.['id'] || '')['trim'](),
        String(_0x3c61ff?.['targetText'] || '')['trim'](),
      ])
      ['filter'](([_0x233f0c, _0x2d37c8]) => _0x233f0c && _0x2d37c8),
  );
  return (Array['isArray'](_0xc068d4) ? _0xc068d4 : [])['map']((_0x59e4c1) => {
    const _0x25ce2a = _0x1ea0e6['get'](String(_0x59e4c1?.['id'] || '')['trim']());
    if (!_0x25ce2a) return _0x59e4c1;
    return {
      ..._0x59e4c1,
      ...buildAudioVoiceTextEditPatch(_0x59e4c1, _0x25ce2a),
      targetText: _0x25ce2a,
      status: 'edited',
    };
  });
}
export function buildAudioVoiceApplySourceClipPatch(_0x3c82e3 = {}, _0x4e226c = {}) {
  const _0x52a898 = Math['max'](
      0x0,
      Math['round'](Number(_0x4e226c['startMs'] ?? _0x3c82e3['startMs']) || 0x0),
    ),
    _0x49160b = Math['max'](
      _0x52a898,
      Math['round'](Number(_0x4e226c['endMs'] ?? _0x3c82e3['endMs']) || _0x52a898),
    ),
    _0x1748f8 = normalizeLocalPath(_0x4e226c['localPath'] || _0x4e226c['sourceAudioLocalPath'] || ''),
    _0x32c1c6 = firstNonEmptyString(
      _0x4e226c['audioUrl'],
      _0x4e226c['sourceAudioUrl'],
      localPathToUrl(_0x1748f8),
    ),
    _0x304210 = hasAudioVoiceSourceClipBase(_0x3c82e3),
    _0x2a8f32 = _0x304210 ? _0x3c82e3['sourceClipBaseStartMs'] : _0x3c82e3['startMs'],
    _0x3eda11 = _0x304210 ? _0x3c82e3['sourceClipBaseEndMs'] : _0x3c82e3['endMs'],
    _0x50c450 = Math['max'](
      0x0,
      Math['round'](Number(_0x4e226c['sourceClipBaseStartMs'] ?? _0x2a8f32) || 0x0),
    ),
    _0x17f60e = Math['max'](
      _0x50c450,
      Math['round'](Number(_0x4e226c['sourceClipBaseEndMs'] ?? _0x3eda11) || _0x50c450),
    ),
    _0x21a233 = normalizeLocalPath(
      _0x4e226c['sourceClipBaseAudioLocalPath'] ||
        _0x3c82e3['sourceClipBaseAudioLocalPath'] ||
        _0x3c82e3['sourceAudioLocalPath'] ||
        _0x1748f8,
    ),
    _0x341468 = firstNonEmptyString(
      _0x4e226c['sourceClipBaseAudioUrl'],
      _0x3c82e3['sourceClipBaseAudioUrl'],
      _0x21a233 ? localPathToUrl(_0x21a233) : '',
    );
  return {
    startMs: _0x52a898,
    endMs: _0x49160b,
    sourceAudioLocalPath: _0x1748f8,
    sourceAudioUrl: _0x32c1c6,
    sourceClipBaseAudioLocalPath: _0x21a233,
    sourceClipBaseAudioUrl: _0x341468,
    sourceClipBaseStartMs: _0x50c450,
    sourceClipBaseEndMs: _0x17f60e,
    sourceAudioReady: !!_0x32c1c6,
    convertedAudioLocalPath: '',
    convertedAudioUrl: '',
    convertedAudioDuration: 0x0,
    convertedAudioReady: ![],
    activeAudio: 'source',
    status: 'edited',
    error: '',
    rhTaskId: '',
    needsSourceAudioRecut: ![],
  };
}
function hasAudioVoiceSourceClipBase(_0x4ae345 = {}) {
  return (
    !!normalizeLocalPath(_0x4ae345['sourceClipBaseAudioLocalPath'] || '') ||
    !!String(_0x4ae345['sourceClipBaseAudioUrl'] || '')['trim']() ||
    Math['round'](Number(_0x4ae345['sourceClipBaseEndMs']) || 0x0) >
      Math['round'](Number(_0x4ae345['sourceClipBaseStartMs']) || 0x0)
  );
}
export function resolveAudioVoiceSourceClipEditBase(_0x38c933 = {}, _0x33792f = {}) {
  const _0x3c0521 = hasAudioVoiceSourceClipBase(_0x38c933),
    _0x27a55f = normalizeLocalPath(_0x38c933['sourceClipBaseAudioLocalPath'] || ''),
    _0x494d3d = normalizeLocalPath(_0x38c933['sourceAudioLocalPath'] || ''),
    _0x41a3db = normalizeLocalPath(_0x33792f['analysisSourceAudioLocalPath'] || _0x33792f['localPath'] || ''),
    _0x44c768 = _0x27a55f || _0x494d3d || _0x41a3db,
    _0x168cfa = firstNonEmptyString(
      _0x38c933['sourceClipBaseAudioUrl'],
      !_0x27a55f ? _0x38c933['sourceAudioUrl'] : '',
      _0x33792f['analysisSourceAudioUrl'],
      _0x33792f['audioUrl'],
      localPathToUrl(_0x44c768),
    ),
    _0x1cf84e = Math['max'](0x0, Math['round'](Number(_0x38c933['startMs']) || 0x0)),
    _0x5cfe8a = Math['max'](_0x1cf84e, Math['round'](Number(_0x38c933['endMs']) || _0x1cf84e)),
    _0x439ab0 = Math['max'](
      0x0,
      Math['round'](Number(_0x3c0521 ? _0x38c933['sourceClipBaseStartMs'] : _0x1cf84e) || 0x0),
    ),
    _0x452578 = Math['max'](
      _0x439ab0,
      Math['round'](Number(_0x3c0521 ? _0x38c933['sourceClipBaseEndMs'] : _0x5cfe8a) || _0x439ab0),
    );
  return {
    localPath: _0x44c768,
    audioUrl: _0x168cfa,
    startMs: _0x439ab0,
    endMs: _0x452578,
    durationMs: Math['max'](0x0, _0x452578 - _0x439ab0),
  };
}
function splitAudioVoiceTextAtRatio(_0x54e328 = '', _0x301752 = 0.5) {
  const _0x1ba487 = String(_0x54e328 || '');
  if (!_0x1ba487) return ['', ''];
  const _0x1bbffc = Array['from'](_0x1ba487);
  if (_0x1bbffc['length'] <= 0x1) return [_0x1ba487, ''];
  const _0x54881c = Math['max'](0x0, Math['min'](0x1, Number(_0x301752) || 0x0)),
    _0x51eedd = Math['max'](
      0x1,
      Math['min'](_0x1bbffc['length'] - 0x1, Math['round'](_0x1bbffc['length'] * _0x54881c)),
    );
  return [
    _0x1bbffc['slice'](0x0, _0x51eedd)['join']('')['trim'](),
    _0x1bbffc['slice'](_0x51eedd)['join']('')['trim'](),
  ];
}
export function buildAudioVoiceSplitSourceSegmentDraft(_0x492430 = {}, _0x2967f6 = {}) {
  const _0xc2354b = Math['max'](0x0, Math['round'](Number(_0x2967f6['selectionStartMs']) || 0x0)),
    _0x10a55d = Math['max'](_0xc2354b, Math['round'](Number(_0x2967f6['selectionEndMs']) || 0x0)),
    _0x267280 = Math['round'](Number(_0x2967f6['splitAtMs']) || 0x0);
  if (
    _0x267280 - _0xc2354b < AUDIO_VOICE_SOURCE_CLIP_MIN_MS ||
    _0x10a55d - _0x267280 < AUDIO_VOICE_SOURCE_CLIP_MIN_MS
  )
    return null;
  const _0x3c2f84 = {
      sourceAudioLocalPath: '',
      sourceAudioUrl: '',
      sourceAudioReady: ![],
      convertedAudioLocalPath: '',
      convertedAudioUrl: '',
      convertedAudioDuration: 0x0,
      convertedAudioReady: ![],
      activeAudio: 'source',
      status: 'edited',
      error: '',
      rhTaskId: '',
      needsSourceAudioRecut: !![],
    },
    _0x5cb529 = _0x10a55d > _0xc2354b ? (_0x267280 - _0xc2354b) / (_0x10a55d - _0xc2354b) : 0.5,
    [_0x192702, _0x4cb88d] = splitAudioVoiceTextAtRatio(_0x492430['sourceText'], _0x5cb529),
    [_0x45af0c, _0x5bd950] = splitAudioVoiceTextAtRatio(_0x492430['targetText'], _0x5cb529),
    _0x62de04 = cloneAudioVoiceSegment({
      ..._0x492430,
      ..._0x3c2f84,
      startMs: _0xc2354b,
      endMs: _0x267280,
      sourceText: _0x192702,
      targetText: _0x45af0c,
    }),
    _0x588ee5 = cloneAudioVoiceSegment({
      ..._0x492430,
      ..._0x3c2f84,
      id: String(_0x2967f6['newSegmentId'] || 'audio-voice-split-' + Date['now']()),
      startMs: _0x267280,
      endMs: _0x10a55d,
      sourceText: _0x4cb88d,
      targetText: _0x5bd950,
    });
  return [_0x62de04, _0x588ee5];
}
function normalizeAudioVoiceSourceClipRanges(_0xdf4e2 = []) {
  if (!Array['isArray'](_0xdf4e2) || _0xdf4e2['length'] < 0x2) return null;
  const _0x212fbe = _0xdf4e2['map']((_0x23df51, _0x510f23) => {
    const _0x3b4bf3 = Math['max'](0x0, Math['round'](Number(_0x23df51?.['startMs']) || 0x0)),
      _0x165db5 = Math['max'](_0x3b4bf3, Math['round'](Number(_0x23df51?.['endMs']) || 0x0));
    return {
      id: String(_0x23df51?.['id'] || (_0x510f23 === 0x0 ? 'left' : 'right')),
      startMs: _0x3b4bf3,
      endMs: _0x165db5,
    };
  })
    ['filter']((_0x131055) => _0x131055['endMs'] - _0x131055['startMs'] >= AUDIO_VOICE_SOURCE_CLIP_MIN_MS)
    ['sort']((_0x1edcf6, _0x1ad88f) => _0x1edcf6['startMs'] - _0x1ad88f['startMs'])
    ['slice'](0x0, 0x2);
  if (_0x212fbe['length'] < 0x2) return null;
  if (_0x212fbe[0x0]['endMs'] > _0x212fbe[0x1]['startMs']) return null;
  return _0x212fbe;
}
function buildAudioVoiceRangeSourceSegmentDraft(_0x1c85fe = {}, _0x2ea0bd = {}) {
  const _0x36db28 = normalizeAudioVoiceSourceClipRanges(_0x2ea0bd['rangesMs']);
  if (!_0x36db28) return null;
  const _0x2dd8e3 = {
      sourceAudioLocalPath: '',
      sourceAudioUrl: '',
      sourceAudioReady: ![],
      convertedAudioLocalPath: '',
      convertedAudioUrl: '',
      convertedAudioDuration: 0x0,
      convertedAudioReady: ![],
      activeAudio: 'source',
      status: 'edited',
      error: '',
      rhTaskId: '',
      needsSourceAudioRecut: !![],
    },
    _0xab3f2f = _0x36db28['reduce'](
      (_0x2e3401, _0x1dc0f3) => _0x2e3401 + Math['max'](0x0, _0x1dc0f3['endMs'] - _0x1dc0f3['startMs']),
      0x0,
    ),
    _0x69add0 = _0xab3f2f > 0x0 ? (_0x36db28[0x0]['endMs'] - _0x36db28[0x0]['startMs']) / _0xab3f2f : 0.5,
    [_0x4aaa27, _0x2a76d9] = splitAudioVoiceTextAtRatio(_0x1c85fe['sourceText'], _0x69add0),
    [_0x304277, _0xc72d1f] = splitAudioVoiceTextAtRatio(_0x1c85fe['targetText'], _0x69add0),
    _0x4f2789 = [
      [_0x4aaa27, _0x304277],
      [_0x2a76d9, _0xc72d1f],
    ];
  return _0x36db28['map']((_0x14abe4, _0x826663) =>
    cloneAudioVoiceSegment({
      ..._0x1c85fe,
      ..._0x2dd8e3,
      id:
        _0x826663 === 0x0
          ? _0x1c85fe['id']
          : String(_0x2ea0bd['newSegmentId'] || 'audio-voice-split-' + Date['now']()),
      startMs: _0x14abe4['startMs'],
      endMs: _0x14abe4['endMs'],
      sourceText: _0x4f2789[_0x826663]?.[0x0] || '',
      targetText: _0x4f2789[_0x826663]?.[0x1] || '',
    }),
  );
}
export async function commitAudioVoiceSourceClipEdit(_0x3cc927 = {}, _0x5dbf54 = {}) {
  const _0x39b690 = _0x5dbf54['cutRange'];
  if (typeof _0x39b690 !== 'function') throw new TypeError('cutRange is required');
  const _0x2160f6 = resolveAudioVoiceSourceClipEditBase(_0x3cc927, _0x5dbf54['editBase'] || {}),
    _0x20df89 = Math['max'](0x0, Math['round'](Number(_0x5dbf54['selectionStartMs']) || 0x0)),
    _0x35e8df = Math['max'](_0x20df89, Math['round'](Number(_0x5dbf54['selectionEndMs']) || 0x0));
  if (_0x35e8df - _0x20df89 < AUDIO_VOICE_SOURCE_CLIP_MIN_MS)
    throw createAudioVoicePayloadError('sourceClipInvalidSelection');
  const _0x583e71 = Array['isArray'](_0x5dbf54['rangesMs']) && _0x5dbf54['rangesMs']['length'] > 0x0,
    _0x1b411a = _0x583e71
      ? buildAudioVoiceRangeSourceSegmentDraft(_0x3cc927, {
          rangesMs: _0x5dbf54['rangesMs'],
          newSegmentId: _0x5dbf54['newSegmentId'],
        })
      : null;
  if (_0x583e71 && !_0x1b411a) throw createAudioVoicePayloadError('sourceClipSplitAtMiddle');
  const _0x2c1d05 = !_0x583e71 && _0x5dbf54['splitAtMs'] !== undefined && _0x5dbf54['splitAtMs'] !== null,
    _0x18cfe8 = _0x2c1d05
      ? buildAudioVoiceSplitSourceSegmentDraft(_0x3cc927, {
          selectionStartMs: _0x20df89,
          selectionEndMs: _0x35e8df,
          splitAtMs: _0x5dbf54['splitAtMs'],
          newSegmentId: _0x5dbf54['newSegmentId'],
        })
      : null;
  if (_0x2c1d05 && !_0x18cfe8) throw createAudioVoicePayloadError('sourceClipSplitAtMiddle');
  const _0x169ad2 = _0x1b411a ||
      _0x18cfe8 || [cloneAudioVoiceSegment({ ..._0x3cc927, startMs: _0x20df89, endMs: _0x35e8df })],
    _0x5aa923 = [];
  for (const _0x396a7f of _0x169ad2) {
    const _0x3659fb = await _0x39b690({ startMs: _0x396a7f['startMs'], endMs: _0x396a7f['endMs'] }),
      _0x294c06 = normalizeLocalPath(
        _0x3659fb?.['localPath'] || _0x3659fb?.['path'] || _0x3659fb?.['sourceAudioLocalPath'] || '',
      ),
      _0x363975 = firstNonEmptyString(
        _0x3659fb?.['audioUrl'],
        _0x3659fb?.['url'],
        _0x3659fb?.['sourceAudioUrl'],
        localPathToUrl(_0x294c06),
      ),
      _0x1cfdc6 =
        _0x1b411a || _0x18cfe8
          ? {
              sourceClipBaseAudioLocalPath: _0x294c06,
              sourceClipBaseAudioUrl: _0x363975,
              sourceClipBaseStartMs: _0x396a7f['startMs'],
              sourceClipBaseEndMs: _0x396a7f['endMs'],
            }
          : {
              sourceClipBaseAudioLocalPath: _0x2160f6['localPath'],
              sourceClipBaseAudioUrl: _0x2160f6['audioUrl'],
              sourceClipBaseStartMs: _0x2160f6['startMs'],
              sourceClipBaseEndMs: _0x2160f6['endMs'],
            };
    _0x5aa923['push'](
      cloneAudioVoiceSegment({
        ..._0x396a7f,
        ...buildAudioVoiceApplySourceClipPatch(_0x396a7f, {
          startMs: _0x396a7f['startMs'],
          endMs: _0x396a7f['endMs'],
          localPath: _0x294c06,
          audioUrl: _0x363975,
          ..._0x1cfdc6,
        }),
      }),
    );
  }
  return _0x5aa923;
}
