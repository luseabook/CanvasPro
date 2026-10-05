export const AGENT_SKILL_LIFECYCLE_TARGET_KIND = 'agent-skill-lifecycle';
const QUESTION_PATTERN = /^(?:(?:如何|怎么|怎样|为什么)|(?:what\s+is|how\s+(?:do\s+i|to)|why)\b)/iu,
  NEGATED_PATTERN =
    /(?:不要|别|不用|无需|先别).{0,16}(?:修改|编辑|更新|停用|禁用|启用|开启|复制|克隆|删除|移除|卸载)|\b(?:do not|don't|dont)\b.{0,24}\b(?:edit|update|disable|enable|clone|copy|delete|remove|uninstall)\b/iu,
  OPERATION_PATTERNS = Object['freeze']([
    ['delete', /(?:删除|移除|卸载|\b(?:delete|remove|uninstall)\b)/iu],
    ['clone', /(?:复制|克隆|拷贝|\b(?:duplicate|clone|copy)\b)/iu],
    ['disable', /(?:停用|禁用|关闭|\b(?:disable|deactivate)\b|\bturn\s+off\b)/iu],
    ['enable', /(?:启用|开启|恢复使用|\b(?:enable|activate)\b|\bturn\s+on\b)/iu],
    ['update', /(?:修改|编辑|更新|调整|改成|改为|改得|\b(?:edit|update|revise|rewrite)\b)/iu],
    ['inspect', /(?:查看|显示|展示|看看|详情|定义|\b(?:inspect|show|view)\b)/iu],
  ]);
function normalizeText(value = '') {
  return String(value || '')['trim']();
}
function installedSkills(list = []) {
  return (Array['isArray'](list) ? list : [])['filter'](
    (item) => item?.['source'] === 'installed' && normalizeText(item['id']),
  );
}
function includesSkillSubject(key, index = []) {
  const list2 = normalizeText(key)['toLowerCase']();
  if (/(?:skills?|技能)/iu['test'](list2) || /[$/][a-z0-9][a-z0-9-]{0,63}/iu['test'](list2)) return !![];
  return installedSkills(index)['some']((result) => {
    const text = normalizeText(result['id'])['toLowerCase'](),
      text2 = normalizeText(result['title'])['toLowerCase']();
    return Boolean((text && list2['includes'](text)) || (text2 && list2['includes'](text2)));
  });
}
export function detectAgentSkillLifecycleIntent(data = '', options = []) {
  const text3 = normalizeText(data);
  if (
    !text3 ||
    QUESTION_PATTERN['test'](text3) ||
    NEGATED_PATTERN['test'](text3) ||
    !includesSkillSubject(text3, options)
  )
    return '';
  const installedSkills2 = installedSkills(options)['reduce']((target, source) => {
    const text4 = normalizeText(source['id']),
      text5 = normalizeText(source['title']);
    return target['replaceAll']('$' + text4, ' ')
      ['replaceAll']('/' + text4, ' ')
      ['replaceAll'](text4, ' ')
      ['replaceAll'](text5, ' ');
  }, text3['toLowerCase']());
  return OPERATION_PATTERNS['find'](([, next]) => next['test'](installedSkills2))?.[0] || '';
}
export function resolveAgentSkillLifecycleTarget(current = '', entry = []) {
  const skills = installedSkills(entry),
    list3 = normalizeText(current)['toLowerCase'](),
    requestedId = list3['match'](/[$/]([a-z0-9][a-z0-9-]{0,63})/iu)?.[1]?.['toLowerCase']() || '';
  if (requestedId) {
    const skill = skills['find']((record) => normalizeText(record['id'])['toLowerCase']() === requestedId);
    return skill ? { status: 'resolved', skill: skill } : { status: 'not_found', requestedId: requestedId };
  }
  const skill2 = skills['filter']((payload) => {
    const text6 = normalizeText(payload['id'])['toLowerCase'](),
      text7 = normalizeText(payload['title'])['toLowerCase']();
    return Boolean((text6 && list3['includes'](text6)) || (text7 && list3['includes'](text7)));
  });
  if (skill2['length'] === 1) return { status: 'resolved', skill: skill2[0] };
  if (skill2['length'] > 1) return { status: 'ambiguous', skills: skill2 };
  const list4 = (list3['match'](/[\u3400-\u9fff]{2,}/g) || [])
      ['map']((handle) =>
        handle['replace'](
          /(?:删除|移除|卸载|复制|克隆|拷贝|停用|禁用|关闭|启用|开启|恢复使用|修改|编辑|更新|调整|改成|改为|查看|显示|展示|看看|详情|定义|技能)/gu,
          '',
        ),
      )
      ['filter']((list5) => list5['length'] >= 2),
    skill3 = skills['filter']((state) => {
      const list6 = normalizeText(state['title']) + ' ' + normalizeText(state['description']);
      return list4['some']((config) => list6['includes'](config));
    });
  if (skill3['length'] === 1) return { status: 'resolved', skill: skill3[0] };
  if (skill3['length'] > 1) return { status: 'ambiguous', skills: skill3 };
  return { status: 'missing', skills: skills };
}
export function isAgentSkillLifecycleConfirmMessage(scope = '') {
  return /^(?:确认(?:删除)?|确定(?:删除)?|是的?|继续删除|delete|confirm|yes)\s*[。.!！]?$/iu['test'](
    normalizeText(scope),
  );
}
export function isAgentSkillLifecycleCancelMessage(input = '') {
  return /^(?:取消(?:删除|操作)?|不删了|先别删|算了|cancel|never\s*mind|no)\s*[。.!！]?$/iu['test'](
    normalizeText(input),
  );
}
