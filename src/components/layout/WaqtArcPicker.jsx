// The half-circle "sun path" theme selector. Five nodes sit along a
// semicircular arc in chronological order (Fajr -> Isha); a marker
// glides along the arc to the active node instead of jumping, and
// the arc itself is drawn as one continuous gradient so it reads as
// a single unbroken sky rather than five separate swatches.
const CX = 150, CY = 150, R = 122;

function pointAt(angleDeg) {
  const r = (angleDeg * Math.PI) / 180;
  return { x: CX + R * Math.cos(r), y: CY - R * Math.sin(r) };
}

export default function WaqtArcPicker({ theme, themeList, onSelect, labelTheme }) {
  const active = themeList.find(t => t.key === theme) || themeList[0];
  const markerPt = pointAt(active.angle);

  return (
    <svg viewBox="0 0 300 175" width="100%" style={{ display: "block", overflow: "visible" }} aria-label={labelTheme || "Waqt theme"}>
      <defs>
        <linearGradient id="waqt-sky-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          {themeList.map((t, i) => (
            <stop key={t.key} offset={`${(i / (themeList.length - 1)) * 100}%`} stopColor={t["--gold"]} />
          ))}
        </linearGradient>
        <filter id="waqt-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* the arc itself, drawn once as a continuous gradient trail */}
      <path
        d={`M ${pointAt(180).x} ${pointAt(180).y} A ${R} ${R} 0 0 1 ${pointAt(0).x} ${pointAt(0).y}`}
        fill="none" stroke="url(#waqt-sky-gradient)" strokeWidth="3" strokeLinecap="round" opacity="0.55"
      />

      {/* gliding sun/moon marker */}
      <circle
        cx={markerPt.x} cy={markerPt.y} r="9"
        fill={active["--gold2"]} filter="url(#waqt-glow)"
        style={{ transition: "cx 0.6s cubic-bezier(.22,.61,.36,1), cy 0.6s cubic-bezier(.22,.61,.36,1), fill 0.4s ease" }}
      />

      {themeList.map(t => {
        const p = pointAt(t.angle);
        const isActive = t.key === theme;
        return (
          <g key={t.key} onClick={() => onSelect(t.key)} style={{ cursor: "pointer" }}
             role="button" aria-pressed={isActive} tabIndex={0}
             onKeyDown={e => (e.key === "Enter" || e.key === " ") && onSelect(t.key)}>
            {/* generous invisible hit area for touch */}
            <circle cx={p.x} cy={p.y} r="22" fill="transparent" />
            <circle
              cx={p.x} cy={p.y} r={isActive ? 11 : 7}
              fill={t["--gold"]}
              stroke={isActive ? t["--gold2"] : "none"}
              strokeWidth={isActive ? 3 : 0}
              opacity={isActive ? 1 : 0.38}
              style={{ transition: "r 0.3s ease, opacity 0.3s ease" }}
            />
            <text x={p.x} y={p.y + (t.angle === 90 ? -20 : 22)} textAnchor="middle"
              fontSize="11" fontWeight={isActive ? 700 : 500}
              fill={isActive ? t["--gold2"] : "currentColor"}
              opacity={isActive ? 1 : 0.55}
              style={{ transition: "opacity 0.3s ease, fill 0.3s ease" }}>
              {t.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
