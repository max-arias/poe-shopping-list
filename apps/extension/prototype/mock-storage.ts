type Watcher<T> = (value: T) => void;

const values = new Map<string, unknown>();
const watchers = new Map<string, Set<Watcher<unknown>>>();

export const storage = {
  defineItem<T>(key: string, options: { fallback: T }) {
    return {
      async getValue(): Promise<T> {
        return (values.has(key) ? values.get(key) : options.fallback) as T;
      },
      async setValue(value: T) {
        values.set(key, value);
        watchers.get(key)?.forEach((watcher) => watcher(value));
      },
      watch(watcher: Watcher<T>) {
        const set = watchers.get(key) ?? new Set();
        set.add(watcher as Watcher<unknown>);
        watchers.set(key, set);
        return () => set.delete(watcher as Watcher<unknown>);
      },
    };
  },
  async getItem<T>(key: string): Promise<T | null> {
    return (values.get(key) ?? null) as T | null;
  },
  async setItem<T>(key: string, value: T) {
    values.set(key, value);
  },
  async removeItem(key: string) {
    values.delete(key);
  },
};
