import { parse } from "https://deno.land/std@0.200.0/flags/mod.ts";
import type { Args } from "https://deno.land/std@0.200.0/flags/mod.ts";
const kv = await Deno.openKv("/tmp/kv.db");

const token = Deno.env.get("GITHUB_TOKEN");
if (!token) {
  throw new Error("GITHUB_TOKEN is not set.");
}

const getter = async (key: string, question: string): Promise<string> => {
  try {
    const value = (await kv.get([key])).value as string;
    if (!value) {
      const Answer = prompt(question) || '';
      await kv.set([key], Answer);
      return Answer;
    } else {
      return value;
    }
  } catch (error) {
    console.error("Error fetching from kv store: ", error);
    throw error;
  }
}

export const getOwner = () => getter("owner", "Whos the owner of the repository?");

export const getRepo = () => getter("repo", "Whats the repository name?");

export const getWorkflowId = () => getter("workflow_id", "Whats the workflow id?");

export const getRef = () => getter("ref", "Whats the branch or tag?");

export const getInputs = () => getter("inputs", "Whats the inputs for the workflow?");

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
  console.log(helpText);
};

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
  const owner = await getOwner();
  const repo = await getRepo();
  const workflow_id = await getWorkflowId();
  const ref = await getRef();
  const inputs = await getInputs();
  await dispatchWorkflow({
    owner,
    repo,
    workflow_id,
    ref,
    inputs: JSON.parse(inputs),
  });
  Deno.exit(0);
}

Deno.exit(0);
