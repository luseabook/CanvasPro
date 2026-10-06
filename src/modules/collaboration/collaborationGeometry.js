import {
  setNodeGeometryPreview,
  clearNodeGeometryPreview,
  readNodeGeometryPreviewEntries,
} from '../../core/nodeGeometryPreview.js';
export function createCollaborationGeometry({
  store: store,
  getSession: getSession,
  windowObject: windowObject = globalThis.window,
}) {
  const symbol = Symbol('remote-geometry'),
    map = new Map();
  let geometry = {},
    value = '',
    item = null;
  function update() {
    const key = getSession(),
      enabled = key?.state,
      enabled2 = store.getStateRaw().nodes;
    key !== item && (clear(), (item = key));
    if (!enabled) return;
    const index = Date.now(),
      map2 = new Map(readNodeGeometryPreviewEntries()),
      handler = (result) => {
        const data = enabled.locks?.[result];
        return data?.clientId === enabled.clientId &&
          data.actorId === enabled.actorId &&
          data.expiresAt * 1000 > index
          ? data
          : null;
      },
      enabled3 = {};
    for (const [options, args] of map2) {
      const editId = handler(options);
      if (editId) enabled3[options] = { ...args, editId: editId.editId };
    }
    for (const [target, source] of Object.entries(geometry)) {
      if (
        !enabled3[target] &&
        handler(target)?.editId === source.editId &&
        Object.entries(source).every(
          ([next, current]) => next === 'editId' || enabled2[target]?.[next] === current,
        )
      )
        enabled3[target] = source;
    }
    geometry = enabled3;
    const entry = JSON.stringify(geometry);
    entry !== value && ((value = entry), key.setPresence({ geometry: geometry }));
    const map3 = new Map();
    for (const clientId of enabled.presence || []) {
      if (clientId.clientId === enabled.clientId || clientId.expiresAt * 1000 <= index) continue;
      for (const [record, payload] of Object.entries(clientId.geometry || {})) {
        const handle = enabled.locks?.[record];
        if (
          !enabled2[record] ||
          map2.has(record) ||
          handle?.clientId !== clientId.clientId ||
          handle.actorId !== clientId.actorId ||
          handle.editId !== payload.editId ||
          handle.expiresAt * 1000 <= index
        )
          continue;
        const patch = Object.fromEntries(
          Object.entries(payload).filter(
            ([state, config]) =>
              ['x', 'y', 'width', 'height'].includes(state) && Number.isFinite(config),
          ),
        );
        map3.set(record, { patch: patch, clientId: clientId.clientId });
      }
      if (clientId.geometryRevision > enabled.revision)
        for (const [scope, input] of map) {
          if (
            !map3.has(scope) &&
            !map2.has(scope) &&
            enabled2[scope] &&
            input.clientId === clientId.clientId
          )
            map3.set(scope, input);
        }
    }
    const list = [...map.keys()].filter((output) => !map3.has(output));
    if (list.length) clearNodeGeometryPreview(list, symbol);
    const list2 = [...map3].filter(
      ([value2, value3]) => JSON.stringify(map.get(value2)) !== JSON.stringify(value3),
    );
    if (list2.length)
      setNodeGeometryPreview(
        list2.map(([value4, value5]) => [value4, value5.patch]),
        symbol,
      );
    const list3 = [
      ...list.filter((value6) => !map2.has(value6)).map((value7) => [value7, null]),
      ...[...map3].map(([value8, value9]) => [value8, value9.patch]),
    ];
    if (list3.length) windowObject?.v2Renderer?.previewNodeGeometry?.(list3);
    map.clear();
    for (const [value10, value11] of map3) map.set(value10, value11);
  }
  function clear() {
    const list4 = [...map.keys()];
    (clearNodeGeometryPreview(list4, symbol),
      windowObject?.v2Renderer?.previewNodeGeometry?.(list4.map((value12) => [value12, null])),
      map.clear(),
      (geometry = {}),
      (value = ''));
  }
  return { update: update, clear: clear, active: () => map.size > 0 };
}
