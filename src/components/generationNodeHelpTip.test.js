import test from 'node:test';
import assert from 'node:assert/strict';
import { getGenerationNodeHelpTooltip, stripGenerationNodeHelpMarkup } from './generationNodeHelpTip.js';
(test('generationNodeHelpTip: manifest tooltip supports red emphasis markup', () => {
  const generationNodeHelpTooltip = getGenerationNodeHelpTooltip({ kind: 'audio', key: 'indextts2_clone' }),
    generationNodeHelpTooltip2 = getGenerationNodeHelpTooltip({ kind: 'audio', key: 'voice_convert' });
  (assert.match(generationNodeHelpTooltip, /\[\[red:1段参考音色\]\]/),
    assert.match(generationNodeHelpTooltip2, /\[\[red:2段音频\]\]/),
    assert.equal(stripGenerationNodeHelpMarkup('输入 [[red:1段参考音色]]'), '输入 1段参考音色'));
}),
  test('generationNodeHelpTip: VEO3 tooltip follows generation type', () => {
    const generationNodeHelpTooltip3 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/veo3-fast',
        nodeData: { generationParams: { generation_type: 'frame' } },
      }),
      generationNodeHelpTooltip4 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/veo3-fast',
        nodeData: { generationParams: { generation_type: 'reference' } },
      });
    (assert.match(generationNodeHelpTooltip3, /VEO3 首尾帧模式/),
      assert.match(generationNodeHelpTooltip3, /\[\[red:不放图\]\]/),
      assert.match(generationNodeHelpTooltip3, /文生视频/),
      assert.match(generationNodeHelpTooltip3, /\[\[red:放 1 张图\]\]/),
      assert.match(generationNodeHelpTooltip3, /普通图生视频/),
      assert.match(generationNodeHelpTooltip3, /\[\[red:放 2 张图\]\]/),
      assert.match(generationNodeHelpTooltip3, /提示词例子/),
      assert.doesNotMatch(generationNodeHelpTooltip3, /jpg|png|webp|10MB/),
      assert.doesNotMatch(generationNodeHelpTooltip3, /1-3 张参考图/),
      assert.match(generationNodeHelpTooltip4, /VEO3 参考图模式/),
      assert.match(generationNodeHelpTooltip4, /\[\[red:不放参考图\]\]/),
      assert.match(generationNodeHelpTooltip4, /文生视频/),
      assert.match(generationNodeHelpTooltip4, /\[\[red:放 1-3 张参考图\]\]/),
      assert.match(generationNodeHelpTooltip4, /提示词例子/),
      assert.match(generationNodeHelpTooltip4, /想生成什么动作和镜头/),
      assert.match(generationNodeHelpTooltip4, /不会固定成开头和结尾/),
      assert.doesNotMatch(generationNodeHelpTooltip4, /jpg|png|webp|10MB/),
      assert.doesNotMatch(generationNodeHelpTooltip4, /2 张图/));
  }),
  test('generationNodeHelpTip: Hailuo tooltip explains usage scenarios', () => {
    const generationNodeHelpTooltip5 = getGenerationNodeHelpTooltip({
      kind: 'video',
      key: 'apimart/minimax-hailuo',
    });
    (assert.match(generationNodeHelpTooltip5, /Hailuo-02 适用场景/),
      assert.match(generationNodeHelpTooltip5, /\[\[red:不放图\]\]/),
      assert.match(generationNodeHelpTooltip5, /\[\[red:放 1 张首帧\]\]/),
      assert.match(generationNodeHelpTooltip5, /\[\[red:放 2 张首尾帧\]\]/),
      assert.match(generationNodeHelpTooltip5, /\[\[red:1080p 只做 5 秒\]\]/),
      assert.match(generationNodeHelpTooltip5, /提示词例子/),
      assert.doesNotMatch(generationNodeHelpTooltip5, /快速预处理|快速预览/));
  }),
  test('generationNodeHelpTip: Kling V3 tooltip explains first and last frame usage', () => {
    const generationNodeHelpTooltip6 = getGenerationNodeHelpTooltip({
      kind: 'video',
      key: 'apimart/kling-v3',
    });
    (assert.match(generationNodeHelpTooltip6, /Kling V3 视频生成/),
      assert.match(generationNodeHelpTooltip6, /\[\[red:不放图\]\]/),
      assert.match(generationNodeHelpTooltip6, /\[\[red:接 1 张首帧\]\]/),
      assert.match(generationNodeHelpTooltip6, /\[\[red:接首帧 \+ 尾帧\]\]/),
      assert.match(generationNodeHelpTooltip6, /\[\[red:生成有声视频\]\]/),
      assert.match(generationNodeHelpTooltip6, /多镜头分镜模式暂未开放/),
      assert.match(generationNodeHelpTooltip6, /提示词例子/));
  }),
  test('generationNodeHelpTip: Kling V3 Omni tooltip follows selected mode', () => {
    const generationNodeHelpTooltip7 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/kling-v3-omni',
        nodeData: { generationParams: { kling_v3_omni_mode: 'image' } },
      }),
      generationNodeHelpTooltip8 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/kling-v3-omni',
        nodeData: { generationParams: { kling_v3_omni_mode: 'reference' } },
      }),
      generationNodeHelpTooltip9 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/kling-v3-omni',
        nodeData: { generationParams: { kling_v3_omni_mode: 'edit' } },
      });
    (assert.match(generationNodeHelpTooltip7, /Kling V3 Omni 图生视频/),
      assert.match(generationNodeHelpTooltip7, /\[\[red:接首帧 \+ 尾帧\]\]/),
      assert.match(generationNodeHelpTooltip8, /Kling V3 Omni 参考生视频/),
      assert.match(generationNodeHelpTooltip8, /\[\[red:接参考图或参考视频\]\]/),
      assert.match(generationNodeHelpTooltip9, /Kling V3 Omni 视频编辑/),
      assert.match(generationNodeHelpTooltip9, /\[\[red:接 1 个原视频\]\]/));
  }),
  test('generationNodeHelpTip: Kling O1 tooltip explains image reference syntax', () => {
    const generationNodeHelpTooltip10 = getGenerationNodeHelpTooltip({
      kind: 'video',
      key: 'apimart/kling-video-o1',
    });
    (assert.match(generationNodeHelpTooltip10, /Kling Video O1/),
      assert.match(generationNodeHelpTooltip10, /<<<image_1>>>/),
      assert.match(generationNodeHelpTooltip10, /<<<image_2>>>/),
      assert.match(generationNodeHelpTooltip10, /3-10/));
  }),
  test('generationNodeHelpTip: HappyHorse tooltip follows selected mode', () => {
    const generationNodeHelpTooltip11 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/happyhorse-1.0',
        nodeData: { generationParams: { happyhorse_mode: 'auto' } },
      }),
      generationNodeHelpTooltip12 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/happyhorse-1.0',
        nodeData: { generationParams: { happyhorse_mode: 'image' } },
      }),
      generationNodeHelpTooltip13 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/happyhorse-1.0',
        nodeData: { generationParams: { happyhorse_mode: 'reference' } },
      }),
      generationNodeHelpTooltip14 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/happyhorse-1.0',
        nodeData: { generationParams: { happyhorse_mode: 'edit' } },
      });
    (assert.match(generationNodeHelpTooltip11, /HappyHorse 1\.0 文生视频/),
      assert.match(generationNodeHelpTooltip11, /\[\[red:没入参时\]\]/),
      assert.match(generationNodeHelpTooltip11, /提示词例子/),
      assert.match(generationNodeHelpTooltip12, /HappyHorse 1\.0 图生视频/),
      assert.match(generationNodeHelpTooltip12, /\[\[red:接 1 张图\]\]/),
      assert.match(generationNodeHelpTooltip12, /\[\[red:没入参时\]\]/),
      assert.match(generationNodeHelpTooltip12, /仍然是文生视频/),
      assert.match(generationNodeHelpTooltip13, /HappyHorse 1\.0 参考图生视频/),
      assert.match(generationNodeHelpTooltip13, /\[\[red:接 1-9 张参考图\]\]/),
      assert.match(generationNodeHelpTooltip13, /\[\[red:没入参时\]\]/),
      assert.match(generationNodeHelpTooltip13, /仍然是文生视频/),
      assert.match(generationNodeHelpTooltip14, /HappyHorse 1\.0 视频编辑/),
      assert.match(generationNodeHelpTooltip14, /\[\[red:接 1 个视频\]\]/),
      assert.match(generationNodeHelpTooltip14, /\[\[red:没入参时\]\]/),
      assert.match(generationNodeHelpTooltip14, /最多 5 张参考图/),
      assert.match(generationNodeHelpTooltip14, /仍然是文生视频/));
  }),
  test('generationNodeHelpTip: Wan2.7 tooltip follows selected mode', () => {
    const generationNodeHelpTooltip15 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/wan2.7',
        nodeData: { generationParams: { wan27_mode: 'image' } },
      }),
      generationNodeHelpTooltip16 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/wan2.7',
        nodeData: { generationParams: { wan27_mode: 'video' } },
      }),
      generationNodeHelpTooltip17 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/wan2.7',
        nodeData: { generationParams: { wan27_mode: 'reference' } },
      }),
      generationNodeHelpTooltip18 = getGenerationNodeHelpTooltip({
        kind: 'video',
        key: 'apimart/wan2.7',
        nodeData: { generationParams: { wan27_mode: 'edit' } },
      });
    (assert.match(generationNodeHelpTooltip15, /Wan2\.7 图生视频/),
      assert.match(generationNodeHelpTooltip15, /\[\[red:没入参时\]\]/),
      assert.match(generationNodeHelpTooltip15, /\[\[red:接首帧 \+ 尾帧\]\]/),
      assert.match(generationNodeHelpTooltip15, /2-30 秒且不超过 15MB/),
      assert.match(generationNodeHelpTooltip16, /Wan2\.7 视频续写/),
      assert.match(generationNodeHelpTooltip16, /\[\[red:接 1 个续写视频\]\]/),
      assert.match(generationNodeHelpTooltip16, /\[\[red:视频超过 10 秒\]\]/),
      assert.match(generationNodeHelpTooltip17, /Wan2\.7 参考生视频/),
      assert.match(generationNodeHelpTooltip17, /\[\[red:接参考图或参考视频\]\]/),
      assert.match(generationNodeHelpTooltip17, /\[\[red:音频需搭配参考图\]\]/),
      assert.match(generationNodeHelpTooltip18, /Wan2\.7 视频编辑/),
      assert.match(generationNodeHelpTooltip18, /\[\[red:接 1 个原视频\]\]/),
      assert.match(generationNodeHelpTooltip18, /\[\[red:参考视频可选\]\]/),
      assert.match(generationNodeHelpTooltip18, /\[\[red:原视频 2-10 秒\]\]/));
  }));
