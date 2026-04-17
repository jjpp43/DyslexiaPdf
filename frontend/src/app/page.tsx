import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import BeforeAfter from "@/app/BeforeAfter";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Fixed nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border-light)] bg-[var(--background)]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:opacity-60 transition-opacity duration-100">
            PDFReader
          </Link>
          <div className="flex items-center gap-6">
            {user ? (
              <>
                <form action={logout}>
                  <button
                    type="submit"
                    className="text-xs tracking-widest uppercase font-bold px-5 py-2 bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--background)] hover:text-[var(--foreground)] border-2 border-[var(--foreground)] transition-colors duration-100 rounded-[var(--radius-sm)]"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs tracking-widest uppercase font-medium px-5 py-2 border-2 border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors duration-100 rounded-[var(--radius-sm)]"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="text-xs tracking-widest uppercase font-bold px-5 py-2 bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--background)] hover:text-[var(--accent)] border-2 border-[var(--accent)] transition-colors duration-100 rounded-[var(--radius-sm)]"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="texture-lines relative pt-40 pb-32 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <span className="text-xs tracking-widest uppercase font-bold border border-[var(--accent)] px-3 py-1.5 text-[var(--accent)] rounded-[var(--radius-sm)]">
              Designed for dyslexia
            </span>
          </div>

          <h1
            className="font-bold leading-[1.17] tracking-tighter mb-8"
            style={{ fontSize: "clamp(3rem, 9vw, 8rem)" }}
          >
            <span className="hover:bg-[var(--muted)] transition-colors duration-200 [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1">
              Read<br />differently.
            </span>
          </h1>

          {/* Decorative rule + square */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-20 h-1 bg-[var(--accent)]" />
            <div className="w-4 h-4 border-2 border-[var(--accent)]" />
          </div>

          <p className="text-base md:text-lg text-[var(--muted-foreground)] max-w-lg mb-10 leading-relaxed">
            PDFReader reformats your documents into a clean, dyslexia-friendly
            layout — better spacing, better fonts, better reading.
          </p>

          <div className="flex items-center gap-8">
            {user ? (
              <Link
                href="/app"
                className="text-xs tracking-widest uppercase font-bold px-8 py-4 bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--background)] hover:text-[var(--accent)] border-2 border-[var(--accent)] transition-colors duration-100 rounded-[var(--radius-sm)]"
              >
                Open workspace →
              </Link>
            ) : (
              <Link
                href="/signup"
                className="text-xs tracking-widest uppercase font-bold px-8 py-4 bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--background)] hover:text-[var(--accent)] border-2 border-[var(--accent)] transition-colors duration-100 rounded-[var(--radius-sm)]"
              >
                Get started free →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Section rule */}
      <div className="h-1 bg-[var(--foreground)]" />

      {/* Before / After */}
      <BeforeAfter />

      {/* Section rule */}
      <div className="h-1 bg-[var(--foreground)]" />

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs tracking-widest uppercase font-bold text-[var(--muted-foreground)] mb-4">
              Features
            </p>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[1.17]">
              <span className="hover:bg-[var(--muted)] transition-colors duration-200 [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1">
                Built for how<br />you read.
              </span>
            </h2>
          </div>

          {/* Grid with 1px black dividers using gap-px trick */}
          <div className="border border-[var(--foreground)] rounded-[var(--radius)] overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--foreground)]">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group p-8 bg-[var(--background)] hover:bg-[var(--foreground)] transition-colors duration-100 cursor-default"
                >
                  <p className="text-xs tracking-widest uppercase font-bold text-[var(--muted-foreground)] group-hover:text-[var(--background)]/50 mb-5 transition-colors duration-100">
                    {f.tag}
                  </p>
                  <h3 className="text-lg font-bold mb-3 group-hover:text-[var(--background)] transition-colors duration-100">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--muted-foreground)] group-hover:text-[var(--background)]/70 transition-colors duration-100">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section rule */}
      <div className="h-1 bg-[var(--foreground)]" />

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs tracking-widest uppercase font-bold text-[var(--muted-foreground)] mb-4">
              Pricing
            </p>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[1.17]">
              <span className="hover:bg-[var(--muted)] transition-colors duration-200 [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1">
                Simple,<br />transparent.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--foreground)] border border-[var(--foreground)] rounded-[var(--radius)] overflow-hidden">
            {/* Free */}
            <div className="p-10 bg-[var(--background)] flex flex-col">
              <p className="text-xs tracking-widest uppercase font-bold text-[var(--muted-foreground)] mb-8">
                Free
              </p>
              <div className="mb-8">
                <span
                  className="font-bold tracking-tighter"
                  style={{ fontSize: "clamp(3rem,7vw,5rem)" }}
                >
                  $0
                </span>
                <span className="text-sm text-[var(--muted-foreground)] ml-2">
                  / month
                </span>
              </div>
              <ul className="space-y-3 mb-10 flex-1">
                {freeTier.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 font-bold mt-0.5">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center text-xs tracking-widest uppercase font-bold py-4 border-2 border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors duration-100 rounded-[var(--radius-sm)]"
              >
                Get started
              </Link>
            </div>

            {/* Pro — inverted */}
            <div className="p-10 bg-[var(--foreground)] text-[var(--background)] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <p className="text-xs tracking-widest uppercase font-bold opacity-50">
                  Pro
                </p>
                <span className="text-xs tracking-widest uppercase font-bold border border-[var(--background)]/30 px-2 py-1">
                  Popular
                </span>
              </div>
              <div className="mb-8">
                <span
                  className="font-bold tracking-tighter"
                  style={{ fontSize: "clamp(3rem,7vw,5rem)" }}
                >
                  $9
                </span>
                <span className="text-sm opacity-50 ml-2">/ month</span>
              </div>
              <ul className="space-y-3 mb-10 flex-1">
                {proTier.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 font-bold mt-0.5 opacity-50">
                      —
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center text-xs tracking-widest uppercase font-bold py-4 bg-[var(--background)] text-[var(--foreground)] hover:bg-transparent hover:text-[var(--background)] border-2 border-[var(--background)] transition-colors duration-100 rounded-[var(--radius-sm)]"
              >
                Start free trial →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section rule */}
      <div className="h-1 bg-[var(--foreground)]" />

      {/* Footer */}
      <footer className="py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xs font-bold tracking-widest uppercase">
            PDFReader
          </span>
          <span className="text-xs text-[var(--muted-foreground)] tracking-widest uppercase">
            © {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    tag: "01",
    title: "Dyslexia-friendly layout",
    description:
      "Documents are reformatted using Atkinson Hyperlegible — a font specifically designed for readers with dyslexia.",
  },
  {
    tag: "02",
    title: "Instant parsing",
    description:
      "Upload a PDF and get a clean, structured reading view in seconds. No waiting, no fuss.",
  },
  {
    tag: "03",
    title: "Cloud storage",
    description:
      "Your documents are stored securely and are accessible from any device at any time.",
  },
  {
    tag: "04",
    title: "Private & secure",
    description:
      "Your files are encrypted and only accessible by you. We never share or sell your data.",
  },
  {
    tag: "05",
    title: "Preserves structure",
    description:
      "Headings, paragraphs, and page breaks are preserved so you never lose context.",
  },
  {
    tag: "06",
    title: "Fully customizable",
    description:
      "Adjust font, size, spacing, and colors to match exactly how your brain prefers to read.",
  },
];

const freeTier = [
  "Up to 5 PDFs",
  "Up to 10 pages per file",
  "Up to 10 MB per file",
  "Dyslexia-friendly reader",
];

const proTier = [
  "Up to 100 PDFs",
  "Up to 400 pages per file",
  "Up to 100 MB per file",
  "Everything in Free",
];
