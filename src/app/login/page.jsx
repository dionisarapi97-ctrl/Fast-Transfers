"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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

export default function LoginPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef(null);

  // If already logged in, redirect to appropriate page
  useEffect(() => {
    async function checkActiveSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        handleRoleRedirect(session.user.email);
      }
    }
    checkActiveSession();

    // Click outside dropdown handler
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRoleRedirect = async (userEmail) => {
    try {
      const { data: driver, error } = await supabase
        .from("drivers")
        .select("id, status")
        .eq("email", userEmail)
        .maybeSingle();

      if (error) {
        console.error("Error checking driver role:", error.message);
      }

      if (driver && driver.status && driver.status.trim() === "Active") {
        // This is a driver, log them out of the client portal and show error
        await supabase.auth.signOut();
        setErrorMsg(language === "sq"
          ? "Kjo llogari është e regjistruar si shofer. Ju lutem përdorni login-in e shoferëve."
          : "This account is registered as a driver. Please use the driver login portal.");
        setLoading(false);
      } else {
        router.push("/client/dashboard");
      }
    } catch (err) {
      router.push("/client/dashboard");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!email || !password) {
      setErrorMsg(language === "sq" ? "Ju lutem plotësoni të gjitha fushat." : "Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(
          error.message === "Invalid login credentials"
            ? (language === "sq" ? "Email ose fjalëkalim i gabuar." : "Incorrect email or password.")
            : error.message
        );
        setLoading(false);
        return;
      }

      if (data?.user) {
        await handleRoleRedirect(data.user.email);
      }
    } catch (err) {
      setErrorMsg(language === "sq" ? "Ndodhi një gabim gjatë hyrjes. Provoni përsëri." : "An error occurred during log in. Try again.");
      setLoading(false);
    }
  };

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <main className="min-h-screen bg-[#07110f] text-white flex items-center justify-center p-6 relative">
      
      {/* Floating Back to Home Top-Left */}
      <div className="absolute top-6 left-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition duration-200 cursor-pointer"
        >
          <span>←</span>
          <span>{language === "sq" ? "Kreu" : "Home"}</span>
        </button>
      </div>

      {/* Floating Language Switcher Top-Right */}
      <div className="absolute top-6 right-6" ref={dropdownRef}>
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition duration-200 cursor-pointer"
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

      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/5 p-8 md:p-10 shadow-2xl backdrop-blur-xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-4xl">👤</span>
          <h2 className="text-3xl font-black bg-gradient-to-r from-slate-100 to-emerald-400 bg-clip-text text-transparent">
            Fast Transfers
          </h2>
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            {language === "sq" ? "Kyçja e Klientëve (Client Login)" : "Client Login Portal"}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-semibold text-red-400">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("email_label")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm text-white outline-none focus:border-[#00D084] focus:bg-white/10 transition"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("password_label")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm text-white outline-none focus:border-[#00D084] focus:bg-white/10 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#00D084] hover:bg-[#00b06f] disabled:opacity-50 text-white font-extrabold py-4 text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_0_20px_rgba(0,208,132,0.2)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {loading ? t("logging_in") : t("button_login")}
          </button>
        </form>

        {/* Links */}
        <div className="text-center text-xs text-slate-400 border-t border-white/10 pt-6 space-y-4">
          <p>
            {t("new_client_prompt")?.split("?")[0]}?{" "}
            <span 
              onClick={() => router.push("/signup")} 
              className="text-[#00D084] hover:underline font-bold cursor-pointer"
            >
              {t("button_signup")}
            </span>
          </p>
          <div className="pt-2 border-t border-white/5">
            <span 
              onClick={() => router.push("/driver/login")} 
              className="text-amber-400 hover:text-amber-300 hover:underline font-bold cursor-pointer flex items-center justify-center gap-1.5"
            >
              🚖 {language === "sq" ? "Jeni Shofer? Kyçuni këtu ➔" : "Are you a Driver? Login here ➔"}
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}
