export interface GisParcel {
  id: string;
  ulpin: string;
  khasra: string;
  village: string;
  taluk: string;
  district: string;
  areaHa: number;
  landCategory: "Agricultural" | "Commercial" | "Residential" | "Forest/Water";
  status: "ACQUIRED" | "AWARDED" | "SURVEY_PENDING" | "OBJECTION_FILED" | "DISPUTED";
  ownerMasked: string;
  estimatedAwardINR: number;
  coordinates: [number, number][]; // Polygon vertices
}

export interface GeotaggedPhoto {
  id: string;
  title: string;
  ulpin: string;
  surveyNo: string;
  coordinates: [number, number];
  azimuthDeg: number;
  capturedAt: string;
  surveyor: string;
  photoUrl: string;
  accuracyMeters: number;
  notes: string;
}

export interface CorridorAlignment {
  id: string;
  name: string;
  code: string;
  defaultCenter: [number, number];
  defaultZoom: number;
  centerline: [number, number][];
}

// Center around Bengaluru Rural (STRR corridor)
export const BENGALURU_STRR_CORRIDOR: CorridorAlignment = {
  id: "STRR_BLR_01",
  name: "Bengaluru Satellite Town Ring Road (NH-948A Pkg 2)",
  code: "KRDCL/STRR/BLR-RURAL/01",
  defaultCenter: [13.2941, 77.5342],
  defaultZoom: 14,
  centerline: [
    [13.282, 77.518],
    [13.287, 77.525],
    [13.291, 77.531],
    [13.294, 77.535],
    [13.297, 77.541],
    [13.302, 77.548],
    [13.308, 77.556],
  ],
};

export const DELHI_MUMBAI_CORRIDOR: CorridorAlignment = {
  id: "DEL_MUM_04",
  name: "Delhi-Mumbai Expressway (Vadodara Spur Section)",
  code: "NHAI/EXP/DEL-MUM/PKG-04",
  defaultCenter: [22.3072, 73.1812],
  defaultZoom: 14,
  centerline: [
    [22.298, 73.168],
    [22.302, 73.174],
    [22.306, 73.179],
    [22.311, 73.185],
    [22.316, 73.192],
    [22.321, 73.199],
  ],
};

export const MOCK_CADASTRAL_PARCELS: GisParcel[] = [
  {
    id: "PCL-KA-001",
    ulpin: "KA-BLR-2026-0041",
    khasra: "142/2A",
    village: "Doddaballapur",
    taluk: "Doddaballapur",
    district: "Bengaluru Rural",
    areaHa: 1.45,
    landCategory: "Agricultural",
    status: "AWARDED",
    ownerMasked: "Rameshwar Sharma (Khatedar)",
    estimatedAwardINR: 12522400,
    coordinates: [
      [13.292, 77.531],
      [13.295, 77.532],
      [13.296, 77.536],
      [13.293, 77.535],
    ],
  },
  {
    id: "PCL-KA-002",
    ulpin: "KA-BLR-2026-0042",
    khasra: "142/2B",
    village: "Doddaballapur",
    taluk: "Doddaballapur",
    district: "Bengaluru Rural",
    areaHa: 0.85,
    landCategory: "Agricultural",
    status: "ACQUIRED",
    ownerMasked: "M**** P**** Patel",
    estimatedAwardINR: 17000000,
    coordinates: [
      [13.293, 77.535],
      [13.296, 77.536],
      [13.297, 77.54],
      [13.294, 77.539],
    ],
  },
  {
    id: "PCL-KA-003",
    ulpin: "KA-BLR-2026-0043",
    khasra: "143",
    village: "Doddaballapur",
    taluk: "Doddaballapur",
    district: "Bengaluru Rural",
    areaHa: 0.45,
    landCategory: "Commercial",
    status: "OBJECTION_FILED",
    ownerMasked: "Anand Agro Warehouse",
    estimatedAwardINR: 13500000,
    coordinates: [
      [13.294, 77.539],
      [13.297, 77.54],
      [13.299, 77.544],
      [13.296, 77.543],
    ],
  },
  {
    id: "PCL-KA-004",
    ulpin: "KA-BLR-2026-0044",
    khasra: "144/B",
    village: "Doddaballapur",
    taluk: "Doddaballapur",
    district: "Bengaluru Rural",
    areaHa: 1.8,
    landCategory: "Forest/Water",
    status: "DISPUTED",
    ownerMasked: "State Forest Reserve / Grama Natham",
    estimatedAwardINR: 0,
    coordinates: [
      [13.296, 77.543],
      [13.299, 77.544],
      [13.302, 77.549],
      [13.299, 77.548],
    ],
  },
  {
    id: "PCL-KA-005",
    ulpin: "KA-BLR-2026-0045",
    khasra: "145",
    village: "Doddaballapur",
    taluk: "Doddaballapur",
    district: "Bengaluru Rural",
    areaHa: 1.1,
    landCategory: "Agricultural",
    status: "SURVEY_PENDING",
    ownerMasked: "Smt. Shanti Devi",
    estimatedAwardINR: 22000000,
    coordinates: [
      [13.287, 77.525],
      [13.29, 77.526],
      [13.291, 77.53],
      [13.288, 77.529],
    ],
  },
];

export const MOCK_GEOTAGGED_PHOTOS: GeotaggedPhoto[] = [
  {
    id: "PHOTO-01",
    title: "Corner Boundary Stone Pillar #1",
    ulpin: "KA-BLR-2026-0041",
    surveyNo: "142/2A",
    coordinates: [13.2935, 77.533],
    azimuthDeg: 42,
    capturedAt: "08 Sep 2026, 11:15 IST",
    surveyor: "Suresh Patil (Head Surveyor)",
    accuracyMeters: 1.4,
    notes: "Boundary pillar fixed with differential GPS coordinates. Witnessed by landholder.",
    photoUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "PHOTO-02",
    title: "Agricultural Crop & Tube-Well Asset",
    ulpin: "KA-BLR-2026-0042",
    surveyNo: "142/2A",
    coordinates: [13.2952, 77.5375],
    azimuthDeg: 118,
    capturedAt: "08 Sep 2026, 11:42 IST",
    surveyor: "Suresh Patil (Head Surveyor)",
    accuracyMeters: 1.8,
    notes: "Active borewell and pump house recorded for Section 23 asset valuation.",
    photoUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "PHOTO-03",
    title: "Commercial Warehouse Structure Overlap",
    ulpin: "KA-BLR-2026-0043",
    surveyNo: "143",
    coordinates: [13.2965, 77.5415],
    azimuthDeg: 260,
    capturedAt: "08 Sep 2026, 12:10 IST",
    surveyor: "Suresh Patil (Head Surveyor)",
    accuracyMeters: 2.1,
    notes: "30-meter shed overhang intersecting the right-of-way corridor centerline.",
    photoUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
  },
];

// Helper to compute an approximate polygon buffer around a polyline
export function generateBufferPolygon(
  polyline: [number, number][],
  bufferMeters: number
): [number, number][] {
  if (!polyline || polyline.length < 2) return [];

  // Approximate offset in degrees (~111,000 meters per degree latitude)
  const offsetDeg = bufferMeters / 111000;

  const leftSide: [number, number][] = [];
  const rightSide: [number, number][] = [];

  for (let i = 0; i < polyline.length; i++) {
    const [lat, lng] = polyline[i];
    // Approximate perpendicular vector
    let dx = 0;
    let dy = 0;

    if (i < polyline.length - 1) {
      dx = polyline[i + 1][1] - lng;
      dy = polyline[i + 1][0] - lat;
    } else {
      dx = lng - polyline[i - 1][1];
      dy = lat - polyline[i - 1][0];
    }

    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    leftSide.push([lat + ny * offsetDeg, lng + nx * offsetDeg]);
    rightSide.unshift([lat - ny * offsetDeg, lng - nx * offsetDeg]);
  }

  return [...leftSide, ...rightSide];
}

export const CORRIDORS = [BENGALURU_STRR_CORRIDOR, DELHI_MUMBAI_CORRIDOR];
export const SAMPLE_PARCELS = MOCK_CADASTRAL_PARCELS;
export const SAMPLE_GEO_PHOTOS = MOCK_GEOTAGGED_PHOTOS;
export const generateCorridorBuffer = generateBufferPolygon;

export function calculatePolylineDistanceKm(coords: [number, number][]): number {
  if (!coords || coords.length < 2) return 0;
  let totalKm = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const lat1 = coords[i][0];
    const lon1 = coords[i][1];
    const lat2 = coords[i + 1][0];
    const lon2 = coords[i + 1][1];
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalKm += R * c;
  }
  return Number(totalKm.toFixed(2));
}

export interface CityMapPreset {
  id: string;
  name: string;
  nameHi: string;
  state: string;
  stateHi: string;
  center: [number, number];
  zoom: number;
  corridorName: string;
  corridorNameHi: string;
  code: string;
  centerline: [number, number][];
  parcels: GisParcel[];
  photos: GeotaggedPhoto[];
}

export const SUPPORTED_CITIES: CityMapPreset[] = [
  {
    id: "bengaluru",
    name: "Bengaluru",
    nameHi: "बेंगलुरु",
    state: "Karnataka",
    stateHi: "कर्नाटक",
    center: [13.2941, 77.5342],
    zoom: 14,
    corridorName: "Satellite Town Ring Road (STRR NH-948A)",
    corridorNameHi: "सैटेलाइट टाउन रिंग रोड (एसटीआरआर एनएच-948A)",
    code: "KA-BLR-STRR-01",
    centerline: BENGALURU_STRR_CORRIDOR.centerline,
    parcels: MOCK_CADASTRAL_PARCELS,
    photos: MOCK_GEOTAGGED_PHOTOS,
  },
  {
    id: "bengaluru-chennai",
    name: "Hosakote / Malur",
    nameHi: "होसकोटे / मालूर",
    state: "Karnataka",
    stateHi: "कर्नाटक",
    center: [13.035, 77.885],
    zoom: 14,
    corridorName: "Bengaluru-Chennai Expressway (Hosakote-Malur Stretch)",
    corridorNameHi: "बेंगलुरु-चेन्नई एक्सप्रेसवे (होसकोटे-मालूर खंड)",
    code: "NHAI/EXP/BLR-CHN/PKG-01",
    centerline: [
      [13.072, 77.798],
      [13.055, 77.835],
      [13.040, 77.870],
      [13.028, 77.910],
      [13.015, 77.950],
      [12.998, 77.992],
    ],
    parcels: [
      {
        id: "PCL-BC-001",
        ulpin: "KA-BLR-2026-0041",
        khasra: "142/2A",
        village: "Hosakote",
        taluk: "Hosakote",
        district: "Bengaluru Rural",
        areaHa: 1.45,
        landCategory: "Agricultural",
        status: "AWARDED",
        ownerMasked: "Rameshwar Sharma (Khatedar)",
        estimatedAwardINR: 12522400,
        coordinates: [
          [13.033, 77.882],
          [13.037, 77.884],
          [13.038, 77.889],
          [13.034, 77.887],
        ],
      },
      {
        id: "PCL-BC-002",
        ulpin: "KA-BLR-2026-0042",
        khasra: "143/1",
        village: "Malur",
        taluk: "Malur",
        district: "Kolar",
        areaHa: 2.10,
        landCategory: "Commercial",
        status: "ACQUIRED",
        ownerMasked: "Venkatesh Agro Logistics",
        estimatedAwardINR: 28400000,
        coordinates: [
          [13.034, 77.887],
          [13.038, 77.889],
          [13.040, 77.894],
          [13.036, 77.892],
        ],
      },
      {
        id: "PCL-BC-003",
        ulpin: "KA-BLR-2026-0043",
        khasra: "144",
        village: "Doddahullur",
        taluk: "Hosakote",
        district: "Bengaluru Rural",
        areaHa: 0.95,
        landCategory: "Agricultural",
        status: "SURVEY_PENDING",
        ownerMasked: "Anand Murthy & Sons",
        estimatedAwardINR: 15200000,
        coordinates: [
          [13.036, 77.892],
          [13.040, 77.894],
          [13.042, 77.899],
          [13.038, 77.897],
        ],
      },
      {
        id: "PCL-BC-004",
        ulpin: "KA-BLR-2026-0044",
        khasra: "145/2",
        village: "Thirumalashettahalli",
        taluk: "Hosakote",
        district: "Bengaluru Rural",
        areaHa: 1.80,
        landCategory: "Forest/Water",
        status: "DISPUTED",
        ownerMasked: "State Irrigation Canal Reserve",
        estimatedAwardINR: 0,
        coordinates: [
          [13.038, 77.897],
          [13.042, 77.899],
          [13.044, 77.904],
          [13.040, 77.902],
        ],
      },
    ],
    photos: [
      {
        id: "PHOTO-BC-01",
        title: "Hosakote Expressway Interchange Benchmark",
        ulpin: "KA-BLR-2026-0041",
        surveyNo: "142/2A",
        coordinates: [13.035, 77.885],
        azimuthDeg: 65,
        capturedAt: "08 Sep 2026, 11:30 IST",
        surveyor: "Suresh Patil (Head Surveyor)",
        accuracyMeters: 1.1,
        notes: "NHAI right-of-way benchmark stone verified against chainage 18+400.",
        photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "western-dfc",
    name: "Bharuch / Dahej",
    nameHi: "भरूच / दाहेज",
    state: "Gujarat",
    stateHi: "गुजरात",
    center: [21.705, 72.998],
    zoom: 14,
    corridorName: "Western Dedicated Freight Corridor (Feeder Link)",
    corridorNameHi: "पश्चिमी समर्पित फ्रेट कॉरिडोर (फीडर लाइन)",
    code: "DFCCIL/WDFC/GUJ-MAH/PKG-2",
    centerline: [
      [21.620, 72.930],
      [21.660, 72.965],
      [21.705, 72.998],
      [21.755, 73.035],
      [21.800, 73.070],
    ],
    parcels: [
      {
        id: "PCL-DFC-001",
        ulpin: "GJ-BHR-2026-0101",
        khasra: "214/1",
        village: "Vagra",
        taluk: "Vagra",
        district: "Bharuch",
        areaHa: 2.80,
        landCategory: "Commercial",
        status: "AWARDED",
        ownerMasked: "Dahej Port Logistics Hub",
        estimatedAwardINR: 36000000,
        coordinates: [
          [21.702, 72.994],
          [21.706, 72.996],
          [21.708, 73.001],
          [21.704, 72.999],
        ],
      },
      {
        id: "PCL-DFC-002",
        ulpin: "GJ-BHR-2026-0102",
        khasra: "215",
        village: "Amod",
        taluk: "Amod",
        district: "Bharuch",
        areaHa: 1.60,
        landCategory: "Agricultural",
        status: "ACQUIRED",
        ownerMasked: "J. P. Gohil & Brothers",
        estimatedAwardINR: 22000000,
        coordinates: [
          [21.704, 72.999],
          [21.708, 73.001],
          [21.710, 73.006],
          [21.706, 73.004],
        ],
      },
    ],
    photos: [
      {
        id: "PHOTO-DFC-01",
        title: "WDFC Feeder Line Track Peg Marker",
        ulpin: "GJ-BHR-2026-0101",
        surveyNo: "214/1",
        coordinates: [21.705, 72.997],
        azimuthDeg: 120,
        capturedAt: "06 Sep 2026, 14:10 IST",
        surveyor: "S. K. Verma (GM Civil)",
        accuracyMeters: 1.2,
        notes: "Rail RoW buffer demarcated with DGPS boundary monuments.",
        photoUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "delhi",
    name: "Delhi (NCR)",
    nameHi: "दिल्ली (एनसीआर)",
    state: "Delhi / Haryana",
    stateHi: "दिल्ली / हरियाणा",
    center: [28.5355, 77.061],
    zoom: 14,
    corridorName: "Dwarka Expressway & Urban Extension Road (NH-248BB)",
    corridorNameHi: "द्वारका एक्सप्रेसवे एवं अर्बन एक्सटेंशन रोड",
    code: "NHAI/DEL-NCR/DWRK-01",
    centerline: [
      [28.520, 77.045],
      [28.528, 77.053],
      [28.535, 77.061],
      [28.543, 77.070],
      [28.551, 77.079],
    ],
    parcels: [
      {
        id: "PCL-DL-001",
        ulpin: "DL-NCR-2026-0101",
        khasra: "84/1",
        village: "Bijwasan",
        taluk: "South West Delhi",
        district: "New Delhi",
        areaHa: 1.85,
        landCategory: "Commercial",
        status: "AWARDED",
        ownerMasked: "Vikas Buildcon Logistics Ltd",
        estimatedAwardINR: 34500000,
        coordinates: [
          [28.533, 77.058],
          [28.537, 77.059],
          [28.538, 77.064],
          [28.534, 77.063],
        ],
      },
      {
        id: "PCL-DL-002",
        ulpin: "DL-NCR-2026-0102",
        khasra: "85/2B",
        village: "Bamnoli",
        taluk: "Dwarka Sub-City",
        district: "South West Delhi",
        areaHa: 2.10,
        landCategory: "Agricultural",
        status: "ACQUIRED",
        ownerMasked: "Ch. Ram Swaroop & Sons",
        estimatedAwardINR: 28400000,
        coordinates: [
          [28.534, 77.063],
          [28.538, 77.064],
          [28.540, 77.069],
          [28.536, 77.068],
        ],
      },
      {
        id: "PCL-DL-003",
        ulpin: "DL-NCR-2026-0103",
        khasra: "86",
        village: "Najafgarh",
        taluk: "Najafgarh",
        district: "South West Delhi",
        areaHa: 0.95,
        landCategory: "Residential",
        status: "OBJECTION_FILED",
        ownerMasked: "Sunil Tyagi & Co-Owners",
        estimatedAwardINR: 19500000,
        coordinates: [
          [28.536, 77.068],
          [28.540, 77.069],
          [28.542, 77.073],
          [28.538, 77.072],
        ],
      },
    ],
    photos: [
      {
        id: "PHOTO-DL-01",
        title: "Dwarka Viaduct Pier Demarcation Pillar #14",
        ulpin: "DL-NCR-2026-0101",
        surveyNo: "84/1",
        coordinates: [28.535, 77.060],
        azimuthDeg: 90,
        capturedAt: "09 Sep 2026, 10:30 IST",
        surveyor: "K. L. Meena (Executive Surveyor)",
        accuracyMeters: 1.2,
        notes: "GPS boundary benchmark verified for Metro rail interchange viaduct.",
        photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "mumbai",
    name: "Mumbai (MMR)",
    nameHi: "मुंबई (एमएमआर)",
    state: "Maharashtra",
    stateHi: "महाराष्ट्र",
    center: [19.1850, 73.0120],
    zoom: 14,
    corridorName: "Mumbai-Nagpur Samruddhi Expressway (JNPT Connector)",
    corridorNameHi: "मुंबई-नागपुर समृद्धि एक्सप्रेसवे (जेएनपीटी लिंक)",
    code: "MSRDC/SAMRUDDHI/PKG-14",
    centerline: [
      [19.172, 72.998],
      [19.179, 73.006],
      [19.185, 73.012],
      [19.192, 73.019],
      [19.199, 73.027],
    ],
    parcels: [
      {
        id: "PCL-MH-001",
        ulpin: "MH-MUM-2026-0201",
        khasra: "112/3",
        village: "Bhiwandi",
        taluk: "Bhiwandi",
        district: "Thane",
        areaHa: 1.65,
        landCategory: "Commercial",
        status: "ACQUIRED",
        ownerMasked: "Ganesh Warehousing Trust",
        estimatedAwardINR: 42000000,
        coordinates: [
          [19.182, 73.008],
          [19.186, 73.010],
          [19.187, 73.015],
          [19.183, 73.013],
        ],
      },
      {
        id: "PCL-MH-002",
        ulpin: "MH-MUM-2026-0202",
        khasra: "113",
        village: "Kalyan",
        taluk: "Kalyan",
        district: "Thane",
        areaHa: 2.40,
        landCategory: "Agricultural",
        status: "AWARDED",
        ownerMasked: "Pandurang Deshmukh",
        estimatedAwardINR: 31000000,
        coordinates: [
          [19.183, 73.013],
          [19.187, 73.015],
          [19.189, 73.020],
          [19.185, 73.018],
        ],
      },
    ],
    photos: [
      {
        id: "PHOTO-MH-01",
        title: "Samruddhi Expressway Junction Peg",
        ulpin: "MH-MUM-2026-0201",
        surveyNo: "112/3",
        coordinates: [19.184, 73.011],
        azimuthDeg: 140,
        capturedAt: "07 Sep 2026, 14:15 IST",
        surveyor: "P. R. Shinde (SLAO Amin)",
        accuracyMeters: 1.5,
        notes: "Right of way verified against MSRDC alignment design.",
        photoUrl: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    nameHi: "हैदराबाद",
    state: "Telangana",
    stateHi: "तेलंगाना",
    center: [17.2400, 78.4300],
    zoom: 14,
    corridorName: "Hyderabad Regional Ring Road (RRR - Southern Section)",
    corridorNameHi: "हैदराबाद रीजनल रिंग रोड (आरआरआर)",
    code: "HMDA/RRR/HYD-SOUTH/02",
    centerline: [
      [17.228, 78.415],
      [17.234, 78.423],
      [17.240, 78.430],
      [17.248, 78.439],
      [17.255, 78.447],
    ],
    parcels: [
      {
        id: "PCL-TG-001",
        ulpin: "TG-HYD-2026-0301",
        khasra: "204/A",
        village: "Shamshabad",
        taluk: "Shamshabad",
        district: "Rangareddy",
        areaHa: 1.90,
        landCategory: "Agricultural",
        status: "AWARDED",
        ownerMasked: "V. Krishna Reddy (Pattadar)",
        estimatedAwardINR: 27500000,
        coordinates: [
          [17.237, 78.426],
          [17.241, 78.428],
          [17.242, 78.433],
          [17.238, 78.431],
        ],
      },
      {
        id: "PCL-TG-002",
        ulpin: "TG-HYD-2026-0302",
        khasra: "205",
        village: "Kandukur",
        taluk: "Kandukur",
        district: "Rangareddy",
        areaHa: 1.25,
        landCategory: "Commercial",
        status: "ACQUIRED",
        ownerMasked: "Deccan Infra Developers",
        estimatedAwardINR: 32000000,
        coordinates: [
          [17.238, 78.431],
          [17.242, 78.433],
          [17.245, 78.438],
          [17.241, 78.436],
        ],
      },
    ],
    photos: [
      {
        id: "PHOTO-TG-01",
        title: "RRR Airport Spur Demarcation Stone",
        ulpin: "TG-HYD-2026-0301",
        surveyNo: "204/A",
        coordinates: [17.239, 78.429],
        azimuthDeg: 210,
        capturedAt: "06 Sep 2026, 09:40 IST",
        surveyor: "B. Narsing Rao (Surveyor)",
        accuracyMeters: 1.1,
        notes: "Dharani portal cadastral boundary matched with field coordinates.",
        photoUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "ahmedabad",
    name: "Ahmedabad / Vadodara",
    nameHi: "अहमदाबाद / वडोदरा",
    state: "Gujarat",
    stateHi: "गुजरात",
    center: [22.3072, 73.1812],
    zoom: 14,
    corridorName: "Delhi-Mumbai Expressway (Vadodara-Ahmedabad Spur)",
    corridorNameHi: "दिल्ली-मुंबई एक्सप्रेसवे (वडोदरा स्पर)",
    code: "NHAI/EXP/DEL-MUM/PKG-04",
    centerline: DELHI_MUMBAI_CORRIDOR.centerline,
    parcels: [
      {
        id: "PCL-GJ-001",
        ulpin: "GJ-AHM-2026-0401",
        khasra: "68/2",
        village: "Anand",
        taluk: "Vadodara Rural",
        district: "Vadodara",
        areaHa: 2.10,
        landCategory: "Agricultural",
        status: "ACQUIRED",
        ownerMasked: "Patel Haribhai Narayandas",
        estimatedAwardINR: 23500000,
        coordinates: [
          [22.304, 73.176],
          [22.308, 73.178],
          [22.309, 73.183],
          [22.305, 73.181],
        ],
      },
      {
        id: "PCL-GJ-002",
        ulpin: "GJ-AHM-2026-0402",
        khasra: "69",
        village: "Dholera",
        taluk: "Dholera SIR",
        district: "Ahmedabad",
        areaHa: 3.50,
        landCategory: "Commercial",
        status: "AWARDED",
        ownerMasked: "Gujarat Industrial Development Corp",
        estimatedAwardINR: 48000000,
        coordinates: [
          [22.305, 73.181],
          [22.309, 73.183],
          [22.312, 73.188],
          [22.308, 73.186],
        ],
      },
    ],
    photos: [
      {
        id: "PHOTO-GJ-01",
        title: "Vadodara Spur Chainage Peg KM 184",
        ulpin: "GJ-AHM-2026-0401",
        surveyNo: "68/2",
        coordinates: [22.306, 73.179],
        azimuthDeg: 45,
        capturedAt: "05 Sep 2026, 16:20 IST",
        surveyor: "J. K. Parmar (Senior Surveyor)",
        accuracyMeters: 1.3,
        notes: "GIDC demarcation verified with AnyROR records.",
        photoUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "chennai",
    name: "Chennai",
    nameHi: "चेन्नई",
    state: "Tamil Nadu",
    stateHi: "तमिलनाडु",
    center: [13.0100, 79.9800],
    zoom: 14,
    corridorName: "Bengaluru-Chennai Expressway (Sriperumbudur Section)",
    corridorNameHi: "बेंगलुरु-चेन्नई एक्सप्रेसवे (श्रीपेरंबुदूर लिंक)",
    code: "NHAI/BCE/PKG-03/TN",
    centerline: [
      [12.998, 79.965],
      [13.004, 79.972],
      [13.010, 79.980],
      [13.017, 79.988],
      [13.024, 79.996],
    ],
    parcels: [
      {
        id: "PCL-TN-001",
        ulpin: "TN-CHE-2026-0501",
        khasra: "340/2",
        village: "Sriperumbudur",
        taluk: "Sriperumbudur",
        district: "Kanchipuram",
        areaHa: 1.80,
        landCategory: "Commercial",
        status: "ACQUIRED",
        ownerMasked: "Murugan Logistics & Auto Components",
        estimatedAwardINR: 38000000,
        coordinates: [
          [13.007, 79.976],
          [13.011, 79.978],
          [13.013, 79.983],
          [13.009, 79.981],
        ],
      },
      {
        id: "PCL-TN-002",
        ulpin: "TN-CHE-2026-0502",
        khasra: "341",
        village: "Pennalur",
        taluk: "Sriperumbudur",
        district: "Kanchipuram",
        areaHa: 1.40,
        landCategory: "Agricultural",
        status: "AWARDED",
        ownerMasked: "S. Rajendran (Pattadar)",
        estimatedAwardINR: 21500000,
        coordinates: [
          [13.009, 79.981],
          [13.013, 79.983],
          [13.015, 79.988],
          [13.011, 79.986],
        ],
      },
    ],
    photos: [
      {
        id: "PHOTO-TN-01",
        title: "Sriperumbudur Interchange RoW Marker",
        ulpin: "TN-CHE-2026-0501",
        surveyNo: "340/2",
        coordinates: [13.010, 79.979],
        azimuthDeg: 120,
        capturedAt: "08 Sep 2026, 10:15 IST",
        surveyor: "K. Subramanian (CALA SLAO)",
        accuracyMeters: 1.4,
        notes: "Tamil Nilam land boundary matched with DGPS RTK survey.",
        photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "mysuru",
    name: "Mysuru",
    nameHi: "मैसूरु",
    state: "Karnataka",
    stateHi: "कर्नाटक",
    center: [12.2958, 76.6394],
    zoom: 14,
    corridorName: "Mysuru-Kushalnagar 4-Lane Greenfield Highway",
    corridorNameHi: "मैसूरु-कुशलनगर 4-लेन ग्रीनफील्ड हाईवे",
    code: "KRDCL/MYS-KUSH/01",
    centerline: [
      [12.282, 76.621],
      [12.289, 76.630],
      [12.296, 76.640],
      [12.304, 76.649],
      [12.312, 76.658],
    ],
    parcels: [
      {
        id: "PCL-KA-061",
        ulpin: "KA-MYS-2026-0601",
        khasra: "58/1",
        village: "Yelwal",
        taluk: "Mysuru Rural",
        district: "Mysuru",
        areaHa: 1.50,
        landCategory: "Agricultural",
        status: "AWARDED",
        ownerMasked: "Siddalingappa & Sons",
        estimatedAwardINR: 18500000,
        coordinates: [
          [12.293, 76.636],
          [12.297, 76.638],
          [12.298, 76.643],
          [12.294, 76.641],
        ],
      },
      {
        id: "PCL-KA-062",
        ulpin: "KA-MYS-2026-0602",
        khasra: "59/2",
        village: "Hunsur",
        taluk: "Hunsur",
        district: "Mysuru",
        areaHa: 2.20,
        landCategory: "Agricultural",
        status: "ACQUIRED",
        ownerMasked: "Mallikarjuna Gowda",
        estimatedAwardINR: 24000000,
        coordinates: [
          [12.294, 76.641],
          [12.298, 76.643],
          [12.300, 76.647],
          [12.296, 76.645],
        ],
      },
    ],
    photos: [
      {
        id: "PHOTO-MYS-01",
        title: "Yelwal Toll Plaza Peg Marker",
        ulpin: "KA-MYS-2026-0601",
        surveyNo: "58/1",
        coordinates: [12.295, 76.639],
        azimuthDeg: 80,
        capturedAt: "07 Sep 2026, 12:45 IST",
        surveyor: "Chandrappa (Taluk Surveyor)",
        accuracyMeters: 1.6,
        notes: "Bhoomi Karnataka revenue records verified on site.",
        photoUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "tumakuru",
    name: "Tumakuru",
    nameHi: "तुमकुरु",
    state: "Karnataka",
    stateHi: "कर्नाटक",
    center: [13.3409, 77.1010],
    zoom: 14,
    corridorName: "Tumakuru Industrial Smart City Node (CBIC Phase-III)",
    corridorNameHi: "तुमकुरु औद्योगिक स्मार्ट सिटी नोड (सीबीआईसी)",
    code: "KIADB/TUM-CBIC/PKG-03",
    centerline: [
      [13.328, 77.085],
      [13.334, 77.093],
      [13.341, 77.101],
      [13.348, 77.110],
      [13.355, 77.118],
    ],
    parcels: [
      {
        id: "PCL-KA-071",
        ulpin: "KA-TUM-2026-0701",
        khasra: "180/1",
        village: "Vasanthanarasapura",
        taluk: "Tumakuru",
        district: "Tumakuru",
        areaHa: 3.20,
        landCategory: "Commercial",
        status: "AWARDED",
        ownerMasked: "Karnataka Industrial Area Development",
        estimatedAwardINR: 44000000,
        coordinates: [
          [13.338, 77.097],
          [13.342, 77.099],
          [13.344, 77.104],
          [13.340, 77.102],
        ],
      },
      {
        id: "PCL-KA-072",
        ulpin: "KA-TUM-2026-0702",
        khasra: "181/2",
        village: "Kora",
        taluk: "Tumakuru Rural",
        district: "Tumakuru",
        areaHa: 1.80,
        landCategory: "Agricultural",
        status: "ACQUIRED",
        ownerMasked: "Govindappa & Co-parceners",
        estimatedAwardINR: 26000000,
        coordinates: [
          [13.340, 77.102],
          [13.344, 77.104],
          [13.346, 77.108],
          [13.342, 77.106],
        ],
      },
    ],
    photos: [
      {
        id: "PHOTO-TUM-01",
        title: "Vasanthanarasapura Industrial Node Boundary Stone",
        ulpin: "KA-TUM-2026-0701",
        surveyNo: "180/1",
        coordinates: [13.341, 77.100],
        azimuthDeg: 190,
        capturedAt: "06 Sep 2026, 11:10 IST",
        surveyor: "S. N. Murthy (KIADB Surveyor)",
        accuracyMeters: 1.2,
        notes: "Industrial corridor buffer zone marked with yellow boundary posts.",
        photoUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];

