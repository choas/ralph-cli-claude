#!/usr/bin/env node

import { help } from "./commands/help.js";
import { init } from "./commands/init.js";
import { once } from "./commands/once.js";
import { run } from "./commands/run.js";
import { prd } from "./commands/prd.js";
import { scripts } from "./commands/scripts.js";

const commands: Record<string, (args: string[]) => Promise<void> | void> = {
  help,
  init,
  once,
  run,
  prd,
  scripts,
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    help([]);
    process.exit(0);
  }

  const handler = commands[command];
  if (!handler) {
    console.error(`Unknown command: ${command}`);
    console.error(`Run 'ralph help' for usage information.`);
    process.exit(1);
  }

  try {
    await handler(args.slice(1));
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unexpected error occurred");
    }
    process.exit(1);
  }
}

main();
