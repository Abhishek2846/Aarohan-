import React, { Suspense } from "react";
import { GazettePublisher } from "@/components/gazette/gazette-publisher";

export const metadata = {
  title: "Official Bilingual E-Gazette Statutory Publisher | Aarohan (आरोहण)",
  description:
    "Automated statutory gazette publication for RFCTLARR Act 2013 (Section 11, 15, 19, 23/30) with authentic bilingual layout and SHA-256 QR-code authentication.",
};

export default function GazettePage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <Suspense
        fallback={
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              Loading Official e-Gazette Statutory Engine...
            </p>
          </div>
        }
      >
        <GazettePublisher />
      </Suspense>
    </div>
  );
}
