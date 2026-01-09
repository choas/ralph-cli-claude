import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { promptInput, promptSelect } from "../utils/prompt.js";
import { getRalphDir } from "../utils/config.js";

interface PrdEntry {
  category: string;
  description: string;
  steps: string[];
  passes: boolean;
}

const PRD_FILE = "prd.json";
const CATEGORIES = ["ui", "feature", "bugfix", "setup", "development", "testing", "docs"];

function getPrdPath(): string {
  return join(getRalphDir(), PRD_FILE);
}

function loadPrd(): PrdEntry[] {
  const path = getPrdPath();
  if (!existsSync(path)) {
    throw new Error(".ralph/prd.json not found. Run 'ralph init' first.");
  }
  return JSON.parse(readFileSync(path, "utf-8"));
}

function savePrd(entries: PrdEntry[]): void {
  writeFileSync(getPrdPath(), JSON.stringify(entries, null, 2) + "\n");
}

async function add(): Promise<void> {
  console.log("Add new PRD entry\n");

  const category = await promptSelect("Select category:", CATEGORIES);
  const description = await promptInput("\nDescription: ");

  if (!description) {
    console.error("Description is required.");
    process.exit(1);
  }

  console.log("\nEnter verification steps (empty line to finish):");
  const steps: string[] = [];
  let stepNum = 1;

  while (true) {
    const step = await promptInput(`  Step ${stepNum}: `);
    if (!step) break;
    steps.push(step);
    stepNum++;
  }

  if (steps.length === 0) {
    steps.push("Verify the feature works as expected");
  }

  const entry: PrdEntry = {
    category,
    description,
    steps,
    passes: false,
  };

  const prd = loadPrd();
  prd.push(entry);
  savePrd(prd);

  console.log(`\nAdded entry #${prd.length}: "${description}"`);
}

function list(): void {
  const prd = loadPrd();

  if (prd.length === 0) {
    console.log("No PRD entries found.");
    return;
  }

  console.log("\nPRD Entries:\n");

  prd.forEach((entry, i) => {
    const status = entry.passes ? "\x1b[32m[PASS]\x1b[0m" : "\x1b[33m[    ]\x1b[0m";
    console.log(`  ${i + 1}. ${status} [${entry.category}] ${entry.description}`);
    entry.steps.forEach((step, j) => {
      console.log(`       ${j + 1}. ${step}`);
    });
    console.log();
  });
}

function status(): void {
  const prd = loadPrd();

  if (prd.length === 0) {
    console.log("No PRD entries found.");
    return;
  }

  const passing = prd.filter((e) => e.passes).length;
  const total = prd.length;
  const percentage = Math.round((passing / total) * 100);

  console.log(`\nPRD Status: ${passing}/${total} passing (${percentage}%)\n`);

  // Progress bar
  const barWidth = 30;
  const filled = Math.round((passing / total) * barWidth);
  const bar = "\x1b[32m" + "\u2588".repeat(filled) + "\x1b[0m" + "\u2591".repeat(barWidth - filled);
  console.log(`  [${bar}]\n`);

  // By category
  const byCategory: Record<string, { pass: number; total: number }> = {};

  prd.forEach((entry) => {
    if (!byCategory[entry.category]) {
      byCategory[entry.category] = { pass: 0, total: 0 };
    }
    byCategory[entry.category].total++;
    if (entry.passes) byCategory[entry.category].pass++;
  });

  console.log("  By category:");
  Object.entries(byCategory).forEach(([cat, stats]) => {
    console.log(`    ${cat}: ${stats.pass}/${stats.total}`);
  });

  if (passing === total) {
    console.log("\n  \x1b[32m\u2713 All requirements complete!\x1b[0m");
  } else {
    const remaining = prd.filter((e) => !e.passes);
    console.log(`\n  Remaining (${remaining.length}):`);
    remaining.forEach((entry) => {
      console.log(`    - [${entry.category}] ${entry.description}`);
    });
  }
}

function toggle(args: string[]): void {
  const arg = args[0];

  // Check for --all flag
  if (arg === "--all" || arg === "-a") {
    const prd = loadPrd();

    if (prd.length === 0) {
      console.log("No PRD entries to toggle.");
      return;
    }

    prd.forEach((entry) => {
      entry.passes = !entry.passes;
    });
    savePrd(prd);

    console.log(`Toggled all ${prd.length} PRD entries.`);
    return;
  }

  // Parse all numeric arguments
  const indices: number[] = [];
  for (const a of args) {
    const index = parseInt(a);
    if (!index || isNaN(index)) {
      console.error("Usage: ralph prd toggle <number> [number2] [number3] ...");
      console.error("       ralph prd toggle --all");
      process.exit(1);
    }
    indices.push(index);
  }

  if (indices.length === 0) {
    console.error("Usage: ralph prd toggle <number> [number2] [number3] ...");
    console.error("       ralph prd toggle --all");
    process.exit(1);
  }

  const prd = loadPrd();

  // Validate all indices
  for (const index of indices) {
    if (index < 1 || index > prd.length) {
      console.error(`Invalid entry number: ${index}. Must be 1-${prd.length}`);
      process.exit(1);
    }
  }

  // Toggle each entry
  for (const index of indices) {
    const entry = prd[index - 1];
    entry.passes = !entry.passes;
    const statusText = entry.passes ? "PASSING" : "NOT PASSING";
    console.log(`Entry #${index} "${entry.description}" is now ${statusText}`);
  }

  savePrd(prd);
}

function clean(): void {
  const prd = loadPrd();

  const originalLength = prd.length;
  const filtered = prd.filter((entry) => !entry.passes);

  if (filtered.length === originalLength) {
    console.log("No passing entries to clean.");
    return;
  }

  const removed = originalLength - filtered.length;
  savePrd(filtered);

  console.log(`Removed ${removed} passing ${removed === 1 ? "entry" : "entries"}.`);
  console.log(`${filtered.length} ${filtered.length === 1 ? "entry" : "entries"} remaining.`);
}

export async function prd(args: string[]): Promise<void> {
  const subcommand = args[0];

  switch (subcommand) {
    case "add":
      await add();
      break;
    case "list":
      list();
      break;
    case "status":
      status();
      break;
    case "toggle":
      toggle(args.slice(1));
      break;
    case "clean":
      clean();
      break;
    default:
      console.error("Usage: ralph prd <add|list|status|toggle|clean>");
      console.error("\nSubcommands:");
      console.error("  add              Add a new PRD entry");
      console.error("  list             List all PRD entries");
      console.error("  status           Show completion status");
      console.error("  toggle <n> ...   Toggle passes status for entry n (accepts multiple)");
      console.error("  toggle --all     Toggle all PRD entries");
      console.error("  clean            Remove all passing entries from the PRD");
      process.exit(1);
  }
}
