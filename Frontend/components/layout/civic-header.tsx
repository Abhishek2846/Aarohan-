"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { getRoleNavItems } from "@/components/layout/role-sidebar";
import { BhoomiEmblem } from "@/components/ui/bhoomi-emblem";
import { NotificationDrawer } from "@/components/layout/notification-drawer";
import { Button } from "@/components/ui/button";
import {
  Languages,
  LogOut,
  MapPin,
  Menu,
  X,
  Home,
  User,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function CivicHeader() {
  const router = useRouter();
  const { user, activeRole, logout, isAuthenticated } = useAuth();
  const { lang, setLanguage, t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = isAuthenticated ? getRoleNavItems(activeRole, t, lang) : [];

  return (
    <header className="civic-header sticky top-0 z-40 w-full border-b border-[#d8d3c9] bg-[#f4f1ea]/95 backdrop-blur-xl shadow-sm transition-all">
      {/* Indian National Tricolor Accent Bar */}
      <div className="civic-header-accent h-1 w-full bg-gradient-to-r from-[#ef5b2a] via-[#ffffff] to-[#138808] opacity-90 shadow-sm" />

      {/* Top Meta Bar */}
      <div className="civic-header-meta bg-[#fffdf8] text-[#68655e] text-xs px-3 sm:px-6 py-1.5 flex items-center justify-between border-b border-[#d8d3c9]">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-medium tracking-wide text-[#171716] flex items-center gap-1.5 text-[11px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-[#ef5b2a] animate-pulse" />
            <span className={lang === "hi" ? "font-hindi font-bold text-[#171716]" : "text-[#171716] font-bold"}>{t.portalHeader}</span>
          </span>
          <span className="hidden md:inline text-[#d8d3c9]">|</span>
          <span className="hidden md:inline text-[#68655e] text-[11px]">
            {lang === "hi" ? "जमीन का डिजिटल रिकॉर्ड • 14-अंकीय भू-आधार (जमीन का आधार) • सैटेलाइट नक्शा" : "Digital Land Records • 14-Digit Land ID (Bhu-Aadhaar) • Satellite Map"}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
          <span className="hidden sm:inline bg-[#ef5b2a]/10 text-[#ef5b2a] px-2.5 py-0.5 rounded-full border border-[#ef5b2a]/30 font-bold text-[10px] tracking-wide">
            {t.sihBadge}
          </span>

          {/* Bilingual English & Hindi Switcher */}
          <div className="flex items-center gap-1 bg-[#eae6dc] rounded-full p-0.5 border border-[#d8d3c9]">
            <div className="pl-1.5 text-[#68655e]">
              <Languages className="h-3 w-3" />
            </div>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              aria-label="Switch to English"
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                lang === "en"
                  ? "bg-[#171716] text-[#fffdf8] shadow-sm"
                  : "text-[#68655e] hover:text-[#171716]"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              aria-label="हिन्दी में बदलें"
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-hindi transition-all ${
                lang === "hi"
                  ? "bg-[#171716] text-[#fffdf8] shadow-sm"
                  : "text-[#68655e] hover:text-[#171716]"
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="civic-header-main container mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Toggle + Official BhoomiSetu Emblem & Name */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Drawer Button */}
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 h-9 w-9 text-[#171716] hover:bg-[#eae6dc] rounded-xl"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0" title="BhoomiSetu Home">
            <BhoomiEmblem className="w-9 h-9 sm:w-10 sm:h-10 group-hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-[#171716] group-hover:text-[#ef5b2a] transition-colors">
                  {t.appName}
                </span>
                <span className="text-[10px] sm:text-xs bg-[#ef5b2a]/10 text-[#ef5b2a] font-bold px-2 py-0.5 rounded-full border border-[#ef5b2a]/30 font-hindi">
                  {lang === "hi" ? "BhoomiSetu" : "भूमिसेतु"}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#68655e] -mt-0.5 line-clamp-1 max-w-[200px] sm:max-w-none">
                {t.appTagline}
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Jurisdiction Context */}
        {isAuthenticated ? (
          <div className="hidden lg:flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-[#fffdf8] px-3.5 py-1.5 rounded-full border border-[#d8d3c9] text-xs text-[#171716] shadow-sm">
              <MapPin className="h-3.5 w-3.5 text-[#ef5b2a] shrink-0" />
              <span className="text-[#68655e] text-[11px] font-medium">{t.activeJurisdiction}:</span>
              <span className="font-bold text-[#171716] truncate max-w-[200px]">
                {user.jurisdiction.districtName
                  ? `${user.jurisdiction.districtName}, ${user.jurisdiction.stateName || "Karnataka"}`
                  : user.jurisdiction.stateName || t.nationalJurisdiction}
              </span>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-3 text-xs text-[#68655e]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#15803d]" />
              <span>RFCTLARR Act 2013</span>
            </span>
            <span>•</span>
            <span>PM GatiShakti NMP</span>
            <span>•</span>
            <span>{lang === "hi" ? "14-अंकीय भू-आधार" : "14-Digit Land ID"}</span>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              {/* Home Quick Link */}
              <Link
                href="/"
                className="hidden sm:flex items-center justify-center p-2 rounded-full text-[#68655e] hover:text-[#171716] hover:bg-[#eae6dc] transition-colors"
                title={lang === "hi" ? "मुख्य पृष्ठ" : "Portal Landing Page"}
              >
                <Home className="h-4 w-4" />
              </Link>

              {/* Real-time Notifications Drawer */}
              <NotificationDrawer />


              {/* Officer Identity Pill */}
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#d8d3c9]">
                <div className="w-8 h-8 rounded-full bg-[#171716] text-[#fffdf8] flex items-center justify-center text-xs font-bold shadow-sm">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-[#171716] line-clamp-1 leading-tight max-w-[110px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-[#68655e] line-clamp-1 max-w-[110px]">{user.designation}</p>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                title={lang === "hi" ? "लॉगआउट करें" : "Sign Out"}
                className="h-9 w-9 p-0 text-[#68655e] hover:text-rose-600 hover:bg-rose-50 rounded-full"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            /* Unauthenticated Visitor State */
            <div className="flex items-center gap-2">
              <Link href="/citizen">
                <Button variant="ghost" size="sm" className="text-xs h-9 font-semibold text-[#171716] hover:bg-[#eae6dc] rounded-full border border-[#d8d3c9]">
                  <User className="h-3.5 w-3.5 mr-1 text-[#68655e]" />
                  <span>{lang === "hi" ? "नागरिक पोर्टल" : "Citizen Portal"}</span>
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold text-xs h-9 px-4 flex items-center gap-1.5 shadow-sm rounded-full">
                  <KeyRound className="h-3.5 w-3.5 text-[#fffdf8]" />
                  <span>{lang === "hi" ? "अधिकारी लॉगिन" : "Officer Login"}</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer Overlay (When Hamburger is toggled on mobile) */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="civic-mobile-drawer md:hidden border-t border-[#d8d3c9] bg-[#fffdf8] px-4 py-3 shadow-xl space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#d8d3c9] text-xs font-bold text-[#68655e]">
            <span>{t.roleNavigation} • {activeRole.replace("_", " ")}</span>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1 text-[#ef5b2a] hover:underline"
            >
              <Home className="h-3 w-3" />
              <span>{lang === "hi" ? "मुख्य पृष्ठ" : "Home"}</span>
            </Link>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === "/citizen" && pathname === "/citizen");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href + item.title}
                  href={item.href}
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-[#ef5b2a]/10 text-[#ef5b2a] font-bold border border-[#ef5b2a]/30"
                      : "text-[#68655e] hover:text-[#171716] hover:bg-[#f4f1ea]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("h-4 w-4", isActive ? "text-[#ef5b2a]" : "text-[#68655e]")} />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase",
                        isActive
                          ? "bg-[#ef5b2a] text-white"
                          : "bg-[#eae6dc] text-[#171716]"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* User info on mobile */}
          <div className="pt-2 border-t border-[#d8d3c9] flex items-center justify-between text-xs text-[#68655e]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#171716] text-[#fffdf8] flex items-center justify-center text-[10px] font-bold shadow-sm">
                {user.name[0]}
              </div>
              <div>
                <p className="font-bold text-[#171716]">{user.name}</p>
                <p className="text-[10px] text-[#68655e]">{user.designation}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="h-7 text-xs text-rose-600 hover:bg-rose-50 border-[#d8d3c9] rounded-full"
            >
              <LogOut className="h-3 w-3 mr-1" />
              <span>{lang === "hi" ? "लॉगआउट" : "Sign Out"}</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
