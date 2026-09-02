# 🤖 OxAlpha AI Chatbot

A lightweight AI Chatbot built with **Bun**, **ElysiaJS**, **Svelte 5**, and **OpenRouter API**.

## ✨ Fitur
- Chat dengan berbagai model lewat OpenRouter (GPT-4o Mini, Claude 3.5 Sonnet, DeepSeek V3, Gemini 2.0 Flash, atau model custom apa pun)
- Markdown & syntax highlighting untuk balasan AI, dengan tombol copy per code block
- Dark mode (mengikuti `prefers-color-scheme`, bisa di-toggle manual)
- Retry otomatis untuk pesan yang gagal terkirim
- Riwayat chat & model pilihan tersimpan di `localStorage`

## 🚀 Quick Start

### 1. Setup
```bash
bun install
cp backend/.env.example backend/.env
```
Tambahkan API key OpenRouter ke dalam file `backend/.env`:
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 2. Jalankan Aplikasi
```bash
bun run dev
```
Buka browser di **http://localhost:5173**.

---

## 🛠️ Tech Stack
- **Runtime:** Bun
- **Backend:** ElysiaJS
- **Frontend:** Svelte 5 + Tailwind CSS + Vite
- **AI Gateway:** OpenRouter API

---

## 📜 Perintah / Scripts
- `bun run dev` — Jalankan backend & frontend bersamaan
- `bun run dev:backend` — Jalankan backend saja (port 3001)
- `bun run dev:frontend` — Jalankan frontend saja (port 5173)
- `bun run build` — Build frontend untuk production
- `bun run health` — Cek endpoint `/api/health` backend

Khusus di dalam `frontend/`:
- `bun run check` — Type-check dengan `svelte-check`
- `bun run test` — Jalankan test suite (Vitest + Testing Library)
- `bun run test:watch` — Test dalam mode watch
- `bun run test:coverage` — Test dengan laporan coverage

---

## 🐳 Deploy dengan Docker
Backend menyajikan hasil build frontend sebagai static file, jadi satu container sudah mencakup keduanya.

```bash
docker build -t oxalpha-ai .
docker run -p 3001:3001 --env-file backend/.env oxalpha-ai
```
Buka **http://localhost:3001** — backend (API + frontend statis) berjalan di satu port yang sama.
