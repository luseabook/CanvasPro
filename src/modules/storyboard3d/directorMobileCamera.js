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
const escape = (value) =>
  String(value)['replaceAll']('&', '&amp;')['replaceAll']('"', '&quot;')['replaceAll']('<', '&lt;');
export class DirectorMobileCamera {
  constructor(
    item,
    key = {
      create: createDirectorCameraPairing,
      read: readDirectorCameraPose,
      close: closeDirectorCameraPairing,
    },
  ) {
    ((this['panel'] = item),
      (this['timeline'] = item['timeline']),
      (this['api'] = key),
      (this['epoch'] = 0),
      (this['sequence'] = -1));
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
          '>保存当前机位</button><button data-storyboard-3d-action="timeline-mobile-record" ' +
          (this['camera'] ? '' : 'disabled') +
          '>' +
          (this['recording'] ? '结束并保存运镜' : '录制运镜') +
          '</button>'
        : '') +
      '</div>' +
      (this['pairing']
        ? '<p>手机与电脑连接同一局域网，在手机浏览器打开下方地址。配对 15 分钟后失效。</p>' +
          this['pairing']['urls']
            ['map']((index) => '<input aria-label="手机连接地址" readonly value="' + escape(index) + '">')
            ['join']('') +
          (this['pairing']['secure'] ? '' : '<p>当前为触控模式；陀螺仪需要可信 HTTPS 连接。</p>')
        : '') +
      '<output data-mobile-status role="status">' +
      escape(this['message'] || '') +
      '</output></fieldset>'
    );
  }
  ['identity']() {
    const { project: project, scene: scene, shot: shot } = this['panel']['context']();
    return project?.['id'] + ':' + scene?.['id'] + ':' + shot?.['id'];
  }
  ['click'](enabled) {
    if (!enabled['startsWith']('timeline-mobile-')) return ![];
    if (enabled === 'timeline-mobile-connect') void this['connect']();
    if (enabled === 'timeline-mobile-disconnect') this['disconnect']();
    if (enabled === 'timeline-mobile-save' && this['camera'])
      this['panel']['mutate']('保存手机机位', (result) =>
        upsertStoryboard3DCameraKeyframe(result, {
          time: this['timeline']['_timeForShot'](this['panel']['context']()['shot']),
          camera: this['camera'],
        }),
      );
    if (enabled === 'timeline-mobile-record' && this['camera']) {
      if (this['recording']) this['finishRecording']();
      else {
        const { project: project2, scene: scene2, shot: shot2 } = this['panel']['context']();
        ((this['recording'] = {
          projectId: project2['id'],
          sceneId: scene2['id'],
          shotId: shot2['id'],
          start: this['timeline']['_timeForShot'](shot2),
          clock: performance['now'](),
          frames: [
            { time: this['timeline']['_timeForShot'](shot2), camera: structuredClone(this['camera']) },
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
    const data = ++this['epoch'];
    ((this['pending'] = !![]), (this['message'] = '正在开启配对…'), this['timeline']['requestRender']?.());
    try {
      const options = await this['api']['create']();
      if (data !== this['epoch']) {
        await this['api']['close'](options['readToken']);
        return;
      }
      (this['timeline']['stopPlayback']({ render: ![] }),
        this['timeline']['cameraPath']['stop'](),
        this['timeline']['multiView']['destroy'](),
        (this['pairing'] = options),
        (this['origin'] = this['identity']()),
        (this['base'] = structuredClone(
          this['timeline']['readCurrentCamera']?.() || this['panel']['context']()['shot']['camera'],
        )),
        (this['message'] = '等待手机连接…'),
        (this['sequence'] = -1),
        void this['poll'](data));
    } catch (error) {
      if (data === this['epoch']) this['message'] = error['message'];
    } finally {
      data === this['epoch'] && ((this['pending'] = ![]), this['timeline']['requestRender']?.());
    }
  }
  async ['poll'](target) {
    if (target !== this['epoch'] || !this['pairing']) return;
    if (this['identity']() !== this['origin']) {
      this['disconnect']();
      return;
    }
    try {
      const source = await this['api']['read'](this['pairing']['readToken']);
      if (target !== this['epoch']) return;
      if (source['pose'] && source['sequence'] > this['sequence']) {
        const next = !this['camera'];
        ((this['sequence'] = source['sequence']),
          (this['camera'] = applyRelativeCameraPose(this['base'], source['pose'])));
        const current = this['recording'];
        if (current) {
          const time = Math['min'](
            3600,
            current['start'] + (performance['now']() - current['clock']) / 1000,
          );
          current['frames']['push']({ time: time, camera: structuredClone(this['camera']) });
          if (current['frames']['length'] >= 3600 || time >= 3600) this['finishRecording']();
        }
        ((this['message'] = this['recording']
          ? '录制中 · ' + this['recording']['frames']['length'] + ' 帧'
          : '手机已连接，正在预览机位。'),
          this['preview']());
        if (next) this['timeline']['requestRender']?.();
      } else {
        if (source['pose'] && Date['now']() / 1000 - source['receivedAt'] > 10)
          this['message'] = '等待手机操作；如已离线，请重新连接。';
      }
      const el = this['timeline']['getRoot']?.()?.['querySelector']('[data-mobile-status]');
      if (el) el['textContent'] = this['message'];
    } catch (error2) {
      target === this['epoch'] && ((this['message'] = error2['message']), this['disconnect']());
      return;
    }
    if (target === this['epoch'])
      this['timer'] = this['timeline']['window']['setTimeout'](() => void this['poll'](target), 100);
  }
  ['preview']() {
    if (!this['camera'] || !this['pairing']) return;
    const { scene: scene3, shot: shot3 } = this['panel']['context'](),
      args = sampleStoryboard3DShotAnimation(shot3['animation'], this['timeline']['_timeForShot'](shot3), {
        camera: shot3['camera'],
        objectTransforms: Object['fromEntries'](
          scene3['objects']['map']((entry) => [entry['id'], entry['transform']]),
        ),
        objects: scene3['objects'],
      });
    this['timeline']['previewSample']?.({ ...args, camera: this['camera'] });
  }
  ['finishRecording']() {
    const start = this['recording'];
    this['recording'] = null;
    if (!start?.['frames']['length']) return;
    const time2 = Math['min'](3600, start['start'] + (performance['now']() - start['clock']) / 1000);
    if (time2 - start['frames']['at'](-1)['time'] > 0.04)
      start['frames']['push']({
        time: time2,
        camera: structuredClone(this['camera'] || start['frames']['at'](-1)['camera']),
      });
    (this['timeline']['commitMutation']?.({
      type: 'director-mobile-record',
      label: '录制手机摄像机运镜',
      mutate: (record) => {
        if (record['id'] !== start['projectId']) return record;
        const payload = record['scenes']['find']((handle) => handle['id'] === start['sceneId']),
          camera = payload?.['shots']['find']((state) => state['id'] === start['shotId']);
        if (!camera) return record;
        const config = start['frames']['at'](-1)['time'];
        let storyboard3DShotAnimation = normalizeStoryboard3DShotAnimation(camera['animation'], {
          camera: camera['camera'],
        });
        ((storyboard3DShotAnimation['cameraKeyframes'] = storyboard3DShotAnimation['cameraKeyframes'][
          'filter'
        ]((scope) => scope['time'] < start['start'] || scope['time'] > config)),
          (storyboard3DShotAnimation['duration'] = Math['max'](
            storyboard3DShotAnimation['duration'],
            config,
          )));
        for (const args2 of start['frames'])
          storyboard3DShotAnimation = upsertStoryboard3DCameraKeyframe(storyboard3DShotAnimation, {
            ...args2,
            easing: 'linear',
          });
        return (
          storyboard3DShotAnimation['cameraConstraintClips']['push']({
            id: 'mobile-' + globalThis['crypto']['randomUUID'](),
            start: start['start'],
            end: Math['max'](start['start'] + 0.001, config),
            followObjectId: '',
            lookAtObjectId: '',
          }),
          (camera['animation'] = normalizeStoryboard3DShotAnimation(storyboard3DShotAnimation)),
          (camera['camera'] = structuredClone(camera['animation']['cameraKeyframes'][0]['camera'])),
          syncStoryboard3DCameraObjectFromShot(payload, camera),
          record
        );
      },
    }),
      (this['message'] = '已保存 ' + start['frames']['length'] + ' 个运镜采样。'));
  }
  ['sync']() {
    if (this['pairing'] && this['identity']() !== this['origin']) this['disconnect']();
    else this['preview']();
  }
  ['disconnect']({ render: render = !![] } = {}) {
    ++this['epoch'];
    if (!this['pairing'] && !this['pending'] && !this['recording']) return;
    ((this['timeline']['window'] || globalThis)['clearTimeout'](this['timer']), this['finishRecording']());
    const input = this['pairing'];
    ((this['pairing'] = null), (this['pending'] = ![]), (this['camera'] = null));
    if (input) void this['api']['close'](input['readToken'])['catch'](() => {});
    this['timeline']['clearPreview']?.();
    if (render) this['timeline']['requestRender']?.();
  }
  ['destroy']() {
    this['disconnect']({ render: ![] });
  }
}
