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
  afterSelect: _0x3f8e9c,
  ..._0x24bb05
} = {}) {
  const { modelMenu: _0x13bd91, modelTrigger: _0x2624d4 } = _0x24bb05,
    _0x4d9d32 = [];
  for (const _0xaa5214 of _0x13bd91?.['querySelectorAll']('[data-node-menu-submenu]') || []) {
    const _0x37cb4d = _0xaa5214['dataset']['nodeMenuSubmenu'],
      _0x3c7323 = _0x13bd91['querySelector'](_0x37cb4d);
    if (!_0x3c7323) continue;
    if (_0x37cb4d === '.dreamina-submenu') {
      _0x4d9d32['push'](bindDreaminaImageMenu({ ..._0x24bb05, afterSelect: _0x3f8e9c }));
      continue;
    }
    _0x4d9d32['push'](
      bindImageModelMenuSubmenu({
        ..._0x24bb05,
        headerEl: _0xaa5214,
        submenuEl: _0x3c7323,
        defaultProvider:
          _0xaa5214['dataset']['customProviderImageGroup'] ||
          _0x3c7323['querySelector']('[data-provider]')?.['dataset']['provider'] ||
          '',
        resolveSelection: SELECTION_RESOLVERS['get'](_0x37cb4d),
        ...(_0x37cb4d === '.runninghubwf-submenu' ? workflowSelectionPolicy : {}),
        afterSelect: (_0x57045a) => {
          (setImageModelTriggerIcon(_0x2624d4, _0x57045a['provider'], _0x57045a['item']),
            _0x3f8e9c?.(_0x57045a));
        },
      }),
    );
  }
  return _0x4d9d32;
}
