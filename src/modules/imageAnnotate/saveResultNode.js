import { buildGenerationStartPatch } from '../../core/generationTaskLifecycle.js';
import {
  addToolbarPendingResultNodes,
  persistToolbarResultNodes,
  updateToolbarResultNode,
} from '../toolbarPendingResultNodes.js';
import { buildCanvasLocalImageFields } from '../../services/canvasMediaLocalService.js';
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
} from '../../components/aigenImage/imageGenerationResultRenderer.js';
import appStore from '../../core/stores/appStore.js';
import { generateId } from '../../core/math.js';
import { commit } from '../history.js';
import { calcSafeSpawnPosNearNode } from '../nodeSpawn.js';
import { saveOutputBlob } from '../project.js';
import { buildSourceMediaNodePayload } from '../../services/fileService.js';
import { localPathToUrl, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { t } from '../../i18n/index.js';
function imageAnnotateOutputText(value, item = {}) {
  return t('imageAnnotate.output.' + value, item);
}
export const getSavedAnnotateNodeName = (key, index) => {
  const baseName = index || imageAnnotateOutputText('baseImage');
  if (key === 'repaint') return imageAnnotateOutputText('repaintName', { baseName: baseName });
  if (key === 'erase') return imageAnnotateOutputText('eraseName', { baseName: baseName });
  return imageAnnotateOutputText('annotateName', { baseName: baseName });
};
export const getSavedAnnotateSuccessLabel = (result) => {
  if (result === 'repaint') return imageAnnotateOutputText('repaintCreated');
  if (result === 'erase') return imageAnnotateOutputText('eraseCreated');
  return imageAnnotateOutputText('annotateCreated');
};
export const saveAnnotateExportResult = async ({
  blob: blob,
  exportType: exportType,
  scene: scene,
  sourceNodeId: sourceNodeId,
  baseNode: baseNode,
  notify: notify = (data, options) => window.showToast?.(data, options),
  triggerLocalCacheSave: triggerLocalCacheSave = () => window._triggerLocalCacheSave?.(),
} = {}) => {
  const ext = exportType === 'image/png' ? 'png' : 'jpg',
    generateId2 = generateId('annotate'),
    error = new File([blob], 'annotate_' + generateId2 + '.' + ext, { type: exportType }),
    fileName = await saveOutputBlob(error, { ext: ext }),
    localPath = pickResultLocalPath(fileName),
    src = localPathToUrl(localPath) || String(fileName.url || '').trim(),
    target = appStore.getState().nodes?.[sourceNodeId],
    box = target || baseNode || {},
    width = box.width || 0x104,
    height = box.height || 0x104,
    x = calcSafeSpawnPosNearNode(appStore.getState().nodes, box, width, height),
    id = generateId('source-image');
  return (
    appStore.addNode(
      buildSourceMediaNodePayload({
        id: id,
        type: 'source-image',
        x: x.x,
        y: x.y,
        width: width,
        height: height,
        name: getSavedAnnotateNodeName(scene, box.name),
        src: src,
        localPath: localPath,
        fileName: fileName.filename || error.name,
        fixedSize: true,
        needsAutoResize: false,
      }),
    ),
    appStore.setSelectedNodes([id]),
    commit(),
    window.v2FocusOnNodes && window.v2FocusOnNodes([sourceNodeId, id]),
    triggerLocalCacheSave(),
    notify(getSavedAnnotateSuccessLabel(scene), 'success'),
    { newNodeId: id, localPath: localPath, srcUrl: src, response: fileName }
  );
};

function imageAnnotateActionText(source, next = {}) {
  return t('imageAnnotate.actions.' + source, next);
}

function resolveAnnotateResultBaseNode(current, entry) {
  return appStore['getState']()['nodes']?.[current] || entry || {};
}

function resolveAnnotateResultLayout(record, payload, handle) {
  const annotateResultBaseNode = resolveAnnotateResultBaseNode(record, payload),
    state = handle?.['width'] || annotateResultBaseNode['width'] || 0x104,
    config = handle?.['height'] || annotateResultBaseNode['height'] || 0x104,
    box2 = calcSafeSpawnPosNearNode(appStore['getState']()['nodes'], annotateResultBaseNode, state, config);
  return { baseNode: annotateResultBaseNode, width: state, height: config, x: box2['x'], y: box2['y'] };
}

export const createPendingAnnotateExportNode = ({
  scene: scene2,
  sourceNodeId: sourceNodeId2,
  baseNode: baseNode2,
  startedAt: startedAt = Date['now'](),
  outputSize: outputSize,
} = {}) => {
  const box3 = resolveAnnotateResultLayout(sourceNodeId2, baseNode2, outputSize),
    generateId3 = generateId('source-image'),
    sourceMediaNodePayload = buildSourceMediaNodePayload({
      id: generateId3,
      type: 'source-image',
      x: box3['x'],
      y: box3['y'],
      width: box3['width'],
      height: box3['height'],
      name: getSavedAnnotateNodeName(scene2, box3['baseNode']['name']),
      src: '',
      outputText: imageAnnotateActionText('saving'),
      ...buildGenerationStartPatch({ startedAt: startedAt }),
      fixedSize: !![],
      needsAutoResize: ![],
    });
  return (
    addToolbarPendingResultNodes({ nodes: [sourceMediaNodePayload] }),
    { newNodeId: generateId3, baseNode: box3['baseNode'], startedAt: startedAt }
  );
};

function buildSavedAnnotateResultPatch({
  scene: scene3,
  baseNode: baseNode3,
  saveResult: saveResult,
  fileName: fileName2,
  startedAt: startedAt = 0x0,
}) {
  const resultLocalPath = pickResultLocalPath(saveResult),
    args = buildCanvasLocalImageFields(
      {
        ...saveResult,
        localPath: resultLocalPath,
        imageUrl:
          saveResult?.['displayUrl'] ||
          saveResult?.['thumbUrl'] ||
          localPathToUrl(resultLocalPath) ||
          String(saveResult?.['url'] || '')['trim'](),
        sourceUrl: saveResult?.['originalUrl'] || saveResult?.['url'] || localPathToUrl(resultLocalPath),
        thumbUrl: saveResult?.['thumbUrl'],
        fileName: fileName2,
      },
      { includeSrc: !![] },
    ),
    scope =
      args['src'] ||
      args['imageUrl'] ||
      localPathToUrl(resultLocalPath) ||
      String(saveResult?.['url'] || '')['trim'](),
    args2 =
      buildImageGenerationResultPatch(
        {
          ...saveResult,
          ...args,
          imageUrl: args['imageUrl'] || scope,
          sourceUrl: args['sourceUrl'] || scope,
          thumbUrl: args['thumbUrl'] || scope,
          localPath: args['localPath'] || resultLocalPath,
          fileName: fileName2,
        },
        { startedAt: startedAt },
      ) || {};
  return {
    name: getSavedAnnotateNodeName(scene3, baseNode3?.['name']),
    ...args2,
    ...args,
    src: scope,
    localPath: args['localPath'] || resultLocalPath,
    fileName: fileName2,
    outputText: '',
    fixedSize: !![],
    needsAutoResize: ![],
  };
}

export const markAnnotateExportNodeFailed = ({
  targetNodeId: targetNodeId,
  error: error2,
  startedAt: startedAt = 0x0,
} = {}) => {
  const enabled = String(targetNodeId || '')['trim']();
  if (!enabled) return ![];
  const updateToolbarResultNode2 = updateToolbarResultNode(
    enabled,
    buildImageGenerationFailurePatch({
      error: error2 instanceof Error ? error2['message'] : String(error2 || ''),
      startedAt: startedAt,
    }) || {},
  );
  if (updateToolbarResultNode2) persistToolbarResultNodes();
  return updateToolbarResultNode2;
};
