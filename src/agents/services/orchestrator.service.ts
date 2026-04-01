import { Injectable, Logger } from '@nestjs/common';
import { StateGraph, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import * as fs from 'fs';
import { AgentState } from '../graph/state';
import { managerNode } from '../nodes/manager.node';
import { migrationNode } from '../nodes/migration.node';
import { logicNode } from '../nodes/logic.node';
import { testNode } from '../nodes/test.node';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private graph: any; // Type of StateGraph Compiled

  constructor(private configService: ConfigService) {
    this.buildGraph();
  }

  private buildGraph() {
    // 1. Initialize LLM Model
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    // Fallback logic for testing, it will throw if really not provided when initialized.
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: geminiApiKey || 'mock-key',
      temperature: 0.1,
    });

    // Utility to wait, avoiding Free Tier Too Many Requests Error (15 RPM limits)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 2. Wrap Nodes to Inject Model and add artificial delay
    const managerFn = async (state) => {
      this.logger.log('Waiting for Manager Agent...');
      // await delay(2000);
      const result = await managerNode(state, model);
      
      try {
        const mdContent = `# Agent Blueprint & Plan\n\n## Tasks\n${result.plan?.map(p => '- ' + p).join('\n') || 'None'}\n\n## Blueprint JSON\n\`\`\`json\n${JSON.stringify(result.blueprint, null, 2)}\n\`\`\`\n`;
        fs.writeFileSync('blueprint.md', mdContent, 'utf8');
        this.logger.log('Successfully exported plan to blueprint.md');
      } catch (err) {
        this.logger.error('Failed to write blueprint.md', err);
      }

      return result;
    };
    const migrationFn = async (state) => {
      this.logger.log('Waiting for Migration Agent...');
      // await delay(2000);
      return await migrationNode(state, model);
    };
    const logicFn = async (state) => {
      this.logger.log('Waiting for Logic Agent...');
      // await delay(2000);
      return await logicNode(state, model);
    };
    const testFn = async (state) => {
      this.logger.log('Waiting for Test Agent...');
      // await delay(2000);
      return await testNode(state, model);
    };

    // 3. Define State Graph
    const workflow = new StateGraph(AgentState)
      .addNode('manager', managerFn)
      .addNode('migration', migrationFn)
      .addNode('logic', logicFn)
      .addNode('test', testFn);

    // 4. Set entry point
    workflow.addEdge('__start__', 'manager');

    // 5. Strict Sequential Pipeline Routing
    workflow.addEdge('manager', 'migration');
    workflow.addEdge('migration', 'logic');
    workflow.addEdge('logic', 'test');

    // 6. Test node conditional loop back to logic for self-correction, or Finish
    workflow.addConditionalEdges('test', (state) => {
      // Loop back if there is an error and under the limit
      if (state.testError && state.testFailures < 3) {
        this.logger.warn(`Test failed (${state.testFailures}/3). Routing back to Logic Agent for self-correction.`);
        return 'logic';
      }
      // If success or exhausted retries, finish the entire flow automatically
      if (state.testError) {
         this.logger.error('Test failed after 3 retries. Workflow Force Ending.');
      } else {
         this.logger.log('Test PASSED! Workflow Successfully Ending.');
      }
      return END;
    });

    // 7. Compile the graph
    this.graph = workflow.compile();
    this.logger.log('Agent Graph compiled successfully.');
  }

  public async runWorkflow(goal: string) {
    this.logger.log(`Starting Multi-Agent workflow for goal: "${goal}"`);
    
    // Initial State Execution
    const initialState = {
      goal,
      messages: [],
      plan: [],
      currentStep: '',
      summary: '',
      touchedFiles: [],
    };

    try {
      // Setup up threading/recursion limit
      const result = await this.graph.invoke(initialState, { recursionLimit: 50 });
      this.logger.log(`Workflow completed.`);
      return {
        goal: result.goal,
        plan: result.plan,
        touchedFiles: result.touchedFiles,
      };
    } catch (e) {
      this.logger.error('Workflow failed.', e);
      throw e;
    }
  }
}
