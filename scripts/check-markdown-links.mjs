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

function isTagSpace(character) {
  return character === " " || character === "\t";
}

function isAsciiPunctuation(character) {
  if (!character) return false;
  const code = character.charCodeAt(0);
  return (code >= 0x21 && code <= 0x2f)
    || (code >= 0x3a && code <= 0x40)
    || (code >= 0x5b && code <= 0x60)
    || (code >= 0x7b && code <= 0x7e);
}

function isTagNameCharacter(character) {
  return isAsciiLetter(character)
    || isAsciiDigit(character)
    || character === "-";
}

function isAttributeNameStart(character) {
  return isAsciiLetter(character)
    || character === "_"
    || character === ":";
}

function isAttributeNameCharacter(character) {
  return isAttributeNameStart(character)
    || isAsciiDigit(character)
    || character === "."
    || character === "-";
}

function isUnquotedAttributeValueCharacter(character) {
  return !isTagSpace(character)
    && character !== "\""
    && character !== "'"
    && character !== "="
    && character !== "<"
    && character !== ">"
    && character !== "`";
}

function advanceHtmlTag(state, character) {
  if (state === "open-tag-name-start") {
    return isAsciiLetter(character) ? "open-tag-name" : "invalid";
  }
  if (state === "open-tag-name") {
    if (isTagNameCharacter(character)) return state;
    if (character === ">") return "complete";
    if (isTagSpace(character)) return "before-attribute-or-end";
    if (character === "/") return "expect-end";
    return "invalid";
  }
  if (state === "before-attribute-or-end") {
    if (isTagSpace(character)) return state;
    if (character === ">") return "complete";
    if (character === "/") return "expect-end";
    return isAttributeNameStart(character) ? "attribute-name" : "invalid";
  }
  if (state === "attribute-name") {
    if (isAttributeNameCharacter(character)) return state;
    if (character === "=") return "before-attribute-value";
    if (isTagSpace(character)) return "after-attribute-name";
    if (character === ">") return "complete";
    if (character === "/") return "expect-end";
    return "invalid";
  }
  if (state === "after-attribute-name") {
    if (isTagSpace(character)) return state;
    if (character === "=") return "before-attribute-value";
    if (character === ">") return "complete";
    if (character === "/") return "expect-end";
    return isAttributeNameStart(character) ? "attribute-name" : "invalid";
  }
  if (state === "before-attribute-value") {
    if (isTagSpace(character)) return state;
    if (character === "'") return "single-quoted-attribute-value";
    if (character === "\"") return "double-quoted-attribute-value";
    return isUnquotedAttributeValueCharacter(character)
      ? "unquoted-attribute-value"
      : "invalid";
  }
  if (state === "unquoted-attribute-value") {
    if (isTagSpace(character)) return "before-attribute-or-end";
    if (character === ">") return "complete";
    return isUnquotedAttributeValueCharacter(character) ? state : "invalid";
  }
  if (state === "single-quoted-attribute-value") {
    return character === "'" ? "after-quoted-attribute-value" : state;
  }
  if (state === "double-quoted-attribute-value") {
    return character === "\"" ? "after-quoted-attribute-value" : state;
  }
  if (state === "after-quoted-attribute-value") {
    if (isTagSpace(character)) return "before-attribute-or-end";
    if (character === ">") return "complete";
    if (character === "/") return "expect-end";
    return "invalid";
  }
  if (state === "expect-end") {
    return character === ">" ? "complete" : "invalid";
  }
  if (state === "closing-tag-name-start") {
    return isAsciiLetter(character) ? "closing-tag-name" : "invalid";
  }
  if (state === "closing-tag-name") {
    if (isTagNameCharacter(character)) return state;
    if (character === ">") return "complete";
    if (isTagSpace(character)) return "closing-tag-end";
    return "invalid";
  }
  if (state === "closing-tag-end") {
    if (isTagSpace(character)) return state;
    return character === ">" ? "complete" : "invalid";
  }
  return "invalid";
}

function nextDelimiterIndexes(value, delimiter) {
  const indexes = new Array(value.length + 1).fill(-1);
  let nextIndex = -1;

  for (let index = value.length - 1; index >= 0; index -= 1) {
    if (value.startsWith(delimiter, index)) nextIndex = index;
    indexes[index] = nextIndex;
  }

  return indexes;
}

function htmlTagEndsByState(value) {
  const states = [
    "open-tag-name-start",
    "open-tag-name",
    "before-attribute-or-end",
    "attribute-name",
    "after-attribute-name",
    "before-attribute-value",
    "unquoted-attribute-value",
    "single-quoted-attribute-value",
    "double-quoted-attribute-value",
    "after-quoted-attribute-value",
    "expect-end",
    "closing-tag-name-start",
    "closing-tag-name",
    "closing-tag-end",
  ];
  const endsByState = new Map(
    states.map((state) => [state, new Array(value.length + 1).fill(-1)]),
  );

  for (let index = value.length - 1; index >= 0; index -= 1) {
    for (const state of states) {
      const nextState = advanceHtmlTag(state, value[index]);
      let end = -1;
      if (nextState === "complete") {
        end = index + 1;
      } else if (nextState !== "invalid") {
        end = endsByState.get(nextState)[index + 1];
      }
      endsByState.get(state)[index] = end;
    }
  }

  return endsByState;
}

function htmlConstructEndsByStart(value) {
  const endsByStart = new Map();
  const tagEnds = htmlTagEndsByState(value);
  const nextCommentEnd = nextDelimiterIndexes(value, "-->");
  const nextProcessingEnd = nextDelimiterIndexes(value, "?>");
  const nextCdataEnd = nextDelimiterIndexes(value, "]]>");
  const nextDeclarationEnd = nextDelimiterIndexes(value, ">");

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== "<") continue;

    let end = -1;
    if (value.startsWith("<!-->", index)) {
      end = index + "<!-->".length;
    } else if (value.startsWith("<!--->", index)) {
      end = index + "<!--->".length;
    } else if (value.startsWith("<!--", index)) {
      const terminator = nextCommentEnd[index + "<!--".length];
      if (terminator !== -1) end = terminator + "-->".length;
    } else if (value.startsWith("<?", index)) {
      const terminator = nextProcessingEnd[index + "<?".length];
      if (terminator !== -1) end = terminator + "?>".length;
    } else if (value.startsWith("<![CDATA[", index)) {
      const terminator = nextCdataEnd[index + "<![CDATA[".length];
      if (terminator !== -1) end = terminator + "]]>".length;
    } else if (value.startsWith("<!", index) && isAsciiLetter(value[index + 2])) {
      const terminator = nextDeclarationEnd[index + 3];
      if (terminator !== -1) end = terminator + 1;
    } else if (isAsciiLetter(value[index + 1])) {
      end = tagEnds.get("open-tag-name-start")[index + 1];
    } else if (value[index + 1] === "/" && isAsciiLetter(value[index + 2])) {
      end = tagEnds.get("closing-tag-name-start")[index + 2];
    }

    if (end !== -1) endsByStart.set(index, end);
  }

  return endsByStart;
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

function isAsciiControlOrSpace(character) {
  if (!character) return false;
  const code = character.charCodeAt(0);
  return code <= 0x20 || code === 0x7f;
}

function isUriSchemeCharacter(character) {
  return isAsciiLetter(character)
    || isAsciiDigit(character)
    || character === "+"
    || character === "."
    || character === "-";
}

function isEmailLocalCharacter(character) {
  return isAsciiLetter(character)
    || isAsciiDigit(character)
    || ".!#$%&'*+/=?^_`{|}~-".includes(character);
}

function autolinkEndsByStart(value) {
  const endsByStart = new Map();
  let start = -1;
  let uriPossible = false;
  let uriSchemeLength = 0;
  let uriHasBody = false;
  let emailPossible = false;
  let emailState = "local";
  let emailLocalLength = 0;
  let emailDomainLabelLength = 0;
  let emailDomainEndsWithAlphanumeric = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (character === "<") {
      start = index;
      uriPossible = true;
      uriSchemeLength = 0;
      uriHasBody = false;
      emailPossible = true;
      emailState = "local";
      emailLocalLength = 0;
      emailDomainLabelLength = 0;
      emailDomainEndsWithAlphanumeric = false;
      continue;
    }

    if (start === -1) continue;

    if (character === ">") {
      const validUri = uriPossible && uriHasBody;
      const validEmail = emailPossible
        && emailState === "domain"
        && emailDomainEndsWithAlphanumeric;
      if (validUri || validEmail) endsByStart.set(start, index + 1);
      start = -1;
      continue;
    }

    if (uriPossible) {
      if (uriHasBody) {
        if (isAsciiControlOrSpace(character)) uriPossible = false;
      } else if (uriSchemeLength === 0) {
        if (isAsciiLetter(character)) {
          uriSchemeLength = 1;
        } else {
          uriPossible = false;
        }
      } else if (character === ":") {
        if (uriSchemeLength >= 2) {
          uriHasBody = true;
        } else {
          uriPossible = false;
        }
      } else if (
        uriSchemeLength < 32
        && isUriSchemeCharacter(character)
      ) {
        uriSchemeLength += 1;
      } else {
        uriPossible = false;
      }
    }

    if (emailPossible) {
      if (emailState === "local") {
        if (isEmailLocalCharacter(character)) {
          emailLocalLength += 1;
        } else if (character === "@" && emailLocalLength > 0) {
          emailState = "domain-start";
        } else {
          emailPossible = false;
        }
      } else if (emailState === "domain-start") {
        if (isAsciiLetter(character) || isAsciiDigit(character)) {
          emailState = "domain";
          emailDomainLabelLength = 1;
          emailDomainEndsWithAlphanumeric = true;
        } else {
          emailPossible = false;
        }
      } else if (isAsciiLetter(character) || isAsciiDigit(character)) {
        if (emailDomainLabelLength < 63) {
          emailDomainLabelLength += 1;
          emailDomainEndsWithAlphanumeric = true;
        } else {
          emailPossible = false;
        }
      } else if (character === "-") {
        if (emailDomainLabelLength < 63) {
          emailDomainLabelLength += 1;
          emailDomainEndsWithAlphanumeric = false;
        } else {
          emailPossible = false;
        }
      } else if (character === "." && emailDomainEndsWithAlphanumeric) {
        emailState = "domain-start";
        emailDomainLabelLength = 0;
        emailDomainEndsWithAlphanumeric = false;
      } else {
        emailPossible = false;
      }
    }

    if (!uriPossible && !emailPossible) start = -1;
  }

  return endsByStart;
}

function escapedPunctuationIndexes(value) {
  const escaped = new Uint8Array(value.length);

  for (let index = 0; index < value.length;) {
    if (value[index] === "\\" && isAsciiPunctuation(value[index + 1])) {
      escaped[index + 1] = 1;
      index += 2;
    } else {
      index += 1;
    }
  }

  return escaped;
}

function angleDestinationEndsByStart(value, escaped) {
  const endsByStart = new Map();
  let start = -1;

  for (let index = 0; index < value.length; index += 1) {
    if (escaped[index]) continue;
    const character = value[index];

    if (character === "<") {
      start = index;
    } else if (start !== -1 && character === ">") {
      endsByStart.set(start, index + 1);
      start = -1;
    } else if (character === "\r" || character === "\n") {
      start = -1;
    }
  }

  return endsByStart;
}

function nextUnescapedIndexes(value, character, escaped) {
  const indexes = new Int32Array(value.length + 1);
  indexes.fill(-1);
  let nextIndex = -1;

  for (let index = value.length - 1; index >= 0; index -= 1) {
    if (value[index] === character && !escaped[index]) nextIndex = index;
    indexes[index] = nextIndex;
  }

  return indexes;
}

function tagSpaceEnds(value) {
  const ends = new Int32Array(value.length + 1);
  ends[value.length] = value.length;

  for (let index = value.length - 1; index >= 0; index -= 1) {
    ends[index] = isTagSpace(value[index]) ? ends[index + 1] : index;
  }

  return ends;
}

function matchingParentheses(value, escaped) {
  const matches = new Map();
  const stack = [];

  for (let index = 0; index < value.length; index += 1) {
    if (escaped[index]) continue;
    if (value[index] === "(") {
      stack.push(index);
    } else if (value[index] === ")" && stack.length > 0) {
      matches.set(stack.pop(), index);
    }
  }

  return matches;
}

function bareDestinationEnds(value, escaped, parenthesisMatches) {
  const invalidPrefix = new Int32Array(value.length + 1);
  const ends = new Int32Array(value.length + 1);
  ends.fill(-1);
  ends[value.length] = value.length;

  for (let index = 0; index < value.length; index += 1) {
    invalidPrefix[index + 1] = invalidPrefix[index]
      + (isAsciiControlOrSpace(value[index]) ? 1 : 0);
  }

  for (let index = value.length - 1; index >= 0; index -= 1) {
    if (value[index] === "\\" && isAsciiPunctuation(value[index + 1])) {
      ends[index] = ends[index + 2];
    } else if (isAsciiControlOrSpace(value[index]) || value[index] === ")") {
      ends[index] = index;
    } else if (value[index] === "(" && !escaped[index]) {
      const close = parenthesisMatches.get(index);
      const hasInvalidContent = close !== undefined
        && invalidPrefix[close] !== invalidPrefix[index + 1];
      if (close !== undefined && !hasInvalidContent) {
        ends[index] = ends[close + 1];
      }
    } else {
      ends[index] = ends[index + 1];
    }
  }

  return ends;
}

function linkTitleEnd(value, start, tables) {
  let close = -1;

  if (value[start] === "\"") {
    close = tables.nextDoubleQuote[start + 1];
  } else if (value[start] === "'") {
    close = tables.nextSingleQuote[start + 1];
  } else if (value[start] === "(") {
    close = tables.nextCloseParenthesis[start + 1];
    const nestedOpen = tables.nextOpenParenthesis[start + 1];
    if (nestedOpen !== -1 && nestedOpen < close) return -1;
  }

  return close === -1 ? -1 : close + 1;
}

function inlineLinkEnd(value, openParenthesis, tables) {
  const contentStart = tables.tagSpaceEnd[openParenthesis + 1];
  if (value[contentStart] === ")") return contentStart + 1;

  if (contentStart > openParenthesis + 1) {
    const titleEnd = linkTitleEnd(value, contentStart, tables);
    if (titleEnd !== -1) {
      const afterTitle = tables.tagSpaceEnd[titleEnd];
      if (value[afterTitle] === ")") return afterTitle + 1;
    }
  }

  let destinationEnd = -1;
  if (value[contentStart] === "<") {
    destinationEnd = tables.angleDestinationEnd.get(contentStart) ?? -1;
  } else if (contentStart < value.length) {
    const bareEnd = tables.bareDestinationEnd[contentStart];
    if (bareEnd > contentStart) destinationEnd = bareEnd;
  }

  if (destinationEnd === -1) return -1;
  if (value[destinationEnd] === ")") return destinationEnd + 1;

  const afterDestination = tables.tagSpaceEnd[destinationEnd];
  if (afterDestination === destinationEnd) return -1;
  if (value[afterDestination] === ")") return afterDestination + 1;

  const titleEnd = linkTitleEnd(value, afterDestination, tables);
  if (titleEnd === -1) return -1;
  const afterTitle = tables.tagSpaceEnd[titleEnd];
  return value[afterTitle] === ")" ? afterTitle + 1 : -1;
}

function inlineLinkTailEndsByStart(
  value,
  backtickRuns,
  autolinkEnds,
  htmlEnds,
) {
  const escaped = escapedPunctuationIndexes(value);
  const parenthesisMatches = matchingParentheses(value, escaped);
  const tables = {
    angleDestinationEnd: angleDestinationEndsByStart(value, escaped),
    bareDestinationEnd: bareDestinationEnds(
      value,
      escaped,
      parenthesisMatches,
    ),
    nextCloseParenthesis: nextUnescapedIndexes(value, ")", escaped),
    nextDoubleQuote: nextUnescapedIndexes(value, "\"", escaped),
    nextOpenParenthesis: nextUnescapedIndexes(value, "(", escaped),
    nextSingleQuote: nextUnescapedIndexes(value, "'", escaped),
    tagSpaceEnd: tagSpaceEnds(value),
  };
  const endsByStart = new Map();
  const brackets = [];
  let linkEpoch = 0;

  for (let index = 0; index < value.length;) {
    if (value[index] === "\\" && isAsciiPunctuation(value[index + 1])) {
      index += 2;
      continue;
    }

    const backtickRun = backtickRuns.get(index);
    if (backtickRun?.closer) {
      index = backtickRun.closer.end;
      continue;
    }
    if (backtickRun) {
      index = backtickRun.end;
      continue;
    }

    const autolinkEnd = autolinkEnds.get(index);
    if (autolinkEnd !== undefined) {
      index = autolinkEnd;
      continue;
    }

    const htmlEnd = htmlEnds.get(index);
    if (htmlEnd !== undefined) {
      index = htmlEnd;
      continue;
    }

    if (value[index] === "[") {
      brackets.push({
        image: value[index - 1] === "!" && !escaped[index - 1],
        linkEpoch,
      });
      index += 1;
      continue;
    }

    if (value[index] === "]" && brackets.length > 0) {
      const bracket = brackets.pop();
      const active = bracket.image || bracket.linkEpoch === linkEpoch;
      if (active && value[index + 1] === "(") {
        const end = inlineLinkEnd(value, index + 1, tables);
        if (end !== -1) {
          endsByStart.set(index + 1, end);
          if (!bracket.image) linkEpoch += 1;
          index = end;
          continue;
        }
      }
    }

    index += 1;
  }

  return endsByStart;
}

function headingInlineText(value) {
  const output = [];
  const backtickRuns = backtickRunsByStart(value);
  const autolinkEnds = autolinkEndsByStart(value);
  const htmlEnds = htmlConstructEndsByStart(value);
  const inlineLinkEnds = inlineLinkTailEndsByStart(
    value,
    backtickRuns,
    autolinkEnds,
    htmlEnds,
  );

  for (let index = 0; index < value.length;) {
    const character = value[index];
    if (character === "\\" && isAsciiPunctuation(value[index + 1])) {
      output.push(value[index + 1]);
      index += 2;
      continue;
    }

    const backtickRun = backtickRuns.get(index);
    if (backtickRun?.closer) {
      output.push(codeSpanText(
        value.slice(backtickRun.end, backtickRun.closer.start),
      ));
      index = backtickRun.closer.end;
      continue;
    }

    if (backtickRun) {
      output.push(value.slice(backtickRun.start, backtickRun.end));
      index = backtickRun.end;
      continue;
    }

    const autolinkEnd = autolinkEnds.get(index);
    if (autolinkEnd !== undefined) {
      output.push(value.slice(index + 1, autolinkEnd - 1));
      index = autolinkEnd;
      continue;
    }

    const htmlEnd = htmlEnds.get(index);
    if (htmlEnd !== undefined) {
      index = htmlEnd;
      continue;
    }

    const inlineLinkEnd = inlineLinkEnds.get(index);
    if (inlineLinkEnd !== undefined) {
      index = inlineLinkEnd;
      continue;
    }

    output.push(character);
    index += 1;
  }

  return output.join("");
}

function githubHeadingAnchors(markdown) {
  const seen = new Map();
  const anchors = new Set();

  for (const line of markdown.split(/\r?\n/u)) {
    const match = /^(?: {0,3})#{1,6}\s+(.+?)\s*#*\s*$/u.exec(line);
    if (!match) continue;

    const base = headingInlineText(match[1])
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
