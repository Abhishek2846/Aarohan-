"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, UserCheck, KeyRound, Building2, CheckCircle2, Lock, ArrowRight, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getApiBaseUrl } from "@/lib/api";

const VERIFIED_OFFICERS = [
  {
    name: "Dr. Ananya Sharma, IAS",
    designation: "Joint Secretary (Land Resources)",
    dept: "Ministry of Rural Development (DoLR)",
    email: "ananya.sharma@nic.in",
    role: "CENTRAL_MINISTRY",
    cadre: "IAS (2008 Batch)",
  },
  {
    name: "Priya Sundaram, IAS",
    designation: "District Magistrate & SLAO",
    dept: "District Administration Bengaluru Rural",
    email: "dc.bengaluru@karnataka.gov.in",
    role: "DISTRICT_OFFICER",
    cadre: "IAS (2014 Batch)",
  },
  {
    name: "Vikram Malhotra",
    designation: "Chief General Manager (Technical)",
    dept: "National Highways Authority of India (NHAI)",
    email: "v.malhotra@nhai.gov.in",
    role: "PIA",
    cadre: "NHAI Project Division",
  },
  {
    name: "Rajeshwar Rao",
    designation: "Principal Secretary (Revenue)",
    dept: "Karnataka Revenue Department",
    email: "r.rao@karnataka.gov.in",
    role: "STATE_AUTHORITY",
    cadre: "IAS (Senior Scale)",
  },
  {
    name: "Suresh Patil",
    designation: "Revenue Field Surveyor (RI)",
    dept: "Doddaballapur Taluk Office",
    email: "s.patil@karnataka.gov.in",
    role: "FIELD_OFFICER",
    cadre: "State Revenue Cadre",
  },
];

function GatewayContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("client_id") || "bhoomi-setu-client-01";
  const redirectUri = searchParams.get("redirect_uri") || `${getApiBaseUrl()}/auth/parichay/callback`;
  const state = searchParams.get("state") || "";
  const requestedRole = searchParams.get("role") || "CENTRAL_MINISTRY";

  const [activeTab, setActiveTab] = useState<"fast" | "manual">("fast");
  const [selectedOfficer, setSelectedOfficer] = useState(
    VERIFIED_OFFICERS.find((o) => o.role === requestedRole) || VERIFIED_OFFICERS[0]
  );
  const [customEmail, setCustomEmail] = useState("ananya.sharma@nic.in");
  const [password, setPassword] = useState("••••••••••••");
  const [kavachPin, setKavachPin] = useState("849201");
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isHindi, setIsHindi] = useState(false);

  const handleAuthorize = (email: string) => {
    setIsAuthorizing(true);
    const authCode = `MOCK_PARICHAY_${encodeURIComponent(email)}_${Date.now()}`;
    const callbackTarget = `${redirectUri}?code=${encodeURIComponent(authCode)}&state=${encodeURIComponent(state)}`;
    setTimeout(() => {
      window.location.href = callbackTarget;
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center p-4">
      {/* Tricolor Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ef5b2a] via-white to-[#059669] shadow-sm" />

      {/* Language Toggle */}
      <div className="w-full max-w-xl flex justify-end mb-3">
        <button
          onClick={() => setIsHindi(!isHindi)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-white border border-[#d8d3c9] rounded-lg text-[#171716] shadow-sm hover:bg-[#eae6dc] transition-all"
        >
          <Globe className="h-3.5 w-3.5 text-[#ef5b2a]" />
          <span>{isHindi ? "English" : "हिन्दी"}</span>
        </button>
      </div>

      {/* Main Gateway Card */}
      <Card className="w-full max-w-xl border border-[#d8d3c9] bg-[#fffdf8] shadow-2xl rounded-2xl overflow-hidden">
        {/* Government Header */}
        <div className="p-6 bg-gradient-to-b from-[#fbf8f0] to-[#fffdf8] border-b border-[#d8d3c9] text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">🏛️</span>
            <div className="text-left">
              <h1 className="text-lg font-black text-[#171716] tracking-tight leading-tight">
                {isHindi ? "मेरी पहचान • जन परिचय" : "Meri Pehchaan • Jan Parichay"}
              </h1>
              <p className="text-[11px] text-[#68655e] font-medium">
                {isHindi
                  ? "राष्ट्रीय एकल साइन-ऑन सेवा • इलेक्ट्रॉनिक्स एवं आईटी मंत्रालय, भारत सरकार"
                  : "National Single Sign-On Gateway • MeitY, Government of India"}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] text-emerald-800 font-semibold mt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              {isHindi
                ? "सुरक्षित सरकारी प्रमाणीकरण पोर्टल (एनआईसी सुरक्षा प्रमाणित)"
                : "Authoritative Central & State Civil Servant Identity Hub"}
            </span>
          </div>
        </div>

        {/* Consumer Service Context */}
        <div className="px-6 py-2.5 bg-[#f5efe6] border-b border-[#d8d3c9] flex items-center justify-between text-xs">
          <span className="text-[#68655e]">
            {isHindi ? "प्रमाणीकरण अनुरोधकर्ता ऐप:" : "Service Requesting Access:"}
          </span>
          <span className="font-bold text-[#171716] flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-[#ef5b2a]" />
            BhoomiSetu (Land Acquisition Platform)
          </span>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Tab Selection */}
          <div className="flex rounded-xl bg-[#ede8dd] p-1 border border-[#d8d3c9]">
            <button
              onClick={() => setActiveTab("fast")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "fast"
                  ? "bg-white text-[#171716] shadow-sm"
                  : "text-[#68655e] hover:text-[#171716]"
              }`}
            >
              <UserCheck className="h-4 w-4 text-[#ef5b2a]" />
              <span>{isHindi ? "सत्यापित अधिकारी चयन" : "1-Click Civil Servant"}</span>
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "manual"
                  ? "bg-white text-[#171716] shadow-sm"
                  : "text-[#68655e] hover:text-[#171716]"
              }`}
            >
              <KeyRound className="h-4 w-4 text-[#ef5b2a]" />
              <span>{isHindi ? "एनआईसी क्रेडेंशियल + कवच 2FA" : "NIC ID + Kavach 2FA"}</span>
            </button>
          </div>

          {/* Tab 1: Fast-Track Civil Servant Selection */}
          {activeTab === "fast" && (
            <div className="space-y-3">
              <p className="text-xs text-[#68655e]">
                {isHindi
                  ? "भूमिसेतु पोर्टल में प्रवेश करने के लिए अपना आधिकारिक पद चुनें:"
                  : "Select an official designated officer to authorize your session:"}
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {VERIFIED_OFFICERS.map((officer) => (
                  <div
                    key={officer.email}
                    onClick={() => setSelectedOfficer(officer)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedOfficer.email === officer.email
                        ? "border-[#ef5b2a] bg-[#fff5f0] ring-1 ring-[#ef5b2a]"
                        : "border-[#d8d3c9] bg-white hover:border-[#68655e]"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#171716]">{officer.name}</span>
                        <Badge variant="outline" className="text-[10px] border-[#d8d3c9]">
                          {officer.cadre}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#68655e]">{officer.designation} • {officer.dept}</p>
                      <p className="text-[10px] font-mono text-[#ef5b2a]">{officer.email}</p>
                    </div>

                    {selectedOfficer.email === officer.email && (
                      <CheckCircle2 className="h-5 w-5 text-[#ef5b2a] flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleAuthorize(selectedOfficer.email)}
                disabled={isAuthorizing}
                className="w-full bg-[#ef5b2a] hover:bg-[#d94a1b] text-white font-bold h-11 text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isAuthorizing ? (
                  <span>{isHindi ? "प्रमाणीकरण टोकन जारी हो रहा है..." : "Issuing OIDC Identity Token..."}</span>
                ) : (
                  <>
                    <span>
                      {isHindi
                        ? `${selectedOfficer.name} के रूप में प्रवेश करें`
                        : `Sign In as ${selectedOfficer.name}`}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Tab 2: Manual NIC ID + Kavach 2FA */}
          {activeTab === "manual" && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">
                  {isHindi ? "सरकारी ईमेल आईडी (@nic.in / @gov.in)" : "Government Email ID (@nic.in / @gov.in)"}
                </label>
                <Input
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="name.officer@nic.in"
                  className="h-10 text-xs bg-white border-[#d8d3c9]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">
                  {isHindi ? "पासवर्ड / पासफ्रेज" : "Password / Passphrase"}
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 text-xs bg-white border-[#d8d3c9]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-[#171716] flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-[#059669]" />
                    <span>{isHindi ? "कवच मल्टी-फैक्टर (MFA) 6-अंकीय कोड" : "Kavach Multi-Factor (MFA) 6-Digit PIN"}</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-mono">OTP Active</span>
                </div>
                <Input
                  value={kavachPin}
                  onChange={(e) => setKavachPin(e.target.value)}
                  maxLength={6}
                  className="h-10 text-xs bg-white border-[#d8d3c9] font-mono tracking-widest text-center text-sm font-bold"
                />
              </div>

              <Button
                onClick={() => handleAuthorize(customEmail)}
                disabled={isAuthorizing}
                className="w-full bg-[#171716] hover:bg-[#2d2d2c] text-white font-bold h-11 text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isAuthorizing ? (
                  <span>{isHindi ? "कवच 2FA सत्यापित हो रहा है..." : "Validating Kavach Security Seal..."}</span>
                ) : (
                  <>
                    <span>{isHindi ? "कवच 2FA से सत्यापित करें एवं आगे बढ़ें" : "Verify Kavach 2FA & Authorize"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Footer Security Badges */}
          <div className="pt-4 border-t border-[#d8d3c9] text-center space-y-1">
            <p className="text-[11px] text-[#68655e]">
              {isHindi
                ? "यह सेवा भारत सरकार के सूचना प्रौद्योगिकी अधिनियम 2000 के अंतर्गत संरक्षित है।"
                : "Protected under the Information Technology Act 2000 & STQC Security Guidelines."}
            </p>
            <p className="text-[10px] font-mono text-[#68655e]">
              Client ID: {clientId} • Callback: {redirectUri.split("/")[2]}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ParichayGatewayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#68655e]">Loading Jan Parichay Gateway...</div>}>
      <GatewayContent />
    </Suspense>
  );
}
