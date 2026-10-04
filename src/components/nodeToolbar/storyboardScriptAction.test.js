import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createConnectedStoryboardScriptNode,
  VIDEO_STORYBOARD_SCRIPT_DEFAULT_PROMPT,
} from './storyboardScriptAction.js';
import { STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG } from './storyboardScriptToolbarIcon.js';
function createFakeStore(nodes) {
  const edges = [];
  let value = [];
  return {
    edges: edges,
    get selectedNodeIds() {
      return value;
    },
    getStateRaw() {
      return { nodes: nodes };
    },
    addNode(item) {
      nodes[item.id] = item;
    },
    deleteNodes(key) {
      for (const index of key) delete nodes[index];
    },
    setSelectedNodes(result) {
      value = result;
    },
  };
}
(test('storyboardScriptAction: creates and connects a storyboard script node', () => {
  const data = {
      'source-text-1': {
        id: 'source-text-1',
        type: 'source-text',
        x: 10,
        y: 20,
        width: 0x104,
        height: 120,
        content: 'story',
      },
    },
    storeInstance = createFakeStore(data);
  let options = 0;
  const connectedStoryboardScriptNode = createConnectedStoryboardScriptNode({
    sourceNodeId: 'source-text-1',
    storeInstance: storeInstance,
    generateId: () => 'storyboard-script-1',
    calcSafeSpawnPosNearNode: () => ({ x: 0x190, y: 20 }),
    isValidConnectionFn: () => true,
    addEdgeWithPolicies: ({ sourceId: sourceId, targetId: targetId }) => {
      return (storeInstance.edges.push({ sourceId: sourceId, targetId: targetId }), true);
    },
    commit: () => {
      options += 1;
    },
  });
  (assert.deepEqual(connectedStoryboardScriptNode, { ok: true, nodeId: 'storyboard-script-1' }),
    assert.equal(data['storyboard-script-1'].type, 'storyboard-script'),
    assert.equal(data['storyboard-script-1'].name, '分镜脚本'),
    assert.deepEqual(storeInstance.edges, [{ sourceId: 'source-text-1', targetId: 'storyboard-script-1' }]),
    assert.deepEqual(storeInstance.selectedNodeIds, ['storyboard-script-1']),
    assert.equal(options, 1));
}),
  test('storyboardScriptAction: does not create node when connection is invalid', () => {
    const target = {
        'source-video-1': {
          id: 'source-video-1',
          type: 'source-video',
          x: 0,
          y: 0,
          width: 0x12c,
          height: 180,
        },
      },
      storeInstance2 = createFakeStore(target),
      connectedStoryboardScriptNode2 = createConnectedStoryboardScriptNode({
        sourceNodeId: 'source-video-1',
        storeInstance: storeInstance2,
        generateId: () => 'storyboard-script-2',
        calcSafeSpawnPosNearNode: () => ({ x: 0x1a4, y: 0 }),
        isValidConnectionFn: () => false,
        addEdgeWithPolicies: () => {
          throw new Error('should not connect');
        },
        commit: () => {
          throw new Error('should not commit');
        },
      });
    (assert.deepEqual(connectedStoryboardScriptNode2, { ok: false, reason: 'invalid-connection' }),
      assert.equal(target['storyboard-script-2'], undefined));
  }),
  test('storyboardScriptAction: video source seeds default storyboard prompt', () => {
    const source = {
        'source-video-1': {
          id: 'source-video-1',
          type: 'source-video',
          x: 0,
          y: 0,
          width: 0x12c,
          height: 180,
          localPath: 'outputs/video.mp4',
        },
      },
      storeInstance3 = createFakeStore(source),
      response = createConnectedStoryboardScriptNode({
        sourceNodeId: 'source-video-1',
        storeInstance: storeInstance3,
        generateId: () => 'storyboard-script-video',
        calcSafeSpawnPosNearNode: () => ({ x: 0x1a4, y: 0 }),
        isValidConnectionFn: () => true,
        addEdgeWithPolicies: ({ sourceId: sourceId2, targetId: targetId2 }) => {
          return (storeInstance3.edges.push({ sourceId: sourceId2, targetId: targetId2 }), true);
        },
        commit: () => {},
      });
    (assert.equal(response.ok, true),
      assert.equal(source['storyboard-script-video'].prompt, VIDEO_STORYBOARD_SCRIPT_DEFAULT_PROMPT),
      assert.equal(
        source['storyboard-script-video'].storyboardScript.prompt,
        VIDEO_STORYBOARD_SCRIPT_DEFAULT_PROMPT,
      ),
      assert.equal(source['storyboard-script-video'].storyboardScript.sourceMode, 'video'));
  }),
  test('storyboardScriptAction: toolbar icon uses storyboard table glyph', () => {
    (assert.match(STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG, /<rect x="3" y="4"/),
      assert.match(STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG, /<path d="M3 9h18"/),
      assert.match(STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG, /<path d="M8 4v16"/));
  }));
