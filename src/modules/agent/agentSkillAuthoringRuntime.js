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
    refreshFailed: 'Skill 已保存，但列表刷新失败。请打开 Skill 管理器点击刷新。',
    failed: 'Skill 创建失败，请重试。',
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
function normalizeLocale(value = '') {
  return String(value || '')
    ['toLowerCase']()
    ['startsWith']('en')
    ? 'en-US'
    : 'zh-CN';
}
function formatText(item, key = {}, index = 'zh-CN') {
  return (TEXT[normalizeLocale(index)]?.[item] || TEXT['zh-CN'][item] || item)['replace'](
    /\{(\w+)\}/g,
    (result, data) => String(key[data] ?? ''),
  );
}
function compactExistingSkills(options) {
  return (options?.['listSkills']?.() || options?.['listCatalog']?.() || [])
    ['map']((options2 = {}) => ({
      id: String(options2['id'] || '')['trim'](),
      title: String(options2['title'] || options2['id'] || '')
        ['trim']()
        ['slice'](0, 120),
    }))
    ['filter']((target) => target['id'])
    ['slice'](0, 100);
}
export function createAgentSkillAuthoringRuntime({
  sessionStore: sessionStore,
  skillRegistry: skillRegistry = null,
  author: author = null,
  saveSkill: saveSkill = null,
  localeProvider: localeProvider = () => 'zh-CN',
  isActiveRun: isActiveRun = () => true,
} = {}) {
  const isAvailable = () => typeof author === 'function' && typeof saveSkill === 'function',
    getPending = () => {
      const source = sessionStore?.['getPendingClarification']?.();
      return source?.['targetKind'] === AGENT_SKILL_AUTHORING_TARGET_KIND ? source : null;
    },
    handler = (turnId, status, content) => {
      (sessionStore?.['pushHistory']?.({
        role: 'assistant',
        status: status,
        content: content,
        turnId: turnId,
      }),
        sessionStore?.['setCurrentRun']?.({ id: turnId, status: status, stopped: false }));
    },
    handler2 = () => ({
      ok: false,
      status: 'stopped',
      reply: formatText('stopped', {}, localeProvider?.()),
      responseChannel: 'skill.authoring',
    });
  async function run({
    message: message = '',
    originalMessage: originalMessage = message,
    clarificationAnswer: clarificationAnswer = '',
    runId: runId = '',
    signal: signal = null,
  } = {}) {
    sessionStore?.['recordTrace']?.({
      type: 'agent_turn_routed',
      channel: 'skill.authoring',
      reason: clarificationAnswer ? 'skill-authoring-continuation' : 'skill-authoring-request',
    });
    let question;
    try {
      question = await requestNormalizedAgentSkillDraft({
        author: author,
        payload: {
          operation: 'create',
          message: message,
          originalMessage: originalMessage,
          clarificationAnswer: clarificationAnswer,
          history: sessionStore?.['getHistory']?.() || [],
          existingSkills: compactExistingSkills(skillRegistry),
          signal: signal,
          onTrace: (next) => sessionStore?.['recordTrace']?.(next),
        },
        onTrace: (current) => sessionStore?.['recordTrace']?.(current),
      });
    } catch (message2) {
      question = {
        ok: false,
        status: 'failed',
        errorCode: 'SKILL_AUTHORING_FAILED',
        message: message2?.['message'] || formatText('failed', {}, localeProvider?.()),
      };
    }
    if (!isActiveRun(runId)) return handler2();
    if (question['status'] === 'need_clarification')
      return (
        sessionStore?.['setPendingClarification']?.({
          originalMessage: String(originalMessage || message)['trim'](),
          question: question['question'],
          reply: question['reply'] || question['question'],
          options: question['options'] || [],
          targetKind: AGENT_SKILL_AUTHORING_TARGET_KIND,
        }),
        handler(runId, 'need_clarification', question['question']),
        {
          ok: true,
          status: 'need_clarification',
          reply: question['reply'] || question['question'],
          question: question['question'],
          options: question['options'] || [],
          responseChannel: 'skill.authoring',
        }
      );
    if (!question['ok']) {
      const reply = question['message'] || formatText('failed', {}, localeProvider?.());
      return (
        handler(runId, 'failed', reply),
        {
          ok: false,
          status: 'failed',
          reply: reply,
          errorCode: question['errorCode'],
          responseChannel: 'skill.authoring',
        }
      );
    }
    const args = compactExistingSkills(skillRegistry)['map']((entry) => entry['id']),
      skillId = createAvailableAgentSkillId(question['definition']['id'], args);
    skillId !== question['definition']['id'] &&
      sessionStore?.['recordTrace']?.({
        type: 'agent_skill_duplicate_id_repaired',
        requestedId: question['definition']['id'],
        skillId: skillId,
      });
    let requestedId = { mode: 'create', ...question['definition'], id: skillId },
      response;
    try {
      response = await saveSkill(requestedId);
      if (response?.['errorCode'] === 'SKILL_ALREADY_INSTALLED') {
        const skillId2 = createAvailableAgentSkillId(requestedId['id'], [...args, requestedId['id']]);
        (sessionStore?.['recordTrace']?.({
          type: 'agent_skill_duplicate_id_repaired',
          requestedId: requestedId['id'],
          skillId: skillId2,
          reason: 'save-race',
        }),
          (requestedId = { ...requestedId, id: skillId2 }),
          (response = await saveSkill(requestedId)));
      }
    } catch (message3) {
      response = { success: false, errorCode: 'SKILL_SAVE_FAILED', message: message3?.['message'] };
    }
    if (!isActiveRun(runId)) return handler2();
    if (response?.['success'] === true) {
      const reply2 = formatText(
        'created',
        { id: requestedId['id'], title: requestedId['title'] || requestedId['id'] },
        localeProvider?.(),
      );
      return (
        sessionStore?.['clearPendingClarification']?.(),
        sessionStore?.['recordTrace']?.({
          type: 'agent_skill_created',
          skillId: requestedId['id'],
          source: 'conversation',
        }),
        handler(runId, 'success', reply2),
        {
          ok: true,
          status: 'success',
          reply: reply2,
          skill: requestedId,
          responseChannel: 'skill.authoring',
        }
      );
    }
    const errorCode = String(response?.['errorCode'] || 'SKILL_SAVE_FAILED'),
      record =
        errorCode === 'SKILL_ALREADY_INSTALLED'
          ? 'duplicate'
          : errorCode === 'SKILL_SAVE_UNAVAILABLE'
            ? 'unavailable'
            : errorCode === 'SKILL_REFRESH_AFTER_SAVE_FAILED'
              ? 'refreshFailed'
              : 'failed',
      reply3 = formatText(record, { id: requestedId['id'] }, localeProvider?.());
    return (
      handler(runId, 'failed', reply3),
      {
        ok: false,
        status: 'failed',
        reply: reply3,
        errorCode: errorCode,
        responseChannel: 'skill.authoring',
      }
    );
  }
  async function answer2({
    answer: answer = '',
    pending: pending = getPending(),
    runId: runId = '',
    signal: signal = null,
  } = {}) {
    if (!pending) return null;
    if (isAgentSkillAuthoringCancelMessage(answer)) {
      const reply4 = formatText('canceled', {}, localeProvider?.());
      return (
        handler(runId, 'cancelled', reply4),
        { ok: true, status: 'cancelled', reply: reply4, responseChannel: 'skill.authoring' }
      );
    }
    return run({
      message: answer,
      originalMessage: pending['originalMessage'],
      clarificationAnswer: answer,
      runId: runId,
      signal: signal,
    });
  }
  return {
    isAvailable: isAvailable,
    matches: (payload) => isAvailable() && isAgentSkillAuthoringIntent(payload),
    getPending: getPending,
    run: run,
    answer: answer2,
  };
}
