const text = (value) => (typeof value === 'string' ? value['trim']() : ''),
  spatialKeys = ['subject', 'landmark', 'relation', 'facing', 'pose', 'heldObject'],
  object = (properties) => ({
    type: 'object',
    additionalProperties: false,
    required: Object['keys'](properties),
    properties: properties,
  }),
  string = { type: 'string' },
  array = (items) => ({ type: 'array', items: items });
export function replicationVisualSchema() {
  const object2 = object(Object['fromEntries'](spatialKeys['map']((item) => [item, string])));
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
    spatialStart: array(object2),
    spatialEnd: array(object2),
  };
}
export function normalizeReplicationVisualContract(key) {
  const index = {};
  if (Array['isArray'](key['textElements']))
    index['textElements'] = key['textElements']['map']((response) => ({
      kind: ['physical', 'graphic', 'speech_subtitle', 'uncertain']['includes'](response?.['kind'])
        ? response['kind']
        : 'uncertain',
      text: text(response?.['text']),
      carrier: text(response?.['carrier']),
      placement: text(response?.['placement']),
    }));
  for (const result of ['spatialStart', 'spatialEnd'])
    Array['isArray'](key[result]) &&
      (index[result] = key[result]['map']((data) =>
        Object['fromEntries'](spatialKeys['map']((options) => [options, text(data?.[options])])),
      ));
  return index;
}
export function formatReplicationSpatial(list = []) {
  return list['filter']((target) => target['subject'] && target['landmark'] && target['relation'])
    ['map'](
      (source) =>
        source['subject'] +
        '：' +
        source['landmark'] +
        source['relation'] +
        (source['facing'] ? '，朝向／视线：' + source['facing'] : '') +
        (source['pose'] ? '，姿态：' + source['pose'] : '') +
        (source['heldObject'] ? '，持物：' + source['heldObject'] : '') +
        '。',
    )
    ['join']('');
}
export function formatReplicationText(list2 = [], next = false) {
  return list2['filter'](
    (response2) =>
      response2['text'] && (next || response2['kind'] === 'physical' || response2['kind'] === 'graphic'),
  )
    ['map'](
      (response3) =>
        [response3['carrier'], response3['placement']]['filter'](Boolean)['join']('，') +
        '：“' +
        response3['text'] +
        '”',
    )
    ['join']('；');
}
