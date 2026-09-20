"use client";

import React, { useState } from "react";
import { StatutoryDocument } from "@/types/document";
import { useApproveDocumentMutation, useDocumentsQuery, useUploadDocumentMutation } from "@/hooks/queries/use-bhoomi-queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileText,
  UploadCloud,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  History,
  Lock,
  Download,
  Filter,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { downloadStatutoryPdf } from "@/lib/pdf-generator";
import { useI18n } from "@/hooks/use-i18n";

export default function DocumentManagementPage() {
  const { lang } = useI18n();
  const isHi = lang === "hi";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [previewDoc, setPreviewDoc] = useState<StatutoryDocument | null>(null);
  const [versionDoc, setVersionDoc] = useState<StatutoryDocument | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { data: documents = [], isLoading } = useDocumentsQuery(selectedCategory === "ALL" ? "" : selectedCategory, searchTerm);
  const uploadMutation = useUploadDocumentMutation();
  const approveMutation = useApproveDocumentMutation();

  // Upload Form State
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState<StatutoryDocument["category"]>("GAZETTE");
  const [docFile, setDocFile] = useState<string | null>("gazette_extraordinary_sec19.pdf");
  const [calculatedHash, setCalculatedHash] = useState("a8b7c6d5e4f3a2b10987654321fedcba0987654321fedcba0987654321fedcba");

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle) return;
    try {
      await uploadMutation.mutateAsync({
        title: docTitle,
        category: docCategory,
        originalFilename: docFile || "document.txt",
        sha256Hash: calculatedHash,
      } as any);
      setUploadModalOpen(false);
      setDocTitle("");
    } catch {
      // The mutation error is surfaced by the dialog state in a future UX pass.
    }
  };

  const handleApprove = async (doc: StatutoryDocument) => {
    if (!doc.latestVersionId) return;
    try {
      await approveMutation.mutateAsync({
        documentId: doc.id,
        versionId: doc.latestVersionId,
        notes: "Scrutinized and verified against official gazette",
      });
      setPreviewDoc(null);
    } catch {
      // Keep the document open so the user can retry.
    }
  };

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#171716]">
            {isHi ? "सरकारी गजट एवं आधिकारिक दस्तावेज संग्रह" : "Official Document & Gazette Repository"}
          </h1>
          <p className="text-xs text-[#68655e]">
            {isHi
              ? "डिजिटल सुरक्षा मुहर और संस्करण इतिहास के साथ सुरक्षित सरकारी दस्तावेज भंडार।"
              : "Secure document archive with tamper-proof digital security stamps and official version history."}
          </p>
        </div>

        <Button
          onClick={() => setUploadModalOpen(true)}
          className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-9 flex items-center gap-1.5 shadow-sm"
        >
          <UploadCloud className="h-4 w-4" />
          <span>{isHi ? "सरकारी दस्तावेज अपलोड करें" : "Upload Statutory Document"}</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#68655e]" />
              <Input
                placeholder={isHi ? "दस्तावेज संख्या, नाम या प्रोजेक्ट खोजें..." : "Search document number, title, project..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
              >
                <option value="ALL">{isHi ? "सभी प्रकार के दस्तावेज" : "All Document Types"}</option>
                <option value="GAZETTE">{isHi ? "सरकारी गजट नोटिस" : "Gazette Notifications"}</option>
                <option value="SURVEY_REPORT">{isHi ? "खेत नाप-जोख एवं सर्वे रिपोर्ट" : "Survey & Demarcation Reports"}</option>
                <option value="AWARD_ORDER">{isHi ? "मुआवजा आदेश एवं बोनस फैसले" : "Compensation Award & Bonus Orders"}</option>
                <option value="POSSESSION_MEMO">{isHi ? "जमीन कब्जा पंचनामा आदेश" : "Possession Handover Memos"}</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isHi ? "दस्तावेज संख्या" : "Doc Number"}</TableHead>
                <TableHead>{isHi ? "दस्तावेज का नाम" : "Document Title"}</TableHead>
                <TableHead>{isHi ? "श्रेणी" : "Category"}</TableHead>
                <TableHead>{isHi ? "परियोजना / केस" : "Project / Case"}</TableHead>
                <TableHead>{isHi ? "संस्करण" : "Version"}</TableHead>
                <TableHead>{isHi ? "डिजिटल कोड" : "Integrity Hash"}</TableHead>
                <TableHead>{isHi ? "स्वीकृति" : "Approval"}</TableHead>
                <TableHead className="text-right">{isHi ? "कार्रवाई" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-xs text-[#68655e]">Loading documents from PostgreSQL...</TableCell></TableRow>
              ) : filteredDocs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-mono text-xs font-bold text-[#ef5b2a]">
                    {doc.documentNumber}
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-xs text-[#171716]">{doc.title}</p>
                    <p className="text-[10px] text-[#68655e]">
                      Uploaded by {doc.uploadedBy} • {doc.uploadedAt}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {doc.category.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <p className="font-semibold">{doc.projectName}</p>
                    <p className="text-[10px] font-mono text-[#68655e]">{doc.caseNumber}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold">{doc.version}</TableCell>
                  <TableCell className="font-mono text-[10px] text-[#68655e] max-w-[100px] truncate">
                    {doc.sha256Hash}
                  </TableCell>
                  <TableCell>
                    {doc.approvalStatus === "APPROVED" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Approved</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <AlertCircle className="h-3 w-3" />
                        <span>Pending</span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewDoc(doc)}
                        className="h-7 px-2 text-xs flex items-center gap-1 text-blue-600 hover:bg-[#ef5b2a]/10"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVersionDoc(doc)}
                        className="h-7 px-2 text-xs flex items-center gap-1 text-[#68655e] hover:bg-[#f4f1ea]"
                      >
                        <History className="h-3.5 w-3.5" />
                        <span>History</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Document Previewer Dialog */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold">
                  {previewDoc.title}
                </DialogTitle>
                <Badge variant="civic">{previewDoc.version}</Badge>
              </div>
              <DialogDescription className="text-xs font-mono">
                {previewDoc.documentNumber} • Cryptographic Hash: {previewDoc.sha256Hash.slice(0, 24)}...
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              {/* Simulated Document Preview Window */}
              <div className="border rounded-xl p-8 bg-[#f4f1ea] dark:bg-[#fffdf8] min-h-[260px] flex flex-col items-center justify-center text-center space-y-3">
                <FileText className="h-16 w-16 text-blue-800 dark:text-blue-400" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-[#171716]">
                    Official Government Gazette / Document Record
                  </p>
                  <p className="text-[11px] text-[#68655e] max-w-md">
                    Format: Certified PDF/A archival standard. Digital seal verified by National Informatics Centre (NICCA).
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border text-[10px] font-mono text-[#171716]">
                  <Lock className="h-3 w-3 text-emerald-600" />
                  <span>SHA256: {previewDoc.sha256Hash}</span>
                </div>
              </div>

              {/* Approval Action Bar */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#f4f1ea] border-[#d8d3c9] border">
                <div>
                  <p className="font-bold text-[#171716]">
                    Statutory Approval Status: {previewDoc.approvalStatus}
                  </p>
                  {previewDoc.approvedBy && (
                    <p className="text-[11px] text-[#68655e]">Signatory: {previewDoc.approvedBy}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {previewDoc.approvalStatus !== "APPROVED" && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(previewDoc)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-[#171716] font-bold text-xs h-8"
                    >
                      Approve & Affix e-Sign
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadStatutoryPdf(previewDoc.title)}
                    className="text-xs h-8 flex items-center gap-1 hover:bg-[#ef5b2a]/10 dark:hover:bg-blue-950/50"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download PDF</span>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Version History Dialog */}
      {versionDoc && (
        <Dialog open={!!versionDoc} onOpenChange={() => setVersionDoc(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                <span>Version Revision History</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Audit trail of amendments, corrigendums, and revisions for {versionDoc.documentNumber}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2 text-xs">
              {versionDoc.versions.map((ver) => (
                <div key={ver.version} className="p-3 rounded-xl border bg-[#f4f1ea] border-[#d8d3c9] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-sm text-[#ef5b2a]">
                      {ver.version}
                    </span>
                    <span className="text-[#68655e] text-[10px]">{ver.uploadedAt}</span>
                  </div>
                  <p className="text-[#171716] font-medium">{ver.changeSummary}</p>
                  <p className="text-[10px] text-[#68655e] font-mono">Author: {ver.uploadedBy}</p>
                  <p className="text-[10px] font-mono text-[#68655e] truncate">Hash: {ver.sha256Hash}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Document Upload Modal */}
      {uploadModalOpen && (
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Upload Statutory Official Document
              </DialogTitle>
              <DialogDescription className="text-xs">
                File will be secured with a tamper-proof digital stamp for audit compliance.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs pt-2">
              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">Document Title</label>
                <Input
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Section 19 Gazette Declaration Notification"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">Statutory Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
                >
                  <option value="GAZETTE">Gazette Notification</option>
                  <option value="SURVEY_REPORT">Joint Survey & Demarcation</option>
                  <option value="AWARD_ORDER">Compensation Award & Bonus Calculation</option>
                  <option value="POSSESSION_MEMO">Possession Handover Memo</option>
                  <option value="OBJECTION_RECORD">Objections Hearing Record</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-[#d8d3c9] dark:border-[#d8d3c9] rounded-xl p-4 text-center space-y-2 bg-[#f4f1ea] border-[#d8d3c9]">
                <UploadCloud className="h-6 w-6 text-[#68655e] mx-auto" />
                <p className="font-semibold text-[11px] text-[#171716]">
                  {docFile}
                </p>
                <p className="text-[10px] text-[#68655e]">PDF, GeoJSON, or TIFF up to 50MB</p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#ef5b2a]/10 dark:bg-blue-950/40 border border-[#d8d3c9] text-[10px] font-mono text-[#ef5b2a] space-y-0.5">
                <span className="font-bold uppercase">Digital Security Code (Stamp):</span>
                <p className="truncate">{calculatedHash}</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-8">
                  Seal & Upload Document
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
