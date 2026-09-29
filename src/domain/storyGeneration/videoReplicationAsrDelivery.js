import { getReplicationEventSpeech } from './videoReplicationSpeechOrder.js';
import { isStorySeedance25PromptMode } from './promptModes.js';
import {
  findReplicationSpeechBlock,
  groupContinuousReplicationVoiceover,
} from './videoReplicationSpeechLayout.js';
import { separateReplicationGeneratedFields } from './videoReplicationFieldLayout.js';
import { projectReplicationObservedShots } from './videoReplicationVisualDelivery.js';
export function usesOriginalAsrSpeech(_0x2ef191, _0x36b4b6 = {}) {
  if (!_0x2ef191['replication']?.['sourceAnalysis']?.['speechEvidence']) return ![];
  const _0x32db90 =
      _0x2ef191['replication']['targetLocale'] || _0x36b4b6['replication']?.['targetLocale'] || 'source',
    _0x4c2f1a = _0x2ef191['replication']['sourceAnalysis']['sourceLanguage'];
  return (
    _0x32db90 === 'source' ||
    _0x32db90 === _0x4c2f1a ||
    (_0x32db90 === 'zh-CN' && /^(zh(?:-CN|-Hans)?|Chinese|中文|普通话|汉语)$/iu['test'](_0x4c2f1a))
  );
}
export function applyReplicationAsrDelivery(_0x283505, _0x37bb03, _0x2bb71f = {}, _0x3280db = []) {
  if (!usesOriginalAsrSpeech(_0x37bb03, _0x2bb71f) || !Array['isArray'](_0x283505?.['clips']))
    return _0x283505;
  const _0xfac856 = _0x37bb03['replication']['sourceAnalysis']['characters'] || [];
  return {
    ..._0x283505,
    clips: _0x283505['clips']['map']((_0x3326b8) => {
      const _0x3e1df2 = _0x37bb03['replication']['segmentPlan']?.['find'](
        (_0x443c36) => _0x443c36['ref'] === _0x3326b8['ref'],
      );
      if (!_0x3e1df2 || !_0x3326b8['shots']?.['length']) return _0x3326b8;
      const _0x249557 = _0x3e1df2['events']
        ['flatMap']((_0x2dce7d) => getReplicationEventSpeech(_0x2dce7d) || [])
        ['sort']((_0x245e70, _0x144eb2) => _0x245e70['startSec'] - _0x144eb2['startSec']);
      if (_0x249557['some']((_0x2e8e44) => _0x2e8e44['timingSource'] !== 'asr')) return _0x3326b8;
      let _0x3a3efc = 0x0;
      const _0x1adb48 = projectReplicationObservedShots(_0x3326b8, _0x3e1df2, {
          episode: _0x37bb03,
          project: _0x2bb71f,
          assets: _0x3280db,
        }),
        _0x18fea5 = _0x1adb48['map']((_0x1c3060) => {
          const _0x19b35c = _0x3a3efc;
          return (
            (_0x3a3efc += Number(_0x1c3060['durationSec'])),
            {
              ...separateReplicationGeneratedFields(
                _0x1c3060,
                _0x249557['map']((_0x183522) => _0x183522['text'])['join'](''),
              ),
              startSec: _0x19b35c,
              endSec: _0x3a3efc,
              dialogue: '',
              voiceover: '',
            }
          );
        }),
        _0x183214 = isStorySeedance25PromptMode(
          _0x3326b8['promptMode'] || _0x2bb71f['planning']?.['promptMode'],
        ),
        _0x5a1562 = _0x183214 ? Math['round'] : (_0x312bdf) => _0x312bdf,
        _0x51148a = _0x249557['map']((_0x15912f) => {
          const _0x2e93c2 = Math['max'](0x0, _0x15912f['startSec'] - _0x3e1df2['sourceStartSec']),
            _0x4ff0f1 = _0xfac856['find']((_0x21d0f7) => _0x21d0f7['id'] === _0x15912f['speakerId']),
            _0x5f01a0 =
              _0x2bb71f['replication']?.['characterBindings']?.[
                _0x37bb03['id'] + ':' + _0x15912f['speakerId']
              ],
            _0x1ea7d5 = _0x3280db['find'](
              (_0x580f60) =>
                _0x580f60['kind'] === 'character' &&
                (_0x580f60['id'] === _0x5f01a0 ||
                  (!_0x5f01a0 && _0x580f60['replicationSource']?.['ref'] === _0x15912f['speakerId'])),
            ),
            _0x2be65d = _0x1ea7d5?.['name'] || _0x4ff0f1?.['name'] || '',
            _0xd1c53a =
              _0x15912f['kind'] === 'dialogue'
                ? _0x2be65d || '说话人待核对'
                : _0x2be65d
                  ? '旁白（' + _0x2be65d + '）'
                  : '旁白';
          return {
            startSec: _0x2e93c2,
            endSec: _0x15912f['endSec'] - _0x3e1df2['sourceStartSec'],
            shotIndex: findReplicationSpeechBlock(
              _0x18fea5,
              _0x2e93c2,
              _0x5a1562,
              0x0,
              _0x15912f['endSec'] - _0x3e1df2['sourceStartSec'],
            ),
            parts: [
              {
                kind: _0x15912f['kind'],
                speakerId: _0x15912f['speakerId'],
                speakerLabel: _0xd1c53a,
                text: _0x15912f['text'],
              },
            ],
          };
        });
      for (const [_0x710511, _0x50807b] of _0x18fea5['entries']()) {
        const _0x45e9e7 = _0x51148a['filter']((_0x25640c) => _0x25640c['shotIndex'] === _0x710511),
          _0x17c775 = _0x183214
            ? groupContinuousReplicationVoiceover(_0x45e9e7, _0x51148a, _0x5a1562, (_0x410f08) =>
                _0x410f08['speakerId'] ? _0x410f08['speakerLabel'] : '',
              )
            : _0x45e9e7;
        for (const { parts: _0x14c6b5 } of _0x17c775)
          for (const _0x35fa73 of _0x14c6b5) {
            _0x50807b[_0x35fa73['kind']] = [
              _0x50807b[_0x35fa73['kind']],
              _0x35fa73['speakerLabel'] + '：' + _0x35fa73['text'],
            ]
              ['filter'](Boolean)
              ['join']('\x0a');
          }
      }
      return { ..._0x3326b8, durationSec: _0x3a3efc, shots: _0x18fea5 };
    }),
  };
}
