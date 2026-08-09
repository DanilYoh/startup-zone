import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const command = process.platform === "win32" ? "cmd.exe" : "npx";
const argumentsForCommand =
  process.platform === "win32"
    ? ["/d", "/s", "/c", "npx supabase gen types typescript --local --schema public"]
    : ["supabase", "gen", "types", "typescript", "--local", "--schema", "public"];
const generated = spawnSync(
  command,
  argumentsForCommand,
  { encoding: "utf8" },
);

if (generated.status !== 0) {
  process.stderr.write(generated.stderr || "Supabase type generation failed.\n");
  process.exit(generated.status ?? 1);
}

const typesPath = fileURLToPath(new URL("../lib/supabase/types.ts", import.meta.url));
const normalize = (value) => value.replace(/\r\n/g, "\n").trimEnd();

if (normalize(generated.stdout) !== normalize(readFileSync(typesPath, "utf8"))) {
  process.stderr.write(
    "lib/supabase/types.ts does not match the local migrated schema. Run the documented type-generation command and commit the result.\n",
  );
  process.exit(1);
}

process.stdout.write("Database types match the local migrated schema.\n");
