export function bindRunningHubInstanceDevMode(
  el,
  { commitValue: commitValue, getNodeData: getNodeData, getNodeFieldValue: getNodeFieldValue },
) {
  const enabled = el?.ownerDocument?.defaultView || globalThis.window,
    handler = (value) => {
      const item = value?.detail?.enabled === true;
      el?.querySelectorAll?.('.ui-schema-instance-toggle[data-ui-schema-developer-values]')?.forEach?.((el2) => {
        let list = [];
        try {
          list = JSON.parse(el2.dataset.uiSchemaDeveloperValues || '[]').map((key) =>
            String(key),
          );
        } catch {
          list = [];
        }
        el2.dataset.uiSchemaDeveloperMode = item && list.length ? 'true' : 'false';
        if (item) return;
        const index = String(el2.dataset.uiSchemaField || '').trim(),
          result = typeof getNodeData === 'function' ? getNodeData() || {} : {},
          data = getNodeFieldValue(result, index, el2.dataset.uiSchemaDefault);
        index &&
          list.includes(String(data ?? '')) &&
          commitValue(index, el2.dataset.uiSchemaNormalDefault || 'default');
      });
    };
  return (
    enabled?.addEventListener?.('dev-mode-changed', handler),
    handler({ detail: { enabled: enabled?.DEV_MODE === true } }),
    () => {
      enabled?.removeEventListener?.('dev-mode-changed', handler);
    }
  );
}
