import { IsString, IsOptional, IsEnum, IsArray, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatutorySection {
  SECTION_11 = 'SECTION_11',
  SECTION_15 = 'SECTION_15',
  SECTION_19 = 'SECTION_19',
  SECTION_23_30 = 'SECTION_23_30',
}

export enum PublicationStatus {
  DRAFT = 'DRAFT',
  CALA_APPROVED = 'CALA_APPROVED',
  PUBLISHED = 'PUBLISHED',
  RESCINDED = 'RESCINDED',
}

export class CadastralParcelScheduleDto {
  @ApiProperty()
  @IsString()
  ulpin!: string;

  @ApiProperty()
  @IsString()
  survey_no!: string;

  @ApiProperty()
  @IsString()
  village!: string;

  @ApiProperty()
  @IsString()
  taluk!: string;

  @ApiProperty()
  @IsString()
  district!: string;

  @ApiProperty()
  extent_ha!: number;

  @ApiProperty()
  @IsString()
  land_use!: string;

  @ApiProperty()
  @IsString()
  owner_name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  award_inr?: number;
}

export class BilingualContentDto {
  @ApiProperty()
  @IsString()
  hindi_title!: string;

  @ApiProperty()
  @IsString()
  english_title!: string;

  @ApiProperty()
  @IsString()
  ministry_hindi!: string;

  @ApiProperty()
  @IsString()
  ministry_english!: string;

  @ApiProperty()
  @IsString()
  competent_authority_hindi!: string;

  @ApiProperty()
  @IsString()
  competent_authority_english!: string;

  @ApiProperty()
  @IsString()
  hindi_body!: string;

  @ApiProperty()
  @IsString()
  english_body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  solatium_pct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  additional_interest_pct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  multiplier_factor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  total_award_inr?: number;

  @ApiPropertyOptional()
  @IsOptional()
  hearing_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  hearing_venue_hindi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  hearing_venue_english?: string;

  @ApiPropertyOptional()
  @IsOptional()
  objection_days?: number;

  @ApiPropertyOptional()
  @IsOptional()
  gazette_category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  tax_exemption_clause?: string;
}

export class CreateGazetteDraftDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caseId?: string;

  @ApiProperty({ enum: StatutorySection })
  @IsEnum(StatutorySection)
  sectionReference!: StatutorySection;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  noticeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publicSummary?: string;

  @ApiProperty()
  @IsObject()
  bilingualContent!: BilingualContentDto;

  @ApiProperty({ type: [CadastralParcelScheduleDto] })
  @IsArray()
  cadastralSchedule!: CadastralParcelScheduleDto[];
}

export class SignGazetteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  officerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  officerDesignation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class PublishGazetteDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  gazetteVolumeIssue!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gazetteReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effectiveOn?: string;
}

export class GazetteFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sectionReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publicationStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
