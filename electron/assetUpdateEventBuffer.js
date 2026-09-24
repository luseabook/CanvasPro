export const ASSET_UPDATE_EVENT_LIMIT = 200;

export function createAssetUpdateEventBuffer({ limit = ASSET_UPDATE_EVENT_LIMIT } = {}) {
  const capacity = Number.isFinite(limit) && limit > 0 ? Math.trunc(limit) : ASSET_UPDATE_EVENT_LIMIT;
  let events = [];
  return {
    push(event) {
      if (!event) return;
      events.push(event);
      while (events.length > capacity) events.shift();
    },
    consume() {
      return events.splice(0, events.length);
    },
  };
}
