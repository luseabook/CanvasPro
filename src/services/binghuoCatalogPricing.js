export function withoutBinghuoCatalogPrices(models) {
  const displayName = (value) =>
    String(value || '').replace(/\s+(?:[¥￥]\s*)?\d+(?:\.\d+)?\s*元\s*[\/／]\s*[^\s\/／]{1,16}\s*$/u, '');
  return {
    ...models,
    models: models.models.map((args) => {
      const extensions = { ...args.extensions };
      for (const item of ['imageMenu', 'videoMenu']) {
        if (!extensions[item]) continue;
        const { priceText: priceText, ...args2 } = extensions[item];
        for (const key of ['title', 'label']) if (key in args2) args2[key] = displayName(args2[key]);
        extensions[item] = args2;
      }
      return {
        ...args,
        displayName: displayName(args.displayName),
        ...(args.extensions ? { extensions: extensions } : {}),
      };
    }),
  };
}
