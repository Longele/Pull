/**
 * EmptyState — per-operation illustrated empty state.
 * Shows a simple SVG line-art illustration + message.
 */
export default function EmptyState({ icon, message, sub, accent = '#7EB88A' }) {
  const icons = {
    merge: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="4" y="8" width="14" height="18" rx="1" stroke="currentColor" strokeWidth="0.8" />
        <rect x="22" y="8" width="14" height="18" rx="1" stroke="currentColor" strokeWidth="0.8" />
        <path d="M18 17 L22 17" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M11 28 L20 33 L29 28" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="20" y1="24" x2="20" y2="33" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      </svg>
    ),
    split: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="8" y="6" width="24" height="28" rx="1" stroke="currentColor" strokeWidth="0.8" />
        <line x1="8" y1="20" x2="32" y2="20" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
        <path d="M20 22 L15 27 M20 22 L25 27" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      </svg>
    ),
    compress: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="8" y="6" width="24" height="28" rx="1" stroke="currentColor" strokeWidth="0.8" />
        <path d="M14 20 L20 14 L26 20" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 26 L20 32 L26 26" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    rotate: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="10" y="8" width="20" height="24" rx="1" stroke="currentColor" strokeWidth="0.8" />
        <path d="M28 8 A12 12 0 0 1 28 32" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        <polyline points="32,8 28,8 28,12" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    images: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="6" y="10" width="28" height="20" rx="1" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="13" cy="17" r="2.5" stroke="currentColor" strokeWidth="0.8" />
        <path d="M6 25 L14 19 L20 24 L26 18 L34 25" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    sign: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="6" y="6" width="28" height="28" rx="1" stroke="currentColor" strokeWidth="0.8" />
        <path d="M12 28 C15 22, 18 18, 22 24 C25 29, 28 22, 30 20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
      </svg>
    ),
    watermark: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="6" y="6" width="28" height="28" rx="1" stroke="currentColor" strokeWidth="0.8" />
        <text x="20" y="24" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.4" transform="rotate(-30 20 20)">WM</text>
      </svg>
    ),
    unlock: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M13 18 L13 13 A7 7 0 0 1 27 13" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        <rect x="9" y="18" width="22" height="16" rx="1" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="20" cy="26" r="2" stroke="currentColor" strokeWidth="0.8" />
      </svg>
    ),
    frompdf: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="4" y="8" width="14" height="18" rx="1" stroke="currentColor" strokeWidth="0.8" />
        <rect x="10" y="14" width="14" height="18" rx="1" stroke="currentColor" strokeWidth="0.8" fill="#1a1a1a" />
        <rect x="16" y="20" width="14" height="18" rx="1" stroke="currentColor" strokeWidth="0.8" fill="#1a1a1a" />
        <path d="M27 10 L33 16 L27 22" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 32px',
        gap: '16px',
        color: `${accent}60`,
      }}
    >
      <div style={{ opacity: 0.7 }}>{icons[icon] || icons.merge}</div>
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '14px',
          color: 'rgba(240,235,225,0.4)',
          textAlign: 'center',
        }}
      >
        {message || 'Drop a file to get started'}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '11px',
            color: 'rgba(240,235,225,0.2)',
            textAlign: 'center',
            letterSpacing: '0.04em',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}
