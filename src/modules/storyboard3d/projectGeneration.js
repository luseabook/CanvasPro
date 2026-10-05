import { generateText } from '../../../api/aiTextApi.js';
import { listSceneAssets } from '../panoramaSceneNode/sceneAssetCatalog.js';
import {
  STORYBOARD_3D_SHOT_ANGLES,
  STORYBOARD_3D_SHOT_SIZES,
  createStoryboard3DProject,
  migrateStoryboard3DProject,
} from './projectModel.js';
import {
  STORYBOARD_3D_AI_ASSET_CANDIDATE_LIMIT,
  selectRelevantStoryboard3DAssets,
} from './assetCatalogSelection.js';
import { upsertStoryboard3DCameraKeyframe } from './shotAnimation.js';
import {
  applyStoryboard3DDiningLayout,
  describeStoryboard3DAssetSpatialMetadata,
  normalizeStoryboard3DGeneratedLayout,
  resolveStoryboard3DAssetSpatialMetadata,
} from './spatialLayout.js';
export const STORYBOARD_3D_PROMPT_MAX_CHARACTERS = 5000;
export const STORYBOARD_3D_GENERATION_SCHEMA_VERSION = 1;
const ENVIRONMENT_TYPES = new Set(['empty', 'outdoor', 'indoor', 'studio']),
  CHARACTER_GENDERS = new Set(['male', 'female']),
  ASSET_SIZES = new Set(['small', 'medium', 'large']),
  ASSET_COLORS = new Set(['blue', 'red', 'green', 'yellow', 'purple']),
  SHOT_SIZES = new Set(STORYBOARD_3D_SHOT_SIZES),
  SHOT_ANGLES = new Set(STORYBOARD_3D_SHOT_ANGLES),
  ASSET_CATALOG_TAG_LIMIT = 4,
  ASSET_CATALOG_TEXT_LIMIT = 80;
export const STORYBOARD_3D_GENERATION_SYSTEM_PROMPT = [
  '你是 3D 场景预演规划助手。',
  '你的任务是把用户的自然语言描述转换为一个可继续编辑的单场景 3D 预演方案。',
  '当请求附带参考图时，先观察图中的人物数量、主要物品、空间关系和摄像机视角，再用可用轻量资产搭建近似布局。',
  '参考图只用于粗略反推预演关系，不要追求精细建模、材质复刻或像素级还原。',
  '只使用提供的资产 familyId，不得编造资产、模型、贴图或文件 URL。',
  '空间坐标使用米；position、rotation、scale 都是长度为 3 的数字数组；rotation 使用弧度。',
  '可用资产附带标准空间尺寸、锚点和语义角色；优先依据这些数据规划间距和高度，不要猜测 Y 坐标。',
  '若是吃饭或聚餐场景，layout.kind 必须为 dining，participantCount 必须等于明确提及的用餐人数；每位人物需要对应座位。',
  '镜头需要完整给出 position、target 和 focalLength，并保证能看见主要主体。',
  '只返回严格 JSON，不要输出 Markdown、代码块、注释或额外说明。',
]['join']('\n');
function normalizeText(value) {
  return String(value || '')['trim']();
}
function clampNumber(item, key, index, result) {
  const data = Number(item);
  if (!Number['isFinite'](data)) return key;
  return Math['min'](result, Math['max'](index, data));
}
function normalizeVector3(options, target, source, next) {
  const current = Array['isArray'](options) ? options : [];
  return target['map']((entry, record) => clampNumber(current[record], entry, source[record], next[record]));
}
function getResultText(response) {
  if (typeof response === 'string') return response;
  return response?.['text'] || response?.['outputText'] || response?.['content'] || '';
}
function parseStrictJson(payload, handle) {
  if (payload && typeof payload === 'object' && !Array['isArray'](payload)) return payload;
  const text = normalizeText(payload);
  if (!text) throw new Error(handle);
  try {
    return JSON['parse'](text);
  } catch {
    throw new Error('场景 Agent 未返回有效的 JSON。');
  }
}
export function getStoryboard3DGenerationAssetFamilies(listSceneAssets2 = listSceneAssets()) {
  const args = new Map();
  return (
    (Array['isArray'](listSceneAssets2) ? listSceneAssets2 : [])['forEach']((state) => {
      const text2 = normalizeText(state?.['familyId']);
      if (!text2 || args['has'](text2)) return;
      args['set'](text2, {
        familyId: text2,
        category: normalizeText(state?.['category']),
        tags: [
          ...new Set(
            (state?.['tags'] || [])
              ['map'](normalizeText)
              ['filter']((config) => config && !ASSET_SIZES['has'](config) && !ASSET_COLORS['has'](config)),
          ),
        ]
          ['slice'](0, ASSET_CATALOG_TAG_LIMIT)
          ['map']((scope) => scope['slice'](0, ASSET_CATALOG_TEXT_LIMIT)),
        spatial: resolveStoryboard3DAssetSpatialMetadata(state),
      });
    }),
    [...args['values']()]
  );
}
export function buildStoryboard3DGenerationPrompt({
  prompt: prompt,
  assetFamilies: assetFamilies = getStoryboard3DGenerationAssetFamilies(),
  inputImageUrls: inputImageUrls = [],
} = {}) {
  const text3 = normalizeText(prompt)['slice'](0, STORYBOARD_3D_PROMPT_MAX_CHARACTERS);
  if (!text3) throw new Error('请先描述要搭建的 3D 场景。');
  const args2 = Array['isArray'](inputImageUrls) ? inputImageUrls['filter'](Boolean)['length'] : 0,
    relevantStoryboard3DAssets = selectRelevantStoryboard3DAssets(assetFamilies, text3, {
      limit: STORYBOARD_3D_AI_ASSET_CANDIDATE_LIMIT,
    });
  return JSON['stringify']({
    task: 'create_storyboard_3d_project',
    schemaVersion: STORYBOARD_3D_GENERATION_SCHEMA_VERSION,
    userPrompt: text3,
    referenceImageCount: args2,
    assetFamilyColumns: ['familyId', 'category', 'tags', 'spatial'],
    availableAssetFamilies: relevantStoryboard3DAssets['map']((input) => [
      normalizeText(input?.['familyId']),
      normalizeText(input?.['category'])['slice'](0, ASSET_CATALOG_TEXT_LIMIT),
      (Array['isArray'](input?.['tags']) ? input['tags'] : [])
        ['map'](normalizeText)
        ['filter'](Boolean)
        ['slice'](0, ASSET_CATALOG_TAG_LIMIT)
        ['map']((output) => output['slice'](0, ASSET_CATALOG_TEXT_LIMIT))
        ['join'](','),
      describeStoryboard3DAssetSpatialMetadata(input),
    ]),
    requirements: [
      '只生成一个主场景和一个主镜头。',
      '优先选择能表达空间关系的 3 到 12 个物体，避免重复堆叠。',
      '若描述包含人物，可使用 kind=character；其他可见物体使用 kind=asset。',
      '人物必须保留描述中明确的人数；吃饭或聚餐时，每个人配一把椅子，围绕餐桌布置，并把 layout.kind 设为 dining。',
      '餐具和食物使用 tabletop-item 资产，并把 position.y 放在餐桌 supportY 之上。',
      '桌椅、人物和餐具的间距优先遵守 availableAssetFamilies 的 spatial 描述；不要让它们互相穿插。',
      'availableAssetFamilies 每行按 assetFamilyColumns 排列；asset 的 familyId 必须逐字使用其中第一列。',
      'size 只能是 small、medium、large；color 只能是 blue、red、green、yellow、purple。',
      'environmentType 只能是 empty、outdoor、indoor、studio。',
      ...(args2 > 0
        ? [
            '参考图是场景布局依据：估计其中的人物数量、主要物品、前后左右关系与镜头方向。',
            '只需使用可用轻量资产建立大概空间关系，不要求精细外观或完全还原。',
          ]
        : []),
      'shotSize 只能是 ' + STORYBOARD_3D_SHOT_SIZES['join']('、') + '。',
      'shotAngle 只能是 ' + STORYBOARD_3D_SHOT_ANGLES['join']('、') + '。',
    ],
    outputSchema: {
      projectName: '项目名称',
      sceneName: '场景名称',
      environmentType: 'empty | outdoor | indoor | studio',
      backgroundColor: '可选的 #RRGGBB',
      layout: { kind: 'generic | dining', participantCount: 0 },
      objects: [
        {
          kind: 'asset | character',
          name: '物体名称',
          familyId: 'asset 必填',
          gender: 'character 使用 male | female',
          size: 'small | medium | large',
          color: 'blue | red | green | yellow | purple',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      ],
      shot: {
        name: '镜头名称',
        description: '镜头意图',
        shotSize: 'MED',
        shotAngle: 'eye',
        camera: { position: [5, 4, 7], target: [0, 1.2, 0], focalLength: 35 },
      },
    },
  });
}
export function parseStoryboard3DGenerationResult(
  value2,
  { assetFamilies: assetFamilies = getStoryboard3DGenerationAssetFamilies() } = {},
) {
  const strictJson = parseStrictJson(getResultText(value2), '场景 Agent 未返回可用的 3D 场景方案。'),
    text4 = normalizeText(strictJson['projectName']),
    text5 = normalizeText(strictJson['sceneName']);
  if (!text4) throw new Error('场景 Agent 返回结果缺少项目名称。');
  if (!text5) throw new Error('场景 Agent 返回结果缺少场景名称。');
  const value3 = new Map(assetFamilies['map']((value4) => [value4['familyId'], value4])),
    enabled = new Set(value3['keys']()),
    value5 = (Array['isArray'](strictJson['objects']) ? strictJson['objects'] : [])
      ['slice'](0, 24)
      ['map']((value6, value7) => {
        const args3 = value6?.['kind'] === 'character' ? 'character' : 'asset';
        if (args3 === 'asset' && !enabled['has'](normalizeText(value6?.['familyId']))) return null;
        return {
          kind: args3,
          name: normalizeText(value6?.['name']) || '物体 ' + (value7 + 1),
          ...(args3 === 'asset'
            ? {
                familyId: normalizeText(value6['familyId']),
                size: ASSET_SIZES['has'](value6?.['size']) ? value6['size'] : 'medium',
                color: ASSET_COLORS['has'](value6?.['color']) ? value6['color'] : 'blue',
              }
            : { gender: CHARACTER_GENDERS['has'](value6?.['gender']) ? value6['gender'] : 'male' }),
          position: normalizeVector3(
            value6?.['position'],
            [0, 0, 0],
            [-20, 0, -20],
            [20, 10, 20],
          ),
          rotation: normalizeVector3(
            value6?.['rotation'],
            [0, 0, 0],
            [-Math['PI'] * 2, -Math['PI'] * 2, -Math['PI'] * 2],
            [Math['PI'] * 2, Math['PI'] * 2, Math['PI'] * 2],
          ),
          scale: normalizeVector3(value6?.['scale'], [1, 1, 1], [0.25, 0.25, 0.25], [4, 4, 4]),
        };
      })
      ['filter'](Boolean),
    storyboard3DGeneratedLayout = normalizeStoryboard3DGeneratedLayout(strictJson['layout']),
    value8 = value5['some'](
      (value9) =>
        value9['kind'] === 'asset' &&
        resolveStoryboard3DAssetSpatialMetadata(value3['get'](value9['familyId']))['roles']['includes'](
          'table',
        ),
    ),
    count = value5['filter']((value10) => value10['kind'] === 'character')['length'],
    value11 =
      storyboard3DGeneratedLayout['kind'] === 'dining' || (value8 && count >= 2)
        ? {
            kind: 'dining',
            participantCount: Math['max'](storyboard3DGeneratedLayout['participantCount'], count),
          }
        : storyboard3DGeneratedLayout,
    value12 = strictJson['shot'] && typeof strictJson['shot'] === 'object' ? strictJson['shot'] : {},
    value13 = value12['camera'] && typeof value12['camera'] === 'object' ? value12['camera'] : {};
  return {
    schemaVersion: STORYBOARD_3D_GENERATION_SCHEMA_VERSION,
    projectName: text4,
    sceneName: text5,
    environmentType: ENVIRONMENT_TYPES['has'](strictJson['environmentType'])
      ? strictJson['environmentType']
      : 'empty',
    backgroundColor: /^#[0-9a-f]{6}$/i['test'](normalizeText(strictJson['backgroundColor']))
      ? normalizeText(strictJson['backgroundColor'])
      : '',
    layout: value11,
    objects: value5,
    shot: {
      name: normalizeText(value12['name']) || '主镜头',
      description: normalizeText(value12['description']),
      shotSize: SHOT_SIZES['has'](value12['shotSize']) ? value12['shotSize'] : 'MED',
      shotAngle: SHOT_ANGLES['has'](value12['shotAngle']) ? value12['shotAngle'] : 'eye',
      camera: {
        position: normalizeVector3(
          value13['position'],
          [5, 4, 7],
          [-50, 0.1, -50],
          [50, 30, 50],
        ),
        target: normalizeVector3(value13['target'], [0, 1.2, 0], [-20, 0, -20], [20, 20, 20]),
        focalLength: clampNumber(value13['focalLength'], 35, 18, 120),
      },
    },
  };
}
function resolveSceneAsset(list, value14) {
  return (
    list['find'](
      (value15) =>
        value15['familyId'] === value14['familyId'] &&
        value15['size'] === value14['size'] &&
        value15['colorKey'] === value14['color'],
    ) ||
    list['find'](
      (value16) =>
        value16['familyId'] === value14['familyId'] &&
        value16['size'] === 'medium' &&
        value16['colorKey'] === 'blue',
    )
  );
}
export function createStoryboard3DProjectFromGeneration(
  args4,
  {
    now: now = Date['now'](),
    idFactory: idFactory,
    projectId: projectId,
    assets: assets = listSceneAssets(),
  } = {},
) {
  const storyboard3DProject = createStoryboard3DProject({
      id: projectId,
      name: args4?.['projectName'],
      sceneName: args4?.['sceneName'],
      shotName: args4?.['shot']?.['name'],
      environmentType: args4?.['environmentType'],
      now: now,
      idFactory: idFactory,
    }),
    value17 = storyboard3DProject['scenes'][0];
  args4?.['backgroundColor'] && (value17['environment']['backgroundColor'] = args4['backgroundColor']);
  const value18 = (Array['isArray'](args4?.['objects']) ? args4['objects'] : [])
      ['map']((value19) => {
        const value20 = {
          position: value19['position'],
          rotation: value19['rotation'],
          scale: value19['scale'],
        };
        if (value19['kind'] === 'character')
          return {
            type: 'character',
            name: value19['name'],
            bodyPresetId: value19['gender'] === 'female' ? 'adult-female' : 'adult-male',
            transform: value20,
          };
        const sceneAsset = resolveSceneAsset(assets, value19);
        if (!sceneAsset) return null;
        return { type: 'prop', name: value19['name'], assetId: sceneAsset['id'], transform: value20 };
      })
      ['filter'](Boolean),
    value21 =
      args4?.['layout']?.['kind'] === 'dining'
        ? applyStoryboard3DDiningLayout(value18, {
            assets: assets,
            participantCount: args4['layout']['participantCount'],
          })
        : { objects: value18 };
  value17['objects'] = value21['objects'];
  const error = value17['shots'][0];
  return (
    (error['name'] = args4?.['shot']?.['name'] || error['name']),
    (error['description'] = args4?.['shot']?.['description'] || ''),
    (error['shotSize'] = args4?.['shot']?.['shotSize'] || error['shotSize']),
    (error['shotAngle'] = args4?.['shot']?.['shotAngle'] || error['shotAngle']),
    (error['camera'] = { ...error['camera'], ...args4?.['shot']?.['camera'] }),
    (error['animation'] = upsertStoryboard3DCameraKeyframe(error['animation'], {
      time: 0,
      camera: error['camera'],
    })),
    migrateStoryboard3DProject(storyboard3DProject, {
      now: now,
      idFactory: idFactory,
      fallbackProject: storyboard3DProject,
    })
  );
}
function buildRepairPrompt(value22, value23) {
  return JSON['stringify']({
    task: 'repair_invalid_storyboard_3d_project',
    originalRequest: JSON['parse'](value22),
    rejectionReason: normalizeText(value23?.['message']),
    instruction: '重新执行原任务，只返回符合原 outputSchema 的严格 JSON 对象。',
  });
}
export async function generateStoryboard3DProjectDraft({
  prompt: prompt2,
  model: model = '',
  provider: provider = '',
  request: request = generateText,
  onProgress: onProgress = null,
  now: now = Date['now'](),
  idFactory: idFactory2,
  projectId: projectId2,
  assets: assets = [],
  inputImageUrls: inputImageUrls = [],
} = {}) {
  const text6 = normalizeText(model),
    text7 = normalizeText(provider);
  if (!text6 || !text7) throw new Error('请先选择可用的文本模型。');
  if (!Array['isArray'](assets) || assets['length'] === 0)
    throw new Error('尚未安装 3D 模型包，无法生成场景。');
  const relevantStoryboard3DAssets2 = selectRelevantStoryboard3DAssets(assets, prompt2, {
      limit: STORYBOARD_3D_AI_ASSET_CANDIDATE_LIMIT,
    }),
    storyboard3DGenerationAssetFamilies = getStoryboard3DGenerationAssetFamilies(relevantStoryboard3DAssets2);
  if (storyboard3DGenerationAssetFamilies['length'] === 0)
    throw new Error('3D 模型包中没有可供场景 Agent 使用的素材。');
  const args5 = Array['isArray'](inputImageUrls)
      ? inputImageUrls['map'](normalizeText)['filter'](Boolean)['slice'](0, 6)
      : [],
    storyboard3DGenerationPrompt = buildStoryboard3DGenerationPrompt({
      prompt: prompt2,
      assetFamilies: storyboard3DGenerationAssetFamilies,
      inputImageUrls: args5,
    }),
    args6 = {
      model: text6,
      provider: text7,
      prompt: storyboard3DGenerationPrompt,
      systemPrompt: STORYBOARD_3D_GENERATION_SYSTEM_PROMPT,
      temperature: 0.35,
      timeoutMs: 240000,
      ...(args5['length'] > 0 ? { inputImageUrls: args5 } : {}),
    };
  onProgress?.({ stage: 'planning', message: '正在规划场景、物体与镜头' });
  const request2 = await request(args6);
  let storyboard3DGenerationResult;
  try {
    storyboard3DGenerationResult = parseStoryboard3DGenerationResult(request2, {
      assetFamilies: storyboard3DGenerationAssetFamilies,
    });
  } catch (value24) {
    onProgress?.({ stage: 'repairing', message: '正在校正场景结构' });
    const request3 = await request({
      ...args6,
      prompt: buildRepairPrompt(storyboard3DGenerationPrompt, value24),
      temperature: 0.1,
    });
    storyboard3DGenerationResult = parseStoryboard3DGenerationResult(request3, {
      assetFamilies: storyboard3DGenerationAssetFamilies,
    });
  }
  return (
    onProgress?.({ stage: 'building', message: '正在创建可编辑的 3D 项目' }),
    createStoryboard3DProjectFromGeneration(storyboard3DGenerationResult, {
      now: now,
      idFactory: idFactory2,
      projectId: projectId2,
      assets: assets,
    })
  );
}
