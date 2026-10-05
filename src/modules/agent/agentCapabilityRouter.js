const SMALL_REGISTRY_FULL_DISCLOSURE_LIMIT = 12,
  DEFAULT_COMMAND_LIMIT = 18,
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
function normalizeCommands(list = []) {
  return Array['isArray'](list) ? list['filter']((value) => value?.['id']) : [];
}
function matchesAny(item, list2 = []) {
  return list2['some']((key) => key['test'](item));
}
function addCommandPriority(map, index = [], result = 0) {
  for (const data of index) {
    const enabled = String(data || '')['trim']();
    if (!enabled) continue;
    map['set'](enabled, Math['max'](map['get'](enabled) || 0, result));
  }
}
function findExplicitCommandIds(options, list3 = []) {
  const list4 = String(options || '')['toLowerCase']();
  return list3['filter']((target) => list4['includes'](String(target)['toLowerCase']()));
}
function findIntentCommandIds(source = '') {
  return COMMAND_INTENT_PATTERNS['flatMap']((next) =>
    matchesAny(source, next['patterns']) ? next['commandIds'] : [],
  );
}
function inferNamespaces({
  userMessage: userMessage = '',
  intent: intent = null,
  targetKind: targetKind = '',
} = {}) {
  const list5 = [
      intent?.['namespace'],
      intent?.['route'],
      intent?.['capability'],
      intent?.['action'],
      intent?.['operation'],
      ...(Array['isArray'](intent?.['namespaces']) ? intent['namespaces'] : []),
    ]
      ['map']((current) =>
        String(current || '')
          ['trim']()
          ['toLowerCase'](),
      )
      ['filter'](Boolean),
    entry = [String(userMessage || '')['trim'](), ...list5]['join'](' '),
    list6 = [];
  for (const [record, payload] of Object['entries'](NAMESPACE_PATTERNS)) {
    (list5['includes'](record) || matchesAny(entry, payload)) && list6['push'](record);
  }
  return (
    targetKind &&
      (intent?.['canvasAction'] === true || intent?.['mutatesCanvas'] === true) &&
      !list6['includes']('generation') &&
      list6['push']('generation'),
    list6
  );
}
function summarizeNamespace(id, map2) {
  const commandIds = (COMMAND_NAMESPACES[id] || [])['filter']((handle) => map2['has'](handle));
  return { id: id, commandIds: commandIds };
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
  const commands2 = normalizeCommands(commands),
    map3 = new Set(commands2['map']((state) => state['id'])),
    includedCommandIds = commands2['map']((config) => config['id']),
    selectedNamespaces = inferNamespaces({
      userMessage: userMessage,
      intent: intent,
      targetKind: targetKind,
    });
  if (commands2['length'] <= SMALL_REGISTRY_FULL_DISCLOSURE_LIMIT)
    return {
      commands: commands2,
      catalog: {
        mode: 'full',
        selectedNamespaces: selectedNamespaces,
        includedCommandIds: includedCommandIds,
        deferredCommandIds: [],
        namespaces: Object['keys'](COMMAND_NAMESPACES)
          ['map']((scope) => summarizeNamespace(scope, map3))
          ['filter']((input) => input['commandIds']['length'] > 0),
        totalAvailable: commands2['length'],
      },
    };
  const map4 = new Map();
  (addCommandPriority(map4, ALWAYS_AVAILABLE_COMMANDS, 350),
    addCommandPriority(map4, requiredCommandIds, 700),
    selectedNamespaces['forEach']((output, value2) => {
      addCommandPriority(map4, COMMAND_NAMESPACES[output], 200 - value2);
    }));
  for (const value3 of Array['isArray'](skills) ? skills : []) {
    addCommandPriority(map4, value3?.['commands'], 400);
  }
  (addCommandPriority(map4, findIntentCommandIds(userMessage), 500),
    addCommandPriority(map4, findExplicitCommandIds(userMessage, includedCommandIds), 600));
  const value4 = Number(maxCommands),
    value5 = Math['max'](
      ALWAYS_AVAILABLE_COMMANDS['length'],
      Number['isFinite'](value4) ? Math['trunc'](value4) : DEFAULT_COMMAND_LIMIT,
    ),
    map5 = new Map(includedCommandIds['map']((value6, value7) => [value6, value7])),
    value8 = Array['from'](map4['entries']())
      ['filter'](([value9]) => map3['has'](value9))
      ['sort']((value10, value11) => {
        if (value11[1] !== value10[1]) return value11[1] - value10[1];
        return map5['get'](value10[0]) - map5['get'](value11[0]);
      })
      ['slice'](0, value5)
      ['map'](([value12]) => value12),
    map6 = new Set(value8),
    commands3 = commands2['filter']((value13) => map6['has'](value13['id']));
  return {
    commands: commands3,
    catalog: {
      mode: 'progressive',
      selectedNamespaces: selectedNamespaces,
      includedCommandIds: commands3['map']((value14) => value14['id']),
      deferredCommandIds: includedCommandIds['filter']((value15) => !map6['has'](value15)),
      namespaces: Object['keys'](COMMAND_NAMESPACES)
        ['map']((value16) => summarizeNamespace(value16, map3))
        ['filter']((value17) => value17['commandIds']['length'] > 0),
      totalAvailable: commands2['length'],
    },
  };
}
export const agentCapabilityRouterInternals = Object['freeze']({
  inferNamespaces: inferNamespaces,
  findIntentCommandIds: findIntentCommandIds,
  COMMAND_NAMESPACES: COMMAND_NAMESPACES,
});
