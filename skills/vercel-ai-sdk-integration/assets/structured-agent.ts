/**
 * Structured Agent Example
 * Multi-step agent with tool calling and structured output
 *
 * Use case: Research agent that searches, analyzes, and produces structured reports
 */
import {
  generateText,
  streamText,
  Output,
  tool,
  stepCountIs,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

// Initialize provider
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ============================================
// Tool Definitions
// ============================================

const searchTool = tool({
  description: "Search the web for information on a topic",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
    limit: z.number().optional().describe("Maximum results to return"),
  }),
  execute: async ({ query, limit = 5 }) => {
    // Implement actual search API call
    // This is a mock implementation
    console.log(`[Search] Query: "${query}", Limit: ${limit}`);
    return {
      query,
      results: [
        { title: `Result 1 for ${query}`, snippet: "Mock search result..." },
        { title: `Result 2 for ${query}`, snippet: "Another mock result..." },
      ],
    };
  },
});

const analyzeTool = tool({
  description: "Analyze data and extract insights",
  inputSchema: z.object({
    data: z.string().describe("Data to analyze"),
    focus: z.string().optional().describe("Specific aspect to focus on"),
  }),
  execute: async ({ data, focus }) => {
    console.log(`[Analyze] Focus: ${focus || "general"}`);
    return {
      insights: [
        "Key finding 1 from analysis",
        "Key finding 2 from analysis",
      ],
      confidence: 0.85,
    };
  },
});

const calculateTool = tool({
  description: "Perform numerical calculations",
  inputSchema: z.object({
    expression: z.string().describe("Math expression to evaluate"),
  }),
  execute: async ({ expression }) => {
    try {
      // Use safe math parser in production
      const result = Function(`"use strict"; return (${expression})`)();
      return { expression, result };
    } catch {
      return { expression, error: "Invalid expression" };
    }
  },
});

// ============================================
// Output Schemas
// ============================================

const researchReportSchema = z.object({
  title: z.string().describe("Report title"),
  summary: z.string().describe("Executive summary (2-3 sentences)"),
  findings: z.array(z.object({
    topic: z.string(),
    insight: z.string(),
    confidence: z.number().min(0).max(1),
  })).describe("Key research findings"),
  recommendations: z.array(z.string()).describe("Action recommendations"),
  sources: z.array(z.string()).describe("Information sources used"),
});

type ResearchReport = z.infer<typeof researchReportSchema>;

// ============================================
// Agent Functions
// ============================================

/**
 * Research Agent - Synchronous
 * Completes all steps before returning
 */
export async function runResearchAgent(topic: string): Promise<{
  report: ResearchReport;
  steps: number;
  usage: { promptTokens: number; completionTokens: number };
}> {
  const { output, steps, usage } = await generateText({
    model: openai("gpt-4o"),
    instructions: `You are a research analyst. Your task is to:
1. Search for information on the given topic
2. Analyze the findings
3. Produce a structured report with recommendations

Be thorough but concise. Use tools to gather information before generating the report.`,
    tools: {
      search: searchTool,
      analyze: analyzeTool,
      calculate: calculateTool,
    },
    output: Output.object({
      name: "ResearchReport",
      description: "Comprehensive research report on the topic",
      schema: researchReportSchema,
    }),
    stopWhen: stepCountIs(8), // Max 8 steps (7 tool calls + 1 output)
    prompt: `Research and create a comprehensive report on: ${topic}`,
  });

  return {
    report: output!,
    steps: steps.length,
    usage: {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
    },
  };
}

/**
 * Research Agent - Streaming
 * Streams progress updates during execution
 */
export async function* streamResearchAgent(topic: string): AsyncGenerator<{
  type: "step" | "partial" | "complete";
  data: unknown;
}> {
  const result = streamText({
    model: openai("gpt-4o"),
    instructions: `You are a research analyst conducting thorough research.`,
    tools: {
      search: searchTool,
      analyze: analyzeTool,
    },
    output: Output.object({
      schema: researchReportSchema,
    }),
    stopWhen: stepCountIs(6),
    prompt: `Research: ${topic}`,
    onChunk: ({ chunk }) => {
      if (chunk.type === "tool-call") {
        console.log(`[Agent] Calling tool: ${chunk.toolName}`);
      }
    },
  });

  // Stream partial outputs
  for await (const partial of result.partialOutputStream) {
    yield { type: "partial", data: partial };
  }

  // Get final result
  const final = await result;
  yield {
    type: "complete",
    data: {
      report: final.output,
      usage: final.usage,
    },
  };
}

// ============================================
// Simple Agent Without Structured Output
// ============================================

/**
 * Simple Q&A Agent
 * Uses tools to answer questions, returns text
 */
export async function runQAAgent(question: string): Promise<string> {
  const { text, steps } = await generateText({
    model: openai("gpt-4o"),
    tools: {
      search: searchTool,
      calculate: calculateTool,
    },
    stopWhen: stepCountIs(5),
    prompt: question,
  });

  console.log(`[QA Agent] Completed in ${steps.length} steps`);
  return text;
}

// ============================================
// Usage Examples
// ============================================

async function main() {
  // Example 1: Synchronous research
  console.log("=== Research Agent ===");
  const { report, steps, usage } = await runResearchAgent(
    "Vue.js adoption trends in 2025"
  );
  console.log("Report:", JSON.stringify(report, null, 2));
  console.log(`Steps: ${steps}, Tokens: ${usage.promptTokens + usage.completionTokens}`);

  // Example 2: Streaming research
  console.log("\n=== Streaming Agent ===");
  for await (const update of streamResearchAgent("AI SDK best practices")) {
    if (update.type === "partial") {
      console.log("Partial:", update.data);
    } else {
      console.log("Complete:", update.data);
    }
  }

  // Example 3: Simple Q&A
  console.log("\n=== Q&A Agent ===");
  const answer = await runQAAgent("What is 15% of 2500?");
  console.log("Answer:", answer);
}

// Run if executed directly
main().catch(console.error);
