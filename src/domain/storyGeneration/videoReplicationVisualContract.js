const text = (_0x4e2e7f) => (typeof _0x4e2e7f === 'string' ? _0x4e2e7f['trim']() : ''),
  spatialKeys = ['subject', 'landmark', 'relation', 'facing', 'pose', 'heldObject'],
  object = (_0x1d50f9) => ({
    type: 'object',
    additionalProperties: ![],
    required: Object['keys'](_0x1d50f9),
    properties: _0x1d50f9,
  }),
  string = { type: 'string' },
  array = (_0x11e686) => ({ type: 'array', items: _0x11e686 });
export function replicationVisualSchema() {
  const _0x111ab1 = object(Object['fromEntries'](spatialKeys['map']((_0x2055a2) => [_0x2055a2, string])));
  return {
    sceneKey: string,
    textElements: array(
      object({
        kind: { type: 'string', enum: ['physical', 'graphic', 'speech_subtitle', 'uncertain'] },
        text: string,
        carrier: string,
        placement: string,
      }),
    ),
    spatialStart: array(_0x111ab1),
    spatialEnd: array(_0x111ab1),
  };
}
export function normalizeReplicationVisualContract(_0x2aa874) {
  const _0x349f08 = {};
  if (Array['isArray'](_0x2aa874['textElements']))
    _0x349f08['textElements'] = _0x2aa874['textElements']['map']((_0x72d8c6) => ({
      kind: ['physical', 'graphic', 'speech_subtitle', 'uncertain']['includes'](_0x72d8c6?.['kind'])
        ? _0x72d8c6['kind']
        : 'uncertain',
      text: text(_0x72d8c6?.['text']),
      carrier: text(_0x72d8c6?.['carrier']),
      placement: text(_0x72d8c6?.['placement']),
    }));
  for (const _0x6fcaed of ['spatialStart', 'spatialEnd'])
    Array['isArray'](_0x2aa874[_0x6fcaed]) &&
      (_0x349f08[_0x6fcaed] = _0x2aa874[_0x6fcaed]['map']((_0x2fc24e) =>
        Object['fromEntries'](spatialKeys['map']((_0x3790f1) => [_0x3790f1, text(_0x2fc24e?.[_0x3790f1])])),
      ));
  return _0x349f08;
}
export function formatReplicationSpatial(_0x363c26 = []) {
  return _0x363c26['filter'](
    (_0x43d709) => _0x43d709['subject'] && _0x43d709['landmark'] && _0x43d709['relation'],
  )
    ['map'](
      (_0x4861a9) =>
        _0x4861a9['subject'] +
        '：' +
        _0x4861a9['landmark'] +
        _0x4861a9['relation'] +
        (_0x4861a9['facing'] ? '，朝向／视线：' + _0x4861a9['facing'] : '') +
        (_0x4861a9['pose'] ? '，姿态：' + _0x4861a9['pose'] : '') +
        (_0x4861a9['heldObject'] ? '，持物：' + _0x4861a9['heldObject'] : '') +
        '。',
    )
    ['join']('');
}
export function formatReplicationText(_0x4fc326 = [], _0x40c6e8 = ![]) {
  return _0x4fc326['filter'](
    (_0xde5223) =>
      _0xde5223['text'] && (_0x40c6e8 || _0xde5223['kind'] === 'physical' || _0xde5223['kind'] === 'graphic'),
  )
    ['map'](
      (_0x48b216) =>
        [_0x48b216['carrier'], _0x48b216['placement']]['filter'](Boolean)['join']('，') +
        '：“' +
        _0x48b216['text'] +
        '”',
    )
    ['join']('；');
}
