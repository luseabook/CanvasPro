export function createCollaborationReviewState({
  rpc: rpc,
  current: current,
  initialRevision: initialRevision,
  onChange: onChange,
  onComment: onComment = () => {},
}) {
  let args = { revision: -1, summaries: [], activities: [], loading: ![], error: '' },
    value = null,
    item = -1,
    count = Number['isInteger'](initialRevision) ? initialRevision : -1;
  const run = (args2) => {
    current() && ((args = { ...args, ...args2 }), onChange(args));
  };
  function refresh(key = item, enabled = ![]) {
    if (!current() || !Number['isInteger'](key)) return Promise['resolve']();
    item = Math['max'](item, key);
    if (value) return value;
    if (!enabled && args['revision'] >= item && !args['error']) return Promise['resolve']();
    return (
      run({ loading: !![], error: '' }),
      (value = (async () => {
        try {
          do {
            const args3 = await rpc({ action: 'reviewRead' });
            if (!current()) return;
            if (
              !Number['isInteger'](args3['revision']) ||
              !Array['isArray'](args3['summaries']) ||
              !Array['isArray'](args3['activities'])
            )
              throw new Error('协作动态响应无效');
            const index =
              count < 0
                ? []
                : args3['activities']
                    ['filter'](
                      (result) => result['seq'] > count && ['comment', 'resolve']['includes'](result['kind']),
                    )
                    ['sort']((data, options) => data['seq'] - options['seq']);
            count = Math['max'](count, args3['revision']);
            for (const target of index) onComment(target);
            run({ ...args3, error: '' });
          } while (current() && args['revision'] < item);
        } catch (error) {
          run({ error: error['name'] === 'AbortError' ? '' : error['message'] });
        } finally {
          ((value = null), run({ loading: ![] }));
        }
      })()),
      value
    );
  }
  return {
    snapshot: () => args,
    refresh: refresh,
    async readChat(args4 = {}) {
      const source = await rpc({ ...args4, action: 'chatRead' });
      if (!current()) throw new DOMException('Aborted', 'AbortError');
      return source;
    },
    async readNode(nodeId) {
      const next = await rpc({ action: 'commentRead', nodeId: nodeId });
      if (!current()) throw new DOMException('Aborted', 'AbortError');
      return next;
    },
    async write(action, args5) {
      if (!current()) throw new DOMException('Aborted', 'AbortError');
      const entry = await rpc({ action: action, ...args5 });
      if (!current()) throw new DOMException('Aborted', 'AbortError');
      return (await refresh(entry['revision']), entry);
    },
  };
}
