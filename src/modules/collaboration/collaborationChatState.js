export function createCollaborationChatState({
  getSession: getSession,
  onChange: onChange = () => {},
  onMention: onMention = () => {},
}) {
  let enabled = null,
    enabled2 = false,
    value = 0,
    enabled3 = false,
    item = 0,
    failed = null;
  const map = new Map(),
    handler = () => ({
      messages: [],
      body: '',
      nodeIds: [],
      mentions: [],
      loading: false,
      sending: false,
      error: '',
      unread: 0,
      mentioned: false,
      hasMore: false,
      revision: -1,
    });
  let body2 = handler(),
    enabled4 = false;
  const run = () => {
      if (!enabled2) onChange(body2);
    },
    handler2 = (key) => (key ? key['state']['roomId'] + ':' + key['state']['actorId'] : '');
  function sync() {
    const index = getSession();
    if (index !== enabled) {
      if (enabled)
        map['set'](handler2(enabled), {
          body: body2['body'],
          nodeIds: [...body2['nodeIds']],
          mentions: [...body2['mentions']],
          failed: failed,
        });
      ((enabled = index), value++, (enabled3 = false), (item = 0));
      const body3 = map['get'](handler2(index));
      ((failed = body3?.['failed'] || null),
        (body2 = {
          ...handler(),
          ...(body3 && {
            body: body3['body'],
            nodeIds: body3['nodeIds'],
            mentions: body3['mentions'],
          }),
        }),
        run());
    }
    if (!enabled || enabled2) return;
    item = Math['max'](item, enabled['state']['review']?.['chatRevision'] || 0);
    if (!enabled3 && (body2['revision'] < item || body2['revision'] < 0) && !body2['error']) void refresh();
  }
  async function refresh() {
    if (!enabled || enabled3 || enabled2) return;
    const result = enabled,
      data = value;
    ((enabled3 = true), (body2['loading'] = true), (body2['error'] = ''), run());
    try {
      let options;
      do {
        const enabled5 = body2['revision'] < 0,
          target = await result['review']['readChat'](enabled5 ? {} : { after: body2['revision'] });
        if (data !== value || enabled2) return;
        const map2 = new Set(body2['messages']['map']((source) => source['id'])),
          args = target['messages']['filter']((next) => !map2['has'](next['id']));
        (body2['messages']['push'](...args),
          body2['messages']['sort']((current, entry) => current['seq'] - entry['seq']));
        if (enabled5) body2['hasMore'] = target['hasMore'];
        if (!enabled5)
          for (const record of args) {
            if (!enabled4 && record['actor'] !== result['state']['actorId']) body2['unread']++;
            if (record['mentions']['includes'](result['state']['actorId'])) {
              if (!enabled4) body2['mentioned'] = true;
              onMention(record);
            }
          }
        ((options = !enabled5 && target['hasMore']),
          (body2['revision'] = options ? target['messages']['at'](-1)['seq'] : target['chatRevision']),
          run());
      } while (options || body2['revision'] < item);
    } catch (error) {
      if (data === value && !enabled2) body2['error'] = error['message'] || '聊天加载失败';
    } finally {
      data === value && !enabled2 && ((enabled3 = false), (body2['loading'] = false), run());
    }
  }
  async function older() {
    if (!enabled || enabled3 || !body2['hasMore'] || !body2['messages']['length']) return;
    const payload = enabled,
      handle = value;
    ((enabled3 = true), (body2['loading'] = true), (body2['error'] = ''), run());
    try {
      const args2 = await payload['review']['readChat']({ before: body2['messages'][0]['seq'] });
      if (handle !== value || enabled2) return;
      const map3 = new Set(body2['messages']['map']((state) => state['id']));
      (body2['messages']['unshift'](...args2['messages']['filter']((config) => !map3['has'](config['id']))),
        (body2['hasMore'] = args2['hasMore']));
    } catch (error2) {
      if (handle === value && !enabled2) body2['error'] = error2['message'];
    } finally {
      if (handle === value && !enabled2) {
        ((enabled3 = false), (body2['loading'] = false), run());
        if (body2['revision'] < item && !body2['error']) void refresh();
      }
    }
  }
  function edit(scope) {
    if (body2['sending']) return false;
    return (Object['assign'](body2, scope), run(), true);
  }
  async function send() {
    if (!enabled || body2['sending'] || (!body2['body']['trim']() && !body2['nodeIds']['length'])) return false;
    const input = enabled,
      output = value,
      args3 = {
        body: body2['body']['trim'](),
        nodeIds: [...body2['nodeIds']],
        mentions: [...body2['mentions']],
      },
      fingerprint = JSON['stringify'](args3),
      messageId = failed?.['fingerprint'] === fingerprint ? failed['messageId'] : crypto['randomUUID']();
    ((failed = { fingerprint: fingerprint, messageId: messageId }),
      (body2['sending'] = true),
      (body2['error'] = ''),
      run());
    try {
      await input['review']['write']('chatSend', { ...args3, messageId: messageId });
      if (output !== value || enabled2) return false;
      return (
        (body2['body'] = ''),
        (body2['nodeIds'] = []),
        (body2['mentions'] = []),
        (failed = null),
        await refresh(),
        true
      );
    } catch (error3) {
      if (output === value && !enabled2) body2['error'] = error3['message'] || '发送失败，请重试';
      return false;
    } finally {
      output === value && !enabled2 && ((body2['sending'] = false), run());
    }
  }
  return {
    sync: sync,
    refresh: refresh,
    older: older,
    edit: edit,
    send: send,
    snapshot: () => body2,
    setVisible(value2) {
      ((enabled4 = value2), value2 && ((body2['unread'] = 0), (body2['mentioned'] = false)), run());
    },
    destroy() {
      ((enabled2 = true), value++, map['clear']());
    },
  };
}
