'use client'

import { useRef, useState, useEffect } from 'react'
import { DocStyle } from '@/components/PdfViewer'

type Element = {
  type: 'text_block' | 'image' | 'table'
  block_type?: string
  gemini_text?: string
  bbox: [number, number, number, number]
  column: number
  lines?: { spans: { text: string; size: number; bold: boolean; italic: boolean }[] }[]
  src?: string
  rows?: (string | null)[][]
}

type PageData = {
  page_number: number
  width: number
  height: number
  layout: string
  elements: Element[]
}

function blockText(el: Element): string {
  if (el.gemini_text) return el.gemini_text
  return el.lines?.flatMap(l => l.spans.map(s => s.text)).join(' ').trim() ?? ''
}

function isOrderedItem(text: string): boolean {
  return /^\d+[.)]\s/.test(text.trim())
}

function TextBlock({ el, style }: { el: Element; style: DocStyle }) {
  const text = blockText(el)
  if (!text) return null

  const baseStyle = {
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    color: style.textColor,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing ? `${style.letterSpacing}em` : undefined,
  }

  switch (el.block_type) {
    case 'heading':
      return (
        <h2 style={{ ...baseStyle, fontSize: style.fontScale * 22, fontWeight: Math.max(style.fontWeight, 700), marginBottom: '0.5rem', marginTop: '1.2rem' }}>
          {text}
        </h2>
      )

    case 'subheading':
      return (
        <h3 style={{ ...baseStyle, fontSize: style.fontScale * 17, fontWeight: Math.max(style.fontWeight, 600), marginBottom: '0.35rem', marginTop: '1rem' }}>
          {text}
        </h3>
      )

    case 'list_item': {
      const ordered = isOrderedItem(text)
      return ordered ? (
        <div style={{ ...baseStyle, fontSize: style.fontScale * 14, marginBottom: '0.2rem', paddingLeft: '1.2rem', listStyleType: 'decimal' }}>
          <li style={{ display: 'list-item', listStyleType: 'decimal' }}>{text.replace(/^\d+[.)]\s*/, '')}</li>
        </div>
      ) : (
        <div style={{ ...baseStyle, fontSize: style.fontScale * 14, marginBottom: '0.2rem', paddingLeft: '1.2rem' }}>
          <li style={{ display: 'list-item', listStyleType: 'disc' }}>{text.replace(/^[-•*]\s*/, '')}</li>
        </div>
      )
    }

    case 'caption':
      return (
        <p style={{ ...baseStyle, fontSize: style.fontScale * 12, fontStyle: 'italic', color: style.textColor, opacity: 0.7, marginBottom: '0.5rem', marginTop: '0.25rem' }}>
          {text}
        </p>
      )

    case 'footer':
      return (
        <p style={{ ...baseStyle, fontSize: style.fontScale * 11, opacity: 0.5, marginBottom: '0.25rem' }}>
          {text}
        </p>
      )

    default: // paragraph, other
      return (
        <p style={{ ...baseStyle, fontSize: style.fontScale * 14, marginBottom: '0.75rem' }}>
          {text}
        </p>
      )
  }
}

function ImageBlock({ el }: { el: Element }) {
  if (!el.src) return null
  return (
    <div style={{ marginBottom: '1rem', marginTop: '0.5rem' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={el.src} alt="" style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} />
    </div>
  )
}

function TableBlock({ el, style }: { el: Element; style: DocStyle }) {
  if (!el.rows?.length) return null
  const [header, ...body] = el.rows

  return (
    <div style={{ marginBottom: '1rem', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: style.fontFamily, fontSize: style.fontScale * 13, color: style.textColor }}>
        {header && (
          <thead>
            <tr>
              {header.map((cell, i) => (
                <th key={i} style={{ border: '1px solid var(--border-light)', padding: '6px 10px', textAlign: 'left', fontWeight: Math.max(style.fontWeight, 600), backgroundColor: 'rgba(28,25,23,0.05)' }}>
                  {cell ?? ''}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ border: '1px solid var(--border-light)', padding: '6px 10px', lineHeight: style.lineHeight }}>
                  {cell ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function hexToRgba(hex: string | undefined, opacity: number) {
  const h = hex ?? '#3B82F6'
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export default function PdfBlocks({
  page,
  style,
  activeIndex,
  onSelect,
  scrollToIndex,
  viewMode = 'paragraph',
  pageSentences = null,
}: {
  page: PageData
  style: DocStyle
  activeIndex: number | null
  onSelect: (index: number | null) => void
  scrollToIndex: { index: number; key: number } | null
  viewMode?: 'paragraph' | 'sentence'
  pageSentences?: (string[] | null)[] | null
}) {
  const isTwoCol = page.layout === 'two-column'
  const elementRefs = useRef<(HTMLDivElement | null)[]>([])

  const [ttsIndex, setTtsIndex] = useState<number | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const isSpeakingRef = useRef(false)

  function stopSpeech() {
    window.speechSynthesis.cancel()
    isSpeakingRef.current = false
    setIsSpeaking(false)
  }

  function speakBlock(text: string) {
    stopSpeech()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => { isSpeakingRef.current = false; setIsSpeaking(false) }
    utterance.onerror = () => { isSpeakingRef.current = false; setIsSpeaking(false) }
    utterance.onstart = () => { isSpeakingRef.current = true; setIsSpeaking(true) }
    window.speechSynthesis.speak(utterance)
  }

  function handleBlockClick(i: number, el: Element) {
    if (el.type !== 'text_block') return
    stopSpeech()
    setTtsIndex(prev => prev === i ? null : i)
  }

  function handleTtsClick(e: React.MouseEvent, text: string) {
    e.stopPropagation()
    if (isSpeakingRef.current) stopSpeech()
    else speakBlock(text)
  }

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ttsIndex === null) return
      const inside = elementRefs.current.some(r => r?.contains(e.target as Node))
      if (!inside) { stopSpeech(); setTtsIndex(null) }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [ttsIndex])

  useEffect(() => {
    return () => { stopSpeech(); setTtsIndex(null) }
  }, [page.page_number])

  useEffect(() => {
    if (scrollToIndex === null) return
    elementRefs.current[scrollToIndex.index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [scrollToIndex])

  const indexed = page.elements.map((el, i) => ({ el, i }))
  const col0 = indexed.filter(({ el }) => el.column === 0)
  const col1 = indexed.filter(({ el }) => el.column === 1)

  function blockStyle(isActive: boolean, extraCursor?: string) {
    return {
      position: 'relative' as const,
      cursor: extraCursor ?? 'pointer',
      backgroundColor: isActive ? hexToRgba(style.highlightColor, style.highlightOpacity * 0.5) : style.backgroundColor,
      border: isActive
        ? `1px solid ${hexToRgba(style.highlightColor, style.highlightOpacity + 0.2)}`
        : '1px solid rgba(245,244,242,0.07)',
      borderLeft: `3px solid ${isActive ? hexToRgba(style.highlightColor, Math.min(1, style.highlightOpacity + 0.4)) : 'rgba(245,244,242,0.08)'}`,
      padding: '0.35rem 0.5rem',
      borderRadius: 5,
      boxShadow: isActive ? `0 2px 8px ${hexToRgba(style.highlightColor, 0.15)}` : '0 1px 3px rgba(0,0,0,0.3)',
      filter: style.blurEnabled && activeIndex !== null && !isActive ? 'blur(2px) opacity(0.5)' : 'none',
      marginBottom: '0.35rem',
      transition: 'background-color 0.15s, border-color 0.15s, box-shadow 0.15s, filter 0.15s',
    }
  }

  function renderElement({ el, i }: { el: Element; i: number }) {
    const isActive = activeIndex === i

    // Sentence mode: each sentence gets its own block card
    if (viewMode === 'sentence' && el.type === 'text_block') {
      const sentences = pageSentences?.[i] ?? null
      if (sentences && sentences.length > 0) {
        const textStyle = {
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          color: style.textColor,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing ? `${style.letterSpacing}em` : undefined,
          fontSize: style.fontScale * 14,
          margin: 0,
        }
        return (
          <div key={i}>
            {sentences.map((sentence, si) => (
              <div
                key={si}
                ref={si === 0 ? node => { elementRefs.current[i] = node } : undefined}
                onMouseEnter={() => onSelect(i)}
                onMouseLeave={() => onSelect(null)}
                onClick={() => handleBlockClick(i, el)}
                style={blockStyle(isActive)}
              >
                <p style={textStyle}>{sentence}</p>
              </div>
            ))}
          </div>
        )
      }
    }

    return (
      <div
        key={i}
        ref={node => { elementRefs.current[i] = node }}
        onMouseEnter={() => onSelect(i)}
        onMouseLeave={() => onSelect(null)}
        onClick={() => handleBlockClick(i, el)}
        style={blockStyle(isActive, el.type === 'text_block' ? 'pointer' : 'default')}
      >
        {el.type === 'image' && <ImageBlock el={el} />}
        {el.type === 'table' && <TableBlock el={el} style={style} />}
        {el.type === 'text_block' && <TextBlock el={el} style={style} />}
        {ttsIndex === i && el.type === 'text_block' && (
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => handleTtsClick(e, blockText(el))}
            aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
            title={isSpeaking ? 'Stop reading' : 'Read aloud'}
            style={{
              position: 'absolute', top: 4, right: 4,
              width: 28, height: 28, borderRadius: 3,
              border: '1px solid var(--sidebar-border)',
              backgroundColor: isSpeaking ? 'var(--foreground)' : 'var(--background)',
              color: isSpeaking ? 'var(--background)' : 'var(--foreground)',
              fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10, transition: 'background-color 0.1s, color 0.1s',
            }}
          >
            {isSpeaking ? '■' : '▶'}
          </button>
        )}
      </div>
    )
  }

  if (isTwoCol) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>{col0.map(renderElement)}</div>
        <div>{col1.map(renderElement)}</div>
      </div>
    )
  }

  return <div>{indexed.map(renderElement)}</div>
}
