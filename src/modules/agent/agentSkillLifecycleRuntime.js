import { createAvailableAgentSkillId, requestNormalizedAgentSkillDraft } from './agentSkillAuthoring.js';
import {
  AGENT_SKILL_LIFECYCLE_TARGET_KIND,
  detectAgentSkillLifecycleIntent,
  isAgentSkillLifecycleCancelMessage,
  isAgentSkillLifecycleConfirmMessage,
  resolveAgentSkillLifecycleTarget,
} from './agentSkillLifecycle.js';
const TEXT = Object['freeze']({
  'zh-CN': Object['freeze']({
    target: '请指定要{operation}的 Skill，例如回复“${id}”。',
    targetFallback: '请指定要操作的 Skill，例如回复“$skill-id”。',
    notFound: '没有找到 Skill「${id}」。请检查 ID 后重试。',
    readOnly: 'Skill「${id}」是第三方导入包，不能通过对话修改或复制。',
    unavailable: '当前无法完成 Skill 操作，请确认正在桌面版中运行并重试。',
    failed: 'Skill 操作失败，请重试。',
    updated: '已更新 Skill「{title}」（${id}），ID 保持不变。',
    cloned: '已复制为 Skill「{title}」（${id}）。',
    disabled: '已停用 Skill「{title}」（${id}）。',
    enabled: '已启用 Skill「{title}」（${id}）。',
    deleteConfirm:
      '确认删除 Skill「{title}」（${id}）吗？此操作会移除本地安装包。请回复“确认删除”或“取消删除”。',
    deleted: '已删除 Skill「{title}」（${id}）。',
    cancelled: '已取消 Skill 操作。',
    inspect:
      'Skill「{title}」（${id}）\n状态：{status}\n描述：{description}\n触发词：{triggers}\n说明：\n{instructions}',
    statusEnabled: '已启用',
    statusDisabled: '已停用',
    operationInspect: '查看',
    operationUpdate: '修改',
    operationEnable: '启用',
    operationDisable: '停用',
    operationClone: '复制',
    operationDelete: '删除',
    stopped: 'Skill 操作已停止。',
  }),
  'en-US': Object['freeze']({
    target: 'Specify the Skill to {operation}, for example “${id}”.',
    targetFallback: 'Specify a Skill, for example “$skill-id”.',
    notFound: 'Skill ${id} was not found. Check the id and try again.',
    readOnly: 'Skill ${id} is a third-party package and cannot be edited or cloned in chat.',
    unavailable:
      'Skill management is unavailable. Make sure the desktop app is running and try again.',
    failed: 'The Skill operation failed. Please try again.',
    updated: 'Updated Skill “{title}” (${id}) while keeping its id unchanged.',
    cloned: 'Cloned Skill as “{title}” (${id}).',
    disabled: 'Disabled Skill “{title}” (${id}).',
    enabled: 'Enabled Skill “{title}” (${id}).',
    deleteConfirm:
      'Delete Skill “{title}” (${id})? This removes its local package. Reply “confirm” or “cancel”.',
    deleted: 'Deleted Skill “{title}” (${id}).',
    cancelled: 'Skill operation cancelled.',
    inspect:
      'Skill “{title}” (${id})\nStatus: {status}\nDescription: {description}\nTriggers: {triggers}\nInstructions:\n{instructions}',
    statusEnabled: 'enabled',
    statusDisabled: 'disabled',
    operationInspect: 'inspect',
    operationUpdate: 'update',
    operationEnable: 'enable',
    operationDisable: 'disable',
    operationClone: 'clone',
    operationDelete: 'delete',
    stopped: 'Skill operation stopped.',
  }),
});
function localeKey(value = '') {
  return String(value || '')
    ['toLowerCase']()
    ['startsWith']('en')
    ? 'en-US'
    : 'zh-CN';
}
function formatText(item, key = {}, index = 'zh-CN') {
  return (TEXT[localeKey(index)]?.[item] || TEXT['zh-CN'][item] || item)['replace'](
    /\{(\w+)\}/g,
    (result, data) => String(key[data] ?? ''),
  );
}
function compactSkill(editable = {}) {
  return {
    id: String(editable['id'] || '')['trim'](),
    title: String(editable['title'] || editable['id'] || '')['trim'](),
    description: String(editable['description'] || '')['trim'](),
    triggers: Array['isArray'](editable['triggers']) ? [...editable['triggers']] : [],
    instructions: String(editable['instructions'] || '')['trim'](),
    source: String(editable['source'] || '')['trim'](),
    editable:
      editable['editable'] === true ||
      (editable['source'] === 'installed' && editable['managedBy'] === 'shuo-canvas'),
    enabled: editable['enabled'] !== false,
  };
}
export function createAgentSkillLifecycleRuntime({
  sessionStore: sessionStore,
  skillRegistry: skillRegistry = null,
  author: author = null,
  saveSkill: saveSkill = null,
  deleteSkill: deleteSkill = null,
  setSkillEnabled: setSkillEnabled = null,
  localeProvider: localeProvider = () => 'zh-CN',
  isActiveRun: isActiveRun = () => true,
} = {}) {
  const run = () => (skillRegistry?.['listSkills']?.() || [])['map'](compactSkill),
    existingSkills = () => run()['filter']((options) => options['source'] === 'installed'),
    handler = (target) => existingSkills()['find']((source) => source['id'] === String(target || '')) || null,
    getPending = () => {
      const next = sessionStore?.['getPendingClarification']?.();
      return next?.['targetKind'] === AGENT_SKILL_LIFECYCLE_TARGET_KIND ? next : null;
    },
    handler2 = (turnId, status, content) => {
      (sessionStore?.['pushHistory']?.({
        role: 'assistant',
        status: status,
        content: content,
        turnId: turnId,
      }),
        sessionStore?.['setCurrentRun']?.({ id: turnId, status: status, stopped: false }));
    },
    handler3 = (current, status2, reply, args = {}) => {
      return (
        handler2(current, status2, reply),
        {
          ok: !['failed', 'stopped']['includes'](status2),
          status: status2,
          reply: reply,
          responseChannel: 'skill.lifecycle',
          ...args,
        }
      );
    },
    handler4 = (entry) => handler3(entry, 'stopped', formatText('stopped', {}, localeProvider?.())),
    handler5 = ({
      originalMessage: originalMessage2,
      question: question,
      operation: operation2,
      skillId: skillId = '',
      phase: phase,
    }) => {
      sessionStore?.['setPendingClarification']?.({
        originalMessage: originalMessage2,
        question: question,
        reply: question,
        options: [],
        targetKind: AGENT_SKILL_LIFECYCLE_TARGET_KIND,
        operation: operation2,
        skillId: skillId,
        phase: phase,
      });
    };
  function run2({ operation: operation3, originalMessage: originalMessage3, runId: runId2 }) {
    const id = existingSkills()[0]?.['id'] || 'skill-id',
      operation4 = formatText(
        'operation' + operation3['charAt'](0)['toUpperCase']() + operation3['slice'](1),
        {},
        localeProvider?.(),
      ),
      question2 =
        formatText('target', { operation: operation4, id: id }, localeProvider?.()) ||
        formatText('targetFallback', {}, localeProvider?.());
    return (
      handler5({
        originalMessage: originalMessage3,
        question: question2,
        operation: operation3,
        phase: 'target-selection',
      }),
      handler3(runId2, 'need_clarification', question2, { question: question2, options: [] })
    );
  }
  async function run3({
    operation: operation5,
    targetSkill: targetSkill,
    message: message2,
    originalMessage: originalMessage4,
    clarificationAnswer: clarificationAnswer = '',
    runId: runId3,
    signal: signal2,
  }) {
    if (typeof author !== 'function' || typeof saveSkill !== 'function')
      return handler3(runId3, 'failed', formatText('unavailable', {}, localeProvider?.()), {
        errorCode: 'SKILL_LIFECYCLE_UNAVAILABLE',
      });
    if (!targetSkill['editable'])
      return handler3(
        runId3,
        'failed',
        formatText('readOnly', { id: targetSkill['id'] }, localeProvider?.()),
        { errorCode: 'SKILL_NOT_EDITABLE' },
      );
    let options2;
    try {
      options2 = await requestNormalizedAgentSkillDraft({
        author: author,
        payload: {
          operation: operation5,
          message: message2,
          originalMessage: originalMessage4,
          clarificationAnswer: clarificationAnswer,
          targetSkill: targetSkill,
          history: sessionStore?.['getHistory']?.() || [],
          existingSkills: existingSkills()['map'](({ id: id2, title: title }) => ({
            id: id2,
            title: title,
          })),
          signal: signal2,
          onTrace: (record) => sessionStore?.['recordTrace']?.(record),
        },
        onTrace: (payload) => sessionStore?.['recordTrace']?.(payload),
      });
    } catch (message3) {
      options2 = {
        ok: false,
        status: 'failed',
        errorCode: 'SKILL_AUTHORING_FAILED',
        message: message3?.['message'],
      };
    }
    if (!isActiveRun(runId3)) return handler4(runId3);
    if (options2['status'] === 'need_clarification') {
      const question3 = options2['question'];
      return (
        handler5({
          originalMessage: originalMessage4,
          question: question3,
          operation: operation5,
          skillId: targetSkill['id'],
          phase: 'authoring-clarification',
        }),
        handler3(runId3, 'need_clarification', options2['reply'] || question3, {
          question: question3,
          options: options2['options'] || [],
        })
      );
    }
    if (!options2['ok'])
      return handler3(runId3, 'failed', options2['message'] || formatText('failed', {}, localeProvider?.()), {
        errorCode: options2['errorCode'],
      });
    const args2 = existingSkills()['map']((handle) => handle['id']),
      requestedId = { ...options2['definition'], mode: operation5 === 'update' ? 'update' : 'create' };
    if (operation5 === 'update')
      (requestedId['id'] !== targetSkill['id'] &&
        sessionStore?.['recordTrace']?.({
          type: 'agent_skill_update_id_repaired',
          requestedId: requestedId['id'],
          skillId: targetSkill['id'],
        }),
        (requestedId['id'] = targetSkill['id']));
    else {
      const state = requestedId['id'] === targetSkill['id'] ? targetSkill['id'] : requestedId['id'],
        skillId2 = createAvailableAgentSkillId(state, args2);
      (skillId2 !== requestedId['id'] &&
        sessionStore?.['recordTrace']?.({
          type: 'agent_skill_duplicate_id_repaired',
          requestedId: requestedId['id'],
          skillId: skillId2,
        }),
        (requestedId['id'] = skillId2));
    }
    let errorCode;
    try {
      errorCode = await saveSkill(requestedId);
      if (operation5 === 'clone' && errorCode?.['errorCode'] === 'SKILL_ALREADY_INSTALLED') {
        const skillId3 = createAvailableAgentSkillId(requestedId['id'], [...args2, requestedId['id']]);
        (sessionStore?.['recordTrace']?.({
          type: 'agent_skill_duplicate_id_repaired',
          requestedId: requestedId['id'],
          skillId: skillId3,
          reason: 'save-race',
        }),
          (requestedId['id'] = skillId3),
          (errorCode = await saveSkill(requestedId)));
      }
    } catch (message4) {
      errorCode = { success: false, errorCode: 'SKILL_SAVE_FAILED', message: message4?.['message'] };
    }
    if (!isActiveRun(runId3)) return handler4(runId3);
    if (errorCode?.['success'] !== true)
      return handler3(runId3, 'failed', formatText('failed', {}, localeProvider?.()), {
        errorCode: errorCode?.['errorCode'] || 'SKILL_SAVE_FAILED',
      });
    sessionStore?.['clearPendingClarification']?.();
    const config = operation5 === 'update' ? 'updated' : 'cloned';
    return handler3(
      runId3,
      'success',
      formatText(
        config,
        { id: requestedId['id'], title: requestedId['title'] || requestedId['id'] },
        localeProvider?.(),
      ),
      { skill: requestedId },
    );
  }
  async function run4({
    message: message = '',
    originalMessage: originalMessage = message,
    clarificationAnswer: clarificationAnswer = '',
    operation: operation = '',
    targetSkillId: targetSkillId = '',
    runId: runId = '',
    signal: signal = null,
  } = {}) {
    const operation6 = operation || detectAgentSkillLifecycleIntent(message, run());
    if (!operation6) return null;
    sessionStore?.['recordTrace']?.({
      type: 'agent_turn_routed',
      channel: 'skill.lifecycle',
      reason: clarificationAnswer ? 'skill-lifecycle-continuation' : 'skill-lifecycle-' + operation6,
    });
    const skill = targetSkillId ? handler(targetSkillId) : null,
      id3 = skill ? { status: 'resolved', skill: skill } : resolveAgentSkillLifecycleTarget(message, run());
    if (id3['status'] === 'not_found')
      return handler3(
        runId,
        'failed',
        formatText('notFound', { id: id3['requestedId'] }, localeProvider?.()),
        { errorCode: 'SKILL_NOT_FOUND' },
      );
    if (id3['status'] !== 'resolved')
      return run2({ operation: operation6, originalMessage: originalMessage, runId: runId });
    const id4 = id3['skill'];
    if (operation6 === 'inspect') {
      const formatText2 = formatText(
        'inspect',
        {
          id: id4['id'],
          title: id4['title'] || id4['id'],
          status: formatText(id4['enabled'] ? 'statusEnabled' : 'statusDisabled', {}, localeProvider?.()),
          description: id4['description'] || '-',
          triggers: id4['triggers']['join']('、') || '-',
          instructions: id4['instructions'] || '-',
        },
        localeProvider?.(),
      );
      return handler3(runId, 'success', formatText2, { skill: id4 });
    }
    if (['enable', 'disable']['includes'](operation6)) {
      const enabled = operation6 === 'enable',
        handler6 =
          typeof setSkillEnabled === 'function'
            ? setSkillEnabled
            : (scope, input) => skillRegistry?.['setSkillEnabled']?.(scope, input);
      let enabled2 = false;
      try {
        enabled2 = await handler6(id4['id'], enabled);
      } catch {}
      if (!enabled2)
        return handler3(runId, 'failed', formatText('failed', {}, localeProvider?.()), {
          errorCode: 'SKILL_ENABLE_STATE_FAILED',
        });
      return handler3(
        runId,
        'success',
        formatText(
          enabled ? 'enabled' : 'disabled',
          { id: id4['id'], title: id4['title'] || id4['id'] },
          localeProvider?.(),
        ),
        { skillId: id4['id'], enabled: enabled },
      );
    }
    if (operation6 === 'delete') {
      const question4 = formatText(
        'deleteConfirm',
        { id: id4['id'], title: id4['title'] || id4['id'] },
        localeProvider?.(),
      );
      return (
        handler5({
          originalMessage: originalMessage,
          question: question4,
          operation: operation6,
          skillId: id4['id'],
          phase: 'delete-confirmation',
        }),
        handler3(runId, 'need_clarification', question4, { question: question4, options: [] })
      );
    }
    return run3({
      operation: operation6,
      targetSkill: id4,
      message: message,
      originalMessage: originalMessage,
      clarificationAnswer: clarificationAnswer,
      runId: runId,
      signal: signal,
    });
  }
  async function answer2({
    answer: answer = '',
    pending: pending = getPending(),
    runId: runId = '',
    signal: signal = null,
  } = {}) {
    if (!pending) return null;
    if (isAgentSkillLifecycleCancelMessage(answer))
      return (
        sessionStore?.['clearPendingClarification']?.(),
        handler3(runId, 'cancelled', formatText('cancelled', {}, localeProvider?.()))
      );
    if (pending['phase'] === 'delete-confirmation') {
      const id5 = handler(pending['skillId']);
      if (!id5)
        return handler3(
          runId,
          'failed',
          formatText('notFound', { id: pending['skillId'] }, localeProvider?.()),
          { errorCode: 'SKILL_NOT_FOUND' },
        );
      if (!isAgentSkillLifecycleConfirmMessage(answer))
        return (
          handler5(pending),
          handler3(runId, 'need_clarification', pending['question'], {
            question: pending['question'],
            options: [],
          })
        );
      if (typeof deleteSkill !== 'function')
        return handler3(runId, 'failed', formatText('unavailable', {}, localeProvider?.()), {
          errorCode: 'SKILL_DELETE_UNAVAILABLE',
        });
      let errorCode2;
      try {
        errorCode2 = await deleteSkill({ id: id5['id'], confirmed: true });
      } catch (message5) {
        errorCode2 = { success: false, errorCode: 'SKILL_DELETE_FAILED', message: message5?.['message'] };
      }
      if (!isActiveRun(runId)) return handler4(runId);
      if (errorCode2?.['success'] !== true)
        return handler3(runId, 'failed', formatText('failed', {}, localeProvider?.()), {
          errorCode: errorCode2?.['errorCode'] || 'SKILL_DELETE_FAILED',
        });
      return (
        sessionStore?.['clearPendingClarification']?.(),
        handler3(
          runId,
          'success',
          formatText('deleted', { id: id5['id'], title: id5['title'] || id5['id'] }, localeProvider?.()),
          { skillId: id5['id'] },
        )
      );
    }
    if (pending['phase'] === 'authoring-clarification') {
      const targetSkill2 = handler(pending['skillId']);
      if (!targetSkill2)
        return handler3(
          runId,
          'failed',
          formatText('notFound', { id: pending['skillId'] }, localeProvider?.()),
          { errorCode: 'SKILL_NOT_FOUND' },
        );
      return run3({
        operation: pending['operation'],
        targetSkill: targetSkill2,
        message: answer,
        originalMessage: pending['originalMessage'],
        clarificationAnswer: answer,
        runId: runId,
        signal: signal,
      });
    }
    return run4({
      message: answer,
      originalMessage: pending['originalMessage'],
      clarificationAnswer: answer,
      operation: pending['operation'],
      runId: runId,
      signal: signal,
    });
  }
  return {
    getPending: getPending,
    matches: (output) => Boolean(detectAgentSkillLifecycleIntent(output, run())),
    run: run4,
    answer: answer2,
  };
}
