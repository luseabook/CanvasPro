import {
  COLLABORATION_CHUNK_BYTES,
  COLLABORATION_MAX_ASSET_BYTES,
  isCollaborationMediaType,
  normalizeCollaborationMediaSource,
  readCollaborationMedia,
} from '../../../api/canvasCollaborationApi.js';
import { projectGraph } from './collaborationDocument.js';
import { createCollaborationPreviews } from './collaborationPreviews.js';
function toBase64(list) {
  let value = '';
  for (let item = 0; item < list['length']; item += 8192)
    value += String['fromCharCode'](...list['subarray'](item, item + 8192));
  return btoa(value);
}
async function hashBytes(key) {
  return [...new Uint8Array(await crypto['subtle']['digest']('SHA-256', key))]
    ['map']((index) => index['toString'](16)['padStart'](2, '0'))
    ['join']('');
}
export function createCollaborationMedia({
  rpc: rpc,
  readMedia: readMedia = readCollaborationMedia,
  registerMedia: registerMedia = async () => null,
  uploadMedia: uploadMedia,
  bindMedia: bindMedia,
  imagePreviews: imagePreviews,
  onProgress: onProgress = () => {},
  signal: signal,
}) {
  const map = new Map(),
    map2 = new Map(),
    handler = createCollaborationPreviews(imagePreviews),
    handler2 = () => {
      if (signal?.['aborted']) throw new DOMException('Aborted', 'AbortError');
    },
    resolveSource = (result) => map['get'](normalizeCollaborationMediaSource(result)) || result;
  return {
    resolveSource: resolveSource,
    snapshotBindings(data) {
      const map3 = new Map();
      return (
        projectGraph(data, (options) => {
          const target = resolveSource(options);
          if (target !== options) map3['set'](normalizeCollaborationMediaSource(options), target);
          return target;
        }),
        [...map3]
      );
    },
    restoreBindings(list2 = []) {
      for (const source of list2) {
        if (
          !Array['isArray'](source) ||
          typeof source[0] !== 'string' ||
          !/^aic-asset:[a-f0-9]{64}$/['test'](source[1])
        )
          continue;
        map['set'](normalizeCollaborationMediaSource(source[0]), source[1]);
      }
    },
    project: (next) => projectGraph(next, resolveSource),
    async prepare(current) {
      current = await handler(current);
      const entry = new Set();
      projectGraph(current, (record) => {
        const collaborationMediaSource = normalizeCollaborationMediaSource(record);
        if (!map['has'](collaborationMediaSource)) entry['add'](collaborationMediaSource);
        return record;
      });
      let payload = 0;
      for (const handle of entry) {
        (handler2(), onProgress('正在准备素材地址 ' + ++payload + '/' + entry['size']));
        const registerMedia2 = await registerMedia(handle);
        handler2();
        if (registerMedia2) {
          if (!/^[a-f0-9]{64}$/['test'](registerMedia2['hash'])) throw new Error('本机素材登记响应无效');
          const state = 'aic-asset:' + registerMedia2['hash'];
          (map['set'](handle, state), map2['set'](state, handle));
          continue;
        }
        onProgress('正在传送素材给房主 ' + payload + '/' + entry['size']);
        const mime = await readMedia(handle, signal);
        if (!mime['size'])
          throw Object['assign'](new Error('素材文件为空，请等待文件写入完成后重试'), {
            code: 'ASSET_EMPTY',
          });
        if (mime['size'] > COLLABORATION_MAX_ASSET_BYTES)
          throw Object['assign'](new Error('临时或远程协作素材单文件不能超过 256 MiB'), {
            code: 'ASSET_LIMIT',
          });
        if (!isCollaborationMediaType(mime['type']['split'](';')[0]))
          throw Object['assign'](new Error('无法识别协作素材类型，请使用支持的图片、视频或音频'), {
            code: 'ASSET_TYPE',
          });
        if (uploadMedia) {
          const config = await uploadMedia(mime, onProgress);
          handler2();
          if (!/^[a-f0-9]{64}$/['test'](config?.['hash'])) throw new Error('素材传输响应无效');
          const scope = 'aic-asset:' + config['hash'];
          (map['set'](handle, scope), map2['set'](scope, handle));
          continue;
        }
        const size = new Uint8Array(await mime['arrayBuffer']()),
          hash = await hashBytes(size),
          input = 'aic-asset:' + hash;
        let offset = 0;
        while (!map2['has'](input) && offset < size['length']) {
          handler2();
          const output = await rpc({
            action: 'assetPut',
            hash: hash,
            size: size['length'],
            mime: mime['type']['split'](';')[0],
            offset: offset,
            data: toBase64(size['subarray'](offset, offset + COLLABORATION_CHUNK_BYTES)),
          });
          if (
            !Number['isSafeInteger'](output['offset']) ||
            output['offset'] <= offset ||
            output['offset'] > size['length'] ||
            output['complete'] !== (output['offset'] === size['length'])
          )
            throw new Error('素材上传响应无效');
          ((offset = output['offset']),
            onProgress(
              '正在传送素材给房主 ' +
                payload +
                '/' +
                entry['size'] +
                ' · ' +
                Math['round']((offset / size['length']) * 100) +
                '%',
            ));
        }
        (handler2(), map['set'](handle, input), map2['set'](input, handle));
      }
      return this['project'](current);
    },
    async materialize(value2) {
      const args = new Set();
      function run(list3, value3) {
        if (typeof list3 === 'string' && /^aic-asset:[a-f0-9]{64}$/['test'](list3)) {
          if (!map2['has'](list3)) args['add'](list3);
          return value3 ? map2['get'](list3) : list3;
        }
        if (Array['isArray'](list3)) return list3['map']((value4) => run(value4, value3));
        if (list3 && typeof list3 === 'object')
          return Object['fromEntries'](
            Object['entries'](list3)['map'](([value5, value6]) => [value5, run(value6, value3)]),
          );
        return list3;
      }
      (handler2(), run(value2, false));
      const list4 = [...args];
      for (let value7 = 0; value7 < list4['length']; value7 += 1000) {
        const list5 = list4['slice'](value7, value7 + 1000),
          value8 = await bindMedia(list5['map']((list6) => list6['slice'](10)));
        handler2();
        for (const list7 of list5) {
          const value9 = value8?.[list7['slice'](10)];
          if (
            typeof value9 !== 'string' ||
            !new RegExp(
              '^data/assets/(?:_deferred/[\\w-]+|_hosted)/[\\w-]+/' + list7['slice'](10) + '\\.[a-z0-9]+$',
            )['test'](value9)
          )
            throw new Error('共享素材地址无效');
          (map2['set'](list7, value9), map['set'](normalizeCollaborationMediaSource(value9), list7));
        }
      }
      return run(value2, true);
    },
    dispose() {
      (map['clear'](), map2['clear']());
    },
  };
}
