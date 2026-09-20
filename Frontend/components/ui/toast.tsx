"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Gavel,
  ShieldCheck,
  X,
} from "lucide-react";
import { useToast, ToastItem } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[9999] flex max-h-screen w-full max-w-sm flex-col-reverse gap-2 pointer-events-none p-4 sm:p-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </aside>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const variantStyles = {
    default: "bg-[#171716] text-[#fffdf8] border-[#3a3935]",
    success: "bg-[#064e3b] text-[#ecfdf5] border-[#047857]",
    error: "bg-[#881337] text-[#ffe4e6] border-[#be123c]",
    warning: "bg-[#78350f] text-[#fef3c7] border-[#b45309]",
    info: "bg-[#1e293b] text-[#f1f5f9] border-[#334155]",
    jurisdiction: "bg-[#451a03] text-[#ffedd5] border-[#c2410c]", // Warm terracotta/saffron for statutory limits
    idempotent: "bg-[#0c4a6e] text-[#e0f2fe] border-[#0284c7]", // Deep ocean cyan for PFMS / idempotency locks
  };

  const variantIcons = {
    default: <Info className="h-4 w-4 text-slate-300" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-300" />,
    error: <AlertCircle className="h-4 w-4 text-rose-300" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-300" />,
    info: <Info className="h-4 w-4 text-sky-300" />,
    jurisdiction: <Gavel className="h-4 w-4 text-amber-400" />,
    idempotent: <ShieldCheck className="h-4 w-4 text-cyan-300" />,
  };

  const currentVariant = toast.variant || "default";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "pointer-events-auto relative w-full overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-md",
        variantStyles[currentVariant]
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          {variantIcons[currentVariant]}
        </div>

        <div className="flex-1 space-y-1 pr-4">
          <p className="text-xs font-bold leading-none tracking-tight">
            {toast.title}
          </p>
          {toast.description && (
            <p className="text-[11px] opacity-90 leading-relaxed">
              {toast.description}
            </p>
          )}

          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
              className="mt-2 text-[11px] font-bold underline hover:opacity-80 transition-opacity block"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-1 focus:ring-white"
          aria-label="Close notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Subtle bottom statutory strip */}
      {currentVariant === "jurisdiction" && (
        <div className="mt-2 pt-1.5 border-t border-amber-600/40 flex items-center justify-between text-[10px] text-amber-300/80 font-mono">
          <span>RFCTLARR Act 2013 § 3(g)</span>
          <span>REVENUE JURISDICTION</span>
        </div>
      )}

      {currentVariant === "idempotent" && (
        <div className="mt-2 pt-1.5 border-t border-cyan-600/40 flex items-center justify-between text-[10px] text-cyan-200/80 font-mono">
          <span>PFMS / eGazette Audit Lock</span>
          <span>REPLAY PREVENTED</span>
        </div>
      )}
    </motion.div>
  );
}
