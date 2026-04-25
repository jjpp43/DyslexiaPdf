# PDFReader

A reading tool built for people with dyslexia. Upload any PDF and get a clean, sentence-by-sentence reading view with dyslexia-friendly typography, adjustable spacing, focus mode, and text-to-speech.

🔗 [dyslexia-pdf.vercel.app](https://dyslexia-pdf.vercel.app)

---

## How Document Processing Works

When a PDF is uploaded, it goes through a multi-step pipeline:

1. **Docling** (IBM's open-source document parser) converts the PDF into a structured document tree — detecting headings, paragraphs, tables, list items, captions, and images with their bounding boxes.

2. **PyMuPDF (fitz)** extracts embedded images from each page at 2× resolution, rendering them as base64 PNGs.

3. **Gemini 2.5 Flash** (Google's LLM) classifies each text block and reconstructs the text — fixing hyphenated line breaks, merging split sentences, and labelling block types (heading, paragraph, list item, etc.).

4. **Sentence splitting** — when a page is viewed, Gemini breaks each paragraph into individual sentences for the reading view. A regex split is shown instantly, then silently replaced with Gemini's more accurate split.

5. Pages are parsed **on demand** — only the first 3 pages are parsed on upload. Remaining pages are parsed one at a time as the user navigates, keeping the initial load fast and staying within API rate limits.

Parsed pages are stored in **Supabase (PostgreSQL)** and cached, so revisiting a page is instant.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI (Python), deployed on Railway via Docker |
| Document parsing | Docling, PyMuPDF |
| LLM | Gemini 2.5 Flash (Google AI) |
| Database & Storage | Supabase (PostgreSQL + Storage) |
| Auth | Supabase Auth (Google OAuth) |
| Frontend deployment | Vercel |
