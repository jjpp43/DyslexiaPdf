"use client";

import { useState } from "react";

const FONT_SIZES = [14, 16, 20, 24] as const;
type FontSize = (typeof FONT_SIZES)[number];

const SPACINGS = [
  { label: "Tight", value: 1.4 },
  { label: "Normal", value: 1.65 },
  { label: "Wide", value: 2.0 },
] as const;
type Spacing = (typeof SPACINGS)[number]["value"];

const THEMES = [
  { label: "White",    bg: "#ffffff", fg: "#0a0a0a", muted: "#6b7280", headerBorder: "#0a0a0a" },
  { label: "Sepia",    bg: "#fdf6e3", fg: "#3b3020", muted: "#8a7a5a", headerBorder: "#3b3020" },
  { label: "Dark",     bg: "#1e1e1e", fg: "#f0f0f0", muted: "#9ca3af", headerBorder: "#444"    },
  { label: "Contrast", bg: "#000000", fg: "#ffffff", muted: "#d1d5db", headerBorder: "#555"    },
] as const;
type ThemeIndex = 0 | 1 | 2 | 3;

const SWATCH_BORDER: Record<number, string> = {
  0: "#d1d5db",
  1: "#d4c9a8",
  2: "#444",
  3: "#555",
};

export default function BeforeAfter() {
  const [fontSize, setFontSize] = useState<FontSize>(16);
  const [spacing, setSpacing] = useState<Spacing>(1.65);
  const [themeIdx, setThemeIdx] = useState<ThemeIndex>(0);

  const theme = THEMES[themeIdx];

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="text-xs tracking-widest uppercase font-bold text-[var(--muted-foreground)] mb-4">
            Before / After
          </p>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[1.17]">
            <span className="hover:bg-[var(--muted)] transition-colors duration-200 [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1">
              See the<br />difference.
            </span>
          </h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--foreground)] border border-[var(--foreground)] rounded-[var(--radius)] overflow-hidden">
          {/* Center arrow badge */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[var(--foreground)] items-center justify-center">
            <span className="text-[var(--background)] text-base font-bold">→</span>
          </div>

          {/* Before panel */}
          <div className="bg-[#f0ece4] flex flex-col">
            <div className="px-4 py-2 bg-black flex items-center justify-between flex-shrink-0">
              <span style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10px", color: "#ffffff", letterSpacing: "0.05em" }}>
                Original PDF
              </span>
              <span style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em" }}>
                Times New Roman · 11pt
              </span>
            </div>
            <div
              className="flex-1 overflow-y-auto p-5"
              style={{ height: "420px", fontFamily: "'Times New Roman', Times, serif", fontSize: "11px", lineHeight: "1.2", color: "#1a1a1a", textAlign: "justify" }}
            >
              <p style={{ fontSize: "13px", fontWeight: "bold", textAlign: "center", marginBottom: "4px" }}>
                The Effect of Typography on Reading Comprehension in Dyslexic Adults
              </p>
              <p style={{ fontSize: "10px", textAlign: "center", marginBottom: "12px" }}>
                M. Hartley<sup>1</sup>, P. Singh<sup>2</sup>, A. Okonkwo<sup>1</sup>
              </p>
              <p style={{ fontSize: "9px", textAlign: "center", marginBottom: "12px", color: "#555" }}>
                <sup>1</sup>Department of Cognitive Sciences, University of Northfield &nbsp;
                <sup>2</sup>School of Educational Psychology, Ravenswood College
              </p>
              <p style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "3px" }}>Abstract</p>
              <p style={{ marginBottom: "10px" }}>
                This study examined the relationship between typographic presentation and reading comprehension among adults with diagnosed dyslexia (n=84). Participants completed standardized comprehension assessments after reading matched passages in two conditions: a conventional serif typeface (Times New Roman, 11pt, justified) and a purpose-designed dyslexia-friendly typeface (Atkinson Hyperlegible, 16pt, left-aligned). Results indicate a statistically significant improvement in comprehension scores under the dyslexia-friendly condition (p&lt;0.001), with a mean increase of 34.7% across all passage types.
              </p>
              <p style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "3px" }}>1. Results</p>
              <p style={{ marginBottom: "10px" }}>
                Comprehension scores were significantly higher in the dyslexia-friendly condition (M=71.3, SD=12.4) compared to the standard condition (M=52.9, SD=14.1), t(83)=9.24, p&lt;0.001, d=1.01. Reading speed also improved, with mean reading time decreasing from 18.4 minutes to 14.2 minutes per passage. Error rates on factual recall questions dropped from 41.2% to 22.8%. Participants reported significantly lower cognitive load in the dyslexia-friendly condition on all subscales of the NASA Task Load Index.
              </p>
              <p style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "3px" }}>2. Discussion</p>
              <p style={{ marginBottom: "10px" }}>
                These findings are consistent with prior literature suggesting that typographic variables exert meaningful influence on reading performance in individuals with dyslexia (Rello &amp; Baeza-Yates, 2013; Wery &amp; Diliberto, 2017). The large effect size (d=1.01) observed in this study exceeds that reported in earlier work, possibly reflecting the compound benefit of simultaneously optimizing multiple typographic parameters rather than manipulating a single variable. Justified alignment in particular appeared to generate irregular inter-word spacing that participants described as visually disruptive.
              </p>
              <p style={{ fontSize: "9px", fontWeight: "bold", marginBottom: "3px" }}>References</p>
              <p style={{ fontSize: "9px", marginBottom: "4px" }}>Rello, L., &amp; Baeza-Yates, R. (2013). Good fonts for dyslexia. <em>Proceedings of ASSETS 2013</em>, 14–21.</p>
              <p style={{ fontSize: "9px", marginBottom: "4px" }}>Wery, J. J., &amp; Diliberto, J. A. (2017). The effect of a specialized dyslexia font, OpenDyslexic, on reading rate and accuracy. <em>Annals of Dyslexia</em>, 67(2), 114–127.</p>
              <p style={{ fontSize: "9px", marginBottom: "4px" }}>British Dyslexia Association. (2018). <em>Dyslexia style guide</em>. BDA.</p>
            </div>
          </div>

          {/* After panel */}
          <div className="flex flex-col" style={{ backgroundColor: theme.bg }}>
            {/* Header */}
            <div
              className="px-4 py-2 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: `1px solid ${theme.headerBorder}` }}
            >
              <span
                className="text-[10px] tracking-widest uppercase font-bold"
                style={{ fontFamily: "var(--font-atkinson), Arial, sans-serif", color: theme.fg }}
              >
                PDFReader
              </span>
              <span
                className="text-[10px] tracking-widest uppercase"
                style={{ fontFamily: "var(--font-atkinson), Arial, sans-serif", color: theme.muted }}
              >
                {fontSize}pt · {SPACINGS.find(s => s.value === spacing)?.label}
              </span>
            </div>

            {/* Toolbar */}
            <div
              className="px-4 py-2 flex items-center gap-4 flex-wrap flex-shrink-0"
              style={{ borderBottom: `1px solid ${theme.headerBorder}20`, backgroundColor: theme.bg }}
            >
              {/* Font size */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] tracking-widest uppercase mr-1" style={{ color: theme.muted, fontFamily: "var(--font-atkinson), Arial, sans-serif" }}>Size</span>
                {FONT_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFontSize(s)}
                    className="w-7 h-6 text-[10px] font-bold transition-colors duration-100"
                    style={{
                      fontFamily: "var(--font-atkinson), Arial, sans-serif",
                      border: `1px solid ${theme.fg}`,
                      backgroundColor: fontSize === s ? theme.fg : "transparent",
                      color: fontSize === s ? theme.bg : theme.fg,
                      cursor: "pointer",
                      borderRadius: 3,
                    }}
                  >
                    {s === 14 ? "S" : s === 16 ? "M" : s === 20 ? "L" : "XL"}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: `${theme.fg}30` }} />

              {/* Spacing */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] tracking-widest uppercase mr-1" style={{ color: theme.muted, fontFamily: "var(--font-atkinson), Arial, sans-serif" }}>Spacing</span>
                {SPACINGS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSpacing(s.value)}
                    className="px-2 h-6 text-[10px] font-bold transition-colors duration-100"
                    style={{
                      fontFamily: "var(--font-atkinson), Arial, sans-serif",
                      border: `1px solid ${theme.fg}`,
                      backgroundColor: spacing === s.value ? theme.fg : "transparent",
                      color: spacing === s.value ? theme.bg : theme.fg,
                      cursor: "pointer",
                      borderRadius: 3,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: `${theme.fg}30` }} />

              {/* Theme swatches */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] tracking-widest uppercase mr-1" style={{ color: theme.muted, fontFamily: "var(--font-atkinson), Arial, sans-serif" }}>Theme</span>
                {THEMES.map((t, i) => (
                  <button
                    key={t.label}
                    onClick={() => setThemeIdx(i as ThemeIndex)}
                    title={t.label}
                    className="w-5 h-5 transition-all duration-100"
                    style={{
                      backgroundColor: t.bg,
                      border: themeIdx === i
                        ? `2px solid ${theme.fg}`
                        : `1px solid ${SWATCH_BORDER[i]}`,
                      cursor: "pointer",
                      outline: "none",
                      borderRadius: 3,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div
              className="overflow-y-auto px-6 py-5"
              style={{
                height: "380px",
                fontFamily: "var(--font-atkinson), Arial, sans-serif",
                fontSize: `${fontSize}px`,
                lineHeight: spacing,
                color: theme.fg,
              }}
            >
              <p style={{ fontWeight: "bold", fontSize: `${fontSize + 2}px`, marginBottom: "4px" }}>
                The Effect of Typography on Reading Comprehension in Dyslexic Adults
              </p>
              <p style={{ fontSize: `${fontSize - 2}px`, color: theme.muted, marginBottom: "28px" }}>
                M. Hartley · P. Singh · A. Okonkwo
              </p>

              <p style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "bold", color: theme.muted, marginBottom: "8px" }}>Abstract</p>
              <p style={{ fontSize: `${fontSize - 2}px`, marginBottom: "28px" }}>
                This study examined the relationship between typographic presentation and reading comprehension among adults with diagnosed dyslexia (n=84). Participants read matched passages in two conditions: a conventional serif typeface and a purpose-designed dyslexia-friendly typeface. Results indicate a statistically significant improvement in comprehension scores under the dyslexia-friendly condition (p&lt;0.001), with a mean increase of 34.7%.
              </p>

              <p style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "bold", color: theme.muted, marginBottom: "8px" }}>Results</p>
              <p style={{ fontSize: `${fontSize - 2}px`, marginBottom: "28px" }}>
                Comprehension scores were significantly higher in the dyslexia-friendly condition (M=71.3, SD=12.4) compared to the standard condition (M=52.9, SD=14.1). Reading speed also improved — mean reading time decreased from 18.4 minutes to 14.2 minutes per passage. Error rates on factual recall dropped from 41.2% to 22.8%.
              </p>

              <p style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "bold", color: theme.muted, marginBottom: "8px" }}>Discussion</p>
              <p style={{ fontSize: `${fontSize - 2}px`, marginBottom: "28px" }}>
                These findings are consistent with prior literature suggesting that typographic variables exert meaningful influence on reading performance in individuals with dyslexia. The large effect size (d=1.01) observed in this study exceeds that reported in earlier work, possibly reflecting the compound benefit of simultaneously optimizing multiple typographic parameters.
              </p>

              <p style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "bold", color: theme.muted, marginBottom: "8px" }}>References</p>
              <p style={{ fontSize: `${fontSize - 2}px`, marginBottom: "8px" }}>Rello, L., &amp; Baeza-Yates, R. (2013). Good fonts for dyslexia. <em>Proceedings of ASSETS 2013</em>, 14–21.</p>
              <p style={{ fontSize: `${fontSize - 2}px`, marginBottom: "8px" }}>Wery, J. J., &amp; Diliberto, J. A. (2017). The effect of a specialized dyslexia font, OpenDyslexic, on reading rate and accuracy. <em>Annals of Dyslexia</em>, 67(2), 114–127.</p>
              <p style={{ fontSize: `${fontSize - 2}px` }}>British Dyslexia Association. (2018). <em>Dyslexia style guide</em>. BDA.</p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-sm text-[var(--muted-foreground)] tracking-wide">
          Same document. Same words. Completely different reading experience.
        </p>
      </div>
    </section>
  );
}
