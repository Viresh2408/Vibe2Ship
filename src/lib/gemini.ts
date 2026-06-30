/**
 * Gemini AI Engine — The Last-Minute Life Saver
 *
 * Initializes Google Gemini 1.5 Flash with structured JSON output mode.
 * Enforces strict schema for task decomposition and urgency scoring.
 * All calls are server-side only (called from API routes).
 */

import {
  GoogleGenerativeAI,
  GenerativeModel,
  GenerationConfig,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import type { GeminiDecompositionResponse, ActionStep } from '@/types/task';

// ─── Singleton Client ────────────────────────────────────────────────────────

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY environment variable is not set. ' +
          'Get your API key from https://aistudio.google.com'
      );
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

// ─── JSON Schema Definition ──────────────────────────────────────────────────

/**
 * Vertex AI-compatible JSON schema for task decomposition.
 * Forces Gemini to return strictly validated structured output.
 */
const TASK_DECOMPOSITION_SCHEMA = {
  type: 'object',
  properties: {
    task_name: {
      type: 'string',
      description: 'A concise, actionable name for the overall task (max 60 chars)',
    },
    true_deadline: {
      type: 'string',
      description: 'ISO 8601 timestamp of the actual hard deadline',
    },
    urgency_score: {
      type: 'integer',
      minimum: 1,
      maximum: 10,
      description:
        'Urgency score from 1–10 based on time delta. 10 = under 2h, 9 = under 4h, 7-8 = under 8h, 5-6 = under 24h, 3-4 = under 3 days, 1-2 = over 3 days',
    },
    action_steps: {
      type: 'array',
      minItems: 3,
      maxItems: 12,
      items: {
        type: 'object',
        properties: {
          step_id: {
            type: 'string',
            description: 'Unique identifier, format: step_001, step_002, etc.',
          },
          title: {
            type: 'string',
            description: 'Clear, imperative action title (e.g., "Write introduction paragraph")',
          },
          duration_minutes: {
            type: 'integer',
            minimum: 5,
            maximum: 180,
            description: 'Estimated time to complete this step in minutes',
          },
          action_type: {
            type: 'string',
            enum: [
              'write',
              'research',
              'review',
              'code',
              'design',
              'communicate',
              'organize',
              'calculate',
              'present',
              'submit',
            ],
          },
          ai_starter_prompt: {
            type: 'string',
            description:
              'A highly specific, immediately actionable prompt that the user can copy into any AI assistant to start executing this exact step. Must include context, format requirements, and desired output.',
          },
        },
        required: ['step_id', 'title', 'duration_minutes', 'action_type', 'ai_starter_prompt'],
      },
    },
  },
  required: ['task_name', 'true_deadline', 'urgency_score', 'action_steps'],
};

// ─── System Prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(currentISOTime: string): string {
  return `You are an elite AI Emergency Management System called "The Last-Minute Life Saver." 

Your mission: Transform chaotic deadline panic into an immediately executable action plan.

CURRENT TIME: ${currentISOTime}

CRITICAL RULES:
1. Parse the user's raw, panicked input to extract the EXACT hard deadline. If today/tonight/tomorrow is mentioned, calculate the precise ISO timestamp.
2. Calculate the urgency_score based on time remaining from NOW to the deadline:
   - 10: Under 2 hours
   - 9: Under 4 hours  
   - 8: Under 6 hours
   - 7: Under 8 hours
   - 6: Under 12 hours
   - 5: Under 24 hours
   - 4: Under 48 hours
   - 3: Under 72 hours
   - 2: Under 1 week
   - 1: Over 1 week
3. Break the task into 4–10 concrete, sequential micro-steps that fill the available time.
4. Each step's duration_minutes must be realistic. Total should NOT exceed available time.
5. Each ai_starter_prompt must be IMMEDIATELY USABLE — specific, detailed, and include the user's context. Someone should be able to copy it directly into an AI chatbot and get useful output.
6. The task_name should be motivating and specific, not generic.
7. Prioritize the most time-sensitive and highest-impact steps first.

You MUST respond with valid JSON only. No markdown, no explanation, pure JSON matching the schema.`;
}

// ─── Generation Config ───────────────────────────────────────────────────────

const GENERATION_CONFIG: GenerationConfig = {
  responseMimeType: 'application/json',
  temperature: 0.4, // Low temperature for structured, reliable output
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 4096,
};

// Safety settings — permissive enough for academic/professional content
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

// ─── Core Decomposition Function ─────────────────────────────────────────────

/**
 * Decomposes a panicked deadline input into structured micro-action steps.
 * Returns a validated GeminiDecompositionResponse.
 */
export async function decomposeDeadline(
  rawInput: string
): Promise<GeminiDecompositionResponse> {
  const client = getGeminiClient();
  const currentTime = new Date().toISOString();

  const model: GenerativeModel = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    systemInstruction: buildSystemPrompt(currentTime),
    generationConfig: GENERATION_CONFIG,
    safetySettings: SAFETY_SETTINGS,
  });

  const prompt = `PANIC INPUT: "${rawInput}"

Analyze this deadline situation and return a complete structured action plan as JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;

    if (!response) {
      throw new Error('Gemini returned empty response');
    }

    const text = response.text();
    if (!text) {
      throw new Error('Gemini returned empty text');
    }

    // Parse and validate the JSON response
    const parsed = JSON.parse(text) as GeminiDecompositionResponse;

    // Basic validation
    if (!parsed.task_name || !parsed.true_deadline || !parsed.action_steps) {
      throw new Error('Gemini response missing required fields');
    }

    if (!Array.isArray(parsed.action_steps) || parsed.action_steps.length === 0) {
      throw new Error('Gemini returned no action steps');
    }

    // Ensure urgency score is within bounds
    parsed.urgency_score = Math.max(1, Math.min(10, Math.round(parsed.urgency_score)));

    // Validate deadline is a parseable date
    const deadlineDate = new Date(parsed.true_deadline);
    if (isNaN(deadlineDate.getTime())) {
      throw new Error(`Invalid deadline timestamp: ${parsed.true_deadline}`);
    }

    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Gemini returned invalid JSON. Please try again.');
    }
    throw error;
  }
}

// ─── Step Execution Function ─────────────────────────────────────────────────

/**
 * Executes a specific step's ai_starter_prompt and streams back AI-generated content.
 * Returns a ReadableStream for Server-Sent Events consumption.
 */
export async function executeStepStreaming(
  step: Pick<ActionStep, 'title' | 'ai_starter_prompt' | 'action_type'>,
  taskContext: string
): Promise<ReadableStream<Uint8Array>> {
  const client = getGeminiClient();

  const model: GenerativeModel = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    systemInstruction: `You are an expert execution assistant. The user is under extreme time pressure. 
Provide an immediately usable, high-quality response. 
Format your response in clean markdown with clear sections.
Be direct, actionable, and thorough. Start immediately — no preamble.`,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2048,
    },
    safetySettings: SAFETY_SETTINGS,
  });

  const contextualPrompt = `TASK CONTEXT: ${taskContext}
CURRENT STEP: ${step.title} (${step.action_type})

${step.ai_starter_prompt}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const result = await model.generateContentStream(contextualPrompt);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            const data = JSON.stringify({ type: 'text', content: text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        // Signal completion
        const done = JSON.stringify({ type: 'done', content: '' });
        controller.enqueue(encoder.encode(`data: ${done}\n\n`));
        controller.close();
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        const errData = JSON.stringify({ type: 'error', content: errMsg });
        controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
        controller.close();
      }
    },
  });

  return stream;
}

// ─── Urgency Recalculation ────────────────────────────────────────────────────

/**
 * Re-calculates urgency score based on current time vs deadline.
 * Use this to refresh scores without a full Gemini call.
 */
export function recalculateUrgencyScore(deadlineISO: string): number {
  const now = Date.now();
  const deadline = new Date(deadlineISO).getTime();
  const hoursRemaining = (deadline - now) / (1000 * 60 * 60);

  if (hoursRemaining <= 0) return 10;
  if (hoursRemaining <= 2) return 10;
  if (hoursRemaining <= 4) return 9;
  if (hoursRemaining <= 6) return 8;
  if (hoursRemaining <= 8) return 7;
  if (hoursRemaining <= 12) return 6;
  if (hoursRemaining <= 24) return 5;
  if (hoursRemaining <= 48) return 4;
  if (hoursRemaining <= 72) return 3;
  if (hoursRemaining <= 168) return 2;
  return 1;
}
