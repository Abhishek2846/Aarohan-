/**
 * Legal Land Tax Rate Schedule under Indian Law:
 * 1. Agricultural Land (AGRICULTURAL): 0% Tax (Exempt under Income Tax Act Sec 10(37) & RFCTLARR Act 2013 Sec 96 for compulsory acquisition)
 * 2. Residential Land (RESIDENTIAL): 10% Tax (Sec 194LA TDS on compulsory acquisition)
 * 3. Commercial / Industrial Land (COMMERCIAL): 30% Tax (Capital Gains / Commercial Rate)
 * 4. Government / Forest (GOVERNMENT): 0% Tax (Public Exempt)
 */

export interface LandTaxSchedule {
  landCategory: string;
  ratePercent: number;
  sectionLaw: string;
  labelEn: string;
  labelHi: string;
}

export const LEGAL_LAND_TAX_SCHEDULE: Record<string, LandTaxSchedule> = {
  AGRICULTURAL: {
    landCategory: "AGRICULTURAL",
    ratePercent: 0,
    sectionLaw: "Section 10(37) Income Tax Act & Sec 96 RFCTLARR Act 2013 (0% Tax Exempt)",
    labelEn: "Agricultural Land (0% Tax - Exempt under Sec 10(37) & RFCTLARR Sec 96)",
    labelHi: "कृषि भूमि (0% कर - धारा 10(37) व धारा 96 के तहत पूरी छूट)",
  },
  RESIDENTIAL: {
    landCategory: "RESIDENTIAL",
    ratePercent: 10,
    sectionLaw: "Section 194LA Income Tax Act (10% TDS)",
    labelEn: "Residential Land (10% Tax - Sec 194LA TDS)",
    labelHi: "आवासीय भूमि (10% कर कटौती - धारा 194LA)",
  },
  COMMERCIAL: {
    landCategory: "COMMERCIAL",
    ratePercent: 30,
    sectionLaw: "Commercial Asset Tax Withholding (30% Tax)",
    labelEn: "Commercial / Industrial Land (30% Tax)",
    labelHi: "व्यावसायिक / औद्योगिक भूमि (30% कर)",
  },
  GOVERNMENT: {
    landCategory: "GOVERNMENT",
    ratePercent: 0,
    sectionLaw: "Government Public Land (0% Exempt)",
    labelEn: "Government / Public Land (0% Tax)",
    labelHi: "सरकारी भूमि (0% कर)",
  },
};

export function getLegalLandTaxRate(landTypeOrCategory?: string): number {
  if (!landTypeOrCategory) return 0; // Default Agricultural / Exempt
  const upper = String(landTypeOrCategory).toUpperCase().trim();
  if (
    upper.includes("AGRICULTUR") ||
    upper.includes("FARM") ||
    upper.includes("MULTI-CROP") ||
    upper.includes("IRRIGATED") ||
    upper === "AGRICULTURAL"
  ) {
    return 0; // 0% Tax Exempt under Sec 10(37)
  }
  if (upper.includes("RESIDENTIAL") || upper === "RESIDENTIAL") {
    return 10; // 10% TDS under Sec 194LA
  }
  if (upper.includes("COMMERCIAL") || upper.includes("INDUSTRIAL") || upper === "COMMERCIAL") {
    return 30; // 30% Commercial Tax
  }
  if (upper.includes("GOVT") || upper.includes("FOREST") || upper === "GOVERNMENT") {
    return 0; // 0% Govt Exempt
  }
  return 0; // Default Agricultural Exempt for Farmers
}

export function getLegalTaxLawReference(landTypeOrCategory?: string): string {
  const rate = getLegalLandTaxRate(landTypeOrCategory);
  if (rate === 0) return "Sec 10(37) Income Tax Act & Sec 96 RFCTLARR 2013 (0% Tax Exempt)";
  if (rate === 10) return "Sec 194LA Income Tax Act (10% TDS)";
  return "Commercial Tax Withholding (30% Tax)";
}
