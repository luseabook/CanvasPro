import { uploadFile } from '../../services/projectService.js';
import { buildCanvasLocalImageFields } from '../../services/canvasMediaLocalService.js';
import {
  ensureStoryAssetBaseAppearance,
  getStoryAssetAppearances,
  normalizeStoryAssetAppearance,
} from './storyAssetAppearances.js';
import { buildStoryBackgroundTaskId } from './storyBackgroundTasks.js';
export function createStoryAssetImageUploadController({
  state: state,
  createProjectToken: createProjectToken,
  isProjectTaskLive: isProjectTaskLive,
  isProjectTaskCurrent: isProjectTaskCurrent,
  getSelectedAppearance: getSelectedAppearance,
  isLoading: isLoading,
  setGenerating: setGenerating,
  startTask: startTask,
  finishTask: finishTask,
  applyImageResult: applyImageResult,
  refresh: refresh,
  showToast: showToast,
  saveFile: saveFile = uploadFile,
} = {}) {
  const map = new Set(),
    capture = (assetId, { appendAppearance: appendAppearance = ![] } = {}) => {
      const projectToken = createProjectToken(),
        appearanceId = projectToken['data']?.['assets']?.['find']((value) => value['id'] === assetId);
      return {
        projectToken: projectToken,
        assetId: assetId,
        appearanceId: appearanceId && getSelectedAppearance(state, appearanceId)?.['id'],
        appendAppearance:
          appendAppearance &&
          projectToken['data']?.['project']?.['sourceMode'] === 'video-replication' &&
          appearanceId?.['kind'] === 'character' &&
          Boolean(getSelectedAppearance(state, appearanceId)?.['imageUrl']),
      };
    };
  async function upload(error, enabled) {
    if (!error || !enabled) return ![];
    if (
      !/^image\//iu['test'](error['type'] || '') &&
      !/\.(png|jpe?g|webp|gif|bmp|avif|svg|tiff?|heic|heif)$/iu['test'](error['name'] || '')
    )
      return (showToast('请拖入图片文件。', 'warn'), ![]);
    const { projectToken: projectToken2, assetId: assetId2, appearanceId: appearanceId2 } = enabled,
      index = projectToken2['data']?.['assets']?.['find']((item) => item['id'] === assetId2),
      prompt = getStoryAssetAppearances(index)['find']((key) => key['id'] === appearanceId2);
    if (!index || index['isLibraryAsset'] || !prompt || !isProjectTaskLive(projectToken2)) return ![];
    const result = projectToken2['projectId'] + ':' + assetId2 + ':' + appearanceId2;
    if (
      map['has'](result) ||
      (isProjectTaskCurrent(projectToken2) && isLoading(state, assetId2, appearanceId2))
    )
      return (showToast('请等待当前生成或上传任务完成。', 'info'), ![]);
    map['add'](result);
    const id = buildStoryBackgroundTaskId('asset-image-upload', {
        assetId: assetId2,
        appearanceId: appearanceId2,
      }),
      handler = () =>
        isProjectTaskLive(projectToken2) &&
        projectToken2['data']?.['assets']?.['includes'](index) &&
        getStoryAssetAppearances(index)['includes'](prompt);
    isProjectTaskCurrent(projectToken2) &&
      (setGenerating(state, assetId2, appearanceId2, !![]), refresh(assetId2));
    startTask(projectToken2, {
      id: id,
      type: 'asset-image-upload',
      scope: { assetId: assetId2, appearanceId: appearanceId2 },
      label: '上传' + (index['name'] || '素材') + '图片',
      message: '正在保存本地图片',
    });
    try {
      const saveFile2 = await saveFile(error, projectToken2['projectId']);
      if (!handler()) {
        if (isProjectTaskLive(projectToken2))
          finishTask(projectToken2, id, { status: 'cancelled', message: '目标形象已移除' });
        return ![];
      }
      const data = enabled['appendAppearance']
        ? normalizeStoryAssetAppearance(
            {
              id: assetId2 + '-upload-' + crypto['randomUUID'](),
              sourceOrigin: 'upload',
              prompt: prompt['prompt'],
              description: prompt['description'],
            },
            { assetId: assetId2, index: index['appearances']['length'] },
          )
        : prompt;
      applyImageResult(index, data, buildCanvasLocalImageFields(saveFile2));
      if (enabled['appendAppearance']) {
        (index['appearances']['push'](data), ensureStoryAssetBaseAppearance(index));
        if (isProjectTaskCurrent(projectToken2))
          state['assetAppearanceIndexes'] = {
            ...state['assetAppearanceIndexes'],
            [assetId2]: index['appearances']['length'] - 1,
          };
      }
      return (finishTask(projectToken2, id, { status: 'succeeded', message: '本地图片已保存' }), !![]);
    } catch (error2) {
      if (!isProjectTaskLive(projectToken2)) return ![];
      finishTask(projectToken2, id, {
        status: 'failed',
        message: '本地图片保存失败',
        error: error2?.['message'] || '素材保存失败，请稍后重试。',
      });
      if (isProjectTaskCurrent(projectToken2))
        showToast(error2?.['message'] || '素材保存失败，请稍后重试。', 'error');
      return ![];
    } finally {
      (map['delete'](result),
        isProjectTaskCurrent(projectToken2) &&
          (setGenerating(state, assetId2, appearanceId2, ![]), refresh(assetId2)));
    }
  }
  return { capture: capture, upload: upload };
}
export function bindStoryAssetImageDrop(el, { state: state2, capture: capture2, upload: upload2 } = {}) {
  let el2 = null;
  const run = () => {
      (el2?.['classList']['remove']('is-image-drop-target'), (el2 = null));
    },
    handler2 = (event) => {
      if (state2['view'] !== 'project' || state2['step'] !== 2 || state2['assetFilter'] === 'library')
        return null;
      const el3 =
        event['target']['closest']?.('[data-story-asset-id]') ||
        event['target']['closest']?.('.story-asset-card-shell')?.['querySelector']('[data-story-asset-id]');
      if (!el3 || !el['contains'](el3)) return null;
      const enabled2 = state2['data']?.['assets']?.['find'](
        (options) => options['id'] === el3['dataset']['storyAssetId'],
      );
      return enabled2 && !enabled2['isLibraryAsset'] ? el3 : null;
    },
    target = (event2) => {
      const el4 = handler2(event2);
      if (!el4 || !Array['from'](event2['dataTransfer']?.['types'] || [])['includes']('Files')) return;
      (event2['preventDefault'](),
        event2['stopPropagation'](),
        (event2['dataTransfer']['dropEffect'] = 'copy'),
        el2 !== el4 && (run(), (el2 = el4), el4['classList']['add']('is-image-drop-target')));
    },
    source = (next) => {
      if (el2 && !el2['contains'](next['relatedTarget'])) run();
    },
    current = (event3) => {
      const el5 = handler2(event3);
      run();
      if (!el5 || !event3['dataTransfer']?.['files']?.['length']) return;
      (event3['preventDefault'](), event3['stopPropagation']());
      const entry = capture2(el5['dataset']['storyAssetId'], { appendAppearance: !![] });
      void upload2(event3['dataTransfer']['files'][0], entry);
    };
  return (
    el['addEventListener']('dragover', target, !![]),
    el['addEventListener']('dragleave', source, !![]),
    el['addEventListener']('drop', current, !![]),
    {
      destroy() {
        (run(),
          el['removeEventListener']('dragover', target, !![]),
          el['removeEventListener']('dragleave', source, !![]),
          el['removeEventListener']('drop', current, !![]));
      },
    }
  );
}
