export type GeminiModel =
  | 'gemini-3-flash-preview'
  | 'gemini-3.1-pro-preview'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
export const MAX_INPUT = 200_000

export function ensureSafeInput(text: string, label = 'Input') {
  if (!text?.trim()) throw new Error(`${label} is empty. Please provide some text.`)
  if (text.length > MAX_INPUT)
    throw new Error(`${label} is too long (${text.length.toLocaleString()} chars). Max: ${MAX_INPUT.toLocaleString()}.`)
}

async function call<T>(
  model: GeminiModel,
  apiKey: string,
  prompt: string,
  schema: object,
): Promise<T> {
  const res = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as any)?.error?.message || `API error ${res.status}`
    if (res.status === 429) throw new Error('Rate limited. Wait a moment and try again.')
    if (res.status === 400 || res.status === 403)
      throw new Error('Invalid API key. Please check your settings.')
    throw new Error(msg)
  }

  const data = await res.json()
  const text = (data as any).candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from API.')
  return JSON.parse(text) as T
}

// ── Grammar ─────────────────────────────────────────────────────────────────

export interface GrammarResult {
  correctedText: string
  explanations: Array<{ original: string; correction: string; explanation: string }>
}

export async function checkGrammar(
  text: string,
  model: GeminiModel,
  apiKey: string,
  preserveInformality = false,
): Promise<GrammarResult> {
  ensureSafeInput(text, 'Text to check')

  const mode = preserveInformality
    ? `INFORMALITY PRESERVATION MODE:
- Preserve the author's natural voice, slang, colloquialisms, and casual expressions exactly as written.
- Only correct objective errors: misspellings, broken syntax, missing words, or grammar mistakes that genuinely impair comprehension.
- Do NOT "upgrade" casual phrasing (e.g., "gonna" → "going to" is NOT a correction).`
    : `STANDARD MODE:
- Correct all grammar, spelling, punctuation, and syntax errors.
- Improve sentence structure for clarity and readability where needed.
- Ensure subject-verb agreement, proper tense consistency, and correct pronoun usage.`

  return call<GrammarResult>(
    model,
    apiKey,
    `You are an expert copy editor and proofreader with deep expertise in English grammar, syntax, and style conventions.

YOUR TASK: Analyze the provided text and produce a corrected version with a detailed changelog of every fix.

${mode}

RULES:
- Preserve the original meaning, intent, and information exactly. Never add, remove, or fabricate content.
- Preserve proper nouns, technical terms, code snippets, and URLs exactly as written.
- If the text contains no errors, return it unchanged and provide an empty explanations array.
- Each explanation must cite the exact original phrase and its replacement.

TEXT TO ANALYZE:
"""
${text}
"""`,
    {
      type: 'object',
      properties: {
        correctedText: { type: 'string' },
        explanations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              original: { type: 'string' },
              correction: { type: 'string' },
              explanation: { type: 'string' },
            },
            required: ['original', 'correction', 'explanation'],
          },
        },
      },
      required: ['correctedText', 'explanations'],
    },
  )
}

// ── Paraphrase ───────────────────────────────────────────────────────────────

export interface ParaphraseResult {
  paraphrasedText: string
  explanation: string
}

export async function paraphraseText(
  text: string,
  style: string,
  model: GeminiModel,
  apiKey: string,
): Promise<ParaphraseResult> {
  ensureSafeInput(text, 'Text to paraphrase')

  return call<ParaphraseResult>(
    model,
    apiKey,
    `You are a master linguist and professional rewriter with expertise in adapting text across various registers and styles.

YOUR TASK: Rewrite the provided text in a "${style}" style.

REQUIREMENTS:
- The paraphrased text must convey the exact same meaning, facts, and intent as the original.
- Adapt vocabulary, sentence structure, rhythm, and rhetorical devices to authentically match the "${style}" register.
- Maintain the original paragraph structure and logical flow.

STYLE GUIDELINES for "${style}":
- "Formal" → Professional diction, complete sentences, impersonal tone, no contractions.
- "Fluent" → Natural, clear, effortless reading with smooth transitions.
- "Academic" → Scholarly vocabulary, precise hedging language.
- "Playful" → Light-hearted, witty, conversational with creative word choices.
- "Slang" → Casual, trendy, uses contemporary colloquialisms and internet-speak.
- "Shorten" → Condense to the essential meaning, removing all filler.
- "Expand" → Elaborate with supporting details, ~2-3x the original length.

TEXT TO PARAPHRASE:
"""
${text}
"""`,
    {
      type: 'object',
      properties: {
        paraphrasedText: { type: 'string' },
        explanation: { type: 'string' },
      },
      required: ['paraphrasedText', 'explanation'],
    },
  )
}

// ── Summarize ────────────────────────────────────────────────────────────────

export interface SummaryResult {
  summary: string
  keyPoints: string[]
}

export async function summarizeText(
  text: string,
  length: string,
  model: GeminiModel,
  apiKey: string,
): Promise<SummaryResult> {
  ensureSafeInput(text, 'Text to summarize')

  return call<SummaryResult>(
    model,
    apiKey,
    `You are an expert analyst specializing in distilling complex information into clear, faithful summaries.

YOUR TASK: Produce a ${length} summary of the provided text, plus 3-5 key takeaway bullet points.

LENGTH INTERPRETATION:
- "short" → 1-2 concise sentences capturing the core thesis only.
- "medium" → A single focused paragraph (3-5 sentences).
- "long" → 2-3 paragraphs providing a thorough overview.

REQUIREMENTS:
- Preserve the original meaning and factual accuracy. Never speculate or add information.
- Key points must be substantive and non-redundant.
- Do not begin the summary with "This text discusses...". Summarize directly.

TEXT TO SUMMARIZE:
"""
${text}
"""`,
    {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        keyPoints: { type: 'array', items: { type: 'string' } },
      },
      required: ['summary', 'keyPoints'],
    },
  )
}

// ── Tone ─────────────────────────────────────────────────────────────────────

export interface ToneResult {
  primaryTone: string
  secondaryTones: string[]
  analysis: string
  formalityScore: number
}

export async function analyzeTone(
  text: string,
  model: GeminiModel,
  apiKey: string,
): Promise<ToneResult> {
  ensureSafeInput(text, 'Text to analyze')

  return call<ToneResult>(
    model,
    apiKey,
    `You are a computational linguist and sentiment analysis expert specializing in tone, register, and emotional resonance.

YOUR TASK: Perform a multi-dimensional tone analysis of the provided text.

Use precise tone labels (e.g., "Sardonic", "Earnest", "Authoritative") rather than vague ones (e.g., "Positive", "Negative").
Formality score 1-10: 1-2 heavy slang, 3-4 casual, 5-6 neutral professional, 7-8 formal, 9-10 academic/legal.

TEXT TO ANALYZE:
"""
${text}
"""`,
    {
      type: 'object',
      properties: {
        primaryTone: { type: 'string' },
        secondaryTones: { type: 'array', items: { type: 'string' } },
        analysis: { type: 'string' },
        formalityScore: { type: 'number' },
      },
      required: ['primaryTone', 'secondaryTones', 'analysis', 'formalityScore'],
    },
  )
}

export interface ShiftToneResult {
  shiftedText: string
  explanation: string
}

export async function shiftTone(
  text: string,
  targetTone: string,
  model: GeminiModel,
  apiKey: string,
): Promise<ShiftToneResult> {
  ensureSafeInput(text, 'Text to transform')

  return call<ShiftToneResult>(
    model,
    apiKey,
    `You are an expert writing coach and rhetorical stylist specializing in tonal adaptation.

YOUR TASK: Rewrite the provided text so its tone shifts to "${targetTone}" while preserving the original meaning exactly.

Adjust vocabulary, sentence length, rhetorical devices, and punctuation to embody "${targetTone}".
Maintain factual accuracy — every claim, name, number, and detail must remain intact.

TEXT TO TRANSFORM:
"""
${text}
"""`,
    {
      type: 'object',
      properties: {
        shiftedText: { type: 'string' },
        explanation: { type: 'string' },
      },
      required: ['shiftedText', 'explanation'],
    },
  )
}

// ── Humanizer ────────────────────────────────────────────────────────────────

export interface HumanizeResult {
  humanizedText: string
  aiScore: number
  detectionAnalysis: string
  improvements: string[]
}

export async function humanizeAndDetect(
  text: string,
  model: GeminiModel,
  apiKey: string,
): Promise<HumanizeResult> {
  ensureSafeInput(text, 'Text to humanize')

  return call<HumanizeResult>(
    model,
    apiKey,
    `You are a dual-role expert: forensic linguist and master creative editor.

PHASE 1 — DETECTION: Analyze for AI markers (perplexity, burstiness, hedging overuse, structural repetition, vocabulary band).
Score 0-100: 0-20 human, 21-40 likely human, 41-60 uncertain, 61-80 likely AI, 81-100 AI.

PHASE 2 — HUMANIZATION: Rewrite to sound authentically human.
- Vary sentence lengths dramatically. Mix 5-word punches with 30-word flowing sentences.
- Use unexpected word choices where natural.
- Add subtle personality: mild opinion, dash of humor, or conversational aside.
- Start a sentence with "And" or "But" occasionally.
- Preserve exact meaning, facts, and intent — do not add new claims.

TEXT:
"""
${text}
"""`,
    {
      type: 'object',
      properties: {
        humanizedText: { type: 'string' },
        aiScore: { type: 'number' },
        detectionAnalysis: { type: 'string' },
        improvements: { type: 'array', items: { type: 'string' } },
      },
      required: ['humanizedText', 'aiScore', 'detectionAnalysis', 'improvements'],
    },
  )
}

// ── Translate ────────────────────────────────────────────────────────────────

export interface TranslateResult {
  translatedText: string
  detectedSourceLang: string
  confidence: number
  notes: string
}

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
  model: GeminiModel,
  apiKey: string,
): Promise<TranslateResult> {
  ensureSafeInput(text, 'Text to translate')

  return call<TranslateResult>(
    model,
    apiKey,
    `You are a world-class professional translator with native-level fluency in over 100 languages.

YOUR TASK: Translate from ${sourceLang === 'auto' ? 'the auto-detected source language' : `"${sourceLang}"`} into "${targetLang}".

- Translate the intended meaning, not word-for-word. Adapt idioms into natural equivalents.
- Match the formality level, tone, and style of the original.
- The translation must read as if originally written in ${targetLang} by a native speaker.
${sourceLang === 'auto' ? '- Detect the source language and state it in detectedSourceLang.' : ''}

TEXT TO TRANSLATE:
"""
${text}
"""`,
    {
      type: 'object',
      properties: {
        translatedText: { type: 'string' },
        detectedSourceLang: { type: 'string' },
        confidence: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['translatedText', 'detectedSourceLang', 'confidence', 'notes'],
    },
  )
}

// ── Dictionary ───────────────────────────────────────────────────────────────

export interface DictionaryResult {
  entry: string
  pronunciation: string
  partOfSpeech: string[]
  definitions: Array<{ meaning: string; examples: string[]; register: string }>
  etymology: string
  synonyms: Array<{ word: string; nuance: string }>
  antonyms: string[]
  memoryTip: string
  frequencyLevel: string
}

export async function lookupWord(
  query: string,
  model: GeminiModel,
  apiKey: string,
): Promise<DictionaryResult> {
  ensureSafeInput(query, 'Dictionary query')

  return call<DictionaryResult>(
    model,
    apiKey,
    `You are an elite lexicographer, linguist, and language pedagogy expert.

YOUR TASK: Provide a comprehensive, learner-focused dictionary entry for the query.

- If single word: full lexical analysis across all senses and parts of speech.
- If phrase/idiom: treat as fixed unit, focus on idiomatic meaning, origin, and usage.
- Order definitions from most common to most specialized.
- Each definition must have 2-3 diverse example sentences.
- Etymology should trace roots and explain semantic shifts over time.

QUERY:
"""
${query}
"""`,
    {
      type: 'object',
      properties: {
        entry: { type: 'string' },
        pronunciation: { type: 'string' },
        partOfSpeech: { type: 'array', items: { type: 'string' } },
        definitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              meaning: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              register: { type: 'string' },
            },
            required: ['meaning', 'examples', 'register'],
          },
        },
        etymology: { type: 'string' },
        synonyms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              word: { type: 'string' },
              nuance: { type: 'string' },
            },
            required: ['word', 'nuance'],
          },
        },
        antonyms: { type: 'array', items: { type: 'string' } },
        memoryTip: { type: 'string' },
        frequencyLevel: { type: 'string' },
      },
      required: ['entry', 'pronunciation', 'partOfSpeech', 'definitions', 'etymology', 'synonyms', 'antonyms', 'memoryTip', 'frequencyLevel'],
    },
  )
}

// ── Prompt Suite ─────────────────────────────────────────────────────────────

export interface PromptMakeResult { resultPrompt: string; explanation: string }
export interface PromptOptimizeResult { resultPrompt: string; improvements: string[] }
export interface PromptRewriteResult { resultPrompt: string; explanation: string }

export async function processPrompt(
  action: 'make' | 'optimize' | 'rewrite',
  text: string,
  extra: string,
  model: GeminiModel,
  apiKey: string,
): Promise<PromptMakeResult | PromptOptimizeResult | PromptRewriteResult> {
  ensureSafeInput(text, action === 'make' ? 'Rough idea' : 'Original prompt')

  if (action === 'make') {
    return call<PromptMakeResult>(
      model,
      apiKey,
      `You are a senior prompt engineer with deep expertise in crafting high-performance prompts for LLMs.

Transform the following rough idea into a detailed, production-ready LLM prompt including:
1. Role/Persona — who the AI should act as.
2. Context — necessary background.
3. Task — exact objective in clear, unambiguous language.
4. Constraints — what to do, what NOT to do, edge cases.
5. Output Format — exact structure of expected response.

ROUGH IDEA:
"""
${text}
"""`,
      {
        type: 'object',
        properties: {
          resultPrompt: { type: 'string' },
          explanation: { type: 'string' },
        },
        required: ['resultPrompt', 'explanation'],
      },
    )
  }

  if (action === 'optimize') {
    return call<PromptOptimizeResult>(
      model,
      apiKey,
      `You are a senior prompt engineer specializing in systematic prompt optimization.

Audit and optimize this LLM prompt across: clarity, completeness, structure, specificity, robustness, efficiency.
Preserve the original intent exactly. Every change must have a clear rationale.

ORIGINAL PROMPT:
"""
${text}
"""`,
      {
        type: 'object',
        properties: {
          resultPrompt: { type: 'string' },
          improvements: { type: 'array', items: { type: 'string' } },
        },
        required: ['resultPrompt', 'improvements'],
      },
    )
  }

  return call<PromptRewriteResult>(
    model,
    apiKey,
    `You are a senior prompt engineer specializing in prompt adaptation.

Rewrite the following prompt to align with this goal: "${extra}"

Preserve the core intent while adapting vocabulary, tone, structure, and constraints to match the new goal.

ORIGINAL PROMPT:
"""
${text}
"""`,
    {
      type: 'object',
      properties: {
        resultPrompt: { type: 'string' },
        explanation: { type: 'string' },
      },
      required: ['resultPrompt', 'explanation'],
    },
  )
}

// ── API Key Verification ──────────────────────────────────────────────────────

export async function verifyApiKey(key: string): Promise<{ valid: boolean; error?: string }> {
  const trimmed = key.trim()
  if (!trimmed) return { valid: false, error: 'Please enter an API key.' }

  try {
    const res = await fetch(
      `${API_BASE}/gemini-2.5-flash:generateContent?key=${trimmed}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Reply with the single word OK.' }] }],
        }),
      },
    )
    if (res.ok) return { valid: true }
    if (res.status === 400 || res.status === 403)
      return { valid: false, error: 'This API key is invalid.' }
    if (res.status === 429)
      return { valid: false, error: 'Rate limited — the key works but try again shortly.' }
    return { valid: false, error: `Verification failed (${res.status}).` }
  } catch {
    return { valid: false, error: 'Network error. Check your connection.' }
  }
}
