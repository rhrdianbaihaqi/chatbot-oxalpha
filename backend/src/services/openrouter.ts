import fs from 'fs';
import path from 'path';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequestPayload {
  model: string;
  messages: ChatMessage[];
}

export interface ChatResponsePayload {
  success: boolean;
  message?: {
    role: 'assistant';
    content: string;
  };
  error?: string;
}

function getApiKey(): string {
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim()) {
    return process.env.OPENROUTER_API_KEY.trim();
  }

  // Attempt to load directly from .env files if not populated in process.env
  const pathsToCheck = [
    path.resolve(process.cwd(), 'backend/.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../.env'),
  ];

  for (const envPath of pathsToCheck) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/^OPENROUTER_API_KEY=(.+)$/m);
        if (match && match[1]?.trim()) {
          const key = match[1].trim().replace(/^["']|["']$/g, '');
          if (key) return key;
        }
      } catch {
        // ignore
      }
    }
  }

  return '';
}

export async function sendChatMessage(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
  const apiKey = getApiKey();

  if (!apiKey) {
    // If no API key provided, provide a clear instructional response so the app can still be tested
    return {
      success: true,
      message: {
        role: 'assistant',
        content: `**[OpenRouter Configuration Notice]**\n\nNo \`OPENROUTER_API_KEY\` was detected in \`backend/.env\`.\n\nTo enable live AI responses with model \`${payload.model}\`:\n1. Copy \`backend/.env.example\` to \`backend/.env\`\n2. Add your OpenRouter API Key:\n\`\`\`bash\nOPENROUTER_API_KEY=sk-or-v1-...\n\`\`\`\n3. Restart the backend server.\n\n*Echo of your message:*\n> ${payload.messages[payload.messages.length - 1]?.content || ''}`
      }
    };
  }

  try {
    const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
    const siteName = process.env.SITE_NAME || 'AI Chatbot MVP';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': siteUrl,
        'X-Title': siteName,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: payload.model || 'z-ai/glm-5.2:free',
        messages: payload.messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        parsedError = errorJson.error?.message || errorJson.message || errorText;
      } catch {
        // use raw text
      }
      return {
        success: false,
        error: `OpenRouter API error (${response.status}): ${parsedError}`
      };
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message;

    if (!assistantMessage || !assistantMessage.content) {
      return {
        success: false,
        error: 'No content returned from OpenRouter API'
      };
    }

    return {
      success: true,
      message: {
        role: 'assistant',
        content: assistantMessage.content
      }
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to connect to OpenRouter: ${err?.message || String(err)}`
    };
  }
}
