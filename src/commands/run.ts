import { spawn } from "child_process";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { checkFilesExist, loadConfig, loadPrompt, getPaths } from "../utils/config.js";

/**
 * Detects if we're running inside a container (Docker or Podman).
 * This is used to determine whether to pass --dangerously-skip-permissions to claude.
 */
function isRunningInContainer(): boolean {
  // Check DEVCONTAINER env var (set by ralph docker setup)
  if (process.env.DEVCONTAINER === "true") {
    return true;
  }

  // Check for /.dockerenv file (Docker creates this)
  if (existsSync("/.dockerenv")) {
    return true;
  }

  // Check /proc/1/cgroup for container hints (works for Docker and Podman)
  try {
    const cgroup = readFileSync("/proc/1/cgroup", "utf-8");
    if (cgroup.includes("docker") || cgroup.includes("podman") || cgroup.includes("/lxc/") || cgroup.includes("containerd")) {
      return true;
    }
  } catch {
    // File doesn't exist or can't be read (not on Linux or not in container)
  }

  // Check for container environment variables set by various container runtimes
  if (process.env.container === "podman" || process.env.container === "docker") {
    return true;
  }

  return false;
}

interface PrdItem {
  category: string;
  description: string;
  steps: string[];
  passes: boolean;
}

const CATEGORIES = ["ui", "feature", "bugfix", "setup", "development", "testing", "docs"];

/**
 * Creates a filtered PRD file containing only incomplete items (passes: false).
 * Optionally filters by category if specified.
 * Returns the path to the temp file, or null if all items pass.
 */
function createFilteredPrd(prdPath: string, category?: string): { tempPath: string; hasIncomplete: boolean } {
  const content = readFileSync(prdPath, "utf-8");
  const items: PrdItem[] = JSON.parse(content);

  let filteredItems = items.filter(item => item.passes === false);

  // Apply category filter if specified
  if (category) {
    filteredItems = filteredItems.filter(item => item.category === category);
  }

  const tempPath = join(tmpdir(), `ralph-prd-filtered-${Date.now()}.json`);
  writeFileSync(tempPath, JSON.stringify(filteredItems, null, 2));

  return {
    tempPath,
    hasIncomplete: filteredItems.length > 0
  };
}

async function runIteration(prompt: string, paths: ReturnType<typeof getPaths>, sandboxed: boolean, filteredPrdPath: string): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolve, reject) => {
    let output = "";

    // Build claude arguments
    const claudeArgs = ["--permission-mode", "acceptEdits"];

    // Only add --dangerously-skip-permissions when running in a container
    if (sandboxed) {
      claudeArgs.push("--dangerously-skip-permissions");
    }

    // Use the filtered PRD (only incomplete items) for the prompt
    claudeArgs.push("-p", `@${filteredPrdPath} @${paths.progress} ${prompt}`);

    const proc = spawn(
      "claude",
      claudeArgs,
      {
        stdio: ["inherit", "pipe", "inherit"],
      }
    );

    proc.stdout.on("data", (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      process.stdout.write(chunk);
    });

    proc.on("close", (code) => {
      resolve({ exitCode: code ?? 0, output });
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start claude: ${err.message}`));
    });
  });
}

export async function run(args: string[]): Promise<void> {
  // Parse --category flag
  let category: string | undefined;
  const filteredArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--category" || args[i] === "-c") {
      if (i + 1 < args.length) {
        category = args[i + 1];
        i++; // Skip the category value
      } else {
        console.error("Error: --category requires a value");
        console.error(`Valid categories: ${CATEGORIES.join(", ")}`);
        process.exit(1);
      }
    } else {
      filteredArgs.push(args[i]);
    }
  }

  // Validate category if provided
  if (category && !CATEGORIES.includes(category)) {
    console.error(`Error: Invalid category "${category}"`);
    console.error(`Valid categories: ${CATEGORIES.join(", ")}`);
    process.exit(1);
  }

  const iterations = parseInt(filteredArgs[0]);

  if (!iterations || iterations < 1 || isNaN(iterations)) {
    console.error("Usage: ralph run <iterations> [--category <category>]");
    console.error("  <iterations> must be a positive integer");
    console.error(`  <category> must be one of: ${CATEGORIES.join(", ")}`);
    process.exit(1);
  }

  checkFilesExist();

  const config = loadConfig();
  const prompt = loadPrompt();
  const paths = getPaths();

  // Check if we're running in a sandboxed container environment
  const sandboxed = isRunningInContainer();

  console.log(`Starting ${iterations} ralph iteration(s)...`);
  if (category) {
    console.log(`Filtering PRD items by category: ${category}`);
  }
  console.log();
  if (sandboxed) {
    console.log("Detected container environment - running with --dangerously-skip-permissions\n");
  }

  // Track temp file for cleanup
  let filteredPrdPath: string | null = null;

  try {
    for (let i = 1; i <= iterations; i++) {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`Iteration ${i} of ${iterations}`);
      console.log(`${"=".repeat(50)}\n`);

      // Create a fresh filtered PRD for each iteration (in case items were completed)
      const { tempPath, hasIncomplete } = createFilteredPrd(paths.prd, category);
      filteredPrdPath = tempPath;

      if (!hasIncomplete) {
        console.log("\n" + "=".repeat(50));
        if (category) {
          console.log(`PRD COMPLETE - All "${category}" features already implemented!`);
        } else {
          console.log("PRD COMPLETE - All features already implemented!");
        }
        console.log("=".repeat(50));
        break;
      }

      const categoryMsg = category ? ` (category: ${category})` : "";
      console.log(`Filtered PRD: sending only incomplete items${categoryMsg} to Claude\n`);

      const { exitCode, output } = await runIteration(prompt, paths, sandboxed, filteredPrdPath);

      // Clean up temp file after each iteration
      try {
        unlinkSync(filteredPrdPath);
      } catch {
        // Ignore cleanup errors
      }
      filteredPrdPath = null;

      if (exitCode !== 0) {
        console.error(`\nClaude exited with code ${exitCode}`);
        console.log("Continuing to next iteration...");
      }

      // Check for completion signal
      if (output.includes("<promise>COMPLETE</promise>")) {
        console.log("\n" + "=".repeat(50));
        console.log("PRD COMPLETE - All features implemented!");
        console.log("=".repeat(50));

        // Send notification if configured
        if (config.notifyCommand) {
          const [cmd, ...cmdArgs] = config.notifyCommand.split(" ");
          const notifyProc = spawn(cmd, [...cmdArgs, "Ralph: PRD Complete!"], { stdio: "ignore" });
          notifyProc.on("error", () => {
            // Notification command not available, ignore
          });
        }

        break;
      }
    }
  } finally {
    // Clean up temp file if it still exists
    if (filteredPrdPath) {
      try {
        unlinkSync(filteredPrdPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  console.log("\nRalph run finished.");
}
