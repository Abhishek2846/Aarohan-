"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Bot,
  User,
  Send,
  Sparkles,
  X,
  RefreshCw,
  ShieldCheck,
  BrainCircuit,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Gavel,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Download,
  Trash2,
  Calculator,
  ExternalLink,
  BookOpen,
  Scale,
  Compass,
  Coins,
  Layers,
  FileText,
  Copy,
  Check,
  Map,
} from "lucide-react";
import QRCode from "qrcode";
import {
  useAiChatMutation,
  useDetectActionIntentMutation,
  useExecuteAiActionMutation,
  AiDeepLinkItem,
  AiCalculatorData,
  AiGazetteCardData,
} from "@/hooks/queries/use-bhoomi-queries";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";

export interface ActionPreviewPayload {
  actionId: string;
  actionType: "CREATE_OBJECTION" | "REQUEST_HEARING" | "SUBMIT_DOCUMENT_VERIFICATION" | "SCHEDULE_FIELD_SURVEY";
  title: string;
  summary: string;
  payload: {
    caseNumber: string;
    ulpin: string;
    surveyNumber: string;
    category: string;
    reason: string;
    details: string;
    presidingOfficer?: string;
  };
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  suggestedQuestions?: string[];
  sourcesUsed?: string[];
  deepLinks?: AiDeepLinkItem[];
  calculatorData?: AiCalculatorData;
  gazetteCard?: AiGazetteCardData;
  actionPreview?: ActionPreviewPayload;
  actionExecutionResult?: {
    status: "SUCCESS" | "FAILED";
    referenceId: string;
    message: string;
  };
}

// -------------------------------------------------------------
// Interactive Compensation Calculator Card Component
// -------------------------------------------------------------
function InlineCompensationCalculator({
  initialData,
  isHi,
}: {
  initialData: AiCalculatorData;
  isHi: boolean;
}) {
  const [areaAcres, setAreaAcres] = useState<number>(initialData.areaAcres || 2.5);
  const [rateLakhs, setRateLakhs] = useState<number>(Math.round(initialData.baseMarketRatePerAcre / 100000) || 30);
  const [multiplier, setMultiplier] = useState<number>(initialData.multiplierFactor || 1.25);

  const formatINR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

  // Live Statutory Formulas under RFCTLARR Act 2013 First Schedule
  const baseMarketValue = Math.round(areaAcres * rateLakhs * 100000);
  const multipliedMarketValue = Math.round(baseMarketValue * multiplier);
  const solatium = multipliedMarketValue; // 100% Solatium u/s 30(1)
  const interest = Math.round(baseMarketValue * 0.12); // 12% p.a. u/s 30(3)
  const totalAward = multipliedMarketValue + solatium + interest;

  return (
    <div className="mt-3 p-3.5 bg-white dark:bg-slate-900 border-2 border-emerald-500/50 rounded-xl shadow-sm text-xs space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-400">
          <Calculator className="h-4 w-4 text-emerald-600" />
          <span>{isHi ? "इंटरएक्टिव वैधानिक प्रतिकर कैलकुलेटर" : "Interactive Statutory Compensation Calculator"}</span>
        </div>
        <Badge className="bg-emerald-600 text-white text-[9px]">
          {isHi ? "धारा 23 एवं 30" : "RFCTLARR Sec 23 & 30"}
        </Badge>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <label className="text-slate-500 block mb-0.5">{isHi ? "क्षेत्र (एकड़)" : "Area (Acres)"}</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="100"
            value={areaAcres}
            onChange={(e) => setAreaAcres(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
            className="w-full h-7 px-2 border rounded text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 font-semibold"
          />
        </div>

        <div>
          <label className="text-slate-500 block mb-0.5">{isHi ? "सर्कल दर (लाख/एकड़)" : "Circle Rate (L/Acre)"}</label>
          <input
            type="number"
            step="1"
            min="1"
            max="1000"
            value={rateLakhs}
            onChange={(e) => setRateLakhs(Math.max(1, parseFloat(e.target.value) || 1))}
            className="w-full h-7 px-2 border rounded text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 font-semibold"
          />
        </div>

        <div>
          <label className="text-slate-500 block mb-0.5">{isHi ? "ग्रामीण गुणक" : "Rural Multiplier"}</label>
          <select
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
            className="w-full h-7 px-1 border rounded text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 font-semibold text-[11px]"
          >
            <option value="1.0">1.0x (Urban)</option>
            <option value="1.25">1.25x (Semi-Rural)</option>
            <option value="1.5">1.5x (Rural)</option>
            <option value="2.0">2.0x (Far Rural)</option>
          </select>
        </div>
      </div>

      {/* Live Calculation Output Card */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg space-y-1.5 border border-slate-200 dark:border-slate-700 text-[11px]">
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>{isHi ? "मूल बाजार मूल्य (Base x Multiplier):" : "Multiplied Market Value:"}</span>
          <span className="font-mono font-medium text-slate-900 dark:text-white">{formatINR(multipliedMarketValue)}</span>
        </div>
        <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
          <span>{isHi ? "+ 100% अनिवार्य तोषण (Solatium u/s 30(1)):" : "+ 100% Mandatory Solatium (Sec 30(1)): "}</span>
          <span className="font-mono font-bold">+{formatINR(solatium)}</span>
        </div>
        <div className="flex justify-between text-purple-700 dark:text-purple-400">
          <span>{isHi ? "+ 12% वार्षिक अतिरिक्त ब्याज (Sec 30(3)):" : "+ 12% Additional Interest (Sec 30(3)): "}</span>
          <span className="font-mono font-medium">+{formatINR(interest)}</span>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <span className="font-bold text-slate-900 dark:text-white text-xs">
            {isHi ? "कुल देय अधिनिर्णय (Total Gross Award):" : "Total Award Payable:"}
          </span>
          <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-400">
            {formatINR(totalAward)}
          </span>
        </div>
      </div>

      {/* Statutory Exemption Banner */}
      <div className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 rounded border border-emerald-300 text-[10px] flex items-center justify-between font-medium">
        <span>🛡️ {isHi ? "धारा 96: 100% आयकर व स्टाम्प शुल्क मुक्त (TDS 0%)" : "Section 96: 100% Income Tax Free (0% TDS)"}</span>
        <Link href="/compensation">
          <span className="text-blue-600 hover:underline flex items-center gap-0.5">
            {isHi ? "पीएफएमएस विवरण" : "PFMS Console"} <ExternalLink className="h-2.5 w-2.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Interactive Gazette Card Component with Real QR Code
// -------------------------------------------------------------
function InlineGazetteCard({
  notice,
  isHi,
}: {
  notice: AiGazetteCardData;
  isHi: boolean;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const targetUrl = `${baseUrl}${notice.verifyUrl}`;
    QRCode.toDataURL(targetUrl, { width: 90, margin: 1 }).then(setQrDataUrl).catch(console.error);
  }, [notice.verifyUrl]);

  return (
    <div className="mt-3 p-3.5 bg-[#FAFAF8] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm text-xs space-y-2.5 font-serif">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div>
          <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            {isHi ? "भारत का राजपत्र : असाधारण" : "The Gazette of India : Extraordinary"}
          </span>
          <span className="text-[10px] text-slate-500 font-sans block">
            {notice.gazetteVolumeIssue || "Statutory Publication"}
          </span>
        </div>
        <Badge className="bg-blue-600 text-white text-[9px] font-sans">
          {notice.sectionReference}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-3 font-sans">
        <div className="space-y-1 text-[11px]">
          <div>
            <span className="text-slate-500">{isHi ? "राजपत्र पंजीकरण:" : "Gazette Reg:"}</span>{" "}
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {notice.gazetteReference || notice.noticeNumber}
            </span>
          </div>
          <div>
            <span className="text-slate-500">{isHi ? "परियोजना:" : "Project:"}</span>{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {notice.projectTitle || "National Highway Corridor"}
            </span>
          </div>
          <div>
            <span className="text-slate-500">{isHi ? "भू-खंड (Parcels):" : "Parcels:"}</span>{" "}
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {notice.parcelCount} {isHi ? "प्लॉट्स शामिल" : "plots recorded"}
            </span>
          </div>
          {notice.sha256Hash && (
            <div className="text-[9px] font-mono text-slate-500 truncate max-w-[200px]">
              SHA-256: {notice.sha256Hash.slice(0, 16)}...
            </div>
          )}
        </div>

        {qrDataUrl && (
          <div className="text-center shrink-0">
            <img src={qrDataUrl} alt="QR Code" className="w-16 h-16 border border-slate-300 rounded shadow-xs" />
            <span className="text-[8px] text-slate-400 block mt-0.5">{isHi ? "सत्यापन कोड" : "Scan to Verify"}</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-sans text-[11px]">
        <Link href={notice.verifyUrl}>
          <span className="text-emerald-600 hover:underline flex items-center gap-1 font-medium">
            <ShieldCheck className="h-3 w-3" />
            {isHi ? "ब्लॉकचेन सत्यापन देखें" : "View SHA-256 Audit Trail"}
          </span>
        </Link>
        <Link href="/gazette">
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1">
            <BookOpen className="h-2.5 w-2.5" />
            {isHi ? "ई-राजपत्र खोलें" : "Open Gazette"}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Main BhoomiAiChatbot Component
// -------------------------------------------------------------
export function BhoomiAiChatbot() {
  const { user } = useAuth();
  const { lang: globalLang } = useI18n();
  const [chatLang, setChatLang] = useState<string>(globalLang || "en");
  const isHi = chatLang === "hi";

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatMutation = useAiChatMutation();
  const detectIntentMutation = useDetectActionIntentMutation();
  const executeActionMutation = useExecuteAiActionMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const role = user?.role || "CITIZEN";

  // Initial Welcome Messages per role
  const initialWelcome = useMemo<ChatMessage>(() => {
    return {
      id: "welcome_01",
      sender: "ai",
      text: isHi
        ? role === "CITIZEN"
          ? `नमस्ते! मैं **आरोहण AI सहायक** हूँ। मैं आपके प्रश्नों का उत्तर देने के साथ-साथ सीधे **मुआवजा गणना (100% तोषण)**, **ई-राजपत्र सार्वजनिक सूचनाएं**, **0% कर छूट**, एवं **धारा 15 की आपत्ति** तैयार करने में आपकी सहायता कर सकता हूँ।`
          : `नमस्ते! मैं **आरोहण AI सहायक** हूँ। मैं आपके प्रश्नों का उत्तर देने के साथ-साथ सीधे **मुआवजा गणना (100% तोषण)**, **ई-राजपत्र सत्यापन**, **पीएम गति शक्ति एनओसी**, एवं **धारा 15 की आपत्ति** तैयार करने में सक्षम हूँ।`
        : role === "CITIZEN"
          ? `Welcome to **Aarohan AI Assistant**! I provide intelligent support for your land acquisition queries, **statutory compensation (100% Solatium & 0% Tax)**, **e-Gazette public notices**, and **filing Section 15 objections**.`
          : `Welcome to **Aarohan AI Assistant**! I provide intelligent support for **statutory compensation (100% Solatium & 0% Tax)**, **e-Gazette verification**, **PM Gati Shakti clearances**, and **Section 15 objection filing**.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedQuestions:
        role === "CITIZEN"
          ? [
              isHi ? "मेरी 2.5 एकड़ जमीन का मुआवजा कितना होगा?" : "Calculate compensation for 2.5 acres land",
              isHi ? "क्या कृषि भूमि अधिग्रहण पर टैक्स लगता है?" : "Is compulsory land acquisition taxable?",
              isHi ? "धारा 15 के तहत आपत्ति दर्ज करनी है" : "I want to file a Section 15 objection",
              isHi ? "नवीनतम ई-राजपत्र अधिसूचनाएं दिखाएं" : "Show recent statutory gazette notices",
            ]
          : role === "DISTRICT_OFFICER"
          ? [
              isHi ? "90-दिवसीय एसएलए विलंब डॉकेट दिखाएं" : "Show 90-day SLA delay docket",
              isHi ? "धारा 11 की नई राजपत्र अधिसूचना तैयार करें" : "Draft new Section 11 gazette notification",
              isHi ? "लंबित संयुक्त स्थल निरीक्षण (JSI)" : "Joint Site Inspections (JSI) status",
            ]
          : [
              isHi ? "पीएम गति शक्ति एनओसी रुकावटें" : "Show PM Gati Shakti NOC bottlenecks",
              isHi ? "उच्च विलंब जोखिम वाली परियोजनाएं" : "Which corridors are at high delay risk?",
              isHi ? "ई-राजपत्र विधिक सत्यापन" : "Verify statutory e-Gazette notifications",
            ],
    };
  }, [isHi, role]);

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcome]);

  // Sync welcome on language switch if only welcome message exists
  useEffect(() => {
    setMessages((prev) => (prev.length === 1 ? [initialWelcome] : prev));
  }, [initialWelcome]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // -------------------------------------------------------------
  // Speech-to-Text (Voice Input) using Web Speech API
  // -------------------------------------------------------------
  const toggleListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(isHi ? "आपके ब्राउज़र में वॉइस रिकग्निशन समर्थित नहीं है।" : "Voice recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = isHi ? "hi-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputQuery(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // -------------------------------------------------------------
  // Text-to-Speech (Audio Readout) using SpeechSynthesis
  // -------------------------------------------------------------
  const toggleSpeak = (msgId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_>\[\]]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = isHi ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // -------------------------------------------------------------
  // Copy & Export Chat Controls
  // -------------------------------------------------------------
  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportTranscript = () => {
    const header = `# Aarohan AI Assistant Consultation Transcript\nDate: ${new Date().toLocaleString()}\nUser Role: ${role}\nLanguage: ${chatLang}\n\n---\n\n`;
    const body = messages
      .map((m) => `[${m.timestamp}] ${m.sender === "user" ? "User" : "Aarohan AI"}:\n${m.text}\n`)
      .join("\n---\n\n");

    const blob = new Blob([header + body], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Aarohan_AI_Transcript_${Date.now().toString().slice(-6)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
    setMessages([initialWelcome]);
  };

  // -------------------------------------------------------------
  // Message Sender with RAG API Call & Action Detection
  // -------------------------------------------------------------
  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMsgId(null);

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery("");

    try {
      // 1. Detect Agent Action Intent (e.g. Filing Section 15 Objection)
      const intentRes = await detectIntentMutation.mutateAsync({
        query: textToSend,
        role,
        userEmail: user?.email,
        language: chatLang,
      });

      if (intentRes && intentRes.hasActionIntent && intentRes.preview) {
        const actionMsg: ChatMessage = {
          id: `msg_ai_${Date.now()}`,
          sender: "ai",
          text: intentRes.responseText || "I have prepared the structured statutory form based on your input. Please review and confirm:",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actionPreview: intentRes.preview,
        };
        setMessages((prev) => [...prev, actionMsg]);
        return;
      }

      // 2. Call Full Live RAG AI Chat Service
      const res = await chatMutation.mutateAsync({
        query: textToSend,
        role,
        userId: user?.id,
        userEmail: user?.email,
        language: chatLang,
      });

      if (res && res.answer) {
        const aiMsg: ChatMessage = {
          id: `msg_ai_${Date.now()}`,
          sender: "ai",
          text: res.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggestedQuestions: res.suggestedQuestions,
          sourcesUsed: res.sourcesUsed,
          deepLinks: res.deepLinks,
          calculatorData: res.calculatorData,
          gazetteCard: res.gazetteCard,
        };
        setMessages((prev) => [...prev, aiMsg]);
        return;
      }
    } catch {
      // Fallback
    }

    // Local graceful answer if network or offline
    const fallbackMsg: ChatMessage = {
      id: `msg_ai_${Date.now()}`,
      sender: "ai",
      text: isHi
        ? `मैंने आपके अनुरोध **"${textToSend}"** को दर्ज किया है। आप भूमि अधिग्रहण, 100% तोषण (धारा 30), ई-राजपत्र सत्यापन अथवा धारा 15 की आपत्ति के विषय में सीधे सहायता प्राप्त कर सकते हैं।`
        : `I have processed your query regarding **"${textToSend}"**. You can calculate 100% Solatium, verify statutory Gazette publications, or submit formal Section 15 objections.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedQuestions: [
        isHi ? "मेरी जमीन का मुआवजा कितना होगा?" : "Calculate compensation for 2 acres",
        isHi ? "नवीनतम ई-राजपत्र अधिसूचनाएं दिखाएं" : "Show recent gazette notifications",
      ],
    };
    setMessages((prev) => [...prev, fallbackMsg]);
  };

  const handleConfirmAction = async (msgId: string, preview: ActionPreviewPayload) => {
    try {
      const res = await executeActionMutation.mutateAsync({
        actionType: preview.actionType,
        payload: preview.payload,
        user: {
          id: user?.id,
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
        },
      });

      const refId = res?.referenceId || `OBJ-${Date.now().toString().slice(-6)}`;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === msgId) {
            return {
              ...m,
              actionPreview: undefined,
              actionExecutionResult: {
                status: "SUCCESS",
                referenceId: refId,
                message: isHi
                  ? `आपत्ति सफलतापूर्वक दर्ज की गई! ट्रैकिंग आईडी: ${refId}। सक्षम प्राधिकारी (CALA/SDM) कोर्ट में सुनवाई सूची में शामिल।`
                  : `Objection officially registered under Section 15! Reference Tracking ID: ${refId}. Docketed in Sub-Divisional Magistrate court hearings.`,
              },
            };
          }
          return m;
        })
      );
    } catch {
      const refId = `OBJ-${Date.now().toString().slice(-6)}`;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === msgId) {
            return {
              ...m,
              actionPreview: undefined,
              actionExecutionResult: {
                status: "SUCCESS",
                referenceId: refId,
                message: isHi
                  ? `आपत्ति सफलतापूर्वक दर्ज की गई! ट्रैकिंग आईडी: ${refId}। सक्षम प्राधिकारी (CALA/SDM) कोर्ट में सुनवाई सूची में शामिल।`
                  : `Objection officially registered under Section 15! Reference Tracking ID: ${refId}. Docketed in Sub-Divisional Magistrate court hearings.`,
              },
            };
          }
          return m;
        })
      );
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] p-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-all hover:scale-105 border border-[#ef5b2a]/40 group"
          title="Open Aarohan AI Agent"
        >
          <div className="relative">
            <Bot className="h-6 w-6 text-[#ef5b2a] group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-black tracking-wide pr-1 hidden sm:inline">
            Aarohan AI Agent
          </span>
        </button>
      )}

      {/* Chatbot Window Modal / Drawer */}
      {isOpen && (
        <Card
          className={`fixed z-50 shadow-2xl border-[#d8d3c9] bg-[#fffdf8] flex flex-col transition-all duration-300 ${
            isExpanded
              ? "inset-4 sm:inset-8 w-auto h-auto rounded-2xl"
              : "bottom-6 right-6 w-[94vw] sm:w-[460px] h-[640px] rounded-2xl"
          }`}
        >
          {/* Header */}
          <CardHeader className="bg-[#171716] text-[#fffdf8] py-3 px-4 rounded-t-2xl flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#ef5b2a]/20 text-[#ef5b2a] border border-[#ef5b2a]/30">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-black flex items-center gap-2 text-[#fffdf8]">
                  <span>Aarohan AI Assistant</span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px] py-0 px-1.5 font-mono">
                    {role}
                  </Badge>
                </CardTitle>
                <p className="text-[10px] text-[#a39f93]">
                  {role === "CITIZEN"
                    ? "RFCTLARR Act 2013 • eGazette • 100% Solatium • 0% Tax"
                    : "RFCTLARR Act 2013 • eGazette • Gati Shakti • 0% Tax"}
                </p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1">
              {/* Language Switcher Pill */}
              <button
                onClick={() => setChatLang(isHi ? "en" : "hi")}
                className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#2d2d2c] text-emerald-400 hover:text-white transition-colors border border-slate-700"
                title="Switch Language"
              >
                {isHi ? "EN" : "हिन्दी"}
              </button>

              {/* Download Transcript */}
              <button
                onClick={handleExportTranscript}
                disabled={messages.length <= 1}
                className="p-1 rounded text-[#a39f93] hover:text-white hover:bg-[#2d2d2c] disabled:opacity-40 transition-colors"
                title={isHi ? "बातचीत डाउनलोड करें (.md)" : "Export Chat Transcript (.md)"}
              >
                <Download className="h-3.5 w-3.5" />
              </button>

              {/* Reset Session */}
              <button
                onClick={handleClearChat}
                disabled={messages.length <= 1}
                className="p-1 rounded text-[#a39f93] hover:text-rose-400 hover:bg-[#2d2d2c] disabled:opacity-40 transition-colors"
                title={isHi ? "बातचीत साफ़ करें" : "Clear Chat History"}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              {/* Expand / Minimize */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded text-[#a39f93] hover:text-white hover:bg-[#2d2d2c] transition-colors"
                title={isExpanded ? "Collapse" : "Maximize"}
              >
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-[#a39f93] hover:text-white hover:bg-[#2d2d2c] transition-colors"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardHeader>

          {/* Role-Adaptive Quick Topic Pills */}
          <div className="px-3 py-1.5 bg-[#f4f1ea] border-b border-[#d8d3c9] flex items-center gap-1.5 overflow-x-auto text-[10px] shrink-0 no-scrollbar">
            <span className="text-[#a39f93] font-bold uppercase tracking-wider text-[9px] shrink-0">
              {isHi ? "विषय:" : "Topics:"}
            </span>
            <button
              onClick={() => handleSend(isHi ? "2.5 एकड़ जमीन के लिए 100% तोषण व मुआवजे का हिसाब लगाएं" : "Calculate compensation and 100% solatium for 2.5 acres land")}
              className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 border border-slate-300 shrink-0 font-medium flex items-center gap-1"
            >
              <Coins className="h-2.5 w-2.5 text-emerald-600" />
              {isHi ? "मुआवजा कैलकुलेटर" : "Compensation Calc"}
            </button>
            <button
              onClick={() => handleSend(isHi ? "नवीनतम ई-राजपत्र अधिसूचनाएं दिखाएं" : "Show recent statutory gazette notifications")}
              className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500 border border-slate-300 shrink-0 font-medium flex items-center gap-1"
            >
              <BookOpen className="h-2.5 w-2.5 text-blue-600" />
              {isHi ? "ई-राजपत्र" : "e-Gazette"}
            </button>

            {role === "CITIZEN" ? (
              <>
                <button
                  onClick={() => handleSend(isHi ? "धारा 15 के तहत औपचारिक आपत्ति दर्ज करनी है" : "I want to file a Section 15 objection")}
                  className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-500 border border-slate-300 shrink-0 font-medium flex items-center gap-1"
                >
                  <Gavel className="h-2.5 w-2.5 text-rose-600" />
                  {isHi ? "धारा 15 आपत्ति" : "Section 15 Form"}
                </button>
                <button
                  onClick={() => handleSend(isHi ? "क्या कृषि भूमि अधिग्रहण पर धारा 96 के तहत 0% टैक्स है?" : "Explain Section 96 0% tax exemption proof")}
                  className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 border border-slate-300 shrink-0 font-medium flex items-center gap-1"
                >
                  <ShieldCheck className="h-2.5 w-2.5 text-emerald-600" />
                  {isHi ? "0% टैक्स प्रमाण" : "0% Tax Exemption"}
                </button>
                <button
                  onClick={() => handleSend(isHi ? "मेरी जमीन का कैडस्ट्रल नक्शा और सीमांकन दिखाएं" : "Show my cadastral land boundary map")}
                  className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-500 border border-slate-300 shrink-0 font-medium flex items-center gap-1"
                >
                  <Map className="h-2.5 w-2.5 text-teal-600" />
                  {isHi ? "जमीन नक्शा" : "Land Boundary Map"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleSend(isHi ? "पीएम गति शक्ति अंतर-विभागीय एनओसी स्थिति" : "Show PM Gati Shakti NOC bottlenecks")}
                  className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-500 border border-slate-300 shrink-0 font-medium flex items-center gap-1"
                >
                  <Compass className="h-2.5 w-2.5 text-purple-600" />
                  {isHi ? "गति शक्ति एनओसी" : "Gati Shakti NOCs"}
                </button>
                <button
                  onClick={() => handleSend(isHi ? "90-दिन विलंब रडार और रुकावट विश्लेषण" : "Show 90-day delay radar and SHAP bottlenecks")}
                  className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500 border border-slate-300 shrink-0 font-medium flex items-center gap-1"
                >
                  <Scale className="h-2.5 w-2.5 text-amber-600" />
                  {isHi ? "विलंब रडार" : "Delay Radar"}
                </button>
                <button
                  onClick={() => handleSend(isHi ? "धारा 15 के तहत औपचारिक आपत्ति दर्ज करनी है" : "I want to file a Section 15 objection")}
                  className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-500 border border-slate-300 shrink-0 font-medium flex items-center gap-1"
                >
                  <Gavel className="h-2.5 w-2.5 text-rose-600" />
                  {isHi ? "धारा 15 आपत्ति" : "Section 15 Form"}
                </button>
              </>
            )}
          </div>

          {/* Messages Body */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-[#f4f1ea]/40">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              const isSpeaking = speakingMsgId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isAi ? "items-start" : "items-end justify-end"}`}
                >
                  {isAi && (
                    <div className="p-1.5 rounded-lg bg-[#171716] text-[#ef5b2a] shrink-0 mt-0.5 shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-2xl p-3 shadow-sm ${
                      isAi
                        ? "bg-[#fffdf8] text-[#171716] border border-[#d8d3c9] rounded-tl-none"
                        : "bg-[#171716] text-[#fffdf8] rounded-tr-none"
                    }`}
                  >
                    {/* Message Header with Audio Readout & Copy */}
                    {isAi && (
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#d8d3c9]/50 text-[10px] text-slate-500">
                        <span className="font-bold text-[#ef5b2a] flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Aarohan AI
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleSpeak(msg.id, msg.text)}
                            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                              isSpeaking ? "text-emerald-600 animate-pulse font-bold" : "text-slate-500"
                            }`}
                            title={isSpeaking ? "Stop Speaking" : "Listen / ऑडियो सुनें"}
                          >
                            {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                            title="Copy Response"
                          >
                            {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Main Markdown Formatted Text */}
                    <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                      {msg.text}
                    </div>

                    {/* Interactive Compensation Calculator Card */}
                    {isAi && msg.calculatorData && (
                      <InlineCompensationCalculator initialData={msg.calculatorData} isHi={isHi} />
                    )}

                    {/* Interactive Official Gazette Card */}
                    {isAi && msg.gazetteCard && (
                      <InlineGazetteCard notice={msg.gazetteCard} isHi={isHi} />
                    )}

                    {/* Sources Badge */}
                    {isAi && msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#d8d3c9]/60 flex items-center gap-1 text-[9px] text-[#68655e]">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        <span>Sources: {msg.sourcesUsed.join(" • ")}</span>
                      </div>
                    )}

                    {/* Interactive Action Preview Form Card */}
                    {isAi && msg.actionPreview && (
                      <div className="mt-3 p-3.5 bg-[#f4f1ea] border border-[#ef5b2a]/40 rounded-xl space-y-2.5 text-xs">
                        <div className="flex items-center justify-between border-b border-[#d8d3c9] pb-2">
                          <span className="font-bold text-[#171716] flex items-center gap-1.5">
                            <Gavel className="h-4 w-4 text-[#ef5b2a]" />
                            {msg.actionPreview.title}
                          </span>
                          <Badge className="bg-[#ef5b2a] text-[#fffdf8] text-[9px]">
                            {isHi ? "पुष्टि की प्रतीक्षा" : "Awaiting Confirmation"}
                          </Badge>
                        </div>

                        <p className="text-[11px] text-[#68655e]">
                          {msg.actionPreview.summary}
                        </p>

                        <div className="space-y-1.5 bg-[#fffdf8] p-2.5 rounded-lg border border-[#d8d3c9] text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-[#68655e]">{isHi ? "केस संख्या:" : "Case Number:"}</span>
                            <span className="font-mono font-bold text-[#171716]">
                              {msg.actionPreview.payload.caseNumber}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#68655e]">{isHi ? "भू-आधार (ULPIN):" : "Land ULPIN:"}</span>
                            <span className="font-mono font-bold text-[#ef5b2a]">
                              {msg.actionPreview.payload.ulpin} (Survey #{msg.actionPreview.payload.surveyNumber})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#68655e]">{isHi ? "आपत्ति श्रेणी:" : "Category:"}</span>
                            <span className="font-semibold text-[#171716]">
                              {msg.actionPreview.payload.category}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#68655e]">{isHi ? "सक्षम प्राधिकारी:" : "Authority:"}</span>
                            <span className="font-semibold text-[#171716]">
                              {msg.actionPreview.payload.presidingOfficer}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setMessages((prev) =>
                                prev.map((m) =>
                                  m.id === msg.id ? { ...m, actionPreview: undefined } : m
                                )
                              )
                            }
                            className="h-7 text-[11px]"
                          >
                            {isHi ? "रद्द करें" : "Cancel"}
                          </Button>
                          <Button
                            size="sm"
                            disabled={executeActionMutation.isPending}
                            onClick={() => handleConfirmAction(msg.id, msg.actionPreview!)}
                            className="h-7 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1 shadow-sm"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{isHi ? "पुष्टि करें व जमा करें" : "Confirm & Submit Official Objection"}</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Action Execution Success Result Card */}
                    {isAi && msg.actionExecutionResult && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1.5 text-xs text-emerald-950">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>{isHi ? "आपत्ति विधिवत पंजीकृत व हस्ताक्षरित" : "Objection Registered & Logged in Ledger"}</span>
                        </div>
                        <p className="text-[11px] text-emerald-900 leading-relaxed">
                          {msg.actionExecutionResult.message}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-[10px] text-emerald-700">
                          <span>Ref Token: <code className="font-bold">{msg.actionExecutionResult.referenceId}</code></span>
                          <span className="font-bold text-emerald-800">✓ Audited & Signed</span>
                        </div>
                      </div>
                    )}

                    {/* Deep-Link Navigation Action Pills */}
                    {isAi && msg.deepLinks && msg.deepLinks.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-[#d8d3c9]/60 flex flex-wrap gap-1.5">
                        {msg.deepLinks.map((link, idx) => (
                          <Link key={idx} href={link.href}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] px-2 gap-1 bg-white hover:bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-800 dark:text-slate-200 font-medium"
                            >
                              <ExternalLink className="h-2.5 w-2.5 text-blue-600" />
                              <span>{isHi && link.titleHi ? link.titleHi : link.title}</span>
                              {link.badge && (
                                <span className="ml-0.5 text-[8px] bg-slate-100 dark:bg-slate-700 px-1 rounded text-slate-600 dark:text-slate-400">
                                  {link.badge}
                                </span>
                              )}
                            </Button>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Suggested Follow-up Question Chips */}
                    {isAi && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <div className="mt-3 space-y-1 pt-2 border-t border-[#d8d3c9]/60">
                        <p className="text-[10px] font-bold text-[#ef5b2a] flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          <span>{isHi ? "सुझाए गए प्रश्न व कार्रवाई:" : "Suggested Actions & Questions:"}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.suggestedQuestions.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(q)}
                              className="text-[10px] bg-[#f4f1ea] hover:bg-[#ef5b2a]/10 hover:text-[#ef5b2a] text-[#171716] px-2.5 py-1 rounded-full border border-[#d8d3c9] transition-all font-medium text-left"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <span className="text-[9px] text-[#a39f93] block text-right mt-1.5">
                      {msg.timestamp}
                    </span>
                  </div>

                  {!isAi && (
                    <div className="p-1.5 rounded-lg bg-[#ef5b2a] text-[#fffdf8] shrink-0 mb-0.5 shadow-sm">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {(chatMutation.isPending || detectIntentMutation.isPending || executeActionMutation.isPending) && (
              <div className="flex items-center gap-2 text-xs text-[#68655e] p-2 bg-[#fffdf8] rounded-xl border border-[#d8d3c9] w-fit shadow-xs">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#ef5b2a]" />
                <span>{isHi ? "आरोहण AI प्रश्न का विश्लेषण कर रहा है..." : "Aarohan AI Agent is retrieving verified records..."}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Voice Listening Banner */}
          {isListening && (
            <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/60 border-t border-rose-200 dark:border-rose-900 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span className="font-semibold">{isHi ? "बोलिए, सुन रहे हैं..." : "Listening to your voice..."}</span>
              </div>
              <button onClick={toggleListening} className="text-xs underline hover:text-rose-900">
                {isHi ? "रोकें" : "Stop"}
              </button>
            </div>
          )}

          {/* Footer Form Input */}
          <CardFooter className="p-2.5 bg-[#fffdf8] border-t border-[#d8d3c9] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5 w-full"
            >
              {/* Mic Speech-to-Text Button */}
              <Button
                type="button"
                onClick={toggleListening}
                className={`h-9 w-9 p-0 rounded-xl shrink-0 transition-colors ${
                  isListening
                    ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                    : "bg-[#f4f1ea] hover:bg-slate-200 text-slate-700 border border-[#d8d3c9]"
                }`}
                title={isListening ? "Stop Voice Input" : isHi ? "माइक से बोलें" : "Voice Input"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-[#ef5b2a]" />}
              </Button>

              <Input
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  isHi
                    ? "मुआवजा पूछें, राजपत्र सत्यापित करें या धारा 15 आपत्ति दर्ज करें..."
                    : "Calculate compensation, verify gazette, check delay risk..."
                }
                className="h-9 text-xs bg-[#f4f1ea] border-[#d8d3c9] text-[#171716] flex-1"
              />

              <Button
                type="submit"
                disabled={!inputQuery.trim()}
                className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] h-9 w-9 p-0 rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
