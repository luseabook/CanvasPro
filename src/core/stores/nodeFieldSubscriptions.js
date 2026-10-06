export function createNodeFieldSubscriptions(handler) {
  const map = new Map();
  function touch(value) {
    const item = handler()[value];
    for (const [key, map2] of map) {
      const index = item?.[key];
      if (map2.values.get(value) === index) continue;
      if (index === undefined) map2.values.delete(value);
      else map2.values.set(value, index);
      map2.dirty = true;
    }
  }
  function reload() {
    for (const [result, map3] of map) {
      ((map3.values = new Map(
        Object.values(handler())
          .filter((data) => data?.[result] !== undefined)
          .map((options) => [options.id, options[result]]),
      )),
        (map3.dirty = true));
    }
  }
  return {
    touch: touch,
    reload: reload,
    flush() {
      for (const map4 of map.values()) {
        if (!map4.dirty) continue;
        map4.dirty = false;
        const target = [...map4.values.values()];
        for (const run of [...map4.listeners]) run(target);
      }
    },
    subscribe(enabled, handler2) {
      if (typeof enabled !== 'string' || !enabled || typeof handler2 !== 'function')
        throw new TypeError('Expected a node field and listener');
      let map5 = map.get(enabled);
      return (
        !map5 &&
          ((map5 = {
            values: new Map(
              Object.values(handler())
                .filter((source) => source?.[enabled] !== undefined)
                .map((next) => [next.id, next[enabled]]),
            ),
            listeners: new Set(),
            dirty: false,
          }),
          map.set(enabled, map5)),
        map5.listeners.add(handler2),
        handler2([...map5.values.values()]),
        () => {
          map5.listeners.delete(handler2);
          if (!map5.listeners.size) map.delete(enabled);
        }
      );
    },
  };
}
