import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it, vi } from "vitest";

const fileProbe = vi.hoisted(() => ({
  closedDeniedDescriptors: new Set<number>(),
  deniedDescriptors: new Set<number>(),
  deniedTargetName: "unreadable-target.md",
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();

  return {
    ...actual,
    closeSync(descriptor: number) {
      if (fileProbe.deniedDescriptors.has(descriptor)) {
        fileProbe.closedDeniedDescriptors.add(descriptor);
      }
      return actual.closeSync(descriptor);
    },
    openSync(path: Parameters<typeof actual.openSync>[0], flags: string | number, mode?: string | number) {
      const descriptor = Reflect.apply(
        actual.openSync,
        actual,
        mode === undefined ? [path, flags] : [path, flags, mode],
      ) as number;
      if (String(path).endsWith(fileProbe.deniedTargetName)) {
        fileProbe.deniedDescriptors.add(descriptor);
      }
      return descriptor;
    },
    readFileSync(path: Parameters<typeof actual.readFileSync>[0], options?: unknown) {
      const deniedByDescriptor = typeof path === "number"
        && fileProbe.deniedDescriptors.has(path);
      const deniedByPath = typeof path !== "number"
        && String(path).endsWith(fileProbe.deniedTargetName);

      if (deniedByDescriptor || deniedByPath) {
        const error = new Error("EACCES: platform-specific permission failure") as NodeJS.ErrnoException;
        error.code = "EACCES";
        throw error;
      }

      return Reflect.apply(
        actual.readFileSync,
        actual,
        options === undefined ? [path] : [path, options],
      ) as Buffer | string;
    },
  };
});

import { checkMarkdownLinks } from "../scripts/check-markdown-links.mjs";

const temporaryDirectories: string[] = [];

function createProject(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "startup-zone-markdown-"));
  temporaryDirectories.push(root);

  for (const [relativePath, contents] of Object.entries(files)) {
    const path = join(root, relativePath);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents, "utf8");
  }

  return root;
}

afterEach(() => {
  fileProbe.closedDeniedDescriptors.clear();
  fileProbe.deniedDescriptors.clear();

  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("Markdown link checker", () => {
  it("recognizes HTML-decorated headings and their duplicate GitHub anchors", () => {
    const root = createProject({
      "README.md": [
        "[First release](docs/releases.md#release-notes)",
        "[Second release](docs/releases.md#release-notes-1)",
      ].join("\n"),
      "docs/releases.md": [
        "# Release <span title=\"alpha > beta\">Notes</span>",
        "# Release <span title=\"alpha > beta\">Notes</span>",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("ignores apostrophes inside HTML comments when generating anchors", () => {
    const root = createProject({
      "README.md": "[Release notes](docs/releases.md#release-notes)",
      "docs/releases.md": "# Release <!-- don't expose --> Notes",
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("accepts valid local files, images, and same-file anchors", () => {
    const root = createProject({
      "README.md": [
        "# Overview",
        "[Local section](#overview)",
        "[Guide](docs/guide.md#setup)",
        "![Diagram](assets/diagram.svg)",
      ].join("\n"),
      "assets/diagram.svg": "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>",
      "docs/guide.md": "# Setup\n\n[Back](../README.md#overview)",
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("returns normalized friendly failures for missing and unreadable targets", () => {
    const root = createProject({
      "README.md": [
        "[Missing](docs/missing.md)",
        "[Unreadable](assets/unreadable-target.md#private)",
      ].join("\n"),
      "assets/unreadable-target.md": "# Private",
    });

    const result = checkMarkdownLinks(root);

    expect(result).toEqual({
      checkedFileCount: 1,
      failures: [
        "README.md: missing target docs/missing.md",
        "README.md: unreadable target assets/unreadable-target.md#private",
      ],
    });
    expect(JSON.stringify(result)).not.toContain("EACCES");
    expect(fileProbe.deniedDescriptors.size).toBe(1);
    expect(fileProbe.closedDeniedDescriptors).toEqual(fileProbe.deniedDescriptors);
  });

  it("can be imported without running the CLI", () => {
    const checkerUrl = pathToFileURL(join(process.cwd(), "scripts", "check-markdown-links.mjs"));
    const child = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `const checker = await import(${JSON.stringify(checkerUrl.href)}); process.stdout.write(typeof checker.checkMarkdownLinks);`,
      ],
      { encoding: "utf8" },
    );

    expect(child.status).toBe(0);
    expect(child.stderr).toBe("");
    expect(child.stdout).toBe("function");
  });
});
