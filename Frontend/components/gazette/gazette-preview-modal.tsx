"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Printer,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  FileText,
  Calendar,
  Building,
  UserCheck,
  Copy,
  Check,
} from "lucide-react";
import QRCode from "qrcode";
import { GazetteNotice } from "@/types/gazette";
import { generateGazettePdf } from "@/lib/gazette-pdf-generator";

interface GazettePreviewModalProps {
  notice: GazetteNotice | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GazettePreviewModal({ notice, isOpen, onClose }: GazettePreviewModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (notice) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const verifyUrl = `${baseUrl}/verify/gazette?ref=${encodeURIComponent(notice.gazetteReference || notice.noticeNumber)}`;
      QRCode.toDataURL(verifyUrl, { width: 140, margin: 1 }).then(setQrCodeUrl).catch(console.error);
    }
  }, [notice]);

  if (!notice) return null;

  const handleCopyHash = () => {
    if (notice.sha256Hash) {
      navigator.clipboard.writeText(notice.sha256Hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const blob = await generateGazettePdf(notice);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eGazette_${notice.gazetteReference || notice.noticeNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const content = notice.bilingualContent;
  const schedule = notice.cadastralSchedule || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border border-slate-300 shadow-2xl bg-[#FAFAF8] dark:bg-slate-950">
        {/* Sticky Action Toolbar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-slate-900 text-white border-b border-slate-800 shadow-md">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <div>
              <span className="font-serif font-bold tracking-wide text-sm">Official e-Gazette Document Viewer</span>
              <span className="ml-2 text-xs text-slate-400">eGazette.gov.in Statutory Mirror</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-slate-200 border-slate-700 hover:bg-slate-800 text-xs gap-1"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1.5 shadow"
            >
              <Download className="h-3.5 w-3.5" />
              {isGeneratingPdf ? "Generating PDF..." : "Download Official PDF"}
            </Button>
          </div>
        </div>

        {/* Gazette Paper Texture Wrapper */}
        <div className="p-8 font-serif text-slate-900 dark:text-slate-100 max-w-3xl mx-auto my-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-lg rounded-sm">
          {/* Top National Header */}
          <div className="text-center border-b-2 border-slate-900 dark:border-slate-400 pb-4 mb-4">
            <div className="text-xs uppercase tracking-widest font-sans font-semibold text-slate-600 dark:text-slate-400 mb-1">
              असाधारण / EXTRAORDINARY
            </div>
            <div className="text-xs font-sans text-slate-500 mb-2">
              भाग II — खण्ड 3 — उप-खण्ड (ii) / PART II — Section 3 — Sub-section (ii)
            </div>
            <div className="text-2xl font-bold tracking-wide uppercase font-serif text-slate-900 dark:text-white">
              भारत का राजपत्र
            </div>
            <div className="text-xl font-bold tracking-wide uppercase font-serif text-slate-900 dark:text-white">
              The Gazette of India
            </div>
            <div className="text-xs uppercase font-sans tracking-wider font-semibold text-slate-600 dark:text-slate-400 mt-2">
              प्राधिकार से प्रकाशित / PUBLISHED BY AUTHORITY
            </div>

            {/* Registration & Volume Bar */}
            <div className="flex justify-between items-center text-xs font-sans border-t border-b border-slate-300 dark:border-slate-700 py-1.5 mt-3 text-slate-700 dark:text-slate-300">
              <div>
                <strong>REGD. NO.:</strong> {notice.gazetteReference || "DL-ND-01-2026-PENDING"}
              </div>
              <div>
                <strong>ISSN:</strong> 0970-4205
              </div>
            </div>
            <div className="flex justify-between items-center text-xs font-sans pt-1 text-slate-600 dark:text-slate-400">
              <span>{notice.gazetteVolumeIssue || "Extraordinary Press Release"}</span>
              <span>{notice.publishedOn ? `Date: ${notice.publishedOn}` : "Draft Stage Notice"}</span>
            </div>
          </div>

          {/* Sponsoring Ministry & Statutory Stage Title */}
          <div className="text-center my-5">
            <h3 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {content?.ministry_hindi || "सड़क परिवहन एवं राजमार्ग मंत्रालय"}
            </h3>
            <h4 className="text-sm font-semibold uppercase text-slate-700 dark:text-slate-300">
              {content?.ministry_english || "Ministry of Road Transport and Highways"}
            </h4>
            <div className="inline-block mt-3 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded text-xs font-sans font-semibold text-amber-900 dark:text-amber-200">
              अधिसूचना / STATUTORY NOTIFICATION: {notice.sectionReference}
            </div>
          </div>

          {/* Quick Notice Metadata Card with Live QR Code */}
          <div className="flex items-center justify-between p-4 my-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md font-sans">
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Notice Number:</span>{" "}
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{notice.noticeNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Project:</span>{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{notice.projectTitle}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Competent Authority (CALA):</span>{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">{content?.competent_authority_english}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Jurisdiction:</span>{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">{notice.district}, {notice.state}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Statutory Act:</span>{" "}
                <span className="font-medium text-slate-800 dark:text-slate-200">RFCTLARR Act, 2013 (Act No. 30 of 2013)</span>
              </div>
            </div>

            {qrCodeUrl && (
              <div className="text-center pl-4 border-l border-slate-200 dark:border-slate-700">
                <img src={qrCodeUrl} alt="Gazette SHA-256 QR Verification" className="w-24 h-24 mx-auto border border-slate-300 rounded" />
                <span className="text-[10px] text-slate-500 tracking-tight block mt-1">Scan for Audit Trail</span>
              </div>
            )}
          </div>

          {/* Side-by-Side or Stacked Bilingual Content */}
          <div className="my-6 space-y-6">
            {/* English Section */}
            <div className="border-l-4 border-blue-600 pl-4 py-1">
              <h5 className="font-sans font-bold text-xs uppercase text-blue-700 dark:text-blue-400 mb-1">
                Official Gazette Notification (English)
              </h5>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 leading-snug">
                {content?.english_title}
              </h4>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 text-justify whitespace-pre-line">
                {content?.english_body}
              </p>
            </div>

            {/* Hindi Section */}
            <div className="border-l-4 border-emerald-600 pl-4 py-1">
              <h5 className="font-sans font-bold text-xs uppercase text-emerald-700 dark:text-emerald-400 mb-1">
                वैधानिक राजपत्र अधिसूचना (हिन्दी)
              </h5>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 leading-snug font-hindi">
                {content?.hindi_title}
              </h4>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 text-justify whitespace-pre-line font-hindi">
                {content?.hindi_body}
              </p>
            </div>
          </div>

          {/* Special Section 23/30 Statutory Solatium Box */}
          {notice.sectionReference === "SECTION_23_30" && (
            <div className="p-4 my-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded font-sans text-xs">
              <div className="font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Statutory Compensation & Solatium Determination (Sections 23 & 30)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 dark:text-slate-300">
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-emerald-200">
                  <div className="text-[10px] text-slate-500">Statutory Solatium</div>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">100% Guaranteed</div>
                  <div className="text-[10px] text-slate-500">u/s 30(1) on Market Value</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-emerald-200">
                  <div className="text-[10px] text-slate-500">Statutory Interest</div>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">12% p.a.</div>
                  <div className="text-[10px] text-slate-500">From sec 11 to award date</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-emerald-200">
                  <div className="text-[10px] text-slate-500">Rural Multiplier</div>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">1.25x Factor</div>
                  <div className="text-[10px] text-slate-500">First Schedule rules</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-emerald-200">
                  <div className="text-[10px] text-slate-500">Income Tax Status</div>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">100% Tax Exempt</div>
                  <div className="text-[10px] text-slate-500">Section 96 statutory shield</div>
                </div>
              </div>
            </div>
          )}

          {/* Cadastral Schedule Table */}
          <div className="my-6">
            <h5 className="font-sans font-bold text-xs uppercase tracking-wide text-slate-800 dark:text-slate-200 mb-2">
              SCHEDULE OF AFFECTED PARCELS / भू-खंडों की अनुसूची
            </h5>
            <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700">#</th>
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700">ULPIN</th>
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700">Survey No</th>
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700">Village / Taluk</th>
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 text-right">Area (Ha)</th>
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700">Land Use</th>
                    <th className="p-2">Recorded Landholder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                  {schedule.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-mono text-slate-500">{i + 1}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-mono font-medium text-blue-700 dark:text-blue-400">{p.ulpin}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200">{p.survey_no}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-700">{p.village}, {p.taluk}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-700 text-right font-mono font-semibold">{Number(p.extent_ha || 0).toFixed(4)}</td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-700">{p.land_use}</td>
                      <td className="p-2 font-medium text-slate-900 dark:text-slate-100">{p.owner_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatory Seal & Cryptographic Blockchain Box */}
          <div className="mt-8 pt-4 border-t-2 border-slate-300 dark:border-slate-700 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200">
                  {content?.signing_officer?.officerName || "Special Land Acquisition Officer & CALA"}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {content?.signing_officer?.officerDesignation || "Competent Authority for Land Acquisition"}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Digitally Authenticated: {content?.signing_officer?.signedAt || notice.publishedOn || "Official Digital Seal"}
                </div>
              </div>

              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-right max-w-sm">
                <div className="text-[10px] font-mono text-slate-500 flex items-center justify-end gap-1">
                  <span>SHA-256 CRYPTOGRAPHIC PROOF</span>
                  <button onClick={handleCopyHash} className="hover:text-blue-600">
                    {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <div className="font-mono text-[9px] text-slate-700 dark:text-slate-300 break-all">
                  {notice.sha256Hash}
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500 mt-6 border-t border-slate-200 dark:border-slate-800 pt-3">
              Published by the Directorate of Printing, Government of India / State Gazette Authority. Integrated with BhoomiSetu under Section 4 of the Information Technology Act 2000.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
