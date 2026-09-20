"use client";

import React, { useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";
import { AuthProvider } from "@/hooks/use-auth";
import { I18nProvider } from "@/hooks/use-i18n";
import { CivicHeader } from "@/components/layout/civic-header";
import { RoleSidebar } from "@/components/layout/role-sidebar";
import { CivicFooter } from "@/components/layout/civic-footer";
import { BhoomiAiChatbot } from "@/components/ai/bhoomi-ai-chatbot";
import { Toaster } from "@/components/ui/toast";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLandingPage = pathname === "/";

  if (isLandingPage) {
    // Standalone / individual landing page experience: no global header, sidebar, or footer
    return (
      <main className="w-full min-h-screen no-translate">
        {children}
        <BhoomiAiChatbot />
        <Toaster />
      </main>
    );
  }

  const queryKey = searchParams ? searchParams.toString() : "";
  const mainKey = `${pathname}${queryKey ? `?${queryKey}` : ""}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f1ea] text-[#171716]">
      <CivicHeader />
      <div className="flex-1 flex flex-row">
        <RoleSidebar />
        <main
          key={mainKey}
          className="flex-1 overflow-x-hidden p-6 lg:p-8 page-fade-in bg-[#f4f1ea] text-[#171716]"
        >
          {children}
        </main>
      </div>
      <CivicFooter />
      <BhoomiAiChatbot />
      <Toaster />
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <Suspense fallback={<div className="min-h-screen bg-[#f4f1ea]" />}>
            <AppLayoutContent>{children}</AppLayoutContent>
          </Suspense>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

