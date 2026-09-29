import { generateStoryboard3DProjectDraft } from './projectGeneration.js';
import { applyDirectorGeneratedLayer } from './directorGeneratedLayers.js';
import { normalizeDirectorSceneSettings } from './directorSceneSettings.js';
import { createStoryboard3DBinaryAssetRepository } from './binaryAssetRepository.js';
import { getModelManifest, sanitizeModelUiSchemaParams } from '../../manifests/index.js';
import { projectPublicModelCatalog } from '../modelCatalogProjection.js';
import {
  ensureModelGenerationReadiness,
  createMissingModelCredentialError,
} from '../../services/modelGenerationReadiness.js';
import { fetchRemoteBlob } from '../../../api/projectsV2Api.js';
import { createStoryboard3DProject } from './projectModel.js';
export function getDirectorPanoramaModels() {
  return projectPublicModelCatalog('image', {
    isEligible: (_0x17c26d) =>
      (_0x17c26d['inputSlots']?.['minByKind']?.['image'] || 0x0) === 0x0 &&
      _0x17c26d['uiSchema']?.['fields']?.['some'](
        (_0x45d279) =>
          _0x45d279['id'] === 'aspectRatio' &&
          _0x45d279['options']?.['some']((_0x5c6aa7) => _0x5c6aa7['value'] === '2:1'),
      ),
  });
}
export function createDirectorGenerationService({
  getProject: _0x2ba3a3,
  commitProject: _0x4f1659,
  notify: _0x37f3e9,
  generateDraft: generateDraft = generateStoryboard3DProjectDraft,
  imageRequest: _0x5e18a9,
  repository: repository = createStoryboard3DBinaryAssetRepository(),
  urlApi: urlApi = globalThis['URL'],
} = {}) {
  const _0x3c5e80 = new Set();
  let _0x1ab291 = ![];
  const _0x263406 = (_0x42eba6, _0x3d4634) =>
    JSON['stringify']({
      layer: _0x42eba6['generatedLayers']?.['find']((_0x4646c4) => _0x4646c4['id'] === _0x3d4634),
      objects: _0x42eba6['objects']['filter']((_0x4542b4) =>
        _0x42eba6['generatedLayers']
          ?.['find']((_0x51ffb1) => _0x51ffb1['id'] === _0x3d4634)
          ?.['objectIds']['includes'](_0x4542b4['id']),
      ),
    });
  return {
    isRunning(_0x11d79a) {
      return _0x3c5e80['has'](_0x11d79a);
    },
    recover(_0x1f8833) {
      if (
        !_0x2ba3a3(_0x1f8833)?.['generationJobs']?.['some'](
          (_0x1e6e25) => _0x1e6e25['status'] === 'running' && !_0x3c5e80['has'](_0x1e6e25['id']),
        )
      )
        return;
      _0x4f1659(
        _0x1f8833,
        (_0x25bd44) => {
          for (const _0x519f91 of _0x25bd44['generationJobs'] || [])
            if (_0x519f91['status'] === 'running' && !_0x3c5e80['has'](_0x519f91['id']))
              Object['assign'](_0x519f91, {
                status: 'failed',
                message: '上次生成已中断；请先核对服务端任务，再按需重新生成。',
              });
          return _0x25bd44;
        },
        { history: ![], label: '恢复生成任务状态' },
      );
    },
    dispose() {
      _0x1ab291 = !![];
      if (!_0x3c5e80['size']) void repository['close']?.();
    },
    async start(_0x4218db) {
      if (_0x1ab291) throw new Error('生成工作台已关闭。');
      const _0x99a68c = _0x2ba3a3(_0x4218db['projectId']),
        _0x55868c = _0x99a68c?.['scenes']['find']((_0x2942ed) => _0x2942ed['id'] === _0x4218db['sceneId']);
      if (!_0x55868c) throw new Error('生成目标场景不存在。');
      if (!String(_0x4218db['prompt'] || '')['trim']()) throw new Error('请输入场景描述。');
      const _0x56355d = _0x4218db['files'] || [];
      if (
        !Array['isArray'](_0x56355d) ||
        _0x56355d['length'] > 0x6 ||
        _0x56355d['some'](
          (_0x2488ad) =>
            !_0x2488ad['type']?.['startsWith']('image/') || _0x2488ad['size'] > 0x20 * 0x400 * 0x400,
        )
      )
        throw new Error('最多使用 6 张图片，每张不超过 32 MB。');
      const _0x302726 = _0x56355d['map']((_0x4886b4) => urlApi['createObjectURL'](_0x4886b4)),
        _0xa33b40 = _0x263406(_0x55868c, _0x4218db['layerId']),
        _0x65b005 = {
          id: 'generation-' + globalThis['crypto']['randomUUID'](),
          projectId: _0x99a68c['id'],
          sceneId: _0x55868c['id'],
          kind: _0x4218db['kind'],
          prompt: _0x4218db['prompt'],
          model: _0x4218db['model'],
          provider: _0x4218db['provider'],
          status: 'running',
          message: '正在准备生成…',
          createdAt: Date['now'](),
        };
      _0x3c5e80['add'](_0x65b005['id']);
      const _0x578704 = (_0x4b4e15) =>
        _0x4f1659(
          _0x99a68c['id'],
          (_0x5b7ae7) => {
            const _0x314a51 = _0x5b7ae7['generationJobs']?.['find'](
              (_0x25f6ae) => _0x25f6ae['id'] === _0x65b005['id'],
            );
            if (_0x314a51) Object['assign'](_0x314a51, _0x4b4e15);
            return _0x5b7ae7;
          },
          { history: ![], label: '生成进度' },
        );
      try {
        _0x4f1659(
          _0x99a68c['id'],
          (_0x37862b) => {
            return ((_0x37862b['generationJobs'] ||= [])['push'](_0x65b005), _0x37862b);
          },
          { history: ![], label: '开始场景生成' },
        );
        if (_0x4218db['kind'] === 'panorama') {
          const _0x1daf54 = getDirectorPanoramaModels()['find'](
            (_0x2242e9) => _0x2242e9['modelId'] === _0x4218db['model'],
          );
          if (!_0x1daf54) throw new Error('请选择支持 2:1 画幅的全景生成模型。');
          const _0x599cb5 = getModelManifest(_0x1daf54['modelId']),
            _0x27e549 = await ensureModelGenerationReadiness({
              modelId: _0x1daf54['modelId'],
              provider: _0x1daf54['provider'],
            });
          if (!_0x27e549['ready']) throw createMissingModelCredentialError(_0x27e549);
          const _0xaf194b = {
            ...sanitizeModelUiSchemaParams(_0x1daf54['modelId'], { aspectRatio: '2:1' }),
            model: _0x1daf54['modelId'],
            provider: _0x1daf54['provider'],
            prompt:
              '360-degree equirectangular panorama, seamless horizontal wrap, 2:1 projection, continuous horizon, no text. ' +
              _0x4218db['prompt'],
          };
          if (_0x302726['length'] && (_0x599cb5['inputSlots']?.['maxByKind']?.['image'] || 0x0) > 0x0)
            _0xaf194b['inputImageUrls'] = _0x302726['slice'](
              0x0,
              _0x599cb5['inputSlots']['maxByKind']['image'],
            );
          const _0x540cd5 = _0x5e18a9 || (await import('../../../api/aiImageApi.js'))['generateImage'],
            _0x100fda = await _0x540cd5(_0xaf194b, {
              onTaskMeta: ({ taskId: _0x5b8e93 }) => _0x578704({ taskId: _0x5b8e93, message: '全景生成中…' }),
              onTaskId: (_0x8fe54f) => _0x578704({ taskId: _0x8fe54f, message: '全景生成中…' }),
            }),
            _0x4738da = _0x100fda?.['images']?.[0x0] || _0x100fda;
          if (_0x4738da?.['error']) throw new Error(_0x4738da['error']);
          const _0x4430df = _0x4738da?.['imageUrl'] || _0x4738da?.['sourceUrl'];
          if (!_0x4430df) throw new Error('生成服务没有返回全景图片。');
          _0x578704({ message: '正在保存全景素材…' });
          const _0xff9fe9 = await fetchRemoteBlob(_0x4430df),
            _0x50abde = 'panorama-' + globalThis['crypto']['randomUUID']();
          (await repository['put']({
            assetId: _0x50abde,
            kind: 'background',
            descriptor: { sceneId: _0x55868c['id'], jobId: _0x65b005['id'] },
            primaryFile: { name: 'generated-panorama.png', blob: _0xff9fe9 },
            relatedFiles: [],
          }),
            _0x4f1659(
              _0x99a68c['id'],
              (_0x3ebaac) => {
                let _0x3fb4b1 = _0x3ebaac['scenes']['find'](
                  (_0x5dbdff) => _0x5dbdff['id'] === _0x55868c['id'],
                );
                !_0x3fb4b1 &&
                  ((_0x3fb4b1 = createStoryboard3DProject()['scenes'][0x0]),
                  (_0x3fb4b1['name'] = '生成的全景'),
                  _0x3ebaac['scenes']['push'](_0x3fb4b1));
                _0x3fb4b1['directorSettings'] = normalizeDirectorSceneSettings(_0x3fb4b1['directorSettings']);
                const _0xd7b299 = _0x3fb4b1['directorSettings']['panorama'];
                return (
                  Object['assign'](_0xd7b299, {
                    enabled: !![],
                    assetId: _0x50abde,
                    history: [
                      ..._0xd7b299['history'],
                      { assetId: _0x50abde, name: _0x4218db['prompt']['slice'](0x0, 0x3c) },
                    ],
                  }),
                  _0x3ebaac
                );
              },
              { history: !![], label: '应用生成全景' },
            ));
        } else {
          const _0x5284d9 = await generateDraft({
            ..._0x4218db,
            inputImageUrls: _0x302726,
            onProgress: ({ message: _0x38ce07 }) => _0x578704({ message: _0x38ce07 }),
          });
          _0x4f1659(
            _0x99a68c['id'],
            (_0x1a1cf3) => {
              const _0x1a9bbc = _0x1a1cf3['scenes']['find'](
                (_0x3bd844) => _0x3bd844['id'] === _0x55868c['id'],
              );
              if (!_0x1a9bbc) return (_0x1a1cf3['scenes']['push'](_0x5284d9['scenes'][0x0]), _0x1a1cf3);
              const _0x1ea1e4 =
                _0x4218db['layerId'] && _0x263406(_0x1a9bbc, _0x4218db['layerId']) === _0xa33b40
                  ? _0x4218db['layerId']
                  : '';
              return (
                applyDirectorGeneratedLayer(_0x1a9bbc, _0x5284d9['scenes'][0x0], {
                  layerId: _0x1ea1e4,
                  name: _0x4218db['prompt']['slice'](0x0, 0x3c),
                }),
                _0x1a1cf3
              );
            },
            { history: !![], label: '应用\x20AI\x20生成层' },
          );
        }
        (_0x578704({ status: 'completed', message: '生成完成，已保存到原项目。' }),
          _0x37f3e9?.('3D 场景生成完成，结果已保存到原项目。', 'success'));
      } catch (_0x57b314) {
        (_0x578704({ status: 'failed', message: _0x57b314['message'] }),
          _0x37f3e9?.('3D 生成失败：' + _0x57b314['message'], 'error'));
      } finally {
        (_0x3c5e80['delete'](_0x65b005['id']),
          _0x302726['forEach']((_0x5470e3) => urlApi['revokeObjectURL'](_0x5470e3)));
        if (_0x1ab291 && !_0x3c5e80['size']) void repository['close']?.();
      }
      return _0x65b005['id'];
    },
  };
}
