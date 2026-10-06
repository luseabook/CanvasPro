import { graphChangesConflict } from './collaborationDocument.js';
import { mergeCollaborationFields } from './collaborationFieldMerge.js';
export function createCollaborationConflicts() {
  const map = new Map(),
    handler = (value) => value.kind + ':' + value.id;
  return {
    has: (item) => map.has(handler(item)),
    list: () => [...map.values()],
    clear: () => map.clear(),
    hold(key) {
      for (const kind of key) map.set(handler(kind), { kind: kind.kind, id: kind.id });
    },
    blocks(list, state) {
      return [...map.values()].some((index) =>
        index.kind === 'nodes'
          ? list.includes(index.id)
          : [state.edges[index.id]?.sourceId, state.edges[index.id]?.targetId].some(
              (result) => list.includes(result),
            ),
      );
    },
    reconcile(list2, list3, data) {
      for (const options of list2) {
        if (map.has(handler(options))) continue;
        const list4 = list3.filter((target) => graphChangesConflict([options], [target], data));
        if (!list4.length) continue;
        try {
          if (list4.some((source) => handler(source) !== handler(options)))
            throw new Error('dependent edit');
          mergeCollaborationFields(
            options.before,
            options.after,
            data[options.kind][options.id] ?? null,
          );
        } catch {
          this.hold([options, ...list4]);
        }
      }
      return list2.filter((next) => !map.has(handler(next)));
    },
  };
}
export function partitionCollaborationConflict(blocked, dom, current, entry) {
  const run = (record) =>
      new Set(
        record.kind === 'nodes'
          ? [record.id, record.before?.parentId, record.after?.parentId].filter(Boolean)
          : [
              record.before?.sourceId,
              record.before?.targetId,
              record.after?.sourceId,
              record.after?.targetId,
            ].filter(Boolean),
      ),
    map2 = new Set();
  for (const payload of blocked) {
    try {
      mergeCollaborationFields(
        payload.before,
        payload.after,
        dom.document[payload.kind][payload.id] ?? null,
      );
    } catch {
      map2.add(payload);
    }
    for (const handle of run(payload)) {
      const config = dom.locks?.[handle],
        scope = dom.jobs?.find(
          (response) => response.node === handle && response.status === 'running',
        );
      if (
        (config &&
          config.expiresAt * 1000 > Date.now() &&
          (config.actorId !== current || config.clientId !== entry)) ||
        (scope && (scope.actor !== current || scope.client !== entry))
      )
        map2.add(payload);
    }
  }
  if (!map2.size) return { blocked: blocked, safe: [] };
  let input;
  do {
    input = map2.size;
    const map3 = new Set([...map2].flatMap((output) => [...run(output)]));
    for (const value2 of blocked)
      if ([...run(value2)].some((value3) => map3.has(value3))) map2.add(value2);
  } while (input !== map2.size);
  return { blocked: [...map2], safe: blocked.filter((value4) => !map2.has(value4)) };
}
