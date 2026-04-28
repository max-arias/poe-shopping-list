// How it works + Privacy pages — continuous with V1 homepage

// ══════════════════════════════════════════════════════════════
// Reusable bits (local to info pages)
// ══════════════════════════════════════════════════════════════

const infoPage = {
  PageTitle: ({ eyebrow, title, sub }) => (
    <div
      style={{
        padding: "56px 48px 40px",
        background: "var(--wf-footer-bg)",
        borderBottom: "1px solid var(--wf-stroke-soft)",
      }}
    >
      {eyebrow && (
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
          {eyebrow}
        </div>
      )}
      <div
        style={{
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: -0.5,
          lineHeight: 1.15,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {sub && (
        <div style={{ fontSize: 14, color: "var(--wf-muted)", lineHeight: 1.55, maxWidth: 640 }}>
          {sub}
        </div>
      )}
    </div>
  ),

  H2: ({ id, children, kicker }) => (
    <div id={id} style={{ marginBottom: 16, scrollMarginTop: 72 }}>
      {kicker && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.2,
            color: "var(--wf-gold-ink-strong)",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          {kicker}
        </div>
      )}
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2 }}>
        {children}
      </div>
    </div>
  ),

  P: ({ children, muted, style }) => (
    <p
      style={{
        fontSize: 14,
        lineHeight: 1.65,
        color: muted ? "var(--wf-muted)" : "var(--wf-ink)",
        margin: "0 0 12px",
        maxWidth: 680,
        ...style,
      }}
    >
      {children}
    </p>
  ),

  Section: ({ children, style }) => (
    <section
      style={{
        padding: "40px 48px",
        borderBottom: "1px solid var(--wf-stroke-soft)",
        ...style,
      }}
    >
      {children}
    </section>
  ),

  // Step card — numbered, used in How-it-works
  Step: ({ n, title, children, diagram }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 420px",
        gap: 40,
        alignItems: "start",
        paddingBottom: 40,
        marginBottom: 40,
        borderBottom: "1px dashed var(--wf-stroke-soft)",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 2,
              background: "var(--wf-gold)",
              border: "1px solid var(--wf-gold-edge)",
              color: "var(--wf-gold-ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14,
              fontFamily: "ui-monospace, monospace",
            }}
          >
            {n}
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.2 }}>{title}</div>
        </div>
        <div style={{ paddingLeft: 44 }}>{children}</div>
      </div>
      <div>{diagram}</div>
    </div>
  ),

  // Pill callout
  Callout: ({ tone = "info", title, children }) => {
    const palette =
      tone === "warn"
        ? { bg: "var(--wf-warn-bg)", ink: "var(--wf-warn-ink)", edge: "var(--wf-warn-edge)" }
        : tone === "good"
          ? { bg: "var(--wf-good-bg)", ink: "var(--wf-good-ink)", edge: "var(--wf-good-edge)" }
          : {
              bg: "var(--wf-gold-soft)",
              ink: "var(--wf-gold-ink-strong)",
              edge: "var(--wf-gold-edge)",
            };
    return (
      <div
        style={{
          background: palette.bg,
          border: `1px solid ${palette.edge}`,
          borderLeft: `4px solid ${palette.edge}`,
          borderRadius: 2,
          padding: "14px 16px",
          marginBottom: 16,
          maxWidth: 680,
        }}
      >
        {title && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: palette.ink,
              marginBottom: 4,
            }}
          >
            {title}
          </div>
        )}
        <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--wf-ink)" }}>{children}</div>
      </div>
    );
  },

  // Small sidebar TOC
  TOC: ({ items, active }) => (
    <div
      style={{
        position: "sticky",
        top: 24,
        fontSize: 12,
        padding: "12px 0",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.2,
          color: "var(--wf-muted)",
          textTransform: "uppercase",
          marginBottom: 10,
          paddingLeft: 14,
        }}
      >
        On this page
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            style={{
              padding: "6px 14px",
              color: active === item.href.slice(1) ? "var(--wf-ink)" : "var(--wf-muted)",
              fontWeight: active === item.href.slice(1) ? 600 : 400,
              borderLeft:
                active === item.href.slice(1)
                  ? "2px solid var(--wf-gold)"
                  : "2px solid var(--wf-stroke-soft)",
              textDecoration: "none",
              fontSize: 12,
            }}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  ),
};

// ══════════════════════════════════════════════════════════════
// Diagrams for How-it-works steps (lo-fi SVG/block compositions)
// ══════════════════════════════════════════════════════════════

const diagrams = {
  // Step 1 — build guide detection
  GuideDetected: () => (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 260,
        background: "var(--wf-section-bg)",
        border: "1px solid var(--wf-stroke-soft)",
        borderRadius: 3,
        padding: 14,
      }}
    >
      {/* Fake pobb.in page */}
      <div
        style={{
          background: "#1f1912",
          borderRadius: 2,
          height: "100%",
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 5,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ height: 10, width: 90, background: "#c29a54", borderRadius: 1 }} />
          <div style={{ flex: 1 }} />
          <div style={{ height: 8, width: 50, background: "#3a3226", borderRadius: 1 }} />
        </div>
        <div style={{ height: 6, width: "70%", background: "#3a3226", borderRadius: 1 }} />
        <div style={{ height: 6, width: "55%", background: "#3a3226", borderRadius: 1 }} />
        <div
          style={{
            flex: 1,
            background: "#15110b",
            borderRadius: 1,
            padding: 6,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                height: 4,
                width: `${90 - i * 10}%`,
                background: "#2a2218",
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      </div>
      {/* Extension toast */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "var(--wf-bg)",
          border: "1px solid var(--wf-gold-edge)",
          borderLeft: "3px solid var(--wf-gold)",
          borderRadius: 2,
          padding: "8px 12px",
          fontSize: 10,
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          width: 180,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 2, color: "var(--wf-ink)" }}>
          ⚑ Guide detected
        </div>
        <div style={{ color: "var(--wf-muted)", lineHeight: 1.4, fontSize: 9 }}>
          Boneshatter Slayer by Pohx — 3 lists available
        </div>
      </div>
    </div>
  ),

  // Step 2 — trade page sidebar
  TradeSidebar: () => (
    <div
      style={{
        width: "100%",
        height: 260,
        border: "1px solid var(--wf-stroke-soft)",
        borderRadius: 3,
        overflow: "hidden",
        display: "flex",
        background: "#1f1912",
      }}
    >
      {/* Trade page */}
      <div style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", gap: 3 }}>
          <div style={{ height: 12, width: 60, background: "#2a2218", borderRadius: 1 }} />
          <div style={{ height: 12, width: 80, background: "#2a2218", borderRadius: 1 }} />
          <div style={{ flex: 1 }} />
          <div style={{ height: 12, width: 40, background: "#7a561a", borderRadius: 1 }} />
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
            <div key={i} style={{ height: 4, background: "#231c10", borderRadius: 1 }} />
          ))}
        </div>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              background: "#15110b",
              padding: 5,
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              gap: 5,
              border: "1px solid #2a2218",
            }}
          >
            <div style={{ width: 14, height: 14, background: "#3a3226", borderRadius: 1 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ height: 4, width: "75%", background: "#c29a54", borderRadius: 1 }} />
              <div style={{ height: 3, width: "45%", background: "#3a3226", borderRadius: 1 }} />
            </div>
            <div style={{ width: 34, height: 9, background: "#7a561a", borderRadius: 1 }} />
          </div>
        ))}
      </div>
      {/* Extension sidebar */}
      <div
        style={{
          width: 140,
          background: "var(--wf-bg)",
          borderLeft: "2px solid var(--wf-frame)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: 20,
            background: "var(--wf-chrome)",
            borderBottom: "1px solid var(--wf-stroke)",
            display: "flex",
            alignItems: "center",
            padding: "0 6px",
            gap: 4,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              background: "var(--wf-gold)",
              border: "1px solid var(--wf-gold-edge)",
              borderRadius: 1,
            }}
          />
          <div style={{ fontSize: 8, fontWeight: 700 }}>Shopping List</div>
        </div>
        <div
          style={{
            padding: 6,
            fontSize: 8,
            color: "var(--wf-muted)",
            textTransform: "uppercase",
            fontWeight: 700,
            letterSpacing: 0.3,
          }}
        >
          Boneshatter · 6
        </div>
        {[
          ["Vaal Molten Shell", "14ex", true],
          ["Cyclopean Coil", "45ex", true],
          ["Abyssus", "12ex", false],
          ["Watcher's Eye", "80ex", false],
          ["Blessed Orb", "2c", true],
        ].map(([n, p, c], i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 6px",
              borderBottom: "1px solid var(--wf-stroke-soft)",
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                border: "1px solid var(--wf-stroke)",
                borderRadius: 1,
                background: c ? "var(--wf-gold)" : "transparent",
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
            padding: 5,
            borderTop: "1px solid var(--wf-stroke)",
            background: "var(--wf-footer-bg)",
          }}
        >
          <div
            style={{
              height: 16,
              background: "var(--wf-gold)",
              border: "1px solid var(--wf-gold-edge)",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
              fontWeight: 700,
              color: "var(--wf-gold-ink)",
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            + Save search
          </div>
        </div>
      </div>
    </div>
  ),

  // Step 3 — publishing / sharing
  PublishShare: () => (
    <div
      style={{
        width: "100%",
        height: 260,
        background: "var(--wf-section-bg)",
        border: "1px solid var(--wf-stroke-soft)",
        borderRadius: 3,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        justifyContent: "center",
      }}
    >
      {/* Three cards representing a list being shared */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
        <div
          style={{
            width: 110,
            background: "var(--wf-bg)",
            border: "1px solid var(--wf-stroke-soft)",
            borderRadius: 2,
            padding: 8,
          }}
        >
          <div
            style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: "var(--wf-muted)",
              marginBottom: 4,
            }}
          >
            Your list
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Boneshatter EG</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: 3,
                  width: `${70 + i * 5}%`,
                  background: "var(--wf-stroke-soft)",
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ fontSize: 16, color: "var(--wf-gold-ink-strong)" }}>→</div>

        <div
          style={{
            width: 110,
            background: "var(--wf-gold-soft)",
            border: "1px solid var(--wf-gold-edge)",
            borderRadius: 2,
            padding: 8,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: "var(--wf-gold-ink-strong)",
              marginBottom: 4,
            }}
          >
            Publish
          </div>
          <div
            style={{
              fontSize: 9,
              color: "var(--wf-gold-ink-strong)",
              lineHeight: 1.3,
              fontFamily: "ui-monospace, monospace",
            }}
          >
            poe-shop.app/
            <br />
            b/boneshatter
          </div>
        </div>

        <div style={{ fontSize: 16, color: "var(--wf-gold-ink-strong)" }}>→</div>

        <div
          style={{
            width: 110,
            background: "var(--wf-bg)",
            border: "1px solid var(--wf-stroke-soft)",
            borderRadius: 2,
            padding: 8,
          }}
        >
          <div
            style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: "var(--wf-muted)",
              marginBottom: 4,
            }}
          >
            Others follow
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
            <div
              style={{ width: 10, height: 10, borderRadius: 5, background: "var(--wf-block)" }}
            />
            <div
              style={{ width: 10, height: 10, borderRadius: 5, background: "var(--wf-block)" }}
            />
            <div
              style={{ width: 10, height: 10, borderRadius: 5, background: "var(--wf-block)" }}
            />
            <div style={{ fontSize: 8, color: "var(--wf-muted)" }}>+847</div>
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--wf-gold-ink-strong)",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            ♥ 1,204
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 10,
          color: "var(--wf-muted)",
          textAlign: "center",
          marginTop: 6,
          lineHeight: 1.4,
        }}
      >
        Followers get price updates when items on their list change.
      </div>
    </div>
  ),

  // Privacy — data flow
  DataFlow: () => (
    <div
      style={{
        width: "100%",
        background: "var(--wf-section-bg)",
        border: "1px solid var(--wf-stroke-soft)",
        borderRadius: 3,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "var(--wf-muted)",
          marginBottom: 14,
        }}
      >
        Data flow
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[
          {
            title: "Your browser",
            body: "Saves item filters, list memberships, scroll/price history.",
            note: "Stays local.",
            tone: "good",
          },
          {
            title: "Our server",
            body: "Only holds lists you publish + your PoE account name.",
            note: "OAuth-verified.",
            tone: "info",
          },
          {
            title: "Third parties",
            body: "None. No analytics, no ads, no CDN fingerprinting.",
            note: "Zero.",
            tone: "good",
          },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              background: "var(--wf-bg)",
              border: `1px solid ${c.tone === "good" ? "var(--wf-good-edge)" : "var(--wf-gold-edge)"}`,
              borderRadius: 2,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{c.title}</div>
            <div
              style={{ fontSize: 12, color: "var(--wf-muted)", lineHeight: 1.5, marginBottom: 10 }}
            >
              {c.body}
            </div>
            <div
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                padding: "3px 8px",
                background: c.tone === "good" ? "var(--wf-good-bg)" : "var(--wf-gold-soft)",
                color: c.tone === "good" ? "var(--wf-good-ink)" : "var(--wf-gold-ink-strong)",
                border: `1px solid ${c.tone === "good" ? "var(--wf-good-edge)" : "var(--wf-gold-edge)"}`,
                borderRadius: 2,
              }}
            >
              {c.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ══════════════════════════════════════════════════════════════
// PAGE: How it works
// ══════════════════════════════════════════════════════════════

function HowItWorksPage({ theme, setTheme }) {
  const toc = [
    { href: "#detect", label: "1 · Guide detection" },
    { href: "#save", label: "2 · Save searches" },
    { href: "#prices", label: "3 · Prices refresh" },
    { href: "#publish", label: "4 · Publish & follow" },
    { href: "#why-ext", label: "Why an extension" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <web.Page width={1200} minHeight={1800}>
      <web.Nav activeTab="how" theme={theme} setTheme={setTheme} showLeague={false} />

      <infoPage.PageTitle
        eyebrow="How it works"
        title="From build guide to shopping list in three clicks."
        sub="The extension does one job: watch the pages you already visit (pobb.in, pathofexile.com/trade, poewiki, youtube descriptions) and turn their trade links into organized, trackable shopping lists."
      />

      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 0 }}>
        <aside style={{ borderRight: "1px solid var(--wf-stroke-soft)", padding: "24px 0 48px" }}>
          <infoPage.TOC items={toc} />
        </aside>

        <div>
          <infoPage.Section style={{ paddingTop: 48 }}>
            <infoPage.H2 id="detect" kicker="Step 1">
              You open a build guide — we notice.
            </infoPage.H2>
            <infoPage.Step n="01" title="Guide detection" diagram={<diagrams.GuideDetected />}>
              <infoPage.P>
                When you visit a page with a Path of Building export link (pobb.in, pastebin, the
                official forums, a YouTube description) the extension recognizes it and checks
                whether anyone has already published shopping lists for that build.
              </infoPage.P>
              <infoPage.P>
                A small toast appears with the build name and the lists attached to it. One click
                opens the list on pathofexile.com/trade — all filters pre-applied.
              </infoPage.P>
              <infoPage.Callout tone="info" title="Fully passive">
                If no one has published a list for this guide yet, you still get the guide indexed
                so others searching for it can find your list later.
              </infoPage.Callout>
            </infoPage.Step>
          </infoPage.Section>

          <infoPage.Section style={{ background: "var(--wf-section-bg)" }}>
            <infoPage.H2 id="save" kicker="Step 2">
              Save searches without leaving the trade page.
            </infoPage.H2>
            <infoPage.Step
              n="02"
              title="Save searches into lists"
              diagram={<diagrams.TradeSidebar />}
            >
              <infoPage.P>
                The extension docks a sidebar onto pathofexile.com/trade. Every time you craft a
                search you want to keep, one click adds it to a named list — "Leveling kit",
                "Endgame bossing", "Budget version".
              </infoPage.P>
              <infoPage.P>
                Lists remember filters exactly as you saved them, including stat weights, sockets,
                and affix ranges. Open the list later and the search page reloads with the same
                parameters against live listings.
              </infoPage.P>
              <infoPage.Callout tone="good" title="Keyboard-first">
                <code
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    background: "var(--wf-bg)",
                    padding: "1px 5px",
                    borderRadius: 2,
                  }}
                >
                  Ctrl+S
                </code>{" "}
                saves the current search.{" "}
                <code
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    background: "var(--wf-bg)",
                    padding: "1px 5px",
                    borderRadius: 2,
                  }}
                >
                  Ctrl+Shift+L
                </code>{" "}
                cycles lists. Nothing you had to click before is further away now.
              </infoPage.Callout>
            </infoPage.Step>
          </infoPage.Section>

          <infoPage.Section>
            <infoPage.H2 id="prices" kicker="Step 3">
              Prices quietly refresh as you shop.
            </infoPage.H2>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 980 }}
            >
              <div>
                <infoPage.P>
                  Every time you open a saved search, the live results from pathofexile.com/trade
                  load anyway — that's how the page works. We read them as they arrive and update
                  the list's rolling median in the background. No polling, no crawling, no extra
                  requests.
                </infoPage.P>
                <infoPage.P>
                  Prices on your list are always shown with a{" "}
                  <code
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      background: "var(--wf-section-bg)",
                      padding: "1px 5px",
                      borderRadius: 2,
                    }}
                  >
                    ~
                  </code>{" "}
                  prefix — they're estimates from recent listings, not quotes. A build's total is
                  the sum of estimates, rounded the same way.
                </infoPage.P>
                <infoPage.Callout tone="info" title="No staleness alarms">
                  Prices swing wildly during the first week of a league and settle mid-league. We
                  don't guess which is which — no "stale" warnings, no auto-refresh on lists you
                  aren't using. The estimate you see is from the last time you looked.
                </infoPage.Callout>
              </div>
              <div>
                <div
                  style={{
                    border: "1px solid var(--wf-stroke-soft)",
                    borderRadius: 3,
                    padding: 18,
                    background: "var(--wf-section-bg)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                      color: "var(--wf-muted)",
                    }}
                  >
                    How a refresh happens
                  </div>
                  {[
                    ["You tap", "“Crown of Eyes” in your list"],
                    ["Trade loads", "pathofexile.com/trade runs the saved query"],
                    ["Extension reads", "median of the first N listings, client-side"],
                    ["List updates", "~1.8 div → ~2.1 div, silently"],
                  ].map(([k, v], i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontFamily: "ui-monospace, monospace",
                          color: "var(--wf-muted)",
                          width: 14,
                          lineHeight: 1.5,
                          flexShrink: 0,
                        }}
                      >
                        0{i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--wf-ink)" }}>
                          {k}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--wf-muted)", marginTop: 2 }}>
                          {v}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div
                    style={{
                      marginTop: 4,
                      paddingTop: 10,
                      borderTop: "1px solid var(--wf-stroke-soft)",
                      fontSize: 11,
                      color: "var(--wf-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    The extension never queries trade on its own. Nothing happens in the background.
                    If you haven't opened a search, its price is from last time.
                  </div>
                </div>
              </div>
            </div>
          </infoPage.Section>

          <infoPage.Section style={{ background: "var(--wf-footer-bg)" }}>
            <infoPage.H2 id="publish" kicker="Step 4">
              Publish your list. Others follow.
            </infoPage.H2>
            <infoPage.Step n="03" title="Publish &amp; follow" diagram={<diagrams.PublishShare />}>
              <infoPage.P>
                When a list is ready, "Publish" generates a short link (
                <code style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
                  poe-shop.app/b/boneshatter
                </code>
                ) you can drop into your guide, Discord, or stream overlay.
              </infoPage.P>
              <infoPage.P>
                Anyone who opens the link — with or without the extension — sees the same list of
                saved searches, each one-click-ready to run against live trade.
              </infoPage.P>
              <infoPage.Callout tone="warn" title="OAuth required">
                Publishing requires signing in with your Path of Exile account (standard OAuth — we
                never see your password). Browsing and following are always public, no login needed.
              </infoPage.Callout>
            </infoPage.Step>
          </infoPage.Section>

          {/* Why an extension */}
          <infoPage.Section>
            <infoPage.H2 id="why-ext" kicker="Design decision">
              Why an extension, not just a website?
            </infoPage.H2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <infoPage.P>
                  The moment you leave pathofexile.com/trade, you're out of context. A list on a
                  website means copy-pasting item queries, losing stat weights, and trying to
                  remember which mod roll you cared about.
                </infoPage.P>
                <infoPage.P>
                  The extension lives <i>inside</i> the trade page. It reads and writes the same URL
                  you're already looking at, so a saved search is literally the page state. Nothing
                  is re-interpreted.
                </infoPage.P>
              </div>
              <div>
                <infoPage.Callout tone="info" title="The shorter version">
                  GGG already built the best item search engine. We don't replace it — we just
                  bookmark it, beautifully.
                </infoPage.Callout>
                <infoPage.P muted style={{ fontSize: 12 }}>
                  The website you're on now exists so that people who don't have the extension can
                  browse what exists, discover builds, and hit "install". Every published list is
                  viewable here, but the experience is intentionally worse — it's a preview, not the
                  product.
                </infoPage.P>
              </div>
            </div>
          </infoPage.Section>

          {/* FAQ */}
          <infoPage.Section>
            <infoPage.H2 id="faq">Frequently asked</infoPage.H2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
              {[
                [
                  "Does this work on PoE1 and PoE2?",
                  "Yes. The extension detects which trade page you're on and scopes lists accordingly. You can keep PoE1 and PoE2 lists side-by-side; they never mix.",
                ],
                [
                  "Do prices auto-update?",
                  "Kind of — but only as a side effect of you using the list. When you tap a saved search, pathofexile.com/trade runs it live; the extension reads the results and updates the rolling median for that item in the background. Opening a list is how prices refresh. We never crawl trade, never poll in the background, and never touch items you haven't asked about.",
                ],
                [
                  "Will I get banned for using this?",
                  "No. The extension only reads pages you loaded yourself and stays within GGG's published rate limits. We don't do trade automation, price scraping, or any form of bot-adjacent behavior.",
                ],
                [
                  "Can I edit a list I published?",
                  "Anytime. Edits propagate to followers immediately; a small change-log shows what moved so nobody is surprised by silent edits.",
                ],
                [
                  "What happens at league end?",
                  "Lists scoped to a dying league are archived (still readable, no longer followable). Authors are notified when the new league drops so they can re-publish updated versions.",
                ],
                [
                  "Is there a mobile version?",
                  "No, and probably never. pathofexile.com/trade isn't usable on mobile; we stay where you are.",
                ],
              ].map(([q, a], i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--wf-section-bg)",
                    border: "1px solid var(--wf-stroke-soft)",
                    borderRadius: 2,
                    padding: "14px 18px",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{q}</div>
                  <div style={{ fontSize: 13, color: "var(--wf-muted)", lineHeight: 1.6 }}>{a}</div>
                </div>
              ))}
            </div>
          </infoPage.Section>

          {/* Footer CTA */}
          <div style={{ padding: "48px", textAlign: "center", background: "var(--wf-footer-bg)" }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3, marginBottom: 10 }}>
              Ready to stop copy-pasting trade links?
            </div>
            <div style={{ fontSize: 13, color: "var(--wf-muted)", marginBottom: 20 }}>
              Free, open source, no account needed until you publish.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <web.InstallCTA browser="Chrome" />
              <web.InstallCTA browser="Firefox" />
            </div>
          </div>
        </div>
      </div>
    </web.Page>
  );
}

// ══════════════════════════════════════════════════════════════
// PAGE: Privacy
// ══════════════════════════════════════════════════════════════

function PrivacyPage({ theme, setTheme }) {
  const toc = [
    { href: "#tldr", label: "TL;DR" },
    { href: "#collect", label: "What we collect" },
    { href: "#not-collect", label: "What we don't" },
    { href: "#flow", label: "Data flow" },
    { href: "#rights", label: "Your rights" },
  ];
  return (
    <web.Page width={1200} minHeight={1800}>
      <web.Nav activeTab="privacy" theme={theme} setTheme={setTheme} showLeague={false} />

      <infoPage.PageTitle
        eyebrow="Privacy"
        title="We run a shopping list, not a surveillance business."
        sub="This page is the plain-English version. It's accurate; we don't have a different, scarier legal version hiding somewhere."
      />

      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 0 }}>
        <aside style={{ borderRight: "1px solid var(--wf-stroke-soft)", padding: "24px 0 48px" }}>
          <infoPage.TOC items={toc} />
        </aside>

        <div>
          <infoPage.Section style={{ paddingTop: 48 }}>
            <infoPage.H2 id="tldr">TL;DR</infoPage.H2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 680 }}>
              {[
                [
                  "✓",
                  "Your trade searches, item queries, and scroll history stay in your browser. We never see them.",
                  "good",
                ],
                [
                  "✓",
                  "When you publish a list, we store the list and your PoE account name (from OAuth). That's it.",
                  "good",
                ],
                [
                  "✓",
                  "No analytics, no ad networks, no third-party scripts. The site you're reading loads from one server and nothing else.",
                  "good",
                ],
                ["✗", "We do not sell data. There is no data to sell.", "good"],
                [
                  "✗",
                  "We do not track you across sessions. If you clear cookies, you're anonymous again — unless you sign in, in which case you're just you.",
                  "good",
                ],
              ].map(([icon, text, tone], i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "10px 14px",
                    background: "var(--wf-good-bg)",
                    border: "1px solid var(--wf-good-edge)",
                    borderLeft: "4px solid var(--wf-good-edge)",
                    borderRadius: 2,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--wf-good-ink)",
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--wf-ink)" }}>
                    {text}
                  </div>
                </div>
              ))}
            </div>
          </infoPage.Section>

          <infoPage.Section style={{ background: "var(--wf-section-bg)" }}>
            <infoPage.H2 id="collect">What we collect</infoPage.H2>
            <div style={{ maxWidth: 720 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  marginBottom: 20,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--wf-stroke-soft)" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        fontSize: 10,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        color: "var(--wf-muted)",
                        fontWeight: 700,
                      }}
                    >
                      Field
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        fontSize: 10,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        color: "var(--wf-muted)",
                        fontWeight: 700,
                      }}
                    >
                      Why
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        fontSize: 10,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        color: "var(--wf-muted)",
                        fontWeight: 700,
                        width: 90,
                      }}
                    >
                      When
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      "PoE account name",
                      "Attribution on published lists. Shown publicly.",
                      "You publish",
                    ],
                    [
                      "Shopping list contents",
                      "So others can follow, so you can edit from another device.",
                      "You publish",
                    ],
                    [
                      "Follow count",
                      "Popularity ranking. Aggregated, not per-user.",
                      "Others follow",
                    ],
                    [
                      "OAuth token (short-lived)",
                      "To verify you own the account name you're publishing under.",
                      "You sign in",
                    ],
                    [
                      "Error reports",
                      "If a request fails. Strips URLs, item names, and tokens.",
                      "Something breaks",
                    ],
                  ].map(([f, w, when], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--wf-stroke-soft)" }}>
                      <td style={{ padding: "12px", fontWeight: 600, verticalAlign: "top" }}>
                        {f}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          color: "var(--wf-muted)",
                          lineHeight: 1.5,
                          verticalAlign: "top",
                        }}
                      >
                        {w}
                      </td>
                      <td style={{ padding: "12px", verticalAlign: "top" }}>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "3px 8px",
                            background: "var(--wf-gold-soft)",
                            border: "1px solid var(--wf-gold-edge)",
                            color: "var(--wf-gold-ink-strong)",
                            borderRadius: 2,
                            fontWeight: 600,
                            letterSpacing: 0.3,
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {when}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <infoPage.P muted style={{ fontSize: 12 }}>
                All of the above is deletable by you, from the extension settings or by emailing us.
                Deletion is immediate, not a 30-day soft-delete.
              </infoPage.P>
            </div>
          </infoPage.Section>

          <infoPage.Section>
            <infoPage.H2 id="not-collect">What we don't collect</infoPage.H2>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 720 }}
            >
              {[
                ["Your trade searches", "Filters, stat weights, stash locations — all local."],
                ["Your items", "We never read your stash or inventory."],
                [
                  "Browsing history",
                  "The extension sees the tabs you opted into (PoE trade + guide sites). Nothing else.",
                ],
                ["IP address", "Not stored. Our server logs are rotated hourly."],
                [
                  "Device fingerprints",
                  "No canvas fingerprinting, no font enumeration, no nonsense.",
                ],
                ["Purchase or wealth data", "The extension doesn't know what you bought."],
              ].map(([t, b], i) => (
                <div
                  key={i}
                  style={{
                    padding: 14,
                    background: "var(--wf-section-bg)",
                    border: "1px solid var(--wf-stroke-soft)",
                    borderRadius: 2,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: "var(--wf-good-ink)", marginRight: 6 }}>✗</span>
                    {t}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--wf-muted)",
                      lineHeight: 1.55,
                      paddingLeft: 18,
                    }}
                  >
                    {b}
                  </div>
                </div>
              ))}
            </div>
          </infoPage.Section>

          <infoPage.Section style={{ background: "var(--wf-section-bg)" }}>
            <infoPage.H2 id="flow">Where data goes</infoPage.H2>
            <diagrams.DataFlow />
            <infoPage.P muted style={{ fontSize: 12 }}>
              Our server is a single hetzner box in Germany. No CDN in front of it, no serverless
              platform inspecting requests, no analytics. We pay for it out of pocket.
            </infoPage.P>
          </infoPage.Section>

          <infoPage.Section>
            <infoPage.H2 id="rights">Your rights</infoPage.H2>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 720 }}
            >
              {[
                [
                  "Export",
                  "Download every list you've published as JSON. One click, in extension settings.",
                  "Self-serve",
                ],
                [
                  "Delete",
                  "Purge your account, lists, and OAuth mapping. Instantly. No dark-pattern retention.",
                  "Self-serve",
                ],
                [
                  "Correct",
                  "Edit any list at any time. History is public but editable.",
                  "Self-serve",
                ],
                [
                  "Access",
                  "Email us and we'll send you everything we have tied to your account name.",
                  "48 hours",
                ],
              ].map(([t, b, w], i) => (
                <div
                  key={i}
                  style={{
                    padding: 14,
                    background: "var(--wf-bg)",
                    border: "1px solid var(--wf-stroke-soft)",
                    borderLeft: "3px solid var(--wf-gold)",
                    borderRadius: 2,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t}</div>
                    <div style={{ flex: 1 }} />
                    <div
                      style={{
                        fontSize: 9,
                        padding: "2px 6px",
                        background: "var(--wf-good-bg)",
                        color: "var(--wf-good-ink)",
                        border: "1px solid var(--wf-good-edge)",
                        borderRadius: 2,
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        textTransform: "uppercase",
                      }}
                    >
                      {w}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--wf-muted)", lineHeight: 1.55 }}>
                    {b}
                  </div>
                </div>
              ))}
            </div>
          </infoPage.Section>
        </div>
      </div>
    </web.Page>
  );
}

Object.assign(window, { HowItWorksPage, PrivacyPage, infoPage });
