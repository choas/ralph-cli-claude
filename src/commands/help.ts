const HELP_TEXT = `
ralph - AI-driven development automation CLI

USAGE:
  ralph <command> [options]

COMMANDS:
  init [opts]       Initialize ralph in current project
  once              Run a single automation iteration
  run <n> [opts]    Run n automation iterations
  prd <subcommand>  Manage PRD entries
  scripts           Generate shell scripts (for sandboxed environments)
  docker            Generate Docker sandbox environment
  help              Show this help message

INIT OPTIONS:
  --tech-stack, -t           Enable technology stack selection prompt

RUN OPTIONS:
  --loop, -l                 Run continuously, waiting for new items when complete
  --category, -c <category>  Filter PRD items by category
                             Valid: ui, feature, bugfix, setup, development, testing, docs

PRD SUBCOMMANDS:
  prd add           Add a new PRD entry (interactive)
  prd list [opts]   List all PRD entries
  prd status        Show PRD completion status
  prd toggle <n>    Toggle passes status for entry n
  prd toggle --all  Toggle all PRD entries
  prd clean         Remove all passing entries from the PRD

PRD LIST OPTIONS:
  --category, -c <category>  Filter PRD items by category
                             Valid: ui, feature, bugfix, setup, development, testing, docs

EXAMPLES:
  ralph init                 # Initialize ralph (language selection only)
  ralph init --tech-stack    # Initialize with technology stack selection
  ralph once                 # Run single iteration
  ralph run 5                # Run 5 iterations
  ralph run --loop           # Run continuously until interrupted
  ralph run --loop -c feature  # Loop mode, only feature items
  ralph run 5 --category feature  # Run 5 iterations, only feature items
  ralph run 3 -c bugfix      # Run 3 iterations, only bugfix items
  ralph prd add              # Add new PRD entry
  ralph prd list             # Show all entries
  ralph prd list -c feature  # Show only feature entries
  ralph prd status           # Show completion summary
  ralph scripts              # Generate ralph.sh and ralph-once.sh
  ralph docker               # Generate Dockerfile for sandboxed env
  ralph docker --build       # Build Docker image
  ralph docker --build --clean  # Clean and rebuild from scratch
  ralph docker --run         # Run container (auto-init/build if needed)
  ralph docker --clean       # Remove image and volumes

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
