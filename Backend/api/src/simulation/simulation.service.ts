import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SimulationService {
  constructor(private readonly prisma: PrismaService) {}

  async getScenarios() {
    try {
      const scenarios = await (this.prisma as any).simulation_scenarios.findMany({
        orderBy: { scenario_id: 'asc' },
      });

      return scenarios.map((s: any) => ({
        id: s.scenario_id,
        name: s.name,
        tagline: s.tagline,
        baseLengthKm: Number(s.base_length_km || 0),
        baseParcelsPerKm: Number(s.base_parcels_per_km || 0),
        baseFamiliesPerKm: Number(s.base_families_per_km || 0),
        baseForestHa: Number(s.base_forest_ha || 0),
        baseCostPerKmCr: Number(s.base_cost_per_km_cr || 0),
        baseMonths: s.base_months || 0,
        description: s.description,
      }));
    } catch (error) {
      console.error('Error fetching simulation scenarios:', error);
      return [];
    }
  }
}
