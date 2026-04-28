// Web primitives — marketing-site lo-fi blocks that sit on top of `wf`.
// Reuses variables from primitives.jsx (wf) + its CSS vars (--wf-*).

const web = {
  // Page frame — the full browser page wrapper
  Page: ({ children, width = 1200, minHeight = 1400, style }) => (
    <div
      style={{
        width,
        minHeight,
        background: "var(--wf-bg)",
        color: "var(--wf-ink)",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {children}
    </div>
  ),

  // Top nav
  Nav: ({
    activeTab = "builds",
    theme = "light",
    setTheme,
    league = "Phrecia SC",
    setLeague,
    showLeague = true,
  }) => (
    <div
      style={{
        height: 56,
        borderBottom: "1px solid var(--wf-stroke)",
        background: "var(--wf-chrome)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 14,
        flexShrink: 0,
      }}
    >
      <a
        href="Website Wireframes.html"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            background: "var(--wf-gold)",
            border: "1px solid var(--wf-gold-edge)",
            borderRadius: 2,
          }}
        />
        <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: 0.2 }}>PoE Shopping List</div>
      </a>
      <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
        {[
          { key: "builds", label: "Builds", href: "Website Wireframes.html" },
          { key: "how", label: "How it works", href: "Website Info Pages.html#how" },
          { key: "privacy", label: "Privacy", href: "Website Info Pages.html#privacy" },
        ].map((t) => {
          const active = t.key === activeTab;
          return (
            <a
              key={t.key}
              href={t.href}
              style={{
                padding: "6px 10px",
                fontSize: 12,
                color: active ? "var(--wf-ink)" : "var(--wf-muted)",
                fontWeight: active ? 600 : 400,
                borderBottom: active ? "2px solid var(--wf-gold)" : "2px solid transparent",
                textDecoration: "none",
              }}
            >
              {t.label}
            </a>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      {/* League selector */}
      {showLeague && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            background: "var(--wf-gold-soft)",
            border: "1px solid var(--wf-gold-edge)",
            borderRadius: 2,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--wf-gold-ink-strong)",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 10 }}>⚑</span>
          <span style={{ letterSpacing: 0.3, textTransform: "uppercase" }}>{league}</span>
          <span style={{ opacity: 0.6, fontSize: 9 }}>⌄</span>
        </div>
      )}
      {/* Theme toggle */}
      <div
        onClick={() => setTheme && setTheme(theme === "light" ? "dark" : "light")}
        style={{
          width: 30,
          height: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--wf-stroke)",
          borderRadius: 2,
          fontSize: 13,
          color: "var(--wf-ink)",
          cursor: "pointer",
          background: "transparent",
        }}
        title={theme === "light" ? "Switch to dark" : "Switch to light"}
      >
        {theme === "light" ? "☾" : "☀"}
      </div>
    </div>
  ),

  // Big CTA button (hero install)
  InstallCTA: ({ browser = "Chrome", size = "lg" }) => {
    const h = size === "lg" ? 54 : 40;
    return (
      <div
        style={{
          height: h,
          padding: "0 20px",
          background: "var(--wf-gold)",
          border: "1px solid var(--wf-gold-edge)",
          borderRadius: 2,
          color: "var(--wf-gold-ink)",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontWeight: 700,
          fontSize: size === "lg" ? 15 : 13,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          cursor: "pointer",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 0 rgba(0,0,0,0.25)",
        }}
      >
        <span style={{ fontSize: 18 }}>⬇</span>
        Add to {browser}
      </div>
    );
  },

  // Filter chip row
  FilterBar: ({ filters = [], compact }) => (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
        padding: compact ? "8px 0" : "12px 0",
      }}
    >
      {filters.map((f, i) => (
        <div
          key={i}
          style={{
            height: 30,
            padding: "0 12px",
            background: f.active ? "var(--wf-gold-soft)" : "var(--wf-section-bg)",
            border: `1px solid ${f.active ? "var(--wf-gold-edge)" : "var(--wf-stroke-soft)"}`,
            borderRadius: 2,
            fontSize: 11,
            fontWeight: f.active ? 600 : 400,
            color: f.active ? "var(--wf-gold-ink-strong)" : "var(--wf-ink)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
        >
          {f.icon && <span style={{ opacity: 0.6 }}>{f.icon}</span>}
          {f.label}
          {f.count !== undefined && <span style={{ opacity: 0.6, fontSize: 10 }}>· {f.count}</span>}
          {f.caret && <span style={{ opacity: 0.5, marginLeft: 2 }}>⌄</span>}
        </div>
      ))}
    </div>
  ),

  // Search input
  Search: ({ placeholder = "Search builds, classes, skills…", width = "100%", size = "md" }) => {
    const h = size === "lg" ? 48 : 36;
    return (
      <div
        style={{
          width,
          height: h,
          background: "var(--wf-bg)",
          border: "1px solid var(--wf-stroke)",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 10,
        }}
      >
        <span style={{ color: "var(--wf-muted)", fontSize: size === "lg" ? 18 : 14 }}>🔍</span>
        <div style={{ color: "var(--wf-muted)", fontSize: size === "lg" ? 14 : 12, flex: 1 }}>
          {placeholder}
        </div>
        <kbd
          style={{
            fontSize: 10,
            padding: "2px 6px",
            background: "var(--wf-pill-bg)",
            border: "1px solid var(--wf-stroke-soft)",
            borderRadius: 2,
            color: "var(--wf-muted)",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          ⌘K
        </kbd>
      </div>
    );
  },

  // Section heading
  H2: ({ children, sub, action, style }) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14, ...style }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.2 }}>{children}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--wf-muted)" }}>{sub}</div>}
      <div style={{ flex: 1 }} />
      {action}
    </div>
  ),

  // Build card — the heart of the homepage.
  // Ascendancy icon, build name, author, external guide link,
  // league badge, and a stack of shopping list chips.
  BuildCard: ({ build, style, variant = "default" }) => {
    const { name, ascendancy, author, guide, league, game, lists = [], trending } = build;
    return (
      <div
        style={{
          background: "var(--wf-section-bg)",
          border: "1px solid var(--wf-stroke-soft)",
          borderRadius: 3,
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          position: "relative",
          ...style,
        }}
      >
        {trending && (
          <div
            style={{
              position: "absolute",
              top: -8,
              right: 10,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.5,
              background: "var(--wf-gold)",
              color: "var(--wf-gold-ink)",
              border: "1px solid var(--wf-gold-edge)",
              padding: "2px 6px",
              borderRadius: 2,
              textTransform: "uppercase",
            }}
          >
            ↑ Trending
          </div>
        )}

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          {/* Ascendancy icon placeholder */}
          <div
            style={{
              width: 44,
              height: 44,
              background: "var(--wf-block)",
              border: "1px solid var(--wf-stroke)",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--wf-muted)",
              fontFamily: "ui-monospace, monospace",
              flexShrink: 0,
            }}
          >
            {ascendancy
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--wf-ink)", lineHeight: 1.2 }}>
              {name}
            </div>
            <div style={{ fontSize: 11, color: "var(--wf-muted)", marginTop: 3 }}>
              {ascendancy} · by <span style={{ color: "var(--wf-ink)" }}>{author}</span>
            </div>
          </div>
          {game && (
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.3,
                padding: "2px 5px",
                background: "transparent",
                border: "1px solid var(--wf-stroke-soft)",
                color: "var(--wf-muted)",
                borderRadius: 2,
                flexShrink: 0,
              }}
            >
              {game}
            </div>
          )}
        </div>

        {/* Meta row — build guide link (clickable to external guide) */}
        {guide && (
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{
              fontSize: 11,
              color: "var(--wf-ink)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 8px",
              background: "var(--wf-bg)",
              border: "1px solid var(--wf-stroke-soft)",
              borderRadius: 2,
              textDecoration: "none",
              alignSelf: "flex-start",
              cursor: "pointer",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--wf-gold-edge)";
              e.currentTarget.style.color = "var(--wf-gold-ink-strong)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--wf-stroke-soft)";
              e.currentTarget.style.color = "var(--wf-ink)";
            }}
            title={`Open build guide — ${guide}`}
          >
            <span style={{ opacity: 0.6 }}>⇗</span>
            <span>Build guide</span>
            <span
              style={{
                color: "var(--wf-muted)",
                fontSize: 10,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {guide}
            </span>
          </a>
        )}

        {/* Shopping lists attached (or empty state) */}
        <div
          style={{
            borderTop: "1px dashed var(--wf-stroke-soft)",
            paddingTop: 10,
            marginTop: 2,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.8,
              color: "var(--wf-muted)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {lists.length} shopping list{lists.length === 1 ? "" : "s"}
          </div>
          {lists.length === 0 ? (
            <div
              style={{
                fontSize: 11,
                color: "var(--wf-muted)",
                fontStyle: "italic",
                lineHeight: 1.5,
                padding: "8px 8px 4px",
                background: "var(--wf-bg)",
                border: "1px dashed var(--wf-stroke-soft)",
                borderRadius: 2,
              }}
            >
              No shopping lists yet — the build guide has been indexed but no one has published a
              tracked list.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {lists.slice(0, 3).map((l, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    background: "var(--wf-bg)",
                    border: "1px solid var(--wf-stroke-soft)",
                    borderRadius: 2,
                    textDecoration: "none",
                    color: "var(--wf-ink)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--wf-gold-edge)";
                    e.currentTarget.style.background = "var(--wf-gold-soft)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--wf-stroke-soft)";
                    e.currentTarget.style.background = "var(--wf-bg)";
                  }}
                  title={`Open on pathofexile.com/trade — extension will auto-select this list`}
                >
                  <span style={{ color: "var(--wf-muted)", fontSize: 10, flexShrink: 0 }}>⇗</span>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l.name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--wf-muted)" }}>by {l.author}</div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--wf-gold-ink-strong)",
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    {l.cost}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "var(--wf-muted)",
                      minWidth: 30,
                      textAlign: "right",
                    }}
                  >
                    ♥ {l.follows}
                  </div>
                </a>
              ))}
              {lists.length > 3 && (
                <div style={{ fontSize: 10, color: "var(--wf-muted)", padding: "2px 6px" }}>
                  + {lists.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
};

Object.assign(window, { web });
