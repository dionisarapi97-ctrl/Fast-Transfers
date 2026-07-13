"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "@/lib/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en"); // Default to EN (English) for Google Ads compliance

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved && translations[saved]) {
        setLanguageState(saved);
      }
    } catch (err) {
      console.error("Error loading saved language:", err);
    }
  }, []);

  const setLanguage = (lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      try {
        localStorage.setItem("lang", lang);
      } catch (err) {
        console.error("Error saving language preference:", err);
      }
    }
  };

  const t = (key, params = {}) => {
    let str = translations[language]?.[key] || translations["en"]?.[key] || key;
    
    // Replace custom parameters like {step} or {total}
    Object.keys(params).forEach((paramKey) => {
      str = str.replace(`{${paramKey}}`, params[paramKey]);
    });
    
    // Fallback if translations didn't load properly or translation key is missing
    if (!str || str === key) {
      str = translations["en"]?.[key] || key;
    }
    
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return mock values if loaded outside provider to avoid crashes during hydration
    return {
      language: "en",
      setLanguage: () => {},
      t: (key) => key
    };
  }
  return context;
}
