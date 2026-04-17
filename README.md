# DyslexiaPdf

A PDF reader built specifically for people with dyslexia. Upload any PDF and get a clean, reformatted reading view with dyslexia-friendly typography, adjustable spacing, custom color themes, and text-to-speech support.

## Features

- **Dyslexia-friendly layout** — documents are reformatted using [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible), a font designed to improve legibility for readers with dyslexia
- **Instant parsing** — upload a PDF and get a structured reading view in seconds
- **Fully customizable** — adjust font, weight, size, line height, letter spacing, and text/background colors
- **Text highlighting** — mark passages with color-coded highlights at adjustable opacity
- **Focus mode** — blur surrounding content to keep attention on the active paragraph
- **Text to speech** — listen to any paragraph with one click
- **Cloud storage** — documents saved securely and accessible from any device
- **Split view** — original PDF alongside the reformatted reading view

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Auth | Supabase Auth (email + Google OAuth) |

## Project Structure

```
.
├── frontend/          # Next.js app
│   └── src/
│       ├── app/       # Pages and layouts
│       └── components # Reusable UI components
├── backend/           # FastAPI PDF parsing service
│   ├── main.py
│   ├── routers/
│   └── services/
└── supabase_schema.sql
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- A Supabase project

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # add your Supabase URL and anon key
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
```

**Backend** (`.env`):
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```
