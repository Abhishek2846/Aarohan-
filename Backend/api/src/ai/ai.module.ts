import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { NlpAssistantService } from './nlp-assistant.service';
import { MlModelsService } from './ml-models.service';
import { DocumentIntelligenceService } from './document-intelligence.service';
import { SpatialAiService } from './spatial-ai.service';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { AgentActionService } from './agent-action.service';
import { FeatureExtractorService } from './feature-extractor.service';
import { DelayPredictionEngineService } from './delay-prediction-engine.service';
import { PortfolioRiskAggregatorService } from './portfolio-risk-aggregator.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { GrievancesModule } from '../grievances/grievances.module';

@Module({
  imports: [PrismaModule, GrievancesModule],
  controllers: [AiController],
  providers: [
    NlpAssistantService,
    MlModelsService,
    DocumentIntelligenceService,
    SpatialAiService,
    AnomalyDetectionService,
    AgentActionService,
    FeatureExtractorService,
    DelayPredictionEngineService,
    PortfolioRiskAggregatorService,
  ],
  exports: [
    NlpAssistantService,
    MlModelsService,
    DocumentIntelligenceService,
    SpatialAiService,
    AnomalyDetectionService,
    AgentActionService,
    FeatureExtractorService,
    DelayPredictionEngineService,
    PortfolioRiskAggregatorService,
  ],
})
export class AiModule {}
