import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

const repositoryRoot = process.cwd();

function markdownFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return extname(entry.name).toLowerCase() === ".md" ? [path] : [];
  });
}

function githubHeadingAnchors(markdown) {
  const seen = new Map();
  const anchors = new Set();

  for (const line of markdown.split(/\r?\n/u)) {
    const match = /^(?: {0,3})#{1,6}\s+(.+?)\s*#*\s*$/u.exec(line);
    if (!match) continue;

    const base = match[1]
      .trim()
      .toLowerCase()
      .replace(/<[^>]*>/gu, "")
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

const rootMarkdownFiles = readdirSync(repositoryRoot, { withFileTypes: true })
  .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".md")
  .map((entry) => join(repositoryRoot, entry.name));
const files = [...rootMarkdownFiles, ...markdownFiles(join(repositoryRoot, "docs"))]
  .filter((path, index, all) => existsSync(path) && all.indexOf(path) === index);
const failures = [];

for (const file of files) {
  const markdown = readFileSync(file, "utf8");
  const links = markdown.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/gu);

  for (const link of links) {
    const rawDestination = link[1];
    if (/^(?:https?:|mailto:|tel:)/iu.test(rawDestination)) {
      if (/^https?:/iu.test(rawDestination)) {
        try {
          new URL(rawDestination.replace(/^<|>$/gu, ""));
        } catch {
          failures.push(`${relative(repositoryRoot, file)}: invalid URL ${rawDestination}`);
        }
      }
      continue;
    }

    const destination = parseDestination(rawDestination);
    if (destination.path.startsWith("/")) continue;

    const targetFile = destination.path
      ? resolve(dirname(file), destination.path)
      : file;

    if (!existsSync(targetFile) || !statSync(targetFile).isFile()) {
      failures.push(
        `${relative(repositoryRoot, file)}: missing target ${rawDestination}`,
      );
      continue;
    }

    if (destination.anchor && extname(targetFile).toLowerCase() === ".md") {
      const anchors = githubHeadingAnchors(readFileSync(targetFile, "utf8"));
      if (!anchors.has(destination.anchor.toLowerCase())) {
        failures.push(
          `${relative(repositoryRoot, file)}: missing anchor #${destination.anchor} in ${relative(repositoryRoot, targetFile)}`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`Broken Markdown links:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Checked local links and URL syntax in ${files.length} Markdown files.`);
}
