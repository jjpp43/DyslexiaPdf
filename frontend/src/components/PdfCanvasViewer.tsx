'use client'

import { useRef, useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

type Element = {
  type: string
  bbox: [number, number, number, number]
}

type PageData = {
  width: number
  height: number
  elements: Element[]
}

function hexToRgba(hex: string | undefined, opacity: number) {
  const h = hex ?? '#3B82F6'
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export default function PdfCanvasViewer({
  pdfUrl,
  pageNumber,
  pageData,
  activeIndex,
  onSelect,
  onScrollTo,
  highlightColor,
  highlightOpacity,
}: {
  pdfUrl: string
  pageNumber: number
  pageData: PageData | null
  activeIndex: number | null
  onSelect: (index: number | null) => void
  onScrollTo: (index: number) => void
  highlightColor: string
  highlightOpacity: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="flex-1 overflow-auto">
      {containerWidth > 0 && (
        <div style={{ position: 'relative', width: containerWidth }}>
          <div style={{ filter: 'invert(1) hue-rotate(180deg)' }}>
            <Document file={pdfUrl} loading={null}>
              <Page
                pageNumber={pageNumber}
                width={containerWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>

          {/* Clickable overlay rects */}
          {pageData && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {pageData.elements.map((el, i) => {
                const [x0, y0, x1, y1] = el.bbox
                const pw = pageData.width
                const ph = pageData.height
                const isActive = activeIndex === i

                return (
                  <div
                    key={i}
                    onMouseEnter={() => onSelect(i)}
                    onMouseLeave={() => onSelect(null)}
                    onClick={() => onScrollTo(i)}
                    style={{
                      position: 'absolute',
                      left: `${(x0 / pw) * 100}%`,
                      top: `${(y0 / ph) * 100}%`,
                      width: `${((x1 - x0) / pw) * 100}%`,
                      height: `${((y1 - y0) / ph) * 100}%`,
                      backgroundColor: isActive ? hexToRgba(highlightColor, highlightOpacity) : 'transparent',
                      border: `2px solid ${isActive ? hexToRgba(highlightColor, Math.min(1, highlightOpacity + 0.4)) : 'transparent'}`,
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      boxSizing: 'border-box',
                      borderRadius: 2,
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
