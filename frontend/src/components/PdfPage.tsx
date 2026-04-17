'use client'

import { DocStyle } from '@/components/PdfViewer'

type Span = {
  text: string
  font: string
  size: number
  bold: boolean
  italic: boolean
  color: string
  bbox: [number, number, number, number]
}

type Line = { spans: Span[] }

type Element = {
  type: 'text_block' | 'image' | 'table'
  block_type?: 'heading' | 'subheading' | 'paragraph' | 'list_item' | 'caption' | 'footer' | 'other'
  gemini_text?: string
  bbox: [number, number, number, number]
  column: number
  lines?: Line[]
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

function lineBottom(line: Line): number {
  return Math.max(...line.spans.map(s => s.bbox[3]))
}

function lineTop(line: Line): number {
  return Math.min(...line.spans.map(s => s.bbox[1]))
}

function lineHeight(line: Line): number {
  return lineBottom(line) - lineTop(line)
}

function isHeadingLine(line: Line): boolean {
  // A heading is ALL spans bold and short (≤10 words) — not just inline bold
  const allBold = line.spans.every(s => s.bold)
  const wordCount = line.spans.map(s => s.text).join('').trim().split(/\s+/).length
  return allBold && wordCount <= 10
}

function groupLines(lines: Line[]): Line[][] {
  if (!lines.length) return []
  const groups: Line[][] = [[lines[0]]]

  for (let i = 1; i < lines.length; i++) {
    const prev = lines[i - 1]
    const curr = lines[i]

    const gap = lineTop(curr) - lineBottom(prev)
    const avgLineHeight = (lineHeight(prev) + lineHeight(curr)) / 2
    const isLargeGap = gap > avgLineHeight * 1.6

    // Only split on bold switch when one line is a standalone heading
    const isHeadingBoundary = isHeadingLine(prev) !== isHeadingLine(curr)

    if (isLargeGap || isHeadingBoundary) {
      groups.push([curr])
    } else {
      groups[groups.length - 1].push(curr)
    }
  }

  return groups
}

function mergeLines(lines: Line[]): Span[] {
  const merged: Span[] = []
  for (let li = 0; li < lines.length; li++) {
    const spans = lines[li].spans
    for (let si = 0; si < spans.length; si++) {
      const span = spans[si]
      const isLastSpanInLine = si === spans.length - 1
      const isLastLine = li === lines.length - 1
      if (isLastSpanInLine && !isLastLine) {
        const text = span.text
        if (text.endsWith('-')) {
          merged.push({ ...span, text: text.slice(0, -1) })
        } else {
          merged.push({ ...span, text: text.trimEnd() + ' ' })
        }
      } else {
        merged.push(span)
      }
    }
  }
  return merged
}

function dominantStyle(lines: Line[]) {
  const spans = lines.flatMap(l => l.spans)
  if (!spans.length) return { size: 12, bold: false, italic: false }
  const size = spans.reduce((a, s) => a + s.size, 0) / spans.length
  const bold = spans.filter(s => s.bold).length > spans.length / 2
  const italic = spans.filter(s => s.italic).length > spans.length / 2
  return { size, bold, italic }
}

function TextBlock({ el, style, pageWidth }: { el: Element; style: DocStyle; pageWidth: number }) {
  const leftPct = (el.bbox[0] / pageWidth) * 100
  const widthPct = ((pageWidth - el.bbox[0]) / pageWidth) * 100
  const isHeading = el.block_type === 'heading' || el.block_type === 'subheading'
  const ds = dominantStyle(el.lines ?? [])

  // If Gemini provided clean text, render it as a single styled block
  if (el.gemini_text) {
    return (
      <div style={{ marginLeft: `${leftPct}%`, width: `${widthPct}%`, marginBottom: '4px' }}>
        <p className="m-0 p-0" style={{ lineHeight: style.lineHeight }}>
          <span style={{
            fontFamily: style.fontFamily,
            fontSize: ds.size * style.fontScale,
            fontWeight: ds.bold ? Math.max(style.fontWeight, 700) : style.fontWeight,
            fontStyle: ds.italic ? 'italic' : 'normal',
            color: style.textColor,
          }}>
            {el.gemini_text}
          </span>
        </p>
      </div>
    )
  }

  // Fallback: use original spans with heuristic line grouping
  const groups = isHeading ? (el.lines ?? []).map(l => [l]) : groupLines(el.lines ?? [])
  return (
    <div style={{ marginLeft: `${leftPct}%`, width: `${widthPct}%`, marginBottom: '4px' }}>
      {groups.map((group, gi) => {
        const spans = mergeLines(group)
        return (
          <p key={gi} className="m-0 p-0" style={{ lineHeight: style.lineHeight }}>
            {spans.map((span, i) => (
              <span
                key={i}
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: span.size * style.fontScale,
                  fontWeight: span.bold ? Math.max(style.fontWeight, 700) : style.fontWeight,
                  fontStyle: span.italic ? 'italic' : 'normal',
                  color: style.textColor,
                }}
              >
                {span.text}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function ImageBlock({ el, pageWidth }: { el: Element; pageWidth: number }) {
  if (!el.src) return null
  const leftPct = (el.bbox[0] / pageWidth) * 100
  const widthPct = ((el.bbox[2] - el.bbox[0]) / pageWidth) * 100

  return (
    <div style={{ marginLeft: `${leftPct}%`, width: `${widthPct}%`, marginBottom: '8px' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={el.src} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  )
}

function TableBlock({ el, style, pageWidth }: { el: Element; style: DocStyle; pageWidth: number }) {
  if (!el.rows?.length) return null
  const leftPct = (el.bbox[0] / pageWidth) * 100
  const widthPct = ((el.bbox[2] - el.bbox[0]) / pageWidth) * 100

  return (
    <div style={{ marginLeft: `${leftPct}%`, width: `${widthPct}%`, marginBottom: '8px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {el.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    border: '1px solid #d1d5db',
                    padding: '4px 8px',
                    fontFamily: style.fontFamily,
                    fontSize: 11 * style.fontScale,
                    fontWeight: style.fontWeight,
                    color: style.textColor,
                    lineHeight: style.lineHeight,
                  }}
                >
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

function Column({ elements, style, pageWidth }: { elements: Element[]; style: DocStyle; pageWidth: number }) {
  return (
    <div className="flex flex-col">
      {elements.map((el, i) => {
        if (el.type === 'text_block') return <TextBlock key={i} el={el} style={style} pageWidth={pageWidth} />
        if (el.type === 'image') return <ImageBlock key={i} el={el} pageWidth={pageWidth} />
        if (el.type === 'table') return <TableBlock key={i} el={el} style={style} pageWidth={pageWidth} />
        return null
      })}
    </div>
  )
}

export default function PdfPage({ page, style }: { page: PageData; style: DocStyle }) {
  const isTwoCol = page.layout === 'two-column'
  const col0 = page.elements.filter(el => el.column === 0)
  const col1 = page.elements.filter(el => el.column === 1)

  // For single column, pass full page width for x% calculations
  // For two-column, each column gets half the page width
  const colWidth = isTwoCol ? page.width / 2 : page.width

  return (
    <div
      className="w-full max-w-4xl rounded shadow-md p-10"
      style={{ backgroundColor: style.backgroundColor }}
    >
      {isTwoCol ? (
        <div className="grid grid-cols-2 gap-8">
          <Column elements={col0} style={style} pageWidth={colWidth} />
          <Column elements={col1} style={style} pageWidth={colWidth} />
        </div>
      ) : (
        <Column elements={page.elements} style={style} pageWidth={page.width} />
      )}
    </div>
  )
}
