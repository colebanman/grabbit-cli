#!/usr/bin/env node
import { createRequire } from "module";
import { program } from "commander";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version?: string };

program
  .name("grabbit")
  .description("Convert browser interactions into API workflows")
  .version(pkg.version ?? "0.0.0");

program
  .command("auth")
  .description("Authenticate with Grabbit")
  .action(async () => {
    const { default: auth } = await import("./commands/auth.js");
    await auth();
  });

program
  .command("validate")
  .description("Check authentication status")
  .action(async () => {
    const { default: validate } = await import("./commands/validate.js");
    await validate();
  });

program
  .command("browse")
  .description("Browser automation (wraps grabbit-browse)")
  .argument("<command...>", "Browser command and arguments")
  .allowUnknownOption()
  .action(async (args: string[]) => {
    const { default: browse } = await import("./commands/browse.js");
    await browse(args);
  });

program
  .command("save")
  .description("Submit HAR and prompt to generate workflow")
  .argument("<prompt...>", "Description of the workflow to generate")
  .option("-m, --model <model>", "Model to use for generation")
  .option("-s, --session <name>", "Browser session name")
  .option(
    "--step <text>",
    "Optional step hint to send with the task (repeatable)",
    (value: string, prev: string[] = []) => [...prev, value],
    []
  )
  .action(async (prompt: string[], options: { model?: string; session?: string; step?: string[] }) => {
    const { default: save } = await import("./commands/save.js");
    await save(prompt, options);
  });

program
  .command("check")
  .description("Check task status")
  .argument("<taskId>", "Task ID to check")
  .action(async (taskId: string) => {
    const { default: check } = await import("./commands/check.js");
    await check(taskId);
  });

const skill = program
  .command("skill")
  .description("Install Grabbit skill for AI agents");

skill.action(async () => {
  const { default: installSkill } = await import("./commands/skill-install.js");
  await installSkill();
});

skill
  .command("install")
  .description("Install Grabbit skill via skills registry")
  .action(async () => {
    const { default: installSkill } = await import("./commands/skill-install.js");
    await installSkill();
  });

program
  .command("add")
  .description("Add a workflow as a skill")
  .argument("<workflow-id>", "Workflow ID to add as skill")
  .action(async (workflowId: string) => {
    const { default: add } = await import("./commands/add.js");
    await add(workflowId);
  });

program
  .command("workflows")
  .description("List saved workflows")
  .action(async () => {
    const { default: workflowsList } = await import("./commands/workflows.js");
    await workflowsList();
  });

const keys = program.command("keys").description("Manage API keys");

keys
  .command("list")
  .description("List your API keys")
  .action(async () => {
    const { listKeys } = await import("./commands/keys.js");
    await listKeys();
  });

keys
  .command("create")
  .description("Create a new API key")
  .argument("<name>", "Name for the new key")
  .action(async (name: string) => {
    const { createKey } = await import("./commands/keys.js");
    await createKey(name);
  });

keys
  .command("show")
  .description("Show the current API key from local config")
  .action(async () => {
    const { showKey } = await import("./commands/keys.js");
    await showKey();
  });

program.parse();
