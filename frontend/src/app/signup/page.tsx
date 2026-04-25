import Link from 'next/link'
import GoogleButton from '@/components/GoogleButton'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">

      {/* Left — editorial panel */}
      <div className="hidden md:flex md:w-2/5 bg-[var(--foreground)] text-[var(--background)] flex-col justify-between p-12 flex-shrink-0">
        <Link
          href="/"
          className="text-xs font-bold tracking-widest uppercase text-[var(--background)] hover:opacity-60 transition-opacity duration-100"
        >
          PDFReader
        </Link>
        <div>
          <h1 className="text-6xl font-bold leading-none tracking-tighter mb-6">
            Start reading<br />differently.
          </h1>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-0.5 bg-[var(--background)]/30" />
            <div className="w-3 h-3 border border-[var(--background)]/30" />
          </div>
          <p className="text-sm leading-relaxed opacity-50 max-w-xs">
            A cleaner, more readable experience for every PDF. Free to start, no credit card required.
          </p>
        </div>
        <p className="text-xs opacity-30 tracking-widest uppercase">Designed for dyslexia</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-12 bg-[var(--background)]">
        <div className="w-full max-w-sm mx-auto">

          {/* Mobile-only logo */}
          <div className="md:hidden mb-10">
            <Link href="/" className="text-xs font-bold tracking-widest uppercase">PDFReader</Link>
          </div>

          <div className="mb-10">
            <p className="text-xs tracking-widest uppercase font-bold text-[var(--muted-foreground)] mb-2">Create account</p>
            <h2 className="text-4xl font-bold tracking-tight">Sign up</h2>
          </div>

          <GoogleButton label="Sign up with Google" />

          <p className="text-xs text-[var(--muted-foreground)] mt-10">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--foreground)] font-bold hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
