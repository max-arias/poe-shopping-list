// Five wireframe variations for the PoE Shopping List side panel.
// Each Variation renders a stack of key states (empty → draft → following → modal → publish).
//
// Variations:
//   V1 — Classic stacked IA. Draft section on top, Following below. Tabs-free.
//   V2 — Tabbed IA. "Mine / Following / Publish" tabs at top, single active view.
//   V3 — Folder-tree IA. Collapsible folders (one per list), draft is a pinned top folder.
//   V4 — Modal-first capture. Emphasizes the Save-Search modal as a rich pricing view.
//   V5 — Dashboard IA. Compact summary top (total, freshness), scrollable items below, bottom drawer for Following.

const { wf } = window;

// ── Common bits ─────────────────────────────────────────────

const SectionHdr = ({ label, count, collapsed, action }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 12px",
      background: "var(--wf-section-bg)",
      borderBottom: "1px solid var(--wf-stroke-soft)",
      fontSize: 10,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: "var(--wf-muted)",
    }}
  >
    <span style={{ opacity: 0.7 }}>{collapsed ? "▸" : "▾"}</span>
    <span>{label}</span>
    {count !== undefined && <span style={{ opacity: 0.6, fontWeight: 400 }}>{count}</span>}
    <div style={{ flex: 1 }} />
    {action && (
      <span style={{ fontSize: 10, color: "var(--wf-gold-ink-strong)", cursor: "pointer" }}>
        {action}
      </span>
    )}
  </div>
);

// ── V1 : Classic stacked ────────────────────────────────────
function V1({ density, state }) {
  const D = density;
  // State = 'empty' | 'draft' | 'following' | 'capture-unavailable'
  return (
    <wf.Panel width={380} height={640}>
      <wf.ChromeBar />
      {/* Header */}
      <div
        style={{
          padding: D === "compact" ? "10px 12px" : "14px 14px",
          borderBottom: "1px solid var(--wf-stroke)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <wf.T size="lg" weight={600}>
            My Drafts
          </wf.T>
          <div style={{ flex: 1 }} />
          <wf.Icon ch="+" size={22} />
        </div>
        <wf.T size="xs" color="var(--wf-muted)">
          Active: Penance Brand Hiero
        </wf.T>
      </div>

      {state === "capture-unavailable" && (
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
          <wf.T size="xs" color="var(--wf-warn-ink)">
            Trade capture unavailable.
            <br />
            Check for extension updates.
          </wf.T>
        </div>
      )}

      {/* Draft section */}
      <SectionHdr label="Draft" count="• Penance Brand" action="⋯" />
      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {state === "empty" ? (
          <div
            style={{
              padding: "32px 18px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              textAlign: "center",
            }}
          >
            <wf.Block w={56} h={56} style={{ borderStyle: "dashed", borderRadius: 28 }}>
              shop
            </wf.Block>
            <wf.T size="md" weight={600}>
              Your draft is empty
            </wf.T>
            <wf.T size="sm" color="var(--wf-muted)" style={{ maxWidth: 240 }}>
              Open pathofexile.com/trade, run a search, then come back and tap{" "}
              <b>Save This Search</b>.
            </wf.T>
            <wf.BtnGhost label="Open trade site" icon="→" />
          </div>
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

        {/* Following section */}
        {(state === "following" || state === "draft") && (
          <>
            <SectionHdr label="Following" count={state === "following" ? 3 : 2} action="+ Add" />
            <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--wf-stroke-soft)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <wf.Icon ch="📂" size={18} />
                <div style={{ flex: 1 }}>
                  <wf.T size="sm" weight={600}>
                    Archmage Hiero
                  </wf.T>
                  <wf.T size="xs" color="var(--wf-muted)">
                    @lightee · 12 items · 340c
                  </wf.T>
                </div>
                <div style={{ color: "var(--wf-muted)" }}>▸</div>
              </div>
            </div>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--wf-stroke-soft)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <wf.Icon ch="📂" size={18} />
                <div style={{ flex: 1 }}>
                  <wf.T size="sm" weight={600}>
                    RF Jugg Starter
                  </wf.T>
                  <wf.T size="xs" color="var(--wf-muted)">
                    @mathil · 9 items · 45c
                  </wf.T>
                </div>
                <div style={{ color: "var(--wf-muted)" }}>▸</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer gold CTA */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--wf-stroke)",
          background: "var(--wf-footer-bg)",
        }}
      >
        <wf.BtnGold label="Save This Search" />
      </div>
    </wf.Panel>
  );
}

// ── V2 : Tabbed IA ──────────────────────────────────────────
function V2({ density, state }) {
  const D = density;
  const tab = state === "following" ? "follow" : state === "publish" ? "publish" : "mine";

  return (
    <wf.Panel width={380} height={640}>
      <wf.ChromeBar />
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--wf-stroke)",
          background: "var(--wf-tab-bg)",
        }}
      >
        {["Mine", "Following", "Publish"].map((t, i) => {
          const k = ["mine", "follow", "publish"][i];
          const active = k === tab;
          return (
            <div
              key={t}
              style={{
                flex: 1,
                padding: "12px 0",
                textAlign: "center",
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--wf-gold-ink-strong)" : "var(--wf-muted)",
                borderBottom: active ? "2px solid var(--wf-gold)" : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              {t}
            </div>
          );
        })}
      </div>

      {tab === "mine" && (
        <>
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--wf-stroke-soft)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <wf.Icon ch="★" size={18} />
            <div style={{ flex: 1 }}>
              <wf.T size="sm" weight={600}>
                Penance Brand Hiero
              </wf.T>
              <wf.T size="xs" color="var(--wf-muted)">
                Draft · 5 items · 71c total
              </wf.T>
            </div>
            <wf.BtnGhost label="Switch" />
          </div>
          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {state === "empty" ? (
              <div
                style={{
                  padding: "40px 18px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  alignItems: "center",
                }}
              >
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
                    ["3", "Run a search, tap Save"],
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
              </div>
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
                  name="Crown of Eyes"
                  price="1.8"
                  currency="div"
                  captured="2h ago"
                  checked
                  density={D}
                />
                <wf.Item
                  name="Rathpith Globe"
                  price="12"
                  currency="c"
                  captured="1d ago"
                  density={D}
                />
                <wf.Item name="+1 Phys Amulet" density={D}>
                  <wf.T size="xs" color="var(--wf-muted)">
                    No price yet
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
          </div>
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid var(--wf-stroke)",
              background: "var(--wf-footer-bg)",
            }}
          >
            <wf.BtnGold label="Save This Search" />
          </div>
        </>
      )}

      {tab === "follow" && (
        <div style={{ flex: 1, overflow: "auto" }}>
          {[
            ["Archmage Hiero", "@lightee", 12, "340c", "2h"],
            ["RF Jugg Starter", "@mathil", 9, "45c", "1d"],
            ["LA Deadeye Mapper", "@ziz", 18, "2.1div", "3d"],
          ].map(([t, a, n, p, f]) => (
            <div
              key={t}
              style={{ padding: "12px 14px", borderBottom: "1px solid var(--wf-stroke-soft)" }}
            >
              <div style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
                <wf.T size="md" weight={600}>
                  {t}
                </wf.T>
                <div style={{ flex: 1 }} />
                <wf.T size="xs" color="var(--wf-muted)">
                  {f} ago
                </wf.T>
              </div>
              <wf.T size="xs" color="var(--wf-muted)">
                {a} · {n} items · {p}
              </wf.T>
            </div>
          ))}
          <div style={{ padding: 16 }}>
            <wf.BtnGhost label="+ Paste list URL" full />
          </div>
        </div>
      )}

      {tab === "publish" && (
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <wf.T size="md" weight={600}>
            Publish draft
          </wf.T>
          <div>
            <wf.T size="xs" color="var(--wf-muted)" style={{ marginBottom: 4 }}>
              TITLE
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
            <wf.T size="xs" color="var(--wf-muted)" style={{ marginBottom: 4 }}>
              LEAGUE
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
            <wf.T size="xs" color="var(--wf-muted)" style={{ marginBottom: 4 }}>
              BUILD URL (optional)
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
              pobb.in/…
            </div>
          </div>
          <wf.Rule />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <wf.T size="sm" color="var(--wf-muted)">
                Items
              </wf.T>
              <wf.T size="sm">5</wf.T>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <wf.T size="sm" color="var(--wf-muted)">
                Priced
              </wf.T>
              <wf.T size="sm">4 of 5</wf.T>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <wf.T size="sm" color="var(--wf-muted)">
                Total
              </wf.T>
              <wf.T size="sm" weight={600}>
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
          <wf.BtnGold label="Publish List" />
          <wf.T size="xs" color="var(--wf-muted)" style={{ textAlign: "center" }}>
            Lists are immutable once published.
          </wf.T>
        </div>
      )}
    </wf.Panel>
  );
}

// ── V3 : Folder tree ────────────────────────────────────────
function V3({ density, state }) {
  const D = density;
  const Folder = ({ name, meta, open, children, pinned, dot }) => (
    <>
      <div
        style={{
          padding: D === "compact" ? "6px 10px" : "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: pinned ? "var(--wf-section-bg)" : "transparent",
          borderBottom: "1px solid var(--wf-stroke-soft)",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 10, opacity: 0.6, width: 10 }}>{open ? "▾" : "▸"}</span>
        {dot && (
          <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--wf-gold)" }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <wf.T size="sm" weight={600}>
            {name}
          </wf.T>
          {meta && (
            <wf.T size="xs" color="var(--wf-muted)">
              {meta}
            </wf.T>
          )}
        </div>
        {pinned && <wf.Pill tone="gold">DRAFT</wf.Pill>}
        <div style={{ color: "var(--wf-muted)" }}>⋯</div>
      </div>
      {open && <div style={{ paddingLeft: 0 }}>{children}</div>}
    </>
  );
  return (
    <wf.Panel width={380} height={640}>
      <wf.ChromeBar />
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid var(--wf-stroke)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <wf.T size="md" weight={600}>
          Shopping Lists
        </wf.T>
        <div style={{ flex: 1 }} />
        <wf.Icon ch="+" size={22} />
        <wf.Icon ch="↓" size={22} />
      </div>

      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        <Folder name="Penance Brand Hiero" meta="5 items · 71c · unsaved" open pinned dot>
          {state === "empty" ? (
            <div style={{ padding: "20px 30px", textAlign: "center" }}>
              <wf.T size="sm" color="var(--wf-muted)">
                No saved searches yet. Tap the gold button below while on a trade search.
              </wf.T>
            </div>
          ) : (
            <>
              <wf.Item
                name="Grey Wind Spectral Axe"
                price="45"
                currency="c"
                captured="2h"
                checked
                density={D}
              />
              <wf.Item
                name="Crown of Eyes"
                price="1.8"
                currency="div"
                captured="2h"
                checked
                density={D}
              />
              <wf.Item name="Rathpith Globe" price="12" currency="c" captured="1d" density={D} />
              <wf.Item name="+1 Phys Amulet" density={D} />
            </>
          )}
        </Folder>
        <Folder
          name="Archmage Hiero"
          meta="@lightee · 12 items · 340c · following"
          open={state === "following"}
        >
          {state === "following" && (
            <>
              <wf.Item name="Mjölner" price="320" currency="c" captured="2h" density={D} />
              <wf.Item
                name="The Annihilating Light"
                price="8"
                currency="c"
                captured="2h"
                density={D}
              />
              <wf.Item name="Indigon" price="2.5" currency="div" captured="2h" density={D} />
            </>
          )}
        </Folder>
        <Folder name="RF Jugg Starter" meta="@mathil · 9 items · 45c · following" />
        <Folder name="LA Deadeye Mapper" meta="@ziz · 18 items · 2.1div · following" />
      </div>

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
        <wf.BtnGold label="Save This Search → Draft" />
      </div>
    </wf.Panel>
  );
}

// ── V4 : Modal-first capture ────────────────────────────────
function V4({ density, state }) {
  const D = density;
  const showModal = state === "modal";
  return (
    <wf.Panel width={380} height={640}>
      <wf.ChromeBar />
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--wf-stroke)" }}>
        <wf.T size="lg" weight={600}>
          Penance Brand Hiero
        </wf.T>
        <wf.T size="xs" color="var(--wf-muted)">
          Draft · 5 items · 71c total · last capture 2h ago
        </wf.T>
      </div>

      {/* list area or modal */}
      <div style={{ flex: 1, overflow: "auto", minHeight: 0, position: "relative" }}>
        <wf.Item
          name="Grey Wind Spectral Axe"
          price="45"
          currency="c"
          captured="2h ago"
          checked
          density={D}
        />
        <wf.Item
          name="Crown of Eyes"
          price="1.8"
          currency="div"
          captured="2h ago"
          checked
          density={D}
        />
        <wf.Item name="Rathpith Globe" price="12" currency="c" captured="1d ago" density={D} />
        <wf.Item name="+1 Phys Amulet" density={D}>
          <wf.T size="xs" color="var(--wf-muted)">
            No price captured
          </wf.T>
        </wf.Item>

        {showModal && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "flex-end",
              padding: 0,
            }}
          >
            <div
              style={{
                width: "100%",
                background: "var(--wf-bg)",
                borderTop: "2px solid var(--wf-gold)",
                boxShadow: "0 -4px 16px rgba(0,0,0,0.2)",
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
                <wf.T size="lg" color="var(--wf-muted)">
                  ✕
                </wf.T>
              </div>

              <div>
                <wf.T size="xs" color="var(--wf-muted)" style={{ marginBottom: 4 }}>
                  NAME
                </wf.T>
                <div
                  style={{
                    border: "1px solid var(--wf-gold-edge)",
                    background: "var(--wf-bg)",
                    borderRadius: 2,
                    padding: "8px 10px",
                    fontSize: 13,
                  }}
                >
                  Crown of Eyes · +1 phys spell
                </div>
                <wf.T size="xs" color="var(--wf-muted)" style={{ marginTop: 4 }}>
                  Auto-filled from trade search bar
                </wf.T>
              </div>

              {/* captured price preview */}
              <div
                style={{
                  border: "1px solid var(--wf-stroke)",
                  borderRadius: 2,
                  padding: 10,
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 10,
                  background: "var(--wf-section-bg)",
                }}
              >
                {[
                  ["MIN", "1.6", "div"],
                  ["MEDIAN", "1.8", "div"],
                  ["AVG", "2.1", "div"],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <wf.T size="xs" color="var(--wf-muted)">
                      {l}
                    </wf.T>
                    <wf.T
                      size="lg"
                      weight={600}
                      color="var(--wf-gold-ink-strong)"
                      style={{ fontFamily: "ui-monospace, monospace" }}
                    >
                      {v}
                      <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2 }}>{c}</span>
                    </wf.T>
                  </div>
                ))}
              </div>
              <wf.T size="xs" color="var(--wf-muted)">
                Captured 24 listings · dominant currency: divine · 2 outliers in chaos
              </wf.T>

              <div style={{ display: "flex", gap: 8 }}>
                <wf.BtnGhost label="Name only" full />
                <wf.BtnGold label="Save with price" />
              </div>
            </div>
          </div>
        )}
      </div>

      {!showModal && (
        <div
          style={{
            padding: "10px 12px",
            borderTop: "1px solid var(--wf-stroke)",
            background: "var(--wf-footer-bg)",
          }}
        >
          <wf.BtnGold label="Save This Search" />
        </div>
      )}
    </wf.Panel>
  );
}

// ── V5 : Dashboard ──────────────────────────────────────────
function V5({ density, state }) {
  const D = density;
  return (
    <wf.Panel width={380} height={640}>
      <wf.ChromeBar />
      {/* Dashboard strip */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--wf-stroke)",
          background: "var(--wf-section-bg)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <wf.T size="md" weight={600}>
            Penance Brand Hiero
          </wf.T>
          <wf.Pill tone="gold">DRAFT</wf.Pill>
          <div style={{ flex: 1 }} />
          <wf.Icon ch="⌄" size={20} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            ["TOTAL", "71c", ""],
            ["PRICED", "4/5", ""],
            ["FRESHEST", "2h", "ago"],
          ].map(([l, v, s]) => (
            <div
              key={l}
              style={{
                border: "1px solid var(--wf-stroke)",
                borderRadius: 2,
                padding: "6px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                background: "var(--wf-bg)",
              }}
            >
              <wf.T size="xs" color="var(--wf-muted)">
                {l}
              </wf.T>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <wf.T
                  size="lg"
                  weight={600}
                  color="var(--wf-gold-ink-strong)"
                  style={{ fontFamily: "ui-monospace, monospace" }}
                >
                  {v}
                </wf.T>
                <wf.T size="xs" color="var(--wf-muted)">
                  {s}
                </wf.T>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* progress: priced vs unpriced */}
      <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--wf-stroke-soft)" }}>
        <div
          style={{
            height: 6,
            background: "var(--wf-block)",
            borderRadius: 3,
            overflow: "hidden",
            display: "flex",
          }}
        >
          <div style={{ width: "80%", background: "var(--wf-gold)" }} />
        </div>
        <wf.T size="xs" color="var(--wf-muted)" style={{ marginTop: 4 }}>
          4 of 5 items priced
        </wf.T>
      </div>

      {/* items */}
      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {state === "empty" ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <wf.T size="sm" color="var(--wf-muted)">
              No items yet. Run a trade search to get started.
            </wf.T>
          </div>
        ) : (
          <>
            <wf.Item
              name="Grey Wind Spectral Axe"
              price="45"
              currency="c"
              captured="2h · 18 listings"
              checked
              density={D}
            />
            <wf.Item
              name="Crown of Eyes"
              price="1.8"
              currency="div"
              captured="2h · 24 listings"
              checked
              density={D}
            />
            <wf.Item
              name="Rathpith Globe"
              price="12"
              currency="c"
              captured="1d · 9 listings"
              density={D}
            />
            <wf.Item name="+1 Phys Amulet" density={D}>
              <wf.T size="xs" color="var(--wf-warn-ink)">
                ⚠ no price captured
              </wf.T>
            </wf.Item>
            <wf.Item
              name="Life Flask of Staunching"
              price="3"
              currency="c"
              captured="3h · 50+"
              density={D}
            />
          </>
        )}
      </div>

      {/* Following drawer */}
      <div style={{ borderTop: "1px solid var(--wf-stroke)" }}>
        <div
          style={{
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--wf-footer-bg)",
            cursor: "pointer",
          }}
        >
          <span style={{ opacity: 0.6 }}>▴</span>
          <wf.T size="xs" weight={600} style={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
            Following
          </wf.T>
          <wf.Pill tone="neutral">3</wf.Pill>
          <div style={{ flex: 1 }} />
          <wf.T size="xs" color="var(--wf-muted)">
            Archmage, RF Jugg, +1
          </wf.T>
        </div>
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--wf-stroke)" }}>
          <wf.BtnGold label="Save This Search" />
        </div>
      </div>
    </wf.Panel>
  );
}

Object.assign(window, { V1, V2, V3, V4, V5 });
