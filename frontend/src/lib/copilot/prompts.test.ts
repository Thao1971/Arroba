/**
 * HARDENING-025 · Item 3 · Tests de plantillas del Copilot para chips de
 * oportunidad.
 */
import { describe, expect, it } from 'vitest';
import { CHIP_PROMPTS, buildChipPrompt, hasPromptForChip } from './prompts';

describe('hasPromptForChip', () => {
  it('reconoce los 3 enums canónicos de opportunity.chips[]', () => {
    expect(hasPromptForChip('buy_and_build')).toBe(true);
    expect(hasPromptForChip('capital_raise')).toBe(true);
    expect(hasPromptForChip('partner_entry')).toBe(true);
  });

  it('rechaza enums desconocidos', () => {
    expect(hasPromptForChip('exit')).toBe(false);
    expect(hasPromptForChip('mystery_chip')).toBe(false);
  });

  it('rechaza null/undefined/string vacío', () => {
    expect(hasPromptForChip(null)).toBe(false);
    expect(hasPromptForChip(undefined)).toBe(false);
    expect(hasPromptForChip('')).toBe(false);
  });
});

describe('buildChipPrompt', () => {
  it('sustituye {empresa} con la razón social provista', () => {
    const p = buildChipPrompt('buy_and_build', 'LABORATORIOS SERVIER');
    expect(p).toContain('LABORATORIOS SERVIER');
    expect(p).not.toContain('{empresa}');
    expect(p).toMatch(/^Prepárame una tesis de Buy & Build/);
  });

  it('para capital_raise interpola correctamente', () => {
    const p = buildChipPrompt('capital_raise', 'ACME SA');
    expect(p).toContain('ACME SA');
    expect(p).toMatch(/captación de capital/i);
  });

  it('para partner_entry interpola correctamente', () => {
    const p = buildChipPrompt('partner_entry', 'ACME SA');
    expect(p).toContain('ACME SA');
    expect(p).toMatch(/socio ideal/i);
  });

  it('fallback a "esta compañía" cuando empresa es null/undefined/vacío', () => {
    expect(buildChipPrompt('buy_and_build', null)).toContain('esta compañía');
    expect(buildChipPrompt('buy_and_build', undefined)).toContain('esta compañía');
    expect(buildChipPrompt('buy_and_build', '')).toContain('esta compañía');
    expect(buildChipPrompt('buy_and_build', '   ')).toContain('esta compañía');
  });

  it('devuelve null para enums desconocidos', () => {
    expect(buildChipPrompt('exit', 'ACME')).toBeNull();
    expect(buildChipPrompt('', 'ACME')).toBeNull();
    expect(buildChipPrompt(null, 'ACME')).toBeNull();
  });

  it('todas las plantillas son en español y no vacías', () => {
    for (const [enumKey, template] of Object.entries(CHIP_PROMPTS)) {
      expect(template.length).toBeGreaterThan(20);
      expect(template).toContain('{empresa}');
      // Sanity: sin placeholders sospechosos
      expect(template).not.toMatch(/\{(?!empresa)[^}]+\}/);
      // Sanity: cada enum es el snake_case canónico Intel
      expect(enumKey).toMatch(/^[a-z_]+$/);
    }
  });
});
