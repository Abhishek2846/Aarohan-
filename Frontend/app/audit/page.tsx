"use client";

import React from "react";
import { AuditTrailViewer } from "@/components/advanced/audit-trail-viewer";
import { useI18n } from "@/hooks/use-i18n";

export default function AuditorPage() {
  const { lang } = useI18n();
  const isHi = lang === "hi";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#171716]">
          {isHi ? "गतिविधि एवं सुरक्षा रिकॉर्ड कंसोल" : "Activity & Security History Console"}
        </h1>
        <p className="text-xs text-[#68655e]">
          {isHi
            ? "छेड़छाड़-रहित गतिविधि रिकॉर्ड, डिजिटल सुरक्षा मुहर और आधिकारिक ऑडिट सत्यापन।"
            : "Tamper-proof activity logs, digital security verification stamps, and official audit checks."}
        </p>
      </div>

      <AuditTrailViewer />
    </div>
  );
}

