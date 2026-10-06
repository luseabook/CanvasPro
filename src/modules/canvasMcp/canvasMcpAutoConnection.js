export function createCanvasMcpAutoConnection({
  createSession: createSession,
  getBinding: getBinding,
  isReady: isReady,
  onChange: onChange = () => {},
  schedule: schedule = setTimeout,
  cancel: cancel = clearTimeout,
  allowGeneration = false,
}) {
  let enabled = false,
    enabled2 = false,
    allowGeneration2 = allowGeneration === true,
    value = '',
    item = false,
    args = { enabled: false },
    schedule2;
  let backendUnavailable = false;
  const run = () => onChange({ ...args, allowGeneration: allowGeneration2 }),
    key = createSession((index) => {
      ((args = index), run());
    });
  function run2(result) {
    cancel(schedule2);
    if (!enabled && !backendUnavailable)
      schedule2 = schedule(() => {
        void run3();
      }, result);
  }
  async function run3() {
    if (enabled || backendUnavailable) return;
    key.checkBinding();
    if (enabled2) {
      run2(1000);
      return;
    }
    const enabled3 = isReady() ? getBinding() : '';
    if (!enabled3) {
      if (args.enabled) await key.disable();
      run2(1000);
      return;
    }
    if (args.enabled && value === enabled3 && item === allowGeneration2) {
      run2(1000);
      return;
    }
    enabled2 = true;
    const allowGeneration3 = allowGeneration2;
    let data = 1000;
    try {
      const options = await key.enable({ allowGeneration: allowGeneration3 });
      options && ((value = enabled3), (item = allowGeneration3));
    } catch (reason) {
      const status = Number(reason?.status || reason?.statusCode);
      backendUnavailable = [401, 403, 404, 405, 501].includes(status) || reason?.code === 'UNSUPPORTED';
      ((args = { enabled: false, reason: reason.message }), run(), (data = 5000));
    } finally {
      ((enabled2 = false), run2(data));
    }
  }
  return (
    run2(0),
    {
      refresh() {
        (key.checkBinding(), run2(0));
      },
      setAllowGeneration(target) {
        ((allowGeneration2 = target === true), void key.disable(), run2(0));
      },
      async destroy() {
        ((enabled = true), cancel(schedule2), await key.destroy());
      },
    }
  );
}
