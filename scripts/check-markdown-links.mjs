import {
  closeSync,
  fstatSync,
  openSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function isMissingFileError(error) {
  return error instanceof Error
    && "code" in error
    && (error.code === "ENOENT" || error.code === "ENOTDIR");
}

function displayPath(repositoryRoot, path) {
  return relative(repositoryRoot, path).replaceAll("\\", "/");
}

function markdownFiles(directory, recursive = true) {
  let entries;

  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if (isMissingFileError(error)) return [];
    throw new Error(`Cannot read Markdown directory ${directory}`, { cause: error });
  }

  return entries.flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return recursive ? markdownFiles(path) : [];
    return entry.isFile() && extname(entry.name).toLowerCase() === ".md" ? [path] : [];
  });
}

function isAsciiLetter(character) {
  return (character >= "A" && character <= "Z")
    || (character >= "a" && character <= "z");
}

function specialHtmlTerminator(value) {
  if (value === "<!--") return "-->";
  if (value === "<?") return "?>";
  if (value === "<![CDATA[") return "]]>";
  if (value.length === 3 && value.startsWith("<!") && isAsciiLetter(value[2])) {
    return ">";
  }
  return "";
}

function withoutHtmlTags(value) {
  let output = "";
  let pendingTag = "";
  let quote = "";
  let terminator = "";

  for (const character of value) {
    if (pendingTag === "") {
      if (character === "<") {
        pendingTag = character;
      } else {
        output += character;
      }
      continue;
    }

    pendingTag += character;
    if (terminator !== "") {
      if (pendingTag.endsWith(terminator)) {
        pendingTag = "";
        terminator = "";
      }
      continue;
    }

    terminator = specialHtmlTerminator(pendingTag);
    if (terminator !== "") continue;

    if (quote !== "") {
      if (character === quote) quote = "";
    } else if (character === "\"" || character === "'") {
      quote = character;
    } else if (character === ">") {
      pendingTag = "";
    }
  }

  return output + pendingTag;
}

function githubHeadingAnchors(markdown) {
  const seen = new Map();
  const anchors = new Set();

  for (const line of markdown.split(/\r?\n/u)) {
    const match = /^(?: {0,3})#{1,6}\s+(.+?)\s*#*\s*$/u.exec(line);
    if (!match) continue;

    const base = withoutHtmlTags(match[1])
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/\s+/gu, "-");
    const duplicate = seen.get(base) ?? 0;
    seen.set(base, duplicate + 1);
    anchors.add(duplicate === 0 ? base : `${base}-${duplicate}`);
  }

  return anchors;
}

function parseDestination(rawDestination) {
  const destination = rawDestination.trim().replace(/^<|>$/gu, "");
  const target = destination.split(/\s+["']/u, 1)[0];
  const hashIndex = target.indexOf("#");

  return {
    path: decodeURIComponent(hashIndex === -1 ? target : target.slice(0, hashIndex)),
    anchor: decodeURIComponent(hashIndex === -1 ? "" : target.slice(hashIndex + 1)),
  };
}

function inspectRegularFile(path, readContents) {
  let descriptor;
  let result;

  try {
    descriptor = openSync(path, "r");
    if (!fstatSync(descriptor).isFile()) {
      result = { status: "missing" };
    } else {
      result = {
        status: "ok",
        contents: readContents ? readFileSync(descriptor, "utf8") : undefined,
      };
    }
  } catch (error) {
    result = { status: isMissingFileError(error) ? "missing" : "unreadable" };
  } finally {
    if (descriptor !== undefined) {
      try {
        closeSync(descriptor);
      } catch {
        result = { status: "unreadable" };
      }
    }
  }

  return result ?? { status: "unreadable" };
}

export function checkMarkdownLinks(repositoryRoot = process.cwd()) {
  const files = [...new Set([
    ...markdownFiles(repositoryRoot, false),
    ...markdownFiles(join(repositoryRoot, "docs")),
  ])];
  const failures = [];

  for (const file of files) {
    const source = inspectRegularFile(file, true);
    if (source.status !== "ok") {
      failures.push(`${displayPath(repositoryRoot, file)}: unreadable Markdown file`);
      continue;
    }

    const markdown = source.contents;
    const links = markdown.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/gu);

    for (const link of links) {
      const rawDestination = link[1];
      if (/^(?:https?:|mailto:|tel:)/iu.test(rawDestination)) {
        if (/^https?:/iu.test(rawDestination)) {
          try {
            new URL(rawDestination.replace(/^<|>$/gu, ""));
          } catch {
            failures.push(
              `${displayPath(repositoryRoot, file)}: invalid URL ${rawDestination}`,
            );
          }
        }
        continue;
      }

      let destination;
      try {
        destination = parseDestination(rawDestination);
      } catch {
        failures.push(
          `${displayPath(repositoryRoot, file)}: invalid destination ${rawDestination}`,
        );
        continue;
      }

      if (destination.path.startsWith("/")) continue;

      const targetFile = destination.path
        ? resolve(dirname(file), destination.path)
        : file;
      const needsMarkdownContents = destination.anchor
        && extname(targetFile).toLowerCase() === ".md";
      const target = targetFile === file
        ? { status: "ok", contents: markdown }
        : inspectRegularFile(targetFile, needsMarkdownContents);

      if (target.status === "missing") {
        failures.push(
          `${displayPath(repositoryRoot, file)}: missing target ${rawDestination}`,
        );
        continue;
      }
      if (target.status === "unreadable") {
        failures.push(
          `${displayPath(repositoryRoot, file)}: unreadable target ${rawDestination}`,
        );
        continue;
      }

      if (needsMarkdownContents) {
        const anchors = githubHeadingAnchors(target.contents);
        if (!anchors.has(destination.anchor.toLowerCase())) {
          failures.push(
            `${displayPath(repositoryRoot, file)}: missing anchor #${destination.anchor} in ${displayPath(repositoryRoot, targetFile)}`,
          );
        }
      }
    }
  }

  return { checkedFileCount: files.length, failures };
}

function runCli() {
  const result = checkMarkdownLinks();

  if (result.failures.length > 0) {
    console.error(
      `Broken Markdown links:\n${result.failures.map((failure) => `- ${failure}`).join("\n")}`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `Checked local links and URL syntax in ${result.checkedFileCount} Markdown files.`,
    );
  }
}

const entryPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryPath) runCli();
