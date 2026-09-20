"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Download,
  Smartphone,
  CheckCheck,
} from "lucide-react";
import { offlineSyncQueue, OfflineQueueItem } from "@/lib/offline-sync-queue";

interface SyncStatusIndicatorProps {
  isOnline: boolean;
  onToggleOnline: () => void;
  onSyncComplete?: () => void;
  canInstall?: boolean;
  onInstall?: () => void;
}

export function SyncStatusIndicator({
  isOnline,
  onToggleOnline,
  onSyncComplete,
  canInstall,
  onInstall,
}: SyncStatusIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const refreshQueue = () => {
    setQueue(offlineSyncQueue.getQueue());
  };

  useEffect(() => {
    refreshQueue();
    const interval = setInterval(refreshQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  const pendingItems = queue.filter((i) => i.status === "QUEUED" || i.status === "FAILED");
  const syncedItems = queue.filter((i) => i.status === "SYNCED");

  const handleSyncAll = async () => {
    if (!isOnline) {
      onToggleOnline(); // Turn online automatically when initiating cloud push
    }
    setIsSyncing(true);
    setSyncProgress(10);

    await offlineSyncQueue.syncAll(() => {
      refreshQueue();
      setSyncProgress((prev) => Math.min(prev + 40, 95));
    });

    setSyncProgress(100);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncProgress(0);
      refreshQueue();
      if (onSyncComplete) onSyncComplete();
    }, 600);
  };

  const handleClearSynced = () => {
    offlineSyncQueue.clearSynced();
    refreshQueue();
  };

  const handleRemoveItem = (id: string) => {
    offlineSyncQueue.remove(id);
    refreshQueue();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* PWA Install Button if available */}
        {canInstall && (
          <Button
            size="sm"
            variant="outline"
            onClick={onInstall}
            className="h-8 text-xs bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-300 hover:bg-amber-100 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-amber-600" />
            <span className="font-semibold">Install PWA App</span>
          </Button>
        )}

        {/* Online/Offline Status Pill */}
        <button
          onClick={onToggleOnline}
          title="Click to toggle Online/Offline simulation"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-200 shadow-sm cursor-pointer"
          style={{
            borderColor: isOnline ? "#10b981" : "#f59e0b",
            backgroundColor: isOnline ? "rgba(6, 78, 59, 0.9)" : "rgba(120, 53, 15, 0.9)",
            color: isOnline ? "#a7f3d0" : "#fde68a",
          }}
        >
          {isOnline ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="h-3.5 w-3.5" />
              <span className="font-bold">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-bold">Offline Mode</span>
            </>
          )}
        </button>

        {/* Sync Queue Manager Trigger Pill */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            refreshQueue();
            setIsOpen(true);
          }}
          className={`h-8 text-xs flex items-center gap-1.5 font-medium border ${
            pendingItems.length > 0
              ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300 hover:bg-amber-500/20"
              : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-blue-600" : ""}`} />
          <span>Queue</span>
          <Badge
            variant={pendingItems.length > 0 ? "warning" : "secondary"}
            className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-mono"
          >
            {pendingItems.length}
          </Badge>
        </Button>
      </div>

      {/* Queue Details Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-[#171716]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#d8d3c9]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#ef5b2a]/10 text-[#ef5b2a]">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#171716]">
                    Offline Sync Queue (IndexedDB / LocalStore)
                  </h3>
                  <p className="text-xs text-[#68655e]">
                    Field records captured offline awaiting cloud reconciliation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#68655e] hover:text-[#171716] p-1.5 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {/* Network Simulator Banner */}
            <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-emerald-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-600" />
                )}
                <div>
                  <span className="font-semibold block text-[#171716]">
                    Network: {isOnline ? "Connected (High-Speed Cellular)" : "Disconnected (Field Deadzone)"}
                  </span>
                  <span className="text-[11px] text-[#68655e]">
                    {isOnline
                      ? "Records push immediately to NIC Land Central Server"
                      : "Records securely encrypted in local device memory"}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleOnline}
                className="h-7 text-xs border-[#d8d3c9] bg-[#fffdf8] text-[#171716] hover:bg-[#f4f1ea]"
              >
                {isOnline ? "Simulate Offline" : "Connect"}
              </Button>
            </div>

            {/* Progress Bar during Sync */}
            {isSyncing && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#ef5b2a] font-semibold">
                  <span>Pushing encrypted field records to Central NIC Hub...</span>
                  <span>{syncProgress}%</span>
                </div>
                <div className="w-full bg-[#eae6dc] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#ef5b2a] h-2 transition-all duration-300"
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[180px] max-h-[300px]">
              {queue.length === 0 ? (
                <div className="text-center py-8 text-[#68655e] space-y-2">
                  <CheckCheck className="h-10 w-10 mx-auto text-emerald-600 opacity-60" />
                  <p className="text-xs font-semibold text-[#171716]">Offline Queue is completely clear!</p>
                  <p className="text-[11px] text-[#68655e]">All survey demarcations and evidence photos are synced.</p>
                </div>
              ) : (
                queue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-[#d8d3c9] bg-[#fffdf8] text-xs space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            item.status === "SYNCED"
                              ? "success"
                              : item.status === "SYNCING"
                              ? "default"
                              : "warning"
                          }
                          className="text-[10px] font-semibold"
                        >
                          {item.status}
                        </Badge>
                        <span className="font-semibold text-[#171716]">
                          {item.title}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-[#68655e] hover:text-rose-600 p-1 rounded"
                        title="Delete Record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-[#68655e]">
                      <span>
                        ULPIN: <strong className="font-mono text-[#ef5b2a]">{item.ulpin}</strong>
                      </span>
                      <span>Khasra: <strong className="text-[#171716]">#{item.surveyNo}</strong></span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.timestamp}
                      </span>
                    </div>

                    {item.payload?.gps && (
                      <div className="text-[10px] font-mono bg-[#f4f1ea] p-1.5 rounded text-[#171716] border border-[#d8d3c9]">
                        GPS: {item.payload.gps.lat?.toFixed(4)}° N, {item.payload.gps.lng?.toFixed(4)}° E (±{item.payload.gps.accuracy}m)
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-[#d8d3c9] flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSynced}
                disabled={syncedItems.length === 0}
                className="text-xs h-8 border-[#d8d3c9] bg-[#fffdf8] text-[#171716] hover:bg-[#f4f1ea]"
              >
                Clear Synced ({syncedItems.length})
              </Button>

              <Button
                size="sm"
                onClick={handleSyncAll}
                disabled={isSyncing || pendingItems.length === 0}
                className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold text-xs h-8 flex items-center gap-1.5 rounded-full"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-[#ef5b2a]" : ""}`} />
                <span>Sync {pendingItems.length} Pending Now</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
