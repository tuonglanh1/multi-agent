import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

export const writeFileTool = tool(
  async ({ filePath, content }) => {
    try {
      // Create necessary directories if they don't exist
      const fullPath = path.resolve(process.cwd(), filePath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content, 'utf-8');
      return `Successfully wrote to ${filePath}`;
    } catch (error) {
      return `Error writing file ${filePath}: ${error.message}`;
    }
  },
  {
    name: 'write_file_tool',
    description: 'Writes content to a specific file. Will overwrite the file if it exists.',
    schema: z.object({
      filePath: z.string().describe('The relative path to the file to create or modify, e.g., src/user/user.service.ts'),
      content: z.string().describe('The entire content to write to the file'),
    }),
  }
);

export const readFileTool = tool(
  async ({ filePath }) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        return `File ${filePath} does not exist.`;
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      return content;
    } catch (error) {
      return `Error reading file ${filePath}: ${error.message}`;
    }
  },
  {
    name: 'read_file_tool',
    description: 'Reads the content of a specific file on the filesystem',
    schema: z.object({
      filePath: z.string().describe('The relative path of the file to read'),
    }),
  }
);

import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export const executeCommandTool = tool(
  async ({ command }) => {
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: process.cwd() });
      if (stderr && !stdout) {
         return `Command Warning/Error Output:\n${stderr}`;
      }
      return `Command Success Output:\n${stdout}\n${stderr}`;
    } catch (error) {
      return `Command Failed with exception:\n${error.message}\nStdout: ${error.stdout}\nStderr: ${error.stderr}`;
    }
  },
  {
    name: 'execute_command_tool',
    description: 'Executes a bash command in the project root directory. Useful for running npm scripts like tests or builds.',
    schema: z.object({
      command: z.string().describe('The bash command to run, e.g., "npm run test" or "npx tsc --noEmit"'),
    }),
  }
);

export const listDirectoryTool = tool(
  async ({ targetPath }) => {
    try {
      const p = path.join(process.cwd(), targetPath);
      if (!fs.existsSync(p)) {
        return `Directory ${targetPath} does not exist.`;
      }
      const files = fs.readdirSync(p);
      return `Contents of ${targetPath}:\n${files.join('\n')}`;
    } catch (error) {
      return `Error listing directory ${targetPath}: ${error.message}`;
    }
  },
  {
    name: 'list_directory_tool',
    description: 'Lists the files and folders inside a specific directory. Useful for understanding project structure or checking if an entity file already exists.',
    schema: z.object({
      targetPath: z.string().describe('The relative directory path to list, e.g., "src/users/entities" or "src/orders"'),
    }),
  }
);
