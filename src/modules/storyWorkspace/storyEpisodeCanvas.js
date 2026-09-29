import { normalizeVideoGenerationResult } from '../../components/video-node/videoGenerationResultRenderer.js';
import { resolveGenerationResultSelection } from '../../core/generationResultRenderer.js';
import { buildStoryClipCanvasBindingKey, buildStoryLinkedCanvasName } from './storyCanvasBinding.js';
function asObject(_0x483547) {
  return _0x483547 && typeof _0x483547 === 'object' && !Array['isArray'](_0x483547) ? _0x483547 : {};
}
function normalizeText(_0x49ea36) {
  return String(_0x49ea36 || '')['trim']();
}
export function buildStoryEpisodeCanvasName(_0x1e279e = {}) {
  const _0x4849b4 = Number(_0x1e279e['number'] || 0x0);
  return [_0x4849b4 > 0x0 ? '第\x20' + _0x4849b4 + '\x20集' : '分集', normalizeText(_0x1e279e['title'])]
    ['filter'](Boolean)
    ['join'](' · ');
}
export function buildStoryClipCanvasNodeData({
  project: project = {},
  episode: episode = {},
  clip: clip = {},
  modelId: modelId = '',
  provider: provider = '',
  generationParams: generationParams = {},
  generationValidation: generationValidation = null,
} = {}) {
  const _0x51994b = asObject(clip['video']),
    _0x5e1e8c = Array['isArray'](_0x51994b['results']) ? _0x51994b['results'] : [],
    { items: _0x43f32c, activeIndex: _0x276c8d } = resolveGenerationResultSelection(
      normalizeVideoGenerationResult({ videos: _0x5e1e8c })['items'],
      _0x51994b['activeIndex'],
    ),
    _0xf2b091 = _0x43f32c[_0x276c8d] || {},
    _0x70061a = Number(episode['number'] || 0x0),
    _0x187547 = Number(clip['number'] || 0x0),
    _0x2ce0ac = normalizeText(generationValidation?.['message'] || generationValidation);
  return {
    type: 'ai-video',
    name: [
      _0x70061a > 0x0 ? '第\x20' + _0x70061a + '\x20集' : '分集',
      _0x187547 > 0x0 ? '片段 ' + _0x187547 : '视频片段',
      normalizeText(clip['title']),
      _0x2ce0ac ? '⚠ 时长需调整' : '',
    ]
      ['filter'](Boolean)
      ['join'](' · '),
    prompt: String(clip['prompt'] || ''),
    model: normalizeText(clip['modelId'] || clip['generation']?.['modelId'] || modelId),
    provider: normalizeText(clip['provider'] || clip['generation']?.['provider'] || provider),
    generationParams: { ...asObject(generationParams), ...asObject(clip['generationParams']) },
    storyWorkspaceInputs: { ...asObject(clip['inputs']) },
    videos: _0x43f32c,
    mainVideoIndex: _0x276c8d,
    isVideosExpanded: ![],
    videoUrl: normalizeText(_0xf2b091['videoUrl']),
    localPath: normalizeText(_0xf2b091['localPath']),
    displayLocalPath: normalizeText(_0xf2b091['displayLocalPath']),
    posterLocalPath: normalizeText(_0xf2b091['posterLocalPath']),
    thumbId: normalizeText(_0xf2b091['thumbId']),
    thumbUrl: normalizeText(_0xf2b091['thumbUrl']),
    storyWorkspaceBinding: {
      projectId: normalizeText(project['id']),
      episodeId: normalizeText(episode['id']),
      clipId: normalizeText(clip['id']),
      kind: 'clip-video',
      canvasScope: 'project',
    },
    ...(_0x2ce0ac
      ? { storyWorkspaceValidation: { generation: { status: 'unsupported', message: _0x2ce0ac } } }
      : {}),
  };
}
export function clearDeletedStoryCanvasBindings(
  _0x46ecbb = {},
  { canvasId: canvasId = '', nodes: nodes = [] } = {},
) {
  if (!_0x46ecbb || typeof _0x46ecbb !== 'object' || Array['isArray'](_0x46ecbb)) return ![];
  const _0x242646 = new Set(
    (Array['isArray'](nodes) ? nodes : [])
      ['map']((_0x3fc368) => normalizeText(_0x3fc368?.['id'] || _0x3fc368))
      ['filter'](Boolean),
  );
  if (!_0x242646['size']) return ![];
  const _0xf6e9fb = normalizeText(canvasId),
    _0x26b093 = (_0x14f2af) =>
      !_0xf6e9fb || !normalizeText(_0x14f2af) || normalizeText(_0x14f2af) === _0xf6e9fb;
  let _0x26e5ef = ![];
  const _0x246f94 = asObject(_0x46ecbb['project']?.['canvasBinding']);
  if (_0x26b093(_0x246f94['canvasId']) && _0x246f94['nodes']) {
    const _0x334eaa = { ...asObject(_0x246f94['nodes']) };
    for (const [_0x6b8ee5, _0x25c65f] of Object['entries'](_0x334eaa)) {
      if (!_0x242646['has'](normalizeText(_0x25c65f))) continue;
      (delete _0x334eaa[_0x6b8ee5], (_0x26e5ef = !![]));
    }
    if (_0x26e5ef) _0x46ecbb['project']['canvasBinding'] = { ..._0x246f94, nodes: _0x334eaa };
  }
  for (const _0x568357 of Array['isArray'](_0x46ecbb['episodes']) ? _0x46ecbb['episodes'] : []) {
    const _0x139dbf = normalizeText(_0x568357?.['canvasId'] || _0x568357?.['canvasBinding']?.['canvasId']);
    if (!_0x26b093(_0x139dbf)) continue;
    for (const _0x5aa4d7 of Array['isArray'](_0x568357?.['clips']) ? _0x568357['clips'] : []) {
      const _0x10b077 = asObject(_0x5aa4d7?.['canvasBinding']);
      if (!_0x242646['has'](normalizeText(_0x10b077['nodeId']))) continue;
      (delete _0x5aa4d7['canvasBinding'], (_0x26e5ef = !![]));
    }
  }
  if (Array['isArray'](_0x46ecbb['clipFrames'])) {
    const _0x23ba80 = _0x46ecbb['clipFrames']['filter'](
      (_0x32c589) =>
        !_0x242646['has'](normalizeText(_0x32c589?.['canvasNodeId'])) || !_0x26b093(_0x32c589?.['canvasId']),
    );
    _0x23ba80['length'] !== _0x46ecbb['clipFrames']['length'] &&
      ((_0x46ecbb['clipFrames'] = _0x23ba80), (_0x26e5ef = !![]));
  }
  return _0x26e5ef;
}
export function createStoryEpisodeCanvasAdapter({
  canvasTabManager: _0x16b7aa,
  createNodeAtCursor: _0xdcb94,
  getGraphState: _0xd133d4,
  getGraphSnapshot: getGraphSnapshot = null,
  restoreGraphSnapshot: restoreGraphSnapshot = null,
  updateNodeData: _0x42c459,
  deleteNodes: _0xf39608 = null,
  focusNodes: _0xa74ffc = null,
  getVideoNodeSize: getVideoNodeSize = () => ({ width: 0x400, height: 0x240 }),
  commit: commit = () => {},
} = {}) {
  if (
    typeof _0x16b7aa?.['addCanvas'] !== 'function' ||
    typeof _0x16b7aa?.['getActiveCanvasId'] !== 'function' ||
    typeof _0xdcb94 !== 'function' ||
    typeof _0xd133d4 !== 'function' ||
    typeof _0x42c459 !== 'function'
  )
    throw new Error('story\x20episode\x20canvas\x20adapter\x20dependencies\x20are\x20incomplete');
  const _0x18dd3f = (_0x3fe929) => asObject(_0xd133d4()?.['nodes'])[normalizeText(_0x3fe929)] || null;
  return {
    canvasExists(_0x1af899) {
      const _0x34563f = normalizeText(_0x1af899);
      if (!_0x34563f) return ![];
      const _0x26fade = _0x16b7aa['getMultiDataSnapshot']?.() || {};
      return Array['isArray'](_0x26fade['canvases'])
        ? _0x26fade['canvases']['some']((_0x2d57f5) => normalizeText(_0x2d57f5?.['id']) === _0x34563f)
        : normalizeText(_0x16b7aa['getActiveCanvasId']()) === _0x34563f;
    },
    async switchCanvas(_0x403265) {
      const _0x5f0278 = normalizeText(_0x403265);
      if (!_0x5f0278) return ![];
      if (normalizeText(_0x16b7aa['getActiveCanvasId']()) === _0x5f0278) return !![];
      if (typeof _0x16b7aa['switchTo'] !== 'function') return ![];
      return (await _0x16b7aa['switchTo'](_0x5f0278)) !== ![];
    },
    async createCanvas(_0x4422f0) {
      await _0x16b7aa['addCanvas']();
      const _0x39d302 = normalizeText(_0x16b7aa['getActiveCanvasId']());
      if (!_0x39d302) throw new Error('新建项目关联画布后未获得活动画布 ID');
      return (_0x16b7aa['renameCanvas']?.(_0x39d302, _0x4422f0), _0x39d302);
    },
    renameCanvas(_0xfd0218, _0x2cb938) {
      _0x16b7aa['renameCanvas']?.(_0xfd0218, _0x2cb938);
    },
    nodeExists(_0x550f06) {
      return Boolean(_0x18dd3f(_0x550f06));
    },
    async createVideoNode(_0x11c666, { sequenceKey: _0x2f13ba } = {}) {
      const _0x4ede92 = asObject(getVideoNodeSize()),
        _0x5719af = _0xdcb94(
          'ai-video',
          Number(_0x4ede92['width'] || 0x400),
          Number(_0x4ede92['height'] || 0x240),
          _0x11c666['name'],
          { placement: 'viewport-center-sequence', sequenceKey: _0x2f13ba, skipCommit: !![] },
        );
      if (!_0x5719af?.['id']) throw new Error('创建分集视频节点失败');
      const { type: _0x37d387, ..._0x274068 } = _0x11c666;
      return (
        _0x42c459(_0x5719af['id'], _0x274068),
        _0x18dd3f(_0x5719af['id']) || { ..._0x5719af, ..._0x274068, type: _0x5719af['type'] || _0x37d387 }
      );
    },
    async updateVideoNode(_0x4933a0, _0x2a4750) {
      const _0x150602 = normalizeText(_0x4933a0);
      if (!_0x150602) return null;
      const { type: _0x75d0a5, ..._0x34807a } = _0x2a4750;
      return (
        _0x42c459(_0x150602, _0x34807a),
        _0x18dd3f(_0x150602) || { id: _0x150602, type: _0x75d0a5 || 'ai-video', ..._0x34807a }
      );
    },
    deleteNodes(_0x1b94c6 = []) {
      if (typeof _0xf39608 !== 'function') return ![];
      const _0x1a1252 = (Array['isArray'](_0x1b94c6) ? _0x1b94c6 : [])
        ['map'](normalizeText)
        ['filter']((_0x3c01fb) => _0x3c01fb && _0x18dd3f(_0x3c01fb));
      if (!_0x1a1252['length']) return !![];
      return (_0xf39608([...new Set(_0x1a1252)]), !![]);
    },
    createMutationSnapshot() {
      if (typeof getGraphSnapshot !== 'function') return null;
      return getGraphSnapshot();
    },
    restoreMutationSnapshot(_0x1cd8dd) {
      if (!_0x1cd8dd || typeof restoreGraphSnapshot !== 'function') return ![];
      return restoreGraphSnapshot(_0x1cd8dd) !== ![];
    },
    async deleteCanvas(_0x1ba471) {
      const _0x1dec06 = normalizeText(_0x1ba471);
      if (!_0x1dec06 || typeof _0x16b7aa?.['deleteCanvas'] !== 'function') return ![];
      return (await _0x16b7aa['deleteCanvas'](_0x1dec06, { skipDirtyConfirm: !![] })) !== ![];
    },
    focusNodes(_0xa5a990, _0x19b991 = {}) {
      if (typeof _0xa74ffc !== 'function') return ![];
      const _0x40c1f5 = Array['isArray'](_0xa5a990) ? _0xa5a990['map'](normalizeText)['filter'](Boolean) : [];
      if (!_0x40c1f5['length']) return ![];
      return _0xa74ffc(_0x40c1f5, _0x19b991['padding'], _0x19b991['durationMs'], _0x19b991);
    },
    commit: commit,
  };
}
async function rollbackStoryEpisodeCanvasMutation({
  adapter: _0x198e83,
  canvasId: canvasId = '',
  reused: reused = ![],
  mutationSnapshot: _0x21589e,
} = {}) {
  if (!reused && typeof _0x198e83?.['deleteCanvas'] === 'function')
    try {
      if ((await _0x198e83['deleteCanvas'](canvasId, { skipDirtyConfirm: !![] })) !== ![]) return !![];
    } catch {}
  if (_0x21589e && typeof _0x198e83?.['restoreMutationSnapshot'] === 'function')
    try {
      return (await _0x198e83['restoreMutationSnapshot'](_0x21589e, { canvasId: canvasId })) !== ![];
    } catch {}
  return ![];
}
export async function createStoryEpisodeCanvas({
  project: project = {},
  episode: episode = {},
  modelId: modelId = '',
  provider: provider = '',
  generationParams: generationParams = {},
  resolveClipGenerationSettings: resolveClipGenerationSettings = null,
  adapter: _0x3bfe15,
} = {}) {
  const _0x23d115 = [
    'canvasExists',
    'switchCanvas',
    'createCanvas',
    'nodeExists',
    'createVideoNode',
    'updateVideoNode',
  ];
  if (_0x23d115['some']((_0x40ea76) => typeof _0x3bfe15?.[_0x40ea76] !== 'function'))
    throw new Error('createStoryEpisodeCanvas requires a complete canvas adapter');
  const _0x19420e = Array['isArray'](episode['clips']) ? episode['clips'] : [],
    _0x2d48d0 = await Promise['all'](
      _0x19420e['map'](async (_0x1b1360) => {
        try {
          const _0x450b60 =
            typeof resolveClipGenerationSettings === 'function'
              ? asObject(await resolveClipGenerationSettings(_0x1b1360))
              : {};
          return {
            clip: _0x1b1360,
            modelId: normalizeText(_0x450b60['modelId']) || modelId,
            provider: normalizeText(_0x450b60['provider']) || provider,
            generationParams: Object['keys'](asObject(_0x450b60['generationParams']))['length']
              ? _0x450b60['generationParams']
              : generationParams,
            generationValidation: null,
          };
        } catch (_0x33d68f) {
          const _0x8091ae = Number(
              _0x1b1360?.['durationSec'] || _0x1b1360?.['durationSeconds'] || _0x1b1360?.['duration'],
            ),
            _0x8031ca = normalizeText(_0x33d68f?.['message'] || _0x33d68f);
          if (!(_0x8091ae > 0x0) || !/时长|duration/iu['test'](_0x8031ca)) throw _0x33d68f;
          return {
            clip: _0x1b1360,
            modelId: modelId,
            provider: provider,
            generationParams: { ...asObject(generationParams), duration: _0x8091ae },
            generationValidation: { message: _0x8031ca },
          };
        }
      }),
    ),
    _0x5651cb = buildStoryLinkedCanvasName(project, episode),
    _0x548f58 = asObject(project['canvasBinding']),
    _0x372a1e = asObject(_0x548f58['nodes']),
    _0x27e9f7 = normalizeText(_0x548f58['canvasId']),
    _0x319b78 =
      _0x27e9f7 &&
      typeof _0x3bfe15['canvasExists'] === 'function' &&
      (await _0x3bfe15['canvasExists'](_0x27e9f7));
  let _0x473ad0 = '';
  if (_0x319b78) {
    const _0x55d18d = await _0x3bfe15['switchCanvas']?.(_0x27e9f7);
    if (_0x55d18d === ![]) throw new Error('无法切换到已绑定的项目画布：' + _0x27e9f7);
    _0x473ad0 = _0x27e9f7;
  } else _0x473ad0 = await _0x3bfe15['createCanvas'](_0x5651cb);
  const _0x45c984 =
      'story-project:' +
      (normalizeText(project['id']) || _0x473ad0) +
      ':episode:' +
      (normalizeText(episode['id']) || 'episode'),
    _0x273997 = [],
    _0x47b385 = [],
    _0x56b60a = _0x319b78 ? { ..._0x372a1e } : {};
  let _0xda4b92 = 0x0,
    _0x232081 = 0x0,
    _0x271b4f = 0x0;
  const _0x32e857 = _0x2d48d0['map'](({ clip: _0x4ffd9c }, _0x5368b3) =>
      buildStoryClipCanvasBindingKey({ episode: episode, clip: _0x4ffd9c, clipIndex: _0x5368b3 }),
    ),
    _0x2bd8d8 = buildStoryClipCanvasBindingKey({
      episode: episode,
      clip: { id: '__story_episode_prefix__' },
    })['replace'](/:clip:[^:]+$/u, ':clip:'),
    _0x49d5a1 = Object['keys'](_0x372a1e)['filter'](
      (_0x192c73) => _0x192c73['startsWith'](_0x2bd8d8) && !_0x32e857['includes'](_0x192c73),
    ),
    _0x277550 = await _0x3bfe15['createMutationSnapshot']?.({ canvasId: _0x473ad0 });
  try {
    if (_0x319b78 && _0x49d5a1['length']) {
      const _0x22ccb4 = [];
      for (const _0x5d8dd9 of _0x49d5a1) {
        const _0xf93bcc = normalizeText(_0x372a1e[_0x5d8dd9]);
        _0xf93bcc && (await _0x3bfe15['nodeExists'](_0xf93bcc, _0x473ad0)) && _0x22ccb4['push'](_0xf93bcc);
      }
      if (_0x22ccb4['length']) {
        if (typeof _0x3bfe15['deleteNodes'] !== 'function')
          throw new Error('剧本分集画布适配器缺少旧节点清理能力');
        const _0x539f20 = [...new Set(_0x22ccb4)];
        if ((await _0x3bfe15['deleteNodes'](_0x539f20, { canvasId: _0x473ad0 })) === ![])
          throw new Error('清理已失效的剧本分集画布节点失败');
        _0x271b4f = _0x539f20['length'];
      }
      _0x49d5a1['forEach']((_0x5b7a0b) => {
        delete _0x56b60a[_0x5b7a0b];
      });
    }
    for (let _0xb850a8 = 0x0; _0xb850a8 < _0x2d48d0['length']; _0xb850a8 += 0x1) {
      const _0x1677f6 = _0x2d48d0[_0xb850a8],
        { clip: _0x5c8f92 } = _0x1677f6,
        _0x338647 = _0x32e857[_0xb850a8],
        _0x4f9ae3 = buildStoryClipCanvasNodeData({
          project: project,
          episode: episode,
          clip: _0x5c8f92,
          modelId: _0x1677f6['modelId'],
          provider: _0x1677f6['provider'],
          generationParams: _0x1677f6['generationParams'],
          generationValidation: _0x1677f6['generationValidation'],
        }),
        _0x471866 = normalizeText(_0x372a1e[_0x338647]),
        _0x784557 = Boolean(_0x319b78 && _0x471866 && (await _0x3bfe15['nodeExists'](_0x471866, _0x473ad0)));
      _0x784557
        ? (_0x273997['push'](
            await _0x3bfe15['updateVideoNode'](_0x471866, _0x4f9ae3, {
              canvasId: _0x473ad0,
              sequenceKey: _0x45c984,
            }),
          ),
          (_0x232081 += 0x1))
        : (_0x273997['push'](
            await _0x3bfe15['createVideoNode'](_0x4f9ae3, { canvasId: _0x473ad0, sequenceKey: _0x45c984 }),
          ),
          (_0xda4b92 += 0x1));
      const _0x4451bf = _0x273997['at'](-0x1),
        _0x42866e = normalizeText(_0x4451bf?.['id'] || (_0x784557 ? _0x471866 : ''));
      if (!_0x42866e) throw new Error('同步本集到项目画布失败：' + (_0x4f9ae3['name'] || _0x338647));
      ((_0x56b60a[_0x338647] = _0x42866e),
        _0x47b385['push']({
          key: _0x338647,
          clipId: normalizeText(_0x5c8f92['id']),
          nodeId: _0x42866e,
          canvasId: _0x473ad0,
        }));
    }
    (_0x3bfe15['renameCanvas']?.(_0x473ad0, _0x5651cb),
      _0x3bfe15['commit']?.(),
      typeof _0x3bfe15['focusNodes'] === 'function' &&
        _0x273997['length'] &&
        (await _0x3bfe15['focusNodes'](
          _0x47b385['map']((_0x2fefd2) => _0x2fefd2['nodeId']),
          { padding: 0x50, durationMs: 0x0, maxZoom: 0.2 },
        )));
  } catch (_0x81e189) {
    await rollbackStoryEpisodeCanvasMutation({
      adapter: _0x3bfe15,
      canvasId: _0x473ad0,
      reused: Boolean(_0x319b78),
      mutationSnapshot: _0x277550,
    });
    throw _0x81e189;
  }
  const _0x515f0d = {
    ...(_0x319b78 ? _0x548f58 : {}),
    canvasId: _0x473ad0,
    nodes: _0x56b60a,
    ...(_0x319b78 && _0x548f58['layout'] ? { layout: { ...asObject(_0x548f58['layout']) } } : {}),
  };
  return {
    canvasId: _0x473ad0,
    canvasName: _0x5651cb,
    nodes: _0x273997,
    reused: Boolean(_0x319b78),
    createdCount: _0xda4b92,
    updatedCount: _0x232081,
    deletedCount: _0x271b4f,
    bindings: _0x47b385,
    binding: _0x515f0d,
    canvasBinding: _0x515f0d,
  };
}
