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
    enabled: '已启用\x20Skill「{title}」（${id}）。',
    deleteConfirm:
      '确认删除\x20Skill「{title}」（${id}）吗？此操作会移除本地安装包。请回复“确认删除”或“取消删除”。',
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
    stopped: 'Skill\x20操作已停止。',
  }),
  'en-US': Object['freeze']({
    target: 'Specify the Skill to {operation}, for example “${id}”.',
    targetFallback: 'Specify\x20a\x20Skill,\x20for\x20example\x20“$skill-id”.',
    notFound: 'Skill\x20${id}\x20was\x20not\x20found.\x20Check\x20the\x20id\x20and\x20try\x20again.',
    readOnly: 'Skill ${id} is a third-party package and cannot be edited or cloned in chat.',
    unavailable:
      'Skill\x20management\x20is\x20unavailable.\x20Make\x20sure\x20the\x20desktop\x20app\x20is\x20running\x20and\x20try\x20again.',
    failed: 'The Skill operation failed. Please try again.',
    updated: 'Updated Skill “{title}” (${id}) while keeping its id unchanged.',
    cloned: 'Cloned\x20Skill\x20as\x20“{title}”\x20(${id}).',
    disabled: 'Disabled Skill “{title}” (${id}).',
    enabled: 'Enabled Skill “{title}” (${id}).',
    deleteConfirm:
      'Delete Skill “{title}” (${id})? This removes its local package. Reply “confirm” or “cancel”.',
    deleted: 'Deleted\x20Skill\x20“{title}”\x20(${id}).',
    cancelled: 'Skill operation cancelled.',
    inspect:
      'Skill\x20“{title}”\x20(${id})\x0aStatus:\x20{status}\x0aDescription:\x20{description}\x0aTriggers:\x20{triggers}\x0aInstructions:\x0a{instructions}',
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
function localeKey(_0x473aa9 = '') {
  return String(_0x473aa9 || '')
    ['toLowerCase']()
    ['startsWith']('en')
    ? 'en-US'
    : 'zh-CN';
}
function formatText(_0x4a83d6, _0x2cb81a = {}, _0x3bb235 = 'zh-CN') {
  return (TEXT[localeKey(_0x3bb235)]?.[_0x4a83d6] || TEXT['zh-CN'][_0x4a83d6] || _0x4a83d6)['replace'](
    /\{(\w+)\}/g,
    (_0x2fe272, _0x464c4c) => String(_0x2cb81a[_0x464c4c] ?? ''),
  );
}
function compactSkill(_0x2071af = {}) {
  return {
    id: String(_0x2071af['id'] || '')['trim'](),
    title: String(_0x2071af['title'] || _0x2071af['id'] || '')['trim'](),
    description: String(_0x2071af['description'] || '')['trim'](),
    triggers: Array['isArray'](_0x2071af['triggers']) ? [..._0x2071af['triggers']] : [],
    instructions: String(_0x2071af['instructions'] || '')['trim'](),
    source: String(_0x2071af['source'] || '')['trim'](),
    editable:
      _0x2071af['editable'] === !![] ||
      (_0x2071af['source'] === 'installed' && _0x2071af['managedBy'] === 'shuo-canvas'),
    enabled: _0x2071af['enabled'] !== ![],
  };
}
export function createAgentSkillLifecycleRuntime({
  sessionStore: _0x1ddefe,
  skillRegistry: skillRegistry = null,
  author: author = null,
  saveSkill: saveSkill = null,
  deleteSkill: deleteSkill = null,
  setSkillEnabled: setSkillEnabled = null,
  localeProvider: localeProvider = () => 'zh-CN',
  isActiveRun: isActiveRun = () => !![],
} = {}) {
  const _0x4e9ab6 = () => (skillRegistry?.['listSkills']?.() || [])['map'](compactSkill),
    _0x159d35 = () => _0x4e9ab6()['filter']((_0xf26380) => _0xf26380['source'] === 'installed'),
    _0x11bfad = (_0x35390f) =>
      _0x159d35()['find']((_0x4024aa) => _0x4024aa['id'] === String(_0x35390f || '')) || null,
    _0x2d0ede = () => {
      const _0x949c76 = _0x1ddefe?.['getPendingClarification']?.();
      return _0x949c76?.['targetKind'] === AGENT_SKILL_LIFECYCLE_TARGET_KIND ? _0x949c76 : null;
    },
    _0x2997ca = (_0x16914a, _0x1f08db, _0x70a29b) => {
      (_0x1ddefe?.['pushHistory']?.({
        role: 'assistant',
        status: _0x1f08db,
        content: _0x70a29b,
        turnId: _0x16914a,
      }),
        _0x1ddefe?.['setCurrentRun']?.({ id: _0x16914a, status: _0x1f08db, stopped: ![] }));
    },
    _0x5cd835 = (_0x541efc, _0xd4f7ab, _0x5f2c0b, _0x53e23c = {}) => {
      return (
        _0x2997ca(_0x541efc, _0xd4f7ab, _0x5f2c0b),
        {
          ok: !['failed', 'stopped']['includes'](_0xd4f7ab),
          status: _0xd4f7ab,
          reply: _0x5f2c0b,
          responseChannel: 'skill.lifecycle',
          ..._0x53e23c,
        }
      );
    },
    _0x191b41 = (_0x1ae606) => _0x5cd835(_0x1ae606, 'stopped', formatText('stopped', {}, localeProvider?.())),
    _0x259d3b = ({
      originalMessage: _0x4cf3e4,
      question: _0x48a3d0,
      operation: _0x33c4d2,
      skillId: skillId = '',
      phase: _0x1aa2c5,
    }) => {
      _0x1ddefe?.['setPendingClarification']?.({
        originalMessage: _0x4cf3e4,
        question: _0x48a3d0,
        reply: _0x48a3d0,
        options: [],
        targetKind: AGENT_SKILL_LIFECYCLE_TARGET_KIND,
        operation: _0x33c4d2,
        skillId: skillId,
        phase: _0x1aa2c5,
      });
    };
  function _0xd5868d({ operation: _0xc1ddab, originalMessage: _0x2d5a44, runId: _0x572b94 }) {
    const _0x4f4ec6 = _0x159d35()[0x0]?.['id'] || 'skill-id',
      _0x417d3a = formatText(
        'operation' + _0xc1ddab['charAt'](0x0)['toUpperCase']() + _0xc1ddab['slice'](0x1),
        {},
        localeProvider?.(),
      ),
      _0xe40628 =
        formatText('target', { operation: _0x417d3a, id: _0x4f4ec6 }, localeProvider?.()) ||
        formatText('targetFallback', {}, localeProvider?.());
    return (
      _0x259d3b({
        originalMessage: _0x2d5a44,
        question: _0xe40628,
        operation: _0xc1ddab,
        phase: 'target-selection',
      }),
      _0x5cd835(_0x572b94, 'need_clarification', _0xe40628, { question: _0xe40628, options: [] })
    );
  }
  async function _0x5d44e8({
    operation: _0x5b00c7,
    targetSkill: _0x22137f,
    message: _0x42817c,
    originalMessage: _0x1b25b6,
    clarificationAnswer: clarificationAnswer = '',
    runId: _0x172437,
    signal: _0x47f076,
  }) {
    if (typeof author !== 'function' || typeof saveSkill !== 'function')
      return _0x5cd835(_0x172437, 'failed', formatText('unavailable', {}, localeProvider?.()), {
        errorCode: 'SKILL_LIFECYCLE_UNAVAILABLE',
      });
    if (!_0x22137f['editable'])
      return _0x5cd835(
        _0x172437,
        'failed',
        formatText('readOnly', { id: _0x22137f['id'] }, localeProvider?.()),
        { errorCode: 'SKILL_NOT_EDITABLE' },
      );
    let _0xc71294;
    try {
      _0xc71294 = await requestNormalizedAgentSkillDraft({
        author: author,
        payload: {
          operation: _0x5b00c7,
          message: _0x42817c,
          originalMessage: _0x1b25b6,
          clarificationAnswer: clarificationAnswer,
          targetSkill: _0x22137f,
          history: _0x1ddefe?.['getHistory']?.() || [],
          existingSkills: _0x159d35()['map'](({ id: _0x57850d, title: _0x276351 }) => ({
            id: _0x57850d,
            title: _0x276351,
          })),
          signal: _0x47f076,
          onTrace: (_0x355ae3) => _0x1ddefe?.['recordTrace']?.(_0x355ae3),
        },
        onTrace: (_0x53fe95) => _0x1ddefe?.['recordTrace']?.(_0x53fe95),
      });
    } catch (_0x3f5262) {
      _0xc71294 = {
        ok: ![],
        status: 'failed',
        errorCode: 'SKILL_AUTHORING_FAILED',
        message: _0x3f5262?.['message'],
      };
    }
    if (!isActiveRun(_0x172437)) return _0x191b41(_0x172437);
    if (_0xc71294['status'] === 'need_clarification') {
      const _0x12ae57 = _0xc71294['question'];
      return (
        _0x259d3b({
          originalMessage: _0x1b25b6,
          question: _0x12ae57,
          operation: _0x5b00c7,
          skillId: _0x22137f['id'],
          phase: 'authoring-clarification',
        }),
        _0x5cd835(_0x172437, 'need_clarification', _0xc71294['reply'] || _0x12ae57, {
          question: _0x12ae57,
          options: _0xc71294['options'] || [],
        })
      );
    }
    if (!_0xc71294['ok'])
      return _0x5cd835(
        _0x172437,
        'failed',
        _0xc71294['message'] || formatText('failed', {}, localeProvider?.()),
        { errorCode: _0xc71294['errorCode'] },
      );
    const _0x14b069 = _0x159d35()['map']((_0x27da09) => _0x27da09['id']),
      _0x5ec603 = { ..._0xc71294['definition'], mode: _0x5b00c7 === 'update' ? 'update' : 'create' };
    if (_0x5b00c7 === 'update')
      (_0x5ec603['id'] !== _0x22137f['id'] &&
        _0x1ddefe?.['recordTrace']?.({
          type: 'agent_skill_update_id_repaired',
          requestedId: _0x5ec603['id'],
          skillId: _0x22137f['id'],
        }),
        (_0x5ec603['id'] = _0x22137f['id']));
    else {
      const _0x4b50fe = _0x5ec603['id'] === _0x22137f['id'] ? _0x22137f['id'] : _0x5ec603['id'],
        _0x3fda5c = createAvailableAgentSkillId(_0x4b50fe, _0x14b069);
      (_0x3fda5c !== _0x5ec603['id'] &&
        _0x1ddefe?.['recordTrace']?.({
          type: 'agent_skill_duplicate_id_repaired',
          requestedId: _0x5ec603['id'],
          skillId: _0x3fda5c,
        }),
        (_0x5ec603['id'] = _0x3fda5c));
    }
    let _0x16d4b4;
    try {
      _0x16d4b4 = await saveSkill(_0x5ec603);
      if (_0x5b00c7 === 'clone' && _0x16d4b4?.['errorCode'] === 'SKILL_ALREADY_INSTALLED') {
        const _0x56b2b3 = createAvailableAgentSkillId(_0x5ec603['id'], [..._0x14b069, _0x5ec603['id']]);
        (_0x1ddefe?.['recordTrace']?.({
          type: 'agent_skill_duplicate_id_repaired',
          requestedId: _0x5ec603['id'],
          skillId: _0x56b2b3,
          reason: 'save-race',
        }),
          (_0x5ec603['id'] = _0x56b2b3),
          (_0x16d4b4 = await saveSkill(_0x5ec603)));
      }
    } catch (_0x482da3) {
      _0x16d4b4 = { success: ![], errorCode: 'SKILL_SAVE_FAILED', message: _0x482da3?.['message'] };
    }
    if (!isActiveRun(_0x172437)) return _0x191b41(_0x172437);
    if (_0x16d4b4?.['success'] !== !![])
      return _0x5cd835(_0x172437, 'failed', formatText('failed', {}, localeProvider?.()), {
        errorCode: _0x16d4b4?.['errorCode'] || 'SKILL_SAVE_FAILED',
      });
    _0x1ddefe?.['clearPendingClarification']?.();
    const _0x999338 = _0x5b00c7 === 'update' ? 'updated' : 'cloned';
    return _0x5cd835(
      _0x172437,
      'success',
      formatText(
        _0x999338,
        { id: _0x5ec603['id'], title: _0x5ec603['title'] || _0x5ec603['id'] },
        localeProvider?.(),
      ),
      { skill: _0x5ec603 },
    );
  }
  async function _0x4228f3({
    message: message = '',
    originalMessage: originalMessage = message,
    clarificationAnswer: clarificationAnswer = '',
    operation: operation = '',
    targetSkillId: targetSkillId = '',
    runId: runId = '',
    signal: signal = null,
  } = {}) {
    const _0x296041 = operation || detectAgentSkillLifecycleIntent(message, _0x4e9ab6());
    if (!_0x296041) return null;
    _0x1ddefe?.['recordTrace']?.({
      type: 'agent_turn_routed',
      channel: 'skill.lifecycle',
      reason: clarificationAnswer ? 'skill-lifecycle-continuation' : 'skill-lifecycle-' + _0x296041,
    });
    const _0x324aae = targetSkillId ? _0x11bfad(targetSkillId) : null,
      _0x30348c = _0x324aae
        ? { status: 'resolved', skill: _0x324aae }
        : resolveAgentSkillLifecycleTarget(message, _0x4e9ab6());
    if (_0x30348c['status'] === 'not_found')
      return _0x5cd835(
        runId,
        'failed',
        formatText('notFound', { id: _0x30348c['requestedId'] }, localeProvider?.()),
        { errorCode: 'SKILL_NOT_FOUND' },
      );
    if (_0x30348c['status'] !== 'resolved')
      return _0xd5868d({ operation: _0x296041, originalMessage: originalMessage, runId: runId });
    const _0x2a0298 = _0x30348c['skill'];
    if (_0x296041 === 'inspect') {
      const _0x3c519e = formatText(
        'inspect',
        {
          id: _0x2a0298['id'],
          title: _0x2a0298['title'] || _0x2a0298['id'],
          status: formatText(
            _0x2a0298['enabled'] ? 'statusEnabled' : 'statusDisabled',
            {},
            localeProvider?.(),
          ),
          description: _0x2a0298['description'] || '-',
          triggers: _0x2a0298['triggers']['join']('、') || '-',
          instructions: _0x2a0298['instructions'] || '-',
        },
        localeProvider?.(),
      );
      return _0x5cd835(runId, 'success', _0x3c519e, { skill: _0x2a0298 });
    }
    if (['enable', 'disable']['includes'](_0x296041)) {
      const _0x1b849e = _0x296041 === 'enable',
        _0x444569 =
          typeof setSkillEnabled === 'function'
            ? setSkillEnabled
            : (_0x36f9d0, _0x101d86) => skillRegistry?.['setSkillEnabled']?.(_0x36f9d0, _0x101d86);
      let _0x10cc21 = ![];
      try {
        _0x10cc21 = await _0x444569(_0x2a0298['id'], _0x1b849e);
      } catch {}
      if (!_0x10cc21)
        return _0x5cd835(runId, 'failed', formatText('failed', {}, localeProvider?.()), {
          errorCode: 'SKILL_ENABLE_STATE_FAILED',
        });
      return _0x5cd835(
        runId,
        'success',
        formatText(
          _0x1b849e ? 'enabled' : 'disabled',
          { id: _0x2a0298['id'], title: _0x2a0298['title'] || _0x2a0298['id'] },
          localeProvider?.(),
        ),
        { skillId: _0x2a0298['id'], enabled: _0x1b849e },
      );
    }
    if (_0x296041 === 'delete') {
      const _0x238f81 = formatText(
        'deleteConfirm',
        { id: _0x2a0298['id'], title: _0x2a0298['title'] || _0x2a0298['id'] },
        localeProvider?.(),
      );
      return (
        _0x259d3b({
          originalMessage: originalMessage,
          question: _0x238f81,
          operation: _0x296041,
          skillId: _0x2a0298['id'],
          phase: 'delete-confirmation',
        }),
        _0x5cd835(runId, 'need_clarification', _0x238f81, { question: _0x238f81, options: [] })
      );
    }
    return _0x5d44e8({
      operation: _0x296041,
      targetSkill: _0x2a0298,
      message: message,
      originalMessage: originalMessage,
      clarificationAnswer: clarificationAnswer,
      runId: runId,
      signal: signal,
    });
  }
  async function _0x56de3a({
    answer: answer = '',
    pending: pending = _0x2d0ede(),
    runId: runId = '',
    signal: signal = null,
  } = {}) {
    if (!pending) return null;
    if (isAgentSkillLifecycleCancelMessage(answer))
      return (
        _0x1ddefe?.['clearPendingClarification']?.(),
        _0x5cd835(runId, 'cancelled', formatText('cancelled', {}, localeProvider?.()))
      );
    if (pending['phase'] === 'delete-confirmation') {
      const _0x6a7b40 = _0x11bfad(pending['skillId']);
      if (!_0x6a7b40)
        return _0x5cd835(
          runId,
          'failed',
          formatText('notFound', { id: pending['skillId'] }, localeProvider?.()),
          { errorCode: 'SKILL_NOT_FOUND' },
        );
      if (!isAgentSkillLifecycleConfirmMessage(answer))
        return (
          _0x259d3b(pending),
          _0x5cd835(runId, 'need_clarification', pending['question'], {
            question: pending['question'],
            options: [],
          })
        );
      if (typeof deleteSkill !== 'function')
        return _0x5cd835(runId, 'failed', formatText('unavailable', {}, localeProvider?.()), {
          errorCode: 'SKILL_DELETE_UNAVAILABLE',
        });
      let _0xa18f24;
      try {
        _0xa18f24 = await deleteSkill({ id: _0x6a7b40['id'], confirmed: !![] });
      } catch (_0x1555ef) {
        _0xa18f24 = { success: ![], errorCode: 'SKILL_DELETE_FAILED', message: _0x1555ef?.['message'] };
      }
      if (!isActiveRun(runId)) return _0x191b41(runId);
      if (_0xa18f24?.['success'] !== !![])
        return _0x5cd835(runId, 'failed', formatText('failed', {}, localeProvider?.()), {
          errorCode: _0xa18f24?.['errorCode'] || 'SKILL_DELETE_FAILED',
        });
      return (
        _0x1ddefe?.['clearPendingClarification']?.(),
        _0x5cd835(
          runId,
          'success',
          formatText(
            'deleted',
            { id: _0x6a7b40['id'], title: _0x6a7b40['title'] || _0x6a7b40['id'] },
            localeProvider?.(),
          ),
          { skillId: _0x6a7b40['id'] },
        )
      );
    }
    if (pending['phase'] === 'authoring-clarification') {
      const _0xb57599 = _0x11bfad(pending['skillId']);
      if (!_0xb57599)
        return _0x5cd835(
          runId,
          'failed',
          formatText('notFound', { id: pending['skillId'] }, localeProvider?.()),
          { errorCode: 'SKILL_NOT_FOUND' },
        );
      return _0x5d44e8({
        operation: pending['operation'],
        targetSkill: _0xb57599,
        message: answer,
        originalMessage: pending['originalMessage'],
        clarificationAnswer: answer,
        runId: runId,
        signal: signal,
      });
    }
    return _0x4228f3({
      message: answer,
      originalMessage: pending['originalMessage'],
      clarificationAnswer: answer,
      operation: pending['operation'],
      runId: runId,
      signal: signal,
    });
  }
  return {
    getPending: _0x2d0ede,
    matches: (_0x447e8e) => Boolean(detectAgentSkillLifecycleIntent(_0x447e8e, _0x4e9ab6())),
    run: _0x4228f3,
    answer: _0x56de3a,
  };
}
