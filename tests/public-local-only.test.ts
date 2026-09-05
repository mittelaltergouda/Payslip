import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();

const removedServerPersistencePaths = [
  "app/api",
  "lib/csrf-client.ts",
  "lib/csrf.ts",
  "lib/errors.ts",
  "lib/localOnlyApi.ts",
  "lib/prisma.ts",
  "prisma",
];

describe("public local-only deployment", () => {
  it.each(removedServerPersistencePaths)("does not ship %s", (relativePath) => {
    expect(existsSync(join(repositoryRoot, relativePath))).toBe(false);
  });

  it("does not depend on Prisma or expose database scripts", () => {
    const packageJson = JSON.parse(
      readFileSync(join(repositoryRoot, "package.json"), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(packageJson.dependencies?.["@prisma/client"]).toBeUndefined();
    expect(packageJson.devDependencies?.prisma).toBeUndefined();
    expect(Object.keys(packageJson.scripts ?? {})).not.toContain("prisma:generate");
    expect(Object.keys(packageJson.scripts ?? {})).not.toContain("prisma:push");
  });
});
