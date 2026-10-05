import {
  createGeneratedStoryProjectData,
  createUploadedStoryProjectData,
  STORY_SCRIPT_MAX_CHARACTERS,
} from './storyProjectPlanning.js';
import { isStoryCollaborationProject } from './storyCollaborationPolicy.js';
const clone = (value) => JSON['parse'](JSON['stringify'](value));
export function createStoryCollaboration({
  state: state,
  root: root,
  projectData: projectData,
  save: save,
  render: render,
  resetCreationState: resetCreationState,
  beginProjectSession: beginProjectSession,
  isActive: isActive,
  showToast: showToast,
}) {
  const el = root['ownerDocument'],
    map = new Set();
  let item = '',
    selection = null,
    destroyed = ![],
    value2 = null;
  const trigger = el['createElement']('button');
  ((trigger['type'] = 'button'),
    (trigger['className'] = 'story-collaboration-trigger'),
    (trigger['hidden'] = !![]),
    (trigger['textContent'] = 'AI 协作'),
    trigger['setAttribute']('aria-label', '打开剧本 AI 协作'),
    root['appendChild'](trigger));
  const host = el['createElement']('div');
  ((host['className'] = 'story-agent-host'), root['appendChild'](host));
  const run = (key) => root['querySelector']('.story-page.is-current [data-collaboration-' + key + ']'),
    handler = (index) => {
      const el2 = run('status');
      if (el2) el2['textContent'] = index;
    };
  let value3 = null;
  const projectId = () => String(state['data']?.['project']?.['id'] || '');
  function run2(result) {
    if (!projectData['getEntry'](result)) return null;
    return projectData['getData'](result);
  }
  function run3(data = state['data']) {
    if (!isStoryCollaborationProject(data)) throw new Error('仅 AI 协作创作项目可使用协作功能');
    return data['project']['collaboration'];
  }
  function run4() {
    (projectData['syncCurrentEntry'](), save());
  }
  function snapshot() {
    return {
      destroyed: destroyed,
      active:
        !destroyed &&
        isStoryCollaborationProject(state['data']) &&
        state['developerModeAvailable'] === !![] &&
        isActive() &&
        state['workspaceSurface'] !== 'replication' &&
        state['view'] !== 'home',
      projectId: state['hasCreatedProject'] ? projectId() : '',
      enabled: isStoryCollaborationProject(state['data']),
      editing: state['step'] === 0 && state['view'] === 'project',
      root: root,
      host: host,
      trigger: trigger,
    };
  }
  function run5() {
    const options = snapshot();
    map['forEach']((handler2) => handler2(options));
  }
  function sync() {
    if (destroyed) return;
    if (!isStoryCollaborationProject(state['data']) && state['step'] === 0) state['step'] = 1;
    if (state['developerModeAvailable'] !== !![]) {
      if (state['homeTab'] === 'collaborate') state['homeTab'] = 'generate';
      if (state['view'] === 'project' && state['step'] === 0) {
        if (state['data']['project']['collaboration']?.['stage'] === 'writing') state['view'] = 'home';
        else state['step'] = 1;
      }
    }
    const target = snapshot();
    target['projectId'] !== item && ((item = target['projectId']), (selection = null), (value3 = null));
    if (target['active'] && target['editing'] && target['projectId']) {
      const draft = run3();
      for (const [source, next] of Object['entries']({
        draft: draft['draft'],
        brief: draft['brief'],
        idea: draft['idea'] || '',
        title: state['data']['project']['title'],
      })) {
        const el3 = run(source);
        if (el3 && el3['value'] !== next) el3['value'] = next;
      }
      root['querySelectorAll']('[data-collaboration-direction]')['forEach']((el4) =>
        el4['setAttribute'](
          'aria-pressed',
          String(draft['directions']['includes'](el4['dataset']['collaborationDirection'])),
        ),
      );
      if (run('confirm')) run('confirm')['disabled'] = !draft['draft']['trim']();
      if (run('undo')) run('undo')['disabled'] = value3 === null;
    }
    run5();
  }
  function start(current = state['idea']) {
    if (state['developerModeAvailable'] !== !![]) return;
    const idea = String(current || '')['trim']();
    if (!idea || state['isGeneratingStory']) return;
    const aspectRatio = state['data']['project'],
      scriptMode = state['scriptMode'],
      request = {
        idea: idea,
        scriptMode: scriptMode,
        aspectRatio: aspectRatio['aspectRatio'],
        styleId: aspectRatio['videoStyleId'],
        visualStyle: aspectRatio['videoStylePrompt'],
        ...aspectRatio['planning'],
      },
      settings = {
        model: state['models']['text'],
        provider: state['textProvider'],
        providerProfileId: state['textProviderProfileId'],
      };
    (resetCreationState(), (state['homeTab'] = 'collaborate'), (state['scriptMode'] = scriptMode));
    const generatedStoryProjectData = createGeneratedStoryProjectData(
      {},
      {
        projectId: 'story-' + Date['now']() + '-' + Math['random']()['toString'](36)['slice'](2, 7),
        request: request,
      },
    );
    ((generatedStoryProjectData['project']['title'] = '未命名协作剧本'),
      (generatedStoryProjectData['project']['collaboration'] = {
        stage: 'writing',
        idea: idea,
        draft: '',
        brief: '',
        directions: [],
        conversations: null,
      }),
      projectData['replaceCurrent'](generatedStoryProjectData),
      (state['hasCreatedProject'] = !![]),
      (state['projectTitleEdited'] = ![]),
      (state['view'] = 'project'),
      (state['step'] = 0),
      (value2 = { projectId: projectId(), text: idea, settings: settings }),
      run4(),
      render(),
      sync());
  }
  function apply(entry, { projectId: projectId2, selectedOnly: selectedOnly = ![] } = {}) {
    if (!snapshot()['active'] || projectId2 !== projectId() || !run2(projectId2))
      throw new Error('项目已切换，请回到原剧本后采用');
    const record = run3(),
      enabled = String(entry || '')['trim']();
    if (!enabled) throw new Error('没有可采用的正文');
    let list = enabled;
    if (selectedOnly) {
      if (
        !selection ||
        selection['projectId'] !== projectId() ||
        selection['document'] !== record['draft'] ||
        selection['end'] <= selection['start']
      )
        throw new Error('请先在正文中选择要替换的文字');
      list =
        record['draft']['slice'](0, selection['start']) +
        enabled +
        record['draft']['slice'](selection['end']);
    }
    if (list['length'] > STORY_SCRIPT_MAX_CHARACTERS) throw new Error('正文超过 10 万字，请分段采用');
    ((value3 = record['draft']),
      (record['draft'] = list),
      (selection = null),
      run4(),
      (state['step'] !== 0 || state['view'] !== 'project') &&
        ((state['step'] = 0), (state['view'] = 'project'), render()),
      sync(),
      handler(selectedOnly ? '已替换选中文字' : '已采用，可继续编辑'));
  }
  function run6() {
    const sourceText = run3();
    if (!sourceText['draft']['trim']()) return;
    const scriptFileName = state['data']['project'],
      projectId3 = sourceText['stage'] === 'writing',
      uploadedStoryProjectData = createUploadedStoryProjectData({
        projectId: projectId3
          ? projectId()
          : 'story-' + Date['now']() + '-' + Math['random']()['toString'](36)['slice'](2, 7),
        request: {
          mode: 'upload',
          sourceText: sourceText['draft'],
          scriptFileName: scriptFileName['title'] + '.txt',
          scriptMode: state['scriptMode'],
          aspectRatio: scriptFileName['aspectRatio'],
          styleId: scriptFileName['videoStyleId'],
          visualStyle: scriptFileName['videoStylePrompt'],
          ...scriptFileName['planning'],
        },
      });
    ((uploadedStoryProjectData['project']['title'] = scriptFileName['title']),
      (uploadedStoryProjectData['project']['collaboration'] = {
        ...clone(sourceText),
        stage: 'confirmed',
        conversations: projectId3 ? sourceText['conversations'] : null,
      }),
      projectData['syncCurrentEntry'](),
      beginProjectSession(),
      projectData['replaceCurrent'](uploadedStoryProjectData),
      (state['hasCreatedProject'] = !![]),
      (state['view'] = 'project'),
      (state['step'] = 1),
      run4(),
      render(),
      sync(),
      showToast('正文已确认，可以继续角色、场景与分镜制作。', 'success'));
  }
  function run7(event) {
    if (state['developerModeAvailable'] !== !![] || !isStoryCollaborationProject(state['data'])) return;
    const el5 = event['target'];
    if (!el5['closest']?.('.story-conception-page')) return;
    const enabled2 = run3();
    if (el5['matches']('[data-collaboration-draft]'))
      ((enabled2['draft'] = el5['value']), (selection = null));
    else {
      if (el5['matches']('[data-collaboration-brief]')) enabled2['brief'] = el5['value'];
      else {
        if (el5['matches']('[data-collaboration-idea]')) enabled2['idea'] = el5['value'];
        else {
          if (el5['matches']('[data-collaboration-title]'))
            ((state['data']['project']['title'] = el5['value']), (state['projectTitleEdited'] = !![]));
          else return;
        }
      }
    }
    if (run('confirm')) run('confirm')['disabled'] = !enabled2['draft']['trim']();
    (handler('自动保存'), run4());
  }
  function run8(event2) {
    const document = event2['target'];
    if (!document['matches']?.('[data-collaboration-draft]')) return;
    if (document['selectionEnd'] > document['selectionStart'])
      selection = {
        projectId: projectId(),
        document: document['value'],
        start: document['selectionStart'],
        end: document['selectionEnd'],
      };
    else selection = null;
  }
  function run9(event3) {
    if (state['developerModeAvailable'] !== !![]) return;
    if (event3['target']['closest']?.('[data-collaboration-start]')) return start();
    if (!isStoryCollaborationProject(state['data'])) return;
    if (event3['target']['closest']?.('[data-collaboration-toggle]')) {
      trigger['click']();
      return;
    }
    if (event3['target']['closest']?.('[data-collaboration-confirm]')) return run6();
    if (event3['target']['closest']?.('[data-collaboration-undo]') && value3 !== null) {
      ((run3()['draft'] = value3), (value3 = null), (selection = null), run4(), sync());
      return;
    }
    const el6 = event3['target']['closest']?.('[data-collaboration-direction]');
    if (!el6) return;
    const args = run3(),
      payload = el6['dataset']['collaborationDirection'];
    ((args['directions'] = args['directions']['includes'](payload)
      ? args['directions']['filter']((handle) => handle !== payload)
      : [...args['directions'], payload]),
      run4(),
      sync());
  }
  (root['addEventListener']('click', run9), root['addEventListener']('input', run7));
  for (const config of ['select', 'keyup', 'mouseup']) root['addEventListener'](config, run8, !![]);
  return {
    sync: sync,
    start: start,
    apply: apply,
    snapshot: snapshot,
    takeInitialMessage(scope) {
      if (value2?.['projectId'] !== scope) return null;
      const input = value2;
      return ((value2 = null), input);
    },
    subscribe(handler3) {
      return (map['add'](handler3), handler3(snapshot()), () => map['delete'](handler3));
    },
    context(output) {
      const title = run2(output);
      if (!title) throw new Error('剧本项目已关闭或删除');
      const document2 = run3(title);
      return {
        workspace: {
          title: title['project']['title'],
          document: document2['draft'],
          selection:
            selection?.['projectId'] === output && selection['document'] === document2['draft']
              ? document2['draft']['slice'](selection['start'], selection['end'])
              : '',
          brief:
            '剧本协作写作。先协助讨论方向，用户明确要求写作时直接写正文。回复只提出建议，由用户决定是否采用；不执行画布、图片或视频生成。创作方向：' +
            document2['directions']['join']('、') +
            '。创作要求：' +
            document2['brief'] +
            '。剧本模式：' +
            title['project']['scriptMode'] +
            '。目标集数：' +
            (title['project']['planning']?.['episodeCount'] || 1) +
            '。故事想法：' +
            (document2['idea'] || ''),
        },
      };
    },
    readConversations(value4) {
      return run2(value4)?.['project']['collaboration']?.['conversations'] || null;
    },
    writeConversations(value5, value6) {
      const enabled3 = run2(value5);
      if (!enabled3 || destroyed) throw new Error('剧本项目已删除，会话不能写入');
      ((run3(enabled3)['conversations'] = clone(value6)), save());
    },
    destroy() {
      ((destroyed = !![]),
        run5(),
        map['clear'](),
        root['removeEventListener']('click', run9),
        root['removeEventListener']('input', run7));
      for (const value7 of ['select', 'keyup', 'mouseup']) root['removeEventListener'](value7, run8, !![]);
      (trigger['remove'](), host['remove']());
    },
  };
}
