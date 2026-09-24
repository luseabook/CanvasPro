const SMALL_REGISTRY_FULL_DISCLOSURE_LIMIT = 0xc,
  DEFAULT_COMMAND_LIMIT = 0x12,
  ALWAYS_AVAILABLE_COMMANDS = Object['freeze']([
    'agent.capabilities.search',
    'agent.command.describe',
    'agent.models.search',
    'graph.getCanvasSummary',
    'graph.getSelection',
    'node.getSummary',
  ]),
  COMMAND_NAMESPACES = Object['freeze']({
    generation: Object['freeze']([
      'node.create',
      'node.createConnected',
      'graph.connect',
      'node.setInputSlot',
      'node.setPrompt',
      'node.appendPrompt',
      'node.setModel',
      'node.changeModel',
      'node.setParams',
      'generation.run',
      'generation.runBatch',
    ]),
    edit: Object['freeze']([
      'node.create',
      'node.delete',
      'node.rename',
      'node.duplicate',
      'node.group',
      'node.ungroup',
      'clipboard.copy',
      'clipboard.paste',
      'collage.createFromSelection',
      'graph.connect',
      'graph.disconnect',
      'node.setInputSlot',
    ]),
    selection: Object['freeze'](['node.select', 'viewport.focusNodes', 'viewport.fitAll']),
    layout: Object['freeze']([
      'node.select',
      'layout.align',
      'layout.distribute',
      'layout.arrangeRow',
      'layout.arrangeColumn',
      'layout.arrangeGrid',
      'layout.moveNearNode',
      'viewport.focusNodes',
      'viewport.fitAll',
    ]),
    media: Object['freeze']([
      'video.reverse',
      'video.extractKeyframes',
      'video.separateAv',
      'audio.separate',
      'image.splitGrid',
      'media.resetSize',
      'storyboard.createFromImages',
      'storyboard.createGridFromNode',
      'layout.arrangeGrid',
      'viewport.focusNodes',
    ]),
    storyboard: Object['freeze']([
      'storyboard.createFromImages',
      'storyboard.createGridFromNode',
      'layout.arrangeGrid',
      'viewport.focusNodes',
    ]),
    task: Object['freeze']([
      'task.focusResult',
      'task.retry',
      'generation.getStatus',
      'generation.cancel',
      'generation.resume',
      'viewport.focusNodes',
    ]),
    export: Object['freeze'](['node.exportSelected']),
    scene: Object['freeze']([
      'node.create',
      'scene.catalog.search',
      'scene.pose.list',
      'scene.compose',
      'scene.mannequin.setPose',
      'scene.camera.addKeyframe',
      'scene.camera.updateTimeline',
      'viewport.focusNodes',
    ]),
  }),
  NAMESPACE_PATTERNS = Object['freeze']({
    generation: Object['freeze']([
      /\b(?:create|generate|render|make|draw|paint|illustrate|model|workflow|prompt)\b/i,
      /\b(?:text|image)[ -]to[ -](?:image|video)\b/i,
      /\banimate (?:this |the |an )?image\b/i,
      /\b(?:set|change|update|adjust|switch)\b.{0,28}\b(?:model|parameter|params|duration|ratio|resolution|quality|seed|batch)\b/i,
      /\b(?:model|parameter|params|duration|ratio|resolution|quality|seed|batch)\b.{0,28}\b(?:set|change|update|adjust|switch)\b/i,
      /(?:创建|新建|生成|绘制|作图|帮我画|请(?:帮我)?画|画(?:一|个|张|幅|只)|做(?:一个|一张|一段|一条|个|张|段|条|成|出)|模型|工作流|提示词|出图|生图|文生|图生)/,
      /(?:设置|调整|修改|改成|改为|换成|切换).{0,16}(?:模型|参数|时长|秒数|比例|分辨率|尺寸|质量|种子|批量|数量)/,
      /(?:模型|参数|时长|秒数|比例|分辨率|尺寸|质量|种子|批量|数量).{0,16}(?:设置|调整|修改|改成|改为|换成|切换)/,
    ]),
    edit: Object['freeze']([
      /\b(?:edit|delete|remove|rename|duplicate|copy|paste|group|ungroup|connect|disconnect|collage)\b/i,
      /(?:编辑|修改|删除|移除|重命名|改名|复制|粘贴|编组|分组|取消编组|连接|断开|拼贴)/,
    ]),
    selection: Object['freeze']([
      /\b(?:select|focus|locate|find|fit|viewport|zoom to)\b/i,
      /(?:选择|选中|聚焦|定位|查找|适应画布|显示全部)/,
    ]),
    layout: Object['freeze']([
      /\b(?:align|arrange|layout|distribute|row|column|grid|horizontal|vertical|tidy|organize)\b/i,
      /(?:对齐|排列|布局|分布|横向|横排|纵向|竖排|网格|整理|收拾|间距|靠近)/,
    ]),
    media: Object['freeze']([
      /\b(?:reverse|keyframes?|separate|stems?|split grid|reset size|extract frames?)\b/i,
      /(?:倒放|反转视频|关键帧|抽帧|分离音视频|分离人声|音轨分离|拆分宫格|切宫格|重置尺寸)/,
    ]),
    storyboard: Object['freeze']([
      /\b(?:storyboard|shot board|contact sheet)\b/i,
      /(?:分镜板|故事板|镜头板|分镜网格)/,
    ]),
    task: Object['freeze']([
      /\b(?:task|job|status|retry|cancel|resume|continue generation)\b/i,
      /(?:任务|状态|重试|取消生成|恢复生成|继续生成|失败结果)/,
    ]),
    export: Object['freeze']([/\b(?:export|download|zip|save outputs?)\b/i, /(?:导出|下载|打包|保存结果)/]),
    scene: Object['freeze']([
      /\b(?:3d|stage|scene|mannequin|pose|camera keyframe|camera timeline)\b/i,
      /(?:3D|三维|舞台|场景|人体模型|姿势|相机关键帧|相机时间线|镜头轨迹)/i,
    ]),
  }),
  COMMAND_INTENT_PATTERNS = Object['freeze']([
    Object['freeze']({
      commandIds: Object['freeze'](['generation.runBatch']),
      patterns: Object['freeze']([
        /\b(?:batch|multiple|several)\b.{0,24}\b(?:generate|render|images?|videos?)\b/i,
        /\b(?:generate|render)\b.{0,24}\b(?:multiple|several|copies|variants)\b/i,
        /(?:批量|多张|多份|多个).{0,16}(?:生成|出图|生图|渲染|产品图|视频)/,
        /(?:产品图|图片|视频).{0,16}(?:复制|副本|多份|拼贴)/,
      ]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['collage.createFromSelection']),
      patterns: Object['freeze']([/\bcollage\b/i, /(?:拼贴|拼图|合成拼图)/]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['node.duplicate']),
      patterns: Object['freeze']([/\bduplicate\b/i, /(?:复制.{0,8}(?:份|次|个)|克隆)/]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['clipboard.copy']),
      patterns: Object['freeze']([/\bcopy\b/i, /(?:复制到剪贴板|拷贝)/]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['clipboard.paste']),
      patterns: Object['freeze']([/\bpaste\b/i, /粘贴/]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['node.delete']),
      patterns: Object['freeze']([/\b(?:delete|remove)\b/i, /(?:删除|移除)/]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['node.rename']),
      patterns: Object['freeze']([/\brename\b/i, /(?:重命名|改名)/]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['node.group', 'node.ungroup']),
      patterns: Object['freeze']([/\b(?:group|ungroup)\b/i, /(?:编组|取消编组|取消分组)/]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['graph.connect', 'node.setInputSlot']),
      patterns: Object['freeze']([/\bconnect\b/i, /(?:连接|接入|输入槽)/]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['graph.disconnect']),
      patterns: Object['freeze']([/\bdisconnect\b/i, /(?:断开|取消连接)/]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['node.setModel', 'node.changeModel']),
      patterns: Object['freeze']([
        /\b(?:change|switch|set)\b.{0,18}\bmodel\b/i,
        /(?:换模型|切换模型|设置模型|模型改成)/,
      ]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['node.setParams']),
      patterns: Object['freeze']([
        /\b(?:parameter|params|duration|ratio|resolution|quality|seed|batch)\b/i,
        /(?:参数|时长|秒数|比例|分辨率|尺寸|质量|种子|批量|数量)/,
      ]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['layout.align']),
      patterns: Object['freeze']([/\balign\b/i, /对齐/]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['layout.arrangeRow']),
      patterns: Object['freeze']([/\b(?:row|horizontal)\b/i, /(?:横排|横向)/]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['layout.arrangeColumn']),
      patterns: Object['freeze']([/\b(?:column|vertical)\b/i, /(?:竖排|纵向)/]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['layout.arrangeGrid']),
      patterns: Object['freeze']([/\bgrid\b/i, /网格/]),
    }),
    Object['freeze']({
      commandIds: Object['freeze'](['node.exportSelected']),
      patterns: Object['freeze']([/\b(?:export|download|zip)\b/i, /(?:导出|下载|打包)/]),
    }),
  ]);
function normalizeCommands(_0xe9befb = []) {
  return Array['isArray'](_0xe9befb) ? _0xe9befb['filter']((_0x323152) => _0x323152?.['id']) : [];
}
function matchesAny(_0x4c9f3a, _0x16e218 = []) {
  return _0x16e218['some']((_0x537cc8) => _0x537cc8['test'](_0x4c9f3a));
}
function addCommandPriority(_0x2a36aa, _0x3fbfce = [], _0x186f89 = 0x0) {
  for (const _0x446577 of _0x3fbfce) {
    const _0x53e1c4 = String(_0x446577 || '')['trim']();
    if (!_0x53e1c4) continue;
    _0x2a36aa['set'](_0x53e1c4, Math['max'](_0x2a36aa['get'](_0x53e1c4) || 0x0, _0x186f89));
  }
}
function findExplicitCommandIds(_0x2310b7, _0x47a1c0 = []) {
  const _0x16489b = String(_0x2310b7 || '')['toLowerCase']();
  return _0x47a1c0['filter']((_0x238536) => _0x16489b['includes'](String(_0x238536)['toLowerCase']()));
}
function findIntentCommandIds(_0x153f59 = '') {
  return COMMAND_INTENT_PATTERNS['flatMap']((_0x3cd5ef) =>
    matchesAny(_0x153f59, _0x3cd5ef['patterns']) ? _0x3cd5ef['commandIds'] : [],
  );
}
function inferNamespaces({
  userMessage: userMessage = '',
  intent: intent = null,
  targetKind: targetKind = '',
} = {}) {
  const _0x1cc9d2 = [
      intent?.['namespace'],
      intent?.['route'],
      intent?.['capability'],
      intent?.['action'],
      intent?.['operation'],
      ...(Array['isArray'](intent?.['namespaces']) ? intent['namespaces'] : []),
    ]
      ['map']((_0x32edeb) =>
        String(_0x32edeb || '')
          ['trim']()
          ['toLowerCase'](),
      )
      ['filter'](Boolean),
    _0x23379b = [String(userMessage || '')['trim'](), ..._0x1cc9d2]['join']('\x20'),
    _0x17ae91 = [];
  for (const [_0x39300e, _0x2590e8] of Object['entries'](NAMESPACE_PATTERNS)) {
    (_0x1cc9d2['includes'](_0x39300e) || matchesAny(_0x23379b, _0x2590e8)) && _0x17ae91['push'](_0x39300e);
  }
  return (
    targetKind &&
      (intent?.['canvasAction'] === !![] || intent?.['mutatesCanvas'] === !![]) &&
      !_0x17ae91['includes']('generation') &&
      _0x17ae91['push']('generation'),
    _0x17ae91
  );
}
function summarizeNamespace(_0x2ade02, _0x25db6b) {
  const _0x145df8 = (COMMAND_NAMESPACES[_0x2ade02] || [])['filter']((_0x3e6237) =>
    _0x25db6b['has'](_0x3e6237),
  );
  return { id: _0x2ade02, commandIds: _0x145df8 };
}
export function routeAgentCapabilities({
  commands: commands = [],
  skills: skills = [],
  userMessage: userMessage = '',
  intent: intent = null,
  targetKind: targetKind = '',
  maxCommands: maxCommands = DEFAULT_COMMAND_LIMIT,
  requiredCommandIds: requiredCommandIds = [],
} = {}) {
  const _0x219b75 = normalizeCommands(commands),
    _0x2dff5a = new Set(_0x219b75['map']((_0xd357f7) => _0xd357f7['id'])),
    _0x1c2e0f = _0x219b75['map']((_0x2fd2c3) => _0x2fd2c3['id']),
    _0x509bcb = inferNamespaces({ userMessage: userMessage, intent: intent, targetKind: targetKind });
  if (_0x219b75['length'] <= SMALL_REGISTRY_FULL_DISCLOSURE_LIMIT)
    return {
      commands: _0x219b75,
      catalog: {
        mode: 'full',
        selectedNamespaces: _0x509bcb,
        includedCommandIds: _0x1c2e0f,
        deferredCommandIds: [],
        namespaces: Object['keys'](COMMAND_NAMESPACES)
          ['map']((_0x404be3) => summarizeNamespace(_0x404be3, _0x2dff5a))
          ['filter']((_0x3abe7c) => _0x3abe7c['commandIds']['length'] > 0x0),
        totalAvailable: _0x219b75['length'],
      },
    };
  const _0xe0c03e = new Map();
  (addCommandPriority(_0xe0c03e, ALWAYS_AVAILABLE_COMMANDS, 0x15e),
    addCommandPriority(_0xe0c03e, requiredCommandIds, 0x2bc),
    _0x509bcb['forEach']((_0x2f1784, _0x3540ca) => {
      addCommandPriority(_0xe0c03e, COMMAND_NAMESPACES[_0x2f1784], 0xc8 - _0x3540ca);
    }));
  for (const _0x6e56dd of Array['isArray'](skills) ? skills : []) {
    addCommandPriority(_0xe0c03e, _0x6e56dd?.['commands'], 0x190);
  }
  (addCommandPriority(_0xe0c03e, findIntentCommandIds(userMessage), 0x1f4),
    addCommandPriority(_0xe0c03e, findExplicitCommandIds(userMessage, _0x1c2e0f), 0x258));
  const _0x167e43 = Number(maxCommands),
    _0x1a6332 = Math['max'](
      ALWAYS_AVAILABLE_COMMANDS['length'],
      Number['isFinite'](_0x167e43) ? Math['trunc'](_0x167e43) : DEFAULT_COMMAND_LIMIT,
    ),
    _0x5b67b6 = new Map(_0x1c2e0f['map']((_0x146bc8, _0x31254c) => [_0x146bc8, _0x31254c])),
    _0x5e1189 = Array['from'](_0xe0c03e['entries']())
      ['filter'](([_0x140239]) => _0x2dff5a['has'](_0x140239))
      ['sort']((_0xe3f0f2, _0x4982d3) => {
        if (_0x4982d3[0x1] !== _0xe3f0f2[0x1]) return _0x4982d3[0x1] - _0xe3f0f2[0x1];
        return _0x5b67b6['get'](_0xe3f0f2[0x0]) - _0x5b67b6['get'](_0x4982d3[0x0]);
      })
      ['slice'](0x0, _0x1a6332)
      ['map'](([_0x112913]) => _0x112913),
    _0x25174d = new Set(_0x5e1189),
    _0x4f0076 = _0x219b75['filter']((_0x41437b) => _0x25174d['has'](_0x41437b['id']));
  return {
    commands: _0x4f0076,
    catalog: {
      mode: 'progressive',
      selectedNamespaces: _0x509bcb,
      includedCommandIds: _0x4f0076['map']((_0x31aa2e) => _0x31aa2e['id']),
      deferredCommandIds: _0x1c2e0f['filter']((_0x90bc98) => !_0x25174d['has'](_0x90bc98)),
      namespaces: Object['keys'](COMMAND_NAMESPACES)
        ['map']((_0x322809) => summarizeNamespace(_0x322809, _0x2dff5a))
        ['filter']((_0x419235) => _0x419235['commandIds']['length'] > 0x0),
      totalAvailable: _0x219b75['length'],
    },
  };
}
export const agentCapabilityRouterInternals = Object['freeze']({
  inferNamespaces: inferNamespaces,
  findIntentCommandIds: findIntentCommandIds,
  COMMAND_NAMESPACES: COMMAND_NAMESPACES,
});
