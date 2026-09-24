import {
  AGENT_SKILL_AUTHORING_TARGET_KIND,
  createAvailableAgentSkillId,
  isAgentSkillAuthoringCancelMessage,
  isAgentSkillAuthoringIntent,
  requestNormalizedAgentSkillDraft,
} from './agentSkillAuthoring.js';
const TEXT = Object['freeze']({
  'zh-CN': Object['freeze']({
    canceled: '已取消创建 Skill。',
    created: '已创建 Skill「{title}」（${id}）。现在可以直接说“用 ${id} …”来使用。',
    duplicate: 'Skill「${id}」已经存在，我没有覆盖它。可以换一个名称，或在 Skill 管理中编辑现有版本。',
    unavailable: '当前无法保存 Skill，请确认正在桌面版中运行并重试。',
    refreshFailed: 'Skill\x20已保存，但列表刷新失败。请打开\x20Skill\x20管理器点击刷新。',
    failed: 'Skill\x20创建失败，请重试。',
    stopped: 'Skill 创建已停止。',
  }),
  'en-US': Object['freeze']({
    canceled: 'Skill creation cancelled.',
    created: 'Created Skill “{title}” (${id}). You can now say “Use ${id} …”.',
    duplicate:
      'Skill ${id} already exists, so it was not overwritten. Choose another name or edit the existing Skill in Skill management.',
    unavailable: 'Skills cannot be saved right now. Make sure the desktop app is running and try again.',
    refreshFailed:
      'The Skill was saved, but the list could not refresh. Open Skill management and refresh it.',
    failed: 'Skill creation failed. Please try again.',
    stopped: 'Skill creation stopped.',
  }),
});
function normalizeLocale(_0x26c568 = '') {
  return String(_0x26c568 || '')
    ['toLowerCase']()
    ['startsWith']('en')
    ? 'en-US'
    : 'zh-CN';
}
function formatText(_0x1c84e7, _0x4a0cbe = {}, _0x57e279 = 'zh-CN') {
  return (TEXT[normalizeLocale(_0x57e279)]?.[_0x1c84e7] || TEXT['zh-CN'][_0x1c84e7] || _0x1c84e7)['replace'](
    /\{(\w+)\}/g,
    (_0xe3ce3d, _0x5056d8) => String(_0x4a0cbe[_0x5056d8] ?? ''),
  );
}
function compactExistingSkills(_0x73c71a) {
  return (_0x73c71a?.['listSkills']?.() || _0x73c71a?.['listCatalog']?.() || [])
    ['map']((_0x4b788c = {}) => ({
      id: String(_0x4b788c['id'] || '')['trim'](),
      title: String(_0x4b788c['title'] || _0x4b788c['id'] || '')
        ['trim']()
        ['slice'](0x0, 0x78),
    }))
    ['filter']((_0x4364d7) => _0x4364d7['id'])
    ['slice'](0x0, 0x64);
}
export function createAgentSkillAuthoringRuntime({
  sessionStore: _0x1101f2,
  skillRegistry: skillRegistry = null,
  author: author = null,
  saveSkill: saveSkill = null,
  localeProvider: localeProvider = () => 'zh-CN',
  isActiveRun: isActiveRun = () => !![],
} = {}) {
  const _0x2a8292 = () => typeof author === 'function' && typeof saveSkill === 'function',
    _0x4eb42b = () => {
      const _0x4c1ca1 = _0x1101f2?.['getPendingClarification']?.();
      return _0x4c1ca1?.['targetKind'] === AGENT_SKILL_AUTHORING_TARGET_KIND ? _0x4c1ca1 : null;
    },
    _0x5267e4 = (_0x291f3b, _0x2806bf, _0x19ac98) => {
      (_0x1101f2?.['pushHistory']?.({
        role: 'assistant',
        status: _0x2806bf,
        content: _0x19ac98,
        turnId: _0x291f3b,
      }),
        _0x1101f2?.['setCurrentRun']?.({ id: _0x291f3b, status: _0x2806bf, stopped: ![] }));
    },
    _0x4ae8b7 = () => ({
      ok: ![],
      status: 'stopped',
      reply: formatText('stopped', {}, localeProvider?.()),
      responseChannel: 'skill.authoring',
    });
  async function _0x4b707e({
    message: message = '',
    originalMessage: originalMessage = message,
    clarificationAnswer: clarificationAnswer = '',
    runId: runId = '',
    signal: signal = null,
  } = {}) {
    _0x1101f2?.['recordTrace']?.({
      type: 'agent_turn_routed',
      channel: 'skill.authoring',
      reason: clarificationAnswer ? 'skill-authoring-continuation' : 'skill-authoring-request',
    });
    let _0x3a32b4;
    try {
      _0x3a32b4 = await requestNormalizedAgentSkillDraft({
        author: author,
        payload: {
          operation: 'create',
          message: message,
          originalMessage: originalMessage,
          clarificationAnswer: clarificationAnswer,
          history: _0x1101f2?.['getHistory']?.() || [],
          existingSkills: compactExistingSkills(skillRegistry),
          signal: signal,
          onTrace: (_0x4b6340) => _0x1101f2?.['recordTrace']?.(_0x4b6340),
        },
        onTrace: (_0x9b0fa) => _0x1101f2?.['recordTrace']?.(_0x9b0fa),
      });
    } catch (_0x7e0163) {
      _0x3a32b4 = {
        ok: ![],
        status: 'failed',
        errorCode: 'SKILL_AUTHORING_FAILED',
        message: _0x7e0163?.['message'] || formatText('failed', {}, localeProvider?.()),
      };
    }
    if (!isActiveRun(runId)) return _0x4ae8b7();
    if (_0x3a32b4['status'] === 'need_clarification')
      return (
        _0x1101f2?.['setPendingClarification']?.({
          originalMessage: String(originalMessage || message)['trim'](),
          question: _0x3a32b4['question'],
          reply: _0x3a32b4['reply'] || _0x3a32b4['question'],
          options: _0x3a32b4['options'] || [],
          targetKind: AGENT_SKILL_AUTHORING_TARGET_KIND,
        }),
        _0x5267e4(runId, 'need_clarification', _0x3a32b4['question']),
        {
          ok: !![],
          status: 'need_clarification',
          reply: _0x3a32b4['reply'] || _0x3a32b4['question'],
          question: _0x3a32b4['question'],
          options: _0x3a32b4['options'] || [],
          responseChannel: 'skill.authoring',
        }
      );
    if (!_0x3a32b4['ok']) {
      const _0xd99a73 = _0x3a32b4['message'] || formatText('failed', {}, localeProvider?.());
      return (
        _0x5267e4(runId, 'failed', _0xd99a73),
        {
          ok: ![],
          status: 'failed',
          reply: _0xd99a73,
          errorCode: _0x3a32b4['errorCode'],
          responseChannel: 'skill.authoring',
        }
      );
    }
    const _0x367a41 = compactExistingSkills(skillRegistry)['map']((_0x55405d) => _0x55405d['id']),
      _0x49d112 = createAvailableAgentSkillId(_0x3a32b4['definition']['id'], _0x367a41);
    _0x49d112 !== _0x3a32b4['definition']['id'] &&
      _0x1101f2?.['recordTrace']?.({
        type: 'agent_skill_duplicate_id_repaired',
        requestedId: _0x3a32b4['definition']['id'],
        skillId: _0x49d112,
      });
    let _0xf6ee94 = { mode: 'create', ..._0x3a32b4['definition'], id: _0x49d112 },
      _0x24c730;
    try {
      _0x24c730 = await saveSkill(_0xf6ee94);
      if (_0x24c730?.['errorCode'] === 'SKILL_ALREADY_INSTALLED') {
        const _0x4ea604 = createAvailableAgentSkillId(_0xf6ee94['id'], [..._0x367a41, _0xf6ee94['id']]);
        (_0x1101f2?.['recordTrace']?.({
          type: 'agent_skill_duplicate_id_repaired',
          requestedId: _0xf6ee94['id'],
          skillId: _0x4ea604,
          reason: 'save-race',
        }),
          (_0xf6ee94 = { ..._0xf6ee94, id: _0x4ea604 }),
          (_0x24c730 = await saveSkill(_0xf6ee94)));
      }
    } catch (_0x486e32) {
      _0x24c730 = { success: ![], errorCode: 'SKILL_SAVE_FAILED', message: _0x486e32?.['message'] };
    }
    if (!isActiveRun(runId)) return _0x4ae8b7();
    if (_0x24c730?.['success'] === !![]) {
      const _0x18c3f3 = formatText(
        'created',
        { id: _0xf6ee94['id'], title: _0xf6ee94['title'] || _0xf6ee94['id'] },
        localeProvider?.(),
      );
      return (
        _0x1101f2?.['clearPendingClarification']?.(),
        _0x1101f2?.['recordTrace']?.({
          type: 'agent_skill_created',
          skillId: _0xf6ee94['id'],
          source: 'conversation',
        }),
        _0x5267e4(runId, 'success', _0x18c3f3),
        {
          ok: !![],
          status: 'success',
          reply: _0x18c3f3,
          skill: _0xf6ee94,
          responseChannel: 'skill.authoring',
        }
      );
    }
    const _0x115656 = String(_0x24c730?.['errorCode'] || 'SKILL_SAVE_FAILED'),
      _0x265401 =
        _0x115656 === 'SKILL_ALREADY_INSTALLED'
          ? 'duplicate'
          : _0x115656 === 'SKILL_SAVE_UNAVAILABLE'
            ? 'unavailable'
            : _0x115656 === 'SKILL_REFRESH_AFTER_SAVE_FAILED'
              ? 'refreshFailed'
              : 'failed',
      _0x47890c = formatText(_0x265401, { id: _0xf6ee94['id'] }, localeProvider?.());
    return (
      _0x5267e4(runId, 'failed', _0x47890c),
      {
        ok: ![],
        status: 'failed',
        reply: _0x47890c,
        errorCode: _0x115656,
        responseChannel: 'skill.authoring',
      }
    );
  }
  async function _0x24c14e({
    answer: answer = '',
    pending: pending = _0x4eb42b(),
    runId: runId = '',
    signal: signal = null,
  } = {}) {
    if (!pending) return null;
    if (isAgentSkillAuthoringCancelMessage(answer)) {
      const _0x232714 = formatText('canceled', {}, localeProvider?.());
      return (
        _0x5267e4(runId, 'cancelled', _0x232714),
        { ok: !![], status: 'cancelled', reply: _0x232714, responseChannel: 'skill.authoring' }
      );
    }
    return _0x4b707e({
      message: answer,
      originalMessage: pending['originalMessage'],
      clarificationAnswer: answer,
      runId: runId,
      signal: signal,
    });
  }
  return {
    isAvailable: _0x2a8292,
    matches: (_0x4334bc) => _0x2a8292() && isAgentSkillAuthoringIntent(_0x4334bc),
    getPending: _0x4eb42b,
    run: _0x4b707e,
    answer: _0x24c14e,
  };
}
