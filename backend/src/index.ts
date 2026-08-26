import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { sendChatMessage } from './services/openrouter';

const startTime = Date.now();
const port = Number(process.env.PORT) || 3001;

const app = new Elysia()
  .use(
    cors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
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
    async ({ body, set }) => {
      const { model, messages } = body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        set.status = 400;
        return {
          success: false,
          error: 'Messages array is required and cannot be empty.',
        };
      }

      const result = await sendChatMessage({
        model: model || 'z-ai/glm-5.2:free',
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
        model: t.String(),
        messages: t.Array(
          t.Object({
            role: t.Union([
              t.Literal('user'),
              t.Literal('assistant'),
              t.Literal('system'),
            ]),
            content: t.String(),
          })
        ),
      }),
    }
  )
  .listen(port);

console.log(
  `🚀 Elysia server is running at http://${app.server?.hostname}:${app.server?.port}`
);
