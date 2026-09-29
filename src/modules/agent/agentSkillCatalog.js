import { createAgentSkillRegistryCore } from './agentSkillRegistry.js';
const textToImageSkill = {
    schemaVersion: 1,
    id: 'text-to-image',
    title: 'Text to image',
    riskLevel: 'confirm',
    appliesWhen: ['user wants to create images from text'],
    requiredInputs: ['prompt'],
    missingInputQuestions: [
      'What image prompt should be used?',
      'Do you prefer speed, quality, or low cost?',
    ],
    recommendedModelKind: 'image',
    defaultParams: {},
    commands: ['node.create', 'node.setPrompt', 'node.setParams', 'generation.run'],
  },
  textToVideoSkill = {
    schemaVersion: 1,
    id: 'text-to-video',
    title: 'Text to video',
    riskLevel: 'confirm',
    appliesWhen: ['user wants to create video from text'],
    requiredInputs: ['prompt'],
    missingInputQuestions: [
      'What should happen in the video?',
      'What duration and aspect ratio do you want?',
    ],
    recommendedModelKind: 'video',
    defaultParams: { duration: 5 },
    commands: ['node.create', 'node.setPrompt', 'node.setParams', 'generation.run'],
  },
  imageToVideoSkill = {
    schemaVersion: 1,
    id: 'image-to-video',
    title: 'Image to video',
    riskLevel: 'confirm',
    appliesWhen: ['user wants to animate an image or generate video from selected images'],
    requiredInputs: ['source image', 'prompt or motion intent'],
    missingInputQuestions: [
      'Which image should be used as the video reference?',
      'How long should the video be?',
      'Do you prefer speed, quality, or low cost?',
    ],
    recommendedModelKind: 'video',
    defaultParams: { duration: 5, aspectRatio: '16:9' },
    commands: ['node.create', 'graph.connect', 'node.setPrompt', 'node.setParams', 'generation.run'],
  },
  batchLayoutSkill = {
    schemaVersion: 1,
    id: 'batch-layout',
    title: 'Batch layout',
    riskLevel: 'safe',
    appliesWhen: ['user wants to align, distribute, or arrange many canvas nodes'],
    requiredInputs: ['target nodes', 'layout intent'],
    missingInputQuestions: [
      'Which nodes should be arranged?',
      'Should they be arranged as a row, column, or grid?',
    ],
    recommendedModelKind: '',
    defaultParams: { gap: 40 },
    commands: [
      'node.select',
      'layout.align',
      'layout.distribute',
      'layout.arrangeRow',
      'layout.arrangeColumn',
      'layout.arrangeGrid',
      'viewport.focusNodes',
    ],
  },
  AGENT_SKILL_ALLOWLIST = Object.freeze([
    textToImageSkill,
    textToVideoSkill,
    imageToVideoSkill,
    batchLayoutSkill,
  ]);
function normalizeSkill(_0x180da7 = {}) {
  return {
    id: String(_0x180da7.id || '').trim(),
    title: String(_0x180da7.title || '').trim(),
    riskLevel: String(_0x180da7.riskLevel || 'safe').trim(),
    appliesWhen: Array.isArray(_0x180da7.appliesWhen)
      ? _0x180da7.appliesWhen.map((_0x125ba3) => String(_0x125ba3 || '')).filter(Boolean)
      : [],
    requiredInputs: Array.isArray(_0x180da7.requiredInputs)
      ? _0x180da7.requiredInputs.map((_0xb82613) => String(_0xb82613 || '')).filter(Boolean)
      : [],
    missingInputQuestions: Array.isArray(_0x180da7.missingInputQuestions)
      ? _0x180da7.missingInputQuestions.map((_0x5d3dd0) => String(_0x5d3dd0 || '')).filter(Boolean)
      : [],
    recommendedModelKind: String(_0x180da7.recommendedModelKind || '').trim(),
    defaultParams:
      _0x180da7.defaultParams && typeof _0x180da7.defaultParams === 'object'
        ? { ..._0x180da7.defaultParams }
        : {},
    commands: Array.isArray(_0x180da7.commands)
      ? _0x180da7.commands.map((_0x255335) => String(_0x255335 || '')).filter(Boolean)
      : [],
  };
}
export function listAgentSkills() {
  return AGENT_SKILL_ALLOWLIST.map(normalizeSkill).filter((_0x23e37a) => _0x23e37a.id);
}

const workflowOrganizeSkill = {'schemaVersion':0x1,'id':"workflow-organize",'title':"Workflow organize",'riskLevel':'safe','appliesWhen':["user wants to summarize, label, connect, or tidy the current canvas workflow"],'requiredInputs':['current\x20canvas',"organize intent"],'missingInputQuestions':["Which part of the canvas should be organized?",'Should\x20I\x20summarize,\x20rename,\x20connect,\x20or\x20arrange\x20the\x20workflow?'],'recommendedModelKind':'','defaultParams':{'gap':0x3c},'commands':["graph.getCanvasSummary",'graph.getSelection',"node.create",'node.rename',"graph.connect","layout.arrangeRow","layout.arrangeColumn","layout.arrangeGrid","viewport.focusNodes"]};
const mediaProcessingSkill = {'schemaVersion':0x1,'id':'media-processing','title':"Media processing",'riskLevel':"confirm",'appliesWhen':["user wants to process existing image, video, or audio nodes","user asks to reverse video, extract video keyframes, arrange frames into a storyboard, separate audio and video, split audio stems, split an image grid, or reset media node size"],'requiredInputs':["selected image, video, or audio node"],'missingInputQuestions':["Which media node should be processed?","For image grid splitting, how many columns and rows should be created?"],'recommendedModelKind':'','defaultParams':{'cols':0x2,'rows':0x2},'commands':["video.reverse","video.extractKeyframes","storyboard.createFromImages","video.separateAv","audio.separate","image.splitGrid",'media.resetSize','layout.arrangeGrid','viewport.focusNodes'],'category':"canvas"};
const storyboardAssemblySkill = {'schemaVersion':0x1,'id':'storyboard-assembly','title':'Storyboard\x20assembly','riskLevel':"safe",'appliesWhen':['user\x20wants\x20to\x20turn\x20existing\x20images\x20or\x20extracted\x20keyframes\x20into\x20a\x20storyboard',"user asks to arrange frames, shots, thumbnails, or keyframes into a storyboard node"],'requiredInputs':["selected image nodes or keyframe node ids"],'missingInputQuestions':["Which image or keyframe nodes should be placed into the storyboard?","How many columns should the storyboard use?"],'recommendedModelKind':'','defaultParams':{'orderBy':"selection"},'commands':['storyboard.createFromImages',"layout.arrangeGrid",'viewport.focusNodes'],'category':"canvas"};
const taskManagementSkill = {'schemaVersion':0x1,'id':"task-management",'title':"Task management",'riskLevel':'confirm','appliesWhen':["user wants to focus a generation task result on the canvas","user asks to retry a failed generation task or continue from a task result"],'requiredInputs':['task\x20id\x20or\x20target\x20canvas\x20node\x20id'],'missingInputQuestions':["Which task or result node should be focused?","Which generation node should be retried?"],'recommendedModelKind':'','defaultParams':{'padding':0x50,'durationMs':0x320},'commands':["task.focusResult","task.retry","generation.getStatus",'generation.cancel',"viewport.focusNodes"],'category':'canvas'};
const sceneDirectorSkill = {'schemaVersion':0x1,'id':"scene-director",'title':"3D scene director",'riskLevel':'safe','appliesWhen':['user\x20asks\x20to\x20build,\x20arrange,\x20or\x20edit\x20a\x203D\x20Stage\x20scene',"user describes people, poses, buildings, furniture, props, or camera motion in a scene","user asks for dancing characters or camera keyframes"],'requiredInputs':["a selected 3D Stage node or permission to create one",'scene\x20subject\x20and\x20approximate\x20character\x20count'],'missingInputQuestions':['Should\x20the\x20Agent\x20replace\x20the\x20current\x203D\x20Stage\x20contents\x20or\x20add\x20to\x20them?'],'recommendedModelKind':'','defaultParams':{'replaceExisting':![],'environmentMode':"night"},'commands':["node.create","scene.catalog.search","scene.pose.list","scene.compose","scene.mannequin.setPose",'scene.camera.addKeyframe',"scene.camera.updateTimeline",'viewport.focusNodes'],'category':"canvas"};
const storyWritingSkill = {'schemaVersion':0x1,'id':"story-writing",'title':"故事创作",'description':"故事、小说、人物与剧情创作，支持续写、改写及互动剧情选择。",'category':'writing','riskLevel':"safe",'commands':[],'triggers':['写故事',"悬疑故事",'小说',"互动故事","剧情走向"],'instructions':"根据用户要求直接创作故事、人物设定、大纲、章节或对白。信息足够时采用合理默认值，不把简单创作变成长问卷。保持已有角色姓名、关系、视角、时间线、关键线索与用户选定的剧情方向；续写从最近一稿的结尾承接。只有用户要求互动叙事或方向确实需要选择时，给出两到三个有实质差异的走向，使用系统定义的对话选项协议，并允许自由输入。用户说你决定时自行选择并继续。改写只调整用户指定的内容，保留其余设定。输出适合阅读的自然文字，不自行创建画布节点。"};
const mpDiagnoseSkill = {'schemaVersion':0x1,'id':"mp-diagnose",'title':"Diagnose（诊断）",'riskLevel':'confirm','category':"engineering",'appliesWhen':["bug 诊断","调试问题",'性能回退',"错误排查","reproduce","minimise","hypothesise",'instrument'],'requiredInputs':["问题描述"],'missingInputQuestions':['具体遇到了什么问题或错误？'],'recommendedModelKind':'','defaultParams':{},'commands':["graph.getCanvasSummary","node.getSummary","graph.getSelection"]};
const mpGrillWithDocsSkill = {'schemaVersion':0x1,'id':"mp-grill-with-docs",'title':"Grill with Docs（带文档拷问）",'riskLevel':"safe",'category':'engineering','appliesWhen':["需求对齐",'架构设计讨论',"领域模型","术语定义","CONTEXT.md","ADR","决策记录",'grill'],'requiredInputs':['计划或设计想法'],'missingInputQuestions':['你想构建或改变什么？'],'recommendedModelKind':'','defaultParams':{},'commands':["graph.getCanvasSummary"]};
const mpImproveArchitectureSkill = {'schemaVersion':0x1,'id':"mp-improve-codebase-architecture",'title':'Improve\x20Architecture（架构改进）','riskLevel':"confirm",'category':"engineering",'appliesWhen':["架构改进","代码重构","deepen modules","减少耦合","架构优化","ball of mud","软件熵"],'requiredInputs':["架构改进目标"],'missingInputQuestions':["你最想改善架构的哪个方面？"],'recommendedModelKind':'','defaultParams':{},'commands':['graph.getCanvasSummary',"node.getSummary"]};
const mpPrototypeSkill = {'schemaVersion':0x1,'id':'mp-prototype','title':"Prototype（原型验证）",'riskLevel':'confirm','category':"engineering",'appliesWhen':['原型验证',"throwaway prototype","技术方案验证","可行性验证","UI 原型","逻辑原型"],'requiredInputs':["要验证的想法"],'missingInputQuestions':['你想验证什么想法或设计？'],'recommendedModelKind':'','defaultParams':{},'commands':["node.create",'node.setPrompt','node.setParams',"generation.run"]};
const mpSetupSkillsSkill = {'schemaVersion':0x1,'id':"mp-setup-matt-pocock-skills",'title':"Setup Matt Pocock Skills（技能配置）",'riskLevel':"safe",'category':'engineering','appliesWhen':['配置\x20skills',"初始化 agent","issue tracker 配置","triage labels","domain docs","首次使用"],'requiredInputs':[],'missingInputQuestions':[],'recommendedModelKind':'','defaultParams':{},'commands':[]};
const mpTddSkill = {'schemaVersion':0x1,'id':"mp-tdd",'title':"TDD（测试驱动开发）",'riskLevel':"confirm",'category':'engineering','appliesWhen':["TDD","测试驱动开发","red-green-refactor",'test-first','vertical\x20slices',"集成测试"],'requiredInputs':["要开发的功能或 bug"],'missingInputQuestions':['你想开发什么功能或修复什么\x20bug？'],'recommendedModelKind':'','defaultParams':{},'commands':['graph.getCanvasSummary',"node.getSummary"]};
const mpToIssuesSkill = {'schemaVersion':0x1,'id':"mp-to-issues",'title':'To\x20Issues（拆分为任务）','riskLevel':"confirm",'category':"engineering",'appliesWhen':["拆分任务","创建 issues","vertical slices",'任务分解',"PRD 拆分","issue tracker"],'requiredInputs':['要拆分的计划'],'missingInputQuestions':["你想拆分什么计划或需求？"],'recommendedModelKind':'','defaultParams':{},'commands':["graph.getCanvasSummary"]};
const mpToPrdSkill = {'schemaVersion':0x1,'id':'mp-to-prd','title':'To\x20PRD（生成产品需求文档）','riskLevel':"safe",'category':"engineering",'appliesWhen':["生成 PRD","产品需求文档","整理需求",'需求文档',"PRD 模板","发布需求"],'requiredInputs':['需求描述'],'missingInputQuestions':["这个 PRD 要解决什么问题？"],'recommendedModelKind':'','defaultParams':{},'commands':[]};
const mpTriageSkill = {'schemaVersion':0x1,'id':'mp-triage','title':"Triage（任务分诊）",'riskLevel':'confirm','category':'engineering','appliesWhen':["任务分诊","issue triage","状态管理","打标签","分类 issues",'needs-triage'],'requiredInputs':["要分诊的 issues"],'missingInputQuestions':["有哪些 issues 需要分诊？"],'recommendedModelKind':'','defaultParams':{},'commands':[]};
const mpZoomOutSkill = {'schemaVersion':0x1,'id':'mp-zoom-out','title':"Zoom Out（宏观视角）",'riskLevel':'safe','category':'engineering','appliesWhen':['宏观视角','整体了解',"架构概览","zoom out","高层设计","模块关系"],'requiredInputs':["要了解的代码区域"],'missingInputQuestions':["你想了解哪个模块或代码区域？"],'recommendedModelKind':'','defaultParams':{},'commands':["graph.getCanvasSummary",'viewport.fitAll']};
const mpCavemanSkill = {'schemaVersion':0x1,'id':"mp-caveman",'title':"Caveman（极简沟通）",'riskLevel':"safe",'category':"productivity",'appliesWhen':['极简回复',"节省 token",'caveman\x20mode',"精简沟通","高效回复","不要废话"],'requiredInputs':[],'missingInputQuestions':[],'recommendedModelKind':'','defaultParams':{'persistent':!![]},'commands':[]};
const mpGrillMeSkill = {'schemaVersion':0x1,'id':"mp-grill-me",'title':"Grill Me（深度拷问）",'riskLevel':"safe",'category':"productivity",'appliesWhen':['深度讨论',"提问引导","理清思路","interview","决策树",'grill\x20me'],'requiredInputs':["要讨论的话题"],'missingInputQuestions':['你想深入讨论什么话题？'],'recommendedModelKind':'','defaultParams':{},'commands':[]};
const mpHandoffSkill = {'schemaVersion':0x1,'id':"mp-handoff",'title':"Handoff（交接文档）",'riskLevel':'safe','category':"productivity",'appliesWhen':["工作交接","handoff document","上下文传递","交接文档","继续工作","任务交接"],'requiredInputs':["交接上下文"],'missingInputQuestions':['当前工作进展到哪一步了？'],'recommendedModelKind':'','defaultParams':{},'commands':["graph.getCanvasSummary","graph.getSelection"]};
const mpTeachSkill = {'schemaVersion':0x1,'id':'mp-teach','title':'Teach（教学模式）','riskLevel':'safe','category':"productivity",'appliesWhen':['学习','教学','教程','指导',"teach","lesson","tutorial","概念讲解"],'requiredInputs':["学习主题"],'missingInputQuestions':['你想学习什么主题或技能？'],'recommendedModelKind':'','defaultParams':{},'commands':[]};
const mpWriteASkillSkill = {'schemaVersion':0x1,'id':'mp-write-a-skill','title':"Write a Skill（创建技能）",'riskLevel':"safe",'category':"productivity",'appliesWhen':["创建 skill",'编写\x20SKILL.md',"agent skill",'新技能','progressive\x20disclosure',"bundled resources"],'requiredInputs':["新 skill 的想法"],'missingInputQuestions':["这个 skill 要解决什么问题？"],'recommendedModelKind':'','defaultParams':{},'commands':[]};
const mpGitGuardrailsSkill = {'schemaVersion':0x1,'id':"mp-git-guardrails",'title':"Git Guardrails（Git 安全防护）",'riskLevel':"confirm",'category':'misc','appliesWhen':['git\x20安全',"git hooks","危险操作防护",'git\x20guardrails','防止误操作',"reset --hard"],'requiredInputs':[],'missingInputQuestions':[],'recommendedModelKind':'','defaultParams':{},'commands':[]};
const mpMigrateToShoehornSkill = {'schemaVersion':0x1,'id':"mp-migrate-to-shoehorn",'title':"Migrate to Shoehorn（类型迁移）",'riskLevel':"confirm",'category':"misc",'appliesWhen':['shoehorn\x20迁移',"类型断言迁移","测试类型安全","@total-typescript/shoehorn","as type assertion"],'requiredInputs':["要迁移的测试文件"],'missingInputQuestions':['哪些测试文件需要迁移？'],'recommendedModelKind':'','defaultParams':{},'commands':[]};
const mpScaffoldExercisesSkill = {'schemaVersion':0x1,'id':"mp-scaffold-exercises",'title':"Scaffold Exercises（练习脚手架）",'riskLevel':"safe",'category':"misc",'appliesWhen':["练习脚手架","exercise structure","problems solutions","教程结构",'scaffold\x20exercises'],'requiredInputs':["练习主题"],'missingInputQuestions':["练习的主题是什么？"],'recommendedModelKind':'','defaultParams':{},'commands':[]};
const mpSetupPreCommitSkill = {'schemaVersion':0x1,'id':"mp-setup-pre-commit",'title':"Setup Pre-commit（预提交配置）",'riskLevel':"confirm",'category':"misc",'appliesWhen':['pre-commit','Husky',"lint-staged","git hooks","提交前检查","prettier typecheck"],'requiredInputs':[],'missingInputQuestions':[],'recommendedModelKind':'','defaultParams':{},'commands':[]};

const CANVAS_AGENT_SKILLS = Object["freeze"]([textToImageSkill,textToVideoSkill,imageToVideoSkill,batchLayoutSkill,workflowOrganizeSkill,mediaProcessingSkill,storyboardAssemblySkill,taskManagementSkill,sceneDirectorSkill]);
const ENGINEERING_AGENT_SKILLS = Object["freeze"]([mpDiagnoseSkill,mpGrillWithDocsSkill,mpImproveArchitectureSkill,mpPrototypeSkill,mpSetupSkillsSkill,mpTddSkill,mpToIssuesSkill,mpToPrdSkill,mpTriageSkill,mpZoomOutSkill,mpCavemanSkill,mpGrillMeSkill,mpHandoffSkill,mpTeachSkill,mpWriteASkillSkill,mpGitGuardrailsSkill,mpMigrateToShoehornSkill,mpScaffoldExercisesSkill,mpSetupPreCommitSkill]);
const SKILL_PATTERNS = Object["freeze"]({'story-writing':Object['freeze']([/(?:写|创作|生成|续写|改写|扩写).{0,24}(?:故事|小说|剧情|章节)|剧情走向|互动故事|\b(?:write|create|continue|rewrite)\b.{0,32}\b(?:story|stories|novel|chapter)\b/i]),'text-to-image':Object["freeze"]([/(?:\btext[- ]to[- ]image\b|\b(?:create|generate|make)\b.{0,32}\b(?:image|picture|photo|poster|thumbnail|illustration)\b|\b(?:draw|paint|illustrate)\b)/i,/(?:文生图|文字生成图片|产品图|商品图|效果图|概念图|创建.{0,10}(?:图片|图像|海报|封面)|生成.{0,10}(?:图片|图像|海报|封面)|绘制|作图|帮我画|请(?:帮我)?画|画(?:一|个|张|幅|只)|做.{0,8}(?:张|个)?(?:图片|图像|海报|封面))/]),'text-to-video':Object['freeze']([/\b(?:text[- ]to[- ]video|create|generate|make)\b.{0,32}\b(?:video|movie|film|animation|clip)\b/i,/(?:文生视频|文字生成视频|创建.{0,10}视频|生成.{0,10}视频|做.{0,8}(?:段|个|条)?视频)/]),'image-to-video':Object["freeze"]([/\b(?:image[- ]to[- ]video|animate (?:this |the )?image|video from (?:this |the |an )?image)\b/i,/\bimage\b.{0,24}\b(?:make|create|generate)\b.{0,16}\bvideo\b/i,/\b(?:make|create|generate)\b.{0,16}\bvideo\b.{0,24}\b(?:from|using)\b.{0,8}\bimage\b/i,/(?:图生视频|图片.{0,10}(?:生成|制作|做成|变成).{0,6}视频|把.{0,8}(?:图片|图像).{0,8}(?:做成|变成).{0,4}视频)/]),'batch-layout':Object["freeze"]([/\b(?:align|distribute|arrange|layout|row|column|grid|horizontal|vertical)\b/i,/(?:对齐|分布|排列|布局|横排|横向|竖排|纵向|网格|间距)/]),'workflow-organize':Object["freeze"]([/\b(?:organize|tidy|clean up|summarize|label)\b.{0,24}\b(?:canvas|workflow|nodes?)\b/i,/(?:整理|收拾|梳理|总结|标注).{0,12}(?:画布|工作流|节点)/]),'media-processing':Object["freeze"]([/\b(?:reverse|extract keyframes?|separate|split grid|reset size|audio stems?)\b/i,/(?:倒放|反转视频|关键帧|抽帧|分离音视频|分离人声|音轨分离|拆分宫格|切宫格|重置尺寸)/]),'storyboard-assembly':Object["freeze"]([/\b(?:storyboard|shot board|contact sheet)\b/i,/(?:分镜板|故事板|镜头板|分镜网格)/]),'task-management':Object["freeze"]([/\b(?:retry|cancel|resume|focus)\b.{0,20}\b(?:task|job|generation|result)\b/i,/(?:重试|取消|恢复|聚焦|定位).{0,12}(?:任务|生成|结果)/]),'scene-director':Object['freeze']([/\b(?:3d|stage|scene|mannequin|pose|camera keyframe|camera timeline)\b/i,/(?:3D|三维|舞台|场景|人体模型|姿势|相机关键帧|相机时间线|镜头轨迹)/i])});

function listBuiltInAgentSkills(){return AGENT_SKILL_ALLOWLIST["map"](normalizeSkill)["filter"](_0x3b9dc2=>_0x3b9dc2['id']);}

function escapeSkillReference(_0x5a5788=''){return String(_0x5a5788||'')["replace"](/[.*+?^${}()|[\]\\]/g,"\\$&");}

function containsSkillReference(_0xabfe48,_0x2099d4,{prefixed:prefixed=![]}={}){const _0x3601c4=String(_0xabfe48||'')["trim"](),_0x22d74c=String(_0x2099d4||'')['trim']();if(!_0x3601c4||!_0x22d74c)return![];if(/[^\x00-\x7f]/u["test"](_0x22d74c)&&!prefixed)return _0x3601c4["toLowerCase"]()["includes"](_0x22d74c['toLowerCase']());const _0x3f3cc6=escapeSkillReference(_0x22d74c),_0x5ee6d2=prefixed?'[$/]'+_0x3f3cc6+"(?=$|[^\\p{L}\\p{N}_-])":'(?:^|[^\x5cp{L}\x5cp{N}_-])'+_0x3f3cc6+"(?=$|[^\\p{L}\\p{N}_-])";return new RegExp(_0x5ee6d2,'iu')["test"](_0x3601c4);}

function isExplicitSkillRequest(_0x585001,_0x2ae905={}){const _0x111dcb=String(_0x2ae905['id']||'')["trim"](),_0x2ae132=String(_0x2ae905["title"]||'')["trim"]();return Boolean(_0x111dcb&&containsSkillReference(_0x585001,_0x111dcb,{'prefixed':!![]})||_0x111dcb&&containsSkillReference(_0x585001,_0x111dcb)||_0x2ae132&&containsSkillReference(_0x585001,_0x2ae132));}

function scoreSkill(_0x5b8f57,{userMessage:userMessage='',targetKind:targetKind='',selectedInputKinds:selectedInputKinds=[]}={}){const _0x978331=String(userMessage||'')["trim"](),_0x4b8dcf=isExplicitSkillRequest(_0x978331,_0x5b8f57);if(_0x5b8f57['id']["startsWith"]("mp-")&&!_0x4b8dcf)return 0x0;let _0xb67b6c=_0x4b8dcf?0x3e8:0x0;for(const _0xe0858f of SKILL_PATTERNS[_0x5b8f57['id']]||[]){if(_0xe0858f["test"](_0x978331))_0xb67b6c+=0xc8;}_0xb67b6c>0x0&&targetKind&&_0x5b8f57['recommendedModelKind']===targetKind&&(_0xb67b6c+=0x28);const _0x229a26=new Set((Array["isArray"](selectedInputKinds)?selectedInputKinds:[])["map"](_0x5302dc=>String(_0x5302dc||'')["trim"]())["filter"](Boolean));return _0xb67b6c>0x0&&_0x5b8f57['id']==="image-to-video"&&targetKind==='video'&&_0x229a26["has"]("image")&&(_0xb67b6c+=0x104),_0x5b8f57['id']==="text-to-video"&&targetKind==='video'&&_0x229a26['has']("image")&&(_0xb67b6c-=0x78),_0x5b8f57['id']==="text-to-video"&&!_0x4b8dcf&&/(?:\bimage\b.{0,24}\bvideo\b|\bvideo\b.{0,24}\bimage\b|图生视频|图片.{0,16}视频|图像.{0,16}视频)/i["test"](_0x978331)&&(_0xb67b6c=0x0),Math["max"](0x0,_0xb67b6c);}

export function createAgentSkillRegistry({packages:packages=[]}={}){const _0x5e9200=createAgentSkillRegistryCore({'builtInSkills':listBuiltInAgentSkills(),'scoreBuiltInSkill':scoreSkill});return Array["isArray"](packages)&&packages["length"]>0x0&&_0x5e9200["replaceInstalledPackages"](packages),_0x5e9200;}

export const defaultAgentSkillRegistry=createAgentSkillRegistry();

export function listAgentSkillCatalog({registry:registry=defaultAgentSkillRegistry}={}){return registry['listCatalog']();}

export function selectAgentSkills({userMessage:userMessage='',targetKind:targetKind='',selectedInputKinds:selectedInputKinds=[],selectedSkillIds:selectedSkillIds=[],maxSkills:maxSkills=0x2,registry:registry=defaultAgentSkillRegistry}={}){const _0x4e1fe1=Number(maxSkills),_0x10393a=Math["max"](0x0,Number["isFinite"](_0x4e1fe1)?Math['trunc'](_0x4e1fe1):0x2),_0x24a4d9=[...new Set((Array["isArray"](selectedSkillIds)?selectedSkillIds:[])["map"](_0xb76a3c=>String(_0xb76a3c||'')["trim"]()["toLowerCase"]())['filter'](Boolean))],_0x363284=(registry["listSkills"]?.()||[])["filter"](_0x38d3ad=>_0x38d3ad["enabled"]!==![]&&_0x24a4d9["includes"](_0x38d3ad['id']))["sort"]((_0x479ce0,_0x1fe36f)=>_0x24a4d9["indexOf"](_0x479ce0['id'])-_0x24a4d9["indexOf"](_0x1fe36f['id']))["slice"](0x0,_0x10393a),_0x11c93b=new Set(_0x363284["map"](_0x42ca47=>_0x42ca47['id'])),_0x3d2a2f=registry['select']({'userMessage':userMessage,'targetKind':targetKind,'selectedInputKinds':selectedInputKinds,'maxSkills':Math['max'](0x0,_0x10393a-_0x363284['length'])});return[..._0x363284,..._0x3d2a2f["filter"](_0x44b5b9=>!_0x11c93b["has"](_0x44b5b9['id']))]["slice"](0x0,_0x10393a);}

export const agentSkillCatalogInternals=Object["freeze"]({'scoreSkill':scoreSkill,'isExplicitSkillRequest':isExplicitSkillRequest,'CANVAS_AGENT_SKILLS':CANVAS_AGENT_SKILLS,'ENGINEERING_AGENT_SKILLS':ENGINEERING_AGENT_SKILLS,'listBuiltInAgentSkills':listBuiltInAgentSkills});
