# 🤖 OxAlpha AI Chatbot

A lightweight AI Chatbot built with **Bun**, **ElysiaJS**, **Svelte 5**, and **OpenRouter API**.

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
