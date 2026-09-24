import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentComposerAttachmentController } from './agentComposerAttachmentController.js';

function makeDocumentObject() {
  const created = [];
  return {
    created,
    createElement(tagName) {
      const element = {
        tagName: String(tagName).toUpperCase(),
        className: '',
        type: '',
        accept: '',
        multiple: false,
        hidden: false,
        value: 'dirty-value',
        files: null,
        clicks: 0,
        handlers: {},
        addEventListener(kind, handler) {
          (element.handlers[kind] = element.handlers[kind] || []).push(handler);
        },
        dispatch(kind, event = {}) {
          return (element.handlers[kind] || []).map((handler) => handler(event));
        },
        click() {
          element.clicks += 1;
        },
      };
      created.push(element);
      return element;
    },
  };
}

const file = (name, size = 10, lastModified = 100) => ({ name, size, lastModified });

function make(over = {}) {
  const value = (key, fallback) => (key in over ? over[key] : fallback);
  const documentObject = makeDocumentObject();
  const state = { busy: false };
  const calls = {
    notices: [],
    refs: [],
    busy: [],
    texts: [],
    formats: [],
    focus: 0,
    changes: 0,
    uploads: [],
    captured: [],
    checked: [],
  };
  const controller = createAgentComposerAttachmentController({
    documentObject,
    uploadMaterial: value('uploadMaterial', async (input) => {
      calls.uploads.push(input);
      return [{ raw: input }];
    }),
    validateDocumentFile: value('validateDocumentFile', null),
    normalizeMaterialNode: value('normalizeMaterialNode', (node) => node),
    addInputRefs: value('addInputRefs', (nodes) => calls.refs.push(nodes)),
    setBusy: value('setBusy', (flag) => {
      state.busy = flag;
      calls.busy.push(flag);
    }),
    getBusy: value('getBusy', () => state.busy),
    captureContext: value('captureContext', () => {
      const context = { ctx: calls.captured.length + 1 };
      calls.captured.push(context);
      return context;
    }),
    isContextCurrent: value('isContextCurrent', (context) => {
      calls.checked.push(context);
      return true;
    }),
    setNotice: value('setNotice', (message) => calls.notices.push(message)),
    text: value('text', (key) => {
      calls.texts.push(key);
      return 'T:' + key;
    }),
    formatText: value('formatText', (key, vars) => {
      calls.formats.push([key, vars]);
      return 'F:' + key + ':' + JSON.stringify(vars);
    }),
    focusInput: value('focusInput', () => {
      calls.focus += 1;
    }),
    onDocumentChange: value('onDocumentChange', () => {
      calls.changes += 1;
    }),
  });
  return { controller, calls, state, documentObject };
}

test('构造两个隐藏 input：素材单选、文档多选，accept 与类名各自固定', () => {
  const { documentObject, controller } = make();
  assert.equal(documentObject.created.length, 2);
  const [material, document] = documentObject.created;
  assert.equal(material.tagName, 'INPUT');
  assert.equal(material.className, 'agent-upload-input');
  assert.equal(material.type, 'file');
  assert.equal(material.accept, 'image/*,video/*,audio/*');
  assert.equal(material.multiple, false);
  assert.equal(material.hidden, true);
  assert.equal(document.className, 'agent-document-input');
  assert.equal(document.accept, '.txt,.docx,.pdf');
  assert.equal(document.multiple, true);
  assert.equal(document.hidden, true);
  assert.deepEqual(Object.keys(material.handlers), ['change']);
  assert.deepEqual(Object.keys(document.handlers), ['change']);
  assert.deepEqual(Object.keys(controller).sort(), [
    'clearDocuments',
    'consumeDocuments',
    'documentInput',
    'getDocumentDisplayRefs',
    'materialInput',
    'openDocumentPicker',
    'openMaterialPicker',
    'removeDocument',
    'uploadMaterialFile',
  ]);
  assert.equal(controller.materialInput, material);
  assert.equal(controller.documentInput, document);
});

test('打开素材选择器：清空 value、click 一次并播报 uploadMaterial', () => {
  const { controller, calls } = make();
  controller.openMaterialPicker();
  assert.equal(controller.materialInput.value, '');
  assert.equal(controller.materialInput.clicks, 1);
  assert.deepEqual(calls.notices, ['T:uploadMaterial']);
  assert.deepEqual(calls.texts, ['uploadMaterial']);
  assert.equal(controller.documentInput.clicks, 0);
});

test('打开文档选择器：清空 value、click 一次并播报 readDocument', () => {
  const { controller, calls } = make();
  controller.openDocumentPicker();
  assert.equal(controller.documentInput.value, '');
  assert.equal(controller.documentInput.clicks, 1);
  assert.deepEqual(calls.notices, ['T:readDocument']);
  assert.equal(controller.materialInput.clicks, 0);
});

test('input change 事件：素材取 files[0]，文档取整个 FileList，随后清空 value', async () => {
  const { controller, calls } = make();
  controller.materialInput.files = [file('a.png'), file('b.png')];
  controller.materialInput.dispatch('change');
  assert.deepEqual(calls.uploads, [file('a.png')]);
  assert.equal(controller.materialInput.value, '');

  controller.documentInput.files = [file('x.txt')];
  controller.documentInput.dispatch('change');
  assert.deepEqual(
    controller.getDocumentDisplayRefs().map((ref) => ref.name),
    ['x.txt'],
  );
  assert.equal(controller.documentInput.value, '');
});

test('素材上传成功：busy 成对、归一后写入 refs 并播报 ready', async () => {
  const { controller, calls, state } = make({
    uploadMaterial: async (input) => [
      { id: 'm1', input },
      { id: 'm2', input },
    ],
  });
  await controller.uploadMaterialFile(file('a.png'));
  assert.deepEqual(calls.busy, [true, false]);
  assert.equal(state.busy, false);
  assert.deepEqual(calls.refs, [
    [
      { id: 'm1', input: file('a.png') },
      { id: 'm2', input: file('a.png') },
    ],
  ]);
  assert.deepEqual(calls.notices, ['T:uploadMaterialReady']);
  assert.equal(calls.focus, 1);
  assert.deepEqual(calls.captured, [{ ctx: 1 }]);
  // isContextCurrent 在上传后与 finally 各查一次同一个上下文对象
  assert.equal(calls.checked.length, 2);
  assert.equal(calls.checked[0], calls.captured[0]);
  assert.equal(calls.checked[1], calls.captured[0]);
});

test('素材上传返回单对象时按一个节点处理，归一后的假值节点被过滤', async () => {
  const single = make({ normalizeMaterialNode: (node) => ({ normalized: node }) });
  await single.controller.uploadMaterialFile('one');
  assert.deepEqual(single.calls.refs, [[{ normalized: { raw: 'one' } }]]);

  const filtered = make({ normalizeMaterialNode: () => null });
  await filtered.controller.uploadMaterialFile('one');
  assert.deepEqual(filtered.calls.refs, []);
  assert.deepEqual(filtered.calls.notices, ['T:uploadMaterialFailed']);
  assert.deepEqual(filtered.calls.busy, [true, false]);
});

test('上下文过期时既不写 refs 也不复位 busy（busy 泄漏）', async () => {
  const { controller, calls } = make({ isContextCurrent: () => false });
  await controller.uploadMaterialFile('a.png');
  assert.deepEqual(calls.refs, []);
  assert.deepEqual(calls.notices, []);
  assert.deepEqual(calls.busy, [true]);
  assert.equal(calls.focus, 0);
});

test('上传器缺失：只播报 uploadMaterialMissing，不进入 busy 也不丢上下文', async () => {
  const { controller, calls } = make({ uploadMaterial: null });
  await controller.uploadMaterialFile('a.png');
  assert.deepEqual(calls.notices, ['T:uploadMaterialMissing']);
  assert.deepEqual(calls.busy, []);
  assert.equal(calls.captured.length, 1);

  const missingNotice = make({ uploadMaterial: null, setNotice: undefined });
  await missingNotice.controller.uploadMaterialFile('a.png');
  assert.deepEqual(missingNotice.calls.busy, []);
});

test('忙时或空文件时直接返回，不捕获上下文', async () => {
  const busy = make({ getBusy: () => true });
  await busy.controller.uploadMaterialFile('a.png');
  assert.deepEqual(busy.calls.uploads, []);
  assert.deepEqual(busy.calls.captured, []);

  const empty = make();
  assert.equal(await empty.controller.uploadMaterialFile(null), undefined);
  assert.deepEqual(empty.calls.captured, []);
});

test('上传抛错：message 优先，缺 message 回落文案；上下文过期则不播报', async () => {
  const withMessage = make({
    uploadMaterial: async () => {
      throw new Error('network down');
    },
  });
  await withMessage.controller.uploadMaterialFile('a.png');
  assert.deepEqual(withMessage.calls.notices, ['network down']);
  assert.deepEqual(withMessage.calls.busy, [true, false]);

  const silent = make({
    uploadMaterial: async () => {
      throw {};
    },
  });
  await silent.controller.uploadMaterialFile('a.png');
  assert.deepEqual(silent.calls.notices, ['T:uploadMaterialFailed']);

  const stale = make({
    isContextCurrent: () => false,
    uploadMaterial: async () => {
      throw new Error('network down');
    },
  });
  await stale.controller.uploadMaterialFile('a.png');
  assert.deepEqual(stale.calls.notices, []);
  assert.deepEqual(stale.calls.busy, [true]);
});

test('文档入册：展示引用形状固定，id 递增且清理后不回填', () => {
  const { controller, calls } = make();
  controller.documentInput.files = [file('a.txt'), file('b.docx', 20, 200)];
  controller.documentInput.dispatch('change');
  assert.deepEqual(controller.getDocumentDisplayRefs(), [
    {
      id: 'agent-document-1',
      nodeId: 'agent-document-1',
      type: 'external-document',
      kind: 'document',
      name: 'a.txt',
      label: 'a.txt',
      source: 'document-upload',
    },
    {
      id: 'agent-document-2',
      nodeId: 'agent-document-2',
      type: 'external-document',
      kind: 'document',
      name: 'b.docx',
      label: 'b.docx',
      source: 'document-upload',
    },
  ]);
  assert.equal(calls.changes, 1);
  assert.deepEqual(calls.formats, [['documentAttached', { count: 2 }]]);
  assert.deepEqual(calls.notices, ['F:documentAttached:{"count":2}']);
  assert.equal(calls.focus, 1);

  controller.clearDocuments();
  controller.documentInput.files = [file('c.pdf')];
  controller.documentInput.dispatch('change');
  assert.deepEqual(
    controller.getDocumentDisplayRefs().map((ref) => [ref.id, ref.name]),
    [['agent-document-3', 'c.pdf']],
  );
});

test('文档名缺失时展示为 document，且 name/size/lastModified 缺失不影响去重键', () => {
  const { controller, calls } = make();
  controller.documentInput.files = [{}, { name: 'x.txt' }];
  controller.documentInput.dispatch('change');
  assert.deepEqual(
    controller.getDocumentDisplayRefs().map((ref) => ref.name),
    ['document', 'x.txt'],
  );
  assert.equal(calls.changes, 1);

  // 去重键为 name:size:lastModified 的字符串拼接，缺字段留空位
  const dup = make();
  dup.controller.documentInput.files = [file('same.txt', 1, 2), file('same.txt', 1, 2)];
  dup.controller.documentInput.dispatch('change');
  assert.equal(dup.controller.getDocumentDisplayRefs().length, 1);
});

test('文档校验失败逐条播报并继续处理，错误文案经过剧本→文档改写', () => {
  const { controller, calls } = make({
    validateDocumentFile: (f) => (f.ok ? { ok: true } : { ok: false, error: '剧本文件不可读取' }),
  });
  controller.documentInput.files = [
    Object.assign(file('bad.txt'), { ok: false }),
    Object.assign(file('good.txt'), { ok: true }),
  ];
  controller.documentInput.dispatch('change');
  assert.deepEqual(calls.notices, ['文档不可读取', 'F:documentAttached:{"count":1}']);
  assert.deepEqual(
    controller.getDocumentDisplayRefs().map((ref) => ref.name),
    ['good.txt'],
  );
});

test('文档数量上限 3：超限只播报一次并中断后续文件', () => {
  const { controller, calls } = make();
  controller.documentInput.files = [file('1.txt'), file('2.txt'), file('3.txt'), file('4.txt')];
  controller.documentInput.dispatch('change');
  assert.deepEqual(
    controller.getDocumentDisplayRefs().map((ref) => ref.name),
    ['1.txt', '2.txt', '3.txt'],
  );
  assert.deepEqual(calls.formats, [
    ['documentLimit', { count: 3 }],
    ['documentAttached', { count: 3 }],
  ]);

  // formatText 缺失时回落 text(key)
  const textOnly = make({ formatText: undefined });
  textOnly.controller.documentInput.files = [file('1.txt'), file('2.txt'), file('3.txt'), file('4.txt')];
  textOnly.controller.documentInput.dispatch('change');
  assert.deepEqual(textOnly.calls.notices, ['T:documentLimit', 'T:documentAttached']);
});

test('removeDocument：命中返回 true 并通知，未命中返回 false 且不通知', () => {
  const { controller, calls } = make();
  controller.documentInput.files = [file('a.txt'), file('b.txt')];
  controller.documentInput.dispatch('change');
  const before = calls.changes;
  assert.equal(controller.removeDocument('agent-document-1'), true);
  assert.equal(calls.changes, before + 1);
  assert.deepEqual(
    controller.getDocumentDisplayRefs().map((ref) => ref.name),
    ['b.txt'],
  );
  assert.equal(controller.removeDocument('agent-document-1'), false);
  assert.equal(controller.removeDocument(), false);
  assert.equal(calls.changes, before + 1);
});

test('consumeDocuments 一次性交付并静默清空，clearDocuments 可选择不通知', () => {
  const { controller, calls } = make();
  controller.documentInput.files = [file('a.txt')];
  controller.documentInput.dispatch('change');
  calls.notices.length = 0;
  const consumed = controller.consumeDocuments();
  assert.deepEqual(consumed.files, [file('a.txt')]);
  assert.equal(consumed.displayRefs.length, 1);
  assert.equal(consumed.displayRefs[0].id, 'agent-document-1');
  assert.deepEqual(controller.getDocumentDisplayRefs(), []);
  assert.deepEqual(calls.notices, []);
  assert.equal(calls.changes, 1);

  controller.documentInput.files = [file('b.txt')];
  controller.documentInput.dispatch('change');
  const changes = calls.changes;
  controller.clearDocuments({ notify: false });
  assert.equal(calls.changes, changes);
  assert.deepEqual(controller.getDocumentDisplayRefs(), []);
  controller.clearDocuments();
  assert.equal(calls.changes, changes + 1);
});

test('只传 documentObject 时全部端口缺省也不抛错', async () => {
  const documentObject = makeDocumentObject();
  const controller = createAgentComposerAttachmentController({ documentObject });
  controller.openMaterialPicker();
  controller.openDocumentPicker();
  controller.documentInput.files = [file('a.txt')];
  controller.documentInput.dispatch('change');
  assert.deepEqual(
    controller.getDocumentDisplayRefs().map((ref) => ref.id),
    ['agent-document-1'],
  );
  assert.equal(controller.removeDocument('agent-document-1'), true);
  assert.deepEqual(controller.consumeDocuments(), { files: [], displayRefs: [] });
  await controller.uploadMaterialFile('a.png');
  controller.clearDocuments();
});
