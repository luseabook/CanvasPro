import { resolveAssetNodeCoverUrl } from '../assetCoverResolver.js';
import { resolveNodeManagerName } from './nodeManagerModel.js';
export function createNodeManagerListSnapshot() {
  let _0x3e7860 = new Map(),
    _0x21c52f = [],
    _0x1936c8 = new Map();
  return {
    read(_0x337f0a = {}) {
      const _0x192277 = new Map(),
        _0x33d3c7 = Object['keys'](_0x337f0a);
      let _0x2a8a9e = _0x33d3c7['length'] !== _0x21c52f['length'];
      (_0x33d3c7['forEach']((_0x1856b1, _0x3c6155) => {
        const _0x505e93 = _0x337f0a[_0x1856b1],
          _0x820877 = _0x3e7860['get'](_0x1856b1);
        let _0x1787b4 = _0x820877;
        if (!_0x820877 || _0x820877['node'] !== _0x505e93 || _0x820877['bizRev'] !== _0x505e93?.['_bizRev']) {
          let _0x424895 = '';
          try {
            _0x424895 = resolveAssetNodeCoverUrl(_0x505e93 || {});
          } catch {}
          const _0x3a85a3 = {
              id: String(_0x505e93?.['id'] || _0x1856b1),
              type: String(_0x505e93?.['type'] || ''),
              name: resolveNodeManagerName(_0x505e93, _0x1856b1),
              parentId: String(_0x505e93?.['parentId'] || ''),
              coverUrl: _0x424895,
            },
            _0x254bb6 =
              _0x820877 &&
              Object['keys'](_0x3a85a3)['every'](
                (_0x4d2f57) => _0x820877['presentation'][_0x4d2f57] === _0x3a85a3[_0x4d2f57],
              );
          _0x1787b4 = {
            node: _0x505e93,
            bizRev: _0x505e93?.['_bizRev'],
            presentation: _0x254bb6 ? _0x820877['presentation'] : _0x3a85a3,
          };
        }
        if (
          _0x33d3c7[_0x3c6155] !== _0x21c52f[_0x3c6155] ||
          _0x1787b4['presentation'] !== _0x820877?.['presentation']
        )
          _0x2a8a9e = !![];
        _0x192277['set'](_0x1856b1, _0x1787b4);
      }),
        (_0x3e7860 = _0x192277),
        (_0x21c52f = _0x33d3c7));
      if (_0x2a8a9e)
        _0x1936c8 = new Map(
          [..._0x3e7860['values']()]['map']((_0x7a7943) => [
            _0x7a7943['presentation']['id'],
            _0x7a7943['presentation'],
          ]),
        );
      return { changed: _0x2a8a9e, byId: _0x1936c8 };
    },
    clear() {
      (_0x3e7860['clear'](), (_0x21c52f = []), (_0x1936c8 = new Map()));
    },
  };
}
