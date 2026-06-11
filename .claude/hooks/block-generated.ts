// PreToolUse guard: block Edit/Write on generated files.
// Patterns must mirror the "Never edit generated files" rule in CLAUDE.md —
// update both if app directories are renamed.
const input = await new Response(Bun.stdin.stream()).json();
const file: string = input?.tool_input?.file_path ?? "";

const GENERATED: Array<[RegExp, string]> = [
  [/(^|\/)routeTree\.gen\.ts$/, "bun --cwd=apps/web run build (or bun dev)"],
  [/apps\/web\/src\/paraglide\//, "bun --cwd=apps/web run paraglide:compile"],
  [/apps\/server\/drizzle\/meta\//, "bun db:generate"],
];

const hit = GENERATED.find(([re]) => re.test(file));
if (hit) {
  console.error(`${file}: generated — run ${hit[1]}`);
  process.exit(2);
}
