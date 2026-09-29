import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildReplicationFlowPrompt,
  resolveReplicationFlowOptions,
  stripFlowSubtitleOverlays,
} from './videoReplicationFlowPrompt.js';
import {
  STORY_PROMPT_MODE_SEEDANCE_2_0,
  STORY_PROMPT_MODE_SEEDANCE_2_5,
} from './promptModes.js';

test('videoReplicationFlowPrompt: resolves mode-specific duration limits', () => {
  assert.deepEqual(resolveReplicationFlowOptions({ promptMode: STORY_PROMPT_MODE_SEEDANCE_2_0 }), {
    promptMode: STORY_PROMPT_MODE_SEEDANCE_2_0,
    maxSeconds: 15,
  });
  assert.deepEqual(
    resolveReplicationFlowOptions({
      promptMode: STORY_PROMPT_MODE_SEEDANCE_2_5,
      maxSeconds: 60,
    }),
    {
      promptMode: STORY_PROMPT_MODE_SEEDANCE_2_5,
      maxSeconds: 30,
    },
  );
  assert.throws(
    () => resolveReplicationFlowOptions({ promptMode: 'unsupported' }),
    /仅支持 Seedance 2\.0 \/ 2\.5/u,
  );
  assert.throws(
    () =>
      resolveReplicationFlowOptions({
        promptMode: STORY_PROMPT_MODE_SEEDANCE_2_0,
        maxSeconds: 0,
      }),
    /片段时长上限无效/u,
  );
});

test('videoReplicationFlowPrompt: removes subtitle overlays without dropping narrative action', () => {
  assert.equal(
    stripFlowSubtitleOverlays('人物抬手。屏幕左上角字幕：“危险”。窗外传来雨声。'),
    '人物抬手。窗外传来雨声。',
  );
  assert.equal(
    stripFlowSubtitleOverlays('画面右上角出现白色竖排身份介绍文字：林先生。人物继续前行。'),
    '人物继续前行。',
  );
});

test('videoReplicationFlowPrompt: builds a complete prompt from source shots and speech', () => {
  const result = buildReplicationFlowPrompt(
    {
      characters: [{ id: 'c1', name: 'Alice' }],
      speech: [
        {
          id: 'speech-1',
          startSec: 1,
          endSec: 2,
          parts: [
            {
              speakerId: 'c1',
              kind: 'dialogue',
              text: '你好',
              uncertainty: '',
            },
          ],
        },
      ],
    },
    {
      start: 0,
      end: 5,
      shots: [
        {
          id: 'shot-1',
          startSec: 0,
          endSec: 5,
          sceneKey: 'scene-1',
          visual: 'Alice走入房间',
          camera: '中景固定镜头',
          sound: '雨声',
        },
      ],
      used: [{ name: 'Alice', appearance: '红大衣' }],
      promptMode: STORY_PROMPT_MODE_SEEDANCE_2_0,
    },
  );

  assert.equal(result.promptShots.length, 1);
  assert.deepEqual(result.promptShots[0].sourceShotIds, ['shot-1']);
  assert.equal(result.promptShots[0].speechFragments.length, 1);
  assert.match(result.prompt, /^生成5\.0秒视频。/u);
  assert.match(result.prompt, /人物：Alice（红大衣）/u);
  assert.match(result.prompt, /分镜1 ⏱ 5\.0s/u);
  assert.match(result.prompt, /画面：Alice走入房间/u);
  assert.match(result.prompt, /镜头：中景固定镜头。/u);
  assert.match(result.prompt, /环境音：雨声。/u);
  assert.match(result.prompt, /同期人声（本片段1\.0-2\.0秒）/u);
  assert.match(result.prompt, /Alice说：“你好”/u);
});

test('videoReplicationFlowPrompt: integer timing and shot speech keep short prompts readable', () => {
  const result = buildReplicationFlowPrompt(
    {
      characters: [{ id: 'c1', name: 'Alice' }],
      speech: [
        {
          id: 'speech-1',
          startSec: 0,
          endSec: 1,
          parts: [
            {
              speakerId: 'c1',
              kind: 'voiceover',
              text: '出发了',
              uncertainty: '',
            },
          ],
        },
      ],
    },
    {
      start: 0,
      end: 2,
      shots: [
        {
          id: 'shot-1',
          startSec: 0,
          endSec: 2,
          sceneKey: 'scene-1',
          visual: 'Alice推门离开',
          camera: '固定镜头',
          sound: '',
        },
      ],
      used: [],
      promptMode: STORY_PROMPT_MODE_SEEDANCE_2_0,
      referenceHeader: '',
      continuityLines: [],
      integerTime: true,
      shotSpeech: true,
    },
  );

  assert.match(result.prompt, /^生成2秒视频。/u);
  assert.match(result.prompt, /Alice画外音：“出发了”/u);
  assert.doesNotMatch(result.prompt, /同期人声/u);
});
