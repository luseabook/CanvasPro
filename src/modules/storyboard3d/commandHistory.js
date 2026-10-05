import { cloneStoryboard3DProject, syncStoryboard3DShotFromCameraObject } from './projectModel.js';
import { recordDirectorDeletions } from './directorRecovery.js';
function isPromise(value) {
  return value && typeof value['then'] === 'function';
}
function commandMethod(item, key) {
  if (key === 'execute') return item?.['execute'] || item?.['do'];
  if (key === 'redo') return item?.['redo'] || item?.['execute'] || item?.['do'];
  return item?.['undo'];
}
function invoke(index, result, data) {
  const commandMethod2 = commandMethod(index, result);
  if (typeof commandMethod2 !== 'function')
    throw new TypeError('Command ' + (index?.['type'] || 'unknown') + ' has no ' + result + ' handler');
  return commandMethod2['call'](index, data);
}
function createCompositeCommand(options, args) {
  const list = [...args];
  return {
    type: 'transaction',
    label: options,
    commands: list,
    execute(target) {
      let promise = null;
      return (
        list['forEach']((source) => {
          if (promise) {
            promise = promise['then'](() => invoke(source, 'redo', target));
            return;
          }
          const invoke2 = invoke(source, 'redo', target);
          if (isPromise(invoke2)) promise = Promise['resolve'](invoke2);
        }),
        promise
      );
    },
    undo(next) {
      let promise2 = null;
      return (
        [...list]['reverse']()['forEach']((current) => {
          if (promise2) {
            promise2 = promise2['then'](() => invoke(current, 'undo', next));
            return;
          }
          const invoke3 = invoke(current, 'undo', next);
          if (isPromise(invoke3)) promise2 = Promise['resolve'](invoke3);
        }),
        promise2
      );
    },
  };
}
export class CommandHistory {
  constructor({ context: context, limit: limit = 100, onChange: onChange } = {}) {
    ((this['context'] = context),
      (this['limit'] = Math['max'](1, Math['round'](Number(limit) || 100))),
      (this['onChange'] = typeof onChange === 'function' ? onChange : null),
      (this['undoStack'] = []),
      (this['redoStack'] = []),
      (this['transaction'] = null),
      (this['busy'] = false));
  }
  ['_notify'](entry, record = null) {
    this['onChange']?.(this['getSnapshot'](), { reason: entry, command: record });
  }
  ['_record'](payload) {
    if (this['transaction']) {
      (this['transaction']['commands']['push'](payload), this['_notify']('execute-in-transaction', payload));
      return;
    }
    const handle = this['undoStack'][this['undoStack']['length'] - 1],
      enabled =
        handle &&
        handle['mergeKey'] &&
        handle['mergeKey'] === payload['mergeKey'] &&
        typeof handle['mergeWith'] === 'function' &&
        handle['mergeWith'](payload) === true;
    if (!enabled) this['undoStack']['push'](payload);
    if (this['undoStack']['length'] > this['limit'])
      this['undoStack']['splice'](0, this['undoStack']['length'] - this['limit']);
    ((this['redoStack'] = []), this['_notify'](enabled ? 'merge' : 'execute', enabled ? handle : payload));
  }
  ['_run'](state, config, scope, input) {
    if (this['busy']) throw new Error('Command history is busy');
    let invoke4;
    try {
      invoke4 = invoke(state, config, this['context']);
    } catch (output) {
      input?.(output);
      throw output;
    }
    if (!isPromise(invoke4)) return (scope?.(invoke4), invoke4);
    return (
      (this['busy'] = true),
      this['_notify']('busy', state),
      Promise['resolve'](invoke4)['then'](
        (value2) => {
          return ((this['busy'] = false), scope?.(value2), value2);
        },
        (value3) => {
          ((this['busy'] = false), input?.(value3), this['_notify']('error', state));
          throw value3;
        },
      )
    );
  }
  ['execute'](enabled2) {
    if (!enabled2 || typeof enabled2 !== 'object') throw new TypeError('A command is required');
    return this['_run'](enabled2, 'execute', (value4) => {
      if (value4 !== false) this['_record'](enabled2);
    });
  }
  ['undo']() {
    if (this['transaction']) throw new Error('Cannot undo during a transaction');
    if (this['busy'] || this['undoStack']['length'] === 0) return false;
    const value5 = this['undoStack']['pop']();
    return this['_run'](
      value5,
      'undo',
      () => {
        (this['redoStack']['push'](value5), this['_notify']('undo', value5));
      },
      () => this['undoStack']['push'](value5),
    );
  }
  ['redo']() {
    if (this['transaction']) throw new Error('Cannot redo during a transaction');
    if (this['busy'] || this['redoStack']['length'] === 0) return false;
    const value6 = this['redoStack']['pop']();
    return this['_run'](
      value6,
      'redo',
      () => {
        (this['undoStack']['push'](value6), this['_notify']('redo', value6));
      },
      () => this['redoStack']['push'](value6),
    );
  }
  ['beginTransaction'](value7 = 'Transaction') {
    if (this['busy']) throw new Error('Command history is busy');
    if (this['transaction']) throw new Error('Nested command transactions are not supported');
    ((this['transaction'] = { label: String(value7 || 'Transaction'), commands: [] }),
      this['_notify']('begin-transaction'));
  }
  ['commitTransaction']() {
    if (!this['transaction']) return false;
    const value8 = this['transaction'];
    this['transaction'] = null;
    if (value8['commands']['length'] === 0) return (this['_notify']('empty-transaction'), false);
    const compositeCommand = createCompositeCommand(value8['label'], value8['commands']);
    this['undoStack']['push'](compositeCommand);
    if (this['undoStack']['length'] > this['limit'])
      this['undoStack']['splice'](0, this['undoStack']['length'] - this['limit']);
    return (
      (this['redoStack'] = []),
      this['_notify']('commit-transaction', compositeCommand),
      compositeCommand
    );
  }
  ['cancelTransaction']() {
    if (!this['transaction']) return false;
    const value9 = this['transaction'];
    this['transaction'] = null;
    const compositeCommand2 = createCompositeCommand(value9['label'], value9['commands']);
    if (value9['commands']['length'] === 0)
      return (this['_notify']('cancel-transaction', compositeCommand2), true);
    return this['_run'](compositeCommand2, 'undo', () =>
      this['_notify']('cancel-transaction', compositeCommand2),
    );
  }
  ['runTransaction'](value10, handler) {
    this['beginTransaction'](value10);
    let value11;
    try {
      value11 = handler(this);
    } catch (value12) {
      const value13 = this['cancelTransaction']();
      if (isPromise(value13))
        return value13['then'](() => {
          throw value12;
        });
      throw value12;
    }
    if (!isPromise(value11)) return (this['commitTransaction'](), value11);
    return Promise['resolve'](value11)['then'](
      (value14) => {
        return (this['commitTransaction'](), value14);
      },
      (value15) =>
        Promise['resolve'](this['cancelTransaction']())['then'](() => {
          throw value15;
        }),
    );
  }
  ['clear']() {
    if (this['busy']) throw new Error('Command history is busy');
    ((this['undoStack'] = []),
      (this['redoStack'] = []),
      (this['transaction'] = null),
      this['_notify']('clear'));
  }
  ['getSnapshot']() {
    return {
      canUndo: !this['busy'] && !this['transaction'] && this['undoStack']['length'] > 0,
      canRedo: !this['busy'] && !this['transaction'] && this['redoStack']['length'] > 0,
      undoCount: this['undoStack']['length'],
      redoCount: this['redoStack']['length'],
      busy: this['busy'],
      transactionActive: this['transaction'] !== null,
      transactionSize: this['transaction']?.['commands']['length'] || 0,
      nextUndoLabel: this['undoStack'][this['undoStack']['length'] - 1]?.['label'] || null,
      nextRedoLabel: this['redoStack'][this['redoStack']['length'] - 1]?.['label'] || null,
    };
  }
}
export function createCommandHistory(value16) {
  return new CommandHistory(value16);
}
function normalizeVector(value17, list2, value18 = -Infinity) {
  const value19 = Array['isArray'](value17) ? value17 : [];
  return list2['map']((value20, value21) =>
    Math['max'](value18, Number['isFinite'](Number(value19[value21])) ? Number(value19[value21]) : value20),
  );
}
function normalizeTransform(value22, value23) {
  return {
    position: normalizeVector(value22?.['position'], value23['position']),
    rotation: normalizeVector(value22?.['rotation'], value23['rotation']),
    scale: normalizeVector(value22?.['scale'], value23['scale'], 0.001),
  };
}
function getScene(value24, value25) {
  return value24?.['scenes']?.['find']((value26) => value26['id'] === value25) || null;
}
export function applyStoryboard3DObjectTransforms(
  value27,
  { sceneId: sceneId, transforms: transforms, respectLocks: respectLocks = true } = {},
) {
  const value28 = transforms && typeof transforms === 'object' ? transforms : {},
    cloneStoryboard3DProject2 = cloneStoryboard3DProject(value27),
    scene = getScene(cloneStoryboard3DProject2, sceneId);
  if (!scene) return { project: cloneStoryboard3DProject2, changedObjectIds: [] };
  const value29 = [];
  scene['objects']['forEach']((value30) => {
    if (!Object['prototype']['hasOwnProperty']['call'](value28, value30['id'])) return;
    if (respectLocks && value30['locked'] === true) return;
    const transform = normalizeTransform(value28[value30['id']], value30['transform']);
    if (JSON['stringify'](transform) === JSON['stringify'](value30['transform'])) return;
    const cloneStoryboard3DProject3 = cloneStoryboard3DProject(value30['transform']);
    ((value30['transform'] = transform),
      value30['type'] === 'camera' &&
        syncStoryboard3DShotFromCameraObject(scene, value30['id'], {
          previousTransform: cloneStoryboard3DProject3,
        }),
      value29['push'](value30['id']));
  });
  if (value29['length'] > 0) cloneStoryboard3DProject2['updatedAt'] = Date['now']();
  return { project: cloneStoryboard3DProject2, changedObjectIds: value29 };
}
function readTransforms(value31, value32, value33) {
  const value34 = new Set(value33),
    scene2 = getScene(value31, value32),
    value35 = {};
  return (
    (scene2?.['objects'] || [])['forEach']((value36) => {
      if (value34['has'](value36['id']))
        value35[value36['id']] = cloneStoryboard3DProject(value36['transform']);
    }),
    value35
  );
}
export function createStoryboard3DTransformCommand({
  sceneId: sceneId2,
  transforms: transforms2,
  label: label = 'Transform objects',
  mergeKey: mergeKey,
} = {}) {
  const cloneStoryboard3DProject4 = cloneStoryboard3DProject(transforms2 || {}),
    value37 = Object['keys'](cloneStoryboard3DProject4)['sort']();
  let transforms3 = null,
    cloneStoryboard3DProject5 = cloneStoryboard3DProject4;
  const value38 = sceneId2 + ':' + value37['join'](','),
    value39 = {
      type: 'transform-objects',
      label: label,
      mergeKey: mergeKey === false ? null : String(mergeKey || 'transform:' + value38),
      execute(value40) {
        const value41 = value40['getProject']();
        if (!transforms3) transforms3 = readTransforms(value41, sceneId2, value37);
        const storyboard3DObjectTransforms = applyStoryboard3DObjectTransforms(value41, {
          sceneId: sceneId2,
          transforms: cloneStoryboard3DProject5,
        });
        if (storyboard3DObjectTransforms['changedObjectIds']['length'] === 0) return false;
        return value40['replaceProject'](storyboard3DObjectTransforms['project'], {
          reason: 'transform-objects',
        });
      },
      undo(value42) {
        if (!transforms3) return false;
        const storyboard3DObjectTransforms2 = applyStoryboard3DObjectTransforms(value42['getProject'](), {
          sceneId: sceneId2,
          transforms: transforms3,
          respectLocks: false,
        });
        return value42['replaceProject'](storyboard3DObjectTransforms2['project'], {
          reason: 'undo-transform-objects',
        });
      },
      redo(value43) {
        const storyboard3DObjectTransforms3 = applyStoryboard3DObjectTransforms(value43['getProject'](), {
          sceneId: sceneId2,
          transforms: cloneStoryboard3DProject5,
          respectLocks: false,
        });
        return value43['replaceProject'](storyboard3DObjectTransforms3['project'], {
          reason: 'redo-transform-objects',
        });
      },
      mergeWith(value44) {
        if (value44?.['type'] !== 'transform-objects') return false;
        if (value44['_signature'] !== value38) return false;
        return ((cloneStoryboard3DProject5 = cloneStoryboard3DProject(value44['_afterTransforms'])), true);
      },
      _signature: value38,
      _afterTransforms: cloneStoryboard3DProject5,
    };
  return value39;
}
export function createStoryboard3DProjectMutationCommand({
  type: type = 'update-project',
  label: label = 'Update project',
  mutate: mutate,
} = {}) {
  if (typeof mutate !== 'function')
    throw new TypeError('A project mutation function is required');
  let cloneStoryboard3DProject6 = null,
    recordDirectorDeletions2 = null;
  return {
    type: String(type || 'update-project'),
    label: String(label || 'Update project'),
    execute(value45) {
      cloneStoryboard3DProject6 = cloneStoryboard3DProject(value45['getProject']());
      const cloneStoryboard3DProject7 = cloneStoryboard3DProject(cloneStoryboard3DProject6),
        value46 = mutate(cloneStoryboard3DProject7);
      recordDirectorDeletions2 = recordDirectorDeletions(
        cloneStoryboard3DProject6,
        cloneStoryboard3DProject(value46 || cloneStoryboard3DProject7),
        label,
      );
      if (JSON['stringify'](cloneStoryboard3DProject6) === JSON['stringify'](recordDirectorDeletions2))
        return false;
      return value45['replaceProject'](recordDirectorDeletions2, { reason: type });
    },
    undo(value47) {
      if (!cloneStoryboard3DProject6) return false;
      return value47['replaceProject'](cloneStoryboard3DProject(cloneStoryboard3DProject6), {
        reason: 'undo-' + type,
      });
    },
    redo(value48) {
      if (!recordDirectorDeletions2) return false;
      return value48['replaceProject'](cloneStoryboard3DProject(recordDirectorDeletions2), {
        reason: 'redo-' + type,
      });
    },
  };
}
