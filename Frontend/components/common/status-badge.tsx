import React from "react";
import { Badge } from "@/components/ui/badge";
import { ParcelStatus } from "@/types/parcel";

interface StatusBadgeProps {
  status: ParcelStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case "IDENTIFIED":
      return (
        <Badge variant="outline" className={`border-[#d8d3c9] bg-[#fffdf8] text-[#171716] ${className}`}>
          Identified (ULPIN)
        </Badge>
      );
    case "SURVEY_PENDING":
      return (
        <Badge variant="warning" className={className}>
          Survey Pending
        </Badge>
      );
    case "SURVEY_COMPLETED":
      return (
        <Badge variant="civic" className={className}>
          Survey Verified
        </Badge>
      );
    case "OBJECTION_LOGGED":
      return (
        <Badge variant="warning" className={className}>
          Objection Under Review
        </Badge>
      );
    case "AWARDED":
      return (
        <Badge variant="civic" className={className}>
          Award Enacted
        </Badge>
      );
    case "COMPENSATION_DISBURSED":
      return (
        <Badge variant="success" className={className}>
          Compensation Disbursed
        </Badge>
      );
    case "POSSESSION_ACQUIRED":
      return (
        <Badge variant="success" className={className}>
          Possession Acquired
        </Badge>
      );
    case "LITIGATION_DISPUTED":
      return (
        <Badge variant="danger" className={className}>
          Litigation Disputed
        </Badge>
      );
    case "DELAYED":
      return (
        <Badge variant="danger" className={className}>
          SLA Delayed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={`border-[#d8d3c9] bg-[#fffdf8] text-[#171716] ${className}`}>
          {status.replace(/_/g, " ")}
        </Badge>
      );
  }
}
