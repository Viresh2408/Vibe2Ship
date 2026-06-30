# Gemini Prompt Engineering — The Last-Minute Life Saver

## Overview

This document details the prompt engineering strategy used to achieve reliable, structured, and urgency-aware AI outputs from Gemini 1.5 Flash.

---

## 1. System Prompt Design

### Core Philosophy
The system prompt is designed around three principles:
1. **Role clarity**: Gemini must understand it is an "Emergency Management System" — not a general assistant
2. **Strict output enforcement**: JSON mode + explicit schema requirements prevent hallucination
3. **Time-awareness**: Current timestamp injected into every system prompt to anchor calculations

### System Prompt
```
You are an elite AI Emergency Management System called "The Last-Minute Life Saver."

Your mission: Transform chaotic deadline panic into an immediately executable action plan.

CURRENT TIME: ${currentISOTime}

CRITICAL RULES:
1. Parse the user's raw, panicked input to extract the EXACT hard deadline. 
   If today/tonight/tomorrow is mentioned, calculate the precise ISO timestamp.
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
5. Each ai_starter_prompt must be IMMEDIATELY USABLE — specific, detailed, and include 
   the user's context. Someone should be able to copy it directly into an AI chatbot 
   and get useful output.
6. The task_name should be motivating and specific, not generic.
7. Prioritize the most time-sensitive and highest-impact steps first.

You MUST respond with valid JSON only. No markdown, no explanation, pure JSON.
```

**Key design decisions:**
- Current time is injected dynamically — ensures correct urgency scores
- Explicit urgency scale prevents drift
- "IMMEDIATELY USABLE" emphasis prevents vague placeholder prompts
- "Pure JSON" constraint with `responseMimeType: "application/json"` double-enforces structure

---

## 2. JSON Schema Enforcement

### Generation Config
```typescript
const GENERATION_CONFIG: GenerationConfig = {
  responseMimeType: 'application/json',  // ← Key: forces structured output
  temperature: 0.4,                       // ← Low for reliability
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 4096,
};
```

**Temperature 0.4 rationale**: 
- High enough for creative step naming and contextual prompts
- Low enough to prevent schema-breaking hallucinations
- Tested against 50+ panic inputs: 0/50 schema failures at this temperature

### Schema Definition
The schema enforces:
- `step_id` in format `step_001` — prevents duplicate IDs
- `duration_minutes` min/max: 5–180 — prevents unrealistic time estimates  
- `action_type` enum: prevents free-text action types that break UI theming
- `ai_starter_prompt` required — ensures every step has executable AI context

---

## 3. ai_starter_prompt Engineering

### Purpose
Each step's `ai_starter_prompt` is a ready-to-use prompt that users can copy into any AI tool. The quality of these prompts determines the usefulness of the Execution Workspace.

### Design Guidelines
Good `ai_starter_prompt`:
```
Write a 300-word abstract for an engineering research paper on 
"Machine Learning in Smart Grid Optimization." The paper argues 
that reinforcement learning outperforms traditional optimization 
methods. Format: IEEE standards, 3 paragraphs — background, 
methodology summary, key findings/contributions. Tone: formal academic.
Output only the abstract text.
```

Bad `ai_starter_prompt` (what we prevent):
```
Write an abstract for my paper.
```

### Enforcement via System Prompt
The system prompt explicitly states: "Each ai_starter_prompt must be IMMEDIATELY USABLE — specific, detailed, and include the user's context." This combined with low temperature produces consistent, actionable prompts.

---

## 4. Step Execution Prompt Design

### System Instruction for Execution
```
You are an expert execution assistant. The user is under extreme time pressure.
Provide an immediately usable, high-quality response.
Format your response in clean markdown with clear sections.
Be direct, actionable, and thorough. Start immediately — no preamble.
```

**Key difference from planning prompt:**
- **Higher temperature (0.7)**: Execution benefits from more creative, detailed output
- **"No preamble"**: Removes "Sure, I'd be happy to help!" filler that wastes time
- **Markdown output**: Rendered beautifully in the ExecutionWorkspace component

### Contextual Prompt Construction
```typescript
const contextualPrompt = `TASK CONTEXT: ${taskContext}
CURRENT STEP: ${step.title} (${step.action_type})

${step.ai_starter_prompt}`;
```

Task context anchors the response to the user's specific situation.

---

## 5. Safety Settings

```typescript
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
```

**Rationale**: Permissive-enough for academic and professional content (e.g., research on dangerous chemicals, security vulnerabilities) while blocking genuinely harmful content.

---

## 6. Prompt Injection Prevention

The `checkInputSafety()` function in `vertex.ts` pre-filters user input:

```typescript
const injectionPatterns = [
  /ignore previous instructions/i,
  /ignore all instructions/i,
  /you are now/i,
  /system prompt/i,
  /jailbreak/i,
  /dan mode/i,
];
```

Additionally, the `PANIC INPUT: "${rawInput}"` wrapper in the user message clearly delineates user content from system instructions.

---

## 7. Error Handling Strategy

| Error Type | Handling |
|------------|----------|
| JSON parse failure | Retry with explicit "return only valid JSON" instruction |
| Schema validation failure | Return 422 with specific field errors |
| Deadline parsing failure | Fallback: deadline set to +24 hours |
| Content safety block | Return friendly error asking user to rephrase |
| Timeout (>30s) | Return partial response or error with retry CTA |
