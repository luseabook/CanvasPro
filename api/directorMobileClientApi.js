export async function publishDirectorMobilePose(value, item) {
  const response = await fetch('/pose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Director-Token': value },
    body: JSON['stringify'](item),
  });
  if (!response['ok'])
    throw new Error(
      response['status'] === 0x193 ? '配对已结束，请在电脑上重新开启。' : '发送摄像机数据失败。',
    );
}
