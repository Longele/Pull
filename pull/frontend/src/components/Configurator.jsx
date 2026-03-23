import { useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

const FORMATS = ['MP4', 'MP3', 'WebM']
const QUALITIES = ['480p', '720p', '1080p', '4K']

function Toggle({ label, checked, onChange }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        fontSize: '13px',
        color: 'rgba(245,240,232,0.6)',
        letterSpacing: '0.02em',
      }}
    >
      <span className="toggle-switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle-track" />
        <span className="toggle-thumb" />
      </span>
      {label}
    </label>
  )
}

function QualitySlider({ value, onChange }) {
  const index = QUALITIES.indexOf(value)
  const sliderVal = index === -1 ? 1 : index

  const handleChange = (e) => {
    onChange(QUALITIES[parseInt(e.target.value)])
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Tooltip row */}
      <div style={{ position: 'relative', height: '22px', marginBottom: '8px' }}>
        <span
          style={{
            position: 'absolute',
            left: `${(sliderVal / 3) * 100}%`,
            transform: 'translateX(-50%)',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '11px',
            color: '#C9A84C',
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
            background: 'rgba(201,168,76,0.12)',
            padding: '2px 6px',
            border: '0.5px solid rgba(201,168,76,0.3)',
            transition: 'left 0.12s ease',
          }}
        >
          {value}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={3}
        step={1}
        value={sliderVal}
        onChange={handleChange}
        className="quality-slider"
      />

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        {QUALITIES.map((q) => (
          <span
            key={q}
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '11px',
              letterSpacing: '0.06em',
              color: q === value ? '#C9A84C' : 'rgba(245,240,232,0.3)',
              transition: 'color 0.15s ease',
              textTransform: 'uppercase',
            }}
          >
            {q}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Configurator({ config, onChange }) {
  const { format, quality, subtitles, embedThumbnail, audioOnly } = config

  const setFormat = (f) => onChange({ ...config, format: f.toLowerCase() })
  const setQuality = (q) => onChange({ ...config, quality: q })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      style={{
        border: '0.5px solid rgba(255,255,255,0.08)',
        background: '#0C0C0C',
      }}
    >
      {/* Row 1: Format */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{
          fontSize: '11px',
          fontFamily: '"DM Sans", sans-serif',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(245,240,232,0.3)',
          marginBottom: '16px',
        }}>
          Format
        </div>
        <div style={{ display: 'flex', gap: '36px' }}>
          {FORMATS.map((f) => {
            const isActive = format === f.toLowerCase()
            return (
              <motion.div
                key={f}
                className={`format-toggle ${isActive ? 'active' : ''}`}
                onClick={() => setFormat(f)}
                animate={isActive ? { scale: [0.96, 1] } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{ textAlign: 'center' }}
              >
                <div className="dot" />
                {f}
              </motion.div>
            )
          })}
        </div>
      </div>

      <hr className="sep" />

      {/* Row 2: Quality */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{
          fontSize: '11px',
          fontFamily: '"DM Sans", sans-serif',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(245,240,232,0.3)',
          marginBottom: '20px',
        }}>
          Quality
        </div>
        <QualitySlider value={quality} onChange={setQuality} />
      </div>

      <hr className="sep" />

      {/* Row 3: Options */}
      <div style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: '18px' }}>
        <div style={{
          fontSize: '11px',
          fontFamily: '"DM Sans", sans-serif',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(245,240,232,0.3)',
          width: '100%',
          marginBottom: '2px',
        }}>
          Options
        </div>
        <Toggle
          label="Extract subtitles"
          checked={subtitles}
          onChange={(v) => onChange({ ...config, subtitles: v })}
        />
        <Toggle
          label="Embed thumbnail"
          checked={embedThumbnail}
          onChange={(v) => onChange({ ...config, embedThumbnail: v })}
        />
        <Toggle
          label="Audio only override"
          checked={audioOnly}
          onChange={(v) => onChange({ ...config, audioOnly: v })}
        />
      </div>
    </motion.div>
  )
}
