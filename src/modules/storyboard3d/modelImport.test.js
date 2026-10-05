import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES as ADAPTER_CAPABILITIES,
  getStoryboard3DModelImportCapability as adapterCapability,
} from './gltfImportAdapter.js';
import {
  DEFAULT_MODEL_IMPORT_MAX_BYTES,
  STORYBOARD_3D_MODEL_ACCEPT,
  STORYBOARD_3D_MODEL_FORMATS,
  STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES,
  STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY,
  createStoryboard3DModelNormalizationPlan,
  createStoryboard3DModelResourceMap,
  detectStoryboard3DModelFormat,
  getStoryboard3DModelImportCapability,
  importStoryboard3DModelFile,
  inspectStoryboard3DModelFile,
  pickStoryboard3DModelFiles,
  readStoryboard3DModelNormalization,
  setStoryboard3DModelNormalization,
  validateStoryboard3DModelSource,
} from './modelImport.js';

const BOUNDS = { min: { x: 0, y: 0, z: 0 }, max: { x: 2, y: 1, z: 4 } };

function bytesFile(text, { name, type }) {
  const data = new TextEncoder().encode(text);
  return { name, type, size: data.length, arrayBuffer: async () => data.buffer };
}

function glbFile(json = { asset: { version: '2.0' } }, { name = 'x.glb', type = 'model/gltf-binary' } = {}) {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const pad = (4 - (jsonBytes.length % 4)) % 4;
  const chunk = new Uint8Array(jsonBytes.length + pad);
  chunk.set(jsonBytes);
  chunk.fill(32, jsonBytes.length);
  const total = 12 + 8 + chunk.length;
  const bytes = new Uint8Array(total);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  view.setUint32(12, chunk.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(chunk, 20);
  return { name, type, size: bytes.length, arrayBuffer: async () => bytes.buffer };
}

test('模型导入：格式表与接受串冻结并复用适配器能力表', () => {
  assert.deepEqual(STORYBOARD_3D_MODEL_FORMATS, ['glb', 'gltf', 'fbx', 'obj', 'stl']);
  assert.equal(Object.isFrozen(STORYBOARD_3D_MODEL_FORMATS), true);
  assert.equal(STORYBOARD_3D_MODEL_ACCEPT, '.glb,.gltf,.fbx,.obj,.stl');
  assert.equal(DEFAULT_MODEL_IMPORT_MAX_BYTES, 256 * 1024 * 1024);
  assert.equal(STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES, ADAPTER_CAPABILITIES);
  assert.equal(getStoryboard3DModelImportCapability, adapterCapability);
  assert.equal(getStoryboard3DModelImportCapability('stl').parserId, 'stl');
});

test('模型导入：格式探测优先扩展名并回退唯一 mime', () => {
  assert.equal(detectStoryboard3DModelFormat({ name: 'A.GLB' }), 'glb');
  assert.equal(detectStoryboard3DModelFormat({ name: '  model.Gltf ' }), 'gltf');
  assert.equal(detectStoryboard3DModelFormat({ fileName: 'x.FBX' }), 'fbx');
  assert.equal(detectStoryboard3DModelFormat({ name: 'x.unknown', type: 'model/gltf-binary' }), 'glb');
  assert.equal(detectStoryboard3DModelFormat({ name: 'x.unknown', type: 'model/stl' }), 'stl');
  assert.equal(detectStoryboard3DModelFormat({ name: 'x.unknown', type: 'application/octet-stream' }), '');
  assert.equal(detectStoryboard3DModelFormat({}), '');
  assert.equal(detectStoryboard3DModelFormat(null), '');
});

test('模型导入：来源校验收集全部错误', () => {
  const ok = validateStoryboard3DModelSource(glbFile());
  assert.equal(ok.ok, true);
  assert.equal(ok.format, 'glb');
  assert.deepEqual(ok.errors, []);

  const missing = validateStoryboard3DModelSource({ name: '   ', size: 10, arrayBuffer: async () => null });
  assert.equal(missing.ok, false);
  assert.deepEqual(
    missing.errors.map((error) => error.code),
    ['MODEL_FILE_NAME_REQUIRED', 'MODEL_FORMAT_UNSUPPORTED'],
  );

  const empty = validateStoryboard3DModelSource({ name: 'a.glb', size: 0, arrayBuffer: async () => null });
  assert.deepEqual(
    empty.errors.map((error) => error.code),
    ['MODEL_FILE_EMPTY'],
  );

  const unreadable = validateStoryboard3DModelSource({ name: 'a.glb', size: 10 });
  assert.deepEqual(
    unreadable.errors.map((error) => error.code),
    ['MODEL_FILE_UNREADABLE'],
  );

  const tooLarge = validateStoryboard3DModelSource(
    { name: 'a.glb', size: 3 * 1024 * 1024, arrayBuffer: async () => null },
    { maxBytes: 2 * 1024 * 1024 },
  );
  assert.equal(tooLarge.errors.length, 1);
  assert.equal(tooLarge.errors[0].code, 'MODEL_FILE_TOO_LARGE');
  assert.match(tooLarge.errors[0].message, /不能超过 2 MB/);
});

test('模型导入：内容嗅探识别 GLB 头与版本', async () => {
  const ok = await inspectStoryboard3DModelFile(glbFile());
  assert.equal(ok.ok, true);
  assert.equal(ok.format, 'glb');
  assert.equal(ok.parserId, 'gltf');
  assert.equal(ok.byteLength, glbFile().size);

  const short = await inspectStoryboard3DModelFile({
    name: 'x.glb',
    type: 'model/gltf-binary',
    size: 4,
    arrayBuffer: async () => new Uint8Array([0, 1, 2, 3]).buffer,
  });
  assert.equal(short.ok, false);
  assert.equal(short.errors[0].code, 'MODEL_CONTENT_INVALID');
  assert.match(short.errors[0].message, /不是有效的 GLB 模型/);

  const oldVersion = await inspectStoryboard3DModelFile(
    glbFile({ asset: { version: '1.0' } }, { name: 'old.glb' }),
  );
  assert.equal(oldVersion.ok, false);
  assert.equal(oldVersion.errors[0].code, 'MODEL_CONTENT_INVALID');
});

test('模型导入：内容嗅探识别 glTF/OBJ/FBX/STL', async () => {
  const gltf = await inspectStoryboard3DModelFile(
    bytesFile('{"asset":{"version":"2.0"}}', { name: 'a.gltf', type: 'model/gltf+json' }),
  );
  assert.equal(gltf.ok, true);
  assert.equal(gltf.parserId, 'gltf');
  const badGltf = await inspectStoryboard3DModelFile(
    bytesFile('{"asset":{"version":"1.0"}}', { name: 'a.gltf', type: 'model/gltf+json' }),
  );
  assert.equal(badGltf.ok, false);

  const obj = await inspectStoryboard3DModelFile(
    bytesFile('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n', { name: 'a.obj', type: 'text/plain' }),
  );
  assert.equal(obj.ok, true);
  assert.equal(obj.parserId, 'obj');
  const badObj = await inspectStoryboard3DModelFile(
    bytesFile('o cube\n', { name: 'a.obj', type: 'text/plain' }),
  );
  assert.equal(badObj.ok, false);
  assert.match(badObj.errors[0].message, /不是有效的 OBJ 模型/);

  const fbx = await inspectStoryboard3DModelFile(
    bytesFile('Kaydara FBX Binary  \x00\x1a\x00', { name: 'a.fbx', type: 'application/octet-stream' }),
  );
  assert.equal(fbx.ok, true);
  assert.equal(fbx.parserId, 'fbx');
  const fbxHeader = await inspectStoryboard3DModelFile(
    bytesFile('FBXHeaderExtension: {}', { name: 'b.fbx', type: 'application/octet-stream' }),
  );
  assert.equal(fbxHeader.ok, true);

  const stl = await inspectStoryboard3DModelFile(
    bytesFile('solid cube\nfacet normal 0 0 1\nouter loop\nendloop\nendfacet\nendsolid\n', {
      name: 'a.stl',
      type: 'model/stl',
    }),
  );
  assert.equal(stl.ok, true);
  assert.equal(stl.parserId, 'stl');
  const badStl = await inspectStoryboard3DModelFile(
    bytesFile('not a mesh', { name: 'a.stl', type: 'model/stl' }),
  );
  assert.equal(badStl.ok, false);
});

test('模型导入：内容非法时返回统一错误结构', async () => {
  const result = await inspectStoryboard3DModelFile({
    name: 'x.glb',
    type: 'model/gltf-binary',
    size: 0,
    arrayBuffer: async () => new ArrayBuffer(0),
  });
  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((error) => error.code),
    ['MODEL_FILE_EMPTY'],
  );
});

test('模型导入：归一化计划与附加数据读写', () => {
  assert.deepEqual(createStoryboard3DModelNormalizationPlan(null), {
    status: 'awaiting-bounds',
    targetSize: 2,
    operations: ['measure-bounds', 'uniform-scale', 'center-xz', 'place-on-ground'],
  });

  const plan = createStoryboard3DModelNormalizationPlan(BOUNDS);
  assert.equal(plan.status, 'ready');
  assert.equal(plan.targetSize, 2);
  assert.equal(plan.uniformScale, 0.5);
  assert.deepEqual(plan.translation, { x: -0.5, y: 0, z: -1 });
  assert.deepEqual(plan.operations, ['uniform-scale', 'center-xz', 'place-on-ground']);
  assert.deepEqual(plan.sourceBounds.size, { x: 2, y: 1, z: 4 });

  assert.equal(createStoryboard3DModelNormalizationPlan(BOUNDS, { targetSize: 5 }).uniformScale, 1.25);
  assert.equal(createStoryboard3DModelNormalizationPlan(BOUNDS, { targetSize: 0 }).targetSize, 2);
  assert.throws(
    () =>
      createStoryboard3DModelNormalizationPlan({
        min: { x: 1, y: 1, z: 1 },
        max: { x: 1, y: 1, z: 1 },
      }),
    /Model bounds have no measurable size/,
  );

  const target = {};
  assert.equal(
    setStoryboard3DModelNormalization(target, { status: 'ready', uniformScale: 2, translation: { x: 1 } }),
    target,
  );
  assert.deepEqual(target.userData[STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY], {
    status: 'ready',
    uniformScale: 2,
    translation: { x: 1, y: 0, z: 0 },
  });
  assert.deepEqual(readStoryboard3DModelNormalization(target), {
    status: 'ready',
    uniformScale: 2,
    translation: { x: 1, y: 0, z: 0 },
  });

  setStoryboard3DModelNormalization(target, { status: 'awaiting-bounds' });
  assert.equal(STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY in target.userData, false);
  assert.equal(readStoryboard3DModelNormalization(target), null);
  assert.equal(readStoryboard3DModelNormalization({}), null);
  assert.equal(readStoryboard3DModelNormalization(null), null);
  assert.equal(setStoryboard3DModelNormalization(null, { status: 'ready' }), null);
  assert.equal(setStoryboard3DModelNormalization('text', { status: 'ready' }), 'text');
  assert.equal(
    setStoryboard3DModelNormalization({}, { status: 'ready', uniformScale: 0 }).userData[
      STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY
    ].uniformScale,
    1,
  );
});

test('模型导入：资源映射同时登记完整路径与文件名', () => {
  const a = { name: 'a.png' };
  const b = { webkitRelativePath: 'textures\\b.jpg', name: 'b.jpg' };
  const c = { name: 'c.bin' };
  const map = createStoryboard3DModelResourceMap([
    a,
    b,
    c,
    { name: '' },
    undefined,
    { name: './models/./e.gltf' },
  ]);
  assert.equal(map.get('a.png'), a);
  assert.equal(map.get('textures/b.jpg'), b);
  assert.equal(map.get('b.jpg'), b);
  assert.equal(map.get('c.bin'), c);
  assert.equal(map.get('models/e.gltf').name, './models/./e.gltf');
  assert.equal(createStoryboard3DModelResourceMap().size, 0);
  assert.equal(createStoryboard3DModelResourceMap([]).size, 0);
});

test('模型导入：文件导入透传解析器与资源', async () => {
  const calls = [];
  const onProgress = () => {};
  const result = await importStoryboard3DModelFile(glbFile(), {
    targetSize: 3,
    onProgress,
    parsers: {
      gltf: async (file, options) => {
        calls.push({ file, options });
        return { bounds: BOUNDS, marker: 'parsed' };
      },
    },
  });
  assert.equal(result.format, 'glb');
  assert.equal(result.parsed.marker, 'parsed');
  assert.equal(result.normalization.status, 'ready');
  assert.equal(result.normalization.targetSize, 3);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].file.name, 'x.glb');
  assert.equal(calls[0].options.format, 'glb');
  assert.ok(calls[0].options.resources instanceof Map);
  assert.equal(calls[0].options.onProgress, onProgress);
  assert.equal(calls[0].options.onWorkerProgress, onProgress);
});

test('模型导入：解析器缺失与来源非法时抛出带码错误', async () => {
  await assert.rejects(
    () => importStoryboard3DModelFile(glbFile()),
    (error) => {
      assert.equal(error.code, 'MODEL_PARSER_UNAVAILABLE');
      assert.equal(error.format, 'glb');
      assert.match(error.message, /缺少 GLB 模型解析器/);
      return true;
    },
  );
  await assert.rejects(
    () =>
      importStoryboard3DModelFile(
        { name: 'a.step', size: 10, arrayBuffer: async () => null },
        { parsers: {} },
      ),
    (error) => {
      assert.equal(error.code, 'MODEL_FORMAT_UNSUPPORTED');
      assert.ok(error.details);
      return true;
    },
  );
});

test('模型导入：无包围盒的解析结果退回等待测量', async () => {
  const result = await importStoryboard3DModelFile(glbFile(), {
    parsers: { gltf: async () => ({}) },
  });
  assert.equal(result.normalization.status, 'awaiting-bounds');
});

test('模型导入：文件选择器在缺少 DOM 时拒绝', async () => {
  await assert.rejects(
    () => pickStoryboard3DModelFiles({ documentObject: null }),
    /File picker is unavailable/,
  );
  await assert.rejects(
    () => pickStoryboard3DModelFiles({ documentObject: {} }),
    /File picker is unavailable/,
  );
});

test('模型导入：文件选择器解析选择与取消', async () => {
  const makeInput = (files) => {
    const input = {
      type: '',
      accept: '',
      multiple: false,
      files,
      addEventListener(type, handler) {
        this['on' + type] = handler;
      },
      click() {
        this.onchange();
      },
    };
    return input;
  };

  const input = makeInput([{ name: 'a.glb' }, { name: 'b.gltf' }]);
  const picked = await pickStoryboard3DModelFiles({
    documentObject: { createElement: () => input },
    multiple: true,
  });
  assert.deepEqual(picked, [{ name: 'a.glb' }, { name: 'b.gltf' }]);
  assert.equal(input.type, 'file');
  assert.equal(input.accept, STORYBOARD_3D_MODEL_ACCEPT);
  assert.equal(input.multiple, true);

  const cancelInput = makeInput([]);
  cancelInput.click = function click() {
    this.oncancel();
  };
  assert.deepEqual(
    await pickStoryboard3DModelFiles({ documentObject: { createElement: () => cancelInput } }),
    [],
  );
  assert.equal(cancelInput.multiple, false);

  const emptyInput = makeInput(undefined);
  emptyInput.click = function click() {};
  const pending = pickStoryboard3DModelFiles({ documentObject: { createElement: () => emptyInput } });
  emptyInput.onchange();
  assert.deepEqual(await pending, []);
});
