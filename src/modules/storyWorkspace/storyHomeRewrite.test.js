import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_HOME_REWRITE_SOURCE_HINT,
  canStartStoryHomeGeneration,
  clearStoryHomeReferenceScript,
  getStoryHomeSummaryTaskCopy,
  handleStoryHomeDocumentDragLeave,
  handleStoryHomeDocumentDragOver,
  handleStoryHomeDocumentDrop,
  hasStoryHomeReferenceScript,
  resolveStoryHomeGenerationMode,
} from './storyHomeRewrite.js';

test('a reference script needs both a file name and text', () => {
  assert.match(STORY_HOME_REWRITE_SOURCE_HINT, /参考剧本会原样保留/);
  assert.equal(hasStoryHomeReferenceScript({ scriptFileName: 'a.docx', scriptText: '正文' }), true);
  assert.equal(hasStoryHomeReferenceScript({ scriptFileName: 'a.docx', scriptText: ' ' }), false);
  assert.equal(hasStoryHomeReferenceScript(), false);
});

test('generation can start only when the active tab has its input', () => {
  assert.equal(canStartStoryHomeGeneration({ homeTab: 'collaborate', idea: 'x' }), false);
  assert.equal(canStartStoryHomeGeneration({ homeTab: 'replication', replicationSourceFiles: [{}] }), true);
  assert.equal(
    canStartStoryHomeGeneration({
      homeTab: 'replication',
      isParsingDocument: true,
      replicationSourceFiles: [{}],
    }),
    true,
  );
  assert.equal(canStartStoryHomeGeneration({ homeTab: 'replication' }), false);
  assert.equal(
    canStartStoryHomeGeneration({ homeTab: 'upload', scriptFileName: 'a.txt', isParsingDocument: true }),
    false,
  );
  assert.equal(canStartStoryHomeGeneration({ homeTab: 'upload', scriptFileName: 'a.txt' }), true);
  assert.equal(canStartStoryHomeGeneration({ homeTab: 'generate', idea: '点子' }), true);
  assert.equal(
    canStartStoryHomeGeneration({ homeTab: 'generate', idea: '点子', scriptFileName: 'a.txt' }),
    false,
  );
  assert.equal(
    canStartStoryHomeGeneration({
      homeTab: 'generate',
      idea: '点子',
      scriptFileName: 'a.txt',
      scriptText: '正文',
    }),
    true,
  );
  assert.equal(canStartStoryHomeGeneration({ homeTab: 'generate' }), false);
});

test('the generate tab becomes rewrite when a reference script is attached', () => {
  assert.equal(
    resolveStoryHomeGenerationMode({ homeTab: 'generate', scriptFileName: 'a', scriptText: 'b' }),
    'rewrite',
  );
  assert.equal(resolveStoryHomeGenerationMode({ homeTab: 'generate' }), 'generate');
  assert.equal(
    resolveStoryHomeGenerationMode({ homeTab: 'upload', scriptFileName: 'a', scriptText: 'b' }),
    'upload',
  );
  assert.equal(getStoryHomeSummaryTaskCopy('rewrite').label, '改写剧本蓝图');
  assert.deepEqual(getStoryHomeSummaryTaskCopy(), {
    label: '生成剧本摘要',
    message: '正在根据原始创意生成剧本摘要',
    status: '正在根据原始创意生成剧本摘要...',
  });
});

test('clearing the reference script drops the source document only before a project exists', () => {
  const draft = {
    scriptFileName: 'a',
    scriptText: 'b',
    scriptCharacterCount: 3,
    data: { project: { sourceDocument: {} } },
  };
  clearStoryHomeReferenceScript(draft);
  assert.deepEqual(draft, {
    scriptFileName: '',
    scriptText: '',
    scriptCharacterCount: null,
    data: { project: { sourceDocument: null } },
  });
  const created = { hasCreatedProject: true, data: { project: { sourceDocument: { name: 'x' } } } };
  clearStoryHomeReferenceScript(created);
  assert.deepEqual(created.data.project.sourceDocument, { name: 'x' });
});

function dropZone() {
  const zone = {
    classes: new Set(),
    classList: { add: (name) => zone.classes.add(name), remove: (name) => zone.classes.delete(name) },
    contains: (node) => node === 'inside',
  };
  return zone;
}
function dragEvent(zone, extra = {}) {
  const calls = [];
  return {
    calls,
    target: {
      closest: (selector) =>
        selector === '[data-story-rewrite-drop], [data-story-script-drop]' ? zone : null,
    },
    preventDefault: () => calls.push('prevent'),
    stopPropagation: () => calls.push('stop'),
    ...extra,
  };
}

test('drag handlers only react inside a document drop zone', async () => {
  const zone = dropZone();
  const over = dragEvent(zone, { dataTransfer: {} });
  assert.equal(handleStoryHomeDocumentDragOver(over), true);
  assert.deepEqual(over.calls, ['prevent', 'stop']);
  assert.equal(over.dataTransfer.dropEffect, 'copy');
  assert.equal(zone.classes.has('is-dragover'), true);
  assert.equal(handleStoryHomeDocumentDragLeave(dragEvent(zone, { relatedTarget: 'inside' })), false);
  assert.equal(zone.classes.has('is-dragover'), true);
  assert.equal(handleStoryHomeDocumentDragLeave(dragEvent(zone, { relatedTarget: 'outside' })), true);
  assert.equal(zone.classes.has('is-dragover'), false);
  assert.equal(handleStoryHomeDocumentDragOver(dragEvent(null)), false);
  assert.equal(handleStoryHomeDocumentDragOver({ target: {} }), false);
  assert.equal(await handleStoryHomeDocumentDrop(dragEvent(null)), false);
});

test('dropping hands the first file to the handler', async () => {
  const zone = dropZone();
  zone.classes.add('is-dragover');
  const files = [];
  const drop = dragEvent(zone, { dataTransfer: { files: [{ name: 'a.docx' }, { name: 'b.docx' }] } });
  assert.equal(await handleStoryHomeDocumentDrop(drop, async (file) => files.push(file.name)), true);
  assert.deepEqual(files, ['a.docx']);
  assert.equal(zone.classes.has('is-dragover'), false);
  assert.equal(
    await handleStoryHomeDocumentDrop(dragEvent(zone, { dataTransfer: { files: [] } }), () => assert.fail()),
    true,
  );
  assert.equal(
    await handleStoryHomeDocumentDrop(dragEvent(zone, { dataTransfer: { files: [{}] } }), 'not a function'),
    true,
  );
});
