const HELP_TEXT = `
ralph - AI-driven development automation CLI

USAGE:
  ralph <command> [options]

COMMANDS:
  init              Initialize ralph in current project
  once              Run a single automation iteration
  run <n>           Run n automation iterations
  prd <subcommand>  Manage PRD entries
  scripts           Generate shell scripts (for sandboxed environments)
  docker            Generate Docker sandbox environment
  help              Show this help message

PRD SUBCOMMANDS:
  prd add           Add a new PRD entry (interactive)
  prd list          List all PRD entries
  prd status        Show PRD completion status
  prd toggle <n>    Toggle passes status for entry n
  prd toggle --all  Toggle all PRD entries

EXAMPLES:
  ralph init                 # Initialize ralph for your project
  ralph once                 # Run single iteration
  ralph run 5                # Run 5 iterations
  ralph prd add              # Add new PRD entry
  ralph prd list             # Show all entries
  ralph prd status           # Show completion summary
  ralph scripts              # Generate ralph.sh and ralph-once.sh
  ralph docker               # Generate Dockerfile for sandboxed env
  ralph docker --build       # Build Docker image
  ralph docker --run         # Run container interactively

CONFIGURATION:
  After running 'ralph init', you'll have:
  .ralph/
  ├── config.json      Project configuration
  ├── prompt.md        Shared prompt template
  ├── prd.json         Product requirements document
  └── progress.txt     Progress tracking file
`;

export function help(_args: string[]): void {
  console.log(HELP_TEXT.trim());
}
