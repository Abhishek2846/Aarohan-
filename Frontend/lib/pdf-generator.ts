import { jsPDF } from "jspdf";

export interface CitizenPdfData {
  name: string;
  nameHi?: string;
  khataNo: string;
  citizenId: string;
  village: string;
  taluk: string;
  district: string;
  ulpin: string;
  surveyNo: string;
  landType: string;
  totalAreaHa: number;
  acquiredAreaHa: number;
  retainedAreaHa: number;
  totalCompensation: number;
  acquiringCorridor: string;
}

export function downloadStatutoryPdf(docTitle: string, data?: Partial<CitizenPdfData>) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Official Civic Colors
  const navy = [10, 37, 64];        // #0A2540
  const blue = [30, 58, 138];       // #1E3A8A
  const emerald = [16, 149, 93];    // #10955D
  const darkSlate = [15, 23, 42];   // #0F172A
  const slate = [100, 116, 139];    // #64748B
  const borderCol = [226, 232, 240];// #E2E8F0
  const bgLight = [248, 250, 252];  // #F8FAFC

  // 1. Top Civic Header Band
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setFillColor(emerald[0], emerald[1], emerald[2]);
  doc.rect(0, 24, pageWidth, 2.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text("GOVERNMENT OF KARNATAKA", pageWidth / 2, 8.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(219, 234, 254);
  doc.text("REVENUE DEPARTMENT • SPECIAL LAND ACQUISITION OFFICE (CALA)", pageWidth / 2, 14, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(191, 219, 254);
  doc.text("BHOOMISETU STATUTORY CADASTRAL & LAND ACQUISITION PORTAL", pageWidth / 2, 19, { align: "center" });

  // 2. Gazette Document Title Box
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, 29.5, contentWidth, 20, 1.5, 1.5, "FD");

  // Pill Tag
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.roundedRect(margin + 4, 32, 54, 4.5, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("STATUTORY AUTHORITATIVE RECORD", margin + 31, 35.2, { align: "center" });

  // Title
  doc.setTextColor(blue[0], blue[1], blue[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(docTitle.toUpperCase(), margin + 4, 41.5);

  // Meta row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Gazette Docket Ref: KA-BLR/REV/2026/GZ-0041   |   Date: 10 September 2026   |   Taluk: Doddaballapur, Bengaluru Rural", margin + 4, 46.5);

  // 3. Section I: Landholder & Holding Specifications
  let y = 53;
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("I. REGISTERED LANDHOLDER & CADASTRAL HOLDING DETAILS", margin, y);
  y += 3;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, "FD");

  // Horizontal Grid Lines
  doc.line(margin, y + 8.5, margin + contentWidth, y + 8.5);
  doc.line(margin, y + 17, margin + contentWidth, y + 17);
  doc.line(margin, y + 25.5, margin + contentWidth, y + 25.5);

  // Vertical Center Divider
  doc.line(margin + contentWidth / 2, y, margin + contentWidth / 2, y + 34);

  const drawCell = (label: string, val: string, x: number, rowY: number, highlight = false) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(label, x + 3, rowY + 3.8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    if (highlight) {
      doc.setTextColor(emerald[0], emerald[1], emerald[2]);
    } else {
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    }
    doc.text(val, x + 3, rowY + 7.2);
  };

  const midX = margin + contentWidth / 2;
  const name = data?.name || "Rameshwar Sharma";
  const khata = data?.khataNo || "KHT-KA-BLR-8821";
  const ulpin = data?.ulpin || "KA-BLR-2026-0041";
  const survey = data?.surveyNo || "142/2A";
  const village = `${data?.village || "Doddaballapur"}, ${data?.district || "Bengaluru Rural"}`;
  const landType = data?.landType || "Agricultural (Irrigated Multi-Crop)";
  const totalArea = `${data?.totalAreaHa || 1.85} Ha (4.57 Acres)`;
  const acqArea = `${data?.acquiredAreaHa || 1.45} Ha (3.58 Acres) [78.4% Acquired]`;

  drawCell("REGISTERED LANDHOLDER", name, margin, y);
  drawCell("CITIZEN REFERENCE NO.", data?.citizenId || "CIT-KA-2026-8819", midX, y);

  drawCell("14-DIGIT BHU-ULPIN", ulpin, margin, y + 8.5);
  drawCell("KHATA NUMBER", khata, midX, y + 8.5);

  drawCell("SURVEY / KHASRA NUMBER", `${survey} (${village})`, margin, y + 17);
  drawCell("LAND CLASSIFICATION", landType, midX, y + 17);

  drawCell("TOTAL HOLDING EXTENT", totalArea, margin, y + 25.5);
  drawCell("ACQUIRED EXTENT (CORRIDOR)", acqArea, midX, y + 25.5, true);

  y += 41;

  // 4. Section II: Specialized Content Based on Document Title
  const isAwardDoc = docTitle.toLowerCase().includes("award") || docTitle.toLowerCase().includes("section 23");
  const isJmsDoc = docTitle.toLowerCase().includes("jms") || docTitle.toLowerCase().includes("survey") || docTitle.toLowerCase().includes("pillar");
  const isPfmsDoc = docTitle.toLowerCase().includes("pfms") || docTitle.toLowerCase().includes("benefit transfer");

  if (isAwardDoc) {
    // ----------------- TEMPLATE A: Form IV Statutory Award Statement -----------------
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("II. STATUTORY COMPENSATION CALCULATION STATEMENT (FORM IV - SEC 23)", margin, y);
    y += 4;

    // Table Header
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(margin, y, contentWidth, 6.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("ITEM", margin + 3, y + 4.5);
    doc.text("STATUTORY COMPONENT", margin + 18, y + 4.5);
    doc.text("LEGAL PROVISION", margin + 74, y + 4.5);
    doc.text("CALCULATION / BASIS", margin + 115, y + 4.5);
    doc.text("AMOUNT (INR)", margin + 155, y + 4.5);
    y += 6.5;

    const items = [
      { no: "1", comp: "Basic Land Market Value", prov: "RFCTLARR Sec 26(1)", basis: "INR 35,00,000/Ha x 1.45 Ha", amt: "50,75,000.00" },
      { no: "2", comp: "Rural Multiplier Factor", prov: "RFCTLARR Sec 26(2)", basis: "Factor 1.00x applied", amt: "50,75,000.00" },
      { no: "3", comp: "Mandatory Solatium (100%)", prov: "RFCTLARR Sec 30(1)", basis: "100% of Market Value", amt: "50,75,000.00" },
      { no: "4", comp: "Demarcated Assets on Plot", prov: "RFCTLARR Sec 29(1)", basis: "Borewell & 42 Trees (JMS)", amt: "18,65,000.00" },
      { no: "5", comp: "Additional Statutory Interest", prov: "RFCTLARR Sec 30(3)", basis: "12% p.a. from Sec 11 date", amt: "5,07,400.00" },
    ];

    items.forEach((it, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, contentWidth, 7, "F");
      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.line(margin, y + 7, margin + contentWidth, y + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(it.no, margin + 3, y + 4.8);
      doc.text(it.comp, margin + 18, y + 4.8);
      doc.text(it.prov, margin + 74, y + 4.8);
      doc.text(it.basis, margin + 115, y + 4.8);

      doc.setFont("helvetica", "bold");
      doc.text(it.amt, margin + 180, y + 4.8, { align: "right" });
      y += 7;
    });

    // Total Award Box
    y += 2;
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(emerald[0], emerald[1], emerald[2]);
    doc.text("TOTAL STATUTORY COMPENSATION AWARD (ENACTED UNDER SECTION 23):", margin + 4, y + 5.5);

    doc.setFontSize(11);
    doc.text("INR 1,25,22,400.00", margin + contentWidth - 4, y + 6, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text("(Rupees One Crore Twenty-Five Lakhs Twenty-Two Thousand Four Hundred Only)", margin + 4, y + 10.5);

    y += 18;

  } else if (isJmsDoc) {
    // ----------------- TEMPLATE B: Joint Measurement Survey (JMS) -----------------
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("II. JOINT MEASUREMENT SURVEY (JMS) CERTIFIED D-GPS BOUNDARY PILLARS", margin, y);
    y += 4;

    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(margin, y, contentWidth, 6.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("POINT ID", margin + 3, y + 4.5);
    doc.text("FEATURE DEMARCATED", margin + 22, y + 4.5);
    doc.text("LATITUDE (°N)", margin + 82, y + 4.5);
    doc.text("LONGITUDE (°E)", margin + 115, y + 4.5);
    doc.text("ACCURACY", margin + 148, y + 4.5);
    doc.text("STATUS", margin + 168, y + 4.5);
    y += 6.5;

    const points = [
      { id: "P-01", feat: "Corner Boundary Stone Pillar #1", lat: "13.29350° N", lon: "77.53300° E", acc: "±1.4 m", status: "Fixed & Sealed" },
      { id: "P-02", feat: "Boundary Demarcation Pillar #2", lat: "13.29410° N", lon: "77.53420° E", acc: "±1.2 m", status: "Fixed & Sealed" },
      { id: "P-03", feat: "Corner Boundary Stone Pillar #3", lat: "13.29520° N", lon: "77.53610° E", acc: "±1.5 m", status: "Fixed & Sealed" },
      { id: "P-04", feat: "Boundary Demarcation Pillar #4", lat: "13.29480° N", lon: "77.53750° E", acc: "±1.4 m", status: "Fixed & Sealed" },
      { id: "W-01", feat: "Active Tube-Well & Pump House", lat: "13.29450° N", lon: "77.53520° E", acc: "±1.8 m", status: "Asset Inventoried" },
      { id: "T-01", feat: "Teak & Mango Orchard (42 Trees)", lat: "13.29390° N", lon: "77.53480° E", acc: "±2.0 m", status: "Valuation Certified" },
    ];

    points.forEach((pt, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, contentWidth, 6.5, "F");
      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.line(margin, y + 6.5, margin + contentWidth, y + 6.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(blue[0], blue[1], blue[2]);
      doc.text(pt.id, margin + 3, y + 4.5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(pt.feat, margin + 22, y + 4.5);
      doc.text(pt.lat, margin + 82, y + 4.5);
      doc.text(pt.lon, margin + 115, y + 4.5);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(emerald[0], emerald[1], emerald[2]);
      doc.text(pt.acc, margin + 148, y + 4.5);
      doc.text(pt.status, margin + 168, y + 4.5);
      y += 6.5;
    });

    y += 12;

  } else if (isPfmsDoc) {
    // ----------------- TEMPLATE C: PFMS Direct Benefit Transfer Mandate -----------------
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("II. PUBLIC FINANCIAL MANAGEMENT SYSTEM (PFMS) DISBURSEMENT MANDATE", margin, y);
    y += 4;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.roundedRect(margin, y, contentWidth, 38, 1.5, 1.5, "FD");

    const pCol2 = margin + 55;
    const pCol4 = margin + 140;

    const pRow = (l1: string, v1: string, l2: string, v2: string, ry: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.text(l1, margin + 4, ry);
      doc.text(l2, margin + 95, ry);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(v1, pCol2, ry);
      doc.text(v2, pCol4, ry);
    };

    pRow("PFMS Scheme Code:", "9142 (NHAI Highway Acquisition)", "Mandate Status:", "APPROVED & AUTHENTICATED", y + 7);
    pRow("Beneficiary Name:", name, "Aadhaar Bridge (ABPS):", "Linked & Active (UIDAI)", y + 15);
    pRow("Designated Bank:", "State Bank of India", "Branch / IFSC:", "Doddaballapur / SBIN0004128", y + 23);
    pRow("Bank Account (Masked):", "XXXXXXXX4921", "Total DBT Disbursal:", "INR 1,25,22,400.00", y + 31);

    y += 44;

  } else {
    // ----------------- TEMPLATE D: Section 11 Statutory Gazette Proclamation -----------------
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("II. STATUTORY PRELIMINARY NOTIFICATION (RFCTLARR ACT SECTION 11)", margin, y);
    y += 4;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.roundedRect(margin, y, contentWidth, 48, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    const paras = [
      "1. WHEREAS, it appears to the Competent Authority that land in Revenue Village Doddaballapur is required for a statutory public infrastructure purpose, namely the Bengaluru Satellite Town Ring Road (STRR NH-948A Pkg 2).",
      "2. NOW, THEREFORE, under Section 11(1) of RFCTLARR Act 2013, notice is officially promulgated to all persons interested in Khasra No. 142/2A (ULPIN KA-BLR-2026-0041). Any objection under Section 15 may be submitted in writing within 60 days.",
      "3. Transactions and encumbrances on the demarcated extent are strictly restricted under Section 11(4). The Joint Measurement Survey and itemized compensation determination will be executed under Sections 23-30.",
    ];

    let py = y + 7;
    paras.forEach((p) => {
      const lines = doc.splitTextToSize(p, contentWidth - 8);
      doc.text(lines, margin + 4, py);
      py += lines.length * 4.2 + 2;
    });

    y += 54;
  }

  // 5. Section III: Cryptographic Seal & SLAO Digital Signature Block
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("III. DIGITAL INTEGRITY SEAL & STATUTORY CERTIFICATION", margin, y);
  y += 4;

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5, "FD");

  // Left Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("DIGITALLY SIGNED & E-SEALED BY:", margin + 4, y + 6.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("Dr. Priya Sundaram, IAS", margin + 4, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Special Land Acquisition Officer (CALA) & Competent Authority", margin + 4, y + 16.5);
  doc.text("Department of Revenue, Govt. of Karnataka (BhoomiSetu Authority)", margin + 4, y + 20.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text("SHA-256 Digest: 8f2c3d9a7e104b7c126d4059fa238c11e04875cb823491f09e4f7a21b38d098e", margin + 4, y + 26);
  doc.text("Timestamp: 10 Sep 2026, 09:10:00 IST  |  NIC e-Sign PKI Certificate Verified", margin + 4, y + 29.5);

  // Right Seal Badge
  const sealW = 42;
  const sealH = 22;
  const sealX = margin + contentWidth - sealW - 4;
  const sealY = y + 5;

  doc.setFillColor(emerald[0], emerald[1], emerald[2]);
  doc.roundedRect(sealX, sealY, sealW, sealH, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("BHOOMISETU", sealX + sealW / 2, sealY + 6.5, { align: "center" });
  doc.setFontSize(7);
  doc.text("OFFICIAL STATUTORY SEAL", sealX + sealW / 2, sealY + 11.5, { align: "center" });
  doc.setFontSize(6);
  doc.text("GOVT OF KARNATAKA", sealX + sealW / 2, sealY + 16, { align: "center" });
  doc.text("VERIFIED & ADMISSIBLE", sealX + sealW / 2, sealY + 19.5, { align: "center" });

  // 6. Page Footer
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Legally admissible computer-generated gazette certificate under Section 65B of Indian Evidence Act 1872 & Information Technology Act 2000.", margin, pageHeight - 7.5);
  doc.text("Page 1 of 1  |  BhoomiSetu (bhoomi-setu.gov.in)", margin + contentWidth, pageHeight - 7.5, { align: "right" });

  // Native File Save
  const cleanName = docTitle.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`${cleanName}.pdf`);
}

export interface AuditorReportData {
  reportTitle: string;
  auditScope: string;
  totalAudited: number;
  complianceRate: number;
  anomaliesDetected: number;
  avgQualityScore: number;
  anomalies: Array<{
    id: string;
    caseRef: string;
    parcelUlpin: string;
    issue: string;
    amount: string;
    districtAvg: string;
    risk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    recommendation: string;
  }>;
}

export function downloadAuditorComplianceReportPdf(
  reportTitle: string = "CAG Statutory Compliance & Anomaly Audit Report",
  data?: Partial<AuditorReportData>
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  const navy = [10, 37, 64];        // #0A2540
  const amber = [217, 119, 6];      // #D97706
  const emerald = [16, 149, 93];    // #10955D
  const darkSlate = [15, 23, 42];   // #0F172A
  const slate = [100, 116, 139];    // #64748B
  const borderCol = [226, 232, 240];// #E2E8F0
  const bgLight = [248, 250, 252];  // #F8FAFC
  const rose = [220, 38, 38];       // #DC2626

  // 1. Top Civic Header Band
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setFillColor(amber[0], amber[1], amber[2]);
  doc.rect(0, 24, pageWidth, 2.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text("COMPTROLLER & AUDITOR GENERAL OF INDIA (CAG)", pageWidth / 2, 8.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(254, 243, 199);
  doc.text("DIRECTOR GENERAL OF AUDIT (INFRASTRUCTURE & STATUTORY COMPLIANCE)", pageWidth / 2, 14, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text("BHOOMISETU NATIONAL LAND ACQUISITION MANAGEMENT PLATFORM (SIH 2026)", pageWidth / 2, 19, { align: "center" });

  // 2. Gazette Document Title Box
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, 29.5, contentWidth, 20, 1.5, 1.5, "FD");

  // Pill Tag
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.roundedRect(margin + 4, 32, 60, 4.5, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("OFFICIAL STATUTORY AUDIT REPORT", margin + 34, 35.2, { align: "center" });

  // Title
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(reportTitle.toUpperCase(), margin + 4, 41.5);

  // Meta row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Audit Ref: CAG/BHOOMI/2026/AUD-0892   |   Date: 10 September 2026   |   Lead Auditor: K. N. Raghavan, IA&AS", margin + 4, 46.5);

  // 3. Section I: Executive Audit Summary KPI Metrics
  let y = 53;
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("I. EXECUTIVE STATUTORY AUDIT SUMMARY & SURVEILLANCE TELEMETRY", margin, y);
  y += 3;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 25, 1.5, 1.5, "FD");

  const totalAudited = data?.totalAudited || 193;
  const complianceRate = data?.complianceRate || 96.8;
  const anomaliesCount = data?.anomaliesDetected || 5;
  const avgQualityScore = data?.avgQualityScore || 88.4;

  const colW = contentWidth / 4;
  const kpis = [
    { label: "TOTAL DOCKETS AUDITED", val: `${totalAudited} Cases`, sub: "100% Pipeline Scope", col: navy },
    { label: "CAG COMPLIANCE RATE", val: `${complianceRate}%`, sub: "Statutory Adherence", col: emerald },
    { label: "ACTIVE ANOMALY FLAGS", val: `${anomaliesCount} Flags`, sub: "2 High / 1 Critical", col: rose },
    { label: "DATA QUALITY SCORE", val: `${avgQualityScore} / 100`, sub: "Verified Geodatabase", col: amber },
  ];

  kpis.forEach((kpi, idx) => {
    const kX = margin + idx * colW;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(kpi.label, kX + 4, y + 6);

    doc.setFontSize(13);
    doc.setTextColor(kpi.col[0], kpi.col[1], kpi.col[2]);
    doc.text(kpi.val, kX + 4, y + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(kpi.sub, kX + 4, y + 20);

    if (idx < 3) {
      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.line(kX + colW, y + 2, kX + colW, y + 23);
    }
  });

  // 4. Section II: Statutory Anomaly & Risk Register
  y += 31;
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("II. DETECTED STATUTORY ANOMALIES & VALUATION VARIANCE REGISTER", margin, y);
  y += 4;

  // Table Header
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, y, contentWidth, 7, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("FLAG ID", margin + 3, y + 4.8);
  doc.text("CASE & ULPIN REF", margin + 22, y + 4.8);
  doc.text("ANOMALY DESCRIPTION & STATUTORY PROVISION", margin + 68, y + 4.8);
  doc.text("VARIANCE / AMOUNT", margin + 138, y + 4.8);
  doc.text("SEVERITY", margin + 170, y + 4.8);

  y += 7;

  const anomaliesList = data?.anomalies && data.anomalies.length > 0 ? data.anomalies : [
    {
      id: "ANOM-01",
      caseRef: "AC-2026-KA-001234",
      parcelUlpin: "KA-BLR-2026-0041",
      issue: "Compensation per acre is 3.2x district average (Section 26 Valuation Discrepancy)",
      amount: "Rs 45,00,000 / Acre",
      districtAvg: "District Avg: Rs 14,00,000 / Acre",
      risk: "CRITICAL" as const,
      recommendation: "Review land valuation report and approve with additional documentation",
    },
    {
      id: "ANOM-02",
      caseRef: "AC-2026-DEL-0089",
      parcelUlpin: "DL-SW-2026-0182",
      issue: "Public objection inquiry delayed beyond 60-day statutory SLA (Section 15 Overrun)",
      amount: "78 Days Pending",
      districtAvg: "Statutory SLA: 60 Days",
      risk: "HIGH" as const,
      recommendation: "Issue notice to CALA Sub-Divisional Magistrate for immediate hearing record",
    },
    {
      id: "ANOM-03",
      caseRef: "AC-2026-MH-0341",
      parcelUlpin: "MH-PUN-2026-0094",
      issue: "Missing geo-tagged field boundary photos for D-GPS pillar demarcations",
      amount: "Telemetry Missing",
      districtAvg: "Clause 4.2 Field Standard",
      risk: "HIGH" as const,
      recommendation: "Dispatch survey team for timestamped telemetry and photo capture before award",
    },
    {
      id: "ANOM-04",
      caseRef: "AC-2026-KA-001239",
      parcelUlpin: "KA-BLR-2026-0078",
      issue: "Duplicate beneficiary Aadhaar reference detected in parallel PFMS mandate batch",
      amount: "Rs 28,40,000 Payout",
      districtAvg: "Batch PFMS-2026-09-A",
      risk: "CRITICAL" as const,
      recommendation: "Hold payment token in PFMS gateway; verify Khata landholder identity",
    },
    {
      id: "ANOM-05",
      caseRef: "AC-2026-RJ-0019",
      parcelUlpin: "RJ-JAI-2026-0211",
      issue: "Rural solatium multiplier applied at 1.25x instead of mandated 1.50x statutory rate",
      amount: "Rs 6,20,000 Deficit",
      districtAvg: "First Schedule RFCTLARR",
      risk: "MEDIUM" as const,
      recommendation: "Recalculate Form IV Section 23 award prior to DBT disbursement",
    },
  ];

  anomaliesList.forEach((anom, idx) => {
    const rowH = 14;
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, y, contentWidth, rowH, "F");
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.line(margin, y + rowH, margin + contentWidth, y + rowH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(anom.id, margin + 3, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(anom.caseRef, margin + 22, y + 4.5);
    doc.setFont("helvetica", "bold");
    doc.text(anom.parcelUlpin, margin + 22, y + 8.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(doc.splitTextToSize(anom.issue, 66), margin + 68, y + 4.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(`Action: ${doc.splitTextToSize(anom.recommendation, 66)[0]}`, margin + 68, y + 11.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(anom.amount, margin + 138, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(anom.districtAvg, margin + 138, y + 9);

    const severityColor = anom.risk === "CRITICAL" ? [185, 28, 28] : anom.risk === "HIGH" ? [194, 65, 12] : [29, 78, 216];
    doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
    doc.roundedRect(margin + 167, y + 3.5, 13, 5, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.text(anom.risk, margin + 173.5, y + 7, { align: "center" });

    y += rowH;
  });

  // 5. Section III: Cryptographic SHA-256 Ledger Audit Proof
  y += 4;
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("III. IMMUTABLE SHA-256 HASH CHAIN VERIFICATION & CRYPTOGRAPHIC LEDGER PROOF", margin, y);
  y += 3;

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("CHAIN BLOCK HEAD: Block #1042  |  Timestamp: 10 Sep 2026, 14:32:18 IST  |  Status: 100% VERIFIED", margin + 4, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Previous Block Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", margin + 4, y + 10.5);
  doc.text("Current Block Hash:  7a2f1b098c4d5e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f", margin + 4, y + 15);
  doc.text("Merkle Root Digest:  4f81c9b2e0d3a5f78912bc44e678a109fe23cb419082da410972cb8890ae112c", margin + 4, y + 19.5);

  // 6. Section IV: Statutory Auditor Certification & Digital Sign-off
  y += 28;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("AUDITOR STATUTORY CERTIFICATION & LEGAL SIGN-OFF", margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  const certText = "This audit report has been compiled under the statutory mandate of Comptroller and Auditor General of India (CAG) in accordance with the RFCTLARR Act 2013 and Information Technology Act 2000. All logs, hash states, and telemetry data have been cryptographically verified against the BhoomiSetu national ledger. Any unauthorized stage deviations or compensation anomalies flagged above require mandatory action by the concerned District Officer / CALA within 15 statutory working days.";
  doc.text(doc.splitTextToSize(certText, contentWidth - 48), margin + 4, y + 11.5);

  // Sign-off box
  const sigX = margin + contentWidth - 44;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(sigX, y + 4, 40, 26, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("DIGITALLY SIGNED", sigX + 20, y + 9.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("K. N. Raghavan, IA&AS", sigX + 20, y + 14.5, { align: "center" });
  doc.text("DG of Audit, CAG India", sigX + 20, y + 18, { align: "center" });
  doc.text("CCA Class-3 DSC Token", sigX + 20, y + 21.5, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text("STATUS: CERTIFIED", sigX + 20, y + 25.5, { align: "center" });

  // 7. Page Footer
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.line(margin, pageHeight - 11, margin + contentWidth, pageHeight - 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Statutory compliance audit certificate generated via BhoomiSetu. Legally admissible under Section 65B of Indian Evidence Act 1872.", margin, pageHeight - 6.5);
  doc.text("Page 1 of 1  |  cag.gov.in / bhoomi-setu.gov.in", margin + contentWidth, pageHeight - 6.5, { align: "right" });

  const cleanName = reportTitle.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`${cleanName}.pdf`);
}

export interface DistrictPdfData {
  officerName?: string;
  designation?: string;
  district?: string;
  state?: string;
  activeCases?: number;
  totalParcels?: number;
  demarcatedParcels?: number;
  totalCompensationINR?: number;
  possessionCompletedPct?: number;
  pendingGrievances?: number;
  scope?: string;
}

export function generateDistrictOfficerPdf(reportTitle: string, data?: Partial<DistrictPdfData>, isHi: boolean = false) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const navy = [10, 37, 64];        // #0A2540
  const blue = [30, 58, 138];       // #1E3A8A
  const emerald = [16, 149, 93];    // #10955D
  const slate = [100, 116, 139];    // #64748B
  const borderCol = [226, 232, 240];// #E2E8F0
  const bgLight = [248, 250, 252];  // #F8FAFC

  // 1. Top Civic Header Band
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setFillColor(emerald[0], emerald[1], emerald[2]);
  doc.rect(0, 24, pageWidth, 2.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("GOVERNMENT OF KARNATAKA • DISTRICT ADMINISTRATION", pageWidth / 2, 8.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(219, 234, 254);
  doc.text("OFFICE OF THE DEPUTY COMMISSIONER & DISTRICT MAGISTRATE (CALA)", pageWidth / 2, 14, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(191, 219, 254);
  doc.text("BHOOMISETU DISTRICT LAND ACQUISITION & REVENUE ADJUDICATION CONSOLE", pageWidth / 2, 19, { align: "center" });

  // 2. Document Title Box
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, 29.5, contentWidth, 20, 1.5, 1.5, "FD");

  doc.setFillColor(blue[0], blue[1], blue[2]);
  doc.roundedRect(margin + 4, 33, 38, 4.5, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text("OFFICIAL DISTRICT ORDER", margin + 23, 36.2, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(reportTitle.toUpperCase(), margin + 4, 43);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(`District: ${data?.district || "Bengaluru Rural"} • Competent Authority (CALA) • Ref: DC-BLR-R/LAC/2026-904`, margin + 4, 47);

  // Metadata block right
  const rightColX = margin + contentWidth - 4;
  doc.text(`Date: 10 September 2026`, rightColX, 36, { align: "right" });
  doc.text(`Jurisdiction: 4 Taluks (540 Land Plots)`, rightColX, 41, { align: "right" });
  doc.text(`Statutory Act: RFCTLARR Act 2013`, rightColX, 46, { align: "right" });

  let y = 53;

  // 3. Officer Profile Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("OFFICER IN CHARGE:", margin + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(`${data?.officerName || "Shri Manjunath R., IAS"}, ${data?.designation || "Deputy Commissioner & District Magistrate"}`, margin + 35, y + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("AUTHORITY LEVEL:", margin + 4, y + 10.5);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Appellate Land Authority, Section 15 Hearing Officer, Section 23 Award Signatory", margin + 35, y + 10.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("SECURITY TOKEN:", margin + 4, y + 15.5);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text("CCA Class-3 DSC Token (e-Sign KA-BLR-0042) • Certified & Enforced", margin + 35, y + 15.5);

  y += 24;

  // 4. District KPI Summary Grid
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("I. EXECUTIVE STATUTORY PERFORMANCE & LAND METRICS", margin, y);
  y += 3;

  const cardW = (contentWidth - 9) / 4;
  const cardH = 16;
  const kpis = [
    { label: "Active Case Files", val: `${data?.activeCases || 18} Cases`, sub: "Across 4 Corridors" },
    { label: "Land Plots Demarcated", val: `${data?.demarcatedParcels || 460} / ${data?.totalParcels || 540}`, sub: "85.2% Field Locked" },
    { label: "Total Bank Payments", val: `₹ ${( (data?.totalCompensationINR || 1295000000) / 10000000 ).toFixed(2)} Cr`, sub: "100% Direct Payouts" },
    { label: "Possession Completed", val: `${data?.possessionCompletedPct || 78.3}%`, sub: "Sec 38 Handover" },
  ];

  kpis.forEach((kpi, idx) => {
    const kx = margin + idx * (cardW + 3);
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.roundedRect(kx, y, cardW, cardH, 1, 1, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(kpi.label.toUpperCase(), kx + 3, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(kpi.val, kx + 3, y + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(emerald[0], emerald[1], emerald[2]);
    doc.text(kpi.sub, kx + 3, y + 14);
  });

  y += cardH + 7;

  // 5. Section II: Major Infrastructure Packages in District
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("II. ACTIVE INFRASTRUCTURE ACQUISITION PACKAGES", margin, y);
  y += 3;

  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, y, contentWidth, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text("PACKAGE / CASE NUMBER", margin + 3, y + 3.8);
  doc.text("CORRIDOR PROJECT", margin + 44, y + 3.8);
  doc.text("CURRENT STAGE", margin + 98, y + 3.8);
  doc.text("EXTENT (HA)", margin + 138, y + 3.8);
  doc.text("STATUS", margin + 162, y + 3.8);
  y += 5.5;

  const packages = [
    { no: "LAC/2026/BLR-R/014", prj: "Bengaluru STRR Ring Road Pkg 2", stage: "Sec 15 Objections Hearing", ha: "124.5 Ha", status: "In Hearing" },
    { no: "LAC/2026/BLR-R/015", prj: "Bengaluru-Chennai Expressway Link", stage: "Sec 23 Award Inquiry", ha: "186.2 Ha", status: "To Sign" },
    { no: "LAC/2026/BLR-R/016", prj: "Suburban Rail Corridor (K-RIDE)", stage: "Sec 11 Preliminary Published", ha: "54.8 Ha", status: "Survey Done" },
    { no: "LAC/2026/BLR-R/017", prj: "Industrial Corridor Doddaballapur", stage: "Sec 38 Possession Memo", ha: "92.0 Ha", status: "Handing Over" },
    { no: "LAC/2026/BLR-R/018", prj: "Devanahalli Aerotropolis Link", stage: "Sec 19 Declaration Enacted", ha: "82.5 Ha", status: "Valuation" },
  ];

  packages.forEach((pkg, idx) => {
    const rowBg = idx % 2 === 0 ? [255, 255, 255] : bgLight;
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, y, contentWidth, 5.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(pkg.no, margin + 3, y + 3.8);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(pkg.prj, margin + 44, y + 3.8);
    doc.text(pkg.stage, margin + 98, y + 3.8);
    doc.text(pkg.ha, margin + 138, y + 3.8);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.text(pkg.status, margin + 162, y + 3.8);

    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);
    y += 5.5;
  });

  y += 6;

  // 6. Section III: Statutory Legal Declaration & Verification Notice
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("III. STATUTORY DECLARATION & ADJUDICATION VERDICT", margin, y);
  y += 3;

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  const declText = "I, the undersigned Competent Authority for Land Acquisition (CALA) and District Magistrate, Bengaluru Rural District, hereby certify that the statutory processes for the aforementioned acquisition packages are proceeding in strict conformity with the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013 (RFCTLARR). All boundary demarcation coordinates have been field-verified and authenticated with tamper-proof security stamps.";
  doc.text(doc.splitTextToSize(declText, contentWidth - 8), margin + 4, y + 5.5);

  y += 26;

  // 7. Sign-off & Digital DSC Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 28, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("OFFICIAL DISTRICT COLLECTOR DSC ATTESTATION", margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("This document is sealed electronically using the District Magistrate's Class-3 Digital Signature Certificate. Admissible under Section 65B of the Indian Evidence Act 1872 and verified by the BhoomiSetu National Governance Ledger.", margin + 4, y + 12, { maxWidth: contentWidth - 52 });

  const sigX = margin + contentWidth - 46;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(sigX, y + 3, 42, 22, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("DIGITALLY SIGNED", sigX + 21, y + 7.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Shri Manjunath R., IAS", sigX + 21, y + 11.5, { align: "center" });
  doc.text("Deputy Commissioner & DM", sigX + 21, y + 15, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text("VERIFIED & ADMISSIBLE", sigX + 21, y + 19, { align: "center" });

  // 8. Footer
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.line(margin, pageHeight - 11, margin + contentWidth, pageHeight - 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("District Land Acquisition Administration • Government of Karnataka • bhoomi-setu.gov.in", margin, pageHeight - 6.5);
  doc.text("Page 1 of 1  |  Official Sealed Copy", margin + contentWidth, pageHeight - 6.5, { align: "right" });

  const cleanName = reportTitle.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`${cleanName}.pdf`);
}

export interface StatePdfData {
  reportTitle: string;
  stateName?: string;
  principalSecretary?: string;
  totalProjects?: number;
  activeCases?: number;
  completedCases?: number;
  compensationDisbursed?: string;
  slaRate?: string;
  budgetUtilization?: string;
  districtsData?: Array<{ name: string; targetHa: number; acquiredHa: number; completion: string; status: string }>;
}

export function generateStateAuthorityPdf(data: StatePdfData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const navy = [10, 37, 64];
  const blue = [30, 58, 138];
  const emerald = [16, 149, 93];
  const slate = [100, 116, 139];
  const borderCol = [226, 232, 240];
  const bgLight = [248, 250, 252];

  // 1. Top Civic Header Band
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setFillColor(emerald[0], emerald[1], emerald[2]);
  doc.rect(0, 24, pageWidth, 2.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`GOVERNMENT OF ${data.stateName?.toUpperCase() || "KARNATAKA"}`, pageWidth / 2, 8.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(219, 234, 254);
  doc.text("REVENUE DEPARTMENT • OFFICE OF THE PRINCIPAL SECRETARY", pageWidth / 2, 14, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(147, 197, 253);
  doc.text("State Land Acquisition Oversight & Statutory Gazette Administration", pageWidth / 2, 19, { align: "center" });

  // 2. Report Title & Ref
  let y = 33;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(data.reportTitle.toUpperCase(), margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(`Doc Ref: KA-STATE-REV-2026-MEMO-${Math.floor(1000 + Math.random() * 9000)}`, margin + contentWidth, y, { align: "right" });

  y += 4.5;
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.line(margin, y, margin + contentWidth, y);

  // 3. Officer Profile Block
  y += 5;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("EXECUTIVE STATE AUTHORITY PROFILE", margin + 4, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(`Competent Authority: ${data.principalSecretary || "Shri Rajeshwar Rao, IAS"}`, margin + 4, y + 10);
  doc.text("Designation: Principal Secretary (Revenue), Government of Karnataka", margin + 4, y + 14.5);
  doc.text("Statutory Jurisdiction: All 31 Districts (Revenue Divisions: Bengaluru, Mysuru, Belagavi, Kalaburagi)", margin + 85, y + 10);
  doc.text("State Digital Seal: KA-REV-SEC-0019 (Authenticated)", margin + 85, y + 14.5);

  // 4. State Performance KPIs
  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("I. STATE REVENUE PERFORMANCE BENCHMARKS", margin, y);

  y += 3.5;
  const colW = contentWidth / 4;
  const kpis = [
    { label: "STATE CORRIDORS", val: `${data.totalProjects || 42} Projects` },
    { label: "ACTIVE CASES", val: `${data.activeCases || 57} Cases` },
    { label: "DISBURSED (PFMS)", val: data.compensationDisbursed || "Rs 4,280 Cr" },
    { label: "SLA COMPLIANCE", val: data.slaRate || "88.4%" },
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = margin + idx * colW;
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.roundedRect(kpiX, y, colW - 2, 13, 1, 1, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(kpi.label, kpiX + 3, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(kpi.val, kpiX + 3, y + 10);
  });

  // 5. Districts Progress Table
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("II. DISTRICT-WISE ACQUISITION PROGRESS & TARGETS", margin, y);

  y += 3.5;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, y, contentWidth, 5.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text("DISTRICT NAME", margin + 3, y + 3.8);
  doc.text("REVENUE DIVISION", margin + 50, y + 3.8);
  doc.text("TARGET (HA)", margin + 95, y + 3.8);
  doc.text("POSSESSION (HA)", margin + 125, y + 3.8);
  doc.text("COMPLETION %", margin + 158, y + 3.8);

  const districts = data.districtsData || [
    { name: "Bengaluru Rural", targetHa: 380, acquiredHa: 310, completion: "81.6%", status: "On Track" },
    { name: "Tumakuru", targetHa: 450, acquiredHa: 320, completion: "71.1%", status: "Survey Lag" },
    { name: "Ramanagara", targetHa: 290, acquiredHa: 245, completion: "84.5%", status: "Exceeding" },
    { name: "Kolar", targetHa: 210, acquiredHa: 190, completion: "90.5%", status: "Top Performer" },
    { name: "Chikkaballapura", targetHa: 340, acquiredHa: 215, completion: "63.2%", status: "Action Required" },
    { name: "Mandya", targetHa: 280, acquiredHa: 250, completion: "89.3%", status: "Exceeding" },
  ];

  y += 5.5;
  districts.forEach((d, idx) => {
    const rowBg = idx % 2 === 0 ? [255, 255, 255] : bgLight;
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, y, contentWidth, 5.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(d.name, margin + 3, y + 3.8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text("Bengaluru Division", margin + 50, y + 3.8);
    doc.text(`${d.targetHa} Ha`, margin + 95, y + 3.8);
    doc.text(`${d.acquiredHa} Ha`, margin + 125, y + 3.8);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.text(d.completion, margin + 158, y + 3.8);

    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);
    y += 5.5;
  });

  // 6. Section III: State Executive Declaration
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("III. EXECUTIVE RATIFICATION & STATE GAZETTE DIRECTIVE", margin, y);
  y += 3;

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  const declText = "The Government of Karnataka Revenue Department has reviewed the land acquisition status across all notified infrastructure packages under the RFCTLARR Act, 2013 and Karnataka Land Acquisition Rules. Directives have been transmitted to the Deputy Commissioners & SLAOs for immediate clearance of pending Section 11 preliminary notifications and Section 19 final declarations.";
  doc.text(doc.splitTextToSize(declText, contentWidth - 8), margin + 4, y + 5.5);

  y += 26;

  // 7. State Seal & Digital Sign-off
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 28, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("OFFICIAL STATE GOVERNMENT EXECUTIVE SEAL", margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Issued under the authority of the Principal Secretary (Revenue), Government of Karnataka. Sealed electronically in accordance with the IT Act 2000 and Section 65B of the Indian Evidence Act.", margin + 4, y + 12, { maxWidth: contentWidth - 52 });

  const sigX = margin + contentWidth - 46;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(sigX, y + 3, 42, 22, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("DIGITALLY SEALED", sigX + 21, y + 7.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Shri Rajeshwar Rao, IAS", sigX + 21, y + 11.5, { align: "center" });
  doc.text("Principal Secretary (Revenue)", sigX + 21, y + 15, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text("AUTHENTICATED", sigX + 21, y + 19, { align: "center" });

  // 8. Footer
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.line(margin, pageHeight - 11, margin + contentWidth, pageHeight - 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("State Revenue Administration • Government of Karnataka • bhoomi-setu.gov.in", margin, pageHeight - 6.5);
  doc.text("Page 1 of 1  |  Official State Record", margin + contentWidth, pageHeight - 6.5, { align: "right" });

  const cleanName = data.reportTitle.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`${cleanName}.pdf`);
}

export interface CentralMinistryPdfData {
  reportTitle: string;
  totalProjects: number;
  totalCases: number;
  completedCases: number;
  totalAreaHa: number;
  totalCompensationCr: number;
  nationalSlaCompliance: number;
  pendingEscalations: number;
  stateRankings: Array<{
    state: string;
    projects: number;
    acquiredHa: number;
    targetHa: number;
    slaPct: number;
    status: string;
  }>;
}

export function generateCentralMinistryPdf(data: CentralMinistryPdfData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Civic Colors
  const carbon = [23, 23, 22];     // #171716
  const terracotta = [239, 91, 42];// #EF5B2A
  const emerald = [21, 128, 61];   // #15803D
  const slate = [104, 101, 94];    // #68655E
  const borderCol = [216, 211, 201];// #D8D3C9
  const bgLight = [244, 241, 234]; // #F4F1EA

  // 1. Tricolor Top Stripe
  doc.setFillColor(terracotta[0], terracotta[1], terracotta[2]);
  doc.rect(0, 0, pageWidth / 3, 2.5, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(pageWidth / 3, 0, pageWidth / 3, 2.5, "F");
  doc.setFillColor(emerald[0], emerald[1], emerald[2]);
  doc.rect((pageWidth / 3) * 2, 0, pageWidth / 3, 2.5, "F");

  // 2. Header Band
  doc.setFillColor(carbon[0], carbon[1], carbon[2]);
  doc.rect(0, 2.5, pageWidth, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("GOVERNMENT OF INDIA • MINISTRY OF RURAL DEVELOPMENT", pageWidth / 2, 10.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(239, 91, 42);
  doc.text("DEPARTMENT OF LAND RESOURCES (DoLR) • BHOOMISETU NATIONAL COMMAND", pageWidth / 2, 16.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(216, 211, 201);
  doc.text("NATIONAL INFRASTRUCTURE LAND ACQUISITION & R&R MONITORING REPORT", pageWidth / 2, 21.5, { align: "center" });

  // 3. Document Meta Info
  let y = 30;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.text(data.reportTitle, margin + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(`Ref: DoLR/NAT-MON/2026/09  |  Classification: OFFICIAL / CABINET BRIEFING  |  Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, margin + 4, y + 10.5);

  // 4. National KPI Metrics Cards
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.text("I. NATIONAL OVERVIEW & AGGREGATE KEY PERFORMANCE INDICATORS", margin, y);
  y += 3;

  const cardW = (contentWidth - 6) / 3;
  const metrics = [
    { label: "Active Priority Projects", val: `${data.totalProjects} Corridors`, sub: "GatiShakti Monitored" },
    { label: "Total Acquisition Cases", val: `${data.totalCases}`, sub: `${data.completedCases} Completed (81.3%)` },
    { label: "Land Extent Possessed", val: `${data.totalAreaHa.toLocaleString()} Ha`, sub: "Section 38 Ratified" },
    { label: "Total PFMS Compensation", val: `Rs. ${data.totalCompensationCr.toLocaleString()} Cr`, sub: "Direct Treasury Credit" },
    { label: "National SLA Compliance", val: `${data.nationalSlaCompliance}%`, sub: "Statutory 12-Stage Standard" },
    { label: "Central Escalations Pending", val: `${data.pendingEscalations} Petitions`, sub: "Inter-State / Cabinet Queue" },
  ];

  metrics.forEach((m, idx) => {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const cx = margin + col * (cardW + 3);
    const cy = y + row * 15;

    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.roundedRect(cx, cy, cardW, 13, 1, 1, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(m.label, cx + 2.5, cy + 3.8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(carbon[0], carbon[1], carbon[2]);
    doc.text(m.val, cx + 2.5, cy + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(terracotta[0], terracotta[1], terracotta[2]);
    doc.text(m.sub, cx + 2.5, cy + 11.5);
  });

  y += 34;

  // 5. State Performance & Benchmarking Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.text("II. STATE-WISE PERFORMANCE, LAND ACQUISITION VELOCITY & SLA RANKINGS", margin, y);
  y += 3;

  const thH = 6;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.rect(margin, y, contentWidth, thH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.text("STATE / UT", margin + 3, y + 4);
  doc.text("PROJECTS", margin + 45, y + 4);
  doc.text("LAND TARGET (HA)", margin + 70, y + 4);
  doc.text("ACQUIRED (HA)", margin + 105, y + 4);
  doc.text("SLA COMPLIANCE", margin + 135, y + 4);
  doc.text("STATUS", margin + 165, y + 4);

  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.line(margin, y + thH, margin + contentWidth, y + thH);
  y += thH;

  data.stateRankings.forEach((st, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
      doc.rect(margin, y, contentWidth, 5.5, "F");
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(carbon[0], carbon[1], carbon[2]);
    doc.text(st.state, margin + 3, y + 4);

    doc.setFont("helvetica", "normal");
    doc.text(`${st.projects}`, margin + 45, y + 4);
    doc.text(`${st.targetHa.toLocaleString()}`, margin + 70, y + 4);
    doc.text(`${st.acquiredHa.toLocaleString()}`, margin + 105, y + 4);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(st.slaPct >= 90 ? emerald[0] : terracotta[0], st.slaPct >= 90 ? emerald[1] : terracotta[1], st.slaPct >= 90 ? emerald[2] : terracotta[2]);
    doc.text(`${st.slaPct}%`, margin + 135, y + 4);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(carbon[0], carbon[1], carbon[2]);
    doc.text(st.status, margin + 165, y + 4);

    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);
    y += 5.5;
  });

  // 6. National Policy Directive & Inter-State Coordination Note
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.text("III. NATIONAL POLICY DIRECTIVE & INTER-STATE COORDINATION PROTOCOL", margin, y);
  y += 3;

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  const directiveText = "The Department of Land Resources (DoLR), in coordination with the Ministry of Road Transport & Highways (MoRTH) and Ministry of Railways, has benchmarked national acquisition progress under the RFCTLARR Act 2013 and DILRMP 2.0 standards. State Revenue Authorities with SLA compliance below 90% are advised to deploy special land acquisition units and resolve pending Section 15 objections within 30 statutory days.";
  doc.text(doc.splitTextToSize(directiveText, contentWidth - 8), margin + 4, y + 5.5);

  y += 24;

  // 7. Official Sign-off & Digital Seal
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.text("OFFICIAL GOVERNMENT OF INDIA CENTRAL SEAL", margin + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Issued under the authority of the Joint Secretary (Land Resources), Ministry of Rural Development, Government of India. Transmitted digitally across State Chief Secretaries and SLAOs via BhoomiSetu Central Hub.", margin + 4, y + 11, { maxWidth: contentWidth - 52 });

  const sigX = margin + contentWidth - 46;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(sigX, y + 2.5, 42, 19, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.text("DIGITALLY VALIDATED", sigX + 21, y + 6.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Dr. Ananya Sharma, IAS", sigX + 21, y + 10, { align: "center" });
  doc.text("Joint Secretary (Land Resources)", sigX + 21, y + 13, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text("GOI VERIFIED", sigX + 21, y + 16.5, { align: "center" });

  // 8. Footer
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.line(margin, pageHeight - 10, margin + contentWidth, pageHeight - 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("BhoomiSetu National Command Center • Department of Land Resources, GoI • dolr.gov.in", margin, pageHeight - 6);
  doc.text("Official Cabinet Record  |  Page 1 of 1", margin + contentWidth, pageHeight - 6, { align: "right" });

  const cleanName = data.reportTitle.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`${cleanName}.pdf`);
}

export interface PiaPdfData {
  reportTitle: string;
  agencyName: string;
  projectName: string;
  projectCode: string;
  sector: string;
  totalLengthKm: number;
  bufferWidthM: number;
  totalParcels: number;
  totalAreaHa: number;
  estimatedCostCr: number;
  disbursedCostCr: number;
  timelineMonths: number;
  affectedDistricts: string[];
  packages: Array<{
    name: string;
    targetHa: number;
    acquiredHa: number;
    status: string;
    progressPct: number;
  }>;
}

export function generatePiaProjectReportPdf(data: PiaPdfData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Editorial Palette
  const carbon = [23, 23, 22];      // #171716
  const terracotta = [239, 91, 42];  // #EF5B2A
  const emerald = [21, 128, 61];     // #15803D
  const slate = [104, 101, 94];     // #68655E
  const borderCol = [216, 211, 201];// #D8D3C9
  const bgLight = [244, 241, 234];  // #F4F1EA

  // 1. National Tricolor Strip
  const stripeH = 1.2;
  doc.setFillColor(239, 91, 42); // Saffron
  doc.rect(0, 0, pageWidth / 3, stripeH, "F");
  doc.setFillColor(255, 255, 255); // White
  doc.rect(pageWidth / 3, 0, pageWidth / 3, stripeH, "F");
  doc.setFillColor(19, 136, 8); // Green
  doc.rect((pageWidth * 2) / 3, 0, pageWidth / 3, stripeH, "F");

  // 2. Official Agency Header
  let y = 8;
  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(data.agencyName.toUpperCase(), pageWidth / 2, y, { align: "center" });

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("PROJECT IMPLEMENTING AGENCY (PIA) • STATUTORY LAND REQUISITION CELL", pageWidth / 2, y, { align: "center" });

  y += 3.5;
  doc.setFontSize(6.5);
  doc.text("BhoomiSetu Infrastructure Land Acquisition & Alignment Feasibility Management System", pageWidth / 2, y, { align: "center" });

  // 3. Document Title Box
  y += 5;
  doc.setFillColor(255, 253, 248);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, "FD");

  doc.setFillColor(terracotta[0], terracotta[1], terracotta[2]);
  doc.roundedRect(margin + 4, y + 2.5, 52, 4, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("INFRASTRUCTURE REQUISITION DOSSIER", margin + 30, y + 5.2, { align: "center" });

  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(data.projectName, margin + 4, y + 10.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(`Code: ${data.projectCode}  |  Sector: ${data.sector}  |  Alignment: ${data.totalLengthKm} km (RoW: ${data.bufferWidthM}m)  |  Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, margin + 4, y + 14.8);

  // 4. Project Metrics KPI Cards
  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.text("I. PROJECT SPECIFICATIONS & LAND REQUISITION TARGETS", margin, y);
  y += 3;

  const cardW = (contentWidth - 6) / 3;
  const metrics = [
    { label: "Corridor Alignment Length", val: `${data.totalLengthKm} km`, sub: `RoW Buffer: ${data.bufferWidthM}m` },
    { label: "Total Affected Parcels", val: `${data.totalParcels.toLocaleString()}`, sub: "Cadastral Khata Linked" },
    { label: "Total Land Extent Required", val: `${data.totalAreaHa.toLocaleString()} Ha`, sub: "DPR Demarcation Scope" },
    { label: "Estimated Project Budget", val: `Rs. ${data.estimatedCostCr.toLocaleString()} Cr`, sub: "Sanctioned Capital Head" },
    { label: "Compensation Disbursed", val: `Rs. ${data.disbursedCostCr.toLocaleString()} Cr`, sub: "PFMS Direct Benefit Transfer" },
    { label: "Target Timeline", val: `${data.timelineMonths} Months`, sub: "Target Milestone Schedule" },
  ];

  metrics.forEach((m, idx) => {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const cx = margin + col * (cardW + 3);
    const cy = y + row * 15;

    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.roundedRect(cx, cy, cardW, 13, 1, 1, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(m.label, cx + 2.5, cy + 3.8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(carbon[0], carbon[1], carbon[2]);
    doc.text(m.val, cx + 2.5, cy + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(terracotta[0], terracotta[1], terracotta[2]);
    doc.text(m.sub, cx + 2.5, cy + 11.5);
  });

  y += 34;

  // 5. Package-wise Acquisition Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.text("II. PACKAGE-WISE LAND ACQUISITION PROGRESS & STATUTORY STATUS", margin, y);
  y += 3;

  const thH = 6;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.rect(margin, y, contentWidth, thH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.text("PROJECT PACKAGE / SECTION", margin + 3, y + 4);
  doc.text("TARGET (HA)", margin + 75, y + 4);
  doc.text("ACQUIRED (HA)", margin + 108, y + 4);
  doc.text("PROGRESS", margin + 140, y + 4);
  doc.text("STATUS", margin + 165, y + 4);

  y += thH;
  data.packages.forEach((pkg, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(250, 248, 243);
      doc.rect(margin, y, contentWidth, 5.5, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(carbon[0], carbon[1], carbon[2]);
    doc.text(pkg.name, margin + 3, y + 3.8);

    doc.setFont("helvetica", "bold");
    doc.text(`${pkg.targetHa} Ha`, margin + 75, y + 3.8);
    doc.text(`${pkg.acquiredHa} Ha`, margin + 108, y + 3.8);

    doc.setTextColor(emerald[0], emerald[1], emerald[2]);
    doc.text(`${pkg.progressPct}%`, margin + 140, y + 3.8);

    doc.setTextColor(carbon[0], carbon[1], carbon[2]);
    doc.text(pkg.status.replace("_", " "), margin + 165, y + 3.8);

    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);
    y += 5.5;
  });

  // 6. Statutory Requisition Declaration
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.text("III. STATUTORY DECLARATION OF PROJECT IMPLEMENTING AGENCY", margin, y);
  y += 3;

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  const declText = `This Requisition Dossier has been prepared under the RFCTLARR Act 2013 and National Geospatial Standards for ${data.projectName}. The intersecting cadastral parcels have been derived from GIS buffer processing of the approved alignment (v2.0). All preliminary clearances, DPR approvals, and utility diversion plans have been verified by the Project Implementing Agency for submission to the Competent Land Acquisition Authority (CALA).`;
  doc.text(doc.splitTextToSize(declText, contentWidth - 8), margin + 4, y + 5);

  y += 24;

  // 7. Official Sign-off & Verification Seal
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.text("OFFICIAL PIA EXECUTIVE VALIDATION", margin + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Authorized signatory of the Project Implementing Agency (Technical Division). Transmitted digitally to the State Revenue Department and Special Land Acquisition Officers via BhoomiSetu Enterprise Portal.", margin + 4, y + 11, { maxWidth: contentWidth - 52 });

  const sigX = margin + contentWidth - 46;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(sigX, y + 2.5, 42, 19, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(carbon[0], carbon[1], carbon[2]);
  doc.text("DIGITALLY SIGNED", sigX + 21, y + 6.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Vikram Malhotra", sigX + 21, y + 10, { align: "center" });
  doc.text("Chief General Manager (Tech)", sigX + 21, y + 13, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text("PIA AUTHENTICATED", sigX + 21, y + 16.5, { align: "center" });

  // 8. Footer
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.line(margin, pageHeight - 10, margin + contentWidth, pageHeight - 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("BhoomiSetu Project Requisition & Alignment Review • Infrastructure Implementing Division", margin, pageHeight - 6);
  doc.text("Official PIA Record  |  Page 1 of 1", margin + contentWidth, pageHeight - 6, { align: "right" });

  const cleanName = data.reportTitle.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`${cleanName}.pdf`);
}




