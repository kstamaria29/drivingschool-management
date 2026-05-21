import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migrationDir = join(root, "supabase", "migrations");
const studentApi = readFileSync(join(root, "src", "features", "students", "api.ts"), "utf8");
const migrations = readdirSync(migrationDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => ({
    file,
    sql: readFileSync(join(migrationDir, file), "utf8"),
  }));

const latestCascadeMigration = migrations.find(({ file, sql }) => {
  return file.includes("student_delete") && /on delete cascade/i.test(sql);
});

const apiTables = [
  "map_annotations",
  "map_pins",
  "student_reminders",
  "lessons",
  "student_sessions",
  "assessments",
];

const migrationTables = [
  "lessons",
  "assessments",
  "student_sessions",
  "map_pins",
  "map_annotations",
];

const failures = [];

if (!latestCascadeMigration) {
  failures.push("missing student delete cascade migration");
}

for (const table of apiTables) {
  if (!studentApi.includes(`.from("${table}")`)) {
    failures.push(`student delete API does not delete ${table}`);
  }
}

if (latestCascadeMigration) {
  for (const table of migrationTables) {
    const pattern = new RegExp(
      `alter table public\\.${table}[\\s\\S]+?references public\\.students\\(id\\)[\\s\\S]+?on delete cascade`,
      "i",
    );
    if (!pattern.test(latestCascadeMigration.sql)) {
      failures.push(`cascade migration does not cascade ${table}.student_id`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Student delete cascade verification failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("Student delete cascade verification passed.");
