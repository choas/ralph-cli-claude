# ralph-cli-claude

AI-driven development automation CLI for [Claude Code](https://github.com/anthropics/claude-code), implementing the [Ralph Wiggum technique](https://ghuntley.com/ralph/) created by Geoffrey Huntley.

The Ralph Wiggum technique (named after the Simpsons character) runs a coding agent from a clean slate, over and over, until a stop condition is met. As [Matt Pocock describes it](https://x.com/mattpocockuk/status/2008200878633931247): "an AI coding approach that lets you run seriously long-running AI agents (hours, days) that ship code while you sleep."

This CLI automates iterative development by having Claude work through a PRD (Product Requirements Document), implementing features one at a time, running tests, and committing changes. When an iteration completes, the next one starts fresh - preventing context rot and allowing long-running autonomous development.

## Installation

```bash
# Use directly with npx
npx ralph-cli-claude init

# Or install globally
npm install -g ralph-cli-claude
ralph init
```

## Quick Start

```bash
# 1. Initialize ralph in your project
ralph init

# 2. Add requirements to your PRD
ralph prd add

# 3. Run a single iteration
ralph once

# 4. Or run multiple iterations
ralph run 5
```

## Commands

| Command | Description |
|---------|-------------|
| `ralph init` | Initialize ralph in current project |
| `ralph once` | Run a single automation iteration |
| `ralph run <n>` | Run n automation iterations |
| `ralph prd add` | Add a new PRD entry (interactive) |
| `ralph prd list` | List all PRD entries |
| `ralph prd status` | Show PRD completion status |
| `ralph prd toggle <n>` | Toggle passes status for entry n |
| `ralph scripts` | Generate shell scripts for sandboxed environments |
| `ralph docker` | Generate Docker sandbox environment |
| `ralph help` | Show help message |

## Configuration

After running `ralph init`, you'll have:

```
.ralph/
├── config.json      # Project configuration
├── prompt.md        # Shared prompt template
├── prd.json         # Product requirements document
└── progress.txt     # Progress tracking file
```

### Supported Languages

- **Bun** (TypeScript) - `bun check`, `bun test`
- **Node.js** (TypeScript) - `npm run typecheck`, `npm test`
- **Python** - `mypy .`, `pytest`
- **Go** - `go build ./...`, `go test ./...`
- **Rust** - `cargo check`, `cargo test`
- **Custom** - Define your own commands

## PRD Format

The PRD (`prd.json`) is an array of requirements:

```json
[
  {
    "category": "feature",
    "description": "Add user authentication",
    "steps": [
      "Create login form",
      "Implement JWT tokens",
      "Add protected routes"
    ],
    "passes": false
  }
]
```

Categories: `ui`, `feature`, `bugfix`, `setup`, `development`, `testing`, `docs`

## Docker Sandbox

Run ralph in an isolated Docker container:

```bash
# Generate Docker files
ralph docker

# Build the image
ralph docker --build

# Run container
ralph docker --run
```

Features:
- Based on [Claude Code devcontainer](https://github.com/anthropics/claude-code/tree/main/.devcontainer)
- Network sandboxing (firewall allows only GitHub, npm, Anthropic API)
- Your `~/.claude` credentials mounted automatically (Pro/Max OAuth)
- Language-specific tooling pre-installed

### Installing packages in container

```bash
# Run as root to install packages
docker compose run -u root ralph apt-get update
docker compose run -u root ralph apt-get install <package>
```

## Shell Scripts

For environments where the CLI isn't available:

```bash
ralph scripts
```

Generates `ralph.sh` and `ralph-once.sh` in your project root.

## How It Works

1. **Read PRD**: Claude reads your requirements from `prd.json`
2. **Implement**: Works on the highest priority incomplete feature
3. **Verify**: Runs your check and test commands
4. **Update**: Marks the feature as complete in the PRD
5. **Commit**: Creates a git commit for the feature
6. **Repeat**: Continues to the next feature (in `run` mode)

When all PRD items pass, Claude outputs `<promise>COMPLETE</promise>` and stops.

## Requirements

- Node.js 18+
- [Claude Code CLI](https://github.com/anthropics/claude-code) installed
- Claude Pro/Max subscription or Anthropic API key

## License

MIT
