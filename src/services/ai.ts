import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';

import { getSettings } from './settings';

const APP_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const PROMO_CODE = 'ADMINTEST';

export async function verifyApiKey(
  rawKey: string,
): Promise<{ valid: boolean; error?: string }> {
  const key = rawKey.trim();
  if (!key) return { valid: false, error: 'Please enter an API key.' };

  const actualKey = key === PROMO_CODE ? APP_API_KEY : key;
  if (!actualKey)
    return {
      valid: false,
      error: 'Promo key is not configured on this instance.',
    };

  try {
    const google = createGoogleGenerativeAI({ apiKey: actualKey });
    await generateText({
      model: google('gemini-2.5-flash'),
      prompt: 'Reply with the single word OK.',
    });
    return { valid: true };
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('API key not valid') || err?.status === 400)
      return { valid: false, error: 'This API key is invalid.' };
    if (err?.status === 403)
      return {
        valid: false,
        error: 'This API key does not have access to Gemini.',
      };
    if (err?.status === 429)
      return {
        valid: false,
        error: 'Rate limited — the key works but try again shortly.',
      };
    return {
      valid: false,
      error: msg || 'Verification failed. Please try again.',
    };
  }
}

function resolveApiKey(): string {
  const settings = getSettings();
  const userKey = settings.apiKey.trim();

  if (userKey === PROMO_CODE) {
    return APP_API_KEY;
  }

  return userKey;
}

function getGoogleClient() {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error(
      'No API key configured. Please add your Gemini API key in Settings.',
    );
  }
  return createGoogleGenerativeAI({ apiKey });
}

export const MAX_INPUT_CHARACTERS = 200000;

function ensureSafeInput(text: string, label: string = 'Input') {
  if (!text || text.trim().length === 0) {
    throw new Error(`${label} is empty. Please provide some text.`);
  }
  if (text.length > MAX_INPUT_CHARACTERS) {
    throw new Error(
      `${label} is too long (${text.length.toLocaleString()} characters). Please limit your input to ${MAX_INPUT_CHARACTERS.toLocaleString()} characters to ensure reliability.`,
    );
  }
}

async function callAI(params: any, type: 'default' | 'pro' = 'default') {
  const settings = getSettings();
  const modelId = type === 'pro' ? settings.proModel : settings.model;
  const google = getGoogleClient();

  try {
    const result = await generateText({
      ...params,
      model: google(modelId),
    });
    return result as any;
  } catch (error: any) {
    if (
      error?.status === 429 ||
      error?.statusCode === 429 ||
      error?.message?.includes('429')
    ) {
      throw new Error(
        'Lumina is currently receiving too many requests. Please wait a few seconds and try again (Rate Limit).',
      );
    }
    if (
      error?.status === 400 ||
      error?.message?.includes('API key not valid')
    ) {
      throw new Error(
        'Your API key appears to be invalid. Please check it in Settings.',
      );
    }
    throw error;
  }
}

export interface GrammarOptions {
  preserveInformality: boolean;
  skipCapitalization: boolean;
  skipPunctuation: boolean;
  skipSpelling: boolean;
  skipStyle: boolean;
  skipSentenceStructure: boolean;
}

export const DEFAULT_GRAMMAR_OPTIONS: GrammarOptions = {
  preserveInformality: false,
  skipCapitalization: false,
  skipPunctuation: false,
  skipSpelling: false,
  skipStyle: false,
  skipSentenceStructure: false,
};

export async function checkGrammar(
  text: string,
  options: GrammarOptions = DEFAULT_GRAMMAR_OPTIONS,
) {
  ensureSafeInput(text, 'Text to check');

  const modeInstruction = options.preserveInformality
    ? `INFORMALITY PRESERVATION MODE:
- Preserve the author's natural voice, slang, colloquialisms, and casual expressions exactly as written.
- Only correct objective errors: misspellings, broken syntax, missing words, or grammar mistakes that genuinely impair comprehension.
- Do NOT "upgrade" casual phrasing (e.g., "gonna" → "going to" is NOT a correction).
- Sentence fragments used for stylistic effect should be left intact.`
    : `STANDARD MODE:
- Correct all grammar, spelling, punctuation, and syntax errors.
- Improve sentence structure for clarity and readability where needed.
- Ensure subject-verb agreement, proper tense consistency, and correct pronoun usage.
- Fix run-on sentences and comma splices.`;

  // Build exclusion rules based on toggled-off categories
  const exclusions: string[] = [];
  if (options.skipCapitalization)
    exclusions.push(
      '- Do NOT correct capitalization. Leave uppercase/lowercase exactly as the author wrote it.',
    );
  if (options.skipPunctuation)
    exclusions.push(
      '- Do NOT correct punctuation (commas, periods, semicolons, apostrophes, quotation marks, etc.). Leave all punctuation exactly as-is.',
    );
  if (options.skipSpelling)
    exclusions.push(
      '- Do NOT correct spelling errors. Leave all words spelled exactly as written.',
    );
  if (options.skipStyle)
    exclusions.push(
      '- Do NOT make style or clarity improvements. Only fix objective grammatical errors, not stylistic choices.',
    );
  if (options.skipSentenceStructure)
    exclusions.push(
      '- Do NOT fix sentence structure issues such as run-on sentences, comma splices, or sentence fragments. Leave sentence boundaries exactly as written.',
    );

  const exclusionBlock =
    exclusions.length > 0
      ? `\nEXCLUSIONS — the following categories must NOT be corrected:\n${exclusions.join('\n')}\n`
      : '';

  const { output } = await callAI({
    output: Output.object({
      schema: z.object({
        correctedText: z
          .string()
          .describe('The grammatically corrected version of the text.'),
        explanations: z
          .array(
            z.object({
              original: z
                .string()
                .describe('The original incorrect phrase or sentence.'),
              correction: z
                .string()
                .describe('The corrected phrase or sentence.'),
              explanation: z
                .string()
                .describe(
                  'Why it was incorrect and why the new version is better.',
                ),
            }),
          )
          .describe('List of specific corrections made.'),
      }),
    }),
    prompt: `You are an expert copy editor and proofreader with deep expertise in English grammar, syntax, and style conventions.

YOUR TASK: Analyze the provided text and produce a corrected version with a detailed changelog of every fix.

${modeInstruction}
${exclusionBlock}
RULES:
- Preserve the original meaning, intent, and information exactly. Never add, remove, or fabricate content.
- Preserve proper nouns, technical terms, code snippets, and URLs exactly as written.
- If the text contains no errors (or all errors fall under excluded categories), return it unchanged and provide an empty explanations array.
- Each explanation must cite the exact original phrase and its replacement — be precise, not vague.
- Categorize fixes by type in your explanations (spelling, grammar, punctuation, syntax, clarity).
- STRICTLY respect the exclusions above. If a category is excluded, do not touch it even if it is incorrect.

TEXT TO ANALYZE:
"""
${text}
"""`,
  });

  return output;
}

export async function paraphraseText(text: string, style: string) {
  ensureSafeInput(text, 'Text to paraphrase');
  const { output } = await callAI({
    output: Output.object({
      schema: z.object({
        paraphrasedText: z
          .string()
          .describe('The paraphrased version of the text.'),
        explanation: z
          .string()
          .describe(
            'Explanation of how the text was adapted to fit the requested style.',
          ),
      }),
    }),
    prompt: `You are a master linguist and professional rewriter with expertise in adapting text across various registers and styles.

YOUR TASK: Rewrite the provided text in a "${style}" style.

REQUIREMENTS:
- The paraphrased text must convey the exact same meaning, facts, and intent as the original — no information added or lost.
- Adapt vocabulary, sentence structure, rhythm, and rhetorical devices to authentically match the "${style}" register.
- Maintain the original paragraph structure and logical flow unless the style inherently demands restructuring.
- If the text contains proper nouns, technical terms, or data, preserve them exactly.

STYLE GUIDELINES for "${style}":
- "Formal" → Professional diction, complete sentences, impersonal tone, no contractions.
- "Fluent" → Natural, clear, effortless reading with smooth transitions.
- "Academic" → Scholarly vocabulary, citations-ready tone, precise hedging language (e.g., "suggests," "indicates").
- "Playful" → Light-hearted, witty, conversational with creative word choices.
- "Slang" → Casual, trendy, uses contemporary colloquialisms and internet-speak.
- For any other style, infer the appropriate register and apply it consistently.

In your explanation, describe the specific linguistic choices you made (e.g., vocabulary shifts, structural changes, rhetorical adjustments).

TEXT TO PARAPHRASE:
"""
${text}
"""`,
  });

  return output;
}

export async function summarizeText(text: string, length: string) {
  ensureSafeInput(text, 'Text to summarize');
  const { output } = await callAI({
    output: Output.object({
      schema: z.object({
        summary: z.string().describe('The summarized text.'),
        keyPoints: z
          .array(z.string())
          .describe('3-5 key bullet points from the text.'),
      }),
    }),
    prompt: `You are an expert analyst specializing in distilling complex information into clear, faithful summaries.

YOUR TASK: Produce a ${length} summary of the provided text, plus 3-5 key takeaway bullet points.

LENGTH INTERPRETATION:
- "short" → 1-2 concise sentences capturing the core thesis only.
- "medium" → A single focused paragraph (3-5 sentences) covering the main argument and key supporting points.
- "long" → 2-3 paragraphs providing a thorough overview including nuances, context, and supporting details.

REQUIREMENTS:
- Preserve the original meaning and factual accuracy — never infer, speculate, or add information not present in the source.
- Prioritize information by importance: lead with the most critical point, then supporting details.
- Key points must be substantive and non-redundant — each bullet should convey a distinct, meaningful insight.
- Use clear, neutral language unless the original text has a strong authorial voice that should be reflected.
- Do not begin the summary with "This text discusses..." or similar meta-phrasing. Summarize the content directly.

TEXT TO SUMMARIZE:
"""
${text}
"""`,
  });

  return output;
}

export async function analyzeTone(text: string) {
  ensureSafeInput(text, 'Text to analyze');
  const { output } = await callAI({
    output: Output.object({
      schema: z.object({
        primaryTone: z
          .string()
          .describe(
            'The single most dominant tone (e.g., Assertive, Joyful, Melancholic, Professional).',
          ),
        secondaryTones: z
          .array(z.string())
          .describe('2-3 secondary tones present in the text.'),
        analysis: z
          .string()
          .describe(
            'A brief explanation of why these tones were identified based on word choice and sentence structure.',
          ),
        formalityScore: z
          .number()
          .describe(
            'A score from 1 to 10 where 1 is extremely casual/slang and 10 is highly formal/academic.',
          ),
      }),
    }),
    prompt: `You are a computational linguist and sentiment analysis expert specializing in tone, register, and emotional resonance in written text.

YOUR TASK: Perform a multi-dimensional tone analysis of the provided text.

ANALYSIS FRAMEWORK:
1. **Primary Tone** — Identify the single most dominant emotional/rhetorical tone. Use precise labels (e.g., "Sardonic," "Earnest," "Authoritative,") rather than vague ones (e.g., "Positive," "Negative").
2. **Secondary Tones** — Identify 2-3 undertones or secondary registers. These should be meaningfully distinct from the primary tone.
3. **Evidence-Based Analysis** — Ground your analysis in specific textual evidence:
   - Quote or reference specific word choices, phrases, or rhetorical devices that signal each tone.
   - Note sentence structure patterns (short/punchy = urgency; long/flowing = reflective; questions = uncertainty or engagement).
   - Identify discourse markers, hedging language, intensifiers, or emotional vocabulary.
4. **Formality Score** (1-10):
   - 1-2: Heavy slang, emoji-like language, incomplete sentences, internet-speak.
   - 3-4: Casual conversation, contractions, informal vocabulary.
   - 5-6: Standard professional writing, neutral register.
   - 7-8: Formal business/journalistic prose, no contractions, structured arguments.
   - 9-10: Academic, legal, or ceremonial language with specialized vocabulary.

RULES:
- If the text is too short (under 10 words) for meaningful analysis, note this limitation in your analysis.
- If the tone is ambiguous or mixed, say so explicitly rather than forcing a single label.

TEXT TO ANALYZE:
"""
${text}
"""`,
  });

  return output;
}

export async function processPrompt(
  action: 'make' | 'optimize' | 'rewrite',
  text: string,
  extra?: string,
) {
  ensureSafeInput(text, action === 'make' ? 'Rough idea' : 'Original prompt');
  if (extra) ensureSafeInput(extra, 'Style/Goal description');
  let promptContent = '';
  let schema: any;

  if (action === 'make') {
    promptContent = `You are a senior prompt engineer with deep expertise in crafting high-performance prompts for Large Language Models.

YOUR TASK: Transform the following rough idea into a detailed, production-ready LLM prompt.

PROMPT ENGINEERING FRAMEWORK — include each element:
1. **Role/Persona** — Define who the AI should act as (e.g., "You are a senior data analyst...").
2. **Context** — Provide necessary background information the model needs.
3. **Task** — State the exact objective in clear, unambiguous language.
4. **Constraints** — Define boundaries: what to do, what NOT to do, edge cases, formatting rules.
5. **Output Format** — Specify the exact structure of the expected response (e.g., JSON, bullet points, markdown, prose).
6. **Examples** (if applicable) — Include 1-2 input/output examples for clarity.

QUALITY CRITERIA:
- The prompt must be self-contained — an LLM reading it should need zero additional context.
- Eliminate ambiguity: replace vague instructions ("make it good") with measurable criteria ("use active voice, limit to 200 words").
- Include negative constraints where relevant ("Do NOT include...", "Avoid...").
- Optimize for first-pass accuracy — the user should not need to re-prompt.

In your explanation, describe why each structural choice improves the prompt's effectiveness.

ROUGH IDEA:
"""
${text}
"""`;
    schema = z.object({
      resultPrompt: z
        .string()
        .describe('The detailed, ready-to-use LLM prompt.'),
      explanation: z.string().describe('Why this prompt is effective.'),
    });
  } else if (action === 'optimize') {
    promptContent = `You are a senior prompt engineer specializing in systematic prompt optimization and failure analysis.

YOUR TASK: Audit and optimize the following LLM prompt for maximum effectiveness.

OPTIMIZATION CHECKLIST — evaluate and improve each dimension:
1. **Clarity** — Are instructions unambiguous? Replace vague language with precise directives.
2. **Completeness** — Are there missing constraints, edge cases, or formatting specifications?
3. **Structure** — Is the prompt logically organized? Apply clear section headers if needed.
4. **Specificity** — Replace generic instructions with concrete, measurable criteria.
5. **Robustness** — Add guardrails against common failure modes (hallucination, verbosity, off-topic drift).
6. **Efficiency** — Remove redundant or filler language that wastes tokens without adding value.

RULES:
- Preserve the original intent and goal of the prompt exactly.
- Every change must have a clear rationale — no arbitrary rewording.
- If the prompt is already high-quality, state so and suggest only marginal refinements.

List each improvement as a specific, actionable change (not vague advice like "made it clearer").

ORIGINAL PROMPT:
"""
${text}
"""`;
    schema = z.object({
      resultPrompt: z.string().describe('The optimized LLM prompt.'),
      improvements: z.array(z.string()).describe('List of improvements made.'),
    });
  } else if (action === 'rewrite') {
    promptContent = `You are a senior prompt engineer specializing in prompt adaptation and style transfer.

YOUR TASK: Rewrite the following LLM prompt to align with this specific goal or style:
"${extra}"

REWRITE PRINCIPLES:
- The rewritten prompt must achieve the stated goal/style while preserving the core intent of the original.
- Adapt vocabulary, tone, structure, and constraints to match the target goal/style.
- If the goal requires a different output format, adjust the format specification accordingly.
- Ensure the rewritten prompt is self-contained and production-ready.
- Do not lose any critical constraints or guardrails from the original unless they conflict with the new goal.

In your explanation, describe the specific structural and linguistic changes you made and why each serves the new goal.

ORIGINAL PROMPT:
"""
${text}
"""`;
    schema = z.object({
      resultPrompt: z.string().describe('The rewritten LLM prompt.'),
      explanation: z.string().describe('Explanation of the changes.'),
    });
  }

  const { output } = await callAI(
    {
      output: Output.object({ schema }),
      prompt: promptContent,
    },
    'default',
  );

  return output;
}

export async function shiftTone(text: string, targetTone: string) {
  ensureSafeInput(text, 'Text to transform');
  const { output } = await callAI({
    output: Output.object({
      schema: z.object({
        shiftedText: z
          .string()
          .describe('The text rewritten in the target tone.'),
        explanation: z
          .string()
          .describe(
            'Explanation of the changes made to achieve the target tone.',
          ),
      }),
    }),
    prompt: `You are an expert writing coach and rhetorical stylist specializing in tonal adaptation across registers.

YOUR TASK: Rewrite the provided text so its tone shifts to "${targetTone}" while preserving the original meaning exactly.

TRANSFORMATION GUIDELINES:
- Adjust vocabulary, sentence length, rhetorical devices, and punctuation to embody the "${targetTone}" register.
- Maintain factual accuracy — every claim, name, number, and detail from the original must remain intact.
- Preserve the original paragraph structure and logical flow.
- The result should read as if it were originally written in the target tone — not as a mechanical find-and-replace.

TONAL LEVERS TO ADJUST:
- **Vocabulary**: Swap words for tone-appropriate synonyms (e.g., "assist" → "help" for casual, "elucidate" → "explain" for accessible).
- **Sentence structure**: Short, punchy sentences for urgency/directness; longer, flowing sentences for reflective/academic tones.
- **Rhetorical stance**: Adjust hedging ("perhaps," "it seems") vs. assertion ("clearly," "undeniably") to match the tone.
- **Emotional resonance**: Amplify or dampen emotional language as the target tone demands.

In your explanation, cite 2-3 specific examples of changes you made and why they serve the target tone.

TEXT TO TRANSFORM:
"""
${text}
"""`,
  });

  return output;
}

export async function detectAI(text: string) {
  ensureSafeInput(text, 'Text to analyze');
  const { output } = await callAI({
    output: Output.object({
      schema: z.object({
        aiScore: z
          .number()
          .describe(
            'Estimated probability (0-100) that the text was AI-generated.',
          ),
        detectionAnalysis: z
          .string()
          .describe('Analysis of why the text was flagged as AI or human.'),
        markers: z
          .array(z.string())
          .describe(
            'Specific markers found (e.g., "Uniform sentence length", "High predictability").',
          ),
      }),
    }),
    prompt: `You are a forensic linguist specializing in AI-generated text detection, trained on the distinguishing characteristics of LLM-produced content vs. authentic human writing.

YOUR TASK: Analyze the provided text and estimate the probability that it was generated by an AI model.

DETECTION HEURISTICS — evaluate each systematically:

1. **Perplexity & Predictability**: AI text tends toward high-probability, "expected" word sequences. Look for suspiciously smooth, never-surprising prose.
2. **Burstiness**: Human writing naturally varies sentence length (short punchy sentences mixed with long complex ones). AI text often has uniform sentence lengths.
3. **Vocabulary Diversity**: AI tends to favor a "safe" vocabulary band — common words, few rare or highly specific terms. Check the lexical richness.
4. **Hedging & Qualifiers**: Overuse of phrases like "It's important to note," "Additionally," "Furthermore," and "In conclusion" signals AI generation.
5. **Discourse Markers**: AI overuses transitional phrases and "signpost" language. Human text flows more organically.
6. **Repetitive Structure**: AI often uses parallel sentence structures and list-like phrasing even in prose contexts.
7. **Personal Voice & Idiosyncrasy**: Human writing contains imperfections, personality quirks, humor, cultural references, or unconventional phrasing. AI text is "correct" but personality-less.
8. **Factual Specificity**: Look for vague generalities vs. specific, verifiable claims.

SCORING CALIBRATION:
- 0-20: Almost certainly human (strong personal voice, idiosyncratic style, natural imperfections).
- 21-40: Likely human (some smooth passages but overall natural feel).
- 41-60: Uncertain / ambiguous (mixed signals — could be AI-assisted or a skilled formal writer).
- 61-80: Likely AI (multiple AI markers present, limited personal voice).
- 81-100: Almost certainly AI (uniform style, heavy hedging, predictable structure, no personality).

RULES:
- Be calibrated and honest. Formal human writing can look AI-like and casual AI can look human.
- Ground every claim in specific textual evidence — don't make vague assertions.
- List each detected marker as a concise, specific observation.

TEXT TO ANALYZE:
"""
${text}
"""`,
  });

  return output;
}

export async function humanizeAndDetect(text: string) {
  ensureSafeInput(text, 'Text to humanize');
  const { output } = await callAI(
    {
      output: Output.object({
        schema: z.object({
          humanizedText: z
            .string()
            .describe('The text rewritten to sound naturally human.'),
          aiScore: z
            .number()
            .describe(
              'Estimated probability (0-100) that the original text was AI-generated.',
            ),
          detectionAnalysis: z
            .string()
            .describe(
              'Analysis of why the original text was flagged as AI or human.',
            ),
          improvements: z
            .array(z.string())
            .describe('List of specific creative/humanizing choices made.'),
        }),
      }),
      prompt: `You are a dual-role expert: (1) a forensic linguist specializing in AI-generated text detection, and (2) a master creative editor who transforms sterile prose into authentic human writing.

YOUR TASK (execute in order):

## PHASE 1 — DETECTION
Analyze the original text for AI-generated markers using these heuristics:
- **Perplexity**: Does the text read as suspiciously smooth and predictable?
- **Burstiness**: Is sentence length uniform (AI) or naturally varied (human)?
- **Hedging overuse**: Phrases like "It's important to note," "In today's world," "Additionally," "Furthermore."
- **Structural repetition**: Parallel constructions, list-like prose, identical paragraph templates.
- **Vocabulary band**: Safe, mid-frequency words with no rare, surprising, or idiosyncratic choices.
- **Personal voice**: Absence of humor, cultural references, strong opinions, or stylistic quirks.

Produce an AI detection score (0-100) using the same calibration:
- 0-20: Almost certainly human | 21-40: Likely human | 41-60: Uncertain | 61-80: Likely AI | 81-100: Almost certainly AI

## PHASE 2 — HUMANIZATION
Rewrite the text to sound authentically human while preserving the exact same meaning, facts, and intent.

HUMANIZATION TECHNIQUES:
1. **Inject burstiness** — Vary sentence lengths dramatically. Mix 5-word punches with 30-word flowing sentences.
2. **Break predictability** — Use unexpected word choices, metaphors, or turns of phrase where natural.
3. **Add voice** — Introduce subtle personality: a mild opinion, a dash of humor, or a conversational aside where it fits the context.
4. **Disrupt structure** — Avoid cookie-cutter paragraph templates. Let some paragraphs be one sentence. Start a sentence with "And" or "But."
5. **Use concrete specifics** — Replace vague generalities with vivid, specific language where the meaning allows it.
6. **Natural imperfections** — Occasionally use contractions, dashes, parenthetical asides, or rhetorical questions.

RULES:
- The humanized text must convey the exact same information and factual content as the original.
- Do not add new claims, opinions, or information not present in the original.
- The result should pass AI detection tools as human-written while remaining professional and clear.
- List each humanizing improvement as a specific, actionable change you made.

TEXT TO ANALYZE AND HUMANIZE:
"""
${text}
"""`,
    },
    'default',
  );

  return output;
}

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
) {
  ensureSafeInput(text, 'Text to translate');
  const { output } = await callAI({
    output: Output.object({
      schema: z.object({
        translatedText: z
          .string()
          .describe('The translated text in the target language.'),
        detectedSourceLang: z
          .string()
          .describe(
            'The detected or confirmed source language (e.g., "English", "Spanish").',
          ),
        confidence: z
          .number()
          .describe('Confidence score (0-100) in the translation quality.'),
        notes: z
          .string()
          .describe(
            'Brief notes on translation choices — idioms adapted, cultural context shifts, or ambiguities resolved.',
          ),
      }),
    }),
    prompt: `You are a world-class professional translator with native-level fluency in over 100 languages and deep expertise in cross-cultural communication, linguistic nuance, and domain-specific terminology.

YOUR TASK: Translate the provided text from ${sourceLang === 'auto' ? 'the auto-detected source language' : `"${sourceLang}"`} into "${targetLang}".

TRANSLATION PRINCIPLES:
1. **Meaning over literalism** — Translate the intended meaning, not word-for-word. Adapt idioms, metaphors, and culturally-specific expressions into natural equivalents in the target language.
2. **Register preservation** — Match the formality level, tone, and style of the original. A casual message stays casual; a legal document stays precise.
3. **Cultural adaptation** — Adjust cultural references, units of measurement, date formats, and naming conventions where appropriate for the target audience.
4. **Technical accuracy** — Preserve domain-specific terminology (medical, legal, technical, academic) with their standard equivalents in the target language.
5. **Natural fluency** — The translation must read as if originally written in the target language by a native speaker. No translationese.

SPECIAL HANDLING:
- Proper nouns: Transliterate or keep as-is based on target language conventions.
- Code snippets, URLs, and technical identifiers: Preserve exactly as-is.
- Formatting: Maintain paragraph breaks, bullet points, and structural elements.
- Ambiguity: If the source text is ambiguous, choose the most likely interpretation and note the ambiguity.

CONFIDENCE SCORING:
- 90-100: High confidence — clear source text, well-supported language pair, unambiguous meaning.
- 70-89: Good confidence — minor ambiguities or less common language pair.
- 50-69: Moderate confidence — significant ambiguities, very informal/slang source, or rare dialect.
- Below 50: Low confidence — heavily context-dependent, incomplete source, or unsupported dialect.

${sourceLang === 'auto' ? 'First, detect the source language and state it in detectedSourceLang.' : ''}

TEXT TO TRANSLATE:
"""
${text}
"""`,
  });

  return output;
}

export async function expandText(text: string) {
  ensureSafeInput(text, 'Text to expand');
  const { output } = await callAI({
    output: Output.object({
      schema: z.object({
        expandedText: z
          .string()
          .describe('The expanded, more detailed version of the text.'),
        explanation: z
          .string()
          .describe(
            'Explanation of how the text was expanded — what details, examples, or elaborations were added.',
          ),
      }),
    }),
    prompt: `You are an expert writer and content developer specializing in elaboration, exposition, and rhetorical amplification.

YOUR TASK: Expand the provided text by adding depth, detail, context, and supporting information while preserving the original meaning, tone, and intent.

EXPANSION STRATEGY:
1. **Clarify and elaborate** — Unpack compressed or dense statements into fuller explanations. Break complex ideas into digestible sub-points.
2. **Add supporting details** — Include relevant examples, analogies, statistics, or illustrative scenarios that strengthen the original points.
3. **Develop context** — Provide background information, historical context, or framing that helps the reader understand the significance of the content.
4. **Strengthen transitions** — Add connective tissue between ideas so the expanded text flows naturally as a cohesive piece.
5. **Enrich vocabulary** — Use more precise and descriptive language where the original is terse, but avoid verbosity for its own sake.

RULES:
- The expanded text should be approximately 2-3x the length of the original.
- Preserve the original meaning, tone, and factual content exactly — do NOT change the author's position or introduce new claims.
- Preserve proper nouns, technical terms, and specific data exactly.
- Do not pad with filler phrases or generic statements. Every added sentence must contribute substantive value.
- Maintain the original paragraph structure as a skeleton — expand within and around it, not by replacing it.
- If the text is already detailed and well-developed, note this and expand only where genuinely beneficial.

In your explanation, describe the specific elaboration techniques used (e.g., "added example for concept X," "provided historical context for Y").

TEXT TO EXPAND:
"""
${text}
"""`,
  });

  return output;
}

export async function lookupWord(query: string) {
  ensureSafeInput(query, 'Dictionary query');
  const { output } = await callAI({
    output: Output.object({
      schema: z.object({
        entry: z
          .string()
          .describe(
            'The canonical form of the word, phrase, idiom, or expression being looked up.',
          ),
        pronunciation: z
          .string()
          .describe(
            'IPA pronunciation (e.g., /prəˌnʌnsiˈeɪʃən/). For phrases/idioms, provide the pronunciation of the key stressed words.',
          ),
        partOfSpeech: z
          .array(z.string())
          .describe(
            'All possible parts of speech (e.g., ["noun", "verb (transitive)", "adjective"]). For phrases, use labels like "idiom", "phrasal verb", "collocation", "proverb", etc.',
          ),
        definitions: z
          .array(
            z.object({
              meaning: z
                .string()
                .describe('Clear, precise definition of this sense.'),
              examples: z
                .array(z.string())
                .describe(
                  '2-3 natural, illustrative example sentences showing this meaning in context. Use diverse registers and scenarios.',
                ),
              register: z
                .string()
                .describe(
                  'Usage register: "formal", "informal", "neutral", "slang", "technical", "literary", "archaic", etc.',
                ),
            }),
          )
          .describe(
            'All major senses/definitions, ordered from most common to most specialized.',
          ),
        etymology: z
          .string()
          .describe(
            'Origin and history of the word/expression. Include the source language, original meaning, and how it evolved. For idioms, explain the origin story or cultural context.',
          ),
        collocations: z
          .array(
            z.object({
              pattern: z
                .string()
                .describe(
                  'The collocation pattern (e.g., "make a decision", "heavy rain", "deeply concerned").',
                ),
              example: z
                .string()
                .describe('A natural example sentence using this collocation.'),
            }),
          )
          .describe(
            'Common word partnerships and collocations — words that naturally go together with this entry.',
          ),
        synonyms: z
          .array(
            z.object({
              word: z.string().describe('The synonym or near-synonym.'),
              nuance: z
                .string()
                .describe(
                  'How this synonym differs in meaning, formality, or connotation from the looked-up word.',
                ),
            }),
          )
          .describe(
            'Synonyms with nuance explanations showing how each differs from the entry word.',
          ),
        antonyms: z
          .array(z.string())
          .describe('Direct antonyms or opposite expressions.'),
        relatedIdioms: z
          .array(
            z.object({
              idiom: z.string().describe('The idiom or fixed expression.'),
              meaning: z.string().describe('What the idiom means.'),
              example: z
                .string()
                .describe('An example sentence using this idiom naturally.'),
            }),
          )
          .describe(
            'Related idioms, fixed expressions, or proverbs that use or relate to this word/concept.',
          ),
        commonMistakes: z
          .array(
            z.object({
              mistake: z.string().describe('The common error learners make.'),
              correction: z
                .string()
                .describe('The correct usage with explanation.'),
            }),
          )
          .describe(
            'Common mistakes learners make with this word/expression — grammatical errors, false friends, confused pairs, etc.',
          ),
        memoryTip: z
          .string()
          .describe(
            'A memorable mnemonic, visual association, or learning tip to help remember this word/expression.',
          ),
        frequencyLevel: z
          .string()
          .describe(
            'How common this word is: "Essential (top 1000)", "Common (top 3000)", "Intermediate (top 5000)", "Advanced (top 10000)", "Specialized/Rare", or "Idiom/Expression".',
          ),
      }),
    }),
    prompt: `You are an elite lexicographer, linguist, and language pedagogy expert — a fusion of Oxford English Dictionary precision, Merriam-Webster accessibility, and a world-class ESL teacher's intuition for what learners actually need.

YOUR TASK: Provide a comprehensive, learner-focused dictionary entry for the query below. This is for an advanced English learner who wants to deeply understand and actively USE this word/expression/phrase.

INPUT HANDLING:
- If the input is a single word → provide full lexical analysis across all senses and parts of speech.
- If the input is a phrase, idiom, or expression → treat it as a fixed unit. Focus on its idiomatic meaning, origin, and usage.
- If the input is a collocation (e.g., "make a decision") → analyze the collocation pattern and why these words pair together.
- If the input is misspelled → correct it and proceed with the intended word.
- If the input is in a language other than English → provide the English translation/equivalent and analyze that.

DEFINITION QUALITY:
- Definitions must be precise but accessible — avoid circular definitions.
- Order senses from most frequent/common to most specialized/rare.
- Each definition MUST have 2-3 diverse example sentences that show the word in genuinely different contexts (professional, casual, literary, etc.).
- Clearly mark the register of each sense (formal, informal, slang, technical, etc.).

ETYMOLOGY:
- Trace the word back to its roots (Latin, Greek, Old English, French, etc.).
- Explain semantic shifts — how the meaning changed over time.
- For idioms, explain the historical or cultural origin story.

COLLOCATIONS:
- Provide the most natural, high-frequency collocations.
- These should be word combinations a native speaker would instinctively use.
- Focus on verb + noun, adjective + noun, adverb + adjective, and verb + preposition patterns.

SYNONYMS WITH NUANCE:
- Don't just list synonyms — explain the DIFFERENCE.
- Cover connotation (positive/negative), formality level, and semantic range.
- Help the learner choose the RIGHT synonym for each context.

COMMON MISTAKES:
- Focus on errors that intermediate-to-advanced learners actually make.
- Include confused word pairs (affect/effect, lay/lie), grammatical errors (uncountable usage), and false friends for common L1 backgrounds.

MEMORY TIP:
- Provide a genuinely clever mnemonic, visual image, etymology-based memory hook, or association technique.
- This should be memorable and practical, not generic.

QUERY:
"""
${query}
"""`,
  });

  return output;
}
