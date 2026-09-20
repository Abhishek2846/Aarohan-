import React, { Suspense } from "react";
import { GatiShaktiScreener } from "@/components/gati-shakti/gati-shakti-screener";

export const metadata = {
  title: "PM Gati Shakti NMP Geo-Clearance Screener | BhoomiSetu (भूमिसेतु)",
  description:
    "National Master Plan Multi-Agency Single Window Regulatory Clearance Engine for Forest, Railway, Defence, and Utility Permissions.",
};

export default function GatiShaktiPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <Suspense
        fallback={
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              Initializing PM Gati Shakti National Master Plan Screener...
            </p>
          </div>
        }
      >
        <GatiShaktiScreener />
      </Suspense>
    </div>
  );
}
