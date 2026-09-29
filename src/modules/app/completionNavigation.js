import { subscribeGenerationCompleteNotificationClicks } from '../../services/completionNotificationService.js';
import { REPLACEMENT_STUDIO_MODE_ID } from '../workspaceStudioModes.js';
export function createCompletionNavigation({
  canvasTabs: _0xf23060,
  store: _0x2b3c21,
  viewport: _0x3d6559,
  requestWorkspaceMode: _0x1ae198,
  replacementStudio: _0x5f2e93,
  prepareReplacement: prepareReplacement = async () => {},
  subscribe: subscribe = subscribeGenerationCompleteNotificationClicks,
  showToast: showToast = () => {},
} = {}) {
  let _0x51bb3b = ![],
    _0x31c05e = Promise['resolve']();
  async function _0x2b6929(_0x2ece2c) {
    if (_0x51bb3b) return ![];
    if (_0x2ece2c['source'] === 'replacement-studio') {
      (await _0x5f2e93['whenReady'](), await prepareReplacement());
      if (_0x51bb3b || !_0x1ae198(REPLACEMENT_STUDIO_MODE_ID)) return ![];
      return _0x5f2e93['navigateToTaskResult'](_0x2ece2c);
    }
    const _0x2c6c57 = _0xf23060['getMultiDataSnapshot']({ captureVisualSnapshot: ![] }),
      _0x2f24bd = (_0x2c6c57['canvases'] || [])['filter']((_0x683d59) => {
        if (_0x2ece2c['canvasId'] && _0x683d59['id'] !== _0x2ece2c['canvasId']) return ![];
        if (
          _0x2ece2c['projectId'] &&
          _0xf23060['getCanvasProjectContext'](_0x683d59['id'])?.['projectId'] !== _0x2ece2c['projectId']
        )
          return ![];
        const _0x587f1b = _0x683d59['nodes'] || [];
        return Array['isArray'](_0x587f1b)
          ? _0x587f1b['some']((_0x1bbbb6) => _0x1bbbb6['id'] === _0x2ece2c['nodeId'])
          : Boolean(_0x587f1b[_0x2ece2c['nodeId']]);
      });
    if (_0x2f24bd['length'] !== 0x1) return (showToast('对应的画布节点已删除或项目已关闭。', 'warn'), ![]);
    if (!_0x1ae198('canvas')) return ![];
    const _0x2b81b6 = _0x2f24bd[0x0]['id'];
    await _0xf23060['switchTo'](_0x2b81b6);
    if (_0x51bb3b || _0xf23060['getActiveCanvasId']() !== _0x2b81b6) return ![];
    if (!_0x2b3c21['getState']()['nodes']?.[_0x2ece2c['nodeId']]) return ![];
    return (
      _0x2b3c21['setSelectedNodes']([_0x2ece2c['nodeId']]),
      _0x3d6559['focusNode'](_0x2ece2c['nodeId'], 0x60, 0x1f4, { maxZoom: 1.15 })
    );
  }
  const _0x2089fe = subscribe((_0x18b720) => {
    if (!['canvas', 'replacement-studio']['includes'](_0x18b720?.['source'])) return;
    _0x31c05e = _0x31c05e['then'](() => _0x2b6929(_0x18b720))['catch'](() => {
      if (!_0x51bb3b) showToast('无法打开任务结果，请从对应工作区查看。', 'warn');
      return ![];
    });
  });
  return {
    whenIdle: () => _0x31c05e,
    destroy() {
      ((_0x51bb3b = !![]), _0x2089fe());
    },
  };
}
