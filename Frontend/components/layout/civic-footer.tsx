"use client";

import React from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { BhoomiEmblem } from "@/components/ui/bhoomi-emblem";

export function CivicFooter() {
  const { lang } = useI18n();
  const isHi = lang === "hi";

  return (
    <footer className="civic-footer w-full border-t border-[#d8d3c9] bg-[#fffdf8] text-[#68655e] text-xs mt-auto font-sans transition-colors">
      {/* Indian National Tricolor Accent Bar */}
      <div className="civic-footer-accent h-1 w-full bg-gradient-to-r from-[#ef5b2a] via-[#171716] to-[#15803d] opacity-90 shadow-sm" />

      {/* Clean, Elegant Single-Band Government Footer */}
      <div className="container mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Emblem & Ministry Identity */}
        <div className="flex items-center gap-3">
          <BhoomiEmblem className="w-8 h-8 shrink-0" />
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#171716] text-sm">
                {isHi ? "आरोहण (Aarohan)" : "Aarohan"}
              </span>
              <span className="text-[10px] bg-[#ef5b2a]/10 text-[#ef5b2a] font-bold px-2 py-0.5 rounded-full border border-[#ef5b2a]/30">
                {isHi ? "भारत सरकार" : "Govt. of India"}
              </span>
            </div>
            <p className="text-[11px] text-[#68655e] line-clamp-1">
              {isHi
                ? "भूमि संसाधन विभाग (DoLR) • ग्रामीण विकास मंत्रालय • RFCTLARR 2013 एवं यूलपिन (ULPIN)"
                : "Department of Land Resources (DoLR) • Ministry of Rural Development • RFCTLARR 2013 & ULPIN"}
            </p>
          </div>
        </div>

        {/* Center: Helpline & Support */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#68655e]">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-[#ef5b2a] shrink-0" />
            <span>
              {isHi ? "नागरिक हेल्पलाइन: " : "Toll-Free: "}
              <strong className="text-[#171716] font-mono">1800-11-2026</strong>
            </span>
          </div>
          <span className="hidden sm:inline text-[#d8d3c9]">•</span>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-[#ef5b2a] shrink-0" />
            <a
              href="mailto:helpdesk-aarohan@gov.in"
              className="hover:text-[#ef5b2a] transition-colors font-semibold text-[#171716]"
            >
              helpdesk-aarohan@gov.in
            </a>
          </div>
          <span className="hidden sm:inline text-[#d8d3c9]">•</span>
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#15803d] shrink-0" />
            <span className="text-[#171716] font-medium">ISO 19152 & GIGW 3.0</span>
          </div>
        </div>

        {/* Right: Copyright & NIC */}
        <div className="text-center md:text-right text-[11px] text-[#68655e]">
          <p>
            {isHi
              ? "राष्ट्रीय सूचना विज्ञान केंद्र (NIC) द्वारा अभिकल्पित एवं होस्ट किया गया"
              : "Designed & Hosted by National Informatics Centre (NIC)"}
          </p>
          <p className="text-[10px] text-[#68655e]/80">
            © 2026 Aarohan National Platform. SIH-2026.
          </p>
        </div>
      </div>
    </footer>
  );
}
