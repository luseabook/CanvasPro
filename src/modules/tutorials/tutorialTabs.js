export function createTutorialTabs(el) {
  let value = '';
  function run() {
    const el2 = el.querySelector('[aria-selected="true"]');
    if (!el2) return;
    (el.style.setProperty('--tutorial-tab-x', el2.offsetLeft + 'px'),
      el.style.setProperty('--tutorial-tab-y', el2.offsetTop + 'px'),
      el.style.setProperty('--tutorial-tab-width', el2.offsetWidth + 'px'),
      el.style.setProperty('--tutorial-tab-height', el2.offsetHeight + 'px'));
  }
  const resizeObserver = new ResizeObserver(run);
  return (
    resizeObserver.observe(el),
    {
      update(list, item) {
        const key = JSON.stringify(list.map(({ id: id, title: title }) => [id, title]));
        if (value !== key) {
          const index = el.contains(document.activeElement);
          el.replaceChildren();
          for (const result of list) {
            const el3 = document.createElement('button');
            ((el3.type = 'button'),
              el3.setAttribute('role', 'tab'),
              (el3.dataset.tab = result.id),
              (el3.textContent = result.title),
              (el3.id = 'tutorial-tab-' + result.id),
              el3.setAttribute('aria-controls', 'tutorial-tab-content'),
              el.append(el3));
          }
          value = key;
          if (index) el.querySelector('[data-tab="' + item + '"]')?.focus();
        }
        for (const el4 of el.children) {
          const data = el4.dataset.tab === item;
          (el4.setAttribute('aria-selected', String(data)), (el4.tabIndex = data ? 0 : -1));
        }
        run();
      },
      close() {
        resizeObserver.disconnect();
      },
    }
  );
}
