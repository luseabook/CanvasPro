import {
  normalizeStoryMinimaxH3OfficialTags,
  STORY_MINIMAX_H3_DIEGETIC_SOUND_LABEL,
} from './storyPromptModes.js';
function normalizeText(value) {
  return String(value || '').trim();
}
function ensureSentence(item = '') {
  const text = normalizeText(item);
  if (!text || /[.!?;:。！？；：]$/u.test(text)) return text;
  return text + '.';
}
function getPlanningRef(options = {}) {
  return normalizeText(options?.planningRef || options?.ref || options?.id);
}
function addLookupEntry(map, key, index) {
  const text2 = normalizeText(key);
  if (!text2) return;
  if (map.has(text2) && map.get(text2) !== index) {
    map.set(text2, null);
    return;
  }
  map.set(text2, index);
}
function buildAssetLookup(list = []) {
  const result = new Map();
  return (
    (Array.isArray(list) ? list : []).forEach((data) => {
      (addLookupEntry(result, getPlanningRef(data), data), addLookupEntry(result, data?.id, data));
    }),
    result
  );
}
function resolveAssetUsage(options2 = {}, target = new Map()) {
  const text3 = normalizeText(options2?.assetRef),
    text4 = normalizeText(options2?.appearanceRef),
    enabled = target.get(text3) || null;
  if (!enabled) return null;
  const list2 = Array.isArray(enabled?.appearances) ? enabled.appearances : [],
    source = new Map();
  list2.forEach((next) => {
    (addLookupEntry(source, getPlanningRef(next), next), addLookupEntry(source, next?.id, next));
  });
  const current = text4 || normalizeText(enabled?.baseAppearanceId) || getPlanningRef(list2[0]),
    enabled2 = current ? source.get(current) || null : list2[0] || null;
  if (current && !enabled2) return null;
  return { assetRef: text3, appearanceRef: current, asset: enabled, appearance: enabled2 };
}
function normalizeAssetUsages(list3 = []) {
  const map2 = new Set();
  return (Array.isArray(list3) ? list3 : []).filter((entry) => {
    const text5 = normalizeText(entry?.assetRef),
      text6 = normalizeText(entry?.appearanceRef),
      record = text5 + '\x00' + text6;
    if (!text5 || map2.has(record)) return false;
    return (map2.add(record), true);
  });
}
function buildReferenceSubjects(list4 = [], payload = []) {
  const assetLookup = buildAssetLookup(payload),
    map3 = new Map(),
    list5 = [];
  return (
    (Array.isArray(list4) ? list4 : []).forEach((handle, state) => {
      normalizeAssetUsages(handle?.assetUsages).forEach((config) => {
        const args = resolveAssetUsage(config, assetLookup);
        if (!args) return;
        const scope = args.assetRef;
        let enabled3 = map3.get(scope);
        if (!enabled3) {
          const text7 = normalizeText(args.asset?.name) || args.assetRef;
          ((enabled3 = {
            ...args,
            index: list5.length + 1,
            label: '<Subject ' + (list5.length + 1) + '>',
            assetName: text7,
            mentions: [],
            shotNumbers: new Set(),
          }),
            map3.set(scope, enabled3),
            list5.push(enabled3));
        }
        const text8 = normalizeText(args.appearance?.name) || '基础形象',
          input = '@' + enabled3.assetName + ' · ' + text8;
        if (!enabled3.mentions.includes(input)) enabled3.mentions.push(input);
        enabled3.shotNumbers.add(state + 1);
      });
    }),
    list5
  );
}
function buildSubjectDefinition(output) {
  const value2 = output.mentions.join('、');
  if (output.asset?.kind === 'scene')
    return (
      output.label +
      ' 是场景 ' +
      output.assetName +
      '，由参考素材 ' +
      value2 +
      ' 定义；保持空间布局、固定地标、出入口、材质与光线方向一致。'
    );
  if (output.asset?.kind === 'prop')
    return (
      output.label +
      ' 是道具 ' +
      output.assetName +
      '，由参考素材 ' +
      value2 +
      ' 定义；保持轮廓、比例、材质、颜色与开场状态一致。'
    );
  return (
    output.label +
    ' 是角色 ' +
    output.assetName +
    '，由参考素材 ' +
    value2 +
    ' 定义；保持身份、五官、发型、身体比例与服装一致。如绑定音频参考，只用于该角色的声线、语气与说话方式。'
  );
}
function buildSubjectRetention(args2) {
  const value3 = [...args2.shotNumbers].map((value4) => '[Shot ' + value4 + ']').join(', '),
    value5 =
      args2.asset?.kind === 'scene'
        ? '已建立的环境、布局、地标、材质与光线方向保持一致'
        : args2.asset?.kind === 'prop'
          ? '已建立的造型、材质、尺度与状态保持一致'
          : '已建立的身份、外观、身体比例与服装保持一致';
  return args2.label + '（出现在 ' + value3 + '）：fully_preserved - ' + value5 + '。';
}
function formatCutTimestamp(value6) {
  const value7 = Math.max(0, Math.round(Number(value6 || 0) * 1000)),
    value8 = Math.floor(value7 / 60000),
    value9 = (value7 % 60000) / 1000;
  return String(value8).padStart(2, '0') + ':' + value9.toFixed(3).padStart(6, '0');
}
function stripDialogueOuterQuotes(value10 = '') {
  let text9 = normalizeText(value10);
  return (
    [
      ['“', '”'],
      ['"', '"'],
    ].forEach(([list6, value11]) => {
      text9.startsWith(list6) &&
        text9.endsWith(value11) &&
        (text9 = text9.slice(list6.length, -value11.length).trim());
    }),
    text9
  );
}
function parseDialogueTurns(value12 = '') {
  const list7 = normalizeText(value12);
  if (!list7) return [];
  const value13 = /(^|[\n。！？!?；;][”"]?)\s*([^：:\n。！？!?；;“”"]{1,24})[：:]\s*/gu,
    list8 = [...list7.matchAll(value13)];
  if (!list8.length || normalizeText(list7.slice(0, list8[0].index)))
    return [{ speaker: '', content: stripDialogueOuterQuotes(list7) }];
  return list8.map((value14, value15) => {
    const value16 = list8[value15 + 1],
      value17 = Number(value14.index || 0) + value14[0].length,
      value18 = value16
        ? Number(value16.index || 0) + String(value16[1] || '').length
        : list7.length;
    return {
      speaker: normalizeText(value14[2]),
      content: stripDialogueOuterQuotes(list7.slice(value17, value18)),
    };
  }).filter((value19) => value19.content);
}
function detectDialogueLanguage(value20 = '') {
  return 'Chinese';
}
function resolveCharacterSubject(value21 = '', value22 = [], enabled4 = 0) {
  const text10 = normalizeText(value21),
    list9 = value22.filter(
      (value23) =>
        value23.asset?.kind === 'character' && (!enabled4 || value23.shotNumbers.has(enabled4)),
    ),
    value24 = list9.find((value25) => value25.assetName === text10);
  if (value24) return value24;
  const value26 = text10
    ? list9.find(
        (value27) => text10.startsWith(value27.assetName) || value27.assetName.endsWith(text10),
      )
    : null;
  if (value26) return value26;
  return !text10 && list9.length === 1 ? list9[0] : null;
}
function buildSpeakerRegistry(list10 = [], value28 = []) {
  const map4 = new Map(),
    handler = (value29, value30, value31) => {
      const characterSubject = resolveCharacterSubject(value29, value28, value30),
        value32 = characterSubject?.label || normalizeText(value29) || value31 + ':anonymous';
      if (!map4.has(value32)) map4.set(value32, 'S' + (map4.size + 1));
      return { id: map4.get(value32), subject: characterSubject };
    };
  return (
    list10.forEach((value33, value34) => {
      (parseDialogueTurns(value33?.dialogue).forEach((value35) => {
        handler(value35.speaker, value34 + 1, 'dialogue');
      }),
        parseDialogueTurns(value33?.voiceover).forEach((value36) => {
          handler(value36.speaker, value34 + 1, 'voiceover');
        }));
    }),
    { speakers: map4, ensureSpeaker: handler }
  );
}
function buildShotReferenceApplication(list11 = [], value37 = 0) {
  return list11.filter((value38) => value38.shotNumbers.has(value37))
    .map((value39) => {
      if (value39.asset?.kind === 'scene')
        return '镜头发生在 ' + value39.label + ' 中，完整保留参考场景。';
      if (value39.asset?.kind === 'prop')
        return value39.label + ' 作为参考道具出现在画面中，保持已建立的造型与状态。';
      return value39.label + ' 作为画面角色出现，完整保留参考身份与外观。';
    })
    .join(' ');
}
function buildDialogueDescription(value40, value41, value42, value43, { voiceover: voiceover = false } = {}) {
  const value44 = value42.ensureSpeaker(value40.speaker, value41, voiceover ? 'voiceover' : 'dialogue'),
    value45 =
      value44.subject?.label ||
      (normalizeText(value40.speaker) ? '角色' + normalizeText(value40.speaker) : '说话人'),
    value46 = '<d>[' + detectDialogueLanguage(value40.content) + '] ' + value40.content + '</d>';
  if (voiceover)
    return value44.subject
      ? value45 +
          ' (' +
          value44.id +
          ') 以画外音说：' +
          value46 +
          '，同时 ' +
          value45 +
          ' 的嘴唇始终闭合。'
      : value45 +
          ' (' +
          value44.id +
          ') 以画外音说：' +
          value46 +
          '，画面内任何角色都不对这段画外音做口型。';
  return value45 + ' (' + value44.id + ') 说：' + value46;
}
function isNonDiegeticMusic(value47 = '') {
  return /(?:non[- ]?diegetic|background music|musical score|\bBGM\b|配乐|背景音乐)/iu.test(value47);
}
function buildAudioSections(list12 = []) {
  const value48 = [],
    value49 = [];
  return (
    list12.forEach((value50) => {
      const text11 = normalizeText(value50?.audio);
      if (!text11) return;
      (isNonDiegeticMusic(text11) ? value49 : value48).push(ensureSentence(text11));
    }),
    {
      overallSoundscape: value48.length
        ? [...new Set(value48)].slice(0, 4).join(' ')
        : '只保留镜头描述中明确同步的声音，不新增其他声音事件。',
      nonDiegeticMusic: value49.length ? [...new Set(value49)].slice(0, 3).join(' ') : '无',
    }
  );
}
function buildDetailedDescription({
  shots: shots = [],
  subjects: subjects = [],
  transition: transition = '',
} = {}) {
  const speakerRegistry = buildSpeakerRegistry(shots, subjects);
  let value51 = 0;
  return shots.map((value52, count) => {
    const value53 = count + 1,
      value54 =
        count === 0
          ? '[Shot ' + value53 + ']'
          : '[Shot ' + value53 + '] At ' + formatCutTimestamp(value51) + '，镜头切换为新镜头。',
      text12 =
        normalizeText(value52?.transitionFromPrevious) ||
        (count === 1 ? normalizeText(transition) : ''),
      value55 = [
        value54,
        buildShotReferenceApplication(subjects, value53),
        text12 ? '转场遵循以下连续性要求：' + ensureSentence(text12) : '',
        ensureSentence(value52?.camera),
        ensureSentence(value52?.visual),
        ...parseDialogueTurns(value52?.dialogue).map((value56) =>
          buildDialogueDescription(value56, value53, speakerRegistry, subjects),
        ),
        ...parseDialogueTurns(value52?.voiceover).map((value57) =>
          buildDialogueDescription(value57, value53, speakerRegistry, subjects, { voiceover: true }),
        ),
        normalizeText(value52?.audio) && !isNonDiegeticMusic(value52.audio)
          ? STORY_MINIMAX_H3_DIEGETIC_SOUND_LABEL + '：' + ensureSentence(value52.audio)
          : '',
      ].filter(Boolean);
    return ((value51 += Number(value52?.durationSec || 0)), value55.join('\n'));
  }).join('\n\n');
}
function buildReferenceSummary(list13 = [], value58 = 0, count2 = 0) {
  const value59 = list13.map((value60) => value60.label).join('、');
  return [
    '[reference generation] 目标为一个 ' +
      value58 +
      ' 秒、' +
      (count2 === 1 ? '单镜头' : count2 + ' 镜头') +
      '的叙事视频。',
    value59 ? '使用 ' + value59 + ' 作为可复用视觉参考，并按照规划的动作、表演、镜头与声音进程执行。' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
export function buildStoryMinimaxH3Prompt({ clip: clip = {}, shots: shots = [], assets: assets = [] } = {}) {
  const referenceSubjects = buildReferenceSubjects(shots, assets),
    detailedDescription = buildDetailedDescription({
      shots: shots,
      subjects: referenceSubjects,
      transition: clip?.transition,
    }),
    { overallSoundscape: overallSoundscape, nonDiegeticMusic: nonDiegeticMusic } = buildAudioSections(shots);
  if (!referenceSubjects.length)
    return normalizeStoryMinimaxH3OfficialTags(
      [
        'integrated_multimodal_description: ' + detailedDescription,
        'overall_soundscape: ' + overallSoundscape,
        'non_diegetic_music: ' + nonDiegeticMusic,
      ].join('\n\n'),
    );
  const value61 = shots.reduce(
    (value62, value63) => value62 + Number(value63?.durationSec || 0),
    0,
  );
  return normalizeStoryMinimaxH3OfficialTags(
    [
      'subject_definitions:\n' + referenceSubjects.map(buildSubjectDefinition).join('\n'),
      'summary:\n' + buildReferenceSummary(referenceSubjects, value61, shots.length),
      'retention_analysis:\n' + referenceSubjects.map(buildSubjectRetention).join('\n'),
      'detailed_description:\n' + detailedDescription,
      'overall_soundscape:\n' + overallSoundscape,
      'non_diegetic_music:\n' + nonDiegeticMusic,
    ].join('\n\n'),
  );
}
