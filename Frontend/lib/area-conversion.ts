/**
 * Land Area Conversion Utilities
 * Database canonical storage remains Hectares (Ha).
 * Conversions:
 * - 1 Hectare = 2.47105 Acres
 * - 1 Hectare = 3.95 Vigha (KA, RJ, UP, MP, Default)
 * - 1 Hectare = 4.15 Vigha (GJ)
 */

export const HECTARE_TO_ACRE_RATIO = 2.47105;

export const VIGHA_PER_HECTARE_BY_STATE: Record<string, number> = {
  KA: 3.95,
  RJ: 3.95,
  UP: 3.95,
  MP: 3.95,
  GJ: 4.15,
  DEFAULT: 3.95,
};

export function hectaresToAcres(ha: number): number {
  if (!ha || isNaN(ha)) return 0;
  return Number((ha * HECTARE_TO_ACRE_RATIO).toFixed(2));
}

export function hectaresToVigha(ha: number, stateCode: string = "KA"): number {
  if (!ha || isNaN(ha)) return 0;
  const ratio = VIGHA_PER_HECTARE_BY_STATE[stateCode?.toUpperCase()] || VIGHA_PER_HECTARE_BY_STATE.DEFAULT;
  return Number((ha * ratio).toFixed(2));
}

export function formatLandArea(ha: number, stateCode: string = "KA"): string {
  if (!ha || isNaN(ha)) return "0 Acres (0 Ha)";
  const acres = hectaresToAcres(ha);
  const vigha = hectaresToVigha(ha, stateCode);
  const haFormatted = ha.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${acres.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Acres (~${vigha.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Vigha / ${haFormatted} Ha)`;
}

export function formatLandAreaShort(ha: number): string {
  if (!ha || isNaN(ha)) return "0 Acres (0 Ha)";
  const acres = hectaresToAcres(ha);
  const haFormatted = ha.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${acres.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Acres (~${haFormatted} Ha)`;
}
