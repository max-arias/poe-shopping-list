// Website wireframe variations — 6 directions.
// Each exports a function that returns a full page JSX tree.
// All share the same fixture data.

const fx = {
  builds: [
    {
      name: "Boneshatter Juggernaut",
      ascendancy: "Juggernaut",
      author: "Kiwi_Exalt",
      guide: "pobb.in/boneshatter-jug",
      league: "Phrecia SC",
      game: "PoE1",
      trending: true,
      lists: [
        { name: "Leveling kit (acts 1–10)", author: "Kiwi_Exalt", cost: "2ex", follows: 342 },
        { name: "Endgame setup", author: "Pohx", cost: "25ex", follows: 1204 },
        { name: "Budget mapper", author: "SaltyCrab", cost: "8ex", follows: 89 },
        { name: "Min-max mirror tier", author: "SubtractEm", cost: "2mir", follows: 44 },
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
        { name: "Starter (no budget)", author: "Pohx", cost: "1ex", follows: 2040 },
        { name: "Midgame transition", author: "Pohx", cost: "12ex", follows: 890 },
        { name: "Mirror setup", author: "Balormage", cost: "1.5mir", follows: 120 },
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
        { name: "All-in-one shopping", author: "Zizaran", cost: "18ex", follows: 512 },
        { name: "Budget version", author: "Tytykiller", cost: "5ex", follows: 77 },
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
        { name: "League start", author: "Palsteron", cost: "6ex", follows: 234 },
        { name: "Endgame bossing", author: "Palsteron", cost: "40ex", follows: 188 },
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
        { name: "Starter setup", author: "Goratha", cost: "4ex", follows: 156 },
        { name: "HH mapper", author: "Goratha", cost: "35ex", follows: 302 },
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
        { name: "Act 1–6", author: "Ghazzy", cost: "80c", follows: 412 },
        { name: "Endgame maps", author: "Ghazzy", cost: "5ex", follows: 280 },
        { name: "Juiced delirium", author: "Balormage", cost: "22ex", follows: 95 },
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
  ],
};

// ══════════════════════════════════════════════════════════════
// V1 · CLASSIC LANDING
// ══════════════════════════════════════════════════════════════
function V1_Classic({ theme, setTheme }) {
  return (
    <web.Page width={1200} minHeight={1500}>
      <web.Nav theme={theme} setTheme={setTheme} />
      {/* Hero */}
      <div
        style={{
          padding: "60px 48px 48px",
          background: "var(--wf-footer-bg)",
          borderBottom: "1px solid var(--wf-stroke-soft)",
          display: "flex",
          gap: 48,
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.2,
              color: "var(--wf-gold-ink-strong)",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            ⚔ Browser extension for Path of Exile
          </div>
          <div
            style={{
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: -0.6,
              lineHeight: 1.1,
              marginBottom: 14,
            }}
          >
            Turn any build guide
            <br />
            into a shopping list.
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--wf-muted)",
              lineHeight: 1.5,
              marginBottom: 22,
              maxWidth: 480,
            }}
          >
            Save trade searches from pathofexile.com/trade, group them into lists, and track price
            &amp; availability without leaving the page.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <web.InstallCTA browser="Chrome" />
            <web.InstallCTA browser="Firefox" />
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: "var(--wf-muted)" }}>
            Free · open source · 12,400+ installs
          </div>
        </div>
        {/* Tilted trade-page screenshot with the extension sidebar docked right */}
        <div
          style={{
            width: 520,
            height: 360,
            perspective: 1400,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              transform: "rotateY(-14deg) rotateX(6deg) rotateZ(-2deg)",
              transformStyle: "preserve-3d",
              boxShadow: "0 24px 60px rgba(26, 20, 12, 0.35), 0 6px 16px rgba(26, 20, 12, 0.25)",
              border: "1px solid var(--wf-frame)",
              borderRadius: 4,
              overflow: "hidden",
              background: "#15110b",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Fake browser chrome */}
            <div
              style={{
                height: 22,
                background: "#d8d2c5",
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "0 8px",
                borderBottom: "1px solid #9e9684",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: "#e06b5e" }} />
                <div style={{ width: 8, height: 8, borderRadius: 4, background: "#e8b840" }} />
                <div style={{ width: 8, height: 8, borderRadius: 4, background: "#6ca86a" }} />
              </div>
              <div
                style={{
                  marginLeft: 10,
                  fontSize: 9,
                  color: "#5a5040",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                pathofexile.com/trade/search/Phrecia/abc123
              </div>
            </div>
            {/* Split: trade page + sidebar */}
            <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
              {/* Trade page (dark PoE style) */}
              <div
                style={{
                  flex: 1,
                  background: "#1f1912",
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 3px)",
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {/* search filters strip */}
                <div style={{ display: "flex", gap: 4 }}>
                  <div style={{ height: 16, width: 70, background: "#2a2218", borderRadius: 1 }} />
                  <div style={{ height: 16, width: 90, background: "#2a2218", borderRadius: 1 }} />
                  <div style={{ flex: 1 }} />
                  <div style={{ height: 16, width: 40, background: "#7a561a", borderRadius: 1 }} />
                </div>
                <div
                  style={{
                    background: "#15110b",
                    padding: 6,
                    borderRadius: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ height: 10, background: "#231c10", borderRadius: 1 }} />
                  ))}
                </div>
                {/* item result rows */}
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#15110b",
                      padding: "6px 8px",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      border: "1px solid #2a2218",
                    }}
                  >
                    <div
                      style={{ width: 18, height: 18, background: "#3a3226", borderRadius: 1 }}
                    />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                      <div
                        style={{ height: 5, width: "75%", background: "#c29a54", borderRadius: 1 }}
                      />
                      <div
                        style={{ height: 3, width: "55%", background: "#3a3226", borderRadius: 1 }}
                      />
                      <div
                        style={{ height: 3, width: "40%", background: "#3a3226", borderRadius: 1 }}
                      />
                    </div>
                    <div
                      style={{
                        width: 42,
                        height: 12,
                        background: "#7a561a",
                        borderRadius: 1,
                        color: "#140e04",
                        fontSize: 8,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "ui-monospace, monospace",
                      }}
                    >
                      14ex
                    </div>
                  </div>
                ))}
              </div>
              {/* Extension sidebar */}
              <div
                style={{
                  width: 175,
                  background: "var(--wf-bg)",
                  borderLeft: "2px solid var(--wf-frame)",
                  display: "flex",
                  flexDirection: "column",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    height: 22,
                    background: "var(--wf-chrome)",
                    borderBottom: "1px solid var(--wf-stroke)",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 6px",
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      background: "var(--wf-gold)",
                      border: "1px solid var(--wf-gold-edge)",
                      borderRadius: 1,
                    }}
                  />
                  <div style={{ fontSize: 8, fontWeight: 700, color: "var(--wf-ink)" }}>
                    Shopping List
                  </div>
                  <div style={{ flex: 1 }} />
                  <div
                    style={{
                      fontSize: 7,
                      padding: "1px 4px",
                      background: "var(--wf-gold-soft)",
                      border: "1px solid var(--wf-gold-edge)",
                      color: "var(--wf-gold-ink-strong)",
                      borderRadius: 1,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                    }}
                  >
                    PHRECIA
                  </div>
                </div>
                <div
                  style={{
                    padding: 6,
                    fontSize: 8,
                    color: "var(--wf-muted)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    letterSpacing: 0.4,
                  }}
                >
                  Boneshatter endgame · 8
                </div>
                {[
                  ["Vaal Molten Shell", "14ex", true],
                  ["Cyclopean Coil", "45ex", true],
                  ["Abyssus corrupt", "12ex", false],
                  ["Watcher's Eye", "80ex", false],
                  ["Ashes of Stars", "110ex", false],
                  ["Blessed Orb", "2c", true],
                ].map(([n, p, checked], i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 6px",
                      borderBottom: "1px solid var(--wf-stroke-soft)",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        border: "1px solid var(--wf-stroke)",
                        borderRadius: 1,
                        flexShrink: 0,
                        background: checked ? "var(--wf-gold)" : "transparent",
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 8,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {n}
                    </div>
                    <div
                      style={{
                        fontSize: 8,
                        fontWeight: 600,
                        color: "var(--wf-gold-ink-strong)",
                        fontFamily: "ui-monospace, monospace",
                      }}
                    >
                      {p}
                    </div>
                  </div>
                ))}
                <div style={{ flex: 1 }} />
                <div
                  style={{
                    padding: 6,
                    borderTop: "1px solid var(--wf-stroke)",
                    background: "var(--wf-footer-bg)",
                  }}
                >
                  <div
                    style={{
                      height: 18,
                      background: "var(--wf-gold)",
                      border: "1px solid var(--wf-gold-edge)",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      color: "var(--wf-gold-ink)",
                      textTransform: "uppercase",
                    }}
                  >
                    Save This Search
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured strip */}
      <div style={{ padding: "36px 48px 24px" }}>
        <web.H2 sub="Hand-picked by us" action={<wf.BtnGhost label="See all →" size="sm" />}>
          Featured builds
        </web.H2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {fx.builds.slice(0, 3).map((b, i) => (
            <web.BuildCard key={i} build={b} />
          ))}
        </div>
      </div>

      {/* All builds + filters */}
      <div style={{ padding: "24px 48px 48px" }}>
        <web.H2 sub={`Showing ${fx.builds.length - 3} of 244 in Phrecia SC`}>All builds</web.H2>
        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          <web.Search placeholder="Search builds, classes, skills…" size="md" width={320} />
          <web.FilterBar
            compact
            filters={[
              { label: "Game: PoE1", caret: true },
              { label: "Class: All", caret: true },
              { label: "Cost: Any", caret: true },
              { label: "Sort: Popular", caret: true },
            ]}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {fx.builds.slice(3).map((b, i) => (
            <web.BuildCard key={i} build={b} />
          ))}
        </div>
      </div>
    </web.Page>
  );
}

// ══════════════════════════════════════════════════════════════
// V2 · CATALOG-FIRST (poe.ninja / craft-of-exile feel)
// ══════════════════════════════════════════════════════════════
function V2_CatalogFirst({ signedIn }) {
  return (
    <web.Page width={1200} minHeight={1400}>
      <web.Nav signedIn={signedIn} />
      {/* Sticky install strip */}
      <div
        style={{
          background: "var(--wf-gold-soft)",
          borderBottom: "1px solid var(--wf-gold-edge)",
          padding: "10px 48px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--wf-gold-ink-strong)" }}>
          ⚔ Install the extension to follow any list — prices refresh as you shop.
        </div>
        <div style={{ flex: 1 }} />
        <web.InstallCTA browser="Chrome" size="sm" />
        <web.InstallCTA browser="Firefox" size="sm" />
      </div>

      {/* Compact title + search as hero */}
      <div style={{ padding: "32px 48px 20px" }}>
        <div
          style={{
            fontSize: 13,
            color: "var(--wf-muted)",
            letterSpacing: 0.5,
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Builds · Phrecia SC
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.3, marginBottom: 16 }}>
          247 builds with shopping lists
        </div>
        <web.Search placeholder="Search build name, class, skill gem, or item…" size="lg" />

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <web.FilterBar
            compact
            filters={[
              { label: "PoE1", active: true },
              { label: "PoE2" },
              { label: "Phrecia SC", icon: "⚑", active: true, caret: true },
              { label: "All classes", caret: true },
              { label: "Any cost", caret: true },
              { label: "Popular", icon: "↓", caret: true },
            ]}
          />
        </div>
      </div>

      {/* Dense grid */}
      <div style={{ padding: "8px 48px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          {[...fx.builds, ...fx.builds].slice(0, 8).map((b, i) => (
            <web.BuildCard key={i} build={b} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <wf.BtnGhost label="Load more builds" />
        </div>
      </div>
    </web.Page>
  );
}

// ══════════════════════════════════════════════════════════════
// V3 · LEAGUE WALL (current league dominates)
// ══════════════════════════════════════════════════════════════
function V3_LeagueWall({ signedIn }) {
  return (
    <web.Page width={1200} minHeight={1500}>
      <web.Nav signedIn={signedIn} />
      {/* Full-bleed league banner */}
      <div
        style={{
          position: "relative",
          background: "var(--wf-frame)",
          color: "#f0e2bd",
          padding: "44px 48px 36px",
          backgroundImage:
            "radial-gradient(ellipse at 80% 40%, rgba(192,138,56,0.18), transparent 55%), repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0 6px, transparent 6px 14px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: "var(--wf-gold)",
              border: "2px solid var(--wf-gold-edge)",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--wf-gold-ink)",
            }}
          >
            P
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "rgba(240,226,189,0.65)",
                fontWeight: 600,
              }}
            >
              Current league · week 3
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.3 }}>
              Phrecia · Settlers of Kalguur
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              border: "1px solid rgba(240,226,189,0.4)",
              padding: "6px 12px",
              borderRadius: 2,
              fontSize: 11,
              background: "rgba(0,0,0,0.25)",
            }}
          >
            Switch league ⌄
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 20, marginBottom: 14 }}>
          {[
            ["247", "builds"],
            ["1,820", "shopping lists"],
            ["48k", "items tracked"],
            ["4.2M", "follows"],
          ].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--wf-gold)" }}>{n}</div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(240,226,189,0.55)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {l}
              </div>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div>
            <web.InstallCTA browser="Chrome" />
          </div>
        </div>
      </div>

      {/* Trending this week */}
      <div style={{ padding: "30px 48px 20px" }}>
        <web.H2 sub="Most-followed lists in the last 7 days">🔥 Trending this week</web.H2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {fx.builds
            .filter((b) => b.trending)
            .map((b, i) => (
              <web.BuildCard key={i} build={b} />
            ))}
        </div>
      </div>

      {/* Rest of catalog */}
      <div style={{ padding: "20px 48px 48px" }}>
        <web.H2 sub="247 total · filter to narrow">All Phrecia builds</web.H2>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <web.Search placeholder="Search builds…" width={300} />
          <web.FilterBar
            compact
            filters={[
              { label: "All classes", caret: true },
              { label: "Any cost", caret: true },
              { label: "Popular", icon: "↓", caret: true },
            ]}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {fx.builds.slice(0, 6).map((b, i) => (
            <web.BuildCard key={i} build={b} />
          ))}
        </div>
      </div>
    </web.Page>
  );
}

// ══════════════════════════════════════════════════════════════
// V4 · CREATOR-FORWARD (grouped by author)
// ══════════════════════════════════════════════════════════════
function V4_CreatorForward({ signedIn }) {
  const creators = [
    {
      name: "Pohx",
      handle: "pohx.net",
      tag: "RF specialist",
      builds: fx.builds.filter((b) => b.author === "Pohx"),
    },
    {
      name: "Kiwi_Exalt",
      handle: "twitter/kiwi",
      tag: "Melee builds",
      builds: fx.builds.filter((b) => b.author === "Kiwi_Exalt"),
    },
    {
      name: "Ghazzy",
      handle: "ghazzy.tv",
      tag: "PoE2 focus",
      builds: fx.builds.filter((b) => b.author === "Ghazzy"),
    },
    {
      name: "Palsteron",
      handle: "youtube/pals",
      tag: "Caster theorycraft",
      builds: fx.builds.filter((b) => b.author === "Palsteron"),
    },
  ];
  return (
    <web.Page width={1200} minHeight={1500}>
      <web.Nav signedIn={signedIn} />
      <div style={{ padding: "40px 48px 30px", borderBottom: "1px solid var(--wf-stroke-soft)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 28 }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.2,
                color: "var(--wf-gold-ink-strong)",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Follow the creators you trust
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: -0.4,
                lineHeight: 1.1,
                marginBottom: 12,
              }}
            >
              Real build guides,
              <br />
              with real shopping lists.
            </div>
            <div style={{ fontSize: 13, color: "var(--wf-muted)", maxWidth: 460, lineHeight: 1.5 }}>
              The extension turns each creator's guide into a tracked, priced list you can follow
              with one click.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <web.InstallCTA browser="Chrome" />
            <div style={{ fontSize: 11, color: "var(--wf-muted)" }}>Firefox · Edge · Brave</div>
          </div>
        </div>
      </div>

      {/* Creators */}
      <div style={{ padding: "32px 48px 48px" }}>
        <web.H2 sub="Browse by creator">Featured creators</web.H2>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {creators.map((c, i) => (
            <div
              key={i}
              style={{
                background: "var(--wf-section-bg)",
                border: "1px solid var(--wf-stroke-soft)",
                borderRadius: 3,
                padding: 18,
              }}
            >
              {/* Creator strip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  paddingBottom: 14,
                  marginBottom: 14,
                  borderBottom: "1px dashed var(--wf-stroke-soft)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: "var(--wf-gold)",
                    border: "1px solid var(--wf-gold-edge)",
                    borderRadius: 24,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "var(--wf-muted)" }}>
                    {c.tag} · ↗ {c.handle}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--wf-muted)" }}>
                  {c.builds.length} build{c.builds.length === 1 ? "" : "s"}
                </div>
                <wf.BtnGhost label="View all →" size="sm" />
              </div>
              {c.builds.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  {c.builds.map((b, j) => (
                    <web.BuildCard key={j} build={b} />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    fontSize: 11,
                    color: "var(--wf-muted)",
                    fontStyle: "italic",
                  }}
                >
                  No lists this league yet
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </web.Page>
  );
}

// ══════════════════════════════════════════════════════════════
// V5 · ACTIVITY STREAM
// ══════════════════════════════════════════════════════════════
function V5_Activity({ signedIn }) {
  const activity = [
    {
      kind: "repriced",
      build: fx.builds[0],
      list: fx.builds[0].lists[1],
      when: "8m ago",
      note: "Watcher's Eye down 12%",
    },
    {
      kind: "published",
      build: fx.builds[5],
      list: fx.builds[5].lists[2],
      when: "42m ago",
      note: "New endgame list",
    },
    {
      kind: "trending",
      build: fx.builds[1],
      list: fx.builds[1].lists[0],
      when: "2h ago",
      note: "+204 follows today",
    },
    {
      kind: "repriced",
      build: fx.builds[2],
      list: fx.builds[2].lists[0],
      when: "3h ago",
      note: "3 items back in stock",
    },
    {
      kind: "published",
      build: fx.builds[3],
      list: fx.builds[3].lists[1],
      when: "5h ago",
      note: "Palsteron updated for week 3",
    },
    {
      kind: "trending",
      build: fx.builds[4],
      list: fx.builds[4].lists[1],
      when: "6h ago",
      note: "Featured on r/pathofexile",
    },
  ];
  const toneFor = (k) => (k === "repriced" ? "warn" : k === "published" ? "good" : "gold");
  const labelFor = (k) =>
    ({ repriced: "REPRICED", published: "PUBLISHED", trending: "TRENDING" })[k];
  return (
    <web.Page width={1200} minHeight={1400}>
      <web.Nav signedIn={signedIn} />
      <div
        style={{
          padding: "36px 48px 20px",
          borderBottom: "1px solid var(--wf-stroke-soft)",
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.3 }}>
            What's happening in Phrecia.
          </div>
          <div style={{ fontSize: 13, color: "var(--wf-muted)", marginTop: 6 }}>
            Live feed of new lists, reprices, and trending builds. The extension does the same for
            your own lists, quietly, as you shop.
          </div>
        </div>
        <web.InstallCTA browser="Chrome" />
      </div>

      <div
        style={{
          padding: "24px 48px 48px",
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: 32,
        }}
      >
        {/* Feed */}
        <div>
          <web.H2 sub="Updated live">Activity</web.H2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              border: "1px solid var(--wf-stroke-soft)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            {activity.map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  borderBottom:
                    i < activity.length - 1 ? "1px solid var(--wf-stroke-soft)" : "none",
                  background: "var(--wf-section-bg)",
                }}
              >
                <div style={{ width: 80, flexShrink: 0 }}>
                  <wf.Pill tone={toneFor(a.kind)}>{labelFor(a.kind)}</wf.Pill>
                </div>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: "var(--wf-block)",
                    border: "1px solid var(--wf-stroke)",
                    borderRadius: 2,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: "var(--wf-muted)",
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {a.build.ascendancy
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.build.name}</div>
                  <div style={{ fontSize: 11, color: "var(--wf-muted)", marginTop: 2 }}>
                    {a.list.name} · by {a.list.author}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: "var(--wf-muted)" }}>{a.when}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--wf-gold-ink-strong)",
                      fontWeight: 500,
                      marginTop: 2,
                    }}
                  >
                    {a.note}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <web.H2 sub="">🔥 Trending builds</web.H2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {fx.builds
                .filter((b) => b.trending)
                .map((b, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 10,
                      background: "var(--wf-section-bg)",
                      border: "1px solid var(--wf-stroke-soft)",
                      borderRadius: 2,
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--wf-gold-ink-strong)",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {b.name}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--wf-muted)" }}>
                        {b.lists.length} lists · {b.author}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div
            style={{
              padding: 16,
              background: "var(--wf-gold-soft)",
              border: "1px solid var(--wf-gold-edge)",
              borderRadius: 3,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--wf-gold-ink-strong)",
                marginBottom: 4,
              }}
            >
              Get this on your own lists.
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--wf-gold-ink-strong)",
                marginBottom: 10,
                lineHeight: 1.4,
              }}
            >
              Install the extension — follow any list and its prices refresh in your sidebar
              whenever you open a saved search.
            </div>
            <web.InstallCTA browser="Chrome" size="sm" />
          </div>
        </div>
      </div>
    </web.Page>
  );
}

// ══════════════════════════════════════════════════════════════
// V6 · BUILD + LISTS TABULA (dense rows; build = row, lists = columns)
// ══════════════════════════════════════════════════════════════
function V6_Tabula({ signedIn }) {
  return (
    <web.Page width={1200} minHeight={1400}>
      <web.Nav signedIn={signedIn} />
      <div
        style={{
          padding: "28px 48px 16px",
          borderBottom: "1px solid var(--wf-stroke-soft)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.2 }}>
            Every build, every list, one table.
          </div>
          <div style={{ fontSize: 12, color: "var(--wf-muted)", marginTop: 4 }}>
            Phrecia SC · PoE1 · 247 builds · 1,820 shopping lists
          </div>
        </div>
        <web.InstallCTA browser="Chrome" />
      </div>

      <div style={{ padding: "20px 48px 48px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <web.Search placeholder="Search build, class, skill gem, item name…" width={360} />
          <web.FilterBar
            compact
            filters={[
              { label: "PoE1", active: true },
              { label: "PoE2" },
              { label: "Phrecia SC", active: true, caret: true },
              { label: "Any class", caret: true },
              { label: "Any cost", caret: true },
              { label: "Popular", caret: true },
            ]}
          />
        </div>

        {/* Column headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr 120px 80px",
            gap: 0,
            padding: "8px 14px",
            fontSize: 10,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: "var(--wf-muted)",
            fontWeight: 700,
            background: "var(--wf-section-bg)",
            border: "1px solid var(--wf-stroke-soft)",
            borderBottom: "none",
            borderRadius: "2px 2px 0 0",
          }}
        >
          <div>Build</div>
          <div>Shopping lists (author · cost · ♥)</div>
          <div style={{ textAlign: "right" }}>Updated</div>
          <div style={{ textAlign: "right" }}>Total ♥</div>
        </div>

        {fx.builds.map((b, i) => {
          const totalFollows = b.lists.reduce((n, l) => n + l.follows, 0);
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "280px 1fr 120px 80px",
                alignItems: "center",
                padding: "12px 14px",
                background: "var(--wf-bg)",
                border: "1px solid var(--wf-stroke-soft)",
                borderTop: "none",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: "var(--wf-block)",
                    border: "1px solid var(--wf-stroke)",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--wf-muted)",
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {b.ascendancy
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {b.name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--wf-muted)" }}>
                    {b.ascendancy} · {b.author}
                  </div>
                </div>
                {b.trending && <wf.Pill tone="gold">↑</wf.Pill>}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {b.lists.map((l, j) => (
                  <div
                    key={j}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 8px",
                      background: "var(--wf-section-bg)",
                      border: "1px solid var(--wf-stroke-soft)",
                      borderRadius: 2,
                      fontSize: 11,
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{l.name}</span>
                    <span style={{ color: "var(--wf-muted)", fontSize: 10 }}>{l.author}</span>
                    <span
                      style={{
                        color: "var(--wf-gold-ink-strong)",
                        fontWeight: 600,
                        fontFamily: "ui-monospace, monospace",
                      }}
                    >
                      {l.cost}
                    </span>
                    <span style={{ color: "var(--wf-muted)", fontSize: 10 }}>♥{l.follows}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "right", fontSize: 11, color: "var(--wf-muted)" }}>
                {["2m", "14m", "1h", "3h", "8h", "1d"][i % 6]} ago
              </div>
              <div
                style={{
                  textAlign: "right",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--wf-gold-ink-strong)",
                }}
              >
                {totalFollows.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </web.Page>
  );
}

Object.assign(window, {
  V1_Classic,
  V2_CatalogFirst,
  V3_LeagueWall,
  V4_CreatorForward,
  V5_Activity,
  V6_Tabula,
});
