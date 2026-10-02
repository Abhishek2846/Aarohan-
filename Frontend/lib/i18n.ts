export type LanguageCode = "en" | "hi";

export interface TranslationDictionary {
  // Brand & Header
  appName: string;
  appTagline: string;
  portalHeader: string;
  sihBadge: string;
  activeJurisdiction: string;
  nationalJurisdiction: string;
  activePersona: string;
  switchPersona: string;
  evaluatorRole: string;
  evaluatorDesc: string;
  officer: string;

  // Sidebar & Navigation
  roleNavigation: string;
  statutoryStandard: string;
  statutoryStandardDesc: string;
  piaDashboard: string;
  gisSpatialCenter: string;
  impactSimulation: string;
  infrastructureProjects: string;
  acquisitionCases: string;
  statutoryDocuments: string;
  nationalDashboard: string;
  gisSpatialOverlays: string;
  interstateBenchmarks: string;
  corridorProjects: string;
  stateDashboard: string;
  gisCadastralMap: string;
  rrAdministration: string;
  gazetteDocuments: string;
  districtDashboard: string;
  districtCaseRoster: string;
  compensationPfms: string;
  possessionHandover: string;
  rrBenefits: string;
  fieldDemarcationQueue: string;
  gpsDemarcationMap: string;
  surveyDocuments: string;
  auditorDashboard: string;
  auditTrailLedger: string;
  cadastralAudit: string;
  documentVault: string;
  pfmsAudit: string;
  citizenPortalHome: string;
  publicProjectMap: string;
  publicGazetteNotices: string;
  lodgeObjection: string;

  // Common UI Actions & Metrics
  welcome: string;
  welcomeSubtext: string;
  openNationalAnalytics: string;
  gisSimulator: string;
  dedicatedRoleDashboards: string;
  dedicatedRoleDashboardsDesc: string;
  monitoredProjects: string;
  totalLandRequired: string;
  ulpinParcelsIntersected: string;
  pfmsDisbursed: string;
  priorityRiskDocket: string;
  stageReadiness: string;
  evaluatorPersonaMatrix: string;
  evaluatorPersonaMatrixDesc: string;
  search: string;
  searchPlaceholder: string;
  filter: string;
  all: string;
  status: string;
  actions: string;
  viewDetails: string;
  advanceStage: string;
  exportReport: string;
  createProject: string;
  createCase: string;
  uploadDocument: string;
  calculateCompensation: string;

  // Statutory Terms
  landAcquisition: string;
  solatium: string;
  ulpin: string;
  khasra: string;
  preliminaryNotice: string;
  declaration: string;
  awardEnactment: string;
  possession: string;
  panchanama: string;
  pfmsDbt: string;
  affectedFamilies: string;
  grievance: string;
  auditLedger: string;
  dataQuality: string;
  delayRisk: string;
  simulation: string;
  gisMap: string;
  syncStatus: string;
  online: string;
  offline: string;

  // Footer
  footerTagline: string;
  auditVerified: string;
  nationalIntegrations: string;
  statutoryCompliance: string;
  hackathonInfo: string;
  privacyPolicy: string;
  termsOfService: string;
  openApi: string;
  copyright: string;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    // Brand & Header
    appName: "Aarohan",
    appTagline: "National Land Acquisition, Fair Compensation & Digital Maps",
    portalHeader: "GOVERNMENT OF INDIA • FAIR LAND ACQUISITION & FARMER REFORMS",
    sihBadge: "SIH 2026 • SIH26016",
    activeJurisdiction: "Active Jurisdiction:",
    nationalJurisdiction: "National Level (All States & Corridors)",
    activePersona: "Active Role",
    switchPersona: "Switch User Role",
    evaluatorRole: "User Role",
    evaluatorDesc: "Preview Aarohan under different official and citizen perspectives",
    officer: "Officer",

    // Sidebar & Navigation
    roleNavigation: "Portal Navigation",
    statutoryStandard: "Fair Land Compensation Standard",
    statutoryStandardDesc: "Certified under the Fair Compensation Law 2013 (RFCTLARR) & 14-digit Land ID (Bhu-Aadhaar).",
    piaDashboard: "Project Agency Dashboard",
    gisSpatialCenter: "Digital Land Map Center",
    impactSimulation: "Route Planning & Land Estimator",
    infrastructureProjects: "Highway, Rail & Infra Projects",
    acquisitionCases: "Land Acquisition Cases",
    statutoryDocuments: "Official Documents & Orders",
    nationalDashboard: "National Dashboard",
    gisSpatialOverlays: "Satellite & Land Map Overlays",
    interstateBenchmarks: "State-by-State Progress",
    corridorProjects: "National Highway & Rail Projects",
    stateDashboard: "State Revenue Dashboard",
    gisCadastralMap: "Field Boundaries & Survey Map",
    rrAdministration: "Family Resettlement & Support (R&R)",
    gazetteDocuments: "Official Gazette Notices & Orders",
    districtDashboard: "District Land Office (CALA)",
    districtCaseRoster: "District Land Cases List",
    compensationPfms: "Compensation Money & Bank Payments",
    possessionHandover: "Handing Over Land to Government",
    rrBenefits: "Family Resettlement Benefits",
    fieldDemarcationQueue: "Ground Land Surveys & Boundary Marking",
    gpsDemarcationMap: "GPS Field Survey Map",
    surveyDocuments: "Field Survey & Inspection Reports",
    auditorDashboard: "Audit & Inspection Dashboard",
    auditTrailLedger: "Secure Activity & Payment History",
    cadastralAudit: "Field Boundary Verification",
    documentVault: "Secure Document Vault",
    pfmsAudit: "Bank Payment & Account Audit",
    citizenPortalHome: "Farmer & Citizen Portal Home",
    publicProjectMap: "Public Project Route Map",
    publicGazetteNotices: "Government Notices & Land Orders",
    lodgeObjection: "Submit Objection or Help Request",

    // Common UI Actions & Metrics
    welcome: "Welcome",
    welcomeSubtext: "National Land Acquisition & Farmer Compensation Platform",
    openNationalAnalytics: "Open National Progress Analytics",
    gisSimulator: "Land Map & Route Estimator",
    dedicatedRoleDashboards: "Role-Specific Portals",
    dedicatedRoleDashboardsDesc: "Clear, transparent views designed for officers, farmers, and citizens.",
    monitoredProjects: "Active Development Projects",
    totalLandRequired: "Total Land Needed",
    ulpinParcelsIntersected: "Surveyed Land Plots (Parcels)",
    pfmsDisbursed: "Direct Compensation Paid to Bank Accounts",
    priorityRiskDocket: "High-Priority Case File",
    stageReadiness: "Ready for Next Step",
    evaluatorPersonaMatrix: "Role Switching Matrix",
    evaluatorPersonaMatrixDesc: "Switch roles below to inspect how portals look for different officers and farmers.",
    search: "Search",
    searchPlaceholder: "Search Land ID (Bhu-Aadhaar), Plot/Khasra No., Project, or Village...",
    filter: "Filter",
    all: "All",
    status: "Status",
    actions: "Actions",
    viewDetails: "View Details",
    advanceStage: "Move to Next Step",
    exportReport: "Download Official Report",
    createProject: "Register New Project",
    createCase: "Start New Land Case",
    uploadDocument: "Upload Official Document",
    calculateCompensation: "Calculate Compensation & 100% Bonus",

    // Statutory Terms
    landAcquisition: "Land Acquisition (Taking Land for Public Projects)",
    solatium: "100% Extra Government Bonus (Double Money / Solatium)",
    ulpin: "14-Digit Land Aadhaar (Bhu-Aadhaar / ULPIN)",
    khasra: "Plot / Field Survey / Khasra No.",
    preliminaryNotice: "First Land Notice (Section 11)",
    declaration: "Final Acquisition Decision (Section 19)",
    awardEnactment: "Final Compensation Order (Section 23 Award)",
    possession: "Handing Over Land to Government (Section 38)",
    panchanama: "Field Witness Inspection Report (Panchanama)",
    pfmsDbt: "Direct Bank Account Payment (PFMS / DBT)",
    affectedFamilies: "Family Relocation & Resettlement Support",
    grievance: "Farmer Hearing & Objections (Section 15)",
    auditLedger: "Tamper-Proof Activity Record",
    dataQuality: "Document Completeness Check",
    delayRisk: "Risk of Timeline Delay",
    simulation: "Project Route & Land Estimator",
    gisMap: "Digital Land Boundary Map",
    syncStatus: "Connection Status",
    online: "Online (Connected)",
    offline: "Offline Mode (Saved on Device)",

    // Footer
    footerTagline: "A centralized, transparent, GIS-enabled land acquisition platform ensuring fair compensation and timely project delivery across India.",
    auditVerified: "All activity and compensation payments verified with digital security stamps",
    nationalIntegrations: "National Integrations",
    statutoryCompliance: "Fair Compensation Law Compliance",
    hackathonInfo: "Hackathon Information",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    openApi: "Official Open API",
    copyright: "© 2026 Aarohan Platform • Ministry of Rural Development & Partner Agencies",
  },
  hi: {
    // Brand & Header
    appName: "आरोहण",
    appTagline: "राष्ट्रीय भूमि अधिग्रहण, उचित मुआवजा एवं डिजिटल नक्शा मंच",
    portalHeader: "भारत सरकार • निष्पक्ष भूमि अधिग्रहण एवं किसान अधिकार",
    sihBadge: "एस.आई.एच 2026 • SIH26016",
    activeJurisdiction: "सक्रिय कार्यक्षेत्र:",
    nationalJurisdiction: "राष्ट्रीय स्तर (समस्त राज्य एवं गलियारे)",
    activePersona: "सक्रिय भूमिका",
    switchPersona: "भूमिका बदलें",
    evaluatorRole: "उपयोगकर्ता भूमिका",
    evaluatorDesc: "विभिन्न अधिकारियों एवं किसानों के नजरिए से आरोहण देखें",
    officer: "अधिकारी",

    // Sidebar & Navigation
    roleNavigation: "पोर्टल नेविगेशन",
    statutoryStandard: "उचित मुआवजा एवं कानूनी मानक",
    statutoryStandardDesc: "भूमि कानून 2013 (RFCTLARR), 14-अंकीय भू-आधार एवं राष्ट्रीय विकास योजनाओं के अनुसार प्रमाणित।",
    piaDashboard: "प्रोजेक्ट निर्माण एजेंसी डैशबोर्ड",
    gisSpatialCenter: "डिजिटल खेत नक्शा केंद्र",
    impactSimulation: "परियोजना मार्ग एवं जमीन अनुमान",
    infrastructureProjects: "सड़क, रेल व विकास परियोजनाएं",
    acquisitionCases: "भूमि अधिग्रहण केस सूची",
    statutoryDocuments: "आधिकारिक सरकारी कागजात",
    nationalDashboard: "राष्ट्रीय निगरानी डैशबोर्ड",
    gisSpatialOverlays: "सैटेलाइट एवं प्रोजेक्ट नक्शा",
    interstateBenchmarks: "राज्यवार कार्य प्रगति तुलना",
    corridorProjects: "राजमार्ग एवं रेल परियोजनाएं",
    stateDashboard: "राज्य राजस्व डैशबोर्ड",
    gisCadastralMap: "खेत की सीमा एवं सर्वे नक्शा",
    rrAdministration: "परिवार पुनर्वास एवं सहायता (R&R)",
    gazetteDocuments: "सरकारी गजट नोटिस एवं आदेश",
    districtDashboard: "जिला भूमि कार्यालय (CALA)",
    districtCaseRoster: "जिला भूमि मामलों की सूची",
    compensationPfms: "मुआवजा राशि एवं बैंक भुगतान",
    possessionHandover: "जमीन सौंपना एवं सरकारी कब्जा",
    rrBenefits: "परिवार पुनर्वास लाभ वितरण",
    fieldDemarcationQueue: "खेत की नाप-जोख एवं सीमांकन कार्य",
    gpsDemarcationMap: "खेत का जीपीएस सर्वे नक्शा",
    surveyDocuments: "खेत सर्वे एवं निरीक्षण रिपोर्ट",
    auditorDashboard: "ऑडिट एवं जांच डैशबोर्ड",
    auditTrailLedger: "सुरक्षित गतिविधि एवं भुगतान रिकॉर्ड",
    cadastralAudit: "खेत की सीमा व रकबा सत्यापन",
    documentVault: "सुरक्षित दस्तावेज संग्रह",
    pfmsAudit: "बैंक खाता एवं भुगतान जांच",
    citizenPortalHome: "किसान एवं नागरिक पोर्टल",
    publicProjectMap: "सार्वजनिक प्रोजेक्ट नक्शा",
    publicGazetteNotices: "सरकारी नोटिस एवं कानूनी आदेश",
    lodgeObjection: "आपत्ति या शिकायत दर्ज करें",

    // Common UI Actions & Metrics
    welcome: "स्वागत है",
    welcomeSubtext: "राष्ट्रीय भूमि अधिग्रहण एवं किसान मुआवजा मंच",
    openNationalAnalytics: "राष्ट्रीय विश्लेषण खोलें",
    gisSimulator: "जमीन नक्शा एवं मार्ग अनुमान",
    dedicatedRoleDashboards: "भूमिका-विशिष्ट पोर्टल",
    dedicatedRoleDashboardsDesc: "अधिकारियों और किसानों के लिए स्पष्ट, पारदर्शी एवं वास्तविक समय में उपयोगी डैशबोर्ड।",
    monitoredProjects: "सक्रिय विकास परियोजनाएं",
    totalLandRequired: "प्रोजेक्ट के लिए कुल जमीन",
    ulpinParcelsIntersected: "चिह्नित खेत एवं जमीन के टुकड़े",
    pfmsDisbursed: "बैंक खातों में भेजा गया कुल मुआवजा पैसा",
    priorityRiskDocket: "विशेष ध्यान देने योग्य केस फाइल",
    stageReadiness: "अगले चरण में जाने की तैयारी",
    evaluatorPersonaMatrix: "भूमिका चयन",
    evaluatorPersonaMatrixDesc: "अधिकारियों और किसानों के अलग-अलग अधिकार देखने हेतु नीचे भूमिका बदलें।",
    search: "खोजें",
    searchPlaceholder: "भू-आधार नंबर, खेत का खसरा नंबर, प्रोजेक्ट या गांव खोजें...",
    filter: "फ़िल्टर",
    all: "सभी",
    status: "स्थिति",
    actions: "कार्रवाई",
    viewDetails: "विवरण देखें",
    advanceStage: "अगले चरण में बढ़ाएं",
    exportReport: "आधिकारिक रिपोर्ट डाउनलोड करें",
    createProject: "नया प्रोजेक्ट जोड़ें",
    createCase: "नया भूमि केस दर्ज करें",
    uploadDocument: "सरकारी दस्तावेज अपलोड करें",
    calculateCompensation: "मुआवजा एवं 100% बोनस की गणना करें",

    // Statutory Terms
    landAcquisition: "भूमि अधिग्रहण (प्रोजेक्ट हेतु जमीन लेना)",
    solatium: "100% अतिरिक्त सरकारी बोनस (दोगुना पैसा / सोलेशियम)",
    ulpin: "14-अंकीय जमीन आधार नंबर (भू-आधार / ULPIN)",
    khasra: "खेत का खसरा / सर्वे नंबर",
    preliminaryNotice: "जमीन लेने का पहला सरकारी नोटिस (धारा 11)",
    declaration: "जमीन लेने का पक्का सरकारी फैसला (धारा 19)",
    awardEnactment: "मुआवजे का पक्का सरकारी आदेश (धारा 23 अवार्ड)",
    possession: "जमीन सौंपना एवं सरकारी कब्जा (धारा 38)",
    panchanama: "खेत पर मौका मुआयना व गवाहों की रिपोर्ट (पंचनामा)",
    pfmsDbt: "सीधे बैंक खाते में मुआवजा पैसा भेजना (DBT)",
    affectedFamilies: "प्रभावित परिवारों को घर व पुनर्वास सहायता",
    grievance: "किसान की बात और आपत्ति की सुनवाई (धारा 15)",
    auditLedger: "छेड़छाड़-रहित सुरक्षित रिकॉर्ड",
    dataQuality: "दस्तावेज पूर्णता जांच",
    delayRisk: "कार्य में विलंब का जोखिम",
    simulation: "प्रोजेक्ट मार्ग एवं जमीन अनुमान",
    gisMap: "डिजिटल खेत सीमा नक्शा",
    syncStatus: "सिंक स्थिति",
    online: "ऑनलाइन (इंटरनेट चालू)",
    offline: "ऑफ़लाइन मोड (डिवाइस में सुरक्षित)",

    // Footer
    footerTagline: "भारत भर में बुनियादी ढांचा परियोजनाओं के त्वरित क्रियान्वयन और किसानों को उचित मुआवजा सुनिश्चित करने वाला पारदर्शी डिजिटल मंच।",
    auditVerified: "सभी कार्य एवं बैंक भुगतान डिजिटल सुरक्षा मुहर से सत्यापित हैं",
    nationalIntegrations: "राष्ट्रीय एकीकरण",
    statutoryCompliance: "कानूनी व मुआवजा अनुपालन",
    hackathonInfo: "हैकाथॉन जानकारी",
    privacyPolicy: "गोपनीयता नीति",
    termsOfService: "सेवा की शर्तें",
    openApi: "आधिकारिक ओपन एपीआई",
    copyright: "© 2026 आरोहण मंच • ग्रामीण विकास मंत्रालय एवं सहभागी एजेंसियां",
  },
};
