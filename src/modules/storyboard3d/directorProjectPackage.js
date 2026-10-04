import { migrateStoryboard3DProject } from './projectModel.js';
import { saveStoryboard3DProjectAsCopy } from './sceneProjectOperations.js';
const MAGIC = 'AIC3DP01',
  MAX_SIZE = 0x400 * 0x400 * 0x400;
export function downloadDirectorProjectPackage(value, item, key) {
  const index = key['URL']['createObjectURL'](value),
    el = key['document']['createElement']('a');
  ((el['href'] = index),
    (el['download'] = String(item)['replace'](/[\\/:*?"<>|]/g, '-') + '.aic3d'),
    key['document']['body']['append'](el),
    el['click'](),
    el['remove'](),
    key['setTimeout'](() => key['URL']['revokeObjectURL'](index), 0x2710));
}
function referencedAssets(result) {
  const args = new Set(),
    handler = (enabled) => {
      if (!enabled || typeof enabled !== 'object') return;
      for (const [data, options] of Object['entries'](enabled)) {
        if ((data === 'assetId' || data === 'binaryAssetId') && typeof options === 'string' && options)
          args['add'](options);
        else {
          if (options && typeof options === 'object') handler(options);
        }
      }
    };
  return (handler(result), [...args]);
}
function requiredAssets(target) {
  const args2 = new Set(),
    handler2 = (enabled2, source = '') => {
      if (!enabled2 || typeof enabled2 !== 'object') return;
      for (const [next, list] of Object['entries'](enabled2)) {
        if (
          (next === 'binaryAssetId' ||
            (next === 'assetId' && ['panorama', 'history', 'screenshots']['includes'](source))) &&
          typeof list === 'string' &&
          list
        )
          args2['add'](list);
        else {
          if (Array['isArray'](list)) list['forEach']((current) => handler2(current, next));
          else {
            if (list && typeof list === 'object') handler2(list, next);
          }
        }
      }
    };
  return (handler2(target), [...args2]);
}
function remapReferences(entry, map) {
  if (typeof entry === 'string') return map['get'](entry) || entry;
  if (Array['isArray'](entry)) return entry['map']((record) => remapReferences(record, map));
  if (entry && typeof entry === 'object')
    return Object['fromEntries'](
      Object['entries'](entry)['map'](([payload, handle]) => [payload, remapReferences(handle, map)]),
    );
  return entry;
}
export async function exportDirectorProjectPackage(state, config) {
  const migrateStoryboard3DProject2 = migrateStoryboard3DProject(structuredClone(state)),
    list2 = (await config['getMany'](referencedAssets(migrateStoryboard3DProject2)))['filter'](Boolean),
    args3 = [];
  let scope = 0x0;
  const enabled3 = new Set(list2['map']((input) => input['assetId']));
  if (requiredAssets(migrateStoryboard3DProject2)['some']((output) => !enabled3['has'](output)))
    throw new Error('项目引用的素材文件缺失，请恢复素材后再打包。');
  const value2 = list2['map']((args4) => {
    const value3 = [args4['primaryFile'], ...args4['relatedFiles']]['map'](({ blob: blob, ...args5 }) => {
      const value4 = { ...args5, offset: scope, size: blob['size'] };
      return ((scope += blob['size']), args3['push'](blob), value4);
    });
    return { assetId: args4['assetId'], kind: args4['kind'], descriptor: args4['descriptor'], files: value3 };
  });
  if (scope > MAX_SIZE) throw new Error('项目素材超过 1 GB，请拆分场景后打包。');
  const value5 = JSON['stringify'](
      { version: 0x1, project: migrateStoryboard3DProject2, assets: value2 },
      (value6, value7) => (typeof value7 === 'string' && value7['startsWith']('blob:') ? '' : value7),
    ),
    textEncoder = new TextEncoder()['encode'](value5),
    arrayBuffer = new ArrayBuffer(0xc),
    uint8Array = new Uint8Array(arrayBuffer);
  if (textEncoder['byteLength'] > 0x20 * 0x400 * 0x400)
    throw new Error('项目清单超过 32 MB，请拆分项目后打包。');
  return (
    uint8Array['set'](new TextEncoder()['encode'](MAGIC)),
    new DataView(arrayBuffer)['setUint32'](0x8, textEncoder['byteLength'], !![]),
    new Blob([arrayBuffer, textEncoder, ...args3], { type: 'application/octet-stream' })
  );
}
export async function importDirectorProjectPackage(value8, el2) {
  if (value8['size'] < 0xc || value8['size'] > MAX_SIZE + 0x20 * 0x400 * 0x400)
    throw new Error('项目包大小无效。');
  const value9 = await value8['slice'](0x0, 0xc)['arrayBuffer']();
  if (new TextDecoder()['decode'](new Uint8Array(value9, 0x0, 0x8)) !== MAGIC)
    throw new Error('请选择有效的 .aic3d 项目包。');
  const dataView = new DataView(value9)['getUint32'](0x8, !![]);
  if (dataView > 0x20 * 0x400 * 0x400 || dataView + 0xc > value8['size']) throw new Error('项目包清单无效。');
  const enabled4 = JSON['parse'](await value8['slice'](0xc, 0xc + dataView)['text']());
  if (
    enabled4['version'] !== 0x1 ||
    !Array['isArray'](enabled4['assets']) ||
    enabled4['assets']['length'] > 0x1f4
  )
    throw new Error('项目包版本或素材清单不受支持。');
  const enabled5 = new Map(
    enabled4['assets']['map']((value10) => [
      value10['assetId'],
      'package-' + globalThis['crypto']['randomUUID'](),
    ]),
  );
  if (
    enabled5['size'] !== enabled4['assets']['length'] ||
    !enabled4['project'] ||
    requiredAssets(enabled4['project'])['some']((value11) => !enabled5['has'](value11))
  )
    throw new Error('项目包素材重复或缺失。');
  const value12 = [],
    value13 = dataView + 0xc;
  for (const enabled6 of enabled4['assets']) {
    if (
      typeof enabled6['assetId'] !== 'string' ||
      !Array['isArray'](enabled6['files']) ||
      !enabled6['files']['length']
    )
      throw new Error('项目素材记录不完整。');
    for (const value14 of enabled6['files'])
      if (
        !Number['isSafeInteger'](value14['offset']) ||
        !Number['isSafeInteger'](value14['size']) ||
        value14['offset'] < 0x0 ||
        value14['size'] < 0x0 ||
        value13 + value14['offset'] + value14['size'] > value8['size']
      )
        throw new Error('项目素材范围越界。');
  }
  const saveStoryboard3DProjectAsCopy2 = saveStoryboard3DProjectAsCopy(
    migrateStoryboard3DProject(remapReferences(enabled4['project'], enabled5)),
    { name: (enabled4['project']['name'] || '3D 项目') + ' 导入' },
  );
  try {
    for (const value15 of enabled4['assets']) {
      const value16 = value15['files']['map'](({ offset: offset, size: size, ...args6 }) => ({
          ...args6,
          blob: value8['slice'](value13 + offset, value13 + offset + size, args6['type']),
        })),
        value17 = enabled5['get'](value15['assetId']);
      (await el2['put']({
        assetId: value17,
        kind: value15['kind'],
        descriptor: remapReferences(value15['descriptor'], enabled5),
        primaryFile: value16[0x0],
        relatedFiles: value16['slice'](0x1),
      }),
        value12['push'](value17));
    }
    return saveStoryboard3DProjectAsCopy2;
  } catch (value18) {
    await Promise['allSettled'](value12['map']((value19) => el2['remove'](value19)));
    throw value18;
  }
}
