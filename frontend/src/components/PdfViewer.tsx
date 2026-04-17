'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import ReadingPanel from '@/components/PdfToolbar'
import PdfBlocks from '@/components/PdfBlocks'
import { createClient } from '@/lib/supabase/client'

const PdfCanvasViewer = dynamic(() => import('@/components/PdfCanvasViewer'), { ssr: false })

export type DocStyle = {
  fontFamily: string
  fontScale: number
  lineHeight: number
  letterSpacing: number
  fontWeight: number
  textColor: string
  backgroundColor: string
  highlightColor: string
  highlightOpacity: number
  blurEnabled: boolean
}

const DEFAULT_STYLE: DocStyle = {
  fontFamily: 'inherit',
  fontScale: 1.0,
  lineHeight: 1.5,
  letterSpacing: 0,
  fontWeight: 400,
  textColor: '#1C1917',
  backgroundColor: '#FAFAF9',
  highlightColor: '#3B82F6',
  highlightOpacity: 0.25,
  blurEnabled: false,
}

type PageData = {
  page_number: number
  page_data: {
    page_number: number
    width: number
    height: number
    layout: string
    elements: unknown[]
  }
}

export default function PdfViewer({
  pdf,
  pages,
  pdfUrl,
}: {
  pdf: { id: string; name: string; page_count: number | null }
  pages: PageData[]
  pdfUrl: string
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [style, setStyle] = useState<DocStyle>(DEFAULT_STYLE)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [scrollToIndex, setScrollToIndex] = useState<{ index: number; key: number } | null>(null)
  const totalPages = pdf.page_count ?? pages.length
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstLoad = useRef(true)
  const fetchedPages = useRef<Set<number>>(new Set(pages.map(p => p.page_number)))
  const [pagesCache, setPagesCache] = useState<Record<number, PageData['page_data']>>(
    Object.fromEntries(pages.map(p => [p.page_number, p.page_data]))
  )

  // Load saved settings on mount — localStorage first (instant), then Supabase (sync)
  useEffect(() => {
    const cached = localStorage.getItem('pdfReaderStyle')
    if (cached) {
      try { setStyle({ ...DEFAULT_STYLE, ...JSON.parse(cached) }) } catch {}
    }

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('user_settings')
        .select('style')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.style) {
            const merged = { ...DEFAULT_STYLE, ...data.style }
            setStyle(merged)
            localStorage.setItem('pdfReaderStyle', JSON.stringify(data.style))
          }
        })
    })
  }, [])

  // Save settings whenever style changes (debounced 1s, skip first load)
  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return }
    localStorage.setItem('pdfReaderStyle', JSON.stringify(style))
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('user_settings').upsert(
        { user_id: user.id, style, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    }, 1000)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [style])

  async function fetchPage(pageNum: number) {
    if (fetchedPages.current.has(pageNum) || pageNum < 1 || pageNum > totalPages) return
    fetchedPages.current.add(pageNum)
    const supabase = createClient()
    const { data } = await supabase
      .from('pdf_pages')
      .select('page_number, page_data')
      .eq('pdf_id', pdf.id)
      .eq('page_number', pageNum)
      .single()
    if (data) {
      setPagesCache(prev => ({ ...prev, [data.page_number]: data.page_data }))
    }
  }

  useEffect(() => {
    fetchPage(currentPage)
    fetchPage(currentPage + 1)
    fetchPage(currentPage + 2)
  }, [currentPage])

  const currentPageData = pagesCache[currentPage]
    ? { page_number: currentPage, page_data: pagesCache[currentPage] }
    : null

  function goToPage(n: number) {
    const clamped = Math.max(1, Math.min(n, totalPages))
    setCurrentPage(clamped)
    setPageInput(String(clamped))
    setActiveIndex(null)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Split view + settings panel */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: original PDF */}
        <div className="flex-1 border-r border-[var(--sidebar-border)] overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-[var(--sidebar-border)] bg-[var(--toolbar-bg)] flex items-center gap-2.5">
            <span className="inline-block w-1.5 h-1.5 bg-[var(--muted-foreground)] opacity-50 flex-shrink-0" />
            <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-[var(--muted-foreground)] select-none">Source</span>
          </div>
          <PdfCanvasViewer
            pdfUrl={pdfUrl}
            pageNumber={currentPage}
            pageData={currentPageData?.page_data ?? null}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            onScrollTo={i => setScrollToIndex(prev => ({ index: i, key: (prev?.key ?? 0) + 1 }))}
            highlightColor={style.highlightColor}
            highlightOpacity={style.highlightOpacity}
          />
        </div>

        {/* Right: parsed blocks */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--sidebar-border)] bg-[var(--toolbar-bg)] flex items-center gap-2.5">
            <span className="inline-block w-1.5 h-1.5 bg-[var(--accent)] flex-shrink-0" />
            <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-[var(--foreground)] select-none">Reading View</span>
          </div>
          <div
            className="flex-1 overflow-y-auto p-6"
            style={{ backgroundColor: style.backgroundColor }}
          >
            {currentPageData ? (
              <PdfBlocks
                page={currentPageData.page_data as never}
                style={style}
                activeIndex={activeIndex}
                onSelect={setActiveIndex}
                scrollToIndex={scrollToIndex}
              />
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">No content for this page.</p>
            )}
          </div>
        </div>

        {/* Settings panel */}
        <ReadingPanel style={style} onChange={setStyle} />
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-4 px-5 border-t border-[var(--toolbar-border)] bg-[var(--toolbar-bg)]" style={{ height: 44 }}>
        {/* Reading progress */}
        <div className="flex-1 h-px bg-[var(--border-light)] relative overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-[var(--accent)] transition-[width] duration-300 ease-out"
            style={{ width: `${(currentPage / totalPages) * 100}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="w-7 h-7 flex items-center justify-center border border-[var(--sidebar-border)] text-sm disabled:opacity-30 hover:bg-[var(--foreground)] hover:text-[var(--background)] hover:border-[var(--foreground)] transition-colors duration-100 rounded-[var(--radius-sm)]"
          >
            ←
          </button>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={e => setPageInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { const n = parseInt(pageInput); if (!isNaN(n)) goToPage(n) } }}
              onBlur={() => { const n = parseInt(pageInput); if (!isNaN(n)) goToPage(n) }}
              className="w-10 text-center px-1 py-1 border border-[var(--sidebar-border)] bg-[var(--background)] text-[var(--foreground)] text-xs outline-none focus:border-[var(--foreground)] rounded-[var(--radius-sm)]"
            />
            <span className="text-[10px] tracking-widest uppercase text-[var(--muted-foreground)] select-none">of {totalPages}</span>
          </div>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="w-7 h-7 flex items-center justify-center border border-[var(--sidebar-border)] text-sm disabled:opacity-30 hover:bg-[var(--foreground)] hover:text-[var(--background)] hover:border-[var(--foreground)] transition-colors duration-100 rounded-[var(--radius-sm)]"
          >
            →
          </button>
        </div>

        {/* Mirror progress bar */}
        <div className="flex-1 h-px bg-[var(--border-light)]" />
      </div>
    </div>
  )
}
