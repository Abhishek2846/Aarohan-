"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Globe,
  Shield,
  Moon,
  Smartphone,
  CheckCircle2,
  Lock,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [slaEscalations, setSlaEscalations] = useState(true);
  const [language, setLanguage] = useState("en");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#171716]">
          System Preferences & Configuration
        </h1>
        <p className="text-xs text-[#68655e]">
          Manage alert notifications, regional language preferences, and security protocols.
        </p>
      </div>

      {/* Notifications & SLA Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            <span>Statutory & SLA Alert Channels</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Configure real-time automated escalations when a land acquisition case reaches 80% of its SLA timeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-[#f4f1ea] border-[#d8d3c9]">
            <div>
              <p className="text-xs font-semibold text-[#171716]">
                Email Notifications (NIC Mail Gateway)
              </p>
              <p className="text-[11px] text-[#68655e]">
                Receive daily digests of pending gazette notifications and objection hearings.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-[#f4f1ea] border-[#d8d3c9]">
            <div>
              <p className="text-xs font-semibold text-[#171716]">
                Mock SMS Gateway (Priority Escalations)
              </p>
              <p className="text-[11px] text-[#68655e]">
                Send SMS alerts to field amins and district surveyors for scheduled joint measurements.
              </p>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-[#f4f1ea] border-[#d8d3c9]">
            <div>
              <p className="text-xs font-semibold text-[#171716]">
                Explainable Delay-Risk Auto-Triggers
              </p>
              <p className="text-[11px] text-[#68655e]">
                Trigger high-priority alerts when compensation disbursement variance exceeds 15%.
              </p>
            </div>
            <input
              type="checkbox"
              checked={slaEscalations}
              onChange={(e) => setSlaEscalations(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Multilingual Localization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" />
            <span>Portal Language & Localization</span>
          </CardTitle>
          <CardDescription className="text-xs">
            BhoomiSetu supports Indian official languages for citizen notices and field apps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "en", name: "English (Default)", native: "English" },
              { id: "hi", name: "Hindi", native: "हिन्दी" },
              { id: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
              { id: "mr", name: "Marathi", native: "मराठी" },
              { id: "ta", name: "Tamil", native: "தமிழ்" },
              { id: "te", name: "Telugu", native: "తెలుగు" },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  language === lang.id
                    ? "border-blue-600 bg-[#ef5b2a]/10 dark:bg-blue-950 font-bold text-blue-900 dark:text-blue-200 ring-1 ring-blue-500"
                    : "border-slate-200 hover:bg-[#f4f1ea] text-slate-700 dark:border-[#d8d3c9] dark:text-[#171716]"
                }`}
              >
                <p className="text-xs">{lang.name}</p>
                <p className="text-[11px] text-[#68655e] font-normal">{lang.native}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security & Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>Audit Security & Session Protocol</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-[#f4f1ea] border-[#d8d3c9]">
            <div>
              <p className="font-semibold text-[#171716]">Active Session Timeout</p>
              <p className="text-[11px] text-[#68655e]">Government security standard: 30 minutes of inactivity</p>
            </div>
            <Badge variant="outline">30 Mins (Enforced)</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-[#f4f1ea] border-[#d8d3c9]">
            <div>
              <p className="font-semibold text-[#171716]">Tamper-Proof Activity Trail Logging</p>
              <p className="text-[11px] text-[#68655e]">All administrative actions are recorded with tamper-proof security stamps</p>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm flex items-center gap-2">
          <Save className="h-4 w-4" />
          <span>{saved ? "Saved Successfully!" : "Save Preferences"}</span>
        </Button>
      </div>
    </div>
  );
}
