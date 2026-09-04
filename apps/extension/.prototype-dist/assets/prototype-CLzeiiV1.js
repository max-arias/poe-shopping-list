const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "assets/main-BCeci4NA.js",
      "assets/mock-storage-8MTByDCb.js",
      "assets/main-C_zPcLQ5.css",
    ]),
) => i.map((i) => d[i]);
import "./modulepreload-polyfill-B5Qt9EMX.js";
import { s as u } from "./mock-storage-8MTByDCb.js";
const h = "modulepreload",
  y = function (n) {
    return "/" + n;
  },
  p = {},
  v = function (a, l, k) {
    let c = Promise.resolve();
    if (l && l.length > 0) {
      let m = function (e) {
        return Promise.all(
          e.map((i) =>
            Promise.resolve(i).then(
              (s) => ({ status: "fulfilled", value: s }),
              (s) => ({ status: "rejected", reason: s }),
            ),
          ),
        );
      };
      document.getElementsByTagName("link");
      const o = document.querySelector("meta[property=csp-nonce]"),
        t = o?.nonce || o?.getAttribute("nonce");
      c = m(
        l.map((e) => {
          if (((e = y(e)), e in p)) return;
          p[e] = !0;
          const i = e.endsWith(".css"),
            s = i ? '[rel="stylesheet"]' : "";
          if (document.querySelector(`link[href="${e}"]${s}`)) return;
          const r = document.createElement("link");
          if (
            ((r.rel = i ? "stylesheet" : h),
            i || (r.as = "script"),
            (r.crossOrigin = ""),
            (r.href = e),
            t && r.setAttribute("nonce", t),
            document.head.appendChild(r),
            i)
          )
            return new Promise((w, f) => {
              (r.addEventListener("load", w),
                r.addEventListener("error", () => f(new Error(`Unable to preload CSS for ${e}`))));
            });
        }),
      );
    }
    function d(o) {
      const t = new Event("vite:preloadError", { cancelable: !0 });
      if (((t.payload = o), window.dispatchEvent(t), !t.defaultPrevented)) throw o;
    }
    return c.then((o) => {
      for (const t of o || []) t.status === "rejected" && d(t.reason);
      return a().catch(d);
    });
  },
  g = [
    {
      id: "prototype-mapping-kit",
      title: "Mapping kit — Settlers",
      overview: "Finish the atlas setup before the weekend rotation.",
      createdAt: Date.now() - 1e3 * 60 * 60 * 24 * 3,
      items: [
        {
          id: "prototype-item-1",
          position: 0,
          title: "Righteous Fire Inquisitor",
          tradeUrl: "https://www.pathofexile.com/trade/search/Settlers/9qLkYdK",
          variant: "Level 21 gem • 20% quality",
          note: "Check awakened gems too",
          completed: !1,
          addedAt: Date.now() - 1e3 * 60 * 60 * 20,
        },
        {
          id: "prototype-item-2",
          position: 1,
          title: "Stygian Vise with life and resists",
          tradeUrl: "https://www.pathofexile.com/trade/search/Settlers/7aVise",
          completed: !1,
          addedAt: Date.now() - 1e3 * 60 * 60 * 12,
        },
        {
          id: "prototype-item-3",
          position: 2,
          title: "Eldritch currency bundle",
          tradeUrl: "https://www.pathofexile.com/trade/exchange/Settlers",
          completed: !0,
          addedAt: Date.now() - 1e3 * 60 * 60 * 6,
        },
      ],
      groups: [],
    },
  ];
await u.setItem("local:drafts:v1", g);
await u.setItem("local:settings:v2", { openItemsInNewTab: !0 });
const b = {
  tabs: {
    async create({ url: n }) {
      return (window.open(n, "_blank", "noopener,noreferrer"), { id: 2, url: n });
    },
    async query() {
      return [{ id: 1, url: window.location.href }];
    },
    async update(n, { url: a }) {
      return (window.open(a, "_blank", "noopener,noreferrer"), { id: 1, url: a });
    },
  },
};
globalThis.browser = b;
await v(() => import("./main-BCeci4NA.js"), __vite__mapDeps([0, 1, 2]));
