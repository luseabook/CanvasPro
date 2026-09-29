import test from 'node:test';
import assert from 'node:assert/strict';

import { createLocalAssetCleanupList } from './localAssetCleanupList.js';

// 冻结文案：settings.fileSave.cleanupRuntime.* 在词典里不存在，t() 原样回退成 key，
// 且这些 key 自身不含 {占位符}，因此插值参数不会出现在结果里。
const TEXT = {
  scopeNotice: 'settings.fileSave.cleanupRuntime.scopeNotice',
  scopeProjects: 'settings.fileSave.cleanupRuntime.scopeProjects',
  selectedSummary: 'settings.fileSave.cleanupRuntime.selectedSummary',
  pageSummary: 'settings.fileSave.cleanupRuntime.pageSummary',
  selectFile: 'settings.fileSave.cleanupRuntime.selectFile',
  selectPage: 'settings.fileSave.cleanupRuntime.selectPage',
  clearSelection: 'settings.fileSave.cleanupRuntime.clearSelection',
  previousPage: 'settings.fileSave.cleanupRuntime.previousPage',
  nextPage: 'settings.fileSave.cleanupRuntime.nextPage',
};
const ACTIONS = ['selectPage', 'clearSelection', 'previousPage', 'nextPage'];

function makeElement(tag, over = {}) {
  const element = {
    tagName: tag,
    children: [],
    dataset: {},
    attrs: {},
    toggles: [],
    listeners: {},
    className: 'className' in over ? over.className : '',
    textContent: 'textContent' in over ? over.textContent : '',
    hidden: 'hidden' in over ? over.hidden : false,
    disabled: 'disabled' in over ? over.disabled : false,
    checked: 'checked' in over ? over.checked : false,
    scrollTop: 'scrollTop' in over ? over.scrollTop : undefined,
    appendChild(child) {
      element.children.push(child);
      return child;
    },
    replaceChildren() {
      element.children.length = 0;
    },
    setAttribute(name, value) {
      element.attrs[name] = value;
    },
    addEventListener(type, handler) {
      element.listeners[type] = handler;
    },
    classList: {
      toggle(name, on) {
        element.toggles.push([name, on]);
      },
    },
  };
  return element;
}

function withHost(run) {
  const previous = globalThis.document;
  globalThis.document = { createElement: (tag) => makeElement(tag) };
  try {
    const list = makeElement('ul');
    const toolbar = makeElement('div');
    const details = makeElement('p');
    const selectionCalls = [];
    const instance = createLocalAssetCleanupList({
      list,
      toolbar,
      details,
      onSelectionChange(items) {
        selectionCalls.push(items);
      },
    });
    return run({ list, toolbar, details, selectionCalls, instance });
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
}

function toolbarButton(toolbar, action) {
  return toolbar.children.find((child) => child.dataset.cleanupAction === action);
}

function toolbarSpans(toolbar) {
  return toolbar.children.filter((child) => child.tagName === 'span');
}

function disabledMap(toolbar) {
  const map = {};
  for (const action of ACTIONS) map[action] = toolbarButton(toolbar, action).disabled;
  return map;
}

function makeItem(over = {}) {
  return {
    localPath: 'localPath' in over ? over.localPath : 'F:/media/a.png',
    absolutePath: 'absolutePath' in over ? over.absolutePath : undefined,
    kind: 'kind' in over ? over.kind : 'image',
    size: 'size' in over ? over.size : 0,
  };
}

function makeItems(count, prefix) {
  return Array.from({ length: count }, (unused, index) =>
    makeItem({ localPath: prefix + '/' + index, kind: 'image', size: 0 }),
  );
}

test('localAssetCleanupList: 构建时按固定顺序添加说明与四个按钮', () => {
  withHost(({ toolbar, details, selectionCalls }) => {
    const [summary, selectPage, clearSelection, previousPage, pageSpan, nextPage] =
      toolbar.children;
    assert.equal(toolbar.children.length, 6);
    assert.deepEqual(
      [
        { tag: summary.tagName, cls: summary.className, live: summary.attrs['aria-live'] },
        { tag: pageSpan.tagName, cls: pageSpan.className },
      ],
      [
        { tag: 'span', cls: 'settings-desc', live: 'polite' },
        { tag: 'span', cls: 'settings-desc' },
      ],
    );
    assert.deepEqual(
      [selectPage, clearSelection, previousPage, nextPage].map((button) => ({
        action: button.dataset.cleanupAction,
        tag: button.tagName,
        type: button.type,
        cls: button.className,
        text: button.textContent,
      })),
      [
        {
          action: 'selectPage',
          tag: 'button',
          type: 'button',
          cls: 'settings-save-btn settings-btn-ghost',
          text: TEXT.selectPage,
        },
        {
          action: 'clearSelection',
          tag: 'button',
          type: 'button',
          cls: 'settings-save-btn settings-btn-ghost',
          text: TEXT.clearSelection,
        },
        {
          action: 'previousPage',
          tag: 'button',
          type: 'button',
          cls: 'settings-save-btn settings-btn-ghost',
          text: TEXT.previousPage,
        },
        {
          action: 'nextPage',
          tag: 'button',
          type: 'button',
          cls: 'settings-save-btn settings-btn-ghost',
          text: TEXT.nextPage,
        },
      ],
    );
    // 构建阶段只搭骨架，不渲染列表、不回调
    assert.deepEqual({ details: details.textContent, calls: selectionCalls }, { details: '', calls: [] });
  });
});

test('localAssetCleanupList: setScan(null) 隐藏列表并禁用全部操作', () => {
  withHost(({ list, toolbar, details, selectionCalls, instance }) => {
    instance.setScan(null);
    assert.deepEqual(
      {
        detailsText: details.textContent,
        detailsHidden: details.hidden,
        listHidden: list.hidden,
        toolbarHidden: toolbar.hidden,
        itemCount: list.children.length,
        disabled: disabledMap(toolbar),
        spanTexts: toolbarSpans(toolbar).map((span) => span.textContent),
        calls: selectionCalls,
      },
      {
        detailsText: '',
        detailsHidden: true,
        listHidden: true,
        toolbarHidden: true,
        itemCount: 0,
        disabled: { selectPage: true, clearSelection: true, previousPage: true, nextPage: true },
        spanTexts: [TEXT.selectedSummary, TEXT.pageSummary],
        calls: [[]],
      },
    );
  });
});

test('localAssetCleanupList: setScan 渲染当前页条目与元信息', () => {
  withHost(({ list, toolbar, instance }) => {
    instance.setScan({
      ok: true,
      canTrash: true,
      items: [
        makeItem({ localPath: 'F:/media/a.png', kind: 'image', size: 1536 }),
        makeItem({ localPath: 'D:/clips/b.mov', absolutePath: 'D:/clips/b.mov', kind: 'video', size: 1024 }),
        makeItem({ localPath: 'D:/misc/c.bin', kind: 'doc', size: 0 }),
      ],
    });
    const [first, second] = list.children;
    const checkbox = first.children[0];
    assert.deepEqual(
      {
        hidden: [list.hidden, toolbar.hidden],
        scrollTop: list.scrollTop,
        itemCount: list.children.length,
        itemClass: first.className,
        children: first.children.map((child) => child.tagName),
        checkbox: {
          type: checkbox.type,
          cls: checkbox.className,
          label: checkbox.attrs['aria-label'],
          disabled: checkbox.disabled,
          checked: checkbox.checked,
        },
      },
      {
        hidden: [false, false],
        scrollTop: 0,
        itemCount: 3,
        itemClass: 'settings-local-cleanup-item',
        children: ['input', 'div', 'span'],
        checkbox: {
          type: 'checkbox',
          cls: 'settings-local-cleanup-checkbox',
          label: TEXT.selectFile,
          disabled: false,
          checked: false,
        },
      },
    );
    assert.deepEqual(
      first.children[1].children.map((child) => ({
        cls: child.className,
        text: child.textContent,
        tooltip: child.dataset.tooltip,
        overflow: child.dataset.tooltipOverflow,
      })),
      [
        // localPath 尾段作文件名；absolutePath 缺省时回退 localPath
        { cls: 'settings-local-cleanup-filename', text: 'a.png', tooltip: undefined, overflow: undefined },
        {
          cls: 'settings-local-cleanup-path',
          text: 'F:/media/a.png',
          tooltip: 'F:/media/a.png',
          overflow: 'true',
        },
      ],
    );
    assert.deepEqual(
      list.children.map((child) => child.children[2].textContent),
      [
        'settings.fileSave.cleanupRuntime.kinds.image · 1.50 KB',
        'settings.fileSave.cleanupRuntime.kinds.video · 1.00 KB',
        'settings.fileSave.cleanupRuntime.kinds.media · 0 B',
      ],
    );
    assert.deepEqual(
      [second.children[1].children[0].textContent, second.children[1].children[1].textContent],
      ['b.mov', 'D:/clips/b.mov'],
    );
  });
});

test('localAssetCleanupList: 勾选与取消勾选驱动 selectedItems 与回调', () => {
  withHost(({ list, toolbar, selectionCalls, instance }) => {
    const items = [
      makeItem({ localPath: 'a/1.png', kind: 'image', size: 2048 }),
      makeItem({ localPath: 'a/2.png', kind: 'image', size: 0 }),
    ];
    instance.setScan({ ok: true, canTrash: true, items });
    const checkbox = list.children[0].children[0];
    const snapshot = () => ({
      selected: instance.selectedItems(),
      calls: selectionCalls.at(-1),
      clearDisabled: toolbarButton(toolbar, 'clearSelection').disabled,
    });
    assert.deepEqual(snapshot(), { selected: [], calls: [], clearDisabled: true });

    checkbox.checked = true;
    checkbox.listeners.change();
    assert.deepEqual(snapshot(), { selected: [items[0]], calls: [items[0]], clearDisabled: false });

    checkbox.checked = false;
    checkbox.listeners.change();
    assert.deepEqual(snapshot(), { selected: [], calls: [], clearDisabled: true });
  });
});

test('localAssetCleanupList: selectPage 全选当前页，clearSelection 清空', () => {
  withHost(({ toolbar, selectionCalls, instance }) => {
    instance.setScan({ ok: true, canTrash: true, items: makeItems(51, 'p') });
    toolbarButton(toolbar, 'selectPage').listeners.click();
    assert.deepEqual(
      {
        selected: instance.selectedItems().length,
        calls: selectionCalls.at(-1).length,
        disabled: disabledMap(toolbar),
      },
      {
        selected: 50,
        calls: 50,
        disabled: { selectPage: false, clearSelection: false, previousPage: true, nextPage: false },
      },
    );

    toolbarButton(toolbar, 'clearSelection').listeners.click();
    assert.deepEqual(
      {
        selected: instance.selectedItems().length,
        calls: selectionCalls.at(-1),
        disabled: disabledMap(toolbar),
      },
      {
        selected: 0,
        calls: [],
        disabled: { selectPage: false, clearSelection: true, previousPage: true, nextPage: false },
      },
    );
  });
});

test('localAssetCleanupList: 上一页/下一页按 50 条分页并更新页码摘要', () => {
  withHost(({ list, toolbar, instance }) => {
    instance.setScan({ ok: true, canTrash: true, items: makeItems(51, 'q') });
    const snapshot = () => ({
      itemCount: list.children.length,
      disabled: disabledMap(toolbar),
      pageText: toolbarSpans(toolbar)[1].textContent,
    });
    assert.deepEqual(snapshot(), {
      itemCount: 50,
      disabled: { selectPage: false, clearSelection: true, previousPage: true, nextPage: false },
      pageText: TEXT.pageSummary,
    });

    toolbarButton(toolbar, 'nextPage').listeners.click();
    assert.deepEqual(
      { ...snapshot(), lastName: list.children[0].children[1].children[0].textContent },
      {
        itemCount: 1,
        disabled: { selectPage: false, clearSelection: true, previousPage: false, nextPage: true },
        pageText: TEXT.pageSummary,
        lastName: '50',
      },
    );

    toolbarButton(toolbar, 'previousPage').listeners.click();
    assert.deepEqual(snapshot(), {
      itemCount: 50,
      disabled: { selectPage: false, clearSelection: true, previousPage: true, nextPage: false },
      pageText: TEXT.pageSummary,
    });
  });
});

test('localAssetCleanupList: setBusy 禁用所有控件并把选中回调清空', () => {
  withHost(({ list, toolbar, selectionCalls, instance }) => {
    instance.setScan({ ok: true, canTrash: true, items: [makeItem({ localPath: 'r/1.png', size: 1024 })] });
    const checkbox = list.children[0].children[0];
    checkbox.checked = true;
    checkbox.listeners.change();
    assert.equal(instance.selectedItems().length, 1);

    instance.setBusy(true);
    assert.deepEqual(
      { disabled: disabledMap(toolbar), checkboxDisabled: checkbox.disabled, calls: selectionCalls.at(-1) },
      {
        disabled: { selectPage: true, clearSelection: true, previousPage: true, nextPage: true },
        checkboxDisabled: true,
        calls: [],
      },
    );
    // 忙碌中勾选/取消无效
    checkbox.checked = false;
    checkbox.listeners.change();
    assert.equal(instance.selectedItems().length, 1);

    instance.setBusy(false);
    assert.deepEqual(
      { disabled: disabledMap(toolbar), checkboxDisabled: checkbox.disabled, checked: checkbox.checked, calls: selectionCalls.at(-1).length },
      {
        disabled: { selectPage: false, clearSelection: false, previousPage: true, nextPage: true },
        checkboxDisabled: false,
        checked: true,
        calls: 1,
      },
    );
  });
});

test('localAssetCleanupList: ok 需严格为 true 且 canTrash 不得为 false 才可操作', () => {
  withHost(({ list, toolbar, selectionCalls, instance }) => {
    const state = () => ({
      selectDisabled: toolbarButton(toolbar, 'selectPage').disabled,
      checkboxDisabled: list.children[0].children[0].disabled,
      calls: selectionCalls.at(-1),
    });

    instance.setScan({ ok: true, canTrash: false, items: [makeItem({ localPath: 's/1.png' })] });
    assert.deepEqual(state(), { selectDisabled: true, checkboxDisabled: true, calls: [] });
    list.children[0].children[0].checked = true;
    list.children[0].children[0].listeners.change();
    assert.equal(instance.selectedItems().length, 0);

    instance.setScan({ ok: false, items: [makeItem({ localPath: 's/2.png' })] });
    assert.deepEqual(state(), { selectDisabled: true, checkboxDisabled: true, calls: [] });

    instance.setScan({ items: [makeItem({ localPath: 's/3.png' })] });
    assert.deepEqual(state(), { selectDisabled: true, checkboxDisabled: true, calls: [] });

    // canTrash 缺省（undefined）不等于 false，仍可操作
    instance.setScan({ ok: true, items: [makeItem({ localPath: 's/4.png' })] });
    assert.deepEqual(state(), { selectDisabled: false, checkboxDisabled: false, calls: [] });
  });
});

test('localAssetCleanupList: setScan 把覆盖范围与告警逐行写入 details', () => {
  withHost(({ details, instance }) => {
    instance.setScan({
      ok: true,
      canTrash: true,
      items: [],
      coverage: {
        projectFiles: 2,
        canvasDirectory: 'F:/canvas',
        mediaDirectories: [
          { prefix: '图片', path: 'D:/img' },
          { prefix: '视频', path: 'D:/vid' },
        ],
      },
      warnings: [{ source: 'scan', message: '部分目录不可读' }],
    });
    assert.deepEqual(
      { hidden: details.hidden, lines: details.textContent.split('\n') },
      {
        hidden: false,
        lines: [
          TEXT.scopeNotice,
          TEXT.scopeProjects,
          '图片 → D:/img',
          '视频 → D:/vid',
          'scan: 部分目录不可读',
        ],
      },
    );
  });
});

test('localAssetCleanupList: 无 coverage 时只保留说明行，warnings 逐行追加', () => {
  withHost(({ details, instance }) => {
    instance.setScan({ ok: true, items: [], warnings: [{ source: 'a', message: 'b' }] });
    assert.deepEqual(details.textContent.split('\n'), [TEXT.scopeNotice, 'a: b']);
    instance.setScan({ ok: true, items: [] });
    assert.deepEqual(
      { hidden: details.hidden, lines: details.textContent.split('\n') },
      { hidden: false, lines: [TEXT.scopeNotice] },
    );
    instance.setScan(null);
    assert.deepEqual({ text: details.textContent, hidden: details.hidden }, { text: '', hidden: true });
  });
});

test('localAssetCleanupList: 重新扫描会清空选中并回到第一页', () => {
  withHost(({ list, toolbar, instance }) => {
    const items = makeItems(60, 't');
    instance.setScan({ ok: true, canTrash: true, items });
    toolbarButton(toolbar, 'selectPage').listeners.click();
    toolbarButton(toolbar, 'nextPage').listeners.click();
    assert.deepEqual(
      { selected: instance.selectedItems().length, itemCount: list.children.length },
      { selected: 50, itemCount: 10 },
    );

    instance.setScan({ ok: true, canTrash: true, items });
    assert.deepEqual(
      {
        selected: instance.selectedItems().length,
        itemCount: list.children.length,
        previousDisabled: toolbarButton(toolbar, 'previousPage').disabled,
        clearDisabled: toolbarButton(toolbar, 'clearSelection').disabled,
      },
      { selected: 0, itemCount: 50, previousDisabled: true, clearDisabled: true },
    );
  });
});
