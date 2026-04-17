'use client'

import { useState } from 'react'
import { login } from '@/app/auth/actions'
import Link from 'next/link'
import GoogleButton from '@/components/GoogleButton'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await login(formData)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

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
            Welcome<br />back.
          </h1>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-0.5 bg-[var(--background)]/30" />
            <div className="w-3 h-3 border border-[var(--background)]/30" />
          </div>
          <p className="text-base leading-relaxed opacity-50 max-w-xs">
            Your documents are waiting.<br />Pick up right where you left off.
          </p>
        </div>
        <p className="text-xs opacity-70 tracking-widest uppercase">Designed for dyslexia</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-12 bg-[var(--background)]">
        <div className="w-full max-w-sm mx-auto">

          {/* Mobile-only logo */}
          <div className="md:hidden mb-10">
            <Link href="/" className="text-xs font-bold tracking-widest uppercase">PDFReader</Link>
          </div>

          <div className="mb-10">
            <p className="text-xs tracking-widest uppercase font-bold text-[var(--muted-foreground)] mb-2">Account</p>
            <h2 className="text-4xl font-bold tracking-tight">Sign in</h2>
          </div>

          <GoogleButton label="Continue with Google" />

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-[var(--border-light)]" />
            <span className="text-xs tracking-widest uppercase text-[var(--muted-foreground)]">or</span>
            <div className="flex-1 h-px bg-[var(--border-light)]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs tracking-widest uppercase font-bold text-[var(--muted-foreground)]">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-0 py-2 border-b-2 border-[var(--border-light)] bg-transparent text-[var(--foreground)] text-sm outline-none focus:border-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 transition-colors duration-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs tracking-widest uppercase font-bold text-[var(--muted-foreground)]">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-0 py-2 border-b-2 border-[var(--border-light)] bg-transparent text-[var(--foreground)] text-sm outline-none focus:border-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 transition-colors duration-100"
              />
            </div>

            {error && (
              <p className="text-xs font-bold tracking-wide text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[var(--foreground)] text-[var(--background)] text-xs font-bold tracking-widest uppercase hover:bg-[var(--background)] hover:text-[var(--foreground)] border-2 border-[var(--foreground)] disabled:opacity-40 transition-colors duration-100 rounded-[var(--radius-sm)]"
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <p className="text-xs text-[var(--muted-foreground)] mt-10">
            No account?{' '}
            <Link href="/signup" className="text-[var(--foreground)] font-bold hover:underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
