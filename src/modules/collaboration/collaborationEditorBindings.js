import { NODE_EDITOR_COMMIT_EVENT } from '../../core/nodeEditorCommit.js';
export function bindCollaborationEditors({
  store: store,
  documentObject: documentObject = document,
  windowObject: windowObject = window,
}) {
  const map = new Map();
  let value = false,
    item = false;
  const before = (el) => ('value' in el ? el['value'] : el['innerHTML']),
    handler = (event) => {
      if (
        !event['changed'] ||
        store['getGraphMutationPolicy']?.() !== event['policy'] ||
        before(event['target']) !== event['draft']
      )
        return;
      if ('value' in event['target']) event['target']['value'] = event['before'];
      else event['target']['innerHTML'] = event['before'];
    };
  function run(key, bubbles) {
    value = true;
    try {
      key['dispatchEvent'](
        bubbles === 'input'
          ? new windowObject['InputEvent']('input', { bubbles: true, inputType: 'insertText' })
          : new windowObject['Event'](bubbles, { bubbles: bubbles === 'change' }),
      );
    } finally {
      value = false;
    }
  }
  function run2(event2, index = false) {
    if (map['get'](event2['target']) !== event2) return;
    if (index) {
      handler(event2);
      if (event2['blurred'] && event2['target']['isConnected']) run(event2['target'], 'blur');
    }
    map['delete'](event2['target']);
    if (event2['busy'] === null) event2['target']['removeAttribute']('aria-busy');
    else event2['target']['setAttribute']('aria-busy', event2['busy']);
    queueMicrotask(() => event2['handle']['finish']());
  }
  function run3(event3) {
    if (item || map['get'](event3['target']) !== event3 || event3['waiting'] || event3['composing']) return;
    if (!event3['target']['isConnected'] || !event3['handle']['allowed']()) {
      run2(event3, true);
      return;
    }
    event3['target']['removeAttribute']('aria-busy');
    try {
      for (const run4 of event3['commits']['values']()) run4();
      (event3['commits']['clear'](),
        event3['changed'] && ((event3['changed'] = false), run(event3['target'], 'input')),
        event3['change'] && ((event3['change'] = false), run(event3['target'], 'change')),
        (event3['before'] = before(event3['target'])),
        event3['blurred'] && (run(event3['target'], 'blur'), run2(event3)));
    } catch (error) {
      (run2(event3, true), windowObject['showToast']?.(error['message'] || '节点暂时无法编辑', 'warning'));
    }
  }
  function focusin(event4) {
    if (value || item) return;
    const target = event4['target'];
    if (
      !target['matches']?.(
        'textarea, input:not([type="file"]):not([type="button"]):not([type="submit"]), [contenteditable="true"]',
      ) ||
      target['readOnly'] ||
      target['disabled']
    )
      return;
    const enabled = target['closest']('[data-node-id]')?.['dataset']['nodeId'];
    if (!enabled || !store['getStateRaw']()['nodes'][enabled]) return;
    const result = map['get'](target);
    if (result && (result['waiting'] || result['handle']['allowed']()))
      return ((result['blurred'] = false), result);
    if (result) run2(result, true);
    const policy = store['getGraphMutationPolicy']?.(),
      handle = policy?.['beginInteraction']?.([enabled]);
    if (!handle) return;
    const data = {
      target: target,
      handle: handle,
      policy: policy,
      before: before(target),
      busy: target['getAttribute']('aria-busy'),
      commits: new Map(),
      changed: false,
      composing: false,
      blurred: false,
      waiting: !handle['ready'],
    };
    map['set'](target, data);
    if (data['waiting']) target['setAttribute']('aria-busy', 'true');
    return (
      void handle['wait']['then'](
        () => {
          ((data['waiting'] = false), run3(data));
        },
        () => run2(data, true),
      ),
      data
    );
  }
  function beforeinput(event5) {
    if (value) return;
    const enabled2 = focusin(event5);
    if (enabled2 && !enabled2['waiting'] && !enabled2['handle']['allowed']()) event5['preventDefault']();
  }
  function input(event6) {
    if (value) return;
    const event7 = map['get'](event6['target']);
    if (!event7) return;
    if (event7['waiting'] || event7['composing'] || !event7['handle']['allowed']()) {
      ((event7['changed'] = true), (event7['draft'] = before(event7['target'])));
      if (event6['type'] === 'change') event7['change'] = true;
      event6['stopImmediatePropagation']();
    } else event7['before'] = before(event7['target']);
  }
  function blur(event8) {
    if (value) return;
    const enabled3 = map['get'](event8['target']);
    if (!enabled3) return;
    if (enabled3['waiting'] || enabled3['composing'])
      ((enabled3['blurred'] = true), event8['stopImmediatePropagation']());
    else run2(enabled3);
  }
  function compositionstart(event9) {
    const enabled4 = event9['type'] === 'compositionstart' ? focusin(event9) : map['get'](event9['target']);
    if (!enabled4) return;
    enabled4['composing'] = event9['type'] === 'compositionstart';
    if (!enabled4['composing']) queueMicrotask(() => run3(enabled4));
  }
  function run5(event10) {
    const event11 = map['get'](event10['target']);
    if (!event11 || (!event11['waiting'] && !event11['composing'] && event11['handle']['allowed']())) return;
    (event10['preventDefault'](),
      (event11['changed'] = true),
      (event11['draft'] = before(event11['target'])));
    if (typeof event10['detail']?.['commit'] === 'function')
      event11['commits']['set'](event10['detail']['key'], event10['detail']['commit']);
  }
  const options = {
      focusin: focusin,
      keydown: focusin,
      paste: focusin,
      cut: focusin,
      beforeinput: beforeinput,
      input: input,
      change: input,
      blur: blur,
      compositionstart: compositionstart,
      compositionend: compositionstart,
      [NODE_EDITOR_COMMIT_EVENT]: run5,
    },
    source = new windowObject['MutationObserver'](() => {
      for (const event12 of map['values']()) if (!event12['target']['isConnected']) run2(event12, true);
    });
  source['observe'](documentObject['body'], { childList: true, subtree: true });
  for (const [next, current] of Object['entries'](options))
    documentObject['addEventListener'](next, current, true);
  const entry = () => {
    for (const event13 of map['values']()) {
      (event13['target']['blur'](), run2(event13, event13['waiting'] || event13['composing']));
    }
  };
  return (
    windowObject['addEventListener']('blur', entry),
    () => {
      ((item = true), source['disconnect']());
      for (const record of map['values']()) run2(record, true);
      for (const [payload, state] of Object['entries'](options))
        documentObject['removeEventListener'](payload, state, true);
      windowObject['removeEventListener']('blur', entry);
    }
  );
}
