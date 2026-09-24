import assert from 'node:assert/strict';
import test from 'node:test';

function installWorkerHarness() {
  const listeners = new Map();
  const posts = [];
  globalThis.self = {
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    postMessage(message, transfer) {
      posts.push({ message, transfer });
    },
  };
  return { listeners, posts };
}

const harness = installWorkerHarness();
// Worker 入口在模块求值时读取 self，故必须先装桩件再动态导入。
await import('./modelGeometryImport.worker.js');

function dispatch(data) {
  const handler = harness.listeners.get('message');
  assert.equal(typeof handler, 'function');
  handler({ data });
  return harness.posts.splice(0, harness.posts.length);
}

function objBuffer(text) {
  return new TextEncoder().encode(text).buffer;
}

const TRIANGLE_OBJ = ['v 0 0 0', 'v 1 0 0', 'v 0 1 0', 'f 1 2 3'].join('\n');

test('几何 Worker：仅在模块求值时注册一次 message 监听', () => {
  assert.equal(harness.listeners.size, 1);
  assert.equal(typeof harness.listeners.get('message'), 'function');
});

test('几何 Worker：非 parse 消息与空事件被忽略', () => {
  assert.deepEqual(dispatch({ type: 'ping' }), []);
  assert.deepEqual(dispatch({ type: undefined }), []);
  assert.deepEqual(dispatch(undefined), []);
});

test('几何 Worker：OBJ 解析回传结果与可转移缓冲', () => {
  const posts = dispatch({
    type: 'parse',
    requestId: 'req-1',
    format: 'obj',
    name: 'triangle.obj',
    buffer: objBuffer(TRIANGLE_OBJ),
  });
  const progress = posts.filter((entry) => entry.message.type === 'progress');
  assert.deepEqual(
    progress.map((entry) => entry.message.progress),
    [0.08, 1],
  );
  assert.deepEqual(
    progress.map((entry) => entry.message.requestId),
    ['req-1', 'req-1'],
  );

  const [result] = posts.filter((entry) => entry.message.type === 'result');
  assert.ok(result);
  assert.equal(result.message.requestId, 'req-1');
  assert.equal(result.message.payload.format, 'obj');
  assert.equal(result.message.payload.name, 'triangle');
  assert.equal(result.message.payload.triangleCount, 1);
  assert.equal(result.message.payload.meshes.length, 1);
  assert.equal(result.message.payload.meshes[0].triangleCount, 1);
  assert.deepEqual(Object.keys(result.message.payload.meshes[0].attributes), ['position']);
  assert.equal(result.message.payload.meshes[0].attributes.position.itemSize, 3);
  assert.equal(result.message.payload.meshes[0].attributes.position.count, 3);
  assert.deepEqual(result.message.payload.bounds.min, { x: 0, y: 0, z: 0 });
  assert.deepEqual(result.message.payload.bounds.max, { x: 1, y: 1, z: 0 });

  assert.equal(result.transfer.length, 1);
  assert.ok(result.transfer[0] instanceof ArrayBuffer);
  assert.equal(result.transfer[0].byteLength, 36);
});

test('几何 Worker：不支持的格式以固定码回报错误', () => {
  const posts = dispatch({ type: 'parse', requestId: 'req-2', format: 'fbx', buffer: objBuffer('x') });
  assert.equal(posts.length, 1);
  assert.equal(posts[0].message.type, 'error');
  assert.equal(posts[0].message.requestId, 'req-2');
  assert.equal(posts[0].message.error.code, 'MODEL_WORKER_PARSE_FAILED');
  assert.match(posts[0].message.error.message, /does not support FBX\./);
  assert.equal(posts[0].message.error.name, 'Error');
});

test('几何 Worker：非 ArrayBuffer 输入回报 TypeError 信息', () => {
  const posts = dispatch({ type: 'parse', requestId: 'req-3', format: 'obj', buffer: 'not-a-buffer' });
  assert.equal(posts.length, 1);
  assert.equal(posts[0].message.type, 'error');
  assert.equal(posts[0].message.error.name, 'TypeError');
  assert.match(posts[0].message.error.message, /requires an ArrayBuffer/);
  assert.equal(posts[0].message.error.code, 'MODEL_WORKER_PARSE_FAILED');
});

test('几何 Worker：无三角面的 OBJ 回报解析错误', () => {
  const posts = dispatch({
    type: 'parse',
    requestId: 'req-4',
    format: 'obj',
    buffer: objBuffer('v 0 0 0\nv 1 0 0\n'),
  });
  const [error] = posts.filter((entry) => entry.message.type === 'error');
  assert.ok(error);
  assert.match(error.message.error.message, /did not contain any triangle faces/);
  assert.equal(error.message.requestId, 'req-4');
});

test('几何 Worker：STL 二进制通道回传三角面计数', () => {
  const faces = 1;
  const bytes = new Uint8Array(0x54 + faces * 0x32);
  const view = new DataView(bytes.buffer);
  view.setUint32(0x50, faces, true);
  const posts = dispatch({
    type: 'parse',
    requestId: 'req-5',
    format: 'stl',
    name: 'facet.stl',
    buffer: bytes.buffer,
  });
  const [result] = posts.filter((entry) => entry.message.type === 'result');
  assert.ok(result);
  assert.equal(result.message.payload.format, 'stl');
  assert.equal(result.message.payload.triangleCount, 1);
  // 二进制 STL 同时携带位置与法线，两个缓冲都可转移。
  assert.equal(result.transfer.length, 2);
});
