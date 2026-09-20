import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CryptoUtil } from '../common/utils/crypto.util';

@Injectable()
export class CitizenService {
  constructor(private readonly prisma: PrismaService) {}

  async getCitizenProfile(userId?: string, email?: string) {
    try {
      let citizen = null;
      if (userId) {
        citizen = await this.prisma.users.findUnique({
          where: { user_id: userId },
          include: { user_roles: true },
        });
      }
      if (!citizen && email) {
        citizen = await this.prisma.users.findFirst({
          where: { email },
          include: { user_roles: true },
        });
      }
      if (!citizen) {
        // Look up by role CITIZEN from user_roles
        const citizenRole = await this.prisma.user_roles.findFirst({
          where: { role_code: 'CITIZEN' },
          include: { users: true },
        });
        citizen = citizenRole?.users || null;
      }
      if (!citizen) {
        citizen = await this.prisma.users.findFirst({
          where: {
            OR: [
              { login_name: 'citizen' },
              { email: { contains: 'citizen' } },
            ],
          },
          include: { user_roles: true },
        });
      }

      const [parcel, firstCase, award, beneficiary, notices, grievances] = await Promise.all([
        this.prisma.parcels.findFirst({
          where: {
            OR: [
              { ulpin: { contains: 'KA-BLR' } },
              { village_name: { contains: 'Doddaballapur' } },
            ],
          },
          orderBy: { created_at: 'asc' },
        }),
        this.prisma.acquisition_cases.findFirst({
          include: { projects: true },
        }),
        this.prisma.award_calculations.findFirst({
          orderBy: { calculation_version: 'desc' },
        }),
        this.prisma.beneficiaries.findFirst({
          orderBy: { calculated_amount_inr: 'desc' },
        }),
        this.prisma.statutory_notices.findMany({
          select: {
            statutory_notice_id: true,
            notice_number: true,
            notice_type: true,
            section_reference: true,
            gazette_reference: true,
            publication_status: true,
            published_on: true,
            public_summary: true,
          },
          take: 7,
          orderBy: { created_at: 'asc' },
        }),
        this.prisma.grievances.findMany({
          take: 5,
          orderBy: { filed_at: 'desc' },
        }),
      ]);

      const fullName = citizen?.full_name || 'Rameshwar Sharma';
      const nameHi = fullName === 'Rameshwar Sharma' ? 'रामेश्वर शर्मा' : `${fullName} (नागरिक)`;

      const totalArea = Number(parcel?.total_area_ha || 1.85);
      const acquiredArea = Number((totalArea * 0.784).toFixed(2));
      const retainedArea = Number((totalArea - acquiredArea).toFixed(2));

      const totalMarketVal = Number(award?.base_market_rate_per_sqm && award?.area_sqm ? (Number(award.base_market_rate_per_sqm) * Number(award.area_sqm)) : (award?.total_market_value_inr || 25000000));
      const multiplierVal = Number(award?.multiplier_factor || 1.5);
      const multipliedVal = Math.round(totalMarketVal * multiplierVal);
      const solatiumVal = Number(award?.solatium_inr || multipliedVal);
      const assetsVal = Number(award?.assets_on_land_inr || 500000);
      const interestVal = Number(award?.additional_interest_inr || 500000);
      const grossAwardVal = multipliedVal + solatiumVal + assetsVal + interestVal;

      const rawLandCategory = parcel?.land_use_category || 'AGRICULTURAL';
      const upperCategory = String(rawLandCategory).toUpperCase();
      const taxRatePercent = upperCategory.includes('RESIDENTIAL') ? 10 : upperCategory.includes('COMMERCIAL') ? 30 : 0; // 0% Agricultural Exempt under Sec 10(37)
      const taxDeductionVal = Math.round(grossAwardVal * (taxRatePercent / 100));
      const netAwardVal = grossAwardVal - taxDeductionVal;

      let bankLast4 = beneficiary?.bank_account_last4 || '4921';
      if (beneficiary?.bank_account_token) {
        const decryptedAcc = CryptoUtil.decryptField(beneficiary.bank_account_token);
        if (decryptedAcc) bankLast4 = decryptedAcc.slice(-4);
      }
      const accountMasked = CryptoUtil.maskBankAccount(bankLast4);
      let aadhaarMasked = 'XXXX-XXXX-8821';
      if (beneficiary?.identity_token) {
        const decryptedAadhaar = CryptoUtil.decryptField(beneficiary.identity_token);
        if (decryptedAadhaar) {
          aadhaarMasked = CryptoUtil.maskAadhaar(decryptedAadhaar);
        }
      }
      const ifsc = beneficiary?.ifsc_code || 'SBIN0004128';
      const dbtStatus = beneficiary?.disbursement_status === 'PAID'
        ? 'PFMS Direct Benefit Transfer Credited'
        : 'PFMS Direct Benefit Transfer Mandate Approved';
      const pfmsBatchRef = beneficiary?.pfms_transaction_id || 'PFMS-TXN-2026-88192';
      const payoutDate = beneficiary?.disbursed_at
        ? new Date(beneficiary.disbursed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '28 Oct 2026';

      const treeVal = Math.round(assetsVal * 0.529);
      const wellVal = Math.round(assetsVal * 0.265);
      const fenceVal = Math.max(0, assetsVal - treeVal - wellVal);
      const assets = [
        { name: 'Fruit-bearing Mature Mango Trees / फलदार आम के पेड़', count: '18 Trees / 18 पेड़', valuation: treeVal },
        { name: 'Operational Deep Tube-Well (5HP Submersible) / चालू नलकूप (बोरवेल)', count: '1 Unit / 1 बोरवेल', valuation: wellVal },
        { name: 'Farm Boundary Stone Wall & Fencing (240m) / खेत की पत्थर की बाड़ व दीवार', count: '240 Metres / 240 मीटर', valuation: fenceVal },
      ];

      const dynamicTimeline = notices && notices.length > 0 ? notices.map((n, idx) => ({
        stage: idx + 1,
        name: `${n.section_reference || 'Statutory Notice'}: ${n.notice_type?.replace(/_/g, ' ') || 'Notification'}`,
        date: n.published_on
          ? new Date(n.published_on).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: n.publication_status === 'PUBLISHED' ? 'completed' : idx === 0 ? 'current' : 'upcoming',
        note: n.public_summary || `Gazette reference: ${n.gazette_reference}`,
      })) : [
        { stage: 1, name: "Land Proposal & Survey / जमीन नाप-जोख व सर्वेक्षण", date: "12 Jan 2026", status: "completed", note: `Survey completed on plot ${parcel?.survey_number || '142/2A'} / खेत ${parcel?.survey_number || '142/2A'} की नाप-जोख पूरी हुई` },
        { stage: 4, name: "Initial Public Notice / प्रारंभिक सरकारी सूचना (धारा 11)", date: "02 Mar 2026", status: "completed", note: "Gazette notification published / सरकारी गजट प्रकाशित हुआ" },
        { stage: 5, name: "Farmer Objections & Hearing / किसान आपत्ति व सुनवाई (धारा 15)", date: "18 Apr 2026", status: "completed", note: "Objection hearing closed by SLAO / अधिकारी द्वारा सुनवाई पूरी हुई" },
        { stage: 6, name: "Final Government Declaration / अंतिम सरकारी घोषणा (धारा 19)", date: "28 Aug 2026", status: "current", note: "Declaration enacted by State Revenue Authority / राज्य सरकार द्वारा अंतिम घोषणा" },
        { stage: 8, name: "100% Double Bonus & Asset Valuation / 100% बोनस व पेड़-कुआं मूल्यांकन", date: "15 Oct 2026", status: "upcoming", note: "Final valuation hearing with CALA / अधिकारी के साथ अंतिम मूल्यांकन बैठक" },
        { stage: 10, name: "Direct Bank Transfer / सीधे बैंक खाते में भुगतान (PFMS DBT)", date: "28 Oct 2026", status: "upcoming", note: `Direct bank transfer to account ending in ${bankLast4}` },
        { stage: 11, name: "Land Handover (Post-Payout) / कब्जा सौंपना (पूरे भुगतान के बाद)", date: "15 Nov 2026", status: "upcoming", note: `Physical handover of acquired ${acquiredArea} Ha` },
      ];

      const activeG = grievances && grievances.length > 0
        ? grievances.find((g) => g.grievance_status === 'OPEN' || g.grievance_status === 'PENDING') || grievances[0]
        : null;

      const activeObjection = activeG ? {
        ref: activeG.grievance_reference,
        subject: activeG.details || `Re-assessment of Standing Trees & Assets (${activeG.category})`,
        filedDate: new Date(activeG.filed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: activeG.grievance_status === 'OPEN'
          ? 'Hearing Scheduled with Sub-Divisional Magistrate / एसडीएम कोर्ट में सुनवाई तय'
          : activeG.grievance_status === 'RESOLVED'
          ? 'Objection Resolved by Collector / कलेक्टर द्वारा निस्तारित'
          : activeG.grievance_status,
        hearingDate: activeG.sla_deadline
          ? `${new Date(activeG.sla_deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, 11:00 AM at ${parcel?.village_name || 'Doddaballapur'} Taluk Kacheri`
          : '18 Sep 2026, 11:00 AM at Doddaballapur Taluk Kacheri',
        presidingOfficer: 'Dr. Priya Sundaram, IAS (Special Land Acquisition Officer) / डॉ. प्रिया सुंदरम, आईएएस',
      } : {
        ref: "OBJ-2026-KA-8812",
        subject: "Re-assessment of Standing Mango Trees & Tube-Well Depth / आम के पेड़ों और नलकूप के मूल्यांकन की पुनः जांच",
        filedDate: "05 Sep 2026",
        status: "Hearing Scheduled with Sub-Divisional Magistrate / एसडीएम कोर्ट में सुनवाई तय",
        hearingDate: "18 Sep 2026, 11:00 AM at Doddaballapur Taluk Kacheri / 18 सितंबर 2026 सुबह 11:00 बजे, डोड्डाबल्लापुर तहसील कचहरी",
        presidingOfficer: "Dr. Priya Sundaram, IAS (Special Land Acquisition Officer) / डॉ. प्रिया सुंदरम, आईएएस",
      };

      return {
        name: fullName,
        nameHi,
        khataNo: 'KHT-KA-BLR-8821',
        citizenId: citizen?.user_id || 'CIT-KA-2026-8819',
        phone: citizen?.phone_e164 || '+91 98765 43210',
        phoneMasked: CryptoUtil.maskPhone(citizen?.phone_e164 || '+91 98765 43210'),
        email: citizen?.email || 'citizen@public.bhoomsetu.gov.in',
        village: parcel?.village_name || 'Doddaballapur',
        taluk: 'Doddaballapur',
        district: 'Bengaluru Rural',
        state: 'Karnataka',
        aadhaarMasked,
        aadhaarStatus: 'Linked & Verified (UIDAI Bhu-Bridge)',
        bankName: 'State Bank of India',
        bankBranch: 'Doddaballapur Main Branch',
        accountMasked,
        ifsc,
        dbtStatus,
        ulpin: parcel?.ulpin || 'KA-BLR-2026-0041',
        surveyNo: parcel?.survey_number || '142/2A',
        landType: parcel?.land_use_category === 'AGRICULTURAL'
          ? 'Agricultural (Irrigated Multi-Crop)'
          : (parcel?.land_use_category || 'Agricultural (Irrigated Multi-Crop)'),
        totalAreaHa: totalArea,
        acquiredAreaHa: acquiredArea,
        retainedAreaHa: retainedArea,
        acquiringCorridor: firstCase?.projects?.title || 'Bengaluru Satellite Town Ring Road (STRR NH-948A)',
        sponsoringAgency: firstCase?.projects?.pia_name || 'National Highways Authority of India (NHAI)',
        calaAuthority: 'Special Land Acquisition Officer (CALA), Bengaluru Rural',
        compensation: {
          baseMarketValue: totalMarketVal,
          ruralMultiplier: multiplierVal,
          multipliedMarketValue: multipliedVal,
          solatium100Pct: solatiumVal,
          assetsValuation: assetsVal,
          statutoryInterest12Pct: interestVal,
          grossCompensation: grossAwardVal,
          taxRatePercent,
          taxDeduction: taxDeductionVal,
          netCompensation: netAwardVal,
          totalAward: netAwardVal,
          disbursedPct: beneficiary?.disbursement_status === 'PAID' ? 100 : 80,
          pfmsBatchRef,
          payoutDate,
        },
        award: {
          grossAwardInr: grossAwardVal,
          taxRatePercent,
          taxDeductionInr: taxDeductionVal,
          netAwardInr: netAwardVal,
          baseRatePerSqm: Number(award?.base_market_rate_per_sqm || 2500),
          multiplier: multiplierVal,
          solatiumPercent: 100,
          solatiumInr: solatiumVal,
          additionalInterestInr: interestVal,
          assetsValuationInr: assetsVal,
          disbursementStatus: beneficiary?.disbursement_status || 'PAID',
          pfmsRef: pfmsBatchRef,
        },
        assets,
        timeline: dynamicTimeline,
        activeObjection,
        notices: notices.map((n) => ({
          id: n.statutory_notice_id,
          number: n.notice_number,
          type: n.notice_type,
          section: n.section_reference,
          gazetteRef: n.gazette_reference,
          status: n.publication_status,
          publishedOn: n.published_on,
        })),
        grievances: grievances.map((g) => ({
          id: g.grievance_id,
          ref: g.grievance_reference,
          category: g.category,
          status: g.grievance_status,
          details: g.details,
          filedAt: g.filed_at,
        })),
      };
    } catch (error) {
      console.error('Error fetching citizen profile:', error);
      return null;
    }
  }
}
