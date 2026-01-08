export interface LanguageConfig {
  name: string;
  checkCommand: string;
  testCommand: string;
  description: string;
}

export const LANGUAGES: Record<string, LanguageConfig> = {
  bun: {
    name: "Bun (TypeScript)",
    checkCommand: "bun check",
    testCommand: "bun test",
    description: "Bun runtime with TypeScript",
  },
  node: {
    name: "Node.js (TypeScript)",
    checkCommand: "npm run typecheck",
    testCommand: "npm test",
    description: "Node.js with TypeScript",
  },
  python: {
    name: "Python",
    checkCommand: "mypy .",
    testCommand: "pytest",
    description: "Python with mypy type checking",
  },
  go: {
    name: "Go",
    checkCommand: "go build ./...",
    testCommand: "go test ./...",
    description: "Go language",
  },
  rust: {
    name: "Rust",
    checkCommand: "cargo check",
    testCommand: "cargo test",
    description: "Rust with Cargo",
  },
  none: {
    name: "None (custom)",
    checkCommand: "echo 'no check configured'",
    testCommand: "echo 'no tests configured'",
    description: "Custom configuration",
  },
};

export function generatePrompt(config: LanguageConfig): string {
  return `You are an AI developer working on this project. Your task is to implement features from the PRD.

INSTRUCTIONS:
1. Read the @prd.json file to find the highest priority feature that has "passes": false
2. Implement that feature completely
3. Verify your changes work by running:
   - Type/build check: ${config.checkCommand}
   - Tests: ${config.testCommand}
4. Update the PRD entry to set "passes": true once verified
5. Append a brief note about what you did to @progress.txt
6. Create a git commit with a descriptive message for this feature
7. Only work on ONE feature per execution

IMPORTANT:
- Focus on a single feature at a time
- Ensure all checks pass before marking complete
- Write clear commit messages
- If the PRD is fully complete (all items pass), output: <promise>COMPLETE</promise>

Now, read the PRD and begin working on the highest priority incomplete feature.`;
}

export const DEFAULT_PRD = `[
  {
    "category": "setup",
    "description": "Example: Project builds successfully",
    "steps": [
      "Run the build command",
      "Verify no errors occur"
    ],
    "passes": false
  }
]`;

export const DEFAULT_PROGRESS = `# Progress Log\n`;
