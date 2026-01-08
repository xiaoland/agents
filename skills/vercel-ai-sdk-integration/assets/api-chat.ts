/**
 * Nuxt API Route: Chat Endpoint
 * server/api/chat.ts
 *
 * Handles streaming chat with AI SDK v6
 */
import {
  streamText,
  convertToModelMessages,
  tool,
  type UIMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

// Define tools (optional)
const calculatorTool = tool({
  description: "Perform mathematical calculations",
  inputSchema: z.object({
    expression: z.string().describe("Mathematical expression to evaluate"),
  }),
  execute: async ({ expression }) => {
    try {
      // Use a safe math parser in production (e.g., mathjs)
      const result = Function(`"use strict"; return (${expression})`)();
      return { expression, result };
    } catch {
      return { expression, error: "Invalid expression" };
    }
  },
});

const currentTimeTool = tool({
  description: "Get the current date and time",
  inputSchema: z.object({
    timezone: z.string().optional().describe("Timezone (e.g., 'America/New_York')"),
  }),
  execute: async ({ timezone }) => {
    const now = new Date();
    const formatted = timezone
      ? now.toLocaleString("en-US", { timeZone: timezone })
      : now.toISOString();
    return { datetime: formatted, timezone: timezone || "UTC" };
  },
});

// Request body type
interface ChatRequestBody {
  messages: UIMessage[];
  system?: string;
}

export default defineLazyEventHandler(async () => {
  // Initialize provider with runtime config
  const openai = createOpenAI({
    apiKey: useRuntimeConfig().openaiApiKey,
  });

  return defineEventHandler(async (event) => {
    try {
      const body: ChatRequestBody = await readBody(event);
      const { messages, system } = body;

      // Validate messages
      if (!messages || !Array.isArray(messages)) {
        throw createError({
          statusCode: 400,
          message: "Messages array is required",
        });
      }

      // Convert UI messages to model format (async in v6)
      const modelMessages = await convertToModelMessages(messages);

      // Generate streaming response
      const result = streamText({
        model: openai("gpt-4o"),
        system: system || "You are a helpful assistant.",
        messages: modelMessages,
        tools: {
          calculator: calculatorTool,
          currentTime: currentTimeTool,
        },
        maxTokens: 2048,
        temperature: 0.7,
        onError: (error) => {
          console.error("[Chat API] Stream error:", error);
        },
      });

      // Return streaming response for UI consumption
      return result.toUIMessageStreamResponse();
    } catch (error) {
      console.error("[Chat API] Error:", error);

      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }

      throw createError({
        statusCode: 500,
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });
});
