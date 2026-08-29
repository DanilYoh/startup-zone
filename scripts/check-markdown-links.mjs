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

function isAsciiDigit(character) {
  return character >= "0" && character <= "9";
}

function isAsciiWhitespace(character) {
  return character === " "
    || character === "\t"
    || character === "\n"
    || character === "\r"
    || character === "\f";
}

function isAsciiPunctuation(character) {
  if (!character) return false;
  const code = character.charCodeAt(0);
  return (code >= 0x21 && code <= 0x2f)
    || (code >= 0x3a && code <= 0x40)
    || (code >= 0x5b && code <= 0x60)
    || (code >= 0x7b && code <= 0x7e);
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

function startsHtmlConstruct(value, index) {
  if (value.startsWith("<!--", index)
    || value.startsWith("<?", index)
    || value.startsWith("<![CDATA[", index)
    || (value.startsWith("<!", index) && isAsciiLetter(value[index + 2]))) {
    return true;
  }

  let cursor = index + 1;
  if (value[cursor] === "/") cursor += 1;
  if (!isAsciiLetter(value[cursor])) return false;

  cursor += 1;
  while (isAsciiLetter(value[cursor])
    || isAsciiDigit(value[cursor])
    || value[cursor] === "-") {
    cursor += 1;
  }

  return value[cursor] === ">"
    || (value[cursor] === "/" && value[cursor + 1] === ">")
    || isAsciiWhitespace(value[cursor]);
}

function backtickRunsByStart(value) {
  const runs = [];

  for (let index = 0; index < value.length;) {
    if (value[index] !== "`") {
      index += 1;
      continue;
    }

    const start = index;
    while (value[index] === "`") index += 1;
    runs.push({ start, end: index, length: index - start });
  }

  const nextByLength = new Map();
  const runsByStart = new Map();
  for (let index = runs.length - 1; index >= 0; index -= 1) {
    const run = runs[index];
    for (let start = run.start; start < run.end; start += 1) {
      const length = run.end - start;
      runsByStart.set(start, {
        start,
        end: run.end,
        length,
        closer: nextByLength.get(length),
      });
    }
    nextByLength.set(run.length, run);
  }

  return runsByStart;
}

function codeSpanText(value) {
  if (!value.startsWith(" ") || !value.endsWith(" ")) return value;
  for (const character of value) {
    if (character !== " ") return value.slice(1, -1);
  }
  return value;
}

function withoutHtmlTags(value) {
  let output = "";
  let pendingTag = "";
  let quote = "";
  let terminator = "";
  const backtickRuns = backtickRunsByStart(value);

  for (let index = 0; index < value.length;) {
    const character = value[index];
    if (pendingTag === "") {
      if (character === "\\" && isAsciiPunctuation(value[index + 1])) {
        output += value[index + 1];
        index += 2;
        continue;
      }

      const backtickRun = backtickRuns.get(index);
      if (backtickRun?.closer) {
        output += codeSpanText(
          value.slice(backtickRun.end, backtickRun.closer.start),
        );
        index = backtickRun.closer.end;
        continue;
      }

      if (backtickRun) {
        output += value.slice(backtickRun.start, backtickRun.end);
        index = backtickRun.end;
        continue;
      }

      if (character === "<" && startsHtmlConstruct(value, index)) {
        pendingTag = character;
      } else {
        output += character;
      }
      index += 1;
      continue;
    }

    pendingTag += character;
    index += 1;
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
