export default function WorkspacePage() {
  return (
    <div className="flex-1 flex items-center justify-center text-[var(--muted-foreground)]">
      <div className="text-center space-y-3">
        <p className="text-xs tracking-widest uppercase font-bold text-[var(--accent)]">No PDF selected</p>
        <p className="text-xs text-[var(--muted-foreground)]">Upload or select a PDF from the sidebar</p>
      </div>
    </div>
  )
}
