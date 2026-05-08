// Shared wireframe sketch primitives — lo-fi blocks, lines, buttons.
// All primitives respect CSS vars set on the panel root, so density + theme
// tweaks cascade. Keep shapes simple: rects, lines, 1-2 letter glyphs.

const wf = {
  // ── Line of "text" as a grey bar. widthPct 10-100.
  Line: ({ w = 60, h = 6, mt = 0, mb = 0, color, op = 1, radius = 1 }) => (
    <div
      style={{
        width: typeof w === "number" ? `${w}%` : w,
        height: h,
        background: color || "var(--wf-line)",
        opacity: op,
        borderRadius: radius,
        marginTop: mt,
        marginBottom: mb,
      }}
    />
  ),

  // ── Stack of N grey lines with varied widths
  Lines: ({ widths = [70, 50, 60], gap = 6, h = 5 }) => (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {widths.map((w) => (
        <div
          key={`line-${w}`}
          style={{
            width: `${w}%`,
            height: h,
            background: "var(--wf-line)",
            opacity: 0.6,
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  ),

  // ── Block — generic placeholder (image/icon container)
  Block: ({ w = 32, h = 32, children, style, onClick }) => (
    <div
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") onClick(event);
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        width: w,
        height: h,
        background: "var(--wf-block)",
        border: "1px solid var(--wf-stroke)",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        color: "var(--wf-muted)",
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        flexShrink: 0,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  ),

  // ── Icon placeholder — small square with a letter
  Icon: ({ ch = "·", size = 18, style }) => (
    <div
      style={{
        width: size,
        height: size,
        border: "1px solid var(--wf-stroke)",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.55,
        color: "var(--wf-muted)",
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        flexShrink: 0,
        ...style,
      }}
    >
      {ch}
    </div>
  ),

  // ── Gold (accent) button — the brand "Save This Search" action
  BtnGold: ({ label = "Save This Search", full = true, size = "md", style }) => {
    const h = size === "sm" ? 28 : size === "lg" ? 44 : 36;
    return (
      <div
        style={{
          width: full ? "100%" : "auto",
          height: h,
          padding: "0 14px",
          background: "var(--wf-gold)",
          border: "1px solid var(--wf-gold-edge)",
          borderRadius: 2,
          color: "var(--wf-gold-ink)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 1px 0 rgba(0,0,0,0.3)",
          cursor: "pointer",
          ...style,
        }}
      >
        {label}
      </div>
    );
  },

  // ── Secondary button (outlined / ghost)
  BtnGhost: ({ label, icon, size = "sm", style, full }) => {
    const h = size === "sm" ? 26 : 32;
    return (
      <div
        style={{
          height: h,
          width: full ? "100%" : "auto",
          padding: "0 10px",
          background: "transparent",
          border: "1px dashed var(--wf-stroke)",
          borderRadius: 2,
          color: "var(--wf-ink)",
          fontSize: 11,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          cursor: "pointer",
          ...style,
        }}
      >
        {icon && <span style={{ opacity: 0.6 }}>{icon}</span>}
        {label}
      </div>
    );
  },

  // ── Pill / tag
  Pill: ({ children, tone = "neutral", style }) => {
    const tones = {
      neutral: { bg: "var(--wf-pill-bg)", fg: "var(--wf-muted)", bd: "var(--wf-stroke)" },
      gold: {
        bg: "var(--wf-gold-soft)",
        fg: "var(--wf-gold-ink-strong)",
        bd: "var(--wf-gold-edge)",
      },
      warn: { bg: "var(--wf-warn-bg)", fg: "var(--wf-warn-ink)", bd: "var(--wf-warn-edge)" },
      good: { bg: "var(--wf-good-bg)", fg: "var(--wf-good-ink)", bd: "var(--wf-good-edge)" },
    }[tone];
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 6px",
          fontSize: 10,
          fontWeight: 500,
          background: tones.bg,
          color: tones.fg,
          border: `1px solid ${tones.bd}`,
          borderRadius: 2,
          letterSpacing: 0.3,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          ...style,
        }}
      >
        {children}
      </span>
    );
  },

  // ── Text (real text, at actual size — this is the density-aware content)
  T: ({ size = "md", weight = 400, color, children, style }) => {
    const sizes = { xs: 10, sm: 11, md: 12, lg: 14, xl: 16, xxl: 20 };
    return (
      <div
        style={{
          fontSize: sizes[size],
          fontWeight: weight,
          color: color || "var(--wf-ink)",
          lineHeight: 1.35,
          ...style,
        }}
      >
        {children}
      </div>
    );
  },

  // ── Panel section divider
  Rule: ({ mt = 10, mb = 10 }) => (
    <div
      style={{
        height: 1,
        background: "var(--wf-stroke)",
        opacity: 0.7,
        marginTop: mt,
        marginBottom: mb,
      }}
    />
  ),

  // ── Frame — the sidebar container
  Panel: ({ children, width = 380, height = 640, style }) => (
    <div
      style={{
        width,
        height,
        background: "var(--wf-bg)",
        color: "var(--wf-ink)",
        border: "1px solid var(--wf-frame)",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  ),

  // ── Chrome side-panel header (browser-ish affordance)
  ChromeBar: ({ league = "Phrecia SC", onSettings }) => (
    <div
      style={{
        height: 32,
        background: "var(--wf-chrome)",
        borderBottom: "1px solid var(--wf-frame)",
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        gap: 8,
        fontSize: 11,
        color: "var(--wf-muted)",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: 2,
          background: "var(--wf-gold)",
          border: "1px solid var(--wf-gold-edge)",
        }}
      />
      <div style={{ fontWeight: 600, color: "var(--wf-ink)", fontSize: 12 }}>PoE Shopping List</div>
      <div style={{ flex: 1 }} />
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 7px",
          fontSize: 10,
          fontWeight: 500,
          background: "var(--wf-gold-soft)",
          color: "var(--wf-gold-ink-strong)",
          border: "1px solid var(--wf-gold-edge)",
          borderRadius: 2,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        }}
      >
        {league}
      </span>
      <button
        type="button"
        onClick={onSettings}
        style={{
          width: 22,
          height: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--wf-muted)",
          fontSize: 14,
          background: "transparent",
          border: 0,
          padding: 0,
        }}
      >
        ⚙
      </button>
    </div>
  ),

  // ── Item row — the canonical "saved search" line
  Item: ({ name, price, currency, captured, checked, density = "roomy", children }) => {
    const pad = density === "compact" ? "6px 10px" : "10px 12px";
    return (
      <div
        style={{
          padding: pad,
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid var(--wf-stroke-soft)",
          background: "transparent",
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            flexShrink: 0,
            border: "1px solid var(--wf-stroke)",
            borderRadius: 2,
            background: checked ? "var(--wf-gold)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--wf-gold-ink)",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {checked && "✓"}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            style={{
              fontSize: density === "compact" ? 12 : 13,
              fontWeight: 500,
              color: "var(--wf-ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </div>
          {children}
        </div>
        {price !== undefined && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--wf-gold-ink-strong)",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {price}
              <span style={{ opacity: 0.7, marginLeft: 2 }}>{currency}</span>
            </div>
            {captured && <div style={{ fontSize: 9, color: "var(--wf-muted)" }}>{captured}</div>}
          </div>
        )}
        <div
          style={{ color: "var(--wf-muted)", fontSize: 14, cursor: "pointer", padding: "0 2px" }}
        >
          ⋯
        </div>
      </div>
    );
  },
};

Object.assign(window, { wf });
