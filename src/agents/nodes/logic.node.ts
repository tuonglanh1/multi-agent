import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentState } from '../graph/state';
import { readFileTool, writeFileTool } from '../graph/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import * as fs from 'fs';
import * as path from 'path';

export const logicNode = async (state: typeof AgentState.State, model: ChatGoogleGenerativeAI) => {
  const tools = [readFileTool, writeFileTool];

  const rulePath = path.join(process.cwd(), 'src/agents/rules/logic.rule.md');
  const ruleContent = fs.readFileSync(rulePath, 'utf8');

  const agent = createReactAgent({
    llm: model,
    tools,
    messageModifier: new SystemMessage(ruleContent),
  });

  const failureContext = state.testError ? `\n\nCRITICAL FIX NEEDED: The Test Agent ran the tests but encountered errors:\n${state.testError}\nPlease review your generated files and fix the logic.` : '';

  const responseMsg = await agent.invoke({
    messages: [
      new HumanMessage(`Goal: ${state.goal}. The manager says: ${state.messages[state.messages.length - 1]?.content}${failureContext}`),
    ],
  });

  const lastMsg = responseMsg.messages[responseMsg.messages.length - 1];

  return {
    messages: [
      new HumanMessage(`Logic Agent completed task: ${lastMsg.content}`),
    ],
    touchedFiles: ['src/...'], // Ideally dynamically tracked from tools
  };
};
