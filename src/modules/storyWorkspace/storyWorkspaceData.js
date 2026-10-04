const STORY_SUMMARY =
    '陈木在晚自习时突然醒来，意识到自己重生回到了诡异末世降临一个月前。前世，他因为轻信同伴而错过进入冥府银行的机会；这一次，他决定提前拿到第一批诡异冥币，并在午夜食堂开启前组建自己的小队。随着血红任务书出现，教室里的同学被迫遵守新的生存规则，陈木也发现这场重生并不是偶然。',
  PLOT_SCRIPT =
    '《重生者的诡异任务》\n\n夜晚九点，教室灯火通明，窗外却像被墨汁吞没。\n\n陈木猛地睁开双眼。讲台上的倒计时只剩四十分钟，他认出这是诡异末世降临前的第五年——也是一切尚未发生的一个月前。\n\n班主任照常批改试卷，同桌正偷偷刷手机。陈木压住呼吸，确认口袋里那枚前世从未拿到的冥府银行凭证仍然存在。\n\n午夜十二点的钟声提前响起，一张带着血迹的任务书落在每个人桌上：前往午夜食堂，完成值夜任务。\n\n同学们惊慌失措，陈木却第一个站起身。他知道，真正的危险不是食堂里的诡异，而是队伍中那个会在第三条规则出现后背叛所有人的人。',
  NARRATION_SCRIPT =
    '夜晚九点，陈木在熟悉的教室里醒来。\x0a\x0a他很快意识到，自己回到了诡异末世降临前的一个月。上一世的遗憾、背叛和死亡仍然清晰，而这一世，他终于有机会提前改变命运。\x0a\x0a当午夜钟声响起，血红色任务书出现在每个人桌上。教室不再安全，所有人都必须前往午夜食堂。\x0a\x0a别人只看见未知的恐惧，陈木却知道那里藏着第一笔足以改变未来的诡异冥币。',
  DEMO_ASSETS = Object['freeze']([
    {
      id: 'character-chen-mu',
      kind: 'character',
      name: '陈木',
      role: '主角',
      occurrences: '第 1、2、3 集',
      description: '十八岁高中生，重生者。外表冷静克制，观察力强，对即将发生的规则危机有清晰记忆。',
      prompt:
        '十八岁东亚男性高中生，短黑发，清瘦但有力量感，深色校服外套，冷静警觉的眼神，全身角色设定照，真人写实，纯色背景',
      imageUrl: '',
      appearances: [
        {
          id: 'character-chen-mu-normal',
          name: '正常状态',
          occurrences: '第一幕 · 晚自习',
          prompt:
            '十八岁高中生，重生者，短黑发，清瘦但有力量感，深色校服外套，冷静警觉的眼神，正常状态，全身角色设定照，真人写实，纯色背景',
          imageUrl: '',
        },
        {
          id: 'character-chen-mu-injured',
          name: '受伤状态',
          occurrences: '第二幕 · 午夜食堂',
          prompt:
            '十八岁高中生，短黑发，深色校服撕裂并沾有灰尘，额角与左臂受伤，仍保持警觉，全身角色设定照，真人写实，纯色背景',
          imageUrl: '',
        },
      ],
    },
    {
      id: 'character-teacher',
      kind: 'character',
      name: '班主任',
      role: '重要角色',
      occurrences: '第 1、2 集',
      description: '四十多岁的班主任，表面严肃克制，面对异常事件时仍努力维持课堂秩序。',
      prompt:
        '四十五岁东亚男性教师，灰蓝衬衫，黑框眼镜，疲惫而严肃，坐姿全身角色设定照，真人写实，白色摄影棚背景',
      imageUrl: '',
    },
    {
      id: 'character-desk-mate',
      kind: 'character',
      name: '林野',
      role: '同伴',
      occurrences: '第 1、3 集',
      description: '陈木的同桌，性格开朗，喜欢用玩笑掩饰恐惧，是最早相信陈木的人。',
      prompt:
        '十八岁东亚男性高中生，略长碎发，白色校服衬衫，少年感，紧张却故作轻松，全身角色设定照，真人写实',
      imageUrl: '',
    },
    {
      id: 'character-manager',
      kind: 'character',
      name: '食堂经理',
      role: '对立角色',
      occurrences: '第\x202、3\x20集',
      description: '午夜食堂的管理者，礼貌、克制，却始终保持不自然的微笑。',
      prompt: '三十五岁东亚女性，暗红色制服，盘发，苍白皮肤，礼貌但令人不安的微笑，全身角色设定照，电影写实',
      imageUrl: '',
    },
    {
      id: 'scene-classroom',
      kind: 'scene',
      name: '高三晚自习教室',
      role: '主场景',
      occurrences: '第 1 集',
      description: '老旧教学楼三层，冷白灯光与窗外漆黑形成强烈反差，黑板上写着高考倒计时。',
      prompt:
        '中国高中晚自习教室，冷白荧光灯，整齐课桌，黑板高考倒计时，窗外完全漆黑，冷色电影光影，16:9，无人场景',
      imageUrl: '',
    },
    {
      id: 'scene-canteen',
      kind: 'scene',
      name: '午夜食堂',
      role: '核心场景',
      occurrences: '第 2、3 集',
      description: '空旷学校食堂，红色应急灯与不锈钢窗口构成压迫感，规则牌挂在入口处。',
      prompt:
        '深夜学校食堂，红色应急灯，不锈钢打饭窗口，入口悬挂规则牌，潮湿地面反光，恐怖电影氛围，16:9，无人场景',
      imageUrl: '',
    },
    {
      id: 'scene-bank',
      kind: 'scene',
      name: '冥府银行',
      role: '伏笔场景',
      occurrences: '第\x203\x20集',
      description: '隐藏在旧城区地下的诡异银行，铜制柜台和墨绿色灯光带有上世纪质感。',
      prompt:
        '地下诡异银行大厅，旧铜柜台，墨绿色台灯，墙上密集保险柜，复古东方恐怖，电影写实，广角镜头，16:9',
      imageUrl: '',
    },
  ]),
  EPISODES = Object['freeze']([
    {
      id: 'episode-1',
      number: 0x1,
      title: '重生者的诡异任务',
      status: '待生成',
      characterCount: 0x3,
      sceneCount: 0x1,
      clipCount: 0x6,
      duration: '00:28',
      coverUrl: '',
      clips: [
        {
          id: 'episode-1-clip-1',
          number: 0x1,
          duration: '4.0s',
          title: '异常醒来',
          prompt:
            '夜晚，高三晚自习教室。镜头从窗外漆黑缓慢推进，穿过玻璃停在趴桌的陈木身上。陈木突然睁开双眼，呼吸急促，随后强迫自己保持安静。冷白灯光，真人写实，电影级冷色调。',
        },
        {
          id: 'episode-1-clip-2',
          number: 0x2,
          duration: '4.0s',
          title: '确认时间',
          prompt:
            '陈木低头看手机日期，又抬头看向黑板上的高考倒计时。镜头在手机、黑板与他的眼神之间快速切换，表现他确认重生事实后的震惊和克制。',
        },
        {
          id: 'episode-1-clip-3',
          number: 0x3,
          duration: '5.0s',
          title: '观察同学',
          prompt:
            '陈木环顾教室，同桌在偷看手机，班主任低头批卷，其他学生安静自习。镜头缓慢横移，所有人看似正常，窗外却没有任何城市灯光。',
        },
        {
          id: 'episode-1-clip-4',
          number: 0x4,
          duration: '5.0s',
          title: '凭证出现',
          prompt:
            '陈木把手伸进口袋，摸到一枚冰冷的黑色金属凭证。特写凭证上的冥府银行纹样，他的手指微微发抖，随后迅速将凭证藏回去。',
        },
        {
          id: 'episode-1-clip-5',
          number: 0x5,
          duration: '5.0s',
          title: '钟声提前',
          prompt:
            '教室墙上的时钟突然跳到午夜十二点，沉重钟声响起，所有灯光闪烁。学生们同时抬头，教室气氛从平静骤然变得压抑。',
        },
        {
          id: 'episode-1-clip-6',
          number: 0x6,
          duration: '5.0s',
          title: '血色任务书',
          prompt:
            '一张带着暗红血迹的任务书凭空落在陈木桌面。镜头贴近纸面，文字逐行浮现：前往午夜食堂。陈木抬眼，神情从震惊变成坚定。',
        },
      ],
    },
    {
      id: 'episode-2',
      number: 0x2,
      title: '午夜食堂任务开启',
      status: '待拆分',
      characterCount: 0x4,
      sceneCount: 0x2,
      clipCount: 0x0,
      duration: '--:--',
      coverUrl: '',
      clips: [],
    },
    {
      id: 'episode-3',
      number: 0x3,
      title: '食堂诡异任务惊魂',
      status: '待拆分',
      characterCount: 0x4,
      sceneCount: 0x3,
      clipCount: 0x0,
      duration: '--:--',
      coverUrl: '',
      clips: [],
    },
  ]);
export const DEMO_STORY_PROJECTS = Object['freeze']([
  {
    id: 'story-demo-main',
    title: '重生者的诡异任务',
    updatedAt: '今天\x2010:32',
    episodeCount: 0x3,
    status: '制作中',
  },
  { id: 'story-demo-empty', title: '未命名故事', updatedAt: '今天 09:57', episodeCount: 0x1, status: '草稿' },
]);
export function createDemoStoryWorkspaceData() {
  return {
    project: {
      id: 'story-demo-main',
      title: '重生者的诡异任务',
      scriptMode: 'plot',
      storyType: '男频',
      videoStyleId: 'custom',
      videoStylePrompt: '真人写实 · 电影感 · 冷色调',
      customVideoStylePrompt: '真人写实 · 电影感 · 冷色调',
      videoStyle: '真人写实 · 电影感 · 冷色调',
      aspectRatio: '16:9',
      planning: { episodeCount: 0x3, sceneMaxSeconds: 0xf, promptMode: 'seedance-2.0' },
      sourceDocument: null,
      summary: STORY_SUMMARY,
      background: '诡异末世降临前一个月的现代高中校园，日常秩序正被无法解释的规则逐步侵蚀。',
      setting: '午夜后血色任务书会强制发布生存任务；完成任务可获得诡异冥币，违背规则将付出生命代价。',
      logline: '重生回末世前的高中生，必须利用前世记忆抢先完成午夜任务并改写所有人的命运。',
      sourceChapters: [{ id: 'chapter-1', title: '第一章 重生晚自习', content: PLOT_SCRIPT }],
      chapters: [{ id: 'chapter-1', title: '第一章\x20重生晚自习', content: PLOT_SCRIPT }],
      plotScript: PLOT_SCRIPT,
      narrationScript: NARRATION_SCRIPT,
    },
    assets: DEMO_ASSETS['map']((args) => ({
      ...args,
      appearances: Array['isArray'](args['appearances'])
        ? args['appearances']['map']((args2) => ({ ...args2 }))
        : undefined,
    })),
    episodes: EPISODES['map']((clips) => ({
      ...clips,
      clips: clips['clips']['map']((args3) => ({ ...args3 })),
    })),
  };
}
