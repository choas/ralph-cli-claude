import { spawn } from "child_process";
import { checkFilesExist, loadPrompt, getPaths } from "../utils/config.js";

async function runIteration(prompt: string, paths: ReturnType<typeof getPaths>): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolve, reject) => {
    let output = "";

    const proc = spawn(
      "claude",
      [
        "--permission-mode", "acceptEdits",
        "--dangerously-skip-permissions",
        "-p",
        `@${paths.prd} @${paths.progress} ${prompt}`,
      ],
      {
        stdio: ["inherit", "pipe", "inherit"],
        shell: true,
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

  console.log(`Starting ${iterations} ralph iteration(s)...\n`);

  for (let i = 1; i <= iterations; i++) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Iteration ${i} of ${iterations}`);
    console.log(`${"=".repeat(50)}\n`);

    const { exitCode, output } = await runIteration(prompt, paths);

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

  console.log("\nRalph run finished.");
}
