import { createAudioPlaybackSurfaceController } from '../../components/audio-node/audioPlaybackSurface.js';
import { bindWorkspaceSelects } from '../workspaceSelects.js';
import { buildWorkspaceAssetLibraryItems } from '../workspaceAssetLibrary.js';
import {
  addStoryAudioAssets,
  bindStoryAudioToCharacter,
  getStoryAudioUrl,
  removeStoryAudioAsset,
  storyAudioUploads,
} from './storyAudioAssets.js';
export function addStoryLibraryAudioToProject(value, item) {
  const list = addStoryAudioAssets(value['data'], item);
  if (!list['length']) return ![];
  return (
    (value['assetFilter'] = 'audio'),
    (value['selectedAssetId'] = list[0x0]['id']),
    (value['assetSelectionMode'] = ![]),
    (value['selectedAssetIds'] = []),
    !![]
  );
}
export function bindStoryAudioAssets(
  el,
  {
    state: state,
    createToken: createToken,
    isLive: isLive,
    isCurrent: isCurrent,
    syncEntry: syncEntry,
    persist: persist,
    render: render,
    uploadFile: uploadFile,
    saveAssetPackageItem: saveAssetPackageItem,
    showToast: showToast,
    startTask: startTask = () => {},
    finishTask: finishTask = () => {},
  },
) {
  const sourceProjectId = createToken(),
    el2 = el['querySelector']('[data-story-audio-detail]'),
    key = el2?.['ownerDocument'] ? bindWorkspaceSelects(el2) : null;
  let audioPlaybackSurfaceController = null,
    enabled = ![];
  queueMicrotask(() => {
    if (!enabled)
      audioPlaybackSurfaceController = createAudioPlaybackSurfaceController(
        el['querySelector']('[data-story-audio-player]'),
        { onError: () => showToast('音频播放失败。', 'warn') },
      );
  });
  const run = () =>
      state['assetFilter'] === 'library'
        ? buildWorkspaceAssetLibraryItems({ allowedTypes: ['image', 'audio'] })
        : state['data']['audioAssets'] || [],
    handler = () =>
      run()['filter'](
        (index) =>
          index['mediaKind'] === 'audio' &&
          (state['assetSelectionMode']
            ? state['selectedAssetIds']['includes'](index['id'])
            : state['selectedAssetId'] === index['id']),
      ),
    handler2 = () => {
      (syncEntry(sourceProjectId), persist({ immediate: !![] }));
      if (isCurrent(sourceProjectId)) render();
    },
    handler3 = () =>
      el['querySelectorAll']('.story-voice-source-menu-wrap')['forEach']((el3) => {
        (el3['querySelector']('[aria-expanded]')?.['setAttribute']('aria-expanded', 'false'),
          (el3['querySelector']('[role="menu"]')['hidden'] = !![]));
      }),
    result = (event) => {
      if (!event['target']['closest']('.story-voice-source-menu-wrap')) handler3();
    },
    data = (event2) => {
      if (event2['key'] !== 'Escape') return;
      const el4 = el['querySelector']('.story-voice-source-menu-wrap [aria-expanded="true"]');
      (handler3(), el4?.['focus']());
    },
    options = (event3) => {
      if (event3['target']['closest']('.story-voice-source-menu [data-story-action]')) handler3();
      const el5 = event3['target']['closest']('[data-story-audio-action]');
      if (!el5 || !isCurrent(sourceProjectId)) return;
      (event3['preventDefault'](), event3['stopPropagation']());
      const target = el5['dataset']['storyAudioAction'];
      if (target === 'toggle-voice-menu') {
        const el6 = el5['closest']('.story-voice-source-menu-wrap')['querySelector']('[role="menu"]'),
          enabled2 = el6['hidden'];
        (handler3(), (el6['hidden'] = !enabled2), el5['setAttribute']('aria-expanded', String(enabled2)));
        if (enabled2) el6['querySelector']('button')?.['focus']();
        return;
      }
      if (target === 'choose-project-voice') {
        ((state['audioTargetCharacterId'] = state['selectedAssetId']),
          (state['assetFilter'] = 'audio'),
          (state['selectedAssetId'] = state['data']['audioAssets']?.[0x0]?.['id'] || ''),
          (state['assetSelectionMode'] = ![]),
          (state['selectedAssetIds'] = []),
          handler2());
        return;
      }
      if (target === 'upload') {
        el['querySelector']('[data-story-audio-files]')?.['click']();
        return;
      }
      const enabled3 = run()['find']((source) => source['id'] === state['selectedAssetId']);
      if (target === 'add') {
        if (!addStoryLibraryAudioToProject(state, handler())) return;
      } else {
        if (target === 'bind') {
          if (
            !enabled3 ||
            !bindStoryAudioToCharacter(
              sourceProjectId['data'],
              enabled3,
              el['querySelector']('[data-story-audio-character]')?.['value'],
            )
          ) {
            showToast('请先选择要绑定的角色。', 'warn');
            return;
          }
        } else {
          if (target === 'remove')
            (removeStoryAudioAsset(sourceProjectId['data'], enabled3?.['id']),
              (state['selectedAssetId'] = ''));
          else return;
        }
      }
      handler2();
    },
    async2 = async (event4) => {
      if (event4['target']['matches']('[data-story-audio-character]') && isCurrent(sourceProjectId)) {
        state['audioTargetCharacterId'] = event4['target']['value'];
        const el7 = el2?.['querySelector']('[data-story-audio-action=\x22bind\x22]');
        if (el7)
          el7['disabled'] = !state['data']['assets']['some'](
            (next) => next['kind'] === 'character' && next['id'] === event4['target']['value'],
          );
        return;
      }
      if (
        !event4['target']['matches']('[data-story-audio-files]') ||
        !isCurrent(sourceProjectId) ||
        storyAudioUploads['has'](sourceProjectId['data'])
      )
        return;
      const list2 = [...event4['target']['files']];
      if (!list2['length']) return;
      if (typeof saveAssetPackageItem !== 'function') {
        showToast('总素材服务尚未初始化。', 'warn');
        return;
      }
      storyAudioUploads['add'](sourceProjectId['data']);
      const id = 'project-audio-upload';
      (startTask(sourceProjectId, {
        id: id,
        kind: 'asset-audio-upload',
        label: '上传项目音频',
        message: '正在保存音频到总素材',
      }),
        render());
      try {
        for (const error of list2) {
          if (!/^audio\//u['test'](error['type']) && !/\.(mp3|wav|m4a|ogg|flac)$/iu['test'](error['name']))
            throw new Error('请选择音频文件。');
          const audioUrl = await uploadFile(error, sourceProjectId['projectId']);
          if (!isLive(sourceProjectId)) return;
          const audioUrl2 = getStoryAudioUrl({
            audioUrl:
              audioUrl?.['displayUrl'] ||
              audioUrl?.['url'] ||
              audioUrl?.['originalUrl'] ||
              audioUrl?.['localUrl'],
            localPath: audioUrl?.['localPath'] || audioUrl?.['path'],
          });
          if (!audioUrl2) throw new Error('音频上传未返回有效地址。');
          const itemName = error['name']['replace'](/\.[^.]+$/u, ''),
            category =
              sourceProjectId['data']['project']['sourceMode'] === 'video-replication' ? '复刻' : '剧本',
            sourceAssetId = await saveAssetPackageItem({
              packageKey: 'story-audio:' + sourceProjectId['projectId'],
              packageName:
                (sourceProjectId['data']['project']['title'] || category + '项目') + '\x20·\x20音频素材',
              category: category + '工作室',
              itemKey: globalThis['crypto']['randomUUID'](),
              itemName: itemName,
              audio: { ...audioUrl, audioUrl: audioUrl2 },
              metadata: { sourceKind: 'story-workspace', sourceProjectId: sourceProjectId['projectId'] },
            });
          if (!isLive(sourceProjectId)) return;
          if (!sourceAssetId?.['assetId']) throw new Error('音频未能保存到总素材，请重试。');
          const addStoryAudioAssets2 = addStoryAudioAssets(sourceProjectId['data'], [
            {
              mediaKind: 'audio',
              name: itemName,
              audioUrl: audioUrl2,
              localPath: audioUrl?.['localPath'],
              sourceAssetId: sourceAssetId?.['assetId'],
              sourceItemIndex: sourceAssetId?.['itemIndex'],
            },
          ]);
          if (isCurrent(sourceProjectId) && state['assetFilter'] === 'audio')
            state['selectedAssetId'] = addStoryAudioAssets2['at'](-0x1)?.['id'] || state['selectedAssetId'];
          (syncEntry(sourceProjectId), persist({ immediate: !![] }));
        }
        finishTask(sourceProjectId, id, { status: 'succeeded', message: '项目音频已保存' });
      } catch (error2) {
        if (isLive(sourceProjectId))
          finishTask(sourceProjectId, id, {
            status: 'failed',
            error: error2['message'],
            message: '项目音频保存失败',
          });
        showToast(error2['message'] || '音频上传失败。', 'warn');
      } finally {
        storyAudioUploads['delete'](sourceProjectId['data']);
        if (isCurrent(sourceProjectId)) render();
      }
    };
  return (
    el['addEventListener']('click', options),
    el['addEventListener']('change', async2),
    el['ownerDocument']?.['addEventListener']('click', result),
    el['ownerDocument']?.['addEventListener']('keydown', data),
    {
      destroy() {
        ((enabled = !![]),
          key?.['destroy'](),
          audioPlaybackSurfaceController?.['destroy'](),
          el['removeEventListener']('click', options),
          el['removeEventListener']('change', async2),
          el['ownerDocument']?.['removeEventListener']('click', result),
          el['ownerDocument']?.['removeEventListener']('keydown', data));
      },
    }
  );
}
