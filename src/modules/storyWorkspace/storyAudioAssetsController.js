import { createAudioPlaybackSurfaceController } from '../../components/audio-node/audioPlaybackSurface.js';
import { bindWorkspaceSelects } from '../workspaceSelects.js';
import { buildWorkspaceAssetLibraryItems } from '../workspaceAssetLibrary.js';
import {
  addStoryAudioAssets,
  bindStoryAudioToCharacter,
  getStoryAudioUrl,
  removeStoryAudioAsset,
  storyAudioUploads,
} from './storyAudioAssets.js';
export function addStoryLibraryAudioToProject(_0x4fee54, _0x21376b) {
  const _0x5e78ba = addStoryAudioAssets(_0x4fee54['data'], _0x21376b);
  if (!_0x5e78ba['length']) return ![];
  return (
    (_0x4fee54['assetFilter'] = 'audio'),
    (_0x4fee54['selectedAssetId'] = _0x5e78ba[0x0]['id']),
    (_0x4fee54['assetSelectionMode'] = ![]),
    (_0x4fee54['selectedAssetIds'] = []),
    !![]
  );
}
export function bindStoryAudioAssets(
  _0x45e631,
  {
    state: _0x441b23,
    createToken: _0x48aa25,
    isLive: _0x5705e9,
    isCurrent: _0x383322,
    syncEntry: _0x30305e,
    persist: _0x1429a5,
    render: _0x14b296,
    uploadFile: _0x558234,
    saveAssetPackageItem: _0x15985c,
    showToast: _0x2b3457,
    startTask: startTask = () => {},
    finishTask: finishTask = () => {},
  },
) {
  const _0x3ebfd5 = _0x48aa25(),
    _0x585252 = _0x45e631['querySelector']('[data-story-audio-detail]'),
    _0x3b0529 = _0x585252?.['ownerDocument'] ? bindWorkspaceSelects(_0x585252) : null;
  let _0x5c9328 = null,
    _0x509cad = ![];
  queueMicrotask(() => {
    if (!_0x509cad)
      _0x5c9328 = createAudioPlaybackSurfaceController(
        _0x45e631['querySelector']('[data-story-audio-player]'),
        { onError: () => _0x2b3457('音频播放失败。', 'warn') },
      );
  });
  const _0x4a2de1 = () =>
      _0x441b23['assetFilter'] === 'library'
        ? buildWorkspaceAssetLibraryItems({ allowedTypes: ['image', 'audio'] })
        : _0x441b23['data']['audioAssets'] || [],
    _0x30a9ed = () =>
      _0x4a2de1()['filter'](
        (_0x38d85f) =>
          _0x38d85f['mediaKind'] === 'audio' &&
          (_0x441b23['assetSelectionMode']
            ? _0x441b23['selectedAssetIds']['includes'](_0x38d85f['id'])
            : _0x441b23['selectedAssetId'] === _0x38d85f['id']),
      ),
    _0x265936 = () => {
      (_0x30305e(_0x3ebfd5), _0x1429a5({ immediate: !![] }));
      if (_0x383322(_0x3ebfd5)) _0x14b296();
    },
    _0x4fb085 = () =>
      _0x45e631['querySelectorAll']('.story-voice-source-menu-wrap')['forEach']((_0x5ac012) => {
        (_0x5ac012['querySelector']('[aria-expanded]')?.['setAttribute']('aria-expanded', 'false'),
          (_0x5ac012['querySelector']('[role="menu"]')['hidden'] = !![]));
      }),
    _0x133dd2 = (_0x149923) => {
      if (!_0x149923['target']['closest']('.story-voice-source-menu-wrap')) _0x4fb085();
    },
    _0x1bae51 = (_0x55af9a) => {
      if (_0x55af9a['key'] !== 'Escape') return;
      const _0x5d6a32 = _0x45e631['querySelector']('.story-voice-source-menu-wrap [aria-expanded="true"]');
      (_0x4fb085(), _0x5d6a32?.['focus']());
    },
    _0x3a0dc7 = (_0x3847a0) => {
      if (_0x3847a0['target']['closest']('.story-voice-source-menu [data-story-action]')) _0x4fb085();
      const _0xbcf942 = _0x3847a0['target']['closest']('[data-story-audio-action]');
      if (!_0xbcf942 || !_0x383322(_0x3ebfd5)) return;
      (_0x3847a0['preventDefault'](), _0x3847a0['stopPropagation']());
      const _0x33a709 = _0xbcf942['dataset']['storyAudioAction'];
      if (_0x33a709 === 'toggle-voice-menu') {
        const _0x1a91aa = _0xbcf942['closest']('.story-voice-source-menu-wrap')['querySelector'](
            '[role="menu"]',
          ),
          _0x1b1073 = _0x1a91aa['hidden'];
        (_0x4fb085(),
          (_0x1a91aa['hidden'] = !_0x1b1073),
          _0xbcf942['setAttribute']('aria-expanded', String(_0x1b1073)));
        if (_0x1b1073) _0x1a91aa['querySelector']('button')?.['focus']();
        return;
      }
      if (_0x33a709 === 'choose-project-voice') {
        ((_0x441b23['audioTargetCharacterId'] = _0x441b23['selectedAssetId']),
          (_0x441b23['assetFilter'] = 'audio'),
          (_0x441b23['selectedAssetId'] = _0x441b23['data']['audioAssets']?.[0x0]?.['id'] || ''),
          (_0x441b23['assetSelectionMode'] = ![]),
          (_0x441b23['selectedAssetIds'] = []),
          _0x265936());
        return;
      }
      if (_0x33a709 === 'upload') {
        _0x45e631['querySelector']('[data-story-audio-files]')?.['click']();
        return;
      }
      const _0x15a2d6 = _0x4a2de1()['find']((_0x16b3d2) => _0x16b3d2['id'] === _0x441b23['selectedAssetId']);
      if (_0x33a709 === 'add') {
        if (!addStoryLibraryAudioToProject(_0x441b23, _0x30a9ed())) return;
      } else {
        if (_0x33a709 === 'bind') {
          if (
            !_0x15a2d6 ||
            !bindStoryAudioToCharacter(
              _0x3ebfd5['data'],
              _0x15a2d6,
              _0x45e631['querySelector']('[data-story-audio-character]')?.['value'],
            )
          ) {
            _0x2b3457('请先选择要绑定的角色。', 'warn');
            return;
          }
        } else {
          if (_0x33a709 === 'remove')
            (removeStoryAudioAsset(_0x3ebfd5['data'], _0x15a2d6?.['id']),
              (_0x441b23['selectedAssetId'] = ''));
          else return;
        }
      }
      _0x265936();
    },
    _0x4f607e = async (_0x37b27d) => {
      if (_0x37b27d['target']['matches']('[data-story-audio-character]') && _0x383322(_0x3ebfd5)) {
        _0x441b23['audioTargetCharacterId'] = _0x37b27d['target']['value'];
        const _0xb0c7e = _0x585252?.['querySelector']('[data-story-audio-action=\x22bind\x22]');
        if (_0xb0c7e)
          _0xb0c7e['disabled'] = !_0x441b23['data']['assets']['some'](
            (_0x2aa66c) =>
              _0x2aa66c['kind'] === 'character' && _0x2aa66c['id'] === _0x37b27d['target']['value'],
          );
        return;
      }
      if (
        !_0x37b27d['target']['matches']('[data-story-audio-files]') ||
        !_0x383322(_0x3ebfd5) ||
        storyAudioUploads['has'](_0x3ebfd5['data'])
      )
        return;
      const _0x3810c2 = [..._0x37b27d['target']['files']];
      if (!_0x3810c2['length']) return;
      if (typeof _0x15985c !== 'function') {
        _0x2b3457('总素材服务尚未初始化。', 'warn');
        return;
      }
      storyAudioUploads['add'](_0x3ebfd5['data']);
      const _0x45e86e = 'project-audio-upload';
      (startTask(_0x3ebfd5, {
        id: _0x45e86e,
        kind: 'asset-audio-upload',
        label: '上传项目音频',
        message: '正在保存音频到总素材',
      }),
        _0x14b296());
      try {
        for (const _0xffab12 of _0x3810c2) {
          if (
            !/^audio\//u['test'](_0xffab12['type']) &&
            !/\.(mp3|wav|m4a|ogg|flac)$/iu['test'](_0xffab12['name'])
          )
            throw new Error('请选择音频文件。');
          const _0x3ff9be = await _0x558234(_0xffab12, _0x3ebfd5['projectId']);
          if (!_0x5705e9(_0x3ebfd5)) return;
          const _0x211dc9 = getStoryAudioUrl({
            audioUrl:
              _0x3ff9be?.['displayUrl'] ||
              _0x3ff9be?.['url'] ||
              _0x3ff9be?.['originalUrl'] ||
              _0x3ff9be?.['localUrl'],
            localPath: _0x3ff9be?.['localPath'] || _0x3ff9be?.['path'],
          });
          if (!_0x211dc9) throw new Error('音频上传未返回有效地址。');
          const _0x15b418 = _0xffab12['name']['replace'](/\.[^.]+$/u, ''),
            _0xdc5085 = _0x3ebfd5['data']['project']['sourceMode'] === 'video-replication' ? '复刻' : '剧本',
            _0x2447c3 = await _0x15985c({
              packageKey: 'story-audio:' + _0x3ebfd5['projectId'],
              packageName:
                (_0x3ebfd5['data']['project']['title'] || _0xdc5085 + '项目') + '\x20·\x20音频素材',
              category: _0xdc5085 + '工作室',
              itemKey: globalThis['crypto']['randomUUID'](),
              itemName: _0x15b418,
              audio: { ..._0x3ff9be, audioUrl: _0x211dc9 },
              metadata: { sourceKind: 'story-workspace', sourceProjectId: _0x3ebfd5['projectId'] },
            });
          if (!_0x5705e9(_0x3ebfd5)) return;
          if (!_0x2447c3?.['assetId']) throw new Error('音频未能保存到总素材，请重试。');
          const _0x4a1a62 = addStoryAudioAssets(_0x3ebfd5['data'], [
            {
              mediaKind: 'audio',
              name: _0x15b418,
              audioUrl: _0x211dc9,
              localPath: _0x3ff9be?.['localPath'],
              sourceAssetId: _0x2447c3?.['assetId'],
              sourceItemIndex: _0x2447c3?.['itemIndex'],
            },
          ]);
          if (_0x383322(_0x3ebfd5) && _0x441b23['assetFilter'] === 'audio')
            _0x441b23['selectedAssetId'] = _0x4a1a62['at'](-0x1)?.['id'] || _0x441b23['selectedAssetId'];
          (_0x30305e(_0x3ebfd5), _0x1429a5({ immediate: !![] }));
        }
        finishTask(_0x3ebfd5, _0x45e86e, { status: 'succeeded', message: '项目音频已保存' });
      } catch (_0x2a21fa) {
        if (_0x5705e9(_0x3ebfd5))
          finishTask(_0x3ebfd5, _0x45e86e, {
            status: 'failed',
            error: _0x2a21fa['message'],
            message: '项目音频保存失败',
          });
        _0x2b3457(_0x2a21fa['message'] || '音频上传失败。', 'warn');
      } finally {
        storyAudioUploads['delete'](_0x3ebfd5['data']);
        if (_0x383322(_0x3ebfd5)) _0x14b296();
      }
    };
  return (
    _0x45e631['addEventListener']('click', _0x3a0dc7),
    _0x45e631['addEventListener']('change', _0x4f607e),
    _0x45e631['ownerDocument']?.['addEventListener']('click', _0x133dd2),
    _0x45e631['ownerDocument']?.['addEventListener']('keydown', _0x1bae51),
    {
      destroy() {
        ((_0x509cad = !![]),
          _0x3b0529?.['destroy'](),
          _0x5c9328?.['destroy'](),
          _0x45e631['removeEventListener']('click', _0x3a0dc7),
          _0x45e631['removeEventListener']('change', _0x4f607e),
          _0x45e631['ownerDocument']?.['removeEventListener']('click', _0x133dd2),
          _0x45e631['ownerDocument']?.['removeEventListener']('keydown', _0x1bae51));
      },
    }
  );
}
