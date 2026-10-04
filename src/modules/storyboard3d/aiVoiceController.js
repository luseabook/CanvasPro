import {
  executeStoryboard3DAICommandPlan,
  generateStoryboard3DAICommandPlan,
  validateStoryboard3DAICommandPlan,
} from './aiCommandAgent.js';
import { createStoryboard3DAssetLibrary } from './assetLibrary.js';
import { STORYBOARD_3D_ACTIONS, STORYBOARD_3D_HAND_POSES } from './characterRig.js';
import {
  cloneStoryboard3DProject,
  createDefaultStoryboard3DTransform,
  createStoryboard3DScene,
  createStoryboard3DShot,
  migrateStoryboard3DProject,
} from './projectModel.js';
import { upsertStoryboard3DCameraKeyframe } from './shotAnimation.js';
import { createStoryboard3DVoiceInputService } from './voiceInputService.js';
import { executeDirectorAICommand } from './directorAICommands.js';
const ACTION_IDS = new Set(STORYBOARD_3D_ACTIONS['map']((value) => value['id'])),
  HAND_POSE_IDS = new Set(STORYBOARD_3D_HAND_POSES['map']((item) => item['id']));
function normalizedText(key) {
  return String(key || '')['trim']();
}
function createId(index, handler) {
  const result = typeof handler === 'function' ? handler(index) : globalThis['crypto']?.['randomUUID']?.();
  return (
    normalizedText(result) ||
    index + '_' + Date['now']() + '_' + Math['random']()['toString'](0x24)['slice'](0x2, 0xa)
  );
}
function requireScene(data, options) {
  const enabled = data['scenes']['find']((target) => target['id'] === options);
  if (!enabled) throw new Error('Scene does not exist: ' + options);
  return enabled;
}
function requireObject(source, next) {
  const enabled2 = source['objects']['find']((current) => current['id'] === next);
  if (!enabled2) throw new Error('Object\x20does\x20not\x20exist:\x20' + next);
  return enabled2;
}
function requireShot(entry, record) {
  const enabled3 = entry['shots']['find']((payload) => payload['id'] === record);
  if (!enabled3) throw new Error('Shot does not exist: ' + record);
  return enabled3;
}
function activeShot(handle) {
  return (
    handle['shots']['find']((state) => state['id'] === handle['activeShotId']) || handle['shots'][0x0] || null
  );
}
function mergeTransform(box, box2) {
  return {
    position: box2['position'] ? [...box2['position']] : [...box['position']],
    rotation: box2['rotation'] ? [...box2['rotation']] : [...box['rotation']],
    scale: box2['scale'] ? [...box2['scale']] : [...box['scale']],
  };
}
function resolveCamera(config, scope) {
  const input = scope?.(config['id']);
  if (input) return cloneStoryboard3DProject(input);
  return cloneStoryboard3DProject(activeShot(config)?.['camera'] || {});
}
function sceneLayout(output) {
  const list = output['objects']['filter']((value2) => value2['type'] !== 'camera');
  return {
    sceneId: output['id'],
    name: output['name'],
    objectCount: list['length'],
    objects: list['map']((value3) => ({
      objectId: value3['id'],
      type: value3['type'],
      name: value3['name'],
      visible: value3['visible'],
      locked: value3['locked'],
      transform: cloneStoryboard3DProject(value3['transform']),
    })),
  };
}
function executeSafeTool(value4, value5, value6) {
  const { args: args, sceneId: sceneId, tool: tool } = value5;
  if (tool === 'createScene') {
    const storyboard3DScene = createStoryboard3DScene({
      name: args['name'],
      now: value6['now'],
      idFactory: value6['idFactory'],
    });
    return (
      value4['scenes']['push'](storyboard3DScene),
      (value4['activeSceneId'] = storyboard3DScene['id']),
      { changed: !![], result: { sceneId: storyboard3DScene['id'] } }
    );
  }
  const requireScene2 = requireScene(value4, sceneId),
    executeDirectorAICommand2 = executeDirectorAICommand(requireScene2, tool, args);
  if (executeDirectorAICommand2) return executeDirectorAICommand2;
  if (tool === 'getSceneLayout') return { changed: ![], result: sceneLayout(requireScene2) };
  if (tool === 'listShots')
    return {
      changed: ![],
      result: requireScene2['shots']['map']((value7) => ({
        shotId: value7['id'],
        name: value7['name'],
        description: value7['description'],
        camera: cloneStoryboard3DProject(value7['camera']),
      })),
    };
  if (tool === 'checkComposition') {
    const activeShot2 = activeShot(requireScene2);
    return {
      changed: ![],
      result: {
        sceneId: requireScene2['id'],
        shotId: activeShot2?.['id'] || null,
        objectCount: requireScene2['objects']['filter'](
          (value8) => value8['visible'] !== ![] && value8['type'] !== 'camera',
        )['length'],
        camera: activeShot2 ? cloneStoryboard3DProject(activeShot2['camera']) : null,
      },
    };
  }
  if (tool === 'addProp') {
    const enabled4 = value6['assetLibrary']['find'](args['assetId']);
    if (!enabled4) throw new Error('Asset does not exist: ' + args['assetId']);
    if (!['builtin', 'pack']['includes'](enabled4['source']?.['kind']))
      throw new Error('Asset is not available to the 3D Agent: ' + args['assetId']);
    const value9 = {
      id: createId('prop', value6['idFactory']),
      type: 'prop',
      name: args['name'] || enabled4['name'],
      assetId: enabled4['source']?.['assetId'] || enabled4['id'],
      visible: !![],
      locked: ![],
      transform: mergeTransform(createDefaultStoryboard3DTransform(), args),
      castShadow: !![],
      receiveShadow: !![],
    };
    return (
      requireScene2['objects']['push'](value9),
      value6['usedAssetIds']['add'](args['assetId']),
      { changed: !![], result: { objectId: value9['id'] } }
    );
  }
  if (tool === 'addCharacter') {
    if (args['actionId'] && !ACTION_IDS['has'](args['actionId']))
      throw new Error('Character action does not exist: ' + args['actionId']);
    const value10 = {
      id: createId('character', value6['idFactory']),
      type: 'character',
      name: args['name'] || 'Character',
      bodyPresetId: args['bodyPreset'] || args['assetId'],
      ...(args['actionId'] ? { actionId: args['actionId'] } : {}),
      visible: !![],
      locked: ![],
      transform: mergeTransform(createDefaultStoryboard3DTransform(), args),
    };
    return (
      requireScene2['objects']['push'](value10),
      { changed: !![], result: { objectId: value10['id'] } }
    );
  }
  if (tool === 'addLight') {
    const value11 = {
      id: createId('light', value6['idFactory']),
      type: 'light',
      name: args['lightType'] + '\x20light',
      lightType: args['lightType'],
      color: args['color'] || '#ffffff',
      intensity: args['intensity'],
      visible: !![],
      locked: ![],
      transform: { ...createDefaultStoryboard3DTransform(), position: [...args['position']] },
      castShadow: args['lightType'] !== 'ambient',
    };
    return (
      requireScene2['objects']['push'](value11),
      { changed: !![], result: { objectId: value11['id'] } }
    );
  }
  if (tool === 'deleteObject') {
    const requireObject2 = requireObject(requireScene2, args['objectId']);
    if (requireObject2['locked']) throw new Error('Object is locked: ' + requireObject2['id']);
    return (
      (requireScene2['objects'] = requireScene2['objects']['filter'](
        (value12) => value12['id'] !== requireObject2['id'],
      )),
      { changed: !![], result: { objectId: requireObject2['id'] } }
    );
  }
  if (tool === 'updateObject') {
    const requireObject3 = requireObject(requireScene2, args['objectId']);
    if (requireObject3['locked'] && args['locked'] !== ![])
      throw new Error('Object is locked: ' + requireObject3['id']);
    if (args['name']) requireObject3['name'] = args['name'];
    if (typeof args['visible'] === 'boolean') requireObject3['visible'] = args['visible'];
    if (typeof args['locked'] === 'boolean') requireObject3['locked'] = args['locked'];
    return (
      (requireObject3['transform'] = mergeTransform(requireObject3['transform'], args)),
      { changed: !![], result: { objectId: requireObject3['id'] } }
    );
  }
  if (tool === 'setCharacterAction') {
    const requireObject4 = requireObject(requireScene2, args['objectId']);
    if (requireObject4['type'] !== 'character')
      throw new Error('Object is not a character: ' + requireObject4['id']);
    if (requireObject4['locked']) throw new Error('Object is locked: ' + requireObject4['id']);
    if (!ACTION_IDS['has'](args['actionId']))
      throw new Error('Character action does not exist: ' + args['actionId']);
    return (
      (requireObject4['actionId'] = args['actionId']),
      (requireObject4['actionTime'] = 0x0),
      { changed: !![], result: { objectId: requireObject4['id'], actionId: requireObject4['actionId'] } }
    );
  }
  if (tool === 'setHandPose') {
    const requireObject5 = requireObject(requireScene2, args['objectId']);
    if (requireObject5['type'] !== 'character')
      throw new Error('Object is not a character: ' + requireObject5['id']);
    if (requireObject5['locked']) throw new Error('Object is locked: ' + requireObject5['id']);
    if (!HAND_POSE_IDS['has'](args['poseId'])) throw new Error('Hand pose does not exist: ' + args['poseId']);
    return (
      (requireObject5[args['hand'] === 'right' ? 'rightHandPoseId' : 'leftHandPoseId'] = args['poseId']),
      {
        changed: !![],
        result: { objectId: requireObject5['id'], hand: args['hand'], poseId: args['poseId'] },
      }
    );
  }
  if (tool === 'adjustCamera') {
    const args2 = activeShot(requireScene2);
    if (!args2) throw new Error('Scene has no shot: ' + requireScene2['id']);
    return (
      (args2['camera'] = {
        ...args2['camera'],
        position: [...args['position']],
        target: [...args['target']],
        focalLength: args['focalLength'],
      }),
      (args2['animation'] = upsertStoryboard3DCameraKeyframe(args2['animation'], {
        time: 0x0,
        camera: args2['camera'],
      })),
      (args2['updatedAt'] = value6['now']),
      { changed: !![], result: { shotId: args2['id'] } }
    );
  }
  if (tool === 'addShot') {
    const camera = resolveCamera(requireScene2, value6['readCurrentCamera']),
      storyboard3DShot = createStoryboard3DShot({
        sceneId: requireScene2['id'],
        name: args['name'],
        description: args['description'],
        camera: camera,
        order: requireScene2['shots']['length'],
        now: value6['now'],
        idFactory: value6['idFactory'],
      });
    return (
      requireScene2['shots']['push'](storyboard3DShot),
      (requireScene2['activeShotId'] = storyboard3DShot['id']),
      { changed: !![], result: { shotId: storyboard3DShot['id'] } }
    );
  }
  if (tool === 'updateShot') {
    const requireShot2 = requireShot(requireScene2, args['shotId']);
    if (args['name']) requireShot2['name'] = args['name'];
    if (args['description']) requireShot2['description'] = args['description'];
    return (
      args['focalLength'] != null &&
        ((requireShot2['camera']['focalLength'] = args['focalLength']),
        (requireShot2['animation'] = upsertStoryboard3DCameraKeyframe(requireShot2['animation'], {
          time: 0x0,
          camera: requireShot2['camera'],
        }))),
      (requireShot2['updatedAt'] = value6['now']),
      { changed: !![], result: { shotId: requireShot2['id'] } }
    );
  }
  throw new Error('Unsupported safe storyboard tool: ' + tool);
}
export class Storyboard3DToolExecutionError extends Error {
  constructor(value13, { command: command, cause: cause } = {}) {
    (super(value13, { cause: cause }),
      (this['name'] = 'Storyboard3DToolExecutionError'),
      (this['commandId'] = command?.['commandId'] || null),
      (this['tool'] = command?.['tool'] || null));
  }
}
export function createStoryboard3DSafeToolExecutor({
  projectStore: projectStore,
  assetLibrary: assetLibrary = createStoryboard3DAssetLibrary(),
  idFactory: idFactory,
  now: now = () => Date['now'](),
  readCurrentCamera: readCurrentCamera,
} = {}) {
  if (typeof projectStore?.['getSnapshot'] !== 'function')
    throw new TypeError('A storyboard project store is required');
  const value14 = projectStore['replaceProject'] || projectStore['load'];
  if (typeof value14 !== 'function')
    throw new TypeError('The storyboard project store must support project replacement');
  return async function run(value15, value16 = {}) {
    const value17 = projectStore['getSnapshot'](),
      validateStoryboard3DAICommandPlan2 = validateStoryboard3DAICommandPlan(
        { transactionId: value16['transactionId'] || createId('transaction', idFactory), commands: value15 },
        { sceneIds: value17['scenes']['map']((value18) => value18['id']) },
      ),
      cloneStoryboard3DProject2 = cloneStoryboard3DProject(value17),
      list2 = [],
      value19 = new Set();
    let value20 = ![];
    const now2 = now();
    for (const value21 of validateStoryboard3DAICommandPlan2['commands']) {
      try {
        const executeSafeTool2 = executeSafeTool(cloneStoryboard3DProject2, value21, {
          assetLibrary: assetLibrary,
          idFactory: idFactory,
          now: now2,
          readCurrentCamera: readCurrentCamera,
          usedAssetIds: value19,
        });
        ((value20 ||= executeSafeTool2['changed']),
          list2['push']({
            commandId: value21['commandId'],
            tool: value21['tool'],
            changed: executeSafeTool2['changed'],
            result: executeSafeTool2['result'],
          }));
      } catch (value22) {
        throw new Storyboard3DToolExecutionError(
          '3D command failed: ' + value21['tool'] + ':\x20' + (value22?.['message'] || String(value22)),
          { command: value21, cause: value22 },
        );
      }
    }
    let migrateStoryboard3DProject2 = value17;
    return (
      value20 &&
        ((cloneStoryboard3DProject2['updatedAt'] = now2),
        (migrateStoryboard3DProject2 = migrateStoryboard3DProject(cloneStoryboard3DProject2, {
          now: now2,
          idFactory: idFactory,
        })),
        value14['call'](
          projectStore,
          migrateStoryboard3DProject2,
          'ai-transaction:' + validateStoryboard3DAICommandPlan2['transactionId'],
        ),
        value19['forEach']((value23) => assetLibrary['markUsed'](value23))),
      {
        ok: !![],
        transactionId: validateStoryboard3DAICommandPlan2['transactionId'],
        changed: value20,
        commands: list2,
        project: cloneStoryboard3DProject(migrateStoryboard3DProject2),
      }
    );
  };
}
function resolveOption(handler2) {
  return typeof handler2 === 'function' ? handler2() : handler2;
}
export class Storyboard3DAIVoiceController {
  constructor({
    projectStore: projectStore2,
    model: model,
    provider: provider,
    request: request,
    executeTransaction: executeTransaction,
    assetLibrary: assetLibrary2,
    idFactory: idFactory2,
    now: now3,
    readCurrentCamera: readCurrentCamera2,
    voiceServiceFactory: voiceServiceFactory = createStoryboard3DVoiceInputService,
    windowObject: windowObject = globalThis['window'],
    onStateChange: onStateChange,
    onTranscript: onTranscript,
    onPlan: onPlan,
    onExecution: onExecution,
    onError: onError,
  } = {}) {
    if (typeof projectStore2?.['getSnapshot'] !== 'function')
      throw new TypeError('A storyboard project store is required');
    ((this['projectStore'] = projectStore2),
      (this['assetLibrary'] = assetLibrary2 || createStoryboard3DAssetLibrary()),
      (this['model'] = model),
      (this['provider'] = provider),
      (this['request'] = request),
      (this['executeTransaction'] =
        executeTransaction ||
        createStoryboard3DSafeToolExecutor({
          projectStore: projectStore2,
          assetLibrary: this['assetLibrary'],
          idFactory: idFactory2,
          now: now3,
          readCurrentCamera: readCurrentCamera2,
        })),
      (this['onStateChange'] = onStateChange),
      (this['onTranscript'] = onTranscript),
      (this['onPlan'] = onPlan),
      (this['onExecution'] = onExecution),
      (this['onError'] = onError),
      (this['state'] = {
        status: 'idle',
        instruction: '',
        interimTranscript: '',
        plan: null,
        execution: null,
        error: null,
      }),
      (this['runToken'] = 0x0),
      (this['voiceService'] = voiceServiceFactory({
        windowObject: windowObject,
        onStateChange: (value24) => this['_handleVoiceState'](value24),
        onTranscript: (value25) => this['_handleTranscript'](value25),
        onError: (value26) => this['_fail'](value26),
      })));
  }
  ['_setState'](args3, value27) {
    this['state'] = { ...this['state'], ...args3 };
    const value28 = this['getSnapshot']();
    return (this['onStateChange']?.(value28, { reason: value27 }), value28);
  }
  ['_handleVoiceState'](value29) {
    if (['starting', 'listening', 'transcribing', 'stopping']['includes'](value29['state']))
      this['_setState']({ status: value29['state'], error: null }, 'voice-' + value29['state']);
    else
      this['state']['status'] !== 'planning' &&
        this['state']['status'] !== 'executing' &&
        this['_setState']({ status: 'idle' }, 'voice-idle');
  }
  ['_handleTranscript'](value30) {
    (this['_setState'](
      { instruction: value30['transcript'], interimTranscript: value30['interimText'] || '', error: null },
      'voice-transcript',
    ),
      this['onTranscript']?.(value30));
  }
  ['_fail'](value31) {
    const value32 = value31 instanceof Error ? value31 : new Error(value31?.['message'] || String(value31));
    return (
      this['_setState']({ status: 'error', error: value32 }, 'error'),
      this['onError']?.(value32),
      value32
    );
  }
  ['setInstruction'](value33) {
    return this['_setState'](
      { instruction: normalizedText(value33), interimTranscript: '', error: null },
      'set-instruction',
    );
  }
  ['startVoice'](value34) {
    return this['voiceService']['start'](value34);
  }
  ['stopVoice']() {
    return this['voiceService']['stop']();
  }
  ['abortVoice']() {
    return this['voiceService']['abort']();
  }
  async ['plan']({
    instruction: instruction = this['state']['instruction'],
    model: model2,
    provider: provider2,
  } = {}) {
    const value35 = ++this['runToken'];
    this['_setState']({ status: 'planning', error: null, execution: null }, 'planning');
    try {
      const generateStoryboard3DAICommandPlan2 = await generateStoryboard3DAICommandPlan({
        instruction: instruction,
        project: this['projectStore']['getSnapshot'](),
        model: normalizedText(model2 || resolveOption(this['model'])),
        provider: normalizedText(provider2 || resolveOption(this['provider'])),
        ...(this['request'] ? { request: this['request'] } : {}),
        assetLibrary: this['assetLibrary'],
        onProgress: (value36) =>
          this['onStateChange']?.(this['getSnapshot'](), { reason: value36['stage'], progress: value36 }),
      });
      if (value35 !== this['runToken']) return null;
      return (
        this['_setState']({ status: 'ready', plan: generateStoryboard3DAICommandPlan2 }, 'plan-ready'),
        this['onPlan']?.(generateStoryboard3DAICommandPlan2),
        generateStoryboard3DAICommandPlan2
      );
    } catch (value37) {
      if (value35 !== this['runToken']) return null;
      throw this['_fail'](value37);
    }
  }
  async ['executePlan'](enabled5 = this['state']['plan']) {
    if (!enabled5) throw this['_fail'](new Error('No 3D command plan is ready'));
    const value38 = ++this['runToken'];
    this['_setState']({ status: 'executing', error: null }, 'executing');
    try {
      const executeStoryboard3DAICommandPlan2 = await executeStoryboard3DAICommandPlan(enabled5, {
        executeTransaction: this['executeTransaction'],
      });
      if (value38 !== this['runToken']) return null;
      return (
        this['_setState'](
          {
            status: 'completed',
            plan: executeStoryboard3DAICommandPlan2,
            execution: executeStoryboard3DAICommandPlan2['execution'],
          },
          'completed',
        ),
        this['onExecution']?.(
          executeStoryboard3DAICommandPlan2['execution'],
          executeStoryboard3DAICommandPlan2,
        ),
        executeStoryboard3DAICommandPlan2
      );
    } catch (value39) {
      if (value38 !== this['runToken']) return null;
      throw this['_fail'](value39);
    }
  }
  async ['submit'](options2 = {}) {
    const enabled6 = await this['plan'](options2);
    if (!enabled6) return null;
    return this['executePlan'](enabled6);
  }
  ['cancel']() {
    return (
      (this['runToken'] += 0x1),
      this['abortVoice'](),
      this['_setState']({ status: 'idle', error: null }, 'cancel')
    );
  }
  ['getSnapshot']() {
    return {
      ...this['state'],
      plan: this['state']['plan'] ? cloneStoryboard3DProject(this['state']['plan']) : null,
      execution: this['state']['execution'] ? cloneStoryboard3DProject(this['state']['execution']) : null,
      voiceSupported: this['voiceService']['isSupported']?.() === !![],
    };
  }
  ['destroy']() {
    ((this['runToken'] += 0x1),
      this['voiceService']['destroy']?.(),
      this['_setState']({ status: 'idle' }, 'destroy'));
  }
}
export function createStoryboard3DAIVoiceController(value40) {
  return new Storyboard3DAIVoiceController(value40);
}
