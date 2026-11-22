// ════════════════════════════════════════════════════════════════
// BRAND LOGO — inline SVG so it inherits theme colors via CSS variables
// and needs no extra network request. Matches /public/logo.svg.
// (Used in the mobile menu drawer; the desktop header uses the Figma
// "هادي" wordmark.)
// ════════════════════════════════════════════════════════════════
export default function Logo({ size = 34, className = "" }) {
  return (
    <svg className={`brand-logo ${className}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="48" fill="var(--accent)" />
      <path d="M50 40 C42 34 30 32 22 34 L22 66 C30 64 42 66 50 72 C58 66 70 64 78 66 L78 34 C70 32 58 34 50 40 Z"
        fill="none" stroke="var(--on-accent)" strokeWidth="2.4" strokeLinejoin="round" />
      <line x1="50" y1="40" x2="50" y2="72" stroke="var(--on-accent)" strokeWidth="2.2" />
      <path d="M63 22 A13 13 0 1 0 63 46 A10.5 10.5 0 1 1 63 22 Z" fill="var(--on-accent)" className="brand-logo-crescent" />
      <path d="M40 20 L41.6 24.6 L46.4 24.6 L42.6 27.6 L44 32.2 L40 29.4 L36 32.2 L37.4 27.6 L33.6 24.6 L38.4 24.6 Z" fill="var(--on-accent)" className="brand-logo-star" />
    </svg>
  );
}
