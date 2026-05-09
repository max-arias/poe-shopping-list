# PoB → Trade Link Research

This notes how `https://poe.wanitzek.com/` turns a Path of Building export into Path of Exile trade URLs. Evidence source: inspected the site's bundled JavaScript asset `/assets/index-DYH1zUfF.js` and `/stat-index.json` on 2026-05-09.

## Decode pipeline

Input can be a raw PoB export code or a `https://pobb.in/<id>` URL. For `pobb.in` input, the site fetches raw code through its own proxy: `/proxy/pobb/<id>/raw`.

Raw PoB codes are decoded as:

```txt
base64url string
-> trim whitespace/surrounding quotes
-> replace "-" with "+"
-> replace "_" with "/"
-> pad with "=" to length % 4 === 0
-> atob()
-> Uint8Array
-> pako.inflate()
-> TextDecoder()
-> XML string
```

So the effective format is:

```txt
base64url(deflate(PathOfBuilding XML))
```

## XML handling

The decoded XML is parsed with `DOMParser` as `text/xml`.

Accepted roots:

- `<PathOfBuilding>`
- `<PathOfBuilding2>`

But the site rejects PoE2 builds by checking root/`Build@targetVersion`. PoE1 is expected to use `targetVersion="3_0"`.

## Item extraction

The parser first builds an item dictionary from all XML items:

```txt
<Item id="123">item text...</Item>
```

Then reads the active or selected item set:

```txt
<Items activeItemSet="1">
  <ItemSet id="1">
    <Slot name="Helmet" itemId="123" />
  </ItemSet>
</Items>
```

Equipment slots checked:

- Weapon 1 / Weapon 2
- Weapon 1 Swap / Weapon 2 Swap
- Helmet
- Body Armour
- Gloves
- Boots
- Belt
- Amulet
- Ring 1 / Ring 2
- Flask 1..5

Jewels are read from passive-tree sockets:

```txt
<Tree>
  <Spec>
    <Socket itemId="..." />
  </Spec>
</Tree>
```

Gems are read from enabled skills/gems under `<Skills>` / `<Skill>` / `<Gem>` using `nameSpec`, `level`, `quality`, `variantId`, and `skillId`.

## PoB item text parsing

Each item is stored as PoB plain item text. The site extracts:

```ts
{
  rarity,
  name,
  base,
  implicits,
  explicits,
  defense,
  corrupted,
}
```

Important parsing rules:

- Strip PoB color codes such as `^xFFFFFF` and `^1`.
- Read `Rarity:`.
- Read item name/base from following lines.
- Detect `Corrupted`.
- Read `Implicits: N`; next `N` lines are implicit mods.
- Remaining usable mod lines are explicit mods.
- Extract local defenses from `Armour:`, `Evasion:`, `Energy Shield:`, `Ward:`.
- Ignore metadata lines such as `Requires`, `Item Level`, `Unique ID`, `Radius`, `Limited to`, and `Item class`.

## Stat index and mod matching

Before generating URLs, the site fetches `/stat-index.json`. It contains trade stat mappings grouped by category:

```json
{
  "categories": {
    "explicit": [{ "id": "explicit.stat_3299347043", "text": "+# to maximum Life" }],
    "implicit": [],
    "crafted": [],
    "fractured": [],
    "enchant": [],
    "pseudo": []
  }
}
```

Mods are normalized by replacing numeric values with `#`:

```txt
+87 to maximum Life -> +# to maximum Life
```

The matcher searches stat-index categories. For explicit mods it prefers categories like `explicit`, `fractured`, `crafted`, `implicit`, `enchant`. For implicit mods it prefers `implicit`, then fallbacks. Cluster jewels prefer enchant-like categories first.

The matcher can join up to 4 adjacent mod lines to match multi-line trade stats.

## Pseudo stat handling

The site manually detects and sums common stats into pseudo filters:

- life
- energy shield
- mana
- strength / dexterity / intelligence
- fire / cold / lightning / chaos resistance
- elemental resistance
- life regen
- all attributes

Examples:

```txt
life -> pseudo.pseudo_total_life
fire_res -> pseudo.pseudo_total_fire_resistance
```

## Filter strictness

The UI has an “Item match” percentage, default `85%`.

Numeric filters are thresholded:

```txt
filter min = floor(original value * itemMatchPercent)
```

Example:

```txt
+100 life at 85% -> min 85
```

Most numeric stat filters are included in the trade query but disabled by default, letting users enable/tune them in the trade UI. Option filters are generally enabled.

## Trade URL construction

All trade URLs use:

```txt
https://www.pathofexile.com/trade/search/<league>?q=<encoded JSON query>
```

The JSON shape is roughly:

```json
{
  "query": {
    "status": { "option": "securable" },
    "type": "Hubris Circlet",
    "filters": {
      "type_filters": {},
      "misc_filters": {}
    },
    "stats": [
      {
        "type": "and",
        "filters": [
          {
            "id": "explicit.stat_3299347043",
            "value": { "min": 85 },
            "disabled": true
          }
        ],
        "disabled": false
      }
    ]
  },
  "sort": { "price": "asc" }
}
```

The final query JSON is `JSON.stringify`'d and URL-encoded into `q=`.

## Item-specific behavior

### Uniques

Unique/relic searches use `name`, `type`/base, corrupted state, and `mirrored: false`.

Special case: `Foulborn <name>` strips `Foulborn ` from the name and adds `mutated: true`.

### Rares

Rare equipment searches use base/type, nonunique rarity, inferred slot category, corrupted state, mirrored false, and matched stat filters.

Slot categories include:

```txt
Helmet -> armour.helmet
Body Armour -> armour.chest
Belt -> accessory.belt
Ring 1/2 -> accessory.ring
Bow -> weapon.bow
Wand -> weapon.wand
```

Armour slots also add local defense filters for armour/evasion/energy shield, thresholded by the item-match percentage.

### Flasks

Magic flask searches are simple: type = flask base, category = flask, rarity = magic, corrupted false, mirrored false. The site does not deeply match flask affixes.

### Jewels

Jewel category detection:

```txt
Small/Medium/Large Cluster Jewel -> jewel.cluster
Ghastly/Hypnotic/Murderous/Searching Eye Jewel -> jewel.abyss
other jewels -> jewel
```

Then similar stat matching is applied.

### Gems

Gem searches use category `gem.activegem` or `gem.supportgem`, type = gem name, and misc filters for minimum gem level and quality.

Support/awakened detection comes from `skillId`, `variantId`, or gem name. Alt-quality handling detects `variantId` like `AltX` / `AltY` and sets a trade discriminator such as `disc: "alt_x"`.

## End-to-end pipeline

```txt
input
-> raw PoB or pobb.in raw fetch
-> base64url normalize
-> inflate with pako
-> parse XML
-> collect item text by id
-> selected item set slots -> equipment
-> tree sockets -> jewels
-> skill gems -> gems
-> parse item text
-> match mods against /stat-index.json
-> build PoE trade query JSON
-> URL encode into pathofexile.com/trade/search
```
