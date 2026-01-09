import { spawn } from "child_process";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { checkFilesExist, loadPrompt, getPaths } from "../utils/config.js";

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

/**
 * Creates a filtered PRD file containing only incomplete items (passes: false).
 * Returns the path to the temp file, or null if all items pass.
 */
function createFilteredPrd(prdPath: string): { tempPath: string; hasIncomplete: boolean } {
  const content = readFileSync(prdPath, "utf-8");
  const items: PrdItem[] = JSON.parse(content);

  const incompleteItems = items.filter(item => item.passes === false);

  const tempPath = join(tmpdir(), `ralph-prd-filtered-${Date.now()}.json`);
  writeFileSync(tempPath, JSON.stringify(incompleteItems, null, 2));

  return {
    tempPath,
    hasIncomplete: incompleteItems.length > 0
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
  const iterations = parseInt(args[0]);

  if (!iterations || iterations < 1 || isNaN(iterations)) {
    console.error("Usage: ralph run <iterations>");
    console.error("  <iterations> must be a positive integer");
    process.exit(1);
  }

  checkFilesExist();

  const prompt = loadPrompt();
  const paths = getPaths();

  // Check if we're running in a sandboxed container environment
  const sandboxed = isRunningInContainer();

  console.log(`Starting ${iterations} ralph iteration(s)...\n`);
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
      const { tempPath, hasIncomplete } = createFilteredPrd(paths.prd);
      filteredPrdPath = tempPath;

      if (!hasIncomplete) {
        console.log("\n" + "=".repeat(50));
        console.log("PRD COMPLETE - All features already implemented!");
        console.log("=".repeat(50));
        break;
      }

      console.log(`Filtered PRD: sending only incomplete items to Claude\n`);

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

        // Try to send notification (optional)
        try {
          spawn("tt", ["notify", "Ralph: PRD Complete!"], { stdio: "ignore" });
        } catch {
          // tt notify not available, ignore
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
