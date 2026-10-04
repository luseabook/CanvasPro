export function createRendererStartupState() {
  let phase = 'entry',
    failure = '';
  const map = new Set(),
    map2 = new Set();
  let run;
  const settled = new Promise((value) => {
      run = value;
    }),
    snapshot = () => ({ phase: phase, failure: failure, ready: phase === 'ready' }),
    handler = () => {
      const item = snapshot();
      for (const run2 of map2) run2(item);
      if (item['ready'] || failure) run(item);
      return item;
    };
  return {
    snapshot: snapshot,
    settled: settled,
    subscribe(handler2) {
      return (map2['add'](handler2), handler2(snapshot()), () => map2['delete'](handler2));
    },
    setPhase(key) {
      if (failure || phase === 'ready') return;
      ((phase = key), handler());
    },
    complete(index) {
      if (failure || phase === 'ready') return;
      map['add'](index);
      if (map['has']('entry') && map['has']('project')) phase = 'ready';
      handler();
    },
    fail(result = 'initialization') {
      if (failure || phase === 'ready') return ![];
      return ((failure = result), handler(), !![]);
    },
  };
}
export const rendererStartupState = createRendererStartupState();
