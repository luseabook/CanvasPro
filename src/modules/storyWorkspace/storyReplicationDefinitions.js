import { getReplicationUploadedImageFinalPrompt } from './storyReplicationUploadedImageData.js';
const text = (value) => String(value || '')['trim'](),
  matches = (item, key) => Boolean(key) && [item['id'], item['ref'], item['planningRef']]['includes'](key);
export function completeReplicationScenePropUsages(list, list2) {
  const list3 = list2['filter']((index) => ['scene', 'prop']['includes'](index['kind']));
  return list['map']((args) => {
    const list4 = (args['visual'] || '') + ' ' + (args['camera'] || ''),
      assetUsages = [...(args['assetUsages'] || [])];
    for (const assetRef of list3) {
      if (assetUsages['some']((result) => matches(assetRef, result['assetRef']))) continue;
      const list5 = text(assetRef['name']),
        list6 = [list5, text(assetRef['replicationSource']?.['name'])];
      for (let count = list5['length'] - 1; count >= 2; count--) {
        const data = list5['slice'](-count);
        if (list3['filter']((error) => text(error['name'])['endsWith'](data))['length'] === 1)
          list6['push'](data);
      }
      const appearanceRef = assetRef['appearances'] || [];
      if (
        appearanceRef['length'] !== 1 ||
        !list6['some']((list7) => list7['length'] >= 2 && list4['includes'](list7))
      )
        continue;
      assetUsages['push']({
        assetRef: assetRef['planningRef'] || assetRef['ref'] || assetRef['id'],
        appearanceRef:
          appearanceRef[0]['planningRef'] || appearanceRef[0]['ref'] || appearanceRef[0]['id'],
      });
    }
    return { ...args, assetUsages: assetUsages };
  });
}
export function defineReplicationPromptMaterials(list8, list9, options, target = '') {
  const list10 = [];
  for (const error2 of options)
    for (const error3 of error2['appearances'] || []) {
      const mention = '@' + error2['name'] + ' · ' + error3['name'],
        enabled = list9['some']((source) =>
          (source['assetUsages'] || [])['some'](
            (next) => matches(error2, next['assetRef']) && matches(error3, next['appearanceRef']),
          ),
        );
      if (!enabled && !list8['includes'](mention)) continue;
      const alias =
          error2['kind'] === 'character'
            ? error2['name']
            : (error2['appearances'] || [])['length'] > 1
              ? error2['name'] + '（' + error3['name'] + '）'
              : error2['name'],
        current =
          error2['kind'] === 'character' ? '角色' : error2['kind'] === 'scene' ? '参考场景' : '参考道具',
        text2 = text(error3['description'] || error2['description'])['replace'](/[。]+$/u, ''),
        line =
          error2['kind'] === 'character'
            ? '将 ' + mention + ' 中的角色定义为' + alias + '。'
            : '将 ' + mention + ' 定义为' + alias + '的' + current + '。',
        list11 = list9['flatMap']((entry, record) =>
          (entry['assetUsages'] || [])['some'](
            (payload) => matches(error2, payload['assetRef']) && matches(error3, payload['appearanceRef']),
          )
            ? [record + 1]
            : [],
        ),
        handle =
          error2['kind'] === 'character' && error2['appearances']['length'] > 1 && list11['length']
            ? '用于第' + list11['join']('、') + '个镜头。'
            : '';
      list10['push']({
        mention: mention,
        alias: alias,
        line: line + handle + (error2['kind'] !== 'character' && text2 ? '外观与状态：' + text2 + '。' : ''),
      });
    }
  const list12 = [...list10]['sort'](
      (state, config) => config['mention']['length'] - state['mention']['length'],
    ),
    scope = list8['split']('\n')
      ['map']((input) =>
        input['startsWith']('画面文字：')
          ? input
          : input['split'](/(“[^”]*”)/u)
              ['map']((output, value2) =>
                value2 % 2
                  ? output
                  : list12['reduce'](
                      (value3, value4) => value3['split'](value4['mention'])['join'](value4['alias']),
                      output,
                    ),
              )
              ['join'](''),
      )
      ['join']('\n'),
    value5 =
      '按下方分镜描述呈现画面、镜头和声音；人物参考图确定外观，人物位置与持物按具体站位和动作呈现。片段结束站位是已有动作的结果，不额外定格或延长时间；不添加未描述的画面文字或背景音乐。';
  return [
    '【统一风格与约束】',
    ...(text(target) ? [text(target)] : []),
    value5,
    '',
    '【参考素材】',
    ...list10['map']((value6) => value6['line']),
    '',
    '【分镜与声音】',
    scope,
  ]['join']('\n');
}

export function collectReplicationPromptMaterialEntries(enabled5,value12,value13){const value14=[];for(const error of value13)for(const error2 of error["appearances"]||[]){const value15='@'+error["name"]+'\x20·\x20'+error2["name"],enabled6=value12["some"](value16=>(value16["assetUsages"]||[])["some"](value17=>matches(error,value17["assetRef"])&&matches(error2,value17["appearanceRef"])));if(!enabled6&&!enabled5["includes"](value15))continue;const value18=error["kind"]==="character"?error["name"]:(error["appearances"]||[])["length"]>0x1?error["name"]+'（'+error2['name']+'）':error['name'],value19=error["kind"]==='character'?'角色':error["kind"]==="scene"?"参考场景":"参考道具",replicationUploadedImageFinalPrompt=getReplicationUploadedImageFinalPrompt(error,error2),text4=text(replicationUploadedImageFinalPrompt||(error2["sourceOrigin"]==='upload'&&error2["imageOrigin"]!=='generated'&&['character',"scene"]["includes"](error["kind"])?error2['description']:error["kind"]!=="character"&&error['appearances']["length"]===0x1?error["description"]||error2['description']:error2['description']||error['description']))["replace"](/[。]+$/u,''),value20=error["kind"]==="character"?'将\x20'+value15+'\x20中的角色定义为剧中的'+value18+'。':'将\x20'+value15+" 定义为"+value18+'的'+value19+'。',value21=value12["flatMap"]((value22,value23)=>(value22["assetUsages"]||[])["some"](value24=>matches(error,value24["assetRef"])&&matches(error2,value24["appearanceRef"]))?[value23+0x1]:[]),value25=error["kind"]==="character"&&error["appearances"]["length"]>0x1&&value21["length"]?"用于第"+value21["join"]('、')+"个镜头。":'';value14["push"]({'mention':value15,'alias':value18,'purpose':value19,'kind':error["kind"],'scope':value25,'description':text4,'uploadedPrompt':replicationUploadedImageFinalPrompt,'hasImage':Boolean(error2["imageUrl"]),'hasVoice':Boolean(error['voiceReference']?.["audioUrl"]||error["voiceReference"]?.["localPath"]),'line':value20+value25+(error["kind"]!=="character"&&text4?"外观与状态："+text4+'。':'')});}return value14;}
function occursInSourceShot(data,options){const enabled=/^s(\d+)$/u["exec"](text(options));if(!enabled)return false;const target=Number(enabled[0x1]);for(const source of text(data['occurrences'])['matchAll'](/\bs(\d+)(?:\s*[-–—~至]\s*s?(\d+))?/giu)){const next=Number(source[0x1]),current=source[0x2]?Number(source[0x2]):next;if(next<=target&&target<=current)return true;}return false;}
export function completeReplicationSourceFrameUsages(list5,value2,{episodeId:episodeId,sourceStartSec:sourceStartSec=0x0}={}){return list5['map'](args2=>{const value3=sourceStartSec+Number(args2["startSec"]),value4=sourceStartSec+Number(args2["endSec"]);if(!Number["isFinite"](value3)||!Number["isFinite"](value4)||value4<=value3)return args2;const value5=[...args2["assetUsages"]||[]];for(const value6 of value2){if(!['scene',"prop"]['includes'](value6['kind'])||value6["replicationSource"]?.['episodeId']!==episodeId)continue;const value7=value6['replicationSource']['representativeTimeSec'],enabled2=Number['isFinite'](value7)&&value7>=value3&&value7<value4,enabled3=value6["kind"]==="scene"&&/^(?:贯穿全片|全片所有镜头|全部镜头)(?:[，,。；;\s]|$)/u["test"](text(value6['occurrences']))&&value2["filter"](value8=>value8["kind"]==="scene"&&value8['replicationSource']?.["episodeId"]===episodeId)["length"]===0x1;if(!enabled2&&!enabled3&&!occursInSourceShot(value6,args2['sourceShotId'])||value5["some"](value9=>matches(value6,value9['assetRef'])))continue;const value10=value6["appearances"]||[],list6=value10["filter"](value11=>value11["imageUrl"]),enabled4=value10["length"]===0x1?value10[0x0]:list6['length']===0x1?list6[0x0]:null;if(!enabled4)continue;value5["push"]({'assetRef':value6["planningRef"]||value6['ref']||value6['id'],'appearanceRef':enabled4["planningRef"]||enabled4["ref"]||enabled4['id']});}return{...args2,'assetUsages':value5};});}
export function briefReplicationSceneStyle(item){const text2=text(item),key=text2["match"](/(?:^|\n|[；;])\s*\d+(?:\.\d+)?\s*[-–—~至]\s*\d+(?:\.\d+)?\s*秒\s*[：:]\s*([^\n；;]+)/u);return key?text(key[0x1]):text2;}
