export function normalizeRunningHubReferenceMediaUrls(value) {
  const list = [];
  return (
    (Array['isArray'](value) ? value : [])['forEach']((item) => {
      const key = String(item || '')['trim']();
      if (key && !list['includes'](key)) list['push'](key);
    }),
    list
  );
}
function normalizeCount(index, result = 0) {
  const data = Number(index);
  return Number['isFinite'](data)
    ? Math['max'](0, Math['trunc'](data))
    : Math['max'](0, Math['trunc'](Number(result) || 0));
}
function normalizeReferenceMediaSpec(args = {}, options = {}) {
  const loaderNodes = Array['isArray'](args['loaderNodes']) ? args['loaderNodes'] : [],
    slotCount = normalizeCount(args['slotCount'], loaderNodes['length']),
    maxCount = normalizeCount(args['maxCount'], slotCount),
    minCount = normalizeCount(args['minCount'], 0),
    payloadField = String(args['payloadField'] || '')['trim'](),
    referenceFieldPrefixes = (
      Array['isArray'](args['referenceFieldPrefixes'])
        ? args['referenceFieldPrefixes']
        : [args['referenceFieldPrefix']]
    )
      ['map']((target) => String(target || '')['trim']())
      ['filter'](Boolean);
  return {
    ...args,
    kind: String(args['kind'] || '')['trim'](),
    loaderNodes: loaderNodes,
    maxCount: maxCount,
    minCount: minCount,
    payloadField: payloadField,
    referenceFieldPrefixes: referenceFieldPrefixes,
    referenceNodeId: String(args['referenceNodeId'] || '')['trim'](),
    slotCount: slotCount,
    urls: normalizeRunningHubReferenceMediaUrls(options[payloadField]),
  };
}
function assertReferenceMediaSpec(enabled) {
  if (enabled['minCount'] > enabled['maxCount'] || enabled['slotCount'] < enabled['maxCount'])
    throw new Error(
      enabled['mappingMissingMessage'] ||
        'RunningHub ' + (enabled['kind'] || 'media') + ' reference mapping is incomplete',
    );
  const enabled2 = enabled['loaderNodes']
    ['slice'](0, enabled['maxCount'])
    ['every']((source) => source?.['nodeId'] && source?.['fieldName']);
  if (!enabled2)
    throw new Error(
      enabled['mappingMissingMessage'] ||
        'RunningHub ' + (enabled['kind'] || 'media') + ' loader mapping is incomplete',
    );
  if (
    enabled['slotCount'] > 0 &&
    (!enabled['referenceNodeId'] || enabled['referenceFieldPrefixes']['length'] === 0)
  )
    throw new Error(
      enabled['mappingMissingMessage'] ||
        'RunningHub ' + (enabled['kind'] || 'media') + ' reference mapping is incomplete',
    );
  if (enabled['urls']['length'] > enabled['maxCount'])
    throw new Error(
      enabled['maxCountMessage'] ||
        'RunningHub ' + (enabled['kind'] || 'media') + ' references exceed ' + enabled['maxCount'],
    );
  if (enabled['urls']['length'] < enabled['minCount'])
    throw new Error(
      enabled['minCountMessage'] ||
        'RunningHub ' + (enabled['kind'] || 'media') + ' references require ' + enabled['minCount'],
    );
}
function assertUploadedReferenceMedia(next, current) {
  const list2 = Array['isArray'](current) ? current : [];
  if (list2['length'] !== next['urls']['length'] || list2['some']((entry) => !String(entry || '')['trim']()))
    throw new Error(
      (next['uploadFailedMessage'] || 'RunningHUB 参考素材上传失败') +
        '：预期 ' +
        next['urls']['length'] +
        ' 项，返回 ' +
        list2['filter']((record) => String(record || '')['trim']())['length'] +
        ' 项有效地址，请重试',
    );
  return list2;
}
export async function appendRunningHubReferenceMediaInputs({
  payload: payload = {},
  specs: specs = [],
  requiredTotal: requiredTotal = 0,
  requiredTotalMessage: requiredTotalMessage = '',
  apiKey: apiKey,
  ctx: ctx,
  helpers: helpers,
  nodeInfoList: nodeInfoList,
}) {
  const list3 = (Array['isArray'](specs) ? specs : [])['map']((handle) =>
    normalizeReferenceMediaSpec(handle, payload),
  );
  list3['forEach'](assertReferenceMediaSpec);
  const state = list3['reduce']((config, scope) => config + scope['urls']['length'], 0);
  if (state < normalizeCount(requiredTotal, 0))
    throw new Error(requiredTotalMessage || 'RunningHub 工作流缺少参考素材');
  const uploadedCount = await Promise['all'](
    list3['map'](async (uploadFailedMessage) =>
      assertUploadedReferenceMedia(
        uploadFailedMessage,
        await helpers['uploadRunningHubMediaInputs'](
          uploadFailedMessage['kind'],
          uploadFailedMessage['urls'],
          payload,
          apiKey,
          ctx,
          { uploadFailedMessage: uploadFailedMessage['uploadFailedMessage'] },
        ),
      ),
    ),
  );
  return (
    list3['forEach']((input, output) => {
      const list4 = uploadedCount[output];
      list4['forEach']((value2, value3) => {
        helpers['pushManifestNode'](nodeInfoList, input['loaderNodes'][value3], value2);
      });
    }),
    list3['forEach']((nodeId, value4) => {
      const value5 = uploadedCount[value4]['length'];
      nodeId['referenceFieldPrefixes']['forEach']((value6) => {
        for (let value7 = value5; value7 < nodeId['slotCount']; value7 += 1) {
          helpers['pushManifestNode'](
            nodeInfoList,
            { nodeId: nodeId['referenceNodeId'], fieldName: '' + value6 + value7 },
            null,
          );
        }
      });
    }),
    Object['fromEntries'](
      list3['map']((inputCount, value8) => [
        inputCount['kind'],
        Object['freeze']({
          inputCount: inputCount['urls']['length'],
          uploadedCount: uploadedCount[value8]['length'],
        }),
      ]),
    )
  );
}
