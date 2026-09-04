import { storage } from "./mock-storage";
import "./sidepanel.css";

const prototypeDrafts = [
  {
    id: "prototype-mapping-kit",
    title: "Mapping kit — Settlers",
    overview: "Finish the atlas setup before the weekend rotation.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    items: [
      {
        id: "prototype-item-1",
        position: 0,
        title: "Righteous Fire Inquisitor",
        tradeUrl: "https://www.pathofexile.com/trade/search/Settlers/9qLkYdK",
        variant: "Level 21 gem • 20% quality",
        note: "Check awakened gems too",
        completed: false,
        addedAt: Date.now() - 1000 * 60 * 60 * 20,
      },
      {
        id: "prototype-item-2",
        position: 1,
        title: "Stygian Vise with life and resists",
        tradeUrl: "https://www.pathofexile.com/trade/search/Settlers/7aVise",
        completed: false,
        addedAt: Date.now() - 1000 * 60 * 60 * 12,
      },
      {
        id: "prototype-item-3",
        position: 2,
        title: "Eldritch currency bundle",
        tradeUrl: "https://www.pathofexile.com/trade/exchange/Settlers",
        completed: true,
        addedAt: Date.now() - 1000 * 60 * 60 * 6,
      },
    ],
    groups: [],
  },
];

await storage.setItem("local:drafts:v1", prototypeDrafts);
await storage.setItem("local:settings:v2", { openItemsInNewTab: true });

const browserMock = {
  tabs: {
    async create({ url }: { url: string }) {
      window.open(url, "_blank", "noopener,noreferrer");
      return { id: 2, url };
    },
    async query() {
      return [{ id: 1, url: window.location.href }];
    },
    async update(_id: number, { url }: { url: string }) {
      window.open(url, "_blank", "noopener,noreferrer");
      return { id: 1, url };
    },
  },
};

(globalThis as typeof globalThis & { browser: typeof browserMock }).browser = browserMock;
await import("../src/entrypoints/sidepanel/main");
