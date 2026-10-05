import { REPLICATION_CHARACTER_ROLES, REPLICATION_SUBJECT_TYPES } from './videoReplicationCharacters.js';
import { getReplicationSegmentPlanGuidance } from './videoReplicationSegmentPlan.js';
import {
  getVideoReplicationAudioLanguage,
  buildVideoReplicationAudioLanguageRule,
} from './videoReplicationLanguage.js';
import {
  buildVideoReplicationGenerationAssets,
  REPLICATION_IMAGE_APPEARANCE_GUIDANCE,
} from './videoReplicationGenerationAssets.js';
import {
  REPLICATION_VOICEOVER_KINDS,
  normalizeReplicationVoiceover,
  formatReplicationVoiceover,
} from './videoReplicationSpeech.js';
import {
  buildVideoReplicationSpeechPolicy,
  REPLICATION_SPEECH_ROUTING_GUIDANCE,
} from './videoReplicationSpeechPolicy.js';
import { getReplicationEventSpeech } from './videoReplicationSpeechOrder.js';
import { normalizeReplicationObservedShots } from './videoReplicationShotEvidence.js';
import {
  REPLICATION_VISUAL_ELEMENTS_RULE,
  REPLICATION_VISUAL_STATE_RULE,
} from './videoReplicationVisualState.js';
import { replicationVisualSchema } from './videoReplicationVisualContract.js';
import {
  REPLICATION_CONTENT_TYPES,
  REPLICATION_CONTENT_ROUTING_RULE,
  normalizeReplicationContentType,
} from './videoReplicationContentRouting.js';
import { REPLICATION_SOURCE_SPEECH_RULE, REPLICATION_TIMELINE_RULE } from './videoReplicationPromptPolicy.js';
const text = (value) => String(value ?? '')['trim'](),
  string = { type: 'string' },
  strings = { type: 'array', items: string },
  object = (item) => ({
    type: 'object',
    additionalProperties: false,
    required: Object['keys'](item),
    properties: item,
  });
export function getVideoReplicationDialogueSummary(key) {
  const index = (key?.['events'] || [])['flatMap']((result) => result['dialogue'] || []),
    list = index['filter'](
      (response) =>
        text(response['text']) &&
        !/^\[?\s*(?:听不清|无法听清|无法辨认|不可辨认)/u['test'](text(response['text'])),
    ),
    data = (key?.['events'] || [])
      ['flatMap']((options) => options['voiceover'] || [])
      ['filter'](
        (response2) =>
          text(response2['text']) &&
          !/^\[?\s*(?:听不清|无法听清|无法辨认|不可辨认)/u['test'](text(response2['text'])),
      ),
    target =
      list['filter']((enabled) => enabled['uncertain'] || !enabled['speakerId'])['length'] +
      data['filter']((source) => source['uncertain'])['length'];
  return {
    total: list['length'] + data['length'],
    voiceoverTotal: data['length'],
    pending: target,
    label: data['length']
      ? '对白 ' +
        list['length'] +
        ' 句 · 解说／独白 ' +
        data['length'] +
        ' 句' +
        (target ? ' · ' + target + ' 句待核对' : '')
      : list['length']
        ? '对白 ' + list['length'] + ' 句' + (target ? ' · ' + target + ' 句待核对' : '')
        : '本次分析未返回可用人声文案',
  };
}
export function createVideoReplicationSourceOutput({ durationSec: durationSec = 0 } = {}) {
  const next = {
    type: 'number',
    minimum: 0,
    ...(Number(durationSec) > 0 ? { maximum: Number(durationSec) } : {}),
    description: '视频起点后的绝对秒数；1分05秒为65，不是105。',
  };
  return {
    name: 'video_replication_source_analysis',
    strict: true,
    fallback: 'prompt',
    schema: object({
      videoObserved: { type: 'boolean' },
      observationError: string,
      title: string,
      synopsis: string,
      sourceLanguage: string,
      contentType: { type: 'string', enum: REPLICATION_CONTENT_TYPES },
      contentTypeReason: string,
      characters: {
        type: 'array',
        items: object({
          id: string,
          name: string,
          description: string,
          visualPrompt: { type: 'string', minLength: 1 },
          identityNotes: string,
          role: { type: 'string', enum: Object['keys'](REPLICATION_CHARACTER_ROLES) },
          subjectType: { type: 'string', enum: Object['keys'](REPLICATION_SUBJECT_TYPES) },
          roleEvidence: string,
          representativeTimeSec: next,
        }),
      },
      events: {
        type: 'array',
        minItems: 1,
        items: object({
          id: string,
          startSec: next,
          endSec: next,
          visual: string,
          camera: string,
          sound: string,
          characterIds: strings,
          dialogue: {
            type: 'array',
            items: object({ speakerId: string, text: string, uncertain: { type: 'boolean' } }),
          },
          voiceover: {
            type: 'array',
            items: object({
              kind: { type: 'string', enum: Object['keys'](REPLICATION_VOICEOVER_KINDS) },
              speakerId: string,
              text: string,
              uncertain: { type: 'boolean' },
            }),
          },
          speechOrder: strings,
          shots: {
            type: 'array',
            minItems: 1,
            items: object({
              id: string,
              startSec: next,
              endSec: next,
              visual: string,
              camera: string,
              speechRefs: strings,
              ...replicationVisualSchema(),
            }),
          },
          uncertainties: strings,
        }),
      },
    }),
  };
}
export function buildVideoReplicationSourcePrompt({ durationSec: durationSec = 0 } = {}) {
  return [
    '必须实际读取所附视频的画面后才能设置 videoObserved=true。未收到视频、链接无法读取或接口不支持视频时，设置 videoObserved=false，并在 observationError 说明原因；禁止把无法读取视频当成无人场景或成功分析。',
    '先理解整段原视频，再按时间顺序整理完整故事、可区分的主体、动作、镜头和对白。只记录原片事实，不翻译、不本地化、不换人物、不编写视频生成提示词；characters.visualPrompt 仅整理原片可观察的角色外观，供独立人设图使用。',
    '原片时长 ' +
      (Number(durationSec) || 0) +
      ' 秒。events 按剧情顺序记录关键动作、镜头和完整对白，时间用原片绝对秒数的大致范围，不按固定15秒截断。时间只用于定位和核对，不要求逐秒对齐或首尾精确衔接，允许事件间有空隙或时间范围重叠。',
    '完整观看原片，覆盖人物、产品、场景、动作与所有可见元素，包括无人声时段、停顿与片尾文字；不要为填满时长虚构事件或拉长时间。未看清、听不清或无法确认的内容写入疑点供用户核对。',
    REPLICATION_CONTENT_ROUTING_RULE,
    REPLICATION_VISUAL_ELEMENTS_RULE,
    REPLICATION_VISUAL_STATE_RULE,
    '说明性文字用简体中文；对白原语言逐句保留。听不清的对白写[听不清]并标记 uncertain；禁止补写猜测的台词。',
    REPLICATION_SOURCE_SPEECH_RULE,
    '优先保全人声文字：能听清的部分逐字保留，只有听不清的局部用[听不清]占位，不用一个占位符替换整句，不丢掉前后已听清的字。即使转写可能有错，也保留当前识别文字并标 uncertain 供用户修改；不要因存疑省略整句或改写成摘要。',
    '逐镜时间尽量保留真实小数切点，不能为方便把每个切点先取整或均分时长。',
    '每个剧情事件内另列 shots，逐个记录实际可见镜头的 id、原片绝对起止秒、画面 visual、景别与运镜 camera。真实切镜、场景切换分别记录，不捏造连续运镜串起不同镜头；真正的一镜到底保留一个 shot。镜头时间在所属事件内按序不重叠，可近似定位，不凭空制造切点。shots[].speechRefs 用 ["voiceover:0"] 或 ["dialogue:0"] 关联当前镜头发生的人声；跨镜人声可重复引用但不重复转写，每句至少关联一个镜头，无人声镜头为空数组。画外音不能代替画面镜头记录。',
    'speechOrder 按实际发言顺序引用当前事件的数组下标，如 ["voiceover:0","dialogue:0","voiceover:1"]。每句恰好引用一次；无人声返回空数组。画外音被人物对白打断后继续时必须拆成两条 voiceover，禁止跨过对白合并，也禁止按声音类型重新排序。',
    '确认事件没有人声时 dialogue 与 voiceover 都返回空数组；听不清时仅在未知局部写[听不清]并标 uncertain。不能确定声音类型或说话人时，保留已识别原话并标 uncertain，不用[听不清]替换听清的文字，不得用空数组冒充无人声。',
    'voiceover.text 逐句保留实际原话，不用‘画外音自述’等摘要替代。独立解说员 speakerId 为空是合法情况，不因此标记听不清；只有证据确认角色本人在叙述时才绑定角色。同一事件允许对白与解说交替，用 speechOrder 保持顺序，同一句只记录在一个声音通道。',
    '所有事件时间必须处于视频实际时长' +
      (Number(durationSec) > 0 ? '（0 到 ' + Number(durationSec) + ' 秒）' : '') +
      '以内，禁止把分秒格式写成十进制秒（如 1分20秒应写80秒，不是120秒）。返回前逐段核对开头、中段、结尾的人声是否遗漏；听不清的解说保留[听不清]并标记 uncertain。',
    'characters 记录画面中可区分的人物或动物，使用稳定 id（如 person-1）。不认识姓名可用红衣人物等可观察称呼；不得猜测真实身份或无依据的亲属关系。',
    '同一主体跨镜头沿用 id。服装变化不等于新人，衣服相同不证明同一人；无法确认的保持分开，在 identityNotes 和相关事件 uncertainties 写清疑点。',
    '先通看全片建立角色名单，再逐镜头核对是否漏人或把同一角色重复计数。characters 是全片去重后的可区分角色，不是单帧人数；背景人群无法逐个辨认时在 uncertainties 说明，不虚构个人。镜子、照片和屏幕中的同一主体不重复计数。',
    'role 根据全片故事功能标为 main（主角，可有多位）、supporting（配角）、background（背景人物）或 uncertain（待确认）；roleEvidence 写明推动哪些事件或承担什么叙事作用，不能仅按出场时间或画面中心判断。subjectType 区分 person、animal、uncertain。',
    '主角和配角需逐个写清可观察的外观差异、画面位置及跨镜头连续性依据。若存在遮挡、背影、换装或相似人物，保留身份疑点；不要把无法确认的人强行合并。返回前逐项核对人物名单、每个事件出场角色和对白说话人。',
    '每个角色 representativeTimeSec 选择其实际出现且尽量清晰的画面时刻，description 明确外观及在该帧中的位置，便于自动截图后核对。不要虚构边框坐标。',
    'characters.visualPrompt 与核对用的 description 分开，必须使用简体中文：只写独立角色的正向视觉描述，开头写原片实际可观察的视觉风格（如真人写实摄影、二维动画、三维动画），不要写‘保留原视频的视觉风格、场景和道具’等指令。',
    '人物 visualPrompt 必须逐项核对外观性别呈现、视觉年龄段（如约二十多岁、中年，不猜真实年龄）、脸型与可见五官、肤色、发型发色、身材体态、服装款式层次与材质、可见鞋履和穿戴细节。不得仅凭长发或服装颜色判断性别；不要用‘面容姣好’等泛词代替可观察特征。动物改写物种、体型、毛色与特征，不套用人物年龄和性别要求。',
    'visualPrompt 以代表帧的外观为准，采用自然站立、水平正视全身立绘、纯灰色背景；只写有视觉依据的外观，不补造被遮挡的服装或鞋履，不混合不同镜头的换装。无法判断的性别、年龄或其他特征写入 identityNotes 供核对，不在 visualPrompt 中猜测或堆砌‘未知’。画面位置、剧情动作、环境、家具、道具、其他人物及身份疑点只留在核对描述或事件中，不写入 visualPrompt。',
    'events.characterIds 只列当前画面实际可见主体；dialogue.speakerId 记录有证据的说话人，无法确认用空字符串并标记 uncertain。画外音不能默认归给画面中的人。',
    '保持全部关键动作、事件因果、道具变化、对白顺序与结局。逐镜 visual 记录可见主体位置、朝向、人物与道具关系，按发生顺序写清主要动作过程及结束状态，保留可见视线、表情和背景变化，不压缩成剧情摘要。camera 写实际景别、机位、构图及运镜；过肩镜头明确前景是谁、主要看谁，运动写方向及跟随对象。静物镜头可简短，不设最低字数；未知信息不从台词推演或为了细化而编造。',
    '只返回指定 JSON。没有人物或对白时返回空数组，不能为了填字段编造。',
  ]['join']('\n');
}
export function parseVideoReplicationSourceResult(current, { durationSec: durationSec = 0 } = {}) {
  const text2 = text(current?.['text'] ?? current)['replace'](/^```(?:json)?\s*|\s*```$/gu, '');
  let entry;
  try {
    entry = JSON['parse'](text2);
  } catch {
    throw new Error('原视频分析未返回有效 JSON，请重试分析。');
  }
  if (entry?.['videoObserved'] !== true)
    throw new Error(
      '模型未确认读取到原视频，不能确定人物数量。' +
        (text(entry?.['observationError']) || '请检查视频地址或更换支持视频理解的模型后重新分析。'),
    );
  if ((entry['characters'] || [])['some']((record) => !text(record['visualPrompt'])))
    throw Object['assign'](
      new Error('原视频分析缺少角色生图外观描述，请重新分析；不能用核对描述代替人设提示词。'),
      { code: 'SOURCE_ANALYSIS_REPAIRABLE' },
    );
  return normalizeVideoReplicationSource(entry, { durationSec: durationSec });
}
export function normalizeVideoReplicationSource(enabled2, { durationSec: durationSec = 0 } = {}) {
  if (!enabled2 || !Array['isArray'](enabled2['events']) || !enabled2['events']['length'])
    throw new Error('原视频分析缺少事件时间轴。');
  const count = Number(durationSec) > 0 ? Number(durationSec) : Infinity,
    enabled3 = new Set(),
    payload = (Array['isArray'](enabled2['characters']) ? enabled2['characters'] : [])['map']((error) => {
      const text3 = text(error['id']),
        count2 = Number(error['representativeTimeSec']);
      if (!text3 || enabled3['has'](text3) || !Number['isFinite'](count2) || count2 < 0 || count2 >= count)
        throw Object['assign'](new Error('原视频人物编号或代表帧时间无效。'), {
          code: 'SOURCE_ANALYSIS_REPAIRABLE',
        });
      enabled3['add'](text3);
      const text4 = text(error['role']) || 'uncertain',
        text5 = text(error['subjectType']) || 'uncertain';
      if (
        !Object['hasOwn'](REPLICATION_CHARACTER_ROLES, text4) ||
        !Object['hasOwn'](REPLICATION_SUBJECT_TYPES, text5)
      )
        throw new Error('原视频角色类型无效，请重新分析。');
      return {
        id: text3,
        name: text(error['name']) || text3,
        description: text(error['description']),
        visualPrompt: text(error['visualPrompt']),
        role: text4,
        subjectType: text5,
        roleEvidence: text(error['roleEvidence']),
        identityNotes: text(error['identityNotes']),
        representativeTimeSec: count2,
      };
    }),
    map = new Set(),
    list2 = enabled2['events']['map']((handle) => {
      const text6 = text(handle['id']),
        count3 = Number(handle['startSec']),
        args = Number(handle['endSec']),
        state = Math['min'](args, count);
      if (
        !text6 ||
        map['has'](text6) ||
        !Number['isFinite'](count3) ||
        !Number['isFinite'](args) ||
        count3 < 0 ||
        state <= count3
      )
        throw Object['assign'](new Error('原视频事件编号或时间范围无效，请重试分析。'), {
          code: 'SOURCE_ANALYSIS_REPAIRABLE',
        });
      map['add'](text6);
      const config = [...new Set((handle['characterIds'] || [])['map'](text))],
        list3 = (handle['dialogue'] || [])['map']((response3) => ({
          speakerId: text(response3['speakerId']),
          text: text(response3['text']),
          uncertain: response3['uncertain'] === true || !text(response3['speakerId']),
        })),
        list4 = normalizeReplicationVoiceover(handle['voiceover'], enabled3),
        scope =
          Array['isArray'](handle['shots']) && args > count && args - count <= 0.05
            ? handle['shots']['map']((args2) =>
                Number(args2['endSec']) > count && Number(args2['endSec']) <= args
                  ? { ...args2, endSec: count }
                  : args2,
              )
            : handle['shots'],
        args3 = normalizeReplicationObservedShots(scope, {
          startSec: count3,
          endSec: state,
          dialogue: list3,
          voiceover: list4,
        }),
        list5 = handle['speechOrder'];
      if (
        list5 != null &&
        (!Array['isArray'](list5) ||
          ((list3['length'] || list4['length']) && !list5['length']) ||
          !getReplicationEventSpeech({ dialogue: list3, voiceover: list4, speechOrder: list5 }))
      )
        throw Object['assign'](new Error('原视频人声顺序引用无效，请核对逐句发言顺序。'), {
          code: 'SOURCE_ANALYSIS_REPAIRABLE',
        });
      if (
        config['some']((input) => !enabled3['has'](input)) ||
        list3['some']((output) => output['speakerId'] && !enabled3['has'](output['speakerId']))
      )
        throw new Error('原视频分析引用了未登记的人物。');
      return {
        id: text6,
        startSec: count3,
        endSec: state,
        visual: text(handle['visual']),
        camera: text(handle['camera']),
        sound: text(handle['sound']),
        characterIds: config,
        dialogue: list3,
        voiceover: list4,
        ...(args3 ? { shots: args3 } : {}),
        ...(list5 ? { speechOrder: [...list5] } : {}),
        uncertainties: [
          ...(handle['uncertainties'] || [])['map'](text)['filter'](Boolean),
          ...(args > count ? ['模型估计的结束时间超出视频时长，已限制到视频结尾，请核对内容。'] : []),
        ],
      };
    });
  for (const value2 of payload) {
    !list2['some'](
      (value3) =>
        value3['characterIds']['includes'](value2['id']) &&
        value2['representativeTimeSec'] >= value3['startSec'] &&
        value2['representativeTimeSec'] < value3['endSec'],
    ) &&
      (value2['identityNotes'] = [value2['identityNotes'], '代表帧时间与事件标注未对齐，请核对人物截图。']
        ['filter'](Boolean)
        ['join']('\n'));
  }
  return {
    schemaVersion: 1,
    title: text(enabled2['title']),
    synopsis: text(enabled2['synopsis']),
    contentType: normalizeReplicationContentType(enabled2['contentType']),
    contentTypeReason: text(enabled2['contentTypeReason']),
    sourceLanguage: text(enabled2['sourceLanguage']),
    characters: payload,
    events: list2,
    revision: 1,
  };
}
export function buildVideoReplicationSourceTranscript(args4) {
  return [
    args4['synopsis'],
    ...args4['events']['map']((args5) =>
      [
        '[' + args5['startSec'] + '–' + args5['endSec'] + '秒] ' + args5['visual'],
        ...(getReplicationEventSpeech(args5) || [
          ...args5['dialogue']['map']((args6) => ({ ...args6, kind: 'dialogue' })),
          ...(args5['voiceover'] || [])['map']((args7, value4) => ({
            ...args7,
            kind: 'voiceover',
            key: 'voiceover:' + value4,
          })),
        ])['map']((args8) => {
          if (args8['kind'] === 'voiceover')
            return formatReplicationVoiceover(
              { ...args8, kind: args5['voiceover'][Number(args8['key']['split'](':')[1])]['kind'] },
              args4['characters'],
            );
          const value5 = args4['characters']['find']((value6) => value6['id'] === args8['speakerId']);
          return (
            (value5 ? value5['id'] + '（' + value5['name'] + '）' : '[说话人待核对]') +
            '：' +
            args8['text'] +
            (args8['uncertain'] ? ' [待核对]' : '')
          );
        }),
      ]['join']('\n'),
    ),
  ]
    ['filter'](Boolean)
    ['join']('\n\n');
}
export function buildVideoReplicationTimingGuidance(enabled4 = {}) {
  if (enabled4['replication']?.['segmentPlan']?.['length'])
    return getReplicationSegmentPlanGuidance(enabled4);
  const count4 = Number(enabled4['sourceVideo']?.['durationSec']);
  if (!enabled4['replication']?.['sourceAnalysis'] || !Number['isFinite'](count4) || count4 <= 0) return '';
  return (
    '原片时长为 ' +
    Number(count4['toFixed'](3)) +
    ' 秒。保留原片节奏、动作、反应、停顿和人声；译后对白不能按中文字数等速估算。' +
    REPLICATION_TIMELINE_RULE
  );
}
export function buildVideoReplicationSourceEvidence(args9 = {}, args10 = {}, value7 = []) {
  const enabled5 = args9['replication']?.['sourceAnalysis'];
  if (!enabled5) return null;
  const count5 = Number(args9['sourceVideo']?.['durationSec']);
  return {
    ...(Number['isFinite'](count5) && count5 > 0
      ? { sourceDurationSec: count5, timingGuidance: buildVideoReplicationTimingGuidance(args9) }
      : {}),
    sourceLanguage: enabled5['sourceLanguage'],
    synopsis: enabled5['synopsis'],
    contentType: normalizeReplicationContentType(enabled5['contentType']),
    contentTypeReason: enabled5['contentTypeReason'],
    characters: enabled5['characters']['map'](
      ({
        id: id,
        name: name,
        description: description,
        identityNotes: identityNotes,
        role: role,
        subjectType: subjectType,
        roleEvidence: roleEvidence,
      }) => ({
        id: id,
        name: name,
        description: description,
        identityNotes: identityNotes,
        role: role,
        subjectType: subjectType,
        roleEvidence: roleEvidence,
      }),
    ),
    events: enabled5['events'],
    ...(args9['replication']['segmentPlan']?.['length']
      ? { segmentPlan: args9['replication']['segmentPlan'] }
      : {}),
    speechPolicy: buildVideoReplicationSpeechPolicy(enabled5),
    speechGuidance: REPLICATION_SPEECH_ROUTING_GUIDANCE,
    ...(args10['sourceMode'] === 'video-replication'
      ? {
          adaptation: {
            targetLocale:
              args9['replication']?.['targetLocale'] || args10['replication']?.['targetLocale'] || 'source',
            audioLanguage: buildVideoReplicationAudioLanguageRule(
              getVideoReplicationAudioLanguage(args9, args10),
            ),
            characterBindings: enabled5['characters']['map']((value8) => ({
              sourceCharacterId: value8['id'],
              targetAssetId:
                args10['replication']?.['characterBindings']?.[args9['id'] + ':' + value8['id']] || '',
            })),
            replacements: buildVideoReplicationGenerationAssets(value7, args10)
              ['filter']((value9) => value9['kind'] === 'character')
              ['map']((value10) => ({
                assetId: value10['id'],
                assetRef: value10['ref'],
                kind: value10['kind'],
                original: value10['replicationSource'] || null,
                targetName: value10['name'],
                targetDescription: (value10['appearances'] || [])['some'](
                  (value11) => value11['sourceOrigin'] === 'library' && value11['imageUrl'],
                )
                  ? '人物外貌以选定图片为准；targetName 仅用于对应故事角色，不限定性别、年龄和服装。'
                  : value10['description'],
                appearances: (value10['appearances'] || [])['map'](
                  ({
                    id: id2,
                    name: name2,
                    description: description2,
                    prompt: prompt,
                    sourceOrigin: sourceOrigin,
                    sourceAssetId: sourceAssetId,
                    sourceItemIndex: sourceItemIndex,
                    imageUrl: imageUrl,
                  }) =>
                    sourceOrigin === 'library' && imageUrl
                      ? {
                          id: id2,
                          name: name2,
                          sourceAssetId: sourceAssetId,
                          sourceItemIndex: sourceItemIndex,
                          imageUrl: imageUrl,
                          description:
                            '外貌以用户选定的参考图为准；这里只用角色名编排动作，不沿用原人物外貌，也不猜测参考图内容。',
                          prompt: '',
                        }
                      : { id: id2, name: name2, description: description2, prompt: prompt },
                ),
              })),
          },
        }
      : {}),
    instructions:
      '直接依据 events 的原片时间线编排，正文仅辅助理解；按 characterBindings 替换人物，并处理对白语言。保留人物关系、事件顺序、关键动作、场景、道具、冲突和结局，不确定项不得猜测为事实。targetLocale 为 source 时保留原语言和原对白；其他语言逐句翻译，保持原意、信息量、语气、顺序和说话人对应。每句人声放在开始发声的镜头，跨镜保留一次及声音时间，后镜无需延续标记。按已确定的 segmentPlan 保留片段范围和时长，不重新规划。' +
      REPLICATION_VISUAL_ELEMENTS_RULE +
      REPLICATION_VISUAL_STATE_RULE +
      REPLICATION_IMAGE_APPEARANCE_GUIDANCE,
    ...(args9['replication']['generationPrepared']
      ? {
          instructions:
            '当前正文已按人物替换关系和对白语言整理。严格使用当前正文的目标角色与对白；原片 events 用于核对动作、镜头、顺序和因果，保留原场景、道具、人物关系和结局，不得把译文或新角色改回原片。按当前 promptMode 与时长限制分段，禁止增加、删减或改写剧情。' +
            REPLICATION_IMAGE_APPEARANCE_GUIDANCE,
        }
      : {}),
  };
}
