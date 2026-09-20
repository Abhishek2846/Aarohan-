const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://bhoomi:bhoomi_pass@127.0.0.1:5432/bhoomi_setu?schema=public';
const client = new Client({ connectionString });

async function run() {
  await client.connect();
  console.log('Connected to PostgreSQL database.');

  // 1. Add columns to statutory_notices if not exists
  await client.query(`
    ALTER TABLE statutory_notices
    ADD COLUMN IF NOT EXISTS bilingual_content JSONB,
    ADD COLUMN IF NOT EXISTS sha256_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS gazette_volume_issue VARCHAR(120),
    ADD COLUMN IF NOT EXISTS cadastral_schedule JSONB;
  `);
  console.log('Columns added/verified on statutory_notices.');

  // 2. Fetch existing projects and cases to link notices
  const projectsRes = await client.query(`SELECT project_id, project_code, title FROM projects LIMIT 10`);
  const casesRes = await client.query(`SELECT case_id, case_number, project_id FROM acquisition_cases LIMIT 10`);
  const usersRes = await client.query(`SELECT user_id, email FROM users LIMIT 10`);

  const pMap = {};
  for (const p of projectsRes.rows) {
    pMap[p.project_code] = p;
  }
  const defaultProj = projectsRes.rows[0];
  const defaultCase = casesRes.rows[0];
  const defaultUser = usersRes.rows[0];

  console.log(`Found ${projectsRes.rows.length} projects, ${casesRes.rows.length} cases.`);

  // 3. Populate authentic RFCTLARR 2013 Statutory Bilingual Notices
  const gazettes = [
    {
      notice_number: 'NOT-SEC11-2026-001',
      project_id: pMap['PRJ-BLR-CHE-01'] ? pMap['PRJ-BLR-CHE-01'].project_id : defaultProj.project_id,
      case_id: defaultCase.case_id,
      notice_type: 'PRELIMINARY_NOTIFICATION',
      section_reference: 'SECTION_11',
      gazette_reference: 'DL-ND-01-2026-48921',
      gazette_volume_issue: 'Extraordinary Part II - Sec 3(ii), No. 114/2026',
      publication_status: 'PUBLISHED',
      published_on: '2026-01-15',
      effective_on: '2026-01-15',
      public_summary: 'Preliminary notification under Section 11(1) for acquisition of 18.42 hectares across Hoskote and Malur taluks for Bengaluru-Chennai Expressway.',
      public_url: '/verify/gazette?ref=DL-ND-01-2026-48921',
      sha256_hash: '9f83a492f1b0a456c802bc726487e615f3a09284cb91285098b671a8e104192b',
      bilingual_content: {
        hindi_title: 'धारा 11(1) के अधीन प्रारंभिक अधिसूचना - भूमि अर्जन, पुनर्वासन और पुनर्व्यवस्थापन में उचित प्रतिकर और पारदर्शिता का अधिकार अधिनियम, 2013',
        english_title: 'Preliminary Notification under Section 11(1) of Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013',
        ministry_hindi: 'सड़क परिवहन एवं राजमार्ग मंत्रालय',
        ministry_english: 'Ministry of Road Transport and Highways (MoRTH)',
        competent_authority_hindi: 'सक्षम प्राधिकारी (भूमि अर्जन) एवं विशेष भूमि अर्जन अधिकारी, होसकोटे',
        competent_authority_english: 'Competent Authority for Land Acquisition (CALA) & SLAO, Hoskote',
        hindi_body: 'एतद्द्वारा यह अधिसूचित किया जाता है कि अनुसूची में विनिर्दिष्ट भूमि की बेंगलुरु-चेन्नई एक्सप्रेसवे कॉरिडोर (पैकेज-1) के जनहित निर्माण हेतु आवश्यकता है अथवा आवश्यकता होने की संभावना है। कोई भी व्यक्ति, जो उक्त भूमि में हितबद्ध है, इस अधिसूचना के प्रकाशन के साठ (60) दिवस के भीतर धारा 15(1) के अधीन सक्षम प्राधिकारी के समक्ष लिखित आपत्ति प्रस्तुत कर सकता है।',
        english_body: 'It is hereby notified that the land specified in the Cadastral Schedule hereto is required or likely to be required for a public purpose, namely for the construction of the Bengaluru-Chennai Expressway Corridor (Package-1). Any person interested in any land may, within sixty (60) days from the publication date, submit objections in writing to the Competent Authority under Section 15(1).',
        solatium_pct: 100,
        additional_interest_pct: 12,
        objection_days: 60,
        gazette_category: 'Extraordinary / असाधारण'
      },
      cadastral_schedule: [
        { ulpin: 'KA-BNG-HSK-00101', survey_no: '45/1A', village: 'Doddagattiganabbe', taluk: 'Hoskote', district: 'Bengaluru Rural', extent_ha: 2.14, land_use: 'Agricultural (Dry)', owner_name: 'Muniyappa Gowda & Brothers' },
        { ulpin: 'KA-BNG-HSK-00102', survey_no: '45/1B', village: 'Doddagattiganabbe', taluk: 'Hoskote', district: 'Bengaluru Rural', extent_ha: 1.85, land_use: 'Agricultural (Wet)', owner_name: 'Lakshmamma W/o Late Venkataram' },
        { ulpin: 'KA-BNG-HSK-00103', survey_no: '48/2', village: 'Jadigenahalli', taluk: 'Hoskote', district: 'Bengaluru Rural', extent_ha: 3.40, land_use: 'Plantation (Eucalyptus)', owner_name: 'Chandrashekar S/o Narayanappa' },
        { ulpin: 'KA-BNG-HSK-00104', survey_no: '52/3A', village: 'Jadigenahalli', taluk: 'Hoskote', district: 'Bengaluru Rural', extent_ha: 0.95, land_use: 'Commercial', owner_name: 'Shree Krishna Agro Warehousing Ltd.' }
      ]
    },
    {
      notice_number: 'NOT-SEC15-2026-002',
      project_id: pMap['PRJ-BLR-CHE-01'] ? pMap['PRJ-BLR-CHE-01'].project_id : defaultProj.project_id,
      case_id: defaultCase.case_id,
      notice_type: 'OBJECTION_HEARING_NOTICE',
      section_reference: 'SECTION_15',
      gazette_reference: 'DL-ND-01-2026-49112',
      gazette_volume_issue: 'Extraordinary Part II - Sec 3(ii), No. 128/2026',
      publication_status: 'PUBLISHED',
      published_on: '2026-02-10',
      effective_on: '2026-02-25',
      public_summary: 'Notice for Hearing of Objections under Section 15(2) by CALA / SDM Court Hoskote.',
      public_url: '/verify/gazette?ref=DL-ND-01-2026-49112',
      sha256_hash: 'a147b28e83f0194857c91204859a72195821034f810395728340192847561928',
      bilingual_content: {
        hindi_title: 'धारा 15(2) के अधीन आक्षेपों की सुनवाई हेतु सार्वजनिक सूचना',
        english_title: 'Public Notice for Hearing of Objections under Section 15(2) by Competent Authority',
        ministry_hindi: 'सड़क परिवहन एवं राजमार्ग मंत्रालय',
        ministry_english: 'Ministry of Road Transport and Highways (MoRTH)',
        competent_authority_hindi: 'विशेष भूमि अर्जन अधिकारी एवं उपमंडल मजिस्ट्रेट (एस.डी.एम.), होसकोटे कोर्ट',
        competent_authority_english: 'Special Land Acquisition Officer & Sub-Divisional Magistrate Court, Hoskote',
        hearing_venue_hindi: 'सक्षम प्राधिकारी न्यायालय कक्ष, मिनी विधान सौध, होसकोटे',
        hearing_venue_english: 'Court of Competent Authority, Mini Vidhana Soudha, Hoskote',
        hearing_date: '2026-02-28',
        hindi_body: 'धारा 11(1) के प्रकाशन के उपरांत प्राप्त आपत्तियों की औपचारिक सुनवाई 28 फरवरी 2026 को प्रातः 10:30 बजे आयोजित की जाएगी। समस्त हितबद्ध भूमिधारी स्वयं अथवा अपने प्राधिकृत अधिवक्ता के माध्यम से उपस्थित होकर साक्ष्य प्रस्तुत कर सकते हैं।',
        english_body: 'Notice is hereby given that formal hearing of objections filed under Section 15(1) shall be conducted on 28th February 2026 at 10:30 AM. All interested landholders or their authorized legal counsels are summoned to appear and present evidence regarding land valuation and alignment.',
        objection_count_received: 14,
        gazette_category: 'Statutory Notice / वैधानिक सूचना'
      },
      cadastral_schedule: [
        { ulpin: 'KA-BNG-HSK-00101', survey_no: '45/1A', village: 'Doddagattiganabbe', taluk: 'Hoskote', district: 'Bengaluru Rural', extent_ha: 2.14, land_use: 'Agricultural (Dry)', owner_name: 'Muniyappa Gowda & Brothers' },
        { ulpin: 'KA-BNG-HSK-00103', survey_no: '48/2', village: 'Jadigenahalli', taluk: 'Hoskote', district: 'Bengaluru Rural', extent_ha: 3.40, land_use: 'Plantation (Eucalyptus)', owner_name: 'Chandrashekar S/o Narayanappa' }
      ]
    },
    {
      notice_number: 'NOT-SEC19-2026-003',
      project_id: pMap['PRJ-WDFC-02'] ? pMap['PRJ-WDFC-02'].project_id : defaultProj.project_id,
      case_id: defaultCase.case_id,
      notice_type: 'FINAL_DECLARATION',
      section_reference: 'SECTION_19',
      gazette_reference: 'CG-DL-E-15022026-249018',
      gazette_volume_issue: 'Extraordinary Part II - Sec 3(i), No. 204/2026',
      publication_status: 'PUBLISHED',
      published_on: '2026-02-15',
      effective_on: '2026-02-15',
      public_summary: 'Declaration of Acquisition under Section 19(1) of RFCTLARR Act 2013 for Western Dedicated Freight Corridor.',
      public_url: '/verify/gazette?ref=CG-DL-E-15022026-249018',
      sha256_hash: 'c83b2719a0f48294719284758291039485720194857201948572019485720194',
      bilingual_content: {
        hindi_title: 'धारा 19(1) के अधीन अंतिम घोषणा - अर्जन की निश्चायक सबूत',
        english_title: 'Final Declaration under Section 19(1) of RFCTLARR Act 2013 - Conclusive Proof of Acquisition',
        ministry_hindi: 'रेल मंत्रालय (समर्पित माल गलियारा निगम भारत लिमिटेड)',
        ministry_english: 'Ministry of Railways (Dedicated Freight Corridor Corporation of India Ltd.)',
        competent_authority_hindi: 'सक्षम प्राधिकारी (भूमि अर्जन) एवं उपायुक्त (रेवेन्यू), रेवाड़ी-अलवर खंड',
        competent_authority_english: 'Competent Authority (Land Acquisition) & Deputy Commissioner (Revenue), Rewari-Alwar Section',
        hindi_body: 'चूंकि समुचित सरकार का यह समाधान हो गया है कि अनुसूची में वर्णित भूमि की जनहित परियोजना वेस्टर्न डेडीकेटेड फ्रेट कॉरिडोर हेतु वास्तविक आवश्यकता है, अतः धारा 19(1) के अनुसरण में यह घोषणा की जाती है कि उक्त भूमि का अर्जन किया जा रहा है। यह घोषणा अर्जन की आवश्यकता का निश्चायक सबूत होगी।',
        english_body: 'Whereas the Appropriate Government is satisfied that the land described in the Cadastral Schedule is urgently required for a public purpose, to wit, the Western Dedicated Freight Corridor (WDFC). It is hereby declared under Section 19(1) that the said land is acquired. This declaration shall be conclusive proof that the land is required for a public purpose.',
        rehabilitation_summary_hindi: 'पुनर्वासन और पुनर्व्यवस्थापन योजना का सारांश कलेक्टर द्वारा विधिवत अनुमोदित कर प्रकाशित किया जा चुका है।',
        rehabilitation_summary_english: 'Summary of Rehabilitation and Resettlement Scheme has been approved by the Administrator and published.'
      },
      cadastral_schedule: [
        { ulpin: 'RJ-ALW-NEEM-00201', survey_no: '112/1', village: 'Shahjahanpur', taluk: 'Neemrana', district: 'Kotputli-Behror', extent_ha: 4.20, land_use: 'Industrial Border', owner_name: 'Rajasthan State Industrial Dev. Corp.' },
        { ulpin: 'RJ-ALW-NEEM-00202', survey_no: '114/3', village: 'Shahjahanpur', taluk: 'Neemrana', district: 'Kotputli-Behror', extent_ha: 1.60, land_use: 'Agricultural (Irrigated)', owner_name: 'Ramkishan Yadav & Heirs' },
        { ulpin: 'RJ-ALW-NEEM-00203', survey_no: '118/4B', village: 'Majri Kalan', taluk: 'Neemrana', district: 'Kotputli-Behror', extent_ha: 2.85, land_use: 'Commercial Godown', owner_name: 'Aravalli Logistics Hub LLP' }
      ]
    },
    {
      notice_number: 'NOT-SEC23-2026-004',
      project_id: pMap['PRJ-WDFC-02'] ? pMap['PRJ-WDFC-02'].project_id : defaultProj.project_id,
      case_id: defaultCase.case_id,
      notice_type: 'COLLECTORS_AWARD',
      section_reference: 'SECTION_23_30',
      gazette_reference: 'CG-DL-E-01032026-251140',
      gazette_volume_issue: 'Extraordinary Part II - Sec 3(ii), No. 312/2026',
      publication_status: 'PUBLISHED',
      published_on: '2026-03-01',
      effective_on: '2026-03-01',
      public_summary: 'Collector’s Award under Section 23 & 30 with 100% Solatium and 12% statutory additional market interest.',
      public_url: '/verify/gazette?ref=CG-DL-E-01032026-251140',
      sha256_hash: 'd45e789123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      bilingual_content: {
        hindi_title: 'धारा 23 एवं 30 के अधीन समाहर्ता (कलेक्टर) का अधिनिर्णय एवं तोषण (सोलैटियम) विवरण',
        english_title: 'Collector’s Award and Solatium Determination under Section 23 & 30 of RFCTLARR Act 2013',
        ministry_hindi: 'रेल मंत्रालय एवं राज्य राजस्व विभाग',
        ministry_english: 'Ministry of Railways & State Department of Revenue',
        competent_authority_hindi: 'जिला समाहर्ता एवं जिला दंडाधिकारी / सक्षम प्राधिकारी',
        competent_authority_english: 'District Collector & District Magistrate / CALA',
        hindi_body: 'धारा 23 एवं 30 के प्रावधानों के तहत सक्षम प्राधिकारी द्वारा प्रभावित भू-स्वामियों के पक्ष में बाजार मूल्य, 1.25x ग्रामीण गुणक, 100% तोषण (सोलैटियम) तथा 12% वार्षिक ब्याज सहित कुल अधिनिर्णय प्रतिकर राशि पारित की जाती है। अधिनिर्णय राशि धारा 96 के तहत आयकर से पूर्णतः मुक्त है।',
        english_body: 'Pursuant to Sections 23 & 30, the Competent Authority hereby awards compensation comprising Market Value, 1.25x Rural Multiplier factor, 100% Statutory Solatium, and 12% per annum Additional Market Interest. Under Section 96 of the Act, all awarded compensation is 100% exempt from Income Tax.',
        solatium_pct: 100,
        additional_interest_pct: 12,
        multiplier_factor: 1.25,
        total_award_inr: 84520000,
        tax_exemption_clause: 'Section 96 RFCTLARR Act 2013: No income tax or stamp duty leviable.'
      },
      cadastral_schedule: [
        { ulpin: 'RJ-ALW-NEEM-00201', survey_no: '112/1', village: 'Shahjahanpur', taluk: 'Neemrana', district: 'Kotputli-Behror', extent_ha: 4.20, land_use: 'Industrial Border', owner_name: 'Rajasthan State Industrial Dev. Corp.', award_inr: 42000000 },
        { ulpin: 'RJ-ALW-NEEM-00202', survey_no: '114/3', village: 'Shahjahanpur', taluk: 'Neemrana', district: 'Kotputli-Behror', extent_ha: 1.60, land_use: 'Agricultural (Irrigated)', owner_name: 'Ramkishan Yadav & Heirs', award_inr: 16520000 },
        { ulpin: 'RJ-ALW-NEEM-00203', survey_no: '118/4B', village: 'Majri Kalan', taluk: 'Neemrana', district: 'Kotputli-Behror', extent_ha: 2.85, land_use: 'Commercial Godown', owner_name: 'Aravalli Logistics Hub LLP', award_inr: 26000000 }
      ]
    },
    {
      notice_number: 'NOT-SEC11-2026-005',
      project_id: pMap['PRJ-DME-03'] ? pMap['PRJ-DME-03'].project_id : defaultProj.project_id,
      case_id: defaultCase.case_id,
      notice_type: 'PRELIMINARY_NOTIFICATION',
      section_reference: 'SECTION_11',
      gazette_reference: 'GJ-BRD-2026-08129',
      gazette_volume_issue: 'Gujarat Government Gazette Part IV-C, No. 44/2026',
      publication_status: 'CALA_APPROVED',
      published_on: null,
      effective_on: null,
      public_summary: 'Preliminary Notification draft vetted and digitally endorsed by CALA Vadodara, awaiting final state gazette press release.',
      public_url: '/verify/gazette?ref=GJ-BRD-2026-08129',
      sha256_hash: 'e892c94810293847561029384756102938475610293847561029384756102938',
      bilingual_content: {
        hindi_title: 'धारा 11(1) प्रारंभिक अधिसूचना - दिल्ली-मुंबई एक्सप्रेसवे वडोदरा स्पर',
        english_title: 'Section 11(1) Preliminary Notification - Delhi-Mumbai Expressway Vadodara Spur',
        ministry_hindi: 'भारतीय राष्ट्रीय राजमार्ग प्राधिकरण (सड़क परिवहन एवं राजमार्ग मंत्रालय)',
        ministry_english: 'National Highways Authority of India (MoRTH)',
        competent_authority_hindi: 'विशेष भूमि अर्जन अधिकारी (एनएच), वडोदरा कलेक्ट्रेट',
        competent_authority_english: 'Special Land Acquisition Officer (NH), Vadodara Collectorate',
        hindi_body: 'वडोदरा जिले के सावली एवं वाघोडिया तालुकों में दिल्ली-मुंबई एक्सप्रेसवे संयोजन हेतु 12.80 हेक्टेयर भूमि अर्जन का प्रस्ताव है।',
        english_body: 'Proposal for acquisition of 12.80 Hectares of land across Savli and Waghodia taluks of Vadodara District for Delhi-Mumbai Expressway connectivity.',
        solatium_pct: 100,
        additional_interest_pct: 12,
        objection_days: 60
      },
      cadastral_schedule: [
        { ulpin: 'GJ-BRD-SAV-00301', survey_no: '88/2', village: 'Manjusar', taluk: 'Savli', district: 'Vadodara', extent_ha: 4.10, land_use: 'Agricultural', owner_name: 'Patel Jignesh Kumar & Family' },
        { ulpin: 'GJ-BRD-SAV-00302', survey_no: '92/1', village: 'Lamdapura', taluk: 'Savli', district: 'Vadodara', extent_ha: 3.50, land_use: 'Semi-Industrial', owner_name: 'Gujarat Agro Logistics Corp' }
      ]
    },
    {
      notice_number: 'NOT-SEC19-2026-006',
      project_id: pMap['PRJ-PVG-04'] ? pMap['PRJ-PVG-04'].project_id : defaultProj.project_id,
      case_id: defaultCase.case_id,
      notice_type: 'FINAL_DECLARATION',
      section_reference: 'SECTION_19',
      gazette_reference: 'KA-TUM-2026-00318',
      gazette_volume_issue: 'Karnataka Gazette Extraordinary No. 89/2026',
      publication_status: 'DRAFT',
      published_on: null,
      effective_on: null,
      public_summary: 'Draft Section 19(1) declaration for Pavagada Solar Park Phase-2 transmission corridor.',
      public_url: '/verify/gazette?ref=KA-TUM-2026-00318',
      sha256_hash: 'f910293847561029384756102938475610293847561029384756102938475610',
      bilingual_content: {
        hindi_title: 'धारा 19(1) अंतिम घोषणा प्रारूप - पावागड़ा सौर पार्क ट्रांसमिशन कॉरिडोर',
        english_title: 'Section 19(1) Draft Final Declaration - Pavagada Solar Park Transmission Corridor',
        ministry_hindi: 'नवीन एवं नवीकरणीय ऊर्जा मंत्रालय / केआरडीएल',
        ministry_english: 'Ministry of New & Renewable Energy / KREDL',
        competent_authority_hindi: 'अपर उपायुक्त एवं सक्षम प्राधिकारी, तुमकुरु',
        competent_authority_english: 'Additional Deputy Commissioner & CALA, Tumakuru',
        hindi_body: 'पावागड़ा अल्ट्रा मेगा सौर परियोजना के 400kV पारेषण कॉरिडोर विस्तार हेतु भूमि की विधिवत घोषणा।',
        english_body: 'Formal acquisition declaration for the 400kV transmission evacuation corridor of Pavagada Ultra Mega Solar Power Park.'
      },
      cadastral_schedule: [
        { ulpin: 'KA-TUM-PVG-00401', survey_no: '210/1', village: 'Tirumani', taluk: 'Pavagada', district: 'Tumakuru', extent_ha: 6.20, land_use: 'Barren / Solar Lease', owner_name: 'Pavagada Farmers Solar Trust' }
      ]
    }
  ];

  for (const g of gazettes) {
    await client.query(`
      INSERT INTO statutory_notices (
        statutory_notice_id,
        notice_number,
        project_id,
        case_id,
        notice_type,
        section_reference,
        gazette_reference,
        gazette_volume_issue,
        publication_status,
        published_on,
        effective_on,
        public_summary,
        public_url,
        sha256_hash,
        bilingual_content,
        cadastral_schedule,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT (notice_number) DO UPDATE SET
        gazette_volume_issue = EXCLUDED.gazette_volume_issue,
        gazette_reference = EXCLUDED.gazette_reference,
        publication_status = EXCLUDED.publication_status,
        published_on = EXCLUDED.published_on,
        effective_on = EXCLUDED.effective_on,
        public_summary = EXCLUDED.public_summary,
        public_url = EXCLUDED.public_url,
        sha256_hash = EXCLUDED.sha256_hash,
        bilingual_content = EXCLUDED.bilingual_content,
        cadastral_schedule = EXCLUDED.cadastral_schedule,
        updated_at = CURRENT_TIMESTAMP;
    `, [
      g.notice_number,
      g.project_id,
      g.case_id,
      g.notice_type,
      g.section_reference,
      g.gazette_reference,
      g.gazette_volume_issue,
      g.publication_status,
      g.published_on,
      g.effective_on,
      g.public_summary,
      g.public_url,
      g.sha256_hash,
      JSON.stringify(g.bilingual_content),
      JSON.stringify(g.cadastral_schedule),
      defaultUser ? defaultUser.user_id : null
    ]);
  }

  const countRes = await client.query(`SELECT COUNT(*) FROM statutory_notices`);
  console.log(`Successfully synced statutory_notices table! Total records: ${countRes.rows[0].count}`);

  await client.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
