'use client'

import { useRef, useState, useEffect } from 'react'
import { DocStyle } from '@/components/PdfViewer'

// ─── Constants ────────────────────────────────────────────────────────────────

const HIGHLIGHT_COLORS = [
  { label: 'Blue',   value: '#3B82F6' },
  { label: 'Yellow', value: '#EAB308' },
  { label: 'Green',  value: '#22C55E' },
  { label: 'Pink',   value: '#EC4899' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Purple', value: '#A855F7' },
  { label: 'Red',    value: '#EF4444' },
]

const FONT_OPTIONS = [
  { label: 'Atkinson Hyperlegible', value: 'var(--font-atkinson), sans-serif', weights: [400, 700] },
  { label: 'OpenDyslexic',          value: 'OpenDyslexic, sans-serif',         weights: [400] },
  { label: 'Default',               value: 'inherit',                          weights: [300, 400, 500, 600, 700] },
  { label: 'Inter',                 value: 'Inter, sans-serif',                weights: [300, 400, 500, 600, 700] },
  { label: 'Georgia',               value: 'Georgia, serif',                   weights: [400, 700] },
  { label: 'Times New Roman',       value: 'Times New Roman, serif',           weights: [400, 700] },
  { label: 'Arial',                 value: 'Arial, sans-serif',                weights: [400, 700] },
  { label: 'Comic Sans',            value: 'Comic Sans MS, cursive',           weights: [400, 700] },
  { label: 'Courier',               value: 'Courier New, monospace',           weights: [400, 700] },
]

const FONT_WEIGHTS = [
  { label: 'Light',   value: 300 },
  { label: 'Regular', value: 400 },
  { label: 'Medium',  value: 500 },
  { label: 'Semi',    value: 600 },
  { label: 'Bold',    value: 700 },
]

const OPACITY_LEVELS = [
  { label: 'Low',  value: 0.25 },
  { label: 'Med',  value: 0.5  },
  { label: 'High', value: 0.75 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundTo(val: number, step: number): number {
  const inv = 1 / step
  return Math.round(val * inv) / inv
}

// ─── Layout primitives ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
      fontWeight: 700, color: '#DDD9D4', margin: '0 0 10px 0',
      userSelect: 'none',
    }}>
      {children}
    </p>
  )
}

function SectionDivider() {
  return <div style={{ height: 1, background: 'var(--border-light)', margin: '16px 0' }} />
}

/** Inline row: label on left, control on right */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 13, color: 'var(--muted-foreground)', userSelect: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {label}
      </span>
      {children}
    </div>
  )
}

/** Stacked row: label on top, full-width control below */
function StackRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 4px 0', userSelect: 'none' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

// ─── Controls ─────────────────────────────────────────────────────────────────

/** Horizontal slider with label + live value */
function Slider({
  value, min, max, step, format, onChange,
}: {
  value: number; min: number; max: number; step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(roundTo(Number(e.target.value), step))}
        style={{ flex: 1, margin: 0, '--slider-pct': `${pct}%` } as React.CSSProperties}
      />
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', minWidth: 38, textAlign: 'right', userSelect: 'none', flexShrink: 0 }}>
        {format(value)}
      </span>
    </div>
  )
}

/** Segmented control for fixed numeric options */
function Segmented({
  options, value, onChange,
}: {
  options: { label: string; value: number }[]
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', border: '1px solid var(--border-light)', flexShrink: 0, width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
      {options.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1, height: 28, fontSize: 12, fontWeight: 700, padding: '0 4px',
            borderTop: 'none', borderBottom: 'none', borderRight: 'none',
            borderLeft: i > 0 ? '1px solid var(--border-light)' : 'none',
            background: value === opt.value ? 'var(--accent)' : 'transparent',
            color: value === opt.value ? 'var(--accent-foreground)' : 'var(--foreground)',
            cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
            transition: 'background 0.1s, color 0.1s',
          }}
          onMouseEnter={e => { if (value !== opt.value) (e.currentTarget as HTMLElement).style.background = 'var(--muted)' }}
          onMouseLeave={e => { if (value !== opt.value) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/** Dropdown select */
function Select({
  value,
  options,
  onChange,
  showFontPreview,
}: {
  value: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
  showFontPreview?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value) ?? options[0]

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', height: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 8px',
          background: open ? 'var(--accent)' : 'var(--background)',
          color: open ? 'var(--accent-foreground)' : 'var(--foreground)',
          border: '1px solid var(--border-light)', cursor: 'pointer',
          borderRadius: open ? 'var(--radius-sm) var(--radius-sm) 0 0' : 'var(--radius-sm)',
          fontSize: 13, fontFamily: showFontPreview ? value : 'inherit',
          textAlign: 'left', transition: 'background 0.1s, color 0.1s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.label}</span>
        <span style={{ fontSize: 10, opacity: 0.5, flexShrink: 0, marginLeft: 4 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2,
          background: 'var(--background)', border: '1px solid var(--border-light)',
          zIndex: 200, maxHeight: 220, overflowY: 'auto',
          borderRadius: 'var(--radius-sm)',
        }}>
          {options.map(opt => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 10px', fontSize: 13,
                  fontFamily: showFontPreview ? opt.value : 'inherit',
                  fontWeight: isSelected ? 700 : 400,
                  background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                  color: 'var(--foreground)', border: 'none', cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--muted)' }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReadingPanel({
  style,
  onChange,
}: {
  style: DocStyle
  onChange: (s: DocStyle) => void
}) {
  const [isOpen, setIsOpen] = useState(true)

  function set<K extends keyof DocStyle>(key: K, value: DocStyle[K]) {
    onChange({ ...style, [key]: value })
  }

  function handleFontChange(v: string) {
    const font = FONT_OPTIONS.find(f => f.value === v) ?? FONT_OPTIONS[0]
    const weight = font.weights.includes(style.fontWeight)
      ? style.fontWeight
      : font.weights.reduce((a, b) => Math.abs(b - style.fontWeight) < Math.abs(a - style.fontWeight) ? b : a)
    onChange({ ...style, fontFamily: v, fontWeight: weight })
  }

  const currentFont = FONT_OPTIONS.find(f => f.value === style.fontFamily) ?? FONT_OPTIONS[0]
  const availableWeights = FONT_WEIGHTS.filter(w => currentFont.weights.includes(w.value))

  return (
    <>
      {/* Permanent toggle strip — full-height clickable column */}
      <button
        onClick={() => setIsOpen(o => !o)}
        title={isOpen ? 'Close settings' : 'Open settings'}
        className="flex-shrink-0 flex items-center justify-center transition-all duration-150 group"
        style={{
          alignSelf: 'center',
          width: 20,
          height: 56,
          borderRadius: '6px 0 0 6px',
          background: 'var(--accent)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 10,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <span className="select-none" style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-foreground)' }}>
          {isOpen ? '›' : '‹'}
        </span>
      </button>

      {/* Collapsing settings panel — shrinks to 0, no content visible when closed */}
      <div
        className="flex-shrink-0 bg-[var(--toolbar-bg)]"
        style={{
          width: isOpen ? 256 : 0,
          minWidth: isOpen ? 256 : 0,
          overflow: 'hidden',
          borderLeft: '2px solid var(--accent)',
          transition: 'width 200ms ease-in-out, min-width 200ms ease-in-out',
        }}
      >
        <div style={{ width: 256, minWidth: 256, height: '100%', display: 'flex', flexDirection: 'column' }}>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 32px' }}>

          {/* ── Typography ────────────────────────────────── */}
          <SectionLabel>Typography</SectionLabel>

          <StackRow label="Font">
            <Select
              value={style.fontFamily}
              options={FONT_OPTIONS.map(f => ({ label: f.label, value: f.value }))}
              onChange={handleFontChange}
              showFontPreview
            />
          </StackRow>

          <StackRow label="Weight">
            <Select
              value={String(style.fontWeight)}
              options={availableWeights.map(w => ({ label: w.label, value: String(w.value) }))}
              onChange={v => set('fontWeight', Number(v))}
            />
          </StackRow>

          <StackRow label="Size">
            <Slider
              value={style.fontScale}
              min={0.5} max={2.5} step={0.1}
              format={v => `${v.toFixed(1)}×`}
              onChange={v => set('fontScale', v)}
            />
          </StackRow>

          <SectionDivider />

          {/* ── Spacing ───────────────────────────────────── */}
          <SectionLabel>Spacing</SectionLabel>

          <StackRow label="Line height">
            <Slider
              value={style.lineHeight}
              min={1.0} max={3.0} step={0.1}
              format={v => v.toFixed(1)}
              onChange={v => set('lineHeight', v)}
            />
          </StackRow>

          <StackRow label="Letter spacing">
            <Slider
              value={style.letterSpacing}
              min={-0.05} max={0.30} step={0.01}
              format={v => v === 0 ? '0' : (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2))}
              onChange={v => set('letterSpacing', v)}
            />
          </StackRow>

          <SectionDivider />

          {/* ── Colors ────────────────────────────────────── */}
          <SectionLabel>Colors</SectionLabel>

          <Row label="Text">
            <div style={{ width: 32, height: 32, border: '1px solid var(--border-light)', overflow: 'hidden', position: 'relative', flexShrink: 0, borderRadius: 'var(--radius-sm)' }}>
              <input
                type="color" value={style.textColor}
                onChange={e => set('textColor', e.target.value)}
                style={{ position: 'absolute', inset: '-4px', width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', cursor: 'pointer', border: 'none', padding: 0 }}
              />
            </div>
          </Row>

          <Row label="Background">
            <div style={{ width: 32, height: 32, border: '1px solid var(--border-light)', overflow: 'hidden', position: 'relative', flexShrink: 0, borderRadius: 'var(--radius-sm)' }}>
              <input
                type="color" value={style.backgroundColor}
                onChange={e => set('backgroundColor', e.target.value)}
                style={{ position: 'absolute', inset: '-4px', width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', cursor: 'pointer', border: 'none', padding: 0 }}
              />
            </div>
          </Row>

          <SectionDivider />

          {/* ── Highlight ─────────────────────────────────── */}
          <SectionLabel>Highlight</SectionLabel>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {HIGHLIGHT_COLORS.map(c => (
              <button
                key={c.value}
                title={c.label}
                onClick={() => set('highlightColor', c.value)}
                style={{
                  width: 26, height: 26, flexShrink: 0,
                  backgroundColor: c.value,
                  border: style.highlightColor === c.value
                    ? '2px solid var(--foreground)'
                    : '2px solid transparent',
                  cursor: 'pointer', transition: 'border 0.1s',
                  outline: style.highlightColor === c.value ? '1px solid var(--background)' : 'none',
                  outlineOffset: '-3px',
                }}
              />
            ))}
          </div>

          <StackRow label="Opacity">
            <Segmented
              options={OPACITY_LEVELS}
              value={style.highlightOpacity}
              onChange={v => set('highlightOpacity', v)}
            />
          </StackRow>

          <SectionDivider />

          {/* ── Reading Aids ──────────────────────────────── */}
          <SectionLabel>Reading Aids</SectionLabel>

          <Row label="Focus blur">
            <div style={{ display: 'flex', border: '1px solid var(--border-light)', flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {([{ label: 'Off', v: false }, { label: 'On', v: true }] as const).map(({ label, v }, i) => (
                <button
                  key={label}
                  onClick={() => set('blurEnabled', v)}
                  style={{
                    width: 40, height: 28, fontSize: 10, fontWeight: 700,
                    borderTop: 'none', borderBottom: 'none', borderRight: 'none',
                    borderLeft: i > 0 ? '1px solid var(--border-light)' : 'none',
                    background: style.blurEnabled === v ? 'var(--accent)' : 'transparent',
                    color: style.blurEnabled === v ? 'var(--accent-foreground)' : 'var(--foreground)',
                    cursor: 'pointer', userSelect: 'none',
                    transition: 'background 0.1s, color 0.1s',
                  }}
                  onMouseEnter={e => { if (style.blurEnabled !== v) (e.currentTarget as HTMLElement).style.background = 'var(--muted)' }}
                  onMouseLeave={e => { if (style.blurEnabled !== v) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Row>

        </div>
        </div>
      </div>
    </>
  )
}
