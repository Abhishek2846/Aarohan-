"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useNotifications } from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  MapPin,
  AlertTriangle,
  Trash2,
  X,
} from "lucide-react";

export function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const {
    notifications,
    unreadCount,
    isConnected,
    hasNewIncoming,
    markAsRead,
    markAllAsRead,
    clearAll,
    simulatePush,
  } = useNotifications();

  const filtered = notifications.filter((n) => {
    if (filterCategory === "ALL") return true;
    return n.category === filterCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "STATUTORY_DEADLINE":
        return <Clock className="h-4 w-4 text-rose-600" />;
      case "FINANCIAL_PFMS":
        return <CreditCard className="h-4 w-4 text-emerald-600" />;
      case "FIELD_GIS":
        return <MapPin className="h-4 w-4 text-blue-600" />;
      case "AUDIT_COMPLIANCE":
        return <ShieldCheck className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-[#ef5b2a]" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return <Badge variant="danger" className="text-[9px] px-1.5 py-0">Critical</Badge>;
      case "HIGH":
        return <Badge variant="warning" className="text-[9px] px-1.5 py-0">High Priority</Badge>;
      case "SUCCESS":
        return <Badge variant="success" className="text-[9px] px-1.5 py-0">Settled</Badge>;
      default:
        return <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Update</Badge>;
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-[#68655e] hover:text-[#171716] hover:bg-[#eae6dc] transition-colors"
        title="Notifications & Statutory Event Stream"
      >
        <Bell className={`h-5 w-5 ${hasNewIncoming ? "animate-bounce text-[#ef5b2a]" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ef5b2a] text-[10px] font-bold text-white shadow-sm ring-2 ring-[#fffdf8]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 sm:w-[420px] bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
          {/* Top Header */}
          <div className="p-4 border-b border-[#d8d3c9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/30">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#171716]">
                  Statutory Notifications & Telemetry
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] text-[#68655e]">
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                        isConnected ? "bg-emerald-400" : "bg-amber-400"
                      } opacity-75`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isConnected ? "bg-emerald-600" : "bg-amber-600"
                      }`}
                    />
                  </span>
                  <span>{isConnected ? "WebSocket Live: Connected" : "Reconnecting..."}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-[#68655e] hover:text-[#171716] rounded-lg hover:bg-[#eae6dc]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Evaluator Action Bar */}
          <div className="bg-[#f4f1ea] px-3 py-2 border-b border-[#d8d3c9] flex items-center justify-between text-xs">
            <Button
              size="sm"
              variant="outline"
              onClick={simulatePush}
              className="h-6 text-[11px] bg-[#fffdf8] border-[#d8d3c9] text-[#171716] hover:bg-[#eae6dc] flex items-center gap-1 font-semibold rounded-full"
            >
              <Sparkles className="h-3 w-3 text-[#ef5b2a]" />
              <span>Simulate Live Event</span>
            </Button>

            <div className="flex items-center gap-2 text-[11px]">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[#ef5b2a] hover:underline font-bold"
                >
                  Mark read
                </button>
              )}
              <button
                onClick={clearAll}
                className="text-[#68655e] hover:text-rose-600 flex items-center gap-0.5 transition-colors"
                title="Clear all notifications"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-[#d8d3c9] overflow-x-auto text-[11px]">
            {["ALL", "STATUTORY_DEADLINE", "FINANCIAL_PFMS", "FIELD_GIS", "AUDIT_COMPLIANCE"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-all font-semibold ${
                    filterCategory === cat
                      ? "bg-[#171716] text-[#fffdf8] shadow-sm"
                      : "bg-[#eae6dc] text-[#68655e] hover:bg-[#d8d3c9] hover:text-[#171716]"
                  }`}
                >
                  {cat === "ALL"
                    ? "All"
                    : cat === "STATUTORY_DEADLINE"
                    ? "Deadlines"
                    : cat === "FINANCIAL_PFMS"
                    ? "PFMS"
                    : cat === "FIELD_GIS"
                    ? "GIS"
                    : "Audit"}
                </button>
              )
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#d8d3c9]/60 max-h-[380px]">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-[#68655e] text-xs space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto opacity-70" />
                <p className="font-bold text-[#171716]">No notifications in this category</p>
                <p className="text-[11px]">All statutory SLAs and PFMS settlements are up to date.</p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`p-3.5 transition-colors cursor-pointer space-y-1.5 ${
                    item.read
                      ? "bg-transparent hover:bg-[#f4f1ea]/80 opacity-75"
                      : "bg-[#ef5b2a]/[0.05] hover:bg-[#ef5b2a]/[0.08]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {getCategoryIcon(item.category)}
                      <span className="font-bold text-xs text-[#171716]">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getSeverityBadge(item.severity)}
                      {!item.read && <span className="h-1.5 w-1.5 rounded-full bg-[#ef5b2a]" />}
                    </div>
                  </div>

                  <p className="text-[11px] text-[#68655e] leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#68655e] pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.timestamp}
                    </span>

                    {item.actionUrl && (
                      <Link
                        href={item.actionUrl}
                        onClick={() => setIsOpen(false)}
                        className="text-[#ef5b2a] hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>{item.actionLabel || "View Details"}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
