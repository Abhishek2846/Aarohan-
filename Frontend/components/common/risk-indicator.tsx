import React from "react";
import { DelayRiskEvaluation } from "@/types/case";
import { ExplainableDelayRisk } from "@/components/advanced/explainable-delay-risk";

interface RiskIndicatorProps {
  delayRisk: DelayRiskEvaluation;
  onActionClick?: (action: string) => void;
  className?: string;
}

export function RiskIndicator({ delayRisk, onActionClick, className }: RiskIndicatorProps) {
  return (
    <ExplainableDelayRisk
      delayRisk={delayRisk}
      onActionClick={onActionClick}
      className={className}
    />
  );
}
