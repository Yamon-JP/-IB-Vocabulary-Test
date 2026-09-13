const DEFAULT_ORIGIN = 'https://yamon-jp.github.io';
const DEFAULT_MODEL = 'gpt-5.6-terra';
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

const gradingSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['language', 'message', 'conceptualUnderstanding', 'topImprovements', 'nextStep', 'overallComment'],
  properties: {
    language: {
      type: 'object',
      additionalProperties: false,
      required: ['score', 'rationale', 'strengths', 'improvements'],
      properties: {
        score: { type: 'integer', minimum: 0, maximum: 12 },
        rationale: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 },
        improvements: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 }
      }
    },
    message: {
      type: 'object',
      additionalProperties: false,
      required: ['score', 'rationale', 'strengths', 'improvements'],
      properties: {
        score: { type: 'integer', minimum: 0, maximum: 12 },
        rationale: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 },
        improvements: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 }
      }
    },
    conceptualUnderstanding: {
      type: 'object',
      additionalProperties: false,
      required: ['score', 'rationale', 'strengths', 'improvements'],
      properties: {
        score: { type: 'integer', minimum: 0, maximum: 6 },
        rationale: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 },
        improvements: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 }
      }
    },
    topImprovements: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 3
    },
    nextStep: { type: 'string' },
    overallComment: { type: 'string' }
  }
};

function extractOutputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const parts = [];
  for (const item of Array.isArray(data?.output) ? data.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (typeof content?.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('').trim();
}

function validCriterion(value, max) {
  if (!value || typeof value !== 'object') return false;
  if (!Number.isInteger(value.score) || value.score < 0 || value.score > max) return false;
  if (!cleanString(value.rationale, 4000)) return false;
  if (!Array.isArray(value.strengths) || !Array.isArray(value.improvements)) return false;
  return true;
}

function normalizeGrading(value) {
  if (!value || typeof value !== 'object') return null;
  if (!validCriterion(value.language, 12)) return null;
  if (!validCriterion(value.message, 12)) return null;
  if (!validCriterion(value.conceptualUnderstanding, 6)) return null;

  const normalizeCriterion = (criterion, max) => ({
    score: Math.max(0, Math.min(max, Number(criterion.score))),
    rationale: cleanString(criterion.rationale, 4000),
    strengths: cleanStringArray(criterion.strengths, 3, 1200),
    improvements: cleanStringArray(criterion.improvements, 3, 1200)
  });

  const language = normalizeCriterion(value.language, 12);
  const message = normalizeCriterion(value.message, 12);
  const conceptualUnderstanding = normalizeCriterion(value.conceptualUnderstanding, 6);
  return {
    language,
    message,
    conceptualUnderstanding,
    total: language.score + message.score + conceptualUnderstanding.score,
    topImprovements: cleanStringArray(value.topImprovements, 3, 1400),
    nextStep: cleanString(value.nextStep, 2400),
    overallComment: cleanString(value.overallComment, 2400)
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

    if (!env.OPENAI_API_KEY) {
      return jsonResponse({ ok: false, error: 'AI grading is not configured.' }, 503, origin, env);
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

    const model = cleanString(env.OPENAI_MODEL || DEFAULT_MODEL, 100) || DEFAULT_MODEL;
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        store: false,
        reasoning: { effort: 'medium' },
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: systemPrompt() }]
          },
          {
            role: 'user',
            content: [{
              type: 'input_text',
              text: JSON.stringify({
                task: input.task,
                selectedTextType: input.selectedTextType,
                wordCount: input.wordCount,
                studentResponse: input.answer
              })
            }]
          }
        ],
        text: {
          verbosity: 'medium',
          format: {
            type: 'json_schema',
            name: 'english_b_paper1_grading',
            description: 'Structured English B HL Paper 1 training assessment.',
            strict: true,
            schema: gradingSchema
          }
        }
      })
    });

    if (!response.ok) {
      console.error('OpenAI grading request failed.', response.status, await response.text());
      return jsonResponse({ ok: false, error: 'AI grading service returned an error.' }, 502, origin, env);
    }

    const data = await response.json();
    const outputText = extractOutputText(data);
    let parsed;
    try {
      parsed = JSON.parse(outputText);
    } catch (_) {
      return jsonResponse({ ok: false, error: 'AI grading result could not be parsed.' }, 502, origin, env);
    }

    const grading = normalizeGrading(parsed);
    if (!grading) {
      return jsonResponse({ ok: false, error: 'AI grading result was invalid.' }, 502, origin, env);
    }

    return jsonResponse({
      ok: true,
      grading,
      meta: {
        model: data?.model || model,
        rubricVersion: RUBRIC_VERSION
      }
    }, 200, origin, env);
  }
};
