import { bindDreaminaImageMenu } from './dreaminaModelMenuHelper.js';
import {
  bindImageModelMenuSubmenu,
  resolveApimartImageMenuSelection,
  resolveGrsaiImageMenuSelection,
  resolveRunningHubModelImageMenuSelection,
  resolveRunningHubWorkflowImageMenuSelection,
  resolveVolcengineImageMenuSelection,
  setImageModelTriggerIcon,
} from './uiModuleModelHelpers.js';
const SELECTION_RESOLVERS = new Map([
  ['.grsai-submenu', resolveGrsaiImageMenuSelection],
  ['.apimart-submenu', resolveApimartImageMenuSelection],
  ['.volcengine-submenu', resolveVolcengineImageMenuSelection],
  ['.runninghubwf-submenu', resolveRunningHubWorkflowImageMenuSelection],
  ['.runninghub-submenu', resolveRunningHubModelImageMenuSelection],
]);
export function bindImageModelMenuGroups({
  workflowSelectionPolicy: workflowSelectionPolicy = {},
  afterSelect: afterSelect,
  ...args
} = {}) {
  const { modelMenu: modelMenu, modelTrigger: modelTrigger } = args,
    list = [];
  for (const headerEl of modelMenu?.querySelectorAll('[data-node-menu-submenu]') || []) {
    const value = headerEl.dataset.nodeMenuSubmenu,
      submenuEl = modelMenu.querySelector(value);
    if (!submenuEl) continue;
    if (value === '.dreamina-submenu') {
      list.push(bindDreaminaImageMenu({ ...args, afterSelect: afterSelect }));
      continue;
    }
    list.push(
      bindImageModelMenuSubmenu({
        ...args,
        headerEl: headerEl,
        submenuEl: submenuEl,
        defaultProvider:
          headerEl.dataset.customProviderImageGroup ||
          submenuEl.querySelector('[data-provider]')?.dataset.provider ||
          '',
        resolveSelection: SELECTION_RESOLVERS.get(value),
        ...(value === '.runninghubwf-submenu' ? workflowSelectionPolicy : {}),
        afterSelect: (item) => {
          (setImageModelTriggerIcon(modelTrigger, item.provider, item.item), afterSelect?.(item));
        },
      }),
    );
  }
  return list;
}
