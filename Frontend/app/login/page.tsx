"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, MOCK_PROFILES } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useAuthCredentialsQuery, useUpdateCredentialsMutation } from "@/hooks/queries/use-bhoomi-queries";
import { USER_ROLES } from "@/lib/constants";
import { UserRole } from "@/types/user";
import { getRoleLandingRoute } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BhoomiEmblem } from "@/components/ui/bhoomi-emblem";
import {
  Lock,
  Mail,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  RefreshCw,
  Edit3,
  CheckCircle2,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const { login, isAuthenticated, activeRole, refreshCredentials } = useAuth();
  const { lang } = useI18n();

  const { data: credentialsData, refetch: refetchCreds } = useAuthCredentialsQuery();
  const updateCredsMutation = useUpdateCredentialsMutation();

  const [selectedRole, setSelectedRole] = useState<UserRole>("CENTRAL_MINISTRY");
  const [email, setEmail] = useState("ananya.sharma@nic.in");
  const [password, setPassword] = useState("bhoomi2026");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Edit credentials in backend state
  const [showEditor, setShowEditor] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editLoginName, setEditLoginName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const currentBackendCred = credentialsData?.[selectedRole];

  // Dynamically update form inputs when role or backend credentials change
  useEffect(() => {
    if (currentBackendCred) {
      setEmail(currentBackendCred.email || currentBackendCred.loginName || "");
      setPassword(currentBackendCred.password || "bhoomi2026");
      setEditEmail(currentBackendCred.email || "");
      setEditLoginName(currentBackendCred.loginName || "");
      setEditPassword(currentBackendCred.password || "bhoomi2026");
      setEditFullName(currentBackendCred.fullName || "");
    } else {
      const profile = MOCK_PROFILES[selectedRole];
      if (profile) {
        setEmail(profile.email);
        setPassword("bhoomi2026");
        setEditEmail(profile.email);
        setEditLoginName(profile.email.split("@")[0]);
        setEditPassword("bhoomi2026");
        setEditFullName(profile.name);
      }
    }
  }, [selectedRole, currentBackendCred]);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSaveCredentialsToBackend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await updateCredsMutation.mutateAsync({
        role: selectedRole,
        email: editEmail,
        loginName: editLoginName,
        password: editPassword,
        fullName: editFullName,
      });
      await refetchCreds();
      await refreshCredentials();
      setIsUpdating(false);
      setShowEditor(false);
      setSuccessMsg(
        lang === "hi"
          ? "क्रेडेंशियल्स बैकएंड डेटाबेस में सफलतापूर्वक अपडेट हो गए!"
          : "Credentials updated in backend PostgreSQL database!"
      );
    } catch (err: any) {
      setIsUpdating(false);
      setErrorMsg(err?.message || "Failed to update credentials in backend.");
    }
  };


  const resolveTargetRoute = (role: UserRole) => {
    if (
      !redirectUrl ||
      redirectUrl === "/" ||
      redirectUrl === "/login" ||
      redirectUrl === "/dashboard" ||
      redirectUrl.startsWith("/dashboard/") ||
      redirectUrl === "/field" ||
      redirectUrl === "/citizen"
    ) {
      return getRoleLandingRoute(role);
    }
    return redirectUrl;
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg(
        lang === "hi"
          ? "कृपया आधिकारिक ईमेल और पासवर्ड दोनों दर्ज करें।"
          : "Please enter both your official email / ID and password."
      );
      return;
    }

    setLoading(true);
    try {
      await login(email, password, selectedRole);
      setLoading(false);
      const target = resolveTargetRoute(selectedRole);
      // Use window.location.href to guarantee cookies (bhoomi_token & bhoomi_role)
      // are synchronously committed to browser networking stack before Next.js middleware runs.
      window.location.href = target;
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(
        err?.message ||
          (lang === "hi"
            ? "प्रमाणीकरण विफल रहा। कृपया विवरण सत्यापित करें।"
            : "Authentication failed. Please verify credentials.")
      );
    }
  };

  const handleParichaySso = () => {
    setLoading(true);
    const target = resolveTargetRoute(selectedRole);
    const apiBase = getApiBaseUrl();
    window.location.href = `${apiBase}/auth/parichay/login?role=${encodeURIComponent(selectedRole)}&redirect=${encodeURIComponent(target)}`;
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Back Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#68655e] hover:text-[#ef5b2a] transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{lang === "hi" ? "मुख्य पोर्टल पर वापस जाएं" : "Back to BhoomiSetu"}</span>
        </Link>
      </div>

      {/* Login Card */}
      <Card className="border border-[#d8d3c9] bg-[#fffdf8] shadow-xl shadow-stone-200/40 rounded-2xl overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header with Emblem */}
          <div className="flex flex-col items-center text-center space-y-2.5">
            <BhoomiEmblem className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-black text-[#171716] tracking-tight">
                {lang === "hi" ? "अधिकारी पोर्टल लॉगिन" : "Sign In"}
              </h1>
              <p className="text-xs text-[#68655e] mt-0.5">
                {lang === "hi"
                  ? "भूमिसेतु • राष्ट्रीय भूमि अधिग्रहण प्रबंधन मंच"
                  : "BhoomiSetu • National Land Acquisition Platform"}
              </p>
            </div>
          </div>

          {/* Active Session Notice */}
          {isAuthenticated && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
              <span className="text-[#171716] font-medium">
                {lang === "hi" ? "सक्रिय सत्र उपलब्ध है" : "Active session detected"}
              </span>
              <Link
                href={getRoleLandingRoute(activeRole)}
                className="font-bold text-[#ef5b2a] hover:underline"
              >
                {lang === "hi" ? "डैशबोर्ड खोलें →" : "Go to Dashboard →"}
              </Link>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Live Backend Credential Sync Badge & Quick Editor Toggle */}
          <div className="p-2.5 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-[#15803d]">
                <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse" />
                <span className="font-bold">
                  {lang === "hi" ? "बैकएंड डेटाबेस क्रेडेंशियल सिंक" : "Live Backend Credentials Sync"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowEditor(!showEditor)}
                className="text-[11px] font-bold text-[#ef5b2a] hover:underline flex items-center gap-1"
              >
                <Edit3 className="h-3 w-3" />
                <span>
                  {showEditor
                    ? (lang === "hi" ? "बंद करें" : "Close Editor")
                    : (lang === "hi" ? "आईडी / पासवर्ड बदलें" : "Change Login ID & Password")}
                </span>
              </button>
            </div>

            {/* Quick Backend Credential Editor */}
            {showEditor && (
              <div className="pt-2 border-t border-[#d8d3c9] space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#68655e] uppercase">
                    {lang === "hi" ? "नया लॉगिन आईडी (Login Name)" : "Login Name"}
                  </label>
                  <Input
                    type="text"
                    value={editLoginName}
                    onChange={(e) => setEditLoginName(e.target.value)}
                    placeholder="e.g. citizen or custom_id"
                    className="h-8 text-xs bg-white border-[#d8d3c9]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#68655e] uppercase">
                    {lang === "hi" ? "नया ईमेल (Email)" : "Email Address"}
                  </label>
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="h-8 text-xs bg-white border-[#d8d3c9]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#68655e] uppercase">
                    {lang === "hi" ? "नया पासवर्ड (Password)" : "New Password"}
                  </label>
                  <Input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="h-8 text-xs bg-white border-[#d8d3c9]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#68655e] uppercase">
                    {lang === "hi" ? "पूरा नाम (Full Name)" : "Full Name"}
                  </label>
                  <Input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Full name"
                    className="h-8 text-xs bg-white border-[#d8d3c9]"
                  />
                </div>
                <Button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleSaveCredentialsToBackend}
                  className="w-full h-8 text-xs bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isUpdating ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#15803d]" />
                  )}
                  <span>
                    {isUpdating
                      ? (lang === "hi" ? "डेटाबेस में सेव हो रहा है..." : "Saving to PostgreSQL...")
                      : (lang === "hi" ? "डेटाबेस में सेव करें व फ्रंटएंड में बदलें" : "Save to DB & Sync Frontend")}
                  </span>
                </Button>
              </div>
            )}
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleStandardLogin} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-1.5">
              <label htmlFor="role-select" className="text-xs font-semibold text-[#171716]">
                {lang === "hi" ? "आधिकारिक भूमिका" : "Role"}
              </label>
              <div className="relative">
                <select
                  id="role-select"
                  name="role"
                  value={selectedRole}
                  onChange={(e) => handleSelectRole(e.target.value as UserRole)}
                  className="w-full h-10 pl-3.5 pr-9 rounded-xl border border-[#d8d3c9] bg-white text-xs font-medium text-[#171716] focus:outline-none focus:ring-2 focus:ring-[#ef5b2a]/30 focus:border-[#ef5b2a] transition-all cursor-pointer appearance-none"
                >
                  {USER_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-[#68655e] pointer-events-none" />
              </div>
            </div>


            {/* Email / Officer ID */}
            <div className="space-y-1.5">
              <label htmlFor="email-input" className="text-xs font-semibold text-[#171716]">
                {lang === "hi" ? "आधिकारिक ईमेल / आईडी" : "Official Email / Government ID"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#68655e]" />
                <Input
                  id="email-input"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@nic.in"
                  className="pl-9 text-xs h-10 rounded-xl bg-white border-[#d8d3c9] text-[#171716] focus-visible:ring-[#ef5b2a]/30 focus-visible:border-[#ef5b2a]"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password-input" className="text-xs font-semibold text-[#171716]">
                {lang === "hi" ? "सुरक्षा पासकोड" : "Password"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#68655e]" />
                <Input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter passphrase"
                  className="pl-9 pr-10 text-xs h-10 rounded-xl bg-white border-[#d8d3c9] text-[#171716] focus-visible:ring-[#ef5b2a]/30 focus-visible:border-[#ef5b2a]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#68655e] hover:text-[#171716] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ef5b2a] hover:bg-[#d94a1b] text-white font-bold h-11 text-xs rounded-xl shadow-md shadow-[#ef5b2a]/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>{lang === "hi" ? "प्रमाणित हो रहा है..." : "Authenticating..."}</span>
                ) : (
                  <>
                    <span>
                      {lang === "hi" ? "पोर्टल में साइन इन करें" : "Sign In to Portal"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {/* SSO Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#d8d3c9]" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-[#fffdf8] px-2.5 text-[#68655e]">
                  {lang === "hi" ? "या" : "or continue with"}
                </span>
              </div>
            </div>

            {/* Parichay SSO Button */}
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleParichaySso}
              className="w-full h-10 border-[#d8d3c9] bg-[#f4f1ea] text-[#171716] hover:bg-[#eae6dc] text-xs font-semibold flex items-center justify-center gap-2 rounded-xl transition-all"
            >
              <span>🇮🇳</span>
              <span>{lang === "hi" ? "परिचय एकल साइन-ऑन (Parichay SSO)" : "Parichay Government SSO"}</span>
            </Button>
          </form>

          {/* Footer note */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-[#68655e]">
              {lang === "hi"
                ? "राष्ट्रीय सूचना विज्ञान केंद्र (NIC) सुरक्षा मानकों द्वारा संरक्षित"
                : "Secured in compliance with National Informatics Centre (NIC) standards"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-6">
      <Suspense fallback={<div className="text-xs text-[#68655e]">Loading authentication portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
