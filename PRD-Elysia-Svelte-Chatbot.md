# 📝 Product Requirements Document (PRD)
**Project Name:** AI Chatbot MVP (Bun + Elysia + Svelte)
**Version:** 1.0.0
**Date:** August 2026
**Philosophy:** "Vibe Coding" – Ship fast, maintain high developer experience (DX), ensure type safety, and keep the runtime blazingly fast.

## 1. Executive Summary
A high-performance, lightweight web-based AI chatbot application. By leveraging Bun's ecosystem and ElysiaJS, the backend achieves microsecond latency. The frontend utilizes Svelte to deliver a virtually overhead-free, highly reactive user interface. OpenRouter acts as the LLM gateway, allowing seamless switching between models (GPT-4, Claude 3, Llama 3, etc.) without architectural changes.

## 2. Tech Stack & Architecture
*   **Monorepo Tooling:** Bun workspaces (recommended for seamless fullstack TS integration).
*   **Backend:** 
    *   Bun (Runtime & Package Manager)
    *   ElysiaJS (REST API Framework - highly optimized for Bun)
*   **Frontend:** 
    *   Svelte (Vite build tool)
    *   Tailwind CSS (Styling)
*   **AI Integration:** OpenRouter API (Unified LLM API)

## 3. UI/UX Guidelines (Design System)
The interface must adhere to a **modern tech-minimalist and clean UI/UX** standard, heavily inspired by "Google-esque" design principles.
*   **Typography:** Sans-serif, highly legible (e.g., Inter or Roboto).
*   **Color Palette:** High contrast, lots of whitespace. Subtle grays for backgrounds, bold primary colors only for actionable items (Send button, active states).
*   **Layout:** Centered chat container. Sticky input field at the bottom.
*   **Components:** Utilize Tailwind CSS with strict design tokens to ensure consistency across standard elements (buttons, inputs, chat bubbles).

## 4. Core Features (MVP)
1.  **Real-time Chat Interface:** Fluid conversational UI distinguishing user and AI messages.
2.  **LLM Routing:** Dynamic model selection via OpenRouter.
3.  **Markdown Support:** AI responses must render markdown (code blocks with syntax highlighting, tables, bold/italic text).
4.  **Contextual Memory:** Client-side session management (Svelte store) to keep conversation history alive during the session.

## 5. Backend Specifications (ElysiaJS)
The backend serves as a secure proxy to interact with OpenRouter, ensuring API keys are never exposed to the client.

### 5.1. Endpoints
**`GET /api/health`**
*   **Purpose:** Uptime monitoring and container health checks.
*   **Response:** `{ "status": "ok", "uptime": <seconds> }`

**`POST /api/chat`**
*   **Purpose:** Process chat messages and stream/return LLM responses.
*   **Payload (Request):**
    ```typescript
    {
      model: string; // e.g., "anthropic/claude-3-haiku"
      messages: Array<{ role: "user" | "assistant" | "system", content: string }>;
    }
    ```
*   **Response (Success):**
    ```typescript
    {
      success: true,
      message: { role: "assistant", content: "..." }
    }
    ```

## 6. Frontend Specifications (Svelte)
### 6.1. State Management
Use Svelte's `writable` store to manage the chat state globally within the chat route.
```javascript
// store.js
import { writable } from 'svelte/store';
export const chatHistory = writable([]);
export const isTyping = writable(false);
```

### 6.2. Key Components
*   `App.svelte`: Main layout wrapper.
*   `ChatWindow.svelte`: Handles the scrollable area of messages.
*   `MessageBubble.svelte`: Renders individual messages (includes Markdown parser logic).
*   `ChatInput.svelte`: Auto-resizing textarea with a submit event handler.

## 7. Infrastructure & Deployment
To ensure consistent development environments and efficient production deployments while strictly managing hardware storage limitations:
*   **Containerization:** Use **Docker**.
*   **Optimization:** Implement multi-stage Docker builds. The final production image must use a minimal base (e.g., `oven/bun:alpine` or distroless) to keep the container size under 100MB, preventing unnecessary disk bloat.
*   **Caching:** Leverage Bun's install cache efficiently during the Docker build process, ensuring intermediate layers are cleared to maintain optimal disk space.

## 8. Development Phases (Vibe Coding Flow)
1.  **Phase 1: Foundation (Day 1)**
    *   Init Bun workspace.
    *   Scaffold Elysia backend and Svelte frontend.
    *   Set up Tailwind CSS and design tokens.
2.  **Phase 2: The Core Loop (Day 2)**
    *   Implement OpenRouter API call in Elysia.
    *   Build `ChatInput` and `ChatWindow` in Svelte.
    *   Connect Frontend to Backend (basic fetch).
3.  **Phase 3: Polish & Render (Day 3)**
    *   Add Markdown rendering to `MessageBubble`.
    *   Refine the minimalist UI (spacing, typography, loading states).
4.  **Phase 4: Ship (Day 4)**
    *   Write Dockerfile.
    *   Test container build locally.
    *   Deploy.
