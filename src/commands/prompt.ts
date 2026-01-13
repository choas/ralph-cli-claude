import { loadConfig, loadPrompt } from "../utils/config.js";
import { resolvePromptVariables } from "../templates/prompts.js";

export async function prompt(args: string[]): Promise<void> {
  const flag = args[0];

  if (flag === "--help" || flag === "-h") {
    console.log(`
ralph prompt - Display the resolved prompt for Claude Code

USAGE:
  ralph prompt              Print the full prompt with variables resolved
  ralph prompt --raw        Print the raw template with $variables

DESCRIPTION:
  Reads .ralph/prompt.md and resolves template variables using values
  from .ralph/config.json. This is useful for testing the prompt manually
  in Claude Code or other AI assistants.

TEMPLATE VARIABLES:
  $language      - The language/runtime name (e.g., "Kotlin")
  $technologies  - Comma-separated list of technologies
  $checkCommand  - The type/build check command
  $testCommand   - The test command

EXAMPLES:
  ralph prompt              # Print resolved prompt
  ralph prompt --raw        # Print template with $variables
  ralph prompt | pbcopy     # Copy to clipboard (macOS)
`);
    return;
  }

  const config = loadConfig();
  const template = loadPrompt();

  if (flag === "--raw") {
    console.log(template);
    return;
  }

  const resolved = resolvePromptVariables(template, {
    language: config.language,
    checkCommand: config.checkCommand,
    testCommand: config.testCommand,
    technologies: config.technologies,
  });

  console.log(resolved);
}
