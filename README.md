# PoE Shopping List — Local-Only Extension

A browser extension for Path of Exile that lets players create, manage, and share shopping lists of trade searches. **No account, no server, no API** — everything lives in your browser.

---

## What it does

1. **Create lists** — Name a list, optionally link it to a build guide URL
2. **Save searches** — On `pathofexile.com/trade`, run a search and tap "Save This Search" to add it to your list
3. **Track prices** — Prices are auto-captured from trade results (min, median, avg)
4. **Share lists** — Export any list as a compressed text string; others can import it to recreate the list locally
5. **Build-site integration** — A FAB/ribbon appears on pobb.in and maxroll.gg pages when you have a matching list

---

## Features

| Feature        | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| Draft lists    | Create, rename, delete lists locally                          |
| Save search    | Auto-fill item name from trade search bar, capture price data |
| Mark complete  | Check off items as you acquire them                           |
| Edit items     | Rename, change URL, refresh price                             |
| Export/Import  | Share lists via lz-string compressed strings                  |
| Build-site FAB | Injected button on pobb.in and maxroll.gg                     |
| Theme          | Light, dark, or system-following                              |
| Game/league    | Switch between PoE1 and PoE2 leagues                          |

---

## Tech Stack

| Concern             | Choice                                             |
| ------------------- | -------------------------------------------------- |
| Extension framework | [WXT](https://wxt.dev) (Chrome MV3 + Firefox)      |
| UI                  | [Vue 3](https://vuejs.org) Composition API         |
| State               | Pinia + `browser.storage.local`                    |
| Compression         | [lz-string](https://github.com/pieroxy/lz-string/) |
| Validation          | [Zod](https://zod.dev)                             |
| Styling             | Tailwind v4 with PoE-themed design tokens          |
| Toolchain           | [VitePlus (`vp`)](https://viteplus.dev)            |

---

## Developer Workflow

### Prerequisites

Install [VitePlus](https://viteplus.dev) globally:

```powershell
# Windows
irm https://vite.plus/ps1 | iex

# macOS / Linux
curl -fsSL https://vite.plus | bash
```

### Setup

```bash
vp install          # install dependencies
```

### Development

```bash
vp dev               # start WXT dev server (Chrome)
vp build             # production build (Chrome)
vp check             # format + lint + typecheck
```

### Firefox

```bash
wxt build -b firefox  # Firefox-specific build
wxt zip -b firefox    # package for Firefox Add-ons
```

### E2E Tests

```bash
npm run e2e           # build extension + run Playwright tests
```

---

## Project Structure

```
poe-shopping-list/
├── apps/
│   ├── extension/         # WXT + Vue (Chrome + Firefox)
│   └── e2e/              # Playwright tests
├── docs/                 # ARCHITECTURE.md, PRD.md, STATUS.md
├── mockups/              # Extension sidebar wireframes
├── package.json          # Root workspace
└── README.md
```

---

## Import/Export Format

Lists are exported as lz-string compressed, URI-safe strings. The portable format uses short keys to minimize size:

```json
{
  "n": "RF Jugg",
  "g": "poe1",
  "l": "Mirage",
  "i": [{ "n": "Kaom's Heart", "k": "unique", "u": "https://...", "b": "Vaal Regalia" }],
  "bu": "https://pobb.in/abc",
  "bc": "CreatorName"
}
```

On import, new IDs and timestamps are generated, and the list is validated with Zod.

---

## Related Docs

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Extension architecture, data model, content scripts
- [PRD.md](docs/PRD.md) — Personas, user flows, feature specs
- [STATUS.md](STATUS.md) — Implementation status tracker
