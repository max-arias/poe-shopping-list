CREATE TABLE authors (
  poe_account_id  TEXT PRIMARY KEY,
  display_name    TEXT NOT NULL,
  created_at      INTEGER NOT NULL
);

CREATE TABLE lists (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT NOT NULL UNIQUE,
  author_poe_id   TEXT NOT NULL REFERENCES authors(poe_account_id),
  game            TEXT NOT NULL CHECK (game IN ('poe1', 'poe2')),
  league          TEXT NOT NULL,
  title           TEXT NOT NULL,
  ascendancy      TEXT,
  pob_hash        TEXT,
  source_url      TEXT,
  published_at    INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  deleted_at      INTEGER
);
CREATE INDEX idx_lists_game_league_published ON lists (game, league, published_at DESC);
CREATE INDEX idx_lists_pob_hash              ON lists (pob_hash);
CREATE INDEX idx_lists_author                ON lists (author_poe_id);

CREATE TABLE list_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id          INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  position         INTEGER NOT NULL,
  kind             TEXT NOT NULL CHECK (kind IN ('unique','rare','gem','flask','jewel','cluster','base')),
  name             TEXT NOT NULL,
  base             TEXT,
  trade_query_json TEXT NOT NULL,
  item_hash        TEXT NOT NULL
);
CREATE INDEX idx_list_items_list ON list_items (list_id, position);

CREATE TABLE picks (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  list_item_id          INTEGER NOT NULL REFERENCES list_items(id) ON DELETE CASCADE,
  listing_url           TEXT,
  picked_price_value    REAL NOT NULL,
  picked_price_currency TEXT NOT NULL,
  sample_min            REAL NOT NULL,
  sample_median         REAL NOT NULL,
  sample_avg            REAL NOT NULL,
  sample_size           INTEGER NOT NULL,
  raw_samples_json      TEXT,
  captured_at           INTEGER NOT NULL
);
CREATE INDEX idx_picks_list_item ON picks (list_item_id);

CREATE TABLE build_links (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id       INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  site          TEXT NOT NULL CHECK (site IN ('pobb','maxroll','poeninja','poedb')),
  external_key  TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);
CREATE INDEX idx_build_links_site_key ON build_links (site, external_key);

CREATE TABLE rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);
