import { describe, it, expect } from 'vitest';
import { normalizeVoiceText } from './voice-dictionary.js';

describe('normalizeVoiceText — B042 voice dictation corrections', () => {
  // ── AngelEye project ──────────────────────────────────────────────────────

  it('corrects "AngelLie" to "AngelEye"', () => {
    expect(normalizeVoiceText('Open the AngelLie dashboard')).toBe('Open the AngelEye dashboard');
  });

  it('corrects "Angel Lie" with space to "AngelEye"', () => {
    expect(normalizeVoiceText('Check Angel Lie status')).toBe('Check AngelEye status');
  });

  // ── Anthropic ecosystem ───────────────────────────────────────────────────

  it('corrects "anhtropic-claude" to "anthropic-claude"', () => {
    expect(normalizeVoiceText('look at anhtropic-claude docs')).toBe(
      'look at anthropic-claude docs'
    );
  });

  // ── AppyDave brands & products ────────────────────────────────────────────

  it('corrects "Appy Dave" to "AppyDave"', () => {
    expect(normalizeVoiceText('Go to Appy Dave tools')).toBe('Go to AppyDave tools');
  });

  it('corrects "Appy Stack" to "AppyStack"', () => {
    expect(normalizeVoiceText('Create an Appy Stack project')).toBe('Create an AppyStack project');
  });

  it('corrects "Flye Hub" to "FliHub"', () => {
    expect(normalizeVoiceText('Upload to Flye Hub')).toBe('Upload to FliHub');
  });

  it('corrects "Flye Deck" to "FliDeck"', () => {
    expect(normalizeVoiceText('Open Flye Deck')).toBe('Open FliDeck');
  });

  it('corrects "Support Signal" to "SupportSignal"', () => {
    expect(normalizeVoiceText('Deploy Support Signal app')).toBe('Deploy SupportSignal app');
  });

  it('corrects "Story Line" to "Storyline"', () => {
    expect(normalizeVoiceText('Edit Story Line config')).toBe('Edit Storyline config');
  });

  it('corrects "Clue Less" to "Klueless"', () => {
    expect(normalizeVoiceText('Run Clue Less DSL')).toBe('Run Klueless DSL');
  });

  // ── Frameworks & methods ──────────────────────────────────────────────────

  it('corrects "be mad" to "BMAD"', () => {
    expect(normalizeVoiceText('Use the be mad method')).toBe('Use the BMAD method');
  });

  it('corrects "poem oh s" to "POEM OS"', () => {
    expect(normalizeVoiceText('Configure poem oh s')).toBe('Configure POEM OS');
  });

  it('corrects "agent oh s" to "agent-os"', () => {
    expect(normalizeVoiceText('Deploy agent oh s')).toBe('Deploy agent-os');
  });

  // ── AI tools ──────────────────────────────────────────────────────────────

  it('corrects "ai-gentic" to "aigentive"', () => {
    expect(normalizeVoiceText('Check ai-gentic tools')).toBe('Check aigentive tools');
  });

  it('corrects "nvideo nemoclaw" to "NVIDIA NemoClaw"', () => {
    expect(normalizeVoiceText('Install nvideo nemoclaw')).toBe('Install NVIDIA NemoClaw');
  });

  it('corrects "goosew" to "goose"', () => {
    expect(normalizeVoiceText('Run goosew agent')).toBe('Run goose agent');
  });

  // ── Tech stack terms ──────────────────────────────────────────────────────

  it('corrects "convects" to "Convex"', () => {
    expect(normalizeVoiceText('Set up convects backend')).toBe('Set up Convex backend');
  });

  it('corrects "soo-pa base" to "Supabase"', () => {
    expect(normalizeVoiceText('Connect to soo-pa base')).toBe('Connect to Supabase');
  });

  it('corrects "veet" to "Vite"', () => {
    expect(normalizeVoiceText('Start veet dev server')).toBe('Start Vite dev server');
  });

  it('corrects "tail wind" to "Tailwind"', () => {
    expect(normalizeVoiceText('Add tail wind classes')).toBe('Add Tailwind classes');
  });

  it('corrects "zoo-d" to "Zod"', () => {
    expect(normalizeVoiceText('Validate with zoo-d')).toBe('Validate with Zod');
  });

  it('corrects "pee no" to "Pino"', () => {
    expect(normalizeVoiceText('Configure pee no logger')).toBe('Configure Pino logger');
  });

  it('corrects "socket eye oh" to "Socket.io"', () => {
    expect(normalizeVoiceText('Enable socket eye oh events')).toBe('Enable Socket.io events');
  });

  it('corrects "express jay s" to "Express.js"', () => {
    expect(normalizeVoiceText('Use express jay s router')).toBe('Use Express.js router');
  });

  // ── Compound misheard terms ───────────────────────────────────────────────

  it('corrects "mod-y action" to "multi-action"', () => {
    expect(normalizeVoiceText('Add mod-y action support')).toBe('Add multi-action support');
  });

  it('corrects "P and G" to "PNG"', () => {
    expect(normalizeVoiceText('Export as P and G')).toBe('Export as PNG');
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('applies multiple corrections in a single string', () => {
    expect(normalizeVoiceText('Deploy Appy Dave tools to soo-pa base with veet')).toBe(
      'Deploy AppyDave tools to Supabase with Vite'
    );
  });

  it('returns unchanged text when no corrections apply', () => {
    const text = 'Build the authentication service';
    expect(normalizeVoiceText(text)).toBe(text);
  });

  it('handles empty string', () => {
    expect(normalizeVoiceText('')).toBe('');
  });
});
