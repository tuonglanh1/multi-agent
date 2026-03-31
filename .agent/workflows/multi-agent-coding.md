---
description: How to run the automated Multi-Agent Coding Framework with Self-Correction
---

# Multi-Agent Coding Framework in NestJS

This workflow automation handles the entire process of generating, validating, and testing code via Google Gemini AI agents within your NestJS workspace.

## Prerequisites

1. Ensure your `.env` file has a valid `GEMINI_API_KEY`.
2. Make sure you install the required packages (e.g. `@langchain/google-genai`, `@nestjs/config`, `typeorm`, etc.).
3. Start the NestJS background development server.

// turbo-all
## Steps to trigger

1. Keep your NestJS server running in the primary background terminal:
   \`\`\`bash
   pnpm run start:dev
   \`\`\`

2. Execute the multi-agent orchestration by sending a POST request to your local API.
   The Manager Agent will review your goal, split the work, and dispatch it to the specific Node instances.
   \`\`\`bash
   curl -X POST http://localhost:3000/agents/generate \
   -H "Content-Type: application/json" \
   -d '{"goal": "Create a User schema, a create method in user service, and its unit test."}'
   \`\`\`

## Expected Behavior and the Self-Correction Loop

- **Manager Node**: Determines who to summon.
- **Migration Node**: Connects to your `src/migrations` or generates `typeorm` Entities.
- **Logic Node**: Builds strict NestJS structure with Controllers, Modules, Services, and *Repository patterns*.
- **Test Node**: Reads generated files and writes \`.spec.ts\`. Critically, the Test node **will run the npm tests** via \`executeCommandTool\`.
- **Self-Correction (The Magic)**: If the \`.spec.ts\` fails when running \`npm run test\`, the graph automatically traps the Test node and loops back to **Logic Node** (sending the `testError` along). The Logic node will rewrite the code. This loop happens a maximum of 3 times before returning to the Manager.

Observe the Terminal logs on your `start:dev` process to see real-time updates as nodes take turns operating on your codebase!
