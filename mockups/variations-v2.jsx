// v2 — Refined direction: Tabbed IA with Mine / Following / Trending + modal-first capture.
// Publish is an inline action (per-list kebab + footer on active draft) — no dedicated tab.

const { wf } = window;

// ─── Tab bar ────────────────────────────────────────────────
const TabBar = ({ active, onSelect, tabs }) => (
  <div
    style={{
      display: "flex",
      borderBottom: "1px solid var(--wf-stroke)",
      background: "var(--wf-tab-bg)",
    }}
  >
    {tabs.map((t) => {
      const on = t.key === active;
      return (
        <div
          key={t.key}
          onClick={() => onSelect && onSelect(t.key)}
          style={{
            flex: 1,
            padding: "11px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: on ? 600 : 400,
            color: on ? "var(--wf-gold-ink-strong)" : "var(--wf-muted)",
            borderBottom: on ? "2px solid var(--wf-gold)" : "2px solid transparent",
            cursor: "pointer",
          }}
        >
          <span>{t.label}</span>
          {t.badge !== undefined && (
            <span
              style={{
                fontSize: 10,
                padding: "0 5px",
                borderRadius: 6,
                minWidth: 14,
                background: on ? "var(--wf-gold-soft)" : "var(--wf-pill-bg)",
                color: on ? "var(--wf-gold-ink-strong)" : "var(--wf-muted)",
                textAlign: "center",
              }}
            >
              {t.badge}
            </span>
          )}
        </div>
      );
    })}
  </div>
);

// ─── Active list selector (pill-header showing which list is getting captures) ───
const ActiveListHeader = ({ density }) => (
  <div
    style={{
      padding: density === "compact" ? "8px 12px" : "12px 14px",
      borderBottom: "1px solid var(--wf-stroke-soft)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "var(--wf-section-bg)",
    }}
  >
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        background: "var(--wf-gold)",
        flexShrink: 0,
      }}
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      <wf.T size="sm" weight={600}>
        Penance Brand Hiero
      </wf.T>
      <wf.T size="xs" color="var(--wf-muted)">
        Active draft · 5 items · 71c
      </wf.T>
    </div>
    <wf.BtnGhost label="Switch" />
  </div>
);

// ─── Per-list kebab menu (shows Publish in-context) ─────────
const KebabMenu = ({ top = 40, right = 10 }) => (
  <div
    style={{
      position: "absolute",
      top,
      right,
      background: "var(--wf-bg)",
      border: "1px solid var(--wf-stroke)",
      borderRadius: 2,
      padding: "4px 0",
      minWidth: 160,
      boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
      zIndex: 10,
      fontSize: 12,
    }}
  >
    {[
      ["📤  Publish this list", "gold"],
      ["✏️  Rename"],
      ["↻  Unmark all"],
      ["⭳  Export JSON"],
      ["—"],
      ["🗑  Delete list", "danger"],
    ].map(([label, tone], i) =>
      label === "—" ? (
        <div key={i} style={{ height: 1, background: "var(--wf-stroke-soft)", margin: "4px 0" }} />
      ) : (
        <div
          key={i}
          style={{
            padding: "7px 12px",
            color:
              tone === "gold"
                ? "var(--wf-gold-ink-strong)"
                : tone === "danger"
                  ? "#a8432a"
                  : "var(--wf-ink)",
            fontWeight: tone === "gold" ? 600 : 400,
            cursor: "pointer",
          }}
        >
          {label}
        </div>
      ),
    )}
  </div>
);

// ─── MINE tab contents ──────────────────────────────────────
const MineTab = ({ density, state, showKebab }) => {
  const D = density;
  return (
    <>
      <ActiveListHeader density={D} />
      <div style={{ flex: 1, overflow: "auto", minHeight: 0, position: "relative" }}>
        {state === "empty" ? (
          <EmptyMine />
        ) : (
          <>
            <wf.Item
              name="Grey Wind Spectral Axe"
              price="45"
              currency="c"
              captured="2h ago"
              checked
              density={D}
            />
            <wf.Item
              name="Crown of Eyes (Hubris Circlet)"
              price="1.8"
              currency="div"
              captured="2h ago"
              checked
              density={D}
            />
            <wf.Item
              name="Rathpith Globe (Titanium)"
              price="12"
              currency="c"
              captured="1d ago"
              density={D}
            />
            <wf.Item name="+1 Phys Spell Skills Amulet" density={D}>
              <wf.T size="xs" color="var(--wf-muted)">
                No price captured
              </wf.T>
            </wf.Item>
            <wf.Item
              name="Life Flask of Staunching"
              price="3"
              currency="c"
              captured="3h ago"
              density={D}
            />
          </>
        )}
        {showKebab && <KebabMenu top={8} right={10} />}
      </div>
      {/* Footer: gold CTA + secondary publish */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--wf-stroke)",
          background: "var(--wf-footer-bg)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <wf.BtnGold label="Save This Search" />
        {state !== "empty" && (
          <div style={{ display: "flex", gap: 8 }}>
            <wf.BtnGhost label="+ New list" full />
            <wf.BtnGhost
              label="Publish ▸"
              full
              style={{
                borderStyle: "solid",
                borderColor: "var(--wf-gold-edge)",
                color: "var(--wf-gold-ink-strong)",
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};

const EmptyMine = () => (
  <div
    style={{
      padding: "32px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <wf.Block w={56} h={56} style={{ borderStyle: "dashed", borderRadius: 28 }}>
      shop
    </wf.Block>
    <wf.T size="md" weight={600}>
      Start your first list
    </wf.T>
    <div
      style={{
        width: "100%",
        maxWidth: 260,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        textAlign: "left",
      }}
    >
      {[
        ["1", 'Name your list (e.g. "RF Jugg")'],
        ["2", "Open pathofexile.com/trade"],
        ["3", "Run a search → tap Save This Search"],
      ].map(([n, t]) => (
        <div key={n} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              background: "var(--wf-gold-soft)",
              color: "var(--wf-gold-ink-strong)",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {n}
          </div>
          <wf.T size="sm">{t}</wf.T>
        </div>
      ))}
    </div>
    <wf.BtnGold label="+ Create List" full={false} />
    <wf.T size="xs" color="var(--wf-muted)" style={{ marginTop: 6 }}>
      Or explore the Trending tab for inspiration.
    </wf.T>
  </div>
);

// ─── FOLLOWING tab contents ─────────────────────────────────
const FollowingTab = ({ density, state }) => {
  if (state === "empty") {
    return (
      <div
        style={{
          padding: "40px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          textAlign: "center",
          alignItems: "center",
        }}
      >
        <wf.Block w={48} h={48} style={{ borderStyle: "dashed", borderRadius: 24 }}>
          ★
        </wf.Block>
        <wf.T size="md" weight={600}>
          No lists followed yet
        </wf.T>
        <wf.T size="sm" color="var(--wf-muted)" style={{ maxWidth: 240 }}>
          Browse Trending or open any shared list URL to follow it.
        </wf.T>
        <wf.BtnGhost label="See what's trending →" />
      </div>
    );
  }
  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      {[
        ["Archmage Hiero — Cheap Starter", "@lightee", 12, "340c · 2h fresh"],
        ["RF Jugg — 1div Budget", "@mathil", 9, "45c · 1d fresh"],
        ["LA Deadeye Mapper", "@ziz", 18, "2.1div · 3d fresh"],
      ].map(([t, a, n, f], i) => (
        <div
          key={t}
          style={{
            padding: density === "compact" ? "10px 14px" : "14px 14px",
            borderBottom: "1px solid var(--wf-stroke-soft)",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <wf.Block w={36} h={36}>
            📂
          </wf.Block>
          <div style={{ flex: 1, minWidth: 0 }}>
            <wf.T size="sm" weight={600}>
              {t}
            </wf.T>
            <wf.T size="xs" color="var(--wf-muted)" style={{ marginTop: 2 }}>
              {a} · {n} items
            </wf.T>
            <wf.T size="xs" color="var(--wf-muted)" style={{ marginTop: 2 }}>
              {f}
            </wf.T>
          </div>
          <div
            style={{ color: "var(--wf-muted)", fontSize: 14, padding: "0 2px", cursor: "pointer" }}
          >
            ⋯
          </div>
        </div>
      ))}
      <div style={{ padding: 14 }}>
        <wf.BtnGhost label="+ Paste shared list URL" full />
      </div>
    </div>
  );
};

// ─── TRENDING tab contents ──────────────────────────────────
const TrendingTab = ({ density }) => {
  const filters = ["All", "Hiero", "Jugg", "Starter", "Mapper", "Boss"];
  const lists = [
    {
      title: "Penance Brand Hiero — Under 5 div",
      author: "@lightee",
      items: 14,
      total: "4.2 div",
      trend: "+312",
      rank: 1,
      league: "Phrecia SC",
    },
    {
      title: "RF Jugg League Starter",
      author: "@mathil",
      items: 9,
      total: "45 c",
      trend: "+268",
      rank: 2,
      league: "Phrecia SC",
    },
    {
      title: "LA Deadeye Mapper",
      author: "@ziz",
      items: 18,
      total: "2.1 div",
      trend: "+204",
      rank: 3,
      league: "Phrecia SC",
    },
    {
      title: "Corrupting Fever Champion",
      author: "@octavian",
      items: 11,
      total: "80 c",
      trend: "+177",
      rank: 4,
      league: "Phrecia SC",
    },
    {
      title: "Boneshatter Slayer",
      author: "@kobe",
      items: 13,
      total: "1.1 div",
      trend: "+142",
      rank: 5,
      league: "Phrecia SC",
    },
  ];
  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "8px 12px",
          overflowX: "auto",
          borderBottom: "1px solid var(--wf-stroke-soft)",
        }}
      >
        {filters.map((f, i) => (
          <div
            key={f}
            style={{
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: i === 0 ? 600 : 400,
              border: "1px solid var(--wf-stroke)",
              background: i === 0 ? "var(--wf-gold-soft)" : "transparent",
              color: i === 0 ? "var(--wf-gold-ink-strong)" : "var(--wf-ink)",
              borderRadius: 2,
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            {f}
          </div>
        ))}
      </div>
      {/* cards */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {lists.map((l) => (
          <div
            key={l.title}
            style={{
              padding: density === "compact" ? "10px 12px" : "14px 12px",
              borderBottom: "1px solid var(--wf-stroke-soft)",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                flexShrink: 0,
                background: "var(--wf-gold-soft)",
                border: "1px solid var(--wf-gold-edge)",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--wf-gold-ink-strong)",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {l.rank}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <wf.T size="sm" weight={600}>
                {l.title}
              </wf.T>
              <wf.T size="xs" color="var(--wf-muted)" style={{ marginTop: 2 }}>
                {l.author} · {l.items} items · {l.total}
              </wf.T>
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                <wf.Pill tone="good">↑ {l.trend} follows</wf.Pill>
              </div>
            </div>
            <wf.BtnGhost
              label="Follow"
              style={{
                borderStyle: "solid",
                borderColor: "var(--wf-gold-edge)",
                color: "var(--wf-gold-ink-strong)",
                fontWeight: 600,
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
};

// ─── Save Search Modal (modal-first, Save / Cancel only) ────
const SaveSearchModal = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "flex-end",
      zIndex: 20,
    }}
  >
    <div
      style={{
        width: "100%",
        background: "var(--wf-bg)",
        borderTop: "2px solid var(--wf-gold)",
        boxShadow: "0 -6px 20px rgba(0,0,0,0.25)",
        padding: "14px 14px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <wf.T size="md" weight={600}>
          Save Search
        </wf.T>
        <div style={{ flex: 1 }} />
        <wf.T size="lg" color="var(--wf-muted)" style={{ cursor: "pointer" }}>
          ✕
        </wf.T>
      </div>

      {/* Name field */}
      <div>
        <wf.T
          size="xs"
          color="var(--wf-muted)"
          style={{ marginBottom: 4, letterSpacing: 0.6, textTransform: "uppercase" }}
        >
          Name
        </wf.T>
        <div
          style={{
            border: "1px solid var(--wf-gold-edge)",
            background: "var(--wf-bg)",
            borderRadius: 2,
            padding: "8px 10px",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span>Crown of Eyes · +1 phys spell</span>
          <div style={{ flex: 1 }} />
          <span
            style={{
              width: 1,
              height: 14,
              background: "var(--wf-ink)",
              animation: "blink 1s steps(2) infinite",
            }}
          />
        </div>
        <wf.T size="xs" color="var(--wf-muted)" style={{ marginTop: 4 }}>
          Auto-filled from trade search bar · tap to edit
        </wf.T>
      </div>

      {/* Add to list */}
      <div>
        <wf.T
          size="xs"
          color="var(--wf-muted)"
          style={{ marginBottom: 4, letterSpacing: 0.6, textTransform: "uppercase" }}
        >
          Save to
        </wf.T>
        <div
          style={{
            border: "1px solid var(--wf-stroke)",
            borderRadius: 2,
            padding: "8px 10px",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--wf-gold)" }} />
          <span>Penance Brand Hiero</span>
          <wf.Pill tone="gold" style={{ marginLeft: 4 }}>
            ACTIVE
          </wf.Pill>
          <div style={{ flex: 1 }} />
          <span style={{ opacity: 0.5 }}>⌄</span>
        </div>
      </div>

      {/* Captured price preview */}
      <div
        style={{
          border: "1px solid var(--wf-stroke)",
          borderRadius: 2,
          padding: 10,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          background: "var(--wf-section-bg)",
        }}
      >
        {[
          ["MIN", "1.6"],
          ["MEDIAN", "1.8"],
          ["AVG", "2.1"],
        ].map(([l, v]) => (
          <div key={l} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <wf.T size="xs" color="var(--wf-muted)">
              {l}
            </wf.T>
            <div style={{ display: "baseline", display: "flex", gap: 3, alignItems: "baseline" }}>
              <wf.T
                size="xl"
                weight={600}
                color="var(--wf-gold-ink-strong)"
                style={{ fontFamily: "ui-monospace, monospace" }}
              >
                {v}
              </wf.T>
              <wf.T size="xs" color="var(--wf-muted)">
                div
              </wf.T>
            </div>
          </div>
        ))}
      </div>
      <wf.T size="xs" color="var(--wf-muted)" style={{ marginTop: -4 }}>
        24 listings captured · dominant currency: divine · 2 outliers excluded
      </wf.T>

      {/* Cancel / Save */}
      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        <wf.BtnGhost label="Cancel" full style={{ height: 36 }} />
        <wf.BtnGold label="Save" />
      </div>
    </div>
  </div>
);

// ─── Capture-unavailable banner (F15) ───────────────────────
const CaptureUnavailableBanner = () => (
  <div
    style={{
      padding: "8px 12px",
      background: "var(--wf-warn-bg)",
      borderBottom: "1px solid var(--wf-warn-edge)",
      display: "flex",
      gap: 8,
      alignItems: "flex-start",
    }}
  >
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: 10,
        background: "var(--wf-warn-ink)",
        color: "var(--wf-bg)",
        fontSize: 10,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      !
    </div>
    <div style={{ flex: 1 }}>
      <wf.T size="xs" weight={600} color="var(--wf-warn-ink)">
        Trade capture unavailable
      </wf.T>
      <wf.T size="xs" color="var(--wf-warn-ink)" style={{ opacity: 0.8, marginTop: 1 }}>
        Selectors may be out of date. You can still save by name.
      </wf.T>
    </div>
    <wf.T size="xs" color="var(--wf-warn-ink)" weight={600} style={{ cursor: "pointer" }}>
      Check updates
    </wf.T>
  </div>
);

// ─── Publish confirmation (still shown — just not a tab) ────
const PublishConfirmation = () => (
  <div
    style={{
      flex: 1,
      overflow: "auto",
      padding: "24px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        background: "var(--wf-gold-soft)",
        border: "2px solid var(--wf-gold)",
        color: "var(--wf-gold-ink-strong)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        fontWeight: 700,
      }}
    >
      ✓
    </div>
    <div>
      <wf.T size="lg" weight={600}>
        List published
      </wf.T>
      <wf.T size="sm" color="var(--wf-muted)" style={{ marginTop: 4 }}>
        Immutable · share the URL with anyone
      </wf.T>
    </div>

    <div
      style={{
        width: "100%",
        border: "1px solid var(--wf-gold-edge)",
        background: "var(--wf-section-bg)",
        borderRadius: 2,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <wf.T
        size="sm"
        style={{
          fontFamily: "ui-monospace, monospace",
          flex: 1,
          textAlign: "left",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        poe-shop.gg/lists/k7x2hq9n
      </wf.T>
      <wf.BtnGhost
        label="Copy"
        style={{
          borderStyle: "solid",
          borderColor: "var(--wf-gold-edge)",
          color: "var(--wf-gold-ink-strong)",
        }}
      />
    </div>

    <div
      style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: 6 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <wf.T size="xs" color="var(--wf-muted)">
          Slug
        </wf.T>
        <wf.T size="xs" style={{ fontFamily: "ui-monospace, monospace" }}>
          k7x2hq9n
        </wf.T>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <wf.T size="xs" color="var(--wf-muted)">
          Items
        </wf.T>
        <wf.T size="xs">5 (4 priced)</wf.T>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <wf.T size="xs" color="var(--wf-muted)">
          League
        </wf.T>
        <wf.T size="xs">Phrecia SC</wf.T>
      </div>
    </div>

    <div style={{ display: "flex", gap: 8, width: "100%" }}>
      <wf.BtnGhost label="New draft" full />
      <wf.BtnGold label="View on web →" />
    </div>
  </div>
);

// ─── Publish form (footer-button opens this sheet) ──────────
const PublishSheet = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "flex-end",
      zIndex: 20,
    }}
  >
    <div
      style={{
        width: "100%",
        background: "var(--wf-bg)",
        borderTop: "2px solid var(--wf-gold)",
        boxShadow: "0 -6px 20px rgba(0,0,0,0.25)",
        padding: "14px 14px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxHeight: "90%",
        overflow: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <wf.T size="md" weight={600}>
          Publish list
        </wf.T>
        <div style={{ flex: 1 }} />
        <wf.T size="lg" color="var(--wf-muted)" style={{ cursor: "pointer" }}>
          ✕
        </wf.T>
      </div>

      <div>
        <wf.T
          size="xs"
          color="var(--wf-muted)"
          style={{ marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.6 }}
        >
          Title
        </wf.T>
        <div
          style={{
            border: "1px solid var(--wf-stroke)",
            borderRadius: 2,
            padding: "8px 10px",
            fontSize: 13,
          }}
        >
          Penance Brand Hiero
        </div>
      </div>
      <div>
        <wf.T
          size="xs"
          color="var(--wf-muted)"
          style={{ marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.6 }}
        >
          League
        </wf.T>
        <div
          style={{
            border: "1px solid var(--wf-stroke)",
            borderRadius: 2,
            padding: "8px 10px",
            fontSize: 13,
            display: "flex",
          }}
        >
          <span>Phrecia SC</span>
          <div style={{ flex: 1 }} />
          <span style={{ opacity: 0.5 }}>⌄</span>
        </div>
      </div>
      <div>
        <wf.T
          size="xs"
          color="var(--wf-muted)"
          style={{ marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.6 }}
        >
          Build URL (optional)
        </wf.T>
        <div
          style={{
            border: "1px dashed var(--wf-stroke)",
            borderRadius: 2,
            padding: "8px 10px",
            fontSize: 12,
            color: "var(--wf-muted)",
          }}
        >
          pobb.in/… or maxroll.gg/…
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 5,
          padding: "8px 10px",
          background: "var(--wf-section-bg)",
          border: "1px solid var(--wf-stroke-soft)",
          borderRadius: 2,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <wf.T size="xs" color="var(--wf-muted)">
            Items
          </wf.T>
          <wf.T size="xs">5</wf.T>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <wf.T size="xs" color="var(--wf-muted)">
            Priced
          </wf.T>
          <wf.T size="xs">4 of 5</wf.T>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <wf.T size="xs" color="var(--wf-muted)">
            Total
          </wf.T>
          <wf.T size="xs" weight={600}>
            71c + 1.8div
          </wf.T>
        </div>
      </div>

      <div
        style={{
          padding: "8px 10px",
          background: "var(--wf-block)",
          border: "1px dashed var(--wf-stroke)",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <wf.Icon ch="✓" size={18} />
        <wf.T size="xs" color="var(--wf-muted)">
          Prove you're human (Turnstile)
        </wf.T>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <wf.BtnGhost label="Cancel" full style={{ height: 36 }} />
        <wf.BtnGold label="Publish" />
      </div>
      <wf.T size="xs" color="var(--wf-muted)" style={{ textAlign: "center" }}>
        Lists are immutable once published.
      </wf.T>
    </div>
  </div>
);

// ─── Settings popover (league pref lives here) ──────────────
const SettingsPopover = () => (
  <div
    style={{
      position: "absolute",
      top: 34,
      right: 8,
      width: 260,
      background: "var(--wf-bg)",
      border: "1px solid var(--wf-stroke)",
      borderRadius: 3,
      boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
      zIndex: 30,
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}
  >
    <div style={{ display: "flex", alignItems: "center" }}>
      <wf.T size="sm" weight={600}>
        Settings
      </wf.T>
      <div style={{ flex: 1 }} />
      <wf.T size="md" color="var(--wf-muted)" style={{ cursor: "pointer" }}>
        ✕
      </wf.T>
    </div>
    <div>
      <wf.T
        size="xs"
        color="var(--wf-muted)"
        style={{ marginBottom: 4, letterSpacing: 0.6, textTransform: "uppercase" }}
      >
        League
      </wf.T>
      <div
        style={{
          border: "1px solid var(--wf-gold-edge)",
          borderRadius: 2,
          padding: "7px 10px",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span>Phrecia SC</span>
        <div style={{ flex: 1 }} />
        <span style={{ opacity: 0.5 }}>⌄</span>
      </div>
      <wf.T size="xs" color="var(--wf-muted)" style={{ marginTop: 4 }}>
        Applied to Trending, publish defaults, and list filters.
      </wf.T>
    </div>
    <div>
      <wf.T
        size="xs"
        color="var(--wf-muted)"
        style={{ marginBottom: 4, letterSpacing: 0.6, textTransform: "uppercase" }}
      >
        Game
      </wf.T>
      <div style={{ display: "flex", gap: 6 }}>
        <div
          style={{
            flex: 1,
            padding: "6px 8px",
            fontSize: 11,
            textAlign: "center",
            border: "1px solid var(--wf-gold-edge)",
            background: "var(--wf-gold-soft)",
            color: "var(--wf-gold-ink-strong)",
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          PoE 1
        </div>
        <div
          style={{
            flex: 1,
            padding: "6px 8px",
            fontSize: 11,
            textAlign: "center",
            border: "1px dashed var(--wf-stroke)",
            color: "var(--wf-muted)",
            borderRadius: 2,
          }}
        >
          PoE 2 · soon
        </div>
      </div>
    </div>
    <div>
      <wf.T
        size="xs"
        color="var(--wf-muted)"
        style={{ marginBottom: 6, letterSpacing: 0.6, textTransform: "uppercase" }}
      >
        Preferences
      </wf.T>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
        {[
          ["Auto-capture price on save", true],
          ["Show capture-unavailable banner", true],
          ["Open items in new tab", false],
        ].map(([l, on]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 26,
                height: 14,
                borderRadius: 7,
                background: on ? "var(--wf-gold)" : "var(--wf-block)",
                border: "1px solid var(--wf-stroke)",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 1,
                  left: on ? 13 : 1,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  background: "var(--wf-bg)",
                  border: "1px solid var(--wf-stroke)",
                }}
              />
            </div>
            <span>{l}</span>
          </div>
        ))}
      </div>
    </div>
    <div
      style={{
        borderTop: "1px solid var(--wf-stroke-soft)",
        paddingTop: 8,
        display: "flex",
        gap: 12,
      }}
    >
      <wf.T size="xs" color="var(--wf-muted)" style={{ cursor: "pointer" }}>
        Privacy
      </wf.T>
      <wf.T size="xs" color="var(--wf-muted)" style={{ cursor: "pointer" }}>
        Help
      </wf.T>
      <div style={{ flex: 1 }} />
      <wf.T size="xs" color="var(--wf-muted)">
        v1.0.0
      </wf.T>
    </div>
  </div>
);

// ─── The refined panel — composes all states ────────────────
function PanelV2({ density, state }) {
  const D = density;
  const tabs = [
    { key: "mine", label: "Mine", badge: 2 },
    { key: "following", label: "Following", badge: 3 },
    { key: "trending", label: "Trending", badge: "🔥" },
  ];

  const activeTab =
    state === "following" || state === "following-empty"
      ? "following"
      : state === "trending"
        ? "trending"
        : "mine";

  const modal =
    state === "save-modal" ? (
      <SaveSearchModal />
    ) : state === "publish-sheet" ? (
      <PublishSheet />
    ) : null;

  const showSettings = state === "settings";

  return (
    <wf.Panel width={380} height={640} style={{ position: "relative" }}>
      <wf.ChromeBar league="Phrecia SC" />
      {showSettings && <SettingsPopover />}
      <TabBar active={activeTab} tabs={tabs} />
      {state === "capture-unavailable" && <CaptureUnavailableBanner />}

      {activeTab === "mine" && state !== "publish-done" && (
        <MineTab
          density={D}
          state={state === "empty" ? "empty" : "draft"}
          showKebab={state === "kebab"}
        />
      )}
      {state === "publish-done" && <PublishConfirmation />}

      {activeTab === "following" && (
        <FollowingTab density={D} state={state === "following-empty" ? "empty" : "list"} />
      )}

      {activeTab === "trending" && <TrendingTab density={D} />}

      {/* Modal overlay */}
      {modal}
    </wf.Panel>
  );
}

// blink keyframe
const style = document.createElement("style");
style.textContent = `@keyframes blink { 50% { opacity: 0; } }`;
document.head.appendChild(style);

Object.assign(window, { PanelV2 });
