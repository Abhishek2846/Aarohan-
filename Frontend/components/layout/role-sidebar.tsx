"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useAuth, MOCK_PROFILES } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Map,
  Compass,
  FileText,
  Coins,
  ShieldCheck,
  FolderOpen,
  HelpCircle,
  TrendingUp,
  Building,
  Users,
  AlertTriangle,
  Download,
  Camera,
  FileSignature,
  Clock,
  MapPin,
  Plus,
  Layers,
  Smartphone,
  FileCheck2,
  Footprints,
  Sparkles,
  Scale,
  Stamp,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  tabId?: string;
}

export function getRoleNavItems(activeRole: string, t: any, lang: string = "en"): NavItem[] {
  switch (activeRole) {
    case "PIA":
      return [
        { title: lang === "hi" ? "प्रोजेक्ट कमान केंद्र" : "Agency Dashboard", href: "/dashboard/pia?tab=overview", icon: LayoutDashboard, tabId: "overview" },
        { title: lang === "hi" ? "मेरी विकास परियोजनाएं" : "My Projects", href: "/dashboard/pia?tab=projects", icon: Building, tabId: "projects" },
        { title: lang === "hi" ? "पीएम गति शक्ति एनओसी स्क्रीनर" : "PM Gati Shakti Clearances", href: "/gati-shakti", icon: Compass, badge: "7 NOCs" },
        { title: lang === "hi" ? "आधिकारिक ई-राजपत्र प्रकाशक" : "Official e-Gazette Publisher", href: "/gazette", icon: Stamp, badge: "eGazette" },
        { title: lang === "hi" ? "कॉरिडोर विलंब व रुकावट रडार" : "Corridor Delay & Bottleneck Radar", href: "/dashboard/pia?tab=delay-risk", icon: Sparkles, tabId: "delay-risk", badge: "Live SHAP" },
        { title: lang === "hi" ? "नया प्रोजेक्ट दर्ज करें" : "Create Project", href: "/projects/new", icon: Plus },
        { title: lang === "hi" ? "प्रोजेक्ट का मार्ग नक्शा" : "Project Route & Alignments", href: "/dashboard/pia?tab=alignments", icon: Compass, tabId: "alignments" },
        { title: lang === "hi" ? "प्रभावित खेत व जमीन (भू-आधार)" : "Affected Land Plots", href: "/dashboard/pia?tab=parcels", icon: Layers, tabId: "parcels" },
        { title: lang === "hi" ? "भूमि अधिग्रहण केस" : "Acquisition Cases", href: "/cases", icon: FileText },
        { title: lang === "hi" ? "प्रोजेक्ट फाइलें व सरकारी कागजात" : "Project Documents", href: "/documents", icon: FolderOpen },
        { title: lang === "hi" ? "स्पष्टीकरण एवं सवाल" : "Clarification Requests", href: "/dashboard/pia?tab=clarifications", icon: HelpCircle, tabId: "clarifications", badge: lang === "hi" ? "3 जरूरी" : "3 Urgent" },
        { title: lang === "hi" ? "मुआवजा बैंक भुगतान स्थिति" : "Compensation Money Status", href: "/compensation", icon: Coins },
        { title: lang === "hi" ? "जमीन कब्जा व सुपुर्दगी स्थिति" : "Land Possession Status", href: "/possession", icon: ShieldCheck },
        { title: lang === "hi" ? "परिवार पुनर्वास सहायता (R&R)" : "Family Resettlement (R&R)", href: "/rr", icon: Users },
        { title: lang === "hi" ? "परियोजना रिपोर्ट एवं आदेश" : "Reports and Orders", href: "/dashboard/pia?tab=reports", icon: Download, tabId: "reports" },
      ];
    case "CENTRAL_MINISTRY":
      return [
        { title: lang === "hi" ? "राष्ट्रीय निगरानी डैशबोर्ड" : "National Dashboard", href: "/dashboard/national?tab=overview", icon: LayoutDashboard, tabId: "overview" },
        { title: lang === "hi" ? "पीएम गति शक्ति राष्ट्रीय मास्टर प्लान" : "PM Gati Shakti NMP Console", href: "/gati-shakti", icon: Sparkles, badge: "PMO NMP" },
        { title: lang === "hi" ? "आधिकारिक ई-राजपत्र प्रकाशक" : "Official e-Gazette Publisher", href: "/gazette", icon: Stamp, badge: "RFCTLARR" },
        { title: lang === "hi" ? "एआई विलंब एवं रुकावट रडार" : "AI Delay Risk & Bottlenecks", href: "/dashboard/national?tab=delay-risk", icon: Sparkles, tabId: "delay-risk", badge: "Live SHAP" },
        { title: lang === "hi" ? "अखिल भारतीय परियोजनाएं" : "All National Projects", href: "/dashboard/national?tab=projects", icon: Building, tabId: "projects" },
        { title: lang === "hi" ? "राज्यवार प्रगति एवं रैंकिंग" : "State Progress & Rankings", href: "/dashboard/national?tab=states", icon: TrendingUp, tabId: "states" },
        { title: lang === "hi" ? "जिलावार प्रगति समीक्षा" : "District Progress", href: "/dashboard/national?tab=districts", icon: MapPin, tabId: "districts" },
        { title: lang === "hi" ? "मुआवजा एवं किसान राहत (R&R)" : "Compensation & Farmer Relief", href: "/dashboard/national?tab=compensation", icon: Coins, tabId: "compensation" },
        { title: lang === "hi" ? "किसान आपत्तियां एवं अदालती मामले" : "Grievances & Court Cases", href: "/dashboard/national?tab=litigation", icon: FileText, tabId: "litigation" },
        { title: lang === "hi" ? "केंद्रीय समाधान एवं समीक्षा" : "Central Escalations", href: "/dashboard/national?tab=escalations", icon: ShieldCheck, tabId: "escalations" },
        { title: lang === "hi" ? "नीति, नियम एवं अनुपालन" : "Compliance & Standards", href: "/dashboard/national?tab=compliance", icon: Compass, tabId: "compliance" },
        { title: lang === "hi" ? "अधिकारी एवं सत्र नियंत्रण" : "Users & Session Admin", href: "/settings", icon: Users, badge: "Admin" },
        { title: lang === "hi" ? "राष्ट्रीय रिपोर्ट एवं निर्णय" : "National Reports", href: "/dashboard/national?tab=reports", icon: Download, tabId: "reports" },
      ];
    case "STATE_AUTHORITY":
      return [
        { title: lang === "hi" ? "राज्य राजस्व कंसोल" : "State Revenue Console", href: "/dashboard/state?tab=overview", icon: LayoutDashboard, tabId: "overview" },
        { title: lang === "hi" ? "अंतर-विभागीय वन एवं लोक निर्माण एनओसी" : "Inter-Agency Forest & NOCs", href: "/gati-shakti", icon: Layers, badge: "Stage-1" },
        { title: lang === "hi" ? "आधिकारिक ई-राजपत्र प्रकाशक" : "Official e-Gazette Publisher", href: "/gazette", icon: Stamp, badge: "eGazette" },
        { title: lang === "hi" ? "राज्य विलंब जोखिम रडार" : "State Delay Risk Radar", href: "/dashboard/state?tab=delay-risk", icon: Sparkles, tabId: "delay-risk", badge: "4-Band" },
        { title: lang === "hi" ? "राज्य में विकास परियोजनाएं" : "Projects in State", href: "/dashboard/state?tab=projects", icon: Building, tabId: "projects" },
        { title: lang === "hi" ? "मंजूरी हेतु लंबित फाइलें" : "Approvals Pending", href: "/dashboard/state?tab=approvals", icon: Clock, tabId: "approvals" },
        { title: lang === "hi" ? "जिलों की कार्य प्रगति" : "District Progress", href: "/dashboard/state?tab=districts", icon: MapPin, tabId: "districts" },
        { title: lang === "hi" ? "डिजिटल खेत सीमा नक्शा" : "Field Boundary Map", href: "/gis", icon: Map },
        { title: lang === "hi" ? "परिवार पुनर्वास निगरानी (R&R)" : "Family Resettlement Oversight", href: "/rr", icon: Users },
        { title: lang === "hi" ? "राज्य रिपोर्ट एवं आदेश" : "State Reports & Orders", href: "/dashboard/state?tab=reports", icon: Download, tabId: "reports" },
      ];
    case "DISTRICT_OFFICER":
      return [
        { title: lang === "hi" ? "जिला भूमि कार्यालय (CALA)" : "District Land Office (CALA)", href: "/dashboard/district?tab=overview", icon: LayoutDashboard, tabId: "overview" },
        { title: lang === "hi" ? "जिले के भूमि अधिग्रहण केस" : "District Land Cases", href: "/cases", icon: FileText },
        { title: lang === "hi" ? "आधिकारिक ई-राजपत्र प्रकाशक (CALA)" : "Official e-Gazette Publisher", href: "/gazette", icon: Stamp, badge: "Sec 11/19" },
        { title: lang === "hi" ? "संयुक्त वन एवं स्थल निरीक्षण (JSI)" : "Joint Site Inspections (JSI)", href: "/gati-shakti", icon: ShieldCheck, badge: "DFO JSI" },
        { title: lang === "hi" ? "एसएलएओ 90-दिन विलंब डॉकेट" : "SLAO 90-Day Delay Docket", href: "/dashboard/district?tab=delay-risk", icon: Scale, tabId: "delay-risk", badge: "90d SLA" },
        { title: lang === "hi" ? "खेत सर्वे रिपोर्ट अनुमोदन" : "Surveys to Approve", href: "/dashboard/district?tab=surveys", icon: Camera, tabId: "surveys" },
        { title: lang === "hi" ? "मुआवजा आदेश हस्ताक्षर" : "Compensation Awards to Sign", href: "/dashboard/district?tab=awards", icon: FileSignature, tabId: "awards" },
        { title: lang === "hi" ? "जमीन कब्जा एवं हस्तांतरण सूची" : "Possession Handover Schedule", href: "/dashboard/district?tab=possession", icon: ShieldCheck, tabId: "possession" },
        { title: lang === "hi" ? "परिवार पुनर्वास एवं सहायता" : "Family Resettlement Help", href: "/rr", icon: Users },
        { title: lang === "hi" ? "किसान आपत्तियां एवं सुनवाई" : "Farmer Hearings & Objections", href: "/dashboard/district?tab=grievances", icon: HelpCircle, tabId: "grievances" },
        { title: lang === "hi" ? "डिजिटल खेत सीमा नक्शा" : "Field Boundary Map", href: "/gis", icon: Map },
        { title: lang === "hi" ? "आधिकारिक जिला रिपोर्ट" : "District Reports & Orders", href: "/dashboard/district?tab=reports", icon: Download, tabId: "reports" },
      ];
    case "FIELD_OFFICER":
      return [
        { title: lang === "hi" ? "आवंटित खेत सर्वे कार्य" : "Assigned Field Tasks", href: "/field?tab=tasks", icon: LayoutDashboard, tabId: "tasks" },
        { title: lang === "hi" ? "चलकर जमीन मापन" : "GPS Walking Survey", href: "/survey", icon: Footprints },
        { title: lang === "hi" ? "कैडस्ट्रल विलंब एवं सर्वे जोखिम" : "Cadastral Delay & Survey Risks", href: "/field?tab=delay-risk", icon: AlertTriangle, tabId: "delay-risk", badge: "GNSS" },
        { title: lang === "hi" ? "खेत नाप-जोख सर्वे फॉर्म" : "Digital Survey Form", href: "/field?tab=survey", icon: FileCheck2, tabId: "survey" },
        { title: lang === "hi" ? "ऑफ़लाइन सुरक्षित डेटा" : "Offline Sync Queue", href: "/field?tab=offline", icon: Smartphone, tabId: "offline", badge: lang === "hi" ? "2 सुरक्षित" : "2 Queued" },
        { title: lang === "hi" ? "सुधार एवं संशोधन कार्य" : "Correction Queue", href: "/field?tab=corrections", icon: AlertTriangle, tabId: "corrections", badge: lang === "hi" ? "1 कार्रवाई" : "1 Action" },
        { title: lang === "hi" ? "डिजिटल खेत सीमा नक्शा" : "Field Boundary Map", href: "/gis", icon: Map },
        { title: lang === "hi" ? "जमीन कब्जा पंचनामा रिपोर्ट" : "Possession Handover Memo", href: "/possession", icon: ShieldCheck },
        { title: lang === "hi" ? "सर्वे व निरीक्षण दस्तावेज" : "Survey Documents", href: "/documents", icon: FolderOpen },
        { title: lang === "hi" ? "सर्वेक्षक दिशानिर्देश (SOP)" : "Survey Guidelines (SOP)", href: "/field?tab=guidelines", icon: Compass, tabId: "guidelines" },
      ];
    case "AUDITOR":
      return [
        { title: lang === "hi" ? "जांच एवं ऑडिट कंसोल" : "Audit & Inspection Console", href: "/dashboard/auditor?tab=overview", icon: ShieldCheck, tabId: "overview" },
        { title: lang === "hi" ? "गति शक्ति नियामक अनुपालन ऑडिट" : "Gati Shakti Regulatory Audit", href: "/gati-shakti", icon: FileCheck2, badge: "MoEFCC" },
        { title: lang === "hi" ? "आधिकारिक ई-राजपत्र ऑडिट" : "Official e-Gazette Audit", href: "/gazette", icon: Stamp, badge: "SHA-256" },
        { title: lang === "hi" ? "वैधानिक विलंब जोखिम ऑडिट" : "Statutory Delay Risk Audit", href: "/dashboard/auditor?tab=delay-risk", icon: ShieldCheck, tabId: "delay-risk", badge: "SHAP Audit" },
        { title: lang === "hi" ? "सुरक्षित गतिविधि व भुगतान रिकॉर्ड" : "Activity & Payment History", href: "/audit", icon: FileText },
        { title: lang === "hi" ? "गड़बड़ी एवं जोखिम चेतावनियां" : "Irregularity & Risk Alerts", href: "/dashboard/auditor?tab=anomalies", icon: AlertTriangle, tabId: "anomalies" },
        { title: lang === "hi" ? "सरकारी फाइल व कागजात जांच" : "Case Documents Check", href: "/dashboard/auditor?tab=documents", icon: FolderOpen, tabId: "documents" },
        { title: lang === "hi" ? "बैंक मुआवजा भुगतान जांच" : "Compensation Payment Audit", href: "/dashboard/auditor?tab=compensation", icon: Coins, tabId: "compensation" },
        { title: lang === "hi" ? "डिजिटल खेत सीमा नक्शा" : "Field Boundary Map", href: "/gis", icon: Map },
        { title: lang === "hi" ? "आधिकारिक ऑडिट रिपोर्ट" : "Official Audit Reports", href: "/dashboard/auditor?tab=reports", icon: Download, tabId: "reports" },
      ];
    case "CITIZEN":
    default:
      return [
        { title: lang === "hi" ? "मेरी जमीन व मुआवजा पैसा" : "My Land & Compensation Money", href: "/citizen", icon: LayoutDashboard, tabId: "plot" },
        { title: lang === "hi" ? "मेरी जमीन का नक्शा" : "My Land Boundary Map", href: "/gis", icon: Map },
        { title: lang === "hi" ? "आधिकारिक ई-राजपत्र सत्यापन" : "e-Gazette Notifications", href: "/gazette", icon: Stamp, badge: "Public" },
        { title: lang === "hi" ? "मेरी शिकायतें व अर्जी स्थिति" : "My Objections & Status", href: "/citizen?tab=objections", icon: HelpCircle, tabId: "objections" },
        { title: lang === "hi" ? "सरकारी नोटिस व आदेश" : "Government Notices & Orders", href: "/citizen?tab=documents", icon: FileText, tabId: "documents" },
      ];
  }
}

function RoleSidebarContent() {
  const router = useRouter();
  const { activeRole, user, isAuthenticated } = useAuth();
  const { t, lang } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get("tab") : null;

  // Determine if current context is Citizen
  const isCitizenContext =
    activeRole === "CITIZEN" ||
    pathname.startsWith("/citizen") ||
    (pathname.startsWith("/gis") && (typeof window !== "undefined" && (localStorage.getItem("aarohan_active_role") === "CITIZEN" || document.cookie.includes("aarohan_role=CITIZEN")))) ||
    (pathname.startsWith("/gazette") && (typeof window !== "undefined" && (localStorage.getItem("aarohan_active_role") === "CITIZEN" || document.cookie.includes("aarohan_role=CITIZEN"))));

  const effectiveRole = isCitizenContext && (!isAuthenticated || activeRole === "CITIZEN") ? "CITIZEN" : activeRole;

  if (!isAuthenticated && !isCitizenContext) {
    return null;
  }

  const currentOfficer =
    (isAuthenticated && user) ||
    (effectiveRole && MOCK_PROFILES[effectiveRole as keyof typeof MOCK_PROFILES]) ||
    MOCK_PROFILES.CITIZEN;

  const navItems = getRoleNavItems(effectiveRole, t, lang);

  return (
    <aside className="w-[272px] border-r border-[#d8d3c9] bg-[#f4f1ea] p-3.5 shrink-0 hidden md:flex flex-col justify-between min-h-[calc(100vh-4.5rem)] relative z-20">
      <div className="space-y-1">
        {/* Designated Officer Identity Profile Card */}
        <div className="p-3 rounded-2xl border border-[#d8d3c9] bg-[#fffdf8] shadow-xs space-y-1 mb-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#ef5b2a] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{effectiveRole.replace("_", " ")}</span>
            </span>
            <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-[#eae6dc] text-[#171716]">
              {effectiveRole ? effectiveRole.slice(0, 4) : "AUTH"}
            </span>
          </div>
          <div>
            <h3 className="text-xs font-black text-[#171716] leading-tight line-clamp-1">
              {currentOfficer.name}
            </h3>
            <p className="text-[11px] font-semibold text-slate-700 leading-tight line-clamp-1 mt-0.5">
              {currentOfficer.designation}
            </p>
          </div>
          <div className="text-[9px] text-[#68655e] pt-1 border-t border-[#eae6dc] font-mono truncate">
            {currentOfficer.department}
          </div>
        </div>

        <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-[#68655e] uppercase">
          {t.roleNavigation}
        </div>
        {navItems.map((item) => {
          let isActive = pathname === item.href;
          if (effectiveRole === "CITIZEN") {
            if (item.href === "/gis") {
              isActive = pathname === "/gis";
            } else if (item.href === "/citizen") {
              isActive = pathname === "/citizen" && (!currentTab || currentTab === "plot");
            } else if (item.href.includes("tab=objections")) {
              isActive = pathname === "/citizen" && currentTab === "objections";
            } else if (item.href.includes("tab=documents") || item.href.includes("tab=public")) {
              isActive = pathname === "/citizen" && (currentTab === "documents" || currentTab === "public");
            }
          } else if (effectiveRole === "AUDITOR") {
            if (item.href === "/gis") {
              isActive = pathname === "/gis";
            } else if (item.href === "/audit") {
              isActive = pathname === "/audit";
            } else if (pathname === "/dashboard/auditor") {
              if (item.tabId === "overview") {
                isActive = !currentTab || currentTab === "overview";
              } else if (item.tabId) {
                isActive = currentTab === item.tabId;
              }
            }
          } else if (activeRole === "STATE_AUTHORITY") {
            if (item.href === "/gis") {
              isActive = pathname === "/gis";
            } else if (item.href === "/rr") {
              isActive = pathname === "/rr";
            } else if (pathname === "/dashboard/state") {
              if (item.tabId === "overview") {
                isActive = !currentTab || currentTab === "overview";
              } else if (item.tabId) {
                isActive = currentTab === item.tabId;
              }
            }
          } else if (activeRole === "DISTRICT_OFFICER") {
            if (item.href === "/gis") {
              isActive = pathname === "/gis";
            } else if (item.href === "/cases") {
              isActive = pathname === "/cases";
            } else if (item.href === "/rr") {
              isActive = pathname === "/rr";
            } else if (pathname === "/dashboard/district") {
              if (item.tabId === "overview") {
                isActive = !currentTab || currentTab === "overview";
              } else if (item.tabId) {
                isActive = currentTab === item.tabId;
              }
            }
          } else if (activeRole === "CENTRAL_MINISTRY") {
            if (pathname === "/dashboard/national") {
              if (item.tabId === "overview") {
                isActive = !currentTab || currentTab === "overview";
              } else if (item.tabId) {
                isActive = currentTab === item.tabId;
              }
            }
          } else if (activeRole === "PIA") {
            if (pathname === "/dashboard/pia") {
              if (item.tabId === "overview") {
                isActive = !currentTab || currentTab === "overview";
              } else if (item.tabId) {
                isActive = currentTab === item.tabId;
              }
            } else {
              isActive = pathname === item.href;
            }
          } else if (activeRole === "FIELD_OFFICER") {
            if (pathname === "/field") {
              if (item.tabId === "tasks") {
                isActive = !currentTab || currentTab === "tasks";
              } else if (item.tabId) {
                isActive = currentTab === item.tabId;
              }
            } else {
              isActive = pathname === item.href;
            }
          }
          const Icon = item.icon;
          return (
            <Link
              key={item.href + item.title}
              href={item.href}
              onClick={(e) => {
                const isCitizenNav = effectiveRole === "CITIZEN";
                const isGisTransition = pathname.startsWith("/gis") || item.href.startsWith("/gis");
                if (isCitizenNav || isGisTransition) {
                  e.preventDefault();
                  window.location.href = item.href;
                  return;
                }
              }}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all gap-2",
                isActive
                  ? "bg-[#fffdf8] text-[#171716] font-bold border-l-4 border-[#ef5b2a] shadow-sm"
                  : "text-[#68655e] hover:text-[#171716] hover:bg-[#fffdf8]/60"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#ef5b2a]" : "text-[#68655e]")} />
                <span className="truncate">{item.title}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 inline-flex items-center leading-normal",
                    isActive
                      ? "bg-[#ef5b2a] text-white"
                      : item.badge.toLowerCase().includes("urgent") || item.badge.includes("जरूरी") || item.badge.toLowerCase().includes("action")
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : "bg-[#eae6dc] text-[#171716] border border-[#d8d3c9]"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-6 px-2 text-[10px] text-[#68655e]">
        <div className="flex items-center gap-2 bg-[#fffdf8] px-3 py-2 rounded-xl border border-[#d8d3c9] shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-pulse" />
          <span className="font-bold text-[#171716]">ISO 19152 (ULPIN)</span>
          <span className="text-[#68655e] ml-auto font-mono">v2.4</span>
        </div>
      </div>
    </aside>
  );
}

export function RoleSidebar() {
  return (
    <Suspense fallback={<aside className="w-64 border-r border-[#d8d3c9] bg-[#f4f1ea] p-4 shrink-0 hidden md:block" />}>
      <RoleSidebarContent />
    </Suspense>
  );
}
