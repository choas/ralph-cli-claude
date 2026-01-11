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

export async function promptMultiSelect(message: string, options: string[]): Promise<string[]> {
  console.log(`\n${message}`);
  options.forEach((opt, i) => {
    console.log(`  ${i + 1}. ${opt}`);
  });
  console.log(`  ${options.length + 1}. [Add custom technology]`);
  console.log(`  0. [Done selecting]`);

  const prompt = createPrompt();
  const selected: string[] = [];
  const customTechs: string[] = [];

  console.log("\nEnter numbers one at a time (0 when done):");

  while (true) {
    const answer = await prompt.question("> ");
    const num = parseInt(answer.trim());

    if (num === 0) {
      prompt.close();
      return [...selected, ...customTechs];
    }

    if (num === options.length + 1) {
      const customName = await prompt.question("Enter custom technology name: ");
      if (customName.trim()) {
        customTechs.push(customName.trim());
        console.log(`Added: ${customName.trim()}`);
      }
      continue;
    }

    if (num >= 1 && num <= options.length) {
      const selectedOption = options[num - 1];
      if (!selected.includes(selectedOption)) {
        selected.push(selectedOption);
        console.log(`Selected: ${selectedOption}`);
      } else {
        console.log(`Already selected: ${selectedOption}`);
      }
    } else {
      console.log("Invalid selection.");
    }
  }
}
