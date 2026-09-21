import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createConnectedStoryboardScriptNode,
  VIDEO_STORYBOARD_SCRIPT_DEFAULT_PROMPT,
} from './storyboardScriptAction.js';
import { STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG } from './storyboardScriptToolbarIcon.js';
function createFakeStore(_0x390677) {
  const _0x423e63 = [];
  let _0x1f0e88 = [];
  return {
    edges: _0x423e63,
    get selectedNodeIds() {
      return _0x1f0e88;
    },
    getStateRaw() {
      return { nodes: _0x390677 };
    },
    addNode(_0x21702d) {
      _0x390677[_0x21702d.id] = _0x21702d;
    },
    deleteNodes(_0x50c494) {
      for (const _0x510428 of _0x50c494) delete _0x390677[_0x510428];
    },
    setSelectedNodes(_0x58482e) {
      _0x1f0e88 = _0x58482e;
    },
  };
}
(test('storyboardScriptAction: creates and connects a storyboard script node', () => {
  const _0x4133fb = {
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
    _0x2a2e26 = createFakeStore(_0x4133fb);
  let _0x1f4c1a = 0;
  const _0x4bb8e3 = createConnectedStoryboardScriptNode({
    sourceNodeId: 'source-text-1',
    storeInstance: _0x2a2e26,
    generateId: () => 'storyboard-script-1',
    calcSafeSpawnPosNearNode: () => ({ x: 0x190, y: 20 }),
    isValidConnectionFn: () => true,
    addEdgeWithPolicies: ({ sourceId: _0x3263ae, targetId: _0x7ab332 }) => {
      return (_0x2a2e26.edges.push({ sourceId: _0x3263ae, targetId: _0x7ab332 }), true);
    },
    commit: () => {
      _0x1f4c1a += 1;
    },
  });
  (assert.deepEqual(_0x4bb8e3, { ok: true, nodeId: 'storyboard-script-1' }),
    assert.equal(_0x4133fb['storyboard-script-1'].type, 'storyboard-script'),
    assert.equal(_0x4133fb['storyboard-script-1'].name, '分镜脚本'),
    assert.deepEqual(_0x2a2e26.edges, [{ sourceId: 'source-text-1', targetId: 'storyboard-script-1' }]),
    assert.deepEqual(_0x2a2e26.selectedNodeIds, ['storyboard-script-1']),
    assert.equal(_0x1f4c1a, 1));
}),
  test('storyboardScriptAction: does not create node when connection is invalid', () => {
    const _0x20c459 = {
        'source-video-1': {
          id: 'source-video-1',
          type: 'source-video',
          x: 0,
          y: 0,
          width: 0x12c,
          height: 180,
        },
      },
      _0x3912d7 = createFakeStore(_0x20c459),
      _0x565f91 = createConnectedStoryboardScriptNode({
        sourceNodeId: 'source-video-1',
        storeInstance: _0x3912d7,
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
    (assert.deepEqual(_0x565f91, { ok: false, reason: 'invalid-connection' }),
      assert.equal(_0x20c459['storyboard-script-2'], undefined));
  }),
  test('storyboardScriptAction: video source seeds default storyboard prompt', () => {
    const _0x4ee297 = {
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
      _0x4eed30 = createFakeStore(_0x4ee297),
      _0x11c0a5 = createConnectedStoryboardScriptNode({
        sourceNodeId: 'source-video-1',
        storeInstance: _0x4eed30,
        generateId: () => 'storyboard-script-video',
        calcSafeSpawnPosNearNode: () => ({ x: 0x1a4, y: 0 }),
        isValidConnectionFn: () => true,
        addEdgeWithPolicies: ({ sourceId: _0x1c3fc2, targetId: _0xa86b4c }) => {
          return (_0x4eed30.edges.push({ sourceId: _0x1c3fc2, targetId: _0xa86b4c }), true);
        },
        commit: () => {},
      });
    (assert.equal(_0x11c0a5.ok, true),
      assert.equal(_0x4ee297['storyboard-script-video'].prompt, VIDEO_STORYBOARD_SCRIPT_DEFAULT_PROMPT),
      assert.equal(
        _0x4ee297['storyboard-script-video'].storyboardScript.prompt,
        VIDEO_STORYBOARD_SCRIPT_DEFAULT_PROMPT,
      ),
      assert.equal(_0x4ee297['storyboard-script-video'].storyboardScript.sourceMode, 'video'));
  }),
  test('storyboardScriptAction: toolbar icon uses storyboard table glyph', () => {
    (assert.match(STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG, /<rect x="3" y="4"/),
      assert.match(STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG, /<path d="M3 9h18"/),
      assert.match(STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG, /<path d="M8 4v16"/));
  }));
