import { existsSync, readFileSync } from "fs";
import { join } from "path";

export interface RalphConfig {
  language: string;
  checkCommand: string;
  testCommand: string;
}

const CONFIG_FILE = "ralph.config.json";
const PROMPT_FILE = "ralph-prompt.md";
const PRD_FILE = "prd.json";
const PROGRESS_FILE = "progress.txt";

export function loadConfig(): RalphConfig {
  const cwd = process.cwd();
  const configPath = join(cwd, CONFIG_FILE);

  if (!existsSync(configPath)) {
    throw new Error("ralph.config.json not found. Run 'ralph init' first.");
  }

  const content = readFileSync(configPath, "utf-8");
  return JSON.parse(content);
}

export function loadPrompt(): string {
  const cwd = process.cwd();
  const promptPath = join(cwd, PROMPT_FILE);

  if (!existsSync(promptPath)) {
    throw new Error("ralph-prompt.md not found. Run 'ralph init' first.");
  }

  return readFileSync(promptPath, "utf-8");
}

export function checkFilesExist(): void {
  const cwd = process.cwd();

  const requiredFiles = [CONFIG_FILE, PROMPT_FILE, PRD_FILE, PROGRESS_FILE];

  for (const file of requiredFiles) {
    if (!existsSync(join(cwd, file))) {
      throw new Error(`${file} not found. Run 'ralph init' first.`);
    }
  }
}

export function getPaths() {
  const cwd = process.cwd();
  return {
    config: join(cwd, CONFIG_FILE),
    prompt: join(cwd, PROMPT_FILE),
    prd: join(cwd, PRD_FILE),
    progress: join(cwd, PROGRESS_FILE),
  };
}
