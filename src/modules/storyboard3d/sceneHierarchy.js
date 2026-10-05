import { cloneStoryboard3DProject, createDefaultStoryboard3DTransform } from './projectModel.js';
function normalizeId(value) {
  return String(value || '')['trim']();
}
function normalizeName(item) {
  return String(item || '')['trim']();
}
function finite(key, index = 0) {
  const result = Number(key);
  return Number['isFinite'](result) ? result : index;
}
function normalizeVector3(data, options) {
  const target = Array['isArray'](data) ? data : [];
  return [
    finite(target[0], options[0]),
    finite(target[1], options[1]),
    finite(target[2], options[2]),
  ];
}
function normalizeTransform(source) {
  return {
    position: normalizeVector3(source?.['position'], [0, 0, 0]),
    rotation: normalizeVector3(source?.['rotation'], [0, 0, 0]),
    scale: normalizeVector3(source?.['scale'], [1, 1, 1])['map']((next) => Math['max'](0.001, next)),
  };
}
function cloneScene(current) {
  return cloneStoryboard3DProject(current);
}
function objectMap(entry) {
  return new Map(
    (Array['isArray'](entry?.['objects']) ? entry['objects'] : [])['map']((record) => [
      normalizeId(record?.['id']),
      record,
    ]),
  );
}
function requireObject(payload, handle) {
  const objectMap2 = objectMap(payload)['get'](normalizeId(handle));
  if (!objectMap2) throw new Error('Storyboard object does not exist: ' + handle);
  return objectMap2;
}
function requireGroup(state, config) {
  const requireObject2 = requireObject(state, config);
  if (requireObject2['type'] !== 'group') throw new Error('Storyboard parent must be a group: ' + config);
  return requireObject2;
}
function createGroupId(scope, handler) {
  const map = new Set((scope['objects'] || [])['map']((input) => normalizeId(input['id'])));
  if (typeof handler === 'function') {
    for (let count = 0; count < 1000; count += 1) {
      const id = normalizeId(handler('group'));
      if (id && !map['has'](id)) return id;
    }
    throw new Error('Unable to create a unique storyboard group id');
  }
  let output = 1,
    value2 = 'group-' + output;
  while (map['has'](value2)) {
    ((output += 1), (value2 = 'group-' + output));
  }
  return value2;
}
function assertValidHierarchy(value3) {
  const response = validateStoryboard3DSceneHierarchy(value3);
  if (!response['ok']) {
    const error = new Error(response['errors']['map']((value4) => value4['message'])['join'](' '));
    ((error['code'] = 'STORYBOARD_3D_HIERARCHY_INVALID'), (error['details'] = response));
    throw error;
  }
  return value3;
}
function assignParent(value5, value6) {
  const id2 = normalizeId(value6);
  if (id2) value5['parentId'] = id2;
  else delete value5['parentId'];
}
function collectDescendantIds(value7, value8) {
  const map2 = new Map();
  (value7['objects'] || [])['forEach']((value9) => {
    const id3 = normalizeId(value9['parentId']);
    if (!id3) return;
    if (!map2['has'](id3)) map2['set'](id3, []);
    map2['get'](id3)['push'](normalizeId(value9['id']));
  });
  const value10 = new Set(),
    value11 = [...(map2['get'](normalizeId(value8)) || [])];
  while (value11['length'] > 0) {
    const enabled = value11['pop']();
    if (!enabled || value10['has'](enabled)) continue;
    (value10['add'](enabled), value11['push'](...(map2['get'](enabled) || [])));
  }
  return value10;
}
export function validateStoryboard3DSceneHierarchy(value12) {
  const list = [],
    list2 = Array['isArray'](value12?.['objects']) ? value12['objects'] : [],
    map3 = new Map();
  (list2['forEach']((value13, value14) => {
    const id4 = normalizeId(value13?.['id']);
    if (!id4) {
      list['push']({
        code: 'HIERARCHY_OBJECT_ID_REQUIRED',
        objectId: '',
        message: 'Scene object at index ' + value14 + ' has no id.',
      });
      return;
    }
    if (map3['has'](id4)) {
      list['push']({
        code: 'HIERARCHY_DUPLICATE_OBJECT_ID',
        objectId: id4,
        message: 'Duplicate storyboard object id: ' + id4 + '.',
      });
      return;
    }
    map3['set'](id4, value13);
  }),
    map3['forEach']((value15, value16) => {
      const id5 = normalizeId(value15['parentId']);
      if (!id5) return;
      if (id5 === value16) {
        list['push']({
          code: 'HIERARCHY_SELF_PARENT',
          objectId: value16,
          parentId: id5,
          message: 'Storyboard object cannot parent itself: ' + value16 + '.',
        });
        return;
      }
      const enabled2 = map3['get'](id5);
      if (!enabled2) {
        list['push']({
          code: 'HIERARCHY_PARENT_NOT_FOUND',
          objectId: value16,
          parentId: id5,
          message: 'Storyboard parent does not exist: ' + id5 + '.',
        });
        return;
      }
      enabled2['type'] !== 'group' &&
        list['push']({
          code: 'HIERARCHY_PARENT_NOT_GROUP',
          objectId: value16,
          parentId: id5,
          message: 'Storyboard parent must be a group: ' + id5 + '.',
        });
    }));
  const value17 = new Map();
  function run(value18, list3 = []) {
    const value19 = value17['get'](value18);
    if (value19 === 'visited') return;
    if (value19 === 'visiting') {
      const value20 = list3['indexOf'](value18),
        value21 = [...list3['slice'](Math['max'](0, value20)), value18];
      list['push']({
        code: 'HIERARCHY_CYCLE',
        objectId: value18,
        cycle: value21,
        message: 'Storyboard hierarchy contains a cycle: ' + value21['join'](' -> ') + '.',
      });
      return;
    }
    value17['set'](value18, 'visiting');
    const id6 = normalizeId(map3['get'](value18)?.['parentId']);
    if (id6 && map3['has'](id6)) run(id6, [...list3, value18]);
    value17['set'](value18, 'visited');
  }
  return (
    map3['forEach']((value22, value23) => run(value23)),
    {
      ok: list['length'] === 0,
      errors: list,
      objectCount: list2['length'],
      groupCount: list2['filter']((value24) => value24?.['type'] === 'group')['length'],
    }
  );
}
export function createStoryboard3DSceneGroup(
  value25,
  {
    id: id7,
    name: name = 'Group',
    transform: transform = createDefaultStoryboard3DTransform(),
    parentId: parentId,
    childIds: childIds = [],
    idFactory: idFactory,
  } = {},
) {
  const cloneScene2 = cloneScene(value25),
    id8 = normalizeId(id7);
  if (id8 && objectMap(cloneScene2)['has'](id8))
    throw new Error('Storyboard object id already exists: ' + id8);
  if (parentId) requireGroup(cloneScene2, parentId);
  const value26 = id8 || createGroupId(cloneScene2, idFactory);
  ((cloneScene2['objects'] = Array['isArray'](cloneScene2['objects']) ? cloneScene2['objects'] : []),
    cloneScene2['objects']['push']({
      id: value26,
      type: 'group',
      name: normalizeName(name) || 'Group',
      visible: !![],
      locked: ![],
      transform: normalizeTransform(transform),
      ...(normalizeId(parentId) ? { parentId: normalizeId(parentId) } : {}),
    }));
  const value27 = [...new Set(childIds['map'](normalizeId)['filter'](Boolean))];
  return (
    value27['forEach']((value28) => {
      const requireObject3 = requireObject(cloneScene2, value28);
      assignParent(requireObject3, value26);
    }),
    assertValidHierarchy(cloneScene2)
  );
}
export function setStoryboard3DObjectParent(value29, value30, value31 = null) {
  const cloneScene3 = cloneScene(value29),
    requireObject4 = requireObject(cloneScene3, value30);
  if (value31) requireGroup(cloneScene3, value31);
  return (assignParent(requireObject4, value31), assertValidHierarchy(cloneScene3));
}
export function addStoryboard3DObjectsToGroup(value32, value33, value34) {
  const cloneScene4 = cloneScene(value32);
  requireGroup(cloneScene4, value34);
  const list4 = [
    ...new Set((Array['isArray'](value33) ? value33 : [])['map'](normalizeId)['filter'](Boolean)),
  ];
  return (
    list4['forEach']((value35) => {
      const requireObject5 = requireObject(cloneScene4, value35);
      assignParent(requireObject5, value34);
    }),
    assertValidHierarchy(cloneScene4)
  );
}
export function groupStoryboard3DSceneObjects(value36, value37, args = {}) {
  return createStoryboard3DSceneGroup(value36, {
    ...args,
    childIds: Array['isArray'](value37) ? value37 : [],
  });
}
export function renameStoryboard3DSceneGroup(value38, value39, value40) {
  const cloneScene5 = cloneScene(value38),
    requireGroup2 = requireGroup(cloneScene5, value39),
    name2 = normalizeName(value40);
  if (name2) requireGroup2['name'] = name2;
  return cloneScene5;
}
export function ungroupStoryboard3DSceneGroup(value41, value42) {
  return deleteStoryboard3DSceneGroup(value41, value42, { deleteChildren: ![] });
}
export function deleteStoryboard3DSceneGroup(
  value43,
  value44,
  { deleteChildren: deleteChildren = ![] } = {},
) {
  const cloneScene6 = cloneScene(value43),
    requireGroup3 = requireGroup(cloneScene6, value44),
    id9 = normalizeId(value44),
    id10 = normalizeId(requireGroup3['parentId']);
  if (deleteChildren) {
    const descendantIds = collectDescendantIds(cloneScene6, id9);
    (descendantIds['add'](id9),
      (cloneScene6['objects'] = cloneScene6['objects']['filter'](
        (value45) => !descendantIds['has'](normalizeId(value45['id'])),
      )));
  } else
    (cloneScene6['objects']['forEach']((value46) => {
      normalizeId(value46['parentId']) === id9 && assignParent(value46, id10);
    }),
      (cloneScene6['objects'] = cloneScene6['objects']['filter'](
        (value47) => normalizeId(value47['id']) !== id9,
      )));
  return assertValidHierarchy(cloneScene6);
}
export function applyStoryboard3DHierarchyOperation(
  value48,
  value49,
  value50,
  { now: now, idFactory: idFactory2 } = {},
) {
  const cloneStoryboard3DProject2 = cloneStoryboard3DProject(value48),
    count2 = (
      Array['isArray'](cloneStoryboard3DProject2['scenes']) ? cloneStoryboard3DProject2['scenes'] : []
    )['findIndex']((value51) => value51['id'] === value49);
  if (count2 < 0) throw new Error('Storyboard scene does not exist: ' + value49);
  const id11 = normalizeId(value50?.['type']),
    args2 = value50?.['args'] && typeof value50['args'] === 'object' ? value50['args'] : {},
    value52 = cloneStoryboard3DProject2['scenes'][count2];
  if (id11 === 'create-group')
    cloneStoryboard3DProject2['scenes'][count2] = createStoryboard3DSceneGroup(value52, {
      ...args2,
      idFactory: idFactory2,
    });
  else {
    if (id11 === 'group-objects')
      cloneStoryboard3DProject2['scenes'][count2] = groupStoryboard3DSceneObjects(
        value52,
        args2['objectIds'],
        { ...args2, idFactory: idFactory2 },
      );
    else {
      if (id11 === 'add-to-group')
        cloneStoryboard3DProject2['scenes'][count2] = addStoryboard3DObjectsToGroup(
          value52,
          args2['objectIds'],
          args2['groupId'],
        );
      else {
        if (id11 === 'set-parent')
          cloneStoryboard3DProject2['scenes'][count2] = setStoryboard3DObjectParent(
            value52,
            args2['objectId'],
            args2['parentId'],
          );
        else {
          if (id11 === 'rename-group')
            cloneStoryboard3DProject2['scenes'][count2] = renameStoryboard3DSceneGroup(
              value52,
              args2['groupId'],
              args2['name'],
            );
          else {
            if (id11 === 'ungroup')
              cloneStoryboard3DProject2['scenes'][count2] = ungroupStoryboard3DSceneGroup(
                value52,
                args2['groupId'],
              );
            else {
              if (id11 === 'delete-group')
                cloneStoryboard3DProject2['scenes'][count2] = deleteStoryboard3DSceneGroup(
                  value52,
                  args2['groupId'],
                  { deleteChildren: args2['deleteChildren'] === !![] },
                );
              else throw new Error('Unsupported storyboard hierarchy operation: ' + id11);
            }
          }
        }
      }
    }
  }
  return (
    (cloneStoryboard3DProject2['updatedAt'] = Math['max'](
      0,
      finite(now, finite(cloneStoryboard3DProject2['updatedAt'], 0)),
    )),
    cloneStoryboard3DProject2
  );
}
