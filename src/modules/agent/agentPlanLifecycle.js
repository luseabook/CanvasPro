import { translateManifestText } from '../../i18n/manifestText.js';
import { resolveModelExecution } from '../../manifests/index.js';
import { isAgentEditableParamField } from './agentParameterHints.js';
function stripMarkup(_0x205ac9) {
  return String(_0x205ac9 || '')
    ['replace'](/<[^>]*>/g, '\x20')
    ['replace'](/\s+/g, '\x20')
    ['trim']();
}
function truncateText(_0x4d9126, _0x4cab5e = 0x50) {
  const _0x57c1ed = stripMarkup(_0x4d9126);
  return _0x57c1ed['length'] <= _0x4cab5e
    ? _0x57c1ed
    : _0x57c1ed['slice'](0x0, Math['max'](0x0, _0x4cab5e - 0x3)) + '...';
}
function getPlainObject(_0xa4255c) {
  return _0xa4255c && typeof _0xa4255c === 'object' && !Array['isArray'](_0xa4255c) ? _0xa4255c : {};
}
function readPathSegment(_0x1c19a2, _0x588ffb) {
  if (_0x1c19a2 == null) return undefined;
  if (Array['isArray'](_0x1c19a2) && /^\d+$/['test'](_0x588ffb)) return _0x1c19a2[Number(_0x588ffb)];
  return _0x1c19a2?.[_0x588ffb];
}
function resolveScopedExpression(_0x5087ac, _0x597cfc = {}) {
  const _0x4ef9f5 = String(_0x5087ac || '')
      ['trim']()
      ['split']('.')
      ['map']((_0x24a3e7) => _0x24a3e7['trim']())
      ['filter'](Boolean),
    _0x391d68 = _0x4ef9f5['shift']();
  if (!_0x391d68 || !Object['prototype']['hasOwnProperty']['call'](_0x597cfc, _0x391d68)) return { ok: ![] };
  let _0x1a73be = _0x597cfc[_0x391d68];
  for (const _0x1c5a3a of _0x4ef9f5) {
    _0x1a73be = readPathSegment(_0x1a73be, _0x1c5a3a);
    if (_0x1a73be === undefined) return { ok: ![] };
  }
  return { ok: !![], value: _0x1a73be };
}
function resolveScopedValue(_0x1877a0, _0x5cef8e = {}) {
  if (typeof _0x1877a0 === 'string') {
    const _0x1b8584 = /^\$([A-Za-z_][A-Za-z0-9_]*(?:\.(?:[A-Za-z_][A-Za-z0-9_]*|\d+))*)$/['exec'](
      _0x1877a0['trim'](),
    );
    if (!_0x1b8584) return _0x1877a0;
    const _0x568837 = resolveScopedExpression(_0x1b8584[0x1], _0x5cef8e);
    return _0x568837['ok'] ? _0x568837['value'] : _0x1877a0;
  }
  if (Array['isArray'](_0x1877a0))
    return _0x1877a0['map']((_0x27b8d5) => resolveScopedValue(_0x27b8d5, _0x5cef8e));
  if (_0x1877a0 && typeof _0x1877a0 === 'object') {
    const _0x187f57 = {};
    for (const [_0x540fba, _0x3f00d5] of Object['entries'](_0x1877a0)) {
      _0x187f57[_0x540fba] = resolveScopedValue(_0x3f00d5, _0x5cef8e);
    }
    return _0x187f57;
  }
  return _0x1877a0;
}
function resolveActionArgs(_0x14881c = {}, _0x58bc9b = {}) {
  return resolveScopedValue(_0x14881c['args'] || {}, _0x58bc9b);
}
function formatTraceReason(_0x27054c = '') {
  const _0x161453 = String(_0x27054c || ''),
    _0xb12c13 = {
      'selected\x20image\x20has\x20compatible\x20image-to-video\x20model':
        '已根据选中图片选择兼容的图生视频模型',
      'requested\x20model\x20was\x20available\x20in\x20context': '已使用上下文中的请求模型',
      'target\x20model\x20uiSchema\x20does\x20not\x20declare\x20removed\x20params':
        '已移除目标模型不支持的参数',
      'generation\x20run\x20requires\x20confirmation': '生成执行需要确认',
      'existing\x20node\x20connection\x20change\x20requires\x20confirmation': '修改已有节点连接需要确认',
      'existing\x20node\x20prompt\x20change\x20requires\x20confirmation': '修改已有节点 Prompt 需要确认',
      'existing\x20node\x20generation\x20params\x20change\x20requires\x20confirmation':
        '修改已有节点参数需要确认',
      'existing\x20node\x20model\x20change\x20requires\x20confirmation': '修改已有节点模型需要确认',
      'existing\x20input\x20slot\x20change\x20requires\x20confirmation': '修改已有输入槽需要确认',
      'node\x20delete\x20requires\x20confirmation': '删除节点需要确认',
      'large\x20batch\x20requires\x20confirmation': '批量操作数量较多，需要确认',
      'planner\x20requested\x20confirmation': '规划器要求确认',
      'action\x20risk\x20requires\x20confirmation': '动作风险要求确认',
      'command\x20risk\x20requires\x20confirmation': '命令风险要求确认',
    };
  return _0xb12c13[_0x161453] || _0x161453 || '需要确认';
}
function summarizeDebugTraceForConfirmation(_0x430823 = []) {
  if (!Array['isArray'](_0x430823) || _0x430823['length'] === 0x0) return [];
  const _0x40c3cd = [];
  for (const _0x461547 of _0x430823) {
    _0x461547?.['type'] === 'contextual_default_applied' &&
      _0x461547['field'] === 'model' &&
      _0x40c3cd['push']('模型选择：' + formatTraceReason(_0x461547['reason']) + '。');
    if (_0x461547?.['type'] === 'params_filtered') {
      const _0x1c220c = Array['isArray'](_0x461547['removedParamIds'])
        ? _0x461547['removedParamIds']['length']
        : 0x0;
      _0x40c3cd['push'](
        _0x1c220c > 0x0
          ? '参数检查：已自动忽略当前模型不支持的设置。'
          : '参数检查：当前设置均受所选模型支持。',
      );
    }
    (_0x461547?.['type'] === 'confirmation_required' &&
      _0x40c3cd['push']('确认原因：' + formatTraceReason(_0x461547['reason']) + '。'),
      _0x461547?.['type'] === 'parameter_hints_model_applied' &&
        _0x40c3cd['push']('参数识别：已选择支持你指定设置的模型。'),
      _0x461547?.['type'] === 'parameter_hints_applied' &&
        _0x40c3cd['push']('参数识别：已应用你指定的生成设置。'),
      _0x461547?.['type'] === 'parameter_hints_unsupported' &&
        _0x40c3cd['push']('参数识别：部分生成设置不受当前模型支持，已忽略。'));
  }
  return _0x40c3cd['slice'](0x0, 0x6);
}
export function createAgentPlanLifecycle({
  readCanvasState: _0x35e644,
  localeProvider: _0x56813c,
  formatText: _0x573081,
  isSafeAction: _0x58d385,
} = {}) {
  if (typeof _0x35e644 !== 'function' || typeof _0x58d385 !== 'function')
    throw new TypeError('[agentPlanLifecycle]\x20readCanvasState\x20and\x20isSafeAction\x20are\x20required');
  function _0x137315() {
    return _0x56813c?.() || 'zh-CN';
  }
  function _0x27d3df(_0x5b4d0a) {
    return typeof _0x573081 === 'function' ? _0x573081(_0x5b4d0a) : _0x5b4d0a;
  }
  function _0x221f55(_0x146dc8 = {}, _0x55ae49 = '') {
    const _0x5c0cc5 = String(_0x55ae49 || '')['trim']();
    return _0x5c0cc5 ? _0x146dc8['nodes']?.[_0x5c0cc5] || null : null;
  }
  function _0x35e09d(_0x488bf2) {
    const _0x3d52b1 = String(_0x488bf2 || '');
    if (_0x3d52b1 === 'ai-image') return _0x27d3df('nodeCreateImage');
    if (_0x3d52b1 === 'ai-video') return _0x27d3df('nodeCreateVideo');
    if (_0x3d52b1 === 'ai-audio') return _0x27d3df('nodeCreateAudio');
    if (_0x3d52b1 === 'ai-text' || _0x3d52b1 === 'source-text') return _0x27d3df('nodeCreateText');
    return _0x27d3df('nodeCreate');
  }
  function _0x58607a(_0x3ec9ff, _0x1d8fe3 = {}) {
    const _0x4ffa77 = String(_0x3ec9ff || '');
    if (_0x4ffa77 === 'node.create') return _0x35e09d(_0x1d8fe3['type']);
    if (_0x4ffa77 === 'node.setPrompt' || _0x4ffa77 === 'node.appendPrompt')
      return _0x27d3df('nodeSetPrompt');
    if (_0x4ffa77 === 'node.setParams') return _0x27d3df('nodeSetParams');
    if (_0x4ffa77 === 'graph.connect') return _0x27d3df('graphConnect');
    if (_0x4ffa77 === 'layout.align') return _0x27d3df('layoutAlign');
    if (_0x4ffa77 === 'layout.arrangeRow') return _0x27d3df('layoutArrangeRow');
    if (_0x4ffa77 === 'layout.arrangeColumn') return _0x27d3df('layoutArrangeColumn');
    if (_0x4ffa77 === 'layout.arrangeGrid') return _0x27d3df('layoutArrangeGrid');
    if (_0x4ffa77 === 'generation.run') return _0x27d3df('generationRun');
    if (_0x4ffa77 === 'generation.runBatch') return _0x27d3df('generationRunBatch');
    if (_0x4ffa77 === 'node.delete') return _0x27d3df('nodeDelete');
    return _0x4ffa77;
  }
  function _0x11007d(_0x394106 = {}, _0x3d20a = {}) {
    const _0x51e417 = resolveActionArgs(_0x394106, _0x3d20a);
    return {
      type: String(_0x394106['type'] || ''),
      label: _0x58607a(_0x394106['type'], _0x51e417),
      args: _0x51e417,
      promptSummary: truncateText(_0x51e417['prompt'] || _0x51e417['text'] || '', 0x3c),
    };
  }
  function _0x324192(_0x46b8ac = {}, _0x4484aa = '') {
    const _0x181b64 = Object['values'](_0x46b8ac['edges'] || {})['filter'](
        (_0x14d9b1) => String(_0x14d9b1?.['targetId'] || '') === String(_0x4484aa || ''),
      ),
      _0xf8f452 = new Set(
        (_0x46b8ac['selectedNodeIds'] || [])['map']((_0x16b0d7) => String(_0x16b0d7 || '')),
      ),
      _0xc96aa0 = _0x181b64['map']((_0x4683b6) => {
        const _0x184c2f = _0x221f55(_0x46b8ac, _0x4683b6['sourceId']);
        if (!_0x184c2f) return '';
        const _0x3819fe = String(_0x184c2f['name'] || _0x184c2f['id'] || _0x4683b6['sourceId']),
          _0x242989 = ['ai-image', 'source-image']['includes'](String(_0x184c2f['type'] || '')),
          _0x4c2884 =
            _0xf8f452['has'](String(_0x184c2f['id'] || '')) && _0x242989
              ? _0x27d3df('selectedImageInput')
              : _0x27d3df('inputNode');
        return _0x4c2884 + '：' + _0x3819fe;
      })['filter'](Boolean);
    return _0xc96aa0['join']('，') || _0x27d3df('noInputSource');
  }
  function _0x41f205(_0xf164fb = {}) {
    if (!Array['isArray'](_0xf164fb['options'])) return [];
    const _0x212c6c = _0x137315();
    return _0xf164fb['options']
      ['map']((_0x5d5a17) => {
        const _0x22c221 =
            _0x5d5a17 && typeof _0x5d5a17 === 'object' && !Array['isArray'](_0x5d5a17)
              ? (_0x5d5a17['value'] ?? _0x5d5a17['id'] ?? _0x5d5a17['label'] ?? '')
              : _0x5d5a17,
          _0x4aafac =
            _0x5d5a17 && typeof _0x5d5a17 === 'object' && !Array['isArray'](_0x5d5a17)
              ? (_0x5d5a17['label'] ?? _0x5d5a17['selectedLabel'])
              : _0x5d5a17,
          _0x9e00ab =
            _0x5d5a17 && typeof _0x5d5a17 === 'object' && !Array['isArray'](_0x5d5a17)
              ? (_0x5d5a17['displayLabel'] ?? _0x5d5a17['selectedLabel'] ?? _0x5d5a17['label'])
              : _0x5d5a17;
        return {
          value: _0x22c221,
          label: translateManifestText(_0x4aafac, { locale: _0x212c6c }),
          selectedLabel: translateManifestText(_0x9e00ab, { locale: _0x212c6c }),
          disabled: _0x5d5a17?.['disabled'] === !![],
        };
      })
      ['filter'](
        (_0x184067) =>
          _0x184067['value'] !== undefined &&
          _0x184067['value'] !== '' &&
          String(_0x184067['label'] || '')['trim'](),
      );
  }
  function _0xea0fda(_0x1c8ab6 = {}, _0x229c0b = {}) {
    const _0x3d0c74 = _0x137315(),
      _0x57cf10 = Array['isArray'](_0x1c8ab6?.['uiSchema']?.['fields'])
        ? _0x1c8ab6['uiSchema']['fields']
        : [];
    return _0x57cf10['filter']((_0x2f3720) => isAgentEditableParamField(_0x2f3720, _0x229c0b))
      ['map']((_0x343cd4) => {
        const _0x57385c = String(_0x343cd4['id'] || '')['trim'](),
          _0x367ce7 = translateManifestText(_0x343cd4['label'], { locale: _0x3d0c74 });
        if (!_0x367ce7) return null;
        return {
          id: _0x57385c,
          label: _0x367ce7,
          type: String(_0x343cd4['type'] || 'text'),
          displayRole: String(_0x343cd4['displayRole'] || ''),
          placement: String(_0x343cd4['placement'] || ''),
          value: Object['prototype']['hasOwnProperty']['call'](_0x229c0b, _0x57385c)
            ? _0x229c0b[_0x57385c]
            : _0x343cd4['defaultValue'],
          options: _0x41f205(_0x343cd4),
          min: _0x343cd4['min'],
          max: _0x343cd4['max'],
          step: _0x343cd4['step'],
        };
      })
      ['filter'](Boolean);
  }
  function _0x4f4c03(_0x37cecc = {}) {
    const _0x159a37 = _0x37cecc['scope'] || {},
      _0x13f0a3 = (_0x37cecc['actions'] || [])['find']((_0x847f7e) =>
        ['generation.run', 'generation.runBatch']['includes'](_0x847f7e?.['type']),
      );
    if (!_0x13f0a3) return null;
    const _0x2ca36d = resolveActionArgs(_0x13f0a3, _0x159a37),
      _0x276791 =
        _0x13f0a3['type'] === 'generation.runBatch'
          ? (Array['isArray'](_0x2ca36d['nodeIds']) ? _0x2ca36d['nodeIds'] : [])
              ['map']((_0x3d7341) => String(_0x3d7341 || '')['trim']())
              ['filter'](Boolean)
          : [String(_0x2ca36d['nodeId'] || '')['trim']()]['filter'](Boolean),
      _0x23cc2a = _0x276791[0x0] || '',
      _0x2ed4d7 = _0x35e644(),
      _0x523360 = _0x221f55(_0x2ed4d7, _0x23cc2a) || {},
      _0x54255f = resolveModelExecution(_0x523360['model'], { providerHint: _0x523360['provider'] }),
      _0x45cc41 = _0x54255f?.['modelManifest'] || null,
      _0x16dc8a = {
        ...getPlainObject(_0x523360['generationParams']),
        ...getPlainObject(_0x2ca36d['options']?.['params']),
      };
    return {
      nodeId: _0x23cc2a,
      nodeIds: _0x276791,
      batchSize: _0x276791['length'],
      model: String(_0x523360['model'] || ''),
      modelLabel:
        _0x45cc41?.['displayName'] || _0x45cc41?.['title'] || _0x523360['model'] || _0x27d3df('defaultModel'),
      provider: String(_0x523360['provider'] || _0x45cc41?.['provider'] || ''),
      promptSummary: truncateText(
        _0x523360['prompt'] || _0x523360['storyboardScript']?.['prompt'] || '',
        0x78,
      ),
      params: _0x16dc8a,
      editableParams: _0xea0fda(_0x45cc41, _0x16dc8a),
      inputSource: _0x324192(_0x2ed4d7, _0x23cc2a),
    };
  }
  function _0x12c699(
    _0x39b6a5 = {},
    { debugTrace: debugTrace = [], debugTraceSummary: debugTraceSummary = null } = {},
  ) {
    const _0x5930de = _0x39b6a5['scope'] || {};
    return {
      ..._0x39b6a5,
      confirmationSummary: {
        completedActions: (_0x39b6a5['preExecutedActions'] || [])['map']((_0x35a49b) =>
          _0x11007d(_0x35a49b, _0x5930de),
        ),
        pendingActions: (_0x39b6a5['actions'] || [])['map']((_0x11c27) => _0x11007d(_0x11c27, _0x5930de)),
        generation: _0x4f4c03(_0x39b6a5),
        debugTraceSummary: Array['isArray'](debugTraceSummary)
          ? debugTraceSummary
          : summarizeDebugTraceForConfirmation(debugTrace),
        cancelNotice: _0x27d3df('cancelNotice'),
      },
    };
  }
  function _0x8f4d63(_0x3c32de = {}, _0x355a41 = {}) {
    const _0x45bc2c = Number(_0x3c32de['raw']?.['result']?.['failedIndex']),
      _0xdd56d4 =
        Number['isFinite'](_0x45bc2c) && _0x45bc2c >= 0x0
          ? _0x355a41['actions']?.[_0x45bc2c] || null
          : _0x355a41['actions']?.['find']((_0x325b5f) => _0x325b5f?.['type'] === 'generation.run') || null;
    if (!_0xdd56d4) return { recovery: null, retryPlan: _0x355a41 };
    const _0x2d65a3 = {
      errorCode: _0x3c32de['errorCode'] || _0x3c32de['raw']?.['errorCode'] || '',
      failedAction: _0x11007d(_0xdd56d4, _0x355a41['scope'] || {}),
      options: [
        { id: 'retry', label: _0x27d3df('retry') },
        { id: 'editPrompt', label: _0x27d3df('editPrompt') },
        { id: 'changeModel', label: _0x27d3df('changeModel') },
        { id: 'keepPrepared', label: _0x27d3df('keepPrepared') },
      ],
    };
    if (!Number['isFinite'](_0x45bc2c) || _0x45bc2c < 0x0 || _0x45bc2c >= _0x355a41['actions']['length'])
      return { recovery: _0x2d65a3, retryPlan: _0x355a41 };
    const _0x4dd242 = _0x3c32de['raw']?.['result']?.['aliases'];
    return {
      recovery: _0x2d65a3,
      retryPlan: {
        ..._0x355a41,
        actions: _0x355a41['actions']['slice'](_0x45bc2c),
        preExecutedActions: [
          ...(Array['isArray'](_0x355a41['preExecutedActions']) ? _0x355a41['preExecutedActions'] : []),
          ..._0x355a41['actions']['slice'](0x0, _0x45bc2c),
        ],
        scope: {
          ...(_0x355a41['scope'] && typeof _0x355a41['scope'] === 'object' ? _0x355a41['scope'] : {}),
          ...(_0x4dd242 && typeof _0x4dd242 === 'object' ? _0x4dd242 : {}),
        },
      },
    };
  }
  function _0x304ef1({ plan: plan = null, recovery: recovery = null } = {}) {
    if (recovery) {
      const _0x4cdd81 = recovery['failedAction']?.['label'] || recovery['failedAction']?.['type'] || '';
      return truncateText(_0x4cdd81 ? '失败动作：' + _0x4cdd81 : '上次生成失败，可重新规划。', 0xf0);
    }
    const _0x5f263b = plan?.['confirmationSummary'] || {},
      _0x314f2c = Array['isArray'](_0x5f263b['pendingActions']) ? _0x5f263b['pendingActions'] : [],
      _0x1bf57f = Array['isArray'](_0x5f263b['completedActions']) ? _0x5f263b['completedActions'] : [],
      _0x3490a5 = _0x314f2c['map']((_0x25f58c) => _0x25f58c?.['label'] || _0x25f58c?.['type'] || '')
        ['filter'](Boolean)
        ['slice'](0x0, 0x3),
      _0x4d0cc7 = [];
    if (_0x1bf57f['length']) _0x4d0cc7['push']('已准备 ' + _0x1bf57f['length'] + '\x20步');
    if (_0x3490a5['length']) _0x4d0cc7['push']('待确认：' + _0x3490a5['join']('，'));
    if (_0x5f263b['generation']?.['modelLabel'])
      _0x4d0cc7['push']('模型：' + _0x5f263b['generation']['modelLabel']);
    return (
      _0x5f263b['generation']?.['promptSummary'] &&
        _0x4d0cc7['push']('Prompt：' + _0x5f263b['generation']['promptSummary']),
      truncateText(_0x4d0cc7['join']('；') || plan?.['reply'] || '', 0xf0)
    );
  }
  function _0x14508b(_0x553eaa = {}) {
    const _0x4e1270 = Array['isArray'](_0x553eaa['actions']) ? _0x553eaa['actions'] : [],
      _0x5d42da = _0x4e1270['findIndex']((_0x37c101) => !_0x58d385(_0x37c101));
    if (_0x5d42da <= 0x0) return { prefix: [], pending: _0x4e1270 };
    return { prefix: _0x4e1270['slice'](0x0, _0x5d42da), pending: _0x4e1270['slice'](_0x5d42da) };
  }
  return Object['freeze']({
    describe: _0x304ef1,
    partition: _0x14508b,
    recover: _0x8f4d63,
    review: _0x12c699,
  });
}
