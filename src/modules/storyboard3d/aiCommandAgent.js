import { generateText } from '../../../api/aiTextApi.js';
import { DIRECTOR_AI_TOOLS, normalizeDirectorAIArgs } from './directorAICommands.js';
import {
  STORYBOARD_3D_AI_ASSET_CANDIDATE_LIMIT,
  selectRelevantStoryboard3DAssets,
} from './assetCatalogSelection.js';
import {
  describeStoryboard3DAssetSpatialMetadata,
  resolveStoryboard3DAssetSpatialMetadata,
} from './spatialLayout.js';
export const STORYBOARD_3D_AI_COMMAND_TOOLS = Object['freeze']([
  ...DIRECTOR_AI_TOOLS,
  'createScene',
  'getSceneLayout',
  'addProp',
  'addCharacter',
  'addLight',
  'updateObject',
  'deleteObject',
  'setCharacterAction',
  'setHandPose',
  'adjustCamera',
  'checkComposition',
  'addShot',
  'updateShot',
  'listShots',
]);
const TOOL_SET = new Set(STORYBOARD_3D_AI_COMMAND_TOOLS),
  READ_ONLY_TOOL_SET = new Set(['getSceneLayout', 'checkComposition', 'listShots']);
export const STORYBOARD_3D_AI_COMMAND_SYSTEM_PROMPT = [
  '你是 3D 场景预演编辑 Agent。',
  '只能返回受控 JSON 命令，不得返回 JavaScript、HTML、Markdown 或解释文字。',
  '只能使用 outputSchema 中列出的 tool。',
  '引用已有对象时必须使用上下文里真实存在的 sceneId、objectId、shotId。',
  'availableAssets.rows 每行按 availableAssets.columns 排列；添加道具时，assetId 必须逐字使用第一列的真实 id。',
  '不要搜索、猜测或编造资产 ID；availableAssets 已经是完整可用清单。',
  'position、rotation、scale、target 都是长度为 3 的有限数字数组，rotation 使用弧度。',
  'availableAssets 的 spatial 列描述资产尺寸、锚点和语义角色；摆放时必须据此避免悬空、穿插或错误高度。',
  '不要直接操作 Three.js；所有修改必须表示为命令。',
  '同一次用户请求的全部修改使用同一个 transactionId，失败时由执行器整体回滚。',
]['join']('\n');
function normalizeText(value) {
  return String(value || '')['trim']();
}
function resultText(item) {
  if (typeof item === 'string') return item;
  return item?.['text'] || item?.['outputText'] || item?.['content'] || '';
}
function finiteNumber(key, index, { min: min = -100000, max: max = 100000 } = {}) {
  const result = Number(key);
  if (!Number['isFinite'](result) || result < min || result > max)
    throw new TypeError(
      index + ' must be a finite number between ' + min + ' and ' + max + '.',
    );
  return result;
}
function vector3(data, options, args = null) {
  if (data == null && args) return [...args];
  if (!Array['isArray'](data) || data['length'] !== 3)
    throw new TypeError(options + ' must contain exactly three numbers.');
  return data['map']((target, source) => finiteNumber(target, options + '[' + source + ']'));
}
function requiredId(next, current) {
  const text = normalizeText(next);
  if (!text) throw new TypeError(current + ' is required.');
  return text;
}
function optionalText(entry, record = 500) {
  return normalizeText(entry)['slice'](0, record);
}
function normalizeTransformArgs(payload, { partial: partial = ![] } = {}) {
  const box = {};
  return (
    (!partial || payload['position'] != null) &&
      (box['position'] = vector3(payload['position'], 'args.position', [0, 0, 0])),
    (!partial || payload['rotation'] != null) &&
      (box['rotation'] = vector3(payload['rotation'], 'args.rotation', [0, 0, 0])),
    (!partial || payload['scale'] != null) &&
      (box['scale'] = vector3(payload['scale'], 'args.scale', [1, 1, 1])['map']((handle, state) =>
        finiteNumber(handle, 'args.scale[' + state + ']', { min: 0.001, max: 1000 }),
      )),
    box
  );
}
function normalizeCommandArgs(config, scope = {}) {
  const error = scope && typeof scope === 'object' && !Array['isArray'](scope) ? scope : {},
    directorAIArgs = normalizeDirectorAIArgs(config, error, {
      requiredId: requiredId,
      vector3: vector3,
      finiteNumber: finiteNumber,
    });
  if (directorAIArgs) return directorAIArgs;
  switch (config) {
    case 'createScene':
      return { name: optionalText(error['name'], 120) || '新场景' };
    case 'getSceneLayout':
    case 'listShots':
    case 'checkComposition':
      return {};
    case 'addProp':
      return {
        assetId: requiredId(error['assetId'], 'args.assetId'),
        name: optionalText(error['name'], 120),
        ...normalizeTransformArgs(error),
      };
    case 'addCharacter':
      return {
        assetId: requiredId(error['assetId'], 'args.assetId'),
        name: optionalText(error['name'], 120),
        bodyPreset: optionalText(error['bodyPreset'], 80),
        actionId: optionalText(error['actionId'], 120),
        ...normalizeTransformArgs(error),
      };
    case 'addLight':
      return {
        lightType: ['directional', 'point', 'spot', 'ambient']['includes'](error['lightType'])
          ? error['lightType']
          : 'directional',
        intensity: finiteNumber(error['intensity'] ?? 1, 'args.intensity', { min: 0, max: 100 }),
        color: optionalText(error['color'], 32),
        position: vector3(error['position'], 'args.position', [3, 5, 3]),
        target: vector3(error['target'], 'args.target', [0, 0, 0]),
      };
    case 'updateObject':
      return {
        objectId: requiredId(error['objectId'], 'args.objectId'),
        name: optionalText(error['name'], 120),
        visible: typeof error['visible'] === 'boolean' ? error['visible'] : undefined,
        locked: typeof error['locked'] === 'boolean' ? error['locked'] : undefined,
        ...normalizeTransformArgs(error, { partial: !![] }),
      };
    case 'deleteObject':
      return { objectId: requiredId(error['objectId'], 'args.objectId') };
    case 'setCharacterAction':
      return {
        objectId: requiredId(error['objectId'], 'args.objectId'),
        actionId: requiredId(error['actionId'], 'args.actionId'),
      };
    case 'setHandPose':
      return {
        objectId: requiredId(error['objectId'], 'args.objectId'),
        hand: error['hand'] === 'right' ? 'right' : 'left',
        poseId: requiredId(error['poseId'], 'args.poseId'),
      };
    case 'adjustCamera':
      return {
        position: vector3(error['position'], 'args.position', [0, 1.6, 5]),
        target: vector3(error['target'], 'args.target', [0, 1, 0]),
        focalLength: finiteNumber(error['focalLength'] ?? 50, 'args.focalLength', { min: 8, max: 300 }),
      };
    case 'addShot':
      return {
        name: optionalText(error['name'], 120) || '新镜头',
        description: optionalText(error['description'], 1000),
      };
    case 'updateShot':
      return {
        shotId: requiredId(error['shotId'], 'args.shotId'),
        name: optionalText(error['name'], 120),
        description: optionalText(error['description'], 1000),
        focalLength:
          error['focalLength'] == null
            ? undefined
            : finiteNumber(error['focalLength'], 'args.focalLength', { min: 8, max: 300 }),
      };
    default:
      throw new TypeError('Unsupported storyboard AI tool: ' + config);
  }
}
export function validateStoryboard3DAICommandPlan(
  enabled,
  { sceneIds: sceneIds = [], maximumCommands: maximumCommands = 50 } = {},
) {
  if (!enabled || typeof enabled !== 'object' || Array['isArray'](enabled))
    throw new TypeError('AI command plan must be an object.');
  const requiredId2 = requiredId(enabled['transactionId'], 'transactionId'),
    input = Array['isArray'](enabled['commands']) ? enabled['commands'] : [];
  if (input['length'] === 0 || input['length'] > maximumCommands)
    throw new RangeError('commands must contain between 1 and ' + maximumCommands + ' items.');
  const enabled2 = new Set(sceneIds['map'](normalizeText)['filter'](Boolean)),
    output = input['map']((enabled3, value2) => {
      if (!enabled3 || typeof enabled3 !== 'object' || Array['isArray'](enabled3))
        throw new TypeError('commands[' + value2 + '] must be an object.');
      const text2 = normalizeText(enabled3['tool']);
      if (!TOOL_SET['has'](text2)) throw new TypeError('commands[' + value2 + '].tool is not allowed.');
      const text3 = normalizeText(enabled3['sceneId']);
      if (text2 !== 'createScene') {
        if (!text3) throw new TypeError('commands[' + value2 + '].sceneId is required.');
        if (enabled2['size'] > 0 && !enabled2['has'](text3))
          throw new TypeError('commands[' + value2 + '].sceneId does not exist.');
      }
      return {
        commandId: normalizeText(enabled3['commandId']) || requiredId2 + ':' + (value2 + 1),
        transactionId: requiredId2,
        tool: text2,
        sceneId: text3,
        source: 'ai',
        args: normalizeCommandArgs(text2, enabled3['args']),
      };
    });
  return {
    transactionId: requiredId2,
    summary: optionalText(enabled['summary'], 1000),
    commands: output,
    readOnly: output['every']((value3) => READ_ONLY_TOOL_SET['has'](value3['tool'])),
  };
}
function buildProjectContext(value4, value5 = []) {
  const list = Array['isArray'](value4?.['scenes']) ? value4['scenes'] : [],
    value6 = new Map(
      (Array['isArray'](value5) ? value5 : [])
        ['filter']((value7) => value7?.['id'])
        ['map']((value8) => [value8['id'], value8]),
    );
  return {
    projectId: normalizeText(value4?.['id']),
    projectName: normalizeText(value4?.['name']),
    activeSceneId: normalizeText(value4?.['activeSceneId']),
    scenes: list['map']((error2) => ({
      sceneId: normalizeText(error2?.['id']),
      name: normalizeText(error2?.['name']),
      objects: (Array['isArray'](error2?.['objects']) ? error2['objects'] : [])['map']((value9) => ({
        objectId: normalizeText(value9?.['id']),
        type: normalizeText(value9?.['type']),
        name: normalizeText(value9?.['name']),
        assetId: normalizeText(value9?.['assetId']),
        bodyPresetId: normalizeText(value9?.['bodyPresetId']),
        spatial: resolveStoryboard3DAssetSpatialMetadata(
          value9?.['type'] === 'character'
            ? { id: value9?.['bodyPresetId'], category: 'character' }
            : value6['get'](value9?.['assetId']),
        ),
        transform: value9?.['transform'],
      })),
      shots: (Array['isArray'](error2?.['shots']) ? error2['shots'] : [])['map']((value10) => ({
        shotId: normalizeText(value10?.['id']),
        name: normalizeText(value10?.['name']),
        description: normalizeText(value10?.['description']),
        camera: value10?.['camera'],
      })),
    })),
  };
}
function buildAvailableAssetContext(list2 = []) {
  const value11 = (Array['isArray'](list2) ? list2 : [])
    ['filter']((value12) => ['builtin', 'pack']['includes'](value12?.['source']?.['kind']))
    ['map']((value13) => [
      normalizeText(value13?.['id']),
      normalizeText(value13?.['name'])['slice'](0, 80),
      normalizeText(value13?.['category'])['slice'](0, 80),
      (Array['isArray'](value13?.['tags']) ? value13['tags'] : [])
        ['map'](normalizeText)
        ['filter'](Boolean)
        ['slice'](0, 4)
        ['map']((value14) => value14['slice'](0, 80))
        ['join'](','),
      describeStoryboard3DAssetSpatialMetadata(value13),
    ])
    ['filter']((value15) => value15[0]);
  return { columns: ['id', 'name', 'category', 'tags', 'spatial'], rows: value11 };
}
export function buildStoryboard3DAICommandPrompt({
  instruction: instruction,
  project: project,
  assets: assets = [],
} = {}) {
  const text4 = normalizeText(instruction)['slice'](0, 5000);
  if (!text4) throw new Error('请输入要执行的 3D 场景指令。');
  const value16 = (Array['isArray'](assets) ? assets : [])['filter']((value17) =>
    ['builtin', 'pack']['includes'](value17?.['source']?.['kind']),
  );
  return JSON['stringify']({
    task: 'plan_storyboard_3d_commands',
    instruction: text4,
    context: buildProjectContext(project, value16),
    availableAssets: buildAvailableAssetContext(
      selectRelevantStoryboard3DAssets(value16, text4, { limit: STORYBOARD_3D_AI_ASSET_CANDIDATE_LIMIT }),
    ),
    allowedTools: STORYBOARD_3D_AI_COMMAND_TOOLS,
    directorTools: {
      setCameraPath: 'shotId, points:[[x,y,z],...], start, duration, smooth',
      setObjectPath: 'shotId, objectId, points, start, duration, smooth',
      setCameraMotion: 'shotId, preset:orbit/arc/push/pull/crane/slide/spiral, start, duration, amount',
      setCameraFollow:
        'shotId, mode:relative/path/fixed, followObjectId, lookAtObjectId, followOffset, lookAtOffset, start, duration',
      addActionClip: 'shotId, objectId, actionId, start, duration, speed',
    },
    outputSchema: {
      transactionId: '非空字符串',
      summary: '执行摘要',
      commands: [
        {
          commandId: '可选；事务内唯一',
          tool: 'allowedTools 中的一项',
          sceneId: '真实场景 ID；仅 createScene 可为空',
          args: '与 tool 对应的参数对象',
        },
      ],
    },
  });
}
function parseCommandPlanResult(value18) {
  const text5 = normalizeText(resultText(value18));
  if (!text5) throw new Error('3D Agent 未返回命令计划。');
  try {
    return JSON['parse'](text5);
  } catch {
    throw new Error('3D Agent 未返回有效的严格 JSON。');
  }
}
export async function generateStoryboard3DAICommandPlan({
  instruction: instruction2,
  project: project2,
  model: model,
  provider: provider,
  request: request = generateText,
  assetLibrary: assetLibrary,
  onProgress: onProgress,
} = {}) {
  const requiredId3 = requiredId(model, 'model'),
    requiredId4 = requiredId(provider, 'provider'),
    storyboard3DAICommandPrompt = buildStoryboard3DAICommandPrompt({
      instruction: instruction2,
      project: project2,
      assets: assetLibrary?.['list']?.({ limit: 1600 }) || [],
    }),
    value19 = (project2?.['scenes'] || [])['map']((value20) => value20?.['id'])['filter'](Boolean),
    args2 = {
      model: requiredId3,
      provider: requiredId4,
      prompt: storyboard3DAICommandPrompt,
      systemPrompt: STORYBOARD_3D_AI_COMMAND_SYSTEM_PROMPT,
      temperature: 0.15,
      timeoutMs: 240000,
    };
  onProgress?.({ stage: 'planning', message: '正在规划受控场景命令' });
  const request2 = await request(args2);
  try {
    return validateStoryboard3DAICommandPlan(parseCommandPlanResult(request2), { sceneIds: value19 });
  } catch (value21) {
    onProgress?.({ stage: 'repairing', message: '正在校正命令参数' });
    const request3 = await request({
      ...args2,
      prompt: JSON['stringify']({
        originalTask: JSON['parse'](storyboard3DAICommandPrompt),
        rejectionReason: value21?.['message'] || String(value21),
        instruction: '重新执行原任务，只返回符合 outputSchema 的严格 JSON。',
      }),
      temperature: 0.05,
    });
    return validateStoryboard3DAICommandPlan(parseCommandPlanResult(request3), { sceneIds: value19 });
  }
}
export async function executeStoryboard3DAICommandPlan(
  value22,
  { executeTransaction: executeTransaction } = {},
) {
  if (typeof executeTransaction !== 'function') throw new TypeError('executeTransaction must be provided.');
  const args3 = validateStoryboard3DAICommandPlan(value22),
    value23 = await executeTransaction(args3['commands'], {
      transactionId: args3['transactionId'],
      source: 'ai',
    });
  return { ...args3, execution: value23 };
}
