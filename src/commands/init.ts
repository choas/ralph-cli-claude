import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import { LANGUAGES, generatePrompt, DEFAULT_PRD, DEFAULT_PROGRESS, type LanguageConfig } from "../templates/prompts.js";
import { promptSelect, promptConfirm, promptInput } from "../utils/prompt.js";

const CONFIG_FILE = "ralph.config.json";
const PRD_FILE = "prd.json";
const PROGRESS_FILE = "progress.txt";
const PROMPT_FILE = "ralph-prompt.md";

export async function init(_args: string[]): Promise<void> {
  const cwd = process.cwd();

  console.log("Initializing ralph in current directory...\n");

  // Check for existing config
  if (existsSync(join(cwd, CONFIG_FILE))) {
    const overwrite = await promptConfirm("ralph.config.json already exists. Overwrite?");
    if (!overwrite) {
      console.log("Aborted.");
      return;
    }
  }

  // Select language
  const languageKeys = Object.keys(LANGUAGES);
  const languageNames = languageKeys.map(k => `${LANGUAGES[k].name} - ${LANGUAGES[k].description}`);

  const selectedName = await promptSelect("Select your project language/runtime:", languageNames);
  const selectedIndex = languageNames.indexOf(selectedName);
  const selectedKey = languageKeys[selectedIndex];
  const config = LANGUAGES[selectedKey];

  // Allow custom commands
  let checkCommand = config.checkCommand;
  let testCommand = config.testCommand;

  if (selectedKey === "none") {
    checkCommand = await promptInput("\nEnter your type/build check command: ") || checkCommand;
    testCommand = await promptInput("Enter your test command: ") || testCommand;
  }

  const finalConfig: LanguageConfig = {
    ...config,
    checkCommand,
    testCommand,
  };

  // Write config file
  const configData = {
    language: selectedKey,
    checkCommand: finalConfig.checkCommand,
    testCommand: finalConfig.testCommand,
  };

  writeFileSync(join(cwd, CONFIG_FILE), JSON.stringify(configData, null, 2) + "\n");
  console.log(`\nCreated ${CONFIG_FILE}`);

  // Write prompt file
  const prompt = generatePrompt(finalConfig);
  writeFileSync(join(cwd, PROMPT_FILE), prompt + "\n");
  console.log(`Created ${PROMPT_FILE}`);

  // Create PRD if not exists
  if (!existsSync(join(cwd, PRD_FILE))) {
    writeFileSync(join(cwd, PRD_FILE), DEFAULT_PRD + "\n");
    console.log(`Created ${PRD_FILE}`);
  } else {
    console.log(`Skipped ${PRD_FILE} (already exists)`);
  }

  // Create progress file if not exists
  if (!existsSync(join(cwd, PROGRESS_FILE))) {
    writeFileSync(join(cwd, PROGRESS_FILE), DEFAULT_PROGRESS);
    console.log(`Created ${PROGRESS_FILE}`);
  } else {
    console.log(`Skipped ${PROGRESS_FILE} (already exists)`);
  }

  console.log("\nRalph initialized successfully!");
  console.log("\nNext steps:");
  console.log("  1. Edit prd.json to add your project requirements");
  console.log("  2. Run 'ralph once' to start the first iteration");
  console.log("  3. Or run 'ralph run 5' for 5 automated iterations");
}
