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
    isEligible: (value) =>
      (value['inputSlots']?.['minByKind']?.['image'] || 0x0) === 0x0 &&
      value['uiSchema']?.['fields']?.['some'](
        (item) => item['id'] === 'aspectRatio' && item['options']?.['some']((el) => el['value'] === '2:1'),
      ),
  });
}
export function createDirectorGenerationService({
  getProject: getProject,
  commitProject: commitProject,
  notify: notify,
  generateDraft: generateDraft = generateStoryboard3DProjectDraft,
  imageRequest: imageRequest,
  repository: repository = createStoryboard3DBinaryAssetRepository(),
  urlApi: urlApi = globalThis['URL'],
} = {}) {
  const map = new Set();
  let key = ![];
  const run = (layer, index) =>
    JSON['stringify']({
      layer: layer['generatedLayers']?.['find']((result) => result['id'] === index),
      objects: layer['objects']['filter']((data) =>
        layer['generatedLayers']
          ?.['find']((options) => options['id'] === index)
          ?.['objectIds']['includes'](data['id']),
      ),
    });
  return {
    isRunning(target) {
      return map['has'](target);
    },
    recover(source) {
      if (
        !getProject(source)?.['generationJobs']?.['some'](
          (response) => response['status'] === 'running' && !map['has'](response['id']),
        )
      )
        return;
      commitProject(
        source,
        (next) => {
          for (const response2 of next['generationJobs'] || [])
            if (response2['status'] === 'running' && !map['has'](response2['id']))
              Object['assign'](response2, {
                status: 'failed',
                message: '上次生成已中断；请先核对服务端任务，再按需重新生成。',
              });
          return next;
        },
        { history: ![], label: '恢复生成任务状态' },
      );
    },
    dispose() {
      key = !![];
      if (!map['size']) void repository['close']?.();
    },
    async start(kind) {
      if (key) throw new Error('生成工作台已关闭。');
      const projectId = getProject(kind['projectId']),
        sceneId = projectId?.['scenes']['find']((current) => current['id'] === kind['sceneId']);
      if (!sceneId) throw new Error('生成目标场景不存在。');
      if (!String(kind['prompt'] || '')['trim']()) throw new Error('请输入场景描述。');
      const list = kind['files'] || [];
      if (
        !Array['isArray'](list) ||
        list['length'] > 0x6 ||
        list['some'](
          (enabled) => !enabled['type']?.['startsWith']('image/') || enabled['size'] > 0x20 * 0x400 * 0x400,
        )
      )
        throw new Error('最多使用 6 张图片，每张不超过 32 MB。');
      const inputImageUrls = list['map']((entry) => urlApi['createObjectURL'](entry)),
        record = run(sceneId, kind['layerId']),
        jobId = {
          id: 'generation-' + globalThis['crypto']['randomUUID'](),
          projectId: projectId['id'],
          sceneId: sceneId['id'],
          kind: kind['kind'],
          prompt: kind['prompt'],
          model: kind['model'],
          provider: kind['provider'],
          status: 'running',
          message: '正在准备生成…',
          createdAt: Date['now'](),
        };
      map['add'](jobId['id']);
      const run2 = (payload) =>
        commitProject(
          projectId['id'],
          (handle) => {
            const state = handle['generationJobs']?.['find']((config) => config['id'] === jobId['id']);
            if (state) Object['assign'](state, payload);
            return handle;
          },
          { history: ![], label: '生成进度' },
        );
      try {
        commitProject(
          projectId['id'],
          (scope) => {
            return ((scope['generationJobs'] ||= [])['push'](jobId), scope);
          },
          { history: ![], label: '开始场景生成' },
        );
        if (kind['kind'] === 'panorama') {
          const modelId = getDirectorPanoramaModels()['find']((input) => input['modelId'] === kind['model']);
          if (!modelId) throw new Error('请选择支持 2:1 画幅的全景生成模型。');
          const modelManifest = getModelManifest(modelId['modelId']),
            modelGenerationReadiness = await ensureModelGenerationReadiness({
              modelId: modelId['modelId'],
              provider: modelId['provider'],
            });
          if (!modelGenerationReadiness['ready'])
            throw createMissingModelCredentialError(modelGenerationReadiness);
          const output = {
            ...sanitizeModelUiSchemaParams(modelId['modelId'], { aspectRatio: '2:1' }),
            model: modelId['modelId'],
            provider: modelId['provider'],
            prompt:
              '360-degree equirectangular panorama, seamless horizontal wrap, 2:1 projection, continuous horizon, no text. ' +
              kind['prompt'],
          };
          if (
            inputImageUrls['length'] &&
            (modelManifest['inputSlots']?.['maxByKind']?.['image'] || 0x0) > 0x0
          )
            output['inputImageUrls'] = inputImageUrls['slice'](
              0x0,
              modelManifest['inputSlots']['maxByKind']['image'],
            );
          const run3 = imageRequest || (await import('../../../api/aiImageApi.js'))['generateImage'],
            value2 = await run3(output, {
              onTaskMeta: ({ taskId: taskId }) => run2({ taskId: taskId, message: '全景生成中…' }),
              onTaskId: (taskId2) => run2({ taskId: taskId2, message: '全景生成中…' }),
            }),
            value3 = value2?.['images']?.[0x0] || value2;
          if (value3?.['error']) throw new Error(value3['error']);
          const enabled2 = value3?.['imageUrl'] || value3?.['sourceUrl'];
          if (!enabled2) throw new Error('生成服务没有返回全景图片。');
          run2({ message: '正在保存全景素材…' });
          const blob = await fetchRemoteBlob(enabled2),
            assetId = 'panorama-' + globalThis['crypto']['randomUUID']();
          (await repository['put']({
            assetId: assetId,
            kind: 'background',
            descriptor: { sceneId: sceneId['id'], jobId: jobId['id'] },
            primaryFile: { name: 'generated-panorama.png', blob: blob },
            relatedFiles: [],
          }),
            commitProject(
              projectId['id'],
              (value4) => {
                let error = value4['scenes']['find']((value5) => value5['id'] === sceneId['id']);
                !error &&
                  ((error = createStoryboard3DProject()['scenes'][0x0]),
                  (error['name'] = '生成的全景'),
                  value4['scenes']['push'](error));
                error['directorSettings'] = normalizeDirectorSceneSettings(error['directorSettings']);
                const args = error['directorSettings']['panorama'];
                return (
                  Object['assign'](args, {
                    enabled: !![],
                    assetId: assetId,
                    history: [
                      ...args['history'],
                      { assetId: assetId, name: kind['prompt']['slice'](0x0, 0x3c) },
                    ],
                  }),
                  value4
                );
              },
              { history: !![], label: '应用生成全景' },
            ));
        } else {
          const generateDraft2 = await generateDraft({
            ...kind,
            inputImageUrls: inputImageUrls,
            onProgress: ({ message: message }) => run2({ message: message }),
          });
          commitProject(
            projectId['id'],
            (value6) => {
              const enabled3 = value6['scenes']['find']((value7) => value7['id'] === sceneId['id']);
              if (!enabled3) return (value6['scenes']['push'](generateDraft2['scenes'][0x0]), value6);
              const layerId =
                kind['layerId'] && run(enabled3, kind['layerId']) === record ? kind['layerId'] : '';
              return (
                applyDirectorGeneratedLayer(enabled3, generateDraft2['scenes'][0x0], {
                  layerId: layerId,
                  name: kind['prompt']['slice'](0x0, 0x3c),
                }),
                value6
              );
            },
            { history: !![], label: '应用\x20AI\x20生成层' },
          );
        }
        (run2({ status: 'completed', message: '生成完成，已保存到原项目。' }),
          notify?.('3D 场景生成完成，结果已保存到原项目。', 'success'));
      } catch (message2) {
        (run2({ status: 'failed', message: message2['message'] }),
          notify?.('3D 生成失败：' + message2['message'], 'error'));
      } finally {
        (map['delete'](jobId['id']),
          inputImageUrls['forEach']((value8) => urlApi['revokeObjectURL'](value8)));
        if (key && !map['size']) void repository['close']?.();
      }
      return jobId['id'];
    },
  };
}
