// ── Voice Dictation Entity Dictionary (B042) ────────────────────────────────
// Maps common voice dictation misheard terms to their correct forms.
// Sourced from 924-session analysis campaign (220+ identified, ~35 seeded here).

const VOICE_CORRECTIONS: [RegExp, string][] = [
  // AngelEye project
  [/\bAngel\s*Lie\b/gi, 'AngelEye'],
  [/\bAngel\s*Eye\b/g, 'AngelEye'],

  // Anthropic ecosystem (specific compound term before general)
  [/\banhtropic[-\s]claude\b/gi, 'anthropic-claude'],
  [/\banhtropic\b/gi, 'Anthropic'],

  // AppyDave brands & products
  [/\bAppy\s+Dave\b/g, 'AppyDave'],
  [/\bAppy\s+Stack\b/g, 'AppyStack'],
  [/\bFlye\s+Hub\b/gi, 'FliHub'],
  [/\bFlye\s+Deck\b/gi, 'FliDeck'],
  [/\bFlye\s+Gen\b/gi, 'FliGen'],
  [/\bFlye\s+Video\b/gi, 'FliVideo'],
  [/\bSupport\s+Signal\b/g, 'SupportSignal'],
  [/\bStory\s+Line\b/g, 'Storyline'],
  [/\bClue\s+Less\b/gi, 'Klueless'],

  // Frameworks & methods
  [/\bbe\s+mad\b/gi, 'BMAD'],
  [/\bpoem\s+oh\s+s\b/gi, 'POEM OS'],
  [/\bagent\s+oh\s+s\b/gi, 'agent-os'],

  // AI tools
  [/\bai-gentic\b/gi, 'aigentive'],
  [/\bnvideo\s+nemoclaw\b/gi, 'NVIDIA NemoClaw'],
  [/\bHammer\s+Moon\b/g, 'HammerMoom'],
  [/\biCare\b/g, 'EyeCare'],
  [/\bgoosew\b/gi, 'goose'],

  // Tech stack terms
  [/\bconvects\b/gi, 'Convex'],
  [/\bsoo-?pa\s*base\b/gi, 'Supabase'],
  [/\bveet\b/gi, 'Vite'],
  [/\btail\s+wind\b/gi, 'Tailwind'],
  [/\bzoo-?d\b/gi, 'Zod'],
  [/\bpee\s+no\b/gi, 'Pino'],
  [/\bsocket\s+eye\s+oh\b/gi, 'Socket.io'],
  [/\bexpress\s+jay\s+s\b/gi, 'Express.js'],

  // Compound misheard terms
  [/\bmod-?y\s+action\b/gi, 'multi-action'],
  [/\bP\s+and\s+G\b/g, 'PNG'],
];

/**
 * Applies case-insensitive voice dictation corrections to text.
 * Returns the corrected text with all known misheard terms replaced.
 */
export function normalizeVoiceText(text: string): string {
  let result = text;
  for (const [pattern, replacement] of VOICE_CORRECTIONS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
