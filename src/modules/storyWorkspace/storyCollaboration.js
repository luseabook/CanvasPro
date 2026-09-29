import {
  createGeneratedStoryProjectData,
  createUploadedStoryProjectData,
  STORY_SCRIPT_MAX_CHARACTERS,
} from './storyProjectPlanning.js';
import { isStoryCollaborationProject } from './storyCollaborationPolicy.js';
const clone = (_0x4b88ad) => JSON['parse'](JSON['stringify'](_0x4b88ad));
export function createStoryCollaboration({
  state: _0x5ada71,
  root: _0x490844,
  projectData: _0x13607c,
  save: _0x33577a,
  render: _0x5c6de8,
  resetCreationState: _0x121b29,
  beginProjectSession: _0x14ef87,
  isActive: _0x5d44ec,
  showToast: _0x356b8e,
}) {
  const _0x521253 = _0x490844['ownerDocument'],
    _0x17119c = new Set();
  let _0x5d9145 = '',
    _0x3066db = null,
    _0xbaa13e = ![],
    _0x18ccf4 = null;
  const _0x2f1db3 = _0x521253['createElement']('button');
  ((_0x2f1db3['type'] = 'button'),
    (_0x2f1db3['className'] = 'story-collaboration-trigger'),
    (_0x2f1db3['hidden'] = !![]),
    (_0x2f1db3['textContent'] = 'AI 协作'),
    _0x2f1db3['setAttribute']('aria-label', '打开剧本 AI 协作'),
    _0x490844['appendChild'](_0x2f1db3));
  const _0x1d184b = _0x521253['createElement']('div');
  ((_0x1d184b['className'] = 'story-agent-host'), _0x490844['appendChild'](_0x1d184b));
  const _0x34a50a = (_0x46fe74) =>
      _0x490844['querySelector']('.story-page.is-current [data-collaboration-' + _0x46fe74 + ']'),
    _0x142e72 = (_0x32aab4) => {
      const _0x4c69ea = _0x34a50a('status');
      if (_0x4c69ea) _0x4c69ea['textContent'] = _0x32aab4;
    };
  let _0x5bb85d = null;
  const _0x525480 = () => String(_0x5ada71['data']?.['project']?.['id'] || '');
  function _0x4367cd(_0x18f5af) {
    if (!_0x13607c['getEntry'](_0x18f5af)) return null;
    return _0x13607c['getData'](_0x18f5af);
  }
  function _0x4b642e(_0x32ca9b = _0x5ada71['data']) {
    if (!isStoryCollaborationProject(_0x32ca9b)) throw new Error('仅 AI 协作创作项目可使用协作功能');
    return _0x32ca9b['project']['collaboration'];
  }
  function _0x13f5c9() {
    (_0x13607c['syncCurrentEntry'](), _0x33577a());
  }
  function _0x204c91() {
    return {
      destroyed: _0xbaa13e,
      active:
        !_0xbaa13e &&
        isStoryCollaborationProject(_0x5ada71['data']) &&
        _0x5ada71['developerModeAvailable'] === !![] &&
        _0x5d44ec() &&
        _0x5ada71['workspaceSurface'] !== 'replication' &&
        _0x5ada71['view'] !== 'home',
      projectId: _0x5ada71['hasCreatedProject'] ? _0x525480() : '',
      enabled: isStoryCollaborationProject(_0x5ada71['data']),
      editing: _0x5ada71['step'] === 0x0 && _0x5ada71['view'] === 'project',
      root: _0x490844,
      host: _0x1d184b,
      trigger: _0x2f1db3,
    };
  }
  function _0x1e2ec7() {
    const _0x30c783 = _0x204c91();
    _0x17119c['forEach']((_0x502a88) => _0x502a88(_0x30c783));
  }
  function _0x363b5f() {
    if (_0xbaa13e) return;
    if (!isStoryCollaborationProject(_0x5ada71['data']) && _0x5ada71['step'] === 0x0) _0x5ada71['step'] = 0x1;
    if (_0x5ada71['developerModeAvailable'] !== !![]) {
      if (_0x5ada71['homeTab'] === 'collaborate') _0x5ada71['homeTab'] = 'generate';
      if (_0x5ada71['view'] === 'project' && _0x5ada71['step'] === 0x0) {
        if (_0x5ada71['data']['project']['collaboration']?.['stage'] === 'writing')
          _0x5ada71['view'] = 'home';
        else _0x5ada71['step'] = 0x1;
      }
    }
    const _0x51805c = _0x204c91();
    _0x51805c['projectId'] !== _0x5d9145 &&
      ((_0x5d9145 = _0x51805c['projectId']), (_0x3066db = null), (_0x5bb85d = null));
    if (_0x51805c['active'] && _0x51805c['editing'] && _0x51805c['projectId']) {
      const _0x4c3874 = _0x4b642e();
      for (const [_0x52c481, _0xbf81a1] of Object['entries']({
        draft: _0x4c3874['draft'],
        brief: _0x4c3874['brief'],
        idea: _0x4c3874['idea'] || '',
        title: _0x5ada71['data']['project']['title'],
      })) {
        const _0x10646c = _0x34a50a(_0x52c481);
        if (_0x10646c && _0x10646c['value'] !== _0xbf81a1) _0x10646c['value'] = _0xbf81a1;
      }
      _0x490844['querySelectorAll']('[data-collaboration-direction]')['forEach']((_0x53b479) =>
        _0x53b479['setAttribute'](
          'aria-pressed',
          String(_0x4c3874['directions']['includes'](_0x53b479['dataset']['collaborationDirection'])),
        ),
      );
      if (_0x34a50a('confirm')) _0x34a50a('confirm')['disabled'] = !_0x4c3874['draft']['trim']();
      if (_0x34a50a('undo')) _0x34a50a('undo')['disabled'] = _0x5bb85d === null;
    }
    _0x1e2ec7();
  }
  function _0x22a159(_0x210744 = _0x5ada71['idea']) {
    if (_0x5ada71['developerModeAvailable'] !== !![]) return;
    const _0x437914 = String(_0x210744 || '')['trim']();
    if (!_0x437914 || _0x5ada71['isGeneratingStory']) return;
    const _0x1d4d9d = _0x5ada71['data']['project'],
      _0x4d87ab = _0x5ada71['scriptMode'],
      _0x1f53c6 = {
        idea: _0x437914,
        scriptMode: _0x4d87ab,
        aspectRatio: _0x1d4d9d['aspectRatio'],
        styleId: _0x1d4d9d['videoStyleId'],
        visualStyle: _0x1d4d9d['videoStylePrompt'],
        ..._0x1d4d9d['planning'],
      },
      _0x148120 = {
        model: _0x5ada71['models']['text'],
        provider: _0x5ada71['textProvider'],
        providerProfileId: _0x5ada71['textProviderProfileId'],
      };
    (_0x121b29(), (_0x5ada71['homeTab'] = 'collaborate'), (_0x5ada71['scriptMode'] = _0x4d87ab));
    const _0x465345 = createGeneratedStoryProjectData(
      {},
      {
        projectId: 'story-' + Date['now']() + '-' + Math['random']()['toString'](0x24)['slice'](0x2, 0x7),
        request: _0x1f53c6,
      },
    );
    ((_0x465345['project']['title'] = '未命名协作剧本'),
      (_0x465345['project']['collaboration'] = {
        stage: 'writing',
        idea: _0x437914,
        draft: '',
        brief: '',
        directions: [],
        conversations: null,
      }),
      _0x13607c['replaceCurrent'](_0x465345),
      (_0x5ada71['hasCreatedProject'] = !![]),
      (_0x5ada71['projectTitleEdited'] = ![]),
      (_0x5ada71['view'] = 'project'),
      (_0x5ada71['step'] = 0x0),
      (_0x18ccf4 = { projectId: _0x525480(), text: _0x437914, settings: _0x148120 }),
      _0x13f5c9(),
      _0x5c6de8(),
      _0x363b5f());
  }
  function _0x1b3dd5(_0x3a62ef, { projectId: _0x30488c, selectedOnly: selectedOnly = ![] } = {}) {
    if (!_0x204c91()['active'] || _0x30488c !== _0x525480() || !_0x4367cd(_0x30488c))
      throw new Error('项目已切换，请回到原剧本后采用');
    const _0x5203a6 = _0x4b642e(),
      _0x3aabe0 = String(_0x3a62ef || '')['trim']();
    if (!_0x3aabe0) throw new Error('没有可采用的正文');
    let _0xd3cc7b = _0x3aabe0;
    if (selectedOnly) {
      if (
        !_0x3066db ||
        _0x3066db['projectId'] !== _0x525480() ||
        _0x3066db['document'] !== _0x5203a6['draft'] ||
        _0x3066db['end'] <= _0x3066db['start']
      )
        throw new Error('请先在正文中选择要替换的文字');
      _0xd3cc7b =
        _0x5203a6['draft']['slice'](0x0, _0x3066db['start']) +
        _0x3aabe0 +
        _0x5203a6['draft']['slice'](_0x3066db['end']);
    }
    if (_0xd3cc7b['length'] > STORY_SCRIPT_MAX_CHARACTERS) throw new Error('正文超过 10 万字，请分段采用');
    ((_0x5bb85d = _0x5203a6['draft']),
      (_0x5203a6['draft'] = _0xd3cc7b),
      (_0x3066db = null),
      _0x13f5c9(),
      (_0x5ada71['step'] !== 0x0 || _0x5ada71['view'] !== 'project') &&
        ((_0x5ada71['step'] = 0x0), (_0x5ada71['view'] = 'project'), _0x5c6de8()),
      _0x363b5f(),
      _0x142e72(selectedOnly ? '已替换选中文字' : '已采用，可继续编辑'));
  }
  function _0x2e94d9() {
    const _0x3b0b45 = _0x4b642e();
    if (!_0x3b0b45['draft']['trim']()) return;
    const _0x5cfad7 = _0x5ada71['data']['project'],
      _0x40ab18 = _0x3b0b45['stage'] === 'writing',
      _0x29243c = createUploadedStoryProjectData({
        projectId: _0x40ab18
          ? _0x525480()
          : 'story-' + Date['now']() + '-' + Math['random']()['toString'](0x24)['slice'](0x2, 0x7),
        request: {
          mode: 'upload',
          sourceText: _0x3b0b45['draft'],
          scriptFileName: _0x5cfad7['title'] + '.txt',
          scriptMode: _0x5ada71['scriptMode'],
          aspectRatio: _0x5cfad7['aspectRatio'],
          styleId: _0x5cfad7['videoStyleId'],
          visualStyle: _0x5cfad7['videoStylePrompt'],
          ..._0x5cfad7['planning'],
        },
      });
    ((_0x29243c['project']['title'] = _0x5cfad7['title']),
      (_0x29243c['project']['collaboration'] = {
        ...clone(_0x3b0b45),
        stage: 'confirmed',
        conversations: _0x40ab18 ? _0x3b0b45['conversations'] : null,
      }),
      _0x13607c['syncCurrentEntry'](),
      _0x14ef87(),
      _0x13607c['replaceCurrent'](_0x29243c),
      (_0x5ada71['hasCreatedProject'] = !![]),
      (_0x5ada71['view'] = 'project'),
      (_0x5ada71['step'] = 0x1),
      _0x13f5c9(),
      _0x5c6de8(),
      _0x363b5f(),
      _0x356b8e('正文已确认，可以继续角色、场景与分镜制作。', 'success'));
  }
  function _0x41fc5c(_0x242ddd) {
    if (_0x5ada71['developerModeAvailable'] !== !![] || !isStoryCollaborationProject(_0x5ada71['data']))
      return;
    const _0xf7149b = _0x242ddd['target'];
    if (!_0xf7149b['closest']?.('.story-conception-page')) return;
    const _0x4016cc = _0x4b642e();
    if (_0xf7149b['matches']('[data-collaboration-draft]'))
      ((_0x4016cc['draft'] = _0xf7149b['value']), (_0x3066db = null));
    else {
      if (_0xf7149b['matches']('[data-collaboration-brief]')) _0x4016cc['brief'] = _0xf7149b['value'];
      else {
        if (_0xf7149b['matches']('[data-collaboration-idea]')) _0x4016cc['idea'] = _0xf7149b['value'];
        else {
          if (_0xf7149b['matches']('[data-collaboration-title]'))
            ((_0x5ada71['data']['project']['title'] = _0xf7149b['value']),
              (_0x5ada71['projectTitleEdited'] = !![]));
          else return;
        }
      }
    }
    if (_0x34a50a('confirm')) _0x34a50a('confirm')['disabled'] = !_0x4016cc['draft']['trim']();
    (_0x142e72('自动保存'), _0x13f5c9());
  }
  function _0x46ba7e(_0x1ed838) {
    const _0x2ac547 = _0x1ed838['target'];
    if (!_0x2ac547['matches']?.('[data-collaboration-draft]')) return;
    if (_0x2ac547['selectionEnd'] > _0x2ac547['selectionStart'])
      _0x3066db = {
        projectId: _0x525480(),
        document: _0x2ac547['value'],
        start: _0x2ac547['selectionStart'],
        end: _0x2ac547['selectionEnd'],
      };
    else _0x3066db = null;
  }
  function _0x5f53c4(_0x29fe8e) {
    if (_0x5ada71['developerModeAvailable'] !== !![]) return;
    if (_0x29fe8e['target']['closest']?.('[data-collaboration-start]')) return _0x22a159();
    if (!isStoryCollaborationProject(_0x5ada71['data'])) return;
    if (_0x29fe8e['target']['closest']?.('[data-collaboration-toggle]')) {
      _0x2f1db3['click']();
      return;
    }
    if (_0x29fe8e['target']['closest']?.('[data-collaboration-confirm]')) return _0x2e94d9();
    if (_0x29fe8e['target']['closest']?.('[data-collaboration-undo]') && _0x5bb85d !== null) {
      ((_0x4b642e()['draft'] = _0x5bb85d), (_0x5bb85d = null), (_0x3066db = null), _0x13f5c9(), _0x363b5f());
      return;
    }
    const _0xe21191 = _0x29fe8e['target']['closest']?.('[data-collaboration-direction]');
    if (!_0xe21191) return;
    const _0x52cb3f = _0x4b642e(),
      _0x290e2f = _0xe21191['dataset']['collaborationDirection'];
    ((_0x52cb3f['directions'] = _0x52cb3f['directions']['includes'](_0x290e2f)
      ? _0x52cb3f['directions']['filter']((_0x288cda) => _0x288cda !== _0x290e2f)
      : [..._0x52cb3f['directions'], _0x290e2f]),
      _0x13f5c9(),
      _0x363b5f());
  }
  (_0x490844['addEventListener']('click', _0x5f53c4), _0x490844['addEventListener']('input', _0x41fc5c));
  for (const _0x3076ba of ['select', 'keyup', 'mouseup'])
    _0x490844['addEventListener'](_0x3076ba, _0x46ba7e, !![]);
  return {
    sync: _0x363b5f,
    start: _0x22a159,
    apply: _0x1b3dd5,
    snapshot: _0x204c91,
    takeInitialMessage(_0x243dfe) {
      if (_0x18ccf4?.['projectId'] !== _0x243dfe) return null;
      const _0x1d986b = _0x18ccf4;
      return ((_0x18ccf4 = null), _0x1d986b);
    },
    subscribe(_0x3028a0) {
      return (_0x17119c['add'](_0x3028a0), _0x3028a0(_0x204c91()), () => _0x17119c['delete'](_0x3028a0));
    },
    context(_0x1a8f94) {
      const _0xf1cd1a = _0x4367cd(_0x1a8f94);
      if (!_0xf1cd1a) throw new Error('剧本项目已关闭或删除');
      const _0x312d6c = _0x4b642e(_0xf1cd1a);
      return {
        workspace: {
          title: _0xf1cd1a['project']['title'],
          document: _0x312d6c['draft'],
          selection:
            _0x3066db?.['projectId'] === _0x1a8f94 && _0x3066db['document'] === _0x312d6c['draft']
              ? _0x312d6c['draft']['slice'](_0x3066db['start'], _0x3066db['end'])
              : '',
          brief:
            '剧本协作写作。先协助讨论方向，用户明确要求写作时直接写正文。回复只提出建议，由用户决定是否采用；不执行画布、图片或视频生成。创作方向：' +
            _0x312d6c['directions']['join']('、') +
            '。创作要求：' +
            _0x312d6c['brief'] +
            '。剧本模式：' +
            _0xf1cd1a['project']['scriptMode'] +
            '。目标集数：' +
            (_0xf1cd1a['project']['planning']?.['episodeCount'] || 0x1) +
            '。故事想法：' +
            (_0x312d6c['idea'] || ''),
        },
      };
    },
    readConversations(_0x2a03cf) {
      return _0x4367cd(_0x2a03cf)?.['project']['collaboration']?.['conversations'] || null;
    },
    writeConversations(_0x515053, _0x35b4cc) {
      const _0x5bef8f = _0x4367cd(_0x515053);
      if (!_0x5bef8f || _0xbaa13e) throw new Error('剧本项目已删除，会话不能写入');
      ((_0x4b642e(_0x5bef8f)['conversations'] = clone(_0x35b4cc)), _0x33577a());
    },
    destroy() {
      ((_0xbaa13e = !![]),
        _0x1e2ec7(),
        _0x17119c['clear'](),
        _0x490844['removeEventListener']('click', _0x5f53c4),
        _0x490844['removeEventListener']('input', _0x41fc5c));
      for (const _0x446a8b of ['select', 'keyup', 'mouseup'])
        _0x490844['removeEventListener'](_0x446a8b, _0x46ba7e, !![]);
      (_0x2f1db3['remove'](), _0x1d184b['remove']());
    },
  };
}
