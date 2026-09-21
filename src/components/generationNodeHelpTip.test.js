import test from 'node:test';
import assert from 'node:assert/strict';
import { getGenerationNodeHelpTooltip, stripGenerationNodeHelpMarkup } from './generationNodeHelpTip.js';
(test('generationNodeHelpTip: manifest tooltip supports red emphasis markup', () => {
  const _0x34821c = getGenerationNodeHelpTooltip({ kind: 'audio', key: 'indextts2_clone' }),
    _0x28cb8b = getGenerationNodeHelpTooltip({ kind: 'audio', key: 'voice_convert' });
  (assert.match(_0x34821c, /\[\[red:1段参考音色\]\]/),
    assert.match(_0x28cb8b, /\[\[red:2段音频\]\]/),
    assert.equal(stripGenerationNodeHelpMarkup('输入 [[red:1段参考音色]]'), '输入 1段参考音色'));
}),
  test('generationNodeHelpTip: VEO3 tooltip follows generation type', () => {
    const _0x2ef84f = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/veo3-fast',
        nodeData: { generationParams: { generation_type: 'frame' } },
      }),
      _0x483de0 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/veo3-fast',
        nodeData: { generationParams: { generation_type: 'reference' } },
      });
    (assert.match(_0x2ef84f, /VEO3 首尾帧模式/),
      assert.match(_0x2ef84f, /\[\[red:不放图\]\]/),
      assert.match(_0x2ef84f, /文生视频/),
      assert.match(_0x2ef84f, /\[\[red:放 1 张图\]\]/),
      assert.match(_0x2ef84f, /普通图生视频/),
      assert.match(_0x2ef84f, /\[\[red:放 2 张图\]\]/),
      assert.match(_0x2ef84f, /提示词例子/),
      assert.doesNotMatch(_0x2ef84f, /jpg|png|webp|10MB/),
      assert.doesNotMatch(_0x2ef84f, /1-3 张参考图/),
      assert.match(_0x483de0, /VEO3 参考图模式/),
      assert.match(_0x483de0, /\[\[red:不放参考图\]\]/),
      assert.match(_0x483de0, /文生视频/),
      assert.match(_0x483de0, /\[\[red:放 1-3 张参考图\]\]/),
      assert.match(_0x483de0, /提示词例子/),
      assert.match(_0x483de0, /想生成什么动作和镜头/),
      assert.match(_0x483de0, /不会固定成开头和结尾/),
      assert.doesNotMatch(_0x483de0, /jpg|png|webp|10MB/),
      assert.doesNotMatch(_0x483de0, /2 张图/));
  }),
  test('generationNodeHelpTip: Hailuo tooltip explains usage scenarios', () => {
    const _0x5b3f7e = getGenerationNodeHelpTooltip({ kind: 'video', key: 'apimart/minimax-hailuo' });
    (assert.match(_0x5b3f7e, /Hailuo-02 适用场景/),
      assert.match(_0x5b3f7e, /\[\[red:不放图\]\]/),
      assert.match(_0x5b3f7e, /\[\[red:放 1 张首帧\]\]/),
      assert.match(_0x5b3f7e, /\[\[red:放 2 张首尾帧\]\]/),
      assert.match(_0x5b3f7e, /\[\[red:1080p 只做 5 秒\]\]/),
      assert.match(_0x5b3f7e, /提示词例子/),
      assert.doesNotMatch(_0x5b3f7e, /快速预处理|快速预览/));
  }),
  test('generationNodeHelpTip: Kling V3 tooltip explains first and last frame usage', () => {
    const _0x312934 = getGenerationNodeHelpTooltip({ kind: 'video', key: 'apimart/kling-v3' });
    (assert.match(_0x312934, /Kling V3 视频生成/),
      assert.match(_0x312934, /\[\[red:不放图\]\]/),
      assert.match(_0x312934, /\[\[red:接 1 张首帧\]\]/),
      assert.match(_0x312934, /\[\[red:接首帧 \+ 尾帧\]\]/),
      assert.match(_0x312934, /\[\[red:生成有声视频\]\]/),
      assert.match(_0x312934, /多镜头分镜模式暂未开放/),
      assert.match(_0x312934, /提示词例子/));
  }),
  test('generationNodeHelpTip: Kling V3 Omni tooltip follows selected mode', () => {
    const _0x2c6a39 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/kling-v3-omni',
        nodeData: { generationParams: { kling_v3_omni_mode: 'image' } },
      }),
      _0x1f3d94 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/kling-v3-omni',
        nodeData: { generationParams: { kling_v3_omni_mode: 'reference' } },
      }),
      _0x356436 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/kling-v3-omni',
        nodeData: { generationParams: { kling_v3_omni_mode: 'edit' } },
      });
    (assert.match(_0x2c6a39, /Kling V3 Omni 图生视频/),
      assert.match(_0x2c6a39, /\[\[red:接首帧 \+ 尾帧\]\]/),
      assert.match(_0x1f3d94, /Kling V3 Omni 参考生视频/),
      assert.match(_0x1f3d94, /\[\[red:接参考图或参考视频\]\]/),
      assert.match(_0x356436, /Kling V3 Omni 视频编辑/),
      assert.match(_0x356436, /\[\[red:接 1 个原视频\]\]/));
  }),
  test('generationNodeHelpTip: Kling O1 tooltip explains image reference syntax', () => {
    const _0x181f67 = getGenerationNodeHelpTooltip({ kind: 'video', key: 'apimart/kling-video-o1' });
    (assert.match(_0x181f67, /Kling Video O1/),
      assert.match(_0x181f67, /<<<image_1>>>/),
      assert.match(_0x181f67, /<<<image_2>>>/),
      assert.match(_0x181f67, /3-10/));
  }),
  test('generationNodeHelpTip: HappyHorse tooltip follows selected mode', () => {
    const _0x226606 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/happyhorse-1.0',
        nodeData: { generationParams: { happyhorse_mode: 'auto' } },
      }),
      _0x5925c3 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/happyhorse-1.0',
        nodeData: { generationParams: { happyhorse_mode: 'image' } },
      }),
      _0x1cc1a7 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/happyhorse-1.0',
        nodeData: { generationParams: { happyhorse_mode: 'reference' } },
      }),
      _0x33efb0 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/happyhorse-1.0',
        nodeData: { generationParams: { happyhorse_mode: 'edit' } },
      });
    (assert.match(_0x226606, /HappyHorse 1\.0 文生视频/),
      assert.match(_0x226606, /\[\[red:没入参时\]\]/),
      assert.match(_0x226606, /提示词例子/),
      assert.match(_0x5925c3, /HappyHorse 1\.0 图生视频/),
      assert.match(_0x5925c3, /\[\[red:接 1 张图\]\]/),
      assert.match(_0x5925c3, /\[\[red:没入参时\]\]/),
      assert.match(_0x5925c3, /仍然是文生视频/),
      assert.match(_0x1cc1a7, /HappyHorse 1\.0 参考图生视频/),
      assert.match(_0x1cc1a7, /\[\[red:接 1-9 张参考图\]\]/),
      assert.match(_0x1cc1a7, /\[\[red:没入参时\]\]/),
      assert.match(_0x1cc1a7, /仍然是文生视频/),
      assert.match(_0x33efb0, /HappyHorse 1\.0 视频编辑/),
      assert.match(_0x33efb0, /\[\[red:接 1 个视频\]\]/),
      assert.match(_0x33efb0, /\[\[red:没入参时\]\]/),
      assert.match(_0x33efb0, /最多 5 张参考图/),
      assert.match(_0x33efb0, /仍然是文生视频/));
  }),
  test('generationNodeHelpTip: Wan2.7 tooltip follows selected mode', () => {
    const _0x3eae24 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/wan2.7',
        nodeData: { generationParams: { wan27_mode: 'image' } },
      }),
      _0x131806 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/wan2.7',
        nodeData: { generationParams: { wan27_mode: 'video' } },
      }),
      _0x55df20 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/wan2.7',
        nodeData: { generationParams: { wan27_mode: 'reference' } },
      }),
      _0x299084 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/wan2.7',
        nodeData: { generationParams: { wan27_mode: 'edit' } },
      });
    (assert.match(_0x3eae24, /Wan2\.7 图生视频/),
      assert.match(_0x3eae24, /\[\[red:没入参时\]\]/),
      assert.match(_0x3eae24, /\[\[red:接首帧 \+ 尾帧\]\]/),
      assert.match(_0x3eae24, /2-30 秒且不超过 15MB/),
      assert.match(_0x131806, /Wan2\.7 视频续写/),
      assert.match(_0x131806, /\[\[red:接 1 个续写视频\]\]/),
      assert.match(_0x131806, /\[\[red:视频超过 10 秒\]\]/),
      assert.match(_0x55df20, /Wan2\.7 参考生视频/),
      assert.match(_0x55df20, /\[\[red:接参考图或参考视频\]\]/),
      assert.match(_0x55df20, /\[\[red:音频需搭配参考图\]\]/),
      assert.match(_0x299084, /Wan2\.7 视频编辑/),
      assert.match(_0x299084, /\[\[red:接 1 个原视频\]\]/),
      assert.match(_0x299084, /\[\[red:参考视频可选\]\]/),
      assert.match(_0x299084, /\[\[red:原视频 2-10 秒\]\]/));
  }));
