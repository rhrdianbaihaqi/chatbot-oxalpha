export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequestPayload {
  model: string;
  messages: ChatMessage[];
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** USD cost of this request, per OpenRouter's accounting. 0 for free-tier models. */
  cost: number;
}

export interface ChatResponsePayload {
  success: boolean;
  message?: {
    role: 'assistant';
    content: string;
  };
  usage?: ChatUsage;
  error?: string;
}

function getApiKey(): string {
  // Bun auto-loads .env files from the process's working directory, so
  // this is populated by the time the server starts — no need to hand-parse
  // .env files here too.
  return process.env.OPENROUTER_API_KEY?.trim() ?? '';
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
        model: payload.model || 'nvidia/nemotron-3.5-lightning:free',
        messages: payload.messages,
      }),
      signal: AbortSignal.timeout(45000),
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

    const data = (await response.json()) as any;
    const assistantMessage = data.choices?.[0]?.message;

    if (!assistantMessage || !assistantMessage.content) {
      return {
        success: false,
        error: 'No content returned from OpenRouter API'
      };
    }

    const rawUsage = data.usage;
    const usage: ChatUsage | undefined = rawUsage
      ? {
          promptTokens: rawUsage.prompt_tokens ?? 0,
          completionTokens: rawUsage.completion_tokens ?? 0,
          totalTokens: rawUsage.total_tokens ?? 0,
          cost: rawUsage.cost ?? 0,
        }
      : undefined;

    return {
      success: true,
      message: {
        role: 'assistant',
        content: assistantMessage.content
      },
      usage,
    };
  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.message?.includes('timeout')) {
      return {
        success: false,
        error: 'OpenRouter request timed out after 45 seconds. Please try again.'
      };
    }
    return {
      success: false,
      error: `Failed to connect to OpenRouter: ${err?.message || String(err)}`
    };
  }
}
