import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentState } from '../graph/state';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// Define the structured output expected from the manager
const managerSchema = z.object({
  plan: z
    .array(z.string())
    .describe('The list of tasks to complete the request. Just high-level tasks.'),
  nextStep: z
    .enum(['migration', 'logic', 'test', 'FINISH'])
    .describe('The specialized agent to summon next. If we need DB changes, choose migration. If business logic, choose logic. For testing, choose test. If all tasks are completed, output FINISH.'),
  instructions: z
    .string()
    .describe('Detailed instructions for the chosen agent on what to do specifically in this step.'),
});

export const managerNode = async (state: typeof AgentState.State, model: ChatGoogleGenerativeAI) => {
  const modelWithStructure = model.withStructuredOutput(managerSchema);

  const rulePath = path.join(process.cwd(), 'src/agents/rules/manager.rule.md');
  const ruleContent = fs.readFileSync(rulePath, 'utf8');

  const sysPrompt = new SystemMessage(ruleContent);

  // Use the history of messages as context for what has been done
  const contextMsg = new HumanMessage(`Goal: ${state.goal}

Current plan history / touched files:
${state.touchedFiles.join('\n') || 'None yet'}

What is the next step?`);

  const response = await modelWithStructure.invoke([sysPrompt, contextMsg]);

  return {
    plan: response.plan,
    currentStep: response.nextStep,
    messages: [
      new SystemMessage(
        `Manager instructed '${response.nextStep}': ${response.instructions}`
      ),
    ],
  };
};
