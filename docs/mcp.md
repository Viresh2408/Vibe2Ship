# MCP (Model Control Plane) — The Last-Minute Life Saver

## AI Model Control & Governance

This document details the Model Control Plane: how AI model calls are orchestrated, validated, governed, and monitored in production.

---

## Model Registry

| Model | Provider | Use Case | Latency Target |
|-------|----------|----------|----------------|
| `gemini-1.5-flash` | Google AI Studio | Task decomposition | < 5s |
| `gemini-1.5-flash` | Google AI Studio | Step execution streaming | < 3s first token |

Both use cases use the same model with different system prompts and generation configurations.

---

## Request Lifecycle

```
User Request → Input Validation → Safety Check → Rate Limit → Gemini API
                                                                    ↓
Response ← Client ← Schema Validation (Vertex AI) ← JSON Parsing ←
```

### Layer 1: Input Validation (`vertex.ts > checkInputSafety`)
- Minimum length: 10 characters
- Maximum length: 5,000 characters
- Prompt injection pattern detection (6 regex patterns)
- Returns: `{ safe: boolean, reason?: string }`

### Layer 2: Rate Limiting (`vertex.ts > checkRateLimit`)
- Per-user rate limit with sliding window
- `/api/panic`: 10 requests/minute
- `/api/execute`: 20 requests/minute
- In-memory map with TTL reset
- **Production upgrade**: Replace with Redis for distributed rate limiting

### Layer 3: Gemini API Call (`gemini.ts`)
- Model: `gemini-1.5-flash`
- Temperature: 0.4 (planning), 0.7 (execution)
- Safety filters: Harassment/Hate HIGH, Explicit MEDIUM, Dangerous HIGH
- JSON mode: `responseMimeType: 'application/json'` (planning only)

### Layer 4: Schema Validation (`vertex.ts > validateDecompositionSchema`)
- Validates all required fields
- Sanitizes and clamps numeric values
- Validates ISO timestamp format
- Validates enum values for `action_type`
- Returns: `{ valid, errors[], sanitized? }`

---

## Safety Guardrails

### Input-Side
| Check | Implementation | Response on Failure |
|-------|----------------|---------------------|
| Empty input | Length check | 400: "Input cannot be empty" |
| Too short | < 10 chars | 400: "Input too short" |
| Too long | > 5000 chars | 400: "Input too long" |
| Prompt injection | Regex patterns | 400: "Disallowed content" |

### Output-Side
| Check | Implementation | Response on Failure |
|-------|----------------|---------------------|
| JSON parse | try/catch | 502: "AI returned invalid JSON" |
| Required fields | Schema validation | 422: "Schema validation failed" |
| Urgency bounds | Math.max/min(1,10) | Auto-corrected |
| Deadline validity | Date parse | 422: "Invalid deadline timestamp" |
| Step count | Min 2, Max 15 | 422: "Schema validation failed" |

---

## Generation Configuration Governance

### Planning Mode (Decomposer Agent)
```typescript
{
  model: 'gemini-1.5-flash',
  temperature: 0.4,      // Conservative for reliability
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 4096, // Enough for 10 detailed steps
  responseMimeType: 'application/json'
}
```

### Execution Mode (Executor Agent)
```typescript
{
  model: 'gemini-1.5-flash',
  temperature: 0.7,      // More creative for content generation
  topP: 0.9,
  maxOutputTokens: 2048  // Step content is typically shorter
}
```

---

## Error Recovery Strategy

| Error | Recovery Action | User Impact |
|-------|-----------------|-------------|
| Gemini API timeout | Return 502 with retry prompt | User retries |
| JSON parse failure | Log error, return 502 | User retries |
| Schema validation fail | Return 422 with specific errors | User retries |
| Firestore write fail | Log warning, return task anyway | Transparent to user |
| Rate limit exceeded | Return 429 with reset time | User waits |
| Auth token invalid | Return 401, redirect to login | Re-auth required |

---

## Observability

### Logging Strategy
All model calls emit structured logs with:
```json
{
  "service": "gemini",
  "model": "gemini-1.5-flash",
  "mode": "planning|streaming",
  "userId": "uid_xxx",
  "responseTimeMs": 2847,
  "inputTokens": 245,
  "outputTokens": 1823,
  "urgencyScore": 9,
  "stepCount": 8,
  "success": true
}
```

### Key Metrics
- **Model latency**: P50, P95, P99 response times
- **Schema validation rate**: % of responses passing validation
- **Rate limit hit rate**: % of requests blocked
- **Safety block rate**: % of inputs blocked by safety filters

---

## Future MCP Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Model fallback | High | Fall back to Gemini Pro if Flash fails |
| Response caching | Medium | Cache similar panic inputs (semantic similarity) |
| A/B testing | Low | Test different temperature settings |
| Cost tracking | Medium | Per-user token usage tracking |
| Model versioning | Low | Pin to specific Gemini version for consistency |
