# 🤖 OxAlpha AI Chatbot MVP

A high-performance, lightweight web-based AI chatbot application powered by **Bun**, **ElysiaJS**, **Svelte**, **Tailwind CSS**, and **OpenRouter API**.

---

## ⚡ Tech Stack

- **Monorepo:** Bun workspaces
- **Backend:** [ElysiaJS](https://elysiajs.com/) on [Bun](https://bun.sh/)
- **Frontend:** [Svelte 5](https://svelte.dev/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/)
- **AI Gateway:** [OpenRouter API](https://openrouter.ai/) (Unified interface for GPT-4o, Claude 3.5, Llama 3, DeepSeek, etc.)
- **Markdown & Code Highlighting:** `marked` + `highlight.js`

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Configure OpenRouter API Key
Copy the `.env.example` in `backend/`:
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and insert your OpenRouter API key:
```env
PORT=3001
OPENROUTER_API_KEY=sk-or-v1-your-key-here
SITE_URL=http://localhost:5173
SITE_NAME=AI Chatbot MVP
```

### 3. Run Development Servers
To run both backend and frontend concurrently:
```bash
bun run dev
```

Or run them individually:
```bash
# Start ElysiaJS backend on port 3001
bun run dev:backend

# Start Svelte frontend on port 5173
bun run dev:frontend
```

Open your browser at `http://localhost:5173`.

---

## 🔌 API Endpoints

### `GET /api/health`
Health check and uptime monitoring.
```json
{
  "status": "ok",
  "uptime": 42
}
```

### `POST /api/chat`
Send chat messages to OpenRouter.
- **Request:**
  ```json
  {
    "model": "openai/gpt-4o-mini",
    "messages": [
      { "role": "user", "content": "Hello, explain microservices in one sentence." }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": {
      "role": "assistant",
      "content": "Microservices is an architectural pattern where an application is structured as a collection of small, independently deployable services."
    }
  }
  ```

---

## 📂 Project Structure

```
chatbot-oxalpha/
├── package.json               # Root workspace configuration
├── README.md
├── PRD-Elysia-Svelte-Chatbot.md
├── backend/                   # ElysiaJS Backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── .env
│   └── src/
│       ├── index.ts           # Elysia API server & routes
│       └── services/
│           └── openrouter.ts  # OpenRouter API client
└── frontend/                  # Svelte + Tailwind CSS Frontend
    ├── package.json
    ├── vite.config.ts
    ├── svelte.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── app.css
        ├── main.ts
        ├── App.svelte
        └── lib/
            ├── store.ts       # State management (chatHistory, isTyping, selectedModel)
            ├── store.js       # Store export alias
            ├── components/
            │   ├── ChatWindow.svelte
            │   ├── MessageBubble.svelte
            │   ├── ChatInput.svelte
            │   └── ModelSelector.svelte
            └── utils/
                └── markdown.ts
```
