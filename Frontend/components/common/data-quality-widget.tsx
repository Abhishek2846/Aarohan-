import React from "react";
import { DataQualityScore } from "@/types/case";
import { DataQualityScoreIndicator } from "@/components/advanced/data-quality-score-indicator";

interface DataQualityWidgetProps {
  score: DataQualityScore;
  className?: string;
}

export function DataQualityWidget({ score, className }: DataQualityWidgetProps) {
  return (
    <DataQualityScoreIndicator
      scoreData={score}
      className={className}
    />
  );
}
