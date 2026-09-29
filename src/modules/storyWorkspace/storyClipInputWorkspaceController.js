import { buildStoryClipInputSlotViewModel, updateStoryClipInput } from './storyClipInputSlots.js';
import {
  applyStoryEpisodeVideoModelDefault,
  formatStoryClipVideoGenerationDuration,
  normalizeStoryVideoGenerationParams,
  recoverUnavailableStoryVideoModelState,
  seedStoryAspectRatioInVideoGenerationParams,
} from './storyVideoGenerationSettings.js';
import { uploadFile } from '../../services/projectService.js';
function normalizeText(_0x571698) {
  return String(_0x571698 ?? '')['trim']();
}
export function createStoryClipInputWorkspaceController({
  state: _0x4b2ef3,
  root: _0x27e6f1,
  getSelectedEpisode: _0x386f32,
  getSelectedClip: _0x3f1ce1,
  replaceClip: _0x41c8c3,
  takePendingInputContext: _0x317cf6,
  createProjectToken: _0x30c1be,
  isProjectTaskCurrent: _0x3161c0,
  isProjectTaskLive: _0x4bfd32,
  syncProjectEntry: _0x1d8238,
  schedulePersistence: _0x2b4e25,
  render: _0x4779be,
  showToast: _0x5b9f3c,
} = {}) {
  if (
    !_0x4b2ef3 ||
    !_0x27e6f1 ||
    typeof _0x386f32 !== 'function' ||
    typeof _0x3f1ce1 !== 'function' ||
    typeof _0x41c8c3 !== 'function' ||
    typeof _0x317cf6 !== 'function' ||
    typeof _0x30c1be !== 'function' ||
    typeof _0x3161c0 !== 'function' ||
    typeof _0x4bfd32 !== 'function' ||
    typeof _0x1d8238 !== 'function' ||
    typeof _0x2b4e25 !== 'function' ||
    typeof _0x4779be !== 'function'
  )
    throw new TypeError(
      'Story\x20clip\x20inputs\x20require\x20selection,\x20project,\x20and\x20presentation\x20adapters.',
    );
  const _0x5392f4 = (_0x59a3b3) => {
      const _0x1ee611 = normalizeText(_0x59a3b3?.['id']);
      if (!_0x1ee611) return ![];
      const _0x469d47 = formatStoryClipVideoGenerationDuration(
        _0x59a3b3,
        _0x4b2ef3['models']['video'],
        _0x4b2ef3['videoGenerationParams'],
      );
      let _0x216e43 = ![];
      return (
        _0x27e6f1['querySelectorAll']('[data-story-clip-duration]')['forEach']((_0x2500a0) => {
          if (normalizeText(_0x2500a0['dataset']?.['storyClipDuration']) !== _0x1ee611) return;
          if (_0x2500a0['textContent'] !== _0x469d47) _0x2500a0['textContent'] = _0x469d47;
          _0x216e43 = !![];
        }),
        _0x216e43
      );
    },
    _0x3cb435 = (_0x4c7a6f) => {
      return (
        (_0x4b2ef3['videoGenerationParams'] = normalizeStoryVideoGenerationParams(
          _0x4b2ef3['models']['video'],
          seedStoryAspectRatioInVideoGenerationParams(
            _0x4b2ef3['models']['video'],
            _0x4b2ef3['videoGenerationParams'],
            _0x4b2ef3['data']['project']?.['aspectRatio'],
          ),
        )),
        (_0x4b2ef3['videoGenerationParamsByModel'] = {
          ..._0x4b2ef3['videoGenerationParamsByModel'],
          [_0x4b2ef3['models']['video']]: { ..._0x4b2ef3['videoGenerationParams'] },
        }),
        Boolean(_0x4c7a6f)
      );
    },
    _0x3e94cf = () => {
      const _0x3b73d1 = _0x386f32(_0x4b2ef3),
        _0x463fd3 = _0x3f1ce1(_0x4b2ef3, _0x3b73d1);
      if (!_0x3b73d1 || !_0x463fd3) return ![];
      try {
        const _0x9e76f0 = buildStoryClipInputSlotViewModel({
            modelId: _0x4b2ef3['models']['video'],
            provider: _0x4b2ef3['videoProvider'],
            inputs: _0x463fd3['inputs'],
          }),
          _0x2ffd3a = { image: [], video: [], audio: [] };
        return (
          _0x9e76f0['groups']['forEach']((_0x101bc6) => {
            _0x2ffd3a[_0x101bc6['kind']] = _0x101bc6['slots']
              ['filter']((_0x513a98) => _0x513a98['input']?.['url'])
              ['map']((_0x217e00) => ({ ..._0x217e00['input'], slotId: _0x217e00['id'] }));
          }),
          _0x41c8c3(_0x3b73d1['id'], _0x463fd3['id'], { ..._0x463fd3, inputs: _0x2ffd3a })
        );
      } catch {
        return ![];
      }
    },
    _0x25ae91 = (
      _0x44d409,
      {
        episode: episode = null,
        enteringEpisode: enteringEpisode = ![],
        switchingEpisode: switchingEpisode = ![],
      } = {},
    ) => {
      const _0x1a38d3 =
          (enteringEpisode || switchingEpisode) && applyStoryEpisodeVideoModelDefault(_0x4b2ef3, episode),
        _0x26acbd = recoverUnavailableStoryVideoModelState(_0x4b2ef3, { clip: _0x44d409 });
      _0x3cb435(_0x44d409);
      if (_0x1a38d3 || _0x26acbd) _0x3e94cf();
      return _0x1a38d3 || _0x26acbd;
    },
    _0x549143 = ({ kind: _0x45f35b, slotId: _0x3ff4d3, value: _0x56b846 }) => {
      const _0x22638b = _0x386f32(_0x4b2ef3),
        _0x24982d = _0x3f1ce1(_0x4b2ef3, _0x22638b);
      if (!_0x22638b || !_0x24982d) return ![];
      const _0x427309 = updateStoryClipInput(_0x24982d, {
        kind: _0x45f35b,
        slotId: _0x3ff4d3,
        value: _0x56b846,
      });
      return (
        _0x41c8c3(_0x22638b['id'], _0x24982d['id'], _0x427309),
        _0x2b4e25({ immediate: !![] }),
        _0x4779be(),
        !![]
      );
    },
    _0x552cb3 = async (_0x2f82d9) => {
      const _0x57a894 = _0x317cf6();
      if (!_0x2f82d9 || !_0x57a894) return ![];
      const _0x199603 = _0x57a894['projectToken'] || _0x30c1be(_0x4b2ef3),
        _0x43c1af =
          _0x199603['data']?.['episodes']?.['find'](
            (_0x2006ae) => normalizeText(_0x2006ae?.['id']) === normalizeText(_0x57a894['episodeId']),
          ) || (_0x3161c0(_0x199603) ? _0x386f32(_0x4b2ef3) : null),
        _0x2689ff =
          _0x43c1af?.['clips']?.['find'](
            (_0x53fd9e) => normalizeText(_0x53fd9e?.['id']) === normalizeText(_0x57a894['clipId']),
          ) || (_0x3161c0(_0x199603) ? _0x3f1ce1(_0x4b2ef3, _0x43c1af) : null);
      try {
        const _0x3d7e3a = String(_0x2f82d9['type'] || '')['startsWith']('image/')
            ? 'image'
            : String(_0x2f82d9['type'] || '')['startsWith']('video/')
              ? 'video'
              : String(_0x2f82d9['type'] || '')['startsWith']('audio/')
                ? 'audio'
                : '',
          _0xa7c4f8 = _0x57a894['kind'] || _0x3d7e3a;
        if (!_0xa7c4f8 || (_0x57a894['kind'] && _0x3d7e3a && _0x57a894['kind'] !== _0x3d7e3a))
          throw new Error('所选文件类型与当前视频模型入参槽不匹配');
        if (!_0x43c1af || !_0x2689ff) throw new Error('当前片段不可用');
        const _0x12a867 = buildStoryClipInputSlotViewModel({
            modelId: _0x199603['modelSettings']['models']['video'],
            provider: _0x199603['modelSettings']['videoProvider'],
            inputs: _0x2689ff?.['inputs'],
          }),
          _0x2bc2b1 = _0x57a894['slotId']
            ? _0x12a867['slots']['find'](
                (_0x171db1) => _0x171db1['id'] === _0x57a894['slotId'] && _0x171db1['kind'] === _0xa7c4f8,
              )
            : _0x12a867['slots']['find'](
                (_0x3ef3e2) => _0x3ef3e2['kind'] === _0xa7c4f8 && !_0x3ef3e2['input']?.['url'],
              );
        if (!_0x2bc2b1) throw new Error('当前视频模型没有可用的对应入参槽');
        const _0xe6b2cb = await uploadFile(_0x2f82d9, _0x199603['projectId']);
        if (!_0x4bfd32(_0x199603)) return ![];
        const _0x2453e7 = normalizeText(
          _0xe6b2cb?.['displayUrl'] ||
            _0xe6b2cb?.['url'] ||
            _0xe6b2cb?.['originalUrl'] ||
            _0xe6b2cb?.['localUrl'],
        );
        if (!_0x2453e7) throw new Error('素材保存结果缺少可用地址');
        const _0x2e439e = updateStoryClipInput(_0x2689ff, {
          kind: _0xa7c4f8,
          slotId: _0x2bc2b1['id'],
          value: { url: _0x2453e7, name: _0x2f82d9['name'], mimeType: _0x2f82d9['type'] },
        });
        return (
          _0x41c8c3(_0x43c1af['id'], _0x2689ff['id'], _0x2e439e, _0x199603['data']),
          _0x1d8238(_0x199603),
          _0x2b4e25({ immediate: !![] }),
          _0x3161c0(_0x199603) &&
            (_0x4779be(),
            _0x5b9f3c?.(
              (_0xa7c4f8 === 'image' ? '图片' : _0xa7c4f8 === 'audio' ? '音频' : '视频') + '入参已接入。',
              'success',
            )),
          !![]
        );
      } catch (_0xd46458) {
        return (
          _0x3161c0(_0x199603) && _0x5b9f3c?.(_0xd46458?.['message'] || '片段入参上传失败。', 'error'),
          ![]
        );
      }
    };
  return Object['freeze']({
    applyVideoSettings: _0x3cb435,
    prepareVideoSettings: _0x25ae91,
    reconcileSelectedInputsForModel: _0x3e94cf,
    syncVideoDurationInPlace: _0x5392f4,
    updateSelectedInput: _0x549143,
    uploadSelectedInput: _0x552cb3,
  });
}
