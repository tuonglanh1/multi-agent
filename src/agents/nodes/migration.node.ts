import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentState } from '../graph/state';
import { readFileTool, writeFileTool } from '../graph/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import * as fs from 'fs';
import * as path from 'path';

export const migrationNode = async (state: typeof AgentState.State, model: ChatGoogleGenerativeAI) => {
  const tools = [readFileTool, writeFileTool];

  const rulePath = path.join(process.cwd(), 'src/agents/rules/migration.rule.md');
  const ruleContent = fs.readFileSync(rulePath, 'utf8');

  const agent = createReactAgent({
    llm: model,
    tools: tools,
    messageModifier: new SystemMessage(ruleContent),
  });

  // Re-run the agent with the history
  const responseMsg = await agent.invoke({
    messages: [
      new HumanMessage(`Goal: ${state.goal}. 
      The manager says: ${state.messages[state.messages.length - 1]?.content}`),
    ],
  });

  const lastMsg = responseMsg.messages[responseMsg.messages.length - 1];

  return {
    messages: [
      new HumanMessage(`Migration Agent completed task: ${lastMsg.content}`),
    ],
    // The touched files can be inferred or manually passed; simplified for demo
    touchedFiles: ['src/migrations/db-change.ts'], 
  };
};
