'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logout } from '@/app/auth/actions'
import Link from 'next/link'

type PDF = {
  id: string
  name: string
  status: 'pending' | 'processing' | 'done' | 'error'
  page_count: number | null
  storage_path: string
  created_at: string
}

type ContextMenu = {
  x: number
  y: number
  pdf: PDF
}

const MAX_FILE_SIZE_MB = 25
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export default function Sidebar() {
  const [pdfs, setPdfs] = useState<PDF[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const MAX_NAME_LENGTH = 60

  const fetchPdfs = useCallback(async () => {
    const { data } = await supabase
      .from('pdfs')
      .select('id, name, status, page_count, storage_path, created_at')
      .order('created_at', { ascending: false })
    if (data) setPdfs(data as PDF[])
  }, [supabase])

  useEffect(() => {
    fetchPdfs()

    const interval = setInterval(() => {
      setPdfs(prev => {
        const hasProcessing = prev.some(p => p.status === 'pending' || p.status === 'processing')
        if (hasProcessing) fetchPdfs()
        return prev
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [fetchPdfs])

  useEffect(() => {
    function handleClick() { setContextMenu(null) }
    if (contextMenu) window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [contextMenu])

  function handleContextMenu(e: React.MouseEvent, pdf: PDF) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, pdf })
  }

  function handleRenameStart(pdf: PDF) {
    setContextMenu(null)
    setRenaming({ id: pdf.id, name: pdf.name })
    setTimeout(() => { renameInputRef.current?.select() }, 0)
  }

  async function handleRenameCommit() {
    if (!renaming) return
    const trimmed = renaming.name.trim()
    if (!trimmed) { setRenaming(null); return }
    setRenaming(null)
    await supabase.from('pdfs').update({ name: trimmed }).eq('id', renaming.id)
    setPdfs(prev => prev.map(p => p.id === renaming.id ? { ...p, name: trimmed } : p))
  }

  async function handleDelete(pdf: PDF) {
    setContextMenu(null)
    setDeleting(pdf.id)
    try {
      if (pdf.storage_path) {
        const { error: storageError } = await supabase.storage.from('pdfs').remove([pdf.storage_path])
        if (storageError) throw new Error(`Storage delete failed: ${storageError.message}`)
      }
      await supabase.from('pdfs').delete().eq('id', pdf.id)
      setPdfs(prev => prev.filter(p => p.id !== pdf.id))
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(null)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || file.type !== 'application/pdf') return
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File too large. Free plan limit is ${MAX_FILE_SIZE_MB} MB.`)
      return
    }
    setUploadError(null)
    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const pdfId = crypto.randomUUID()
      const { error: insertError } = await supabase
        .from('pdfs')
        .insert({
          id: pdfId,
          user_id: user.id,
          name: file.name.replace(/\.pdf$/i, ''),
          storage_path: '',
          status: 'pending',
        })

      if (insertError) throw new Error(`DB insert failed: ${insertError.message} (code: ${insertError.code})`)
      const pdfRecord = { id: pdfId }

      const storagePath = `${user.id}/${pdfRecord.id}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(storagePath, file, { contentType: 'application/pdf' })

      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

      await supabase.from('pdfs').update({ storage_path: storagePath }).eq('id', pdfRecord.id)
      await fetchPdfs()

      const parseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_id: pdfRecord.id, storage_path: storagePath }),
      })
      if (!parseRes.ok) {
        const text = await parseRes.text()
        throw new Error(`Parse request failed: ${parseRes.status} ${text}`)
      }

      await fetchPdfs()
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* Collapsing sidebar — shrinks to 0, no content visible when closed */}
      <aside
        className="flex flex-col bg-[var(--sidebar-bg)] shrink-0"
        style={{
          width: collapsed ? 0 : 256,
          minWidth: collapsed ? 0 : 256,
          overflow: 'hidden',
          transition: 'width 200ms ease-in-out, min-width 200ms ease-in-out',
        }}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-[var(--sidebar-border)]" style={{ minWidth: 256 }}>
          <h1 className="text-xs font-bold tracking-widest uppercase text-[var(--foreground)]">PDFReader</h1>
        </div>

        {/* Upload button */}
        <div className="px-3 py-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold tracking-widest uppercase border-2 border-[var(--accent)] text-[var(--accent)] bg-transparent hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-40 transition-colors duration-100 rounded-[var(--radius-sm)]"
          >
            <span className="text-sm leading-none">+</span>
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
          {uploadError && (
            <p className="text-xs text-red-600 mt-1.5 px-1 font-medium">{uploadError}</p>
          )}
        </div>

        {/* PDF list */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-px py-1">
          {pdfs.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)] px-2 py-4 text-center tracking-wide">No PDFs yet</p>
          ) : (
            pdfs.map((pdf) => (
              renaming?.id === pdf.id ? (
                <div key={pdf.id} className="px-2 py-2 flex flex-col gap-1">
                  <input
                    ref={renameInputRef}
                    value={renaming.name}
                    onChange={e => {
                      if (e.target.value.length <= MAX_NAME_LENGTH)
                        setRenaming({ ...renaming, name: e.target.value })
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameCommit()
                      if (e.key === 'Escape') setRenaming(null)
                    }}
                    onBlur={handleRenameCommit}
                    maxLength={MAX_NAME_LENGTH}
                    className="w-full text-sm text-[var(--foreground)] bg-[var(--background)] border border-[var(--sidebar-border)] px-2 py-0.5 outline-none focus:border-[var(--foreground)] rounded-[var(--radius-sm)]"
                  />
                  <span className="text-xs text-[var(--muted-foreground)] text-right">{renaming.name.length}/{MAX_NAME_LENGTH}</span>
                </div>
              ) : (
                <Link
                  key={pdf.id}
                  href={pdf.status === 'done' ? `/pdf/${pdf.id}` : '#'}
                  onContextMenu={e => handleContextMenu(e, pdf)}
                  className={`w-full text-left px-2 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] truncate transition-colors duration-100 flex flex-col gap-0.5 rounded-[var(--radius-sm)] ${deleting === pdf.id ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <span className="truncate">{pdf.name}</span>
                  <span className="text-xs opacity-50">
                    {deleting === pdf.id && 'Deleting...'}
                    {deleting !== pdf.id && pdf.status === 'done' && `${pdf.page_count} pages`}
                    {deleting !== pdf.id && pdf.status === 'processing' && 'Parsing...'}
                    {deleting !== pdf.id && pdf.status === 'pending' && 'Pending...'}
                    {deleting !== pdf.id && pdf.status === 'error' && 'Error'}
                  </span>
                </Link>
              )
            ))
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-[var(--sidebar-border)]">
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left px-2 py-2 text-xs tracking-widest uppercase font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-100"
            >
              Sign out
            </button>
          </form>
        </div>

      </aside>

      {/* Permanent toggle strip — full-height clickable column */}
      <button
        onClick={() => setCollapsed(c => !c)}
        aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
        className="flex-shrink-0 flex items-center justify-center border-r border-[var(--sidebar-border)] transition-colors duration-150 group"
        style={{
          width: 32,
          background: 'var(--muted)',
          cursor: 'pointer',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--border-light)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--muted)')}
      >
        <span className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors duration-150 text-sm select-none">
          {collapsed ? '›' : '‹'}
        </span>
      </button>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[var(--background)] border border-[var(--border-light)] py-1 min-w-[140px] rounded-[var(--radius)]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => handleRenameStart(contextMenu.pdf)}
            className="w-full text-left px-4 py-2 text-xs tracking-widest uppercase font-bold text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors duration-100"
          >
            Rename
          </button>
          <button
            onClick={() => handleDelete(contextMenu.pdf)}
            className="w-full text-left px-4 py-2 text-xs tracking-widest uppercase font-bold text-red-600 hover:bg-red-600 hover:text-white transition-colors duration-100"
          >
            Delete
          </button>
        </div>
      )}
    </>
  )
}
