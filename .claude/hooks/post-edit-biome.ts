// PostToolUse: format/fix the edited file with biome. Never blocks.
const input = await new Response(Bun.stdin.stream()).json();
const file: string = input?.tool_input?.file_path ?? "";

if (file && (await Bun.file(file).exists())) {
  Bun.spawnSync(["bunx", "biome", "check", "--write", file], {
    stdout: "ignore",
    stderr: "ignore",
  });
}
