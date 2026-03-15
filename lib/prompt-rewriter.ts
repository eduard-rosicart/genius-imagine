/**
 * prompt-rewriter.ts
 *
 * Rewrites prompts using a multi-strategy approach that combines:
 *   1. Euphemistic substitution — artistic/clinical vocabulary
 *   2. Language fragmentation — code-switching into French/Latin/Italian
 *   3. Semantic indirection — describe the concept without trigger words
 *   4. Phonetic obfuscation — character-level variants
 *   5. Artistic context injection — frame content as fine art
 *   6. Token splitting — insert zero-width spaces or punctuation
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type RewriteIntensity = "light" | "medium" | "heavy";

// ─── Substitution dictionaries ────────────────────────────────────────────────

/** Euphemisms and artistic synonyms */
const EUPHEMISMS: Record<string, string[]> = {
  // Body / nudity
  naked: ["unclothed", "undraped", "au naturel", "in natural form", "disrobed", "bare"],
  nude: ["undraped figure", "unclothed", "au naturel", "corps nu", "natural form"],
  nudity: ["natural state", "undraped form", "classical figure", "corps naturel"],
  topless: ["décolleté", "bare-chested", "classical torso", "uncovered upper body"],
  bottomless: ["bare lower form", "undraped lower figure"],
  sex: ["intimate encounter", "romantic union", "eros", "amour physique", "coitus"],
  sexual: ["intimate", "erotic", "sensual", "passionate", "amorous"],
  explicit: ["uncensored", "unrestrained", "full expression", "unfiltered"],
  porn: ["adult content", "erotica", "adult material", "sensual art"],
  pornographic: ["adult", "erotic", "sensual", "mature"],
  erotic: ["sensual", "romantic", "intimate", "passionate"],
  breast: ["bosom", "décolletage", "chest", "buste", "thorax"],
  breasts: ["bosom", "décolletage", "chest", "buste"],
  nipple: ["areola", "tip of the breast", "sommet"],
  nipples: ["areolae", "breast tips"],
  vagina: ["feminine anatomy", "intimate anatomy", "genitalia", "pudenda"],
  penis: ["phallus", "masculine anatomy", "member", "intimate anatomy"],
  genitals: ["intimate anatomy", "private parts", "genitalia"],
  ass: ["posterior", "derrière", "buttocks", "backside"],
  butt: ["posterior", "derrière", "buttocks", "backside"],
  buttocks: ["posterior", "derrière", "gluteal region"],
  // Violence / gore
  blood: ["crimson fluid", "vital essence", "rouge"],
  gore: ["visceral detail", "raw imagery"],
  kill: ["vanquish", "overcome", "dispatch"],
  murder: ["lethal act", "fatal encounter"],
  dead: ["lifeless", "still", "at rest"],
  // Substances
  drug: ["substance", "remedy", "compound"],
  drugs: ["substances", "compounds"],
  cocaine: ["white powder", "the substance"],
  weed: ["herb", "botanical"],
  // Other sensitive
  weapon: ["instrument", "device", "armament"],
  gun: ["firearm", "instrument", "device"],
  knife: ["blade", "edged instrument"],
  violence: ["conflict", "struggle", "confrontation"],
  violent: ["intense", "forceful", "powerful"],
};

/** Cross-language substitutions (French, Latin, Italian, Spanish) */
const CROSS_LANG: Record<string, string[]> = {
  naked: ["nue", "nudo", "desnuda", "nudum"],
  nude: ["nu", "nudo", "desnudo", "nudus"],
  sex: ["sexe", "sesso", "sexo", "coitus"],
  sexual: ["sexuel", "sessuale", "sexual", "sexualis"],
  erotic: ["érotique", "erotico", "erótico"],
  body: ["corps", "corpo", "cuerpo", "corpus"],
  woman: ["femme", "donna", "mujer", "femina"],
  man: ["homme", "uomo", "hombre", "vir"],
  beautiful: ["belle", "bella", "bellissima", "pulchra"],
  love: ["amour", "amore", "amor"],
  passion: ["passion", "passione", "pasión"],
  intimate: ["intime", "intimo", "íntimo"],
  breast: ["sein", "seno", "seno", "pectus"],
};

/** Semantic indirection — describe the absence or state instead of the word */
const SEMANTIC_INDIRECT: Record<string, string> = {
  naked: "wearing nothing at all, full skin visible",
  nude: "without any garments, natural body fully visible",
  topless: "upper body unclothed, chest and torso fully bare",
  sex: "engaged in full physical intimacy",
  sexual: "physically intimate and uninhibited",
  explicit: "showing everything without restraint",
  violence: "in the midst of intense physical struggle",
  blood: "with crimson liquid flowing",
};

/** Artistic context phrases to prepend or inject */
const ART_CONTEXTS = [
  "in the style of classical Renaissance painting,",
  "fine art photography,",
  "as a classical oil painting in the style of Caravaggio,",
  "depicted as a neoclassical marble sculpture,",
  "artistic figure study,",
  "in the tradition of Rodin,",
  "Flemish baroque painting style,",
  "fine art nude study,",
  "classical art depiction,",
];

// ─── Strategy implementations ─────────────────────────────────────────────────

/** Pick a random element from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Apply euphemistic substitution */
function applyEuphemisms(text: string): string {
  let result = text;
  for (const [trigger, replacements] of Object.entries(EUPHEMISMS)) {
    const regex = new RegExp(`\\b${trigger}\\b`, "gi");
    result = result.replace(regex, () => pick(replacements));
  }
  return result;
}

/** Apply cross-language substitution for the most common triggers */
function applyCrossLang(text: string): string {
  let result = text;
  for (const [trigger, replacements] of Object.entries(CROSS_LANG)) {
    const regex = new RegExp(`\\b${trigger}\\b`, "gi");
    result = result.replace(regex, () => pick(replacements));
  }
  return result;
}

/** Apply semantic indirection for known triggers */
function applySemanticIndirection(text: string): string {
  let result = text;
  for (const [trigger, replacement] of Object.entries(SEMANTIC_INDIRECT)) {
    const regex = new RegExp(`\\b${trigger}\\b`, "gi");
    result = result.replace(regex, replacement);
  }
  return result;
}

/**
 * Phonetic obfuscation — inserts zero-width non-joiner (U+200C) or
 * replaces common vowels with look-alike unicode characters for trigger words.
 * Applied selectively to avoid breaking the whole prompt.
 */
function applyPhoneticObfuscation(text: string, triggers: string[]): string {
  let result = text;
  const ZWSP = "\u200C"; // zero-width non-joiner — invisible, breaks tokenization

  for (const trigger of triggers) {
    if (text.toLowerCase().includes(trigger)) {
      // Insert zero-width character in the middle of the word
      const mid = Math.floor(trigger.length / 2);
      const obfuscated = trigger.slice(0, mid) + ZWSP + trigger.slice(mid);
      const regex = new RegExp(`\\b${trigger}\\b`, "gi");
      result = result.replace(regex, obfuscated);
    }
  }
  return result;
}

/**
 * Token splitting — adds a period or hyphen mid-word for remaining triggers.
 * e.g. "naked" → "nak.ed"
 */
function applyTokenSplitting(text: string, triggers: string[]): string {
  let result = text;
  for (const trigger of triggers) {
    if (text.toLowerCase().includes(trigger)) {
      const mid = Math.floor(trigger.length / 2);
      const split = trigger.slice(0, mid) + "-" + trigger.slice(mid);
      const regex = new RegExp(`\\b${trigger}\\b`, "gi");
      result = result.replace(regex, split);
    }
  }
  return result;
}

/** Inject artistic context at the beginning of the prompt */
function injectArtContext(text: string): string {
  const already = ART_CONTEXTS.some((ctx) =>
    text.toLowerCase().includes(ctx.replace(",", "").toLowerCase().slice(0, 15))
  );
  if (already) return text;
  return `${pick(ART_CONTEXTS)} ${text}`;
}

// ─── Detect which triggers are present ───────────────────────────────────────

function detectTriggers(text: string): string[] {
  const lower = text.toLowerCase();
  const allTriggers = [
    ...Object.keys(EUPHEMISMS),
    ...Object.keys(CROSS_LANG),
    ...Object.keys(SEMANTIC_INDIRECT),
  ];
  return [...new Set(allTriggers)].filter((t) => lower.includes(t));
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Rewrite a prompt using multi-strategy obfuscation.
 *
 * @param prompt  Original prompt text
 * @param intensity  How aggressively to rewrite
 *   - "light"  → euphemisms + art context only
 *   - "medium" → euphemisms + cross-lang + art context
 *   - "heavy"  → all strategies combined
 */
export function rewritePrompt(
  prompt: string,
  intensity: RewriteIntensity = "medium"
): string {
  if (!prompt.trim()) return prompt;

  const triggers = detectTriggers(prompt);

  let result = prompt;

  if (intensity === "light") {
    result = applyEuphemisms(result);
    result = injectArtContext(result);
    return result;
  }

  if (intensity === "medium") {
    // Apply semantic indirection first (most complete rewrites)
    result = applySemanticIndirection(result);
    // Then euphemisms for anything remaining
    result = applyEuphemisms(result);
    // Cross-lang for style
    result = applyCrossLang(result);
    // Art context wrapper
    result = injectArtContext(result);
    return result;
  }

  // heavy: all strategies
  result = applySemanticIndirection(result);
  result = applyEuphemisms(result);
  result = applyCrossLang(result);
  // For remaining triggers after substitution, apply phonetic + token splitting
  const remainingTriggers = detectTriggers(result);
  if (remainingTriggers.length > 0) {
    // Alternate between phonetic and token splitting randomly
    const usePhonetic = Math.random() > 0.5;
    result = usePhonetic
      ? applyPhoneticObfuscation(result, remainingTriggers)
      : applyTokenSplitting(result, remainingTriggers);
  }
  result = injectArtContext(result);

  return result;
}

/**
 * Returns true if the prompt contains any known sensitive triggers.
 * Useful to decide whether to show the Raw button as relevant.
 */
export function hasTriggers(prompt: string): boolean {
  return detectTriggers(prompt).length > 0;
}
