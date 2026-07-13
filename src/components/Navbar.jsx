"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";

const languages = [
  { code: "sq", label: "Shqip", flag: "🇦🇱" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const [session, setSession] = useState(null);
  const [rolePath, setRolePath] = useState("/client/dashboard");
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Register PWA service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("Service Worker registered:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        checkDriverRole(currentSession.user.email);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        checkDriverRole(newSession.user.email);
      }
    });

    // Click outside dropdown handler
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const checkDriverRole = async (email) => {
    try {
      const { data: driver } = await supabase
        .from("drivers")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (driver) {
        setRolePath("/driver/dashboard");
      } else {
        setRolePath("/client/dashboard");
      }
    } catch (err) {
      setRolePath("/client/dashboard");
    }
  };

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleBookNow = () => {
    if (session) {
      router.push("/booking");
    } else {
      const bookingCard = document.getElementById("booking-card");
      if (bookingCard) {
        bookingCard.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        router.push("/booking");
      }
    }
  };

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <nav className="fixed top-0 left-0 z-50 flex h-[90px] w-full items-center justify-between px-6 md:px-12 backdrop-blur-xl bg-slate-950/45 border-b border-slate-900/85">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <div className="logo-shimmer-container rounded-xl animate-logo-entrance">
          <img 
            src="/images/logo.png" 
            alt="Fast Transfers Logo" 
            className="h-12 w-12 object-contain rounded-xl border border-emerald-500/20 bg-slate-950/50 animate-logo-pulse hover:scale-105 transition-transform duration-300" 
          />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-black tracking-wider text-white">
            Fast Transfers
          </h2>
          <p className="hidden sm:block text-[10px] uppercase tracking-widest text-[#00D084] font-bold">
            Travel Electric
          </p>
        </div>
      </div>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
        <button
          onClick={() => handleScrollTo("destinations")}
          className="hover:text-slate-100 transition duration-200 cursor-pointer"
        >
          {t("destinations")}
        </button>
        <button
          onClick={() => handleScrollTo("whyus")}
          className="hover:text-slate-100 transition duration-200 cursor-pointer"
        >
          {t("why_us")}
        </button>
        <button
          onClick={() => handleScrollTo("faq")}
          className="hover:text-slate-100 transition duration-200 cursor-pointer"
        >
          {t("faq")}
        </button>

        {session ? (
          <a
            href={rolePath}
            className="hover:text-slate-100 text-[#00D084] font-bold transition duration-200 cursor-pointer"
          >
            {t("my_account")}
          </a>
        ) : (
          <a
            href="/login"
            className="hover:text-slate-100 transition duration-200 cursor-pointer"
          >
            {t("log_in")}
          </a>
        )}

        <a
          href="tel:+355693048000"
          className="text-emerald-500 hover:text-emerald-400 transition duration-200 flex items-center gap-1.5 font-semibold"
        >
          📞 +355 69 304 8000
        </a>
      </div>

      {/* Actions (Language Switcher, Auth links, Book Now button) */}
      <div className="flex items-center gap-4">
        
        {/* Language selector dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition duration-200 cursor-pointer"
          >
            <span>{currentLang.flag}</span>
            <span className="uppercase text-[10px] tracking-wide">{currentLang.code}</span>
            <span className="text-[8px] opacity-60">▼</span>
          </button>
          
          {langOpen && (
            <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-white/15 bg-slate-950 p-1.5 shadow-2xl z-50 space-y-0.5">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setLangOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold transition hover:bg-white/10 cursor-pointer ${
                    language === l.code ? "text-[#00D084] bg-white/5" : "text-slate-350"
                  }`}
                >
                  <span className="text-sm">{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile profile link / desktop fallback */}
        {session ? (
          <a
            href={rolePath}
            className="md:hidden text-xs font-extrabold text-[#00D084] hover:underline transition"
          >
            {t("profile")}
          </a>
        ) : (
          <a
            href="/login"
            className="md:hidden text-xs font-extrabold text-slate-300 hover:text-white transition"
          >
            {t("log_in")}
          </a>
        )}

        <button
          onClick={handleBookNow}
          className="rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 cursor-pointer"
        >
          {t("book_now")}
        </button>
      </div>
    </nav>
  );
}