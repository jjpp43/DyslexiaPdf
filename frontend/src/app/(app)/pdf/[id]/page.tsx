import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PdfViewer from '@/components/PdfViewer'

export default async function PdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: pdf } = await supabase
    .from('pdfs')
    .select('id, name, page_count, status, storage_path')
    .eq('id', id)
    .single()

  if (!pdf) notFound()

  // Generate a 1-hour signed URL for the original PDF
  const { data: signed } = await supabase.storage
    .from('pdfs')
    .createSignedUrl(pdf.storage_path, 3600)

  const { data: initialPages } = await supabase
    .from('pdf_pages')
    .select('page_number, page_data')
    .eq('pdf_id', id)
    .order('page_number', { ascending: true })
    .range(0, 9)

  return (
    <PdfViewer
      pdf={{ id: pdf.id, name: pdf.name, page_count: pdf.page_count, storage_path: pdf.storage_path }}
      pages={initialPages ?? []}
      pdfUrl={signed?.signedUrl ?? ''}
    />
  )
}
