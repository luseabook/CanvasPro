// Cancellation of a view must not release an in-flight paid request.
export function createStoryAiRequestGate(execute) {
  let pending = false;
  return {
    isPending() { return pending; },
    async run(payload) {
      if (pending) throw new Error('前一个工作室 AI 请求仍未结束，请等待后再试；不会重复发送');
      pending = true;
      try { return await execute(payload); }
      finally { pending = false; }
    },
  };
}
