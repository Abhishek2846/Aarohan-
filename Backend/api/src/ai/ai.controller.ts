import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsOptional, IsBoolean, IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { NlpAssistantService } from './nlp-assistant.service';
import { MlModelsService } from './ml-models.service';
import { DocumentIntelligenceService } from './document-intelligence.service';
import { SpatialAiService } from './spatial-ai.service';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { AgentActionService } from './agent-action.service';
import { DelayPredictionEngineService } from './delay-prediction-engine.service';
import { PortfolioRiskAggregatorService } from './portfolio-risk-aggregator.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

export class ChatMessageRequestDto {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsOptional()
  @IsString()
  caseId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class AgentActionExecuteDto {
  @IsString()
  @IsNotEmpty()
  actionType!: string;

  @IsNotEmpty()
  payload!: any;

  @IsOptional()
  user?: any;
}

export class WhatIfSimulationDto {
  @IsOptional()
  @IsBoolean()
  resolveLitigations?: boolean;

  @IsOptional()
  @IsNumber()
  accelerateDbtDisbursementPct?: number;

  @IsOptional()
  @IsBoolean()
  deployAdditionalSlao?: boolean;

  @IsOptional()
  @IsBoolean()
  resolveSection15Objections?: boolean;

  @IsOptional()
  @IsBoolean()
  completeCadastralSurveys?: boolean;
}

@ApiTags('AI & ML Intelligence')
@Controller('ai')
export class AiController {
  constructor(
    private readonly nlpAssistantService: NlpAssistantService,
    private readonly mlModelsService: MlModelsService,
    private readonly documentIntelligenceService: DocumentIntelligenceService,
    private readonly spatialAiService: SpatialAiService,
    private readonly anomalyDetectionService: AnomalyDetectionService,
    private readonly agentActionService: AgentActionService,
    private readonly delayPredictionEngine: DelayPredictionEngineService,
    private readonly portfolioRiskAggregator: PortfolioRiskAggregatorService,
  ) {}

  /**
   * Role-Aware AI Assistant & Chatbot Endpoint
   */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('chat')
  @ApiOperation({ summary: 'Bhoomi AI Copilot conversational endpoint (Public & Officer)' })
  async chat(@Body() body: ChatMessageRequestDto) {
    return {
      status: 'success',
      data: await this.nlpAssistantService.processQuery(body),
    };
  }

  /**
   * AI Agentic Intent Detection & Structured Form Action Preview
   */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('agent/detect')
  @ApiOperation({ summary: 'Detect action intent from natural language' })
  async detectActionIntent(@Body() body: ChatMessageRequestDto) {
    return {
      status: 'success',
      data: await this.agentActionService.detectAndPrepareAction(body.query, body.role, body.userEmail),
    };
  }

  /**
   * Execute User-Confirmed Agent Action with RBAC & Audit Logging
   */
  @ApiBearerAuth()
  @Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'FIELD_OFFICER', 'SYSTEM_ADMIN')
  @Post('agent/execute')
  @ApiOperation({ summary: 'Execute agent action with verified role permissions' })
  async executeAgentAction(@Body() body: AgentActionExecuteDto) {
    return {
      status: 'success',
      data: await this.agentActionService.executeConfirmedAction(body.actionType, body.payload, body.user),
    };
  }

  /**
   * Predict Case Acquisition Delay & SLA Breach Likelihood
   */
  @ApiBearerAuth()
  @Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'AUDITOR', 'SYSTEM_ADMIN')
  @Get('cases/:id/predict')
  async predictCaseDelay(@Param('id') caseId: string) {
    return {
      status: 'success',
      data: await this.mlModelsService.predictCaseDelay(caseId),
    };
  }

  /**
   * Explainable Case Risk Score & SHAP Factor Breakdown
   */
  @ApiBearerAuth()
  @Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'AUDITOR', 'SYSTEM_ADMIN')
  @Get('cases/:id/risk')
  async getCaseRisk(@Param('id') caseId: string) {
    const prediction = await this.mlModelsService.predictCaseDelay(caseId);
    return {
      status: 'success',
      data: {
        caseId: prediction.caseId,
        caseNumber: prediction.caseNumber,
        riskScore: prediction.riskScore,
        riskLevel: prediction.riskLevel,
        delayProbabilityPct: prediction.delayProbabilityPct,
        shapFactors: prediction.shapFactors,
        recommendedActions: prediction.recommendedActions,
      },
    };
  }

  /**
   * National / State Portfolio Delay Risk Aggregation & Prioritization
   */
  @ApiBearerAuth()
  @Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'AUDITOR', 'SYSTEM_ADMIN')
  @Get('projects/portfolio-risk')
  async getPortfolioRisk() {
    return {
      status: 'success',
      data: await this.portfolioRiskAggregator.getPortfolioRiskOverview(),
    };
  }

  /**
   * Predict 90-Day Delay Threshold Probability & TreeSHAP Factor Attributions
   */
  @ApiBearerAuth()
  @Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'AUDITOR', 'SYSTEM_ADMIN')
  @Get('projects/:id/delay-risk')
  async getProjectDelayRisk(
    @Param('id') projectId: string,
    @Query('checkpoint') checkpoint?: string,
  ) {
    return {
      status: 'success',
      data: await this.delayPredictionEngine.evaluateProjectDelayRisk(projectId, checkpoint || 'SEC_15', true),
    };
  }

  /**
   * Project Risk Trajectory across Statutory Lifecycle Checkpoints (DPR -> SEC 38)
   */
  @ApiBearerAuth()
  @Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'AUDITOR', 'SYSTEM_ADMIN')
  @Get('projects/:id/risk-trajectory')
  async getProjectRiskTrajectory(@Param('id') projectId: string) {
    return {
      status: 'success',
      data: await this.delayPredictionEngine.getProjectRiskTrajectory(projectId),
    };
  }

  /**
   * What-If Scenario Simulation Engine for Project Delay Mitigation
   */
  @ApiBearerAuth()
  @Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'SYSTEM_ADMIN')
  @Post('projects/:id/what-if')
  async simulateWhatIf(
    @Param('id') projectId: string,
    @Body() body: WhatIfSimulationDto,
  ) {
    return {
      status: 'success',
      data: await this.delayPredictionEngine.simulateWhatIfScenario(projectId, body),
    };
  }

  /**
   * Project Completion Forecast & Bottleneck Analytics
   */
  @ApiBearerAuth()
  @Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'AUDITOR', 'SYSTEM_ADMIN')
  @Get('projects/:id/forecast')
  async getProjectForecast(@Param('id') projectId: string) {
    return {
      status: 'success',
      data: await this.mlModelsService.forecastProjectCompletion(projectId),
    };
  }

  /**
   * GIS Spatial Risk Heatmap & Cluster Points
   */
  @ApiBearerAuth()
  @Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'AUDITOR', 'SYSTEM_ADMIN')
  @Get('projects/:id/spatial-risk')
  async getSpatialRiskMap(@Param('id') projectId: string) {
    return {
      status: 'success',
      data: await this.spatialAiService.getProjectSpatialRiskMap(projectId),
    };
  }

  /**
   * Document Completeness & Missing Document Intelligence Audit
   */
  @ApiBearerAuth()
  @Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'AUDITOR', 'SYSTEM_ADMIN')
  @Get('cases/:id/documents-audit')
  async auditCaseDocuments(@Param('id') caseId: string) {
    return {
      status: 'success',
      data: await this.documentIntelligenceService.auditCaseDocuments(caseId),
    };
  }

  /**
   * ML Outlier & Anomaly Detection
   */
  @ApiBearerAuth()
  @Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'AUDITOR', 'SYSTEM_ADMIN')
  @Get('anomalies')
  async getAnomalies(@Query('projectId') projectId?: string) {
    return {
      status: 'success',
      data: await this.anomalyDetectionService.detectProjectAnomalies(projectId),
    };
  }

  /**
   * Officer Priority Roster Ranked by AI Urgency
   */
  @ApiBearerAuth()
  @Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'AUDITOR', 'SYSTEM_ADMIN')
  @Get('priorities')
  async getPriorities() {
    const sampleCases = ['case_01', 'case_02', 'case_03'];
    const predictions = await Promise.all(
      sampleCases.map((id) => this.mlModelsService.predictCaseDelay(id)),
    );

    const sorted = predictions.sort((a, b) => b.riskScore - a.riskScore);

    return {
      status: 'success',
      count: sorted.length,
      data: sorted.map((p, rank) => ({
        priorityRank: rank + 1,
        caseId: p.caseId,
        caseNumber: p.caseNumber,
        riskLevel: p.riskLevel,
        riskScore: p.riskScore,
        delayProbabilityPct: p.delayProbabilityPct,
        estimatedDelayDays: p.estimatedDelayDays,
        topReason: p.shapFactors[0]?.description || 'Statutory SLA timeline approaching',
        recommendedAction: p.recommendedActions[0] || 'Schedule Priority Hearing',
      })),
    };
  }
}
