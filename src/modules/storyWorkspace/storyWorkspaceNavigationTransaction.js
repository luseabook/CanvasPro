import { isStoryVideoReplicationAssetLocalizationComplete } from './storyVideoReplication.js';
import { isStoryCollaborationProject } from './storyCollaborationPolicy.js';
const STORY_WORKSPACE_STEP_COUNT = 0x3;
function normalizeText(_0x388aa7) {
  return String(_0x388aa7 ?? '')['trim']();
}
function cloneNavigationValue(_0x36aaef, _0x7e6798) {
  if (_0x36aaef === undefined) return _0x7e6798;
  try {
    return JSON['parse'](JSON['stringify'](_0x36aaef));
  } catch {
    return _0x7e6798;
  }
}
export function normalizeStoryWorkspaceStep(_0x35feaa) {
  if (_0x35feaa === 0x0 || _0x35feaa === '0') return 0x0;
  const _0x5d8351 = Math['trunc'](Number(_0x35feaa) || 0x1);
  return Math['max'](0x1, Math['min'](STORY_WORKSPACE_STEP_COUNT, _0x5d8351));
}
export function canReuseStoryStepNavigation({
  view: view = '',
  hasNavigation: hasNavigation = ![],
  isEpisodeToolbar: isEpisodeToolbar = ![],
} = {}) {
  return view === 'project' && Boolean(hasNavigation) && !isEpisodeToolbar;
}
export function getStoryVideoEpisodes(_0x5488e0 = []) {
  return Array['isArray'](_0x5488e0)
    ? _0x5488e0['filter'](
        (_0x1f6b11) => _0x1f6b11 && normalizeText(_0x1f6b11?.['script']?.['fullText']) !== '',
      )
    : [];
}
function normalizeStoryWorkspaceProjectData(_0x62b6fb) {
  return _0x62b6fb && typeof _0x62b6fb === 'object' && !Array['isArray'](_0x62b6fb) ? _0x62b6fb : {};
}
export function getStoryWorkspaceStepBlockMessage(_0x133881 = {}, _0x5e215f = 0x1) {
  const _0x1a1f0e = normalizeStoryWorkspaceStep(_0x5e215f),
    _0x38054c = normalizeStoryWorkspaceProjectData(_0x133881);
  if (_0x1a1f0e === 0x0) return isStoryCollaborationProject(_0x38054c) ? '' : '当前项目没有故事构思步骤。';
  if (_0x38054c['project']?.['collaboration']?.['stage'] === 'writing') return '请先确认故事构思中的正文。';
  if (_0x1a1f0e === 0x1) return '';
  if (!getStoryVideoEpisodes(_0x38054c['episodes'])['length']) return '请先至少完成一集分集剧本正文。';
  if (
    _0x1a1f0e === 0x3 &&
    _0x38054c['project']?.['sourceMode'] === 'video-replication' &&
    getStoryVideoEpisodes(_0x38054c['episodes'])['some'](
      (_0x29f67c) =>
        Array['isArray'](_0x29f67c['clips']) &&
        _0x29f67c['clips']['some']((_0x37d211) => normalizeText(_0x37d211?.['prompt'])),
    )
  )
    return '';
  if (
    _0x38054c['project']?.['sourceMode'] === 'video-replication' &&
    !isStoryVideoReplicationAssetLocalizationComplete(_0x38054c)
  )
    return '请先完成资产本地化。';
  return '';
}
export function canEnterStoryWorkspaceStep(_0x5460f0 = {}, _0xeef245 = 0x1) {
  return !getStoryWorkspaceStepBlockMessage(_0x5460f0, _0xeef245);
}
export function isStoryWorkspaceStepNavigationDisabled(_0x41b902 = {}, _0x353541 = 0x1) {
  const _0x353326 = normalizeStoryWorkspaceStep(_0x353541),
    _0x34f2a1 = normalizeStoryWorkspaceProjectData(_0x41b902);
  return (
    !canEnterStoryWorkspaceStep(_0x34f2a1, _0x353326) ||
    (_0x353326 > 0x1 && _0x34f2a1['project']?.['outlineStatus'] === 'stale')
  );
}
export function getStoryWorkspaceTransitionDirection(_0x47f94c, _0x391b92) {
  const _0x58d560 = normalizeStoryWorkspaceStep(_0x47f94c),
    _0x3bf1fa = normalizeStoryWorkspaceStep(_0x391b92);
  if (_0x58d560 === _0x3bf1fa) return 'none';
  return _0x3bf1fa > _0x58d560 ? 'forward' : 'backward';
}
export function getStoryWorkspacePageTransitionDirection(_0x365143, _0x2d50e8, _0x4be252) {
  if (normalizeText(_0x365143) === 'episode') return 'backward';
  return getStoryWorkspaceTransitionDirection(_0x2d50e8, _0x4be252);
}
export function getStoryEpisodeGenerationControlState(_0x4e45dc = {}, _0xdbfc01 = '') {
  const _0x1a60d9 = normalizeText(_0xdbfc01),
    _0x365bb8 = (Array['isArray'](_0x4e45dc['splittingEpisodeIds']) ? _0x4e45dc['splittingEpisodeIds'] : [])[
      'some'
    ]((_0x18d355) => normalizeText(_0x18d355) === _0x1a60d9),
    _0x1a4218 = normalizeText(_0x4e45dc['storyPlanningOperation']),
    _0x369d2c = Boolean(_0x1a4218 && _0x1a4218 !== 'splitting-episode');
  return { isGenerating: _0x365bb8, disabled: _0x365bb8 || _0x369d2c };
}
function captureNavigationSnapshot(_0x723c33) {
  return {
    view: _0x723c33['view'],
    step: _0x723c33['step'],
    selectedEpisodeId: _0x723c33['selectedEpisodeId'],
    selectedClipId: _0x723c33['selectedClipId'],
    episodeSelectionMode: _0x723c33['episodeSelectionMode'],
    selectedEpisodeIds: [...(_0x723c33['selectedEpisodeIds'] || [])],
    clipSelectionMode: _0x723c33['clipSelectionMode'],
    selectedClipGenerationIds: [...(_0x723c33['selectedClipGenerationIds'] || [])],
    characterVoicePanelMotion: _0x723c33['characterVoicePanelMotion'],
    pendingCharacterVoiceAssetId: _0x723c33['pendingCharacterVoiceAssetId'],
    pendingDeleteClipId: _0x723c33['pendingDeleteClipId'],
    selectedAssetId: _0x723c33['selectedAssetId'],
    assetFilter: _0x723c33['assetFilter'],
    assetSelectionMode: _0x723c33['assetSelectionMode'],
    selectedAssetIds: [...(_0x723c33['selectedAssetIds'] || [])],
    characterVoiceEditor: cloneNavigationValue(_0x723c33['characterVoiceEditor'], null),
    outlineSectionOpenState: cloneNavigationValue(_0x723c33['outlineSectionOpenState'] || {}, {}),
    clipAdjustmentOpen: _0x723c33['clipAdjustmentOpen'],
    clipAdjustmentInstruction: _0x723c33['clipAdjustmentInstruction'],
    clipAdjustmentLanguage: _0x723c33['clipAdjustmentLanguage'],
    clipAdjustmentLanguageOpen: _0x723c33['clipAdjustmentLanguageOpen'],
    clipPromptHistoryOpen: _0x723c33['clipPromptHistoryOpen'],
    models: { ...(_0x723c33['models'] || {}) },
    videoProvider: _0x723c33['videoProvider'],
    videoProviderProfileId: _0x723c33['videoProviderProfileId'],
    videoProviderProfileIdByModel: cloneNavigationValue(_0x723c33['videoProviderProfileIdByModel'] || {}, {}),
    videoGenerationParams: { ...(_0x723c33['videoGenerationParams'] || {}) },
    videoGenerationParamsByModel: cloneNavigationValue(_0x723c33['videoGenerationParamsByModel'] || {}, {}),
  };
}
function restoreNavigationSnapshot(_0x42d224, _0x4e4445) {
  Object['assign'](_0x42d224, _0x4e4445);
}
export function createStoryWorkspaceNavigationTransaction({
  state: _0x52fb99,
  toolbarEl: toolbarEl = null,
  windowObject: windowObject = globalThis['window'],
  renderAdapter: renderAdapter = {},
  onClipSelected: onClipSelected = () => {},
  onCommit: onCommit = () => {},
  notify: notify = () => {},
  logger: logger = globalThis['console'],
} = {}) {
  if (!_0x52fb99 || typeof _0x52fb99 !== 'object')
    throw new Error('[storyWorkspaceNavigation] state is required');
  if (typeof renderAdapter['render'] !== 'function')
    throw new Error('[storyWorkspaceNavigation] renderAdapter.render is required');
  let _0x2506bf = 0x0,
    _0x109712 = ![],
    _0x5de78b = null;
  function _0x50e18a({ restore: restore = !![] } = {}) {
    const _0x7bcb7e = _0x5de78b;
    if (!_0x7bcb7e) return;
    _0x7bcb7e['cancelWait']?.();
    if (restore) restoreNavigationSnapshot(_0x52fb99, _0x7bcb7e['snapshot']);
    if (_0x5de78b === _0x7bcb7e) _0x5de78b = null;
    _0x1c473f();
  }
  function _0xc314f4() {
    const _0x13eed8 = ++_0x2506bf;
    _0x50e18a();
    const _0x214b0c = captureNavigationSnapshot(_0x52fb99);
    return (
      (_0x5de78b = { token: _0x13eed8, snapshot: _0x214b0c, cancelWait: null }),
      { token: _0x13eed8, snapshot: _0x214b0c }
    );
  }
  function _0x5920f5(_0x6d3faf) {
    if (_0x5de78b?.['token'] === _0x6d3faf) _0x5de78b = null;
  }
  function _0x37f0ea() {
    const _0x1fa15f = toolbarEl?.['querySelector']?.('.story-step-navigation'),
      _0x1e17a3 = toolbarEl?.['querySelector']?.('.story-project-toolbar'),
      _0x315e1c = canReuseStoryStepNavigation({
        view: _0x52fb99['view'],
        hasNavigation: Boolean(_0x1fa15f),
        isEpisodeToolbar: Boolean(_0x1e17a3?.['classList']?.['contains']('story-project-toolbar--episode')),
      });
    if (!_0x315e1c) return ![];
    return (
      (_0x1fa15f['dataset']['activeStep'] = String(_0x52fb99['step'])),
      _0x1fa15f['querySelectorAll']('[data-story-step]')['forEach']((_0x697328) => {
        const _0x5ec788 = normalizeStoryWorkspaceStep(_0x697328['dataset']['storyStep']),
          _0x40d817 = _0x5ec788 === _0x52fb99['step'];
        (_0x697328['classList']['toggle']('is-active', _0x40d817),
          _0x697328['setAttribute']('aria-current', _0x40d817 ? 'step' : 'false'),
          (_0x697328['disabled'] = isStoryWorkspaceStepNavigationDisabled(_0x52fb99['data'], _0x5ec788)));
      }),
      !![]
    );
  }
  function _0x2c7a5d(_0x15ada1) {
    const _0x58fdac = toolbarEl?.['querySelector']?.('.story-project-toolbar--episode'),
      _0x19cae7 = _0x58fdac?.['querySelector']('.story-episode-toolbar-current'),
      _0x11df3c = _0x58fdac?.['querySelector'](
        '[data-story-step="' + normalizeStoryWorkspaceStep(_0x15ada1) + '\x22]',
      );
    if (!_0x58fdac || !_0x19cae7 || !_0x11df3c) return ![];
    const _0x2b0db4 = _0x19cae7['getBoundingClientRect']?.(),
      _0x51c737 = _0x11df3c['getBoundingClientRect']?.();
    if (!_0x2b0db4?.['width'] || !_0x51c737?.['width']) return ![];
    return (
      _0x19cae7['style']['setProperty'](
        '--story-episode-exit-x',
        _0x51c737['left'] - _0x2b0db4['left'] + 'px',
      ),
      _0x19cae7['style']['setProperty']('--story-episode-exit-width', _0x51c737['width'] + 'px'),
      _0x11df3c['classList']['add']('is-episode-exit-target'),
      _0x58fdac['classList']['add']('is-switching-from-episode'),
      !![]
    );
  }
  function _0x257558() {
    const _0x1e0443 = toolbarEl?.['querySelector']?.(
        '.story-project-toolbar:not(.story-project-toolbar--episode)',
      ),
      _0x3298ea = _0x1e0443?.['querySelector'](
        '.story-episode-toolbar-current[data-story-episode-state="inactive"]',
      ),
      _0x329293 = _0x1e0443?.['querySelector'](
        '[data-story-step=\x22' + normalizeStoryWorkspaceStep(_0x52fb99['step']) + '\x22]',
      );
    if (!_0x1e0443 || !_0x3298ea || !_0x329293) return ![];
    const _0x1a5fc = _0x3298ea['getBoundingClientRect']?.(),
      _0x545d81 = _0x329293['getBoundingClientRect']?.();
    if (!_0x1a5fc?.['width'] || !_0x545d81?.['width']) return ![];
    return (
      _0x3298ea['style']['setProperty'](
        '--story-episode-enter-x',
        _0x545d81['left'] - _0x1a5fc['left'] + 'px',
      ),
      _0x3298ea['style']['setProperty']('--story-episode-enter-width', _0x545d81['width'] + 'px'),
      _0x1e0443['classList']['add']('is-switching-to-episode'),
      _0x3298ea['getBoundingClientRect']?.(),
      windowObject?.['requestAnimationFrame']?.(() => {
        if (!_0x1e0443['isConnected'] || !_0x1e0443['classList']['contains']('is-switching-to-episode'))
          return;
        _0x1e0443['classList']['add']('is-switching-to-episode-ready');
      }),
      !![]
    );
  }
  function _0x1c473f() {
    (toolbarEl?.['querySelectorAll']?.('.story-project-toolbar')['forEach']((_0x126380) => {
      _0x126380['classList']['remove'](
        'is-switching-to-episode',
        'is-switching-to-episode-ready',
        'is-switching-from-episode',
      );
    }),
      toolbarEl?.['querySelectorAll']?.('.story-episode-toolbar-current')['forEach']((_0x265d5c) => {
        (_0x265d5c['style']['removeProperty']('--story-episode-enter-x'),
          _0x265d5c['style']['removeProperty']('--story-episode-enter-width'),
          _0x265d5c['style']['removeProperty']('--story-episode-exit-x'),
          _0x265d5c['style']['removeProperty']('--story-episode-exit-width'));
      }),
      toolbarEl?.['querySelectorAll']?.('.is-episode-exit-target')['forEach']((_0x13c604) => {
        _0x13c604['classList']['remove']('is-episode-exit-target');
      }));
  }
  function _0x3b45ca(_0x1913dd) {
    if (typeof windowObject?.['requestAnimationFrame'] !== 'function') return Promise['resolve']();
    return new Promise((_0x3efb72) => {
      const _0x5e5c92 = _0x5de78b?.['token'] === _0x1913dd ? _0x5de78b : null;
      if (!_0x5e5c92) {
        _0x3efb72();
        return;
      }
      let _0x4a4e21 = 0x0,
        _0x4931a6 = 0x0,
        _0x3086e6 = ![];
      const _0x16b89f = () => {
          if (_0x3086e6) return;
          _0x3086e6 = !![];
          if (_0x5e5c92['cancelWait'] === _0x5d6739) _0x5e5c92['cancelWait'] = null;
          _0x3efb72();
        },
        _0x5d6739 = () => {
          if (typeof windowObject['cancelAnimationFrame'] === 'function') {
            if (_0x4a4e21) windowObject['cancelAnimationFrame'](_0x4a4e21);
            if (_0x4931a6) windowObject['cancelAnimationFrame'](_0x4931a6);
          }
          _0x16b89f();
        };
      ((_0x5e5c92['cancelWait'] = _0x5d6739),
        (_0x4a4e21 = windowObject['requestAnimationFrame'](() => {
          ((_0x4a4e21 = 0x0),
            (_0x4931a6 = windowObject['requestAnimationFrame'](() => {
              ((_0x4931a6 = 0x0), _0x16b89f());
            })));
        })));
    });
  }
  function _0x3b6cac({
    token: _0x57df28,
    snapshot: _0x5c47b5,
    operation: _0x10651d,
    error: _0x2558da,
    message: _0x74e2bc,
  }) {
    if (_0x109712 || _0x57df28 !== _0x2506bf) return ![];
    restoreNavigationSnapshot(_0x52fb99, _0x5c47b5);
    if (_0x5de78b?.['token'] === _0x57df28) _0x5de78b = null;
    (_0x1c473f(), logger?.['error']?.('[storyWorkspace][' + _0x10651d + ']\x20导航失败', _0x2558da));
    try {
      renderAdapter['renderToolbar']?.();
    } catch (_0xdb0da6) {
      logger?.['error']?.('[storyWorkspace][' + _0x10651d + '] 工具栏恢复失败', _0xdb0da6);
    }
    try {
      renderAdapter['render']({ direction: 'none', updateToolbar: ![], capturePageState: ![] });
    } catch (_0x432f0d) {
      logger?.['error']?.('[storyWorkspace][' + _0x10651d + '] 页面恢复失败', _0x432f0d);
    }
    return (notify(_0x74e2bc, 'error'), ![]);
  }
  function _0x35720d(_0x59bdaf, _0x381fe2) {
    if (_0x109712 || _0x59bdaf !== _0x2506bf) return;
    try {
      renderAdapter['renderToolbar']?.();
    } catch (_0x3cc5cb) {
      (logger?.['error']?.('[storyWorkspace][' + _0x381fe2 + ']\x20工具栏收尾失败', _0x3cc5cb),
        notify('工具栏更新失败，请重试。', 'error'));
      throw _0x3cc5cb;
    } finally {
      _0x1c473f();
    }
  }
  async function _0x38bb9f(_0x31613b = {}) {
    if (_0x109712) return ![];
    const _0xa738e8 = normalizeStoryWorkspaceStep(_0x31613b['step']),
      _0x28e721 = getStoryWorkspaceStepBlockMessage(_0x52fb99['data'], _0xa738e8);
    if (_0x28e721) return (notify(_0x28e721, 'warn'), ![]);
    const { token: _0xd972ed, snapshot: _0x57f01a } = _0xc314f4();
    try {
      const _0x1cf2fd = _0x52fb99['view'] === 'episode',
        _0x31eeb7 = getStoryWorkspacePageTransitionDirection(_0x52fb99['view'], _0x52fb99['step'], _0xa738e8);
      if (_0x1cf2fd) _0x2c7a5d(_0xa738e8);
      _0xa738e8 !== _0x52fb99['step'] &&
        ((_0x52fb99['episodeSelectionMode'] = ![]),
        (_0x52fb99['selectedEpisodeIds'] = []),
        (_0x52fb99['clipSelectionMode'] = ![]),
        (_0x52fb99['selectedClipGenerationIds'] = []),
        (_0x52fb99['characterVoicePanelMotion'] = ''),
        (_0x52fb99['pendingCharacterVoiceAssetId'] = ''));
      ((_0x52fb99['pendingDeleteClipId'] = ''),
        (_0x52fb99['view'] = 'project'),
        (_0x52fb99['step'] = _0xa738e8));
      normalizeText(_0x31613b['assetFilter']) &&
        (_0x52fb99['assetFilter'] = normalizeText(_0x31613b['assetFilter']));
      normalizeText(_0x31613b['assetId']) &&
        ((_0x52fb99['selectedAssetId'] = normalizeText(_0x31613b['assetId'])),
        (_0x52fb99['characterVoiceEditor'] = null),
        (_0x52fb99['characterVoicePanelMotion'] = ''),
        (_0x52fb99['pendingCharacterVoiceAssetId'] = ''));
      if (normalizeText(_0x31613b['outlineSectionId'])) {
        const _0x3f4b13 = normalizeText(_0x31613b['outlineSectionId']);
        _0x52fb99['outlineSectionOpenState'] = {
          ...(_0x52fb99['outlineSectionOpenState'] || {}),
          ...(_0x3f4b13['startsWith']('episode-') ? { episodes: !![] } : {}),
          [_0x3f4b13]: !![],
        };
      }
      if (_0xa738e8 === 0x2) {
        const _0x1640e0 = (_0x52fb99['data']?.['assets'] || [])['some'](
          (_0x38bbf0) =>
            normalizeText(_0x38bbf0?.['id']) === normalizeText(_0x52fb99['selectedAssetId']) &&
            _0x38bbf0?.['kind'] === _0x52fb99['assetFilter'],
        );
        if (!_0x1640e0) {
          const _0x494324 = (_0x52fb99['data']?.['assets'] || [])['find'](
            (_0x1c1ad4) => _0x1c1ad4['kind'] === _0x52fb99['assetFilter'],
          );
          _0x52fb99['selectedAssetId'] = _0x494324?.['id'] || '';
        }
        ((_0x52fb99['assetSelectionMode'] = ![]), (_0x52fb99['selectedAssetIds'] = []));
      }
      const _0x40f7bf = _0x1cf2fd ? ![] : _0x37f0ea(),
        _0x84ba77 = await Promise['resolve'](
          renderAdapter['render']({
            direction: _0x31eeb7,
            updateToolbar: !_0x1cf2fd && !_0x40f7bf,
            onTransitionComplete: _0x1cf2fd ? () => _0x35720d(_0xd972ed, 'go-to-step') : null,
          }),
        );
      if (_0x109712 || _0xd972ed !== _0x2506bf) return ![];
      if (_0x84ba77 !== !![])
        throw new Error('story\x20workspace\x20page\x20transition\x20was\x20interrupted');
      return (onCommit(), _0x5920f5(_0xd972ed), !![]);
    } catch (_0x377a61) {
      return _0x3b6cac({
        token: _0xd972ed,
        snapshot: _0x57f01a,
        operation: 'go-to-step',
        error: _0x377a61,
        message: '切换步骤失败，请重试。',
      });
    }
  }
  async function _0x3b98c0(_0x355b55, _0x564e82 = '') {
    if (_0x109712) return ![];
    const _0x391ea7 = getStoryWorkspaceStepBlockMessage(_0x52fb99['data'], 0x3);
    if (_0x391ea7) return (notify(_0x391ea7, 'warn'), ![]);
    const _0x22502e = (_0x52fb99['data']?.['episodes'] || [])['find'](
      (_0x5fdb40) => normalizeText(_0x5fdb40?.['id']) === normalizeText(_0x355b55),
    );
    if (!_0x22502e) return ![];
    if (getStoryEpisodeGenerationControlState(_0x52fb99, _0x22502e['id'])['disabled']) return ![];
    if (!Array['isArray'](_0x22502e['clips']) || !_0x22502e['clips']['length']) return ![];
    const { token: _0x33fc52, snapshot: _0x52b9a6 } = _0xc314f4();
    try {
      const _0x3369ba = _0x52fb99['view'] !== 'episode',
        _0xcc4a53 = _0x52fb99['view'] === 'episode' && _0x52fb99['selectedEpisodeId'] !== _0x22502e['id'];
      (renderAdapter['capturePageState']?.(),
        (_0x52fb99['clipAdjustmentOpen'] = ![]),
        (_0x52fb99['clipAdjustmentInstruction'] = ''),
        (_0x52fb99['clipAdjustmentLanguage'] = ''),
        (_0x52fb99['clipAdjustmentLanguageOpen'] = ![]),
        (_0x52fb99['clipPromptHistoryOpen'] = ![]),
        (_0x52fb99['selectedEpisodeId'] = _0x22502e['id']));
      const _0x2081f4 =
        _0x22502e['clips']['find'](
          (_0x36dd2b) => normalizeText(_0x36dd2b?.['id']) === normalizeText(_0x564e82),
        ) || _0x22502e['clips'][0x0];
      ((_0x52fb99['selectedClipId'] = _0x2081f4?.['id'] || ''),
        (_0x52fb99['pendingDeleteClipId'] = ''),
        (_0x52fb99['clipSelectionMode'] = ![]),
        (_0x52fb99['selectedClipGenerationIds'] = []),
        onClipSelected(_0x2081f4, {
          episode: _0x22502e,
          enteringEpisode: _0x3369ba,
          switchingEpisode: _0xcc4a53,
        }));
      if (_0xcc4a53) {
        (renderAdapter['renderToolbar']?.(), await _0x3b45ca(_0x33fc52));
        if (_0x33fc52 !== _0x2506bf) return ![];
        if (_0x52fb99['view'] !== 'episode' || _0x52fb99['selectedEpisodeId'] !== _0x22502e['id'])
          throw new Error('story\x20episode\x20navigation\x20was\x20superseded');
      }
      let _0x2b5474 = ![];
      _0x3369ba && (renderAdapter['renderToolbar']?.(), (_0x2b5474 = _0x257558()));
      _0x52fb99['view'] = 'episode';
      const _0x31b150 = await Promise['resolve'](
        renderAdapter['render']({
          direction: 'forward',
          updateToolbar: !_0x2b5474 && !_0xcc4a53,
          capturePageState: ![],
          onTransitionComplete: _0x2b5474 ? () => _0x35720d(_0x33fc52, 'open-episode') : null,
        }),
      );
      if (_0x109712 || _0x33fc52 !== _0x2506bf) return ![];
      if (_0x31b150 !== !![]) throw new Error('story workspace page transition was interrupted');
      return (onCommit(), _0x5920f5(_0x33fc52), !![]);
    } catch (_0x210410) {
      return _0x3b6cac({
        token: _0x33fc52,
        snapshot: _0x52b9a6,
        operation: 'open-episode',
        error: _0x210410,
        message: '打开分集失败，请重试。',
      });
    }
  }
  function _0x325857(_0xdb67de = {}) {
    if (normalizeText(_0xdb67de['view']) === 'episode')
      return _0x3b98c0(_0xdb67de['episodeId'], _0xdb67de['clipId']);
    if (normalizeText(_0xdb67de['view']) === 'project') return _0x38bb9f(_0xdb67de);
    return Promise['resolve'](![]);
  }
  function _0x271741() {
    (_0x50e18a(), (_0x109712 = !![]), (_0x2506bf += 0x1), _0x1c473f());
  }
  return { navigate: _0x325857, destroy: _0x271741 };
}
