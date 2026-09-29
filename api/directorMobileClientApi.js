export async function publishDirectorMobilePose(_0x429fb8, _0x37c914) {
  const _0x2ef130 = await fetch('/pose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Director-Token': _0x429fb8 },
    body: JSON['stringify'](_0x37c914),
  });
  if (!_0x2ef130['ok'])
    throw new Error(
      _0x2ef130['status'] === 0x193 ? '配对已结束，请在电脑上重新开启。' : '发送摄像机数据失败。',
    );
}
