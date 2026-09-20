"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getRoleLandingRoute } from "@/lib/auth";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { activeRole, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login?redirect=/dashboard");
    } else {
      router.replace(getRoleLandingRoute(activeRole));
    }
  }, [activeRole, isAuthenticated, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex items-center gap-2.5 text-sm text-[#68655e]">
        <div className="w-4 h-4 border-2 border-[#ef5b2a] border-t-transparent rounded-full animate-spin" />
        <span>Loading your dedicated statutory dashboard...</span>
      </div>
    </div>
  );
}
