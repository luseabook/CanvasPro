import {
  invalidateStoryVideoReplicationAssetLocalization,
  applyStoryVideoReplicationAnalysis,
  syncStoryVideoReplicationProject,
} from './storyVideoReplication.js';
import {
  REPLICATION_CHARACTER_ROLES,
  REPLICATION_SUBJECT_TYPES,
} from '../../domain/storyGeneration/videoReplicationCharacters.js';
import { REPLICATION_VOICEOVER_KINDS } from '../../domain/storyGeneration/videoReplicationSpeech.js';
function canEdit(_0x1e2ac9) {
  return (
    _0x1e2ac9?.['replication']?.['sourceAnalysis'] &&
    !_0x1e2ac9['clips']?.['length'] &&
    !['queued', 'uploading', 'analyzing']['includes'](_0x1e2ac9['replication']['status'])
  );
}
function commitSourceEdit(_0x3740a4, _0xf50691) {
  ((_0xf50691['replication']['sourceAnalysis']['revision'] =
    (_0xf50691['replication']['sourceAnalysis']['revision'] || 0x0) + 0x1),
    applyStoryVideoReplicationAnalysis(_0xf50691, {
      sourceAnalysis: _0xf50691['replication']['sourceAnalysis'],
    }),
    syncStoryVideoReplicationProject(_0x3740a4),
    invalidateStoryVideoReplicationAssetLocalization(_0x3740a4));
}
export function editStoryReplicationSource(
  _0x2c9cc8,
  _0x25a782,
  { kind: _0x377d96, id: _0xc1a9ef, index: _0x4f3975, field: _0x39dc82, value: _0x5ccd74 } = {},
) {
  const _0x45ff04 = _0x25a782?.['replication']?.['sourceAnalysis'];
  if (!canEdit(_0x25a782)) return ![];
  const _0x181d1a = _0x45ff04['events']['find']((_0xbb7410) => _0xbb7410['id'] === _0xc1a9ef);
  let _0x41d723;
  if (_0x377d96 === 'story' && _0x39dc82 === 'synopsis') _0x41d723 = _0x45ff04;
  if (
    _0x377d96 === 'character' &&
    ['name', 'description', 'identityNotes', 'role', 'roleEvidence', 'subjectType']['includes'](_0x39dc82)
  ) {
    if (_0x39dc82 === 'role' && !Object['hasOwn'](REPLICATION_CHARACTER_ROLES, _0x5ccd74)) return ![];
    if (_0x39dc82 === 'subjectType' && !Object['hasOwn'](REPLICATION_SUBJECT_TYPES, _0x5ccd74)) return ![];
    _0x41d723 = _0x45ff04['characters']['find']((_0x35b228) => _0x35b228['id'] === _0xc1a9ef);
  }
  if (_0x377d96 === 'event' && _0x39dc82 === 'visual') _0x41d723 = _0x181d1a;
  if (_0x377d96 === 'dialogue' && ['speakerId', 'text', 'uncertain']['includes'](_0x39dc82)) {
    _0x41d723 = _0x181d1a?.['dialogue']?.[Number(_0x4f3975)];
    if (
      _0x39dc82 === 'speakerId' &&
      _0x5ccd74 &&
      !_0x45ff04['characters']['some']((_0x2d92da) => _0x2d92da['id'] === _0x5ccd74)
    )
      return ![];
  }
  if (_0x377d96 === 'voiceover' && ['speakerId', 'text', 'uncertain', 'kind']['includes'](_0x39dc82)) {
    _0x41d723 = _0x181d1a?.['voiceover']?.[Number(_0x4f3975)];
    if (_0x39dc82 === 'kind' && !Object['hasOwn'](REPLICATION_VOICEOVER_KINDS, _0x5ccd74)) return ![];
    if (
      _0x39dc82 === 'speakerId' &&
      _0x5ccd74 &&
      !_0x45ff04['characters']['some']((_0x5a69d8) => _0x5a69d8['id'] === _0x5ccd74)
    )
      return ![];
  }
  if (!_0x41d723) return ![];
  const _0x17704f = _0x39dc82 === 'uncertain' ? _0x5ccd74 === !![] : String(_0x5ccd74 ?? '')['trim']();
  if (_0x41d723[_0x39dc82] === _0x17704f) return ![];
  if (_0x39dc82 === 'name' && !_0x17704f) return ![];
  _0x41d723[_0x39dc82] = _0x17704f;
  if (
    _0x377d96 === 'voiceover' &&
    ['kind', 'speakerId']['includes'](_0x39dc82) &&
    (_0x41d723['kind'] === 'uncertain' ||
      (_0x41d723['kind'] === 'inner_monologue' && !_0x41d723['speakerId']))
  )
    _0x41d723['uncertain'] = !![];
  return (commitSourceEdit(_0x2c9cc8, _0x25a782), !![]);
}
export function mergeStoryReplicationCharacters(_0xd9664a, _0x2e1a59, _0xd18863, _0x22c970) {
  const _0x39e0bd = _0x2e1a59?.['replication']?.['sourceAnalysis'];
  if (!canEdit(_0x2e1a59) || _0xd18863 === _0x22c970) return ![];
  const _0x197793 = _0x39e0bd['characters']['find']((_0x22c3f5) => _0x22c3f5['id'] === _0xd18863),
    _0x50e6fb = _0x39e0bd['characters']['find']((_0x578f53) => _0x578f53['id'] === _0x22c970);
  if (!_0x197793 || !_0x50e6fb) return ![];
  for (const _0x411ae2 of _0x39e0bd['events']) {
    ((_0x411ae2['characterIds'] = [
      ...new Set(
        _0x411ae2['characterIds']['map']((_0x49080e) => (_0x49080e === _0xd18863 ? _0x22c970 : _0x49080e)),
      ),
    ]),
      [..._0x411ae2['dialogue'], ...(_0x411ae2['voiceover'] || [])]['forEach']((_0x88d4a7) => {
        if (_0x88d4a7['speakerId'] === _0xd18863) _0x88d4a7['speakerId'] = _0x22c970;
      }));
  }
  ((_0x50e6fb['identityNotes'] = [_0x50e6fb['identityNotes'], _0x197793['identityNotes']]
    ['filter'](Boolean)
    ['join']('\x0a')),
    (_0x39e0bd['characters'] = _0x39e0bd['characters']['filter']((_0x5525e9) => _0x5525e9 !== _0x197793)));
  if (_0xd9664a['project']['replication']?.['characterBindings'])
    delete _0xd9664a['project']['replication']['characterBindings'][_0x2e1a59['id'] + ':' + _0xd18863];
  return (commitSourceEdit(_0xd9664a, _0x2e1a59), !![]);
}
export function addStoryReplicationCharacter(
  _0x4167d2,
  _0x3dd032,
  { timeSec: _0x1fc747, name: name = '新人物' } = {},
) {
  if (!canEdit(_0x3dd032)) return null;
  const _0x4a6891 = _0x3dd032['replication']['sourceAnalysis'],
    _0x14a1e1 = _0x4a6891['events']['find'](
      (_0x3f26d0) => Number(_0x1fc747) >= _0x3f26d0['startSec'] && Number(_0x1fc747) < _0x3f26d0['endSec'],
    );
  if (!_0x14a1e1) return null;
  let _0x579624 = 0x1;
  while (_0x4a6891['characters']['some']((_0x16c527) => _0x16c527['id'] === 'person-' + _0x579624))
    _0x579624 += 0x1;
  const _0x1ac095 = {
    id: 'person-' + _0x579624,
    name: String(name)['trim']() || '新人物',
    description: '',
    role: 'uncertain',
    subjectType: 'person',
    roleEvidence: '',
    identityNotes: '用户补录，请核对外观与出场片段',
    representativeTimeSec: Number(_0x1fc747),
  };
  return (
    _0x4a6891['characters']['push'](_0x1ac095),
    _0x14a1e1['characterIds']['push'](_0x1ac095['id']),
    commitSourceEdit(_0x4167d2, _0x3dd032),
    _0x1ac095
  );
}
export function removeStoryReplicationCharacter(_0x2a09db, _0x13faeb, _0x2ac43d) {
  if (!canEdit(_0x13faeb)) return ![];
  const _0x4ad451 = _0x13faeb['replication']['sourceAnalysis'];
  if (!_0x4ad451['characters']['some']((_0x4474dd) => _0x4474dd['id'] === _0x2ac43d)) return ![];
  _0x4ad451['characters'] = _0x4ad451['characters']['filter']((_0x36197b) => _0x36197b['id'] !== _0x2ac43d);
  for (const _0x17c4e7 of _0x4ad451['events']) {
    _0x17c4e7['characterIds'] = _0x17c4e7['characterIds']['filter']((_0x225746) => _0x225746 !== _0x2ac43d);
    for (const _0x1bce25 of [..._0x17c4e7['dialogue'], ...(_0x17c4e7['voiceover'] || [])])
      _0x1bce25['speakerId'] === _0x2ac43d &&
        ((_0x1bce25['speakerId'] = ''), (_0x1bce25['uncertain'] = !![]));
  }
  if (_0x2a09db['project']['replication']?.['characterBindings'])
    delete _0x2a09db['project']['replication']['characterBindings'][_0x13faeb['id'] + ':' + _0x2ac43d];
  return (commitSourceEdit(_0x2a09db, _0x13faeb), !![]);
}
export function setStoryReplicationCharacterPresence(
  _0x50b801,
  _0x48442d,
  { characterId: _0x3277ab, eventId: _0x129f04, present: _0x3637af } = {},
) {
  if (!canEdit(_0x48442d)) return ![];
  const _0x3b9ca3 = _0x48442d['replication']['sourceAnalysis'],
    _0x1fec11 = _0x3b9ca3['characters']['find']((_0x471862) => _0x471862['id'] === _0x3277ab),
    _0x1d9adf = _0x3b9ca3['events']['find']((_0x4e3b9b) => _0x4e3b9b['id'] === _0x129f04);
  if (!_0x1fec11 || !_0x1d9adf || _0x1d9adf['characterIds']['includes'](_0x3277ab) === _0x3637af) return ![];
  const _0xe5a85f = _0x3b9ca3['events']['filter'](
    (_0x368f64) => _0x368f64 !== _0x1d9adf && _0x368f64['characterIds']['includes'](_0x3277ab),
  );
  if (!_0x3637af && !_0xe5a85f['length']) return ![];
  return (
    (_0x1d9adf['characterIds'] = _0x3637af
      ? [..._0x1d9adf['characterIds'], _0x3277ab]
      : _0x1d9adf['characterIds']['filter']((_0x2399f9) => _0x2399f9 !== _0x3277ab)),
    !_0x3637af &&
      _0x1fec11['representativeTimeSec'] >= _0x1d9adf['startSec'] &&
      _0x1fec11['representativeTimeSec'] < _0x1d9adf['endSec'] &&
      ((_0x1fec11['representativeTimeSec'] = _0xe5a85f[0x0]['startSec']),
      delete _0x1fec11['frame'],
      delete _0x1fec11['portrait']),
    commitSourceEdit(_0x50b801, _0x48442d),
    !![]
  );
}
