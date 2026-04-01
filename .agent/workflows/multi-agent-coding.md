---
description: How to run the automated Multi-Agent Coding Framework with Sequential Pipeline & Self-Correction
---

# Multi-Agent Coding Framework in NestJS

This workflow automation handles the entire process of generating, validating, and testing code via Google Gemini AI agents within your NestJS workspace. It uses a **Strict Sequential Pipeline** to execute tasks predictably and reliably.

## Prerequisites

1. Ensure your `.env` file has a valid `GEMINI_API_KEY`.
2. Install the necessary packages (e.g., `@langchain/google-genai`, `@nestjs/config`, `typeorm`, `jest`, etc.).
3. **Important:** Because AI generation writes directly to `src/`, running `pnpm run start:dev` will trigger aggressive nodemon restarts that may kill active API workflows. Therefore, to use the agents safely, start the server without file watching mode.

// turbo-all
## Steps to trigger

1. Start your NestJS server in the primary terminal (WITHOUT `--watch` mode):
   ```bash
   pnpm run start
   ```

2. Execute the multi-agent orchestration by sending a POST request to your API.
   The graph will strictly flow from Manager ➔ Migration ➔ Logic ➔ Test.
   ```bash
   curl -X POST http://localhost:3000/agents/generate \
   -H "Content-Type: application/json" \
   -d '{"goal": "Create a User schema, a create method in user service, and its unit test."}'
   ```

## Architecture: Blueprint-Driven Sequential Pipeline

The Graph strictly follows a 1-way sequence, utilizing external Rule files (`src/agents/rules/*.rule.md`) and a rigorous **JSON Blueprint** mechanism to define isolated, professional personas:

1. **Manager Node (Tech Lead)**: Reads the prompt and generates a strict structured **JSON Blueprint** instead of free-text plans. The blueprint explicitly defines all features: `module`, `models` (fields, relations), `workflows`, and `endpoints` (auth, roles).
2. **Migration Node (DB Specialist)**: Consumes `blueprint.module.models` and transforms the structured schema directly into TypeORM Entities with relationships and strict typing.
3. **Logic Node (Backend Developer)**: Consumes the blueprint's `workflows` and `endpoints`. It applies **Pattern Mapping** (e.g., Check duplicate + create, Assign relation, Toggle status) to generate clean NestJS Services, Controllers, DTOs, and Route Guards.
   - 🛡️ **Self-Compiler Check**: Before completing, it automatically triggers `npx tsc --noEmit`. If there are TypeScript syntax errors, it traps itself in a micro-loop to fix the code (missing imports, typos).
4. **Test Node (QA Engineer)**: Receives the logically compiled code and writes robust `.spec.ts` mocking dependencies. It directly executes `npm run test` using `executeCommandTool`.

### The Magic: Automatic Self-Correction Loop
If the Unit Test fails (e.g. business logic flaw), the Test Agent isolates the error log and violently **forces the Workflow to route backward to the Logic Node**. The Logic Node is given the error log and must rewrite its code. This backward loop cycles a maximum of 3 times.

Observe the Terminal logs on your `pnpm run start` process to see real-time Node turns, automatic TS-compiles, and automated Jest tests firing out sequentially on your codebase!
