import { createDefaultCommentNoteStyle } from '../../components/commentNoteStyle.js';
import { createEmptyStoryboardNodeData } from '../../core/storyboardFactory.js';
import { createStoryboardScriptNodeData } from '../../core/storyboardScriptFactory.js';
import { t } from '../../i18n/index.js';
import { createEmptyCollageNodeData } from '../collage/collageFactory.js';
import { createPanorama360NodeData, createPanoramaSceneNodeData } from '../panoramaSceneNode/sceneNode.js';
import { createWhiteboardNodeData } from '../whiteboard/whiteboardNodeData.js';
import { buildSourceMediaNodePayload, getAIGenerationNodeSize } from '../../services/fileService.js';
export function buildAppCanvasNodeData({
  id: id,
  type: type,
  x: x,
  y: y,
  width: width,
  height: height,
  name: name,
  extra: extra = {},
  ...args
}) {
  if (type === 'panorama-scene')
    return createPanoramaSceneNodeData({
      id: id,
      x: x,
      y: y,
      width: width,
      height: height,
      name: name,
    });
  if (type === 'panorama-360')
    return createPanorama360NodeData({
      id: id,
      x: x,
      y: y,
      width: width,
      height: height,
      name: name,
    });
  if (type === 'storyboard-script')
    return createStoryboardScriptNodeData({
      id: id,
      x: x,
      y: y,
      width: width,
      height: height,
      name: name,
    });
  if (type === 'storyboard')
    return createEmptyStoryboardNodeData({
      id: id,
      x: x,
      y: y,
      width: width,
      height: height,
      name: name,
    });
  if (type === 'collage')
    return createEmptyCollageNodeData({
      id: id,
      x: x,
      y: y,
      width: width,
      height: height,
      name: name || t('canvasInteraction.grids.collageName'),
    });
  if (type === 'whiteboard')
    return createWhiteboardNodeData({
      id: id,
      x: x,
      y: y,
      width: width,
      height: height,
      name: name || t('nodeCreation.items.whiteboard.defaultName'),
    });
  if (type === 'comment-note')
    return {
      id: id,
      type: type,
      x: x,
      y: y,
      width: width,
      height: height,
      name: '',
      content: '',
      style: createDefaultCommentNoteStyle(),
      ...extra,
    };
  const box = {
    id: id,
    type: type,
    x: x,
    y: y,
    width: width,
    height: height,
    name: name,
    ...args,
    ...extra,
  };
  (type === 'ai-image' || type === 'ai-video') &&
    !Object['prototype']['hasOwnProperty']['call'](box, 'aspectRatio') &&
    (box['aspectRatio'] = '自适应');
  if (type === 'ai-image' || type === 'ai-video') {
    const box2 = getAIGenerationNodeSize(width, height);
    ((box['width'] = box2['width']), (box['height'] = box2['height']));
  }
  if (type === 'source-image' || type === 'source-video') return buildSourceMediaNodePayload(box);
  return box;
}
