import { createCollaborationJournal } from './collaborationJournal.js';
const KEY = 'aicanvas.collaboration.host-canvases.v1';
export function createCollaborationCanvasBinding({
  storage: storage,
  canvasTabs: canvasTabs,
  actorId: actorId,
  hosting: hosting = true,
}) {
  const value = hosting ? KEY : 'aicanvas.collaboration.guest-canvases.v1',
    store = new Map(),
    map = new Map();
  function run(roomId) {
    const key = actorId() + ':' + roomId;
    if (!store.has(key))
      store.set(
        key,
        createCollaborationJournal({
          roomId: roomId,
          actorId: actorId(),
          clientId: hosting ? 'host-canvas-baseline' : 'guest-canvas-baseline',
        }),
      );
    return { key: key, store: store.get(key) };
  }
  function run2() {
    try {
      const item = JSON.parse(storage?.getItem(value) || '{}');
      return item && typeof item === 'object' && !Array.isArray(item) ? item : {};
    } catch {
      return {};
    }
  }
  function projectId(index) {
    return canvasTabs.getCanvasProjectContext?.(index)?.projectId || '';
  }
  async function run3(result) {
    const event = run(result);
    return map.get(event.key) || (await event.store.read());
  }
  return {
    async baseline(data) {
      return (await run3(data))?.hostBase || null;
    },
    async mediaBindings(options) {
      return (await run3(options))?.mediaBindings || [];
    },
    async checkpoint(target, hostBase, mediaBindings2 = []) {
      const event2 = run(target),
        structuredClone2 = structuredClone({ hostBase: hostBase, mediaBindings: mediaBindings2 });
      (map.set(event2.key, structuredClone2), await event2.store.write(structuredClone2));
    },
    async close() {
      await Promise.all([...store.values()].map((source) => source.close()));
    },
    originalAccess(next, current) {
      const entry = run2()[actorId() + ':' + next];
      return entry && Object.hasOwn(entry, 'originalAccess') ? entry.originalAccess : current;
    },
    remember(roomId2, canvasId, originalAccess2 = null, resume = null) {
      const record = run2(),
        payload = actorId() + ':' + roomId2;
      (delete record[payload],
        (record[payload] = {
          roomId: roomId2,
          canvasId: canvasId,
          projectId: projectId(canvasId),
          originalAccess: originalAccess2,
          resume: resume,
        }),
        storage?.setItem(value, JSON.stringify(record)));
    },
    resumeFor(handle) {
      const state = this.roomFor(handle);
      return run2()[actorId() + ':' + state]?.resume || null;
    },
    forget(config) {
      const scope = run2();
      (delete scope[actorId() + ':' + config], storage?.setItem(value, JSON.stringify(scope)));
    },
    roomFor(input, list) {
      const output = projectId(input);
      return Object.entries(run2())
        .reverse()
        .find(
          ([value2, enabled]) =>
            value2.startsWith(actorId() + ':') &&
            (!list || list.includes(enabled.roomId)) &&
            ((enabled.canvasId === input && (!enabled.projectId || enabled.projectId === output)) ||
              (output && enabled.projectId === output)),
        )?.[1]?.roomId;
    },
    async activate(value3) {
      const enabled2 = run2()[actorId() + ':' + value3];
      if (!enabled2) return false;
      if (
        canvasTabs.getActiveCanvasId() === enabled2.canvasId &&
        (!enabled2.projectId || projectId(enabled2.canvasId) === enabled2.projectId)
      )
        return true;
      const list2 = canvasTabs.getPersistenceRevisionSnapshot?.()?.canvases || [],
        enabled3 =
          list2.find(
            (value4) =>
              value4.id === enabled2.canvasId &&
              (!enabled2.projectId || projectId(value4.id) === enabled2.projectId),
          ) ||
          (enabled2.projectId &&
            list2.find((value5) => projectId(value5.id) === enabled2.projectId));
      if (!enabled3) return false;
      await canvasTabs.switchTo(enabled3.id);
      if (canvasTabs.getActiveCanvasId() !== enabled3.id)
        throw new Error('无法切换到此房间的原画布，请先完成当前画布的操作');
      return true;
    },
  };
}
