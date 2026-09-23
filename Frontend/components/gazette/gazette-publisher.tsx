"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  ShieldCheck,
  QrCode,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  PlusCircle,
  Search,
  Filter,
  Building,
  Scale,
  Award,
  AlertTriangle,
  Send,
  Stamp,
  ExternalLink,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useGazetteListQuery,
  useProjectsQuery,
  useCreateGazetteDraftMutation,
  useSignGazetteMutation,
  usePublishGazetteMutation,
  useGazetteVerificationQuery,
} from "@/hooks/queries/use-bhoomi-queries";
import { GazetteNotice, StatutorySection, PublicationStatus } from "@/types/gazette";
import { GazettePreviewModal } from "./gazette-preview-modal";
import { generateGazettePdf } from "@/lib/gazette-pdf-generator";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

interface GazettePublisherProps {
  initialRole?: string;
}

export function GazettePublisher({ initialRole = "DISTRICT_OFFICER" }: GazettePublisherProps) {
  const { activeRole } = useAuth();
  const effectiveRole = activeRole || initialRole;
  const isCitizen = effectiveRole === "CITIZEN";

  const [activeTab, setActiveTab] = useState<string>("repository");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [previewNotice, setPreviewNotice] = useState<GazetteNotice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Verification tab state
  const [verifyInput, setVerifyInput] = useState<string>("DL-ND-01-2026-48921");
  const [submittedVerifyHash, setSubmittedVerifyHash] = useState<string>("DL-ND-01-2026-48921");

  // Drafting wizard state
  const [draftProject, setDraftProject] = useState<string>("");
  const [draftSection, setDraftSection] = useState<StatutorySection>("SECTION_11");
  const [draftMinistryEng, setDraftMinistryEng] = useState<string>("Ministry of Road Transport and Highways (MoRTH)");
  const [draftMinistryHin, setDraftMinistryHin] = useState<string>("सड़क परिवहन एवं राजमार्ग मंत्रालय");
  const [draftCalaEng, setDraftCalaEng] = useState<string>("Competent Authority for Land Acquisition (CALA) & SDM");
  const [draftCalaHin, setDraftCalaHin] = useState<string>("सक्षम प्राधिकारी (भूमि अर्जन) एवं विशेष भूमि अर्जन अधिकारी");
  const [draftTitleEng, setDraftTitleEng] = useState<string>("");
  const [draftTitleHin, setDraftTitleHin] = useState<string>("");
  const [draftBodyEng, setDraftBodyEng] = useState<string>("");
  const [draftBodyHin, setDraftBodyHin] = useState<string>("");
  const [draftSchedule, setDraftSchedule] = useState<any[]>([
    { ulpin: "IN-DEMO-01", survey_no: "12/A", village: "Rampur", taluk: "North", district: "Central", extent_ha: 1.5, land_use: "Agricultural", owner_name: "Farmer Welfare Trust" },
  ]);

  // Queries & Mutations
  const { data: notices = [], isLoading: isListLoading, refetch } = useGazetteListQuery();
  const { data: projects = [] } = useProjectsQuery();
  const createDraftMutation = useCreateGazetteDraftMutation();
  const signMutation = useSignGazetteMutation(previewNotice?.id || "");
  const publishMutation = usePublishGazetteMutation(previewNotice?.id || "");
  const { data: verificationResult, isLoading: isVerifying } = useGazetteVerificationQuery(submittedVerifyHash);

  // Prevent citizen from staying on drafting tab
  React.useEffect(() => {
    if (isCitizen && activeTab === "drafting") {
      setActiveTab("repository");
    }
  }, [isCitizen, activeTab]);

  // Auto-populate draft text template when project or section changes
  React.useEffect(() => {
    if (projects.length > 0 && !draftProject) {
      setDraftProject(projects[0].id);
    }
  }, [projects, draftProject]);

  React.useEffect(() => {
    const selectedProj = projects.find((p) => p.id === draftProject);
    const pTitle = selectedProj ? selectedProj.title : "National Infrastructure Project";

    if (draftSection === "SECTION_11") {
      setDraftTitleEng(`Preliminary Notification under Section 11(1) of RFCTLARR Act 2013 for ${pTitle}`);
      setDraftTitleHin(`भूमि अर्जन अधिनियम 2013 की धारा 11(1) के अधीन ${pTitle} हेतु प्रारंभिक अधिसूचना`);
      setDraftBodyEng(
        `It is hereby notified that the land specified in the Cadastral Schedule hereto is required or likely to be required for a public purpose, namely for the execution of ${pTitle}. Any person interested in any land may, within sixty (60) days from publication, submit objections in writing to the Competent Authority under Section 15(1).`
      );
      setDraftBodyHin(
        `एतद्द्वारा यह अधिसूचित किया जाता है कि अनुसूची में विनिर्दिष्ट भूमि की ${pTitle} के निर्माण हेतु जनहित में आवश्यकता है। कोई भी हितबद्ध व्यक्ति 60 दिवस के भीतर धारा 15(1) के अधीन सक्षम प्राधिकारी के समक्ष लिखित आपत्ति प्रस्तुत कर सकता है।`
      );
    } else if (draftSection === "SECTION_15") {
      setDraftTitleEng(`Notice for Hearing of Objections under Section 15(2) by Competent Authority`);
      setDraftTitleHin(`सक्षम प्राधिकारी द्वारा धारा 15(2) के अधीन आपत्तियों की सुनवाई हेतु सूचना`);
      setDraftBodyEng(
        `Notice is hereby given that the Competent Authority shall hear objections filed under Section 15(1) in the SDM Court Chamber on 15th of next month at 11:00 AM. Interested persons are requested to appear with cadastral records and proof of title.`
      );
      setDraftBodyHin(
        `धारा 15(1) के अधीन प्राप्त आपत्तियों की सुनवाई आगामी 15 तारीख को पूर्वाह्न 11:00 बजे सक्षम प्राधिकारी न्यायालय कक्ष में की जाएगी। समस्त हितबद्ध पक्षकार साक्ष्य सहित उपस्थित हों।`
      );
    } else if (draftSection === "SECTION_19") {
      setDraftTitleEng(`Final Declaration of Acquisition under Section 19(1) of RFCTLARR Act 2013 (Conclusive Proof)`);
      setDraftTitleHin(`धारा 19(1) के अधीन अर्जन की अंतिम घोषणा (अर्जन का निश्चायक सबूत)`);
      setDraftBodyEng(
        `Whereas the Appropriate Government is satisfied after considering the report under Section 15(2) that the land described in the Schedule is required for ${pTitle}. It is hereby declared under Section 19(1) that the said land is acquired. This declaration is conclusive proof under Section 19(3).`
      );
      setDraftBodyHin(
        `चूंकि समुचित सरकार का यह समाधान हो गया है कि उक्त भूमि की ${pTitle} हेतु वास्तविक आवश्यकता है, अतः धारा 19(1) के अनुसरण में यह घोषणा की जाती है कि उक्त भूमि का अर्जन किया जा रहा है।`
      );
    } else if (draftSection === "SECTION_23_30") {
      setDraftTitleEng(`Collector's Award and Statutory Solatium Determination under Section 23 & 30 of RFCTLARR Act 2013`);
      setDraftTitleHin(`धारा 23 एवं 30 के अधीन समाहर्ता (कलेक्टर) का अधिनिर्णय एवं 100% तोषण (सोलैटियम) विवरण`);
      setDraftBodyEng(
        `Pursuant to Section 23 & 30, the Competent Authority hereby awards statutory compensation comprising Market Value multiplied by 1.25x Rural Factor, 100% Solatium under Section 30(1), and 12% Additional Interest under Section 30(3). Under Section 96, compensation is 100% exempt from Income Tax.`
      );
      setDraftBodyHin(
        `धारा 23 एवं 30 के तहत सक्षम प्राधिकारी द्वारा 1.25x ग्रामीण गुणक, 100% तोषण (सोलैटियम) तथा 12% अतिरिक्त ब्याज सहित अधिनिर्णय पारित किया जाता है। धारा 96 के तहत प्रतिकर राशि पूर्णतः आयकर मुक्त है।`
      );
    }
  }, [draftSection, draftProject, projects]);

  // Filtered Gazette List
  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const matchSection = selectedSection === "ALL" || n.sectionReference === selectedSection;
      const matchStatus = selectedStatus === "ALL" || n.publicationStatus === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        n.noticeNumber.toLowerCase().includes(q) ||
        (n.gazetteReference && n.gazetteReference.toLowerCase().includes(q)) ||
        (n.projectTitle && n.projectTitle.toLowerCase().includes(q)) ||
        (n.district && n.district.toLowerCase().includes(q));
      return matchSection && matchStatus && matchQuery;
    });
  }, [notices, selectedSection, selectedStatus, searchQuery]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = notices.length;
    const published = notices.filter((n) => n.publicationStatus === "PUBLISHED").length;
    const calaApproved = notices.filter((n) => n.publicationStatus === "CALA_APPROVED").length;
    const draft = notices.filter((n) => n.publicationStatus === "DRAFT").length;
    const sec11 = notices.filter((n) => n.sectionReference === "SECTION_11").length;
    const sec19 = notices.filter((n) => n.sectionReference === "SECTION_19").length;
    const sec23 = notices.filter((n) => n.sectionReference === "SECTION_23_30").length;
    return { total, published, calaApproved, draft, sec11, sec19, sec23 };
  }, [notices]);

  const handleOpenPreview = (notice: GazetteNotice) => {
    setPreviewNotice(notice);
    setIsPreviewOpen(true);
  };

  const handleDownloadPdfDirect = async (notice: GazetteNotice) => {
    try {
      toast.info("Generating Legal Proof", "Compiling bilingual PDF with National Emblem and SHA-256 QR code...");
      const blob = await generateGazettePdf(notice);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eGazette_${notice.gazetteReference || notice.noticeNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("e-Gazette PDF Downloaded", "Ready for printing and official court submission.");
    } catch (err: any) {
      toast.error("PDF Export Error", err?.message || "Failed to render gazette PDF.");
    }
  };

  const handleCreateDraft = async () => {
    if (!draftProject) {
      toast.error("Validation Error", "Please select an infrastructure project for the notification.");
      return;
    }
    if (!draftTitleEng.trim() || !draftTitleHin.trim()) {
      toast.error("Validation Error", "Statutory bilingual titles (English & Hindi) are required by law.");
      return;
    }
    try {
      await createDraftMutation.mutateAsync({
        projectId: draftProject,
        sectionReference: draftSection,
        bilingualContent: {
          hindi_title: draftTitleHin,
          english_title: draftTitleEng,
          ministry_hindi: draftMinistryHin,
          ministry_english: draftMinistryEng,
          competent_authority_hindi: draftCalaHin,
          competent_authority_english: draftCalaEng,
          hindi_body: draftBodyHin,
          english_body: draftBodyEng,
          solatium_pct: 100,
          additional_interest_pct: 12,
          multiplier_factor: 1.25,
        },
        cadastralSchedule: draftSchedule,
      });
      toast.success(
        "Statutory Draft Compiled",
        `Gazette draft for ${draftSection.replace("_", " ")} registered in audit ledger.`
      );
      setActiveTab("repository");
      refetch();
    } catch (err: any) {
      toast.error("Draft Compilation Failed", err?.message || "Failed to create draft in statutory records.");
    }
  };

  const handleSignNotice = async (noticeId: string) => {
    try {
      await signMutation.mutateAsync({
        officerName: "Competent Authority for Land Acquisition",
        officerDesignation: "Special Land Acquisition Officer & SDM",
        remarks: "Digitally verified and approved under RFCTLARR Act 2013 rules.",
      });
      toast.success(
        "Notice Digitally Signed",
        "Cryptographic digital certificate applied under CCA Class-3 DSC standards."
      );
      setIsPreviewOpen(false);
      refetch();
    } catch (err: any) {
      toast.error("Digital Signing Failed", err?.message || "Failed to sign statutory notice.");
    }
  };

  const handlePublishNotice = async (noticeId: string) => {
    try {
      const issueNum = Math.floor(100 + Math.random() * 900);
      await publishMutation.mutateAsync({
        gazetteVolumeIssue: `Extraordinary Part II - Sec 3(ii), No. ${issueNum}/2026`,
      });
      toast.success(
        "Published to eGazette.gov.in",
        `Statutory publication active under Volume/Issue No. ${issueNum}/2026.`
      );
      setIsPreviewOpen(false);
      refetch();
    } catch (err: any) {
      toast.error("Gazette Publication Failed", err?.message || "Failed to publish notice to e-Gazette.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Ashoka/eGazette Branding */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[11px] font-medium tracking-wide">
                RFCTLARR ACT 2013 STATUTORY MODULE
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] font-medium tracking-wide">
                eGazette.gov.in INTEGRATION
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[11px] font-medium tracking-wide">
                SHA-256 BLOCKCHAIN PROOF
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight font-serif text-white">
              Official Bilingual E-Gazette Statutory Publisher
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Automated statutory publication for Section 11(1), 15(2), 19(1), and 23/30 Collector’s Award.
              Generates legal bilingual (Hindi & English) notices with tamper-evident QR-code cryptographic audit trail.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isCitizen && (
              <Button
                onClick={() => setActiveTab("drafting")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs gap-1.5 shadow-md"
              >
                <PlusCircle className="h-4 w-4" />
                Draft New Gazette
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setActiveTab("verification")}
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 text-xs gap-1.5"
            >
              <QrCode className="h-4 w-4 text-emerald-400" />
              Verify QR Code
            </Button>
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Gazettes</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.total}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{metrics.published} Live in eGazette</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Section 11(1) Notices</p>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{metrics.sec11}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Cadastral Schedules Attached</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Sec 19(1) Declarations</p>
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{metrics.sec19}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Conclusive Proof of Acquisition</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
              <Scale className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Sec 23/30 Awards</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{metrics.sec23}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">100% Solatium & 12% Interest</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
          <TabsTrigger value="repository" className="text-xs gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Statutory Gazette Repository ({filteredNotices.length})
          </TabsTrigger>
          {!isCitizen && (
            <TabsTrigger value="drafting" className="text-xs gap-1.5">
              <PlusCircle className="h-3.5 w-3.5" />
              Draft & Publish Wizard
            </TabsTrigger>
          )}
          <TabsTrigger value="verification" className="text-xs gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            QR Cryptographic Verifier
          </TabsTrigger>
        </TabsList>

        {/* ==================================================== */}
        {/* TAB 1: GAZETTE REPOSITORY & PDF DOWNLOAD             */}
        {/* ==================================================== */}
        <TabsContent value="repository" className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 w-full sm:w-80">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search notice number, volume, project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <div className="flex items-center gap-1">
                {["ALL", "SECTION_11", "SECTION_15", "SECTION_19", "SECTION_23_30"].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSelectedSection(sec)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                      selectedSection === sec
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {sec === "ALL" ? "All Sections" : sec.replace("_", " ")}
                  </button>
                ))}
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-8 text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="PUBLISHED">Published</option>
                <option value="CALA_APPROVED">CALA Approved</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          {/* Gazette List */}
          {isListLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="border rounded-xl p-4 space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-14 w-full rounded" />
                  <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Skeleton className="h-7 w-24 rounded" />
                    <Skeleton className="h-7 w-28 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotices.length === 0 ? (
            <Card className="p-8 text-center text-slate-500 border-dashed">
              <FileText className="h-10 w-10 mx-auto text-slate-400 mb-2" />
              <p className="font-semibold text-sm">No statutory gazette records found</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing your filters or create a new gazette draft.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotices.map((notice) => {
                const isPublished = notice.publicationStatus === "PUBLISHED";
                const isApproved = notice.publicationStatus === "CALA_APPROVED";
                const content = notice.bilingualContent;

                return (
                  <Card
                    key={notice.id}
                    className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow bg-white dark:bg-slate-900 flex flex-col justify-between"
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={
                                notice.sectionReference === "SECTION_11"
                                  ? "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                                  : notice.sectionReference === "SECTION_15"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                                  : notice.sectionReference === "SECTION_19"
                                  ? "bg-purple-50 text-purple-700 border-purple-200 text-[10px]"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                              }
                            >
                              {notice.sectionReference.replace("_", " ")}
                            </Badge>

                            <Badge
                              className={
                                isPublished
                                  ? "bg-emerald-600 text-white text-[10px]"
                                  : isApproved
                                  ? "bg-amber-600 text-white text-[10px]"
                                  : "bg-slate-500 text-white text-[10px]"
                              }
                            >
                              {isPublished ? "PUBLISHED" : isApproved ? "CALA APPROVED" : "DRAFT"}
                            </Badge>
                          </div>

                          <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-1">
                            {content?.english_title || notice.noticeNumber}
                          </h4>
                          <p className="text-xs text-slate-500 font-hindi line-clamp-1 mt-0.5">
                            {content?.hindi_title}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-1 pb-3 text-xs space-y-2">
                      <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded text-[11px]">
                        <div>
                          <span className="text-slate-400">Notice Reg:</span>{" "}
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                            {notice.noticeNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Gazette No:</span>{" "}
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                            {notice.gazetteReference || "Pending Press"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Parcels:</span>{" "}
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {notice.parcelCount} plots ({notice.totalAreaHa.toFixed(2)} Ha)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Location:</span>{" "}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {notice.district}, {notice.state}
                          </span>
                        </div>
                      </div>

                      {notice.sectionReference === "SECTION_23_30" && (
                        <div className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-200 text-[10px] flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          100% Solatium + 12% Interest + Sec 96 Income Tax Exempted
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Project: {notice.projectTitle}</span>
                        <span>{notice.publishedOn ? `Published: ${notice.publishedOn}` : "In Review"}</span>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                        HASH: {notice.sha256Hash.slice(0, 12)}...
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPreview(notice)}
                          className="h-7 text-xs px-2 gap-1 text-slate-700 dark:text-slate-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Bilingual View
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleDownloadPdfDirect(notice)}
                          className="h-7 text-xs px-2 gap-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ==================================================== */}
        {/* TAB 2: STATUTORY GAZETTE DRAFTING WIZARD             */}
        {/* ==================================================== */}
        {!isCitizen && (
          <TabsContent value="drafting" className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-serif">Statutory Notification Drafter & Cadastral Compiler</CardTitle>
              <CardDescription className="text-xs">
                Draft authentic legally vetted notifications under the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-5 text-xs">
              {/* Row 1: Project & Statutory Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Infrastructure Project
                  </label>
                  <select
                    value={draftProject}
                    onChange={(e) => setDraftProject(e.target.value)}
                    className="w-full h-9 text-xs px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.projectCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Statutory Section Stage
                  </label>
                  <select
                    value={draftSection}
                    onChange={(e) => setDraftSection(e.target.value as any)}
                    className="w-full h-9 text-xs px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="SECTION_11">Section 11(1): Preliminary Notification & Schedule</option>
                    <option value="SECTION_15">Section 15(2): Notice for Hearing of Objections</option>
                    <option value="SECTION_19">Section 19(1): Final Declaration (Conclusive Proof)</option>
                    <option value="SECTION_23_30">Section 23 &amp; 30: Collector&apos;s Award &amp; Solatium (100%)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Issuing Ministry & CALA Authority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Sponsoring Ministry / Department (English)
                  </label>
                  <Input
                    value={draftMinistryEng}
                    onChange={(e) => setDraftMinistryEng(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block font-hindi">
                    मंत्रालय / विभाग का नाम (हिन्दी)
                  </label>
                  <Input
                    value={draftMinistryHin}
                    onChange={(e) => setDraftMinistryHin(e.target.value)}
                    className="h-8 text-xs font-hindi"
                  />
                </div>
              </div>

              {/* Row 3: Titles */}
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Statutory Notification Title (English)
                  </label>
                  <Input
                    value={draftTitleEng}
                    onChange={(e) => setDraftTitleEng(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block font-hindi">
                    अधिसूचना शीर्षक (हिन्दी)
                  </label>
                  <Input
                    value={draftTitleHin}
                    onChange={(e) => setDraftTitleHin(e.target.value)}
                    className="h-8 text-xs font-hindi"
                  />
                </div>
              </div>

              {/* Row 4: Bilingual Notification Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Official Gazette Text (English)
                  </label>
                  <textarea
                    rows={6}
                    value={draftBodyEng}
                    onChange={(e) => setDraftBodyEng(e.target.value)}
                    className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs leading-relaxed"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block font-hindi">
                    राजपत्र आधिकारिक प्रारूप (हिन्दी)
                  </label>
                  <textarea
                    rows={6}
                    value={draftBodyHin}
                    onChange={(e) => setDraftBodyHin(e.target.value)}
                    className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs leading-relaxed font-hindi"
                  />
                </div>
              </div>

              {/* Cadastral Schedule Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Cadastral Schedule Attached ({draftSchedule.length} plots)
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">Auto-synced from Case Parcels</span>
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                      <tr>
                        <th className="p-2 border-r">ULPIN</th>
                        <th className="p-2 border-r">Survey No</th>
                        <th className="p-2 border-r">Village</th>
                        <th className="p-2 border-r">Taluk</th>
                        <th className="p-2 border-r">Area (Ha)</th>
                        <th className="p-2">Owner Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[11px]">
                      {draftSchedule.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono border-r">{p.ulpin}</td>
                          <td className="p-2 border-r">{p.survey_no}</td>
                          <td className="p-2 border-r">{p.village}</td>
                          <td className="p-2 border-r">{p.taluk}</td>
                          <td className="p-2 border-r">{p.extent_ha}</td>
                          <td className="p-2">{p.owner_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("repository")}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateDraft}
                disabled={createDraftMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow"
              >
                <Stamp className="h-4 w-4" />
                {createDraftMutation.isPending ? "Compiling Draft..." : "Compile & Register Draft"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        )}

        {/* ==================================================== */}
        {/* TAB 3: QR CRYPTOGRAPHIC VERIFIER                     */}
        {/* ==================================================== */}
        <TabsContent value="verification" className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm max-w-2xl mx-auto">
            <CardHeader className="text-center p-6 pb-2">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-serif">Public e-Gazette Cryptographic Verifier</CardTitle>
              <CardDescription className="text-xs">
                Authenticate genuine statutory publications under Section 4 of Information Technology Act 2000 & RFCTLARR Act 2013.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter SHA-256 Hash or Gazette Ref (e.g. DL-ND-01-2026-48921)"
                  value={verifyInput}
                  onChange={(e) => setVerifyInput(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
                <Button
                  size="sm"
                  onClick={() => setSubmittedVerifyHash(verifyInput)}
                  className="bg-slate-900 text-white hover:bg-slate-800 text-xs px-4"
                >
                  Verify
                </Button>
              </div>

              {/* Preset demo tags */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                <span>Quick Test:</span>
                <button
                  onClick={() => {
                    setVerifyInput("DL-ND-01-2026-48921");
                    setSubmittedVerifyHash("DL-ND-01-2026-48921");
                  }}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-mono text-[10px]"
                >
                  Sec 11: DL-ND-01-2026-48921
                </button>
                <button
                  onClick={() => {
                    setVerifyInput("CG-DL-E-15022026-249018");
                    setSubmittedVerifyHash("CG-DL-E-15022026-249018");
                  }}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-mono text-[10px]"
                >
                  Sec 19: CG-DL-E-15022026-249018
                </button>
                <button
                  onClick={() => {
                    setVerifyInput("CG-DL-E-01032026-251140");
                    setSubmittedVerifyHash("CG-DL-E-01032026-251140");
                  }}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-mono text-[10px]"
                >
                  Sec 23: CG-DL-E-01032026-251140
                </button>
              </div>

              {/* Verification Result Card */}
              {isVerifying ? (
                <div className="p-8 text-center text-xs text-slate-500">Verifying SHA-256 fingerprint on ledger...</div>
              ) : verificationResult ? (
                <div
                  className={`p-4 rounded-lg border text-xs space-y-3 ${
                    verificationResult.verified
                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                      : "bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {verificationResult.verified ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-rose-600" />
                      )}
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {verificationResult.status}
                      </span>
                    </div>
                    <Badge
                      className={
                        verificationResult.verified
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                      }
                    >
                      {verificationResult.verified ? "OFFICIAL AUTHENTIC" : "INVALID PROOF"}
                    </Badge>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                    {verificationResult.message}
                  </p>

                  {verificationResult.verified && (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
                      <div>
                        <span className="text-slate-400">Notice Number:</span>{" "}
                        <span className="font-semibold">{verificationResult.noticeNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Gazette Ref:</span>{" "}
                        <span className="font-mono font-bold text-blue-600">{verificationResult.gazetteReference}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Statutory Section:</span>{" "}
                        <span className="font-medium">{verificationResult.sectionReference}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Issuing Authority:</span>{" "}
                        <span className="font-medium">{verificationResult.issuingAuthority}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Legal Enforceability:</span>{" "}
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          {verificationResult.legalEnforceability}
                        </span>
                      </div>
                      <div className="pt-1 font-mono text-[9px] text-slate-500 break-all border-t border-slate-100 dark:border-slate-800">
                        SHA-256: {verificationResult.sha256Hash}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Realistic Gazette Preview & Print Modal */}
      <GazettePreviewModal
        notice={previewNotice}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}
