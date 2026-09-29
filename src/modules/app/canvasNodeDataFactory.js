import { createDefaultCommentNoteStyle } from '../../components/commentNoteStyle.js';
import { createEmptyStoryboardNodeData } from '../../core/storyboardFactory.js';
import { createStoryboardScriptNodeData } from '../../core/storyboardScriptFactory.js';
import { t } from '../../i18n/index.js';
import { createEmptyCollageNodeData } from '../collage/collageFactory.js';
import { createPanorama360NodeData, createPanoramaSceneNodeData } from '../panoramaSceneNode/sceneNode.js';
import { createWhiteboardNodeData } from '../whiteboard/whiteboardNodeData.js';
import { buildSourceMediaNodePayload, getAIGenerationNodeSize } from '../../services/fileService.js';
export function buildAppCanvasNodeData({
  id: _0x6e813c,
  type: _0x5561e3,
  x: _0x2c7322,
  y: _0x320975,
  width: _0x9b965f,
  height: _0x3e8a2a,
  name: _0x53a533,
  extra: extra = {},
  ..._0x29fb55
}) {
  if (_0x5561e3 === 'panorama-scene')
    return createPanoramaSceneNodeData({
      id: _0x6e813c,
      x: _0x2c7322,
      y: _0x320975,
      width: _0x9b965f,
      height: _0x3e8a2a,
      name: _0x53a533,
    });
  if (_0x5561e3 === 'panorama-360')
    return createPanorama360NodeData({
      id: _0x6e813c,
      x: _0x2c7322,
      y: _0x320975,
      width: _0x9b965f,
      height: _0x3e8a2a,
      name: _0x53a533,
    });
  if (_0x5561e3 === 'storyboard-script')
    return createStoryboardScriptNodeData({
      id: _0x6e813c,
      x: _0x2c7322,
      y: _0x320975,
      width: _0x9b965f,
      height: _0x3e8a2a,
      name: _0x53a533,
    });
  if (_0x5561e3 === 'storyboard')
    return createEmptyStoryboardNodeData({
      id: _0x6e813c,
      x: _0x2c7322,
      y: _0x320975,
      width: _0x9b965f,
      height: _0x3e8a2a,
      name: _0x53a533,
    });
  if (_0x5561e3 === 'collage')
    return createEmptyCollageNodeData({
      id: _0x6e813c,
      x: _0x2c7322,
      y: _0x320975,
      width: _0x9b965f,
      height: _0x3e8a2a,
      name: _0x53a533 || t('canvasInteraction.grids.collageName'),
    });
  if (_0x5561e3 === 'whiteboard')
    return createWhiteboardNodeData({
      id: _0x6e813c,
      x: _0x2c7322,
      y: _0x320975,
      width: _0x9b965f,
      height: _0x3e8a2a,
      name: _0x53a533 || t('nodeCreation.items.whiteboard.defaultName'),
    });
  if (_0x5561e3 === 'comment-note')
    return {
      id: _0x6e813c,
      type: _0x5561e3,
      x: _0x2c7322,
      y: _0x320975,
      width: _0x9b965f,
      height: _0x3e8a2a,
      name: '',
      content: '',
      style: createDefaultCommentNoteStyle(),
      ...extra,
    };
  const _0x199b1d = {
    id: _0x6e813c,
    type: _0x5561e3,
    x: _0x2c7322,
    y: _0x320975,
    width: _0x9b965f,
    height: _0x3e8a2a,
    name: _0x53a533,
    ..._0x29fb55,
    ...extra,
  };
  (_0x5561e3 === 'ai-image' || _0x5561e3 === 'ai-video') &&
    !Object['prototype']['hasOwnProperty']['call'](_0x199b1d, 'aspectRatio') &&
    (_0x199b1d['aspectRatio'] = '自适应');
  if (_0x5561e3 === 'ai-image' || _0x5561e3 === 'ai-video') {
    const _0x43984e = getAIGenerationNodeSize(_0x9b965f, _0x3e8a2a);
    ((_0x199b1d['width'] = _0x43984e['width']), (_0x199b1d['height'] = _0x43984e['height']));
  }
  if (_0x5561e3 === 'source-image' || _0x5561e3 === 'source-video')
    return buildSourceMediaNodePayload(_0x199b1d);
  return _0x199b1d;
}
