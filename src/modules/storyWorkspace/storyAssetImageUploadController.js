import { uploadFile } from '../../services/projectService.js';
import { buildCanvasLocalImageFields } from '../../services/canvasMediaLocalService.js';
import {
  ensureStoryAssetBaseAppearance,
  getStoryAssetAppearances,
  normalizeStoryAssetAppearance,
} from './storyAssetAppearances.js';
import { buildStoryBackgroundTaskId } from './storyBackgroundTasks.js';
export function createStoryAssetImageUploadController({
  state: _0x57bd8d,
  createProjectToken: _0x3a7a35,
  isProjectTaskLive: _0xe471ad,
  isProjectTaskCurrent: _0x206b57,
  getSelectedAppearance: _0x106593,
  isLoading: _0x2e41a3,
  setGenerating: _0x318775,
  startTask: _0x3879da,
  finishTask: _0xdac38a,
  applyImageResult: _0x356ec9,
  refresh: _0x18d1f8,
  showToast: _0x10419d,
  saveFile: saveFile = uploadFile,
} = {}) {
  const _0x3e7cd9 = new Set(),
    _0x14aac9 = (_0x2cea14, { appendAppearance: appendAppearance = ![] } = {}) => {
      const _0x589e48 = _0x3a7a35(),
        _0x1d0b11 = _0x589e48['data']?.['assets']?.['find']((_0x2d39dc) => _0x2d39dc['id'] === _0x2cea14);
      return {
        projectToken: _0x589e48,
        assetId: _0x2cea14,
        appearanceId: _0x1d0b11 && _0x106593(_0x57bd8d, _0x1d0b11)?.['id'],
        appendAppearance:
          appendAppearance &&
          _0x589e48['data']?.['project']?.['sourceMode'] === 'video-replication' &&
          _0x1d0b11?.['kind'] === 'character' &&
          Boolean(_0x106593(_0x57bd8d, _0x1d0b11)?.['imageUrl']),
      };
    };
  async function _0x549a3d(_0x4bc5c4, _0x15737d) {
    if (!_0x4bc5c4 || !_0x15737d) return ![];
    if (
      !/^image\//iu['test'](_0x4bc5c4['type'] || '') &&
      !/\.(png|jpe?g|webp|gif|bmp|avif|svg|tiff?|heic|heif)$/iu['test'](_0x4bc5c4['name'] || '')
    )
      return (_0x10419d('请拖入图片文件。', 'warn'), ![]);
    const { projectToken: _0x1817ae, assetId: _0x2bc34d, appearanceId: _0x5de9c6 } = _0x15737d,
      _0x30ed1c = _0x1817ae['data']?.['assets']?.['find']((_0x3cdece) => _0x3cdece['id'] === _0x2bc34d),
      _0x321591 = getStoryAssetAppearances(_0x30ed1c)['find']((_0x2f0cdf) => _0x2f0cdf['id'] === _0x5de9c6);
    if (!_0x30ed1c || _0x30ed1c['isLibraryAsset'] || !_0x321591 || !_0xe471ad(_0x1817ae)) return ![];
    const _0x49fc7e = _0x1817ae['projectId'] + ':' + _0x2bc34d + ':' + _0x5de9c6;
    if (_0x3e7cd9['has'](_0x49fc7e) || (_0x206b57(_0x1817ae) && _0x2e41a3(_0x57bd8d, _0x2bc34d, _0x5de9c6)))
      return (_0x10419d('请等待当前生成或上传任务完成。', 'info'), ![]);
    _0x3e7cd9['add'](_0x49fc7e);
    const _0x2a7819 = buildStoryBackgroundTaskId('asset-image-upload', {
        assetId: _0x2bc34d,
        appearanceId: _0x5de9c6,
      }),
      _0x4b59bb = () =>
        _0xe471ad(_0x1817ae) &&
        _0x1817ae['data']?.['assets']?.['includes'](_0x30ed1c) &&
        getStoryAssetAppearances(_0x30ed1c)['includes'](_0x321591);
    _0x206b57(_0x1817ae) && (_0x318775(_0x57bd8d, _0x2bc34d, _0x5de9c6, !![]), _0x18d1f8(_0x2bc34d));
    _0x3879da(_0x1817ae, {
      id: _0x2a7819,
      type: 'asset-image-upload',
      scope: { assetId: _0x2bc34d, appearanceId: _0x5de9c6 },
      label: '上传' + (_0x30ed1c['name'] || '素材') + '图片',
      message: '正在保存本地图片',
    });
    try {
      const _0x1cca4b = await saveFile(_0x4bc5c4, _0x1817ae['projectId']);
      if (!_0x4b59bb()) {
        if (_0xe471ad(_0x1817ae))
          _0xdac38a(_0x1817ae, _0x2a7819, { status: 'cancelled', message: '目标形象已移除' });
        return ![];
      }
      const _0x47bdc0 = _0x15737d['appendAppearance']
        ? normalizeStoryAssetAppearance(
            {
              id: _0x2bc34d + '-upload-' + crypto['randomUUID'](),
              sourceOrigin: 'upload',
              prompt: _0x321591['prompt'],
              description: _0x321591['description'],
            },
            { assetId: _0x2bc34d, index: _0x30ed1c['appearances']['length'] },
          )
        : _0x321591;
      _0x356ec9(_0x30ed1c, _0x47bdc0, buildCanvasLocalImageFields(_0x1cca4b));
      if (_0x15737d['appendAppearance']) {
        (_0x30ed1c['appearances']['push'](_0x47bdc0), ensureStoryAssetBaseAppearance(_0x30ed1c));
        if (_0x206b57(_0x1817ae))
          _0x57bd8d['assetAppearanceIndexes'] = {
            ..._0x57bd8d['assetAppearanceIndexes'],
            [_0x2bc34d]: _0x30ed1c['appearances']['length'] - 0x1,
          };
      }
      return (_0xdac38a(_0x1817ae, _0x2a7819, { status: 'succeeded', message: '本地图片已保存' }), !![]);
    } catch (_0x1601e7) {
      if (!_0xe471ad(_0x1817ae)) return ![];
      _0xdac38a(_0x1817ae, _0x2a7819, {
        status: 'failed',
        message: '本地图片保存失败',
        error: _0x1601e7?.['message'] || '素材保存失败，请稍后重试。',
      });
      if (_0x206b57(_0x1817ae)) _0x10419d(_0x1601e7?.['message'] || '素材保存失败，请稍后重试。', 'error');
      return ![];
    } finally {
      (_0x3e7cd9['delete'](_0x49fc7e),
        _0x206b57(_0x1817ae) && (_0x318775(_0x57bd8d, _0x2bc34d, _0x5de9c6, ![]), _0x18d1f8(_0x2bc34d)));
    }
  }
  return { capture: _0x14aac9, upload: _0x549a3d };
}
export function bindStoryAssetImageDrop(
  _0x2aad92,
  { state: _0x1c0a11, capture: _0x5945df, upload: _0x57b850 } = {},
) {
  let _0x12a1f6 = null;
  const _0x3d49b7 = () => {
      (_0x12a1f6?.['classList']['remove']('is-image-drop-target'), (_0x12a1f6 = null));
    },
    _0x2245b2 = (_0x54e80f) => {
      if (
        _0x1c0a11['view'] !== 'project' ||
        _0x1c0a11['step'] !== 0x2 ||
        _0x1c0a11['assetFilter'] === 'library'
      )
        return null;
      const _0x24cdb2 =
        _0x54e80f['target']['closest']?.('[data-story-asset-id]') ||
        _0x54e80f['target']
          ['closest']?.('.story-asset-card-shell')
          ?.['querySelector']('[data-story-asset-id]');
      if (!_0x24cdb2 || !_0x2aad92['contains'](_0x24cdb2)) return null;
      const _0x98bcee = _0x1c0a11['data']?.['assets']?.['find'](
        (_0x34b612) => _0x34b612['id'] === _0x24cdb2['dataset']['storyAssetId'],
      );
      return _0x98bcee && !_0x98bcee['isLibraryAsset'] ? _0x24cdb2 : null;
    },
    _0x41c20c = (_0x3d1697) => {
      const _0x48d860 = _0x2245b2(_0x3d1697);
      if (!_0x48d860 || !Array['from'](_0x3d1697['dataTransfer']?.['types'] || [])['includes']('Files'))
        return;
      (_0x3d1697['preventDefault'](),
        _0x3d1697['stopPropagation'](),
        (_0x3d1697['dataTransfer']['dropEffect'] = 'copy'),
        _0x12a1f6 !== _0x48d860 &&
          (_0x3d49b7(), (_0x12a1f6 = _0x48d860), _0x48d860['classList']['add']('is-image-drop-target')));
    },
    _0x2a2ed4 = (_0xa9c07b) => {
      if (_0x12a1f6 && !_0x12a1f6['contains'](_0xa9c07b['relatedTarget'])) _0x3d49b7();
    },
    _0x3af5f2 = (_0x476ff6) => {
      const _0x48c843 = _0x2245b2(_0x476ff6);
      _0x3d49b7();
      if (!_0x48c843 || !_0x476ff6['dataTransfer']?.['files']?.['length']) return;
      (_0x476ff6['preventDefault'](), _0x476ff6['stopPropagation']());
      const _0x390867 = _0x5945df(_0x48c843['dataset']['storyAssetId'], { appendAppearance: !![] });
      void _0x57b850(_0x476ff6['dataTransfer']['files'][0x0], _0x390867);
    };
  return (
    _0x2aad92['addEventListener']('dragover', _0x41c20c, !![]),
    _0x2aad92['addEventListener']('dragleave', _0x2a2ed4, !![]),
    _0x2aad92['addEventListener']('drop', _0x3af5f2, !![]),
    {
      destroy() {
        (_0x3d49b7(),
          _0x2aad92['removeEventListener']('dragover', _0x41c20c, !![]),
          _0x2aad92['removeEventListener']('dragleave', _0x2a2ed4, !![]),
          _0x2aad92['removeEventListener']('drop', _0x3af5f2, !![]));
      },
    }
  );
}
