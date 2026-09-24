import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
import { createStoryboard3DBinaryAssetRepository } from './binaryAssetRepository.js';
import { normalizeDirectorSceneSettings } from './directorSceneSettings.js';
export class DirectorSceneRuntime {
  constructor(_0x5c4e9c) {
    ((this['runtime'] = _0x5c4e9c),
      (this['materials'] = new Map()),
      (this['token'] = 0x0),
      (this['assetId'] = ''),
      (this['pending'] = ![]),
      (this['error'] = null));
  }
  ['roots'](_0x4604ce = new Set()) {
    return (this['runtime']['adapted']?.['scene']['objects'] || [])
      ['filter'](
        (_0x483ca4) =>
          _0x483ca4['visible'] !== ![] &&
          !_0x4604ce['has'](_0x483ca4['id']) &&
          ['prop', 'character']['includes'](_0x483ca4['type']),
      )
      ['map']((_0x52492a) => {
        const _0x2aae40 = this['runtime']['bridge'],
          _0x13db37 =
            _0x52492a['type'] === 'character'
              ? _0x2aae40['_mannequinMap']?.['get'](_0x52492a['id'])
              : _0x2aae40['_cubeMap']?.['get'](_0x52492a['id']),
          _0x33c0a1 = this['runtime']['importedInstanceByObjectId']['get'](_0x52492a['id']);
        return {
          id: _0x52492a['id'],
          root:
            _0x33c0a1?.['mesh'] ||
            this['runtime']['importedModelRoots']['get'](_0x52492a['id']) ||
            _0x13db37?.['group'],
          instanceId: _0x33c0a1 ? _0x33c0a1['objectIds']['indexOf'](_0x52492a['id']) : null,
        };
      })
      ['filter']((_0xfb929b) => _0xfb929b['root']?.['isObject3D']);
  }
  ['sync']() {
    const _0x482a04 = this['runtime']['bridge'];
    if (!_0x482a04['scene']?.['isScene']) return;
    const _0x9d8092 = normalizeDirectorSceneSettings(this['runtime']['adapted']['scene']['directorSettings']);
    this['settings'] = _0x9d8092;
    !this['ground'] &&
      _0x482a04['_ground']?.['material'] &&
      ((this['ground'] = new threeRuntime['Mesh'](
        new threeRuntime['PlaneGeometry'](0x1, 0x1),
        _0x482a04['_ground']['material']['clone'](),
      )),
      (this['ground']['rotation']['x'] = -Math['PI'] / 0x2),
      (this['ground']['receiveShadow'] = !![]),
      _0x482a04['scene']['add'](this['ground']));
    if (this['ground']) {
      const _0x5422a1 = _0x9d8092['groundHeight'] === 0x0 && _0x9d8092['groundOpacity'] === 0x1;
      _0x482a04['setGroundFillVisible'](
        _0x5422a1 &&
          _0x9d8092['groundVisible'] &&
          !this['runtime']['adapted']['scene']['background']?.['imageUrl'],
      );
      const _0xe836ad = this['runtime']['adapted']['scene']['environment']?.['groundSize'] || 0x64;
      (this['ground']['scale']['set'](_0xe836ad, _0xe836ad, 0x1),
        (this['ground']['position']['y'] = _0x9d8092['groundHeight'] - 0.001),
        (this['ground']['visible'] =
          !_0x5422a1 &&
          _0x9d8092['groundVisible'] &&
          !this['runtime']['adapted']['scene']['background']?.['imageUrl']),
        (this['ground']['material']['opacity'] = _0x9d8092['groundOpacity']),
        (this['ground']['material']['transparent'] = _0x9d8092['groundOpacity'] < 0x1),
        (this['ground']['material']['depthWrite'] = _0x9d8092['groundOpacity'] >= 0x1));
    }
    (this['syncMaterials'](_0x9d8092['displayMode']),
      this['syncPanorama'](_0x9d8092['panorama']),
      this['syncLabels'](_0x9d8092['labels']),
      (this['materialWaitStart'] ||= Date['now']()),
      _0x9d8092['displayMode'] !== 'solid' &&
        Date['now']() - this['materialWaitStart'] < 0x7530 &&
        !this['materialTimer'] &&
        [...(_0x482a04['_mannequinMap']?.['values']() || [])]['some'](
          (_0x14a8b3) => !_0x14a8b3['modelRoot'] && !_0x14a8b3['modelLoadError'],
        ) &&
        (this['materialTimer'] = setTimeout(() => {
          this['materialTimer'] = null;
          if (!this['runtime']['disposed']) this['sync']();
        }, 0x64)));
  }
  ['syncLabels'](_0x7e0b17) {
    if (!_0x7e0b17) {
      if (this['labelFrame'] != null) cancelAnimationFrame(this['labelFrame']);
      ((this['labelFrame'] = null), this['labels']?.['remove'](), (this['labels'] = null));
      return;
    }
    const _0x4c57f8 = this['runtime']['bridge']['renderer']['domElement'],
      _0x79ccf2 = _0x4c57f8['ownerDocument'];
    !this['labels'] &&
      ((this['labels'] = _0x79ccf2['createElement']('div')),
      (this['labels']['className'] = 'storyboard-3d-director-labels'),
      _0x4c57f8['parentElement']['append'](this['labels']));
    const _0x23a10e = this['runtime']['adapted']['scene']['objects']['filter'](
      (_0x75105a) => _0x75105a['visible'] !== ![] && _0x75105a['type'] !== 'group',
    );
    this['labels']['replaceChildren'](
      ..._0x23a10e['map']((_0x27bd53) => {
        const _0x229e74 = _0x79ccf2['createElement']('span');
        return (
          (_0x229e74['textContent'] = _0x27bd53['name']),
          (_0x229e74['dataset']['objectId'] = _0x27bd53['id']),
          _0x229e74
        );
      }),
    );
    if (this['labelFrame'] != null) return;
    const _0x19a064 = () => {
      this['labelFrame'] = null;
      if (this['runtime']['disposed'] || !this['labels']?.['isConnected']) return;
      if (_0x4c57f8['getClientRects']()['length']) {
        const _0x1c0639 = new Map(this['roots']()['map']((_0x538484) => [_0x538484['id'], _0x538484]));
        for (const _0x2122b7 of this['labels']['children']) {
          const _0x92770f = this['runtime']['adapted']['scene']['objects']['find'](
              (_0x10ba38) => _0x10ba38['id'] === _0x2122b7['dataset']['objectId'],
            ),
            _0x45079c = _0x1c0639['get'](_0x92770f?.['id']),
            _0x2f2b16 = _0x45079c?.['root'],
            _0x4db091 = new threeRuntime['Matrix4']();
          _0x45079c?.['instanceId'] != null &&
            (_0x2f2b16['getMatrixAt'](_0x45079c['instanceId'], _0x4db091),
            _0x4db091['premultiply'](_0x2f2b16['matrixWorld']));
          const _0x50b6c8 =
              _0x45079c?.['instanceId'] != null
                ? new threeRuntime['Vector3']()['setFromMatrixPosition'](_0x4db091)['toArray']()
                : _0x2f2b16
                  ? _0x2f2b16['getWorldPosition'](new threeRuntime['Vector3']())['toArray']()
                  : _0x92770f?.['transform']['position'],
            _0x53337b = _0x50b6c8 && this['runtime']['getDirectorViewport']()['project'](_0x50b6c8);
          ((_0x2122b7['hidden'] = !_0x53337b),
            _0x53337b &&
              ((_0x2122b7['style']['left'] = _0x53337b['x'] + 'px'),
              (_0x2122b7['style']['top'] = _0x53337b['y'] + 'px')));
        }
      }
      this['labelFrame'] = requestAnimationFrame(_0x19a064);
    };
    this['labelFrame'] = requestAnimationFrame(_0x19a064);
  }
  ['syncMaterials'](_0x5086a1) {
    const _0x1ff856 = new Set();
    for (const { root: _0x12cedf } of this['roots']())
      _0x12cedf['traverse']((_0x1c7e2f) => {
        if (!_0x1c7e2f['isMesh'] || !_0x1c7e2f['material']) return;
        _0x1ff856['add'](_0x1c7e2f);
        let _0x37e242 = this['materials']['get'](_0x1c7e2f);
        if (_0x5086a1 === 'solid') {
          _0x37e242 &&
            ((_0x1c7e2f['material'] = _0x37e242['original']),
            _0x37e242['clones']['forEach']((_0x7b6c94) => _0x7b6c94['dispose']()),
            this['materials']['delete'](_0x1c7e2f));
          return;
        }
        if (!_0x37e242) {
          const _0x174769 = Array['isArray'](_0x1c7e2f['material'])
            ? _0x1c7e2f['material']
            : [_0x1c7e2f['material']];
          ((_0x37e242 = {
            original: _0x1c7e2f['material'],
            clones: _0x174769['map']((_0x402ed3) => _0x402ed3['clone']()),
          }),
            this['materials']['set'](_0x1c7e2f, _0x37e242),
            (_0x1c7e2f['material'] = Array['isArray'](_0x1c7e2f['material'])
              ? _0x37e242['clones']
              : _0x37e242['clones'][0x0]));
        }
        ((_0x1c7e2f['material'] = Array['isArray'](_0x37e242['original'])
          ? _0x37e242['clones']
          : _0x37e242['clones'][0x0]),
          _0x37e242['clones']['forEach']((_0x473624, _0x7c971a) => {
            const _0x4f46ad = Array['isArray'](_0x37e242['original'])
              ? _0x37e242['original'][_0x7c971a]
              : _0x37e242['original'];
            ((_0x473624['transparent'] = _0x5086a1 === 'transparent' || _0x4f46ad['transparent']),
              (_0x473624['opacity'] = _0x5086a1 === 'transparent' ? 0.35 : _0x4f46ad['opacity']),
              (_0x473624['depthWrite'] = _0x5086a1 !== 'transparent'));
            if (_0x473624['color'])
              _0x473624['color']['copy'](
                _0x5086a1 === 'clay'
                  ? this['runtime']['bridge']['_ground']['material']['color']
                  : _0x4f46ad['color'],
              );
            if ('map' in _0x473624) _0x473624['map'] = _0x5086a1 === 'clay' ? null : _0x4f46ad['map'];
            _0x473624['needsUpdate'] = !![];
          }));
      });
    for (const [_0x5088f8, _0x3a1640] of this['materials'])
      !_0x1ff856['has'](_0x5088f8) &&
        ((_0x5088f8['material'] = _0x3a1640['original']),
        _0x3a1640['clones']['forEach']((_0x3920d7) => _0x3920d7['dispose']()),
        this['materials']['delete'](_0x5088f8));
  }
  ['prepareMaterials']() {
    for (const [_0x481170, _0x11a076] of this['materials']) _0x481170['material'] = _0x11a076['original'];
  }
  ['syncPanorama'](_0x4546a7) {
    const _0x1dac1c = _0x4546a7['enabled'] ? _0x4546a7['assetId'] : '';
    this['sphere'] &&
      ((this['sphere']['visible'] = Boolean(_0x1dac1c)),
      this['sphere']['scale']['setScalar'](_0x4546a7['radius']),
      this['sphere']['rotation']['set'](..._0x4546a7['rotation']));
    if (_0x1dac1c === this['assetId']) return;
    ((this['assetId'] = _0x1dac1c), (this['error'] = null));
    const _0x11eb93 = ++this['token'];
    if (!_0x1dac1c) {
      this['pending'] = ![];
      return;
    }
    ((this['pending'] = !![]),
      (this['repository'] ||= createStoryboard3DBinaryAssetRepository()),
      this['repository']
        ['get'](_0x1dac1c)
        ['then'](async (_0x5f11e2) => {
          if (!_0x5f11e2) throw new Error('全景素材不存在，请重新导入。');
          const _0xa7e886 = URL['createObjectURL'](_0x5f11e2['primaryFile']['blob']);
          try {
            const _0x431df3 = await new threeRuntime['TextureLoader']()['loadAsync'](_0xa7e886);
            if (_0x11eb93 !== this['token'] || this['runtime']['disposed']) {
              _0x431df3['dispose']();
              return;
            }
            ((_0x431df3['colorSpace'] = threeRuntime['SRGBColorSpace']),
              !this['sphere'] &&
                ((this['sphere'] = new threeRuntime['Mesh'](
                  new threeRuntime['SphereGeometry'](0x1, 0x40, 0x20),
                  new threeRuntime['MeshBasicMaterial']({ side: threeRuntime['BackSide'], depthWrite: ![] }),
                )),
                (this['sphere']['renderOrder'] = -0x64),
                this['runtime']['bridge']['scene']['add'](this['sphere'])),
              this['sphere']['material']['map']?.['dispose'](),
              (this['sphere']['material']['map'] = _0x431df3),
              (this['sphere']['material']['needsUpdate'] = !![]),
              this['syncPanorama'](this['settings']['panorama']),
              this['runtime']['renderNow']());
          } finally {
            URL['revokeObjectURL'](_0xa7e886);
          }
        })
        ['catch']((_0x586591) => {
          if (_0x11eb93 === this['token']) this['error'] = _0x586591;
        })
        ['finally'](() => {
          _0x11eb93 === this['token'] &&
            ((this['pending'] = ![]), this['runtime']['_notifyVisualChange']('panorama'));
        }));
  }
  ['surfaceHeight'](_0x2eb349, _0x59bed2, _0x23da13 = []) {
    const _0x9cb822 = new threeRuntime['Raycaster'](
        new threeRuntime['Vector3'](_0x2eb349, 0x2710, _0x59bed2),
        new threeRuntime['Vector3'](0x0, -0x1, 0x0),
      ),
      _0x16eec5 = this['roots'](new Set(_0x23da13)),
      _0x22cd07 = _0x16eec5['flatMap'](({ root: _0x49ec5d, instanceId: _0x5dc7f1 }) => {
        return (
          _0x49ec5d['updateMatrixWorld'](!![]),
          _0x9cb822['intersectObject'](_0x49ec5d, !![])['filter'](
            (_0x10d8df) =>
              _0x10d8df['object']['isMesh'] &&
              _0x10d8df['object']['visible'] &&
              (_0x5dc7f1 == null || _0x5dc7f1 === _0x10d8df['instanceId']),
          )
        );
      })['sort']((_0x2f35a3, _0x14d6d8) => _0x2f35a3['distance'] - _0x14d6d8['distance']);
    return Math['max'](
      this['settings']?.['groundHeight'] || 0x0,
      _0x22cd07[0x0]?.['point']['y'] ?? -Infinity,
    );
  }
  ['obstacles'](_0x6e3228 = []) {
    return this['roots'](new Set(_0x6e3228))['map'](
      ({ id: _0x38d61e, root: _0x4b073b, instanceId: _0x3ead86 }) => {
        _0x4b073b['updateMatrixWorld'](!![]);
        let _0x2dd872;
        if (_0x3ead86 != null) {
          _0x4b073b['geometry']['computeBoundingBox']();
          const _0x15423b = new threeRuntime['Matrix4']();
          (_0x4b073b['getMatrixAt'](_0x3ead86, _0x15423b),
            _0x15423b['premultiply'](_0x4b073b['matrixWorld']),
            (_0x2dd872 = _0x4b073b['geometry']['boundingBox']['clone']()['applyMatrix4'](_0x15423b)));
        } else _0x2dd872 = new threeRuntime['Box3']()['setFromObject'](_0x4b073b);
        return { id: _0x38d61e, min: _0x2dd872['min']['toArray'](), max: _0x2dd872['max']['toArray']() };
      },
    );
  }
  ['dispose']() {
    (clearTimeout(this['materialTimer']), this['syncLabels'](![]), this['token']++, (this['pending'] = ![]));
    for (const [_0x33cbca, _0x199117] of this['materials']) {
      ((_0x33cbca['material'] = _0x199117['original']),
        _0x199117['clones']['forEach']((_0x446697) => _0x446697['dispose']()));
    }
    this['materials']['clear']();
    for (const _0x5e5481 of [this['ground'], this['sphere']]) {
      (_0x5e5481?.['removeFromParent'](),
        _0x5e5481?.['geometry']['dispose'](),
        _0x5e5481?.['material']['map']?.['dispose'](),
        _0x5e5481?.['material']['dispose']());
    }
    void this['repository']?.['close']();
  }
}
