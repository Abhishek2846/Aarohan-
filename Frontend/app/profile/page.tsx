"use client";

import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  ShieldCheck,
  Building,
  MapPin,
  FileCheck,
  Award,
  KeyRound,
  Fingerprint,
  Mail,
  Phone,
  Clock,
} from "lucide-react";

export default function ProfilePage() {
  const { user, activeRole, logout } = useAuth();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#171716] text-[#fffdf8] flex items-center justify-center text-2xl font-black shadow-sm">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#171716]">
                {user.name}
              </h1>
              <Badge variant="civic">{user.role}</Badge>
            </div>
            <p className="text-xs text-[#68655e] font-medium">
              {user.designation} • {user.department}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={logout} className="text-rose-600 border-rose-200 hover:bg-rose-50">
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Official Credentials & Jurisdiction */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>Jurisdiction Scope</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="bg-[#f4f1ea] border-[#d8d3c9] p-3 rounded-lg border space-y-1">
                <p className="text-[#68655e] text-[10px] uppercase font-bold">Administrative Level</p>
                <p className="font-bold text-[#171716]">
                  {user.jurisdiction.level}
                </p>
              </div>

              {user.jurisdiction.stateName && (
                <div className="bg-[#f4f1ea] border-[#d8d3c9] p-3 rounded-lg border space-y-1">
                  <p className="text-[#68655e] text-[10px] uppercase font-bold">State Territory</p>
                  <p className="font-semibold text-[#171716]">
                    {user.jurisdiction.stateName} ({user.jurisdiction.stateCode || "IN"})
                  </p>
                </div>
              )}

              {user.jurisdiction.districtName && (
                <div className="bg-[#f4f1ea] border-[#d8d3c9] p-3 rounded-lg border space-y-1">
                  <p className="text-[#68655e] text-[10px] uppercase font-bold">District / Taluk</p>
                  <p className="font-semibold text-[#171716]">
                    {user.jurisdiction.districtName}
                  </p>
                </div>
              )}

              <div className="pt-2">
                <p className="text-[11px] text-[#68655e] leading-relaxed">
                  Data access and authorization rules are strictly filtered based on this geographic scope.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Digital Signature Certificate (DSC) Status */}
          <Card className="border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Class-3 DSC / e-Sign</span>
                </CardTitle>
                <Badge variant="success" className="text-[10px]">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
              <p>Issuer: National Informatics Centre CA (NICCA)</p>
              <p>Serial: 4F9B-2026-BHOOMI-09A</p>
              <p className="text-[10px] text-emerald-600">Valid until: 31 Dec 2026</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Officer Details & Statutory Powers */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Official Profile Details</CardTitle>
              <CardDescription className="text-xs">
                Verified administrative identity in the National Land Acquisition Portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[#68655e]">Full Name</label>
                  <Input value={user.name} readOnly className="bg-[#f4f1ea] text-xs h-9" />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#68655e]">Official Email</label>
                  <Input value={user.email} readOnly className="bg-[#f4f1ea] text-xs h-9" />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#68655e]">Designation</label>
                  <Input value={user.designation} readOnly className="bg-[#f4f1ea] text-xs h-9" />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#68655e]">Department / Ministry</label>
                  <Input value={user.department} readOnly className="bg-[#f4f1ea] text-xs h-9" />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#68655e] mb-3">
                  Statutory Delegations & Powers
                </h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border bg-[#f4f1ea] border-[#d8d3c9] text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#171716]">
                        RFCTLARR Act 2013 Statutory Signoff
                      </p>
                      <p className="text-[11px] text-[#68655e]">
                        Authorized to review Section 4 notifications & Section 23 awards.
                      </p>
                    </div>
                    <Badge variant="civic">Authorized</Badge>
                  </div>

                  <div className="p-3 rounded-lg border bg-[#f4f1ea] border-[#d8d3c9] text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#171716]">
                        PFMS Direct Benefit Transfer Approver
                      </p>
                      <p className="text-[11px] text-[#68655e]">
                        Level-2 Treasury signatory for compensation batches up to ₹500 Crores.
                      </p>
                    </div>
                    <Badge variant="success">Level 2</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
