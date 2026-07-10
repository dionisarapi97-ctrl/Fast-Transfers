"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";

const prefixes = [
  "+355", "+383", "+39", "+49", "+44", "+1", "+30", "+33", "+34", "+41", "+43", "+31", "+32", "+46", "+47", "+45", "+90"
];

const languages = [
  { code: "sq", label: "Shqip", flag: "🇦🇱" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export default function SignupPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [name, setName] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+355");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Click outside dropdown handler
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!name || !phoneNumber || !email || !password || !confirmPassword) {
      setErrorMsg(language === "sq" ? "Ju lutem plotësoni të gjitha fushat." : "Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(language === "sq" ? "Fjalëkalimet nuk përputhen." : "Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg(language === "sq" ? "Fjalëkalimi duhet të jetë të paktën 6 karaktere." : "Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const fullPhone = `${phonePrefix}${phoneNumber}`.trim();

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: fullPhone,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        alert(
          language === "sq"
            ? "Regjistrimi u krye me sukses! Ju lutem kontrolloni email-in tuaj për konfirmim nëse kërkohet."
            : "Signup successful! Please check your email for confirmation if required."
        );
        router.push("/client/dashboard");
      }
    } catch (err) {
      setErrorMsg(language === "sq" ? "Ndodhi një gabim gjatë regjistrimit. Provoni përsëri." : "An error occurred during signup. Try again.");
      setLoading(false);
    }
  };

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <main className="min-h-screen bg-[#07110f] text-white flex items-center justify-center p-6 relative">
      
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

      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-white/5 p-8 md:p-10 shadow-2xl backdrop-blur-xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-4xl">🚖</span>
          <h2 className="text-3xl font-black bg-gradient-to-r from-slate-100 to-emerald-400 bg-clip-text text-transparent">
            Fast Transfers
          </h2>
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            {t("signup_title")}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-semibold text-red-400">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("full_name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("placeholder_full_name")}
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm text-white outline-none focus:border-[#00D084] focus:bg-white/10 transition"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("phone_number")}</label>
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <select
                value={phonePrefix}
                onChange={(e) => setPhonePrefix(e.target.value)}
                className="rounded-2xl border border-white/15 bg-slate-900 px-3 py-3.5 text-sm text-white outline-none focus:border-[#00D084] cursor-pointer"
              >
                {prefixes.map((prefix) => (
                  <option key={prefix} value={prefix} className="bg-[#07110f]">
                    {prefix}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="67 60 37 654"
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm text-white outline-none focus:border-[#00D084] focus:bg-white/10 transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("email_label")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm text-white outline-none focus:border-[#00D084] focus:bg-white/10 transition"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("password_label")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={language === "sq" ? "Të paktën 6 shkronja" : "At least 6 characters"}
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm text-white outline-none focus:border-[#00D084] focus:bg-white/10 transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("confirm_password_label")}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={language === "sq" ? "Rishkruaj fjalëkalimin" : "Retype password"}
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm text-white outline-none focus:border-[#00D084] focus:bg-white/10 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#00D084] hover:bg-[#00b06f] disabled:opacity-50 text-white font-extrabold py-4 text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_0_20px_rgba(0,208,132,0.2)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-4"
          >
            {loading ? t("signing_up") : t("button_signup")}
          </button>
        </form>

        {/* Links */}
        <div className="text-center text-xs text-slate-455 border-t border-white/10 pt-6">
          <p>
            {t("existing_client_prompt")?.split("?")[0]}?{" "}
            <span 
              onClick={() => router.push("/login")} 
              className="text-[#00D084] hover:underline font-bold cursor-pointer"
            >
              {t("button_login")}
            </span>
          </p>
        </div>

      </div>
    </main>
  );
}
