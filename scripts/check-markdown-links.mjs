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

function htmlTagEndsByStart(value) {
  const states = [
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
    "closing-tag-name",
    "closing-tag-end",
  ];
  const stateIndex = new Map(states.map((state, index) => [state, index]));
  const nextStart = new Int32Array(value.length);
  nextStart.fill(-1);
  let heads = new Int32Array(states.length).fill(-1);
  let tails = new Int32Array(states.length).fill(-1);
  const endsByStart = new Map();
  let nextHeads = new Int32Array(states.length).fill(-1);
  let nextTails = new Int32Array(states.length).fill(-1);

  function appendList(targetHeads, targetTails, state, head, tail) {
    const index = stateIndex.get(state);
    if (targetHeads[index] === -1) {
      targetHeads[index] = head;
    } else {
      nextStart[targetTails[index]] = head;
    }
    targetTails[index] = tail;
  }

  for (let index = 0; index < value.length; index += 1) {
    nextHeads.fill(-1);
    nextTails.fill(-1);

    for (let state = 0; state < states.length; state += 1) {
      const head = heads[state];
      if (head === -1) continue;
      const nextState = advanceHtmlTag(states[state], value[index]);

      if (nextState === "complete") {
        for (let start = head; start !== -1; start = nextStart[start]) {
          endsByStart.set(start, index + 1);
        }
      } else if (nextState !== "invalid") {
        appendList(nextHeads, nextTails, nextState, head, tails[state]);
      }
    }

    if (isAsciiLetter(value[index]) && value[index - 1] === "<") {
      appendList(nextHeads, nextTails, "open-tag-name", index - 1, index - 1);
    }
    if (
      isAsciiLetter(value[index])
      && value[index - 1] === "/"
      && value[index - 2] === "<"
    ) {
      appendList(nextHeads, nextTails, "closing-tag-name", index - 2, index - 2);
    }

    [heads, nextHeads] = [nextHeads, heads];
    [tails, nextTails] = [nextTails, tails];
  }

  return endsByStart;
}

function htmlConstructEndsByStart(value) {
  const endsByStart = new Map();
  const tagEnds = /<[A-Za-z]|<\/[A-Za-z]/u.test(value)
    ? htmlTagEndsByStart(value)
    : new Map();
  const pendingComments = [];
  const pendingProcessing = [];
  const pendingCdata = [];
  const pendingDeclarations = [];

  function completePending(pending, end) {
    for (const start of pending) endsByStart.set(start, end);
    pending.length = 0;
  }

  for (let index = 0; index < value.length; index += 1) {
    if (value.startsWith("-->", index)) completePending(pendingComments, index + 3);
    if (value.startsWith("?>", index)) completePending(pendingProcessing, index + 2);
    if (value.startsWith("]]>", index)) completePending(pendingCdata, index + 3);
    if (value[index] === ">") completePending(pendingDeclarations, index + 1);

    if (value[index] !== "<") continue;
    if (value.startsWith("<!-->", index)) {
      endsByStart.set(index, index + 5);
    } else if (value.startsWith("<!--->", index)) {
      endsByStart.set(index, index + 6);
    } else if (value.startsWith("<!--", index)) {
      pendingComments.push(index);
    } else if (value.startsWith("<?", index)) {
      pendingProcessing.push(index);
    } else if (value.startsWith("<![CDATA[", index)) {
      pendingCdata.push(index);
    } else if (value.startsWith("<!", index) && isAsciiLetter(value[index + 2])) {
      pendingDeclarations.push(index);
    }
  }

  for (const [start, end] of tagEnds) endsByStart.set(start, end);

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

function normalizeReferenceLabel(label) {
  let normalized = "";

  for (let index = 0; index < label.length;) {
    if (label[index] === "\\" && isAsciiPunctuation(label[index + 1])) {
      normalized += label[index + 1];
      index += 2;
    } else {
      normalized += label[index];
      index += 1;
    }
  }

  normalized = normalized
    .replace(/^[ \t\r\n]+|[ \t\r\n]+$/gu, "")
    .replace(/[ \t\r\n]+/gu, " ");

  let folded = "";
  for (const character of normalized) {
    folded += character === "ı"
      ? character
      : character.toLowerCase().toUpperCase().toLowerCase();
  }
  return folded;
}

function referenceLabelEnd(value, start, escaped) {
  for (let index = start + 1; index < value.length && index - start <= 1000; index += 1) {
    if (escaped[index]) continue;
    if (value[index] === "[") return -1;
    if (value[index] === "]") return index;
    if (value[index] === "\n" || value[index] === "\r") return -1;
  }

  return -1;
}

function inlineLinkTailEndsByStart(
  value,
  backtickRuns,
  autolinkEnds,
  htmlEnds,
  references,
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
        start: index,
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

      if (active) {
        let referenceEnd = index + 1;
        let referenceLabel = value.slice(bracket.start + 1, index);

        if (value[index + 1] === "[") {
          const labelEnd = referenceLabelEnd(value, index + 1, escaped);
          if (labelEnd !== -1) {
            const explicitLabel = value.slice(index + 2, labelEnd);
            if (explicitLabel) referenceLabel = explicitLabel;
            referenceEnd = labelEnd + 1;
          } else {
            referenceLabel = "";
          }
        }

        if (
          referenceLabel
          && references.has(normalizeReferenceLabel(referenceLabel))
        ) {
          if (referenceEnd > index + 1) {
            endsByStart.set(index + 1, referenceEnd);
          }
          if (!bracket.image) linkEpoch += 1;
          index = referenceEnd;
          continue;
        }
      }
    }

    index += 1;
  }

  return endsByStart;
}

function headingInlineText(value, references) {
  if (!/[\\`<[\]]/u.test(value)) return value;

  const output = [];
  const backtickRuns = backtickRunsByStart(value);
  const autolinkEnds = autolinkEndsByStart(value);
  const htmlEnds = htmlConstructEndsByStart(value);
  const inlineLinkEnds = value.includes("[")
    ? inlineLinkTailEndsByStart(
      value,
      backtickRuns,
      autolinkEnds,
      htmlEnds,
      references,
    )
    : new Map();
  let literalStart = 0;

  function appendLiteral(end) {
    if (end > literalStart) output.push(value.slice(literalStart, end));
  }

  for (let index = 0; index < value.length;) {
    const character = value[index];
    if (character === "\\" && isAsciiPunctuation(value[index + 1])) {
      appendLiteral(index);
      output.push(value[index + 1]);
      index += 2;
      literalStart = index;
      continue;
    }

    const backtickRun = backtickRuns.get(index);
    if (backtickRun?.closer) {
      appendLiteral(index);
      output.push(codeSpanText(
        value.slice(backtickRun.end, backtickRun.closer.start),
      ));
      index = backtickRun.closer.end;
      literalStart = index;
      continue;
    }

    if (backtickRun) {
      index = backtickRun.end;
      continue;
    }

    const autolinkEnd = autolinkEnds.get(index);
    if (autolinkEnd !== undefined) {
      appendLiteral(index);
      output.push(value.slice(index + 1, autolinkEnd - 1));
      index = autolinkEnd;
      literalStart = index;
      continue;
    }

    const htmlEnd = htmlEnds.get(index);
    if (htmlEnd !== undefined) {
      appendLiteral(index);
      index = htmlEnd;
      literalStart = index;
      continue;
    }

    const inlineLinkEnd = inlineLinkEnds.get(index);
    if (inlineLinkEnd !== undefined) {
      appendLiteral(index);
      index = inlineLinkEnd;
      literalStart = index;
      continue;
    }

    index += 1;
  }

  appendLiteral(value.length);

  return output.join("");
}

function referenceDefinitionAt(value, start) {
  let index = start;
  let indentation = 0;
  while (value[index] === " " && indentation < 4) {
    indentation += 1;
    index += 1;
  }
  if (indentation > 3 || value[index] !== "[") return null;

  const labelStart = index + 1;
  let lineBreaks = 0;
  index = labelStart;
  for (; index < value.length && index - labelStart <= 999; index += 1) {
    if (value[index] === "\\" && isAsciiPunctuation(value[index + 1])) {
      index += 1;
      continue;
    }
    if (value[index] === "[") return null;
    if (value[index] === "]") break;
    if (value[index] === "\n") {
      lineBreaks += 1;
      if (lineBreaks > 1) return null;
    }
  }
  if (value[index] !== "]" || index === labelStart || value[index + 1] !== ":") {
    return null;
  }

  const label = normalizeReferenceLabel(value.slice(labelStart, index));
  if (!label) return null;
  index += 2;

  let destinationLineBreaks = 0;
  while (value[index] === " " || value[index] === "\t" || value[index] === "\n") {
    if (value[index] === "\n") {
      destinationLineBreaks += 1;
      if (destinationLineBreaks > 1) return null;
    }
    index += 1;
  }

  if (value[index] === "<") {
    index += 1;
    for (; index < value.length; index += 1) {
      if (value[index] === "\\" && isAsciiPunctuation(value[index + 1])) {
        index += 1;
        continue;
      }
      if (value[index] === ">") break;
      if (value[index] === "<" || value[index] === "\n") return null;
    }
    if (value[index] !== ">") return null;
    index += 1;
  } else {
    const destinationStart = index;
    let depth = 0;
    for (; index < value.length; index += 1) {
      if (value[index] === "\\" && isAsciiPunctuation(value[index + 1])) {
        index += 1;
        continue;
      }
      if (value[index] === "(") {
        if (depth === 32) return null;
        depth += 1;
      } else if (value[index] === ")") {
        if (depth === 0) return null;
        depth -= 1;
      } else if (value[index] === " " || value[index] === "\t" || value[index] === "\n") {
        break;
      } else if (isAsciiControlOrSpace(value[index])) {
        return null;
      }
    }
    if (index === destinationStart || depth !== 0) return null;
  }

  const destinationEnd = index;
  while (value[index] === " " || value[index] === "\t") index += 1;
  if (value[index] === "\n") {
    const nextLine = index + 1;
    let titleStart = nextLine;
    while (value[titleStart] === " " && titleStart - nextLine < 4) titleStart += 1;
    if (!"\"'(".includes(value[titleStart])) {
      return { end: nextLine, label };
    }
    index = titleStart;
  } else if (index === destinationEnd || index >= value.length) {
    return { end: index, label };
  }

  const opener = value[index];
  const closer = opener === "(" ? ")" : opener;
  if (opener !== "\"" && opener !== "'" && opener !== "(") return null;
  index += 1;
  for (; index < value.length; index += 1) {
    if (value[index] === "\\" && isAsciiPunctuation(value[index + 1])) {
      index += 1;
      continue;
    }
    if (value[index] === closer) break;
    if (value[index] === "\n") return null;
  }
  if (value[index] !== closer) return null;
  index += 1;
  while (value[index] === " " || value[index] === "\t") index += 1;
  if (index < value.length && value[index] !== "\n") return null;
  return { end: value[index] === "\n" ? index + 1 : index, label };
}

function markdownReferenceDefinitions(markdown) {
  const references = new Set();
  const documents = [markdown.split(/\r?\n/u)];

  while (documents.length > 0) {
    const lines = documents.pop();
    const paragraph = [];
    let fence = null;

    function flushParagraph() {
      const value = paragraph.join("\n");
      paragraph.length = 0;
      let index = 0;
      while (index < value.length) {
        const definition = referenceDefinitionAt(value, index);
        if (!definition) break;
        references.add(definition.label);
        index = definition.end;
      }
    }

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      if (
        !fence
        && /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:_[ \t]*){3,}|(?:-[ \t]*){3,})$/u.test(line)
      ) {
        flushParagraph();
        continue;
      }

      if (!fence) {
        const quoteMatch = /^ {0,3}>[ \t]?(.*)$/u.exec(line);
        if (quoteMatch) {
          flushParagraph();
          const containerLines = [quoteMatch[1]];
          while (lineIndex + 1 < lines.length) {
            const continuation = /^ {0,3}>[ \t]?(.*)$/u.exec(lines[lineIndex + 1]);
            if (!continuation) break;
            containerLines.push(continuation[1]);
            lineIndex += 1;
          }
          documents.push(containerLines);
          continue;
        }

        const listMatch = /^( {0,3})([*+-]|\d{1,9}[.)])([ \t]+)(.*)$/u.exec(line);
        if (listMatch) {
          flushParagraph();
          const markerPadding = listMatch[3].length <= 4
            ? listMatch[3].length
            : 1;
          const contentIndent = listMatch[1].length
            + listMatch[2].length
            + markerPadding;
          const firstLine = listMatch[3].length <= 4
            ? listMatch[4]
            : `${listMatch[3].slice(1)}${listMatch[4]}`;
          const containerLines = [firstLine];
          while (lineIndex + 1 < lines.length) {
            const continuation = lines[lineIndex + 1];
            const leadingSpaces = /^ */u.exec(continuation)[0].length;
            if (continuation && leadingSpaces < contentIndent) break;
            containerLines.push(continuation.slice(Math.min(contentIndent, continuation.length)));
            lineIndex += 1;
          }
          documents.push(containerLines);
          continue;
        }
      }

      const fenceMatch = /^ {0,3}(`{3,}|~{3,})/u.exec(line);
      if (fence) {
        if (
          fenceMatch
          && fenceMatch[1][0] === fence.character
          && fenceMatch[1].length >= fence.length
          && /^[ \t]*$/u.test(line.slice(fenceMatch[0].length))
        ) {
          fence = null;
        }
        continue;
      }
      if (fenceMatch) {
        flushParagraph();
        fence = { character: fenceMatch[1][0], length: fenceMatch[1].length };
        continue;
      }
      if (/^\s*$/u.test(line)) {
        flushParagraph();
        continue;
      }
      if (/^(?: {4}|\t)/u.test(line)) {
        if (paragraph.length > 0) paragraph.push(line);
        continue;
      }
      if (/^ {0,3}(?:#{1,6}(?:\s|$)|(?:=+|-+)\s*$)/u.test(line)) {
        flushParagraph();
        continue;
      }
      paragraph.push(line);
    }
    flushParagraph();
  }

  return references;
}

function githubHeadingAnchors(markdown) {
  const seen = new Map();
  const anchors = new Set();
  const references = markdownReferenceDefinitions(markdown);

  for (const line of markdown.split(/\r?\n/u)) {
    const match = /^(?: {0,3})#{1,6}\s+(.+?)\s*#*\s*$/u.exec(line);
    if (!match) continue;

    const base = headingInlineText(match[1], references)
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
