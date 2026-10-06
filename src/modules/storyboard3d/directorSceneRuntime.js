import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
import { createStoryboard3DBinaryAssetRepository } from './binaryAssetRepository.js';
import { normalizeDirectorSceneSettings } from './directorSceneSettings.js';
export class DirectorSceneRuntime {
  constructor(value) {
    ((this.runtime = value),
      (this.materials = new Map()),
      (this.token = 0),
      (this.assetId = ''),
      (this.pending = false),
      (this.error = null));
  }
  ['roots'](map = new Set()) {
    return (this.runtime.adapted?.scene.objects || [])
      .filter(
        (item) =>
          item.visible !== false &&
          !map.has(item.id) &&
          ['prop', 'character'].includes(item.type),
      )
      .map((id) => {
        const key = this.runtime.bridge,
          index =
            id.type === 'character'
              ? key._mannequinMap?.get(id.id)
              : key._cubeMap?.get(id.id),
          root = this.runtime.importedInstanceByObjectId.get(id.id);
        return {
          id: id.id,
          root: root?.mesh || this.runtime.importedModelRoots.get(id.id) || index?.group,
          instanceId: root ? root.objectIds.indexOf(id.id) : null,
        };
      })
      .filter((result) => result.root?.isObject3D);
  }
  ['sync']() {
    const enabled = this.runtime.bridge;
    if (!enabled.scene?.isScene) return;
    const directorSceneSettings = normalizeDirectorSceneSettings(
      this.runtime.adapted.scene.directorSettings,
    );
    this.settings = directorSceneSettings;
    !this.ground &&
      enabled._ground?.material &&
      ((this.ground = new threeRuntime.Mesh(
        new threeRuntime.PlaneGeometry(1, 1),
        enabled._ground.material.clone(),
      )),
      (this.ground.rotation.x = -Math.PI / 2),
      (this.ground.receiveShadow = true),
      enabled.scene.add(this.ground));
    if (this.ground) {
      const enabled2 =
        directorSceneSettings.groundHeight === 0 && directorSceneSettings.groundOpacity === 1;
      enabled.setGroundFillVisible(
        enabled2 &&
          directorSceneSettings.groundVisible &&
          !this.runtime.adapted.scene.background?.imageUrl,
      );
      const data = this.runtime.adapted.scene.environment?.groundSize || 100;
      (this.ground.scale.set(data, data, 1),
        (this.ground.position.y = directorSceneSettings.groundHeight - 0.001),
        (this.ground.visible =
          !enabled2 &&
          directorSceneSettings.groundVisible &&
          !this.runtime.adapted.scene.background?.imageUrl),
        (this.ground.material.opacity = directorSceneSettings.groundOpacity),
        (this.ground.material.transparent = directorSceneSettings.groundOpacity < 1),
        (this.ground.material.depthWrite = directorSceneSettings.groundOpacity >= 1));
    }
    (this.syncMaterials(directorSceneSettings.displayMode),
      this.syncPanorama(directorSceneSettings.panorama),
      this.syncLabels(directorSceneSettings.labels),
      (this.materialWaitStart ||= Date.now()),
      directorSceneSettings.displayMode !== 'solid' &&
        Date.now() - this.materialWaitStart < 30000 &&
        !this.materialTimer &&
        [...(enabled._mannequinMap?.values() || [])].some(
          (enabled3) => !enabled3.modelRoot && !enabled3.modelLoadError,
        ) &&
        (this.materialTimer = setTimeout(() => {
          this.materialTimer = null;
          if (!this.runtime.disposed) this.sync();
        }, 100)));
  }
  ['syncLabels'](enabled4) {
    if (!enabled4) {
      if (this.labelFrame != null) cancelAnimationFrame(this.labelFrame);
      ((this.labelFrame = null), this.labels?.remove(), (this.labels = null));
      return;
    }
    const options = this.runtime.bridge.renderer.domElement,
      el = options.ownerDocument;
    !this.labels &&
      ((this.labels = el.createElement('div')),
      (this.labels.className = 'storyboard-3d-director-labels'),
      options.parentElement.append(this.labels));
    const list = this.runtime.adapted.scene.objects.filter(
      (target) => target.visible !== false && target.type !== 'group',
    );
    this.labels.replaceChildren(
      ...list.map((error) => {
        const el2 = el.createElement('span');
        return ((el2.textContent = error.name), (el2.dataset.objectId = error.id), el2);
      }),
    );
    if (this.labelFrame != null) return;
    const source = () => {
      this.labelFrame = null;
      if (this.runtime.disposed || !this.labels?.isConnected) return;
      if (options.getClientRects().length) {
        const map2 = new Map(this.roots().map((next) => [next.id, next]));
        for (const el3 of this.labels.children) {
          const current = this.runtime.adapted.scene.objects.find(
              (entry) => entry.id === el3.dataset.objectId,
            ),
            record = map2.get(current?.id),
            payload = record?.root,
            handle = new threeRuntime.Matrix4();
          record?.instanceId != null &&
            (payload.getMatrixAt(record.instanceId, handle),
            handle.premultiply(payload.matrixWorld));
          const state =
              record?.instanceId != null
                ? new threeRuntime.Vector3().setFromMatrixPosition(handle).toArray()
                : payload
                  ? payload.getWorldPosition(new threeRuntime.Vector3()).toArray()
                  : current?.transform.position,
            box = state && this.runtime.getDirectorViewport().project(state);
          ((el3.hidden = !box),
            box && ((el3.style.left = box.x + 'px'), (el3.style.top = box.y + 'px')));
        }
      }
      this.labelFrame = requestAnimationFrame(source);
    };
    this.labelFrame = requestAnimationFrame(source);
  }
  ['syncMaterials'](config) {
    const map3 = new Set();
    for (const { root: root2 } of this.roots())
      root2.traverse((original) => {
        if (!original.isMesh || !original.material) return;
        map3.add(original);
        let enabled5 = this.materials.get(original);
        if (config === 'solid') {
          enabled5 &&
            ((original.material = enabled5.original),
            enabled5.clones.forEach((scope) => scope.dispose()),
            this.materials.delete(original));
          return;
        }
        if (!enabled5) {
          const clones = Array.isArray(original.material)
            ? original.material
            : [original.material];
          ((enabled5 = {
            original: original.material,
            clones: clones.map((input) => input.clone()),
          }),
            this.materials.set(original, enabled5),
            (original.material = Array.isArray(original.material)
              ? enabled5.clones
              : enabled5.clones[0]));
        }
        ((original.material = Array.isArray(enabled5.original)
          ? enabled5.clones
          : enabled5.clones[0]),
          enabled5.clones.forEach((list2, output) => {
            const list3 = Array.isArray(enabled5.original)
              ? enabled5.original[output]
              : enabled5.original;
            ((list2.transparent = config === 'transparent' || list3.transparent),
              (list2.opacity = config === 'transparent' ? 0.35 : list3.opacity),
              (list2.depthWrite = config !== 'transparent'));
            if (list2.color)
              list2.color.copy(
                config === 'clay'
                  ? this.runtime.bridge._ground.material.color
                  : list3.color,
              );
            if ('map' in list2) list2.map = config === 'clay' ? null : list3.map;
            list2.needsUpdate = true;
          }));
      });
    for (const [value2, value3] of this.materials)
      !map3.has(value2) &&
        ((value2.material = value3.original),
        value3.clones.forEach((value4) => value4.dispose()),
        this.materials.delete(value2));
  }
  ['prepareMaterials']() {
    for (const [value5, value6] of this.materials) value5.material = value6.original;
  }
  ['syncPanorama'](args) {
    const enabled6 = args.enabled ? args.assetId : '';
    this.sphere &&
      ((this.sphere.visible = Boolean(enabled6)),
      this.sphere.scale.setScalar(args.radius),
      this.sphere.rotation.set(...args.rotation));
    if (enabled6 === this.assetId) return;
    ((this.assetId = enabled6), (this.error = null));
    const value7 = ++this.token;
    if (!enabled6) {
      this.pending = false;
      return;
    }
    ((this.pending = true),
      (this.repository ||= createStoryboard3DBinaryAssetRepository()),
      this.repository
        .get(enabled6)
        .then(async (enabled7) => {
          if (!enabled7) throw new Error('全景素材不存在，请重新导入。');
          const value8 = URL.createObjectURL(enabled7.primaryFile.blob);
          try {
            const value9 = await new threeRuntime.TextureLoader().loadAsync(value8);
            if (value7 !== this.token || this.runtime.disposed) {
              value9.dispose();
              return;
            }
            ((value9.colorSpace = threeRuntime.SRGBColorSpace),
              !this.sphere &&
                ((this.sphere = new threeRuntime.Mesh(
                  new threeRuntime.SphereGeometry(1, 64, 32),
                  new threeRuntime.MeshBasicMaterial({ side: threeRuntime.BackSide, depthWrite: false }),
                )),
                (this.sphere.renderOrder = -100),
                this.runtime.bridge.scene.add(this.sphere)),
              this.sphere.material.map?.dispose(),
              (this.sphere.material.map = value9),
              (this.sphere.material.needsUpdate = true),
              this.syncPanorama(this.settings.panorama),
              this.runtime.renderNow());
          } finally {
            URL.revokeObjectURL(value8);
          }
        })
        .catch((value10) => {
          if (value7 === this.token) this.error = value10;
        })
        .finally(() => {
          value7 === this.token &&
            ((this.pending = false), this.runtime._notifyVisualChange('panorama'));
        }));
  }
  ['surfaceHeight'](value11, value12, value13 = []) {
    const value14 = new threeRuntime.Raycaster(
        new threeRuntime.Vector3(value11, 10000, value12),
        new threeRuntime.Vector3(0, -1, 0),
      ),
      list4 = this.roots(new Set(value13)),
      value15 = list4.flatMap(({ root: root3, instanceId: instanceId }) => {
        return (
          root3.updateMatrixWorld(true),
          value14.intersectObject(root3, true).filter(
            (value16) =>
              value16.object.isMesh &&
              value16.object.visible &&
              (instanceId == null || instanceId === value16.instanceId),
          )
        );
      }).sort((value17, value18) => value17.distance - value18.distance);
    return Math.max(this.settings?.groundHeight || 0, value15[0]?.point.y ?? -Infinity);
  }
  ['obstacles'](list5 = []) {
    return this.roots(new Set(list5)).map(({ id: id2, root: root4, instanceId: instanceId2 }) => {
      root4.updateMatrixWorld(true);
      let min;
      if (instanceId2 != null) {
        root4.geometry.computeBoundingBox();
        const value19 = new threeRuntime.Matrix4();
        (root4.getMatrixAt(instanceId2, value19),
          value19.premultiply(root4.matrixWorld),
          (min = root4.geometry.boundingBox.clone().applyMatrix4(value19)));
      } else min = new threeRuntime.Box3().setFromObject(root4);
      return { id: id2, min: min.min.toArray(), max: min.max.toArray() };
    });
  }
  ['dispose']() {
    (clearTimeout(this.materialTimer), this.syncLabels(false), this.token++, (this.pending = false));
    for (const [value20, value21] of this.materials) {
      ((value20.material = value21.original),
        value21.clones.forEach((value22) => value22.dispose()));
    }
    this.materials.clear();
    for (const value23 of [this.ground, this.sphere]) {
      (value23?.removeFromParent(),
        value23?.geometry.dispose(),
        value23?.material.map?.dispose(),
        value23?.material.dispose());
    }
    void this.repository?.close();
  }
}
