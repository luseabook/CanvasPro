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
  store: _0x59e192,
  canvasTabs: _0xc49d83,
  ensureInstallId: _0x402a9,
  ensureDeviceId: _0x3d311e,
  resetHistory: _0x27b877,
  storage: storage = globalThis['sessionStorage'],
  fetchConfig: fetchConfig = fetchCollaborationConfig,
  createApi: createApi = createCollaborationApi,
  createSession: createSession = createCollaborationSession,
  onChange: onChange = () => {},
  onPresence: onPresence = () => {},
  onNotice: onNotice = () => {},
  onComment: onComment = () => {},
  saveProject: _0x2a4821,
  resumeStorage: _0x258962,
}) {
  let _0x1fab68 = _0x258962 || storage;
  if (!_0x258962)
    try {
      _0x1fab68 = globalThis['localStorage'] || storage;
    } catch {}
  const _0x25adc3 = {
    authenticated: ![],
    authenticating: ![],
    authError: null,
    actorId: '',
    rooms: [],
    session: null,
    nodeCount: 0x0,
  };
  let _0x5b801d = null,
    _0x5f5891 = null,
    _0x3c0538 = () => {},
    _0x297dc0 = null,
    _0x51208c = '成员',
    _0xfbca95 = crypto['randomUUID'](),
    _0x1a70af = 0x0,
    _0x575f4d = ![],
    _0x2a5d00 = ![],
    _0x1e1915 = null,
    _0xf84714 = 0x0,
    _0x1e6d38 = null,
    _0x58ad4c = 0x0;
  const _0x31be87 = () => {
      if (_0x575f4d) throw new DOMException('Aborted', 'AbortError');
    },
    _0x276786 = () => _0xc49d83['getActiveCanvasId'](),
    _0x6b61c3 = createCollaborationCanvasBinding({
      storage: _0x1fab68,
      canvasTabs: _0xc49d83,
      actorId: () => _0x25adc3['actorId'],
    }),
    _0x1bfb74 = createCollaborationCanvasBinding({
      storage: _0x1fab68,
      canvasTabs: _0xc49d83,
      actorId: () => _0x25adc3['actorId'],
      hosting: ![],
    }),
    _0x10f9f3 = () => ({
      ..._0x25adc3,
      hostPortConflict:
        !_0x5f5891 &&
        _0x1e1915?.['canvasId'] === _0x276786() &&
        _0x1e1915?.['actorId'] === _0x25adc3['actorId']
          ? _0x1e1915['details']
          : null,
      resumeRoom: _0x5f5891
        ? null
        : _0x6b61c3['resumeFor'](_0x276786()) ||
          _0x1bfb74['resumeFor'](_0x276786()) ||
          (_0x25adc3['resumeRoom']?.['canvasId'] === _0x276786() &&
          _0x25adc3['resumeRoom']?.['actorId'] === _0x25adc3['actorId']
            ? _0x25adc3['resumeRoom']
            : null),
      displayName: _0x51208c,
      nodeCount: Object['keys'](_0x59e192['getStateRaw']()['nodes'] || {})['length'],
    }),
    _0x25a171 = () => {
      if (!_0x575f4d) onChange(_0x10f9f3());
    };
  async function _0x188662() {
    if (!_0x297dc0) {
      const _0x56a48e = await fetchConfig();
      (_0x31be87(), (_0x297dc0 = _0x56a48e));
    }
    _0x31be87();
    if (!_0x5b801d) _0x5b801d = createApi(_0x297dc0);
    return _0x5b801d;
  }
  async function _0xf87f3c(_0x248850) {
    if (!_0x25adc3['authenticated']) throw new Error('请先验证已激活的画布身份');
    try {
      return await _0x5b801d['rpc']({ ..._0x248850, clientId: _0xfbca95 });
    } catch (_0x2a469c) {
      ['SESSION_EXPIRED', 'ACTIVATION_REQUIRED']['includes'](_0x2a469c['code']) &&
        !_0x5f5891 &&
        ((_0x25adc3['authenticated'] = ![]), storage?.['removeItem'](STORAGE_KEY), _0x25a171());
      throw _0x2a469c;
    }
  }
  async function _0x60d883() {
    const _0x5dfba2 = _0x5b801d,
      _0x1e8c65 = _0xf84714;
    try {
      const _0x445438 = await _0x5dfba2['listRooms'](_0xfbca95);
      if (_0x575f4d || _0x5b801d !== _0x5dfba2 || _0x1e8c65 !== _0xf84714) return;
      ((_0x25adc3['rooms'] = _0x445438['rooms']), _0x25a171());
    } catch (_0x5669f2) {
      !_0x575f4d &&
        _0x5b801d === _0x5dfba2 &&
        _0x1e8c65 === _0xf84714 &&
        ['SESSION_EXPIRED', 'ACTIVATION_REQUIRED']['includes'](_0x5669f2['code']) &&
        !_0x5f5891 &&
        ((_0x25adc3['authenticated'] = ![]), storage?.['removeItem'](STORAGE_KEY), _0x25a171());
      throw _0x5669f2;
    }
  }
  function _0x4149e0() {
    _0x31be87();
    if (_0x5f5891 || _0x2a5d00) throw new Error('请先结束当前画布的联机');
    if (
      Object['values'](_0x59e192['getStateRaw']()['nodes'] || {})['some'](
        (_0x57d91c) => _0x57d91c['isGenerating'] || _0x57d91c['isLoading'],
      )
    )
      throw new Error('请等待当前生成任务结束后开启协作');
  }
  async function _0x2cc613(_0x2ccada, _0x3896e1 = ![]) {
    _0x31be87();
    if (
      !_0x2ccada['roomId'] ||
      !_0x2ccada['document'] ||
      !_0x2ccada['role'] ||
      !Array['isArray'](_0x2ccada['members'])
    )
      throw new Error('协作房间响应无效，请检查服务部署');
    const _0x1fdd72 = ++_0x1a70af,
      _0x490af4 = !!_0x5b801d['getConnection']()?.['hosting'],
      _0x208891 = _0x490af4 ? _0x6b61c3 : _0x1bfb74,
      _0xa410c9 = !_0x3896e1 && (await _0x208891['activate'](_0x2ccada['roomId'])),
      _0x3eec3d = _0xa410c9 ? await _0x208891['baseline'](_0x2ccada['roomId']) : null;
    if (_0xa410c9 && !_0x3eec3d) throw new Error('此画布的上次同步记录不可用，已保留本机内容，请勿覆盖保存');
    _0x31be87();
    if (!_0x3896e1 && !_0xa410c9) {
      if ((await _0xc49d83['addCanvas']()) === ![]) throw new Error('无法创建协作画布标签页');
      (_0x31be87(), _0xc49d83['renameCanvas'](_0x276786(), _0x2ccada['name']));
    }
    const _0xa116e1 = _0x276786(),
      _0x5c9d95 = _0xc49d83['getCanvasProjectAccess']?.(_0xa116e1),
      _0x299fb0 = _0xa410c9 ? _0x208891['originalAccess'](_0x2ccada['roomId'], _0x5c9d95) : _0x5c9d95,
      _0x42967f = (_0x4e3aba) => {
        const _0x44cb5c = _0x490af4 && !_0x4e3aba['mediaNodes']?.['some']((_0x3c4be1) => !_0x3c4be1['owned']),
          _0x43b1c5 =
            _0x4e3aba['status'] === 'online' && _0x4e3aba['presenceStatus'] !== 'offline'
              ? _0x490af4
                ? 'shared-host'
                : 'shared'
              : '',
          _0x35a4c4 = _0xc49d83['getCanvasProjectAccess']?.(_0xa116e1);
        if (_0x35a4c4?.['canSave'] !== _0x44cb5c || _0x35a4c4?.['badge'] !== _0x43b1c5)
          _0xc49d83['setCanvasProjectAccess']?.(_0xa116e1, {
            badge: _0x43b1c5,
            label: _0x490af4 ? '协作房主' : '协作成员',
            canSave: _0x44cb5c,
            saveMessage: _0x44cb5c
              ? ''
              : _0x490af4
                ? '成员素材尚未传输完成，请等待完成后保存'
                : '这是协作项目，只能由房主保存',
          });
      };
    ((_0x5f5891 = createSession({
      store: _0x59e192,
      api: _0x5b801d,
      room: _0x2ccada,
      actorId: _0x25adc3['actorId'],
      clientId: _0xfbca95,
      getCanvasId: _0x276786,
      hosting: _0x490af4,
      onChange(_0x52a11d) {
        if (_0x1fdd72 !== _0x1a70af) return;
        (_0x42967f(_0x52a11d),
          (_0x25adc3['session'] = {
            ..._0x52a11d,
            hosting: _0x490af4,
            hostAddresses: _0x5b801d['getConnection']()?.['endpoint']?.['addresses'] || [],
          }),
          _0x25a171());
      },
      onPresence(_0x43bf7f) {
        if (_0x1fdd72 !== _0x1a70af || !_0x25adc3['session']) return;
        (Object['assign'](_0x25adc3['session'], _0x43bf7f),
          _0x42967f(_0x25adc3['session']),
          onPresence(_0x25adc3['session']));
      },
      onConfirmed(_0x106c11, _0x21a282) {
        return _0x208891['checkpoint'](_0x2ccada['roomId'], _0x106c11, _0x21a282);
      },
      onAttention(_0x2d528f) {
        if (_0x1fdd72 === _0x1a70af && !_0x575f4d)
          onNotice(
            _0x2d528f
              ? '房主已召集你到\x20TA\x20的视角'
              : '房主发起了召集；你已关闭自动跟随，当前视角保持不变',
          );
      },
      onNotice: onNotice,
      onComment: onComment,
      onDetach() {
        if (_0x1fdd72 !== _0x1a70af) return;
        (_0x3c0538(),
          (_0x1a70af += 0x1),
          (_0x5f5891 = null),
          (_0x25adc3['session'] = null),
          (_0x25adc3['resumeRoom'] = null),
          _0x1fab68?.['removeItem'](RESUME_KEY),
          _0x27b877(),
          _0x25a171());
      },
    })),
      (_0x3c0538 = () => {
        _0x3c0538 = () => {};
        const _0xb49732 =
          _0x490af4 && _0x25adc3['session']?.['mediaNodes']?.['some']((_0x2733a5) => !_0x2733a5['owned']);
        _0xc49d83['setCanvasProjectAccess']?.(
          _0xa116e1,
          _0x490af4 && !_0xb49732
            ? _0x299fb0
            : { ..._0xc49d83['getCanvasProjectAccess']?.(_0xa116e1), badge: '' },
        );
      }),
      _0xc49d83['setCanvasProjectAccess']?.(_0xa116e1, {
        badge: '',
        label: '协作项目',
        canSave: _0x490af4,
        saveMessage: '这是协作项目，只能由房主保存',
      }));
    try {
      (await _0x5f5891['start']({
        publish: _0x3896e1,
        hostBase: _0x3eec3d,
        mediaBindings: _0xa410c9 && !_0x490af4 ? await _0x208891['mediaBindings'](_0x2ccada['roomId']) : [],
      }),
        _0x31be87());
      const _0x412f15 = _0x5b801d['getConnection'](),
        _0x3e8650 = {
          roomId: _0x2ccada['roomId'],
          name: _0x2ccada['name'],
          clientId: _0xfbca95,
          endpoint: _0x412f15['endpoint'],
          hosting: _0x490af4,
          canvasId: _0xa116e1,
          actorId: _0x25adc3['actorId'],
        };
      (_0x1fab68?.['setItem'](RESUME_KEY, JSON['stringify'](_0x3e8650)),
        _0x208891['remember'](_0x2ccada['roomId'], _0xa116e1, _0x299fb0, _0x3e8650));
    } catch (_0x1b6809) {
      ((_0x1a70af += 0x1), (_0x3c0538 = () => {}));
      const _0x44c99a =
        _0x490af4 && _0x25adc3['session']?.['mediaNodes']?.['some']((_0x2270a5) => !_0x2270a5['owned']);
      _0xc49d83['setCanvasProjectAccess']?.(
        _0xa116e1,
        _0x44c99a ? { ..._0xc49d83['getCanvasProjectAccess']?.(_0xa116e1), badge: '' } : _0x5c9d95,
      );
      throw _0x1b6809;
    }
    _0x25a171();
  }
  async function _0x2f07ca(_0xba4aa0, _0x40a059, _0x5bc8ca = ![], _0x548fe6 = _0x276786(), _0x5e5b2e = ![]) {
    _0x4149e0();
    if (!_0x25adc3['authenticated'] || !_0x5b801d) throw new Error('请先验证已激活的画布身份');
    const _0x1fc2bd = _0x5b801d;
    _0x1e1915 = null;
    let _0x8b8cc5 = ![];
    _0x2a5d00 = !![];
    try {
      (await _0xba4aa0(_0x1fc2bd, { replacePort: _0x5e5b2e }), _0x31be87());
      const _0x1bd0e6 = await _0x40a059();
      _0x31be87();
      if (_0x548fe6 && _0x276786() !== _0x548fe6) throw new Error('画布已切换，请返回原画布重新开房');
      (await _0x2cc613(_0x1bd0e6, _0x5bc8ca), (_0x8b8cc5 = !![]));
      if (_0x5e5b2e)
        onNotice('协作端口已更换，请在邀请区域生成并重新发送邀请信息；此前所有房间的旧邀请地址不再可用');
      if (_0x5bc8ca) await _0x60d883();
    } catch (_0xc19eb3) {
      !_0x8b8cc5 &&
        !_0x575f4d &&
        _0x5f5891 &&
        (await _0x5f5891['destroy'](),
        (_0x1a70af += 0x1),
        (_0x5f5891 = null),
        (_0x25adc3['session'] = null),
        _0x27b877(),
        _0x25a171());
      if (!_0x5f5891 || _0x575f4d) await _0x1fc2bd['disconnect']();
      !_0x575f4d &&
        _0xc19eb3['code'] === 'HOST_PORT_BUSY' &&
        _0x276786() === _0x548fe6 &&
        ((_0x1e1915 = {
          canvasId: _0x548fe6,
          actorId: _0x25adc3['actorId'],
          details: { ..._0xc19eb3['details'], message: _0xc19eb3['message'] },
          retry: (_0x1b849a) => _0x2f07ca(_0xba4aa0, _0x40a059, _0x5bc8ca, _0x548fe6, _0x1b849a),
        }),
        _0x25a171());
      throw _0xc19eb3;
    } finally {
      _0x2a5d00 = ![];
    }
  }
  const _0xca3dbc = {
    async retryHostPort(_0x3f8869 = ![]) {
      _0x4149e0();
      if (
        !_0x1e1915 ||
        _0x1e1915['canvasId'] !== _0x276786() ||
        _0x1e1915['actorId'] !== _0x25adc3['actorId']
      )
        throw new Error('画布已切换，请重新开房');
      return _0x1e1915['retry'](_0x3f8869 === !![]);
    },
    async authenticate(_0x590929 = {}) {
      (await _0x24e44f, _0x31be87());
      if (_0x1e6d38) return _0x1e6d38;
      if (_0x5f5891 || _0x2a5d00) throw new Error('请先结束当前画布的联机');
      const _0x2912ba = ++_0xf84714;
      return (
        (_0x25adc3['authenticating'] = !![]),
        (_0x25adc3['authError'] = null),
        _0x25a171(),
        (_0x1e6d38 = (async () => {
          try {
            const _0x556627 = await _0x188662(),
              _0x471108 = await _0x402a9(),
              _0xf17647 = await _0x3d311e(_0x471108);
            _0x31be87();
            if (_0x2912ba !== _0xf84714) return;
            const _0x4e019c = await _0x556627['authenticate']({ installId: _0x471108, deviceId: _0xf17647 });
            _0x31be87();
            if (_0x2912ba !== _0xf84714) return;
            ((_0x51208c = String(
              _0x590929['displayName'] ||
                (_0x51208c !== '成员' ? _0x51208c : '成员 ' + _0x4e019c['actorId']['slice'](0x0, 0x4)),
            )
              ['trim']()
              ['slice'](0x0, 0x20)),
              (_0x25adc3['authenticated'] = !![]),
              (_0x25adc3['actorId'] = _0x4e019c['actorId']),
              (_0x58ad4c = _0x4e019c['expiresAt']),
              storage?.['setItem'](
                STORAGE_KEY,
                JSON['stringify']({
                  ..._0x4e019c,
                  serverUrl: _0x297dc0['serverUrl'],
                  displayName: _0x51208c,
                  clientId: _0xfbca95,
                }),
              ),
              await _0x60d883());
          } catch (_0x370258) {
            !_0x575f4d &&
              _0x2912ba === _0xf84714 &&
              ((_0x25adc3['authenticated'] = ![]),
              (_0x25adc3['rooms'] = []),
              (_0x25adc3['authError'] = {
                code: _0x370258['code'] || 'AUTH_UNAVAILABLE',
                message: _0x370258['message'] || '暂时无法验证画布授权，请重试',
              }),
              storage?.['removeItem'](STORAGE_KEY));
            throw _0x370258;
          } finally {
            ((_0x1e6d38 = null),
              !_0x575f4d && _0x2912ba === _0xf84714 && ((_0x25adc3['authenticating'] = ![]), _0x25a171()));
          }
        })()),
        _0x1e6d38
      );
    },
    setDisplayName(_0x5d151d) {
      (_0x31be87(),
        (_0x51208c =
          String(_0x5d151d || '')
            ['trim']()
            ['slice'](0x0, 0x20) || '成员 ' + _0x25adc3['actorId']['slice'](0x0, 0x4)));
      try {
        const _0x5630bc = JSON['parse'](storage?.['getItem'](STORAGE_KEY) || 'null');
        if (_0x5630bc)
          storage?.['setItem'](STORAGE_KEY, JSON['stringify']({ ..._0x5630bc, displayName: _0x51208c }));
      } catch {}
      _0x25a171();
    },
    async create({ fresh: fresh = ![] } = {}) {
      const _0x10c776 = _0x276786(),
        _0x5f0a95 = _0x6b61c3['roomFor'](
          _0x10c776,
          _0x25adc3['rooms']['map']((_0x209793) => _0x209793['id']),
        );
      if (_0x5f0a95 && !fresh) return _0xca3dbc['openRoom'](_0x5f0a95);
      return _0x2f07ca(
        (_0x242a7f, _0x6a74d) => _0x242a7f['startHost'](undefined, _0x6a74d),
        () =>
          _0xf87f3c({
            action: 'create',
            name: _0xc49d83['getCanvasProjectContext'](_0x10c776)?.['projectName'] || '协作画布',
            displayName: _0x51208c,
            document: { nodes: {}, edges: {} },
          }),
        !![],
        _0x10c776,
      );
    },
    async join(_0x4e61ef) {
      const _0x3d2f73 = decodeCollaborationInvite(_0x4e61ef);
      return _0x2f07ca(
        (_0x38d707) => _0x38d707['connectHost'](_0x3d2f73['endpoint']),
        () => _0xf87f3c({ action: 'join', invite: _0x3d2f73['invite'], displayName: _0x51208c }),
      );
    },
    async openRoom(_0xcdb0ba) {
      return _0x2f07ca(
        (_0x40961d, _0x2144d0) => _0x40961d['startHost'](undefined, _0x2144d0),
        () => _0xf87f3c({ action: 'open', roomId: _0xcdb0ba }),
      );
    },
    async resume() {
      const _0x4cfadb = _0x10f9f3()['resumeRoom'];
      if (!_0x4cfadb) return;
      return _0x2f07ca(
        (_0x47e35e, _0x390080) =>
          _0x4cfadb['hosting']
            ? _0x47e35e['startHost'](undefined, _0x390080)
            : _0x47e35e['connectHost'](_0x4cfadb['endpoint']),
        async () => {
          const _0x538286 = await _0xf87f3c({ action: 'open', roomId: _0x4cfadb['roomId'] });
          if (_0x4cfadb['clientId'] && _0x4cfadb['clientId'] !== _0xfbca95) {
            if (
              _0x538286['presence']?.['some'](
                (_0x5cf16b) =>
                  _0x5cf16b['clientId'] === _0x4cfadb['clientId'] &&
                  _0x5cf16b['expiresAt'] * 0x3e8 > Date['now'](),
              )
            )
              throw new Error('原窗口仍在协作；如果它已关闭，请稍后重试恢复');
            _0xfbca95 = _0x4cfadb['clientId'];
            const _0xf5de6f = JSON['parse'](storage?.['getItem'](STORAGE_KEY) || 'null');
            if (_0xf5de6f)
              storage?.['setItem'](STORAGE_KEY, JSON['stringify']({ ..._0xf5de6f, clientId: _0xfbca95 }));
          }
          return _0x538286;
        },
      );
    },
    async invite(_0x40e60b, _0x38444e, _0x24a8e5 = 'permanent') {
      const _0x240802 = await _0x5f5891['command']('invite', { role: _0x40e60b, validity: _0x24a8e5 }),
        _0x4b7164 = _0x5b801d['getConnection']()['endpoint'];
      return encodeCollaborationInvite(
        { ..._0x4b7164, url: _0x38444e || _0x4b7164['addresses']?.[0x0] || _0x4b7164['url'] },
        _0x240802['invite'],
      );
    },
    member: (_0x17e692, _0x3fd2b0) =>
      _0x5f5891['command']('member', { memberId: _0x17e692, role: _0x3fd2b0 }),
    async renameSelf(_0x1c0434) {
      _0x31be87();
      const _0x383cf3 = _0x5f5891;
      if (!_0x383cf3) throw new Error('请先加入协作房间');
      const _0x1c3455 = await _0x383cf3['command']('renameSelf', {
        displayName: String(_0x1c0434 || '')['trim'](),
      });
      _0x31be87();
      if (_0x5f5891 !== _0x383cf3) throw new DOMException('Aborted', 'AbortError');
      _0xca3dbc['setDisplayName'](_0x1c3455['displayName']);
    },
    follow(_0x3c2f67) {
      if (
        _0x3c2f67 &&
        !_0x25adc3['session']['presence']?.['some'](
          (_0x2c3f3c) =>
            _0x2c3f3c['actorId'] === _0x3c2f67 &&
            _0x2c3f3c['clientId'] !== _0xfbca95 &&
            (!_0x2c3f3c['expiresAt'] || _0x2c3f3c['expiresAt'] * 0x3e8 > Date['now']()),
        )
      )
        throw new Error('该成员当前不在线');
      _0x5f5891?.['follow'](_0x3c2f67);
    },
    locate: (_0x4b4365) => _0x5f5891['locate'](_0x4b4365),
    summon: () => _0x5f5891['summon'](),
    resolveConflicts: (_0x3b1e59) => _0x5f5891['resolveConflicts'](_0x3b1e59),
    resolveTask: (_0x176e49) =>
      _0x5f5891['command']('resolveTask', {
        nodeId: _0x176e49['node'],
        taskId: _0x176e49['id'],
        confirmedStopped: !![],
      }),
    remove: (_0x1d825f) => _0x5f5891['command']('remove', { memberId: _0x1d825f }),
    revokeInvites: () => _0x5f5891['command']('revokeInvites'),
    async closeRoom() {
      const _0x1351a0 = _0x25adc3['session']['roomId'],
        _0x2aac59 = _0x25adc3['session']['hosting'] ? _0x6b61c3 : _0x1bfb74;
      (await _0x5f5891['command']('close'), _0x2aac59['forget'](_0x1351a0), _0x25a171(), await _0x60d883());
    },
    async leaveRoom() {
      const _0x3c0ec4 = _0x25adc3['session']['roomId'];
      (await _0x5f5891['command']('leave'), _0x1bfb74['forget'](_0x3c0ec4), _0x25a171(), await _0x60d883());
    },
    async disconnect(_0x264e16) {
      const _0x3f2296 = _0x5f5891;
      if (!_0x3f2296) return;
      if (!_0x264e16?.['preserveDraft']) await _0x3f2296['prepareDetach'](_0x264e16);
      if (_0x5f5891 !== _0x3f2296 || _0x264e16?.['signal']?.['aborted'])
        throw new DOMException('Aborted', 'AbortError');
      await _0x3f2296['detach']({ force: _0x264e16?.['preserveDraft'] === !![] });
    },
    async saveAndDisconnect(_0x1d9d10) {
      const _0xbf7faf = _0x5f5891,
        _0x1a47f9 = _0x276786();
      if (!_0xbf7faf || !_0x25adc3['session']?.['hosting'])
        throw new Error('协作项目只能由房主保存；可以选择“确定”直接结束联机');
      if (typeof _0x2a4821 !== 'function') throw new Error('项目保存入口尚未就绪，请稍后重试');
      await _0xbf7faf['prepareDetach'](_0x1d9d10);
      if (_0x5f5891 !== _0xbf7faf || _0x1d9d10?.['signal']?.['aborted'])
        throw new DOMException('Aborted', 'AbortError');
      const _0x1f8e4f = await _0x2a4821();
      if (_0x5f5891 !== _0xbf7faf || _0x276786() !== _0x1a47f9 || _0x1d9d10?.['signal']?.['aborted'])
        throw new DOMException('Aborted', 'AbortError');
      if (_0x1f8e4f !== !![]) throw new Error('未完成项目保存，已保留联机状态');
      if (!_0xbf7faf['canDetach']() || _0xc49d83['isCanvasDirty']?.(_0x1a47f9))
        throw new Error('保存期间画布又有修改，请再次保存后结束；或选择“确定”直接结束联机');
      await _0xbf7faf['detach']();
    },
    refreshRooms: _0x60d883,
    signOut() {
      (_0x4149e0(),
        (_0x1e1915 = null),
        (_0xf84714 += 0x1),
        void _0x5b801d?.['disconnect'](),
        (_0x5b801d = null),
        (_0x25adc3['authenticated'] = ![]),
        (_0x25adc3['authenticating'] = ![]),
        (_0x25adc3['authError'] = null),
        (_0x25adc3['actorId'] = ''),
        (_0x25adc3['rooms'] = []),
        storage?.['removeItem'](STORAGE_KEY),
        _0x25a171());
    },
  };
  async function _0x439f24() {
    if (_0x575f4d) return;
    const _0xc9d793 = _0xf84714;
    try {
      const _0x16323a = JSON['parse'](storage?.['getItem'](STORAGE_KEY) || 'null');
      if (_0x16323a?.['clientId']) _0xfbca95 = _0x16323a['clientId'];
      _0x25adc3['resumeRoom'] = JSON['parse'](_0x1fab68?.['getItem'](RESUME_KEY) || 'null');
      if (!_0x16323a || _0x16323a['expiresAt'] * 0x3e8 <= Date['now']()) return;
      const _0x47a57e = await fetchConfig();
      if (_0x575f4d || _0xc9d793 !== _0xf84714) return;
      _0x297dc0 = _0x47a57e;
      if (_0x16323a['serverUrl'] !== _0x297dc0['serverUrl']) return;
      ((_0x5b801d = createApi({ ..._0x297dc0, token: _0x16323a['token'] })),
        (_0x51208c = _0x16323a['displayName']),
        (_0xfbca95 = _0x16323a['clientId'] || _0xfbca95),
        (_0x25adc3['authenticated'] = !![]),
        (_0x25adc3['actorId'] = _0x16323a['actorId']),
        (_0x58ad4c = _0x16323a['expiresAt']),
        await _0x60d883());
    } catch {
      !_0x575f4d && _0xc9d793 === _0xf84714 && ((_0x25adc3['authenticated'] = ![]), _0x25a171());
    }
  }
  const _0x24e44f = Promise['resolve']()['then'](_0x439f24);
  let _0xb5ab7f = null;
  return {
    ready: _0x24e44f,
    actions: _0xca3dbc,
    getState: _0x10f9f3,
    getSession: () => _0x5f5891,
    refreshCanvas: _0x25a171,
    async ensureAuthenticated() {
      _0x31be87();
      if (_0x5f5891) return;
      const _0x2678ef = _0xf84714;
      (!_0x25adc3['authenticated'] || _0x58ad4c * 0x3e8 <= Date['now']()) &&
        ((_0x25adc3['authenticating'] = !![]), _0x25a171());
      (await _0x24e44f, _0x31be87());
      if (_0x1e6d38) return _0x1e6d38;
      if (_0x2678ef !== _0xf84714) return;
      if (!_0x25adc3['authenticated'] || _0x58ad4c * 0x3e8 <= Date['now']())
        await _0xca3dbc['authenticate']();
      else ((_0x25adc3['authenticating'] = ![]), _0x25a171());
    },
    destroy() {
      if (_0x575f4d) return _0xb5ab7f;
      return (
        (_0x575f4d = !![]),
        (_0x1a70af += 0x1),
        (_0xf84714 += 0x1),
        _0x3c0538(),
        (_0xb5ab7f = Promise['resolve'](_0x5f5891 ? _0x5f5891['destroy']() : _0x5b801d?.['disconnect']())[
          'finally'
        ](() => Promise['all']([_0x6b61c3['close'](), _0x1bfb74['close']()]))),
        _0xb5ab7f
      );
    },
  };
}
