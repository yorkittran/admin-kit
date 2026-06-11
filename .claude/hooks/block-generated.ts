// PreToolUse guard: block Edit/Write on generated files.
const input = await new Response(Bun.stdin.stream()).json();
const file: string = input?.tool_input?.file_path ?? "";

const GENERATED = [
  /routeTree\.gen\.ts$/,
  /apps\/web\/src\/paraglide\//,
  /apps\/server\/drizzle\/meta\//,
];

if (GENERATED.some((re) => re.test(file))) {
  console.error(`${file}: generated — run generator`);
  process.exit(2);
}
