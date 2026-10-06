export function createApiRouteSelection({
  buttons: buttons,
  urlElement: urlElement,
  routes: routes,
  resolveConfig: resolveConfig,
  getButtonRouteId: getButtonRouteId,
  formatCustomUrl: formatCustomUrl,
}) {
  let value = '';
  function run(item, key = '') {
    const enabled = routes.find((index) => index.id === item);
    ((value = enabled?.id || ''),
      buttons.forEach((el) => {
        const result = !!enabled && getButtonRouteId(el) === enabled.id;
        (el.classList.toggle('is-active', result), el.setAttribute('aria-pressed', String(result)));
      }),
      urlElement && (urlElement.textContent = enabled?.apiUrl || formatCustomUrl(key)));
  }
  return {
    hydrate(options = {}) {
      const data = resolveConfig(options);
      run(data.routeId, data.apiUrl);
    },
    collect(args = {}) {
      const routeId = routes.find((target) => target.id === value),
        source = { ...args };
      if (routeId) Object.assign(source, { routeId: routeId.id, apiUrl: routeId.apiUrl });
      else {
        if (source.apiUrl) delete source.routeId;
      }
      return source;
    },
    bind(handler) {
      buttons.forEach((el2) => {
        el2.addEventListener('click', () => {
          (run(getButtonRouteId(el2)), handler());
        });
      });
    },
  };
}
