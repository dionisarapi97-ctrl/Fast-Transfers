"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // If already logged in, redirect to appropriate page
  useEffect(() => {
    async function checkActiveSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        handleRoleRedirect(session.user.email);
      }
    }
    checkActiveSession();
  }, []);

  const handleRoleRedirect = async (userEmail) => {
    try {
      // Check if email exists in drivers table
      const { data: driver, error } = await supabase
        .from("drivers")
        .select("id, status")
        .eq("email", userEmail)
        .maybeSingle();

      if (error) {
        console.error("Error checking driver role:", error.message);
      }

      if (driver && driver.status === "Active") {
        router.push("/driver/dashboard");
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
      setErrorMsg("Ju lutem plotësoni të gjitha fushat.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message === "Invalid login credentials" ? "Email ose fjalëkalim i gabuar." : error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        await handleRoleRedirect(data.user.email);
      }
    } catch (err) {
      setErrorMsg("Ndodhi një gabim gjatë hyrjes. Provoni përsëri.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#07110f] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/5 p-8 md:p-10 shadow-2xl backdrop-blur-xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-4xl">🚖</span>
          <h2 className="text-3xl font-black bg-gradient-to-r from-slate-100 to-emerald-400 bg-clip-text text-transparent">
            Fast Transfers
          </h2>
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Hyni në Llogari (Sign In)
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="shembull@email.com"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm text-white outline-none focus:border-[#00D084] focus:bg-white/10 transition"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
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
            {loading ? "Duke u kyçur..." : "Kyçu (Sign In)"}
          </button>
        </form>

        {/* Links */}
        <div className="text-center text-xs text-slate-450 border-t border-white/10 pt-6 space-y-2">
          <p>
            Klient i ri?{" "}
            <span 
              onClick={() => router.push("/signup")} 
              className="text-[#00D084] hover:underline font-bold cursor-pointer"
            >
              Regjistrohu Këtu
            </span>
          </p>
          <p className="text-[10px] text-white/30 font-medium">
            *Llogaritë e shoferëve krijohen vetëm nga administratori.
          </p>
        </div>

      </div>
    </main>
  );
}
