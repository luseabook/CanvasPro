import {
  createCollaborationApi,
  fetchCollaborationConfig,
  encodeCollaborationInvite,
  decodeCollaborationInvite,
} from '../../../api/canvasCollaborationApi.js';
import { createCollaborationSession } from './collaborationSession.js';
import { createCollaborationCanvasBinding } from './collaborationCanvasBinding.js';
const STORAGE_KEY = 'aicanvas.collaboration.session.v2',
  RESUME_KEY = 'aicanvas.collaboration.resume.v3';
export function createCollaborationApplication({
  store: store,
  canvasTabs: canvasTabs,
  ensureInstallId: ensureInstallId,
  ensureDeviceId: ensureDeviceId,
  resetHistory: resetHistory,
  storage: storage = globalThis['sessionStorage'],
  fetchConfig: fetchConfig = fetchCollaborationConfig,
  createApi: createApi = createCollaborationApi,
  createSession: createSession = createCollaborationSession,
  onChange: onChange = () => {},
  onPresence: onPresence = () => {},
  onNotice: onNotice = () => {},
  onComment: onComment = () => {},
  saveProject: saveProject,
  resumeStorage: resumeStorage,
}) {
  let storage2 = resumeStorage || storage;
  if (!resumeStorage)
    try {
      storage2 = globalThis['localStorage'] || storage;
    } catch {}
  const actorId = {
    authenticated: false,
    authenticating: false,
    authError: null,
    actorId: '',
    rooms: [],
    session: null,
    nodeCount: 0,
  };
  let api = null,
    resumeRoom = null,
    handler = () => {},
    serverUrl = null,
    displayName = '成员',
    clientId = crypto['randomUUID'](),
    value = 0,
    enabled = false,
    item = false,
    enabled2 = null,
    key = 0,
    value2 = null,
    index = 0;
  const run = () => {
      if (enabled) throw new DOMException('Aborted', 'AbortError');
    },
    getCanvasId = () => canvasTabs['getActiveCanvasId'](),
    collaborationCanvasBinding = createCollaborationCanvasBinding({
      storage: storage2,
      canvasTabs: canvasTabs,
      actorId: () => actorId['actorId'],
    }),
    collaborationCanvasBinding2 = createCollaborationCanvasBinding({
      storage: storage2,
      canvasTabs: canvasTabs,
      actorId: () => actorId['actorId'],
      hosting: false,
    }),
    getState = () => ({
      ...actorId,
      hostPortConflict:
        !resumeRoom &&
        enabled2?.['canvasId'] === getCanvasId() &&
        enabled2?.['actorId'] === actorId['actorId']
          ? enabled2['details']
          : null,
      resumeRoom: resumeRoom
        ? null
        : collaborationCanvasBinding['resumeFor'](getCanvasId()) ||
          collaborationCanvasBinding2['resumeFor'](getCanvasId()) ||
          (actorId['resumeRoom']?.['canvasId'] === getCanvasId() &&
          actorId['resumeRoom']?.['actorId'] === actorId['actorId']
            ? actorId['resumeRoom']
            : null),
      displayName: displayName,
      nodeCount: Object['keys'](store['getStateRaw']()['nodes'] || {})['length'],
    }),
    refreshCanvas = () => {
      if (!enabled) onChange(getState());
    };
  async function run2() {
    if (!serverUrl) {
      const fetchConfig2 = await fetchConfig();
      (run(), (serverUrl = fetchConfig2));
    }
    run();
    if (!api) api = createApi(serverUrl);
    return api;
  }
  async function run3(args) {
    if (!actorId['authenticated']) throw new Error('请先验证已激活的画布身份');
    try {
      return await api['rpc']({ ...args, clientId: clientId });
    } catch (result) {
      ['SESSION_EXPIRED', 'ACTIVATION_REQUIRED']['includes'](result['code']) &&
        !resumeRoom &&
        ((actorId['authenticated'] = false), storage?.['removeItem'](STORAGE_KEY), refreshCanvas());
      throw result;
    }
  }
  async function refreshRooms() {
    const data = api,
      options = key;
    try {
      const target = await data['listRooms'](clientId);
      if (enabled || api !== data || options !== key) return;
      ((actorId['rooms'] = target['rooms']), refreshCanvas());
    } catch (source) {
      !enabled &&
        api === data &&
        options === key &&
        ['SESSION_EXPIRED', 'ACTIVATION_REQUIRED']['includes'](source['code']) &&
        !resumeRoom &&
        ((actorId['authenticated'] = false), storage?.['removeItem'](STORAGE_KEY), refreshCanvas());
      throw source;
    }
  }
  function run4() {
    run();
    if (resumeRoom || item) throw new Error('请先结束当前画布的联机');
    if (
      Object['values'](store['getStateRaw']()['nodes'] || {})['some'](
        (next) => next['isGenerating'] || next['isLoading'],
      )
    )
      throw new Error('请等待当前生成任务结束后开启协作');
  }
  async function run5(room, publish = false) {
    run();
    if (!room['roomId'] || !room['document'] || !room['role'] || !Array['isArray'](room['members']))
      throw new Error('协作房间响应无效，请检查服务部署');
    const current = ++value,
      label = !!api['getConnection']()?.['hosting'],
      entry = label ? collaborationCanvasBinding : collaborationCanvasBinding2,
      mediaBindings = !publish && (await entry['activate'](room['roomId'])),
      hostBase = mediaBindings ? await entry['baseline'](room['roomId']) : null;
    if (mediaBindings && !hostBase)
      throw new Error('此画布的上次同步记录不可用，已保留本机内容，请勿覆盖保存');
    run();
    if (!publish && !mediaBindings) {
      if ((await canvasTabs['addCanvas']()) === false) throw new Error('无法创建协作画布标签页');
      (run(), canvasTabs['renameCanvas'](getCanvasId(), room['name']));
    }
    const canvasId = getCanvasId(),
      record = canvasTabs['getCanvasProjectAccess']?.(canvasId),
      payload = mediaBindings ? entry['originalAccess'](room['roomId'], record) : record,
      handler2 = (response) => {
        const canSave = label && !response['mediaNodes']?.['some']((enabled3) => !enabled3['owned']),
          badge =
            response['status'] === 'online' && response['presenceStatus'] !== 'offline'
              ? label
                ? 'shared-host'
                : 'shared'
              : '',
          handle = canvasTabs['getCanvasProjectAccess']?.(canvasId);
        if (handle?.['canSave'] !== canSave || handle?.['badge'] !== badge)
          canvasTabs['setCanvasProjectAccess']?.(canvasId, {
            badge: badge,
            label: label ? '协作房主' : '协作成员',
            canSave: canSave,
            saveMessage: canSave
              ? ''
              : label
                ? '成员素材尚未传输完成，请等待完成后保存'
                : '这是协作项目，只能由房主保存',
          });
      };
    ((resumeRoom = createSession({
      store: store,
      api: api,
      room: room,
      actorId: actorId['actorId'],
      clientId: clientId,
      getCanvasId: getCanvasId,
      hosting: label,
      onChange(args2) {
        if (current !== value) return;
        (handler2(args2),
          (actorId['session'] = {
            ...args2,
            hosting: label,
            hostAddresses: api['getConnection']()?.['endpoint']?.['addresses'] || [],
          }),
          refreshCanvas());
      },
      onPresence(state) {
        if (current !== value || !actorId['session']) return;
        (Object['assign'](actorId['session'], state),
          handler2(actorId['session']),
          onPresence(actorId['session']));
      },
      onConfirmed(config, scope) {
        return entry['checkpoint'](room['roomId'], config, scope);
      },
      onAttention(input) {
        if (current === value && !enabled)
          onNotice(
            input ? '房主已召集你到 TA 的视角' : '房主发起了召集；你已关闭自动跟随，当前视角保持不变',
          );
      },
      onNotice: onNotice,
      onComment: onComment,
      onDetach() {
        if (current !== value) return;
        (handler(),
          (value += 1),
          (resumeRoom = null),
          (actorId['session'] = null),
          (actorId['resumeRoom'] = null),
          storage2?.['removeItem'](RESUME_KEY),
          resetHistory(),
          refreshCanvas());
      },
    })),
      (handler = () => {
        handler = () => {};
        const enabled4 =
          label && actorId['session']?.['mediaNodes']?.['some']((enabled5) => !enabled5['owned']);
        canvasTabs['setCanvasProjectAccess']?.(
          canvasId,
          label && !enabled4 ? payload : { ...canvasTabs['getCanvasProjectAccess']?.(canvasId), badge: '' },
        );
      }),
      canvasTabs['setCanvasProjectAccess']?.(canvasId, {
        badge: '',
        label: '协作项目',
        canSave: label,
        saveMessage: '这是协作项目，只能由房主保存',
      }));
    try {
      (await resumeRoom['start']({
        publish: publish,
        hostBase: hostBase,
        mediaBindings: mediaBindings && !label ? await entry['mediaBindings'](room['roomId']) : [],
      }),
        run());
      const endpoint = api['getConnection'](),
        output = {
          roomId: room['roomId'],
          name: room['name'],
          clientId: clientId,
          endpoint: endpoint['endpoint'],
          hosting: label,
          canvasId: canvasId,
          actorId: actorId['actorId'],
        };
      (storage2?.['setItem'](RESUME_KEY, JSON['stringify'](output)),
        entry['remember'](room['roomId'], canvasId, payload, output));
    } catch (value3) {
      ((value += 1), (handler = () => {}));
      const value4 = label && actorId['session']?.['mediaNodes']?.['some']((enabled6) => !enabled6['owned']);
      canvasTabs['setCanvasProjectAccess']?.(
        canvasId,
        value4 ? { ...canvasTabs['getCanvasProjectAccess']?.(canvasId), badge: '' } : record,
      );
      throw value3;
    }
    refreshCanvas();
  }
  async function run6(handler3, handler4, value5 = false, canvasId2 = getCanvasId(), replacePort = false) {
    run4();
    if (!actorId['authenticated'] || !api) throw new Error('请先验证已激活的画布身份');
    const value6 = api;
    enabled2 = null;
    let enabled7 = false;
    item = true;
    try {
      (await handler3(value6, { replacePort: replacePort }), run());
      const value7 = await handler4();
      run();
      if (canvasId2 && getCanvasId() !== canvasId2) throw new Error('画布已切换，请返回原画布重新开房');
      (await run5(value7, value5), (enabled7 = true));
      if (replacePort)
        onNotice('协作端口已更换，请在邀请区域生成并重新发送邀请信息；此前所有房间的旧邀请地址不再可用');
      if (value5) await refreshRooms();
    } catch (message) {
      !enabled7 &&
        !enabled &&
        resumeRoom &&
        (await resumeRoom['destroy'](),
        (value += 1),
        (resumeRoom = null),
        (actorId['session'] = null),
        resetHistory(),
        refreshCanvas());
      if (!resumeRoom || enabled) await value6['disconnect']();
      !enabled &&
        message['code'] === 'HOST_PORT_BUSY' &&
        getCanvasId() === canvasId2 &&
        ((enabled2 = {
          canvasId: canvasId2,
          actorId: actorId['actorId'],
          details: { ...message['details'], message: message['message'] },
          retry: (value8) => run6(handler3, handler4, value5, canvasId2, value8),
        }),
        refreshCanvas());
      throw message;
    } finally {
      item = false;
    }
  }
  const actions = {
    async retryHostPort(enabled8 = false) {
      run4();
      if (!enabled2 || enabled2['canvasId'] !== getCanvasId() || enabled2['actorId'] !== actorId['actorId'])
        throw new Error('画布已切换，请重新开房');
      return enabled2['retry'](enabled8 === true);
    },
    async authenticate(options2 = {}) {
      (await ready, run());
      if (value2) return value2;
      if (resumeRoom || item) throw new Error('请先结束当前画布的联机');
      const value9 = ++key;
      return (
        (actorId['authenticating'] = true),
        (actorId['authError'] = null),
        refreshCanvas(),
        (value2 = (async () => {
          try {
            const value10 = await run2(),
              installId = await ensureInstallId(),
              deviceId = await ensureDeviceId(installId);
            run();
            if (value9 !== key) return;
            const args3 = await value10['authenticate']({ installId: installId, deviceId: deviceId });
            run();
            if (value9 !== key) return;
            ((displayName = String(
              options2['displayName'] ||
                (displayName !== '成员' ? displayName : '成员 ' + args3['actorId']['slice'](0, 4)),
            )
              ['trim']()
              ['slice'](0, 32)),
              (actorId['authenticated'] = true),
              (actorId['actorId'] = args3['actorId']),
              (index = args3['expiresAt']),
              storage?.['setItem'](
                STORAGE_KEY,
                JSON['stringify']({
                  ...args3,
                  serverUrl: serverUrl['serverUrl'],
                  displayName: displayName,
                  clientId: clientId,
                }),
              ),
              await refreshRooms());
          } catch (code) {
            !enabled &&
              value9 === key &&
              ((actorId['authenticated'] = false),
              (actorId['rooms'] = []),
              (actorId['authError'] = {
                code: code['code'] || 'AUTH_UNAVAILABLE',
                message: code['message'] || '暂时无法验证画布授权，请重试',
              }),
              storage?.['removeItem'](STORAGE_KEY));
            throw code;
          } finally {
            ((value2 = null),
              !enabled && value9 === key && ((actorId['authenticating'] = false), refreshCanvas()));
          }
        })()),
        value2
      );
    },
    setDisplayName(value11) {
      (run(),
        (displayName =
          String(value11 || '')
            ['trim']()
            ['slice'](0, 32) || '成员 ' + actorId['actorId']['slice'](0, 4)));
      try {
        const args4 = JSON['parse'](storage?.['getItem'](STORAGE_KEY) || 'null');
        if (args4)
          storage?.['setItem'](STORAGE_KEY, JSON['stringify']({ ...args4, displayName: displayName }));
      } catch {}
      refreshCanvas();
    },
    async create({ fresh: fresh = false } = {}) {
      const value12 = getCanvasId(),
        value13 = collaborationCanvasBinding['roomFor'](
          value12,
          actorId['rooms']['map']((value14) => value14['id']),
        );
      if (value13 && !fresh) return actions['openRoom'](value13);
      return run6(
        (value15, value16) => value15['startHost'](undefined, value16),
        () =>
          run3({
            action: 'create',
            name: canvasTabs['getCanvasProjectContext'](value12)?.['projectName'] || '协作画布',
            displayName: displayName,
            document: { nodes: {}, edges: {} },
          }),
        true,
        value12,
      );
    },
    async join(value17) {
      const invite2 = decodeCollaborationInvite(value17);
      return run6(
        (value18) => value18['connectHost'](invite2['endpoint']),
        () => run3({ action: 'join', invite: invite2['invite'], displayName: displayName }),
      );
    },
    async openRoom(roomId) {
      return run6(
        (value19, value20) => value19['startHost'](undefined, value20),
        () => run3({ action: 'open', roomId: roomId }),
      );
    },
    async resume() {
      const roomId2 = getState()['resumeRoom'];
      if (!roomId2) return;
      return run6(
        (value21, value22) =>
          roomId2['hosting']
            ? value21['startHost'](undefined, value22)
            : value21['connectHost'](roomId2['endpoint']),
        async () => {
          const value23 = await run3({ action: 'open', roomId: roomId2['roomId'] });
          if (roomId2['clientId'] && roomId2['clientId'] !== clientId) {
            if (
              value23['presence']?.['some'](
                (value24) =>
                  value24['clientId'] === roomId2['clientId'] && value24['expiresAt'] * 1000 > Date['now'](),
              )
            )
              throw new Error('原窗口仍在协作；如果它已关闭，请稍后重试恢复');
            clientId = roomId2['clientId'];
            const args5 = JSON['parse'](storage?.['getItem'](STORAGE_KEY) || 'null');
            if (args5) storage?.['setItem'](STORAGE_KEY, JSON['stringify']({ ...args5, clientId: clientId }));
          }
          return value23;
        },
      );
    },
    async invite(role, url, validity = 'permanent') {
      const value25 = await resumeRoom['command']('invite', { role: role, validity: validity }),
        response2 = api['getConnection']()['endpoint'];
      return encodeCollaborationInvite(
        { ...response2, url: url || response2['addresses']?.[0] || response2['url'] },
        value25['invite'],
      );
    },
    member: (memberId, role2) => resumeRoom['command']('member', { memberId: memberId, role: role2 }),
    async renameSelf(value26) {
      run();
      const enabled9 = resumeRoom;
      if (!enabled9) throw new Error('请先加入协作房间');
      const value27 = await enabled9['command']('renameSelf', {
        displayName: String(value26 || '')['trim'](),
      });
      run();
      if (resumeRoom !== enabled9) throw new DOMException('Aborted', 'AbortError');
      actions['setDisplayName'](value27['displayName']);
    },
    follow(value28) {
      if (
        value28 &&
        !actorId['session']['presence']?.['some'](
          (enabled10) =>
            enabled10['actorId'] === value28 &&
            enabled10['clientId'] !== clientId &&
            (!enabled10['expiresAt'] || enabled10['expiresAt'] * 1000 > Date['now']()),
        )
      )
        throw new Error('该成员当前不在线');
      resumeRoom?.['follow'](value28);
    },
    locate: (value29) => resumeRoom['locate'](value29),
    summon: () => resumeRoom['summon'](),
    resolveConflicts: (value30) => resumeRoom['resolveConflicts'](value30),
    resolveTask: (nodeId) =>
      resumeRoom['command']('resolveTask', {
        nodeId: nodeId['node'],
        taskId: nodeId['id'],
        confirmedStopped: true,
      }),
    remove: (memberId2) => resumeRoom['command']('remove', { memberId: memberId2 }),
    revokeInvites: () => resumeRoom['command']('revokeInvites'),
    async closeRoom() {
      const value31 = actorId['session']['roomId'],
        value32 = actorId['session']['hosting'] ? collaborationCanvasBinding : collaborationCanvasBinding2;
      (await resumeRoom['command']('close'),
        value32['forget'](value31),
        refreshCanvas(),
        await refreshRooms());
    },
    async leaveRoom() {
      const value33 = actorId['session']['roomId'];
      (await resumeRoom['command']('leave'),
        collaborationCanvasBinding2['forget'](value33),
        refreshCanvas(),
        await refreshRooms());
    },
    async disconnect(force) {
      const enabled11 = resumeRoom;
      if (!enabled11) return;
      if (!force?.['preserveDraft']) await enabled11['prepareDetach'](force);
      if (resumeRoom !== enabled11 || force?.['signal']?.['aborted'])
        throw new DOMException('Aborted', 'AbortError');
      await enabled11['detach']({ force: force?.['preserveDraft'] === true });
    },
    async saveAndDisconnect(value34) {
      const enabled12 = resumeRoom,
        value35 = getCanvasId();
      if (!enabled12 || !actorId['session']?.['hosting'])
        throw new Error('协作项目只能由房主保存；可以选择“确定”直接结束联机');
      if (typeof saveProject !== 'function') throw new Error('项目保存入口尚未就绪，请稍后重试');
      await enabled12['prepareDetach'](value34);
      if (resumeRoom !== enabled12 || value34?.['signal']?.['aborted'])
        throw new DOMException('Aborted', 'AbortError');
      const value36 = await saveProject();
      if (resumeRoom !== enabled12 || getCanvasId() !== value35 || value34?.['signal']?.['aborted'])
        throw new DOMException('Aborted', 'AbortError');
      if (value36 !== true) throw new Error('未完成项目保存，已保留联机状态');
      if (!enabled12['canDetach']() || canvasTabs['isCanvasDirty']?.(value35))
        throw new Error('保存期间画布又有修改，请再次保存后结束；或选择“确定”直接结束联机');
      await enabled12['detach']();
    },
    refreshRooms: refreshRooms,
    signOut() {
      (run4(),
        (enabled2 = null),
        (key += 1),
        void api?.['disconnect'](),
        (api = null),
        (actorId['authenticated'] = false),
        (actorId['authenticating'] = false),
        (actorId['authError'] = null),
        (actorId['actorId'] = ''),
        (actorId['rooms'] = []),
        storage?.['removeItem'](STORAGE_KEY),
        refreshCanvas());
    },
  };
  async function run7() {
    if (enabled) return;
    const value37 = key;
    try {
      const token = JSON['parse'](storage?.['getItem'](STORAGE_KEY) || 'null');
      if (token?.['clientId']) clientId = token['clientId'];
      actorId['resumeRoom'] = JSON['parse'](storage2?.['getItem'](RESUME_KEY) || 'null');
      if (!token || token['expiresAt'] * 1000 <= Date['now']()) return;
      const fetchConfig3 = await fetchConfig();
      if (enabled || value37 !== key) return;
      serverUrl = fetchConfig3;
      if (token['serverUrl'] !== serverUrl['serverUrl']) return;
      ((api = createApi({ ...serverUrl, token: token['token'] })),
        (displayName = token['displayName']),
        (clientId = token['clientId'] || clientId),
        (actorId['authenticated'] = true),
        (actorId['actorId'] = token['actorId']),
        (index = token['expiresAt']),
        await refreshRooms());
    } catch {
      !enabled && value37 === key && ((actorId['authenticated'] = false), refreshCanvas());
    }
  }
  const ready = Promise['resolve']()['then'](run7);
  let value38 = null;
  return {
    ready: ready,
    actions: actions,
    getState: getState,
    getSession: () => resumeRoom,
    refreshCanvas: refreshCanvas,
    async ensureAuthenticated() {
      run();
      if (resumeRoom) return;
      const value39 = key;
      (!actorId['authenticated'] || index * 1000 <= Date['now']()) &&
        ((actorId['authenticating'] = true), refreshCanvas());
      (await ready, run());
      if (value2) return value2;
      if (value39 !== key) return;
      if (!actorId['authenticated'] || index * 1000 <= Date['now']()) await actions['authenticate']();
      else ((actorId['authenticating'] = false), refreshCanvas());
    },
    destroy() {
      if (enabled) return value38;
      return (
        (enabled = true),
        (value += 1),
        (key += 1),
        handler(),
        (value38 = Promise['resolve'](resumeRoom ? resumeRoom['destroy']() : api?.['disconnect']())[
          'finally'
        ](() =>
          Promise['all']([collaborationCanvasBinding['close'](), collaborationCanvasBinding2['close']()]),
        )),
        value38
      );
    },
  };
}
