// List detail view — 3 variations, Mine + Following modes.
// Entry: full replace of panel content with breadcrumb above.
//
// Prices shown with ~ prefix — they're rolling medians, auto-updated silently
// whenever the user opens the exact saved search (we get the listings anyway).

const { wf } = window;

// ─── Breadcrumb header ───────────────────────────────────────
const DetailHeader = ({ mode, density }) => {
  const isMine = mode === "mine";
  return (
    <div
      style={{
        padding: density === "compact" ? "8px 10px 10px" : "10px 12px 12px",
        borderBottom: "1px solid var(--wf-stroke-soft)",
        background: "var(--wf-section-bg)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "var(--wf-muted)",
        }}
      >
        <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 13, lineHeight: 1 }}>‹</span>
          <span>{isMine ? "Mine" : "Following"}</span>
        </span>
        <span style={{ opacity: 0.5 }}>/</span>
        <span
          style={{
            color: "var(--wf-ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Penance Brand Hiero
        </span>
        <div style={{ flex: 1 }} />
        <div
          style={{ padding: "0 2px", fontSize: 14, color: "var(--wf-muted)", cursor: "pointer" }}
        >
          ⋯
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <wf.T size="lg" weight={600}>
            Penance Brand Hiero
          </wf.T>
          {isMine ? <wf.Pill tone="gold">DRAFT</wf.Pill> : <wf.Pill tone="good">FOLLOWING</wf.Pill>}
        </div>
        <wf.T size="xs" color="var(--wf-muted)" style={{ marginTop: 3 }}>
          {isMine
            ? "5 items · ~71c + ~1.8div · prices refresh on open"
            : "by @lightee · 14 items · ~4.2 div · prices refresh on open"}
        </wf.T>
      </div>
    </div>
  );
};

// ─── Shared item data ──────────────────────────────────────
const ITEMS = [
  {
    name: "Grey Wind Spectral Axe",
    slot: "Weapons",
    price: "45",
    cur: "c",
    checked: true,
    samples: "112 listings",
  },
  {
    name: "Crown of Eyes (Hubris Circlet)",
    slot: "Armour",
    price: "1.8",
    cur: "div",
    checked: true,
    samples: "24 listings",
  },
  {
    name: "Rathpith Globe (Titanium)",
    slot: "Armour",
    price: "12",
    cur: "c",
    samples: "48 listings",
  },
  {
    name: "+1 Phys Spell Skills Amulet",
    slot: "Jewelry",
    price: null,
    cur: null,
    samples: "no filter captured yet",
  },
  {
    name: "Life Flask of Staunching",
    slot: "Flasks",
    price: "3",
    cur: "c",
    samples: "900+ listings",
  },
  {
    name: "Blasphemy Precision Watcher's Eye",
    slot: "Jewels",
    price: "2.4",
    cur: "div",
    samples: "8 listings",
  },
  {
    name: "Thread of Hope (Medium)",
    slot: "Jewels",
    price: "40",
    cur: "c",
    samples: "220 listings",
  },
];

// ~ prefix conveys approximation. Used everywhere prices render.
const Price = ({ value, cur, muted, size = 13 }) => (
  <div
    style={{
      fontSize: size,
      fontWeight: 600,
      color: muted ? "var(--wf-muted)" : "var(--wf-gold-ink-strong)",
      fontFamily: "ui-monospace, monospace",
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ opacity: 0.55, marginRight: 1 }}>~</span>
    {value}
    <span style={{ opacity: 0.7, marginLeft: 2 }}>{cur}</span>
  </div>
);

// ─── V1 — CHECKLIST-FIRST ──────────────────────────────────
const V1Checklist = ({ mode, density }) => (
  <>
    <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
      {ITEMS.map((it, idx) => (
        <div
          key={idx}
          style={{
            padding: density === "compact" ? "8px 12px" : "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid var(--wf-stroke-soft)",
            opacity: it.checked ? 0.55 : 1,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              flexShrink: 0,
              border: "1.5px solid var(--wf-stroke)",
              borderRadius: 2,
              background: it.checked ? "var(--wf-gold)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--wf-gold-ink)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {it.checked && "✓"}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--wf-ink)",
                textDecoration: it.checked ? "line-through" : "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {it.name}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
              <wf.T size="xs" color="var(--wf-muted)">
                {it.slot}
              </wf.T>
              {!it.price && <wf.Pill tone="neutral">NO FILTER</wf.Pill>}
            </div>
          </div>

          {it.price && <Price value={it.price} cur={it.cur} muted={it.checked} />}
          <div
            style={{ color: "var(--wf-muted)", fontSize: 14, cursor: "pointer", padding: "0 2px" }}
          >
            ›
          </div>
        </div>
      ))}
    </div>
    <DetailFooter mode={mode} />
  </>
);

// ─── V2 — SLOT-GROUPED ─────────────────────────────────────
const V2Grouped = ({ mode, density }) => {
  const groups = ITEMS.reduce((acc, it) => {
    (acc[it.slot] ||= []).push(it);
    return acc;
  }, {});
  const slotOrder = ["Weapons", "Armour", "Jewelry", "Jewels", "Flasks"];
  const openByDefault = ["Weapons", "Armour", "Jewelry"];

  return (
    <>
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid var(--wf-stroke-soft)",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}
      >
        {[
          ["BOUGHT", "2/7"],
          ["TOTAL", "~4.3 div"],
          ["REMAINING", "~2.5 div"],
        ].map(([l, v]) => (
          <div key={l}>
            <wf.T
              size="xs"
              color="var(--wf-muted)"
              style={{ textTransform: "uppercase", letterSpacing: 0.6 }}
            >
              {l}
            </wf.T>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "ui-monospace, monospace",
                color: "var(--wf-gold-ink-strong)",
                marginTop: 2,
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {slotOrder.map((slot) => {
          const items = groups[slot] || [];
          if (!items.length) return null;
          const open = openByDefault.includes(slot);
          const checkedInGroup = items.filter((i) => i.checked).length;
          return (
            <div key={slot}>
              <div
                style={{
                  padding: "8px 12px",
                  background: "var(--wf-tab-bg)",
                  borderBottom: "1px solid var(--wf-stroke-soft)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 10, color: "var(--wf-muted)", width: 10 }}>
                  {open ? "▾" : "▸"}
                </span>
                <wf.T
                  size="xs"
                  weight={600}
                  style={{ textTransform: "uppercase", letterSpacing: 0.6 }}
                >
                  {slot}
                </wf.T>
                <div style={{ flex: 1 }} />
                <wf.T
                  size="xs"
                  color="var(--wf-muted)"
                  style={{ fontFamily: "ui-monospace, monospace" }}
                >
                  {checkedInGroup}/{items.length}
                </wf.T>
              </div>
              {open &&
                items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: density === "compact" ? "8px 12px 8px 26px" : "10px 12px 10px 26px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      borderBottom: "1px solid var(--wf-stroke-soft)",
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        flexShrink: 0,
                        border: "1px solid var(--wf-stroke)",
                        borderRadius: 2,
                        background: it.checked ? "var(--wf-gold)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--wf-gold-ink)",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {it.checked && "✓"}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--wf-ink)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {it.name}
                      </div>
                      {!it.price && (
                        <wf.T size="xs" color="var(--wf-muted)">
                          no filter captured
                        </wf.T>
                      )}
                    </div>
                    {it.price && <Price value={it.price} cur={it.cur} size={12} />}
                  </div>
                ))}
            </div>
          );
        })}
      </div>
      <DetailFooter mode={mode} />
    </>
  );
};

// ─── V3 — FEED WITH EXPANDABLE ROWS ────────────────────────
const V3Expandable = ({ mode, density, expandedIndex = 2 }) => (
  <>
    <div
      style={{
        padding: "8px 12px",
        borderBottom: "1px solid var(--wf-stroke-soft)",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <wf.BtnGhost
        label="All"
        style={{
          borderStyle: "solid",
          borderColor: "var(--wf-gold-edge)",
          background: "var(--wf-gold-soft)",
          color: "var(--wf-gold-ink-strong)",
          fontWeight: 600,
        }}
      />
      <wf.BtnGhost label="To buy · 5" />
      <wf.BtnGhost label="Unpriced · 1" />
      <div style={{ flex: 1 }} />
      <wf.T size="xs" color="var(--wf-muted)">
        sort: slot
      </wf.T>
    </div>

    <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
      {ITEMS.map((it, idx) => {
        const expanded = idx === expandedIndex;
        return (
          <div
            key={idx}
            style={{
              borderBottom: "1px solid var(--wf-stroke-soft)",
              background: expanded ? "var(--wf-section-bg)" : "transparent",
            }}
          >
            <div
              style={{
                padding: density === "compact" ? "9px 12px" : "12px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  flexShrink: 0,
                  border: "1px solid var(--wf-stroke)",
                  borderRadius: 2,
                  background: it.checked ? "var(--wf-gold)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--wf-gold-ink)",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {it.checked && "✓"}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--wf-ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {it.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <wf.T size="xs" color="var(--wf-muted)">
                    {it.slot}
                  </wf.T>
                  <span
                    style={{ width: 2, height: 2, borderRadius: 1, background: "var(--wf-stroke)" }}
                  />
                  <wf.T size="xs" color="var(--wf-muted)">
                    {it.samples}
                  </wf.T>
                </div>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}
              >
                {it.price ? (
                  <Price value={it.price} cur={it.cur} />
                ) : (
                  <wf.Pill tone="neutral">UNPRICED</wf.Pill>
                )}
              </div>

              <div
                style={{
                  color: "var(--wf-muted)",
                  fontSize: 12,
                  paddingLeft: 2,
                  width: 10,
                  textAlign: "center",
                }}
              >
                {expanded ? "▴" : "▾"}
              </div>
            </div>

            {expanded && (
              <div
                style={{
                  padding: "0 12px 12px 36px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    border: "1px dashed var(--wf-stroke)",
                    borderRadius: 2,
                    padding: 8,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 4,
                    background: "var(--wf-bg)",
                  }}
                >
                  <wf.Pill tone="gold">Titanium Base</wf.Pill>
                  <wf.Pill tone="neutral">Spell Crit 40+</wf.Pill>
                  <wf.Pill tone="neutral">Life 90+</wf.Pill>
                  <wf.Pill tone="neutral">iLvl ≥ 84</wf.Pill>
                  <wf.Pill tone="warn">price ≤ 20c</wf.Pill>
                </div>
                <wf.T size="xs" color="var(--wf-muted)" style={{ fontStyle: "italic" }}>
                  Opening this search in trade will silently refresh its price.
                </wf.T>
                <div style={{ display: "flex", gap: 6 }}>
                  <wf.BtnGhost
                    label="Open in trade →"
                    full
                    style={{
                      borderStyle: "solid",
                      borderColor: "var(--wf-gold-edge)",
                      background: "var(--wf-gold-soft)",
                      color: "var(--wf-gold-ink-strong)",
                      fontWeight: 600,
                    }}
                  />
                  {mode === "mine" ? <wf.BtnGhost label="Edit" /> : <wf.BtnGhost label="Copy" />}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
    <DetailFooter mode={mode} />
  </>
);

// ─── Shared footer ─────────────────────────────────────────
const DetailFooter = ({ mode }) => {
  if (mode === "mine") {
    return (
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
        <wf.BtnGhost
          label="Publish ▸"
          full
          style={{
            borderStyle: "solid",
            borderColor: "var(--wf-gold-edge)",
            color: "var(--wf-gold-ink-strong)",
            height: 32,
          }}
        />
      </div>
    );
  }
  return (
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
      <wf.BtnGhost
        label="Copy to Mine"
        full
        style={{
          borderStyle: "solid",
          borderColor: "var(--wf-gold-edge)",
          background: "var(--wf-gold-soft)",
          color: "var(--wf-gold-ink-strong)",
          fontWeight: 600,
          height: 32,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <wf.T size="xs" color="var(--wf-muted)">
          by @lightee · 312 follows
        </wf.T>
        <div style={{ flex: 1 }} />
        <wf.T size="xs" color="var(--wf-muted)" style={{ cursor: "pointer" }}>
          Unfollow
        </wf.T>
      </div>
    </div>
  );
};

// ─── Composer ──────────────────────────────────────────────
function DetailPanel({ density, variation, mode }) {
  return (
    <wf.Panel width={380} height={640}>
      <wf.ChromeBar league="Phrecia SC" />
      <DetailHeader mode={mode} density={density} />
      {variation === "v1" && <V1Checklist mode={mode} density={density} />}
      {variation === "v2" && <V2Grouped mode={mode} density={density} />}
      {variation === "v3" && <V3Expandable mode={mode} density={density} />}
    </wf.Panel>
  );
}

Object.assign(window, { DetailPanel });
