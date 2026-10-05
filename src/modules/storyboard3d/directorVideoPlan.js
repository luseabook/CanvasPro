import { normalizeStoryboard3DShotAnimation, sampleStoryboard3DShotAnimation } from './shotAnimation.js';
export function createDirectorVideoPlan(value, item, key = {}) {
  let index = 0;
  const args = item['map']((args2) => {
    const result = key['scenes']?.['find']((data) => data['id'] === args2['sceneId']) || value;
    let storyboard3DShotAnimation = normalizeStoryboard3DShotAnimation(
      { ...args2['animation'], loop: false },
      { camera: args2['camera'] },
    );
    const options = key['videoTrack'] || 'all';
    if (options !== 'all') {
      ((storyboard3DShotAnimation['objectTracks'] = storyboard3DShotAnimation['objectTracks']['filter'](
        (target) => target['objectId'] === options,
      )),
        (storyboard3DShotAnimation['actionClips'] = storyboard3DShotAnimation['actionClips']['filter'](
          (source) => source['objectId'] === options,
        )));
      if (options !== 'camera')
        storyboard3DShotAnimation['cameraKeyframes'] = [
          { id: 'video-camera', time: 0, camera: structuredClone(args2['camera']), easing: 'linear' },
        ];
      ((storyboard3DShotAnimation['cameraConstraint'] = {}),
        (storyboard3DShotAnimation['cameraConstraintClips'] = []),
        (storyboard3DShotAnimation = normalizeStoryboard3DShotAnimation(storyboard3DShotAnimation)));
    }
    storyboard3DShotAnimation['cameraKeyframes']['forEach']((next) => {
      next['camera']['aspectRatio'] = key['aspectRatio'] || '16:9';
    });
    const current = Math['max'](0, Number(key['videoStart']) || 0),
      entry =
        Number(key['videoEnd']) > 0
          ? Math['min'](storyboard3DShotAnimation['duration'], Number(key['videoEnd']))
          : storyboard3DShotAnimation['duration'];
    if (entry <= current)
      throw new Error('镜头「' + args2['name'] + '」的导出区间为空，请调整开始与结束时间。');
    const record = {
      shot: args2,
      scene: result,
      objectTransforms: Object['fromEntries'](
        result['objects']['map']((payload) => [payload['id'], payload['transform']]),
      ),
      animation: storyboard3DShotAnimation,
      sourceStart: current,
      duration: entry - current,
      start: index,
      end: index + entry - current,
    };
    return ((index = record['end']), record);
  });
  if (!args['length']) throw new Error('请选择要录制的镜头。');
  return {
    segments: args,
    duration: index,
    track: key['videoTrack'] || 'all',
    fps: Math['max'](...args['map']((handle) => handle['animation']['fps'])),
    objectTransforms: Object['fromEntries'](
      value['objects']['map']((state) => [state['id'], state['transform']]),
    ),
  };
}
export function sampleDirectorVideoPlan(config, scope, input) {
  const output =
    config['segments']['find']((value2) => scope < value2['end']) || config['segments']['at'](-1);
  input = output['scene'] || input;
  const value3 =
    config['track'] === 'all'
      ? input['objects']
      : input['objects']['map']((args3) =>
          args3['id'] === config['track'] ? args3 : { ...args3, actionPlaying: false },
        );
  return sampleStoryboard3DShotAnimation(
    output['animation'],
    output['sourceStart'] + Math['max'](0, Math['min'](output['duration'], scope - output['start'])),
    {
      camera: output['shot']['camera'],
      objectTransforms: output['objectTransforms'] || config['objectTransforms'],
      objects: value3,
    },
  );
}
