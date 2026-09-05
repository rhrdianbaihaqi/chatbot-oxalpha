import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import { sendChatMessage } from './services/openrouter';
import { isRateLimited } from './rateLimit';

const startTime = Date.now();
const port = Number(process.env.PORT) || 3001;

// /api/chat proxies to OpenRouter using this server's own API key, so an
// open CORS policy would let any site spend the operator's OpenRouter
// budget from a visitor's browser. Restrict to the configured frontend
// origin(s) instead of reflecting every origin.
const allowedOrigins = Array.from(
  new Set(
    [
      process.env.SITE_URL,
      'http://localhost:5173',
      ...(process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
    ].filter((origin): origin is string => Boolean(origin))
  )
);

const app = new Elysia()
  .use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )
  .use(
    staticPlugin({
      assets: '../frontend/dist',
      prefix: '/',
    })
  )
  // GET /api/health
  .get('/api/health', () => {
    const uptimeInSeconds = Math.floor((Date.now() - startTime) / 1000);
    return {
      status: 'ok',
      uptime: uptimeInSeconds,
    };
  })
  // POST /api/chat
  .post(
    '/api/chat',
    async ({ body, set, request, server }) => {
      const ip = server?.requestIP(request)?.address ?? 'unknown';
      if (isRateLimited(ip)) {
        set.status = 429;
        return {
          success: false,
          error: 'Too many requests. Please wait a moment before trying again.',
        };
      }

      const { model, messages } = body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        set.status = 400;
        return {
          success: false,
          error: 'Messages array is required and cannot be empty.',
        };
      }

      const result = await sendChatMessage({
        model: model || 'nvidia/nemotron-3.5-lightning:free',
        messages,
      });

      if (!result.success) {
        set.status = 400; // Use 400 instead of 502 so Vite proxy doesn't intercept it
        return result;
      }

      return result;
    },
    {
      body: t.Object({
        model: t.Optional(t.String({ maxLength: 200 })),
        messages: t.Array(
          t.Object({
            role: t.Union([
              t.Literal('user'),
              t.Literal('assistant'),
              t.Literal('system'),
            ]),
            content: t.String({ maxLength: 20_000 }),
          }),
          { maxItems: 100 }
        ),
      }),
    }
  )
  .listen(port);

console.log(
  `Elysia server is running at http://${app.server?.hostname}:${app.server?.port}`
);
