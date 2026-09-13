# IB Master Trainer AI Instructor Worker

Cloudflare Workers AI backend for English B HL Paper 1 grading.

## Cloudflare Workers Builds settings

- Repository: `Yamon-JP/-IB-Vocabulary-Test`
- Production branch during Phase 7A testing: `v1.0-development`
- Root directory: `worker`
- Build command: leave blank
- Deploy command: `npx wrangler deploy`
- Non-production branch deploy command: `npx wrangler versions upload`
- Worker name: `ib-master-trainer-ai-instructor`

The Worker configuration is defined in `wrangler.toml`.

## Workers AI binding

`wrangler.toml` declares:

```toml
[ai]
binding = "AI"
```

The grading code accesses Workers AI through `env.AI.run()`.

## Initial model

`@cf/google/gemma-4-26b-a4b-it`

The model can be changed through `WORKERS_AI_MODEL` in `wrangler.toml` without changing the frontend.

## Endpoint

The Worker exposes:

`POST /grade/english-b-paper1`

Allowed browser origin is currently:

`https://yamon-jp.github.io`

## Phase 7A-1 behavior

AI grading is displayed in the Writing screen but is intentionally not saved to Progress yet. Existing self-marking remains unchanged and available as a fallback.
