import * as readline from "readline";

export function createPrompt(): {
  question: (query: string) => Promise<string>;
  close: () => void;
} {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return {
    question: (query: string) =>
      new Promise((resolve) => {
        rl.question(query, (answer) => {
          resolve(answer);
        });
      }),
    close: () => rl.close(),
  };
}

export async function promptInput(message: string): Promise<string> {
  const prompt = createPrompt();
  const answer = await prompt.question(message);
  prompt.close();
  return answer.trim();
}

export async function promptSelect(message: string, options: string[]): Promise<string> {
  console.log(`\n${message}`);
  options.forEach((opt, i) => {
    console.log(`  ${i + 1}. ${opt}`);
  });

  const prompt = createPrompt();

  while (true) {
    const answer = await prompt.question("\nEnter number: ");
    const num = parseInt(answer.trim());
    if (num >= 1 && num <= options.length) {
      prompt.close();
      return options[num - 1];
    }
    console.log("Invalid selection.");
  }
}

export async function promptConfirm(message: string): Promise<boolean> {
  const prompt = createPrompt();

  while (true) {
    const answer = await prompt.question(`${message} (y/n): `);
    const normalized = answer.trim().toLowerCase();
    if (normalized === "y" || normalized === "yes") {
      prompt.close();
      return true;
    }
    if (normalized === "n" || normalized === "no") {
      prompt.close();
      return false;
    }
    console.log("Please enter y or n.");
  }
}
