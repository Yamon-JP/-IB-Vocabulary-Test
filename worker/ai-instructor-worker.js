const DEFAULT_ORIGIN = 'https://yamon-jp.github.io';
const DEFAULT_MODEL = '@cf/google/gemma-4-26b-a4b-it';
const RUBRIC_VERSION = 'engb-paper1-v1';

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || DEFAULT_ORIGIN)
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

function corsHeaders(origin, env) {
  const allowed = allowedOrigins(env);
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || DEFAULT_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Cache-Control': 'no-store'
  };
}

function jsonResponse(body, status, origin, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin, env)
    }
  });
}

function cleanString(value, max = 4000) {
  return String(value ?? '').trim().slice(0, max);
}

function cleanStringArray(value, maxItems = 12, maxLength = 800) {
  return Array.isArray(value)
    ? value.slice(0, maxItems).map(item => cleanString(item, maxLength)).filter(Boolean)
    : [];
}

function normalizeInput(body) {
  const task = body?.task || {};
  const answer = cleanString(body?.answer, 14000);
  const selectedTextType = cleanString(body?.selectedTextType, 160);
  if (!answer || !selectedTextType) return null;

  return {
    task: {
      id: cleanString(task.id, 160),
      chapter: cleanString(task.chapter, 200),
      theme: cleanString(task.theme, 200),
      prompt: cleanString(task.prompt, 5000),
      requirements: cleanStringArray(task.requirements, 12, 1000),
      audience: cleanString(task.audience, 1000),
      purpose: cleanString(task.purpose, 1000),
      register: cleanString(task.register, 1000),
      bestTextType: cleanString(task.bestTextType, 160),
      textTypeRationale: cleanString(task.textTypeRationale, 2000)
    },
    selectedTextType,
    answer,
    wordCount: Math.max(0, Math.min(Number(body?.wordCount) || 0, 5000))
  };
}

const englishText = description => ({
  type: 'string',
  description: `${description} Write this field in English only; do not use Japanese.`
});

const japaneseText = description => ({
  type: 'string',
  description: `${description} Write this field in natural Japanese only.`
});

const englishArray = description => ({
  type: 'array',
  description: `${description} Every item must be written in English only; do not use Japanese.`,
  items: {
    type: 'string',
    description: 'English only. Do not use Japanese.'
  },
  minItems: 1,
  maxItems: 3
});

const japaneseArray = description => ({
  type: 'array',
  description: `${description} Every item must be a natural Japanese translation of the English item at the same index.`,
  items: {
    type: 'string',
    description: 'Natural Japanese only.'
  },
  minItems: 1,
  maxItems: 3
});

const criterionSchema = maxScore => ({
  type: 'object',
  additionalProperties: false,
  required: [
    'score',
    'rationale',
    'rationaleJa',
    'explanationJa',
    'strengths',
    'strengthsJa',
    'improvements',
    'improvementsJa'
  ],
  properties: {
    score: { type: 'integer', minimum: 0, maximum: maxScore },
    rationale: englishText('Criterion rationale.'),
    rationaleJa: japaneseText('Japanese translation of rationale.'),
    explanationJa: japaneseText('Short student-friendly explanation of why the score was awarded and what to focus on next.'),
    strengths: englishArray('Strengths in the learner response.'),
    strengthsJa: japaneseArray('Japanese translations of strengths.'),
    improvements: englishArray('Concrete improvements the learner should make.'),
    improvementsJa: japaneseArray('Japanese translations of improvements.')
  }
});

const gradingSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'language',
    'message',
    'conceptualUnderstanding',
    'topImprovements',
    'topImprovementsJa',
    'nextStep',
    'nextStepJa',
    'overallComment',
    'overallCommentJa'
  ],
  properties: {
    language: criterionSchema(12),
    message: criterionSchema(12),
    conceptualUnderstanding: criterionSchema(6),
    topImprovements: {
      type: 'array',
      description: 'Exactly three distinct priority improvements, written in English only. Do not use Japanese.',
      items: {
        type: 'string',
        description: 'Concrete actionable improvement in English only.'
      },
      minItems: 3,
      maxItems: 3
    },
    topImprovementsJa: {
      type: 'array',
      description: 'Natural Japanese translations of topImprovements in exactly the same order.',
      items: {
        type: 'string',
        description: 'Natural Japanese translation only.'
      },
      minItems: 3,
      maxItems: 3
    },
    nextStep: englishText('One practical next step for the learner.'),
    nextStepJa: japaneseText('Japanese translation of nextStep.'),
    overallComment: englishText('Concise overall instructor comment.'),
    overallCommentJa: japaneseText('Japanese translation of overallComment.')
  }
};

function parseMaybeJson(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
    if (!fenced) return null;
    try {
      return JSON.parse(fenced);
    } catch (_) {
      return null;
    }
  }
}

function extractStructuredResult(result) {
  const direct = parseMaybeJson(result?.response);
  if (direct) return direct;

  const choiceContent = result?.choices?.[0]?.message?.content;
  const fromChoice = parseMaybeJson(choiceContent);
  if (fromChoice) return fromChoice;

  const nested = parseMaybeJson(result?.result?.response);
  if (nested) return nested;

  return parseMaybeJson(result);
}

function validCriterion(value, max) {
  if (!value || typeof value !== 'object') return false;
  if (!Number.isInteger(value.score) || value.score < 0 || value.score > max) return false;
  if (!cleanString(value.rationale, 4000)) return false;
  if (!Array.isArray(value.strengths) || !Array.isArray(value.improvements)) return false;
  return true;
}

function invalidGradingReason(value) {
  if (!value || typeof value !== 'object') return 'response JSON could not be parsed';

  const criterionReason = (name, criterion, max) => {
    if (!criterion || typeof criterion !== 'object') return `${name} is missing or not an object`;
    if (!Number.isInteger(criterion.score) || criterion.score < 0 || criterion.score > max) {
      return `${name}.score must be an integer from 0 to ${max}`;
    }
    if (!cleanString(criterion.rationale, 4000)) return `${name}.rationale is missing`;
    if (!Array.isArray(criterion.strengths)) return `${name}.strengths must be an array`;
    if (!Array.isArray(criterion.improvements)) return `${name}.improvements must be an array`;
    return '';
  };

  return criterionReason('language', value.language, 12)
    || criterionReason('message', value.message, 12)
    || criterionReason('conceptualUnderstanding', value.conceptualUnderstanding, 6)
    || 'unknown grading structure';
}

const improvementMetadataPrefix = /^(?:total\s*score|totalscore|total|score|language|message|conceptual\s*understanding|conceptualunderstanding|rubric\s*version|rubricversion|provider|model)\s*[:=]/i;

function normalizeImprovementItem(value) {
  const item = cleanString(value, 1400);
  if (!item || improvementMetadataPrefix.test(item)) return '';
  return item;
}

function bilingualPairs(englishItems, japaneseItems, maxItems = 6, maxLength = 1400) {
  const en = cleanStringArray(englishItems, maxItems, maxLength);
  const ja = cleanStringArray(japaneseItems, maxItems, maxLength);
  return en.map((item, index) => ({ en: item, ja: ja[index] || '' }));
}

function buildTopImprovements(value, valueJa, criteria) {
  const fallbacks = [
    {
      en: 'Develop key ideas with specific explanation, evidence, or examples so the response fully addresses the task.',
      ja: '課題に十分に答えられるよう、重要な考えを具体的な説明・根拠・例で発展させましょう。'
    },
    {
      en: 'Use a wider range of precise vocabulary and varied sentence structures while maintaining accuracy and clarity.',
      ja: '正確さと分かりやすさを保ちながら、より幅広く適切な語彙と多様な文構造を使いましょう。'
    },
    {
      en: 'Strengthen audience awareness, purpose, register, and text-type conventions throughout the response.',
      ja: '読み手・目的・文体・テキストタイプの慣習を、文章全体でより明確に意識しましょう。'
    }
  ];

  const candidates = [
    ...bilingualPairs(value, valueJa),
    ...bilingualPairs(criteria.message.improvements, criteria.message.improvementsJa),
    ...bilingualPairs(criteria.language.improvements, criteria.language.improvementsJa),
    ...bilingualPairs(criteria.conceptualUnderstanding.improvements, criteria.conceptualUnderstanding.improvementsJa),
    ...fallbacks
  ];

  const result = [];
  const seen = new Set();

  for (const candidate of candidates) {
    const en = normalizeImprovementItem(candidate.en);
    if (!en) continue;
    const key = en.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      en,
      ja: cleanString(candidate.ja, 1400)
        || 'この改善点を意識して、次の答案で具体的に修正してみましょう。'
    });
    if (result.length === 3) break;
  }

  return {
    en: result.map(item => item.en),
    ja: result.map(item => item.ja)
  };
}

function normalizeGrading(value) {
  if (!value || typeof value !== 'object') return null;
  if (!validCriterion(value.language, 12)) return null;
  if (!validCriterion(value.message, 12)) return null;
  if (!validCriterion(value.conceptualUnderstanding, 6)) return null;

  const normalizeCriterion = (criterion, max) => ({
    score: Math.max(0, Math.min(max, Number(criterion.score))),
    rationale: cleanString(criterion.rationale, 4000),
    rationaleJa: cleanString(criterion.rationaleJa, 4000),
    explanationJa: cleanString(criterion.explanationJa, 2400),
    strengths: cleanStringArray(criterion.strengths, 3, 1200),
    strengthsJa: cleanStringArray(criterion.strengthsJa, 3, 1200),
    improvements: cleanStringArray(criterion.improvements, 3, 1200),
    improvementsJa: cleanStringArray(criterion.improvementsJa, 3, 1200)
  });

  const language = normalizeCriterion(value.language, 12);
  const message = normalizeCriterion(value.message, 12);
  const conceptualUnderstanding = normalizeCriterion(value.conceptualUnderstanding, 6);
  const topImprovements = buildTopImprovements(value.topImprovements, value.topImprovementsJa, {
    language,
    message,
    conceptualUnderstanding
  });

  return {
    language,
    message,
    conceptualUnderstanding,
    total: language.score + message.score + conceptualUnderstanding.score,
    topImprovements: topImprovements.en,
    topImprovementsJa: topImprovements.ja,
    nextStep: cleanString(value.nextStep, 2400),
    nextStepJa: cleanString(value.nextStepJa, 2400),
    overallComment: cleanString(value.overallComment, 2400),
    overallCommentJa: cleanString(value.overallCommentJa, 2400)
  };
}

function systemPrompt() {
  return [
    'You are an IB English B HL Paper 1 training assessor inside a study app.',
    'Grade only the learner response supplied by the application. Do not rewrite the whole answer.',
    'Use the three Paper 1 training criteria: Language /12, Message /12, Conceptual Understanding /6.',
    'Language: assess range, accuracy, clarity, organization at sentence level, and whether errors obstruct communication.',
    'Message: assess relevance, development, organization, task fulfilment, and coverage of required aspects.',
    'Conceptual Understanding: assess audience, purpose, register, tone, and conventions/suitability of the chosen text type.',
    'Be evidence-based and reasonably conservative. Do not award credit for content that is absent or merely implied.',
    'There is no automatic mark penalty solely for being outside 450–600 words, but significant underdevelopment or excessive irrelevance may affect the relevant criterion.',
    'Use the provided task metadata as context. The listed best text type is guidance, not an automatic rule that other text types must fail.',
    'Give concise, actionable feedback for a student preparing for the final exam.',
    'STRICT LANGUAGE RULE: every field without a Ja suffix must be written in English only. Never write Japanese in rationale, strengths, improvements, topImprovements, nextStep, or overallComment.',
    'STRICT LANGUAGE RULE: every field with a Ja suffix must be written in natural Japanese only and must translate the matching English field.',
    'Example: improvements = ["Use more precise transition phrases."] and improvementsJa = ["より正確なつなぎ表現を使いましょう。"]. Never put Japanese text in improvements.',
    'For every rationale, strength, improvement, Top 3 Improvement, next step, and overall comment, also provide a natural Japanese translation in the corresponding Ja field or array.',
    'For each criterion, explanationJa must be a short, student-friendly Japanese explanation of why the score was awarded and what to focus on next. It should explain the assessment, not merely repeat the translation.',
    'Japanese translations must preserve the meaning of the English feedback and must not change the score or add unsupported praise or criticism.',
    'Japanese array items must correspond to the English array items in the same order.',
    'For topImprovements, return exactly three distinct, concrete actions the student should take to improve the response.',
    'Never put scores, totals, criterion labels, JSON keys, provider/model names, rubric metadata, or other structural information inside topImprovements or topImprovementsJa.',
    'Before returning, verify that every non-Ja text field is English and every Ja field is Japanese.',
    'Return only the requested structured output.'
  ].join('\n');
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = allowedOrigins(env);

    if (request.method === 'OPTIONS') {
      if (origin && !allowed.includes(origin)) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    if (origin && !allowed.includes(origin)) {
      return jsonResponse({ ok: false, error: 'Origin not allowed.' }, 403, origin, env);
    }

    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/grade/english-b-paper1') {
      return jsonResponse({ ok: false, error: 'Not found.' }, 404, origin, env);
    }

    if (!env.AI || typeof env.AI.run !== 'function') {
      return jsonResponse({ ok: false, error: 'Workers AI binding is not configured.' }, 503, origin, env);
    }

    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > 30000) {
      return jsonResponse({ ok: false, error: 'Request is too large.' }, 413, origin, env);
    }

    let body;
    try {
      body = await request.json();
    } catch (_) {
      return jsonResponse({ ok: false, error: 'Invalid JSON request.' }, 400, origin, env);
    }

    const input = normalizeInput(body);
    if (!input) {
      return jsonResponse({ ok: false, error: 'A response and text type are required.' }, 400, origin, env);
    }

    const model = cleanString(env.WORKERS_AI_MODEL || DEFAULT_MODEL, 160) || DEFAULT_MODEL;
    let result;
    try {
      result = await env.AI.run(model, {
        messages: [
          { role: 'system', content: systemPrompt() },
          {
            role: 'user',
            content: JSON.stringify({
              task: input.task,
              selectedTextType: input.selectedTextType,
              wordCount: input.wordCount,
              studentResponse: input.answer
            })
          }
        ],
        chat_template_kwargs: {
          enable_thinking: false
        },
        response_format: {
          type: 'json_schema',
          json_schema: gradingSchema
        },
        temperature: 0.2,
        max_completion_tokens: 3600
      });
    } catch (error) {
      console.error('Workers AI grading request failed.', error);
      return jsonResponse({ ok: false, error: 'AI grading service returned an error.' }, 502, origin, env);
    }

    const parsed = extractStructuredResult(result);
    const grading = normalizeGrading(parsed);
    if (!grading) {
      const reason = invalidGradingReason(parsed);
      console.error('Workers AI grading result was invalid.', { reason, result });
      return jsonResponse({ ok: false, error: 'AI grading result was invalid.' }, 502, origin, env);
    }

    return jsonResponse({
      ok: true,
      grading,
      meta: {
        provider: 'cloudflare-workers-ai',
        model,
        rubricVersion: RUBRIC_VERSION
      }
    }, 200, origin, env);
  }
};
