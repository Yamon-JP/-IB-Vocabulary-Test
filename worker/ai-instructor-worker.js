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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

function selfTestInput() {
  return {
    task: {
      id: 'SELF-TEST-001',
      chapter: 'Self-test',
      theme: 'Experiences',
      prompt: 'Write an email to your school principal suggesting ways to improve student wellbeing.',
      requirements: ['Explain one current problem', 'Suggest at least two improvements'],
      audience: 'School principal',
      purpose: 'Suggest improvements',
      register: 'Formal',
      bestTextType: 'Email',
      textTypeRationale: 'A formal email is appropriate for addressing the principal directly.'
    },
    selectedTextType: 'Email',
    wordCount: 82,
    answer: 'Dear Principal, I am writing to suggest some ways to improve student wellbeing at our school. Many students feel stressed because they have too much homework and not enough time to relax. I suggest creating a quiet relaxation room where students can take short breaks. In addition, the school could organize monthly wellbeing activities such as sports, art, or mindfulness sessions. These changes could help students feel healthier and more motivated. Thank you for considering my suggestions. Yours sincerely, Student'
  };
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
    const isHealth = request.method === 'GET' && url.pathname === '/health';
    const isSelfTest = request.method === 'GET' && url.pathname === '/self-test/english-b-paper1';
    const isGradeRequest = request.method === 'POST' && url.pathname === '/grade/english-b-paper1';

    if (isHealth) {
      return jsonResponse({
        ok: true,
        service: 'ib-master-trainer-ai-instructor',
        aiBinding: Boolean(env.AI && typeof env.AI.run === 'function'),
        model: cleanString(env.WORKERS_AI_MODEL || DEFAULT_MODEL, 160) || DEFAULT_MODEL
      }, 200, origin, env);
    }

    if (!isSelfTest && !isGradeRequest) {
      return jsonResponse({ ok: false, error: 'Not found.' }, 404, origin, env);
    }

    if (!env.AI || typeof env.AI.run !== 'function') {
      return jsonResponse({ ok: false, error: 'Workers AI binding is not configured.' }, 503, origin, env);
    }

    let input;
    if (isSelfTest) {
      input = selfTestInput();
    } else {
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

      input = normalizeInput(body);
      if (!input) {
        return jsonResponse({ ok: false, error: 'A response and text type are required.' }, 400, origin, env);
      }
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
        response_format: {
          type: 'json_schema',
          json_schema: gradingSchema
        },
        temperature: 0.2,
        max_completion_tokens: 2200
      });
    } catch (error) {
      console.error('Workers AI grading request failed.', error);
      return jsonResponse({ ok: false, error: 'AI grading service returned an error.' }, 502, origin, env);
    }

    const parsed = extractStructuredResult(result);
    const grading = normalizeGrading(parsed);
    if (!grading) {
      console.error('Workers AI grading result was invalid.', result);
      return jsonResponse({ ok: false, error: 'AI grading result was invalid.' }, 502, origin, env);
    }

    return jsonResponse({
      ok: true,
      selfTest: isSelfTest,
      grading,
      meta: {
        provider: 'cloudflare-workers-ai',
        model,
        rubricVersion: RUBRIC_VERSION
      }
    }, 200, origin, env);
  }
};
