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
import { closeActiveImagePreview, openNodeImagePreview } from '../../modules/imagePreview.js';
import { getImage } from '../../modules/storage.js';
import { showError, showWarning } from '../../services/index.js';
import { buildSourceMediaNodePayload } from '../../services/fileService.js';
import { resolveCanvasImagePreviewUrl } from '../../services/canvasMediaLocalService.js';
import { desktopBridge } from '../../services/desktopBridge.js';
import { saveMediaDownload } from '../../services/downloadSaveService.js';
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
import { fetchRemoteBlob } from '../../../api/projectsV2Api.js';
import {
  resumeApimartMidjourneyUpscaleTask,
  resumeRunningHubImageTask,
  submitApimartMidjourneyUpscaleRequest,
  submitApimartMidjourneyVariationRequest,
} from '../../../api/aiImageApi.js';
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
import { bindPreviewUploadToolbarAction } from '../../modules/previewUploadEntry.js';
import { bindImageLocalEditAction } from './imageActions/localEditAction.js';
import { bindImageMattingAction } from './imageActions/mattingAction.js';
import { bindImageAutoSubjectAction } from './imageActions/autoSubjectAction.js';
import { bindImagePanorama360Action } from './imageActions/panorama360Action.js';
import { bindImageHdAction } from './imageActions/hdAction.js';
import { bindImageDepthAction } from './imageActions/depthImageAction.js';
import { bindApimartMidjourneyActions } from './imageActions/midjourneyAction.js';
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
  typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']();
function imageToolbarText(value, item = {}) {
  return t('nodeToolbar.image.' + value, item);
}
function createViewportSnapshotTracker() {
  let args = getStateSnapshot()['viewport'] || {},
    value2 =
      typeof appStore['subscribeSelector'] === 'function'
        ? appStore['subscribeSelector'](
            (key) => key['viewport'],
            (index) => {
              args = index || {};
            },
          )
        : null;
  return {
    openedViewport: { ...args },
    getViewport: () => args,
    dispose: () => {
      (value2?.(), (value2 = null));
    },
  };
}
const TOOLBAR_TASK_CANCELLED_MESSAGE = imageToolbarText('taskCancelled'),
  IMAGE_LOCAL_SAVE_FAILURE_MESSAGE = imageToolbarText('localSaveGeneratedFailed');
function createToolbarCancelledError() {
  const error = new Error(TOOLBAR_TASK_CANCELLED_MESSAGE);
  return ((error['name'] = 'AbortError'), error);
}
function isToolbarCancelledError(error2) {
  const result = String(error2?.['message'] || error2 || '');
  return (
    error2?.['name'] === 'AbortError' ||
    result === TOOLBAR_TASK_CANCELLED_MESSAGE ||
    result === 'CANCELLED' ||
    result['toLowerCase']()['includes']('aborted')
  );
}
function createLocalSaveFailureError() {
  const error3 = new Error(IMAGE_LOCAL_SAVE_FAILURE_MESSAGE);
  return ((error3['isLocalSaveFailure'] = !![]), error3);
}
function isLocalSaveFailure(error4) {
  return (
    error4?.['isLocalSaveFailure'] === !![] ||
    String(error4?.['message'] || error4 || '') === IMAGE_LOCAL_SAVE_FAILURE_MESSAGE
  );
}
function throwIfToolbarTaskCancelled(data) {
  if (isRunningHubToolbarTaskCancelled(data)) throw createToolbarCancelledError();
}
function selectToolbarTaskNode(options) {
  appStore['setSelectedNodes']([options]);
}
function notifyImageToolbarTaskChange({ sourceNodeId: sourceNodeId, targetNodeId: targetNodeId }) {
  (notifyRunningHubToolbarTasksChanged({ sourceNodeId: sourceNodeId, outId: targetNodeId }),
    window['_triggerLocalCacheSave']?.());
}
function buildClearedImageMediaFields() {
  return { imageUrl: '', sourceUrl: '', thumbUrl: '', src: '', localPath: '' };
}
export { IMAGE_TOOLBAR_HTML };
registerStaticInnerHTML('toolbar:image', IMAGE_TOOLBAR_HTML);
function getToolbarActionFromButton(el) {
  if (!el?.['classList']) return '';
  for (const list of el['classList']) {
    if (!list['startsWith']('act-')) continue;
    const target = list['slice'](0x4);
    if (IMAGE_TOOLBAR_ACTIONS['includes'](target)) return target;
  }
  return '';
}
export function bindImageToolbarEvents(toolbarEl, source) {
  if (!toolbarEl) return;
  const nodeId = typeof source === 'string' ? source : source?.['id'];
  if (!nodeId) return;
  const getNodeData = () =>
    getStateSnapshot()['nodes']?.[nodeId] || (typeof source === 'object' ? source : null);
  (toolbarEl['addEventListener']('pointerdown', (event) => event['stopPropagation']()),
    toolbarEl['addEventListener']('dblclick', (event2) => {
      (event2['preventDefault'](), event2['stopPropagation']());
    }));
  const closeToolbarMoreMenu = bindImageToolbarLayoutUi(toolbarEl, {
      store: appStore,
      getStateSnapshot: getStateSnapshot,
      imageToolbarActions: IMAGE_TOOLBAR_ACTIONS,
      normalizeImageToolbarLayout: normalizeImageToolbarLayout,
      serializeImageToolbarLayout: serializeImageToolbarLayout,
      getToolbarActionFromButton: getToolbarActionFromButton,
    }),
    _hdTaskMachine = createRunningHubTaskStateMachine(),
    _hdState = _hdTaskMachine['state'],
    next = {
      closeToolbarMoreMenu: closeToolbarMoreMenu['closeMoreMenu'],
      toolbarEl: toolbarEl,
      nodeId: nodeId,
      mediaKind: 'image',
      getNodeData: getNodeData,
      getStateSnapshot: getStateSnapshot,
      _hdTaskMachine: _hdTaskMachine,
      _hdState: _hdState,
      store: appStore,
      generateId: generateId,
      submitTask: submitTask,
      ImageCropController: ImageCropController,
      ImageAnnotateController: ImageAnnotateController,
      ImageExpandController: ImageExpandController,
      ImageMattingController: ImageMattingController,
      closeActiveImagePreview: closeActiveImagePreview,
      openNodeImagePreview: openNodeImagePreview,
      getImage: getImage,
      buildSourceMediaNodePayload: buildSourceMediaNodePayload,
      resolveCanvasImagePreviewUrl: resolveCanvasImagePreviewUrl,
      localPathToUrl: localPathToUrl,
      saveMediaFile: desktopBridge['nodeExport']['canSaveMedia']() ? saveMediaDownload : null,
      buildImageGenerationFailurePatch: buildImageGenerationFailurePatch,
      buildImageGenerationResultPatch: buildImageGenerationResultPatch,
      buildStoryboardNodePayload: buildStoryboardNodePayload,
      computePreparedStoryboardSize: computePreparedStoryboardSize,
      resolveNearestStoryboardAspect: resolveNearestStoryboardAspect,
      calcDisplaySizeByMedia: calcDisplaySizeByMedia,
      fetchRemoteBlob: fetchRemoteBlob,
      resumeRunningHubImageTask: resumeRunningHubImageTask,
      submitApimartMidjourneyUpscaleRequest: submitApimartMidjourneyUpscaleRequest,
      submitApimartMidjourneyVariationRequest: submitApimartMidjourneyVariationRequest,
      resumeApimartMidjourneyUpscaleTask: resumeApimartMidjourneyUpscaleTask,
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
      selectToolbarTaskNode: selectToolbarTaskNode,
      notifyImageToolbarTaskChange: notifyImageToolbarTaskChange,
      buildClearedImageMediaFields: buildClearedImageMediaFields,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
    };
  (bindPreviewUploadToolbarAction({ button: toolbarEl['querySelector']('.act-upload') }),
    bindImageLocalEditAction(next),
    bindImageMattingAction(next),
    bindImageAutoSubjectAction(next),
    bindImagePanorama360Action(next),
    bindApimartPrivateAvatarAction(next),
    bindImageHdAction(next),
    bindImageDepthAction(next),
    bindApimartMidjourneyActions(next),
    bindImageCropAction(next),
    bindImageExpandAction(next),
    bindImageAnnotateAction(next),
    bindImageFreeAngleAction(next),
    bindImageMultigridAction(next),
    bindImageDownloadAction(next),
    bindImageFullscreenAction(next),
    bindImageResetSizeAction(next));
}
