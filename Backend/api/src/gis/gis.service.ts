import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  PublicParcelMapDto,
  PiaParcelMapDto,
  FieldSurveyParcelDto,
  DistrictParcelDto,
  StateMonitoringParcelDto,
  AuditorParcelDto,
} from './dto/gis-parcel.dto';

export interface GisParcel {
  id: string;
  ulpin: string;
  khasra: string;
  village: string;
  taluk: string;
  district: string;
  areaHa: number;
  landCategory: 'Agricultural' | 'Commercial' | 'Residential' | 'Forest/Water';
  status:
    'ACQUIRED' | 'AWARDED' | 'SURVEY_PENDING' | 'OBJECTION_FILED' | 'DISPUTED';
  ownerMasked: string;
  estimatedAwardINR: number;
  coordinates: [number, number][];
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

@Injectable()
export class GisService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly corridors: CorridorAlignment[] = [
    {
      id: 'STRR_BLR_01',
      name: 'Bengaluru Satellite Town Ring Road (NH-948A Pkg 2)',
      code: 'KRDCL/STRR/BLR-RURAL/01',
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
    },
    {
      id: 'DEL_MUM_04',
      name: 'Delhi-Mumbai Expressway (Vadodara Spur Section)',
      code: 'NHAI/EXP/DEL-MUM/PKG-04',
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
    },
    {
      id: 'WDFC_RAJ_02',
      name: 'Western Dedicated Freight Corridor (Jaipur-Ajmer Link)',
      code: 'DFCCIL/WDFC/RAJ/PKG-02',
      defaultCenter: [26.9124, 75.7873],
      defaultZoom: 13,
      centerline: [
        [26.895, 75.765],
        [26.902, 75.774],
        [26.912, 75.787],
        [26.921, 75.798],
        [26.932, 75.812],
      ],
    },
  ];

  private readonly sampleParcels: GisParcel[] = [
    {
      id: 'PCL-KA-001',
      ulpin: 'KA-BLR-2026-0041',
      khasra: '142/2A',
      village: 'Doddaballapur',
      taluk: 'Doddaballapur',
      district: 'Bengaluru Rural',
      areaHa: 1.45,
      landCategory: 'Agricultural',
      status: 'AWARDED',
      ownerMasked: 'Rameshwar Sharma (Khatedar)',
      estimatedAwardINR: 12522400,
      coordinates: [
        [13.292, 77.531],
        [13.295, 77.532],
        [13.296, 77.536],
        [13.293, 77.535],
      ],
    },
    {
      id: 'PCL-KA-002',
      ulpin: 'KA-BLR-2026-0042',
      khasra: '142/2B',
      village: 'Doddaballapur',
      taluk: 'Doddaballapur',
      district: 'Bengaluru Rural',
      areaHa: 0.85,
      landCategory: 'Agricultural',
      status: 'ACQUIRED',
      ownerMasked: 'Shivanna & Sons (Hissa)',
      estimatedAwardINR: 7338000,
      coordinates: [
        [13.293, 77.535],
        [13.296, 77.536],
        [13.298, 77.54],
        [13.294, 77.539],
      ],
    },
    {
      id: 'PCL-KA-003',
      ulpin: 'KA-BLR-2026-0043',
      khasra: '143/1',
      village: 'Doddaballapur',
      taluk: 'Doddaballapur',
      district: 'Bengaluru Rural',
      areaHa: 2.1,
      landCategory: 'Commercial',
      status: 'SURVEY_PENDING',
      ownerMasked: 'Golden Brick Developers',
      estimatedAwardINR: 28450000,
      coordinates: [
        [13.295, 77.532],
        [13.298, 77.534],
        [13.3, 77.538],
        [13.296, 77.536],
      ],
    },
    {
      id: 'PCL-KA-004',
      ulpin: 'KA-BLR-2026-0044',
      khasra: '144/1A',
      village: 'Doddaballapur',
      taluk: 'Doddaballapur',
      district: 'Bengaluru Rural',
      areaHa: 1.15,
      landCategory: 'Agricultural',
      status: 'OBJECTION_FILED',
      ownerMasked: 'Muniyappa Gowda (Joint Owner)',
      estimatedAwardINR: 9924500,
      coordinates: [
        [13.297, 77.541],
        [13.301, 77.543],
        [13.303, 77.547],
        [13.299, 77.545],
      ],
    },
    {
      id: 'PCL-KA-005',
      ulpin: 'KA-BLR-2026-0045',
      khasra: '145/3',
      village: 'Doddaballapur',
      taluk: 'Doddaballapur',
      district: 'Bengaluru Rural',
      areaHa: 3.4,
      landCategory: 'Agricultural',
      status: 'DISPUTED',
      ownerMasked: 'Lakshmamma & Co-sharers',
      estimatedAwardINR: 29342000,
      coordinates: [
        [13.3, 77.545],
        [13.304, 77.547],
        [13.306, 77.552],
        [13.302, 77.55],
      ],
    },
  ];

  private readonly sampleGeoPhotos: GeotaggedPhoto[] = [
    {
      id: 'PHOTO-001',
      title: 'North-East Peg Marker & Borewell Demarcation',
      ulpin: 'KA-BLR-2026-0041',
      surveyNo: '142/2A',
      coordinates: [13.2945, 77.5338],
      azimuthDeg: 45,
      capturedAt: '08 Sep 2026, 14:15 IST',
      surveyor: 'Suresh Patil (Field Surveyor)',
      photoUrl:
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
      accuracyMeters: 0.8,
      notes:
        'Sub-centimeter DGPS boundary peg set. 2 borewells and 12 coconut trees tagged.',
    },
    {
      id: 'PHOTO-002',
      title: 'Severed Access Canal & Culvert Crossing',
      ulpin: 'KA-BLR-2026-0042',
      surveyNo: '142/2B',
      coordinates: [13.2962, 77.5375],
      azimuthDeg: 120,
      capturedAt: '08 Sep 2026, 15:40 IST',
      surveyor: 'Suresh Patil (Field Surveyor)',
      photoUrl:
        'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=800&q=80',
      accuracyMeters: 1.1,
      notes:
        'Irrigation channel intersects ROW; underpass culvert recommended by NHAI engineers.',
    },
  ];

  async getGisData(corridorId?: string, userId?: string) {
    const matchedCorridor =
      this.corridors.find(
        (c) =>
          c.id.toLowerCase() === (corridorId || '').toLowerCase() ||
          c.id.startsWith(corridorId || 'STRR_BLR') ||
          (corridorId &&
            c.name.toLowerCase().includes(corridorId.toLowerCase())),
      ) || this.corridors[0];

    let userRole = 'CITIZEN';
    let userRecord = null;
    if (userId) {
      userRecord = await this.prisma.users.findUnique({
        where: { user_id: userId },
        include: { user_roles: true },
      });
      if (userRecord && userRecord.user_roles.length > 0) {
        userRole = userRecord.user_roles[0].role_code;
      }
    }

    let mappedParcels: any[] = [];
    try {
      const dbParcels = await this.prisma.parcels.findMany({
        take: 50,
      });

      if (dbParcels.length > 0) {
        const pList = dbParcels.map((p: any, idx: number) => {
          const areaHa = p.total_area_ha
            ? Number(p.total_area_ha)
            : 1.2 + idx * 0.3;
          const estimatedAwardINR = p.estimated_market_value_inr
            ? Number(p.estimated_market_value_inr)
            : Math.round(areaHa * 10000 * 4500 * 2.2);

          const baseLat =
            matchedCorridor.defaultCenter[0] + ((idx % 5) - 2) * 0.003;
          const baseLng =
            matchedCorridor.defaultCenter[1] +
            (Math.floor(idx / 5) - 2) * 0.003;

          return {
            id: p.parcel_id,
            ulpin: p.ulpin,
            khasra: p.khasra_number || p.survey_number || `Survey-${140 + idx}`,
            village: p.village_name || 'Doddaballapur Revenue Circle',
            taluk: 'Doddaballapur',
            district: 'Bengaluru Rural',
            areaHa: Number(areaHa.toFixed(2)),
            landCategory: (p.land_use_category === 'COMMERCIAL'
              ? 'Commercial'
              : p.land_use_category === 'RESIDENTIAL'
                ? 'Residential'
                : 'Agricultural') as any,
            status: (p.parcel_status === 'ACQUIRED'
              ? 'ACQUIRED'
              : p.parcel_status === 'AWARDED'
                ? 'AWARDED'
                : 'SURVEY_PENDING') as any,
            ownerMasked:
              p.owner_name_masked || `Landowner of Survey ${p.survey_number}`,
            estimatedAwardINR,
            coordinates: [
              [baseLat, baseLng],
              [baseLat + 0.002, baseLng + 0.001],
              [baseLat + 0.003, baseLng + 0.004],
              [baseLat + 0.001, baseLng + 0.003],
            ],
          };
        });
        mappedParcels = pList
          .map((p) => this.mapParcelToRoleDto(p, userRole))
          .filter((p) => p !== null);
      } else {
        mappedParcels = this.sampleParcels
          .map((p) => this.mapParcelToRoleDto(p, userRole))
          .filter((p) => p !== null);
      }
    } catch {
      mappedParcels = this.sampleParcels
        .map((p) => this.mapParcelToRoleDto(p, userRole))
        .filter((p) => p !== null);
    }

    let geoPhotos = this.sampleGeoPhotos;
    if (userRole === 'CITIZEN') {
      geoPhotos = [];
    }

    return {
      corridor: matchedCorridor,
      allCorridors: this.corridors,
      parcels: mappedParcels,
      geoPhotos,
    };
  }

  private mapParcelToRoleDto(p: any, role: string) {
    if (role === 'FIELD_OFFICER') {
      return {
        id: p.id,
        ulpin: p.ulpin,
        surveyNo: p.khasra || p.surveyNo,
        coordinates: p.coordinates,
        status: p.status,
        dueDate: '2026-10-15',
        priority: 'HIGH',
      } as FieldSurveyParcelDto;
    }

    if (role === 'DISTRICT_OFFICER') {
      return {
        id: p.id,
        ulpin: p.ulpin,
        village: p.village,
        district: p.district,
        status: p.status,
        surveyCompletion: p.status === 'SURVEY_PENDING' ? 0 : 100,
        coordinates: p.coordinates,
        disputed: p.status === 'DISPUTED',
      } as DistrictParcelDto;
    }

    if (role === 'PIA' || role === 'PIA_USER') {
      return {
        id: p.id,
        ulpin: p.ulpin,
        khasra: p.khasra,
        surveyNo: p.khasra,
        village: p.village,
        district: p.district,
        areaHa: p.areaHa,
        landCategory: p.landCategory,
        status: p.status,
        estimatedAwardINR: p.estimatedAwardINR,
        coordinates: p.coordinates,
      } as PiaParcelMapDto;
    }

    if (role === 'STATE_AUTHORITY') {
      return {
        id: p.id,
        district: p.district,
        status: p.status,
        areaHa: p.areaHa,
        coordinates: p.coordinates,
      } as StateMonitoringParcelDto;
    }

    if (role === 'CENTRAL_MINISTRY') {
      return {
        ...p,
        ownerMasked: undefined,
        estimatedAwardINR: undefined,
      };
    }

    if (role === 'AUDITOR') {
      return {
        id: p.id,
        ulpin: p.ulpin,
        surveyNo: p.khasra,
        status: p.status,
        coordinates: p.coordinates,
        evidencePoints: p.coordinates.map((c: any) => [
          c[0] + 0.0001,
          c[1] + 0.0001,
        ]),
        documentCompletenessScore: 85,
      } as AuditorParcelDto;
    }

    return {
      id: p.id,
      village: p.village,
      district: p.district,
      state: 'Karnataka',
      status: p.status,
      areaHa: p.areaHa,
      coordinates: p.coordinates,
    } as PublicParcelMapDto;
  }

  async calculateSpatialBuffer(
    waypoints: [number, number][],
    bufferWidthMeters: number = 60,
  ) {
    if (!waypoints || waypoints.length < 2) {
      throw new BadRequestException('At least 2 alignment waypoints required.');
    }

    const alignmentLengthKm = this.calculatePolylineDistanceKm(waypoints);
    const bufferPolygon = this.generateBufferPolygon(
      waypoints,
      bufferWidthMeters,
    );

    const intersectedCount = Math.min(
      Math.max(3, Math.round(waypoints.length * 2.2)),
      this.sampleParcels.length,
    );
    const intersectedParcels = this.sampleParcels.slice(0, intersectedCount);
    const totalRequiredAreaHa = intersectedParcels.reduce(
      (acc, p) => acc + p.areaHa,
      0,
    );
    const estimatedStatutoryCompensationINR = intersectedParcels.reduce(
      (acc, p) => acc + p.estimatedAwardINR,
      0,
    );

    return {
      alignmentLengthKm: Number(alignmentLengthKm.toFixed(2)),
      bufferWidthMeters,
      bufferPolygon,
      intersectedParcelsCount: intersectedParcels.length,
      totalRequiredAreaHa: Number(totalRequiredAreaHa.toFixed(2)),
      estimatedStatutoryCompensationINR,
      intersectedParcels,
    };
  }

  calculatePolylineDistanceKm(coords: [number, number][]): number {
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
    return totalKm;
  }

  generateBufferPolygon(
    centerline: [number, number][],
    bufferWidthMeters: number,
  ): [number, number][] {
    if (!centerline || centerline.length < 2) return [];

    const offsetDeg = bufferWidthMeters / 111320;
    const leftSide: [number, number][] = [];
    const rightSide: [number, number][] = [];

    for (let i = 0; i < centerline.length; i++) {
      const curr = centerline[i];
      const lat = curr[0];
      const lng = curr[1];

      let dx = 0;
      let dy = 0;

      if (i === 0) {
        dx = centerline[1][1] - lng;
        dy = centerline[1][0] - lat;
      } else if (i === centerline.length - 1) {
        dx = lng - centerline[i - 1][1];
        dy = lat - centerline[i - 1][0];
      } else {
        dx = centerline[i + 1][1] - centerline[i - 1][1];
        dy = centerline[i + 1][0] - centerline[i - 1][0];
      }

      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      leftSide.push([lat + ny * offsetDeg, lng + nx * offsetDeg]);
      rightSide.unshift([lat - ny * offsetDeg, lng - nx * offsetDeg]);
    }

    return [...leftSide, ...rightSide];
  }
}
