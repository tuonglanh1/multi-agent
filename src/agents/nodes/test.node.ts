import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentState } from '../graph/state';
import { readFileTool, writeFileTool, executeCommandTool } from '../graph/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import * as fs from 'fs';
import * as path from 'path';

export const testNode = async (state: typeof AgentState.State, model: ChatGoogleGenerativeAI) => {
  const tools = [readFileTool, writeFileTool, executeCommandTool];

  const rulePath = path.join(process.cwd(), 'src/agents/rules/test.rule.md');
  const ruleContent = fs.readFileSync(rulePath, 'utf8');

  const agent = createReactAgent({
    llm: model,
    tools,
    messageModifier: new SystemMessage(ruleContent),
  });

  const responseMsg = await agent.invoke({
    messages: [
      new HumanMessage(`Goal: ${state.goal}. The manager says: ${state.messages[state.messages.length - 1]?.content}`),
    ],
  });

  const lastMsg = responseMsg.messages[responseMsg.messages.length - 1];
  const lastMsgStr = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content);
  
  // A naive check: if the AI complains about failing tests in its final message or if we use a structured tool.
  // For robustness, an LLM call or regex can determine if it failed. We assume if it contains 'FAIL' or 'Error'.
  const didFail = lastMsgStr.includes('FAIL') || lastMsgStr.includes('Failed with exception');
  const nextFailures = didFail ? state.testFailures + 1 : state.testFailures;
  const testErrorStr = didFail ? `Test Execution Failed:\n${lastMsgStr}` : '';

  // Extract dynamically written files from ToolCalls
  const writtenFiles: string[] = [];
  for (const msg of responseMsg.messages) {
    if ('tool_calls' in msg && Array.isArray((msg as any).tool_calls)) {
      for (const call of (msg as any).tool_calls) {
        if (call.name === 'write_file_tool' && call.args?.filePath) {
          writtenFiles.push(call.args.filePath);
        }
      }
    }
  }

  const currentTouchedFiles = state.touchedFiles || [];
  const updatedTouchedFiles = Array.from(new Set([...currentTouchedFiles, ...writtenFiles]));

  return {
    messages: [
      new HumanMessage(`Test Agent completed task. Status: ${didFail ? 'FAILED' : 'PASSED'}. Details: ${lastMsgStr}`),
    ],
    testFailures: nextFailures,
    testError: testErrorStr,
    touchedFiles: updatedTouchedFiles,
  };
};
