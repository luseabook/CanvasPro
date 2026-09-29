import {
  createDirectorCameraPairing,
  readDirectorCameraPose,
  closeDirectorCameraPairing,
} from '../../../api/directorCameraApi.js';
import { applyRelativeCameraPose } from '../../core/math.js';
import {
  normalizeStoryboard3DShotAnimation,
  sampleStoryboard3DShotAnimation,
  upsertStoryboard3DCameraKeyframe,
} from './shotAnimation.js';
import { syncStoryboard3DCameraObjectFromShot } from './projectModel.js';
const escape = (_0x3b2833) =>
  String(_0x3b2833)['replaceAll']('&', '&amp;')['replaceAll']('\x22', '&quot;')['replaceAll']('<', '&lt;');
export class DirectorMobileCamera {
  constructor(
    _0x3b6ba0,
    _0x4f3888 = {
      create: createDirectorCameraPairing,
      read: readDirectorCameraPose,
      close: closeDirectorCameraPairing,
    },
  ) {
    ((this['panel'] = _0x3b6ba0),
      (this['timeline'] = _0x3b6ba0['timeline']),
      (this['api'] = _0x4f3888),
      (this['epoch'] = 0x0),
      (this['sequence'] = -0x1));
  }
  ['render']() {
    return (
      '<fieldset><legend>手机虚拟摄像机</legend><div class="storyboard-3d-director-fields"><button data-storyboard-3d-action="timeline-mobile-connect" ' +
      (this['pending'] || this['pairing'] ? 'disabled' : '') +
      '>开启局域网配对</button>' +
      (this['pending'] ? '<progress aria-label="正在连接手机摄像机"></progress>' : '') +
      (this['pairing']
        ? '<button data-storyboard-3d-action="timeline-mobile-disconnect">断开</button><button data-storyboard-3d-action="timeline-mobile-save" ' +
          (this['camera'] ? '' : 'disabled') +
          '>保存当前机位</button><button\x20data-storyboard-3d-action=\x22timeline-mobile-record\x22\x20' +
          (this['camera'] ? '' : 'disabled') +
          '>' +
          (this['recording'] ? '结束并保存运镜' : '录制运镜') +
          '</button>'
        : '') +
      '</div>' +
      (this['pairing']
        ? '<p>手机与电脑连接同一局域网，在手机浏览器打开下方地址。配对\x2015\x20分钟后失效。</p>' +
          this['pairing']['urls']
            ['map'](
              (_0x44d22b) =>
                '<input aria-label="手机连接地址" readonly value="' + escape(_0x44d22b) + '\x22>',
            )
            ['join']('') +
          (this['pairing']['secure'] ? '' : '<p>当前为触控模式；陀螺仪需要可信\x20HTTPS\x20连接。</p>')
        : '') +
      '<output\x20data-mobile-status\x20role=\x22status\x22>' +
      escape(this['message'] || '') +
      '</output></fieldset>'
    );
  }
  ['identity']() {
    const { project: _0x4f0f4b, scene: _0x263c58, shot: _0x5121fd } = this['panel']['context']();
    return _0x4f0f4b?.['id'] + ':' + _0x263c58?.['id'] + ':' + _0x5121fd?.['id'];
  }
  ['click'](_0x53a10f) {
    if (!_0x53a10f['startsWith']('timeline-mobile-')) return ![];
    if (_0x53a10f === 'timeline-mobile-connect') void this['connect']();
    if (_0x53a10f === 'timeline-mobile-disconnect') this['disconnect']();
    if (_0x53a10f === 'timeline-mobile-save' && this['camera'])
      this['panel']['mutate']('保存手机机位', (_0x34e62c) =>
        upsertStoryboard3DCameraKeyframe(_0x34e62c, {
          time: this['timeline']['_timeForShot'](this['panel']['context']()['shot']),
          camera: this['camera'],
        }),
      );
    if (_0x53a10f === 'timeline-mobile-record' && this['camera']) {
      if (this['recording']) this['finishRecording']();
      else {
        const { project: _0x52cc78, scene: _0x7ea2ad, shot: _0xfdaadf } = this['panel']['context']();
        ((this['recording'] = {
          projectId: _0x52cc78['id'],
          sceneId: _0x7ea2ad['id'],
          shotId: _0xfdaadf['id'],
          start: this['timeline']['_timeForShot'](_0xfdaadf),
          clock: performance['now'](),
          frames: [
            { time: this['timeline']['_timeForShot'](_0xfdaadf), camera: structuredClone(this['camera']) },
          ],
        }),
          (this['message'] = '正在录制，结束后一次保存为摄像机关键帧。'));
      }
      this['timeline']['requestRender']?.();
    }
    return !![];
  }
  async ['connect']() {
    if (this['pending'] || this['pairing']) return;
    const _0x2f401c = ++this['epoch'];
    ((this['pending'] = !![]), (this['message'] = '正在开启配对…'), this['timeline']['requestRender']?.());
    try {
      const _0x3fcca6 = await this['api']['create']();
      if (_0x2f401c !== this['epoch']) {
        await this['api']['close'](_0x3fcca6['readToken']);
        return;
      }
      (this['timeline']['stopPlayback']({ render: ![] }),
        this['timeline']['cameraPath']['stop'](),
        this['timeline']['multiView']['destroy'](),
        (this['pairing'] = _0x3fcca6),
        (this['origin'] = this['identity']()),
        (this['base'] = structuredClone(
          this['timeline']['readCurrentCamera']?.() || this['panel']['context']()['shot']['camera'],
        )),
        (this['message'] = '等待手机连接…'),
        (this['sequence'] = -0x1),
        void this['poll'](_0x2f401c));
    } catch (_0x5ae7de) {
      if (_0x2f401c === this['epoch']) this['message'] = _0x5ae7de['message'];
    } finally {
      _0x2f401c === this['epoch'] && ((this['pending'] = ![]), this['timeline']['requestRender']?.());
    }
  }
  async ['poll'](_0x4ece48) {
    if (_0x4ece48 !== this['epoch'] || !this['pairing']) return;
    if (this['identity']() !== this['origin']) {
      this['disconnect']();
      return;
    }
    try {
      const _0x5cc17c = await this['api']['read'](this['pairing']['readToken']);
      if (_0x4ece48 !== this['epoch']) return;
      if (_0x5cc17c['pose'] && _0x5cc17c['sequence'] > this['sequence']) {
        const _0x56f094 = !this['camera'];
        ((this['sequence'] = _0x5cc17c['sequence']),
          (this['camera'] = applyRelativeCameraPose(this['base'], _0x5cc17c['pose'])));
        const _0x171092 = this['recording'];
        if (_0x171092) {
          const _0x4f468b = Math['min'](
            0xe10,
            _0x171092['start'] + (performance['now']() - _0x171092['clock']) / 0x3e8,
          );
          _0x171092['frames']['push']({ time: _0x4f468b, camera: structuredClone(this['camera']) });
          if (_0x171092['frames']['length'] >= 0xe10 || _0x4f468b >= 0xe10) this['finishRecording']();
        }
        ((this['message'] = this['recording']
          ? '录制中 · ' + this['recording']['frames']['length'] + '\x20帧'
          : '手机已连接，正在预览机位。'),
          this['preview']());
        if (_0x56f094) this['timeline']['requestRender']?.();
      } else {
        if (_0x5cc17c['pose'] && Date['now']() / 0x3e8 - _0x5cc17c['receivedAt'] > 0xa)
          this['message'] = '等待手机操作；如已离线，请重新连接。';
      }
      const _0x5d103a = this['timeline']['getRoot']?.()?.['querySelector']('[data-mobile-status]');
      if (_0x5d103a) _0x5d103a['textContent'] = this['message'];
    } catch (_0x3195bd) {
      _0x4ece48 === this['epoch'] && ((this['message'] = _0x3195bd['message']), this['disconnect']());
      return;
    }
    if (_0x4ece48 === this['epoch'])
      this['timer'] = this['timeline']['window']['setTimeout'](() => void this['poll'](_0x4ece48), 0x64);
  }
  ['preview']() {
    if (!this['camera'] || !this['pairing']) return;
    const { scene: _0x3a4f42, shot: _0x46c7c4 } = this['panel']['context'](),
      _0x163f31 = sampleStoryboard3DShotAnimation(
        _0x46c7c4['animation'],
        this['timeline']['_timeForShot'](_0x46c7c4),
        {
          camera: _0x46c7c4['camera'],
          objectTransforms: Object['fromEntries'](
            _0x3a4f42['objects']['map']((_0x5b20ec) => [_0x5b20ec['id'], _0x5b20ec['transform']]),
          ),
          objects: _0x3a4f42['objects'],
        },
      );
    this['timeline']['previewSample']?.({ ..._0x163f31, camera: this['camera'] });
  }
  ['finishRecording']() {
    const _0x6ca305 = this['recording'];
    this['recording'] = null;
    if (!_0x6ca305?.['frames']['length']) return;
    const _0x2a5948 = Math['min'](
      0xe10,
      _0x6ca305['start'] + (performance['now']() - _0x6ca305['clock']) / 0x3e8,
    );
    if (_0x2a5948 - _0x6ca305['frames']['at'](-0x1)['time'] > 0.04)
      _0x6ca305['frames']['push']({
        time: _0x2a5948,
        camera: structuredClone(this['camera'] || _0x6ca305['frames']['at'](-0x1)['camera']),
      });
    (this['timeline']['commitMutation']?.({
      type: 'director-mobile-record',
      label: '录制手机摄像机运镜',
      mutate: (_0x36187f) => {
        if (_0x36187f['id'] !== _0x6ca305['projectId']) return _0x36187f;
        const _0x14faad = _0x36187f['scenes']['find'](
            (_0x1faa99) => _0x1faa99['id'] === _0x6ca305['sceneId'],
          ),
          _0x204b1b = _0x14faad?.['shots']['find']((_0x144899) => _0x144899['id'] === _0x6ca305['shotId']);
        if (!_0x204b1b) return _0x36187f;
        const _0x1fda28 = _0x6ca305['frames']['at'](-0x1)['time'];
        let _0x539556 = normalizeStoryboard3DShotAnimation(_0x204b1b['animation'], {
          camera: _0x204b1b['camera'],
        });
        ((_0x539556['cameraKeyframes'] = _0x539556['cameraKeyframes']['filter'](
          (_0x121d6e) => _0x121d6e['time'] < _0x6ca305['start'] || _0x121d6e['time'] > _0x1fda28,
        )),
          (_0x539556['duration'] = Math['max'](_0x539556['duration'], _0x1fda28)));
        for (const _0xb2906b of _0x6ca305['frames'])
          _0x539556 = upsertStoryboard3DCameraKeyframe(_0x539556, { ..._0xb2906b, easing: 'linear' });
        return (
          _0x539556['cameraConstraintClips']['push']({
            id: 'mobile-' + globalThis['crypto']['randomUUID'](),
            start: _0x6ca305['start'],
            end: Math['max'](_0x6ca305['start'] + 0.001, _0x1fda28),
            followObjectId: '',
            lookAtObjectId: '',
          }),
          (_0x204b1b['animation'] = normalizeStoryboard3DShotAnimation(_0x539556)),
          (_0x204b1b['camera'] = structuredClone(_0x204b1b['animation']['cameraKeyframes'][0x0]['camera'])),
          syncStoryboard3DCameraObjectFromShot(_0x14faad, _0x204b1b),
          _0x36187f
        );
      },
    }),
      (this['message'] = '已保存 ' + _0x6ca305['frames']['length'] + ' 个运镜采样。'));
  }
  ['sync']() {
    if (this['pairing'] && this['identity']() !== this['origin']) this['disconnect']();
    else this['preview']();
  }
  ['disconnect']({ render: render = !![] } = {}) {
    ++this['epoch'];
    if (!this['pairing'] && !this['pending'] && !this['recording']) return;
    ((this['timeline']['window'] || globalThis)['clearTimeout'](this['timer']), this['finishRecording']());
    const _0xe0b5b5 = this['pairing'];
    ((this['pairing'] = null), (this['pending'] = ![]), (this['camera'] = null));
    if (_0xe0b5b5) void this['api']['close'](_0xe0b5b5['readToken'])['catch'](() => {});
    this['timeline']['clearPreview']?.();
    if (render) this['timeline']['requestRender']?.();
  }
  ['destroy']() {
    this['disconnect']({ render: ![] });
  }
}
