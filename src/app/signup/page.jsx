"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const prefixes = [
  "+355", "+383", "+39", "+49", "+44", "+1", "+30", "+33", "+34", "+41", "+43", "+31", "+32", "+46", "+47", "+45", "+90"
];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+355");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!name || !phoneNumber || !email || !password || !confirmPassword) {
      setErrorMsg("Ju lutem plotësoni të gjitha fushat.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Fjalëkalimet nuk përputhen.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Fjalëkalimi duhet të jetë të paktën 6 karaktere.");
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
        alert("Regjistrimi u krye me sukses! Ju lutem kontrolloni email-in tuaj për konfirmim nëse kërkohet.");
        router.push("/client/dashboard");
      }
    } catch (err) {
      setErrorMsg("Ndodhi një gabim gjatë regjistrimit. Provoni përsëri.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#07110f] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-white/5 p-8 md:p-10 shadow-2xl backdrop-blur-xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-4xl">🚖</span>
          <h2 className="text-3xl font-black bg-gradient-to-r from-slate-100 to-emerald-400 bg-clip-text text-transparent">
            Fast Transfers
          </h2>
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Regjistrim Klienti (Sign Up)
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Emri i Plotë (Full Name)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Shembull: Dionis Arapi"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm text-white outline-none focus:border-[#00D084] focus:bg-white/10 transition"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Numri i Telefonit</label>
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <select
                value={phonePrefix}
                onChange={(e) => setPhonePrefix(e.target.value)}
                className="rounded-2xl border border-white/15 bg-slate-900 px-3 py-3.5 text-sm text-white outline-none focus:border-[#00D084]"
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dionis@example.com"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm text-white outline-none focus:border-[#00D084] focus:bg-white/10 transition"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Të paktën 6 shkronja"
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm text-white outline-none focus:border-[#00D084] focus:bg-white/10 transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Konfirmo Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Rishkruaj fjalëkalimin"
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
            {loading ? "Duke u regjistruar..." : "Regjistrohu (Sign Up)"}
          </button>
        </form>

        {/* Links */}
        <div className="text-center text-xs text-slate-455 border-t border-white/10 pt-6">
          <p>
            Keni një llogari ekzistuese?{" "}
            <span 
              onClick={() => router.push("/login")} 
              className="text-[#00D084] hover:underline font-bold cursor-pointer"
            >
              Hyni Këtu (Sign In)
            </span>
          </p>
        </div>

      </div>
    </main>
  );
}
