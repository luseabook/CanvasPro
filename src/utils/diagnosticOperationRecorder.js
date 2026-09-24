let operationSequence = 0;

export function createDiagnosticOperation({ type, context = {}, source = 'renderer', logEvent }) {
  const startedAt = Date.now();
  const metadata = {
    ...context,
    operationId: startedAt.toString(36) + '-' + ++operationSequence,
    startedAt,
  };
  const emit = (phase, error) => {
    try {
      Promise.resolve(
        logEvent?.({
          type: type + '.' + phase,
          level: phase === 'failed' ? 'error' : 'info',
          source,
          message: type + ' ' + phase,
          error,
          context: {
            ...metadata,
            elapsedMs: Math.max(0, Date.now() - startedAt),
            ...(error
              ? {
                  failure: {
                    name: String(error.name || 'Error'),
                    message: String(error.message || error),
                    code:
                      typeof error.code === 'string' || typeof error.code === 'number'
                        ? error.code
                        : '',
                  },
                }
              : {}),
          },
        }),
      ).catch(() => {});
    } catch {}
  };
  return {
    metadata,
    async run(task) {
      emit('started');
      try {
        const result = await task();
        if (result?.canceled === true || result?.cancelled === true) {
          emit('canceled');
        } else if (result?.success === false || result?.ok === false || result?.error) {
          emit('failed', new Error(String(result.error || result.message || 'Operation failed')));
        } else {
          emit('succeeded');
        }
        return result;
      } catch (error) {
        emit('failed', error);
        throw error;
      }
    },
  };
}
