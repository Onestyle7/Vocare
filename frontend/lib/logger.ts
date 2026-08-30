export const Logger = {
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    console.log('[ERROR]', ...args);
  },
};
