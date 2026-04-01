import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentState } from '../graph/state';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// Define the structured output expected from the manager
const managerSchema = z.object({
  plan: z.array(z.string()).describe('The list of tasks to complete the request. Just high-level tasks.'),
  nextStep: z.enum(['migration', 'logic', 'test', 'FINISH']).describe('The specialized agent to summon next. Always choose migration first.'),
  instructions: z.string().describe('Detailed instructions for the chosen agent on what to do specifically in this step.'),
  blueprint: z.object({
    module: z.object({
      name: z.string(),
      description: z.string(),
      models: z.array(z.object({
        name: z.string(),
        description: z.string(),
        fields: z.array(z.object({
          name: z.string(),
          type: z.string(),
          isPrimary: z.boolean().optional(),
          isRequired: z.boolean().optional(),
          isUnique: z.boolean().optional(),
          enumValues: z.array(z.string()).optional(),
          defaultValue: z.any().optional(),
          isAuto: z.boolean().optional(),
        })),
        relations: z.array(z.object({
          type: z.string(),
          targetEntity: z.string(),
          joinColumn: z.string().optional(),
          inverseSide: z.string().optional(),
        })).optional(),
      })),
      workflows: z.array(z.object({
        actionName: z.string(),
        description: z.string(),
        inputs: z.array(z.string()),
        returns: z.string(),
      })),
      endpoints: z.array(z.object({
        method: z.string(),
        path: z.string(),
        workflow: z.string(),
        authRequired: z.boolean(),
        roles: z.array(z.string()).optional(),
      })),
    })
  }).describe('The strictly structured JSON representation of the features to build. MUST be filled out based on User Goal.')
});

export const managerNode = async (state: typeof AgentState.State, model: ChatGoogleGenerativeAI) => {
  const modelWithStructure = model.withStructuredOutput(managerSchema);

  const rulePath = path.join(process.cwd(), 'src/agents/rules/manager.rule.md');
  const ruleContent = fs.readFileSync(rulePath, 'utf8');

  const sysPrompt = new SystemMessage(ruleContent);

  const contextMsg = new HumanMessage(`Goal: ${state.goal}

Current plan history / touched files:
${state.touchedFiles.join('\n') || 'None yet'}

What is the blueprint and next step?`);

  const response = await modelWithStructure.invoke([sysPrompt, contextMsg]);

  return {
    plan: response.plan,
    currentStep: response.nextStep,
    blueprint: response.blueprint,
    messages: [
      new SystemMessage(
        `Manager instructed '${response.nextStep}': ${response.instructions}`
      ),
    ],
  };
};
