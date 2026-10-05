const text = (value) => String(value ?? '')['trim'](),
  present = (item) => item !== undefined && item !== null && item !== false && text(item) !== '';
export function validateRunningHubAudioParameters(key, index, args, result, list, list2) {
  if (index['promptRequired'] && !args) throw new Error('请填写生成文本');
  const enabled = index['rules'] || {},
    data = enabled['weightedChinesePrompt']
      ? [...args]['reduce'](
          (options, target) => options + (/\p{Script=Han}/u['test'](target) ? 2 : 1),
          0,
        )
      : [...args]['length'];
  if (index['promptMaxLength'] && data > index['promptMaxLength'])
    throw new Error(
      '生成文本超过 ' +
        index['promptMaxLength'] +
        ' 字符限制' +
        (enabled['weightedChinesePrompt'] ? '（汉字按 2 字符计）' : ''),
    );
  const source = Object['fromEntries'](
      (key['uiSchema']?.['fields'] || [])['map']((next) => [
        next['id'],
        result[next['id']] ?? next['defaultValue'],
      ]),
    ),
    handler = (current) =>
      key['uiSchema']?.['fields']?.['find']((entry) => entry['id'] === current)?.['label'] || current;
  for (const enabled2 of key['uiSchema']?.['fields'] || []) {
    const record = source[enabled2['id']];
    if (record === undefined || record === null || record === '') continue;
    if (enabled2['type'] === 'slider' || enabled2['type'] === 'stepper') {
      const payload = Number(record);
      if (
        !Number['isFinite'](payload) ||
        payload < enabled2['min'] ||
        payload > enabled2['max'] ||
        (enabled2['step'] === 1 && !Number['isInteger'](payload))
      )
        throw new Error(enabled2['label'] + '超出允许范围');
    }
    if (enabled2['maxLength'] && [...text(record)]['length'] > enabled2['maxLength'])
      throw new Error(enabled2['label'] + '最多 ' + enabled2['maxLength'] + ' 字符');
    if (
      enabled2['options'] &&
      !enabled2['options']['some']((el) => String(el['value'] ?? el) === String(record))
    )
      throw new Error(enabled2['label'] + '选项无效');
  }
  if (
    enabled['promptWhen'] &&
    source[enabled['promptWhen']['field']] === enabled['promptWhen']['value'] &&
    !args
  )
    throw new Error('请选择随机台词或填写台词文本');
  for (const handle of enabled['requiredFields'] || [])
    if (!text(source[handle]))
      throw new Error(
        '请填写' +
          (key['uiSchema']['fields']['find']((state) => state['id'] === handle)?.['label'] || handle),
      );
  for (const el2 of enabled['requiredWhen'] || [])
    if (source[el2['when']] === el2['value'] && !text(source[el2['field']]))
      throw new Error('请填写音色描述');
  for (const config of enabled['dependencies'] || [])
    if (present(source[config['field']]) && !text(source[config['requires']]))
      throw new Error('使用' + handler(config['field']) + '时需要填写' + handler(config['requires']));
  for (const [scope, input] of Object['entries'](enabled['minLengths'] || {}))
    if (text(source[scope]) && [...text(source[scope])]['length'] < input)
      throw new Error(handler(scope) + '至少需要 ' + input + ' 字符');
  for (const [output, value2] of Object['entries'](enabled['maxLines'] || {}))
    if (
      text(source[output])
        ['split'](/\r?\n/)
        ['filter']((value3) => value3['trim']())['length'] > value2
    )
      throw new Error('发音词典最多 ' + value2 + ' 条');
  if (
    enabled['customVoiceId'] &&
    !/^[A-Za-z](?=.*\d)[A-Za-z0-9_-]{7,}$/['test'](text(source['customVoiceId']))
  )
    throw new Error('新音色 ID 至少 8 字符，以字母开头并包含数字');
  for (const value4 of ['audio', 'image']) {
    const list3 = value4 === 'audio' ? list : list2,
      value5 = Number(key['inputSlots']?.['maxByKind']?.[value4] || 0);
    if (list3['length'] > value5)
      throw new Error('最多支持 ' + value5 + ' 个' + (value4 === 'audio' ? '音频' : '图片') + '输入');
    const value6 = (key['inputSlots']?.['fixedSlots'] || [])['filter']((value7) => value7['kind'] === value4);
    for (const value8 of value6)
      if (value8['required'] && !list3['some']((value9) => value9['refSlot'] === value8['id']))
        throw new Error('请连接' + value8['label']);
    if (list3['some']((response) => !response['url']))
      throw new Error('参考' + (value4 === 'audio' ? '音频' : '图片') + '尚无可用文件');
  }
  const map = new Set();
  for (const response2 of list) {
    if (!response2['url']) throw new Error('参考音频地址为空');
    if (map['has'](response2['refSlot'])) throw new Error('同一个参考槽不能连接多个音频');
    map['add'](response2['refSlot']);
    const value10 = response2['fileName'] || text(response2['url'])['split'](/[?#]/)[0],
      value11 = value10['match'](/\.([a-z0-9]+)$/i)?.[1]?.['toLowerCase']();
    if (enabled['audioExtensions'] && value11 && !enabled['audioExtensions']['includes'](value11))
      throw new Error('参考音频只支持 ' + enabled['audioExtensions']['join']('、'));
    if (
      enabled['maxAudioBytes'] &&
      Number(response2['size'] || response2['fileSize']) > enabled['maxAudioBytes']
    )
      throw new Error('参考音频不能超过 10 MB');
    const count = Number(response2['audioDuration'] || response2['duration']);
    if (
      enabled['audioDuration'] &&
      count > 0 &&
      (count < enabled['audioDuration']['min'] || count > enabled['audioDuration']['max'])
    )
      throw new Error('原曲长度必须在 6 秒到 6 分钟之间');
  }
  const value12 = Object['fromEntries'](list['map']((value13) => [value13['refSlot'], value13]));
  for (const value14 of index['preparations'] || []) {
    if (value14['resultType'] === 'id' && value12[value14['slot']] && text(source[value14['targetField']]))
      throw new Error('同一参考素材请选择连接音频或填写已有 ID，不能同时使用');
  }
  if (
    enabled['exclusiveInputs'] &&
    [present(source['speaker']), list['length'] > 0, list2['length'] > 0]['filter'](Boolean)['length'] >
      1
  )
    throw new Error('音色 ID、参考音频和参考图片只能选一种');
  if (enabled['controlMode'] === 'murekaBgm') {
    const present2 = present(source['instrumentalId']) || Boolean(value12['instrumental']);
    if (Boolean(args) === Boolean(present2))
      throw new Error('伴奏生成需要选择风格描述或参考伴奏，二者不能同时使用');
  }
  if (enabled['controlMode'] === 'murekaSong') {
    const present3 = present(source['stylePrompt']),
      present4 = present(source['referenceId']) || Boolean(value12['reference']),
      present5 = present(source['vocalId']) || Boolean(value12['vocal']),
      present6 = present(source['melodyId']) || Boolean(value12['melody']);
    if (present6 && (present3 || present4 || present5))
      throw new Error('旋律参考不能与风格、歌曲参考或人声参考混用');
    if (present3 && present4) throw new Error('歌曲风格描述和参考歌曲只能选一种');
  }
}
