export interface ShoppingList {
  name: string;
  author: string;
  cost: string;
  follows: number;
  slug?: string;
}

export interface Build {
  name: string;
  ascendancy: string;
  author: string;
  guide?: string;
  league: string;
  game: "PoE1" | "PoE2";
  trending?: boolean;
  lists: ShoppingList[];
}

export const BUILDS: Build[] = [
  {
    name: "Boneshatter Juggernaut",
    ascendancy: "Juggernaut",
    author: "Kiwi_Exalt",
    guide: "pobb.in/boneshatter-jug",
    league: "Phrecia SC",
    game: "PoE1",
    trending: true,
    lists: [
      {
        name: "Leveling kit (acts 1–10)",
        author: "Kiwi_Exalt",
        cost: "2ex",
        follows: 342,
        slug: "boneshatter-jug-leveling",
      },
      {
        name: "Endgame setup",
        author: "Pohx",
        cost: "25ex",
        follows: 1204,
        slug: "boneshatter-jug-endgame",
      },
      {
        name: "Budget mapper",
        author: "SaltyCrab",
        cost: "8ex",
        follows: 89,
        slug: "boneshatter-jug-budget",
      },
      {
        name: "Min-max mirror tier",
        author: "SubtractEm",
        cost: "2mir",
        follows: 44,
        slug: "boneshatter-jug-mirror",
      },
    ],
  },
  {
    name: "Righteous Fire Inquisitor",
    ascendancy: "Inquisitor",
    author: "Pohx",
    guide: "pohx.net/rf",
    league: "Phrecia SC",
    game: "PoE1",
    trending: true,
    lists: [
      {
        name: "Starter (no budget)",
        author: "Pohx",
        cost: "1ex",
        follows: 2040,
        slug: "rf-inq-starter",
      },
      {
        name: "Midgame transition",
        author: "Pohx",
        cost: "12ex",
        follows: 890,
        slug: "rf-inq-midgame",
      },
      {
        name: "Mirror setup",
        author: "Balormage",
        cost: "1.5mir",
        follows: 120,
        slug: "rf-inq-mirror",
      },
    ],
  },
  {
    name: "Lightning Arrow Deadeye",
    ascendancy: "Deadeye",
    author: "Zizaran",
    guide: "youtube/ziz-la",
    league: "Phrecia SC",
    game: "PoE1",
    lists: [
      {
        name: "All-in-one shopping",
        author: "Zizaran",
        cost: "18ex",
        follows: 512,
        slug: "la-deadeye-full",
      },
      {
        name: "Budget version",
        author: "Tytykiller",
        cost: "5ex",
        follows: 77,
        slug: "la-deadeye-budget",
      },
    ],
  },
  {
    name: "Spark Archmage Hierophant",
    ascendancy: "Hierophant",
    author: "Palsteron",
    guide: "pobb.in/spark-hiero",
    league: "Phrecia SC",
    game: "PoE1",
    lists: [
      {
        name: "League start",
        author: "Palsteron",
        cost: "6ex",
        follows: 234,
        slug: "spark-hiero-start",
      },
      {
        name: "Endgame bossing",
        author: "Palsteron",
        cost: "40ex",
        follows: 188,
        slug: "spark-hiero-endgame",
      },
    ],
  },
  {
    name: "Cold DoT Occultist",
    ascendancy: "Occultist",
    author: "Goratha",
    guide: "pobb.in/colddot",
    league: "Phrecia SC",
    game: "PoE1",
    lists: [
      {
        name: "Starter setup",
        author: "Goratha",
        cost: "4ex",
        follows: 156,
        slug: "colddot-occ-start",
      },
      { name: "HH mapper", author: "Goratha", cost: "35ex", follows: 302, slug: "colddot-occ-hh" },
    ],
  },
  {
    name: "Stormweaver Spark",
    ascendancy: "Stormweaver",
    author: "Ghazzy",
    guide: "pobb.in/spark-sw",
    league: "Dawn of the Hunt",
    game: "PoE2",
    trending: true,
    lists: [
      { name: "Act 1–6", author: "Ghazzy", cost: "80c", follows: 412, slug: "spark-sw-acts" },
      {
        name: "Endgame maps",
        author: "Ghazzy",
        cost: "5ex",
        follows: 280,
        slug: "spark-sw-endgame",
      },
      {
        name: "Juiced delirium",
        author: "Balormage",
        cost: "22ex",
        follows: 95,
        slug: "spark-sw-delirium",
      },
    ],
  },
  {
    name: "Gemling Lightning Arrow",
    ascendancy: "Gemling Legionnaire",
    author: "Snap",
    guide: "pobb.in/gemling-la",
    league: "Dawn of the Hunt",
    game: "PoE2",
    lists: [],
  },
];

export function initials(ascendancy: string): string {
  return ascendancy
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}
