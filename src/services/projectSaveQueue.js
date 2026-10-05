export function createProjectSaveQueue(handler) {
  const map = new Map();
  async function run(value, item, promise) {
    while (promise) {
      try {
        promise['resolve'](await handler(promise['snapshot']));
      } catch (key) {
        promise['reject'](key);
      }
      ((promise = item['pending']), (item['pending'] = null));
    }
    map['delete'](value);
  }
  return (index, snapshot) =>
    new Promise((resolve, reject) => {
      const result = { snapshot: snapshot, resolve: resolve, reject: reject },
        data = map['get'](index);
      if (data) {
        (data['pending']?.['resolve']({ success: false, canceled: true, superseded: true }),
          (data['pending'] = result));
        return;
      }
      const options = { pending: null };
      (map['set'](index, options), void run(index, options, result));
    });
}
