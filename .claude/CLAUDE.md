# Stabiliq Backend Rules

## IMPORTANT
- When modifying code, read only the files required for the task. Avoid scanning the entire repository unless explicitly requested.
- Read only the minimum required files.

- If a request can be answered in under 100 words, do not exceed 100 words.

- If a request can be answered with a code diff, return only the diff.

- Return only what was requested.

- Do not repeat requirements already present in the conversation.

---

## Response Style

- Be concise.
- Assume I am a senior backend engineer.
- Do not explain basic concepts.
- Use bullet points instead of long paragraphs.
- Avoid introductions and conclusions unless necessary.

---

## Code Changes

- Return only modified code.
- Never regenerate complete files unless explicitly requested.
- Prefer unified git diff format.
- Preserve existing code style.
- Preserve existing architecture.
- Do not rename variables, functions, classes, files, or folders unless required.
- Do not add comments unless requested.
- Do not perform unrelated refactoring.

---

## Debugging

Always provide:

1. Root Cause
2. Evidence
3. Fix
4. Minimal Patch

When logs, stack traces, manifests, signed URLs, SQL queries, backend code, or configuration are provided:

- Analyze the provided data first.
- Do not provide generic troubleshooting checklists.
- Rank possible causes by confidence percentage.
- Focus on the highest-confidence cause first.
- Explain why other causes are less likely.

---

## Backend Development

Before suggesting changes:

- Consider backward compatibility.
- Consider production impact.
- Consider failure scenarios.
- Prefer minimal safe changes over large refactors.

---

## Node.js

- Avoid unnecessary abstractions.
- Prefer existing project patterns.
- Minimize dependency additions.
- Preserve backward compatibility.
- Prefer incremental changes over large rewrites.

<!-- ## SQL

- Identify bottlenecks before suggesting changes.
- Explain expected performance impact.
- Avoid theoretical optimizations.
- Suggest indexes only when justified.

--- -->

## Repository Access

- Read only files required for the task.
- Do not scan the entire repository unless explicitly requested.
- Do not inspect unrelated files.
- Prefer targeted file reads over broad codebase exploration.
- Before reading additional files, explain why they are needed.

## Database (MongoDB)

- Identify query bottlenecks before suggesting changes.
- Consider index usage before code changes.
- Explain expected performance impact.
- Avoid theoretical optimizations.
- Prefer aggregation optimization over application-side processing.
- Consider document growth and collection size.
- Consider read/write tradeoffs.
- Suggest indexes only when justified by query patterns.

## Redis

- Consider cache invalidation.
- Consider TTL behavior.
- Avoid unnecessary cache writes.

---

## Video Platform

When working with:

- GCS
- Signed URLs
- HLS manifests
- Media CDN
- Video uploads
- Recording pipelines

Always verify:

- Object existence
- Permissions
- Signing policy
- URL integrity
- Cache behavior

before suggesting application code changes.

---

## Architecture

Provide:

1. Recommendation
2. Pros
3. Cons
4. Complexity

Avoid discussing multiple alternatives unless requested.

---

## Performance

- Suggest optimizations only when relevant.
- Highlight memory, CPU, network, or database bottlenecks when detected.

---

## Context Management

- Summarize long discussions instead of repeating them.
- Do not restate code already shown.
- Do not generate examples unless requested.
- Do not provide multiple solutions unless requested.
- Prefer the most likely solution first.