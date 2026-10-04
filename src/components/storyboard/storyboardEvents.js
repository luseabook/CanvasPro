export function bindStoryboardNodeEvents(
  enabled,
  { store: store, normalizeEmptyCell: normalizeEmptyCell } = {},
) {
  const el = enabled.el,
    value = el.querySelector('.act-aspect'),
    item = el.querySelector('.act-grid'),
    key = el.querySelector('.act-split-lines'),
    index = el.querySelector('.act-edit'),
    result = el.querySelector('.act-compose'),
    data = el.querySelector('.act-clear'),
    options = el.querySelector('.act-collapse');
  [value, item, key, index, result, data, options].forEach((el2) => {
    if (!el2) return;
    (el2.addEventListener('pointerdown', (event) => event.stopPropagation()),
      el2.addEventListener('dblclick', (event2) => event2.stopPropagation()));
  });
  key &&
    (key.onclick = async (event3) => {
      (event3.stopPropagation(), event3.target.closest('button')?.blur());
      if (enabled._isCustomGridEditing) {
        await enabled._confirmCustomGridEdit();
        if (!enabled._isCustomGridEditing) enabled._closeMenu();
        return;
      }
      enabled._enterCustomGridEdit() && enabled._showSplitLinesMenu(key);
    });
  index &&
    (index.onclick = (event4) => {
      (event4.stopPropagation(),
        event4.target.closest('button')?.blur(),
        enabled._toggleEdit(!enabled._isEditing));
    });
  enabled._container &&
    (enabled._container.ondblclick = (event5) => {
      (event5.stopPropagation(), enabled._toggleEdit(true));
    });
  value &&
    (value.onclick = (event6) => {
      (event6.stopPropagation(), event6.target.closest('button')?.blur());
      if (enabled._isCustomGridEditing) return;
      enabled._activeMenu === 'aspect' ? enabled._closeMenu() : enabled._showAspectMenu(value);
    });
  item &&
    (item.onclick = (event7) => {
      (event7.stopPropagation(), event7.target.closest('button')?.blur());
      if (enabled._isCustomGridEditing) return;
      enabled._activeMenu === 'grid' ? enabled._closeMenu() : enabled._showGridMenu(item);
    });
  result &&
    (result.onclick = async (event8) => {
      (event8.stopPropagation(), event8.target.closest('button')?.blur());
      if (enabled._isComposing) return;
      await enabled._compose();
    });
  data &&
    (data.onclick = (event9) => {
      (event9.stopPropagation(), event9.target.closest('button')?.blur());
      const cells = enabled._data.cells.map((item2) => normalizeEmptyCell(item2));
      store.updateNodeData(enabled.id, { cells: cells });
    });
  options &&
    (options.onclick = (event10) => {
      (event10.stopPropagation(),
        event10.target.closest('button')?.blur(),
        enabled._toggleCollapse(!enabled._isCollapsed));
    });
  const el3 = enabled.el.querySelector('.sb-collapsed-badge');
  el3 &&
    (el3.addEventListener('click', (event11) => {
      (event11.stopPropagation(), enabled._toggleCollapse(false));
    }),
    el3.addEventListener('mouseenter', () => {
      el3.style.background = 'var(--black-80)';
    }),
    el3.addEventListener('mouseleave', () => {
      el3.style.background = 'var(--black-60)';
    }));
}
