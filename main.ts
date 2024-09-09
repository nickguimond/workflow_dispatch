import { parse } from "https://deno.land/std@0.200.0/flags/mod.ts";
import type { Args } from "https://deno.land/std@0.200.0/flags/mod.ts";

export const log = (val: unknown) => {
  console.log(val);
};
export const JSONlog = (val: unknown) => {
  console.log(JSON.stringify(val, null, 2));
};

export const parseArguments = (args: string[]): Args => {
  const booleanArgs = ["help", "workflow"];

  const alias = {
    help: "h",
    workflow: "w",
  };

  return parse(args, {
    alias,
    boolean: booleanArgs,
    stopEarly: false,
    "--": true,
  });
};
const helpText = `

  Usage: ai [OPTIONS...]
  -h, --help                Display this help and exit
  -s, --workflow            Dispatch a github action workflow

`;
export const printHelp = (): void => {
  log(helpText);
};


const token = Deno.env.get("GITHUB_TOKEN");

const getHeaders = (type: string = "application/vnd.github.v3+json") => {
  const headers = new Headers();
  headers.append("Authorization", `token ${token}`);
  headers.append("Accept", type);
  return headers;
};

interface DispatchWorkflow {
  owner: string;
  repo: string;
  workflow_id: string;
  ref: string;
  inputs: Record<string, string>;
}

export const dispatchWorkflow = async ({
  owner,
  repo,
  workflow_id,
  ref,
  inputs,
}: DispatchWorkflow) => {
  const path = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`;
  const data = await fetch(path, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ ref, inputs }),
  });
  return data;
};

const args = parseArguments(Deno.args);

if (args.help) {
  printHelp();
  Deno.exit(0);
}

if (args.workflow) {
  const owner = prompt(
    "Whos the owner of the repository?",
  ) || '';
  const repo = prompt(
    "Whats the repository name?",
  ) || '';
  const workflow_id = prompt(
    "Whats the workflow id?",
  ) || '';
  const ref = prompt(
    "Whats the branch or tag?",
  ) || '';
  const inputs = JSON.parse(
    prompt(
      "Whats the inputs for the workflow?",
    ) || '{}',
  );
  await dispatchWorkflow({
    owner,
    repo,
    workflow_id,
    ref,
    inputs
  });
  Deno.exit(0);
}

Deno.exit(0);
