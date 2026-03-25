// ── TOOLBOX tool registry ─────────────────────────────────────────────────────
// Each tool entry auto-discovers backends and cards on the home screen.
// Future tools: add an entry here + create src/tools/<id>/ + backend on next port.

export const TOOLS = [
  {
    id: 'pull',
    name: 'PULL',
    tagline: 'Download anything',
    tag: 'MEDIA',
    port: 5100,
    accent: '#C9A84C',
    accentDim: 'rgba(201,168,76,0.12)',
    bg: '#0D0D0D',
    healthEndpoint: '/history?limit=1',
  },
  {
    id: 'folio',
    name: 'FOLIO',
    tagline: 'Edit, merge, sign PDFs',
    tag: 'DOCUMENTS',
    port: 5051,
    accent: '#7EB88A',
    accentDim: 'rgba(126,184,138,0.12)',
    bg: '#0D0F0D',
    healthEndpoint: '/folio/health',
  },
]

export function getToolById(id) {
  return TOOLS.find((t) => t.id === id) || null
}
