import {
  cloneStoryboard3DProject,
  createStoryboard3DProject,
  getActiveStoryboard3DScene,
  migrateStoryboard3DProject,
} from './projectModel.js';
function createEmitter() {
  const map = new Set();
  return {
    emit(value, item) {
      map['forEach']((handler) => handler(value, item));
    },
    subscribe(key) {
      if (typeof key !== 'function') return () => {};
      return (map['add'](key), () => map['delete'](key));
    },
    clear() {
      map['clear']();
    },
  };
}
export function createStoryboard3DProjectStore(
  index,
  { now: now = () => Date['now'](), idFactory: idFactory, onPersist: onPersist } = {},
) {
  const emitter = createEmitter();
  let migrateStoryboard3DProject2 = migrateStoryboard3DProject(index, { now: now(), idFactory: idFactory }),
    result = 'saved',
    data = 0;
  function run() {
    return cloneStoryboard3DProject(migrateStoryboard3DProject2);
  }
  function run2(options, args = {}) {
    emitter['emit'](run(), { reason: options, saveStatus: result, ...args });
  }
  function run3(target, source) {
    if (target !== data) return;
    ((result = 'saved'), run2(source, { persisted: true }));
  }
  function run4(next, current, entry) {
    if (next !== data) return;
    ((result = 'error'), run2(current, { persisted: false, error: entry }));
  }
  function run5(record) {
    const payload = ++data;
    result = 'saving';
    const handle = run();
    run2(record, { persisted: false });
    if (typeof onPersist !== 'function') return (run3(payload, record), handle);
    try {
      const state = onPersist(handle, { reason: record, revision: payload });
      state && typeof state['then'] === 'function'
        ? state['then'](
            () => run3(payload, record),
            (config) => run4(payload, record, config),
          )
        : run3(payload, record);
    } catch (scope) {
      run4(payload, record, scope);
    }
    return handle;
  }
  function run6(input, output = 'replace-project', { shouldPersist: shouldPersist = true } = {}) {
    migrateStoryboard3DProject2 = migrateStoryboard3DProject(input, { now: now(), idFactory: idFactory });
    if (shouldPersist) return run5(output);
    return ((result = 'saved'), run2(output, { persisted: true }), run());
  }
  function run7(value2, handler2) {
    const value3 = run();
    return (
      handler2(value3),
      (value3['updatedAt'] = now()),
      (migrateStoryboard3DProject2 = migrateStoryboard3DProject(value3, {
        now: value3['updatedAt'],
        idFactory: idFactory,
      })),
      run5(value2)
    );
  }
  return {
    getSnapshot: run,
    getSaveStatus() {
      return result;
    },
    subscribe: emitter['subscribe'],
    load(value4) {
      return run6(value4, 'load-project', { shouldPersist: true });
    },
    replaceProject(value5, value6 = 'replace-project') {
      return run6(value5, value6, { shouldPersist: true });
    },
    updateProject(value7, value8) {
      if (typeof value8 !== 'function') return run();
      return run7(String(value7 || 'update-project'), value8);
    },
    save() {
      return run5('manual-save');
    },
    createNew(args2 = {}) {
      return run6(
        createStoryboard3DProject({ ...args2, now: now(), idFactory: idFactory }),
        'create-project',
        { shouldPersist: true },
      );
    },
    renameProject(value9) {
      const enabled = String(value9 || '')['trim']();
      if (!enabled || enabled === migrateStoryboard3DProject2['name']) return run();
      return run7('rename-project', (error) => {
        error['name'] = enabled;
      });
    },
    selectScene(value10) {
      const enabled2 = String(value10 || '')['trim']();
      if (!enabled2 || enabled2 === migrateStoryboard3DProject2['activeSceneId']) return run();
      if (!migrateStoryboard3DProject2['scenes']['some']((value11) => value11['id'] === enabled2))
        return run();
      return run7('select-scene', (value12) => {
        value12['activeSceneId'] = enabled2;
      });
    },
    selectShot(value13) {
      const value14 = String(value13 || '')['trim'](),
        activeStoryboard3DScene = getActiveStoryboard3DScene(migrateStoryboard3DProject2);
      if (
        !activeStoryboard3DScene ||
        !activeStoryboard3DScene['shots']['some']((value15) => value15['id'] === value14)
      )
        return run();
      if (activeStoryboard3DScene['activeShotId'] === value14) return run();
      return run7('select-shot', (value16) => {
        const value17 = value16['scenes']['find']((value18) => value18['id'] === value16['activeSceneId']);
        if (value17) value17['activeShotId'] = value14;
      });
    },
    destroy() {
      emitter['clear']();
    },
  };
}
