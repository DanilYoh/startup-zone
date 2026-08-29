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
  nextTargetGeneration: 1,
  openedTargetName: "opened-target.md",
  targetEvents: [] as Array<{
    generation: number | null;
    operation: "open" | "fstat" | "descriptor-read" | "path-read" | "close";
  }>,
  targetGenerationByDescriptor: new Map<number, number>(),
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();

  return {
    ...actual,
    closeSync(descriptor: number) {
      if (fileProbe.deniedDescriptors.has(descriptor)) {
        fileProbe.closedDeniedDescriptors.add(descriptor);
      }

      const generation = fileProbe.targetGenerationByDescriptor.get(descriptor);
      if (generation !== undefined) {
        fileProbe.targetEvents.push({ generation, operation: "close" });
      }

      try {
        return actual.closeSync(descriptor);
      } finally {
        fileProbe.targetGenerationByDescriptor.delete(descriptor);
      }
    },
    fstatSync(descriptor: number, options?: unknown) {
      const generation = fileProbe.targetGenerationByDescriptor.get(descriptor);
      if (generation !== undefined) {
        fileProbe.targetEvents.push({ generation, operation: "fstat" });
      }

      return Reflect.apply(
        actual.fstatSync,
        actual,
        options === undefined ? [descriptor] : [descriptor, options],
      ) as ReturnType<typeof actual.fstatSync>;
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
      if (String(path).endsWith(fileProbe.openedTargetName)) {
        const generation = fileProbe.nextTargetGeneration;
        fileProbe.nextTargetGeneration += 1;
        fileProbe.targetGenerationByDescriptor.set(descriptor, generation);
        fileProbe.targetEvents.push({ generation, operation: "open" });
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

      if (typeof path === "number") {
        const generation = fileProbe.targetGenerationByDescriptor.get(path);
        if (generation !== undefined) {
          fileProbe.targetEvents.push({ generation, operation: "descriptor-read" });
        }
      }

      if (
        typeof path !== "number"
        && String(path).endsWith(fileProbe.openedTargetName)
      ) {
        fileProbe.targetEvents.push({ generation: null, operation: "path-read" });
        return "# Replacement Anchor";
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
  fileProbe.nextTargetGeneration = 1;
  fileProbe.targetEvents.length = 0;
  fileProbe.targetGenerationByDescriptor.clear();

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

  it("keeps malformed HTML tag candidates in heading anchors", () => {
    const root = createProject({
      "README.md": [
        "[Malformed attribute](docs/literals.md#alpha-a-hrefhi-beta)",
        "[Attributed closing tag](docs/literals.md#gamma-a-hreffoo-delta)",
      ].join("\n"),
      "docs/literals.md": [
        "# Alpha <a h*#ref=\"hi\"> Beta",
        "# Gamma </a href=\"foo\"> Delta",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("classifies nested HTML inside rejected tag candidates", () => {
    const root = createProject({
      "README.md": [
        "[Invalid outer tag](docs/literals.md#alpha-a-titleoops-beta)",
        "[Unterminated outer tag](docs/literals.md#gamma-a-title)",
      ].join("\n"),
      "docs/literals.md": [
        "# Alpha <a title=\"<b>\"oops> Beta",
        "# Gamma <a title=\"<b>",
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

  it("uses the exact CDATA terminator when generating anchors", () => {
    const root = createProject({
      "README.md": "[Release notes](docs/releases.md#release-notes)",
      "docs/releases.md": "# Release <![CDATA[don't > expose]]> Notes",
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("preserves raw HTML-looking text inside code span delimiter runs", () => {
    const root = createProject({
      "README.md": [
        "[Single delimiter](docs/literals.md#show-span)",
        "[Double delimiter](docs/literals.md#show-spanvaluespan)",
      ].join("\n"),
      "docs/literals.md": [
        "# Show `<span>`",
        "# Show ``<span>`value</span>``",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("preserves backslash-escaped angle text in heading anchors", () => {
    const root = createProject({
      "README.md": "[Escaped angle text](docs/literals.md#show-span)",
      "docs/literals.md": "# Show \\<span\\>",
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("keeps autolink and literal angle text in heading anchors", () => {
    const root = createProject({
      "README.md": [
        "[URL autolink](docs/literals.md#visit-httpsexamplecom)",
        "[Literal angle text](docs/literals.md#version-33-beta)",
      ].join("\n"),
      "docs/literals.md": [
        "# Visit <https://example.com>",
        "# Version <33> Beta",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("treats URI and email autolinks as opaque heading text", () => {
    const root = createProject({
      "README.md": [
        "[URI autolink](docs/literals.md#a-ab-c)",
        "[Leaked URI markup](docs/literals.md#a-ab-b-c)",
        "[Email autolink](docs/literals.md#email-xyexamplecom-c)",
        "[Leaked email markup](docs/literals.md#email-xyexamplecom-b-c)",
      ].join("\n"),
      "docs/literals.md": [
        "# A <ab:`> <b> ` C",
        "# Email <x`y@example.com> <b> ` C",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [
        "README.md: missing anchor #a-ab-b-c in docs/literals.md",
        "README.md: missing anchor #email-xyexamplecom-b-c in docs/literals.md",
      ],
    });
  });

  it("uses link and image labels without their destinations", () => {
    const root = createProject({
      "README.md": [
        "[Link label](docs/page.md#docs)",
        "[Leaked link destination](docs/page.md#docstarget)",
        "[Image label](docs/page.md#diagram)",
        "[Leaked image destination](docs/page.md#diagramassetsdiagramsvg)",
        "[Title-only link](docs/page.md#guide-v2)",
        "[Leaked link title](docs/page.md#guide-v2-my-title)",
      ].join("\n"),
      "docs/page.md": [
        "# Target",
        "# [Docs](<#target>)",
        "# ![Diagram](<assets/diagram.svg>)",
        "# [Guide [v2]]( \"my title\")",
      ].join("\n"),
      "docs/assets/diagram.svg": "<svg></svg>",
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [
        "README.md: missing anchor #docstarget in docs/page.md",
        "README.md: missing anchor #diagramassetsdiagramsvg in docs/page.md",
        "README.md: missing anchor #guide-v2-my-title in docs/page.md",
      ],
    });
  });

  it("deactivates outer links around resolved reference links", () => {
    const root = createProject({
      "README.md": [
        "[Full](docs/references.md#outer-fulltarget)",
        "[Collapsed](docs/references.md#outer-collapsedtarget)",
        "[Shortcut](docs/references.md#outer-shortcuttarget)",
        "[Normalized](docs/references.md#outer-normalizedtarget)",
        "[Empty destination](docs/references.md#outer-emptytarget)",
        "[Block quote](docs/references.md#outer-quotedtarget)",
        "[List](docs/references.md#outer-listedtarget)",
        "[Unicode fold](docs/references.md#outer-sharp-starget)",
        "[Unresolved](docs/references.md#outer-unresolvedmissing)",
        "[Dotless](docs/references.md#outer-ascii-ii)",
      ].join("\n"),
      "docs/references.md": [
        "# [Outer [Full][full-reference]](target)",
        "# [Outer [Collapsed][]](target)",
        "# [Outer [Shortcut]](target)",
        "# [Outer [Normalized][  MIXED   label ]](target)",
        "# [Outer [Empty][empty]](target)",
        "# [Outer [Quoted][quoted]](target)",
        "# [Outer [Listed][listed]](target)",
        "# [Outer [Sharp S][ẞ]](target)",
        "# [Outer [Unresolved][missing]](target)",
        "# [Outer [ASCII I][I]](target)",
        "",
        "[full-reference]: /full",
        "[collapsed]: /collapsed",
        "[shortcut]: /shortcut",
        "[mixed label]: /normalized",
        "[empty]: <>",
        "[ı]: /dotless",
        "[SS]: /sharp-s",
        "> [quoted]: /quoted",
        "- [listed]: /listed",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("ignores reference-looking lines that are not CommonMark definitions", () => {
    const root = createProject({
      "README.md": [
        "[Fenced](docs/references.md#outer-fencedfake)",
        "[Indented](docs/references.md#outer-indentedindented)",
        "[Paragraph](docs/references.md#outer-paragraphparagraph)",
      ].join("\n"),
      "docs/references.md": [
        "# [Outer [Fenced][fake]](target)",
        "# [Outer [Indented][indented]](target)",
        "# [Outer [Paragraph][paragraph]](target)",
        "",
        "```md",
        "[fake]: /not-a-definition",
        "```",
        "",
        "    [indented]: /not-a-definition",
        "",
        "paragraph text",
        "[paragraph]: /not-a-definition",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("treats escaped backticks inside code spans as delimiters", () => {
    const root = createProject({
      "README.md": [
        "[Rendered anchor](docs/literals.md#a-x-y-c)",
        "[Leaked HTML tag](docs/literals.md#a-x-b-y-c)",
      ].join("\n"),
      "docs/literals.md": "# A `x\\` <b> y` C",
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [
        "README.md: missing anchor #a-x-b-y-c in docs/literals.md",
      ],
    });
  });

  it("decodes heading entities outside code spans", () => {
    const root = createProject({
      "README.md": [
        "[Numeric entity](docs/entities.md#a)",
        "[Named entity](docs/entities.md#á)",
        "[Code entity](docs/entities.md#x41)",
      ].join("\n"),
      "docs/entities.md": [
        "# &#x41;",
        "# &Aacute;",
        "# `&#x41;`",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("rejects unbalanced and over-nested reference destinations", () => {
    const nestedDestination = `${"(".repeat(33)}value${")".repeat(33)}`;
    const root = createProject({
      "README.md": [
        "[Unbalanced](docs/references.md#outer-unbalancedunbalanced)",
        "[Over-nested](docs/references.md#outer-over-nestedover-nested)",
      ].join("\n"),
      "docs/references.md": [
        "# [Outer [Unbalanced][unbalanced]](target)",
        "# [Outer [Over-nested][over-nested]](target)",
        "",
        "[unbalanced]: /url)",
        `[over-nested]: /url${nestedDestination}`,
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("keeps references inside invalid fence closers and padded list code unresolved", () => {
    const root = createProject({
      "README.md": [
        "[Fenced](docs/fenced.md#outer-fencedfake)",
        "[List code](docs/list.md#outer-list-codelisted)",
      ].join("\n"),
      "docs/fenced.md": [
        "# [Outer [Fenced][fake]](target)",
        "",
        "```md",
        "```still-code",
        "[fake]: /not-a-definition",
        "```",
      ].join("\n"),
      "docs/list.md": [
        "# [Outer [List code][listed]](target)",
        "",
        "-     [listed]: /not-a-definition",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 3,
      failures: [],
    });
  });

  it("ends reference-definition paragraphs at thematic breaks", () => {
    const root = createProject({
      "README.md": "[Thematic break](docs/references.md#outer-thematictarget)",
      "docs/references.md": [
        "# [Outer [Thematic][reference]](target)",
        "",
        "***",
        "[reference]: /url",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("accepts multiline reference titles without accepting blank lines", () => {
    const root = createProject({
      "README.md": [
        "[Multiline title](docs/references.md#outer-multitarget)",
        "[Blank title](docs/references.md#outer-blankblank)",
      ].join("\n"),
      "docs/references.md": [
        "# [Outer [Multi][multi]](target)",
        "# [Outer [Blank][blank]](target)",
        "",
        "[multi]: /url '",
        "title",
        "'",
        "",
        "[blank]: /url '",
        "title",
        "",
        "'",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("keeps destination-only definitions when next-line titles are invalid", () => {
    const root = createProject({
      "README.md": [
        "[Next-line title](docs/references.md#outer-nexttarget)",
        "[Same-line title](docs/references.md#outer-samesame)",
      ].join("\n"),
      "docs/references.md": [
        "# [Outer [Next][next]](target)",
        "# [Outer [Same][same]](target)",
        "",
        "[next]: /url",
        "\"title\" ok",
        "",
        "[same]: /url \"title\" ok",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("applies ordered-list interruption rules before resolving references", () => {
    const root = createProject({
      "README.md": [
        "[Continued paragraph](docs/references.md#outer-continuedcontinued)",
        "[Interrupting list](docs/references.md#outer-listtarget)",
      ].join("\n"),
      "docs/references.md": [
        "# [Outer [Continued][continued]](target)",
        "# [Outer [List][listed]](target)",
        "",
        "paragraph",
        "2. [continued]: /not-a-definition",
        "",
        "paragraph",
        "1. [listed]: /definition",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("computes list padding with tab-stop columns", () => {
    const root = createProject({
      "README.md": [
        "[Indented code](docs/references.md#outer-tabbedtabbed)",
        "[List reference](docs/references.md#outer-validtarget)",
      ].join("\n"),
      "docs/references.md": [
        "# [Outer [Tabbed][tabbed]](target)",
        "# [Outer [Valid][valid]](target)",
        "",
        "-\t\t[tabbed]: /not-a-definition",
        "-\t[valid]: /definition",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("keeps lazy container continuations in their open paragraphs", () => {
    const root = createProject({
      "README.md": [
        "[List continuation](docs/references.md#outer-list-lazylist-lazy)",
        "[Quote continuation](docs/references.md#outer-quote-lazyquote-lazy)",
        "[After containers](docs/references.md#outer-aftertarget)",
      ].join("\n"),
      "docs/references.md": [
        "# [Outer [List lazy][list-lazy]](target)",
        "# [Outer [Quote lazy][quote-lazy]](target)",
        "# [Outer [After][after]](target)",
        "",
        "- paragraph",
        "[list-lazy]: /not-a-definition",
        "",
        "> paragraph",
        "[quote-lazy]: /not-a-definition",
        "",
        "[after]: /definition",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("does not open backtick fences with backticks in their info strings", () => {
    const root = createProject({
      "README.md": "[Reference](docs/references.md#outer-fencetarget)",
      "docs/references.md": [
        "# [Outer [Fence][reference]](target)",
        "",
        "``` `not-a-fence`",
        "",
        "[reference]: /url",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("recognizes references after explicitly terminated HTML blocks", () => {
    const root = createProject({
      "README.md": [
        "[Script block](docs/references.md#outer-scripttarget)",
        "[Comment block](docs/references.md#outer-commenttarget)",
      ].join("\n"),
      "docs/references.md": [
        "# [Outer [Script][script]](target)",
        "# [Outer [Comment][comment]](target)",
        "",
        "<script>",
        "content",
        "</script>",
        "[script]: /definition",
        "",
        "<!--",
        "content",
        "-->",
        "[comment]: /definition",
      ].join("\n"),
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 2,
      failures: [],
    });
  });

  it("resolves deeply nested container references in bounded time", () => {
    const root = createProject({
      "README.md": "[Deep reference](docs/references.md#outer-deepdeep)",
      "docs/references.md": [
        "# [Outer [Deep][deep]](target)",
        "",
        `${"> ".repeat(100_000)}paragraph`,
        "[deep]: /not-a-definition",
      ].join("\n"),
    });
    const checkerUrl = pathToFileURL(join(process.cwd(), "scripts", "check-markdown-links.mjs"));
    const child = spawnSync(
      process.execPath,
      [
        "--max-old-space-size=64",
        "--input-type=module",
        "--eval",
        [
          `const { checkMarkdownLinks } = await import(${JSON.stringify(checkerUrl.href)});`,
          `const result = checkMarkdownLinks(${JSON.stringify(root)});`,
          "process.stdout.write(JSON.stringify(result));",
        ].join("\n"),
      ],
      { encoding: "utf8", timeout: 3_000 },
    );

    expect(child.signal, child.stderr).toBeNull();
    expect(child.status, child.stderr).toBe(0);
    expect(child.stdout).toBe('{"checkedFileCount":2,"failures":[]}');
  });

  it.each([
    ["plain", "a".repeat(1_000_000)],
    ["HTML-decorated", `${"a".repeat(500_000)}<span>${"b".repeat(500_000)}`],
  ])("parses a large %s heading with bounded heap", (_kind, heading) => {
    const root = createProject({
      "README.md": "[Probe](docs/large.md#missing)",
      "docs/large.md": `# ${heading}`,
    });
    const checkerUrl = pathToFileURL(join(process.cwd(), "scripts", "check-markdown-links.mjs"));
    const child = spawnSync(
      process.execPath,
      [
        "--max-old-space-size=64",
        "--input-type=module",
        "--eval",
        [
          `const { checkMarkdownLinks } = await import(${JSON.stringify(checkerUrl.href)});`,
          `const result = checkMarkdownLinks(${JSON.stringify(root)});`,
          "process.stdout.write(JSON.stringify({",
          "  checkedFileCount: result.checkedFileCount,",
          "  failureCount: result.failures.length,",
          "}));",
        ].join("\n"),
      ],
      { encoding: "utf8", timeout: 20_000 },
    );

    expect(child.signal, child.stderr).toBeNull();
    expect(child.status, child.stderr).toBe(0);
    expect(child.stdout).toBe('{"checkedFileCount":2,"failureCount":1}');
  });

  it("groups backtick delimiters after consuming escapes", () => {
    const root = createProject({
      "README.md": [
        "[Escaped opening run](docs/literals.md#show-span)",
        "[Escaped closing run](docs/literals.md#show-)",
      ].join("\n"),
      "docs/literals.md": [
        "# Show \\```<span>``",
        "# Show \\```<span>\\```",
      ].join("\n"),
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

  it("validates target anchors through the opened descriptor", () => {
    const root = createProject({
      "README.md": "[Opened target](targets/opened-target.md#opened-anchor)",
      "targets/opened-target.md": "# Opened Anchor",
    });

    expect(checkMarkdownLinks(root)).toEqual({
      checkedFileCount: 1,
      failures: [],
    });
    expect(fileProbe.targetEvents).toEqual([
      { generation: 1, operation: "open" },
      { generation: 1, operation: "fstat" },
      { generation: 1, operation: "descriptor-read" },
      { generation: 1, operation: "close" },
    ]);
    expect(fileProbe.targetGenerationByDescriptor.size).toBe(0);
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
