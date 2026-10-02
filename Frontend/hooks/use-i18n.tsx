"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { LanguageCode, TRANSLATIONS, TranslationDictionary } from "@/lib/i18n";
import { translateTextToHindi, translateTextToEnglish } from "@/lib/indic-dictionary";

interface I18nContextValue {
  lang: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  toggleLanguage: () => void;
  t: TranslationDictionary;
}

const defaultContext: I18nContextValue = {
  lang: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: TRANSLATIONS.en,
};

const I18nContext = createContext<I18nContextValue>(defaultContext);

// Nodes to ignore during DOM translation
const IGNORED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "CODE",
  "PRE",
  "SVG",
  "PATH",
  "NOSCRIPT",
]);

interface ExtNode extends Node {
  __origText?: string;
}

interface ExtElement extends HTMLElement {
  __origPlaceholder?: string;
  __origTitle?: string;
  __origAriaLabel?: string;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>("en");
  const pathname = usePathname();
  const isTranslatingRef = useRef(false);

  // Safe DOM translation function
  const applyDOMTranslation = useCallback((rootNode: Node) => {
    if (typeof window === "undefined" || !rootNode) return;
    if (isTranslatingRef.current) return;
    if ((rootNode as HTMLElement).closest?.(".no-translate")) return;

    isTranslatingRef.current = true;
    try {
      const walker = document.createTreeWalker(
        rootNode,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        {
          acceptNode(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              if (IGNORED_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
              if (el.closest?.(".no-translate")) return NodeFilter.FILTER_REJECT;
              return NodeFilter.FILTER_ACCEPT;
            }
            if (node.nodeType === Node.TEXT_NODE) {
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              if (IGNORED_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
              if (parent.closest?.(".no-translate")) return NodeFilter.FILTER_REJECT;
              if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          },
        }
      );

      let currentNode: Node | null = walker.nextNode();
      while (currentNode) {
        if (currentNode.nodeType === Node.TEXT_NODE) {
          const textNode = currentNode as ExtNode;
          const currentVal = textNode.nodeValue || "";

          // Save original text ONLY if not saved yet and currentVal is English (not Devanagari)
          if (textNode.__origText === undefined && !/[\u0900-\u097F]/.test(currentVal)) {
            textNode.__origText = currentVal;
          }

          const sourceText = textNode.__origText || currentVal;
          const translated = translateTextToHindi(sourceText);
          if (translated && translated !== currentVal) {
            textNode.nodeValue = translated;
          }
        } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
          const el = currentNode as ExtElement;

          // Translate placeholders
          if ("placeholder" in el && typeof (el as any).placeholder === "string") {
            const input = el as HTMLInputElement & ExtElement;
            if (input.__origPlaceholder === undefined && !/[\u0900-\u097F]/.test(input.placeholder)) {
              input.__origPlaceholder = input.placeholder;
            }
            const sourcePh = input.__origPlaceholder || input.placeholder;
            if (sourcePh) {
              const trans = translateTextToHindi(sourcePh);
              if (trans !== input.placeholder) input.placeholder = trans;
            }
          }

          // Translate title attribute
          if (el.title) {
            if (el.__origTitle === undefined && !/[\u0900-\u097F]/.test(el.title)) {
              el.__origTitle = el.title;
            }
            const sourceTitle = el.__origTitle || el.title;
            const transTitle = translateTextToHindi(sourceTitle);
            if (transTitle !== el.title) el.title = transTitle;
          }

          // Translate aria-label
          const ariaLabel = el.getAttribute("aria-label");
          if (ariaLabel) {
            if (el.__origAriaLabel === undefined && !/[\u0900-\u097F]/.test(ariaLabel)) {
              el.__origAriaLabel = ariaLabel;
            }
            const sourceAria = el.__origAriaLabel || ariaLabel;
            const transAria = translateTextToHindi(sourceAria);
            if (transAria !== ariaLabel) el.setAttribute("aria-label", transAria);
          }
        }
        currentNode = walker.nextNode();
      }
    } finally {
      isTranslatingRef.current = false;
    }
  }, []);

  // Restore original English text
  const restoreDOMEnglish = useCallback((rootNode: Node) => {
    if (typeof window === "undefined" || !rootNode) return;
    if (isTranslatingRef.current) return;
    if ((rootNode as HTMLElement).closest?.(".no-translate")) return;

    isTranslatingRef.current = true;
    try {
      const walker = document.createTreeWalker(
        rootNode,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        {
          acceptNode(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              if (IGNORED_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
              if (el.closest?.(".no-translate")) return NodeFilter.FILTER_REJECT;
              return NodeFilter.FILTER_ACCEPT;
            }
            if (node.nodeType === Node.TEXT_NODE) {
              const parent = node.parentElement;
              if (!parent || IGNORED_TAGS.has(parent.tagName) || parent.closest?.(".no-translate")) return NodeFilter.FILTER_REJECT;
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          },
        }
      );

      let currentNode: Node | null = walker.nextNode();
      while (currentNode) {
        if (currentNode.nodeType === Node.TEXT_NODE) {
          const textNode = currentNode as ExtNode;
          if (textNode.__origText !== undefined && !/[\u0900-\u097F]/.test(textNode.__origText)) {
            textNode.nodeValue = textNode.__origText;
          } else if (textNode.nodeValue && /[\u0900-\u097F]/.test(textNode.nodeValue)) {
            // Fallback dictionary reverse translation if __origText was lost or not saved
            const enText = translateTextToEnglish(textNode.nodeValue);
            if (enText !== textNode.nodeValue) {
              textNode.nodeValue = enText;
            }
          }
          delete textNode.__origText;
        } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
          const el = currentNode as ExtElement;
          if (el.__origPlaceholder !== undefined && !/[\u0900-\u097F]/.test(el.__origPlaceholder) && "placeholder" in el) {
            (el as any).placeholder = el.__origPlaceholder;
          } else if ("placeholder" in el && typeof (el as any).placeholder === "string") {
            const rev = translateTextToEnglish((el as any).placeholder);
            if (rev !== (el as any).placeholder) (el as any).placeholder = rev;
          }
          delete el.__origPlaceholder;

          if (el.__origTitle !== undefined && !/[\u0900-\u097F]/.test(el.__origTitle)) {
            el.title = el.__origTitle;
          } else if (el.title) {
            const revTitle = translateTextToEnglish(el.title);
            if (revTitle !== el.title) el.title = revTitle;
          }
          delete el.__origTitle;

          if (el.__origAriaLabel !== undefined && !/[\u0900-\u097F]/.test(el.__origAriaLabel)) {
            el.setAttribute("aria-label", el.__origAriaLabel);
          } else {
            const curr = el.getAttribute("aria-label");
            if (curr) {
              const revAria = translateTextToEnglish(curr);
              if (revAria !== curr) el.setAttribute("aria-label", revAria);
            }
          }
          delete el.__origAriaLabel;
        }
        currentNode = walker.nextNode();
      }
    } finally {
      isTranslatingRef.current = false;
    }
  }, []);

  // Sync with LocalStorage and Event Listeners
  useEffect(() => {
    try {
      const stored = localStorage.getItem("aarohan_lang") as LanguageCode;
      if (stored === "en" || stored === "hi") {
        setLangState(stored);
      }
    } catch (e) {
      // Ignore
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "aarohan_lang" && (e.newValue === "en" || e.newValue === "hi")) {
        setLangState(e.newValue as LanguageCode);
      }
    };

    const handleCustomChange = (e: CustomEvent<LanguageCode>) => {
      if (e.detail === "en" || e.detail === "hi") {
        setLangState(e.detail);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("aarohan_lang_change" as any, handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("aarohan_lang_change" as any, handleCustomChange);
    };
  }, []);

  // Active DOM translation effect + MutationObserver
  useEffect(() => {
    if (typeof window === "undefined" || !document.body) return;

    document.documentElement.lang = lang;

    if (lang === "hi") {
      document.body.classList.add("aarohan-lang-hi");

      // 1. Immediately translate all pre-existing DOM elements on the current page
      applyDOMTranslation(document.body);

      // 2. Schedule microtask and short delayed sweep for dynamically hydrated components
      const t1 = setTimeout(() => {
        if (document.body) applyDOMTranslation(document.body);
      }, 60);

      const t2 = setTimeout(() => {
        if (document.body) applyDOMTranslation(document.body);
      }, 250);

      // 3. Observe ongoing DOM mutations (modals, tabs, query updates)
      let rafId: number | null = null;
      const pendingNodes: HTMLElement[] = [];

      const flushPending = () => {
        if (isTranslatingRef.current) return;
        const nodesToProcess = pendingNodes.splice(0, pendingNodes.length);
        for (const el of nodesToProcess) {
          if (document.body.contains(el)) {
            applyDOMTranslation(el);
          }
        }
      };

      const observer = new MutationObserver((mutations) => {
        if (isTranslatingRef.current) return;

        let hasNewElements = false;
        for (const m of mutations) {
          if (m.type === "childList") {
            m.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (!el.closest?.(".no-translate")) {
                  pendingNodes.push(el);
                  hasNewElements = true;
                }
              }
            });
          }
        }

        if (hasNewElements) {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(flushPending);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        if (rafId) cancelAnimationFrame(rafId);
        observer.disconnect();
      };
    } else {
      document.body.classList.remove("aarohan-lang-hi");
      restoreDOMEnglish(document.body);

      const t1 = setTimeout(() => {
        if (document.body) restoreDOMEnglish(document.body);
      }, 60);

      return () => {
        clearTimeout(t1);
      };
    }
  }, [lang, pathname, applyDOMTranslation, restoreDOMEnglish]);

  const setLanguage = useCallback((newLang: LanguageCode) => {
    setLangState(newLang);
    try {
      localStorage.setItem("aarohan_lang", newLang);
      window.dispatchEvent(
        new CustomEvent("aarohan_lang_change", { detail: newLang })
      );
    } catch (e) {
      // Ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(lang === "en" ? "hi" : "en");
  }, [lang, setLanguage]);

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLanguage,
        toggleLanguage,
        t: TRANSLATIONS[lang] || TRANSLATIONS.en,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
