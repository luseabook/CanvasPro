import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isAgentConversationContinuation,
  isAgentCustomChoiceAnswer,
  isAgentStoryDeliverable,
  isAgentWritingRequest,
} from './agentConversationIntent.js';

test('写作意图：主题与请求动词同时命中才算写作请求', () => {
  assert.equal(isAgentWritingRequest('帮我写一个故事的结局'), true);
  assert.equal(isAgentWritingRequest('写一段文案'), true);
  assert.equal(isAgentWritingRequest('rewrite the dialogue'), true);
  assert.equal(isAgentWritingRequest('story about a hero'), false);
  assert.equal(isAgentWritingRequest('请把第三章'), false);
  assert.equal(isAgentWritingRequest(''), false);
});

test('写作意图：第N章写法可直接充当主题', () => {
  assert.equal(isAgentWritingRequest('续写第十二章'), true);
  assert.equal(isAgentWritingRequest('续写它'), false);
});

test('会话续写：常见简短指令判为续写', () => {
  for (const message of [
    '继续',
    '改成第三版',
    '选第一个',
    '都不选',
    '随便',
    '你决定',
    '短一点',
    '让主角',
    'the first option',
    'you decide',
  ])
    assert.equal(isAgentConversationContinuation(message), true, message);
});

test('会话续写：换话题与全新提问不算续写', () => {
  for (const message of ['换个话题重新开始', 'what is this', '帮我写一个故事', ''])
    assert.equal(isAgentConversationContinuation(message), false, message);
});

test('会话续写：新话题否定式优先于续写形态', () => {
  assert.equal(isAgentConversationContinuation('继续，但换个话题'), false);
  assert.equal(isAgentConversationContinuation('重新开始'), false);
});

test('自定义选项答案：非提问式短句均可视为回答', () => {
  assert.equal(isAgentCustomChoiceAnswer('都要，但节奏再快一点'), true);
  assert.equal(isAgentCustomChoiceAnswer('继续'), true);
  assert.equal(isAgentCustomChoiceAnswer(''), false);
  assert.equal(isAgentCustomChoiceAnswer('   '), false);
});

test('自定义选项答案：疑问式与换话题不算回答', () => {
  for (const message of [
    '请问这个怎么用',
    '什么是分镜',
    '如何进行润色',
    'why does it fail',
    '换个话题重新开始',
  ])
    assert.equal(isAgentCustomChoiceAnswer(message), false, message);
});

test('故事交付物：只认直接写故事的指令', () => {
  assert.equal(isAgentStoryDeliverable('帮我写一个故事的结局'), true);
  assert.equal(isAgentStoryDeliverable('写一段剧情'), true);
  assert.equal(isAgentStoryDeliverable('write a story about a hero'), true);
  assert.equal(isAgentStoryDeliverable('please generate the next chapter'), true);
});

test('故事交付物：故事板/故事视频等衍生词不算交付物', () => {
  assert.equal(isAgentStoryDeliverable('写一个故事板'), false);
  assert.equal(isAgentStoryDeliverable('写一个故事视频'), false);
  assert.equal(isAgentStoryDeliverable('继续'), false);
  assert.equal(isAgentStoryDeliverable(''), false);
});
