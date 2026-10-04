export function createCollaborationEditing({
  rpc: rpc,
  flush: flush,
  canEdit: canEdit,
  current: current,
  update: update,
  notify: notify,
  onChange: onChange,
}) {
  const editId = crypto['randomUUID'](),
    map = new Map();
  let promise = Promise['resolve'](),
    enabled = ![];
  const run = (value) => {
    const promise2 = promise['then'](value);
    return ((promise = promise2['catch'](() => {})), promise2);
  };
  function run2(list) {
    return run(async () => {
      if (!current() || enabled) return;
      const list2 = list['filter'](
        (enabled2) => !enabled2['refs'] && map['get'](enabled2['id']) === enabled2,
      );
      if (!list2['length']) return;
      try {
        await flush();
      } catch (error) {
        notify(error['message']);
      }
      if (!current() || enabled) return;
      const nodeIds = list2['filter'](
        (enabled3) => !enabled3['refs'] && map['get'](enabled3['id']) === enabled3,
      );
      if (!nodeIds['length']) return;
      for (const item of nodeIds) map['delete'](item['id']);
      onChange();
      const key = await rpc({
        action: 'endEdit',
        nodeIds: nodeIds['map']((index) => index['id']),
        editId: editId,
      });
      if (current() && !enabled) update(key);
    })['catch']((error2) => {
      if (current() && !enabled) notify(error2['message']);
    });
  }
  return {
    presence() {
      return Object['fromEntries'](
        [...map['values']()]['filter']((result) => result['acquired'])['map']((data) => [data['id'], editId]),
      );
    },
    pending() {
      return [...map['values']()]
        ['filter']((enabled4) => enabled4['refs'] && !enabled4['acquired'] && !enabled4['failed'])
        ['map']((options) => options['id']);
    },
    refresh(target) {
      for (const source of map['values']()) {
        const next = target?.[source['id']];
        if (next?.['editId'] === editId) source['expiresAt'] = next['expiresAt'] * 0x3e8;
      }
    },
    begin(entry) {
      let enabled5 = ![];
      const enabled6 = {
          ready: ![],
          pending: !![],
          allowed: () =>
            !enabled5 &&
            !enabled &&
            enabled6['ready'] &&
            current() &&
            list3['every']((record) => record['expiresAt'] > Date['now']()) &&
            canEdit(entry),
          canPreview: () =>
            !enabled5 &&
            !enabled &&
            current() &&
            canEdit(entry) &&
            ((enabled6['pending'] && list3['every']((enabled7) => !enabled7['failed'])) ||
              enabled6['allowed']()),
          wait: null,
          finish() {
            if (enabled5) return;
            enabled5 = !![];
            for (const payload of list3) payload['refs']--;
            return run2(list3);
          },
        },
        list3 = [];
      if (!current() || !canEdit(entry))
        return (
          notify('节点正在被其他成员编辑，或当前画布不可编辑'),
          (enabled6['pending'] = ![]),
          (enabled6['wait'] = Promise['resolve'](![])),
          enabled6
        );
      const nodeIds2 = [];
      for (const id of entry) {
        let enabled8 = map['get'](id);
        ((!enabled8 ||
          enabled8['failed'] ||
          (enabled8['acquired'] && enabled8['expiresAt'] <= Date['now']())) &&
          ((enabled8 = { id: id, refs: 0x0, acquired: ![], failed: ![], wait: null }),
          map['set'](id, enabled8),
          nodeIds2['push'](enabled8)),
          enabled8['refs']++,
          list3['push'](enabled8));
      }
      if (nodeIds2['length']) {
        const handle = run(async () => {
          if (!current() || enabled) return ![];
          await flush();
          if (!current() || enabled || !nodeIds2['some']((state) => state['refs'])) return ![];
          const config = await rpc({
            action: 'beginEdit',
            nodeIds: nodeIds2['map']((scope) => scope['id']),
            editId: editId,
          });
          if (!current() || enabled) return ![];
          await update(config);
          if (!current() || enabled) return ![];
          for (const input of nodeIds2) input['acquired'] = !![];
          return (onChange(), !![]);
        })['catch']((error3) => {
          for (const output of nodeIds2) output['failed'] = !![];
          return (current() && !enabled && (notify(error3['message']), onChange()), ![]);
        });
        for (const value2 of nodeIds2) value2['wait'] = handle;
      }
      return (
        (enabled6['ready'] = list3['every']((value3) => value3['acquired'])),
        (enabled6['pending'] = !enabled6['ready']),
        (enabled6['wait'] = Promise['all'](list3['map']((value4) => value4['wait']))['then']((list4) => {
          return (
            (enabled6['pending'] = ![]),
            (enabled6['ready'] = !enabled5 && list4['every'](Boolean) && current() && !enabled),
            enabled6['ready']
          );
        })),
        onChange(),
        enabled6
      );
    },
    dispose() {
      ((enabled = !![]), map['clear']());
    },
  };
}
