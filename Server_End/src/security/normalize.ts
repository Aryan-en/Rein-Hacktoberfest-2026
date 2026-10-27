export interface NormalizedInput {
  text: string;
  hiddenCharactersRemoved: boolean;
  truncated: boolean;
}

// Zero-width, BOM, word-joiner, and bidi override/isolate controls.
const HIDDEN = /[​-‏⁠﻿‪-‮⁦-⁩]/g;
// C0/C1 controls except \n and \t.
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

export function normalizeText(raw: string, maxChars = Infinity): NormalizedInput {
  let s = raw.normalize("NFKC");
  const hiddenCharactersRemoved = HIDDEN.test(s);
  HIDDEN.lastIndex = 0;
  s = s.replace(HIDDEN, "").replace(/\r\n?/g, "\n").replace(CONTROL, " ");
  s = s.trim();
  let truncated = false;
  if (s.length > maxChars) {
    s = s.slice(0, maxChars);
    truncated = true;
  }
  return { text: s, hiddenCharactersRemoved, truncated };
}

/** Collapse whitespace + lowercase, keeping a map back to offsets in the original. */
export function foldForMatching(s: string): { folded: string; map: number[] } {
  const out: string[] = [];
  const map: number[] = [];
  let prevSpace = true;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (/\s/.test(ch)) {
      if (!prevSpace) {
        out.push(" ");
        map.push(i);
        prevSpace = true;
      }
    } else {
      out.push(ch.toLowerCase());
      map.push(i);
      prevSpace = false;
    }
  }
  return { folded: out.join(""), map };
}

export function countMeaningfulChars(s: string): number {
  return s.replace(/\s+/g, "").length;
}
