const FONT = "Sora, ui-sans-serif, system-ui, sans-serif";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 286 70"
      role="img"
      aria-label="KING CENTRAL GRÚAS"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>KING CENTRAL GRÚAS</title>

      <text
        x="2"
        y="36"
        textLength="66"
        lengthAdjust="spacing"
        fontFamily={FONT}
        fontSize="26"
        fontWeight="800"
        fill="var(--warm-white)"
      >
        KING
      </text>
      <text
        x="76"
        y="36"
        textLength="108"
        lengthAdjust="spacing"
        fontFamily={FONT}
        fontSize="26"
        fontWeight="800"
        fill="var(--warm-white)"
      >
        CENTRA
      </text>

      <g fill="var(--industrial-yellow)">
        <rect x="186.5" y="4" width="5.5" height="32" />
        <rect x="186.5" y="31" width="26" height="5" />
        <rect x="186.5" y="3" width="36" height="7" />
        <rect x="220" y="4.5" width="30" height="4.5" />
        <rect x="248" y="5.5" width="24" height="2.5" />
      </g>

      <line
        x1="270"
        y1="7"
        x2="270"
        y2="17"
        stroke="var(--warm-white)"
        strokeWidth="1.5"
      />
      <g
        stroke="var(--industrial-yellow)"
        strokeWidth="2"
        fill="var(--industrial-yellow)"
        fillOpacity="0.14"
      >
        <rect x="262" y="17" width="16" height="12" rx="1" />
        <line x1="267.3" y1="17" x2="267.3" y2="29" strokeWidth="1" />
        <line x1="272.6" y1="17" x2="272.6" y2="29" strokeWidth="1" />
        <line x1="262" y1="23" x2="278" y2="23" strokeWidth="1" />
      </g>

      <text
        x="102"
        y="62"
        textLength="76"
        lengthAdjust="spacing"
        fontFamily={FONT}
        fontSize="15"
        fontWeight="700"
        letterSpacing="2.5"
        fill="var(--industrial-yellow)"
      >
        GRÚAS
      </text>
    </svg>
  );
}
