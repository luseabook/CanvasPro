import appStore from '../../core/stores/appStore.js';
import { generateId } from '../../core/math.js';
import { submitTask } from '../../core/generationTaskRuntime.js';
import ImageCropController from '../../modules/ImageCropController.js';
import ImageAnnotateController from '../../modules/ImageAnnotateController.js';
import ImageExpandController from '../../modules/ImageExpandController.js';
import ImageFreeAngleController, {
  createRunningHubTaskStateMachine,
} from '../../modules/ImageFreeAngleController.js';
import ImageMattingController from '../../modules/ImageMattingController.js';
import VideoClipController from '../../modules/VideoClipController.js';
import VideoKeyingController from '../../modules/VideoKeyingController.js';
import { openNodeImagePreview } from '../../modules/imagePreview.js';
import { getImage } from '../../modules/storage.js';
import { showError, showWarning } from '../../services/index.js';
import { buildSourceMediaNodePayload } from '../../services/fileService.js';
import { resolveCanvasImagePreviewUrl } from '../../services/canvasMediaLocalService.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
} from '../aigenImage/imageGenerationResultRenderer.js';
import {
  buildStoryboardNodePayload,
  computePreparedStoryboardSize,
  resolveNearestStoryboardAspect,
} from '../../core/storyboardFactory.js';
import { calcDisplaySizeByMedia } from '../../services/mediaRatioService.js';
import { registerStaticInnerHTML } from '../../utils/dom.js';
import { fetchRemoteBlob, saveOutputToServer } from '../../../api/projectsV2Api.js';
import { resumeRunningHubImageTask } from '../../../api/aiImageApi.js';
import {
  runRunninghubAiApp,
  runRunninghubWorkflow,
  resumeRunninghubWorkflowTask,
} from '../../../api/runninghubWorkflowApi.js';
import { processInputVideos } from '../../../api/videoUploadApi.js';
import { buildApiUrl } from '../../../api/apiBase.js';
import { processInputImages } from '../../../api/imageUploadApi.js';
import { getProviderConfig, ensureConfig } from '../../../api/configApi.js';
import { calcSafeSpawnPosNearNode } from '../../modules/nodeSpawn.js';
import { t } from '../../i18n/index.js';
import { executeCommand } from '../../core/interaction.js';
import { commit } from '../../modules/history.js';
import { IMAGE_TOOLBAR_HTML } from './imageToolbarHtml.js';
import { showDevToast } from './toolbarShared.js';
import { bindImageToolbarLayoutUi } from './imageToolbarLayoutUi.js';
import {
  bindRunningHubToolbarTaskButton,
  cancelRunningHubRemoteTaskQuietly,
  cancelRunningHubResultTask,
  findRunningHubToolbarTaskForNode,
  isRunningHubToolbarTaskCancelled,
  notifyRunningHubToolbarTasksChanged,
} from './runningHubToolbarTaskButton.js';
import {
  IMAGE_TOOLBAR_ACTIONS,
  normalizeImageToolbarLayout,
  serializeImageToolbarLayout,
} from '../../modules/imageToolbarLayoutMemory.js';
import { executeGridCrop, prepareGridCells } from '../../modules/imageToolbarGridCrop.js';
import {
  buildToolbarImageFields,
  saveOutputImageResult,
  saveRemoteImageResultLocally,
} from '../../modules/imageToolbarOutputActions.js';
import {
  extractFirstImageUrl,
  parseRhCode,
  parseRhTaskId,
  resolveApiInputRatioBasis,
  resolveFinalResultDisplaySize,
} from '../../modules/imageToolbarHelpers.js';
import { bindImageAnnotateCloneActions } from './imageActions/annotateCloneAction.js';
import { bindImageMattingAction } from './imageActions/mattingAction.js';
import { bindImageAutoSubjectAction } from './imageActions/autoSubjectAction.js';
import { bindImagePanorama360Action } from './imageActions/panorama360Action.js';
import { bindImageHdAction } from './imageActions/hdAction.js';
import { bindImageCropAction } from './imageActions/cropAction.js';
import { bindImageExpandAction } from './imageActions/expandAction.js';
import { bindImageAnnotateAction } from './imageActions/annotateAction.js';
import { bindImageFreeAngleAction } from './imageActions/freeAngleAction.js';
import { bindImageMultigridAction } from './imageActions/multigridAction.js';
import { bindImageDownloadAction } from './imageActions/downloadAction.js';
import { bindImageFullscreenAction } from './imageActions/fullscreenAction.js';
import { bindImageResetSizeAction } from './imageActions/resetSizeAction.js';
import { bindApimartPrivateAvatarAction } from './apimartPrivateAvatarAction.js';
const getStateSnapshot = () =>
  typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
function imageToolbarText(_0x21334a, _0x18d4dd = {}) {
  return t('nodeToolbar.image.' + _0x21334a, _0x18d4dd);
}
function createViewportSnapshotTracker() {
  let _0x4f879e = getStateSnapshot().viewport || {},
    _0x1be4bb =
      typeof appStore.subscribeSelector === 'function'
        ? appStore.subscribeSelector(
            (_0x4a3789) => _0x4a3789.viewport,
            (_0x190780) => {
              _0x4f879e = _0x190780 || {};
            },
          )
        : null;
  return {
    openedViewport: { ..._0x4f879e },
    getViewport: () => _0x4f879e,
    dispose: () => {
      (_0x1be4bb?.(), (_0x1be4bb = null));
    },
  };
}
const TOOLBAR_TASK_CANCELLED_MESSAGE = imageToolbarText('taskCancelled'),
  IMAGE_LOCAL_SAVE_FAILURE_MESSAGE = imageToolbarText('localSaveGeneratedFailed');
function createToolbarCancelledError() {
  const _0x2b483a = new Error(TOOLBAR_TASK_CANCELLED_MESSAGE);
  return ((_0x2b483a.name = 'AbortError'), _0x2b483a);
}
function isToolbarCancelledError(_0x32deaf) {
  const _0x4f80aa = String(_0x32deaf?.message || _0x32deaf || '');
  return (
    _0x32deaf?.name === 'AbortError' ||
    _0x4f80aa === TOOLBAR_TASK_CANCELLED_MESSAGE ||
    _0x4f80aa === 'CANCELLED' ||
    _0x4f80aa.toLowerCase().includes('aborted')
  );
}
function createLocalSaveFailureError() {
  const _0x362a14 = new Error(IMAGE_LOCAL_SAVE_FAILURE_MESSAGE);
  return ((_0x362a14.isLocalSaveFailure = true), _0x362a14);
}
function isLocalSaveFailure(_0x4e66ab) {
  return (
    _0x4e66ab?.isLocalSaveFailure === true ||
    String(_0x4e66ab?.message || _0x4e66ab || '') === IMAGE_LOCAL_SAVE_FAILURE_MESSAGE
  );
}
function throwIfToolbarTaskCancelled(_0x23a59c) {
  if (isRunningHubToolbarTaskCancelled(_0x23a59c)) throw createToolbarCancelledError();
}
function focusToolbarTaskNodes(_0x367679, _0x11d1ee) {
  (appStore.setSelectedNodes([_0x11d1ee]),
    typeof window.v2FocusOnNodes === 'function'
      ? window.v2FocusOnNodes([_0x367679, _0x11d1ee])
      : window.v2FocusOnNode?.(_0x11d1ee));
}
function notifyImageToolbarTaskChange({ sourceNodeId: _0x13617d, targetNodeId: _0x286113 }) {
  (notifyRunningHubToolbarTasksChanged({ sourceNodeId: _0x13617d, outId: _0x286113 }),
    window._triggerLocalCacheSave?.());
}
function buildClearedImageMediaFields() {
  return { imageUrl: '', sourceUrl: '', thumbUrl: '', src: '', localPath: '' };
}
export { IMAGE_TOOLBAR_HTML };
registerStaticInnerHTML('toolbar:image', IMAGE_TOOLBAR_HTML);
function getToolbarActionFromButton(_0x65d40b) {
  if (!_0x65d40b?.classList) return '';
  for (const _0x4fb2d of _0x65d40b.classList) {
    if (!_0x4fb2d.startsWith('act-')) continue;
    const _0x5d9ddf = _0x4fb2d.slice(4);
    if (IMAGE_TOOLBAR_ACTIONS.includes(_0x5d9ddf)) return _0x5d9ddf;
  }
  return '';
}
export function bindImageToolbarEvents(_0x40a979, _0x2501d3) {
  if (!_0x40a979) return;
  const _0xd8ae09 = typeof _0x2501d3 === 'string' ? _0x2501d3 : _0x2501d3?.id;
  if (!_0xd8ae09) return;
  const _0x242d39 = () =>
    getStateSnapshot().nodes?.[_0xd8ae09] || (typeof _0x2501d3 === 'object' ? _0x2501d3 : null);
  (_0x40a979.addEventListener('pointerdown', (_0x10f2e7) => _0x10f2e7.stopPropagation()),
    _0x40a979.addEventListener('dblclick', (_0x2967f7) => {
      (_0x2967f7.preventDefault(), _0x2967f7.stopPropagation());
    }));
  const _0x596dfe = bindImageToolbarLayoutUi(_0x40a979, {
      store: appStore,
      getStateSnapshot: getStateSnapshot,
      imageToolbarActions: IMAGE_TOOLBAR_ACTIONS,
      normalizeImageToolbarLayout: normalizeImageToolbarLayout,
      serializeImageToolbarLayout: serializeImageToolbarLayout,
      getToolbarActionFromButton: getToolbarActionFromButton,
    }),
    _0x1f0c2f = createRunningHubTaskStateMachine(),
    _0x20ec79 = _0x1f0c2f.state,
    _0x5b478a = {
      toolbarEl: _0x40a979,
      nodeId: _0xd8ae09,
      mediaKind: 'image',
      getNodeData: _0x242d39,
      getStateSnapshot: getStateSnapshot,
      _hdTaskMachine: _0x1f0c2f,
      _hdState: _0x20ec79,
      store: appStore,
      generateId: generateId,
      submitTask: submitTask,
      ImageCropController: ImageCropController,
      ImageAnnotateController: ImageAnnotateController,
      ImageExpandController: ImageExpandController,
      ImageMattingController: ImageMattingController,
      openNodeImagePreview: openNodeImagePreview,
      getImage: getImage,
      buildSourceMediaNodePayload: buildSourceMediaNodePayload,
      resolveCanvasImagePreviewUrl: resolveCanvasImagePreviewUrl,
      localPathToUrl: localPathToUrl,
      buildImageGenerationFailurePatch: buildImageGenerationFailurePatch,
      buildImageGenerationResultPatch: buildImageGenerationResultPatch,
      buildStoryboardNodePayload: buildStoryboardNodePayload,
      computePreparedStoryboardSize: computePreparedStoryboardSize,
      resolveNearestStoryboardAspect: resolveNearestStoryboardAspect,
      calcDisplaySizeByMedia: calcDisplaySizeByMedia,
      fetchRemoteBlob: fetchRemoteBlob,
      resumeRunningHubImageTask: resumeRunningHubImageTask,
      runRunninghubAiApp: runRunninghubAiApp,
      runRunninghubWorkflow: runRunninghubWorkflow,
      resumeRunninghubWorkflowTask: resumeRunninghubWorkflowTask,
      processInputImages: processInputImages,
      getProviderConfig: getProviderConfig,
      ensureConfig: ensureConfig,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      executeCommand: executeCommand,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      cancelRunningHubRemoteTaskQuietly: cancelRunningHubRemoteTaskQuietly,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
      isRunningHubToolbarTaskCancelled: isRunningHubToolbarTaskCancelled,
      executeGridCrop: executeGridCrop,
      prepareGridCells: prepareGridCells,
      buildToolbarImageFields: buildToolbarImageFields,
      saveOutputImageResult: saveOutputImageResult,
      saveRemoteImageResultLocally: saveRemoteImageResultLocally,
      extractFirstImageUrl: extractFirstImageUrl,
      parseRhCode: parseRhCode,
      parseRhTaskId: parseRhTaskId,
      resolveApiInputRatioBasis: resolveApiInputRatioBasis,
      resolveFinalResultDisplaySize: resolveFinalResultDisplaySize,
      createViewportSnapshotTracker: createViewportSnapshotTracker,
      createToolbarCancelledError: createToolbarCancelledError,
      isToolbarCancelledError: isToolbarCancelledError,
      createLocalSaveFailureError: createLocalSaveFailureError,
      isLocalSaveFailure: isLocalSaveFailure,
      throwIfToolbarTaskCancelled: throwIfToolbarTaskCancelled,
      focusToolbarTaskNodes: focusToolbarTaskNodes,
      notifyImageToolbarTaskChange: notifyImageToolbarTaskChange,
      buildClearedImageMediaFields: buildClearedImageMediaFields,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
    };
  (bindImageAnnotateCloneActions(_0x5b478a),
    bindImageMattingAction(_0x5b478a),
    bindImageAutoSubjectAction(_0x5b478a),
    bindImagePanorama360Action(_0x5b478a),
    bindApimartPrivateAvatarAction(_0x5b478a),
    bindImageHdAction(_0x5b478a),
    bindImageCropAction(_0x5b478a),
    bindImageExpandAction(_0x5b478a),
    bindImageAnnotateAction(_0x5b478a),
    bindImageFreeAngleAction(_0x5b478a),
    bindImageMultigridAction(_0x5b478a),
    bindImageDownloadAction(_0x5b478a),
    bindImageFullscreenAction(_0x5b478a),
    bindImageResetSizeAction(_0x5b478a));
}
