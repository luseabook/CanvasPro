export function createCollaborationPreviews(handler) {
  const map = new Map();
  return async (args) => {
    if (!handler) return args;
    args = { ...args, nodes: { ...args['nodes'] } };
    for (const args2 of Object['values'](args['nodes'])) {
      if (
        !['source-image', 'image', 'ai-image']['includes'](args2['type']) ||
        (args2['displayLocalPath'] && args2['thumbLocalPath'])
      )
        continue;
      const enabled = args2['originalLocalPath'] || args2['localPath'] || args2['src'];
      if (!enabled || enabled['startsWith']('aic-asset:')) continue;
      if (!map['has'](enabled))
        map['set'](
          enabled,
          Promise['resolve'](handler(enabled))['catch'](() => null),
        );
      const value = await map['get'](enabled);
      if (value?.['displayLocalPath'] && value?.['thumbLocalPath']) {
        const item = { ...args2 };
        for (const key of [
          'originalLocalPath',
          'displayLocalPath',
          'thumbLocalPath',
          'originalWidth',
          'originalHeight',
        ])
          if (value[key]) item[key] = value[key];
        args['nodes'][args2['id']] = item;
      }
    }
    return args;
  };
}
