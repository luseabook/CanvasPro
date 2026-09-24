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
function normalizeText(_0xafe497 = '') {
  return String(_0xafe497 || '')['trim']();
}
function installedSkills(_0x4c29ad = []) {
  return (Array['isArray'](_0x4c29ad) ? _0x4c29ad : [])['filter'](
    (_0x335fb4) => _0x335fb4?.['source'] === 'installed' && normalizeText(_0x335fb4['id']),
  );
}
function includesSkillSubject(_0x56c76a, _0x1d0be6 = []) {
  const _0x3aa429 = normalizeText(_0x56c76a)['toLowerCase']();
  if (/(?:skills?|技能)/iu['test'](_0x3aa429) || /[$/][a-z0-9][a-z0-9-]{0,63}/iu['test'](_0x3aa429))
    return !![];
  return installedSkills(_0x1d0be6)['some']((_0x2d40f6) => {
    const _0x4cc7c7 = normalizeText(_0x2d40f6['id'])['toLowerCase'](),
      _0x1537c0 = normalizeText(_0x2d40f6['title'])['toLowerCase']();
    return Boolean(
      (_0x4cc7c7 && _0x3aa429['includes'](_0x4cc7c7)) || (_0x1537c0 && _0x3aa429['includes'](_0x1537c0)),
    );
  });
}
export function detectAgentSkillLifecycleIntent(_0x47d786 = '', _0x54d140 = []) {
  const _0x3424e7 = normalizeText(_0x47d786);
  if (
    !_0x3424e7 ||
    QUESTION_PATTERN['test'](_0x3424e7) ||
    NEGATED_PATTERN['test'](_0x3424e7) ||
    !includesSkillSubject(_0x3424e7, _0x54d140)
  )
    return '';
  const _0x26983c = installedSkills(_0x54d140)['reduce']((_0x112063, _0x46b5bb) => {
    const _0x2e888d = normalizeText(_0x46b5bb['id']),
      _0x52afa4 = normalizeText(_0x46b5bb['title']);
    return _0x112063['replaceAll']('$' + _0x2e888d, '\x20')
      ['replaceAll']('/' + _0x2e888d, '\x20')
      ['replaceAll'](_0x2e888d, '\x20')
      ['replaceAll'](_0x52afa4, '\x20');
  }, _0x3424e7['toLowerCase']());
  return OPERATION_PATTERNS['find'](([, _0x20ff6b]) => _0x20ff6b['test'](_0x26983c))?.[0x0] || '';
}
export function resolveAgentSkillLifecycleTarget(_0xec2742 = '', _0x3dc113 = []) {
  const _0x3bb833 = installedSkills(_0x3dc113),
    _0x2c7dc9 = normalizeText(_0xec2742)['toLowerCase'](),
    _0x56a871 = _0x2c7dc9['match'](/[$/]([a-z0-9][a-z0-9-]{0,63})/iu)?.[0x1]?.['toLowerCase']() || '';
  if (_0x56a871) {
    const _0x234833 = _0x3bb833['find'](
      (_0x10b678) => normalizeText(_0x10b678['id'])['toLowerCase']() === _0x56a871,
    );
    return _0x234833
      ? { status: 'resolved', skill: _0x234833 }
      : { status: 'not_found', requestedId: _0x56a871 };
  }
  const _0x1996d0 = _0x3bb833['filter']((_0x2c14fc) => {
    const _0x54a5f4 = normalizeText(_0x2c14fc['id'])['toLowerCase'](),
      _0x233e6a = normalizeText(_0x2c14fc['title'])['toLowerCase']();
    return Boolean(
      (_0x54a5f4 && _0x2c7dc9['includes'](_0x54a5f4)) || (_0x233e6a && _0x2c7dc9['includes'](_0x233e6a)),
    );
  });
  if (_0x1996d0['length'] === 0x1) return { status: 'resolved', skill: _0x1996d0[0x0] };
  if (_0x1996d0['length'] > 0x1) return { status: 'ambiguous', skills: _0x1996d0 };
  const _0x23a6b6 = (_0x2c7dc9['match'](/[\u3400-\u9fff]{2,}/g) || [])
      ['map']((_0xeb5534) =>
        _0xeb5534['replace'](
          /(?:删除|移除|卸载|复制|克隆|拷贝|停用|禁用|关闭|启用|开启|恢复使用|修改|编辑|更新|调整|改成|改为|查看|显示|展示|看看|详情|定义|技能)/gu,
          '',
        ),
      )
      ['filter']((_0xae4d6c) => _0xae4d6c['length'] >= 0x2),
    _0x5a1ca5 = _0x3bb833['filter']((_0x3d3c9c) => {
      const _0x17fde0 = normalizeText(_0x3d3c9c['title']) + '\x20' + normalizeText(_0x3d3c9c['description']);
      return _0x23a6b6['some']((_0x31e75d) => _0x17fde0['includes'](_0x31e75d));
    });
  if (_0x5a1ca5['length'] === 0x1) return { status: 'resolved', skill: _0x5a1ca5[0x0] };
  if (_0x5a1ca5['length'] > 0x1) return { status: 'ambiguous', skills: _0x5a1ca5 };
  return { status: 'missing', skills: _0x3bb833 };
}
export function isAgentSkillLifecycleConfirmMessage(_0x2c3535 = '') {
  return /^(?:确认(?:删除)?|确定(?:删除)?|是的?|继续删除|delete|confirm|yes)\s*[。.!！]?$/iu['test'](
    normalizeText(_0x2c3535),
  );
}
export function isAgentSkillLifecycleCancelMessage(_0x813b12 = '') {
  return /^(?:取消(?:删除|操作)?|不删了|先别删|算了|cancel|never\s*mind|no)\s*[。.!！]?$/iu['test'](
    normalizeText(_0x813b12),
  );
}
