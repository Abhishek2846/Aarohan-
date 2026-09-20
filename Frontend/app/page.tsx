"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { USER_ROLES } from "@/lib/constants";
import { UserRole } from "@/types/user";
import { getRoleLandingRoute } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// ── Animated Counter Hook ──
function useCounter(target: number, inView: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return count;
}

// ── 3D Tilt Card ──
function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const springX = useSpring(rotX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotY, { stiffness: 200, damping: 20 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rotX.set(-((e.clientY - cy) / (rect.height / 2)) * 8);
    rotY.set(((e.clientX - cx) / (rect.width / 2)) * 8);
  };
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        rotX.set(0);
        rotY.set(0);
      }}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Animated Stat Counter ──
function StatCounter({
  value,
  label,
  suffix = "",
  prefix = "",
  inView,
}: {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  inView: boolean;
}) {
  const count = useCounter(value, inView);
  return (
    <div style={{ textAlign: "center" }}>
      <div
        className="bs-stat-value"
        style={{
          fontSize: "clamp(2.5rem, 5vw, 4rem)",
          fontWeight: 800,
          background: "linear-gradient(135deg, #fff 30%, #F59E0B 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {prefix}
        {count.toLocaleString("en-IN")}
        {suffix}
      </div>
      <div
        className="bs-stat-label"
        style={{
          fontSize: "0.8rem",
          color: "rgba(199,196,215,0.65)",
          marginTop: "0.5rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── Scroll Progress Bar ──
function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <div
      className="bhoomi-scroll-progress"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 1000,
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${p}%`,
          background: "linear-gradient(90deg, #F59E0B, #1E3A8A, #138808)",
          transition: "width 0.05s linear",
          boxShadow: "0 0 12px rgba(245,158,11,0.7)",
        }}
      />
    </div>
  );
}

// ── Feature Card Data ──
interface FeatureCard {
  id: string;
  title: string;
  titleHi: string;
  desc: string;
  descHi: string;
  href: string;
  icon: string;
  color: string;
  badge: string;
  isPublic?: boolean;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    id: "national-command",
    title: "National Overview & Tracking",
    titleHi: "राष्ट्रीय समग्र निगरानी व नियंत्रण",
    desc: "All-India infrastructure highway and rail projects tracking, inter-state progress and time-limit checks.",
    descHi: "देश भर की राजमार्ग व रेल परियोजनाओं की प्रगति, अंतरराज्यीय समन्वय और समय सीमा की निगरानी।",
    href: "/dashboard/national",
    icon: "⚡",
    color: "#F59E0B",
    badge: "National",
  },
  {
    id: "gis-workstation",
    title: "Land Map & Boundaries (GIS)",
    titleHi: "खेत का डिजिटल नक्शा व सीमांकन",
    desc: "Satellite maps, 14-digit Bhu-Aadhaar (ULPIN) parcel lines, and road width boundary checks.",
    descHi: "इसरो उपग्रह नक्शा, 14-अंकीय भू-आधार (यूलपिन) खेत की सीमाएं और सड़क का दायरा।",
    href: "/gis",
    icon: "🗺️",
    color: "#3B82F6",
    badge: "Land Map",
  },
  {
    id: "cases-pipeline",
    title: "12-Stage Land Acquisition Cases",
    titleHi: "12-चरणीय भूमि अधिग्रहण कार्य",
    desc: "Complete step-by-step progress from survey notice, farmer hearings to final bank payout.",
    descHi: "सर्वे नोटिस, किसान सुनवाई, मुआवजा फैसले से लेकर सीधे बैंक खाते में भुगतान तक पूरे 12 चरण।",
    href: "/cases",
    icon: "📋",
    color: "#8B5CF6",
    badge: "12 Steps",
  },
  {
    id: "projects-portfolio",
    title: "National Highway & Rail Projects",
    titleHi: "राजमार्ग, रेलवे व बुनियादी ढांचा परियोजनाएं",
    desc: "Expressways, railway corridors, metro lines, and energy pipelines across all states.",
    descHi: "सभी राज्यों में एक्सप्रेसवे, रेल कॉरिडोर, मेट्रो और पाइपलाइन परियोजनाएं।",
    href: "/projects",
    icon: "🏗️",
    color: "#10B981",
    badge: "Projects",
  },
  {
    id: "compensation-gateway",
    title: "Compensation Money & Bank Transfer",
    titleHi: "मुआवजा पैसा एवं बैंक खाता भुगतान",
    desc: "Automatic compensation calculation with 100% extra government bonus and direct transfer to farmer accounts.",
    descHi: "100% अतिरिक्त सरकारी बोनस (दोगुना पैसा) के साथ मुआवजा गणना और सीधे बैंक खाते में भुगतान।",
    href: "/compensation",
    icon: "💰",
    color: "#F59E0B",
    badge: "Direct Bank",
  },
  {
    id: "simulation-sandbox",
    title: "What-If Route Comparison",
    titleHi: "वैकल्पिक सड़क रास्ता तुलना",
    desc: "Compare alternate routes to minimize displacement of farmer families and reduce costs.",
    descHi: "किसान परिवारों और उपजाऊ खेतों को बचाने के लिए विभिन्न सड़क रास्तों की आपस में तुलना।",
    href: "/simulation",
    icon: "🔮",
    color: "#EC4899",
    badge: "Compare",
  },
  {
    id: "field-pwa",
    title: "Field Survey & Mobile App",
    titleHi: "खेत नाप-जोख व मोबाइल ऐप",
    desc: "Surveyors measure land plots, record boundary pillars, and take verified on-site field photos.",
    descHi: "अमीन व पटवारी खेत की नाप-जोख करते हैं, पिलर दर्ज करते हैं और मौके की प्रमाणित फोटो लेते हैं।",
    href: "/field",
    icon: "📱",
    color: "#06B6D4",
    badge: "Field App",
  },
  {
    id: "audit-ledger",
    title: "Tamper-Proof Audit & Record",
    titleHi: "पारदर्शी व सुरक्षित सरकारी रिकॉर्ड",
    desc: "Secure cryptographic ledger ensuring no officer or person can tamper with records or payout amounts.",
    descHi: "सुरक्षित डिजिटल खाता जिससे कोई भी अधिकारी या व्यक्ति रिकॉर्ड या मुआवजे के पैसे में हेराफेरी न कर सके।",
    href: "/audit",
    icon: "🔐",
    color: "#EF4444",
    badge: "Secure",
  },
  {
    id: "document-vault",
    title: "Official Papers & Orders Vault",
    titleHi: "सरकारी आदेश व कागजात तिजोरी",
    desc: "Official repository of signed gazette notices, compensation calculation receipts, and order copies.",
    descHi: "हस्ताक्षरित सरकारी गजट, अधिसूचनाएं, मुआवजा गणना रसीद और आदेश प्रतियों का सुरक्षित संग्रह।",
    href: "/documents",
    icon: "🗂️",
    color: "#6366F1",
    badge: "Papers",
  },
  {
    id: "citizen-transparency",
    title: "Farmer & Citizen Portal",
    titleHi: "किसान व नागरिक पारदर्शिता पोर्टल",
    desc: "Direct tracking for farmers: plot status, bank transfer updates, gazette copies, and free objections.",
    descHi: "किसानों के लिए सीधी सुविधा: खेत की स्थिति, बैंक में आने वाला पैसा, सरकारी कागजात और निःशुल्क आपत्ति।",
    href: "/citizen",
    icon: "👥",
    color: "#14B8A6",
    badge: "Farmer",
    isPublic: true,
  },
];

// ── Workflow Stages ──
const WORKFLOW_PIPELINE = [
  { stage: 1, name: "Project Planning", nameHi: "योजना व प्रस्ताव", color: "#F59E0B" },
  { stage: 2, name: "Land Demarcation", nameHi: "जमीन नाप-जोख व सीमा", color: "#3B82F6" },
  { stage: 3, name: "Farmer Family Survey", nameHi: "किसान परिवार व सामाजिक सर्वे", color: "#8B5CF6" },
  { stage: 4, name: "Initial Public Notice", nameHi: "प्रारंभिक सरकारी सूचना (धारा 11)", color: "#10B981" },
  { stage: 5, name: "Farmer Objections Hearing", nameHi: "किसान आपत्ति व सुनवाई (धारा 15)", color: "#EC4899" },
  { stage: 6, name: "Final Government Declaration", nameHi: "अंतिम सरकारी घोषणा (धारा 19)", color: "#06B6D4" },
  { stage: 7, name: "Joint Field Survey", nameHi: "संयुक्त जमीन नाप-जोख", color: "#EF4444" },
  { stage: 8, name: "Double Bonus & Valuation", nameHi: "100% बोनस व पेड़-कुआं मूल्यांकन", color: "#F59E0B" },
  { stage: 9, name: "Final Compensation Order", nameHi: "अंतिम मुआवजा निर्णय (धारा 23)", color: "#3B82F6" },
  { stage: 10, name: "Direct Bank Transfer (DBT)", nameHi: "सीधे बैंक खाते में भुगतान", color: "#8B5CF6" },
  { stage: 11, name: "Land Handover (Post-Payout)", nameHi: "कब्जा सौंपना (पूरे भुगतान बाद)", color: "#10B981" },
  { stage: 12, name: "Rehabilitation Support", nameHi: "पुनर्वास व परिवार सहायता", color: "#EC4899" },
];

// ── Platform Features ──
const PLATFORM_FEATURES = [
  {
    icon: "📊",
    title: "Live Tracking & Timelines",
    titleHi: "लाइव ट्रैकिंग व समय सीमा",
    color: "#F59E0B",
    desc: "Real-time updates showing delays, work progress, and officer actions across all projects.",
    descHi: "सभी परियोजनाओं में काम की प्रगति, देरी और अधिकारियों की कार्रवाई की लाइव स्थिति।",
  },
  {
    icon: "🛰️",
    title: "Satellite Land Mapping",
    titleHi: "उपग्रह से खेत का नक्शा",
    color: "#3B82F6",
    desc: "Clear satellite imagery linked with 14-digit Bhu-Aadhaar numbers showing exact field boundaries.",
    descHi: "14-अंकीय भू-आधार से जुड़ा सैटेलाइट नक्शा जो खेत की सही सीमाएं दिखाता है।",
  },
  {
    icon: "⚖️",
    title: "100% Farmer Protection Rules",
    titleHi: "कानूनी सुरक्षा व अधिकार",
    color: "#8B5CF6",
    desc: "Strict enforcement of 2013 Land Acquisition Act ensuring mandatory 100% bonus and fair hearings.",
    descHi: "भूमि कानून 2013 का कड़ाई से पालन: 100% अतिरिक्त बोनस (दोगुना पैसा) और निष्पक्ष सुनवाई की गारंटी।",
  },
  {
    icon: "🔗",
    title: "Tamper-Proof Records",
    titleHi: "छेड़छाड़-मुक्त रिकॉर्ड",
    color: "#EF4444",
    desc: "Digital security ensures that no data, survey measurements, or money records can ever be secretly altered.",
    descHi: "डिजिटल सुरक्षा जिससे खेत की नाप या मुआवजे के पैसे में कोई भी हेराफेरी न कर सके।",
  },
  {
    icon: "📡",
    title: "Mobile App for Field Surveys",
    titleHi: "खेत पर नाप-जोख मोबाइल ऐप",
    color: "#06B6D4",
    desc: "Survey officers inspect plots on-site with GPS coordinates and camera photos even without internet.",
    descHi: "अमीन व पटवारी बिना इंटरनेट के भी खेत पर जीपीएस और कैमरा से सही नाप-जोख दर्ज करते हैं।",
  },
  {
    icon: "🤖",
    title: "Smart Delay Alert System",
    titleHi: "स्मार्ट विलंब चेतावनी प्रणाली",
    color: "#EC4899",
    desc: "Intelligent system detects upcoming delays in hearings or bank transfers and alerts senior officers early.",
    descHi: "सुनवाई या बैंक भुगतान में होने वाली देरी को समय रहते पहचानकर अधिकारियों को अलर्ट करता है।",
  },
];

export default function HomePage() {
  const { activeRole, isAuthenticated, login } = useAuth();
  const { lang, setLanguage } = useI18n();
  const router = useRouter();

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [targetFeature, setTargetFeature] = useState<FeatureCard | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState<UserRole>("PIA");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const dashboardRoute = getRoleLandingRoute(activeRole);
  const loginRoute = isAuthenticated ? dashboardRoute : "/login";

  // Stats section ref
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  const handleFeatureClick = (feature: FeatureCard) => {
    if (feature.isPublic) {
      router.push(feature.href);
      return;
    }
    if (isAuthenticated) {
      router.push(feature.href);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(feature.href)}`);
    }
  };

  const handleModalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError(lang === "hi" ? "कृपया ईमेल और पासवर्ड दोनों दर्ज करें।" : "Please enter both email and password.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    try {
      await login(loginEmail, loginPassword, loginRole);
      setLoginLoading(false);
      setAuthModalOpen(false);
      if (targetFeature) router.push(targetFeature.href);
    } catch (err: any) {
      setLoginLoading(false);
      setLoginError(err?.message || "Authentication failed.");
    }
  };

  return (
    <div
      key={lang}
      className={`no-translate bhoomi-landing ${lang === "hi" ? "font-hindi" : ""}`}
      style={{
        background: "#050508",
        minHeight: "100vh",
        overflowX: "hidden",
        color: "#e3e2e8",
        width: "100%",
        fontFamily: lang === "hi" ? "var(--font-hindi)" : undefined,
      }}
    >
      <ScrollProgress />

      {/* ── Floating Nav Pill ── */}
      <div
        className="bhoomi-landing-nav-shell"
        style={{
          position: "fixed",
          top: "1rem",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 999,
          pointerEvents: "none",
          padding: "0 0.75rem",
        }}
      >
        <motion.nav
          className="bhoomi-landing-nav"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "clamp(0.75rem, 2vw, 1.75rem)",
            padding: "0.45rem clamp(0.75rem, 2vw, 1.4rem)",
            background: "rgba(18,19,26,0.92)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: "9999px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            maxWidth: "calc(100vw - 1.5rem)",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexShrink: 0 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #F59E0B, #138808)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
              }}
            >
              🏛️
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: "0.86rem",
                color: "#fff",
                letterSpacing: "0.04em",
              }}
            >
              {lang === "hi" ? "भूमिसेतु" : "BHOOMI SETU"}
            </span>
          </div>

          {/* Nav Links (Desktop) */}
          <div style={{ display: "flex", gap: "1.25rem" }} className="hidden md:flex">
            {[
              { label: lang === "hi" ? "विशेषताएं" : "Features", href: "#features" },
              { label: lang === "hi" ? "मॉड्यूल" : "Modules", href: "#modules" },
              { label: lang === "hi" ? "कार्यप्रवाह" : "Workflow", href: "#workflow" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                style={{
                  fontSize: "0.78rem",
                  color: "rgba(199,196,215,0.75)",
                  textDecoration: "none",
                  letterSpacing: "0.03em",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(199,196,215,0.75)")}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Language Toggle + CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "9999px",
                padding: "2px",
              }}
            >
              <button
                type="button"
                onClick={() => setLanguage("en")}
                style={{
                  padding: "0.22rem 0.65rem",
                  background: lang === "en" ? "linear-gradient(135deg, #F59E0B, #D97706)" : "transparent",
                  color: lang === "en" ? "#000" : "rgba(199,196,215,0.7)",
                  borderRadius: "9999px",
                  border: "none",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("hi")}
                style={{
                  padding: "0.22rem 0.65rem",
                  background: lang === "hi" ? "linear-gradient(135deg, #F59E0B, #D97706)" : "transparent",
                  color: lang === "hi" ? "#000" : "rgba(199,196,215,0.7)",
                  borderRadius: "9999px",
                  border: "none",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: "var(--font-hindi)",
                }}
              >
                हिन्दी
              </button>
            </div>

            <Link
              href={loginRoute}
              style={{
                padding: "0.38rem 0.95rem",
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#000",
                borderRadius: "9999px",
                fontSize: "0.76rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 0 16px rgba(245,158,11,0.5)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {lang === "hi" ? "डैशबोर्ड →" : "Dashboard →"}
            </Link>
          </div>
        </motion.nav>
      </div>

      {/* ══════════ HERO ══════════ */}
      <section
        className="bs-hero"
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Ambient background glows */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(245,158,11,0.06) 0%, rgba(5,5,8,0.82) 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            top: "5%",
            left: "5%",
            background: "radial-gradient(circle, rgba(30,58,138,0.08) 0%, transparent 70%)",
            filter: "blur(60px)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            bottom: "10%",
            right: "10%",
            background: "radial-gradient(circle, rgba(19,136,8,0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        {/* Animated grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.02,
            backgroundImage:
              "linear-gradient(rgba(245,158,11,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Hero Content */}
        <div
          className="bs-hero-content"
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            padding: "0 1.5rem",
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          {/* Status Pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "5px 14px",
              borderRadius: "9999px",
              border: "1px solid rgba(245,158,11,0.3)",
              background: "rgba(245,158,11,0.06)",
              marginBottom: "2rem",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#F59E0B",
                boxShadow: "0 0 8px #F59E0B",
                animation: "lp-pulse 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontFamily: lang === "hi" ? "var(--font-hindi)" : "monospace",
                fontSize: "0.68rem",
                color: "#F59E0B",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
              }}
            >
              {lang === "hi"
                ? "भारत सरकार • SIH 2026 • SIH26016"
                : "GOVERNMENT OF INDIA • SIH 2026 • SIH26016"}
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            style={{
              fontSize: "clamp(3rem, 8.5vw, 6.5rem)",
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: "-0.04em",
              marginBottom: "1.5rem",
            }}
          >
            <span
              style={{
                background: "linear-gradient(135deg, #fff 0%, #e3e2e8 60%, #F59E0B 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {lang === "hi" ? "भूमिसेतु" : "BhoomiSetu"}
            </span>
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #F59E0B 0%, #1E3A8A 50%, #138808 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: "clamp(1.5rem, 4vw, 3rem)",
              }}
            >
              {lang === "hi" ? "राष्ट्रीय भूमि अधिग्रहण मंच" : "National Land Acquisition Platform"}
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.58 }}
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.15rem)",
              color: "rgba(199,196,215,0.82)",
              lineHeight: 1.7,
              maxWidth: 650,
              margin: "0 auto 2.5rem",
            }}
          >
            {lang === "hi" ? (
              <>
                भारत भर में बुनियादी ढांचा परियोजनाओं के त्वरित क्रियान्वयन हेतु एक{" "}
                <strong style={{ color: "#e3e2e8" }}>GIS-सक्षम, भूमिका-आधारित</strong>{" "}
                राष्ट्रीय भूमि अधिग्रहण प्रबंधन मंच। RFCTLARR 2013, ULPIN भू-आधार, भुवन
                उपग्रह और PFMS DBT — सब एक छत के नीचे।
              </>
            ) : (
              <>
                A centralized, <strong style={{ color: "#e3e2e8" }}>GIS-enabled, role-based</strong> national
                platform modernizing land acquisition across India — connecting{" "}
                <strong style={{ color: "#e3e2e8" }}>RFCTLARR 2013</strong> statutory workflows, ULPIN
                Bhu-Aadhaar parcels, Bhuvan satellite imagery, and PFMS direct benefit transfers.
              </>
            )}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.72 }}
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href={loginRoute}
              style={{
                padding: "1rem 2.5rem",
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#000",
                borderRadius: "9999px",
                fontSize: "1rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 0 32px rgba(245,158,11,0.5)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.25s ease",
              }}
            >
              🚀 {lang === "hi" ? "अधिकारी डैशबोर्ड खोलें" : "Open Officer Dashboard"}
            </Link>

            <Link
              href="/citizen"
              style={{
                padding: "1rem 2rem",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(199,196,215,0.88)",
                borderRadius: "9999px",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: "1rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.25s ease",
                backdropFilter: "blur(10px)",
              }}
            >
              👥 {lang === "hi" ? "नागरिक पोर्टल" : "Citizen Portal"}
            </Link>
          </motion.div>

          {/* Quick Stat Chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: "3rem",
            }}
          >
            {[
              { label: lang === "hi" ? "48 गलियारे" : "48 Corridors", icon: "🛤️" },
              { label: lang === "hi" ? "14 राज्य" : "14 States", icon: "🏛️" },
              { label: lang === "hi" ? "42,890 ULPIN" : "42,890 ULPINs", icon: "📍" },
              { label: lang === "hi" ? "12 वैधानिक चरण" : "12 Statutory Stages", icon: "⚖️" },
            ].map(({ label, icon }) => (
              <div
                key={label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "5px 13px",
                  borderRadius: "9999px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span style={{ fontSize: "0.82rem" }}>{icon}</span>
                <span style={{ fontSize: "0.73rem", color: "rgba(199,196,215,0.65)" }}>{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{
            position: "absolute",
            bottom: "2.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          <span
            style={{
              fontSize: "0.65rem",
              color: "rgba(199,196,215,0.35)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {lang === "hi" ? "स्क्रॉल करें" : "scroll"}
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <span style={{ color: "rgba(199,196,215,0.25)", fontSize: "1.4rem" }}>▼</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════ ABOUT / MISSION ══════════ */}
      <section id="about" className="bs-about" style={{ padding: "7rem 1.5rem", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 1,
            height: "100%",
            background: "linear-gradient(to bottom, transparent, rgba(245,158,11,0.15), transparent)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "4rem",
            alignItems: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "4px 12px",
                borderRadius: "9999px",
                border: "1px solid rgba(245,158,11,0.3)",
                background: "rgba(245,158,11,0.06)",
                marginBottom: "1.25rem",
              }}
            >
              <span
                style={{
                  fontFamily: lang === "hi" ? "var(--font-hindi)" : "monospace",
                  fontSize: "0.68rem",
                  color: "#F59E0B",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                {lang === "hi" ? "मंच के बारे में" : "About the Platform"}
              </span>
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.75rem)",
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "#e3e2e8",
                marginBottom: "1.25rem",
              }}
            >
              {lang === "hi" ? (
                <>
                  भूमि अधिग्रहण
                  <br />
                  <span style={{ color: "#F59E0B" }}>आधुनिक हो रहा है।</span>
                </>
              ) : (
                <>
                  Land acquisition
                  <br />
                  <span style={{ color: "#F59E0B" }}>modernized.</span>
                </>
              )}
            </h2>
            <p
              style={{
                fontSize: "1.05rem",
                color: "rgba(199,196,215,0.78)",
                lineHeight: 1.75,
                marginBottom: "1.25rem",
              }}
            >
              {lang === "hi"
                ? "भूमिसेतु भारत का पहला GIS-सक्षम, भूमिका-आधारित राष्ट्रीय भूमि अधिग्रहण प्रबंधन मंच है। यह RFCTLARR अधिनियम 2013 के सभी 12 वैधानिक चरणों को डिजिटाइज करता है — SIA सामाजिक प्रभाव आकलन से लेकर भौतिक कब्जा हस्तांतरण तक।"
                : "BhoomiSetu is India's first GIS-enabled, role-based National Land Acquisition Management Platform. It digitizes all 12 statutory stages of the RFCTLARR Act 2013 — from Social Impact Assessment to physical possession handover — connecting every stakeholder in real time."}
            </p>
            <p
              style={{
                fontSize: "1.05rem",
                color: "rgba(199,196,215,0.78)",
                lineHeight: 1.75,
                marginBottom: "2rem",
              }}
            >
              {lang === "hi"
                ? "14-अंकीय ULPIN भू-आधार, भुवन उपग्रह चित्रण, PFMS प्रत्यक्ष लाभ अंतरण और SHA-256 अपरिवर्तनीय ऑडिट — सब एक मंच पर।"
                : "From 14-digit ULPIN Bhu-Aadhaar linkage to Bhuvan satellite imagery, PFMS direct benefit transfers, and SHA-256 tamper-evident audit trails — all on one platform."}
            </p>
            <button
              onClick={() => handleFeatureClick(FEATURE_CARDS[1])}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.7rem 1.6rem",
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.35)",
                color: "#F59E0B",
                borderRadius: "9999px",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {lang === "hi" ? "GIS नक्शा खोलें →" : "Open GIS Map →"}
            </button>
          </motion.div>

          <motion.div
            className="bs-about-tiles"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.15 }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}
          >
            {[
              { icon: "🗺️", label: lang === "hi" ? "GIS भुवन एकीकरण" : "Bhuvan GIS Integration", color: "#3B82F6" },
              { icon: "⚖️", label: lang === "hi" ? "12-चरणीय कार्यप्रवाह" : "12-Stage RFCTLARR", color: "#8B5CF6" },
              { icon: "📍", label: lang === "hi" ? "14-अंकीय ULPIN" : "14-Digit ULPIN", color: "#10B981" },
              { icon: "💰", label: lang === "hi" ? "PFMS DBT संवितरण" : "PFMS DBT Disbursement", color: "#F59E0B" },
              { icon: "🔐", label: lang === "hi" ? "SHA-256 ऑडिट" : "SHA-256 Audit Trail", color: "#EF4444" },
              { icon: "📡", label: lang === "hi" ? "ऑफ़लाइन PWA" : "Offline-First PWA", color: "#06B6D4" },
              { icon: "🤖", label: lang === "hi" ? "AI विलंब भविष्यवाणी" : "AI Delay Predictor", color: "#EC4899" },
              { icon: "📊", label: lang === "hi" ? "वास्तविक समय डैशबोर्ड" : "Real-time Dashboards", color: "#F59E0B" },
            ].map(({ icon, label, color }, i) => (
              <motion.div
                className="bs-about-tile"
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  padding: "0.75rem 0.9rem",
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "0.7rem",
                }}
              >
                <span style={{ fontSize: "1.05rem", flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: "0.78rem", color: "rgba(199,196,215,0.82)", lineHeight: 1.3 }}>
                  {label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ MODULES / FEATURE CARDS ══════════ */}
      <section
        className="bs-modules"
        id="modules"
        style={{
          padding: "7rem 1.5rem",
          background: "linear-gradient(180deg, rgba(5,5,8,0) 0%, rgba(13,14,18,0.7) 50%, rgba(5,5,8,0) 100%)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: "3.5rem" }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "4px 12px",
                borderRadius: "9999px",
                border: "1px solid rgba(59,130,246,0.3)",
                background: "rgba(59,130,246,0.05)",
                marginBottom: "1rem",
              }}
            >
              <span
                style={{
                  fontFamily: lang === "hi" ? "var(--font-hindi)" : "monospace",
                  fontSize: "0.68rem",
                  color: "#3B82F6",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                {lang === "hi" ? "10 मॉड्यूल • सभी एकीकृत" : "10 Modules · Fully Integrated"}
              </span>
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.75rem)",
                fontWeight: 800,
                color: "#e3e2e8",
                letterSpacing: "-0.02em",
                marginBottom: "0.75rem",
              }}
            >
              {lang === "hi" ? "प्लेटफॉर्म कार्यक्षेत्र" : "Platform Workstations"}
            </h2>
            <p
              style={{
                fontSize: "1.05rem",
                color: "rgba(199,196,215,0.6)",
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              {lang === "hi"
                ? "किसी भी मॉड्यूल पर क्लिक करें। सुरक्षित मॉड्यूल हेतु लॉगिन आवश्यक।"
                : "Click any workstation to launch. Officer modules require authentication."}
            </p>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.2rem",
            }}
          >
            {FEATURE_CARDS.map((feat, i) => {
              const c = feat.color;
              return (
                <motion.div
                  key={feat.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                >
                  <TiltCard>
                  <div
                    className="bs-module-card"
                    onClick={() => handleFeatureClick(feat)}
                      style={{
                        padding: "2rem",
                        background: `linear-gradient(135deg, ${c}08 0%, rgba(5,5,8,0.55) 100%)`,
                        border: `1px solid ${c}22`,
                        borderRadius: "1rem",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget;
                        el.style.borderColor = `${c}55`;
                        el.style.boxShadow = `0 8px 32px ${c}30`;
                        el.style.transform = "translateY(-4px)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget;
                        el.style.borderColor = `${c}22`;
                        el.style.boxShadow = "none";
                        el.style.transform = "translateY(0)";
                      }}
                    >
                      {/* Glow orb */}
                      <div
                        style={{
                          position: "absolute",
                          top: -30,
                          right: -30,
                          width: 120,
                          height: 120,
                          borderRadius: "50%",
                          background: `radial-gradient(circle, ${c}25 0%, transparent 70%)`,
                          filter: "blur(20px)",
                          pointerEvents: "none",
                        }}
                      />
                      {/* Icon box */}
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: "0.7rem",
                          background: `${c}15`,
                          border: `1px solid ${c}30`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "1.25rem",
                          fontSize: "1.4rem",
                        }}
                      >
                        {feat.icon}
                      </div>
                      {/* Title & Badge */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "0.55rem",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "1.05rem",
                            fontWeight: 700,
                            color: "#e3e2e8",
                            margin: 0,
                          }}
                        >
                          {lang === "hi" ? feat.titleHi : feat.title}
                        </h3>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.68rem",
                            color: c,
                            background: `${c}14`,
                            border: `1px solid ${c}28`,
                            borderRadius: "9999px",
                            padding: "2px 9px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {feat.badge}
                        </span>
                      </div>
                      {/* Description */}
                      <p
                        style={{
                          fontSize: "0.83rem",
                          color: "rgba(199,196,215,0.62)",
                          lineHeight: 1.55,
                          margin: "0 0 1.25rem",
                        }}
                      >
                        {lang === "hi" ? feat.descHi : feat.desc}
                      </p>
                      {/* Action */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          fontSize: "0.78rem",
                          color: c,
                          fontWeight: 600,
                        }}
                      >
                        {feat.isPublic
                          ? lang === "hi" ? "सार्वजनिक पोर्टल खोलें →" : "Open Public Portal →"
                          : lang === "hi" ? "कार्यक्षेत्र खोलें →" : "Launch →"}
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" className="bs-features" style={{ padding: "7rem 1.5rem", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.022,
            backgroundImage:
              "linear-gradient(rgba(30,58,138,1) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,138,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: "3.5rem" }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "4px 12px",
                borderRadius: "9999px",
                border: "1px solid rgba(139,92,246,0.3)",
                background: "rgba(139,92,246,0.05)",
                marginBottom: "1rem",
              }}
            >
              <span
                style={{
                  fontFamily: lang === "hi" ? "var(--font-hindi)" : "monospace",
                  fontSize: "0.68rem",
                  color: "#8B5CF6",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                {lang === "hi" ? "मुख्य विशेषताएं" : "Core Capabilities"}
              </span>
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.75rem)",
                fontWeight: 800,
                color: "#e3e2e8",
                letterSpacing: "-0.02em",
                marginBottom: "0.75rem",
              }}
            >
              {lang === "hi" ? "शासन हेतु निर्मित" : "Built for Governance"}
            </h2>
            <p
              style={{
                fontSize: "1.05rem",
                color: "rgba(199,196,215,0.6)",
                maxWidth: 460,
                margin: "0 auto",
              }}
            >
              {lang === "hi"
                ? "प्रत्येक सुविधा पारदर्शिता, दक्षता और वैधानिक अनुपालन को बढ़ाती है।"
                : "Every feature deepens transparency, efficiency, and statutory compliance."}
            </p>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
              gap: "1.2rem",
            }}
          >
            {PLATFORM_FEATURES.map((f, i) => (
              <motion.div
                className="bs-capability-card"
                key={f.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                style={{
                  padding: "2rem",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "1rem",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                }}
                whileHover={{
                  y: -5,
                  borderColor: `${f.color}35`,
                  boxShadow: `0 12px 36px ${f.color}1a`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${f.color}45, transparent)`,
                  }}
                />
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "0.7rem",
                    background: `${f.color}14`,
                    border: `1px solid ${f.color}28`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.2rem",
                    fontSize: "1.3rem",
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontSize: "0.98rem",
                    fontWeight: 700,
                    color: "#e3e2e8",
                    marginBottom: "0.55rem",
                  }}
                >
                  {lang === "hi" ? f.titleHi : f.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "rgba(199,196,215,0.62)",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {lang === "hi" ? f.descHi : f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ WORKFLOW PIPELINE ══════════ */}
      <section
        className="bs-workflow"
        id="workflow"
        style={{
          padding: "7rem 1.5rem",
          background: "linear-gradient(180deg, rgba(5,5,8,0) 0%, rgba(13,14,18,0.7) 50%, rgba(5,5,8,0) 100%)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: "3.5rem" }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "4px 12px",
                borderRadius: "9999px",
                border: "1px solid rgba(245,158,11,0.3)",
                background: "rgba(245,158,11,0.05)",
                marginBottom: "1rem",
              }}
            >
              <span
                style={{
                  fontFamily: lang === "hi" ? "var(--font-hindi)" : "monospace",
                  fontSize: "0.68rem",
                  color: "#F59E0B",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                {lang === "hi" ? "वैधानिक कार्यप्रवाह" : "Statutory Lifecycle"}
              </span>
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.75rem)",
                fontWeight: 800,
                color: "#e3e2e8",
                letterSpacing: "-0.02em",
                marginBottom: "0.75rem",
              }}
            >
              {lang === "hi"
                ? "RFCTLARR अधिनियम 2013 का 12-चरणीय कार्यप्रवाह"
                : "12-Stage RFCTLARR Act 2013 Lifecycle"}
            </h2>
            <p
              style={{
                fontSize: "1.05rem",
                color: "rgba(199,196,215,0.6)",
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              {lang === "hi"
                ? "प्रत्येक अधिग्रहण मामला 12 वैधानिक चरणों से गुजरता है।"
                : "Every acquisition docket progresses through 12 statutory stages with digital enforcement."}
            </p>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "1rem",
            }}
          >
            {WORKFLOW_PIPELINE.map((item, i) => (
              <motion.div
                className="bs-stage-card"
                key={item.stage}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                style={{
                  padding: "1.5rem",
                  background: `linear-gradient(135deg, ${item.color}08 0%, rgba(5,5,8,0.55) 100%)`,
                  border: `1px solid ${item.color}22`,
                  borderRadius: "1rem",
                  transition: "all 0.3s",
                  cursor: "default",
                }}
                whileHover={{
                  borderColor: `${item.color}55`,
                  boxShadow: `0 4px 24px ${item.color}20`,
                }}
              >
                <span
                  style={{
                    fontFamily: lang === "hi" ? "var(--font-hindi)" : "monospace",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: item.color,
                  }}
                >
                  {lang === "hi" ? `चरण ${item.stage}` : `STAGE ${item.stage}`}
                </span>
                <p
                  style={{
                    fontWeight: 700,
                    color: "#e3e2e8",
                    fontSize: "0.88rem",
                    marginTop: "0.4rem",
                    lineHeight: 1.3,
                  }}
                >
                  {lang === "hi" ? item.nameHi : item.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section className="bs-stats" style={{ padding: "6rem 1.5rem", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.45), rgba(19,136,8,0.45), transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(19,136,8,0.45), rgba(245,158,11,0.45), transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 60% 100% at 50% 50%, rgba(245,158,11,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div ref={statsRef} style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)",
              fontWeight: 800,
              color: "#e3e2e8",
              letterSpacing: "-0.02em",
              textAlign: "center",
              marginBottom: "3.5rem",
            }}
          >
            {lang === "hi" ? "राष्ट्रीय भूमि अधिग्रहण सांख्यिकी" : "National Governance Tally"}
          </motion.h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "2rem",
            }}
          >
            {[
              { value: 48, label: lang === "hi" ? "बुनियादी गलियारे" : "Corridors", suffix: "" },
              { value: 18420, label: lang === "hi" ? "हेक्टेयर भूमि" : "Hectares", suffix: "" },
              { value: 42890, label: lang === "hi" ? "ULPIN भूखंड" : "ULPIN Parcels", suffix: "" },
              { value: 12480, label: lang === "hi" ? "करोड़ ₹ संवितरित" : "Cr. ₹ Disbursed", suffix: "" },
            ].map(({ value, label, suffix }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <StatCounter value={value} label={label} suffix={suffix} inView={statsInView} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="bs-cta" style={{ padding: "7rem 1.5rem 5rem", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            width: 700,
            height: 700,
            borderRadius: "50%",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)",
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "4px 14px",
                borderRadius: "9999px",
                border: "1px solid rgba(19,136,8,0.3)",
                background: "rgba(19,136,8,0.05)",
                marginBottom: "1.5rem",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#138808",
                  boxShadow: "0 0 6px #138808",
                  animation: "lp-pulse 2s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontFamily: lang === "hi" ? "var(--font-hindi)" : "monospace",
                  fontSize: "0.68rem",
                  color: "#138808",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                {lang === "hi" ? "तैयार हैं?" : "Ready to Transform?"}
              </span>
            </div>
            <h2
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "#e3e2e8",
                marginBottom: "1.25rem",
              }}
            >
              {lang === "hi" ? (
                <>
                  भूमि अधिग्रहण में
                  <br />
                  <span
                    style={{
                      background: "linear-gradient(135deg, #F59E0B, #138808)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    क्रांति लाएं।
                  </span>
                </>
              ) : (
                <>
                  Modernize land acquisition.
                  <br />
                  <span
                    style={{
                      background: "linear-gradient(135deg, #F59E0B, #1E3A8A, #138808)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Start today.
                  </span>
                </>
              )}
            </h2>
            <p
              style={{
                fontSize: "1.05rem",
                color: "rgba(199,196,215,0.68)",
                lineHeight: 1.7,
                maxWidth: 500,
                margin: "0 auto 2.5rem",
              }}
            >
              {lang === "hi"
                ? "कोई साइनअप नहीं। पूरी तरह से पारदर्शी। भारत के बुनियादी ढांचे के निर्माण को गति दें।"
                : "No barriers. Full transparency. Accelerate India's infrastructure delivery with BhoomiSetu."}
            </p>
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 28px rgba(245,158,11,0.28)",
                  "0 0 50px rgba(245,158,11,0.58)",
                  "0 0 28px rgba(245,158,11,0.28)",
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ display: "inline-block", borderRadius: "9999px" }}
            >
              <button
                onClick={() => {
                  router.push(loginRoute);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  padding: "1.1rem 2.8rem",
                  background: "linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #138808 100%)",
                  color: "#fff",
                  borderRadius: "9999px",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                  transition: "transform 0.25s ease",
                }}
              >
                🚀 {lang === "hi" ? "डैशबोर्ड खोलें" : "Launch Dashboard"}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ AUTH MODAL ══════════ */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent
          style={{
            background: "rgba(18,19,26,0.97)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: "1rem",
            maxWidth: "28rem",
            boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
          }}
        >
          <DialogHeader>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#F59E0B",
                fontFamily: lang === "hi" ? "var(--font-hindi)" : "monospace",
                fontSize: "0.68rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: "0.25rem",
              }}
            >
              🔐 {lang === "hi" ? "सुरक्षित अधिकारी कार्यक्षेत्र" : "Officer Authentication Required"}
            </div>
            <DialogTitle style={{ color: "#e3e2e8", fontSize: "1.25rem", fontWeight: 800 }}>
              {lang === "hi" ? "कृपया लॉगिन करें" : "Sign In to Access Module"}
            </DialogTitle>
            <DialogDescription style={{ fontSize: "0.8rem", color: "rgba(199,196,215,0.6)" }}>
              {targetFeature && (
                <span>
                  {lang === "hi"
                    ? `"${targetFeature.titleHi}" — यह मॉड्यूल केवल अधिकृत अधिकारियों हेतु उपलब्ध है।`
                    : `Access to "${targetFeature.title}" requires official credentials.`}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleModalLogin} style={{ display: "flex", flexDirection: "column", gap: "0.85rem", paddingTop: "0.5rem" }}>
            {loginError && (
              <div
                style={{
                  padding: "0.6rem 0.8rem",
                  borderRadius: "0.5rem",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#EF4444",
                  fontSize: "0.78rem",
                }}
              >
                ⚠️ {loginError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(199,196,215,0.8)" }}>
                {lang === "hi" ? "अधिकारी की भूमिका" : "Select Role"}
              </label>
              <select
                value={loginRole}
                onChange={(e) => setLoginRole(e.target.value as UserRole)}
                style={{
                  width: "100%",
                  height: "2.25rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#e3e2e8",
                  padding: "0 0.75rem",
                  fontSize: "0.8rem",
                }}
              >
                {USER_ROLES.map((r) => (
                  <option key={r.id} value={r.id} style={{ background: "#12131a", color: "#e3e2e8" }}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(199,196,215,0.8)" }}>
                {lang === "hi" ? "ईमेल / अधिकारी ID" : "Official Email / ID"}
              </label>
              <Input
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="e.g. officer@nic.in"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e3e2e8",
                  fontSize: "0.8rem",
                  height: "2.25rem",
                }}
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(199,196,215,0.8)" }}>
                {lang === "hi" ? "पासवर्ड" : "Security Passcode"}
              </label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter passcode"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e3e2e8",
                  fontSize: "0.8rem",
                  height: "2.25rem",
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                width: "100%",
                padding: "0.7rem",
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#000",
                borderRadius: "0.5rem",
                fontSize: "0.85rem",
                fontWeight: 700,
                border: "none",
                cursor: loginLoading ? "wait" : "pointer",
                opacity: loginLoading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              🔐{" "}
              {loginLoading
                ? lang === "hi" ? "सत्यापन हो रहा है..." : "Authenticating..."
                : lang === "hi" ? "प्रमाणित करें एवं आगे बढ़ें" : "Authenticate & Proceed"}
            </button>

            <div style={{ textAlign: "center", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "0.75rem", color: "rgba(199,196,215,0.4)" }}>
              {lang === "hi" ? "या पूर्ण लॉगिन पृष्ठ:" : "Or use full login page:"}{" "}
              <Link
                href={targetFeature?.href ? `/login?redirect=${encodeURIComponent(targetFeature.href)}` : "/login"}
                onClick={() => setAuthModalOpen(false)}
                style={{ color: "#F59E0B", fontWeight: 700, textDecoration: "none" }}
              >
                {lang === "hi" ? "लॉगिन गेटवे →" : "Login Gateway →"}
              </Link>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Keyframe Animations */}
      <style>{`
        @keyframes lp-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor; }
          50%       { opacity: 0.55; box-shadow: 0 0 14px currentColor; }
        }
      `}</style>
    </div>
  );
}
