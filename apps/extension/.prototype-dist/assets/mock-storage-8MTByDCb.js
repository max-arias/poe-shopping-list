const t = new Map(),
  c = new Map(),
  r = {
    defineItem(e, a) {
      return {
        async getValue() {
          return t.has(e) ? t.get(e) : a.fallback;
        },
        async setValue(s) {
          (t.set(e, s), c.get(e)?.forEach((n) => n(s)));
        },
        watch(s) {
          const n = c.get(e) ?? new Set();
          return (n.add(s), c.set(e, n), () => n.delete(s));
        },
      };
    },
    async getItem(e) {
      return t.get(e) ?? null;
    },
    async setItem(e, a) {
      t.set(e, a);
    },
    async removeItem(e) {
      t.delete(e);
    },
  };
export { r as s };
